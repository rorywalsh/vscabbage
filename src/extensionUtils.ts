
import * as vscode from 'vscode';
import { WidgetProps } from './types';

export class ExtensionUtils {
    //send text to webview for parsing if file has an extension of csd and contains valid Cabbage tags
    static sendTextToWebView(editor: vscode.TextDocument | undefined, command: string, panel: vscode.WebviewPanel | undefined) {
        if (editor) {
            if (editor.fileName.split('.').pop() === 'csd') {
                //reload the webview
                vscode.commands.executeCommand("workbench.action.webview.reloadWebviewAction");
                //now check for Cabbage tags..
                if (editor?.getText().indexOf('<Cabbage>') !== -1 && editor?.getText().indexOf('</Cabbage>') !== -1) {
                    if (panel)
                        {panel.webview.postMessage({ command: command, text: editor?.getText() });}
                }
            }
        }
    }
    
    // Define a function to initialize or update highlightDecorationType
    static initialiseHighlightDecorationType(highlightDecorationType: vscode.TextEditorDecorationType | undefined) {
        if (!highlightDecorationType) {
            highlightDecorationType = vscode.window.createTextEditorDecorationType({
                backgroundColor: 'rgba(0, 0, 0, 0.1)'
            });
        }
    }

    static highlightAndScrollToUpdatedObject(updatedProps: WidgetProps, cabbageStartIndex: number, isSingleLine: boolean, 
        textEditor: vscode.TextEditor | undefined,
        highlightDecorationType: vscode.TextEditorDecorationType) {
        if (!textEditor) {
            return;
        }
    
        const document = textEditor.document;
        const documentText = document.getText();
        const lines = documentText.split('\n');
    
        // Ensure highlightDecorationType is initialized
        ExtensionUtils.initialiseHighlightDecorationType(highlightDecorationType);
    
        // Clear previous decorations
        if (highlightDecorationType) {
            textEditor.setDecorations(highlightDecorationType, []);
        }
    
        if (isSingleLine) {
            // Define regex pattern to match the line containing the "channel" property
            const channelPattern = new RegExp(`"channel":\\s*"${updatedProps.channel}"`, 'i');
    
            // Find the line number using the regex pattern
            const lineNumber = lines.findIndex(line => channelPattern.test(line));
    
            if (lineNumber >= 0) {
                const start = new vscode.Position(lineNumber, 0);
                const end = new vscode.Position(lineNumber, lines[lineNumber].length);
                textEditor.setDecorations(highlightDecorationType, [
                    { range: new vscode.Range(start, end) }
                ]);
                textEditor.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenter);
            }
        } else {
            // Handling for multi-line objects
            // Improved regex pattern to match a JSON object containing the specified channel
            const pattern = new RegExp(`\\{(?:[^{}]|\\{[^{}]*\\})*?"channel":\\s*"${updatedProps.channel}"(?:[^{}]|\\{[^{}]*\\})*?\\}`, 's');
            const match = pattern.exec(documentText);
    
            if (match) {
                const objectText = match[0];
                const objectStartIndex = documentText.indexOf(objectText);
                const objectEndIndex = objectStartIndex + objectText.length;
    
                const startPos = document.positionAt(objectStartIndex);
                const endPos = document.positionAt(objectEndIndex);
    
                textEditor.setDecorations(highlightDecorationType, [
                    { range: new vscode.Range(startPos, endPos) }
                ]);
                textEditor.revealRange(new vscode.Range(startPos, endPos), vscode.TextEditorRevealType.InCenter);
            }
        }
    }

}
