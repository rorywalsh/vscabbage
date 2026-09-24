// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Report-only installation validation ("doctor") checks.
 *
 * This module is intentionally free of `vscode` imports so every probe is a
 * pure function over injected inputs and can run under plain mocha (see
 * src/test/unit/validateInstallation.test.ts). The thin VS Code command
 * wrapper lives in extension.ts and only gathers real inputs / prints results.
 *
 * Nothing here writes files, changes settings, or (re)starts processes.
 */

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface CheckResult {
    /** Stable id, e.g. 'csound'. */
    id: string;
    /** One-line human-readable label. */
    label: string;
    status: CheckStatus;
    /** Detail line(s) shown in the report. */
    detail: string;
    /** What the user should do when status is not 'pass'. Omit when n/a. */
    remedy?: string;
}

/** All filesystem/process access a validation run needs, injected for tests. */
export interface ValidationEnv {
    /** os.platform() value: 'darwin' | 'win32' | 'linux' | ... */
    platform: string;
    /** Canonical shared settings file path (extension backend must agree). */
    settingsPath: string;
    /** Legacy Windows settings file path (migration source). */
    legacySettingsPath: string;
    /** Raw text of the settings file; undefined when the file is missing. */
    settingsFileText?: string;
    /** Expected primary JS source dir (current extension `src/`). May be ''. */
    expectedPrimarySourceDir: string;
    /** Resolved public CabbageApp binary path. May be ''. */
    cabbageAppBinaryPath: string;
    /** Resolved Pro CabbageApp binary path ('' when no Pro path configured). */
    proServiceBinaryPath: string;
    /** Mirrors the `cabbage.proAppEnabled` VS Code setting (default true). */
    proAppEnabled: boolean;
    /** Synchronous existence check for files/directories. */
    exists: (p: string) => boolean;
    /** Lists file names (no directories) directly inside `dir`. Throws on error. */
    listFiles: (dir: string) => string[];
    /** True when an executable with this name is found on PATH. */
    isOnPath: (name: string) => boolean;
}

/** Normalises a `currentConfig.jsSourceDir` value into a directory list. */
export function normalizeSourceDirs(value: unknown): string[] {
    if (Array.isArray(value)) {
        return (value as unknown[]).filter((v): v is string => typeof v === 'string' && v.length > 0);
    }
    if (typeof value === 'string' && value.length > 0) {
        return [value];
    }
    return [];
}

export function checkCsoundPresent(env: ValidationEnv): CheckResult {
    const base = { id: 'csound', label: 'Csound installed' };
    if (env.platform === 'darwin') {
        const p = '/Applications/Csound/CsoundLib64.framework';
        return env.exists(p)
            ? { ...base, status: 'pass', detail: `Found ${p}` }
            : {
                ...base, status: 'fail', detail: `Not found: ${p}`,
                remedy: 'Install Csound 7 (https://csound.com/download.html) so that /Applications/Csound/CsoundLib64.framework exists.',
            };
    }
    if (env.platform === 'win32') {
        const dll = 'C:/Program Files/Csound7/bin/csound64.dll';
        return env.exists(dll) || env.isOnPath('csound64.dll') || env.isOnPath('csound')
            ? { ...base, status: 'pass', detail: `Found ${dll} or Csound on PATH` }
            : {
                ...base, status: 'fail', detail: `Not found: ${dll}, and no Csound on PATH`,
                remedy: 'Install Csound 7 and ensure csound64.dll is in C:/Program Files/Csound7/bin or on PATH.',
            };
    }
    const bin = '/usr/local/bin/csound';
    const lib = '/usr/local/lib/csound';
    return env.exists(bin) && env.exists(lib)
        ? { ...base, status: 'pass', detail: `Found ${bin} and ${lib}` }
        : {
            ...base, status: 'fail', detail: `Not found: ${bin} and ${lib}`,
            remedy: 'Install Csound 7 so that /usr/local/bin/csound and /usr/local/lib/csound exist.',
        };
}

export function checkServiceBinary(env: ValidationEnv): CheckResult {
    const base = { id: 'serviceBinary', label: 'Cabbage Server' };
    // Precedence mirrors Commands.manageServer(): the Pro binary wins when a
    // Pro path is configured and the Pro app is enabled.
    const usingPro = env.proServiceBinaryPath !== '' && env.proAppEnabled;
    const binaryPath = usingPro ? env.proServiceBinaryPath : env.cabbageAppBinaryPath;
    const flavor = usingPro ? 'Pro' : 'public';
    if (!binaryPath) {
        return {
            ...base, status: 'fail', detail: 'Binary path could not be resolved',
            remedy: 'Reinstall the Cabbage extension, or set a custom binary path via the cabbage.pathToCabbageBinary VS Code setting.',
        };
    }
    return env.exists(binaryPath)
        ? { ...base, status: 'pass', detail: `Found ${flavor} Cabbage Server: ${binaryPath}` }
        : {
            ...base, status: 'fail', detail: `Not found: ${binaryPath}`,
            remedy: usingPro
                ? 'The Pro binary path is set but the Cabbage Server binary is missing there. Check cabbage.pathToCabbageProBinary, or disable cabbage.proAppEnabled to fall back to the public binary.'
                : 'Reinstall the Cabbage extension, or point cabbage.pathToCabbageBinary at a directory containing the Cabbage Server binary.',
        };
}

export function checkSettingsFile(env: ValidationEnv): CheckResult {
    const base = { id: 'settingsFile', label: `Settings file (${env.settingsPath})` };
    if (env.settingsFileText === undefined) {
        return {
            ...base, status: 'warn', detail: 'Settings file is missing',
            remedy: 'It is created automatically with defaults the next time the extension reads settings. If problems persist, run `Cabbage: Reset Cabbage App Settings Files`.',
        };
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(env.settingsFileText);
    } catch {
        return {
            ...base, status: 'fail', detail: 'Settings file exists but is not valid JSON',
            remedy: 'Run `Cabbage: Reset Cabbage App Settings Files` to replace it with defaults (your current file will be deleted).',
        };
    }
    if (typeof parsed !== 'object' || parsed === null || typeof (parsed as any)['currentConfig'] !== 'object') {
        return {
            ...base, status: 'fail', detail: 'Settings file is missing the `currentConfig` section (very old format)',
            remedy: 'Run `Cabbage: Reset Cabbage App Settings Files` to replace it with defaults (your current file will be deleted).',
        };
    }
    return { ...base, status: 'pass', detail: 'Settings file exists, is valid JSON, and has a `currentConfig` section' };
}

/** Parses settings text leniently: undefined when missing/invalid/wrong shape. */
export function parseSettings(text: string | undefined): { jsSourceDir: unknown } | undefined {
    if (text === undefined) {
        return undefined;
    }
    try {
        const parsed: unknown = JSON.parse(text);
        if (typeof parsed === 'object' && parsed !== null && typeof (parsed as any)['currentConfig'] === 'object') {
            return { jsSourceDir: (parsed as any)['currentConfig']['jsSourceDir'] };
        }
    } catch {
        // fall through
    }
    return undefined;
}

export function checkJsSourceDirs(dirs: string[], env: ValidationEnv): CheckResult {
    const base = { id: 'jsSourceDir', label: 'JS source directories exist' };
    if (dirs.length === 0) {
        return {
            ...base, status: 'fail', detail: '`currentConfig.jsSourceDir` is missing or empty',
            remedy: 'Run `Cabbage: Reset Cabbage App Settings Files`, or set the OS-specific `cabbage.pathToJsSource*` VS Code setting to your Cabbage Javascript folder.',
        };
    }
    const missing = dirs.filter((d) => !env.exists(d));
    return missing.length === 0
        ? { ...base, status: 'pass', detail: `${dirs.length} director${dirs.length === 1 ? 'y' : 'ies'} configured, all exist` }
        : {
            ...base, status: 'fail',
            detail: `Missing director${missing.length === 1 ? 'y' : 'ies'}: ${missing.join(', ')}`,
            remedy: 'A stale path (e.g. from a previous extension version) is pointing nowhere. Update the OS-specific `cabbage.pathToJsSource*` VS Code setting, or reset the settings file. Then run `Cabbage: Restart Backend`.',
        };
}

export function checkPrimarySource(dirs: string[], env: ValidationEnv): CheckResult {
    const base = { id: 'primarySource', label: 'Primary source is the bundled extension' };
    if (!env.expectedPrimarySourceDir) {
        return { ...base, status: 'warn', detail: 'Extension install location could not be resolved, skipping staleness check' };
    }
    if (dirs.length === 0) {
        return {
            ...base, status: 'fail', detail: 'No primary source directory configured',
            remedy: 'Run `Cabbage: Reset Cabbage App Settings Files`, then `Cabbage: Restart Backend`.',
        };
    }
    return dirs[0] === env.expectedPrimarySourceDir
        ? { ...base, status: 'pass', detail: `Primary source matches bundled extension: ${dirs[0]}` }
        : {
            ...base, status: 'fail',
            detail: `Primary source ${dirs[0]} does not match bundled extension ${env.expectedPrimarySourceDir} (stale install path)`,
            remedy: 'This is the classic cause of "Widget type is not valid / Unknown widget type" errors for every widget. Update the OS-specific `cabbage.pathToJsSource*` VS Code setting to the bundled location, or reset the settings file. Then run `Cabbage: Restart Backend`.',
        };
}

export function checkWidgetSources(primaryDir: string | undefined, env: ValidationEnv): CheckResult {
    const base = { id: 'widgetSources', label: 'Widget sources resolvable' };
    if (!primaryDir) {
        return { ...base, status: 'warn', detail: 'Skipped: no primary source directory configured' };
    }
    const widgetsDir = `${primaryDir.replace(/\/+$/, '')}/cabbage/widgets`;
    if (!env.exists(widgetsDir)) {
        return {
            ...base, status: 'fail', detail: `Widget directory not found: ${widgetsDir}`,
            remedy: 'The backend reports "Unknown widget type" for every widget when this is missing. Reinstall the extension, then run `Cabbage: Restart Backend`.',
        };
    }
    let files: string[];
    try {
        files = env.listFiles(widgetsDir).filter((f) => f.endsWith('.js'));
    } catch {
        return { ...base, status: 'fail', detail: `Could not list widget directory: ${widgetsDir}`, remedy: 'Check file permissions, or reinstall the extension.' };
    }
    const core = ['form', 'rotarySlider', 'button'];
    const missingCore = core.filter((w) => !files.some((f) => f === `${w}.js`));
    return missingCore.length === 0
        ? { ...base, status: 'pass', detail: `Found ${files.length} widget descriptors in ${widgetsDir}` }
        : {
            ...base, status: 'fail', detail: `Widget directory exists but core descriptors are missing (${missingCore.join(', ')})`,
            remedy: 'Your widget sources look incomplete or corrupted. Reinstall the extension, then run `Cabbage: Restart Backend`.',
        };
}

export function checkLegacySettingsFile(env: ValidationEnv): CheckResult {
    const base = { id: 'legacySettingsFile', label: 'No stale legacy settings file' };
    if (env.platform !== 'win32') {
        return { ...base, status: 'pass', detail: 'Not applicable on this platform' };
    }
    return env.exists(env.legacySettingsPath)
        ? {
            ...base, status: 'warn', detail: `Legacy settings file still present: ${env.legacySettingsPath}`,
            remedy: 'Older extension versions wrote settings here, which the backend never reads. After confirming your canonical settings file holds your configuration, delete the legacy file.',
        }
        : { ...base, status: 'pass', detail: 'No legacy settings file present' };
}

/** Runs every probe in a stable order. Never throws: unexpected errors become a 'fail' result. */
export function runAllChecks(env: ValidationEnv): CheckResult[] {
    const results: CheckResult[] = [];
    const safe = (fn: () => CheckResult, id: string, label: string): void => {
        try {
            results.push(fn());
        } catch (err) {
            results.push({ id, label, status: 'fail', detail: `Check crashed: ${err instanceof Error ? err.message : String(err)}` });
        }
    };
    safe(() => checkCsoundPresent(env), 'csound', 'Csound installed');
    safe(() => checkServiceBinary(env), 'serviceBinary', 'Cabbage Server');
    safe(() => checkSettingsFile(env), 'settingsFile', 'Settings file');
    const parsed = parseSettings(env.settingsFileText);
    const dirs = parsed ? normalizeSourceDirs(parsed.jsSourceDir) : [];
    safe(() => checkJsSourceDirs(dirs, env), 'jsSourceDir', 'JS source directories exist');
    safe(() => checkPrimarySource(dirs, env), 'primarySource', 'Primary source is the bundled extension');
    safe(() => checkWidgetSources(dirs[0], env), 'widgetSources', 'Widget sources resolvable');
    safe(() => checkLegacySettingsFile(env), 'legacySettingsFile', 'No stale legacy settings file');
    return results;
}

export function summarize(results: CheckResult[]): { fails: number; warns: number } {
    return {
        fails: results.filter((r) => r.status === 'fail').length,
        warns: results.filter((r) => r.status === 'warn').length,
    };
}

const STATUS_ICON: Record<CheckStatus, string> = { pass: '✓', warn: '⚠', fail: '✗' };

/** Renders the report text shown in the output channel. */
export function formatReport(results: CheckResult[]): string {
    const lines = ['Cabbage installation validation', '================================='];
    for (const r of results) {
        lines.push(`${STATUS_ICON[r.status]} [${r.status.toUpperCase()}] ${r.label}`);
        lines.push(`    ${r.detail}`);
        if (r.status !== 'pass' && r.remedy) {
            lines.push(`    → ${r.remedy}`);
        }
    }
    const { fails, warns } = summarize(results);
    lines.push('');
    lines.push(fails === 0 && warns === 0
        ? 'Result: healthy — no issues found.'
        : `Result: ${fails} failure(s), ${warns} warning(s). See remedies above.`);
    return lines.join('\n');
}
