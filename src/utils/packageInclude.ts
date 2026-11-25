// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import path from 'path';

/**
 * Helpers for resolving `package.include` entries during plugin export.
 *
 * Every included file is copied to `destDir/dest`, preserving its path
 * relative to the include's source base. For a directory `src` the base is the
 * directory itself, so its internal folder structure is preserved. For a glob
 * pattern the base is the directory that contains the first wildcard segment.
 * For a single file the base is the file's parent directory, so the file keeps
 * its own name. Treating the file as the base (as the exporter used to) makes
 * the relative path empty, which turns `dest` into a file instead of a folder.
 */

/**
 * Returns the directory that included files should be made relative to.
 *
 * @param resolvedSrc Absolute source path or glob pattern.
 * @param isDirectory True when `resolvedSrc` is an existing directory.
 */
export function packageIncludeBase(resolvedSrc: string, isDirectory: boolean): string {
    if (isDirectory) {
        return resolvedSrc;
    }

    // Find the first glob metacharacter. `glob` supports `*`, `?`, `[...]` and
    // `{...}`, so any of these can start the non-literal part of the pattern.
    const wildcardIndex = resolvedSrc.search(/[*?[{]/);
    if (wildcardIndex === -1) {
        // A single explicit file: keep the file name in the destination.
        return path.dirname(resolvedSrc);
    }

    const prefix = resolvedSrc.slice(0, wildcardIndex);
    if (/[\\/]$/.test(prefix)) {
        // The wildcard starts a path segment, e.g. `/samples/*.wav`. Appending a
        // dummy segment lets path.dirname return the containing directory and
        // handles drive roots (`C:\`) correctly.
        return path.dirname(`${prefix}x`);
    }

    // The wildcard is part of a file name, e.g. `/samples/loop*.wav`. The base
    // is the directory containing that name, not the partial name itself.
    return path.dirname(prefix);
}

/** Normalised `package.include` entry. `dest` is empty for the resources root. */
export interface PackageIncludeEntry {
    src: string;
    dest: string;
}

/** Failure reasons for a raw `package.include` entry. */
export type PackageIncludeEntryError =
    /** The entry is not an object, or `src`/`dest` have the wrong type. */
    | 'invalid'
    /** `dest` is an absolute path; only relative destinations are allowed. */
    | 'absolute-dest';

export type PackageIncludeEntryResult =
    | { ok: true; entry: PackageIncludeEntry }
    | { ok: false; error: PackageIncludeEntryError; dest?: string };

/**
 * Validates a raw `package.include` entry and applies defaults.
 *
 * `dest` is optional. When omitted, files are copied to the top level of the
 * exported plugin's resources directory, as described in the Cabbage docs.
 */
export function normalizePackageIncludeEntry(raw: unknown): PackageIncludeEntryResult {
    if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
        return { ok: false, error: 'invalid' };
    }

    const candidate = raw as { src?: unknown; dest?: unknown };
    const rawSrc = candidate.src;
    const rawDest = candidate.dest;
    if (typeof rawSrc !== 'string' || rawSrc.length === 0) {
        return { ok: false, error: 'invalid' };
    }

    let dest = '';
    if (typeof rawDest === 'string') {
        dest = rawDest;
    } else if (rawDest !== undefined && rawDest !== null) {
        return { ok: false, error: 'invalid' };
    }

    if (path.isAbsolute(dest)) {
        return { ok: false, error: 'absolute-dest', dest };
    }

    return { ok: true, entry: { src: rawSrc, dest } };
}

