// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Custom widget discovery.
 *
 * Scans a custom widget directory for `.js` files that export a widget class.
 * Scanning is recursive so users can group widgets into category subfolders
 * (for example `widgets/sliders/MyKnob.js`).
 *
 * This module is deliberately free of `vscode` imports so it can be exercised
 * by the plain mocha unit tests in `src/test/unit`.
 */

import fs from 'fs';
import path from 'path';

export interface WidgetFileInfo {
    /**
     * Path of the widget file relative to the scanned directory, using
     * forward slashes (for example `sliders/MyKnob.js`). Widgets sitting
     * directly in the scanned directory are just `MyKnob.js`.
     */
    filename: string;
    /**
     * First path segment for a nested widget (`sliders` in
     * `sliders/MyKnob.js`), or an empty string when the widget sits directly
     * in the scanned directory.
     */
    category: string;
    className: string;
    widgetType: string;
}

export interface WidgetInfo {
    className: string;
    widgetType: string;
}

/**
 * Built-in widget types. Files that declare one of these are ignored so a
 * stale copy of a built-in widget in a custom folder can't shadow the real
 * one.
 */
const BUILT_IN_WIDGET_TYPES = new Set([
    'rotarySlider', 'horizontalSlider', 'horizontalRangeSlider', 'verticalSlider', 'numberSlider',
    'keyboard', 'form', 'button', 'fileButton', 'infoButton', 'optionButton',
    'genTable', 'label', 'image', 'listBox', 'comboBox', 'groupBox', 'checkBox',
    'csoundOutput', 'textEditor', 'xyPad',
]);

/** Number of files whose headers are read concurrently. */
const READ_CONCURRENCY = 6;

/** Only the first 16KB of a widget file is needed to find its metadata. */
const HEADER_BYTES = 16 * 1024;

/**
 * A genuine widget builds a `props` object in its constructor and gives it a
 * layout-ish key (`bounds`, `channels`, `zIndex`). Requiring this keeps helper
 * classes, web components and framework utilities from being registered as
 * widgets.
 */
const WIDGET_PROPS_OBJECT = /this\.props\s*=\s*\{/;
const WIDGET_LAYOUT_KEY = /["'](?:bounds|channels|zIndex)["']\s*:/;

/**
 * Framework folders that may exist inside a copied custom `widgets` folder but
 * never contain user widgets.
 */
const IGNORED_DIRECTORY_NAMES = new Set([
    'node_modules',
    'htmlElements',
]);

/** Reads a quoted JavaScript string starting at `start` (which points at the quote). */
function readString(source: string, start: number): { value: string; end: number } {
    const quote = source[start];
    let value = '';
    let i = start + 1;
    while (i < source.length) {
        const ch = source[i];
        if (ch === '\\') {
            value += source[i + 1] ?? '';
            i += 2;
            continue;
        }
        if (ch === quote) {
            return { value, end: i + 1 };
        }
        value += ch;
        i++;
    }
    return { value, end: i };
}

/**
 * Finds the widget's own `type` property inside the `this.props = { ... }`
 * literal. Nested objects (for example channel descriptors) also have `type`
 * keys, so only depth-1 string keys are considered.
 */
function findWidgetTypeInProps(content: string): string | null {
    const match = WIDGET_PROPS_OBJECT.exec(content);
    if (!match) {
        return null;
    }

    let i = content.indexOf('{', match.index);
    if (i < 0) {
        return null;
    }

    let depth = 0;
    while (i < content.length) {
        const ch = content[i];

        if (ch === '"' || ch === "'" || ch === '`') {
            const token = readString(content, i);
            if (depth === 1 && token.value === 'type') {
                let j = token.end;
                while (j < content.length && /\s/.test(content[j])) { j++; }
                if (content[j] === ':') {
                    j++;
                    while (j < content.length && /\s/.test(content[j])) { j++; }
                    const valueQuote = content[j];
                    if (valueQuote === '"' || valueQuote === "'" || valueQuote === '`') {
                        const value = readString(content, j).value;
                        if (/^[A-Za-z_$][\w$]*$/.test(value)) {
                            return value;
                        }
                    }
                }
            }
            i = token.end;
            continue;
        }

        if (ch === '/' && content[i + 1] === '/') {
            const newline = content.indexOf('\n', i);
            if (newline < 0) { break; }
            i = newline + 1;
            continue;
        }

        if (ch === '/' && content[i + 1] === '*') {
            const close = content.indexOf('*/', i + 2);
            if (close < 0) { break; }
            i = close + 2;
            continue;
        }

        if (ch === '{' || ch === '[' || ch === '(') {
            depth++;
            i++;
            continue;
        }

        if (ch === '}' || ch === ']' || ch === ')') {
            depth--;
            if (depth === 0) { break; }
            i++;
            continue;
        }

        i++;
    }

    return null;
}

/**
 * Returns true when a file name should be treated as a widget candidate.
 * Templates, tests, hidden files and non-JavaScript files are skipped.
 */
function isWidgetCandidate(name: string): boolean {
    return name.endsWith('.js')
        && !name.startsWith('.')
        && !name.includes('Template')
        && !name.includes('test');
}

/**
 * Returns true when a directory should not be descended into. Hidden
 * directories, `node_modules` and framework folders are ignored; symlinks are
 * never followed (handled by the caller) to avoid loops.
 */
function isIgnoredDirectory(name: string): boolean {
    return name.startsWith('.') || IGNORED_DIRECTORY_NAMES.has(name);
}

/**
 * Extracts widget class name and type from file content.
 * @param content The JavaScript file content
 * @returns Object with className and widgetType, or null
 */
export function extractWidgetInfoFromFile(content: string): WidgetInfo | null {
    try {
        // Match: export class ClassName
        const classMatch = content.match(/export\s+class\s+(\w+)/);
        if (!classMatch) {
            return null;
        }

        // Reject ordinary exported classes. A widget initialises `this.props`
        // with a layout-ish object in its constructor.
        if (!WIDGET_PROPS_OBJECT.test(content) || !WIDGET_LAYOUT_KEY.test(content)) {
            return null;
        }

        const className = classMatch[1];

        // Read the widget's own `type` key (depth 1 of the props object).
        // Falling back to the class name keeps older widgets working.
        const widgetType = findWidgetTypeInProps(content)
            ?? className.charAt(0).toLowerCase() + className.slice(1);

        return { className, widgetType };
    } catch (error) {
        console.error('Cabbage: Error extracting widget info:', error);
        return null;
    }
}

/**
 * Reads just the header of a widget file and extracts its metadata.
 * Returns null when the file cannot be read or does not export a widget.
 */
async function readWidgetInfo(filePath: string): Promise<WidgetInfo | null> {
    let handle: fs.promises.FileHandle | undefined;
    try {
        handle = await fs.promises.open(filePath, 'r');
        const buf = new Uint8Array(HEADER_BYTES);
        const { bytesRead } = await handle.read(buf, 0, buf.length, 0);
        const content = new TextDecoder('utf-8')
            .decode(buf.subarray(0, bytesRead))
            .replace(/\0/g, '');
        return extractWidgetInfoFromFile(content);
    } catch (err) {
        // Keep quiet by default to avoid spamming the extension host log,
        // but leave a debug breadcrumb.
        console.debug && console.debug(
            `Cabbage: scan read error ${filePath}:`,
            (err as any)?.message || err,
        );
        return null;
    } finally {
        if (handle) {
            await handle.close().catch(() => undefined);
        }
    }
}

interface CandidateFile {
    absolutePath: string;
    relativePath: string;
}

/**
 * Reads a batch of candidate files with bounded concurrency, preserving the
 * input order in the returned array (nulls for non-widgets).
 */
async function readWidgetInfos(files: CandidateFile[]): Promise<Array<WidgetFileInfo | null>> {
    const results: Array<WidgetFileInfo | null> = new Array(files.length).fill(null);
    let next = 0;

    const worker = async () => {
        while (next < files.length) {
            const index = next++;
            const file = files[index];
            const info = await readWidgetInfo(file.absolutePath);
            if (!info || BUILT_IN_WIDGET_TYPES.has(info.widgetType)) {
                continue;
            }
            const segments = file.relativePath.split('/');
            results[index] = {
                filename: file.relativePath,
                category: segments.length > 1 ? segments[0] : '',
                className: info.className,
                widgetType: info.widgetType,
            };
        }
    };

    const workerCount = Math.min(READ_CONCURRENCY, files.length);
    await Promise.all(new Array(workerCount).fill(0).map(() => worker()));
    return results;
}

/**
 * Recursively scans a directory for custom widget files.
 *
 * Subdirectories are treated as categories: a widget at
 * `sliders/MyKnob.js` is reported with `category: 'sliders'` and
 * `filename: 'sliders/MyKnob.js'`. Deeper nesting is allowed; the category is
 * always the first path segment.
 *
 * @param directory The absolute path to the directory to scan
 * @returns Array of widget file information objects, in stable path order
 */
export async function scanForCustomWidgets(directory: string): Promise<WidgetFileInfo[]> {
    const widgets: WidgetFileInfo[] = [];

    try {
        // Non-blocking check for existence
        const stat = await fs.promises.stat(directory).catch(() => null);
        if (!stat || !stat.isDirectory()) {
            return widgets;
        }

        // Breadth-first walk so shallow widgets are discovered first.
        const pending: Array<{ absolutePath: string; relativePath: string }> = [
            { absolutePath: directory, relativePath: '' },
        ];

        while (pending.length > 0) {
            const current = pending.shift()!;

            let dirents: fs.Dirent[];
            try {
                dirents = await fs.promises.readdir(current.absolutePath, { withFileTypes: true });
            } catch (error) {
                console.error(
                    `Cabbage: Error scanning directory ${current.absolutePath}:`,
                    (error as any)?.message || error,
                );
                continue;
            }

            // readdir order is filesystem-dependent; sort for stable output.
            dirents.sort((a, b) => a.name.localeCompare(b.name));

            const files: CandidateFile[] = [];
            for (const dirent of dirents) {
                const relativePath = current.relativePath
                    ? `${current.relativePath}/${dirent.name}`
                    : dirent.name;

                if (dirent.isDirectory()) {
                    if (!isIgnoredDirectory(dirent.name)) {
                        pending.push({
                            absolutePath: path.join(current.absolutePath, dirent.name),
                            relativePath,
                        });
                    }
                    continue;
                }

                // Symlinks are intentionally skipped: readdir reports them as
                // symbolic links (not files/directories), which also prevents
                // recursive directory loops.
                if (dirent.isFile() && isWidgetCandidate(dirent.name)) {
                    files.push({
                        absolutePath: path.join(current.absolutePath, dirent.name),
                        relativePath,
                    });
                }
            }

            const infos = await readWidgetInfos(files);
            for (const info of infos) {
                if (info) {
                    widgets.push(info);
                }
            }
        }
    } catch (error) {
        console.error(`Cabbage: Error scanning directory ${directory}:`, (error as any)?.message || error);
    }

    return widgets;
}
