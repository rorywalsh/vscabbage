// Unit tests for the widget → backend message contract. These load the real
// widget classes from the plain-ESM source, simulate pointer events under
// jsdom, and capture the controlData messages the widgets emit (via the same
// window.sendMessageFromUI bridge an exported plugin uses).
// Run with: npm run test:unit
import assert from 'assert';
import { installDom, loadWebviewModule } from './helpers/loadWebviewModule';

// Both the widget (../sharedState.js) and CabbageUtils (./sharedState.js) reach
// the same shared-state module through different relative specifiers, so both
// keys must be stubbed with identical content.
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

const radioGroupStub = `export function handleRadioGroup() {}`;

const stubs = {
    '../sharedState.js': sharedStateStub,
    './sharedState.js': sharedStateStub,
    '../radioGroup.js': radioGroupStub,
};

let Button: any;
let Checkbox: any;
let OptionButton: any;
let Label: any;

let messages: any[];

before(async () => {
    installDom();

    ({ Button } = await loadWebviewModule('src/cabbage/widgets/button.js', { stubs }));
    ({ Checkbox } = await loadWebviewModule('src/cabbage/widgets/checkBox.js', { stubs }));
    ({ OptionButton } = await loadWebviewModule('src/cabbage/widgets/optionButton.js', { stubs }));
    ({ Label } = await loadWebviewModule('src/cabbage/widgets/label.js', { stubs }));
});

beforeEach(() => {
    // Reinstall a fresh DOM and bridge per test. Other webview test files call
    // installDom() mid-suite (replacing global.window/document), so re-attaching
    // the capture bridge here keeps this suite independent of load order.
    installDom();
    messages = [];
    (globalThis as any).__controlDataMessages = messages;
    (globalThis as any).window.sendMessageFromUI = (msg: any) => {
        messages.push(msg);
    };
});

function widgetDiv(id: string): HTMLDivElement {
    const div = document.createElement('div');
    div.id = id;
    document.body.appendChild(div);
    return div;
}

function dispatch(div: HTMLDivElement, type: string): void {
    div.dispatchEvent(new Event(type, { bubbles: true }));
}

function lastMessage(): any {
    assert.ok(messages.length > 0, 'expected at least one controlData message to be emitted');
    return messages[messages.length - 1];
}

describe('widget → backend controlData contract', () => {
    it('button pointerdown emits a controlData toggle', () => {
        const button = new Button();
        button.props.id = 'play';
        button.props.channels[0].id = 'play';
        button.props.channels[0].range.value = 0;
        button.addEventListeners(widgetDiv('play'));

        dispatch(document.getElementById('play') as HTMLDivElement, 'pointerdown');

        assert.deepStrictEqual(lastMessage(), {
            command: 'controlData',
            channel: 'play',
            value: 1,
            gesture: 'complete',
        });
    });

    it('checkBox pointerdown emits a controlData toggle', () => {
        const checkbox = new Checkbox();
        checkbox.props.id = 'bypass';
        checkbox.props.channels[0].id = 'bypass';
        checkbox.props.channels[0].range.value = 0;
        checkbox.addEventListeners(widgetDiv('bypass'));

        dispatch(document.getElementById('bypass') as HTMLDivElement, 'pointerdown');

        assert.deepStrictEqual(lastMessage(), {
            command: 'controlData',
            channel: 'bypass',
            value: 1,
            gesture: 'complete',
        });
    });

    it('optionButton pointerdown cycles to the next item', () => {
        const option = new OptionButton();
        option.props.id = 'mode';
        option.props.channels[0].id = 'mode';
        option.props.channels[0].range.value = 0;
        option.props.items = ['A', 'B', 'C'];
        option.addEventListeners(widgetDiv('mode'));

        dispatch(document.getElementById('mode') as HTMLDivElement, 'pointerdown');

        assert.deepStrictEqual(lastMessage(), {
            command: 'controlData',
            channel: 'mode',
            value: 1,
            gesture: 'complete',
        });
    });

    it('an inactive button emits no controlData on pointerdown', () => {
        const button = new Button();
        button.props.id = 'muted';
        button.props.channels[0].id = 'muted';
        button.props.channels[0].range.value = 0;
        button.props.active = false;
        button.addEventListeners(widgetDiv('muted'));

        dispatch(document.getElementById('muted') as HTMLDivElement, 'pointerdown');

        assert.strictEqual(messages.length, 0, 'inactive widgets must not emit controlData');
    });

    it('label background rect drops pointer-events when inactive', () => {
        const label = new Label();
        label.props.id = 'gainLabel';
        label.props.channels[0].id = 'gainLabel';
        label.props.style.fontSize = 14; // explicit size avoids canvas text measuring in jsdom

        label.props.active = false;
        assert.ok(
            label.getInnerHTML().includes('pointer-events="none"'),
            'inactive label rect should set pointer-events="none"',
        );

        label.props.active = true;
        assert.ok(
            label.getInnerHTML().includes('pointer-events="all"'),
            'active label rect should set pointer-events="all"',
        );
    });
});
