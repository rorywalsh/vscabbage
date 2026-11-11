// Unit tests for channel scanning, hint parsing and widget generation.
// Run with: npm run test:unit
import assert from 'assert';
import { parseWidgetHint, scanCabbageChannels } from '../../utils/channelScanner';
import {
    bottomOfWidgets,
    channelToWidget,
    fitFormHeight,
    humanizeChannelName,
    inferWidgetType,
    layoutWidgets,
} from '../../utils/channelToWidget';

function csd(orchestra: string): string {
    return `<Cabbage>
{ "widgets": [ {"type": "form"} ] }
</Cabbage>
<CsoundSynthesizer>
<CsInstruments>
${orchestra}
</CsInstruments>
<CsScore>
</CsScore>
</CsoundSynthesizer>`;
}

describe('scanCabbageChannels', () => {
    it('finds all four opcodes, including bare (no parentheses) calls', () => {
        const result = scanCabbageChannels(csd(`
    freq:k = cabbageGetValue("freqSlider")
    gain:k = cabbageGetValue("gain")
    cabbageSetValue("mix", gain)
    cabbageSet("infoText", "text", "hi")
    SStatus cabbageGet "status", "text"
`));

        const names = result.channels.map(c => c.channel).sort();
        assert.deepStrictEqual(names, ['freqSlider', 'gain', 'infoText', 'mix', 'status']);
    });

    it('does not double-count cabbageGetValue as cabbageGet', () => {
        const result = scanCabbageChannels(csd('    value:k = cabbageGetValue("a")'));
        assert.strictEqual(result.channels.length, 1);
        assert.strictEqual(result.channels[0].refCount, 1);
    });

    it('skips dynamic and non-literal channels', () => {
        const result = scanCabbageChannels(csd(`
    v:k = cabbageGetValue(sprintfk("check%d", 1))
    cabbageSetValue(SChannel, 1)
`));
        assert.strictEqual(result.channels.length, 0);
        assert.strictEqual(result.skipped.length, 2);
    });

    it('parses an inline @widget hint and range', () => {
        const result = scanCabbageChannels(csd(
            '    freq:k = cabbageGetValue("cutoff") ; @widget rotarySlider range(20, 20000, 800, 0.5)'
        ));
        assert.strictEqual(result.channels.length, 1);
        const hint = result.channels[0].hint;
        assert.ok(hint);
        assert.strictEqual(hint?.type, 'rotarySlider');
        assert.strictEqual(hint?.range?.min, 20);
        assert.strictEqual(hint?.range?.max, 20000);
        assert.strictEqual(hint?.range?.value, 800);
        assert.strictEqual(hint?.range?.increment, 0.5);
        assert.strictEqual(hint?.range?.skew, undefined);
    });

    it('merges repeated references and keeps the first hint', () => {
        const result = scanCabbageChannels(csd(`
    a:k = cabbageGetValue("cutoff")
    cabbageSetValue("cutoff", a) ; @widget rotarySlider range(20, 20000, 800)
`));
        assert.strictEqual(result.channels.length, 1);
        assert.strictEqual(result.channels[0].refCount, 2);
        assert.strictEqual(result.channels[0].hint?.type, 'rotarySlider');
    });

    it('reads the value type from the LHS annotation', () => {
        const stringResult = scanCabbageChannels(csd(
            '    file:CabbageStrTrig = cabbageGetValue("audioFile")'
        ));
        assert.strictEqual(stringResult.channels[0].valueType, 'trigger-string');

        const numberResult = scanCabbageChannels(csd(
            '    trigger:CabbageNumTrig = cabbageGetValue("trigger")'
        ));
        assert.strictEqual(numberResult.channels[0].valueType, 'trigger-number');
    });
});

describe('parseWidgetHint', () => {
    it('supports a type-only hint', () => {
        assert.deepStrictEqual(parseWidgetHint('; @widget checkBox'), { type: 'checkBox', range: undefined });
    });

    it('supports min/max/value plus optional increment and skew', () => {
        const hint = parseWidgetHint('; @widget horizontalSlider range(0, 1, 0.5, 0.01, 2)');
        assert.deepStrictEqual(hint?.range, {
            min: 0, max: 1, value: 0.5, increment: 0.01, skew: 2,
        });
    });

    it('ignores malformed ranges', () => {
        const hint = parseWidgetHint('; @widget rotarySlider range(20, nope, 1)');
        assert.strictEqual(hint?.type, 'rotarySlider');
        assert.strictEqual(hint?.range, undefined);
    });
});

describe('inferWidgetType', () => {
    it('uses channel-name suffixes where obvious', () => {
        assert.strictEqual(inferWidgetType('freqSlider', 'unknown'), 'horizontalSlider');
        assert.strictEqual(inferWidgetType('cutoffKnob', 'unknown'), 'rotarySlider');
        assert.strictEqual(inferWidgetType('saveStateBtn', 'unknown'), 'button');
        assert.strictEqual(inferWidgetType('audioFile', 'unknown'), 'fileButton');
        assert.strictEqual(inferWidgetType('waveformCombo', 'unknown'), 'comboBox');
    });

    it('falls back to the value type', () => {
        assert.strictEqual(inferWidgetType('mystery', 'trigger-string'), 'comboBox');
        // CabbageNumTrig is used for sliders too, so numeric falls back to a slider.
        assert.strictEqual(inferWidgetType('mystery', 'trigger-number'), 'horizontalSlider');
        assert.strictEqual(inferWidgetType('mystery', 'unknown'), 'horizontalSlider');
    });
});

describe('channelToWidget', () => {
    it('applies an explicit hint type and range', () => {
        const widget = channelToWidget({
            channel: 'cutoff',
            refCount: 1,
            valueType: 'unknown',
            hint: { type: 'rotarySlider', range: { min: 20, max: 20000, value: 800, increment: 0.5 } },
        });

        assert.strictEqual(widget.type, 'rotarySlider');
        assert.strictEqual(widget.id, 'cutoff');
        assert.strictEqual(widget.channels[0].id, 'cutoff');
        assert.strictEqual(widget.channels[0].range.min, 20);
        assert.strictEqual(widget.channels[0].range.max, 20000);
        assert.strictEqual(widget.channels[0].range.defaultValue, 800);
        assert.strictEqual(widget.channels[0].range.value, 800);
        assert.strictEqual(widget.channels[0].range.increment, 0.5);
        assert.strictEqual(widget.channels[0].range.skew, 1);
    });

    it('uses a string channel for fileButton and no channel for genTable', () => {
        const fileWidget = channelToWidget({ channel: 'audioFile', refCount: 1, valueType: 'unknown' });
        assert.strictEqual(fileWidget.type, 'fileButton');
        assert.strictEqual(fileWidget.channels[0].type, 'string');

        const tableWidget = channelToWidget({ channel: 'gentable1', refCount: 1, valueType: 'unknown' });
        assert.strictEqual(tableWidget.type, 'genTable');
        assert.deepStrictEqual(tableWidget.channels, []);
    });
});

describe('humanizeChannelName', () => {
    it('strips type suffixes and title-cases the rest', () => {
        assert.strictEqual(humanizeChannelName('bpmSlider'), 'Bpm');
        assert.strictEqual(humanizeChannelName('saveStateBtn'), 'Save State');
        assert.strictEqual(humanizeChannelName('audioFile'), 'Audio');
        assert.strictEqual(humanizeChannelName('toggleFreq'), 'Toggle Freq');
    });
});

describe('layoutWidgets', () => {
    it('wraps widgets onto a new row when they do not fit', () => {
        const widgets = [
            { bounds: { left: 0, top: 0, width: 160, height: 40 } },
            { bounds: { left: 0, top: 0, width: 160, height: 40 } },
            { bounds: { left: 0, top: 0, width: 160, height: 40 } },
        ];
        layoutWidgets(widgets, 360, 10);
        // Two fit on the first row (10 + 160 + 10 + 160 = 340 <= 350), third wraps.
        assert.strictEqual(widgets[0].bounds.left, 10);
        assert.strictEqual(widgets[0].bounds.top, 10);
        assert.strictEqual(widgets[1].bounds.left, 180);
        assert.strictEqual(widgets[1].bounds.top, 10);
        assert.strictEqual(widgets[2].bounds.left, 10);
        assert.strictEqual(widgets[2].bounds.top, 60);
    });

    it('reports the bottom of existing widgets and grows the form', () => {
        const existing = [{ type: 'button', bounds: { left: 10, top: 10, width: 80, height: 30 } }];
        assert.strictEqual(bottomOfWidgets(existing), 40);

        const form: Record<string, any> = { type: 'form', size: { width: 300, height: 100 } };
        fitFormHeight(form, [{ bounds: { left: 10, top: 60, width: 80, height: 30 } }]);
        assert.strictEqual(form.size.height, 100);
    });
});
