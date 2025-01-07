# vscabbage 

> Cabbage 3 and the associated Visual Studio Code extension are currently in ***Alpha*** development. These releases are experimental and may undergo significant changes. Features are not final, and stability or performance may vary. Use at your own discretion, and expect frequent updates and potential breaking changes.

This repository contains the source code for the Cabbage Visual Studio Code extension, which provides an interface to the Cabbage plugin development framework for Csound within Visual Studio Code. The extension allows users to create, edit, and test Cabbage instruments directly within VS Code. More info can be found [here](https://rorywalsh.github.io/cabbage3website/docs/intro)


## Building

To build, clone this repo, cd to repo and run 

`npm install`

Then press F5 to launch the extension in a new window. Open a simple .csd file. Press Ctrl/Cmd+Shift+P and select the Cabbage:Launch UI Editor command to open the editor. Then hit save in your csd to see the plugin interface in a vscode panel. 

The source is split into two areas. The top-level directory containing the .ts files relates directly to the extension itself. The `cabbage` directory contains JS files needed by the extension, and all Cabbage plugins that use the native widgets. If you are creating custom widgets, then the only file you need is `cabbage.js`, which defines a custom Cabbage class that takes care of communication between the web-based frontend and the plugin. 

More information about the files in the `cabbage` directory can be found in the `cabbage/readme.md`.