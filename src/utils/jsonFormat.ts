import { CommentPolicy, Formatter, FracturedJsonOptions } from 'fracturedjsonjs';

export interface JsonFormatOptions {
    maxLength: number;
    indent: number;
}

function createFormatter(options: JsonFormatOptions, commentPolicy: CommentPolicy): Formatter {
    const formatter = new Formatter();
    const fjOptions = new FracturedJsonOptions();
    fjOptions.MaxTotalLineLength = options.maxLength;
    fjOptions.IndentSpaces = options.indent;
    fjOptions.CommentPolicy = commentPolicy;
    // Cabbage's parser accepts JSONC comments, but not trailing commas.
    // Keep the formatter's output aligned with that dialect.
    fjOptions.AllowTrailingCommas = false;
    formatter.Options = fjOptions;
    return formatter;
}

/**
 * Reformat JSON/JSONC text while preserving comments.
 */
export function formatJsonText(text: string, options: JsonFormatOptions): string {
    return createFormatter(options, CommentPolicy.Preserve).Reformat(text);
}

/**
 * Minify JSON/JSONC text while preserving comments.
 * FracturedJson keeps comments in the output (on their own lines where needed).
 */
export function minifyJsonText(text: string, options: JsonFormatOptions): string {
    return createFormatter(options, CommentPolicy.Preserve).Minify(text);
}
