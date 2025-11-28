// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

/**
 * Widget Clipboard - Manages copying and pasting of widgets
 */
export class WidgetClipboard {
    constructor() {
        this.clipboardData = null;
    }

    /**
     * Copy widgets to clipboard
     * @param {Array} widgetProps - Array of widget property objects to copy
     */
    copy(widgetProps) {
        if (!widgetProps || widgetProps.length === 0) {
            console.warn('WidgetClipboard: No widgets to copy');
            return;
        }

        // Deep clone the widget properties to avoid reference issues
        this.clipboardData = JSON.parse(JSON.stringify(widgetProps));
        console.log(`WidgetClipboard: Copied ${this.clipboardData.length} widget(s)`);
    }

    /**
     * Get clipboard data
     * @returns {Array|null} Array of widget property objects or null if clipboard is empty
     */
    getData() {
        return this.clipboardData;
    }

    /**
     * Check if clipboard has data
     * @returns {boolean} True if clipboard contains data
     */
    hasData() {
        return this.clipboardData !== null && this.clipboardData.length > 0;
    }

    /**
     * Clear clipboard
     */
    clear() {
        this.clipboardData = null;
        console.log('WidgetClipboard: Clipboard cleared');
    }

    /**
     * Generate a unique ID for a pasted widget
     * @param {string} originalId - The original widget ID
     * @param {number} totalWidgets - Total number of widgets in the interface
     * @param {Set} existingIds - Set of existing widget IDs to check against
     * @returns {string} A unique ID for the pasted widget
     */
    static generateUniqueId(originalId, totalWidgets, existingIds) {
        let baseId = originalId;
        let counter = 1;
        let newId = `${baseId}_copy_${counter}`;

        // Keep incrementing until we find a unique ID
        while (existingIds.has(newId)) {
            counter++;
            newId = `${baseId}_copy_${counter}`;
        }

        console.log(`WidgetClipboard: Generated unique ID: ${originalId} → ${newId}`);
        return newId;
    }

    /**
     * Prepare widgets for pasting with unique IDs and offset positions
     * @param {Array} widgets - All widgets in the interface (for ID checking)
     * @param {number} offsetX - X offset for pasted widgets (default: 20)
     * @param {number} offsetY - Y offset for pasted widgets (default: 20)
     * @returns {Array} Array of widget property objects ready to paste
     */
    prepareForPaste(widgets, offsetX = 20, offsetY = 20) {
        if (!this.hasData()) {
            console.warn('WidgetClipboard: No data to paste');
            return [];
        }

        // Get all existing IDs
        const existingIds = new Set();
        widgets.forEach(widget => {
            if (widget.props.id) {
                existingIds.add(widget.props.id);
            }
            if (widget.props.channels) {
                widget.props.channels.forEach(channel => {
                    if (channel.id) {
                        existingIds.add(channel.id);
                    }
                });
            }
        });

        const totalWidgets = widgets.length;
        const pastedWidgets = [];

        // Process each widget in clipboard
        this.clipboardData.forEach(widgetData => {
            // Deep clone to avoid modifying clipboard data
            const newWidget = JSON.parse(JSON.stringify(widgetData));

            // Generate unique ID for the main widget ID
            if (newWidget.id) {
                const newId = WidgetClipboard.generateUniqueId(newWidget.id, totalWidgets, existingIds);
                existingIds.add(newId);
                newWidget.id = newId;
            }

            // Generate unique IDs for all channels (independently from widget ID)
            if (newWidget.channels && Array.isArray(newWidget.channels)) {
                newWidget.channels.forEach(channel => {
                    if (channel.id) {
                        const newChannelId = WidgetClipboard.generateUniqueId(channel.id, totalWidgets, existingIds);
                        existingIds.add(newChannelId);
                        channel.id = newChannelId;
                    }
                });
            }

            // Offset the position
            if (newWidget.bounds) {
                newWidget.bounds.left = (newWidget.bounds.left || 0) + offsetX;
                newWidget.bounds.top = (newWidget.bounds.top || 0) + offsetY;
            }

            pastedWidgets.push(newWidget);
        });

        console.log(`WidgetClipboard: Prepared ${pastedWidgets.length} widget(s) for pasting`);
        return pastedWidgets;
    }
}

// Create a singleton instance
export const widgetClipboard = new WidgetClipboard();
