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
            "channels": [
                {
                    "id": "numberSlider",
                    "range": { "defaultValue": 0, "increment": 0.001, "max": 1, "min": 0, "skew": 1 },
                    "event": "valueChanged"
                }
            ],
            "value": null,
            "zIndex": 0,
            "visible": true,
            "active": true,
            "automatable": true,
            "presetIgnore": false,
            "type": "numberSlider",
            "velocity": 0,
            "popup": true,
            "sensitivity": 0.5,

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "backgroundColor": "#0295cf",
                "fontFamily": "Verdana",
                "fontSize": "auto",
                "fontColor": "#dddddd",
                "textAlign": "center"
            },

            "label": {
                "text": "",
                "offsetY": 0
            },

            "valuePrefix": "",
            "valuePostfix": ""
        };

        this.isDragging = false;
        this.startY = 0;
        this.startValue = 0;
        this.parameterIndex = 0;
        this.vscode = null;
        this.decimalPlaces = CabbageUtils.getDecimalPlaces(CabbageUtils.getChannelRange(this.props, 0, 'drag').increment);

        // Use centralized reactive props helper to manage visible/active toggling and cleanup
        // Pass explicit opts so we take advantage of the new per-key/watch-mode API defaults.
        this.props = CabbageUtils.createReactiveProps(this, this.props, { lazyPath: true, mode: 'change' });
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        this.widgetDiv = widgetDiv;
        // ensure initial pointer-events reflects visible && active
        try { this.widgetDiv.style.pointerEvents = (this.props.visible && this.props.active) ? 'auto' : 'none'; } catch (e) { }

        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        widgetDiv.addEventListener("dblclick", this.doubleClick.bind(this)); // Add double-click event listener
    }

    pointerDown(event) {
        const channelId = CabbageUtils.getChannelId(this.props);
        const range = CabbageUtils.getChannelRange(this.props, 0, 'drag');
        console.log(`NumberSlider pointerDown:`, { channel: channelId, value: range.value, visible: this.props.visible, range, parameterIndex: this.parameterIndex });
        // Don't perform slider actions in edit mode (draggable mode)
        if (getCabbageMode() === 'draggable') {
            return;
        }

        this.isDragging = true;
        this.startY = event.clientY;
        this.startValue = range.value !== null && range.value !== undefined ? range.value : range.defaultValue;
        // Validate startValue to prevent NaN
        if (isNaN(this.startValue) || this.startValue === null || this.startValue === undefined) {
            console.warn('Invalid startValue in numberSlider pointerDown, using default', this.startValue);
            this.startValue = range.defaultValue ?? 0;
        }
        // use pre-bound handlers so removeEventListener works reliably
        const moveHandler = this.boundPointerMove || this.pointerMove.bind(this);
        const upHandler = this.boundPointerUp || this.pointerUp.bind(this);
        // store bound handlers if they weren't present
        if (!this.boundPointerMove) this.boundPointerMove = moveHandler;
        if (!this.boundPointerUp) this.boundPointerUp = upHandler;
        window.addEventListener("pointermove", this.boundPointerMove);
        window.addEventListener("pointerup", this.boundPointerUp);
    }

    pointerMove(event) {
        const channelId = CabbageUtils.getChannelId(this.props);
        const range = CabbageUtils.getChannelRange(this.props, 0, 'drag');
        const inputBox = document.querySelector(`#slider-${channelId} input`);
        if (inputBox) {
            return;
        }

        // Don't perform slider actions in edit mode (draggable mode)
        if (getCabbageMode() === 'draggable') {
            return;
        }

        if (this.isDragging) {
            // Validate range to prevent NaN calculations
            if (isNaN(range.min) || isNaN(range.max) || range.max <= range.min) {
                console.warn('Invalid range in numberSlider pointerMove, using default', range);
            }

            const dy = event.clientY - this.startY;
            const steps = dy / (10 * this.props.sensitivity); // Number of steps to move based on drag distance

            // Convert the start value to linear space for movement calculation
            const startLinearValue = this.getLinearValue(this.startValue);
            const rangeSpan = range.max - range.min;
            const startLinearNormalized = (startLinearValue - range.min) / rangeSpan;

            // Apply movement in linear space
            const increment = range.increment;
            const normalizedIncrement = increment / rangeSpan;
            const newLinearNormalized = CabbageUtils.clamp(startLinearNormalized - steps * normalizedIncrement, 0, 1);

            // Convert back to actual linear value
            const newLinearValue = newLinearNormalized * rangeSpan + range.min;

            // Convert to skewed value for display
            const newSkewedValue = this.getSkewedValue(newLinearValue);

            // Apply increment snapping to the skewed value
            const oldValue = range.value;
            range.value = Math.round(newSkewedValue / increment) * increment;
            range.value = Math.min(range.max, Math.max(range.min, range.value));

            // Prevent NaN in value
            if (isNaN(range.value)) {
                console.error('NumberSlider value is NaN, setting to min');
                range.value = range.min;
            }

            // console.log(`NumberSlider pointerMove: startValue=${this.startValue}, newLinearValue=${newLinearValue}, newSkewedValue=${newSkewedValue}, final value=${range.value} (was ${oldValue})`);

            // Send denormalized value to backend
            console.log(`NumberSlider sending value: ${range.value} (range: ${range.min}-${range.max})`);
            Cabbage.sendControlData(channelId, range.value, this.vscode);

            this.updateSliderValue();
        }
    }

    pointerUp(event) {
        this.isDragging = false;
        // remove the bound handlers
        if (this.boundPointerMove) window.removeEventListener("pointermove", this.boundPointerMove);
        if (this.boundPointerUp) window.removeEventListener("pointerup", this.boundPointerUp);
    }

    doubleClick(event) {
        // Don't allow input editing in edit mode (draggable mode)
        if (getCabbageMode() === 'draggable') {
            return;
        }

        const sliderDiv = event.currentTarget;
        const channelId = CabbageUtils.getChannelId(this.props);
        const range = CabbageUtils.getChannelRange(this.props, 0, 'drag');
        const input = document.createElement('input');
        input.type = 'text';
        const currentValue = range.value !== null && range.value !== undefined ? range.value : range.defaultValue;
        input.value = currentValue.toFixed(this.decimalPlaces);
        input.style.position = 'absolute';
        input.style.top = '50%';
        input.style.left = '50%';
        input.style.transform = 'translate(-50%, -50%)';
        input.style.width = '60%'; // Adjust the width as needed
        input.style.height = 'auto';
        input.style.fontSize = `${Math.max(this.props.bounds.height * 0.4, 12)}px`; // Adjust font size
        input.style.fontFamily = this.props.style.fontFamily;
        input.style.textAlign = 'center'; // Center align the text inside input
        input.style.boxSizing = 'border-box';

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const newValue = parseFloat(input.value);
                if (!isNaN(newValue) && newValue >= range.min && newValue <= range.max) {
                    range.value = newValue;
                    // Send denormalized value to backend
                    Cabbage.sendControlData(channelId, range.value, this.vscode);
                    this.updateSliderValue();
                } else {
                    alert(`Please enter a value between ${range.min} and ${range.max}`);
                }
                sliderDiv.removeChild(input);
                sliderDiv.innerHTML = this.getInnerHTML();
            }
        });

        input.addEventListener('blur', () => {
            sliderDiv.removeChild(input);
            sliderDiv.innerHTML = this.getInnerHTML();
        });

        sliderDiv.innerHTML = '';
        sliderDiv.appendChild(input);
        input.focus();
        input.select(); // Auto-select the current text
    }

    updateSliderValue() {
        const widgetDiv = CabbageUtils.getWidgetDiv(this.props);
        if (widgetDiv) {
            widgetDiv.innerHTML = this.getInnerHTML();
        }
    }

    getInnerHTML() {
        // console.log(`NumberSlider getInnerHTML: visible=${this.props.visible}, opacity=${this.props.opacity}`);
        const fontSize = this.props.style.fontSize === "auto" || this.props.style.fontSize === 0 ? 12 : this.props.style.fontSize;
        const channelId = CabbageUtils.getWidgetDivId(this.props);
        const range = CabbageUtils.getChannelRange(this.props, 0, 'drag');
        const alignMap = {
            'left': 'flex-start',
            'center': 'center',
            'centre': 'center',
            'right': 'flex-end',
        };
        const flexAlign = alignMap[this.props.style.textAlign] || 'center';
        const currentValue = range.value !== null && range.value !== undefined ? range.value : range.defaultValue;
        const valueText = `${this.props.valuePrefix}${currentValue.toFixed(this.decimalPlaces)}${this.props.valuePostfix}`;

        const html = `
            <div id="slider-${channelId}" style="position: relative; width: ${this.props.bounds.width}px; height: ${this.props.bounds.height}px; user-select: none; opacity: ${this.props.visible ? '1' : '0'}; pointer-events: ${this.props.visible && this.props.active ? 'auto' : 'none'};">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0;">
                    <rect width="${this.props.bounds.width}" height="${this.props.bounds.height}" x="0" y="0" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" fill="${this.props.style.backgroundColor}" 
                        pointer-events="${this.props.visible && this.props.active ? 'all' : 'none'}" opacity="${this.props.style.opacity}"></rect>
                </svg>
    
                <!-- Text using foreignObject for consistent rendering -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0; pointer-events: none;">
                    <foreignObject x="0" y="0" width="${this.props.bounds.width}" height="${this.props.bounds.height}">
                        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:${flexAlign}; font-size:${fontSize}px; font-family:${this.props.style.fontFamily}; color:${this.props.style.fontColor};">
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
        const range = CabbageUtils.getChannelRange(this.props, 0, 'drag');
        const rangeSpan = range.max - range.min;
        if (rangeSpan === 0) return range.min;
        const normalizedValue = (linearValue - range.min) / rangeSpan;
        // Invert the skew for JUCE-like behavior
        const skewedNormalizedValue = Math.pow(normalizedValue, 1 / range.skew);
        return skewedNormalizedValue * rangeSpan + range.min;
    }

    getLinearValue(skewedValue) {
        const range = CabbageUtils.getChannelRange(this.props, 0, 'drag');
        const rangeSpan = range.max - range.min;
        if (rangeSpan === 0) return range.min;
        const normalizedValue = (skewedValue - range.min) / rangeSpan;
        // Invert the skew for JUCE-like behavior
        const linearNormalizedValue = Math.pow(normalizedValue, range.skew);
        return linearNormalizedValue * rangeSpan + range.min;
    }
}