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
            "channel": "nslider",
            "range": {
                "min": 0,
                "max": 1,
                "defaultValue": 0,
                "skew": 1,
                "increment": 0.001
            },
            "value": 0,
            "index": 0,
            "text": "",
            "fontFamily": "Verdana",
            "fontSize": 0,
            "align": "centre",
            "textOffsetY": 0,
            "valueTextBox": 0,
            "colour": '#93d200',
            "fontColour": "#dddddd",
            "outlineColour": "#525252",
            "outlineWidth": 2,
            "type": "nslider",
            "decimalPlaces": 1,
            "velocity": 0,
            "popup": 1,
            "visible": 1,
            "automatable": 1,
            "valuePrefix": "",
            "valuePostfix": "",
            "presetIgnore": 0,
        };

        this.panelSections = {
            "Properties": ["type"],
            "Bounds": ["left", "top", "width", "height"],
            "Text": ["text", "fontColour", "fontSize", "fontFamily", "align"],
            "Colours": ["colour"]
        };

        this.isDragging = false;
        this.startY = 0;
        this.startValue = 0;
        this.parameterIndex = 0;
        this.decimalPlaces = CabbageUtils.getDecimalPlaces(this.props.range.increment)
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        widgetDiv.addEventListener("dblclick", this.doubleClick.bind(this)); // Add double-click event listener
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
            Cabbage.sendParameterUpdate(this.vscode, msg);
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
        input.style.fontFamily = this.props.fontFamily;
        input.style.textAlign = 'center'; // Center align the text inside input
        input.style.boxSizing = 'border-box';

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const newValue = parseFloat(input.value);
                if (!isNaN(newValue) && newValue >= this.props.range.min && newValue <= this.props.range.max) {
                    this.props.value = newValue;
                    const normalValue = CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, 1);
                    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: normalValue };
                    Cabbage.sendParameterUpdate(this.vscode, msg);
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

        const fontSize = this.props.fontSize > 0 ? this.props.fontSize : Math.max(this.props.bounds.height * 0.8, 12); // Ensuring font size doesn't get too small
        const alignMap = {
            'left': 'end',
            'center': 'middle',
            'centre': 'middle',
            'right': 'start',
        };
        const svgAlign = alignMap[this.props.align] || 'middle';
        const valueText = `${this.props.valuePrefix}${this.props.value.toFixed(this.decimalPlaces)}${this.props.valuePostfix}`;

        return `
            <div id="slider-${this.props.channel}" style="position: relative; width: 100%; height: 100%;">
                <!-- Background SVG with preserveAspectRatio="none" -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0;">
                    <rect width="${this.props.bounds.width}" height="${this.props.bounds.height}" x="0" y="0" rx="${this.props.corners}" ry="${this.props.corners}" fill="${this.props.colour}" 
                        pointer-events="all"></rect>
                </svg>
    
                <!-- Text SVG with proper alignment -->
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
                     style="position: absolute; top: 0; left: 0;">
                    <text id="slider-text-${this.props.channel}" x="${this.props.align === 'left' ? '10%' : this.props.align === 'right' ? '90%' : '50%'}" y="50%" font-family="${this.props.fontFamily}" font-size="${fontSize}"
                        fill="${this.props.fontColour}" text-anchor="${svgAlign}" dominant-baseline="middle" alignment-baseline="middle" 
                        style="pointer-events: none;">${valueText}</text>
                </svg>
            </div>
        `;
    }



}
