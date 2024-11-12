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
            "type": "csoundOutput",
            "colour": {
                "fill": "#0295cf",
                "stroke": {
                    "colour": "#dddddd",
                    "width": 1
                }
            },
            "channel": "csoundoutput",
            "font": {
                "family": "Verdana",
                "size": 14,
                "align": "left",
                "colour": "#dddddd"
            },
            "corners": 4,
            "visible": 1,
            "text": "Csound Output",
            "automatable": 0,
            "opacity": 1
        };

    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
    }

    addEventListeners(widgetDiv) {
        // Add any necessary event listeners here
    }

    getInnerHTML() {
        if (this.props.visible === 0) {
            return '';
        }

        const fontSize = this.props.font.size > 0 ? this.props.font.size : Math.max(this.props.height * 0.8, 12);
        const alignMap = {
            'left': 'start',
            'center': 'center',
            'centre': 'center',
            'right': 'end',
        };
        const textAlign = alignMap[this.props.font.align] || 'start';

        return `
                <textarea readonly style="width: 100%; height: 100%; background-color: ${this.props.colour.fill}; 
                color: ${this.props.font.colour}; font-family: ${this.props.font.family}; font-size: ${fontSize}px; 
                text-align: ${textAlign}; padding: 10px; box-sizing: border-box; border: none; resize: none; opacity: ${this.props.opacity};">
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
