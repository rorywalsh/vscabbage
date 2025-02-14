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
      "channel": "optionButton",
      "corners": 2,
      "min": 0,
      "max": 1,
      "value": null,
      "items": "Item1, Item2, Item3",
      "opacity": 1,
      "font": {
        "family": "Verdana",
        "size": 0,
        "align": "centre",
        "colour": "#dddddd"
      },
      "colour": {
        "fill": "#0295cf",
        "stroke": {
          "colour": "#dddddd",
          "width": 1
        }
      },
      "name": "",
      "value": null,
      "defaultValue": 0,
      "type": "optionButton",
      "visible": 1,
      "automatable": 1,
      "presetIgnore": 0
    };

    this.vscode = null;
    this.isMouseDown = false;
    this.isMouseInside = false;
    this.parameterIndex = 0;
    this.currentIndex = 0;
  }


  pointerUp() {
    if (this.props.active === 0) {
      return '';
    }
    this.isMouseDown = false;
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

  pointerDown(evt) {
    evt.stopPropagation();
    console.log('OptionButton pointerDown - Target:', evt.currentTarget.id, 'Channel:', this.props.channel);
    
    if (this.props.visible === 0) {
      return '';
    }

    this.isMouseDown = true;
    const itemsLength = this.props.items.split(",").length;
    this.currentIndex = (this.currentIndex + 1) % itemsLength;
    this.props.value = this.currentIndex;

    CabbageUtils.updateInnerHTML(this.props.channel, this, evt.currentTarget);
    
    const newValue = CabbageUtils.map(this.props.value, 0, itemsLength, 0, 1);
    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: newValue, channelType: "number" };
    console.log('Sending parameter update:', msg);
    Cabbage.sendParameterUpdate(msg, this.vscode);
  }

  getItems() {

    if (!this.props.items){
      return ["Option 1", "Option 2", "Option 3"];
    } 
    if (Array.isArray(this.props.items)){
      return this.props.items;
    }

    return this.props.items.split(",").map(item => item.trim());
  }

  pointerEnter(evt) {
    evt.stopPropagation();
    if (this.props.active === 0) {
      return '';
    }
    this.isMouseOver = true;
    evt.currentTarget.innerHTML = this.getInnerHTML();
  }

  pointerLeave(evt) {
    evt.stopPropagation();
    if (this.props.active === 0) {
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
      CabbageUtils.updateInnerHTML(this.props.channel, this);
    });
  }

  getInnerHTML() {
    if (this.props.visible === 0) {
      return '';
    }

    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };

    const svgAlign = alignMap[this.props.font.align] || this.props.font.align;
    const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.5;
    const padding = 5;
    const items = this.getItems();
    const currentText = items[this.currentIndex];

    let textX;
    if (this.props.font.align === 'left') {
      textX = this.props.corners;
    } else if (this.props.font.align === 'right') {
      textX = this.props.bounds.width - this.props.corners - padding;
    } else {
      textX = this.props.bounds.width / 2;
    }

    const currentColour = this.isMouseInside ? CabbageColours.lighter(this.props.colour.fill, 0.2) : this.props.colour.fill;
    return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" opacity="${this.props.opacity}">
                <rect x="${this.props.corners / 2}" y="${this.props.corners / 2}" width="${this.props.bounds.width - this.props.corners}" height="${this.props.bounds.height - this.props.corners}" fill="${currentColour}" stroke="${this.props.colour.stroke.colour}"
                  stroke-width="${this.props.colour.stroke.width}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
                <text x="${textX}" y="${this.props.bounds.height / 2}" font-family="${this.props.font.family}" font-size="${fontSize}"
                  fill="${this.props.font.colour}" text-anchor="${svgAlign}" alignment-baseline="middle">${currentText}</text>
            </svg>
        `;
  }
}
