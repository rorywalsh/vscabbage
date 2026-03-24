// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.



import { setVSCode, setCabbageMode, setCurrentCsdPath, widgets, vscode } from "./sharedState.js";
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

// Buffer for csoundOutput messages that arrive before the widget is created
const pendingCsoundOutputMessages = [];

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

        // Discover and register custom widgets before loading other modules
        if (typeof acquireVsCodeApi === 'function') {
            try {
                const customWidgets = await discoverAndRegisterCustomWidgets(vscode);
                if (customWidgets.length > 0) {
                } else {
                }
            } catch (error) {
                console.error('Cabbage: Error during custom widget discovery:', error);
                console.error('Cabbage: Error stack:', error.stack);
            }
        } else {
        }

        // Check if running in VS Code context
        if (typeof acquireVsCodeApi === 'function') {
            try {
                // Load PropertyPanel and WidgetWrapper modules concurrently
                const [propertyPanelModule, widgetWrapperModule] = await Promise.all([
                    import("../propertyPanel.js"),
                    import("../widgetWrapper.js")
                ]);


                const { PropertyPanel } = propertyPanelModule;
                const { WidgetWrapper, initializeInteract } = widgetWrapperModule;

                // Initialize interact with the correct URI
                initializeInteract(window.interactJS);

                // Initialize widget wrappers with necessary dependencies
                widgetWrappers = new WidgetWrapper(PropertyPanel.updatePanel, selectedElements, widgets, vscode);

                // You might want to wait for the interact script to load before proceeding
                await widgetWrappers.interactPromise;


                // Send message to indicate UI is ready to receive widget data
                Cabbage.sendCustomCommand('cabbageIsReadyToLoad', vscode);
            } catch (error) {
                console.error("Cabbage: Error loading modules in main.js:", error);
                console.error("Cabbage: Error stack:", error.stack);
            }
        } else {
            // For plugin environment, send cabbageIsReadyToLoad via window.sendMessageFromUI
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

// Forward key events to the DAW host window when running as a plugin (not in VS Code).
// The sendKeyEventToHost binding is registered in LatticeClapPlugin.cpp and calls
// PostMessage(dawRootWindow, msgType, vkCode, 0) when consumeKeypresses is false.
// e.keyCode matches Win32 virtual key codes for standard keys (letters, numbers, F-keys, etc.)
if (typeof acquireVsCodeApi !== 'function') {
    const WM_KEYDOWN = 0x0100;
    const WM_KEYUP = 0x0101;
    const WM_SYSKEYDOWN = 0x0104;
    const WM_SYSKEYUP = 0x0105;

    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)
            return;
        if (e.ctrlKey || e.metaKey) return;
        if (typeof window.sendKeyEventToHost === 'function') {
            // keyCode is intentionally used here: it maps directly to Win32 virtual key codes
            // (e.g. VK_A=65, VK_SPACE=32, VK_F1=112) which PostMessage expects on the C++ side.
            window.sendKeyEventToHost(e.altKey ? WM_SYSKEYDOWN : WM_KEYDOWN, e.keyCode); // eslint-disable-line deprecation/deprecation
        }
    });

    document.addEventListener('keyup', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable)
            return;
        if (e.ctrlKey || e.metaKey) return;
        if (typeof window.sendKeyEventToHost === 'function') {
            window.sendKeyEventToHost(e.altKey ? WM_SYSKEYUP : WM_KEYUP, e.keyCode); // eslint-disable-line deprecation/deprecation
        }
    });
}

// Add key listener for save command (Ctrl+S or Cmd+S)
window.addEventListener('keydown', (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
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
 * Lightweight VU meter module.
 * Reads peak + RMS data from the CabbageApp backend and renders per-channel bars
 * with smooth rAF decay, dBFS scale markers, and a resettable max-RMS hold line.
 *
 * Scale: full bar = +3 dBFS (a little headroom above 0 dBFS).
 * Endpoint peak LED turns red when peak has exceeded 0 dBFS. Click the meter to reset.
 */
const VuMeter = {
    // dBFS headroom: full bar = +3 dBFS
    DB_MAX: 3,
    LINEAR_MAX: Math.pow(10, 3 / 20), // ≈ 1.2589

    // dBFS positions for tick marks (-40 is too small to need a label, so skip it)
    MARKER_DBS: [-20, -12, -6, -3, 0],

    initialized: false,
    numChannels: 0,
    incomingLevels: [],  // latest peak per channel received from backend
    incomingRms: [],  // latest RMS per channel received from backend
    displayedLevels: [],  // smoothed bar fill (rAF decayed)
    clipped: [],  // true if peak ever exceeded 0 dBFS since last reset
    rafId: null,
    resizeObserver: null,
    updatePositionFn: null,

    // Convert linear amplitude to bar percentage using the +DB_MAX headroom scale
    toBarPct(linear) {
        return Math.min((linear / this.LINEAR_MAX) * 100, 100);
    },

    init(numChannels) {
        const vuDiv = document.getElementById('VuMeter');
        if (!vuDiv) return;

        this.numChannels = numChannels;
        this.incomingLevels = new Array(numChannels).fill(0);
        this.incomingRms = new Array(numChannels).fill(0);
        this.displayedLevels = new Array(numChannels).fill(0);
        this.clipped = new Array(numChannels).fill(false);
        vuDiv.innerHTML = '';

        const isHorizontal = vuDiv.classList.contains('vu-top') || vuDiv.classList.contains('vu-bottom');

        // Channel bars
        for (let i = 0; i < numChannels; i++) {
            const ch = document.createElement('div');
            ch.className = 'vu-channel';

            const mask = document.createElement('div');
            mask.className = 'vu-mask';
            ch.appendChild(mask);

            const hold = document.createElement('div');
            hold.className = 'vu-hold';
            ch.appendChild(hold);

            // Reset this channel's peak LED only
            const resetChannelPeak = (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.clipped[i] = false;
                hold.classList.remove('vu-hold-clipped');
            };
            hold.style.cursor = 'pointer';
            hold.addEventListener('click', resetChannelPeak);
            ch.addEventListener('click', resetChannelPeak);

            vuDiv.appendChild(ch);
        }

        // Scale marker ticks — one shared overlay spanning the whole meter
        const markersEl = document.createElement('div');
        markersEl.className = 'vu-markers ' + (isHorizontal ? 'vu-markers-h' : 'vu-markers-v');
        for (const db of this.MARKER_DBS) {
            const pct = this.toBarPct(Math.pow(10, db / 20));
            const tick = document.createElement('div');
            tick.className = 'vu-tick' + (db === 0 ? ' vu-tick-zero' : '');
            if (isHorizontal) {
                tick.style.left = pct + '%';
            } else {
                tick.style.top = (100 - pct) + '%';
            }
            markersEl.appendChild(tick);
        }
        vuDiv.appendChild(markersEl);

        // Set up ResizeObserver to handle viewport resize events
        this._setupResizeObserver();

        this.initialized = true;
        if (!this.rafId) {
            this._loop();
        }
    },

    _setupResizeObserver() {
        // Clean up existing observer if any
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        // Remove old window resize listener if it exists
        if (this.updatePositionFn) {
            window.removeEventListener('resize', this.updatePositionFn);
        }

        const leftPanel = document.getElementById('LeftPanel');
        if (!leftPanel) return;

        // Update VU meter position based on panel height
        this.updatePositionFn = () => {
            const vuDiv = document.getElementById('VuMeter');
            if (!vuDiv) return;

            // For bottom-positioned meters, ensure they stay at the bottom by
            // explicitly setting the bottom position to 0 and triggering a reflow
            if (vuDiv.classList.contains('vu-bottom')) {
                // Force reflow by toggling a CSS property
                const currentBottom = vuDiv.style.bottom;
                vuDiv.style.bottom = '-1px';
                void vuDiv.offsetHeight; // Force reflow
                vuDiv.style.bottom = '0';
            }
            // For top-positioned meters, similar approach
            else if (vuDiv.classList.contains('vu-top')) {
                const currentTop = vuDiv.style.top;
                vuDiv.style.top = '-1px';
                void vuDiv.offsetHeight; // Force reflow
                vuDiv.style.top = '0';
            }
            // For left/right positioned meters, update their position
            else if (vuDiv.classList.contains('vu-left')) {
                const currentLeft = vuDiv.style.left;
                vuDiv.style.left = '-1px';
                void vuDiv.offsetHeight; // Force reflow
                vuDiv.style.left = '0';
            }
            else if (vuDiv.classList.contains('vu-right')) {
                const currentRight = vuDiv.style.right;
                vuDiv.style.right = '-1px';
                void vuDiv.offsetHeight; // Force reflow
                vuDiv.style.right = '0';
            }
        };

        // Use ResizeObserver to detect when the panel resizes
        // This ensures the VU meter repositions correctly when the VSCode panel is dragged
        this.resizeObserver = new ResizeObserver(this.updatePositionFn);
        this.resizeObserver.observe(leftPanel);

        // Also listen for window resize events as a fallback
        window.addEventListener('resize', this.updatePositionFn);

        // Initial position update
        this.updatePositionFn();
    },

    destroy() {
        // Clean up resize observer
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        // Remove window resize listener if it exists
        // Note: We store the function reference to enable proper cleanup
        if (this.updatePositionFn) {
            window.removeEventListener('resize', this.updatePositionFn);
            this.updatePositionFn = null;
        }
        // Cancel animation frame
        if (this.rafId) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.initialized = false;
    },

    // Called on each incoming backend message — just stash values, no DOM work
    update(levels, rms) {
        if (!Array.isArray(levels) || levels.length === 0) return;

        if (!this.initialized || levels.length !== this.numChannels) {
            this.init(levels.length);
        }
        if (!this.initialized) return;

        for (let i = 0; i < this.numChannels; i++) {
            if (levels[i] > this.incomingLevels[i])
                this.incomingLevels[i] = levels[i];
            // Clip flag: peak > 1.0 linear = over 0 dBFS
            if (levels[i] > 1.0)
                this.clipped[i] = true;
            if (rms && rms[i] !== undefined && rms[i] > this.incomingRms[i])
                this.incomingRms[i] = rms[i];
        }
    },

    _loop() {
        this.rafId = requestAnimationFrame(() => this._loop());
        if (!this.initialized) return;

        const vuDiv = document.getElementById('VuMeter');
        if (!vuDiv) return;

        const isHorizontal = vuDiv.classList.contains('vu-top') || vuDiv.classList.contains('vu-bottom');
        const channels = vuDiv.querySelectorAll('.vu-channel');
        const DECAY = 0.975; // ~40 dB/sec fall at 60 fps

        for (let i = 0; i < channels.length; i++) {
            // --- bar fill ---
            this.displayedLevels[i] = Math.max(this.incomingLevels[i], this.displayedLevels[i] * DECAY);
            this.incomingLevels[i] *= DECAY;
            const pct = this.toBarPct(this.displayedLevels[i]);

            // RMS still decays internally (reserved for potential readout use)
            this.incomingRms[i] *= DECAY;

            // Update mask
            const mask = channels[i].querySelector('.vu-mask');
            if (mask) {
                if (isHorizontal)
                    mask.style.width = (100 - pct) + '%';
                else
                    mask.style.height = (100 - pct) + '%';
            }

            // Update hold indicator
            const hold = channels[i].querySelector('.vu-hold');
            if (hold) {
                // Fixed endpoint LED: right edge for horizontal, top edge for vertical
                hold.classList.toggle('vu-hold-clipped', this.clipped[i]);
            }
        }
    }
};

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

    if (message && typeof message.currentCsdPath === 'string' && message.currentCsdPath.length > 0) {
        setCurrentCsdPath(message.currentCsdPath);
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
            // If there are buffered csoundOutput messages and the widget now exists, replay them
            if (pendingCsoundOutputMessages.length > 0) {
                const csoundOutputWidgetAfterUpdate = widgets.find(w =>
                    w?.props?.type === 'csoundOutput'
                    || CabbageUtils.getWidgetDivId(w.props) === 'csoundOutput'
                );
                if (csoundOutputWidgetAfterUpdate) {
                    const div = CabbageUtils.getWidgetDiv(csoundOutputWidgetAfterUpdate.props);
                    if (div) {
                        for (const buffered of pendingCsoundOutputMessages) {
                            csoundOutputWidgetAfterUpdate.appendText(buffered);
                        }
                        div.innerHTML = csoundOutputWidgetAfterUpdate.getInnerHTML();
                        pendingCsoundOutputMessages.length = 0;
                        // Scroll to bottom to show latest messages
                        const replayTextarea = div.querySelector('textarea');
                        if (replayTextarea) replayTextarea.scrollTop = replayTextarea.scrollHeight;
                    }
                }
            }
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

            // Hide VU meter in edit mode (it obscures widget placement)
            const vuMeterEdit = document.getElementById('VuMeter');
            if (vuMeterEdit) { vuMeterEdit.style.display = 'none'; }
            break;

        // Called when entering performance mode
        case 'onEnterPerformanceMode':
            setCabbageMode('nonDraggable'); // Set the mode to nonDraggable for performance mode
            // Update child widget pointer events for performance mode
            updateChildWidgetPointerEvents('nonDraggable');

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

            // Show VU meter in performance mode
            const vuMeterPerf = document.getElementById('VuMeter');
            if (vuMeterPerf) { vuMeterPerf.style.display = 'flex'; }
            break;

        // Called when there are new Csound console messages to display
        case 'csoundOutputUpdate':
            // Find the csoundOutput widget (id/channel is case-sensitive: "csoundOutput")
            let csoundOutput = widgets.find(widget =>
                widget?.props?.type === 'csoundOutput'
                || CabbageUtils.getWidgetDivId(widget.props) === 'csoundOutput'
            );
            if (csoundOutput) {
                // If there are buffered messages (arrived before widget was created), replay them first
                if (pendingCsoundOutputMessages.length > 0) {
                    for (const buffered of pendingCsoundOutputMessages) {
                        csoundOutput.appendText(buffered);
                    }
                    pendingCsoundOutputMessages.length = 0;
                }
                // Update the HTML content of the widget's div
                const csoundOutputDiv = CabbageUtils.getWidgetDiv(csoundOutput.props);
                if (csoundOutputDiv) {
                    csoundOutput.appendText(message.text); // Append new console message
                    csoundOutputDiv.innerHTML = csoundOutput.getInnerHTML(); // Update content
                }
            } else {
                // Widget not yet created — buffer the message for later replay
                pendingCsoundOutputMessages.push(message.text);
            }
            break;

        case 'vuMeter':
            VuMeter.update(message.levels, message.rms);
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
