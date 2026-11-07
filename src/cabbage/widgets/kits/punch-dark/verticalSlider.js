// Punch kit — vertical slider.
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
} from "./punchKit.js";

const STYLES = `
.punch-vslider-widget {
    --punch-accent: #8cc700;
    --punch-ink: #1f1f1f;
    --punch-muted: #525252;
    --punch-track: #d3d5cf;
    --punch-surface: #f5f6f3;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: var(--punch-ink);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.punch-vslider {
    position: relative;
    flex: 1 1 0;
    width: 100%;
    min-height: 24px;
    cursor: pointer;
    touch-action: none;
    outline: none;
}
.punch-vslider .punch-track {
    position: relative;
    display: block;
    width: 7px;
    height: 100%;
    margin: 0 auto;
    border-radius: 4px;
    background: linear-gradient(90deg, var(--punch-track, #d3d5cf) 0%, color-mix(in srgb, var(--punch-track, #d3d5cf), var(--punch-ink, #1f1f1f) 12%) 100%);
    box-shadow:
        inset 0 0 0 1px rgb(76 85 61 / 8%),
        inset 0 1px 3px rgb(45 52 38 / 22%);
}
.punch-vslider .punch-fill {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--punch-fill, 50%);
    border-radius: 4px;
    background: var(--punch-accent);
    box-shadow: 0 0 7px color-mix(in srgb, var(--punch-accent), transparent 45%);
}
.punch-vslider .punch-thumb {
    position: absolute;
    left: 50%;
    bottom: var(--punch-fill, 50%);
    width: 30px;
    height: 14px;
    transform: translate(-50%, 50%);
    border: 1px solid color-mix(in srgb, var(--punch-surface, #f5f6f3), var(--punch-ink, #1f1f1f) 20%);
    border-radius: 5px;
    background: radial-gradient(circle at 50% 30%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 60%, #ffffff) 0%,
        var(--punch-surface, #f5f6f3) 60%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 55%, #000000) 100%);
    box-shadow:
        inset 0 1px 1px rgb(255 255 255 / 90%),
        0 2px 4px rgb(45 52 38 / 25%);
}
.punch-vslider .punch-thumb::after {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    border-radius: 1px;
    background: var(--punch-accent);
    content: "";
}
.punch-vslider:focus-visible .punch-thumb {
    outline: 2px solid #0b63a5;
    outline-offset: 3px;
}
.punch-vslider-label {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.2;
    white-space: nowrap;
}
.punch-vslider-label::before {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--punch-accent), transparent 70%);
    border-radius: 50%;
    background: var(--punch-accent);
    box-shadow: 0 0 6px color-mix(in srgb, var(--punch-accent), transparent 65%);
    content: "";
}
.punch-vslider-value {
    min-width: 3ch;
    flex: 0 0 auto;
    color: var(--punch-muted);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    text-align: center;
}
`;

export class PunchVerticalSlider {
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
        ensureStyles("punch-vslider-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const fill = ratioFromValue(value, range) * 100;
        const color = this.props.style?.color || {};
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText
            ? `<span class="punch-vslider-label">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="punch-vslider-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";

        return `
            <div class="punch-vslider-widget"
                 style="--punch-accent:${escapeHtml(color.accent || "#8cc700")}; --punch-ink:${escapeHtml(color.text || "#1f1f1f")}; --punch-muted:${escapeHtml(color.muted || "#525252")}; --punch-track:${escapeHtml(color.track || "#d3d5cf")}; --punch-surface:${escapeHtml(color.surface || "#f5f6f3")}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <div class="punch-vslider" role="slider" tabindex="0"
                     aria-label="${escapeHtml(labelText || "Vertical slider")}"
                     aria-orientation="vertical"
                     aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}"
                     style="--punch-fill:${fill}%;">
                    <span class="punch-track" aria-hidden="true"><span class="punch-fill"></span></span>
                    <span class="punch-thumb" aria-hidden="true"></span>
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

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".punch-vslider"),
            onStart: () => {
                sendValue(this, getValue(this.props), "begin");
            },
            onMove: (event) => {
                const slider = widgetDiv.querySelector(".punch-vslider");
                const track = slider?.querySelector(".punch-track") || slider;
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
