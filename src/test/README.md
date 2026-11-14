# vscabbage tests

This directory holds the extension's automated tests. There are two suites:

| Suite | Location | Runner | What it needs |
|---|---|---|---|
| **Unit** | `src/test/unit/` | mocha | Node only (no VS Code) |
| **Integration** | `src/test/integration/` | `@vscode/test-cli` / `@vscode/test-electron` | A downloaded VS Code instance |

The C++ backend has its own Catch2 suite in the [`cabbage`](https://github.com/rorywalsh/cabbage)
repo (`tests/README.md`); that suite is not part of this package but is exercised by
`cabbage/.github/workflows/cabbage3.yaml`.

> **Maintenance rule:** when you add, remove, rename or materially change the scope of a
> test file, update this README in the same PR. Every test file must be listed here.

## Running the tests

```bash
npm run lint               # eslint (TypeScript only)
npm run test:unit          # compile + plain mocha (fast; no VS Code)
npm run test:integration   # compile + webpack + hosted VS Code
npm test                   # pretest lint, then unit + integration
```

Notes:

- Unit tests need **Node 24** because `jsdom@31` requires `^22.22 || ^24.15`. CI uses Node 24
  for the test jobs.
- `test:integration` downloads a VS Code build into `.vscode-test/` (gitignored) on first run.
- Both suites are compiled to `out/` by `tsc -p . --outDir out`.

## CI and merge gating

`.github/workflows/build.yaml` runs two jobs on pushes to `main` and on pull requests to
`develop` and `main`:

- **Lint and unit tests** — `npm run lint` + `npm run test:unit`
- **Integration tests (Linux)** — headless (`xvfb-run`) hosted VS Code tests

`main` is protected: both checks are **required** (with `strict`, i.e. the branch must be
up to date), and force-pushes/deletions are disabled. The `release` job also depends on
both test jobs.

---

## Unit tests (`src/test/unit/`)

### `cabbage2converter.test.ts` — 23 tests
Cabbage 2 → Cabbage 3 conversion.
- `rewriteOrchestra`: k-rate and i-rate multi-arg `cabbageSet` `bounds(...)` → `bounds.left/top/width/height`; `colour(...)` → `style.backgroundColor` via `sprintf`/`sprintfk`; scalar updates and `cabbageSetValue` left untouched.
- `convertCabbage2Section`: default vs explicit range increment; comboBox `valueChanged` + 0-based default; rotary-slider bounds scaling (85% labelled, 80% labelled+value box, 70% knob scale).
- `convertCabbage2ToCabbage3`: records rotary scale notes.
- `detectMouseChannels`: finds `MOUSE_*` references in stable order; ignores other/unknown names.
- `buildMouseChannels`: X/Y ranges sized to the form; press/release pairs share an id; unknown names skipped.
- `detectSoundfilerLoading`: `ftgen` → `tableNumber`; `diskin2` → `file`; no match → empty.
- Full conversion: adds form mouse channels and rewrites `chnget`; rejects an already-JSON section; rejects a document with no `<Cabbage>` section.

### `channelScanner.test.ts` — 18 tests
Channel discovery for “Generate UI from channels”.
- `scanCabbageChannels`: all four opcodes (including bare calls), no `cabbageGetValue` double-count, dynamic/non-literal references skipped, inline `@widget` hint + range parsing, repeat merging (first hint wins), LHS value types (`CabbageStrTrig`/`CabbageNumTrig`).
- `parseWidgetHint`: type-only hints, rejects the old bare-type form, optional comma, min/max/value/increment/skew, malformed ranges.
- `inferWidgetType`: channel-name suffixes and value-type fallbacks.
- `channelToWidget`: hint/range application, string channel for fileButton, no channels for genTable.
- `humanizeChannelName`, `layoutWidgets`, `bottomOfWidgets`, `fitFormHeight`.

### `csdFormat.test.ts` — 4 tests
CSD formatting.
- `formatCsdText`: FracturedJson formatting of the Cabbage section, comment preservation, Csound indentation when there is no Cabbage section.
- `formatCabbageSection`: formats only the Cabbage section, leaving Csound untouched.

### `formatting.test.ts` — 9 tests
Legacy formatter helpers (`src/formatting.ts`).
- `formatText`: instr/if indent/dedent, custom indent width, JSON array inside `<Cabbage>`, unparseable Cabbage content kept verbatim.
- `formatJsonObjects`: indentation and comma layout.
- `updateJsonArray`: merges props, strips values matching defaults, leaves non-matching channels untouched.
- `sortOrderOfProperties`: key ordering, ordered `bounds`/`range`, omission of absent sections.

### `jsonc.test.ts` — 16 tests
JSONC parsing and comment-preserving edits.
- `parseJsonc`: line/block comments; rejects trailing commas with a friendly message; `parseCabbageJson` handles array and object roots.
- `findCabbageInclude`: ignores commented-out includes and include-like text inside strings/block comments; finds real directives with their offset.
- `reconcileJsonDocument`: preserves comments across update, rename (id alias), remove, insert, top-level/legacy root shapes, channel add/remove, and generated-form id adoption.
- `reorderJsoncArrayValues`: reorders array values while keeping comments.
- `formatJsonText` / `minifyJsonText`: both keep comments.

### `kitPreset.test.ts` — 8 tests
Widget-kit preset generation.
- `flattenPropsForPicker`: dot-path flattening, skips layout/identity sections, editable-by-default flags.
- `toKitPresetProps`: drops per-instance values, strips channel id/live value, does not mutate input.
- `buildHiddenProps`: base + identity + deduped unchecked paths.
- `buildKitWidgetSource`: subclass preset source, rejects unsupported built-in types.

### `validateInstallation.test.ts` — 43 tests
Report-only installation probes (`src/validateInstallation.ts`).
- `normalizeSourceDirs`.
- `checkSettingsFile`: missing, invalid JSON, absent `currentConfig`, healthy.
- `checkJsSourceDirs`, `checkPrimarySource` (match/stale/unknown), `checkWidgetSources` (present/missing/skipped).
- `checkLegacySettingsFile`: non-Windows, lingering Windows file, junction alias, distinct file, `realpath` failure.
- `checkServiceBinary`: public, Pro-preferred, Pro-disabled fallback, missing Pro.
- `checkCsoundPresent`: macOS bundle, Windows PATH, `csound7_64.dll`, legacy `csound64.dll`, none.
- `checkServiceBinaryExecutable`: exec bit, missing bit, Pro selection, skips, Windows, `stat` failure.
- `runAllChecks`/`summarize`/`formatReport`: eight results, hostile inputs never throw, healthy env, formatted failure report.

### `widgetDirectories.test.ts` — 18 tests
Pure custom-widget path helpers (`src/utils/widgetDirectories.ts`).
- `expandUserPath`: empty/non-string, tilde, `$VAR`/`${VAR}`, `%VAR%` only on Windows.
- `normalizeDirForCompare`: trailing separators, case-folding on Windows/macOS only.
- `resolveWidgetDirectoriesForRoot`: canonical `cabbage/widgets`, plugin `widgets`, both, direct widgets dir, bare folder fallback, nothing on disk.
- `normalizeCustomWidgetRoot`: `.../cabbage/widgets` → root, standalone `widgets` → parent, existing root, lone `cabbage` with/without `widgets`.

### `widgetJson.test.ts` — 9 tests
Pure widget merge/identity helpers (`src/utils/widgetJson.ts`).
- `deepMerge`: nested merge without mutation, arrays replace, `undefined` skipped, `null` kept by default, `deleteOnNull` deletion mode, non-object target.
- `getWidgetChannelId`: explicit `id`, first channel id, legacy `channel`, empty.

### `widgetKitExport.test.ts` — 14 tests
Kit widget export wiring.
- `buildKitWidgetShims`: built-in overrides delegated, kit-only exports and aliases, last-declaration wins, stable sort, URL encoding.
- `buildKitImportOverrides`: built-in mapping, tricky class names, full built-in coverage, last-wins, encoding.
- `applyKitWidgetImportOverrides`: rewrites built-ins while leaving FileButton/InfoButton, no-op without overrides, same-name aliasing.

### `widgetScan.test.ts` — 25 tests
Recursive custom-widget discovery.
- `extractWidgetInfoFromFile`: class/type detection, fallbacks, preset markers, static `widgetType`, depth-1 type, commented-out keys, helper-built props, non-class/helper/non-widget rejection.
- `scanForCustomWidgets`: missing dir, root and category discovery, deep nesting, ignored folders/files/tests/templates, helper classes, fallback type, built-in redeclaration, stable order, reserved `kits/`.
- `scanForWidgetKits`: no kits, manifest metadata/categories/overrides, folder-name fallback, hidden kits.

### `widgetSorter.test.ts` — 5 tests
Visual-hierarchy widget ordering.
- Non-array passthrough; forms first then groupboxes with children in layout order; nested groupboxes resolve to the smallest container; row tolerance; missing bounds handled defensively.

### `webviewUtils.test.ts` — 31 tests
Webview `CabbageUtils` / `CabbageColours` (loaded from the plain-ESM source via the esbuild harness).
- Ranges/channels: default range, `getChannels`, missing/partial range filling, legacy channel synthesis, click vs drag increments, `getChannelId` throw, range/parameter lookups, event lookup, DOM id.
- Math/identity: `clamp`, `map`, `getDecimalPlaces`, `getPath`, unique channel/id generation, plugin-parameter count, file-name extraction.
- `sanitizeForEditor`: removes runtime/internal keys and `range.value`, accepts `{props}`, does not mutate.
- `applyWidgetPointerEvents` (jsdom): visible+active → `auto`; inactive/hidden → `none`; falls back to `widget.widgetDiv` and tolerates a missing wrapper.
- `findValidId` (jsdom): closest ancestor div id, direct div id, missing target → `null`.
- `CabbageColours`: RGB(A)/hex conversion, inversion, alpha, named colours, lighten/darken.

### `webviewPropertyPanel.test.ts` — 11 tests
Webview `PropertyPanel` serialization/minimization.
- `applyExcludes`: simple keys recursively, dot-notation keys, non-object passthrough, default exclude keys.
- `minimizePropsForWidget`: strips defaults but keeps changed values and identity, preserves channel ids, omits default form channels, honours `serializedChildren`, emits `null` deletion signals, falls back to full props with no identifier, never mutates live props.

### `helpers/loadWebviewModule.ts` — not a test (harness)
Bundles a webview ES module with **esbuild** to CommonJS, auto-stubs its dependency graph, and evaluates it; also installs **jsdom** globals. Use it for new webview tests:

```ts
import { installDom, loadWebviewModule } from './helpers/loadWebviewModule';

before(async () => {
    installDom();
    ({ MyWidget } = await loadWebviewModule('src/cabbage/widgets/myWidget.js', {
        stubs: { './sharedState.js': 'export let vscode = null; export function getCabbageMode() { return "x"; }' },
    }));
});
```

---

## Integration tests (`src/test/integration/`)

### `extension.test.ts` — 4 tests
Extension lifecycle through a real VS Code host.
- Extension is discoverable, activates without throwing, registers its core commands, and formats a `.csd` through the `cabbage.formatDocument` command.

### `commands.test.ts` — 5 tests
Document-transforming commands against real `.csd` files.
- `cabbage.reorderWidgets` (visual ordering), `cabbage.addCabbageSection` (top placement), `cabbage.expandCabbageJSON`, `cabbage.collapseCabbageJSON`, `cabbage.moveCabbageSection`.

---

## Currently not covered

These are known gaps (see the plan notes; adding them should also add an entry here):

- Compile-on-save / backend round-trips (need a stubbed `CabbageApp` or the packaged binary).
- Widget insert/edit/duplicate flows driven from the webview (need webview command simulation).
- Cabbage 2 instrument import and `goToDefinition`/`jumpToWidgetObject` (need dialog mocking/editor fixtures).
- Individual widget classes (sliders, combo boxes, genTable, …) under jsdom for default props and serialization.
