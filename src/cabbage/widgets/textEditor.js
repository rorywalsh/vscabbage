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
            "channel": "texteditor",
            "visible": true,
            "automatable": false,
            "type": "textEditor",

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "fill": "#0295cf"
            },

            "label": {
                "fontFamily": "Verdana",
                "fontSize": 14,
                "color": "#222222",
                "textAlign": "left"
            },

            "text": ""
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
        const fontSize = this.props.label.fontSize === "auto" ? Math.max(this.props.bounds.height * 0.8, 12) : this.props.label.fontSize;
        const alignMap = {
            'left': 'start',
            'center': 'center',
            'centre': 'center',
            'right': 'end',
        };
        const textAlign = alignMap[this.props.label.textAlign] || 'start';

        return `
                <textarea style="width: 100%; height: 100%; background-color: ${this.props.style.fill}; 
                color: ${this.props.label.color}; font-family: ${this.props.label.fontFamily}; font-size: ${fontSize}px; 
                text-align: ${textAlign}; padding: 10px; box-sizing: border-box; border: none; resize: none; position:absolute; opacity: ${this.props.style.opacity}; display: ${this.props.visible === false || this.props.visible === 0 ? 'none' : 'block'};">
${this.props.text}
                </textarea>
        `;
    }
}
