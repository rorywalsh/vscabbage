// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { Cabbage } from "../cabbage.js";
import { CabbageUtils, CabbageColours } from "../utils.js";
import { getCabbageMode } from "../sharedState.js";

/**
 * Horizontal Slider class
 */
export class HorizontalSlider {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 160,
        "height": 40
      },
      "channel": "hslider",
      "corners": 4,
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
          "width": 1
        },
        "tracker": {
          "fill": "#93d200",
          "background": "#ffffff",
          "width": 2
        }
      },
      "thumbWidth": 8,
      "type": "horizontalSlider",
      "decimalPlaces": 1,
      "visible": 1,
      "opacity": 1,
      "popup": 0,
      "automatable": 1,
      "valuePrefix": "",
      "valuePostfix": "",
      "presetIgnore": 0
    };

    this.parameterIndex = 0;
    this.moveListener = this.pointerMove.bind(this);
    this.upListener = this.pointerUp.bind(this);
    this.startX = 0;
    this.startValue = 0;
    this.vscode = null;
    this.isMouseDown = false;
    this.decimalPlaces = 0;
  }

  pointerUp(evt) {
    const popup = document.getElementById('popupValue');
    popup.classList.add('hide');
    popup.classList.remove('show');

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
    if (this.props.active === 0) {
      return '';
    }

    // Don't perform slider actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };
    const svgAlign = alignMap[this.props.font.align] || this.props.font.align;
    const padding = (svgAlign === 'end' || svgAlign === 'middle') ? 5 : 0;

    let textWidth = this.props.text ? CabbageUtils.getStringWidth(this.props.text, this.props, 20) : 0;
    textWidth = (this.props.sliderOffsetX > 0 ? this.props.sliderOffsetX : textWidth) - padding;
    const valueTextBoxWidth = this.props.valueTextBox ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth - padding;
    textWidth += padding;

    if (evt.offsetX >= textWidth && evt.offsetX <= textWidth + sliderWidth && evt.target.tagName !== "INPUT") {
      this.isMouseDown = true;
      this.startX = evt.offsetX - textWidth;
      console.log(`pointerDown: startX=${this.startX}, sliderWidth=${sliderWidth}`);

      // Calculate the linear normalized position (0-1)
      const linearNormalized = this.startX / sliderWidth;
      console.log(`pointerDown: linearNormalized=${linearNormalized}`);

      // Apply skew transformation for display value
      const skewedNormalized = Math.pow(linearNormalized, 1 / this.props.range.skew);
      console.log(`pointerDown: skewedNormalized=${skewedNormalized}`);

      // Convert to actual range values
      let skewedValue = skewedNormalized * (this.props.range.max - this.props.range.min) + this.props.range.min;
      console.log(`pointerDown: skewedValue before rounding=${skewedValue}`);

      // Apply increment snapping to the skewed value
      skewedValue = Math.round(skewedValue / this.props.range.increment) * this.props.range.increment;
      console.log(`pointerDown: skewedValue after rounding=${skewedValue}`);

      this.props.value = skewedValue;

      // Capture pointer to ensure we receive pointerup even if pointer leaves element
      evt.target.setPointerCapture(evt.pointerId);
      this.activePointerId = evt.pointerId;

      window.addEventListener("pointermove", this.moveListener);
      window.addEventListener("pointerup", this.upListener);

      this.startValue = this.props.value;
      CabbageUtils.updateInnerHTML(this.props.channel, this);

      // Send value that will result in correct output after backend applies skew
      const targetNormalized = (skewedValue - this.props.range.min) / (this.props.range.max - this.props.range.min);
      const valueToSend = Math.pow(targetNormalized, 1.0 / this.props.range.skew);
      const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: valueToSend, channelType: "number" };
      console.log(`pointerDown: sending valueToSend=${valueToSend}`);
      if (this.props.automatable === 1) {
        Cabbage.sendParameterUpdate(msg, this.vscode);
      }
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

    if (popup && this.props.popup) {
      popup.textContent = this.props.valuePrefix + parseFloat(this.props.value ?? this.props.range.defaultValue).toFixed(this.decimalPlaces) + this.props.valuePostfix;

      // Calculate the position for the popup
      const sliderTop = rect.top + this.props.bounds.top; // Top position of the slider
      const sliderHeight = this.props.bounds.height; // Height of the slider
      const mainFormHeight = rect.height; // Height of the main form

      // Default position for the popup to the bottom of the slider
      let popupTop = sliderTop + sliderHeight + 5; // 5px padding below the slider

      let popupLeft = rect.left + this.props.bounds.left + (this.props.bounds.width / 2) - (popup.offsetWidth / 2); // Center the popup


      // Check if there is enough space below the slider for the popup
      if (popupTop > (mainFormHeight - this.props.bounds.height)) {
        // Position above with 5px padding
        popupTop = sliderTop - popup.offsetHeight + 5;
        popup.classList.remove('below');
        popup.classList.add('above');
      } else {
        // Position below
        popup.classList.remove('above');
        popup.classList.add('below');
      }

      // Ensure the popup is centered horizontally
      popup.style.left = `${popupLeft}px`;
      popup.style.top = `${popupTop}px`;
      popup.style.display = 'block';
      popup.classList.add('show');
      popup.classList.remove('hide');
    }
  }


  mouseLeave(evt) {
    if (this.props.active === 0) {
      return '';
    }

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
    widgetDiv.HorizontalSliderInstance = this;
  }

  pointerMove({ clientX }) {
    if (this.props.active === 0) {
      return '';
    }

    // Don't perform slider actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };
    const svgAlign = alignMap[this.props.font.align] || this.props.font.align;
    const padding = (svgAlign === 'end' || svgAlign === 'middle') ? 5 : 0;

    let textWidth = this.props.text ? CabbageUtils.getStringWidth(this.props.text, this.props, 20) : 0;
    textWidth = (this.props.sliderOffsetX > 0 ? this.props.sliderOffsetX : textWidth) - padding;
    const valueTextBoxWidth = this.props.valueTextBox ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth - padding;
    textWidth += padding;

    // Get the bounding rectangle of the slider
    const sliderRect = document.getElementById(this.props.channel).getBoundingClientRect();

    // Calculate the relative position of the mouse pointer within the slider bounds
    let offsetX = clientX - sliderRect.left - textWidth;

    // Clamp the mouse position to stay within the bounds of the slider
    offsetX = CabbageUtils.clamp(offsetX, 0, sliderWidth);

    // Calculate the linear normalized position (0-1)
    const linearNormalized = offsetX / sliderWidth;

    // Apply skew transformation for display value
    const skewedNormalized = Math.pow(linearNormalized, 1 / this.props.range.skew);

    // Convert to actual range values
    const linearValue = linearNormalized * (this.props.range.max - this.props.range.min) + this.props.range.min;
    let skewedValue = skewedNormalized * (this.props.range.max - this.props.range.min) + this.props.range.min;

    // Apply increment snapping to the skewed value
    skewedValue = Math.round(skewedValue / this.props.range.increment) * this.props.range.increment;

    // Store the skewed value for display
    this.props.value = skewedValue;

    console.log(`pointerMove: offsetX=${offsetX}, linearNormalized=${linearNormalized}, skewedValue=${skewedValue}`);

    // Update the slider appearance
    CabbageUtils.updateInnerHTML(this.props.channel, this);

    // Send value that will result in correct output after backend applies skew
    // Backend does: min + (max - min) * pow(normalized, skew)
    // We want: backend to output skewedValue
    // So we need to send: pow((skewedValue - min) / (max - min), 1/skew)
    const targetNormalized = (skewedValue - this.props.range.min) / (this.props.range.max - this.props.range.min);
    const valueToSend = Math.pow(targetNormalized, 1.0 / this.props.range.skew);
    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: valueToSend, channelType: "number" }
    console.log(`pointerMove: sending valueToSend=${valueToSend}`);
    if (this.props.automatable === 1) {
      Cabbage.sendParameterUpdate(msg, this.vscode);
    }
  }

  handleInputChange(evt) {
    // Don't allow input changes in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return;
    }

    if (evt.key === 'Enter') {
      const inputValue = parseFloat(evt.target.value);
      if (!isNaN(inputValue) && inputValue >= this.props.range.min && inputValue <= this.props.range.max) {
        // Store the input value as the skewed value (what user sees)
        this.props.value = inputValue;

        // Convert to linear space for Cabbage
        const linearValue = this.getLinearValue(inputValue);
        const linearNormalized = (linearValue - this.props.range.min) / (this.props.range.max - this.props.range.min);

        CabbageUtils.updateInnerHTML(this.props.channel, this);
        const widgetDiv = document.getElementById(this.props.channel);
        widgetDiv.querySelector('input').focus();

        // Send value that will result in correct output after backend applies skew
        const targetNormalized = (inputValue - this.props.range.min) / (this.props.range.max - this.props.range.min);
        const valueToSend = Math.pow(targetNormalized, 1.0 / this.props.range.skew);
        const msg = {
          paramIdx: this.parameterIndex,
          channel: this.props.channel,
          value: valueToSend,
          channelType: "number"
        };
        if (this.props.automatable === 1) {
          Cabbage.sendParameterUpdate(msg, this.vscode);
        }
      }
    }
  }

  getInnerHTML() {
    const popup = document.getElementById('popupValue');
    if (popup) {
      popup.textContent = this.props.valuePrefix + parseFloat(this.props.value ?? 0).toFixed(this.decimalPlaces) + this.props.valuePostfix;
    }

    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };

    const svgAlign = alignMap[this.props.font.align] || this.props.font.align;
    const currentValue = this.props.value ?? this.props.range.defaultValue;
    // Add padding if alignment is 'end' or 'middle'
    const padding = (svgAlign === 'end' || svgAlign === 'middle') ? 5 : 0; // Adjust the padding value as needed

    // Calculate text width and update SVG width
    let textWidth = this.props.text ? CabbageUtils.getStringWidth(this.props.text, this.props, 20) : 0;
    textWidth = (this.props.sliderOffsetX > 0 ? this.props.sliderOffsetX : textWidth) - padding;
    const valueTextBoxWidth = this.props.valueTextBox ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth - padding; // Subtract padding from sliderWidth

    const w = (sliderWidth > this.props.bounds.height ? this.props.bounds.height : sliderWidth) * 0.75;

    // Calculate fontSize - use explicit font.size if provided, otherwise calculate from widget height
    // This ensures consistent font rendering for both text label and value box
    const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.6;
    const textY = this.props.bounds.height / 2 + (this.props.font.size > 0 ? this.props.textOffsetY : 0) + (this.props.bounds.height * 0.25); // Adjusted for vertical centering

    textWidth += padding;

    const textElement = this.props.text ? `
      <foreignObject x="0" y="0" width="${textWidth}" height="${this.props.bounds.height}">
        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:${svgAlign === 'end' ? 'flex-end' : (svgAlign === 'middle' ? 'center' : 'flex-start')}; font-size:${fontSize}px; font-family:${this.props.font.family}; color:${this.props.font.colour}; padding-right:${svgAlign === 'end' ? padding : 0}px;">
          ${this.props.text}
        </div>
      </foreignObject>
    ` : '';

    // Use explicit tracker width from props and clamp to available slider height
    const trackerWidth = this.props.colour?.tracker?.width ?? 12;
    const trackerHeight = Math.min(trackerWidth, this.props.bounds.height * 0.9);
    const trackerY = (this.props.bounds.height - trackerHeight) / 2;

    const sliderElement = `
      <svg x="${textWidth}" width="${sliderWidth}" height="${this.props.bounds.height}" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="${this.props.opacity}">
        <rect x="1" y="${trackerY}" width="${sliderWidth - 2}" height="${trackerHeight}" rx="4" fill="${this.props.colour.tracker.background}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/>
        <rect x="1" y="${trackerY}" width="${Math.max(0, CabbageUtils.map(this.getLinearValue(currentValue), this.props.range.min, this.props.range.max, 0, sliderWidth))}" height="${trackerHeight}" rx="4" fill="${this.props.colour.tracker.fill}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/> 
        <rect x="${CabbageUtils.map(this.getLinearValue(currentValue), this.props.range.min, this.props.range.max, 0, sliderWidth - sliderWidth * .05 - 1) + 1}" y="0" width="${this.props.thumbWidth}" height="${this.props.bounds.height}" rx="${this.props.corners}" ry="${this.props.corners}" fill="${this.props.colour.fill}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/>
      </svg>
    `;

    const valueTextElement = this.props.valueTextBox ? `
      <foreignObject x="${textWidth + sliderWidth}" y="0" width="${valueTextBoxWidth}" height="${this.props.bounds.height}">
        <input type="text" value="${currentValue.toFixed(CabbageUtils.getDecimalPlaces(this.props.range.increment))}"
        style="width:100%; outline: none; height:100%; text-align:center; font-size:${fontSize}px; font-family:${this.props.font.family}; color:${this.props.font.colour}; background:none; border:none; padding:0; margin:0;"
        onKeyDown="document.getElementById('${this.props.channel}').HorizontalSliderInstance.handleInputChange(event)"/>
      </foreignObject>
    ` : '';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" style="display: ${this.props.visible === 0 ? 'none' : 'block'};">
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
