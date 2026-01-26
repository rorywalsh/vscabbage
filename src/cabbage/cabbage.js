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
 * Use `sendControlData(channel, value)` to send widget value changes to the backend.
 * Values should be sent in their full range (e.g., 20-20000 Hz for a filter
 * frequency slider). The backend handles all value normalization needed by the host DAW.
 * The backend automatically determines whether the channel is automatable and routes
 * accordingly:
 * - Automatable channels -> DAW parameter system -> Csound
 * - Non-automatable channels -> Csound directly
 *
 * ### Backend -> UI (Incoming)
 * The backend sends messages via `hostMessageCallback()`. Values received from the host
 * are in their full range (e.g., 20-20000 Hz for a filter frequency slider).
 * The backend handles all value normalization needed by the host DAW.
 * To intercept these messages, define a global function in your UI code:
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
 * The reason: `parameterChange` messages represent the current value from the
 * DAW. Sending updates back would create feedback loops and could interfere 
 * with DAW automation playback.
 *
 * Correct pattern:
 * - User drags slider -> UI sends `sendControlData()` -> DAW records automation
 * - DAW plays automation -> Backend sends `parameterChange` -> UI updates display only
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
   * Send a widget value change to the Cabbage backend.
   *
   * The backend automatically determines whether the channel is DAW-automatable
   * and routes accordingly:
   * - Automatable channels -> DAW parameter system -> Csound
   * - Non-automatable channels -> Csound directly
   *
   * **When to use**: Call this from widget event handlers (e.g., pointer events, input changes)
   * when the user interacts with a widget.
   *
   * **When NOT to use**: Do not call this when handling incoming `parameterChange` messages
   * from the backend. Those messages are for display updates only.
   *
   * @param {string} channel - The channel name
   * @param {number|string} value - The value to send in its natural/meaningful range (e.g., 20-20000 Hz for filter frequency). The backend handles all normalization needed by the host DAW.
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   */
  static sendControlData(channel, value, vscode = null) {
    const msg = {
      command: "controlData",
      channel: channel,
      value: value
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
