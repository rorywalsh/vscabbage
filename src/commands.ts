// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import * as vscode from 'vscode';
import { ExtensionUtils } from './extensionUtils';
import WebSocket from 'ws';
import * as cp from "child_process";
import { Settings } from './settings';
// @ts-ignore
import { setCabbageMode, getCabbageMode, setVSCode, addMediaResources } from './cabbage/sharedState.js';
import * as path from 'path';
let dbg = false;
import fs from 'fs';
import * as xml2js from 'xml2js';


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
    private static mediaFileWebUris: string[] = [];

    /**
     * Initializes the Commands class by creating an output channel for logging
     * and setting up the highlight decoration for text editor elements.
     * @param context The extension context provided by VSCode.
     */
    static initialize(context: vscode.ExtensionContext, port: number) {
        if (!this.vscodeOutputChannel) {
            this.vscodeOutputChannel = vscode.window.createOutputChannel("Cabbage output");
        }
        this.highlightDecorationType = vscode.window.createTextEditorDecorationType({
            backgroundColor: 'rgba(0, 0, 0, 0.1)'
        });
        this.portNumber = port;
    }



    /**
     * Activates edit mode by setting Cabbage mode to "draggable", terminating
     * active processes, and notifying the webview panel.
     * @param websocket The WebSocket connection to the Cabbage backend.
     */
    static enterEditMode(websocket: WebSocket | undefined) {
        setCabbageMode("draggable");
        this.processes.forEach((p) => {
            p?.kill("SIGKILL");
        });
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

            case 'widgetStateUpdate':
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

                if (vscode.window.activeTextEditor) {
                    documentToSave = vscode.window.activeTextEditor.document;
                } else {
                    documentToSave = vscode.workspace.textDocuments.find(doc => doc.fileName.endsWith('.csd'));
                }

                if (documentToSave) {
                    await Commands.loadMediaFiles(documentToSave);
                    try {
                        await documentToSave.save();
                        console.log('File saved successfully:', documentToSave.fileName);

                        if (this.panel) {
                            this.panel.webview.postMessage({
                                command: "onFileChanged",
                                text: "fileSaved",
                                lastSavedFileName: documentToSave.fileName
                            });
                        }

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
        console.warn('directoryPath', directoryPath);
        this.panel = vscode.window.createWebviewPanel(
            'cabbageUIEditor',
            'Cabbage UI Editor',
            viewColumn,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.file(path.join(directoryPath, 'media')),
                    vscode.Uri.file(path.join(context.extensionPath, 'media')),
                    vscode.Uri.file(path.join(context.extensionPath, 'src'))
                ]
            }
        );


        vscode.commands.executeCommand('workbench.action.focusNextGroup');
        vscode.commands.executeCommand('workbench.action.focusPreviousGroup');

        const mainJS = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src/cabbage', 'main.js'));
        const styles = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css'));
        const cabbageStyles = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'cabbage.css'));
        const interactJS = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'interact.min.js'));
        const widgetWrapper = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'widgetWrapper.js'));
        const colourPickerJS = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'src', 'color-picker.js'));
        const colourPickerStyles = this.panel.webview.asWebviewUri(vscode.Uri.joinPath(context.extensionUri, 'media', 'color-picker.css'));

        this.panel.webview.html = ExtensionUtils.getWebViewContent(mainJS, styles, cabbageStyles, interactJS, widgetWrapper, colourPickerJS, colourPickerStyles);
        return this.panel;

    }

    /**
     * Event handler for saving a .csd document, sets up the Cabbage editor panel if needed
     * and starts the Cabbage process if the document is a valid .csd file.
     * @param editor The VSCode document being saved.
     * @param context The extension context provided by VSCode.
     */
    static async onDidSave(editor: vscode.TextDocument, context: vscode.ExtensionContext) {

        console.log("onDidSave", editor.fileName);
        this.lastSavedFileName = editor.fileName;
        this.getOutputChannel().appendLine(`Saving file: ${editor.fileName}`);


        if (!this.panel) {
            await this.setupWebViewPanel(context);
        }

        await Commands.loadMediaFiles(editor);

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

        const command = Settings.getCabbageBinaryPath('CabbageApp');
        console.log("full command:", command);
        const cabbagePath = vscode.Uri.file(command);

        try {
            await vscode.workspace.fs.stat(cabbagePath);
            this.vscodeOutputChannel.append(`Cabbage service app found: ${command}\n`);
        } catch (error) {
            this.vscodeOutputChannel.append(`ERROR: No Cabbage binary found. Please set the binary path from the command palette.\n`);
            this.checkForCabbageSrcDirectory();
            return;
        }

        // Check and update file permissions if necessary
        try {
            const stats = fs.statSync(command);
            if (!(stats.mode & fs.constants.X_OK)) {
                fs.chmodSync(command, '755');
                this.vscodeOutputChannel.append(`Updated permissions for Cabbage binary: ${command}\n`);
            }
        } catch (error) {
            this.vscodeOutputChannel.append(`ERROR: Failed to update permissions for Cabbage binary: ${command}\n`);
            return;
        }

        this.processes.forEach((p) => {
            p?.kill("SIGKILL");
        });


        if (!dbg) {
            if (editor.fileName.endsWith(".csd")) {
                const process = cp.spawn(command, [editor.fileName, this.portNumber.toString()], {});
                this.processes.push(process);
                process.stdout.on("data", (data: { toString: () => string; }) => {
                    this.vscodeOutputChannel.append(data.toString().replace(/\x1b\[m/g, ""));
                });
                process.stderr.on("data", (data: { toString: () => string; }) => {
                    this.vscodeOutputChannel.append(data.toString().replace(/\x1b\[m/g, ""));
                });
            } else {
                console.error('Invalid file name or no extension found\n');
                this.vscodeOutputChannel.append('Invalid file name or no extension found. Cabbage can only compile .csd file types.\n');
                return;
            }

            this.checkForCabbageSrcDirectory();
        }
    }

    /**
     * Checks for the existence of a Cabbage source directory in the settings.
     */
    static async checkForCabbageSrcDirectory() {
        let settings = await Settings.getCabbageSettings();
        if (settings["currentConfig"]["jsSourceDir"].length === 0) {
            setTimeout(() => {
                this.processes.forEach((p) => {
                    p?.kill("SIGKILL");
                });
                console.error('No Cabbage source path found');
                this.vscodeOutputChannel.append(`ERROR: No Cabbage source path found. Please set the source directory from the command palette.\n`);
            }, 500);
        }
    }
    /**
     * Expands and formats a JSON block within Cabbage tags in the active editor.
     */
    static expandCabbageJSON() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            return;
        }

        const document = editor.document;
        const text = document.getText();

        const startTag = '<Cabbage>';
        const endTag = '</Cabbage>';

        const startIndex = text.indexOf(startTag);
        const endIndex = text.indexOf(endTag);

        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            vscode.window.showErrorMessage("Cabbage section not found or is invalid.");
            return;
        }

        const startPos = document.positionAt(startIndex + startTag.length);
        const endPos = document.positionAt(endIndex);

        const range = new vscode.Range(startPos, endPos);
        const cabbageContent = document.getText(range).trim();

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
     * 
     * @param type The type of the new file to create.
     */
    static async createNewCabbageFile(type:string) {
        // Get the new file contents based on the type
        const newFileContents = ExtensionUtils.getNewCabbageFile(type);
        // Create a new untitled document with the new file contents
        const document = await vscode.workspace.openTextDocument({ content: newFileContents, language: 'plaintext' });

        // Open the new document in a new editor tab
        await vscode.window.showTextDocument(document);
    }

    /**
     * Formats the document content by applying predefined formatting rules.
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

    // Function to get all .csd files in a directory
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


    // Function to make files read-only
    static makeFilesReadOnly(files: string[]) {
        files.forEach(file => {
            try {
                fs.chmodSync(file, '444'); // Set file to read-only
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to set file as read-only: ${file}. Error: ${error.message}`);
            }
        });
    }

    // Function to check if a file is a protected example file
    static isProtectedExample(filePath: string): boolean {
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (!extension) {
            return false;
        }
        const examplesPath = path.join(extension.extensionPath, 'examples');
        return filePath.startsWith(examplesPath);
    }

    // Function to revert changes if the file is a protected example
    static async revertChangesIfProtected(editor: vscode.TextDocument) {
        if (Commands.isProtectedExample(editor.fileName)) {
            const fileContent = fs.readFileSync(editor.fileName, 'utf-8');
            console.log(fileContent);
            if (fileContent !== editor.getText()) {
                const document = await vscode.workspace.openTextDocument(editor.fileName);
                const edit = new vscode.WorkspaceEdit();
                edit.replace(document.uri, new vscode.Range(0, 0, document.lineCount, 0), fileContent);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage('Changes to protected example files are not allowed. Reverting to original content.');
            }
        }
    }

    /**
     * Provides a dropdown list of example for the user to open
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
        const fileUri = await vscode.window.showSaveDialog({
            saveLabel: 'Save Plugin',
            filters: {
                'VST3 Plugin': ['vst3']
            }
        });

        if (!fileUri) {
            console.log('No file selected.');
            return;
        }

        //this.getOutputChannel().appendLine(`Error, please fix the default assets directory`);
        const config = vscode.workspace.getConfiguration('cabbage');
        const destinationPath = fileUri.fsPath;
        const indexDotHtml = ExtensionUtils.getIndexHtml();
        const pluginName = path.basename(destinationPath, '.vst3');
        const jsSource = config.get<string>('pathToJsSource');
        let pathToCabbageJsSource = '';
        let cabbageCSS = '';
        if (jsSource) {
            pathToCabbageJsSource = path.join(jsSource, 'cabbage');
            cabbageCSS = path.join(jsSource, 'media', 'cabbage.css');
        }


        let binaryFile = '';
        switch (type) {
            case 'VST3Effect':
                binaryFile = Settings.getCabbageBinaryPath('CabbageVST3Effect');
                break;
            case 'VST3Synth':
                binaryFile = Settings.getCabbageBinaryPath('CabbageVST3Synth');
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
                console.error('Not valid type provided for export');
                break;
        }

        // Check if destination folder exists and ask for overwrite permission
        if (fs.existsSync(destinationPath)) {
            const overwrite = await vscode.window.showWarningMessage(
                `Folder ${pluginName} already exists. Do you want to replace it?`,
                'Yes', 'No'
            );
            if (overwrite !== 'Yes') {
                console.log('Operation cancelled by user');
                return;
            }
            // Remove existing directory
            await fs.promises.rm(destinationPath, { recursive: true });
        }

        try {
            // 1. Create the export directory
            await fs.promises.mkdir(destinationPath, { recursive: true });
            console.log('Created export directory:', destinationPath);

            // 2. Copy JS source files
            await Commands.copyDirectory(pathToCabbageJsSource, destinationPath);
            console.log('Copied JS source files');

            // 3. Create and write index.html
            const indexHtmlPath = path.join(destinationPath, 'index.html');
            await fs.promises.writeFile(indexHtmlPath, indexDotHtml);
            console.log('Created index.html');

            // 4. Copy CSS file
            const cssFileName = path.basename(cabbageCSS);
            const cssDestPath = path.join(destinationPath, cssFileName);
            await fs.promises.copyFile(cabbageCSS, cssDestPath);
            console.log('Copied CSS file');

            // Copy the VST3 plugin
            await Commands.copyDirectory(binaryFile, destinationPath);
            console.log('Plugin successfully copied to:', destinationPath);

            // Rename and update the .csd file
            const oldCsdPath = path.join(destinationPath, 'CabbageVST3Effect.csd');
            const newCsdPath = path.join(destinationPath, `${pluginName}.csd`);

            if (this.lastSavedFileName) {
                const newContent = await fs.promises.readFile(this.lastSavedFileName, 'utf8');
                await fs.promises.writeFile(newCsdPath, newContent);
                await fs.promises.unlink(oldCsdPath);
                console.log('CSD file updated and renamed');
            }

            // Rename the executable file inside the folder
            const macOSDirPath = path.join(destinationPath, 'Contents', 'MacOS');
            const originalFilePath = path.join(macOSDirPath, 'CabbageVST3Effect');
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
                const dict = result.plist.dict[0].key;
                const executableIndex = dict.indexOf('CFBundleExecutable');
                if (executableIndex !== -1) {
                    result.plist.dict[0].string[executableIndex] = pluginName;
                }
                const updatedPlist = builder.buildObject(result);
                await fs.promises.writeFile(plistFilePath, updatedPlist);
                console.log(`CFBundleExecutable updated to "${pluginName}" in Info.plist`);
            });

        } catch (err) {
            console.error('Error during plugin copy process:', err);
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

    /**
     * Reads the media folder and populates the mediaFileWebUris array.
     * @param editor The VSCode document being saved.
     */
    private static async loadMediaFiles(editor: vscode.TextDocument) {
        const fullPath = editor.uri.fsPath; // Get the full path of the current file
        const parentDirectory = path.dirname(fullPath); // Get the parent directory
        const mediaFolderPath = path.join(parentDirectory, 'media'); // Construct the media folder path

        try {
            // Read the contents of the media folder
            const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(mediaFolderPath));

            // Filter and create web URIs for each file
            if (this.panel) { // Ensure the panel is defined
                for (const [fileName, fileType] of files) {
                    if (fileType === vscode.FileType.File) { // Only include files
                        const fileUri = vscode.Uri.file(path.join(mediaFolderPath, fileName));
                        const webUri = this.panel.webview.asWebviewUri(fileUri); // Convert to webview URI
                        this.mediaFileWebUris.push(webUri.toString());
                        console.warn(webUri.toString());
                    }
                }
                addMediaResources(this.mediaFileWebUris);
            } else {
                console.warn("Webview panel is not defined.");
            }
        } catch (error) {
            // console.error('Error reading media folder:', error);
            // vscode.window.showErrorMessage('Failed to read media folder. Please check if it exists.');
        }
    }
}
