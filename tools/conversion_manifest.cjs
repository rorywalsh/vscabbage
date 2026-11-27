#!/usr/bin/env node
'use strict';

/**
 * Corpus conversion manifest — the regression guard for the Cabbage 2 → 3
 * converter.
 *
 * Converts every Cabbage 2 example with the current converter and hashes the
 * formatted result. The committed `tools/conversion_manifest.json` is the
 * reviewed baseline. Running `--check` re-converts the corpus and fails on any
 * drift, so a change that fixes one instrument but silently changes another is
 * caught before it ships.
 *
 * Usage:
 *   node tools/conversion_manifest.cjs --update   # (re)write the baseline
 *   node tools/conversion_manifest.cjs --check    # compare against the baseline
 *
 * Env overrides:
 *   SRC_DIR   source Cabbage 2 corpus (default ~/sourcecode/AllCabbageExamples)
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const MODE = process.argv.includes('--update')
    ? 'update'
    : process.argv.includes('--check') ? 'check' : 'check';

const REPO = path.resolve(__dirname, '..');
const SRC_DIR = process.env.SRC_DIR || path.join(os.homedir(), 'sourcecode', 'AllCabbageExamples');
const MANIFEST = path.join(__dirname, 'conversion_manifest.json');

// Compile the converter + formatter (single source of truth for the migration
// logic). Mirrors regenerate_all_conversions.cjs so both tools agree.
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'c2manifest-'));
const tsc = path.join(REPO, 'node_modules', '.bin', 'tsc');
const convSrc = path.join(REPO, 'src', 'utils', 'cabbage2converter.ts');
const csdFormatSrc = path.join(REPO, 'src', 'utils', 'csdFormat.ts');

process.env.NODE_PATH = [path.join(REPO, 'node_modules'), process.env.NODE_PATH]
    .filter(Boolean)
    .join(path.delimiter);
require('module').Module._initPaths();

try {
    execSync(
        `${JSON.stringify(tsc)} ${JSON.stringify(convSrc)} ${JSON.stringify(csdFormatSrc)} --outDir ${JSON.stringify(tmp)} ` +
        '--module node16 --target es2022 --moduleResolution node16 --skipLibCheck --esModuleInterop --ignoreConfig',
        { stdio: 'pipe' },
    );
} catch (e) {
    console.error('Failed to compile cabbage2converter.ts:', e.message);
    process.exit(1);
}
const { convertCabbage2ToCabbage3 } = require(path.join(tmp, 'cabbage2converter.js'));
const { formatCsdText } = require(path.join(tmp, 'csdFormat.js'));

function walk(dir, out = []) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) walk(p, out);
        else if (e.name.toLowerCase().endsWith('.csd')) out.push(p);
    }
    return out;
}

function sha256(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
}

/** @returns {{ files: Record<string, string>, errors: Record<string, string> }} */
function computeManifest(srcDir) {
    const files = {};
    const errors = {};
    for (const f of walk(srcDir)) {
        const rel = path.relative(srcDir, f).split(path.sep).join('/');
        const src = fs.readFileSync(f, 'utf-8');
        try {
            const result = convertCabbage2ToCabbage3(src);
            const formatted = formatCsdText(result.text, {
                indentSpaces: 4,
                jsonIndentSpaces: 4,
                maxLength: 120,
            });
            files[rel] = sha256(formatted);
        } catch (e) {
            errors[rel] = `converter error: ${e.message}`;
        }
    }
    return { files, errors };
}

function main() {
    if (!fs.existsSync(SRC_DIR)) {
        console.error(`SRC_DIR not found: ${SRC_DIR}\nSet SRC_DIR to the Cabbage 2 corpus.`);
        process.exit(2);
    }

    const { files, errors } = computeManifest(SRC_DIR);

    if (MODE === 'update') {
        const manifest = { version: 1, source: SRC_DIR, generated: new Date().toISOString(), files, errors };
        fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
        console.log(`Wrote ${Object.keys(files).length} file hash(es), ${Object.keys(errors).length} error(s) to ${MANIFEST}`);
        return;
    }

    // check
    const baseline = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));
    const baselineErrors = baseline.errors || {};
    const drift = [];
    const added = [];
    const removed = [];
    const errorDrift = [];

    for (const [rel, hash] of Object.entries(baseline.files)) {
        if (!(rel in files)) removed.push(rel);
        else if (files[rel] !== hash) drift.push(rel);
    }
    for (const rel of Object.keys(files)) {
        if (!(rel in baseline.files)) added.push(rel);
    }
    for (const [rel, reason] of Object.entries(errors)) {
        if (baselineErrors[rel] !== reason) errorDrift.push(rel);
    }
    for (const rel of Object.keys(baselineErrors)) {
        if (!(rel in errors)) errorDrift.push(rel);
    }

    const totalDrift = drift.length + added.length + removed.length + errorDrift.length;
    if (totalDrift === 0) {
        console.log(`OK: ${Object.keys(files).length} conversions match the baseline.`);
        return;
    }

    console.error(`Conversion drift detected (${totalDrift} file(s)):\n`);
    for (const rel of drift) console.error(`  changed   ${rel}`);
    for (const rel of added) console.error(`  added     ${rel}`);
    for (const rel of removed) console.error(`  removed   ${rel}`);
    for (const rel of errorDrift) console.error(`  error     ${rel}`);
    console.error('\nIf this change is intentional, review the converted output and run:');
    console.error('  node tools/conversion_manifest.cjs --update\n');
    process.exit(1);
}

main();
