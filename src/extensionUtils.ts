
import * as vscode from 'vscode';
import { WidgetProps } from './cabbage/types';
import path from 'path';
import { initialiseDefaultProps } from './cabbage/types';

export class ExtensionUtils {
    //send text to webview for parsing if file has an extension of csd and contains valid Cabbage tags
    static sendTextToWebView(editor: vscode.TextDocument | undefined, command: string, panel: vscode.WebviewPanel | undefined) {
        if (editor) {
            if (editor.fileName.split('.').pop() === 'csd') {
                //reload the webview
                vscode.commands.executeCommand("workbench.action.webview.reloadWebviewAction");
                //now check for Cabbage tags..
                if (editor?.getText().indexOf('<Cabbage>') !== -1 && editor?.getText().indexOf('</Cabbage>') !== -1) {
                    if (panel) { panel.webview.postMessage({ command: command, text: editor?.getText() }); }
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

    static async openOrShowTextDocument(filePath: string): Promise<vscode.TextEditor | null> {
        try {
            // Find the current .csd file's view column, defaulting to ViewColumn.One if not found
            const csdEditor = vscode.window.visibleTextEditors.find(
                editor => editor.document.fileName.endsWith('.csd')
            );

            // Default to ViewColumn.One if the .csd file's view column is not found
            const viewColumn = csdEditor ? csdEditor.viewColumn : vscode.ViewColumn.One;

            // Check if the file is already open in an editor
            const existingEditor = vscode.window.visibleTextEditors.find(
                editor => editor.document.fileName === filePath
            );

            if (existingEditor) {
                // If already open, return the existing editor without changing focus
                return existingEditor;
            }

            // Open the document without immediately showing it in the editor
            const document = await vscode.workspace.openTextDocument(filePath);

            // Show the document in the specified view column without bringing it to the front
            return vscode.window.showTextDocument(document, { preview: false, viewColumn, preserveFocus: true });
        } catch (error) {
            console.error(`Failed to open document: ${filePath}`, error);
            return null;
        }
    }

    static async updateText(jsonText: string, cabbageMode: string, vscodeOutputChannel: vscode.OutputChannel, textEditor: vscode.TextEditor | undefined, highlightDecorationType: vscode.TextEditorDecorationType) {
        if (cabbageMode === "play") {
            return;
        }
    
    
        let props: WidgetProps;
        try {
            props = JSON.parse(jsonText);
        } catch (error) {
            console.error("Failed to parse JSON text:", error);
            vscodeOutputChannel.append(`Failed to parse JSON text: ${error}`);
            return;
        }
    
        if (!textEditor) {
            console.error("No text editor is available.");
            return;
        }
    
        const document = textEditor.document;
        const originalText = document.getText();
    
        const defaultProps = await initialiseDefaultProps(props.type);
        if (!defaultProps) {
            return;
        }
    
        const cabbageRegex = /<Cabbage>([\s\S]*?)<\/Cabbage>/;
        const cabbageMatch = originalText.match(cabbageRegex);
    
        let externalFile = '';
    
        if (cabbageMatch) {
            const cabbageContent = cabbageMatch[1].trim();
    
            try {
                // Attempt to parse the existing JSON array
                const cabbageJsonArray = JSON.parse(cabbageContent) as WidgetProps[];
    
                // Check if there's a "form" type object in the parsed JSON array
                const hasFormType = cabbageJsonArray.some(obj => obj.type === 'form');
    
                // Only search for an external file if there isn't a "form" type
                if (!hasFormType) {
                    externalFile = ExtensionUtils.getExternalJsonFileName(cabbageContent, document.fileName);
                }
    
                if (!externalFile) {
                    // Update the existing JSON array with the new props
                    const updatedJsonArray = ExtensionUtils.updateJsonArray(cabbageJsonArray, props, defaultProps);
    
                    // Access configuration settings for JSON formatting
                    const config = vscode.workspace.getConfiguration("cabbage");
                    const isSingleLine = config.get("defaultJsonFormatting") === 'Single line objects';
    
                    // Format the JSON array based on the user's configuration
                    const formattedArray = isSingleLine
                        ? ExtensionUtils.formatJsonObjects(updatedJsonArray, '    ') // Single-line formatting
                        : JSON.stringify(updatedJsonArray, null, 4); // Multi-line formatting with indentation
    
                    // Recreate the Cabbage section with the formatted array
                    const updatedCabbageSection = `<Cabbage>${formattedArray}</Cabbage>`;
    
                    await textEditor.edit(editBuilder => editBuilder.replace(
                        new vscode.Range(
                            document.positionAt(cabbageMatch.index ?? 0),
                            document.positionAt((cabbageMatch.index ?? 0) + cabbageMatch[0].length)
                        ),
                        updatedCabbageSection
                    ));
    
                    // Call the separate function to handle highlighting
                    if (cabbageMatch.index !== undefined) {
                        ExtensionUtils.highlightAndScrollToUpdatedObject(props, cabbageMatch.index, isSingleLine, textEditor, highlightDecorationType);
                    } else {
                        console.error("Cabbage match index is undefined.");
                    }
                }
            } catch (parseError) {
                // console.error("Failed to parse Cabbage content as JSON:", parseError);
                vscodeOutputChannel.append(`Failed to parse Cabbage content as JSON: ${parseError}`);
                return;
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
    

    static formatText(text: string, indentSpaces: number = 4): string {
        const lines = text.split('\n');
        let indents = 0;
        let formattedText = '';
        let insideCabbage = false;
        let cabbageContent = '';

        // Create a string with the specified number of spaces
        const indentString = ' '.repeat(indentSpaces);

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();

            // Detect the start of the <Cabbage> block
            if (trimmedLine.startsWith('<Cabbage>')) {
                insideCabbage = true;
                formattedText += line + '\n';
                return;
            }

            // Detect the end of the </Cabbage> block
            if (trimmedLine.startsWith('</Cabbage>')) {
                insideCabbage = false;

                // Process and format the JSON content
                try {
                    const jsonArray = JSON.parse(cabbageContent);
                    const formattedJson = ExtensionUtils.formatJsonObjects(jsonArray, '');
                    formattedText += formattedJson + '\n';
                } catch (error) {
                    formattedText += cabbageContent + '\n'; // If parsing fails, keep the original content
                }

                formattedText += line + '\n';
                cabbageContent = ''; // Reset the Cabbage content
                return;
            }

            if (insideCabbage) {
                // Collect Cabbage content
                cabbageContent += line.trim();
            } else {
                // Continue with the regular Csound formatting logic

                // Trim leading whitespace from non-empty lines
                const trimmedLine = line.trim().length > 0 ? line.trimStart() : line;

                // Increase indentation level for specific keywords
                if (index > 0 && (
                    lines[index - 1].trim().startsWith("if ") ||
                    lines[index - 1].trim().startsWith("if(") ||
                    lines[index - 1].trim().startsWith("instr") ||
                    lines[index - 1].trim().startsWith("opcode") ||
                    lines[index - 1].trim().startsWith("else") ||
                    lines[index - 1].trim().startsWith("while")
                )) {
                    indents++;
                }

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
                formattedText += indentText + trimmedLine + '\n';
            }
        });

        return formattedText;
    }

    static deepEqual(obj1: any, obj2: any): boolean {
        // If both are the same instance (including primitives)
        if (obj1 === obj2) return true;

        // If either is not an object, they are not equal
        if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
            return false;
        }

        // Compare the number of keys (early return if different)
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;

        // Recursively compare properties
        for (let key of keys1) {
            if (!ExtensionUtils.deepEqual(obj1[key], obj2[key])) return false;
        }

        return true;
    }

    //this function will merge incoming properties (from the props object) into an existing JSON array, while removing any 
    //properties that match the default values defined in the defaultProps object.
    static updateJsonArray(jsonArray: WidgetProps[], props: WidgetProps, defaultProps: WidgetProps): WidgetProps[] {

        for (let i = 0; i < jsonArray.length; i++) {
            let jsonObject = jsonArray[i];
            if (jsonObject.channel === props.channel) {
                let newObject = { ...jsonObject, ...props };

                for (let key in defaultProps) {
                    // Check for deep equality when comparing objects
                    if (ExtensionUtils.deepEqual(newObject[key], defaultProps[key]) && key !== 'type') {
                        delete newObject[key]; // Remove matching property or object
                    }
                }

                jsonArray[i] = ExtensionUtils.sortOrderOfProperties(newObject);
                break;
            }
        }

        return jsonArray;
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

}
