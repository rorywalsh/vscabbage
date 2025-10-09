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
      "channel": "button",
      "corners": 6,
      "min": 0,
      "max": 1,
      "defaultValue": 0,
      "value": null,
      "text": {
        "on": "On",
        "off": "Off"
      },
      "opacity": 1,
      "font": {
        "family": "Verdana",
        "size": 0,
        "align": "centre",
        "colour": {
          "on": "#dddddd",
          "off": "#dddddd"
        }
      },
      "colour": {
        "on": {
          "fill": "#3d800a",
          "stroke": {
            "colour": "#dddddd",
            "width": 0
          }
        },
        "off": {
          "fill": "#3d800a",
          "stroke": {
            "colour": "#dddddd",
            "width": 0
          }
        }
      },
      "name": "",
      "type": "button",
      "visible": 1,
      "automatable": 1,
      "presetIgnore": 0,
      "radioGroup": -1
    };

    this.vscode = null;
    this.isMouseDown = false;
    this.isMouseInside = false;
    this.parameterIndex = 0;
  }

  pointerUp() {
    if (this.props.active === 0) {
      return '';
    }
    this.isMouseDown = false;
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

  pointerDown() {
    if (this.props.active === 0) {
      return '';
    }

    // Don't perform button actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    console.log("Cabbage: pointerDown");
    this.isMouseDown = true;
    if (this.props.value === null) {
      this.props.value = 0;
    }

    // For radioGroup buttons: if already on, stay on; if off, turn on and deactivate others
    if (this.props.radioGroup && this.props.radioGroup !== -1) {
      if (this.props.value === 0) {
        this.props.value = 1;
        handleRadioGroup(this.props.radioGroup, this.props.channel);
      }
      // If already 1, do nothing (stay selected)
    } else {
      // Normal toggle behavior for buttons not in radioGroup
      this.props.value = (this.props.value === 0 ? 1 : 0);
    }

    CabbageUtils.updateInnerHTML(this.props.channel, this);
    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: this.props.value }
    console.log(msg);
    if (this.props.automatable === 1) {
      Cabbage.sendParameterUpdate(msg, this.vscode);
    }
  }

  pointerEnter() {
    if (this.props.active === 0) {
      return '';
    }
    this.isMouseOver = true;
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

  pointerLeave() {
    if (this.props.active === 0) {
      return '';
    }
    this.isMouseOver = false;
    CabbageUtils.updateInnerHTML(this.props.channel, this);
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
      CabbageUtils.updateInnerHTML(this.props.channel, this);
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
      CabbageUtils.updateInnerHTML(this.props.channel, this);
    });
  }

  getInnerHTML() {
    // Use defaultValue for visual state when value is null
    const currentValue = this.props.value !== null ? this.props.value : this.props.defaultValue;

    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };

    const svgAlign = alignMap[this.props.font.align] || this.props.font.align;
    const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.4;
    const padding = 5;

    let textX;
    if (this.props.font.align === 'left') {
      textX = this.props.corners;
    } else if (this.props.font.align === 'right') {
      textX = this.props.bounds.width - this.props.corners - padding;
    } else {
      textX = this.props.bounds.width / 2;
    }
    const buttonText = (this.props.type === "fileButton" || this.props.type === "infoButton") ?
      (currentValue === 1 ? this.props.text.on : this.props.text.off) :
      (currentValue === 1 ? this.props.text.on : this.props.text.off);
    const baseColour = this.props.colour.on.fill !== this.props.colour.off.fill ? (currentValue === 1 ? this.props.colour.on.fill : this.props.colour.off.fill) : this.props.colour.on.fill;
    const stateColour = CabbageColours.darker(baseColour, this.isMouseInside ? 0.2 : 0);
    const currentColour = this.isMouseDown ? CabbageColours.lighter(baseColour, 0.2) : stateColour;

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" 
           width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.opacity}" style="display: ${this.props.visible === 0 ? 'none' : 'block'};">
        <rect x="0" y="0" width="100%" height="100%" fill="${currentColour}" stroke="${this.props.colour.on.stroke.colour}"
          stroke-width="${this.props.colour.on.stroke.width}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
        <text x="${textX}" y="50%" font-family="${this.props.font.family}" font-size="${fontSize}"
          fill="${currentValue === 1 ? this.props.font.colour.on : this.props.font.colour.off}" text-anchor="${svgAlign}" dominant-baseline="middle">${buttonText}</text>
      </svg>
    `;
  }
}



