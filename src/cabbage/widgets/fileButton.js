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
    this.fileInput = null;
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
      Cabbage.triggerFileOpenDialog(this.vscode, this.props.channel);
    } else {
      // Plugin mode - use native HTML file input
      this.openNativeFileDialog();
    }

    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

  openNativeFileDialog() {
    // Create a hidden file input if it doesn't exist
    if (!this.fileInput) {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = 'audio/*,.wav,.mp3,.ogg,.flac,.aiff,.aif';
      this.fileInput.style.display = 'none';
      document.body.appendChild(this.fileInput);

      this.fileInput.addEventListener('change', (evt) => {
        if (evt.target.files && evt.target.files[0]) {
          const file = evt.target.files[0];
          // In plugin mode, we get a File object, not a file path
          // We need to send the file name or create a URL
          const fileName = file.name;
          const fileUrl = URL.createObjectURL(file);

          // Toggle button value for visual feedback
          this.props.value = this.props.value === 1 ? 0 : 1;
          CabbageUtils.updateInnerHTML(this.props.channel, this);

          // Send the file path/URL to Csound
          Cabbage.sendChannelStringData(this.props.channel, fileUrl, null);
          console.log(`Cabbage: FileButton ${this.props.channel} selected file: ${fileName}, URL: ${fileUrl}`);
        }
      });
    }

    // Trigger the file input dialog
    this.fileInput.click();
  }

}
