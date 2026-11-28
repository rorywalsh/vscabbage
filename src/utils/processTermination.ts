// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Cross-platform child-process termination with a graceful first pass.
 *
 * `stopProcess` sends SIGTERM (or `taskkill` without `/F` on Windows) and only
 * escalates to SIGKILL once a configurable grace period has elapsed. It waits
 * for the child's `exit` event instead of polling after a fixed delay, so a
 * backend that needs a moment to close audio devices and Csound is never
 * killed mid-cleanup.
 *
 * The old fixed 500 ms delay was shorter than CabbageApp's shutdown, which is
 * why stopping the server normally produced `Received signal 15. Cleaning
 * up...` followed by `Signal: SIGKILL` / `Exit code: null` in the console.
 */

import { ChildProcess, exec } from 'child_process';

/** How long a process may take to shut down after SIGTERM before SIGKILL. */
export const DEFAULT_GRACE_PERIOD_MS = 5000;

/** Outcome of a stop attempt. */
export type StopOutcome = 'alreadyExited' | 'terminated' | 'forced' | 'failed';

export interface StopOptions {
    /** Skip the graceful phase and send SIGKILL (or `taskkill /F`) immediately. */
    force?: boolean;
    /** Grace period in milliseconds. Defaults to {@link DEFAULT_GRACE_PERIOD_MS}. */
    gracePeriodMs?: number;
    /** Optional sink for human-readable progress messages. */
    log?: (message: string) => void;
}

/**
 * Whether a process is still alive.
 *
 * Prefer passing the `ChildProcess` handle: Node marks it as exited only once
 * the process has actually been reaped, whereas a bare PID can be reused by an
 * unrelated process between checks.
 */
export function isProcessRunning(target: ChildProcess | number): boolean {
    if (typeof target === 'number') {
        try {
            process.kill(target, 0);
            return true;
        } catch (error) {
            // EPERM means the process exists but belongs to another user.
            // Treat it as running so we never mistake a live process for a
            // dead one.
            return (error as NodeJS.ErrnoException).code === 'EPERM';
        }
    }
    return target.exitCode === null && target.signalCode === null;
}

/**
 * Resolves `true` if the process exits within `timeoutMs`, `false` otherwise.
 * Returns immediately for a process that has already exited.
 */
export function waitForExit(target: ChildProcess | number, timeoutMs: number): Promise<boolean> {
    if (!isProcessRunning(target)) {
        return Promise.resolve(true);
    }

    if (typeof target !== 'number') {
        return new Promise<boolean>((resolve) => {
            const onExit = () => {
                clearTimeout(timer);
                resolve(true);
            };
            const timer = setTimeout(() => {
                target.removeListener('exit', onExit);
                resolve(!isProcessRunning(target));
            }, timeoutMs);
            target.once('exit', onExit);
        });
    }

    // No exit event for a bare PID - poll until it is gone or time runs out.
    return new Promise<boolean>((resolve) => {
        const deadline = Date.now() + timeoutMs;
        const timer = setInterval(() => {
            if (!isProcessRunning(target)) {
                clearInterval(timer);
                resolve(true);
            } else if (Date.now() >= deadline) {
                clearInterval(timer);
                resolve(false);
            }
        }, 50);
    });
}

/**
 * Terminates a process, preferring a graceful shutdown.
 *
 * @param target The child process (preferred) or its PID.
 * @param options Grace period, force flag and logging sink.
 */
export async function stopProcess(
    target: ChildProcess | number | undefined,
    options: StopOptions = {},
): Promise<StopOutcome> {
    const { force = false } = options;
    // Guard against a caller passing NaN/Infinity/0: the wait must be bounded.
    const gracePeriodMs = Number.isFinite(options.gracePeriodMs) && (options.gracePeriodMs as number) > 0
        ? (options.gracePeriodMs as number)
        : DEFAULT_GRACE_PERIOD_MS;
    // Never let a broken log sink (e.g. a disposed output channel) reject or
    // stall termination: every path below must reach a settled promise.
    const emit = (message: string) => {
        try {
            options.log?.(message);
        } catch {
            // Ignore logging failures.
        }
    };

    if (!target || (typeof target === 'number' && Number.isNaN(target))) {
        emit('Invalid PID provided.');
        return 'failed';
    }

    const pid = typeof target === 'number' ? target : target.pid;
    if (typeof pid !== 'number' || Number.isNaN(pid)) {
        emit('Invalid PID value.');
        return 'failed';
    }

    if (process.platform === 'win32') {
        return stopOnWindows(pid, force, emit);
    }

    if (!isProcessRunning(target)) {
        return 'alreadyExited';
    }

    try {
        process.kill(pid, force ? 'SIGKILL' : 'SIGTERM');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
            return 'alreadyExited';
        }
        emit(`Failed to terminate process ${pid}: ${(error as Error).message}`);
        return 'failed';
    }

    if (force) {
        emit(`Process ${pid} force terminated with SIGKILL.`);
        return 'forced';
    }

    // Bounded: waitForExit always settles at the deadline at the latest.
    if (await waitForExit(target, gracePeriodMs)) {
        emit(`Process ${pid} terminated successfully.`);
        return 'terminated';
    }

    emit(`Process ${pid} did not exit within ${gracePeriodMs}ms of SIGTERM; sending SIGKILL.`);
    try {
        process.kill(pid, 'SIGKILL');
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ESRCH') {
            // It exited while we were deciding to escalate.
            return 'terminated';
        }
        emit(`Failed to force-terminate process ${pid}: ${(error as Error).message}`);
        return 'failed';
    }
    // SIGKILL cannot be handled; the process is gone as soon as it is reaped.
    return 'forced';
}

/**
 * `taskkill` can itself hang (uninterruptible process, inaccessible PID), so
 * every invocation is bounded. Only `/F` is guaranteed to end the target.
 */
const WINDOWS_TASKKILL_TIMEOUT_MS = 10000;
/** `taskkill` exit code for "no process found with that PID". */
const WINDOWS_TASKKILL_NOT_FOUND = 128;

function runTaskkill(pid: number, force: boolean, timeoutMs: number): Promise<(Error & { code?: string | number }) | null> {
    return new Promise((resolve) => {
        exec(`taskkill /PID ${pid} ${force ? '/F' : ''}`, { timeout: timeoutMs }, (error) => {
            resolve(error ?? null);
        });
    });
}

async function stopOnWindows(
    pid: number,
    force: boolean,
    emit: (message: string) => void,
): Promise<StopOutcome> {
    const error = await runTaskkill(pid, force, WINDOWS_TASKKILL_TIMEOUT_MS);

    if (!error) {
        emit(`Cabbage server (${pid}) terminated successfully.`);
        return force ? 'forced' : 'terminated';
    }

    if (error.code === WINDOWS_TASKKILL_NOT_FOUND) {
        return 'alreadyExited';
    }

    if (!force) {
        // The graceful pass failed or timed out; escalate once, bounded.
        emit(`Graceful taskkill for process ${pid} failed (${error.message}); retrying with /F.`);
        const forcedError = await runTaskkill(pid, true, WINDOWS_TASKKILL_TIMEOUT_MS);
        if (!forcedError) {
            return 'forced';
        }
        if (forcedError.code === WINDOWS_TASKKILL_NOT_FOUND) {
            return 'alreadyExited';
        }
        emit(`Failed to terminate Cabbage server (${pid}): ${forcedError.message}`);
        return 'failed';
    }

    emit(`Failed to terminate Cabbage server (${pid}): ${error.message}`);
    return 'failed';
}
