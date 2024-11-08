// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import * as vscode from 'vscode';
const os = require('os');
const path = require('path');

export class Settings {
    
    private static getDefaultSettings(){
        return `
    {
        "currentConfig": {
            "audio": {},
            "jsSourceDir": "${Settings.getJsSourceDir()}",
            "midi": {}
        },
        "systemAudioMidiIOListing": {
            "audioDrivers": "",
            "audioInputDevices": {},
            "audioOutputDevices": {},
            "midiInputDevices": {},
            "midiOutputDevices": {}
        }
    }
    `};

    private static getJsSourceDir(): string {
        const extension = vscode.extensions.getExtension('cabbageaudio.vscabbage');
        if (extension) {
            // Construct the path to the src/cabbage directory
            const returnPath = path.join(extension.extensionPath, 'src');
            return returnPath;
        }
        return ''; // Return an empty string if the extension is not found
    }

    static async getCabbageSettings() {
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

        try {
            // Try to read the settings file
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            const fileContent = new TextDecoder('utf-8').decode(fileData);
            return JSON.parse(fileContent); // Return the parsed JSON content if file exists
        } catch (error) {
            if (error instanceof Error && (error as any).code === 'FileNotFound') {
                console.log('Settings file not found. Creating a new one with default settings.');

                // Ensure the directory structure exists
                const directoryUri = vscode.Uri.file(path.dirname(settingsPath));
                try {
                    await vscode.workspace.fs.createDirectory(directoryUri);
                } catch (dirError) {
                    console.error('Error creating settings directory:', dirError);
                }

                // Write default settings to the new file
                try {
                    const fileContent = new TextEncoder().encode(Settings.getDefaultSettings());
                    await vscode.workspace.fs.writeFile(fileUri, fileContent);
                    return JSON.parse(Settings.getDefaultSettings()); // Return the default settings as JSON
                } catch (writeError) {
                    console.error('Error writing default settings to file:', writeError);
                }
            } else {
                console.error('Error reading file:', error);
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
        } else {
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
            console.error('Error writing file:', error);
            vscode.window.showErrorMessage('Failed to update settings.');
        }
    }

    static async selectSamplingRate() {
        const config = vscode.workspace.getConfiguration('cabbage');
        // Retrieve the current settings from your configuration file
        let settings = await Settings.getCabbageSettings();
        console.log('Settings:', settings);
        let currentDevice = settings['currentConfig']['audio']['outputDevice'];
        console.log('Current device:', currentDevice);
    
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
            vscode.window.showInformationMessage(`Sampling rate updated to: ${selectedBufferSize}`);
            settings['currentConfig']['audio']['buffer'] = selectedBufferSize;
            await Settings.setCabbageSettings(settings);
        } else {
            vscode.window.showWarningMessage('No buffer size selected.');
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
        if (event.affectsConfiguration('cabbage.pathToJsSource')) {
            const newPath = vscode.workspace.getConfiguration('cabbage').get('pathToJsSource');
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
            await config.update('pathToJsSource', selectedPath[0].fsPath, vscode.ConfigurationTarget.Global);
            settings['currentConfig']['jsSourceDir'] = selectedPath[0].fsPath;
            await Settings.setCabbageSettings(settings);
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