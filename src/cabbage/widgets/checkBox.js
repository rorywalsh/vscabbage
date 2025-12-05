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
        {
          "id": "checkbox",
          "event": "valueChanged",
          "range": { "defaultValue": 0, "increment": 1, "max": 1, "min": 0, "skew": 1 }
        }
      ],
      "value": null,
      "zIndex": 0,
      "visible": true,
      "active": true,
      "automatable": true,
      "presetIgnore": false,
      "radioGroup": -1,
      "type": "checkBox",

      "style": {
        "opacity": 1,
        "borderRadius": 2,
        "fontFamily": "Verdana",
        "fontSize": "auto",
        "fontColor": "#dddddd",
        "textAlign": "left",

        "on": {
          "backgroundColor": "#93d200",
          "borderColor": "#dddddd",
          "borderWidth": 2,
          "textColor": "#dddddd"
        },
        "off": {
          "backgroundColor": "#00000000",
          "borderColor": "#dddddd",
          "borderWidth": 2,
          "textColor": "#000000"
        }
      },

      "label": {
        "text": "On/Off"
      }
    };

    this.vscode = null;
    this.parameterIndex = 0;
    // Wrap props with reactive proxy to unify visible/active handling
    this.props = CabbageUtils.createReactiveProps(this, this.props);
  }

  toggle() {
    if (!this.props.active) {
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
        handleRadioGroup(this.props.radioGroup, CabbageUtils.getWidgetDivId(this.props));
      }
      // If already max, do nothing (stay selected)
    } else {
      // Normal toggle behavior for checkboxes not in radioGroup
      this.props.value = (currentValue === range.max) ? range.min : range.max;
    }

    CabbageUtils.updateInnerHTML(this.props, this);
    const msg = { paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0), channel: CabbageUtils.getChannelId(this.props), value: this.props.value };

    Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);

  }

  pointerDown(evt) {
    this.toggle();
  }

  addVsCodeEventListeners(widgetDiv, vscode) {
    this.vscode = vscode;
    this.widgetDiv = widgetDiv;
    this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
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

    const svgAlign = alignMap[this.props.style.textAlign] || this.props.style.textAlign;
    const fontSize = this.props.style.fontSize === "auto" || this.props.style.fontSize === 0 ? this.props.bounds.height * 0.8 : this.props.style.fontSize;

    const checkboxSize = this.props.bounds.height * 0.8;
    const checkboxX = this.props.style.textAlign === 'right' ? this.props.bounds.width - checkboxSize - this.props.style.borderRadius : this.props.style.borderRadius;
    const textX = this.props.style.textAlign === 'right' ? checkboxX - 10 : checkboxX + checkboxSize + 4;

    const adjustedTextAnchor = this.props.style.textAlign === 'right' ? 'end' : 'start';

    const isOn = currentValue === 1;
    const currentState = isOn ? this.props.style.on : this.props.style.off;

    return `
      <svg id="${CabbageUtils.getChannelId(this.props)}-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" opacity="${this.props.style.opacity}" style="display: ${this.props.visible ? 'block' : 'none'}; pointer-events: ${this.props.visible && this.props.active ? 'auto' : 'none'};">
  <rect x="${checkboxX}" y="${(this.props.bounds.height - checkboxSize) / 2}" width="${checkboxSize}" height="${checkboxSize}" fill="${currentState.backgroundColor}" stroke="${currentState.borderColor}" stroke-width="${currentState.borderWidth}" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}"></rect>
        <text x="${textX}" y="${this.props.bounds.height / 2}" font-family="${this.props.style.fontFamily}" font-size="${fontSize}" fill="${currentState.textColor}" text-anchor="${adjustedTextAnchor}" alignment-baseline="middle">${this.props.label.text}</text>
      </svg>
    `;
  }
}
