// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

// Import necessary modules and utilities
import { widgetConstructors, getWidgetTypes } from "./widgetTypes.js";
import { CabbageUtils, CabbageColours } from "../cabbage/utils.js";
import { vscode, cabbageMode, widgets } from "../cabbage/sharedState.js";
import { handlePointerDown, setupFormHandlers } from "../cabbage/eventHandlers.js";
import { Cabbage } from "../cabbage/cabbage.js";
import { handleRadioGroup } from "./radioGroup.js";
import { PropertyPanel } from "../propertyPanel.js";

/**
 * WidgetManager class handles the creation, insertion, and management of widgets.
 */
export class WidgetManager {
    static currentCsdPath = '';

    /**
     * Map to track pending widget insertions to prevent race conditions.
     * Key: widget ID, Value: Promise that resolves when insertion is complete.
     */
    static pendingWidgets = new Map();

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
     * @returns {Promise<object|null>} - The created widget object or null if the type is invalid.
     */
    static async createWidget(type) {
        try {
            const WidgetClass = await widgetConstructors[type];
            const widget = new WidgetClass();
            // If the widget has a createCanvas hook (canvas-backed widgets), call it
            if (typeof widget.createCanvas === 'function') {
                try { widget.createCanvas(); } catch (e) { console.error('Cabbage: widget.createCanvas() threw', e); }
            }
            return widget;
        } catch (error) {
            console.error("Unknown widget type: " + type, error);
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
        // Widget ID takes precedence over channel ID
        const widgetId = props.id
            || (Array.isArray(props?.channels) && props.channels.length > 0 ? props.channels[0].id : null)
            || (typeof props.channel === 'object' && props.channel !== null ? (props.channel.id || props.channel.x) : props.channel);
        widgetDiv.id = widgetId;

        const widget = await WidgetManager.createWidget(type);
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

        // For comboBox with populate, set automatable to false (plugins can't handle dynamic ranges)
        if (widget.props.type === 'comboBox' && widget.props.populate?.directory) {
            widget.props.automatable = false;
            widget.props.channelType = "string";
        }

        // Clean up redundant IDs: if widget has both id and channels[0].id, prefer channels[0].id
        if (widget.props.id && Array.isArray(widget.props.channels) && widget.props.channels.length > 0) {
            if (widget.props.channels[0].id) {
                // Channel has its own ID, remove redundant widget.id
                if (widget.props.id === widget.props.channels[0].id) {
                    delete widget.props.id;
                }
            } else {
                // Channel doesn't have ID, use widget.id for the channel
                widget.props.channels[0].id = widget.props.id;
                delete widget.props.id;
            }
        }

        // Recalculate derived properties after merging props
        if (Array.isArray(widget.props.channels) && widget.props.channels.length > 0) {
            const rng = (widget.props.channels[0].range) ? widget.props.channels[0].range : CabbageUtils.getDefaultRange('drag');
            widget.decimalPlaces = CabbageUtils.getDecimalPlaces(rng.increment);
        }

        // Store the minimal original props for grouping/ungrouping
        try {
            const WidgetClass = await widgetConstructors[type];
            const defaultProps = new WidgetClass().props;
            // Store the raw defaults on the instance so other components (e.g. PropertyPanel)
            // can compare and strip default-valued properties when minimizing props.
            widget.rawDefaults = defaultProps;
            const minimalProps = { ...props };
            // If insert used top/left which were moved into widget.props.bounds and removed from props,
            // inject bounds from the instance so minimization preserves position for newly-inserted widgets.
            if ((!minimalProps.bounds || Object.keys(minimalProps.bounds).length === 0) && widget.props && widget.props.bounds) {
                minimalProps.bounds = { ...widget.props.bounds };
            }
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

        // If this widget has children in the original props (from the CSD file),
        // store them as serializedChildren so they remain minimized during updates
        if (props.children && Array.isArray(props.children) && props.children.length > 0) {
            widget.serializedChildren = JSON.parse(JSON.stringify(props.children));
        }

        if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider", "button", "checkBox", "optionButton"].includes(type)) {
            const interaction = (type === 'button' || type === 'checkBox' || type === 'optionButton') ? 'click' : 'drag';
            const channels = Array.isArray(widget.props.channels) ? widget.props.channels : [];
            const range = (channels[0] && channels[0].range) ? channels[0].range : CabbageUtils.getDefaultRange(interaction);
            widget.props.value = (typeof range.defaultValue !== 'undefined') ? range.defaultValue : 0;
        }

        // Handle combobox default value for indexOffset compatibility
        if (type === "comboBox" && widget.props.indexOffset && widget.props.value === null) {
            widget.props.value = 1; // Cabbage2 comboboxes default to index 1
        }

        if (!widget.props.currentCsdFile) {
            widget.props.currentCsdFile = currentCsdFile;
        }

        // Duplicate check is now performed in updateWidget before insertion begins
        // This prevents race conditions with pendingWidgets tracking

        // Add the widget to the global widgets array
        console.log("Cabbage: Pushing widget to widgets array", {
            type: widget.props.type,
            id: widgetId,
            parentChannel: widget.props.parentChannel || 'none',
            currentArraySize: widgets.length,
            allExistingIds: widgets.map(w => w.props.id || w.props.channels?.[0]?.id)
        });
        widgets.push(widget);


        // Append widget to the form
        if (widget.props.type !== "form") {
            const html = widget.getInnerHTML();
            if (!html) {
                console.error("Cabbage: insertWidget - widget.getInnerHTML() returned empty for type:", type, "id:", props.id, "props:", props);
                return;
            }
            widgetDiv.innerHTML = html;
            WidgetManager.appendToMainForm(widgetDiv);
            // If the widget manages its own canvas, call its update method if present
            if (typeof widget.updateCanvas === 'function') {
                try { widget.updateCanvas(); } catch (e) { console.error('Cabbage: widget.updateCanvas() threw', e); }
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
                // Normalize children to array if it's a single object
                if (widget.props.children) {
                    if (!Array.isArray(widget.props.children)) {
                        widget.props.children = [widget.props.children];
                    }
                    WidgetManager.insertChildWidgets(widget, widgetDiv);
                }
            });
        }
        else {
            WidgetManager.updateWidgetStyles(widgetDiv, widget.props);

            // Handle children widgets if this is a container
            // Normalize children to array if it's a single object
            if (widget.props.children) {
                if (!Array.isArray(widget.props.children)) {
                    widget.props.children = [widget.props.children];
                }
                WidgetManager.insertChildWidgets(widget, widgetDiv);
            }
        }

        return widget.props;
    }

    /**
     * Check if a widget with the given ID already exists
     * @param {string} widgetId - The ID to check
     * @param {object} props - The props of the widget being inserted
     * @returns {object} - { isDuplicate: boolean, reason: string, existingWidget: object }
     */
    static checkForDuplicateWidget(widgetId, props) {
        // Check 1: Look for existing widget in the widgets array
        const existingInArray = widgets.find(w => {
            const wId = w.props.id || (w.props.channels?.[0]?.id);
            return wId === widgetId;
        });

        if (existingInArray) {
            return {
                isDuplicate: true,
                reason: `Widget with ID "${widgetId}" already exists in widgets array`,
                existingWidget: existingInArray
            };
        }

        // Check 2: Look for existing DOM element with this ID
        const existingInDOM = document.getElementById(widgetId);
        if (existingInDOM && existingInDOM.cabbageInstance) {
            return {
                isDuplicate: true,
                reason: `DOM element with ID "${widgetId}" already exists`,
                existingWidget: existingInDOM.cabbageInstance
            };
        }

        // Check 3: Check if any widget has this ID in their channels array
        const existingWithChannelId = widgets.find(w => {
            if (Array.isArray(w.props.channels)) {
                return w.props.channels.some(ch => ch.id === widgetId);
            }
            return false;
        });

        if (existingWithChannelId) {
            return {
                isDuplicate: true,
                reason: `Widget "${existingWithChannelId.props.id || existingWithChannelId.props.channels?.[0]?.id}" already has a channel with ID "${widgetId}"`,
                existingWidget: existingWithChannelId
            };
        }

        return { isDuplicate: false };
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
            console.log(`Cabbage: appendToMainForm - Found MainForm tagName=${form.tagName}, appending widget id=${widgetDiv.id}`);
        } else {
            console.log(`Cabbage: appendToMainForm - MainForm not found, appending widget id=${widgetDiv.id}`);
        }
        if (form && form.tagName && form.tagName.toLowerCase() !== 'rect') {
            // MainForm is an HTML element - append to it
            form.appendChild(widgetDiv);
        } else {
            // MainForm not found or is an SVG rect - append to appropriate container
            // For plugin mode, use zoom-wrapper if available, otherwise body
            const zoomWrapper = document.getElementById('zoom-wrapper');
            if (zoomWrapper) {
                console.log(`Cabbage: Appending ${widgetDiv.id} to zoom-wrapper`);
                zoomWrapper.appendChild(widgetDiv);
            } else {
                console.log(`Cabbage: Appending ${widgetDiv.id} to body`);
                document.body.appendChild(widgetDiv);
            }
        }

        // Diagnostic: log current MainForm child count and visible child IDs
        try {
            const currentForm = document.getElementById('MainForm');
            if (currentForm) {
                const ids = Array.from(currentForm.children).map(c => c.id || c.tagName);
                console.log(`Cabbage: appendToMainForm - MainForm now has ${currentForm.childElementCount} children:`, ids);
            } else {
                console.log('Cabbage: appendToMainForm - MainForm not present after append');
            }
            const found = document.getElementById(widgetDiv.id);
            console.log(`Cabbage: appendToMainForm - element with id ${widgetDiv.id} in DOM?`, !!found);
        } catch (e) {
            console.error('Cabbage: appendToMainForm diagnostic failed', e);
        }

        // Log MainForm structure for debugging
        console.log(`Cabbage: MainForm outerHTML:`, form.outerHTML.substring(0, 1000));
        console.log(`Cabbage: MainForm in document.body?`, document.body.contains(form));
        console.log(`Cabbage: MainForm.parentElement`, form.parentElement);
        console.log(`Cabbage: widgetDiv.ownerDocument === document`, widgetDiv.ownerDocument === document);
        console.log(`Cabbage: document.body.children.length`, document.body.children.length);
    }

    /**
     * Sets up a "form" widget with specific structure and elements, 
     * particularly when using the VSCode extension.
     * @param {object} widget - The "form" widget to set up.
     */
    static setupFormWidget(widget) {
        console.log("Cabbage: setupFormWidget called");
        let formDiv = document.getElementById('MainForm');
        console.log("Cabbage: MainForm element:", formDiv ? "found" : "not found");
        if (!formDiv) {
            formDiv = document.createElement('div');
            formDiv.id = 'MainForm';
            formDiv.style.position = 'relative';

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

                // Populate the menu with widget types (get fresh list including custom widgets)
                let menuItems = "";
                const currentWidgetTypes = getWidgetTypes();
                currentWidgetTypes.forEach((widget) => {
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

        // Populate the menu with widget types (works for both new and existing forms)
        if (vscode) {
            console.log("Cabbage: Attempting to populate menu, vscode context:", !!vscode);
            const ulMenu = document.querySelector('.menu');
            console.log("Cabbage: Menu element:", ulMenu);
            if (ulMenu) {
                let menuItems = "";
                const currentWidgetTypes = getWidgetTypes();
                console.log("Cabbage: Widget types to add to menu:", currentWidgetTypes.length, currentWidgetTypes);
                currentWidgetTypes.forEach((widgetType) => {
                    menuItems += `<li class="menuItem"><span>${widgetType}</span></li>`;
                });
                ulMenu.innerHTML = menuItems;
                console.log(`Cabbage: Populated context menu with ${currentWidgetTypes.length} widget types`);
            } else {
                console.error("Cabbage: Could not find .menu element to populate");
            }
        } else {
            console.log("Cabbage: Not in vscode context, skipping menu population");
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
                // Form widget uses 'style' instead of 'colour'
                const fillColor = widget.props.style?.fill || widget.props.colour?.fill || '#000000';
                const selectionColour = CabbageColours.invertColor(fillColor);
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

        console.log("Cabbage: Inserting", parentWidget.props.children.length, "child widgets for", CabbageUtils.getWidgetDivId(parentWidget.props));

        // Log parent container info
        if (parentDiv) {
            const parentStyle = window.getComputedStyle(parentDiv);
            console.log(`Cabbage: Parent ${CabbageUtils.getWidgetDivId(parentWidget.props)} - position: ${parentStyle.position}, zIndex: ${parentStyle.zIndex}, display: ${parentStyle.display}, transform: ${parentStyle.transform}`);
        }

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
                parentChannel: CabbageUtils.getWidgetDivId(parentWidget.props) // Mark as child
            };

            console.log(`Cabbage: Inserting child ${childProps.channel} (type: ${childProps.type}) at position (${absoluteBounds.left}, ${absoluteBounds.top})`);

            // Insert the child widget
            const childWidget = await WidgetManager.insertWidget(childProps.type, childWidgetProps, parentWidget.props.currentCsdFile);

            // Ensure child widgets appear above their container
            const childChannelId = CabbageUtils.getWidgetDivId(childProps);
            const childDiv = document.getElementById(childChannelId);
            if (childDiv) {
                const computedStyle = window.getComputedStyle(childDiv);
                console.log(`Cabbage: Child ${CabbageUtils.getWidgetDivId(childProps)} div found, innerHTML length: ${childDiv.innerHTML.length}, display: ${computedStyle.display}, position: ${computedStyle.position}, transform: ${computedStyle.transform}, zIndex: ${computedStyle.zIndex}`);

                // Explicitly set position and transform for child widgets
                childDiv.style.position = 'absolute';
                childDiv.style.top = '0px';
                childDiv.style.left = '0px';
                childDiv.style.transform = `translate(${absoluteBounds.left}px, ${absoluteBounds.top}px)`;
                childDiv.style.width = childProps.bounds.width + 'px';
                childDiv.style.height = childProps.bounds.height + 'px';

                // Set zIndex for child widgets - ensure they appear above their parent
                const baseZIndex = 1000; // Base zIndex higher than main form
                const parentIndex = typeof parentWidget.props?.zIndex === 'number' ? parentWidget.props.zIndex : 0;
                const childIndex = typeof childProps?.zIndex === 'number' ? childProps.zIndex : 0;
                // Children get higher zIndex than parent (parent index + child index + 1)
                childDiv.style.zIndex = (baseZIndex + parentIndex + childIndex + 1).toString();

                childDiv.setAttribute('data-parent-channel', CabbageUtils.getWidgetDivId(parentWidget.props)); // Mark as child widget

                // Set pointer events based on mode
                if (cabbageMode === 'draggable') {
                    childDiv.style.pointerEvents = 'none'; // Disable pointer events in draggable mode
                } else {
                    childDiv.style.pointerEvents = 'auto'; // Enable pointer events in performance mode
                }

                // Log final position after style application
                const finalStyle = window.getComputedStyle(childDiv);
                console.log(`Cabbage: Child ${childProps.channel} final position: ${finalStyle.position}, transform: ${finalStyle.transform}, zIndex: ${finalStyle.zIndex}, pointerEvents: ${finalStyle.pointerEvents}`);
            } else {
                console.error(`Cabbage: Child div for ${CabbageUtils.getWidgetDivId(childProps)} NOT FOUND!`);
            }

            // Ensure container has lower zIndex than children (but still above main form)
            if (parentDiv) {
                const baseZIndex = 1000;
                const parentIndex = typeof parentWidget.props?.zIndex === 'number' ? parentWidget.props.zIndex : 0;
                parentDiv.style.zIndex = (baseZIndex + parentIndex).toString();
            }
        }
    } static handleRadioGroup(radioGroup, activeChannel) {
        handleRadioGroup(radioGroup, activeChannel);
    }
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
        } else if (props && props.size && typeof props.size === 'object') {
            widgetDiv.style.width = props.size.width + 'px';
            widgetDiv.style.height = props.size.height + 'px';
        }

        // Set zIndex based on widget index property, ensuring widgets appear above the main form (zIndex: 0)
        const baseZIndex = 1000; // Base zIndex higher than main form
        let widgetIndex = 0;
        if (props?.zIndex !== undefined && props?.zIndex !== null) {
            const parsed = parseInt(props.zIndex, 10);
            if (!isNaN(parsed)) {
                widgetIndex = parsed;
            }
        }
        widgetDiv.style.zIndex = (baseZIndex + widgetIndex).toString();
    }

    /**
    * Helper function to check if two channel values match
    * Handles both string channels and object channels (for xyPad)
    */
    static channelsMatch(channel1, channel2) {
        // If both are strings, do simple comparison
        if (typeof channel1 === 'string' && typeof channel2 === 'string') {
            return channel1 === channel2;
        }

        // If both are objects, compare their id fields (or x field as fallback)
        if (typeof channel1 === 'object' && channel1 !== null && typeof channel2 === 'object' && channel2 !== null) {
            const id1 = channel1.id || channel1.x;
            const id2 = channel2.id || channel2.x;
            console.log(`channelsMatch: comparing object channels: id1="${id1}" vs id2="${id2}" => ${id1 === id2}`);
            return id1 === id2
        }

        // If one is string and one is object, check if string matches id, x, or y
        if (typeof channel1 === 'string' && typeof channel2 === 'object' && channel2 !== null) {
            return channel1 === channel2.id || channel1 === channel2.x || channel1 === channel2.y;
        }
        if (typeof channel1 === 'object' && channel1 !== null && typeof channel2 === 'string') {
            return channel1.id === channel2 || channel1.x === channel2 || channel1.y === channel2;
        }

        return false;
    }

    /**
    * This is called from the plugin and updates a corresponding widget.
    * It searches for a widget based on its 'channel' property and updates its data and display.
    * If the widget is not found, it attempts to create a new widget based on the provided data.
    * @param {object} obj - JSON object pertaining to the widget that needs updating.
    */
    static async updateWidget(obj) {
        if (!obj.id) {
            console.error("WidgetManager.updateWidget: No 'id' in update message. Old 'channel' syntax is no longer supported.");
            return;
        }
        // console.log(`WidgetManager.updateWidget: Called with obj:`, JSON.stringify(obj, null, 2));
        // Extract channel ID for logging
        const channelStr = obj.id;
        //console.log(`WidgetManager.updateWidget: Extracted channelStr: ${channelStr}`);
        // Check if 'widgetJson' exists, otherwise use 'value'
        const data = obj.widgetJson ? JSON.parse(obj.widgetJson) : obj.value;
        //console.log(`WidgetManager.updateWidget: Parsed data:`, data);

        // Determine the channel to use for finding the widget
        // If data is a primitive (number, string), use obj.id directly
        const channelToFind = (typeof data === 'object' && data !== null)
            ? (data.id || (data.channels && data.channels.length > 0 && data.channels[0].id) || obj.id)
            : obj.id;
        //console.log(`WidgetManager.updateWidget: Channel to find: ${channelToFind}`);

        const widget = widgets.find(w => {
            return WidgetManager.channelsMatch(w.props.channel, channelToFind) ||
                (w.props.channels && w.props.channels.some(c => WidgetManager.channelsMatch(c, channelToFind))) ||
                w.props.id === channelToFind;
        });
        //console.log(`WidgetManager.updateWidget: Found widget:`, widget ? `type=${widget.props.type}, channel=${CabbageUtils.getChannelId(widget.props, 0)}` : 'null');
        let widgetFound = false;

        // Check if this is a child widget
        const isChildWidget = widget && widget.props.parentChannel;
        if (isChildWidget) {
            //console.log(`WidgetManager.updateWidget: ${channelStr} is a child of ${widget.props.parentChannel}`);
        }

        if (widget) {
            const channelId = CabbageUtils.getWidgetDivId(widget.props, 0);
            // console.log(`WidgetManager.updateWidget: channel=${obj.channel}, value=${obj.value}, widgetJson=${obj.widgetJson}, widget type=${widget.props.type}, isDragging=${widget.isDragging}`);
            // widget.props.currentCsdFile = obj.currentCsdPath;
            // WidgetManager.currentCsdPath = obj.currentCsdPath;
            //if only updating value..
            if (obj.hasOwnProperty('value') && !obj.hasOwnProperty('widgetJson')) {
                //console.log(`WidgetManager.updateWidget: Value-only update for ${widget.props.type}, value=${obj.value}`);
                // Special handling for xyPad - determine which axis to update
                if (widget.props.type === "xyPad") {
                    //console.log(`WidgetManager.updateWidget: Handling xyPad update`);
                    if (obj.value != null && !isNaN(obj.value)) {
                        // Determine which axis by checking if obj.id matches x or y
                        const channelStr = obj.id;
                        const xChannelId = CabbageUtils.getChannelId(widget.props, 0);
                        const yChannelId = CabbageUtils.getChannelId(widget.props, 1);
                        const isXChannel = channelStr === xChannelId;
                        const isYChannel = channelStr === yChannelId;
                        //console.log(`WidgetManager.updateWidget: xyPad - channelStr=${channelStr}, xChannelId=${xChannelId}, yChannelId=${yChannelId}, isX=${isXChannel}, isY=${isYChannel}`);

                        if (isXChannel || isYChannel) {
                            widget.isUpdatingFromBackend = true;
                            const axis = isXChannel ? 'x' : 'y';
                            const range = CabbageUtils.getChannelRange(widget.props, isXChannel ? 0 : 1);
                            //console.log(`WidgetManager.updateWidget: xyPad - axis=${axis}, range=`, range);

                            // Normalize the value to [0,1] based on the range
                            let normalizedValue;
                            if (obj.value >= 0 && obj.value <= 1) {
                                // Value is already normalized
                                normalizedValue = obj.value;
                            } else {
                                // Convert from actual value to normalized [0,1]
                                normalizedValue = (obj.value - range.min) / (range.max - range.min);
                                normalizedValue = Math.max(0, Math.min(1, normalizedValue)); // Clamp to [0,1]
                            }

                            // Update the ball position
                            if (isXChannel) {
                                widget.ballX = normalizedValue;
                            } else {
                                widget.ballY = normalizedValue;
                            }

                            // Redraw the widget
                            const widgetDiv = CabbageUtils.getWidgetDiv(channelId);
                            if (widgetDiv) {
                                widgetDiv.innerHTML = widget.getInnerHTML();
                            }
                            widget.isUpdatingFromBackend = false;
                        }
                    }
                    return; // Early return for xyPad
                }

                // Don't update value for sliders that are currently being dragged
                if (!(["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(widget.props.type) && widget.isDragging)) {
                    //console.log(`WidgetManager.updateWidget: Updating value for ${widget.props.type}, not dragging`);
                    if (obj.value != null) {
                        // console.log(`Processing value update for ${widget.props.type}: ${obj.value}`);
                        // Set flag to indicate this is a programmatic update from backend
                        widget.isUpdatingFromBackend = true;
                        let newValue = obj.value;
                        // For sliders, handle value conversion
                        if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(widget.props.type)) {
                            //console.log(`WidgetManager.updateWidget: Converting slider value ${obj.value}`);
                            const range = CabbageUtils.getChannelRange(widget.props, 0);
                            if (!isNaN(obj.value) && obj.value >= 0 && obj.value <= 1) {
                                // Assume received value is linear normalized [0,1], convert to skewed
                                const skewedNormalized = Math.pow(obj.value, range.skew);
                                newValue = range.min + skewedNormalized * (range.max - range.min);
                                // console.log(`WidgetManager.updateWidget: Converted linear ${obj.value} to skewed ${newValue}`);
                            } else if (!isNaN(obj.value) && (obj.value < 0 || obj.value > 1)) {
                                // Assume received value is already skewed
                                newValue = obj.value;
                                //console.log(`WidgetManager.updateWidget: Value ${obj.value} assumed skewed`);
                            } else {
                                //console.log(`WidgetManager.updateWidget: Invalid value ${obj.value}, skipping`);
                                return; // Skip update for invalid values
                            }
                        }
                        // console.log(`WidgetManager.updateWidget: updating ${widget.props.type} value from ${widget.props.value} to ${newValue}`);

                        // For multi-channel widgets, find which channel to update
                        if (widget.props.channels && Array.isArray(widget.props.channels) && widget.props.channels.length > 1) {
                            // Find the channel index that matches obj.id
                            const channelIndex = widget.props.channels.findIndex(c => WidgetManager.channelsMatch(c, channelToFind));
                            if (channelIndex !== -1) {
                                // Update the specific channel's value
                                widget.props.channels[channelIndex].range.value = newValue;
                                console.log(`WidgetManager: Updated multi-channel widget ${widget.props.type} channel[${channelIndex}] (${channelToFind}) to ${newValue}`);
                            } else {
                                console.warn(`WidgetManager: Could not find channel index for ${channelToFind} in widget ${widget.props.type}`);
                            }
                        } else {
                            // Single-channel widget - update widget.props.value
                            widget.props.value = newValue;
                        }

                        // Call getInnerHTML to refresh the widget's display
                        const widgetDiv = CabbageUtils.getWidgetDiv(channelId);
                        // If the widget manages its own canvas, do not overwrite innerHTML.
                        // Canvas widgets (like genTable, eqController) handle their own rendering.
                        if (widgetDiv && typeof widget.createCanvas !== 'function') {
                            widgetDiv.innerHTML = widget.getInnerHTML();
                        } else if (widgetDiv && typeof widget.updateCanvas === 'function') {
                            // Canvas widget - call its update method to redraw with new value
                            widget.updateCanvas();
                        }
                        // Clear the flag after update is complete
                        widget.isUpdatingFromBackend = false;
                    } else {
                        console.log(`Skipping value update because obj.value is null/undefined: ${obj.value}`);
                    }
                } else {
                    // console.log(`WidgetManager.updateWidget: skipping update for dragging ${widget.props.type}`);
                }
                return; // Early return
            }

            //console.log(`WidgetManager.updateWidget: Data merge update for ${widget.props.type}`);
            // Save current value for sliders to prevent accidental null resets during visibility changes
            let savedSliderValue;
            if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(widget.props.type)) {
                savedSliderValue = widget.props.value;
            }
            // Update widget properties
            //console.log(`WidgetManager.updateWidget: Merging data into widget props`);
            WidgetManager.deepMerge(widget.props, data);
            // Restore value if accidentally set to null
            if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(widget.props.type)) {
                if (widget.props.value === null && savedSliderValue !== null && savedSliderValue !== undefined) {
                    widget.props.value = savedSliderValue;
                    // console.log(`WidgetManager.updateWidget: restored slider value from null to ${savedSliderValue} for ${widget.props.type}`);
                }
            }

            // Ensure slider values are not null or NaN
            if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(widget.props.type)) {
                const range = CabbageUtils.getChannelRange(widget.props, 0);
                if (widget.props.value === null || isNaN(widget.props.value)) {
                    widget.props.value = range.defaultValue;
                }
                // Note: Values from backend are already in full range, no normalization needed
            }
            widgetFound = true;
            if (widget.props.type === "form") {
                // Special handling for form widget
                const form = document.getElementById('MainForm');
                if (form) {
                    form.style.width = widget.props.size.width + "px";
                    form.style.height = widget.props.size.height + "px";

                    // Ensure SVG is present and updated
                    if (typeof widget.updateSVG === 'function') {
                        widget.updateSVG();
                    }
                } else {
                    console.error("MainForm not found");
                }
            }
            else {
                // Existing code for other widget types
                const widgetDiv = CabbageUtils.getWidgetDiv(channelId);
                if (widgetDiv) {
                    // Update styles (position, size, zIndex) immediately
                    WidgetManager.updateWidgetStyles(widgetDiv, widget.props);

                    // Special-case for widgets that manage their own canvas (e.g. genTable, eqController).
                    // Do not clobber the inner DOM. Ensure the inner placeholder exists and
                    // then call the widget's update method which will reuse/append the canvas.
                    if (typeof widget.createCanvas === 'function') {
                        const innerId = CabbageUtils.getWidgetDivId(widget.props);
                        let inner = document.getElementById(innerId);
                        // If the inner placeholder is missing or not a child of the wrapper,
                        // create it by applying the canonical inner HTML once.
                        if (!inner || !widgetDiv.contains(inner)) {
                            widgetDiv.innerHTML = widget.getInnerHTML();
                            inner = document.getElementById(innerId);
                        }

                        // Ensure the wrapper is positioned so inner absolute coords resolve to it
                        try { widgetDiv.style.position = widgetDiv.style.position || 'relative'; } catch (e) { }

                        // Ensure the inner placeholder is positioned so the widget's
                        // canvas (which is appended inside it) aligns to the wrapper.
                        if (inner) {
                            try {
                                // Make inner a positioned container relative to wrapper
                                inner.style.position = inner.style.position || 'relative';
                                inner.style.left = '0px';
                                inner.style.top = '0px';
                                inner.style.width = Number(widget.props.bounds.width) + 'px';
                                inner.style.height = Number(widget.props.bounds.height) + 'px';
                            } catch (e) {
                                // defensive: ignore failures in exotic environments
                            }
                        }

                        // Ensure the widget's canvas (if already created) is absolutely positioned
                        try {
                            if (widget.canvas && widget.canvas.style) {
                                widget.canvas.style.position = 'absolute';
                                widget.canvas.style.left = '0px';
                                widget.canvas.style.top = '0px';
                                widget.canvas.style.width = inner ? inner.style.width : (Number(widget.props.bounds.width) + 'px');
                                widget.canvas.style.height = inner ? inner.style.height : (Number(widget.props.bounds.height) + 'px');
                            }
                        } catch (e) {
                            // ignore
                        }

                        // Update wrapper styles then let the widget update its canvas
                        let propsForStyling = widget.props;
                        if (widget.props.parentChannel) {
                            const parentWidget = widgets.find(w => CabbageUtils.getWidgetDivId(w.props) === widget.props.parentChannel);
                            if (parentWidget) {
                                const absoluteLeft = parentWidget.props.bounds.left + widget.props.bounds.left;
                                const absoluteTop = parentWidget.props.bounds.top + widget.props.bounds.top;
                                propsForStyling = {
                                    ...widget.props,
                                    bounds: {
                                        ...widget.props.bounds,
                                        left: absoluteLeft,
                                        top: absoluteTop
                                    }
                                };
                                console.log(`Cabbage: Child widget ${CabbageUtils.getWidgetDivId(widget.props)} using absolute position (${absoluteLeft}, ${absoluteTop}) instead of relative (${widget.props.bounds.left}, ${widget.props.bounds.top})`);
                            }
                        }
                        WidgetManager.updateWidgetStyles(widgetDiv, propsForStyling);

                        try {
                            if (typeof widget.updateCanvas === 'function') {
                                widget.updateCanvas();
                            }
                        } catch (e) {
                            console.error('Cabbage: widget.updateCanvas() threw', e);
                        }
                    } else {
                        // Default behavior for widgets that render their HTML via getInnerHTML
                        widgetDiv.innerHTML = widget.getInnerHTML();

                        // Update wrapper styles (respect parent-relative positioning)
                        let propsForStyling = widget.props;
                        if (widget.props.parentChannel) {
                            const parentWidget = widgets.find(w => CabbageUtils.getWidgetDivId(w.props) === widget.props.parentChannel);
                            if (parentWidget) {
                                const absoluteLeft = parentWidget.props.bounds.left + widget.props.bounds.left;
                                const absoluteTop = parentWidget.props.bounds.top + widget.props.bounds.top;
                                propsForStyling = {
                                    ...widget.props,
                                    bounds: {
                                        ...widget.props.bounds,
                                        left: absoluteLeft,
                                        top: absoluteTop
                                    }
                                };
                                console.log(`Cabbage: Child widget ${CabbageUtils.getWidgetDivId(widget.props)} using absolute position (${absoluteLeft}, ${absoluteTop}) instead of relative (${widget.props.bounds.left}, ${widget.props.bounds.top})`);
                            }
                        }
                        WidgetManager.updateWidgetStyles(widgetDiv, propsForStyling);

                        // If this widget has children, update their positions
                        if (widget.props.children && Array.isArray(widget.props.children)) {
                            widget.props.children.forEach(childProps => {
                                const childChannelId = CabbageUtils.getWidgetDivId(childProps);
                                const childDiv = document.getElementById(childChannelId);
                                if (childDiv) {
                                    const absoluteLeft = widget.props.bounds.left + childProps.bounds.left;
                                    const absoluteTop = widget.props.bounds.top + childProps.bounds.top;
                                    // Update child widget styles using childProps directly
                                    // (child widgets are not in the widgets array, they're only in parent.children)
                                    WidgetManager.updateWidgetStyles(childDiv, {
                                        ...childProps,
                                        bounds: {
                                            ...childProps.bounds,
                                            left: absoluteLeft,
                                            top: absoluteTop
                                        }
                                    });
                                }
                            });
                        }
                    }
                } else {
                    const channelStr = CabbageUtils.getWidgetDivId(widget.props, 0);
                    console.error(`Widget div for channel ${channelStr} not found`);
                }
            }
        } else {
            // console.log(`WidgetManager.updateWidget: Widget not found in top-level array, checking for child widgets`);
            // Widget not found in top-level array. Check if it's a child of any container widget (group/image)
            const parentWithChild = widgets.find(w => w.props.children && Array.isArray(w.props.children) && w.props.children.some(c => CabbageUtils.getWidgetDivId(c) === obj.id));
            // console.log(`WidgetManager.updateWidget: Parent with child found:`, parentWithChild ? `type=${parentWithChild.props.type}` : 'null');
            if (parentWithChild) {
                console.log(`WidgetManager.updateWidget: Updating child widget in parent ${parentWithChild.props.channel}`);
                // console.log(`Cabbage: Found child widget ${obj.id} in parent ${parentWithChild.props.channel}, updating child. Data:`, JSON.stringify(obj, null, 2));
                const childProps = parentWithChild.props.children.find(c => CabbageUtils.getWidgetDivId(c) === obj.id);
                // console.log(`WidgetManager.updateWidget: Child props found:`, childProps);

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
                const objChannelId = obj.id;
                const childDiv = document.getElementById(objChannelId);
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
                        console.warn("Cabbage: Updated child widget instance", obj.id, instance.props.value);
                    } else {
                        // Fallback: create a temporary widget instance to render HTML
                        const tempWidget = await WidgetManager.createWidget(childProps.type);
                        WidgetManager.deepMerge(tempWidget.props, childProps);
                        // Ensure slider values are not null
                        if (["rotarySlider", "horizontalSlider", "verticalSlider", "numberSlider", "horizontalRangeSlider"].includes(childProps.type)) {
                            if (tempWidget.props.value === null) {
                                const range = CabbageUtils.getChannelRange(tempWidget.props, 0);
                                tempWidget.props.value = range.defaultValue;
                            }
                        }
                        childDiv.innerHTML = tempWidget.getInnerHTML();
                        console.warn("Cabbage: Updated temporary child widget", obj.id);
                    }
                } else {
                    console.warn(`Cabbage: child div for ${obj.id} not found in DOM`);
                }
                widgetFound = true;
            } else {
                // obj.id contains the identifier sent from the backend
                console.log(`Cabbage: Widget with channel ${obj.id} not found - going to create it now`);
            }
        }
        // If the widget is not found, attempt to create a new widget from the provided data
        if (!widgetFound) {
            console.log(`WidgetManager.updateWidget: Widget not found, attempting to create new widget`);
            // If this is a value-only update (no widgetJson field), we can't create a widget
            if (obj.hasOwnProperty('value') && !obj.hasOwnProperty('widgetJson')) {
                const channelStr = obj.id;
                console.warn(`Cabbage: Cannot update value for non-existent widget "${channelStr}". Widget must be defined in the CSD file first.`);
                return;
            }

            try {
                let p = typeof data === 'string' ? JSON.parse(data) : data;
                console.log(`WidgetManager.updateWidget: Parsed props for new widget:`, p);

                // If the parsed data has a 'type' property, insert a new widget into the form
                if (p.hasOwnProperty('type')) {
                    const widgetId = p.id || (p.channels && p.channels.length > 0 && p.channels[0].id);
                    console.log(`WidgetManager.updateWidget: Parsed props for new widget. Type: ${p.type}, ID: ${widgetId}`);
                    console.log(`WidgetManager.updateWidget: Pending widgets map size: ${WidgetManager.pendingWidgets.size}`);

                    // Check for duplicates BEFORE starting insertion
                    if (widgetId) {
                        const existingWidget = widgets.find(w => {
                            const wId = w.props.id || (w.props.channels?.[0]?.id);
                            return wId === widgetId;
                        });

                        const existingDOM = document.getElementById(widgetId);

                        if (existingWidget || (existingDOM && existingDOM.cabbageInstance)) {
                            console.warn(`WidgetManager.updateWidget: Widget ${widgetId} already exists, skipping duplicate insertion`);
                            console.warn(`  - Found in widgets array: ${!!existingWidget}`);
                            console.warn(`  - Found in DOM: ${!!existingDOM}`);
                            if (existingDOM) {
                                console.warn(`  - DOM element parent: ${existingDOM.parentElement?.id || existingDOM.parentElement?.tagName}`);
                                console.warn(`  - DOM element has cabbageInstance: ${!!existingDOM.cabbageInstance}`);
                            }
                            console.warn(`  - widgets.length: ${widgets.length}`);
                            console.warn(`  - MainForm exists: ${!!document.getElementById('MainForm')}`);
                            return;
                        }
                    }

                    // Check for pending insertion to prevent race conditions
                    if (widgetId && WidgetManager.pendingWidgets.has(widgetId)) {
                        console.warn(`WidgetManager.updateWidget: RACE CONDITION DETECTED! Widget ${widgetId} is already being inserted. Waiting for promise...`);
                        await WidgetManager.pendingWidgets.get(widgetId);
                        console.log(`WidgetManager.updateWidget: Widget ${widgetId} insertion promise resolved. Skipping duplicate insertion.`);
                        return;
                    }

                    // Track this insertion in pendingWidgets IMMEDIATELY to prevent TOCTOU race
                    // This must happen BEFORE any await or async operation
                    let resolveInsertion;
                    const insertionPromise = new Promise(resolve => { resolveInsertion = resolve; });
                    if (widgetId) {
                        WidgetManager.pendingWidgets.set(widgetId, insertionPromise);
                        console.log(`WidgetManager.updateWidget: Added ${widgetId} to pendingWidgets. Map size now: ${WidgetManager.pendingWidgets.size}`);
                    }

                    // If this is NOT a form widget and MainForm doesn't exist, queue it
                    if (p.type !== 'form' && !document.getElementById('MainForm')) {
                        if (!WidgetManager.pendingNonFormWidgets) {
                            WidgetManager.pendingNonFormWidgets = [];
                        }
                        console.log(`WidgetManager.updateWidget: MainForm not found, queueing ${p.type} widget ${widgetId}`);
                        WidgetManager.pendingNonFormWidgets.push(obj);
                        // Clean up pending flag since we're queueing instead of inserting
                        if (widgetId) {
                            resolveInsertion();
                            WidgetManager.pendingWidgets.delete(widgetId);
                        }
                        return;
                    }

                    console.log(`WidgetManager.updateWidget: Creating new widget of type ${p.type}`);

                    try {
                        await WidgetManager.insertWidget(p.type, p, obj.currentCsdPath);

                        // If this was a form widget and we have queued widgets, process them now
                        if (p.type === 'form' && WidgetManager.pendingNonFormWidgets && WidgetManager.pendingNonFormWidgets.length > 0) {
                            console.log(`WidgetManager.updateWidget: MainForm created, processing ${WidgetManager.pendingNonFormWidgets.length} queued widgets`);
                            const queuedWidgets = WidgetManager.pendingNonFormWidgets;
                            WidgetManager.pendingNonFormWidgets = [];
                            for (const queuedMessage of queuedWidgets) {
                                await WidgetManager.updateWidget(queuedMessage);
                            }
                        }
                    } finally {
                        if (widgetId) {
                            resolveInsertion();
                            WidgetManager.pendingWidgets.delete(widgetId);
                            console.log(`WidgetManager.updateWidget: Removed ${widgetId} from pendingWidgets. Map size now: ${WidgetManager.pendingWidgets.size}`);
                        }
                    }
                }
                else {
                    console.error("No type property found in data", p);
                }
            } catch (error) {
                console.error("Error parsing JSON widgetJson:", error, obj.widgetJson);
            }
        } else {
            // console.log(`WidgetManager.updateWidget: Widget was found and updated`);
        }
    }

}



