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

                // Register the custom-widget listener BEFORE sending cabbageIsReadyToLoad.
                // The extension pushes customWidgetInfo immediately when it receives
                // cabbageIsReadyToLoad, so the listener must exist first.
                discoverAndRegisterCustomWidgets(
                    vscode,
                    () => WidgetManager.refreshWidgetMenu()
                );

                // Tell the backend the UI is ready — this also triggers the extension
                // to push customWidgetInfo back to the webview.
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
 * Peak + RMS VU meter module.
 * Reads per-channel peak + RMS data from the CabbageApp backend (~20 Hz idle
 * ticks: peak = interval max, RMS = latest block) and renders segmented LED
 * ladders with studio-style ballistics ported from the vuMeter.html prototype:
 * fast attack / slow release smoothing, 1.2 s peak-hold markers, a moving RMS
 * indicator line, and a latching 0 dBFS clip LED with overs count.
 *
 * Scale: -60..0 dBFS (full ladder = 0 dBFS). Click a channel to reset clip/hold.
 * Text readouts (peak / RMS / overs) are optional via `cabbage.vuMeterShowReadouts`.
 */
const VuMeter = {
    DB_MIN: -60,   // bottom of scale
    DB_FLOOR: -70, // anything at/below this renders as -inf

    // dBFS positions for tick marks (matches vuMeter.html prototype scale)
    MARKER_DBS: [0, -3, -6, -12, -18, -30, -40, -60],

    // Ballistics (seconds / ms, from prototype)
    ATK: 0.006,        // attack time constant
    REL: 0.42,         // release time constant (slow PPM-style fall)
    RMS_TC: 0.25,      // RMS smoothing time constant
    HOLD_MS: 1200,     // peak-hold dwell before decay
    HOLD_FALL_DBPS: 8, // peak-hold decay rate (dB/sec)

    SEG_COUNT: 32, // LED segments per channel (matches prototype)

    initialized: false,
    numChannels: 0,
    showReadouts: false,
    targetPeakDb: [],  // latest peak target per channel (dB, last message wins)
    targetRmsDb: [],   // latest RMS target per channel (dB, last message wins)
    smPeakDb: [],      // smoothed peak bar value per channel (dB)
    smRmsDb: [],       // smoothed RMS indicator value per channel (dB)
    heldPeakDb: [],    // peak-hold marker per channel (dB)
    heldAt: [],        // timestamp (ms) when hold was last set per channel
    segEls: [],        // per-channel arrays of .vu-seg elements
    litCount: [],      // cached lit-segment counts (avoid redundant DOM writes)
    holdKeys: [],      // cached hold-marker keys (index + clip state)
    clipped: [],       // true if peak ever exceeded 0 dBFS since last reset
    overs: 0,          // total over-0dBFS intervals since last reset
    readoutEls: null,  // { root, peak, rms, overs } text readout elements
    lastTextUpdate: 0,
    lastFrameT: 0,
    rafId: null,
    resizeObserver: null,
    updatePositionFn: null,

    // Linear amplitude (0..1+) to dBFS. Floored at DB_FLOOR so smoothing
    // math never sees -Infinity (which would poison frames with NaN).
    linToDb(linear) {
        if (!(linear > 0)) return this.DB_FLOOR;
        return Math.max(this.DB_FLOOR, 20 * Math.log10(linear));
    },

    // Segment heat color, bottom (green) -> top (red). From the prototype.
    heat(t) {
        if (t < 0.55) {
            const k = t / 0.55;
            return 'oklch(' + (68 - k * 2).toFixed(1) + '% ' + (0.17 - k * 0.02).toFixed(3) + ' ' + (150 - k * 60).toFixed(0) + ')';
        }
        const k2 = (t - 0.55) / 0.45;
        return 'oklch(' + (66 + k2 * 2).toFixed(1) + '% ' + (0.15 + k2 * 0.07).toFixed(3) + ' ' + (90 - k2 * 65).toFixed(0) + ')';
    },

    // dBFS (-60..0) to bar percentage (used for the RMS overlay line)
    dbToPct(db) {
        if (!isFinite(db)) return 0;
        return Math.min(Math.max((db - this.DB_MIN) / (0 - this.DB_MIN), 0), 1) * 100;
    },

    // Format a dB value for readouts: -inf floor renders as -infinity glyph
    fmt(v) {
        if (!isFinite(v) || v <= this.DB_FLOOR + 0.5) return '−∞';
        return (v > 0 ? '+' : '') + v.toFixed(1);
    },

    init(numChannels) {
        const vuDiv = document.getElementById('VuMeter');
        if (!vuDiv) return;

        // Pick up the server-rendered readout preference (extension setting)
        if (vuDiv.dataset && typeof vuDiv.dataset.readouts === 'string') {
            this.showReadouts = vuDiv.dataset.readouts === 'on';
        }

        this.numChannels = numChannels;
        this.targetPeakDb = new Array(numChannels).fill(this.DB_FLOOR);
        this.targetRmsDb = new Array(numChannels).fill(this.DB_FLOOR);
        this.smPeakDb = new Array(numChannels).fill(this.DB_FLOOR);
        this.smRmsDb = new Array(numChannels).fill(this.DB_FLOOR);
        this.heldPeakDb = new Array(numChannels).fill(this.DB_FLOOR);
        this.heldAt = new Array(numChannels).fill(0);
        this.segEls = [];
        this.litCount = new Array(numChannels).fill(-1);
        this.holdKeys = new Array(numChannels).fill(-2);
        this.clipped = new Array(numChannels).fill(false);
        this.overs = 0;
        this.readoutEls = null;
        this.lastTextUpdate = 0;
        this.lastFrameT = 0;
        vuDiv.innerHTML = '';

        const isHorizontal = vuDiv.classList.contains('vu-top') || vuDiv.classList.contains('vu-bottom');

        // Channel bars: segmented LED ladders (prototype style).
        // DOM order is always low -> high; CSS flips vertical stacks bottom-up.
        for (let i = 0; i < numChannels; i++) {
            const ch = document.createElement('div');
            ch.className = 'vu-channel';

            const segs = [];
            for (let s = 0; s < this.SEG_COUNT; s++) {
                const seg = document.createElement('div');
                seg.className = 'vu-seg';
                seg.dataset.heat = this.heat(s / (this.SEG_COUNT - 1));
                ch.appendChild(seg);
                segs.push(seg);
            }
            this.segEls.push(segs);

            const rms = document.createElement('div');
            rms.className = 'vu-rms';
            ch.appendChild(rms);

            // Click a channel to reset its clip LED + hold marker
            const resetChannelPeak = (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.resetChannel(i);
            };
            ch.style.cursor = 'pointer';
            ch.addEventListener('click', resetChannelPeak);

            vuDiv.appendChild(ch);
        }

        // Scale marker ticks — one shared overlay spanning the whole meter
        const markersEl = document.createElement('div');
        markersEl.className = 'vu-markers ' + (isHorizontal ? 'vu-markers-h' : 'vu-markers-v');
        for (const db of this.MARKER_DBS) {
            const pct = this.dbToPct(db);
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

        // Optional text readout strip (peak / RMS / overs + clip state)
        const readouts = document.createElement('div');
        readouts.className = 'vu-readouts';
        readouts.innerHTML = '<span class="vu-ro vu-ro-peak"><span class="vu-ro-k">PK </span><span class="vu-ro-v">−∞</span></span>' +
            '<span class="vu-ro vu-ro-rms"><span class="vu-ro-k">RMS </span><span class="vu-ro-v">−∞</span></span>' +
            '<span class="vu-ro vu-ro-over"><span class="vu-ro-k">OVER </span><span class="vu-ro-v">0</span></span>';
        vuDiv.appendChild(readouts);
        this.readoutEls = {
            root: readouts,
            peak: readouts.querySelector('.vu-ro-peak .vu-ro-v'),
            rms: readouts.querySelector('.vu-ro-rms .vu-ro-v'),
            overs: readouts.querySelector('.vu-ro-over .vu-ro-v'),
        };

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
        this.lastFrameT = 0;
        this.readoutEls = null;
        this.segEls = [];
        this.initialized = false;
    },

    // Called on each incoming backend message — just stash targets, no DOM work.
    // Backend sends linear amplitudes: levels[] = per-interval peak max,
    // rms[] = latest block RMS. Last message wins; the backend resets its peak
    // accumulator every tick, so silence naturally drives targets back down and
    // the release ballistics in _loop produce the fall.
    update(levels, rms) {
        if (!Array.isArray(levels) || levels.length === 0) return;

        if (!this.initialized || levels.length !== this.numChannels) {
            this.init(levels.length);
        }
        if (!this.initialized) return;

        for (let i = 0; i < this.numChannels; i++) {
            this.targetPeakDb[i] = this.linToDb(levels[i]);
            // Clip flag: peak > 1.0 linear = over 0 dBFS; count one over per message
            if (levels[i] > 1.0) {
                this.clipped[i] = true;
                this.overs++;
            }
            if (rms && rms[i] !== undefined && rms[i] !== null) {
                this.targetRmsDb[i] = this.linToDb(rms[i]);
            }
        }
    },

    // Toggle text readouts at runtime (from the cabbage.vuMeterShowReadouts setting)
    setShowReadouts(show) {
        this.showReadouts = !!show;
        const vuDiv = document.getElementById('VuMeter');
        if (vuDiv) {
            vuDiv.classList.toggle('vu-no-readouts', !this.showReadouts);
            vuDiv.dataset.readouts = this.showReadouts ? 'on' : 'off';
        }
    },

    // Clear one channel's clip LED and re-seat its hold marker on the current bar
    resetChannel(i) {
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        this.clipped[i] = false;
        this.heldPeakDb[i] = this.smPeakDb[i];
        this.heldAt[i] = now;
        this.litCount[i] = -1; // force segment repaint to drop the red hold
        this.holdKeys[i] = -2;
    },

    // Clear all clip LEDs, overs count, and re-seat hold markers on the current bars
    resetClip() {
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        for (let i = 0; i < this.numChannels; i++) {
            this.clipped[i] = false;
            this.heldPeakDb[i] = this.smPeakDb[i];
            this.heldAt[i] = now;
            this.litCount[i] = -1;
            this.holdKeys[i] = -2;
        }
        this.overs = 0;
    },

    _loop() {
        this.rafId = requestAnimationFrame(() => this._loop());
        if (!this.initialized) return;

        const vuDiv = document.getElementById('VuMeter');
        if (!vuDiv) return;

        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const dt = Math.min(0.05, this.lastFrameT ? (now - this.lastFrameT) / 1000 : 0.016);
        this.lastFrameT = now;

        const isHorizontal = vuDiv.classList.contains('vu-top') || vuDiv.classList.contains('vu-bottom');
        const channels = vuDiv.querySelectorAll('.vu-channel');

        let maxPeak = this.DB_FLOOR, maxRms = this.DB_FLOOR, anyClipped = false;

        for (let i = 0; i < channels.length; i++) {
            // --- exponential ballistics toward latest targets (prototype ch() smoothing) ---
            const tPeak = this.targetPeakDb[i];
            const cPeak = tPeak > this.smPeakDb[i]
                ? (1 - Math.exp(-dt / this.ATK))
                : (1 - Math.exp(-dt / this.REL));
            this.smPeakDb[i] += (tPeak - this.smPeakDb[i]) * cPeak;

            const tRms = this.targetRmsDb[i];
            this.smRmsDb[i] += (tRms - this.smRmsDb[i]) * (1 - Math.exp(-dt / this.RMS_TC));

            // --- peak-hold marker: dwell HOLD_MS then fall at HOLD_FALL_DBPS ---
            if (this.smPeakDb[i] > this.heldPeakDb[i]) {
                this.heldPeakDb[i] = this.smPeakDb[i];
                this.heldAt[i] = now;
            } else if (now - this.heldAt[i] > this.HOLD_MS) {
                this.heldPeakDb[i] = Math.max(this.heldPeakDb[i] - dt * this.HOLD_FALL_DBPS, this.smPeakDb[i]);
            }

            if (this.smPeakDb[i] > maxPeak) maxPeak = this.smPeakDb[i];
            if (this.smRmsDb[i] > maxRms) maxRms = this.smRmsDb[i];
            if (this.clipped[i]) anyClipped = true;

            // --- segmented LED ladder (prototype paint()) ---
            const N = this.SEG_COUNT;
            const lit = Math.min(N, Math.max(0, Math.round(((this.smPeakDb[i] - this.DB_MIN) / (0 - this.DB_MIN)) * N)));
            let holdI = Math.round(((this.heldPeakDb[i] - this.DB_MIN) / (0 - this.DB_MIN)) * N) - 1;
            holdI = Math.min(N - 1, Math.max(-1, holdI));
            const holdKey = holdI + (this.clipped[i] ? N * 100 : 0);

            if (lit !== this.litCount[i] || holdKey !== this.holdKeys[i]) {
                this.litCount[i] = lit;
                this.holdKeys[i] = holdKey;
                const segs = this.segEls[i];
                for (let s = 0; s < N; s++) {
                    const el = segs[s];
                    const shouldLit = s < lit;
                    const wasLit = el.classList.contains('is-lit');
                    if (shouldLit !== wasLit) {
                        el.classList.toggle('is-lit', shouldLit);
                        if (shouldLit) {
                            el.style.background = el.dataset.heat;
                            el.style.boxShadow = '0 0 6px ' + el.dataset.heat;
                        } else {
                            el.style.background = '';
                            el.style.boxShadow = '';
                        }
                    }
                    const isHold = s === holdI && holdI >= 0;
                    el.classList.toggle('is-peak', isHold);
                    el.classList.toggle('is-clipped', isHold && this.clipped[i]);
                }
            }

            // RMS indicator line position
            const rmsPct = this.dbToPct(this.smRmsDb[i]);
            const rmsEl = channels[i].querySelector('.vu-rms');
            if (rmsEl) {
                if (isHorizontal)
                    rmsEl.style.left = rmsPct + '%';
                else
                    rmsEl.style.bottom = rmsPct + '%';
            }

            channels[i].title = 'Ch ' + (i + 1) + ' · peak ' + this.fmt(this.smPeakDb[i]) +
                ' dBFS · RMS ' + this.fmt(this.smRmsDb[i]) + ' dBFS · click to reset';
        }

        // --- throttled text readouts (skipped entirely when disabled) ---
        const reduceMotion = (typeof matchMedia === 'function') &&
            matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (this.showReadouts && this.readoutEls && (now - this.lastTextUpdate > (reduceMotion ? 140 : 90))) {
            this.lastTextUpdate = now;
            if (this.readoutEls.peak) this.readoutEls.peak.textContent = this.fmt(maxPeak);
            if (this.readoutEls.rms) this.readoutEls.rms.textContent = this.fmt(maxRms);
            if (this.readoutEls.overs) this.readoutEls.overs.textContent = String(this.overs);
            if (this.readoutEls.root) this.readoutEls.root.classList.toggle('is-clipped', anyClipped);
        } else if (this.readoutEls && this.readoutEls.root) {
            this.readoutEls.root.classList.toggle('is-clipped', anyClipped);
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
    if (message.command !== 'vuMeter' && message.command !== 'vuMeterReadouts') { console.log(`[main.js] Received command: '${message.command}'`, message.command === 'batchWidgetUpdate' ? `(${message.widgets ? message.widgets.length : 0} widgets)` : message.command === 'widgetUpdate' ? `id=${message.id} channel=${message.channel} hasWidgetJson=${!!message.widgetJson} hasValue=${message.value !== undefined ? message.value : 'none'}` : ''); }

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
            console.log("Cabbage - case 'widgetUpdate':", JSON.stringify(message).substring(0, 200));
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
            console.log(`main.js widgetUpdate: channel=${channelId}, hasWidgetJson=${updateMsg.hasOwnProperty('widgetJson')}, hasValue=${updateMsg.hasOwnProperty('value')}`, updateMsg.hasOwnProperty('value') ? `value=${updateMsg.value}` : '');
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
                            csoundOutputWidgetAfterUpdate.appendText(buffered, div);
                        }
                        pendingCsoundOutputMessages.length = 0;
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
                const csoundOutputDiv = CabbageUtils.getWidgetDiv(csoundOutput.props);
                // If there are buffered messages (arrived before widget was created), replay them first
                if (pendingCsoundOutputMessages.length > 0) {
                    for (const buffered of pendingCsoundOutputMessages) {
                        csoundOutput.appendText(buffered, csoundOutputDiv);
                    }
                    pendingCsoundOutputMessages.length = 0;
                }
                // Append new console message
                if (csoundOutputDiv) {
                    csoundOutput.appendText(message.text, csoundOutputDiv);
                }
            } else {
                // Widget not yet created — buffer the message for later replay
                pendingCsoundOutputMessages.push(message.text);
            }
            break;

        case 'vuMeter':
            VuMeter.update(message.levels, message.rms);
            break;

        case 'vuMeterReadouts':
            VuMeter.setShowReadouts(message.show);
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
