// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils } from "../utils.js";
import { Cabbage } from "../cabbage.js";

/**
 * Rotary Slider (rslider) class
 */
export class RotarySlider {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 60,
        "height": 60
      },
      "channel": "rotarySlider",
      "range": {
        "min": 0,
        "max": 1,
        "defaultValue": 0,
        "skew": 1,
        "increment": 0.001
      },
      "value": null,
      "index": 0,
      "text": "",
      "font": {
        "family": "Verdana",
        "size": 0,
        "align": "centre",
        "colour": "#dddddd"
      },
      "textOffsetY": 0,
      "valueTextBox": 1,
      "colour": {
        "fill": "#0295cf",
        "stroke": {
          "colour": "#525252",
          "width": 2
        },
        "tracker": {
          "fill": "#93d200",
          "background": "#ffffff"
        }
      },
      "filmStrip": {
        "file": "",
        "frames": {
          "count": 64,
          "width": 64,
          "height": 64
        }
      },
      "trackerWidth": 20,
      "type": "rotarySlider",
      "decimalPlaces": 1,
      "velocity": 0,
      "popup": 0,
      "visible": 1,
      "automatable": 1,
      "valuePrefix": "",
      "valuePostfix": "",
      "opacity": 1
    };

    this.imageWidth = 0;
    this.imageHeight = 0;
    this.isImageLoaded = false;
    this.moveListener = this.pointerMove.bind(this);
    this.upListener = this.pointerUp.bind(this);
    this.startY = 0;
    this.startValue = 0;
    this.vscode = null;
    this.isMouseDown = false;
    this.decimalPlaces = 0;
    this.parameterIndex = 0;

    // Create a Proxy to listen for changes
    this.props = new Proxy(this.props, {
      set: (target, key, value) => {
        const oldValue = target[key];
        // Track the path of the key being set, including the parent object
        const path = CabbageUtils.getPath(target, key);

        // Set the value as usual
        target[key] = value;

        // Custom logic: trigger your onPropertyChange method with the path
        if (this.onPropertyChange) {
          this.onPropertyChange(path, key, value, oldValue);  // Pass the full path and value
        }

        return true;
      }
    });

  }

  onPropertyChange(path, key, newValue, oldValue) {
    if (typeof oldValue === 'object') {
      oldValue = JSON.stringify(oldValue);
      newValue = JSON.stringify(newValue);
    }

    // console.error(`Path ${path}, key ${key}, changed from ${oldValue} to ${newValue}`);
    if (path.includes('filmStrip') || path.includes('currentCsdFile') || key.includes('currentCsdFile')) {
      console.log(`Changed ${key} from ${oldValue} to ${newValue}`);
      this.loadFilmStripImage();
    }
    // Handle the change, e.g., update UI, trigger events, etc.
  }

  /**
   * Loads a filmStrip image from the provided file path
   * in order to query its dimensions
   * @returns {string} HTML string
   */
  async loadFilmStripImage() {
    if (!this.props.filmStrip.file) {
      return;
    }

    try {
      const img = new Image();
      const mediaPath = this.props.currentCsdFile || ''; // Get path from props
      const imagePath = CabbageUtils.getFullMediaPath(this.props.filmStrip.file, mediaPath);

      img.src = imagePath;
      img.onload = () => {
        this.imageWidth = img.width;
        this.imageHeight = img.height;
        this.isImageLoaded = true;
        console.log("Loaded film strip image dimensions:", img.width, img.height);
        CabbageUtils.updateInnerHTML(this.props.channel, this);
      };

      img.onerror = (error) => {
        console.log("Error loading film strip image", error);
      };
    } catch (error) {
      console.log("Failed to load film strip image:", error);
    }

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

    this.isMouseDown = true;
    this.startY = evt.clientY;
    this.startValue = this.props.value;
    window.addEventListener("pointermove", this.moveListener);
    window.addEventListener("pointerup", this.upListener);
  }

  mouseEnter(evt) {
    if (this.props.active === 0) {
      return '';
    }

    const popup = document.getElementById('popupValue');
    const form = document.getElementById('MainForm');
    const rect = form.getBoundingClientRect();
    this.decimalPlaces = CabbageUtils.getDecimalPlaces(this.props.range.increment);

    if (popup && this.props.popup === 1) {
      popup.textContent = parseFloat(this.props.value).toFixed(this.decimalPlaces);

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

      const popupTop = rect.top + this.props.bounds.top + this.props.bounds.height * .5; // Adjust top position relative to the form's top

      // Set the calculated position
      popup.style.left = `${popupLeft}px`;
      popup.style.top = `${popupTop}px`;
      popup.style.display = 'block';
      console.log("Popup left", popup.style.left, "Popup top", popup.style.top);
      popup.classList.add('show');
      popup.classList.remove('hide');
    }

    console.log("pointerEnter", this);
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
    this.addEventListeners(widgetDiv);
  }

  addEventListeners(widgetDiv) {
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.addEventListener("mouseenter", this.mouseEnter.bind(this));
    widgetDiv.addEventListener("mouseleave", this.mouseLeave.bind(this));
    widgetDiv.RotarySliderInstance = this;
  }

  pointerMove({ clientY }) {
    if (this.props.active === 0) {
      return '';
    }

    const steps = 200;
    const valueDiff = ((this.props.range.max - this.props.range.min) * (clientY - this.startY)) / steps;
    const value = CabbageUtils.clamp(this.startValue - valueDiff, this.props.range.min, this.props.range.max);

    this.props.value = Math.round(value / this.props.range.increment) * this.props.range.increment;

    const widgetDiv = document.getElementById(this.props.channel);
    widgetDiv.innerHTML = this.getInnerHTML();

    //values sent to Cabbage should be normalized between 0 and 1
    const newValue = CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, 1);
    const msg = { paramIdx: this.parameterIndex, channel: this.props.channel, value: newValue, channelType: "number" };
    Cabbage.sendParameterUpdate(this.vscode, msg);
  }

  // https://stackoverflow.com/questions/20593575/making-circular-progress-bar-with-html5-svg
  polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  describeArc(x, y, radius, startAngle, endAngle) {
    var start = this.polarToCartesian(x, y, radius, endAngle);
    var end = this.polarToCartesian(x, y, radius, startAngle);

    var largeArcFlag = "0";
    if (endAngle >= startAngle) {
      largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    } else {
      largeArcFlag = endAngle + 360.0 - startAngle <= 180 ? "0" : "1";
    }

    var d = ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");

    return d;
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
    } else if (evt.key === 'Esc') {
      const widgetDiv = document.getElementById(this.props.channel);
      widgetDiv.querySelector('input').blur();
    }
  }

  drawFilmStrip() {
    if (!this.isImageLoaded) {
      return '';
    }

    const totalFrames = this.props.filmStrip.frames.count;
    const originalFrameWidth = this.props.filmStrip.frames.width;
    const originalFrameHeight = this.props.filmStrip.frames.height;

    // Use the stored image dimensions
    const imgWidth = this.imageWidth;
    const imgHeight = this.imageHeight;

    // Determine the orientation based on the loaded image dimensions
    const isHorizontal = imgWidth > imgHeight; // true if horizontal, false if vertical
    console.log("Original image:", imgWidth, imgHeight);

    // Determine the current frame based on the slider value
    const frameIndex = Math.round(CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, totalFrames - 1));

    // Set the width and height based on the slider dimensions
    const sliderWidth = this.props.bounds.width;
    const sliderHeight = this.props.bounds.height;

    // Set the image dimensions based on orientation
    const frameHeight = originalFrameHeight * ((sliderHeight / originalFrameHeight));
    const frameWidth = originalFrameWidth * ((sliderWidth / originalFrameWidth));
    const imageWidth = !isHorizontal ? sliderWidth : frameWidth * totalFrames; // Match slider width for horizontal
    const imageHeight = !isHorizontal ? frameHeight * totalFrames : sliderHeight; // Match slider height for vertical

    // Calculate the offset based on orientation
    const offsetX = isHorizontal ? frameIndex * frameWidth : 0; // Only offset X for horizontal
    const offsetY = isHorizontal ? 0 : frameIndex * frameHeight; // Only offset Y for vertical

    // Log the calculated values for debugging
    console.log("Frame Index:", frameIndex, "Frame width", frameWidth, "Frame height", frameHeight);
    console.log("Offset X:", offsetX, "Offset Y:", offsetY);
    console.log("Image Width:", imageWidth, "Image Height:", imageHeight);
    const imagePath = CabbageUtils.getFullMediaPath(this.props.filmStrip.file, this.props.currentCsdFile || '');

    return `
      <image href="${imagePath}" x="${-offsetX}" y="${-offsetY}" width="${imageWidth}" height="${imageHeight}" />
    `;
  }

  getInnerHTML() {
    if (this.props.visible === 0) {
      return '';
    }

    const popup = document.getElementById('popupValue');
    if (popup) {
      popup.textContent = this.props.valuePrefix + parseFloat(this.props.value).toFixed(this.decimalPlaces) + this.props.valuePostfix;
    }

    if (this.isImageLoaded) {

      const filmStripElement = this.drawFilmStrip();

      if (filmStripElement) {
        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.opacity}">
          ${filmStripElement}
          <text text-anchor="middle" x=${this.props.bounds.width / 2} y=${this.props.bounds.height + (this.props.font.size > 0 ? this.props.textOffsetY : 0)} font-size="${this.props.font.size}px" font-family="${this.props.font.family}" stroke="none" fill="${this.props.font.colour}">${this.props.text}</text>
        </svg>
      `;
      }
    }
    console.log("Drawing rotary slider", this.props.colour);
    let w = (this.props.bounds.width > this.props.bounds.height ? this.props.bounds.height : this.props.bounds.width) * 0.75;
    const innerTrackerWidth = this.props.trackerWidth - this.props.colour.stroke.width; // Updated reference
    const innerTrackerEndPoints = this.props.colour.stroke.width * 0.5;
    const trackerOutlineColour = this.props.colour.stroke.width === 0 ? this.props.colour.tracker.background : this.props.colour.stroke.colour;

    const outerTrackerPath = this.describeArc(this.props.bounds.width / 2, this.props.bounds.height / 2, (w / 2) * (1 - (this.props.trackerWidth / this.props.bounds.width / 2)), -130, 132); // Updated reference
    const trackerPath = this.describeArc(this.props.bounds.width / 2, this.props.bounds.height / 2, (w / 2) * (1 - (this.props.trackerWidth / this.props.bounds.width / 2)), -(130 - innerTrackerEndPoints), 132 - innerTrackerEndPoints); // Updated reference
    const trackerArcPath = this.describeArc(this.props.bounds.width / 2, this.props.bounds.height / 2, (w / 2) * (1 - (this.props.trackerWidth / this.props.bounds.width / 2)), -(130 - innerTrackerEndPoints), CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, -(130 - innerTrackerEndPoints), 132 - innerTrackerEndPoints)); // Updated reference

    // Calculate proportional font size if this.props.fontSize is 0
    let fontSize = this.props.font.size > 0 ? this.props.font.size : w * 0.24;
    const textY = this.props.bounds.height + (this.props.font.size > 0 ? this.props.textOffsetY : 0);
    let scale = 100;

    if (this.props.valueTextBox === 1) {
      scale = 0.7;
      const moveY = 5;

      const centerX = this.props.bounds.width / 2;
      const centerY = this.props.bounds.height / 2;

      // Get the increment value and calculate decimal places
      const incrementValue = this.props.range.increment !== undefined ? this.props.range.increment : 0.01;
      const decimalPlaces = CabbageUtils.getDecimalPlaces(incrementValue);

      // Calculate the maximum width of the input box based on the number of decimal places
      const maxValueLength = (this.props.range.max.toString().length + decimalPlaces + 1); // +1 for the decimal point
      let inputWidth = maxValueLength * fontSize * 0.5; // Adjust multiplier as needed for padding

      // Check if the input width exceeds the slider width
      if (inputWidth > this.props.bounds.width) {
        // Resize the font size proportionally
        fontSize = (this.props.bounds.width / (maxValueLength * 0.5)); // Adjust multiplier as needed
        inputWidth = this.props.bounds.width; // Set input width to slider width
      }

      // Set inputX to 0 to take full width
      const inputX = 0;

      return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none"  opacity="${this.props.opacity}">
        <text text-anchor="middle" x=${this.props.bounds.width / 2} y="${fontSize}px" font-size="${fontSize}px" font-family="${this.props.font.family}" stroke="none" fill="${this.props.font.colour}">${this.props.text}</text>
        <g transform="translate(${centerX}, ${centerY + moveY}) scale(${scale}) translate(${-centerX}, ${-centerY})">
        <path d='${outerTrackerPath}' id="arc" fill="none" stroke=${trackerOutlineColour} stroke-width=${this.props.colour.stroke.width} />
        <path d='${trackerPath}' id="arc" fill="none" stroke=${this.props.colour.tracker.background} stroke-width=${innerTrackerWidth} />
        <path d='${trackerArcPath}' id="arc" fill="none" stroke=${this.props.colour.tracker.fill} stroke-width=${innerTrackerWidth} />
        <circle cx=${this.props.bounds.width / 2} cy=${this.props.bounds.height / 2} r=${(w / 2) - this.props.trackerWidth * 0.65} stroke=${this.props.colour.stroke.colour} fill="${this.props.colour.fill}" stroke-width=${this.props.colour.stroke.width} /> <!-- Updated fill color -->
        </g>
        <foreignObject x="${inputX}" y="${textY - fontSize * 1.5}" width="${this.props.bounds.width}" height="${fontSize * 2}">
            <input type="text" xmlns="http://www.w3.org/1999/xhtml" value="${this.props.value.toFixed(decimalPlaces)}"
            style="width:100%; outline: none; height:100%; text-align:center; font-size:${fontSize}px; font-family:${this.props.font.family}; color:${this.props.font.colour}; background:none; border:none; padding:0; margin:0;"
            onKeyDown="document.getElementById('${this.props.channel}').RotarySliderInstance.handleInputChange(event)"/>
        />
        </foreignObject>
        </svg>
      `;
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${scale}%" height="${scale}%" preserveAspectRatio="none"  opacity="${this.props.opacity}">
      <path d='${outerTrackerPath}' id="arc" fill="none" stroke=${trackerOutlineColour} stroke-width=${this.props.colour.stroke.width} />
      <path d='${trackerPath}' id="arc" fill="none" stroke=${this.props.colour.tracker.background} stroke-width=${innerTrackerWidth} />
      <path d='${trackerArcPath}' id="arc" fill="none" stroke=${this.props.colour.tracker.fill} stroke-width=${innerTrackerWidth} />
      <circle cx=${this.props.bounds.width / 2} cy=${this.props.bounds.height / 2} r=${(w / 2) - this.props.trackerWidth * 0.65} stroke=${this.props.colour.stroke.colour} fill="${this.props.colour.fill}" stroke-width=${this.props.colour.stroke.width} /> <!-- Updated fill color -->
      <text text-anchor="middle" x=${this.props.bounds.width / 2} y=${textY} font-size="${fontSize}px" font-family="${this.props.font.family}" stroke="none" fill="${this.props.font.colour}">${this.props.text}</text>
      </svg>
    `;
  }
}
