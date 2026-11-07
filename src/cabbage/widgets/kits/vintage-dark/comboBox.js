// Vintage kit — combo box.
// Overrides the built-in `comboBox` type with a native select.
// Dynamic `populate` directories are not supported by this kit; use `items`.

import { CabbageUtils } from "cabbage/utils.js";
import {
    baseProps,
    comboColors,
    ensureStyles,
    escapeHtml,
    getRange,
    getValue,
    isEditMode,
    sendValue,
} from "./vintageKit.js";

const STYLES = `
.vintage-combo-widget {
    --vintage-accent: #c47a2c;
    --vintage-ink: #2f2a24;
    --vintage-muted: #6b6258;
    --vintage-track: #4a443c;
    --vintage-surface: #d9d2c6;
    box-sizing: border-box;
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    padding: 3px;
    border-radius: 8px;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--vintage-surface) 60%, #fff) 0%,
        color-mix(in srgb, var(--vintage-surface) 55%, #000) 100%);
    box-shadow:
        0 2px 4px rgba(0, 0, 0, .45),
        inset 0 1px 1px rgba(255, 255, 255, .5);
    font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
}
.vintage-combo-widget .vintage-select {
    appearance: none;
    -webkit-appearance: none;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    min-width: 96px;
    padding: 0 30px 0 10px;
    border: 2px solid color-mix(in srgb, var(--vintage-track) 55%, #000);
    border-radius: 5px;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--vintage-track) 60%, #000) 0%,
        color-mix(in srgb, var(--vintage-track) 80%, #fff) 100%);
    box-shadow:
        inset 0 3px 5px rgba(0, 0, 0, .7),
        inset 0 -1px 0 rgba(255, 255, 255, .25);
    color: var(--vintage-accent);
    font: inherit;
    font-family: "Courier New", monospace;
    font-size: 11.5px;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0;
    text-shadow: 0 0 4px color-mix(in srgb, var(--vintage-accent), transparent 50%);
    cursor: pointer;
    outline: none;
}
.vintage-combo-widget .vintage-select:focus-visible {
    outline: none;
    border-color: var(--vintage-accent);
    box-shadow:
        inset 0 3px 5px rgba(0, 0, 0, .7),
        0 0 0 2px color-mix(in srgb, var(--vintage-accent), transparent 65%);
}
.vintage-combo-widget::after {
    position: absolute;
    right: 15px;
    top: 50%;
    width: 8px;
    height: 8px;
    border-right: 2px solid var(--vintage-accent);
    border-bottom: 2px solid var(--vintage-accent);
    transform: translateY(-72%) rotate(45deg);
    content: "";
    pointer-events: none;
    filter: drop-shadow(0 0 2px var(--vintage-accent));
}
`;

export class VintageComboBox {
    constructor() {
        this.props = {
            ...baseProps("comboBox", {
                bounds: { top: 10, left: 10, width: 160, height: 36 },
                channels: [{
                    id: "comboBox",
                    event: "valueChanged",
                    range: { defaultValue: 0, increment: 1, max: 3, min: 0, skew: 1 },
                    type: "number",
                }],
                items: ["Tape", "Tube", "Diode", "Fuzz"],
                indexOffset: false,
                style: {
                    opacity: 1,
                    color: comboColors(),
                },
            }),
            "type": "comboBox",
        };
        this.vscode = null;
        this.parameterIndex = 0;
        this.widgetDiv = null;
        this.defaultLabelCleared = false;
        this.hiddenProps = [
            'parameterIndex', 'children', 'currentCsdFile', 'value',
            'valueText',
            'label.align', 'label.offsetX', 'label.offsetY',
            'style.borderRadius', 'style.borderWidth', 'style.borderColor', 'style.backgroundColor',
            'style.fontFamily', 'style.fontSize', 'style.fontColor', 'style.textAlign',
            'style.thumb', 'style.track', 'style.shadow', 'style.label', 'style.valueText',
        ];
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    getItems() {
        if (typeof this.props.items === "string") {
            return this.props.items.split(",").map((item) => item.trim()).filter(Boolean);
        }
        if (Array.isArray(this.props.items) && this.props.items.length > 0) {
            return this.props.items;
        }
        const fallback = this.props.populate?.defaultLabel
            || this.props.populate?.labelWhenEmpty
            || "—";
        return [fallback];
    }

    getDisplayText(item) {
        const text = String(item ?? "");
        if (this.props.populate?.fullFileAndPath === false) {
            const lastSlash = Math.max(text.lastIndexOf("/"), text.lastIndexOf("\\"));
            const filename = lastSlash >= 0 ? text.substring(lastSlash + 1) : text;
            const lastDot = filename.lastIndexOf(".");
            return lastDot > 0 ? filename.substring(0, lastDot) : filename;
        }
        return text;
    }

    getSelectedIndex(items, range) {
        const channel = this.props.channels?.[0];
        const savedStringValue = channel?.stringValue;
        if (channel?.type === "string" && savedStringValue) {
            const found = items.findIndex((item) => String(item) === String(savedStringValue));
            if (found >= 0) {
                return found;
            }
        }

        const raw = channel?.range?.value;
        if (typeof raw === "string") {
            const found = items.findIndex((item) => String(item) === raw);
            return found >= 0 ? found : 0;
        }
        const value = Number(raw);
        const index = Number.isFinite(value)
            ? (this.props.indexOffset ? value - 1 : value)
            : Number(range.defaultValue) || 0;
        return Math.max(0, Math.min(items.length - 1, Math.round(index)));
    }

    getInnerHTML() {
        ensureStyles("vintage-combo-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const items = this.getItems();
        const selected = this.getSelectedIndex(items, range);
        const color = this.props.style?.color || {};
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const showDefaultLabel = !!(this.props.populate?.defaultLabel && !this.defaultLabelCleared);
        const options = (showDefaultLabel
            ? [`<option value="" selected>${escapeHtml(this.props.populate.defaultLabel)}</option>`]
            : []).concat(items.map((item, index) => {
                const text = String(item ?? "");
                const display = this.getDisplayText(item);
                const isSelected = !showDefaultLabel && index === selected;
                return `<option value="${escapeHtml(text)}"${isSelected ? " selected" : ""}>${escapeHtml(display)}</option>`;
            })).join("");

        return `
            <div class="vintage-combo-widget"
                 style="--vintage-accent:${escapeHtml(color.accent || "#c47a2c")}; --vintage-ink:${escapeHtml(color.text || "#2f2a24")}; --vintage-surface:${escapeHtml(color.surface || "#d9d2c6")}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <select class="vintage-select" aria-label="${escapeHtml(labelText || "Combo box")}"${this.props.active ? "" : " disabled"}>
                    ${options}
                </select>
            </div>`;
    }

    addVsCodeEventListeners(widgetDiv, vscode) {
        this.vscode = vscode;
        this.widgetDiv = widgetDiv;
        this.widgetDiv.style.pointerEvents = this.props.active ? "auto" : "none";
        this.addEventListeners(widgetDiv);
    }

    addEventListeners(widgetDiv) {
        if (widgetDiv.dataset.vintageBound === "1") {
            return;
        }
        widgetDiv.dataset.vintageBound = "1";
        this.widgetDiv = widgetDiv;

        widgetDiv.addEventListener("change", (event) => {
            if (!this.props.active || isEditMode()) {
                return;
            }
            const select = event.target.closest(".vintage-select");
            if (!select) {
                return;
            }

            const range = getRange(this.props, 0, "click");
            const channel = this.props.channels?.[0];
            if (!channel) {
                return;
            }
            if (!channel.range) {
                channel.range = range;
            }

            const showDefaultLabel = !!(this.props.populate?.defaultLabel && !this.defaultLabelCleared);
            const itemIndex = select.selectedIndex - (showDefaultLabel ? 1 : 0);
            if (itemIndex < 0) {
                return;
            }
            this.defaultLabelCleared = true;

            const valueToSend = this.props.indexOffset ? itemIndex + 1 : itemIndex;
            channel.range.value = valueToSend;

            const channelType = channel.type || "number";
            if (channelType === "string") {
                channel.stringValue = select.value;
            }

            const messageValue = channelType === "string" ? select.value : valueToSend;
            sendValue(this, messageValue, "complete");
            CabbageUtils.updateInnerHTML(this.props, this);
        });
    }
}
