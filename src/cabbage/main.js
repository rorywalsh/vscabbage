import { PropertyPanel } from "../propertyPanel.js";
import { CabbageUtils } from "../cabbage/utils.js";
import { Cabbage } from "../cabbage/cabbage.js";
import { WidgetManager } from "../cabbage/widgetManager.js";
import { selectedElements } from "../cabbage/eventHandlers.js";

export let vscode = null;
export const widgets = [];
export let cabbageMode = 'nonDraggable';
let widgetWrappers = null;
const leftPanel = document.getElementById('LeftPanel');
const rightPanel = document.getElementById('RightPanel');

// Set initial class and visibility for left and right panels
if (leftPanel) { leftPanel.className = "full-height-div nonDraggable"; }
if (rightPanel) { rightPanel.style.visibility = "hidden"; }

// Notify the plugin that Cabbage is ready to load
Cabbage.sendCustomCommand(vscode, 'cabbageIsReadyToLoad');
CabbageUtils.showOverlay();

// Check if running in VS Code context
if (typeof acquireVsCodeApi === 'function') {
    vscode = acquireVsCodeApi();
    try {
        // Dynamically load the widgetWrapper module
        const module = await import("../widgetWrapper.js");
        const { WidgetWrapper } = module;

        // Initialize widget wrappers with necessary dependencies
        widgetWrappers = new WidgetWrapper(PropertyPanel.updatePanel, selectedElements, widgets, vscode);
    } catch (error) {
        console.error("Error loading widgetWrapper.js:", error);
    }
}

/**
 * Called from the webview panel on startup, and when a user saves/updates or changes a .csd file.
 * 
 * @param {Event} event - The event containing message data from the webview panel.
 */
window.addEventListener('message', async event => {
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

        // Called when a user saves a file. Clears the widget array and the MainForm element.
        case 'onFileChanged':
            cabbageMode = 'nonDraggable'; // Set the mode to non-draggable
            if (mainForm) {
                mainForm.remove(); // Remove the MainForm element from the DOM
            } else {
                console.error("MainForm not found");
            }
            widgets.length = 0; // Clear the widgets array
            break;

        // Called when entering edit mode. Converts existing widgets to draggable mode.
        case 'onEnterEditMode':
            CabbageUtils.hideOverlay(); // Hide the overlay
            cabbageMode = 'draggable'; // Set the mode to draggable

            const widgetUpdatesMessages = [];
            widgets.forEach(widget => {
                // Prepare widget update messages for each widget
                widgetUpdatesMessages.push({
                    command: "widgetUpdate",
                    channel: widget.props.channel,
                    data: JSON.stringify(widget.props)
                });
            });

            // Remove the MainForm element and clear the widget array
            if (mainForm) {
                mainForm.remove();
            } else {
                console.error("MainForm not found");
            }
            widgets.length = 0;

            // Update each widget after clearing the form
            widgetUpdatesMessages.forEach(msg => WidgetManager.updateWidget(msg));
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

        default:
            return; // If the command is not recognized, do nothing
    }
});
