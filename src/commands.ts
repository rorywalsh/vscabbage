
import * as vscode from 'vscode';
import { ExtensionUtils } from './extensionUtils';
import WebSocket from 'ws';
let dbg = false;
import * as cp from "child_process";
import os from 'os';

export class Commands {
    static enterEditMode(panel: vscode.WebviewPanel | undefined, websocket: WebSocket | undefined) {
        if (!panel) {
            return; // Exit if no panel is available
        }

        const msg = { command: "stopCsound" };

        if (websocket) {
            websocket.send(JSON.stringify(msg)); // Send the stop message to the WebSocket
        }
        panel.webview.postMessage({ command: "onEnterEditMode", text: "onEnterEditMode" });
    }

    static async onDidSave(panel: vscode.WebviewPanel | undefined, websocket: WebSocket | undefined, outputChannel: vscode.OutputChannel, processes: any[], editor: vscode.TextDocument) {
        //sendTextToWebView(editor, 'onFileChanged');
        if (panel) {
            panel.webview.postMessage({ command: "onFileChanged", text: "fileChanged" })
        }
        else {
            console.error("No panel found");
        }

        let binaryName = '';
        const platform = os.platform();
        if (platform === 'win32') {
            binaryName = `CabbageApp_x64.exe`;
        } else if (platform === 'darwin') {
            binaryName = `CabbageApp.app/Contents/MacOS/CabbageApp`;
        } else {
            console.log('Not implemented yet');
        }

        const config = vscode.workspace.getConfiguration("cabbage");
        const command = config.get("pathToCabbageExecutable") + '/' + binaryName;
        console.log("full command:", command);
        const path = vscode.Uri.file(command);


        try {
            // Attempt to read the directory (or file)
            await vscode.workspace.fs.stat(path);
            outputChannel.append("Found Cabbage service app...")
        } catch (error) {
            // If an error is thrown, it means the path does not exist
            outputChannel.append(`ERROR: Could not locate Cabbage service app at ${path.fsPath}. Please check the path in the Cabbage extension settings.\n`);
            return;
        }

        processes.forEach((p) => {
            p?.kill("SIGKILL");
        })

        if (!dbg) {
            if (editor.fileName.endsWith(".csd")) {
                // Replace the extension by slicing and concatenating the new extension - we're only interested in opening CSD files

                const process = cp.spawn(command, [editor.fileName], {});
                processes.push(process);
                process.stdout.on("data", (data: { toString: () => string; }) => {
                    // I've seen spurious 'ANSI reset color' sequences in some csound output
                    // which doesn't render correctly in this context. Stripping that out here.
                    outputChannel.append(data.toString().replace(/\x1b\[m/g, ""));
                });
                process.stderr.on("data", (data: { toString: () => string; }) => {
                    // It looks like all csound output is written to stderr, actually.
                    // If you want your changes to show up, change this one.
                    outputChannel.append(data.toString().replace(/\x1b\[m/g, ""));
                });
            } else {
                // If no extension is found or the file name starts with a dot (hidden files), handle appropriately
                console.error('Invalid file name or no extension found');
                outputChannel.append('Invalid file name or no extension found. Cabbage can only compile .csd file types.');
            }


        }

    }
    static expandCabbageJSON() {
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

    static async formatDocument() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const text = editor.document.getText();
        const formattedText = ExtensionUtils.formatText(text);  // Your formatting logic

        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), formattedText);
        await vscode.workspace.applyEdit(edit);
    }


}