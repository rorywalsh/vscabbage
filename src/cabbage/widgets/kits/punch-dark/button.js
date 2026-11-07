// Punch kit — button.
// Overrides the built-in `button` type with the Punch indicator-button look.

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
} from "./punchKit.js";

const STYLES = `
.punch-button-widget {
    --punch-accent: #8cc700;
    --punch-ink: #1f1f1f;
    --punch-surface: #f5f6f3;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    width: 100%;
    height: 100%;
    color: var(--punch-ink);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.punch-control-button {
    position: relative;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    height: 100%;
    min-height: 26px;
    padding: 0 8px;
    border: 3px solid color-mix(in srgb, var(--punch-surface, #f5f6f3), var(--punch-ink, #1f1f1f) 18%);
    border-radius: 10px;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 60%, #ffffff) 0%,
        var(--punch-surface, #f5f6f3) 52%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 55%, #000000) 100%);
    box-shadow:
        inset 0 1px 2px rgb(255 255 255 / 90%),
        inset 0 2px 5px rgb(76 85 61 / 10%),
        inset 0 -3px 5px rgb(76 85 61 / 12%),
        0 0 0 1px rgb(255 255 255 / 80%),
        0 2px 3px rgb(45 52 38 / 15%),
        0 7px 11px rgb(45 52 38 / 20%);
    color: var(--punch-ink);
    font: inherit;
    cursor: pointer;
    overflow: hidden;
    outline: none;
}
.punch-control-button:hover {
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 55%, #ffffff) 0%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 75%, #ffffff) 52%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 65%, #000000) 100%);
    color: var(--punch-ink);
}
.punch-control-button:active {
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 85%, #000000) 0%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 75%, #000000) 60%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 55%, #000000) 100%);
    box-shadow:
        inset 0 3px 7px rgb(45 52 38 / 25%),
        0 0 0 1px rgb(255 255 255 / 80%);
}
.punch-control-button:focus-visible {
    outline: 2px solid #0b63a5;
    outline-offset: 3px;
}
.punch-button-indicator {
    width: 8px;
    height: 8px;
    flex: 0 0 auto;
    border-radius: 50%;
    background: color-mix(in srgb, var(--punch-accent) 45%, #b9c1ab);
    box-shadow: 0 0 4px color-mix(in srgb, var(--punch-accent), transparent 70%);
    transition: background 0.15s ease, box-shadow 0.15s ease;
}
.punch-control-button[aria-pressed="true"] .punch-button-indicator {
    background: var(--punch-accent);
    box-shadow:
        0 0 5px var(--punch-accent),
        0 0 9px color-mix(in srgb, var(--punch-accent), transparent 35%);
}
.punch-button-text {
    min-width: 0;
    overflow: hidden;
    color: var(--punch-ink);
    font-size: 12px;
    font-weight: 600;
    line-height: 1.1;
    text-overflow: ellipsis;
    white-space: nowrap;
}
.punch-control-button[aria-pressed="true"] .punch-button-text {
    color: color-mix(in srgb, var(--punch-accent, #8cc700) 70%, var(--punch-ink, #1f1f1f) 30%);
}
`;

export class PunchButton {
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
        ensureStyles("punch-button-styles", STYLES);

        const range = getRange(this.props, 0, "click");
        const value = getValue(this.props, "click");
        const isOn = Number(value) === Number(range.max);
        const color = this.props.style?.color || {};
        const labelText = this.labelText(isOn);
        const label = labelText
            ? `<span class="punch-button-text">${escapeHtml(labelText)}</span>`
            : "";

        return `
            <div class="punch-button-widget"
                 style="--punch-accent:${escapeHtml(color.accent || "#8cc700")}; --punch-ink:${escapeHtml(color.text || "#1f1f1f")}; --punch-surface:${escapeHtml(color.surface || "#f5f6f3")}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <button type="button" class="punch-control-button"
                        aria-pressed="${isOn ? "true" : "false"}"
                        aria-disabled="${this.props.active ? "false" : "true"}"
                        ${this.props.active ? "" : "disabled"}
                        aria-label="${escapeHtml(labelText || "Button")}">
                    <span class="punch-button-indicator" aria-hidden="true"></span>
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
        if (widgetDiv.dataset.punchBound === "1") {
            return;
        }
        widgetDiv.dataset.punchBound = "1";
        this.widgetDiv = widgetDiv;

        // A mouse click focuses the native button. Release that focus again so
        // the performance keyboard keeps receiving ASCII note keys. Keyboard
        // activation does not fire pointerup, so it keeps focus for a11y.
        widgetDiv.addEventListener("pointerup", () => {
            const button = widgetDiv.querySelector(".punch-control-button");
            if (button && typeof button.blur === "function") {
                button.blur();
            }
        });

        const latched = this.props.latched !== false;

        if (latched) {
            widgetDiv.addEventListener("click", (event) => {
                if (!this.props.active || isEditMode()
                    || !event.target.closest(".punch-control-button")) {
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
                updateInnerHTMLPreservingFocus(this, ".punch-control-button");
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
            updateInnerHTMLPreservingFocus(this, ".punch-control-button");
            sendValue(this, next, isDown ? "begin" : "end");
        };

        widgetDiv.addEventListener("pointerdown", (event) => {
            if (event.isPrimary && event.button === 0 && event.target.closest(".punch-control-button")) {
                setMomentary(true);
            }
        });
        widgetDiv.addEventListener("pointerup", (event) => {
            if (event.target.closest(".punch-control-button")) {
                setMomentary(false);
            }
        });
        widgetDiv.addEventListener("pointercancel", () => setMomentary(false));
        widgetDiv.addEventListener("pointerleave", () => setMomentary(false));

        const isMomentaryKey = (event) => event.key === " " || event.key === "Enter";

        widgetDiv.addEventListener("keydown", (event) => {
            if (event.repeat || !isMomentaryKey(event)
                || !event.target.closest(".punch-control-button")) {
                return;
            }
            event.preventDefault();
            setMomentary(true);
        });
        widgetDiv.addEventListener("keyup", (event) => {
            if (!isMomentaryKey(event)
                || !event.target.closest(".punch-control-button")) {
                return;
            }
            event.preventDefault();
            setMomentary(false);
        });
    }
}
