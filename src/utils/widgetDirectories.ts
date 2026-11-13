import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Dependency hooks so the path helpers can be unit tested without touching the
 * real filesystem/OS. Production callers pass nothing and get the real values.
 */
export interface WidgetPathEnv {
    platform?: string;
    homedir?: string;
    env?: Record<string, string | undefined>;
    isDirectory?: (candidate: string) => boolean;
}

function defaultIsDirectory(candidate: string): boolean {
    try {
        return fs.statSync(candidate).isDirectory();
    } catch {
        return false;
    }
}

function resolver(env: WidgetPathEnv) {
    return {
        platform: env.platform ?? process.platform,
        homedir: env.homedir ?? os.homedir(),
        variables: env.env ?? process.env,
        isDirectory: env.isDirectory ?? defaultIsDirectory,
    };
}

/**
 * Expands a user-provided path: trims whitespace, expands a leading `~`, then
 * `${VAR}` / `$VAR` (and `%VAR%` on Windows) environment variables, before
 * normalizing separators and trailing slashes.
 */
export function expandUserPath(input: string, env: WidgetPathEnv = {}): string {
    if (!input || typeof input !== 'string') { return ''; }
    const { platform, homedir, variables } = resolver(env);
    let out = input.trim();
    if (out.startsWith('~')) {
        out = path.join(homedir, out.slice(1));
    }
    out = out.replace(/\$\{([^}]+)\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_m, braced: string, plain: string) => {
        const name = braced || plain;
        return variables[name] ?? '';
    });
    if (platform === 'win32') {
        out = out.replace(/%([^%]+)%/g, (_m, name: string) => variables[name] ?? '');
    }
    return path.normalize(out);
}

/**
 * Normalizes a directory for comparison: expanded, normalized, no trailing
 * separator, and case-folded on Windows/macOS.
 */
export function normalizeDirForCompare(input: string, env: WidgetPathEnv = {}): string {
    const { platform } = resolver(env);
    let normalized = expandUserPath(input, env);
    if (normalized.length > 1 && (normalized.endsWith(path.sep) || normalized.endsWith('/'))) {
        normalized = normalized.replace(/[/\\]+$/, '');
    }
    if (platform === 'win32' || platform === 'darwin') {
        normalized = normalized.toLowerCase();
    }
    return normalized;
}

/**
 * Resolves a user-configured custom widget location to the actual `widgets`
 * directories that should be scanned. Accepts a root containing
 * `cabbage/widgets`, a root containing `widgets`, the `cabbage` folder itself,
 * or the `widgets` folder itself. Returns existing directories only.
 */
export function resolveWidgetDirectoriesForRoot(raw: string, env: WidgetPathEnv = {}): string[] {
    const { isDirectory } = resolver(env);
    const expanded = expandUserPath(raw, env);
    if (!expanded) { return []; }

    const seen = new Set<string>();
    const out: string[] = [];
    const pushIfDir = (candidate: string) => {
        const normalized = path.normalize(candidate);
        if (!seen.has(normalized) && isDirectory(normalized)) {
            seen.add(normalized);
            out.push(normalized);
        }
    };

    // Direct hits: the user pointed straight at a widgets dir.
    const base = path.basename(expanded);
    if (base === 'widgets' && isDirectory(expanded)) {
        pushIfDir(expanded);
        return out;
    }
    if (/(cabbage[\\/]widgets|widgets)$/.test(expanded) && isDirectory(expanded)) {
        pushIfDir(expanded);
        return out;
    }

    // Otherwise treat it as a root / cabbage dir and probe known layouts.
    // Order matters: canonical layout first, then plugin-style fallbacks.
    const canonicalWidgets = path.join(expanded, 'cabbage', 'widgets');
    const pluginWidgets = path.join(expanded, 'widgets');
    const hasCanonicalWidgets = isDirectory(canonicalWidgets);
    const hasPluginWidgets = isDirectory(pluginWidgets);
    pushIfDir(canonicalWidgets);
    pushIfDir(pluginWidgets);
    // Bare-dir fallback: the configured folder itself holds .js widgets. Only
    // used when the folder is not a root wrapping a widgets dir, otherwise a
    // recursive scan would walk unrelated framework files.
    if (!hasCanonicalWidgets && !hasPluginWidgets) {
        pushIfDir(expanded);
    }

    return out;
}

/**
 * Normalizes a folder chosen in the "Select Custom Widget Folder" dialog to the
 * root custom folder (the folder that should contain `cabbage/`). Idempotent:
 * picking the `cabbage` dir, its `widgets` subdir, or an already-configured
 * root all resolve to the same root instead of nesting `cabbage/cabbage`.
 */
export function normalizeCustomWidgetRoot(selected: string, env: WidgetPathEnv = {}): string {
    const { isDirectory } = resolver(env);
    const expanded = expandUserPath(selected, env);
    if (!expanded) { return ''; }

    // Picked .../cabbage/widgets -> root is two levels up.
    if (/cabbage[\\/]widgets$/.test(expanded)) {
        return path.normalize(path.dirname(path.dirname(expanded)));
    }
    const base = path.basename(expanded);
    if (base === 'widgets') {
        const parent = path.dirname(expanded);
        // .../cabbage/widgets -> root is the parent of `cabbage`.
        if (path.basename(parent) === 'cabbage') {
            return path.normalize(path.dirname(parent));
        }
        return path.normalize(parent);
    }
    if (base === 'cabbage') {
        // Already a root containing cabbage/: keep it. A lone `cabbage` dir
        // holding `widgets/` directly is the framework dir: root is its parent.
        const hasNestedCabbage = isDirectory(path.join(expanded, 'cabbage'));
        const hasWidgets = isDirectory(path.join(expanded, 'widgets'));
        if (hasNestedCabbage || !hasWidgets) {
            return path.normalize(expanded);
        }
        return path.normalize(path.dirname(expanded));
    }
    // Generic root (may already contain cabbage/): keep as-is.
    return path.normalize(expanded);
}
