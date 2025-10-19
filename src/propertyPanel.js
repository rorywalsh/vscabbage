// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

/**
 * PropertyPanel Class. Lightweight component that updates its innerHTML when properties change.
 * This makes use of https://taufik-nurrohman.js.org/CP/ for colour pickers.
 */
import { CabbageUtils } from "./cabbage/utils.js";

export class PropertyPanel {
    constructor(vscode, type, properties, widgets) {
        this.vscode = vscode;           // VSCode API instance
        this.type = type;               // Type of the widget
        this.properties = properties;   // Properties of the widget
        this.widgets = widgets;         // List of widgets associated with this panel
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
        const panel = document.querySelector('.property-panel');
        panel.innerHTML = ''; // Clear the panel's content
        this.clearInputs();   // Remove any previous input listeners

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

        // Add Channels if it exists
        if (this.properties.channels) {
            this.createChannelsSection(specialSection);
            this.handledProperties.add('channels'); // Mark as handled
        }

        panel.appendChild(specialSection); // Append special section to panel
    }

    /** 
     * Creates sections for each group of properties.
     * @param properties - The properties object containing section data.
     * @param panel - The panel to which the sections are appended.
     */
    createSections(properties, panel) {
        // Get the widget instance to access hiddenProps
        const widget = this.widgets.find(w => CabbageUtils.getChannelId(w.props, 0) === CabbageUtils.getChannelId(properties, 0));
        const hiddenProps = widget?.hiddenProps || [];

        Object.entries(properties).forEach(([sectionName, sectionProperties]) => {
            // Skip if this property is in hiddenProps

            if (hiddenProps.includes(sectionName)) {
                console.log("Cabbage: Cabbage: hidden props", hiddenProps, " section name", sectionName);
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
        const channelsSection = this.createSection('Channels');

        this.properties.channels.forEach((channel, index) => {
            const channelSubSection = this.createSection(`Channel ${index + 1}`);

            // Add id
            this.addPropertyToSection('id', channel.id, channelSubSection, `channels[${index}]`);

            // Add event
            this.addPropertyToSection('event', channel.event || '', channelSubSection, `channels[${index}]`);

            // Add range.min
            this.addPropertyToSection('range.min', channel.range ? channel.range.min : 0, channelSubSection, `channels[${index}]`);

            // Add range.max
            this.addPropertyToSection('range.max', channel.range ? channel.range.max : 1, channelSubSection, `channels[${index}]`);

            // Add range.defaultValue
            this.addPropertyToSection('range.defaultValue', channel.range ? channel.range.defaultValue : 0, channelSubSection, `channels[${index}]`);

            // Add range.skew
            this.addPropertyToSection('range.skew', channel.range ? channel.range.skew : 1, channelSubSection, `channels[${index}]`);

            // Add range.increment
            this.addPropertyToSection('range.increment', channel.range ? channel.range.increment : 0.01, channelSubSection, `channels[${index}]`);

            // Add remove button
            const removeBtn = document.createElement('button');
            removeBtn.textContent = 'Remove Channel';
            removeBtn.addEventListener('click', () => {
                this.removeChannel(index);
            });
            channelSubSection.appendChild(removeBtn);

            channelsSection.appendChild(channelSubSection);
        });

        // Add + button
        const addBtn = document.createElement('button');
        addBtn.textContent = 'Add Channel';
        addBtn.addEventListener('click', () => {
            this.addChannel();
        });
        channelsSection.appendChild(addBtn);

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
        const hiddenProps = widget?.hiddenProps || [];

        Object.entries(properties).forEach(([key, value]) => {
            // Skip if this property is in hiddenProps or already handled
            if (hiddenProps.includes(key) || (this.handledProperties && this.handledProperties.has(key))) {
                return;
            }

            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // Skip adding properties that belong to objects already covered
                return;
            }
            this.addPropertyToSection(key, value, miscSection); // Add miscellaneous property
        });

        panel.appendChild(miscSection); // Append miscellaneous section to panel
    }

    /**
     * Adds a new channel to the channels array with default values.
     */
    addChannel() {
        const newChannel = {
            id: `channel${this.properties.channels.length + 1}`,
            event: '',
            range: { min: 0, max: 1, defaultValue: 0, skew: 1, increment: 0.01 }
        };
        this.properties.channels.push(newChannel);
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
        this.properties.channels.splice(index, 1);
        this.rebuildPropertiesPanel();
        this.vscode.postMessage({
            command: 'widgetUpdate',
            text: JSON.stringify(CabbageUtils.sanitizeForEditor(this.properties)),
        });
    }

    /** 
     * Creates a new section with a header.
     * @param name - The name of the section to create.
     * @returns The created section div.
     */
    createSection(name) {
        const sectionDiv = document.createElement('div');
        sectionDiv.classList.add('property-section');

        const header = document.createElement('h3');
        header.textContent = name; // Set the section header
        sectionDiv.appendChild(header);

        return sectionDiv; // Return the created section
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

        } else if (fullPath === 'channels[0].id' || fullPath === 'channel') {
            input = document.createElement('input');
            input.type = 'text';
            const currentId = (fullPath === 'channel') ? value : (Array.isArray(this.properties?.channels) && this.properties.channels[0] ? this.properties.channels[0].id : value);
            input.value = currentId;
            input.dataset.originalChannel = currentId;
            input.dataset.skipInputHandler = 'true';

            input.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter' || evt.key === 'Tab') {
                    evt.preventDefault();
                    const newChannel = evt.target.value.trim();
                    const originalChannel = input.dataset.originalChannel;
                    const widget = this.widgets.find(w => {
                        const id = (Array.isArray(w.props.channels) && w.props.channels[0]) ? w.props.channels[0].id : w.props.channel;
                        return id === originalChannel;
                    });

                    if (widget) {
                        // Check for uniqueness
                        const existingDiv = document.getElementById(newChannel);
                        if (existingDiv && existingDiv.id !== originalChannel) {
                            console.warn(`Cabbage: A widget with id '${newChannel}' already exists!`);
                            return;
                        }

                        // Update the widget's channel property
                        if (Array.isArray(widget.props.channels) && widget.props.channels[0]) {
                            widget.props.channels[0].id = newChannel;
                        }

                        // Remove the old widget from the array
                        console.warn("Cabbage: Cabbage: widgets", this.widgets);
                        const widgetIndex = this.widgets.findIndex(w => {
                            const id = (Array.isArray(w.props.channels) && w.props.channels[0]) ? w.props.channels[0].id : w.props.channel;
                            return id === originalChannel;
                        });
                        if (widgetIndex !== -1) {
                            this.widgets.splice(widgetIndex, 1);
                        }
                        console.warn("Cabbage: Cabbage: after removing widgets", this.widgets);

                        // First, tell the extension to remove the old widget
                        this.vscode.postMessage({
                            command: 'removeWidget',
                            channel: originalChannel
                        });

                        // Rebuild the properties panel to reflect the changes
                        this.rebuildPropertiesPanel(); // Call the method to rebuild the properties panel

                        // Update the widget `div` id and `channel` property
                        const widgetDiv = document.getElementById(originalChannel);
                        if (widgetDiv) {
                            widgetDiv.id = newChannel;
                        }

                        // Add the updated widget back to the array
                        this.widgets.push(widget);
                        // Then send the updated widget
                        this.vscode.postMessage({
                            command: 'widgetUpdate',
                            text: JSON.stringify(CabbageUtils.sanitizeForEditor(widget)),
                        });

                        input.blur();
                    }
                    else {
                        console.warn("Cabbage: Cabbage: widget doesn't exist in this context");
                    }
                }
            });
        } else {
            // Handle color input for properties that are specifically color values
            // But exclude numeric tracker width (e.g. `colour.tracker.width`) so it is shown as a number input
            if (fullPath.toLowerCase().includes("colour") && !fullPath.includes("stroke.width") && !fullPath.toLowerCase().includes("tracker.width")) {
                input = document.createElement('input');
                input.value = value; // Set the initial color value
                input.style.backgroundColor = value; // Set background color

                // Initialize color picker
                const picker = new CP(input);
                picker.on('change', (r, g, b, a) => {
                    input.value = CP.HEX([r, g, b, a]); // Update input value to HEX
                    input.style.backgroundColor = CP.HEX([r, g, b, a]); // Update background color
                    this.handleInputChange(input.parentElement); // Trigger change handler
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
        input.id = key; // Use the key as ID directly (case-sensitive)
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
        section.appendChild(propertyDiv);
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
                let parsedValue = isNaN(inputValue) ? inputValue : Number(inputValue);

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
        // Ensure input is an array of objects
        this.vscode = vscode;
        let events = Array.isArray(input) ? input : [input]; // Normalize input to an array

        const element = document.querySelector('.property-panel');
        if (element) {
            element.style.visibility = "visible"; // Make the panel visible
            element.innerHTML = ''; // Clear previous content
        }

        // Iterate over the array of event objects
        events.forEach(eventObj => {
            const { eventType, name, bounds } = eventObj; // Destructure event properties

            widgets.forEach((widget, index) => {
                if (CabbageUtils.getChannelId(widget.props, 0) === name) {
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
                    // Create a new PropertyPanel instance for the widget
                    new PropertyPanel(vscode, widget.props.type, widget.props, widgets);
                    if (!this.vscode) {
                        console.error("not valid");
                    }

                    // Delay sending messages to VSCode to avoid slow responses
                    setTimeout(() => {
                        this.vscode.postMessage({
                            command: 'widgetUpdate',
                            text: JSON.stringify(widget.props),
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
        // Clear the existing panel content
        const panel = document.querySelector('.property-panel');
        panel.innerHTML = ''; // Clear the panel's content

        // Recreate the panel with the updated widgets
        this.createPanel(); // Assuming createPanel handles the creation of the panel
    }
}

// Add a default export for the PropertyPanel class
export default PropertyPanel;
