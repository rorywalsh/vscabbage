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

describe('convertCabbage2Section: range default clamping', () => {
    it('clamps a default below the minimum into range', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'rslider channel("fold"), range(1, 1024, 0, 0.25)',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const slider = json.widgets.find((w: any) => w.type === 'rotarySlider');
        assert.ok(slider);
        assert.strictEqual(slider.channels[0].range.min, 1);
        assert.strictEqual(slider.channels[0].range.max, 1024);
        assert.strictEqual(slider.channels[0].range.defaultValue, 1);
    });

    it('clamps a default above the maximum into range', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'rslider channel("x"), range(0, 1, 2)',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const slider = json.widgets.find((w: any) => w.type === 'rotarySlider');
        assert.ok(slider);
        assert.strictEqual(slider.channels[0].range.defaultValue, 1);
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

describe('horizontal slider height scaling', () => {
    it('reduces tall hSlider and hRange rows to 20px and centres them vertically', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'hslider bounds(10, 50, 400, 25), channel("x")',
            'hrange bounds(10, 110, 940, 30), channel("a","b")',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const hslider = json.widgets.find((w: any) => w.type === 'horizontalSlider');
        const hrange = json.widgets.find((w: any) => w.type === 'horizontalRangeSlider');
        assert.ok(hslider);
        assert.ok(hrange);
        assert.deepStrictEqual(hslider.bounds, { left: 10, top: 53, width: 400, height: 20 });
        assert.deepStrictEqual(hrange.bounds, { left: 10, top: 115, width: 940, height: 20 });
        // The range-slider thumb is inset so the visible slider is a little
        // shorter than its 20px row.
        assert.strictEqual(hrange.style.thumb.height, 16);
        assert.strictEqual(result.scaledHorizontalSliders, 2);
    });

    it('leaves vertical sliders and other widgets untouched', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'vslider bounds(10, 10, 40, 180), channel("x")',
            'rslider bounds(0, 0, 80, 80), channel("y")',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const vslider = json.widgets.find((w: any) => w.type === 'verticalSlider');
        assert.deepStrictEqual(vslider.bounds, { left: 10, top: 10, width: 40, height: 180 });
        assert.strictEqual(result.scaledHorizontalSliders, 0);
    });

    it('records the scale factor in the converted .csd', () => {
        const csd = [
            '<CsoundSynthesizer>',
            '<Cabbage>',
            'form caption("Test")',
            'hslider bounds(10, 50, 400, 25), channel("x")',
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
        assert.ok(result.text.includes('; Cabbage2→3: horizontalSlider height set to 20px'));
        assert.ok(result.text.includes('centred vertically'));
        assert.ok(result.summary.includes('scaled 1 horizontal slider(s)'));
    });
});

describe('range slider defaults', () => {
    it('maps a min:max default onto both channels', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'hrange bounds(10, 110, 940, 30), channel("lo","hi"), text("Tone"), range(4, 14, 11:14, 1)',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const hrange = json.widgets.find((w: any) => w.type === 'horizontalRangeSlider');
        assert.ok(hrange);
        assert.strictEqual(hrange.channels[0].range.defaultValue, 11);
        assert.strictEqual(hrange.channels[1].range.defaultValue, 14);
    });

    it('maps a single default onto the first channel only', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'hslider bounds(10, 50, 400, 25), channel("x"), range(0, 1, 0.5)',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const hslider = json.widgets.find((w: any) => w.type === 'horizontalSlider');
        assert.ok(hslider);
        assert.strictEqual(hslider.channels[0].range.defaultValue, 0.5);
        assert.strictEqual(hslider.channels[1], undefined);
    });
});

describe('soundfiler → genTable styling', () => {
    it('uses colour() for the waveform and defaults the background to black', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'soundfiler bounds(10, 10, 400, 100), channel("beg","len"), identChannel("filer1"), colour("red")',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const genTable = json.widgets.find((w: any) => w.type === 'genTable');
        assert.ok(genTable);
        assert.strictEqual(genTable.style.fillColor, 'red');
        assert.strictEqual(genTable.style.strokeColor, 'red');
        assert.strictEqual(genTable.style.backgroundColor, '#000000');
    });

    it('converts an RGB soundfiler colour to a hex waveform colour', () => {
        const result = convertCabbage2Section([
            'form caption("Test")',
            'soundfiler bounds(10, 10, 400, 100), channel("beg","len"), colour(0, 0, 255)',
        ].join('\n'));
        const json = JSON.parse(result.json);
        const genTable = json.widgets.find((w: any) => w.type === 'genTable');
        assert.ok(genTable);
        assert.strictEqual(genTable.style.fillColor, '#0000ff');
        assert.strictEqual(genTable.style.backgroundColor, '#000000');
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

describe('rewriteOrchestra: ternary operator spacing', () => {
    function rewrite(orchestra: string) {
        return rewriteOrchestra(orchestra, new Map<string, string>(), new Set<string>());
    }

    it('spaces the colon of a bare a?b:c ternary', () => {
        const { text, ternaryChanges } = rewrite(
            'kSmearR = i(kMonoStereo)==1?kSmear1:kSmear2\n',
        );
        assert.ok(text.includes('1?kSmear1 : kSmear2'));
        assert.strictEqual(ternaryChanges, 1);
    });

    it('spaces the colon of a parenthesised ternary', () => {
        const { text, ternaryChanges } = rewrite(
            'kporttime = (kin<kold?idnport:kupport)\n',
        );
        assert.ok(text.includes('idnport : kupport'));
        assert.strictEqual(ternaryChanges, 1);
    });

    it('leaves type annotations (chnget:k / random:i) untouched', () => {
        const { text, ternaryChanges } = rewrite(
            'aInLFilt buthp aInL, chnget:k("LowCut")\niTime += random:i(-1, 1) * 0.5\n',
        );
        assert.ok(text.includes('chnget:k("LowCut")'));
        assert.ok(text.includes('random:i(-1, 1)'));
        assert.strictEqual(ternaryChanges, 0);
    });

    it('ignores colons and question marks inside strings and comments', () => {
        const { text, ternaryChanges } = rewrite(
            'Smessage = "a?b:c"\n; note: a?b:c\nkX = 1\n',
        );
        assert.ok(text.includes('"a?b:c"'));
        assert.ok(text.includes('; note: a?b:c'));
        assert.strictEqual(ternaryChanges, 0);
    });
});

describe('rewriteOrchestra: Csound macro expansion', () => {
    it('expands a function-like macro and converts a literal ident-channel property update', () => {
        const orchestra = [
            '#define TURN_BALL_ON_OFF(COLOUR)',
            '#',
            'chnset "visible(1)", "IndicatorBall$COLOUR"',
            '#',
            '$TURN_BALL_ON_OFF(Red)',
        ].join('\n');

        const result = rewriteOrchestra(
            orchestra,
            new Map<string, string>([['IndicatorBallRed', 'IndicatorBallRed']]),
            new Set<string>(['IndicatorBallRed']),
        );

        assert.ok(result.text.includes('cabbageSet'));
        assert.ok(result.text.includes('IndicatorBallRed'));
        assert.ok(!result.text.includes('$COLOUR'));
    });

    it('expands an object-like macro sequentially (redefinition idiom)', () => {
        const orchestra = [
            '#define N #1#',
            'if i(gknodes)==$N then',
            '#define N #2#',
            'elseif i(gknodes)==$N then',
        ].join('\n');

        const result = rewriteOrchestra(
            orchestra,
            new Map<string, string>(),
            new Set<string>(),
        );

        assert.ok(result.text.includes('i(gknodes)==1'));
        assert.ok(result.text.includes('i(gknodes)==2'));
        assert.ok(!result.text.includes('#define'));
    });

    it('converts a numeric chnset whose channel is built with a macro argument', () => {
        const orchestra = [
            '#define SET_STEP(N)',
            '#',
            'chnset kval, "On$N"',
            '#',
            '$SET_STEP(1)',
        ].join('\n');

        const result = rewriteOrchestra(
            orchestra,
            new Map<string, string>(),
            new Set<string>(['On1']),
        );

        assert.ok(result.text.includes('cabbageSetValue "On1", kval'));
        assert.ok(!result.text.includes('$N'));
    });

    it('consumes the dot macro-name terminator ($COLOUR.Ball → RedBall)', () => {
        const orchestra = [
            '#define TURN_BALL_ON_OFF(COLOUR)',
            '#',
            'k$COLOUR.Ball chnget "$COLOUR.Ball"',
            'chnset "visible(1)", "IndicatorBall$COLOUR"',
            '#',
            '$TURN_BALL_ON_OFF(Red)',
        ].join('\n');

        const result = rewriteOrchestra(
            orchestra,
            new Map<string, string>([['IndicatorBallRed', 'IndicatorBallRed']]),
            new Set<string>(['RedBall', 'IndicatorBallRed']),
        );

        assert.ok(result.text.includes('cabbageGetValue "RedBall"'));
        assert.ok(result.text.includes('cabbageSet'));
        assert.ok(!result.text.includes('Red.Ball'));
        assert.ok(!result.text.includes('$COLOUR'));
    });

    it('expands adjacent macro arguments ($N$CHAN) and a trailing define comment', () => {
        const orchestra = [
            '#define SPRING(N\'CHAN) ; a trailing comment',
            '#',
            'fFB$N$CHAN pvsinit iFFT, iFFT/4, iFFT, 1',
            '#',
            '$SPRING(1\'L)',
        ].join('\n');

        const result = rewriteOrchestra(
            orchestra,
            new Map<string, string>(),
            new Set<string>(),
        );

        assert.ok(result.text.includes('fFB1L'));
        assert.ok(!result.text.includes('$N'));
        assert.ok(!result.text.includes('$CHAN'));
    });

    it('expands nested macro invocations (a macro body calling another macro)', () => {
        const orchestra = [
            '#define INNER(N)',
            '#',
            'f$N = 1',
            '#',
            '#define OUTER(M)',
            '#',
            '$INNER($M)',
            '#',
            '$OUTER(9)',
        ].join('\n');

        const result = rewriteOrchestra(
            orchestra,
            new Map<string, string>(),
            new Set<string>(),
        );

        assert.ok(result.text.includes('f9 = 1'));
        assert.ok(!result.text.includes('$INNER'));
        assert.ok(!result.text.includes('$OUTER'));
    });

    it('does not expand a macro invocation inside a line comment', () => {
        const orchestra = [
            '#define INNER(N)',
            '#',
            'f$N = 1',
            '#',
            '; $INNER(9) is just documentation',
        ].join('\n');

        const result = rewriteOrchestra(
            orchestra,
            new Map<string, string>(),
            new Set<string>(),
        );

        assert.ok(result.text.includes('; $INNER(9) is just documentation'));
        assert.ok(!result.text.includes('f9'));
    });

    it('leaves undefined macro references untouched', () => {
        const result = rewriteOrchestra(
            'kX = $UNDEFINED_MACRO\n',
            new Map<string, string>(),
            new Set<string>(),
        );

        assert.ok(result.text.includes('$UNDEFINED_MACRO'));
    });
});

describe('rewriteOrchestra: cabbageCreate conversion', () => {
    it('converts cabbageCreate "type", S (fed by a sprintf property string) to cabbageCreate:i(S)', () => {
        const orchestra = [
            'SWidget sprintf "bounds(%d,%d,30,30), colour(90,90,90), shape(\\"rounded\\"), channel(%s)", 40, 50, SChan',
            'cabbageCreate "image", SWidget',
        ].join('\n');

        const result = rewriteOrchestra(
            orchestra,
            new Map<string, string>(),
            new Set<string>(),
        );

        assert.ok(result.text.includes('cabbageCreate:i(SWidget)'));
        assert.ok(result.text.includes('\\"type\\":\\"image\\"'));
        assert.ok(result.text.includes('\\"left\\":%d'));
        assert.ok(result.text.includes('\\"backgroundColor\\":\\"#5a5a5a\\"'));
        assert.ok(result.text.includes('\\"borderRadius\\":4'));
        assert.ok(result.text.includes('\\"id\\":\\"%s\\"'));
        assert.ok(!result.text.includes('cabbageCreate "image"'));
    });

    it('leaves a cabbageCreate without a preceding sprintf untouched with a warning', () => {
        const result = rewriteOrchestra(
            'cabbageCreate "image", SUnknown\n',
            new Map<string, string>(),
            new Set<string>(),
        );

        assert.ok(result.text.includes('cabbageCreate "image", SUnknown'));
        assert.ok(result.warnings.some((w) => w.includes('cabbageCreate')));
    });
});

describe('rewriteOrchestra: multi-property ident-channel strings', () => {
    it('splits "alpha(1), active(1)" into two cabbageSet calls', () => {
        const result = rewriteOrchestra(
            'chnset "alpha(1), active(1)", "ReverbID2"\n',
            new Map<string, string>([['ReverbID2', 'ReverbID2']]),
            new Set<string>(['ReverbID2']),
        );

        assert.ok(result.text.includes('cabbageSet "ReverbID2", "style.opacity", 1'));
        assert.ok(result.text.includes('cabbageSet "ReverbID2", "active", 1'));
        assert.ok(!result.text.includes('NaN'));
        assert.ok(!result.text.includes('chnset "alpha'));
    });

    it('falls back to a manual-review marker when a property is unknown', () => {
        const result = rewriteOrchestra(
            'chnset "alpha(1), nosuchprop(2)", "ReverbID2"\n',
            new Map<string, string>([['ReverbID2', 'ReverbID2']]),
            new Set<string>(['ReverbID2']),
        );

        assert.ok(result.text.includes('manual conversion needed'));
        assert.ok(result.warnings.some((w) => w.includes('ReverbID2')));
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
