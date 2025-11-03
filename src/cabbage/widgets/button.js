// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";
import { handleRadioGroup } from "../radioGroup.js";
import { getCabbageMode } from "../sharedState.js";

export class Button {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 80,
        "height": 30
      },
      "id": "",
      "channels": [
        {
          "id": "button",
          "event": "valueChanged"
        }
      ],
      "value": null,
      "index": 0,
      "visible": true,
      "active": true,
      "automatable": true,
      "presetIgnore": false,
      "radioGroup": -1,
      "type": "button",
      "opacity": 1,

      "shape": {
        "borderRadius": 6,
        "borderWidth": 0,
        "borderColor": "#dddddd"
      },

      "state": {
        "on": {
          "backgroundColor": "#3d800a",
          "textColor": "#dddddd"
        },
        "off": {
          "backgroundColor": "#3d800a",
          "textColor": "#dddddd"
        },
        "hover": {
          "backgroundColor": "#4ca10c"
        },
        "active": {
          "backgroundColor": "#2d6008"
        }
      },

      "label": {
        "text": {
          "on": "On",
          "off": "Off"
        },
        "fontFamily": "Verdana",
        "fontSize": "auto",
        "textAlign": "center"
      }
    };

    this.vscode = null;
    this.isMouseDown = false;
    this.isMouseInside = false;
    this.parameterIndex = 0;
  }

  pointerUp() {
    if (this.props.active === false || this.props.active === 0) {
      return '';
    }
    this.isMouseDown = false;
    CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
  }

  pointerDown() {
    if (this.props.active === false || this.props.active === 0) {
      return '';
    }

    // Don't perform button actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    console.log("Cabbage: pointerDown");
    this.isMouseDown = true;
    const range = CabbageUtils.getChannelRange(this.props, 0, 'click');
    if (this.props.value === null) {
      this.props.value = range.defaultValue;
    }

    // For radioGroup buttons: if already on, stay on; if off, turn on and deactivate others
    if (this.props.radioGroup && this.props.radioGroup !== -1) {
      if (this.props.value === range.min) {
        this.props.value = range.max;
        handleRadioGroup(this.props.radioGroup, CabbageUtils.getChannelId(this.props));
      }
      // If already max, do nothing (stay selected)
    } else {
      // Normal toggle behavior for buttons not in radioGroup
      this.props.value = (this.props.value === range.min ? range.max : range.min);
    }

    CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
    const msg = { paramIdx: this.parameterIndex, channel: CabbageUtils.getChannelId(this.props), value: this.props.value }
    console.log(msg);

    Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);

  }

  pointerEnter() {
    if (this.props.active === false || this.props.active === 0) {
      return '';
    }
    this.isMouseOver = true;
    CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
  }

  pointerLeave() {
    if (this.props.active === false || this.props.active === 0) {
      return '';
    }
    this.isMouseOver = false;
    CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
  }

  handleMouseMove(evt) {
    const rect = evt.currentTarget.getBoundingClientRect();
    const isInside = (
      evt.clientX >= rect.left &&
      evt.clientX <= rect.right &&
      evt.clientY >= rect.top &&
      evt.clientY <= rect.bottom
    );

    if (this.isMouseInside !== isInside) {
      this.isMouseInside = isInside;
      CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
    }
  }

  addVsCodeEventListeners(widgetDiv, vs) {
    console.log("Cabbage: addVsCodeEventListeners");
    this.vscode = vs;
    this.addEventListeners(widgetDiv);
  }

  addEventListeners(widgetDiv) {
    widgetDiv.addEventListener("pointerup", this.pointerUp.bind(this));
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.addEventListener("mousemove", this.handleMouseMove.bind(this));
    widgetDiv.addEventListener("mouseleave", () => {
      this.isMouseInside = false;
      CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
    });
  }

  getInnerHTML() {
    // Use defaultValue for visual state when value is null
    const currentValue = this.props.value !== null ? this.props.value : CabbageUtils.getChannelRange(this.props, 0, 'click').defaultValue;

    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };

    const svgAlign = alignMap[this.props.label.textAlign] || this.props.label.textAlign;
    const fontSize = this.props.label.fontSize === "auto" || this.props.label.fontSize === 0 ? this.props.bounds.height * 0.4 : this.props.label.fontSize;
    const padding = 5;

    let textX;
    if (this.props.label.textAlign === 'left') {
      textX = this.props.shape.borderRadius + padding;
    } else if (this.props.label.textAlign === 'right') {
      textX = this.props.bounds.width - this.props.shape.borderRadius - padding;
    } else {
      textX = this.props.bounds.width / 2;
    }

    const buttonText = (this.props.type === "fileButton" || this.props.type === "infoButton") ?
      (currentValue === 1 ? this.props.label.text.on : this.props.label.text.off) :
      (currentValue === 1 ? this.props.label.text.on : this.props.label.text.off);

    // Determine background color based on state
    const isOn = currentValue === 1;
    const baseColour = isOn ? this.props.state.on.backgroundColor : this.props.state.off.backgroundColor;
    
    // Apply hover or active state if applicable
    let currentColour = baseColour;
    if (this.isMouseDown && this.props.state.active.backgroundColor) {
      currentColour = this.props.state.active.backgroundColor;
    } else if (this.isMouseInside && this.props.state.hover.backgroundColor) {
      currentColour = this.props.state.hover.backgroundColor;
    }

    // Determine text color
    const textColour = isOn ? this.props.state.on.textColor : this.props.state.off.textColor;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" 
           width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.opacity}" style="display: ${this.props.visible === false || this.props.visible === 0 ? 'none' : 'block'};">
        <rect x="0" y="0" width="100%" height="100%" fill="${currentColour}" stroke="${this.props.shape.borderColor}"
          stroke-width="${this.props.shape.borderWidth}" rx="${this.props.shape.borderRadius}" ry="${this.props.shape.borderRadius}"></rect>
        <text x="${textX}" y="50%" font-family="${this.props.label.fontFamily}" font-size="${fontSize}"
          fill="${textColour}" text-anchor="${svgAlign}" dominant-baseline="middle">${buttonText}</text>
      </svg>
    `;
  }
}



