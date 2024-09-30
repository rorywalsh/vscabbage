import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";

export class Button {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 80,
        "height": 30
      },
      "channel": "button",
      "corners": 2,
      "min": 0,
      "max": 1,
      "value": 0,
      "text": {
        "on": "On",
        "off": "Off"
      },
      "alpha": 1,
      "textOff": "Off",
      "fontFamily": "Verdana",
      "fontSize": 0,
      "align": "centre",
      "colourOn": "#0295cf",
      "colourOff": "#0295cf",
      "fontColourOn": "#dddddd",
      "fontColourOff": "#dddddd",
      "outlineColour": "#dddddd",
      "outlineWidth": 2,
      "name": "",
      "value": 0,
      "type": "button",
      "visible": 1,
      "automatable": 1,
      "presetIgnore": 0
    };


    this.panelSections = {
      "Info": ["type", "channel"],
      "Bounds": ["left", "top", "width", "height"],
      "Text": ["textOn", "textOff", "fontSize", "fontFamily", "fontColourOn", "fontColourOff", "align"], // Changed from textOffsetY to textOffsetX for vertical slider
      "Colours": ["colourOn", "colourOff", "outlineColour"]
    };

    this.vscode = null;
    this.isMouseDown = false;
    this.isMouseInside = false;
    this.parameterIndex = 0;
  }

  pointerUp() {
    if (this.props.active === 0) {
      return '';
    }
    this.isMouseDown = false;
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

  pointerDown() {
    if (this.props.active === 0) {
      return '';
    }
    console.log("pointerDown");
    this.isMouseDown = true;
    this.props.value = (this.props.value === 0 ? 1 : 0);

    CabbageUtils.updateInnerHTML(this.props.channel, this);
    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: this.props.value }
    console.log(msg);
    Cabbage.sendParameterUpdate(this.vscode, msg);
  }


  pointerEnter() {
    if (this.props.active === 0) {
      return '';
    }
    this.isMouseOver = true;
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

  pointerLeave() {
    if (this.props.active === 0) {
      return '';
    }
    this.isMouseOver = false;
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

  //adding this at the window level to check if the mouse is inside the widget
  handleMouseMove(evt) {
    const rect = document.getElementById(this.props.channel).getBoundingClientRect();
    const isInside = (
      evt.clientX >= rect.left &&
      evt.clientX <= rect.right &&
      evt.clientY >= rect.top &&
      evt.clientY <= rect.bottom
    );

    if (!isInside) {
      this.isMouseInside = false;
    } else {
      this.isMouseInside = true;
    }

    // console.log("pointerEnter", this.props);
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }


  addVsCodeEventListeners(widgetDiv, vs) {
    console.log("addVsCodeEventListeners");
    this.vscode = vs;
    widgetDiv.addEventListener("pointerdown", this.pointerUp.bind(this));
    widgetDiv.addEventListener("pointerup", this.pointerDown.bind(this));
    window.addEventListener("mousemove", this.handleMouseMove.bind(this));
    widgetDiv.VerticalSliderInstance = this;
  }

  addEventListeners(widgetDiv) {
    widgetDiv.addEventListener("pointerup", this.pointerUp.bind(this));
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    window.addEventListener("mousemove", this.handleMouseMove.bind(this));
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
    const fontSize = this.props.fontSize > 0 ? this.props.fontSize : this.props.bounds.height * 0.5;
    const padding = 5;

    let textX;
    if (this.props.align === 'left') {
      textX = this.props.corners; // Add padding for left alignment
    } else if (this.props.align === 'right') {
      textX = this.props.bounds.width - this.props.corners - padding; // Add padding for right alignment
    } else {
      textX = this.props.bounds.width / 2;
    }
    const buttonText = this.props.type === "filebutton" ? this.props.text : (this.props.value === 1 ? this.props.text.on : this.props.text.off);
    const stateColour = CabbageColours.darker(this.props.value === 1 ? this.props.colourOn : this.props.colourOff, this.isMouseInside ? 0.2 : 0);
    const currentColour = this.isMouseDown ? CabbageColours.lighter(this.props.colourOn, 0.2) : stateColour;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none">
          <rect x="${this.props.corners / 2}" y="${this.props.corners / 2}" width="${this.props.bounds.width - this.props.corners}" height="${this.props.bounds.height - this.props.corners}" fill="${currentColour}" stroke="${this.props.outlineColour}"
            stroke-width="${this.props.outlineWidth}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
          <text x="${textX}" y="${this.props.bounds.height / 2}" font-family="${this.props.fontFamily}" font-size="${fontSize}"
            fill="${this.props.value === 1 ? this.props.fontColourOn : this.props.fontColourOff}" text-anchor="${svgAlign}" alignment-baseline="middle">${buttonText}</text>
      </svg>
    `;
  }
}

/*
  * File Button for file browsing @extends Button
  */
export class FileButton extends Button {
  constructor() {
    super();
    this.props.channel = "fileButton";

    this.props.colourOn = this.props.colourOff;
    this.props.fontColourOn = this.props.fontColourOff;
    this.props.mode = "file";
    delete this.props.text.off;
    delete this.props.text.on;
    //override following properties
    this.props.text = "Choose File";
    this.props.text.on = this.props.text;
    this.props.text.off = this.props.text;
    this.props.type = "filebutton";
    this.props.automatable = 0;
  }

  pointerDown(evt) {
    if (this.props.active === 0) {
      return '';
    }
    console.log("pointerDown");
    this.isMouseDown = true;
    this.props.value = 1;
    Cabbage.triggerFileOpenDialog(this.vscode, this.props.channel);
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

}

/*
  * Option Button for multi-item button @extends Button
  */
export class OptionButton extends Button {
  constructor() {
    super();
    this.props.channel = "fileButton";
    this.props.text.on = this.props.text.off;
    this.props.colourOn = this.props.colourOff;
    this.props.fontColourOn = this.props.fontColourOff;
    this.props.items = "One, Two, Three", // List of items for the dropdown
      //override following properties
      this.props.text = "";
    this.props.type = "optionbutton";
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

    const svgAlign = alignMap[this.props.align] || this.props.align;
    const fontSize = this.props.fontSize > 0 ? this.props.fontSize : this.props.bounds.height * 0.5;
    const padding = 5;
    const items = this.props.items.split(",");

    let textX;
    if (this.props.align === 'left') {
      textX = this.props.corners; // Add padding for left alignment
    } else if (this.props.align === 'right') {
      textX = this.props.bounds.width - this.props.corners - padding; // Add padding for right alignment
    } else {
      textX = this.props.bounds.width / 2;
    }

    const stateColour = CabbageColours.darker(this.props.value === 1 ? this.props.colourOn : this.props.colourOff, this.isMouseInside ? 0.2 : 0);
    const currentColour = this.isMouseDown ? CabbageColours.lighter(this.props.colourOn, 0.2) : stateColour;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none">
          <rect x="${this.props.corners / 2}" y="${this.props.corners / 2}" width="${this.props.bounds.width - this.props.corners}" height="${this.props.bounds.height - this.props.corners}" fill="${currentColour}" stroke="${this.props.outlineColour}"
            stroke-width="${this.props.outlineWidth}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
          <text x="${textX}" y="${this.props.bounds.height / 2}" font-family="${this.props.fontFamily}" font-size="${fontSize}"
            fill="${this.props.fontColourOff}" text-anchor="${svgAlign}" alignment-baseline="middle">${items[this.props.value]}</text>
      </svg>
    `;
  }

}
