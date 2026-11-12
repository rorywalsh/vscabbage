// Unit tests for the Cabbage 2 → Cabbage 3 orchestra rewrite, focusing on the
// Cabbage 2 multi-argument `cabbageSet` forms that Cabbage 3 rejects.
// Run with: npm run test:unit
import assert from 'assert';
import { convertCabbage2Section, rewriteOrchestra } from '../../utils/cabbage2converter';

function rewrite(orchestra: string) {
    return rewriteOrchestra(orchestra, new Map<string, string>(), new Set<string>());
}

describe('rewriteOrchestra: Cabbage 2 multi-arg cabbageSet', () => {
    it('rewrites k-rate bounds(x,y,w,h) into four dot-notation calls', () => {
        const { text, changes } = rewrite(
            'cabbageSet metro:k(32), "Spinner", "bounds", 820 + (1-kPhs)*40, 20, kPhs*80, 80\n'
        );

        assert.ok(text.includes('cabbageSet metro:k(32), "Spinner", "bounds.left", 820 + (1-kPhs)*40'));
        assert.ok(text.includes('cabbageSet metro:k(32), "Spinner", "bounds.top", 20'));
        assert.ok(text.includes('cabbageSet metro:k(32), "Spinner", "bounds.width", kPhs*80'));
        assert.ok(text.includes('cabbageSet metro:k(32), "Spinner", "bounds.height", 80'));
        assert.ok(!text.includes('"bounds", 820'));
        assert.strictEqual(changes, 1);
    });

    it('rewrites i-rate bounds(x,y,w,h) into four dot-notation calls', () => {
        const { text, changes } = rewrite('cabbageSet "Scrubber", "bounds", 5, 5, 1, 115\n');

        assert.ok(text.includes('cabbageSet "Scrubber", "bounds.left", 5'));
        assert.ok(text.includes('cabbageSet "Scrubber", "bounds.top", 5'));
        assert.ok(text.includes('cabbageSet "Scrubber", "bounds.width", 1'));
        assert.ok(text.includes('cabbageSet "Scrubber", "bounds.height", 115'));
        assert.strictEqual(changes, 1);
    });

    it('rewrites k-rate colour(r,g,b) into style.backgroundColor with sprintfk', () => {
        const { text, changes } = rewrite(
            'cabbageSet metro:k(32), "Spinner", "colour", kCol, kCol, kCol\n'
        );

        assert.ok(text.includes('cabbageSet metro:k(32), "Spinner", "style.backgroundColor", sprintfk("#%02x%02x%02x", limit(kCol, 0, 255), limit(kCol, 0, 255), limit(kCol, 0, 255))'));
        assert.strictEqual(changes, 1);
    });

    it('rewrites i-rate colour(r,g,b) into style.backgroundColor with sprintf', () => {
        const { text, changes } = rewrite('cabbageSet "box", "colour", 200, 200, 200\n');

        assert.ok(text.includes('cabbageSet "box", "style.backgroundColor", sprintf("#%02x%02x%02x", limit(200, 0, 255), limit(200, 0, 255), limit(200, 0, 255))'));
        assert.strictEqual(changes, 1);
    });

    it('leaves single-scalar property updates untouched', () => {
        const line = 'cabbageSet kTrig, "gain", "visible", 0\n';
        const { text, changes } = rewrite(line);
        assert.strictEqual(text, line);
        assert.strictEqual(changes, 0);
    });

    it('does not touch cabbageSetValue', () => {
        const line = 'cabbageSetValue "gain", 0.5\n';
        const { text, changes } = rewrite(line);
        assert.strictEqual(text, line);
        assert.strictEqual(changes, 0);
    });
});

describe('convertCabbage2Section: range increment defaults', () => {
    it('defaults to 0.01 when no explicit increment is given', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'rslider channel("x"), range(0.01, 4, 0.4, 0.5)',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const slider = json.widgets.find((w: any) => w.type === 'rotarySlider');
        assert.ok(slider);
        assert.strictEqual(slider.channels[0].range.increment, 0.01);
    });

    it('keeps an explicit increment', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'rslider channel("x"), range(0, 1, 0.5, 1, 0.001)',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const slider = json.widgets.find((w: any) => w.type === 'rotarySlider');
        assert.ok(slider);
        assert.strictEqual(slider.channels[0].range.increment, 0.001);
    });
});

describe('convertCabbage2Section: comboBox channels', () => {
    it('emits an event and a 0-based defaultValue', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'combobox channel("mode"), items("A", "B", "C"), value(1)',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const combo = json.widgets.find((w: any) => w.type === 'comboBox');
        assert.ok(combo);
        assert.strictEqual(combo.channels[0].event, 'valueChanged');
        assert.strictEqual(combo.channels[0].range.defaultValue, 0);
    });
});
