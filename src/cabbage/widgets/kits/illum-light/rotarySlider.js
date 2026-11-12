// Illum kit — rotary slider.
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
} from "./illumKit.js";

const START_ANGLE = 225;   // lower-left, in CSS conic-gradient degrees
const SWEEP = 270;         // total travel, ending at the lower-right
const TICK_COUNT = 28;

const STYLES = `
.illum-knob-widget {
    --illum-accent: #7ce7ff;
    --illum-text: #e6edf7;
    --illum-muted: #8896aa;
    --illum-track: #263041;
    --illum-surface: #121722;
    --illum-knob-size: 60px;
    --illum-tick-distance: calc(var(--illum-knob-size) * 0.5 + 10px);
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
    color: var(--illum-text);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.illum-knob-well {
    position: relative;
    display: flex;
    flex: 0 0 auto;
    padding: 13px 0;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 0;
}
.illum-knob-well::before {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(var(--illum-knob-size) * 1.7);
    height: calc(var(--illum-knob-size) * 1.7);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: radial-gradient(circle,
        color-mix(in srgb, var(--illum-accent) 13%, transparent) 0%,
        transparent 62%);
    opacity: .5;
    content: "";
    pointer-events: none;
}
.illum-ticks {
    position: absolute;
    inset: 0;
    pointer-events: none;
}
.illum-tick {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: 6px;
    margin-top: -3px;
    margin-left: -1px;
    border-radius: 2px;
    background: color-mix(in srgb, var(--illum-track) 55%, var(--illum-text) 30%);
    opacity: .8;
    transform: rotate(var(--illum-tick-angle)) translateY(calc(var(--illum-tick-distance) * -1));
    transition: background .18s, box-shadow .18s, opacity .18s;
}
.illum-tick.is-lit {
    background: var(--illum-accent);
    box-shadow: 0 0 6px color-mix(in srgb, var(--illum-accent) 70%, transparent);
    opacity: 1;
}
.illum-arc,
.illum-arc-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(var(--illum-knob-size) + 14px);
    height: calc(var(--illum-knob-size) + 14px);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    pointer-events: none;
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 2.5px), #000 calc(100% - 2px));
}
.illum-arc {
    background: conic-gradient(
        from 225deg,
        color-mix(in srgb, var(--illum-track) 55%, var(--illum-text) 30%) 0deg 270deg,
        transparent 270deg 360deg
    );
    opacity: .9;
}
.illum-arc-glow {
    background: conic-gradient(
        from 225deg,
        var(--illum-accent) 0deg var(--illum-sweep, 0deg),
        transparent var(--illum-sweep, 0deg) 360deg
    );
    filter: drop-shadow(0 0 4px color-mix(in srgb, var(--illum-accent) 65%, transparent));
}
.illum-knob {
    position: relative;
    width: var(--illum-knob-size);
    height: var(--illum-knob-size);
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--illum-track) 65%, var(--illum-accent) 10%);
    border-radius: 50%;
    background: radial-gradient(circle at 34% 26%,
        color-mix(in srgb, var(--illum-surface) 55%, #ffffff) 0%,
        var(--illum-surface) 46%,
        color-mix(in srgb, var(--illum-surface) 60%, #000000) 100%);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 14%, transparent),
        inset 0 -10px 18px color-mix(in srgb, #000000 55%, transparent),
        0 10px 22px -10px color-mix(in srgb, #000000 85%, transparent),
        0 0 0 1px color-mix(in srgb, var(--illum-surface) 60%, #000000),
        0 0 22px -8px color-mix(in srgb, var(--illum-accent) 30%, transparent);
    cursor: grab;
    touch-action: none;
    outline: none;
}
.illum-knob:active { cursor: grabbing; }
.illum-knob:focus-visible { outline: 2px solid var(--illum-accent); outline-offset: 4px; }
.illum-knob::after {
    position: absolute;
    inset: 7%;
    border: 1px solid color-mix(in srgb, var(--illum-accent) 12%, transparent);
    border-radius: 50%;
    content: "";
    pointer-events: none;
}
.illum-cap {
    position: absolute;
    inset: 10%;
    border-radius: 50%;
    background: radial-gradient(circle at 36% 28%,
        color-mix(in srgb, var(--illum-surface) 40%, #ffffff) 0%,
        color-mix(in srgb, var(--illum-surface) 82%, #ffffff) 22%,
        var(--illum-surface) 62%,
        color-mix(in srgb, var(--illum-surface) 55%, #000000) 100%);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 18%, transparent),
        inset 0 -4px 10px color-mix(in srgb, #000000 45%, transparent);
    pointer-events: none;
}
.illum-pip-wrap {
    position: absolute;
    inset: 0;
    transform: rotate(var(--illum-angle, 225deg));
}
.illum-pip {
    position: absolute;
    top: 8%;
    left: 50%;
    width: 10%;
    min-width: 3px;
    aspect-ratio: 1;
    transform: translateX(-50%);
    border-radius: 50%;
    background: var(--illum-accent);
    box-shadow:
        0 0 6px color-mix(in srgb, var(--illum-accent) 85%, transparent),
        0 0 14px color-mix(in srgb, var(--illum-accent) 45%, transparent);
}
.illum-label {
    position: relative;
    display: inline-flex;
    align-items: center;
    min-height: 14px;
    padding-bottom: 4px;
    color: var(--illum-text);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .12em;
    line-height: 1.2;
    text-transform: uppercase;
    white-space: nowrap;
}
.illum-label::after {
    position: absolute;
    right: 0;
    bottom: 0;
    left: 0;
    height: 1px;
    background: linear-gradient(90deg,
        color-mix(in srgb, var(--illum-accent) 60%, transparent),
        color-mix(in srgb, var(--illum-accent) 12%, transparent));
    content: "";
}
.illum-value {
    min-width: 3ch;
    color: var(--illum-accent);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    letter-spacing: .04em;
    text-align: center;
    text-shadow: 0 0 8px color-mix(in srgb, var(--illum-accent) 45%, transparent);
}
@media (prefers-reduced-motion: reduce) {
    .illum-tick { transition-duration: .01s; }
}
`;

export class IllumRotarySlider {
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
        ];
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    getInnerHTML() {
        ensureStyles("illum-rotary-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const ratio = ratioFromValue(value, range);
        const sweep = ratio * SWEEP;
        const angle = START_ANGLE + sweep;
        const color = this.props.style?.color || PALETTE;
        const size = Math.max(28, Math.min(this.props.bounds.width * 0.6, this.props.bounds.height * 0.4));
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const labelOffsetY = Number(this.props.label?.offsetY) || 0;
        const label = labelText.trim()
            ? `<span class="illum-label" style="transform: translateY(${labelOffsetY}px);">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="illum-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";
        const ticks = Array.from({ length: TICK_COUNT }, (_, i) => {
            const position = i / (TICK_COUNT - 1);
            const tickAngle = START_ANGLE + position * SWEEP;
            const lit = position <= ratio ? " is-lit" : "";
            return `<i class="illum-tick${lit}" style="--illum-tick-angle:${tickAngle.toFixed(2)}deg"></i>`;
        }).join("");

        return `
            <div class="illum-knob-widget"
                 style="--illum-accent:${escapeHtml(color.accent || PALETTE.accent)}; --illum-text:${escapeHtml(color.text || PALETTE.text)}; --illum-muted:${escapeHtml(color.muted || PALETTE.muted)}; --illum-track:${escapeHtml(color.track || PALETTE.track)}; --illum-surface:${escapeHtml(color.surface || PALETTE.surface)}; --illum-knob-size:${size}px; --illum-sweep:${sweep.toFixed(2)}deg; --illum-angle:${angle.toFixed(2)}deg; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <div class="illum-knob-well">
                    <span class="illum-ticks" aria-hidden="true">${ticks}</span>
                    <span class="illum-arc" aria-hidden="true"></span>
                    <span class="illum-arc-glow" aria-hidden="true"></span>
                    <div class="illum-knob" role="slider" tabindex="${this.props.active ? "0" : "-1"}" aria-disabled="${this.props.active ? "false" : "true"}"
                         aria-label="${escapeHtml(labelText || "Rotary slider")}"
                         aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}">
                        <span class="illum-cap" aria-hidden="true">
                            <span class="illum-pip-wrap"><i class="illum-pip"></i></span>
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
        if (widgetDiv.dataset.illumBound === "1") {
            return;
        }
        widgetDiv.dataset.illumBound = "1";
        this.widgetDiv = widgetDiv;

        let dragStartY = 0;
        let dragStartRatio = 0;

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".illum-knob"),
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
