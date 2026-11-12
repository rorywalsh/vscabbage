// June kit — button.
// Overrides the built-in `button` type with the June indicator-button look.

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
    updateInnerHTMLPreservingFocus,
} from "./juneKit.js";

const STYLES = `
.june-button-widget {
    --june-accent: #e0802c;
    --june-text: #d8d8d1;
    --june-muted: #8b8b84;
    --june-track: #1c1c1a;
    --june-surface: #3b3b37;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    width: 100%;
    height: 100%;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.june-control-button {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: 26px;
    padding: 0 10px;
    border: 1px solid color-mix(in srgb, var(--june-accent) 32%, var(--june-track) 68%);
    border-radius: 6px;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--june-surface) 82%, #ffffff) 0%,
        var(--june-surface) 55%,
        color-mix(in srgb, var(--june-surface) 72%, #000000) 100%);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 6%, transparent),
        inset 0 -2px 4px color-mix(in srgb, #000000 40%, transparent);
    color: var(--june-text);
    font: inherit;
    cursor: pointer;
    overflow: hidden;
    outline: none;
}
.june-control-button:hover {
    border-color: color-mix(in srgb, var(--june-accent) 60%, var(--june-track) 40%);
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--june-surface) 76%, #ffffff) 0%,
        color-mix(in srgb, var(--june-surface) 92%, #ffffff) 55%,
        var(--june-surface) 100%);
}
.june-control-button:active {
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--june-surface) 82%, #000000) 0%,
        color-mix(in srgb, var(--june-surface) 68%, #000000) 100%);
    box-shadow: inset 0 2px 5px color-mix(in srgb, #000000 50%, transparent);
}
.june-control-button:focus-visible {
    outline: 2px solid var(--june-accent);
    outline-offset: 2px;
}
.june-control-button[aria-pressed="true"] {
    border-color: var(--june-accent);
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--june-accent) 88%, #ffffff) 0%,
        var(--june-accent) 100%);
    box-shadow:
        0 0 0 1px color-mix(in srgb, var(--june-accent) 45%, transparent),
        0 0 10px color-mix(in srgb, var(--june-accent) 18%, transparent);
}
.june-button-text {
    min-width: 0;
    overflow: hidden;
    color: var(--june-text);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .1em;
    line-height: 1.1;
    text-overflow: ellipsis;
    text-transform: uppercase;
    white-space: nowrap;
}
.june-control-button[aria-pressed="true"] .june-button-text {
    color: var(--june-surface);
}
`;

export class JuneButton {
    constructor() {
        this.props = {
            ...baseProps("button", {
                bounds: { top: 10, left: 10, width: 90, height: 80 },
                channels: [{
                    id: "button",
                    event: "valueChanged",
                    range: { defaultValue: 0, increment: 1, max: 1, min: 0, skew: 1 },
                }],
                label: { text: "" },
                radioGroup: -1,
                latched: true,
                style: {
                    opacity: 1,
                    color: toggleColors(),
                },
            }),
            "type": "button",
        };
        this.vscode = null;
        this.parameterIndex = 0;
        this.widgetDiv = null;
        this.hiddenProps = [
            'parameterIndex', 'children', 'currentCsdFile', 'value',
            'svg', 'valueText',
            'label.align', 'label.offsetX', 'label.offsetY',
            'style.borderRadius', 'style.borderWidth', 'style.borderColor', 'style.backgroundColor',
            'style.fontFamily', 'style.fontSize', 'style.fontColor', 'style.textAlign',
            'style.on', 'style.off', 'style.hover', 'style.active',
            'style.thumb', 'style.track', 'style.shadow', 'style.label', 'style.valueText',
        ];
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    labelText(isOn) {
        const text = this.props.label?.text;
        if (typeof text === "string") {
            return text;
        }
        if (text && typeof text === "object") {
            return isOn ? (text.on || "") : (text.off || "");
        }
        return "";
    }

    getInnerHTML() {
        ensureStyles("june-button-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const value = getValue(this.props, "click");
        const isOn = Number(value) === Number(range.max);
        const color = this.props.style?.color || PALETTE;
        const labelText = this.labelText(isOn);
        const label = labelText.trim()
            ? `<span class="june-button-text">${escapeHtml(labelText)}</span>`
            : "";

        return `
            <div class="june-button-widget"
                 style="--june-accent:${escapeHtml(color.accent || PALETTE.accent)}; --june-text:${escapeHtml(color.text || PALETTE.text)}; --june-muted:${escapeHtml(color.muted || PALETTE.muted)}; --june-track:${escapeHtml(color.track || PALETTE.track)}; --june-surface:${escapeHtml(color.surface || PALETTE.surface)}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <button type="button" class="june-control-button"
                        aria-pressed="${isOn ? "true" : "false"}"
                        aria-disabled="${this.props.active ? "false" : "true"}"
                        ${this.props.active ? "" : "disabled"}
                        aria-label="${escapeHtml(labelText || "Button")}">
                    ${label}
                </button>
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

        // A mouse click focuses the native button. Release that focus again so
        // the performance keyboard keeps receiving ASCII note keys. Keyboard
        // activation does not fire pointerup, so it keeps focus for a11y.
        widgetDiv.addEventListener("pointerup", () => {
            const button = widgetDiv.querySelector(".june-control-button");
            if (button && typeof button.blur === "function") {
                button.blur();
            }
        });

        const latched = this.props.latched !== false;

        if (latched) {
            widgetDiv.addEventListener("click", (event) => {
                if (!this.props.active || isEditMode()
                    || !event.target.closest(".june-control-button")) {
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

                const current = Number(channel.range.value ?? range.defaultValue);
                const radioGroup = Number(this.props.radioGroup);
                const inRadioGroup = Number.isFinite(radioGroup) && radioGroup !== -1;

                if (inRadioGroup && current === Number(range.max)) {
                    return;
                }

                const next = inRadioGroup ? range.max
                    : (current === Number(range.max) ? range.min : range.max);

                channel.range.value = next;
                if (inRadioGroup) {
                    handleRadioGroup(radioGroup, CabbageUtils.getWidgetDivId(this.props));
                }
                updateInnerHTMLPreservingFocus(this, ".june-control-button");
                sendValue(this, next, "complete");
            });
            return;
        }

        // Momentary button: on while pressed.
        const setMomentary = (isDown) => {
            if (!this.props.active || isEditMode()) {
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
            const next = isDown ? range.max : range.min;
            channel.range.value = next;
            updateInnerHTMLPreservingFocus(this, ".june-control-button");
            sendValue(this, next, isDown ? "begin" : "end");
        };

        widgetDiv.addEventListener("pointerdown", (event) => {
            if (event.isPrimary && event.button === 0 && event.target.closest(".june-control-button")) {
                setMomentary(true);
            }
        });
        widgetDiv.addEventListener("pointerup", (event) => {
            if (event.target.closest(".june-control-button")) {
                setMomentary(false);
            }
        });
        widgetDiv.addEventListener("pointercancel", () => setMomentary(false));
        widgetDiv.addEventListener("pointerleave", () => setMomentary(false));

        const isMomentaryKey = (event) => event.key === " " || event.key === "Enter";

        widgetDiv.addEventListener("keydown", (event) => {
            if (event.repeat || !isMomentaryKey(event)
                || !event.target.closest(".june-control-button")) {
                return;
            }
            event.preventDefault();
            setMomentary(true);
        });
        widgetDiv.addEventListener("keyup", (event) => {
            if (!isMomentaryKey(event)
                || !event.target.closest(".june-control-button")) {
                return;
            }
            event.preventDefault();
            setMomentary(false);
        });
    }
}
