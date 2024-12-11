// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.


import { CabbageUtils } from "../utils.js";

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
            "channel": "gentable",
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
            "fill": 1
        };

        this.hiddenProps = ['samples'];
    }



    createCanvas() {
        // Create canvas element during initialization
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.props.bounds.width;
        this.canvas.height = this.props.bounds.height;
        this.ctx = this.canvas.getContext('2d');
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    }

    pointerDown() {

    }

    getInnerHTML() {
        return ``;
    }

    updateTable() {

        this.canvas.width = this.props.bounds.width;
        this.canvas.height = this.props.bounds.height;
        // Clear canvas
        this.ctx.clearRect(0, 0, this.props.bounds.width, this.props.bounds.height);

        // Set the global alpha for the canvas context
        this.ctx.globalAlpha = this.props.opacity; // Apply opacity

        // Draw background with rounded corners using the new background property
        this.ctx.fillStyle = this.props.colour.background;
        this.ctx.beginPath();
        this.ctx.moveTo(this.props.corners, 0);
        this.ctx.arcTo(this.props.bounds.width, 0, this.props.bounds.width, this.props.bounds.height, this.props.corners);
        this.ctx.arcTo(this.props.bounds.width, this.props.bounds.height, 0, this.props.bounds.height, this.props.corners);
        this.ctx.arcTo(0, this.props.bounds.height, 0, 0, this.props.corners);
        this.ctx.arcTo(0, 0, this.props.bounds.width, 0, this.props.corners);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw waveform - First, handle the fill
        if (this.props.fill === 1) {
            this.ctx.strokeStyle = this.props.colour.fill; // Set fill color for vertical lines
            this.ctx.lineWidth = 2; // Line width for the filled waveform
            for (let i = 0; i < this.props.samples.length; i += Math.floor(this.props.samples.length / this.props.bounds.width)) {
                const x = CabbageUtils.map(i, 0, this.props.samples.length, 0, this.props.bounds.width);
                if (x > this.props.bounds.width) {
                    continue; // Skip drawing if x exceeds bounds
                }
                const y = CabbageUtils.map(this.props.samples[i], -1, 1, this.props.bounds.height, 0);

                this.ctx.beginPath();
                this.ctx.moveTo(x, this.props.bounds.height / 2); // Move to middle
                this.ctx.lineTo(x, y); // Draw to the sample point
                this.ctx.stroke(); // Apply stroke
            }
        }

        // Second phase: Draw outline (stroke)
        this.ctx.strokeStyle = this.props.colour.stroke.colour; // Set stroke color for outline
        this.ctx.lineWidth = this.props.colour.stroke.width; // Set stroke width for outline
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.props.bounds.height / 2); // Start at the middle of the canvas

        const sampleIncrement = Math.floor(this.props.samples.length / this.props.bounds.width);
        for (let i = 0; i < this.props.samples.length; i += sampleIncrement) {
            const x = CabbageUtils.map(i, 0, this.props.samples.length, 0, this.props.bounds.width);
            if (x > this.props.bounds.width) {
                continue; // Skip drawing if x exceeds bounds
            }
            const y = CabbageUtils.map(this.props.samples[i], -1, 1, this.props.bounds.height, 0);
            this.ctx.lineTo(x, y); // Draw line to the sample point for the outline
        }

        this.ctx.stroke(); // Apply stroke to complete the outline
        this.ctx.closePath(); // Close the path to finalize the outline


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
        this.ctx.font = `${fontSize}px ${this.props.font.family}`;
        this.ctx.fillStyle = this.props.font.colour;
        this.ctx.textAlign = textAlign;
        this.ctx.textBaseline = 'bottom';

        const textX = this.props.font.align === 'right' ? this.props.bounds.width - 10 : this.props.font.align === 'center' || this.props.font.align === 'centre' ? this.props.bounds.width / 2 : 10;
        const textY = this.props.bounds.height - 10;
        this.ctx.fillText(this.props.text, textX, textY);

        // Update DOM with the canvas
        const widgetElement = document.getElementById(this.props.channel);
        if (widgetElement) {
            widgetElement.style.left = '0px';
            widgetElement.style.top = '0px';
            widgetElement.style.padding = '0';
            widgetElement.style.margin = '0';
            widgetElement.innerHTML = ''; // Clear existing content
            widgetElement.appendChild(this.canvas); // Append canvas

            // Add event listeners
            this.addEventListeners(widgetElement);
        } else {
            console.log(`Element: ${this.props.channel} not found.`);
        }
    }
}
