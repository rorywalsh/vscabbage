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
     * Checks if the channel property is unique for each widget.
     * If not, logs an error to the console.
     */
    checkChannelUniqueness() {
        this.widgets.forEach(widget => {
            const widgetDiv = document.getElementById(widget.props.channel);

            if (widgetDiv) {
                const idConflict = this.widgets.some(w => w.props.channel !== widget.props.channel && w.props.channel === widgetDiv.id);

                if (idConflict) {
                    console.error(`Conflict detected: Widget channel '${widget.props.channel}' must be unique!`);
                    return;
                }
            }
            return false;
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

        // Add Channel Property if it exists
        if (this.properties.channel) {
            this.addPropertyToSection('channel', this.properties.channel, specialSection);
            this.handledProperties.add('channel'); // Mark as handled
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
        const widget = this.widgets.find(w => w.props.channel === properties.channel);
        const hiddenProps = widget?.hiddenProps || [];

        Object.entries(properties).forEach(([sectionName, sectionProperties]) => {
            // Skip if this property is in hiddenProps
            
            if (hiddenProps.includes(sectionName)) {
                console.log("Cabbage: hidden props", hiddenProps, " section name", sectionName);
                return;
            }

            if (typeof sectionProperties === 'object' && sectionProperties !== null && !Array.isArray(sectionProperties)) {
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
 * Creates a miscellaneous section for properties not in a specific section.
 * @param properties - The properties object containing miscellaneous data.
 * @param panel - The panel to which the miscellaneous section is appended.
 */
    createMiscSection(properties, panel) {
        const miscSection = this.createSection('Misc');

        // Get the widget instance to access hiddenProps
        const widget = this.widgets.find(w => w.props.channel === properties.channel);
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
            
        } else if (fullPath === 'channel') {
            input = document.createElement('input');
            input.type = 'text';
            input.value = value;
            input.dataset.originalChannel = value;
            input.dataset.skipInputHandler = 'true';

            input.addEventListener('keydown', (evt) => {
                if (evt.key === 'Enter' || evt.key === 'Tab') {
                    evt.preventDefault();
                    const newChannel = evt.target.value.trim();
                    const originalChannel = input.dataset.originalChannel;
                    const widget = this.widgets.find(w => w.props.channel === originalChannel);

                    if (widget) {
                        // Check for uniqueness
                        const existingDiv = document.getElementById(newChannel);
                        if (existingDiv && existingDiv.id !== originalChannel) {
                            console.warn(`Cabbage: A widget with id '${newChannel}' already exists!`);
                            return;
                        }

                        // Update the widget's channel property
                        widget.props.channel = newChannel;

                        // Remove the old widget from the array
                        console.warn("Cabbage: widgets", this.widgets);
                        const widgetIndex = this.widgets.findIndex(w => w.props.channel === originalChannel);
                        if (widgetIndex !== -1) {
                            this.widgets.splice(widgetIndex, 1);
                        }
                        console.warn("Cabbage: after removing widgets", this.widgets);

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
                            text: JSON.stringify(widget.props),
                        });

                        input.blur();
                    }
                    else{
                        console.warn("Cabbage: widget doesn't exist in this context");
                    }
                }
            });
        } else {
            // Handle color input for properties that are specifically color values
            if (fullPath.toLowerCase().includes("colour") && !fullPath.includes("stroke.width")) {
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
            else if (key.toLowerCase() === 'align') {
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
        input.dataset.parent = this.properties.channel; // Set data attribute for parent channel
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
        if(key === 'currentCsdFile' || key === 'value'){
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

        this.widgets.forEach((widget) => {
            if (widget.props.channel === input.dataset.parent) {
                const inputValue = input.value;
                let parsedValue = isNaN(inputValue) ? inputValue : Number(inputValue);

                // Handle nested properties
                const propertyPath = input.id.split('.');
                let currentObj = widget.props;
                
                // For nested properties like colour.fill or colour.stroke.colour
                if (propertyPath.length > 1) {
                    // Navigate to the parent object, preserving existing properties
                    for (let i = 0; i < propertyPath.length - 1; i++) {
                        const prop = propertyPath[i];
                        if (!currentObj[prop]) {
                            currentObj[prop] = {};
                        }
                        // Create a copy of the existing object if it doesn't exist
                        currentObj = currentObj[prop];
                    }
                }

                const finalProperty = propertyPath[propertyPath.length - 1];
                currentObj[finalProperty] = parsedValue;

                // Remove the old property only if it was incorrectly placed at the root
                if (propertyPath.length > 1 && widget.props[finalProperty] && !propertyPath.includes('colour')) {
                    delete widget.props[finalProperty];
                }

                CabbageUtils.updateBounds(widget.props, input.id);

                const widgetDiv = CabbageUtils.getWidgetDiv(widget.props.channel);
                if (widget.props['type'] === 'form') {
                    widget.updateSVG();
                } else {
                    console.trace("Widget Div:", widgetDiv);
                    widgetDiv.innerHTML = widget.getInnerHTML();
                }

                this.vscode.postMessage({
                    command: 'widgetUpdate',
                    text: JSON.stringify(widget.props),
                });
            }
            else{
                console.warn("Cabbage: can't find channel", input.dataset.parent);
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
                if (widget.props.channel === name) {
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
                            const widgetDiv = CabbageUtils.getWidgetDiv(widget.props.channel);
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
