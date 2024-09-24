import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";

export class Button {
  constructor() {
    this.props = {
      "top": 10, // Top position of the button
      "left": 10, // Left position of the button
      "width": 80, // Width of the button
      "height": 30, // Height of the button
      "channel": "button", // Unique identifier for the button
      "corners": 2, // Radius of the corners of the button rectangle
      "min": 0, // Minimum value for the button (for sliders)
      "max": 1, // Maximum value for the button (for sliders)
      "value": 0, // Current value of the button (for sliders)
      "textOn": "On", // Text displayed when button is in the 'On' state
      "textOff": "Off", // Text displayed when button is in the 'Off' state
      "fontFamily": "Verdana", // Font family for the text
      "fontSize": 0, // Font size for the text (0 for automatic)
      "align": "centre", // Text alignment within the button (left, center, right)
      "colourOn": CabbageColours.getColour("blue"), // Background color of the button in the 'On' state
      "colourOff": CabbageColours.getColour("blue"), // Background color of the button in the 'Off' state
      "fontColourOn": "#dddddd", // Color of the text in the 'On' state
      "fontColourOff": "#dddddd", // Color of the text in the 'Off' state
      "outlineColour": "#dddddd", // Color of the outline
      "outlineWidth": 2, // Width of the outline
      "name": "", // Name of the button
      "value": 0, // Value of the button (0 for off, 1 for on)
      "type": "button", // Type of the button (button)
      "visible": 1, // Visibility of the button (0 for hidden, 1 for visible)
      "automatable": 1, // Whether the button value can be automated (0 for no, 1 for yes)
      "presetIgnore": 0 // Whether the button should be ignored in presets (0 for no, 1 for yes)
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

  pointerDown(evt) {
    if (this.props.active === 0) {
      return '';
    }
    console.log("pointerDown");
    this.isMouseDown = true;
    this.props.value = (this.props.value === 0 ? 1 : 0);

    CabbageUtils.updateInnerHTML(this.props.channel, this);
    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: this.props.value }
    Cabbage.sendParameterUpdate(this.vscode, msg);
  }


  pointerEnter(evt) {
    if (this.props.active === 0) {
      return '';
    }
    this.isMouseOver = true;
    CabbageUtils.updateInnerHTML(this.props.channel, this);

  }


  pointerLeave(evt) {
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
    const fontSize = this.props.fontSize > 0 ? this.props.fontSize : this.props.height * 0.5;
    const padding = 5;

    let textX;
    if (this.props.align === 'left') {
      textX = this.props.corners; // Add padding for left alignment
    } else if (this.props.align === 'right') {
      textX = this.props.width - this.props.corners - padding; // Add padding for right alignment
    } else {
      textX = this.props.width / 2;
    }
    const buttonText = this.props.type === "filebutton" ? this.props.text : (this.props.value === 1 ? this.props.textOn : this.props.textOff);
    const stateColour = CabbageColours.darker(this.props.value === 1 ? this.props.colourOn : this.props.colourOff, this.isMouseInside ? 0.2 : 0);
    const currentColour = this.isMouseDown ? CabbageColours.lighter(this.props.colourOn, 0.2) : stateColour;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.width} ${this.props.height}" width="${this.props.width}" height="${this.props.height}" preserveAspectRatio="none">
          <rect x="${this.props.corners / 2}" y="${this.props.corners / 2}" width="${this.props.width - this.props.corners}" height="${this.props.height - this.props.corners}" fill="${currentColour}" stroke="${this.props.outlineColour}"
            stroke-width="${this.props.outlineWidth}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
          <text x="${textX}" y="${this.props.height / 2}" font-family="${this.props.fontFamily}" font-size="${fontSize}"
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
    delete this.props.textOff;
    delete this.props.textOn;
    //override following properties
    this.props.text = "Choose File";
    this.props.textOn = this.props.text;
    this.props.textOff = this.props.text;
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
    this.props.textOn = this.props.textOff;
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
    const fontSize = this.props.fontSize > 0 ? this.props.fontSize : this.props.height * 0.5;
    const padding = 5;
    const items = this.props.items.split(",");

    let textX;
    if (this.props.align === 'left') {
      textX = this.props.corners; // Add padding for left alignment
    } else if (this.props.align === 'right') {
      textX = this.props.width - this.props.corners - padding; // Add padding for right alignment
    } else {
      textX = this.props.width / 2;
    }

    const stateColour = CabbageColours.darker(this.props.value === 1 ? this.props.colourOn : this.props.colourOff, this.isMouseInside ? 0.2 : 0);
    const currentColour = this.isMouseDown ? CabbageColours.lighter(this.props.colourOn, 0.2) : stateColour;
    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.width} ${this.props.height}" width="${this.props.width}" height="${this.props.height}" preserveAspectRatio="none">
          <rect x="${this.props.corners / 2}" y="${this.props.corners / 2}" width="${this.props.width - this.props.corners}" height="${this.props.height - this.props.corners}" fill="${currentColour}" stroke="${this.props.outlineColour}"
            stroke-width="${this.props.outlineWidth}" rx="${this.props.corners}" ry="${this.props.corners}"></rect>
          <text x="${textX}" y="${this.props.height / 2}" font-family="${this.props.fontFamily}" font-size="${fontSize}"
            fill="${this.props.fontColourOff}" text-anchor="${svgAlign}" alignment-baseline="middle">${items[this.props.value]}</text>
      </svg>
    `;
  }

}
