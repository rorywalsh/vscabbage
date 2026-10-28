// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

/**
 * Cabbage 2 → Cabbage 3 converter.
 *
 * Converts old-style Cabbage 2 <Cabbage> sections (e.g. `rslider bounds(...),
 * channel("frq"), colour(0,0,255)`) into Cabbage 3 JSON, and rewrites the
 * orchestra's `chnget`/`chnset` opcodes into `cabbageGetValue`/`cabbageSetValue`/
 * `cabbageSet`.
 *
 * This module is pure (no `vscode` dependency) so it can be unit-tested and
 * driven from the `cabbage.importCabbage2Instrument` command.
 *
 * The rules live in:
 *   tools/Cabbage2_to_Cabbage3_conversion_rules.md
 *   tools/Cabbage2_to_Cabbage3_identifier_mapping.md
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface IdentifierToken {
    /** identifier name, e.g. "bounds", "colour:0", "identChannel" */
    name: string;
    /** split, trimmed argument strings, e.g. ["10", "20", "30", "40"] */
    args: string[];
    /** the raw text between the parentheses */
    rawArgs: string;
}

export interface ParsedWidget {
    /** original Cabbage 2 widget type string, e.g. "rslider" */
    type: string;
    /** parsed identifier tokens (excluding the leading widget type) */
    tokens: IdentifierToken[];
    /** the original declaration line (without trailing comment) */
    raw: string;
    /** set when the declaration opened a plant block `{ ... }` */
    isPlant?: boolean;
    /** flattened child widgets for a plant block */
    children?: ParsedWidget[];
}

export interface ConvertResult {
    /** the full converted Cabbage 3 JSON object (as a string) */
    json: string;
    /** human-readable warnings for identifiers/constructs that had no equivalent */
    warnings: string[];
    /** map of identChannel name → channel id, for orchestra rewriting */
    identToChannel: Map<string, string>;
    /** set of all channel ids produced (value + ident-derived) */
    channels: Set<string>;
}

export interface CsoundRewriteResult {
    text: string;
    changes: number;
    warnings: string[];
}

// ---------------------------------------------------------------------------
// Widget type renames (rules doc §1)
// ---------------------------------------------------------------------------

const WIDGET_TYPE_MAP: Record<string, string> = {
    rslider: 'rotarySlider',
    hslider: 'horizontalSlider',
    vslider: 'verticalSlider',
    nslider: 'numberSlider',
    combobox: 'comboBox',
    checkbox: 'checkBox',
    groupbox: 'groupBox',
    gentable: 'genTable',
    filebutton: 'fileButton',
    infobutton: 'infoButton',
    optionbutton: 'optionButton',
    texteditor: 'textEditor',
    listbox: 'listBox',
    csoundoutput: 'csoundOutput',
    xypad: 'xyPad',
    vmeter: 'verticalSlider', // fallback approximation
    hmeter: 'horizontalSlider', // fallback approximation
    hrange: 'horizontalRangeSlider',
    vrange: 'verticalRangeSlider',
    line: 'image', // thin separator line → thin coloured image
};

// Widget types with no stock Cabbage 3 equivalent (kept, but flagged).
const MANUAL_REVIEW_TYPES = new Set([
    'soundfiler', 'signaldisplay', 'eventsequencer', 'fftdisplay', 'encoder',
    'textbox', 'light', 'screw', 'cvoutput', 'cvinput', 'oscserver', 'popupmenu',
    'sourcebutton', 'path', 'presetbutton', 'loadbutton', 'directorylist',
    'keyboarddisplay', 'stepper',
]);

// Track/thumb sliders have nested style (style.label.fontColor /
// style.valueText.fontColor) rather than a top-level style.fontColor.
const SLIDER_TYPES = new Set([
    'rotarySlider', 'horizontalSlider', 'verticalSlider',
    'horizontalRangeSlider', 'verticalRangeSlider',
]);

// Identifiers that are deprecated / have no Cabbage 3 equivalent → drop silently.
const DROPPED_IDENTIFIERS = new Set([
    'guimode', 'guirefresh', 'autoupdate', 'opengl', 'movebehind', 'tofront',
    'trackercentre', 'trackerstart', 'trackerend',
    'trackerinsideradius', 'trackeroutsideradius',
    'markerstart', 'markerend', 'markerthickness', 'gapmarkers', 'sliderbounds',
    'keyseparatorcolour', 'mouseoverkeycolour', 'mousedownkeyoutlinecolour',
    'mouseoverkeyoutlinethickness', 'arrowcolour', 'keywidth', 'keywidthscale',
    'blacknotelength', 'blacknotewidth',
    'overlaycolour', 'metercolour', 'samplerange', 'scrubberposition',
    'showscrubber', 'displaytype', 'signalvariable',
    'highlighteditemcolour', 'highlightedtextcolour', 'protecteditems',
    'numberofclicks', 'titlebarcolour', 'titlebargradient', 'titlebarheight',
    'caretcolour', 'doubleclicktogglesedit',
    'bundle', 'import', 'opcodedir', 'opcode6dir64', 'sidechain', 'manufacturer',
    'author', 'factoryfolder', 'userfolder', 'latency', 'macrostrings', 'macronames',
    'isparent', 'glshader', 'urlinfo',
    // image / slider / gentable / keyboard tokens with no direct Cabbage 3 form
    'line', 'zoom', 'popuptext', 'tablenumbers', 'tablecolours',
    'tablecolour:0', 'tablecolour:1', 'midctrl', 'toggle',
    'textboxcolour', 'textboxoutlinecolour',
    // form CSS-like style string, and a common keyboard-colour typo
    'style', 'mouseoeverkeycolour',
]);

// Common typos in the Cabbage 2 example corpus → correct identifier name.
const IDENTIFIER_TYPO_FIXES: Record<string, string> = {
    oulinecolour: 'outlinecolour',
    vvisible: 'visible',
};

// CSS colour names Cabbage 2 accepts unquoted (e.g. `colour(white)`).
const CSS_COLOUR_NAMES = new Set([
    'white', 'black', 'red', 'green', 'blue', 'yellow', 'grey', 'gray', 'orange',
    'purple', 'pink', 'cyan', 'magenta', 'brown', 'silver', 'gold', 'violet',
    'turquoise', 'lightblue', 'lime', 'navy', 'maroon', 'olive', 'teal',
]);

// ---------------------------------------------------------------------------
// Tokeniser / parser
// ---------------------------------------------------------------------------

/** Strip `;` line comments and `/* ... *\/` block comments (not inside strings). */
function stripComments(line: string): string {
    let out = '';
    let inString = false;
    let quote = '';
    let i = 0;
    while (i < line.length) {
        const c = line[i];
        if (inString) {
            out += c;
            if (c === quote) inString = false;
            i++;
            continue;
        }
        if (c === '"' || c === "'") {
            inString = true;
            quote = c;
            out += c;
            i++;
            continue;
        }
        if (c === ';') break; // line comment
        if (c === '/' && line[i + 1] === '*') {
            const end = line.indexOf('*/', i + 2);
            i = end === -1 ? line.length : end + 2;
            continue;
        }
        out += c;
        i++;
    }
    return out;
}

/** Insert a comma between adjacent identifier tokens where the source omitted one (e.g. `text("x") fontColour("y")`). */
function insertMissingCommas(line: string): string {
    let out = '';
    let inString = false;
    let quote = '';
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inString) {
            out += c;
            if (c === quote) inString = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inString = true;
            quote = c;
            out += c;
            continue;
        }
        if (c === ')') {
            out += c;
            let j = i + 1;
            while (j < line.length && /\s/.test(line[j])) j++;
            const rest = line.slice(j);
            if (/^[A-Za-z_]\w*\s*\(/.test(rest)) out += ',';
            continue;
        }
        out += c;
    }
    return out;
}

/** Split a widget declaration into comma-separated tokens, respecting nesting and strings. */
function tokenize(line: string): string[] {
    const tokens: string[] = [];
    let current = '';
    let depth = 0;
    let inString = false;
    let quote = '';
    for (let i = 0; i < line.length; i++) {
        const c = line[i];
        if (inString) {
            current += c;
            if (c === quote) inString = false;
            continue;
        }
        if (c === '"' || c === "'") {
            inString = true;
            quote = c;
            current += c;
            continue;
        }
        if (c === '(' || c === '{') {
            depth++;
            current += c;
            continue;
        }
        if (c === ')' || c === '}') {
            depth--;
            current += c;
            continue;
        }
        if (c === ',' && depth === 0) {
            tokens.push(current.trim());
            current = '';
            continue;
        }
        current += c;
    }
    if (current.trim()) tokens.push(current.trim());
    return tokens;
}

/** Split the inside of `(...)` into top-level args. */
function splitArgs(raw: string): string[] {
    return tokenize(raw).map(a => a.trim());
}

/** Unquote a string argument (strip surrounding single/double quotes). */
function unquote(s: string): string {
    const t = s.trim();
    if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
        return t.slice(1, -1);
    }
    return t;
}

/** Parse an argument as a number, tolerating quoted values (e.g. outlineThickness("4")). */
function toNumber(s: string): number {
    return Number(unquote(s));
}

function toNumbers(args: string[]): number[] {
    return args.map(toNumber);
}

/** Build a Cabbage 3 range object from Cabbage 2 range args. */
function makeRange(a: string[]): Record<string, number> | null {
    const n = a.map(toNumber);
    if (n.length < 2 || isNaN(n[0]) || isNaN(n[1])) return null;
    const range: Record<string, number> = { min: n[0], max: n[1] };
    if (n.length > 2 && !isNaN(n[2])) range.defaultValue = n[2];
    if (n.length > 3 && !isNaN(n[3])) range.skew = n[3];
    if (n.length > 4 && !isNaN(n[4])) range.increment = n[4];
    else range.increment = (n[1] - n[0]) / 1000;
    return range;
}

function parseToken(token: string): IdentifierToken | null {
    const m = token.match(/^([A-Za-z_][\w:]*)\s*\(([\s\S]*)\)$/);
    if (!m) return null;
    return { name: m[1], args: splitArgs(m[2]), rawArgs: m[2] };
}

/**
 * Parse one logical widget declaration (a single line, or a plant block
 * `... { \n ... \n }`).
 */
function parseWidget(lines: string[], startIndex: number): { widget: ParsedWidget; nextIndex: number } {
    const first = stripComments(lines[startIndex]).trim();
    if (!first) return { widget: { type: '', tokens: [], raw: first }, nextIndex: startIndex + 1 };

    // Split leading widget type from the first identifier(s).
    const typeMatch = first.match(/^(\w+)\s+(.*)$/);
    if (!typeMatch) {
        // A line that isn't "word ..." — either a bare widget type, or a stray
        // brace (`}` / `{`) left over from an old plant edit. Skip garbage.
        const bare = first.match(/^([A-Za-z_]\w*)$/);
        if (bare) {
            return {
                widget: { type: bare[1], tokens: [], raw: first },
                nextIndex: startIndex + 1,
            };
        }
        return { widget: { type: '', tokens: [], raw: first }, nextIndex: startIndex + 1 };
    }

    const type = typeMatch[1];
    const rest = typeMatch[2];

    // Plant block: `widget ... plant("name") ... {` (brace on same line) or
    // `widget ... plant("name") ...\n{` (brace on the following line).
    const braceOnLine = rest.indexOf('{');
    const nextLineIsBrace = lines[startIndex + 1] !== undefined &&
        stripComments(lines[startIndex + 1]).trim() === '{';

    if (braceOnLine !== -1 || nextLineIsBrace) {
        const declPart = braceOnLine !== -1 ? rest.slice(0, braceOnLine).trim() : rest;
        const tokens = tokenize(insertMissingCommas(declPart)).map(t => parseToken(t)).filter((t): t is IdentifierToken => t !== null);
        const children: ParsedWidget[] = [];
        // Children begin after the `{` line (same-line vs next-line).
        let i = startIndex + (braceOnLine !== -1 ? 1 : 2);
        while (i < lines.length) {
            const line = stripComments(lines[i]).trim();
            if (line === '}' || line.endsWith('}')) break;
            if (line) {
                const child = parseWidget(lines, i);
                children.push(child.widget);
                i = child.nextIndex;
                continue;
            }
            i++;
        }
        return {
            widget: { type, tokens, raw: first, isPlant: true, children },
            nextIndex: i + 1,
        };
    }

    const tokens = tokenize(insertMissingCommas(rest)).map(t => parseToken(t)).filter((t): t is IdentifierToken => t !== null);
    return { widget: { type, tokens, raw: first }, nextIndex: startIndex + 1 };
}

// ---------------------------------------------------------------------------
// Colour helpers
// ---------------------------------------------------------------------------

function hex(v: number): string {
    const n = Math.max(0, Math.min(255, Math.round(v)));
    return n.toString(16).padStart(2, '0');
}

/** Convert Cabbage 2 colour args (r,g,b[,a] or a name/string) to a CSS colour. */
function parseColour(args: string[]): string | null {
    if (args.length === 0) return null;
    const nums = args.map(a => toNumber(a));
    if (nums.every(n => !isNaN(n)) && nums.length >= 3) {
        const [r, g, b, a] = nums;
        if (a !== undefined && a < 255) {
            return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${(a / 255).toFixed(3)})`;
        }
        return `#${hex(r)}${hex(g)}${hex(b)}`;
    }
    // Single token: CSS colour name or pre-formatted string.
    const single = unquote(args[0]);
    if (CSS_COLOUR_NAMES.has(single.toLowerCase())) return single.toLowerCase();
    if (/^#[0-9a-fA-F]{3,8}$/.test(single)) return single;
    if (single.startsWith('rgb')) return single;
    return single || null;
}

// ---------------------------------------------------------------------------
// Identifier → Cabbage 3 property
// ---------------------------------------------------------------------------

interface WidgetBuilder {
    type: string;
    json: Record<string, any>;
    channelNames: string[]; // explicit channel() names (can be multiple for xyPad/range/soundfiler)
    identChannel: string | null; // explicit identChannel() name
}

function emptyWidget(type: string): WidgetBuilder {
    return { type, json: { type }, channelNames: [], identChannel: null };
}

/** Apply a single Cabbage 2 identifier to the widget under construction. */
function applyIdentifier(w: WidgetBuilder, token: IdentifierToken, warnings: string[]): void {
    const rawName = token.name.toLowerCase();
    const name = IDENTIFIER_TYPO_FIXES[rawName] || rawName;
    const a = token.args;

    if (DROPPED_IDENTIFIERS.has(name)) return;

    switch (name) {
        case 'bounds': {
            const n = a.map(toNumber);
            if (n.length >= 4 && n.every(x => !isNaN(x))) {
                w.json.bounds = { left: n[0], top: n[1], width: n[2], height: n[3] };
            }
            return;
        }
        case 'size': {
            const n = a.map(toNumber);
            if (n.length >= 2 && n.every(x => !isNaN(x))) {
                if (w.type === 'form') {
                    // The form has no position — keep width/height as `size`.
                    w.json.size = { width: n[0], height: n[1] };
                } else {
                    // All other widgets use `bounds` for size and position.
                    w.json.bounds = w.json.bounds || {};
                    w.json.bounds.width = n[0];
                    w.json.bounds.height = n[1];
                }
            }
            return;
        }
        case 'pos': {
            const n = a.map(toNumber);
            if (n.length >= 2 && n.every(x => !isNaN(x))) {
                w.json.bounds = w.json.bounds || {};
                w.json.bounds.left = n[0];
                w.json.bounds.top = n[1];
            }
            return;
        }
        case 'channel': {
            // value channel(s) — collapsed with identChannel per rules §13.
            w.channelNames = a.map(x => unquote(x).trim()).filter(Boolean);
            return;
        }
        case 'identchannel': {
            w.identChannel = unquote(a[0] ?? '');
            return;
        }
        case 'widgetarray': {
            // handled before applyIdentifier; ignore if it slips through.
            return;
        }
        case 'plant': {
            // handled at parse level.
            return;
        }
        case 'range': {
            const r = makeRange(a);
            if (r) {
                ensureChannels(w);
                w.json.channels[0].range = r;
            }
            return;
        }
        case 'rangex': {
            const r = makeRange(a);
            if (r) {
                ensureChannels(w);
                w.json.channels[0].range = r;
            }
            return;
        }
        case 'rangey': {
            const r = makeRange(a);
            if (r) {
                ensureChannels(w);
                while (w.json.channels.length < 2) w.json.channels.push({ event: 'valueChanged' });
                w.json.channels[1].range = r;
            }
            return;
        }
        case 'value': {
            ensureChannels(w);
            if (!w.json.channels[0].range) w.json.channels[0].range = {};
            w.json.channels[0].range.defaultValue = toNumber(a[0]);
            return;
        }
        case 'min': {
            ensureChannels(w);
            if (!w.json.channels[0].range) w.json.channels[0].range = {};
            w.json.channels[0].range.min = toNumber(a[0]);
            return;
        }
        case 'max': {
            ensureChannels(w);
            if (!w.json.channels[0].range) w.json.channels[0].range = {};
            w.json.channels[0].range.max = toNumber(a[0]);
            return;
        }
        case 'defaultvalue': {
            ensureChannels(w);
            if (!w.json.channels[0].range) w.json.channels[0].range = {};
            w.json.channels[0].range.defaultValue = toNumber(a[0]);
            return;
        }
        case 'increment': {
            ensureChannels(w);
            if (!w.json.channels[0].range) w.json.channels[0].range = {};
            w.json.channels[0].range.increment = toNumber(a[0]);
            return;
        }
        case 'skew': {
            ensureChannels(w);
            if (!w.json.channels[0].range) w.json.channels[0].range = {};
            w.json.channels[0].range.skew = toNumber(a[0]);
            return;
        }
        case 'channeltype': {
            ensureChannels(w);
            const t = unquote(a[0]).toLowerCase();
            w.json.channels[0].type = t === 'string' ? 'string' : 'number';
            return;
        }
        case 'caption': {
            w.json.caption = unquote(a[0]);
            return;
        }
        case 'pluginid': {
            w.json.pluginId = unquote(a[0]);
            return;
        }
        case 'items': {
            w.json.items = a.map(x => unquote(x).trim());
            return;
        }
        case 'text': {
            const vals = a.map(x => unquote(x).trim());
            const isButtonFamily = ['button', 'infoButton', 'optionButton', 'fileButton'].includes(w.type);
            if (w.type === 'comboBox' || w.type === 'listBox') {
                // Legacy Cabbage 2 used text() as an alias for the items list.
                w.json.items = vals;
            } else if (isButtonFamily && vals.length > 1) {
                w.json.label = w.json.label || {};
                w.json.label.text = { off: vals[0], on: vals[1] };
            } else {
                w.json.label = w.json.label || {};
                w.json.label.text = vals[0];
            }
            return;
        }
        case 'colour':
        case 'color': {
            const css = parseColour(a);
            if (!css) return;
            if (SLIDER_TYPES.has(w.type)) {
                setStyle(w, 'thumb.backgroundColor', css);
            } else {
                setStyle(w, 'backgroundColor', css);
            }
            return;
        }
        case 'colour:0':
        case 'color:0': {
            const css = parseColour(a);
            if (css) setStyle(w, 'off.backgroundColor', css);
            return;
        }
        case 'colour:1':
        case 'color:1': {
            const css = parseColour(a);
            if (css) setStyle(w, 'on.backgroundColor', css);
            return;
        }
        case 'textcolour':
        case 'textcolor': {
            // Colour of the text passed to text() — the caption/label.
            const css = parseColour(a);
            if (!css) return;
            if (SLIDER_TYPES.has(w.type)) setStyle(w, 'label.fontColor', css);
            else setStyle(w, 'fontColor', css);
            return;
        }
        case 'fontcolour':
        case 'fontcolor': {
            // Colour of the value text box (sliders) / general font (others).
            const css = parseColour(a);
            if (!css) return;
            if (SLIDER_TYPES.has(w.type)) setStyle(w, 'valueText.fontColor', css);
            else setStyle(w, 'fontColor', css);
            return;
        }
        case 'fontcolour:0':
        case 'fontcolor:0': {
            const css = parseColour(a);
            if (css) setStyle(w, 'off.textColor', css);
            return;
        }
        case 'fontcolour:1':
        case 'fontcolor:1': {
            const css = parseColour(a);
            if (css) setStyle(w, 'on.textColor', css);
            return;
        }
        case 'alpha': {
            w.json.style = w.json.style || {};
            w.json.style.opacity = toNumber(a[0]);
            return;
        }
        case 'outlinecolour': {
            const css = parseColour(a);
            if (!css) return;
            if (SLIDER_TYPES.has(w.type)) setStyle(w, 'thumb.borderColor', css);
            else setStyle(w, 'borderColor', css);
            return;
        }
        case 'outlinethickness': {
            if (SLIDER_TYPES.has(w.type)) setStyle(w, 'thumb.borderWidth', toNumber(a[0]));
            else setStyle(w, 'borderWidth', toNumber(a[0]));
            return;
        }
        case 'corners': {
            setStyle(w, 'borderRadius', toNumber(a[0]));
            return;
        }
        case 'shape': {
            const s = unquote(a[0]).toLowerCase();
            if (s === 'sharp') setStyle(w, 'borderRadius', 0);
            else if (s === 'rounded') setStyle(w, 'borderRadius', 4);
            return;
        }
        case 'trackercolour':
        case 'trackercolor': {
            const css = parseColour(a);
            if (css) setStyle(w, 'track.fillColor', css);
            return;
        }
        case 'trackerbackgroundcolour':
        case 'trackerbgcolour': {
            const css = parseColour(a);
            if (css) setStyle(w, 'track.backgroundColor', css);
            return;
        }
        case 'trackerthickness': {
            setStyle(w, 'track.width', toNumber(a[0]));
            return;
        }
        case 'markercolour': {
            const css = parseColour(a);
            if (css) setStyle(w, 'thumb.backgroundColor', css);
            return;
        }
        case 'ballcolour': {
            const css = parseColour(a);
            if (css) setStyle(w, 'ball.backgroundColor', css);
            return;
        }
        case 'tablecolour':
        case 'tablecolor': {
            const css = parseColour(a);
            if (css) setStyle(w, 'strokeColor', css);
            return;
        }
        case 'tablebackgroundcolour': {
            const css = parseColour(a);
            if (css) setStyle(w, 'backgroundColor', css);
            return;
        }
        case 'tablegridcolour':
        case 'tablegridcolor': {
            const css = parseColour(a);
            if (css) setStyle(w, 'borderColor', css);
            return;
        }
        case 'backgroundcolour': {
            const css = parseColour(a);
            if (css) setStyle(w, 'backgroundColor', css);
            return;
        }
        case 'tablenumber': {
            w.json.tableNumber = toNumber(a[0]);
            return;
        }
        case 'amprange': {
            const n = a.map(toNumber);
            if (n.length >= 2) {
                w.json.range = w.json.range || {};
                w.json.range.y = { min: n[0], max: n[1] };
            }
            if (n.length >= 3 && n[2] !== -1) w.json.tableNumber = n[2];
            return;
        }
        case 'blacknotecolour': {
            const css = parseColour(a);
            if (css) setColor(w, 'blackNote', css);
            return;
        }
        case 'whitenotecolour': {
            const css = parseColour(a);
            if (css) setColor(w, 'whiteNote', css);
            return;
        }
        case 'keydowncolour': {
            const css = parseColour(a);
            if (css) setColor(w, 'keydown', css);
            return;
        }
        case 'arrowbackgroundcolour': {
            const css = parseColour(a);
            if (css) setColor(w, 'arrowBackground', css);
            return;
        }
        case 'middlec':
        case 'keypressbaseoctave': {
            w.json.baseOctave = toNumber(a[0]);
            return;
        }
        case 'valueprefix': {
            w.json.valuePrefix = unquote(a[0]);
            w.json.valueText = w.json.valueText || {};
            w.json.valueText.prefix = unquote(a[0]);
            return;
        }
        case 'valuepostfix': {
            w.json.valuePostfix = unquote(a[0]);
            w.json.valueText = w.json.valueText || {};
            w.json.valueText.postfix = unquote(a[0]);
            return;
        }
        case 'textbox':
        case 'valuetextbox': {
            w.json.valueText = w.json.valueText || {};
            w.json.valueText.visible = toNumber(a[0]) !== 0;
            return;
        }
        case 'popup': {
            w.json.popup = toNumber(a[0]) !== 0;
            return;
        }
        case 'visible': {
            w.json.visible = toNumber(a[0]) !== 0;
            return;
        }
        case 'active': {
            w.json.active = toNumber(a[0]) !== 0;
            return;
        }
        case 'automatable': {
            w.json.automatable = toNumber(a[0]) !== 0;
            return;
        }
        case 'latched': {
            // Cabbage 3 button now has a latched flag: true = toggle, false = momentary.
            w.json.latched = toNumber(a[0]) !== 0;
            return;
        }
        case 'highlightcolour': {
            const css = parseColour(a);
            if (css) setStyle(w, 'highlightColor', css);
            return;
        }
        case 'linethickness': {
            setStyle(w, 'borderWidth', toNumber(a[0]));
            return;
        }
        case 'readonly': {
            w.json.readOnly = toNumber(a[0]) !== 0;
            return;
        }
        case 'scrollbars': {
            w.json.scrollbars = toNumber(a[0]) !== 0;
            return;
        }
        case 'wrap': {
            w.json.wrap = toNumber(a[0]) !== 0;
            return;
        }
        case 'sort': {
            w.json.populate = w.json.populate || {};
            w.json.populate.order = unquote(a[0]);
            return;
        }
        case 'populate': {
            w.json.populate = w.json.populate || {};
            if (a[0]) w.json.populate.fileType = unquote(a[0]);
            if (a[1]) w.json.populate.directories = [unquote(a[1])];
            return;
        }
        case 'file': {
            w.json.file = unquote(a[0]);
            return;
        }
        case 'fill': {
            w.json.fill = toNumber(a[0]) !== 0 ? 1 : 0;
            return;
        }
        case 'filmstrip': {
            if (a[0]) w.json.filmStrip = w.json.filmStrip || {};
            if (a[0]) w.json.filmStrip.file = unquote(a[0]);
            if (a[1]) {
                w.json.filmStrip.frames = w.json.filmStrip.frames || {};
                w.json.filmStrip.frames.count = toNumber(a[1]);
            }
            return;
        }
        case 'align': {
            w.json.align = unquote(a[0]);
            return;
        }
        case 'fontsize': {
            setStyle(w, 'fontSize', toNumber(a[0]));
            return;
        }
        case 'typeface': {
            setStyle(w, 'fontFamily', unquote(a[0]));
            return;
        }
        case 'rotate': {
            const n = a.map(toNumber);
            if (n.length >= 1) {
                w.json.rotate = { x: n[0] ?? 0, y: n[1] ?? 0, radians: n[2] ?? 0 };
            }
            return;
        }
        case 'radiogroup': {
            w.json.radioGroup = toNumber(a[0]);
            return;
        }
        case 'velocity': {
            w.json.velocity = toNumber(a[0]);
            return;
        }
        case 'mode': {
            // filebutton/texteditor mode — preserve as a best-effort string.
            w.json.mode = unquote(a[0]);
            return;
        }
        default: {
            warnings.push(`unmapped identifier "${token.name}" on ${w.type}`);
            return;
        }
    }
}

function ensureChannels(w: WidgetBuilder): void {
    if (!w.json.channels || !Array.isArray(w.json.channels) || w.json.channels.length === 0) {
        w.json.channels = [{ id: '', event: 'valueChanged' }];
    }
}

/** Set a dotted path under `style`. */
function setStyle(w: WidgetBuilder, path: string, value: any): void {
    w.json.style = w.json.style || {};
    const parts = path.split('.');
    let node = w.json.style;
    for (let i = 0; i < parts.length - 1; i++) {
        node[parts[i]] = node[parts[i]] || {};
        node = node[parts[i]];
    }
    node[parts[parts.length - 1]] = value;
}

/** Set a dotted path under `color` (keyboard). */
function setColor(w: WidgetBuilder, path: string, value: any): void {
    w.json.color = w.json.color || {};
    w.json.color[path] = value;
}

// ---------------------------------------------------------------------------
// Widget conversion
// ---------------------------------------------------------------------------

/**
 * Convert one parsed widget (and, for plants, its flattened children) into
 * Cabbage 3 JSON objects. Returns an array because widgetArray expands to N.
 */
function convertWidget(parsed: ParsedWidget, warnings: string[], identToChannel: Map<string, string>, channels: Set<string>, counter: { n: number }): Record<string, any>[] {
    // Detect widgetArray("name", N) — expand to N widgets.
    const wa = parsed.tokens.find(t => t.name.toLowerCase() === 'widgetarray');
    const widgets: Record<string, any>[] = [];

    const build = (overrideType?: string, suffix?: string, suffixIdent?: string): Record<string, any> => {
        const mappedType = WIDGET_TYPE_MAP[parsed.type] || parsed.type;
        const type = overrideType || mappedType;
        const w = emptyWidget(type);

        for (const token of parsed.tokens) {
            if (token.name.toLowerCase() === 'widgetarray') continue;
            applyIdentifier(w, token, warnings);
        }

        // Resolve channels: channel() wins, else identChannel() (rules §13).
        if (w.channelNames.length > 0) {
            ensureChannels(w);
            while (w.json.channels.length < w.channelNames.length) {
                w.json.channels.push({ event: 'valueChanged' });
            }
            w.channelNames.forEach((name, idx) => {
                const id = suffix ? `${name}${suffix}` : name;
                w.json.channels[idx].id = id;
                channels.add(id);
            });
            if (w.identChannel) {
                identToChannel.set(w.identChannel, w.channelNames[0]);
            }
        } else if (w.identChannel) {
            const id = suffixIdent ? `${w.identChannel}${suffixIdent}` : w.identChannel;
            ensureChannels(w);
            w.json.channels[0].id = id;
            channels.add(id);
            identToChannel.set(w.identChannel, id);
        } else if (suffixIdent) {
            ensureChannels(w);
            w.json.channels[0].id = suffixIdent;
            channels.add(suffixIdent);
        } else if (w.json.channels && Array.isArray(w.json.channels) && w.json.channels.some(c => c && c.id)) {
            // Channels created by range/value/rangeX/rangeY — register any non-empty ids.
            for (const c of w.json.channels) if (c && c.id) channels.add(c.id);
        } else if (type !== 'form') {
            // No channel at all (decorative widget) — emit a synthetic id to avoid
            // the backend auto-assign log noise. The form is the container and
            // gets id "MainForm" from the backend, so skip it.
            counter.n++;
            ensureChannels(w);
            w.json.channels[0].id = `${type}${counter.n}`;
            channels.add(w.json.channels[0].id);
        }

        // All non-form widgets use `bounds` for size + position (rules doc §2);
        // only the form has no top/left. Fill in missing position so every
        // non-form widget carries a complete left/top.
        if (type !== 'form') {
            const b = w.json.bounds || (w.json.bounds = {});
            if (b.left === undefined) b.left = 0;
            if (b.top === undefined) b.top = 0;
        }

        // Drop internal builder fields.
        delete (w as any).channelNames;
        delete (w as any).identChannel;

        if (MANUAL_REVIEW_TYPES.has(parsed.type)) {
            warnings.push(`"${parsed.type}" has no stock Cabbage 3 widget — manual review required`);
        }
        return w.json;
    };

    if (wa) {
        const base = unquote(wa.args[0] ?? '');
        const count = Number(wa.args[1] ?? 0);
        for (let i = 1; i <= count; i++) {
            widgets.push(build(undefined, String(i), `${base}_ident${i}`));
        }
    } else if (parsed.isPlant) {
        // Plant container keeps its original type (image stays image, groupbox
        // stays groupBox); the plant() grouping is dropped. Children's bounds are
        // RELATIVE to the plant container, so offset them by the container's
        // top-left before flattening.
        const container = build();
        widgets.push(container);
        const ox = container.bounds?.left ?? 0;
        const oy = container.bounds?.top ?? 0;
        for (const child of parsed.children || []) {
            const childWidgets = convertWidget(child, warnings, identToChannel, channels, counter);
            if (ox !== 0 || oy !== 0) {
                for (const cw of childWidgets) {
                    if (cw.bounds) {
                        cw.bounds.left = (cw.bounds.left ?? 0) + ox;
                        cw.bounds.top = (cw.bounds.top ?? 0) + oy;
                    }
                }
            }
            widgets.push(...childWidgets);
        }
    } else {
        widgets.push(build());
    }

    return widgets;
}

// ---------------------------------------------------------------------------
// Section conversion
// ---------------------------------------------------------------------------

/** Expand Cabbage 2 `#define NAME ...` macros and `$NAME` references. */
function expandMacros(content: string): string {
    const macros: Record<string, string> = {};
    const kept: string[] = [];
    for (const rawLine of content.split('\n')) {
        const line = rawLine.replace(/\r$/, '');
        const m = line.match(/^\s*#define\s+([A-Za-z_]\w*)\s+(.*)$/);
        if (m) {
            macros[m[1]] = m[2].trim();
            continue;
        }
        kept.push(line);
    }
    return kept
        .map(line => line.replace(/\$([A-Za-z_]\w*)/g, (_m, name) => (name in macros ? macros[name] : _m)))
        .join('\n');
}

export function convertCabbage2Section(content: string): ConvertResult {
    const warnings: string[] = [];
    const identToChannel = new Map<string, string>();
    const channels = new Set<string>();

    const lines = expandMacros(content).split('\n');
    const parsed: ParsedWidget[] = [];
    let i = 0;
    while (i < lines.length) {
        const line = stripComments(lines[i]).trim();
        if (!line) {
            i++;
            continue;
        }
        const { widget, nextIndex } = parseWidget(lines, i);
        if (widget.type) parsed.push(widget);
        i = nextIndex;
    }

    const widgets: Record<string, any>[] = [];
    let form: Record<string, any> | null = null;
    let pluginId: string | undefined;
    const counter = { n: 0 };

    for (const p of parsed) {
        const converted = convertWidget(p, warnings, identToChannel, channels, counter);
        for (const w of converted) {
            if (w.type === 'form') {
                form = w;
                if (w.pluginId) pluginId = w.pluginId;
            } else {
                widgets.push(w);
            }
        }
    }

    // Ensure a form widget exists (required by the Cabbage 3 parser).
    if (!form) {
        form = { type: 'form', caption: 'Converted', size: { width: 600, height: 400 } };
    }
    delete form.pluginId; // pluginId is top-level, not a form property

    const ordered = [form, ...widgets];
    const root: Record<string, any> = { widgets: ordered };
    if (pluginId) root.pluginId = pluginId;

    // Flag duplicate channel ids (a Cabbage 2 source bug that Cabbage 3 rejects).
    const channelCount = new Map<string, number>();
    for (const w of ordered) {
        if (w.channels && Array.isArray(w.channels)) {
            for (const c of w.channels) {
                if (c && typeof c.id === 'string' && c.id) {
                    channelCount.set(c.id, (channelCount.get(c.id) || 0) + 1);
                }
            }
        }
    }
    for (const [id, n] of channelCount) {
        if (n > 1) warnings.push(`duplicate channel id "${id}" used ${n} times — Cabbage 3 requires unique channels`);
    }

    return {
        json: JSON.stringify(root, null, 4),
        warnings,
        identToChannel,
        channels,
    };
}

// ---------------------------------------------------------------------------
// Orchestra rewriting (chnget / chnset → cabbageGet / cabbageSet)
// ---------------------------------------------------------------------------

/** Convert a Cabbage 2 property string (e.g. `"text(%d)"` already expanded) into a cabbageSet call. */
function propertyToCabbageSet(channel: string, propString: string): string | null {
    const m = propString.trim().match(/^([A-Za-z_][\w:]*)\s*\((.*)\)$/);
    if (!m) return null;
    const name = m[1].toLowerCase();
    const args = splitArgs(m[2]);

    const num = (s: string) => toNumber(s);

    switch (name) {
        case 'visible':
            return `cabbageSet "${channel}", "visible", ${num(args[0]) !== 0 ? 1 : 0}`;
        case 'text': {
            const t = args.map(x => unquote(x).trim()).join(',');
            return `cabbageSet "${channel}", "text", ${JSON.stringify(args.length > 1 ? args.map(x => unquote(x)) : t)}`;
        }
        case 'bounds': {
            if (args.length >= 4) {
                return `cabbageSet "${channel}", "bounds", [${num(args[0])}, ${num(args[1])}, ${num(args[2])}, ${num(args[3])}]`;
            }
            return null;
        }
        case 'colour':
        case 'color': {
            const css = parseColour(args);
            return css ? `cabbageSet "${channel}", "style.backgroundColor", ${JSON.stringify(css)}` : null;
        }
        case 'fontcolour':
        case 'fontcolor':
        case 'textcolour': {
            const css = parseColour(args);
            return css ? `cabbageSet "${channel}", "style.fontColor", ${JSON.stringify(css)}` : null;
        }
        case 'outlinecolour': {
            const css = parseColour(args);
            return css ? `cabbageSet "${channel}", "style.borderColor", ${JSON.stringify(css)}` : null;
        }
        case 'outlinethickness':
            return `cabbageSet "${channel}", "style.borderWidth", ${num(args[0])}`;
        case 'alpha':
            return `cabbageSet "${channel}", "style.opacity", ${num(args[0])}`;
        case 'tablenumber':
            return `cabbageSet "${channel}", "tableNumber", ${num(args[0])}`;
        case 'tablecolour':
        case 'tablecolor': {
            const css = parseColour(args);
            return css ? `cabbageSet "${channel}", "style.strokeColor", ${JSON.stringify(css)}` : null;
        }
        case 'tablebackgroundcolour': {
            const css = parseColour(args);
            return css ? `cabbageSet "${channel}", "style.backgroundColor", ${JSON.stringify(css)}` : null;
        }
        case 'fill':
            return `cabbageSet "${channel}", "fill", ${num(args[0]) !== 0 ? 1 : 0}`;
        default:
            return null;
    }
}

/**
 * Cabbage 2 reserved channels that still exist in Cabbage 3, with renames.
 * These remain plain Csound control channels (read via `chnget`), not widget
 * channels, so they are renamed in place rather than converted to
 * `cabbageGetValue`.
 */
const RESERVED_CHANNELS: Record<string, string> = {
    HOST_BPM: 'HOST_BPM',
    HOST_PPQ_POS: 'HOST_PPQ_POS',
    IS_PLAYING: 'HOST_IS_PLAYING',
    IS_RECORDING: 'HOST_IS_RECORDING',
    TIME_IN_SAMPLES: 'HOST_TIME_IN_SAMPLES',
    TIME_IN_SECONDS: 'HOST_TIME_IN_SECONDS',
    TIME_SIG_NUM: 'HOST_TIME_SIG_NUM',
    TIME_SIG_DENOM: 'HOST_TIME_SIG_DENOM',
};

/**
 * Cabbage 2 channels that no longer exist in Cabbage 3. Mouse position is now
 * delivered as widget channel events (`mouseMoveX`/`mouseMoveY`/
 * `mouseDragX`/`mouseDragY`) rather than reserved `MOUSE_*` channels.
 */
const REMOVED_CHANNELS = new Set([
    'MOUSE_X', 'MOUSE_Y', 'MOUSE_DOWN_LEFT', 'MOUSE_DOWN_MIDDLE', 'MOUSE_DOWN_RIGHT',
    'MOUSEWHEEL_DELTA_X', 'MOUSEWHEEL_DELTA_Y',
    'LAST_FILE_DROPPED', 'LAST_TEXT_DROPPED',
]);

/**
 * Rewrite `chnget`/`chnset` calls in the orchestra into Cabbage 3 opcodes.
 * Csound syntax has no parentheses: `chnget "chan"` and `chnset value, "chan"`.
 */
export function rewriteOrchestra(
    orchestraText: string,
    identToChannel: Map<string, string>,
    channels: Set<string>,
): CsoundRewriteResult {
    let text = orchestraText;
    let changes = 0;
    const warnings: string[] = [];

    // chnget "chan" → cabbageGetValue "chan" (widget) / rename (reserved) / warn (removed)
    // Only rewrite k-rate / i-rate outputs; cabbageGetValue has no a-rate (or
    // S-rate) variant, so those stay as plain chnget.
    text = text.replace(/\b([A-Za-z][\w]*)\s+chnget\s+"([^"]+)"/g, (_m, varName: string, chan: string) => {
        const first = varName[0].toLowerCase();
        const isControlRate = first === 'k' || first === 'i' ||
            (first === 'g' && (varName[1] === 'k' || varName[1] === 'i'));
        if (!isControlRate) return _m; // a-rate / S-rate → leave chnget

        if (REMOVED_CHANNELS.has(chan)) {
            warnings.push(`"${chan}" is no longer a channel in Cabbage 3 — mouse position uses mouseMoveX/mouseMoveY widget events`);
            return _m;
        }
        if (chan in RESERVED_CHANNELS) {
            const target = RESERVED_CHANNELS[chan];
            if (target !== chan) changes++;
            return `${varName} chnget "${target}"`;
        }
        // Only widget channels become cabbageGetValue; internal Csound channels
        // (e.g. audio sends) stay as plain chnget.
        if (!channels.has(chan)) return _m;
        changes++;
        return `${varName} cabbageGetValue "${chan}"`;
    });

    // chnset <expr>, "chan" → cabbageSetValue / cabbageSet (property)
    text = text.replace(/\bchnset\s+(.+),\s*"([^"]+)"/g, (_m, expr: string, chan: string) => {
        if (REMOVED_CHANNELS.has(chan)) {
            warnings.push(`"${chan}" is no longer a channel in Cabbage 3 — mouse position uses mouseMoveX/mouseMoveY widget events`);
            return _m;
        }
        if (chan in RESERVED_CHANNELS) {
            const target = RESERVED_CHANNELS[chan];
            if (target !== chan) changes++;
            return `chnset ${expr.trim()}, "${target}"`;
        }
        const trimmedExpr = expr.trim();
        const targetChannel = identToChannel.get(chan);
        if (targetChannel) {
            // Ident channel → property update. Only rewrite literal property
            // strings we can decompose. Dynamic (sprintfk-built) property strings
            // are commented out with a TODO: the ident channel is now a numeric
            // widget channel, so a string chnset fails at init (channel type
            // mismatch), and a 2-arg cabbageSet with a non-JSON property string
            // crashes the backend (parseAndFormatJson reads an out-of-range arg).
            if (trimmedExpr.startsWith('"') && trimmedExpr.endsWith('"')) {
                const call = propertyToCabbageSet(targetChannel, trimmedExpr.slice(1, -1));
                if (call) {
                    changes++;
                    return call;
                }
            }
            warnings.push(`property update on "${chan}" needs manual conversion to cabbageSet (commented out)`);
            changes++;
            return `; Cabbage2→3 manual conversion needed: ${_m}`;
        }
        // Widget value channel → cabbageSetValue; internal channel → leave chnset.
        if (!channels.has(chan)) return _m;
        changes++;
        return `cabbageSetValue "${chan}", ${trimmedExpr}`;
    });

    // chnset <expr>, Svariable — dynamic (non-literal) channel, can't resolve statically.
    // Comment out with a TODO rather than leave a string chnset on a numeric channel.
    text = text.replace(/\bchnset\s+(.+),\s*([gS][A-Za-z_]\w*)\b/g, (_m, _expr: string, chan: string) => {
        warnings.push(`dynamic channel "${chan}" update needs manual conversion to cabbageSet (commented out)`);
        changes++;
        return `; Cabbage2→3 manual conversion needed: ${_m}`;
    });

    return { text, changes, warnings };
}

// ---------------------------------------------------------------------------
// Full document conversion
// ---------------------------------------------------------------------------

export interface FullConversion {
    text: string;
    warnings: string[];
    summary: string;
}

/**
 * Convert a whole .csd document from Cabbage 2 to Cabbage 3.
 * Returns the new document text plus a summary.
 */
export function convertCabbage2ToCabbage3(csdText: string): FullConversion {
    const cabbageRegex = /<Cabbage>([\s\S]*?)<\/Cabbage>/;
    const cabbageMatch = csdText.match(cabbageRegex);

    if (!cabbageMatch) {
        throw new Error('No <Cabbage> section found.');
    }

    // Bail out if it's already JSON.
    const body = cabbageMatch[1].trim();
    if (body.startsWith('{') || body.startsWith('[')) {
        throw new Error('Cabbage section is already JSON — nothing to convert.');
    }

    const converted = convertCabbage2Section(body);

    // Rewrite the orchestra (everything inside <CsInstruments>).
    const orchestraRegex = /<CsInstruments>([\s\S]*?)<\/CsInstruments>/;
    const orchestraMatch = csdText.match(orchestraRegex);
    let orchestraChanges = 0;
    if (orchestraMatch) {
        const rewritten = rewriteOrchestra(orchestraMatch[1], converted.identToChannel, converted.channels);
        orchestraChanges = rewritten.changes;
        converted.warnings.push(...rewritten.warnings);
        csdText = csdText.replace(orchestraMatch[1], rewritten.text);
    }

    // Replace the Cabbage section.
    const newCabbage = `<Cabbage>\n${converted.json}\n</Cabbage>`;
    csdText = csdText.replace(cabbageMatch[0], newCabbage);

    const summary =
        `Converted ${converted.channels.size} channel(s)` +
        (orchestraChanges ? `, rewrote ${orchestraChanges} chnget/chnset call(s)` : '') +
        (converted.warnings.length ? `, ${converted.warnings.length} warning(s)` : '');

    return { text: csdText, warnings: converted.warnings, summary };
}
