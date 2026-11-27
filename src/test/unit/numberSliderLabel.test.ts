// Unit tests for numberSlider's static label rendering. These load the real
// widget class from the plain-ESM source and exercise getInnerHTML() under
// jsdom, checking that label.text is rendered and label.align splits the box
// the same way Cabbage 2's nslider did.
// Run with: npm run test:unit
import assert from 'assert';
import { installDom, loadWebviewModule } from './helpers/loadWebviewModule';

// Both the widget (../sharedState.js) and CabbageUtils (./sharedState.js)
// reach the same shared-state module through different relative specifiers,
// so both keys must be stubbed with identical content.
const sharedStateStub = `
export let vscode = null;
export const widgets = [];
export let cabbageMode = 'nonDraggable';
export let currentCsdPath = '';
export function getCabbageMode() { return 'nonDraggable'; }
export function setCabbageMode(m) { cabbageMode = m; }
export function setVSCode(v) { vscode = v; }
export function postMessageToVSCode() {}
`;

const stubs = {
    '../sharedState.js': sharedStateStub,
    './sharedState.js': sharedStateStub,
    '../radioGroup.js': `export function handleRadioGroup() {}`,
};

let NumberSlider: any;

before(async () => {
    installDom();
    ({ NumberSlider } = await loadWebviewModule('src/cabbage/widgets/numberSlider.js', { stubs }));
});

beforeEach(() => {
    installDom();
});

function makeSlider(): any {
    const slider = new NumberSlider();
    slider.props.channels[0].range.value = 0.5;
    return slider;
}

function countTextField(html: string): number {
    return (html.match(/<foreignObject/g) ?? []).length;
}

describe('numberSlider label rendering', () => {
    it('renders only the value when label.text is empty', () => {
        const html = makeSlider().getInnerHTML();
        assert.strictEqual(countTextField(html), 1);
        assert.ok(!html.includes('<foreignObject x="0" y="0" width="60" height="30">'),
            'an unlabelled slider should keep its single full-size value region');
    });

    it('renders the label above the value by default', () => {
        const slider = makeSlider();
        slider.props.label.text = 'Gain';
        const html = slider.getInnerHTML();

        assert.strictEqual(countTextField(html), 2);
        assert.ok(html.includes('Gain'));
        // label occupies the top half, value the bottom half (bounds default 60x60)
        assert.ok(html.includes('<foreignObject x="0" y="0" width="60" height="30">'));
        assert.ok(html.includes('<foreignObject x="0" y="30" width="60" height="30">'));
    });

    it('treats auto and above as the default top alignment', () => {
        for (const align of ['auto', 'above']) {
            const slider = makeSlider();
            slider.props.label.text = 'Gain';
            slider.props.label.align = align;
            const html = slider.getInnerHTML();
            assert.ok(html.includes('<foreignObject x="0" y="0" width="60" height="30">'), align);
        }
    });

    it('places the label below the value for bottom/below', () => {
        for (const align of ['bottom', 'below']) {
            const slider = makeSlider();
            slider.props.label.text = 'Gain';
            slider.props.label.align = align;
            const html = slider.getInnerHTML();
            assert.ok(html.includes('<foreignObject x="0" y="30" width="60" height="30">'), align);
            assert.ok(html.includes('<foreignObject x="0" y="0" width="60" height="30">'), align);
        }
    });

    it('places the label beside the value for left and right', () => {
        const left = makeSlider();
        left.props.label.text = 'Gain';
        left.props.label.align = 'left';
        const leftHtml = left.getInnerHTML();
        assert.ok(leftHtml.includes('<foreignObject x="0" y="0" width="30" height="60">'));
        assert.ok(leftHtml.includes('<foreignObject x="30" y="0" width="30" height="60">'));

        const right = makeSlider();
        right.props.label.text = 'Gain';
        right.props.label.align = 'right';
        const rightHtml = right.getInnerHTML();
        assert.ok(rightHtml.includes('<foreignObject x="30" y="0" width="30" height="60">'));
        assert.ok(rightHtml.includes('<foreignObject x="0" y="0" width="30" height="60">'));
    });

    it('uses style.label typography for the label and escapes its text', () => {
        const slider = makeSlider();
        slider.props.label.text = 'Gain <&>';
        slider.props.style.label.fontSize = 10;
        slider.props.style.label.fontColor = '#ff0000';
        slider.props.style.label.fontFamily = 'Courier New';
        const html = slider.getInnerHTML();

        assert.ok(html.includes('Gain &lt;&amp;&gt;'));
        assert.ok(html.includes('font-size:10px'));
        assert.ok(html.includes('color:#ff0000'));
        assert.ok(html.includes('font-family:Courier New'));
    });
});
