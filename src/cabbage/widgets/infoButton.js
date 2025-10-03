// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { Button } from './button.js';
import { CabbageUtils } from "../utils.js";
import { Cabbage } from "../cabbage.js";

/*
  * Info Button for opening URLs or files @extends Button
  */
export class InfoButton extends Button {
    constructor() {
        super();
        this.props.channel = "infoButton";
        this.props.file = "";
        this.props.url = "";

        this.props.colour.on.fill = this.props.colour.off.fill;
        this.props.mode = "info";
        delete this.props.text.off;
        delete this.props.text.on;
        this.props.text = "Info Button";
        this.props.text.on = this.props.text;
        this.props.text.off = this.props.text;
        this.props.type = "infoButton";
        this.props.automatable = 0;
    }

    pointerDown(evt) {
        if (this.props.active === 0) {
            return '';
        }
        console.log("Cabbage: InfoButton pointerDown");
        this.isMouseDown = true;
        this.props.value = 1;

        // Determine which URL to open - prioritize 'url' property, fall back to 'file'
        const urlToOpen = this.props.url || this.props.file;

        if (urlToOpen) {
            Cabbage.openUrl(this.vscode, this.props.url, this.props.file);
        } else {
            console.warn("Cabbage: InfoButton has no url or file property set");
        }

        CabbageUtils.updateInnerHTML(this.props.channel, this);
    }

}
