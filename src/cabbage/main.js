// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import { setVSCode, setCabbageMode, widgets, vscode } from "./sharedState.js";
import { CabbageUtils } from "../cabbage/utils.js";
import { Cabbage } from "../cabbage/cabbage.js";
import { WidgetManager } from "../cabbage/widgetManager.js";
import { selectedElements } from "../cabbage/eventHandlers.js";


// removing these methods as I don't want to hardcode shortcuts - best to use VS Code to 
// handle this.
// document.addEventListener('keydown', function (event) {
//     if (typeof acquireVsCodeApi === 'function') {
//         if ((event.ctrlKey || event.metaKey) && event.key === 's') {
//             event.preventDefault(); // Prevent the default save behavior
//             saveFromUIEditor();
//         }
//     }
// });

// function saveFromUIEditor() {
//     if (typeof acquireVsCodeApi === 'function') {
//         vscode.postMessage({
//             command: 'saveFromUIEditor',
//             lastSavedFileName: currentFileName // You'll need to keep track of this
//         });
//     }
// }

// Update the vscode assignment
if (typeof acquireVsCodeApi === 'function') {
    setVSCode(acquireVsCodeApi());
}

// Update cabbageMode assignment
setCabbageMode('nonDraggable');

let widgetWrappers = null;

const leftPanel = document.getElementById('LeftPanel');
const rightPanel = document.getElementById('RightPanel');

// Set initial class and visibility for left and right panels
if (leftPanel) { leftPanel.className = "full-height-div nonDraggable"; }
if (rightPanel) { rightPanel.style.visibility = "hidden"; }

// Notify the plugin that Cabbage is ready to load
CabbageUtils.showOverlay();

// Check if running in VS Code context
if (typeof acquireVsCodeApi === 'function') {
    try {
        console.log("Cabbage: Loading modules in main.js");
        // Load PropertyPanel and WidgetWrapper modules concurrently
        const [propertyPanelModule, widgetWrapperModule] = await Promise.all([
            import("../propertyPanel.js"),
            import("../widgetWrapper.js")
        ]);

        console.log("Cabbage: Modules loaded in main.js:", { propertyPanelModule, widgetWrapperModule });

        const { PropertyPanel } = propertyPanelModule;
        const { WidgetWrapper, initializeInteract } = widgetWrapperModule;

        // Initialize interact with the correct URI
        initializeInteract(window.interactJS);

        // Initialize widget wrappers with necessary dependencies
        widgetWrappers = new WidgetWrapper(PropertyPanel.updatePanel, selectedElements, widgets, vscode);

        // You might want to wait for the interact script to load before proceeding
        await widgetWrappers.interactPromise;
    } catch (error) {
        console.error("Error loading modules in main.js:", error);
    }
} else {
    console.log("Cabbage: Running outside of VSCode environment");
}

//send message to Cabbage to indicate that the UI is ready to load
Cabbage.sendCustomCommand('cabbageIsReadyToLoad', vscode);

/**
 * Called from the plugin / vscode extension on startup, and when a user saves/updates or changes a .csd file.
 * This function is also called whenever a widget is updated through Csound
 * @param {Event} event - The event containing message data from the webview panel.
 */
window.addEventListener('message', async event => {
    console.log("Cabbage: onMsessage", event.data);
    const message = event.data; // Extract the message data from the event
    const mainForm = document.getElementById('MainForm'); // Get the MainForm element

    // Handle different commands based on the message received
    switch (message.command) {

        // When users change the snapToSize settings
        case 'snapToSize':
            widgetWrappers.setSnapSize(parseInt(message.text)); // Update snap size
            break;

        // Called by the host (Cabbage plugin or VS-Code) to update each widget
        // This happens on startup and each time a widget is updated
        case 'widgetUpdate':
            CabbageUtils.hideOverlay(); // Hide the overlay before updating
            const updateMsg = message;
            WidgetManager.updateWidget(updateMsg); // Update the widget with the new data
            break;

        // Called when the host triggers a parameter change in the UI
        case 'parameterChange':
            const parameterMessage = message;
            // {command: "parameterChange", data: {paramIdx: 0, value: 0.32499998807907104}}
            widgets.forEach(widget => {
                if (widget.parameterIndex == parameterMessage.data.paramIdx) {
                    const updateMsg = {
                        channel: widget.props.channel,
                        value: parameterMessage.data.value
                    };
                    WidgetManager.updateWidget(updateMsg);
                }
            });
            break;
            
        // Called when a user saves a file. Clears the widget array and the MainForm element.
        case 'onFileChanged':
            console.log("Cabbage: onFileChanged", message);
            setCabbageMode('nonDraggable'); // Set the mode to non-draggable
            if (mainForm) {
                mainForm.remove(); // Remove the MainForm element from the DOM
            } else {
                console.error("MainForm not found");
            }
            widgets.length = 0; // Clear the widgets array
            // currentFileName = message.lastSavedFileName; // Update the current file name

            // Update child widget pointer events for performance mode
            updateChildWidgetPointerEvents('nonDraggable');
            break;

        // Called when entering edit mode. Converts existing widgets to draggable mode.
        case 'onEnterEditMode':
            CabbageUtils.hideOverlay(); // Hide the overlay
            setCabbageMode('draggable'); // Set the mode to draggable

            const widgetUpdatesMessages = [];
            widgets.forEach(widget => {
                // Save current state of widgets (sanitized)
                widgetUpdatesMessages.push({
                    command: "widgetUpdate",
                    channel: widget.props.channel,
                    data: JSON.stringify(CabbageUtils.sanitizeForEditor(widget))
                });
            });

            // Remove the MainForm element and clear the widget array
            if (mainForm) {
                mainForm.remove();
            } else {
                console.error("MainForm not found");
            }

            //now clear all widgets
            widgets.length = 0;

            // Update each widget after clearing the form
            widgetUpdatesMessages.forEach(msg => WidgetManager.updateWidget(msg));

            // Update child widget pointer events for draggable mode
            updateChildWidgetPointerEvents('draggable');
            break;

        // Called when there are new Csound console messages to display
        case 'csoundOutputUpdate':
            // Find the csoundOutput widget by its channel
            let csoundOutput = widgets.find(widget => widget.props.channel === 'csoundoutput');
            if (csoundOutput) {
                // Update the HTML content of the widget's div
                const csoundOutputDiv = CabbageUtils.getWidgetDiv(csoundOutput.props.channel);
                if (csoundOutputDiv) {
                    csoundOutputDiv.innerHTML = csoundOutput.getInnerHTML(); // Update content
                    csoundOutput.appendText(message.text); // Append new console message
                }
            }
            break;

        case 'saveFromUIEditor':
            Cabbage.sendCustomCommand('saveFromUIEditor', vscode, { lastSavedFileName: message.lastSavedFileName });
            break;

        default:
            return; // If the command is not recognized, do nothing
    }
});

/**
 * Updates pointer events for child widgets based on the current mode
 * @param {string} mode - The current mode ('draggable' or 'nonDraggable')
 */
function updateChildWidgetPointerEvents(mode) {
    console.log("Cabbage: Updating child widget pointer events for mode:", mode);

    // Find all child widgets (those with data-parent-channel attribute)
    const childWidgets = document.querySelectorAll('[data-parent-channel]');

    childWidgets.forEach(childDiv => {
        if (mode === 'draggable') {
            childDiv.style.pointerEvents = 'none'; // Disable pointer events in draggable mode
        } else {
            childDiv.style.pointerEvents = 'auto'; // Enable pointer events in performance mode
        }
    });
}
