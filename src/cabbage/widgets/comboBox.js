// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils, CabbageColours } from "../utils.js";
import { Cabbage } from "../cabbage.js";

export class ComboBox {
    constructor() {
        this.props = {
            "bounds": {
                "top": 10,
                "left": 10,
                "width": 100,
                "height": 30
            },
            "channels": [
                {
                    "id": "comboBox",
                    "event": "valueChanged",
                    "range": { "defaultValue": 0, "increment": 1, "max": 2, "min": 0, "skew": 1 }
                }
            ],
            "value": null,
            "zIndex": 0,
            "visible": true,
            "active": true,
            "automatable": true,
            "type": "comboBox",
            "channelType": "number",

            "style": {
                "opacity": 1,
                "borderRadius": 2,
                "borderWidth": 1,
                "borderColor": "#222222",
                "backgroundColor": "#0295cf",
                "fontFamily": "Verdana",
                "fontSize": "auto",
                "fontColor": "#dddddd",
                "textAlign": "center"
            },
            "label": {},

            "items": ["One", "Two", "Three"],
            "indexOffset": false,
            "populate": {
                "directory": "",
                "fileType": ""
            }
        };

        this.isMouseInside = false;
        this.isOpen = false;
        const itemsArray = this.getItemsArray();
        const safeItems = itemsArray.length > 0 ? itemsArray : [''];
        this.selectedItem = this.props.indexOffset
            ? (this.props.value > 0 ? safeItems[this.props.value - 1] : safeItems[0])
            : (this.props.value >= 0 ? safeItems[this.props.value] : safeItems[0]);
        this.parameterIndex = 0;
        this.vscode = null;
        // Wrap props with reactive proxy to unify visible/active handling
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    pointerDown(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        if (!this.props.active) {
            return '';
        }

        // Check if the click is on a dropdown item
        if (evt.target.closest('.combobox-item')) {
            return; // Let the click event handle item selection
        }

        this.isOpen = !this.isOpen;
        this.isMouseInside = true;

        if (this.isOpen) {
            this.createDropdown();
        } else {
            this.removeDropdown();
        }

        CabbageUtils.updateInnerHTML(this.props, this);
    }

    handleItemClick(item) {
        this.selectedItem = item;
        const items = this.getItemsArray();
        const index = items.indexOf(this.selectedItem);
        const valueToSend = this.props.indexOffset ? index + 1 : index;

        this.props.value = valueToSend;

        const msg = {
            paramIdx: CabbageUtils.getChannelParameterIndex(this.props, 0),
            channel: CabbageUtils.getChannelId(this.props),
            value: this.props.value,
            channelType: "number"
        };
        Cabbage.sendChannelUpdate(msg, this.vscode, this.props.automatable);

        this.isOpen = false;
        this.removeDropdown();
        CabbageUtils.updateInnerHTML(this.props, this);
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.widgetDiv = widgetDiv;
        this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        document.addEventListener("pointerdown", this.handleClickOutside.bind(this));

        widgetDiv.ComboBoxInstance = this;
    }

    createDropdown() {
        // Remove any existing dropdown
        this.removeDropdown();

        const widgetDiv = CabbageUtils.getWidgetDiv(this.props);
        if (!widgetDiv) return;

        const rect = widgetDiv.getBoundingClientRect();
        const items = this.getItemsArray();
        const itemHeight = this.props.bounds.height * 0.8;
        const dropdownHeight = items.length * itemHeight;

        // Calculate the maximum width needed for all items
        const fontSize = this.props.style.fontSize === "auto" ? this.props.bounds.height * 0.5 : this.props.style.fontSize;
        let maxWidth = rect.width;
        items.forEach(item => {
            const textWidth = CabbageUtils.getStringWidth(item, {
                font: {
                    family: this.props.style.fontFamily,
                    size: fontSize
                }
            });
            // Add some padding
            const itemWidth = textWidth + 20;
            if (itemWidth > maxWidth) {
                maxWidth = itemWidth;
            }
        });

        // Create dropdown container
        const dropdown = document.createElement('div');
        dropdown.id = `dropdown-${CabbageUtils.getWidgetDivId(this.props)}`;
        dropdown.style.position = 'fixed';
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.width = `${maxWidth}px`;
        dropdown.style.height = `${dropdownHeight}px`;
        dropdown.style.zIndex = '9999';
        dropdown.style.backgroundColor = this.props.style.backgroundColor;
        dropdown.style.border = `${this.props.style.borderWidth}px solid ${this.props.style.borderColor}`;
        dropdown.style.borderRadius = `${this.props.style.borderRadius}px`;
        dropdown.style.overflowY = 'auto';
        dropdown.style.maxHeight = `${Math.min(dropdownHeight, 300)}px`;

        // Create dropdown items
        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'combobox-item';
            itemDiv.setAttribute('data-channel', CabbageUtils.getWidgetDivId(this.props));
            itemDiv.setAttribute('data-item', item);
            itemDiv.setAttribute('data-combobox-select', CabbageUtils.getWidgetDivId(this.props));
            itemDiv.style.height = `${itemHeight}px`;
            itemDiv.style.display = 'flex';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.justifyContent = 'center';
            itemDiv.style.cursor = 'pointer';
            itemDiv.style.backgroundColor = CabbageColours.darker(this.props.style.backgroundColor, 0.2);
            itemDiv.style.fontFamily = this.props.style.fontFamily;
            itemDiv.style.fontSize = `${fontSize}px`;
            itemDiv.style.color = this.props.style.fontColor;

            itemDiv.onmouseover = () => {
                itemDiv.style.backgroundColor = CabbageColours.lighter(this.props.style.backgroundColor, 0.2);
            };
            itemDiv.onmouseout = () => {
                itemDiv.style.backgroundColor = CabbageColours.darker(this.props.style.backgroundColor, 0.2);
            };

            itemDiv.onclick = () => {
                this.handleItemClick(item);
            };

            itemDiv.textContent = item;
            dropdown.appendChild(itemDiv);
        });

        document.body.appendChild(dropdown);
        this.dropdownElement = dropdown;
    }

    removeDropdown() {
        if (this.dropdownElement && this.dropdownElement.parentNode) {
            this.dropdownElement.parentNode.removeChild(this.dropdownElement);
            this.dropdownElement = null;
        }
    }

    handleClickOutside(event) {
        const widgetDiv = CabbageUtils.getWidgetDiv(this.props);

        if (!widgetDiv) {
            console.warn("Cabbage: widgetDiv is null. Channel:", CabbageUtils.getWidgetDivId(this.props));
            return; // Exit early if widgetDiv is null
        }

        // Check if click is inside the widget or dropdown
        const isInsideWidget = widgetDiv.contains(event.target);
        const isInsideDropdown = this.dropdownElement && this.dropdownElement.contains(event.target);

        if (!isInsideWidget && !isInsideDropdown) {
            this.isOpen = false;
            this.removeDropdown();
            widgetDiv.style.transform = 'translate(' + this.props.bounds.left + 'px,' + this.props.bounds.top + 'px)';
            CabbageUtils.updateInnerHTML(this.props, this);
        }
    }

    getItemsArray() {
        if (!this.props.items) {
            return [''];
        }
        return Array.isArray(this.props.items)
            ? this.props.items
            : this.props.items.split(",").map(item => item.trim());
    }

    getInnerHTML() {
        const items = this.getItemsArray();

        // Ensure selectedItem is up-to-date with the current value
        const safeItems = items.length > 0 ? items : [''];
        this.selectedItem = this.props.indexOffset
            ? (this.props.value > 0 ? (safeItems[this.props.value - 1] || safeItems[0]) : safeItems[0])
            : (safeItems[this.props.value] || safeItems[0]);

        const alignMap = {
            'left': 'start',
            'center': 'middle',
            'centre': 'middle',
            'right': 'end',
        };

        const svgAlign = alignMap[this.props.style.textAlign] || this.props.style.textAlign;
        const fontSize = this.props.style.fontSize === "auto" ? this.props.bounds.height * 0.5 : this.props.style.fontSize;

        const arrowWidth = 10; // Width of the arrow
        const arrowHeight = 6; // Height of the arrow
        const arrowX = this.props.bounds.width - arrowWidth - this.props.style.borderRadius / 2 - 10; // Decreasing arrowX value to move the arrow more to the left
        const arrowY = (this.props.bounds.height - arrowHeight) / 2; // Y-coordinate of the arrow

        let selectedItemTextX;
        if (svgAlign === 'middle') {
            selectedItemTextX = (this.props.bounds.width - arrowWidth - this.props.style.borderRadius / 2) / 2;
        } else {
            const selectedItemWidth = CabbageUtils.getStringWidth(this.selectedItem, this.props);
            const textPadding = svgAlign === 'start' ? - this.props.bounds.width * .1 : - this.props.bounds.width * .05;
            selectedItemTextX = svgAlign === 'start' ? (this.props.bounds.width - this.props.style.borderRadius / 2) / 2 - selectedItemWidth / 2 + textPadding : (this.props.bounds.width - this.props.style.borderRadius / 2) / 2 + selectedItemWidth / 2 + textPadding;
        }
        const selectedItemTextY = this.props.bounds.height / 2;

        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" opacity="${this.props.style.opacity}" style="display: ${this.props.visible ? 'block' : 'none'};">
                <rect x="${this.props.style.borderRadius / 2}" y="${this.props.style.borderRadius / 2}" width="${this.props.bounds.width - this.props.style.borderRadius}" height="${this.props.bounds.height - this.props.style.borderRadius * 2}" fill="${this.props.style.backgroundColor}" stroke="${this.props.style.borderColor}"
                    stroke-width="${this.props.style.borderWidth}" rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}" 
                       style="cursor: pointer;" pointer-events="all" 
                       onclick="document.getElementById('${CabbageUtils.getWidgetDivId(this.props)}').ComboBoxInstance.pointerDown(event)"></rect>
                <polygon points="${arrowX},${arrowY} ${arrowX + arrowWidth},${arrowY} ${arrowX + arrowWidth / 2},${arrowY + arrowHeight}"
                    fill="${this.props.style.borderColor}" style="${this.isOpen ? 'display: none;' : ''} pointer-events: none;"/>
                <text x="${selectedItemTextX}" y="${selectedItemTextY}" font-family="${this.props.style.fontFamily}" font-size="${fontSize}"
                    fill="${this.props.style.fontColor}" text-anchor="${svgAlign}" alignment-baseline="middle"
                    style="pointer-events: none;">${this.selectedItem}</text>
            </svg>
        `;
    }
}
