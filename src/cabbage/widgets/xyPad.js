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
            "visible": true,
            "active": true,
            "popup": true,
            "automatable": true,
            "presetIgnore": false,
            "type": "xyPad",
            "z-index": 0,

            "style": {
                "opacity": 1,
                "borderRadius": 5,
                "borderWidth": 1,
                "borderColor": "#525252",
                "backgroundColor": "#323232",
                "fontFamily": "Verdana",
                "fontSize": "auto",
                "fontColor": "#dddddd",
                "textAlign": "center"
            },


            "ball": {
                "size": 20,
                "backgroundColor": "#93d200",
                "borderWidth": 2
            },

            "label": {
                "textX": "X",
                "textY": "Y"
            },
            "decimalPlaces": 1,
            "velocity": 0,
            "valuePrefix": "",
            "valuePostfix": ""
        };

        this.parameterIndex = 0;
        this.moveListener = this.pointerMove.bind(this);
        this.upListener = this.pointerUp.bind(this);
        this.vscode = null;
        // Wrap props with reactive proxy to handle active/visible toggling and cleanup
        this.props = CabbageUtils.createReactiveProps(this, this.props);
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

        // Remove bound handlers if present
        if (this.boundPointerMove) window.removeEventListener("pointermove", this.boundPointerMove);
        if (this.boundPointerUp) window.removeEventListener("pointerup", this.boundPointerUp);
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

            // Use bound handlers so removeEventListener will work
            const moveHandler = this.boundPointerMove || this.moveListener;
            const upHandler = this.boundPointerUp || this.upListener;
            if (!this.boundPointerMove) this.boundPointerMove = moveHandler;
            if (!this.boundPointerUp) this.boundPointerUp = upHandler;
            window.addEventListener("pointermove", this.boundPointerMove);
            window.addEventListener("pointerup", this.boundPointerUp);
            return;
        }

        this.isMouseDown = true;


        // Calculate ball position from click
        const rect = evt.currentTarget.getBoundingClientRect();
        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        const strokeWidth = this.props.colour.stroke.width;

        // Calculate effective interactive area (accounting for padding/stroke)
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const ballRadius = this.props.ballSize / 2;        // Account for value boxes if present
        const valueBoxHeight = (this.props.label && this.props.label.textX && this.props.label.textY) ? 25 : 0;
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

        // Capture pointer to ensure we receive pointerup even if pointer leaves element
        evt.target.setPointerCapture(evt.pointerId);
        this.activePointerId = evt.pointerId;

        const moveHandler = this.boundPointerMove || this.moveListener;
        const upHandler = this.boundPointerUp || this.upListener;
        if (!this.boundPointerMove) this.boundPointerMove = moveHandler;
        if (!this.boundPointerUp) this.boundPointerUp = upHandler;
        window.addEventListener("pointermove", this.boundPointerMove);
        window.addEventListener("pointerup", this.boundPointerUp);
    }

    pointerMove(evt) {
        if (!this.isMouseDown && !this.isRightDragging) return;

        const padDiv = CabbageUtils.getWidgetDiv(this.props);
        if (!padDiv) return;

        const rect = padDiv.getBoundingClientRect();
        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        const strokeWidth = this.props.colour.stroke.width;

        // Calculate effective interactive area (accounting for padding/stroke)
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const ballRadius = this.props.ballSize / 2;        // Account for value boxes if present
        const valueBoxHeight = (this.props.label && this.props.label.textX && this.props.label.textY) ? 25 : 0;
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
        const padDiv = CabbageUtils.getWidgetDiv(this.props);
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
        const valueBoxHeight = (this.props.label && this.props.label.textX && this.props.label.textY) ? 25 : 0;
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
        const valueBoxHeight = (this.props.label && this.props.label.textX && this.props.label.textY) ? 25 : 0;
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
                paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0),
                channel: xCh.id,
                value: xToSend,
                channelType: "number"
            };
            console.log("XyPad sending X update:", msgX, "vscode:", this.vscode);

            Cabbage.sendChannelUpdate(msgX, this.vscode, this.props.automatable);

        }

        // Send Y channel update
        const yCh = CabbageUtils.getChannelByEvent(this.props, 'mouseDragY', 'drag');
        if (yCh) {
            const msgY = {
                paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 1),
                channel: yCh.id,
                value: yToSend,
                channelType: "number"
            };
            console.log("XyPad sending Y update:", msgY, "vscode:", this.vscode);
            if (this.props.automatable) {
                Cabbage.sendChannelUpdate(msgY, this.vscode, this.props.automatable);
            }
        }
    }

    getInnerHTML() {
        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        const strokeWidth = this.props.colour.stroke.width;
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const hasValueBoxes = (this.props.label && this.props.label.textX && this.props.label.textY) ? true : false;
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
        background-color: ${this.props.style.backgroundColor}; 
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
                            ${this.props.ball.backgroundColor}40 20%, 
                            ${this.props.ball.backgroundColor}B3 50%, 
                            ${this.props.ball.backgroundColor}40 80%, 
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
                            ${this.props.ball.backgroundColor}40 20%, 
                            ${this.props.ball.backgroundColor}B3 50%, 
                            ${this.props.ball.backgroundColor}40 80%, 
                            transparent 100%);
                        pointer-events: none;
                        transform: translateX(-50%);
                    "></div>
                    <div class="xypad-ball" style="
                        position: absolute;
                        width: ${ballSize}px;
                        height: ${ballSize}px;
                        border-radius: 50%;
                        background-color: ${this.props.ball.backgroundColor};
                        border: ${this.props.colour.ball.width}px solid ${this.props.colour.stroke.colour};
                        left: ${ballLeft}px;
                        top: ${ballTop}px;
                        transform: translate(-50%, -50%);
                        pointer-events: none;
                        z-index: 10;
                    "></div>
                </div>`;

        if (hasValueBoxes) {
            const labelX = (this.props.label && this.props.label.textX) ? this.props.label.textX : 'X';
            const labelY = (this.props.label && this.props.label.textY) ? this.props.label.textY : 'Y';
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
                        <span>${labelX}:</span>
                        <span class="xypad-value-x" style="font-weight: bold;">
                            ${this.props.valuePrefix}${xValue.toFixed(xDecimalPlaces)}${this.props.valuePostfix}
                        </span>
                    </div>
                    <div style="flex: 1; display: flex; align-items: center; justify-content: center; gap: 5px;">
                        <span>${labelY}:</span>
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
        // Save reference to the widget div so we can toggle pointer-events when `active` changes
        this.widgetDiv = widgetDiv;
        this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
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
        const padDiv = CabbageUtils.getWidgetDiv(this.props);
        if (!padDiv) return;

        const padArea = padDiv.querySelector('div[style*="cursor: crosshair"]');
        if (!padArea) return;

        // Remove old line if exists
        this.removeTrajectoryLine();

        const padWidth = this.props.bounds.width;
        const padHeight = this.props.bounds.height;
        const strokeWidth = this.props.style.borderWidth;
        const effectiveWidth = padWidth - (2 * strokeWidth);
        const effectiveHeight = padHeight - (2 * strokeWidth);
        const valueBoxHeight = (this.props.label && this.props.label.textX && this.props.label.textY) ? 25 : 0;
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
        line.setAttribute('stroke', this.props.ball.backgroundColor);
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
            const strokeWidth = this.props.style.borderWidth;
            const effectiveWidth = padWidth - (2 * strokeWidth);
            const effectiveHeight = padHeight - (2 * strokeWidth);
            const valueBoxHeight = (this.props.label && this.props.label.textX && this.props.label.textY) ? 25 : 0;
            const activeHeight = effectiveHeight - valueBoxHeight;
            const ballRadius = this.props.ball.size / 2;

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
