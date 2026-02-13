// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.
import { vscode, currentCsdPath, getCabbageMode } from "./sharedState.js";
import { Cabbage } from "./cabbage.js";

export class CabbageUtils {
  /**
   * Return a default range object. For drag interactions use increment 0.001, for click interactions use 1.
   * Includes both value and defaultValue for compatibility during refactors.
   */
  static getDefaultRange(interaction /* 'drag' | 'click' */ = 'drag') {
    const increment = interaction === 'click' ? 1 : 0.001;
    return {
      min: 0,
      max: 1,
      value: 0,
      defaultValue: 0,
      skew: 1,
      increment
    };
  }

  /**
   * Returns channels array from props. Assumes new schema but tolerates missing by returning an empty array.
   */
  static getChannels(props) {
    return Array.isArray(props?.channels) ? props.channels : [];
  }

  /**
   * Returns the nth channel (default 0). If missing, returns a synthesized default with id from legacy props.channel.
   */
  static getChannel(props, index = 0, interaction = 'drag') {
    const channels = CabbageUtils.getChannels(props);
    if (channels.length > index) {
      const ch = channels[index];
      // Ensure range defaulting if omitted
      if (!ch.range) {
        ch.range = CabbageUtils.getDefaultRange(interaction);
      } else {
        // Ensure both value and defaultValue exist
        if (typeof ch.range.value === 'undefined') ch.range.value = (typeof ch.range.defaultValue !== 'undefined') ? ch.range.defaultValue : 0;
        if (typeof ch.range.defaultValue === 'undefined') ch.range.defaultValue = (typeof ch.range.value !== 'undefined') ? ch.range.value : 0;
        if (typeof ch.range.skew === 'undefined') ch.range.skew = 1;
        if (typeof ch.range.min === 'undefined') ch.range.min = 0;
        if (typeof ch.range.max === 'undefined') ch.range.max = 1;
        if (typeof ch.range.increment === 'undefined') ch.range.increment = interaction === 'click' ? 1 : 0.001;
      }
      if (!ch.event) ch.event = 'valueChanged';
      return ch;
    }
    // Fallback synthesized channel (internal only)
    const id = typeof props?.channel === 'string' ? props.channel : 'channel0';
    return { id, event: 'valueChanged', range: CabbageUtils.getDefaultRange(interaction) };
  }

  /**
   * Returns the id string of the nth channel from the channels array.
   * Throws an error if the channel or its id is not set.
   */
  static getChannelId(props, index = 0) {
    const ch = CabbageUtils.getChannel(props, index);
    if (!ch || !ch.id) {
      console.error(`Cabbage: CabbageUtils.getChannelId: No channel ID found for widget at index ${index}`, props);
      throw new Error(`Widget channel[${index}].id is required but not found`);
    }
    return ch.id;
  }

  /**
   * Returns the DOM ID for the widget div element.
   * Prioritizes props.id, then falls back to channels[0].id.
   * This is explicitly for DOM queries like document.getElementById().
   * 
   * @param {Object} props - Widget props
   * @returns {string} The widget div's DOM ID
   */
  static getWidgetDivId(props) {
    if (props.id) return props.id;
    const ch = CabbageUtils.getChannel(props, 0);
    return ch?.id || '';
  }

  /**
   * Returns the actual DOM element for the widget div.
   * Accepts either a props object or a channel/div id string for compatibility.
   *
   * @param {Object|string} channelOrProps - Widget props or a string div id
   * @returns {HTMLElement|null} The widget div element, or null if not found
   */
  static getWidgetDiv(channelOrProps) {
    // If a string is provided assume it's already a div id
    if (typeof channelOrProps === 'string') {
      return document.getElementById(channelOrProps);
    }
    const divId = CabbageUtils.getWidgetDivId(channelOrProps);
    return divId ? document.getElementById(divId) : null;
  }

  /**
   * Finds a valid widget ID from an event object.
   * Traverses up the DOM tree from the event target to find the closest widget div.
   * @param {Event} event - The DOM event object
   * @returns {string} The widget div's ID, or empty string if not found
   */
  static findValidId(event) {
    if (!event || !event.target) {
      console.warn('CabbageUtils.findValidId: No event or event.target provided');
      return '';
    }

    // Start from the event target and traverse up to find a widget div
    let element = event.target;
    while (element && element !== document.body) {
      // Widget divs typically have an ID that starts with certain patterns
      // Check if this element has an ID and looks like a widget
      if (element.id) {
        // If it has a cabbage-specific class, it's definitely a widget
        if (element.classList.contains('cabbage-widget') ||
          element.classList.contains('widget') ||
          element.hasAttribute('data-widget') ||
          element.hasAttribute('data-channel')) {
          return element.id;
        }
        // If it has an ID and we're inside a form/container, it might be the widget
        // Return it as a fallback if we don't find anything better
        if (!element.parentElement || element.parentElement.id === 'MainForm') {
          return element.id;
        }
      }
      element = element.parentElement;
    }

    // Last resort: if the target itself has an ID, use it
    if (event.target.id) {
      console.log('CabbageUtils.findValidId: Using event.target.id as fallback:', event.target.id);
      return event.target.id;
    }

    console.warn('CabbageUtils.findValidId: Could not find valid widget ID from event', event);
    return '';
  }

  /**
   * Returns the range of the nth channel, with defaults applied.
   */
  static getChannelRange(props, index = 0, interaction = 'drag') {
    const ch = CabbageUtils.getChannel(props, index, interaction);
    return ch.range;
  }

  /**
   * Returns the parameterIndex of the nth channel.
   * This is critical for sending parameter updates to the backend with the correct index.
   * @returns {number} The parameter index, or -1 if not found (indicating non-automatable or invalid channel)
   */
  static getChannelParameterIndex(props, index = 0) {
    const ch = CabbageUtils.getChannel(props, index);
    return ch?.parameterIndex ?? -1;
  }

  /**
   * Returns the first channel matching a given event name, applying defaults if needed.
   */
  static getChannelByEvent(props, event, interaction = 'drag') {
    const channels = CabbageUtils.getChannels(props);
    const found = channels.find(c => c && c.event === event);
    if (found) {
      if (!found.range) found.range = CabbageUtils.getDefaultRange(interaction);
      return found;
    }
    return undefined;
  }
  static updateInnerHTML(channelOrProps, instance, element = null) {
    // If an element is provided, use it directly (preserve existing behaviour)
    if (element) {
      try {
        element.innerHTML = instance.getInnerHTML();
      } catch (e) {
        console.error('updateInnerHTML: failed to update provided element', e);
      }
      return;
    }

    // Determine the target element:
    // - If channelOrProps is an object, treat it as `props` and resolve via getWidgetDiv(props)
    // - If it's a string, treat it as an element id/channel and use document.getElementById(id)
    let targetElement = null;
    let expectedId = null;
    if (channelOrProps && typeof channelOrProps === 'object') {
      expectedId = CabbageUtils.getWidgetDivId(channelOrProps);
      targetElement = CabbageUtils.getWidgetDiv(channelOrProps);
    } else {
      expectedId = channelOrProps;
      targetElement = document.getElementById(channelOrProps);
    }

    if (targetElement) {
      // If we have an expected id (string), optionally verify it matches the found element's id.
      if (!expectedId || targetElement.id === expectedId) {
        try {
          targetElement.innerHTML = instance.getInnerHTML();
        } catch (e) {
          console.error('updateInnerHTML: failed to update innerHTML', e);
        }
      } else {
        console.log('Element id mismatch in updateInnerHTML: expected', expectedId, 'found', targetElement.id);
      }
    } else {
      console.log('Element not found for updateInnerHTML:', channelOrProps);
    }
  }

  static getFullMediaPath(fileName, currentCsdFile) {
    let currentCsdPath = currentCsdFile.replace(/\\/g, '/'); // Replace all backslashes with forward slashes
    const lastSlashIndex = currentCsdPath.lastIndexOf('/');
    if (lastSlashIndex !== -1) {
      currentCsdPath = currentCsdPath.substring(0, lastSlashIndex);
    } else {
      currentCsdPath = currentCsdFile; // If no separator is found, use the original path
    }

    // Ensure currentCsdPath starts with a '/'
    if (!currentCsdPath.startsWith('/')) {
      currentCsdPath = '/' + currentCsdPath;
    }

    if (vscode === null) {
      console.warn(`vscode is null, returning ${fileName}`);
      return `media/${fileName}`;
    } else {
      // Construct the URL with the correct encoding
      const baseUrl = 'https://file%2B.vscode-resource.vscode-cdn.net';
      const fullUrl = `${baseUrl}${currentCsdPath}/media/${fileName}`;
      return fullUrl;
    }
  }

  static getFileNameFromPath(fullPath) {
    return fullPath.split(/[/\\]/).pop();
  }

  // Helper function to track the path of the property in a nested object
  static getPath(obj, key) {
    const path = [];

    function findKey(currentObject, currentPath) {
      for (const k in currentObject) {
        const newPath = currentPath ? `${currentPath}.${k}` : k; // Build the new path
        if (k === key) {
          path.push(newPath); // Found the key, add the path
          return true; // Stop searching
        }
        if (typeof currentObject[k] === 'object' && currentObject[k] !== null) {
          if (findKey(currentObject[k], newPath)) {
            return true; // Stop searching if found in nested object
          }
        }
      }
      return false; // Key not found in this branch
    }

    findKey(obj, '');
    return path.length > 0 ? path[0] : ''; // Return the first found path or an empty string
  }

  /**
   * Wrap a props object in a Proxy that reacts to common widget property changes.
   * The proxy will toggle pointer-events for 'visible' and 'active', and perform
   * safe cleanup when a widget is disabled (active = false).
   *
   * @param {Object} widget - The widget instance (this) that owns the props.
   * @param {Object} props - The plain props object to wrap.
   * @param {Object} opts - Optional settings: { onPropertyChange: fn }
   * @returns {Proxy} proxied props object
   */
  static createReactiveProps(widget, props, opts = {}) {
    // New: per-key watch API
    // opts: {
    //   onPropertyChange: function(change) {},
    //   watchKeys: null | Array<string|RegExp>, // null => watch all; string may end with '*' for prefix
    //   mode: 'set'|'change'|'both', // 'change' (default) will only notify when !Object.is(old, new)
    //   lazyPath: true|false (default true) // compute path only when notifying
    // }
    const handler = typeof opts.onPropertyChange === 'function' ? opts.onPropertyChange : null;
    const watchKeys = Array.isArray(opts.watchKeys) ? opts.watchKeys : null;
    const mode = opts.mode || 'change';
    const lazyPath = typeof opts.lazyPath === 'boolean' ? opts.lazyPath : true;

    // Pre-bind common listeners if the widget exposes the methods (defensive)
    if (!widget.boundPointerMove && typeof widget.pointerMove === 'function') {
      widget.boundPointerMove = widget.pointerMove.bind(widget);
    }
    if (!widget.boundPointerUp && typeof widget.pointerUp === 'function') {
      widget.boundPointerUp = widget.pointerUp.bind(widget);
    }

    function keyMatchesWatchList(k) {
      if (!watchKeys) return true; // watch all
      for (const pattern of watchKeys) {
        if (pattern instanceof RegExp) {
          if (pattern.test(k)) return true;
        } else if (typeof pattern === 'string') {
          if (pattern.endsWith('*')) {
            const prefix = pattern.slice(0, -1);
            if (k.startsWith(prefix)) return true;
          } else {
            if (k === pattern) return true;
          }
        }
      }
      return false;
    }

    return new Proxy(props, {
      set: (target, key, value) => {
        const oldValue = target[key];
        // assign the new value
        target[key] = value;

        // Toggle pointer-events when visible/active change. Use combined state
        // so pointer-events is only enabled when both visible and active are true.
        if (key === 'visible' || key === 'active') {
          if (widget.widgetDiv) {
            const visible = (typeof target.visible !== 'undefined') ? target.visible : true;
            const active = (typeof target.active !== 'undefined') ? target.active : true;
            widget.widgetDiv.style.pointerEvents = (visible && active) ? 'auto' : 'none';
          }
        }

        // If active is turned off, perform defensive cleanup so ongoing interactions stop.
        if (key === 'active' && value === false) {
          try {
            if (widget.pointerCaptureTarget && typeof widget.pointerCaptureTarget.releasePointerCapture === 'function' && typeof widget.activePointerId !== 'undefined') {
              widget.pointerCaptureTarget.releasePointerCapture(widget.activePointerId);
            }
          } catch (e) {
            // ignore; release may throw if capture already released
          }

          if (widget.boundPointerMove) window.removeEventListener('pointermove', widget.boundPointerMove);
          if (widget.boundPointerUp) window.removeEventListener('pointerup', widget.boundPointerUp);

          // Reset interaction state commonly used across widgets
          try { widget.isMouseDown = false; } catch (e) { }
          try { widget.activePointerId = undefined; } catch (e) { }
          try { widget.pointerCaptureTarget = undefined; } catch (e) { }

          // Call widget-specific stop hooks if provided
          if (typeof widget.stopAnimation === 'function' && widget.isAnimating) {
            try { widget.stopAnimation(); } catch (e) { /* ignore */ }
          }

          // Hide any popup elements the widget may have (defensive)
          try {
            if (widget.popupElement) {
              widget.popupElement.classList?.add('hide');
              widget.popupElement.classList?.remove('show');
            }
          } catch (e) { }
        }

        // Decide whether to notify
        if (handler && keyMatchesWatchList(String(key))) {
          // mode='change' should only notify when values actually differ
          if (mode === 'change' && Object.is(oldValue, value)) {
            // unchanged => skip
          } else {
            // compute path lazily (only when needed)
            const path = lazyPath ? CabbageUtils.getPath(target, key) : '';
            try {
              handler.call(widget, { path, key, value, oldValue, widget });
            } catch (e) {
              console.error('onPropertyChange handler threw', e);
            }
          }
        }

        return true;
      }
    });
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
      if (widget.props.automatable === 1 || widget.props.automatable === true) {
        // Increment by number of channels; default to 1 if channels not present
        const channels = CabbageUtils.getChannels(widget.props);
        count += Math.max(1, channels.length || 0);
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

      // Only show RightPanel if NOT in performance mode (nonDraggable)
      if (getCabbageMode() !== 'nonDraggable') {
        rightPanel.style.display = 'flex';
      }
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
      console.warn('Cabbage: Invalid input to getDecimalPlaces:', num);
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
    // Extract all existing channel names from channels arrays
    const existingChannels = [];
    widgets.forEach(widget => {
      if (widget.props && Array.isArray(widget.props.channels)) {
        widget.props.channels.forEach(channel => {
          if (channel.id) existingChannels.push(channel.id);
        });
      }
      // Also check legacy channel property
      if (widget.channel) existingChannels.push(widget.channel);
    });

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

  /**
   * Generates a unique ID for a new widget based on its type.
   * @param {string} type - The type of the widget.
   * @param {Array} widgets - Array of widget objects with 'id' properties.
   * @returns {string} A unique ID for the widget.
   */
  static getUniqueId(type, widgets) {
    // Extract all existing widget IDs
    const existingIds = widgets.map(widget => widget.props.id).filter(id => id);

    // Define a function to generate an ID based on type and a number
    function generateId(type, number) {
      return `${type}${number}`;
    }

    // Start with a number based on the size of the array + 1
    let number = widgets.length + 1;
    let newId = generateId(type, number);

    // Increment the number until a unique ID is found
    while (existingIds.includes(newId)) {
      number += 1;
      newId = generateId(type, number);
    }

    return newId;
  }

  static findValidId(event) {
    var target = event.target;

    while (target !== null) {
      if (target.tagName === "DIV" && target.id) {
        return target.id;
      }
      target = target.parentNode;
    }

    return null;
  }

  static printDOMTree(node = document.body, indent = 0) {
    // Only consider element nodes
    if (node.nodeType === Node.ELEMENT_NODE) {
      // Build info string: tag name, id, class
      let info = node.tagName;
      if (node.id) info += `#${node.id}`;
      if (node.className) info += `.${node.className.split(" ").join(".")}`;

      // Print with indentation
      console.log(" ".repeat(indent) + info);

      // Recursively print children
      node.childNodes.forEach(child => printDOMTree(child, indent + 2));
    }
  }

  static printElementById(id) {
    const node = document.getElementById(id);
    if (!node) {
      console.log(`No element found with id="${id}"`);
      return;
    }

    function printNode(node, indent = 0) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        let info = node.tagName;

        if (node.id) info += `#${node.id}`;

        // Safely handle className for any element
        let classStr = "";
        if (typeof node.className === "string") {
          classStr = node.className;
        } else if (node.classList) {
          classStr = [...node.classList].join(".");
        }

        if (classStr) info += `.${classStr}`;

        // Get absolute position and size
        const rect = node.getBoundingClientRect();
        const absX = rect.left + window.scrollX;
        const absY = rect.top + window.scrollY;
        const width = rect.width;
        const height = rect.height;

        info += ` [X: ${absX.toFixed(1)}, Y: ${absY.toFixed(1)}, W: ${width.toFixed(1)}, H: ${height.toFixed(1)}]`;

        console.log(" ".repeat(indent) + info);

        node.childNodes.forEach(child => printNode(child, indent + 2));
      }
    }

    printNode(node);
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
    for (const widget of widgets) {
      if (CabbageUtils.getChannelId(widget.props, 0) === channel) {
        return widget;
      }
    }
    return null;
  }

  static printPropsOnClick(channel, widgets) {
    const element = document.getElementById(channel);
    if (element) {
      element.addEventListener('click', (e) => {
        e.stopPropagation();
        const widget = this.getWidgetFromChannel(channel, widgets);
        if (widget) {
          console.log('Widget props for', channel, ':', widget);
        } else {
          console.log('No widget found for channel', channel);
        }
      });
    }
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
        console.error('Cabbage: getStringWidth..');
        break;
    }

    var ctx = canvas.getContext("2d");
    ctx.font = `${fontSize}px ${props.fontFamily}`;
    var width = ctx.measureText(text).width;
    return width + padding;
  }

  static getNumberBoxWidth(props) {
    // Get the number of decimal places in props.range.increment
    const range = (props && props.range) ? props.range : CabbageUtils.getChannelRange(props, 0, 'drag');
    const decimalPlaces = CabbageUtils.getDecimalPlaces(range.increment);

    // Format props.max with the correct number of decimal places
    const maxNumber = range.max.toFixed(decimalPlaces);

    // Calculate the width of the string representation of maxNumber
    const maxNumberWidth = CabbageUtils.getStringWidth(maxNumber, props);

    return maxNumberWidth;
  }


  static getWidgetDiv(channel) {
    // Handle both string channels and object channels (for xyPad)
    const channelId = typeof channel === 'object' && channel !== null
      ? (channel.id || channel.x)
      : channel;
    const element = document.getElementById(channelId);
    return element || null;
  }

  /**
   * Return a deep-cloned copy of an object suitable for writing to the editor.
   * This removes internal-only fields that should not be visible to end-users.
   * Accepts either a widget instance (with a `props` member) or a plain props object.
   * @param {Object} obj
   * @returns {Object} sanitized clone
   */
  static sanitizeForEditor(obj) {
    // Internal/runtime keys that should never be serialized to CSD
    const internalKeys = new Set([
      'groupBaseBounds',
      'origBounds',
      'originalProps',
      'channel',
      'value',           // Runtime state - widget's current value
      'parameterIndex',  // Runtime - assigned during initialization
      'samples',         // Runtime - audio/table data
      'currentCsdFile'   // Runtime - file path
    ]);

    function cloneAndClean(value, parentKey) {
      if (value === null || value === undefined) return value;
      if (Array.isArray(value)) return value.map((v, i) => cloneAndClean(v, `${parentKey}[${i}]`));
      if (typeof value === 'object') {
        const out = {};
        Object.keys(value).forEach((k) => {
          if (internalKeys.has(k)) return; // skip internal fields
          // Skip range.value specifically (runtime state within range object)
          if (parentKey === 'range' && k === 'value') return;
          out[k] = cloneAndClean(value[k], k);
        });
        return out;
      }
      return value;
    }

    const target = (obj && obj.props) ? obj.props : obj;
    return cloneAndClean(target, '');
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
    // Handle both string channels and object channels (for xyPad)
    const channelId = CabbageUtils.getWidgetDivId(props);
    const element = document.getElementById(channelId);

    if (!element) {
      return;
    }

    if (!props || !props.bounds) {
      return;
    }

    switch (identifier) {
      case 'bounds.left':
        element.style.transform = `translate(${props.bounds.left}px, ${props.bounds.top}px)`;
        element.setAttribute('data-x', props.bounds.left);
        element.setAttribute('data-y', props.bounds.top);
        break;
      case 'bounds.top':
        element.style.transform = `translate(${props.bounds.left}px, ${props.bounds.top}px)`;
        element.setAttribute('data-x', props.bounds.left);
        element.setAttribute('data-y', props.bounds.top);
        break;
      case 'bounds.width':
        element.style.width = props.bounds.width + "px";
        break;
      case 'bounds.height':
        element.style.height = props.bounds.height + "px";
        break;
      default:
        break;
    }
  }

  /**
   * Handles mouse move events for widgets, supporting both mouseMoveX/Y and mouseDragX/Y channels.
   * @param {Event} evt - The pointer event
   * @param {Object} props - Widget properties
   * @param {number} parameterIndex - Parameter index for the widget (deprecated - backend handles routing)
   * @param {Object} vscode - VSCode API instance
   */
  static handleMouseMove(evt, props, parameterIndex, vscode) {
    const rect = evt.currentTarget.getBoundingClientRect();
    const nx = (evt.clientX - rect.left) / rect.width;
    const ny = (evt.clientY - rect.top) / rect.height;

    // Check if mouse button is pressed (for drag events)
    if (evt.buttons > 0) {
      const dragX = CabbageUtils.getChannelByEvent(props, 'mouseDragX', 'drag');
      const dragY = CabbageUtils.getChannelByEvent(props, 'mouseDragY', 'drag');
      if (dragX) {
        const scaledValue = nx * (dragX.range.max - dragX.range.min) + dragX.range.min;
        // Channel must have parameterIndex set by backend
        if (dragX.parameterIndex === undefined) {
          console.error('CabbageUtils.handleMouseMove: channel missing parameterIndex!', dragX);
          return;
        }
        Cabbage.sendControlData({ channel: dragX.id, value: scaledValue, gesture: "value" }, vscode);
      }
      if (dragY) {
        const scaledValue = ny * (dragY.range.max - dragY.range.min) + dragY.range.min;
        // Channel must have parameterIndex set by backend
        if (dragY.parameterIndex === undefined) {
          console.error('CabbageUtils.handleMouseMove: channel missing parameterIndex!', dragY);
          return;
        }
        Cabbage.sendControlData({ channel: dragY.id, value: scaledValue, gesture: "value" }, vscode);
      }
    } else {
      // Mouse movement without button pressed
      const moveX = CabbageUtils.getChannelByEvent(props, 'mouseMoveX', 'mouse');
      const moveY = CabbageUtils.getChannelByEvent(props, 'mouseMoveY', 'mouse');
      if (moveX) {
        const scaledValue = nx * (moveX.range.max - moveX.range.min) + moveX.range.min;
        // Channel must have parameterIndex set by backend
        if (moveX.parameterIndex === undefined) {
          console.error('CabbageUtils.handleMouseMove: channel missing parameterIndex!', moveX);
          return;
        }
        Cabbage.sendControlData({ channel: moveX.id, value: scaledValue, gesture: "complete" }, vscode);
      }
      if (moveY) {
        const scaledValue = ny * (moveY.range.max - moveY.range.min) + moveY.range.min;
        // Channel must have parameterIndex set by backend
        if (moveY.parameterIndex === undefined) {
          console.error('CabbageUtils.handleMouseMove: channel missing parameterIndex!', moveY);
          return;
        }
        Cabbage.sendControlData({ channel: moveY.id, value: scaledValue, gesture: "complete" }, vscode);
      }
    }
  }

  /**
   * Handles mouse down events for widgets, supporting mouse press and value changed events.
   * @param {Event} evt - The pointer event
   * @param {Object} props - Widget properties
   * @param {number} parameterIndex - Parameter index for the widget (deprecated - backend handles routing)
   * @param {Object} vscode - VSCode API instance
   * @param {Function} onDragStart - Optional callback for when drag starts
   */
  static handleMouseDown(evt, props, parameterIndex, vscode, onDragStart = null) {
    // Left press
    const pressCh = CabbageUtils.getChannelByEvent(props, 'mousePressLeft', 'click');
    if (pressCh) {
      // Channel must have parameterIndex set by backend
      if (pressCh.parameterIndex === undefined) {
        console.error('CabbageUtils.handleMouseDown: channel missing parameterIndex!', pressCh);
        return;
      }
      Cabbage.sendControlData({ channel: pressCh.id, value: 1, gesture: "begin" }, vscode);
    }
    // Click shorthand
    const clickCh = CabbageUtils.getChannelByEvent(props, 'valueChanged', 'click');
    if (clickCh) {
      // Channel must have parameterIndex set by backend
      if (clickCh.parameterIndex === undefined) {
        console.error('CabbageUtils.handleMouseDown: channel missing parameterIndex!', clickCh);
        return;
      }
      Cabbage.sendControlData({ channel: clickCh.id, value: 1, gesture: "complete" }, vscode);
      Cabbage.sendControlData({ channel: clickCh.id, value: 0, gesture: "complete" }, vscode);
    }
    // Value changed toggle
    const valueCh = CabbageUtils.getChannelByEvent(props, 'valueChanged', 'valueChanged');
    if (valueCh) {
      props.value = props.value === 0 ? 1 : 0;
      // Channel must have parameterIndex set by backend
      if (valueCh.parameterIndex === undefined) {
        console.error('CabbageUtils.handleMouseDown: channel missing parameterIndex!', valueCh);
        return;
      }
      Cabbage.sendControlData({ channel: valueCh.id, value: props.value, gesture: "complete" }, vscode);
    }

    // Call optional drag start callback
    if (onDragStart) {
      onDragStart(evt);
    }
  }

  /**
   * Handles mouse up events for widgets, supporting mouse release events.
   * @param {Event} evt - The pointer event
   * @param {Object} props - Widget properties
   * @param {number} parameterIndex - Parameter index for the widget (deprecated - backend handles routing)
   * @param {Object} vscode - VSCode API instance
   * @param {Function} onDragEnd - Optional callback for when drag ends
   */
  static handleMouseUp(evt, props, parameterIndex, vscode, onDragEnd = null) {
    const relCh = CabbageUtils.getChannelByEvent(props, 'mouseReleaseLeft', 'click');
    if (relCh) {
      Cabbage.sendControlData({ channel: relCh.id, value: 0, gesture: "end" }, vscode);
    }

    // Call optional drag end callback
    if (onDragEnd) {
      onDragEnd(evt);
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
    // Handle null/undefined
    if (!hex) {
      console.warn('CabbageColours.invertColor: received null/undefined, returning default');
      return '#ffffff';
    }

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

  static async createWidgetInstances(widgetConstructors) {
    const widgetInstances = {};

    // Get all widget types from the proxy
    const widgetTypes = Reflect.ownKeys(widgetConstructors);

    for (const key of widgetTypes) {
      const Constructor = await widgetConstructors[key];
      widgetInstances[key] = new Constructor();
    }

    return widgetInstances;
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
              csoundCode += `i"CabbageSetFloat" ${setStartTime.toFixed(1)} 0.2 "${CabbageUtils.getChannelId(widget.props, 0)}" "${key}" ${newValue}\n`;
              csoundCode += `i"CabbageCheckFloat" ${checkStartTime.toFixed(1)} 0.2 "${CabbageUtils.getChannelId(widget.props, 0)}" "${key}" ${newValue}\n`;
            } else {
              csoundCode += `i"CabbageSetString" ${setStartTime.toFixed(1)} 0.2 "${CabbageUtils.getChannelId(widget.props, 0)}" "${key}" "${newValue}"\n`;
              csoundCode += `i"CabbageCheckString" ${checkStartTime.toFixed(1)} 0.2 "${CabbageUtils.getChannelId(widget.props, 0)}" "${key}" "${newValue}"\n`;
            }
            setStartTime += delay;
            checkStartTime += delay;
          } else if (key === 'value') {
            const newValue = CabbageTestUtilities.getSimilarValue(value);
            csoundCode += `i"CabbageSetValue" ${setStartTime.toFixed(1)} 0.2 "${CabbageUtils.getChannelId(widget.props, 0)}" ${newValue}\n`;
            csoundCode += `i"CabbageCheckValue" ${checkStartTime.toFixed(1)} 0.2 "${CabbageUtils.getChannelId(widget.props, 0)}" ${newValue}\n`;
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
