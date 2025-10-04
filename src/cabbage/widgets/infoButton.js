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
        this.props = {
            "bounds": {
                "top": 10,
                "left": 10,
                "width": 80,
                "height": 30
            },
            "channel": "infoButton",
            "corners": 6,
            "min": 0,
            "max": 1,
            "defaultValue": 0,
            "value": null,
            "text": {
                "on": "Info Button",
                "off": "Info Button"
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
            "type": "infoButton",
            "visible": 1,
            "automatable": 0,
            "presetIgnore": 0,
            "radioGroup": -1,
            "mode": "info",
            "file": "",
            "url": ""
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
