import { Button } from './button.js';
import { CabbageUtils } from "../utils.js";
import { Cabbage } from "../cabbage.js";

/*
  * Option Button for multi-item button @extends Button
  */
export class OptionButton extends Button {
    constructor() {
      super();
      this.props.channel = "fileButton";
      this.props.text.on = this.props.text.off;
      this.props.colour.on = this.props.colour.off;
      this.props.fontColour.on = this.props.fontColour.off;
      this.props.items = "One, Two, Three";
      this.props.text = "";
      this.props.type = "optionButton";
      this.props.automatable = 1;
    }
  
    pointerDown(evt) {
      if (this.props.active === 0) {
        return '';
      }
      console.log("pointerDown");
      this.isMouseDown = true;
      this.props.value = this.props.value < this.props.items.split(",").length - 1 ? this.props.value + 1 : 0;
  
      CabbageUtils.updateInnerHTML(this.props.channel, this);
      const newValue = CabbageUtils.map(this.props.value, this.props.min, this.props.max, 0, 1);
      const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: newValue, channelType: "number" }
      Cabbage.sendParameterUpdate(this.vscode, msg);
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
      const items = this.props.items.split(",");
  
      let textX;
      if (this.props.font.align === 'left') {
        textX = this.props.corners;
      } else if (this.props.font.align === 'right') {
        textX = this.props.bounds.width - this.props.corners - padding;
      } else {
        textX = this.props.bounds.width / 2;
      }
  
      const stateColour = CabbageColours.darker(this.props.value === 1 ? this.props.colour.on : this.props.colour.off, this.isMouseInside ? 0.2 : 0);
      const currentColour = this.isMouseDown ? CabbageColours.lighter(this.props.colour.on, 0.2) : stateColour;
      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none">
            <rect x="${this.props.corners / 2}" y="${this.props.corners / 2}" width="${this.props.bounds.width - this.props.corners}" height="${this.props.bounds.height - this.props.corners}" fill="${currentColour}" stroke="${this.props.outlineColour}"
              stroke-width="${this.props.outlineWidth}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
            <text x="${textX}" y="${this.props.bounds.height / 2}" font-family="${this.props.font.family}" font-size="${fontSize}"
              fill="${this.props.fontColour.off}" text-anchor="${svgAlign}" alignment-baseline="middle">${items[this.props.value]}</text>
        </svg>
      `;
    }
  
  }