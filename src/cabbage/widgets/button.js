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
      "type": "button",

      "style": {
        "opacity": 1,
        "borderRadius": 4,
        "borderWidth": 0,
        "fontSize": "auto",
        "borderColor": "#dddddd",
        "fontFamily": "Verdana",

        "on": {
          "backgroundColor": "#3d800a",
          "textColor": "#dddddd"
        },
        "off": {
          "backgroundColor": "#3d800a",
          "textColor": "#dddddd"
        },
        "hover": {
          "backgroundColor": "#4ca10c",
          "textColor": "#dddddd"
        },
        "active": {
          "backgroundColor": "#2d6008",
          "textColor": "#dddddd"
        }
      },

      "label": {
        "text": {
          "on": "On",
          "off": "Off"
        },
        "align": "center"
      },

      "svg": {
        "markup": "",
        "padding": {
          "top": 5,
          "right": 5,
          "bottom": 5,
          "left": 5
        }
      }
    };

    this.vscode = null;
    this.isMouseDown = false;
    this.isMouseInside = false;
    // Wrap props with reactive proxy to unify visible/active handling
    this.props = CabbageUtils.createReactiveProps(this, this.props);

  }

  pointerUp() {
    if (!this.props.active) {
      return '';
    }
    this.isMouseDown = false;
    CabbageUtils.updateInnerHTML(this.props, this);
  }

  pointerDown() {
    if (!this.props.active) {
      return '';
    }

    // Don't perform button actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    console.log("Cabbage: pointerDown");
    this.isMouseDown = true;
    const range = CabbageUtils.getChannelRange(this.props, 0, 'click');
    if (this.props.channels[0].range.value === null) {
      this.props.channels[0].range.value = range.defaultValue;
    }

    // For radioGroup buttons: if already on, stay on; if off, turn on and deactivate others
    if (this.props.radioGroup && this.props.radioGroup !== -1) {
      if (this.props.channels[0].range.value === range.min) {
        this.props.channels[0].range.value = range.max;
        handleRadioGroup(this.props.radioGroup, CabbageUtils.getWidgetDivId(this.props));
      }
      // If already max, do nothing (stay selected)
    } else {
      // Normal toggle behavior for buttons not in radioGroup
      this.props.channels[0].range.value = (this.props.channels[0].range.value === range.min ? range.max : range.min);
    }

    CabbageUtils.updateInnerHTML(this.props, this);
    const msg = { paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0), channel: CabbageUtils.getChannelId(this.props), value: this.props.channels[0].range.value }
    console.log(msg);

    Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);

  }

  pointerEnter() {
    if (!this.props.active) {
      return '';
    }
    this.isMouseInside = true;
    CabbageUtils.updateInnerHTML(this.props, this);
  }

  pointerLeave() {
    if (!this.props.active) {
      return '';
    }
    this.isMouseInside = false;
    CabbageUtils.updateInnerHTML(this.props, this);
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
      CabbageUtils.updateInnerHTML(this.props, this);
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
    widgetDiv.addEventListener("mouseleave", () => {
      this.isMouseInside = false;
      CabbageUtils.updateInnerHTML(this.props, this);
    });
  }

  getInnerHTML() {
    // Use defaultValue for visual state when value is null
    const currentValue = this.props.channels[0].range.value !== null ? this.props.channels[0].range.value : CabbageUtils.getChannelRange(this.props, 0, 'click').defaultValue;

    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };

    const textAlign = this.props.label.align || 'center';
    const svgAlign = alignMap[textAlign] || 'middle';
    const fontSize = this.props.style.fontSize === "auto" || this.props.style.fontSize === 0 ? this.props.bounds.height * 0.4 : this.props.style.fontSize;
    const padding = 5;

    let textX;
    if (textAlign === 'left') {
      textX = this.props.style.borderRadius + padding;
    } else if (textAlign === 'right') {
      textX = this.props.bounds.width - this.props.style.borderRadius - padding;
    } else {
      textX = this.props.bounds.width / 2;
    }

    const buttonText = (this.props.type === "fileButton" || this.props.type === "infoButton") ?
      (currentValue === 1 ? this.props.label.text.on : this.props.label.text.off) :
      (currentValue === 1 ? this.props.label.text.on : this.props.label.text.off);

    // Determine background color and text color based on state
    const isOn = currentValue === 1;
    const baseColour = isOn ? this.props.style.on.backgroundColor : this.props.style.off.backgroundColor;
    const baseTextColour = isOn ? this.props.style.on.textColor : this.props.style.off.textColor;

    // Determine overlay colors for hover/active states
    let overlayColour = null;
    let textColour = baseTextColour;

    if (this.isMouseDown && this.props.style.active.backgroundColor) {
      overlayColour = this.props.style.active.backgroundColor;
      textColour = this.props.style.active.textColor;
    } else if (this.isMouseInside && this.props.style.hover.backgroundColor) {
      overlayColour = this.props.style.hover.backgroundColor;
      textColour = this.props.style.hover.textColor;
    }

    // Base button SVG - always draw the base state (on/off)
    let buttonHtml = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" 
           width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.style.opacity}" style="display: ${this.props.visible ? 'block' : 'none'}; pointer-events: ${this.props.visible && this.props.active ? 'auto' : 'none'};">
        <rect x="0" y="0" width="100%" height="100%" fill="${baseColour}" stroke="${this.props.style.borderColor}"
          stroke-width="${this.props.style.borderWidth}" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}"></rect>`;

    // Add overlay rect for hover/active state if present
    if (overlayColour) {
      buttonHtml += `
        <rect x="0" y="0" width="100%" height="100%" fill="${overlayColour}"
          rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}"></rect>`;
    }

    // Add text on top
    buttonHtml += `
        <text x="${textX}" y="50%" font-family="${this.props.style.fontFamily}" font-size="${fontSize}"
          fill="${textColour}" text-anchor="${svgAlign}" dominant-baseline="middle">${buttonText}</text>
      </svg>
    `;

    // If svg.markup is provided, add it as an overlay
    if (this.props.svg && this.props.svg.markup) {
      // Extract viewBox from original SVG if present, otherwise use button bounds
      const viewBoxMatch = this.props.svg.markup.match(/viewBox=["']([^"']+)["']/);
      const viewBox = viewBoxMatch ? viewBoxMatch[1] : `0 0 ${this.props.bounds.width} ${this.props.bounds.height}`;

      const preserveAspectRatioMatch = this.props.svg.markup.match(/preserveAspectRatio=["']([^"']+)["']/);
      const preserveAspectRatio = preserveAspectRatioMatch ? preserveAspectRatioMatch[1] : 'xMidYMid meet';

      // Extract inner SVG content without outer <svg> tags
      const innerSvgContent = this.props.svg.markup.replace(/<svg[^>]*>|<\/svg>/g, '');

      // Get padding values
      const paddingTop = this.props.svg.padding?.top || 0;
      const paddingRight = this.props.svg.padding?.right || 0;
      const paddingBottom = this.props.svg.padding?.bottom || 0;
      const paddingLeft = this.props.svg.padding?.left || 0;

      // Calculate SVG dimensions accounting for padding
      const svgWidth = this.props.bounds.width - paddingLeft - paddingRight;
      const svgHeight = this.props.bounds.height - paddingTop - paddingBottom;

      // Add overlay SVG with padding
      buttonHtml += `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${svgWidth}" height="${svgHeight}" preserveAspectRatio="${preserveAspectRatio}" opacity="${this.props.style.opacity}"
           style="position: absolute; top: ${paddingTop}px; left: ${paddingLeft}px; pointer-events: none; display: ${this.props.visible ? 'block' : 'none'};">
        <g style="all: initial;">
          ${innerSvgContent}
        </g>
      </svg>
      `;
    }

    return buttonHtml;
  }
}



