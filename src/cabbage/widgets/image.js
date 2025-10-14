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
                { "id": "", "event": "mouseClickLeft" },
                { "id": "", "event": "mouseDragX" },
                { "id": "", "event": "mouseDragY" },
                { "id": "", "event": "mousePressLeft" },
                { "id": "", "event": "mouseReleaseLeft" }
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
            "max": 1
        };

        this.vscode = null;
    }



    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    }

    pointerDown(evt) {
        // Left press
        const pressCh = CabbageUtils.getChannelByEvent(this.props, 'mousePressLeft', 'click');
        if (pressCh && this.props.automatable === 1) {
            const msg = { paramIdx: this.parameterIndex, channel: pressCh.id, value: 1, channelType: "number" };
            Cabbage.sendParameterUpdate(msg, this.vscode);
        }
        // Click shorthand
        const clickCh = CabbageUtils.getChannelByEvent(this.props, 'mouseClickLeft', 'click');
        if (clickCh && this.props.automatable === 1) {
            const msg = { paramIdx: this.parameterIndex, channel: clickCh.id, value: 1, channelType: "number" };
            Cabbage.sendParameterUpdate(msg, this.vscode);
            const msgOff = { paramIdx: this.parameterIndex, channel: clickCh.id, value: 0, channelType: "number" };
            Cabbage.sendParameterUpdate(msgOff, this.vscode);
        }
        // Add move/up handlers for release
        const onUp = () => {
            const relCh = CabbageUtils.getChannelByEvent(this.props, 'mouseReleaseLeft', 'click');
            if (relCh && this.props.automatable === 1) {
                const msg = { paramIdx: this.parameterIndex, channel: relCh.id, value: 0, channelType: "number" };
                Cabbage.sendParameterUpdate(msg, this.vscode);
            }
            window.removeEventListener('pointerup', onUp);
            window.removeEventListener('pointermove', onMove);
        };
        const onMove = (e) => {
            const dragX = CabbageUtils.getChannelByEvent(this.props, 'mouseDragX', 'drag');
            const dragY = CabbageUtils.getChannelByEvent(this.props, 'mouseDragY', 'drag');
            if (!dragX && !dragY) return;
            const rect = evt.currentTarget.getBoundingClientRect();
            const nx = (e.clientX - rect.left) / rect.width;
            const ny = (e.clientY - rect.top) / rect.height;
            if (dragX && this.props.automatable === 1) {
                const msgX = { paramIdx: this.parameterIndex, channel: dragX.id, value: Math.max(0, Math.min(1, nx)), channelType: "number" };
                Cabbage.sendParameterUpdate(msgX, this.vscode);
            }
            if (dragY && this.props.automatable === 1) {
                const msgY = { paramIdx: this.parameterIndex, channel: dragY.id, value: Math.max(0, Math.min(1, ny)), channelType: "number" };
                Cabbage.sendParameterUpdate(msgY, this.vscode);
            }
        };
        window.addEventListener('pointerup', onUp);
        window.addEventListener('pointermove', onMove);
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