// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils } from "../utils.js";

/**
 * CsoundOutput class
 */
export class CsoundOutput {
    constructor() {
        this.props = {
            "id": "csoundOutput",
            "bounds": {
                "top": 0,
                "left": 0,
                "width": 200,
                "height": 300
            },
            "channels": [
                {
                    "id": "csoundOutput",
                    "event": "valueChanged",
                    "range": { "defaultValue": 0, "increment": 1, "max": 1, "min": 0, "skew": 1 }
                }
            ],
            "visible": true,
            "active": true,
            "automatable": false,
            "type": "csoundOutput",
            "z-index": 0,

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "borderWidth": 1,
                "borderColor": "#dddddd",
                "backgroundColor": "#0295cf",
                "fontFamily": "Verdana",
                "fontSize": 14,
                "fontColor": "#dddddd",
                "textAlign": "left"
            },
            "label": {
                "text": "Csound Output"
            },

            "id": "",

        };

        // Wrap props with reactive proxy to unify visible/active handling
        this.props = CabbageUtils.createReactiveProps(this, this.props);

    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.widgetDiv = widgetDiv;
        this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
    }

    addEventListeners(widgetDiv) {
        // Add any necessary event listeners here
    }

    getInnerHTML() {
        const fontSize = this.props.style.fontSize === "auto" ? Math.max(this.props.height * 0.8, 12) : this.props.style.fontSize;
        const alignMap = {
            'left': 'start',
            'center': 'center',
            'centre': 'center',
            'right': 'end',
        };
        const textAlign = alignMap[this.props.style.textAlign] || 'start';

        return `
    <textarea readonly style="width: 100%; height: 100%; background-color: ${this.props.style.backgroundColor}; 
    color: ${this.props.style.fontColor}; font-family: ${this.props.style.fontFamily}; font-size: ${fontSize}px; 
    text-align: ${textAlign}; padding: 10px; box-sizing: border-box; border: none; resize: none; opacity: ${this.props.style.opacity}; display: ${this.props.visible ? 'block' : 'none'};">
${this.props.label.text}
        </textarea>
    `;
    }

    appendText(newText) {
        this.props.label.text += newText + '\n';
        const widgetDiv = CabbageUtils.getWidgetDiv(this.props.channel);

        if (widgetDiv) {
            const textarea = widgetDiv.querySelector('textarea');
            if (textarea) {
                textarea.value += newText + '\n';
                console.log(textarea.value);
                textarea.scrollTop = textarea.scrollHeight; // Scroll to the bottom
            }
        }
    }
}
