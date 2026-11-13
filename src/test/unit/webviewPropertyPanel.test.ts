// Unit tests for the webview's PropertyPanel minimization/exclusion logic,
// loaded from the plain-ESM source with its dependency graph stubbed.
// Run with: npm run test:unit
import assert from 'assert';
import { installDom, loadWebviewModule } from './helpers/loadWebviewModule';

const cabbageUtilsStub = `export class CabbageUtils {}`;

// Mirrors the real WidgetManager.deepEqual used by PropertyPanel.
const widgetManagerStub = `
export class WidgetManager {
    static deepEqual(obj1, obj2) {
        if (obj1 === obj2) return true;
        if (obj1 == null || obj2 == null) return obj1 === obj2;
        if (typeof obj1 !== typeof obj2) return false;
        if (typeof obj1 !== 'object') return obj1 === obj2;
        if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
        if (Array.isArray(obj1)) {
            if (obj1.length !== obj2.length) return false;
            for (let i = 0; i < obj1.length; i++) {
                if (!this.deepEqual(obj1[i], obj2[i])) return false;
            }
            return true;
        }
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;
        for (const key of keys1) {
            if (!keys2.includes(key)) return false;
            if (!this.deepEqual(obj1[key], obj2[key])) return false;
        }
        return true;
    }
}
`;

let PropertyPanel: any;

before(async () => {
    installDom();
    ({ PropertyPanel } = await loadWebviewModule('src/propertyPanel.js', {
        stubs: {
            './cabbage/utils.js': cabbageUtilsStub,
            './cabbage/widgetManager.js': widgetManagerStub,
        },
    }));
});

function quietConsole<T>(fn: () => T): T {
    const error = console.error;
    const log = console.log;
    console.error = () => undefined;
    console.log = () => undefined;
    try {
        return fn();
    } finally {
        console.error = error;
        console.log = log;
    }
}

describe('PropertyPanel.applyExcludes', () => {
    it('removes simple keys recursively and returns the same object', () => {
        const obj: any = {
            value: 1,
            nested: { value: 2, keep: 3 },
            arr: [{ value: 4, keep: 5 }],
        };

        const out = PropertyPanel.applyExcludes(obj, ['value']);

        assert.strictEqual(out, obj);
        assert.ok(!('value' in obj));
        assert.ok(!('value' in obj.nested));
        assert.strictEqual(obj.nested.keep, 3);
        assert.ok(!('value' in obj.arr[0]));
        assert.strictEqual(obj.arr[0].keep, 5);
    });

    it('removes dot-notation keys at any depth', () => {
        const obj: any = {
            range: { value: 0.5, min: 0 },
            channels: [{ range: { value: 1, max: 2 } }],
        };

        PropertyPanel.applyExcludes(obj, ['range.value']);

        assert.strictEqual(obj.range.value, undefined);
        assert.strictEqual(obj.range.min, 0);
        assert.strictEqual(obj.channels[0].range.value, undefined);
        assert.strictEqual(obj.channels[0].range.max, 2);
    });

    it('passes non-objects through unchanged', () => {
        assert.strictEqual(PropertyPanel.applyExcludes(null, ['x']), null);
        assert.strictEqual(PropertyPanel.applyExcludes(5, ['x']), 5);
        assert.strictEqual(PropertyPanel.applyExcludes('text', ['x']), 'text');
    });

    it('excludes runtime keys by default', () => {
        assert.ok(PropertyPanel.defaultExcludeKeys.includes('value'));
        assert.ok(PropertyPanel.defaultExcludeKeys.includes('range.value'));
    });
});

describe('PropertyPanel.minimizePropsForWidget', () => {
    it('strips default-matching values but keeps changed ones and identity', () => {
        const widget = {
            rawDefaults: {
                type: 'button',
                bounds: { left: 0, top: 0, width: 10, height: 10 },
                visible: true,
            },
            originalProps: {},
        };
        const props = {
            type: 'button',
            bounds: { left: 5, top: 0, width: 10, height: 10 },
            visible: true,
            label: { text: 'Hi' },
        };

        const out = quietConsole(() => PropertyPanel.minimizePropsForWidget(props, widget));

        assert.deepStrictEqual(out.bounds, { left: 5 });
        assert.strictEqual(out.visible, undefined);
        assert.deepStrictEqual(out.label, { text: 'Hi' });
        assert.strictEqual(out.type, 'button');
        assert.notStrictEqual(out, props);
    });

    it('preserves channel ids while stripping default channel fields', () => {
        const widget = {
            rawDefaults: {
                type: 'horizontalSlider',
                channels: [{
                    id: 'default',
                    event: 'valueChanged',
                    range: { min: 0, max: 1, defaultValue: 0, skew: 1, increment: 0.001 },
                }],
            },
            originalProps: {},
        };
        const props = {
            type: 'horizontalSlider',
            channels: [{
                id: 'gain',
                event: 'valueChanged',
                range: { min: 0, max: 1, defaultValue: 0, skew: 1, increment: 0.001 },
            }],
        };

        const out = quietConsole(() => PropertyPanel.minimizePropsForWidget(props, widget));

        assert.deepStrictEqual(out.channels, [{ id: 'gain' }]);
        assert.strictEqual(out.type, 'horizontalSlider');
    });

    it('drops default-matching channels for forms', () => {
        const widget = {
            rawDefaults: { type: 'form', channels: [{ id: 'form' }] },
            originalProps: {},
        };
        const props = { type: 'form', id: 'MainForm', channels: [{ id: 'MainForm' }] };

        const out = quietConsole(() => PropertyPanel.minimizePropsForWidget(props, widget));

        assert.strictEqual(out.channels, undefined);
        assert.strictEqual(out.type, 'form');
        assert.strictEqual(out.id, 'MainForm');
    });

    it('uses serializedChildren instead of expanded children', () => {
        const widget = {
            rawDefaults: { type: 'groupBox' },
            originalProps: {},
            serializedChildren: [{ type: 'button', id: 'b1' }],
        };
        const props = {
            type: 'groupBox',
            id: 'g1',
            children: [{ type: 'button', id: 'b1', bounds: { left: 0, top: 0, width: 1, height: 1 } }],
        };

        const out = quietConsole(() => PropertyPanel.minimizePropsForWidget(props, widget));

        assert.deepStrictEqual(out.children, [{ type: 'button', id: 'b1' }]);
    });

    it('signals deletions with null when a property reverts to its default', () => {
        const widget = {
            rawDefaults: { type: 'label', style: { opacity: 1 } },
            originalProps: { type: 'label', style: { opacity: 0.5 } },
        };
        const props = { type: 'label', style: { opacity: 1 } };

        const out = quietConsole(() => PropertyPanel.minimizePropsForWidget(props, widget));

        assert.strictEqual(out.style, null);
        assert.strictEqual(out.type, 'label');
    });

    it('returns the full props when minimization leaves no identifier', () => {
        const widget = { rawDefaults: { foo: 1 }, originalProps: {} };
        const props = { foo: 1 };

        const out = quietConsole(() => PropertyPanel.minimizePropsForWidget(props, widget));

        assert.strictEqual(out, props);
    });

    it('does not mutate the live props', () => {
        const widget = {
            rawDefaults: { type: 'button', bounds: { left: 0, top: 0, width: 10, height: 10 } },
            originalProps: {},
        };
        const props: any = {
            type: 'button',
            bounds: { left: 5, top: 0, width: 10, height: 10 },
            visible: true,
        };

        quietConsole(() => PropertyPanel.minimizePropsForWidget(props, widget));

        assert.deepStrictEqual(props.bounds, { left: 5, top: 0, width: 10, height: 10 });
        assert.strictEqual(props.visible, true);
    });
});
