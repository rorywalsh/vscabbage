# Widget kits

A widget kit is a themed replacement set for the built-in widgets. Unlike a
normal custom widget category, a kit **may redeclare a built-in widget type**.
That is how a kit themes `button`, `rotarySlider`, etc. without changing the
`.csd`: the file still says `"type": "button"`, but the active kit decides which
class backs it.

## Layout

```
widgets/
  kits/
    StudioDark/
      kit.json          # optional metadata
      button.js         # exports class Button, props.type = "button"
      rotarySlider.js
      inputs/
        MyKnob.js       # kit-only widget, grouped under "inputs"
```

- Kit folders can live here (bundled with the extension) or under
  `<customRoot>/cabbage/widgets/kits/` for user kits.
- The folder name is the kit id unless `kit.json` provides one.
- The order of precedence is: bundled kit, then user kit.
- Kit widgets with a type that is not built-in appear under the kit's name in
  the insert menu.

## `kit.json`

```json
{
  "id": "studio-dark",
  "name": "Studio Dark",
  "description": "A darker take on the built-in widgets"
}
```

All fields are optional. If `kit.json` is missing, the folder name is used as
the kit id and display name.

## Imports

Kit widgets should use the stable import aliases rather than relative paths:

```js
import { Cabbage } from "cabbage";
import { CabbageUtils } from "cabbage/utils.js";
```

The webview provides an import map for `cabbage` and `cabbage/*`, so these work
at any folder depth.

## Selecting a kit

Set `cabbage.widgetKit` to the kit id (for example `studio-dark`). Leave it empty
to use the built-in widgets. Reload the instrument after changing it.
