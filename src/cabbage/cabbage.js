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
 * Use `sendControlData({ channel, value, gesture })` to send widget value changes to the backend.
 * Values should be sent in their full range (e.g., 20-20000 Hz for a filter
 * frequency slider). The backend handles all value normalization needed by the host DAW.
 * The backend automatically determines whether the channel is automatable and routes
 * accordingly:
 * - Automatable channels -> DAW parameter system -> Csound
 * - Non-automatable channels -> Csound directly
 * **Thread Safety**: This function is asynchronous and does NOT block the audio thread.
 * Parameter updates are queued and processed safely without interrupting real-time audio processing.
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
   * @param {Object} data - The control data to send
   * @param {string} data.channel - The channel name
   * @param {number|string} data.value - The value to send in its natural/meaningful range (e.g., 20-20000 Hz for filter frequency). The backend handles all normalization needed by the host DAW. This value can be a number or string depending on the widget type.
   * @param {string} [data.gesture="complete"] - The gesture type: "begin" (start of interaction), "value" (during interaction), "end" (end of continuous interaction), or "complete" (discrete action e.g. button click).
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   */
  static sendControlData({ channel, value, gesture = "complete" }, vscode = null) {
    const msg = {
      command: "controlData",
      channel: channel,
      value: value,
      gesture: gesture
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
   * Signal that the UI is ready to load and initialize.
   *
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   * @param {Object} additionalData - Additional initialization data
   */
  static isReadyToLoad(vscode = null, additionalData = {}) {
    this.sendCustomCommand("isReadyToLoad", vscode);
  }
  /**
   * Send a MIDI message from the UI to the Cabbage backend.
   *
   * @param {number} statusByte - MIDI status byte
   * @param {number} dataByte1 - First MIDI data byte
   * @param {number} dataByte2 - Second MIDI data byte
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   */
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
   * Handle incoming MIDI messages from the backend.
   *
   * @param {number} statusByte - MIDI status byte
   * @param {number} dataByte1 - First MIDI data byte
   * @param {number} dataByte2 - Second MIDI data byte
   */
  static MidiMessageFromHost(statusByte, dataByte1, dataByte2) {
  }

  /**
   * Trigger a native file open dialog for file selection widgets.
   *
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   * @param {string} channel - The associated channel name
   * @param {Object} options - Dialog options
   * @param {string} [options.directory] - Starting directory path
   * @param {string} [options.filters="*"] - File filters (e.g., "*.wav;*.aiff")
   * @param {boolean} [options.openAtLastKnownLocation=true] - Whether to open at last known location
   */
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

  /**
   * Open a URL or file in the system's default application.
   *
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   * @param {string} url - URL to open
   * @param {string} file - File path to open
   */
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


  /**
     * Send channel data directly to Csound without DAW automation involvement.
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
   * Send a widget state update to the Cabbage backend (used by property panel).
   *
   * @private
   * @param {Object} widget - The widget configuration object to update
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   */
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

  /**
   * Send a custom command to the Cabbage backend.
   *
   * @param {string} command - The command name to send
   * @param {Object|null} vscode - VS Code API object (null for plugin mode)
   * @param {Object} additionalData - Additional data to include in the command
   */
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
        try {
          const result = window.sendMessageFromUI(msg);
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
}
