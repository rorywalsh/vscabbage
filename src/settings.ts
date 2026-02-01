// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import * as vscode from 'vscode';
import { Commands } from './commands';
import os from 'os';
import path from 'path';
import fs from 'fs';

export class Settings {

    private static async copyDirectoryRecursive(source: string, target: string, shouldCopyFile?: (sourcePath: string, name: string, type: vscode.FileType) => boolean) {
        const sourceUri = vscode.Uri.file(source);
        const targetUri = vscode.Uri.file(target);

        // Create target directory if it doesn't exist
        try {
            await vscode.workspace.fs.createDirectory(targetUri);
        } catch (err) {
            // Directory might already exist, that's okay
        }

        // Read source directory
        const entries = await vscode.workspace.fs.readDirectory(sourceUri);

        for (const [name, type] of entries) {
            const sourcePath = path.join(source, name);
            const targetPath = path.join(target, name);

            // Check if we should copy this file/directory
            if (shouldCopyFile && !shouldCopyFile(sourcePath, name, type)) {
                continue; // Skip this file/directory
            }

            if (type === vscode.FileType.Directory) {
                // Recursively copy subdirectory
                await Settings.copyDirectoryRecursive(sourcePath, targetPath, shouldCopyFile);
            } else {
                // Copy file
                const sourceFileUri = vscode.Uri.file(sourcePath);
                const targetFileUri = vscode.Uri.file(targetPath);
                const data = await vscode.workspace.fs.readFile(sourceFileUri);
                await vscode.workspace.fs.writeFile(targetFileUri, data);
            }
        }
    }

    private static getDefaultSettings() {
        return `
    {
        "currentConfig": {
            "audio": {},
            "jsSourceDir": ["${Settings.getPathJsSourceDir()}"],
            "midi": {}
        },
        "systemAudioMidiIOListing": {\\
            "audioDrivers": "",
            "audioInputDevices": {},
            "audioOutputDevices": {},
            "midiInputDevices": {},
            "midiOutputDevices": {}
        }
    }`;
    };

    static getPathJsSourceDir(): string {
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (extension) {
            Commands.getOutputChannel().appendLine('Cabbage: extension path: ' + extension.extensionPath);
            // Construct the path to the src directory
            const returnPath = path.join(extension.extensionPath, 'src');
            // Replace backslashes with forward slashes
            const posixPath = returnPath.split(path.sep).join(path.posix.sep);
            return posixPath;
        }
        else {
            Commands.getOutputChannel().appendLine('Cabbage: Extension not found');
        }
        return ''; // Return an empty string if the extension is not found
    }

    static getCabbageBinaryPath(type: string): string {
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        const config = vscode.workspace.getConfiguration("cabbage");
        let binaryPath = config.get<string>("pathToCabbageBinary") || '';
        if (extension) {
            if (binaryPath === '') {
                binaryPath = path.join(extension.extensionPath, 'src', 'CabbageBinaries');
            }
            // Construct the path to the src directory
            switch (type) {
                case 'CabbageApp':
                    ////for windows CabbageApp_x64.exe
                    return path.join(binaryPath, os.platform() === 'win32' ? 'CabbageApp.exe' : 'CabbageApp');
                case 'CabbagePluginEffect':
                    return path.join(binaryPath, 'CabbagePluginEffect.vst3');
                case 'CabbagePluginSynth':
                    return path.join(binaryPath, 'CabbagePluginSynth.vst3');
                case 'CabbagePluginCLAPEffect':
                    return path.join(binaryPath, 'CabbagePluginEffect.clap');
                case 'CabbagePluginCLAPSynth':
                    return path.join(binaryPath, 'CabbagePluginSynth.clap');
                case 'CabbageAUv2Effect':
                    return path.join(binaryPath, 'CabbagePluginEffectAUv2.component');
                case 'CabbageAUv2Synth':
                    return path.join(binaryPath, 'CabbagePluginSynthAUv2.component');
                case 'CabbageAUv2MidiFx':
                    return path.join(binaryPath, 'CabbagePluginMidiFxAUv2.component');
                // case 'CabbageStandaloneApp':
                //     return path.join(binaryPath, 'CabbageStandaloneApp.app');
                default:
                    return '';
            }
        }
        return ''; // Return an empty string if the extension is not found
    }

    static getCabbageProBinaryPath(type: string): string {
        const config = vscode.workspace.getConfiguration("cabbage");
        const proBinaryPath = config.get<string>("pathToCabbageProBinary") || '';

        if (proBinaryPath === '') {
            return '';
        }

        switch (type) {
            case 'CabbageApp':
                const binaryName = os.platform() === 'win32' ? 'CabbageApp.exe' : 'CabbageApp';
                return path.join(proBinaryPath, 'CabbageServiceApp', binaryName);
            case 'CabbageProPluginEffect':
                return path.join(proBinaryPath, 'VST3', 'CabbagePluginEffect.vst3');
            case 'CabbageProPluginSynth':
                return path.join(proBinaryPath, 'VST3', 'CabbagePluginSynth.vst3');
            case 'CabbageProPluginCLAPEffect':
                return path.join(proBinaryPath, 'CLAP', 'CabbagePluginEffect.clap');
            case 'CabbageProPluginCLAPSynth':
                return path.join(proBinaryPath, 'CLAP', 'CabbagePluginSynth.clap');
            case 'CabbageProAUv2Effect':
                return path.join(proBinaryPath, 'AU', 'CabbagePluginEffectAUv2.component');
            case 'CabbageProAUv2Synth':
                return path.join(proBinaryPath, 'AU', 'CabbagePluginSynthAUv2.component');
            case 'CabbageProAUv2MidiFx':
                return path.join(proBinaryPath, 'AU', 'CabbagePluginMidiFxAUv2.component');
            case 'CabbageProCLI':
                const cliName = os.platform() === 'win32' ? 'cabbagepro-cli.exe' : 'cabbagepro-cli';
                return path.join(proBinaryPath, 'cli', cliName);
            default:
                return '';
        }
    }

    static async getCabbageSettings() {
        // Get the current user's home directory
        const homeDir = os.homedir();
        // Build your path dynamically
        let settingsPath = "";

        if (os.platform() === 'darwin') {
            settingsPath = path.join(homeDir, 'Library', 'Application Support', 'Cabbage', 'settings.json'); // Updated path for macOS
        } else if (os.platform() === 'linux') {
            settingsPath = path.join(homeDir, '.config', 'Cabbage', 'settings.json');
        }
        else {
            settingsPath = path.join(homeDir, 'Local Settings', 'Application Data', 'Cabbage', 'settings.json');
        }
        const fileUri = vscode.Uri.file(settingsPath);

        try {
            // Try to read the settings file
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            const fileContent = new TextDecoder('utf-8').decode(fileData);
            return JSON.parse(fileContent); // Return the parsed JSON content if file exists
        } catch (error) {
            if (error instanceof Error && (error as any).code === 'FileNotFound') {
                console.log('Cabbage: Settings file not found. Creating a new one with default settings.');

                // Ensure the directory structure exists
                const directoryUri = vscode.Uri.file(path.dirname(settingsPath));
                try {
                    await vscode.workspace.fs.createDirectory(directoryUri);
                } catch (dirError) {
                    console.error('Cabbage: Error creating settings directory:', dirError);
                }

                // Write default settings to the new file
                try {
                    const fileContent = new TextEncoder().encode(Settings.getDefaultSettings());
                    await vscode.workspace.fs.writeFile(fileUri, fileContent);
                    return JSON.parse(Settings.getDefaultSettings()); // Return the default settings as JSON
                } catch (writeError) {
                    console.error('Cabbage: Error writing default settings to file:', writeError);
                }
            } else {
                console.error('Cabbage: Error reading file:', error);
            }
        }

        return {}; // Return empty object if file cannot be read or created
    }

    static async setCabbageSettings(newSettings: object) {
        // Get the path to the settings file
        let settingsPath = '';
        const homeDir = os.homedir();
        if (os.platform() === 'darwin') {
            settingsPath = path.join(homeDir, 'Library', 'Application Support', 'Cabbage', 'settings.json'); // Updated path for macOS
        } else if (os.platform() === 'linux') {
            settingsPath = path.join(homeDir, '.config', 'Cabbage', 'settings.json');
        }
        else {
            settingsPath = path.join(homeDir, 'Local Settings', 'Application Data', 'Cabbage', 'settings.json');
        }

        const fileUri = vscode.Uri.file(settingsPath);
        try {
            // Convert the JSON object to a string
            const fileContent = JSON.stringify(newSettings, null, 4); // Pretty print with 4-space indentation    
            // Encode the string to Uint8Array for writing
            const encodedContent = new TextEncoder().encode(fileContent);
            // Write the encoded string to the file, overwriting the existing contents
            await vscode.workspace.fs.writeFile(fileUri, encodedContent);
        } catch (error) {
            console.error('Cabbage: Error writing file:', error);
            vscode.window.showErrorMessage('Failed to update settings.');
        }
    }

    static async selectSamplingRate() {
        const config = vscode.workspace.getConfiguration('cabbage');
        // Retrieve the current settings from your configuration file
        let settings = await Settings.getCabbageSettings();
        console.log('Cabbage: Settings:', settings);
        let currentDevice = settings['currentConfig']['audio']['outputDevice'];
        console.log('Cabbage: Current device:', currentDevice);

        const audioOutputDevices = settings['systemAudioMidiIOListing']['audioOutputDevices'];

        if (!audioOutputDevices.hasOwnProperty(currentDevice)) {
            vscode.window.showErrorMessage('The current device is not available. Please try another device.');
            return;
        }

        if (!audioOutputDevices[currentDevice].hasOwnProperty('sampleRates')) {
            vscode.window.showErrorMessage('No sampling rates available for the current device. Please try another device.');
            return;
        }
        // Get the list of available sampling rates for the current device
        let samplingRates = settings['systemAudioMidiIOListing']['audioOutputDevices'][currentDevice]['sampleRates'];
        // Show available sample rates in a drop-down (QuickPick)
        const selectedRateStr = await vscode.window.showQuickPick(
            samplingRates.map((rate: { toString: () => any; }) => rate.toString()), // Convert to string for display
            { placeHolder: 'Select a sampling rate from the list' }
        );


        // If a valid sampling rate is selected, parse it to an integer and update the configuration
        if (selectedRateStr) {
            const selectedRate = Number(selectedRateStr); // Parse as a number
            if (!isNaN(selectedRate)) { // Ensure the selected rate is a valid number
                await config.update('audioSampleRate', selectedRate, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Sampling rate updated to: ${selectedRate}`);
                settings['currentConfig']['audio']['sr'] = selectedRate;
                await Settings.setCabbageSettings(settings);
            } else {
                vscode.window.showErrorMessage('Invalid sampling rate selected.');
            }
        } else {
            vscode.window.showWarningMessage('No sampling rate selected.');
        }

    }


    static async selectBufferSize() {
        const config = vscode.workspace.getConfiguration('cabbage');
        // Retrieve the current settings from your configuration file
        let settings = await Settings.getCabbageSettings();
        // Get the list of available sampling rates for the current device
        let bufferSizes =
            [16, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 480, 512, 576, 640, 704, 768, 832, 896, 960, 1024,
                1088, 1152, 1216, 1280, 1344, 1408, 1472, 1536, 1600, 1664, 1728, 1792, 1856, 1920, 1984, 2048, 2112, 2176, 2240, 2304,
                2368, 2432, 2496, 2560, 2624, 2688, 2752, 2816, 2880, 2944, 3008, 3072, 3136, 3200, 3264, 3328, 3392, 3456, 3520, 3584,
                3648, 3712, 3776, 3840, 3904, 3968, 4032, 4096
            ];

        // Show available sample rates in a drop-down (QuickPick)
        const selectedBufferSize = await vscode.window.showQuickPick(
            bufferSizes.map((rate: { toString: () => any; }) => rate.toString()), // Convert to string for display
            { placeHolder: 'Select a buffer size from the list' }
        );

        // If a valid sampling rate is selected, update the configuration
        if (selectedBufferSize) {
            await config.update('audioBufferSize', selectedBufferSize, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Buffer size updated to: ${selectedBufferSize}`);
            settings['currentConfig']['audio']['bufferSize'] = parseInt(selectedBufferSize);
            await Settings.setCabbageSettings(settings);
        } else {
            vscode.window.showWarningMessage('No buffer size selected.');
        }
    }

    static async selectAudioDriver() {
        const config = vscode.workspace.getConfiguration('cabbage');
        let settings = await Settings.getCabbageSettings();

        if (os.platform() === 'win32') {
            const drivers = settings.systemAudioMidiIOListing.audioDrivers; // Now correctly treated as an array

            const selectedDriver = await vscode.window.showQuickPick(
                drivers, // Directly pass the array as it's already a list of strings
                { placeHolder: `Select an audio driver` }
            );

            if (selectedDriver) {
                const selectedIndex = drivers.indexOf(selectedDriver);

                await config.update(`audioDriver`, selectedIndex, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`Selected driver index: ${selectedIndex}`);

                settings['currentConfig']['audio']['driver'] = selectedIndex;
                await Settings.setCabbageSettings(settings);
            } else {
                vscode.window.showWarningMessage(`No driver selected.`);
            }
        } else {
            vscode.window.showWarningMessage('Audio drivers can only be selected on Windows.');
        }
    }



    static async selectAudioDevice(type: 'input' | 'output') {
        const config = vscode.workspace.getConfiguration('cabbage');
        let settings = await Settings.getCabbageSettings();

        // Get the list of available devices based on the type (input or output)
        const devices = Object.keys(type === 'output' ? settings.systemAudioMidiIOListing.audioOutputDevices : settings.systemAudioMidiIOListing.audioInputDevices);

        // Show available devices in a drop-down (QuickPick)
        const selectedDevice = await vscode.window.showQuickPick(
            devices.map(device => device.toString()), // Convert to string for display
            { placeHolder: `Select an audio ${type} device` }
        );

        // If a valid device is selected, update the configuration and save settings
        if (selectedDevice) {
            await config.update(`audio${type.charAt(0).toUpperCase() + type.slice(1)}Device`, selectedDevice, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Selected ${type} device: ${selectedDevice}`);
            settings['currentConfig']['audio'][`${type}Device`] = selectedDevice;
            await Settings.setCabbageSettings(settings);
        } else {
            vscode.window.showWarningMessage(`No ${type} device selected.`);
        }
    }

    static async updatePath(event: vscode.ConfigurationChangeEvent) {
        let settings = await Settings.getCabbageSettings();
        const config = vscode.workspace.getConfiguration('cabbage');

        // Check if any of the OS-specific configurations have changed.
        if (
            event.affectsConfiguration('cabbage.pathToJsSourceWindows') ||
            event.affectsConfiguration('cabbage.pathToJsSourceMacOS') ||
            event.affectsConfiguration('cabbage.pathToJsSourceLinux')
        ) {
            let newPath = '';

            // Use os.platform() to determine the current OS and get the corresponding config.
            switch (os.platform()) {
                case 'win32':
                    newPath = config.get('pathToJsSourceWindows', '');
                    break;
                case 'darwin':
                    newPath = config.get('pathToJsSourceMacOS', '');
                    break;
                case 'linux':
                    newPath = config.get('pathToJsSourceLinux', '');
                    break;
                default:
                    vscode.window.showWarningMessage(`Unsupported platform: ${os.platform()}`);
                    return;
            }

            // Update the settings with the new path. Store as array for multiple sources support.
            settings['currentConfig']['jsSourceDir'] = newPath ? [newPath] : [];
            await Settings.setCabbageSettings(settings);
        }

        // If the user changed or reset the list of custom widget directories in
        // VS Code settings, update our external Cabbage settings file so the
        // backend (and extension) stay in sync. This handles the case where the
        // user resets the VS Code setting (removing their custom paths) and
        // expects those locations to be removed from the Cabbage settings file
        // as well.
        if (event.affectsConfiguration('cabbage.customWidgetDirectories')) {
            try {
                // Read the VS Code setting (may be undefined/null if reset)
                const customDirs = config.get<string[]>('customWidgetDirectories') || [];

                const defPath = Settings.getPathJsSourceDir();

                // Normalize existing jsSourceDir into an array
                const current = settings['currentConfig']['jsSourceDir'];
                let dirs: string[] = [];
                if (Array.isArray(current)) {
                    dirs = current as string[];
                } else if (typeof current === 'string' && current.length > 0) {
                    dirs = [current as string];
                } else {
                    dirs = [];
                }

                // Build the new list: ensure default path is present, then append
                // all custom dirs from the VS Code setting (in that order).
                const newDirs: string[] = [];
                if (defPath && !newDirs.includes(defPath)) newDirs.push(defPath);
                for (const d of customDirs) {
                    if (d && !newDirs.includes(d)) newDirs.push(d);
                }

                // If the VS Code setting was reset to empty, this will result in
                // only the default path being kept. Persist the new settings.
                settings['currentConfig']['jsSourceDir'] = newDirs;
                await Settings.setCabbageSettings(settings);

                // Trigger a backend rescan so the change takes effect immediately
                // (restartBackend command is already used elsewhere in the
                // extension).
                try {
                    await vscode.commands.executeCommand('cabbage.restartBackend');
                } catch (cmdErr) {
                    // Non-fatal; command might not be registered at the moment.
                    console.warn('Cabbage: Failed to execute restartBackend command:', cmdErr);
                }
            } catch (err) {
                console.error('Cabbage: Error syncing customWidgetDirectories to settings file:', err);
            }
        }
    }

    /**
     * Prompts the user to select a custom widget directory and stores it alongside
     * the default JS source directory. The selected directory will be appended to
     * currentConfig.jsSourceDir (an array). Duplicate paths are ignored.
     */
    static async selectCustomWidgetDirectory() {
        let settings = await Settings.getCabbageSettings();

        const selectedPath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select custom widget directory'
        });

        if (!selectedPath || selectedPath.length === 0) {
            return;
        }

        const folderPath = selectedPath[0].fsPath;
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (!extension) {
            vscode.window.showErrorMessage('Cabbage: Extension not found.');
            return;
        }

        // Copy the cabbage folder structure to the custom widget directory
        const sourceCabbageDir = path.join(extension.extensionPath, 'src', 'cabbage');
        const targetCabbageDir = path.join(folderPath, 'cabbage');

        // List of built-in widget files to exclude from copying
        const builtInWidgetFiles = [
            'button.js', 'checkBox.js', 'comboBox.js', 'csoundOutput.js',
            'fileButton.js', 'form.js', 'genTable.js', 'groupBox.js',
            'horizontalRangeSlider.js', 'horizontalSlider.js', 'image.js',
            'infoButton.js', 'keyboard.js', 'label.js', 'listBox.js',
            'numberSlider.js', 'optionButton.js', 'rotarySlider.js',
            'textEditor.js', 'verticalSlider.js', 'xyPad.js'
        ];

        try {
            // Copy the entire cabbage directory recursively, excluding internal widget files
            await Settings.copyDirectoryRecursive(sourceCabbageDir, targetCabbageDir, (sourcePath, name, type) => {
                // If this is a file in the widgets directory, check if it's a built-in widget
                if (type === vscode.FileType.File && sourcePath.includes(path.join('cabbage', 'widgets'))) {
                    // Skip built-in widget files
                    if (builtInWidgetFiles.includes(name)) {
                        Commands.getOutputChannel().appendLine(`Cabbage: Skipping internal widget file: ${name}`);
                        return false; // Don't copy this file
                    }

                    // Also skip any existing files in the widgets folder to preserve custom widgets
                    // (except CustomWidgetTemplate.js which should be updated)
                    if (name !== 'CustomWidgetTemplate.js') {
                        const targetFilePath = sourcePath.replace(sourceCabbageDir, targetCabbageDir);
                        try {
                            // Check if file exists to preserve custom widgets
                            if (fs.existsSync(targetFilePath)) {
                                Commands.getOutputChannel().appendLine(`Cabbage: Preserving existing custom widget: ${name}`);
                                return false; // Don't overwrite existing custom widget
                            }
                        } catch (err) {
                            // File doesn't exist, proceed with copy
                        }
                    }
                }
                return true; // Copy everything else (and overwrite infrastructure files)
            });
            Commands.getOutputChannel().appendLine(`Cabbage: Copied cabbage folder structure to ${targetCabbageDir} (excluding internal widget files)`);
        } catch (err) {
            console.error('Cabbage: Failed to copy cabbage folder', err);
            vscode.window.showErrorMessage(`Cabbage: Failed to copy cabbage folder: ${String(err)}`);
            return;
        }

        // Normalise into array and append if not present
        const defPath = Settings.getPathJsSourceDir();
        const current = settings['currentConfig']['jsSourceDir'];
        let dirs: string[] = [];
        if (Array.isArray(current)) {
            dirs = current as string[];
        } else if (typeof current === 'string' && current.length > 0) {
            dirs = [current as string];
        } else {
            dirs = [];
        }

        // Ensure default path is present
        if (defPath && !dirs.includes(defPath)) {
            dirs.unshift(defPath);
        }

        // Append custom folder if not already present
        if (!dirs.includes(folderPath)) {
            dirs.push(folderPath);
        }

        settings['currentConfig']['jsSourceDir'] = dirs;
        await Settings.setCabbageSettings(settings);

        // Also update VS Code settings for visibility
        const customDirs = dirs.filter(d => d !== defPath);
        const config = vscode.workspace.getConfiguration('cabbage');
        await config.update('customWidgetDirectories', customDirs, vscode.ConfigurationTarget.Global);

        // Trigger a rescan by sending backend restart command if there's an active panel
        // This ensures the new custom widget directory is picked up immediately
        await vscode.commands.executeCommand('cabbage.restartBackend');

        vscode.window.showInformationMessage(`Cabbage: Custom widget directory set to ${folderPath}\nCabbage folder structure copied successfully.`);
    }

    /**
     * Creates a new custom widget from the template, prompting the user to choose the save location.
     * The custom widgets directory is used as the default location.
     * Fails with an error if no custom directory is configured.
     */
    static async createNewCustomWidget() {
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (!extension) {
            vscode.window.showErrorMessage('Cabbage: Extension not found.');
            return;
        }

        // Resolve template path
        const templatePath = path.join(extension.extensionPath, 'src', 'cabbage', 'widgets', 'CustomWidgetTemplate.js');

        // Load settings and extract js source directories
        const settings = await Settings.getCabbageSettings();
        const defPath = Settings.getPathJsSourceDir();
        const jsSource = settings['currentConfig']['jsSourceDir'];
        const dirs: string[] = Array.isArray(jsSource) ? jsSource as string[] : (typeof jsSource === 'string' && jsSource.length > 0) ? [jsSource as string] : [];

        // Custom directories are those not equal to the default extension src path
        const customDirs = dirs.filter(d => d !== defPath);
        if (customDirs.length === 0) {
            vscode.window.showErrorMessage('Cabbage: No custom widget directory configured. Use "Cabbage: Set Custom Widget Directory" first.');
            return;
        }

        // If multiple, ask user to choose the default directory
        let defaultDir = customDirs[0];
        if (customDirs.length > 1) {
            const picked = await vscode.window.showQuickPick(customDirs, { placeHolder: 'Select the default directory for the new widget' });
            if (!picked) return;
            defaultDir = picked;
        }

        // Default to the widgets subdirectory
        const defaultWidgetsDir = path.join(defaultDir, 'cabbage', 'widgets');
        const defaultUri = vscode.Uri.file(defaultWidgetsDir);

        // Prompt user to choose save location
        const saveUri = await vscode.window.showSaveDialog({
            defaultUri: defaultUri,
            filters: {
                'JavaScript files': ['js']
            },
            saveLabel: 'Create Custom Widget'
        });

        if (!saveUri) {
            return; // User cancelled
        }

        // List of built-in widget types to prevent conflicts
        const builtInWidgets = [
            'rotarySlider', 'horizontalSlider', 'horizontalRangeSlider', 'verticalSlider', 'numberSlider',
            'keyboard', 'form', 'button', 'fileButton', 'infoButton', 'optionButton',
            'genTable', 'label', 'image', 'listBox', 'comboBox', 'groupBox', 'checkBox',
            'csoundOutput', 'textEditor', 'xyPad'
        ];


        // Extract class name from filename (remove .js extension)
        const fileName = path.basename(saveUri.fsPath, '.js');

        // Validate that the filename is a valid JavaScript class name
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(fileName)) {
            vscode.window.showErrorMessage('Cabbage: Filename must be a valid JavaScript class name (e.g., MyWidget, TestButton)');
            return;
        }

        // Check if the camelCase version conflicts with built-in widgets
        const widgetType = fileName.charAt(0).toLowerCase() + fileName.slice(1);
        if (builtInWidgets.includes(widgetType)) {
            vscode.window.showErrorMessage(`Cabbage: Widget type "${widgetType}" conflicts with a built-in widget. Please choose a different filename.`);
            return;
        }

        const widgetName = fileName;

        try {
            // Read template
            const templateUri = vscode.Uri.file(templatePath);
            const data = await vscode.workspace.fs.readFile(templateUri);
            let content = Buffer.from(data).toString('utf8');

            // Convert widget name to camelCase for the type identifier
            const widgetType = widgetName.charAt(0).toLowerCase() + widgetName.slice(1);

            // Replace class name
            content = content.replace(/export class\s+CustomWidgetTemplate\b/, `export class ${widgetName}`);

            // Replace widget type identifier in the props (e.g., "type": "customWidget" -> "type": "testButton")
            content = content.replace(/"type":\s*"customWidget"/g, `"type": "${widgetType}"`);

            // Replace channel id (e.g., "id": "customWidget" -> "id": "testButton")
            content = content.replace(/"id":\s*"customWidget"/g, `"id": "${widgetType}"`);

            // Check if file exists and ask for overwrite
            try {
                await vscode.workspace.fs.stat(saveUri);
                const overwrite = await vscode.window.showQuickPick(['Overwrite', 'Cancel'], { placeHolder: `${path.basename(saveUri.fsPath)} already exists. Overwrite?` });
                if (overwrite !== 'Overwrite') return;
            } catch { /* file does not exist, continue */ }

            // Write file
            await vscode.workspace.fs.writeFile(saveUri, new TextEncoder().encode(content));

            // Open the new file in editor
            const doc = await vscode.workspace.openTextDocument(saveUri);
            await vscode.window.showTextDocument(doc);

            // Trigger a rescan so the new widget appears in the context menu immediately
            await vscode.commands.executeCommand('cabbage.restartBackend');

            vscode.window.showInformationMessage(`Cabbage: Created custom widget ${widgetName} at ${saveUri.fsPath}`);
        } catch (err) {
            console.error('Cabbage: Failed to create custom widget', err);
            vscode.window.showErrorMessage(`Cabbage: Failed to create custom widget: ${String(err)}`);
        }
    }

    static async selectCabbageJavascriptSourcePath() {
        const config = vscode.workspace.getConfiguration('cabbage');
        let settings = await Settings.getCabbageSettings();

        const selectedPath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Cabbage JavaScript path'
        });

        if (selectedPath && selectedPath.length > 0) {
            const fsPath = selectedPath[0].fsPath;
            let settingKey = '';

            switch (os.platform()) {
                case 'win32':
                    settingKey = 'pathToJsSourceWindows';
                    break;
                case 'darwin':
                    settingKey = 'pathToJsSourceMacOS';
                    break;
                case 'linux':
                    settingKey = 'pathToJsSourceLinux';
                    break;
                default:
                    vscode.window.showWarningMessage(`Unsupported platform: ${os.platform()}`);
                    return;
            }

            await config.update(settingKey, fsPath, vscode.ConfigurationTarget.Global);

            settings['currentConfig'][settingKey] = fsPath;
            await Settings.setCabbageSettings(settings);
        }
    }

    static async resetSettingsFile() {
        // Get the current user's home directory
        const homeDir = os.homedir();
        // Build your path dynamically
        let settingsPath = "";
        if (os.platform() === 'darwin') {
            settingsPath = path.join(homeDir, 'Library', 'Application Support', 'Cabbage', 'settings.json');
        } else {
            settingsPath = path.join(homeDir, 'Local Settings', 'Application Data', 'Cabbage', 'settings.json');
        }
        const fileUri = vscode.Uri.file(settingsPath);
        const userResponse = await vscode.window.showWarningMessage(
            'Are you sure you want to reset the CabbageApp (not vscode) settings file? A new default file will be created in its place.',
            { modal: true },
            'Yes', 'No'
        );

        if (userResponse === 'Yes') {
            try {
                await vscode.workspace.fs.delete(fileUri, { useTrash: false });
                vscode.window.showInformationMessage('Settings file has been reset.');
            } catch (error) {
                console.error('Cabbage: Error deleting settings file:', error);
                vscode.window.showErrorMessage('Failed to reset settings file.');
            }
        } else {
            vscode.window.showInformationMessage('Reset action cancelled.');
        }
    }

    static async selectCabbageBinaryPath() {
        // Load the configuration for the correct section and key
        const config = vscode.workspace.getConfiguration('cabbage');

        const cabbagePath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Cabbage binary path'
        });

        if (cabbagePath && cabbagePath.length > 0) {
            // Use the correct key name that matches your package.json configuration
            await config.update('pathToCabbageBinary', cabbagePath[0].fsPath, vscode.ConfigurationTarget.Global);
        }
    }

    static async setupCabbageProBinaries() {
        const config = vscode.workspace.getConfiguration('cabbage');

        const proBinaryPath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select CabbagePro binaries folder (containing VST3, AU, and cli folders)'
        });

        if (proBinaryPath && proBinaryPath.length > 0) {
            const selectedPath = proBinaryPath[0].fsPath;

            // Verify the folder contains expected pro binaries
            const fs = require('fs');
            const path = require('path');
            const cliPath = path.join(selectedPath, 'cli');

            if (!fs.existsSync(cliPath)) {
                vscode.window.showErrorMessage('Selected folder does not appear to contain CabbagePro binaries. Expected cli/ subfolder.');
                return;
            }

            await config.update('pathToCabbageProBinary', selectedPath, vscode.ConfigurationTarget.Global);

            // Set context to enable pro commands
            vscode.commands.executeCommand('setContext', 'cabbage.proEnabled', true);

            vscode.window.showInformationMessage('CabbagePro binaries configured successfully! Pro export commands are now available.');
        }
    }

    static async selectCsoundIncludeDir() {
        // Load the configuration for the correct section and key
        const config = vscode.workspace.getConfiguration('cabbage');

        const cabbagePath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Csound include directory (for Daisy)'
        });

        if (cabbagePath && cabbagePath.length > 0) {
            // Use the correct key name that matches your package.json configuration
            await config.update('pathToCsoundIncludeDir', cabbagePath[0].fsPath, vscode.ConfigurationTarget.Global);
        }
    }

    static async selectCsoundLibraryDir() {
        // Load the configuration for the correct section and key
        const config = vscode.workspace.getConfiguration('cabbage');

        const cabbagePath = await vscode.window.showOpenDialog({
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
            openLabel: 'Select Csound library directory (for Daisy)'
        });

        if (cabbagePath && cabbagePath.length > 0) {
            // Use the correct key name that matches your package.json configuration
            await config.update('pathToCsoundLibraryDir', cabbagePath[0].fsPath, vscode.ConfigurationTarget.Global);
        }
    }

    static async selectMidiDevice(type: 'input' | 'output') {
        const config = vscode.workspace.getConfiguration('cabbage');
        let settings = await Settings.getCabbageSettings();

        // Check if the type is valid
        if (type !== 'input' && type !== 'output') {
            vscode.window.showErrorMessage('Invalid MIDI device type. Must be "input" or "output".');
            return;
        }

        // Get the list of available MIDI devices based on the type
        const midiDevices = Object.keys(type === 'output'
            ? settings.systemAudioMidiIOListing.midiOutputDevices
            : settings.systemAudioMidiIOListing.midiInputDevices || {});

        // Check if there are any MIDI devices available
        if (midiDevices.length === 0) {
            vscode.window.showWarningMessage(`No MIDI ${type} devices available.`);
            return;
        }

        // Show available MIDI devices in a drop-down (QuickPick)
        const selectedMidiDevice = await vscode.window.showQuickPick(
            midiDevices.map(device => device.toString()), // Convert to string for display
            { placeHolder: `Select a MIDI ${type} device` }
        );

        // If a valid MIDI device is selected, update the configuration and save settings
        if (selectedMidiDevice) {
            await config.update(`midi${type.charAt(0).toUpperCase() + type.slice(1)}Device`, selectedMidiDevice, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`Selected MIDI ${type} device: ${selectedMidiDevice}`);
            settings['currentConfig']['midi'][`${type}Device`] = selectedMidiDevice;
            await Settings.setCabbageSettings(settings);
        } else {
            vscode.window.showWarningMessage(`No MIDI ${type} device selected.`);
        }
    }


}