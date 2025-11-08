// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * Widget Discovery System
 * =======================
 * 
 * This module automatically discovers and registers custom widgets from
 * configured directories. It scans for JavaScript files that export widget
 * classes and makes them available in the Cabbage UI without requiring
 * manual registration.
 * 
 * The discovery process:
 * 1. Retrieves custom widget directories from settings via VS Code API
 * 2. Scans each directory for .js files
 * 3. Attempts to load each file and extract the exported widget class
 * 4. Registers discovered widgets using the registerWidget API
 * 5. Returns the list of discovered widget types
 */

import { registerWidget } from './widgetTypes.js';

/**
 * Discovers and registers custom widgets from configured directories.
 * This function is called during initialization to make custom widgets
 * available in the Cabbage UI.
 * 
 * Custom widgets are expected to be served by the extension at runtime,
 * with paths relative to the webview's base URI.
 * 
 * @param {Object} vscode - VS Code API instance (from acquireVsCodeApi)
 * @returns {Promise<string[]>} - Array of discovered custom widget type names
 */
export async function discoverAndRegisterCustomWidgets(vscode) {
    const discoveredWidgets = [];

    if (!vscode) {
        console.log('Cabbage: No VS Code API available, skipping custom widget discovery');
        return discoveredWidgets;
    }

    try {
        // Request custom widget information from the extension
        console.log('Cabbage: Requesting custom widget information from extension...');

        // Create a promise that resolves when we receive the response
        const widgetInfoPromise = new Promise((resolve) => {
            const messageHandler = (event) => {
                const message = event.data;
                if (message.command === 'customWidgetInfo') {
                    window.removeEventListener('message', messageHandler);
                    resolve(message.widgets || []);
                }
            };
            window.addEventListener('message', messageHandler);

            // Set a timeout in case we don't get a response
            setTimeout(() => {
                window.removeEventListener('message', messageHandler);
                resolve([]);
            }, 3000);
        });

        // Request all custom widget info at once
        vscode.postMessage({
            command: 'getCustomWidgetInfo'
        });

        const widgetInfoList = await widgetInfoPromise;
        console.log('Cabbage: Received custom widget info:', widgetInfoList);

        if (!widgetInfoList || widgetInfoList.length === 0) {
            console.log('Cabbage: No custom widgets found');
            return discoveredWidgets;
        }

        // Register each widget
        for (const widgetInfo of widgetInfoList) {
            try {
                const { widgetType, filename, className, webviewPath } = widgetInfo;

                console.log(`Cabbage: Registering custom widget: ${widgetType} from ${webviewPath}`);

                // Register the widget - the webviewPath is already a complete URI
                // We just need to use the filename for the registry
                registerWidget(widgetType, webviewPath, className);
                discoveredWidgets.push(widgetType);

            } catch (error) {
                console.error(`Cabbage: Failed to register widget ${widgetInfo.widgetType}:`, error);
            }
        }

        console.log(`Cabbage: Successfully discovered and registered ${discoveredWidgets.length} custom widgets`);
        return discoveredWidgets;

    } catch (error) {
        console.error('Cabbage: Error during custom widget discovery:', error);
        return discoveredWidgets;
    }
}

/**
 * Extracts the widget class name and type from a widget file's content.
 * This is used by the extension to analyze widget files.
 * 
 * @param {string} fileContent - The content of the widget JavaScript file
 * @returns {Object|null} - Object with className and widgetType, or null if not found
 */
export function extractWidgetInfo(fileContent) {
    try {
        // Match: export class ClassName
        const classMatch = fileContent.match(/export\s+class\s+(\w+)/);
        if (!classMatch) {
            return null;
        }

        const className = classMatch[1];

        // Try to find widget type from the constructor
        // Look for: "type": "widgetType"
        const typeMatch = fileContent.match(/"type"\s*:\s*"(\w+)"/);

        // If no type found in props, use lowercase class name as fallback
        const widgetType = typeMatch ? typeMatch[1] : className.charAt(0).toLowerCase() + className.slice(1);

        return { className, widgetType };
    } catch (error) {
        console.error('Error extracting widget info:', error);
        return null;
    }
}
