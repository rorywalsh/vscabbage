export class CabbageUtils {
  static updateInnerHTML(channel, instance) {
    const element = document.getElementById(channel);
    if (element) {
      element.innerHTML = instance.getInnerHTML();
    }
  }

  static getFileNameFromPath(fullPath) {
    return fullPath.split(/[/\\]/).pop();
  }


  /**
   * this function will return the number of plugin parameter in our widgets array
   */
  static getNumberOfPluginParameters(widgets) {

    // Initialize the counter
    let count = 0;

    // Iterate over each widget in the array
    for (const widget of widgets) {
      // Check if the widget's type is one of the specified types
      if (widget.props.automatable === 1) {
        // Increment the counter if the type matches
        count++;
      }
    }

    // Return the final count
    return count;
  }

  /**
   * show / hide Cabbage overlays
   */
  static showOverlay() {
    const overlay = document.getElementById('fullScreenOverlay')
    if (overlay) {
      overlay.style.display = 'flex';
      const leftPanel = document.getElementById('LeftPanel');
      const rightPanel = document.getElementById('RightPanel');
      leftPanel.style.display = 'none';
      rightPanel.style.display = 'none';
    }
  }

  static hideOverlay() {
    const overlay = document.getElementById('fullScreenOverlay')
    if (overlay) {
      overlay.style.display = 'none';
      const leftPanel = document.getElementById('LeftPanel');
      const rightPanel = document.getElementById('RightPanel');
      leftPanel.style.display = 'flex';
      rightPanel.style.display = 'flex';
    }
  }

  /**
   * clamps a value
   * @param {*} num 
   * @param {*} min 
   * @param {*} max 
   * @returns clamped value
   */
  static clamp(num, min, max) {
    return Math.max(min, Math.min(num, max));
  }

  /**
   * returns a remapped value
   * @param {*} value 
   * @param {*} in_min 
   * @param {*} in_max 
   * @param {*} out_min 
   * @param {*} out_max 
   * @returns mapped value
   */
  static map(value, in_min, in_max, out_min, out_max) {
    return ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
  };

  /**
   * 
   * @param {*} num 
   * @returns number of decimal places in value
   */
  static getDecimalPlaces(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        console.warn('Invalid input to getDecimalPlaces:', num);
        return 0; // or some default value
    }
    const str = num.toString();
    const decimalIndex = str.indexOf('.');
    return decimalIndex === -1 ? 0 : str.length - decimalIndex - 1;
}

  /**
   * Returns a unique channel name based on the type and number
   * @param {Array} widgets - Array of JSON objects with unique 'channel' values
   * @returns {String} unique channel name
   */
  static getUniqueChannelName(type, widgets) {
    // Extract all existing channel names
    const existingChannels = widgets.map(widget => widget.channel);

    // Define a function to generate a channel name based on type and a number
    function generateChannelName(type, number) {
      return `${type}${number}`;
    }

    // Start with a number based on the size of the array + 1
    let number = widgets.length + 1;
    let newChannelName = generateChannelName(type, number);

    // Increment the number until a unique channel name is found
    while (existingChannels.includes(newChannelName)) {
      number += 1;
      newChannelName = generateChannelName(type, number);
    }

    return newChannelName;
  }

  static findValidId(event) {
    var target = event.target;

    while (target !== null) {
      if (target.tagName === "DIV" && target.id) {
        return target.id;
      }
      target = target.parentNode;
    }

    return null
  }

  static getElementByIdInChildren(parentElement, targetId) {
    const queue = [parentElement];

    while (queue.length > 0) {
      const currentElement = queue.shift();

      // Check if the current element has the target ID
      if (currentElement.id === targetId) {
        return currentElement;
      }

      // Check if the current element has children
      if (currentElement.children && currentElement.children.length > 0) {
        // Convert HTMLCollection to an array and add the children of the current element to the queue
        const childrenArray = Array.from(currentElement.children);
        queue.push(...childrenArray);
      }
    }

    // If no element with the target ID is found, return null
    return null;
  }

  static getWidgetFromChannel(channel, widgets) {
    widgets.forEach((widget) => {
      console.log("widget channel", widget.channel);
      if (widget["channel"] === channel) { return widget; }
    });
    return null;
  }

  static getStringWidth(text, props, padding = 10) {
    var canvas = document.createElement('canvas');
    let fontSize = 0;
    switch (props.type) {

      case 'horizontalSlider':
        fontSize = props.height * .8;
        break;
      case "rotarySlider":
        fontSize = props.width * .3;
        break;
      case "verticalSlider":
        fontSize = props.width * .3;
        break;
      case "comboBox":
        fontSize = props.height * .5;
        break;
      default:
        console.error('getStringWidth..');
        break;
    }

    var ctx = canvas.getContext("2d");
    ctx.font = `${fontSize}px ${props.fontFamily}`;
    var width = ctx.measureText(text).width;
    return width + padding;
  }

  static getNumberBoxWidth(props) {
    // Get the number of decimal places in props.range.increment
    const decimalPlaces = CabbageUtils.getDecimalPlaces(props.range.increment);

    // Format props.max with the correct number of decimal places
    const maxNumber = props.range.max.toFixed(decimalPlaces);

    // Calculate the width of the string representation of maxNumber
    const maxNumberWidth = CabbageUtils.getStringWidth(maxNumber, props);

    return maxNumberWidth;
  }


  static getWidgetDiv(channel) {
    const element = document.getElementById(channel);
    return element || null;
  }

  static sendToBack(currentDiv) {
    const parentElement = currentDiv.parentElement;
    const allDivs = parentElement.getElementsByTagName('div');
    console.log(currentDiv);
    console.log(allDivs);
    for (let i = 0; i < allDivs.length; i++) {
      if (allDivs[i] !== currentDiv) {
        allDivs[i].style.zIndex = 1; // Bring other divs to the top
      } else {
        allDivs[i].style.zIndex = 0; // Keep the current div below others
      }
    }
  }

  static updateBounds(props, identifier) {
    console.log('updateBounds called with:', JSON.stringify(props), identifier);
    const element = document.getElementById(props.channel);
    if (element && props.bounds) {
      switch (identifier) {
        case 'bounds.left':
          element.style.left = props.bounds.left + "px";
          console.log('Updated left to:', props.bounds.left);
          break;
        case 'bounds.top':
          element.style.top = props.bounds.top + "px";
          console.log('Updated top to:', props.bounds.top);
          break;
        case 'bounds.width':
          element.style.width = props.bounds.width + "px";
          console.log('Updated width to:', props.bounds.width);
          break;
        case 'bounds.height':
          element.style.height = props.bounds.height + "px";
          console.log('Updated height to:', props.bounds.height);
          break;
        default:
          console.log('Unhandled identifier:', identifier);
      }
    } else {
      console.log('Element or bounds not found:', props.channel, props.bounds);
    }
  }
}

export class CabbageColours {

  /**
     * Converts various color formats to a hex string.
     * @param {string|array} color - The color to convert (RGBA array, RGB array, hex string, or CSS color name).
     * @returns {string} - The hex string representation of the color.
     */
  static toHex(color) {
    if (Array.isArray(color)) {
      // Handle RGBA or RGB array
      if (color.length === 3) {
        // RGB
        return `#${((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2]).toString(16).slice(1)}`;
      } else if (color.length === 4) {
        // RGBA
        return `#${((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2]).toString(16).slice(1)}`;
      }
    } else if (typeof color === 'string') {
      // Handle hex string
      if (color.startsWith('#')) {
        return color.length === 7 ? color : color + color.slice(1); // Expand shorthand hex
      }
      // Handle CSS color name
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.fillStyle = color;
      return context.fillStyle; // This will return the hex value
    }
    throw new Error('Invalid color format');
  }

  static changeSelectedBorderColor(newColor) {
    // Loop through all stylesheets
    for (let i = 0; i < document.styleSheets.length; i++) {
      const styleSheet = document.styleSheets[i];

      try {
        // Loop through all rules in the stylesheet
        for (let j = 0; j < styleSheet.cssRules.length; j++) {
          const rule = styleSheet.cssRules[j];

          if (rule.selectorText && rule.selectorText.trim() === '.selected') {
            // Modify the border color
            rule.style.borderColor = newColor;
            return; // Exit once the rule is found and updated
          }
        }
      } catch (e) {
        // Catch and ignore SecurityError: The operation is insecure.
        if (e.name !== 'SecurityError') { throw e; }
      }
    }
  }

  static invertColor(hex) {
    console.trace();
    // Remove the hash at the start if it's there
    hex = hex.replace('#', '');

    // Parse the r, g, b values
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Invert the colors
    r = 255 - r;
    g = 255 - g;
    b = 255 - b;

    // Convert back to hex
    const invertedHex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;

    return invertedHex;
  }

  /**
   * Adjusts the alpha value of a hex color.
   * @param {string} hex - The original hex color (e.g., '#RRGGBB' or '#RRGGBBAA').
   * @param {number} alpha - The alpha value (0 to 1).
   * @return {string} The new hex color with the specified alpha value.
   */
  static adjustAlpha(hex, alpha) {
    // Ensure hex is in the format '#RRGGBB' or '#RRGGBBAA'
    hex = hex.replace('#', '');

    if (hex.length === 3) {
      hex = hex.split('').map(c => c + c).join(''); // Convert shorthand '#RGB' to '#RRGGBB'
    }

    // Ensure alpha is within the valid range
    alpha = Math.min(1, Math.max(0, alpha));

    // Convert alpha to a two-digit hex value
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');

    // Return the new hex color
    if (hex.length === 6) {
      return `#${hex}${alphaHex}`;
    } else if (hex.length === 8) {
      return `#${hex.slice(0, 6)}${alphaHex}`;
    } else {
      throw new Error('Invalid hex color format');
    }
  }
  static getColour(colourName) {
    const colourMap = {
      "blue": "#0295cf",
      "green": "#93d200",
      "red": "#ff0000",
      "yellow": "#f0e14c",
      "purple": "#a020f0",
      "orange": "#ff6600",
      "grey": "#808080",
      "white": "#ffffff",
      "black": "#000000"
    };

    return colourMap[colourName] || colourMap["blue"];
  }
  static lighter(hex, amount) {
    return this.adjustBrightness(hex, amount);
  }

  static darker(hex, amount) {
    return this.adjustBrightness(hex, -amount);
  }

  static adjustBrightness(hex, factor) {
    // Remove the hash at the start if it's there
    hex = hex.replace(/^#/, '');

    // Parse r, g, b values
    let r = parseInt(hex.slice(0, 2), 16);
    let g = parseInt(hex.slice(2, 4), 16);
    let b = parseInt(hex.slice(4, 6), 16);

    // Apply the factor to each color component
    r = Math.round(Math.min(255, Math.max(0, r + (r * factor))));
    g = Math.round(Math.min(255, Math.max(0, g + (g * factor))));
    b = Math.round(Math.min(255, Math.max(0, b + (b * factor))));

    // Convert back to hex and pad with zeroes if necessary
    r = r.toString(16).padStart(2, '0');
    g = g.toString(16).padStart(2, '0');
    b = b.toString(16).padStart(2, '0');

    return `#${r}${g}${b}`;
  }

}

/*
* This class contains utility functions for testing the Cabbage UI
*/
export class CabbageTestUtilities {

  static createWidgetInstances(widgetConstructors) {
    const widgetInstances = {};

    for (const [key, Constructor] of Object.entries(widgetConstructors)) {
      widgetInstances[key] = new Constructor();
    }

    return widgetInstances;
  }

  /*
  * Generate a CabbageWidgetDescriptors class with all the identifiers for each widget type, this can be inserted
  directly into the Cabbage source code
  */
  static generateCabbageWidgetDescriptorsClass(widgetConstructors) {
    const widgets = {};
    for (const [key, Constructor] of Object.entries(widgetConstructors)) {
      widgets[key] = new Constructor();
      console.log(widgets[key]);
    }

    let widgetTypes = '{';
    for (const widget of Object.values(widgets)) {
      widgetTypes += `"${widget.props.type}", `;
    }
    widgetTypes = widgetTypes.slice(0, -2) + "};";

    let cppCode = `
  #pragma once
  
  /* this file is generated by CabbageUtils.js */
  #include <iostream>
  #include <regex>
  #include <string>
  #include <vector>
  #include "json.hpp"
  #include "CabbageUtils.h"
  
  class CabbageWidgetDescriptors {
  public:
      static std::vector<std::string> getWidgetTypes(){
          return ${widgetTypes};
      }
  
      static nlohmann::json get(std::string widgetType) {
  `;

    // Generate the widget descriptors for each widget type
    for (const widget of Object.values(widgets)) {
      const jsonString = JSON.stringify(widget.props, null, 2).split('\n').map(line => `            ${line}`).join('\n');
      cppCode += `
          if (widgetType == "${widget.props.type}") {
              std::string jsonString = R"(
  ${jsonString}
              )";
              return nlohmann::json::parse(jsonString);
          }`;
    }

    cppCode += `
          cabAssert(false, "Invalid widget type");
      }
  };
  `;

    console.error(cppCode);
  }


  /*
  * Generate a CSD file from the widgets array and tests all identifiers. For now this only tests numeric values
  * for each widget type using cabbageSetValue and only string types for cabbageSet
  */
  static generateIdentifierTestCsd(widgets) {
    let csoundCode = "<Cabbage>\nform size(800, 400)";

    widgets.forEach((widget) => {
      csoundCode += `   ${widget.props.type} bounds(-1000, 0, 100, 100)\n`;
    });

    csoundCode += `   csoundoutput bounds(0, 0, 780, 380)\n`;
    csoundCode += "</Cabbage>\n";

    csoundCode += `
<CsoundSynthesizer>
<CsOptions>
-n -d -m0d
</CsOptions> 
<CsInstruments>
; Initialize the global variables. 
ksmps = 32
nchnls = 2
0dbfs = 1
`;

    // Instrument for setting string values
    csoundCode += `
    
giErrorCnt init 0
giIdentifiersChecked init 0    

instr CabbageSetString
  SChannel strcpy p4
  SIdentifier strcpy p5
  SString strcpy p6
  cabbageSet SChannel, sprintf("%s(\\"%s\\")", SIdentifier, SString)
endin

instr CabbageCheckString
  SChannel strcpy p4
  SIdentifier strcpy p5
  SString strcpy p6
  S1 cabbageGet SChannel, SIdentifier
  iRes strcmp S1, SString
  if iRes != 0 then
      prints("")
      prints("=========CabbageCheckString============")
      prints("")
      prints sprintf("CabbageCheckString Error: %s %s", SChannel, SIdentifier)
      prints sprintf("CurrentValue: [%s] Incoming value: [%s]", S1, SString)
      prints sprintf("Size of string: [%d] Incoming size: [%d]", strlen(S1), strlen(SString))
      giErrorCnt += 1
  endif
  giIdentifiersChecked += 1
  prints(sprintf("Checked %d identifiers", giIdentifiersChecked))
endin

instr CabbageSetFloat
  SChannel strcpy p4
  SIdentifier strcpy p5
  SString = sprintf("%s(%3.3f)", SIdentifier, p6)
  cabbageSet SChannel,SString 
endin

instr CabbageCheckFloat
  SChannel strcpy p4
  SIdentifier strcpy p5
  i1 cabbageGet SChannel, SIdentifier
  ;checking floats can be iffy..
  if i1 <= p6-0.01 || i1 >= p6+0.01 then
        prints("")
        prints("=========CabbageCheckInt============")
        prints("")
        prints sprintf("CabbageCheckFloat Error: %s %s", SChannel, SIdentifier)
        prints sprintf("CurrentValue: [%f] Incoming value: [%f]", i1, p6)
        giErrorCnt += 1
  endif
  giIdentifiersChecked += 1
  prints(sprintf("Checked %d identifiers", giIdentifiersChecked))
endin

instr CabbageSetValue
  SChannel strcpy p4
  cabbageSetValue SChannel, p5
endin

instr CabbageCheckValue
  SChannel strcpy p4
  i1 cabbageGetValue SChannel
  if i1 != p5 then
      prints("")
      prints("=========CabbageCheckValue============")
      prints("")
      prints sprintf("CabbageCheckValue Error: %s %s", SChannel, "value")
      prints sprintf("CurrentValue: [%f] Incoming value: [%f]", i1, p5)
      giErrorCnt += 1
  endif
  giIdentifiersChecked += 1
  prints(sprintf("Checked %d identifiers", giIdentifiersChecked))
endin

instr GetErrorCount
  prints("")
  prints("")
  prints("===========Error report ================")
  prints sprintf("Number of identifiers checked: %d", giIdentifiersChecked)
  prints sprintf("Number of errors found: %d", giErrorCnt)
endin
`;

    csoundCode += '</CsInstruments>\n';

    // Generate CsScore section
    csoundCode += '<CsScore>\n';

    let delay = 0.2; // Delay between each set/check pair (in seconds)
    let setStartTime = 1.0; // Start time for score events
    let checkStartTime = setStartTime + 0.1; // Start time for score events

    widgets.forEach((widget) => {
      for (const [key, value] of Object.entries(widget.props)) {
        if (key !== 'type' && key !== 'index' && key !== 'channel') {
          if (key !== 'value' && key !== 'defaultValue') {
            const newValue = CabbageTestUtilities.getSimilarValue(value);
            if (typeof value === 'number') {
              csoundCode += `i"CabbageSetFloat" ${setStartTime.toFixed(1)} 0.2 "${widget.props.channel}" "${key}" ${newValue}\n`;
              csoundCode += `i"CabbageCheckFloat" ${checkStartTime.toFixed(1)} 0.2 "${widget.props.channel}" "${key}" ${newValue}\n`;
            } else {
              csoundCode += `i"CabbageSetString" ${setStartTime.toFixed(1)} 0.2 "${widget.props.channel}" "${key}" "${newValue}"\n`;
              csoundCode += `i"CabbageCheckString" ${checkStartTime.toFixed(1)} 0.2 "${widget.props.channel}" "${key}" "${newValue}"\n`;
            }
            setStartTime += delay;
            checkStartTime += delay;
          } else if (key === 'value') {
            const newValue = CabbageTestUtilities.getSimilarValue(value);
            csoundCode += `i"CabbageSetValue" ${setStartTime.toFixed(1)} 0.2 "${widget.props.channel}" ${newValue}\n`;
            csoundCode += `i"CabbageCheckValue" ${checkStartTime.toFixed(1)} 0.2 "${widget.props.channel}" ${newValue}\n`;
            setStartTime += delay;
            checkStartTime += delay;
          }
        }
      }
    });

    csoundCode += `i"GetErrorCount" ${setStartTime.toFixed(1)} 0.2\n`;
    csoundCode += '</CsScore>\n';
    csoundCode += '</CsoundSynthesizer>\n';

    console.log(csoundCode);
  }



  static getSimilarValue(value) {
    if (typeof value === 'string') {
      if (/^#[0-9a-fA-F]{6,8}$/.test(value)) {
        // Hex color code
        return this.generateRandomHexColor(value.length);
      } else if (/^[0-9., ]*$/.test(value)) {
        // Number string (comma-separated, can include floating point)
        return this.generateRandomCommaSeparatedNumbers(value);
      } else if (value.trim() === '') {
        // Empty string
        return this.generateRandomString(5); // Default length of 5 for empty strings
      } else {
        // Comma-separated words
        return this.generateRandomCommaSeparatedWords(value);
      }
    } else if (typeof value === 'number') {
      // Number
      return this.generateRandomNumber(value);
    } else if (value === null || value === undefined) {
      // Null or undefined
      return this.generateRandomString(5); // Default length of 5 for unknown types
    } else {
      // Any other type (including empty arrays/objects, which are uncommon in typical JSON usage)
      return this.generateRandomString(5); // Default length of 5 for unknown types
    }
  }

  static generateRandomHexColor(length) {
    let hex = '#';
    for (let i = 0; i < length - 1; i++) {
      hex += Math.floor(Math.random() * 16).toString(16);
    }
    return hex;
  }

  static generateRandomCommaSeparatedNumbers(value) {
    if (value.trim() === '') {
      // Handle empty string by returning a default random string
      return this.generateRandomString(5);
    }

    return value.split(',').map(num => {
      num = num.trim();
      if (num === '') {
        return this.generateRandomString(5); // Handle empty parts
      } else if (num.includes('.')) {
        // Floating point number
        const floatValue = parseFloat(num);
        if (floatValue < 1) {
          return (Math.random()).toFixed(2); // Generate a new number between 0 and 1
        } else {
          return (floatValue + (Math.random() * 10 - 5)).toFixed(2);
        }
      } else {
        // Integer number
        const intValue = parseInt(num);
        return (intValue + Math.floor(Math.random() * 10) + 1).toString(); // Ensure it's not zero
      }
    }).join(', ');
  }

  static generateRandomCommaSeparatedWords(value) {
    if (value.trim() === '') {
      // Handle empty string by returning a default random word
      return this.generateRandomString(5);
    }

    const words = value.split(',').map(word => {
      if (word.trim() === '') {
        return this.generateRandomString(5); // Handle empty parts
      } else {
        return this.generateRandomString(word.trim().length);
      }
    });
    return words.join(', ');
  }

  static generateRandomString(length) {
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  }

  static generateRandomNumber(value) {
    if (Number.isInteger(value)) {
      return value + Math.floor(Math.random() * 10) + 1; // Ensure it's not zero
    } else {
      if (value < 1) {
        return (Math.random()).toFixed(2); // Generate a new number between 0 and 1
      } else {
        return (value + (Math.random() * 10 - 5)).toFixed(2); // For floating point numbers >= 1
      }
    }
  }



}
