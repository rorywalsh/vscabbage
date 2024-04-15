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
        const defaultProps = (0, widgets_js_1.GetDefaultPropsFor)(props.type);
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
/* harmony export */   Form: () => (/* binding */ Form),
/* harmony export */   GetDefaultPropsFor: () => (/* binding */ GetDefaultPropsFor),
/* harmony export */   RotarySlider: () => (/* binding */ RotarySlider),
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
  "channel": 'channel',
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

function GetDefaultPropsFor(widget) {
  switch (widget) {
    case "form":
      return formProps;
    case "rslider":
      return rotarySliderProps;
  }
}

class Form {
  constructor(name) {
    this.name = name;
    this.props = GetDefaultPropsFor("form");
    this.props.name = name;
  }
}

class RotarySlider {
  constructor(name) {
    this.name = name;
    this.props = GetDefaultPropsFor("rslider");
    this.props.name = name;
  }
}


function WidgetSVG(type) {
  switch (type) {
    case 'rslider':
      return `
      <svg width="100%" height="100%" viewBox="0 0 87 99" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M65.9417 80.5413C73.837 75.7352 79.9735 68.5131 83.4416 59.9454C86.9097 51.3777 87.5248 41.9205 85.1957 32.9758C82.8666 24.031 77.7173 16.0749 70.511 10.2866C63.3048 4.49843 54.4253 1.18627 45.1887 0.841165C35.9522 0.496059 26.8503 3.13637 19.2322 8.37071C11.6142 13.6051 5.88549 21.1548 2.8954 29.9008C-0.0946829 38.6468 -0.187024 48.1235 2.63207 56.9261C5.45116 65.7287 11.0316 73.3886 18.5462 78.7704L43.5833 43.8112L65.9417 80.5413Z" fill="#060606"/>
<circle cx="44" cy="44" r="33" fill="#F3F3F3"/>
<rect x="23" y="66.8579" width="13.3991" height="5.72696" rx="1" transform="rotate(-54.1296 23 66.8579)" fill="#4F4F4F"/>
<path d="M35.582 93.4766H38.418V97.6777C38.2031 97.748 37.9863 97.8105 37.7676 97.8652C37.5488 97.9199 37.3242 97.9648 37.0938 98C36.8633 98.0391 36.6211 98.0684 36.3672 98.0879C36.1133 98.1074 35.8398 98.1172 35.5469 98.1172C34.9336 98.1172 34.3906 98.0156 33.918 97.8125C33.4453 97.6055 33.0469 97.3125 32.7227 96.9336C32.3984 96.5508 32.1523 96.0879 31.9844 95.5449C31.8164 94.998 31.7324 94.3848 31.7324 93.7051C31.7324 93.0332 31.8242 92.4258 32.0078 91.8828C32.1953 91.3398 32.4668 90.8789 32.8223 90.5C33.1777 90.1172 33.6152 89.8242 34.1348 89.6211C34.6582 89.4141 35.2539 89.3105 35.9219 89.3105C36.3555 89.3105 36.7715 89.3535 37.1699 89.4395C37.5684 89.5254 37.9395 89.6504 38.2832 89.8145L37.8613 90.7637C37.7207 90.6973 37.5684 90.6348 37.4043 90.5762C37.2441 90.5176 37.0781 90.4668 36.9062 90.4238C36.7344 90.377 36.5566 90.3398 36.373 90.3125C36.1934 90.2852 36.0137 90.2715 35.834 90.2715C35.3574 90.2715 34.9355 90.3516 34.5684 90.5117C34.2012 90.668 33.8926 90.8945 33.6426 91.1914C33.3965 91.4883 33.209 91.8496 33.0801 92.2754C32.9512 92.7012 32.8867 93.1816 32.8867 93.7168C32.8867 94.2246 32.9395 94.6895 33.0449 95.1113C33.1543 95.5332 33.3262 95.8965 33.5605 96.2012C33.7949 96.5059 34.0977 96.7422 34.4688 96.9102C34.8398 97.0781 35.2871 97.1621 35.8105 97.1621C35.9824 97.1621 36.1387 97.1582 36.2793 97.1504C36.4238 97.1387 36.5566 97.125 36.6777 97.1094C36.7988 97.0938 36.9121 97.0762 37.0176 97.0566C37.127 97.0332 37.2324 97.0117 37.334 96.9922V94.4375H35.582V93.4766ZM43.9316 98L43.7148 97.1094H43.668C43.5391 97.2852 43.4102 97.4375 43.2812 97.5664C43.1523 97.6914 43.0117 97.7949 42.8594 97.877C42.707 97.959 42.5371 98.0195 42.3496 98.0586C42.1621 98.0977 41.9453 98.1172 41.6992 98.1172C41.4297 98.1172 41.1816 98.0781 40.9551 98C40.7285 97.9258 40.5312 97.8105 40.3633 97.6543C40.1992 97.4941 40.0703 97.2949 39.9766 97.0566C39.8828 96.8145 39.8359 96.5293 39.8359 96.2012C39.8359 95.5605 40.0605 95.0684 40.5098 94.7246C40.9629 94.3809 41.6504 94.1934 42.5723 94.1621L43.6504 94.1211V93.7168C43.6504 93.4551 43.6211 93.2363 43.5625 93.0605C43.5078 92.8848 43.4258 92.7441 43.3164 92.6387C43.2109 92.5293 43.0781 92.4512 42.918 92.4043C42.7617 92.3574 42.582 92.334 42.3789 92.334C42.0547 92.334 41.752 92.3809 41.4707 92.4746C41.1934 92.5684 40.9258 92.6816 40.668 92.8145L40.293 92.0117C40.582 91.8555 40.9043 91.7227 41.2598 91.6133C41.6152 91.5039 41.9883 91.4492 42.3789 91.4492C42.7773 91.4492 43.1211 91.4902 43.4102 91.5723C43.7031 91.6504 43.9434 91.7773 44.1309 91.9531C44.3223 92.125 44.4648 92.3457 44.5586 92.6152C44.6523 92.8848 44.6992 93.2109 44.6992 93.5938V98H43.9316ZM41.9746 97.2559C42.2129 97.2559 42.4336 97.2188 42.6367 97.1445C42.8398 97.0703 43.0156 96.959 43.1641 96.8105C43.3125 96.6582 43.4277 96.4688 43.5098 96.2422C43.5957 96.0117 43.6387 95.7422 43.6387 95.4336V94.8535L42.8008 94.8945C42.4492 94.9102 42.1543 94.9492 41.916 95.0117C41.6777 95.0742 41.4863 95.1621 41.3418 95.2754C41.2012 95.3848 41.0996 95.5195 41.0371 95.6797C40.9746 95.8359 40.9434 96.0137 40.9434 96.2129C40.9434 96.5723 41.0371 96.8359 41.2246 97.0039C41.416 97.1719 41.666 97.2559 41.9746 97.2559ZM47.7461 98H46.6797V91.5664H47.7461V98ZM46.5977 89.8262C46.5977 89.5918 46.6562 89.4219 46.7734 89.3164C46.8945 89.2109 47.043 89.1582 47.2188 89.1582C47.3047 89.1582 47.3848 89.1719 47.459 89.1992C47.5371 89.2227 47.6035 89.2617 47.6582 89.3164C47.7168 89.3711 47.7617 89.4414 47.793 89.5273C47.8281 89.6094 47.8457 89.709 47.8457 89.8262C47.8457 90.0527 47.7832 90.2227 47.6582 90.3359C47.5371 90.4453 47.3906 90.5 47.2188 90.5C47.043 90.5 46.8945 90.4453 46.7734 90.3359C46.6562 90.2266 46.5977 90.0566 46.5977 89.8262ZM53.8047 98V93.8574C53.8047 93.3496 53.7012 92.9688 53.4941 92.7148C53.291 92.4609 52.9707 92.334 52.5332 92.334C52.2168 92.334 51.9512 92.3848 51.7363 92.4863C51.5215 92.5879 51.3477 92.7383 51.2148 92.9375C51.0859 93.1367 50.9922 93.3809 50.9336 93.6699C50.8789 93.959 50.8516 94.291 50.8516 94.666V98H49.7852V91.5664H50.6523L50.8047 92.4336H50.8633C50.9609 92.2656 51.0762 92.1211 51.209 92C51.3457 91.875 51.4941 91.7715 51.6543 91.6895C51.8145 91.6074 51.9844 91.5469 52.1641 91.5078C52.3438 91.4688 52.5273 91.4492 52.7148 91.4492C53.4297 91.4492 53.9668 91.6367 54.3262 92.0117C54.6895 92.3828 54.8711 92.9785 54.8711 93.7988V98H53.8047Z" fill="black"/>
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