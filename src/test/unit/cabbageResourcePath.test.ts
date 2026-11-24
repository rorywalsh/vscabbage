// Unit tests for the resource root used by exported plugins.
// Run with: npm run test:unit (plain mocha, no VS Code instance needed).
import assert from 'assert';
import path from 'path';
import { getCabbageResourcePath } from '../../cabbageResourcePath';

describe('getCabbageResourcePath', () => {
    it('uses ~/Library/CabbageAudio on macOS', () => {
        assert.strictEqual(
            getCabbageResourcePath('darwin', '/Users/me', undefined),
            path.posix.join('/Users/me', 'Library', 'CabbageAudio'));
    });

    it('uses ~/.config/CabbageAudio on Linux', () => {
        // Regression test: this used to be ~/.CabbageAudio, which the backend
        // never reads, so exported Linux plugins could not find their UI/CSD.
        assert.strictEqual(
            getCabbageResourcePath('linux', '/home/me', undefined),
            path.posix.join('/home/me', '.config', 'CabbageAudio'));
    });

    it('uses PROGRAMDATA on Windows', () => {
        assert.strictEqual(
            getCabbageResourcePath('win32', 'C:\\Users\\me', 'D:\\ProgramData'),
            path.win32.join('D:\\ProgramData', 'CabbageAudio'));
    });

    it('falls back to C:\\ProgramData on Windows when PROGRAMDATA is missing', () => {
        assert.strictEqual(
            getCabbageResourcePath('win32', 'C:\\Users\\me', undefined),
            path.win32.join('C:\\ProgramData', 'CabbageAudio'));
        assert.strictEqual(
            getCabbageResourcePath('win32', 'C:\\Users\\me', '   '),
            path.win32.join('C:\\ProgramData', 'CabbageAudio'));
    });
});
