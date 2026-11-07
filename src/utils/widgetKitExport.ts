// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Helpers for exporting the active widget kit into a Cabbage plugin.
 *
 * Built-in widget overrides are wired into the exported `widgetTypes.js`
 * static imports directly. This keeps the original built-in modules intact,
 * which matters for widgets such as FileButton and InfoButton that import and
 * subclass Button. Kit-only widgets still use small re-export shims that the
 * plugin's dynamic auto-discovery can find at `widgets/<type>.js`.
 */

import { WidgetFileInfo } from './widgetScan';

/**
 * Class names used by the static imports in `cabbage/widgetTypes.js`.
 * An import override must expose the kit's class under this name.
 */
export const BUILT_IN_WIDGET_CLASS_NAMES: Record<string, string> = {
    rotarySlider: 'RotarySlider',
    horizontalSlider: 'HorizontalSlider',
    horizontalRangeSlider: 'HorizontalRangeSlider',
    verticalSlider: 'VerticalSlider',
    numberSlider: 'NumberSlider',
    keyboard: 'MidiKeyboard',
    form: 'Form',
    button: 'Button',
    fileButton: 'FileButton',
    infoButton: 'InfoButton',
    optionButton: 'OptionButton',
    genTable: 'GenTable',
    label: 'Label',
    image: 'Image',
    listBox: 'ListBox',
    comboBox: 'ComboBox',
    groupBox: 'GroupBox',
    checkBox: 'Checkbox',
    csoundOutput: 'CsoundOutput',
    textEditor: 'TextEditor',
    xyPad: 'XyPad',
};

export interface KitWidgetShim {
    /** File to write into the exported `widgets/` directory (e.g. `myKnob.js`). */
    filename: string;
    content: string;
}

/** A static import in `widgetTypes.js` that should point at a kit widget. */
export interface KitWidgetImportOverride {
    /** Widget type being overridden (for logging). */
    widgetType: string;
    /** Class name imported by `widgetTypes.js` (e.g. `Button`). */
    importedClassName: string;
    /** Class name exported by the kit widget file. */
    kitClassName: string;
    /** Module specifier relative to `widgetTypes.js`. */
    specifier: string;
}

/**
 * Encodes path segments for use in an ES module specifier. Each segment is
 * encoded individually so directory separators are preserved. This keeps
 * kit folders and widget files containing characters such as `#` or `?`
 * loadable after export.
 */
function encodePathSegments(segments: string[]): string {
    return segments.map((segment) => encodeURIComponent(segment)).join('/');
}

/** Specifier from a kit-only shim in `widgets/<type>.js` to the kit file. */
function kitModuleSpecifier(kitFolderName: string, filename: string): string {
    return `./${encodePathSegments(['kits', kitFolderName, ...filename.split('/')])}`;
}

/** Specifier from `widgetTypes.js` to a kit file. */
function widgetImportSpecifier(kitFolderName: string, filename: string): string {
    return `./${encodePathSegments(['widgets', 'kits', kitFolderName, ...filename.split('/')])}`;
}

/**
 * Builds the re-export shims for kit-only widgets.
 *
 * Built-in overrides are handled by `buildKitImportOverrides()` instead, so
 * this function deliberately ignores them. That prevents a kit button shim
 * from replacing `widgets/button.js`, which is also the base class imported by
 * FileButton and InfoButton.
 *
 * - Kit-only widgets are exported under their own class name and the
 *   type-derived aliases the plugin's dynamic auto-discovery looks for.
 * - When a kit declares the same type twice, the last declaration wins,
 *   matching runtime registration.
 *
 * @param kitFolderName Folder name of the kit (used in the import path)
 * @param widgets Widgets discovered inside the kit
 * @returns Shim file names and contents, sorted by file name
 */
export function buildKitWidgetShims(kitFolderName: string, widgets: WidgetFileInfo[]): KitWidgetShim[] {
    const byType = new Map<string, WidgetFileInfo>();
    for (const widget of widgets) {
        byType.set(widget.widgetType, widget);
    }

    const shims: KitWidgetShim[] = [];
    for (const [widgetType, widget] of byType) {
        if (BUILT_IN_WIDGET_CLASS_NAMES[widgetType]) {
            continue;
        }

        // Dynamic auto-discovery in plugin mode tries both the class name and
        // the type-derived names, so expose all of them.
        const aliases = new Set<string>([
            widgetType,
            widgetType.charAt(0).toUpperCase() + widgetType.slice(1),
        ]);
        aliases.delete(widget.className);
        const clause = [widget.className, ...Array.from(aliases).map((alias) => `${widget.className} as ${alias}`)]
            .join(', ');

        const specifier = JSON.stringify(kitModuleSpecifier(kitFolderName, widget.filename));
        shims.push({
            filename: `${widgetType}.js`,
            content: `export { ${clause} } from ${specifier};\n`,
        });
    }

    return shims.sort((a, b) => a.filename.localeCompare(b.filename));
}

/**
 * Builds the static import overrides needed in the exported `widgetTypes.js`
 * for each built-in type the kit provides.
 *
 * @param kitFolderName Folder name of the kit (used in the import path)
 * @param widgets Widgets discovered inside the kit
 * @returns Overrides sorted by widget type
 */
export function buildKitImportOverrides(
    kitFolderName: string,
    widgets: WidgetFileInfo[],
): KitWidgetImportOverride[] {
    const byType = new Map<string, WidgetFileInfo>();
    for (const widget of widgets) {
        byType.set(widget.widgetType, widget);
    }

    const overrides: KitWidgetImportOverride[] = [];
    for (const [widgetType, widget] of byType) {
        const importedClassName = BUILT_IN_WIDGET_CLASS_NAMES[widgetType];
        if (!importedClassName) {
            continue;
        }
        overrides.push({
            widgetType,
            importedClassName,
            kitClassName: widget.className,
            specifier: widgetImportSpecifier(kitFolderName, widget.filename),
        });
    }

    return overrides.sort((a, b) => a.widgetType.localeCompare(b.widgetType));
}

/**
 * Rewrites the built-in widget imports in a `widgetTypes.js` source string so
 * they load the kit classes. Imports that are not overridden are left alone,
 * including FileButton and InfoButton's own imports in their own modules.
 *
 * @param source Contents of `widgetTypes.js`
 * @param overrides Overrides returned by `buildKitImportOverrides()`
 * @returns Patched source
 */
export function applyKitWidgetImportOverrides(
    source: string,
    overrides: KitWidgetImportOverride[],
): string {
    if (overrides.length === 0) {
        return source;
    }

    const byClass = new Map(overrides.map((override) => [override.importedClassName, override]));
    return source.replace(
        /import\s*\{\s*([A-Za-z_$][\w$]*)\s*\}\s*from\s*["']\.\/widgets\/[^"']+["'];?/g,
        (line, importedClassName: string) => {
            const override = byClass.get(importedClassName);
            if (!override) {
                return line;
            }
            const clause = override.kitClassName === importedClassName
                ? importedClassName
                : `${override.kitClassName} as ${importedClassName}`;
            return `import { ${clause} } from ${JSON.stringify(override.specifier)};`;
        },
    );
}
