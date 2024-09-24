/**
 * ListBox class
 */
export class ListBox {
    constructor() {
        this.props = {
            "top": 0,
            "left": 0,
            "width": 200,
            "height": 300,
            "type": "listbox",
            "backgroundColour": "#ffffff",
            "fontColour": "#000000",
            "highlightedItemColour": "#dddddd",
            "items": "item1, item2, item3",
            "visible": 1,
            "selectedIndex": -1,
            "automatable": 1,
            "channelType": "number",
            "min":0,
            "max":3
        }

        this.panelSections = {
            "Properties": ["type"],
            "Bounds": ["left", "top", "width", "height"],
            "Colours": ["backgroundColour", "fontColour", "highlightedItemColour"],
            "Items": ["items"]
        };
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
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
                itemElement.style.backgroundColor = this.props.highlightedItemColour;
            } else {
                itemElement.style.backgroundColor = this.props.backgroundColour;
            }
        });
    }

    getInnerHTML() {
        if (this.props.visible === 0) {
            return '';
        }

        const items = this.props.items.split(',').map(item => item.trim());
        const listItemsHTML = items.map((item, index) => `
            <div class="list-item" style="
                width: 100%;
                padding: 5px;
                box-sizing: border-box;
                color: ${this.props.fontColour};
                background-color: ${index === this.props.selectedIndex ? this.props.highlightedItemColour : this.props.backgroundColour};
                cursor: pointer;
                ">
                ${item}
            </div>
        `).join('');

        return `
            <div style="position: relative; width: 100%; height: 100%; overflow-y: auto;">
                ${listItemsHTML}
            </div>
        `;
    }
}
