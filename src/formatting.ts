// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

// @ts-ignore
import { WidgetProps } from './cabbage/widgetTypes';

/**
 * Formats the given text with indentation and handles special <Cabbage> blocks.
 * @param text - The text to format.
 * @param indentSpaces - The number of spaces to use for indentation (default is 4).
 * @returns The formatted text.
 */
export function formatText(text: string, indentSpaces: number = 4): string {
    const lines = text.split('\n');
    let indents = 0;
    let formattedText = '';
    let insideCabbage = false;
    let cabbageContent = '';

    // Create a string with the specified number of spaces
    const indentString = ' '.repeat(indentSpaces);

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();

        // Detect the start of the <Cabbage> block
        if (trimmedLine.startsWith('<Cabbage>')) {
            insideCabbage = true;
            formattedText += line + '\n';
            return;
        }

        // Detect the end of the </Cabbage> block
        if (trimmedLine.startsWith('</Cabbage>')) {
            insideCabbage = false;

            // Process and format the JSON content
            try {
                const jsonArray = JSON.parse(cabbageContent);
                const formattedJson = formatJsonObjects(jsonArray, '');
                formattedText += formattedJson + '\n';
            } catch (error) {
                formattedText += cabbageContent + '\n'; // Keep the original content if parsing fails
            }

            formattedText += line + '\n';
            cabbageContent = ''; // Reset the Cabbage content
            return;
        }

        if (insideCabbage) {
            // Collect Cabbage content
            cabbageContent += line.trim();
        } else {
            // Regular Csound formatting logic
            const trimmedLineContent = trimmedLine.length > 0 ? line.trimStart() : line;

            // Increase indentation level for specific keywords
            if (index > 0 && shouldIncreaseIndent(lines[index - 1].trim())) {
                indents++;
            }

            // Decrease indentation level for end keywords
            if (shouldDecreaseIndent(trimmedLine)) {
                indents = Math.max(0, indents - 1);
            }

            // Add indentation
            const indentText = indentString.repeat(indents);
            formattedText += indentText + trimmedLineContent + '\n';
        }
    });

    return formattedText;
}

/**
 * Checks if the indentation should be increased based on the previous line.
 * @param previousLine - The previous line to check.
 * @returns True if indentation should be increased, otherwise false.
 */
function shouldIncreaseIndent(previousLine: string): boolean {
    return (
        previousLine.startsWith("if ") ||
        previousLine.startsWith("if(") ||
        previousLine.startsWith("instr") ||
        previousLine.startsWith("opcode") ||
        previousLine.startsWith("else") ||
        previousLine.startsWith("while")
    );
}

/**
 * Checks if the indentation should be decreased based on the current line.
 * @param currentLine - The current line to check.
 * @returns True if indentation should be decreased, otherwise false.
 */
function shouldDecreaseIndent(currentLine: string): boolean {
    return (
        currentLine.startsWith("endif") ||
        currentLine.startsWith("endin") ||
        currentLine.startsWith("endop") ||
        currentLine.startsWith("od") ||
        currentLine.startsWith("else") ||
        currentLine.startsWith("enduntil")
    );
}

/**
 * Deeply compares two objects for equality.
 * @param obj1 - The first object.
 * @param obj2 - The second object.
 * @returns True if objects are equal, otherwise false.
 */
function deepEqual(obj1: any, obj2: any): boolean {
    // If both are the same instance (including primitives)
    if (obj1 === obj2) {
        return true;
    }

    // If either is not an object, they are not equal
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return false;
    }

    // Compare the number of keys (early return if different)
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length){
        return false;
    } 

    // Recursively compare properties
    for (let key of keys1) {
        if (!deepEqual(obj1[key], obj2[key])) {
            return false;
        }
    }

    return true;
}

/**
 * Updates a JSON array by merging incoming properties from props into existing objects.
 * Properties that match the default values defined in defaultProps are removed.
 * @param jsonArray - The original JSON array.
 * @param props - The properties to merge.
 * @param defaultProps - The default properties to compare against.
 * @returns The updated JSON array.
 */
export function updateJsonArray(jsonArray: WidgetProps[], props: WidgetProps, defaultProps: WidgetProps): WidgetProps[] {
    for (let i = 0; i < jsonArray.length; i++) {
        const jsonObject = jsonArray[i];
        if (jsonObject.channel === props.channel) {
            const newObject = { ...jsonObject, ...props };

            for (let key in defaultProps) {
                // Check for deep equality when comparing objects
                if (deepEqual(newObject[key], defaultProps[key]) && key !== 'type') {
                    delete newObject[key]; // Remove matching property or object
                }
            }

            jsonArray[i] = sortOrderOfProperties(newObject);
            break; // Stop after updating the matching object
        }
    }

    return jsonArray;
}

/**
 * Formats an array of JSON objects into a string.
 * @param jsonArray - The JSON array to format.
 * @param indentString - The string used for indentation.
 * @returns The formatted JSON string.
 */
export function formatJsonObjects(jsonArray: any[], indentString: string): string {
    const formattedLines: string[] = [];

    formattedLines.push("["); // Opening bracket on its own line

    jsonArray.forEach((obj, index) => {
        const formattedObject = JSON.stringify(obj, null, 2); // Prettify JSON
        if (index < jsonArray.length - 1) {
            formattedLines.push(indentString + formattedObject + ','); // Add comma for all but the last object
        } else {
            formattedLines.push(indentString + formattedObject); // Last object without a comma
        }
    });

    formattedLines.push("]"); // Closing bracket on its own line

    return formattedLines.join('\n');
}

/**
 * Sorts the properties of a given WidgetProps object in a specific order.
 * @param obj - The WidgetProps object to sort.
 * @returns A new WidgetProps object with sorted properties.
 */
export function sortOrderOfProperties(obj: WidgetProps): WidgetProps {
    const { type, channel, bounds, range, ...rest } = obj; // Destructure type, channel, bounds, range, and the rest of the properties

    // Create an ordered bounds object only if bounds is present in the original object
    const orderedBounds = bounds ? {
        left: bounds.left,
        top: bounds.top,
        width: bounds.width,
        height: bounds.height,
    } : undefined;

    // Create an ordered range object only if range is present in the original object
    const orderedRange = range ? {
        min: range.min,
        max: range.max,
        defaultValue: range.defaultValue,
        skew: range.skew,
        increment: range.increment,
    } : undefined;

    // Return a new object with the original order and only include bounds/range if they exist
    const result: WidgetProps = {
        type,
        channel,
        ...(orderedBounds && { bounds: orderedBounds }), // Conditionally include bounds
        ...rest, // Include the rest of the properties
    };

    // Only include range if it's defined
    if (orderedRange) {
        result.range = orderedRange;
    }

    return result;
}
