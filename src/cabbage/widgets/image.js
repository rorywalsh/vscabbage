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
            "type": "image",
            "channels": [
                { "id": "image", "event": "valueChanged" }
            ],
            "colour": {
                "fill": "#0295cf",
                "stroke": {
                    "colour": "#dddddd",
                    "width": 1
                }
            },
            "rotate": {
                "x": 0,
                "y": 0,
                "radians": 0
            },
            "currentCsdFile": "",
            "parameterIndex": -1,
            "children": [
            ],
            "file": "",
            "corners": 4,
            "visible": 1,
            "automatable": 0,
            "value": 0,
            "min": 0,
            "svgText": "",
            "max": 1,
            "index": 0
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
        const outlineOffset = this.props.colour.stroke.width / 2;

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
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; overflow: hidden; display: ${this.props.visible === 0 ? 'none' : 'block'}; ${transformStyle}">
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
                    <img src="${imagePath}" alt="Image" style="width: 100%; height: 100%; border-radius: ${this.props.corners}px; pointer-events: none; display: ${this.props.visible === 0 ? 'none' : 'block'}; ${transformStyle}" />
                `;
            }
        }

        // For containers with children, make background transparent
        const hasChildren = this.props.children && this.props.children.length > 0;
        const fillColor = hasChildren ? 'transparent' : this.props.colour.fill;
        const pointerEvents = 'none'; // Images should not capture pointer events to allow child widgets or underlying widgets to be interactive

        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none"
                 style="position: absolute; top: 0; left: 0; display: ${this.props.visible === 0 ? 'none' : 'block'}; ${transformStyle}">
                <rect width="${this.props.bounds.width - this.props.colour.stroke.width}" height="${this.props.bounds.height - this.props.colour.stroke.width}" x="${outlineOffset}" y="${outlineOffset}" rx="${this.props.corners}" ry="${this.props.corners}" fill="${fillColor}" 
                      stroke="${this.props.colour.stroke.colour}" stroke-width="${this.props.colour.stroke.width}" pointer-events="${pointerEvents}"></rect>
            </svg>
        `;
    }
}