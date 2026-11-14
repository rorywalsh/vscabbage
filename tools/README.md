# Cabbage 2 → Cabbage 3 conversion tools

The converter itself is `src/utils/cabbage2converter.ts`. It is a pure module (no
`vscode` dependency), so it can be unit-tested and driven from scripts as well as
from the extension.

| File | Purpose |
|---|---|
| `Cabbage2_to_Cabbage3_conversion_rules.md` | Rules the converter implements |
| `Cabbage2_to_Cabbage3_identifier_mapping.md` | Cabbage 2 identifier → Cabbage 3 property map |
| `regenerate_all_conversions.cjs` | Clean, full batch regeneration of the corpus |
| `regenerate_mouse_conversions.cjs` | Regenerate only `MOUSE_*`-affected files, without clobbering manual edits |

## Single instrument (VS Code command)

Command palette → **Cabbage: Import Cabbage 2 Instrument**
(`cabbage.importCabbage2Instrument`).

This is file-at-a-time only: pick one `.csd`, and it writes
`<name>_Cabbage3.csd` next to the source (never overwriting the original,
appending `_2`, `_3`, … if the target already exists).

## Batch conversion (what to use for the Iain corpus)

Run from the `vscabbage` repo root:

```bash
cd /Users/rorywalsh/sourcecode/vscabbage

# report only — nothing written
node tools/regenerate_all_conversions.cjs --dry-run

# actually regenerate every .csd into the Cabbage 3 corpus
node tools/regenerate_all_conversions.cjs
```

Default paths (hard-coded in the script):

- `SRC_DIR` = `/Users/rorywalsh/sourcecode/IainsCabbageExamples`
- `OUT_DIR` = `/Users/rorywalsh/sourcecode/IainsCabbageExamples_Cabbage3`

Override them with environment variables, which is useful for converting a
single subfolder:

```bash
SRC_DIR=~/sourcecode/IainsCabbageExamples/Instruments \
OUT_DIR=/tmp/cabbage3-instruments \
node tools/regenerate_all_conversions.cjs --dry-run
```

The scripts compile `src/utils/cabbage2converter.ts` and `src/utils/csdFormat.ts`
into a temp directory themselves, so `npm install` is enough — there is no need
to run `npm run compile` first.

Both scripts print one line per file (`WRITE` / `SKIP`) followed by any
converter warnings, then a total. A recent dry-run of the full corpus reported
`189 written, 0 skipped`, with warnings for things that need manual review, e.g.
widgets with no Cabbage 3 equivalent (`signaldisplay`), duplicate channel ids,
and property updates the converter could not rewrite (left commented out).

### `regenerate_all_conversions.cjs`

Clean, **destructive** regeneration: it overwrites the whole output corpus.
Any manual edits in `IainsCabbageExamples_Cabbage3` are lost.

### `regenerate_mouse_conversions.cjs`

Safer variant. It only touches files that read the reserved `MOUSE_*` channels,
and it refuses to overwrite a file when the non-mouse widgets would change
(i.e. the existing conversion has manual edits). Those files are reported and
skipped instead. Same `--dry-run` / `SRC_DIR` / `OUT_DIR` interface.

## Unit tests

The batch scripts are not part of `npm test`. The converter's own coverage is
the unit suite:

```bash
npm run test:unit   # out/test/unit/**/*.test.js, includes cabbage2converter.test.ts
```

Use `test:unit` for logic coverage and the `regenerate_*` scripts for the real
corpus pass.
