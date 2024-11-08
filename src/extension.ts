// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// @ts-ignore
import { setCabbageMode, getCabbageMode } from './cabbage/sharedState.js';

import * as vscode from 'vscode';
import WebSocket, { Server as WebSocketServer } from 'ws'; // Import WebSocket types
import { Commands } from './commands';
import { ExtensionUtils } from './extensionUtils';
import { Settings } from './settings';


// Setup websocket server
const wss: WebSocketServer = new WebSocket.Server({ port: 9991 });
let websocket: WebSocket | undefined;

let firstMessages: any[] = [];


/**
 * Activates the Cabbage extension, setting up commands, configuration change listeners,
 * and event handlers for saving documents, opening documents, and changing tabs.
 * Also sets up a status bar item and initializes the WebSocket server.
 * 
 * @param context The extension context for managing VS Code subscriptions.
 */
export async function activate(context: vscode.ExtensionContext): Promise<void> {

    Commands.initialize(context);


    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

    // Set the text and icon for the status bar item
    statusBarItem.text = `$(unmute) Cabbage`;

    // Optional: Make the status bar item clickable (command)
    statusBarItem.command = 'cabbage.showCommands';

    // Show the status bar item
    statusBarItem.show();

    // Push the item to the context's subscriptions so it gets disposed when the extension is deactivated
    context.subscriptions.push(statusBarItem);

    // Get the output channel from Commands class
    const vscodeOutputChannel = Commands.getOutputChannel();
    vscodeOutputChannel.show(true);

    vscodeOutputChannel.appendLine('Cabbage extension is now active!');

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.selectSamplingRate', async () => {
        await Settings.selectSamplingRate();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.selectBufferSize', async () => {
        await Settings.selectBufferSize();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.selectAudioOutputDevice', async () => {
        await Settings.selectAudioDevice('output');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.selectAudioInputDevice', async () => {
        await Settings.selectAudioDevice('input');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.selectMidiOutputDevice', async () => {
        await Settings.selectMidiDevice('output');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.selectMidiInputDevice', async () => {
        await Settings.selectMidiDevice('input');
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.setCabbageSourcePath', async () => {
        await Settings.selectCabbageJavascriptSourcePath();
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.setCabbageBinaryPath', async () => {
        await Settings.selectCabbageBinaryPath();
    }));

    const configurationChangeListener = vscode.workspace.onDidChangeConfiguration((event: vscode.ConfigurationChangeEvent) => {
        Settings.updatePath(event);
    });

    // Add the listener to the context subscriptions so it's disposed automatically
    context.subscriptions.push(configurationChangeListener);

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.expandCabbageJSON', Commands.expandCabbageJSON));
    context.subscriptions.push(vscode.commands.registerCommand('cabbage.formatDocument', Commands.formatDocument));
    context.subscriptions.push(vscode.commands.registerCommand('cabbage.editMode', () => {
        Commands.enterEditMode(websocket);
    }));

    /**
     * Event handler triggered when a text document is saved.
     * - Checks if the saved document is a .csd file with Cabbage-specific tags.
     * - Sets Cabbage mode to "play" and ensures the Cabbage webview panel is open if the "showUIOnSave" setting is enabled.
     * - Waits for the WebSocket connection to be ready before handling any messages from the webview.
     * - Listens for messages from the webview and processes them via WebSocket if available.
     * 
     * @param editor The text editor containing the saved document.
     */
    vscode.workspace.onDidSaveTextDocument(async (editor) => {
        if (editor.fileName.endsWith('.csd') && await Commands.hasCabbageTags(editor)) {
            setCabbageMode("play");
            const config = vscode.workspace.getConfiguration('cabbage');
            if (config.get('showUIOnSave')) {
                if (!Commands.getPanel()) {
                    Commands.setupWebViewPanel(context);
                }
            }
            await Commands.onDidSave(editor, context);
            await waitForWebSocket();  // Wait until the WebSocket is ready!
            Commands.getPanel()!.webview.onDidReceiveMessage(message => {
                if (websocket) {
                    Commands.handleWebviewMessage(
                        message,
                        websocket,
                        firstMessages,
                        vscode.window.activeTextEditor,
                        context
                    );
                }
                else {
                    console.warn("websocket is undefined?");
                }
            });
        }
    });

    vscode.workspace.onDidOpenTextDocument((editor) => {
        ExtensionUtils.sendTextToWebView(editor, 'onFileChanged', Commands.getPanel());
    });

    vscode.window.tabGroups.onDidChangeTabs((tabs) => {
        // triggered when tab changes
    });

}

/**
 * Deactivates the Cabbage extension by terminating any active child processes
 * associated with the Commands module. This ensures that all processes are cleaned up
 * when the extension is disabled.
 */
export function deactivate() {
    Commands.getProcesses().forEach((p) => {
        p?.kill("SIGKILL");
    });
}

/**
 * Waits until the WebSocket connection is established and resolves the promise
 * with the WebSocket instance once it is ready. This function is useful to ensure
 * the WebSocket is available before performing operations that depend on it.
 * 
 * @returns A promise that resolves with the WebSocket instance when ready.
 */
function waitForWebSocket(): Promise<WebSocket> {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (websocket) {
                clearInterval(interval);  // Stop checking once websocket is valid
                resolve(websocket);       // Resolve the promise with the WebSocket
            }
        }, 100); // Check every 100 ms
    });
}

//=================================================================================
// websocket server
wss.on('connection', (ws: WebSocket) => {
    console.warn('Client connected');

    // There are times when Cabbage will send messages before the webview is ready to receive them. 
    // So first thing to do is flush the first messages received from Cabbage
    firstMessages.forEach((msg) => {
        ws.send(JSON.stringify(msg));
    });

    firstMessages = [];

    websocket = ws;
    // Listen for messages from the Cabbage service app. These will come whenever the user updates a widgets state from Csound
    ws.on('message', (message: WebSocket.Data) => {
        const msg = JSON.parse(message.toString());
        if (msg.hasOwnProperty("command")) {
            // When CabbageProcessor first loads, it parses the Cabbage text and populates a vector of JSON objects.
            // These are then sent to the webview for rendering.
            if (msg["command"] === "widgetUpdate") {
                const panel = Commands.getPanel();
                if (panel) {
                    if(msg.hasOwnProperty("data")){
                        panel.webview.postMessage({ command: "widgetUpdate", channel: msg["channel"], data: msg["data"] });
                    }
                    else if(msg.hasOwnProperty("value")){
                        panel.webview.postMessage({ command: "widgetUpdate", channel: msg["channel"], value: msg["value"] });
                    }
                }
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});

