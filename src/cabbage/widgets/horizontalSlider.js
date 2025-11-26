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
      "channels": [
        {
          "id": "hslider",
          "range": { "defaultValue": 0, "increment": 0.001, "max": 1, "min": 0, "skew": 1 },
          "event": "valueChanged"
        }
      ],
      "value": null,
      "zIndex": 0,
      "type": "horizontalSlider",
      "visible": true,
      "popup": false,
      "active": true,
      "automatable": true,
      "presetIgnore": false,

      "label": {
        "text": "",
        "offsetX": 0
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
          "borderWidth": 2,
          "borderRadius": 4
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

    this.parameterIndex = 0;
    this.moveListener = this.pointerMove.bind(this);
    this.upListener = this.pointerUp.bind(this);
    this.startX = 0;
    this.startValue = 0;
    this.vscode = null;
    this.isMouseDown = false;
    this.decimalPlaces = 0;
    // Wrap props with reactive proxy to manage visible/active and cleanup
    this.props = CabbageUtils.createReactiveProps(this, this.props);
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
    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };
    const svgAlign = alignMap[this.props.style.label.textAlign] || this.props.style.label.textAlign;
    const padding = (svgAlign === 'end' || svgAlign === 'middle') ? 5 : 0;

    let textWidth = this.props.label.text ? CabbageUtils.getStringWidth(this.props.label.text, this.props, 20) : 0;
    textWidth = (this.props.label.offsetX > 0 ? this.props.label.offsetX : textWidth) - padding;
    const valueTextBoxWidth = this.props.valueText.visible ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
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
      const skewedNormalized = Math.pow(linearNormalized, 1 / range.skew);
      console.log(`pointerDown: skewedNormalized=${skewedNormalized}`);

      // Convert to actual range values
      let skewedValue = skewedNormalized * (range.max - range.min) + range.min;
      console.log(`pointerDown: skewedValue before rounding=${skewedValue}`);

      // Apply increment snapping to the skewed value
      skewedValue = Math.round(skewedValue / range.increment) * range.increment;
      console.log(`pointerDown: skewedValue after rounding=${skewedValue}`);

      this.props.value = skewedValue;

      // Capture pointer to ensure we receive pointerup even if pointer leaves element
      evt.target.setPointerCapture(evt.pointerId);
      this.activePointerId = evt.pointerId;

      const moveHandler = this.boundPointerMove || this.moveListener;
      const upHandler = this.boundPointerUp || this.upListener;
      if (!this.boundPointerMove) this.boundPointerMove = moveHandler;
      if (!this.boundPointerUp) this.boundPointerUp = upHandler;
      window.addEventListener("pointermove", this.boundPointerMove);
      window.addEventListener("pointerup", this.boundPointerUp);

      this.startValue = this.props.value;
      CabbageUtils.updateInnerHTML(this.props, this);

      // Send denormalized value directly to backend
      const valueToSend = skewedValue;
      const msg = { paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0), channel: CabbageUtils.getChannelId(this.props), value: valueToSend, channelType: "number" };
      console.log(`pointerDown: sending valueToSend=${valueToSend}`);

      Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);


    }

  }

  mouseEnter(evt) {
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
    if (!this.props.visible) {
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
    this.widgetDiv = widgetDiv;
    this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
    this.addEventListeners(widgetDiv);
  }

  addEventListeners(widgetDiv) {
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.addEventListener("mouseenter", this.mouseEnter.bind(this));
    widgetDiv.addEventListener("mouseleave", this.mouseLeave.bind(this));
    widgetDiv.HorizontalSliderInstance = this;
  }

  pointerMove({ clientX }) {
    if (!this.props.visible) {
      return '';
    }

    // Don't perform slider actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const range = CabbageUtils.getChannelRange(this.props, 0);
    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };
    const svgAlign = alignMap[this.props.style.label.textAlign] || this.props.style.label.textAlign;
    const padding = (svgAlign === 'end' || svgAlign === 'middle') ? 5 : 0;

    let textWidth = this.props.label.text ? CabbageUtils.getStringWidth(this.props.label.text, this.props, 20) : 0;
    textWidth = (this.props.label.offsetX > 0 ? this.props.label.offsetX : textWidth) - padding;
    const valueTextBoxWidth = this.props.valueText.visible ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth - padding;
    textWidth += padding;

    // Get the bounding rectangle of the slider
    const sliderRect = CabbageUtils.getWidgetDiv(this.props).getBoundingClientRect();

    // Calculate the relative position of the mouse pointer within the slider bounds
    let offsetX = clientX - sliderRect.left - textWidth;

    // Clamp the mouse position to stay within the bounds of the slider
    offsetX = CabbageUtils.clamp(offsetX, 0, sliderWidth);

    // Calculate the linear normalized position (0-1)
    const linearNormalized = offsetX / sliderWidth;

    // Apply skew transformation for display value
    const skewedNormalized = Math.pow(linearNormalized, 1 / range.skew);

    // Convert to actual range values
    const linearValue = linearNormalized * (range.max - range.min) + range.min;
    let skewedValue = skewedNormalized * (range.max - range.min) + range.min;

    // Apply increment snapping to the skewed value
    skewedValue = Math.round(skewedValue / range.increment) * range.increment;

    // Store the skewed value for display
    this.props.value = skewedValue;

    console.log(`pointerMove: offsetX=${offsetX}, linearNormalized=${linearNormalized}, skewedValue=${skewedValue}`);

    // Update the slider appearance
    CabbageUtils.updateInnerHTML(this.props, this);

    // Send denormalized value directly to backend
    const valueToSend = skewedValue;
    const msg = { paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0), channel: CabbageUtils.getChannelId(this.props), value: valueToSend, channelType: "number" }
    console.log(`pointerMove: sending valueToSend=${valueToSend}`);
    if (this.props.automatable) {
      Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);
    }
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
        // Store the input value as the skewed value (what user sees)
        this.props.value = inputValue;

        // Convert to linear space for Cabbage
        const linearValue = this.getLinearValue(inputValue);
        const linearNormalized = (linearValue - range.min) / (range.max - range.min);

        CabbageUtils.updateInnerHTML(this.props, this);
        const widgetDiv = CabbageUtils.getWidgetDiv(this.props);
        widgetDiv.querySelector('input').focus();

        // Send denormalized value directly to backend
        const valueToSend = inputValue;
        const msg = {
          paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0),
          channel: CabbageUtils.getChannelId(this.props),
          value: valueToSend,
          channelType: "number"
        };

        Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);

      }
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

    // Add padding if alignment is 'end' or 'middle'
    const padding = (svgAlign === 'end' || svgAlign === 'middle') ? 5 : 0;

    // Calculate text width and update SVG width
    let textWidth = this.props.label.text ? CabbageUtils.getStringWidth(this.props.label.text, this.props, 20) : 0;
    textWidth = (this.props.label.offsetX > 0 ? this.props.label.offsetX : textWidth) - padding;
    const valueTextBoxWidth = this.props.valueText.visible ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth - padding;

    // Calculate fontSize - use explicit fontSize if provided, otherwise calculate from widget height
    const fontSize = this.props.style.label.fontSize !== "auto" && this.props.style.label.fontSize > 0 ? this.props.style.label.fontSize : this.props.bounds.height * 0.4;

    // For horizontal sliders, the track/thumb should be sized based on a standard narrow height,
    // not the full bounds.height (which might be tall to accommodate labels).
    // Use min of bounds.height or a reasonable max (e.g., 60px) as the basis for auto calculations.
    const sliderControlHeight = Math.min(this.props.bounds.height, 60);

    const trackWidth = this.props.style.track.width === "auto" ? sliderControlHeight * 0.2 : this.props.style.track.width;
    const thumbWidth = this.props.style.thumb.width === "auto" ? sliderControlHeight * 0.4 : this.props.style.thumb.width;
    const thumbHeight = this.props.style.thumb.height === "auto" ? Math.min(trackWidth * 2, sliderControlHeight * 0.8) : this.props.style.thumb.height;

    textWidth += padding;

    const textElement = this.props.label.text ? `
      <foreignObject x="0" y="0" width="${textWidth}" height="${this.props.bounds.height}">
        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:${svgAlign === 'end' ? 'flex-end' : (svgAlign === 'middle' ? 'center' : 'flex-start')}; font-size:${fontSize}px; font-family:${this.props.style.label.fontFamily}; color:${this.props.style.label.fontColor}; padding-right:${svgAlign === 'end' ? padding : 0}px;">
          ${this.props.label.text}
        </div>
      </foreignObject>
    ` : '';

    // Center the track and thumb vertically
    const trackY = (this.props.bounds.height - trackWidth) / 2;
    const thumbY = (this.props.bounds.height - thumbHeight) / 2;

    const sliderElement = `
      <svg x="${textWidth}" width="${sliderWidth}" height="${this.props.bounds.height}" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="${this.props.style.opacity}">
        <rect x="1" y="${trackY}" width="${sliderWidth - 2}" height="${trackWidth}" rx="2" fill="${this.props.style.track.backgroundColor}" stroke-width="${this.props.style.thumb.borderWidth}" stroke="${this.props.style.thumb.borderColor}"/>
        <rect x="1" y="${trackY}" width="${Math.max(0, CabbageUtils.map(this.getLinearValue(currentValue), range.min, range.max, 0, sliderWidth))}" height="${trackWidth}" rx="2" fill="${this.props.style.track.fillColor}" stroke-width="${this.props.style.thumb.borderWidth}" stroke="${this.props.style.thumb.borderColor}"/> 
  <rect x="${CabbageUtils.map(this.getLinearValue(currentValue), range.min, range.max, 0, sliderWidth - thumbWidth - 1) + 1}" y="${thumbY}" width="${thumbWidth}" height="${thumbHeight}" rx="${this.props.style.thumb.borderRadius}" ry="${this.props.style.thumb.borderRadius}" fill="${this.props.style.thumb.backgroundColor}" stroke-width="${this.props.style.thumb.borderWidth}" stroke="${this.props.style.thumb.borderColor}"/>
      </svg>
    `;

    const valueTextElement = this.props.valueText.visible ? `
      <foreignObject x="${textWidth + sliderWidth}" y="0" width="${valueTextBoxWidth}" height="${this.props.bounds.height}">
        <input type="text" value="${currentValue.toFixed(CabbageUtils.getDecimalPlaces(range.increment))}"
        style="width:100%; outline: none; height:100%; text-align:center; font-size:${this.props.style.valueText.fontSize !== "auto" && this.props.style.valueText.fontSize > 0 ? this.props.style.valueText.fontSize : fontSize}px; font-family:${this.props.style.valueText.fontFamily}; color:${this.props.style.valueText.fontColor}; background:none; border:none; padding:0; margin:0;"
        onKeyDown="document.getElementById('${CabbageUtils.getWidgetDivId(this.props)}').HorizontalSliderInstance.handleInputChange(event)"/>
      </foreignObject>
    ` : '';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" style="display: ${this.props.visible ? 'block' : 'none'};">
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
