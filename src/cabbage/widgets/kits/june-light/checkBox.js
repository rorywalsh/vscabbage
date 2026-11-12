// June kit — checkbox.
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
} from "./juneKit.js";

const STYLES = `
.june-checkbox-widget {
    --june-accent: #94D200;
    --june-text: #d8d8d1;
    --june-muted: #8b8b84;
    --june-track: #1c1c1a;
    --june-surface: #3b3b37;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    gap: 9px;
    width: 100%;
    height: 100%;
    color: var(--june-text);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .1em;
    text-transform: uppercase;
    cursor: pointer;
    user-select: none;
    -webkit-user-select: none;
}
.june-checkbox-widget input {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: 0;
    opacity: 0;
}
.june-checkbox-widget .june-box {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--june-track) 60%, var(--june-accent) 20%);
    border-radius: 4px;
    background: linear-gradient(145deg,
        color-mix(in srgb, var(--june-surface) 82%, #ffffff) 0%,
        var(--june-surface) 60%,
        color-mix(in srgb, var(--june-surface) 72%, #000000) 100%);
    box-shadow:
        inset 0 1px 2px color-mix(in srgb, #000000 35%, transparent),
        0 1px 0 color-mix(in srgb, #ffffff 4%, transparent);
    transition: background .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.june-checkbox-widget .june-box::after {
    width: 8px;
    height: 4px;
    border: 2px solid var(--june-surface);
    border-top: 0;
    border-right: 0;
    transform: translateY(-1px) rotate(-45deg);
    opacity: 0;
    content: "";
    transition: opacity .12s ease;
}
.june-checkbox-widget input:checked + .june-box {
    background: var(--june-accent);
    border-color: var(--june-accent);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 30%, transparent),
        0 0 8px color-mix(in srgb, var(--june-accent) 30%, transparent);
}
.june-checkbox-widget input:checked + .june-box::after {
    opacity: 1;
}
.june-checkbox-widget input:focus-visible + .june-box {
    outline: 2px solid var(--june-accent);
    outline-offset: 2px;
}
.june-checkbox-text {
    color: var(--june-text);
    white-space: nowrap;
}
`;

export class JuneCheckbox {
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
        ensureStyles("june-checkbox-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const value = getValue(this.props, "click");
        const checked = Number(value) === Number(range.max);
        const color = this.props.style?.color || PALETTE;
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText
            ? `<span class="june-checkbox-text">${escapeHtml(labelText)}</span>`
            : "";

        return `
            <label class="june-checkbox-widget"
                   style="--june-accent:${escapeHtml(color.accent || PALETTE.accent)}; --june-text:${escapeHtml(color.text || PALETTE.text)}; --june-muted:${escapeHtml(color.muted || PALETTE.muted)}; --june-track:${escapeHtml(color.track || PALETTE.track)}; --june-surface:${escapeHtml(color.surface || PALETTE.surface)}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "inline-flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <input class="june-checkbox-input" type="checkbox"${checked ? " checked" : ""}${this.props.active ? "" : " disabled"}>
                <span class="june-box" aria-hidden="true"></span>
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
        if (widgetDiv.dataset.juneBound === "1") {
            return;
        }
        widgetDiv.dataset.juneBound = "1";
        this.widgetDiv = widgetDiv;

        // Release the focus the hidden native checkbox gains on mouse click.
        // Keyboard activation keeps focus so Space can still toggle it.
        widgetDiv.addEventListener("pointerup", () => {
            const input = widgetDiv.querySelector(".june-checkbox-input");
            if (input && typeof input.blur === "function") {
                input.blur();
            }
        });

        widgetDiv.addEventListener("change", (event) => {
            if (!this.props.active || isEditMode()) {
                return;
            }
            const input = event.target.closest(".june-checkbox-input");
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
