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
            "fontFamily": "Verdana",
            "fontSize": 14,
            "align": "center",
            "colour": "#0295cf",
            "items": "One, Two, Three",
            "fontColour": "#dddddd",
            "outlineColour": "#dddddd",
            "outlineWidth": 0,
            "min": 0,
            "max": 3,
            "visible": 1,
            "type": "combobox",
            "value": 0,
            "automatable": 1,
            "active": 1,
            "channelType": "number",
            "currentDirectory": "",
            "fileType": ""
        };

        this.panelSections = {
            "Properties": ["type"],
            "Bounds": ["top", "left", "width", "height"],
            "Text": ["items", "fontFamily", "align", "fontSize", "fontColour"],
            "Colours": ["colour", "outlineColour"]
        };

        this.isMouseInside = false;
        this.isOpen = false;
        this.selectedItem = this.props.value > 0 ? this.props.items.split(",")[this.props.value] : this.props.items.split(",")[0];
        this.parameterIndex = 0;
        this.vscode = null;
    }

    pointerDown(evt) {
        if (this.props.active === 0) {
            return '';
        }

        this.isOpen = true;//!this.isOpen;
        console.log("Pointer down", this.isOpen);
        this.isMouseInside = true;
        CabbageUtils.updateInnerHTML(this.props.channel, this);
    }

    handleItemClick(item) {
        this.selectedItem = item.trim();
        const items = this.props.items.split(",");
        const index = items.indexOf(this.selectedItem);
        const normalValue = CabbageUtils.map(index, 0, items.length, 0, 1);

        const msg = {
            paramIdx: this.parameterIndex, channel: this.props.channel,
            value: this.props.channelType === "string" ? this.selectedItem : normalValue,
            channelType: this.props.channelType
        }
        Cabbage.sendParameterUpdate(this.vscode, msg);


        this.isOpen = false;
        const widgetDiv = CabbageUtils.getWidgetDiv(this.props.channel);
        widgetDiv.style.transform = 'translate(' + this.props.bounds.left + 'px,' + this.props.bounds.top + 'px)';
        CabbageUtils.updateInnerHTML(this.props.channel, this);
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        document.body.addEventListener("click", this.handleClickOutside.bind(this));
        widgetDiv.ComboBoxInstance = this;
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        document.body.addEventListener("click", this.handleClickOutside.bind(this));
        widgetDiv.ComboBoxInstance = this;
    }


    handleClickOutside(event) {
        const widgetDiv = CabbageUtils.getWidgetDiv(this.props.channel);

        if (!widgetDiv.contains(event.target)) {
            this.isOpen = false;
            widgetDiv.style.transform = 'translate(' + this.props.bounds.left + 'px,' + this.props.bounds.top + 'px)';
            CabbageUtils.updateInnerHTML(this.props.channel, this);
        }
    }

    getInnerHTML() {
        if (this.props.visible === 0) {
            return '';
        }

        const items = this.props.items.split(",");

        // Ensure selectedItem is up-to-date with the items list
        if (!items.includes(this.selectedItem)) {
            this.selectedItem = items.length > 0 ? items[0].trim() : "";
        }

        const alignMap = {
            'left': 'start',
            'center': 'middle',
            'centre': 'middle',
            'right': 'end',
        };

        const svgAlign = alignMap[this.props.align] || this.props.align;
        const fontSize = this.props.fontSize > 0 ? this.props.fontSize : this.props.bounds.height * 0.5;

        let totalHeight = this.props.bounds.height;
        const itemHeight = this.props.bounds.height * 0.8; // Scale back item height to 80% of the original height
        let dropdownItems = "";

        if (this.isOpen) {
            items.forEach((item, index) => {
                dropdownItems += `
                    <div style="height:${itemHeight}px; display:flex; align-items:center; justify-content:center; cursor:pointer; background-color:${CabbageColours.darker(this.props.colour, 0.2)};"
                        onmouseover="this.style.backgroundColor='${CabbageColours.lighter(this.props.colour, 0.2)}'"
                        onmouseout="this.style.backgroundColor='${CabbageColours.darker(this.props.colour, 0.2)}'"
                        onmousedown="document.getElementById('${this.props.channel}').ComboBoxInstance.handleItemClick('${item}')">
                        <span style="font-family:${this.props.fontFamily}; font-size:${this.props.fontSize}px; color:${this.props.fontColour};">${item.trim()}</span>
                    </div>
                `;
            });

            // Calculate the total dropdown height
            const dropdownHeight = items.length * itemHeight;
            totalHeight += dropdownHeight;

            // Check available space
            const mainForm = CabbageUtils.getWidgetDiv("MainForm");
            const widgetDiv = mainForm.querySelector(`#${this.props.channel}`);
            const widgetRect = widgetDiv.getBoundingClientRect();
            const mainFormRect = mainForm.getBoundingClientRect();
            const spaceBelow = mainFormRect.bottom - widgetRect.bottom;
            const spaceAbove = widgetRect.top - mainFormRect.top;

            // Determine max height for the dropdown
            const maxDropdownHeight = Math.min(dropdownHeight, Math.max(spaceBelow, spaceAbove));

            // Adjust total height
            totalHeight = this.props.bounds.height + maxDropdownHeight;
        }

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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${totalHeight}" width="${this.props.bounds.width}" height="${totalHeight}" preserveAspectRatio="none">
                <rect x="${this.props.corners / 2}" y="${this.props.corners / 2}" width="${this.props.bounds.width - this.props.corners}" height="${this.props.bounds.height - this.props.corners * 2}" fill="${this.props.colour}" stroke="${this.props.outlineColour}"
                    stroke-width="${this.props.outlineWidth}" rx="${this.props.corners}" ry="${this.props.corners}" 
                    style="cursor: pointer;" pointer-events="all" 
                    onmousedown="document.getElementById('${this.props.channel}').ComboBoxInstance.pointerDown(event)"></rect>
                ${this.isOpen ? `
                    <foreignObject x="0" y="${this.props.bounds.height}" width="${this.props.bounds.width}" height="${totalHeight - this.props.bounds.height}">
                        <div xmlns="http://www.w3.org/1999/xhtml" style="max-height:${totalHeight - this.props.bounds.height}px; overflow-y:auto; scrollbar-width: thin; scrollbar-color: ${CabbageColours.darker(this.props.colour, 0.2)} ${this.props.colour};">
                            <style>
                                /* Custom scrollbar for Webkit browsers */
                                div::-webkit-scrollbar {
                                    width: 8px;
                                }
                                div::-webkit-scrollbar-track {
                                    background: ${this.props.colour};
                                }
                                div::-webkit-scrollbar-thumb {
                                    background-color: ${CabbageColours.darker(this.props.colour, 0.2)};
                                    border-radius: 4px;
                                }
                            </style>
                            ${dropdownItems}
                        </div>
                    </foreignObject>` : ''}
                <polygon points="${arrowX},${arrowY} ${arrowX + arrowWidth},${arrowY} ${arrowX + arrowWidth / 2},${arrowY + arrowHeight}"
                    fill="${this.props.outlineColour}" style="${this.isOpen ? 'display: none;' : ''} pointer-events: none;"/>
                <text x="${selectedItemTextX}" y="${selectedItemTextY}" font-family="${this.props.fontFamily}" font-size="${fontSize}"
                    fill="${this.props.fontColour}" text-anchor="${svgAlign}" alignment-baseline="middle" style="${this.isOpen ? 'display: none;' : ''}"
                    style="pointer-events: none;">${this.selectedItem}</text>
            </svg>
        `;
    }


}
