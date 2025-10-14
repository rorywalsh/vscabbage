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
            "channels": [
                { "id": "rangeX", "event": "mouseDragX" },
                { "id": "rangeY", "event": "mouseDragY" }
            ],
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
                "fill": "#323232",
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

        // Slingshot animation properties
        this.isRightDragging = false;
        this.slingshotStartX = 0;
        this.slingshotStartY = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        this.isAnimating = false;
        this.animationFrameId = null;
        this.trajectoryLine = null;
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

        // Handle slingshot release
        if (this.isRightDragging) {
            this.isRightDragging = false;
            this.removeTrajectoryLine();

            // Calculate velocity from drag distance (reverse direction for slingshot effect)
            const dragDistanceX = this.ballX - this.slingshotStartX;
            const dragDistanceY = this.ballY - this.slingshotStartY;
            const dragDistance = Math.sqrt(dragDistanceX * dragDistanceX + dragDistanceY * dragDistanceY);

            // Scale velocity by drag distance and reverse direction (slingshot pulls back)
            const speedMultiplier = 0.05; // Adjust this to control overall speed
            this.velocityX = -dragDistanceX * speedMultiplier;
            this.velocityY = -dragDistanceY * speedMultiplier;

            // Start animation if there's meaningful velocity
            if (Math.abs(this.velocityX) > 0.0001 || Math.abs(this.velocityY) > 0.0001) {
                this.startAnimation();
            }
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
        // Stop any ongoing animation on any click
        if (this.isAnimating) {
            this.stopAnimation();
            return; // Don't start a new drag, just stop animation
        }

        // Check if this is a right-click (button 2)
        if (evt.button === 2) {
            evt.preventDefault(); // Prevent context menu
            this.isRightDragging = true;
            this.slingshotStartX = this.ballX;
            this.slingshotStartY = this.ballY;

            // Capture pointer
            evt.target.setPointerCapture(evt.pointerId);
            this.activePointerId = evt.pointerId;

            window.addEventListener("pointermove", this.moveListener);
            window.addEventListener("pointerup", this.upListener);
            return;
        }

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
        if (!this.isMouseDown && !this.isRightDragging) return;

        const padDiv = document.getElementById(CabbageUtils.getChannelId(this.props));
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

        // Handle slingshot trajectory line
        if (this.isRightDragging) {
            this.updateTrajectoryLine();
        } else {
            this.sendParameterUpdates();
        }
    }

    updateBallPosition() {
        const padDiv = document.getElementById(CabbageUtils.getChannelId(this.props));
        if (!padDiv) return;

        const ball = padDiv.querySelector('.xypad-ball');
        const valueBoxX = padDiv.querySelector('.xypad-value-x');
        const valueBoxY = padDiv.querySelector('.xypad-value-y');
        const crosshairH = padDiv.querySelector('.xypad-crosshair-h');
        const crosshairV = padDiv.querySelector('.xypad-crosshair-v');

        // Define dimensions at method scope
        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        const strokeWidth = this.props.colour.stroke.width;
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const valueBoxHeight = (this.props.text.x && this.props.text.y) ? 25 : 0;
        const activeHeight = effectiveHeight - valueBoxHeight;

        const ballLeft = this.ballX * effectiveWidth;
        const ballTop = this.ballY * activeHeight;

        if (ball) {
            ball.style.left = ballLeft + 'px';
            ball.style.top = ballTop + 'px';
        }

        // Update crosshair positions and gradients to follow the ball
        if (crosshairH) {
            crosshairH.style.top = ballTop + 'px';
            // Update horizontal gradient to fade from ball position
            const ballXPercent = (ballLeft / effectiveWidth) * 100;
            const fadeSpread = 20; // How far the fade extends (in percentage)
            crosshairH.style.background = `linear-gradient(to right, 
                transparent 0%, 
                ${this.props.colour.ball.fill}40 ${Math.max(0, ballXPercent - fadeSpread)}%, 
                ${this.props.colour.ball.fill}B3 ${ballXPercent}%, 
                ${this.props.colour.ball.fill}40 ${Math.min(100, ballXPercent + fadeSpread)}%, 
                transparent 100%)`;
        }
        if (crosshairV) {
            crosshairV.style.left = ballLeft + 'px';
            // Update vertical gradient to fade from ball position
            const ballYPercent = (ballTop / activeHeight) * 100;
            const fadeSpread = 20; // How far the fade extends (in percentage)
            crosshairV.style.background = `linear-gradient(to bottom, 
                transparent 0%, 
                ${this.props.colour.ball.fill}40 ${Math.max(0, ballYPercent - fadeSpread)}%, 
                ${this.props.colour.ball.fill}B3 ${ballYPercent}%, 
                ${this.props.colour.ball.fill}40 ${Math.min(100, ballYPercent + fadeSpread)}%, 
                transparent 100%)`;
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
        const xCh = CabbageUtils.getChannelByEvent(this.props, 'mouseDragX', 'drag');
        if (xCh) {
            const msgX = {
                paramIdx: this.parameterIndex,
                channel: xCh.id,
                value: xToSend,
                channelType: "number"
            };
            console.log("XyPad sending X update:", msgX, "vscode:", this.vscode);
            if (this.props.automatable === 1) {
                Cabbage.sendParameterUpdate(msgX, this.vscode);
            }
        }

        // Send Y channel update
        const yCh = CabbageUtils.getChannelByEvent(this.props, 'mouseDragY', 'drag');
        if (yCh) {
            const msgY = {
                paramIdx: this.parameterIndex + 1,
                channel: yCh.id,
                value: yToSend,
                channelType: "number"
            };
            console.log("XyPad sending Y update:", msgY, "vscode:", this.vscode);
            if (this.props.automatable === 1) {
                Cabbage.sendParameterUpdate(msgY, this.vscode);
            }
        }
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
                    <!-- Static background crosshairs (centered, gray, fading) - DISABLED BY DEFAULT -->
                    <!-- Uncomment the following divs to enable static center crosshairs:
                    <div class="xypad-static-crosshair-h" style="
                        position: absolute;
                        left: 0;
                        top: 50%;
                        width: 100%;
                        height: 1px;
                        background: linear-gradient(to right, 
                            transparent 0%, 
                            rgba(128, 128, 128, 0.15) 20%, 
                            rgba(128, 128, 128, 0.3) 50%, 
                            rgba(128, 128, 128, 0.15) 80%, 
                            transparent 100%);
                        pointer-events: none;
                        transform: translateY(-50%);
                    "></div>
                    <div class="xypad-static-crosshair-v" style="
                        position: absolute;
                        left: 50%;
                        top: 0;
                        width: 1px;
                        height: 100%;
                        background: linear-gradient(to bottom, 
                            transparent 0%, 
                            rgba(128, 128, 128, 0.15) 20%, 
                            rgba(128, 128, 128, 0.3) 50%, 
                            rgba(128, 128, 128, 0.15) 80%, 
                            transparent 100%);
                        pointer-events: none;
                        transform: translateX(-50%);
                    "></div>
                    -->
                    
                    <!-- Dynamic crosshairs (follow ball) -->
                    <!-- Horizontal crosshair -->
                    <div class="xypad-crosshair-h" style="
                        position: absolute;
                        left: 0;
                        top: ${ballTop}px;
                        width: 100%;
                        height: 2px;
                        background: linear-gradient(to right, 
                            transparent 0%, 
                            ${this.props.colour.ball.fill}40 20%, 
                            ${this.props.colour.ball.fill}B3 50%, 
                            ${this.props.colour.ball.fill}40 80%, 
                            transparent 100%);
                        pointer-events: none;
                        transform: translateY(-50%);
                    "></div>
                    <!-- Vertical crosshair -->
                    <div class="xypad-crosshair-v" style="
                        position: absolute;
                        left: ${ballLeft}px;
                        top: 0;
                        width: 2px;
                        height: 100%;
                        background: linear-gradient(to bottom, 
                            transparent 0%, 
                            ${this.props.colour.ball.fill}40 20%, 
                            ${this.props.colour.ball.fill}B3 50%, 
                            ${this.props.colour.ball.fill}40 80%, 
                            transparent 100%);
                        pointer-events: none;
                        transform: translateX(-50%);
                    "></div>
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
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));

        // Prevent context menu on right-click
        widgetDiv.addEventListener("contextmenu", (evt) => {
            evt.preventDefault();
            return false;
        });
    }

    updateTrajectoryLine() {
        const padDiv = document.getElementById(CabbageUtils.getChannelId(this.props));
        if (!padDiv) return;

        const padArea = padDiv.querySelector('div[style*="cursor: crosshair"]');
        if (!padArea) return;

        // Remove old line if exists
        this.removeTrajectoryLine();

        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        const strokeWidth = this.props.colour.stroke.width;
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const valueBoxHeight = (this.props.text.x && this.props.text.y) ? 25 : 0;
        const activeHeight = effectiveHeight - valueBoxHeight;

        // Calculate pixel positions
        const startX = this.slingshotStartX * effectiveWidth;
        const startY = this.slingshotStartY * activeHeight;
        const endX = this.ballX * effectiveWidth;
        const endY = this.ballY * activeHeight;

        // Create SVG line for trajectory
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('style', 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5;');

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', startX);
        line.setAttribute('y1', startY);
        line.setAttribute('x2', endX);
        line.setAttribute('y2', endY);
        line.setAttribute('stroke', this.props.colour.ball.fill);
        line.setAttribute('stroke-width', '2');
        line.setAttribute('stroke-dasharray', '5,5');

        svg.appendChild(line);
        padArea.appendChild(svg);
        this.trajectoryLine = svg;
    }

    removeTrajectoryLine() {
        if (this.trajectoryLine && this.trajectoryLine.parentNode) {
            this.trajectoryLine.parentNode.removeChild(this.trajectoryLine);
            this.trajectoryLine = null;
        }
    }

    startAnimation() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        const animate = () => {
            if (!this.isAnimating) return;

            const padWidth = this.props.bounds.width;
            const padHeight = this.props.bounds.height;
            const strokeWidth = this.props.colour.stroke.width;
            const effectiveWidth = padWidth - (2 * strokeWidth);
            const effectiveHeight = padHeight - (2 * strokeWidth);
            const valueBoxHeight = (this.props.text.x && this.props.text.y) ? 25 : 0;
            const activeHeight = effectiveHeight - valueBoxHeight;
            const ballRadius = this.props.ballSize / 2;

            // Calculate boundaries accounting for ball radius
            const maxXRange = 1 - (ballRadius / effectiveWidth);
            const maxYRange = 1 - (ballRadius / activeHeight);
            const minXRange = ballRadius / effectiveWidth;
            const minYRange = ballRadius / activeHeight;

            // Update ball position
            this.ballX += this.velocityX;
            this.ballY += this.velocityY;

            // Bounce off boundaries
            if (this.ballX <= minXRange) {
                this.ballX = minXRange;
                this.velocityX = Math.abs(this.velocityX); // Reverse and make positive
            } else if (this.ballX >= maxXRange) {
                this.ballX = maxXRange;
                this.velocityX = -Math.abs(this.velocityX); // Reverse and make negative
            }

            if (this.ballY <= minYRange) {
                this.ballY = minYRange;
                this.velocityY = Math.abs(this.velocityY); // Reverse and make positive
            } else if (this.ballY >= maxYRange) {
                this.ballY = maxYRange;
                this.velocityY = -Math.abs(this.velocityY); // Reverse and make negative
            }

            this.updateBallPosition();
            this.sendParameterUpdates();

            this.animationFrameId = requestAnimationFrame(animate);
        };

        this.animationFrameId = requestAnimationFrame(animate);
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.velocityX = 0;
        this.velocityY = 0;
    }
}
