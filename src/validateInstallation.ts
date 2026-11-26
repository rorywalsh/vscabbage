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

import { BinaryArch, isCompatibleArch } from './utils/binaryArch';
import { compareGlibcVersions, highestGlibcVersion } from './utils/elfGlibc';

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

/** A plugin binary the extension uses when exporting instruments. */
export interface PluginBinarySpec {
    /** Human-readable export format, e.g. 'VST3 effect'. */
    type: string;
    /** Resolved path to the plugin file or bundle. May be '' when unresolved. */
    path: string;
    /** Missing/unsuitable binaries are failures when true, warnings otherwise. */
    required: boolean;
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
    /**
     * Junction/symlink-resolving canonicalisation (e.g. `fs.realpathSync`).
     * Optional; when present, the legacy-settings check uses it to detect the
     * case where the legacy path aliases the canonical file and avoid a
     * false-positive warning that could never be cleared. Throws when the
     * path does not exist.
     */
    realpath?: (p: string) => string;
    /** Lists file names (no directories) directly inside `dir`. Throws on error. */
    listFiles: (dir: string) => string[];
    /** True when an executable with this name is found on PATH. */
    isOnPath: (name: string) => boolean;
    /**
     * True when `p` has its executable bit set (e.g. `fs.accessSync(p, X_OK)`).
     * Meaningless on Windows, where the executable-bit checks skip it.
     */
    isExecutable: (p: string) => boolean;
    /** Node `process.arch` value, e.g. 'x64' | 'arm64' | 'ia32'. */
    hostArch: string;
    /** Reads a native binary's architecture from its header. */
    readBinaryArch: (p: string) => BinaryArch;
    /**
     * Reads the `GLIBC_*` symbol versions a Linux ELF binary requires.
     * Returns undefined when the file is unreadable / not an ELF image.
     */
    readGlibcRequirements: (p: string) => string[] | undefined;
    /**
     * Host glibc version such as '2.39' (Node's
     * `process.report.header.glibcVersionRuntime`), or undefined when it
     * cannot be determined or the platform is not glibc Linux.
     */
    hostGlibcVersion?: string;
    /** Plugin binaries used by the export commands. */
    pluginBinaries: PluginBinarySpec[];
    /** True when `p` is a directory (e.g. a plugin bundle) rather than a file. */
    isDirectory: (p: string) => boolean;
    /** Lists directory names (no files) directly inside `dir`. Throws on error. */
    listDirectories: (dir: string) => string[];
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
        const bin = 'C:/Program Files/Csound7/bin';
        // The bundled CabbageApp.exe links against csound7_64.dll specifically
        // (Csound 7.0.0 renamed its Windows library from csound64.dll). Only
        // accept that exact name, otherwise machines still carrying the old
        // csound64.dll layout would get a false "pass" while the backend still
        // fails to start with STATUS_DLL_NOT_FOUND.
        const required = 'csound7_64.dll';
        const legacy = 'csound64.dll';
        if (env.exists(`${bin}/${required}`)) {
            return { ...base, status: 'pass', detail: `Found ${bin}/${required}` };
        }
        if (env.isOnPath(required)) {
            return { ...base, status: 'pass', detail: `Found ${required} on PATH` };
        }
        if (env.exists(`${bin}/${legacy}`) || env.isOnPath(legacy)) {
            return {
                ...base, status: 'fail',
                detail: `Found only the older Csound library (${legacy}), but the bundled CabbageApp.exe requires ${required}`,
                remedy: 'Install Csound 7.0.0 or newer so that csound7_64.dll is present in C:/Program Files/Csound7/bin or on PATH.',
            };
        }
        return {
            ...base, status: 'fail',
            detail: `Not found: ${bin}/${required} (or ${required} on PATH)`,
            remedy: 'Install Csound 7.0.0 or newer so that csound7_64.dll is present in C:/Program Files/Csound7/bin or on PATH.',
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

export function checkServiceBinaryExecutable(env: ValidationEnv): CheckResult {
    const base = { id: 'serviceBinaryExecutable', label: 'Cabbage Server is executable' };
    // The execute bit is a POSIX concept; Windows decides executability by file
    // extension / PATHEXT, so there is nothing meaningful to probe there.
    if (env.platform === 'win32') {
        return { ...base, status: 'pass', detail: 'Not applicable on Windows' };
    }
    // Same Pro/public precedence as checkServiceBinary() so both probes talk
    // about the same file.
    const usingPro = env.proServiceBinaryPath !== '' && env.proAppEnabled;
    const binaryPath = usingPro ? env.proServiceBinaryPath : env.cabbageAppBinaryPath;
    if (!binaryPath || !env.exists(binaryPath)) {
        // checkServiceBinary() already reports the missing/unresolvable binary;
        // don't duplicate that failure here.
        return { ...base, status: 'warn', detail: 'Skipped: binary could not be resolved or is missing' };
    }
    try {
        return env.isExecutable(binaryPath)
            ? { ...base, status: 'pass', detail: `Executable bit set on ${binaryPath}` }
            : {
                ...base, status: 'fail',
                detail: `Executable bit is NOT set on ${binaryPath}`,
                remedy: 'The backend cannot be launched. Run `chmod +x "<path>"` on the binary above, or reinstall the Cabbage extension. The extension also repairs this automatically on the next backend start.',
            };
    } catch (err) {
        return {
            ...base, status: 'warn',
            detail: `Could not stat ${binaryPath}: ${err instanceof Error ? err.message : String(err)}`,
        };
    }
}

export function checkServiceBinaryArch(env: ValidationEnv): CheckResult {
    const base = { id: 'serviceBinaryArch', label: 'Cabbage Server architecture matches this machine' };
    // Same Pro/public precedence as the other binary probes so every check
    // talks about the same file.
    const usingPro = env.proServiceBinaryPath !== '' && env.proAppEnabled;
    const binaryPath = usingPro ? env.proServiceBinaryPath : env.cabbageAppBinaryPath;
    if (!binaryPath || !env.exists(binaryPath)) {
        // checkServiceBinary() already reports the missing/unresolvable binary;
        // don't duplicate that failure here.
        return { ...base, status: 'warn', detail: 'Skipped: binary could not be resolved or is missing' };
    }
    const binaryArch = env.readBinaryArch(binaryPath);
    if (binaryArch === 'unknown') {
        return { ...base, status: 'warn', detail: `Could not determine the architecture of ${binaryPath}` };
    }
    if (!isCompatibleArch(binaryArch, env.hostArch)) {
        return {
            ...base, status: 'fail',
            detail: `The bundled backend (${binaryPath}) is ${binaryArch}, but this machine is ${env.hostArch}`,
            remedy: `You have the wrong build for this platform. Install the ${env.hostArch} package for your OS.`,
        };
    }
    return {
        ...base, status: 'pass',
        detail: `Backend architecture (${binaryArch}) is compatible with this machine (${env.hostArch})`,
    };
}

/**
 * Returns a short description when a Linux ELF binary requires a newer glibc
 * than the host provides, or undefined when it is compatible (or the check is
 * not applicable). glibc is forward-compatible only: a binary built on a
 * newer distro fails to start on an older one with "version `GLIBC_x.y' not
 * found", which is what this catches without executing the binary.
 */
function glibcIncompatibility(binaryPath: string, env: ValidationEnv): string | undefined {
    if (env.platform !== 'linux' || !env.hostGlibcVersion) {
        return undefined;
    }
    let required: string[] | undefined;
    try {
        required = env.readGlibcRequirements(binaryPath);
    } catch {
        required = undefined;
    }
    const newest = required ? highestGlibcVersion(required) : undefined;
    if (!newest) {
        return undefined;
    }
    return compareGlibcVersions(newest, env.hostGlibcVersion) > 0
        ? `requires glibc ${newest} but this machine has glibc ${env.hostGlibcVersion}`
        : undefined;
}

export function checkServiceBinaryGlibc(env: ValidationEnv): CheckResult {
    const base = { id: 'serviceBinaryGlibc', label: 'Cabbage Server C library (glibc) compatibility' };
    if (env.platform !== 'linux') {
        return { ...base, status: 'pass', detail: 'Not applicable on this platform' };
    }
    // Same Pro/public precedence as the other binary probes.
    const usingPro = env.proServiceBinaryPath !== '' && env.proAppEnabled;
    const binaryPath = usingPro ? env.proServiceBinaryPath : env.cabbageAppBinaryPath;
    if (!binaryPath || !env.exists(binaryPath)) {
        // checkServiceBinary() already reports the missing/unresolvable binary.
        return { ...base, status: 'warn', detail: 'Skipped: binary could not be resolved or is missing' };
    }
    if (!env.hostGlibcVersion) {
        return { ...base, status: 'warn', detail: 'Could not determine this machine\'s glibc version; skipped' };
    }
    let required: string[] | undefined;
    try {
        required = env.readGlibcRequirements(binaryPath);
    } catch {
        required = undefined;
    }
    if (required === undefined) {
        return { ...base, status: 'warn', detail: `Could not read the ELF version requirements of ${binaryPath}` };
    }
    const newest = highestGlibcVersion(required);
    if (!newest) {
        return {
            ...base, status: 'pass',
            detail: `No glibc symbol version requirements found in ${binaryPath} (statically linked, or not a glibc ELF binary)`,
        };
    }
    if (compareGlibcVersions(newest, env.hostGlibcVersion) > 0) {
        return {
            ...base, status: 'fail',
            detail: `The bundled backend requires glibc ${newest}, but this machine has glibc ${env.hostGlibcVersion} (${binaryPath})`,
            remedy: `This package was built on a newer Linux distribution than this machine, so the backend cannot start ("version \`GLIBC_${newest}' not found"). Install a Cabbage extension build made for glibc ${env.hostGlibcVersion} or older (rebuild the linux-x64 VSIX on Ubuntu 22.04), or upgrade this machine's Linux distribution. Pointing cabbage.pathToCabbageBinary at a locally built CabbageApp also avoids the bundled binary.`,
        };
    }
    return {
        ...base, status: 'pass',
        detail: `Backend requires glibc ${newest}; this machine has glibc ${env.hostGlibcVersion}`,
    };
}

/**
 * Joins path fragments with forward slashes. The result is accepted by both
 * POSIX and Windows filesystem APIs, and keeps the pure probes independent of
 * the host OS's separator.
 */
function joinPath(...parts: string[]): string {
    return parts
        .filter((part) => part.length > 0)
        .map((part, index) => index === 0
            ? part.replace(/[\\/]+$/, '')
            : part.replace(/^[\\/]+|[\\/]+$/g, ''))
        .join('/');
}

/** Base name of a plugin bundle without its format extension. */
function bundleBaseName(pluginPath: string): string {
    const name = pluginPath.split(/[\\/]/).pop() || '';
    return name.replace(/\.(vst3|clap|component)$/i, '');
}

function safeListFiles(env: ValidationEnv, dir: string): string[] {
    try {
        return env.listFiles(dir);
    } catch {
        return [];
    }
}

function safeListDirectories(env: ValidationEnv, dir: string): string[] {
    try {
        return env.listDirectories(dir);
    } catch {
        return [];
    }
}

/** Orders Linux architecture directories so the host's native one comes first. */
function linuxArchDirPriority(dirName: string, hostArch: string): number {
    switch (hostArch) {
        case 'x64':
            return dirName === 'x86_64-linux' ? 0 : 1;
        case 'arm64':
            return dirName === 'aarch64-linux' || dirName === 'arm64-linux' ? 0 : 1;
        case 'ia32':
            return dirName === 'i386-linux' || dirName === 'i686-linux' ? 0 : 1;
        case 'arm':
            return dirName.startsWith('arm') ? 0 : 1;
        default:
            return 0;
    }
}

interface ResolvedPluginBinary {
    binaryPath?: string;
    error?: string;
}

/**
 * Locates the loadable binary inside a plugin file or bundle. VST3/AU/CLAP
 * bundles keep it in an architecture-specific folder:
 * Contents/<arch>-linux on Linux, Contents/<arch>-win[/Release|/Debug] on
 * Windows bundles, and Contents/MacOS on macOS. Single-file plugins (Windows
 * VST3, Linux/Windows CLAP) are returned as-is.
 */
export function resolvePluginBundleBinary(pluginPath: string, env: ValidationEnv): ResolvedPluginBinary {
    if (!pluginPath) {
        return { error: 'path could not be resolved' };
    }
    if (!env.exists(pluginPath)) {
        return { error: 'not found' };
    }
    if (!env.isDirectory(pluginPath)) {
        return { binaryPath: pluginPath };
    }

    const expectedName = bundleBaseName(pluginPath);

    if (env.platform === 'darwin') {
        const macosDir = joinPath(pluginPath, 'Contents', 'MacOS');
        if (!env.exists(macosDir)) {
            return { error: 'missing Contents/MacOS directory' };
        }
        const files = safeListFiles(env, macosDir).filter((name) => !name.startsWith('.'));
        const binary = files.find((name) => name === expectedName) ?? files[0];
        return binary
            ? { binaryPath: joinPath(macosDir, binary) }
            : { error: 'no binary in Contents/MacOS' };
    }

    if (env.platform === 'linux') {
        const contentsDir = joinPath(pluginPath, 'Contents');
        if (!env.exists(contentsDir)) {
            return { error: 'missing Contents directory' };
        }
        const archDirs = safeListDirectories(env, contentsDir)
            .filter((name) => name.endsWith('-linux'))
            .sort((a, b) => linuxArchDirPriority(a, env.hostArch) - linuxArchDirPriority(b, env.hostArch));
        if (archDirs.length === 0) {
            return { error: 'no Contents/<arch>-linux directory' };
        }
        for (const archDir of archDirs) {
            const dir = joinPath(contentsDir, archDir);
            const libraries = safeListFiles(env, dir).filter((name) => name.endsWith('.so'));
            const library = libraries.find((name) => name === `${expectedName}.so`) ?? libraries[0];
            if (library) {
                return { binaryPath: joinPath(dir, library) };
            }
        }
        return { error: 'no .so found in Contents/<arch>-linux' };
    }

    if (env.platform === 'win32') {
        const contentsDir = joinPath(pluginPath, 'Contents');
        if (!env.exists(contentsDir)) {
            return { error: 'missing Contents directory' };
        }
        const winDirs = safeListDirectories(env, contentsDir).filter((name) => name.endsWith('-win'));
        for (const winDir of winDirs) {
            for (const config of ['Release', 'Debug', '']) {
                const dir = config ? joinPath(contentsDir, winDir, config) : joinPath(contentsDir, winDir);
                if (!env.exists(dir)) {
                    continue;
                }
                const binaries = safeListFiles(env, dir)
                    .filter((name) => /\.(vst3|clap|dll)$/i.test(name));
                const binary = binaries.find((name) => name === `${expectedName}.vst3`)
                    ?? binaries.find((name) => name === `${expectedName}.clap`)
                    ?? binaries.find((name) => name === `${expectedName}.dll`)
                    ?? binaries[0];
                if (binary) {
                    return { binaryPath: joinPath(dir, binary) };
                }
            }
        }
        return { error: 'no Contents/<arch>-win plugin binary' };
    }

    return { error: `unsupported platform ${env.platform}` };
}

export function checkPluginBinaries(env: ValidationEnv): CheckResult {
    const base = { id: 'pluginBinaries', label: 'Export plugin binaries' };
    if (env.pluginBinaries.length === 0) {
        return {
            ...base, status: 'warn',
            detail: 'No export plugin binaries configured; skipping',
        };
    }

    const lines: string[] = [];
    let requiredFailure = false;
    let warning = false;

    for (const spec of env.pluginBinaries) {
        const resolved = resolvePluginBundleBinary(spec.path, env);
        if (!resolved.binaryPath) {
            if (spec.required) {
                requiredFailure = true;
            } else {
                warning = true;
            }
            const icon = spec.required ? '✗' : '⚠';
            lines.push(`${icon} ${spec.type}: ${spec.path || '(unresolved path)'} — ${resolved.error}`);
            continue;
        }

        let arch: BinaryArch = 'unknown';
        try {
            arch = env.readBinaryArch(resolved.binaryPath);
        } catch {
            arch = 'unknown';
        }
        if (arch === 'unknown') {
            warning = true;
            lines.push(`⚠ ${spec.type}: could not determine architecture of ${resolved.binaryPath}`);
            continue;
        }
        if (!isCompatibleArch(arch, env.hostArch)) {
            if (spec.required) {
                requiredFailure = true;
            } else {
                warning = true;
            }
            const icon = spec.required ? '✗' : '⚠';
            lines.push(`${icon} ${spec.type}: ${arch} binary on ${env.hostArch} host — ${resolved.binaryPath}`);
            continue;
        }
        const glibcIssue = glibcIncompatibility(resolved.binaryPath, env);
        if (glibcIssue) {
            if (spec.required) {
                requiredFailure = true;
            } else {
                warning = true;
            }
            const icon = spec.required ? '✗' : '⚠';
            lines.push(`${icon} ${spec.type}: ${glibcIssue} — ${resolved.binaryPath}`);
            continue;
        }
        lines.push(`✓ ${spec.type}: ${resolved.binaryPath} (${arch})`);
    }

    const status: CheckStatus = requiredFailure ? 'fail' : warning ? 'warn' : 'pass';
    const remedy = status === 'fail'
        ? 'Reinstall the Cabbage extension, or point cabbage.pathToCabbageBinary at a complete CabbageBinaries directory containing the plugin binaries for this platform. A "requires glibc ... but this machine has glibc ..." line means the package was built on a newer Linux distribution than this machine: install a build made for this glibc version (the linux-x64 VSIX is built on Ubuntu 22.04), or upgrade the OS.'
        : status === 'warn'
            ? 'Some plugin formats are missing or could not be verified. Reinstall the extension if you need to export those formats.'
            : undefined;
    return { ...base, status, detail: lines.join('\n'), remedy };
}

export function checkSettingsFile(env: ValidationEnv): CheckResult {
    // Labelled "backend" to distinguish from the VS Code user settings.json:
    // this is %LOCALAPPDATA%\Cabbage\settings.json, the file the CabbageApp
    // backend reads (must match File::getSettingsFile() in cabbage3).
    const base = { id: 'settingsFile', label: `Cabbage backend settings file (${env.settingsPath})` };
    if (env.settingsFileText === undefined) {
        return {
            ...base, status: 'warn', detail: 'Settings file is missing',
            remedy: 'It is created automatically with defaults the next time the extension reads settings. If problems persist, run `Cabbage: Reset CabbageApp (not vscode) settings file`.',
        };
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(env.settingsFileText);
    } catch {
        return {
            ...base, status: 'fail', detail: 'Settings file exists but is not valid JSON',
            remedy: 'Run `Cabbage: Reset CabbageApp (not vscode) settings file` to replace it with defaults (your current file will be deleted).',
        };
    }
    if (typeof parsed !== 'object' || parsed === null || typeof (parsed as any)['currentConfig'] !== 'object') {
        return {
            ...base, status: 'fail', detail: 'Settings file is missing the `currentConfig` section (very old format)',
            remedy: 'Run `Cabbage: Reset CabbageApp (not vscode) settings file` to replace it with defaults (your current file will be deleted).',
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
            remedy: 'Run `Cabbage: Reset CabbageApp (not vscode) settings file`, or set the OS-specific `cabbage.pathToJsSource*` VS Code setting to your Cabbage Javascript folder.',
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
            remedy: 'Run `Cabbage: Reset CabbageApp (not vscode) settings file`, then `Cabbage: Restart Backend`.',
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
    // On modern Windows the pre-unification path can alias the canonical file
    // via the well-known app-compat junctions (Local Settings -> AppData\Local,
    // Application Data -> loopback onto AppData\Local). Without resolving, the
    // check warns about the live settings file itself — and following the old
    // remedy (delete it) would delete the live configuration. So resolve first.
    if (env.realpath) {
        try {
            const canonical = env.realpath(env.settingsPath).toLowerCase();
            const legacy = env.realpath(env.legacySettingsPath).toLowerCase();
            if (canonical === legacy) {
                return { ...base, status: 'pass', detail: 'Legacy path resolves to the same file as the canonical settings (junction alias) — no stale copy' };
            }
        } catch {
            // Either path is missing — fall through to the existence check below.
        }
    } else if (env.settingsPath.toLowerCase() === env.legacySettingsPath.toLowerCase()) {
        return { ...base, status: 'pass', detail: 'Legacy path is identical to the canonical settings path — no stale copy' };
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
    safe(() => checkServiceBinaryExecutable(env), 'serviceBinaryExecutable', 'Cabbage Server is executable');
    safe(() => checkServiceBinaryArch(env), 'serviceBinaryArch', 'Cabbage Server architecture matches this machine');
    safe(() => checkServiceBinaryGlibc(env), 'serviceBinaryGlibc', 'Cabbage Server C library (glibc) compatibility');
    safe(() => checkPluginBinaries(env), 'pluginBinaries', 'Export plugin binaries');
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
        for (const detailLine of r.detail.split('\n')) {
            lines.push(`    ${detailLine}`);
        }
        if (r.status !== 'pass' && r.remedy) {
            lines.push(`    → ${r.remedy}`);
        }
    }
    const { fails, warns } = summarize(results);
    lines.push('');
    lines.push(fails === 0 && warns === 0
        ? 'Result: healthy — no issues found.'
        : `Result: ${fails} failure(s), ${warns} warning(s). See remedies above.`);
    lines.push('');
    lines.push('Troubleshooting: blank editor panel');
    lines.push('    If the Cabbage editor opens blank and VS Code shows');
    lines.push('    "Could not register service worker: InvalidStateError…",');
    lines.push('    that is a VS Code webview host issue, not a Cabbage error.');
    lines.push('    Fix: run Developer: Reload Window. If it persists, fully quit all');
    lines.push('    VS Code windows, delete the "Service Worker" folder inside the');
    lines.push('    VS Code user-data directory, then reopen. See microsoft/vscode#125993.');
    return lines.join('\n');
}
