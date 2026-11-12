// Illum kit — button.
// Overrides the built-in `button` type with the Illum indicator-button look.

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
} from "./illumKit.js";

const STYLES = `
.illum-button-widget {
    --illum-accent: #7ce7ff;
    --illum-text: #e6edf7;
    --illum-muted: #8896aa;
    --illum-track: #263041;
    --illum-surface: #121722;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    width: 100%;
    height: 100%;
    color: var(--illum-text);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.illum-control-button {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 100%;
    min-height: 26px;
    padding: 0 10px;
    border: 1px solid color-mix(in srgb, var(--illum-track) 78%, var(--illum-accent) 12%);
    border-radius: 9px;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--illum-surface) 80%, #ffffff) 0%,
        var(--illum-surface) 55%,
        color-mix(in srgb, var(--illum-surface) 72%, #000000) 100%);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 9%, transparent),
        inset 0 -2px 5px color-mix(in srgb, #000000 32%, transparent),
        0 1px 2px color-mix(in srgb, #000000 45%, transparent),
        0 6px 12px -8px color-mix(in srgb, #000000 75%, transparent);
    color: var(--illum-text);
    font: inherit;
    cursor: pointer;
    overflow: hidden;
    outline: none;
}
.illum-control-button:hover {
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--illum-surface) 68%, #ffffff) 0%,
        color-mix(in srgb, var(--illum-surface) 86%, #ffffff) 55%,
        var(--illum-surface) 100%);
    border-color: color-mix(in srgb, var(--illum-accent) 32%, var(--illum-track) 68%);
}
.illum-control-button:active {
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--illum-surface) 82%, #000000) 0%,
        color-mix(in srgb, var(--illum-surface) 64%, #000000) 100%);
    box-shadow:
        inset 0 3px 7px color-mix(in srgb, #000000 55%, transparent),
        inset 0 0 0 1px color-mix(in srgb, var(--illum-accent) 10%, transparent);
}
.illum-control-button:focus-visible {
    outline: 2px solid var(--illum-accent);
    outline-offset: 2px;
}
.illum-control-button[aria-pressed="true"] {
    border-color: color-mix(in srgb, var(--illum-accent) 42%, var(--illum-track) 58%);
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--illum-surface) 74%, var(--illum-accent) 9%) 0%,
        var(--illum-surface) 58%,
        color-mix(in srgb, var(--illum-surface) 74%, #000000) 100%);
}
.illum-button-text {
    position: relative;
    min-width: 0;
    padding-bottom: 4px;
    overflow: hidden;
    color: var(--illum-text);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.illum-button-text::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 1px;
    background: color-mix(in srgb, var(--illum-track) 55%, var(--illum-text) 25%);
    content: "";
}
.illum-control-button[aria-pressed="true"] .illum-button-text {
    color: color-mix(in srgb, var(--illum-accent) 78%, var(--illum-text) 22%);
}
.illum-control-button[aria-pressed="true"] .illum-button-text::after {
    background: linear-gradient(90deg,
        color-mix(in srgb, var(--illum-accent) 70%, transparent),
        color-mix(in srgb, var(--illum-accent) 18%, transparent));
    box-shadow: 0 0 4px color-mix(in srgb, var(--illum-accent) 25%, transparent);
}
`;

export class IllumButton {
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
        ensureStyles("illum-button-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const value = getValue(this.props, "click");
        const isOn = Number(value) === Number(range.max);
        const color = this.props.style?.color || PALETTE;
        const labelText = this.labelText(isOn);
        const label = labelText.trim()
            ? `<span class="illum-button-text">${escapeHtml(labelText)}</span>`
            : "";

        return `
            <div class="illum-button-widget"
                 style="--illum-accent:${escapeHtml(color.accent || PALETTE.accent)}; --illum-text:${escapeHtml(color.text || PALETTE.text)}; --illum-muted:${escapeHtml(color.muted || PALETTE.muted)}; --illum-track:${escapeHtml(color.track || PALETTE.track)}; --illum-surface:${escapeHtml(color.surface || PALETTE.surface)}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <button type="button" class="illum-control-button"
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
        if (widgetDiv.dataset.illumBound === "1") {
            return;
        }
        widgetDiv.dataset.illumBound = "1";
        this.widgetDiv = widgetDiv;

        // A mouse click focuses the native button. Release that focus again so
        // the performance keyboard keeps receiving ASCII note keys. Keyboard
        // activation does not fire pointerup, so it keeps focus for a11y.
        widgetDiv.addEventListener("pointerup", () => {
            const button = widgetDiv.querySelector(".illum-control-button");
            if (button && typeof button.blur === "function") {
                button.blur();
            }
        });

        const latched = this.props.latched !== false;

        if (latched) {
            widgetDiv.addEventListener("click", (event) => {
                if (!this.props.active || isEditMode()
                    || !event.target.closest(".illum-control-button")) {
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
                updateInnerHTMLPreservingFocus(this, ".illum-control-button");
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
            updateInnerHTMLPreservingFocus(this, ".illum-control-button");
            sendValue(this, next, isDown ? "begin" : "end");
        };

        widgetDiv.addEventListener("pointerdown", (event) => {
            if (event.isPrimary && event.button === 0 && event.target.closest(".illum-control-button")) {
                setMomentary(true);
            }
        });
        widgetDiv.addEventListener("pointerup", (event) => {
            if (event.target.closest(".illum-control-button")) {
                setMomentary(false);
            }
        });
        widgetDiv.addEventListener("pointercancel", () => setMomentary(false));
        widgetDiv.addEventListener("pointerleave", () => setMomentary(false));

        const isMomentaryKey = (event) => event.key === " " || event.key === "Enter";

        widgetDiv.addEventListener("keydown", (event) => {
            if (event.repeat || !isMomentaryKey(event)
                || !event.target.closest(".illum-control-button")) {
                return;
            }
            event.preventDefault();
            setMomentary(true);
        });
        widgetDiv.addEventListener("keyup", (event) => {
            if (!isMomentaryKey(event)
                || !event.target.closest(".illum-control-button")) {
                return;
            }
            event.preventDefault();
            setMomentary(false);
        });
    }
}
