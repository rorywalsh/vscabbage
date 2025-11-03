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
      "value": null,
      "index": 0,
      "visible": true,
      "active": true,
      "automatable": true,
      "presetIgnore": false,
      "opacity": 1,
      "radioGroup": -1,
      "type": "checkBox",

      "shape": {
        "borderRadius": 2
      },

      "state": {
        "on": {
          "fill": "#93d200",
          "borderColor": "#dddddd",
          "borderWidth": 2,
          "textColor": "#dddddd"
        },
        "off": {
          "fill": "#00000000",
          "borderColor": "#dddddd",
          "borderWidth": 2,
          "textColor": "#000000"
        }
      },

      "label": {
        "text": "On/Off",
        "fontFamily": "Verdana",
        "fontSize": "auto",
        "textAlign": "left"
      }
    };

    this.vscode = null;
    this.parameterIndex = 0;
  }

  toggle() {
    if (this.props.active === false || this.props.active === 0) {
      return '';
    }

    // Don't perform checkbox actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const range = CabbageUtils.getChannelRange(this.props, 0, 'click');
    // Get current value, using default if null
    const currentValue = this.props.value !== null ? this.props.value : range.defaultValue;

    // For radioGroup checkboxes: if already on, stay on; if off, turn on and deactivate others
    if (this.props.radioGroup && this.props.radioGroup !== -1) {
      if (currentValue === range.min) {
        this.props.value = range.max;
        handleRadioGroup(this.props.radioGroup, CabbageUtils.getChannelId(this.props));
      }
      // If already max, do nothing (stay selected)
    } else {
      // Normal toggle behavior for checkboxes not in radioGroup
      this.props.value = (currentValue === range.max) ? range.min : range.max;
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

    const svgAlign = alignMap[this.props.label.textAlign] || this.props.label.textAlign;
    const fontSize = this.props.label.fontSize === "auto" || this.props.label.fontSize === 0 ? this.props.bounds.height * 0.8 : this.props.label.fontSize;

    const checkboxSize = this.props.bounds.height * 0.8;
    const checkboxX = this.props.label.textAlign === 'right' ? this.props.bounds.width - checkboxSize - this.props.shape.borderRadius : this.props.shape.borderRadius;
    const textX = this.props.label.textAlign === 'right' ? checkboxX - 10 : checkboxX + checkboxSize + 4;

    const adjustedTextAnchor = this.props.label.textAlign === 'right' ? 'end' : 'start';

    const isOn = currentValue === 1;
    const currentState = isOn ? this.props.state.on : this.props.state.off;

    return `
      <svg id="${CabbageUtils.getChannelId(this.props)}-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" opacity="${this.props.opacity}" style="display: ${this.props.visible === false || this.props.visible === 0 ? 'none' : 'block'};">
        <rect x="${checkboxX}" y="${(this.props.bounds.height - checkboxSize) / 2}" width="${checkboxSize}" height="${checkboxSize}" fill="${currentState.fill}" stroke="${currentState.borderColor}" stroke-width="${currentState.borderWidth}" rx="${this.props.shape.borderRadius}" ry="${this.props.shape.borderRadius}"></rect>
        <text x="${textX}" y="${this.props.bounds.height / 2}" font-family="${this.props.label.fontFamily}" font-size="${fontSize}" fill="${currentState.textColor}" text-anchor="${adjustedTextAnchor}" alignment-baseline="middle">${this.props.label.text}</text>
      </svg>
    `;
  }
}
