# Cabbage 2 → Cabbage 3 Identifier Mapping

Complete reference for every Cabbage 2 identifier and where it lands in Cabbage 3.

Sources:

- Cabbage 2: `Source/CabbageIds.h` on `archive/cabbage2/main` (`CabbageIdentifierIds`, `CabbageIdentifierStrings`, `CabbageWidgetTypes`).
- Cabbage 3: widget `rawDefaults` in `src/cabbage/widgets/*.js` (vscabbage), and the runtime `cabbageSet`/`cabbageGet` property paths (dotted JSON).

Status legend:

- ✅ **mapped** — direct 1:1 or simple rename.
- 🔀 **per-widget** — lands on different paths depending on widget type.
- ⚠️ **approximate** — no exact equivalent; nearest stock widget/property.
- ❌ **dropped** — deprecated or obsolete; no Cabbage 3 equivalent (drop, or rewrite to `zIndex`/new mechanism).

> Reminder: Cabbage 3 addresses a widget by its **channel id** for both value *and* property updates (`cabbageSet`/`cabbageGet`/`cabbageGetValue`/`cabbageSetValue`), and property paths are **dot-notated**. See the main rules doc §13–§14.

---

## Structural / identity

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `channel("x")` | `channels[].id` / `"channel": "x"` | ✅ |
| `identChannel("x")` | collapse into the widget's channel (see rules §13) | ✅ |
| `widgetArray("n", N)` | expand to N widgets, or `cabbageCreate` | ✅ |
| `plant("name")` | `groupBox` / parent widget with `children` | ✅ |
| `parent(...)` | widget `children` nesting / `cabbageCreate` parent | ✅ |
| `bounds(x,y,w,h)` | `bounds.left/top/width/height` | ✅ |
| `pos(x,y)` + `size(w,h)` | `bounds` | ✅ |
| `caption("str")` | `caption` (form) | ✅ |
| `pluginId("xxxx")` | `pluginId` | ✅ |
| `size(w,h)` | `size` (form) / `bounds` | ✅ |
| `style(...)` | Cabbage 2 CSS-like style string; no direct equivalent — decompose to `style.*` props | ⚠️ |
| `name`, `kind`, `type`, `show` | internal; not part of widget JSON | ❌ |

## Value / range

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `value(n)` | `channels[0].range.defaultValue` | ✅ |
| `range(min,max,default,skew,inc)` | `channels[0].range.{min,max,defaultValue,skew,increment}` | ✅ |
| `min` / `max` | `channels[0].range.min/max` (single-thumb); `horizontalRangeSlider`/`verticalRangeSlider` channels for 2/3-thumb sliders | ✅ |
| `defaultValue(n)` | `channels[0].range.defaultValue` | ✅ |
| `increment(n)` | `channels[0].range.increment` | ✅ |
| `skew(n)` | `channels[0].range.skew` | ✅ |
| `channelType("string"\|"float")` | `channels[0].type` (`"string"` / `"number"`) | ✅ |
| `items("a","b",…)` | `items: [...]` (comboBox / listBox) | ✅ |
| `latched(n)` | `latched` (button): `true` = toggle, `false` = momentary | ✅ |
| `velocity(n)` | `velocity` (rotarySlider / numberSlider / xyPad) | ✅ |
| `automatable(n)` | `automatable` | ✅ |
| `presetIgnore(n)` | `persistence.preset = false` | ✅ |
| `active(n)` | `active` | ✅ |
| `visible(n)` | `visible` | ✅ |
| `radioGroup(n)` | `radioGroup` | ✅ |

> **comboBox / optionButton indices are 1-based in Cabbage 2, 0-based in Cabbage 3.**
> The converter leaves the widget 0-based (no `"indexOffset"`) and shifts the orchestra down by
> one (`combo==N` → `combo==N-1`, `init N` → `init N-1`, and drops a manual `i(combo)-1`).
> See rules doc §12.

## Colour / style (common)

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `colour(...)` | `style.backgroundColor` (image/label/form/groupbox/comboBox/numberSlider/textEditor/csoundOutput); `style.thumb.backgroundColor` (sliders); `colour.on/off.fill` (button) | 🔀 |
| `colour:0(...)` / `colour:1(...)` | `style.off.backgroundColor` / `style.on.backgroundColor` (button/checkBox/infoButton/optionButton/fileButton) | ✅ |
| `alpha(x)` | `style.opacity` | ✅ |
| `outlineColour(...)` | `style.borderColor` (generic); `style.thumb.borderColor` (rotary) | 🔀 |
| `outlineThickness(n)` | `style.borderWidth` (generic); `style.thumb.borderWidth` (rotary) | 🔀 |
| `corners(n)` | `style.borderRadius` | ✅ |
| `shape("sharp"/"rounded"/"ellipse")` | `style.borderRadius` (0 / 4); ellipse not directly representable on non-image widgets | ⚠️ |
| `fontColour(...)` | `style.fontColor` (generic); `style.label.fontColor` (slider caption); `style.valueText.fontColor` (slider value); `style.on.textColor` + `style.off.textColor` (button) | 🔀 |
| `fontColour:0(...)` / `fontColour:1(...)` | `style.off.textColor` / `style.on.textColor` (button family) | ✅ |
| `textColour(...)` / `fontColor(...)` | `style.fontColor` | ✅ |
| `fontSize(n)` | `style.fontSize` | ✅ |
| `fontStyle(...)` | no direct `fontStyle`; nearest is `style.fontFamily` / italic unsupported | ⚠️ |
| `typeface(...)` | `style.fontFamily` | ✅ |
| `align(...)` | `label.align` (slider/groupbox); `style.textAlign` | 🔀 |
| `fill(n)` | `fill` (genTable) | ✅ |

## Sliders (rotary / horizontal / vertical)

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `trackerColour(...)` | `style.track.fillColor` (rotary) | ✅ |
| `trackerBackgroundColour(...)` / `trackerBgColour(...)` | `style.track.backgroundColor` (rotary) | ✅ |
| `trackerThickness(n)` | `style.track.width` (rotary) | ✅ |
| `trackerRadius(n)` | no direct `track.radius`; thumb radius via `style.thumb.radius` | ⚠️ |
| `trackerCentre(...)` | no equivalent | ❌ |
| `trackerStart(n)` / `trackerEnd(n)` | no start/end-angle props in Cabbage 3 | ❌ |
| `trackerInsideRadius(n)` / `trackerOutsideRadius(n)` | no equivalent | ❌ |
| `markerColour(...)` | `style.thumb.backgroundColor` (marker) | ⚠️ |
| `markerStart(n)` / `markerEnd(n)` / `markerThickness(n)` | no equivalent | ❌ |
| `gapMarkers(n)` | no equivalent | ❌ |
| `sliderBounds(...)` | no equivalent (filmstrip reScale) | ❌ |
| `textBox(...)` | `valueText` (visible/prefix/postfix) | ⚠️ |
| `textBoxColour(...)` | `style.valueText.fontColor` (slider) / `style.fontColor` (numberSlider) | ⚠️ |
| `textBoxOutlineColour(...)` | no direct value-box border colour | ❌ |
| `valueTextBox(...)` | `valueText.visible` | ✅ |
| `valueTextBoxBounds(...)` | `valueText` bounds — verify | ⚠️ |
| `valuePrefix(...)` / `valuePostfix(...)` | `valueText.prefix` / `valueText.postfix` (slider); `valuePrefix`/`valuePostfix` (numberSlider, xyPad) | ✅ |
| `popup(n)` | `popup` | ✅ |
| `popupPrefix(...)` / `popupPostfix(...)` / `popupText(...)` | `valueText.prefix` / `valueText.postfix`; popup text via `popup` | ⚠️ |
| `filmstrip(file, frames, …)` | `filmStrip.file` + `filmStrip.frames.{count,width,height}` | ✅ |
| `imgFile(...)` / `imgSlider(...)` / `imgSliderBg(...)` | filmstrip / `svg` markup | ⚠️ |

## Keyboard

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `blackNoteColour(...)` | `color.blackNote` | ✅ |
| `whiteNoteColour(...)` | `color.whiteNote` | ✅ |
| `keyDownColour(...)` | `color.keydown` | ✅ |
| `arrowBackgroundColour(...)` | `color.arrowBackground` | ✅ |
| `arrowColour(...)` | no direct arrow colour | ❌ |
| `keySeparatorColour(...)` | no equivalent | ❌ |
| `mouseOverKeyColour(...)` | no equivalent | ❌ |
| `mouseDownKeyOutlineColour(...)` | no equivalent | ❌ |
| `mouseOverKeyOutlineThickness(...)` | no equivalent | ❌ |
| `keyWidth(n)` | no direct `keyWidth` | ❌ |
| `keyWidthScale(n)` | no equivalent | ❌ |
| `middleC(n)` | `baseOctave` (approx) | ⚠️ |
| `keypressBaseOctave(n)` | `baseOctave` | ✅ |
| `blackNoteLength(n)` / `blackNoteWidth(n)` | no equivalent | ❌ |

## Meter (→ verticalSlider fallback)

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `meterColour:N(...)` | no stock meter; approximate with `verticalSlider` (see rules §8) | ⚠️ |
| `overlayColour(...)` | no equivalent | ❌ |

## GenTable / Soundfiler

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `ampRange(min,max,table,quantise)` | `range.y.{min,max}`; table via `tableNumber` | ✅ |
| `amprange_min/max/tablenumber/quantise` | `range.y.min/max`, `tableNumber` | ✅ |
| `tableColour(...)` | `style.strokeColor` (waveform line) | ✅ |
| `tableBackgroundColour(...)` | `style.backgroundColor` | ✅ |
| `tableGridColour(...)` | `style.borderColor` | ⚠️ |
| `tableNumber(n)` | `tableNumber` | ✅ |
| `tableNumbers(...)` | `tableNumber` (single) | ⚠️ |
| `sampleRange(...)` | no direct equivalent | ❌ |
| `scrubberPosition(...)` / `scrubberposition_sample/table` | no direct equivalent | ❌ |
| `showScrubber(n)` | no equivalent | ❌ |
| `displayType(...)` | no equivalent (signaldisplay) | ❌ |
| `signalVariable(...)` | no equivalent | ❌ |
| `backgroundColour(...)` | `style.backgroundColor` (signaldisplay) | ✅ |
| `fill(n)` | `fill` | ✅ |

**`soundfiler` widget → `genTable`**: the `soundfiler` widget maps to `genTable`
(see rules §1). The `identChannel("filer1")` becomes the genTable's top-level `id`, and
`selectableRegions` is enabled so `channel("beg","len")` drives region selection
(`channels[0]` = start sample, `channels[1]` = length). Set `"tableNumber"` to the ftable
the orchestra loads (usually `1`), and replace the file-loading
`chnset "file(...)", "filer1"` with `cabbageSet "filer1", "tableNumber", 1`.
`scrubberPosition(...)` has no genTable equivalent.

## ListBox / ComboBox

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `highlightColour(...)` | `style.highlightColor` (listBox) | ✅ |
| `highlightedItemColour(...)` / `highlightedTextColour(...)` | no direct equivalent | ❌ |
| `protectedItems(...)` | no equivalent | ❌ |
| `numberOfClicks(n)` | no direct equivalent | ❌ |
| `sort(...)` | `populate.order` | ⚠️ |
| `populate(filetype, dir, ignore)` | `populate.{fileType,directories}` | ✅ |
| `ignoreLastOpenedDir(...)` / `refreshFiles(...)` | `populate` | ⚠️ |

## GroupBox

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `lineThickness(n)` | `style.borderWidth` | ✅ |
| `titleBarColour(...)` | no direct title-bar colour | ❌ |
| `titleBarGradient(...)` / `titleBarHeight(n)` | no equivalent | ❌ |

## TextEditor

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `caretColour(...)` | no direct caret colour | ❌ |
| `readOnly(n)` | `readOnly` | ✅ |
| `scrollbars(n)` | `scrollbars` | ✅ |
| `wrap(n)` | `wrap` | ✅ |
| `doubleClickTogglesEdit(n)` | no equivalent | ❌ |
| `mode("single"/"multi")` | no direct multiline flag — verify | ⚠️ |

## Image

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `crop(x,y,w,h)` | `crop` (verify shape) | ⚠️ |
| `imgFile(...)` | `file` / `svg.markup` | ✅ |
| `svgElement(...)` | `svg.markup` | ✅ |
| `mouseInteraction(n)` | no direct equivalent | ❌ |
| `rotate(...)` | `rotate.{x,y,radians}` | ✅ |
| `shape(...)` | `style.borderRadius` | ⚠️ |

## Form / build-level

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `guiMode("polling"/"queue")` | dropped — Cabbage 3 always uses the queue model | ❌ |
| `guiRefresh(n)` | dropped | ❌ |
| `autoUpdate()` | dropped | ❌ |
| `bundle(...)` / `import(...)` | build/export config, not widget JSON | ❌ |
| `opcodeDir(...)` / `opcode6Dir64(...)` | build config | ❌ |
| `latency(n)` | `cabbageSet "form", "latency", n` | ✅ |
| `sideChain(...)` | no direct equivalent — verify | ⚠️ |
| `openGL(n)` | dropped | ❌ |
| `manufacturer(...)` / `author(...)` | metadata | ⚠️ |
| `factoryFolder(...)` / `userFolder(...)` | build config | ❌ |

## Deprecated / z-order

| Cabbage 2 | Cabbage 3 | Status |
|---|---|---|
| `moveBehind("w")` / `toFront(...)` | `zIndex` | ✅ (rewrite) |
| `parent(...)` | `children` nesting | ✅ |

---

## Widget type renames

See rules doc §1 for the full `rslider`→`rotarySlider`, `hslider`→`horizontalSlider`, `combobox`→`comboBox`, etc. table. `soundfiler` maps to `genTable` (waveform viewer; see the GenTable / Soundfiler section below). Additional Cabbage 2 types with no stock Cabbage 3 widget: `hmeter`/`vmeter`, `signaldisplay`, `eventsequencer`, `fftdisplay`, `encoder`, `textbox`, `light`, `screw`, `cvoutput`/`cvinput`, `oscserver`, `popupmenu`, `sourcebutton`, `path`, `presetbutton`, `loadbutton`, `directorylist`, `stepper`.

## Reserved channels (not widget identifiers)

Host/transport channels remain plain Csound control channels in Cabbage 3 (still read via `chnget`), but several were renamed with a `HOST_` prefix:

| Cabbage 2 | Cabbage 3 |
|---|---|
| `HOST_BPM` | `HOST_BPM` |
| `HOST_PPQ_POS` | `HOST_PPQ_POS` |
| `IS_PLAYING` | `HOST_IS_PLAYING` |
| `IS_RECORDING` | `HOST_IS_RECORDING` |
| `TIME_IN_SAMPLES` | `HOST_TIME_IN_SAMPLES` |
| `TIME_IN_SECONDS` | `HOST_TIME_IN_SECONDS` |
| `TIME_SIG_NUM` | `HOST_TIME_SIG_NUM` |
| `TIME_SIG_DENOM` | `HOST_TIME_SIG_DENOM` |

Mouse channels are **removed** — `MOUSE_X`, `MOUSE_Y`, `MOUSE_DOWN_*`, `MOUSEWHEEL_*` (and `LAST_FILE_DROPPED`/`LAST_TEXT_DROPPED`) have no Cabbage 3 equivalent. Mouse position is now delivered as widget channel events (`mouseMoveX`/`mouseMoveY`/`mouseDragX`/`mouseDragY`). A Cabbage 2 instrument reading `chnget "MOUSE_X"` needs a widget (typically a full-size `image`) with a `mouseMoveX` channel to recreate the same values.

Concrete recipe (see rules doc §19 for the full write-up):

| Cabbage 2 | Cabbage 3 channel id | event(s) | status |
|---|---|---|---|
| `MOUSE_X` | `mouseX` | `mouseMoveX` (range 0..formWidth) | ✅ auto-converted (mouse-only forms) |
| `MOUSE_Y` | `mouseY` | `mouseMoveY` (range 0..formHeight) | ✅ auto-converted (mouse-only forms) |
| `MOUSE_DOWN_LEFT` | `mouseDownLeft` | `mousePressLeft` + `mouseReleaseLeft` | ✅ auto-converted (mouse-only forms) |
| `MOUSE_DOWN_RIGHT` | `mouseDownRight` | `mousePressRight` + `mouseReleaseLeft` | ❌ manual review (right-click unsupported) |
| `MOUSE_DOWN_MIDDLE` | `mouseDownMiddle` | `mousePressMiddle` + … | ❌ manual review (middle-click unsupported) |
| `MOUSEWHEEL_*` | — | — | ❌ dropped |
| `LAST_FILE_DROPPED` / `LAST_TEXT_DROPPED` | — | — | ❌ dropped |

The converter adds a transparent full-size `image` overlay (`automatable: true`, high
`zIndex`) with the required channels and rewrites `chnget "MOUSE_X"` →
`cabbageGetValue "mouseX"` (etc.) — but only when the form has **no interactive
widgets** (sliders/buttons/genTable/keyboard/…). When interactive widgets are present it
leaves the `chnget` in place with a `; Cabbage2→3 MANUAL REVIEW:` marker and a
`varName = 0` definition (so the variable is still defined and downstream reads don't
error), and warns you to scope the overlay manually. It is clearly noted: a `"//"`
comment on the overlay, a `; Cabbage2→3: was chnget "…"` comment on each rewritten line,
and a summary/warning on import.
