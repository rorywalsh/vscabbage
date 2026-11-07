// Vintage kit — checkbox.
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
} from "./vintageKit.js";

const STYLES = `
.vintage-checkbox-widget {
    --vintage-accent: #c47a2c;
    --vintage-ink: #2f2a24;
    --vintage-muted: #6b6258;
    --vintage-track: #4a443c;
    --vintage-surface: #d9d2c6;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    height: 100%;
    color: var(--vintage-ink);
    font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
    font-size: 12.5px;
    font-weight: 700;
    letter-spacing: .02em;
    text-shadow: 0 1px 1px rgba(0, 0, 0, .35);
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
}
.vintage-checkbox-widget input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: 0;
    opacity: 0;
}
.vintage-checkbox-widget .vintage-box {
    display: grid;
    place-items: center;
    width: 20px;
    height: 20px;
    flex: 0 0 auto;
    border: 2px solid color-mix(in srgb, var(--vintage-surface) 45%, #000);
    border-radius: 4px;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--vintage-track) 60%, #000) 0%,
        color-mix(in srgb, var(--vintage-track) 85%, #fff) 100%);
    box-shadow:
        inset 0 2px 4px rgba(0, 0, 0, .75),
        0 1px 0 rgba(255, 255, 255, .35);
    transition: background 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
}
.vintage-checkbox-widget .vintage-box::after {
    width: 9px;
    height: 5px;
    border: 2px solid #fff;
    border-top: 0;
    border-right: 0;
    transform: translateY(-1px) rotate(-45deg);
    opacity: 0;
    content: "";
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, .6));
    transition: opacity 0.12s ease;
}
.vintage-checkbox-widget input:checked + .vintage-box {
    border-color: color-mix(in srgb, var(--vintage-accent) 60%, #000);
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--vintage-accent) 65%, #000) 0%,
        var(--vintage-accent) 100%);
    box-shadow:
        inset 0 2px 4px rgba(0, 0, 0, .5),
        0 0 7px color-mix(in srgb, var(--vintage-accent), transparent 45%);
}
.vintage-checkbox-widget input:checked + .vintage-box::after {
    opacity: 1;
}
.vintage-checkbox-widget input:focus-visible + .vintage-box {
    outline: 2px solid var(--vintage-accent);
    outline-offset: 2px;
}
.vintage-checkbox-text {
    white-space: nowrap;
}
`;

export class VintageCheckbox {
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
        ensureStyles("vintage-checkbox-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const value = getValue(this.props, "click");
        const checked = Number(value) === Number(range.max);
        const color = this.props.style?.color || {};
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText
            ? `<span class="vintage-checkbox-text">${escapeHtml(labelText)}</span>`
            : "";

        return `
            <label class="vintage-checkbox-widget"
                   style="--vintage-accent:${escapeHtml(color.accent || "#c47a2c")}; --vintage-ink:${escapeHtml(color.text || "#2f2a24")}; --vintage-surface:${escapeHtml(color.surface || "#d9d2c6")}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "inline-flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <input class="vintage-checkbox-input" type="checkbox"${checked ? " checked" : ""}${this.props.active ? "" : " disabled"}>
                <span class="vintage-box" aria-hidden="true"></span>
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
        if (widgetDiv.dataset.vintageBound === "1") {
            return;
        }
        widgetDiv.dataset.vintageBound = "1";
        this.widgetDiv = widgetDiv;

        widgetDiv.addEventListener("change", (event) => {
            if (!this.props.active || isEditMode()) {
                return;
            }
            const input = event.target.closest(".vintage-checkbox-input");
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
