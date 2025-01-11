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
      this.props.channel = "fileButton";
  
      this.props.colour.on.fill = this.props.colour.off.fill;
      this.props.mode = "file";
      delete this.props.text.off;
      delete this.props.text.on;
      this.props.text = "Choose File";
      this.props.text.on = this.props.text;
      this.props.text.off = this.props.text;
      this.props.type = "filebutton";
      this.props.automatable = 0;
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
  