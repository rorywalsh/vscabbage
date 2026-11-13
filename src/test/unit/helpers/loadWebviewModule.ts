// Test harness for the webview's plain-ESM JavaScript modules.
//
// The webview sources use `import`/`export` and browser globals, so they cannot
// be `require`d directly from the CommonJS mocha suite. esbuild bundles the
// requested entry point to CommonJS (with configurable stubs for its webview
// dependencies) and jsdom supplies the browser globals.
import * as esbuild from 'esbuild';
import * as path from 'path';
import { JSDOM } from 'jsdom';

/** Repository root, resolved from the compiled helper location (out/test/unit/helpers). */
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..', '..');

function defineGlobal(name: string, value: unknown): void {
    try {
        Object.defineProperty(global, name, {
            value,
            configurable: true,
            writable: true,
        });
    } catch {
        // A non-configurable global (e.g. Node's own `navigator`) can be left alone.
    }
}

/**
 * Installs a minimal DOM on the Node globals so webview helpers that query
 * `document` / `window` can run under mocha. Returns the JSDOM instance.
 */
export function installDom(bodyHtml = '<div id="MainForm"></div>'): JSDOM {
    const dom = new JSDOM(`<!doctype html><html><body>${bodyHtml}</body></html>`, {
        pretendToBeVisual: true,
    });
    const win = dom.window as any;

    defineGlobal('window', win);
    defineGlobal('document', win.document);
    defineGlobal('HTMLElement', win.HTMLElement);
    defineGlobal('HTMLCanvasElement', win.HTMLCanvasElement);
    defineGlobal('Element', win.Element);
    defineGlobal('Node', win.Node);
    defineGlobal('Event', win.Event);
    defineGlobal('CustomEvent', win.CustomEvent);
    defineGlobal('MouseEvent', win.MouseEvent);
    defineGlobal('getComputedStyle', win.getComputedStyle?.bind(win));

    return dom;
}

export interface LoadWebviewModuleOptions {
    /**
     * Map of exact import specifier (as written in the source) to replacement
     * ESM source. Used to stub the webview's DOM-heavy dependency graph.
     */
    stubs?: Record<string, string>;
}

/**
 * Bundles a webview module to CommonJS and evaluates it, returning its exports.
 * `entry` is relative to the repository root (e.g. `src/cabbage/utils.js`).
 */
export async function loadWebviewModule(entry: string, options: LoadWebviewModuleOptions = {}): Promise<any> {
    const stubs = options.stubs ?? {};
    const entryPoint = path.isAbsolute(entry) ? entry : path.join(REPO_ROOT, entry);
    const result = await esbuild.build({
        entryPoints: [entryPoint],
        bundle: true,
        write: false,
        format: 'cjs',
        platform: 'node',
        target: 'node20',
        logLevel: 'silent',
        plugins: [{
            name: 'webview-stubs',
            setup(build) {
                build.onResolve({ filter: /.*/ }, (args) => {
                    if (Object.prototype.hasOwnProperty.call(stubs, args.path)) {
                        return { path: args.path, namespace: 'webview-stub' };
                    }
                    return undefined;
                });
                build.onLoad({ filter: /.*/, namespace: 'webview-stub' }, (args) => ({
                    contents: stubs[args.path],
                    loader: 'js',
                }));
            },
        }],
    });

    const output = result.outputFiles?.[0]?.text;
    if (!output) {
        throw new Error(`esbuild produced no output for ${entryPoint}`);
    }

    const module = { exports: {} as any };
    // eslint-disable-next-line no-new-func
    const evaluate = new Function('module', 'exports', 'require', '__filename', '__dirname', output);
    evaluate(module, module.exports, require, entryPoint, path.dirname(entryPoint));
    return module.exports;
}
