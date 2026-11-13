// Unit tests for widget-kit preset generation.
// Run with: npm run test:unit
import assert from 'assert';
import {
    buildHiddenProps,
    buildKitWidgetSource,
    flattenPropsForPicker,
    toKitPresetProps,
} from '../../utils/kitPreset';

const sampleProps = () => ({
    type: 'button',
    id: 'freq',
    zIndex: 0,
    bounds: { top: 5, left: 6, width: 90, height: 40 },
    channels: [{
        id: 'freq',
        event: 'valueChanged',
        range: { min: 0, max: 1, value: 0.5, defaultValue: 0, increment: 1, skew: 1 },
    }],
    visible: true,
    active: true,
    automatable: true,
    label: { text: { on: 'On', off: 'Off' }, align: 'center' },
    style: {
        opacity: 1,
        borderRadius: 8,
        on: { backgroundColor: '#111111', textColor: '#ffffff' },
    },
    valueText: { visible: true, prefix: '' },
    currentCsdFile: '/tmp/example.csd',
    value: null,
});

describe('flattenPropsForPicker', () => {
    it('flattens nested props into dot paths and skips dedicated sections', () => {
        const paths = flattenPropsForPicker(sampleProps()).map((row) => row.path);

        assert.ok(paths.includes('style.on.backgroundColor'));
        assert.ok(paths.includes('label.text.on'));
        assert.ok(paths.includes('label.align'));
        assert.ok(paths.includes('visible'));
        assert.ok(paths.includes('zIndex'));

        assert.ok(!paths.includes('bounds'));
        assert.ok(!paths.includes('channels'));
        assert.ok(!paths.includes('type'));
        assert.ok(!paths.includes('id'));
        assert.ok(!paths.includes('currentCsdFile'));
        assert.ok(!paths.includes('value'));
    });

    it('starts layout/identity props editable and style props locked', () => {
        const rows = flattenPropsForPicker(sampleProps());
        const state = new Map(rows.map((row) => [row.path, row.editableByDefault]));

        assert.strictEqual(state.get('label.text.on'), true);
        assert.strictEqual(state.get('label.align'), true);
        assert.strictEqual(state.get('visible'), true);
        assert.strictEqual(state.get('active'), true);
        assert.strictEqual(state.get('automatable'), true);

        assert.strictEqual(state.get('style.opacity'), false);
        assert.strictEqual(state.get('style.on.backgroundColor'), false);
        assert.strictEqual(state.get('valueText.visible'), false);
        assert.strictEqual(state.get('zIndex'), false);
    });
});

describe('toKitPresetProps', () => {
    it('drops per-instance values from the captured preset', () => {
        const preset = toKitPresetProps(sampleProps());

        assert.strictEqual(preset.type, 'button');
        assert.strictEqual(preset.id, undefined);
        assert.strictEqual(preset.zIndex, undefined);
        assert.strictEqual(preset.value, undefined);
        assert.strictEqual(preset.currentCsdFile, undefined);

        assert.deepStrictEqual(preset.bounds, { width: 90, height: 40 });
    });

    it('keeps channel configuration but strips the channel id and live value', () => {
        const preset = toKitPresetProps(sampleProps());
        const channel = preset.channels[0];

        assert.strictEqual(channel.id, undefined);
        assert.strictEqual(channel.range.value, undefined);
        assert.strictEqual(channel.range.min, 0);
        assert.strictEqual(channel.range.max, 1);
        assert.strictEqual(channel.range.increment, 1);
    });

    it('does not mutate the input props', () => {
        const props = sampleProps();
        toKitPresetProps(props);
        assert.strictEqual(props.id, 'freq');
        assert.strictEqual(props.bounds.top, 5);
    });
});

describe('buildHiddenProps', () => {
    it('includes the base hidden props, identity fields and deduped unchecked paths', () => {
        const hidden = buildHiddenProps(['style.opacity', 'style.opacity', 'label.align']);

        assert.ok(hidden.includes('children'));
        assert.ok(hidden.includes('type'));
        assert.ok(hidden.includes('id'));
        assert.ok(hidden.includes('style.opacity'));
        assert.ok(hidden.includes('label.align'));
        assert.strictEqual(hidden.filter((path) => path === 'style.opacity').length, 1);
    });
});

describe('buildKitWidgetSource', () => {
    it('generates a subclass preset that reuses the built-in widget', () => {
        const source = buildKitWidgetSource({
            type: 'button',
            className: 'ThemedButton',
            preset: { type: 'button', style: { borderRadius: 8 } },
            hiddenProps: ['style.borderRadius'],
            kitName: 'Studio Blue',
        });

        assert.ok(source.includes('import { Button } from "cabbage/widgets/button.js";'));
        assert.ok(source.includes('export class ThemedButton extends Button'));
        assert.ok(source.includes('static widgetType = "button";'));
        assert.ok(source.includes('cabbage-widget-type: button'));
        assert.ok(source.includes('"borderRadius": 8'));
        assert.ok(source.includes('"style.borderRadius"'));
    });

    it('rejects types that are not built-in widgets', () => {
        assert.throws(
            () => buildKitWidgetSource({
                type: 'myCustomWidget',
                className: 'ThemedThing',
                preset: {},
                hiddenProps: [],
            }),
            /Unsupported built-in widget type/,
        );
    });
});
