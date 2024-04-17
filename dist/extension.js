/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ (function(__unused_webpack_module, exports, __webpack_require__) {


var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = __importStar(__webpack_require__(1));
const widgets_js_1 = __webpack_require__(2);
//don't think I need this as only one instance of the extension can run at a timw..
//import { getNonce } from './getNonce';
let textEditor;
function DBG(...text) {
    console.log("Cabbage:", text.join(','));
}
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
function activate(context) {
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "cabbage" is now active!');
    context.subscriptions.push(vscode.commands.registerCommand('cabbage.launchUIEditor', () => {
        // The code you place here will be executed every time your command is executed
        const panel = vscode.window.createWebviewPanel('cabbageUIEditor', 'Cabbage UI Editor', 
        //load in second column, I guess this could be controlled by settings
        vscode.ViewColumn.Two, {});
        //makes sure the editor currently displayed has focus..
        vscode.commands.executeCommand('workbench.action.focusNextGroup');
        vscode.commands.executeCommand('workbench.action.focusPreviousGroup');
        //this is a little clunky, but it seems I have to load each src individually
        let onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'main.js');
        const mainJS = panel.webview.asWebviewUri(onDiskPath);
        onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'media', 'vscode.css');
        const styles = panel.webview.asWebviewUri(onDiskPath);
        onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'interact.min.js');
        const interactJS = panel.webview.asWebviewUri(onDiskPath);
        onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'widgets.js');
        const widgetSVGs = panel.webview.asWebviewUri(onDiskPath);
        onDiskPath = vscode.Uri.joinPath(context.extensionUri, 'src', 'widgetWrapper.js');
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
        });
        //send text to webview for parsing if file has an extension of csd and contains valid Cabbage tags
        function sendTextToWebView(editor, command) {
            if (editor) {
                if (editor.fileName.split('.').pop() === 'csd') {
                    //reload the webview
                    vscode.commands.executeCommand("workbench.action.webview.reloadWebviewAction");
                    //now check for Cabbage tags..
                    if (editor?.getText().indexOf('<Cabbage>') != -1 && editor?.getText().indexOf('</Cabbage>') != -1) {
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
        vscode.window.tabGroups.onDidChangeTabs((tabs) => {
            //triggered when tab changes
            //console.log(tabs.changed.label);
        });
        // callback for when users update widget properties in webview
        panel.webview.onDidReceiveMessage(message => {
            switch (message.command) {
                case 'widgetUpdate':
                    updateText(message.text);
                    return;
            }
        }, undefined, context.subscriptions);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('cabbage.editText', () => {
        // The code you place here will be executed every time your command is executed
        // Place holder - but these commands will eventually launch Cabbage standalone 
        // with the file currently in focus. 
    }));
}
exports.activate = activate;
/**
 * This uses a simple regex pattern to get tokens from a line of Cabbage code
 */
function getTokens(text) {
    const inputString = text;
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
function getIdentifierFromJson(json, name) {
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
function findUpdatedIdentifiers(initial, current) {
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
        }
        else {
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
function updateText(jsonText) {
    const props = JSON.parse(jsonText);
    if (textEditor) {
        const document = textEditor.document;
        let lineNumber = 0;
        //get default props so we can compare them to incoming one and display any that are different
        const defaultProps = (0, widgets_js_1.DefaultWidgetProps)(props.type);
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
                                    const data = [];
                                    data.push(props[ident]);
                                    if (newIndex == -1) {
                                        const identifier = ident;
                                        tokens.push({ token: identifier, values: data });
                                    }
                                    else {
                                        tokens[newIndex].values = data;
                                    }
                                }
                            });
                            const boundsIndex = tokens.findIndex(({ token }) => token === 'bounds');
                            tokens[boundsIndex].values = [props.left, props.top, props.width, props.height];
                            lines[i] = `${lines[i].split(' ')[0]} ` + tokens.map(({ token, values }) => typeof values[0] === 'string' ? `${token}("${values.join(', ')}")` : `${token}(${values.join(', ')})`).join(', ');
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
                });
                if (!foundChannel && props.type != "form") {
                    const newLine = `${props.type} bounds(${props.left}, ${props.top}, ${props.width}, ${props.height}), ${getIdentifierFromJson(jsonText, "channel")}\n`;
                    editBuilder.insert(new vscode.Position(lineNumber, 0), newLine);
                    textEditor.selection = new vscode.Selection(lineNumber, 0, lineNumber, 10000);
                }
            }
        });
    }
}
/**
 * Returns html text to use in webview - various scripts get passed as vscode.Uri's
 */
function getWebviewContent(mainJS, styles, interactJS, widgetSVGs, widgetWrapper, menu) {
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

</html>`;
}
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
function deactivate() { }
exports.deactivate = deactivate;


/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("vscode");

/***/ }),
/* 2 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DefaultWidgetProps: () => (/* binding */ DefaultWidgetProps),
/* harmony export */   WidgetSVG: () => (/* binding */ WidgetSVG)
/* harmony export */ });

const formProps = {
  "top": 0,
  "left": 0,
  "width": 600,
  "height": 300,
  "caption": "",
  "name": "MainForm",
  "type": "form",
  "guiRefresh": 128,
  "identChannel": "",
  "automatable": 0.0,
  "visible": 1,
  "scrollbars": 0,
  "titleBarColour": '57, 70, 76',
  "titleBarGradient": 0.15,
  "titleBarHeight": 24,
  "style": "",
  "channelType": "number",
  "colour": '2, 149, 207'
}

const rotarySliderProps = {
  "top": 10,
  "left": 10,
  "width": 60,
  "height": 60,
  "textBoxOutlineColour": '245, 245, 245',
  "channel": 'rslider',
  "min": 0,
  "max": 1,
  "value": 0,
  "sliderSkew": 1,
  "increment": .001,
  "text": "",
  "valueTextBox": 0.,
  "textBoxColour": '245, 245, 245',
  "colour": '2, 149, 207',
  "trackerColour": '147, 210, 0',
  "trackerBgColour": '0, 0, 0',
  "markerColour": '80, 80, 80',
  "markerThickness": 1,
  "markerStart": 0.5,
  "markerEnd": 0.9,
  "fontColour": '245, 245, 245',
  "textColour": '245, 245, 245',
  "outlineColour": '20, 20, 20',
  "name": "",
  "type": "rslider",
  "kind": "rotary",
  "decimalPlaces": 1,
  "velocity": 0,
  "identChannel": "",
  "trackerThickness": 1,
  "trackerInsideRadius": .7,
  "trackerOutsideRadius": 1,
  "trackerStart": 0.1,
  "trackerEnd": 0.9,
  "trackerCentre": 0.1,
  "visible": 1,
  "automatable": 1,
  "valuePrefix": "",
  "valuePostfix": ""
}

function DefaultWidgetProps(widget) {
  switch (widget) {
      case "form":
          return { ...formProps }; // Return a shallow copy of formProps
      case "rslider":
          return { ...rotarySliderProps }; // Return a shallow copy of rotarySliderProps
      default:
          return {}; // Return an empty object for unknown widget types
  }
}

// export class Form {
//   constructor(name) {
//     this.name = name;
//     this.props = GetDefaultPropsFor("form");
//     this.props.name = name;
//   }
// }

// export class RotarySlider {
//   constructor(name) {
//     this.name = name;
//     this.props = GetDefaultPropsFor("rslider");
//     this.props.name = name;
//   }
// }


function WidgetSVG(type) {
  switch (type) {
    case 'rslider':
      return `
      <svg width="100%" height="100%" viewBox="0 0 87 99" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M65.9417 80.5413C73.837 75.7352 79.9735 68.5131 83.4416 59.9454C86.9097 51.3777 87.5248 41.9205 85.1957 32.9758C82.8666 24.031 77.7173 16.0749 70.511 10.2866C63.3048 4.49843 54.4253 1.18627 45.1887 0.841165C35.9522 0.496059 26.8503 3.13637 19.2322 8.37071C11.6142 13.6051 5.88549 21.1548 2.8954 29.9008C-0.0946829 38.6468 -0.187024 48.1235 2.63207 56.9261C5.45116 65.7287 11.0316 73.3886 18.5462 78.7704L43.5833 43.8112L65.9417 80.5413Z" fill="#060606"/>
<circle cx="44" cy="44" r="33" fill="#F3F3F3"/>
<rect x="23" y="66.8579" width="13.3991" height="5.72696" rx="1" transform="rotate(-54.1296 23 66.8579)" fill="#4F4F4F"/>
</svg>
      `;
    default:
      return "";
  }
}

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	// This entry module is referenced by other modules so it can't be inlined
/******/ 	var __webpack_exports__ = __webpack_require__(0);
/******/ 	module.exports = __webpack_exports__;
/******/ 	
/******/ })()
;
//# sourceMappingURL=extension.js.map