// Unit tests for kit widget export wiring.
// Run with: npm run test:unit
import assert from 'assert';
import { WidgetFileInfo } from '../../utils/widgetScan';
import {
    BUILT_IN_WIDGET_CLASS_NAMES,
    applyKitWidgetImportOverrides,
    buildKitImportOverrides,
    buildKitWidgetShims,
} from '../../utils/widgetKitExport';

function widget(overrides: Partial<WidgetFileInfo> & Pick<WidgetFileInfo, 'widgetType' | 'className' | 'filename'>): WidgetFileInfo {
    return {
        category: '',
        ...overrides,
    };
}

describe('buildKitWidgetShims', () => {
    it('leaves built-in overrides to the widgetTypes.js import rewrite', () => {
        const shims = buildKitWidgetShims('StudioDark', [
            widget({ widgetType: 'button', className: 'DarkButton', filename: 'button.js' }),
        ]);

        assert.deepStrictEqual(shims, []);
    });

    it('exports a kit-only widget under its own and type-derived names', () => {
        const shims = buildKitWidgetShims('StudioDark', [
            widget({ widgetType: 'myKnob', className: 'MyKnob', filename: 'inputs/MyKnob.js' }),
        ]);

        assert.deepStrictEqual(shims, [{
            filename: 'myKnob.js',
            content: 'export { MyKnob, MyKnob as myKnob } from "./kits/StudioDark/inputs/MyKnob.js";\n',
        }]);
    });

    it('adds the capitalised type alias when the class name differs', () => {
        const shims = buildKitWidgetShims('Kit', [
            widget({ widgetType: 'myKnob', className: 'FancyDial', filename: 'FancyDial.js' }),
        ]);

        assert.strictEqual(
            shims[0].content,
            'export { FancyDial, FancyDial as myKnob, FancyDial as MyKnob } from "./kits/Kit/FancyDial.js";\n',
        );
    });

    it('lets the last declaration win when a kit declares the same type twice', () => {
        const shims = buildKitWidgetShims('Kit', [
            widget({ widgetType: 'myKnob', className: 'FirstKnob', filename: 'first.js' }),
            widget({ widgetType: 'myKnob', className: 'SecondKnob', filename: 'second.js' }),
        ]);

        assert.strictEqual(shims.length, 1);
        assert.ok(shims[0].content.includes('SecondKnob'));
        assert.ok(shims[0].content.includes('second.js'));
    });

    it('sorts shims by filename for stable output', () => {
        const shims = buildKitWidgetShims('Kit', [
            widget({ widgetType: 'zWidget', className: 'ZWidget', filename: 'z.js' }),
            widget({ widgetType: 'aWidget', className: 'AWidget', filename: 'a.js' }),
        ]);

        assert.deepStrictEqual(shims.map((shim) => shim.filename), ['aWidget.js', 'zWidget.js']);
    });

    it('encodes URL-significant characters in kit and file names', () => {
        const shims = buildKitWidgetShims('Kit#1', [
            widget({ widgetType: 'myKnob', className: 'MyKnob', filename: 'inputs/MyKnob?.js' }),
        ]);

        assert.strictEqual(
            shims[0].content,
            'export { MyKnob, MyKnob as myKnob } from "./kits/Kit%231/inputs/MyKnob%3F.js";\n',
        );
    });
});

describe('buildKitImportOverrides', () => {
    it('maps a built-in override to a widgetTypes.js import', () => {
        const overrides = buildKitImportOverrides('StudioDark', [
            widget({ widgetType: 'button', className: 'DarkButton', filename: 'button.js' }),
        ]);

        assert.deepStrictEqual(overrides, [{
            widgetType: 'button',
            importedClassName: 'Button',
            kitClassName: 'DarkButton',
            specifier: './widgets/kits/StudioDark/button.js',
        }]);
    });

    it('uses the correct class names for the tricky widgets', () => {
        const overrides = buildKitImportOverrides('Kit', [
            widget({ widgetType: 'checkBox', className: 'ThemedCheckbox', filename: 'checkBox.js' }),
            widget({ widgetType: 'keyboard', className: 'ThemedKeyboard', filename: 'keyboard.js' }),
            widget({ widgetType: 'csoundOutput', className: 'ThemedOutput', filename: 'csoundOutput.js' }),
            widget({ widgetType: 'xyPad', className: 'ThemedPad', filename: 'xyPad.js' }),
        ]);

        const byType = new Map(overrides.map((override) => [override.widgetType, override]));
        assert.strictEqual(byType.get('checkBox')?.importedClassName, 'Checkbox');
        assert.strictEqual(byType.get('keyboard')?.importedClassName, 'MidiKeyboard');
        assert.strictEqual(byType.get('csoundOutput')?.importedClassName, 'CsoundOutput');
        assert.strictEqual(byType.get('xyPad')?.importedClassName, 'XyPad');
    });

    it('covers every built-in type used by widgetTypes.js', () => {
        const expected = [
            'rotarySlider', 'horizontalSlider', 'horizontalRangeSlider', 'verticalSlider',
            'numberSlider', 'keyboard', 'form', 'button', 'fileButton', 'infoButton',
            'optionButton', 'genTable', 'label', 'image', 'listBox', 'comboBox',
            'groupBox', 'checkBox', 'csoundOutput', 'textEditor', 'xyPad',
        ];
        assert.deepStrictEqual(Object.keys(BUILT_IN_WIDGET_CLASS_NAMES).sort(), expected.sort());
    });

    it('lets the last declaration win when a kit declares the same type twice', () => {
        const overrides = buildKitImportOverrides('Kit', [
            widget({ widgetType: 'button', className: 'FirstButton', filename: 'first.js' }),
            widget({ widgetType: 'button', className: 'SecondButton', filename: 'second.js' }),
        ]);

        assert.strictEqual(overrides.length, 1);
        assert.strictEqual(overrides[0].kitClassName, 'SecondButton');
        assert.ok(overrides[0].specifier.includes('second.js'));
    });

    it('encodes URL-significant characters in kit and file names', () => {
        const overrides = buildKitImportOverrides('Kit#1', [
            widget({ widgetType: 'button', className: 'DarkButton', filename: 'button?.js' }),
        ]);

        assert.strictEqual(overrides[0].specifier, './widgets/kits/Kit%231/button%3F.js');
    });
});

describe('applyKitWidgetImportOverrides', () => {
    it('rewrites built-in imports without touching FileButton or InfoButton', () => {
        const source = [
            'import { Button } from "./widgets/button.js";',
            'import { FileButton } from "./widgets/fileButton.js";',
            'import { InfoButton } from "./widgets/infoButton.js";',
            'import { ComboBox } from "./widgets/comboBox.js";',
        ].join('\n');

        const overrides = buildKitImportOverrides('StudioDark', [
            widget({ widgetType: 'button', className: 'DarkButton', filename: 'button.js' }),
            widget({ widgetType: 'comboBox', className: 'DarkCombo', filename: 'comboBox.js' }),
        ]);

        const patched = applyKitWidgetImportOverrides(source, overrides);

        assert.strictEqual(patched, [
            'import { DarkButton as Button } from "./widgets/kits/StudioDark/button.js";',
            'import { FileButton } from "./widgets/fileButton.js";',
            'import { InfoButton } from "./widgets/infoButton.js";',
            'import { DarkCombo as ComboBox } from "./widgets/kits/StudioDark/comboBox.js";',
        ].join('\n'));
    });

    it('returns the source unchanged when there are no overrides', () => {
        const source = 'import { Button } from "./widgets/button.js";';

        assert.strictEqual(applyKitWidgetImportOverrides(source, []), source);
    });

    it('omits the alias when the kit class keeps the built-in name', () => {
        const source = 'import { Button } from "./widgets/button.js";';
        const overrides = buildKitImportOverrides('Kit', [
            widget({ widgetType: 'button', className: 'Button', filename: 'button.js' }),
        ]);

        assert.strictEqual(
            applyKitWidgetImportOverrides(source, overrides),
            'import { Button } from "./widgets/kits/Kit/button.js";',
        );
    });
});
