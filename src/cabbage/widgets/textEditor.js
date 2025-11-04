// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

/**
 * TextEditor class
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
            "channels": [
                { "id": "comboBox", "event": "valueChanged" }
            ],

            "visible": true,
            "automatable": false,
            "type": "textEditor",

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "fill": "#0295cf",
                "fontFamily": "Verdana",
                "fontSize": 14,
                "fontColor": "#222222",
                "textAlign": "left"
            },
            "label": {
                "text": ""
            },


        };
        this.vscode = null;
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
    }

    addEventListeners(widgetDiv) {
        // Add any necessary event listeners here
    }

    getInnerHTML() {
        const fontSize = this.props.style.fontSize === "auto" ? Math.max(this.props.bounds.height * 0.8, 12) : this.props.style.fontSize;
        const alignMap = {
            'left': 'start',
            'center': 'center',
            'centre': 'center',
            'right': 'end',
        };
        const textAlign = alignMap[this.props.style.textAlign] || 'start';

        return `
    <textarea style="width: 100%; height: 100%; background-color: ${this.props.style.fill}; 
    color: ${this.props.style.fontColor}; font-family: ${this.props.style.fontFamily}; font-size: ${fontSize}px; 
    text-align: ${textAlign}; padding: 10px; box-sizing: border-box; border: none; resize: none; position:absolute; opacity: ${this.props.style.opacity}; display: ${this.props.visible ? 'block' : 'none'};">
${this.props.label.text}
        </textarea>
    `;
    }
}
