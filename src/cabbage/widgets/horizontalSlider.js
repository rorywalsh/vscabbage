// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { Cabbage } from "../cabbage.js";
import { CabbageUtils, CabbageColours } from "../utils.js";

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
          "background": "#ffffff"
        }
      },
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

  pointerUp() {
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

    let textWidth = this.props.text ? CabbageUtils.getStringWidth(this.props.text, this.props) : 0;
    textWidth = this.props.sliderOffsetX > 0 ? this.props.sliderOffsetX : textWidth;
    const valueTextBoxWidth = this.props.valueTextBox ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth;

    if (evt.offsetX >= textWidth && evt.offsetX <= textWidth + sliderWidth && evt.target.tagName !== "INPUT") {
      this.isMouseDown = true;
      this.startX = evt.offsetX - textWidth;
      this.props.value = CabbageUtils.map(this.startX, 0, sliderWidth, this.props.range.min, this.props.range.max);

      window.addEventListener("pointermove", this.moveListener);
      window.addEventListener("pointerup", this.upListener);

      this.props.value = Math.round(this.props.value ?? this.props.range.defaultValue / this.props.range.increment) * this.props.range.increment;
      this.startValue = this.props.value;
      CabbageUtils.updateInnerHTML(this.props.channel, this);
    }
  }

  mouseEnter(evt) {
    if (this.props.active === 0) {
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
        console.log("Cabbage: SliderTop" + popupTop);
        console.log("Cabbage: ForHeight" +  mainFormHeight);

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
    let textWidth = this.props.text ? CabbageUtils.getStringWidth(this.props.text, this.props) : 0;
    textWidth = this.props.sliderOffsetX > 0 ? this.props.sliderOffsetX : textWidth;
    const valueTextBoxWidth = this.props.valueTextBox ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth;

    // Get the bounding rectangle of the slider
    const sliderRect = document.getElementById(this.props.channel).getBoundingClientRect();

    // Calculate the relative position of the mouse pointer within the slider bounds
    let offsetX = clientX - sliderRect.left - textWidth;

    // Clamp the mouse position to stay within the bounds of the slider
    offsetX = CabbageUtils.clamp(offsetX, 0, sliderWidth);

    // Calculate the new value based on the mouse position
    let newValue = CabbageUtils.map(offsetX, 0, sliderWidth, this.props.range.min, this.props.range.max);
    newValue = Math.round(newValue / this.props.range.increment) * this.props.range.increment; // Round to the nearest increment

    // Update the slider value
    this.props.value = newValue;

    // Update the slider appearance
    CabbageUtils.updateInnerHTML(this.props.channel, this);

    //get normalised value
    const normValue = CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, 1);
    // Post message if vscode is available
    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: normValue, channelType: "number" }
    console.log(newValue);
    Cabbage.sendParameterUpdate(msg, this.vscode);
  }

  handleInputChange(evt) {
    if (evt.key === 'Enter') {
      const inputValue = parseFloat(evt.target.value);
      if (!isNaN(inputValue) && inputValue >= this.props.range.min && inputValue <= this.props.range.max) {
        this.props.value = inputValue;
        CabbageUtils.updateInnerHTML(this.props.channel, this);
        widgetDiv.querySelector('input').focus();
      }
    }
  }

  getInnerHTML() {
    if (this.props.visible === 0) {
      return '';
    }
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
    let textWidth = this.props.text ? CabbageUtils.getStringWidth(this.props.text, this.props) : 0;
    textWidth = (this.props.sliderOffsetX > 0 ? this.props.sliderOffsetX : textWidth) - padding;
    const valueTextBoxWidth = this.props.valueTextBox ? CabbageUtils.getNumberBoxWidth(this.props) : 0;
    const sliderWidth = this.props.bounds.width - textWidth - valueTextBoxWidth - padding; // Subtract padding from sliderWidth

    const w = (sliderWidth > this.props.bounds.height ? this.props.bounds.height : sliderWidth) * 0.75;
    const textY = this.props.bounds.height / 2 + (this.props.font.size > 0 ? this.props.textOffsetY : 0) + (this.props.bounds.height * 0.25); // Adjusted for vertical centering
    const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.8;

    textWidth += padding;

    const textElement = this.props.text ? `
      <svg x="0" y="0" width="${textWidth}" height="${this.props.bounds.height}" preserveAspectRatio="xMinYMid meet" xmlns="http://www.w3.org/2000/svg">
        <text text-anchor="${svgAlign}" x="${svgAlign === 'end' ? textWidth - padding : (svgAlign === 'middle' ? (textWidth - padding) / 2 : 0)}" y="${textY}" font-size="${fontSize}px" font-family="${this.props.font.family}" stroke="none" fill="${this.props.font.colour}"> <!-- Updated to use this.props.font.colour -->
          ${this.props.text}
        </text>
      </svg>
    ` : '';

    const sliderElement = `
      <svg x="${textWidth}" width="${sliderWidth}" height="${this.props.bounds.height}" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="${this.props.opacity}">
        <rect x="1" y="${this.props.bounds.height * .2}" width="${sliderWidth - 2}" height="${this.props.bounds.height * .6}" rx="4" fill="${this.props.colour.tracker.background}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/>
        <rect x="1" y="${this.props.bounds.height * .2}" width="${Math.max(0, CabbageUtils.map(currentValue, this.props.range.min, this.props.range.max, 0, sliderWidth))}" height="${this.props.bounds.height * .6}" rx="4" fill="${this.props.colour.tracker.fill}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/> 
        <rect x="${CabbageUtils.map(currentValue, this.props.range.min, this.props.range.max, 0, sliderWidth - sliderWidth * .05 - 1) + 1}" y="0" width="${sliderWidth * .05 - 1}" height="${this.props.bounds.height}" rx="4" fill="${this.props.colour.fill}" stroke-width="${this.props.colour.stroke.width}" stroke="${this.props.colour.stroke.colour}"/>
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
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none">
        ${textElement}
        ${sliderElement}
        ${valueTextElement}
      </svg>
    `;
  }
}
