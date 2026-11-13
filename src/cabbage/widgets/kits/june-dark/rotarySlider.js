// June kit — rotary slider.
// Overrides the built-in `rotarySlider` type; the .csd keeps "type": "rotarySlider".

import { CabbageUtils } from "cabbage/utils.js";
import {
    PALETTE,
    attachKeyboard,
    attachPointerDrag,
    baseProps,
    ensureStyles,
    escapeHtml,
    formatValue,
    getRange,
    getValue,
    ratioFromValue,
    sendValue,
    setValue,
    sliderColors,
    valueFromRatio,
} from "./juneKit.js";

const START_ANGLE = 225;   // lower-left, in CSS conic-gradient degrees
const SWEEP = 270;         // total travel, ending at the lower-right

const STYLES = `
.june-knob-widget {
    --june-accent: #94D200;
    --june-text: #d8d8d1;
    --june-muted: #8b8b84;
    --june-track: #1c1c1a;
    --june-surface: #3b3b37;
    --june-knob-size: 60px;
    box-sizing: border-box;
    position: relative;
    isolation: isolate;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.june-knob-well {
    position: relative;
    display: flex;
    flex: 0 0 auto;
    padding: 6px 0;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 0;
}
.june-progress {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(var(--june-knob-size) + 12px);
    height: calc(var(--june-knob-size) + 12px);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: conic-gradient(
        from 225deg,
        var(--june-accent) 0deg var(--june-sweep, 0deg),
        color-mix(in srgb, var(--june-track) 50%, var(--june-text) 25%) var(--june-sweep, 0deg) 270deg,
        transparent 270deg 360deg
    );
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
    pointer-events: none;
}
.june-knob {
    position: relative;
    width: var(--june-knob-size);
    height: var(--june-knob-size);
    flex: 0 0 auto;
    border: 3px solid color-mix(in srgb, var(--june-track) 62%, #000000);
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%,
        color-mix(in srgb, var(--june-surface) 80%, #ffffff) 0%,
        var(--june-surface) 55%,
        color-mix(in srgb, var(--june-surface) 60%, #000000) 100%);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 10%, transparent),
        inset 0 -6px 12px color-mix(in srgb, #000000 50%, transparent),
        0 5px 12px color-mix(in srgb, #000000 45%, transparent);
    cursor: grab;
    touch-action: none;
    outline: none;
}
.june-knob:active {
    cursor: grabbing;
}
.june-knob:focus-visible {
    outline: 2px solid var(--june-accent);
    outline-offset: 4px;
}
.june-cap {
    position: absolute;
    inset: 6%;
    border-radius: 50%;
    background: radial-gradient(circle at 38% 28%,
        color-mix(in srgb, var(--june-surface) 78%, #ffffff) 0%,
        color-mix(in srgb, var(--june-surface) 94%, #ffffff) 55%,
        color-mix(in srgb, var(--june-surface) 52%, #000000) 100%);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 8%, transparent),
        inset 0 -4px 8px color-mix(in srgb, #000000 35%, transparent);
    pointer-events: none;
}
.june-pip-wrap {
    position: absolute;
    inset: 1px;
    transform: rotate(var(--june-angle, 225deg));
}
.june-pip {
    position: absolute;
    top: 12%;
    left: 50%;
    width: 2px;
    height: 38%;
    transform: translateX(-50%);
    border-radius: 1px;
    background: var(--june-accent);
    box-shadow: 0 0 5px color-mix(in srgb, var(--june-accent) 55%, transparent);
}
.june-label {
    color: var(--june-text);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .14em;
    line-height: 1.2;
    text-transform: uppercase;
    white-space: nowrap;
}
.june-value {
    min-width: 3ch;
    color: var(--june-accent);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    letter-spacing: .04em;
    text-align: center;
    text-shadow: 0 0 6px color-mix(in srgb, var(--june-accent) 30%, transparent);
}
`;

export class JuneRotarySlider {
    constructor() {
        this.props = {
            ...baseProps("rotarySlider", {
                bounds: { top: 10, left: 10, width: 90, height: 140 },
                channels: [{
                    id: "rotarySlider",
                    event: "valueChanged",
                    range: { defaultValue: 45, increment: 1, max: 100, min: 0, skew: 1 },
                }],
                label: { text: "", offsetY: 0 },
                valueText: { visible: true, width: "auto", prefix: "", postfix: "" },
                knobScale: 1,
                style: {
                    opacity: 1,
                    color: sliderColors(),
                },
            }),
            "type": "rotarySlider",
        };
        this.vscode = null;
        this.parameterIndex = 0;
        this.widgetDiv = null;
        this.hiddenProps = [
            'parameterIndex', 'children', 'currentCsdFile', 'value',
            'popup', 'velocity', 'filmStrip',
            'label.align', 'label.offsetX',
            'valueText.width', 'valueText.offsetY',
            'style.thumb', 'style.track', 'style.label', 'style.valueText', 'style.shadow',
            'style.borderRadius', 'style.borderWidth', 'style.borderColor',
            'style.fontFamily', 'style.fontSize', 'style.fontColor', 'style.textAlign', 'style.backgroundColor',
            'knobScale',
        ];
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    getInnerHTML() {
        ensureStyles("june-rotary-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const ratio = ratioFromValue(value, range);
        const sweep = ratio * SWEEP;
        const angle = START_ANGLE + sweep;
        const color = this.props.style?.color || PALETTE;
        const baseSize = Math.max(28, Math.min(this.props.bounds.width * 0.6, this.props.bounds.height * 0.4));
        const knobScale = Math.max(0.1, Number(this.props.knobScale) || 1);
        const size = Math.max(1, Math.round(baseSize * knobScale));
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const labelOffsetY = Number(this.props.label?.offsetY) || 0;
        const label = labelText.trim()
            ? `<span class="june-label" style="transform: translateY(${labelOffsetY}px);">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="june-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";

        return `
            <div class="june-knob-widget"
                 style="--june-accent:${escapeHtml(color.accent || PALETTE.accent)}; --june-text:${escapeHtml(color.text || PALETTE.text)}; --june-muted:${escapeHtml(color.muted || PALETTE.muted)}; --june-track:${escapeHtml(color.track || PALETTE.track)}; --june-surface:${escapeHtml(color.surface || PALETTE.surface)}; --june-knob-size:${size}px; --june-sweep:${sweep.toFixed(2)}deg; --june-angle:${angle.toFixed(2)}deg; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <div class="june-knob-well">
                    <span class="june-progress" aria-hidden="true"></span>
                    <div class="june-knob" role="slider" tabindex="${this.props.active ? "0" : "-1"}" aria-disabled="${this.props.active ? "false" : "true"}"
                         aria-label="${escapeHtml(labelText || "Rotary slider")}"
                         aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}">
                        <span class="june-cap" aria-hidden="true">
                            <span class="june-pip-wrap"><i class="june-pip"></i></span>
                        </span>
                    </div>
                </div>
                ${label}
                ${valueText}
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

        let dragStartY = 0;
        let dragStartRatio = 0;

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".june-knob"),
            onStart: (event) => {
                dragStartY = event.clientY;
                dragStartRatio = ratioFromValue(getValue(this.props), getRange(this.props));
                sendValue(this, getValue(this.props), "begin");
            },
            onMove: (event) => {
                const range = getRange(this.props);
                const rect = widgetDiv.getBoundingClientRect();
                const distance = Math.max(1, rect.height * 0.9);
                const nextRatio = CabbageUtils.clamp(
                    dragStartRatio - (event.clientY - dragStartY) / distance,
                    0,
                    1,
                );
                setValue(this, valueFromRatio(nextRatio, range), "value");
            },
            onEnd: () => {
                sendValue(this, getValue(this.props), "end");
            },
        });

        attachKeyboard(
            widgetDiv,
            () => getRange(this.props),
            () => getValue(this.props),
            (next) => setValue(this, next, "complete"),
        );
    }
}
