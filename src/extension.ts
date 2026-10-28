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
import { describeJsoncError, findCabbageInclude, getJsoncErrors, offsetToPosition } from './utils/jsonc';

// cache for protected files
const originalContentCache: { [key: string]: string } = {};

// Disposable for the webview message listener - replaced on each file save
// to prevent stacking duplicate listeners.
let webviewMessageListenerDisposable: vscode.Disposable | undefined;

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

    const rawCabbageContent = match[1];
    const leadingWhitespace = rawCabbageContent.length - rawCabbageContent.trimStart().length;
    const cabbageContent = rawCabbageContent.trim();
    const cabbageStartIndex = match.index! + match[0].indexOf(rawCabbageContent) + leadingWhitespace;

    // Check if it's an external file reference. Only a real #include outside
    // JSONC comments/strings counts; a commented-out include in malformed
    // inline JSON must still be validated as inline JSON.
    if (findCabbageInclude(cabbageContent)) {
        // External JSON file - we'll validate it when loaded
        return { valid: true };
    }

    // Parse as JSONC: // line comments and /* block comments */ are valid.
    const errors = getJsoncErrors(cabbageContent);
    if (errors.length === 0) {
        return { valid: true };
    }

    const firstError = errors[0];
    const errorMessage = describeJsoncError(firstError, cabbageContent);
    const documentPosition = cabbageStartIndex + firstError.offset;
    let position = offsetToPosition(documentText, documentPosition);

    // For errors about a missing comma, the parser stops at the next token.
    // Highlight the end of the previous line where the comma belongs.
    if (
        errorMessage.includes("Expected ','") ||
        errorMessage.includes('Unexpected token') ||
        errorMessage.includes('Unexpected string')
    ) {
        const allLines = documentText.split('\n');
        const currentLine = allLines[position.line] ?? '';
        const trimmedStart = currentLine.trimStart();
        const leading = currentLine.length - trimmedStart.length;
        if (position.column <= leading + 1 && position.line > 0) {
            const prevLine = allLines[position.line - 1];
            position = { line: position.line - 1, column: Math.max(0, prevLine.length - 1) };
        }
    }

    // Trailing comma: point at the comma on the previous line when possible.
    if (errorMessage.includes('Trailing comma') && position.line > 0) {
        const allLines = documentText.split('\n');
        const prevLine = allLines[position.line - 1];
        if (prevLine && prevLine.trimEnd().endsWith(',')) {
            position = { line: position.line - 1, column: Math.max(0, prevLine.trimEnd().length - 1) };
        }
    }

    return {
        valid: false,
        error: errorMessage,
        position
    };
}

/**
 * Converts cryptic JSON errors into user-friendly messages with actionable advice
 * @param error The original error message
 * @param document The document being validated
 * @param position The position of the error
 * @returns A user-friendly error message
 */
function makeUserFriendlyErrorMessage(error: string, document: vscode.TextDocument, position: { line: number; column: number }): string {
    const line = document.lineAt(position.line).text;
    const prevLine = position.line > 0 ? document.lineAt(position.line - 1).text : '';

    // Trailing comma (detected precisely by the JSONC parser).
    if (error.includes('Trailing comma')) {
        return `❌ Trailing comma not allowed in JSON.\n💡 Fix: Remove the comma before the closing ] or }.`;
    }

    // Unterminated comments/strings.
    if (error.includes('unterminated comment')) {
        return `❌ Unclosed block comment.\n💡 Fix: Add */ to close the comment.`;
    }
    if (error.includes('unterminated string')) {
        return `❌ Unclosed string.\n💡 Fix: Add the missing closing double quote.`;
    }

    // Check for trailing comma (most common issue)
    if ((error.includes('Expected double-quoted property name') || error.includes('Unexpected token')) &&
        prevLine.trimEnd().endsWith(',')) {
        const trimmedPrev = prevLine.trim();
        if (trimmedPrev.endsWith('},') || trimmedPrev.endsWith('],')) {
            return `❌ Trailing comma not allowed in JSON.\n💡 Fix: Remove the comma at the end of the previous line (line ${position.line}).`;
        }
    }

    // Check for trailing comma on current line
    if (error.includes('Unexpected token') && line.trimEnd().endsWith(',')) {
        return `❌ Trailing comma not allowed in JSON.\n💡 Fix: Remove the comma at the end of this line.`;
    }

    // Missing quotes around property names
    if (error.includes('Expected double-quoted property name')) {
        if (line.includes(':') && !line.includes('"')) {
            return `❌ Property names must be wrapped in double quotes.\n💡 Fix: Change property names like 'type' to "type" (use double quotes, not single quotes).`;
        }
        return `❌ Invalid JSON syntax - expected a property name in double quotes.\n💡 Fix: Make sure all property names are in "double quotes", and check for trailing commas.`;
    }

    // Single quotes instead of double quotes
    if (error.includes('Unexpected token') && line.includes("'")) {
        return `❌ JSON requires double quotes, not single quotes.\n💡 Fix: Replace single quotes (') with double quotes (") throughout your JSON.`;
    }

    // Missing comma
    if (error.includes('Expected') && error.includes('comma')) {
        return `❌ Missing comma between items.\n💡 Fix: Add a comma at the end of the previous line to separate items in the array or object.`;
    }

    // Unclosed brackets/braces
    if (error.includes('Unexpected end of JSON')) {
        return `❌ JSON is incomplete - missing closing bracket or brace.\n💡 Fix: Check that all { } and [ ] are properly closed.`;
    }

    // Unexpected token
    if (error.includes('Unexpected token')) {
        const token = error.match(/Unexpected token '?([^'\s]+)/)?.[1];
        if (token) {
            return `❌ Unexpected character '${token}' found in JSON.\n💡 Fix: Check the syntax around this character - you may have a missing comma, extra bracket, or typo.`;
        }
    }

    // Default fallback with the original error
    return `❌ JSON Syntax Error: ${error}\n💡 Common fixes:\n  • Check for trailing commas (not allowed in JSON)\n  • Ensure all property names use "double quotes"\n  • Make sure all { } and [ ] are closed`;
}

/**
 * Validates Cabbage JSON syntax in real-time and sets diagnostics
 * @param editor The text editor to validate
 */
function validateCabbageJSONSyntax(editor: vscode.TextEditor): void {
    const document = editor.document;
    const text = document.getText();

    const jsonValidation = validateCabbageJSON(text);

    if (!jsonValidation.valid && jsonValidation.position) {
        // Create a diagnostic for the error
        const errorLineContent = document.lineAt(jsonValidation.position.line).text;
        const range = new vscode.Range(
            jsonValidation.position.line, 0,
            jsonValidation.position.line, errorLineContent.length
        );

        // Convert to user-friendly message
        const friendlyMessage = makeUserFriendlyErrorMessage(
            jsonValidation.error || 'Unknown JSON error',
            document,
            jsonValidation.position
        );

        const diagnostic = new vscode.Diagnostic(
            range,
            friendlyMessage,
            vscode.DiagnosticSeverity.Error
        );

        Commands.setJSONDiagnostics(document.uri, [diagnostic]);
    } else if (jsonValidation.valid) {
        // Clear diagnostics if JSON is valid
        Commands.clearJSONDiagnostics(document.uri);
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

    // Create the status bar entry point first: nothing below (version
    // checks, settings repair, file caching) may prevent the primary
    // launch UI from existing, especially across extension updates where
    // the install directory is in flux on Windows.
    Commands.createStatusBarIcon(context);

    // Set when the settings repair below rewrites a stale jsSourceDir, so
    // a backend restart can be issued once commands are registered.
    let settingsRepaired = false;

    try {
        const currentVersion =
            vscode.extensions.getExtension('cabbageaudio.vscabbage')?.packageJSON.version;
        const previousVersion = context.globalState.get<string>('extensionVersion');

        if (!previousVersion) {
            // First-time install
            onInstall();
        } else if (previousVersion !== currentVersion) {
            // Extension updated. The new code only takes effect after a
            // window reload, so offer it as a one-click action.
            vscode.window.showInformationMessage(
                `Cabbage extension updated to version ${currentVersion}. Reload to activate it.`,
                'Reload Window').then(selection => {
                if (selection === 'Reload Window') {
                    vscode.commands.executeCommand('workbench.action.reloadWindow');
                }
            });
            await onUpdate(previousVersion, currentVersion);
        }

        // Ensure the extension's JS source path is current in the Cabbage settings.
        // This handles cases where the extension was updated but the settings file
        // still points to a stale versioned directory.
        settingsRepaired = await Settings.ensureExtensionJsSourcePath();

        // Update the stored version
        context.globalState.update('extensionVersion', currentVersion);
    } catch (err) {
        // Update-time I/O must never sink activation: log and carry on with
        // defaults so the status bar, commands and backend stay usable.
        console.error('Cabbage: activation update block failed, continuing:', err);
        Commands.getOutputChannel().appendLine(`Cabbage: update check failed (${err}), continuing with current settings`);
    }

    // Cache all protected files at the start. Guarded per file: a single
    // locked or vanishing file (common mid-update on Windows) must not
    // reject activation and take the whole extension down with it.
    try {
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (extension) {
            const examplesPath = path.join(extension.extensionPath, 'examples');
            const csdFiles = Commands.getCsdFiles(examplesPath);
            csdFiles.forEach(file => {
                try {
                    originalContentCache[file] = fs.readFileSync(file, 'utf-8');
                } catch (readErr) {
                    console.error(`Cabbage: skipping unreadable example file during cache: ${file}`, readErr);
                }
            });
        }
    } catch (err) {
        console.error('Cabbage: example file caching failed, continuing:', err);
    }

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

            // Validate JSON syntax when switching to a .csd file
            if (editor.document.fileName.endsWith('.csd')) {
                validateCabbageJSONSyntax(editor);
            }
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument((doc) => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === doc);
        if (editor) {
            updateWarningDecorations(editor);
            updateJsonCommentDecorations(editor);

            // Validate JSON syntax when opening a .csd file
            if (editor.document.fileName.endsWith('.csd')) {
                validateCabbageJSONSyntax(editor);
            }
        }
    }));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument((event) => {
        const editor = vscode.window.visibleTextEditors.find(e => e.document === event.document);
        if (editor) {
            updateWarningDecorations(editor);
            updateJsonCommentDecorations(editor);

            // Validate JSON syntax in real-time for .csd files
            if (editor.document.fileName.endsWith('.csd')) {
                validateCabbageJSONSyntax(editor);
            }
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
        if (event.affectsConfiguration('cabbage.vuMeterShowReadouts')) {
            // Live-toggle VU meter text readouts without requiring a panel reload
            const show = vscode.workspace.getConfiguration('cabbage').get<boolean>('vuMeterShowReadouts', false);
            const panel = Commands.getPanel();
            if (panel) {
                panel.webview.postMessage({ command: 'vuMeterReadouts', show });
            }
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

    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.validateInstallation', async () => {
            await Commands.validateInstallation();
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
        vscode.commands.registerCommand('cabbage.exportCLAPEffect', async () => {
            await Commands.exportInstrument('CLAPEffect');
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.exportCLAPSynth', async () => {
            await Commands.exportInstrument('CLAPSynth');
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.exportVST3EffectARA', async () => {
            await Commands.exportInstrument('VST3EffectARA');
        }));
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.exportVST3SynthARA', async () => {
            await Commands.exportInstrument('VST3SynthARA');
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
        context.subscriptions.push(
            vscode.commands.registerCommand('cabbage.exportAUMidiFx', async () => {
                await Commands.exportInstrument('AUv2MidiFx');
            }));
    }

    // CabbagePro commands
    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.setupCabbageProBinaries', async () => {
            await Settings.setupCabbageProBinaries();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.exportProVST3Effect', async () => {
            await Commands.exportProInstrument('VST3Effect');
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.exportProVST3Synth', async () => {
            await Commands.exportProInstrument('VST3Synth');
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.exportProCLAPEffect', async () => {
            await Commands.exportProInstrument('CLAPEffect');
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.exportProCLAPSynth', async () => {
            await Commands.exportProInstrument('CLAPSynth');
        }));

    if (os.platform() === 'darwin') {
        context.subscriptions.push(
            vscode.commands.registerCommand('cabbage.exportProAUEffect', async () => {
                await Commands.exportProInstrument('AUv2Effect');
            }));

        context.subscriptions.push(
            vscode.commands.registerCommand('cabbage.exportProAUSynth', async () => {
                await Commands.exportProInstrument('AUv2Synth');
            }));
        context.subscriptions.push(
            vscode.commands.registerCommand('cabbage.exportProAUMidiFx', async () => {
                await Commands.exportProInstrument('AUv2MidiFx');
            }));
    }

    // Check if pro binaries are configured and set context
    const config = vscode.workspace.getConfiguration('cabbage');
    const proBinaryPath = config.get<string>('pathToCabbageProBinary') || '';
    if (proBinaryPath !== '') {
        vscode.commands.executeCommand('setContext', 'cabbage.proEnabled', true);
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

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.stopCsound', () => {
            Commands.stopCsound();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.startRecording', async () => {
            await Commands.startRecording();
        }));

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.stopRecording', () => {
            Commands.stopRecording();
        }));

    // utility function to send text to Cabbage instrument overriding the current
    // realtime audio inputs

    context.subscriptions.push(
        vscode.commands.registerCommand('cabbage.createProjectFile', () => {
            Commands.createCabbageProjectFile();
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
                }
                // Restarting CabbageApp does not reload the webview, and
                // `rescanCustomWidgets` was never handled there. Always push
                // a fresh custom-widget list so a widget created while the
                // panel is open appears in the insert menu.
                await Commands.pushCustomWidgetInfo();
            } catch (err) {
                console.warn('Cabbage: Error while restarting backend:', err);
            }
        }));

    // The settings repair above may run before any command is registered
    // (executeCommand('cabbage.restartBackend') from Settings is then a
    // no-op). Now that commands exist, restart a running backend directly
    // so the repair takes effect without manual intervention.
    if (settingsRepaired && Commands.hasCabbageServerStarted && Commands.hasCabbageServerStarted()) {
        try {
            await vscode.commands.executeCommand('cabbage.restartBackend');
        } catch (err) {
            console.warn('Cabbage: post-repair backend restart failed:', err);
        }
    }

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
        'cabbage.importCabbage2Instrument', () => {
            Commands.importCabbage2Instrument();
        }));

    // Register command for reordering widgets
    context.subscriptions.push(vscode.commands.registerCommand(
        'cabbage.reorderWidgets', () => {
            Commands.reorderWidgets();
        }));

    // Register document formatting provider for VSCode's built-in Format Document command
    // Support both 'csound' (kunstmusik extension) and 'csound-csd' (legacy/other extensions)
    const formattingProvider = {
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
    };

    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('csound', formattingProvider)
    );
    context.subscriptions.push(
        vscode.languages.registerDocumentFormattingEditProvider('csound-csd', formattingProvider)
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
        const compileOnSave = vscode.workspace.getConfiguration('cabbage').get<boolean>('compileOnSave', true);
        if (compileOnSave && document.fileName.endsWith('.csd') && Commands.hasCabbageServerStarted()) {
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
    // Commands.sendMessageToCabbageApp({ command: "stopAudio" });


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
            performancePanel.webview.postMessage({ command: 'onEnterPerformanceMode' });
        } else {
        }

        // The backend was already notified via Commands.onDidSave() above,
        // which sends the identical onFileChanged message - sending it
        // again here would queue a duplicate InitCabbage (double compile).
        const vscodeOutputChannel = Commands.getOutputChannel();
        if (config.get("clearConsoleOnCompile")) {
            vscodeOutputChannel.clear();
        }

        const panel = Commands.getPanel();
        if (panel) {
            // Dispose any previously registered listener before adding a new one.
            // Without this, every file save adds another listener and each
            // webview message (e.g. MIDI note-on) is forwarded N times.
            if (webviewMessageListenerDisposable) {
                webviewMessageListenerDisposable.dispose();
                webviewMessageListenerDisposable = undefined;
            }
            webviewMessageListenerDisposable = panel.webview.onDidReceiveMessage(message => {
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
 * Function to check if a Csound DLL is available in the system PATH.
 * Csound 7.0.0's Windows package ships csound7_64.dll; older installers used
 * csound64.dll. Accept both.
 */
function isCsoundInPath(): boolean {
    try {
        const pathEnv = process.env.PATH || '';
        const pathDirs = pathEnv.split(path.delimiter);
        const dllNames = ['csound7_64.dll', 'csound64.dll'];

        for (const dir of pathDirs) {
            for (const name of dllNames) {
                if (fs.existsSync(path.join(dir, name))) {
                    return true;
                }
            }
        }
        return false;
    } catch (error) {
        console.error('Error checking PATH for Csound DLL:', error);
        return false;
    }
}
/*
 * Logic to execute when the extension is installed for the first time. On MacOS
 * we need to sign the Csound library if it is not already signed. If it's only
 * adhoc signed, we sign it again.
 */
function onInstall() {
    // Return early if users is working with Cabbage Pro binaries
    const config = vscode.workspace.getConfiguration('cabbage');
    const proBinaryPath = config.get<string>('pathToCabbageProBinary') || '';
    const proAppEnabled = config.get<boolean>('proAppEnabled') || false;
    if (proBinaryPath && proAppEnabled) {
        return;
    }
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
        const csoundBin = 'C:/Program Files/Csound7/bin';
        const hasInstalledDll = ['csound7_64.dll', 'csound64.dll']
            .some((name) => pathExists(`${csoundBin}/${name}`));
        if (!hasInstalledDll && !isCsoundInPath()) {
            Commands.getOutputChannel().append(
                'ERROR: Csound DLL not found in C:/Program Files/Csound7/bin and not found in PATH\nA version of Csound 7 is required for the Cabbage extension to work\nPlease ensure Csound 7 is installed and csound7_64.dll (or csound64.dll) is in your PATH\n');
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
 * Replaces any stale extension path in jsSourceDir with the current one.
 * @param previousVersion The previous version of the extension.
 * @param currentVersion The current version of the extension.
 */
async function onUpdate(previousVersion: string, currentVersion: string) {
    console.log(
        `Extension updated from version ${previousVersion} to ${currentVersion}`);
    await Settings.ensureExtensionJsSourcePath();
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
    Commands.sendMessageToCabbageApp({ command: "stopAudio" });
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
