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

let textEditor: vscode.TextEditor | undefined;
let highlightDecorationType: vscode.TextEditorDecorationType;
let vscodeOutputChannel: vscode.OutputChannel;
let panel: vscode.WebviewPanel | undefined = undefined;

let lastSavedFileName: string | undefined;

// Setup websocket server
const wss: WebSocketServer = new WebSocket.Server({ port: 9991 });
let websocket: WebSocket | undefined;

let firstMessages: any[] = [];
let processes: (cp.ChildProcess | undefined)[] = [];

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext): void {
    Settings.readSettingsFile(context);
    vscodeOutputChannel = vscode.window.createOutputChannel("Cabbage output");

    vscodeOutputChannel.show(true); // true means keep focus in the editor window

    console.log('Congratulations, your extension "cabbage" is now active!');

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.expandCabbageJSON', Commands.expandCabbageJSON));

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.formatDocument', Commands.formatDocument));

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.editMode', () => {
        processes.forEach((p) => {
            p?.kill("SIGKILL");
        });
        setCabbageMode("draggable");
        Commands.enterEditMode(panel, websocket);
    }));

    context.subscriptions.push(vscode.commands.registerCommand('cabbage.launch', () => {
        panel = Commands.setupWebViewPanel(context);
        // assign current textEditor so we can track it even if focus changes to the webview
        panel.onDidChangeViewState(() => {
            textEditor = vscode.window.activeTextEditor;
        });

        vscode.workspace.onDidChangeTextDocument((editor) => {
            // sendTextToWebView(editor.document, 'onFileChanged');
        });

        vscode.workspace.onDidSaveTextDocument(async (editor) => {
            setCabbageMode("play");
            lastSavedFileName = editor.fileName;
            await Commands.onDidSave(panel, vscodeOutputChannel, processes, editor, lastSavedFileName);
        });

        vscode.workspace.onDidOpenTextDocument((editor) => {
            ExtensionUtils.sendTextToWebView(editor, 'onFileChanged', panel);
        });

        vscode.window.tabGroups.onDidChangeTabs((tabs) => {
            // triggered when tab changes
        });

        // callback for webview messages - some of these will be fired off from the CabbageApp
        if (panel) {
            panel.webview.onDidReceiveMessage(message => {
                Commands.handleWebviewMessage(
                    message,
                    websocket,
                    firstMessages,
                    panel!,
                    vscodeOutputChannel,
                    textEditor,
                    highlightDecorationType,
                    getCabbageMode(),
                    processes,
                    lastSavedFileName,
                    context  // Add this parameter
                );
            });
        }
    }));
}

// This method is called when your extension is deactivated
export function deactivate() {
	processes.forEach((p) => {
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
