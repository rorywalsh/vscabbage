// June kit — vertical slider.
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
} from "./juneKit.js";

const STYLES = `
.june-vslider-widget {
    --june-accent: #e0802c;
    --june-text: #d8d8d1;
    --june-muted: #8b8b84;
    --june-track: #1c1c1a;
    --june-surface: #3b3b37;
    box-sizing: border-box;
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 7px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    user-select: none;
    -webkit-user-select: none;
}
.june-vslider {
    position: relative;
    flex: 1 1 0;
    width: 100%;
    min-height: 24px;
    cursor: pointer;
    touch-action: none;
    outline: none;
}
.june-vslider .june-track {
    position: relative;
    display: block;
    box-sizing: border-box;
    width: 12px;
    height: 100%;
    margin: 0 auto;
    border: 1px solid color-mix(in srgb, var(--june-track) 62%, #000000);
    border-radius: 6px;
    background: linear-gradient(90deg,
        color-mix(in srgb, var(--june-track) 72%, #000000) 0%,
        var(--june-track) 100%);
    box-shadow:
        inset 0 1px 3px color-mix(in srgb, #000000 80%, transparent),
        0 0 0 1px color-mix(in srgb, #ffffff 3%, transparent);
}
.june-vslider .june-fill {
    position: absolute;
    left: 50%;
    bottom: 0;
    width: 3px;
    height: calc(6px + (100% - 12px) * var(--june-ratio, .5));
    transform: translateX(-50%);
    border-radius: 2px;
    background: var(--june-accent);
    box-shadow: 0 0 5px color-mix(in srgb, var(--june-accent) 35%, transparent);
}
.june-vslider .june-thumb {
    position: absolute;
    left: 50%;
    bottom: calc(6px + (100% - 12px) * var(--june-ratio, .5));
    width: 10px;
    height: 10px;
    transform: translate(-50%, 50%);
    border-radius: 50%;
    background: var(--june-accent);
    box-shadow:
        0 0 0 1px color-mix(in srgb, #000000 55%, transparent),
        0 0 6px color-mix(in srgb, var(--june-accent) 60%, transparent);
}
.june-vslider .june-thumb::after {
    display: none;
}
.june-vslider:focus-visible .june-thumb {
    outline: 2px solid var(--june-accent);
    outline-offset: 3px;
}
.june-vslider-label {
    color: var(--june-text);
    font-size: 10px;
    font-weight: 600;
    letter-spacing: .14em;
    line-height: 1.2;
    text-transform: uppercase;
    white-space: nowrap;
}
.june-vslider-value {
    min-width: 3ch;
    flex: 0 0 auto;
    color: var(--june-accent);
    font-size: 10px;
    font-variant-numeric: tabular-nums;
    letter-spacing: .04em;
    text-align: center;
}
`;

export class JuneVerticalSlider {
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
        ensureStyles("june-vslider-styles", STYLES);

        const range = getRange(this.props);
        const value = getValue(this.props);
        const ratio = ratioFromValue(value, range);
        const color = this.props.style?.color || PALETTE;
        const labelText = typeof this.props.label?.text === "string" ? this.props.label.text : "";
        const label = labelText.trim()
            ? `<span class="june-vslider-label">${escapeHtml(labelText)}</span>`
            : "";
        const valueText = this.props.valueText?.visible !== false
            ? `<output class="june-vslider-value">${escapeHtml(formatValue(value, this.props, range))}</output>`
            : "";

        return `
            <div class="june-vslider-widget"
                 style="--june-accent:${escapeHtml(color.accent || PALETTE.accent)}; --june-text:${escapeHtml(color.text || PALETTE.text)}; --june-muted:${escapeHtml(color.muted || PALETTE.muted)}; --june-track:${escapeHtml(color.track || PALETTE.track)}; --june-surface:${escapeHtml(color.surface || PALETTE.surface)}; opacity:${this.props.style?.opacity ?? 1}; display:${this.props.visible ? "flex" : "none"}; pointer-events:${this.props.visible && this.props.active ? "auto" : "none"};">
                <div class="june-vslider" role="slider" tabindex="${this.props.active ? "0" : "-1"}" aria-disabled="${this.props.active ? "false" : "true"}"
                     aria-label="${escapeHtml(labelText || "Vertical slider")}"
                     aria-orientation="vertical"
                     aria-valuemin="${range.min}" aria-valuemax="${range.max}" aria-valuenow="${value}"
                     style="--june-ratio:${ratio.toFixed(4)};">
                    <span class="june-track" aria-hidden="true">
                        <span class="june-fill"></span>
                        <span class="june-thumb" aria-hidden="true"></span>
                    </span>
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

        attachPointerDrag(widgetDiv, {
            shouldStart: (event) => !!event.target.closest(".june-vslider"),
            onStart: () => {
                sendValue(this, getValue(this.props), "begin");
            },
            onMove: (event) => {
                const slider = widgetDiv.querySelector(".june-vslider");
                const track = slider?.querySelector(".june-track") || slider;
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
