import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";

export class Checkbox {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 100,
        "height": 30
      },
      "channel": "checkbox",
      "corners": 2,
      "min": 0,
      "max": 1,
      "value": 0,
      "text": "On/Off",
      "font": {
        "family": "Verdana",
        "size": 0,
        "align": "left"
      },
      "colour": {
        "on": "#93d200",
        "off": "#ffffff"
      },
      "fontColour": {
        "on": "#dddddd",
        "off": "#000000"
      },
      "stroke": {
        "colour": "#dddddd",
        "width": 2
      },
      "type": "checkBox",
      "visible": 1,
      "automatable": 1,
      "presetIgnore": 0
    };

    this.vscode = null;
    this.parameterIndex = 0;
  }

  toggle() {
    if (this.props.active === 0) {
      return '';
    }
    this.props.value = (this.props.value === 0) ? 1 : 0;
    CabbageUtils.updateInnerHTML(this.props.channel, this);
    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: this.props.value }
    Cabbage.sendParameterUpdate(this.vscode, msg);
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
    const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.8;

    const checkboxSize = this.props.bounds.height * 0.8;
    const checkboxX = this.props.font.align === 'right' ? this.props.bounds.width - checkboxSize - this.props.corners : this.props.corners;
    const textX = this.props.font.align === 'right' ? checkboxX - 10 : checkboxX + checkboxSize + 4;

    const adjustedTextAnchor = this.props.font.align === 'right' ? 'end' : 'start';

    return `
      <svg id="${this.props.channel}-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none">
        <rect x="${checkboxX}" y="${(this.props.bounds.height - checkboxSize) / 2}" width="${checkboxSize}" height="${checkboxSize}" fill="${this.props.value === 1 ? this.props.colour.on : this.props.colour.off}" stroke="${this.props.stroke.colour}" stroke-width="${this.props.stroke.width}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
        <text x="${textX}" y="${this.props.bounds.height / 2}" font-family="${this.props.font.family}" font-size="${fontSize}" fill="${this.props.fontColour[this.props.value === 1 ? 'on' : 'off']}" text-anchor="${adjustedTextAnchor}" alignment-baseline="middle">${this.props.text}</text>
      </svg>
    `;
  }
}