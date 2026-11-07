// Punch kit — checkbox.
// Overrides the built-in `checkBox` type with a native checkbox.

import { CabbageUtils } from "cabbage/utils.js";
import { handleRadioGroup } from "cabbage/radioGroup.js";
import {
    baseProps,
    ensureStyles,
    escapeHtml,
    getRange,
    getValue,
    isEditMode,
    sendValue,
    toggleColors,
} from "./punchKit.js";

const STYLES = `
.punch-checkbox-widget {
    --punch-accent: #8cc700;
    --punch-ink: #1f1f1f;
    --punch-surface: #f5f6f3;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    height: 100%;
    color: var(--punch-ink);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 12.5px;
    font-weight: 500;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
}
.punch-checkbox-widget input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: 0;
    opacity: 0;
}
.punch-checkbox-widget .punch-box {
    display: grid;
    place-items: center;
    width: 19px;
    height: 19px;
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--punch-surface, #f5f6f3), var(--punch-ink, #1f1f1f) 20%);
    border-radius: 6px;
    background: linear-gradient(145deg,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 60%, #ffffff) 0%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 85%, #000000) 100%);
    box-shadow:
        inset 0 1px 2px rgb(76 85 61 / 12%),
        0 1px 2px rgb(45 52 38 / 12%);
    transition: background 0.15s ease, border-color 0.15s ease;
}
.punch-checkbox-widget .punch-box::after {
    width: 9px;
    height: 5px;
    border: 2px solid #fff;
    border-top: 0;
    border-right: 0;
    transform: translateY(-1px) rotate(-45deg);
    opacity: 0;
    content: "";
    transition: opacity 0.12s ease;
}
.punch-checkbox-widget input:checked + .punch-box {
    background: var(--punch-accent);
    border-color: var(--punch-accent);
}
.punch-checkbox-widget input:checked + .punch-box::after {
    opacity: 1;
}
.punch-checkbox-widget input:focus-visible + .punch-box {
    outline: 2px solid #0b63a5;
    outline-offset: 2px;
}
.punch-checkbox-text {
    white-space: nowrap;
}
`;

export class PunchCheckbox {
    constructor() {
        this.props = {
            ...baseProps("checkBox", {
                bounds: { top: 10, left: 10, width: 170, height: 30 },
                channels: [{
                    id: "checkBox",
                    event: "valueChanged",
                    range: { defaultValue: 0, increment: 1, max: 1, min: 0, skew: 1 },
                }],
                label: { text: "On/Off" },
                radioGroup: -1,
                style: {
                    opacity: 1,
                    color: toggleColors(),
                },
            }),
            "type": "checkBox",
        };
        this.vscode = null;
        this.parameterIndex = 0;
        this.widgetDiv = null;
        this.hiddenProps = [
            'parameterIndex', 'children', 'currentCsdFile', 'value',
            'valueText',
            'label.align', 'label.offsetX', 'label.offsetY',
            'style.borderRadius', 'style.borderWidth', 'style.borderColor', 'style.backgroundColor',
            'style.fontFamily', 'style.fontSize', 'style.fontColor', 'style.textAlign',
            'style.on', 'style.off', 'style.hover', 'style.active',
            'style.thumb', 'style.track', 'style.shadow', 'style.label', 'style.valueText',
        ];
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    getInnerHTML() {
        ensureStyles("punch-checkbox-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const value = getValue(this.props, "click");
        const checked = Number(value) === Number(range.max);
        const color = this.props.style?.color || {};
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText
            ? `<span class="punch-checkbox-text">${escapeHtml(labelText)}</span>`
            : "";

        return `
            <label class="punch-checkbox-widget"
                   style="--punch-accent:${escapeHtml(color.accent || "#8cc700")}; --punch-ink:${escapeHtml(color.text || "#1f1f1f")}; --punch-surface:${escapeHtml(color.surface || "#f5f6f3")}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "inline-flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <input class="punch-checkbox-input" type="checkbox"${checked ? " checked" : ""}${this.props.active ? "" : " disabled"}>
                <span class="punch-box" aria-hidden="true"></span>
                ${label}
            </label>`;
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
            if (!this.props.active || isEditMode()) {
                return;
            }
            const input = event.target.closest(".punch-checkbox-input");
            if (!input) {
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

            const radioGroup = Number(this.props.radioGroup);
            const inRadioGroup = Number.isFinite(radioGroup) && radioGroup !== -1;
            if (inRadioGroup && !input.checked) {
                // Radio-style checkboxes stay selected once switched on.
                input.checked = true;
                return;
            }

            const next = input.checked ? range.max : range.min;
            channel.range.value = next;
            if (inRadioGroup && input.checked) {
                handleRadioGroup(radioGroup, CabbageUtils.getWidgetDivId(this.props));
            }
            sendValue(this, next, "complete");
        });
    }
}
