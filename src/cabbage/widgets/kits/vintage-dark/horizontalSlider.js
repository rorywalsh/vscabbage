// Vintage kit — horizontal slider.
// Overrides the built-in `horizontalSlider` type.

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
.vintage-hslider-widget {
    --vintage-accent: #c47a2c;
    --vintage-ink: #2f2a24;
    --vintage-muted: #6b6258;
    --vintage-track: #4a443c;
    --vintage-surface: #d9d2c6;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--vintage-ink);
    font-family: "Trebuchet MS", "Segoe UI", Verdana, sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.vintage-hslider-label {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .02em;
    text-shadow: 0 1px 1px rgba(0, 0, 0, .35);
    white-space: nowrap;
}
.vintage-hslider-label::before {
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
.vintage-hslider {
    position: relative;
    flex: 1 1 auto;
    min-width: 24px;
    height: 30px;
    cursor: pointer;
    touch-action: none;
    outline: none;
}
.vintage-hslider .vintage-track {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 10px;
    transform: translateY(-50%);
    border: 2px solid color-mix(in srgb, var(--vintage-track) 55%, #000);
    border-radius: 6px;
    background:
        repeating-linear-gradient(90deg, transparent 0 9px, rgba(255, 255, 255, .08) 9px 10px),
        linear-gradient(180deg,
            color-mix(in srgb, var(--vintage-track) 45%, #000) 0%,
            var(--vintage-track) 55%,
            color-mix(in srgb, var(--vintage-track) 75%, #fff) 100%);
    box-shadow:
        inset 0 3px 5px rgba(0, 0, 0, .75),
        inset 0 -1px 0 rgba(255, 255, 255, .25),
        0 1px 0 rgba(255, 255, 255, .3);
}
.vintage-hslider .vintage-fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: var(--vintage-fill, 50%);
    border-radius: 4px;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--vintage-accent) 60%, #fff) 0%,
        var(--vintage-accent) 50%,
        color-mix(in srgb, var(--vintage-accent) 55%, #000) 100%);
    box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, .6),
        0 0 5px color-mix(in srgb, var(--vintage-accent), transparent 40%);
}
.vintage-hslider .vintage-thumb {
    position: absolute;
    top: 50%;
    left: var(--vintage-fill, 50%);
    width: 18px;
    height: 28px;
    transform: translate(-50%, -50%);
    border: 2px solid color-mix(in srgb, var(--vintage-surface) 45%, var(--vintage-ink) 30%);
    border-radius: 4px;
    background: linear-gradient(90deg,
        color-mix(in srgb, var(--vintage-surface) 45%, #000) 0%,
        var(--vintage-surface) 35%,
        color-mix(in srgb, var(--vintage-surface) 70%, #fff) 50%,
        var(--vintage-surface) 65%,
        color-mix(in srgb, var(--vintage-surface) 45%, #000) 100%);
    box-shadow:
        0 3px 5px rgba(0, 0, 0, .55),
        inset 0 1px 1px rgba(255, 255, 255, .65),
        inset 0 -1px 2px rgba(0, 0, 0, .3);
}
.vintage-hslider .vintage-thumb::after {
    position: absolute;
    top: 5px;
    bottom: 5px;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    border-radius: 1px;
    background: color-mix(in srgb, var(--vintage-track) 55%, #000);
    box-shadow: 1px 0 0 rgba(255, 255, 255, .35), inset 0 1px 2px rgba(0, 0, 0, .8);
    content: "";
}
.vintage-hslider:focus-visible .vintage-thumb {
    outline: 2px solid var(--vintage-accent);
    outline-offset: 3px;
}
.vintage-hslider-value {
    min-width: 3ch;
    flex: 0 0 auto;
    padding: 1px 5px;
    border-radius: 3px;
    background: color-mix(in srgb, var(--vintage-track) 75%, #000);
    color: var(--vintage-accent);
    font-family: "Courier New", monospace;
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    text-align: right;
    text-shadow: 0 0 4px color-mix(in srgb, var(--vintage-accent), transparent 40%);
    box-shadow: inset 0 1px 3px rgba(0, 0, 0, .8), 0 1px 0 rgba(255, 255, 255, .25);
}
`;

export class VintageHorizontalSlider {
    constructor() {
        this.props = {
            ...baseProps("horizontalSlider", {
                bounds: { top: 10, left: 10, width: 220, height: 44 },
                channels: [{
                    id: "horizontalSlider",
                    event: "valueChanged",
                    range: { defaultValue: 50, increment: 1, max: 100, min: 0, skew: 1 },
                }],
                label: { text: "" },
                valueText: { visible: true, width: "auto", prefix: "", postfix: "" },
                style: {
                    opacity: 1,
                    color: sliderColors(),
                },
            }),
            "type": "horizontalSlider",
        };
        this.vscode = null;
        this.parameterIndex = 0;
        this.widgetDiv = null;
        this.hiddenProps = [
            'parameterIndex', 'children', 'currentCsdFile', 'value',
            'popup',
            'label.align', 'label.offsetX', 'label.offsetY',
            'valueText.width', 'valueText.offsetY',
            'style.thumb', 'style.track', 'style.label', 'style.valueText', 'style.shadow',
            'style.borderRadius', 'style.borderWidth', 'style.borderColor',
            'style.fontFamily', 'style.fontSize', 'style.fontColor', 'style.textAlign', 'style.backgroundColor',
        ];
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    getInnerHTML() {
        ensureStyles("vintage-hslider-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const fill = ratioFromValue(value, range) * 100;
        const color = this.props.style?.color || {};
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText
            ? `<span class="vintage-hslider-label">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="vintage-hslider-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";

        return `
            <div class="vintage-hslider-widget"
                 style="--vintage-accent:${escapeHtml(color.accent || "#c47a2c")}; --vintage-ink:${escapeHtml(color.text || "#2f2a24")}; --vintage-muted:${escapeHtml(color.muted || "#6b6258")}; --vintage-track:${escapeHtml(color.track || "#4a443c")}; --vintage-surface:${escapeHtml(color.surface || "#d9d2c6")}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                ${label}
                <div class="vintage-hslider" role="slider" tabindex="0"
                     aria-label="${escapeHtml(labelText || "Horizontal slider")}"
                     aria-orientation="horizontal"
                     aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}"
                     style="--vintage-fill:${fill}%;">
                    <span class="vintage-track" aria-hidden="true"><span class="vintage-fill"></span></span>
                    <span class="vintage-thumb" aria-hidden="true"></span>
                </div>
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

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".vintage-hslider"),
            onStart: () => {
                sendValue(this, getValue(this.props), "begin");
            },
            onMove: (event) => {
                const slider = widgetDiv.querySelector(".vintage-hslider");
                const track = slider?.querySelector(".vintage-track") || slider;
                if (!track) {
                    return;
                }
                const rect = track.getBoundingClientRect();
                const width = Math.max(1, rect.width);
                const ratio = (event.clientX - rect.left) / width;
                setValue(this, valueFromRatio(ratio, getRange(this.props)), "value");
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
