// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

console.log("Cabbage: loading cabbage.js");

export class Cabbage {

  static sendParameterUpdate(message, vscode = null) {
    const msg = {
      command: "parameterChange",
      obj: JSON.stringify(message)
    };
    console.log("Cabbage.sendParameterUpdate:", message, "vscode:", vscode, "msg:", msg);
    if (vscode !== null) {
      console.log("Sending via vscode.postMessage");
      vscode.postMessage(msg);
    }
    else {
      console.log("Sending via window.sendMessageFromUI");
      window.sendMessageFromUI(msg);
    }
  }

  static sendCustomCommand(command, vscode = null) {
    const msg = {
      command: command,
      text: JSON.stringify({})
    };
    console.log("Cabbage: sending custom command from UI", msg);
    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      window.sendMessageFromUI(msg);
    }
  }

  static sendWidgetUpdate(widget, vscode = null) {
    console.log("Cabbage: sending widget update from UI", widget.props);
    const msg = {
      command: "widgetStateUpdate",
      obj: JSON.stringify(CabbageUtils.sanitizeForEditor(widget))
    };
    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      window.sendMessageFromUI(msg);
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

    console.log("Cabbage: sending midi message from UI", message);
    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      window.sendMessageFromUI(msg);
    }
  }

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
      command: "channelStringData",
      obj: JSON.stringify(message)
    };

    console.log("Cabbage: sending channel data from UI", message);
    if (vscode !== null) {
      vscode.postMessage(msg);
    }
    else {
      window.sendMessageFromUI(msg);
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
      window.sendMessageFromUI(msg);
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
      window.sendMessageFromUI(msg);
    }
  }


}
