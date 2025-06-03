// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import * as vscode from 'vscode';
import { Commands } from './commands';
import os from 'os';
import path from 'path';

export class Settings {

    private static getDefaultSettings() {
        return `
    {
        "currentConfig": {
            "audio": {},
            "jsSourceDir": "${Settings.getPathJsSourceDir()}",
            "midi": {}
        },
        "systemAudioMidiIOListing": {
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
                case 'CabbageVST3Effect':
                    return path.join(binaryPath, 'CabbagePluginEffect.vst3');
                case 'CabbageVST3Synth':
                    return path.join(binaryPath, 'CabbagePluginSynth.vst3');
                // case 'CabbageAUv2Effect':
                //     return path.join(binaryPath, 'CabbageAUv2Effect.component');
                // case 'CabbageAUv2Synth':
                //     return path.join(binaryPath, 'CabbageAUv2Synth.component');
                // case 'CabbageStandaloneApp':
                //     return path.join(binaryPath, 'CabbageStandaloneApp.app');
                default:
                    return '';
            }
        }
        return ''; // Return an empty string if the extension is not found
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

            // Update the settings with the new path.
            settings['currentConfig']['jsSourceDir'] = newPath;
            await Settings.setCabbageSettings(settings);
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