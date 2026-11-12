// Illum kit — checkbox.
// Overrides the built-in `checkBox` type with a native checkbox.

import { CabbageUtils } from "cabbage/utils.js";
import { handleRadioGroup } from "cabbage/radioGroup.js";
import {
    PALETTE,
    baseProps,
    ensureStyles,
    escapeHtml,
    getRange,
    getValue,
    isEditMode,
    sendValue,
    toggleColors,
} from "./illumKit.js";

const STYLES = `
.illum-checkbox-widget {
    --illum-accent: #7ce7ff;
    --illum-text: #e6edf7;
    --illum-muted: #8896aa;
    --illum-track: #263041;
    --illum-surface: #121722;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    height: 100%;
    color: var(--illum-text);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: .06em;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
}
.illum-checkbox-widget input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: 0;
    opacity: 0;
}
.illum-checkbox-widget .illum-box {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--illum-track) 76%, var(--illum-accent) 14%);
    border-radius: 5px;
    background: linear-gradient(145deg,
        color-mix(in srgb, var(--illum-surface) 80%, #ffffff) 0%,
        var(--illum-surface) 58%,
        color-mix(in srgb, var(--illum-surface) 70%, #000000) 100%);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 8%, transparent),
        inset 0 -2px 4px color-mix(in srgb, #000000 35%, transparent);
    transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.illum-checkbox-widget .illum-box::after {
    width: 8px;
    height: 4px;
    border: 2px solid var(--illum-surface);
    border-top: 0;
    border-right: 0;
    transform: translateY(-1px) rotate(-45deg);
    opacity: 0;
    content: "";
    transition: opacity .12s ease;
}
.illum-checkbox-widget input:checked + .illum-box {
    background: var(--illum-accent);
    border-color: var(--illum-accent);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 45%, transparent),
        0 0 8px color-mix(in srgb, var(--illum-accent) 42%, transparent);
}
.illum-checkbox-widget input:checked + .illum-box::after {
    opacity: 1;
}
.illum-checkbox-widget input:focus-visible + .illum-box {
    outline: 2px solid var(--illum-accent);
    outline-offset: 2px;
}
.illum-checkbox-text {
    white-space: nowrap;
}
`;

export class IllumCheckbox {
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
        ensureStyles("illum-checkbox-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const value = getValue(this.props, "click");
        const checked = Number(value) === Number(range.max);
        const color = this.props.style?.color || PALETTE;
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText
            ? `<span class="illum-checkbox-text">${escapeHtml(labelText)}</span>`
            : "";

        return `
            <label class="illum-checkbox-widget"
                   style="--illum-accent:${escapeHtml(color.accent || PALETTE.accent)}; --illum-text:${escapeHtml(color.text || PALETTE.text)}; --illum-muted:${escapeHtml(color.muted || PALETTE.muted)}; --illum-track:${escapeHtml(color.track || PALETTE.track)}; --illum-surface:${escapeHtml(color.surface || PALETTE.surface)}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "inline-flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <input class="illum-checkbox-input" type="checkbox"${checked ? " checked" : ""}${this.props.active ? "" : " disabled"}>
                <span class="illum-box" aria-hidden="true"></span>
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
        if (widgetDiv.dataset.illumBound === "1") {
            return;
        }
        widgetDiv.dataset.illumBound = "1";
        this.widgetDiv = widgetDiv;

        // Release the focus the hidden native checkbox gains on mouse click.
        // Keyboard activation keeps focus so Space can still toggle it.
        widgetDiv.addEventListener("pointerup", () => {
            const input = widgetDiv.querySelector(".illum-checkbox-input");
            if (input && typeof input.blur === "function") {
                input.blur();
            }
        });

        widgetDiv.addEventListener("change", (event) => {
            if (!this.props.active || isEditMode()) {
                return;
            }
            const input = event.target.closest(".illum-checkbox-input");
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
