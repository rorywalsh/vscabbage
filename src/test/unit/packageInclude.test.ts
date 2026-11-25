// Unit tests for package.include path resolution.
// Run with: npm run test:unit (plain mocha, no VS Code instance needed).
import assert from 'assert';
import * as path from 'path';
import { normalizePackageIncludeEntry, packageIncludeBase } from '../../utils/packageInclude';

describe('packageIncludeBase', () => {
    it('keeps the file name when src is a single file', () => {
        const src = '/Users/me/cabbage3-recipes/samples/test.jpeg';
        const base = packageIncludeBase(src, false);
        assert.strictEqual(base, '/Users/me/cabbage3-recipes/samples');
        assert.strictEqual(path.relative(base, src), 'test.jpeg');
    });

    it('copies a single file into the dest folder instead of overwriting it', () => {
        const destDir = '/tmp/exported-plugin';
        const src = '/Users/me/cabbage3-recipes/samples/test.jpeg';
        const dest = 'media';
        const base = packageIncludeBase(src, false);
        const destFile = path.join(destDir, dest, path.relative(base, src));
        assert.strictEqual(destFile, path.join(destDir, 'media', 'test.jpeg'));
    });

    it('uses the directory itself as the base for directory sources', () => {
        const src = '/Users/me/cabbage3-recipes/samples';
        const base = packageIncludeBase(src, true);
        assert.strictEqual(base, src);
        assert.strictEqual(path.relative(base, path.join(src, 'nested', 'loop.wav')), path.join('nested', 'loop.wav'));
    });

    it('uses the containing directory for wildcard patterns', () => {
        assert.strictEqual(packageIncludeBase('/samples/*.wav', false), '/samples');
        assert.strictEqual(packageIncludeBase('/samples/**/*.wav', false), '/samples');
    });

    it('does not treat a partial file name as the base', () => {
        // A naive split on "*" would yield "/samples/loop" here.
        assert.strictEqual(packageIncludeBase('/samples/loop*.wav', false), '/samples');
    });

    it('handles a wildcard at the filesystem root', () => {
        assert.strictEqual(packageIncludeBase('/*.wav', false), path.parse('/').root);
    });
});

describe('normalizePackageIncludeEntry', () => {
    it('accepts an entry with src and dest', () => {
        assert.deepStrictEqual(
            normalizePackageIncludeEntry({ src: 'samples', dest: 'audioSamples' }),
            { ok: true, entry: { src: 'samples', dest: 'audioSamples' } },
        );
    });

    it('defaults dest to the resources root when omitted', () => {
        assert.deepStrictEqual(
            normalizePackageIncludeEntry({ src: 'samples' }),
            { ok: true, entry: { src: 'samples', dest: '' } },
        );
        assert.deepStrictEqual(
            normalizePackageIncludeEntry({ src: 'samples', dest: null }),
            { ok: true, entry: { src: 'samples', dest: '' } },
        );
    });

    it('rejects entries without a usable src', () => {
        assert.strictEqual(normalizePackageIncludeEntry(null).ok, false);
        assert.strictEqual(normalizePackageIncludeEntry([]).ok, false);
        assert.strictEqual(normalizePackageIncludeEntry({ dest: 'media' }).ok, false);
        assert.strictEqual(normalizePackageIncludeEntry({ src: '', dest: 'media' }).ok, false);
        assert.strictEqual(normalizePackageIncludeEntry({ src: 42, dest: 'media' }).ok, false);
    });

    it('rejects non-string dest values', () => {
        assert.strictEqual(normalizePackageIncludeEntry({ src: 'samples', dest: 1 }).ok, false);
    });

    it('reports absolute dest paths as fatal', () => {
        const result = normalizePackageIncludeEntry({ src: 'samples', dest: '/tmp/media' });
        assert.deepStrictEqual(result, { ok: false, error: 'absolute-dest', dest: '/tmp/media' });
    });
});
