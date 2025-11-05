// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils } from "../utils.js";

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
            "channels": [
                { "id": "groupbox", "event": "valueChanged" }
            ],
            "index": 0,
            "visible": true,
            "active": true,
            "automatable": false,
            "type": "groupBox",

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "borderWidth": 1,
                "borderColor": "#dddddd",
                "fill": "#888888",
                "fontFamily": "Verdana",
                "fontSize": "auto",
                "fontColor": "#dddddd",
                "textAlign": "center"
            },

            "label": {
                "text": "Hello"
            }
        };
        // Wrap props with reactive proxy to unify visible/active handling
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.widgetDiv = widgetDiv;
        this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    }

    pointerDown() {
        console.log("Cabbage: Label clicked!");
    }

    getInnerHTML() {
        const width = Number(this.props.bounds.width) || 200;
        const height = Number(this.props.bounds.height) || 150;

        const strokeColour = this.props.style.borderColor;
        const strokeWidth = this.props.style.borderWidth;

        const outlineOffset = strokeWidth / 2;
        const textSize = this.props.style.fontSize === "auto" || this.props.style.fontSize === 0 ? 16 : this.props.style.fontSize;
        const yOffset = textSize / 2; // vertical offset for text
        const padding = 5; // padding around text to leave a gap in the line
        const textWidth = (this.props.label.text.length * textSize) / 2; // approximate width of text

        const alignMap = {
            'left': 'start',
            'center': 'middle',
            'centre': 'middle',
            'right': 'end',
        };

        const svgAlign = this.props.style.textAlign || 'middle'; // Default to 'middle' if textAlign is not set or invalid

        // Calculate text position based on textAlign
        let textXPosition;
        let gapStart;
        let gapEnd;

        if (svgAlign === 'start') {
            textXPosition = outlineOffset + padding; // Left-aligned, with padding
            gapStart = textXPosition - padding;
            gapEnd = textXPosition + textWidth + padding;
        } else if (svgAlign === 'end') {
            textXPosition = this.props.bounds.width - outlineOffset - padding; // Right-aligned, with padding
            gapStart = textXPosition - textWidth - padding;
            gapEnd = textXPosition + padding;
        } else {
            textXPosition = this.props.bounds.width / 2; // Center-aligned
            gapStart = (this.props.bounds.width / 2) - textWidth / 2 - padding;
            gapEnd = (this.props.bounds.width / 2) + textWidth / 2 + padding;
        }

        // For containers with children, make background transparent so children are visible
        const hasChildren = this.props.children && Array.isArray(this.props.children) && this.props.children.length > 0;
        const fillColor = hasChildren ? 'transparent' : this.props.style.fill;

        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" 
                 width="${width}" height="${height}" preserveAspectRatio="none" opacity="${this.props.style.opacity}" style="display: ${this.props.visible ? 'block' : 'none'};">
                <defs>
                    <!-- Mask to create transparent area behind text -->
                    <mask id="textMask_${this.props.channels[0].id}">
                        <!-- White rectangle covers everything (visible) -->
                        <rect x="0" y="0" width="${this.props.bounds.width}" height="${this.props.bounds.height}" fill="white"/>
                        <!-- Black rectangle behind text creates transparent area with rounded corners and extra padding -->
                        <rect x="${gapStart}" y="${yOffset - textSize / 2}" width="${gapEnd - gapStart}" height="${textSize + padding}" 
                              rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" fill="black"/>
                    </mask>
                </defs>
                
                <!-- Background rectangle with fill color - fills to top border, with text cutout and padding -->
                <rect width="${this.props.bounds.width - (strokeWidth * 2)}" height="${this.props.bounds.height - (yOffset + strokeWidth)}" 
                      x="${strokeWidth}" y="${yOffset + strokeWidth}" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" 
                      fill="${fillColor}" mask="url(#textMask_${this.props.channels[0].id})"></rect>
                
                <!-- Rounded rectangle border outline with gap for text -->
                <rect width="${this.props.bounds.width - strokeWidth}" height="${this.props.bounds.height - (yOffset + strokeWidth / 2)}" 
                      x="${strokeWidth / 2}" y="${yOffset + strokeWidth / 2}" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" 
                      fill="none" stroke="${strokeColour}" stroke-width="${strokeWidth}" 
                      mask="url(#textMask_${this.props.channels[0].id})"/>
                
                <!-- Text at the top with alignment support -->
                    <text x="${textXPosition}" y="${textSize * 0.95}" text-anchor="${svgAlign}" 
                          font-family="${this.props.style.fontFamily}" font-size="${textSize}" fill="${this.props.style.fontColor}">
                    ${this.props.label.text}
                </text>
            </svg>
        `;
    }
}