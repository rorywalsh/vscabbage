// Integration test for the extension host → CabbageApp backend messaging.
//
// Instead of shipping the real Csound-backed binary, this test drops a small
// fake `CabbageApp` executable into a temp folder, points the extension's
// `cabbage.pathToCabbageBinary` at it, and verifies that a compile round-trip
// writes the expected JSON messages to the backend's stdin (recorded to a log
// by the fake). This covers the backend pipe without needing Csound.
// Run with: npm run test:integration
import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import * as vscode from 'vscode';

const EXTENSION_ID = 'cabbageaudio.vscabbage';
const FAKE_LOG_ENV = 'CABBAGE_TEST_FAKE_LOG';

function repoRoot(): string {
    // Compiled to out/test/integration/, so the repo root is three levels up.
    return path.resolve(__dirname, '..', '..', '..');
}

function fixturePath(...segments: string[]): string {
    return path.join(repoRoot(), 'src', 'test', 'integration', 'fixtures', ...segments);
}

async function waitFor(
    predicate: () => boolean,
    description: string,
    timeoutMs = 15000,
): Promise<void> {
    const start = Date.now();
    while (!predicate()) {
        if (Date.now() - start > timeoutMs) {
            throw new Error(`Timed out waiting for ${description}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
}

describe('backend message contract (fake CabbageApp)', function () {
    this.timeout(30000);

    let tempDir: string;
    let logPath: string;
    let binaryDir: string;
    const config = vscode.workspace.getConfiguration('cabbage');
    let originalBinaryPath: string | undefined;
    let originalProEnabled: boolean | undefined;

    before(async function () {
        // The fake backend is a Node script with a shebang, which only works as
        // an executable on Unix. CI runs integration tests on Linux.
        if (process.platform === 'win32') {
            this.skip();
        }

        const extension = vscode.extensions.getExtension(EXTENSION_ID);
        assert.ok(extension, `extension ${EXTENSION_ID} should be loaded`);
        await extension!.activate();

        tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cabbage-fake-backend-'));
        binaryDir = path.join(tempDir, 'bin');
        fs.mkdirSync(binaryDir);
        logPath = path.join(tempDir, 'backend.log');

        const fake = path.join(binaryDir, 'CabbageApp');
        fs.copyFileSync(fixturePath('fakeCabbageApp.js'), fake);
        fs.chmodSync(fake, 0o755);

        originalBinaryPath = config.get<string>('pathToCabbageBinary');
        originalProEnabled = config.get<boolean>('proAppEnabled');
        await config.update('pathToCabbageBinary', binaryDir, vscode.ConfigurationTarget.Global);
        await config.update('proAppEnabled', false, vscode.ConfigurationTarget.Global);
        process.env[FAKE_LOG_ENV] = logPath;
    });

    after(async () => {
        try {
            await vscode.commands.executeCommand('cabbage.stopServer');
        } catch {
            // Server may not have started; ignore.
        }
        delete process.env[FAKE_LOG_ENV];
        if (originalBinaryPath !== undefined) {
            await config.update('pathToCabbageBinary', originalBinaryPath, vscode.ConfigurationTarget.Global);
        }
        if (originalProEnabled !== undefined) {
            await config.update('proAppEnabled', originalProEnabled, vscode.ConfigurationTarget.Global);
        }
        await vscode.commands.executeCommand('workbench.action.closeActiveEditor');
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('forwards compile messages to the spawned backend process', async () => {
        // Start the backend through the real command so the running extension
        // spawns our fake binary and wires up its stdin.
        await vscode.commands.executeCommand('cabbage.manageServer');

        const document = await vscode.workspace.openTextDocument(fixturePath('widgetEvents.csd'));
        await vscode.window.showTextDocument(document);
        await vscode.commands.executeCommand('cabbage.compile');

        await waitFor(() => {
            if (!fs.existsSync(logPath)) {
                return false;
            }
            const log = fs.readFileSync(logPath, 'utf8');
            return log.includes('"command":"onFileChanged"') && log.includes('widgetEvents.csd');
        }, 'the backend to receive the onFileChanged message');

        const log = fs.readFileSync(logPath, 'utf8');
        const lines = log.split('\n').filter((line) => line.trim().length > 0);
        assert.ok(lines.length > 0, 'the fake backend should record at least one message');

        const onFileChanged = lines
            .map((line) => JSON.parse(line))
            .find((msg) => msg.command === 'onFileChanged');
        assert.ok(onFileChanged, 'expected an onFileChanged message on the backend stdin');
        assert.ok(
            String(onFileChanged.lastSavedFileName).endsWith('widgetEvents.csd'),
            'onFileChanged should reference the fixture .csd',
        );
    });
});
