import {
    applyEdits,
    Edit,
    findNodeAtLocation,
    JSONPath,
    modify,
    parse,
    parseTree,
    ParseError,
    ParseErrorCode,
    printParseErrorCode,
} from 'jsonc-parser';
import type { JsonFormatOptions } from './jsonFormat';

export interface CabbageJsonRoot {
    /** The full parsed CSD JSON root (array in legacy files, object in newer files). */
    root: any;
    /** The widget array, regardless of whether it is the root or under a "widgets" key. */
    widgets: any[];
}

export class JsoncParseError extends Error {
    readonly errors: ParseError[];

    constructor(errors: ParseError[], text?: string) {
        const first = errors[0];
        const position = text !== undefined ? offsetToPosition(text, first.offset) : undefined;
        const positionText = position
            ? ` (line ${position.line + 1} column ${position.column + 1})`
            : '';
        super(`JSON parse error: ${describeJsoncError(first, text)} at position ${first.offset}${positionText}`);
        this.name = 'JsoncParseError';
        this.errors = errors;
    }
}

const parseOptions = {
    // Cabbage accepts JSONC comments but not trailing commas.
    disallowComments: false,
    allowTrailingComma: false,
};

/**
 * Parse JSON with // and block comments. Throws {@link JsoncParseError} on
 * invalid input so callers can show a useful diagnostic.
 */
export function parseJsonc<T = any>(text: string): T {
    const errors: ParseError[] = [];
    const value = parse(text, errors, parseOptions);
    if (errors.length > 0) {
        throw new JsoncParseError(errors, text);
    }
    return value as T;
}

/**
 * Validate JSONC without throwing. Returns the parser errors (empty on success).
 */
export function getJsoncErrors(text: string): ParseError[] {
    const errors: ParseError[] = [];
    parse(text, errors, parseOptions);
    return errors;
}

/**
 * Parse a Cabbage `<Cabbage>` JSON payload. Supports both the legacy top-level
 * array format and the newer `{ "widgets": [...] }` format.
 */
export function parseCabbageJson(text: string): CabbageJsonRoot {
    const parsed = parseJsonc<any>(text);

    if (Array.isArray(parsed)) {
        return { root: parsed, widgets: parsed };
    }
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.widgets)) {
        return { root: parsed, widgets: parsed.widgets };
    }

    throw new Error('Invalid Cabbage JSON structure: Expected either an array of widgets or an object with a "widgets" array');
}

export interface CabbageIncludeDirective {
    /** The filename quoted after #include. */
    filename: string;
    /** Offset of the '#' in the source text. */
    offset: number;
    /** Length of the whole directive. */
    length: number;
}

const includeDirectivePattern = /#include[ \t]+"([^"\r\n]+\.json)"/y;

/**
 * Locate a real Cabbage #include directive outside JSONC comments and strings.
 *
 * A commented-out include inside malformed inline JSON must not be mistaken
 * for an external-file reference, otherwise a widget edit could be redirected
 * to an unrelated JSON file.
 */
export function findCabbageInclude(text: string): CabbageIncludeDirective | undefined {
    enum State {
        Normal,
        LineComment,
        BlockComment,
        String,
    }

    let state = State.Normal;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const next = text[i + 1];

        switch (state) {
            case State.LineComment:
                if (char === '\n') {
                    state = State.Normal;
                }
                break;

            case State.BlockComment:
                if (char === '*' && next === '/') {
                    state = State.Normal;
                    i++;
                }
                break;

            case State.String:
                if (char === '\\') {
                    i++;
                } else if (char === '"') {
                    state = State.Normal;
                }
                break;

            case State.Normal:
                if (char === '/' && next === '/') {
                    state = State.LineComment;
                    i++;
                } else if (char === '/' && next === '*') {
                    state = State.BlockComment;
                    i++;
                } else if (char === '"') {
                    state = State.String;
                } else if (char === '#') {
                    const lineStart = text.lastIndexOf('\n', i - 1) + 1;
                    if (!/^[ \t\r]*$/.test(text.slice(lineStart, i))) {
                        continue;
                    }

                    includeDirectivePattern.lastIndex = i;
                    const match = includeDirectivePattern.exec(text);
                    if (match) {
                        return {
                            filename: match[1],
                            offset: i,
                            length: match[0].length,
                        };
                    }
                }
                break;
        }
    }

    return undefined;
}

export function getWidgetsPath(root: any): JSONPath {
    return Array.isArray(root) ? [] : ['widgets'];
}

export function offsetToPosition(text: string, offset: number): { line: number; column: number } {
    const clamped = Math.max(0, Math.min(offset, text.length));
    const before = text.substring(0, clamped);
    const lines = before.split('\n');
    return { line: lines.length - 1, column: lines[lines.length - 1].length };
}

/**
 * Turn a jsonc-parser error into a message that the extension's existing
 * user-friendly diagnostics can understand.
 */
export function describeJsoncError(error: ParseError, text?: string): string {
    const char = text && error.offset >= 0 && error.offset < text.length ? text[error.offset] : '';
    const previous = text ? previousNonWhitespace(text, error.offset) : '';

    // A trailing comma shows up as a missing value/property at the closing
    // bracket or brace. Detect it here so the UI can give a precise fix.
    if (
        (error.error === ParseErrorCode.ValueExpected || error.error === ParseErrorCode.PropertyNameExpected) &&
        (char === ']' || char === '}') &&
        previous === ','
    ) {
        return 'Trailing comma is not allowed in JSON';
    }

    switch (error.error) {
        case ParseErrorCode.InvalidSymbol:
            return char ? `Unexpected token '${char}'` : 'Unexpected token';
        case ParseErrorCode.InvalidNumberFormat:
            return 'Invalid number format';
        case ParseErrorCode.PropertyNameExpected:
            return 'Expected double-quoted property name';
        case ParseErrorCode.ValueExpected:
            return 'Unexpected token: expected a value';
        case ParseErrorCode.ColonExpected:
            return "Expected ':' after property name";
        case ParseErrorCode.CommaExpected:
            return "Expected ',' between items (missing comma)";
        case ParseErrorCode.CloseBraceExpected:
            return "Unexpected end of JSON: expected '}'";
        case ParseErrorCode.CloseBracketExpected:
            return "Unexpected end of JSON: expected ']'";
        case ParseErrorCode.EndOfFileExpected:
            return 'Unexpected token after the end of the JSON value';
        case ParseErrorCode.InvalidCommentToken:
            return 'Unexpected token: invalid comment';
        case ParseErrorCode.UnexpectedEndOfComment:
            return 'Unexpected end of JSON: unterminated comment';
        case ParseErrorCode.UnexpectedEndOfString:
            return 'Unexpected end of JSON: unterminated string';
        case ParseErrorCode.UnexpectedEndOfNumber:
            return 'Unexpected end of JSON: unterminated number';
        case ParseErrorCode.InvalidUnicode:
            return 'Invalid unicode escape sequence';
        case ParseErrorCode.InvalidEscapeCharacter:
            return 'Invalid escape character';
        case ParseErrorCode.InvalidCharacter:
            return 'Unexpected token: invalid character';
        default:
            return `JSON syntax error: ${printParseErrorCode(error.error)}`;
    }
}

function previousNonWhitespace(text: string, offset: number): string {
    for (let i = Math.min(offset, text.length) - 1; i >= 0; i--) {
        if (!/\s/.test(text[i])) {
            return text[i];
        }
    }
    return '';
}

function isPlainObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function hasOwn(value: any, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(value, key);
}

function deepEqual(a: any, b: any): boolean {
    if (a === b) {
        return true;
    }
    if (typeof a !== typeof b || a === null || b === null) {
        return false;
    }
    if (Array.isArray(a) || Array.isArray(b)) {
        if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
            return false;
        }
        for (let i = 0; i < a.length; i++) {
            if (!deepEqual(a[i], b[i])) {
                return false;
            }
        }
        return true;
    }
    if (typeof a === 'object' && typeof b === 'object') {
        const aKeys = Object.keys(a);
        const bKeys = Object.keys(b);
        if (aKeys.length !== bKeys.length) {
            return false;
        }
        for (const key of aKeys) {
            if (!hasOwn(b, key) || !deepEqual(a[key], b[key])) {
                return false;
            }
        }
        return true;
    }
    return false;
}

interface JsonEdit {
    path: JSONPath;
    value: any;
    /** Marks an edit that inserts a new array element rather than replacing a value. */
    insertion?: boolean;
}

/**
 * Find an order-preserving matching between two arrays of (mostly) unchanged
 * elements. Elements match when they are deeply equal, or when they are plain
 * objects sharing the same stable id (widget id / channel id).
 *
 * Returns one entry per desired element: the matched current index, or -1 when
 * the element must be inserted. Current elements that are never matched must
 * be removed.
 */
function matchArrayElements(current: any[], desired: any[]): number[] {
    const matches = new Array<number>(desired.length).fill(-1);
    if (current.length === 0 || desired.length === 0) {
        return matches;
    }

    const canMatch = (currentIndex: number, desiredIndex: number): boolean => {
        if (deepEqual(current[currentIndex], desired[desiredIndex])) {
            return true;
        }
        if (isPlainObject(current[currentIndex]) && isPlainObject(desired[desiredIndex])) {
            const currentId = getWidgetId(current[currentIndex]);
            const desiredId = getWidgetId(desired[desiredIndex]);
            return currentId !== '' && currentId === desiredId;
        }
        return false;
    };

    // Longest common subsequence over (current, desired); the arrays involved
    // are small (channels, ranges, etc.), so the O(n*m) table is fine.
    const table: number[][] = [];
    for (let i = 0; i <= current.length; i++) {
        table.push(new Array<number>(desired.length + 1).fill(0));
    }
    for (let i = current.length - 1; i >= 0; i--) {
        for (let j = desired.length - 1; j >= 0; j--) {
            let best = Math.max(table[i + 1][j], table[i][j + 1]);
            if (canMatch(i, j)) {
                best = Math.max(best, table[i + 1][j + 1] + 1);
            }
            table[i][j] = best;
        }
    }

    let i = 0;
    let j = 0;
    while (i < current.length && j < desired.length) {
        if (canMatch(i, j) && table[i][j] === table[i + 1][j + 1] + 1) {
            matches[j] = i;
            i++;
            j++;
        } else if (table[i + 1][j] >= table[i][j + 1]) {
            i++;
        } else {
            j++;
        }
    }

    return matches;
}

/**
 * Build a list of minimal edits that turn `current` into `desired`.
 * Arrays of equal length are compared element-by-element so comments inside
 * array items are retained. Arrays that change length (for example, a channel
 * added or removed through the property panel) keep their retained elements
 * matched and emit element-level removals/insertions instead of replacing the
 * whole array, so comments inside unchanged elements survive.
 */
function diffJson(current: any, desired: any, path: JSONPath): JsonEdit[] {
    if (deepEqual(current, desired)) {
        return [];
    }

    if (isPlainObject(current) && isPlainObject(desired)) {
        const edits: JsonEdit[] = [];
        for (const key of Object.keys(current)) {
            if (!hasOwn(desired, key) || desired[key] === undefined) {
                edits.push({ path: [...path, key], value: undefined });
            }
        }
        for (const key of Object.keys(desired)) {
            if (desired[key] === undefined) {
                continue;
            }
            if (!hasOwn(current, key)) {
                edits.push({ path: [...path, key], value: desired[key] });
            } else {
                edits.push(...diffJson(current[key], desired[key], [...path, key]));
            }
        }
        return edits;
    }

    if (Array.isArray(current) && Array.isArray(desired)) {
        const edits: JsonEdit[] = [];

        if (current.length === desired.length) {
            for (let i = 0; i < desired.length; i++) {
                edits.push(...diffJson(current[i], desired[i], [...path, i]));
            }
            return edits;
        }

        const matches = matchArrayElements(current, desired);
        const retainedCurrent = new Set<number>();
        for (const currentIndex of matches) {
            if (currentIndex >= 0) {
                retainedCurrent.add(currentIndex);
            }
        }

        // Patch retained elements at their original indices first.
        for (let j = 0; j < desired.length; j++) {
            if (matches[j] >= 0) {
                edits.push(...diffJson(current[matches[j]], desired[j], [...path, matches[j]]));
            }
        }

        // Remove elements that no longer exist (descending keeps indices valid).
        for (let i = current.length - 1; i >= 0; i--) {
            if (!retainedCurrent.has(i)) {
                edits.push({ path: [...path, i], value: undefined });
            }
        }

        // Insert new elements. Matches are order-preserving, so after the
        // removals above the desired index is the correct insertion point.
        for (let j = 0; j < desired.length; j++) {
            if (matches[j] < 0) {
                edits.push({ path: [...path, j], value: desired[j], insertion: true });
            }
        }

        return edits;
    }

    return [{ path, value: desired }];
}

function formatOptions(options: JsonFormatOptions) {
    return {
        tabSize: options.indent > 0 ? options.indent : 4,
        insertSpaces: true,
        eol: '\n',
    };
}

function applyJsoncEdit(
    text: string,
    path: JSONPath,
    value: any,
    options: JsonFormatOptions,
    isArrayInsertion: boolean = false
): string {
    const edits = modify(text, path, value, {
        formattingOptions: formatOptions(options),
        isArrayInsertion,
    });
    return applyEdits(text, edits);
}

function getArrayAtPath(text: string, path: JSONPath): any[] {
    let value: any = parseJsonc<any>(text);
    for (const segment of path) {
        if (value === null || value === undefined) {
            return [];
        }
        value = value[segment as any];
    }
    return Array.isArray(value) ? value : [];
}

/**
 * Extract the id used to match a widget. Cabbage widgets can identify
 * themselves with `id`, a legacy `channel` string, or the first `channels[]`
 * entry, so all three are considered.
 */
export function getWidgetId(widget: any): string {
    if (!widget) {
        return '';
    }
    if (typeof widget.id === 'string' && widget.id) {
        return widget.id;
    }
    if (Array.isArray(widget.channels)) {
        const channel = widget.channels.find((entry: any) => entry && typeof entry.id === 'string' && entry.id);
        if (channel) {
            return channel.id;
        }
    }
    if (typeof widget.channel === 'string' && widget.channel) {
        return widget.channel;
    }
    return '';
}

export function widgetMatchesId(widget: any, id: string): boolean {
    if (!widget || !id) {
        return false;
    }
    if (typeof widget.id === 'string' && widget.id === id) {
        return true;
    }
    if (typeof widget.channel === 'string' && widget.channel === id) {
        return true;
    }
    if (Array.isArray(widget.channels)) {
        return widget.channels.some((entry: any) => entry && typeof entry.id === 'string' && entry.id === id);
    }
    return false;
}

function findWidgetIndex(widgets: any[], id: string, exclude: Set<number>): number {
    for (let i = 0; i < widgets.length; i++) {
        if (!exclude.has(i) && widgetMatchesId(widgets[i], id)) {
            return i;
        }
    }
    return -1;
}

function reconcileWidgets(
    text: string,
    path: JSONPath,
    desiredWidgets: any[],
    options: JsonFormatOptions,
    aliases: Record<string, string>
): string {
    let currentText = text;
    let currentWidgets = getArrayAtPath(currentText, path);

    // aliases maps an old id to a new id (a channel rename). Matching against
    // the old id lets us update the existing widget in place instead of
    // deleting it and inserting a duplicate.
    const reverseAliases: Record<string, string> = {};
    for (const [oldId, newId] of Object.entries(aliases)) {
        if (oldId && newId && oldId !== newId) {
            reverseAliases[newId] = oldId;
        }
    }

    const matchedCurrent = new Set<number>();
    const matchedDesired = new Set<number>();

    // Update existing widgets first, preserving their comments and formatting.
    for (let desiredIndex = 0; desiredIndex < desiredWidgets.length; desiredIndex++) {
        const desired = desiredWidgets[desiredIndex];
        const id = getWidgetId(desired);
        const matchId = id ? (reverseAliases[id] ?? id) : '';
        let currentIndex = matchId ? findWidgetIndex(currentWidgets, matchId, matchedCurrent) : -1;

        if (currentIndex === -1 && !matchId) {
            // Widgets without any id can only be matched positionally.
            if (
                desiredIndex < currentWidgets.length &&
                !matchedCurrent.has(desiredIndex) &&
                !getWidgetId(currentWidgets[desiredIndex]) &&
                currentWidgets[desiredIndex]?.type === desired?.type
            ) {
                currentIndex = desiredIndex;
            }
        }

        if (currentIndex === -1) {
            continue;
        }

        matchedCurrent.add(currentIndex);
        matchedDesired.add(desiredIndex);

        const edits = diffJson(currentWidgets[currentIndex], desired, [...path, currentIndex]);
        for (const edit of edits) {
            currentText = applyJsoncEdit(currentText, edit.path, edit.value, options, edit.insertion === true);
        }
        if (edits.length > 0) {
            currentWidgets = getArrayAtPath(currentText, path);
        }
    }

    // Remove widgets that no longer exist (descending, so indices stay valid).
    for (let i = currentWidgets.length - 1; i >= 0; i--) {
        if (matchedCurrent.has(i)) {
            continue;
        }
        currentText = applyJsoncEdit(currentText, [...path, i], undefined, options);
        currentWidgets = getArrayAtPath(currentText, path);
    }

    // Insert new widgets. updateText/updateExternalJsonFile keep the existing
    // order and either append or unshift, so the desired index is the correct
    // insertion point once removed widgets are gone.
    for (let desiredIndex = 0; desiredIndex < desiredWidgets.length; desiredIndex++) {
        if (matchedDesired.has(desiredIndex)) {
            continue;
        }
        const insertAt = Math.min(desiredIndex, currentWidgets.length);
        currentText = applyJsoncEdit(currentText, [...path, insertAt], desiredWidgets[desiredIndex], options, true);
        currentWidgets = getArrayAtPath(currentText, path);
    }

    return currentText;
}

/**
 * Update a Cabbage JSON document in place, changing only the values that
 * differ between the current text and `desiredRoot`. Comments and formatting
 * in untouched regions are preserved.
 *
 * @param aliases Optional map of old widget id -> new widget id for renames.
 */
export function reconcileJsonDocument(
    text: string,
    desiredRoot: any,
    options: JsonFormatOptions,
    aliases: Record<string, string> = {}
): string {
    let currentText = text;
    const currentRoot = parseJsonc<any>(currentText);

    if (Array.isArray(currentRoot) && Array.isArray(desiredRoot)) {
        return reconcileWidgets(currentText, [], desiredRoot, options, aliases);
    }

    if (isPlainObject(currentRoot) && isPlainObject(desiredRoot)) {
        const desiredKeys = Object.keys(desiredRoot).filter(key => desiredRoot[key] !== undefined);

        // Remove root properties that are gone.
        for (const key of Object.keys(currentRoot)) {
            if (!desiredKeys.includes(key)) {
                currentText = applyJsoncEdit(currentText, [key], undefined, options);
            }
        }

        // Update/add root properties other than the widget array.
        for (const key of desiredKeys) {
            if (key === 'widgets') {
                continue;
            }
            if (!hasOwn(currentRoot, key)) {
                currentText = applyJsoncEdit(currentText, [key], desiredRoot[key], options);
            } else if (!deepEqual(currentRoot[key], desiredRoot[key])) {
                const edits = diffJson(currentRoot[key], desiredRoot[key], [key]);
                for (const edit of edits) {
                    currentText = applyJsoncEdit(currentText, edit.path, edit.value, options, edit.insertion === true);
                }
            }
        }

        if (desiredRoot.widgets !== undefined) {
            if (Array.isArray(currentRoot.widgets)) {
                currentText = reconcileWidgets(currentText, ['widgets'], desiredRoot.widgets, options, aliases);
            } else {
                currentText = applyJsoncEdit(currentText, ['widgets'], desiredRoot.widgets, options);
            }
        }

        return currentText;
    }

    // The document format changed (for example, legacy array -> object). There
    // is no existing value to patch, so replace the root.
    return applyJsoncEdit(currentText, [], desiredRoot, options);
}

/**
 * Reorder array values by replacing each value with the text of another value
 * from the same array. Separators and comments between values stay in place;
 * comments inside a value move with that value.
 *
 * @param order New position -> old position. For example [1, 0] swaps the
 *              first two widgets.
 */
export function reorderJsoncArrayValues(text: string, path: JSONPath, order: number[]): string {
    const tree = parseTree(text, undefined, parseOptions);
    if (!tree) {
        throw new Error('Could not parse the Cabbage JSON');
    }

    const arrayNode = findNodeAtLocation(tree, path);
    if (!arrayNode || arrayNode.type !== 'array' || !arrayNode.children) {
        throw new Error('Could not find the widget array');
    }

    const elements = arrayNode.children;
    if (elements.length !== order.length) {
        throw new Error('Widget order does not match the number of widgets in the document');
    }
    if (new Set(order).size !== order.length || order.some(index => index < 0 || index >= elements.length)) {
        throw new Error('Invalid widget order');
    }

    const edits: Edit[] = [];
    for (let newIndex = 0; newIndex < elements.length; newIndex++) {
        const sourceIndex = order[newIndex];
        if (sourceIndex === newIndex) {
            continue;
        }
        const source = elements[sourceIndex];
        const target = elements[newIndex];
        edits.push({
            offset: target.offset,
            length: target.length,
            content: text.substring(source.offset, source.offset + source.length),
        });
    }

    // Apply from the end so earlier offsets remain valid.
    edits.sort((a, b) => b.offset - a.offset);
    let result = text;
    for (const edit of edits) {
        result = result.substring(0, edit.offset) + edit.content + result.substring(edit.offset + edit.length);
    }
    return result;
}
