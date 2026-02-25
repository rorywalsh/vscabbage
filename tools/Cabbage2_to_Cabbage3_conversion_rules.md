# Cabbage 2 → Cabbage 3 conversion rules used

These are the rules used to convert `ChordBotCabbage2.txt` to `ChordBotCabbage3_UI.json`.

## 1) Widget type renaming
- `rslider` → `rotarySlider`
- `vslider` → `verticalSlider`
- `combobox` → `comboBox`
- `vmeter` → `verticalSlider` (fallback approximation)
- `image`, `button`, `form` kept as-is

## 2) Geometry mapping
- `bounds(x,y,w,h)` → `"bounds": {"left":x, "top":y, "width":w, "height":h}`
- `pos(x,y)` + `size(w,h)` → same `bounds` object in Cabbage 3
- `form size(w,h)` → `"size": {"width":w, "height":h}`

## 3) Channels and ranges
- `channel("name")` →
  - `"channels": [{"id":"name", "event":"valueChanged"}]`
- `range(min,max,default,skew,increment)` →
  - `"channels[0].range": {"min", "max", "defaultValue", "skew", "increment"}`
- `value(n)`:
  - mapped to `channels[0].range.defaultValue` for slider-like widgets
  - for `comboBox`, see section 12 (index/range lessons learned)

## 4) Text/items mapping
- `combobox text("A","B",...)` → `"items": ["A","B", ...]`
- `button text("Off","On")` →
  - `"label": {"text": {"off":"Off", "on":"On"}}`

## 5) Style mapping (general)
- `colour(...)` → `style.backgroundColor` (or `style.fill` for `comboBox`, `style.fill` in `form.style`)
- `alpha(x)` → `style.opacity`
- `outlineColour(...)` → `style.borderColor`
- `outlineThickness(n)` → `style.borderWidth`
- `corners(n)` → `style.borderRadius`
- `shape("sharp")` → `style.borderRadius = 0`
- `shape("rounded")` → `style.borderRadius = 4`
- `textColour(...)` / `fontColour(...)`:
  - buttons: mapped to both `style.off.textColor` and `style.on.textColor`
  - comboBox: `style.fontColor`
  - sliders/images fallback: `style.label.fontColor`

## 6) Button state colors
- `colour:0(...)` → `style.off.backgroundColor`
- `colour:1(...)` → `style.on.backgroundColor`
- Added pragmatic defaults for `style.hover` and `style.active` when not specified

## 7) Filmstrip mapping
- `filmstrip("file.png", frames, "vertical")` →
  - `"filmStrip": {"file":"file.png", "frames": {"count": frames, "width": 64, "height": 64}}`
- Orientation token (`"vertical"`) is not represented in the generated JSON

## 8) Non-direct translation decisions
- `guiMode("queue")` is preserved as metadata field `"//guiMode"` (not runtime widget behavior)
- Cabbage 2 comments/section headers were not converted to executable properties (except minimal comment markers when useful)
- `vmeter` has no direct stock Cabbage 3 widget in this pass, so each meter is approximated as:
  - `verticalSlider`
  - `active: false`
  - `automatable: false`
  - `valueText.visible: false`
  - meter-like track/thumb colors

## 9) Intentional simplifications
- RGB tuples were converted to CSS color strings (`rgb(...)` / `rgba(...)`)
- Some style details that are Cabbage 2-specific were dropped if no reliable Cabbage 3 equivalent exists
- This is a structural first-pass migration aimed at preserving layout/channels/behavioral intent, not pixel-perfect parity

## 10) Media file/runtime rules discovered during testing
- Keep assets in a `media` folder beside the `.csd` file.
- Prefer plain file names in widget `file` properties (e.g. `"file": "UIPrint14.png"`), not absolute paths.
- In VS Code webview mode, media URL generation must use encoded path segments for Windows compatibility.
- Media-file enumeration for PropertyPanel selectors must resolve from the active instrument path (last saved `.csd`), not whichever editor tab is currently focused.
- The extension should always return a `mediaFiles` response (including `[]`) so file dropdowns do not remain stuck in a loading state.

## 11) Layering/z-index rule for converted UIs
- Cabbage 3 render order is affected by both insertion order and `zIndex`.
- For overlay artwork (labels, frames, masks), assign explicit `zIndex` values during migration.
- Practical layering strategy used:
  - background/base images: low `zIndex` (e.g. 0–5)
  - decorative separators/panels: mid `zIndex` (e.g. 6–15)
  - label overlays like `UIPrint14.png`: higher `zIndex` (e.g. 20+)
  - interactive controls/meters: same or higher depending on intended overlap
- Symptom to watch for: an image appears briefly and then disappears as later widgets mount; this usually indicates a layering issue, fixed by explicit `zIndex`.

## 12) ComboBox lessons learned (important)
- You generally do **not** need to set an explicit `channels[0].range` for `comboBox`; range/index domain is inferred from `items`.
- Prefer omitting manual comboBox `range` in migrations unless there is a very specific legacy reason to force it.
- If Cabbage 2/Csound logic expects 1-based combo indices, set `"indexOffset": true`.
- Main pitfall observed: manually forcing comboBox ranges can create off-by-one behaviour and item/index mismatches after conversion.
- Practical rule used now:
  - keep `items`
  - set `indexOffset` according to legacy logic
  - avoid explicit comboBox `range` unless required

## 13) `identChannel` migration rule (critical)
- In Cabbage 3 there is no separate `identChannel` concept. A widget's main channel/id should be used for property and value updates.
- Migration rule:
  - remove `identChannel(...)` from widget declarations
  - ensure widget has a stable main channel/id (`channels[0].id` for parameter widgets, top-level `id` for panel-style widgets)
  - replace orchestra references that target the old ident channel string with the widget's main channel/id
- If a Cabbage 2 widget had only `identChannel` and no `channel`, reuse that ident name as the widget channel/id to keep orchestra code stable.

## 14) `chnset/chnget` rewrite rules for former ident channels
- `chnget "oldIdent"` → `cabbageGetValue "mainChannel"` (value path)
- `chnset kval, "oldIdent"` for value updates → `cabbageSetValue "mainChannel", kval, changed:k(kval)`
- `chnset "property(value)", "oldIdent"` for property updates → `cabbageSet k(1), "mainChannel", "property", value`
- `sprintf/sprintfk` property strings feeding `chnset` should be rewritten to direct `cabbageSet` calls with explicit property/value args.
- Prefer `cabbageSetValue` for value-only traffic and `cabbageSet` for visual/property mutations.

## 15) Additional Effects corpus lessons (77 Cabbage2 instruments sampled)
- High-frequency legacy identifiers that need robust mapping support:
  - widget/property: `rslider`, `combobox`, `checkbox`, `hslider`, `vslider`, `image`, `label`, `groupbox`
  - style tokens: `fontcolour`, `outlinecolour`, `trackercolour`, `shape`, `alpha`
  - structural/control: `identchannel`, `plant`, `visible`, `latched`
- Practical implication: converters should prioritize correctness for `rslider/hslider/combobox/checkbox` and style-token translation before handling rarer widgets.

## 16) Legacy widget/syntax handling notes from Effects set
- `groupbox` → `groupBox` with bounds/style preserved; if used only as a visual container, prefer top-level `id` + `cabbageSet` property control.
- `plant(...)` blocks are legacy grouping syntax; flatten into explicit widget JSON objects and preserve relative bounds.
- `latched` button behavior requires explicit mapping to Cabbage 3 button semantics; verify toggle behavior after conversion.
- `trackercolour` maps to slider track styling in Cabbage 3 (`style.track.fillColor` where supported).
- `soundfiler` is rare and typically requires a non-direct conversion path (commonly to `genTable`/custom UI); treat as manual-review required.
