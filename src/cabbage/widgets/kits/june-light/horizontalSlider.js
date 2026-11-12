// June kit — horizontal slider.
// Overrides the built-in `horizontalSlider` type.

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

const STYLES = `
.june-hslider-widget {
    --june-accent: #e0802c;
    --june-text: #d8d8d1;
    --june-muted: #8b8b84;
    --june-track: #1c1c1a;
    --june-surface: #3b3b37;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    gap: 10px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.june-hslider-label {
    display: inline-flex;
    align-items: center;
    flex: 0 0 auto;
    color: var(--june-text);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .14em;
    text-transform: uppercase;
    white-space: nowrap;
}
.june-hslider {
    position: relative;
    flex: 1 1 auto;
    min-width: 24px;
    height: 28px;
    cursor: pointer;
    touch-action: none;
    outline: none;
}
.june-hslider .june-track {
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    box-sizing: border-box;
    height: 12px;
    transform: translateY(-50%);
    border: 1px solid color-mix(in srgb, var(--june-track) 62%, #000000);
    border-radius: 6px;
    background: linear-gradient(180deg,
        color-mix(in srgb, var(--june-track) 72%, #000000) 0%,
        var(--june-track) 100%);
    box-shadow:
        inset 0 1px 3px color-mix(in srgb, #000000 80%, transparent),
        0 0 0 1px color-mix(in srgb, #ffffff 3%, transparent);
}
.june-hslider .june-fill {
    position: absolute;
    top: 50%;
    left: 0;
    width: calc(6px + (100% - 12px) * var(--june-ratio, .5));
    height: 3px;
    transform: translateY(-50%);
    border-radius: 2px;
    background: var(--june-accent);
    box-shadow: 0 0 5px color-mix(in srgb, var(--june-accent) 35%, transparent);
}
.june-hslider .june-thumb {
    position: absolute;
    top: 50%;
    left: calc(6px + (100% - 12px) * var(--june-ratio, .5));
    width: 10px;
    height: 10px;
    transform: translate(-50%, -50%);
    border-radius: 50%;
    background: var(--june-accent);
    box-shadow:
        0 0 0 1px color-mix(in srgb, #000000 55%, transparent),
        0 0 6px color-mix(in srgb, var(--june-accent) 60%, transparent);
}
.june-hslider:focus-visible .june-thumb {
    outline: 2px solid var(--june-accent);
    outline-offset: 3px;
}
.june-hslider-value {
    min-width: 3ch;
    flex: 0 0 auto;
    color: var(--june-accent);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    letter-spacing: .04em;
    text-align: right;
}
`;

export class JuneHorizontalSlider {
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
        ensureStyles("june-hslider-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const ratio = ratioFromValue(value, range);
        const color = this.props.style?.color || PALETTE;
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText.trim()
            ? `<span class="june-hslider-label">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="june-hslider-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";

        return `
            <div class="june-hslider-widget"
                 style="--june-accent:${escapeHtml(color.accent || PALETTE.accent)}; --june-text:${escapeHtml(color.text || PALETTE.text)}; --june-muted:${escapeHtml(color.muted || PALETTE.muted)}; --june-track:${escapeHtml(color.track || PALETTE.track)}; --june-surface:${escapeHtml(color.surface || PALETTE.surface)}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                ${label}
                <div class="june-hslider" role="slider" tabindex="${this.props.active ? "0" : "-1"}" aria-disabled="${this.props.active ? "false" : "true"}"
                     aria-label="${escapeHtml(labelText || "Horizontal slider")}"
                     aria-orientation="horizontal"
                     aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}"
                     style="--june-ratio:${ratio.toFixed(4)};">
                    <span class="june-track" aria-hidden="true">
                        <span class="june-fill"></span>
                        <span class="june-thumb" aria-hidden="true"></span>
                    </span>
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
        if (widgetDiv.dataset.juneBound === "1") {
            return;
        }
        widgetDiv.dataset.juneBound = "1";
        this.widgetDiv = widgetDiv;

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".june-hslider"),
            onStart: () => {
                sendValue(this, getValue(this.props), "begin");
            },
            onMove: (event) => {
                const slider = widgetDiv.querySelector(".june-hslider");
                const track = slider?.querySelector(".june-track") || slider;
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
