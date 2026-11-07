// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Helpers for exporting the active widget kit into a Cabbage plugin.
 *
 * The exported plugin keeps the standard `widgetTypes.js` static imports, so
 * overriding a built-in type means writing a small re-export shim at
 * `widgets/<type>.js` that exposes the kit class under the name widgetTypes.js
 * expects (for example `Button`, `MidiKeyboard`, `Checkbox`).
 */

import { WidgetFileInfo } from './widgetScan';

/**
 * Class names used by the static imports in `cabbage/widgetTypes.js`.
 * A kit override shim must re-export the kit's class under this name.
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
    /** File to write into the exported `widgets/` directory (e.g. `button.js`). */
    filename: string;
    content: string;
}

/**
 * Builds the re-export shims for a kit's widgets.
 *
 * - Built-in overrides are exported under the class name `widgetTypes.js`
 *   imports (e.g. `export { DarkButton as Button } from './kits/...'`).
 * - Kit-only widgets are exported under their own class name, which the
 *   plugin's dynamic auto-discovery resolves from `widgets/<type>.js`.
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
        const builtInClassName = BUILT_IN_WIDGET_CLASS_NAMES[widgetType];
        let clause: string;
        if (builtInClassName) {
            // Static import in widgetTypes.js must resolve to this name.
            clause = builtInClassName === widget.className
                ? widget.className
                : `${widget.className} as ${builtInClassName}`;
        } else {
            // Dynamic auto-discovery in plugin mode tries both the class name
            // and the type-derived names, so expose all of them.
            const aliases = new Set<string>([
                widgetType,
                widgetType.charAt(0).toUpperCase() + widgetType.slice(1),
            ]);
            aliases.delete(widget.className);
            clause = [widget.className, ...Array.from(aliases).map((alias) => `${widget.className} as ${alias}`)]
                .join(', ');
        }

        const specifier = JSON.stringify(`./kits/${kitFolderName}/${widget.filename}`);
        shims.push({
            filename: `${widgetType}.js`,
            content: `export { ${clause} } from ${specifier};\n`,
        });
    }

    return shims.sort((a, b) => a.filename.localeCompare(b.filename));
}
