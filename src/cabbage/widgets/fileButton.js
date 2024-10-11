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
  
      this.props.colour.on = this.props.colour.off;
      this.props.fontColour.on = this.props.fontColour.off;
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
      console.log("pointerDown");
      this.isMouseDown = true;
      this.props.value = 1;
      Cabbage.triggerFileOpenDialog(this.vscode, this.props.channel);
      CabbageUtils.updateInnerHTML(this.props.channel, this);
    }
  
  }
  