// Unit tests for the Cabbage 2 → Cabbage 3 orchestra rewrite, focusing on the
// Cabbage 2 multi-argument `cabbageSet` forms that Cabbage 3 rejects.
// Run with: npm run test:unit
import assert from 'assert';
import {
    buildMouseChannels,
    convertCabbage2Section,
    convertCabbage2ToCabbage3,
    detectMouseChannels,
    detectSoundfilerLoading,
    rewriteOrchestra,
} from '../../utils/cabbage2converter';

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

describe('rotary slider bounds scaling', () => {
    it('leaves unlabelled rotary sliders at full size', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'rslider bounds(0, 0, 80, 80), channel("x")',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const slider = json.widgets.find((w: any) => w.type === 'rotarySlider');
        assert.ok(slider);
        assert.deepStrictEqual(slider.bounds, { left: 0, top: 0, width: 80, height: 80 });
        assert.strictEqual(result.scaledRotarySliders, 0);
    });

    it('scales labelled rotary sliders to 85% and centres them', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'rslider bounds(0, 0, 80, 80), text("Gain"), channel("x")',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const slider = json.widgets.find((w: any) => w.type === 'rotarySlider');
        assert.ok(slider);
        assert.deepStrictEqual(slider.bounds, { left: 6, top: 6, width: 68, height: 68 });
        assert.strictEqual(result.scaledRotarySliders, 1);
    });

    it('scales labelled rotary sliders with a value text box to 80% and adds a 70% knob scale', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'rslider bounds(0, 0, 80, 80), text("Gain"), valuetextBox(1), channel("x")',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const slider = json.widgets.find((w: any) => w.type === 'rotarySlider');
        assert.ok(slider);
        assert.deepStrictEqual(slider.bounds, { left: 8, top: 8, width: 64, height: 64 });
        assert.strictEqual(slider.knobScale, 0.7);
        assert.strictEqual(result.scaledRotarySliders, 1);
    });

    it('records the scale factors in the converted .csd', () => {
        const csd = [
            '<CsoundSynthesizer>',
            '<Cabbage>',
            'form caption("Test")',
            'rslider bounds(0, 0, 80, 80), text("Gain"), channel("x")',
            '</Cabbage>',
            '<CsInstruments>',
            'instr 1',
            'endin',
            '</CsInstruments>',
            '<CsScore>',
            '</CsScore>',
            '</CsoundSynthesizer>',
        ].join('\n');
        const result = convertCabbage2ToCabbage3(csd);
        assert.ok(result.text.includes('; Cabbage2→3: rotarySlider bounds scaled to match Cabbage 2 auto-sizing'));
        assert.ok(result.text.includes('85%'));
        assert.ok(result.text.includes('80%'));
        assert.ok(result.text.includes('knob scaled to 70%'));
    });
});

describe('detectMouseChannels', () => {
    it('finds referenced MOUSE_* channels in stable display order', () => {
        const text = [
            'kDown = chnget "MOUSE_DOWN_LEFT"',
            'kX = chnget "MOUSE_X"',
            'kOther = chnget "gain"',
        ].join('\n');

        assert.deepStrictEqual(detectMouseChannels(text), ['MOUSE_X', 'MOUSE_DOWN_LEFT']);
    });

    it('ignores non-MOUSE and unknown MOUSE_* channel names', () => {
        const text = 'kGain = chnget "gain"\nkZ = chnget "MOUSE_Z"';

        assert.deepStrictEqual(detectMouseChannels(text), []);
    });
});

describe('buildMouseChannels', () => {
    it('ranges X/Y over the form size and shares ids for press/release pairs', () => {
        const channels = buildMouseChannels(
            { width: 600, height: 400 },
            ['MOUSE_X', 'MOUSE_Y', 'MOUSE_DOWN_LEFT'],
        );

        assert.strictEqual(channels.length, 4);
        const byEvent = new Map(channels.map((channel) => [channel.event, channel]));
        assert.strictEqual(byEvent.get('mouseMoveX')?.range?.max, 600);
        assert.strictEqual(byEvent.get('mouseMoveY')?.range?.max, 400);
        assert.strictEqual(byEvent.get('mousePressLeft')?.id, 'mouseDownLeft');
        assert.strictEqual(byEvent.get('mouseReleaseLeft')?.id, 'mouseDownLeft');
    });

    it('skips unknown channel names', () => {
        assert.deepStrictEqual(buildMouseChannels({ width: 0, height: 0 }, ['NOPE']), []);
    });
});

describe('detectSoundfilerLoading', () => {
    it('wires an ftgen table to the soundfiler ident', () => {
        const orchestra = [
            'gSfilepath = "loop.wav"',
            'Smessage sprintfk "file(%s)", gSfilepath',
            'chnset Smessage, "filer1"',
            'ftgen 100, 0, 0, 1, gSfilepath, 0, 0, 0',
        ].join('\n');

        const result = detectSoundfilerLoading(orchestra, new Set(['filer1']));

        assert.deepStrictEqual(result.get('filer1'), { tableNumber: 100 });
    });

    it('wires a diskin2 stream to the soundfiler ident', () => {
        const orchestra = [
            'gSfilepath = "loop.wav"',
            'Smessage sprintfk "file(%s)", gSfilepath',
            'chnset Smessage, "filer2"',
            'diskin2 gSfilepath, 1',
        ].join('\n');

        const result = detectSoundfilerLoading(orchestra, new Set(['filer2']));

        assert.deepStrictEqual(result.get('filer2'), { file: 'gSfilepath' });
    });

    it('returns an empty map when no loading pattern is found', () => {
        const orchestra = [
            'Smessage sprintfk "file(%s)", gSfilepath',
            'chnset Smessage, "filer3"',
        ].join('\n');

        assert.strictEqual(detectSoundfilerLoading(orchestra, new Set(['filer3'])).size, 0);
    });
});

describe('convertCabbage2ToCabbage3: mouse channels', () => {
    function csdWithOrchestra(orchestra: string): string {
        return [
            '<CsoundSynthesizer>',
            '<Cabbage>',
            'form caption("Test")',
            '</Cabbage>',
            '<CsInstruments>',
            orchestra,
            '</CsInstruments>',
            '<CsScore>',
            '</CsScore>',
            '</CsoundSynthesizer>',
        ].join('\n');
    }

    it('adds form mouse channels and rewrites chnget to cabbageGetValue', () => {
        const result = convertCabbage2ToCabbage3(csdWithOrchestra([
            'instr 1',
            'kX chnget "MOUSE_X"',
            'endin',
        ].join('\n')));

        assert.ok(result.text.includes('"mouseX"'));
        assert.ok(result.text.includes('cabbageGetValue "mouseX"'));
        assert.ok(result.warnings.some((warning) => warning.includes('MOUSE_X')));
        assert.ok(result.summary.includes('1 mouse channel(s)'));
    });

    it('refuses a section that is already JSON', () => {
        assert.throws(
            () => convertCabbage2ToCabbage3('<Cabbage>{ "widgets": [] }</Cabbage>'),
            /already JSON/,
        );
    });

    it('refuses a document with no Cabbage section', () => {
        assert.throws(
            () => convertCabbage2ToCabbage3('<CsoundSynthesizer></CsoundSynthesizer>'),
            /No <Cabbage> section/,
        );
    });
});
