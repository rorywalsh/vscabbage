# vscabbage 

> Cabbage 3 and the associated Visual Studio Code extension are currently in ***Alpha*** development. These releases are experimental and may undergo significant changes. Features are not final, and stability or performance may vary. Use at your own discretion, and expect frequent updates and potential breaking changes.

This repository contains the source code for the Cabbage Visual Studio Code extension, which provides an interface to the Cabbage plugin development framework for Csound within Visual Studio Code. The extension allows users to create, edit, and test Cabbage instruments directly within VS Code. The extension will not function without having the Cabbage service app and plugin package which are available as a separate download from the [Cabbage3 GitHub Actions](https://github.com/rorywalsh/cabbage3/actions). Details about how to connect the VS Code extension to the service app are provided in the [Key Steps for Using vscabbage](#key-steps-for-using-vscabbage) section.  

## Table of Contents
- [Installing](#installing)
- [Features Overview](#features-overview)
- [Working with the Instrument UI](#working-with-the-instrument-ui)
- [Key Steps for Using vscabbage](#key-steps-for-using-vscabbage)
- [List of Commands](#list-of-commands)
- [Configuration Properties](#configuration-properties)
- [Building](#building)

## Installing 

The `vscabbage` extension is not yet available from the VS Code marketplace. Therefore it must be installed locally. Here is a step by step guide:

#### 1. Access the GitHub Actions Artifacts

* Navigate to Actions: Click on the Actions tab at the top of the this page. This will show you a list of recent workflows that have been run.

* Find the Workflow Run: Look for and select the latest successful workflow run (marked with a green checkmark).

* Download the Artifact: Scroll down to the Artifacts section of the workflow run page.
You should see a downloadable artifact, usually named after the workflow step that created it, like vscabbage.vsix.
Click on the artifact to download the .vsix file to your computer.


#### 2. Install the .vsix File in VS Code
Once you have the .vsix file downloaded, follow these steps to install it:

* Open Visual Studio Code.
* Go to Extensions View: Click on the Extensions icon in the Activity Bar or use the shortcut Ctrl+Shift+X (Windows/Linux) or Cmd+Shift+X (Mac).
* Install from VSIX: Click on the More Actions button (three dots ...) in the Extensions view's top-right corner.
Select Install from VSIX....
In the file picker, locate and select the downloaded vscabbage.vsix file.
* Confirm Installation: VS Code will prompt you to confirm the installation. Click Install. If required, Reload VS Code to activate the extension.

The `vscabbage` extension should now be installed and active in your local VS Code environment! You can find it in the Extensions list and test it as if it were installed from the Marketplace.


## Features Overview
Once vscabbage is enabled in Visual Studio Code, the extension will automatically attempt to load any Cabbage 3 instrument definitions in a preview web panel each time you save a .csd file (Cabbage Sound Document). This live preview allows you to view and interact with the instrument's user interface as it would appear in a Cabbage application, giving you immediate feedback on your design.

## Working with the Instrument UI
To access Edit Mode, open the command palette (press Ctrl+Shift+P on Windows/Linux or Cmd+Shift+P on macOS) and select the vscabbage: Enter Edit Mode command. In Edit Mode, you can adjust widget properties such as dimensions, colors, fonts, and more to customize your instrument's UI. Each modification updates the instrument's Cabbage JSON code in real-time, enabling quick iteration.

Once you’re satisfied with your changes, save the .csd file. Saving will close the UI editor and return you to Performance Mode, where you can test the instrument as it would appear in a live environment.

## Key Steps for Using vscabbage

* Enable the Extension: Ensure vscabbage is enabled in Visual Studio Code.

* Set the path to the Cabbage binary via the command palette (details on using the command palette are provide below).

* Edit and Save: Edit your .csd files, and vscabbage will load the instrument in a preview web panel on each save.

* Switch to Edit Mode: Use the command palette to enter Edit Mode and adjust UI widget properties.

* Return to Performance Mode: Save the file to exit Edit Mode and test the instrument in its final state.

This extension provides a streamlined workflow for designing and testing instruments within Visual Studio Code, with full access to Cabbage's powerful UI and audio capabilities.

## List of commands

The following commands are all accessible from the command palette. To access the command palette in Visual Studio Code, you can use the following keyboard shortcuts:

- **Windows/Linux**: Press `Ctrl + Shift + P`
- **macOS**: Press `Cmd + Shift + P`

Once the command palette is open, you can start typing the name of the command you want to execute. For example, you can type "Cabbage" to filter the commands related to the Cabbage extension. Select the desired command from the list to execute it. Below are the commands currently provided. 

1. **Launch Cabbage**
   - Launches the Cabbage application.

2. **Edit Mode**
   - Toggles the edit mode for the Cabbage interface.

3. **Format Document**
   - Formats the current document according to Cabbage formatting rules.

4. **Expand Cabbage section**
   - Expands the Cabbage section in the current document for easier editing.

5. **Select Sampling Rate**
   - Opens a prompt to select the audio sampling rate for the project.

6. **Select Buffer Size**
   - Opens a prompt to select the audio buffer size for the project.

7. **Select Audio Output Device**
   - Opens a prompt to select the audio output device.

8. **Select Audio Input Device**
   - Opens a prompt to select the audio input device.

9. **Select MIDI Input Device**
   - Opens a prompt to select the MIDI input device.

10. **Select MIDI Output Device**
    - Opens a prompt to select the MIDI output device.

11. **Set Cabbage source path**
    - Opens a dialog to set the path to the Cabbage JS source directory. 
    > This is set to the extension path by default and should not be overridden unless you know what you are doing!

12. **Set path to the Cabbage binary**
    - Opens a dialog to set the path to the Cabbage binary executable, that is CabbageApp.app on MacOS and CabbageApp.exe on Windows. 

## Configuration Properties

The following configuration properties can be set in the settings for the Cabbage extension:

- **cabbage.pathToCabbageBinary**: 
  - Path to the Cabbage service app (use command palette to browse for directory).

- **cabbage.pathToJsSource**: 
  - Path to the Cabbage Javascript directory.

- **cabbage.audioOutputDevice**: 
  - Selected audio output device. Use command palette to change.

- **cabbage.audioInputDevice**: 
  - Selected audio input device. Use command palette to change.

- **cabbage.midiOutputDevice**: 
  - Selected MIDI output device. Use command palette to change.

- **cabbage.midiInputDevice**: 
  - Selected MIDI input device. Use command palette to change.

- **cabbage.audioSampleRate**: 
  - Selected sampling rate. Use command palette to change.

- **cabbage.audioBufferSize**: 
  - Selected buffer size. Use command palette to change.

- **cabbage.snapToSize**: 
  - Set the number of pixels to move by when dragging an element.

- **cabbage.saveExternalJSON**: 
  - Enable automatic saving of external JSON when compiling .csd file.

- **cabbage.showUIOnSave**: 
  - Display UI each time a Cabbage .csd file is saved.

- **cabbage.defaultJsonFormatting**: 
  - Choose an option for JSON formatting, either "Single line objects" or "Multiline objects".


## Building

To build, clone this repo, cd to repo and run 

`npm install`

Then press F5 to launch the extension in a new window. Open a simple .csd file. Press Ctrl/Cmd+Shift+P and select the Cabbage:Launch UI Editor command to open the editor. Then hit save in your csd to see the plugin interface in a vscode panel. 

The source is split into two areas. The top-level directory containing the .ts files relates directly to the extension itself. The `cabbage` directory contains JS files needed by the extension, and all Cabbage plugins that use the native widgets. If you are creating custom widgets, then the only file you need is `cabbage.js`, which defines a custom Cabbage class that takes care of communication between the web-based frontend and the plugin. 

More information about the files in the `cabbage` directory can be found in the `cabbage/readme.md`.