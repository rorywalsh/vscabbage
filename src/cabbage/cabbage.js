


export class Cabbage {
  
  static sendParameterUpdate(vscode, message) {
    const msg = {
      command: "parameterChange",
      obj: JSON.stringify(message)
    };
    if (vscode != null) {
      vscode.postMessage(msg);
    }
    else {
      console.log("sending parameter change from UI", msg);
      if(typeof IPlugSendMsg === 'function'){
        IPlugSendMsg(msg);
      }
    }
  }

  static sendCustomCommand(vscode, command){
    const msg = {
      command: command,
      text: JSON.stringify({})
    };
    console.log("sending custom command from UI", msg);
    if (vscode != null) {
      vscode.postMessage(msg);
    }
    else {      
      if(typeof IPlugSendMsg === 'function'){
        IPlugSendMsg(msg);
      }
    }
  } 

  static sendWidgetUpdate(vscode, widget){
    console.log("sending widget update from UI", widget.props);
    const msg = {
      command: "widgetStateUpdate",
      obj:JSON.stringify(widget.props)
    };
    if (vscode != null) {
      vscode.postMessage(msg);
    }
    else {
      if(typeof IPlugSendMsg === 'function'){
        IPlugSendMsg(msg);
      }
    }
  }

  static sendMidiMessageFromUI(vscode, statusByte, dataByte1, dataByte2) {
    var message = {
      "statusByte": statusByte,
      "dataByte1": dataByte1,
      "dataByte2": dataByte2
    };

    const msg = {
      command: "midiMessage",
      obj: JSON.stringify(message)
    };

    console.log("sending midi message from UI", message);
    if (vscode != null) {
      vscode.postMessage(msg);
    }
    else {
      if(typeof IPlugSendMsg === 'function'){
        IPlugSendMsg(msg);
      }
    }
  }

  static MidiMessageFromHost(statusByte, dataByte1, dataByte2) {
    console.log("Got MIDI Message" + statusByte + ":" + dataByte1 + ":" + dataByte2);
  }

  static triggerFileOpenDialog(vscode, channel) {
    var message = {
      "channel": channel
    };

    const msg = {
      command: "fileOpen",
      obj: JSON.stringify(message)
    };
    if (vscode != null) {
      vscode.postMessage(msg);
    }
    else {
      if(typeof IPlugSendMsg === 'function'){
        IPlugSendMsg(msg);
      }
    }
  }


}


function SPVFD(paramIdx, val) {
  //  console.log("paramIdx: " + paramIdx + " value:" + val);
  OnParamChange(paramIdx, val);
}

function SCVFD(ctrlTag, val) {
  OnControlChange(ctrlTag, val);
  //  console.log("SCVFD ctrlTag: " + ctrlTag + " value:" + val);
}

function SCMFD(ctrlTag, msgTag, msg) {
  //  var decodedData = window.atob(msg);
  console.log("SCMFD ctrlTag: " + ctrlTag + " msgTag:" + msgTag + "msg:" + msg);
}

function SAMFD(msgTag, dataSize, msg) {
  //  var decodedData = window.atob(msg);
  console.log("SAMFD msgTag:" + msgTag + " msg:" + msg);
}

function SMMFD(statusByte, dataByte1, dataByte2) {
  console.log("Got MIDI Message" + status + ":" + dataByte1 + ":" + dataByte2);
}

function SSMFD(offset, size, msg) {
  console.log("Got Sysex Message");
}

// FROM UI
// data should be a base64 encoded string
function SAMFUI(msgTag, ctrlTag = -1, data = 0) {
  var message = {
    "msg": "SAMFUI",
    "msgTag": msgTag,
    "ctrlTag": ctrlTag,
    "data": data
  };

  IPlugSendMsg(message);
}

function SMMFUI(statusByte, dataByte1, dataByte2) {
  var message = {
    "msg": "SMMFUI",
    "statusByte": statusByte,
    "dataByte1": dataByte1,
    "dataByte2": dataByte2
  };

  IPlugSendMsg(message);
}

// data should be a base64 encoded string
function SSMFUI(data = 0) {
  var message = {
    "msg": "SSMFUI",
    "data": data
  };

  IPlugSendMsg(message);
}

function EPCFUI(paramIdx) {
  var message = {
    "msg": "EPCFUI",
    "paramIdx": paramIdx,
  };

  IPlugSendMsg(message);
}

function BPCFUI(paramIdx) {
  var message = {
    "msg": "BPCFUI",
    "paramIdx": paramIdx,
  };

  IPlugSendMsg(message);
}

function SPVFUI(paramIdx, value) {
  var message = {
    "msg": "SPVFUI",
    "paramIdx": paramIdx,
    "value": value
  };

  IPlugSendMsg(message);
}
