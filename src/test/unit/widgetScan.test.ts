// Unit tests for recursive custom widget discovery.
// Run with: npm run test:unit
import assert from 'assert';
import fs from 'fs';
import os from 'os';
import path from 'path';
import {
    extractWidgetInfoFromFile,
    scanForCustomWidgets,
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
        + typeLine
        + `            "id": "${className}",\n`
        + `        };\n`
        + `    }\n`
        + `}\n`;
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
                    this.props = { "type": "myKnob", "id": "myKnob" };
                }
            }
        `);
        assert.deepStrictEqual(info, { className: 'MyKnob', widgetType: 'myKnob' });
    });

    it('falls back to the camelCased class name when no type is declared', () => {
        const info = extractWidgetInfoFromFile('export class FancyDial {}');
        assert.deepStrictEqual(info, { className: 'FancyDial', widgetType: 'fancyDial' });
    });

    it('returns null for files that do not export a class', () => {
        assert.strictEqual(extractWidgetInfoFromFile('const x = 1;'), null);
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

    it('ignores hidden folders, node_modules, templates, tests and non-JS files', async () => {
        const root = await makeTempDir();
        await writeWidget(root, '.hidden/MyHidden.js', 'MyHidden', 'myHidden');
        await writeWidget(root, 'node_modules/MyDep.js', 'MyDep', 'myDep');
        await writeWidget(root, 'templates/CustomWidgetTemplate.js', 'CustomWidgetTemplate', 'templateWidget');
        await writeWidget(root, 'myWidget.test.js', 'MyTest', 'myTest');
        await writeWidget(root, 'notes.txt', 'NotAWidget', 'notAWidget');
        await writeWidget(root, 'MyRealWidget.js', 'MyRealWidget', 'myRealWidget');

        const widgets = await scanForCustomWidgets(root);

        assert.deepStrictEqual(widgets.map((widget) => widget.widgetType), ['myRealWidget']);
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
});
