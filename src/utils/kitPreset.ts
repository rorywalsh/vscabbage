// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Helpers for turning a customised built-in widget into a widget-kit preset.
 *
 * A preset is a tiny subclass of the built-in widget class. It reuses the
 * built-in renderer and interaction code (so future fixes keep applying) and
 * only overrides default `props` with the captured appearance. Properties the
 * user leaves unchecked are added to `hiddenProps`, which locks them in the
 * property panel.
 *
 * This module is deliberately free of `vscode` imports so it can be exercised
 * by the plain mocha unit tests in `src/test/unit`.
 */

import { BUILT_IN_WIDGET_CLASS_NAMES } from './widgetKitExport';

/**
 * Top-level props that stay editable in the property panel by default. Every
 * other property starts unchecked (locked) so the captured "skin" is stable.
 */
export const DEFAULT_EDITABLE_TOP_LEVEL = new Set([
    'label',
    'visible',
    'active',
    'automatable',
]);

/**
 * Props that never appear in the property picker: either they are rendered by
 * a dedicated property-panel section (bounds/channels/type/id) or they are
 * runtime/internal fields that should not be exposed.
 */
const PICKER_HIDDEN_TOP_LEVEL = new Set([
    'bounds',
    'channels',
    'type',
    'id',
    'parameterIndex',
    'children',
    'currentCsdFile',
    'value',
    'originalProps',
    'groupBaseBounds',
    'origBounds',
    'samples',
    'channel',
]);

/**
 * Per-instance props that must never become kit defaults. Removing them lets
 * the built-in defaults (or the CSD on insert) win instead.
 */
const PER_INSTANCE_TOP_LEVEL = new Set([
    'id',
    'zIndex',
    'currentCsdFile',
    'parameterIndex',
    'samples',
    'value',
    'originalProps',
    'groupBaseBounds',
    'origBounds',
    'children',
    'channel',
]);

/**
 * Internal props hidden from the property panel for every widget (mirrors the
 * default list in `propertyPanel.js`). Preset widgets override `hiddenProps`,
 * so these have to be re-declared or they would start showing up.
 */
const BASE_HIDDEN_PROPS = [
    'parameterIndex',
    'children',
    'currentCsdFile',
    'value',
];

/** A single row in the "keep editable" picker. */
export interface EditablePropEntry {
    /** Dot path used by `hiddenProps`, e.g. `style.on.backgroundColor`. */
    path: string;
    /** Short preview of the captured value, shown alongside the row. */
    description: string;
    /** Whether the row starts checked (editable). */
    editableByDefault: boolean;
}

function isPlainObject(value: unknown): value is Record<string, any> {
    return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** Deep-clones JSON-safe data (widget props are data). */
function cloneJson<T>(value: T): T {
    return JSON.parse(JSON.stringify(value));
}

/** Formats a captured value for display in the picker. */
function describeValue(value: unknown): string {
    if (typeof value === 'string') {
        return value.length > 60 ? `${value.slice(0, 57)}…` : value;
    }
    if (value === null) {
        return 'null';
    }
    if (Array.isArray(value)) {
        return `[${value.length} item${value.length === 1 ? '' : 's'}]`;
    }
    if (typeof value === 'object') {
        return '{…}';
    }
    return String(value);
}

/**
 * Flattens a widget's props into dot-path rows for the editable-property
 * picker. Bounds, channels and identity/runtime fields are skipped because the
 * property panel always renders them (or should never expose them).
 *
 * @param props Expanded widget props
 * @returns Rows in declaration order, with default check state applied
 */
export function flattenPropsForPicker(props: Record<string, any>): EditablePropEntry[] {
    const rows: EditablePropEntry[] = [];

    const addRow = (path: string, value: unknown) => {
        const topLevel = path.split(/[.[]/, 1)[0];
        rows.push({
            path,
            description: describeValue(value),
            editableByDefault: DEFAULT_EDITABLE_TOP_LEVEL.has(topLevel),
        });
    };

    const walk = (path: string, value: any) => {
        if (isPlainObject(value)) {
            const entries = Object.entries(value);
            if (entries.length === 0) {
                addRow(path, value);
                return;
            }
            for (const [key, child] of entries) {
                walk(`${path}.${key}`, child);
            }
            return;
        }
        addRow(path, value);
    };

    for (const [key, value] of Object.entries(props)) {
        if (PICKER_HIDDEN_TOP_LEVEL.has(key)) {
            continue;
        }
        walk(key, value);
    }

    return rows;
}

/**
 * Returns the subset of props that is safe to bake into a kit preset.
 * Per-instance values (position, channel id, current value, zIndex, …) are
 * removed so they keep the built-in defaults or come from the CSD on insert.
 *
 * @param props Expanded widget props
 * @returns A deep-cloned props object suitable for the generated preset
 */
export function toKitPresetProps(props: Record<string, any>): Record<string, any> {
    const preset = cloneJson(props || {});

    for (const key of PER_INSTANCE_TOP_LEVEL) {
        delete preset[key];
    }

    if (isPlainObject(preset.bounds)) {
        delete preset.bounds.top;
        delete preset.bounds.left;
    }

    if (Array.isArray(preset.channels)) {
        preset.channels = preset.channels.map((channel: any) => {
            if (!isPlainObject(channel)) {
                return channel;
            }
            const out = cloneJson(channel);
            delete out.id;
            if (isPlainObject(out.range)) {
                delete out.range.value;
            }
            return out;
        });
    }

    return preset;
}

/**
 * Merges unchecked picker paths into the base hidden props. Identity fields
 * are always hidden so a kit widget cannot be retyped by accident.
 *
 * @param uncheckedPaths Paths the user left unchecked (lock in the panel)
 * @returns Deduplicated `hiddenProps` list
 */
export function buildHiddenProps(uncheckedPaths: string[]): string[] {
    return Array.from(new Set([...BASE_HIDDEN_PROPS, 'type', 'id', ...uncheckedPaths]));
}

export interface BuildKitWidgetSourceOptions {
    /** Built-in widget type being themed, e.g. `button`. */
    type: string;
    /** Class name to export from the generated file. */
    className: string;
    /** Captured props (already passed through `toKitPresetProps`). */
    preset: Record<string, any>;
    /** `hiddenProps` for the generated class. */
    hiddenProps: string[];
    /** Kit display name, used only in the header comment. */
    kitName?: string;
}

/**
 * Builds the source for a kit preset widget file.
 *
 * @param options Generation options
 * @returns JavaScript module source
 * @throws When the type does not map to a built-in widget class
 */
export function buildKitWidgetSource(options: BuildKitWidgetSourceOptions): string {
    const { type, className, preset, hiddenProps, kitName } = options;
    const baseClass = BUILT_IN_WIDGET_CLASS_NAMES[type];
    if (!baseClass) {
        throw new Error(`Unsupported built-in widget type: ${type}`);
    }

    const presetJson = JSON.stringify(preset, null, 4);
    const hiddenJson = JSON.stringify(hiddenProps, null, 4);
    const owner = kitName ? ` for kit "${kitName}"` : '';

    return `// Themed "${type}" widget${owner}.
// Generated by Cabbage "Add to Custom Kit" from a built-in widget.
// The built-in ${baseClass} class supplies rendering and interaction, so it keeps
// receiving upstream fixes; PRESET below captures the customised appearance.
//
// cabbage-widget-type: ${type}

import { CabbageUtils } from "cabbage/utils.js";
import { ${baseClass} } from "cabbage/widgets/${type}.js";

export class ${className} extends ${baseClass} {
    static widgetType = ${JSON.stringify(type)};

    constructor() {
        super();
        // Start from this widget's built-in defaults, then layer the captured
        // preset over them, and re-wrap the result reactively.
        const base = JSON.parse(JSON.stringify(this.props));
        this.props = CabbageUtils.createReactiveProps(this, deepMerge(base, PRESET));
        // Merge with any widget-specific hidden props, then lock the captured
        // properties that were left unchecked.
        this.hiddenProps = Array.from(new Set([...(this.hiddenProps || []), ...HIDDEN_PROPS]));
    }
}

/** Deep-merges plain objects; arrays and primitives replace the target value. */
function deepMerge(target, source) {
    for (const key of Object.keys(source || {})) {
        const value = source[key];
        if (value && typeof value === 'object' && !Array.isArray(value)) {
            if (!target[key] || typeof target[key] !== 'object') {
                target[key] = {};
            }
            deepMerge(target[key], value);
        } else if (value !== undefined) {
            target[key] = value;
        }
    }
    return target;
}

const PRESET = ${presetJson};

const HIDDEN_PROPS = ${hiddenJson};
`;
}
