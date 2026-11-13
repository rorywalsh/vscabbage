# Cabbage 2 → Cabbage 3 conversion rules used

These are the rules used to convert `ChordBotCabbage2.txt` to `ChordBotCabbage3_UI.json`.

## 1) Widget type renaming
- `rslider` → `rotarySlider`
- `hslider` → `horizontalSlider`
- `vslider` → `verticalSlider`
- `nslider` → `numberSlider`
- `combobox` → `comboBox`
- `checkbox` → `checkBox`
- `groupbox` → `groupBox`
- `gentable` → `genTable`
- `filebutton` → `fileButton`
- `texteditor` → `textEditor`
- `listbox` → `listBox`
- `infobutton` → `infoButton`
- `vmeter` → `verticalSlider` (fallback approximation; Cabbage 3 has no stock meter)
- `soundfiler` → `genTable` (waveform viewer). The `identChannel` becomes the genTable's top-level `id`, `selectableRegions` is enabled so `channel("beg","len")` keeps working. The converter wires the display source from the orchestra: a `ftgen N, …, 1, gSfilepath` (gen 1 = load-from-file) sets `tableNumber: N`, and a `diskin2 gSfilepath` sets `file: gSfilepath`; the matching `chnset "file(%s)…", "ident"` is rewritten to `cabbageSet "id", "tableNumber", N` / `cabbageSet "id", "file", gSfilepath`. `scrubberPosition(...)` has no genTable equivalent.
- `signaldisplay` → no stock equivalent; manual review (custom widget)
- `image`, `button`, `label`, `keyboard`, `form` kept as-is

## 2) Geometry mapping
- `bounds(x,y,w,h)` → `"bounds": {"left":x, "top":y, "width":w, "height":h}`
- `pos(x,y)` → `bounds.left` / `bounds.top`
- `size(w,h)` (non-form) → `bounds.width` / `bounds.height`
- `form size(w,h)` → `"size": {"width":w, "height":h}` (the form is the only widget without `left`/`top`)
- All non-form widgets must end up with a complete `bounds` object (`left`, `top`, `width`, `height`); `pos()`/`size()` merge into it rather than producing a separate `size` field.
- **Rotary sliders**: Cabbage 3 uses the full bounds for the knob, so converted `rslider` bounds are scaled to 80% (rounded) and centred in their original slot. When this happens, the converted `.csd` gets a `; Cabbage2→3: rotarySlider bounds scaled ...` comment recording the scale factor.

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
- **Cabbage 2 combo boxes (and option buttons) are 1-based; Cabbage 3 are 0-based by default.** The converter leaves the widget 0-based (no `indexOffset`) and instead shifts the orchestra down by one so the logic keeps meaning the same item: `if combo==N` → `if combo==N-1`, `comboVar init N` → `comboVar init N-1`, and a manual `i(comboVar)-1` (a 1→0 shift the original authors wrote to feed 0-based opcodes/arrays) is dropped. Emitting `"indexOffset": true` was tried but is a band-aid that hides the shift and is easy to miss when hand-editing; 0-based is the native Cabbage 3 convention.
- You generally do **not** need to set an explicit `channels[0].range` for `comboBox`; range/index domain is inferred from `items`.
- Prefer omitting manual comboBox `range` in migrations unless there is a very specific legacy reason to force it.
- Main pitfall observed: manually forcing comboBox ranges can create off-by-one behaviour and item/index mismatches after conversion.
- Practical rule used now:
  - keep `items`
  - leave the widget 0-based (do **not** emit `"indexOffset"`)
  - shift the orchestra's `combo==N` / `init N` / `i(combo)-1` references down by one
  - avoid explicit comboBox `range` unless required

## 13) `identChannel` migration rule (critical)

Cabbage 2 gives a widget two independent names:

- `channel("name")` — the **value** channel (automatable parameter; read/written by the host, `chnget`, and the value form of `chnset`).
- `identChannel("ident")` — a **separate handle** used only to address the widget for *property/appearance* updates (`chnset "prop(...)", "ident"`). Used on `label`/`image`/`plant`, and also alongside a `channel` on parameter widgets (e.g. `rslider … channel("frq") … identChannel("frqID")` so the orchestra can `chnset "visible(0)", "frqID"`).

Cabbage 3 collapses this: a widget's **channel object** is the single addressable unit, and it serves *both* value and appearance traffic.

- value traffic → `cabbageGetValue`/`cabbageSetValue` always query one of the channel objects (`channels[].id`, or the `"channel": "name"` shorthand).
- appearance/property traffic → `cabbageSet`/`cabbageGet` address that **same** channel object; no separate identifier exists.

Migration rule (always results in a **single** channel per widget):

- `channel("name")` → a channel object with id `"name"`.
- `identChannel("ident")` on a widget that **also** has `channel("name")` → **drop the ident**: emit one channel `{"id":"name"}` and rewrite orchestra appearance updates that used `"ident"` to target `"name"` instead (e.g. `chnset "visible(0)", "frqID"` → `cabbageSet "frq", "visible", 0`).
- `identChannel("ident")` on a widget with **no** `channel` (label/image/plant) → a single channel `{"id":"ident"}`.
- Multiple channels only arise from genuinely multi-channel widgets (e.g. `xyPad`), never from an identChannel.

## 14) `chnset/chnget` rewrite rules

Cabbage 2 overloads `chnset`/`chnget` for both values and properties; Cabbage 3 splits them into distinct opcodes.

- `chnget "chan"` (value read) → `cabbageGetValue "chan"`
- `chnset kVal, "chan"` (numeric value write) → `cabbageSetValue "chan", kVal`
- `chnset SVal, "chan"` (string value write) → `cabbageSetValue "chan", SVal`
- `chnset "prop(args)", "ident"` (property write) → `cabbageSet "channel", "prop", value`
- property read (rare in Cabbage 2) → `cabbageGet "channel", "prop"`

`cabbageSet` confirmed signatures (the first argument is a channel id):

    cabbageSet "channel", "prop", value
    cabbageSet kTrig, "channel", "prop", value
    cabbageSet "channel", jsonObjectString   ; e.g. sprintf {{"visible":%d}}, 0

`sprintf`/`sprintfk` attribute strings feeding `chnset` (e.g. `sprintf "bounds(%d,%d,%d,%d)", x,y,w,h`) must be decomposed into one `cabbageSet` call per property.

**Dot notation only** — Cabbage 3 has no flat style tokens; every Cabbage 2 token maps to a nested (dotted) path that must match the widget's JSON property tree (see each widget's `rawDefaults`).

| Cabbage 2 token | Cabbage 3 dotted path (runtime) |
|---|---|
| `colour(...)` | `style.backgroundColor` (image/label/form); `colour.on.fill` / `colour.off.fill` (button); `style.fill` (comboBox) |
| `outlineColour(...)` | `style.borderColor` |
| `outlineThickness(n)` | `style.borderWidth` |
| `corners(n)` / `shape(...)` | `style.borderRadius` |
| `alpha(x)` | `style.opacity` |
| `fontColour(...)` / `textColour(...)` | `style.fontColor` (or `style.label.fontColor` for sliders) |
| `text(...)` | `label.text` (label), `text` (textEditor), `text.on` / `text.off` (button) |
| `bounds(x,y,w,h)` | `bounds.left` / `bounds.top` / `bounds.width` / `bounds.height` |
| `visible(n)` | `visible` (one of the few remaining top-level flags) |

**`visible` is special: use the k-rate triggered form.** `chnset "visible(0)", "ident"` almost
always sits inside an `if changed(someComboBox)==1` block, so it must re-fire at k-rate when the
condition changes. Emit `cabbageSet k(1), "channel", "visible", 0/1` (the 4-arg `kTrig` form), not
the 3-arg i-rate `cabbageSet "channel", "visible", 0` — the i-rate form only runs once at init and
so show/hide toggles driven by a combobox silently stop working. `k(1)` is a constant k-rate trigger
and the backend's `isValueDifferent` check de-duplicates repeat sends.

The exact path is widget-specific (e.g. button colour is `colour.on/off.*`, slider track is `style.track.fillColor`, image colour is `style.backgroundColor`) — always verify against the target widget's `rawDefaults`; never assume a flat token survives.

Prefer `cabbageSetValue`/`cabbageGetValue` for value-only traffic and `cabbageSet`/`cabbageGet` for property/visual mutations.

## 15) Additional Effects corpus lessons (77 Cabbage2 instruments sampled)
- High-frequency legacy identifiers that need robust mapping support:
  - widget/property: `rslider`, `combobox`, `checkbox`, `hslider`, `vslider`, `image`, `label`, `groupbox`
  - style tokens: `fontcolour`, `outlinecolour`, `trackercolour`, `shape`, `alpha`
  - structural/control: `identchannel`, `plant`, `visible`, `latched`
- Practical implication: converters should prioritize correctness for `rslider/hslider/combobox/checkbox` and style-token translation before handling rarer widgets.

## 16) Legacy widget/syntax handling notes from Effects set
- `groupbox` → `groupBox` with bounds/style preserved; if used only as a visual container, prefer top-level `id` + `cabbageSet` property control.
- `plant(...)` blocks are legacy grouping syntax; flatten into explicit widget JSON objects and preserve relative bounds.
- `latched(1)` / `latched(0)` → `latched: true` / `latched: false` on the button (Cabbage 3 button now supports a `latched` flag: `true` = toggle, `false` = momentary).
- `trackercolour` maps to slider track styling in Cabbage 3 (`style.track.fillColor` where supported).
- `soundfiler` is rare and typically requires a non-direct conversion path (commonly to `genTable`/custom UI); treat as manual-review required.

## 17) `widgetArray` expansion
- `widgetArray("name", N)` in Cabbage 2 expands to N widgets addressed by ident `name_ident1 … name_identN` (the orchestra builds the ident via `sprintf "name_ident%d", i`).
- Cabbage 3 has no `widgetArray`; convert to one of:
  - N explicit widget JSON objects (each with `"id": "name_ident<i>"` and, for parameter widgets, `"channel": "name<i>"`), or
  - runtime creation with `cabbageCreate` for large/dynamic sets (see `examples/cabbageCreate.csd`).
- Preserve the `name_ident%d` convention in the orchestra (`cabbageSet Sident, "prop", value`) so existing loops/macros keep working unchanged.

## 18) `plant` grouping
- `plant("Name")` blocks are legacy grouping syntax: a container widget (usually `image`, sometimes `groupbox`) followed by `plant("Name") { ... }`, optionally with `identChannel("NamePlant_ident")` so the orchestra can show/hide the whole group.
- **Keep the container's original type** (image → image, groupbox → groupBox); just drop the `plant(...)` identifier.
- Plant children's bounds are **relative** to the container, so offset each child by the container's `left`/`top` and flatten them as siblings (a container widget's `plant` does not change its own absolute bounds).
- If the plant had an identChannel, it becomes a channel id (addressable via `cabbageSet`).

## 19) Reserved `MOUSE_*` channels → form mouse-event channels (critical)

Cabbage 2 exposes the raw pointer as reserved channels read with `chnget`:

```
kMOUSE_X            chnget "MOUSE_X"            ; x position, in form pixels
kMOUSE_Y            chnget "MOUSE_Y"            ; y position, in form pixels
kMOUSE_DOWN_LEFT    chnget "MOUSE_DOWN_LEFT"    ; 1 while left button held
```

Cabbage 3 **removes** these reserved channels entirely. `chnget "MOUSE_X"` now reads
`0` forever, so any interaction driven by them silently stops working (the UI still
renders — only the input path is dead). Mouse position/button state must instead come
from a widget's `channels[].event` (`mouseMoveX`/`mouseMoveY`, `mousePressLeft`/
`mouseReleaseLeft`, …).

**Migration:** add the mouse-event channels to the `form` widget and rewrite the reads to
`cabbageGetValue`. The form reports pointer activity across the whole window — including
clicks over other widgets — so this works even on instruments with interactive widgets.

| Cabbage 2 channel | Cabbage 3 channel id | widget event(s) |
|---|---|---|
| `MOUSE_X` | `mouseX` | `mouseMoveX` (range `0..formWidth`) |
| `MOUSE_Y` | `mouseY` | `mouseMoveY` (range `0..formHeight`) |
| `MOUSE_DOWN_LEFT` | `mouseDownLeft` | `mousePressLeft` + `mouseReleaseLeft` (same id) |
| `MOUSE_DOWN_RIGHT` | `mouseDownRight` | `mousePressRight` + `mouseReleaseRight` (same id) |
| `MOUSE_DOWN_MIDDLE` | `mouseDownMiddle` | `mousePressMiddle` + `mouseReleaseMiddle` (same id) |

The form channels (the converter adds these automatically):

```json
"channels": [
    {"id": "mouseX", "event": "mouseMoveX", "range": {"min": 0, "max": 850, "defaultValue": 0, "skew": 1, "increment": 0.01}},
    {"id": "mouseY", "event": "mouseMoveY", "range": {"min": 0, "max": 430, "defaultValue": 0, "skew": 1, "increment": 0.01}},
    {"id": "mouseDownLeft", "event": "mousePressLeft"},
    {"id": "mouseDownLeft", "event": "mouseReleaseLeft"},
    {"id": "mouseDownRight", "event": "mousePressRight"},
    {"id": "mouseDownRight", "event": "mouseReleaseRight"},
    {"id": "mouseDownMiddle", "event": "mousePressMiddle"},
    {"id": "mouseDownMiddle", "event": "mouseReleaseMiddle"}
]
```

Orchestra rewrite:

```
kMOUSE_X            cabbageGetValue "mouseX"
kMOUSE_Y            cabbageGetValue "mouseY"
kMOUSE_DOWN_LEFT    cabbageGetValue "mouseDownLeft"
kMOUSE_DOWN_RIGHT   cabbageGetValue "mouseDownRight"
kMOUSE_DOWN_MIDDLE  cabbageGetValue "mouseDownMiddle"
```

Rules and gotchas:

- The `mouseMoveX`/`mouseMoveY` range must span the **form** pixel size (not 0..1) so
  the values match the old `MOUSE_X`/`MOUSE_Y` pixel coordinates. Position channels
  update on hover; the value at the instant of a click is the last hover position
  (the press event fires `mousePressLeft` = 1 while the position holds), which is the
  click position.
- `mousePressLeft` sends `1` on press and `mouseReleaseLeft` sends `0` on release, so
  they share one channel id to reproduce the old held-button state. A `trigger` opcode
  on the channel still sees the rising edge exactly as before. If only the press event
  is declared, the same channel is automatically returned to `0` on release.
- All three buttons (left/right/middle) are implemented. When a `mousePressRight`
  channel is present, the form suppresses the browser context menu in performance mode.
- The conversion is surfaced clearly: the rewritten orchestra line carries a
  `; Cabbage2→3: was chnget "…"` comment, and the import summary reports
  `converted N mouse channel(s)`.
