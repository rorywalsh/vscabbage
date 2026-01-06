// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

console.log('Cabbage: main.js START - top of file');


import { setVSCode, setCabbageMode, widgets, vscode } from "./sharedState.js";
// import { initialiseDefaultProps } from "./widgetTypes.js";
import { CabbageUtils } from "../cabbage/utils.js";
import { Cabbage } from "../cabbage/cabbage.js";
import { WidgetManager } from "../cabbage/widgetManager.js";
import { selectedElements } from "../cabbage/eventHandlers.js";
import { discoverAndRegisterCustomWidgets } from "./widgetDiscovery.js";
import { initializeZoom } from "./zoom.js";
import { keyboardMidiInput } from "./keyboardMidiInput.js";


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

// Initialize zoom and pan functionality
initializeZoom();

// Initialize keyboard MIDI input for performance testing
keyboardMidiInput.init();

// Notify the plugin that Cabbage is ready to load
CabbageUtils.showOverlay();

// Wrap async initialization in an IIFE with comprehensive error handling
(async () => {
    try {
        console.log('Cabbage: Starting async initialization in main.js');

        // Discover and register custom widgets before loading other modules
        if (typeof acquireVsCodeApi === 'function') {
            console.log('Cabbage: Discovering custom widgets...');
            try {
                const customWidgets = await discoverAndRegisterCustomWidgets(vscode);
                if (customWidgets.length > 0) {
                    console.log(`Cabbage: Registered ${customWidgets.length} custom widgets:`, customWidgets);
                }
            } catch (error) {
                console.error('Cabbage: Error during custom widget discovery:', error);
                console.error('Cabbage: Error stack:', error.stack);
            }
        }

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

                console.log('Cabbage: Initialization complete');

                // Send message to indicate UI is ready to receive widget data
                Cabbage.sendCustomCommand('cabbageIsReadyToLoad', vscode);
            } catch (error) {
                console.error("Cabbage: Error loading modules in main.js:", error);
                console.error("Cabbage: Error stack:", error.stack);
            }
        } else {
            console.log("Cabbage: Running outside of VSCode environment");
            // For plugin environment, send cabbageIsReadyToLoad via window.sendMessageFromUI
            console.log("Cabbage: Sending cabbageIsReadyToLoad to plugin backend");
            if (typeof window.sendMessageFromUI === 'function') {
                window.sendMessageFromUI({ command: 'cabbageIsReadyToLoad' });
            } else {
                console.error('Cabbage: window.sendMessageFromUI is not available');
            }
        }
    } catch (error) {
        console.error('Cabbage: Fatal error in main.js async IIFE:', error);
        console.error('Cabbage: Fatal error stack:', error.stack);
    }
})().catch(error => {
    console.error('Cabbage: Unhandled promise rejection in main.js:', error);
    console.error('Cabbage: Rejection stack:', error.stack);
});

// Add key listener for save command (Ctrl+S or Cmd+S)
window.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        console.log('Cabbage: Save shortcut triggered from webview');
        // Send save command to VS Code extension
        if (vscode) {
            vscode.postMessage({
                command: 'saveFromUIEditor',
                lastSavedFileName: '' // Extension will determine the file
            });
        }
    }
});

/**
 * Called from the plugin / vscode extension on startup, and when a user saves/updates or changes a .csd file.
 * This function is also called whenever a widget is updated through Csound, or the host DAW.
 * @param {Event} event - The event containing message data from the webview panel.
 */
window.addEventListener('message', async (event) => {
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

    // Log all incoming messages to help debug
    if (message.command === 'batchWidgetUpdate') {
        console.log(`[main.js] Received ${message.command} with ${message.widgets ? message.widgets.length : 0} widgets`);
    }

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
            // console.log("Cabbage - case 'widgetUpdate':", message);
            CabbageUtils.hideOverlay(); // Hide the overlay before updating
            const updateMsg = message;
            // Parse widgetJson to extract id if not present
            if (!updateMsg.id && updateMsg.widgetJson) {
                try {
                    const parsedData = JSON.parse(updateMsg.widgetJson);
                    updateMsg.id = parsedData.id || (parsedData.channels && parsedData.channels.length > 0 && parsedData.channels[0].id);

                    // Log genTable updates with samples info
                    if (parsedData.type === 'genTable') {
                        console.log(`Webview: widgetUpdate for genTable ${updateMsg.id}, hasSamples=${parsedData.hasOwnProperty('samples')}, samplesLength=${parsedData.samples?.length || 0}`);
                        if (parsedData.samples && parsedData.samples.length > 0) {
                            console.log(`Webview: ✓ genTable ${updateMsg.id} received ${parsedData.samples.length} samples`);
                        } else {
                            console.log(`Webview: ✗ genTable ${updateMsg.id} has NO samples data`);
                        }
                    }
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

        // Batch widget update for efficient preset loading
        case 'batchWidgetUpdate':
            console.log(`main.js batchWidgetUpdate: processing ${message.widgets.length} widgets`);
            console.log(`main.js batchWidgetUpdate: first widget:`, message.widgets[0]);
            CabbageUtils.hideOverlay();

            // Process all widgets in the batch
            for (const widgetData of message.widgets) {
                console.log(`main.js batchWidgetUpdate: updating widget id=${widgetData.id}, hasWidgetJson=${!!widgetData.widgetJson}, widgetJsonType=${typeof widgetData.widgetJson}`);
                const updateMsg = {
                    id: widgetData.id,
                    widgetJson: widgetData.widgetJson
                };
                await WidgetManager.updateWidget(updateMsg);
            }
            console.log(`main.js batchWidgetUpdate: completed updating ${message.widgets.length} widgets`);
            break;

        // Called when the host triggers a parameter change in the UI
        case 'parameterChange':
            // The CLAP plugin wraps paramIdx and value in a 'data' object
            // Unwrap it if present, otherwise use message directly
            const parameterMessage = message.data || message;
            console.log(`main.js parameterChange: paramIdx=${parameterMessage.paramIdx}, value=${parameterMessage.value}`);
            // {command: "parameterChange", paramIdx: 0, value: 35}

            // Find the widget and channel that matches this paramIdx
            for (const widget of widgets) {
                const channels = CabbageUtils.getChannels(widget.props);
                for (let i = 0; i < channels.length; i++) {
                    const channel = channels[i];
                    // Skip channels without parameterIndex (non-automatable widgets)
                    if (channel.parameterIndex === undefined) {
                        continue;
                    }
                    if (channel.parameterIndex === parameterMessage.paramIdx) {
                        const updateMsg = {
                            id: channel.id,
                            channel: channel.id,
                            value: parameterMessage.value
                        };
                        await WidgetManager.updateWidget(updateMsg);
                        break; // Found the matching channel, no need to continue
                    }
                }
            }
            break;

        // Called when a user saves a file. Clears the widget array and the MainForm element.
        case 'onFileChanged':
            console.error('Cabbage: ERROR - onFileChanged should not be called in plugin interface!');
            setCabbageMode('nonDraggable'); // Set the mode to non-draggable

            // Clear pending widgets map to prevent race conditions during rebuild
            if (WidgetManager.pendingWidgets) {
                console.log(`Cabbage: Clearing ${WidgetManager.pendingWidgets.size} pending widgets`);
                WidgetManager.pendingWidgets.clear();
            }

            // Clear the widgets array BEFORE removing MainForm
            // This prevents updateWidget from finding widgets in the array during rebuild
            widgets.length = 0;

            // Remove the MainForm element (this automatically removes all child widgets)
            if (mainForm) {
                mainForm.remove();
            } else {
                console.error("MainForm not found");
            }

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
            console.error('Cabbage: ERROR - onEnterEditMode should never be called in plugin interface!');
            CabbageUtils.hideOverlay(); // Hide the overlay
            setCabbageMode('draggable'); // Set the mode to draggable

            // Clear any existing selection
            selectedElements.forEach(element => element.classList.remove('selected'));
            selectedElements.clear();

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

            // Clear pending widgets map to prevent race conditions during rebuild
            if (WidgetManager.pendingWidgets) {
                console.log(`Cabbage: Clearing ${WidgetManager.pendingWidgets.size} pending widgets before edit mode`);
                WidgetManager.pendingWidgets.clear();
            }

            // Clear the widgets array BEFORE removing MainForm
            widgets.length = 0;

            // Remove the MainForm element (this automatically removes all child widgets)
            if (mainForm) {
                mainForm.remove();
            } else {
                console.error("MainForm not found");
            }

            // Update each widget after clearing the form
            widgetUpdatesMessages.forEach(msg => WidgetManager.updateWidget(msg));

            // Update child widget pointer events for draggable mode
            updateChildWidgetPointerEvents('draggable');

            // Ensure property panel is visible in draggable mode
            const propPanel = document.querySelector('.property-panel');
            if (propPanel) {
                propPanel.style.display = 'block';
            }

            const rPanel = document.getElementById('RightPanel');
            if (rPanel) {
                rPanel.style.display = 'block';
            }
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
                propertyPanel.style.display = 'none';
            }

            const rightPanel = document.getElementById('RightPanel');
            if (rightPanel) {
                console.log('RightPanel: hiding panel due to performance mode');
                rightPanel.style.display = 'none';
            }
            break;

        // Called when there are new Csound console messages to display
        case 'csoundOutputUpdate':
            // Find the csoundOutput widget by its channel
            let csoundOutput = widgets.find(widget => CabbageUtils.getWidgetDivId(widget.props) === 'csoundoutput');
            if (csoundOutput) {
                // Update the HTML content of the widget's div
                const csoundOutputDiv = CabbageUtils.getWidgetDiv(csoundOutput.props);
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
