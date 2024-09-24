import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";

export class Checkbox {
  constructor() {
    this.props = {
        "top": 10, // Top position of the checkbox
        "left": 10, // Left position of the checkbox
        "width": 100, // Width of the checkbox
        "height": 30, // Height of the checkbox
        "channel": "checkbox", // Unique identifier for the checkbox
        "corners": 2, // Radius of the corners of the checkbox rectangle
        "min": 0, // Minimum value for the checkbox (for sliders)
        "max": 1, // Maximum value for the checkbox (for sliders)
        "value": 0, // Current value of the checkbox (for sliders)
        "text": "On/Off", // Text displayed next to the checkbox
        "fontFamily": "Verdana", // Font family for the text
        "fontColour": "#dddddd", // Color of the text
        "fontSize": 0, // Font size for the text
        "align": "left", // Text alignment within the checkbox (left, center, right)
        "colourOn": CabbageColours.getColour("green"), // Background color of the checkbox in the 'On' state
        "colourOff": "#ffffff", // Background color of the checkbox in the 'Off' state
        "fontColourOn": "#dddddd", // Color of the text in the 'On' state
        "fontColourOff": "#000000", // Color of the text in the 'Off' state
        "outlineColour": "#999999", // Color of the outline
        "outlineWidth": 1, // Width of the outline
        "value": 0, // Value of the checkbox (0 for off, 1 for on)
        "type": "checkbox", // Type of the checkbox (checkbox)
        "visible": 1, // Visibility of the checkbox (0 for hidden, 1 for visible)
        "automatable": 1, // Whether the checkbox value can be automated (0 for no, 1 for yes)
        "presetIgnore": 0 // Whether the checkbox should be ignored in presets (0 for no, 1 for yes)
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
    const fontSize = this.props.fontSize > 0 ? this.props.fontSize : this.props.height * 0.8;
  
    const checkboxSize = this.props.height * 0.8;
    const checkboxX = this.props.align === 'right' ? this.props.width - checkboxSize - this.props.corners : this.props.corners;
    const textX = this.props.align === 'right' ? checkboxX - 10 : checkboxX + checkboxSize + 4; // Add more padding to prevent overlap
  
    const adjustedTextAnchor = this.props.align === 'right' ? 'end' : 'start';
  
    return `
      <svg id="${this.props.channel}-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.width} ${this.props.height}" width="${this.props.width}" height="${this.props.height}" preserveAspectRatio="none">
        <rect x="${checkboxX}" y="${(this.props.height - checkboxSize) / 2}" width="${checkboxSize}" height="${checkboxSize}" fill="${this.props.value === 1 ? this.props.colourOn : this.props.colourOff}" stroke="${this.props.outlineColour}" stroke-width="${this.props.outlineWidth}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
        <text x="${textX}" y="${this.props.height / 2}" font-family="${this.props.fontFamily}" font-size="${fontSize}" fill="${this.props.fontColour}" text-anchor="${adjustedTextAnchor}" alignment-baseline="middle">${this.props.text}</text>
      </svg>
    `;
  }
  
}
