// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import * as vscode from 'vscode';
// @ts-ignore
import { WidgetProps } from './cabbage/widgetTypes';
import path from 'path';
import os from 'os';
import fs from 'fs';
// @ts-ignore
import { initialiseDefaultProps } from './cabbage/widgetTypes';
import { Commands } from './commands';
import { ChildProcess, exec } from "child_process";
import WebSocket from 'ws';
import stringify from 'json-stringify-pretty-compact';


// Define an interface for the old-style widget structure
interface Widget {
    type: string;
    bounds?: { top: number; left: number; width: number; height: number };
    range?: { min: number; max: number; defaultValue: number; increment: number; skew: number };
    size: { width: number; height: number };
    text?: string | string[];
    channel?: string;
    tableNumber: number;
}

export class ExtensionUtils {

    /**
     * Gets the warning comment for Cabbage sections based on user settings.
     * @returns The warning comment string if enabled, otherwise an empty string.
     */
    static getWarningComment(): string {
        const config = vscode.workspace.getConfiguration("cabbage");
        const showWarning = config.get("showWarningComment", true);
        if (!showWarning) {
            return "";
        }
        return `<!--⚠️ Warning: Although you can manually edit the Cabbage JSON code, it will
also be rewritten by the Cabbage UI editor. This means any custom formatting 
(indentation, spacing, or comments) may be lost when the file is saved through the 
editor. -->\n`;
    }

    /**
     * Removes any warning comment from the text.
     * @param text The text to clean.
     * @returns The text with warning comments removed.
     */
    static removeWarningComment(text: string): string {
        return text.replace(/<!--[\s\S]*?Warning:[\s\S]*?-->[\s\n]*/g, '');
    }
    static sendTextToWebView(editor: vscode.TextDocument | undefined, command: string, panel: vscode.WebviewPanel | undefined) {
        if (editor) {
            if (editor.fileName.split('.').pop() === 'csd') {
                vscode.commands.executeCommand("workbench.action.webview.reloadWebviewAction");
                if (editor.getText().includes('<Cabbage>') && editor.getText().includes('</Cabbage>')) {
                    panel?.webview.postMessage({ command, text: editor.getText() });
                }
            }
        }
    }

    /**
     * Initializes or updates the highlight decoration type, used for highlighting in editors.
     */
    static initialiseHighlightDecorationType(highlightDecorationType: vscode.TextEditorDecorationType | undefined) {
        if (!highlightDecorationType) {
            highlightDecorationType = vscode.window.createTextEditorDecorationType({
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
            });
        }
    }

    /**
     * Highlights and scrolls to an object within the document based on updated properties.
     * Supports both single-line and multi-line objects.
     */
    static highlightAndScrollToUpdatedObject(updatedProps: WidgetProps, cabbageStartIndex: number, isSingleLine: boolean,
        textEditor: vscode.TextEditor | undefined,
        highlightDecorationType: vscode.TextEditorDecorationType,
        shouldScroll: boolean = true) {
        if (!textEditor) { return; }

        const document = textEditor.document;
        const documentText = document.getText();
        const lines = documentText.split('\n');
        ExtensionUtils.initialiseHighlightDecorationType(highlightDecorationType);

        textEditor.setDecorations(highlightDecorationType, []);

        if (isSingleLine) {
            const channelPattern = new RegExp(`"channel":\\s*"${updatedProps.channel}"`, 'i');
            const lineNumber = lines.findIndex(line => channelPattern.test(line));

            if (lineNumber >= 0) {
                const start = new vscode.Position(lineNumber, 0);
                const end = new vscode.Position(lineNumber, lines[lineNumber].length);
                textEditor.setDecorations(highlightDecorationType, [{ range: new vscode.Range(start, end) }]);
                if (shouldScroll) { textEditor.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenter); }
            }
        } else {
            const pattern = new RegExp(`\\{(?:[^{}]|\\{[^{}]*\\})*?"channel":\\s*"${updatedProps.channel}"(?:[^{}]|\\{[^{}]*\\})*?\\}`, 's');
            const match = pattern.exec(documentText);

            if (match) {
                const objectStartIndex = documentText.indexOf(match[0]);
                const objectEndIndex = objectStartIndex + match[0].length;
                const startPos = document.positionAt(objectStartIndex);
                const endPos = document.positionAt(objectEndIndex);
                textEditor.setDecorations(highlightDecorationType, [{ range: new vscode.Range(startPos, endPos) }]);
                if (shouldScroll) {
                    textEditor.revealRange(new vscode.Range(startPos, endPos), vscode.TextEditorRevealType.InCenter);
                }
            }
        }
    }

    /**
     * Basic sleep function for testing various things.
     */
    static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    /**
     * Gracefully or forcefully terminates a process by PID across platforms.
     * @param {number | ChildProcess | undefined} pid - The process ID or child process to terminate.
     * @param {boolean} force - Whether to force kill (`SIGKILL` on Unix/macOS, `/F` on Windows).
     * Not good to forcedly kill the process as the CabbageApp might not clean.
     */
    static terminateProcess(pid: number | ChildProcess | undefined, websocket: WebSocket | undefined, force = false) {


        // Handle case where pid is undefined or invalid
        if (!pid || (typeof pid === 'number' && isNaN(pid))) {
            Commands.getOutputChannel().appendLine("Invalid PID provided.");
            return;
        }


        // If pid is a child process, use its pid
        const targetPid = typeof pid === "number" ? pid : pid?.pid;

        // Ensure targetPid is a valid number before calling process.kill
        if (typeof targetPid !== "number") {
            Commands.getOutputChannel().appendLine("Invalid PID value.");
            return;
        }

        if (process.platform === "win32") {
            // Windows: Use `taskkill` command to kill the process (without /F for graceful shutdown)
            const command = `taskkill /PID ${targetPid} ${force ? "/F" : ""}`;
            exec(command, (err, stdout, stderr) => {
                if (err) {
                    Commands.getOutputChannel().appendLine(`Failed to terminate Cabbage server (${targetPid}): ${(err as Error).message}`);
                } else {
                    Commands.getOutputChannel().appendLine(`Cabbage sserver (${targetPid}) terminated successfully.`);
                }
            });
        } else {
            // Unix/macOS: Use `SIGTERM` first, then `SIGKILL` if needed
            try {
                process.kill(targetPid, "SIGTERM");
                // Commands.getOutputChannel().appendLine(`Sent SIGTERM to process ${targetPid}. Waiting for graceful shutdown...`);

                // Give the process time to handle the signal gracefully
                setTimeout(() => {
                    try {
                        // Check if process is still running
                        process.kill(targetPid, 0); // Signal 0 checks if process exists
                        //Commands.getOutputChannel().appendLine(`Process ${targetPid} did not respond to SIGTERM. Sending SIGKILL...`);
                        process.kill(targetPid, "SIGKILL");
                        //Commands.getOutputChannel().appendLine(`Process ${targetPid} force terminated with SIGKILL.`);
                    } catch (killErr) {
                        // Process already exited
                        Commands.getOutputChannel().appendLine(`Process ${targetPid} terminated successfully.`);
                    }
                }, 500); // Wait 500ms before force killing

            } catch (err) {
                Commands.getOutputChannel().appendLine(`Failed to terminate process ${targetPid}: ${(err as Error).message}`);
            }
        }
    }

    /*
    * Function to jump to the definition of a word in the document
    * @param editor The active text editor
    */
    static goToDefinition(editor: vscode.TextEditor) {
        if (!editor) {
            vscode.window.showErrorMessage("No active editor.");
            console.error("goToDefinition: editor is undefined");
            return;
        }

        if (!editor.selection) {
            vscode.window.showErrorMessage("Editor has no selection.");
            console.error("goToDefinition: editor.selection is undefined", editor);
            return;
        }

        const position = editor.selection.isEmpty ? editor.selection.active : editor.selection.start; // Use start if selection is not empty

        if (!position) {
            vscode.window.showErrorMessage("No active cursor position.");
            return;
        }

        console.log("Cursor position:", position); // Debug: check the cursor position

        const word = ExtensionUtils.getWordAtPosition(editor, position);
        console.log("Word at cursor:", word); // Debug: check the word found

        if (word) {
            ExtensionUtils.jumpToWidgetObject(editor, word);
        } else {
            vscode.window.showErrorMessage("No valid word found at the cursor position.");
        }
    }


    /*
    * Function to jump to a specific widget in the document
    * @param editor The active text editor
    * @param widgetName The name of the widget to jump to
    * @returns The position of the widget in the document
    */
    static jumpToWidgetObject(editor: vscode.TextEditor, widgetName: string) {
        // Implement the logic to jump to the widget based on the widgetName
        const widgetPosition = ExtensionUtils.findWidgetPosition(editor, widgetName); // Use Commands to find the widget position
        if (widgetPosition) {
            if (editor) {
                editor.selection = new vscode.Selection(widgetPosition, widgetPosition);
                editor.revealRange(new vscode.Range(widgetPosition, widgetPosition));
            }
        } else {
            vscode.window.showErrorMessage(`Widget "${widgetName}" not found.`);
        }
    }

    /*
    * Function to find the position of a widget in the document
    * @param editor The active text editor
    * @param widgetName The name of the widget to find
    * @returns The position of the widget in the document
    */
    static findWidgetPosition(editor: vscode.TextEditor, widgetName: string): vscode.Position | null {
        if (!editor) {
            return null; // No active editor
        }

        const document = editor.document;
        const text = document.getText(); // Get the entire document text

        // Create a regex pattern to find the channel in the JSON objects
        const pattern = new RegExp(`"channel":\\s*"${widgetName}"`, 'i'); // Case-insensitive search for the channel

        // Search for the pattern in the document text
        const match = pattern.exec(text);
        if (match) {
            const startIndex = match.index; // Get the start index of the match
            const endIndex = startIndex + match[0].length; // Get the end index of the match

            // Convert the indices to positions in the document
            const startPos = document.positionAt(startIndex);
            const endPos = document.positionAt(endIndex);

            // Return the start position of the match
            return startPos;
        }

        return null; // No match found
    }

    /**
     * Helper function to extract the word at the given position
     * in the current line of the active text editor.
     * @param editor The active text editor.
     * @param position The position to extract the word from.
     * @returns The word at the given position or null if not found. 
     */
    static getWordAtPosition(editor: vscode.TextEditor, position: vscode.Position): string | null {
        if (!editor || !position) {
            vscode.window.showErrorMessage("Invalid editor or position.");
            return null; // Return null if editor or position is invalid
        }

        const line = editor.document.lineAt(position.line).text; // Get the current line text
        const startChar = position.character; // Current cursor position

        // Use a regex to find the word enclosed in quotes
        const wordRegex = /"([^"]*)"/g; // Matches words enclosed in double quotes
        let match;

        // Find the word in the current line
        while ((match = wordRegex.exec(line)) !== null) {
            const matchStart = match.index + 1; // Start index of the word (after the opening quote)
            const matchEnd = matchStart + match[1].length; // End index of the word (before the closing quote)

            // Check if the cursor is within the match
            if (startChar >= matchStart && startChar < matchEnd) {
                return match[1]; // Return the matched word without quotes
            }
        }

        return null; // No word found
    }

    /**
     * Finds the TextEditor associated with the given filename.
     * @param filename The name of the file to find.
     * @returns The TextEditor associated with the file or undefined if not found.
     */
    static async findTextEditor(filename: string): Promise<vscode.TextEditor | undefined> {
        // Get all tab inputs from all tab groups
        const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);

        for (const tab of tabs) {
            // Check if the tab input corresponds to a text document with a matching filename
            if (tab.input instanceof vscode.TabInputText && tab.input.uri.fsPath.endsWith(filename)) {
                // Ensure the document is opened and shown in the editor
                const document = await vscode.workspace.openTextDocument(tab.input.uri);
                const editor = vscode.window.visibleTextEditors.find(e => e.document === document);

                if (editor) {
                    return editor; // Return the associated TextEditor
                }

                // If the editor is not already visible, show it and return
                return vscode.window.showTextDocument(document, { preview: false });
            }
        }

        return undefined; // Return undefined if no matching TextEditor is found
    }


    /**
     * Finds and saves a document based on the filename.
     * @param filename The name of the file to find.
     * @returns The found and saved document or undefined if not found.
     */
    static async findDocument(filename: string, save: boolean): Promise<vscode.TextDocument | undefined> {
        const tabs = vscode.window.tabGroups.all.flatMap(group => group.tabs);
        for (const tab of tabs) {
            if (tab.input instanceof vscode.TabInputText && tab.input.uri.fsPath.endsWith(filename)) {
                const document = await vscode.workspace.openTextDocument(tab.input.uri);
                await vscode.window.showTextDocument(document, { preview: false });
                if (save) {
                    await ExtensionUtils.saveDocumentIfDirty(document);
                }
                return document;
            }
        }
        return undefined;
    }

    /**
     * Renames a file and return news file name.
     * @param originalPath 
     * @param newFileName 
     * @param newExt  (optional)
     * @returns 
     */
    static async renameFile(originalPath: string, newFileName: string, newExt?: string): Promise<string> {
        const dir = path.dirname(originalPath);
        const ext = newExt || path.extname(originalPath); // Use provided extension or preserve the original
        const newPath = path.join(dir, newFileName + ext);

        // Rename the file on the filesystem
        await fs.promises.rename(originalPath, newPath);

        console.log(`File renamed from ${originalPath} to ${newPath}`);

        // Return the new path
        return newPath;
    }

    /**
     * Returns true if file is a directory
     * @param filePath 
     * @returns 
     */
    static async isDirectory(filePath: string): Promise<boolean> {
        try {
            const stats = await fs.promises.stat(filePath);
            return stats.isDirectory();
        } catch {
            return false;
        }
    }
    /**
     * Saves the document if it is dirty.
     * @param document The document to save.
     * @returns True if saved successfully, otherwise false.
     */
    static async saveDocumentIfDirty(document: vscode.TextDocument): Promise<boolean> {
        if (document.isDirty) {
            const success = await document.save();
            if (!success) {
                vscode.window.showErrorMessage('Failed to save the document.');
                return false;
            }
        }
        return true;
    }
    /**
     * Opens or shows a text document, ensuring it appears in the correct view column
     * and that focus remains on the previously active document.
     */
    static async openOrShowTextDocument(filePath: string): Promise<vscode.TextEditor | null> {
        try {
            const csdEditor = vscode.window.visibleTextEditors.find(editor => editor.document.fileName.endsWith('.csd'));
            const viewColumn = csdEditor ? csdEditor.viewColumn : vscode.ViewColumn.One;
            const existingEditor = vscode.window.visibleTextEditors.find(editor => editor.document.fileName === filePath);

            if (existingEditor) { return existingEditor; }

            const document = await vscode.workspace.openTextDocument(filePath);
            return vscode.window.showTextDocument(document, { preview: false, viewColumn, preserveFocus: true });
        } catch (error) {
            console.error(`Failed to open document: ${filePath}`, error);
            return null;
        }
    }

    /**
     * Updates JSON text in the document based on the current mode, highlight, and properties.
     * Handles both external file references and in-line JSON updates within `<Cabbage>` tags.
     */
    static async updateText(jsonText: string, cabbageMode: string, vscodeOutputChannel: vscode.OutputChannel, highlightDecorationType: vscode.TextEditorDecorationType, lastSavedFileName: string | undefined, panel: vscode.WebviewPanel | undefined, retryCount: number = 3): Promise<void> {
        if (cabbageMode === "play") {
            return;
        }

        // this isn't always a text file, it can also be the panel. So we need to retrieve the panel name
        // and then the relevant textEditor
        const textEditor = vscode.window.activeTextEditor;

        let props: WidgetProps;
        try {
            props = JSON.parse(jsonText);
        } catch (error) {
            console.error("Failed to parse JSON text:", error);
            vscodeOutputChannel.append(`Failed to parse JSON text: ${error}`);
            return;
        }

        let document: vscode.TextDocument;

        if (!textEditor && lastSavedFileName) {

            try {
                document = await vscode.workspace.openTextDocument(lastSavedFileName);
                // Don't show the document, just keep it in the background
            } catch (error) {
                console.error("Failed to open document:", error);
                return;
            }
        } else if (textEditor) {
            document = textEditor.document;
        } else {
            console.error("No text editor is available and no last saved file name.");
            return;
        }

        const originalText = document.getText();

        const defaultProps = await initialiseDefaultProps(props.type);
        if (!defaultProps) {
            return;
        }

        const cleanedText = ExtensionUtils.removeWarningComment(originalText);
        const cabbageRegexWithWarning = /<!--[\s\S]*?Warning:[\s\S]*?-->[\s\n]*<Cabbage>([\s\S]*?)<\/Cabbage>/;
        const cabbageRegexWithoutWarning = /<Cabbage>([\s\S]*?)<\/Cabbage>/;
        let cabbageMatch = originalText.match(cabbageRegexWithWarning);

        if (!cabbageMatch) {
            cabbageMatch = originalText.match(cabbageRegexWithoutWarning);
        }

        let externalFile = '';

        if (cabbageMatch) {
            const cabbageContent = cabbageMatch[1].trim();

            try {
                const cabbageJsonArray = JSON.parse(cabbageContent) as WidgetProps[];
                const hasFormType = cabbageJsonArray.some(obj => obj.type === 'form');

                if (!hasFormType) {
                    externalFile = ExtensionUtils.getExternalJsonFileName(cabbageContent, document.fileName);
                }

                if (!externalFile) {
                    const updatedJsonArray = ExtensionUtils.updateJsonArray(cabbageJsonArray, props, defaultProps);
                    const config = vscode.workspace.getConfiguration("cabbage");
                    const isSingleLine = config.get("defaultJsonFormatting") === 'Single line objects';
                    const indentSpaces = config.get("jsonIndentSpaces", 4);
                    const maxLength = config.get("jsonMaxLength", 120);
                    
                    const formattedArray = isSingleLine
                        ? ExtensionUtils.formatJsonObjects(updatedJsonArray, ' '.repeat(indentSpaces))
                        : stringify(updatedJsonArray, { maxLength: maxLength, indent: indentSpaces });

                    const isInSameColumn = panel && textEditor && panel.viewColumn === textEditor.viewColumn;

                    // Build the new document text with the updated cabbage section
                    const updatedCabbageSection = this.getWarningComment() + `<Cabbage>${formattedArray}</Cabbage>`;
                    const newText = originalText.replace(cabbageMatch[0], updatedCabbageSection);

                    // Replace the entire document to avoid positioning issues
                    const workspaceEdit = new vscode.WorkspaceEdit();
                    workspaceEdit.replace(
                        document.uri,
                        new vscode.Range(0, 0, document.lineCount, 0),
                        newText
                    );

                    const success = await vscode.workspace.applyEdit(workspaceEdit);
                    if (!success && retryCount > 0) {
                        // If the edit failed, wait a bit and try again
                        await new Promise(resolve => setTimeout(resolve, 100));
                        return ExtensionUtils.updateText(jsonText, cabbageMode, vscodeOutputChannel, highlightDecorationType, lastSavedFileName, panel, retryCount - 1);
                    }

                    // Attempt to highlight the updated object
                    if (textEditor) {
                        const cabbageStartIndex = newText.indexOf('<Cabbage>');
                        ExtensionUtils.highlightAndScrollToUpdatedObject(props, cabbageStartIndex, isSingleLine, textEditor, highlightDecorationType, !isInSameColumn);
                    }
                }
            } catch (parseError) {
                return;
            }
        } else {
            // No Cabbage section found, add one using the setting
            const config = vscode.workspace.getConfiguration("cabbage");
            const cabbageSectionPosition = 'top';//config.get('cabbageSectionPosition', 'top');

            const warningComment = `<!--\n⚠️ Warning:\nAlthough you can manually edit the Cabbage JSON code, it will\nalso be rewritten by the Cabbage UI editor. This means any\ncustom formatting (indentation, spacing, or comments) may be\nlost when the file is saved through the editor.\n-->\n`;

            const cabbageContent = warningComment + `
<Cabbage>[
{"type":"form","caption":"Untitled","size":{"height":300,"width":600},"pluginId":"def1"},
${JSON.stringify(props, null, 4)}
]</Cabbage>`;

            const workspaceEdit = new vscode.WorkspaceEdit();

            if (cabbageSectionPosition === 'top') {
                // Insert at the beginning of the file
                workspaceEdit.insert(document.uri, new vscode.Position(0, 0), cabbageContent);
            } else {
                // Insert after </CsoundSynthesizer> tag
                const csoundEndTag = '</CsoundSynthesizer>';
                const endIndex = originalText.indexOf(csoundEndTag);

                if (endIndex !== -1) {
                    // Insert after the closing tag
                    const insertPosition = document.positionAt(endIndex + csoundEndTag.length);
                    workspaceEdit.insert(document.uri, insertPosition, '\n' + cabbageContent.trim());
                } else {
                    // If no CsoundSynthesizer tag found, insert at the end
                    const endPosition = document.positionAt(originalText.length);
                    workspaceEdit.insert(document.uri, endPosition, '\n' + cabbageContent.trim());
                }
            }

            try {
                await vscode.workspace.applyEdit(workspaceEdit);
            } catch (error) {
                console.error("Failed to add Cabbage section:", error);
                vscodeOutputChannel.append(`Failed to add Cabbage section: ${error}`);
            }
        }

        if (externalFile) {
            const externalEditor = await ExtensionUtils.openOrShowTextDocument(externalFile);
            if (externalEditor) {
                await ExtensionUtils.updateExternalJsonFile(externalEditor, props, defaultProps);
            } else {
                vscodeOutputChannel.append(`Failed to open the external JSON file: ${externalFile}`);
            }
        }
    }

    /**
     * Formats the given text based on indentation and special formatting rules for `<Cabbage>` sections.
     * Uses custom indentation for control structures like `if`, `else`, `instr`, and `opcode`.
     * Also formats JSON content within `<Cabbage>` sections.
     */
    static formatText(text: string, indentSpaces: number = 4): string {

        const startTag = '<Cabbage>';
        const endTag = '</Cabbage>';

        const startIndex = text.indexOf(startTag);
        const endIndex = text.indexOf(endTag) + endTag.length;
        const lines = text.split('\n');

        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            // If no Cabbage section is found, format the entire text
            const updatedText = this.formatNonCabbageContent(lines, ' '.repeat(indentSpaces));
            return updatedText.join('\n');
        }

        const beforeCabbage = text.substring(0, startIndex).split('\n');;
        const cabbageSection = text.substring(startIndex, endIndex);
        const afterCabbage = text.substring(endIndex).split('\n');;

        const formattedBeforeCabbage = this.formatNonCabbageContent(beforeCabbage, ' '.repeat(indentSpaces));
        const formattedAfterCabbage = this.formatNonCabbageContent(afterCabbage, ' '.repeat(indentSpaces));

        // Format the JSON content within the Cabbage section
        const formattedCabbageSection = this.formatCabbageSection(cabbageSection);

        return formattedBeforeCabbage.join('\n') + formattedCabbageSection + formattedAfterCabbage.join('\n');
    }

    /**
     * Formats the JSON content within a Cabbage section.
     * @param cabbageSection The full Cabbage section including tags.
     * @returns The formatted Cabbage section with formatted JSON.
     */
    static formatCabbageSection(cabbageSection: string): string {
        const startTag = '<Cabbage>';
        const endTag = '</Cabbage>';

        const startIndex = cabbageSection.indexOf(startTag);
        const endIndex = cabbageSection.indexOf(endTag);

        if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
            return cabbageSection; // Return as-is if tags are malformed
        }

        const beforeTag = cabbageSection.substring(0, startIndex + startTag.length);
        const jsonContent = cabbageSection.substring(startIndex + startTag.length, endIndex);
        const afterTag = cabbageSection.substring(endIndex);

        try {
            // Get formatting settings from configuration
            const config = vscode.workspace.getConfiguration("cabbage");
            const indentSpaces = config.get("jsonIndentSpaces", 4);
            const maxLength = config.get("jsonMaxLength", 120);

            // Parse and format the JSON content
            const jsonObject = JSON.parse(jsonContent.trim());
            const formattedJson = stringify(jsonObject, { maxLength: maxLength, indent: indentSpaces });
            return beforeTag + '\n' + formattedJson + '\n' + afterTag;
        } catch (error) {
            // If JSON parsing fails, return the original section
            return cabbageSection;
        }
    }

    static collapseCabbageContent(cabbageContent: string): string {
        let formattedCabbageText = '';
        try {
            const jsonArray = JSON.parse(cabbageContent);
            formattedCabbageText = ExtensionUtils.formatJsonObjects(jsonArray, '') + '\n';
        } catch (error) {
            formattedCabbageText = cabbageContent + '\n'; // If parsing fails, keep the original content
        }
        return formattedCabbageText;
    }

    static formatNonCabbageContent(lines: string[], indentString: string): string[] {
        let indents = 0; // Tracks current indentation level
        const formattedLines: string[] = [];

        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            const trimmedLine = line.trim();

            // Decrease indentation level for end keywords
            if (
                trimmedLine.startsWith("endif") ||
                trimmedLine.startsWith("endin") ||
                trimmedLine.startsWith("endop") ||
                trimmedLine.startsWith("od") ||
                trimmedLine.startsWith("else") ||
                trimmedLine.startsWith("enduntil")
            ) {
                indents = Math.max(0, indents - 1);
            }

            // Add indentation
            const indentText = indentString.repeat(indents);
            formattedLines.push(indentText + trimmedLine);

            // Increase indentation level for specific keywords
            if (
                trimmedLine.startsWith("if ") ||
                trimmedLine.startsWith("if(") ||
                trimmedLine.startsWith("instr") ||
                trimmedLine.startsWith("opcode") ||
                trimmedLine.startsWith("else") ||
                trimmedLine.startsWith("while")
            ) {
                indents++;
            }
        }

        return formattedLines;
    }

    static getResourcePath() {
        switch (os.platform()) {
            case 'darwin': // macOS
                return path.join(os.homedir(), 'Library', 'CabbageAudio');
            case 'win32': // Windows
                if (typeof process.env.PROGRAMDATA === 'string' && process.env.PROGRAMDATA.trim() !== '') {
                    return path.join(process.env.PROGRAMDATA, 'CabbageAudio');
                }
                else {
                    Commands.getOutputChannel().appendLine('Failed to get PROGRAMDATA environment variable. Using default path.');
                    return path.join('C:', 'ProgramData', 'CabbageAudio');
                }
            default: // todo..
                return path.join(os.homedir(), '.CabbageAudio');
        }
    }
    /**
     * Compares two objects for deep equality.
     * @param obj1 - The first object to compare.
     * @param obj2 - The second object to compare.
     * @returns true if the objects are deeply equal, false otherwise.
     */
    static deepEqual(obj1: any, obj2: any): boolean {
        // If both are the same instance (including primitives)
        if (obj1 === obj2) {
            return true; // They are equal
        }

        // If either is not an object or is null, they are not equal
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
            return false; // They are not equal
        }

        // Get the keys of both objects
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);

        // If the number of keys is different, the objects are not equal
        if (keys1.length !== keys2.length) {
            return false; // They are not equal
        }

        // Recursively compare properties
        for (let key of keys1) {
            // If the values for the current key are not deeply equal, return false
            if (!ExtensionUtils.deepEqual(obj1[key], obj2[key])) {
                return false; // They are not equal
            }
        }

        // All checks passed; objects are deeply equal
        return true;
    }

    /**
     * Converts old style Cabbage section to use new JSON format.
     * @param editor - The text editor containing the Cabbage section.
     */
    static async convertCabbageCodeToJSON(editor: vscode.TextEditor) {
        const document = editor.document;
        const text = document.getText();
        const cabbageRegex = /<Cabbage>([\s\S]*?)<\/Cabbage>/;
        const match = text.match(cabbageRegex);

        if (!match) {
            vscode.window.showErrorMessage("No Cabbage section found.");
            return;
        }

        const oldStyleWidgets = match[1].trim().split('\n').filter(line => line.trim() !== ''); // Filter out empty lines

        // Function to map old widget types to new camel case types
        const mapWidgetType = (type: string): string => {
            switch (type) {
                case 'hslider':
                    return 'horizontalSlider';
                case 'vslider':
                    return 'verticalSlider';
                case 'rslider':
                    return 'rotarySlider';
                case 'gentable':
                    return 'genTable';
                case 'checkbox':
                    return 'checkBox';
                case 'filebutton':
                    return 'fileButton';
                case 'combobox':
                    return 'comboBox';
                case 'optionbutton':
                    return 'optionButton';
                case 'texteditor':
                    return 'textEditor';
                case 'groupbox':
                    return 'groupBox';
                case 'listbox':
                    return 'listBox';
                case 'csoundoutput':
                default:
                    return type; // Return the original type if no mapping exists
            }
        };

        const newWidgets: Widget[] = oldStyleWidgets.map(line => {
            const widget: Partial<Widget> = {}; // Use Partial to allow for optional properties

            const typeMatch = line.match(/(\w+)\s+/);
            if (typeMatch) {
                widget.type = mapWidgetType(typeMatch[1]); // Map to camel case
            }

            const boundsMatch = line.match(/bounds\(([^)]+)\)/);
            if (boundsMatch) {
                const bounds = boundsMatch[1].split(',').map(Number);
                widget.bounds = { left: bounds[0], top: bounds[1], width: bounds[2], height: bounds[3] };
            }

            const sizeMatch = line.match(/size\(([^)]+)\)/);
            if (sizeMatch) {
                const size = sizeMatch[1].split(',').map(Number);
                widget.size = { width: size[0], height: size[1] }; // Only set if size is defined
            }

            const rangeMatch = line.match(/range\(([^)]+)\)/);
            if (rangeMatch) {
                const range = rangeMatch[1].split(',').map(Number);
                widget.range = {
                    min: range[0],
                    max: range[1],
                    defaultValue: range[2],
                    skew: range[3] !== undefined ? range[3] : 1, // Default to 0 if not provided
                    increment: range[4] !== undefined ? range[4] : 0.001 // Default to 0 if not provided
                };
            }

            const textMatch = line.match(/text\(([^)]+)\)/);
            if (textMatch) {
                const textContent = textMatch[1].split(',').map(t => t.replace(/"/g, '').trim());
                widget.text = textContent.length > 1 ? textContent : textContent[0]; // Set as array or string
            }

            const channelMatch = line.match(/channel\("([^"]+)"\)/);
            if (channelMatch) {
                widget.channel = channelMatch[1];
            }

            return widget as Widget; // Cast back to Widget to ensure type safety
        });

        const newCabbageSection = `<Cabbage>${JSON.stringify(newWidgets, null, 4)}</Cabbage>`;

        const edit = new vscode.WorkspaceEdit();
        edit.replace(
            document.uri,
            new vscode.Range(
                document.positionAt(match.index!),
                document.positionAt(match.index! + match[0].length)
            ),
            newCabbageSection
        );

        vscode.workspace.applyEdit(edit);
    }

    /**
     * Updates a JSON array with new properties while removing defaults.
     * Merges incoming properties (from the props object) into an existing JSON array,
     * while removing any properties that match the default values defined in the defaultProps object.
     * @param jsonArray - The array of existing widget properties.
     * @param props - The new properties to merge into the array.
     * @param defaultProps - The default properties to compare against.
     * @returns The updated JSON array with merged properties.
     */
    static updateJsonArray(jsonArray: WidgetProps[], props: WidgetProps, defaultProps: WidgetProps): WidgetProps[] {
        // Define properties to exclude from JSON output (internal-only fields)
        const excludeFromJson = ['samples', 'currentCsdFile', 'groupBaseBounds', 'origBounds', 'originalProps']; // Add any properties you want to exclude

        // Recursively clone and remove excluded properties from an object
        function cleanForEditor(obj: any): any {
            if (obj === null || obj === undefined) return obj;
            if (Array.isArray(obj)) return obj.map(cleanForEditor);
            if (typeof obj === 'object') {
                const out: any = {};
                Object.keys(obj).forEach((k) => {
                    if (excludeFromJson.includes(k)) return; // skip excluded keys
                    const v = obj[k];
                    out[k] = cleanForEditor(v);
                });
                return out;
            }
            return obj;
        }

        // Helper function to remove excluded properties from an object
        const removeExcludedProps = (obj: any) => {
            const newObj = { ...obj };
            excludeFromJson.forEach(prop => {
                delete newObj[prop];
            });
            return newObj;
        };

        // Check if the new object is of type 'form'
        if (props.type === 'form') {
            const cleanedProps = cleanForEditor(props as any) as WidgetProps;
            const formIndex = jsonArray.findIndex(obj => obj.type === 'form');

            if (formIndex !== -1) {
                let newFormObject = { ...jsonArray[formIndex], ...cleanedProps };
                // Remove properties that match default values
                for (let key in defaultProps) {
                    if (ExtensionUtils.deepEqual(newFormObject[key], defaultProps[key]) && key !== 'type') {
                        delete newFormObject[key];
                    }
                }
                jsonArray[formIndex] = ExtensionUtils.sortOrderOfProperties(removeExcludedProps(newFormObject));
            } else {
                let newFormObject = { ...cleanedProps };
                // Remove properties that match default values
                for (let key in defaultProps) {
                    if (ExtensionUtils.deepEqual(newFormObject[key], defaultProps[key]) && key !== 'type') {
                        delete newFormObject[key];
                    }
                }
                jsonArray.unshift(ExtensionUtils.sortOrderOfProperties(removeExcludedProps(newFormObject)));
            }
            return jsonArray;
        }

        let existingObject = jsonArray.find(obj => obj.channel === props.channel);

        if (existingObject) {
            const cleanedProps = cleanForEditor(props as any) as WidgetProps;
            let newObject = { ...existingObject, ...cleanedProps };
            // Remove properties that match default values
            for (let key in defaultProps) {
                if (ExtensionUtils.deepEqual(newObject[key], defaultProps[key]) && key !== 'type') {
                    delete newObject[key];
                }
            }
            const index = jsonArray.findIndex(obj => obj.channel === props.channel);
            jsonArray[index] = ExtensionUtils.sortOrderOfProperties(removeExcludedProps(newObject));
        } else {
            const cleanedProps = cleanForEditor(props as any) as WidgetProps;
            let newObject = { ...cleanedProps };
            // Remove properties that match default values
            for (let key in defaultProps) {
                if (ExtensionUtils.deepEqual(newObject[key], defaultProps[key]) && key !== 'type') {
                    delete newObject[key];
                }
            }
            jsonArray.push(ExtensionUtils.sortOrderOfProperties(removeExcludedProps(newObject)));
        }

        return jsonArray;
    }

    // Function to find a free port
    static async findFreePort(startPort: number, endPort: number): Promise<number> {
        return new Promise((resolve, reject) => {
            const server = require('net').createServer();
            server.unref();
            server.on('error', (err: any) => {
                Commands.getOutputChannel().appendLine(`Failed to find free port: ${err.message}`);
                console.error('Cabbage: Failed to find free port:', err);
                if (err.code === 'EADDRINUSE' && startPort < endPort) {
                    resolve(ExtensionUtils.findFreePort(startPort + 1, endPort));
                } else {
                    reject(err);
                }
            });
            server.listen(startPort, () => {
                Commands.getOutputChannel().appendLine(`Found a find free port: ${startPort}`);
                console.log('Cabbage: Found a find free port:', startPort);
                const port = server.address().port;
                server.close(() => resolve(port));
            });
        });
    }

    /**
    * Returns html text to use in webview - various scripts get passed as vscode.Uri's
    */
    static getWebViewContent(mainJS: vscode.Uri, styles: vscode.Uri,
        cabbageStyles: vscode.Uri, interactJS: vscode.Uri, widgetWrapper: vscode.Uri,
        colourPickerJS: vscode.Uri, colourPickerStyles: vscode.Uri, isDarkTheme: boolean) {
        const themeClass = isDarkTheme ? 'vscode-dark' : 'vscode-light';
        return `
<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script type="module" src="${interactJS}"></script>
  <script type="module" src="${colourPickerJS}"></script>
  <link href="${styles}" rel="stylesheet">
  <link href="${cabbageStyles}" rel="stylesheet">  
  <link href="${colourPickerStyles}" rel="stylesheet">  
  <script>
            window.interactJS = "${interactJS}";
</script>

  <style>
  .full-height-div {
    height: 100vh; /* Set the height to 100% of the viewport height */
  }
  </style>
</head>

<body data-vscode-context='{"webviewSection": "nav", "preventDefaultContextMenuItems": true}' class="${themeClass}">


<div id="parent" class="full-height-div">
  <div id="LeftPanel" class="full-height-div draggablePanel">
    <div id="MainForm" class="form resizeOnly">
      <div class="wrapper">
        <div class="content" style="overflow-y: auto;">
          <ul class="menu">
          </ul>
        </div>
      </div>
    </div>
    <!-- new draggables go here -->
  </div>
  <span class="popup" id="popupValue">50</span>
  <div id="RightPanel" class="full-height-div">
    <div class="property-panel full-height-div">
      <!-- Properties will be dynamically added here -->
    </div>
  </div>
</div>
<div id="fullScreenOverlay" class="full-screen-div" style="display: none;">
  <!-- Insert your SVG code here -->
  <svg width="416" height="350" viewBox="0 0 416 350" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M246.474 9.04216C313.909 21.973 358.949 68.9013 383.59 128.201L396.749 166.562L406.806 180.947C413.963 192.552 414.248 198.338 414.098 211.317C413.746 238.601 390.597 258.708 362.134 257.606C320.514 256.007 301.84 208.232 324.905 177.751C335.885 163.221 350.92 158.618 368.839 158.57L353.234 117.012C336.136 81.4166 310.272 54.6758 274.97 34.8559C258.04 25.3616 237.188 19.016 217.978 15.3557C208.944 13.6295 194.679 14.3648 189.482 6.72452C212.078 4.98229 223.761 4.6786 246.474 9.04216ZM73.8728 69.0612C64.1004 78.9551 55.6689 90.4475 49.2992 102.627C41.1192 118.259 33.9785 142.73 32.2017 160.169L30.5422 182.546C30.3746 188.236 32.2184 191.257 30.5422 196.931C19.0935 170.206 14.7521 144.728 30.5422 118.611C37.6997 107.838 42.9295 103.314 52.0315 94.6352C41.9573 97.8479 35.42 100.006 26.9551 106.655C4.19183 124.525 -2.46282 158.602 8.1645 184.144C16.6798 204.683 26.8042 205.626 33.5929 219.309C-3.88761 198.434 -10.14 143.577 16.026 112.217C21.2894 105.904 27.7764 100.965 35.2692 97.2405C40.432 94.6672 47.0531 93.3725 50.9755 89.3605L64.1674 70.6596C75.3143 56.7377 77.9963 56.1143 90.5848 45.0855C90.1322 54.0205 80.0078 62.8595 73.8728 69.0612ZM395.592 271.863C364.716 296.11 318.469 290.005 294.968 259.268C281.457 241.622 277.585 217.982 282.53 196.931C287.659 175.129 301.941 155.102 323.581 145.623C329.163 143.178 347.283 136.992 352.513 140.972C355.077 142.922 355.077 146.183 355.429 148.98C345.69 149.811 338.533 152.305 330.286 157.371C312.015 168.576 298.572 188.588 298.572 209.718C298.572 241.67 331.359 274.117 365.487 271.767C390.681 270.025 397.184 260.706 415.774 248.079C410.192 257.973 404.761 264.67 395.592 271.863Z" fill="#0295CF"/>
<path d="M230.675 348.909H227.077L218.08 349.481L213.282 348.962C177.915 346.548 139.152 335.834 110.124 315.074C69.8324 286.272 49.2547 241.867 47.1256 193.3L46.5499 186.742C46.3339 168.183 49.2547 144.15 55.1563 126.526C60.5782 110.351 67.7632 95.3805 78.271 81.811C88.6408 68.4144 96.7255 63.919 105.176 47.2314L122.833 13.2479C124.194 11.0301 128.441 2.76674 130.114 1.75916C131.817 0.727738 133.389 2.13477 134.714 3.12446C136.849 4.71036 139.776 7.36345 142.511 7.61981C145.672 7.91195 147.981 5.39599 149.684 3.11254C150.728 1.72339 151.819 -0.530244 153.93 0.232892C155.256 0.709852 157.637 3.2437 158.704 4.30494C161.919 7.49461 168.978 15.5195 173.099 16.4853C176.367 17.2544 179.234 15.2273 181.489 14.8338C184.854 14.2496 187.091 18.0712 188.776 20.4023L196.147 31.134L204.082 41.8656L215.879 59.7516C226.615 75.7596 236.409 89.2098 241.813 108.044C245.04 119.288 245.201 126.973 245.07 138.45C244.992 144.758 242.551 157.66 241.123 164.087C236.625 184.34 229.752 204.098 228.222 224.899L227.677 230.861V239.208C227.713 261.697 238.262 288.406 250.281 307.175L265.989 329.234L274.458 339.966C264.55 344.288 241.549 348.778 230.675 348.909ZM168.9 3.11254L168.301 3.70874V3.11254H168.9ZM290.051 11.4593L289.452 12.0555V11.4593H290.051ZM291.251 12.0555L290.651 12.6517V12.0555H291.251ZM292.45 12.6517L291.851 13.2479V12.6517H292.45ZM293.65 13.2479L293.05 13.8441V13.2479H293.65ZM294.849 13.8441L294.25 14.4403V13.8441H294.849ZM296.049 14.4403L295.449 15.0365V14.4403H296.049ZM297.248 15.0365L296.649 15.6327V15.0365H297.248ZM298.448 15.6327L297.848 16.2289V15.6327H298.448ZM299.647 16.2289L299.048 16.8251V16.2289H299.647ZM333.234 37.4895L345.481 47.7143C346.452 47.9766 347.79 47.8216 348.828 47.7143C358.184 48.0124 365.111 55.1072 370.161 62.1364C380.699 76.7969 386.09 93.7529 390.433 111.025C392.646 119.825 394.139 128.839 395.105 137.854C395.399 140.578 396.478 146.219 395.609 148.585C395.027 141.699 389.815 126.824 387.242 119.968C376.53 91.4039 357.788 63.0307 335.033 42.5631C328.37 36.5713 321.449 30.8597 314.042 25.7801C310.779 23.5443 303.798 19.7585 301.447 17.4213C312.068 21.9704 324.136 30.3768 333.234 37.4895ZM221.679 26.9606C223.808 27.7654 226.261 28.1231 227.677 29.9356H215.681C212.767 29.9773 206.781 31.277 204.394 29.9356C202.637 28.934 200.502 25.1839 199.488 23.3834C205.066 23.6397 216.605 25.0468 221.679 26.9606ZM231.275 26.9606L230.675 27.5568V26.9606H231.275ZM230.675 32.9226C239.852 32.9344 246.065 36.5475 254.066 40.5241C268.43 47.6666 282.165 56.4427 294.25 66.9954C300.985 72.8859 304.745 76.7314 310.491 83.5996C311.811 85.1795 315.049 88.7329 315.127 90.754C315.181 92.3936 313.226 95.3209 312.326 96.716C309.262 101.444 305.909 106.106 302.292 110.429C289.41 125.852 278.65 133.358 264.262 146.302C260.555 149.635 252.093 159.532 249.268 161.106C250.569 154.017 252.255 146.236 252.267 139.046V127.122C252.249 114.107 246.887 97.3778 240.685 85.9844L217.073 49.02C214.848 45.5143 209.102 37.2748 207.885 34.115L230.675 32.9226ZM275.657 48.4238L275.057 49.02V48.4238H275.657ZM277.456 49.6162L276.857 50.2124V49.6162H277.456ZM320.039 96.1198C327.548 107.316 334.787 120.349 339.231 133.084C330.283 135.439 325.761 135.94 317.04 140.394C297.656 150.291 282.836 169.226 276.275 189.723C263.488 229.675 283.532 276.655 324.837 290.171C333.378 292.967 338.776 293.462 347.628 293.462C344.623 298.572 336.748 305.255 332.034 309.208C320.555 318.836 309.651 325.591 296.049 331.804C291.407 333.92 286.657 336.418 281.655 337.581L272.311 326.253C264.568 316.386 256.609 305.148 250.755 294.058C234.712 263.634 231.473 233.735 239.594 200.455C241.897 191.023 243.384 179.272 248.872 171.241C267.986 143.273 301.195 128.899 318.84 96.1198H320.039Z" fill="#93D200"/>
</svg>

</div>
  <script type="module" src="${widgetWrapper}"></script>
  <script type="module" src="${mainJS}"></script>
  <script>
    // Theme change handling
    window.addEventListener('message', event => {
      const message = event.data;
      if (message.command === 'updateTheme') {
        const body = document.body;
        body.className = message.isDarkTheme ? 'vscode-dark' : 'vscode-light';
      }
    });
  </script>
</body>

</html>`;
    }
    // Helper function to format JSON objects on single lines within the array
    static formatJsonObjects(jsonArray: any[], indentString: string): string {
        const formattedLines = [];

        formattedLines.push("[");  // Opening bracket on its own line

        jsonArray.forEach((obj, index) => {
            const formattedObject = JSON.stringify(obj);
            if (index < jsonArray.length - 1) {
                formattedLines.push(indentString + formattedObject + ','); // Add comma for all but the last object
            } else {
                formattedLines.push(indentString + formattedObject); // Last object without a comma
            }
        });

        formattedLines.push("]");  // Closing bracket on its own line

        return formattedLines.join('\n');
    }

    static sortOrderOfProperties(obj: WidgetProps): WidgetProps {
        const { type, channel, bounds, range, ...rest } = obj; // Destructure type, channel, bounds, range, and the rest of the properties

        // Create an ordered bounds object only if bounds is present in the original object
        const orderedBounds = bounds ? {
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
        } : undefined;

        // Create an ordered range object only if range is present in the original object
        const orderedRange = range ? {
            min: range.min,
            max: range.max,
            defaultValue: range.defaultValue,
            skew: range.skew,
            increment: range.increment,
        } : undefined;

        // Return a new object with the original order and only include bounds/range if they exist
        const result: WidgetProps = {
            type,
            channel,
            ...(orderedBounds && { bounds: orderedBounds }), // Conditionally include bounds
            ...rest,                                         // Include the rest of the properties
        };

        // Only include range if it's defined
        if (orderedRange) {
            result.range = orderedRange;
        }

        return result;
    }



    static async updateExternalJsonFile(editor: vscode.TextEditor, props: WidgetProps, defaultProps: WidgetProps) {
        const document = editor.document;
        const jsonArray = JSON.parse(document.getText()) as WidgetProps[];

        const updatedArray = ExtensionUtils.updateJsonArray(jsonArray, props, defaultProps);
        const updatedContent = JSON.stringify(updatedArray, null, 2);

        await editor.edit(editBuilder => {
            const entireRange = new vscode.Range(
                document.positionAt(0),
                document.positionAt(document.getText().length)
            );
            editBuilder.replace(entireRange, updatedContent);
        });
    }


    static getExternalJsonFileName(cabbageContent: string, csdFilePath: string): string {
        // Regular expression to find the include statement
        const includeRegex = /#include\s*"([^"]+\.json)"/;
        const includeMatch = includeRegex.exec(cabbageContent);

        if (includeMatch && includeMatch[1]) {
            const includeFilename = includeMatch[1];

            // Check if the path is relative, if so resolve it relative to the csd file
            if (!path.isAbsolute(includeFilename)) {
                return path.resolve(path.dirname(csdFilePath), includeFilename);
            }
            return includeFilename; // Absolute path
        }

        // Fallback: use the same name as the .csd file but with a .json extension
        const fallbackJsonFile = csdFilePath.replace(/\.csd$/, '.json');

        // Check if the fallback file exists
        if (require('fs').existsSync(fallbackJsonFile)) {
            return fallbackJsonFile;
        }

        // Return an empty string if no external JSON file is found
        return '';
    }

    static getNewCabbageFile(type: string) {
        if (type === 'effect') {
            return `
<Cabbage>[
{"type":"form","caption":"Effect","size":{"width":580,"height":300},"pluginId":"def1"},
{"type":"rotarySlider","channel":"gain","bounds":{"left":500,"top":200,"width":80,"height":80}, "text":"Gain", "range":{"min":0,"max":1,"defaultValue":0.5,"skew":1,"increment":0.01}}
]</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d
</CsOptions>e
<CsInstruments>
; Initialize the global variables. 
ksmps = 32
nchnls = 2
0dbfs = 1

instr 1
    a1 inch 1
    kGain cabbageGetValue "gain"

    outs a1*kGain, a1*kGain
endin

</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
i1 0 z
</CsScore>
</CsoundSynthesizer>`;
        }
        else if (type === 'synth') {
            return `
<Cabbage>[
{"type":"form","caption":"Synth","size":{"width":580,"height":300},"pluginId":"def1"},
{"type":"keyboard", "bounds":{"left":10,"top":100,"width":500,"height":100}}
]</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -+rtmidi=NULL -M0 --midi-key-cps=4 --midi-velocity-amp=5
</CsOptions>
<CsInstruments>
; Initialize the global variables. 
ksmps = 32
nchnls = 2
0dbfs = 1


instr 1
    vco:a = vco(p4, p4)
    outa(voc, vco)
endin

</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
f0 z
</CsScore>
</CsoundSynthesizer>`;
        }
    }
    static getIndexHtml() {
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
            /* Prevent text selection globally */
            -webkit-user-select: none;
            /* For Safari */
            -moz-user-select: none;
            /* For Firefox */
            -ms-user-select: none;
            /* For Internet Explorer/Edge */
            /* Prevent scrollbars */
        }
    </style>
</head>
<body>
    <script type="module" src="cabbage/widgets/rotarySlider.js"></script>
    <script type="module" src="cabbage/widgets/csoundOutput.js"></script>
    <script type="module" src="cabbage/widgets/fileButton.js"></script>
    <script type="module" src="cabbage/widgets/genTable.js"></script>
    <script type="module" src="cabbage/widgets/groupBox.js"></script>
    <script type="module" src="cabbage/widgets/image.js"></script>
    <script type="module" src="cabbage/widgets/keyboard.js"></script>
    <script type="module" src="cabbage/widgets/numberSlider.js"></script>
    <script type="module" src="cabbage/widgets/optionButton.js"></script>
    <script type="module" src="cabbage/widgets/textEditor.js"></script>
    <script type="module" src="cabbage/widgets/form.js"></script>
    <script type="module" src="cabbage/widgets/label.js"></script>
    <script type="module" src="cabbage/widgets/button.js"></script>
    <script type="module" src="cabbage/widgets/verticalSlider.js"></script>
    <script type="module" src="cabbage/widgets/horizontalSlider.js"></script>
    <script type="module" src="cabbage/widgets/horizontalRangeSlider.js"></script>
    <script type="module" src="cabbage/widgets/comboBox.js"></script>
    <script type="module" src="cabbage/widgets/checkBox.js"></script>
    <script type="module" src="cabbage/widgets/listbox.js"></script>
    <script type="module" src="cabbage/utils.js"></script>
    <script type="module" src="cabbage/cabbage.js"></script>
    <script type="module" src="cabbage/main.js"></script>

    <span class="popup" id="popupValue">50</span>
    <!-- <div id="MainForm" class="form nonDraggable">
    </div> -->
</body>
</html>`;
    }


}