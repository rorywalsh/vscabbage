// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import type { ChannelValueType, DetectedChannel, WidgetHint } from './channelScanner';

/** Default numeric range used when a hint does not supply one. */
export interface WidgetRange {
    min: number;
    max: number;
    defaultValue: number;
    value: number;
    increment: number;
    skew: number;
}

interface WidgetSize {
    width: number;
    height: number;
}

const DEFAULT_SIZE: WidgetSize = { width: 140, height: 40 };

const SIZE_BY_TYPE: Record<string, WidgetSize> = {
    rotarySlider: { width: 80, height: 90 },
    horizontalSlider: { width: 160, height: 40 },
    horizontalRangeSlider: { width: 200, height: 40 },
    verticalSlider: { width: 80, height: 140 },
    numberSlider: { width: 100, height: 30 },
    button: { width: 100, height: 30 },
    checkBox: { width: 126, height: 24 },
    comboBox: { width: 160, height: 30 },
    listBox: { width: 160, height: 100 },
    fileButton: { width: 140, height: 30 },
    label: { width: 160, height: 24 },
    textEditor: { width: 200, height: 80 },
    genTable: { width: 300, height: 150 },
    keyboard: { width: 500, height: 100 },
    image: { width: 120, height: 120 },
};

/** Widget types whose channel carries a string rather than a range. */
const STRING_CHANNEL_TYPES = new Set(['fileButton', 'textEditor']);

/** Widget types that identify themselves by id only (no value channel). */
const ID_ONLY_TYPES = new Set(['genTable', 'image']);

const SUFFIX_RE = /(slider|fader|knob|dial|button|btn|checkbox|check|toggle|switch|combobox|combo|selector|listbox|list|filebutton|file|gentable|table|keyboard|keys|label|text|image|img|value|channel|chan|id)\d*$/i;

/**
 * Build a human-readable label from a channel name, e.g. `bpmSlider` -> "Bpm"
 * and `toggleFreq` -> "Toggle Freq".
 */
export function humanizeChannelName(channel: string): string {
    const stripped = channel.replace(SUFFIX_RE, '');
    const base = stripped.length >= 2 ? stripped : channel;
    const words = base
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_\-.]+/g, ' ')
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0);

    if (words.length === 0) {
        return channel;
    }

    return words
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Infer a widget type from a channel name and its coarse value type. Used as
 * the fallback when no explicit `@widget` hint is present.
 */
export function inferWidgetType(channel: string, valueType: ChannelValueType): string {
    const lower = channel.toLowerCase();

    if (/keyboard|keys$/.test(lower)) {
        return 'keyboard';
    }
    if (/table/.test(lower)) {
        return 'genTable';
    }
    if (/file/.test(lower)) {
        return 'fileButton';
    }
    if (/combobox|combo|selector/.test(lower)) {
        return 'comboBox';
    }
    if (/listbox|list$/.test(lower)) {
        return 'listBox';
    }
    if (/checkbox|check|toggle|switch/.test(lower)) {
        return 'checkBox';
    }
    if (/trigger|bang|button|btn|start|stop|play|pause|mute|solo|reset|save|load|randomi[sz]e|shuffle|clear/.test(lower)) {
        return 'button';
    }
    if (/slider|fader/.test(lower)) {
        return 'horizontalSlider';
    }
    if (/knob|dial/.test(lower)) {
        return 'rotarySlider';
    }
    if (/label|text/.test(lower)) {
        return 'label';
    }
    if (/image|img/.test(lower)) {
        return 'image';
    }

    // `CabbageNumTrig` is used for any numeric widget whose value is observed
    // for changes (sliders included), so it is a weak signal. Strings, on the
    // other hand, are almost always one of the string-valued widgets.
    if (valueType === 'trigger-string' || valueType === 'string') {
        return 'comboBox';
    }
    return 'horizontalSlider';
}

function baseRange(type: string): WidgetRange {
    if (type === 'button' || type === 'checkBox' || type === 'comboBox' || type === 'listBox') {
        return { min: 0, max: 1, defaultValue: 0, value: 0, increment: 1, skew: 1 };
    }
    return { min: 0, max: 1, defaultValue: 0, value: 0, increment: 0.001, skew: 1 };
}

function rangeFor(type: string, hint: WidgetHint | undefined): WidgetRange {
    const base = baseRange(type);
    if (!hint?.range) {
        return base;
    }
    return {
        min: hint.range.min,
        max: hint.range.max,
        defaultValue: hint.range.value,
        value: hint.range.value,
        increment: hint.range.increment ?? base.increment,
        skew: hint.range.skew ?? base.skew,
    };
}

function buildChannel(type: string, detected: DetectedChannel): Record<string, unknown> {
    const channel: Record<string, unknown> = {
        id: detected.channel,
        event: 'valueChanged',
    };

    if (STRING_CHANNEL_TYPES.has(type)) {
        channel.type = 'string';
        return channel;
    }
    if (ID_ONLY_TYPES.has(type) || type === 'label') {
        return channel;
    }
    channel.range = rangeFor(type, detected.hint);
    return channel;
}

/**
 * Turn a detected channel into a Cabbage widget object.
 */
export function channelToWidget(detected: DetectedChannel): Record<string, any> {
    const type = detected.hint?.type || inferWidgetType(detected.channel, detected.valueType);
    const size = SIZE_BY_TYPE[type] ?? DEFAULT_SIZE;

    const widget: Record<string, any> = {
        type,
        id: detected.channel,
        bounds: { left: 0, top: 0, width: size.width, height: size.height },
        channels: ID_ONLY_TYPES.has(type) ? [] : [buildChannel(type, detected)],
        label: { text: humanizeChannelName(detected.channel) },
    };

    if (type === 'comboBox' || type === 'listBox') {
        widget.items = [];
    }
    if (type === 'genTable') {
        widget.tableNumber = 1;
    }

    return widget;
}

/**
 * Lay widgets out in a simple flow grid. Mutates each widget's `bounds`.
 *
 * @param widgets  Widgets to lay out (normally excludes the form).
 * @param formWidth Available width.
 * @param startY    Top of the first row.
 * @param margin    Outer margin.
 * @param gap       Spacing between widgets.
 */
export function layoutWidgets(
    widgets: Array<Record<string, any>>,
    formWidth = 600,
    startY = 10,
    margin = 10,
    gap = 10
): void {
    let x = margin;
    let y = startY;
    let rowHeight = 0;

    for (const widget of widgets) {
        const width = widget.bounds?.width ?? DEFAULT_SIZE.width;
        const height = widget.bounds?.height ?? DEFAULT_SIZE.height;

        if (x > margin && x + width > formWidth - margin) {
            x = margin;
            y += rowHeight + gap;
            rowHeight = 0;
        }

        widget.bounds = { left: x, top: y, width, height };
        x += width + gap;
        rowHeight = Math.max(rowHeight, height);
    }
}

/** Grow the form so the laid-out widgets fit, without shrinking it. */
export function fitFormHeight(
    form: Record<string, any> | undefined,
    widgets: Array<Record<string, any>>,
    margin = 10
): void {
    if (!form) {
        return;
    }
    let maxBottom = 0;
    for (const widget of widgets) {
        maxBottom = Math.max(maxBottom, (widget.bounds?.top ?? 0) + (widget.bounds?.height ?? 0));
    }
    if (maxBottom === 0) {
        return;
    }
    if (!form.size || typeof form.size !== 'object') {
        form.size = { width: 600, height: 300 };
    }
    form.size.height = Math.max(form.size.height ?? 300, maxBottom + margin);
}

/** Bottom-most edge of a set of widgets (used to place new widgets below them). */
export function bottomOfWidgets(widgets: Array<Record<string, any>>): number {
    let maxBottom = 0;
    for (const widget of widgets) {
        if (!widget || widget.type === 'form') {
            continue;
        }
        maxBottom = Math.max(maxBottom, (widget.bounds?.top ?? 0) + (widget.bounds?.height ?? 0));
    }
    return maxBottom;
}
