// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

console.log("Cabbage: Loading widgetManager.js...");

// Import necessary modules and utilities
import { widgetConstructors, widgetTypes } from "./widgetTypes.js";
import { CabbageUtils, CabbageColours } from "../cabbage/utils.js";
import { vscode, cabbageMode, widgets } from "../cabbage/sharedState.js";
import { handlePointerDown, setupFormHandlers } from "../cabbage/eventHandlers.js";
import { Cabbage } from "../cabbage/cabbage.js";

/**
 * WidgetManager class handles the creation, insertion, and management of widgets.
 */
export class WidgetManager {
    static currentCsdPath = '';

    /**
     * Deep equal function to compare objects.
     */
    static deepEqual(obj1, obj2) {
        if (obj1 === obj2) return true;
        if (obj1 == null || obj2 == null) return obj1 === obj2;
        if (typeof obj1 !== typeof obj2) return false;
        if (typeof obj1 !== 'object') return obj1 === obj2;
        if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;
        if (Array.isArray(obj1)) {
            if (obj1.length !== obj2.length) return false;
            for (let i = 0; i < obj1.length; i++) {
                if (!this.deepEqual(obj1[i], obj2[i])) return false;
            }
            return true;
        }
        const keys1 = Object.keys(obj1);
        const keys2 = Object.keys(obj2);
        if (keys1.length !== keys2.length) return false;
        for (const key of keys1) {
            if (!keys2.includes(key)) return false;
            if (!this.deepEqual(obj1[key], obj2[key])) return false;
        }
        return true;
    }

    /**
     * @returns {string} - The current CSD path.
     */
    static getCurrentCsdPath() {
        return WidgetManager.currentCsdPath;
    }

    /**
     * Deep merge function to merge nested objects properly.
     * @param {object} target - The target object to merge into.
     * @param {object} source - The source object to merge from.
     */
    static deepMerge(target, source) {
        for (const key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                    // If the property doesn't exist in target, create it
                    if (!target[key] || typeof target[key] !== 'object') {
                        target[key] = {};
                    }
                    // Recursively merge nested objects
                    this.deepMerge(target[key], source[key]);
                } else {
                    // For primitive values, arrays, or null, do direct assignment, but skip undefined
                    if (source[key] !== undefined) {
                        target[key] = source[key];
                    }
                }
            }
        }
    }

    /**
     * Dynamically creates a widget based on the provided type.
     * @param {string} type - The type of the widget to create.
     * @returns {object|null} - The created widget object or null if the type is invalid.
     */
    static createWidget(type) {
        const WidgetClass = widgetConstructors[type];
        if (WidgetClass) {
            const widget = new WidgetClass();
            //special case for genTable..
            if (type === "genTable") {
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
     * @returns {string} - The currentCsdFile if it is known.
     */
    static async insertWidget(type, props, currentCsdFile) {
        // console.trace("Inserting widget of type:", type, 'CurrentCsdFile', props.currentCsdFile);
        const widgetDiv = document.createElement('div');
        widgetDiv.id = props.channel;

        const widget = WidgetManager.createWidget(type);
        if (!widget) {
            console.error("Failed to create widget of type:", type);
            return;
        }

        // attach the instance to the div so future updates can find it
        widgetDiv.cabbageInstance = widget;


        // Assign class based on widget type and mode (draggable/non-draggable)
        widgetDiv.className = (type === "form") ? "resizeOnly" : (props.parentChannel ? "grouped-child" : cabbageMode);

        // Set up event listeners for draggable mode (skip for child widgets)
        if (cabbageMode === 'draggable' && !props.parentChannel) {
            widgetDiv.addEventListener('pointerdown', (e) => handlePointerDown(e, widgetDiv));
        }

        // Assign properties to the widget
        if (props.top !== undefined && props.left !== undefined) {
            widget.props.bounds = widget.props.bounds || {};
            widget.props.bounds.top = props.top;
            widget.props.bounds.left = props.left;
            delete props.top;
            delete props.left;
        }

        // Deep merge props instead of shallow assign to preserve nested object properties
        this.deepMerge(widget.props, props);

        // Recalculate derived properties after merging props
        if (widget.props.range && widget.props.range.increment !== undefined) {
            widget.decimalPlaces = CabbageUtils.getDecimalPlaces(widget.props.range.increment);
        }

        // Store the minimal original props for grouping/ungrouping
        try {
            const defaultProps = new widgetConstructors[type]().props;
            const minimalProps = { ...props };
            const excludeFromJson = ['samples', 'currentCsdFile', 'parameterIndex'];
            excludeFromJson.forEach(prop => delete minimalProps[prop]);
            for (let key in defaultProps) {
                if (this.deepEqual(minimalProps[key], defaultProps[key]) && key !== 'type') {
                    delete minimalProps[key];
                }
            }
            widget.originalProps = JSON.parse(JSON.stringify(minimalProps));
        } catch (error) {
            console.error('Failed to minimize props:', error);
            widget.originalProps = JSON.parse(JSON.stringify(props));
        }

        if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(type)) {
            if (props?.range && props.range.hasOwnProperty("defaultValue")) {
                widget.props.value = props.range.defaultValue;
            }
            else {
                widget.props.value = widget.props.range.defaultValue;
            }
        }

        // Handle combobox default value for indexOffset compatibility
        if (type === "comboBox" && widget.props.indexOffset && widget.props.value === null) {
            widget.props.value = 1; // Cabbage2 comboboxes default to index 1
        }

        if (!widget.props.currentCsdFile) {
            widget.props.currentCsdFile = currentCsdFile;
        }
        // Add the widget to the global widgets array
        console.log("Cabbage: Pushing widget to widgets array", widget);
        widgets.push(widget);
        widget.parameterIndex = CabbageUtils.getNumberOfPluginParameters(widgets) - 1;

        // Append widget to the form
        if (widget.props.type !== "form") {
            const html = widget.getInnerHTML();
            if (!html) return;
            widgetDiv.innerHTML = html;
            WidgetManager.appendToMainForm(widgetDiv);
            if (widget.props.type === "genTable") {
                widget.updateTable(); // Special handling for "gentable" widgets
            }
        } else if (widget.props.type === "form") {
            WidgetManager.setupFormWidget(widget); // Special handling for "form" widgets
        }

        // Handle non-draggable mode setup
        if (cabbageMode === 'nonDraggable') {
            WidgetManager.setPerformanceMode(widget, widgetDiv);
        }

        // Apply styles and return the widget properties
        if (vscode) {
            // Use requestAnimationFrame to ensure DOM is ready, then apply styles
            requestAnimationFrame(() => {
                WidgetManager.updateWidgetStyles(widgetDiv, widget.props);

                // Handle children widgets if this is a container
                if (widget.props.children && Array.isArray(widget.props.children)) {
                    WidgetManager.insertChildWidgets(widget, widgetDiv);
                }
            });
        }
        else {
            WidgetManager.updateWidgetStyles(widgetDiv, widget.props);

            // Handle children widgets if this is a container
            if (widget.props.children && Array.isArray(widget.props.children)) {
                WidgetManager.insertChildWidgets(widget, widgetDiv);
            }
        }

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
        let formDiv = document.getElementById('MainForm');
        if (!formDiv) {
            formDiv = document.createElement('div');
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

                // Prevent menu from closing when interacting with the scrollbar
                const preventClose = (e) => {
                    e.stopPropagation(); // Prevent click from closing the menu
                };

                contentDiv.addEventListener('mousedown', preventClose);
                contentDiv.addEventListener('pointerdown', preventClose);

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

                // Create a style element
                const style = document.createElement('style');
                style.textContent = `
                    /* For WebKit browsers (Chrome, Safari) */
                    .wrapper .content::-webkit-scrollbar {
                        width: 12px; /* Width of the scrollbar */
                    }

                    .wrapper .content::-webkit-scrollbar-track {
                        background: #f1f1f1; /* Background of the scrollbar track */
                    }

                    .wrapper .content::-webkit-scrollbar-thumb {
                        background: #888; /* Color of the scrollbar thumb */
                        border-radius: 6px; /* Rounded corners for the thumb */
                    }

                    .wrapper .content::-webkit-scrollbar-thumb:hover {
                        background: #555; /* Color of the thumb on hover */
                    }

                    /* For Firefox */
                    .wrapper .content {
                        scrollbar-width: thin; /* Makes the scrollbar thinner */
                        scrollbar-color: #888 #f1f1f1; /* thumb color and track color */
                    }
                `;

                // Append the style element to the head
                document.head.appendChild(style);
            } else {
                // Fallback for non-VSCode mode
                formDiv.className = "form nonDraggable";
                document.body.appendChild(formDiv);
            }
        }

        // Set MainForm styles and properties
        if (formDiv) {
            formDiv.style.width = widget.props.size.width + "px";
            formDiv.style.height = widget.props.size.height + "px";
            formDiv.style.top = '0px';
            formDiv.style.left = '0px';

            // Update SVG if needed
            if (typeof widget.updateSVG === 'function') {
                widget.updateSVG();
                const selectionColour = CabbageColours.invertColor(widget.props.colour.fill);
                CabbageColours.changeSelectedBorderColor(selectionColour);
            }
        } else {
            console.error("MainForm not found");
        }

        // Initialize form event handlers if in vscode mode
        if (typeof acquireVsCodeApi === 'function') {
            setupFormHandlers();
        }
    }

    /**
     * Inserts child widgets for a container widget (groupBox or image)
     * @param {object} parentWidget - The parent container widget
     * @param {HTMLElement} parentDiv - The parent's DOM element
     */
    static async insertChildWidgets(parentWidget, parentDiv) {
        if (!parentWidget.props.children || !Array.isArray(parentWidget.props.children)) {
            return;
        }

        console.log("Cabbage: Inserting", parentWidget.props.children.length, "child widgets for", parentWidget.props.channel);

        for (const childProps of parentWidget.props.children) {
            // Calculate absolute position based on parent's position + relative position
            const absoluteBounds = {
                ...childProps.bounds,
                left: parentWidget.props.bounds.left + childProps.bounds.left,
                top: parentWidget.props.bounds.top + childProps.bounds.top
            };

            const childWidgetProps = {
                ...childProps,
                bounds: absoluteBounds,
                parentChannel: parentWidget.props.channel // Mark as child
            };

            // Insert the child widget
            const childWidget = await WidgetManager.insertWidget(childProps.type, childWidgetProps, parentWidget.props.currentCsdFile);

            // Ensure child widgets appear above their container
            const childDiv = document.getElementById(childProps.channel);
            if (childDiv) {
                childDiv.style.zIndex = '10'; // Higher than container
                childDiv.setAttribute('data-parent-channel', parentWidget.props.channel); // Mark as child widget

                // Set pointer events based on mode
                if (cabbageMode === 'draggable') {
                    childDiv.style.pointerEvents = 'none'; // Disable pointer events in draggable mode
                } else {
                    childDiv.style.pointerEvents = 'auto'; // Enable pointer events in performance mode
                }
            }

            // Ensure container has lower z-index
            if (parentDiv) {
                parentDiv.style.zIndex = '5';
            }
        }
    }    /**
     * Handles radioGroup functionality for button and checkbox widgets.
     * When a widget is activated, deactivates all other widgets in the same radioGroup.
     * @param {string} radioGroup - The radioGroup identifier
     * @param {string} activeChannel - The channel of the widget that was just activated
     */
    static handleRadioGroup(radioGroup, activeChannel) {
        if (!radioGroup || radioGroup === -1) return;

        console.log(`Cabbage: Handling radioGroup ${radioGroup} for channel ${activeChannel}`);

        // Find all widgets in the same radioGroup
        const groupWidgets = widgets.filter(widget =>
            widget.props.radioGroup === radioGroup && widget.props.channel !== activeChannel
        );

        // Deactivate all other widgets in the group
        groupWidgets.forEach(groupWidget => {
            if (groupWidget.props.value !== 0) {
                groupWidget.props.value = 0;

                // Update visual state
                const widgetDiv = document.getElementById(groupWidget.props.channel);
                if (widgetDiv) {
                    widgetDiv.innerHTML = groupWidget.getInnerHTML();
                }

                // Send parameter update to Csound to keep it in sync
                const msg = {
                    paramIdx: groupWidget.parameterIndex,
                    channel: groupWidget.props.channel,
                    value: 0
                };
                Cabbage.sendParameterUpdate(msg, groupWidget.vscode || null);
            }
        });
    }
    static updateWidgetStyles(widgetDiv, props) {
        widgetDiv.style.position = 'absolute';
        widgetDiv.style.top = '0px'; // Reset top position
        widgetDiv.style.left = '0px'; // Reset left position

        // Apply position and size based on widget properties
        if (typeof props?.bounds === 'object' && props.bounds !== null) {
            if (vscode) {
                widgetDiv.style.transform = `translate(${props.bounds.left}px, ${props.bounds.top}px)`;
            }
            widgetDiv.style.width = props.bounds.width + 'px';
            widgetDiv.style.height = props.bounds.height + 'px';
            // widgetDiv.style.top = props.bounds.top;
            // widgetDiv.style.left = props.bounds.left;

            widgetDiv.setAttribute('data-x', props.bounds.left);
            widgetDiv.setAttribute('data-y', props.bounds.top);
        } else if (props && props.size && typeof props.size === 'object') {
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
    static async updateWidget(obj) {
        // console.log(`WidgetManager.updateWidget called with:`, JSON.stringify(obj, null, 2));
        // Check if 'data' exists, otherwise use 'value'
        const data = obj.data ? JSON.parse(obj.data) : obj.value;
        const widget = widgets.find(w => w.props.channel === obj.channel);
        let widgetFound = false;
        if (widget) {
            // console.log(`WidgetManager.updateWidget: channel=${obj.channel}, value=${obj.value}, data=${obj.data}, widget type=${widget.props.type}, isDragging=${widget.isDragging}`);
            // widget.props.currentCsdFile = obj.currentCsdPath;
            // WidgetManager.currentCsdPath = obj.currentCsdPath;
            //if only updating value..
            if (obj.hasOwnProperty('value') && !obj.hasOwnProperty('data')) {
                // console.log(`Value update case: obj.value = ${obj.value} (type: ${typeof obj.value})`);
                // Don't update value for sliders that are currently being dragged
                if (!(["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(widget.props.type) && widget.isDragging)) {
                    if (obj.value != null) {
                        // console.log(`Processing value update for ${widget.props.type}: ${obj.value}`);
                        let newValue = obj.value;
                        // For sliders, handle value conversion
                        if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(widget.props.type)) {
                            if (!isNaN(obj.value) && obj.value >= 0 && obj.value <= 1) {
                                // Assume received value is linear normalized [0,1], convert to skewed
                                const skewedNormalized = Math.pow(obj.value, widget.props.range.skew);
                                newValue = widget.props.range.min + skewedNormalized * (widget.props.range.max - widget.props.range.min);
                                console.log(`WidgetManager.updateWidget: converting linear ${obj.value} to skewed ${newValue} for ${widget.props.type}`);
                            } else if (!isNaN(obj.value) && (obj.value < 0 || obj.value > 1)) {
                                // Assume received value is already skewed
                                newValue = obj.value;
                                console.log(`WidgetManager.updateWidget: received skewed value ${obj.value} for ${widget.props.type}, using directly`);
                            } else {
                                console.log(`WidgetManager.updateWidget: invalid value ${obj.value} for ${widget.props.type}, skipping update`);
                                return; // Skip update for invalid values
                            }
                        }
                        // console.log(`WidgetManager.updateWidget: updating ${widget.props.type} value from ${widget.props.value} to ${newValue}`);
                        widget.props.value = newValue; // Update the value property
                        // Call getInnerHTML to refresh the widget's display
                        const widgetDiv = CabbageUtils.getWidgetDiv(widget.props.channel);
                        if (widgetDiv) {
                            widgetDiv.innerHTML = widget.getInnerHTML();
                        }
                    } else {
                        console.log(`Skipping value update because obj.value is null/undefined: ${obj.value}`);
                    }
                } else {
                    // console.log(`WidgetManager.updateWidget: skipping update for dragging ${widget.props.type}`);
                }
                return; // Early return
            }
            // Update widget properties
            console.log(`Merge case: data =`, JSON.stringify(data, null, 2));
            // Save current value for sliders to prevent accidental null resets during visibility changes
            let savedSliderValue;
            if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(widget.props.type)) {
                savedSliderValue = widget.props.value;
            }
            WidgetManager.deepMerge(widget.props, data);
            // Restore value if accidentally set to null
            if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(widget.props.type)) {
                if (widget.props.value === null && savedSliderValue !== null && savedSliderValue !== undefined) {
                    widget.props.value = savedSliderValue;
                    console.log(`WidgetManager.updateWidget: restored slider value from null to ${savedSliderValue} for ${widget.props.type}`);
                }
            }

            // Ensure slider values are not null or NaN and handle value conversion
            if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(widget.props.type)) {
                if (widget.props.value === null || isNaN(widget.props.value)) {
                    widget.props.value = widget.props.range.defaultValue;
                } else {
                    if (!isNaN(widget.props.value) && widget.props.value >= 0 && widget.props.value <= 1) {
                        // Convert linear normalized value to skewed value
                        const skewedNormalized = Math.pow(widget.props.value, widget.props.range.skew);
                        widget.props.value = widget.props.range.min + skewedNormalized * (widget.props.range.max - widget.props.range.min);
                        console.log(`WidgetManager.updateWidget: converted linear ${widget.props.value} to skewed ${widget.props.value} for ${widget.props.type} in merge case`);
                    } else if (!isNaN(widget.props.value) && (widget.props.value < 0 || widget.props.value > 1)) {
                        // Assume already skewed
                        console.log(`WidgetManager.updateWidget: value ${widget.props.value} assumed skewed for ${widget.props.type} in merge case`);
                    }
                }
            }
            widgetFound = true;
            if (widget.props.type === "form") {
                // Special handling for form widget
                const form = document.getElementById('MainForm');
                if (form) {
                    form.style.width = widget.props.size.width + "px";
                    form.style.height = widget.props.size.height + "px";

                    // Update the SVG viewBox if it exists
                    const svg = form.querySelector('svg');
                    if (svg) {
                        svg.setAttribute('viewBox', `0 0 ${widget.props.size.width} ${widget.props.size.height}`);
                        svg.setAttribute('width', widget.props.size.width);
                        svg.setAttribute('height', widget.props.size.height);
                    }

                    // Call updateSVG method if it exists
                    if (typeof widget.updateSVG === 'function') {
                        widget.updateSVG();
                    }
                } else {
                    console.error("MainForm not found");
                }
            }
            else {
                // Existing code for other widget types
                const widgetDiv = CabbageUtils.getWidgetDiv(widget.props.channel);
                if (widgetDiv) {
                    widgetDiv.innerHTML = widget.getInnerHTML();

                    // Update widget position and size for non-form widgets using consistent styling
                    WidgetManager.updateWidgetStyles(widgetDiv, widget.props);

                    // If this widget has children, update their positions
                    if (widget.props.children && Array.isArray(widget.props.children)) {
                        widget.props.children.forEach(childProps => {
                            const childDiv = document.getElementById(childProps.channel);
                            if (childDiv) {
                                const absoluteLeft = widget.props.bounds.left + childProps.bounds.left;
                                const absoluteTop = widget.props.bounds.top + childProps.bounds.top;
                                // Update child widget styles consistently
                                const childWidget = widgets.find(w => w.props.channel === childProps.channel);
                                if (childWidget) {
                                    WidgetManager.updateWidgetStyles(childDiv, {
                                        ...childWidget.props,
                                        bounds: {
                                            ...childWidget.props.bounds,
                                            left: absoluteLeft,
                                            top: absoluteTop
                                        }
                                    });
                                }
                                console.log(`Cabbage: Updated child ${childProps.channel} position to (${absoluteLeft}, ${absoluteTop})`);
                            }
                        });
                    }

                    if (widget.props.type === "genTable") {
                        widget.updateTable();
                    }
                } else {
                    console.error(`Widget div for channel ${widget.props.channel} not found`);
                }
            }
        } else {
            // Widget not found in top-level array. Check if it's a child of any container widget (group/image)
            const parentWithChild = widgets.find(w => w.props.children && Array.isArray(w.props.children) && w.props.children.some(c => c.channel === obj.channel));
            if (parentWithChild) {
                // console.log(`Cabbage: Found child widget ${obj.channel} in parent ${parentWithChild.props.channel}, updating child. Data:`, JSON.stringify(obj, null, 2));
                const childProps = parentWithChild.props.children.find(c => c.channel === obj.channel);

                // If data is an object (and not null/array) merge it, otherwise treat as a value update
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    console.log(`Child merge case: data =`, JSON.stringify(data, null, 2));
                    // Convert absolute bounds back to relative bounds before merging
                    if (data.bounds && parentWithChild.props.bounds) {
                        const relativeBounds = {
                            ...data.bounds,
                            left: data.bounds.left - parentWithChild.props.bounds.left,
                            top: data.bounds.top - parentWithChild.props.bounds.top
                        };
                        data = { ...data, bounds: relativeBounds };
                    }
                    WidgetManager.deepMerge(childProps, data);
                } else {
                    console.log(`Child value update: data = ${data} (type: ${typeof data})`);
                    if (data != null) {
                        childProps.value = data;
                    } else {
                        console.log(`Skipping child value update because data is null/undefined`);
                    }
                }

                // Update child DOM / instance if present
                const childDiv = document.getElementById(obj.channel);
                if (childDiv) {
                    // Prefer canonical attached instance
                    const instance = childDiv.cabbageInstance || Object.values(childDiv).find(v => v && typeof v.getInnerHTML === 'function');
                    if (instance) {
                        WidgetManager.deepMerge(instance.props, childProps);
                        // Ensure slider values are not null or NaN
                        if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(childProps.type)) {
                            if (instance.props.value === null || isNaN(instance.props.value)) {
                                instance.props.value = instance.props.range.defaultValue;
                            }
                        }
                        childDiv.innerHTML = instance.getInnerHTML();
                        console.warn("Cabbage: Updated child widget instance", obj.channel, instance.props.value);
                    } else {
                        // Fallback: create a temporary widget instance to render HTML
                        const tempWidget = WidgetManager.createWidget(childProps.type);
                        WidgetManager.deepMerge(tempWidget.props, childProps);
                        // Ensure slider values are not null
                        if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(childProps.type)) {
                            if (tempWidget.props.value === null) {
                                tempWidget.props.value = tempWidget.props.range.defaultValue;
                            }
                        }
                        childDiv.innerHTML = tempWidget.getInnerHTML();
                        console.warn("Cabbage: Updated temporary child widget", obj.channel);
                    }
                } else {
                    console.warn(`Cabbage: child div for ${obj.channel} not found in DOM`);
                }
                widgetFound = true;
            } else {
                console.log(`Cabbage: Widget with channel ${obj.channel} not found - going to create it now`);
            }
        }
        // If the widget is not found, attempt to create a new widget from the provided data
        if (!widgetFound) {
            try {
                let p = typeof data === 'string' ? JSON.parse(data) : data;

                // If the parsed data has a 'type' property, insert a new widget into the form
                if (p.hasOwnProperty('type')) {
                    await WidgetManager.insertWidget(p.type, p, obj.currentCsdPath);
                }
                else {
                    console.error("No type property found in data", p);
                }
            } catch (error) {
                console.error("Error parsing JSON data:", error, obj.data);
            }
        }
    }

}



