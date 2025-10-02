// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { Cabbage } from "../cabbage.js";
import { CabbageUtils, CabbageColours } from "../utils.js";

/**
 * Horizontal Range Slider class
 */
export class XyPad {
    constructor() {
        this.props = {
            "bounds": {
                "top": 10,
                "left": 10,
                "width": 60,
                "height": 60
            },
            "channel": {
                "id": "xyPad_1",
                "x": "rangeX",
                "y": "rangeY"
            },
            "range": {
                "x": {
                    "min": 0,
                    "max": 1,
                    "defaultValue": 0.5,
                    "skew": 1,
                    "increment": 0.001
                },
                "y": {
                    "min": 0,
                    "max": 1,
                    "defaultValue": 0.5,
                    "skew": 1,
                    "increment": 0.001
                }
            },
            "value": null,
            "text": {
                "x": "X",
                "y": "Y"
            },
            "font": {
                "family": "Verdana",
                "size": 0,
                "align": "centre",
                "colour": "#dddddd"
            },
            "colour": {
                "fill": "#0295cf",
                "stroke": {
                    "colour": "#525252",
                    "width": 1
                },
                "ball": {
                    "fill": "#93d200",
                    "width": 2
                }
            },

            "type": "xyPad",
            "decimalPlaces": 1,
            "velocity": 0,
            "visible": 1,
            "popup": 1,
            "automatable": 1,
            "valuePrefix": "",
            "valuePostfix": "",
            "presetIgnore": 0
        };

        this.parameterIndex = 0;
        this.moveListener = this.pointerMove.bind(this);
        this.upListener = this.pointerUp.bind(this);
        this.vscode = null;
        this.isMouseDown = false;
        this.decimalPlaces = 0;
        this.ballX = 0.5; // Normalized position [0,1]
        this.ballY = 0.5; // Normalized position [0,1]
    }

    pointerUp(evt) {
        const popup = document.getElementById('popupValue');
        if (popup) {
            popup.classList.add('hide');
            popup.classList.remove('show');
        }

        // Release pointer capture
        if (this.activePointerId !== undefined && evt.target) {
            try {
                evt.target.releasePointerCapture(this.activePointerId);
            } catch (e) {
                // Ignore errors if pointer was already released
            }
            this.activePointerId = undefined;
        }

        window.removeEventListener("pointermove", this.moveListener);
        window.removeEventListener("pointerup", this.upListener);
        this.isMouseDown = false;
    }

    pointerDown(evt) {
        this.isMouseDown = true;
        
        // Capture pointer to ensure we receive pointerup even if pointer leaves element
        evt.target.setPointerCapture(evt.pointerId);
        this.activePointerId = evt.pointerId;

        // Calculate ball position from click
        const rect = evt.currentTarget.getBoundingClientRect();
        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        const ballRadius = Math.min(padWidth, padHeight) * 0.05; // Ball is 5% of smallest dimension
        
        // Account for value boxes if present
        const valueBoxHeight = (this.props.text.x && this.props.text.y) ? 25 : 0;
        const activeHeight = padHeight - valueBoxHeight;
        
        const x = evt.offsetX;
        const y = evt.offsetY;
        
        // Normalize and clamp to valid area
        this.ballX = Math.max(0, Math.min(1, x / padWidth));
        this.ballY = Math.max(0, Math.min(1, y / activeHeight));
        
        this.updateBallPosition();
        this.sendParameterUpdates();

        window.addEventListener("pointermove", this.moveListener);
        window.addEventListener("pointerup", this.upListener);
    }

    pointerMove(evt) {
        if (!this.isMouseDown) return;

        const channelId = typeof this.props.channel === 'object' 
            ? (this.props.channel.id || this.props.channel.x) 
            : this.props.channel;
        const padDiv = document.getElementById(channelId);
        if (!padDiv) return;

        const rect = padDiv.getBoundingClientRect();
        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        
        // Account for value boxes if present
        const valueBoxHeight = (this.props.text.x && this.props.text.y) ? 25 : 0;
        const activeHeight = padHeight - valueBoxHeight;
        
        const x = evt.clientX - rect.left;
        const y = evt.clientY - rect.top;
        
        // Normalize and clamp
        this.ballX = Math.max(0, Math.min(1, x / padWidth));
        this.ballY = Math.max(0, Math.min(1, y / activeHeight));
        
        this.updateBallPosition();
        this.sendParameterUpdates();
    }

    updateBallPosition() {
        const channelId = typeof this.props.channel === 'object' 
            ? (this.props.channel.id || this.props.channel.x) 
            : this.props.channel;
        const padDiv = document.getElementById(channelId);
        if (!padDiv) return;

        const ball = padDiv.querySelector('.xypad-ball');
        const valueBoxX = padDiv.querySelector('.xypad-value-x');
        const valueBoxY = padDiv.querySelector('.xypad-value-y');
        
        if (ball) {
            const padWidth = this.props.bounds.width;
            const padHeight = this.props.bounds.height;
            const valueBoxHeight = (this.props.text.x && this.props.text.y) ? 25 : 0;
            const activeHeight = padHeight - valueBoxHeight;
            
            ball.style.left = (this.ballX * padWidth) + 'px';
            ball.style.top = (this.ballY * activeHeight) + 'px';
        }
        
        // Update value displays
        if (valueBoxX) {
            const xValue = this.props.range.x.min + this.ballX * (this.props.range.x.max - this.props.range.x.min);
            valueBoxX.textContent = this.props.valuePrefix + xValue.toFixed(this.props.decimalPlaces) + this.props.valuePostfix;
        }
        if (valueBoxY) {
            const yValue = this.props.range.y.min + (1 - this.ballY) * (this.props.range.y.max - this.props.range.y.min);
            valueBoxY.textContent = this.props.valuePrefix + yValue.toFixed(this.props.decimalPlaces) + this.props.valuePostfix;
        }
    }

    sendParameterUpdates() {
        // Calculate actual values from normalized positions using separate ranges
        const xValue = this.props.range.x.min + this.ballX * (this.props.range.x.max - this.props.range.x.min);
        const yValue = this.props.range.y.min + (1 - this.ballY) * (this.props.range.y.max - this.props.range.y.min); // Invert Y
        
        // Apply skew if needed
        const xNormalized = (xValue - this.props.range.x.min) / (this.props.range.x.max - this.props.range.x.min);
        const yNormalized = (yValue - this.props.range.y.min) / (this.props.range.y.max - this.props.range.y.min);
        
        const xToSend = Math.pow(xNormalized, 1.0 / this.props.range.x.skew);
        const yToSend = Math.pow(yNormalized, 1.0 / this.props.range.y.skew);
        
        // Send X channel update
        const msgX = {
            paramIdx: this.parameterIndex,
            channel: this.props.channel.x,
            value: xToSend,
            channelType: "number"
        };
        Cabbage.sendParameterUpdate(msgX, this.vscode);
        
        // Send Y channel update
        const msgY = {
            paramIdx: this.parameterIndex + 1,
            channel: this.props.channel.y,
            value: yToSend,
            channelType: "number"
        };
        Cabbage.sendParameterUpdate(msgY, this.vscode);
    }

    getInnerHTML() {
        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        const hasValueBoxes = this.props.text.x && this.props.text.y;
        const valueBoxHeight = hasValueBoxes ? 25 : 0;
        const activeHeight = padHeight - valueBoxHeight;
        
        const ballRadius = Math.min(padWidth, padHeight) * 0.05;
        const ballSize = ballRadius * 2;
        
        // Initialize ball position if needed
        if (this.props.value && this.props.value.x !== undefined && this.props.value.y !== undefined) {
            this.ballX = (this.props.value.x - this.props.range.x.min) / (this.props.range.x.max - this.props.range.x.min);
            this.ballY = 1 - ((this.props.value.y - this.props.range.y.min) / (this.props.range.y.max - this.props.range.y.min));
        }
        
        const ballLeft = this.ballX * padWidth;
        const ballTop = this.ballY * activeHeight;
        
        const xValue = this.props.range.x.min + this.ballX * (this.props.range.x.max - this.props.range.x.min);
        const yValue = this.props.range.y.min + (1 - this.ballY) * (this.props.range.y.max - this.props.range.y.min);
        
        let html = `
            <div style="width: ${padWidth}px; height: ${activeHeight}px; 
                        background-color: ${this.props.colour.fill}; 
                        border: ${this.props.colour.stroke.width}px solid ${this.props.colour.stroke.colour};
                        position: relative; cursor: crosshair;">
                <div class="xypad-ball" style="
                    position: absolute;
                    width: ${ballSize}px;
                    height: ${ballSize}px;
                    border-radius: 50%;
                    background-color: ${this.props.colour.ball.fill};
                    border: ${this.props.colour.ball.width}px solid ${this.props.colour.stroke.colour};
                    left: ${ballLeft}px;
                    top: ${ballTop}px;
                    transform: translate(-50%, -50%);
                    pointer-events: none;
                    z-index: 10;
                "></div>
            </div>`;
        
        if (hasValueBoxes) {
            html += `
                <div style="display: flex; justify-content: space-between; 
                            width: ${padWidth}px; height: ${valueBoxHeight}px;
                            font-family: ${this.props.font.family}; 
                            font-size: ${this.props.font.size || 12}px;
                            color: ${this.props.font.colour};
                            align-items: center;">
                    <div style="flex: 1; text-align: center;">
                        <div>${this.props.text.x}</div>
                        <div class="xypad-value-x" style="font-weight: bold;">
                            ${this.props.valuePrefix}${xValue.toFixed(this.props.decimalPlaces)}${this.props.valuePostfix}
                        </div>
                    </div>
                    <div style="flex: 1; text-align: center;">
                        <div>${this.props.text.y}</div>
                        <div class="xypad-value-y" style="font-weight: bold;">
                            ${this.props.valuePrefix}${yValue.toFixed(this.props.decimalPlaces)}${this.props.valuePostfix}
                        </div>
                    </div>
                </div>`;
        }
        
        return html;
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        console.log("XyPad.addVsCodeEventListeners called for div:", widgetDiv.id);
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        console.log("XyPad.addEventListeners called for div:", widgetDiv.id);
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        console.log("XyPad: pointerdown listener attached to", widgetDiv.id);
    }
}
