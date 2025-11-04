// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { Cabbage } from "../cabbage.js";
import { CabbageUtils, CabbageColours } from "../utils.js";
import { getCabbageMode } from "../sharedState.js";
/**
 * Label class
 */
export class Image {
    constructor() {
        this.props = {
            "bounds": {
                "top": 0,
                "left": 0,
                "width": 100,
                "height": 30
            },
            "channels": [
                { "id": "image", "event": "valueChanged" }
            ],
            "value": 0,
            "index": 0,
            "visible": true,
            "automatable": false,
            "type": "image",

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "borderWidth": 1,
                "borderColor": "#dddddd",
                "fill": "#0295cf"
            },

            "rotate": {
                "x": 0,
                "y": 0,
                "radians": 0
            },

            "file": "",
            "svgText": "",
            "currentCsdFile": "",
            "parameterIndex": -1,
            "children": []
        };

        this.vscode = null;
    }



    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        widgetDiv.addEventListener("pointermove", this.pointerMove.bind(this));
    }

    pointerMove(evt) {
        CabbageUtils.handleMouseMove(evt, this.props, this.parameterIndex, this.vscode, this.props.automatable);
    }

    pointerDown(evt) {
        CabbageUtils.handleMouseDown(evt, this.props, this.parameterIndex, this.vscode, this.props.automatable, (evt) => {
            // Add up handler for release
            const onUp = () => {
                CabbageUtils.handleMouseUp(evt, this.props, this.parameterIndex, this.vscode, this.props.automatable);
                window.removeEventListener('pointerup', onUp);
            };
            window.addEventListener('pointerup', onUp);
        });
    }

    getInnerHTML() {
        const outlineOffset = this.props.style.borderWidth / 2;

        // Calculate rotation transform if rotate values are set
        // Transform origin is relative to the widget's position within the form
        const rotationDegrees = this.props.rotate.radians * (180 / Math.PI);
        const transformOriginX = this.props.rotate.x + this.props.bounds.left;
        const transformOriginY = this.props.rotate.y + this.props.bounds.top;
        const transformStyle = this.props.rotate.radians !== 0 ?
            `transform: rotate(${rotationDegrees}deg); transform-origin: ${transformOriginX}px ${transformOriginY}px;` : '';

        // Check if svgText is not empty and render it
        if (this.props.svgText) {
            return `
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; opacity: ${this.props.style.opacity}; display: ${this.props.visible === false || this.props.visible === 0 ? 'none' : 'block'}; ${transformStyle}">
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                        ${this.props.svgText}
                    </div>
                </div>
            `;
        }

        // Only try to load image if file property is set
        if (this.props.file) {
            const imagePath = CabbageUtils.getFullMediaPath(this.props.file, this.props.currentCsdFile || '');
            console.log(imagePath);
            if (imagePath) {
                console.log("Cabbage: setting file");
                return `
                    <img src="${imagePath}" alt="Image" style="width: 100%; height: 100%; border-radius: ${this.props.style.borderRadius}px; opacity: ${this.props.style.opacity}; pointer-events: none; display: ${this.props.visible === false || this.props.visible === 0 ? 'none' : 'block'}; ${transformStyle}" />
                `;
            }
        }

        // Preserve the fill color regardless of whether there are children
        const fillColor = this.props.style.fill;
        const pointerEvents = 'none'; // Images should not capture pointer events to allow child widgets or underlying widgets to be interactive

        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.style.opacity}"
                 style="position: absolute; top: 0; left: 0; display: ${this.props.visible === false || this.props.visible === 0 ? 'none' : 'block'}; ${transformStyle}">
                <rect width="${this.props.bounds.width - this.props.style.borderWidth}" height="${this.props.bounds.height - this.props.style.borderWidth}" x="${outlineOffset}" y="${outlineOffset}" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" fill="${fillColor}" 
                      stroke="${this.props.style.borderColor}" stroke-width="${this.props.style.borderWidth}" pointer-events="${pointerEvents}"></rect>
            </svg>
        `;
    }
}