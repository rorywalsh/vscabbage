// Vintage kit — button.
// Overrides the built-in `button` type with the Vintage indicator-button look.

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
    updateInnerHTMLPreservingFocus,
} from "./vintageKit.js";

const STYLES = `
.vintage-button-widget {
    --vintage-accent: #c47a2c;
    --vintage-ink: #2f2a24;
    --vintage-muted: #6b6258;
    --vintage-track: #4a443c;
    --vintage-surface: #d9d2c6;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    width: 100%;
    height: 100%;
    color: var(--vintage-ink);
    font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.vintage-control-button {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 100%;
    min-height: 28px;
    padding: 0 10px;
    border: 4px solid color-mix(in srgb, var(--vintage-surface) 45%, #000);
    border-radius: 8px;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--vintage-surface) 60%, #fff) 0%,
        var(--vintage-surface) 45%,
        color-mix(in srgb, var(--vintage-surface) 55%, #000) 100%);
    box-shadow:
        inset 0 2px 2px rgba(255, 255, 255, .65),
        inset 0 -3px 5px rgba(0, 0, 0, .35),
        0 4px 0 color-mix(in srgb, var(--vintage-surface) 40%, #000),
        0 6px 9px rgba(0, 0, 0, .5);
    color: var(--vintage-ink);
    font: inherit;
    cursor: pointer;
    overflow: hidden;
    outline: none;
    transition: transform 80ms ease, box-shadow 80ms ease;
}
.vintage-control-button:hover {
    filter: brightness(1.05);
}
.vintage-control-button:active {
    transform: translateY(3px);
    box-shadow:
        inset 0 3px 6px rgba(0, 0, 0, .45),
        0 1px 0 color-mix(in srgb, var(--vintage-surface) 40%, #000),
        0 2px 4px rgba(0, 0, 0, .4);
}
.vintage-control-button:focus-visible {
    outline: 2px solid var(--vintage-accent);
    outline-offset: 3px;
}
.vintage-button-indicator {
    width: 10px;
    height: 10px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%,
        #fff 0%,
        color-mix(in srgb, var(--vintage-accent) 40%, #777) 55%,
        #2a2a2a 100%);
    box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, .7),
        0 1px 2px rgba(0, 0, 0, .6);
    transition: background 0.15s ease, box-shadow 0.15s ease;
}
.vintage-control-button[aria-pressed="true"] .vintage-button-indicator {
    background: radial-gradient(circle at 35% 30%,
        #fff 0%,
        var(--vintage-accent) 50%,
        color-mix(in srgb, var(--vintage-accent) 55%, #000) 100%);
    box-shadow:
        0 0 6px var(--vintage-accent),
        0 0 12px color-mix(in srgb, var(--vintage-accent), transparent 35%),
        inset 0 1px 1px rgba(255, 255, 255, .8);
}
.vintage-button-text {
    min-width: 0;
    overflow: hidden;
    color: var(--vintage-ink);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .06em;
    line-height: 1.1;
    text-overflow: ellipsis;
    text-shadow: 0 1px 1px rgba(0, 0, 0, .35);
    text-transform: uppercase;
    white-space: nowrap;
}
.vintage-control-button[aria-pressed="true"] .vintage-button-text {
    color: color-mix(in srgb, var(--vintage-accent) 65%, var(--vintage-ink) 35%);
}
`;

export class VintageButton {
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
        ensureStyles("vintage-button-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const value = getValue(this.props, "click");
        const isOn = Number(value) === Number(range.max);
        const color = this.props.style?.color || {};
        const labelText = this.labelText(isOn);
        const label = labelText
            ? `<span class="vintage-button-text">${escapeHtml(labelText)}</span>`
            : "";

        return `
            <div class="vintage-button-widget"
                 style="--vintage-accent:${escapeHtml(color.accent || "#c47a2c")}; --vintage-ink:${escapeHtml(color.text || "#2f2a24")}; --vintage-surface:${escapeHtml(color.surface || "#d9d2c6")}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <button type="button" class="vintage-control-button"
                        aria-pressed="${isOn ? "true" : "false"}"
                        aria-disabled="${this.props.active ? "false" : "true"}"
                        ${this.props.active ? "" : "disabled"}
                        aria-label="${escapeHtml(labelText || "Button")}">
                    <span class="vintage-button-indicator" aria-hidden="true"></span>
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
        if (widgetDiv.dataset.vintageBound === "1") {
            return;
        }
        widgetDiv.dataset.vintageBound = "1";
        this.widgetDiv = widgetDiv;

        // A mouse click focuses the native button. Release that focus again so
        // the performance keyboard keeps receiving ASCII note keys. Keyboard
        // activation does not fire pointerup, so it keeps focus for a11y.
        widgetDiv.addEventListener("pointerup", () => {
            const button = widgetDiv.querySelector(".vintage-control-button");
            if (button && typeof button.blur === "function") {
                button.blur();
            }
        });

        const latched = this.props.latched !== false;

        if (latched) {
            widgetDiv.addEventListener("click", (event) => {
                if (!this.props.active || isEditMode()
                    || !event.target.closest(".vintage-control-button")) {
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
                updateInnerHTMLPreservingFocus(this, ".vintage-control-button");
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
            updateInnerHTMLPreservingFocus(this, ".vintage-control-button");
            sendValue(this, next, isDown ? "begin" : "end");
        };

        widgetDiv.addEventListener("pointerdown", (event) => {
            if (event.isPrimary && event.button === 0 && event.target.closest(".vintage-control-button")) {
                setMomentary(true);
            }
        });
        widgetDiv.addEventListener("pointerup", (event) => {
            if (event.target.closest(".vintage-control-button")) {
                setMomentary(false);
            }
        });
        widgetDiv.addEventListener("pointercancel", () => setMomentary(false));
        widgetDiv.addEventListener("pointerleave", () => setMomentary(false));

        const isMomentaryKey = (event) => event.key === " " || event.key === "Enter";

        widgetDiv.addEventListener("keydown", (event) => {
            if (event.repeat || !isMomentaryKey(event)
                || !event.target.closest(".vintage-control-button")) {
                return;
            }
            event.preventDefault();
            setMomentary(true);
        });
        widgetDiv.addEventListener("keyup", (event) => {
            if (!isMomentaryKey(event)
                || !event.target.closest(".vintage-control-button")) {
                return;
            }
            event.preventDefault();
            setMomentary(false);
        });
    }
}
