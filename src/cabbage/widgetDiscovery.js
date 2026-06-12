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
export async function discoverAndRegisterCustomWidgets(vscode, onRefresh = null) {
    const discoveredWidgets = [];

    if (!vscode) {
        return discoveredWidgets;
    }

    try {
        // Install the persistent global listener SYNCHRONOUSLY before anything
        // async so it is guaranteed to be in place when the extension sends
        // customWidgetInfo (which it does as soon as it receives
        // cabbageIsReadyToLoad — potentially before any awaits below resolve).
        const handleCustomWidgetInfo = (event) => {
            try {
                const message = event.data;
                if (message && message.command === 'customWidgetInfo') {
                    console.log(`Cabbage: customWidgetInfo received, ${(message.widgets || []).length} widgets:`, (message.widgets || []).map(w => w.widgetType));
                    const widgets = message.widgets || [];
                    let added = false;
                    widgets.forEach(w => {
                        const { widgetType, webviewPath, className } = w;
                        if (widgetType && webviewPath && className) {
                            if (!discoveredWidgets.includes(widgetType)) {
                                try {
                                    registerWidget(widgetType, webviewPath, className);
                                    discoveredWidgets.push(widgetType);
                                    added = true;
                                    console.log(`Cabbage: Registered custom widget: ${widgetType} -> ${webviewPath}`);
                                } catch (err) {
                                    console.error(`Cabbage: Failed to register widget ${widgetType}:`, err);
                                }
                            }
                        }
                    });
                    if (added && typeof onRefresh === 'function') {
                        onRefresh();
                    }
                }
            } catch (err) {
                console.error('Cabbage: Error handling customWidgetInfo message:', err);
            }
        };
        window.addEventListener('message', handleCustomWidgetInfo);

        // Also request in case the extension hasn't pushed yet
        // (e.g. on a rescan triggered after initial load).
        vscode.postMessage({ command: 'getCustomWidgetInfo' });

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
