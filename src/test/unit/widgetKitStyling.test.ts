// Unit tests for stripLockedStyleProps (src/cabbage/kitStyle.js). Preset kit
// widgets lock their captured style properties (via hiddenProps) so that the
// backend's default style — sent on every widget update — cannot overwrite
// them. This is a regression test for the "custom kit style overwritten by the
// regular component defaults" bug.
// Run with: npm run test:unit
import assert from 'assert';
import { installDom, loadWebviewModule } from './helpers/loadWebviewModule';

let stripLockedStyleProps: any;

before(async () => {
    installDom();
    ({ stripLockedStyleProps } = await loadWebviewModule('src/cabbage/kitStyle.js'));
});

describe('stripLockedStyleProps', () => {
    it('returns the original props when there are no locked style paths', () => {
        const props = { style: { opacity: 1 }, bounds: { top: 0 } };

        assert.strictEqual(stripLockedStyleProps(props, undefined), props);
        assert.strictEqual(stripLockedStyleProps(props, []), props);
        assert.strictEqual(stripLockedStyleProps(props, ['label.text']), props);
    });

    it('removes locked style.* keys while keeping their siblings and non-style keys', () => {
        const props = {
            style: {
                opacity: 1,
                on: { backgroundColor: '#000000', textColor: '#ffffff' },
                off: { backgroundColor: '#111111' },
            },
            bounds: { top: 5, left: 6, width: 80, height: 30 },
            label: { text: { on: 'On', off: 'Off' } },
        };

        const out = stripLockedStyleProps(props, ['style.on.backgroundColor']);

        assert.deepStrictEqual(out.style.on, { textColor: '#ffffff' });
        assert.deepStrictEqual(out.style.off, { backgroundColor: '#111111' });
        assert.strictEqual(out.style.opacity, 1);
        assert.deepStrictEqual(out.bounds, props.bounds);
        assert.deepStrictEqual(out.label, props.label);
    });

    it('drops an emptied style object so the merge leaves the kit default intact', () => {
        const out = stripLockedStyleProps(
            { style: { backgroundColor: '#default' }, bounds: { width: 10 } },
            ['style.backgroundColor'],
        );

        assert.strictEqual(out.style, undefined);
        assert.deepStrictEqual(out.bounds, { width: 10 });
    });

    it('does not mutate the incoming props', () => {
        const props = { style: { on: { backgroundColor: '#000000', textColor: '#ffffff' } } };

        stripLockedStyleProps(props, ['style.on.backgroundColor']);

        assert.deepStrictEqual(props.style.on, { backgroundColor: '#000000', textColor: '#ffffff' });
    });

    it('ignores hiddenProps entries that are not style.* paths', () => {
        const props = { style: { on: { backgroundColor: '#000000' } }, label: { text: 'Hi' } };

        const out = stripLockedStyleProps(props, ['label.text', 'id', 'type']);

        assert.deepStrictEqual(out.style.on, { backgroundColor: '#000000' });
        assert.deepStrictEqual(out.label, { text: 'Hi' });
    });

    it('handles a path whose intermediate node is missing without throwing', () => {
        const props = { style: { on: { backgroundColor: '#000000' } } };

        const out = stripLockedStyleProps(props, ['style.missing.deeply.nested']);

        assert.deepStrictEqual(out.style.on, { backgroundColor: '#000000' });
    });
});
