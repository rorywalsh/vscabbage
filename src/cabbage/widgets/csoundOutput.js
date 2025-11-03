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
            "bounds": {
                "top": 0,
                "left": 0,
                "width": 200,
                "height": 300
            },
            "channels": [
                { "id": "checkbox", "event": "valueChanged" }
            ],
            "visible": true,
            "automatable": false,
            "opacity": 1,
            "type": "csoundOutput",

            "shape": {
                "borderRadius": 4,
                "borderWidth": 1,
                "borderColor": "#dddddd",
                "fill": "#0295cf"
            },

            "label": {
                "fontFamily": "Verdana",
                "fontSize": 14,
                "color": "#dddddd",
                "textAlign": "left"
            },

            "id": "",
            "text": "Csound Output"
        };

    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
    }

    addEventListeners(widgetDiv) {
        // Add any necessary event listeners here
    }

    getInnerHTML() {
        const fontSize = this.props.label.fontSize === "auto" ? Math.max(this.props.height * 0.8, 12) : this.props.label.fontSize;
        const alignMap = {
            'left': 'start',
            'center': 'center',
            'centre': 'center',
            'right': 'end',
        };
        const textAlign = alignMap[this.props.label.textAlign] || 'start';

        return `
                <textarea readonly style="width: 100%; height: 100%; background-color: ${this.props.shape.fill}; 
                color: ${this.props.label.color}; font-family: ${this.props.label.fontFamily}; font-size: ${fontSize}px; 
                text-align: ${textAlign}; padding: 10px; box-sizing: border-box; border: none; resize: none; opacity: ${this.props.opacity}; display: ${this.props.visible === false || this.props.visible === 0 ? 'none' : 'block'};">
${this.props.text}
                </textarea>
        `;
    }

    appendText(newText) {
        this.props.text += newText + '\n';
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
