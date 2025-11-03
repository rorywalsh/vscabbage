// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.
import { Cabbage } from "../cabbage.js";
import { CabbageUtils } from "../utils.js";
/**
 * Label class
 */
export class Label {
    constructor() {
        this.props = {
            "bounds": {
                "top": 0,
                "left": 0,
                "width": 100,
                "height": 30
            },
            "channels": [{ "id": "label", "event": "valueChanged" }],
            "index": 0,
            "visible": true,
            "automatable": false,
            "opacity": 1,
            "type": "label",

            "shape": {
                "borderRadius": 4,
                "fill": "#00000000"
            },

            "label": {
                "text": "Default Label",
                "fontFamily": "Verdana",
                "fontSize": "auto",
                "color": "#4444443",
                "textAlign": "center"
            }
        };
        this.vscode = null;
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", (evt) => {
            CabbageUtils.handleMouseDown(evt, this.props, this.parameterIndex, this.vscode, this.props.automatable);
        });
    }

    getInnerHTML() {
        const fontSize = this.props.label.fontSize === "auto" || this.props.label.fontSize === 0 
            ? Math.max(this.props.bounds.height, 12) 
            : this.props.label.fontSize; // Ensuring font size doesn't get too small
        
        const alignMap = {
            'left': 'end',
            'center': 'middle',
            'centre': 'middle',
            'right': 'start',
        };
        const svgAlign = alignMap[this.props.label.textAlign] || 'middle';

        return `
            <div style="position: relative; width: 100%; height: 100%; opacity: ${this.props.opacity}; display: ${this.props.visible === false || this.props.visible === 0 ? 'none' : 'block'};">
                <!-- Background SVG with preserveAspectRatio="none" -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0;">
                    <rect width="${this.props.bounds.width}" height="${this.props.bounds.height}" x="0" y="0" rx="${this.props.shape.borderRadius}" ry="${this.props.shape.borderRadius}" fill="${this.props.shape.fill}" 
                        pointer-events="all"></rect>
                </svg>
    
                <!-- Text SVG with proper alignment -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
                     style="position: absolute; top: 0; left: 0;">
                    <text x="${this.props.label.textAlign === 'left' ? '10%' : this.props.label.textAlign === 'right' ? '90%' : '50%'}" y="50%" font-family="${this.props.label.fontFamily}" font-size="${fontSize}"
                        fill="${this.props.label.color}" text-anchor="${svgAlign}" dominant-baseline="middle" alignment-baseline="middle" 
                        style="pointer-events: none;">${this.props.label.text}</text>
                </svg>
            </div>
        `;
    }
}
