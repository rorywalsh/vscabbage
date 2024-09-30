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
            "type": "texteditor",
            "colour": "#dddddd",
            "channel": "texteditor",
            "fontColour": "#222222",
            "fontFamily": "Verdana",
            "fontSize": 14,
            "corners": 4,
            "align": "left",
            "visible": 1,
            "text": "",
            "automatable": 0
        };

        this.panelSections = {
            "Properties": ["type"],
            "Bounds": ["left", "top", "width", "height"],
            "Text": ["text", "fontColour", "fontSize", "fontFamily", "align"],
            "Colours": ["colour"]
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

        const fontSize = this.props.fontSize > 0 ? this.props.fontSize : Math.max(this.props.bounds.height * 0.8, 12); // Ensuring font size doesn't get too small
        const alignMap = {
            'left': 'start',
            'center': 'center',
            'centre': 'center',
            'right': 'end',
        };
        const textAlign = alignMap[this.props.align] || 'start';

        return `
                <textarea style="width: 100%; height: 100%; background-color: ${this.props.colour}; 
                color: ${this.props.fontColour}; font-family: ${this.props.fontFamily}; font-size: ${fontSize}px; 
                text-align: ${textAlign}; padding: 10px; box-sizing: border-box; border: none; resize: none; position:absolute">
${this.props.text}
                </textarea>
        `;
    }

    // appendText(newText) {
    //     this.props.text += newText + '\n';
    //     const widgetDiv = CabbageUtils.getWidgetDiv(this.props.channel);

    //     if (widgetDiv) {
    //         const textarea = widgetDiv.querySelector('textarea');
    //         if (textarea) {
    //             textarea.value += newText + '\n';
    //             console.log(textarea.value);
    //             textarea.scrollTop = textarea.scrollHeight; // Scroll to the bottom
    //         }
    //     }
    // }
}
