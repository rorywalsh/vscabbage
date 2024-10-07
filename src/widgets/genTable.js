import { CabbageUtils } from "../utils.js";

/**
 * CsoundOutput class
 */
export class GenTable {
    constructor() {
        console.log("Creating GenTable widget");
        this.props = {
            "bounds": {
                "top": 0,
                "left": 0,
                "width": 200,
                "height": 100
            },
            "type": "genTable",
            "colour": "#888888",
            "stroke": {
                "colour": "#dddddd",
                "width": 1
            },
            "channel": "gentable",
            "backgroundColour": "#a8d388",
            "fontColour": "#dddddd",
            "font": {
                "family": "Verdana",
                "size": 0,
                "align": "left"
            },
            "startSample": -1,
            "endSample": -1,
            "file": "",
            "corners": 4,
            "visible": 1,
            "text": "",
            "tableNumber": 1,
            "samples": [],
            "automatable": 0
        };

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
        console.log("Canvas clicked!");
    }

    getInnerHTML() {
        return ``;
    }

    updateTable() {
        this.canvas.width = this.props.bounds.width;
        this.canvas.height = this.props.bounds.height;
        // Clear canvas
        this.ctx.clearRect(0, 0, this.props.bounds.width, this.props.bounds.height);

        // Draw background with rounded corners
        this.ctx.fillStyle = this.props.backgroundColour;
        this.ctx.beginPath();
        this.ctx.moveTo(this.props.corners, 0);
        this.ctx.arcTo(this.props.bounds.width, 0, this.props.bounds.width, this.props.bounds.height, this.props.corners);
        this.ctx.arcTo(this.props.bounds.width, this.props.bounds.height, 0, this.props.bounds.height, this.props.corners);
        this.ctx.arcTo(0, this.props.bounds.height, 0, 0, this.props.corners);
        this.ctx.arcTo(0, 0, this.props.bounds.width, 0, this.props.corners);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw waveform
        this.ctx.strokeStyle = this.props.stroke.colour;
        this.ctx.lineWidth = this.props.stroke.width;
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.props.bounds.height / 2);

        const sampleIncrement = Math.floor(this.props.samples.length / this.props.bounds.width);

        if (!Array.isArray(this.props.samples) || this.props.samples.length === 0) {
            console.warn('No samples to draw.');
        } else {
            for (let i = 0; i < this.props.samples.length; i += sampleIncrement) {
                const x = CabbageUtils.map(i, 0, this.props.samples.length, 0, this.props.bounds.width);
                const y = CabbageUtils.map(this.props.samples[i], -1, 1, this.props.bounds.height, 0);
                // Draw line to sample value
                this.ctx.strokeStyle = this.props.colour;
                this.ctx.beginPath();
                this.ctx.moveTo(x, this.props.bounds.height / 2);
                this.ctx.lineTo(x, y);
                this.ctx.stroke();

                // Draw vertical lines for outline
                if (i > 0) {
                    this.ctx.strokeStyle = this.props.stroke.colour;
                    this.ctx.lineWidth = this.props.stroke.width;
                    this.ctx.lineTo(x, y);
                }
            }
        }

        this.ctx.closePath();

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
        const svgAlign = alignMap[this.props.font.align] || 'start';
        const textAlign = canvasAlignMap[this.props.font.align] || 'left';
        this.ctx.font = `${fontSize}px ${this.props.font.family}`;
        this.ctx.fillStyle = this.props.fontColour;
        this.ctx.textAlign = textAlign;
        this.ctx.textBaseline = 'bottom';

        const textX = this.props.font.align === 'right' ? this.props.bounds.width - 10 : this.props.font.align === 'center' || this.props.font.align === 'centre' ? this.props.bounds.width / 2 : 10;
        const textY = this.props.bounds.height - 10;
        this.ctx.fillText(this.props.text, textX, textY);

        // Update DOM with the canvas
        const widgetElement = document.getElementById(this.props.channel);
        if (widgetElement) {
            widgetElement.style.transform = `translate(${this.props.bounds.left}px, ${this.props.bounds.top}px)`;
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