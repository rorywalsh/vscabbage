// Punch kit — combo box.
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
} from "./punchKit.js";

const STYLES = `
.punch-combo-widget {
    --punch-accent: #8cc700;
    --punch-ink: #1f1f1f;
    --punch-surface: #f0f1ed;
    box-sizing: border-box;
    position: relative;
    display: flex;
    align-items: center;
    width: 100%;
    height: 100%;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.punch-combo-widget .punch-select {
    appearance: none;
    -webkit-appearance: none;
    width: 100%;
    height: 100%;
    min-width: 96px;
    padding: 8px 34px 8px 12px;
    border: 1px solid color-mix(in srgb, var(--punch-surface, #f0f1ed), var(--punch-ink, #1f1f1f) 20%);
    border-radius: 9px;
    background: linear-gradient(180deg, color-mix(in srgb, var(--punch-surface, #f0f1ed) 55%, #ffffff) 0%, var(--punch-surface, #f0f1ed) 100%);
    box-shadow:
        inset 0 1px 2px rgb(76 85 61 / 8%),
        0 1px 2px rgb(45 52 38 / 10%);
    color: var(--punch-ink);
    font: inherit;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    outline: none;
}
.punch-combo-widget .punch-select:focus-visible {
    outline: none;
    border-color: color-mix(in srgb, var(--punch-accent, #8cc700), var(--punch-ink, #1f1f1f) 15%);
    box-shadow:
        inset 0 1px 2px rgb(76 85 61 / 8%),
        0 0 0 2px color-mix(in srgb, var(--punch-accent, #8cc700), transparent 75%);
}
.punch-combo-widget::after {
    position: absolute;
    right: 13px;
    top: 50%;
    width: 7px;
    height: 7px;
    border-right: 1.8px solid color-mix(in srgb, var(--punch-ink, #1f1f1f), transparent 30%);
    border-bottom: 1.8px solid color-mix(in srgb, var(--punch-ink, #1f1f1f), transparent 30%);
    transform: translateY(-72%) rotate(45deg);
    content: "";
    pointer-events: none;
}
`;

export class PunchComboBox {
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
        this.hiddenProps = [
            'parameterIndex', 'children', 'currentCsdFile', 'value',
            'populate', 'valueText',
            'label.align', 'label.offsetX', 'label.offsetY',
            'style.borderRadius', 'style.borderWidth', 'style.borderColor', 'style.backgroundColor',
            'style.fontFamily', 'style.fontSize', 'style.fontColor', 'style.textAlign',
            'style.thumb', 'style.track', 'style.shadow', 'style.label', 'style.valueText',
        ];
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    getItems() {
        if (Array.isArray(this.props.items) && this.props.items.length > 0) {
            return this.props.items;
        }
        const fallback = this.props.populate?.defaultLabel
            || this.props.populate?.labelWhenEmpty
            || "—";
        return [fallback];
    }

    getSelectedIndex(items, range) {
        const raw = this.props.channels?.[0]?.range?.value;
        if (typeof raw === "string") {
            const found = items.indexOf(raw);
            return found >= 0 ? found : 0;
        }
        const value = Number(raw);
        const index = Number.isFinite(value)
            ? (this.props.indexOffset ? value - 1 : value)
            : Number(range.defaultValue) || 0;
        return Math.max(0, Math.min(items.length - 1, Math.round(index)));
    }

    getInnerHTML() {
        ensureStyles("punch-combo-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const items = this.getItems();
        const selected = this.getSelectedIndex(items, range);
        const color = this.props.style?.color || {};
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const options = items.map((item, index) => {
            const text = String(item ?? "");
            return `<option value="${escapeHtml(text)}"${index === selected ? " selected" : ""}>${escapeHtml(text)}</option>`;
        }).join("");

        return `
            <div class="punch-combo-widget"
                 style="--punch-accent:${escapeHtml(color.accent || "#8cc700")}; --punch-ink:${escapeHtml(color.text || "#1f1f1f")}; --punch-surface:${escapeHtml(color.surface || "#f0f1ed")}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <select class="punch-select" aria-label="${escapeHtml(labelText || "Combo box")}">
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
        if (widgetDiv.dataset.punchBound === "1") {
            return;
        }
        widgetDiv.dataset.punchBound = "1";
        this.widgetDiv = widgetDiv;

        widgetDiv.addEventListener("change", (event) => {
            if (isEditMode()) {
                return;
            }
            const select = event.target.closest(".punch-select");
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

            const index = select.selectedIndex;
            const valueToSend = this.props.indexOffset ? index + 1 : index;
            channel.range.value = valueToSend;

            const channelType = channel.type || "number";
            if (channelType === "string") {
                channel.stringValue = select.value;
            }

            const messageValue = channelType === "string" ? select.value : valueToSend;
            sendValue(this, messageValue, "complete");
        });
    }
}
