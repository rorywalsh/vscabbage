// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";

/*
  * Option Button for multi-item button
  */
export class OptionButton {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 80,
        "height": 30
      },
      "channels": [{ "id": "optionButton", "event": "valueChanged", "range": { "min": 0, "max": 2, "defaultValue": 0, "skew": 1, "increment": 1 } }],
      "value": null,
      "index": 0,
      "visible": true,
      "active": true,
      "automatable": true,
      "presetIgnore": false,
      "type": "optionButton",

      "style": {
        "opacity": 1,
        "borderRadius": 2,
        "borderWidth": 1,
        "borderColor": "#dddddd",
        "fontFamily": "Verdana",
        "fontSize": "auto",
        "fontColor": "#dddddd",
        "textAlign": "center",
        "backgroundColor": "#0295cf"
      },

      "items": ["Item1", "Item2", "Item3"]
    };

    this.vscode = null;
    this.isMouseDown = false;
    this.isMouseInside = false;
    this.parameterIndex = 0;
    this.currentIndex = 0;
    // Wrap props with reactive proxy to unify visible/active handling
    this.props = CabbageUtils.createReactiveProps(this, this.props);
  }


  pointerUp() {
    if (!this.props.active) {
      return '';
    }
    this.isMouseDown = false;
    CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
  }

  pointerDown(evt) {
    evt.stopPropagation();
    console.log('OptionButton pointerDown - Target:', evt.currentTarget.id, 'Channel:', CabbageUtils.getChannelId(this.props));

    if (!this.props.visible) {
      return '';
    }

    this.isMouseDown = true;
    const itemsLength = this.getItems().length;
    this.currentIndex = (this.currentIndex + 1) % itemsLength;
    this.props.value = this.currentIndex;

    CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this, evt.currentTarget);

    // Send normalized value (0-1) to maintain consistency with parameter system
    const normalizedValue = CabbageUtils.map(this.props.value, 0, itemsLength - 1, 0, 1);
    const msg = { paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0), channel: CabbageUtils.getChannelId(this.props), value: normalizedValue, channelType: "number" };
    console.log('Sending parameter update:', msg);
    if (this.props.automatable) {
      Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);
    }
  }

  getItems() {

    if (!this.props.items) {
      return ["Option 1", "Option 2", "Option 3"];
    }
    if (Array.isArray(this.props.items)) {
      return this.props.items;
    }

    return this.props.items.split(",").map(item => item.trim());
  }

  pointerEnter(evt) {
    evt.stopPropagation();
    if (!this.props.active) {
      return '';
    }
    this.isMouseOver = true;
    evt.currentTarget.innerHTML = this.getInnerHTML();
  }

  pointerLeave(evt) {
    evt.stopPropagation();
    if (!this.props.active) {
      return '';
    }
    this.isMouseOver = false;
    evt.currentTarget.innerHTML = this.getInnerHTML();
  }

  handleMouseMove(evt) {
    evt.stopPropagation();
    const rect = evt.currentTarget.getBoundingClientRect();
    const isInside = (
      evt.clientX >= rect.left &&
      evt.clientX <= rect.right &&
      evt.clientY >= rect.top &&
      evt.clientY <= rect.bottom
    );

    if (this.isMouseInside !== isInside) {
      this.isMouseInside = isInside;
      evt.currentTarget.innerHTML = this.getInnerHTML();
    }
  }

  addVsCodeEventListeners(widgetDiv, vs) {
    console.log("Cabbage: addVsCodeEventListeners");
    this.vscode = vs;
    this.widgetDiv = widgetDiv;
    this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
    this.addEventListeners(widgetDiv);
  }

  addEventListeners(widgetDiv) {
    widgetDiv.addEventListener("pointerup", this.pointerUp.bind(this));
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.addEventListener("mousemove", this.handleMouseMove.bind(this));
    widgetDiv.addEventListener("mouseenter", () => {
      widgetDiv.style.cursor = "pointer"; // Change cursor to pointer
    });
    widgetDiv.addEventListener("mouseleave", () => {
      this.isMouseInside = false;
      widgetDiv.style.cursor = "default"; // Reset cursor to default
      CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
    });
  }

  getInnerHTML() {
    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };

    const svgAlign = alignMap[this.props.style.textAlign] || this.props.style.textAlign;
    const fontSize = this.props.style.fontSize === "auto" || this.props.style.fontSize === 0 ? this.props.bounds.height * 0.5 : this.props.style.fontSize;
    const padding = 5;
    const items = this.getItems();
    const currentText = items[this.currentIndex];

    let textX;
    if (this.props.style.textAlign === 'left') {
      textX = this.props.style.borderRadius + padding;
    } else if (this.props.style.textAlign === 'right') {
      textX = this.props.bounds.width - this.props.style.borderRadius - padding;
    } else {
      textX = this.props.bounds.width / 2;
    }

    const currentColour = this.isMouseInside ? CabbageColours.lighter(this.props.style.backgroundColor, 0.2) : this.props.style.backgroundColor;
    return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" opacity="${this.props.style.opacity}" style="display: ${this.props.visible ? 'block' : 'none'};">
                <rect x="${this.props.style.borderRadius / 2}" y="${this.props.style.borderRadius / 2}" width="${this.props.bounds.width - this.props.style.borderRadius}" height="${this.props.bounds.height - this.props.style.borderRadius}" fill="${currentColour}" stroke="${this.props.style.borderColor}"
                  stroke-width="${this.props.style.borderWidth}" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}"></rect>
                <text x="${textX}" y="${this.props.bounds.height / 2}" font-family="${this.props.style.fontFamily}" font-size="${fontSize}"
                  fill="${this.props.style.fontColor}" text-anchor="${svgAlign}" alignment-baseline="middle">${currentText}</text>
            </svg>
        `;
  }
}
