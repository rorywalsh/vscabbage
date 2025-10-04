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
      "channel": "fileButton",
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
      "name": "",
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
    console.log("Cabbage: pointerDown");
    this.isMouseDown = true;
    this.props.value = 1;
    Cabbage.triggerFileOpenDialog(this.vscode, this.props.channel);
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

}
