// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE for details.

import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";
import { getCabbageMode } from "../sharedState.js";

export class NumberSlider {
    constructor() {
        this.props = {
            "bounds": {
                "top": 10,
                "left": 10,
                "width": 60,
                "height": 60
            },
            "channel": "numberSlider",
            "corners": 4,
            "range": {
                "min": 0,
                "max": 1,
                "defaultValue": 0,
                "skew": 1,
                "increment": 0.001
            },
            "value": null,
            "index": 0,
            "text": "",
            "font": {
                "family": "Verdana",
                "size": 0,
                "align": "centre",
                "colour": "#dddddd"
            },
            "textOffsetY": 0,
            "valueTextBox": 0,
            "colour": {
                "fill": "#0295cf"
            },
            "type": "numberSlider",
            "decimalPlaces": 1,
            "velocity": 0,
            "popup": 1,
            "visible": 1,
            "automatable": 1,
            "valuePrefix": "",
            "valuePostfix": "",
            "presetIgnore": 0,
            "opacity": 1,
            "sensitivity": 0.5
        };

        this.isDragging = false;
        this.startY = 0;
        this.startValue = 0;
        this.parameterIndex = 0;
        this.vscode = null;
        this.decimalPlaces = CabbageUtils.getDecimalPlaces(this.props.range.increment);

        this.props = new Proxy(this.props, {
            set: (target, key, value) => {
                const oldValue = target[key];
                // Track the path of the key being set, including the parent object
                const path = CabbageUtils.getPath(target, key);

                // Set the value as usual
                target[key] = value;

                // Log visibility changes
                if (key === 'visible') {
                    console.log(`NumberSlider: visible changed from ${oldValue} to ${value}`);
                    if (this.widgetDiv) {
                        this.widgetDiv.style.pointerEvents = value === 0 ? 'none' : 'auto';
                    }
                }                // Custom logic: trigger your onPropertyChange method with the path
                if (this.onPropertyChange) {
                    this.onPropertyChange(path, key, value, oldValue);  // Pass the full path and value
                }

                return true;
            }
        });
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        this.widgetDiv = widgetDiv;
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        widgetDiv.addEventListener("pointermove", this.pointerMove.bind(this));
        widgetDiv.addEventListener("pointerup", this.pointerUp.bind(this));
        widgetDiv.addEventListener("pointerleave", this.pointerUp.bind(this));
        widgetDiv.addEventListener("dblclick", this.doubleClick.bind(this)); // Add double-click event listener
    }

    pointerDown(event) {
        console.log(`NumberSlider pointerDown:`, {
            channel: this.props.channel,
            value: this.props.value,
            visible: this.props.visible,
            range: this.props.range,
            parameterIndex: this.parameterIndex
        });
        // Don't perform slider actions in edit mode (draggable mode)
        if (getCabbageMode() === 'draggable') {
            return;
        }

        this.isDragging = true;
        this.startY = event.clientY;
        this.startValue = this.props.value;
        // Validate startValue to prevent NaN
        if (isNaN(this.startValue) || this.startValue === null || this.startValue === undefined) {
            console.warn('Invalid startValue in numberSlider pointerDown, using default', this.startValue);
            this.startValue = this.props.range.defaultValue ?? 0;
        }
        event.target.setPointerCapture(event.pointerId);
    }

    pointerMove(event) {
        const inputBox = document.querySelector(`#slider-${this.props.channel} input`);
        if (inputBox) {
            return;
        }

        // Don't perform slider actions in edit mode (draggable mode)
        if (getCabbageMode() === 'draggable') {
            return;
        }

        if (this.isDragging) {
            // Validate range to prevent NaN calculations
            if (isNaN(this.props.range.min) || isNaN(this.props.range.max) || this.props.range.max <= this.props.range.min) {
                console.warn('Invalid range in numberSlider pointerMove, using default', this.props.range);
                this.props.range = { min: 0, max: 1, defaultValue: 0, skew: 1, increment: 0.001 };
            }

            const dy = event.clientY - this.startY;
            const steps = dy / (10 * this.props.sensitivity); // Number of steps to move based on drag distance

            // Convert the start value to linear space for movement calculation
            const startLinearValue = this.getLinearValue(this.startValue);
            const rangeSpan = this.props.range.max - this.props.range.min;
            const startLinearNormalized = (startLinearValue - this.props.range.min) / rangeSpan;

            // Apply movement in linear space
            const increment = this.props.range.increment;
            const normalizedIncrement = increment / rangeSpan;
            const newLinearNormalized = CabbageUtils.clamp(startLinearNormalized - steps * normalizedIncrement, 0, 1);

            // Convert back to actual linear value
            const newLinearValue = newLinearNormalized * rangeSpan + this.props.range.min;

            // Convert to skewed value for display
            const newSkewedValue = this.getSkewedValue(newLinearValue);

            // Apply increment snapping to the skewed value
            const oldValue = this.props.value;
            this.props.value = Math.round(newSkewedValue / increment) * increment;
            this.props.value = Math.min(this.props.range.max, Math.max(this.props.range.min, this.props.value));

            // Prevent NaN in value
            if (isNaN(this.props.value)) {
                console.error('NumberSlider value is NaN, setting to min');
                this.props.value = this.props.range.min;
            }

            // console.log(`NumberSlider pointerMove: startValue=${this.startValue}, newLinearValue=${newLinearValue}, newSkewedValue=${newSkewedValue}, final value=${this.props.value} (was ${oldValue})`);

            // Send value that will result in correct output after backend applies skew
            let targetNormalized;
            if (rangeSpan === 0) {
                targetNormalized = 0;
            } else {
                targetNormalized = (this.props.value - this.props.range.min) / rangeSpan;
            }
            targetNormalized = Math.max(0, Math.min(1, targetNormalized)); // Ensure within [0,1]
            const valueToSend = Math.pow(targetNormalized, 1.0 / this.props.range.skew);
            const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: valueToSend };
            Cabbage.sendParameterUpdate(msg, this.vscode);
            this.updateSliderValue();
        }
    }

    pointerUp(event) {
        this.isDragging = false;
        event.target.releasePointerCapture(event.pointerId);
    }

    doubleClick(event) {
        // Don't allow input editing in edit mode (draggable mode)
        if (getCabbageMode() === 'draggable') {
            return;
        }

        const sliderDiv = event.currentTarget;
        const input = document.createElement('input');
        input.type = 'text';
        input.value = this.props.value.toFixed(this.decimalPlaces);
        input.style.position = 'absolute';
        input.style.top = '50%';
        input.style.left = '50%';
        input.style.transform = 'translate(-50%, -50%)';
        input.style.width = '60%'; // Adjust the width as needed
        input.style.height = 'auto';
        input.style.fontSize = `${Math.max(this.props.bounds.height * 0.4, 12)}px`; // Adjust font size
        input.style.fontFamily = this.props.font.family;
        input.style.textAlign = 'center'; // Center align the text inside input
        input.style.boxSizing = 'border-box';

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const newValue = parseFloat(input.value);
                if (!isNaN(newValue) && newValue >= this.props.range.min && newValue <= this.props.range.max) {
                    this.props.value = newValue;
                    // Send value that will result in correct output after backend applies skew
                    const targetNormalized = (this.props.value - this.props.range.min) / (this.props.range.max - this.props.range.min);
                    const valueToSend = Math.pow(targetNormalized, 1.0 / this.props.range.skew);
                    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: valueToSend };
                    Cabbage.sendParameterUpdate(msg, this.vscode);
                    this.updateSliderValue();
                } else {
                    alert(`Please enter a value between ${this.props.range.min} and ${this.props.range.max}`);
                }
                sliderDiv.removeChild(input);
                sliderDiv.innerHTML = this.getInnerHTML();
            }
        });

        sliderDiv.innerHTML = '';
        sliderDiv.appendChild(input);
        input.focus();
        input.select(); // Auto-select the current text
    }

    updateSliderValue() {
        const valueText = `${this.props.valuePrefix}${this.props.value.toFixed(this.decimalPlaces)}${this.props.valuePostfix}`;
        const sliderText = document.getElementById(`slider-text-${this.props.channel}`);
        if (sliderText) {
            sliderText.textContent = valueText;
        }
    }

    getInnerHTML() {
        // console.log(`NumberSlider getInnerHTML: visible=${this.props.visible}, opacity=${this.props.opacity}`);
        const fontSize = this.props.font.size > 0 ? this.props.font.size : 12;
        const alignMap = {
            'left': 'flex-start',
            'center': 'center',
            'centre': 'center',
            'right': 'flex-end',
        };
        const flexAlign = alignMap[this.props.font.align] || 'center';
        const currentValue = this.props.value === null ? this.props.range.defaultValue : this.props.value;
        const valueText = `${this.props.valuePrefix}${currentValue.toFixed(this.decimalPlaces)}${this.props.valuePostfix}`;

        const html = `
            <div id="slider-${this.props.channel}" style="position: relative; width: ${this.props.bounds.width}px; height: ${this.props.bounds.height}px; user-select: none; opacity: ${this.props.visible === 0 ? '0' : '1'}; pointer-events: ${this.props.visible === 0 ? 'none' : 'auto'};">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0;">
                    <rect width="${this.props.bounds.width}" height="${this.props.bounds.height}" x="0" y="0" rx="${this.props.corners}" ry="${this.props.corners}" fill="${this.props.colour.fill}" 
                        pointer-events="${this.props.visible === 0 ? 'none' : 'all'}" opacity="${this.props.opacity}"></rect>
                </svg>
    
                <!-- Text using foreignObject for consistent rendering -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0; pointer-events: none;">
                    <foreignObject x="0" y="0" width="${this.props.bounds.width}" height="${this.props.bounds.height}">
                        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:${flexAlign}; font-size:${fontSize}px; font-family:${this.props.font.family}; color:${this.props.font.colour}; padding: 0 ${this.props.bounds.width * 0.1}px;">
                            ${valueText}
                        </div>
                    </foreignObject>
                </svg>
            </div>
        `;
        return html;
    }

    // Helper methods for skew functionality
    getSkewedValue(linearValue) {
        const rangeSpan = this.props.range.max - this.props.range.min;
        if (rangeSpan === 0) return this.props.range.min;
        const normalizedValue = (linearValue - this.props.range.min) / rangeSpan;
        // Invert the skew for JUCE-like behavior
        const skewedNormalizedValue = Math.pow(normalizedValue, 1 / this.props.range.skew);
        return skewedNormalizedValue * rangeSpan + this.props.range.min;
    }

    getLinearValue(skewedValue) {
        const rangeSpan = this.props.range.max - this.props.range.min;
        if (rangeSpan === 0) return this.props.range.min;
        const normalizedValue = (skewedValue - this.props.range.min) / rangeSpan;
        // Invert the skew for JUCE-like behavior
        const linearNormalizedValue = Math.pow(normalizedValue, this.props.range.skew);
        return linearNormalizedValue * rangeSpan + this.props.range.min;
    }
}