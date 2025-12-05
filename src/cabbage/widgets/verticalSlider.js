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
        {
          "id": "vslider",
          "range": { "defaultValue": 0, "increment": 1, "max": 1, "min": 0, "skew": 1 },
          "event": "valueChanged"
        }
      ],
      "value": null,
      "zIndex": 0,
      "type": "verticalSlider",
      "velocity": 0,
      "visible": true,
      "active": true,
      "popup": false,
      "automatable": true,

      "label": {
        "text": ""
      },

      "valueText": {
        "visible": true,
        "width": "auto",
        "prefix": "",
        "postfix": ""
      },

      "style": {
        "opacity": 1,

        "thumb": {
          "width": "auto",
          "height": "auto",
          "backgroundColor": "#0295cf",
          "borderColor": "#525252",
          "borderWidth": 2
        },

        "track": {
          "width": "auto",
          "fillColor": "#93d200",
          "backgroundColor": "#ffffff"
        },

        "label": {
          "fontFamily": "Verdana",
          "fontSize": "auto",
          "fontColor": "#dddddd",
          "textAlign": "center"
        },

        "valueText": {
          "fontFamily": "Verdana",
          "fontSize": "auto",
          "fontColor": "#dddddd"
        }
      }
    };

    this.moveListener = this.pointerMove.bind(this);
    this.upListener = this.pointerUp.bind(this);
    this.startY = 0; // Changed from startX to startY for vertical slider
    this.startValue = 0;
    this.vscode = null;
    this.isMouseDown = false;
    this.decimalPlaces = 0;
    this.parameterIndex = 0;
    // Wrap props with reactive proxy
    this.props = CabbageUtils.createReactiveProps(this, this.props);
  }

  pointerUp(evt) {
    if (!this.props.visible) {
      return '';
    }
    const popup = document.getElementById('popupValue');
    popup.classList.add('hide');
    popup.classList.remove('show');

    // Release pointer capture
    if (this.activePointerId !== undefined && this.widgetDiv) {
      try {
        this.widgetDiv.releasePointerCapture(this.activePointerId);
      } catch (e) {
        // Ignore errors if pointer was already released
      }
      this.activePointerId = undefined;
    }

    if (this.boundPointerMove) window.removeEventListener("pointermove", this.boundPointerMove);
    if (this.boundPointerUp) window.removeEventListener("pointerup", this.boundPointerUp);
    this.isMouseDown = false;
  }

  pointerDown(evt) {
    if (!this.props.visible) {
      return '';
    }

    // Respect active flag
    if (!this.props.active) return '';

    // Don't perform slider actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const range = CabbageUtils.getChannelRange(this.props, 0);

    let textHeight = this.props.label.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueText.visible ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight;

    // Guard against invalid ranges or slider dimensions
    if (sliderHeight <= 0 || range.max - range.min === 0) {
      console.warn('VerticalSlider pointerDown: Invalid slider dimensions or range', { sliderHeight, range });
      return '';
    }

    const sliderTop = this.props.valueText.visible ? textHeight : 0; // Adjust slider top position if valueText is present

    if (evt.offsetY >= sliderTop && evt.offsetY <= sliderTop + sliderHeight) {
      this.isMouseDown = true;

      // Capture pointer to ensure we receive pointerup even if pointer leaves element
      this.widgetDiv.setPointerCapture(evt.pointerId);
      this.activePointerId = evt.pointerId;

      this.startY = evt.offsetY - sliderTop;
      this.props.value = CabbageUtils.map(this.startY, 5, sliderHeight, range.max, range.min);
      this.props.value = Math.round(this.props.value / range.increment) * range.increment;
      this.startValue = this.props.value;
      const moveHandler = this.boundPointerMove || this.moveListener;
      const upHandler = this.boundPointerUp || this.upListener;
      if (!this.boundPointerMove) this.boundPointerMove = moveHandler;
      if (!this.boundPointerUp) this.boundPointerUp = upHandler;
      window.addEventListener("pointermove", this.boundPointerMove);
      window.addEventListener("pointerup", this.boundPointerUp);
      CabbageUtils.updateInnerHTML(this.props, this);

      console.log('VerticalSlider pointerDown: parameterIndex =', this.parameterIndex, 'automatable =', this.props.automatable);
      console.log('VerticalSlider pointerMove: parameterIndex =', this.parameterIndex, 'automatable =', this.props.automatable);
      // Send denormalized value directly to backend
      const valueToSend = this.props.value;
      if (isNaN(valueToSend) || !isFinite(valueToSend)) {
        console.error('VerticalSlider pointerMove: Invalid value to send:', valueToSend, 'range:', range);
        return;
      }
      const msg = { paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0), channel: CabbageUtils.getChannelId(this.props), value: valueToSend, channelType: "number" };
      console.log('VerticalSlider pointerMove sending:', msg);
      Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);

    }
  }

  mouseEnter(evt) {
    // If mouse button is down (dragging) and we're not the one being dragged, ignore
    if (evt.buttons !== 0 && !this.isMouseDown) {
      return;
    }

    if (!this.props.visible) {
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

    if (popup && this.props.popup) {
      popup.textContent = this.props.valueText.prefix + parseFloat(this.props.value ?? range.defaultValue).toFixed(this.decimalPlaces) + this.props.valueText.postfix;

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
    this.widgetDiv = widgetDiv;
    this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
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
        const widgetDiv = CabbageUtils.getWidgetDiv(this.props);
        if (widgetDiv) {
          widgetDiv.innerHTML = this.getInnerHTML();
          const input = widgetDiv.querySelector('input');
          if (input) input.focus();
        }
      }
    }
  }

  pointerMove({ clientY }) {
    if (!this.props.visible) {
      return '';
    }

    // Respect active flag
    if (!this.props.active) return '';

    // Don't perform slider actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const range = CabbageUtils.getChannelRange(this.props, 0);
    let textHeight = this.props.label.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueText.visible ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight;

    // Guard against invalid ranges or slider dimensions
    if (sliderHeight <= 0 || range.max - range.min === 0) {
      console.warn('VerticalSlider pointerMove: Invalid slider dimensions or range', { sliderHeight, range });
      return '';
    }

    // Get the bounding rectangle of the slider
    const sliderRect = CabbageUtils.getWidgetDiv(this.props).getBoundingClientRect();

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
    const widgetDiv = CabbageUtils.getWidgetDiv(this.props);
    widgetDiv.innerHTML = this.getInnerHTML();

    // Send denormalized value directly to backend
    const valueToSend = skewedValue;
    if (isNaN(valueToSend) || !isFinite(valueToSend)) {
      console.error('VerticalSlider pointerMove: Invalid value to send:', valueToSend, 'range:', range);
      return;
    }
    const msg = { paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0), channel: CabbageUtils.getChannelId(this.props), value: valueToSend, channelType: "number" };
    console.log('VerticalSlider pointerMove sending:', msg);
    if (this.props.automatable) {
      Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);
    }
  }

  getInnerHTML() {
    const range = CabbageUtils.getChannelRange(this.props, 0);
    const currentValue = this.props.value ?? range.defaultValue;
    const popup = document.getElementById('popupValue');
    if (popup) {
      popup.textContent = this.props.valueText.prefix + parseFloat(currentValue).toFixed(this.decimalPlaces) + this.props.valueText.postfix;
    }

    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };

    const svgAlign = alignMap[this.props.style.label.textAlign] || this.props.style.label.textAlign;

    // Calculate text height
    let textHeight = this.props.label.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueText.visible ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight * 1.1;

    // Calculate fontSize - use explicit fontSize if provided, otherwise calculate from widget width
    // Use smaller multiplier (0.13) to fit text better in bounds
    const fontSize = this.props.style.label.fontSize !== "auto" && this.props.style.label.fontSize > 0 ? this.props.style.label.fontSize : this.props.bounds.width * 0.13;

    // For vertical sliders, the track/thumb should be sized based on a standard narrow width,
    // not the full bounds.width (which might be wide to accommodate labels).
    // Use min of bounds.width or a reasonable max (e.g., 60px) as the basis for auto calculations.
    const sliderControlWidth = Math.min(this.props.bounds.width, 60);

    const trackWidth = this.props.style.track.width === "auto" ? sliderControlWidth * 0.15 : this.props.style.track.width;
    const thumbWidth = this.props.style.thumb.width === "auto" ? sliderControlWidth * 0.3 : this.props.style.thumb.width;
    const thumbHeight = this.props.style.thumb.height === "auto" ? Math.min(trackWidth * 2, sliderHeight * 0.08) : this.props.style.thumb.height;

    const textElement = this.props.label.text ? `
    <foreignObject x="0" y="${this.props.valueText.visible ? 0 : this.props.bounds.height - textHeight}" width="${this.props.bounds.width}" height="${textHeight + 5}">
      <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:${fontSize}px; font-family:${this.props.style.label.fontFamily}; color:${this.props.style.label.fontColor};">
        ${this.props.label.text}
      </div>
    </foreignObject>
    ` : '';

    // calculate Y offset to center the track vertically
    const trackY = 0;

    // Center the track and thumb horizontally
    const trackX = (this.props.bounds.width - trackWidth) / 2;
    const thumbX = (this.props.bounds.width - thumbWidth) / 2;

    const sliderElement = `
    <svg x="0" y="${this.props.valueText.visible ? textHeight + 2 : 0}" width="${this.props.bounds.width}" height="${sliderHeight}" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="${this.props.style.opacity}">
      <rect x="${trackX}" y="${trackY}" width="${trackWidth}" height="${sliderHeight}" rx="2" fill="${this.props.style.track.backgroundColor}" stroke-width="${this.props.style.thumb.borderWidth}" stroke="${this.props.style.thumb.borderColor}"/>
      <rect x="${trackX}" y="${trackY + sliderHeight - CabbageUtils.map(this.getLinearValue(currentValue), range.min, range.max, 0, sliderHeight)}" height="${CabbageUtils.map(this.getLinearValue(currentValue), range.min, range.max, 0, sliderHeight)}" width="${trackWidth}" rx="2" fill="${this.props.style.track.fillColor}" stroke-width="${this.props.style.thumb.borderWidth}" stroke="${this.props.style.thumb.borderColor}"/> 
  <rect x="${thumbX}" y="${sliderHeight - CabbageUtils.map(this.getLinearValue(currentValue), range.min, range.max, thumbHeight + 1, sliderHeight - 1)}" width="${thumbWidth}" height="${thumbHeight}" rx="2" fill="${this.props.style.thumb.backgroundColor}" stroke-width="${this.props.style.thumb.borderWidth}" stroke="${this.props.style.thumb.borderColor}"/>
    </svg>
    `;

    const valueTextElement = this.props.valueText.visible ? `
    <foreignObject x="0" y="${this.props.bounds.height - valueTextBoxHeight * 1.2}" width="${this.props.bounds.width}" height="${valueTextBoxHeight * 1.2}">
      <input type="text" value="${currentValue.toFixed(CabbageUtils.getDecimalPlaces(range.increment))}"
      style="width:100%; outline: none; height:100%; text-align:center; font-size:${this.props.style.valueText.fontSize !== "auto" && this.props.style.valueText.fontSize > 0 ? this.props.style.valueText.fontSize : fontSize}px; font-family:${this.props.style.valueText.fontFamily}; color:${this.props.style.valueText.fontColor}; background:none; border:none; padding:0; margin:0;"
      onKeyDown="document.getElementById('${CabbageUtils.getWidgetDivId(this.props)}').VerticalSliderInstance.handleInputChange(event)"/>
    </foreignObject>
    ` : '';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" opacity="${this.props.style.opacity}" style="display: ${this.props.visible ? 'block' : 'none'}; pointer-events: ${this.props.visible && this.props.active ? 'auto' : 'none'};">
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
