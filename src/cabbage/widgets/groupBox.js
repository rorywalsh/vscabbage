// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

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
            "corners": 4,
            "font": {
                "family": "Verdana",
                "size": 0,
                "align": "centre",
                "colour": "#dddddd"
            },
            "colour": {
                "fill": "#888888",
                "stroke": {
                    "colour": "#dddddd",
                    "width": 1
                }
            },
            "channel": "groupbox",
            "corners": 4,
            "visible": 1,
            "automatable": 0,
            "opacity": 1
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
        console.log("Cabbage: Label clicked!");
    }

    getInnerHTML() {
        if (this.props.visible === 0) {
            return '';
        }

        const width = Number(this.props.bounds.width) || 200;
        const height = Number(this.props.bounds.height) || 150;
        const outlineOffset = this.props.colour.stroke.width / 2;
        const textSize = this.props.font.size > 0 ? this.props.font.size : 16;
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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" 
                 width="${width}" height="${height}"  preserveAspectRatio="none">
                <!-- Transparent rectangle as the background -->
                <rect width="${this.props.bounds.width - this.props.colour.stroke.width}" height="${this.props.bounds.height - this.props.colour.stroke.width}" 
                      x="${outlineOffset}" y="${outlineOffset}" rx="${this.props.corners}" ry="${this.props.corners}" fill="transparent"></rect>
                
                <!-- Top border lines with gap adjusted for text alignment -->
                <line x1="0" y1="${outlineOffset + yOffset}" x2="${gapStart}" y2="${outlineOffset + yOffset}" 
                      stroke="${this.props.colour.stroke.colour}" stroke-width="${this.props.colour.stroke.width}" />
                <line x1="${gapEnd}" y1="${outlineOffset + yOffset}" x2="${this.props.bounds.width}" y2="${outlineOffset + yOffset}" 
                      stroke="${this.props.colour.stroke.colour}" stroke-width="${this.props.colour.stroke.width}" />
                
                <!-- Text at the top with alignment support -->
                <text x="${textXPosition}" y="${textSize * 0.95}" text-anchor="${svgAlign}" 
                      font-family="${this.props.font.family}" font-size="${textSize}" fill="${this.props.font.colour}">
                    ${this.props.text}
                </text>
                
                <!-- Bottom border line -->
                <line x1="0" y1="${this.props.bounds.height - outlineOffset}" x2="${this.props.bounds.width}" y2="${this.props.bounds.height - outlineOffset}" 
                      stroke="${this.props.colour.stroke.colour}" stroke-width="${this.props.colour.stroke.width}" />
                
                <!-- Left and right border lines adjusted to start at yOffset -->
                <line x1="${outlineOffset}" y1="${yOffset}" x2="${outlineOffset}" y2="${this.props.bounds.height - outlineOffset}" 
                      stroke="${this.props.colour.stroke.colour}" stroke-width="${this.props.colour.stroke.width}" />
                <line x1="${this.props.bounds.width - outlineOffset}" y1="${yOffset}" x2="${this.props.bounds.width - outlineOffset}" y2="${this.props.bounds.height - outlineOffset}" 
                      stroke="${this.props.colour.stroke.colour}" stroke-width="${this.props.colour.stroke.width}" />
            </svg>
        `;
    }
}