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
        const clonedProps = JSON.parse(JSON.stringify(widgetProps));

        // Define prefixes of keys to strip
        const stripPrefixes = ['//'];

        // Strip keys matching prefixes
        clonedProps.forEach(props => {
            Object.keys(props).forEach(key => {
                // Check if key starts with any of the strip prefixes
                if (stripPrefixes.some(prefix => key.startsWith(prefix))) {
                    delete props[key];
                }
            });
        });

        this.clipboardData = clonedProps;
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
     * Generate a short hash string
     * @returns {string} A short hash (4 characters)
     */
    static generateShortHash() {
        // Use timestamp and random value to create a unique hash
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 6);
        // Take last 4 chars of timestamp + first 2 of random, then substring to 4 chars
        // This gives better distribution
        const combined = timestamp.slice(-4) + random.slice(0, 2);
        return combined.substring(0, 4);
    }

    /**
     * Generate a unique ID for a pasted widget
     * @param {string} originalId - The original widget ID
     * @param {number} totalWidgets - Total number of widgets in the interface
     * @param {Set} existingIds - Set of existing widget IDs to check against
     * @returns {string} A unique ID for the pasted widget
     */
    static generateUniqueId(originalId, totalWidgets, existingIds) {
        console.log(`WidgetClipboard: generateUniqueId called for: ${originalId}`);

        // Strip any existing hash suffix (pattern: _xxxx where x is alphanumeric, 4 chars)
        // This prevents IDs from growing like: filterAtt_abc1_def2_ghi3
        let baseId = originalId.replace(/_[a-z0-9]{4}$/i, '');

        console.log(`WidgetClipboard: Base ID after stripping hash: ${baseId}`);

        // If the entire ID was just a hash (unlikely), use the original
        if (!baseId) {
            baseId = originalId;
            console.log(`WidgetClipboard: Base ID was empty, using original: ${baseId}`);
        }

        let newId = `${baseId}_${WidgetClipboard.generateShortHash()}`;
        console.log(`WidgetClipboard: Initial new ID: ${newId}`);

        // Keep generating new hashes until we find a unique ID (very unlikely to collide)
        // Add safety counter to prevent infinite loops
        let attempts = 0;
        const maxAttempts = 100;

        while (existingIds.has(newId) && attempts < maxAttempts) {
            attempts++;
            newId = `${baseId}_${WidgetClipboard.generateShortHash()}`;
            console.log(`WidgetClipboard: Collision detected, attempt ${attempts}: ${newId}`);
        }

        // If we hit max attempts, use a guaranteed unique timestamp-based ID
        if (attempts >= maxAttempts) {
            console.warn(`WidgetClipboard: Hit max attempts (${maxAttempts}), using timestamp fallback`);
            newId = `${baseId}_${Date.now()}`;
        }

        console.log(`WidgetClipboard: Generated unique ID: ${originalId} → ${newId} (${attempts} attempts)`);
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

            // Store the original IDs for comparison
            const originalPropsId = newWidget.id;
            let newPropsId = null;

            // Generate unique ID for the main widget ID
            if (newWidget.id) {
                newPropsId = WidgetClipboard.generateUniqueId(newWidget.id, totalWidgets, existingIds);
                existingIds.add(newPropsId);
                newWidget.id = newPropsId;
            }

            // Generate unique IDs for all channels (independently from widget ID)
            // BUT: if the original channel ID matched the original props.id, reuse the new props.id
            if (newWidget.channels && Array.isArray(newWidget.channels)) {
                newWidget.channels.forEach(channel => {
                    if (channel.id) {
                        // If this channel ID originally matched the props.id, use the same new ID
                        if (originalPropsId && channel.id === originalPropsId && newPropsId) {
                            channel.id = newPropsId;
                            // Don't add to existingIds again - it's already there from props.id
                        } else {
                            // Generate a new unique ID for this channel
                            const newChannelId = WidgetClipboard.generateUniqueId(channel.id, totalWidgets, existingIds);
                            existingIds.add(newChannelId);
                            channel.id = newChannelId;
                        }
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
