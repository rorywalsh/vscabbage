/**
 * Label class
 */
export class Label {
    constructor() {
        this.props = {
            "bounds":{
            "top": 0,
            "left": 0,
            "width": 100,
            "height": 30
            },
            "type": "label",
            "colour": "#88888800",
            "channel": "label",
            "fontColour": "#dddddd",
            "fontFamily": "Verdana",
            "fontSize": 0,
            "corners": 4,
            "align": "centre",
            "visible": 1,
            "text": "Default Label",
            "automatable": 0
        }

        this.panelSections = {
            "Properties": ["type"],
            "Bounds": ["left", "top", "width", "height"],
            "Text": ["text", "fontColour", "fontSize", "fontFamily", "align"],
            "Colours": ["colour"]
        };
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
        
        const fontSize = this.props.fontSize > 0 ? this.props.fontSize : Math.max(this.props.bounds.height, 12); // Ensuring font size doesn't get too small
        const alignMap = {
            'left': 'end',
            'center': 'middle',
            'centre': 'middle',
            'right': 'start',
        };
        const svgAlign = alignMap[this.props.align] || 'middle';
    
        return `
            <div style="position: relative; width: 100%; height: 100%;">
                <!-- Background SVG with preserveAspectRatio="none" -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0;">
                    <rect width="${this.props.bounds.width}" height="${this.props.bounds.height}" x="0" y="0" rx="${this.props.corners}" ry="${this.props.corners}" fill="${this.props.colour}" 
                        pointer-events="all"></rect>
                </svg>
    
                <!-- Text SVG with proper alignment -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
                     style="position: absolute; top: 0; left: 0;">
                    <text x="${this.props.align === 'left' ? '10%' : this.props.align === 'right' ? '90%' : '50%'}" y="50%" font-family="${this.props.fontFamily}" font-size="${fontSize}"
                        fill="${this.props.fontColour}" text-anchor="${svgAlign}" dominant-baseline="middle" alignment-baseline="middle" 
                        style="pointer-events: none;">${this.props.text}</text>
                </svg>
            </div>
        `;
    }
    
    
    
}
