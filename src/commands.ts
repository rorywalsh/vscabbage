import * as vscode from 'vscode';
import { ExtensionUtils } from './extensionUtils';
import WebSocket from 'ws';
import * as cp from "child_process";
import os from 'os';
// @ts-ignore
import { setCabbageMode, getCabbageMode } from './cabbage/sharedState.js';
let dbg = false;

export class Commands {
    private static vscodeOutputChannel: vscode.OutputChannel;
    private static processes: (cp.ChildProcess | undefined)[] = [];
    private static lastSavedFileName: string | undefined;
    private static highlightDecorationType: vscode.TextEditorDecorationType;
    private static panel: vscode.WebviewPanel | undefined;

    static initialize(context: vscode.ExtensionContext) {
        if (!this.vscodeOutputChannel) {
            this.vscodeOutputChannel = vscode.window.createOutputChannel("Cabbage output");
        }
        this.highlightDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
        });
    }

    static enterEditMode(websocket: WebSocket | undefined) {
        setCabbageMode("draggable");
        this.processes.forEach((p) => {
            p?.kill("SIGKILL");
        });
        if (this.panel) {
            this.panel.webview.postMessage({ command: 'onEnterEditMode' });
        }
    }

    // Function to handle webview messages
    static async handleWebviewMessage(
        message: any,
        websocket: WebSocket | undefined,
        firstMessages: any[],
        textEditor: vscode.TextEditor | undefined,
        context: vscode.ExtensionContext
    ) {
        const config = vscode.workspace.getConfiguration("cabbage");
        console.warn("Received message:", message);
        switch (message.command) {
            case 'widgetUpdate':
                if (getCabbageMode() !== "play") {
                    ExtensionUtils.updateText(message.text, getCabbageMode(), this.vscodeOutputChannel, textEditor, this.highlightDecorationType, this.lastSavedFileName, this.panel);
                }
                break;
    
            case 'widgetStateUpdate': //trigger when webview is open
                firstMessages.push(message);
                websocket?.send(JSON.stringify(message));
                break;
    
            case 'cabbageSetupComplete':
                const msg = {
                    command: "cabbageSetupComplete",
                    text: JSON.stringify({})
                };
                firstMessages.push(msg);
                websocket?.send(JSON.stringify(msg));
                if (this.panel) {
                    this.panel.webview.postMessage({ command: "snapToSize", text: config.get("snapToSize") });
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
                        websocket?.send(JSON.stringify(msg));
                    }
                });
                break;
    
            case 'saveFromUIEditor':
                let documentToSave: vscode.TextDocument | undefined;

                // First, check for an active text editor
                if (vscode.window.activeTextEditor) {
                    documentToSave = vscode.window.activeTextEditor.document;
                } else {
                    // If no active editor, find the first .csd file among open documents
                    documentToSave = vscode.workspace.textDocuments.find(doc => doc.fileName.endsWith('.csd'));
                }

                if (documentToSave) {
                    try {
                        await documentToSave.save();
                        console.log('File saved successfully:', documentToSave.fileName);
                        
                        // Instead of recreating the panel, just update it
                        if (this.panel) {
                            this.panel.webview.postMessage({ 
                                command: "onFileChanged", 
                                text: "fileSaved", 
                                lastSavedFileName: documentToSave.fileName 
                            });
                        }

                        // Call onDidSave without recreating the panel
                        Commands.onDidSave(documentToSave, context);
                    } catch (error) {
                        console.error('Error saving file:', error);
                        vscode.window.showErrorMessage('Failed to save the file. Please try again.');
                    }
                } else {
                    console.error('No suitable document found to save');
                    vscode.window.showErrorMessage('No .csd file found to save. Please ensure a .csd file is open.');
                }
                break;

            default:
                if (websocket) {
                    websocket.send(JSON.stringify(message));
                }
        }
    }

    static setupWebViewPanel(context: vscode.ExtensionContext) {
        const config = vscode.workspace.getConfiguration("cabbage");
        const launchInNewColumn = config.get("launchInNewColumn");
        // Determine the ViewColumn based on the launchInNewColumn setting
        const viewColumn = launchInNewColumn ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;

        this.panel = vscode.window.createWebviewPanel(
            'cabbageUIEditor',
            'Cabbage UI Editor',
            viewColumn,
            { 
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        // Make sure the editor currently displayed has focus
        vscode.commands.executeCommand('workbench.action.focusNextGroup');
        vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
    
        // Load resources
        const mainJS = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src/cabbage', 'main.js'));
        const styles = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css'));
        const cabbageStyles = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'cabbage.css'));
        const interactJS = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'interact.min.js'));
        const widgetWrapper = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'widgetWrapper.js'));
        const colourPickerJS = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'color-picker.js'));
        const colourPickerStyles = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'color-picker.css'));
    
        // Set webview HTML content
        this.panel.webview.html = ExtensionUtils.getWebViewContent(mainJS, styles, cabbageStyles, interactJS, widgetWrapper, colourPickerJS, colourPickerStyles);

        // Set up message handler for the panel
        this.panel.webview.onDidReceiveMessage(message => {
            this.handleWebviewMessage(message, undefined, [], vscode.window.activeTextEditor, context);
        });

        return this.panel;
    }
    
    static async onDidSave(editor: vscode.TextDocument, context: vscode.ExtensionContext) {
        console.log("onDidSave", editor.fileName);
        this.lastSavedFileName = editor.fileName;

        this.getOutputChannel().appendLine(`Saving file: ${editor.fileName}`);

        if (!this.panel) {
            this.setupWebViewPanel(context);
        }

        if (this.panel) {
            const config = vscode.workspace.getConfiguration("cabbage");
            const launchInNewColumn = config.get("launchInNewColumn");
            const viewColumn = launchInNewColumn ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;
            
            this.panel.reveal(viewColumn, true);
            
            const fileContent = editor.getText();
            
            this.panel.webview.postMessage({ 
                command: "onFileChanged", 
                text: fileContent,
                lastSavedFileName: this.lastSavedFileName 
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
            this.vscodeOutputChannel.append("Found Cabbage service app...")
        } catch (error) {
            // If an error is thrown, it means the path does not exist
            this.vscodeOutputChannel.append(`ERROR: Could not locate Cabbage service app at ${path.fsPath}. Please check the path in the Cabbage extension settings.\n`);
            return;
        }

        this.processes.forEach((p) => {
            p?.kill("SIGKILL");
        });

        if (!dbg) {
            if (editor.fileName.endsWith(".csd")) {
                // Replace the extension by slicing and concatenating the new extension - we're only interested in opening CSD files

                const process = cp.spawn(command, [editor.fileName], {});
                this.processes.push(process);
                process.stdout.on("data", (data: { toString: () => string; }) => {
                    // I've seen spurious 'ANSI reset color' sequences in some csound output
                    // which doesn't render correctly in this context. Stripping that out here.
                    this.vscodeOutputChannel.append(data.toString().replace(/\x1b\[m/g, ""));
                });
                process.stderr.on("data", (data: { toString: () => string; }) => {
                    // It looks like all csound output is written to stderr, actually.
                    // If you want your changes to show up, change this one.
                    this.vscodeOutputChannel.append(data.toString().replace(/\x1b\[m/g, ""));
                });
            } else {
                // If no extension is found or the file name starts with a dot (hidden files), handle appropriately
                console.error('Invalid file name or no extension found');
                this.vscodeOutputChannel.append('Invalid file name or no extension found. Cabbage can only compile .csd file types.');
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

    static async hasCabbageTags(document: vscode.TextDocument): Promise<boolean> {
        const text = document.getText();
        return text.includes('<Cabbage>') && text.includes('</Cabbage>');
    }

    static getPanel(): vscode.WebviewPanel | undefined {
        return this.panel;
    }

    static getProcesses(): (cp.ChildProcess | undefined)[] {
        return this.processes;
    }

    static getOutputChannel(): vscode.OutputChannel {
        if (!this.vscodeOutputChannel) {
            this.vscodeOutputChannel = vscode.window.createOutputChannel("Cabbage output");
        }
        return this.vscodeOutputChannel;
    }
}