import * as vscode from 'vscode';
// @ts-ignore
import { WidgetProps } from './cabbage/widgetTypes';
import path from 'path';
// @ts-ignore
import { initialiseDefaultProps } from './cabbage/widgetTypes';

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
        highlightDecorationType: vscode.TextEditorDecorationType,
        shouldScroll: boolean = true) {
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
                if (shouldScroll) {
                    textEditor.revealRange(new vscode.Range(start, end), vscode.TextEditorRevealType.InCenter);
                }
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
                if (shouldScroll) {
                    textEditor.revealRange(new vscode.Range(startPos, endPos), vscode.TextEditorRevealType.InCenter);
                }
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

    static async updateText(jsonText: string, cabbageMode: string, vscodeOutputChannel: vscode.OutputChannel, textEditor: vscode.TextEditor | undefined, highlightDecorationType: vscode.TextEditorDecorationType, lastSavedFileName: string | undefined, panel: vscode.WebviewPanel | undefined) {
        if (cabbageMode === "play") {
            return;
        }

        console.log("updateText called. textEditor:", !!textEditor, "lastSavedFileName:", lastSavedFileName);

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
            console.log("Attempting to open document:", lastSavedFileName);
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

        const cabbageRegex = /<Cabbage>([\s\S]*?)<\/Cabbage>/;
        const cabbageMatch = originalText.match(cabbageRegex);

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
                    const formattedArray = isSingleLine
                        ? ExtensionUtils.formatJsonObjects(updatedJsonArray, '    ')
                        : JSON.stringify(updatedJsonArray, null, 4);

                    const updatedCabbageSection = `<Cabbage>${formattedArray}</Cabbage>`;

                    const isInSameColumn = panel && textEditor && panel.viewColumn === textEditor.viewColumn;

                    // Always update the document content
                    const workspaceEdit = new vscode.WorkspaceEdit();
                    workspaceEdit.replace(
                        document.uri,
                        new vscode.Range(
                            document.positionAt(cabbageMatch.index ?? 0),
                            document.positionAt((cabbageMatch.index ?? 0) + cabbageMatch[0].length)
                        ),
                        updatedCabbageSection
                    );
                    await vscode.workspace.applyEdit(workspaceEdit);

                    if (cabbageMatch.index !== undefined && textEditor) {
                        ExtensionUtils.highlightAndScrollToUpdatedObject(props, cabbageMatch.index, isSingleLine, textEditor, highlightDecorationType, !isInSameColumn);
                    }
                }
            } catch (parseError) {
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

    /**
    * Returns html text to use in webview - various scripts get passed as vscode.Uri's
    */
    static getWebViewContent(mainJS: vscode.Uri, styles: vscode.Uri,
        cabbageStyles: vscode.Uri, interactJS: vscode.Uri, widgetWrapper: vscode.Uri,
        colourPickerJS: vscode.Uri, colourPickerStyles: vscode.Uri) {
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

<body data-vscode-context='{"webviewSection": "nav", "preventDefaultContextMenuItems": true}'>


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
</body>

</html>`
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