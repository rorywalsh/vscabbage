# vscabbage 
 
> Cabbage 3 and the associated Visual Studio Code extension are currently in ***Alpha*** development. These releases are experimental and may undergo significant changes. Features are not final, and stability or performance may vary. Use at your own discretion, and expect frequent updates and potential breaking changes. Please report any issues on the Cabbage [forum](https://forum.cabbageaudio.com/).
 
Cabbage is a powerful and flexible software framework designed for prototyping and developing audio instruments using the Csound audio synthesis language. It offers an integrated workflow tailored for sound designers, musicians, composers, and developers who want to build custom synthesizers, audio effects, and interactive sound tools. With its seamless blend of coding, audio processing, and interface design, Cabbage enables rapid experimentation while maintaining professional-grade results.

Instrument development is streamlined through a dedicated Cabbage extension for Visual Studio Code. This extension enhances the development experience with features such as syntax highlighting, intelligent code assistance, real-time previews, and a set of tools built specifically to support the Cabbage/Csound workflow. These capabilities allow users to iterate quickly and efficiently without leaving the editor.

Beyond audio processing, Cabbage includes a built-in graphical UI editor that lets users design and customize instrument frontends directly within VS Code. This integrated editor makes it easy to create visually polished, interactive interfaces—complete with sliders, buttons, meters, and more—without relying on external design tools. When an instrument is ready, Cabbage can export it as a fully functional audio plugin in VST3 or AU formats, enabling smooth integration into digital audio workstations across multiple platforms.

This repository contains the source code for the Cabbage Visual Studio Code extension. The extension serves as a bridge between VS Code and the Cabbage plugin-development framework for Csound, providing all the tools necessary to create, edit, preview, and test Cabbage instruments directly inside the editor. More info can be found [here](https://rorywalsh.github.io/cabbage3docs/docs/intro)

## Repository Structure

### Core Architecture

The extension is divided into two main components:

**Extension Host** (`src/commands.ts`, `src/extensionUtils.ts`)
- VS Code extension backend running in Node.js
- Manages file I/O, CSD file parsing and generation, widget serialization
- Handles webview communication and document updates
- Executes VS Code commands (widget creation, deletion, grouping)

**Webview UI** (`src/cabbage/`, `src/propertyPanel.js`, `src/widgetClipboard.js`)
- Interactive UI rendered in a webview panel
- Real-time widget preview and manipulation
- Property editing interface with live updates
- Canvas-based rendering for performance-heavy widgets

### Key Directories

- **`src/`** - TypeScript extension source code
  - `commands.ts` - Main command handlers for VS Code
  - `extensionUtils.ts` - File manipulation, CSD parsing/serialization, deep merge logic
  - `settings.ts` - Configuration management
  
- **`src/cabbage/`** - Webview application (JavaScript)
  - `main.js` - Application entry point and initialization
  - `widgetManager.js` - Widget lifecycle management, instantiation from props
  - `eventHandlers.js` - User interactions (drag, drop, selection, grouping)
  - `propertyPanel.js` - Property editor with minimization logic
  - `sharedState.js` - Global state management (mode, widgets array, VSCode API)
  - `cabbage/widgets/` - Widget implementations (sliders, buttons, knobs, etc.)
  
- **`src/cabbage/widgets/`** - Individual widget components
  - Each widget (e.g., `rotarySlider.js`) handles rendering, interaction, and property updates
  - Widgets use SVG for vector graphics or Canvas for complex rendering (genTable)
  - `widgetWrapper.js` - Drag/drop and interact.js integration
  
- **`src/media/`** - CSS stylesheets for webview UI
- **`assets/`** - Static resources and binary files
- **`examples/`** - Sample Cabbage instruments (CSD files)

### Property System

The extension uses a sophisticated property management system to handle the dual representation of widgets:

**Serialization** - Properties are minimized when saved to the CSD file (only non-default values)
**Runtime** - Properties are expanded with all defaults when loaded into the webview

Key concepts:
- `widget.props` - Expanded runtime properties with all defaults applied
- `widget.originalProps` - Minimized properties from the CSD file (used for reference)
- `widget.rawDefaults` - Default values for the widget type
- `widget.serializedChildren` - Minimized children array (preserved through drag operations)

### Data Flow

1. **Load**: CSD file → Extension parses JSON → Webview instantiates widgets with defaults applied
2. **Edit**: User modifies widget (property panel, drag, resize) → Webview minimizes props → Extension updates CSD
3. **Save**: Extension writes minimized JSON to CSD file
4. **Reload**: CSD file changed → Extension notifies webview → Webview reloads widgets

### Build and Development

- **Build**: `npm run compile` (webpack TypeScript compilation)
- **Watch**: `npm run watch` (continuous rebuild)
- **Package**: `npm run package` (production bundle with source maps)

### Important Files

- `package.json` - Extension manifest, dependencies, commands
- `tsconfig.json` - TypeScript configuration
- `webpack.config.js` - Webpack bundling configuration
- `.vscodeignore` - Files excluded from packaged extension