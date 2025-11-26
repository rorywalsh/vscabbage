// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils } from "../utils.js";

/**
 * ListBox class
 */
export class ListBox {
    constructor() {
        this.props = {
            "bounds": {
                "top": 0,
                "left": 0,
                "width": 200,
                "height": 300
            },
            "visible": true,
            "active": true,
            "automatable": true,
            "type": "listBox",
            "zIndex": 0,
            "style": {
                "opacity": 1
            },

            "color": {
                "background": "#ffffff",
                "text": "#000000",
                "highlighted": "#dddddd"
            },

            "items": "item1, item2, item3",
            "selectedIndex": -1,
            "channelType": "number",
            "min": 0,
            "max": 3
        };
        // Wrap props with reactive proxy to unify visible/active handling
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }
    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.widgetDiv = widgetDiv;
        this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
        // VS Code specific listeners are already added by addEventListeners

    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    }

    pointerDown(event) {
        const itemElements = event.currentTarget.querySelectorAll('.list-item');
        itemElements.forEach((itemElement, index) => {
            const rect = itemElement.getBoundingClientRect();
            if (event.clientX >= rect.left && event.clientX <= rect.right && event.clientY >= rect.top && event.clientY <= rect.bottom) {
                this.props.selectedIndex = index;
                this.updateListItems(itemElements);
                console.log(`Item ${index + 1} clicked!`);
            }
        });
    }

    updateListItems(itemElements) {
        itemElements.forEach((itemElement, index) => {
            if (index === this.props.selectedIndex) {
                itemElement.style.backgroundColor = this.props.color.highlighted;
            } else {
                itemElement.style.backgroundColor = this.props.color.background;
            }
        });
    }

    getItemsArray() {
        return Array.isArray(this.props.items)
            ? this.props.items
            : this.props.items.split(",").map(item => item.trim());
    }

    getInnerHTML() {
        const items = this.getItemsArray();
        const listItemsHTML = items.map((item, index) => `
            <div class="list-item" style="
                width: 100%;
                padding: 5px;
                box-sizing: border-box;
                color: ${this.props.color.text};
                background-color: ${index === this.props.selectedIndex ? this.props.color.highlighted : this.props.color.background};
                cursor: pointer;
                ">
                ${item}
            </div>
        `).join('');

        return `
            <div style="position: relative; width: 100%; height: 100%; overflow-y: auto; display: ${this.props.visible ? 'block' : 'none'};">
                ${listItemsHTML}
            </div>
        `;
    }
}
