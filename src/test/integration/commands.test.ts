// Integration tests for the document-transforming Cabbage commands. Each test
// opens a real .csd, runs the command through VS Code, and asserts on the
// resulting document text. Run with: npm run test:integration
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

const EXTENSION_ID = 'cabbageaudio.vscabbage';
let tempDir: string;

function wrap(cabbage: string, orchestra: string = 'instr 1\nendin'): string {
    return [
        '<CsoundSynthesizer>',
        '<Cabbage>',
        cabbage,
        '</Cabbage>',
        '<CsInstruments>',
        orchestra,
        '</CsInstruments>',
        '<CsScore>',
        '</CsScore>',
        '</CsoundSynthesizer>',
    ].join('\n');
}

async function openDocument(name: string, content: string): Promise<vscode.TextDocument> {
    const file = path.join(tempDir, name);
    fs.writeFileSync(file, content, 'utf8');
    const document = await vscode.workspace.openTextDocument(file);
    await vscode.window.showTextDocument(document);
    return document;
}

function cabbageSection(document: vscode.TextDocument): string {
    const match = document.getText().match(/<Cabbage>([\s\S]*?)<\/Cabbage>/);
    assert.ok(match, 'expected the document to contain a Cabbage section');
    return match![1];
}

function cabbageWidgets(document: vscode.TextDocument): any[] {
    const parsed = JSON.parse(cabbageSection(document));
    return Array.isArray(parsed) ? parsed : parsed.widgets;
}

async function waitFor(
    predicate: () => boolean,
    description: string,
    timeoutMs = 5000,
): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > timeoutMs) {
            throw new Error(`Timed out waiting for ${description}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 25));
    }
}

async function saveAndCloseActiveEditor(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (editor && editor.document.isDirty) {
        await editor.document.save();
    }
    await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
}

before(async () => {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `extension ${EXTENSION_ID} should be loaded`);
    await extension!.activate();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cabbage-commands-'));
});

afterEach(async () => {
    await saveAndCloseActiveEditor();
});

after(async () => {
    fs.rmSync(tempDir, { recursive: true, force: true });
});

describe('document-transforming commands', () => {
    it('reorders widgets by visual position via cabbage.reorderWidgets', async () => {
        const document = await openDocument('reorder.csd', wrap(JSON.stringify({
            widgets: [
                { type: 'form', id: 'form1', caption: { text: 'Test' }, size: { width: 600, height: 400 } },
                { type: 'button', id: 'lower', bounds: { left: 10, top: 300, width: 80, height: 30 } },
                { type: 'button', id: 'upper', bounds: { left: 10, top: 10, width: 80, height: 30 } },
            ],
        }, null, 2)));

        await vscode.commands.executeCommand('cabbage.reorderWidgets');

        await waitFor(
            () => cabbageWidgets(document).map((widget) => widget.id).join(',') === 'form1,upper,lower',
            'widgets to be reordered',
        );
        assert.deepStrictEqual(
            cabbageWidgets(document).map((widget) => widget.id),
            ['form1', 'upper', 'lower'],
        );
    });

    it('adds a Cabbage section at the top via cabbage.addCabbageSection', async () => {
        const document = await openDocument('empty.csd', [
            '<CsoundSynthesizer>',
            '<CsInstruments>',
            'instr 1',
            'endin',
            '</CsInstruments>',
            '<CsScore>',
            '</CsScore>',
            '</CsoundSynthesizer>',
        ].join('\n'));

        await vscode.commands.executeCommand('cabbage.addCabbageSection');

        await waitFor(() => document.getText().includes('<Cabbage>'), 'a Cabbage section to be added');
        const text = document.getText();
        assert.ok(text.includes('"type":"form"'), 'the inserted section should contain a form widget');
        assert.ok(
            text.indexOf('<Cabbage>') < text.indexOf('<CsoundSynthesizer>'),
            'the section should be inserted before the CsoundSynthesizer tag',
        );
    });

    it('expands minified Cabbage JSON via cabbage.expandCabbageJSON', async () => {
        const document = await openDocument('expand.csd', wrap(
            '{"widgets":[{"type":"form","id":"form1","size":{"width":600,"height":400}},'
            + '{"type":"button","id":"b1","bounds":{"left":10,"top":10,"width":80,"height":30}}]}',
        ));
        const beforeLines = cabbageSection(document).split('\n').length;

        await vscode.commands.executeCommand('cabbage.expandCabbageJSON');

        await waitFor(
            () => cabbageSection(document).split('\n').length > beforeLines,
            'the Cabbage JSON to expand',
        );
        const expanded = cabbageSection(document);
        assert.doesNotThrow(() => JSON.parse(expanded));
        assert.ok(expanded.includes('"widgets"'));
    });

    it('collapses formatted Cabbage JSON via cabbage.collapseCabbageJSON', async () => {
        const widgets = [
            { type: 'form', id: 'form1', caption: { text: 'Test' }, size: { width: 600, height: 400 } },
            { type: 'button', id: 'b1', bounds: { left: 10, top: 10, width: 80, height: 30 } },
            { type: 'button', id: 'b2', bounds: { left: 100, top: 10, width: 80, height: 30 } },
        ];
        const document = await openDocument('collapse.csd', wrap(JSON.stringify({ widgets }, null, 4)));
        const beforeLines = cabbageSection(document).split('\n').length;

        await vscode.commands.executeCommand('cabbage.collapseCabbageJSON');

        await waitFor(
            () => cabbageSection(document).split('\n').length < beforeLines,
            'the Cabbage JSON to collapse',
        );
        const collapsed = cabbageSection(document);
        assert.doesNotThrow(() => JSON.parse(collapsed));
        assert.strictEqual(JSON.parse(collapsed).widgets.length, widgets.length);
    });

    it('moves a top Cabbage section below the synth via cabbage.moveCabbageSection', async () => {
        // "Top" means before <CsoundSynthesizer>, so build that layout explicitly.
        const document = await openDocument('move.csd', [
            '<Cabbage>',
            '{"widgets":[{"type":"form","id":"form1"}]}',
            '</Cabbage>',
            '<CsoundSynthesizer>',
            '<CsInstruments>',
            'instr 1',
            'endin',
            '</CsInstruments>',
            '<CsScore>',
            '</CsScore>',
            '</CsoundSynthesizer>',
        ].join('\n'));

        await vscode.commands.executeCommand('cabbage.moveCabbageSection');

        await waitFor(
            () => document.getText().indexOf('<Cabbage>') > document.getText().indexOf('</CsoundSynthesizer>'),
            'the Cabbage section to move to the bottom',
        );
        const text = document.getText();
        assert.ok(text.indexOf('<Cabbage>') > text.indexOf('</CsoundSynthesizer>'));
        assert.ok(text.includes('"form1"'));
    });
});
