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
            "channels": [{ "id": "infoButton", "event": "valueChanged" }],
            "value": null,
            "z-index": 0,
            "visible": true,
            "active": true,
            "automatable": false,
            "presetIgnore": false,
            "radioGroup": -1,
            "type": "infoButton",

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
                    "on": "Info Button",
                    "off": "Info Button"
                }
            },

            "mode": "info",
            "file": "",
            "url": ""
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

        CabbageUtils.updateInnerHTML(this.props, this);
    }

}
