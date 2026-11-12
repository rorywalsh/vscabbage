// Illum kit — vertical slider.
// Overrides the built-in `verticalSlider` type.

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

const STYLES = `
.illum-vslider-widget {
    --illum-accent: #7ce7ff;
    --illum-text: #e6edf7;
    --illum-muted: #8896aa;
    --illum-track: #263041;
    --illum-surface: #121722;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    color: var(--illum-text);
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.illum-vslider {
    position: relative;
    flex: 1 1 0;
    width: 100%;
    min-height: 24px;
    cursor: pointer;
    touch-action: none;
    outline: none;
}
.illum-vslider .illum-track {
    position: relative;
    display: block;
    width: 6px;
    height: 100%;
    margin: 0 auto;
    border-radius: 3px;
    background: linear-gradient(90deg,
        color-mix(in srgb, var(--illum-track) 76%, #000000) 0%,
        var(--illum-track) 100%);
    box-shadow:
        inset 0 1px 3px color-mix(in srgb, #000000 55%, transparent),
        inset 0 0 0 1px color-mix(in srgb, #ffffff 5%, transparent);
}
.illum-vslider .illum-fill {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: var(--illum-fill, 50%);
    border-radius: 3px;
    background: linear-gradient(0deg,
        color-mix(in srgb, var(--illum-accent) 72%, #ffffff) 0%,
        var(--illum-accent) 100%);
    box-shadow: 0 0 6px color-mix(in srgb, var(--illum-accent) 40%, transparent);
}
.illum-vslider .illum-thumb {
    position: absolute;
    left: 50%;
    bottom: var(--illum-fill, 50%);
    width: 28px;
    height: 13px;
    transform: translate(-50%, 50%);
    border: 1px solid color-mix(in srgb, var(--illum-track) 62%, var(--illum-accent) 18%);
    border-radius: 4px;
    background: radial-gradient(circle at 50% 28%,
        color-mix(in srgb, var(--illum-surface) 58%, #ffffff) 0%,
        var(--illum-surface) 55%,
        color-mix(in srgb, var(--illum-surface) 62%, #000000) 100%);
    box-shadow:
        inset 0 1px 0 color-mix(in srgb, #ffffff 18%, transparent),
        0 2px 5px color-mix(in srgb, #000000 55%, transparent),
        0 0 7px color-mix(in srgb, var(--illum-accent) 16%, transparent);
}
.illum-vslider .illum-thumb::after {
    position: absolute;
    top: 3px;
    bottom: 3px;
    left: 50%;
    width: 2px;
    transform: translateX(-50%);
    border-radius: 1px;
    background: var(--illum-accent);
    box-shadow: 0 0 5px color-mix(in srgb, var(--illum-accent) 60%, transparent);
    content: "";
}
.illum-vslider-label {
    position: relative;
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    padding-bottom: 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: .12em;
    line-height: 1.2;
    text-transform: uppercase;
    white-space: nowrap;
}
.illum-vslider-label::after {
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
.illum-vslider-value {
    min-width: 3ch;
    flex: 0 0 auto;
    color: var(--illum-accent);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
    text-align: center;
    text-shadow: 0 0 6px color-mix(in srgb, var(--illum-accent) 35%, transparent);
}
`;

export class IllumVerticalSlider {
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
        ensureStyles("illum-vslider-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const fill = ratioFromValue(value, range) * 100;
        const color = this.props.style?.color || PALETTE;
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText.trim()
            ? `<span class="illum-vslider-label">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="illum-vslider-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";

        return `
            <div class="illum-vslider-widget"
                 style="--illum-accent:${escapeHtml(color.accent || PALETTE.accent)}; --illum-text:${escapeHtml(color.text || PALETTE.text)}; --illum-muted:${escapeHtml(color.muted || PALETTE.muted)}; --illum-track:${escapeHtml(color.track || PALETTE.track)}; --illum-surface:${escapeHtml(color.surface || PALETTE.surface)}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <div class="illum-vslider" role="slider" tabindex="${this.props.active ? "0" : "-1"}" aria-disabled="${this.props.active ? "false" : "true"}"
                     aria-label="${escapeHtml(labelText || "Vertical slider")}"
                     aria-orientation="vertical"
                     aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}"
                     style="--illum-fill:${fill}%;">
                    <span class="illum-track" aria-hidden="true"><span class="illum-fill"></span></span>
                    <span class="illum-thumb" aria-hidden="true"></span>
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

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".illum-vslider"),
            onStart: () => {
                sendValue(this, getValue(this.props), "begin");
            },
            onMove: (event) => {
                const slider = widgetDiv.querySelector(".illum-vslider");
                const track = slider?.querySelector(".illum-track") || slider;
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
