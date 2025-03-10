// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.
import { Cabbage } from "../cabbage.js";
import { CabbageUtils } from "../utils.js";
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
            "channel": "",
            "colour": {
                "fill": "#0295cf",
                "stroke": {
                    "colour": "#dddddd",
                    "width": 1
                }
            },
            "file": "",
            "corners": 4,
            "visible": 1,
            "automatable": 0,
            "value": 0,
            "min": 0,
            "svgText": "",
            "max": 1
        };

        this.children = {};
        this.vscode = null;
    }



    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    }

    pointerDown() {
        this.props.value = this.props.value === this.props.max ? this.props.min : this.props.max;
        const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: this.props.value, channelType: "number" };
        Cabbage.sendParameterUpdate(msg, this.vscode);
    }

    getInnerHTML() {
        if (this.props.visible === 0) {
            return '';
        }

        const outlineOffset = this.props.colour.stroke.width / 2;

        // Check if svgText is not empty and render it
        if (this.props.svgText) {
            return `
                <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: all; overflow: hidden;">
                    <div style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
                        ${this.props.svgText}
                    </div>
                </div>
            `;
        }

        const imagePath = CabbageUtils.getFullMediaPath(this.props.file, this.props.currentCsdFile || '');
        console.log(imagePath);
        if (imagePath) {
            console.log("Cabbage: setting file");
            return `
                <img src="${imagePath}" alt="Image" style="width: 100%; height: 100%; border-radius: ${this.props.corners}px; pointer-events: all;" />
            `;
        }

        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none"
                 style="position: absolute; top: 0; left: 0;">
                <rect width="${this.props.bounds.width - this.props.colour.stroke.width}" height="${this.props.bounds.height - this.props.colour.stroke.width}" x="${outlineOffset}" y="${outlineOffset}" rx="${this.props.corners}" ry="${this.props.corners}" fill="${this.props.colour.fill}" 
                      stroke="${this.props.colour.stroke.colour}" stroke-width="${this.props.colour.stroke.width}" pointer-events="all"></rect>
            </svg>
        `;
    }
}