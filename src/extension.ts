// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import { GetDefaultPropsFor } from "../media/widgets.js";

//don't think I need this as only one instance of the extension can run at a timw..
//import { getNonce } from './getNonce';

let textEditor: vscode.TextEditor | undefined;

function DBG(...text: string[]) {
	console.log("Cabbage:", text.join(','));
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "cabbage" is now active!');

	context.subscriptions.push(vscode.commands.registerCommand('cabbage.launchUIEditor', () => {
		// The code you place here will be executed every time your command is executed
		const panel = vscode.window.createWebviewPanel(
			'cabbageUIEditor',
			'Cabbage UI Editor',
			//load in second column, I guess this could be controlled by settings
			vscode.ViewColumn.Two,
			{}
		);


		//makes sure the editor currently displayed has focus..
		vscode.commands.executeCommand('workbench.action.focusNextGroup');
		vscode.commands.executeCommand('workbench.action.focusPreviousGroup');

		//this is a little clunky, but it seems I have to load each src individually
		let onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'main.js');
		const mainJS = panel.webview.asWebviewUri(onDiskPath);
		onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css');
		const styles = panel.webview.asWebviewUri(onDiskPath);
		onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'interact.min.js');
		const interactJS = panel.webview.asWebviewUri(onDiskPath);
		onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'widgets.js');
		const widgetSVGs = panel.webview.asWebviewUri(onDiskPath);
		onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'widgetWrapper.js');
		const widgetWrapper = panel.webview.asWebviewUri(onDiskPath);

		//add widget types to menu
		const widgetTypes = ["button", "optionbutton", "checkbox", "combobox", "csoundoutput", "encoder", "fftdisplay", "filebutton", "presetbutton", "form",
			"gentable", "groupbox", "hmeter", "hrange", "hslider", "image", "webview", "infobutton", "keyboard", "label", "listbox", "nslider",
			"rslider", "signaldisplay", "soundfiler", "textbox", "texteditor", "vmeter", "vrange", "vslider", "xypad"];

		let menuItems = "";
		widgetTypes.forEach((widget) => {
			menuItems += `
			<li class="menuItem">
			<span>${widget}</span>
	  		</li>
			`;
		});


		// set webview HTML content and options
		panel.webview.html = getWebviewContent(mainJS, styles, interactJS, widgetSVGs, widgetWrapper, menuItems);
		panel.webview.options = { enableScripts: true };

		//assign current textEditor so we can track it even if focus changes to the webview
		panel.onDidChangeViewState(() => {
			textEditor = vscode.window.activeTextEditor;
		})

		//send text to webview for parsing if file has an extension of csd and contains valid Cabbage tags
		function sendTextToWebView(editor: vscode.TextDocument | undefined, command: string) {
			if (editor) {
				if (editor.fileName.split('.').pop() === 'csd') {
					//reload the webview
					vscode.commands.executeCommand("workbench.action.webview.reloadWebviewAction");
					//now check for Cabbage tags..
					if (editor?.getText().indexOf('<Cabbage>') != -1 && editor?.getText().indexOf('</Cabbage>') != -1){
						panel.webview.postMessage({ command: command, text: editor?.getText() });
					}
					
				}
			}
		}
		//notify webview when various updates take place in editor
		vscode.workspace.onDidSaveTextDocument((editor) => {
			sendTextToWebView(editor, 'onFileChanged');
		});

		vscode.workspace.onDidOpenTextDocument((editor) => {
			sendTextToWebView(editor, 'onFileChanged');
		});

		vscode.window.tabGroups.onDidChangeTabs((tabs)=>{
			//triggered when tab changes
			//console.log(tabs.changed.label);
		});

		// callback for when users update widget properties in webview
		panel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'widgetUpdate':
						updateText(message.text);
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	})
	);


	context.subscriptions.push(vscode.commands.registerCommand('cabbage.editText', () => {
		// The code you place here will be executed every time your command is executed
		// Place holder - but these commands will eventually launch Cabbage standalone 
		// with the file currently in focus. 
	})
	);

}

/**
 * This uses a simple regex pattern to get tokens from a line of Cabbage code
 */
function getTokens(text: string) {
	const inputString = text
	const regex = /(\w+)\(([^)]+)\)/g;
	const tokens = [];
	let match;
	while ((match = regex.exec(inputString)) !== null) {
		const token = match[1];
		const values = match[2].split(',').map(value => value.trim()); // Split values into an array
		tokens.push({ token, values });
	}
	return tokens;
}

/**
 * This function will return an identifier in the form of ident(param) from an incoming
 * JSON object of properties
 */
function getIdentifierFromJson(json: string, name: string): string {
	const obj = JSON.parse(json);
	let syntax = '';
	for (const key in obj) {
		if (obj.hasOwnProperty(key) && key === name) {
			const value = obj[key];
			// Check if value is string and if so, wrap it in single quotes
			const formattedValue = typeof value === 'string' ? `"${value}"` : value;
			syntax += `${key}(${formattedValue}), `;
		}
	}
	// Remove the trailing comma and space
	syntax = syntax.slice(0, -2);
	return syntax;
}

/**
 * This function will check the current widget props against the default set, and return an 
 * array for any identifiers that are different to their default values
 */
function findUpdatedIdentifiers(initial: string, current: string) {
	const initialWidgetObj = JSON.parse(initial);
	const currentWidgetObj = JSON.parse(current);

	var updatedIdentifiers = [];

	// Iterate over the keys of obj1
	for (var key in initialWidgetObj) {
		// Check if obj2 has the same key
		if (currentWidgetObj.hasOwnProperty(key)) {
			// Compare the values of the keys
			if (initialWidgetObj[key] !== currentWidgetObj[key]) {
				// If values are different, add the key to the differentKeys array
				updatedIdentifiers.push(key);
			}
		} else {
			// If obj2 doesn't have the key from obj1, add it to differentKeys array
			updatedIdentifiers.push(key);
		}
	}

	// Iterate over the keys of obj2 to find any keys not present in obj1
	for (var key in currentWidgetObj) {
		if (!initialWidgetObj.hasOwnProperty(key)) {
			// Add the key to differentKeys array
			updatedIdentifiers.push(key);
		}
	}

	return updatedIdentifiers;
}

/**
 * This function will update the text associated with a widget
 */
function updateText(jsonText: string) {
	const props = JSON.parse(jsonText);
	if (textEditor) {
		const document = textEditor.document;
		let lineNumber = 0;
		//get default props so we can compare them to incoming one and display any that are different
		const defaultProps = GetDefaultPropsFor(props.type);
		console.log(JSON.stringify(defaultProps));
		console.log(jsonText);

		textEditor.edit(editBuilder => {
			if (textEditor) {

				let foundChannel = false;
				let lines = document.getText().split(/\r?\n/);
				for (let i = 0; i < lines.length; i++) {

					let tokens = getTokens(lines[i]);
					const index = tokens.findIndex(({ token }) => token === 'channel');

					if (index != -1) {
						const channel = tokens[index].values[0].replace(/"/g, "");
						if (channel == props.channel) {
							foundChannel = true;
							//found entry - now update bounds
							const updatedIdentifiers = findUpdatedIdentifiers(JSON.stringify(defaultProps), jsonText);
							console.log(updatedIdentifiers);
							updatedIdentifiers.forEach((ident) => {
								if (ident != "top" && ident != "left" && ident != "width" && ident != "height" && ident != "name") {
									const newIndex = tokens.findIndex(({ token }) => token == ident);
									//each token has an array of values with it..
									const data: string[] = [];
									data.push(props[ident])
									if (newIndex == -1) {
										const identifier: string = ident;
										tokens.push({ token: identifier, values: data });
									}
									else {
										tokens[newIndex].values = data;
									}
								}
							})
							const boundsIndex = tokens.findIndex(({ token }) => token === 'bounds');
							tokens[boundsIndex].values = [props.left, props.top, props.width, props.height];
							lines[i] = `${lines[i].split(' ')[0]} ` + tokens.map(({ token, values }) =>
								typeof values[0] === 'string' ? `${token}("${values.join(', ')}")` : `${token}(${values.join(', ')})`
							).join(', ');
							editBuilder.replace(new vscode.Range(document.lineAt(i).range.start, document.lineAt(i).range.end), lines[i]);
							textEditor.selection = new vscode.Selection(i, 0, i, 10000);
						}
						else if (props.type == "form") {
							DBG("should update the form code in the editor now");
						}
					}
					if (lines[i] === '</Cabbage>')
						break;
				}

				let count = 0;
				lines.forEach((line) => {
					if (line.trimStart().startsWith("</Cabbage>"))
					  lineNumber = count;
					count++;
				  })

				if (!foundChannel && props.type != "form") {
					const newLine = `${props.type} bounds(${props.left}, ${props.top}, ${props.width}, ${props.height}), ${getIdentifierFromJson(jsonText, "channel")}\n`;
					editBuilder.insert(new vscode.Position(lineNumber, 0), newLine);
					textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 10000);
				}
			}
		}
	}
}

/**
 * Returns html text to use in webview - various scripts get passed as vscode.Uri's
 */
function getWebviewContent(mainJS: vscode.Uri, styles: vscode.Uri, interactJS: vscode.Uri, widgetSVGs: vscode.Uri, widgetWrapper: vscode.Uri, menu: string) {
	return `
<!doctype html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script type="module" src="${interactJS}"></script>
  <link href="${styles}" rel="stylesheet">
</head>

<body data-vscode-context='{"webviewSection": "nav", "preventDefaultContextMenuItems": true}'>



  <div id="parent">
    <div id="LeftCol">
		<div id="MainForm" class="form resize-drag">
		<div class="wrapper">
		<div class="content" style="overflow-y: auto;height: 300px;">
		  <ul class="menu">
			${menu}
		  </ul>
		</div>
  </div>
		</div>
    	<!-- new draggables go here -->
    </div>
    <div id="RightCol">
      <div class="property-panel">
        <!-- Properties will be dynamically added here -->
      </div>
    </div>
  </div>
  <script type="module" src="${widgetSVGs}"></script>
  <script type="module" src="${widgetWrapper}"></script>
  <script type="module" src="${mainJS}"></script>
</body>

</html>`}




// 	`<!DOCTYPE html>
//   <html lang="en">
//   <head>
// 	  <meta charset="UTF-8">
// 	  <meta name="viewport" content="width=device-width, initial-scale=1.0">
// 	  <title>Cat Coding</title>
//   </head>
//   <body>
// 	  <h1>Hello rory</h1>
// 	  <script>
//   (function() {
// 	  const vscode = acquireVsCodeApi();
// 	  addEventListener("mousedown", (event) => {
// 		vscode.postMessage({
// 			command: 'updateText',
// 			text: 'Update to fuck!'
// 		})
// 	  });
//   }())
// </script>
//   </body>

//   </html>
//   `;
// }

// This method is called when your extension is deactivated
export function deactivate() { }
