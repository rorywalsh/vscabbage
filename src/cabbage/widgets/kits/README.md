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

## Styling

Each widget owns its own styling; there is no shared kit stylesheet mechanism.

- **Simplest:** use inline `style="..."` attributes in `getInnerHTML()` (this is
  what `CustomWidgetTemplate.js` does).
- **Class-based CSS** (`:hover`, pseudo-elements, `@keyframes`) can be added by
  returning a `<style>` block, but that duplicates the rules per widget
  instance. To add the rules once, guard an injection from the widget code:

  ```js
  if (!window.__studioDarkButtonStyle) {
      const style = document.createElement('style');
      style.textContent = `
          .sd-button:hover { filter: brightness(1.2); }
      `;
      document.head.appendChild(style);
      window.__studioDarkButtonStyle = true;
  }
  ```

- Do **not** use `import './style.css'` — widget files are loaded as native ES
  modules in the webview, and browsers cannot import CSS that way.

## Selecting a kit

Set `cabbage.widgetKit` to the kit id (for example `studio-dark`). Leave it empty
to use the built-in widgets. Reload the instrument after changing it.

## Exporting

When you export a plugin, the active kit is copied into the exported
`cabbage/widgets/kits/` folder. Widgets that override a built-in type are wired
up through small re-export shims in `cabbage/widgets/`, so the exported plugin
uses the kit's classes without changing the `.csd`.

