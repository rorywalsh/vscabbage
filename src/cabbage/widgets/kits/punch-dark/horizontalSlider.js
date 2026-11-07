// Punch kit — horizontal slider.
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
} from "./punchKit.js";

const STYLES = `
.punch-hslider-widget {
    --punch-accent: #8cc700;
    --punch-ink: #1f1f1f;
    --punch-muted: #525252;
    --punch-track: #d3d5cf;
    --punch-surface: #f5f6f3;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    color: var(--punch-ink);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.punch-hslider-label {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 0 auto;
    font-size: 12px;
    font-weight: 500;
    white-space: nowrap;
}
.punch-hslider-label::before {
    width: 7px;
    height: 7px;
    flex: 0 0 auto;
    border: 1px solid color-mix(in srgb, var(--punch-accent), transparent 70%);
    border-radius: 50%;
    background: var(--punch-accent);
    box-shadow: 0 0 6px color-mix(in srgb, var(--punch-accent), transparent 65%);
    content: "";
}
.punch-hslider {
    position: relative;
    flex: 1 1 auto;
    min-width: 24px;
    height: 28px;
    cursor: pointer;
    touch-action: none;
    outline: none;
}
.punch-hslider .punch-track {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 7px;
    transform: translateY(-50%);
    border-radius: 4px;
    background: linear-gradient(180deg, var(--punch-track, #d3d5cf) 0%, color-mix(in srgb, var(--punch-track, #d3d5cf), var(--punch-ink, #1f1f1f) 12%) 100%);
    box-shadow:
        inset 0 0 0 1px rgb(76 85 61 / 8%),
        inset 0 1px 3px rgb(45 52 38 / 22%);
}
.punch-hslider .punch-fill {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    width: var(--punch-fill, 50%);
    border-radius: 4px;
    background: var(--punch-accent);
    box-shadow: 0 0 7px color-mix(in srgb, var(--punch-accent), transparent 45%);
}
.punch-hslider .punch-thumb {
    position: absolute;
    top: 50%;
    left: var(--punch-fill, 50%);
    width: 18px;
    height: 18px;
    transform: translate(-50%, -50%);
    border: 1px solid color-mix(in srgb, var(--punch-surface, #f5f6f3), var(--punch-ink, #1f1f1f) 20%);
    border-radius: 50%;
    background: radial-gradient(circle at 35% 30%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 60%, #ffffff) 0%,
        var(--punch-surface, #f5f6f3) 60%,
        color-mix(in srgb, var(--punch-surface, #f5f6f3) 55%, #000000) 100%);
    box-shadow:
        inset 0 1px 1px rgb(255 255 255 / 90%),
        0 1px 3px rgb(45 52 38 / 25%);
}
.punch-hslider:focus-visible .punch-thumb {
    outline: 2px solid #0b63a5;
    outline-offset: 3px;
}
.punch-hslider-value {
    min-width: 3ch;
    flex: 0 0 auto;
    color: var(--punch-muted);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
    text-align: right;
}
`;

export class PunchHorizontalSlider {
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
        ensureStyles("punch-hslider-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const fill = ratioFromValue(value, range) * 100;
        const color = this.props.style?.color || {};
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText
            ? `<span class="punch-hslider-label">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="punch-hslider-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";

        return `
            <div class="punch-hslider-widget"
                 style="--punch-accent:${escapeHtml(color.accent || "#8cc700")}; --punch-ink:${escapeHtml(color.text || "#1f1f1f")}; --punch-muted:${escapeHtml(color.muted || "#525252")}; --punch-track:${escapeHtml(color.track || "#d3d5cf")}; --punch-surface:${escapeHtml(color.surface || "#f5f6f3")}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                ${label}
                <div class="punch-hslider" role="slider" tabindex="${this.props.active ? "0" : "-1"}" aria-disabled="${this.props.active ? "false" : "true"}"
                     aria-label="${escapeHtml(labelText || "Horizontal slider")}"
                     aria-orientation="horizontal"
                     aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}"
                     style="--punch-fill:${fill}%;">
                    <span class="punch-track" aria-hidden="true"><span class="punch-fill"></span></span>
                    <span class="punch-thumb" aria-hidden="true"></span>
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
        if (widgetDiv.dataset.punchBound === "1") {
            return;
        }
        widgetDiv.dataset.punchBound = "1";
        this.widgetDiv = widgetDiv;

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".punch-hslider"),
            onStart: () => {
                sendValue(this, getValue(this.props), "begin");
            },
            onMove: (event) => {
                const slider = widgetDiv.querySelector(".punch-hslider");
                const track = slider?.querySelector(".punch-track") || slider;
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
