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
                "backgroundColor": "#888888",
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
        const textSize = this.props.style.fontSize === "auto" || this.props.style.fontSize === 0 ? 11 : this.props.style.fontSize;
        const yOffset = textSize / 2; // vertical offset for text
        const padding = 4; // padding around text to leave a gap in the line

        // Use a more accurate text width estimation for SVG text
        const avgCharWidth = textSize * 0.6; // More accurate approximation for most fonts
        const textWidth = this.props.label.text.length * avgCharWidth;

        const alignMap = {
            'left': 'start',
            'center': 'middle',
            'centre': 'middle',
            'right': 'end',
        };

        const svgAlign = this.props.style.textAlign || 'middle'; // Default to 'middle' if textAlign is not set or invalid

        // Calculate text position based on textAlign
        let gapStart;
        let gapEnd;
        let textAlign = 'center';
        let textLeft = '50%';

        if (svgAlign === 'start') {
            gapStart = outlineOffset;
            gapEnd = outlineOffset + textWidth + (padding * 2);
            textAlign = 'left';
            textLeft = `${padding}px`;
        } else if (svgAlign === 'end') {
            gapStart = width - outlineOffset - textWidth - (padding * 2);
            gapEnd = width - outlineOffset;
            textAlign = 'right';
            textLeft = 'auto';
        } else {
            gapStart = (width / 2) - textWidth / 2 - padding;
            gapEnd = (width / 2) + textWidth / 2 + padding;
            textAlign = 'center';
            textLeft = '50%';
        }

        // For containers with children, make background transparent so children are visible
        const hasChildren = this.props.children && Array.isArray(this.props.children) && this.props.children.length > 0;
        const fillColor = hasChildren ? 'transparent' : this.props.style.backgroundColor;

        return `
            <div style="position: relative; width: ${width}px; height: ${height}px;">
                <div style="position: absolute; top: 0; left: ${textLeft}; transform: translateX(-50%); 
                            text-align: ${textAlign}; 
                            font-family: ${this.props.style.fontFamily}; 
                            font-size: ${textSize}px; 
                            color: ${this.props.style.fontColor};
                            line-height: ${textSize}px;
                            padding: 0 ${padding}px;
                            z-index: 1;">
                    ${this.props.label.text}
                </div>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" 
                     width="${width}" height="${height}" preserveAspectRatio="none" opacity="${this.props.style.opacity}" 
                     style="display: ${this.props.visible ? 'block' : 'none'}; position: absolute; top: 0; left: 0;">
                    <defs>
                        <!-- Mask to create transparent area behind text -->
                        <mask id="textMask_${this.props.channels[0].id}">
                            <!-- White rectangle covers everything (visible) -->
                            <rect x="0" y="0" width="${width}" height="${height}" fill="white"/>
                            <!-- Black rectangle behind text creates transparent area -->
                            <rect x="${gapStart}" y="0" width="${gapEnd - gapStart}" height="${textSize + padding}" 
                                  rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" fill="black"/>
                        </mask>
                    </defs>
                    
                    <!-- Background rectangle with fill color - fills to top border, with text cutout and padding -->
                    <rect width="${width - (strokeWidth * 2)}" height="${height - (yOffset + strokeWidth)}" 
                          x="${strokeWidth}" y="${yOffset + strokeWidth}" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" 
                          fill="${fillColor}" mask="url(#textMask_${this.props.channels[0].id})"></rect>
                    
                    <!-- Rounded rectangle border outline with gap for text -->
                    <rect width="${width - strokeWidth}" height="${height - (yOffset + strokeWidth / 2)}" 
                          x="${strokeWidth / 2}" y="${yOffset + strokeWidth / 2}" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" 
                          fill="none" stroke="${strokeColour}" stroke-width="${strokeWidth}" 
                          mask="url(#textMask_${this.props.channels[0].id})"/>
                </svg>
            </div>
        `;
    }
}