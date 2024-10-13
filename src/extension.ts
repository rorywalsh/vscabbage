// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// @ts-ignore
import { setCabbageMode, getCabbageMode } from './cabbage/sharedState.js';

import * as vscode from 'vscode';
import * as cp from "child_process";
import WebSocket, { Server as WebSocketServer } from 'ws'; // Import WebSocket types
import { Commands } from './commands';
import { ExtensionUtils } from './extensionUtils';
import { Settings } from './settings';


// Setup websocket server
const wss: WebSocketServer = new WebSocket.Server({ port: 9991 });
let websocket: WebSocket | undefined;

let firstMessages: any[] = [];


// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
    Commands.initialize(context);
    Settings.readSettingsFile(context);

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    
    // Set the text and icon for the status bar item
    statusBarItem.text = `$(unmute) Cabbage`;
    
    // Optional: Set a tooltip for the item
    statusBarItem.tooltip = 'Click to activate extension';

    // Optional: Make the status bar item clickable (command)
    statusBarItem.command = 'cabbage.showCommands';

    // Show the status bar item
    statusBarItem.show();

    // Push the item to the context's subscriptions so it gets disposed when the extension is deactivated
    context.subscriptions.push(statusBarItem);

    // Get the output channel from Commands class
    const vscodeOutputChannel = Commands.getOutputChannel();
    vscodeOutputChannel.show(true);

    console.log('Congratulations, your extension "cabbage" is now active!');
    vscodeOutputChannel.appendLine('Cabbage extension is now active!');

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.expandCabbageJSON', Commands.expandCabbageJSON));
    context.subscriptions.push(vscode.commands.registerCommand('cabbage.formatDocument', Commands.formatDocument));
    context.subscriptions.push(vscode.commands.registerCommand('cabbage.editMode', () => {
        Commands.enterEditMode(websocket);
    }));

    vscode.workspace.onDidSaveTextDocument(async (editor) => {
        if (editor.fileName.endsWith('.csd') && await Commands.hasCabbageTags(editor)) {
            setCabbageMode("play");
            if (!Commands.getPanel()) {
                Commands.setupWebViewPanel(context);
            }
            await Commands.onDidSave(editor, context);
        }
    });

    vscode.workspace.onDidOpenTextDocument((editor) => {
        ExtensionUtils.sendTextToWebView(editor, 'onFileChanged', Commands.getPanel());
    });

    vscode.window.tabGroups.onDidChangeTabs((tabs) => {
        // triggered when tab changes
    });

    // callback for webview messages - some of these will be fired off from the CabbageApp
    if (Commands.getPanel()) {
        Commands.getPanel()!.webview.onDidReceiveMessage(message => {
            Commands.handleWebviewMessage(
                message,
                websocket,
                firstMessages,
                vscode.window.activeTextEditor,
                context
            );
        });
    }
}

// This method is called when your extension is deactivated
export function deactivate() {
    Commands.getProcesses().forEach((p) => {
        p?.kill("SIGKILL");
    });
}

// websocket server
wss.on('connection', (ws: WebSocket) => {
    console.log('Client connected');

    // There are times when Cabbage will send messages before the webview is ready to receive them. 
    // So first thing to do is flush the first messages received from Cabbage
    firstMessages.forEach((msg) => {
        console.log(msg);
        ws.send(JSON.stringify(msg));
    });

    firstMessages = [];

    websocket = ws;
    ws.on('message', (message: WebSocket.Data) => {
        const msg = JSON.parse(message.toString());
        console.log(msg);
        if (msg.hasOwnProperty("command")) {
            // When CabbageProcessor first loads, it parses the Cabbage text and populates a vector of JSON objects.
            // These are then sent to the webview for rendering.
            if (msg["command"] === "widgetUpdate") {
                const panel = Commands.getPanel();
                if (panel) {
                    panel.webview.postMessage({ command: "widgetUpdate", channel: msg["channel"], data: msg["data"] });
                }
            }
        }
    });

    ws.on('close', () => {
        console.log('Client disconnected');
    });
});
