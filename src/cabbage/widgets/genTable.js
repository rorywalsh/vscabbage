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
            "automatable": false,
            "type": "genTable",

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "borderWidth": 1,
                "borderColor": "#dddddd",
                "fill": "#93d200",
                "background": "#00000022"
            },

            "label": {
                "fontFamily": "Verdana",
                "fontSize": "auto",
                "color": "#dddddd",
                "textAlign": "left"
            },

            "range": {
                "x": { "start": 0, "end": -1 },
                "y": { "min": -1.0, "max": 1.0 }
            },
            "id": "",
            "file": "",
            "text": "",
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
            this.updateTable();
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
        this.updateTable();
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
        const sampleIndex = Math.floor(rangeStart + (normalizedX * rangeLength));

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

        const normalized = (sampleIndex - rangeStart) / rangeLength;
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
        const channelId = CabbageUtils.getChannelId(this.props, 0);
        return `<div id="${channelId}" style="width:${this.props.bounds.width}px; height:${this.props.bounds.height}px;"></div>`;
    }

    updateTable() {
        // Resize both canvases
        this.canvas.width = Number(this.props.bounds.width);
        this.canvas.height = Number(this.props.bounds.height);
        this.waveformCanvas.width = Number(this.props.bounds.width);
        this.waveformCanvas.height = Number(this.props.bounds.height);

        // Render the waveform to the offscreen canvas (this is the expensive operation)
        this.renderWaveformToCache();

        // Draw the cached waveform to the main canvas
        this.ctx.clearRect(0, 0, Number(this.props.bounds.width), Number(this.props.bounds.height));
        this.ctx.drawImage(this.waveformCanvas, 0, 0);

        // Draw selection overlay if there's an active selection
        if (this.selectionStart !== null && this.selectionEnd !== null) {
            this.drawSelectionOverlay();
        }

        // Update DOM with the canvas
        const channelId = CabbageUtils.getChannelId(this.props, 0);
        const widgetElement = document.getElementById(channelId);
        if (widgetElement) {
            widgetElement.style.left = '0px';
            widgetElement.style.top = '0px';
            widgetElement.style.padding = '0';
            widgetElement.style.margin = '0';
            widgetElement.innerHTML = ''; // Clear existing content
            this.canvas.style.display = Number(this.props.visible) === 0 ? 'none' : 'block';
            widgetElement.appendChild(this.canvas); // Append canvas

            // Add event listeners
            this.addEventListeners(widgetElement);
        } else {
            console.log(`Element: ${channelId} not found.`);
        }
    }

    /**
     * Renders the waveform (background, samples, text) to the offscreen canvas
     * This is the expensive operation that we cache
     * 
     * Color scheme:
     * - shape.background: Widget background (behind waveform)
     * - shape.fill: Waveform shape fill color
     * - shape.borderColor: Outline color around waveform
     * - shape.borderWidth: Outline thickness
     */
    renderWaveformToCache() {
        const ctx = this.waveformCtx;

        // Clear canvas
        ctx.clearRect(0, 0, Number(this.props.bounds.width), Number(this.props.bounds.height));

        // Set the global alpha for the canvas context
        ctx.globalAlpha = Number(this.props.opacity); // Apply opacity

        // Determine the Y-axis range for waveform display
        const yMin = this.props.range.y.min;
        const yMax = this.props.range.y.max;

        // Draw background with rounded corners
        ctx.fillStyle = this.props.style.background;
        ctx.beginPath();
        ctx.moveTo(Number(this.props.style.borderRadius), 0);
        ctx.arcTo(this.props.bounds.width, 0, this.props.bounds.width, this.props.bounds.height, Number(this.props.style.borderRadius));
        ctx.arcTo(this.props.bounds.width, this.props.bounds.height, 0, this.props.bounds.height, Number(this.props.style.borderRadius));
        ctx.arcTo(0, this.props.bounds.height, 0, 0, Number(this.props.style.borderRadius));
        ctx.arcTo(0, 0, this.props.bounds.width, 0, Number(this.props.style.borderRadius));
        ctx.closePath();
        ctx.fill();

        // Only draw waveform if we have samples
        if (this.props.samples.length === 0) {
            // Draw text even if no samples
            this.drawText(ctx);
            return;
        }

        // Calculate how many samples per pixel
        // Note: samples array is already decimated by C++ code to roughly match widget width
        // So we need to scale from samples.length to bounds.width
        const samplesPerPixel = this.props.samples.length / this.props.bounds.width;
        const centerY = this.props.bounds.height / 2;

        // Draw waveform with min/max peaks for better visualization
        if (Number(this.props.fill) === 1) {
            // Draw filled waveform from center line to amplitudes
            ctx.fillStyle = this.props.style.fill;
            for (let x = 0; x < Number(this.props.bounds.width); x++) {
                const startIdx = Math.floor(x * samplesPerPixel);
                const endIdx = Math.min(Math.ceil((x + 1) * samplesPerPixel), this.props.samples.length);

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
                const centerY = this.props.bounds.height / 2;
                const maxY = CabbageUtils.map(maxVal, yMin, yMax, this.props.bounds.height, 0);
                const minY = CabbageUtils.map(minVal, yMin, yMax, this.props.bounds.height, 0);
                const topFill = Math.min(centerY, maxY, minY);
                const bottomFill = Math.max(centerY, maxY, minY);
                const fillHeight = Math.max(1, bottomFill - topFill);
                ctx.fillRect(x, topFill, 1, fillHeight);
            }
        }

        // Draw outline stroke on top
        if (Number(this.props.style.borderWidth) > 0) {
            ctx.strokeStyle = this.props.style.borderColor;
            ctx.lineWidth = Number(this.props.style.borderWidth);
            ctx.beginPath();

            for (let x = 0; x < Number(this.props.bounds.width); x++) {
                const startIdx = Math.floor(x * samplesPerPixel);
                const endIdx = Math.min(startIdx + samplesPerPixel, this.props.samples.length);

                // Find max value for outline
                let maxVal = 0; // Default to center (0) if no samples
                if (startIdx < this.props.samples.length) {
                    maxVal = -1;
                    for (let i = startIdx; i < endIdx; i++) {
                        maxVal = Math.max(maxVal, this.props.samples[i]);
                    }
                }

                const y = CabbageUtils.map(maxVal, yMin, yMax, this.props.bounds.height, 0);

                if (x === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.stroke();
        }

        // Draw text on top of everything
        this.drawText(ctx);
    }

    /**
     * Draw text overlay on the waveform
     * @param {CanvasRenderingContext2D} ctx - The canvas context to draw on
     */
    drawText(ctx) {
        if (!this.props.text) return;

        const fontSize = this.props.label.fontSize === "auto" ? Math.max(this.props.bounds.height * 0.1, 12) : this.props.label.fontSize;
        const canvasAlignMap = {
            'left': 'left',
            'center': 'center',
            'centre': 'center',
            'right': 'right',
        };

        const textAlign = canvasAlignMap[this.props.label.textAlign] || 'left';
        ctx.font = `${fontSize}px ${this.props.label.fontFamily}`;
        ctx.fillStyle = this.props.label.color;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'bottom';

        const textX = this.props.label.textAlign === 'right' ? this.props.bounds.width - 10 : this.props.label.textAlign === 'center' || this.props.label.textAlign === 'centre' ? this.props.bounds.width / 2 : 10;
        const textY = this.props.bounds.height - 10;
        ctx.fillText(this.props.text, textX, textY);
    }
}

