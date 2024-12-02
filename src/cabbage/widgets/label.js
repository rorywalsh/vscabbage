// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.
import { Cabbage } from "../cabbage.js";
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
            "type": "label",
            "colour": {
                "fill": "#00000000"
            },
            "channel": "label",
            "font": {
                "family": "Verdana",
                "size": 0,
                "align": "centre",
                "colour": "#4444443"
            },
            "corners": 4,
            "visible": 1,
            "text": "Default Label",
            "automatable": 0,
            "opacity": 1,
            "value": 0,
            "min": 0,
            "max": 1
        };
        this.vscode = null;
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    }

    pointerDown() {
        this.props.value = this.props.value === this.props.max ? this.props.min : this.props.max;
        const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: this.props.value, channelType: "number" };
        Cabbage.sendParameterUpdate(this.vscode, msg);
    }

    getInnerHTML() {
        if (this.props.visible === 0) {
            return '';
        }
        
        const fontSize = this.props.font.size > 0 ? this.props.font.size : Math.max(this.props.bounds.height, 12); // Ensuring font size doesn't get too small
        const alignMap = {
            'left': 'end',
            'center': 'middle',
            'centre': 'middle',
            'right': 'start',
        };
        const svgAlign = alignMap[this.props.font.align] || 'middle';
    
        return `
            <div style="position: relative; width: 100%; height: 100%; opacity: ${this.props.opacity};">
                <!-- Background SVG with preserveAspectRatio="none" -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0;">
                    <rect width="${this.props.bounds.width}" height="${this.props.bounds.height}" x="0" y="0" rx="${this.props.corners}" ry="${this.props.corners}" fill="${this.props.colour.fill}" 
                        pointer-events="all"></rect>
                </svg>
    
                <!-- Text SVG with proper alignment -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
                     style="position: absolute; top: 0; left: 0;">
                    <text x="${this.props.font.align === 'left' ? '10%' : this.props.font.align === 'right' ? '90%' : '50%'}" y="50%" font-family="${this.props.font.family}" font-size="${fontSize}"
                        fill="${this.props.font.colour}" text-anchor="${svgAlign}" dominant-baseline="middle" alignment-baseline="middle" 
                        style="pointer-events: none;">${this.props.text}</text>
                </svg>
            </div>
        `;
    }
}
