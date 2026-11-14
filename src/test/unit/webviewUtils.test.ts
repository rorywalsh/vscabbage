// Unit tests for the webview's CabbageUtils helpers, loaded from the plain-ESM
// source via esbuild with its DOM-heavy dependencies stubbed.
// Run with: npm run test:unit
import assert from 'assert';
import { installDom, loadWebviewModule } from './helpers/loadWebviewModule';

const sharedStateStub = `
export let vscode = null;
export const widgets = [];
export let cabbageMode = 'nonDraggable';
export let currentCsdPath = '';
export function getCabbageMode() { return cabbageMode; }
export function setCabbageMode(mode) { cabbageMode = mode; }
export function postMessageToVSCode() {}
`;

const cabbageStub = `export class Cabbage {}`;

let CabbageUtils: any;
let CabbageColours: any;

before(async () => {
    installDom();
    ({ CabbageUtils, CabbageColours } = await loadWebviewModule('src/cabbage/utils.js', {
        stubs: {
            './sharedState.js': sharedStateStub,
            './cabbage.js': cabbageStub,
        },
    }));
});

describe('CabbageUtils ranges and channels', () => {
    it('builds a default range with drag/click increments', () => {
        assert.deepStrictEqual(CabbageUtils.getDefaultRange(), {
            min: 0, max: 1, value: 0, defaultValue: 0, skew: 1, increment: 0.001,
        });
        assert.strictEqual(CabbageUtils.getDefaultRange('click').increment, 1);
    });

    it('returns the channels array or an empty array', () => {
        assert.deepStrictEqual(CabbageUtils.getChannels({ channels: [{ id: 'a' }] }), [{ id: 'a' }]);
        assert.deepStrictEqual(CabbageUtils.getChannels({}), []);
        assert.deepStrictEqual(CabbageUtils.getChannels(undefined), []);
    });

    it('fills in a missing range and event on an existing channel', () => {
        const props = { channels: [{ id: 'gain' }] };

        const channel = CabbageUtils.getChannel(props);

        assert.strictEqual(channel.id, 'gain');
        assert.strictEqual(channel.event, 'valueChanged');
        assert.strictEqual(channel.range.increment, 0.001);
    });

    it('fills partial range values from the defaults', () => {
        const props = { channels: [{ id: 'gain', range: { min: 0, max: 10 } }] };

        const channel = CabbageUtils.getChannel(props);

        assert.strictEqual(channel.range.min, 0);
        assert.strictEqual(channel.range.max, 10);
        assert.strictEqual(channel.range.value, 0);
        assert.strictEqual(channel.range.defaultValue, 0);
        assert.strictEqual(channel.range.skew, 1);
        assert.strictEqual(channel.range.increment, 0.001);
    });

    it('synthesises a channel from a legacy channel string', () => {
        const channel = CabbageUtils.getChannel({ channel: 'legacy' });

        assert.strictEqual(channel.id, 'legacy');
        assert.strictEqual(channel.event, 'valueChanged');
        assert.deepStrictEqual(channel.range, CabbageUtils.getDefaultRange());
    });

    it('uses click increments when asked', () => {
        assert.strictEqual(CabbageUtils.getChannel({ channels: [{ id: 'a' }] }, 0, 'click').range.increment, 1);
        assert.strictEqual(CabbageUtils.getChannel({ channel: 'x' }, 0, 'click').range.increment, 1);
    });

    it('returns the channel id or throws when missing', () => {
        assert.strictEqual(CabbageUtils.getChannelId({ channels: [{ id: 'gain' }] }), 'gain');
        assert.throws(() => CabbageUtils.getChannelId({ channels: [{}] }), /channel\[0\]\.id is required/);
    });

    it('reads the range and parameter index of a channel', () => {
        const props = { channels: [{ id: 'a', parameterIndex: 4, range: { min: 2, max: 8 } }] };

        assert.strictEqual(CabbageUtils.getChannelRange(props).max, 8);
        assert.strictEqual(CabbageUtils.getChannelParameterIndex(props), 4);
        assert.strictEqual(CabbageUtils.getChannelParameterIndex({ channels: [{ id: 'b' }] }), -1);
    });

    it('finds a channel by event', () => {
        const props = { channels: [{ id: 'x', event: 'mousePressLeft' }, { id: 'y', event: 'valueChanged' }] };

        assert.strictEqual(CabbageUtils.getChannelByEvent(props, 'mousePressLeft').id, 'x');
        assert.strictEqual(CabbageUtils.getChannelByEvent(props, 'missing'), undefined);
    });

    it('prefers props.id for the DOM id, then the first channel', () => {
        assert.strictEqual(CabbageUtils.getWidgetDivId({ id: 'widget' }), 'widget');
        assert.strictEqual(CabbageUtils.getWidgetDivId({ channels: [{ id: 'chan' }] }), 'chan');
    });
});

describe('CabbageUtils math and identity helpers', () => {
    it('clamps and maps values', () => {
        assert.strictEqual(CabbageUtils.clamp(15, 0, 10), 10);
        assert.strictEqual(CabbageUtils.clamp(-5, 0, 10), 0);
        assert.strictEqual(CabbageUtils.map(5, 0, 10, 0, 100), 50);
    });

    it('counts decimal places safely', () => {
        assert.strictEqual(CabbageUtils.getDecimalPlaces(1.234), 3);
        assert.strictEqual(CabbageUtils.getDecimalPlaces(3), 0);
        assert.strictEqual(CabbageUtils.getDecimalPlaces(NaN), 0);
        assert.strictEqual(CabbageUtils.getDecimalPlaces('nope'), 0);
    });

    it('finds the dotted path of a nested key', () => {
        assert.strictEqual(CabbageUtils.getPath({ a: { b: { c: 1 } } }, 'c'), 'a.b.c');
        assert.strictEqual(CabbageUtils.getPath({ a: 1 }, 'missing'), '');
    });

    it('generates unique channel names and ids', () => {
        assert.strictEqual(CabbageUtils.getUniqueChannelName('slider', []), 'slider1');
        assert.strictEqual(
            CabbageUtils.getUniqueChannelName('slider', [{ props: { channels: [{ id: 'slider2' }] } }]),
            'slider3',
        );
        assert.strictEqual(
            CabbageUtils.getUniqueChannelName('slider', [{ channel: 'slider1' }]),
            'slider2',
        );

        assert.strictEqual(CabbageUtils.getUniqueId('button', []), 'button1');
        assert.strictEqual(
            CabbageUtils.getUniqueId('button', [{ props: { id: 'button2' } }]),
            'button3',
        );
    });

    it('counts plugin parameters across widget channels', () => {
        const widgets = [
            { props: { automatable: true, channels: [{ id: 'a' }, { id: 'b' }] } },
            { props: { automatable: 1, channels: [] } },
            { props: { automatable: false, channels: [{ id: 'c' }] } },
        ];

        assert.strictEqual(CabbageUtils.getNumberOfPluginParameters(widgets), 3);
    });

    it('extracts file names from POSIX and Windows paths', () => {
        assert.strictEqual(CabbageUtils.getFileNameFromPath('/a/b/c.csd'), 'c.csd');
        assert.strictEqual(CabbageUtils.getFileNameFromPath('C:\\a\\b.csd'), 'b.csd');
    });
});

describe('CabbageColours', () => {
    it('converts RGB/RGBA arrays and hex strings to hex', () => {
        assert.strictEqual(CabbageColours.toHex([255, 0, 0]), '#ff0000');
        assert.strictEqual(CabbageColours.toHex([0, 255, 0, 0.5]), '#00ff00');
        assert.strictEqual(CabbageColours.toHex('#112233'), '#112233');
        assert.strictEqual(CabbageColours.toHex('#abc'), '#abcabc');
        assert.throws(() => CabbageColours.toHex(42), /Invalid color format/);
    });

    it('inverts colours', () => {
        const trace = console.trace;
        console.trace = () => undefined;
        try {
            assert.strictEqual(CabbageColours.invertColor('#000000'), '#FFFFFF');
            assert.strictEqual(CabbageColours.invertColor('#ffffff'), '#000000');
            assert.strictEqual(CabbageColours.invertColor(null), '#ffffff');
        } finally {
            console.trace = trace;
        }
    });

    it('applies alpha to 3-, 6- and 8-digit hex colours', () => {
        assert.strictEqual(CabbageColours.adjustAlpha('#ff0000', 0.5), '#ff000080');
        assert.strictEqual(CabbageColours.adjustAlpha('#f00', 1), '#ff0000ff');
        assert.strictEqual(CabbageColours.adjustAlpha('#ff000080', 0), '#ff000000');
        assert.throws(() => CabbageColours.adjustAlpha('#ff00', 0.5), /Invalid hex color format/);
    });

    it('resolves named colours with a blue fallback', () => {
        assert.strictEqual(CabbageColours.getColour('red'), '#ff0000');
        assert.strictEqual(CabbageColours.getColour('unknown'), '#0295cf');
    });

    it('lightens and darkens colours', () => {
        assert.strictEqual(CabbageColours.adjustBrightness('#808080', 0.5), '#c0c0c0');
        assert.strictEqual(CabbageColours.lighter('#808080', 0.5), '#c0c0c0');
        assert.strictEqual(CabbageColours.darker('#808080', 0.5), '#404040');
        assert.strictEqual(CabbageColours.adjustBrightness('#ffffff', 1), '#ffffff');
    });
});

describe('CabbageUtils sanitizeForEditor', () => {
    const internalProps = () => ({
        type: 'button',
        id: 'b1',
        channel: 'legacy',
        value: 1,
        parameterIndex: 2,
        samples: [1],
        currentCsdFile: '/tmp/x.csd',
        groupBaseBounds: {},
        origBounds: {},
        originalProps: {},
        range: { value: 0.5, min: 0, max: 1 },
        bounds: { left: 1, top: 2, width: 3, height: 4 },
        children: [{ id: 'c1', value: 9, range: { value: 1, min: 0 } }],
    });

    it('removes runtime-only keys and range.value', () => {
        const out = CabbageUtils.sanitizeForEditor(internalProps());

        for (const key of [
            'channel', 'value', 'parameterIndex', 'samples', 'currentCsdFile',
            'groupBaseBounds', 'origBounds', 'originalProps',
        ]) {
            assert.ok(!(key in out), `expected ${key} to be removed`);
        }
        assert.deepStrictEqual(out.range, { min: 0, max: 1 });
        assert.deepStrictEqual(out.bounds, { left: 1, top: 2, width: 3, height: 4 });
        assert.deepStrictEqual(out.children, [{ id: 'c1', range: { min: 0 } }]);
    });

    it('accepts a widget-like object with a props field', () => {
        const out = CabbageUtils.sanitizeForEditor({ props: internalProps() });

        assert.strictEqual(out.type, 'button');
        assert.ok(!('value' in out));
    });

    it('does not mutate the input', () => {
        const input = internalProps();
        CabbageUtils.sanitizeForEditor(input);

        assert.strictEqual(input.value, 1);
        assert.strictEqual(input.range.value, 0.5);
    });
});

describe('CabbageUtils.applyWidgetPointerEvents (jsdom)', () => {
    it('enables wrapper hit-testing only when visible and active', () => {
        const div = document.createElement('div');

        const value = CabbageUtils.applyWidgetPointerEvents(
            { props: { visible: true, active: true } },
            div,
        );

        assert.strictEqual(value, 'auto');
        assert.strictEqual(div.style.pointerEvents, 'auto');
    });

    it('disables wrapper hit-testing when the widget is inactive', () => {
        const div = document.createElement('div');

        const value = CabbageUtils.applyWidgetPointerEvents(
            { props: { visible: true, active: false } },
            div,
        );

        assert.strictEqual(value, 'none');
        assert.strictEqual(div.style.pointerEvents, 'none');
    });

    it('disables wrapper hit-testing when the widget is hidden', () => {
        const div = document.createElement('div');

        const value = CabbageUtils.applyWidgetPointerEvents(
            { props: { visible: false, active: true } },
            div,
        );

        assert.strictEqual(value, 'none');
        assert.strictEqual(div.style.pointerEvents, 'none');
    });

    it('falls back to widget.widgetDiv and tolerates a missing wrapper', () => {
        const div = document.createElement('div');

        assert.strictEqual(
            CabbageUtils.applyWidgetPointerEvents({ props: {}, widgetDiv: div }),
            'auto',
        );
        assert.strictEqual(CabbageUtils.applyWidgetPointerEvents({ props: {} }), 'none');
    });
});

describe('CabbageUtils findValidId (jsdom)', () => {
    it('returns the closest ancestor widget div id', () => {
        installDom('<div id="MainForm"><div id="widget1" class="cabbage-widget"><span id="inner"></span></div></div>');
        const document = (global as any).document;
        const target = document.getElementById('inner');

        assert.strictEqual(CabbageUtils.findValidId({ target }), 'widget1');
    });

    it('returns a direct div target id', () => {
        installDom('<div id="MainForm"><div id="plain"></div></div>');
        const document = (global as any).document;
        const target = document.getElementById('plain');

        assert.strictEqual(CabbageUtils.findValidId({ target }), 'plain');
    });

    it('returns null without an event target', () => {
        assert.strictEqual(CabbageUtils.findValidId({}), null);
        assert.strictEqual(CabbageUtils.findValidId(undefined), null);
    });
});
