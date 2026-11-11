// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Scans a .csd orchestra for Cabbage channel references so the "Generate UI"
 * command can turn them into widgets.
 *
 * Recognised opcodes: cabbageGetValue, cabbageSetValue, cabbageGet, cabbageSet.
 * The channel is always the first (string) argument. Inline hints may be added
 * on the reference line with the compact form:
 *
 *     cabbageGetValue("cutoff")  ; @widget type("rotarySlider") range(20, 20000, 800, 0.5)
 *     cabbageGetValue("gain")    ; @widget type("horizontalSlider"), range(0, 1, 0.5)
 *
 * `range(min, max, value[, increment[, skew]])` is optional and positional. A
 * comma between the clauses is allowed (and expected by Cabbage 2 habits).
 */

/** Coarse value type taken from the LHS annotation (`CabbageNumTrig`, ...). */
export type ChannelValueType =
    | 'number'
    | 'string'
    | 'trigger-number'
    | 'trigger-string'
    | 'unknown';

export interface ChannelRangeHint {
    min: number;
    max: number;
    value: number;
    increment?: number;
    skew?: number;
}

export interface WidgetHint {
    type: string;
    range?: ChannelRangeHint;
}

export interface DetectedChannel {
    /** Channel name as written in the CSD. */
    channel: string;
    /** Number of opcode references found. */
    refCount: number;
    /** Coarse value type inferred from the LHS annotation. */
    valueType: ChannelValueType;
    /** Parsed `@widget` hint, if present. */
    hint?: WidgetHint;
}

export interface ChannelScanResult {
    channels: DetectedChannel[];
    /** References whose channel could not be resolved to a static name. */
    skipped: string[];
}

const OPCODE_SOURCE = '\\bcabbage(?:GetValue|SetValue|Get|Set)\\b';
const HINT_RE = /@widget\s+type\s*\(\s*"([^"]+)"\s*\)\s*,?\s*(?:range\s*\(([^)]*)\))?/i;
const VALUE_TYPE_RE = /Cabbage(Str|Num)(Trig)?/i;
const NUMBER_RE = /^[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?$/;

/**
 * Extract the orchestra text. When `<CsInstruments>` is present only that
 * region is scanned; otherwise the `<Cabbage>` JSON is removed so channel
 * names inside widget definitions are not mistaken for opcode references.
 */
function getOrchestraText(text: string): string {
    const orchestra = text.match(/<CsInstruments>([\s\S]*?)<\/CsInstruments>/i);
    if (orchestra) {
        return orchestra[1];
    }
    return text.replace(/<Cabbage>[\s\S]*?<\/Cabbage>/i, '');
}

function skipRateSuffix(text: string, index: number): number {
    if (text[index] !== ':') {
        return index;
    }
    let i = index + 1;
    while (i < text.length && /[A-Za-z]/.test(text[i])) {
        i++;
    }
    return i;
}

function skipSpaces(text: string, index: number): number {
    let i = index;
    while (i < text.length && (text[i] === ' ' || text[i] === '\t')) {
        i++;
    }
    return i;
}

/** Read a double-quoted string starting at `index` (if any). */
function readQuoted(text: string, index: number): { value: string; end: number } | undefined {
    if (text[index] !== '"') {
        return undefined;
    }
    let i = index + 1;
    let value = '';
    while (i < text.length) {
        const ch = text[i];
        if (ch === '\\') {
            value += text[i + 1] ?? '';
            i += 2;
            continue;
        }
        if (ch === '"') {
            return { value, end: i + 1 };
        }
        if (ch === '\n') {
            return undefined;
        }
        value += ch;
        i++;
    }
    return undefined;
}

/** Find the parenthesis that closes the one at `openIndex`, ignoring strings. */
function findClosingParen(text: string, openIndex: number): number {
    let depth = 0;
    let i = openIndex;
    while (i < text.length) {
        const ch = text[i];
        if (ch === '"') {
            const quoted = readQuoted(text, i);
            if (!quoted) {
                return -1;
            }
            i = quoted.end;
            continue;
        }
        if (ch === '(') {
            depth++;
        } else if (ch === ')') {
            depth--;
            if (depth === 0) {
                return i;
            }
        } else if (ch === '\n') {
            return -1;
        }
        i++;
    }
    return -1;
}

/** Return the text of the first top-level argument in a call's argument list. */
function firstTopLevelArg(args: string): string {
    let depth = 0;
    for (let i = 0; i < args.length; i++) {
        const ch = args[i];
        if (ch === '"') {
            const quoted = readQuoted(args, i);
            if (!quoted) {
                return args;
            }
            i = quoted.end - 1;
            continue;
        }
        if (ch === '(') {
            depth++;
        } else if (ch === ')') {
            depth--;
        } else if (ch === ',' && depth === 0) {
            return args.slice(0, i);
        }
    }
    return args;
}

function classifyChannel(value: string): { channel?: string; dynamic: boolean } {
    const trimmed = value.trim();
    if (!trimmed) {
        return { dynamic: true };
    }
    // sprintf/sprintfk format strings are dynamic channel names and cannot be
    // turned into a single static widget.
    if (trimmed.includes('%')) {
        return { dynamic: true };
    }
    return { channel: trimmed, dynamic: false };
}

/** Read the first argument that follows an opcode token. */
function readFirstArg(text: string, start: number): { channel?: string; dynamic: boolean } {
    const i = skipSpaces(text, skipRateSuffix(text, start));
    if (text[i] === '(') {
        const close = findClosingParen(text, i);
        if (close === -1) {
            return { dynamic: true };
        }
        const arg = firstTopLevelArg(text.slice(i + 1, close)).trim();
        const quoted = readQuoted(arg, 0);
        if (quoted && quoted.end === arg.length) {
            return classifyChannel(quoted.value);
        }
        return { dynamic: true };
    }
    const quoted = readQuoted(text, i);
    if (quoted) {
        return classifyChannel(quoted.value);
    }
    return { dynamic: true };
}

function parseNumberList(raw: string): number[] | undefined {
    const parts = raw.split(',').map(part => part.trim());
    if (parts.length < 3) {
        return undefined;
    }
    const numbers: number[] = [];
    for (const part of parts) {
        if (!NUMBER_RE.test(part)) {
            return undefined;
        }
        numbers.push(parseFloat(part));
    }
    return numbers;
}

/** Parse an inline `@widget type("...") range(...)` hint from a line, if present. */
export function parseWidgetHint(line: string): WidgetHint | undefined {
    const match = HINT_RE.exec(line);
    if (!match) {
        return undefined;
    }
    const type = match[1];
    if (!type) {
        return undefined;
    }

    let range: ChannelRangeHint | undefined;
    if (match[2] !== undefined) {
        const numbers = parseNumberList(match[2]);
        if (numbers && numbers.length >= 3) {
            range = {
                min: numbers[0],
                max: numbers[1],
                value: numbers[2],
                increment: numbers.length > 3 ? numbers[3] : undefined,
                skew: numbers.length > 4 ? numbers[4] : undefined,
            };
        }
    }
    return { type, range };
}

function parseValueType(line: string): ChannelValueType {
    const match = VALUE_TYPE_RE.exec(line);
    if (!match) {
        return 'unknown';
    }
    const isString = match[1].toLowerCase() === 'str';
    const isTrigger = !!match[2];
    if (isString) {
        return isTrigger ? 'trigger-string' : 'string';
    }
    return isTrigger ? 'trigger-number' : 'number';
}

function dynamicLabel(line: string, opcodeIndex: number): string {
    const snippet = line.slice(opcodeIndex, Math.min(line.length, opcodeIndex + 48)).trim();
    return snippet || 'dynamic channel';
}

/**
 * Scan a .csd's orchestra for statically named Cabbage channels.
 */
export function scanCabbageChannels(text: string): ChannelScanResult {
    const lines = getOrchestraText(text).split(/\r?\n/);
    const channels = new Map<string, DetectedChannel>();
    const skipped: string[] = [];

    for (const line of lines) {
        if (!/cabbage/i.test(line)) {
            continue;
        }

        const hint = parseWidgetHint(line);
        const valueType = parseValueType(line);
        const opcodeRe = new RegExp(OPCODE_SOURCE, 'gi');

        let match: RegExpExecArray | null;
        while ((match = opcodeRe.exec(line)) !== null) {
            const arg = readFirstArg(line, match.index + match[0].length);
            if (!arg.channel) {
                if (arg.dynamic) {
                    skipped.push(dynamicLabel(line, match.index));
                }
                continue;
            }

            const existing = channels.get(arg.channel);
            if (existing) {
                existing.refCount++;
                if (hint && !existing.hint) {
                    existing.hint = hint;
                }
                if (valueType !== 'unknown' && existing.valueType === 'unknown') {
                    existing.valueType = valueType;
                }
            } else {
                channels.set(arg.channel, {
                    channel: arg.channel,
                    refCount: 1,
                    valueType,
                    hint,
                });
            }
        }
    }

    return { channels: Array.from(channels.values()), skipped };
}
