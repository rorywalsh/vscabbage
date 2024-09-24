/**
 * Label class
 */
export class GroupBox {
    constructor() {
        this.props = {
            "top": 0,
            "left": 0,
            "width": 100,
            "height": 30,
            "type": "groupbox",
            "text": "Hello", // Text displayed next to the slider
            "fontFamily": "Verdana", // Font family for the text
            "fontSize": 0, // Font size for the text
            "fontColour": "#dddddd",
            "align": "centre", // Text alignment within the slider (center, left, right)
            "colour": "#888888",
            "channel": "groupbox",
            "outlineWidth": 1,
            "outlineColour": "#000000",
            "corners": 4,
            "visible": 1,
            "automatable": 0
        }

        this.panelSections = {
            "Properties": ["type"],
            "Text": ["text", "fontSize", "fontFamily", "fontColour", "align"],
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
        const textSize = this.props.fontSize > 0 ? this.props.fontSize : this.props.height * 0.3;
        const yOffset = textSize / 2; // vertical offset for text
        const padding = 5; // padding around text to leave a gap in the line
        const textWidth = (this.props.text.length * textSize) / 2; // approximate width of text
    
        const alignMap = {
            'left': 'start',
            'center': 'middle',
            'centre': 'middle',
            'right': 'end',
        };
    
        const svgAlign = alignMap[this.props.align] || 'middle'; // Default to 'middle' if alignment is not set or invalid
    
        // Calculate text position based on alignment
        let textXPosition;
        let gapStart;
        let gapEnd;
    
        if (svgAlign === 'start') {
            textXPosition = outlineOffset + padding; // Left-aligned, with padding
            gapStart = textXPosition - padding;
            gapEnd = textXPosition + textWidth + padding;
        } else if (svgAlign === 'end') {
            textXPosition = this.props.width - outlineOffset - padding; // Right-aligned, with padding
            gapStart = textXPosition - textWidth - padding;
            gapEnd = textXPosition + padding;
        } else {
            textXPosition = this.props.width / 2; // Center-aligned
            gapStart = (this.props.width / 2) - textWidth / 2 - padding;
            gapEnd = (this.props.width / 2) + textWidth / 2 + padding;
        }
    
        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.width} ${this.props.height}" 
                 width="100%" height="100%" preserveAspectRatio="none"
                 style="position: absolute; top: 0; left: 0;">
                <!-- Transparent rectangle as the background -->
                <rect width="${this.props.width - this.props.outlineWidth}" height="${this.props.height - this.props.outlineWidth}" 
                      x="${outlineOffset}" y="${outlineOffset}" rx="${this.props.corners}" ry="${this.props.corners}" fill="transparent"></rect>
                
                <!-- Top border lines with gap adjusted for text alignment -->
                <line x1="0" y1="${outlineOffset + yOffset}" x2="${gapStart}" y2="${outlineOffset + yOffset}" 
                      stroke="${this.props.outlineColour}" stroke-width="${this.props.outlineWidth}" />
                <line x1="${gapEnd}" y1="${outlineOffset + yOffset}" x2="${this.props.width}" y2="${outlineOffset + yOffset}" 
                      stroke="${this.props.outlineColour}" stroke-width="${this.props.outlineWidth}" />
                
                <!-- Text at the top with alignment support -->
                <text x="${textXPosition}" y="${textSize * 0.95}" text-anchor="${svgAlign}" 
                      font-family="${this.props.fontFamily}" font-size="${textSize}" fill="${this.props.fontColour}">
                    ${this.props.text}
                </text>
                
                <!-- Bottom border line -->
                <line x1="0" y1="${this.props.height - outlineOffset}" x2="${this.props.width}" y2="${this.props.height - outlineOffset}" 
                      stroke="${this.props.outlineColour}" stroke-width="${this.props.outlineWidth}" />
                
                <!-- Left and right border lines adjusted to start at yOffset -->
                <line x1="${outlineOffset}" y1="${yOffset}" x2="${outlineOffset}" y2="${this.props.height - outlineOffset}" 
                      stroke="${this.props.outlineColour}" stroke-width="${this.props.outlineWidth}" />
                <line x1="${this.props.width - outlineOffset}" y1="${yOffset}" x2="${this.props.width - outlineOffset}" y2="${this.props.height - outlineOffset}" 
                      stroke="${this.props.outlineColour}" stroke-width="${this.props.outlineWidth}" />
            </svg>
        `;
    }
    
    
    
}
