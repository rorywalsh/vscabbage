// Unit tests for the legacy Csound/Cabbage formatter helpers.
// Run with: npm run test:unit
import assert from 'assert';
import {
    formatJsonObjects,
    formatText,
    sortOrderOfProperties,
    updateJsonArray,
} from '../../formatting';

describe('formatText', () => {
    it('indents instr / if blocks and dedents their end keywords', () => {
        const out = formatText('instr 1\nif 1 == 1 then\nprint 1\nendif\nendin');

        assert.strictEqual(
            out,
            'instr 1\n    if 1 == 1 then\n        print 1\n    endif\nendin\n',
        );
    });

    it('respects a custom indent width', () => {
        const out = formatText('instr 1\nprint 1\nendin', 2);

        assert.strictEqual(out, 'instr 1\n  print 1\nendin\n');
    });

    it('formats a JSON array inside a Cabbage block', () => {
        const out = formatText('<Cabbage>\n[{"type":"form"}]\n</Cabbage>');

        assert.ok(out.startsWith('<Cabbage>\n'));
        assert.ok(out.includes('"type": "form"'));
        assert.ok(out.trimEnd().endsWith('</Cabbage>'));
    });

    it('keeps unparseable Cabbage content verbatim', () => {
        const out = formatText('<Cabbage>\nnot json\n</Cabbage>');

        assert.ok(out.includes('not json'));
    });
});

describe('formatJsonObjects', () => {
    it('prepends the indent to each object and separates them with commas', () => {
        const out = formatJsonObjects([{ a: 1 }, { b: 2 }], '  ');

        // Note: the indent is applied to the first line of each pretty-printed
        // object only (JSON.stringify supplies the inner indentation).
        assert.strictEqual(
            out,
            '[\n  {\n  "a": 1\n},\n  {\n  "b": 2\n}\n]',
        );
    });
});

describe('updateJsonArray', () => {
    it('merges props and drops values that still match the defaults', () => {
        const bounds = { left: 0, top: 0, width: 10, height: 10 };
        const range = { min: 0, max: 1, defaultValue: 0, skew: 1, increment: 0.001 };
        const defaults = { type: 'button', bounds, range, label: 'old' };
        const arr: any[] = [{
            type: 'button',
            channel: 'x',
            bounds: { ...bounds },
            range: { ...range },
            label: 'old',
        }];
        const props: any = {
            type: 'button',
            channel: 'x',
            bounds: { ...bounds },
            range: { ...range },
            label: 'new',
        };

        const out = updateJsonArray(arr, props, defaults);

        assert.strictEqual(out[0].label, 'new');
        assert.strictEqual(out[0].channel, 'x');
        assert.strictEqual(out[0].type, 'button');
        assert.strictEqual(out[0].bounds, undefined);
        assert.strictEqual(out[0].range, undefined);
    });

    it('leaves non-matching channels untouched', () => {
        const arr: any[] = [{ type: 'button', channel: 'y', label: 'unchanged' }];

        const out = updateJsonArray(arr, { type: 'button', channel: 'x' } as any, {} as any);

        assert.deepStrictEqual(out, [{ type: 'button', channel: 'y', label: 'unchanged' }]);
    });
});

describe('sortOrderOfProperties', () => {
    it('puts type, channel and bounds first and range last', () => {
        const out = sortOrderOfProperties({
            channel: 'x',
            extra: 1,
            range: { min: 0, max: 1, defaultValue: 0, skew: 1, increment: 0.1 },
            type: 'button',
            bounds: { left: 1, top: 2, width: 3, height: 4 },
        } as any);

        assert.deepStrictEqual(Object.keys(out), ['type', 'channel', 'bounds', 'extra', 'range']);
        assert.deepStrictEqual(out.bounds, { left: 1, top: 2, width: 3, height: 4 });
        assert.deepStrictEqual(out.range, {
            min: 0, max: 1, defaultValue: 0, skew: 1, increment: 0.1,
        });
    });

    it('omits absent bounds/range rather than emitting undefined', () => {
        const out = sortOrderOfProperties({ type: 'label', channel: 'y' } as any);

        assert.deepStrictEqual(Object.keys(out), ['type', 'channel']);
    });
});
