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
                {
                    "id": "image",
                    "range": { "defaultValue": 0, "increment": 1, "max": 1, "min": 0, "skew": 1 },
                    "event": "valueChanged"
                }
            ],
            "value": 0,
            "zIndex": 0,
            "visible": true,
            "active": true,
            "automatable": false,
            "type": "image",

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "borderWidth": 1,
                "borderColor": "#dddddd",
                "backgroundColor": "#0295cf"
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
        const rotationDegrees = this.props.rotate.radians * (180 / Math.PI);
        const transformOriginX = this.props.rotate.x + this.props.bounds.left;
        const transformOriginY = this.props.rotate.y + this.props.bounds.top;
        const transformStyle = this.props.rotate.radians !== 0 ?
            `transform: rotate(${rotationDegrees}deg); transform-origin: ${transformOriginX}px ${transformOriginY}px;` : '';

        // Check if svgText is not empty and render it as proper SVG
        if (this.props.svgText) {
            // Extract viewBox and preserveAspectRatio from original SVG if present
            const viewBoxMatch = this.props.svgText.match(/viewBox=["']([^"']+)["']/);
            const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${this.props.bounds.width} ${this.props.bounds.height}`;

            const preserveAspectRatioMatch = this.props.svgText.match(/preserveAspectRatio=["']([^"']+)["']/);
            const preserveAspectRatio = preserveAspectRatioMatch ? preserveAspectRatioMatch[1] : 'xMidYMid meet';

            // Extract just the inner SVG content (paths, lines, etc) without the outer <svg> tags
            const innerSvgContent = this.props.svgText.replace(/<svg[^>]*>|<\/svg>/g, '');

            return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="100%" height="100%" preserveAspectRatio="${preserveAspectRatio}" opacity="${this.props.style.opacity}"
                 style="position: absolute; top: 0; left: 0; display: ${this.props.visible ? 'block' : 'none'}; ${transformStyle}">
                <g style="all: initial;">
                    ${innerSvgContent}
                </g>
            </svg>
        `;
        }

        // Only try to load image if file property is set
        if (this.props.file) {
            const imagePath = CabbageUtils.getFullMediaPath(this.props.file, this.props.currentCsdFile || '');
            if (imagePath) {
                return `
                <img src="${imagePath}" alt="Image" style="width: 100%; height: 100%; border-radius: ${this.props.style.borderRadius}px; opacity: ${this.props.style.opacity}; pointer-events: none; display: ${this.props.visible ? 'block' : 'none'}; ${transformStyle}" />
            `;
            }
        }

        // Default background rectangle
        const backgroundColor = this.props.style.backgroundColor;
        const pointerEvents = 'none';

        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.style.opacity}"
             style="position: absolute; top: 0; left: 0; display: ${this.props.visible ? 'block' : 'none'}; ${transformStyle}">
            <rect width="${this.props.bounds.width - this.props.style.borderWidth}" height="${this.props.bounds.height - this.props.style.borderWidth}" x="${outlineOffset}" y="${outlineOffset}" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" fill="${backgroundColor}" 
                  stroke="${this.props.style.borderColor}" stroke-width="${this.props.style.borderWidth}" pointer-events="${pointerEvents}"></rect>
        </svg>
    `;
    }
}