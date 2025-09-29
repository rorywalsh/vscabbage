// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";
import { getCabbageMode } from "../sharedState.js";

export class VerticalSlider {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 60,
        "height": 120
      },
      "channel": "vslider",
      "range": {
        "min": 0,
        "max": 1,
        "defaultValue": 0,
        "skew": 1,
        "increment": 0.001
      },
      "value": null,
      "text": "",
      "font": {
        "family": "Verdana",
        "size": 0,
        "align": "centre",
        "colour": "#dddddd"
      },
      "valueTextBox": 1,
      "colour": {
        "fill": "#0295cf",
        "stroke": {
          "colour": "#525252",
          "width": 2
        },
        "tracker": {
          "fill": "#93d200",
          "background": "#ffffff",
          "width": 20
        }
      },
      "type": "verticalSlider",
      "decimalPlaces": 1,
      "velocity": 0,
      "visible": 1,
      "opacity": 1,
      "popup": 0,
      "automatable": 1,
      "valuePrefix": "",
      "valuePostfix": ""
    };

    this.moveListener = this.pointerMove.bind(this);
    this.upListener = this.pointerUp.bind(this);
    this.startY = 0; // Changed from startX to startY for vertical slider
    this.startValue = 0;
    this.vscode = null;
    this.isMouseDown = false;
    this.decimalPlaces = 0;
    this.parameterIndex = 0;
  }

  pointerUp() {
    if (this.props.active === 0) {
      return '';
    }
    const popup = document.getElementById('popupValue');
    popup.classList.add('hide');
    popup.classList.remove('show');
    window.removeEventListener("pointermove", this.moveListener);
    window.removeEventListener("pointerup", this.upListener);
    this.isMouseDown = false;
  }

  pointerDown(evt) {
    if (this.props.active === 0) {
      return '';
    }

    // Don't perform slider actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    let textHeight = this.props.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueTextBox ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight;

    const sliderTop = this.props.valueTextBox ? textHeight : 0; // Adjust slider top position if valueTextBox is present

    if (evt.offsetY >= sliderTop && evt.offsetY <= sliderTop + sliderHeight) {
      this.isMouseDown = true;
      this.startY = evt.offsetY - sliderTop;
      this.props.value = CabbageUtils.map(this.startY, 5, sliderHeight, this.props.range.max, this.props.range.min);
      this.props.value = Math.round(this.props.value / this.props.range.increment) * this.props.range.increment;
      this.startValue = this.props.value;
      window.addEventListener("pointermove", this.moveListener);
      window.addEventListener("pointerup", this.upListener);
      CabbageUtils.updateInnerHTML(this.props.channel, this);

      // Send value that will result in correct output after backend applies skew
      const targetNormalized = (this.props.value - this.props.range.min) / (this.props.range.max - this.props.range.min);
      const valueToSend = Math.pow(targetNormalized, 1.0 / this.props.range.skew);
      const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: valueToSend, channelType: "number" }
      Cabbage.sendParameterUpdate(msg, this.vscode);
    }
  }

  mouseEnter(evt) {
    if (this.props.active === 0) {
      return '';
    }

    // Don't show popup in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const popup = document.getElementById('popupValue');
    const form = document.getElementById('MainForm');
    const rect = form.getBoundingClientRect();
    this.decimalPlaces = CabbageUtils.getDecimalPlaces(this.props.range.increment);

    if (popup && this.props.popup > 0) {
      popup.textContent = this.props.valuePrefix + parseFloat(this.props.value ?? this.props.range.defaultValue).toFixed(this.decimalPlaces) + this.props.valuePostfix;

      // Calculate the position for the popup
      const sliderLeft = this.props.bounds.left;
      const sliderWidth = this.props.bounds.width;
      const formLeft = rect.left;
      const formWidth = rect.width;

      // Determine if the popup should be on the right or left side of the slider
      const sliderCenter = formLeft + (formWidth / 2);
      let popupLeft;
      if (sliderLeft + (sliderWidth) > sliderCenter) {
        // Place popup on the left of the slider thumb
        popupLeft = formLeft + sliderLeft - popup.offsetWidth - 10;
        popup.classList.add('right');
      } else {
        // Place popup on the right of the slider thumb
        popupLeft = formLeft + sliderLeft + sliderWidth + 10;
        popup.classList.remove('right');
      }

      const popupTop = rect.top + this.props.bounds.top + this.props.bounds.height * .45; // Adjust top position relative to the form's top

      // Set the calculated position
      popup.style.left = `${popupLeft}px`;
      popup.style.top = `${popupTop}px`;
      popup.style.display = 'block';
      popup.classList.add('show');
      popup.classList.remove('hide');
    }
  }

  mouseLeave(evt) {
    // Don't hide popup in edit mode (draggable mode) since it's not shown
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    if (!this.isMouseDown) {
      const popup = document.getElementById('popupValue');
      popup.classList.add('hide');
      popup.classList.remove('show');
    }
  }

  addVsCodeEventListeners(widgetDiv, vs) {
    this.vscode = vs;
    this.addEventListeners(widgetDiv);
  }

  addEventListeners(widgetDiv) {
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.addEventListener("mouseenter", this.mouseEnter.bind(this));
    widgetDiv.addEventListener("mouseleave", this.mouseLeave.bind(this));
    widgetDiv.VerticalSliderInstance = this;
  }

  handleInputChange(evt) {
    // Don't allow input changes in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return;
    }

    if (evt.key === 'Enter') {
      const inputValue = parseFloat(evt.target.value);
      if (!isNaN(inputValue) && inputValue >= this.props.range.min && inputValue <= this.props.range.max) {
        this.props.value = inputValue;
        const widgetDiv = document.getElementById(this.props.channel);
        widgetDiv.innerHTML = this.getInnerHTML();
        widgetDiv.querySelector('input').focus();
      }
    }
  }

  pointerMove({ clientY }) {
    if (this.props.active === 0) {
      return '';
    }

    // Don't perform slider actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    let textHeight = this.props.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueTextBox ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight;

    // Get the bounding rectangle of the slider
    const sliderRect = document.getElementById(this.props.channel).getBoundingClientRect();

    // Calculate the relative position of the mouse pointer within the slider bounds
    let offsetY = sliderRect.bottom - clientY - textHeight;

    // Clamp the mouse position to stay within the bounds of the slider
    offsetY = CabbageUtils.clamp(offsetY, 0, sliderHeight);

    // Calculate the linear normalized position (0-1)
    const linearNormalized = offsetY / sliderHeight;

    // Apply skew transformation for display value
    const skewedNormalized = Math.pow(linearNormalized, 1 / this.props.range.skew);

    // Convert to actual range values
    const linearValue = linearNormalized * (this.props.range.max - this.props.range.min) + this.props.range.min;
    let skewedValue = skewedNormalized * (this.props.range.max - this.props.range.min) + this.props.range.min;

    // Apply increment snapping to the skewed value
    skewedValue = Math.round(skewedValue / this.props.range.increment) * this.props.range.increment;

    // Store the skewed value for display
    this.props.value = skewedValue;

    // Update the slider appearance
    const widgetDiv = document.getElementById(this.props.channel);
    widgetDiv.innerHTML = this.getInnerHTML();

    // Send value that will result in correct output after backend applies skew
    const targetNormalized = (skewedValue - this.props.range.min) / (this.props.range.max - this.props.range.min);
    const valueToSend = Math.pow(targetNormalized, 1.0 / this.props.range.skew);
    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: valueToSend, channelType: "number" }
    Cabbage.sendParameterUpdate(msg, this.vscode);
  }

  getInnerHTML() {
    if (this.props.visible === 0) {
      return '';
    }

    const popup = document.getElementById('popupValue');
    if (popup) {
      popup.textContent = this.props.valuePrefix + parseFloat(this.props.value).toFixed(this.decimalPlaces) + this.props.valuePostfix;
    }

    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };

    const svgAlign = alignMap[this.props.font.align] || this.props.font.align;
    const currentValue = this.props.value ?? this.props.range.defaultValue;

    // Calculate text height
    let textHeight = this.props.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueTextBox ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight * 1.1;

    const textX = this.props.bounds.width / 2;
    const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.width * 0.3;

    // Use tracker width if provided for the thumb/track thickness
    const trackerWidth = this.props.colour?.tracker?.width ?? (sliderHeight * 0.05);
    const thumbHeight = Math.min(trackerWidth, sliderHeight * 0.95);

    const textElement = this.props.text ? `
    <svg x="0" y="${this.props.valueTextBox ? 0 : this.props.bounds.height - textHeight}" width="${this.props.bounds.width}" height="${textHeight + 5}" preserveAspectRatio="xMinYMid meet" xmlns="http://www.w3.org/2000/svg">
      <text text-anchor="${svgAlign}" x="${textX}" y="${textHeight}" font-size="${fontSize}px" font-family="${this.props.font.family}" stroke="none" fill="${this.props.font.colour}"> <!-- Updated to use this.props.font.colour -->
        ${this.props.text}
      </text>
    </svg>
    ` : '';

    // calculate Y offset to center the track vertically
    const trackY = (sliderHeight - thumbHeight) / 2;

    const sliderElement = `
    <svg x="0" y="${this.props.valueTextBox ? textHeight + 2 : 0}" width="${this.props.bounds.width}" height="${sliderHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="${this.props.opacity}">
      <rect x="${this.props.bounds.width * 0.4}" y="${trackY}" width="${this.props.bounds.width * 0.2}" height="${thumbHeight}" rx="2" fill="${this.props.colour.tracker.background}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/>
      <rect x="${this.props.bounds.width * 0.4}" y="${trackY + (sliderHeight - CabbageUtils.map(this.getLinearValue(currentValue), this.props.range.min, this.props.range.max, 0, sliderHeight * 0.95)) - 1}" height="${CabbageUtils.map(this.getLinearValue(currentValue), this.props.range.min, this.props.range.max, 0, 1) * thumbHeight}" width="${this.props.bounds.width * 0.2}" rx="2" fill="${this.props.colour.tracker.fill}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/> 
      <rect x="${this.props.bounds.width * 0.3}" y="${sliderHeight - CabbageUtils.map(this.getLinearValue(currentValue), this.props.range.min, this.props.range.max, thumbHeight + 1, sliderHeight - 1)}" width="${this.props.bounds.width * 0.4}" height="${thumbHeight}" rx="2" fill="${this.props.colour.fill}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/>
    </svg>
    `;

    const valueTextElement = this.props.valueTextBox ? `
    <foreignObject x="0" y="${this.props.bounds.height - valueTextBoxHeight * 1.2}" width="${this.props.bounds.width}" height="${valueTextBoxHeight * 1.2}">
      <input type="text" value="${currentValue.toFixed(CabbageUtils.getDecimalPlaces(this.props.range.increment))}"
      style="width:100%; outline: none; height:100%; text-align:center; font-size:${fontSize}px; font-family:${this.props.font.family}; color:${this.props.font.colour}; background:none; border:none; padding:0; margin:0;"
      onKeyDown="document.getElementById('${this.props.channel}').VerticalSliderInstance.handleInputChange(event)"/>
    </foreignObject>
    ` : '';

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" opacity="${this.props.opacity}">
      ${textElement}
      ${sliderElement}
      ${valueTextElement}
    </svg>
    `;
  }

  // Helper methods for skew functionality
  getSkewedValue(linearValue) {
    const normalizedValue = (linearValue - this.props.range.min) / (this.props.range.max - this.props.range.min);
    // Invert the skew for JUCE-like behavior
    const skewedNormalizedValue = Math.pow(normalizedValue, 1 / this.props.range.skew);
    return skewedNormalizedValue * (this.props.range.max - this.props.range.min) + this.props.range.min;
  }

  getLinearValue(skewedValue) {
    const normalizedValue = (skewedValue - this.props.range.min) / (this.props.range.max - this.props.range.min);
    // Invert the skew for JUCE-like behavior
    const linearNormalizedValue = Math.pow(normalizedValue, this.props.range.skew);
    return linearNormalizedValue * (this.props.range.max - this.props.range.min) + this.props.range.min;
  }
}
