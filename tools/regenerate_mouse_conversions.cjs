#!/usr/bin/env node
'use strict';

/**
 * Regenerate the Cabbage 3 conversions for every Cabbage 2 example that reads
 * the reserved MOUSE_* channels, using the (updated) `cabbage2converter.ts`
 * so the mouse channels are auto-converted into a transparent image overlay.
 *
 * The converter is the single source of truth: this script compiles it to a
 * temp dir and drives it over the corpus. It refuses to overwrite a file when
 * the non-mouse widgets would change (i.e. the existing conversion has manual
 * edits that a re-run would clobber) — those files are reported and skipped.
 *
 * Usage:
 *   node tools/regenerate_mouse_conversions.cjs            # write
 *   node tools/regenerate_mouse_conversions.cjs --dry-run  # report only
 *
 * Env overrides:
 *   SRC_DIR   source Cabbage 2 corpus (default IainsCabbageExamples)
 *   OUT_DIR   destination Cabbage 3 corpus (default IainsCabbageExamples_Cabbage3)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

const DRY_RUN = process.argv.includes('--dry-run');

const REPO = path.resolve(__dirname, '..');
const SRC_DIR = process.env.SRC_DIR || '/Users/rorywalsh/sourcecode/IainsCabbageExamples';
const OUT_DIR = process.env.OUT_DIR || '/Users/rorywalsh/sourcecode/IainsCabbageExamples_Cabbage3';

// ---------------------------------------------------------------------------
// Compile the converter (single source of truth for the migration logic).
// ---------------------------------------------------------------------------
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'c2conv-'));
const tsc = path.join(REPO, 'node_modules', '.bin', 'tsc');
const convSrc = path.join(REPO, 'src', 'utils', 'cabbage2converter.ts');
try {
    execSync(
        `${JSON.stringify(tsc)} ${JSON.stringify(convSrc)} --outDir ${JSON.stringify(tmp)} ` +
        '--module node16 --target es2022 --moduleResolution node16 --skipLibCheck --esModuleInterop --ignoreConfig',
        { stdio: 'pipe' },
    );
} catch (e) {
    console.error('Failed to compile cabbage2converter.ts:', e.message);
    process.exit(1);
}
const { convertCabbage2ToCabbage3 } = require(path.join(tmp, 'cabbage2converter.js'));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function cabbageJson(text) {
    const m = text.match(/<Cabbage>([\s\S]*?)<\/Cabbage>/);
    return m ? JSON.parse(m[1].trim()) : null;
}

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (e.name.toLowerCase().endsWith('.csd')) out.push(p);
    }
    return out;
}

const isMouseOverlay = (w) => typeof (w && w['//']) === 'string' && w['//'].includes('mouse overlay');

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
const files = walk(SRC_DIR);
const results = [];
for (const f of files) {
    const src = fs.readFileSync(f, 'utf-8');
    if (!/\bchnget\s+"MOUSE_/.test(src)) continue;

    const rel = path.relative(SRC_DIR, f);
    let result;
    try {
        result = convertCabbage2ToCabbage3(src);
    } catch (e) {
        results.push({ rel, ok: false, reason: `converter error: ${e.message}` });
        continue;
    }

    const outPath = path.join(OUT_DIR, rel);
    const existing = fs.existsSync(outPath) ? cabbageJson(fs.readFileSync(outPath, 'utf-8')) : null;
    const newRoot = cabbageJson(result.text);

    // Safety: only overwrite if the non-mouse widgets are unchanged.
    if (existing && newRoot) {
        const exW = (existing.widgets || []).filter((w) => !isMouseOverlay(w));
        const nwW = (newRoot.widgets || []).filter((w) => !isMouseOverlay(w));
        if (JSON.stringify(exW) !== JSON.stringify(nwW)) {
            results.push({ rel, ok: false, reason: 'non-mouse widgets differ from existing conversion — skipped (manual review)' });
            continue;
        }
    }

    if (!DRY_RUN) {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, result.text, 'utf-8');
    }
    results.push({ rel, ok: true, summary: result.summary, warnings: result.warnings });
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
for (const r of results) {
    console.log(`${r.ok ? 'WRITE' : 'SKIP '}  ${r.rel}`);
    if (r.ok) {
        console.log(`        ${r.summary}`);
        for (const w of r.warnings) console.log(`        ! ${w}`);
    } else {
        console.log(`        ${r.reason}`);
    }
}

const written = results.filter((r) => r.ok).length;
const skipped = results.filter((r) => !r.ok).length;
console.log(`\n${DRY_RUN ? '[dry-run] ' : ''}${written} written, ${skipped} skipped, ${results.length} mouse-affected file(s) total.`);
