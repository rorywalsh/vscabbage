// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import * as vscode from 'vscode';
import { ExtensionUtils } from './extensionUtils';
import WebSocket from 'ws';
import * as cp from "child_process";
import { Settings } from './settings';
// @ts-ignore
import { setCabbageMode, getCabbageMode, setVSCode } from './cabbage/sharedState.js';
import * as path from 'path';
export let cabbageStatusBarItem: vscode.StatusBarItem;
import fs from 'fs';
import * as xml2js from 'xml2js';
import os from 'os';
import { setupWebSocketServer } from './extension';

/**
 * The Commands class encapsulates the functionalities of the VSCode extension,
 * managing WebSocket communications, document manipulations, UI interactions,
 * and processes related to the Cabbage extension.
 */
export class Commands {
    private static vscodeOutputChannel: vscode.OutputChannel;
    private static portNumber: number = 0;
    private static processes: (cp.ChildProcess | undefined)[] = [];
    private static lastSavedFileName: string | undefined;
    private static highlightDecorationType: vscode.TextEditorDecorationType;
    private static panel: vscode.WebviewPanel | undefined;
    private static websocket: WebSocket | undefined;
    private static cabbageServerStarted: boolean | false;
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
    }


    /**
 * Sends a message to the Cabbage backend to set the specified file as the input channel.
 * Updates the global state with the new file assignment.
 * @param context The extension context provided by VSCode.
 * @param websocket The WebSocket connection to the Cabbage backend.
 * @param file The file to set as the input channel.
 * @param channel The channel to set the file as input for.
 */
    static async sendFileToChannel(context: vscode.ExtensionContext, websocket: WebSocket | undefined, file: string, channel: number) {
        // Construct the message to send via the websocket
        const m = {
            fileName: file,
            channels: channel,
        };
        const msg = {
            command: "setFileAsInput",
            obj: JSON.stringify(m),
        };
        websocket?.send(JSON.stringify(msg));

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
     * @param websocket The WebSocket connection to the Cabbage backend.
     */
    static enterEditMode(ws: WebSocket | undefined) {
        setCabbageMode("draggable");

        this.websocket = ws;
        this.websocket?.send(JSON.stringify({ command: "stopAudio", text: "" }));

        if (this.panel) {
            this.panel.webview.postMessage({ command: 'onEnterEditMode' });
        }
    }

    /**
     * Handles incoming messages from the webview and performs actions based
     * on the message type.
     * @param message The message from the webview.
     * @param websocket The WebSocket connection to the Cabbage backend.
     * @param firstMessages A queue of initial messages to be sent after connection.
     * @param textEditor The active text editor in VSCode.
     * @param context The extension context provided by VSCode.
     */
    static async handleWebviewMessage(
        message: any,
        ws: WebSocket | undefined,
        firstMessages: any[],
        textEditor: vscode.TextEditor | undefined,
        context: vscode.ExtensionContext
    ) {
        this.websocket = ws;
        const config = vscode.workspace.getConfiguration("cabbage");
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

            case 'widgetUpdate':
                if (getCabbageMode() !== "play") {
                    ExtensionUtils.updateText(message.text, getCabbageMode(), this.vscodeOutputChannel, this.highlightDecorationType, this.lastSavedFileName, this.panel);
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
                this.websocket?.send(JSON.stringify(message));
                break;

            case 'cabbageSetupComplete':
                const msg = {
                    command: "cabbageSetupComplete",
                    text: JSON.stringify({})
                };
                firstMessages.push(msg);
                this.websocket?.send(JSON.stringify(msg));
                if (this.panel) {
                    this.panel.webview.postMessage({ command: "snapToSize", text: config.get("snapToSize") });
                }
                break;

            case 'cabbageIsReadyToLoad':
                this.websocket?.send(JSON.stringify({
                    command: "initialiseWidgets",
                    text: ""
                }));
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
                        this.websocket?.send(JSON.stringify(msg));
                    }
                });
                break;

            case 'saveFromUIEditor':
                let documentToSave: vscode.TextDocument | undefined;

                if (vscode.window.activeTextEditor) {
                    documentToSave = vscode.window.activeTextEditor.document;
                } else {
                    documentToSave = vscode.workspace.textDocuments.find(doc => doc.fileName.endsWith('.csd'));
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

                        Commands.onDidSave(documentToSave, context);
                    } catch (error) {
                        console.error('Cabbage: Error saving file:', error);
                        vscode.window.showErrorMessage('Failed to save the file. Please try again.');
                    }
                } else {
                    console.error('Cabbage: No suitable document found to save');
                    vscode.window.showErrorMessage('No .csd file found to save. Please ensure a .csd file is open.');
                }
                break;

            default:
                if (this.websocket) {
                    this.websocket.send(JSON.stringify(message));
                }
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
        const launchInNewColumn = config.get("launchInNewColumn");
        const viewColumn = launchInNewColumn ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;
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
            this.websocket?.send(JSON.stringify({ command: "stopAudio", text: "" }));
            this.panel = undefined;
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

        // Detect current VS Code theme
        const isDarkTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark || 
                           vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;

        this.panel.webview.html = ExtensionUtils.getWebViewContent(mainJS, styles, cabbageStyles, interactJS, widgetWrapper, colourPickerJS, colourPickerStyles, isDarkTheme);
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
        } else {
            this.processes.forEach((p) => {
                return ExtensionUtils.terminateProcess(p, this.websocket);
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

        if (!this.panel) {
            await this.setupWebViewPanel(context);
        }

        const config = vscode.workspace.getConfiguration("cabbage");

        if (this.panel) {
            const launchInNewColumn = config.get("launchInNewColumn");
            const viewColumn = launchInNewColumn ? vscode.ViewColumn.Beside : vscode.ViewColumn.Active;

            this.panel.reveal(viewColumn, true);

            const fileContent = editor.getText();
            this.panel.webview.postMessage({
                command: "onFileChanged",
                text: fileContent,
                lastSavedFileName: finalFileName
            });
        }


        this.setCabbageSrcDirectoryIfEmpty();
    }

    /**
     * Start Cabbage Server as a background process
     * @returns 
     */
    static async startCabbageProcess() {
        const config = vscode.workspace.getConfiguration("cabbage");
        const runInDebugMode = config.get("runInDebugMode");
        if (runInDebugMode) {
            this.portNumber = 9991;
        }
        else {
            this.portNumber = await ExtensionUtils.findFreePort(9991, 10000);
        }

        if (!runInDebugMode) {
            const command = Settings.getCabbageBinaryPath('CabbageApp');

            const process = cp.spawn(command, [
                `--portNumber=${this.portNumber.toString()}`,
                `--startTestServer=false`
            ], {});

            // this.vscodeOutputChannel.clear();
            process.on('error', (err) => {
                this.vscodeOutputChannel.appendLine('Failed to start process: ' + err.message);
                this.vscodeOutputChannel.appendLine('Error stack: ' + err.stack);
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
                this.vscodeOutputChannel.appendLine(`Cabbage server has successfully terminated.`);
                if (code === 3221225785) {
                    this.vscodeOutputChannel.appendLine('This may indicate a missing or incompatible library - is Csound installed?');
                }
            });

            this.processes.push(process);

            process.stdout.on("data", (data: { toString: () => string; }) => {
                const ignoredTokens = ['RtApi', 'MidiIn', 'iplug::', 'RtAudio', 'RtApiCore', 'RtAudio '];
                const dataString = data.toString();
                if (!ignoredTokens.some(token => dataString.startsWith(token))) {
                    if (dataString.startsWith('DEBUG:')) {
                        if (config.get("logVerbose")) {
                            this.vscodeOutputChannel.append(dataString);
                            this.vscodeOutputChannel.show(true); // scrolls to bottom
                        }
                    } else {
                        const msg = dataString.replace(/INFO:/g, "");
                        this.vscodeOutputChannel.append(msg);
                        this.vscodeOutputChannel.show(true);
                    }
                }
            });
            this.cabbageServerStarted = true;
        }

        await setupWebSocketServer(this.portNumber);
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
        const cabbageSectionPosition = config.get('cabbageSectionPosition', 'top');

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
     * Checks for the existence of a Cabbage source directory in the settings.
     */
    static async setCabbageSrcDirectoryIfEmpty() {
        let settings = await Settings.getCabbageSettings();
        if (settings["currentConfig"]["jsSourceDir"].length === 0) {
            const newPath = Settings.getPathJsSourceDir();
            settings['currentConfig']['jsSourceDir'] = newPath;
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
            const jsonObject = JSON.parse(cabbageContent);
            const formattedJson = JSON.stringify(jsonObject, null, 4);

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
            // 1. Create the export directory
            await fs.promises.mkdir(resourcesDir, { recursive: true });
            console.log('Cabbage: Created export directory:', resourcesDir);

            // 2. Copy JS source files
            await Commands.copyDirectory(pathToCabbageJsSource, path.join(resourcesDir, 'cabbage'));
            console.log('Cabbage: Copied JS source files');

            // 3. Create and write index.html
            const indexHtmlPath = path.join(resourcesDir, 'index.html');
            await fs.promises.writeFile(indexHtmlPath, indexDotHtml);
            console.log('Cabbage: Created index.html');

            // 4. Copy CSS file
            const cssFileName = path.basename(cabbageCSS);
            const cssDestPath = path.join(resourcesDir, cssFileName);
            await fs.promises.copyFile(cabbageCSS, cssDestPath);
            console.log('Cabbage: Copied CSS file');

            // Rename and update the .csd file
            const newCsdPath = path.join(resourcesDir, `${pluginName}.csd`);

            if (editor) {
                const newContent = await fs.promises.readFile(editor.document.fileName, 'utf8');
                await fs.promises.writeFile(newCsdPath, newContent);
                console.log('Cabbage: CSD file updated and renamed');
            }

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
            widgets = widgets.filter((widget: any) => widget.channel !== channel);
            console.log(`Removed ${originalLength - widgets.length} widgets`);

            // Format and update the Cabbage section
            const config = vscode.workspace.getConfiguration("cabbage");
            const isSingleLine = config.get("defaultJsonFormatting") === 'Single line objects';
            const formattedArray = isSingleLine
                ? ExtensionUtils.formatJsonObjects(widgets, '    ')
                : JSON.stringify(widgets, null, 4);

            const updatedCabbageSection = `<Cabbage>${formattedArray}</Cabbage>`;

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
