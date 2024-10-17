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
                "align": "centre"
            },
            "colour": "#0295cf",
            "items": "One, Two, Three",
            "fontColour": "#dddddd",
            "stroke": {
                "colour": "#dddddd",
                "width": 0
            },
            "min": 0,
            "max": 3,
            "visible": 1,
            "type": "comboBox",
            "value": 0,
            "automatable": 1,
            "active": 1,
            "channelType": "number",
            "populate": {
                "directory": "",
                "fileType": ""
            },
            "opacity": 1
        };

        this.isMouseInside = false;
        this.isOpen = false;
        this.selectedItem = this.props.value > 0 ? this.props.items.split(",")[this.props.value] : this.props.items.split(",")[0];
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
        CabbageUtils.updateInnerHTML(this.props.channel, this);
    }

    handleItemClick(item) {
        this.selectedItem = item;
        const items = this.props.items.split(",").map(i => i.trim());
        const index = items.indexOf(this.selectedItem);
        this.props.value = index; // Update the value property
        const normalValue = CabbageUtils.map(index, 0, items.length - 1, 0, 1);

        const msg = {
            paramIdx: this.parameterIndex,
            channel: this.props.channel,
            value: this.props.channelType === "string" ? this.selectedItem : normalValue,
            channelType: this.props.channelType
        };

        Cabbage.sendParameterUpdate(this.vscode, msg);

        this.isOpen = false;
        const widgetDiv = CabbageUtils.getWidgetDiv(this.props.channel);
        CabbageUtils.updateInnerHTML(this.props.channel, this);
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        document.addEventListener("pointerdown", this.handleClickOutside.bind(this));

        // Add a global event listener for combobox item selection
        document.addEventListener("click", (event) => {
            const target = event.target.closest('[data-combobox-select]');
            if (target && target.getAttribute('data-combobox-select') === this.props.channel) {
                const selectedItem = target.getAttribute('data-item');
                this.handleItemClick(selectedItem);
            }
        });

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

        const items = this.props.items.split(",").map(item => item.trim());

        // Ensure selectedItem is up-to-date with the current value
        this.selectedItem = items[this.props.value] || items[0];

        const alignMap = {
            'left': 'start',
            'center': 'middle',
            'centre': 'middle',
            'right': 'end',
        };

        const svgAlign = alignMap[this.props.font.align] || this.props.font.align;
        const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.5;

        let totalHeight = this.props.bounds.height;
        const itemHeight = this.props.bounds.height * 0.8;
        let dropdownItems = "";

        // Always render dropdown items for debugging
        if (this.isOpen) {
            items.forEach((item, index) => {
                dropdownItems += `
                    <div class="combobox-item" 
                        data-channel="${this.props.channel}" 
                        data-item="${item}"
                        style="height:${itemHeight}px; display:flex; align-items:center; justify-content:center; cursor:pointer; background-color:${CabbageColours.darker(this.props.colour, 0.2)};"
                        onmouseover="this.style.backgroundColor='${CabbageColours.lighter(this.props.colour, 0.2)}'"
                        onmouseout="this.style.backgroundColor='${CabbageColours.darker(this.props.colour, 0.2)}'"
                        data-combobox-select="${this.props.channel}">
                        <span style="font-family:${this.props.font.family}; font-size:${fontSize}px; color:${this.props.fontColour};">${item}</span>
                    </div>
                `;
            });
        }

        totalHeight += items.length * itemHeight;

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
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${totalHeight}" width="${this.props.bounds.width}" height="${totalHeight}" preserveAspectRatio="none" opacity="${this.props.opacity}">
                <rect x="${this.props.corners / 2}" y="${this.props.corners / 2}" width="${this.props.bounds.width - this.props.corners}" height="${this.props.bounds.height - this.props.corners * 2}" fill="${this.props.colour}" stroke="${this.props.stroke.colour}"
                    stroke-width="${this.props.stroke.width}" rx="${this.props.corners}" ry="${this.props.corners}" 
                    style="cursor: pointer;" pointer-events="all" 
                    onclick="document.getElementById('${this.props.channel}').ComboBoxInstance.pointerDown(event)"></rect>
                ${this.isOpen ? `
                    <foreignObject x="0" y="${this.props.bounds.height}" width="${this.props.bounds.width}" height="${totalHeight - this.props.bounds.height}">
                        <div xmlns="http://www.w3.org/1999/xhtml" style="max-height:${totalHeight - this.props.bounds.height}px; overflow-y:auto;">
                            ${dropdownItems}
                        </div>
                    </foreignObject>` : ''}
                <polygon points="${arrowX},${arrowY} ${arrowX + arrowWidth},${arrowY} ${arrowX + arrowWidth / 2},${arrowY + arrowHeight}"
                    fill="${this.props.stroke.colour}" style="${this.isOpen ? 'display: none;' : ''} pointer-events: none;"/>
                <text x="${selectedItemTextX}" y="${selectedItemTextY}" font-family="${this.props.font.family}" font-size="${fontSize}"
                    fill="${this.props.fontColour}" text-anchor="${svgAlign}" alignment-baseline="middle"
                    style="pointer-events: none;">${this.selectedItem}</text>
            </svg>
        `;
    }
}
