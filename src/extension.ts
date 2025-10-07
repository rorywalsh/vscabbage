// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
// @ts-ignore
import * as cp from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import * as vscode from 'vscode';
import WebSocket, { Server as WebSocketServer } from 'ws'; // Import WebSocket types
// @ts-ignore
import { setCabbageMode } from './cabbage/sharedState.js';
import { Commands } from './commands';
import { ExtensionUtils } from './extensionUtils';
import { Settings } from './settings';

// cache for protected files
const originalContentCache: { [key: string]: string } = {};


// Setup websocket server
let wss: WebSocketServer;
let websocket: WebSocket | undefined;
let firstMessages: any[] = [];
let warningDecoration: vscode.TextEditorDecorationType | undefined;


/**
 * Activates the Cabbage extension, setting up commands, configuration change
 * listeners, and event handlers for saving documents, opening documents, and
 * changing tabs. Also sets up a status bar item and initializes the WebSocket
 * server. *
 * @param context The extension context for managing VS Code subscriptions.
 */
export async function activate(context: vscode.ExtensionContext):
    Promise<void> {
    Commands.initialize();

    const currentVersion =
        vscode.extensions.getExtension('your.extension-id')?.packageJSON.version;
    const previousVersion = context.globalState.get<string>('extensionVersion');

    if (!previousVersion) {
        // First-time install
        vscode.window.showInformationMessage(
            'Thank you for installing Cabbage extension!');
        onInstall();
    } else if (previousVersion !== currentVersion) {
        // Extension updated
        vscode.window.showInformationMessage(
            `Extension updated to version ${currentVersion}`);
        onUpdate(previousVersion, currentVersion);
    }

    // Update the stored version
    context.globalState.update('extensionVersion', currentVersion);

    // Cache all protected files at the start
    const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
    if (extension) {
        const examplesPath = path.join(extension.extensionPath, 'examples');
        const csdFiles = Commands.getCsdFiles(examplesPath);
        csdFiles.forEach(file => {
            originalContentCache[file] = fs.readFileSync(file, 'utf-8');
        });
    }

    Commands.createStatusBarIcon(context);

    // Create a decoration type for the warning comment so it stands out
    warningDecoration = vscode.window.createTextEditorDecorationType({
        fontStyle: 'italic',
        color: 'rgba(102, 102, 102, 0.9)',
        overviewRulerLane: vscode.OverviewRulerLane.Right
    });

    // Helper: find warning comment blocks and apply decoration
    const updateWarningDecorations = (editor?: vscode.TextEditor) => {
        const editors = editor ? [editor] : vscode.window.visibleTextEditors;
        const regex = /<!--[\s\S]*?⚠️\s*Warning:[\s\S]*?-->/g;
        for (const ed of editors) {
            try {
                if (!ed || !ed.document) continue;
                const text = ed.document.getText();
                const decorations: vscode.DecorationOptions[] = [];
                let match: RegExpExecArray | null;
                while ((match = regex.exec(text)) !== null) {
                    const start = ed.document.positionAt(match.index);
                    const end = ed.document.positionAt(match.index + match[0].length);
                    decorations.push({ range: new vscode.Range(start, end) });
                }
                if (warningDecoration) {
                    ed.setDecorations(warningDecoration, decorations);
                }
            } catch (err) {
                console.error('Failed to update warning decorations:', err);
            }
        }
    };

    // Initial decorate for currently visible editors
    updateWarningDecorations();

    // Update decorations on relevant editor/document events
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) updateWarningDecorations(editor);
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((doc) => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
        if (editor) updateWarningDecorations(editor);
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === event.document);
        if (editor) updateWarningDecorations(editor);
    }));

    // Get the output channel from Commands class
    const vscodeOutputChannel = Commands.getOutputChannel();
    vscodeOutputChannel.show(true);

    vscodeOutputChannel.appendLine('   _____      _     _                      ');
    vscodeOutputChannel.appendLine('  / ____|    | |   | |                     ');
    vscodeOutputChannel.appendLine(' | |     __ _| |__ | |__   __ _  __ _  ___ ');
    vscodeOutputChannel.appendLine(' | |    / _` | \'_ \\| \'_ \\ / _` |/ _` |/ _ \\');
    vscodeOutputChannel.appendLine(' | |___| (_| | |_) | |_) | (_| | (_| |  __/');
    vscodeOutputChannel.appendLine('  \\_____\\__,_|_.__/|_.__/ \\__,_|\\__, |\\___|');
    vscodeOutputChannel.appendLine('                                 __/ |     ');
    vscodeOutputChannel.appendLine('                                |___/      ');
    vscodeOutputChannel.appendLine('');
    vscodeOutputChannel.appendLine(' The audio development environment for Ccsound 7');

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.openCabbageExample', async () => {
            await Commands.openCabbageExample();
        }));

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.selectSamplingRate', async () => {
            await Settings.selectSamplingRate();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.selectBufferSize', async () => {
            await Settings.selectBufferSize();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.selectAudioDriver', async () => {
            Commands.startCabbageServer(false);
            await Settings.selectAudioDriver();
            setTimeout(() => { Commands.startCabbageServer(true); }, 1000);
        }));

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.selectAudioOutputDevice', async () => {
            await Commands.withServerRestart(() => Settings.selectAudioDevice('output'));
        }));

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.selectAudioInputDevice', async () => {
            await Commands.withServerRestart(() => Settings.selectAudioDevice('input'));
            // clear sound file config when selecting live audio input
            await context.globalState.update('soundFileInput', undefined);
            Commands.sendFileToChannel(context, websocket, '', -1);
        }));

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.selectMidiOutputDevice', async () => {
            await Commands.withServerRestart(() => Settings.selectMidiDevice('output'));
        }));

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.selectMidiInputDevice', async () => {
            await Commands.withServerRestart(() => Settings.selectMidiDevice('input'));
        }));

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.setCabbageSourcePath', async () => {
            await Commands.withServerRestart(() => Settings.selectCabbageJavascriptSourcePath());
        }));

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.setCabbageBinaryPath', async () => {
            await Commands.withServerRestart(() => Settings.selectCabbageBinaryPath());
        }));

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.openOpcodeReference', async () => {
            await Commands.openOpcodeReference(context);
        }));


    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.setCsoundIncludeDir', async () => {
            await Settings.selectCsoundIncludeDir();
        }));


    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.setCsoundLibraryDir', async () => {
            await Settings.selectCsoundLibraryDir();
        }));


    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.resetCabbageAppSettingsFiles', async () => {
            await Settings.resetSettingsFile();
        }));


    const configurationChangeListener = vscode.workspace.onDidChangeConfiguration(
        (event: vscode.ConfigurationChangeEvent) => {
            Settings.updatePath(event);
        });

    // Add the listener to the context subscriptions so it's disposed
    // automatically
    context.subscriptions.push(configurationChangeListener);

    // Listen for theme changes and update webview accordingly
    const themeChangeListener = vscode.window.onDidChangeActiveColorTheme(() => {
        const panel = Commands.getPanel();
        if (panel) {
            const isDarkTheme = vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark ||
                vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast;
            panel.webview.postMessage({
                command: 'updateTheme',
                isDarkTheme: isDarkTheme
            });
        }
    });

    context.subscriptions.push(themeChangeListener);

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.makeForDaisy', async () => {
            await Commands.makeForDaisy('');
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.makeBootForDaisy', async () => {
            await Commands.makeForDaisy('program-boot');
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.makeCleanForDaisy', async () => {
            await Commands.makeForDaisy('clean');
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.makeDfuForDaisy', async () => {
            await Commands.makeForDaisy('program-dfu');
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.exportVST3Effect', async () => {
            await Commands.exportInstrument('VST3Effect');
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.exportVST3Synth', async () => {
            await Commands.exportInstrument('VST3Synth');
        }));

    if (os.platform() === 'darwin') {
        context.subscriptions.push(
            vscode.commands.registerCommand('cabbage.exportAUSynth', async () => {
                await Commands.exportInstrument('AUv2Synth');
            }));
        context.subscriptions.push(
            vscode.commands.registerCommand('cabbage.exportAUEffect', async () => {
                await Commands.exportInstrument('AUv2Effect');
            }));
    }

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.expandCabbageJSON', Commands.expandCabbageJSON));

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.collapseCabbageJSON', Commands.collapseCabbageJSON));

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.formatDocument', Commands.formatDocument));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.goToDefinition', (arg: vscode.TextEditor | vscode.Uri | undefined) => {
            let editor: vscode.TextEditor | undefined;

            // Case 1: arg is a TextEditor (has .selection)
            if (arg && typeof (arg as vscode.TextEditor).selection !== "undefined") {
                editor = arg as vscode.TextEditor;
            }
            // Case 2: arg is a Uri (no .selection), open the document
            else if (arg instanceof vscode.Uri) {
                vscode.window.showTextDocument(arg).then((openedEditor) => {
                    ExtensionUtils.goToDefinition(openedEditor);
                });
                return;
            }
            // Case 3: fall back to active editor
            else {
                editor = vscode.window.activeTextEditor;
            }

            if (!editor) {
                vscode.window.showErrorMessage("No active editor found.");
                return;
            }

            ExtensionUtils.goToDefinition(editor);
        })
    );

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.compile', () => {
            onCompileInstrument(context);
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.editMode', () => {
            Commands.enterEditMode(websocket);
        }));

    // utility function to send text to Cabbage instrument overriding the current
    // realtime audio inputs
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.sendFileToChannel1and2', (uri: vscode.Uri) => {
            Commands.sendFileToChannel(context, websocket, uri.fsPath, 12);
        }));
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.sendFileToChannel1', (uri: vscode.Uri) => {
            Commands.sendFileToChannel(context, websocket, uri.fsPath, 1);
        }));
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.sendFileToChannel2', (uri: vscode.Uri) => {
            Commands.sendFileToChannel(context, websocket, uri.fsPath, 2);
        }));

    // Register the commands for creating new Cabbage files
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.createNewCabbageEffect', () => {
            Commands.createNewCabbageFile('effect');
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.createNewCabbageSynth', () => {
            Commands.createNewCabbageFile('synth');
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.manageServer', () => {
            Commands.manageServer();
        }));

    // Register command for jumping to widget definition
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.jumpToWidgetObject', () => {
            Commands.jumpToWidget();
        }));
    // Register the command for adding a new Cabbage section
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.addCabbageSection', () => {
            Commands.addCabbageSection();
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.updateToCabbage3', () => {
            Commands.updateCodeToJSON();
        }));

    /**
     * Event handler triggered when the text of a document is changed.
     * - Reverts changes to protected example files.
     *
     * @param event The event containing the text document that was changed.
     */
    vscode.workspace.onDidChangeTextDocument(async (event) => {
        const editor = event.document;
        if (editor.fileName.endsWith('.csd') &&
            Commands.isProtectedExample(editor.fileName)) {
            const originalContent = originalContentCache[editor.fileName];
            if (originalContent !== editor.getText()) {
                const edit = new vscode.WorkspaceEdit();
                edit.replace(
                    editor.uri, new vscode.Range(0, 0, editor.lineCount, 0),
                    originalContent);
                await vscode.workspace.applyEdit(edit);
                vscode.window.showInformationMessage(
                    'Changes to example files are not permitted.\n Please use \'Save-As\' if you wish to modify this file.');
                Commands.getOutputChannel().appendLine(
                    `Changes to example files are not permitted. Please use 'Save-As' if you wish to modify this file.`);
            }
        }
    });

    vscode.workspace.onDidOpenTextDocument((editor) => {
        ExtensionUtils.sendTextToWebView(
            editor, 'onFileChanged', Commands.getPanel());
    });

    vscode.workspace.onDidSaveTextDocument((document) => {
        if (document.fileName.endsWith('.csd') && Commands.hasCabbageServerStarted()) {
            onCompileInstrument(context);
        }
    });

    vscode.window.tabGroups.onDidChangeTabs(
        (tabs) => {
            // triggered when tab changes
        });
}



/**
 *   Compile handler triggered when via the compile command.
 * - Tries to save the file first as Cabbage/Csound will read the file from disk
 * - Checks if the saved document is a .csd file with Cabbage-specific tags.
 * - Sets Cabbage mode to "play" and ensures the Cabbage webview panel is open
 * - Waits for the WebSocket connection to be ready before handling any messages
 * from the webview.
 * - Listens for messages from the webview and processes them via WebSocket if
 * available.
 *
 * @param editor The text editor containing the saved document.
 */
async function onCompileInstrument(context: vscode.ExtensionContext) {

    let editor = vscode.window.activeTextEditor?.document;
    // if editor is not a text file but an instrument panel
    if (!editor) {
        const panel = Commands.getPanel();
        if (panel) {
            const targetDocument =
                await ExtensionUtils.findDocument(panel.title + '.csd', true);
            if (!targetDocument) {
                console.log(
                    'Cabbage: No editor or document with filename Unhinged.csd found.');
                return;
            }
            editor = targetDocument;
        }
    } else {
        await ExtensionUtils.saveDocumentIfDirty(editor);
    }

    // kill any other processes running
    // websocket?.send(JSON.stringify({ command: "stopAudio", text: "" }));


    if (editor) {
        if (!editor.fileName.endsWith('.csd') ||
            !await Commands.hasCabbageTags(editor)) {
            console.warn(
                'Cabage: No cabbage tags found in document, returning early.');
            return;
        }

        setCabbageMode('play');
        const config = vscode.workspace.getConfiguration('cabbage');

        if (!Commands.getPanel()) {
            console.warn('Cabbage: Cabbage: Creating new webview panel');
            Commands.setupWebViewPanel(context);
        } else {
            const fullPath = vscode.window.activeTextEditor?.document.uri.fsPath;
            const fileName =
                fullPath ? path.basename(fullPath, path.extname(fullPath)) : '';
            const panel = Commands.getPanel();
            if (panel && fileName.length > 0) {
                try {
                    panel.title = fileName;
                } catch (err) {
                    console.error("Failed to set panel title:", err);
                }
            }
        }


        await Commands.onDidSave(editor, context);

        if (websocket) {
            websocket.send(JSON.stringify({
                command: "onFileChanged",
                lastSavedFileName: editor.fileName
            }));
        }

        const vscodeOutputChannel = Commands.getOutputChannel();
        if (config.get("clearConsoleOnCompile")) {
            vscodeOutputChannel.clear();
        }

        // Send any saved sound file inputs to channels after a delay
        const soundFileInput = context.globalState.get<{ [key: number]: string }>(
            'soundFileInput', {});
        setTimeout(() => {
            for (const [channel, file] of Object.entries(soundFileInput)) {
                if (Number(channel) > 0) {
                    vscode.window.showInformationMessage(
                        `Routing ${file} to channel ${channel}`);
                }
                Commands.sendFileToChannel(context, undefined, file, Number(channel));
            }
        }, 2000);

        const panel = Commands.getPanel();
        if (panel) {
            panel.webview.onDidReceiveMessage(message => {
                Commands.handleWebviewMessage(
                    message, undefined, firstMessages, vscode.window.activeTextEditor,
                    context);
            });
        } else {
            console.warn('Cabbage: Cabbage: No webview found');
        }
    }
}



// Function to check if the path exists with additional checks
function pathExists(p: string): boolean {
    try {
        const resolvedPath = fs.realpathSync(p);
        return fs.existsSync(resolvedPath);
    } catch (error) {
        console.error(`Error checking path: ${p}`, error);
        return false;
    }
}
/*
 * Logic to execute when the extension is installed for the first time. On MacOS
 * we need to sign the Csound library if it is not already signed. If it's only
 * adhoc signed, we sign it again.
 */
function onInstall() {
    // Ad-hoc sign the CsoundLib64.framework if running on macOS and not already
    // signed
    if (process.platform === 'darwin') {
        if (!pathExists('/Applications/Csound/CsoundLib64.framework')) {
            Commands.getOutputChannel().append(
                'ERROR: /Applications/Csound/CsoundLib64.framework not found\nA version of Csound 7 is required for the Cabbage extension to work\n');
            return;
        }
        const output =
            cp.execSync('codesign -dvv /Applications/Csound/CsoundLib64.framework')
                .toString();
        if (!output.includes('Authority=Apple Development')) {
            return;
        } else {
            try {
                // cp.execSync('codesign --force --deep --sign -
                // /Applications/Csound/CsoundLib64.framework');
                Commands.getOutputChannel().append(
                    'Ad-hoc signed /Applications/Csound/CsoundLib64.framework\n');
            } catch (signError) {
                Commands.getOutputChannel().append(
                    'ERROR: Failed to ad-hoc sign /Applications/Csound/CsoundLib64.framework\n');
                return;
            }
        }
    } else if (process.platform === 'win32') {
        if (!pathExists('C:/Program Files/Csound7/bin/csound64.dll')) {
            Commands.getOutputChannel().append(
                'ERROR: C:/Program Files/Csound7/bin/csound64.dll not found\nA version of Csound 7 is required for the Cabbage extension to work\n');
        }
    } else {
        if (!pathExists('/usr/local/bin/csound') &&
            !pathExists('/usr/local/lib/csound')) {
            Commands.getOutputChannel().append(
                'ERROR: /usr/local/bin/csound and /usr/local/lib/csound not found\nA version of Csound 7 is required for the Cabbage extension to work\n');
        }
    }
}


/**
 * Logic to execute when the extension is updated to a new version.
 * @param previousVersion The previous version of the extension.
 * @param currentVersion The current version of the extension.
 */
function onUpdate(previousVersion: string, currentVersion: string) {
    // Logic to execute on update
    console.log(
        `Extension updated from version ${previousVersion} to ${currentVersion}`);
}


/**
 * Deactivates the Cabbage extension by terminating any active child processes
 * associated with the Commands module. This ensures that all processes are
 * cleaned up when the extension is disabled. This function also ensures that
 * the contents of protected files match the cache before deactivating the
 * extension.
 */
export function deactivate() {
    // Existing process cleanup
    websocket?.send(JSON.stringify({ command: "stopAudio", text: "" }));
    Commands.getProcesses().forEach((p) => {
        p?.kill('SIGKILL');
    });

    // Add WebSocket server cleanup
    if (wss) {
        wss.close(() => {
            console.log('Cabbage: WebSocket server closed');
        });
    }

    // Add WebSocket client cleanup
    if (websocket) {
        websocket.close();
    }
}

/**
 * Waits until the WebSocket connection is established and resolves the promise
 * with the WebSocket instance once it is ready. This function is useful to
 * ensure the WebSocket is available before performing operations that depend on
 * it. *
 * @returns A promise that resolves with the WebSocket instance when ready.
 */
// function waitForWebSocket(): Promise<WebSocket> {
//     return new Promise((resolve) => {
//         const interval = setInterval(() => {
//             if (websocket) {
//                 clearInterval(interval);  // Stop checking once websocket is
//                 valid resolve(websocket);       // Resolve the promise with
//                 the WebSocket
//             }
//         }, 100); // Check every 100 ms
//     });
// }

/**
 * Sets up a WebSocket server on a free port and listens for incoming
 * connections. The server is used to communicate between the Cabbage service
 * app and the Cabbage webview panel.
 */
export async function setupWebSocketServer(freePort?: number): Promise<void> {
    // Close existing server if it exists
    if (wss) {
        wss.close();
    }

    wss = new WebSocket.Server({ port: freePort });

    // Create a promise to wait for the client connection
    const clientConnectedPromise = new Promise((resolve) => {
        wss.on('connection', (ws) => {
            console.warn('Cabbage: Client connected');

            // Flush the first messages received from Cabbage if any
            firstMessages.forEach((msg) => {
                const panel = Commands.getPanel();
                if (panel) {
                    panel.webview.postMessage({
                        command: 'widgetUpdate',
                        channel: msg['channel'],
                        data: msg['data'],
                        currentCsdPath: Commands.getCurrentFileName(),
                    });
                }
            });
            firstMessages = [];

            websocket = ws;

            // Add error handler for the websocket
            ws.on('error', (error) => {
                console.error('Cabbage: WebSocket error:', error);
            });

            // Listen for messages from the Cabbage service app
            ws.on('message', (message) => {
                const msg = JSON.parse(message.toString());

                if (msg.hasOwnProperty('command')) {
                    if (msg['command'] === 'widgetUpdate') {
                        const panel = Commands.getPanel();
                        if (panel) {
                            if (msg.hasOwnProperty('data')) {
                                panel.webview.postMessage({
                                    command: 'widgetUpdate',
                                    channel: msg['channel'],
                                    data: msg['data'],
                                    currentCsdPath: Commands.getCurrentFileName(),
                                });
                            } else if (msg.hasOwnProperty('value')) {
                                panel.webview.postMessage({
                                    command: 'widgetUpdate',
                                    channel: msg['channel'],
                                    value: msg['value'],
                                    currentCsdPath: Commands.getCurrentFileName(),
                                });
                            }
                        }
                    }
                    else if (msg['command'] === 'failedToCompile') {
                        // Handle panel disposal
                        let panel = Commands.getPanel();
                        if (panel) {
                            panel.dispose();
                            panel = undefined;
                        }
                    }
                }
            });

            ws.on('close', () => console.log('Cabbage: Client disconnected'));

            // Resolve the promise to indicate a client connection
            resolve(ws);
        });
    });


    // Add an error event listener to check if the server encounters an issue
    wss.on('error', (error) => {
        const vscodeOutputChannel = Commands.getOutputChannel();
        if ((error as any).code === 'EADDRINUSE') {
            console.error('Cabbage: Port 9991 is already in use.');
            vscodeOutputChannel.appendLine('Port 9991 is already in use.');
        } else {
            console.error('Cabbage: Failed to initialize WebSocket server:', error);
            vscodeOutputChannel.appendLine('Failed to initialize WebSocket server:');
        }
        // Optional: shut down the server if initialization failed
        wss.close();
    });

    // Add a listening event to confirm the server started successfully
    wss.on('listening', () => {
        console.log(
            `Cabbage: WebSocket server successfully started on port ${freePort} - listening for connection`);
    });

    // Wait for the client to connect before returning
    await clientConnectedPromise;
}
