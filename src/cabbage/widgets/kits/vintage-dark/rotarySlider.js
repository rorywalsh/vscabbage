// Vintage kit — rotary slider.
// Overrides the built-in `rotarySlider` type; the .csd keeps "type": "rotarySlider".

import { CabbageUtils } from "cabbage/utils.js";
import {
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
} from "./vintageKit.js";

const STYLES = `
.vintage-knob-widget {
    --vintage-accent: #c47a2c;
    --vintage-ink: #2f2a24;
    --vintage-muted: #6b6258;
    --vintage-track: #4a443c;
    --vintage-surface: #d9d2c6;
    --vintage-knob-size: 60px;
    box-sizing: border-box;
    position: relative;
    isolation: isolate;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: var(--vintage-ink);
    font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.vintage-knob-well {
    position: relative;
    display: flex;
    flex: 1 1 auto;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 0;
}
.vintage-knob-well::before {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(var(--vintage-knob-size) + 24px);
    height: calc(var(--vintage-knob-size) + 24px);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: repeating-conic-gradient(from 240deg,
        var(--vintage-muted) 0deg 1.5deg,
        transparent 1.5deg 30deg);
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px));
    opacity: 0.7;
    content: "";
    pointer-events: none;
}
.vintage-knob-well::after {
    position: absolute;
    top: 50%;
    left: 50%;
    width: calc(var(--vintage-knob-size) + 24px);
    height: calc(var(--vintage-knob-size) + 24px);
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: repeating-conic-gradient(from 240deg,
        var(--vintage-accent) 0deg 1.5deg,
        transparent 1.5deg 30deg);
    -webkit-mask:
        radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px)),
        conic-gradient(from var(--vintage-start, 240deg),
            #000 0deg var(--vintage-sweep, 0deg),
            transparent var(--vintage-sweep, 0deg) 360deg);
    -webkit-mask-composite: source-in;
    mask:
        radial-gradient(farthest-side, transparent calc(100% - 7px), #000 calc(100% - 6px)),
        conic-gradient(from var(--vintage-start, 240deg),
            #000 0deg var(--vintage-sweep, 0deg),
            transparent var(--vintage-sweep, 0deg) 360deg);
    mask-composite: intersect;
    filter: drop-shadow(0 0 3px color-mix(in srgb, var(--vintage-accent), transparent 45%));
    opacity: 0.95;
    content: "";
    pointer-events: none;
}
.vintage-knob {
    position: relative;
    isolation: isolate;
    width: var(--vintage-knob-size);
    height: var(--vintage-knob-size);
    flex: 0 0 auto;
    border: 4px solid color-mix(in srgb, var(--vintage-surface) 55%, var(--vintage-ink) 25%);
    border-radius: 50%;
    background: radial-gradient(circle at 32% 26%,
        color-mix(in srgb, var(--vintage-surface) 80%, #fff) 0%,
        var(--vintage-surface) 55%,
        color-mix(in srgb, var(--vintage-surface) 55%, #000) 100%);
    box-shadow:
        inset 0 2px 3px rgba(255, 255, 255, .65),
        inset 0 -3px 6px rgba(0, 0, 0, .3),
        0 4px 8px rgba(0, 0, 0, .45);
    cursor: grab;
    touch-action: none;
    outline: none;
}
.vintage-knob:active { cursor: grabbing; }
.vintage-knob:focus-visible { outline: 2px solid var(--vintage-accent); outline-offset: 4px; }
.vintage-knob::after {
    position: absolute;
    z-index: 1;
    inset: 8px;
    border: 1px solid color-mix(in srgb, var(--vintage-ink) 35%, transparent);
    border-radius: 50%;
    background: radial-gradient(circle at 35% 28%,
        color-mix(in srgb, var(--vintage-surface) 70%, #fff) 0%,
        var(--vintage-surface) 55%,
        color-mix(in srgb, var(--vintage-surface) 60%, #000) 100%);
    box-shadow:
        inset 0 2px 3px rgba(255, 255, 255, .55),
        inset 0 -3px 5px rgba(0, 0, 0, .25);
    content: "";
    pointer-events: none;
}
.vintage-indicator {
    position: absolute;
    z-index: 2;
    top: 50%;
    left: 50%;
    width: 3px;
    height: calc(var(--vintage-knob-size) * 0.3);
    border-radius: 2px;
    background: linear-gradient(180deg, #fff 0%, var(--vintage-ink) 35%, #000 100%);
    box-shadow:
        0 0 2px rgba(0, 0, 0, .8),
        1px 0 0 rgba(255, 255, 255, .35);
    transform: translate(-50%, -50%) rotate(var(--vintage-angle, 240deg)) translateY(calc(var(--vintage-knob-size) * -0.22));
    transform-origin: center;
    pointer-events: none;
}
.vintage-label {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 14px;
    color: var(--vintage-ink);
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .02em;
    line-height: 1.2;
    text-shadow: 0 1px 1px rgba(0, 0, 0, .35);
    white-space: nowrap;
}
.vintage-label::before {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--vintage-accent) 60%, #000);
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%,
        #fff 0%,
        var(--vintage-accent) 45%,
        color-mix(in srgb, var(--vintage-accent) 60%, #000) 100%);
    box-shadow: 0 0 5px var(--vintage-accent), inset 0 1px 1px rgba(255, 255, 255, .6);
    content: "";
}
.vintage-value {
    min-width: 3ch;
    padding: 1px 5px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--vintage-track) 75%, #000);
    color: var(--vintage-accent);
    font-family: "Courier New", monospace;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    text-align: center;
    text-shadow: 0 0 4px color-mix(in srgb, var(--vintage-accent), transparent 40%);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, .8), 0 1px 0 rgba(255, 255, 255, .25);
}
`;

export class VintageRotarySlider {
    constructor() {
        this.props = {
            ...baseProps("rotarySlider", {
                bounds: { top: 10, left: 10, width: 90, height: 140 },
                channels: [{
                    id: "rotarySlider",
                    event: "valueChanged",
                    range: { defaultValue: 45, increment: 1, max: 100, min: 0, skew: 1 },
                }],
                label: { text: "" },
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
            'label.align', 'label.offsetX', 'label.offsetY',
            'valueText.width', 'valueText.offsetY',
            'style.thumb', 'style.track', 'style.label', 'style.valueText', 'style.shadow',
            'style.borderRadius', 'style.borderWidth', 'style.borderColor',
            'style.fontFamily', 'style.fontSize', 'style.fontColor', 'style.textAlign', 'style.backgroundColor',
        ];
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    getInnerHTML() {
        ensureStyles("vintage-rotary-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const ratio = ratioFromValue(value, range);
        const sweep = ratio * 240;
        // Extend slightly past the sweep so the tick at the max position is lit.
        const tickSweep = ratio > 0 ? sweep + 1.5 : 0;
        const angle = 240 + sweep;
        const color = this.props.style?.color || {};
        const size = Math.max(28, Math.min(this.props.bounds.width * 0.66, this.props.bounds.height * 0.42));
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText
            ? `<span class="vintage-label">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="vintage-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";

        return `
            <div class="vintage-knob-widget"
                 style="--vintage-accent:${escapeHtml(color.accent || "#c47a2c")}; --vintage-ink:${escapeHtml(color.text || "#2f2a24")}; --vintage-muted:${escapeHtml(color.muted || "#6b6258")}; --vintage-track:${escapeHtml(color.track || "#4a443c")}; --vintage-surface:${escapeHtml(color.surface || "#d9d2c6")}; --vintage-knob-size:${size}px; --vintage-start:240deg; --vintage-range:240deg; --vintage-sweep:${tickSweep}deg; --vintage-angle:${angle}deg; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <div class="vintage-knob-well">
                    <div class="vintage-knob" role="slider" tabindex="${this.props.active ? "0" : "-1"}" aria-disabled="${this.props.active ? "false" : "true"}"
                         aria-label="${escapeHtml(labelText || "Rotary slider")}"
                         aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}">
                        <span class="vintage-indicator" aria-hidden="true"></span>
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
        if (widgetDiv.dataset.vintageBound === "1") {
            return;
        }
        widgetDiv.dataset.vintageBound = "1";
        this.widgetDiv = widgetDiv;

        let dragStartY = 0;
        let dragStartRatio = 0;

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".vintage-knob"),
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
