// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import { setVSCode, setCabbageMode, widgets, vscode } from "./sharedState.js";
import { CabbageUtils } from "../cabbage/utils.js";
import { Cabbage } from "../cabbage/cabbage.js";
import { WidgetManager } from "../cabbage/widgetManager.js";
import { selectedElements } from "../cabbage/eventHandlers.js";


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
 * This function is also called whenever a widget is updated through Csound, or the host DAW.
 * @param {Event} event - The event containing message data from the webview panel.
 */
window.addEventListener('message', async event => {
    let message = event.data; // Extract the message data from the event

    // Handle both object messages (VSCode extension) and string messages (plugin)
    if (typeof message === 'string') {
        try {
            message = JSON.parse(message);
        } catch (e) {
            console.error('Cabbage: Failed to parse message string:', message);
            return;
        }
    }

    console.log('Cabbage: main.js: received message:', message.command, message);
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
            console.log("Cabbage - case 'widgetUpdate':", message);
            CabbageUtils.hideOverlay(); // Hide the overlay before updating
            const updateMsg = message;
            // Parse widgetJson to extract id if not present
            if (!updateMsg.id && updateMsg.widgetJson) {
                try {
                    const parsedData = JSON.parse(updateMsg.widgetJson);
                    updateMsg.id = parsedData.id || (parsedData.channels && parsedData.channels.length > 0 && parsedData.channels[0].id);
                } catch (e) {
                    console.error("Failed to parse widgetJson for id:", e);
                }
            }
            const channelId = typeof updateMsg.channel === 'object' && updateMsg.channel !== null
                ? (updateMsg.channel.id || updateMsg.channel.x)
                : updateMsg.channel;
            // console.log(`main.js widgetUpdate: channel=${channelId}, hasWidgetJson=${updateMsg.hasOwnProperty('widgetJson')}, hasValue=${updateMsg.hasOwnProperty('value')}`);
            await WidgetManager.updateWidget(updateMsg); // Update the widget with the new data
            break;

        // Called when the host triggers a parameter change in the UI
        case 'parameterChange':
            const parameterMessage = message;
            console.log(`main.js parameterChange: paramIdx=${parameterMessage.paramIdx}, value=${parameterMessage.value}`);
            // {command: "parameterChange", paramIdx: 0, value: 35}
            for (const widget of widgets) {
                if (widget.parameterIndex == parameterMessage.paramIdx) {
                    console.log(`main.js parameterChange: updating widget ${CabbageUtils.getChannelId(widget.props, 0)} (${widget.props.type}) with value ${parameterMessage.value}`);
                    const updateMsg = {
                        id: CabbageUtils.getChannelId(widget.props, 0),
                        channel: CabbageUtils.getChannelId(widget.props, 0),
                        value: parameterMessage.value
                    };
                    await WidgetManager.updateWidget(updateMsg);
                }
            }
            break;

        // Called when a user saves a file. Clears the widget array and the MainForm element.
        case 'onFileChanged':
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

        // Called when a file is selected from the file dialog
        case 'fileOpenFromVSCode':
            const fileData = JSON.parse(message.text);
            const fileButtonWidget = widgets.find(w => CabbageUtils.getChannelId(w.props, 0) === fileData.channel);
            if (fileButtonWidget) {
                // Toggle the button value for visual feedback
                fileButtonWidget.props.value = fileButtonWidget.props.value === 1 ? 0 : 1;
                // Update the button's visual state
                CabbageUtils.updateInnerHTML(fileData.channel, fileButtonWidget);
                // Send the filename string to Csound via the channel
                Cabbage.sendChannelData(fileData.channel, fileData.fileName, vscode);
                console.log(`Cabbage: FileButton ${fileData.channel} selected file: ${fileData.fileName}`);
            }
            break;

        // Called when entering edit mode. Converts existing widgets to draggable mode.
        case 'onEnterEditMode':
            CabbageUtils.hideOverlay(); // Hide the overlay
            setCabbageMode('draggable'); // Set the mode to draggable

            const widgetUpdatesMessages = [];
            widgets.forEach(widget => {
                // Save current state of widgets (sanitized)
                const sanitized = CabbageUtils.sanitizeForEditor(widget);
                widgetUpdatesMessages.push({
                    command: "widgetUpdate",
                    id: sanitized.id || CabbageUtils.getChannelId(widget.props, 0),
                    channel: CabbageUtils.getChannelId(widget.props, 0),
                    widgetJson: JSON.stringify(sanitized)
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

        // Called when entering performance mode
        case 'onEnterPerformanceMode':
            console.log('Cabbage: Received onEnterPerformanceMode message, setting mode to nonDraggable');
            setCabbageMode('nonDraggable'); // Set the mode to nonDraggable for performance mode
            // Update child widget pointer events for performance mode
            updateChildWidgetPointerEvents('nonDraggable');
            console.log('Cabbage: Mode set to nonDraggable, mouse tracking should be active');

            // Hide the property panel when entering performance mode
            const propertyPanel = document.querySelector('.property-panel');
            if (propertyPanel) {
                console.log('PropertyPanel: hiding panel due to performance mode');
                propertyPanel.style.visibility = 'hidden';
            }
            break;

        // Called when there are new Csound console messages to display
        case 'csoundOutputUpdate':
            // Find the csoundOutput widget by its channel
            let csoundOutput = widgets.find(widget => CabbageUtils.getChannelId(widget.props, 0) === 'csoundoutput');
            if (csoundOutput) {
                // Update the HTML content of the widget's div
                const csoundOutputDiv = CabbageUtils.getWidgetDiv(CabbageUtils.getChannelId(csoundOutput.props, 0));
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
 * @param {string} mode - The current mode ('draggable', 'nonDraggable', or 'play')
 */
function updateChildWidgetPointerEvents(mode) {

    // Find all child widgets (those with data-parent-channel attribute)
    const childWidgets = document.querySelectorAll('[data-parent-channel]');

    childWidgets.forEach(childDiv => {
        if (mode === 'draggable') {
            childDiv.style.pointerEvents = 'none'; // Disable pointer events in draggable mode
        } else {
            childDiv.style.pointerEvents = 'auto'; // Enable pointer events in performance and nonDraggable modes
        }
    });
}
