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
      "channels": [
        { "id": "vslider", "event": "valueChanged" }
      ],
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

  pointerUp(evt) {
    if (this.props.active === 0) {
      return '';
    }
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

    const range = CabbageUtils.getChannelRange(this.props, 0);

    let textHeight = this.props.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueTextBox ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight;

    // Guard against invalid ranges or slider dimensions
    if (sliderHeight <= 0 || range.max - range.min === 0) {
      console.warn('VerticalSlider pointerDown: Invalid slider dimensions or range', { sliderHeight, range });
      return '';
    }

    const sliderTop = this.props.valueTextBox ? textHeight : 0; // Adjust slider top position if valueTextBox is present

    if (evt.offsetY >= sliderTop && evt.offsetY <= sliderTop + sliderHeight) {
      this.isMouseDown = true;
      this.startY = evt.offsetY - sliderTop;
      this.props.value = CabbageUtils.map(this.startY, 5, sliderHeight, range.max, range.min);
      this.props.value = Math.round(this.props.value / range.increment) * range.increment;
      this.startValue = this.props.value;
      window.addEventListener("pointermove", this.moveListener);
      window.addEventListener("pointerup", this.upListener);
      CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);

      console.log('VerticalSlider pointerDown: parameterIndex =', this.parameterIndex, 'automatable =', this.props.automatable);
      console.log('VerticalSlider pointerMove: parameterIndex =', this.parameterIndex, 'automatable =', this.props.automatable);
      // Send denormalized value directly to backend
      const valueToSend = this.props.value;
      if (isNaN(valueToSend) || !isFinite(valueToSend)) {
        console.error('VerticalSlider pointerMove: Invalid value to send:', valueToSend, 'range:', range);
        return;
      }
      const msg = { paramIdx: this.parameterIndex, channel: CabbageUtils.getChannelId(this.props), value: valueToSend, channelType: "number" };
      console.log('VerticalSlider pointerMove sending:', msg);
      Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);

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

    const range = CabbageUtils.getChannelRange(this.props, 0);
    const popup = document.getElementById('popupValue');
    const form = document.getElementById('MainForm');
    const rect = form.getBoundingClientRect();
    this.decimalPlaces = CabbageUtils.getDecimalPlaces(range.increment);

    if (popup && this.props.popup > 0) {
      popup.textContent = this.props.valuePrefix + parseFloat(this.props.value ?? range.defaultValue).toFixed(this.decimalPlaces) + this.props.valuePostfix;

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

    const range = CabbageUtils.getChannelRange(this.props, 0);
    if (evt.key === 'Enter') {
      const inputValue = parseFloat(evt.target.value);
      if (!isNaN(inputValue) && inputValue >= range.min && inputValue <= range.max) {
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

    const range = CabbageUtils.getChannelRange(this.props, 0);
    let textHeight = this.props.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueTextBox ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight;

    // Guard against invalid ranges or slider dimensions
    if (sliderHeight <= 0 || range.max - range.min === 0) {
      console.warn('VerticalSlider pointerMove: Invalid slider dimensions or range', { sliderHeight, range });
      return '';
    }

    // Get the bounding rectangle of the slider
    const sliderRect = document.getElementById(CabbageUtils.getChannelId(this.props)).getBoundingClientRect();

    // Calculate the relative position of the mouse pointer within the slider bounds
    let offsetY = sliderRect.bottom - clientY - textHeight;

    // Clamp the mouse position to stay within the bounds of the slider
    offsetY = CabbageUtils.clamp(offsetY, 0, sliderHeight);

    // Calculate the linear normalized position (0-1)
    const linearNormalized = offsetY / sliderHeight;

    // Apply skew transformation for display value
    const skewedNormalized = Math.pow(linearNormalized, 1 / range.skew);

    // Convert to actual range values
    const linearValue = linearNormalized * (range.max - range.min) + range.min;
    let skewedValue = skewedNormalized * (range.max - range.min) + range.min;

    // Apply increment snapping to the skewed value
    skewedValue = Math.round(skewedValue / range.increment) * range.increment;

    // Store the skewed value for display
    this.props.value = skewedValue;

    // Update the slider appearance
    const widgetDiv = document.getElementById(CabbageUtils.getChannelId(this.props));
    widgetDiv.innerHTML = this.getInnerHTML();

    // Send denormalized value directly to backend
    const valueToSend = skewedValue;
    if (isNaN(valueToSend) || !isFinite(valueToSend)) {
      console.error('VerticalSlider pointerMove: Invalid value to send:', valueToSend, 'range:', range);
      return;
    }
    const msg = { paramIdx: this.parameterIndex, channel: CabbageUtils.getChannelId(this.props), value: valueToSend, channelType: "number" };
    console.log('VerticalSlider pointerMove sending:', msg);
    if (this.props.automatable === 1) {
      Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);
    }
  }

  getInnerHTML() {
    const range = CabbageUtils.getChannelRange(this.props, 0);
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
    const currentValue = this.props.value ?? range.defaultValue;

    // Calculate text height
    let textHeight = this.props.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueTextBox ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight * 1.1;

    const textX = this.props.bounds.width / 2;

    // Calculate fontSize - use explicit font.size if provided, otherwise calculate from widget width
    // This ensures consistent font rendering for both text label and value box
    const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.width * 0.3;

    // Use tracker width if provided for the thumb/track thickness
    const trackerWidth = this.props.colour?.tracker?.width ?? (sliderHeight * 0.05);
    const thumbHeight = Math.min(trackerWidth, sliderHeight * 0.95);

    const textElement = this.props.text ? `
    <foreignObject x="0" y="${this.props.valueTextBox ? 0 : this.props.bounds.height - textHeight}" width="${this.props.bounds.width}" height="${textHeight + 5}">
      <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:${fontSize}px; font-family:${this.props.font.family}; color:${this.props.font.colour};">
        ${this.props.text}
      </div>
    </foreignObject>
    ` : '';

    // calculate Y offset to center the track vertically
    const trackY = 0;

    const sliderElement = `
    <svg x="0" y="${this.props.valueTextBox ? textHeight + 2 : 0}" width="${this.props.bounds.width}" height="${sliderHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="${this.props.opacity}">
      <rect x="${this.props.bounds.width * 0.4}" y="${trackY}" width="${this.props.bounds.width * 0.2}" height="${sliderHeight}" rx="2" fill="${this.props.colour.tracker.background}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/>
      <rect x="${this.props.bounds.width * 0.4}" y="${trackY + sliderHeight - CabbageUtils.map(this.getLinearValue(currentValue), range.min, range.max, 0, sliderHeight)}" height="${CabbageUtils.map(this.getLinearValue(currentValue), range.min, range.max, 0, sliderHeight)}" width="${this.props.bounds.width * 0.2}" rx="2" fill="${this.props.colour.tracker.fill}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/> 
      <rect x="${this.props.bounds.width * 0.3}" y="${sliderHeight - CabbageUtils.map(this.getLinearValue(currentValue), range.min, range.max, thumbHeight + 1, sliderHeight - 1)}" width="${this.props.bounds.width * 0.4}" height="${thumbHeight}" rx="2" fill="${this.props.colour.fill}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/>
    </svg>
    `;

    const valueTextElement = this.props.valueTextBox ? `
    <foreignObject x="0" y="${this.props.bounds.height - valueTextBoxHeight * 1.2}" width="${this.props.bounds.width}" height="${valueTextBoxHeight * 1.2}">
      <input type="text" value="${currentValue.toFixed(CabbageUtils.getDecimalPlaces(range.increment))}"
      style="width:100%; outline: none; height:100%; text-align:center; font-size:${fontSize}px; font-family:${this.props.font.family}; color:${this.props.font.colour}; background:none; border:none; padding:0; margin:0;"
      onKeyDown="document.getElementById('${CabbageUtils.getChannelId(this.props)}').VerticalSliderInstance.handleInputChange(event)"/>
    </foreignObject>
    ` : '';

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" opacity="${this.props.opacity}" style="display: ${this.props.visible === 0 ? 'none' : 'block'};">
      ${textElement}
      ${sliderElement}
      ${valueTextElement}
    </svg>
    `;
  }

  // Helper methods for skew functionality
  getSkewedValue(linearValue) {
    const range = CabbageUtils.getChannelRange(this.props, 0);
    const normalizedValue = (linearValue - range.min) / (range.max - range.min);
    // Invert the skew for JUCE-like behavior
    const skewedNormalizedValue = Math.pow(normalizedValue, 1 / range.skew);
    return skewedNormalizedValue * (range.max - range.min) + range.min;
  }

  getLinearValue(skewedValue) {
    const range = CabbageUtils.getChannelRange(this.props, 0);
    const normalizedValue = (skewedValue - range.min) / (range.max - range.min);
    // Invert the skew for JUCE-like behavior
    const linearNormalizedValue = Math.pow(normalizedValue, range.skew);
    return linearNormalizedValue * (range.max - range.min) + range.min;
  }
}
