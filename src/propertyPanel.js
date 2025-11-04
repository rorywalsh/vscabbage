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
    constructor(vscode, type, properties, widgets) {
        this.vscode = vscode;           // VSCode API instance
        this.type = type;               // Type of the widget
        this.properties = properties;   // Properties of the widget
        this.widgets = widgets;         // List of widgets associated with this panel
        console.log('PropertyPanel: Constructor called for type:', type, 'channel:', CabbageUtils.getChannelId(properties, 0));
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
            if (widget.props.channels) {
                widget.props.channels.forEach(channel => {
                    if (allIds.has(channel.id)) {
                        console.error(`Conflict detected: Widget channel '${channel.id}' must be unique!`);
                    } else {
                        allIds.add(channel.id);
                    }
                });
            }
        });
    }
    /** 
     * Creates the main property panel and its sections.
     */
    createPanel() {
        console.log('PropertyPanel: createPanel called for type:', this.type, 'channel:', CabbageUtils.getChannelId(this.properties, 0));
        const panel = document.querySelector('.property-panel');
        panel.innerHTML = ''; // Clear the panel's content
        this.clearInputs();   // Remove any previous input listeners

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

        // Create a special section for type and channel
        this.createSpecialSection(panel);

        // Create sections based on the properties object
        this.createSections(this.properties, panel);
        this.createMiscSection(this.properties, panel);
    }

    /** 
     * Creates a special section for widget properties (Type and Channel).
     * @param panel - The panel to which the special section is appended.
     */
    createSpecialSection(panel) {
        const specialSection = this.createSection('Widget Properties');

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
            // Create a collapsible channel card
            const channelCard = document.createElement('div');
            channelCard.classList.add('channel-card');

            // Create channel header (non-collapsible)
            const channelHeader = document.createElement('div');
            channelHeader.classList.add('channel-header');

            // Channel title
            const channelTitle = document.createElement('span');
            channelTitle.textContent = `${channel.id || `Channel ${index + 1}`}`;
            channelTitle.classList.add('channel-title');

            // Remove button
            const removeBtn = document.createElement('button');
            removeBtn.textContent = '×';
            removeBtn.title = 'Remove Channel';
            removeBtn.classList.add('remove-channel-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent any parent click handlers
                this.removeChannel(index);
            });

            channelHeader.appendChild(channelTitle);
            channelHeader.appendChild(removeBtn);

            // Create channel content (always visible)
            const channelContent = document.createElement('div');
            channelContent.classList.add('channel-content');

            // Add properties to content
            this.addPropertyToSection('id', channel.id, channelContent, `channels[${index}]`);
            this.addPropertyToSection('event', channel.event || '', channelContent, `channels[${index}]`);
            this.addPropertyToSection('range.min', channel.range ? channel.range.min : 0, channelContent, `channels[${index}]`);
            this.addPropertyToSection('range.max', channel.range ? channel.range.max : 1, channelContent, `channels[${index}]`);
            this.addPropertyToSection('range.defaultValue', channel.range ? channel.range.defaultValue : 0, channelContent, `channels[${index}]`);
            this.addPropertyToSection('range.skew', channel.range ? channel.range.skew : 1, channelContent, `channels[${index}]`);
            this.addPropertyToSection('range.increment', channel.range ? channel.range.increment : 0.01, channelContent, `channels[${index}]`);

            channelCard.appendChild(channelHeader);
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
        // Send update to vscode
        this.vscode.postMessage({
            command: 'widgetUpdate',
            text: JSON.stringify(CabbageUtils.sanitizeForEditor(this.properties)),
        });
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
        this.vscode.postMessage({
            command: 'widgetUpdate',
            text: JSON.stringify(CabbageUtils.sanitizeForEditor(this.properties)),
        });
    }

    createSection(name, options = {}) {
        console.log('PropertyPanel: Creating section:', name);
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('property-section');

        const header = document.createElement('div');
        header.classList.add('section-header');

        // Add arrow for collapsible functionality
        const arrow = document.createElement('span');
        arrow.classList.add('arrow');
        arrow.textContent = '▼';
        header.appendChild(arrow);

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
                console.log('PropertyPanel: Expanded section:', name);
            } else {
                sectionDiv.classList.add('collapsed');
                arrow.textContent = '▶';
                console.log('PropertyPanel: Collapsed section:', name);
            }
        });

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
                        // Check for uniqueness
                        const existingDiv = document.getElementById(newChannel);
                        if (existingDiv && existingDiv.id !== originalChannel) {
                            console.warn(`Cabbage: A widget with id '${newChannel}' already exists!`);
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
                        this.vscode.postMessage({
                            command: 'widgetUpdate',
                            text: JSON.stringify(CabbageUtils.sanitizeForEditor(widget.props)),
                            oldId: originalChannel
                        });

                        // Rebuild the properties panel to reflect the ID change
                        this.rebuildPropertiesPanel();

                        input.blur();
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
                    // Convert hex to RGB
                    const hex = hexColor.replace('#', '');
                    const r = parseInt(hex.substr(0, 2), 16);
                    const g = parseInt(hex.substr(2, 2), 16);
                    const b = parseInt(hex.substr(4, 2), 16);
                    // Calculate luminance
                    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                    return luminance > 0.5 ? '#000000' : '#FFFFFF';
                };

                // Set CSS custom properties for dynamic styling
                input.style.setProperty('--color-value', value);
                input.style.setProperty('--contrast-color', getContrastColor(value));

                // Initialize color picker
                const picker = new CP(input);
                picker.on('change', (r, g, b, a) => {
                    const hexColor = CP.HEX([r, g, b, a]);
                    input.value = hexColor; // Update input value to HEX
                    // Update CSS custom properties for dynamic styling
                    input.style.setProperty('--color-value', hexColor);
                    input.style.setProperty('--contrast-color', getContrastColor(hexColor));
                    // Create a proper Event object to pass to handleInputChange
                    const event = new Event('input', { bubbles: true });
                    Object.defineProperty(event, 'target', { value: input, enumerable: true });
                    this.handleInputChange(event); // Trigger change handler
                });
            }
            // Handle numeric input for stroke width and other numeric properties
            else if (fullPath.includes("stroke.width") || typeof value === 'number') {
                input = document.createElement('input');
                input.type = 'number'; // Set input type to number
                input.value = value; // Set the initial value
                input.min = 0; // Set minimum value if applicable
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
                const alignments = ['left', 'right', 'centre'];

                // Populate alignment options
                alignments.forEach((align) => {
                    const option = document.createElement('option');
                    option.value = align;
                    option.textContent = align;
                    input.appendChild(option);
                });
                input.value = value || 'centre'; // Set default value if none provided
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

        // Set input attributes
        input.id = key; // Use the key as ID directly (will be overridden in addPropertyToSection with full path)
        input.dataset.parent = CabbageUtils.getChannelId(this.properties, 0); // Set data attribute for parent channel
        input.addEventListener('input', this.handleInputChange.bind(this)); // Attach input event listener

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
    addPropertyToSection(key, value, section, path = '') {
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
        const input = this.createInputElement(key, value, path);

        // Set the full property path as the input id
        input.id = fullPropertyPath;

        propertyDiv.appendChild(input);
        // Handle both section objects (with contentDiv) and direct DOM elements
        if (section.contentDiv) {
            section.contentDiv.appendChild(propertyDiv);
        } else {
            section.appendChild(propertyDiv);
        }
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
        if (typeof lastKey === 'number') {
            if (!Array.isArray(currentObj)) currentObj = [];
            currentObj[lastKey] = value;
        } else {
            currentObj[lastKey] = value;
        }
        console.log('PropertyPanel: set', path, 'to', value);
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

        if (input.dataset.skipInputHandler === 'true') {
            return;
        }

        console.log('PropertyPanel: handleInputChange called for input.id:', input.id, 'value:', input.value);

        this.widgets.forEach((widget) => {
            if (CabbageUtils.getChannelId(widget.props, 0) === input.dataset.parent) {
                const inputValue = input.value;
                // Don't parse color values as numbers - keep them as hex strings
                const isColorProperty = input.id.toLowerCase().includes('color');
                let parsedValue = (isColorProperty || isNaN(inputValue)) ? inputValue : Number(inputValue);

                console.log('PropertyPanel: updating widget with channel id:', input.dataset.parent, 'setting', input.id, 'to', parsedValue);

                // Handle nested properties
                this.setNestedProperty(widget.props, input.id, parsedValue);

                console.log('PropertyPanel: updated range:', JSON.stringify(widget.props.channels[0].range, null, 2));

                CabbageUtils.updateBounds(widget.props, input.id);

                const widgetDiv = CabbageUtils.getWidgetDiv(CabbageUtils.getChannelId(widget.props, 0));
                if (widget.props['type'] === 'form') {
                    widget.updateSVG();
                } else {
                    console.trace("Widget Div:", widgetDiv);
                    widgetDiv.innerHTML = widget.getInnerHTML();
                }

                // Update widget styles if the index property changed (for z-index updates)
                if (input.id === 'index') {
                    WidgetManager.updateWidgetStyles(widgetDiv, widget.props);
                }

                console.log('PropertyPanel: sending widgetUpdate to VSCode');
                this.vscode.postMessage({
                    command: 'widgetUpdate',
                    text: JSON.stringify(CabbageUtils.sanitizeForEditor(widget.props)),
                });
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
            const { eventType, name, bounds } = eventObj; // Destructure event properties
            console.log('PropertyPanel: processing event:', eventType, 'for widget:', name);

            console.log('PropertyPanel: searching for widget with name:', name);
            console.log('PropertyPanel: available widgets:', widgets.map(w => ({
                type: w.props.type,
                id: w.props.id,
                channelId: CabbageUtils.getChannelId(w.props, 0)
            })));

            widgets.forEach((widget, index) => {
                const widgetChannelId = CabbageUtils.getChannelId(widget.props, 0);
                console.log(`PropertyPanel: checking widget ${index}: channelId=${widgetChannelId}, name=${name}, match=${widgetChannelId === name}`);
                if (widgetChannelId === name) {
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
                            const widgetDiv = CabbageUtils.getWidgetDiv(CabbageUtils.getChannelId(widget.props, 0));
                            widgetDiv.innerHTML = widget.getInnerHTML(); // Update HTML for other types
                        }
                    }
                    console.log('PropertyPanel: creating new PropertyPanel instance for widget:', name);
                    // Create a new PropertyPanel instance for the widget
                    new PropertyPanel(vscode, widget.props.type, widget.props, widgets);
                    if (!this.vscode) {
                        console.error("not valid");
                    }

                    // Delay sending messages to VSCode to avoid slow responses
                    setTimeout(() => {
                        this.vscode.postMessage({
                            command: 'widgetUpdate',
                            text: JSON.stringify(CabbageUtils.sanitizeForEditor(widget.props)),
                        });
                    }, (index + 1) * 150); // Delay increases with index
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
