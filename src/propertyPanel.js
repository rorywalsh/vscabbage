// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * PropertyPanel Class. Lightweight component that updates its innerHTML when properties change.
 * This makes use of https://taufik-nurrohman.js.org/CP/ for colour pickers.
 */
import { CabbageUtils } from "./cabbage/utils.js";
import { WidgetManager } from "./cabbage/widgetManager.js";


export class PropertyPanel {
    /**
     * Default keys to always exclude when sending minimized props to VSCode.
     * These are internal-only properties that should never be serialized to the
     * extension when sending minimized updates.
     * @type {string[]}
     */
    static defaultExcludeKeys = ['parameterIndex', 'samples', 'currentCsdFile', 'originalProps', 'groupBaseBounds', 'origBounds', 'value', 'range.value'];

    /**
     * Show a notification message in the property panel
     * @param {string} message - The message to display
     * @param {string} type - Type of notification: 'error', 'warning', 'info' (default: 'error')
     */
    static showNotification(message, type = 'error') {
        // Remove any existing notifications
        const existing = document.querySelector('.property-panel-notification');
        if (existing) {
            existing.remove();
        }

        // Create notification element
        const notification = document.createElement('div');
        notification.className = `property-panel-notification property-panel-notification-${type}`;
        notification.style.cssText = `
            position: sticky;
            top: 0;
            left: 0;
            right: 0;
            padding: 8px 32px 8px 12px;
            margin-bottom: 8px;
            background-color: ${type === 'error' ? '#f44336' : type === 'warning' ? '#ff9800' : '#2196F3'};
            color: white;
            border-radius: 4px;
            font-size: 12px;
            line-height: 1.3;
            z-index: 10000;
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            position: relative;
        `;

        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        messageSpan.style.whiteSpace = 'pre-line';

        const closeButton = document.createElement('button');
        closeButton.textContent = '×';
        closeButton.style.cssText = `
            position: absolute;
            top: 4px;
            right: 8px;
            background: none;
            border: none;
            color: white;
            font-size: 20px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
            width: 20px;
            height: 20px;
        `;
        closeButton.onclick = () => notification.remove();

        notification.appendChild(messageSpan);
        notification.appendChild(closeButton);

        // Insert at the top of the property panel
        const propertyPanel = document.querySelector('.property-panel');
        if (propertyPanel) {
            propertyPanel.insertBefore(notification, propertyPanel.firstChild);
            console.log('PropertyPanel: Notification displayed:', message);
        } else {
            console.error('PropertyPanel: Could not find .property-panel element to show notification');
        }

        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 4000);
    }

    /**
     * Helper to ensure we never post undefined as the text payload. JSON.stringify(undefined)
     * returns undefined, which can lead to the extension receiving an invalid payload.
     * Uses CabbageUtils.sanitizeForEditor then ensures JSON.stringify returns a string.
     * @param {*} obj
     * @returns {string} JSON string safe to send in postMessage
     */
    static safeSanitizeForPost(obj) {
        try {
            const sanitized = CabbageUtils.sanitizeForEditor(obj);
            // Convert undefined -> {} so JSON.stringify always returns a string
            return JSON.stringify(sanitized === undefined ? {} : sanitized);
        } catch (e) {
            console.error('PropertyPanel.safeSanitizeForPost failed:', e);
            return '{}';
        }
    }

    /**
     * Remove any keys (in `keys`) from `obj`. This mutates the object and
     * returns it for convenience. Safely handles non-object inputs.
     * @param {Object|any} obj
     * @param {string[]} keys
     * @returns {Object|any}
     */
    static applyExcludes(obj, keys) {
        try {
            if (!obj || typeof obj !== 'object') return obj;

            // Separate simple keys (top-level) and deep keys (dot notation)
            const simpleKeys = keys.filter(k => !k.includes('.'));
            const deepKeys = keys.filter(k => k.includes('.'));

            // 1. Handle simple keys (Shallow delete - existing behavior)
            simpleKeys.forEach(k => {
                if (k in obj) delete obj[k];
            });

            // 2. Handle deep keys (Recursive delete)
            if (deepKeys.length > 0) {
                const stripDeep = (target, parentKey, childKey) => {
                    if (!target || typeof target !== 'object') return;

                    if (Array.isArray(target)) {
                        target.forEach(item => stripDeep(item, parentKey, childKey));
                        return;
                    }

                    // If we found the parent key, delete the child from it
                    if (parentKey in target) {
                        const parentObj = target[parentKey];
                        if (parentObj && typeof parentObj === 'object' && childKey in parentObj) {
                            delete parentObj[childKey];
                        }
                    }

                    // Recurse into children
                    Object.values(target).forEach(value => {
                        if (value && typeof value === 'object') {
                            stripDeep(value, parentKey, childKey);
                        }
                    });
                };

                deepKeys.forEach(key => {
                    const [parent, child] = key.split('.');
                    if (parent && child) {
                        stripDeep(obj, parent, child);
                    }
                });
            }

        } catch (e) {
            console.error('PropertyPanel.applyExcludes failed:', e);
        }
        return obj;
    }

    /**
     * Create a minimized copy of `props` by stripping any properties that exactly
     * match the widget's `rawDefaults`. Works on a deep clone so it does not
     * mutate the live widget instance.
     * @param {Object} props
     * @param {Object} widget
     * @returns {Object}
     */
    static minimizePropsForWidget(props, widget) {
        try {
            if (!props || !widget) return props;
            const defaults = widget.rawDefaults || {};
            // Deep clone the props to avoid mutating live state
            const clone = JSON.parse(JSON.stringify(props));

            // Track which top-level properties existed in the original CSD file
            // This is used to determine which properties should be sent as null when they revert to defaults
            const originalProps = widget.originalProps || {};
            const originalTopLevelKeys = new Set(Object.keys(originalProps));

            const strip = (obj, defs) => {
                if (!obj || !defs) return;
                // Arrays
                if (Array.isArray(obj) && Array.isArray(defs)) {
                    const defElem = defs[0];
                    if (defElem && typeof defElem === 'object') {
                        for (let i = 0; i < obj.length; i++) {
                            if (obj[i] && typeof obj[i] === 'object') strip(obj[i], defElem);
                        }
                    } else {
                        // Primitive arrays: remove if equal
                        if (WidgetManager.deepEqual(obj, defs)) {
                            return true; // signal to caller to remove
                        }
                    }
                    return false;
                }

                if (typeof obj !== 'object' || typeof defs !== 'object') return false;

                Object.keys(defs).forEach((k) => {
                    if (!(k in obj)) return;
                    const dv = defs[k];
                    const v = obj[k];
                    if (WidgetManager.deepEqual(v, dv)) {
                        delete obj[k];
                        return;
                    }
                    if (v && dv && typeof v === 'object' && typeof dv === 'object') {
                        if (Array.isArray(v) && Array.isArray(dv)) {
                            if (dv.length > 0 && typeof dv[0] === 'object') {
                                for (let i = 0; i < v.length; i++) {
                                    if (v[i] && typeof v[i] === 'object') strip(v[i], dv[0]);
                                }
                            } else {
                                if (WidgetManager.deepEqual(v, dv)) delete obj[k];
                            }
                        } else {
                            strip(v, dv);
                            // After stripping nested properties, check if the object is now empty
                            if (typeof v === 'object' && !Array.isArray(v) && Object.keys(v).length === 0) {
                                delete obj[k];
                            }
                        }
                    }
                });
                return false;
            };

            strip(clone, defaults);

            // After stripping, check for properties (both top-level and nested) that were deleted but existed in original CSD.
            // Send these as null to signal explicit deletion to the backend.
            const restoreDeletedProperties = (cloneObj, originalObj, propsObj, path = []) => {
                if (!originalObj || typeof originalObj !== 'object') return;

                Object.keys(originalObj).forEach(key => {
                    const fullPath = [...path, key];
                    const pathString = fullPath.join('.');

                    // Skip critical identity fields - these should never be set to null
                    if (pathString === 'type' || pathString === 'id' || pathString === 'channels') return;

                    // Get values from all three objects at this path
                    const originalValue = originalObj[key];
                    const cloneValue = cloneObj ? cloneObj[key] : undefined;
                    const propsValue = propsObj ? propsObj[key] : undefined;

                    if (pathString.includes('svg')) {
                        console.log(`PropertyPanel: restoreDeletedProperties checking ${pathString}:`, {
                            originalValue,
                            cloneValue,
                            propsValue,
                            willSetNull: originalValue !== undefined && cloneValue === undefined && propsValue !== undefined
                        });
                    }

                    // If the property existed in original CSD but is now deleted from current props,
                    // send null to signal deletion to the backend
                    if (originalValue !== undefined && propsValue === undefined) {
                        // For nested objects, we need to restore the parent structure
                        if (!cloneObj) return;
                        console.log(`PropertyPanel: Setting ${pathString} to null (existed in original, now deleted from props)`);
                        cloneObj[key] = null;
                    }
                    // If it's an object in both original and clone, recurse into it
                    else if (originalValue && typeof originalValue === 'object' && !Array.isArray(originalValue) &&
                        cloneValue && typeof cloneValue === 'object' && !Array.isArray(cloneValue)) {
                        restoreDeletedProperties(cloneValue, originalValue, propsValue, fullPath);
                    }
                });
            };

            restoreDeletedProperties(clone, originalProps, props);

            // Ensure critical identity fields aren't stripped completely.
            // If the widget had a type or id originally, ensure they remain in the
            // minimized payload so the extension can correctly identify the object.
            try {
                // If channels are present but they exactly match the widget defaults,
                // remove them from the minimized payload. This avoids sending a
                // default channel entry (which can cause malformed insertions
                // when the receiver expects only non-default changes).

                // Only omit default-matching channels for form widgets. Other
                // widget types may use channels differently and should not have
                // their channels stripped by this shortcut.
                const isFormWidget = (props && props.type === 'form') || (widget && widget.props && widget.props.type === 'form');
                if (isFormWidget && clone.channels && defaults.channels && Array.isArray(clone.channels) && Array.isArray(defaults.channels)) {
                    try {
                        // Consider channels equal if their contents other than `id` match the defaults.
                        // Some widget instances may have different ids (e.g. MainForm vs generated ids)
                        // so we normalise the default channel ids to the current channel ids before comparing.
                        const normaliseChannels = (arr, idsToUse) => {
                            return arr.map((c, i) => {
                                try {
                                    const copy = JSON.parse(JSON.stringify(c));
                                    if (idsToUse && typeof idsToUse[i] !== 'undefined') copy.id = idsToUse[i];
                                    return copy;
                                } catch (e) {
                                    return c;
                                }
                            });
                        };

                        const currentIds = clone.channels.map(c => (c && c.id) ? c.id : null);
                        const normDefaults = normaliseChannels(defaults.channels, currentIds);

                        const arraysEqual = WidgetManager.deepEqual(clone.channels, normDefaults);
                        const firstElemEqual = (clone.channels.length === 1 && normDefaults.length === 1 && WidgetManager.deepEqual(clone.channels[0], normDefaults[0]));
                        if (arraysEqual || firstElemEqual) {
                            delete clone.channels;
                            console.log('PropertyPanel.minimizePropsForWidget: stripped default-matching channels from minimized props');
                        }
                    } catch (e) {
                        // ignore deepEqual failures for channels
                        console.error('PropertyPanel.minimizePropsForWidget: channel compare failed', e);
                    }
                }

                if ((!clone.type || clone.type === '') && props && props.type) {
                    clone.type = props.type;
                }
                if ((!clone.id || clone.id === '') && props && props.id) {
                    clone.id = props.id;
                }

                // Defensive: if after minimization we have neither a type nor an id,
                // that's an invalid payload to send — return the full props so the
                // extension receives a complete object (and can validate/err).
                if ((!clone.type || clone.type === '') && (!clone.id || clone.id === '')) {
                    console.error('PropertyPanel.minimizePropsForWidget: minimized object has no type or id — returning full props to avoid invalid payload');
                    return props;
                }
            } catch (e) {
                console.error('PropertyPanel.minimizePropsForWidget post-strip checks failed:', e);
            }

            return clone;
        } catch (e) {
            console.error('PropertyPanel.minimizePropsForWidget failed:', e);
            return props;
        }
    }

    constructor(vscode, type, properties, widgets) {
        this.vscode = vscode;           // VSCode API instance
        this.type = type;               // Type of the widget
        this.widgets = widgets;         // List of widgets associated with this panel

        // Handle multi-widget mode
        if (type === 'multi' && Array.isArray(properties)) {
            this.selectedWidgets = properties;  // Array of selected widget objects
            this.properties = null;  // No single properties object
            this.isMultiMode = true;
            console.log('PropertyPanel: Constructor called for multi-widget mode with', this.selectedWidgets.length, 'widgets');
        } else {
            this.properties = properties;   // Properties of the single widget
            this.selectedWidgets = null;
            this.isMultiMode = false;
            console.log('PropertyPanel: Constructor called for type:', type, 'channel:', CabbageUtils.getChannelId(properties, 0));
        }

        // Create the panel and sections on initialization
        this.createPanel();
    }

    /** 
     * Clears input event listeners from existing inputs.
     */
    clearInputs() {
        const inputs = document.querySelectorAll('.property-panel input');
        inputs.forEach(input => {
            input.removeEventListener('input', this.handleInputChange.bind(this));
        });
    }

    /**
     * Checks if the channel ids are unique across all widgets.
     * If not, logs an error to the console.
     */
    checkChannelUniqueness() {
        const allIds = new Set();
        this.widgets.forEach(widget => {
            if (widget.props && Array.isArray(widget.props.channels)) {
                widget.props.channels.forEach(channel => {
                    if (allIds.has(channel.id)) {
                        console.error(`Conflict detected: Widget channel '${channel.id}' must be unique!`);
                    } else {
                        allIds.add(channel.id);
                    }
                }); // end widget.props.channels.forEach
            } // end if (widget.props.channels)
        }); // end this.widgets.forEach
    } // end checkChannelUniqueness

    /**
     * Creates or rebuilds the panel DOM and attaches listeners.
     */
    createPanel() {
        const channelInfo = this.isMultiMode ? 'multi-widget' : CabbageUtils.getChannelId(this.properties, 0);
        console.log('PropertyPanel: createPanel called for type:', this.type, 'channel:', channelInfo);
        const panel = document.querySelector('.property-panel');
        panel.innerHTML = ''; // Clear the panel's content
        this.clearInputs();   // Remove any previous input listeners

        // Suppress input events while we build the panel to avoid firing
        // handleInputChange from initialization side-effects (color pickers, style updates, etc.)
        this._suppressEvents = true;

        // Prevent scroll events from bubbling to the main webview
        if (!panel.hasAttribute('data-scroll-handler-attached')) {
            panel.addEventListener('wheel', (e) => {
                const isScrollable = panel.scrollHeight > panel.clientHeight;
                const isAtTop = panel.scrollTop === 0;
                const isAtBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight;
                const deltaY = e.deltaY;

                // If panel is scrollable and user is trying to scroll within bounds, allow it
                if (isScrollable) {
                    if ((deltaY > 0 && !isAtBottom) || (deltaY < 0 && !isAtTop)) {
                        // Allow scrolling within the panel
                        return;
                    }
                }

                // Prevent bubbling to main panel and prevent default scroll behavior
                e.stopPropagation();
                e.preventDefault();
            }, { passive: false }); // passive: false to allow preventDefault
            panel.setAttribute('data-scroll-handler-attached', 'true');
        }

        if (this.isMultiMode) {
            // Multi-widget mode: show header and common properties
            this.createMultiWidgetPanel(panel);
        } else {
            // Single widget mode: existing behavior
            // Create a special section for type and channel
            this.createSpecialSection(panel);

            // Create sections based on the properties object
            this.createSections(this.properties, panel);
            this.createMiscSection(this.properties, panel);
        }

        // Add a spacer at the bottom to ensure the last item is not obscured by scrollbars
        const spacer = document.createElement('div');
        spacer.style.height = '50px';
        spacer.style.width = '100%';
        panel.appendChild(spacer);

        // Mark inputs as initialized after a short delay and re-enable events.
        // This allows any component initialization (like color pickers) to complete
        // without triggering genuine change handlers.
        setTimeout(() => {
            this._suppressEvents = false;
            const initables = document.querySelectorAll('.property-panel input, .property-panel select, .property-panel textarea');
            initables.forEach(i => i.dataset.initialized = 'true');
            console.log('PropertyPanel: inputs initialized, event suppression lifted');
        }, 60);
    }

    /**
     * Creates a multi-widget property panel showing common properties
     * @param panel - The panel to which sections are appended
     */
    createMultiWidgetPanel(panel) {
        // Track handled properties
        this.handledProperties = new Set();

        // Create header showing selection count
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 12px;
            background: var(--vscode-editor-background);
            border-bottom: 1px solid var(--vscode-panel-border);
            font-weight: bold;
            text-align: center;
        `;
        header.textContent = `${this.selectedWidgets.length} Widgets Selected`;
        panel.appendChild(header);

        // Get common properties across all selected widgets
        const commonProps = this.getCommonProperties();

        // Create bounds section (most common property to edit)
        if (commonProps.bounds) {
            const boundsSection = this.createSection('Bounds');
            Object.entries(commonProps.bounds.value || {}).forEach(([key, value]) => {
                const isMixed = commonProps.bounds.mixed && commonProps.bounds.mixed.has(key);
                this.addPropertyToSection(key, isMixed ? '' : value, boundsSection, 'bounds', isMixed);
            });
            panel.appendChild(boundsSection);
            this.handledProperties.add('bounds');
        }

        // Create misc section for other common properties
        const miscSection = this.createSection('Common Properties');
        let hasCommonProps = false;

        // Add zIndex if common
        if (commonProps.zIndex !== undefined) {
            const isMixed = commonProps.zIndex.mixed;
            this.addPropertyToSection('zIndex', isMixed ? '' : commonProps.zIndex.value, miscSection, '', isMixed);
            hasCommonProps = true;
        }

        // Add visible if common
        if (commonProps.visible !== undefined) {
            const isMixed = commonProps.visible.mixed;
            this.addPropertyToSection('visible', isMixed ? '' : commonProps.visible.value, miscSection, '', isMixed);
            hasCommonProps = true;
        }

        // Add active if common
        if (commonProps.active !== undefined) {
            const isMixed = commonProps.active.mixed;
            this.addPropertyToSection('active', isMixed ? '' : commonProps.active.value, miscSection, '', isMixed);
            hasCommonProps = true;
        }

        if (hasCommonProps) {
            panel.appendChild(miscSection);
        }
    }

    /**
     * Gets common properties across all selected widgets
     * @returns Object with common properties and mixed value indicators
     */
    getCommonProperties() {
        if (!this.selectedWidgets || this.selectedWidgets.length === 0) {
            return {};
        }

        const commonProps = {};
        const firstWidget = this.selectedWidgets[0].props;

        // Check bounds
        if (firstWidget.bounds) {
            const boundsCommon = { value: {}, mixed: new Set() };
            ['left', 'top', 'width', 'height'].forEach(key => {
                const firstValue = firstWidget.bounds[key];
                const allSame = this.selectedWidgets.every(w => w.props.bounds && w.props.bounds[key] === firstValue);
                boundsCommon.value[key] = firstValue;
                if (!allSame) {
                    boundsCommon.mixed.add(key);
                }
            });
            commonProps.bounds = boundsCommon;
        }

        // Check zIndex
        if (firstWidget.zIndex !== undefined) {
            const firstValue = firstWidget.zIndex;
            const allSame = this.selectedWidgets.every(w => w.props.zIndex === firstValue);
            commonProps.zIndex = { value: firstValue, mixed: !allSame };
        }

        // Check visible
        if (firstWidget.visible !== undefined) {
            const firstValue = firstWidget.visible;
            const allSame = this.selectedWidgets.every(w => w.props.visible === firstValue);
            commonProps.visible = { value: firstValue, mixed: !allSame };
        }

        // Check active
        if (firstWidget.active !== undefined) {
            const firstValue = firstWidget.active;
            const allSame = this.selectedWidgets.every(w => w.props.active === firstValue);
            commonProps.active = { value: firstValue, mixed: !allSame };
        }

        return commonProps;
    }

    /**
     * Creates a special section for widget properties (Type and Channel).
     * @param panel - The panel to which the special section is appended.
     */
    createSpecialSection(panel) {
        // Make the Widget Properties section non-collapsible
        const specialSection = this.createSection('Widget Properties', { collapsible: false });

        // Track handled properties to avoid duplication in the misc section
        this.handledProperties = new Set();

        // Add Type Property
        this.addPropertyToSection('type', this.type, specialSection);
        this.handledProperties.add('type'); // Mark as handled

        // Add widget ID if it exists (top-level id)
        if (this.properties.id) {
            this.addPropertyToSection('id', this.properties.id, specialSection, '');
            this.handledProperties.add('id'); // Mark as handled
        }

        panel.appendChild(specialSection); // Append special section to panel

        // Add Bounds section before Channels (handled separately to control order)
        if (this.properties.bounds) {
            const boundsSection = this.createSection('Bounds');
            Object.entries(this.properties.bounds).forEach(([key, value]) => {
                this.addPropertyToSection(key, value, boundsSection, 'bounds');
            });
            panel.appendChild(boundsSection);
            this.handledProperties.add('bounds'); // Mark as handled so it's not added again
        }

        // Add Channels if it exists
        if (this.properties.channels) {
            this.createChannelsSection(panel);
            this.handledProperties.add('channels'); // Mark as handled
        }
    }

    /** 
     * Creates sections for each group of properties.
     * @param properties - The properties object containing section data.
     * @param panel - The panel to which the sections are appended.
     */
    createSections(properties, panel) {
        // Get the widget instance to access hiddenProps
        const widget = this.widgets.find(w => CabbageUtils.getChannelId(w.props, 0) === CabbageUtils.getChannelId(properties, 0));
        const hiddenProps = widget?.hiddenProps || ['parameterIndex', 'children', 'currentCsdFile', 'value'];

        Object.entries(properties).forEach(([sectionName, sectionProperties]) => {
            // Skip if this property is in hiddenProps or already handled
            if (hiddenProps.includes(sectionName)) {
                console.log("Cabbage: Cabbage: hidden props", hiddenProps, " section name", sectionName);
                return;
            }

            if (this.handledProperties && this.handledProperties.has(sectionName)) {
                console.log("Cabbage: Skipping already handled property:", sectionName);
                return;
            }

            if (typeof sectionProperties === 'object' && sectionProperties !== null && !Array.isArray(sectionProperties)) {
                console.log(`Creating section for: ${sectionName}`);
                const sectionDiv = this.createSection(sectionName);

                // Add each property to the section
                Object.entries(sectionProperties).forEach(([key, value]) => {
                    // Skip if this nested property is in hiddenProps
                    if (hiddenProps.includes(`${sectionName}.${key}`)) {
                        return;
                    }

                    // Check if the value is an object
                    if (typeof value === 'object' && value !== null) {
                        // Handle nested properties (like colour)
                        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
                            // Skip if this deeply nested property is in hiddenProps
                            if (hiddenProps.includes(`${sectionName}.${key}.${nestedKey}`)) {
                                return;
                            }
                            this.addPropertyToSection(`${key}.${nestedKey}`, nestedValue, sectionDiv, sectionName);
                        });
                    } else {
                        this.addPropertyToSection(key, value, sectionDiv, sectionName);
                    }
                });

                panel.appendChild(sectionDiv); // Append the section to the panel
            }
        });
    }

    /** 
     * Creates a channels section to display and manage channel objects.
     * @param panel - The panel to which the channels section is appended.
     */
    createChannelsSection(panel) {
        // Create add button for the main Channels header
        const addBtn = document.createElement('button');
        addBtn.textContent = '+';
        addBtn.title = 'Add Channel';
        addBtn.classList.add('add-channel-btn');
        addBtn.addEventListener('click', () => {
            this.addChannel();
        });

        const channelsSection = this.createSection('Channels', { buttons: [addBtn] });

        this.properties.channels.forEach((channel, index) => {
            // Create a channel card container
            const channelCard = document.createElement('div');
            channelCard.classList.add('channel-card');

            // Create channel content container
            const channelContent = document.createElement('div');
            channelContent.classList.add('channel-content');

            // Add properties to content
            const idRow = this.addPropertyToSection('id', channel.id, channelContent, `channels[${index}]`);
            if (idRow) {
                idRow.classList.add('channel-id-row');

                const label = idRow.querySelector('label');
                if (label) {
                    label.classList.add('channel-id-label');
                }

                const inputElement = idRow.querySelector('input, select, textarea, .toggle-switch');
                if (inputElement) {
                    if (inputElement.tagName === 'DIV' && inputElement.classList.contains('toggle-switch')) {
                        inputElement.classList.add('channel-id-toggle');
                    } else {
                        inputElement.classList.add('channel-id-input');
                    }
                }

                const removeBtn = document.createElement('button');
                removeBtn.textContent = '×';
                removeBtn.title = 'Remove Channel';
                removeBtn.classList.add('remove-channel-btn');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeChannel(index);
                });

                idRow.insertBefore(removeBtn, idRow.firstChild);
            }

            this.addPropertyToSection('event', channel.event || '', channelContent, `channels[${index}]`);
            this.addPropertyToSection('range.min', channel.range ? channel.range.min : 0, channelContent, `channels[${index}]`);
            this.addPropertyToSection('range.max', channel.range ? channel.range.max : 1, channelContent, `channels[${index}]`);
            this.addPropertyToSection('range.defaultValue', channel.range ? channel.range.defaultValue : 0, channelContent, `channels[${index}]`);
            this.addPropertyToSection('range.skew', channel.range ? channel.range.skew : 1, channelContent, `channels[${index}]`);
            this.addPropertyToSection('range.increment', channel.range ? channel.range.increment : 0.01, channelContent, `channels[${index}]`);

            channelCard.appendChild(channelContent);
            channelsSection.contentDiv.appendChild(channelCard);
        });

        panel.appendChild(channelsSection);
    }

    /** 
    * Creates a miscellaneous section for properties not in a specific section.
    * @param properties - The properties object containing miscellaneous data.
    * @param panel - The panel to which the miscellaneous section is appended.
    */
    createMiscSection(properties, panel) {
        const miscSection = this.createSection('Misc');

        // Get the widget instance to access hiddenProps
        const widget = this.widgets.find(w => CabbageUtils.getChannelId(w.props, 0) === CabbageUtils.getChannelId(properties, 0));
        const hiddenProps = widget?.hiddenProps || ['parameterIndex', 'children', 'currentCsdFile', 'value'];

        // Collect misc properties and sort them alphabetically
        const miscProperties = [];
        Object.entries(properties).forEach(([key, value]) => {
            // Skip if this property is in hiddenProps or already handled
            if (hiddenProps.includes(key) || (this.handledProperties && this.handledProperties.has(key))) {
                return;
            }

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Skip adding properties that belong to objects already covered
                return;
            }
            miscProperties.push([key, value]);
        });

        // Sort alphabetically by key
        miscProperties.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

        // Add sorted properties to the misc section
        miscProperties.forEach(([key, value]) => {
            this.addPropertyToSection(key, value, miscSection);
        });

        panel.appendChild(miscSection); // Append miscellaneous section to panel
    }

    /**
     * Adds a new channel to the channels array with default values.
     */
    addChannel() {
        const newChannel = {
            id: this.properties.id || `channel${this.properties.channels.length + 1}`,
            event: 'valueChanged',
            range: { min: 0, max: 1, defaultValue: 0, skew: 1, increment: 0.01 }
        };
        this.properties.channels.push(newChannel);
        if (this.properties.id) {
            delete this.properties.id;
        }
        this.rebuildPropertiesPanel();
        // Send update to vscode (minimize props before sending)
        try {
            const widget = this.widgets.find(w => CabbageUtils.getChannelId(w.props, 0) === CabbageUtils.getChannelId(this.properties, 0));
            let minimized = PropertyPanel.minimizePropsForWidget(this.properties, widget);
            minimized = PropertyPanel.applyExcludes(minimized, PropertyPanel.defaultExcludeKeys);
            const textPayload = PropertyPanel.safeSanitizeForPost(minimized);
            console.log('PropertyPanel: posting updateWidgetProps textPreview:', String(textPayload).slice(0, 200));
            this.vscode.postMessage({
                command: 'updateWidgetProps',
                text: textPayload,
            });
        } catch (e) {
            console.error('PropertyPanel: failed to post addChannel update', e);
            this.vscode.postMessage({ command: 'updateWidgetProps', text: safeSanitizeForPost(this.properties) });
        }
    }

    /**
     * Removes a channel from the channels array at the specified index.
     * @param index - The index of the channel to remove.
     */
    removeChannel(index) {
        if (this.properties.channels.length === 1) {
            // Moving last channel's id to top level
            this.properties.id = this.properties.channels[0].id;
        }
        this.properties.channels.splice(index, 1);
        this.rebuildPropertiesPanel();
        try {
            const widget = this.widgets.find(w => CabbageUtils.getChannelId(w.props, 0) === CabbageUtils.getChannelId(this.properties, 0));
            let minimized = PropertyPanel.minimizePropsForWidget(this.properties, widget);
            minimized = PropertyPanel.applyExcludes(minimized, PropertyPanel.defaultExcludeKeys);
            const textPayload = PropertyPanel.safeSanitizeForPost(minimized);
            console.log('PropertyPanel: posting updateWidgetProps textPreview:', String(textPayload).slice(0, 200));
            this.vscode.postMessage({
                command: 'updateWidgetProps',
                text: textPayload,
            });
        } catch (e) {
            console.error('PropertyPanel: failed to post removeChannel update', e);
            this.vscode.postMessage({ command: 'updateWidgetProps', text: safeSanitizeForPost(this.properties) });
        }
    }

    createSection(name, options = {}) {
        console.log('PropertyPanel: Creating section:', name);
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('property-section');

        const header = document.createElement('div');
        header.classList.add('section-header');

        // Add arrow for collapsible functionality (unless explicitly disabled)
        let arrow;
        const isCollapsible = options.collapsible !== false;
        if (isCollapsible) {
            arrow = document.createElement('span');
            arrow.classList.add('arrow');
            arrow.textContent = '▼';
            header.appendChild(arrow);
        } else {
            header.classList.add('non-collapsible');
        }

        const title = document.createElement('h3');
        // Capitalize first letter of section name
        title.textContent = name.charAt(0).toUpperCase() + name.slice(1);
        header.appendChild(title);

        if (options.buttons && options.buttons.length > 0) {
            header.classList.add('justify-space-between');
            const buttonContainer = document.createElement('div');
            buttonContainer.classList.add('button-container');
            options.buttons.forEach(btn => buttonContainer.appendChild(btn));
            header.appendChild(buttonContainer);
        } else {
            header.classList.add('justify-center');
        }

        // Add click handler for collapsible functionality
        if (isCollapsible) {
            header.addEventListener('click', (e) => {
                console.log('PropertyPanel: Section header clicked:', name);
                // Don't collapse if clicking on buttons
                if (e.target.tagName === 'BUTTON' || e.target.closest('.button-container')) {
                    console.log('PropertyPanel: Clicked on button, not collapsing');
                    return;
                }

                const isCollapsed = sectionDiv.classList.contains('collapsed');
                console.log('PropertyPanel: Section', name, 'isCollapsed:', isCollapsed);
                if (isCollapsed) {
                    sectionDiv.classList.remove('collapsed');
                    arrow.textContent = '▼';
                    sectionDiv.contentDiv.style.display = 'block';
                    console.log('PropertyPanel: Expanded section:', name);
                } else {
                    sectionDiv.classList.add('collapsed');
                    arrow.textContent = '▶';
                    sectionDiv.contentDiv.style.display = 'none';
                    console.log('PropertyPanel: Collapsed section:', name);
                }
            });
        }

        sectionDiv.appendChild(header);

        // Create section content wrapper
        const contentDiv = document.createElement('div');
        contentDiv.classList.add('section-content');
        sectionDiv.appendChild(contentDiv);

        // Store reference to content div for adding properties
        sectionDiv.contentDiv = contentDiv;

        return sectionDiv;
    }

    /** 
    * Creates an input element based on the property key and value.
    * @param key - The property key to create the input for.
    * @param value - The initial value of the input.
    * @param path - The nested path for the property (optional).
    * @returns The created input element.
    */
    createInputElement(key, value, path = '') {
        let input;
        const fullPath = path ? `${path}.${key}` : key;

        // Handle boolean values with toggle switches
        if (typeof value === 'boolean') {
            const toggleContainer = document.createElement('label');
            toggleContainer.classList.add('toggle-switch');

            input = document.createElement('input');
            input.type = 'checkbox';
            input.checked = value;

            const toggleSlider = document.createElement('span');
            toggleSlider.classList.add('toggle-slider');

            toggleContainer.appendChild(input);
            toggleContainer.appendChild(toggleSlider);

            // Return the container instead of just the input
            return toggleContainer;
        }

        // Handle file input
        if (key.toLowerCase().includes('file') && key !== 'currentCsdFile') {
            input = document.createElement('select');
            input.classList.add('loading');

            // Add a default empty option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Loading files...';
            input.appendChild(defaultOption);

            // Request file list from extension
            this.vscode.postMessage({
                command: 'getMediaFiles'
            });

            // Handle the response
            window.addEventListener('message', event => {
                const message = event.data;
                if (message.command === 'mediaFiles') {
                    input.classList.remove('loading');
                    input.innerHTML = ''; // Clear loading message

                    // Add default option
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Select a file...';
                    input.appendChild(defaultOption);

                    // Add file options
                    message.files.forEach(file => {
                        const option = document.createElement('option');
                        option.value = file;
                        option.textContent = file;
                        if (file === value) {
                            option.selected = true;
                        }
                        input.appendChild(option);
                    });
                }
            });

            input.addEventListener('change', this.handleInputChange.bind(this));

        } else if (fullPath.match(/^channels\[\d+\]\.id$/) || fullPath === 'channel' || fullPath === 'id') {
            input = document.createElement('input');
            input.type = 'text';
            const channelMatch = fullPath.match(/^channels\[(\d+)\]\.id$/);
            const channelIndex = channelMatch ? parseInt(channelMatch[1]) : null;
            const currentId = (fullPath === 'channel') ? value : (channelIndex !== null ? (Array.isArray(this.properties?.channels) && this.properties.channels[channelIndex] ? this.properties.channels[channelIndex].id : value) : (this.properties.id || value));
            input.value = currentId;
            input.dataset.originalChannel = currentId;
            input.dataset.skipInputHandler = 'true';

            input.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter' || evt.key === 'Tab') {
                    evt.preventDefault();
                    const newChannel = evt.target.value.trim();
                    const originalChannel = input.dataset.originalChannel;
                    const widget = this.widgets.find(w => {
                        if (channelIndex !== null && Array.isArray(w.props.channels) && w.props.channels[channelIndex]) {
                            return w.props.channels[channelIndex].id === originalChannel;
                        } else if (fullPath === 'id') {
                            return w.props.id === originalChannel;
                        } else if (fullPath === 'channel') {
                            return w.props.channel === originalChannel;
                        }
                        return false;
                    });

                    if (widget) {
                        // Check for uniqueness - but allow the same widget to have matching props.id and channels[0].id
                        const existingDiv = document.getElementById(newChannel);

                        // Find the current widget's div (using the original channel/id)
                        const currentWidgetDiv = document.getElementById(originalChannel);

                        // Only reject if:
                        // 1. An element with this ID exists
                        // 2. It's NOT the current widget we're editing
                        if (existingDiv && existingDiv !== currentWidgetDiv) {
                            console.warn(`Cabbage: A widget with id '${newChannel}' already exists!`);

                            // Show user-friendly notification
                            const existingWidgetType = existingDiv.getAttribute('data-type') || 'widget';
                            PropertyPanel.showNotification(
                                `Cannot use ID "${newChannel}".\n\nThis ID is already used by another ${existingWidgetType}.\n\nPlease choose a unique ID.`,
                                'error'
                            );

                            // Revert the input field to the original value
                            if (input && input.value !== originalChannel) {
                                input.value = originalChannel;
                            }
                            return;
                        }

                        // Update the widget's id property in place
                        if (fullPath === 'id') {
                            widget.props.id = newChannel;
                        } else if (channelIndex !== null && Array.isArray(widget.props.channels) && widget.props.channels[channelIndex]) {
                            widget.props.channels[channelIndex].id = newChannel;
                        }

                        // Update the widget div id
                        const widgetDiv = document.getElementById(originalChannel);
                        if (widgetDiv) {
                            widgetDiv.id = newChannel;
                        }

                        // Send update with old ID so extension can find and update the correct widget
                        try {
                            let minimized = PropertyPanel.minimizePropsForWidget(widget.props, widget);
                            minimized = PropertyPanel.applyExcludes(minimized, PropertyPanel.defaultExcludeKeys);
                            this.vscode.postMessage({
                                command: 'updateWidgetProps',
                                text: PropertyPanel.safeSanitizeForPost(minimized),
                                oldId: originalChannel
                            });
                        } catch (e) {
                            console.error('PropertyPanel: failed to post id-change update', e);
                            this.vscode.postMessage({ command: 'updateWidgetProps', text: PropertyPanel.safeSanitizeForPost(widget.props), oldId: originalChannel });
                        }

                        // If the user pressed Tab we want to preserve tab order across the
                        // rebuild. Capture the current tabbable elements index, rebuild,
                        // then focus the next element.
                        const isTab = evt.key === 'Tab';
                        const isShift = evt.shiftKey === true;
                        if (isTab) {
                            const selectors = '.property-panel input, .property-panel select, .property-panel textarea, .property-panel button, .property-panel [tabindex]:not([tabindex="-1"])';
                            const focusables = Array.from(document.querySelectorAll(selectors));
                            let currIndex = focusables.indexOf(input);
                            if (currIndex === -1) currIndex = 0;

                            // Rebuild the panel (this will recreate DOM nodes)
                            this.rebuildPropertiesPanel();
                            input.blur();

                            // After rebuild, attempt to focus the next or previous element in order
                            setTimeout(() => {
                                const newFocusables = Array.from(document.querySelectorAll(selectors));
                                if (newFocusables.length === 0) return;
                                let targetIndex = isShift ? currIndex - 1 : currIndex + 1;
                                if (targetIndex < 0) targetIndex = 0;
                                if (targetIndex >= newFocusables.length) targetIndex = newFocusables.length - 1;
                                const target = newFocusables[targetIndex] || newFocusables[0];
                                if (target && typeof target.focus === 'function') {
                                    try { target.focus(); } catch (e) { /* ignore focus errors */ }
                                }
                            }, 60);
                        } else {
                            // Default Enter behaviour: rebuild and blur the input
                            this.rebuildPropertiesPanel();
                            input.blur();
                        }
                    }
                    else {
                        console.warn("Cabbage: Cabbage: widget doesn't exist in this context");
                    }
                }
            });
        } else if (key === 'event' && fullPath.includes('channels[')) {
            input = document.createElement('select');
            const events = [
                'valueChanged',
                'mousePressLeft',
                'mousePressRight',
                'mousePressMiddle',
                'mouseMoveX',
                'mouseMoveY',
                'mouseDragX',
                'mouseDragY',
                'mouseInside'
            ];

            // Add a default empty option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = 'Select an event...';
            input.appendChild(defaultOption);

            // Add event options
            events.forEach(event => {
                const option = document.createElement('option');
                option.value = event;
                option.textContent = event;
                if (event === value) {
                    option.selected = true;
                }
                input.appendChild(option);
            });
        } else {
            // Handle color input for properties that are specifically color values
            // But exclude numeric tracker width (e.g. `color.tracker.width`) so it is shown as a number input
            if (fullPath.toLowerCase().includes("color") && !fullPath.includes("stroke.width") && !fullPath.toLowerCase().includes("tracker.width")) {
                input = document.createElement('input');
                input.type = 'text';
                input.value = value; // Set the initial color value
                input.classList.add('color-input');

                // Calculate contrasting text color (light or dark) based on background
                const getContrastColor = (hexColor) => {
                    const hex = hexColor.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    return luminance > 0.5 ? '#000000' : '#FFFFFF';
                };

                const updateColorStyles = (hexColor) => {
                    if (!/^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hexColor)) {
                        return;
                    }
                    input.style.setProperty('--color-value', hexColor);
                    const contrast = getContrastColor(hexColor);
                    input.style.setProperty('--contrast-color', contrast);
                    input.style.backgroundColor = hexColor;
                    input.style.color = contrast;
                };

                updateColorStyles(value);
                input.addEventListener('input', () => updateColorStyles(input.value.trim()));

                // Initialize color picker
                const picker = new CP(input);
                picker.on('change', (r, g, b, a) => {
                    const hexColor = CP.HEX([r, g, b, a]);
                    input.value = hexColor; // Update input value to HEX
                    updateColorStyles(hexColor);
                    // Create a proper Event object to pass to handleInputChange
                    const event = new Event('input', { bubbles: true });
                    Object.defineProperty(event, 'target', { value: input, enumerable: true });
                    this.handleInputChange(event); // Trigger change handler
                });
            }
            // Handle radioGroup as text input (not number)
            else if (key.toLowerCase() === 'radiogroup') {
                input = document.createElement('input');
                input.type = 'text';
                input.value = value; // Set the initial value
            }
            // Handle numeric input for stroke width and other numeric properties
            else if (fullPath.includes("stroke.width") || typeof value === 'number') {
                input = document.createElement('input');
                input.type = 'number'; // Set input type to number
                input.value = value; // Set the initial value
            }
            // Handle font family selection
            else if (key.toLowerCase().includes("family")) {
                input = document.createElement('select');
                const fontList = [
                    'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS',
                    'Times New Roman', 'Georgia', 'Garamond', 'Courier New',
                    'Brush Script MT', 'Comic Sans MS', 'Impact', 'Lucida Sans',
                    'Palatino', 'Century Gothic', 'Bookman', 'Candara', 'Consolas'
                ];

                // Populate font family options
                fontList.forEach((font) => {
                    const option = document.createElement('option');
                    option.value = font;
                    option.textContent = font;
                    input.appendChild(option);
                });
                input.value = value || 'Verdana'; // Set default value if none provided
            }
            // Handle text alignment selection
            else if (key.toLowerCase() === 'align' || key.toLowerCase().endsWith('.align')) {
                input = document.createElement('select');
                let alignments = ['left', 'right', 'centre'];

                // Special case for label.align on rotarySlider (vertical alignment)
                if (this.type === 'rotarySlider' && fullPath === 'label.align') {
                    alignments = ['auto', 'top', 'bottom'];
                }
                // Special case for label.align on button (horizontal alignment)
                else if (this.type === 'button' && fullPath === 'label.align') {
                    alignments = ['left', 'center', 'right'];
                }

                // Populate alignment options
                alignments.forEach((align) => {
                    const option = document.createElement('option');
                    option.value = align;
                    option.textContent = align;
                    input.appendChild(option);
                });
                input.value = value || alignments[0]; // Set default value if none provided
            }
            // Default case for text input
            else {
                input = document.createElement('input');
                input.type = 'text';
                input.value = `${value}`; // Set the initial value
                if (key.toLowerCase() === 'type') {
                    input.readOnly = true; // Make type input read-only
                }
            }
        }


        return input; // Return the created input element
    }

    /** 
     * Adds a property input to a specific section. We can also ensure certain properties
     * are never added, such as 'currentCsdFile' and 'value' which are both internal 
     * properties of each widget.
     *   
     * @param key - The property key to be added.
     * @param value - The value of the property.
     * @param section - The section to which the property is added.
     * @param path - The nested path for the property (optional).
     */
    addPropertyToSection(key, value, section, path = '', isMixed = false) {
        if (key === 'currentCsdFile' || key === 'value') {
            return;
        }

        const propertyDiv = document.createElement('div');
        propertyDiv.classList.add('property');

        const label = document.createElement('label');

        // Format the key for display
        const formattedKey = key
            .split('.')
            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');

        label.textContent = formattedKey;
        propertyDiv.appendChild(label);

        // Create the full property path for the input id
        const fullPropertyPath = path ? `${path}.${key}` : key;
        const inputElement = this.createInputElement(key, value, path);

        // Find the actual input element (could be nested in a container like toggle switch)
        // Handle both INPUT and SELECT elements
        let input = null;
        if (inputElement.tagName === 'INPUT' || inputElement.tagName === 'SELECT') {
            input = inputElement;
        } else {
            input = inputElement.querySelector('input, select');
        }

        // Set the full property path as the input id
        if (input) {
            input.id = fullPropertyPath;

            // For multi-widget mode, store selected widget IDs instead of single parent
            if (this.isMultiMode) {
                input.dataset.multiWidget = 'true';
                input.dataset.selectedIds = JSON.stringify(this.selectedWidgets.map(w => w.props.id || CabbageUtils.getChannelId(w.props, 0)));
            } else {
                input.dataset.parent = CabbageUtils.getWidgetDivId(this.properties); // Set data attribute for parent widget
            }

            // Set placeholder for mixed values
            if (isMixed && input.tagName === 'INPUT') {
                input.placeholder = '(mixed)';
                input.style.fontStyle = 'italic';
            }

            input.addEventListener('input', this.handleInputChange.bind(this)); // Attach input event listener
            if (input.type === 'checkbox' || input.tagName === 'SELECT') {
                // Some browsers/extensions fire change more reliably for checkboxes and selects
                input.addEventListener('change', this.handleInputChange.bind(this));
            }
        }

        propertyDiv.appendChild(inputElement);
        // Handle both section objects (with contentDiv) and direct DOM elements
        if (section.contentDiv) {
            section.contentDiv.appendChild(propertyDiv);
        } else {
            section.appendChild(propertyDiv);
        }

        return propertyDiv;
    }

    /**
     * Sets a nested property in an object using a dot-separated path that may include array indices.
     * @param obj - The object to set the property on.
     * @param path - The path like 'channels[0].id'.
     * @param value - The value to set.
     */
    setNestedProperty(obj, path, value) {
        console.log('PropertyPanel: setNestedProperty called with path:', path, 'value:', value);
        const keys = [];
        let current = '';
        for (let i = 0; i < path.length; i++) {
            if (path[i] === '.' || path[i] === '[' || path[i] === ']') {
                if (current) {
                    keys.push(current);
                    current = '';
                }
                if (path[i] === '[') {
                    // Start of index
                    i++; // skip [
                    let index = '';
                    while (i < path.length && path[i] !== ']') {
                        index += path[i];
                        i++;
                    }
                    keys.push(parseInt(index));
                }
            } else {
                current += path[i];
            }
        }
        if (current) keys.push(current);

        console.log('PropertyPanel: parsed keys:', keys);

        let currentObj = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            const key = keys[i];
            if (typeof key === 'number') {
                if (!Array.isArray(currentObj)) currentObj = [];
                if (!currentObj[key]) currentObj[key] = {};
                currentObj = currentObj[key];
            } else {
                if (!currentObj[key]) currentObj[key] = {};
                currentObj = currentObj[key];
            }
        }
        const lastKey = keys[keys.length - 1];

        // If value is an empty string, delete the property instead of setting it
        // This ensures that cleared fields (like SVG markup) are actually removed
        if (value === '' && typeof lastKey === 'string') {
            delete currentObj[lastKey];
            console.log('PropertyPanel: deleted', path, '(was set to empty string)');
        } else if (typeof lastKey === 'number') {
            if (!Array.isArray(currentObj)) currentObj = [];
            currentObj[lastKey] = value;
            console.log('PropertyPanel: set', path, 'to', value);
        } else {
            currentObj[lastKey] = value;
            console.log('PropertyPanel: set', path, 'to', value);
        }
    }

    /** 
     * Handles changes to input fields.
     * @param evt - The input event or the parent element of the input.
     */
    handleInputChange(evt) {
        let input;
        if (evt instanceof Event) {
            input = evt.target;
        } else {
            input = evt;
            const innerInput = evt.querySelector('input');
            input = innerInput;
        }

        // Ignore events for inputs that are flagged to skip the handler
        if (input.dataset.skipInputHandler === 'true') {
            return;
        }

        // Ignore events fired during panel initialization. Inputs are marked
        // as initialized shortly after createPanel finishes. Some UI
        // components (colour pickers, selects, etc.) may emit synthetic
        // input/change events while being constructed — we don't want those
        // to be treated as user edits.
        if (this._suppressEvents || input.dataset.initialized !== 'true') {
            console.log('PropertyPanel: ignoring initialization input event for', input && input.id);
            return;
        }

        console.log('PropertyPanel: handleInputChange called for input.id:', input.id, 'type:', input.type, 'value:', input.value, 'checked:', input.checked);

        // Handle multi-widget mode
        if (input.dataset.multiWidget === 'true') {
            this.handleMultiWidgetChange(input);
            return;
        }

        this.widgets.forEach((widget) => {
            const widgetId = widget.props.id;
            const channelId = widget.props.channels && widget.props.channels[0] ? widget.props.channels[0].id : null;
            const parentId = input.dataset.parent;

            // Match by either widget ID or channel ID
            if (widgetId === parentId || channelId === parentId) {
                const path = input.id;
                const inputValue = input.value;
                const isColorProperty = path.toLowerCase().includes('color');

                // Helper to safely get the current value at a nested path
                const getNestedValue = (obj, pathStr) => {
                    const keys = [];
                    let current = '';
                    for (let i = 0; i < pathStr.length; i++) {
                        if (pathStr[i] === '.' || pathStr[i] === '[' || pathStr[i] === ']') {
                            if (current) {
                                keys.push(current);
                                current = '';
                            }
                            if (pathStr[i] === '[') {
                                i++;
                                let index = '';
                                while (i < pathStr.length && pathStr[i] !== ']') {
                                    index += pathStr[i];
                                    i++;
                                }
                                keys.push(parseInt(index));
                            }
                        } else {
                            current += pathStr[i];
                        }
                    }
                    if (current) keys.push(current);
                    let cur = obj;
                    for (let k of keys) {
                        if (cur == null) return undefined;
                        cur = cur[k];
                    }
                    return cur;
                };

                const currentValue = getNestedValue(widget.props, path);

                // Parse value with proper types
                let parsedValue;
                if (input.type === 'checkbox') {
                    parsedValue = input.checked; // true/false
                } else if (isColorProperty) {
                    parsedValue = inputValue; // keep hex string
                } else if (typeof currentValue === 'boolean') {
                    // Coerce string to boolean if the model expects a boolean
                    const v = String(inputValue).toLowerCase();
                    parsedValue = (v === 'true' || v === '1');
                } else if (input.type === 'number') {
                    const n = Number(inputValue);
                    parsedValue = isNaN(n) ? inputValue : n;
                } else if (!isNaN(inputValue) && inputValue !== '') {
                    // Numeric strings to numbers (but do not coerce empty strings)
                    parsedValue = Number(inputValue);
                } else {
                    parsedValue = inputValue;
                }

                console.log('PropertyPanel: updating widget with channel id:', input.dataset.parent, 'setting', input.id, 'to', parsedValue);

                // Handle nested properties
                this.setNestedProperty(widget.props, path, parsedValue);

                console.log('PropertyPanel: updated range:', JSON.stringify(widget.props.channels[0].range, null, 2));

                CabbageUtils.updateBounds(widget.props, input.id);

                const widgetDiv = CabbageUtils.getWidgetDiv(widget.props);
                if (widget.props['type'] === 'form') {
                    widget.updateSVG();
                } else {
                    console.trace("Widget Div:", widgetDiv);
                    widgetDiv.innerHTML = widget.getInnerHTML();
                }

                // Update widget styles if the index or zIndex property changed
                if (path === 'index' || path === 'zIndex') {
                    WidgetManager.updateWidgetStyles(widgetDiv, widget.props);
                }

                console.log('PropertyPanel: sending updateWidgetProps to VSCode');
                try {
                    let minimized = PropertyPanel.minimizePropsForWidget(widget.props, widget);
                    minimized = PropertyPanel.applyExcludes(minimized, PropertyPanel.defaultExcludeKeys);
                    const textPayload = PropertyPanel.safeSanitizeForPost(minimized);
                    console.log('PropertyPanel: posting updateWidgetProps textPreview:', String(textPayload).slice(0, 200));
                    this.vscode.postMessage({
                        command: 'updateWidgetProps',
                        text: textPayload,
                    });
                } catch (e) {
                    console.error('PropertyPanel: failed to post widgetUpdate', e);
                    const fallback = PropertyPanel.safeSanitizeForPost(widget.props);
                    console.log('PropertyPanel: posting fallback updateWidgetProps textPreview:', String(fallback).slice(0, 200));
                    this.vscode.postMessage({ command: 'updateWidgetProps', text: fallback });
                }
            }
        });
    }

    /**
     * Handles property changes for multiple selected widgets
     * @param input - The input element that changed
     */
    handleMultiWidgetChange(input) {
        const path = input.id;
        const inputValue = input.value;

        // Parse the value
        let parsedValue;
        if (input.type === 'checkbox') {
            parsedValue = input.checked;
        } else if (input.type === 'number') {
            const n = Number(inputValue);
            parsedValue = isNaN(n) ? inputValue : n;
        } else if (!isNaN(inputValue) && inputValue !== '') {
            parsedValue = Number(inputValue);
        } else {
            parsedValue = inputValue;
        }

        console.log(`PropertyPanel: Multi-widget update - setting ${path} to ${parsedValue} for ${this.selectedWidgets.length} widgets`);

        // Update all selected widgets
        this.selectedWidgets.forEach((widget, index) => {
            const widgetId = widget.props.id || CabbageUtils.getChannelId(widget.props, 0);
            console.log(`PropertyPanel: Processing widget ${index + 1}/${this.selectedWidgets.length}: ${widgetId}`);

            // Update the property
            this.setNestedProperty(widget.props, path, parsedValue);

            // Update the visual display
            const widgetDiv = CabbageUtils.getWidgetDiv(widget.props);
            if (widgetDiv) {
                if (widget.props['type'] === 'form') {
                    widget.updateSVG();
                } else {
                    widgetDiv.innerHTML = widget.getInnerHTML();
                }

                // Update widget styles if zIndex changed
                if (path === 'index' || path === 'zIndex') {
                    WidgetManager.updateWidgetStyles(widgetDiv, widget.props);
                }

                // Update bounds if bounds property changed
                CabbageUtils.updateBounds(widget.props, path);
            }

            // Send update to VSCode
            try {
                console.log(`PropertyPanel: Minimizing props for ${widgetId}, has rawDefaults: ${!!widget.rawDefaults}, has originalProps: ${!!widget.originalProps}`);
                let minimized = PropertyPanel.minimizePropsForWidget(widget.props, widget);
                minimized = PropertyPanel.applyExcludes(minimized, PropertyPanel.defaultExcludeKeys);
                const textPayload = PropertyPanel.safeSanitizeForPost(minimized);
                console.log(`PropertyPanel: Sending multi-widget update for ${widgetId}, payload size: ${textPayload.length} chars`);
                console.log(`PropertyPanel: Payload preview: ${textPayload.substring(0, 200)}`);
                this.vscode.postMessage({
                    command: 'updateWidgetProps',
                    text: textPayload,
                });
                console.log(`PropertyPanel: Successfully posted message for ${widgetId}`);
            } catch (e) {
                console.error(`PropertyPanel: failed to post multi-widget update for ${widgetId}`, e);
                const fallback = PropertyPanel.safeSanitizeForPost(widget.props);
                this.vscode.postMessage({ command: 'updateWidgetProps', text: fallback });
            }
        });
    }

    /** 
     * Static method to reattach event listeners to widgets.
     * @param widget - The widget to which listeners are attached.
     * @param widgetDiv - The widget's DOM element.
     */
    static reattachListeners(widget, widgetDiv) {
        let vscode;
        if (typeof acquireVsCodeApi === 'function') {
            // Acquire VSCode API if not already available
            if (!vscode) {
                vscode = acquireVsCodeApi();
            }
            if (typeof widget.addVsCodeEventListeners === 'function') {
                widget.addVsCodeEventListeners(widgetDiv, vscode); // Attach VSCode event listeners to widget
            }
        } else if (widget.props.type !== "form") {
            if (typeof widget.addEventListeners === 'function') {
                widget.addEventListeners(widgetDiv); // Attach standard event listeners if not a form
            }
        }
    }

    /** 
     * Static method to update the panel with new properties and events.
     * @param vscode - The VSCode API instance.
     * @param input - The input object or array of objects with property updates.
     * @param widgets - The list of widgets to update.
     */
    static async updatePanel(vscode, input, widgets) {
        console.log('PropertyPanel: updatePanel called with input:', JSON.stringify(input, null, 2));
        // Ensure input is an array of objects
        this.vscode = vscode;
        let events = Array.isArray(input) ? input : [input]; // Normalize input to an array
        console.log('PropertyPanel: normalized events:', events.length, 'events');

        // Check if any event has name: null, if so, hide the panel
        const hasNullName = events.some(event => event.name === null);
        if (hasNullName) {
            const element = document.querySelector('.property-panel');
            if (element && element.style.visibility === 'visible') {
                console.log('PropertyPanel: ignoring null name since panel is already visible');
                return;
            }
            console.log('PropertyPanel: has null name, hiding panel');
            if (element) {
                element.style.visibility = "hidden";
            }
            return;
        }

        const element = document.querySelector('.property-panel');
        if (element) {
            console.log('PropertyPanel: current visibility:', element.style.visibility);
            console.log('PropertyPanel: setting panel visibility to visible');
            element.style.visibility = "visible"; // Make the panel visible
            element.innerHTML = ''; // Clear previous content

            // Add mutation observer to log visibility changes
            if (!this.observer) {
                this.observer = new MutationObserver((mutations) => {
                    mutations.forEach((mutation) => {
                        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                            const visibility = element.style.visibility;
                            console.log('PropertyPanel: visibility changed to:', visibility);
                        }
                    });
                });
                this.observer.observe(element, { attributes: true, attributeFilter: ['style'] });
            }
        } else {
            console.log('PropertyPanel: panel element not found');
        }

        // Iterate over the array of event objects
        events.forEach(eventObj => {
            const { eventType, name, bounds, widgets: pastedWidgets } = eventObj; // Destructure event properties
            console.log('PropertyPanel: processing event:', eventType, 'for widget:', name);


            // Handle paste event specially - create new widgets
            if (eventType === 'pasteSelection' && pastedWidgets) {
                console.log(`PropertyPanel: Pasting ${pastedWidgets.length} widget(s)`);

                pastedWidgets.forEach(widgetProps => {
                    // Send widget creation message to VSCode
                    const widgetJson = JSON.stringify(widgetProps);
                    console.log('PropertyPanel: Creating pasted widget:', widgetProps.id || CabbageUtils.getChannelId(widgetProps, 0));

                    this.vscode.postMessage({
                        command: 'createWidget',
                        widgetJson: widgetJson
                    });
                });

                return; // Don't process further for paste events
            }

            // Check if multiple widgets are selected
            const selection = eventObj.selection || [name];
            if (selection.length > 1 && eventType === 'click') {
                console.log(`PropertyPanel: Multiple widgets selected (${selection.length})`);

                // Find all selected widgets
                const selectedWidgets = selection.map(id =>
                    widgets.find(w =>
                        w.props.id === id ||
                        CabbageUtils.getChannelId(w.props, 0) === id
                    )
                ).filter(w => w !== undefined);

                if (selectedWidgets.length > 0) {
                    // Create multi-widget property panel
                    new PropertyPanel(this.vscode, 'multi', selectedWidgets, widgets);
                }
                return; // Don't process single widget logic
            }

            console.log('PropertyPanel: searching for widget with name:', name);
            console.log('PropertyPanel: available widgets:', widgets.map(w => ({
                type: w.props.type,
                id: w.props.id,
                channelId: CabbageUtils.getChannelId(w.props, 0)
            })));

            widgets.forEach((widget, index) => {
                const widgetId = widget.props.id;
                let channelId = null;
                try {
                    channelId = CabbageUtils.getChannelId(widget.props, 0);
                } catch (e) {
                    // Widget might be invalid or have no channel, ignore
                }

                console.log(`PropertyPanel: checking widget ${index}: id=${widgetId}, channelId=${channelId}, name=${name}`);

                let isMatch = false;
                if (widgetId) {
                    isMatch = (String(widgetId) === String(name));
                } else if (channelId) {
                    isMatch = (String(channelId) === String(name));
                }

                if (!isMatch && name === 'MainForm' && widget.props.type === 'form') {
                    isMatch = true;
                }

                if (isMatch) {
                    console.log('PropertyPanel: found matching widget, updating...');
                    // Update widget size based on bounds if available
                    if (typeof widget.props?.size === 'object' && widget.props.size !== null) {
                        if (bounds.w > 0 && bounds.h > 0) {
                            widget.props.size.width = Math.floor(bounds.w);
                            widget.props.size.height = Math.floor(bounds.h);
                        }
                    }

                    // Update widget bounds if available
                    if (typeof widget.props?.bounds === 'object' && widget.props.bounds !== null) {
                        if (Object.keys(bounds).length === 4) {
                            if (bounds.w > 0 && bounds.h > 0) {
                                widget.props.bounds.width = Math.floor(bounds.w);
                                widget.props.bounds.height = Math.floor(bounds.h);
                            }
                            widget.props.bounds.left = Math.floor(bounds.x);
                            widget.props.bounds.top = Math.floor(bounds.y);
                        }
                    }

                    // Handle specific widget types with dedicated update methods
                    if (eventType !== 'click') {
                        if (widget.props.type === "gentable") {
                            widget.updateTable(); // Update table for gentable type
                        } else if (widget.props.type === "form") {
                            widget.updateSVG(); // Update SVG for form type
                        } else {
                            const widgetDiv = CabbageUtils.getWidgetDiv(widget.props);
                            if (widgetDiv) {
                                widgetDiv.innerHTML = widget.getInnerHTML(); // Update HTML for other types
                            }
                        }
                    }
                    console.log('PropertyPanel: creating new PropertyPanel instance for widget:', name);
                    // Create a new PropertyPanel instance for the widget
                    new PropertyPanel(vscode, widget.props.type, widget.props, widgets);
                    if (!this.vscode) {
                        console.error("not valid");
                    }

                    // Only send an update to VSCode when this is a real property change
                    // (not just a click to open the panel). Clicks should open the panel
                    // without triggering an update that could insert default channel objects.
                    if (eventType !== 'click') {
                        // Delay sending messages to VSCode to avoid slow responses
                        setTimeout(() => {
                            try {
                                let minimized = PropertyPanel.minimizePropsForWidget(widget.props, widget);
                                minimized = PropertyPanel.applyExcludes(minimized, PropertyPanel.defaultExcludeKeys);
                                const textPayload = PropertyPanel.safeSanitizeForPost(minimized);
                                console.log('PropertyPanel: posting updatePanel updateWidgetProps textPreview:', String(textPayload).slice(0, 200));
                                this.vscode.postMessage({
                                    command: 'updateWidgetProps',
                                    text: textPayload,
                                });
                            } catch (e) {
                                console.error('PropertyPanel: failed to post updatePanel updateWidgetProps', e);
                                const fallback = PropertyPanel.safeSanitizeForPost(widget.props);
                                console.log('PropertyPanel: posting fallback updatePanel updateWidgetProps textPreview:', String(fallback).slice(0, 200));
                                this.vscode.postMessage({ command: 'updateWidgetProps', text: fallback });
                            }
                        }, (index + 1) * 150); // Delay increases with index
                    } else {
                        console.log('PropertyPanel: click event - not sending update to VSCode');
                    }
                }
            });
        });
    }

    /**
     * Rebuild properties panel when a channel name is updated
     */
    rebuildPropertiesPanel() {
        console.log('PropertyPanel: rebuildPropertiesPanel called');
        // Clear the existing panel content
        const panel = document.querySelector('.property-panel');
        panel.innerHTML = ''; // Clear the panel's content

        // Recreate the panel with the updated widgets
        this.createPanel(); // Assuming createPanel handles the creation of the panel
    }
}

// Add a default export for the PropertyPanel class
export default PropertyPanel;
