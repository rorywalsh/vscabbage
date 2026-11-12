// Shared helpers for the June widget kit.
// This file is not a widget: it exports functions only, so discovery ignores it.

import { Cabbage } from "cabbage";
import { CabbageUtils } from "cabbage/utils.js";
import { getCabbageMode } from "cabbage/sharedState.js";

const injectedStyles = new Set();

/**
 * The June dark palette. Widgets use these as their default color props;
 * every value can still be overridden per widget from the property panel.
 */
export const PALETTE = {
    accent: "#94D200",
    text: "#d8d8d1",
    muted: "#8b8b84",
    track: "#1c1c1a",
    surface: "#3b3b37",
};

/** Full palette for knobs and sliders. */
export function sliderColors() {
    return { ...PALETTE };
}

/** Combo boxes use the full palette so their borders and menus follow the kit. */
export function comboColors() {
    return { ...PALETTE };
}

/** Checkboxes/buttons use the full palette so their edges and labels follow the kit. */
export function toggleColors() {
    return { ...PALETTE };
}

/**
 * Injects a kit stylesheet once per module/document.
 * The CSS lives in the widget file that calls this, not in a shared theme file.
 */
export function ensureStyles(id, css) {
    if (injectedStyles.has(id)) {
        return;
    }
    if (typeof document === "undefined" || !document.head) {
        return;
    }
    if (document.getElementById(id)) {
        injectedStyles.add(id);
        return;
    }
    const style = document.createElement("style");
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
    injectedStyles.add(id);
}

/**
 * Re-renders a widget while keeping keyboard focus on its interactive
 * element. `getInnerHTML()` replaces the focused node, so without this a
 * slider loses focus after a single arrow-key press.
 */
export function updateInnerHTMLPreservingFocus(widget, selector = '[role="slider"]') {
    const activeElement = typeof document !== "undefined" ? document.activeElement : null;
    const container = widget.widgetDiv
        || (typeof document !== "undefined" ? CabbageUtils.getWidgetDiv(widget.props) : null);
    const shouldRestore = !!(widget.props?.active !== false
        && activeElement && container && container.contains(activeElement));

    CabbageUtils.updateInnerHTML(widget.props, widget);

    if (shouldRestore) {
        const next = container.querySelector(selector);
        if (next && typeof next.focus === "function") {
            next.focus({ preventScroll: true });
        }
    }
}

export function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
    }[ch]));
}

export function isEditMode() {
    return getCabbageMode() === "draggable";
}

export function baseProps(type, overrides = {}) {
    return {
        bounds: { top: 10, left: 10, width: 100, height: 100 },
        channels: [{
            id: type,
            event: "valueChanged",
            range: { defaultValue: 0, increment: 0.001, max: 1, min: 0, skew: 1 },
        }],
        value: null,
        zIndex: 0,
        visible: true,
        active: true,
        automatable: true,
        type,
        persistence: { preset: true, session: true },
        label: { text: "" },
        valueText: { visible: true, width: "auto", prefix: "", postfix: "" },
        style: { opacity: 1 },
        ...overrides,
    };
}

export function getRange(props, index = 0, interaction = "drag") {
    return CabbageUtils.getChannelRange(props, index, interaction);
}

export function getValue(props, interaction = "drag") {
    const range = getRange(props, 0, interaction);
    const raw = props.channels?.[0]?.range?.value;
    const parsed = Number(raw);
    const value = Number.isFinite(parsed) ? parsed : Number(range.defaultValue) || 0;
    const min = Number(range.min) || 0;
    const max = Number(range.max) || 0;
    return CabbageUtils.clamp(value, min, max);
}

export function snapValue(value, range) {
    const min = Number(range.min) || 0;
    const max = Number(range.max) || 0;
    const increment = Number(range.increment);
    let next = CabbageUtils.clamp(Number(value), min, max);
    if (Number.isFinite(increment) && increment > 0) {
        next = Math.round(next / increment) * increment;
        next = CabbageUtils.clamp(next, min, max);
    }
    return next;
}

export function formatValue(value, props, range) {
    const increment = Number(range?.increment);
    const places = Number.isFinite(increment) && increment > 0
        ? CabbageUtils.getDecimalPlaces(increment)
        : 0;
    const prefix = props.valueText?.prefix || "";
    const postfix = props.valueText?.postfix || "";
    return `${prefix}${Number(value).toFixed(places)}${postfix}`;
}

/**
 * Position ratio (0..1) for a value, taking skew into account. This is the
 * inverse of valueFromRatio: skewed ranges move the thumb/fill/arc in linear
 * position space.
 */
export function ratioFromValue(value, range) {
    const min = Number(range.min) || 0;
    const max = Number(range.max) || 0;
    if (max === min) {
        return 0;
    }
    const normalized = CabbageUtils.clamp((Number(value) - min) / (max - min), 0, 1);
    const skew = Number(range.skew);
    const safeSkew = Number.isFinite(skew) && skew > 0 ? skew : 1;
    return Math.pow(normalized, safeSkew);
}

export function valueFromRatio(ratio, range) {
    const min = Number(range.min) || 0;
    const max = Number(range.max) || 0;
    const skew = Number(range.skew);
    const safeSkew = Number.isFinite(skew) && skew > 0 ? skew : 1;
    const normalized = Math.pow(CabbageUtils.clamp(Number(ratio), 0, 1), 1 / safeSkew);
    return min + normalized * (max - min);
}

export function sendValue(widget, value, gesture = "value") {
    Cabbage.sendControlData({
        channel: CabbageUtils.getChannelId(widget.props),
        value,
        gesture,
    }, widget.vscode);
}

/**
 * Updates the channel value, re-renders the widget and sends control data.
 * Returns the snapped value.
 */
export function setValue(widget, value, gesture = "value", render = true) {
    // Keyboard events still reach a widget whose pointer-events are disabled.
    // Refuse to change or send a value when the widget is inactive.
    if (widget.props?.active === false) {
        return getValue(widget.props);
    }

    const range = getRange(widget.props);
    const next = snapValue(value, range);
    const channel = widget.props.channels?.[0];
    if (channel) {
        if (!channel.range) {
            channel.range = range;
        }
        channel.range.value = next;
    }
    if (render) {
        updateInnerHTMLPreservingFocus(widget, '[role="slider"]');
    }
    sendValue(widget, next, gesture);
    return next;
}

/**
 * Adds pointer-down/move/up handling to a widget div. Callbacks can query the
 * DOM each time, so re-rendering the widget's innerHTML during a drag is safe.
 */
export function attachPointerDrag(widgetDiv, handlers = {}) {
    let pointerId = null;

    const move = (event) => {
        if (event.pointerId !== pointerId) {
            return;
        }
        handlers.onMove?.(event);
    };

    const finish = (event) => {
        if (event?.pointerId !== pointerId) {
            return;
        }
        const endingId = pointerId;
        pointerId = null;
        try {
            widgetDiv.releasePointerCapture(endingId);
        } catch {
            // Pointer capture may already have been released.
        }
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", finish);
        window.removeEventListener("pointercancel", finish);
        handlers.onEnd?.(event);

        // A mouse/touch drag focuses the slider div. Release it so the
        // performance keyboard keeps receiving ASCII note keys.
        const slider = widgetDiv.querySelector('[role="slider"]');
        if (slider && typeof slider.blur === "function") {
            slider.blur();
        }
    };

    const start = (event) => {
        if (!event.isPrimary || event.button !== 0 || isEditMode()) {
            return;
        }
        if (handlers.shouldStart && !handlers.shouldStart(event)) {
            return;
        }
        pointerId = event.pointerId;
        try {
            widgetDiv.setPointerCapture(event.pointerId);
        } catch {
            // Ignore; pointer capture is optional.
        }
        window.addEventListener("pointermove", move);
        window.addEventListener("pointerup", finish);
        window.addEventListener("pointercancel", finish);
        handlers.onStart?.(event);
        handlers.onMove?.(event);
        event.preventDefault();
    };

    widgetDiv.addEventListener("pointerdown", start);
}

/**
 * Keyboard support shared by the sliders. The focused control should have
 * tabindex="0" and the keydown event should bubble to the widget div.
 */
export function attachKeyboard(widgetDiv, getRangeFn, getValueFn, onChange) {
    widgetDiv.addEventListener("keydown", (event) => {
        if (isEditMode()) {
            return;
        }

        const range = getRangeFn();
        const current = Number(getValueFn());
        const min = Number(range.min) || 0;
        const max = Number(range.max) || 0;
        const increment = Number(range.increment);
        const baseStep = Number.isFinite(increment) && increment > 0
            ? increment
            : (max - min) / 100;
        const step = event.shiftKey ? baseStep * 10 : baseStep;

        let next = null;
        switch (event.key) {
            case "ArrowUp":
            case "ArrowRight":
                next = current + step;
                break;
            case "ArrowDown":
            case "ArrowLeft":
                next = current - step;
                break;
            case "PageUp":
                next = current + baseStep * 10;
                break;
            case "PageDown":
                next = current - baseStep * 10;
                break;
            case "Home":
                next = min;
                break;
            case "End":
                next = max;
                break;
            default:
                return;
        }

        event.preventDefault();
        onChange(next);
    });
}
