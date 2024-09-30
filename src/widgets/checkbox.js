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
      "fontFamily": "Verdana",
      "fontColour": "#dddddd",
      "fontSize": 0,
      "align": "left",
      "colourOn": "#93d200",
      "colourOff": "#ffffff",
      "fontColourOn": "#dddddd",
      "fontColourOff": "#000000",
      "outlineColour": "#999999",
      "outlineWidth": 1,
      "value": 0,
      "type": "checkbox",
      "visible": 1,
      "automatable": 1,
      "presetIgnore": 0
    };

    this.panelSections = {
      "Info": ["type", "channel"],
      "Bounds": ["left", "top", "width", "height"],
      "Text": ["text", "fontSize", "fontFamily", "fontColour", "align"], // Changed from textOffsetY to textOffsetX for vertical slider
      "Colours": ["colourOn", "colourOff", "outlineColour"]
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
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.VerticalSliderInstance = this;
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

    const svgAlign = alignMap[this.props.align] || this.props.align;
    console.warn(this.props.fontSize)
    const fontSize = this.props.fontSize > 0 ? this.props.fontSize : this.props.bounds.height * 0.8;

    const checkboxSize = this.props.bounds.height * 0.8;
    const checkboxX = this.props.align === 'right' ? this.props.bounds.width - checkboxSize - this.props.corners : this.props.corners;
    const textX = this.props.align === 'right' ? checkboxX - 10 : checkboxX + checkboxSize + 4; // Add more padding to prevent overlap

    const adjustedTextAnchor = this.props.align === 'right' ? 'end' : 'start';

    return `
      <svg id="${this.props.channel}-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none">
        <rect x="${checkboxX}" y="${(this.props.bounds.height - checkboxSize) / 2}" width="${checkboxSize}" height="${checkboxSize}" fill="${this.props.value === 1 ? this.props.colourOn : this.props.colourOff}" stroke="${this.props.outlineColour}" stroke-width="${this.props.outlineWidth}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
        <text x="${textX}" y="${this.props.bounds.height / 2}" font-family="${this.props.fontFamily}" font-size="${fontSize}" fill="${this.props.fontColour}" text-anchor="${adjustedTextAnchor}" alignment-baseline="middle">${this.props.text}</text>
      </svg>
    `;
  }

}
