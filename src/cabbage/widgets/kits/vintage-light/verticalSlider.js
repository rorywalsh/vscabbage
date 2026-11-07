// Vintage kit — vertical slider.
// Overrides the built-in `verticalSlider` type.

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
.vintage-vslider-widget {
    --vintage-accent: #c47a2c;
    --vintage-ink: #2f2a24;
    --vintage-muted: #6b6258;
    --vintage-track: #4a443c;
    --vintage-surface: #d9d2c6;
    box-sizing: border-box;
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
.vintage-vslider {
    position: relative;
    flex: 1 1 0;
    width: 100%;
    min-height: 24px;
    cursor: pointer;
    touch-action: none;
    outline: none;
}
.vintage-vslider .vintage-track {
    position: relative;
    display: block;
    width: 10px;
    height: 100%;
    margin: 0 auto;
    border: 2px solid color-mix(in srgb, var(--vintage-track) 55%, #000);
    border-radius: 6px;
    background:
        repeating-linear-gradient(180deg, transparent 0 9px, rgba(255, 255, 255, .08) 9px 10px),
        linear-gradient(90deg,
            color-mix(in srgb, var(--vintage-track) 45%, #000) 0%,
            var(--vintage-track) 55%,
            color-mix(in srgb, var(--vintage-track) 75%, #fff) 100%);
    box-shadow:
        inset 0 3px 5px rgba(0, 0, 0, .75),
        inset 0 -1px 0 rgba(255, 255, 255, .25),
        0 1px 0 rgba(255, 255, 255, .3);
}
.vintage-vslider .vintage-fill {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--vintage-fill, 50%);
    border-radius: 4px;
    background: linear-gradient(90deg,
        color-mix(in srgb, var(--vintage-accent) 60%, #fff) 0%,
        var(--vintage-accent) 50%,
        color-mix(in srgb, var(--vintage-accent) 55%, #000) 100%);
    box-shadow:
        inset 0 1px 1px rgba(255, 255, 255, .6),
        0 0 5px color-mix(in srgb, var(--vintage-accent), transparent 40%);
}
.vintage-vslider .vintage-thumb {
    position: absolute;
    left: 50%;
    bottom: var(--vintage-fill, 50%);
    width: 34px;
    height: 18px;
    transform: translate(-50%, 50%);
    border: 2px solid color-mix(in srgb, var(--vintage-surface) 45%, var(--vintage-ink) 30%);
    border-radius: 4px;
    background: linear-gradient(180deg,
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
.vintage-vslider .vintage-thumb::after {
    position: absolute;
    left: 5px;
    right: 5px;
    top: 50%;
    height: 2px;
    transform: translateY(-50%);
    border-radius: 1px;
    background: color-mix(in srgb, var(--vintage-track) 55%, #000);
    box-shadow: 0 1px 0 rgba(255, 255, 255, .35), inset 0 1px 2px rgba(0, 0, 0, .8);
    content: "";
}
.vintage-vslider:focus-visible .vintage-thumb {
    outline: 2px solid var(--vintage-accent);
    outline-offset: 3px;
}
.vintage-vslider-label {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: .02em;
    line-height: 1.2;
    text-shadow: 0 1px 1px rgba(0, 0, 0, .35);
    white-space: nowrap;
}
.vintage-vslider-label::before {
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
.vintage-vslider-value {
    min-width: 3ch;
    flex: 0 0 auto;
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

export class VintageVerticalSlider {
    constructor() {
        this.props = {
            ...baseProps("verticalSlider", {
                bounds: { top: 10, left: 10, width: 70, height: 170 },
                channels: [{
                    id: "verticalSlider",
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
            "type": "verticalSlider",
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
        ensureStyles("vintage-vslider-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const fill = ratioFromValue(value, range) * 100;
        const color = this.props.style?.color || {};
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText
            ? `<span class="vintage-vslider-label">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="vintage-vslider-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";

        return `
            <div class="vintage-vslider-widget"
                 style="--vintage-accent:${escapeHtml(color.accent || "#c47a2c")}; --vintage-ink:${escapeHtml(color.text || "#2f2a24")}; --vintage-muted:${escapeHtml(color.muted || "#6b6258")}; --vintage-track:${escapeHtml(color.track || "#4a443c")}; --vintage-surface:${escapeHtml(color.surface || "#d9d2c6")}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <div class="vintage-vslider" role="slider" tabindex="${this.props.active ? "0" : "-1"}" aria-disabled="${this.props.active ? "false" : "true"}"
                     aria-label="${escapeHtml(labelText || "Vertical slider")}"
                     aria-orientation="vertical"
                     aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}"
                     style="--vintage-fill:${fill}%;">
                    <span class="vintage-track" aria-hidden="true"><span class="vintage-fill"></span></span>
                    <span class="vintage-thumb" aria-hidden="true"></span>
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

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".vintage-vslider"),
            onStart: () => {
                sendValue(this, getValue(this.props), "begin");
            },
            onMove: (event) => {
                const slider = widgetDiv.querySelector(".vintage-vslider");
                const track = slider?.querySelector(".vintage-track") || slider;
                if (!track) {
                    return;
                }
                const rect = track.getBoundingClientRect();
                const height = Math.max(1, rect.height);
                const ratio = (rect.bottom - event.clientY) / height;
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
