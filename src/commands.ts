import * as vscode from 'vscode';
import { ExtensionUtils } from './extensionUtils';
import WebSocket from 'ws';
let dbg = false;
import * as cp from "child_process";
import os from 'os';

export class Commands {
    static enterEditMode(panel: vscode.WebviewPanel | undefined, 
        websocket: WebSocket | undefined) {
        if (!panel) {
            return; // Exit if no panel is available
        }

        const msg = { command: "stopCsound" };

        if (websocket) {
            websocket.send(JSON.stringify(msg)); // Send the stop message to the WebSocket
        }
        panel.webview.postMessage({ command: "onEnterEditMode", text: "onEnterEditMode" });
    }

    // Function to handle webview messages
    static handleWebviewMessage(
        message: any,
        websocket: any,
        firstMessages: any[],
        panel: vscode.WebviewPanel,
        vscodeOutputChannel: any,
        textEditor: any,
        highlightDecorationType: any,
        cabbageMode: string,
        lastSavedFileName: string | undefined,
        context: vscode.ExtensionContext  // Add this parameter
    ) {
        const config = vscode.workspace.getConfiguration("cabbage");
        console.warn("Received message:", message);
        switch (message.command) {
            case 'widgetUpdate':
                if (cabbageMode !== "play") {
                    ExtensionUtils.updateText(message.text, cabbageMode, vscodeOutputChannel, textEditor, highlightDecorationType, lastSavedFileName, panel);
                }
                break;
    
            case 'widgetStateUpdate': //trigger when webview is open
                firstMessages.push(message);
                websocket.send(JSON.stringify(message));
                break;
    
            case 'cabbageSetupComplete':
                const msg = {
                    command: "cabbageSetupComplete",
                    text: JSON.stringify({})
                };
                firstMessages.push(msg);
                websocket.send(JSON.stringify(msg));
                if (panel) {
                    panel.webview.postMessage({ command: "snapToSize", text: config.get("snapToSize") });
                }
                break;
    
            case 'fileOpen':
                const jsonText = JSON.parse(message.text);
                vscode.window.showOpenDialog({
                    canSelectFiles: true,
                    canSelectFolders: false,
                    canSelectMany: false,
                    openLabel: 'Open',
                    filters: {
                        'Audio files': ['wav', 'ogg', 'mp3', 'FLAC']
                    }
                }).then((fileUri) => {
                    if (fileUri) {
                        const m = {
                            "fileName": fileUri[0].fsPath,
                            "channel": jsonText.channel
                        };
                        const msg = {
                            command: "fileOpenFromVSCode",
                            text: JSON.stringify(m)
                        };
                        websocket.send(JSON.stringify(msg));
                    }
                });
                break;
    
            case 'saveFromUIEditor':
                const document = vscode.workspace.textDocuments.find(doc => doc.fileName === message.lastSavedFileName);
                if (document) {
                    document.save().then(() => {
                        Commands.onDidSave(panel, vscodeOutputChannel, processes, document, message.lastSavedFileName);
                        // Refresh the webview panel
                        panel = Commands.setupWebViewPanel(context);
                    });
                }
                break;

            default:
                if (websocket) {
                    websocket.send(JSON.stringify(message));
                }
        }
    }

    static setupWebViewPanel(context: vscode.ExtensionContext) {
        // Create the webview panel
        const config = vscode.workspace.getConfiguration("cabbage");
        const launchInNewColumn = config.get("launchInNewColumn");
        console.log("launchInNewColumn:", launchInNewColumn);
        // Determine the ViewColumn based on the launchInNewColumn setting
        const viewColumn = launchInNewColumn ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;

        const panel = vscode.window.createWebviewPanel(
            'cabbageUIEditor',
            'Cabbage UI Editor',
            viewColumn, // Use the determined ViewColumn
            { 
                enableScripts: true,
                retainContextWhenHidden: true // Add this line
            }
        );

        // Make sure the editor currently displayed has focus
        vscode.commands.executeCommand('workbench.action.focusNextGroup');
        vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
    
        // Load resources
        const mainJS = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src/cabbage', 'main.js'));
        const styles = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css'));
        const cabbageStyles = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'cabbage.css'));
        const interactJS = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'interact.min.js'));
        const widgetWrapper = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'widgetWrapper.js'));
        const colourPickerJS = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'color-picker.js'));
        const colourPickerStyles = panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'color-picker.css'));
    
        // Set webview HTML content using the provided getWebviewContent function
        panel.webview.html = ExtensionUtils.getWebViewContent(mainJS, styles, cabbageStyles, interactJS, widgetWrapper, colourPickerJS, colourPickerStyles);
    

        // Return the created panel for further use if needed
        return panel;
    }
    
    
    static async onDidSave(panel: vscode.WebviewPanel | undefined, 
        outputChannel: vscode.OutputChannel, 
        processes: any[], 
        document: vscode.TextDocument,
        lastSavedFileName: string | undefined) {
        
        console.log("onDidSave", document.fileName);
        // Update lastSavedFileName regardless of which editor is in focus
        lastSavedFileName = document.fileName;

        if (panel) {
            const config = vscode.workspace.getConfiguration("cabbage");
            const launchInNewColumn = config.get("launchInNewColumn");
            const viewColumn = launchInNewColumn ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;
            
            panel.reveal(viewColumn, true);
            
            // Send a message to the webview to update its state
            panel.webview.postMessage({ 
                command: "onFileChanged", 
                text: "fileChanged", 
                lastSavedFileName: lastSavedFileName 
            });
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
        });

        if (!dbg) {
            if (document.fileName.endsWith(".csd")) {
                // Replace the extension by slicing and concatenating the new extension - we're only interested in opening CSD files

                const process = cp.spawn(command, [document.fileName], {});
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
        if (!editor) {return;}

        const text = editor.document.getText();
        const formattedText = ExtensionUtils.formatText(text);  // Your formatting logic

        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), formattedText);
        await vscode.workspace.applyEdit(edit);
    }


}