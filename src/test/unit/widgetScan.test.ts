// Unit tests for recursive custom widget discovery.
// Run with: npm run test:unit
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
    extractWidgetInfoFromFile,
    scanForCustomWidgets,
    scanForWidgetKits,
} from '../../utils/widgetScan';

let tempDirs: string[] = [];

async function makeTempDir(): Promise<string> {
    const dir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'cabbage-widget-scan-'));
    tempDirs.push(dir);
    return dir;
}

async function writeWidget(
    root: string,
    relativePath: string,
    className: string,
    widgetType?: string,
): Promise<void> {
    const filePath = path.join(root, relativePath);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    const typeLine = widgetType === undefined
        ? ''
        : `        "type": "${widgetType}",\n`;
    const content = `export class ${className} {\n`
        + `    constructor() {\n`
        + `        this.props = {\n`
        + `            "bounds": { "top": 0, "left": 0, "width": 100, "height": 30 },\n`
        + typeLine
        + `            "id": "${className}",\n`
        + `        };\n`
        + `    }\n`
        + `}\n`;
    await fs.promises.writeFile(filePath, content, 'utf8');
}

async function writeRaw(root: string, relativePath: string, content: string): Promise<void> {
    const filePath = path.join(root, relativePath);
    await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
    await fs.promises.writeFile(filePath, content, 'utf8');
}

afterEach(async () => {
    const dirs = tempDirs;
    tempDirs = [];
    await Promise.all(dirs.map((dir) => fs.promises.rm(dir, { recursive: true, force: true })));
});

describe('extractWidgetInfoFromFile', () => {
    it('reads the exported class and declared type', () => {
        const info = extractWidgetInfoFromFile(`
            export class MyKnob {
                constructor() {
                    this.props = {
                        "bounds": { "top": 0, "left": 0, "width": 100, "height": 30 },
                        "type": "myKnob",
                        "id": "myKnob"
                    };
                }
            }
        `);
        assert.deepStrictEqual(info, { className: 'MyKnob', widgetType: 'myKnob' });
    });

    it('falls back to the camelCased class name when no type is declared', () => {
        const info = extractWidgetInfoFromFile(`
            export class FancyDial {
                constructor() {
                    this.props = {
                        "bounds": { "top": 0, "left": 0, "width": 100, "height": 30 }
                    };
                }
            }
        `);
        assert.deepStrictEqual(info, { className: 'FancyDial', widgetType: 'fancyDial' });
    });

    it('reads the depth-1 widget type, not a nested channel type', () => {
        const info = extractWidgetInfoFromFile(`
            export class ComboBox {
                constructor() {
                    this.props = {
                        "bounds": { "top": 0, "left": 0, "width": 100, "height": 30 },
                        "channels": [
                            { "id": "comboBox", "event": "valueChanged", "type": "number" }
                        ],
                        "type": "comboBox"
                    };
                }
            }
        `);
        assert.deepStrictEqual(info, { className: 'ComboBox', widgetType: 'comboBox' });
    });

    it('finds the widget type when it is declared before nested objects', () => {
        const info = extractWidgetInfoFromFile(`
            export class MyKnob {
                constructor() {
                    this.props = {
                        "type": "myKnob",
                        "channels": [{ "type": "number" }]
                    };
                }
            }
        `);
        assert.deepStrictEqual(info, { className: 'MyKnob', widgetType: 'myKnob' });
    });

    it('ignores commented-out type keys when picking the widget type', () => {
        const info = extractWidgetInfoFromFile(`
            export class MyKnob {
                constructor() {
                    this.props = {
                        // "type": "notTheType",
                        "bounds": {},
                        "type": "myKnob"
                    };
                }
            }
        `);
        assert.deepStrictEqual(info, { className: 'MyKnob', widgetType: 'myKnob' });
    });

    it('accepts widgets that build props with a helper and declare the type explicitly', () => {
        const info = extractWidgetInfoFromFile(`
            export class PunchButton {
                constructor() {
                    this.props = {
                        ...baseProps("button", { bounds: {}, channels: [] }),
                        "type": "button",
                    };
                }
                getInnerHTML() { return ""; }
            }
        `);
        assert.deepStrictEqual(info, { className: 'PunchButton', widgetType: 'button' });
    });

    it('returns null for files that do not export a class', () => {
        assert.strictEqual(extractWidgetInfoFromFile('const x = 1;'), null);
    });

    it('rejects exported helper classes that do not declare widget props', () => {
        const info = extractWidgetInfoFromFile(`
            export class SliderHelpers {
                static clamp(value, min, max) {
                    return Math.min(max, Math.max(min, value));
                }
            }
        `);
        assert.strictEqual(info, null);
    });

    it('rejects classes whose props do not look like widget props', () => {
        const info = extractWidgetInfoFromFile(`
            export class NotAWidget {
                constructor() {
                    this.props = { "foo": 1 };
                }
            }
        `);
        assert.strictEqual(info, null);
    });
});

describe('scanForCustomWidgets', () => {
    it('returns an empty array for a missing directory', async () => {
        const missing = path.join(os.tmpdir(), 'cabbage-does-not-exist-' + Date.now());
        assert.deepStrictEqual(await scanForCustomWidgets(missing), []);
    });

    it('discovers widgets directly in the root with no category', async () => {
        const root = await makeTempDir();
        await writeWidget(root, 'MyKnob.js', 'MyKnob', 'myKnob');

        const widgets = await scanForCustomWidgets(root);

        assert.strictEqual(widgets.length, 1);
        assert.deepStrictEqual(widgets[0], {
            filename: 'MyKnob.js',
            category: '',
            className: 'MyKnob',
            widgetType: 'myKnob',
        });
    });

    it('discovers widgets inside category subfolders', async () => {
        const root = await makeTempDir();
        await writeWidget(root, 'sliders/MyKnob.js', 'MyKnob', 'myKnob');
        await writeWidget(root, 'displays/MyMeter.js', 'MyMeter', 'myMeter');

        const widgets = await scanForCustomWidgets(root);
        const byType = new Map(widgets.map((widget) => [widget.widgetType, widget]));

        assert.strictEqual(widgets.length, 2);
        assert.deepStrictEqual(byType.get('myKnob'), {
            filename: 'sliders/MyKnob.js',
            category: 'sliders',
            className: 'MyKnob',
            widgetType: 'myKnob',
        });
        assert.deepStrictEqual(byType.get('myMeter'), {
            filename: 'displays/MyMeter.js',
            category: 'displays',
            className: 'MyMeter',
            widgetType: 'myMeter',
        });
    });

    it('uses the first path segment as the category for deeper nesting', async () => {
        const root = await makeTempDir();
        await writeWidget(root, 'sliders/analog/MyKnob.js', 'MyKnob', 'myKnob');

        const widgets = await scanForCustomWidgets(root);

        assert.strictEqual(widgets.length, 1);
        assert.strictEqual(widgets[0].filename, 'sliders/analog/MyKnob.js');
        assert.strictEqual(widgets[0].category, 'sliders');
    });

    it('ignores hidden folders, node_modules, framework folders, templates, tests and non-JS files', async () => {
        const root = await makeTempDir();
        await writeWidget(root, '.hidden/MyHidden.js', 'MyHidden', 'myHidden');
        await writeWidget(root, 'node_modules/MyDep.js', 'MyDep', 'myDep');
        await writeWidget(root, 'htmlElements/CabbageBase.js', 'CabbageBase', 'cabbageBase');
        await writeWidget(root, 'templates/CustomWidgetTemplate.js', 'CustomWidgetTemplate', 'templateWidget');
        await writeWidget(root, 'myWidget.test.js', 'MyTest', 'myTest');
        await writeWidget(root, 'notes.txt', 'NotAWidget', 'notAWidget');
        await writeWidget(root, 'MyRealWidget.js', 'MyRealWidget', 'myRealWidget');

        const widgets = await scanForCustomWidgets(root);

        assert.deepStrictEqual(widgets.map((widget) => widget.widgetType), ['myRealWidget']);
    });

    it('ignores exported helper classes and modules inside category folders', async () => {
        const root = await makeTempDir();
        await writeWidget(root, 'sliders/MyKnob.js', 'MyKnob', 'myKnob');
        await writeRaw(root, 'sliders/helpers.js', `
            export class SliderHelpers {
                static clamp(value, min, max) {
                    return Math.min(max, Math.max(min, value));
                }
            }
        `);
        await writeRaw(root, 'sliders/shared.js', 'export const DEFAULT_CURVE = 1.5;');

        const widgets = await scanForCustomWidgets(root);

        assert.deepStrictEqual(widgets.map((widget) => widget.widgetType), ['myKnob']);
    });

    it('discovers widgets without an explicit type using the class-name fallback', async () => {
        const root = await makeTempDir();
        await writeWidget(root, 'displays/MyMeter.js', 'MyMeter');

        const widgets = await scanForCustomWidgets(root);

        assert.deepStrictEqual(widgets, [{
            filename: 'displays/MyMeter.js',
            category: 'displays',
            className: 'MyMeter',
            widgetType: 'myMeter',
        }]);
    });

    it('ignores files that redeclare a built-in widget type', async () => {
        const root = await makeTempDir();
        await writeWidget(root, 'button.js', 'Button', 'button');
        await writeWidget(root, 'MyKnob.js', 'MyKnob', 'myKnob');

        const widgets = await scanForCustomWidgets(root);

        assert.deepStrictEqual(widgets.map((widget) => widget.widgetType), ['myKnob']);
    });

    it('returns widgets in a stable order (root first, then sorted categories)', async () => {
        const root = await makeTempDir();
        await writeWidget(root, 'zCategory/ZWidget.js', 'ZWidget', 'zWidget');
        await writeWidget(root, 'aCategory/AWidget.js', 'AWidget', 'aWidget');
        await writeWidget(root, 'RootWidget.js', 'RootWidget', 'rootWidget');

        const widgets = await scanForCustomWidgets(root);

        assert.deepStrictEqual(
            widgets.map((widget) => widget.filename),
            ['RootWidget.js', 'aCategory/AWidget.js', 'zCategory/ZWidget.js'],
        );
    });

    it('ignores the reserved kits folder during a normal scan', async () => {
        const root = await makeTempDir();
        await writeWidget(root, 'kits/StudioDark/button.js', 'Button', 'button');
        await writeWidget(root, 'MyKnob.js', 'MyKnob', 'myKnob');

        const widgets = await scanForCustomWidgets(root);

        assert.deepStrictEqual(widgets.map((widget) => widget.widgetType), ['myKnob']);
    });
});

describe('scanForWidgetKits', () => {
    it('returns an empty array when there is no kits folder', async () => {
        const root = await makeTempDir();
        assert.deepStrictEqual(await scanForWidgetKits(root), []);
    });

    it('discovers kits, manifest metadata, categories and built-in overrides', async () => {
        const root = await makeTempDir();
        await writeRaw(root, 'kits/StudioDark/kit.json', JSON.stringify({
            id: 'studio-dark',
            name: 'Studio Dark',
            description: 'A darker take on the built-ins',
        }));
        await writeWidget(root, 'kits/StudioDark/button.js', 'Button', 'button');
        await writeWidget(root, 'kits/StudioDark/inputs/MyKnob.js', 'MyKnob', 'myKnob');

        const kits = await scanForWidgetKits(root);

        assert.strictEqual(kits.length, 1);
        const [kit] = kits;
        assert.strictEqual(kit.id, 'studio-dark');
        assert.strictEqual(kit.name, 'Studio Dark');
        assert.strictEqual(kit.description, 'A darker take on the built-ins');

        const byType = new Map(kit.widgets.map((widget) => [widget.widgetType, widget]));
        assert.deepStrictEqual(byType.get('button'), {
            filename: 'button.js',
            category: '',
            className: 'Button',
            widgetType: 'button',
            kit: 'studio-dark',
        });
        assert.deepStrictEqual(byType.get('myKnob'), {
            filename: 'inputs/MyKnob.js',
            category: 'inputs',
            className: 'MyKnob',
            widgetType: 'myKnob',
            kit: 'studio-dark',
        });
    });

    it('uses the folder name when kit.json is missing', async () => {
        const root = await makeTempDir();
        await writeWidget(root, 'kits/MinimalKit/MyKnob.js', 'MyKnob', 'myKnob');

        const kits = await scanForWidgetKits(root);

        assert.strictEqual(kits.length, 1);
        assert.strictEqual(kits[0].id, 'MinimalKit');
        assert.strictEqual(kits[0].name, 'MinimalKit');
    });

    it('skips hidden kit folders', async () => {
        const root = await makeTempDir();
        await writeWidget(root, 'kits/.hidden/MyKnob.js', 'MyKnob', 'myKnob');
        await writeWidget(root, 'kits/VisibleKit/MyKnob.js', 'MyKnob', 'myKnob');

        const kits = await scanForWidgetKits(root);

        assert.deepStrictEqual(kits.map((kit) => kit.id), ['VisibleKit']);
    });
});
