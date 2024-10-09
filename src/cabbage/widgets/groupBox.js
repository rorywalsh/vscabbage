/**
 * GroupBox class
 */
export class GroupBox {
    constructor() {
        this.props = {
            "bounds": {
                "top": 0,
                "left": 0,
                "width": 100,
                "height": 30
            },
            "type": "groupBox",
            "text": "Hello",
            "font": {
                "family": "Verdana",
                "size": 0,
                "align": "centre"
            },
            "fontColour": "#dddddd",
            "colour": "#888888",
            "channel": "groupbox",
            "stroke": {
                "colour": "#000000",
                "width": 1
            },
            "corners": 4,
            "visible": 1,
            "automatable": 0
        };

        this.children = {};
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
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

        const outlineOffset = this.props.stroke.width / 2;
        const textSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.3;
        const yOffset = textSize / 2; // vertical offset for text
        const padding = 5; // padding around text to leave a gap in the line
        const textWidth = (this.props.text.length * textSize) / 2; // approximate width of text

        const alignMap = {
            'left': 'start',
            'center': 'middle',
            'centre': 'middle',
            'right': 'end',
        };

        const svgAlign = alignMap[this.props.font.align] || 'middle'; // Default to 'middle' if font.alignment is not set or invalid

        // Calculate text position based on font.alignment
        let textXPosition;
        let gapStart;
        let gapEnd;

        if (svgAlign === 'start') {
            textXPosition = outlineOffset + padding; // Left-font.aligned, with padding
            gapStart = textXPosition - padding;
            gapEnd = textXPosition + textWidth + padding;
        } else if (svgAlign === 'end') {
            textXPosition = this.props.bounds.width - outlineOffset - padding; // Right-font.aligned, with padding
            gapStart = textXPosition - textWidth - padding;
            gapEnd = textXPosition + padding;
        } else {
            textXPosition = this.props.bounds.width / 2; // Center-font.aligned
            gapStart = (this.props.bounds.width / 2) - textWidth / 2 - padding;
            gapEnd = (this.props.bounds.width / 2) + textWidth / 2 + padding;
        }

        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" 
                 width="100%" height="100%" preserveAspectRatio="none"
                 style="position: absolute; top: 0; left: 0;">
                <!-- Transparent rectangle as the background -->
                <rect width="${this.props.bounds.width - this.props.stroke.width}" height="${this.props.bounds.height - this.props.stroke.width}" 
                      x="${outlineOffset}" y="${outlineOffset}" rx="${this.props.corners}" ry="${this.props.corners}" fill="transparent"></rect>
                
                <!-- Top border lines with gap adjusted for text alignment -->
                <line x1="0" y1="${outlineOffset + yOffset}" x2="${gapStart}" y2="${outlineOffset + yOffset}" 
                      stroke="${this.props.stroke.colour}" stroke-width="${this.props.stroke.width}" />
                <line x1="${gapEnd}" y1="${outlineOffset + yOffset}" x2="${this.props.bounds.width}" y2="${outlineOffset + yOffset}" 
                      stroke="${this.props.stroke.colour}" stroke-width="${this.props.stroke.width}" />
                
                <!-- Text at the top with alignment support -->
                <text x="${textXPosition}" y="${textSize * 0.95}" text-anchor="${svgAlign}" 
                      font-family="${this.props.font.family}" font-size="${textSize}" fill="${this.props.fontColour}">
                    ${this.props.text}
                </text>
                
                <!-- Bottom border line -->
                <line x1="0" y1="${this.props.bounds.height - outlineOffset}" x2="${this.props.bounds.width}" y2="${this.props.bounds.height - outlineOffset}" 
                      stroke="${this.props.stroke.colour}" stroke-width="${this.props.stroke.width}" />
                
                <!-- Left and right border lines adjusted to start at yOffset -->
                <line x1="${outlineOffset}" y1="${yOffset}" x2="${outlineOffset}" y2="${this.props.bounds.height - outlineOffset}" 
                      stroke="${this.props.stroke.colour}" stroke-width="${this.props.stroke.width}" />
                <line x1="${this.props.bounds.width - outlineOffset}" y1="${yOffset}" x2="${this.props.bounds.width - outlineOffset}" y2="${this.props.bounds.height - outlineOffset}" 
                      stroke="${this.props.stroke.colour}" stroke-width="${this.props.stroke.width}" />
            </svg>
        `;
    }
}