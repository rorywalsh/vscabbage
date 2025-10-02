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
            "ballSize": 20,
            "type": "xyPad",
            "corners": 5,
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

    /**
     * Calculate decimal places needed to display increment precision
     */
    getDecimalPlacesFromIncrement(increment) {
        if (increment >= 1) return 0;
        const decimalStr = increment.toString();
        const decimalIndex = decimalStr.indexOf('.');
        if (decimalIndex === -1) return 0;
        return decimalStr.length - decimalIndex - 1;
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
        const strokeWidth = this.props.colour.stroke.width;

        // Calculate effective interactive area (accounting for padding/stroke)
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const ballRadius = this.props.ballSize / 2;        // Account for value boxes if present
        const valueBoxHeight = (this.props.text.x && this.props.text.y) ? 25 : 0;
        const activeHeight = effectiveHeight - valueBoxHeight;

        const x = evt.offsetX - strokeWidth; // Adjust for padding
        const y = evt.offsetY - strokeWidth; // Adjust for padding

        // Normalize to effective pad coordinates, accounting for ball radius to keep ball within boundaries
        const normalizedX = x / effectiveWidth;
        const normalizedY = y / activeHeight;

        // Calculate the maximum range for ball center to keep ball circumference within boundaries
        const maxXRange = 1 - (ballRadius / effectiveWidth);
        const maxYRange = 1 - (ballRadius / activeHeight);
        const minXRange = ballRadius / effectiveWidth;
        const minYRange = ballRadius / activeHeight;

        // Constrain ball position so its circumference stays within pad boundaries
        this.ballX = Math.max(minXRange, Math.min(maxXRange, normalizedX));
        this.ballY = Math.max(minYRange, Math.min(maxYRange, normalizedY));

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
        const strokeWidth = this.props.colour.stroke.width;

        // Calculate effective interactive area (accounting for padding/stroke)
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const ballRadius = this.props.ballSize / 2;        // Account for value boxes if present
        const valueBoxHeight = (this.props.text.x && this.props.text.y) ? 25 : 0;
        const activeHeight = effectiveHeight - valueBoxHeight;

        const x = evt.clientX - rect.left - strokeWidth; // Adjust for padding
        const y = evt.clientY - rect.top - strokeWidth; // Adjust for padding

        // Normalize to effective pad coordinates
        const normalizedX = x / effectiveWidth;
        const normalizedY = y / activeHeight;

        // Calculate the maximum range for ball center to keep ball circumference within boundaries
        const maxXRange = 1 - (ballRadius / effectiveWidth);
        const maxYRange = 1 - (ballRadius / activeHeight);
        const minXRange = ballRadius / effectiveWidth;
        const minYRange = ballRadius / activeHeight;

        // Constrain ball position so its circumference stays within pad boundaries
        this.ballX = Math.max(minXRange, Math.min(maxXRange, normalizedX));
        this.ballY = Math.max(minYRange, Math.min(maxYRange, normalizedY));

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

        // Define dimensions at method scope
        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        const strokeWidth = this.props.colour.stroke.width;
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const valueBoxHeight = (this.props.text.x && this.props.text.y) ? 25 : 0;
        const activeHeight = effectiveHeight - valueBoxHeight;

        if (ball) {
            ball.style.left = (this.ballX * effectiveWidth) + 'px';
            ball.style.top = (this.ballY * activeHeight) + 'px';
        }

        // Update value displays
        if (valueBoxX || valueBoxY) {
            const ballRadius = this.props.ballSize / 2;
            const maxXRange = 1 - (ballRadius / effectiveWidth);
            const maxYRange = 1 - (ballRadius / activeHeight);
            const minXRange = ballRadius / effectiveWidth;
            const minYRange = ballRadius / activeHeight;

            // Map constrained ball position back to full parameter range
            const normalizedX = (this.ballX - minXRange) / (maxXRange - minXRange);
            const normalizedY = (this.ballY - minYRange) / (maxYRange - minYRange);

            if (valueBoxX) {
                const xValue = this.props.range.x.min + normalizedX * (this.props.range.x.max - this.props.range.x.min);
                const xDecimalPlaces = this.getDecimalPlacesFromIncrement(this.props.range.x.increment);
                valueBoxX.textContent = this.props.valuePrefix + xValue.toFixed(xDecimalPlaces) + this.props.valuePostfix;
            }
            if (valueBoxY) {
                const yValue = this.props.range.y.min + (1 - normalizedY) * (this.props.range.y.max - this.props.range.y.min);
                const yDecimalPlaces = this.getDecimalPlacesFromIncrement(this.props.range.y.increment);
                valueBoxY.textContent = this.props.valuePrefix + yValue.toFixed(yDecimalPlaces) + this.props.valuePostfix;
            }
        }
    }

    sendParameterUpdates() {
        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        const strokeWidth = this.props.colour.stroke.width;
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const valueBoxHeight = (this.props.text.x && this.props.text.y) ? 25 : 0;
        const activeHeight = effectiveHeight - valueBoxHeight;
        const ballRadius = this.props.ballSize / 2;

        // Calculate the constrained range for the ball center
        const maxXRange = 1 - (ballRadius / effectiveWidth);
        const maxYRange = 1 - (ballRadius / activeHeight);
        const minXRange = ballRadius / effectiveWidth;
        const minYRange = ballRadius / activeHeight;

        // Map constrained ball position back to full parameter range
        const normalizedX = (this.ballX - minXRange) / (maxXRange - minXRange);
        const normalizedY = (this.ballY - minYRange) / (maxYRange - minYRange);

        // Calculate actual values from full normalized positions using separate ranges
        const xValue = this.props.range.x.min + normalizedX * (this.props.range.x.max - this.props.range.x.min);
        const yValue = this.props.range.y.min + (1 - normalizedY) * (this.props.range.y.max - this.props.range.y.min); // Invert Y

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
        const strokeWidth = this.props.colour.stroke.width;
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const hasValueBoxes = this.props.text.x && this.props.text.y;
        const valueBoxHeight = hasValueBoxes ? 25 : 0;
        const activeHeight = effectiveHeight - valueBoxHeight;
        const innerCornerRadius = Math.max(0, this.props.corners - strokeWidth);
        const padCornerStyle = hasValueBoxes
            ? `border-top-left-radius: ${innerCornerRadius}px; border-top-right-radius: ${innerCornerRadius}px;`
            : `border-radius: ${innerCornerRadius}px;`;

        const ballRadius = this.props.ballSize / 2;
        const ballSize = this.props.ballSize;

        // Initialize ball position if needed
        if (this.props.value && this.props.value.x !== undefined && this.props.value.y !== undefined) {
            const normalizedX = (this.props.value.x - this.props.range.x.min) / (this.props.range.x.max - this.props.range.x.min);
            const normalizedY = 1 - ((this.props.value.y - this.props.range.y.min) / (this.props.range.y.max - this.props.range.y.min));

            // Calculate the maximum range for ball center to keep ball circumference within boundaries
            const maxXRange = 1 - (ballRadius / effectiveWidth);
            const maxYRange = 1 - (ballRadius / activeHeight);
            const minXRange = ballRadius / effectiveWidth;
            const minYRange = ballRadius / activeHeight;

            // Constrain ball position so its circumference stays within pad boundaries
            this.ballX = Math.max(minXRange, Math.min(maxXRange, normalizedX));
            this.ballY = Math.max(minYRange, Math.min(maxYRange, normalizedY));
        }

        const ballLeft = this.ballX * effectiveWidth;
        const ballTop = this.ballY * activeHeight;

        // Calculate display values using the constrained range mapping
        const maxXRange = 1 - (ballRadius / effectiveWidth);
        const maxYRange = 1 - (ballRadius / activeHeight);
        const minXRange = ballRadius / effectiveWidth;
        const minYRange = ballRadius / activeHeight;

        const normalizedX = (this.ballX - minXRange) / (maxXRange - minXRange);
        const normalizedY = (this.ballY - minYRange) / (maxYRange - minYRange);

        const xValue = this.props.range.x.min + normalizedX * (this.props.range.x.max - this.props.range.x.min);
        const yValue = this.props.range.y.min + (1 - normalizedY) * (this.props.range.y.max - this.props.range.y.min);

        // Calculate decimal places based on increment values
        const xDecimalPlaces = this.getDecimalPlacesFromIncrement(this.props.range.x.increment);
        const yDecimalPlaces = this.getDecimalPlacesFromIncrement(this.props.range.y.increment);

        let html = `
        <div style="width: ${padWidth}px; height: ${padHeight}px; 
            background-color: ${this.props.colour.stroke.colour}; 
            padding: ${this.props.colour.stroke.width}px;
            border-radius: ${this.props.corners}px;
            box-sizing: border-box;
            overflow: hidden;">
        <div style="width: 100%; height: ${activeHeight}px; 
                background-color: ${this.props.colour.fill}; 
                position: relative; cursor: crosshair;
                ${padCornerStyle}">
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
                            width: 100%; height: ${valueBoxHeight}px;
                            font-family: ${this.props.font.family}; 
                            font-size: ${this.props.font.size || 12}px;
                            color: ${this.props.font.colour};
                            align-items: center;
                            padding: ${this.props.colour.stroke.width}px;
                            box-sizing: border-box;
                            border-bottom-left-radius: ${innerCornerRadius}px;
                            border-bottom-right-radius: ${innerCornerRadius}px;">
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <span>${this.props.text.x}:</span>
                        <span class="xypad-value-x" style="font-weight: bold;">
                            ${this.props.valuePrefix}${xValue.toFixed(xDecimalPlaces)}${this.props.valuePostfix}
                        </span>
                    </div>
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <span>${this.props.text.y}:</span>
                        <span class="xypad-value-y" style="font-weight: bold;">
                            ${this.props.valuePrefix}${yValue.toFixed(yDecimalPlaces)}${this.props.valuePostfix}
                        </span>
                    </div>
                </div>`;
        }

        html += `</div>`;
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
