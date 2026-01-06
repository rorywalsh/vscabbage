// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils } from "../utils.js";
import { Cabbage } from "../cabbage.js";
import { getCabbageMode } from "../sharedState.js";

/**
 * Rotary Slider (rslider) class
 */
export class RotarySlider {
  constructor() {
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 80,
        "height": 80
      },
      "channels": [
        {
          "id": "rotarySlider", "event": "valueChanged",
          "range": { "defaultValue": 0, "increment": 0.001, "max": 1, "min": 0, "skew": 1 }
        }
      ],
      "value": null,
      "zIndex": 0,
      "type": "rotarySlider",
      "velocity": 0,
      "popup": false,
      "visible": true,
      "active": true,
      "automatable": true,

      "label": {
        "text": "",
        "offsetY": 0,
        "align": "auto"
      },

      "valueText": {
        "visible": false,
        "width": "auto",
        "prefix": "",
        "postfix": "",
        "offsetY": 0
      },

      "style": {
        "opacity": 1,

        "thumb": {
          "radius": "auto",
          "backgroundColor": "#0295cf",
          "borderColor": "#525252",
          "borderWidth": 2
        },

        "track": {
          "width": "auto",
          "fillColor": "#93d200",
          "backgroundColor": "#393939"
        },

        "label": {
          "fontFamily": "Verdana",
          "fontSize": "auto",
          "fontColor": "#dddddd",
          "textAlign": "center"
        },

        "valueText": {
          "fontFamily": "Verdana",
          "fontSize": "auto",
          "fontColor": "#aaaaaa"
        },

        "shadow": {
          "offsetX": 2,
          "offsetY": 2,
          "blur": 4,
          "color": "rgba(0, 0, 0, 0.8)"
        }
      },

      "filmStrip": {
        "file": "",
        "frames": {
          "count": 64,
          "width": 64,
          "height": 64
        }
      }
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
    this.isDragging = false;
    this.decimalPlaces = 0;
    this.parameterIndex = 0;
    this.widgetDiv = null;
    this.hiddenProps = ['linearValue']; // Hide internal linearValue

    // Use centralized reactive props helper to manage visible/active toggling and cleanup
    this.props = CabbageUtils.createReactiveProps(this, this.props, {
      onPropertyChange: this.onPropertyChange
    });

  }

  onPropertyChange(change) {
    let { path, key, value, oldValue } = change || {};
    let newValue = value;
    if (typeof oldValue === 'object') {
      try { oldValue = JSON.stringify(oldValue); } catch (e) { oldValue = String(oldValue); }
      try { newValue = JSON.stringify(newValue); } catch (e) { newValue = String(newValue); }
    }

    // console.error(`Path ${path}, key ${key}, changed from ${oldValue} to ${newValue}`);
    if ((path && path.includes('filmStrip')) || (path && path.includes('currentCsdFile')) || (key && key.includes('currentCsdFile'))) {
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
        console.log("Cabbage: Loaded film strip image dimensions:", img.width, img.height);
        CabbageUtils.updateInnerHTML(this.props, this);
      };

      img.onerror = (error) => {
        console.log("Cabbage: Error loading film strip image", error);
      };
    } catch (error) {
      console.log("Cabbage: Failed to load film strip image:", error);
    }

  }

  pointerUp(evt) {
    if (!this.props.visible) {
      return '';
    }
    const popup = document.getElementById('popupValue');
    popup.classList.add('hide');
    popup.classList.remove('show');

    // Release pointer capture
    if (this.activePointerId !== undefined && evt.target) {
      try {
        evt.target.releasePointerCapture(this.activePointerId);
      } catch (e) {
        // Ignore errors if pointer was already released
      }
      this.activePointerId = undefined;
    }

    // Remove bound handlers if present
    if (this.boundPointerMove) window.removeEventListener("pointermove", this.boundPointerMove);
    if (this.boundPointerUp) window.removeEventListener("pointerup", this.boundPointerUp);
    this.isMouseDown = false;
    this.isDragging = false;
  }

  pointerDown(evt) {
    const range = CabbageUtils.getChannelRange(this.props, 0);
    console.log(`RotarySlider pointerDown:`, {
      channel: CabbageUtils.getChannelId(this.props),
      value: this.props.value,
      visible: this.props.visible,
      active: this.props.active,
      range: range,
      parameterIndex: this.parameterIndex
    });
    if (!this.props.visible) {
      return '';
    }

    // Respect active flag (disable interactions when inactive)
    if (!this.props.active) {
      return '';
    }

    // Don't perform slider actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    this.isMouseDown = true;
    this.isDragging = true;
    this.startY = evt.clientY;
    this.startValue = range.value !== null && range.value !== undefined ? range.value : range.defaultValue;
    // Validate startValue to prevent NaN
    if (isNaN(this.startValue) || this.startValue === null || this.startValue === undefined) {
      console.warn('Invalid startValue in rotarySlider pointerDown, using default', this.startValue);
      this.startValue = range.defaultValue ?? 0;
    }
    // Initialize linearStartValue here
    this.linearStartValue = this.getLinearValue(this.startValue);

    // Capture pointer to ensure we receive pointerup even if pointer leaves element
    evt.target.setPointerCapture(evt.pointerId);
    this.activePointerId = evt.pointerId;

    // Use bound handlers if available so removeEventListener works reliably
    const moveHandler = this.boundPointerMove || this.moveListener;
    const upHandler = this.boundPointerUp || this.upListener;
    if (!this.boundPointerMove) this.boundPointerMove = moveHandler;
    if (!this.boundPointerUp) this.boundPointerUp = upHandler;
    window.addEventListener("pointermove", this.boundPointerMove);
    window.addEventListener("pointerup", this.boundPointerUp);
  }

  mouseEnter(evt) {
    // If mouse button is down (dragging) and we're not the one being dragged, ignore
    if (evt.buttons !== 0 && !this.isMouseDown) {
      return;
    }

    if (!this.props.visible) {
      return '';
    }

    // Don't show popup in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const range = CabbageUtils.getChannelRange(this.props, 0);
    const popup = document.getElementById('popupValue');
    const form = document.getElementById('MainForm');
    const rect = form.getBoundingClientRect();
    this.decimalPlaces = CabbageUtils.getDecimalPlaces(range.increment);

    if (popup && this.props.popup) {
      popup.textContent = parseFloat(this.props.value ?? range.defaultValue).toFixed(this.decimalPlaces);

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
        popup.classList.add('right');
      } else {
        // Place popup on the right of the slider thumb
        popupLeft = formLeft + sliderLeft + sliderWidth + 10;
        popup.classList.remove('right');
      }

      const popupTop = rect.top + this.props.bounds.top + this.props.bounds.height * .5; // Adjust top position relative to the form's top

      // Set the calculated position
      popup.style.left = `${popupLeft}px`;
      popup.style.top = `${popupTop}px`;
      popup.style.display = 'block';
      popup.classList.add('show');
      popup.classList.remove('hide');
    }

  }

  mouseLeave(evt) {
    // Don't hide popup in edit mode (draggable mode) since it's not shown
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    if (!this.isMouseDown) {
      const popup = document.getElementById('popupValue');
      popup.classList.add('hide');
      popup.classList.remove('show');
    }
  }

  addVsCodeEventListeners(widgetDiv, vs) {
    this.vscode = vs;
    this.widgetDiv = widgetDiv;
    this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
    this.addEventListeners(widgetDiv);
  }

  addEventListeners(widgetDiv) {
    this.widgetDiv = widgetDiv;
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.addEventListener("mouseenter", this.mouseEnter.bind(this));
    widgetDiv.addEventListener("mouseleave", this.mouseLeave.bind(this));
    widgetDiv.RotarySliderInstance = this;
  }

  pointerMove({ clientY }) {
    if (!this.props.visible) {
      return '';
    }

    // If widget is inactive, ignore pointer moves
    if (!this.props.active) {
      return '';
    }

    // Don't perform slider actions in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return '';
    }

    const range = CabbageUtils.getChannelRange(this.props, 0);

    const steps = 200;

    // Calculate movement delta in normalized space
    const movementDelta = (clientY - this.startY) / steps;

    // Work entirely in linear normalized space (0-1) internally
    // Get the starting linear position from the start value
    const rangeSpan = range.max - range.min;
    const startLinearNormalized = (this.getLinearValue(this.startValue) - range.min) / rangeSpan;

    // Apply movement in linear space
    const newLinearNormalized = CabbageUtils.clamp(startLinearNormalized - movementDelta, 0, 1);

    // Convert to linear value in actual range
    const newLinearValue = newLinearNormalized * rangeSpan + range.min;

    // Convert to skewed value for display
    const newSkewedValue = this.getSkewedValue(newLinearValue);

    // Apply increment snapping to the skewed display value
    let snappedSkewedValue = Math.round(newSkewedValue / range.increment) * range.increment;

    // Clamp to range
    snappedSkewedValue = Math.min(range.max, Math.max(range.min, snappedSkewedValue));

    // Prevent NaN in snappedSkewedValue
    if (isNaN(snappedSkewedValue)) {
      console.error('snappedSkewedValue is NaN, setting to min');
      snappedSkewedValue = range.min;
    }

    // console.log(`RotarySlider pointerMove: startValue=${this.startValue}, newLinearValue=${newLinearValue}, snappedSkewedValue=${snappedSkewedValue}`);

    // Store the values
    this.props.channels[0].range.value = snappedSkewedValue; // What user sees (skewed)
    this.props.linearValue = newLinearValue; // For positioning

    // Update the widget display
    const widgetDiv = CabbageUtils.getWidgetDiv(this.props);
    widgetDiv.innerHTML = this.getInnerHTML();

    // Send denormalized value directly to backend
    const valueToSend = snappedSkewedValue;

    const msg = {
      paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0),
      channel: CabbageUtils.getChannelId(this.props),
      value: valueToSend,
      channelType: "number"
    };
    console.log("Cabbage: Sending value update", msg);
    Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);

  }  // Add this helper method to convert between linear and skewed values
  getSkewedValue(linearValue) {
    const range = CabbageUtils.getChannelRange(this.props, 0);
    const rangeSpan = range.max - range.min;
    if (rangeSpan === 0) return range.min;
    const normalizedValue = (linearValue - range.min) / rangeSpan;
    // Invert the skew for JUCE-like behavior
    const skewedNormalizedValue = Math.pow(normalizedValue, 1 / range.skew);
    return skewedNormalizedValue * rangeSpan + range.min;
  }

  getLinearValue(skewedValue) {
    const range = CabbageUtils.getChannelRange(this.props, 0);
    const rangeSpan = range.max - range.min;
    if (rangeSpan === 0) return range.min;
    const normalizedValue = (skewedValue - range.min) / rangeSpan;
    // Invert the skew for JUCE-like behavior
    const linearNormalizedValue = Math.pow(normalizedValue, range.skew);
    return linearNormalizedValue * rangeSpan + range.min;
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
    // Don't allow input changes in edit mode (draggable mode)
    if (getCabbageMode() === 'draggable') {
      return;
    }

    const range = CabbageUtils.getChannelRange(this.props, 0);

    if (evt.key === 'Enter') {
      const inputValue = parseFloat(evt.target.value);

      if (!isNaN(inputValue) && inputValue >= range.min && inputValue <= range.max) {
        // Store the input value as the skewed value (what user sees)
        this.props.channels[0].range.value = inputValue;

        // Convert to normalized space for the input value
        const skewedNormalized = (inputValue - range.min) / (range.max - range.min);

        // Convert to linear space
        const linearNormalized = Math.pow(skewedNormalized, 1 / range.skew);
        const linearValue = linearNormalized * (range.max - range.min) + range.min;

        // Store the linear value for knob positioning
        this.props.linearValue = linearValue;

        // Update the display
        const widgetDiv = CabbageUtils.getWidgetDiv(this.props);
        widgetDiv.innerHTML = this.getInnerHTML();
        widgetDiv.querySelector('input').focus();

        // Send denormalized value directly to backend
        const valueToSend = inputValue;
        const msg = {
          paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0),
          channel: CabbageUtils.getChannelId(this.props),
          value: valueToSend,
          channelType: "number"
        };
        if (this.props.automatable) {
          Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);
        }
      }
    } else if (evt.key === 'Escape') {
      const widgetDiv = CabbageUtils.getWidgetDiv(this.props);
      widgetDiv.querySelector('input').blur();
    }
  }

  drawFilmStrip() {
    if (!this.isImageLoaded) {
      return '';
    }

    const range = CabbageUtils.getChannelRange(this.props, 0);
    const totalFrames = this.props.filmStrip.frames.count;
    const originalFrameWidth = this.props.filmStrip.frames.width;
    const originalFrameHeight = this.props.filmStrip.frames.height;

    // Use linear value for frame calculation
    const currentValue = range.value !== null && range.value !== undefined ? range.value : range.defaultValue;
    const linearValue = this.props.linearValue ?? this.getLinearValue(currentValue);
    const linearNormalizedValue = (linearValue - range.min) / (range.max - range.min);
    const frameIndex = Math.round(linearNormalizedValue * (totalFrames - 1));

    // Use the stored image dimensions
    const imgWidth = this.imageWidth;
    const imgHeight = this.imageHeight;

    // Determine the orientation based on the loaded image dimensions
    const isHorizontal = imgWidth > imgHeight; // true if horizontal, false if vertical

    // Determine the current frame based on the slider value
    //const frameIndex = Math.round(CabbageUtils.map(this.props.value, this.props.range.min, this.props.range.max, 0, totalFrames - 1));

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
    const imagePath = CabbageUtils.getFullMediaPath(this.props.filmStrip.file, this.props.currentCsdFile || '');

    return `
      <image href="${imagePath}" x="${-offsetX}" y="${-offsetY}" width="${imageWidth}" height="${imageHeight}" />
    `;
  }

  getInnerHTML() {
    // console.log(`RotarySlider getInnerHTML: visible=${this.props.visible}, opacity=${this.props.thumb.opacity}`);
    const range = CabbageUtils.getChannelRange(this.props, 0);
    const currentValue = range.value !== null && range.value !== undefined ? range.value : range.defaultValue;
    const popup = document.getElementById('popupValue');
    if (popup) {
      popup.textContent = this.props.valueText.prefix + parseFloat(currentValue).toFixed(this.decimalPlaces) + this.props.valueText.postfix;
    }

    // Handle filmstrip display
    if (this.isImageLoaded) {
      const filmStripElement = this.drawFilmStrip();

      if (filmStripElement) {
        const labelFontSize = this.props.style.label.fontSize === "auto" || this.props.style.label.fontSize === 0
          ? (this.props.bounds.width > this.props.bounds.height ? this.props.bounds.height : this.props.bounds.width) * 0.18
          : this.props.style.label.fontSize;

        const labelY = this.props.bounds.height + (this.props.style.label.fontSize !== "auto" && this.props.style.label.fontSize > 0 ? this.props.label.offsetY : 0);

        return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.visible ? this.props.style.opacity : '0'}" style="pointer-events: ${this.props.visible && this.props.active ? 'auto' : 'none'};">
          ${filmStripElement}
        </svg>
        <div style="position: absolute; left: 50%; transform: translateX(-50%); top: ${labelY}px; font-size: ${labelFontSize}px; font-family: ${this.props.style.label.fontFamily}; color: ${this.props.style.label.fontColor}; text-align: center; white-space: nowrap; pointer-events: none;">${this.props.label.text}</div>
      `;
      }
    }

    // Calculate sizes and positions
    const minDimension = Math.min(this.props.bounds.width, this.props.bounds.height);
    let w = minDimension * 0.75;

    // Calculate track thickness/width (use width only; 'auto' means derive from size)
    const configuredTrackWidth = this.props.style.track.width;
    const trackThickness = configuredTrackWidth === "auto" ? (minDimension * 0.1) : configuredTrackWidth;
    const innerTrackerWidth = trackThickness - this.props.style.thumb.borderWidth;
    const innerTrackerEndPoints = this.props.style.thumb.borderWidth * 0.5;
    const trackerOutlineColour = this.props.style.thumb.borderWidth === 0 ? this.props.style.track.backgroundColor : this.props.style.thumb.borderColor;

    // Calculate paths
    const outerTrackerPath = this.describeArc(
      this.props.bounds.width / 2,
      this.props.bounds.height / 2,
      (w / 2) * (1 - (trackThickness / this.props.bounds.width / 2)),
      -130,
      132
    );

    const trackerPath = this.describeArc(
      this.props.bounds.width / 2,
      this.props.bounds.height / 2,
      (w / 2) * (1 - (trackThickness / this.props.bounds.width / 2)),
      -(130 - innerTrackerEndPoints),
      132 - innerTrackerEndPoints
    );

    // Calculate normalized value for positioning (currentValue is skewed)
    const normalizedValue = (currentValue - range.min) / (range.max - range.min);
    const angle = CabbageUtils.map(normalizedValue, 0, 1, -(130 - innerTrackerEndPoints), 132 - innerTrackerEndPoints);

    const trackerArcPath = this.describeArc(
      this.props.bounds.width / 2,
      this.props.bounds.height / 2,
      (w / 2) * (1 - (trackThickness / this.props.bounds.width / 2)),
      -(130 - innerTrackerEndPoints),
      angle
    );

    // Calculate font sizes
    const labelFontSize = this.props.style.label.fontSize === "auto" || this.props.style.label.fontSize === 0
      ? w * 0.24
      : this.props.style.label.fontSize;

    const valueTextSize = this.props.style.valueText.fontSize === "auto" || this.props.style.valueText.fontSize === 0
      ? w * 0.24
      : this.props.style.valueText.fontSize;

    // Calculate thumb radius
    const thumbRadius = this.props.style.thumb.radius === "auto" ? w * 0.367 : this.props.style.thumb.radius;

    const labelY = this.props.bounds.height + (this.props.style.label.fontSize !== "auto" && this.props.style.label.fontSize > 0 ? this.props.label.offsetY : 0);
    let scale = 100;

    // Render with value text visible
    if (this.props.valueText.visible) {
      const centerX = this.props.bounds.width / 2;
      const centerY = this.props.bounds.height / 2;

      // Get the increment value and calculate decimal places
      const incrementValue = range.increment !== undefined ? range.increment : 0.01;
      const decimalPlaces = CabbageUtils.getDecimalPlaces(incrementValue);

      // Calculate the maximum width of the input box based on the number of decimal places
      const maxValueLength = (range.max.toString().length + decimalPlaces + 1);
      let inputWidth = maxValueLength * valueTextSize * 0.5;

      // Check if the input width exceeds the slider width
      let actualValueTextSize = valueTextSize;
      if (inputWidth > this.props.bounds.width) {
        actualValueTextSize = (this.props.bounds.width / (maxValueLength * 0.5));
        inputWidth = this.props.bounds.width;
      }

      const inputX = 0;

      // Create label text
      const labelText = this.props.label.text;

      // Create shadow filter if color is specified (not empty or "none")
      const hasShadow = this.props.style.shadow.color && this.props.style.shadow.color !== "none";
      const shadowFilter = hasShadow ? `
        <defs>
          <filter id="thumbShadow-${CabbageUtils.getWidgetDivId(this.props)}" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="${this.props.style.shadow.offsetX}" dy="${this.props.style.shadow.offsetY}" stdDeviation="${this.props.style.shadow.blur}" flood-color="${this.props.style.shadow.color}"/>
          </filter>
        </defs>
      ` : '';

      const thumbFilter = hasShadow ? `filter="url(#thumbShadow-${CabbageUtils.getWidgetDivId(this.props)})"` : '';

      // Determine effective alignment
      let effectiveAlign = this.props.label.align || 'auto';
      if (effectiveAlign === 'auto') {
        effectiveAlign = this.props.valueText.visible ? 'top' : 'bottom';
      }

      let labelTop, valueTextTop;
      const valueTextHeight = Math.max(actualValueTextSize * (this.props.style.valueText.fontSize !== "auto" && this.props.style.valueText.fontSize > 0 ? 1.8 : 1.5), 18);

      if (effectiveAlign === 'top') {
        // Label Top, Value Bottom
        labelTop = this.props.label.offsetY;
        valueTextTop = this.props.bounds.height - valueTextHeight + this.props.valueText.offsetY;
      } else {
        // Label Bottom, Value Top
        labelTop = this.props.bounds.height - labelFontSize + this.props.label.offsetY;
        valueTextTop = this.props.valueText.offsetY;
      }

      return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.visible ? this.props.style.opacity : '0'}" style="pointer-events: ${this.props.visible && this.props.active ? 'auto' : 'none'};">
        ${shadowFilter}
        <path d='${outerTrackerPath}' id="arc" fill="none" stroke=${trackerOutlineColour} stroke-width=${this.props.style.thumb.borderWidth} />
        <path d='${trackerPath}' id="arc" fill="none" stroke=${this.props.style.track.backgroundColor} stroke-width=${innerTrackerWidth} />
        <path d='${trackerArcPath}' id="arc" fill="none" stroke=${this.props.style.track.fillColor} stroke-width=${innerTrackerWidth} />
  <circle cx=${this.props.bounds.width / 2} cy=${this.props.bounds.height / 2} r=${thumbRadius} stroke=${this.props.style.thumb.borderColor} fill="${this.props.style.thumb.backgroundColor}" stroke-width=${this.props.style.thumb.borderWidth} ${thumbFilter} />
        <foreignObject x="${inputX}" y="${valueTextTop}" width="${this.props.bounds.width}" height="${valueTextHeight}">
            <input type="text" xmlns="http://www.w3.org/1999/xhtml" value="${currentValue.toFixed(decimalPlaces)}"
            style="width:100%; outline: none; height:100%; text-align:center; font-size:${actualValueTextSize}px; font-family:${this.props.style.valueText.fontFamily}; color:${this.props.style.valueText.fontColor}; background:none; border:none; padding:0; margin:0; line-height:1; box-sizing:border-box;"
            onKeyDown="document.getElementById('${CabbageUtils.getWidgetDivId(this.props)}').RotarySliderInstance.handleInputChange(event)"/>
        />
        </foreignObject>
        </svg>
        <div style="position: absolute; left: 50%; transform: translateX(-50%); top: ${labelTop}px; font-size: ${labelFontSize}px; font-family: ${this.props.style.label.fontFamily}; color: ${this.props.style.label.fontColor}; text-align: center; white-space: nowrap; pointer-events: none;">${labelText}</div>
      `;
    }

    // Render without value text (label only)
    // Create shadow filter if color is specified (not empty or "none")
    const hasShadow = this.props.style.shadow.color && this.props.style.shadow.color !== "none";
    const shadowFilter = hasShadow ? `
      <defs>
        <filter id="thumbShadow-${CabbageUtils.getWidgetDivId(this.props)}" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="${this.props.style.shadow.offsetX}" dy="${this.props.style.shadow.offsetY}" stdDeviation="${this.props.style.shadow.blur}" flood-color="${this.props.style.shadow.color}"/>
        </filter>
      </defs>
    ` : '';

    const thumbFilter = hasShadow ? `filter="url(#thumbShadow-${CabbageUtils.getWidgetDivId(this.props)})"` : '';

    // Determine effective alignment
    let effectiveAlign = this.props.label.align || 'auto';
    if (effectiveAlign === 'auto') {
      effectiveAlign = 'bottom'; // Default for no value text
    }

    let labelTop;
    if (effectiveAlign === 'top') {
      labelTop = this.props.label.offsetY;
    } else {
      // Bottom
      labelTop = labelY - labelFontSize;
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${scale}%" height="${scale}%" preserveAspectRatio="none" opacity="${this.props.visible ? this.props.style.opacity : '0'}" style="pointer-events: ${this.props.visible && this.props.active ? 'auto' : 'none'};">
      ${shadowFilter}
      <path d='${outerTrackerPath}' id="arc" fill="none" stroke=${trackerOutlineColour} stroke-width=${this.props.style.thumb.borderWidth} />
      <path d='${trackerPath}' id="arc" fill="none" stroke=${this.props.style.track.backgroundColor} stroke-width=${innerTrackerWidth} />
      <path d='${trackerArcPath}' id="arc" fill="none" stroke=${this.props.style.track.fillColor} stroke-width=${innerTrackerWidth} />
  <circle cx=${this.props.bounds.width / 2} cy=${this.props.bounds.height / 2} r=${thumbRadius} stroke=${this.props.style.thumb.borderColor} fill="${this.props.style.thumb.backgroundColor}" stroke-width=${this.props.style.thumb.borderWidth} ${thumbFilter} />
      </svg>
      <div style="position: absolute; left: 50%; transform: translateX(-50%); top: ${labelTop}px; font-size: ${labelFontSize}px; font-family: ${this.props.style.label.fontFamily}; color: ${this.props.style.label.fontColor}; text-align: center; white-space: nowrap; pointer-events: none;">${this.props.label.text}</div>
    `;
  }
}
