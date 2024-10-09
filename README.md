# vscabbage 

This repo contains the source for the vscabbage extension, which embeds the Cabbage plugin development framework into VS-Code. To build, clone this repo, cd to repo and run 

`npm install`

The press F5 to launch extension in new window. Open a simple .csd file. Press Ctrl/Cmd+Shift+P and select the Cabbage:Launch UI Editor command to open the editor. Then hit save in your csd to see the plugin interface in a vscode panel. 

The source is split into two areas. The top level directory containing the .ts files relates directly to the extension itself. The `cabbage` directory contains JS files need by the extension, and all Cabbage plugins that use the native widgets.  If you are creating custom widgets, then the only file you need is cabbage.js which defines a custom Cabbage class that takes care of communication between the web based frontend and the plugin. 

More information about the files in the `cabbage` directory can be found in the `cabbage/readme.md` 