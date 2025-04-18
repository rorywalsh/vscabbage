// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";

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
            "opacity": 1
        };

        this.isDragging = false;
        this.startY = 0;
        this.startValue = 0;
        this.parameterIndex = 0;
        this.vscode = null;
        this.decimalPlaces = CabbageUtils.getDecimalPlaces(this.props.range.increment);
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        widgetDiv.addEventListener("pointermove", this.pointerMove.bind(this));
        widgetDiv.addEventListener("pointerup", this.pointerUp.bind(this));
        widgetDiv.addEventListener("pointerleave", this.pointerUp.bind(this));
        widgetDiv.addEventListener("dblclick", this.doubleClick.bind(this)); // Add double-click event listener
    }

    pointerDown(event) {
        this.isDragging = true;
        this.startY = event.clientY;
        this.startValue = this.props.value;
        event.target.setPointerCapture(event.pointerId);
    }

    pointerMove(event) {
        const inputBox = document.querySelector(`#slider-${this.props.channel} input`);
        if (inputBox) {
            return;
        }

        if (this.isDragging) {
            const dy = event.clientY - this.startY;
            const increment = this.props.range.increment;
            const steps = dy / 10; // Number of steps to move based on drag distance
            const newValue = this.startValue - steps * increment;
            this.props.value = Math.min(this.props.range.max, Math.max(this.props.range.min, newValue));
            const normalValue = CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, 1);
            const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: normalValue };
            Cabbage.sendParameterUpdate(msg, this.vscode);
            this.updateSliderValue();
        }
    }

    pointerUp(event) {
        this.isDragging = false;
        event.target.releasePointerCapture(event.pointerId);
    }

    doubleClick(event) {
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
                    const normalValue = CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, 1);
                    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: normalValue };
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
        if (this.props.visible === 0) {
            return '';
        }
    
        console.log('NumberSlider rendering:', this.props);
        const fontSize = this.props.font.size > 0 ? this.props.font.size : 18;
        const alignMap = {
            'left': 'end',
            'center': 'middle',
            'centre': 'middle',
            'right': 'start',
        };
        const svgAlign = alignMap[this.props.font.align] || 'middle';
        const currentValue = this.props.value === null ? this.props.range.defaultValue : this.props.value;
        const valueText = `${this.props.valuePrefix}${currentValue.toFixed(this.decimalPlaces)}${this.props.valuePostfix}`;
    
        const html = `
            <div id="slider-${this.props.channel}" style="position: relative; width: ${this.props.bounds.width}px; height: ${this.props.bounds.height}px; user-select: none;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0;">
                    <rect width="${this.props.bounds.width}" height="${this.props.bounds.height}" x="0" y="0" rx="${this.props.corners}" ry="${this.props.corners}" fill="${this.props.colour.fill}" 
                        pointer-events="all" opacity="${this.props.opacity}"></rect>
                </svg>
    
                <!-- Text SVG with proper alignment -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="xMidYMid meet"
                     style="position: absolute; top: 0; left: 0;">
                    <text id="slider-text-${this.props.channel}" class="editable-text" x="${this.props.font.align === 'left' ? '10%' : this.props.font.align === 'right' ? '90%' : '50%'}" y="50%" font-family="${this.props.font.family}" font-size="${fontSize}"
                        fill="${this.props.font.colour}" text-anchor="${svgAlign}" dominant-baseline="middle" alignment-baseline="middle" 
                        style="pointer-events: none;">${valueText}</text>
                </svg>
            </div>
        `;
        console.log('Generated HTML:', html);
        return html;
    }
}