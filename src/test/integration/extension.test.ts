// Integration smoke tests: load the extension in a real VS Code host and
// exercise the command surface. Run with: npm run test:integration
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

const EXTENSION_ID = 'cabbageaudio.vscabbage';

function getExtension(): vscode.Extension<any> {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    assert.ok(extension, `extension ${EXTENSION_ID} should be loaded in the test host`);
    return extension;
}

describe('cabbage extension', () => {
    before(async () => {
        // Activation is automatic (the manifest activates on "*"), but awaiting
        // it makes failures surface here rather than in a later test.
        await getExtension().activate();
    });

    it('is present in the test host', () => {
        assert.strictEqual(getExtension().id, EXTENSION_ID);
    });

    it('activates without throwing', () => {
        assert.strictEqual(getExtension().isActive, true);
    });

    it('registers its core commands', async () => {
        const registered = await vscode.commands.getCommands(true);
        const expected = [
            'cabbage.compile',
            'cabbage.formatDocument',
            'cabbage.validateInstallation',
            'cabbage.addCabbageSection',
            'cabbage.importCabbage2Instrument',
        ];

        for (const command of expected) {
            assert.ok(registered.includes(command), `expected ${command} to be registered`);
        }
    });

    it('formats a .csd document through the command surface', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'cabbage-integration-'));
        const file = path.join(dir, 'format.csd');
        const original = [
            '<CsoundSynthesizer>',
            '<Cabbage>',
            '{ "widgets": [ { "type": "form" } ] }',
            '</Cabbage>',
            '<CsInstruments>',
            'instr 1',
            'print 1',
            'endin',
            '</CsInstruments>',
            '</CsoundSynthesizer>',
        ].join('\n');
        fs.writeFileSync(file, original, 'utf8');

        try {
            const document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document);

            await vscode.commands.executeCommand('cabbage.formatDocument');

            const formatted = document.getText();
            assert.notStrictEqual(formatted, original, 'the formatter should change the document');
            assert.ok(formatted.includes('    print 1'), 'Csound body should be indented');
            assert.ok(formatted.includes('<Cabbage>'), 'the Cabbage section should be preserved');
        } finally {
            await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});
