// Unit tests for the report-only installation validation probes.
// Run with: npm run test:unit (plain mocha, no VS Code instance needed).
import assert from 'assert';
import {
    normalizeSourceDirs,
    checkCsoundPresent,
    checkServiceBinary,
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
        const r = checkLegacySettingsFile(baseEnv({ platform: 'win32', exists: () => false }));
        assert.strictEqual(r.status, 'pass');
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
});

describe('runAllChecks', () => {
    it('returns 7 results and never throws on hostile inputs', () => {
        const env = baseEnv({
            settingsFileText: '{broken',
            exists: () => { throw new Error('fs boom'); },
            listFiles: () => { throw new Error('ls boom'); },
        });
        const results = runAllChecks(env);
        assert.strictEqual(results.length, 7);
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
