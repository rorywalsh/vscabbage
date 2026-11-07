// Unit tests for kit widget export shims.
// Run with: npm run test:unit
import assert from 'assert';
import { WidgetFileInfo } from '../../utils/widgetScan';
import {
    BUILT_IN_WIDGET_CLASS_NAMES,
    buildKitWidgetShims,
} from '../../utils/widgetKitExport';

function widget(overrides: Partial<WidgetFileInfo> & Pick<WidgetFileInfo, 'widgetType' | 'className' | 'filename'>): WidgetFileInfo {
    return {
        category: '',
        ...overrides,
    };
}

describe('buildKitWidgetShims', () => {
    it('exports a built-in override under the class name widgetTypes.js imports', () => {
        const shims = buildKitWidgetShims('StudioDark', [
            widget({ widgetType: 'button', className: 'DarkButton', filename: 'button.js' }),
        ]);

        assert.deepStrictEqual(shims, [{
            filename: 'button.js',
            content: 'export { DarkButton as Button } from "./kits/StudioDark/button.js";\n',
        }]);
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

    it('uses the correct built-in class names for the tricky widgets', () => {
        const shims = buildKitWidgetShims('Kit', [
            widget({ widgetType: 'checkBox', className: 'ThemedCheckbox', filename: 'checkBox.js' }),
            widget({ widgetType: 'keyboard', className: 'ThemedKeyboard', filename: 'keyboard.js' }),
            widget({ widgetType: 'csoundOutput', className: 'ThemedOutput', filename: 'csoundOutput.js' }),
            widget({ widgetType: 'xyPad', className: 'ThemedPad', filename: 'xyPad.js' }),
        ]);

        const byFile = new Map(shims.map((shim) => [shim.filename, shim.content]));
        assert.ok(byFile.get('checkBox.js')?.includes('ThemedCheckbox as Checkbox'));
        assert.ok(byFile.get('keyboard.js')?.includes('ThemedKeyboard as MidiKeyboard'));
        assert.ok(byFile.get('csoundOutput.js')?.includes('ThemedOutput as CsoundOutput'));
        assert.ok(byFile.get('xyPad.js')?.includes('ThemedPad as XyPad'));
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
        const shims = buildKitWidgetShims('Kit', [
            widget({ widgetType: 'button', className: 'FirstButton', filename: 'first.js' }),
            widget({ widgetType: 'button', className: 'SecondButton', filename: 'second.js' }),
        ]);

        assert.strictEqual(shims.length, 1);
        assert.ok(shims[0].content.includes('SecondButton as Button'));
        assert.ok(shims[0].content.includes('second.js'));
    });

    it('sorts shims by filename for stable output', () => {
        const shims = buildKitWidgetShims('Kit', [
            widget({ widgetType: 'zWidget', className: 'ZWidget', filename: 'z.js' }),
            widget({ widgetType: 'aWidget', className: 'AWidget', filename: 'a.js' }),
        ]);

        assert.deepStrictEqual(shims.map((shim) => shim.filename), ['aWidget.js', 'zWidget.js']);
    });
});
