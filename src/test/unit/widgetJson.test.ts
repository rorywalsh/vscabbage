// Unit tests for the pure widget JSON merge/identity helpers.
// Run with: npm run test:unit
import assert from 'assert';
import { deepMerge, getWidgetChannelId } from '../../utils/widgetJson';

describe('deepMerge', () => {
    it('merges nested objects without mutating the inputs', () => {
        const target = { style: { colour: 'red', width: 1 }, value: 1 };
        const source = { style: { colour: 'blue' }, extra: true };

        const out = deepMerge(target, source);

        assert.deepStrictEqual(out, {
            style: { colour: 'blue', width: 1 },
            value: 1,
            extra: true,
        });
        assert.deepStrictEqual(target, { style: { colour: 'red', width: 1 }, value: 1 });
    });

    it('replaces arrays instead of merging them', () => {
        const out = deepMerge({ channels: [{ id: 'a' }] }, { channels: [{ id: 'b' }] });

        assert.deepStrictEqual(out.channels, [{ id: 'b' }]);
    });

    it('skips undefined values and keeps null by default', () => {
        const out = deepMerge({ a: 1, b: 2 }, { a: undefined, b: null });

        assert.strictEqual(out.a, 1);
        assert.strictEqual(out.b, null);
    });

    it('deletes a key when null is sent with deleteOnNull', () => {
        const out = deepMerge({ a: 1, b: 2 }, { b: null }, { deleteOnNull: true });

        assert.deepStrictEqual(out, { a: 1 });
    });

    it('returns the source when the target is not an object', () => {
        assert.deepStrictEqual(deepMerge(null, { a: 1 }), { a: 1 });
        assert.deepStrictEqual(deepMerge(3, { a: 1 }), { a: 1 });
    });
});

describe('getWidgetChannelId', () => {
    it('prefers an explicit id', () => {
        assert.strictEqual(getWidgetChannelId({ id: 'gain' }), 'gain');
    });

    it('falls back to the first channel id', () => {
        assert.strictEqual(
            getWidgetChannelId({ channels: [{ id: 'cutoff' }, { id: 'resonance' }] }),
            'cutoff',
        );
    });

    it('falls back to a legacy channel string', () => {
        assert.strictEqual(getWidgetChannelId({ channel: 'volume' }), 'volume');
    });

    it('returns an empty string when there is no identifier', () => {
        assert.strictEqual(getWidgetChannelId({}), '');
        assert.strictEqual(getWidgetChannelId(null), '');
    });
});
