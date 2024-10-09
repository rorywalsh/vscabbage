
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

export function expandCabbageJSON(){
    const editor = vscode.window.activeTextEditor;
		if (!editor) {
			return; // No open text editor
		}

		const document = editor.document;
		const text = document.getText();

		// Find the <Cabbage> and </Cabbage> tags
		const startTag = '<Cabbage>';
		const endTag = '</Cabbage>';

		const startIndex = text.indexOf(startTag);
		const endIndex = text.indexOf(endTag);

		if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
			vscode.window.showErrorMessage("Cabbage section not found or is invalid.");
			return;
		}

		// Calculate the positions in the document
		const startPos = document.positionAt(startIndex + startTag.length);
		const endPos = document.positionAt(endIndex);

		const range = new vscode.Range(startPos, endPos);
		const cabbageContent = document.getText(range).trim();

		try {
			// Parse the JSON content to ensure it's valid
			const jsonObject = JSON.parse(cabbageContent);

			// Re-stringify the JSON content with formatting (4 spaces for indentation)
			const formattedJson = JSON.stringify(jsonObject, null, 4);

			// Replace the original Cabbage section with the formatted text
			editor.edit(editBuilder => {
				editBuilder.replace(range, '\n' + formattedJson + '\n');
			});

		} catch (error) {
			vscode.window.showErrorMessage("Failed to parse and format JSON content.");
		}
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


