// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

console.log("Cabbage: loading widgetTypes.js...");

/**
 * Widget Type System - Hybrid Static/Dynamic Loading
 * ==================================================
 * 
 * Built-in widgets are loaded statically for fast initial load time.
 * Custom widgets are loaded dynamically to support user-defined widgets.
 * 
 * ADDING CUSTOM WIDGETS:
 * ----------------------
 * Use the VS Code extension commands (recommended):
 *    - Run "Cabbage: Set Custom Widget Directory" to configure a custom widgets folder
 *    - Run "Cabbage: Create New Custom Widget" to scaffold a new widget from the template
 *    - The backend will automatically discover widgets in configured directories
 * 
 * Custom widgets are registered at runtime and loaded dynamically when first used.
 */

// Static imports for all built-in widgets (fast loading)
import { RotarySlider } from "./widgets/rotarySlider.js";
import { HorizontalSlider } from "./widgets/horizontalSlider.js";
import { HorizontalRangeSlider } from "./widgets/horizontalRangeSlider.js";
import { VerticalSlider } from "./widgets/verticalSlider.js";
import { NumberSlider } from "./widgets/numberSlider.js";
import { MidiKeyboard } from "./widgets/keyboard.js";
import { Form } from "./widgets/form.js";
import { Button } from "./widgets/button.js";
import { FileButton } from "./widgets/fileButton.js";
import { InfoButton } from "./widgets/infoButton.js";
import { OptionButton } from "./widgets/optionButton.js";
import { GenTable } from "./widgets/genTable.js";
import { Label } from "./widgets/label.js";
import { Image } from "./widgets/image.js";
import { ListBox } from "./widgets/listBox.js";
import { ComboBox } from "./widgets/comboBox.js";
import { GroupBox } from "./widgets/groupBox.js";
// @ts-ignore - TypeScript case-sensitivity warning on macOS filesystem
import { Checkbox } from "./widgets/checkBox.js";
import { CsoundOutput } from "./widgets/csoundOutput.js";
import { TextEditor } from "./widgets/textEditor.js";
import { XyPad } from "./widgets/xyPad.js";


/**
 * Built-in widget constructors (already loaded statically)
 */
const BUILTIN_WIDGETS = {
	"rotarySlider": RotarySlider,
	"horizontalSlider": HorizontalSlider,
	"horizontalRangeSlider": HorizontalRangeSlider,
	"verticalSlider": VerticalSlider,
	"numberSlider": NumberSlider,
	"keyboard": MidiKeyboard,
	"form": Form,
	"button": Button,
	"fileButton": FileButton,
	"infoButton": InfoButton,
	"optionButton": OptionButton,
	"genTable": GenTable,
	"label": Label,
	"image": Image,
	"listBox": ListBox,
	"comboBox": ComboBox,
	"groupBox": GroupBox,
	"checkBox": Checkbox,
	"csoundOutput": CsoundOutput,
	"textEditor": TextEditor,
	"xyPad": XyPad
};

/**
 * Registry for custom widgets (loaded dynamically)
 * Format: "widgetType": { file: "full_uri", class: "ClassName" }
 */
const CUSTOM_WIDGET_REGISTRY = {};

/**
 * Cache for dynamically loaded custom widget constructors
 */
const customWidgetCache = {};

/**
 * Gets a widget constructor - built-in widgets return immediately, custom widgets load dynamically.
 * 
 * @param {string} type - The widget type to get (e.g., "button", "rotarySlider", "myCustomWidget")
 * @returns {Promise<Function>} - The widget constructor class
 * @throws {Error} - If the widget type is not registered or fails to load
 */
async function getWidget(type) {
	// Check if it's a built-in widget (return immediately - no async loading needed!)
	if (type in BUILTIN_WIDGETS) {
		return BUILTIN_WIDGETS[type];
	}

	// Check if it's a custom widget
	if (type in CUSTOM_WIDGET_REGISTRY) {
		// Return from cache if already loaded
		if (customWidgetCache[type]) {
			console.log(`Cabbage: Custom widget "${type}" loaded from cache`);
			return customWidgetCache[type];
		}

		// Load custom widget dynamically
		const widgetInfo = CUSTOM_WIDGET_REGISTRY[type];
		try {
			// Add cache-busting timestamp to ensure fresh code on reload
			const modulePath = `${widgetInfo.file}?t=${Date.now()}`;

			console.log(`Cabbage: Loading custom widget "${type}" from:`, modulePath);
			console.log(`Cabbage: Expected class name:`, widgetInfo.class);

			// Dynamic import of the custom widget module
			const module = await import(modulePath);

			console.log(`Cabbage: Loaded module for "${type}":`, module);
			console.log(`Cabbage: Module keys:`, Object.keys(module));

			// Extract the class from the module
			const WidgetClass = module[widgetInfo.class];
			if (!WidgetClass) {
				console.error(`Cabbage: Available exports in module:`, Object.keys(module));
				throw new Error(`Class "${widgetInfo.class}" not found in custom widget ${widgetInfo.file}`);
			}

			console.log(`Cabbage: Successfully loaded custom widget class "${widgetInfo.class}" for type "${type}"`);

			// Cache for future use
			customWidgetCache[type] = WidgetClass;
			return WidgetClass;
		} catch (error) {
			console.error(`Cabbage: Failed to load custom widget "${type}":`, error);
			console.error(`Cabbage: Error stack:`, error.stack);
			throw error;
		}
	}

	// Widget type not found in registry - try auto-discovery (for plugin mode)
	console.log(`Cabbage: Widget type "${type}" not registered, attempting auto-discovery...`);

	try {
		// Try to dynamically import based on widget type name
		// Convert type to filename: camelCase -> PascalCase (e.g., "tableVisualiser" -> "TableVisualiser")
		const className = type.charAt(0).toUpperCase() + type.slice(1);
		const possiblePaths = [
			`./widgets/${className}.js`,
			`./widgets/${type}.js`,
		];

		for (const modulePath of possiblePaths) {
			try {
				console.log(`Cabbage: Trying to load widget from: ${modulePath}`);
				const module = await import(`${modulePath}?t=${Date.now()}`);

				// Try to find the class in the module
				const WidgetClass = module[className] || module[type] || module.default;

				if (WidgetClass) {
					console.log(`Cabbage: Successfully auto-discovered widget "${type}" from ${modulePath}`);
					// Cache it for future use
					customWidgetCache[type] = WidgetClass;
					// Also register it in the registry
					CUSTOM_WIDGET_REGISTRY[type] = { file: modulePath, class: className };
					return WidgetClass;
				}
			} catch (e) {
				// Continue to next path
				console.log(`Cabbage: Could not load from ${modulePath}:`, e.message);
			}
		}

		// If we got here, auto-discovery failed
		throw new Error(`Auto-discovery failed for widget type "${type}"`);

	} catch (error) {
		console.error(`Cabbage: Auto-discovery failed for "${type}":`, error);
		throw new Error(`Widget type "${type}" is not registered. Available types: ${Object.keys(BUILTIN_WIDGETS).concat(Object.keys(CUSTOM_WIDGET_REGISTRY)).join(', ')}`);
	}
}

/**
 * Proxy object that provides access to widget constructors.
 * Built-in widgets are returned immediately (already loaded).
 * Custom widgets are loaded dynamically on first access.
 * 
 * Usage: const ButtonClass = await widgetConstructors.button;
 * Or with bracket notation: await widgetConstructors['button']
 */
export const widgetConstructors = new Proxy({}, {
	get(target, prop) {
		// Return a promise that resolves to the widget constructor
		return getWidget(prop);
	},
	has(target, prop) {
		// Check if widget type is registered (built-in or custom)
		return prop in BUILTIN_WIDGETS || prop in CUSTOM_WIDGET_REGISTRY;
	},
	ownKeys(target) {
		// Return all registered widget types (built-in + custom)
		return Object.keys(BUILTIN_WIDGETS).concat(Object.keys(CUSTOM_WIDGET_REGISTRY));
	},
	getOwnPropertyDescriptor(target, prop) {
		// Required for Object.keys() to work on the proxy
		if (prop in BUILTIN_WIDGETS || prop in CUSTOM_WIDGET_REGISTRY) {
			return { enumerable: true, configurable: true };
		}
	}
});

export const WidgetProps = {
	"type": "",
	"channel": "",
	"key": ""
};

/**
 * Get all available widget types (built-in + custom).
 * Returns a fresh array each time to ensure custom widgets are included.
 * 
 * @returns {string[]} Array of all registered widget type names
 */
export function getWidgetTypes() {
	return Object.keys(BUILTIN_WIDGETS).concat(Object.keys(CUSTOM_WIDGET_REGISTRY));
}

/**
 * Legacy export for backward compatibility.
 * Note: Direct array mutations won't work - use registerWidget() instead.
 * Getter ensures this always returns the current state.
 */
export let widgetTypes = Object.keys(BUILTIN_WIDGETS);

/**
 * Initialise default properties based on widget type.
 * Gets the widget constructor and instantiates it to get default props.
 * Built-in widgets load instantly, custom widgets load dynamically.
 * 
 * @param {string} type - The type of widget to initialize.
 * @returns {Promise<Object>} - The default properties of the widget.
 */
export async function initialiseDefaultProps(type) {
	try {
		const WidgetConstructor = await getWidget(type);
		return new WidgetConstructor().props;
	} catch (error) {
		console.error(`Found unsupported widget type: ${type}`, error);
		return null;
	}
}

/**
 * Register a custom widget at runtime.
 * This allows users to add their own widget types without modifying the built-in widgets.
 * The widget type will automatically appear in the widget type lists.
 * 
 * @param {string} type - The widget type name (e.g., "myCustomWidget")
 * @param {string} file - The full webview URI to the widget module
 * @param {string} className - The exported class name (e.g., "MyCustomWidget")
 */
export function registerWidget(type, file, className) {
	if (type in BUILTIN_WIDGETS) {
		console.error(`Cannot register custom widget "${type}" - this conflicts with a built-in widget`);
		return;
	}

	if (CUSTOM_WIDGET_REGISTRY[type]) {
		console.warn(`Custom widget type "${type}" is already registered. Overwriting.`);
	}

	CUSTOM_WIDGET_REGISTRY[type] = { file, class: className };

	// Update the widgetTypes export to reflect the new registry state
	widgetTypes = Object.keys(BUILTIN_WIDGETS).concat(Object.keys(CUSTOM_WIDGET_REGISTRY));

	console.log(`Registered custom widget: ${type} -> ${file} (${className})`);
}

