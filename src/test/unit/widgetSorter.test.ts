// Unit tests for the visual-hierarchy widget sorter.
// Run with: npm run test:unit
import assert from 'assert';
import { reorderWidgets } from '../../utils/widgetSorter';

function widget(type: string, id: string, left: number, top: number, width: number, height: number) {
    return { type, id, bounds: { left, top, width, height } };
}

describe('reorderWidgets', () => {
    it('returns non-array input unchanged', () => {
        assert.strictEqual(reorderWidgets(null as any), null);
    });

    it('places forms first, then groupboxes with their children in layout order', () => {
        const form = widget('form', 'form', 0, 0, 500, 400);
        const groupBox = widget('groupBox', 'g1', 10, 10, 200, 100);
        const insideLater = widget('button', 'b2', 150, 60, 40, 20);
        const insideEarlier = widget('button', 'b1', 20, 20, 40, 20);
        const orphan = widget('label', 'l1', 300, 300, 40, 20);

        const out = reorderWidgets([orphan, insideLater, groupBox, insideEarlier, form]);

        assert.deepStrictEqual(out.map((w) => w.id), ['form', 'g1', 'b1', 'b2', 'l1']);
    });

    it('nests a groupbox inside the smallest containing groupbox', () => {
        const outer = widget('groupBox', 'outer', 0, 0, 300, 300);
        const inner = widget('groupBox', 'inner', 20, 20, 100, 100);
        const button = widget('button', 'b', 40, 40, 20, 20);

        const out = reorderWidgets([button, outer, inner]);

        assert.deepStrictEqual(out.map((w) => w.id), ['outer', 'inner', 'b']);
    });

    it('treats widgets within the row tolerance as being on the same row', () => {
        const left = widget('button', 'left', 20, 10, 40, 20);
        const right = widget('button', 'right', 5, 12, 40, 20);

        const out = reorderWidgets([left, right]);

        assert.deepStrictEqual(out.map((w) => w.id), ['right', 'left']);
    });

    it('sorts widgets without bounds defensively', () => {
        const a = { type: 'button', id: 'a' };
        const b = { type: 'button', id: 'b', bounds: { left: 1, top: 1, width: 2, height: 2 } };

        assert.doesNotThrow(() => reorderWidgets([b, a]));
    });
});
