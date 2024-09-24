/**
 * Label class
 */
export class Image {
    constructor() {
        this.props = {
            "top": 0,
            "left": 0,
            "width": 100,
            "height": 30,
            "type": "image",
            "colour": "#888888",
            "channel": "",
            "outlineWidth": 1,
            "outlineColour": "#000000",
            "corners": 4,
            "visible": 1,
            "automatable": 0
        }

        this.panelSections = {
            "Properties": ["type"],
            "Bounds": ["left", "top", "width", "height"],
            "Colours": ["colour", "outlineColour"],
        };

        this.children = {};
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    }

    pointerDown() {
        console.log("Label clicked!");
    }

    getInnerHTML() {
        if (this.props.visible === 0) {
            return '';
        }

        const outlineOffset = this.props.outlineWidth / 2;

        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.width} ${this.props.height}" width="100%" height="100%" preserveAspectRatio="none"
                 style="position: absolute; top: 0; left: 0;">
                <rect width="${this.props.width - this.props.outlineWidth}" height="${this.props.height - this.props.outlineWidth}" x="${outlineOffset}" y="${outlineOffset}" rx="${this.props.corners}" ry="${this.props.corners}" fill="${this.props.colour}" 
                      stroke="${this.props.outlineColour}" stroke-width="${this.props.outlineWidth}" pointer-events="all"></rect>
            </svg>
        `;
    }
}
