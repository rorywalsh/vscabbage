import path from 'path';

/**
 * Returns the root CabbageAudio directory used for plugin resources on the
 * given platform.
 *
 * Plugin resources are intentionally stored outside the plugin bundle on every
 * platform, so this must stay in sync with the backend's
 * `cabbage::File::getCabbageResourceDir()`.
 */
export function getCabbageResourcePath(
    platform: NodeJS.Platform,
    homeDir: string,
    programData: string | undefined,
): string {
    if (platform === 'win32') {
        const data = typeof programData === 'string' ? programData.trim() : '';
        return path.win32.join(data !== '' ? data : 'C:\\ProgramData', 'CabbageAudio');
    }

    const base = platform === 'darwin'
        ? path.posix.join(homeDir, 'Library')
        : path.posix.join(homeDir, '.config');

    return path.posix.join(base, 'CabbageAudio');
}
