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
            "channel": "comboBox",
            "corners": 2,
            "font": {
                "family": "Verdana",
                "size": 0,
                "align": "centre",
                "colour": "#dddddd"
            },
            "colour": {
                "fill": "#0295cf",
                "stroke": {
                    "colour": "#222222",
                    "width": 1
                }
            },
            "items": "One, Two, Three",
            "min": 0,
            "max": 3,
            "visible": 1,
            "type": "comboBox",
            "value": null,
            "defaultValue": 0,
            "automatable": 1,
            "active": 1,
            "channelType": "number",
            "populate": {
                "directory": "",
                "fileType": ""
            },
            "opacity": 1,
            "indexOffset": false
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
    }

    pointerDown(evt) {
        evt.stopPropagation();
        evt.preventDefault();

        if (this.props.active === 0) {
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

        CabbageUtils.updateInnerHTML(this.props.channel, this);
    }

    handleItemClick(item) {
        this.selectedItem = item;
        const items = this.getItemsArray();
        const index = items.indexOf(this.selectedItem);
        this.props.value = this.props.indexOffset ? index + 1 : index; // Update the value property
        let normalValue = 0;

        //to accommodate cabbage2 instruments
        if (this.props.indexOffset) {
            normalValue = CabbageUtils.map(index + 1, 1, items.length, 0, 1);
        }
        else {
            normalValue = CabbageUtils.map(index, 0, items.length - 1, 0, 1);
        }

        const msg = {
            paramIdx: this.parameterIndex,
            channel: this.props.channel,
            value: this.props.channelType === "string" ? this.selectedItem : normalValue,
            channelType: this.props.channelType
        };

        if (this.props.automatable === 1) {
            Cabbage.sendParameterUpdate(msg, this.vscode);
        }

        this.isOpen = false;
        this.removeDropdown();
        CabbageUtils.updateInnerHTML(this.props.channel, this);
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
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

        const widgetDiv = CabbageUtils.getWidgetDiv(this.props.channel);
        if (!widgetDiv) return;

        const rect = widgetDiv.getBoundingClientRect();
        const items = this.getItemsArray();
        const itemHeight = this.props.bounds.height * 0.8;
        const dropdownHeight = items.length * itemHeight;

        // Calculate the maximum width needed for all items
        const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.5;
        let maxWidth = rect.width;
        items.forEach(item => {
            const textWidth = CabbageUtils.getStringWidth(item, {
                font: {
                    family: this.props.font.family,
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
        dropdown.id = `dropdown-${this.props.channel}`;
        dropdown.style.position = 'fixed';
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.top = `${rect.bottom}px`;
        dropdown.style.width = `${maxWidth}px`;
        dropdown.style.height = `${dropdownHeight}px`;
        dropdown.style.zIndex = '9999';
        dropdown.style.backgroundColor = this.props.colour.fill;
        dropdown.style.border = `1px solid ${this.props.colour.stroke.colour}`;
        dropdown.style.borderRadius = `${this.props.corners}px`;
        dropdown.style.overflowY = 'auto';
        dropdown.style.maxHeight = `${Math.min(dropdownHeight, 300)}px`;

        // Create dropdown items
        items.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'combobox-item';
            itemDiv.setAttribute('data-channel', this.props.channel);
            itemDiv.setAttribute('data-item', item);
            itemDiv.setAttribute('data-combobox-select', this.props.channel);
            itemDiv.style.height = `${itemHeight}px`;
            itemDiv.style.display = 'flex';
            itemDiv.style.alignItems = 'center';
            itemDiv.style.justifyContent = 'center';
            itemDiv.style.cursor = 'pointer';
            itemDiv.style.backgroundColor = CabbageColours.darker(this.props.colour.fill, 0.2);
            itemDiv.style.fontFamily = this.props.font.family;
            itemDiv.style.fontSize = `${this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.5}px`;
            itemDiv.style.color = this.props.font.colour;

            itemDiv.onmouseover = () => {
                itemDiv.style.backgroundColor = CabbageColours.lighter(this.props.colour.fill, 0.2);
            };
            itemDiv.onmouseout = () => {
                itemDiv.style.backgroundColor = CabbageColours.darker(this.props.colour.fill, 0.2);
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
        const widgetDiv = CabbageUtils.getWidgetDiv(this.props.channel);

        if (!widgetDiv) {
            console.warn("Cabbage: widgetDiv is null. Channel:", this.props.channel);
            return; // Exit early if widgetDiv is null
        }

        // Check if click is inside the widget or dropdown
        const isInsideWidget = widgetDiv.contains(event.target);
        const isInsideDropdown = this.dropdownElement && this.dropdownElement.contains(event.target);

        if (!isInsideWidget && !isInsideDropdown) {
            this.isOpen = false;
            this.removeDropdown();
            widgetDiv.style.transform = 'translate(' + this.props.bounds.left + 'px,' + this.props.bounds.top + 'px)';
            CabbageUtils.updateInnerHTML(this.props.channel, this);
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

        const svgAlign = alignMap[this.props.font.align] || this.props.font.align;
        const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.5;

        const arrowWidth = 10; // Width of the arrow
        const arrowHeight = 6; // Height of the arrow
        const arrowX = this.props.bounds.width - arrowWidth - this.props.corners / 2 - 10; // Decreasing arrowX value to move the arrow more to the left
        const arrowY = (this.props.bounds.height - arrowHeight) / 2; // Y-coordinate of the arrow

        let selectedItemTextX;
        if (svgAlign === 'middle') {
            selectedItemTextX = (this.props.bounds.width - arrowWidth - this.props.corners / 2) / 2;
        } else {
            const selectedItemWidth = CabbageUtils.getStringWidth(this.selectedItem, this.props);
            const textPadding = svgAlign === 'start' ? - this.props.bounds.width * .1 : - this.props.bounds.width * .05;
            selectedItemTextX = svgAlign === 'start' ? (this.props.bounds.width - this.props.corners / 2) / 2 - selectedItemWidth / 2 + textPadding : (this.props.bounds.width - this.props.corners / 2) / 2 + selectedItemWidth / 2 + textPadding;
        }
        const selectedItemTextY = this.props.bounds.height / 2;

        return `
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="${this.props.bounds.width}" height="${this.props.bounds.height}" preserveAspectRatio="none" opacity="${this.props.opacity}" style="display: ${this.props.visible === 0 ? 'none' : 'block'};">
                <rect x="${this.props.corners / 2}" y="${this.props.corners / 2}" width="${this.props.bounds.width - this.props.corners}" height="${this.props.bounds.height - this.props.corners * 2}" fill="${this.props.colour.fill}" stroke="${this.props.colour.stroke.colour}"
                    stroke-width="${this.props.colour.stroke.width}" rx="${this.props.corners}" ry="${this.props.corners}" 
                    style="cursor: pointer;" pointer-events="all" 
                    onclick="document.getElementById('${this.props.channel}').ComboBoxInstance.pointerDown(event)"></rect>
                <polygon points="${arrowX},${arrowY} ${arrowX + arrowWidth},${arrowY} ${arrowX + arrowWidth / 2},${arrowY + arrowHeight}"
                    fill="${this.props.colour.stroke.colour}" style="${this.isOpen ? 'display: none;' : ''} pointer-events: none;"/>
                <text x="${selectedItemTextX}" y="${selectedItemTextY}" font-family="${this.props.font.family}" font-size="${fontSize}"
                    fill="${this.props.font.colour}" text-anchor="${svgAlign}" alignment-baseline="middle"
                    style="pointer-events: none;">${this.selectedItem}</text>
            </svg>
        `;
    }
}
