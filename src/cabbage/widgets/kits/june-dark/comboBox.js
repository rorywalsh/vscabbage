// June kit — combo box.
// Overrides the built-in `comboBox` type with a native select.
// Dynamic `populate` directories are not supported by this kit; use `items`.

import { CabbageUtils } from "cabbage/utils.js";
import {
    PALETTE,
    baseProps,
    comboColors,
    ensureStyles,
    escapeHtml,
    getRange,
    getValue,
    isEditMode,
    sendValue,
} from "./juneKit.js";

const STYLES = `
.june-combo-widget {
    --june-accent: #e0802c;
    --june-text: #d8d8d1;
    --june-muted: #8b8b84;
    --june-track: #1c1c1a;
    --june-surface: #3b3b37;
    box-sizing: border-box;
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.june-combo-widget .june-select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 100%;
    min-width: 96px;
    padding: 8px 34px 8px 12px;
    border: 1px solid color-mix(in srgb, var(--june-track) 60%, var(--june-accent) 18%);
    border-radius: 6px;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--june-surface) 82%, #ffffff) 0%,
        var(--june-surface) 55%,
        color-mix(in srgb, var(--june-surface) 72%, #000000) 100%);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 6%, transparent),
        inset 0 -2px 4px color-mix(in srgb, #000000 35%, transparent);
    color: var(--june-text);
    font: inherit;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .08em;
    text-transform: uppercase;
    cursor: pointer;
    outline: none;
}
.june-combo-widget .june-select option {
    background: var(--june-surface);
    color: var(--june-text);
}
.june-combo-widget .june-select:focus-visible {
    border-color: var(--june-accent);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 6%, transparent),
        0 0 0 2px color-mix(in srgb, var(--june-accent) 25%, transparent);
}
.june-combo-widget::after {
    position: absolute;
    right: 13px;
    top: 50%;
    width: 7px;
    height: 7px;
    border-right: 1.8px solid var(--june-accent);
    border-bottom: 1.8px solid var(--june-accent);
    transform: translateY(-72%) rotate(45deg);
    content: "";
    pointer-events: none;
}
`;

export class JuneComboBox {
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
        ensureStyles("june-combo-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const items = this.getItems();
        const selected = this.getSelectedIndex(items, range);
        const color = this.props.style?.color || PALETTE;
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
            <div class="june-combo-widget"
                 style="--june-accent:${escapeHtml(color.accent || PALETTE.accent)}; --june-text:${escapeHtml(color.text || PALETTE.text)}; --june-muted:${escapeHtml(color.muted || PALETTE.muted)}; --june-track:${escapeHtml(color.track || PALETTE.track)}; --june-surface:${escapeHtml(color.surface || PALETTE.surface)}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <select class="june-select" aria-label="${escapeHtml(labelText || "Combo box")}"${this.props.active ? "" : " disabled"}>
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
        if (widgetDiv.dataset.juneBound === "1") {
            return;
        }
        widgetDiv.dataset.juneBound = "1";
        this.widgetDiv = widgetDiv;

        widgetDiv.addEventListener("change", (event) => {
            if (!this.props.active || isEditMode()) {
                return;
            }
            const select = event.target.closest(".june-select");
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
