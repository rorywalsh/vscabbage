// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { Button } from './button.js';
import { CabbageUtils } from "../utils.js";
import { Cabbage } from "../cabbage.js";

/*
  * File Button for file browsing @extends Button
  */
export class FileButton extends Button {
  constructor() {
    super();
    this.props = {
      "bounds": {
        "top": 10,
        "left": 10,
        "width": 80,
        "height": 30
      },
      "channels": [{ "id": "fileButton", "event": "valueChanged" }],
      "corners": 6,
      "min": 0,
      "max": 1,
      "defaultValue": 0,
      "value": null,
      "text": {
        "on": "Choose File",
        "off": "Choose File"
      },
      "opacity": 1,
      "font": {
        "family": "Verdana",
        "size": 0,
        "align": "centre",
        "colour": {
          "on": "#dddddd",
          "off": "#dddddd"
        }
      },
      "colour": {
        "on": {
          "fill": "#3d800a",
          "stroke": {
            "colour": "#dddddd",
            "width": 0
          }
        },
        "off": {
          "fill": "#3d800a",
          "stroke": {
            "colour": "#dddddd",
            "width": 0
          }
        }
      },
      "directory": "",
      "filters": "*",
      "openAtLastKnownLocation": true,
      "type": "fileButton",
      "visible": 1,
      "automatable": 0,
      "presetIgnore": 0,
      "radioGroup": -1,
      "mode": "file"
    };

    this.vscode = null;
    this.isMouseDown = false;
    this.isMouseInside = false;
    this.parameterIndex = 0;
  }

  pointerDown(evt) {
    if (this.props.active === 0) {
      return '';
    }
    console.log("Cabbage: fileButton pointerDown");
    this.isMouseDown = true;
    this.props.value = 1;

    if (this.vscode !== null) {
      // VS Code mode - use VS Code's file dialog
      Cabbage.triggerFileOpenDialog(this.vscode, CabbageUtils.getChannelId(this.props), {
        directory: this.props.directory,
        filters: this.props.filters,
        openAtLastKnownLocation: this.props.openAtLastKnownLocation
      });
    } else {
      // Plugin mode - send command to backend to open native file dialog
      Cabbage.triggerFileOpenDialog(null, CabbageUtils.getChannelId(this.props), {
        directory: this.props.directory,
        filters: this.props.filters,
        openAtLastKnownLocation: this.props.openAtLastKnownLocation
      });
    }

    CabbageUtils.updateInnerHTML(CabbageUtils.getChannelId(this.props), this);
  }

  openNativeFileDialog() {
    // Removed: Plugin now uses backend-triggered native file dialog
  }

}
