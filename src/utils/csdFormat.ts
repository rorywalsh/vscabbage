// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

/**
 * Pure CSD formatting helpers.
 *
 * This module has no `vscode` dependency so it can be used by the extension's
 * Format Document provider and by the batch Cabbage 2 → 3 conversion tools.
 */

import { formatJsonText, JsonFormatOptions } from './jsonFormat';

export interface CsdFormatOptions {
    /** Spaces used for Csound indentation (default 4). */
    indentSpaces?: number;
    /** Spaces used inside the Cabbage JSON (default 4). */
    jsonIndentSpaces?: number;
    /** FracturedJson max line length (default 120). */
    maxLength?: number;
}

/**
 * Formats CSD text: Csound indentation plus FracturedJson formatting for the
 * `<Cabbage>` section. Comments in the JSON are preserved.
 */
export function formatCsdText(text: string, options: CsdFormatOptions = {}): string {
    const indentSpaces = options.indentSpaces ?? 4;
    const jsonOptions: JsonFormatOptions = {
        indent: options.jsonIndentSpaces ?? 4,
        maxLength: options.maxLength ?? 120,
    };

    const startTag = '<Cabbage>';
    const endTag = '</Cabbage>';

    const startIndex = text.indexOf(startTag);
    const endTagIndex = text.indexOf(endTag, startIndex >= 0 ? startIndex : 0);
    const endIndex = endTagIndex >= 0 ? endTagIndex + endTag.length : -1;
    const lines = text.split('\n');

    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        // If no Cabbage section is found, format the entire text.
        const updatedText = formatNonCabbageContent(lines, ' '.repeat(indentSpaces));
        return updatedText.join('\n');
    }

    const beforeCabbage = text.substring(0, startIndex).split('\n');
    const cabbageSection = text.substring(startIndex, endIndex);
    const afterCabbage = text.substring(endIndex).split('\n');

    const formattedBeforeCabbage = formatNonCabbageContent(beforeCabbage, ' '.repeat(indentSpaces));
    const formattedAfterCabbage = formatNonCabbageContent(afterCabbage, ' '.repeat(indentSpaces));
    const formattedCabbageSection = formatCabbageSection(cabbageSection, jsonOptions);

    return formattedBeforeCabbage.join('\n') + formattedCabbageSection + formattedAfterCabbage.join('\n');
}

/**
 * Formats the JSON content within a Cabbage section.
 */
export function formatCabbageSection(cabbageSection: string, options: JsonFormatOptions): string {
    const startTag = '<Cabbage>';
    const endTag = '</Cabbage>';

    const startIndex = cabbageSection.indexOf(startTag);
    const endIndex = cabbageSection.indexOf(endTag, startIndex >= 0 ? startIndex : 0);

    if (startIndex === -1 || endIndex === -1 || startIndex > endIndex) {
        return cabbageSection; // Return as-is if tags are malformed
    }

    const beforeTag = cabbageSection.substring(0, startIndex + startTag.length);
    const jsonContent = cabbageSection.substring(startIndex + startTag.length, endIndex);
    const afterTag = cabbageSection.substring(endIndex);

    try {
        // Reformat the text directly so JSONC comments are preserved.
        const formattedJson = formatJsonText(jsonContent.trim(), options);
        return beforeTag + '\n' + formattedJson + '\n' + afterTag;
    } catch (error) {
        // If JSON parsing fails, return the original section.
        return cabbageSection;
    }
}

/**
 * Formats Csound lines outside the Cabbage section, tracking instr/opcode
 * bodies and their end keywords.
 */
export function formatNonCabbageContent(lines: string[], indentString: string): string[] {
    let indents = 0; // Tracks indentation inside instr/opcode bodies
    let inCodeBlock = false;
    const formattedLines: string[] = [];

    const startsWithWord = (line: string, word: string): boolean => {
        const lower = line.toLowerCase();
        const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const re = new RegExp(`^${escaped}(?:$|\\s|\\()`, 'i');
        return re.test(lower);
    };

    for (let index = 0; index < lines.length; index++) {
        const line = lines[index];
        const trimmedLine = line.trim();

        // Keep blank lines blank (no injected indentation whitespace)
        if (trimmedLine.length === 0) {
            formattedLines.push('');
            continue;
        }

        const lower = trimmedLine.toLowerCase();

        const startsInstr = startsWithWord(trimmedLine, 'instr');
        const startsOpcode = startsWithWord(trimmedLine, 'opcode');
        const endsInstr = startsWithWord(trimmedLine, 'endin');
        const endsOpcode = startsWithWord(trimmedLine, 'endop');

        // Outside instr/opcode bodies: don't auto-indent tags/sections.
        if (!inCodeBlock) {
            formattedLines.push(trimmedLine);
            if (startsInstr || startsOpcode) {
                inCodeBlock = true;
                indents = 1;
            }
            continue;
        }

        // endin/endop should align to column 0 and close code mode.
        if (endsInstr || endsOpcode) {
            formattedLines.push(trimmedLine);
            inCodeBlock = false;
            indents = 0;
            continue;
        }

        // Decrease indentation level for end keywords and labels
        if (
            startsWithWord(trimmedLine, 'endif') ||
            startsWithWord(trimmedLine, 'elseif') ||
            startsWithWord(trimmedLine, 'od') ||
            startsWithWord(trimmedLine, 'else') ||
            startsWithWord(trimmedLine, 'enduntil')
        ) {
            indents = Math.max(1, indents - 1);
        }

        // Add indentation
        const indentText = indentString.repeat(indents);
        formattedLines.push(indentText + trimmedLine);

        // Increase indentation level for specific keywords
        if (
            ((startsWithWord(trimmedLine, 'if') || startsWithWord(trimmedLine, 'elseif')) && lower.includes('then')) ||
            startsWithWord(trimmedLine, 'instr') ||
            startsWithWord(trimmedLine, 'opcode') ||
            startsWithWord(trimmedLine, 'else') ||
            startsWithWord(trimmedLine, 'while') ||
            startsWithWord(trimmedLine, 'for')
        ) {
            indents++;
        }
    }

    return formattedLines;
}
