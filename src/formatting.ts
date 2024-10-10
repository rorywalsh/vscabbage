import { WidgetProps } from './cabbage/widgetTypes';

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
				formattedText += cabbageContent + '\n'; // If parsing fails, keep the original content
			}

			formattedText += line + '\n';
			cabbageContent = ''; // Reset the Cabbage content
			return;
		}

		if (insideCabbage) {
			// Collect Cabbage content
			cabbageContent += line.trim();
		} else {
			// Continue with the regular Csound formatting logic

			// Trim leading whitespace from non-empty lines
			const trimmedLine = line.trim().length > 0 ? line.trimStart() : line;

			// Increase indentation level for specific keywords
			if (index > 0 && (
				lines[index - 1].trim().startsWith("if ") ||
				lines[index - 1].trim().startsWith("if(") ||
				lines[index - 1].trim().startsWith("instr") ||
				lines[index - 1].trim().startsWith("opcode") ||
				lines[index - 1].trim().startsWith("else") ||
				lines[index - 1].trim().startsWith("while")
			)) {
				indents++;
			}

			// Decrease indentation level for end keywords
			if (
				trimmedLine.startsWith("endif") ||
				trimmedLine.startsWith("endin") ||
				trimmedLine.startsWith("endop") ||
				trimmedLine.startsWith("od") ||
				trimmedLine.startsWith("else") ||
				trimmedLine.startsWith("enduntil")
			) {
				indents = Math.max(0, indents - 1);
			}

			// Add indentation
			const indentText = indentString.repeat(indents);
			formattedText += indentText + trimmedLine + '\n';
		}
	});

	return formattedText;
}

function deepEqual(obj1: any, obj2: any): boolean {
    // If both are the same instance (including primitives)
    if (obj1 === obj2) return true;

    // If either is not an object, they are not equal
    if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 === null || obj2 === null) {
        return false;
    }

    // Compare the number of keys (early return if different)
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    if (keys1.length !== keys2.length) return false;

    // Recursively compare properties
    for (let key of keys1) {
        if (!deepEqual(obj1[key], obj2[key])) return false;
    }

    return true;
}

 //this function will merge incoming properties (from the props object) into an existing JSON array, while removing any 
//properties that match the default values defined in the defaultProps object.
export function updateJsonArray(jsonArray: WidgetProps[], props: WidgetProps, defaultProps: WidgetProps): WidgetProps[] {

    for (let i = 0; i < jsonArray.length; i++) {
        let jsonObject = jsonArray[i];
        if (jsonObject.channel === props.channel) {
            let newObject = { ...jsonObject, ...props };

            for (let key in defaultProps) {
                // Check for deep equality when comparing objects
                if (deepEqual(newObject[key], defaultProps[key]) && key !== 'type') {
                    delete newObject[key]; // Remove matching property or object
                }
            }

            jsonArray[i] = sortOrderOfProperties(newObject);
            break;
        }
    }

    return jsonArray;
}


// Helper function to format JSON objects on single lines within the array
export function formatJsonObjects(jsonArray: any[], indentString: string): string {
	const formattedLines = [];

	formattedLines.push("[");  // Opening bracket on its own line

	jsonArray.forEach((obj, index) => {
		const formattedObject = JSON.stringify(obj);
		if (index < jsonArray.length - 1) {
			formattedLines.push(indentString + formattedObject + ','); // Add comma for all but the last object
		} else {
			formattedLines.push(indentString + formattedObject); // Last object without a comma
		}
	});

	formattedLines.push("]");  // Closing bracket on its own line

	return formattedLines.join('\n');
}

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
        ...rest,                                         // Include the rest of the properties
    };

    // Only include range if it's defined
    if (orderedRange) {
        result.range = orderedRange;
    }

    return result;
}

