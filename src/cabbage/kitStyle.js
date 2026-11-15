// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Returns a copy of `props` with the style properties listed in the widget's
 * `hiddenProps` removed. Preset kit widgets lock their captured style so that
 * the backend's default `style` (sent with every widget update) can't overwrite
 * it. Only `style.*` paths are stripped; layout and identity keys (bounds,
 * channels, label, valueText, …) still come from the .csd.
 *
 * Kept in a small, dependency-free module so the merge/strip semantics can be
 * unit tested without pulling in the full widget manager.
 *
 * @param {object} props The incoming widget JSON to strip.
 * @param {string[]} [hiddenProps] Locked property paths (dot notation).
 * @returns {object} A stripped copy, or the original when nothing is locked.
 */
export function stripLockedStyleProps(props, hiddenProps) {
    if (!Array.isArray(hiddenProps) || hiddenProps.length === 0) {
        return props;
    }
    const lockedStyle = hiddenProps.filter((h) => typeof h === 'string' && h.startsWith('style.'));
    if (lockedStyle.length === 0) {
        return props;
    }
    const clone = JSON.parse(JSON.stringify(props || {}));
    for (const path of lockedStyle) {
        const parts = path.split('.');
        let node = clone;
        for (let i = 0; i < parts.length - 1; i++) {
            if (!node || typeof node !== 'object') { node = null; break; }
            node = node[parts[i]];
        }
        if (node && typeof node === 'object') {
            delete node[parts[parts.length - 1]];
        }
    }
    if (clone.style && typeof clone.style === 'object' && Object.keys(clone.style).length === 0) {
        delete clone.style;
    }
    return clone;
}
