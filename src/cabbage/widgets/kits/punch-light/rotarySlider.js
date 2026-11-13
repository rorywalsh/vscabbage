// Punch kit — rotary slider.
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
} from "./punchKit.js";

const STYLES = `
.punch-knob-widget {
    --punch-accent: #8cc700;
    --punch-ink: #1f1f1f;
    --punch-muted: #525252;
    --punch-track: #d3d5cf;
    --punch-surface: #f5f6f3;
    --punch-knob-size: 60px;
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
    color: var(--punch-ink);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.punch-knob-well {
    display: flex;
    flex: 0 0 auto;
    padding: 14px 0;
    align-items: center;
    justify-content: center;
    width: 100%;
    min-height: 0;
}
.punch-knob {
    position: relative;
    width: var(--punch-knob-size);
    height: var(--punch-knob-size);
    flex: 0 0 auto;
    border: 3px solid color-mix(in srgb, var(--punch-surface, #f5f6f3), var(--punch-ink, #1f1f1f) 18%);
    border-radius: 50%;
    background: radial-gradient(circle at 35% 28%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 65%, #ffffff) 0%,
        var(--punch-surface, #f5f6f3) 50%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 55%, #000000) 100%);
    box-shadow:
        inset 0 1px 2px rgb(255 255 255 / 90%),
        inset 0 2px 5px rgb(76 85 61 / 10%),
        inset 0 -3px 5px rgb(76 85 61 / 12%),
        0 0 0 1px rgb(255 255 255 / 80%),
        0 2px 3px rgb(45 52 38 / 15%),
        0 7px 11px rgb(45 52 38 / 20%);
    cursor: grab;
    touch-action: none;
    outline: none;
}
.punch-knob:active { cursor: grabbing; }
.punch-knob:focus-visible { outline: 2px solid #0b63a5; outline-offset: 3px; }
.punch-knob::before {
    position: absolute;
    z-index: -1;
    inset: -14px;
    border-radius: 50%;
    content: "";
    background: conic-gradient(
        from var(--punch-start, 240deg),
        var(--punch-accent) 0deg var(--punch-sweep, 0deg),
        color-mix(in srgb, var(--punch-track, #d3d5cf), var(--punch-ink, #1f1f1f) 55%) var(--punch-sweep, 0deg) var(--punch-range, 240deg),
        transparent var(--punch-range, 240deg) 360deg
    );
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 1px), #000 calc(100% - 0.5px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 2px));
}
.punch-arc-glow {
    position: absolute;
    z-index: -1;
    inset: -14px;
    border-radius: 50%;
    background: conic-gradient(
        from var(--punch-start, 240deg),
        var(--punch-accent) 0deg var(--punch-sweep, 0deg),
        transparent var(--punch-sweep, 0deg) 360deg
    );
    -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 0.5px));
    mask: radial-gradient(farthest-side, transparent calc(100% - 3px), #000 calc(100% - 0.5px));
    pointer-events: none;
}
.punch-knob::after {
    position: absolute;
    inset: 6px;
    border: 1px solid color-mix(in srgb, var(--punch-ink, #1f1f1f), transparent 88%);
    border-radius: 50%;
    content: "";
    pointer-events: none;
}
.punch-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 2px;
    height: calc(var(--punch-knob-size) * 0.22);
    border-radius: 2px;
    background: var(--punch-accent);
    box-shadow: 0 0 4px color-mix(in srgb, var(--punch-accent), transparent 55%);
    transform: translate(-50%, -50%) rotate(var(--punch-angle, 240deg)) translateY(calc(var(--punch-knob-size) * -0.25));
    transform-origin: center;
    pointer-events: none;
}
.punch-label {
    display: flex;
    align-items: center;
    gap: 6px;
    min-height: 14px;
    color: var(--punch-ink);
    font-size: 12px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
}
.punch-label::before {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--punch-accent), transparent 70%);
    border-radius: 50%;
    background: var(--punch-accent);
    box-shadow: 0 0 6px color-mix(in srgb, var(--punch-accent), transparent 65%);
    content: "";
}
.punch-value {
    min-width: 3ch;
    color: var(--punch-muted);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    text-align: center;
}
`;

export class PunchRotarySlider {
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
        ];
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }

    getInnerHTML() {
        ensureStyles("punch-rotary-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const ratio = ratioFromValue(value, range);
        const sweep = ratio * 240;
        const angle = 240 + sweep;
        const color = this.props.style?.color || {};
        const baseSize = Math.max(28, Math.min(this.props.bounds.width * 0.66, this.props.bounds.height * 0.42));
        const knobScale = Math.max(0.1, Number(this.props.knobScale) || 1);
        const size = Math.max(1, Math.round(baseSize * knobScale));
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const labelOffsetY = Number(this.props.label?.offsetY) || 0;
        const label = labelText
            ? `<span class="punch-label" style="transform: translateY(${labelOffsetY}px);">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="punch-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";

        return `
            <div class="punch-knob-widget"
                 style="--punch-accent:${escapeHtml(color.accent || "#8cc700")}; --punch-ink:${escapeHtml(color.text || "#1f1f1f")}; --punch-muted:${escapeHtml(color.muted || "#525252")}; --punch-track:${escapeHtml(color.track || "#d3d5cf")}; --punch-surface:${escapeHtml(color.surface || "#f5f6f3")}; --punch-knob-size:${size}px; --punch-start:240deg; --punch-range:240deg; --punch-sweep:${sweep}deg; --punch-angle:${angle}deg; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <div class="punch-knob-well">
                    <div class="punch-knob" role="slider" tabindex="${this.props.active ? "0" : "-1"}" aria-disabled="${this.props.active ? "false" : "true"}"
                         aria-label="${escapeHtml(labelText || "Rotary slider")}"
                         aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}">
                        <span class="punch-arc-glow" aria-hidden="true"></span>
                        <span class="punch-indicator" aria-hidden="true"></span>
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
        if (widgetDiv.dataset.punchBound === "1") {
            return;
        }
        widgetDiv.dataset.punchBound = "1";
        this.widgetDiv = widgetDiv;

        let dragStartY = 0;
        let dragStartRatio = 0;

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".punch-knob"),
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
