// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { Cabbage } from "../cabbage.js";
import { CabbageUtils, CabbageColours } from "../utils.js";

/**
 * Horizontal Range Slider class
 */
export class HorizontalRangeSlider {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 160,
        "height": 40
      },
      "channels": [
        { "id": "hrslider", "event": "valueChanged" }
      ],
      "value": null,
      "zIndex": 0,
      "type": "horizontalRangeSlider",
      "velocity": 0,
      "popup": false,
      "visible": true,
      "active": true,
      "automatable": true,
      "presetIgnore": false,

      "label": {
        "text": "",
        "offsetX": 0
      },

      "valueText": {
        "visible": false,
        "width": "auto",
        "prefix": "",
        "postfix": ""
      },

      "marker": {
        "thickness": 0.2,
        "start": 0.1,
        "end": 0.9
      },

      "style": {
        "opacity": 1,

        "thumb": {
          "width": 8,
          "fillColor": "#0295cf",
          "borderColor": "#525252",
          "borderWidth": 1,
          "corners": 4
        },

        "track": {
          "fillColor": "#93d200",
          "backgroundColor": "#ffffff",
          "height": 12
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
    // Wrap props with reactive proxy
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
    let textWidth = this.props.label.text ? CabbageUtils.getStringWidth(this.props.label.text, this.props, 20) : 0;
    textWidth = this.props.label.offsetX > 0 ? this.props.label.offsetX : textWidth;
    const valueTextBoxWidth = this.props.valueText.visible ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth;

    if (evt.offsetX >= textWidth && evt.offsetX <= textWidth + sliderWidth && evt.target.tagName !== "INPUT") {
      this.isMouseDown = true;
      this.startX = evt.offsetX - textWidth;
      this.props.channels[0].range.value = CabbageUtils.map(this.startX, 0, sliderWidth, range.min, range.max);

      // Capture pointer to ensure we receive pointerup even if pointer leaves element
      evt.target.setPointerCapture(evt.pointerId);
      this.activePointerId = evt.pointerId;

      const moveHandler = this.boundPointerMove || this.moveListener;
      const upHandler = this.boundPointerUp || this.upListener;
      if (!this.boundPointerMove) this.boundPointerMove = moveHandler;
      if (!this.boundPointerUp) this.boundPointerUp = upHandler;
      window.addEventListener("pointermove", this.boundPointerMove);
      window.addEventListener("pointerup", this.boundPointerUp);

      this.props.channels[0].range.value = Math.round(this.props.channels[0].range.value / range.increment) * range.increment;
      this.startValue = this.props.channels[0].range.value;
      CabbageUtils.updateInnerHTML(this.props, this);
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
      popup.textContent = this.props.valueText.prefix + parseFloat(this.props.channels[0].range.value ?? range.defaultValue).toFixed(this.decimalPlaces) + this.props.valueText.postfix;

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

      const popupTop = rect.top + this.props.top; // Adjust top position relative to the form's top

      // Set the calculated position
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
    let textWidth = this.props.label.text ? CabbageUtils.getStringWidth(this.props.label.text, this.props, 20) : 0;
    textWidth = this.props.label.offsetX > 0 ? this.props.label.offsetX : textWidth;
    const valueTextBoxWidth = this.props.valueText.visible ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth;

    // Get the bounding rectangle of the slider
    const sliderRect = CabbageUtils.getWidgetDiv(this.props).getBoundingClientRect();

    // Respect active flag
    if (!this.props.active) return '';

    // Calculate the relative position of the mouse pointer within the slider bounds
    let offsetX = clientX - sliderRect.left - textWidth;

    // Clamp the mouse position to stay within the bounds of the slider
    offsetX = CabbageUtils.clamp(offsetX, 0, sliderWidth);

    // Calculate the new value based on the mouse position
    let newValue = CabbageUtils.map(offsetX, 0, sliderWidth, range.min, range.max);
    newValue = Math.round(newValue / range.increment) * range.increment; // Round to the nearest increment

    // Update the slider value
    this.props.channels[0].range.value = newValue;

    // Update the slider appearance
    CabbageUtils.updateInnerHTML(this.props, this);

    // Send denormalized value directly to backend
    const valueToSend = this.props.channels[0].range.value;
    console.log("Cabbage: Sending value: " + valueToSend);
    // Post message if vscode is available
    const msg = { paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0), channel: CabbageUtils.getChannelId(this.props), value: valueToSend, channelType: "number" }

    Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);

  }

  handleInputChange(evt) {
    // Don't allow input changes in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const range = CabbageUtils.getChannelRange(this.props, 0);

    if (evt.key === 'Enter') {
      const inputValue = parseFloat(evt.target.value);
      if (!isNaN(inputValue) && inputValue >= range.min && inputValue <= range.max) {
        this.props.channels[0].range.value = inputValue;
        CabbageUtils.updateInnerHTML(this.props, this);
        widgetDiv.querySelector('input').focus();
      }
    }
  }

  getInnerHTML() {
    const range = CabbageUtils.getChannelRange(this.props, 0);
    const currentValue = this.props.channels[0].range.value ?? range.defaultValue;
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

    // Calculate fontSize
    const fontSize = this.props.style.label.fontSize !== "auto" && this.props.style.label.fontSize > 0 ? this.props.style.label.fontSize : this.props.bounds.height * 0.6;
    const textY = this.props.bounds.height / 2 + (this.props.bounds.height * 0.25);

    textWidth += padding;

    const textElement = this.props.label.text ? `
      <foreignObject x="0" y="0" width="${textWidth}" height="${this.props.bounds.height}">
        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:${svgAlign === 'end' ? 'flex-end' : (svgAlign === 'middle' ? 'center' : 'flex-start')}; font-size:${fontSize}px; font-family:${this.props.style.label.fontFamily}; color:${this.props.style.label.fontColor}; padding-right:${svgAlign === 'end' ? padding : 0}px;">
          ${this.props.label.text}
        </div>
      </foreignObject>
    ` : '';

    // Use track height from props
    const trackHeight = this.props.style.track.height;
    const trackY = (this.props.bounds.height - trackHeight) / 2;

    const sliderElement = `
      <svg x="${textWidth}" width="${sliderWidth}" height="${this.props.bounds.height}" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="${this.props.style.opacity}">
        <rect x="1" y="${trackY}" width="${sliderWidth - 2}" height="${trackHeight}" rx="4" fill="${this.props.style.track.backgroundColor}" stroke-width="${this.props.style.thumb.borderWidth}" stroke="${this.props.style.thumb.borderColor}"/>
        <rect x="1" y="${trackY}" width="${Math.max(0, CabbageUtils.map(currentValue, range.min, range.max, 0, sliderWidth))}" height="${trackHeight}" rx="4" fill="${this.props.style.track.fillColor}" stroke-width="${this.props.style.thumb.borderWidth}" stroke="${this.props.style.thumb.borderColor}"/> 
        <rect x="${CabbageUtils.map(currentValue, range.min, range.max, 0, sliderWidth - this.props.style.thumb.width - 1) + 1}" y="0" width="${this.props.style.thumb.width}" height="${this.props.bounds.height}" rx="${this.props.style.thumb.corners}" fill="${this.props.style.thumb.fillColor}" stroke-width="${this.props.style.thumb.borderWidth}" stroke="${this.props.style.thumb.borderColor}"/>
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" style="display: ${this.props.visible ? 'block' : 'none'}; pointer-events: ${this.props.visible && this.props.active ? 'auto' : 'none'};">
        ${textElement}
        ${sliderElement}
        ${valueTextElement}
      </svg>
    `;
  }
}
