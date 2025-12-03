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
// WebSocket support removed - communication now uses stdin/stdout pipes
// @ts-ignore
import { setCabbageMode, getCabbageMode } from './cabbage/sharedState.js';
import { Commands } from './commands';
import { ExtensionUtils } from './extensionUtils';
import { Settings } from './settings';

// cache for protected files
const originalContentCache: { [key: string]: string } = {};

/**
 * Validates the JSON in the Cabbage section of a CSD file
 * @param documentText The full text content of the CSD file
 * @returns An object with valid flag, error message, and position info if invalid
 */
function validateCabbageJSON(documentText: string): { valid: boolean; error?: string; position?: { line: number; column: number } } {
    // Extract Cabbage section
    const cabbageRegex = /<Cabbage>([\s\S]*?)<\/Cabbage>/;
    const match = documentText.match(cabbageRegex);

    if (!match) {
        // No Cabbage section found - this is okay, might be a plain Csound file
        return { valid: true };
    }

    const cabbageContent = match[1].trim();
    const cabbageStartIndex = match.index! + match[0].indexOf(match[1]);

    // Check if it's an external file reference
    if (cabbageContent.includes('#include')) {
        // External JSON file - we'll validate it when loaded
        return { valid: true };
    }

    // Try to parse the JSON
    try {
        JSON.parse(cabbageContent);
        return { valid: true };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);

        // Try to extract position from error message (method 1: "at position X")
        const positionMatch = errorMessage.match(/at position (\d+)/);
        let position: { line: number; column: number } | undefined;

        if (positionMatch) {
            const jsonPosition = parseInt(positionMatch[1]);
            // Convert JSON position to document position
            const documentPosition = cabbageStartIndex + jsonPosition;

            // Calculate line and column
            const beforeError = documentText.substring(0, documentPosition);
            const lines = beforeError.split('\n');
            let line = lines.length - 1;
            let column = lines[lines.length - 1].length;

            // For errors about missing commas or braces, the position is at the unexpected token.
            // If this looks like a missing comma, highlight the end of the previous line instead.
            if (errorMessage.includes('Expected \',\'') || errorMessage.includes('Unexpected token') || errorMessage.includes('Unexpected string')) {
                const allLines = documentText.split('\n');
                const currentLine = allLines[line];
                const trimmedStart = currentLine.trimStart();
                const leadingWhitespace = currentLine.length - trimmedStart.length;

                // If we're at the beginning of a line (after whitespace), it's likely a missing comma
                if (column <= leadingWhitespace + 1) {
                    // Highlight the end of the previous line where comma should be
                    if (line > 0) {
                        const prevLine = allLines[line - 1];
                        const prevLineEnd = prevLine.length;
                        line = line - 1;
                        column = Math.max(0, prevLineEnd - 1);
                    }
                }
            }

            position = { line, column };
        } else {
            // Method 2: Try to extract the JSON snippet from the error message and find it in the document
            // Error messages like: Unexpected token ']', ..."98\n    },\n]" is not valid JSON
            // The snippet might have literal newlines or escaped \n
            const snippetMatch = errorMessage.match(/\.{3}"([^"]+)"[\s\w]*is not valid JSON/);

            if (snippetMatch) {
                let snippet = snippetMatch[1];

                // Try both: with escaped newlines converted and as-is
                const snippetVariants = [
                    snippet,
                    snippet.replace(/\\n/g, '\n').replace(/\\t/g, '\t').replace(/\\r/g, '\r')
                ];

                for (const variant of snippetVariants) {
                    const snippetIndex = cabbageContent.indexOf(variant);

                    if (snippetIndex !== -1) {
                        // Found the snippet - the error is at the end of this snippet
                        const documentPosition = cabbageStartIndex + snippetIndex + variant.length - 1;

                        // Calculate line and column
                        const beforeError = documentText.substring(0, documentPosition);
                        const lines = beforeError.split('\n');
                        const line = lines.length - 1;
                        const column = lines[lines.length - 1].length;

                        position = { line, column };
                        break;
                    }
                }
            }

            // Method 3: If we still don't have a position and error mentions "Unexpected token",
            // search for the problematic token in the Cabbage section
            if (!position && errorMessage.includes('Unexpected token')) {
                const tokenMatch = errorMessage.match(/Unexpected token[:\s]+'?([^\s'",]+)/i);
                if (tokenMatch) {
                    const unexpectedToken = tokenMatch[1];
                    // For ']', search backwards from the end for a closing bracket after a comma
                    const tokenIndex = cabbageContent.lastIndexOf(unexpectedToken);
                    if (tokenIndex !== -1) {
                        const documentPosition = cabbageStartIndex + tokenIndex;
                        const beforeError = documentText.substring(0, documentPosition);
                        const lines = beforeError.split('\n');
                        const line = lines.length - 1;
                        const column = lines[lines.length - 1].length;
                        position = { line, column };
                    }
                }
            }
        }

        // Post-process: For trailing comma errors (Unexpected token ']' or '}'), 
        // check if we should highlight the previous line instead
        if (position && errorMessage.includes('Unexpected token')) {
            const allLines = documentText.split('\n');
            const errorLine = allLines[position.line];

            // If the error line starts with ] or } and previous line ends with comma, 
            // highlight the previous line (where the trailing comma is)
            if (errorLine && errorLine.trim().match(/^[\]\}]/) && position.line > 0) {
                const prevLine = allLines[position.line - 1];
                if (prevLine && prevLine.trimEnd().endsWith(',')) {
                    // Move to the previous line, at the position of the trailing comma
                    position = {
                        line: position.line - 1,
                        column: prevLine.trimEnd().length - 1
                    };
                }
            }
        }

        // Clean up the error message to remove position info since we provide visual indicators
        const cleanErrorMessage = errorMessage.replace(/\s*at position \d+.*$/, '').replace(/\s*\(line \d+ column \d+\).*$/, '');

        return {
            valid: false,
            error: cleanErrorMessage,
            position
        };
    }
}
// WebSocket server removed; communication happens over stdin/stdout pipes
// (websocket variables and server were removed)
let firstMessages: any[] = [];
let warningDecoration: vscode.TextEditorDecorationType | undefined;
let jsonCommentDecoration: vscode.TextEditorDecorationType | undefined;


/**
 * Activates the Cabbage extension, setting up commands, configuration change
 * listeners, and event handlers for saving documents, opening documents, and
 * changing tabs. Also sets up a status bar item and initializes backend
 * communication.
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

    // Create a decoration type for "//" comment properties in Cabbage JSON
    const createJsonCommentDecoration = () => {
        const config = vscode.workspace.getConfiguration('cabbage');
        const color = config.get<string>('customCommentDecorationColor') || '#666666';
        return vscode.window.createTextEditorDecorationType({
            fontStyle: 'italic',
            color: color,
            opacity: '0.8'
        });
    };
    jsonCommentDecoration = createJsonCommentDecoration();

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

    // Helper: find "//" comment properties in Cabbage JSON sections and apply decoration
    const updateJsonCommentDecorations = (editor?: vscode.TextEditor) => {
        const editors = editor ? [editor] : vscode.window.visibleTextEditors;
        for (const ed of editors) {
            try {
                if (!ed || !ed.document || !ed.document.fileName.endsWith('.csd')) continue;
                const text = ed.document.getText();
                const decorations: vscode.DecorationOptions[] = [];

                // Find Cabbage section
                const cabbageRegex = /<Cabbage>([\s\S]*?)<\/Cabbage>/g;
                let cabbageMatch: RegExpExecArray | null;

                while ((cabbageMatch = cabbageRegex.exec(text)) !== null) {
                    const cabbageContent = cabbageMatch[1];
                    const cabbageStartIndex = cabbageMatch.index + '<Cabbage>'.length;

                    // Find all "//" properties within the Cabbage section
                    // Match: "//": "any value" or "//": 'any value'
                    const commentRegex = /"\/\/"\s*:\s*(?:"[^"]*"|'[^']*'|[^,}\]]+)/g;
                    let commentMatch: RegExpExecArray | null;

                    while ((commentMatch = commentRegex.exec(cabbageContent)) !== null) {
                        const matchStart = cabbageStartIndex + commentMatch.index;
                        const matchEnd = matchStart + commentMatch[0].length;
                        const start = ed.document.positionAt(matchStart);
                        const end = ed.document.positionAt(matchEnd);
                        decorations.push({ range: new vscode.Range(start, end) });
                    }
                }

                if (jsonCommentDecoration) {
                    ed.setDecorations(jsonCommentDecoration, decorations);
                }
            } catch (err) {
                console.error('Failed to update JSON comment decorations:', err);
            }
        }
    };

    // Initial decorate for currently visible editors
    updateWarningDecorations();
    updateJsonCommentDecorations();

    // Update decorations on relevant editor/document events
    context.subscriptions.push(vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
            updateWarningDecorations(editor);
            updateJsonCommentDecorations(editor);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((doc) => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
        if (editor) {
            updateWarningDecorations(editor);
            updateJsonCommentDecorations(editor);
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === event.document);
        if (editor) {
            updateWarningDecorations(editor);
            updateJsonCommentDecorations(editor);
        }
    }));

    // Listen for configuration changes to update decoration color
    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('cabbage.customCommentDecorationColor')) {
            // Dispose old decoration and create new one with updated color
            if (jsonCommentDecoration) {
                jsonCommentDecoration.dispose();
            }
            jsonCommentDecoration = createJsonCommentDecoration();
            // Refresh all visible editors
            updateJsonCommentDecorations();
        }
    }));

    // Get the output channel from Commands class
    const vscodeOutputChannel = Commands.getOutputChannel();
    vscodeOutputChannel.show(true);

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
            Commands.sendFileToChannel(context, '', -1);
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

    // Custom widget commands
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.setCustomWidgetDirectory', async () => {
            await Settings.selectCustomWidgetDirectory();
        }));
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.createNewCustomWidget', async () => {
            await Settings.createNewCustomWidget();
        }));

    // Command to set custom comment decoration color
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.setCustomCommentDecorationColor', async () => {
            const config = vscode.workspace.getConfiguration('cabbage');
            const currentColor = config.get<string>('customCommentDecorationColor') || '#666666';

            const colorInput = await vscode.window.showInputBox({
                prompt: 'Enter a color for "//" comment decorations (hex format, e.g., #FF5733)',
                value: currentColor,
                placeHolder: '#666666',
                validateInput: (value) => {
                    // Validate hex color format
                    if (!/^#[0-9A-Fa-f]{6}$/.test(value)) {
                        return 'Please enter a valid hex color (e.g., #FF5733)';
                    }
                    return null;
                }
            });

            if (colorInput) {
                await config.update('customCommentDecorationColor', colorInput, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Custom comment decoration color set to ${colorInput}`);
            }
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

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.createVanillaVST3Effect', async () => {
            await Commands.createVanillaProject('VST3Effect');
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.createVanillaVST3Synth', async () => {
            await Commands.createVanillaProject('VST3Synth');
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
            Commands.enterEditMode();
        }));

    // utility function to send text to Cabbage instrument overriding the current
    // realtime audio inputs
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.sendFileToChannel1and2', (uri: vscode.Uri) => {
            Commands.sendFileToChannel(context, uri.fsPath, 12);
        }));
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.sendFileToChannel1', (uri: vscode.Uri) => {
            Commands.sendFileToChannel(context, uri.fsPath, 1);
        }));
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.sendFileToChannel2', (uri: vscode.Uri) => {
            Commands.sendFileToChannel(context, uri.fsPath, 2);
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

    // Explicit start/stop server commands for Command Palette
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.startServer', async () => {
            await Commands.startCabbageServer(true);
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.stopServer', async () => {
            await Commands.startCabbageServer(false);
        }));

    // Provide a public command to restart the backend. Some helper code
    // elsewhere (e.g. Settings) calls this command by id. Ensure it's
    // registered so executeCommand doesn't fail.
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.restartBackend', async () => {
            try {
                if (Commands.hasCabbageServerStarted && Commands.hasCabbageServerStarted()) {
                    // Stop then start the server to force a rescan
                    await Commands.startCabbageServer(false);
                    // Small delay to let settings settle
                    await new Promise(resolve => setTimeout(resolve, 500));
                    await Commands.startCabbageServer(true);
                } else {
                    // If server isn't running, try to notify the webview to
                    // rescan custom widgets (if panel exists). This is a
                    // lightweight fallback used when restarting the native
                    // backend isn't appropriate.
                    const panel = Commands.getPanel();
                    if (panel) {
                        panel.webview.postMessage({ command: 'rescanCustomWidgets' });
                    }
                }
            } catch (err) {
                console.warn('Cabbage: Error while restarting backend:', err);
            }
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
        vscode.commands.registerCommand('cabbage.moveCabbageSection', () => {
            Commands.moveCabbageSection();
        }));
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.updateToCabbage3', () => {
            Commands.updateCodeToJSON();
        }));

    // Register command for reordering widgets
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.reorderWidgets', () => {
            Commands.reorderWidgets();
        }));

    // Register document formatting provider for VSCode's built-in Format Document command
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('csound-csd', {
            provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
                const text = document.getText();
                const formattedText = ExtensionUtils.formatText(text);

                // Only return edits if the text actually changed
                if (formattedText !== text) {
                    const range = new vscode.Range(
                        document.positionAt(0),
                        document.positionAt(text.length)
                    );
                    return [vscode.TextEdit.replace(range, formattedText)];
                }

                return [];
            }
        })
    );

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
 * - Waits for the backend to be ready before handling any messages from the
 * webview.
 * - Listens for messages from the webview and processes them via the backend
 * if available.
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
    // previously sent stopAudio via WebSocket; now use stdin/stdout pipes
    // Commands.sendMessageToCabbageApp({ command: "stopAudio", text: "" });


    if (editor) {
        if (!editor.fileName.endsWith('.csd') ||
            !await Commands.hasCabbageTags(editor)) {
            console.warn(
                'Cabage: No cabbage tags found in document, returning early.');
            return;
        }

        // Validate JSON in Cabbage section before compilation
        const jsonValidation = validateCabbageJSON(editor.getText());
        if (!jsonValidation.valid) {
            const lineInfo = jsonValidation.position
                ? ` (line ${jsonValidation.position.line + 1}, column ${jsonValidation.position.column + 1})`
                : '';
            const errorMsg = `Cabbage: Cannot compile - Invalid JSON in Cabbage section${lineInfo}: ${jsonValidation.error}`;
            Commands.getOutputChannel().appendLine(errorMsg);
            Commands.getOutputChannel().show();
            console.error('Cabbage: JSON validation failed:', jsonValidation.error, jsonValidation.position);

            // Set diagnostic for the error
            if (jsonValidation.position) {
                // Create a range that highlights the entire line for emphasis
                const errorLineContent = editor.getText(new vscode.Range(
                    jsonValidation.position.line, 0,
                    jsonValidation.position.line, Number.MAX_SAFE_INTEGER
                )).split('\n')[0];
                const range = new vscode.Range(
                    jsonValidation.position.line, 0,
                    jsonValidation.position.line, errorLineContent.length
                );
                const diagnostic = new vscode.Diagnostic(
                    range,
                    `Cabbage JSON Error: ${jsonValidation.error}`,
                    vscode.DiagnosticSeverity.Error
                );
                Commands.setJSONDiagnostics(editor.uri, [diagnostic]);

                // Scroll to the error location
                const activeEditor = vscode.window.activeTextEditor;
                if (activeEditor && activeEditor.document === editor) {
                    activeEditor.revealRange(range, vscode.TextEditorRevealType.InCenterIfOutsideViewport);
                }
            }

            return;
        }

        // Additional validation for duplicate channels before creating panel
        const textEditor = vscode.window.visibleTextEditors.find(ed => ed.document === editor);
        const duplicateValidation = ExtensionUtils.validateCabbageJSON(editor, textEditor);
        if (!duplicateValidation) {
            // Validation failed - diagnostics and output already handled by validateCabbageJSON
            return;
        }

        // Clear any previous diagnostics if both validations pass
        Commands.clearJSONDiagnostics(editor.uri);

        console.log('Cabbage: onCompileInstrument: Entering performance mode');
        setCabbageMode('play');
        const config = vscode.workspace.getConfiguration('cabbage');

        if (!Commands.getPanel()) {
            console.warn('Cabbage: Cabbage: Creating new webview panel');
            await Commands.setupWebViewPanel(context);
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

        // Send message to webview to enter performance mode
        const performancePanel = Commands.getPanel();
        if (performancePanel) {
            console.log('Cabbage: Sending onEnterPerformanceMode message to webview');
            performancePanel.webview.postMessage({ command: 'onEnterPerformanceMode' });
        } else {
            console.log('Cabbage: No panel found to send performance mode message');
        }

        // Notify backend via stdin/stdout pipes
        Commands.sendMessageToCabbageApp({ command: "onFileChanged", lastSavedFileName: editor.fileName });

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
                Commands.sendFileToChannel(context, file, Number(channel));
            }
        }, 2000);

        const panel = Commands.getPanel();
        if (panel) {
            panel.webview.onDidReceiveMessage(message => {
                Commands.handleWebviewMessage(message, firstMessages, vscode.window.activeTextEditor, context);
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

/**
 * Function to check if csound64.dll is available in the system PATH
 */
function isCsoundInPath(): boolean {
    try {
        const pathEnv = process.env.PATH || '';
        const pathDirs = pathEnv.split(path.delimiter);

        for (const dir of pathDirs) {
            const dllPath = path.join(dir, 'csound64.dll');
            if (fs.existsSync(dllPath)) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking PATH for csound64.dll:', error);
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
        if (!pathExists('C:/Program Files/Csound7/bin/csound64.dll') && !isCsoundInPath()) {
            Commands.getOutputChannel().append(
                'ERROR: C:/Program Files/Csound7/bin/csound64.dll not found and csound64.dll not found in PATH\nA version of Csound 7 is required for the Cabbage extension to work\nPlease ensure Csound 7 is installed and csound64.dll is in your PATH\n');
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
    Commands.sendMessageToCabbageApp({ command: "stopAudio", text: "" });
    Commands.getProcesses().forEach((p) => {
        p?.kill('SIGKILL');
    });
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
// WebSocket server setup removed — communication now uses stdin/stdout pipes
