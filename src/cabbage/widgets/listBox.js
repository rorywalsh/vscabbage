// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils } from "../utils.js";
import { Cabbage } from "../cabbage.js";
import { getCabbageMode } from "../sharedState.js";

/**
 * Escapes HTML special characters so item text can be embedded in innerHTML.
 * Items are often file names pulled in through populate(), so they must never
 * be treated as markup.
 * @param {any} text
 * @returns {string}
 */
function escapeHtml(text) {
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Stable key describing the current item list, used to detect populate()
 * driven changes to the items.
 * @param {string[]} items
 * @returns {string}
 */
function itemsKeyOf(items) {
    return JSON.stringify(items.map(item => String(item)));
}

// Auto font sizing: the font targets AUTO_FONT_FACTOR of the row height so
// text fills the bounds proportionally (cf. optionButton 0.5, comboBox 0.4).
const AUTO_FONT_FACTOR = 0.6;
// Floor for auto-sized text: below this, lists scroll instead of shrinking.
const MIN_AUTO_FONT_SIZE = 9;
// Vertical breathing room (total px) kept around the text inside each row.
const ROW_VERTICAL_PADDING = 8;

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
            "channels": [
                {
                    "id": "listBox",
                    "event": "valueChanged",
                    "range": { "defaultValue": 0, "increment": 1, "max": 2, "min": 0, "skew": 1 },
                    "type": "number"
                }
            ],
            "visible": true,
            "active": true,
            "automatable": true,
            "type": "listBox",
            "zIndex": 0,

            "persistence": {
                "preset": true,
                "session": true
            },

            "style": {
                "opacity": 1,
                "borderRadius": 2,
                "borderWidth": 1,
                "borderColor": "#222222",
                "backgroundColor": "#ffffff",
                "fontFamily": "Verdana",
                "fontSize": "auto",
                "fontColor": "#000000",
                "highlightColor": "#dddddd",
                "textAlign": "left"
            },

            "items": ["item1", "item2", "item3"],
            "populate": {
                "directories": [""],
                "fileType": "",
                "fullFileAndPath": false,
                "order": "date",
                "labelWhenEmpty": "No Files",
                "defaultLabel": ""
            }
        };

        this.vscode = null;
        this.widgetDiv = null;
        // Item currently highlighted in the UI. Single clicks move this without
        // notifying Csound, double clicks commit it to the channel.
        this.highlightIndex = -1;
        // Channel value and items the highlight was last resolved from. Used to
        // detect updates coming from the host (Csound, presets, automation).
        this.syncedValue = undefined;
        this.syncedItemsKey = undefined;
        // populate.defaultLabel acts as the initial selection until the user
        // picks an item (mirrors comboBox defaultLabelCleared behaviour).
        this.defaultLabelCleared = false;
        this.syncedDefaultLabel = undefined;

        // Wrap props with reactive proxy to unify visible/active handling
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.widgetDiv = widgetDiv;
        this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        this.widgetDiv = widgetDiv;
        widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
        widgetDiv.addEventListener("dblclick", this.pointerDoubleClick.bind(this));
        widgetDiv.ListBoxInstance = this;
    }

    pointerDown(evt) {
        evt.stopPropagation();

        if (!this.canInteract()) {
            return;
        }

        const index = this.getItemIndexFromEvent(evt);
        if (index < 0) {
            return;
        }

        // Highlight only - the channel value changes on double click
        this.highlightIndex = index;
        this.updateItemColours(evt.currentTarget);
    }

    pointerDoubleClick(evt) {
        evt.stopPropagation();

        if (!this.canInteract()) {
            return;
        }

        const index = this.getItemIndexFromEvent(evt);
        if (index < 0) {
            return;
        }

        const items = this.getItemsArray();
        const channel = this.props.channels[0];
        const channelType = (channel && channel.type) || "number";

        // An explicit user choice clears any populate.defaultLabel selection.
        this.defaultLabelCleared = true;
        this.highlightIndex = index;

        let valueToSend = index;
        if (channelType === "string") {
            valueToSend = items[index];
            channel.stringValue = valueToSend;
        }
        channel.range.value = index;
        this.syncedValue = channelType === "string" ? valueToSend : index;
        this.syncedItemsKey = itemsKeyOf(items);

        Cabbage.sendControlData({
            channel: CabbageUtils.getChannelId(this.props),
            value: valueToSend,
            gesture: "complete"
        }, this.vscode);

        CabbageUtils.updateInnerHTML(this.props, this);
    }

    canInteract() {
        if (!this.props.active || !this.props.visible) {
            return false;
        }
        // Selection and dragging are handled by the editor in design mode
        return getCabbageMode() !== 'draggable';
    }

    getItemIndexFromEvent(evt) {
        const itemElement = evt.target && evt.target.closest ? evt.target.closest('.list-item') : null;
        if (!itemElement || itemElement.dataset.index === undefined) {
            return -1;
        }
        const index = parseInt(itemElement.dataset.index, 10);
        return Number.isNaN(index) ? -1 : index;
    }

    updateItemColours(widgetDiv) {
        if (!widgetDiv || !widgetDiv.querySelectorAll) {
            return;
        }
        widgetDiv.querySelectorAll('.list-item').forEach((itemElement) => {
            const index = parseInt(itemElement.dataset.index, 10);
            itemElement.style.backgroundColor = index === this.highlightIndex
                ? this.props.style.highlightColor
                : this.props.style.backgroundColor;
        });
    }

    getItemsArray() {
        const items = this.props.items;
        // Mirror comboBox: an empty list still yields one blank row so
        // selection math (and range sync) always has a valid domain.
        if (Array.isArray(items)) {
            return items.length > 0 ? items : [''];
        }
        if (typeof items === 'string') {
            const parsed = items.split(",").map(item => item.trim()).filter(item => item !== '');
            return parsed.length > 0 ? parsed : [''];
        }
        return [''];
    }

    /**
     * Formats an item for display based on the populate fullFileAndPath
     * setting. Mirrors comboBox: unless fullFileAndPath is explicitly false,
     * the raw item (usually a full path from populate) is shown as-is.
     * Matching/selection always uses the raw item text.
     * @param {any} item
     * @returns {any}
     */
    getDisplayText(item) {
        const populate = this.props.populate;
        const fullPath = populate && populate.fullFileAndPath;
        if (fullPath === false) {
            const text = String(item);
            const lastSlash = Math.max(text.lastIndexOf('/'), text.lastIndexOf('\\'));
            const filename = lastSlash >= 0 ? text.substring(lastSlash + 1) : text;
            const lastDot = filename.lastIndexOf('.');
            return lastDot > 0 ? filename.substring(0, lastDot) : filename;
        }
        return item;
    }

    /**
     * Keeps the channel range in sync with the number of items so a value sent
     * on double click always lands inside the parameter's domain.
     */
    syncRangeToItems() {
        const channel = this.props.channels && this.props.channels[0];
        if (!channel || !channel.range) {
            return;
        }
        const itemCount = this.getItemsArray().length;
        if (itemCount === 0) {
            return;
        }

        const range = channel.range;
        range.min = 0;
        range.max = itemCount - 1;
        range.increment = 1;

        if (typeof range.defaultValue === 'number') {
            range.defaultValue = Math.min(Math.max(range.defaultValue, range.min), range.max);
        }
        if (typeof range.value === 'number') {
            range.value = Math.min(Math.max(range.value, range.min), range.max);
        }
    }

    /**
     * @returns {string|number|undefined} channel value the highlight derives from
     */
    getChannelValue() {
        const channel = this.props.channels && this.props.channels[0];
        if (!channel) {
            return undefined;
        }
        if ((channel.type || "number") === "string") {
            if (channel.stringValue !== undefined && channel.stringValue !== null && channel.stringValue !== '') {
                return channel.stringValue;
            }
        }
        const range = channel.range;
        if (range) {
            if (range.value !== undefined && range.value !== null) {
                return range.value;
            }
            return range.defaultValue;
        }
        return undefined;
    }

    resolveHighlightIndex(items, value) {
        if (value === undefined || value === null || value === '') {
            return -1;
        }

        let index = -1;
        if (typeof value === 'string') {
            index = items.indexOf(value);
            if (index === -1) {
                const asNumber = Number(value);
                index = Number.isFinite(asNumber) ? Math.round(asNumber) : -1;
            }
        } else if (typeof value === 'number' && Number.isFinite(value)) {
            index = Math.round(value);
        }

        return Math.max(-1, Math.min(items.length - 1, index));
    }

    /**
     * The channel value is the single source of truth for the highlight. Local
     * single clicks are preserved until the channel value or the items change.
     * An un-cleared populate.defaultLabel overrides as the initial selection
     * (mirrors comboBox), as does a restored string selection.
     * @param {string[]} items
     * @returns {number}
     */
    updateHighlight(items) {
        const channel = this.props.channels && this.props.channels[0];
        if (channel && (channel.type || "number") === "string" &&
            channel.stringValue !== undefined && channel.stringValue !== null && channel.stringValue !== '') {
            this.defaultLabelCleared = true;
        }

        const value = this.getChannelValue();
        const itemsKey = itemsKeyOf(items);
        const populate = this.props.populate;
        const rawDefault = populate && typeof populate.defaultLabel === 'string' ? populate.defaultLabel : '';
        const defaultLabel = !this.defaultLabelCleared ? rawDefault : '';

        if (!Object.is(value, this.syncedValue) || this.syncedItemsKey !== itemsKey ||
            this.syncedDefaultLabel !== (defaultLabel !== '' ? defaultLabel : null)) {
            this.highlightIndex = this.resolveHighlightIndex(items, value);
            if (defaultLabel !== '') {
                const defaultIndex = items.indexOf(defaultLabel);
                if (defaultIndex !== -1) {
                    this.highlightIndex = defaultIndex;
                }
            }
            this.syncedValue = value;
            this.syncedItemsKey = itemsKey;
            this.syncedDefaultLabel = defaultLabel !== '' ? defaultLabel : null;
        }

        return this.highlightIndex;
    }

    /**
     * Inner height available for rows (bounds minus container borders).
     * @returns {number}
     */
    getInnerHeight() {
        const height = (this.props.bounds && this.props.bounds.height) || 0;
        const border = Number(this.props.style && this.props.style.borderWidth) || 0;
        return Math.max(0, height - 2 * border);
    }

    /**
     * Resolves the font to a CSS value plus a numeric pixel size when the
     * value is computable. Explicit sizes keep today's behaviour exactly;
     * "auto" (and 0/empty, per house convention) targets AUTO_FONT_FACTOR of
     * the per-item row height so text fills the bounds proportionally.
     * @param {number} itemCount
     * @returns {{css: string, px: number|null}}
     */
    resolveFont(itemCount) {
        const fontSize = this.props.style.fontSize;
        if (fontSize !== "auto" && fontSize !== 0 && fontSize !== "0" && fontSize !== undefined && fontSize !== null && fontSize !== '') {
            if (/^[0-9.]+$/.test(String(fontSize))) {
                const px = parseFloat(String(fontSize));
                return { css: `${fontSize}px`, px: px };
            }
            // Non-px values (e.g. "1.2em") can't be measured cheaply: rows
            // fall back to content-driven heights (see getInnerHTML).
            return { css: String(fontSize), px: null };
        }
        const fitRowH = this.getInnerHeight() / Math.max(itemCount, 1);
        const px = Math.max(MIN_AUTO_FONT_SIZE, Math.round(fitRowH * AUTO_FONT_FACTOR));
        return { css: `${px}px`, px: px };
    }

    /**
     * Fixed row height so auto-sized text genuinely fits the bounds. Rows
     * share the inner height equally; when that would squeeze text below its
     * size (dense lists, explicit fonts), rows grow and the list scrolls.
     * @param {number} itemCount
     * @param {number|null} fontPx
     * @returns {number}
     */
    getRowHeight(itemCount, fontPx) {
        const fitRowH = this.getInnerHeight() / Math.max(itemCount, 1);
        if (fontPx === null || !(fontPx >= 0)) {
            return fitRowH;
        }
        return Math.max(fitRowH, fontPx + ROW_VERTICAL_PADDING);
    }

    getInnerHTML() {
        this.syncRangeToItems();

        const items = this.getItemsArray();
        const selectedIndex = this.updateHighlight(items);
        const style = this.props.style;
        const font = this.resolveFont(items.length);
        // Fixed row heights make the fit math hold in the browser regardless
        // of font metrics; line-height centering keeps single-line rows exact.
        // Unmeasurable fonts (non-px) keep the legacy content-driven rows.
        const rowH = this.getRowHeight(items.length, font.px);
        const rowGeometry = font.px === null
            ? `padding: 5px 6px;`
            : `height: ${rowH}px; line-height: ${rowH}px; padding: 0 6px;`;

        const listItemsHTML = items.map((item, index) => `
            <div class="list-item" data-index="${index}" style="
                width: 100%;
                box-sizing: border-box;
                ${rowGeometry}
                color: ${style.fontColor};
                background-color: ${index === selectedIndex ? style.highlightColor : style.backgroundColor};
                font-family: ${style.fontFamily};
                font-size: ${font.css};
                text-align: ${style.textAlign};
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                cursor: pointer;
                user-select: none;
                ">
                ${escapeHtml(this.getDisplayText(item))}
            </div>
        `).join('');

        return `
            <div class="listbox-container" style="
                position: relative;
                width: 100%;
                height: 100%;
                box-sizing: border-box;
                overflow-y: auto;
                border: ${style.borderWidth}px solid ${style.borderColor};
                border-radius: ${style.borderRadius}px;
                background-color: ${style.backgroundColor};
                opacity: ${style.opacity};
                display: ${this.props.visible ? 'block' : 'none'};
                pointer-events: ${this.props.visible && this.props.active ? 'auto' : 'none'};
                ">
                ${listItemsHTML}
            </div>
        `;
    }
}
