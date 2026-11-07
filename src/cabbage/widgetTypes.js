// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.


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
 * Format: "widgetType": { file: "full_uri", class: "ClassName", category: "Category" }
 */
const CUSTOM_WIDGET_REGISTRY = {};

/**
 * Widget kits. A kit may deliberately override a built-in type (for example a
 * themed `button`) or provide kit-only types.
 * Format: "kitId": { id, name, description, widgets: { "type": { file, class } } }
 */
const WIDGET_KITS = {};

/** Currently selected kit id, or '' for built-ins only. */
let activeWidgetKit = '';

/**
 * Cache for dynamically loaded custom widget constructors
 */
const customWidgetCache = {};

/**
 * Clears cached constructors so a newly selected kit takes effect.
 */
function clearWidgetCache() {
	for (const key of Object.keys(customWidgetCache)) {
		delete customWidgetCache[key];
	}
}

/**
 * Returns the active kit's entry for a type, or null.
 */
function getActiveKitWidgetInfo(type) {
	if (!activeWidgetKit || !WIDGET_KITS[activeWidgetKit]) {
		return null;
	}
	const widgets = WIDGET_KITS[activeWidgetKit].widgets;
	return widgets && widgets[type] ? widgets[type] : null;
}

/**
 * Gets a widget constructor - built-in widgets return immediately, custom widgets load dynamically.
 * 
 * @param {string} type - The widget type to get (e.g., "button", "rotarySlider", "myCustomWidget")
 * @returns {Promise<Function>} - The widget constructor class
 * @throws {Error} - If the widget type is not registered or fails to load
 */
async function getWidget(type) {
	// The active kit wins over built-ins. This is what allows a kit to theme
	// an existing type without changing the CSD (`"type": "button"` stays).
	const kitWidgetInfo = getActiveKitWidgetInfo(type);
	if (kitWidgetInfo) {
		if (customWidgetCache[type]) {
			return customWidgetCache[type];
		}
		try {
			const module = await import(`${kitWidgetInfo.file}?t=${Date.now()}`);
			const WidgetClass = module[kitWidgetInfo.class];
			if (!WidgetClass) {
				console.error(`Cabbage: Available exports in module:`, Object.keys(module));
				throw new Error(`Class "${kitWidgetInfo.class}" not found in widget kit file ${kitWidgetInfo.file}`);
			}
			customWidgetCache[type] = WidgetClass;
			return WidgetClass;
		} catch (error) {
			console.error(`Cabbage: Failed to load kit widget "${type}":`, error);
			throw error;
		}
	}

	// Check if it's a built-in widget (return immediately - no async loading needed!)
	if (type in BUILTIN_WIDGETS) {
		return BUILTIN_WIDGETS[type];
	}

	// Check if it's a custom widget
	if (type in CUSTOM_WIDGET_REGISTRY) {
		// Return from cache if already loaded
		if (customWidgetCache[type]) {
			return customWidgetCache[type];
		}

		// Load custom widget dynamically
		const widgetInfo = CUSTOM_WIDGET_REGISTRY[type];
		try {
			// Add cache-busting timestamp to ensure fresh code on reload
			const modulePath = `${widgetInfo.file}?t=${Date.now()}`;


			// Dynamic import of the custom widget module
			const module = await import(modulePath);


			// Extract the class from the module
			const WidgetClass = module[widgetInfo.class];
			if (!WidgetClass) {
				console.error(`Cabbage: Available exports in module:`, Object.keys(module));
				throw new Error(`Class "${widgetInfo.class}" not found in custom widget ${widgetInfo.file}`);
			}


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
	// If the extension/webview is still populating the custom widget registry
	// there may be a short window where the registry is empty. Wait a small
	// amount of time for any late registrations to arrive before falling back
	// to auto-discovery. This reduces races when the extension replies late.
	async function waitForRegistryEntry(widgetType, timeout = 3000) {
		const start = Date.now();
		const interval = 150;
		while (!(widgetType in CUSTOM_WIDGET_REGISTRY) && (Date.now() - start) < timeout) {
			await new Promise(r => setTimeout(r, interval));
		}
		return widgetType in CUSTOM_WIDGET_REGISTRY;
	}

	// Wait up to 3s (configurable) for a late registry entry
	const registryFound = await waitForRegistryEntry(type, 3000);
	if (registryFound) {
		// If it appeared in the registry, attempt to load it the same way as
		// the earlier custom-widget branch did.
		try {
			const widgetInfo = CUSTOM_WIDGET_REGISTRY[type];
			const modulePath = `${widgetInfo.file}?t=${Date.now()}`;
			const module = await import(modulePath);
			const WidgetClass = module[widgetInfo.class];
			if (!WidgetClass) throw new Error(`Class "${widgetInfo.class}" not found in custom widget ${widgetInfo.file}`);
			customWidgetCache[type] = WidgetClass;
			return WidgetClass;
		} catch (err) {
			console.error(`Cabbage: Failed to load late-registered widget "${type}":`, err);
			// fall through to auto-discovery below
		}
	}

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
				const module = await import(`${modulePath}?t=${Date.now()}`);

				// Try to find the class in the module
				const WidgetClass = module[className] || module[type] || module.default;

				if (WidgetClass) {
					// Cache it for future use
					customWidgetCache[type] = WidgetClass;
					// Also register it in the registry
					CUSTOM_WIDGET_REGISTRY[type] = { file: modulePath, class: className, category: '' };
					return WidgetClass;
				}
			} catch (e) {
				// Continue to next path
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
		// Check if widget type is registered (built-in, custom or active kit)
		return prop in BUILTIN_WIDGETS || prop in CUSTOM_WIDGET_REGISTRY || getActiveKitWidgetInfo(prop) !== null;
	},
	ownKeys(target) {
		// Return all registered widget types (built-in + custom + active kit)
		const types = Object.keys(BUILTIN_WIDGETS).concat(Object.keys(CUSTOM_WIDGET_REGISTRY));
		if (activeWidgetKit && WIDGET_KITS[activeWidgetKit]) {
			for (const type of Object.keys(WIDGET_KITS[activeWidgetKit].widgets)) {
				if (!types.includes(type)) {
					types.push(type);
				}
			}
		}
		return types;
	},
	getOwnPropertyDescriptor(target, prop) {
		// Required for Object.keys() to work on the proxy
		if (prop in BUILTIN_WIDGETS || prop in CUSTOM_WIDGET_REGISTRY || getActiveKitWidgetInfo(prop) !== null) {
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
 * Built-in widget type names. Fresh array so callers cannot mutate the registry.
 * @returns {string[]}
 */
export function getBuiltinWidgetTypes() {
	return Object.keys(BUILTIN_WIDGETS);
}

/**
 * Custom widget type names registered so far.
 * @returns {string[]}
 */
export function getCustomWidgetTypes() {
	return Object.keys(CUSTOM_WIDGET_REGISTRY);
}

/**
 * Custom widget types grouped by category. Widgets discovered directly in the
 * widgets folder are grouped under the empty-string key; widgets found in a
 * category subfolder are grouped under that folder's name.
 *
 * @returns {Object<string, string[]>} Category name -> widget type names
 */
export function getCustomWidgetCategories() {
	const groups = {};
	for (const type of Object.keys(CUSTOM_WIDGET_REGISTRY)) {
		const info = CUSTOM_WIDGET_REGISTRY[type];
		const category = (info && info.category) ? info.category : '';
		if (!groups[category]) {
			groups[category] = [];
		}
		groups[category].push(type);
	}
	return groups;
}

/**
 * Registers a widget kit's metadata. Kit widgets are registered separately
 * with registerKitWidget().
 *
 * @param {string} id - Kit id (also used by the `cabbage.widgetKit` setting)
 * @param {string} [name] - Human-readable kit name
 * @param {string} [description] - Optional description
 */
export function registerWidgetKit(id, name = id, description = '') {
	if (!id) {
		return;
	}
	if (!WIDGET_KITS[id]) {
		WIDGET_KITS[id] = {
			id,
			name: name || id,
			description: description || '',
			widgets: {},
		};
		return;
	}
	WIDGET_KITS[id].name = name || id;
	WIDGET_KITS[id].description = description || '';
}

/**
 * Registers a widget that belongs to a kit. Unlike registerWidget(), built-in
 * type names are allowed here: that is how a kit themes an existing widget
 * while the CSD keeps `"type": "button"`.
 *
 * @param {string} kitId - Kit id
 * @param {string} type - Widget type to provide
 * @param {string} file - Full webview URI to the widget module
 * @param {string} className - Exported class name
 */
export function registerKitWidget(kitId, type, file, className) {
	if (!kitId || !type || !file || !className) {
		return;
	}
	registerWidgetKit(kitId);
	WIDGET_KITS[kitId].widgets[type] = { file, class: className };
	if (activeWidgetKit === kitId) {
		delete customWidgetCache[type];
	}
}

/**
 * Selects the active kit. An unknown or empty id falls back to built-ins.
 *
 * @param {string} kitId
 * @returns {string} The active kit id ('' when none)
 */
export function setActiveWidgetKit(kitId) {
	const next = (kitId && WIDGET_KITS[kitId]) ? kitId : '';
	if (next !== activeWidgetKit) {
		activeWidgetKit = next;
		clearWidgetCache();
	}
	return activeWidgetKit;
}

/** @returns {string} Active kit id, or '' when using built-ins only. */
export function getActiveWidgetKit() {
	return activeWidgetKit;
}

/** @returns {string} Active kit display name, or ''. */
export function getActiveWidgetKitName() {
	return (activeWidgetKit && WIDGET_KITS[activeWidgetKit]) ? WIDGET_KITS[activeWidgetKit].name : '';
}

/** @returns {string[]} All widget types provided by the active kit. */
export function getActiveKitWidgetTypes() {
	return (activeWidgetKit && WIDGET_KITS[activeWidgetKit])
		? Object.keys(WIDGET_KITS[activeWidgetKit].widgets)
		: [];
}

/**
 * Widget types provided by the active kit that are not built-ins. These are
 * the only kit widgets that should appear as extra menu entries; overrides of
 * built-ins already appear once in the built-in list.
 *
 * @returns {string[]}
 */
export function getActiveKitExtraWidgetTypes() {
	return getActiveKitWidgetTypes().filter((type) => !(type in BUILTIN_WIDGETS));
}

/**
 * Get all available widget types (built-in + custom).
 * Returns a fresh array each time to ensure custom widgets are included.
 * 
 * @returns {string[]} Array of all registered widget type names
 */
export function getWidgetTypes() {
	return getBuiltinWidgetTypes().concat(getCustomWidgetTypes());
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
 * @param {string} [category] - Optional category (from the widget's subfolder)
 */
export function registerWidget(type, file, className, category = '') {
	if (type in BUILTIN_WIDGETS) {
		console.error(`Cannot register custom widget "${type}" - this conflicts with a built-in widget`);
		return;
	}

	if (CUSTOM_WIDGET_REGISTRY[type]) {
		console.warn(`Custom widget type "${type}" is already registered. Overwriting.`);
	}

	CUSTOM_WIDGET_REGISTRY[type] = { file, class: className, category: category || '' };

	// Update the widgetTypes export to reflect the new registry state
	widgetTypes = Object.keys(BUILTIN_WIDGETS).concat(Object.keys(CUSTOM_WIDGET_REGISTRY));

	console.log(`Registered custom widget: ${type} -> ${file} (${className})`);
}

