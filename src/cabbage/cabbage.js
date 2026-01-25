// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * @fileoverview Cabbage API - Communication layer between the webview UI and the Cabbage backend.
 *
 * ## Architecture Overview
 *
 * This module provides the API for widget-to-backend communication in Cabbage plugins.
 * There are two communication directions:
 *
 * ### UI -> Backend (Outgoing)
 * Use `sendChannelUpdate()` to send widget value changes to the backend.
 * It automatically routes to the correct internal handler based on the `automatable` flag:
 * - Automatable widgets -> DAW parameter system -> Csound
 * - Non-automatable widgets -> Csound directly
 *
 * ### Backend -> UI (Incoming)
 * The backend sends messages via `hostMessageCallback()`. To intercept these messages,
 * define a global function in your UI code:
 *
 * ```javascript
 * window.hostMessageCallback = function(data) {
 *   if (data.command === "parameterChange") {
 *     // Handle parameter update from DAW - update display only, don't send back!
 *   } else if (data.command === "updateWidget") {
 *     // Handle widget update from plugin, or Csound opcodes (cabbageSetValue, cabbageSet)
 *   } else if (data.command === "channelDataUpdate") {
 *     // Handle channel data from Csound
 *   } else if (data.command === "resizeResponse") {
 *     // Handle resize response
 *   }
 * };
 * ```
 *
 * Common incoming commands:
 * - `parameterChange` - Parameter value updated (from DAW automation or backend)
 * - `updateWidget` - Widget value/property update from plugin, or Csound opcodes (cabbageSetValue, cabbageSet)
 * - `channelDataUpdate` - Channel data from Csound
 * - `resizeResponse` - Response to resize request
 *
 * ## Important: Avoiding Feedback Loops
 *
 * When the UI receives a `parameterChange` message from the backend, it should ONLY
 * update its visual display. It must NEVER send a parameter update back to the backend.
 *
 * The reason: `parameterChange` messages represent the authoritative value from the
 * DAW's automation system. Sending updates back would create feedback loops and
 * interfere with DAW automation playback.
 *
 * Correct pattern:
 * - User drags slider → UI sends `sendChannelUpdate()` → DAW records automation
 * - DAW plays automation → Backend sends `parameterChange` → UI updates display only
 *
 * ## Handling User Interaction (isDragging pattern)
 *
 * When the user is actively dragging a slider, you typically want to ignore incoming
 * `parameterChange` messages to prevent the slider from "fighting" with the user's input.
 * Implement this by tracking an `isDragging` state:
 *
 * ```javascript
 * let isDragging = false;
 *
 * // In your slider's event handlers:
 * slider.onpointerdown = () => { isDragging = true; };
 * slider.onpointerup = () => { isDragging = false; };
 *
 * // In hostMessageCallback:
 * window.hostMessageCallback = function(data) {
 *   if (data.command === "parameterChange") {
 *     if (!isDragging) {
 *       // Safe to update display - user isn't interacting
 *       updateSliderDisplay(data.value);
 *     }
 *     // If isDragging, ignore the update - user's input takes priority
 *   }
 * };
 * ```
 *
 * @module Cabbage
 */

console.log("Cabbage: loading cabbage.js");

export class Cabbage {

  /**
   * Main entry point for sending widget value changes to the Cabbage backend.
   *
   * This function automatically routes messages to the appropriate backend function
   * based on the automatable flag:
   *
   * - `automatable=true`: Routes to `sendParameterUpdate()` for DAW-automatable parameters.
   *   The value is sent to the DAW for automation recording and also forwarded to Csound.
   *
   * - `automatable=false`: Routes to `sendChannelData()` for non-automatable data.
   *   The value is sent directly to Csound without DAW parameter involvement.
   *
   * **When to use**: Call this from widget event handlers (e.g., pointer events, input changes)
   * when the user interacts with a widget.
   *
   * **When NOT to use**: Do not call this when handling incoming `parameterChange` messages
   * from the backend. Those messages are for display updates only.
   *
   * @param {Object} message - The message object containing widget data
   * @param {string} message.channel - The channel name
   * @param {number} message.paramIdx - Parameter index (required if automatable)
   * @param {number|string} message.value - The value to send
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   * @param {boolean} automatable - Whether this widget is DAW-automatable
   */
  static sendChannelUpdate(message, vscode = null, automatable = false) {
    if (automatable === true || automatable === 1) {
      // Use parameter update for automatable controls (support both boolean and legacy numeric)
      Cabbage.sendParameterUpdate(message, vscode);
    } else {
      // Use channel data for non-automatable controls
      const data = message.value !== undefined ? message.value : message.stringData || message.floatData;
      Cabbage.sendChannelData(message.channel, data, vscode);
    }
  }

  /**
   * @private
   * Internal: Send a parameter update to the DAW for automation recording.
   * Use `sendChannelUpdate()` instead - it will route here automatically for automatable widgets.
   *
   * This function sends the parameter value to the DAW's automation system.
   * The DAW will then send the value back via a `parameterChange` message,
   * which updates both the UI and Csound.
   *
   * **Important**: This creates a round-trip through the DAW:
   * 1. UI calls `sendParameterUpdate()` with value
   * 2. DAW receives and records/processes the value
   * 3. DAW sends `parameterChange` back to the plugin
   * 4. Plugin updates Csound and sends `parameterChange` to UI
   * 5. UI updates its display (but does NOT call sendParameterUpdate again!)
   *
   * @param {Object} message - The parameter message
   * @param {number} message.paramIdx - The parameter index (must be >= 0)
   * @param {string} message.channel - The channel name
   * @param {number} message.value - The parameter value (full range, not normalized)
   * @param {string} [message.channelType="number"] - The channel type
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   */
  static sendParameterUpdate(message, vscode = null) {
    // Validate that paramIdx is present and valid
    if (message.paramIdx === undefined || message.paramIdx === null) {
      console.error("Cabbage.sendParameterUpdate: message missing paramIdx!", message);
      return;
    }

    if (message.paramIdx < 0) {
      console.warn("Cabbage.sendParameterUpdate: paramIdx is -1, skipping (non-automatable widget)", message);
      return;
    }

    const msg = {
      command: "parameterChange",
      paramIdx: message.paramIdx,
      channel: message.channel,
      value: message.value,
      channelType: message.channelType || "number"
    };

    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      if (typeof window.sendMessageFromUI === 'function') {
        window.sendMessageFromUI(msg);
      } else {
        console.error('Cabbage: window.sendMessageFromUI is not available. Message:', msg);
      }
    }
  }

  static sendCustomCommand(command, vscode = null, additionalData = {}) {
    const msg = {
      command: command,
      text: JSON.stringify(additionalData)
    };

    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      if (typeof window.sendMessageFromUI === 'function') {
        console.log('Cabbage: Calling window.sendMessageFromUI with:', msg);
        try {
          const result = window.sendMessageFromUI(msg);
          console.log('Cabbage: sendMessageFromUI returned:', result);
        } catch (err) {
          console.error('Cabbage: sendMessageFromUI threw error:', err);
          console.error('Cabbage: Error stack:', err.stack);
        }
      } else {
        console.error('Cabbage: window.sendMessageFromUI is not available yet. Message:', msg);
        console.error('Cabbage: typeof window.sendMessageFromUI:', typeof window.sendMessageFromUI);
        console.error('Cabbage: window.sendMessageFromUI value:', window.sendMessageFromUI);
      }
    }
  }

  static sendWidgetUpdate(widget, vscode = null) {
    const msg = {
      command: "widgetStateUpdate",
      obj: JSON.stringify(CabbageUtils.sanitizeForEditor(widget))
    };
    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      if (typeof window.sendMessageFromUI === 'function') {
        window.sendMessageFromUI(msg);
      } else {
        console.error('Cabbage: window.sendMessageFromUI is not available. Message:', msg);
      }
    }
  }

  static sendMidiMessageFromUI(statusByte, dataByte1, dataByte2, vscode = null) {
    var message = {
      "statusByte": statusByte,
      "dataByte1": dataByte1,
      "dataByte2": dataByte2
    };

    const msg = {
      command: "midiMessage",
      obj: JSON.stringify(message)
    };

    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      if (typeof window.sendMessageFromUI === 'function') {
        window.sendMessageFromUI(msg);
      } else {
        console.error('Cabbage: window.sendMessageFromUI is not available. Message:', msg);
      }
    }
  }

  /**
   * @private
   * Internal: Send channel data directly to Csound without DAW automation involvement.
   * Use `sendChannelUpdate()` instead - it will route here automatically for non-automatable widgets.
   *
   * Used for non-automatable widgets like buttons, file selectors, or
   * any widget that sends string data. The value is sent directly to Csound's
   * channel system and is not recorded by DAW automation.
   *
   * @param {string} channel - The Csound channel name
   * @param {number|string} data - The data to send (number or string)
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   */
  static sendChannelData(channel, data, vscode = null) {
    var message = {
      "channel": channel
    };

    // Determine if data is a string or number and set appropriate property
    if (typeof data === "string") {
      message.stringData = data;
    } else if (typeof data === "number") {
      message.floatData = data;
    } else {
      console.warn("Cabbage: sendChannelData received unsupported data type:", typeof data);
      return;
    }

    const msg = {
      command: "channelData",
      obj: JSON.stringify(message)
    };

    console.log("Cabbage: sending channel data from UI", message);
    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      if (typeof window.sendMessageFromUI === 'function') {
        window.sendMessageFromUI(msg);
      } else {
        console.error('Cabbage: window.sendMessageFromUI is not available. Message:', msg);
      }
    }
  }

  static MidiMessageFromHost(statusByte, dataByte1, dataByte2) {
    console.log("Cabbage: Got MIDI Message" + statusByte + ":" + dataByte1 + ":" + dataByte2);
  }

  static triggerFileOpenDialog(vscode, channel, options = {}) {
    var message = {
      "channel": channel,
      "directory": options.directory || "",
      "filters": options.filters || "*",
      "openAtLastKnownLocation": options.openAtLastKnownLocation !== undefined ? options.openAtLastKnownLocation : true
    };

    const msg = {
      command: "fileOpen",
      obj: JSON.stringify(message)
    };
    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      if (typeof window.sendMessageFromUI === 'function') {
        window.sendMessageFromUI(msg);
      } else {
        console.error('Cabbage: window.sendMessageFromUI is not available. Message:', msg);
      }
    }
  }

  static openUrl(vscode, url, file) {
    var message = {
      "url": url,
      "file": file
    };

    const msg = {
      command: "openUrl",
      obj: JSON.stringify(message)
    };
    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      if (typeof window.sendMessageFromUI === 'function') {
        window.sendMessageFromUI(msg);
      } else {
        console.error('Cabbage: window.sendMessageFromUI is not available. Message:', msg);
      }
    }
  }

  /**
   * Request a resize of the plugin GUI window.
   * This is only supported in plugin mode (CLAP/VST3/AUv2).
   * The host may accept or reject the resize request.
   *
   * @param {number} width - The requested width in pixels
   * @param {number} height - The requested height in pixels
   * @param {object} vscode - The vscode API object (null for plugin mode)
   *
   * The response will be sent via hostMessageCallback with:
   * {command: "resizeResponse", accepted: boolean, width: number, height: number}
   */
  static requestResize(width, height, vscode = null) {
    const msg = {
      command: "requestResize",
      width: width,
      height: height
    };

    if (vscode !== null) {
      // In VS Code extension mode, resize is not supported via this mechanism
      console.warn('Cabbage: requestResize is not supported in VS Code extension mode');
      return;
    }
    else {
      if (typeof window.sendMessageFromUI === 'function') {
        window.sendMessageFromUI(msg);
      } else {
        console.error('Cabbage: window.sendMessageFromUI is not available. Message:', msg);
      }
    }
  }


}
