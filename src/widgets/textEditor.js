import { CabbageUtils } from "../utils.js";

/**
 * CsoundOutput class
 */
export class TextEditor {
    constructor() {
        this.props = {
            "bounds": {
                "top": 0,
                "left": 0,
                "width": 200,
                "height": 300
            },
            "type": "textEditor",
            "colour": "#dddddd",
            "channel": "texteditor",
            "fontColour": "#222222",
            "font": {
                "family": "Verdana",
                "size": 14,
                "align": "left"
            },
            "corners": 4,
            "visible": 1,
            "text": "",
            "automatable": 0
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

        const fontSize = this.props.font.size > 0 ? this.props.font.size : Math.max(this.props.bounds.height * 0.8, 12); // Ensuring font size doesn't get too small
        const alignMap = {
            'left': 'start',
            'center': 'center',
            'centre': 'center',
            'right': 'end',
        };
        const textAlign = alignMap[this.props.font.align] || 'start';

        return `
                <textarea style="width: 100%; height: 100%; background-color: ${this.props.colour}; 
                color: ${this.props.fontColour}; font-family: ${this.props.font.family}; font-size: ${fontSize}px; 
                text-align: ${textAlign}; padding: 10px; box-sizing: border-box; border: none; resize: none; position:absolute">
${this.props.text}
                </textarea>
        `;
    }
}
