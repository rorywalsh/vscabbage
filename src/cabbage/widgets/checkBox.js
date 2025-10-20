// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";
import { handleRadioGroup } from "../radioGroup.js";
import { getCabbageMode } from "../sharedState.js";

export class Checkbox {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 100,
        "height": 30
      },
      "id": "",
      "channels": [
        { "id": "checkbox", "event": "valueChanged" }
      ],
      "corners": 2,
      "text": "On/Off",
      "font": {
        "family": "Verdana",
        "size": 0,
        "align": "left",
        "colour": {
          "on": "#dddddd",
          "off": "#000000"
        }
      },
      "colour": {
        "on": {
          "fill": "#93d200",
          "stroke": {
            "colour": "#dddddd",
            "width": 2
          }
        },
        "off": {
          "fill": "#00000000",
          "stroke": {
            "colour": "#dddddd",
            "width": 2
          }
        }
      },
      "type": "checkBox",
      "visible": 1,
      "automatable": 1,
      "presetIgnore": 0,
      "opacity": 1,
      "radioGroup": -1,
      "index": 0
    };

    this.vscode = null;
    this.parameterIndex = 0;
  }

  toggle() {
    if (this.props.active === 0) {
      return '';
    }

    // Don't perform checkbox actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const range = CabbageUtils.getChannelRange(this.props, 0, 'click');
    // For radioGroup checkboxes: if already on, stay on; if off, turn on and deactivate others
    if (this.props.radioGroup && this.props.radioGroup !== -1) {
      if (this.props.value === range.min) {
        this.props.value = range.max;
        handleRadioGroup(this.props.radioGroup, CabbageUtils.getChannelId(this.props));
      }
      // If already max, do nothing (stay selected)
    } else {
      // Normal toggle behavior for checkboxes not in radioGroup
      this.props.value = (this.props.value === range.max) ? range.min : range.max;
    }

    CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
    const msg = { paramIdx: this.parameterIndex, channel: CabbageUtils.getChannelId(this.props), value: this.props.value };

    Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);

  }

  pointerDown(evt) {
    this.toggle();
  }

  addVsCodeEventListeners(widgetDiv, vscode) {
    this.vscode = vscode;
    this.addEventListeners(widgetDiv);
  }

  addEventListeners(widgetDiv) {
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.VerticalSliderInstance = this;
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

    const svgAlign = alignMap[this.props.font.align] || this.props.font.align;
    const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.8;

    const checkboxSize = this.props.bounds.height * 0.8;
    const checkboxX = this.props.font.align === 'right' ? this.props.bounds.width - checkboxSize - this.props.corners : this.props.corners;
    const textX = this.props.font.align === 'right' ? checkboxX - 10 : checkboxX + checkboxSize + 4;

    const adjustedTextAnchor = this.props.font.align === 'right' ? 'end' : 'start';

    return `
      <svg id="${CabbageUtils.getChannelId(this.props)}-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" style="display: ${this.props.visible === 0 ? 'none' : 'block'};">
        <rect x="${checkboxX}" y="${(this.props.bounds.height - checkboxSize) / 2}" width="${checkboxSize}" height="${checkboxSize}" fill="${currentValue === 1 ? this.props.colour.on.fill : this.props.colour.off.fill}" stroke="${currentValue === 1 ? this.props.colour.on.stroke.colour : this.props.colour.off.stroke.colour}" stroke-width="${currentValue === 1 ? this.props.colour.on.stroke.width : this.props.colour.off.stroke.width}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
        <text x="${textX}" y="${this.props.bounds.height / 2}" font-family="${this.props.font.family}" font-size="${fontSize}" fill="${this.props.font.colour[currentValue === 1 ? 'on' : 'off']}" text-anchor="${adjustedTextAnchor}" alignment-baseline="middle">${this.props.text}</text>
      </svg>
    `;
  }
}
