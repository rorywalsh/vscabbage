// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Helpers for the plugin export save path.
 *
 * VS Code's save dialog does not reliably append the filter's extension on
 * Linux. A VST3 bundle saved as `~/.vst3/RotaryNotary` (without `.vst3`) is
 * never discovered by hosts such as REAPER, even though the binary and bundle
 * layout inside are valid. These helpers enforce the required extension before
 * the bundle is copied or renamed.
 */

/** Required on-disk extension for a plugin export type. */
export function pluginExtensionForType(type: string): string {
    if (type.includes('AUv2')) {
        return '.component';
    }
    if (type.includes('CLAP')) {
        return '.clap';
    }
    return '.vst3';
}

/**
 * Returns `filePath` with the plugin extension appended when the user omitted
 * it. Existing extensions are matched case-insensitively, so `Foo.VST3` is
 * left alone.
 */
export function ensurePluginExtension(filePath: string, type: string): string {
    const extension = pluginExtensionForType(type);
    return filePath.toLowerCase().endsWith(extension) ? filePath : `${filePath}${extension}`;
}

/**
 * Base plugin name for a destination path, with the plugin extension removed.
 * Works for both POSIX and Windows separators so it can be unit-tested on any
 * host.
 */
export function pluginNameFromPath(filePath: string, type: string): string {
    const extension = pluginExtensionForType(type);
    const baseName = filePath.split(/[\\/]/).pop() ?? filePath;
    return baseName.toLowerCase().endsWith(extension)
        ? baseName.slice(0, -extension.length)
        : baseName;
}
