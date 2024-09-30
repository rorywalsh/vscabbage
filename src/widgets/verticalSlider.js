import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";

export class VerticalSlider {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 60,
        "height": 60
      },
      "channel": "vslider",
      "range":{
      "min": 0,
      "max": 1,
      "defaultValue": 0,
      "skew": 1,
      "increment": 0.001
      },
      "value":0,
      "text": "",
      "fontFamily": "Verdana",
      "fontSize": 0,
      "align": "centre",
      "valueTextBox": 0,
      "colour": "#0295cf",
      "trackerColour": "#93d200",
      "trackerBackgroundColour": "#ffffff",
      "trackerOutlineColour": "#525252",
      "fontColour": "#dddddd",
      "outlineColour": "#999999",
      "textBoxColour": "#555555",
      "trackerOutlineWidth": 1,
      "outlineWidth": 1,
      "type": "vslider",
      "decimalPlaces": 1,
      "velocity": 0,
      "visible": 1,
      "popup": 1,
      "automatable": 1,
      "valuePrefix": "",
      "valuePostfix": "",
      "presetIgnore": 0,
    };


    this.panelSections = {
      "Info": ["type", "channel"],
      "Bounds": ["left", "top", "width", "height"],
      "Range": ["min", "max", "default", "skew", "increment"],
      "Text": ["text", "fontSize", "fontFamily", "fontColour", "textOffsetX", "align"],
      "Colours": ["colour", "trackerBackgroundColour", "trackerStrokeColour", "outlineColour", "textBoxOutlineColour", "textBoxColour"]
    };

    this.moveListener = this.pointerMove.bind(this);
    this.upListener = this.pointerUp.bind(this);
    this.startY = 0; // Changed from startX to startY for vertical slider
    this.startValue = 0;
    this.vscode = null;
    this.isMouseDown = false;
    this.decimalPlaces = 0;
    this.parameterIndex = 0;
  }

  pointerUp() {
    if (this.props.active === 0) {
      return '';
    }
    const popup = document.getElementById('popupValue');
    popup.classList.add('hide');
    popup.classList.remove('show');
    window.removeEventListener("pointermove", this.moveListener);
    window.removeEventListener("pointerup", this.upListener);
    this.isMouseDown = false;
  }

  pointerDown(evt) {
    if (this.props.active === 0) {
      return '';
    }
    let textHeight = this.props.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueTextBox ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight;

    const sliderTop = this.props.valueTextBox ? textHeight : 0; // Adjust slider top position if valueTextBox is present

    if (evt.offsetY >= sliderTop && evt.offsetY <= sliderTop + sliderHeight) {
      this.isMouseDown = true;
      this.startY = evt.offsetY - sliderTop;
      this.props.value = CabbageUtils.map(this.startY, 5, sliderHeight, this.props.range.max, this.props.range.min);
      this.props.value = Math.round(this.props.value / this.props.range.increment) * this.props.range.increment;
      this.startValue = this.props.value;
      window.addEventListener("pointermove", this.moveListener);
      window.addEventListener("pointerup", this.upListener);
      CabbageUtils.updateInnerHTML(this.props.channel, this);

      const newValue = CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, 1);
      const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: newValue, channelType: "number" }
      Cabbage.sendParameterUpdate(this.vscode, msg);
    }
  }


  mouseEnter(evt) {
    if (this.props.active === 0) {
      return '';
    }

    const popup = document.getElementById('popupValue');
    const form = document.getElementById('MainForm');
    const rect = form.getBoundingClientRect();
    this.decimalPlaces = CabbageUtils.getDecimalPlaces(this.props.range.increment);

    if (popup) {
      popup.textContent = this.props.valuePrefix + parseFloat(this.props.value).toFixed(this.decimalPlaces) + this.props.valuePostfix;

      // Calculate the position for the popup
      const sliderLeft = this.props.bounds.left;
      const sliderWidth = this.props.bounds.width;
      const formLeft = rect.left;
      const formWidth = rect.width;

      // Determine if the popup should be on the right or left side of the slider
      const sliderCenter = formLeft + (formWidth / 2);
      let popupLeft;
      if (sliderLeft + (sliderWidth) > sliderCenter) {
        // Place popup on the left of the slider thumb
        popupLeft = formLeft + sliderLeft - popup.offsetWidth - 10;
        console.log("Pointer on the left");
        popup.classList.add('right');
      } else {
        // Place popup on the right of the slider thumb
        popupLeft = formLeft + sliderLeft + sliderWidth + 10;
        console.log("Pointer on the right");
        popup.classList.remove('right');
      }

      const popupTop = rect.top + this.props.top + this.props.bounds.height * .45; // Adjust top position relative to the form's top

      // Set the calculated position
      popup.style.left = `${popupLeft}px`;
      popup.style.top = `${popupTop}px`;
      popup.style.display = 'block';
      popup.classList.add('show');
      popup.classList.remove('hide');
    }
  }


  mouseLeave(evt) {
    if (!this.isMouseDown) {
      const popup = document.getElementById('popupValue');
      popup.classList.add('hide');
      popup.classList.remove('show');
    }
  }

  addVsCodeEventListeners(widgetDiv, vs) {
    this.vscode = vs;
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.addEventListener("mouseenter", this.mouseEnter.bind(this));
    widgetDiv.addEventListener("mouseleave", this.mouseLeave.bind(this));
    widgetDiv.VerticalSliderInstance = this;
  }

  addEventListeners(widgetDiv) {
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.addEventListener("mouseenter", this.mouseEnter.bind(this));
    widgetDiv.addEventListener("mouseleave", this.mouseLeave.bind(this));
    widgetDiv.VerticalSliderInstance = this;
  }

  handleInputChange(evt) {
    if (evt.key === 'Enter') {
      const inputValue = parseFloat(evt.target.value);
      if (!isNaN(inputValue) && inputValue >= this.props.range.min && inputValue <= this.props.range.max) {
        this.props.value = inputValue;
        const widgetDiv = document.getElementById(this.props.channel);
        widgetDiv.innerHTML = this.getInnerHTML();
        widgetDiv.querySelector('input').focus();
      }
    }
  }

  pointerMove({ clientY }) {
    if (this.props.active === 0) {
      return '';
    }

    let textHeight = this.props.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueTextBox ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight;

    // Get the bounding rectangle of the slider
    const sliderRect = document.getElementById(this.props.channel).getBoundingClientRect();

    // Calculate the relative position of the mouse pointer within the slider bounds
    let offsetY = sliderRect.bottom - clientY - textHeight;

    // Clamp the mouse position to stay within the bounds of the slider
    offsetY = CabbageUtils.clamp(offsetY, 0, sliderHeight);

    // Calculate the new value based on the mouse position
    let newValue = CabbageUtils.map(offsetY, 0, sliderHeight, this.props.range.min, this.props.range.max);
    newValue = Math.round(newValue / this.props.range.increment) * this.props.range.increment;

    // Update the slider value
    this.props.value = newValue;

    // Update the slider appearance
    const widgetDiv = document.getElementById(this.props.channel);
    widgetDiv.innerHTML = this.getInnerHTML();
    //values sent to Cabbage should be normalized between 0 and 1
    const normValue = CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, 1);
    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: normValue, channelType: "number" }
    Cabbage.sendParameterUpdate(this.vscode, msg);
  }

  getInnerHTML() {
    if (this.props.visible === 0) {
      return '';
    }

    const popup = document.getElementById('popupValue');
    if (popup) {
      popup.textContent = this.props.valuePrefix + parseFloat(this.props.value).toFixed(this.decimalPlaces) + this.props.valuePostfix;
    }

    const alignMap = {
      'left': 'start',
      'center': 'middle',
      'centre': 'middle',
      'right': 'end',
    };

    const svgAlign = alignMap[this.props.align] || this.props.align;

    // Calculate text height
    let textHeight = this.props.text ? this.props.bounds.height * 0.1 : 0;
    const valueTextBoxHeight = this.props.valueTextBox ? this.props.bounds.height * 0.1 : 0;
    const sliderHeight = this.props.bounds.height - textHeight - valueTextBoxHeight * 1.1;

    const textX = this.props.bounds.width / 2;
    const fontSize = this.props.fontSize > 0 ? this.props.fontSize : this.props.bounds.width * 0.3;

    const thumbHeight = sliderHeight * 0.05;

    const textElement = this.props.text ? `
    <svg x="0" y="${this.props.valueTextBox ? 0 : this.props.bounds.height - textHeight}" width="${this.props.bounds.width}" height="${textHeight + 5}" preserveAspectRatio="xMinYMid meet" xmlns="http://www.w3.org/2000/svg">
      <text text-anchor="${svgAlign}" x="${textX}" y="${textHeight}" font-size="${fontSize}px" font-family="${this.props.fontFamily}" stroke="none" fill="${this.props.fontColour}">
        ${this.props.text}
      </text>
    </svg>
  ` : '';

    const sliderElement = `
    <svg x="0" y="${this.props.valueTextBox ? textHeight + 2 : 0}" width="${this.props.bounds.width}" height="${sliderHeight}" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="${this.props.bounds.width * 0.4}" y="1" width="${this.props.bounds.width * 0.2}" height="${sliderHeight * 0.95}" rx="2" fill="${this.props.trackerBackgroundColour}" stroke-width="${this.props.outlineWidth}" stroke="black"/>
      <rect x="${this.props.bounds.width * 0.4}" y="${sliderHeight - CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, sliderHeight * 0.95) - 1}" height="${CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, 1) * sliderHeight * 0.95}" width="${this.props.bounds.width * 0.2}" rx="2" fill="${this.props.trackerColour}" stroke-width="${this.props.trackerOutlineWidth}" stroke="${this.props.trackerOutlineColour}"/> 
      <rect x="${this.props.bounds.width * 0.3}" y="${sliderHeight - CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, thumbHeight + 1, sliderHeight - 1)}" width="${this.props.bounds.width * 0.4}" height="${thumbHeight}" rx="2" fill="${this.props.colour}" stroke-width="${this.props.outlineWidth}" stroke="black"/>
    </svg>
  `;

    const valueTextElement = this.props.valueTextBox ? `
    <foreignObject x="0" y="${this.props.bounds.height - valueTextBoxHeight + 2}" width="${this.props.bounds.width}" height="${valueTextBoxHeight}">
      <input type="text" value="${this.props.value.toFixed(CabbageUtils.getDecimalPlaces(this.props.range.increment))}"
      style="width:100%; outline: none; height:100%; text-align:center; font-size:${fontSize}px; font-family:${this.props.fontFamily}; color:${this.props.fontColour}; background:none; border:none; padding:0; margin:0;"
      onKeyDown="document.getElementById('${this.props.channel}').VerticalSliderInstance.handleInputChange(event)"/>
    </foreignObject>
  ` : '';

    return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none">
      ${textElement}
      ${sliderElement}
      ${valueTextElement}
    </svg>
  `;
  }




}
