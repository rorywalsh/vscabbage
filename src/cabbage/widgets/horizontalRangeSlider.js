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
      "index": 0,

      "thumb": {
        "width": 8,
        "fill": "#0295cf",
        "borderColor": "#525252",
        "borderWidth": 1,
        "corners": 4
      },

      "track": {
        "fill": "#93d200",
        "background": "#ffffff",
        "height": 12
      },

      "label": {
        "text": "",
        "width": "auto",
        "offsetX": 0,
        "fontFamily": "Verdana",
        "fontSize": 0,
        "color": "#dddddd",
        "textAlign": "center"
      },

      "valueText": {
        "visible": false,
        "width": "auto",
        "prefix": "",
        "postfix": "",
        "fontFamily": "Verdana",
        "fontSize": 0,
        "color": "#dddddd"
      },

      "marker": {
        "thickness": 0.2,
        "start": 0.1,
        "end": 0.9
      },

      "type": "horizontalRangeSlider",
      "velocity": 0,
      "popup": false,
      "visible": true,
      "automatable": true,
      "opacity": 1,
      "presetIgnore": false
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

    const range = CabbageUtils.getChannelRange(this.props, 0);
    let textWidth = this.props.label.text ? CabbageUtils.getStringWidth(this.props.label.text, this.props, 20) : 0;
    textWidth = this.props.label.offsetX > 0 ? this.props.label.offsetX : textWidth;
    const valueTextBoxWidth = this.props.valueText.visible ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth;

    if (evt.offsetX >= textWidth && evt.offsetX <= textWidth + sliderWidth && evt.target.tagName !== "INPUT") {
      this.isMouseDown = true;
      this.startX = evt.offsetX - textWidth;
      this.props.value = CabbageUtils.map(this.startX, 0, sliderWidth, range.min, range.max);

      // Capture pointer to ensure we receive pointerup even if pointer leaves element
      evt.target.setPointerCapture(evt.pointerId);
      this.activePointerId = evt.pointerId;

      window.addEventListener("pointermove", this.moveListener);
      window.addEventListener("pointerup", this.upListener);

      this.props.value = Math.round(this.props.value / range.increment) * range.increment;
      this.startValue = this.props.value;
      CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
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

    if (popup && this.props.popup === true) {
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
    
    const range = CabbageUtils.getChannelRange(this.props, 0);
    let textWidth = this.props.label.text ? CabbageUtils.getStringWidth(this.props.label.text, this.props, 20) : 0;
    textWidth = this.props.label.offsetX > 0 ? this.props.label.offsetX : textWidth;
    const valueTextBoxWidth = this.props.valueText.visible ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth;

    // Get the bounding rectangle of the slider
    const sliderRect = document.getElementById(CabbageUtils.getChannelId(this.props)).getBoundingClientRect();

    // Calculate the relative position of the mouse pointer within the slider bounds
    let offsetX = clientX - sliderRect.left - textWidth;

    // Clamp the mouse position to stay within the bounds of the slider
    offsetX = CabbageUtils.clamp(offsetX, 0, sliderWidth);

    // Calculate the new value based on the mouse position
    let newValue = CabbageUtils.map(offsetX, 0, sliderWidth, range.min, range.max);
    newValue = Math.round(newValue / range.increment) * range.increment; // Round to the nearest increment

    // Update the slider value
    this.props.value = newValue;

    // Update the slider appearance
    CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);

    // Send denormalized value directly to backend
    const valueToSend = this.props.value;
    console.log("Cabbage: Sending value: " + valueToSend);
    // Post message if vscode is available
    const msg = { paramIdx: this.parameterIndex, channel: CabbageUtils.getChannelId(this.props), value: valueToSend, channelType: "number" }

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
        this.props.value = inputValue;
        CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
        widgetDiv.querySelector('input').focus();
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

    const svgAlign = alignMap[this.props.label.textAlign] || this.props.label.textAlign;

    // Add padding if alignment is 'end' or 'middle'
    const padding = (svgAlign === 'end' || svgAlign === 'middle') ? 5 : 0;

    // Calculate text width and update SVG width
    let textWidth = this.props.label.text ? CabbageUtils.getStringWidth(this.props.label.text, this.props, 20) : 0;
    textWidth = (this.props.label.offsetX > 0 ? this.props.label.offsetX : textWidth) - padding;
    const valueTextBoxWidth = this.props.valueText.visible ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth - padding;

    // Calculate fontSize
    const fontSize = this.props.label.fontSize > 0 ? this.props.label.fontSize : this.props.bounds.height * 0.6;
    const textY = this.props.bounds.height / 2 + (this.props.bounds.height * 0.25);

    textWidth += padding;

    const textElement = this.props.label.text ? `
      <foreignObject x="0" y="0" width="${textWidth}" height="${this.props.bounds.height}">
        <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:${svgAlign === 'end' ? 'flex-end' : (svgAlign === 'middle' ? 'center' : 'flex-start')}; font-size:${fontSize}px; font-family:${this.props.label.fontFamily}; color:${this.props.label.color}; padding-right:${svgAlign === 'end' ? padding : 0}px;">
          ${this.props.label.text}
        </div>
      </foreignObject>
    ` : '';

    // Use track height from props
    const trackHeight = this.props.track.height;
    const trackY = (this.props.bounds.height - trackHeight) / 2;

    const sliderElement = `
      <svg x="${textWidth}" width="${sliderWidth}" height="${this.props.bounds.height}" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="${this.props.opacity}">
        <rect x="1" y="${trackY}" width="${sliderWidth - 2}" height="${trackHeight}" rx="4" fill="${this.props.track.background}" stroke-width="${this.props.thumb.borderWidth}" stroke="${this.props.thumb.borderColor}"/>
        <rect x="1" y="${trackY}" width="${Math.max(0, CabbageUtils.map(currentValue, range.min, range.max, 0, sliderWidth))}" height="${trackHeight}" rx="4" fill="${this.props.track.fill}" stroke-width="${this.props.thumb.borderWidth}" stroke="${this.props.thumb.borderColor}"/> 
        <rect x="${CabbageUtils.map(currentValue, range.min, range.max, 0, sliderWidth - this.props.thumb.width - 1) + 1}" y="0" width="${this.props.thumb.width}" height="${this.props.bounds.height}" rx="${this.props.thumb.corners}" fill="${this.props.thumb.fill}" stroke-width="${this.props.thumb.borderWidth}" stroke="${this.props.thumb.borderColor}"/>
      </svg>
    `;

    const valueTextElement = this.props.valueText.visible ? `
      <foreignObject x="${textWidth + sliderWidth}" y="0" width="${valueTextBoxWidth}" height="${this.props.bounds.height}">
        <input type="text" value="${currentValue.toFixed(CabbageUtils.getDecimalPlaces(range.increment))}"
        style="width:100%; outline: none; height:100%; text-align:center; font-size:${this.props.valueText.fontSize > 0 ? this.props.valueText.fontSize : fontSize}px; font-family:${this.props.valueText.fontFamily}; color:${this.props.valueText.color}; background:none; border:none; padding:0; margin:0;"
        onKeyDown="document.getElementById('${CabbageUtils.getChannelId(this.props)}').HorizontalSliderInstance.handleInputChange(event)"/>
      </foreignObject>
    ` : '';

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" style="display: ${this.props.visible === false ? 'none' : 'block'};">
        ${textElement}
        ${sliderElement}
        ${valueTextElement}
      </svg>
    `;
  }
}
