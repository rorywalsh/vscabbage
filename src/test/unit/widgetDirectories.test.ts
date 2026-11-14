// Unit tests for the pure custom-widget path helpers.
// Run with: npm run test:unit
import assert from 'assert';
import path from 'path';
import {
    expandUserPath,
    normalizeCustomWidgetRoot,
    normalizeDirForCompare,
    resolveWidgetDirectoriesForRoot,
    WidgetPathEnv,
} from '../../utils/widgetDirectories';

const posixEnv: WidgetPathEnv = {
    platform: 'linux',
    homedir: '/home/user',
    env: {},
};

function dirSet(...dirs: string[]): (candidate: string) => boolean {
    const existing = new Set(dirs.map((dir) => path.normalize(dir)));
    return (candidate) => existing.has(path.normalize(candidate));
}

describe('expandUserPath', () => {
    it('returns an empty string for missing or non-string input', () => {
        assert.strictEqual(expandUserPath('' as any, posixEnv), '');
        assert.strictEqual(expandUserPath(undefined as any, posixEnv), '');
    });

    it('trims whitespace and expands a leading tilde', () => {
        assert.strictEqual(
            expandUserPath('  ~/widgets  ', posixEnv),
            path.normalize('/home/user/widgets'),
        );
    });

    it('expands $VAR and ${VAR} environment variables', () => {
        const env: WidgetPathEnv = { ...posixEnv, env: { WIDGETS: '/opt/widgets' } };

        assert.strictEqual(expandUserPath('$WIDGETS/x', env), path.normalize('/opt/widgets/x'));
        assert.strictEqual(expandUserPath('${WIDGETS}/x', env), path.normalize('/opt/widgets/x'));
    });

    it('expands %VAR% only on Windows', () => {
        const env = { env: { WIDGETS: 'C:/widgets' } };

        assert.strictEqual(
            expandUserPath('%WIDGETS%/x', { ...env, platform: 'win32' }),
            path.normalize('C:/widgets/x'),
        );
        assert.strictEqual(
            expandUserPath('%WIDGETS%/x', { ...env, platform: 'linux' }),
            path.normalize('%WIDGETS%/x'),
        );
    });
});

describe('normalizeDirForCompare', () => {
    it('strips trailing separators', () => {
        assert.strictEqual(normalizeDirForCompare('/opt/widgets/', posixEnv), '/opt/widgets');
    });

    it('case-folds on Windows/macOS but not Linux', () => {
        assert.strictEqual(
            normalizeDirForCompare('/Opt/Widgets', { ...posixEnv, platform: 'darwin' }),
            '/opt/widgets',
        );
        assert.strictEqual(normalizeDirForCompare('/Opt/Widgets', posixEnv), '/Opt/Widgets');
    });
});

describe('resolveWidgetDirectoriesForRoot', () => {
    it('returns [] for an empty path', () => {
        assert.deepStrictEqual(resolveWidgetDirectoriesForRoot('', posixEnv), []);
    });

    it('resolves the canonical root/cabbage/widgets layout', () => {
        const root = '/assets';
        const widgets = path.join(root, 'cabbage', 'widgets');

        assert.deepStrictEqual(
            resolveWidgetDirectoriesForRoot(root, { ...posixEnv, isDirectory: dirSet(widgets) }),
            [widgets],
        );
    });

    it('resolves a plugin-style root/widgets layout', () => {
        const root = '/assets';
        const widgets = path.join(root, 'widgets');

        assert.deepStrictEqual(
            resolveWidgetDirectoriesForRoot(root, { ...posixEnv, isDirectory: dirSet(widgets) }),
            [widgets],
        );
    });

    it('returns canonical then plugin widgets when both exist', () => {
        const root = '/assets';
        const canonical = path.join(root, 'cabbage', 'widgets');
        const plugin = path.join(root, 'widgets');

        assert.deepStrictEqual(
            resolveWidgetDirectoriesForRoot(root, { ...posixEnv, isDirectory: dirSet(canonical, plugin) }),
            [canonical, plugin],
        );
    });

    it('accepts a widgets directory directly', () => {
        const widgets = '/assets/cabbage/widgets';

        assert.deepStrictEqual(
            resolveWidgetDirectoriesForRoot(widgets, { ...posixEnv, isDirectory: dirSet(widgets) }),
            [widgets],
        );
    });

    it('falls back to the folder itself when it is not a root wrapper', () => {
        assert.deepStrictEqual(
            resolveWidgetDirectoriesForRoot('/loose', { ...posixEnv, isDirectory: dirSet('/loose') }),
            ['/loose'],
        );
    });

    it('returns [] when nothing exists on disk', () => {
        assert.deepStrictEqual(
            resolveWidgetDirectoriesForRoot('/gone', { ...posixEnv, isDirectory: () => false }),
            [],
        );
    });
});

describe('normalizeCustomWidgetRoot', () => {
    it('maps .../cabbage/widgets to the root two levels up', () => {
        assert.strictEqual(
            normalizeCustomWidgetRoot('/work/assets/cabbage/widgets', posixEnv),
            path.normalize('/work/assets'),
        );
    });

    it('maps a standalone widgets directory to its parent', () => {
        assert.strictEqual(
            normalizeCustomWidgetRoot('/work/widgets', posixEnv),
            path.normalize('/work'),
        );
    });

    it('keeps a root that already contains a cabbage directory', () => {
        assert.strictEqual(
            normalizeCustomWidgetRoot('/work/assets', {
                ...posixEnv,
                isDirectory: dirSet('/work/assets/cabbage'),
            }),
            path.normalize('/work/assets'),
        );
    });

    it('treats a lone cabbage directory holding widgets as the framework dir', () => {
        assert.strictEqual(
            normalizeCustomWidgetRoot('/work/cabbage', {
                ...posixEnv,
                isDirectory: dirSet('/work/cabbage/widgets'),
            }),
            path.normalize('/work'),
        );
    });

    it('keeps a lone cabbage directory without widgets', () => {
        assert.strictEqual(
            normalizeCustomWidgetRoot('/work/cabbage', { ...posixEnv, isDirectory: () => false }),
            path.normalize('/work/cabbage'),
        );
    });
});
