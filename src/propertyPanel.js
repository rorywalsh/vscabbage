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

        // Add Type Property
        this.addPropertyToSection('Type', this.type, specialSection);

        // Add Channel Property if it exists
        if (this.properties.channel) {
            this.addPropertyToSection('Channel', this.properties.channel, specialSection);
        }

        panel.appendChild(specialSection); // Append special section to panel
    }

    /** 
     * Creates sections for each group of properties.
     * @param properties - The properties object containing section data.
     * @param panel - The panel to which the sections are appended.
     */
    createSections(properties, panel) {
        Object.entries(properties).forEach(([sectionName, sectionProperties]) => {
            if (typeof sectionProperties === 'object' && sectionProperties !== null && !Array.isArray(sectionProperties)) {
                const sectionDiv = this.createSection(sectionName);

                // Add each property to the section
                Object.entries(sectionProperties).forEach(([key, value]) => {
                    // Check if the value is an object
                    if (typeof value === 'object' && value !== null) {
                        // Handle nested properties (like colour)
                        Object.entries(value).forEach(([nestedKey, nestedValue]) => {
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

        Object.entries(properties).forEach(([key, value]) => {
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
        const fullPath = path ? `${path}.${key}` : key; // Construct full path for input id

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

        // Set input attributes
        input.id = fullPath; 
        input.dataset.parent = this.properties.channel; // Set data attribute for parent channel

        input.addEventListener('input', this.handleInputChange.bind(this)); // Attach input event listener

        return input; // Return the created input element
    }

    /** 
     * Adds a property input to a specific section.
     * @param key - The property key to be added.
     * @param value - The value of the property.
     * @param section - The section to which the property is added.
     * @param path - The nested path for the property (optional).
     */
    addPropertyToSection(key, value, section, path = '') {
        const propertyDiv = document.createElement('div');
        propertyDiv.classList.add('property');

        const label = document.createElement('label');
        const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
        label.textContent = formattedKey; // Format and set label text
        propertyDiv.appendChild(label);

        const input = this.createInputElement(key, value, path); // Create input element
        propertyDiv.appendChild(input);
        section.appendChild(propertyDiv); // Add property div to section
    }

    /** 
     * Handles changes to input fields.
     * @param evt - The input event or the parent element of the input.
     */
    handleInputChange(evt) {
        let input;
        // Determine the input source
        if (evt instanceof Event) {
            input = evt.target; // Get target from event
        } else {
            input = evt;
            const innerInput = evt.querySelector('input'); // Query for input if a parent element is passed
            input = innerInput;
        }

        console.log("handleInputChange called");
        console.log("Input value:", input.value);
        console.log("Input id:", input.id);
        console.log("Input dataset parent:", input.dataset.parent);

        // Update the corresponding widget property based on input changes
        this.widgets.forEach((widget) => {
            if (widget.props.channel === input.dataset.parent) {
                const inputValue = input.value;
                let parsedValue = isNaN(inputValue) ? inputValue : Number(inputValue); // Parse the input value

                // Handle nested properties
                const propertyPath = input.id.split('.'); // Split id to access nested properties
                let currentObj = widget.props;

                // Traverse the property path
                for (let i = 0; i < propertyPath.length - 1; i++) {
                    if (!(propertyPath[i] in currentObj)) {
                        console.warn(`Property ${propertyPath.slice(0, i + 1).join('.')} does not exist in widget.props`);
                        return;
                    }
                    currentObj = currentObj[propertyPath[i]]; // Move deeper into the property object
                }

                const finalProperty = propertyPath[propertyPath.length - 1]; // Get final property name

                // Update the property with the new value
                if (!(finalProperty in currentObj)) {
                    console.warn(`Property ${input.id} does not exist in widget.props`);
                    return;
                }

                currentObj[finalProperty] = parsedValue; // Set the new value

                CabbageUtils.updateBounds(widget.props, input.id); // Update the widget bounds

                const widgetDiv = CabbageUtils.getWidgetDiv(widget.props.channel); // Get widget DOM element
                // Update widget representation based on type
                if (widget.props['type'] === 'form') {
                    widget.updateSVG(); // Update SVG for form type
                } else {
                    widgetDiv.innerHTML = widget.getInnerHTML(); // Update HTML content for other types
                }

                // Send message to VSCode extension with updated widget properties
                this.vscode.postMessage({
                    command: 'widgetUpdate',
                    text: JSON.stringify(widget.props),
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
}

// Add a default export for the PropertyPanel class
export default PropertyPanel;
