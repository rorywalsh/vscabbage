
import * as vscode from 'vscode';
import { formatText } from './formatting';
import WebSocket from 'ws';

export function enterEditMode(panel: vscode.WebviewPanel | undefined, websocket: WebSocket | undefined) {
    if (!panel) {
        return; // Exit if no panel is available
    }

    const msg = { command: "stopCsound" };

    if (websocket) {
        websocket.send(JSON.stringify(msg)); // Send the stop message to the WebSocket
    }
    panel.webview.postMessage({ command: "onEnterEditMode", text: "onEnterEditMode" });
}


export async function formatDocument() {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const text = editor.document.getText();
    const formattedText = formatText(text);  // Your formatting logic

    const edit = new vscode.WorkspaceEdit();
    edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), formattedText);
    await vscode.workspace.applyEdit(edit);
}


