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
      "channels": [
        {
          "id": "fileButton",
          "event": "valueChanged"
        }],
      "value": null,
      "zIndex": 0,
      "visible": true,
      "active": true,
      "automatable": false,
      "presetIgnore": false,
      "radioGroup": -1,
      "type": "fileButton",

      "style": {
        "opacity": 1,
        "borderRadius": 6,
        "borderWidth": 0,
        "borderColor": "#dddddd",
        "fontFamily": "Verdana",
        "fontSize": "auto",
        "fontColor": "#dddddd",
        "textAlign": "center",

        "on": {
          "backgroundColor": "#3d800a",
          "textColor": "#dddddd"
        },
        "off": {
          "backgroundColor": "#3d800a",
          "textColor": "#dddddd"
        },
        "hover": {
          "backgroundColor": "#4ca10c",
          "textColor": "#dddddd"
        },
        "active": {
          "backgroundColor": "#2d6008",
          "textColor": "#dddddd"
        }
      },

      "label": {
        "text": {
          "on": "Choose File",
          "off": "Choose File"
        }
      },

      "directory": "",
      "filters": "*",
      "openAtLastKnownLocation": true,
      "mode": "file"
    };

    this.vscode = null;
    this.isMouseDown = false;
    this.isMouseInside = false;
    this.parameterIndex = 0;
    // Wrap props with reactive proxy to unify visible/active handling
    this.props = CabbageUtils.createReactiveProps(this, this.props);
  }

  pointerDown(evt) {
    if (!this.props.active) {
      return '';
    }
    console.log("Cabbage: fileButton pointerDown");
    this.isMouseDown = true;
    this.props.value = 1;

    if (this.vscode !== null) {
      // VS Code mode - use VS Code's file dialog
      Cabbage.triggerFileOpenDialog(this.vscode, CabbageUtils.getWidgetDivId(this.props), {
        directory: this.props.directory,
        filters: this.props.filters,
        openAtLastKnownLocation: this.props.openAtLastKnownLocation
      });
    } else {
      // Plugin mode - send command to backend to open native file dialog
      Cabbage.triggerFileOpenDialog(null, CabbageUtils.getWidgetDivId(this.props), {
        directory: this.props.directory,
        filters: this.props.filters,
        openAtLastKnownLocation: this.props.openAtLastKnownLocation
      });
    }

    CabbageUtils.updateInnerHTML(this.props, this);
  }

  openNativeFileDialog() {
    // Removed: Plugin now uses backend-triggered native file dialog
  }

}
