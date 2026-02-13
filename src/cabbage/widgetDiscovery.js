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
        return discoveredWidgets;
    }

    try {
        // Request custom widget information from the extension

        // Create a promise that resolves when we receive the response
        // Wait for the extension to post custom widget info. Increase the
        // timeout to reduce race conditions where the extension replies a
        // little slower. We also keep the message listener in place after
        // the initial response so late arrivals can still register widgets.
        const widgetInfoPromise = new Promise((resolve) => {
            const messageHandler = (event) => {
                const message = event.data;
                if (message && message.command === 'customWidgetInfo') {
                    // Do not remove the global listener here; we want to allow
                    // future updates to arrive as well. Resolve the initial
                    // promise with the first payload we receive.
                    resolve(message.widgets || []);
                }
            };

            window.addEventListener('message', messageHandler);

            // Set a longer timeout in case the extension is slow to respond.
            setTimeout(() => {
                // If we haven't resolved yet, resolve with empty array so the
                // initialization can continue. Later messages will still be
                // handled by the global listener below.
                console.warn('Cabbage: Timed out waiting for customWidgetInfo from extension (10s timeout expired)');
                resolve([]);
            }, 10000); // 10s
        });

        // Request all custom widget info at once
        vscode.postMessage({
            command: 'getCustomWidgetInfo'
        });

        const widgetInfoList = await widgetInfoPromise;

        if (!widgetInfoList || widgetInfoList.length === 0) {
            return discoveredWidgets;
        }

        // Register each widget
        for (const widgetInfo of widgetInfoList) {
            try {
                const { widgetType, filename, className, webviewPath } = widgetInfo;


                // Register the widget - the webviewPath is already a complete URI
                // We just need to use the filename for the registry
                registerWidget(widgetType, webviewPath, className);
                discoveredWidgets.push(widgetType);

            } catch (error) {
                console.error(`Cabbage: Failed to register widget ${widgetInfo.widgetType}:`, error);
            }
        }

        // Also install a global listener so any future 'customWidgetInfo'
        // messages sent by the extension (for example, after the initial
        // timeout) will still be registered.
        window.addEventListener('message', (event) => {
            try {
                const message = event.data;
                if (message && message.command === 'customWidgetInfo') {
                    const widgets = message.widgets || [];
                    widgets.forEach(w => {
                        const { widgetType, webviewPath, className } = w;
                        if (widgetType && webviewPath && className) {
                            if (!discoveredWidgets.includes(widgetType)) {
                                try {
                                    registerWidget(widgetType, webviewPath, className);
                                    discoveredWidgets.push(widgetType);
                                } catch (err) {
                                    console.error(`Cabbage: Failed to late-register widget ${widgetType}:`, err);
                                }
                            }
                        }
                    });
                }
            } catch (err) {
                console.error('Cabbage: Error handling late customWidgetInfo message:', err);
            }
        });
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
