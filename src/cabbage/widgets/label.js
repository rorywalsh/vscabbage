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
            "channels": [{
                "id": "label",
                "range": { "defaultValue": 0, "increment": 1, "max": 1, "min": 0, "skew": 1 },
                "event": "valueChanged"
            }],
            "index": 0,
            "visible": true,
            "active": true,
            "automatable": false,
            "type": "label",

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "backgroundColor": "#00000000",
                "fontFamily": "Verdana",
                "fontSize": "auto",
                "fontColor": "#444444",
                "textAlign": "center"
            },
            "label": {
                "text": "Default Label"
            },
        };
        this.vscode = null;
        // Wrap props with reactive proxy to unify visible/active handling
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.widgetDiv = widgetDiv;
        // Disable pointer events when active is false
        this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", (evt) => {
            CabbageUtils.handleMouseDown(evt, this.props, this.parameterIndex, this.vscode, this.props.automatable);
        });
    }

    getInnerHTML() {
        const fontSize = this.props.style.fontSize === "auto" || this.props.style.fontSize === 0
            ? Math.max(this.props.bounds.height, 12)
            : this.props.style.fontSize; // Ensuring font size doesn't get too small

        const alignMap = {
            'left': 'end',
            'center': 'middle',
            'centre': 'middle',
            'right': 'start',
        };
        const svgAlign = alignMap[this.props.style.textAlign] || 'middle';

        return `
            <div style="position: relative; width: 100%; height: 100%; opacity: ${this.props.style.opacity}; display: ${this.props.visible ? 'block' : 'none'};">
                <!-- Background SVG with preserveAspectRatio="none" -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0;">
                    <rect width="${this.props.bounds.width}" height="${this.props.bounds.height}" x="0" y="0" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" fill="${this.props.style.backgroundColor}" 
                        pointer-events="all"></rect>
                </svg>
    
                <!-- Text SVG with proper alignment -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
                     style="position: absolute; top: 0; left: 0;">
                    <text x="${this.props.style.textAlign === 'left' ? '10%' : this.props.style.textAlign === 'right' ? '90%' : '50%'}" y="50%" font-family="${this.props.style.fontFamily}" font-size="${fontSize}"
                        fill="${this.props.style.fontColor}" text-anchor="${svgAlign}" dominant-baseline="middle" alignment-baseline="middle" 
                        style="pointer-events: none;">${this.props.label.text}</text>
                </svg>
            </div>
        `;
    }
}
