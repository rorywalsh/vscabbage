// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.


import { CabbageUtils } from "../utils.js";
import { Cabbage } from "../cabbage.js";

/**
 * CsoundOutput class
 */
export class GenTable {
    constructor() {
        this.props = {
            "bounds": {
                "top": 0,
                "left": 0,
                "width": 200,
                "height": 100
            },
            "channels": [
                {
                    "id": "gentableStart",
                    "event": "valueChanged",
                    "range": { "min": 0, "max": -1 }
                },
                {
                    "id": "gentableLength",
                    "event": "valueChanged",
                    "range": { "min": 0, "max": -1 }
                }
            ],
            "visible": true,
            "active": true,
            "automatable": false,
            "type": "genTable",
            "zIndex": 0,

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "borderWidth": 1,
                "borderColor": "#dddddd",
                "strokeColor": "#dddddd",
                "strokeWidth": 1,
                "fillColor": "#93d200",
                "backgroundColor": "#00000022",
                "fontFamily": "Verdana",
                "fontSize": "auto",
                "fontColor": "#dddddd",
                "textAlign": "left",
                "logarithmic": false
            },
            "label": { "text": "" },
            "range": {
                "x": { "start": 0, "end": -1 },
                "y": { "min": -1.0, "max": 1.0 }
            },
            "id": "",
            "file": "",

            "tableNumber": -9999,
            "samples": [],

            "fill": 1,
            "selectableRegions": false
        };

        this.hiddenProps = ['samples'];

        // Selection state
        this.isSelecting = false;
        this.selectionStart = null;
        this.selectionEnd = null;
        this.selectionStartSample = null;
        this.selectionEndSample = null;

        // Cache for the waveform rendering (for performance)
        this.waveformCanvas = null;
        this.waveformCtx = null;

        // Wrap props with reactive proxy to watch for samples changes
        this.props = CabbageUtils.createReactiveProps(this, this.props, {
            watchKeys: ['samples', 'totalSamples'],
            onPropertyChange: (change) => {
                // Redraw when samples array changes
                console.log(`Cabbage: GenTable reactive prop changed:`, change.key, `samples.length=${this.props.samples?.length}, canvas=${!!this.canvas}, waveformCanvas=${!!this.waveformCanvas}`);
                if (change.key === 'samples' || change.key === 'totalSamples') {
                    if (this.canvas && this.waveformCanvas) {
                        console.log(`Cabbage: GenTable calling updateCanvas() due to ${change.key} change`);
                        this.updateCanvas();
                    } else {
                        console.warn(`Cabbage: GenTable cannot updateCanvas - canvas=${!!this.canvas}, waveformCanvas=${!!this.waveformCanvas}`);
                    }
                }
            }
        });
    }



    createCanvas() {
        // Create main canvas element
        this.canvas = document.createElement('canvas');
        this.canvas.width = Number(this.props.bounds.width);
        this.canvas.height = Number(this.props.bounds.height);
        this.ctx = this.canvas.getContext('2d');

        // Create offscreen canvas for waveform caching
        this.waveformCanvas = document.createElement('canvas');
        this.waveformCanvas.width = Number(this.props.bounds.width);
        this.waveformCanvas.height = Number(this.props.bounds.height);
        this.waveformCtx = this.waveformCanvas.getContext('2d');
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.widgetDiv = widgetDiv;
        this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        if (this.props.selectableRegions) {
            widgetDiv.addEventListener("pointerdown", this.onPointerDown.bind(this));
            widgetDiv.addEventListener("pointermove", this.onPointerMove.bind(this));
            widgetDiv.addEventListener("pointerup", this.onPointerUp.bind(this));
            widgetDiv.addEventListener("pointerleave", this.onPointerUp.bind(this));
            widgetDiv.style.cursor = "crosshair";
        } else {
            widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        }
    }

    pointerDown() {
        // Legacy handler for when selectableRegions is false
    }

    onPointerDown(event) {
        if (!this.props.selectableRegions) return;

        this.isSelecting = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;

        // Store the start position
        this.selectionStart = x;
        this.selectionEnd = x;

        // Calculate the sample index
        this.selectionStartSample = this.pixelToSample(x);
        this.selectionEndSample = this.selectionStartSample;

        // Draw selection overlay only (fast)
        this.drawSelectionOverlay();
    }

    onPointerMove(event) {
        if (!this.props.selectableRegions || !this.isSelecting) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;

        // Clamp x to canvas bounds
        this.selectionEnd = Math.max(0, Math.min(x, Number(this.props.bounds.width)));

        // Calculate the sample index
        this.selectionEndSample = this.pixelToSample(this.selectionEnd);

        // Only redraw the selection overlay (fast)
        this.drawSelectionOverlay();
    }

    onPointerUp(event) {
        if (!this.props.selectableRegions || !this.isSelecting) return;

        this.isSelecting = false;

        // Calculate the distance moved (in pixels)
        const distanceMoved = Math.abs(this.selectionEnd - this.selectionStart);

        // If the user clicked without dragging (threshold of 3 pixels), clear the selection
        if (distanceMoved < 3) {
            // Clear the selection
            this.selectionStart = null;
            this.selectionEnd = null;
            this.selectionStartSample = null;
            this.selectionEndSample = null;


            // Redraw to remove the selection overlay
            this.updateCanvas();
            return;
        }

        // Ensure start is before end (in pixel space)
        const startPixel = Math.min(this.selectionStart, this.selectionEnd);
        const endPixel = Math.max(this.selectionStart, this.selectionEnd);

        // Convert pixel positions to actual sample positions
        const startSample = this.pixelToSample(startPixel);
        const endSample = this.pixelToSample(endPixel);
        const lengthSamples = endSample - startSample;

        // Update the stored selection
        this.selectionStartSample = startSample;
        this.selectionEndSample = endSample;

        // Send the sample positions to Csound via channels
        const startChannel = CabbageUtils.getChannelId(this.props, 0);
        const lengthChannel = CabbageUtils.getChannelId(this.props, 1);

        if (startChannel) {
            Cabbage.sendChannelData(startChannel, startSample, this.vscode);
        }

        if (lengthChannel) {
            Cabbage.sendChannelData(lengthChannel, lengthSamples, this.vscode);
        }


        // Redraw to show final selection
        this.updateCanvas();
    }

    /**
     * Convert a pixel position to a sample index
     * @param {number} pixelX - The x position in pixels
     * @returns {number} - The corresponding sample index
     */
    pixelToSample(pixelX) {
        if (this.props.samples.length === 0) return 0;

        // Get the total number of samples in the actual table (not just the decimated display data)
        const totalSamples = this.props.totalSamples || this.props.samples.length;

        // Map pixel position to sample index
        // Account for the current range settings
        const rangeStart = this.props.range.x.start || 0;
        const rangeEnd = this.props.range.x.end === -1 ? totalSamples : this.props.range.x.end;
        const rangeLength = rangeEnd - rangeStart;

        // Calculate the sample position
        const normalizedX = pixelX / Number(this.props.bounds.width);
        let sampleIndex;

        // If logarithmic view is enabled, map pixels to samples using a
        // logarithmic scale so low-index samples get more horizontal space.
        const useLog = (this.props.style && this.props.style.logarithmic);
        if (useLog) {
            // Avoid zero/negative values by offsetting by 1
            const safeLength = Math.max(1, rangeLength);
            const logMax = Math.log10(safeLength + 1);
            const value = Math.pow(10, normalizedX * logMax) - 1;
            sampleIndex = Math.floor(rangeStart + value);
        } else {
            // Linear mapping — guard against zero-length ranges
            if (rangeLength <= 0) {
                sampleIndex = rangeStart;
            } else {
                sampleIndex = Math.floor(rangeStart + (normalizedX * rangeLength));
            }
        }

        // Clamp to valid range
        return Math.max(rangeStart, Math.min(sampleIndex, rangeEnd - 1));
    }

    /**
     * Convert a sample index to a pixel position
     * @param {number} sampleIndex - The sample index
     * @returns {number} - The corresponding x position in pixels
     */
    sampleToPixel(sampleIndex) {
        if (this.props.samples.length === 0) return 0;

        // Get the total number of samples in the actual table
        const totalSamples = this.props.totalSamples || this.props.samples.length;

        const rangeStart = this.props.range.x.start || 0;
        const rangeEnd = this.props.range.x.end === -1 ? totalSamples : this.props.range.x.end;
        const rangeLength = rangeEnd - rangeStart;

        let normalized;
        const useLog2 = (this.props.style && this.props.style.logarithmic);
        if (useLog2) {
            // Logarithmic mapping: map sample index to [0,1] using log scale
            const safeLength = Math.max(1, rangeLength);
            const logMax = Math.log10(safeLength + 1);
            const value = (sampleIndex - rangeStart);
            const safeValue = Math.max(0, value);
            normalized = Math.log10(safeValue + 1) / logMax;
        } else {
            // Linear mapping — guard against zero-length ranges
            if (rangeLength <= 0) {
                normalized = 0;
            } else {
                normalized = (sampleIndex - rangeStart) / rangeLength;
            }
        }
        return normalized * Number(this.props.bounds.width);
    }

    /**
     * Efficiently draws only the selection overlay without redrawing the waveform
     * This is called during pointer move for performance
     */
    drawSelectionOverlay() {
        if (!this.waveformCanvas) return;

        // Clear the main canvas and redraw the cached waveform
        this.ctx.clearRect(0, 0, Number(this.props.bounds.width), Number(this.props.bounds.height));
        this.ctx.drawImage(this.waveformCanvas, 0, 0);

        // Draw selection overlay if active
        if (this.selectionStart !== null && this.selectionEnd !== null) {
            const startX = Math.min(this.selectionStart, this.selectionEnd);
            const endX = Math.max(this.selectionStart, this.selectionEnd);
            const width = endX - startX;

            // Save current context state
            this.ctx.save();

            // Draw semi-transparent selection overlay
            this.ctx.fillStyle = 'rgba(147, 210, 0, 0.3)'; // Light green with transparency
            this.ctx.fillRect(startX, 0, width, Number(this.props.bounds.height));

            // Draw selection borders
            this.ctx.strokeStyle = '#93d200'; // Green
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, 0);
            this.ctx.lineTo(startX, Number(this.props.bounds.height));
            this.ctx.moveTo(endX, 0);
            this.ctx.lineTo(endX, Number(this.props.bounds.height));
            this.ctx.stroke();

            // Restore context state
            this.ctx.restore();
        }
    }

    getInnerHTML() {
        const channelId = CabbageUtils.getWidgetDivId(this.props);
        return `<div id="${channelId}" style="width:${this.props.bounds.width}px; height:${this.props.bounds.height}px;"></div>`;
    }

    /**
     * Called by PropertyPanel when properties change
     * This is the method the property panel expects for gentable widgets
     */
    updateTable() {
        if (this.canvas && this.waveformCanvas) {
            this.updateCanvas();
        }
    }

    updateCanvas() {
        // Resize both canvases
        this.canvas.width = Number(this.props.bounds.width);
        this.canvas.height = Number(this.props.bounds.height);
        this.waveformCanvas.width = Number(this.props.bounds.width);
        this.waveformCanvas.height = Number(this.props.bounds.height);

        // Render the waveform to the offscreen canvas (this is the expensive operation)
        this.renderWaveformToCache();

        // Runtime debug: log a few mappings when logarithmic mode is enabled so we can
        // verify that pixel->sample mapping is actually non-linear at runtime.
        try {
            const useLog = (this.props.style && this.props.style.logarithmic);
            if (useLog && !this.gentableLogged) {
                const w = Number(this.props.bounds.width) || 1;
                const totalSamples = this.props.totalSamples || this.props.samples.length || 0;
                const map = (x) => this.pixelToSample(x);
                // mark as logged for a short period to avoid noisy output
                this.gentableLogged = true;
                setTimeout(() => { this.gentableLogged = false; }, 3000);
            }
            // One-time props dump to help diagnose whether style.logarithmic
            // is actually present on the widget props at render time. This
            // is guarded so it only prints briefly and won't spam the console.
            if (!this.gentablePropsLogged) {
                try {

                } catch (e) {
                    console.warn('Cabbage: Failed to log GenTable props', e);
                }
                this.gentablePropsLogged = true;
                // Allow a single reprint after a short delay (in case props update)
                setTimeout(() => { this.gentablePropsLogged = false; }, 5000);
            }
            // Targeted mapping output: print whether logarithmic mode is enabled
            // and a few pixel->sample mappings so we can verify the mapping math
            // at runtime even when the props object prints as a Proxy.
            if (!this.gentableMapLogged) {
                try {
                    const w = Number(this.props.bounds.width) || 1;
                    const totalSamples = this.props.totalSamples || this.props.samples.length || 0;
                    const rangeStart = (this.props.range && this.props.range.x) ? (this.props.range.x.start || 0) : 0;
                    const rangeEnd = (this.props.range && this.props.range.x && this.props.range.x.end !== -1) ? this.props.range.x.end : totalSamples;
                    const positions = [0, Math.floor(w / 4), Math.floor(w / 2), Math.floor(3 * w / 4), Math.max(0, w - 1)];
                    const mappings = positions.map(px => `${px}->${this.pixelToSample(px)}`);

                } catch (e) {
                    console.warn('Cabbage: GenTable mapping log failed', e);
                }
                this.gentableMapLogged = true;
                setTimeout(() => { this.gentableMapLogged = false; }, 3000);
            }
        } catch (e) {
            console.warn('Cabbage: GenTable debug logging failed', e);
        }

        // Draw the cached waveform to the main canvas
        this.ctx.clearRect(0, 0, Number(this.props.bounds.width), Number(this.props.bounds.height));
        this.ctx.drawImage(this.waveformCanvas, 0, 0);

        // Draw selection overlay if there's an active selection
        if (this.selectionStart !== null && this.selectionEnd !== null) {
            this.drawSelectionOverlay();
        }

        // Draw rounded background border on the main canvas so it appears
        // above the waveform and selection overlay. Use `borderColor`/`borderWidth`.
        const bgBorderWidth2 = Number((this.props.style && (typeof this.props.style.borderWidth !== 'undefined')) ? this.props.style.borderWidth : 0);
        const bgBorderColor2 = (this.props.style && this.props.style.borderColor) || 'rgba(0,0,0,0)';
        if (bgBorderWidth2 > 0) {
            this.ctx.save();
            this.ctx.strokeStyle = bgBorderColor2;
            this.ctx.lineWidth = bgBorderWidth2;
            this.ctx.beginPath();
            this.ctx.moveTo(Number(this.props.style.borderRadius), 0);
            this.ctx.arcTo(this.props.bounds.width, 0, this.props.bounds.width, this.props.bounds.height, Number(this.props.style.borderRadius));
            this.ctx.arcTo(this.props.bounds.width, this.props.bounds.height, 0, this.props.bounds.height, Number(this.props.style.borderRadius));
            this.ctx.arcTo(0, this.props.bounds.height, 0, 0, Number(this.props.style.borderRadius));
            this.ctx.arcTo(0, 0, this.props.bounds.width, 0, Number(this.props.style.borderRadius));
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.restore();
        }

        // Update DOM with the canvas
        const widgetElement = CabbageUtils.getWidgetDiv(this.props);
        if (widgetElement) {
            widgetElement.style.left = '0px';
            widgetElement.style.top = '0px';
            widgetElement.style.padding = '0';
            widgetElement.style.margin = '0';
            widgetElement.innerHTML = ''; // Clear existing content
            this.canvas.style.display = this.props.visible ? 'block' : 'none';
            widgetElement.appendChild(this.canvas); // Append canvas

            // Add event listeners
            this.addEventListeners(widgetElement);
        } else {
            console.log(`Cabbage: Element: ${this.props.channels[0].id} not found.`);
        }
    }

    /**
     * Renders the waveform (background, samples, text) to the offscreen canvas
     * This is the expensive operation that we cache
     * 
    // Color scheme:
    // - shape.backgroundColor: Widget background (behind waveform)
    // - shape.fillColor: Waveform shape fill color
    // - shape.borderColor / shape.borderWidth: Border drawn around the rounded background
    // - shape.strokeColor / shape.strokeWidth: Outline stroke used for the waveform itself
     */
    renderWaveformToCache() {
        const ctx = this.waveformCtx;

        // Clear canvas
        ctx.clearRect(0, 0, Number(this.props.bounds.width), Number(this.props.bounds.height));

        // Set the global alpha for the canvas context (style.opacity is the canonical place)
        ctx.globalAlpha = Number((this.props.style && typeof this.props.style.opacity !== 'undefined') ? this.props.style.opacity : 1);

        // Prepare range and sample metrics with safe defaults so this function can
        // tolerate missing or partially-specified `range` objects coming from the
        // backend JSON. This also fixes the ReferenceError where `rangeLength` was
        // referenced but not defined in this scope.
        const totalSamples = this.props.totalSamples || this.props.samples.length || 0;
        const rangeStart = (this.props.range && this.props.range.x) ? (typeof this.props.range.x.start !== 'undefined' ? this.props.range.x.start : 0) : 0;
        const rangeEnd = (this.props.range && this.props.range.x && typeof this.props.range.x.end !== 'undefined' && this.props.range.x.end !== -1) ? this.props.range.x.end : totalSamples;
        const rangeLength = Math.max(0, rangeEnd - rangeStart);

        // Determine the Y-axis range for waveform display (use sensible defaults)
        const yMin = (this.props.range && this.props.range.y && typeof this.props.range.y.min !== 'undefined') ? this.props.range.y.min : -1.0;
        const yMax = (this.props.range && this.props.range.y && typeof this.props.range.y.max !== 'undefined') ? this.props.range.y.max : 1.0;

        // Calculate border inset to prevent waveform from overlapping the border
        const borderInset = Number((this.props.style && (typeof this.props.style.borderWidth !== 'undefined')) ? this.props.style.borderWidth : 0);

        // Draw background with rounded corners
        // Prefer the new `backgroundColor` key but fall back to the old `background`
        ctx.fillStyle = (this.props.style && (this.props.style.backgroundColor || this.props.style.background)) || 'rgba(0,0,0,0)';
        ctx.beginPath();
        ctx.moveTo(Number(this.props.style.borderRadius), 0);
        ctx.arcTo(this.props.bounds.width, 0, this.props.bounds.width, this.props.bounds.height, Number(this.props.style.borderRadius));
        ctx.arcTo(this.props.bounds.width, this.props.bounds.height, 0, this.props.bounds.height, Number(this.props.style.borderRadius));
        ctx.arcTo(0, this.props.bounds.height, 0, 0, Number(this.props.style.borderRadius));
        ctx.arcTo(0, 0, this.props.bounds.width, 0, Number(this.props.style.borderRadius));
        ctx.closePath();
        ctx.fill();

        // Set up clipping region inset by border width so waveform doesn't overlap the border area
        ctx.save();
        if (borderInset > 0) {
            const insetRadius = Math.max(0, Number(this.props.style.borderRadius) - borderInset);
            ctx.beginPath();
            ctx.moveTo(borderInset + insetRadius, borderInset);
            ctx.arcTo(this.props.bounds.width - borderInset, borderInset, this.props.bounds.width - borderInset, this.props.bounds.height - borderInset, insetRadius);
            ctx.arcTo(this.props.bounds.width - borderInset, this.props.bounds.height - borderInset, borderInset, this.props.bounds.height - borderInset, insetRadius);
            ctx.arcTo(borderInset, this.props.bounds.height - borderInset, borderInset, borderInset, insetRadius);
            ctx.arcTo(borderInset, borderInset, this.props.bounds.width - borderInset, borderInset, insetRadius);
            ctx.closePath();
            ctx.clip();
        }

        // Background border drawing moved to `updateCanvas()` so it is painted
        // on the main canvas after the waveform and selection overlays. This
        // ensures the border appears above the waveform rather than being
        // obscured by it.

        // Only draw waveform if we have samples
        if (this.props.samples.length === 0) {
            // Draw text even if no samples
            this.drawText(ctx);
            return;
        }

        // Calculate how many samples per pixel for linear mode. For logarithmic
        // mode we will map pixels to sample indices individually using
        // sampleToPixel/pixelToSample helpers.
        const samplesPerPixel = this.props.samples.length / this.props.bounds.width;
        const centerY = this.props.bounds.height / 2;
        // Y-axis logarithmic support (optional): enable by setting style.logarithmicY = true
        // Enable logarithmic Y if either explicit logarithmicY is set, or the
        // general `logarithmic` flag is true (so `logarithmic:true` toggles both axes).
        const useLogY = (this.props.style && ((this.props.style.logarithmicY) || (this.props.style.logarithmic)));

        // Helper to map a value to a pixel Y position. Uses linear mapping by default
        // and a symmetric, magnitude-preserving logarithmic mapping when useLogY is true.
        const valueToPixel = (val) => {
            const height = Number(this.props.bounds.height);
            // Linear mapping when log Y isn't requested
            if (!useLogY) return CabbageUtils.map(val, yMin, yMax, height, 0);

            // Easing helper: log-like ease from 0..1 -> 0..1
            const easeLog = (x) => Math.log10(1 + 9 * Math.min(1, Math.max(0, x)));

            // Positive-only range (e.g. [0..1]) -> map val so higher values go toward the top
            if (isFinite(yMin) && isFinite(yMax) && yMin >= 0) {
                const range = yMax - yMin;
                if (!isFinite(range) || range <= 0) return height; // fallback to bottom
                const norm = (val - yMin) / range; // 0..1
                const t = easeLog(norm);
                // pixel: 0 at top, height at bottom. Higher value -> smaller pixel (toward top)
                return (1 - t) * height;
            }

            // Negative-only range (e.g. [-1..0]) -> treat similarly so larger (less negative) values go toward top
            if (isFinite(yMin) && isFinite(yMax) && yMax <= 0) {
                const range = yMax - yMin;
                if (!isFinite(range) || range <= 0) return height / 2;
                const norm = (val - yMin) / range; // 0..1
                const t = easeLog(norm);
                return (1 - t) * height;
            }

            // Mixed-sign range: preserve symmetric behavior around centerValue
            const cY = height / 2;
            const centerValue = (yMin + yMax) / 2;
            let delta = val - centerValue;
            if (delta === 0) return cY;
            const positive = delta > 0;
            const maxDelta = positive ? (yMax - centerValue) : (centerValue - yMin);
            if (!isFinite(maxDelta) || maxDelta <= 0) return cY;
            const norm = Math.min(1, Math.abs(delta) / maxDelta);
            const t = easeLog(norm);
            return positive ? (cY - t * cY) : (cY + t * cY);
        };

        // Draw waveform with min/max peaks for better visualization
        if (Number(this.props.fill) === 1) {
            // Draw filled waveform from center line to amplitudes
            // Prefer `fillColor`, fall back to legacy `fill` color key
            ctx.fillStyle = (this.props.style && (this.props.style.fillColor || this.props.style.fill)) || '#000000';
            for (let x = 0; x < Number(this.props.bounds.width); x++) {
                let startIdx, endIdx;
                const useLog3 = (this.props.style && this.props.style.logarithmic);
                if (useLog3) {
                    startIdx = Math.floor(this.pixelToSample(x));
                    endIdx = Math.min(Math.ceil(this.pixelToSample(x + 1)), this.props.samples.length);
                } else {
                    startIdx = Math.floor(x * samplesPerPixel);
                    endIdx = Math.min(Math.ceil((x + 1) * samplesPerPixel), this.props.samples.length);
                }

                // Find max and min values in this pixel's sample range
                let maxVal = 0; // Default to center (0) if no samples
                let minVal = 0; // Default to center (0) if no samples
                if (startIdx < this.props.samples.length) {
                    maxVal = -1;
                    minVal = Number.MAX_VALUE;
                    for (let i = startIdx; i < endIdx; i++) {
                        maxVal = Math.max(maxVal, this.props.samples[i]);
                        minVal = Math.min(minVal, this.props.samples[i]);
                    }
                    if (minVal === Number.MAX_VALUE) {
                        minVal = 0; // If no valid samples, default to center
                    }
                }

                // For filled waveform, fill from center to the amplitude extremes
                const maxY = valueToPixel(maxVal);
                const minY = valueToPixel(minVal);
                const topFill = Math.min(centerY, maxY, minY);
                const bottomFill = Math.max(centerY, maxY, minY);
                const fillHeight = Math.max(1, bottomFill - topFill);
                ctx.fillRect(x, topFill, 1, fillHeight);
            }
        }

        // Draw outline stroke on top
        // Check strokeWidth first (primary), then fall back to borderWidth for legacy support
        const outlineWidth = Number((this.props.style && (typeof this.props.style.strokeWidth !== 'undefined')) ? this.props.style.strokeWidth : (this.props.style.borderWidth || 0));
        if (outlineWidth > 0) {
            // Use `strokeColor`/`strokeWidth` for the waveform outline if provided,
            // otherwise fall back to legacy `borderColor`/`borderWidth`.
            const outlineColor = (this.props.style && (this.props.style.strokeColor || this.props.style.borderColor)) || '#000000';
            ctx.strokeStyle = outlineColor;
            ctx.lineWidth = outlineWidth;
            ctx.beginPath();

            for (let x = 0; x < Number(this.props.bounds.width); x++) {
                let startIdx, endIdx;
                const useLog4 = (this.props.style && this.props.style.logarithmic);
                if (useLog4) {
                    startIdx = Math.floor(this.pixelToSample(x));
                    endIdx = Math.min(Math.ceil(this.pixelToSample(x + 1)), this.props.samples.length);
                } else {
                    startIdx = Math.floor(x * samplesPerPixel);
                    endIdx = Math.min(startIdx + samplesPerPixel, this.props.samples.length);
                }

                // Find max value for outline
                let maxVal = 0; // Default to center (0) if no samples
                if (startIdx < this.props.samples.length) {
                    maxVal = -1;
                    for (let i = startIdx; i < endIdx; i++) {
                        maxVal = Math.max(maxVal, this.props.samples[i]);
                    }
                }

                const y = valueToPixel(maxVal);

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        }

        // Note: red diagnostic tick lines removed — enable visual diagnostics
        // via console mapping logs if needed.

        // Restore context (remove clipping)
        ctx.restore();

        // Draw text on top of everything
        this.drawText(ctx);
    }

    /**
     * Draw text overlay on the waveform
     * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
     */
    drawText(ctx) {
        if (!this.props.label || !this.props.label.text) return;

        const fontSize = this.props.style.fontSize === "auto" ? Math.max(this.props.bounds.height * 0.1, 12) : this.props.style.fontSize;
        const canvasAlignMap = {
            'left': 'left',
            'center': 'center',
            'centre': 'center',
            'right': 'right',
        };

        const textAlign = canvasAlignMap[this.props.style.textAlign] || 'left';
        ctx.font = `${fontSize}px ${this.props.style.fontFamily}`;
        ctx.fillStyle = this.props.style.fontColor;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'bottom';

        const textX = this.props.style.textAlign === 'right' ? this.props.bounds.width - 10 : this.props.style.textAlign === 'center' || this.props.style.textAlign === 'centre' ? this.props.bounds.width / 2 : 10;
        const textY = this.props.bounds.height - 10;
        ctx.fillText(this.props.label.text, textX, textY);
    }
}

