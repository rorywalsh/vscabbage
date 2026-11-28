// Unit tests for graceful child-process termination.
// Run with: npm run test:unit (plain mocha, no VS Code instance needed).
import assert from 'assert';
import { ChildProcess, spawn } from 'child_process';
import {
    DEFAULT_GRACE_PERIOD_MS,
    isProcessRunning,
    stopProcess,
    waitForExit,
} from '../../utils/processTermination';

/**
 * Node source for a child that prints `ready` once its handlers are installed,
 * so tests never race the signal against child startup.
 */
function source(body: string): string {
    return `${body};process.stdout.write('ready');`;
}

const children: ChildProcess[] = [];

/** Spawns a Node child and resolves once it has printed `ready`. */
async function spawnReady(body: string): Promise<ChildProcess> {
    const child = spawn(process.execPath, ['-e', source(body)], {
        stdio: ['ignore', 'pipe', 'ignore'],
    });
    children.push(child);
    await new Promise<void>((resolve, reject) => {
        child.stdout!.once('data', () => resolve());
        child.once('error', reject);
    });
    return child;
}

/** A child that takes `ms` to clean up before exiting on SIGTERM. */
function cleansUpSlowly(ms: number): string {
    return `process.on('SIGTERM', () => { setTimeout(() => process.exit(0), ${ms}); });setInterval(() => {}, 1000);`;
}

/** A child that deliberately ignores SIGTERM. */
const ignoresSigterm = `process.on('SIGTERM', () => {});setInterval(() => {}, 1000);`;

async function exitOf(child: ChildProcess): Promise<{ code: number | null; signal: NodeJS.Signals | null }> {
    if (child.exitCode !== null || child.signalCode !== null) {
        return { code: child.exitCode, signal: child.signalCode };
    }
    return new Promise((resolve) => {
        child.once('exit', (code, signal) => resolve({ code, signal }));
    });
}

afterEach(() => {
    for (const child of children.splice(0)) {
        if (isProcessRunning(child)) {
            child.kill('SIGKILL');
        }
    }
});

describe('processTermination', () => {
    describe('isProcessRunning', () => {
        it('reports a live child as running', async () => {
            const child = await spawnReady(ignoresSigterm);
            assert.strictEqual(isProcessRunning(child), true);
        });

        it('reports an exited child as not running', async () => {
            const child = await spawnReady('');
            await exitOf(child);
            assert.strictEqual(isProcessRunning(child), false);
        });

        it('treats a non-existent PID as not running', async () => {
            const child = await spawnReady('');
            const pid = child.pid!;
            await exitOf(child);
            assert.strictEqual(isProcessRunning(pid), false);
        });
    });

    describe('waitForExit', () => {
        it('resolves true immediately for an exited process', async () => {
            const child = await spawnReady('');
            await exitOf(child);
            assert.strictEqual(await waitForExit(child, 1000), true);
        });

        it('resolves false when the process outlives the timeout', async () => {
            const child = await spawnReady(ignoresSigterm);
            const started = Date.now();
            assert.strictEqual(await waitForExit(child, 100), false);
            assert.ok(Date.now() - started >= 90, 'waited for the timeout');
            assert.strictEqual(isProcessRunning(child), true);
        });
    });

    describe('stopProcess', () => {
        it('lets a slow cleanup finish instead of escalating to SIGKILL', async () => {
            // Regression: CabbageApp needs longer than the old fixed 500 ms to
            // close audio devices. Stopping the server used to SIGKILL it
            // mid-cleanup and log `Signal: SIGKILL` / `Exit code: null`.
            const child = await spawnReady(cleansUpSlowly(700));
            const logs: string[] = [];

            const outcome = await stopProcess(child, {
                gracePeriodMs: DEFAULT_GRACE_PERIOD_MS,
                log: (message) => logs.push(message),
            });

            assert.strictEqual(outcome, 'terminated');
            const { code, signal } = await exitOf(child);
            assert.strictEqual(signal, null, 'must not die from SIGKILL');
            assert.strictEqual(code, 0);
            assert.ok(!logs.some((line) => line.includes('SIGKILL')));
        });

        it('escalates to SIGKILL when the grace period expires', async () => {
            const child = await spawnReady(ignoresSigterm);
            const logs: string[] = [];

            const outcome = await stopProcess(child, {
                gracePeriodMs: 200,
                log: (message) => logs.push(message),
            });

            assert.strictEqual(outcome, 'forced');
            const { signal } = await exitOf(child);
            assert.strictEqual(signal, 'SIGKILL');
            assert.ok(logs.some((line) => line.includes('200ms')));
        });

        it('skips the graceful phase when forced', async () => {
            const child = await spawnReady(ignoresSigterm);
            const outcome = await stopProcess(child, { force: true });
            assert.strictEqual(outcome, 'forced');
            const { signal } = await exitOf(child);
            assert.strictEqual(signal, 'SIGKILL');
        });

        it('reports an already-exited process without signalling it', async () => {
            const child = await spawnReady('');
            await exitOf(child);
            assert.strictEqual(await stopProcess(child), 'alreadyExited');
        });

        it('accepts a bare PID', async () => {
            const child = await spawnReady(cleansUpSlowly(0));
            assert.strictEqual(await stopProcess(child.pid!, { gracePeriodMs: 2000 }), 'terminated');
            assert.strictEqual(isProcessRunning(child.pid!), false);
        });

        it('rejects an undefined or invalid PID', async () => {
            const logs: string[] = [];
            const log = (message: string) => logs.push(message);

            assert.strictEqual(await stopProcess(undefined, { log }), 'failed');
            assert.strictEqual(await stopProcess(NaN, { log }), 'failed');
            assert.deepStrictEqual(logs, ['Invalid PID provided.', 'Invalid PID provided.']);
        });

        it('still terminates when the log sink throws', async () => {
            const child = await spawnReady(cleansUpSlowly(0));
            const outcome = await stopProcess(child, {
                gracePeriodMs: 2000,
                log: () => { throw new Error('output channel disposed'); },
            });
            assert.strictEqual(outcome, 'terminated');
        });

        it('falls back to the default grace period for invalid values', async () => {
            const child = await spawnReady(cleansUpSlowly(0));
            const outcome = await stopProcess(child, { gracePeriodMs: Number.POSITIVE_INFINITY });
            assert.strictEqual(outcome, 'terminated');
        });
    });
});
