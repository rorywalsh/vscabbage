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
            "type": "genTable",
            "colour": {
                "fill": "#93d200",
                "background": "#00000022",
                "stroke": {
                    "colour": "#dddddd",
                    "width": 1
                }
            },
            "channel": {
                "id": "gentable",
                "start": "gentable_start",
                "length": "gentable_length"
            },
            "font": {
                "family": "Verdana",
                "size": 0,
                "align": "left",
                "colour": "#dddddd"
            },
            "range": {
                "start": 0,
                "end": -1
            },
            "file": "",
            "corners": 4,
            "visible": 1,
            "text": "",
            "tableNumber": 1,
            "samples": [],
            "automatable": 0,
            "opacity": 1,
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
        this.canvas.width = this.props.bounds.width;
        this.canvas.height = this.props.bounds.height;
        this.ctx = this.canvas.getContext('2d');

        // Create offscreen canvas for waveform caching
        this.waveformCanvas = document.createElement('canvas');
        this.waveformCanvas.width = this.props.bounds.width;
        this.waveformCanvas.height = this.props.bounds.height;
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

        console.log(`GenTable: onPointerDown - pixel: ${x}, sample: ${this.selectionStartSample}, samples.length: ${this.props.samples.length}, range: ${this.props.range.start}-${this.props.range.end}`);

        // Draw selection overlay only (fast)
        this.drawSelectionOverlay();
    }

    onPointerMove(event) {
        if (!this.props.selectableRegions || !this.isSelecting) return;

        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;

        // Clamp x to canvas bounds
        this.selectionEnd = Math.max(0, Math.min(x, this.props.bounds.width));

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

            console.log('GenTable: Selection cleared');

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
        if (this.props.channel.start) {
            console.log(`GenTable: Sending start channel: ${this.props.channel.start} = ${startSample} (sample position)`);
            Cabbage.sendChannelData(this.props.channel.start, startSample, this.vscode);
        }

        if (this.props.channel.length) {
            console.log(`GenTable: Sending length channel: ${this.props.channel.length} = ${lengthSamples} (sample count)`);
            Cabbage.sendChannelData(this.props.channel.length, lengthSamples, this.vscode);
        }

        console.log(`GenTable: Selected region from sample ${startSample} to ${endSample} (length: ${lengthSamples})`);

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
        const rangeStart = this.props.range.start || 0;
        const rangeEnd = this.props.range.end === -1 ? totalSamples : this.props.range.end;
        const rangeLength = rangeEnd - rangeStart;

        // Calculate the sample position
        const normalizedX = pixelX / this.props.bounds.width;
        const sampleIndex = Math.floor(rangeStart + (normalizedX * rangeLength));

        console.log(`pixelToSample: pixel=${pixelX}, widgetWidth=${this.props.bounds.width}, displayedSamples=${this.props.samples.length}, totalSamples=${totalSamples}, rangeStart=${rangeStart}, rangeEnd=${rangeEnd}, rangeLength=${rangeLength}, normalizedX=${normalizedX.toFixed(4)}, sampleIndex=${sampleIndex}`);

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

        const rangeStart = this.props.range.start || 0;
        const rangeEnd = this.props.range.end === -1 ? totalSamples : this.props.range.end;
        const rangeLength = rangeEnd - rangeStart;

        const normalized = (sampleIndex - rangeStart) / rangeLength;
        return normalized * this.props.bounds.width;
    }

    /**
     * Efficiently draws only the selection overlay without redrawing the waveform
     * This is called during pointer move for performance
     */
    drawSelectionOverlay() {
        if (!this.waveformCanvas) return;

        // Clear the main canvas and redraw the cached waveform
        this.ctx.clearRect(0, 0, this.props.bounds.width, this.props.bounds.height);
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
            this.ctx.fillRect(startX, 0, width, this.props.bounds.height);

            // Draw selection borders
            this.ctx.strokeStyle = '#93d200'; // Green
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, 0);
            this.ctx.lineTo(startX, this.props.bounds.height);
            this.ctx.moveTo(endX, 0);
            this.ctx.lineTo(endX, this.props.bounds.height);
            this.ctx.stroke();

            // Restore context state
            this.ctx.restore();
        }
    }

    getInnerHTML() {
        const channelId = typeof this.props.channel === 'object' ? this.props.channel.id : this.props.channel;
        return `<div id="${channelId}" style="width:${this.props.bounds.width}px; height:${this.props.bounds.height}px;"></div>`;
    }

    updateTable() {
        // Resize both canvases
        this.canvas.width = this.props.bounds.width;
        this.canvas.height = this.props.bounds.height;
        this.waveformCanvas.width = this.props.bounds.width;
        this.waveformCanvas.height = this.props.bounds.height;

        // Render the waveform to the offscreen canvas (this is the expensive operation)
        this.renderWaveformToCache();

        // Draw the cached waveform to the main canvas
        this.ctx.clearRect(0, 0, this.props.bounds.width, this.props.bounds.height);
        this.ctx.drawImage(this.waveformCanvas, 0, 0);

        // Draw selection overlay if there's an active selection
        if (this.selectionStart !== null && this.selectionEnd !== null) {
            this.drawSelectionOverlay();
        }

        // Update DOM with the canvas
        const channelId = typeof this.props.channel === 'object' ? this.props.channel.id : this.props.channel;
        const widgetElement = document.getElementById(channelId);
        if (widgetElement) {
            widgetElement.style.left = '0px';
            widgetElement.style.top = '0px';
            widgetElement.style.padding = '0';
            widgetElement.style.margin = '0';
            widgetElement.innerHTML = ''; // Clear existing content
            this.canvas.style.display = this.props.visible === 0 ? 'none' : 'block';
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
     */
    renderWaveformToCache() {
        const ctx = this.waveformCtx;

        // Clear canvas
        ctx.clearRect(0, 0, this.props.bounds.width, this.props.bounds.height);

        // Set the global alpha for the canvas context
        ctx.globalAlpha = this.props.opacity; // Apply opacity

        // Draw background with rounded corners using the new background property
        ctx.fillStyle = this.props.colour.background;
        ctx.beginPath();
        ctx.moveTo(this.props.corners, 0);
        ctx.arcTo(this.props.bounds.width, 0, this.props.bounds.width, this.props.bounds.height, this.props.corners);
        ctx.arcTo(this.props.bounds.width, this.props.bounds.height, 0, this.props.bounds.height, this.props.corners);
        ctx.arcTo(0, this.props.bounds.height, 0, 0, this.props.corners);
        ctx.arcTo(0, 0, this.props.bounds.width, 0, this.props.corners);
        ctx.closePath();
        ctx.fill();

        const increment = Math.max(1, Math.floor(this.props.samples.length / this.props.bounds.width));

        // Draw waveform - First, handle the fill
        if (this.props.fill === 1) {
            ctx.strokeStyle = this.props.colour.fill; // Set fill color for vertical lines
            ctx.lineWidth = 2; // Line width for the filled waveform

            for (let i = 0; i < this.props.samples.length; i += increment) {

                const x = CabbageUtils.map(i, 0, this.props.samples.length - 1, 0, this.props.bounds.width);

                if (x > this.props.bounds.width) {
                    continue; // Skip drawing if x exceeds bounds
                }
                const y = CabbageUtils.map(this.props.samples[i], -1, 1, this.props.bounds.height, 0);

                ctx.beginPath();
                ctx.moveTo(x, this.props.bounds.height / 2); // Move to middle
                ctx.lineTo(x, y); // Draw to the sample point
                ctx.stroke(); // Apply stroke
            }
        }

        // Second phase: Draw outline (stroke)
        ctx.strokeStyle = this.props.colour.stroke.colour; // Set stroke color for outline
        ctx.lineWidth = this.props.colour.stroke.width; // Set stroke width for outline
        ctx.beginPath();

        for (let i = 0; i < this.props.samples.length; i += increment) {

            const x = CabbageUtils.map(i, 0, this.props.samples.length - 1, 0, this.props.bounds.width);

            if (x > this.props.bounds.width) {
                continue; // Skip drawing if x exceeds bounds
            }
            const y = CabbageUtils.map(this.props.samples[i], -1, 1, this.props.bounds.height, 0);
            if (i === 0) {
                ctx.moveTo(x, y); // Move to the first sample
            } else {
                ctx.lineTo(x, y); // Connect to the next sample
            }

            ctx.lineTo(x, y); // Draw line to the sample point for the outline
        }

        ctx.stroke(); // Apply stroke to complete the outline
        ctx.closePath(); // Close the path to finalize the outline


        // Draw text
        const fontSize = this.props.font.size > 0 ? this.props.font.size : Math.max(this.props.bounds.height * 0.1, 12);
        const alignMap = {
            'left': 'start',
            'center': 'center',
            'centre': 'center',
            'right': 'end',
        };
        const canvasAlignMap = {
            'left': 'left',
            'center': 'center',
            'centre': 'center',
            'right': 'right',
        };

        const textAlign = canvasAlignMap[this.props.font.align] || 'left';
        ctx.font = `${fontSize}px ${this.props.font.family}`;
        ctx.fillStyle = this.props.font.colour;
        ctx.textAlign = textAlign;
        ctx.textBaseline = 'bottom';

        const textX = this.props.font.align === 'right' ? this.props.bounds.width - 10 : this.props.font.align === 'center' || this.props.font.align === 'centre' ? this.props.bounds.width / 2 : 10;
        const textY = this.props.bounds.height - 10;
        ctx.fillText(this.props.text, textX, textY);
    }
}

