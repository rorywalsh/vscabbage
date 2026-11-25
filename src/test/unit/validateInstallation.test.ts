// Unit tests for the report-only installation validation probes.
// Run with: npm run test:unit (plain mocha, no VS Code instance needed).
import assert from 'assert';
import {
    normalizeSourceDirs,
    checkCsoundPresent,
    checkServiceBinary,
    checkServiceBinaryExecutable,
    checkServiceBinaryArch,
    checkServiceBinaryGlibc,
    checkPluginBinaries,
    resolvePluginBundleBinary,
    checkSettingsFile,
    checkJsSourceDirs,
    checkPrimarySource,
    checkWidgetSources,
    checkLegacySettingsFile,
    runAllChecks,
    summarize,
    formatReport,
    ValidationEnv,
} from '../../validateInstallation';

function baseEnv(overrides: Partial<ValidationEnv> = {}): ValidationEnv {
    return {
        platform: 'darwin',
        settingsPath: '/canonical/settings.json',
        legacySettingsPath: '/legacy/settings.json',
        settingsFileText: JSON.stringify({ currentConfig: { jsSourceDir: ['/ext/src'] } }),
        expectedPrimarySourceDir: '/ext/src',
        cabbageAppBinaryPath: '/ext/bin/CabbageApp',
        proServiceBinaryPath: '',
        proAppEnabled: true,
        exists: () => true,
        listFiles: () => ['form.js', 'rotarySlider.js', 'button.js'],
        isOnPath: () => false,
        isExecutable: () => true,
        hostArch: 'x64',
        readBinaryArch: () => 'x64',
        readGlibcRequirements: () => [],
        hostGlibcVersion: undefined,
        pluginBinaries: [
            { type: 'VST3 effect', path: '/ext/bin/CabbagePluginEffect.vst3', required: true },
        ],
        isDirectory: () => false,
        listDirectories: () => [],
        ...overrides,
    };
}

describe('normalizeSourceDirs', () => {
    it('passes arrays through, dropping non-strings and empties', () => {
        assert.deepStrictEqual(normalizeSourceDirs(['/a', '', 42, '/b']), ['/a', '/b']);
    });
    it('wraps a single string', () => {
        assert.deepStrictEqual(normalizeSourceDirs('/a'), ['/a']);
    });
    it('returns [] for missing/empty/foreign values', () => {
        assert.deepStrictEqual(normalizeSourceDirs(undefined), []);
        assert.deepStrictEqual(normalizeSourceDirs(''), []);
        assert.deepStrictEqual(normalizeSourceDirs(42), []);
    });
});

describe('checkSettingsFile', () => {
    it('warns when the file is missing', () => {
        const r = checkSettingsFile(baseEnv({ settingsFileText: undefined }));
        assert.strictEqual(r.status, 'warn');
    });
    it('fails on invalid JSON', () => {
        const r = checkSettingsFile(baseEnv({ settingsFileText: '{nope' }));
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.remedy);
    });
    it('fails when currentConfig is absent', () => {
        const r = checkSettingsFile(baseEnv({ settingsFileText: '{}' }));
        assert.strictEqual(r.status, 'fail');
    });
    it('passes on a well-formed file', () => {
        assert.strictEqual(checkSettingsFile(baseEnv()).status, 'pass');
    });
});

describe('checkJsSourceDirs', () => {
    it('fails when empty', () => {
        const r = checkJsSourceDirs([], baseEnv());
        assert.strictEqual(r.status, 'fail');
    });
    it('passes when every entry exists', () => {
        assert.strictEqual(checkJsSourceDirs(['/a', '/b'], baseEnv()).status, 'pass');
    });
    it('fails naming the missing entries', () => {
        const r = checkJsSourceDirs(['/a', '/gone'], baseEnv({ exists: (p) => p === '/a' }));
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.detail.includes('/gone'));
        assert.ok(r.remedy);
    });
});

describe('checkPrimarySource', () => {
    it('passes when primary matches the bundled extension', () => {
        assert.strictEqual(checkPrimarySource(['/ext/src'], baseEnv()).status, 'pass');
    });
    it('fails on a stale primary, mentioning unknown-widget errors', () => {
        const r = checkPrimarySource(['/old/ext/src'], baseEnv());
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.remedy && r.remedy.includes('Unknown widget type'));
    });
    it('warns when the expected location is unknown', () => {
        assert.strictEqual(checkPrimarySource(['/x'], baseEnv({ expectedPrimarySourceDir: '' })).status, 'warn');
    });
});

describe('checkWidgetSources', () => {
    it('passes when core descriptors are present', () => {
        assert.strictEqual(checkWidgetSources('/ext/src', baseEnv()).status, 'pass');
    });
    it('fails when the widgets directory is missing', () => {
        assert.strictEqual(checkWidgetSources('/ext/src', baseEnv({ exists: () => false })).status, 'fail');
    });
    it('fails when core descriptors are missing', () => {
        const r = checkWidgetSources('/ext/src', baseEnv({ listFiles: () => ['button.js'] }));
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.detail.includes('form'));
    });
    it('warns (not fails) when skipped', () => {
        assert.strictEqual(checkWidgetSources(undefined, baseEnv()).status, 'warn');
    });
});

describe('checkLegacySettingsFile', () => {
    it('passes on non-Windows without checking', () => {
        assert.strictEqual(checkLegacySettingsFile(baseEnv()).status, 'pass');
    });
    it('warns when a legacy file lingers on Windows', () => {
        const r = checkLegacySettingsFile(baseEnv({ platform: 'win32' }));
        assert.strictEqual(r.status, 'warn');
        assert.ok(r.remedy);
    });
    it('passes on Windows when no legacy file exists', () => {
        assert.strictEqual(checkLegacySettingsFile(baseEnv({ platform: 'win32', exists: () => false })).status, 'pass');
    });
    it('passes when the legacy path aliases the canonical file (junction)', () => {
        const env = baseEnv({
            platform: 'win32',
            settingsPath: 'C:\\Users\\r\\AppData\\Local\\Cabbage\\settings.json',
            legacySettingsPath: 'C:\\Users\\r\\Local Settings\\Application Data\\Cabbage\\settings.json',
            exists: () => true,
            realpath: (p: string) => p === 'C:\\Users\\r\\Local Settings\\Application Data\\Cabbage\\settings.json'
                ? 'C:\\Users\\r\\AppData\\Local\\Cabbage\\settings.json'
                : p,
        });
        const r = checkLegacySettingsFile(env);
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('junction alias'));
    });
    it('warns when the legacy file is genuinely distinct', () => {
        const env = baseEnv({
            platform: 'win32',
            exists: () => true,
            realpath: (p: string) => p,
        });
        assert.strictEqual(checkLegacySettingsFile(env).status, 'warn');
    });
    it('falls back to the existence check when realpath throws (missing file)', () => {
        const env = baseEnv({
            platform: 'win32',
            exists: () => false,
            realpath: () => { throw new Error('ENOENT'); },
        });
        assert.strictEqual(checkLegacySettingsFile(env).status, 'pass');
    });
});

describe('checkServiceBinary', () => {
    it('passes for the public binary', () => {
        const r = checkServiceBinary(baseEnv());
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('/ext/bin/CabbageApp'));
    });
    it('prefers the Pro binary when configured and enabled', () => {
        const env = baseEnv({ proServiceBinaryPath: '/pro/CabbageApp' });
        const r = checkServiceBinary(env);
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('Pro'));
    });
    it('falls back to the public binary when the Pro app is disabled', () => {
        const env = baseEnv({ proServiceBinaryPath: '/pro/CabbageApp', proAppEnabled: false });
        const r = checkServiceBinary(env);
        assert.strictEqual(r.status, 'pass');
        assert.ok(!r.detail.includes('Pro'));
    });
    it('fails with Pro-specific guidance when the Pro binary is missing', () => {
        const env = baseEnv({ proServiceBinaryPath: '/pro/CabbageApp', exists: () => false });
        const r = checkServiceBinary(env);
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.remedy && r.remedy.includes('pathToCabbageProBinary'));
    });
});

describe('checkCsoundPresent', () => {
    it('checks the framework bundle on macOS', () => {
        assert.strictEqual(checkCsoundPresent(baseEnv()).status, 'pass');
        const r = checkCsoundPresent(baseEnv({ exists: () => false }));
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.remedy);
    });
    it('accepts PATH as well as the default location on Windows', () => {
        const env = baseEnv({ platform: 'win32', exists: () => false, isOnPath: () => true });
        assert.strictEqual(checkCsoundPresent(env).status, 'pass');
    });
    it('accepts the csound7_64.dll name shipped by Csound 7.0.0 on Windows', () => {
        const env = baseEnv({
            platform: 'win32',
            exists: (p) => p === 'C:/Program Files/Csound7/bin/csound7_64.dll',
            isOnPath: () => false,
        });
        const r = checkCsoundPresent(env);
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('csound7_64.dll'));
    });
    it('fails on Windows when only the legacy csound64.dll is present', () => {
        const env = baseEnv({
            platform: 'win32',
            exists: (p) => p === 'C:/Program Files/Csound7/bin/csound64.dll',
            isOnPath: () => false,
        });
        const r = checkCsoundPresent(env);
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.detail.includes('csound64.dll'));
        assert.ok(r.detail.includes('csound7_64.dll'));
        assert.ok(r.remedy && r.remedy.includes('csound7_64.dll'));
    });
    it('fails on Windows when no Csound DLL is present', () => {
        const env = baseEnv({ platform: 'win32', exists: () => false, isOnPath: () => false });
        const r = checkCsoundPresent(env);
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.remedy);
    });
});

describe('checkServiceBinaryExecutable', () => {
    it('passes when the execute bit is set on macOS', () => {
        const r = checkServiceBinaryExecutable(baseEnv());
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('/ext/bin/CabbageApp'));
    });
    it('fails when the execute bit is missing, with a chmod remedy', () => {
        const r = checkServiceBinaryExecutable(baseEnv({ isExecutable: () => false }));
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.remedy && r.remedy.includes('chmod +x'));
    });
    it('checks the Pro binary when the Pro app is configured and enabled', () => {
        const seen: string[] = [];
        const env = baseEnv({
            proServiceBinaryPath: '/pro/CabbageApp',
            isExecutable: (p) => { seen.push(p); return true; },
        });
        const r = checkServiceBinaryExecutable(env);
        assert.strictEqual(r.status, 'pass');
        assert.deepStrictEqual(seen, ['/pro/CabbageApp']);
    });
    it('checks the public binary when the Pro app is disabled', () => {
        const seen: string[] = [];
        const env = baseEnv({
            proServiceBinaryPath: '/pro/CabbageApp',
            proAppEnabled: false,
            isExecutable: (p) => { seen.push(p); return true; },
        });
        const r = checkServiceBinaryExecutable(env);
        assert.strictEqual(r.status, 'pass');
        assert.deepStrictEqual(seen, ['/ext/bin/CabbageApp']);
    });
    it('skips (warn, not fail) when the binary is missing so checkServiceBinary owns that failure', () => {
        const r = checkServiceBinaryExecutable(baseEnv({ exists: () => false, isExecutable: () => false }));
        assert.strictEqual(r.status, 'warn');
    });
    it('skips (warn, not fail) when the binary path could not be resolved', () => {
        const r = checkServiceBinaryExecutable(baseEnv({ cabbageAppBinaryPath: '', isExecutable: () => false }));
        assert.strictEqual(r.status, 'warn');
    });
    it('passes without probing on Windows', () => {
        const r = checkServiceBinaryExecutable(baseEnv({
            platform: 'win32',
            isExecutable: () => { throw new Error('should not be called'); },
        }));
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('Not applicable'));
    });
    it('warns (not crashes) when the stat throws', () => {
        const r = checkServiceBinaryExecutable(baseEnv({ isExecutable: () => { throw new Error('EACCES'); } }));
        assert.strictEqual(r.status, 'warn');
        assert.ok(r.detail.includes('EACCES'));
    });
});

describe('checkServiceBinaryArch', () => {
    it('passes when the binary arch matches the host', () => {
        const r = checkServiceBinaryArch(baseEnv({ hostArch: 'x64', readBinaryArch: () => 'x64' }));
        assert.strictEqual(r.status, 'pass');
    });
    it('fails with an install remedy on an arm64 binary on an x64 host', () => {
        const r = checkServiceBinaryArch(baseEnv({ hostArch: 'x64', readBinaryArch: () => 'arm64' }));
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.remedy && r.remedy.toLowerCase().includes('install the x64 package'));
    });
    it('warns (not fails) when the binary is missing so checkServiceBinary owns that failure', () => {
        const r = checkServiceBinaryArch(baseEnv({ exists: () => false, readBinaryArch: () => 'arm64' }));
        assert.strictEqual(r.status, 'warn');
    });
    it('warns (not fails) when the architecture cannot be determined', () => {
        const r = checkServiceBinaryArch(baseEnv({ readBinaryArch: () => 'unknown' }));
        assert.strictEqual(r.status, 'warn');
    });
    it('checks the Pro binary when the Pro app is configured and enabled', () => {
        const seen: string[] = [];
        const env = baseEnv({
            proServiceBinaryPath: '/pro/CabbageApp',
            readBinaryArch: (p) => { seen.push(p); return 'x64'; },
        });
        checkServiceBinaryArch(env);
        assert.deepStrictEqual(seen, ['/pro/CabbageApp']);
    });
});

describe('checkServiceBinaryGlibc', () => {
    it('passes on non-Linux platforms without probing', () => {
        const r = checkServiceBinaryGlibc(baseEnv());
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('Not applicable'));
    });
    it('passes when the binary needs an older glibc than the host', () => {
        const r = checkServiceBinaryGlibc(baseEnv({
            platform: 'linux',
            hostGlibcVersion: '2.39',
            readGlibcRequirements: () => ['2.2.5', '2.34'],
        }));
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('2.34'));
        assert.ok(r.detail.includes('2.39'));
    });
    it('fails when the binary needs a newer glibc than the host', () => {
        const r = checkServiceBinaryGlibc(baseEnv({
            platform: 'linux',
            hostGlibcVersion: '2.39',
            readGlibcRequirements: () => ['2.2.5', '2.43'],
        }));
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.detail.includes('2.43'));
        assert.ok(r.detail.includes('2.39'));
        assert.ok(r.remedy && r.remedy.includes('GLIBC_2.43'));
    });
    it('warns when the host glibc version cannot be determined', () => {
        const r = checkServiceBinaryGlibc(baseEnv({
            platform: 'linux',
            hostGlibcVersion: undefined,
            readGlibcRequirements: () => ['2.43'],
        }));
        assert.strictEqual(r.status, 'warn');
        assert.ok(r.detail.includes('glibc version'));
    });
    it('warns when the binary is missing so checkServiceBinary owns that failure', () => {
        const r = checkServiceBinaryGlibc(baseEnv({ platform: 'linux', exists: () => false }));
        assert.strictEqual(r.status, 'warn');
    });
    it('warns when the ELF requirements cannot be read', () => {
        const r = checkServiceBinaryGlibc(baseEnv({
            platform: 'linux',
            hostGlibcVersion: '2.39',
            readGlibcRequirements: () => undefined,
        }));
        assert.strictEqual(r.status, 'warn');
        assert.ok(r.detail.includes('Could not read'));
    });
    it('passes for a binary without glibc requirements (static/musl)', () => {
        const r = checkServiceBinaryGlibc(baseEnv({
            platform: 'linux',
            hostGlibcVersion: '2.39',
            readGlibcRequirements: () => [],
        }));
        assert.strictEqual(r.status, 'pass');
    });
    it('checks the Pro binary when the Pro app is configured and enabled', () => {
        const seen: string[] = [];
        const env = baseEnv({
            platform: 'linux',
            hostGlibcVersion: '2.39',
            proServiceBinaryPath: '/pro/CabbageApp',
            readGlibcRequirements: (p) => { seen.push(p); return ['2.34']; },
        });
        checkServiceBinaryGlibc(env);
        assert.deepStrictEqual(seen, ['/pro/CabbageApp']);
    });
});

describe('checkPluginBinaries', () => {
    it('passes for a single-file plugin with a compatible architecture', () => {
        const r = checkPluginBinaries(baseEnv());
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('CabbagePluginEffect.vst3'));
    });

    it('fails when a required plugin is missing', () => {
        const r = checkPluginBinaries(baseEnv({ exists: () => false }));
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.detail.includes('not found'));
        assert.ok(r.remedy && r.remedy.toLowerCase().includes('reinstall'));
    });

    it('warns when only an optional plugin is missing', () => {
        const env = baseEnv({
            pluginBinaries: [{ type: 'AUv2 effect', path: '/ext/bin/CabbagePluginEffectAUv2.component', required: false }],
            exists: () => false,
        });
        const r = checkPluginBinaries(env);
        assert.strictEqual(r.status, 'warn');
        assert.ok(r.remedy);
    });

    it('finds the Linux bundle binary under Contents/<arch>-linux', () => {
        const bundle = '/ext/bin/CabbagePluginEffect.vst3';
        const contents = `${bundle}/Contents`;
        const archDir = `${contents}/x86_64-linux`;
        const env = baseEnv({
            platform: 'linux',
            pluginBinaries: [{ type: 'VST3 effect', path: bundle, required: true }],
            exists: (p) => p === bundle || p === contents || p === archDir,
            isDirectory: (p) => p === bundle || p === contents || p === archDir,
            listDirectories: (dir) => dir === contents ? ['Resources', 'x86_64-linux'] : [],
            listFiles: (dir) => dir === archDir ? ['CabbagePluginEffect.so'] : [],
        });
        const r = checkPluginBinaries(env);
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('x86_64-linux/CabbagePluginEffect.so'));
    });

    it('fails when a Linux bundle has no architecture directory', () => {
        const bundle = '/ext/bin/CabbagePluginEffect.vst3';
        const contents = `${bundle}/Contents`;
        const env = baseEnv({
            platform: 'linux',
            pluginBinaries: [{ type: 'VST3 effect', path: bundle, required: true }],
            exists: (p) => p === bundle || p === contents,
            isDirectory: (p) => p === bundle || p === contents,
            listDirectories: (dir) => dir === contents ? ['Resources'] : [],
            listFiles: () => [],
        });
        const r = checkPluginBinaries(env);
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.detail.includes('no Contents/<arch>-linux directory'));
    });

    it('fails when a Linux bundle has no shared library', () => {
        const bundle = '/ext/bin/CabbagePluginEffect.vst3';
        const contents = `${bundle}/Contents`;
        const archDir = `${contents}/x86_64-linux`;
        const env = baseEnv({
            platform: 'linux',
            pluginBinaries: [{ type: 'VST3 effect', path: bundle, required: true }],
            exists: (p) => p === bundle || p === contents || p === archDir,
            isDirectory: (p) => p === bundle || p === contents || p === archDir,
            listDirectories: (dir) => dir === contents ? ['x86_64-linux'] : [],
            listFiles: (dir) => dir === archDir ? ['README.txt'] : [],
        });
        const r = checkPluginBinaries(env);
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.detail.includes('no .so found'));
    });

    it('resolves the executable inside a macOS bundle', () => {
        const bundle = '/ext/bin/CabbagePluginEffect.vst3';
        const contents = `${bundle}/Contents`;
        const macosDir = `${contents}/MacOS`;
        const env = baseEnv({
            platform: 'darwin',
            pluginBinaries: [{ type: 'VST3 effect', path: bundle, required: true }],
            exists: (p) => p === bundle || p === macosDir,
            isDirectory: (p) => p === bundle || p === contents || p === macosDir,
            listDirectories: (dir) => dir === contents ? ['MacOS', 'Resources'] : [],
            listFiles: (dir) => dir === macosDir ? ['CabbagePluginEffect'] : [],
        });
        const r = checkPluginBinaries(env);
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('Contents/MacOS/CabbagePluginEffect'));
    });

    it('resolves a legacy Windows bundle binary', () => {
        const bundle = '/ext/bin/CabbagePluginEffect.vst3';
        const contents = `${bundle}/Contents`;
        const winDir = `${contents}/x86_64-win`;
        const releaseDir = `${winDir}/Release`;
        const env = baseEnv({
            platform: 'win32',
            pluginBinaries: [{ type: 'VST3 effect', path: bundle, required: true }],
            exists: (p) => p === bundle || p === contents || p === releaseDir,
            isDirectory: (p) => p === bundle || p === contents || p === winDir || p === releaseDir,
            listDirectories: (dir) => dir === contents ? ['x86_64-win'] : [],
            listFiles: (dir) => dir === releaseDir ? ['CabbagePluginEffect.vst3'] : [],
        });
        const r = checkPluginBinaries(env);
        assert.strictEqual(r.status, 'pass');
        assert.ok(r.detail.includes('x86_64-win/Release/CabbagePluginEffect.vst3'));
    });

    it('fails when the binary architecture is incompatible', () => {
        const r = checkPluginBinaries(baseEnv({ hostArch: 'x64', readBinaryArch: () => 'arm64' }));
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.detail.includes('arm64'));
    });

    it('warns when the binary architecture cannot be determined', () => {
        const r = checkPluginBinaries(baseEnv({ readBinaryArch: () => 'unknown' }));
        assert.strictEqual(r.status, 'warn');
        assert.ok(r.detail.includes('could not determine architecture'));
    });

    it('fails a required plugin that needs a newer glibc than the host', () => {
        const r = checkPluginBinaries(baseEnv({
            platform: 'linux',
            hostGlibcVersion: '2.39',
            readGlibcRequirements: () => ['2.43'],
        }));
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.detail.includes('requires glibc 2.43'));
        assert.ok(r.remedy && r.remedy.includes('Ubuntu 22.04'));
    });

    it('warns when only an optional plugin needs a newer glibc', () => {
        const r = checkPluginBinaries(baseEnv({
            platform: 'linux',
            hostGlibcVersion: '2.39',
            pluginBinaries: [{ type: 'AUv2 effect', path: '/ext/bin/CabbagePluginEffectAUv2.component', required: false }],
            readGlibcRequirements: () => ['2.43'],
        }));
        assert.strictEqual(r.status, 'warn');
        assert.ok(r.detail.includes('requires glibc 2.43'));
    });

    it('passes plugins that target the host glibc or older', () => {
        const r = checkPluginBinaries(baseEnv({
            platform: 'linux',
            hostGlibcVersion: '2.39',
            readGlibcRequirements: () => ['2.2.5', '2.34'],
        }));
        assert.strictEqual(r.status, 'pass');
    });

    it('warns when no plugin binaries are configured', () => {
        const r = checkPluginBinaries(baseEnv({ pluginBinaries: [] }));
        assert.strictEqual(r.status, 'warn');
    });

    it('does not throw when bundle listing fails', () => {
        const bundle = '/ext/bin/CabbagePluginEffect.vst3';
        const contents = `${bundle}/Contents`;
        const env = baseEnv({
            platform: 'linux',
            pluginBinaries: [{ type: 'VST3 effect', path: bundle, required: true }],
            exists: (p) => p === bundle || p === contents,
            isDirectory: () => true,
            listDirectories: () => { throw new Error('EACCES'); },
            listFiles: () => { throw new Error('EACCES'); },
        });
        const r = checkPluginBinaries(env);
        assert.strictEqual(r.status, 'fail');
        assert.ok(r.detail.includes('no Contents/<arch>-linux directory'));
    });

    it('returns a single-file plugin path directly', () => {
        const resolved = resolvePluginBundleBinary('/ext/bin/CabbagePluginEffect.clap', baseEnv());
        assert.strictEqual(resolved.binaryPath, '/ext/bin/CabbagePluginEffect.clap');
    });
});

describe('runAllChecks', () => {
    it('returns 11 results and never throws on hostile inputs', () => {
        const env = baseEnv({
            settingsFileText: '{broken',
            exists: () => { throw new Error('fs boom'); },
            listFiles: () => { throw new Error('ls boom'); },
            isExecutable: () => { throw new Error('stat boom'); },
        });
        const results = runAllChecks(env);
        assert.strictEqual(results.length, 11);
        assert.ok(results.every((r) => r.id && r.label && r.detail));
    });
    it('a healthy env produces zero fails and warns', () => {
        const { fails, warns } = summarize(runAllChecks(baseEnv()));
        assert.strictEqual(fails, 0);
        assert.strictEqual(warns, 0);
    });
    it('a stale primary is surfaced by name in the formatted report', () => {
        const env = baseEnv({
            settingsFileText: JSON.stringify({ currentConfig: { jsSourceDir: ['/old/ext/src'] } }),
        });
        const report = formatReport(runAllChecks(env));
        assert.ok(report.includes('✗'));
        assert.ok(report.includes('Unknown widget type'));
    });
});
