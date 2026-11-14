/**
 * Pure helpers for merging and identifying widget JSON objects. Extracted from
 * the extension host so the merge semantics can be unit tested directly.
 */

export interface DeepMergeOptions {
    /**
     * When true, a `null` value in `source` deletes the key from the result.
     * The property panel uses null as a removal signal; callers that should
     * preserve nulls (external JSON updates) leave this off.
     */
    deleteOnNull?: boolean;
}

/**
 * Recursively merges `source` into `target`.
 *
 * - `undefined` values are skipped.
 * - Arrays in `source` replace the target array.
 * - Nested plain objects are merged recursively.
 * - `null` deletes the key when `deleteOnNull` is set, otherwise it is stored.
 *
 * The inputs are never mutated.
 */
export function deepMerge(target: any, source: any, options: DeepMergeOptions = {}): any {
    if (source === undefined) { return target; }
    if (Array.isArray(source)) { return source; }
    if (typeof target !== 'object' || target === null) { return source; }

    const out: any = Array.isArray(target) ? [...target] : { ...target };
    Object.keys(source).forEach((key) => {
        const value = source[key];
        if (value === undefined) { return; }

        if (options.deleteOnNull && value === null) {
            delete out[key];
            return;
        }

        if (
            typeof value === 'object' && value !== null && !Array.isArray(value)
            && typeof out[key] === 'object' && out[key] !== null && !Array.isArray(out[key])
        ) {
            out[key] = deepMerge(out[key], value, options);
        } else {
            out[key] = value;
        }
    });
    return out;
}

/**
 * Extracts the identifier used to match a widget: an explicit `id`, the first
 * `channels[].id`, or a legacy `channel` string.
 */
export function getWidgetChannelId(widget: any): string {
    if (!widget) { return ''; }
    if (widget.id) { return widget.id; }
    if (widget.channels) {
        if (Array.isArray(widget.channels) && widget.channels[0] && widget.channels[0].id) {
            return widget.channels[0].id;
        }
        if (typeof widget.channels === 'object' && widget.channels[0] && widget.channels[0].id) {
            return widget.channels[0].id;
        }
    }
    return widget.channel || '';
}
