// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import * as vscode from 'vscode';
import { ExtensionUtils } from './extensionUtils';
import * as cp from "child_process";
import { Settings } from './settings';
import stringify from 'json-stringify-pretty-compact';
// @ts-ignore
import { setCabbageMode, getCabbageMode, setVSCode } from './cabbage/sharedState.js';
import * as path from 'path';
export let cabbageStatusBarItem: vscode.StatusBarItem;
import fs from 'fs';
import * as xml2js from 'xml2js';
import os from 'os';
// setupWebSocketServer no longer needed - using pipes

/**
 * The Commands class encapsulates the functionalities of the VSCode extension,
 * managing backend communications, document manipulations, UI interactions,
 * and processes related to the Cabbage extension.
 */
export class Commands {
    private static vscodeOutputChannel: vscode.OutputChannel;
    private static portNumber: number = 0;
    private static processes: (cp.ChildProcess | undefined)[] = [];
    private static lastSavedFileName: string | undefined;
    private static highlightDecorationType: vscode.TextEditorDecorationType;
    private static panel: vscode.WebviewPanel | undefined;
    // websocket communication removed; use stdin/stdout pipes via sendMessageToCabbageApp
    private static cabbageServerStarted: boolean | false;
    private static diagnosticCollection: vscode.DiagnosticCollection;
    private static diagnosticCollectionCsound: vscode.DiagnosticCollection;
    private static lastCsoundErrorMessage: string | undefined;
    private static compilationFailed: boolean = false;
    private static panelRevealTimeout: NodeJS.Timeout | undefined;
    private static onEnterPerformanceModeTimeout: NodeJS.Timeout | undefined;
    private static editQueue: Promise<void> = Promise.resolve();
    appendOutput: Boolean = true;

    /**
     * Initializes the Commands class by creating an output channel for logging
     * and setting up the highlight decoration for text editor elements.
     * @param context The extension context provided by VSCode.
     */
    static initialize() {
        if (!this.vscodeOutputChannel) {
            this.vscodeOutputChannel = vscode.window.createOutputChannel("Cabbage output");
        }
        this.highlightDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
        });
        if (!this.diagnosticCollection) {
            this.diagnosticCollection = vscode.languages.createDiagnosticCollection('cabbage-json');
        }
        if (!this.diagnosticCollectionCsound) {
            this.diagnosticCollectionCsound = vscode.languages.createDiagnosticCollection('csound');
        }
    }

    /**
    * Sends a message to CabbageApp via stdin (replaces previous WebSocket-based send)
     * @param message The message object to send
     */
    static sendMessageToCabbageApp(message: any) {
        // Get the most recent process (the running CabbageApp)
        const process = this.processes[this.processes.length - 1];

        if (process && process.stdin && !process.stdin.destroyed) {
            try {
                const jsonString = typeof message === 'string' ? message : JSON.stringify(message);
                process.stdin.write(jsonString + '\n');
            } catch (err) {
                this.vscodeOutputChannel.appendLine(`Error sending message to CabbageApp: ${err}`);
            }
        } else {
            this.vscodeOutputChannel.appendLine('Cannot send message: CabbageApp process not available');
        }
    }


    /**
 * Sends a message to the Cabbage backend to set the specified file as the input channel.
 * Updates the global state with the new file assignment.
 * @param context The extension context provided by VSCode.
 * @param file The file to set as the input channel.
 * @param channel The channel to set the file as input for.
 */
    static async sendFileToChannel(context: vscode.ExtensionContext, file: string, channel: number) {
        // Construct the message to send via stdin
        const m = {
            fileName: file,
            channels: channel,
        };
        const msg = {
            command: "setFileAsInput",
            obj: JSON.stringify(m),
        };

        this.sendMessageToCabbageApp(msg);

        // Retrieve existing soundFileInput state or initialize it as an empty object
        let soundFileInput = context.globalState.get<{ [key: number]: string }>('soundFileInput', {});

        // Special case: If channel 12 is selected, clear previous configurations for channels 1 and 2
        if (channel === 12) {
            await context.globalState.update('soundFileInput', undefined);
            soundFileInput = { 12: file }; // Clear all and set only channel 12
        } else {
            // Regular case: Update or add the file for the specific channel
            // Ensure there are no more than two entries (1 and 2) unless channel 12 is involved
            const validChannels = [1, 2];

            // Check if the file is already assigned to a different channel
            const existingChannelForFile = Object.entries(soundFileInput).find(([_, value]) => value === file);
            if (existingChannelForFile) {
                const [existingChannel] = existingChannelForFile;
                if (Number(existingChannel) !== channel) {
                    // Remove the existing assignment
                    delete soundFileInput[Number(existingChannel)];
                }
            }

            // Assign the new file to the specified channel
            soundFileInput[channel] = file;

            // If a different file was already assigned to this channel, update other channel(s)
            const conflictingEntry = Object.entries(soundFileInput).find(([key, value]) => Number(key) !== channel && value !== file);
            if (conflictingEntry) {
                const [conflictingChannel, conflictingFile] = conflictingEntry;
                if (Number(conflictingChannel) === 1 && channel === 2) {
                    soundFileInput[1] = conflictingFile; // Keep conflicting file on channel 1
                } else if (Number(conflictingChannel) === 2 && channel === 1) {
                    soundFileInput[2] = conflictingFile; // Keep conflicting file on channel 2
                } else {
                    delete soundFileInput[Number(conflictingChannel)]; // Remove if it doesn't fit the logic
                }
            }

            // Filter out invalid channels, allowing only valid ones and channel 12
            soundFileInput = Object.fromEntries(
                Object.entries(soundFileInput).filter(
                    ([key]) => validChannels.includes(Number(key)) || Number(key) === 12
                )
            );
        }

        // Save the updated configuration back to globalState
        await context.globalState.update('soundFileInput', soundFileInput);
    }


    /**
    * Activates edit mode by setting Cabbage mode to "draggable", terminating
    * active processes, and notifying the webview panel.
     */
    static enterEditMode() {
        setCabbageMode("draggable");

        this.sendMessageToCabbageApp({ command: "stopAudio", text: "" });

        if (this.panel) {
            this.panel.webview.postMessage({ command: 'onEnterEditMode' });
        }
    }

    /**
    * Handles incoming messages from the webview and performs actions based
    * on the message type.
    * @param message The message from the webview.
    * @param firstMessages A queue of initial messages to be sent after connection.
    * @param textEditor The active text editor in VSCode.
    * @param context The extension context provided by VSCode.
     */
    static async handleWebviewMessage(
        message: any,
        firstMessages: any[],
        textEditor: vscode.TextEditor | undefined,
        context: vscode.ExtensionContext
    ) {
        const config = vscode.workspace.getConfiguration("cabbage");

        // Compatibility shim: accept legacy 'widgetUpdate' and 'updateWidgetText'
        // and normalize them to 'updateWidgetProps'. This allows gradual
        // migration of webview senders without breaking runtime.
        if (message && (message.command === 'widgetUpdate' || message.command === 'updateWidgetText')) {
            message.command = 'updateWidgetProps';
        }
        switch (message.command) {
            case 'getMediaFiles':
                try {
                    let editor = vscode.window.activeTextEditor?.document;
                    if (!editor) {
                        return; // Exit early if no active editor
                    }

                    let directory = path.join(path.dirname(editor.fileName), 'media');

                    if (!fs.existsSync(directory)) {
                        return; // Exit early if the directory does not exist
                    }

                    // Now `directory` is guaranteed to exist
                    fs.readdir(directory, (err, files) => {
                        if (err) {
                            console.error('Cabbage: Error reading directory:', err);
                            return;
                        }
                        // Send the files back to the WebView
                        if (this.panel) {
                            this.panel.webview.postMessage({
                                command: 'mediaFiles',
                                files: files
                            });
                        }
                    });
                } catch (error) {
                    console.error('Cabbage: Error processing audio files request:', error);
                }

                break;

            case 'removeWidget':
                if (getCabbageMode() !== "play") {
                    const document = await this.getDocumentForEdit(textEditor);
                    if (document) {
                        await this.removeWidgetFromDocument(document, message.channel);
                    }
                }
                break;

            case 'removeWidgets':
                if (getCabbageMode() !== "play") {
                    const document = await this.getDocumentForEdit(textEditor);
                    if (document && message.channels && Array.isArray(message.channels)) {
                        for (const channel of message.channels) {
                            await this.removeWidgetFromDocument(document, channel);
                        }
                    }
                }
                break;

            case 'updateWidgetProps':
                // Webview panels post minimized/validated widget properties under
                // 'updateWidgetProps'. The payload is provided in 'text' (JSON
                // string) and may include an optional 'oldId' for channel remapping.
                if (getCabbageMode() !== "play") {
                    const rawText = message && message.text;
                    console.log('Extension: Received updateWidgetProps from webview:', message && (message.oldId ? `(oldId:${message.oldId}) ` : '') + String(rawText).slice(0, 200));
                    if (typeof rawText === 'string' && rawText !== '' && rawText !== 'undefined') {
                        // Queue the edit to prevent race conditions when multiple updates arrive simultaneously
                        Commands.editQueue = Commands.editQueue.then(async () => {
                            await ExtensionUtils.updateText(rawText, getCabbageMode(), this.vscodeOutputChannel, this.highlightDecorationType, this.lastSavedFileName, this.panel, undefined, 3, message.oldId);
                        }).catch(err => {
                            console.error('Extension: Error processing queued edit:', err);
                        });
                    }
                }
                break;

            /* 'widgetUpdate' is deprecated in favor of 'updateWidgetText'.
               PropertyPanel and other senders should use 'updateWidgetText' which
               sends minimized/validated payloads. The old 'widgetUpdate' path
               has been removed to avoid duplicate handling. */

            case 'removeWidget':
                if (getCabbageMode() !== "play") {
                    const document = await this.getDocumentForEdit(textEditor);
                    if (document) {
                        await this.removeWidgetFromDocument(document, message.channel);
                    }
                }
                break;

            case 'jumpToWidget':
                // Get the panel's title and construct the corresponding file name
                const panelFileName = `${this.panel?.title}.csd`;
                const editor = await ExtensionUtils.findTextEditor(panelFileName);

                if (editor) {
                    ExtensionUtils.jumpToWidgetObject(editor, message.text);
                }
                break;

            case 'widgetStateUpdate':
                firstMessages.push(message);
                this.sendMessageToCabbageApp(message);
                break;

            case 'cabbageSetupComplete':
                console.log("Extension: Received cabbageSetupComplete from webview");
                const msg = {
                    command: "cabbageSetupComplete",
                    text: JSON.stringify({})
                };
                firstMessages.push(msg);
                this.sendMessageToCabbageApp(msg);
                if (this.panel) {
                    this.panel.webview.postMessage({ command: "snapToSize", text: config.get("snapToSize") });
                }
                break;

            case 'cabbageIsReadyToLoad':
                console.log("Extension: Received cabbageIsReadyToLoad from webview");
                this.sendMessageToCabbageApp({
                    command: "initialiseWidgets",
                    text: ""
                });
                break;

            case 'fileOpen':
                const jsonText = JSON.parse(message.obj);
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
                        // Send to webview to update the UI
                        this.panel?.webview.postMessage(msg);
                        // Also send to backend via stdin
                        this.sendMessageToCabbageApp(msg);
                    }
                });
                break;

            case 'channelData':
                // Forward channel string data (e.g., from fileButton) to backend
                this.sendMessageToCabbageApp(message);
                break;

            case 'openUrl':
                const urlData = JSON.parse(message.obj);
                let urlToOpen = urlData.url;

                // If no URL provided, check if file property has a URL or path
                if (!urlToOpen && urlData.file) {
                    // Check if the file property is actually a URL
                    if (urlData.file.startsWith('http://') || urlData.file.startsWith('https://')) {
                        urlToOpen = urlData.file;
                    } else {
                        // It's a file path - construct a file:// URL
                        const path = require('path');
                        const activeEditor = vscode.window.activeTextEditor;
                        if (activeEditor) {
                            const csdDir = path.dirname(activeEditor.document.fileName);
                            const fullPath = path.resolve(csdDir, urlData.file);
                            urlToOpen = vscode.Uri.file(fullPath).toString();
                        }
                    }
                }

                if (urlToOpen) {
                    vscode.env.openExternal(vscode.Uri.parse(urlToOpen));
                } else {
                    vscode.window.showWarningMessage('InfoButton: No URL or file specified');
                }
                break;

            case 'saveFromUIEditor':
                let documentToSave: vscode.TextDocument | undefined;

                // Try to find the document based on the panel title
                if (this.panel && this.panel.title) {
                    const expectedFileName = this.panel.title + '.csd';
                    documentToSave = vscode.workspace.textDocuments.find(doc => doc.fileName.endsWith(expectedFileName));

                    if (!documentToSave) {
                        // If not found in open documents, try to find it in the workspace (though we can only save open docs)
                        // Ideally, the document should be open if the webview is active.
                        console.log(`Cabbage: Could not find open document for ${expectedFileName}`);
                    }
                }

                // Fallback to active editor if it's a CSD file (legacy behavior, or if panel title match fails)
                if (!documentToSave && vscode.window.activeTextEditor && vscode.window.activeTextEditor.document.fileName.endsWith('.csd')) {
                    documentToSave = vscode.window.activeTextEditor.document;
                }

                if (documentToSave) {
                    try {
                        await documentToSave.save();
                        console.log('Cabbage: File saved successfully:', documentToSave.fileName);

                        if (this.panel) {
                            this.panel.webview.postMessage({
                                command: "onFileChanged",
                                text: "fileSaved",
                                lastSavedFileName: documentToSave.fileName
                            });
                        }
                    } catch (error) {
                        console.error('Cabbage: Error saving file:', error);
                        vscode.window.showErrorMessage('Failed to save the file. Please try again.');
                    }
                } else {
                    console.error('Cabbage: No suitable document found to save');
                    const fileName = this.panel ? this.panel.title + '.csd' : 'source file';
                    vscode.window.showErrorMessage(`Could not find source file '${fileName}'. Is the file tab closed?`);
                }
                break;


            case 'getCustomWidgetInfo':
                // Webview is requesting all custom widget information
                try {
                    const customDirs = await ExtensionUtils.getCustomWidgetDirectories();
                    const allWidgets: Array<{ widgetType: string, filename: string, className: string, webviewPath: string }> = [];

                    for (const dir of customDirs) {
                        const widgets = await ExtensionUtils.scanForCustomWidgets(dir);

                        for (const widget of widgets) {
                            // Convert file system path to webview URI
                            const filePath = path.join(dir, widget.filename);
                            const webviewUri = this.panel?.webview.asWebviewUri(vscode.Uri.file(filePath));

                            if (webviewUri) {
                                // Use toString(true) to skip encoding, which prevents %2B instead of +
                                const uriString = webviewUri.toString(true);
                                allWidgets.push({
                                    widgetType: widget.widgetType,
                                    filename: widget.filename,
                                    className: widget.className,
                                    webviewPath: uriString
                                });
                                console.log(`Cabbage: Custom widget ${widget.widgetType} webview path:`, uriString);
                            }
                        }
                    }

                    if (this.panel) {
                        this.panel.webview.postMessage({
                            command: 'customWidgetInfo',
                            widgets: allWidgets
                        });
                    }
                } catch (error) {
                    console.error('Cabbage: Error getting custom widget info:', error);
                    if (this.panel) {
                        this.panel.webview.postMessage({
                            command: 'customWidgetInfo',
                            widgets: []
                        });
                    }
                }
                break;

            case 'getCustomWidgetDirectories':
                // Legacy - kept for compatibility
                try {
                    const customDirs = await ExtensionUtils.getCustomWidgetDirectories();
                    if (this.panel) {
                        this.panel.webview.postMessage({
                            command: 'customWidgetDirectories',
                            directories: customDirs
                        });
                    }
                } catch (error) {
                    console.error('Cabbage: Error getting custom widget directories:', error);
                    if (this.panel) {
                        this.panel.webview.postMessage({
                            command: 'customWidgetDirectories',
                            directories: []
                        });
                    }
                }
                break;

            case 'getWidgetFiles':
                // Legacy - kept for compatibility
                try {
                    const directory = message.directory;
                    if (!directory) {
                        break;
                    }

                    const widgets = await ExtensionUtils.scanForCustomWidgets(directory);
                    if (this.panel) {
                        this.panel.webview.postMessage({
                            command: 'widgetFiles',
                            directory: directory,
                            files: widgets
                        });
                    }
                } catch (error) {
                    console.error('Cabbage: Error scanning for widgets:', error);
                    if (this.panel) {
                        this.panel.webview.postMessage({
                            command: 'widgetFiles',
                            directory: message.directory,
                            files: []
                        });
                    }
                }
                break;

            default:
                console.log('Cabbage: handleWebviewMessage default case, command:', message.command);
                // Forward the message to CabbageApp via stdin
                this.sendMessageToCabbageApp(message);
                console.log('Cabbage: Message sent to CabbageApp via stdin', message);
        }
    }

    static createStatusBarIcon(context: vscode.ExtensionContext) {
        if (!cabbageStatusBarItem) {
            cabbageStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);

            // Set the text and icon for the status bar item
            cabbageStatusBarItem.text = `$(mute) Run Cabbage`;

            // Optional: Make the status bar item clickable (command)
            cabbageStatusBarItem.command = 'cabbage.manageServer';

            // Show the status bar item
            cabbageStatusBarItem.show();

            // Push the item to the context's subscriptions so it gets disposed when the
            // extension is deactivated
            context.subscriptions.push(cabbageStatusBarItem);
        }
    }


    /**
     * Gets the last saved file name.
     * @returns The last saved file name.
     */
    static getCurrentFileName() {
        return Commands.lastSavedFileName;
    }

    static async jumpToWidget() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }
        const position = editor.selection.active; // Get the current cursor position
        const word = ExtensionUtils.getWordAtPosition(editor, position); // Use Commands to extract the word at the cursor
        if (word) {
            ExtensionUtils.jumpToWidgetObject(editor, word);
        } else {
            vscode.window.showErrorMessage("No word found at the current cursor position.");
        }


    }
    /**
     * Sets up the Cabbage UI editor webview panel and loads necessary resources.
     * @param context The extension context provided by VSCode.
     * @returns The created webview panel.
     */
    static async setupWebViewPanel(context: vscode.ExtensionContext) {
        const config = vscode.workspace.getConfiguration("cabbage");
        const launchInNewColumn = config.get<string>("launchInNewColumn") || "Active";

        // Map the setting value to VS Code ViewColumn
        let viewColumn: vscode.ViewColumn;
        switch (launchInNewColumn) {
            case "One":
                viewColumn = vscode.ViewColumn.One;
                break;
            case "Two":
                viewColumn = vscode.ViewColumn.Two;
                break;
            case "Three":
                viewColumn = vscode.ViewColumn.Three;
                break;
            case "Beside":
                viewColumn = vscode.ViewColumn.Beside;
                break;
            case "Active":
            default:
                viewColumn = vscode.ViewColumn.Active;
                break;
        }

        setVSCode(vscode);
        // Extract the directory path
        const fullPath = vscode.window.activeTextEditor?.document.uri.fsPath;
        const directoryPath = fullPath ? path.dirname(fullPath) : '';
        const fileName = fullPath ? path.basename(fullPath, path.extname(fullPath)) : '';

        const localResources = [
            vscode.Uri.file(path.join(context.extensionPath, 'media')),
            vscode.Uri.file(path.join(context.extensionPath, 'src'))
        ];

        if (fs.existsSync(path.join(directoryPath, 'media'))) {
            localResources.push(vscode.Uri.file(path.join(directoryPath, 'media')));
        }

        // Add custom widget directories to local resource roots
        // Note: getCustomWidgetDirectories returns paths to cabbage/widgets subdirectories,
        // but we need to add the root custom folder to localResourceRoots so the webview
        // can access the entire cabbage folder structure with relative imports
        console.log('Cabbage: Getting custom widget directories...');
        try {
            const customWidgetDirs = await ExtensionUtils.getCustomWidgetDirectories();
            console.log('Cabbage: Custom widget directories:', customWidgetDirs);
            for (const widgetsDir of customWidgetDirs) {
                // Go up two levels: from cabbage/widgets to the root custom folder
                const customRootDir = path.dirname(path.dirname(widgetsDir));
                console.log('Cabbage: Adding custom root directory to localResourceRoots:', customRootDir);
                if (fs.existsSync(customRootDir)) {
                    const uri = vscode.Uri.file(customRootDir);
                    localResources.push(uri);
                    console.log('Cabbage: Added custom root directory to localResourceRoots:', uri.toString());
                } else {
                    console.warn('Cabbage: Custom root directory does not exist:', customRootDir);
                }
            }
        } catch (error) {
            console.error('Cabbage: Error adding custom widget directories:', error);
        }

        console.log('Cabbage: All local resource roots:', localResources.map(r => r.toString()));

        this.panel = vscode.window.createWebviewPanel(
            'cabbageUIEditor',
            fileName,
            viewColumn,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: localResources
            }
        );

        if (this.panel.webview.options.localResourceRoots) {
            this.panel.webview.options.localResourceRoots.forEach((uri) => {
                if (this.panel) {
                    console.warn('Cabbage: Local resource roots:', this.panel.webview.asWebviewUri(uri));
                }
            });
        }

        // console.error('Cabbage: Local resource roots:', this.panel.webview.options.localResourceRoots);

        // Handle panel disposal
        this.panel.onDidDispose(async () => {
            this.sendMessageToCabbageApp({ command: "stopAudio", text: "" });
            this.panel = undefined;
            // Note: stdout handlers already check if panel exists before posting messages,
            // so no additional cleanup is needed. The Csound process continues running.
        }, null, context.subscriptions);

        vscode.commands.executeCommand('workbench.action.focusNextGroup');
        vscode.commands.executeCommand('workbench.action.focusPreviousGroup');

        const mainJS = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src/cabbage', 'main.js'));
        const styles = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css'));
        const cabbageStyles = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'cabbage.css'));
        const interactJS = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'interact.min.js'));
        const widgetWrapper = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'widgetWrapper.js'));
        const colourPickerJS = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'color-picker.js'));
        const colourPickerStyles = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'color-picker.css'));
        const propertyPanelStyles = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'propertyPanel.css'));

        // Detect current VS Code theme
        const isDarkTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
            vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;

        // Get property panel position from settings
        const cabbageConfig = vscode.workspace.getConfiguration('cabbage');
        const propertyPanelPosition = cabbageConfig.get<string>('propertyPanelPosition', 'right');

        this.panel.webview.html = ExtensionUtils.getWebViewContent(mainJS, styles, cabbageStyles, interactJS, widgetWrapper, colourPickerJS, colourPickerStyles, propertyPanelStyles, isDarkTheme, propertyPanelPosition);
        return this.panel;

    }

    /**
     * Starts or Stop the Cabbage server app
     * @param shouldStart
     * 
     */
    static async startCabbageServer(shouldStart: boolean) {

        if (shouldStart) {
            this.startCabbageProcess();
            cabbageStatusBarItem.text = `$(unmute) Stop Cabbage`;
            cabbageStatusBarItem.show();
            this.cabbageServerStarted = true;
            vscode.window.showInformationMessage('Cabbage server started');

            this.getOutputChannel().appendLine('   _____      _     _                      ');
            this.getOutputChannel().appendLine('  / ____|    | |   | |                     ');
            this.getOutputChannel().appendLine(' | |     __ _| |__ | |__   __ _  __ _  ___ ');
            this.getOutputChannel().appendLine(' | |    / _` | \'_ \\| \'_ \\ / _` |/ _` |/ _ \\');
            this.getOutputChannel().appendLine(' | |___| (_| | |_) | |_) | (_| | (_| |  __/');
            this.getOutputChannel().appendLine('  \\_____\\__,_|_.__/|_.__/ \\__,_|\\__, |\\___|');
            this.getOutputChannel().appendLine('                                 __/ |     ');
            this.getOutputChannel().appendLine('                                |___/      ');
            this.getOutputChannel().appendLine('────────────────────────────────────────────────────────────');
            this.getOutputChannel().appendLine(' Cabbage server started successfully.');
            this.getOutputChannel().appendLine(' • To run an instrument: open a .csd file and hit Save.');
            this.getOutputChannel().appendLine(' • To stop the server: click the Cabbage icon in the status bar.');
            this.getOutputChannel().appendLine(' • All Cabbage extension commands can be accessed through the Command');
            this.getOutputChannel().appendLine('   Palette (Ctrl+Shift+P / Cmd+Shift+P).');
            this.getOutputChannel().appendLine('────────────────────────────────────────────────────────────');
            this.getOutputChannel().appendLine('');



        } else {
            this.processes.forEach((p) => {
                return ExtensionUtils.terminateProcess(p);
            });

            cabbageStatusBarItem.text = `$(mute) Run Cabbage`;
            cabbageStatusBarItem.show();
            this.cabbageServerStarted = false;
            vscode.window.showInformationMessage('Cabbage server stopped');
        }
    }

    /**
     * Wraps a function in a toggle server on/off method
     * @param action : function to call on either side of toggle
     */
    static async withServerRestart(action: () => Promise<void>) {
        const wasRunning = this.hasCabbageServerStarted();
        if (wasRunning) {
            await this.startCabbageServer(false);
        }

        await action();

        if (wasRunning) {
            // Slight delay to let settings settle, if needed
            await new Promise(resolve => setTimeout(resolve, 1000));
            await this.startCabbageServer(true);
        }
    }
    /**
     * Manages the Cabbage server - checking permissions before running
     * @returns 
     */
    static async manageServer() {
        const command = Settings.getCabbageBinaryPath('CabbageApp');

        // Check and update file permissions if necessary (macOS only)
        if (process.platform === 'darwin') {
            try {
                const stats = fs.statSync(command);
                if (!(stats.mode & fs.constants.X_OK)) {
                    fs.chmodSync(command, '755');
                    this.vscodeOutputChannel.append(`Updated permissions for Cabbage binary: ${command}\n`);
                }
            } catch (error) {
                this.vscodeOutputChannel.append(`Failed to update permissions for Cabbage binary: ${command}\n. It does appear to be executable.`);
            }
        }

        const cabbagePath = vscode.Uri.file(command);

        try {
            await vscode.workspace.fs.stat(cabbagePath);
        } catch (error) {
            this.vscodeOutputChannel.append(`ERROR: No Cabbage binary found at ${command}. Please set the binary path from the command palette.\n`);
            this.setCabbageSrcDirectoryIfEmpty();
            return;
        }

        const shouldStart = !this.cabbageServerStarted;
        await this.startCabbageServer(shouldStart);
    }

    /**
     * Event handler for saving a .csd document, sets up the Cabbage editor panel if needed
     * and starts the Cabbage process if the document is a valid .csd file.
     * @param editor The VSCode document being saved.
     * @param context The extension context provided by VSCode.
     */
    static async onDidSave(editor: vscode.TextDocument, context: vscode.ExtensionContext) {
        this.compilationFailed = false;
        console.log("Cabbage: onDidSave", editor.fileName);

        // Check if file needs .csd extension
        let finalFileName = editor.fileName;
        if (!editor.fileName.endsWith('.csd') && await this.hasCabbageTags(editor)) {
            const newFileName = editor.fileName + '.csd';
            try {
                // Rename the file
                await vscode.workspace.fs.rename(
                    vscode.Uri.file(editor.fileName),
                    vscode.Uri.file(newFileName)
                );

                // Open the renamed file
                const newDocument = await vscode.workspace.openTextDocument(newFileName);
                await vscode.window.showTextDocument(newDocument);

                finalFileName = newFileName;
                vscode.window.showInformationMessage(`File renamed to ${path.basename(newFileName)}`);
            } catch (error) {
                console.error('Failed to rename file to .csd:', error);
            }
        }

        this.lastSavedFileName = finalFileName;
        this.getOutputChannel().appendLine(`Saving file: ${finalFileName}`);

        const config = vscode.workspace.getConfiguration("cabbage");

        if (this.panel) {
            const fileContent = editor.getText();

            // Validate Cabbage JSON before sending to webview
            const textEditor = vscode.window.visibleTextEditors.find(ed => ed.document === editor);
            const isValid = ExtensionUtils.validateCabbageJSON(editor, textEditor);
            if (!isValid) {
                return; // Don't send to webview if JSON is invalid
            }

            // Map the setting value to VS Code ViewColumn
            const launchInNewColumn = config.get<string>("launchInNewColumn") || "Active";
            let viewColumn: vscode.ViewColumn;
            switch (launchInNewColumn) {
                case "One":
                    viewColumn = vscode.ViewColumn.One;
                    break;
                case "Two":
                    viewColumn = vscode.ViewColumn.Two;
                    break;
                case "Three":
                    viewColumn = vscode.ViewColumn.Three;
                    break;
                case "Beside":
                    viewColumn = vscode.ViewColumn.Beside;
                    break;
                case "Active":
                default:
                    viewColumn = vscode.ViewColumn.Active;
                    break;
            }

            // Clear previous Csound diagnostics before compilation
            this.diagnosticCollectionCsound.clear();

            this.panel.webview.postMessage({
                command: "onFileChanged",
                text: fileContent,
                lastSavedFileName: finalFileName
            });            // Also send the file change notification to CabbageApp
            console.log("Extension: Sending onFileChanged to backend for file:", finalFileName);
            this.sendMessageToCabbageApp({
                command: "onFileChanged",
                lastSavedFileName: finalFileName
            });

            // Wait a bit for compilation to start and check for immediate errors
            // If no errors after this delay, then reveal the panel
            setTimeout(() => {
                console.log(`Cabbage: Checking compilation status after delay, compilationFailed=${this.compilationFailed}`);
                if (this.panel && !this.compilationFailed) {
                    console.log('Cabbage: No errors detected, revealing panel');
                    this.panel.reveal(viewColumn, false);

                    // Also send onEnterPerformanceMode message
                    setTimeout(() => {
                        if (this.panel && !this.compilationFailed) {
                            console.log('Cabbage: Sending onEnterPerformanceMode message');
                            this.panel.webview.postMessage({
                                command: "onEnterPerformanceMode",
                                text: ""
                            });
                        }
                    }, 100);
                } else {
                    console.log('Cabbage: Errors detected, not revealing panel');

                    // Print diagnostic errors to console
                    const cabbageDiagnostics = this.diagnosticCollection.get(editor.uri);
                    const csoundDiagnostics = this.diagnosticCollectionCsound.get(editor.uri);

                    if (cabbageDiagnostics && cabbageDiagnostics.length > 0) {
                        console.log('Cabbage: Cabbage JSON diagnostics:');
                        cabbageDiagnostics.forEach(diagnostic => {
                            console.log(`  ${diagnostic.severity === 0 ? 'Error' : 'Warning'}: ${diagnostic.message} at line ${diagnostic.range.start.line + 1}`);
                        });
                    }

                    if (csoundDiagnostics && csoundDiagnostics.length > 0) {
                        console.log('Cabbage: Csound diagnostics:');
                        csoundDiagnostics.forEach(diagnostic => {
                            console.log(`  ${diagnostic.severity === 0 ? 'Error' : 'Warning'}: ${diagnostic.message} at line ${diagnostic.range.start.line + 1}`);
                        });
                    }

                    console.log(`Cabbage: compilationFailed flag: ${this.compilationFailed}`);
                }
            }, 100); // Wait 300ms for compilation to start and errors to appear
        } else {
            // No existing panel, validate first before creating one
            const fileContent = editor.getText();

            // Validate Cabbage JSON before creating webview
            const textEditor = vscode.window.visibleTextEditors.find(ed => ed.document === editor);
            const isValid = ExtensionUtils.validateCabbageJSON(editor, textEditor);
            if (!isValid) {
                return; // Don't create webview if JSON is invalid
            }

            // Validation passed, now create the panel
            await this.setupWebViewPanel(context);

            // Get the panel reference after setup (TypeScript doesn't know setupWebViewPanel sets this.panel)
            const panel = this.panel as unknown as vscode.WebviewPanel;
            if (panel) {
                // Map the setting value to VS Code ViewColumn
                const launchInNewColumn = config.get<string>("launchInNewColumn") || "Active";
                let viewColumn: vscode.ViewColumn;
                switch (launchInNewColumn) {
                    case "One":
                        viewColumn = vscode.ViewColumn.One;
                        break;
                    case "Two":
                        viewColumn = vscode.ViewColumn.Two;
                        break;
                    case "Three":
                        viewColumn = vscode.ViewColumn.Three;
                        break;
                    case "Beside":
                        viewColumn = vscode.ViewColumn.Beside;
                        break;
                    case "Active":
                    default:
                        viewColumn = vscode.ViewColumn.Active;
                        break;
                }

                // Clear previous Csound diagnostics before compilation
                this.diagnosticCollectionCsound.clear();

                panel.webview.postMessage({
                    command: "onFileChanged",
                    text: fileContent,
                    lastSavedFileName: finalFileName
                });            // Also send the file change notification to CabbageApp
                console.log("Extension: Sending onFileChanged to backend for file:", finalFileName);
                this.sendMessageToCabbageApp({
                    command: "onFileChanged",
                    lastSavedFileName: finalFileName
                });

                // Wait a bit for compilation to start and check for immediate errors
                // If no errors after this delay, then reveal the panel
                setTimeout(() => {
                    console.log(`Cabbage: Checking compilation status after delay, compilationFailed=${this.compilationFailed}`);
                    if (this.panel && !this.compilationFailed) {
                        console.log('Cabbage: No errors detected, revealing panel');
                        this.panel.reveal(viewColumn, false);

                        // Also send onEnterPerformanceMode message
                        setTimeout(() => {
                            if (this.panel && !this.compilationFailed) {
                                console.log('Cabbage: Sending onEnterPerformanceMode message');
                                this.panel.webview.postMessage({
                                    command: "onEnterPerformanceMode",
                                    text: ""
                                });
                            }
                        }, 100);
                    } else {
                        console.log('Cabbage: Errors detected, not revealing panel');
                    }
                }, 200); // Wait 200ms for compilation to start and errors to appear
            }
        }

        this.setCabbageSrcDirectoryIfEmpty();
    }

    /**
     * Filters large JSON payloads from log output to prevent performance issues.
     * If the message is a large JSON object/array, returns a summary instead.
     * @param message The message to potentially filter
     * @param source Optional source identifier for debugging
     * @returns The original message or a summary if it's a large JSON payload
     */
    private static filterLargeJson(message: string, source?: string): string {
        const MAX_LOG_LENGTH = 500; // characters
        if (message.length > MAX_LOG_LENGTH) {
            const trimmed = message.trim();
            // Check if it looks like JSON
            if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                const sourceInfo = source ? ` from ${source}` : '';
                const preview = trimmed.substring(0, 100).replace(/\n/g, ' ');
                return `[Large JSON payload suppressed${sourceInfo}: ${message.length} bytes]\nPreview: ${preview}...`;
            }
        }
        return message;
    }

    /**
     * Start Cabbage Server as a background process
     * Uses stdin/stdout pipes for communication instead of WebSocket
     * @returns 
     */
    static async startCabbageProcess() {
        const command = Settings.getCabbageBinaryPath('CabbageApp');

        // Spawn CabbageApp without port number - it will use stdin/stdout pipes
        const process = cp.spawn(command, [], {
            stdio: ['pipe', 'pipe', 'pipe'] // stdin, stdout, stderr
        });

        // Store stdout buffer for JSON line parsing
        let stdoutBuffer = '';
        // Keep a small recent-lines buffer so we can inspect context that
        // appeared before an error line (Csound sometimes emits the useful
        // info in prior lines).
        let recentLines: string[] = [];
        const MAX_RECENT = 12;

        // this.vscodeOutputChannel.clear();
        process.on('error', (err) => {
            this.vscodeOutputChannel.appendLine('=== CABBAGE PROCESS ERROR ===');
            this.vscodeOutputChannel.appendLine(`Error name: ${err.name}`);
            this.vscodeOutputChannel.appendLine(`Error message: ${err.message}`);
            this.vscodeOutputChannel.appendLine(`Error code: ${(err as any).code || 'unknown'}`);
            this.vscodeOutputChannel.appendLine(`Error errno: ${(err as any).errno || 'unknown'}`);
            this.vscodeOutputChannel.appendLine(`Error syscall: ${(err as any).syscall || 'unknown'}`);
            this.vscodeOutputChannel.appendLine(`Command: ${command}`);
            this.vscodeOutputChannel.appendLine(`Arguments: --startTestServer=false`);
            if (err.stack) {
                this.vscodeOutputChannel.appendLine('Error stack:');
                this.vscodeOutputChannel.appendLine(err.stack);
            }
            this.vscodeOutputChannel.appendLine('=== END ERROR ===');
            this.vscodeOutputChannel.show(true);
            const index = this.processes.indexOf(process);
            if (index > -1) {
                this.processes.splice(index, 1);
            }
        });

        process.on('exit', (code, signal) => {
            const index = this.processes.indexOf(process);
            if (index > -1) {
                this.processes.splice(index, 1);
            }

            this.vscodeOutputChannel.appendLine('=== CABBAGE PROCESS EXIT ===');
            this.vscodeOutputChannel.appendLine(`Exit code: ${code}`);
            this.vscodeOutputChannel.appendLine(`Signal: ${signal || 'none'}`);
            this.vscodeOutputChannel.appendLine(`Process ID: ${process.pid}`);
            this.vscodeOutputChannel.appendLine(`Command: ${command}`);

            if (signal) {
                this.vscodeOutputChannel.appendLine(`Signal details:`);
                switch (signal) {
                    case 'SIGTERM':
                        this.vscodeOutputChannel.appendLine('  - SIGTERM (15): Process was asked to terminate gracefully');
                        break;
                    case 'SIGKILL':
                        this.vscodeOutputChannel.appendLine('  - SIGKILL (9): Process was forcefully killed');
                        break;
                    case 'SIGPIPE':
                        this.vscodeOutputChannel.appendLine('  - SIGPIPE (13): Broken pipe - likely trying to write to closed connection');
                        this.vscodeOutputChannel.appendLine('  - This often indicates pipe communication issues or invalid widget configurations');
                        break;
                    case 'SIGABRT':
                        this.vscodeOutputChannel.appendLine('  - SIGABRT (6): Process aborted - likely due to assertion failure or critical error');
                        break;
                    case 'SIGSEGV':
                        this.vscodeOutputChannel.appendLine('  - SIGSEGV (11): Segmentation fault - memory access violation');
                        break;
                    default:
                        this.vscodeOutputChannel.appendLine(`  - Signal ${signal}: Check system documentation for details`);
                }
            }

            if (code !== null) {
                if (code === 0) {
                    this.vscodeOutputChannel.appendLine('Cabbage server terminated successfully.');
                } else if (code === 3221225785) {
                    this.vscodeOutputChannel.appendLine('Exit code indicates missing or incompatible library - is Csound installed?');
                } else {
                    this.vscodeOutputChannel.appendLine(`Cabbage server terminated with non-zero exit code: ${code}`);
                }
            }

            this.vscodeOutputChannel.appendLine('=== END EXIT ===');
            this.vscodeOutputChannel.show(true);
        });

        this.processes.push(process);

        // Handle stdout - parse JSON messages from CabbageApp
        process.stdout.on("data", async (data: Buffer) => {
            const ignoredTokens = ['RtApi', 'MidiIn', 'iplug::', 'RtAudio', 'RtApiCore', 'RtAudio '];
            const dataString = data.toString();

            // Add to buffer
            stdoutBuffer += dataString;

            // Process complete JSON lines
            let newlineIndex;
            while ((newlineIndex = stdoutBuffer.indexOf('\n')) !== -1) {
                const line = stdoutBuffer.substring(0, newlineIndex).trim();
                stdoutBuffer = stdoutBuffer.substring(newlineIndex + 1);

                // Track recent non-warning lines for richer context when parsing errors
                if (!/^\s*(deprecated|warning)\b[:]?/i.test(line)) {
                    recentLines.push(line);
                    if (recentLines.length > MAX_RECENT) recentLines.shift();
                }

                if (!line) {
                    continue;
                }

                // Check if this is a JSON message from CabbageApp
                if (line.startsWith('CABBAGE_JSON:')) {
                    // Extract the JSON part after the prefix
                    const jsonString = line.substring('CABBAGE_JSON:'.length);
                    try {
                        const msg = JSON.parse(jsonString);

                        // Handle widget update messages
                        if (msg.hasOwnProperty('command')) {
                            if (msg['command'] === 'widgetUpdate') {
                                const panel = Commands.getPanel();
                                if (panel) {
                                    if (msg.hasOwnProperty('data')) {
                                        let channel = msg['channel'];
                                        if (channel === null && msg['data']) {
                                            try {
                                                const parsed = JSON.parse(msg['data']);
                                                channel = parsed.id || (parsed.channels && parsed.channels.length > 0 && parsed.channels[0].id);
                                            } catch (e) {
                                                console.error('Failed to parse data for channel:', e);
                                            }
                                        }
                                        panel.webview.postMessage({
                                            command: 'widgetUpdate',
                                            channel: channel,
                                            widgetJson: msg['data'],
                                            currentCsdPath: Commands.getCurrentFileName(),
                                        });
                                    } else if (msg.hasOwnProperty('value')) {
                                        panel.webview.postMessage({
                                            command: 'widgetUpdate',
                                            id: msg['id'],
                                            channel: msg['channel'],
                                            value: msg['value'],
                                            currentCsdPath: Commands.getCurrentFileName(),
                                        });
                                    }
                                }
                            }
                            else if (msg['command'] === 'failedToCompile') {
                                console.log("Extension: Received failedToCompile from backend");
                                // Handle panel disposal
                                let panel = Commands.getPanel();
                                if (panel) {
                                    panel.dispose();
                                    panel = undefined;
                                }
                            }
                        }
                    } catch (e) {
                        // Failed to parse JSON - log the error
                        // this.vscodeOutputChannel.appendLine(`Error parsing JSON message: ${e}`);
                        // this.vscodeOutputChannel.appendLine(`Raw message: ${jsonString}`);
                    }
                } else {
                    // Not a JSON message - treat as regular log output
                    if (!ignoredTokens.some(token => line.startsWith(token))) {
                        if (line.startsWith('DEBUG:')) {
                            // Only show DEBUG lines if verbose logging is enabled
                            if (vscode.workspace.getConfiguration("cabbage").get("logVerbose")) {
                                this.vscodeOutputChannel.appendLine(line);
                            }
                        } else if (line.startsWith('INFO:')) {
                            // Show INFO lines with the INFO: prefix removed
                            const msg = line.replace('INFO:', '').trim();
                            this.vscodeOutputChannel.appendLine(msg);
                        } else {
                            // Show other messages as-is (Csound output, etc.)
                            // Check for parsing failure and close panel if needed
                            if (line.includes('Parsing failed due to syntax errors')) {
                                if (this.panel) {
                                    this.panel.dispose();
                                    this.panel = undefined;
                                }
                            }
                            // This is for debugging
                            // console.log(`Cabbage: Processing line: "${line}"`);
                            // If the line begins with a warning or deprecation message,
                            // ignore it for error diagnostics. This avoids confusing
                            // earlier warning lines with later, real errors.
                            if (/^\s*(deprecated|warning)\b[:]?/i.test(line)) {
                                this.vscodeOutputChannel.appendLine(this.filterLargeJson(line, 'stdout-warning'));
                                continue;
                            }

                            // Simple error detection: if line contains "error" or "unable to find opcode"
                            if (line.toLowerCase().includes('error') || /unable to find opcode/i.test(line)) {
                                this.compilationFailed = true;
                                this.lastCsoundErrorMessage = line;

                                // Look for line number in two places:
                                // 1. In the current error line itself: "error: message, line 71"
                                // 2. On the next line: "line 512:"
                                let lineNumber: number | undefined;
                                let errorMessage = line;

                                // First check if the error line itself contains ", line XXX"
                                const inlineMatch = line.match(/,\s*line\s+(\d+)/i);
                                if (inlineMatch) {
                                    lineNumber = parseInt(inlineMatch[1], 10);
                                    errorMessage = line; // Already contains the line number
                                } else {
                                    // Check the next few lines for "line XXX:" pattern
                                    let tempBuf = stdoutBuffer;
                                    for (let i = 0; i < 5; i++) {
                                        const nl = tempBuf.indexOf('\n');
                                        if (nl === -1) break;
                                        const nextLine = tempBuf.substring(0, nl).trim();
                                        tempBuf = tempBuf.substring(nl + 1);

                                        // Look for "line 512:" pattern or "line 512" at end of line
                                        const lineMatch = nextLine.match(/^line\s*(\d+)\s*:?/i) || nextLine.match(/,\s*line\s+(\d+)/i);
                                        if (lineMatch) {
                                            lineNumber = parseInt(lineMatch[1], 10);
                                            errorMessage += ` (line ${lineNumber})`;
                                            break;
                                        }
                                    }
                                }

                                // Create diagnostic
                                try {
                                    if (lineNumber !== undefined) {
                                        // We found a line number - create diagnostic on that line
                                        const targetDoc = this.lastSavedFileName;
                                        if (targetDoc) {
                                            const uri = vscode.Uri.file(targetDoc);
                                            let document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === targetDoc);
                                            if (!document) {
                                                document = await vscode.workspace.openTextDocument(uri);
                                            }

                                            // Convert to 0-based and clamp to document bounds
                                            const lineIdx = Math.min(Math.max(lineNumber - 1, 0), document.lineCount - 1);
                                            const lineObj = document.lineAt(lineIdx);
                                            const range = new vscode.Range(lineIdx, 0, lineIdx, lineObj.text.length);

                                            const diagnostic = new vscode.Diagnostic(
                                                range,
                                                errorMessage,
                                                vscode.DiagnosticSeverity.Error
                                            );

                                            this.diagnosticCollectionCsound.set(uri, [diagnostic]);
                                        }
                                    }
                                } catch (err) {
                                    console.log('Cabbage: Error creating diagnostic:', err);
                                }

                                // Dispose panel on error
                                if (this.panel) {
                                    this.panel.dispose();
                                    this.panel = undefined;
                                }
                            }
                            this.vscodeOutputChannel.appendLine(this.filterLargeJson(line, 'stdout-error'));
                        }
                    }
                }
            }
        });

        process.stderr.on("data", (data: { toString: () => string; }) => {
            const dataString = data.toString();

            // Filter out large JSON messages to prevent output window spam
            // (e.g., waveform arrays being sent to stderr for debugging)
            const MAX_LOG_LENGTH = 500; // characters
            if (dataString.length > MAX_LOG_LENGTH) {
                // Check if it looks like JSON
                const trimmed = dataString.trim();
                if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
                    (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
                    // It's likely a large JSON payload - log a summary instead
                    this.vscodeOutputChannel.appendLine(
                        `[Large JSON payload suppressed: ${dataString.length} bytes]`
                    );
                    return;
                }
            }

            // Show stderr output (errors, warnings) - filter large JSON
            this.vscodeOutputChannel.appendLine(this.filterLargeJson(dataString, 'stderr'));
        });
        this.cabbageServerStarted = true;

        // No longer need setupWebSocketServer - we're using pipes now
        // Send initial message to CabbageApp via stdin to initialize
        const lastProcess = this.processes[this.processes.length - 1];
        if (lastProcess && lastProcess.stdin) {
            const initMsg = { command: 'initialiseWidgets' };
            lastProcess.stdin.write(JSON.stringify(initMsg) + '\n');
        }
    }
    /**
     * Updates, or at least tries, old Cabbage syntax to JSON
     * @returns 
     */
    static async updateCodeToJSON() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return;
        }

        // Call the new method in ExtensionUtils
        await ExtensionUtils.convertCabbageCodeToJSON(editor);
    }

    /**
     * Adds a new widget to the Cabbage JSON content in the active editor.
     */
    static async addCabbageSection() {
        Commands.getOutputChannel().appendLine('Adding Cabbage section');
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            Commands.getOutputChannel().appendLine('No active editor found');
            return;
        }

        const document = editor.document;
        const config = vscode.workspace.getConfiguration('cabbage');
        const cabbageSectionPosition = config.get('cabbageSectionPlacement', 'top');

        const warningComment = ExtensionUtils.getWarningComment();

        const cabbageContent = warningComment + `
<Cabbage>[
{"type":"form","caption":"Untitled","size":{"height":300,"width":600},"pluginId":"def1"}
]</Cabbage>`;

        const edit = new vscode.WorkspaceEdit();

        if (cabbageSectionPosition === 'top') {
            // Insert at the beginning of the file
            edit.insert(document.uri, new vscode.Position(0, 0), cabbageContent);
        } else {
            // Insert after </CsoundSynthesizer> tag
            const text = document.getText();
            const csoundEndTag = '</CsoundSynthesizer>';
            const endIndex = text.indexOf(csoundEndTag);

            if (endIndex !== -1) {
                // Insert after the closing tag
                const insertPosition = document.positionAt(endIndex + csoundEndTag.length);
                edit.insert(document.uri, insertPosition, '\n' + cabbageContent.trim());
            } else {
                // If no CsoundSynthesizer tag found, insert at the end
                const endPosition = document.positionAt(text.length);
                edit.insert(document.uri, endPosition, '\n' + cabbageContent.trim());
            }
        }

        vscode.workspace.applyEdit(edit);
    }

    /**
     * Moves an existing Cabbage section to the opposite position (toggles between top and bottom)
     */
    static async moveCabbageSection() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showErrorMessage('No active editor found');
            return;
        }

        const document = editor.document;
        const text = document.getText();
        
        // Find existing Cabbage section
        const cabbageRegexWithWarning = /<\!--[\s\S]*?Warning:[\s\S]*?--\>[\s\n]*<Cabbage>([\s\S]*?)<\/Cabbage>/;
        const cabbageRegexWithoutWarning = /<Cabbage>([\s\S]*?)<\/Cabbage>/;
        let cabbageMatch = text.match(cabbageRegexWithWarning);
        let hasWarning = true;

        if (!cabbageMatch) {
            cabbageMatch = text.match(cabbageRegexWithoutWarning);
            hasWarning = false;
        }

        if (!cabbageMatch) {
            vscode.window.showErrorMessage('No Cabbage section found in the current file');
            return;
        }

        // Get the full matched section (including warning if present)
        const cabbageSection = cabbageMatch[0];
        const cabbageSectionStart = cabbageMatch.index!;
        const cabbageSectionEnd = cabbageSectionStart + cabbageSection.length;

        // Determine current position
        const csoundSynthesizerStartTag = '<CsoundSynthesizer>';
        const csoundSynthesizerEndTag = '</CsoundSynthesizer>';
        const csoundStartIndex = text.indexOf(csoundSynthesizerStartTag);
        const csoundEndIndex = text.indexOf(csoundSynthesizerEndTag);
        
        // Section is at top if it appears before <CsoundSynthesizer>
        const isCurrentlyAtTop = csoundStartIndex !== -1 && cabbageSectionStart < csoundStartIndex;
        
        // Toggle to opposite position
        const targetPosition = isCurrentlyAtTop ? 'bottom' : 'top';

        const edit = new vscode.WorkspaceEdit();
        
        // Remove from current position
        const removeRange = new vscode.Range(
            document.positionAt(cabbageSectionStart),
            document.positionAt(cabbageSectionEnd)
        );
        
        // Also remove trailing newlines after the section
        let endPosition = cabbageSectionEnd;
        while (endPosition < text.length && (text[endPosition] === '\n' || text[endPosition] === '\r')) {
            endPosition++;
        }
        const removeRangeWithNewlines = new vscode.Range(
            document.positionAt(cabbageSectionStart),
            document.positionAt(endPosition)
        );
        
        edit.delete(document.uri, removeRangeWithNewlines);

        // Insert at target position
        if (targetPosition === 'top') {
            edit.insert(document.uri, new vscode.Position(0, 0), cabbageSection + '\n');
        } else {
            // Insert after </CsoundSynthesizer>
            if (csoundEndIndex !== -1) {
                const insertPosition = document.positionAt(csoundEndIndex + csoundSynthesizerEndTag.length);
                edit.insert(document.uri, insertPosition, '\n' + cabbageSection);
            } else {
                // No closing tag, insert at end
                const endPosition = document.positionAt(text.length);
                edit.insert(document.uri, endPosition, '\n' + cabbageSection);
            }
        }

        const success = await vscode.workspace.applyEdit(edit);
        if (success) {
            vscode.window.showInformationMessage(`Cabbage section moved to ${targetPosition}`);
        } else {
            vscode.window.showErrorMessage('Failed to move Cabbage section');
        }
    }

    /**
     * Checks for the existence of a Cabbage source directory in the settings.
     */
    static async setCabbageSrcDirectoryIfEmpty() {
        let settings = await Settings.getCabbageSettings();
        const current = settings["currentConfig"]["jsSourceDir"];
        const isEmpty = (Array.isArray(current) && current.length === 0) || (typeof current === 'string' && current.length === 0) || (typeof current === 'undefined');
        if (isEmpty) {
            const newPath = Settings.getPathJsSourceDir();
            settings['currentConfig']['jsSourceDir'] = newPath ? [newPath] : [];
            await Settings.setCabbageSettings(settings);
        }
    }


    /**
     * Get the current cabbage code
     * @param editor 
     * @returns Returns the current cabbage JSON code
     */
    static getCabbageContent(editor: vscode.TextEditor): { content: string, range: vscode.Range | null } {
        if (!editor) {
            vscode.window.showErrorMessage("No active editor found.");
            return { content: '', range: null };
        }

        const document = editor.document;
        const text = document.getText();

        const startTag = '<Cabbage>';
        const endTag = '</Cabbage>';

        const startIndex = text.indexOf(startTag);
        const endIndex = text.indexOf(endTag);

        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            vscode.window.showErrorMessage("Cabbage section not found or is invalid.");
            return { content: '', range: null };
        }

        const startPos = document.positionAt(startIndex + startTag.length);
        const endPos = document.positionAt(endIndex);
        const range = new vscode.Range(startPos, endPos);
        const cabbageContent = document.getText(range).trim();

        return { content: cabbageContent, range };
    }

    /**
     * Collapse the Cabbage JSON content in the active editor.
     */
    static collapseCabbageJSON() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return; // Exit if no active editor
        }

        const { content: cabbageContent, range } = Commands.getCabbageContent(editor);
        if (!range) {
            return; // Exit if the range is invalid
        }

        // Collapse the Cabbage content
        const collapsedContent = ExtensionUtils.collapseCabbageContent(cabbageContent);

        // Update the document with the collapsed content
        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, range, collapsedContent); // Replace with collapsed content only
        return vscode.workspace.applyEdit(edit);
    }

    /**
     * Expands the Cabbage JSON content in the active editor.
     */
    static expandCabbageJSON() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }
        const { content: cabbageContent, range } = Commands.getCabbageContent(editor);
        if (!range) { return; }; // Exit if the range is invalid

        try {
            const config = vscode.workspace.getConfiguration("cabbage");
            const indentSpaces = config.get("jsonIndentSpaces", 4);
            const maxLength = config.get("jsonMaxLength", 120);

            const jsonObject = JSON.parse(cabbageContent);
            const formattedJson = stringify(jsonObject, { maxLength: maxLength, indent: indentSpaces });

            editor.edit(editBuilder => {
                editBuilder.replace(range, '\n' + formattedJson + '\n');
            });

        } catch (error) {
            vscode.window.showErrorMessage("Failed to parse and format JSON content.");
        }
    }



    /**
     * Creates a new file with predefined content based on the type and opens it in a new tab.
     * @param type The type of the new file to create.
     */
    static async createNewCabbageFile(type: string) {
        // Get the new file contents based on the type
        const newFileContents = ExtensionUtils.getNewCabbageFile(type);
        // Create a new untitled document with .csd extension and appropriate language
        const document = await vscode.workspace.openTextDocument({
            content: newFileContents,
            language: 'csound-csd'  // Set proper language mode for .csd files
        });

        // Open the new document in a new editor tab
        await vscode.window.showTextDocument(document);
    }


    /**
     * Formats the document content by applying predefined formatting rules.
     * The formatting rules are defined in the ExtensionUtils class.
     * @returns A promise that resolves when the document is formatted.
     */
    static async formatDocument() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) { return; }

        const text = editor.document.getText();
        const formattedText = ExtensionUtils.formatText(text);

        const edit = new vscode.WorkspaceEdit();
        edit.replace(editor.document.uri, new vscode.Range(0, 0, editor.document.lineCount, 0), formattedText);
        await vscode.workspace.applyEdit(edit);
    }

    /**
     * Retrieves all .csd files in a directory.
     * @param directory The directory to search for .csd files.
     * @returns An array of .csd file paths.
     */
    // Function to get all .csd files in a directory with full absolute paths
    static getCsdFiles(directory: string): string[] {
        try {
            const files = fs.readdirSync(directory);
            return files
                .filter(file => file.endsWith('.csd'))
                .map(file => path.join(directory, file)); // Construct full absolute paths
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to read directory: ${directory}`);
            return [];
        }
    }

    /**
    * Function to check if a file is a protected example file
    * @param filePath The file path to check.
    * @returns True if the file is a protected example, false otherwise
    */
    static isProtectedExample(filePath: string): boolean {
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (!extension) {
            return false;
        }
        const examplesPath = path.join(extension.extensionPath, 'examples');
        return filePath.startsWith(examplesPath);
    }

    /**
     * Provides a dropdown list of examples for the user to open
     * in the editor.
     * @returns A promise that resolves when the user selects an example.
     */
    static async openCabbageExample() {
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (!extension) {
            vscode.window.showErrorMessage('Cabbage extension not found.');
            return;
        }
        const examplesPath = path.join(extension.extensionPath, 'examples');
        const csdFiles = Commands.getCsdFiles(examplesPath);


        // Show available examples in a drop-down (QuickPick)
        const selectedExample = await vscode.window.showQuickPick(
            csdFiles.map(file => path.basename(file)), // Display only the filenames
            { placeHolder: 'Select a Cabbage example to open' }
        );

        if (selectedExample) {
            const selectedExamplePath = csdFiles.find(file => path.basename(file) === selectedExample);
            if (selectedExamplePath) {
                const document = await vscode.workspace.openTextDocument(selectedExamplePath);
                await vscode.window.showTextDocument(document);
            }
        } else {
            vscode.window.showWarningMessage('No example file selected.');
        }
    }

    /**
     * Checks if the provided document contains Cabbage tags.
     * @param document The document to check.
     * @returns True if the document contains Cabbage tags, false otherwise.
     */
    static async hasCabbageTags(document: vscode.TextDocument): Promise<boolean> {
        const text = document.getText();
        return text.includes('<Cabbage>') && text.includes('</Cabbage>');
    }

    /**
     * Returns the server state.
     * @returns true/false depending on server status.
     */
    static hasCabbageServerStarted(): boolean {
        return this.cabbageServerStarted;
    }

    /**
     * Retrieves the Webview panel for the UI editor if it exists.
     * @returns The Webview panel or undefined.
     */
    static getPanel(): vscode.WebviewPanel | undefined {
        return this.panel;
    }

    /**
     * Retrieves the list of processes managed by the Commands class.
     * @returns An array of active or undefined child processes.
     */
    static getProcesses(): (cp.ChildProcess | undefined)[] {
        return this.processes;
    }

    /**
     * 
     */
    static openOpcodeReference(context: vscode.ExtensionContext) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showInformationMessage('No active editor');
            return;
        }

        const document = editor.document;
        const position = editor.selection.active;
        const wordRange = document.getWordRangeAtPosition(position);

        if (!wordRange) {
            vscode.window.showInformationMessage('No word under cursor');
            return;
        }

        const word = document.getText(wordRange);
        const url = `https://csound.com/manual/opcodes/${word}/`;

        vscode.env.openExternal(vscode.Uri.parse(url));
    }
    /**
     * Retrieves the output channel for the extension, initializing it if necessary.
     * @returns The output channel for Cabbage output.
     */
    static getOutputChannel(): vscode.OutputChannel {
        if (!this.vscodeOutputChannel) {
            this.vscodeOutputChannel = vscode.window.createOutputChannel("Cabbage output");
        }
        return this.vscodeOutputChannel;
    }

    /**
     * Sets JSON validation diagnostics for a document.
     * @param uri The document URI
     * @param diagnostics Array of diagnostics to set
     */
    static setJSONDiagnostics(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]) {
        if (!this.diagnosticCollection) {
            this.initialize();
        }
        this.diagnosticCollection.set(uri, diagnostics);
    }

    /**
     * Clears JSON validation diagnostics for a document.
     * @param uri The document URI
     */
    static clearJSONDiagnostics(uri: vscode.Uri) {
        if (this.diagnosticCollection) {
            this.diagnosticCollection.delete(uri);
        }
    }

    /**
     * Creates a diagnostic for Csound compilation errors to highlight them in the editor.
     * @param errorLine The error line from Csound output
     * @param documentUri The URI of the document to create diagnostics for
     */
    static async createCsoundErrorDiagnostic(errorLine: string, documentUri?: string) {
        let document: vscode.TextDocument | undefined;

        if (documentUri) {
            // Use the provided document URI. If the document isn't open in an editor,
            // attempt to open it so we can attach diagnostics to it.
            try {
                const uri = vscode.Uri.file(documentUri);
                // Try to find the document in open editors first
                document = vscode.workspace.textDocuments.find(doc => doc.uri.fsPath === documentUri);
                if (!document) {
                    try {
                        document = await vscode.workspace.openTextDocument(uri);
                        console.log(`Cabbage: Opened document for diagnostics: ${documentUri}`);
                    } catch (openErr) {
                        console.log(`Cabbage: Failed to open document ${documentUri} for diagnostics:`, openErr);
                        return;
                    }
                }
            } catch (error) {
                console.log(`Cabbage: Error getting document from URI ${documentUri}:`, error);
                return;
            }
        } else {
            // Fallback to active editor (for backward compatibility)
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                console.log('Cabbage: No active editor found for diagnostics');
                return;
            }
            document = editor.document;
        }

        // Try to extract line number from error message first
        // Csound errors typically look like: "error: message at line X" or "line 512:"
        console.log(`Cabbage: Creating diagnostic for error: "${errorLine}"`);
        const lineMatch = errorLine.match(/line\s*:?\s*(\d+)/i);
        if (lineMatch) {
            console.log(`Cabbage: Extracted line number: ${lineMatch[1]}`);
            // Csound reports line numbers as 1-based. Convert to 0-based for
            // VS Code by subtracting 1.
            const reportedLine = parseInt(lineMatch[1], 10);
            const lineNumber = isNaN(reportedLine) ? NaN : reportedLine - 1;
            if (isNaN(lineNumber) || lineNumber < 0) {
                console.log(`Cabbage: Invalid line number extracted: ${lineNumber}`);
                return;
            }

            // Clamp the line number to the document bounds (some backends report
            // line numbers greater than file length). This prevents early return
            // and ensures a diagnostic is always created on the closest valid line.
            const clampedLine = Math.min(Math.max(lineNumber, 0), document.lineCount - 1);

            // Create diagnostic range for the entire line
            const line = document.lineAt(clampedLine);
            const range = new vscode.Range(clampedLine, 0, clampedLine, line.text.length);

            // Create the diagnostic
            const diagnostic = new vscode.Diagnostic(
                range,
                errorLine.trim(),
                vscode.DiagnosticSeverity.Error
            );

            // Add to diagnostic collection
            if (!this.diagnosticCollectionCsound) {
                this.initialize();
                console.log('Cabbage: Initialized diagnosticCollectionCsound');
            }
            console.log(`Cabbage: About to set diagnostic for line ${lineNumber + 1}, range: ${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}, message: "${errorLine.trim()}"`);
            this.diagnosticCollectionCsound.set(document.uri, [diagnostic]);
            console.log(`Cabbage: Successfully set diagnostic for line ${lineNumber + 1}`);
            return;
        }

        // If no line number, try to extract opcode name from error message
        // Look for patterns like "Unable to find opcode with name: invalidOpcode"
        const opcodeMatch = errorLine.match(/opcode with name:\s*(\w+)/i) ||
            errorLine.match(/Unknown opcode:\s*(\w+)/i) ||
            errorLine.match(/opcode\s*['"]?(\w+)['"]?\s*not found/i) ||
            // Match patterns like: Unable to find opcode entry for 'pvs2tab'
            errorLine.match(/unable to find opcode(?: entry for)?\s*['"]?([\w_+\-<>]+)['"]?/i) ||
            // Match common phrase variants
            errorLine.match(/unable to find opcode/i) && errorLine.match(/['"]?([\w_+\-<>]+)['"]?/) ||
            null;

        if (opcodeMatch) {
            const opcodeName = opcodeMatch[1];
            console.log(`Cabbage: Extracted opcode name "${opcodeName}" from error: "${errorLine}"`);

            // Search for the first occurrence of this opcode in the document
            const text = document.getText();
            const lines = text.split('\n');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Look for the opcode as a whole word (word boundary)
                const opcodeRegex = new RegExp(`\\b${opcodeName}\\b`, 'i');
                const match = line.match(opcodeRegex);

                if (match) {
                    // Found the opcode, create diagnostic for this line
                    const range = new vscode.Range(i, match.index!, i, match.index! + opcodeName.length);

                    const diagnostic = new vscode.Diagnostic(
                        range,
                        errorLine.trim(),
                        vscode.DiagnosticSeverity.Error
                    );

                    // Add to diagnostic collection
                    if (!this.diagnosticCollectionCsound) {
                        this.initialize();
                        console.log('Cabbage: Initialized diagnosticCollectionCsound for opcode');
                    }
                    console.log(`Cabbage: About to set diagnostic for opcode "${opcodeName}" at line ${i + 1}, range: ${range.start.line}:${range.start.character}-${range.end.line}:${range.end.character}, message: "${errorLine.trim()}"`);
                    this.diagnosticCollectionCsound.set(document.uri, [diagnostic]);
                    console.log(`Cabbage: Successfully set diagnostic for opcode "${opcodeName}" at line ${i + 1}`);
                    return;
                }
            }

            console.log(`Cabbage: Opcode "${opcodeName}" not found in document`);
            return;
        }

        console.log(`Cabbage: Could not extract line number or opcode name from error: "${errorLine}"`);

        // Fallback: create a file-level diagnostic at the top of the document so
        // the user still sees a visible error (red squiggle) even if we couldn't
        // parse a precise line number or opcode. This is better than no
        // diagnostic at all for generic parser failures.
        try {
            if (!this.diagnosticCollectionCsound) {
                this.initialize();
                console.log('Cabbage: Initialized diagnosticCollectionCsound for fallback');
            }

            const fallbackRange = new vscode.Range(0, 0, 0, Math.min(120, document.lineAt(0).text.length));
            const fallbackDiag = new vscode.Diagnostic(
                fallbackRange,
                errorLine.trim(),
                vscode.DiagnosticSeverity.Error
            );
            // If diagnostics already exist for this document (for example a
            // more specific line-level diagnostic), prefer keeping those and
            // don't overwrite them with a generic fallback at the top of the
            // file. Only set the fallback if no diagnostics exist yet.
            const existing = this.diagnosticCollectionCsound.get(document.uri);
            if (existing && existing.length > 0) {
                console.log('Cabbage: Existing diagnostics present, skipping fallback top-level diagnostic');
            } else {
                this.diagnosticCollectionCsound.set(document.uri, [fallbackDiag]);
                console.log('Cabbage: Set fallback Csound diagnostic at top of document');
            }
        } catch (err) {
            console.log('Cabbage: Failed to set fallback diagnostic:', err);
        }
    }

    /**
     * Run make for Daisy
     */
    static makeForDaisy(makeType: string) {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showErrorMessage('No active editor found.');
            return;
        }

        const fileUri = activeEditor.document.uri;
        const folderPath = path.dirname(fileUri.fsPath);
        const folderName = path.basename(folderPath);
        const sourceFileName = `${folderName}.cpp`;
        const makefilePath = path.join(folderPath, 'Makefile');

        if (!fs.existsSync(makefilePath)) {
            const config = vscode.workspace.getConfiguration('cabbage'); // Replace with your actual extension name
            const csoundIncludeDir = config.get('pathToCsoundIncludeDir');
            const csoundLibDir = config.get('pathToCsoundLibraryDir');

            if (!csoundIncludeDir || !csoundLibDir) {
                vscode.window.showErrorMessage('CSOUND paths are not set in settings.');
                return;
            }

            const makefileContent = `
APP_TYPE = BOOT_QSPI
LDFLAGS += -u _printf_float

# Project Name
TARGET = daisyCsoundGenerative

# Sources
CPP_SOURCES = ${sourceFileName}

# Library Locations
LIBDAISY_DIR = ../../libDaisy/
DAISYSP_DIR = ../../DaisySP/

# Csound Library and Include Locations
CSOUND_INCLUDE_DIR = ${csoundIncludeDir}
CSOUND_LIB_DIR     = ${csoundLibDir}

# Full path to the Csound static library
CSOUND_STATIC_LIB = $(CSOUND_LIB_DIR)/libcsound.a

# Add to the existing flags
C_INCLUDES += -I$(CSOUND_INCLUDE_DIR)
LIBS += $(CSOUND_STATIC_LIB)
LIBDIR  += -L$(CSOUND_LIB_DIR)

# Use Bootloader v5.4
BOOT_BIN = $(shell pwd)/../dsy_bootloader_v5_4.bin

# Use Custom Linker Script
LDSCRIPT = $(shell pwd)/../STM32H750IB_qspi_custom.lds

# Core location, and generic Makefile.
SYSTEM_FILES_DIR = $(LIBDAISY_DIR)/core
include $(SYSTEM_FILES_DIR)/Makefile
        `;

            fs.writeFileSync(makefilePath, makefileContent);
        }

        const outputChannel = vscode.window.createOutputChannel('Daisy Make');
        outputChannel.show(true);
        outputChannel.appendLine('Running make...\n');

        const args = makeType.trim() === '' ? [] : ['-j', makeType.trim()];
        const makeProcess = cp.spawn('make', args, { cwd: folderPath });

        makeProcess.stdout.on('data', (data) => {
            outputChannel.append(data.toString());
        });

        makeProcess.stderr.on('data', (data) => {
            outputChannel.append(data.toString());
            outputChannel.show(true);
        });

        makeProcess.on('close', (code) => {
            if (code === 0) {
                outputChannel.appendLine('\nMake completed successfully!');
            } else {
                outputChannel.appendLine(`\nMake failed with exit code ${code}`);
            }
        });
    }


    /**
     * Export instrument
     */
    static async exportInstrument(type: string) {
        await Commands.copyPluginBinaryFile(type);
    }

    /**
     * Gets the path to the Cabbage JS source directory based on configuration
     */
    private static getJsSourcePath(): string {
        const config = vscode.workspace.getConfiguration('cabbage');
        let jsSource = "";
        if (os.platform() === 'win32') {
            jsSource = config.get<string>('pathToJsSourceWindows') || '';
        } else if (os.platform() === 'linux') {
            jsSource = config.get<string>('pathToJsSourceLinux') || '';
        } else if (os.platform() === 'darwin') {
            jsSource = config.get<string>('pathToJsSourceMacOS') || '';
        }

        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (jsSource === '') {
            if (extension) {
                return path.join(extension.extensionPath, 'src', 'cabbage');
            }
        } else {
            if (extension) {
                return path.join(jsSource, 'cabbage');
            }
        }
        return '';
    }

    /**
     * Gets the path to the Cabbage CSS file
     */
    private static getCabbageCssPath(): string {
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (extension) {
            return path.join(extension.extensionPath, 'media', 'cabbage.css');
        }
        return '';
    }

    /**
     * Generates a custom index.html with only the specified widget imports
     * @param usedWidgets Set of widget types to include in the imports
     * @returns HTML string with only the used widget script tags
     */
    private static generateIndexHtmlForWidgets(usedWidgets: Set<string>): string {
        // Generate script tags only for used widgets
        const widgetScripts = Array.from(usedWidgets)
            .map(widgetType => `<script type="module" src="cabbage/widgets/${widgetType}.js"></script>`)
            .join('\n');

        return `
    <!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Welcome to Cabbage</title>
<link rel="stylesheet" href="cabbage.css">
<style>
    html,
    body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        overflow: hidden;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        cursor: default;
        -webkit-touch-callout: none;
        -webkit-tap-highlight-color: transparent;
    }

    *,
    *::before,
    *::after {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
        cursor: inherit;
    }

    input,
    textarea {
        user-select: text;
        -webkit-user-select: text;
        -moz-user-select: text;
        -ms-user-select: text;
        cursor: text;
    }
</style>
</head>
<body>
${widgetScripts}
<script type="module" src="cabbage/utils.js"></script>
<script type="module" src="cabbage/cabbage.js"></script>
<script type="module" src="cabbage/main.js"></script>

<span class="popup" id="popupValue">50</span>
</body>
</html>`;
    }

    /**
     * Extracts the set of widget types used in a CSD file by parsing the Cabbage JSON section
     * @param csdContent The content of the CSD file
     * @returns Set of widget type names (e.g., 'rotarySlider', 'button', etc.)
     */
    private static extractUsedWidgets(csdContent: string): Set<string> {
        const widgetTypes = new Set<string>();

        try {
            // Extract Cabbage JSON section using regex (same pattern as getCabbageContent)
            const cabbageRegex = /<Cabbage>([\s\S]*?)<\/Cabbage>/i;
            const match = csdContent.match(cabbageRegex);

            if (!match || !match[1]) {
                Commands.vscodeOutputChannel.appendLine('Export: No Cabbage section found in CSD file');
                return widgetTypes;
            }

            const cabbageCode = match[1].trim();
            const widgets = JSON.parse(cabbageCode);

            if (Array.isArray(widgets)) {
                for (const widget of widgets) {
                    if (widget.type) {
                        widgetTypes.add(widget.type);
                    }
                }
            }

            Commands.vscodeOutputChannel.appendLine(`Export: Found ${widgetTypes.size} widget types: ${Array.from(widgetTypes).join(', ')}`);
        } catch (e) {
            Commands.vscodeOutputChannel.appendLine(`Export: Error parsing Cabbage JSON: ${e}`);
        }

        return widgetTypes;
    }

    /**
     * Copies widgets for plugin export
     * - Copies ALL built-in widgets (required by widgetTypes.js static imports)
     * - Copies ONLY used custom widgets (selective)
     * @param usedWidgets Set of widget type names used in the CSD
     * @param allJsSourceDirs All JS source directories from Cabbage settings
     * @param destDir Destination cabbage directory
     */
    private static async copyUsedWidgets(
        usedWidgets: Set<string>,
        allJsSourceDirs: string[],
        destDir: string
    ): Promise<void> {
        const widgetsDestDir = path.join(destDir, 'widgets');
        await fs.promises.mkdir(widgetsDestDir, { recursive: true });

        // List of all built-in widgets (must match widgetTypes.js static imports)
        const builtInWidgets = [
            'rotarySlider', 'horizontalSlider', 'horizontalRangeSlider', 'verticalSlider',
            'numberSlider', 'keyboard', 'form', 'button', 'fileButton', 'infoButton',
            'optionButton', 'genTable', 'label', 'image', 'listBox', 'comboBox',
            'groupBox', 'checkBox', 'csoundOutput', 'textEditor', 'xyPad'
        ];

        // Find the built-in source directory (the one containing vscabbage/src)
        const builtInSourceDir = allJsSourceDirs.find(dir => dir.includes('vscabbage/src'));

        if (!builtInSourceDir) {
            Commands.vscodeOutputChannel.appendLine('Export: WARNING - Could not find built-in widget directory');
            return;
        }

        // Copy ALL built-in widgets (required by widgetTypes.js)
        Commands.vscodeOutputChannel.appendLine(`Export: Copying all ${builtInWidgets.length} built-in widgets...`);
        for (const widgetType of builtInWidgets) {
            const widgetFileName = `${widgetType}.js`;
            const widgetPath = path.join(builtInSourceDir, 'cabbage', 'widgets', widgetFileName);

            if (fs.existsSync(widgetPath)) {
                await fs.promises.copyFile(
                    widgetPath,
                    path.join(widgetsDestDir, widgetFileName)
                );
                Commands.vscodeOutputChannel.appendLine(`Export:   ✓ ${widgetType} (built-in)`);
            } else {
                Commands.vscodeOutputChannel.appendLine(`Export:   ✗ ${widgetType} (built-in not found)`);
            }
        }

        // Copy ONLY used custom widgets
        const customWidgets = Array.from(usedWidgets).filter(w => !builtInWidgets.includes(w));

        if (customWidgets.length > 0) {
            Commands.vscodeOutputChannel.appendLine(`Export: Copying ${customWidgets.length} custom widgets...`);

            for (const widgetType of customWidgets) {
                const widgetFileName = `${widgetType}.js`;
                let copied = false;

                // Check custom directories (skip the built-in directory)
                for (const jsSourceDir of allJsSourceDirs) {
                    if (jsSourceDir === builtInSourceDir) continue; // Skip built-in

                    const widgetPath = path.join(jsSourceDir, 'cabbage', 'widgets', widgetFileName);

                    if (fs.existsSync(widgetPath)) {
                        await fs.promises.copyFile(
                            widgetPath,
                            path.join(widgetsDestDir, widgetFileName)
                        );
                        Commands.vscodeOutputChannel.appendLine(`Export:   ✓ ${widgetType} (custom) from ${jsSourceDir}`);
                        copied = true;
                        break;
                    }
                }

                if (!copied) {
                    Commands.vscodeOutputChannel.appendLine(`Export:   ✗ ${widgetType} (custom widget not found)`);
                }
            }
        } else {
            Commands.vscodeOutputChannel.appendLine('Export: No custom widgets to copy');
        }
    }

    /**
     * Copies core cabbage files (excluding widgets directory)
     * @param sourceDir Source cabbage directory
     * @param destDir Destination cabbage directory
     */
    private static async copyCabbageCore(sourceDir: string, destDir: string): Promise<void> {
        await fs.promises.mkdir(destDir, { recursive: true });

        const items = await fs.promises.readdir(sourceDir, { withFileTypes: true });

        for (const item of items) {
            // Skip widgets directory - we'll copy selectively
            if (item.name === 'widgets') {
                continue;
            }

            const sourcePath = path.join(sourceDir, item.name);
            const destPath = path.join(destDir, item.name);

            if (item.isDirectory()) {
                await Commands.copyDirectory(sourcePath, destPath);
            } else {
                await fs.promises.copyFile(sourcePath, destPath);
            }
        }

        Commands.vscodeOutputChannel.appendLine('Export: Copied core cabbage framework files');
    }

    /**
     * Sets up the project resources directory with JS sources, CSS, index.html, and CSD file
     */
    private static async setupProjectResources(resourcesDir: string, indexHtmlContent: string, csdContent: string, projectName: string): Promise<void> {
        // Create resources directory
        await fs.promises.mkdir(resourcesDir, { recursive: true });
        console.log('Cabbage: Created resources directory:', resourcesDir);

        // Extract used widgets from CSD content
        const usedWidgets = Commands.extractUsedWidgets(csdContent);
        console.log(`Cabbage: Found ${usedWidgets.size} used widgets:`, Array.from(usedWidgets));

        // Generate custom index.html with only used widgets
        const customIndexHtml = Commands.generateIndexHtmlForWidgets(usedWidgets);
        Commands.vscodeOutputChannel.appendLine(`Export: Generated custom index.html with ${usedWidgets.size} widget imports`);

        // Get paths
        const jsSourcePath = Commands.getJsSourcePath();
        const cabbageDestDir = path.join(resourcesDir, 'cabbage');
        // Get custom widget directory from global Cabbage settings (not VS Code config)
        const settings = await Settings.getCabbageSettings();
        const jsSourceDirs = settings['currentConfig']?.['jsSourceDir'] || [];
        const customWidgetDirs: string[] = Array.isArray(jsSourceDirs) ? jsSourceDirs : [];

        Commands.vscodeOutputChannel.appendLine(`Export: Checking ${customWidgetDirs.length} widget directories: ${JSON.stringify(customWidgetDirs)}`);

        // Copy core cabbage files (excluding widgets directory)
        await Commands.copyCabbageCore(jsSourcePath, cabbageDestDir);

        // Copy only used widgets (checks all jsSourceDir directories)
        await Commands.copyUsedWidgets(usedWidgets, customWidgetDirs, cabbageDestDir);

        // Copy CSS file
        const cssPath = Commands.getCabbageCssPath();
        const cssFileName = path.basename(cssPath);
        const cssDestPath = path.join(resourcesDir, cssFileName);
        await fs.promises.copyFile(cssPath, cssDestPath);
        console.log('Cabbage: Copied CSS file');

        // Create index.html with custom widget imports
        const indexHtmlPath = path.join(resourcesDir, 'index.html');
        await fs.promises.writeFile(indexHtmlPath, customIndexHtml);
        console.log('Cabbage: Created custom index.html');

        // Create CSD file
        const csdPath = path.join(resourcesDir, `${projectName}.csd`);
        await fs.promises.writeFile(csdPath, csdContent);
        console.log('Cabbage: Created CSD file');
    }

    /**
     * Creates a new vanilla Cabbage plugin with predefined content.
     * Behaves exactly like export commands but with vanilla content instead of current editor content.
     * @param type The type of plugin to create ('VST3Effect' or 'VST3Synth')
     */
    static async createVanillaProject(type: string): Promise<void> {
        const filters: Record<string, string[]> = { 'VST3 Plugin': ['vst3'] };

        const fileUri = await vscode.window.showSaveDialog({
            saveLabel: 'Create Vanilla Plugin',
            filters
        });

        if (!fileUri) {
            console.log('Cabbage: No file selected.');
            return;
        }

        const config = vscode.workspace.getConfiguration('cabbage');
        const destinationPath = fileUri.fsPath;
        const pluginName = path.basename(destinationPath, '.vst3');

        let binaryFile = '';
        switch (type) {
            case 'VST3Effect':
                binaryFile = Settings.getCabbageBinaryPath('CabbagePluginEffect');
                break;
            case 'VST3Synth':
                binaryFile = Settings.getCabbageBinaryPath('CabbagePluginSynth');
                break;
            default:
                console.error('Cabbage: Not valid type provided for vanilla project');
                return;
        }

        // Check if destination folder exists and ask for overwrite permission
        if (fs.existsSync(destinationPath)) {
            const overwrite = await vscode.window.showWarningMessage(
                `Plugin ${pluginName} already exists. Do you want to replace it?`,
                'Yes', 'No'
            );
            if (overwrite !== 'Yes') {
                console.log('Cabbage: Operation cancelled by user');
                return;
            }
            // Remove existing directory
            await fs.promises.rm(destinationPath, { recursive: true });
        }

        try {
            // Create vanilla index.html
            const vanillaIndexHtml = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Centered Sliders</title>
    <style>
        body {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f0f0f0;
        }

        .container {
            display: flex;
            gap: 20px;
        }
    </style>
</head>

<body>
    <div class="container">
        <input type="range" id="slider1" min="0" max="1000" value="0" step="1"
            oninput="window.handleValueChange(this.value, 'slider1')">
        <input type="range" id="slider2" min="0" max="1000" value="0" step="1"
            oninput="window.handleValueChange(this.value, 'slider2')">
    </div>

    <script type="module">
        /* Cabbage JS API integration */
        import { Cabbage } from './cabbage/cabbage.js';
        /* Notify Cabbage that the UI is ready to load */
        Cabbage.sendCustomCommand('cabbageIsReadyToLoad', null);
        // Make handleValueChange available globally
        window.handleValueChange = (newValue, sliderId) => {
            console.log(\`Slider \${sliderId} changed to:\`, newValue);
            const msg = {
                paramIdx: sliderId === 'slider1' ? 0 : 1,
                channel: sliderId,
                value: parseFloat(newValue),
            };
            const automatable = 1;
            Cabbage.sendChannelUpdate(msg, null, automatable);
        };

        const handleMessage = async (event) => {
            console.log("Message received:", event.data);
            let obj = event.data;

            let slider;
            if (obj.command === "parameterChange") {
                // For parameterChange messages, find slider by paramIdx
                slider = obj.paramIdx === 0 ? document.getElementById('slider1') : document.getElementById('slider2');
            } else {
                // For other messages, find slider by id
                slider = document.getElementById(obj.id);
            }

            if (slider) {
                switch (obj.command) {
                    case "parameterChange":
                        console.log(\`Parameter change for \${obj.paramIdx}:\`, obj);
                        slider.value = obj.value;
                        break;
                    case "widgetUpdate":
                        if (obj.value !== undefined) {
                            console.log(\`Updating \${obj.id} to value:\`, obj.value);
                            slider.value = obj.value;
                        }
                        else if (obj.widgetJson !== undefined) {
                            let widgetObj = JSON.parse(obj.widgetJson);
                            let bounds = widgetObj.bounds;
                            if (bounds) {
                                slider.style.position = 'absolute';
                                slider.style.top = bounds.top + 'px';
                            }
                            // Set value if the UI has just been reopened
                            if (widgetObj.value !== undefined) {
                                slider.value = widgetObj.value;
                            }
                        }
                        break;
                    default:
                        break;
                }
            }
        };

        // Add event listener
        window.addEventListener("message", handleMessage);
    </script>
</body>

</html>`;

            // Create vanilla CSD
            const vanillaCsd = `<Cabbage>
[
    {"type": "form", "caption": "${pluginName}", "size": {"width": 380, "height": 200}, "pluginId": "def1", "enableDevTools": true},
    {
        "type": "rotarySlider",
        "channels": [
            {
                "id": "slider1",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 0.001}
            }
        ]
    },
    {
        "type": "rotarySlider",
        "channels": [
            {
                "id": "slider2",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 0.001}
            }
        ]
    }
]
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d
</CsOptions>
<CsInstruments>
; Initialize the global variables.
ksmps = 32
nchnls = 2
0dbfs = 1

instr 1
    slider1:k = cabbageGetValue("slider1")
    slider2:k = cabbageGetValue("slider2")
    osc1:a = oscili(.5, slider1)
    osc2:a = oscili(.5, slider2)
    outs(osc1, osc2)
endin

instr 2
    cabbageSet("slider2", "bounds.top", 50)
endin

</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
i1 0 z
i2 5 z
</CsScore>
</CsoundSynthesizer>`;

            let resourcesDir = '';
            if (config.get<boolean>('bundleResources')) {
                resourcesDir = path.join(destinationPath, 'Contents', 'Resources');
            }
            else {
                resourcesDir = ExtensionUtils.getResourcePath() + '/' + pluginName;
            }

            // Setup project resources (JS, CSS, index.html, CSD)
            await Commands.setupProjectResources(resourcesDir, vanillaIndexHtml, vanillaCsd, pluginName);

            // Copy the plugin
            if (os.platform() === 'darwin') {
                await Commands.copyDirectory(binaryFile, destinationPath);
                console.log('Cabbage: Vanilla plugin successfully copied to:', destinationPath);

                // Rename the executable file inside the folder
                const macOSDirPath = path.join(destinationPath, 'Contents', 'MacOS');
                let originalFilePath = '';
                switch (type) {
                    case 'VST3Effect':
                        originalFilePath = path.join(macOSDirPath, 'CabbagePluginEffect');
                        break;
                    case 'VST3Synth':
                        originalFilePath = path.join(macOSDirPath, 'CabbagePluginSynth');
                        break;
                    default:
                        originalFilePath = '';
                        break;
                }
                const newFilePath = path.join(macOSDirPath, pluginName);
                await fs.promises.rename(originalFilePath, newFilePath);
                console.log(`File renamed to ${pluginName} in ${macOSDirPath}`);

                // Modify the plist file
                const plistFilePath = path.join(destinationPath, 'Contents', 'Info.plist');
                const plistData = await fs.promises.readFile(plistFilePath, 'utf8');
                const parser = new xml2js.Parser();
                const builder = new xml2js.Builder();

                parser.parseString(plistData, async (err, result) => {
                    if (err) {
                        throw new Error('Error parsing plist file: ' + err);
                    }

                    const dict = result.plist.dict[0];

                    const updatePlistKey = (keyName: string, newValue: string) => {
                        // Find the key in the alternating key-value structure
                        const keyIndex = dict.key.indexOf(keyName);
                        if (keyIndex !== -1) {
                            // Update the corresponding value (strings are at the same index)
                            if (dict.string && dict.string[keyIndex] !== undefined) {
                                dict.string[keyIndex] = newValue;
                            }
                        } else {
                            // Add new key-value pair
                            if (!dict.key) dict.key = [];
                            if (!dict.string) dict.string = [];
                            dict.key.push(keyName);
                            dict.string.push(newValue);
                        }
                    };

                    updatePlistKey('CFBundleExecutable', pluginName);
                    updatePlistKey('CFBundleName', pluginName);
                    updatePlistKey('CFBundleIdentifier', `com.cabbageaudio.${pluginName.toLowerCase()}`);

                    const updatedPlist = builder.buildObject(result);
                    await fs.promises.writeFile(plistFilePath, updatedPlist);
                    console.log(`Info.plist updated: CFBundleExecutable, CFBundleName, and CFBundleIdentifier set to "${pluginName}"`);

                    // Sign the VST3 plugin after all modifications are complete
                    await Commands.signPlugin(destinationPath, pluginName);
                });
            } else {
                if (!await ExtensionUtils.isDirectory(binaryFile)) {
                    await fs.promises.copyFile(binaryFile, destinationPath);

                    let newName = await ExtensionUtils.renameFile(destinationPath, pluginName);
                    console.log(`File renamed to ${newName}`);
                    Commands.getOutputChannel().appendLine("Vanilla plugin successfully copied to:" + destinationPath);
                } else {
                    await Commands.copyDirectory(binaryFile, destinationPath);

                    // Rename the executable file inside the folder
                    let win64DirPath = path.join(destinationPath, 'Contents', 'x86_64-win', 'Release');

                    if (!fs.existsSync(win64DirPath)) {
                        win64DirPath = path.join(destinationPath, 'Contents', 'x86_64-win', 'Debug');
                    }

                    if (!fs.existsSync(win64DirPath)) {
                        win64DirPath = path.join(destinationPath, 'Contents', 'x86_64-win');
                    }

                    if (!fs.existsSync(win64DirPath)) {
                        Commands.getOutputChannel().appendLine("Error: Could not find win64 directory");
                        return;
                    }

                    console.log('Cabbage: win64DirPath:', win64DirPath);
                    const originalFilePath = path.join(win64DirPath, type === 'VST3Effect' ? 'CabbageVST3Effect.vst3' : 'CabbageVST3Synth.vst3');
                    console.log('Cabbage: originalFilePath:', originalFilePath);
                    const newFilePath = path.join(win64DirPath, pluginName + '.vst3');
                    console.log('Cabbage: newFilePath:', newFilePath);
                    await fs.promises.rename(originalFilePath, newFilePath);
                    console.log(`File renamed to ${pluginName} in ${win64DirPath}`);
                    Commands.getOutputChannel().appendLine("Vanilla plugin successfully copied to:" + destinationPath);
                }
            }

            // Open the CSD file in editor
            const csdUri = vscode.Uri.file(path.join(resourcesDir, `${pluginName}.csd`));
            const csdDoc = await vscode.workspace.openTextDocument(csdUri);
            await vscode.window.showTextDocument(csdDoc);

            vscode.window.showInformationMessage(`Cabbage: Created vanilla ${type === 'VST3Effect' ? 'effect' : 'synth'} plugin at ${destinationPath}`);
            Commands.getOutputChannel().appendLine(`Vanilla ${type} plugin created successfully at: ${destinationPath}`);

        } catch (err) {
            vscode.window.showErrorMessage('Error during vanilla plugin creation: ' + err);
            throw err;
        }
    }

    /**
     * Copies and configures a VST3 plugin to a user-specified location.
     * Handles copying the binary, updating the CabbageAudio folder, and modifying configuration files.
     * @param {string} type - The type of plugin to export (VST3Effect, VST3Synth, etc.)
     * @returns {Promise<void>} A promise that resolves when the copy operation is complete
     * @throws {Error} If there are issues with file operations or configuration updates
     */
    static async copyPluginBinaryFile(type: string): Promise<void> {
        const filters: Record<string, string[]> = type.includes('AUv2')
            ? { 'AUv2 Plugin': ['component'] }
            : { 'VST3 Plugin': ['vst3'] };

        const fileUri = await vscode.window.showSaveDialog({
            saveLabel: 'Save Plugin',
            filters
        });

        if (!fileUri) {
            console.log('Cabbage: No file selected.');
            return;
        }

        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        //this.getOutputChannel().appendLine(`Error, please fix the default assets directory`);
        const config = vscode.workspace.getConfiguration('cabbage');
        const destinationPath = fileUri.fsPath;
        const indexDotHtml = ExtensionUtils.getIndexHtml();
        const pluginName = path.basename(destinationPath, type.indexOf('VST3') !== -1 ? '.vst3' : '.component');
        let jsSource = "";
        if (os.platform() === 'win32') {
            jsSource = config.get<string>('pathToJsSourceWindows') || '';
        }
        else if (os.platform() === 'linux') {
            jsSource = config.get<string>('pathToJsSourceLinux') || '';
        }
        else if (os.platform() === 'darwin') {
            jsSource = config.get<string>('pathToJsSourceMacOS') || '';
        }
        else {
            this.vscodeOutputChannel.append('Cabbage: Unsupported platform');
            return;
        }


        let resourcesDir = '';
        if (config.get<boolean>('bundleResources')) {
            resourcesDir = path.join(destinationPath, 'Contents', 'Resources');
        }
        else {
            resourcesDir = ExtensionUtils.getResourcePath() + '/' + pluginName;
        }

        let pathToCabbageJsSource = '';
        let cabbageCSS = '';
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (jsSource === '') {
            if (extension) {
                pathToCabbageJsSource = path.join(extension.extensionPath, 'src', 'cabbage');
                cabbageCSS = path.join(extension.extensionPath, 'media', 'cabbage.css');
            }
        }
        else {
            if (extension) {
                pathToCabbageJsSource = path.join(jsSource, 'cabbage');
                cabbageCSS = path.join(extension.extensionPath, 'media', 'cabbage.css');
            }
        }


        let binaryFile = '';
        let binaryPath = config.get<string>("pathToCabbageBinary") || '';
        if (binaryPath !== '') {
            vscode.window.showInformationMessage('Using custom path to Cabbage binaries: ' + binaryPath);
        }


        switch (type) {
            case 'VST3Effect':
                binaryFile = Settings.getCabbageBinaryPath('CabbagePluginEffect');
                break;
            case 'VST3Synth':
                binaryFile = Settings.getCabbageBinaryPath('CabbagePluginSynth');
                break;
            case 'AUv2Effect':
                binaryFile = Settings.getCabbageBinaryPath('CabbageAUv2Effect');
                break;
            case 'AUv2Synth':
                binaryFile = Settings.getCabbageBinaryPath('CabbageAUv2Synth');
                break;
            case 'Standalone':
                //todo
                break;
            default:
                console.error('Cabbage: Not valid type provided for export');
                break;
        }

        // Check if destination folder exists and ask for overwrite permission
        if (fs.existsSync(destinationPath)) {
            const overwrite = await vscode.window.showWarningMessage(
                `Folder ${pluginName} already exists. Do you want to replace it?`,
                'Yes', 'No'
            );
            if (overwrite !== 'Yes') {
                console.log('Cabbage: Operation cancelled by user');
                return;
            }
            // Remove existing directory
            await fs.promises.rm(destinationPath, { recursive: true });
        }

        try {
            this.vscodeOutputChannel.appendLine('');
            this.vscodeOutputChannel.appendLine('='.repeat(60));
            this.vscodeOutputChannel.appendLine(`Export: Starting plugin export - ${pluginName}`);
            this.vscodeOutputChannel.appendLine('='.repeat(60));

            // Read CSD content first so we can extract used widgets
            let csdContent = '';
            if (editor) {
                csdContent = await fs.promises.readFile(editor.document.fileName, 'utf8');
                this.vscodeOutputChannel.appendLine(`Export: Read CSD file (${csdContent.length} bytes)`);
            }

            // Setup project resources (JS, CSS, index.html, CSD) with actual CSD content
            const indexDotHtml = ExtensionUtils.getIndexHtml();
            await Commands.setupProjectResources(resourcesDir, indexDotHtml, csdContent, pluginName);

            this.vscodeOutputChannel.appendLine('Export: Plugin resources setup complete');

            // Copy the plugin
            if (os.platform() === 'darwin') {
                if (type.includes('VST3')) {
                    await Commands.copyDirectory(binaryFile, destinationPath);
                    console.log('Cabbage: Plugin successfully copied to:', destinationPath);

                    // Rename the executable file inside the folder
                    const macOSDirPath = path.join(destinationPath, 'Contents', 'MacOS');
                    let originalFilePath = '';
                    switch (type) {
                        case 'VST3Effect':
                            originalFilePath = path.join(macOSDirPath, 'CabbagePluginEffect');
                            break;
                        case 'VST3Synth':
                            originalFilePath = path.join(macOSDirPath, 'CabbagePluginSynth');
                            break;
                        case 'AUv2Effect':
                            originalFilePath = path.join(macOSDirPath, 'CabbagePluginEffectAUv2');
                            break;
                        case 'AUv2Synth':
                            originalFilePath = path.join(macOSDirPath, 'CabbagePluginSynthAUv2');
                            break;
                        default:
                            originalFilePath = '';
                            break;
                    }
                    const newFilePath = path.join(macOSDirPath, pluginName);
                    await fs.promises.rename(originalFilePath, newFilePath);
                    console.log(`File renamed to ${pluginName} in ${macOSDirPath}`);


                    // Modify the plist file
                    const plistFilePath = path.join(destinationPath, 'Contents', 'Info.plist');
                    const plistData = await fs.promises.readFile(plistFilePath, 'utf8');
                    const parser = new xml2js.Parser();
                    const builder = new xml2js.Builder();

                    parser.parseString(plistData, async (err, result) => {
                        if (err) {
                            throw new Error('Error parsing plist file: ' + err);
                        }

                        const dict = result.plist.dict[0];

                        const updatePlistKey = (keyName: string, newValue: string) => {
                            // Find the key in the alternating key-value structure
                            const keyIndex = dict.key.indexOf(keyName);
                            if (keyIndex !== -1) {
                                // Update the corresponding value (strings are at the same index)
                                if (dict.string && dict.string[keyIndex] !== undefined) {
                                    dict.string[keyIndex] = newValue;
                                }
                            } else {
                                // Add new key-value pair
                                if (!dict.key) dict.key = [];
                                if (!dict.string) dict.string = [];
                                dict.key.push(keyName);
                                dict.string.push(newValue);
                            }
                        };

                        updatePlistKey('CFBundleExecutable', pluginName);
                        updatePlistKey('CFBundleName', pluginName);
                        updatePlistKey('CFBundleIdentifier', `com.cabbageaudio.${pluginName.toLowerCase()}`);

                        const updatedPlist = builder.buildObject(result);
                        await fs.promises.writeFile(plistFilePath, updatedPlist);
                        console.log(`Info.plist updated: CFBundleExecutable, CFBundleName, and CFBundleIdentifier set to "${pluginName}"`);

                        // Sign the VST3 plugin after all modifications are complete
                        await Commands.signPlugin(destinationPath, pluginName);
                    });
                }
                else if (type.includes('AUv2')) {
                    await Commands.copyDirectory(binaryFile, destinationPath);
                    console.log('Cabbage: AUv2 Plugin successfully copied to:', destinationPath);

                    // Extract pluginId from the Cabbage content
                    const { content: cabbageContent } = Commands.getCabbageContent(editor);
                    if (!cabbageContent) {
                        vscode.window.showErrorMessage('No Cabbage section found in the current file');
                        return;
                    }

                    let cabbageWidgets;
                    try {
                        cabbageWidgets = JSON.parse(cabbageContent);
                    } catch (error) {
                        vscode.window.showErrorMessage('Failed to parse Cabbage JSON content');
                        return;
                    }

                    // Find the form widget which should contain the pluginId
                    const formWidget = cabbageWidgets.find((widget: any) => widget.type === 'form');
                    if (!formWidget || !formWidget.pluginId) {
                        vscode.window.showErrorMessage('No pluginId found in the form widget. Please ensure your Cabbage section contains a form with a pluginId field.');
                        return;
                    }

                    const pluginId = formWidget.pluginId;

                    // Validate that pluginId is exactly 4 characters (AU subtype requirement)
                    if (pluginId.length !== 4) {
                        vscode.window.showErrorMessage(`pluginId must be exactly 4 characters for AU plugins. Current: '${pluginId}' (${pluginId.length} chars)`);
                        return;
                    }

                    // Use the pluginId from the form for both CLAP plugin ID and AU subtype
                    const newClapPluginId = `com.cabbageaudio.${pluginId.toLowerCase()}`;
                    const newNSViewId = `com_cabbageaudio_${pluginId.toLowerCase()}`;
                    const newAuSubtype = pluginId;
                    const newAuManufacturer = 'Cabb'; // Keep original manufacturer

                    console.log(`Using pluginId from Cabbage form: ${pluginId}`);
                    console.log(`New CLAP plugin ID: ${newClapPluginId}`);
                    console.log(`New AU subtype: CaBB -> ${newAuSubtype}`);
                    console.log(`AU manufacturer: ${newAuManufacturer} (unchanged)`);

                    // Path to the binary that needs patching
                    const macOSDirPath = path.join(destinationPath, 'Contents', 'MacOS');
                    const originalBinaryName = type === 'AUv2Effect' ? 'CabbagePluginEffectAUv2' : 'CabbagePluginSynthAUv2';
                    const binaryPath = path.join(macOSDirPath, originalBinaryName);
                    const newBinaryPath = path.join(macOSDirPath, pluginName);

                    try {
                        // Patch the binary file
                        await Commands.patchPluginBinary(binaryPath, newClapPluginId, newNSViewId, newAuSubtype);

                        // Rename the binary to match the plugin name
                        await fs.promises.rename(binaryPath, newBinaryPath);
                        console.log(`Binary renamed to: ${pluginName}`);

                        // Update the Info.plist
                        await Commands.updateAUPlist(destinationPath, pluginName, newAuSubtype, newAuManufacturer);

                        console.log(`AUv2 component created: ${destinationPath}`);

                        // Sign the AUv2 component after all modifications are complete
                        await Commands.signPlugin(destinationPath, pluginName);

                    } catch (error) {
                        console.error('Failed to patch AUv2 plugin:', error);
                        vscode.window.showErrorMessage(`Failed to patch AUv2 plugin: ${error}`);
                        // Clean up on failure
                        if (fs.existsSync(destinationPath)) {
                            await fs.promises.rm(destinationPath, { recursive: true });
                        }
                        return;
                    }
                }
            } else {
                if (!await ExtensionUtils.isDirectory(binaryFile)) {
                    await fs.promises.copyFile(binaryFile, destinationPath);

                    let newName = await ExtensionUtils.renameFile(destinationPath, pluginName);
                    console.log(`File renamed to ${newName}`);
                    Commands.getOutputChannel().appendLine("Plugin successfully copied to:" + destinationPath);
                    return;
                }
                await Commands.copyDirectory(binaryFile, destinationPath);
                // console.log('Cabbage: Plugin successfully copied to:', destinationPath);
                // Commands.getOutputChannel().appendLine("destinationPath:" + destinationPath);

                // Rename the executable file inside the folder
                let win64DirPath = path.join(destinationPath, 'Contents', 'x86_64-win', 'Release');

                if (!fs.existsSync(win64DirPath)) {
                    win64DirPath = path.join(destinationPath, 'Contents', 'x86_64-win', 'Debug');
                }

                if (!fs.existsSync(win64DirPath)) {
                    win64DirPath = path.join(destinationPath, 'Contents', 'x86_64-win');
                }

                if (!fs.existsSync(win64DirPath)) {
                    Commands.getOutputChannel().appendLine("Error: Could not find win64 directory");
                    return;
                }

                // Commands.getOutputChannel().appendLine("destinationPath:" + win64DirPath);

                console.log('Cabbage: win64DirPath:', win64DirPath);
                const originalFilePath = path.join(win64DirPath, type === 'VST3Effect' ? 'CabbageVST3Effect.vst3' : 'CabbageVST3Synth.vst3');
                console.log('Cabbage: originalFilePath:', originalFilePath);
                const newFilePath = path.join(win64DirPath, pluginName + '.vst3');
                console.log('Cabbage: newFilePath:', newFilePath);
                await fs.promises.rename(originalFilePath, newFilePath);
                console.log(`File renamed to ${pluginName} in ${win64DirPath}`);

                this.vscodeOutputChannel.appendLine('='.repeat(60));
                this.vscodeOutputChannel.appendLine(`Export: Plugin successfully exported to: ${destinationPath}`);
                this.vscodeOutputChannel.appendLine('='.repeat(60));
                Commands.getOutputChannel().appendLine("Plugin successfully copied to:" + destinationPath);
            }

        } catch (err) {
            vscode.window.showInformationMessage('Error during plugin copy process:' + err);
            throw err;
        }
    }

    /**
     * Recursively copies a directory and its contents to a new location.
     * @param {string} src - The source directory path to copy from
     * @param {string} dest - The destination directory path to copy to
     * @returns {Promise<void>} A promise that resolves when the directory copy is complete
     * @throws {Error} If there are issues with file system operations
     */
    static async copyDirectory(src: string, dest: string): Promise<void> {
        // Ensure the destination folder exists
        await fs.promises.mkdir(dest, { recursive: true });

        // Read the contents of the source directory
        const entries = await fs.promises.readdir(src, { withFileTypes: true });

        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);

            if (entry.isDirectory()) {
                // If the entry is a directory, call copyDirectory recursively
                await Commands.copyDirectory(srcPath, destPath);
            } else {
                // If it's a file, copy it using fs.promises.copyFile
                await fs.promises.copyFile(srcPath, destPath);
            }
        }
    }

    private static async getDocumentForEdit(textEditor: vscode.TextEditor | undefined): Promise<vscode.TextDocument | undefined> {
        if (textEditor) {
            return textEditor.document;
        }

        if (this.lastSavedFileName) {
            try {
                return await vscode.workspace.openTextDocument(this.lastSavedFileName);
            } catch (error) {
                console.error("Failed to open document:", error);
            }
        }

        console.error("No text editor is available and no last saved file name.");
        return undefined;
    }

    private static async removeWidgetFromDocument(document: vscode.TextDocument, channel: string): Promise<boolean> {
        const text = document.getText();
        const cabbageRegex = /<Cabbage>([\s\S]*?)<\/Cabbage>/;
        const match = text.match(cabbageRegex);

        if (!match) {
            console.log("Cabbage: No Cabbage section found in document");
            return false;
        }

        try {
            const cabbageContent = match[1].trim();
            let widgets = JSON.parse(cabbageContent);
            console.log("Cabbage: Current widgets:", widgets.length);

            // Remove the widget with the specified channel
            const originalLength = widgets.length;
            widgets = widgets.filter((widget: any) => {
                // Check if widget has direct id property
                if (widget.id === channel) {
                    return false;
                }
                // Check if widget has channels array with matching id
                if (widget.channels && Array.isArray(widget.channels) && widget.channels.length > 0) {
                    return widget.channels[0].id !== channel;
                }
                return true;
            });
            console.log(`Removed ${originalLength - widgets.length} widgets`);

            // Format and update the Cabbage section
            const config = vscode.workspace.getConfiguration("cabbage");
            const isSingleLine = config.get("defaultJsonFormatting") === 'Single line objects';

            let formattedArray: string;
            if (isSingleLine) {
                formattedArray = ExtensionUtils.formatJsonObjects(widgets, '    ');
            } else {
                // Use the same stringify function and config as the format command
                const indentSpaces = config.get("jsonIndentSpaces", 4);
                const maxLength = config.get("jsonMaxLength", 120);
                formattedArray = stringify(widgets, { maxLength: maxLength, indent: indentSpaces });
            }

            const updatedCabbageSection = `<Cabbage>\n${formattedArray}\n</Cabbage>`;

            // Apply the edit
            const edit = new vscode.WorkspaceEdit();
            edit.replace(
                document.uri,
                new vscode.Range(
                    document.positionAt(match.index!),
                    document.positionAt(match.index! + match[0].length)
                ),
                updatedCabbageSection
            );

            return await vscode.workspace.applyEdit(edit);
        } catch (error) {
            console.error('Cabbage: Error processing removeWidget command:', error);
            console.error('Cabbage: Error details:', error instanceof Error ? error.message : 'Unknown error');
            return false;
        }
    }

    /**
     * Patches the binary file to replace plugin IDs and AU codes
     * @param binaryPath Path to the binary file to patch
     * @param newPluginId New CLAP plugin ID 
     * @param newAuSubtype New AU subtype (4 chars)
     */
    private static async patchPluginBinary(binaryPath: string, newPluginId: string, newNSViewId: string, newAuSubtype: string): Promise<void> {
        const originalPluginId = "com.cabbageaudio.1d47";
        const originalNSViewId = "com_cabbageaudio_1d47";
        const originalAuSubtype = "Cp47";

        // Ensure IDs are the same length to avoid binary corruption
        const paddedNewPluginId = newPluginId.length < originalPluginId.length
            ? newPluginId.padEnd(originalPluginId.length, ' ')
            : newPluginId;

        if (paddedNewPluginId.length > originalPluginId.length) {
            throw new Error(`New plugin ID cannot be longer than original ID: '${originalPluginId}' (${originalPluginId.length}) vs '${newPluginId}' (${newPluginId.length})`);
        }

        // Ensure AU codes are exactly 4 characters
        if (originalAuSubtype.length !== 4 || newAuSubtype.length !== 4) {
            throw new Error(`AU codes must be exactly 4 characters: '${originalAuSubtype}' vs '${newAuSubtype}'`);
        }

        // Read the binary file
        const data = await fs.promises.readFile(binaryPath) as Buffer;

        let patchedData = data;

        // Replace plugin ID occurrences
        const pluginIdMatches = Commands.countBufferOccurrences(data, originalPluginId);
        if (pluginIdMatches === 0) {
            console.warn(`Warning: '${originalPluginId}' not found in binary`);
        } else {
            console.log(`Found ${pluginIdMatches} occurrence(s) of '${originalPluginId}' in binary`);
            patchedData = Commands.replaceInBuffer(patchedData, originalPluginId, paddedNewPluginId);
        }

        //Replace NSView occurances too..
        const nsViewMatches = Commands.countBufferOccurrences(patchedData, originalNSViewId);
        if (nsViewMatches === 0) {
            console.warn(`Warning: '${originalNSViewId}' not found in binary`);
        } else {
            console.log(`Found ${nsViewMatches} occurrence(s) of '${originalNSViewId}' in binary`);
            patchedData = Commands.replaceInBuffer(patchedData, originalNSViewId, newNSViewId);
        }

        // Replace AU subtype occurrences
        const auSubtypeMatches = Commands.countBufferOccurrences(patchedData, originalAuSubtype);
        if (auSubtypeMatches === 0) {
            console.warn(`Warning: '${originalAuSubtype}' (subtype) not found in binary`);
        } else {
            console.log(`Found ${auSubtypeMatches} occurrence(s) of '${originalAuSubtype}' (subtype) in binary`);
            patchedData = Commands.replaceInBuffer(patchedData, originalAuSubtype, newAuSubtype);
        }

        // Write the patched binary back
        await fs.promises.writeFile(binaryPath, patchedData as any);

        console.log(`Successfully patched binary: '${originalPluginId}' -> '${newPluginId}', '${originalAuSubtype}' -> '${newAuSubtype}'`);
    }

    /**
     * Counts occurrences of a string within a buffer
     */
    private static countBufferOccurrences(haystack: Buffer, needle: string): number {
        let count = 0;
        let pos = 0;
        const needleBuffer = Buffer.from(needle, 'utf-8');
        while ((pos = (haystack as any).indexOf(needleBuffer, pos)) !== -1) {
            count++;
            pos += needleBuffer.length;
        }
        return count;
    }

    /**
     * Replaces all occurrences of oldString with newString in buffer data
     */
    private static replaceInBuffer(data: Buffer, oldString: string, newString: string): Buffer {
        if (oldString.length !== newString.length) {
            throw new Error('String lengths must match for safe replacement');
        }

        const oldBuffer = Buffer.from(oldString, 'utf-8');
        const newBuffer = Buffer.from(newString, 'utf-8');

        let result = Buffer.alloc(data.length);
        (data as any).copy(result);
        let pos = 0;

        while ((pos = (result as any).indexOf(oldBuffer, pos)) !== -1) {
            (newBuffer as any).copy(result, pos);
            pos += newBuffer.length;
        }

        return result;
    }

    /**
     * Updates the Info.plist file for AUv2 plugins with new identifiers
     */
    private static async updateAUPlist(componentPath: string, pluginName: string, newSubtype: string, newManufacturer: string): Promise<void> {
        const plistPath = path.join(componentPath, 'Contents', 'Info.plist');

        try {
            console.log(`Updating Info.plist: ${plistPath}`);

            // Use child_process to call plutil for plist modifications
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            // Update CFBundleExecutable to match the renamed binary
            await execAsync(`plutil -replace CFBundleExecutable -string "${pluginName}" "${plistPath}"`);

            // Update CFBundleName
            await execAsync(`plutil -replace CFBundleName -string "${pluginName}" "${plistPath}"`);

            // Update the subtype in AudioComponents
            await execAsync(`plutil -replace AudioComponents.0.subtype -string "${newSubtype}" "${plistPath}"`);

            // Update the name in AudioComponents
            const newName = `CabbageAudio: ${pluginName}`;
            await execAsync(`plutil -replace AudioComponents.0.name -string "${newName}" "${plistPath}"`);

            // Update CFBundleIdentifier
            const newBundleId = `com.cabbageaudio.${pluginName.toLowerCase()}`;
            await execAsync(`plutil -replace CFBundleIdentifier -string "${newBundleId}" "${plistPath}"`);

            console.log(`Info.plist updated successfully`);

        } catch (error) {
            console.error(`Error updating Info.plist: ${error}`);
            throw error;
        }
    }

    /**
     * Signs a plugin using codesign for macOS
     * @param pluginPath - The path to the plugin (.vst3 or .component)
     * @param pluginName - The name of the plugin for logging
     */
    private static async signPlugin(pluginPath: string, pluginName: string): Promise<void> {
        if (os.platform() !== 'darwin') {
            console.log('Code signing is only available on macOS');
            return;
        }

        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);

            console.log(`Signing plugin: ${pluginName}`);

            // Use ad-hoc signing (no certificate required)
            // The --force flag will replace any existing signature
            // The --deep flag ensures all nested code is signed
            const signCommand = `codesign --force --deep --sign - "${pluginPath}"`;

            await execAsync(signCommand);
            console.log(`Successfully signed plugin: ${pluginName}`);

            // Verify the signature
            const verifyCommand = `codesign --verify --deep --strict "${pluginPath}"`;
            await execAsync(verifyCommand);
            console.log(`Plugin signature verified: ${pluginName}`);

        } catch (error) {
            console.error(`Error signing plugin ${pluginName}: ${error}`);
            // Don't throw the error - signing failure shouldn't stop the export
            vscode.window.showWarningMessage(`Warning: Failed to sign plugin ${pluginName}. The plugin may still work but could trigger security warnings.`);
        }
    }
}