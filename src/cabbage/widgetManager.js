// Import necessary modules and utilities
import { widgetConstructors, widgetTypes } from "./widgetTypes.js";
import { CabbageUtils, CabbageColours } from "../cabbage/utils.js";
import { vscode, cabbageMode, widgets } from "../cabbage/main.js";
import { handlePointerDown, setupFormHandlers } from "../cabbage/eventHandlers.js";

/**
 * WidgetManager class handles the creation, insertion, and management of widgets.
 */
export class WidgetManager {

    /**
     * Dynamically creates a widget based on the provided type.
     * @param {string} type - The type of the widget to create.
     * @returns {object|null} - The created widget object or null if the type is invalid.
     */
    static createWidget(type) {
        const WidgetClass = widgetConstructors[type];
        if (WidgetClass) {
            const widget = new WidgetClass();
            if (type === "gentable") {
                widget.createCanvas(); // Special logic for "gentable" widget
            }
            return widget;
        } else {
            console.error("Unknown widget type: " + type);
            console.trace();
            return null;
        }
    }

    /**
     * Inserts a new widget into the form. This function is called when loading/saving a file 
     * or when adding widgets via right-click in the editor.
     * @param {string} type - The type of widget to insert.
     * @param {object} props - The properties to assign to the widget.
     * @returns {object|null} - The properties of the newly inserted widget or null on failure.
     */
    static async insertWidget(type, props) {
        const widgetDiv = document.createElement('div');
        widgetDiv.id = props.channel;

        const widget = WidgetManager.createWidget(type);
        if (!widget) {
            console.error("Failed to create widget of type:", type);
            return;
        }

        // Assign class based on widget type and mode (draggable/non-draggable)
        widgetDiv.className = (type === "form") ? "resizeOnly" : cabbageMode;

        // Set up event listeners for draggable mode
        if (cabbageMode === 'draggable') {
            widgetDiv.addEventListener('pointerdown', (e) => handlePointerDown(e, widgetDiv));
        }

        // Assign properties to the widget
        Object.assign(widget.props, props);
        if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(type)) {
            widget.props.value = props.range.defaultValue;
        }

        // Add the widget to the global widgets array
        widgets.push(widget);
        widget.parameterIndex = CabbageUtils.getNumberOfPluginParameters(widgets) - 1;

        // Handle non-draggable mode setup
        if (cabbageMode === 'nonDraggable') {
            WidgetManager.setPerformanceMode(widget, widgetDiv);
        }

        // Append widget to the form
        if (widget.props.type !== "form") {
            widgetDiv.innerHTML = widget.getInnerHTML();
            WidgetManager.appendToMainForm(widgetDiv);
        } else if (widget.props.type === "form") {
            WidgetManager.setupFormWidget(widget); // Special handling for "form" widgets
        } else if (widget.props.type === "gentable") {
            widget.updateTable(); // Special handling for "gentable" widgets
        }

        // Apply styles and return the widget properties
        WidgetManager.updateWidgetStyles(widgetDiv, widget.props);
        return widget.props;
    }

    /**
     * Sets up a widget for performance mode by adding appropriate event 
     * listeners as the widget level.
     * @param {object} widget - The widget to set up.
     * @param {HTMLElement} widgetDiv - The widget's corresponding DOM element.
     */
    static setPerformanceMode(widget, widgetDiv) {
        if (typeof acquireVsCodeApi === 'function') {
            if (!vscode) {
                vscode = acquireVsCodeApi();
            }
            if (typeof widget.addVsCodeEventListeners === 'function') {
                widget.addVsCodeEventListeners(widgetDiv, vscode);
            }
        } else if (widget.props.type !== "form") {
            if (typeof widget.addEventListeners === 'function') {
                widget.addEventListeners(widgetDiv);
            }
        }
    }

    /**
     * Appends a widget's DOM element to the MainForm in the editor.
     * @param {HTMLElement} widgetDiv - The widget's DOM element.
     */
    static appendToMainForm(widgetDiv) {
        const form = document.getElementById('MainForm');
        if (form) {
            form.appendChild(widgetDiv);
        } else {
            console.error("MainForm not found");
        }
    }

    /**
     * Sets up a "form" widget with specific structure and elements, 
     * particularly when using the VSCode extension.
     * @param {object} widget - The "form" widget to set up.
     */
    static setupFormWidget(widget) {
        const formDiv = document.createElement('div');
        formDiv.id = 'MainForm';

        // Setup for VSCode mode
        if (vscode) {
            formDiv.className = "form resizeOnly";

            // Create the structure inside the form
            const wrapperDiv = document.createElement('div');
            wrapperDiv.className = 'wrapper';

            const contentDiv = document.createElement('div');
            contentDiv.className = 'content';
            contentDiv.style.overflowY = 'auto';

            const ulMenu = document.createElement('ul');
            ulMenu.className = 'menu';

            // Populate the menu with widget types
            let menuItems = "";
            widgetTypes.forEach((widget) => {
                menuItems += `<li class="menuItem"><span>${widget}</span></li>`;
            });

            ulMenu.innerHTML = menuItems;

            // Append the inner elements to the form
            contentDiv.appendChild(ulMenu);
            wrapperDiv.appendChild(contentDiv);
            formDiv.appendChild(wrapperDiv);

            // Append the MainForm to the LeftPanel in VSCode
            const leftPanel = document.getElementById('LeftPanel');
            if (leftPanel) {
                leftPanel.appendChild(formDiv);
            } else {
                console.error("LeftPanel not found");
            }
        } else {
            // Fallback for non-VSCode mode
            formDiv.className = "form nonDraggable";
            document.body.appendChild(formDiv);
        }

        // Set MainForm styles and properties
        const form = document.getElementById('MainForm');
        if (form) {
            form.style.width = widget.props.size.width + "px";
            form.style.height = widget.props.size.height + "px";
            form.style.top = '0px';
            form.style.left = '0px';

            // Update SVG if needed
            if (typeof widget.updateSVG === 'function') {
                widget.updateSVG();
                const selectionColour = CabbageColours.invertColor(widget.props.colour);
                CabbageColours.changeSelectedBorderColor(selectionColour);
            }
        } else {
            console.error("MainForm not found");
        }

        // Initialize form event handlers
        if (typeof setupFormHandlers === 'function') {
            setupFormHandlers();
        }
    }

    /**
     * Updates the styles and positioning of a widget based on its properties.
     * @param {HTMLElement} widgetDiv - The widget's DOM element.
     * @param {object} props - The widget's properties containing size and position data.
     */
    static updateWidgetStyles(widgetDiv, props) {
        widgetDiv.style.position = 'absolute';
        widgetDiv.style.top = '0px'; // Reset top position
        widgetDiv.style.left = '0px'; // Reset left position

        // Apply position and size based on widget properties
        if (typeof props?.bounds === 'object' && props.bounds !== null) {
            widgetDiv.style.transform = `translate(${props.bounds.left}px, ${props.bounds.top}px)`;
            widgetDiv.style.width = props.bounds.width + 'px';
            widgetDiv.style.height = props.bounds.height + 'px';
            widgetDiv.setAttribute('data-x', props.bounds.left);
            widgetDiv.setAttribute('data-y', props.bounds.top);
        } else if (typeof props?.size === 'object' && props.size !== null) {
            widgetDiv.style.width = props.size.width + 'px';
            widgetDiv.style.height = props.size.height + 'px';
        }
    }

    /**
    * This is called from the plugin and updates a corresponding widget.
    * It searches for a widget based on its 'channel' property and updates its data and display.
    * If the widget is not found, it attempts to create a new widget based on the provided data.
    * @param {object} obj - JSON object pertaining to the widget that needs updating.
    */
    static updateWidget(obj) {

        const channel = obj['channel'];
        let widgetFound = false;

        // Loop through the existing widgets to find the one with the matching channel
        for (const widget of widgets) {
            if (widget.props.channel === channel) {
                widgetFound = true;

                // If the 'data' property exists in the object, update the widget's properties from the parsed JSON data
                if (obj.hasOwnProperty('data')) {
                    widget.props = JSON.parse(obj["data"]);
                } else {
                    // If no 'data' property, update only the 'value' property of the widget
                    widget.props.value = obj.value;
                }

                // Get the corresponding HTML element for the widget
                const widgetElement = CabbageUtils.getWidgetDiv(widget.props.channel);
                if (widgetElement) {
                    // Update the widget's position based on its bounds
                    widgetElement.style.transform = 'translate(' + widget.props.bounds.left + 'px,' + widget.props.bounds.top + 'px)';

                    widgetElement.setAttribute('data-x', widget.props.bounds.left);
                    widgetElement.setAttribute('data-y', widget.props.bounds.top);

                    // Update the inner HTML if the widget is not of type 'form'
                    if (widget.props.type !== "form") {
                        widgetElement.innerHTML = widget.getInnerHTML();
                    }
                } else {
                    console.error("Widget not found:", widget.props.channel);
                }

                // Handle special cases for 'gentable' and 'form' widgets
                if (widget.props.type === "gentable") {
                    widget.updateTable();
                } else if (widget.props.type == "form") {
                    widget.updateSVG();
                }
            }
        }

        // If the widget is not found, attempt to create a new widget from the provided data
        if (!widgetFound && obj.hasOwnProperty('data')) {
            try {
                let p = JSON.parse(obj.data);

                // If the parsed data is still a string, parse it again
                if (typeof p === 'string') {
                    p = JSON.parse(p);
                }

                // If the parsed data has a 'type' property, insert a new widget into the form
                if (p.hasOwnProperty('type')) {
                    WidgetManager.insertWidget(p.type, p, widgets);
                }
            } catch (error) {
                console.error("Error parsing JSON data:", error, obj.data);
            }
        }
    }

}



