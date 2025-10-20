
// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

console.log("Cabbage: loading eventHandlers.js");

// Imports variables from the sharedState.js file
// - cabbageMode: Determines if widgets are draggable.
// - vscode: Reference to the VSCode API, null in plugin mode.
// - widgets: Array holding all the widgets in the current form.
import { cabbageMode, vscode, widgets } from "./sharedState.js";

// Imports utility and property panel modules
import { CabbageUtils, CabbageColours } from "../cabbage/utils.js";

import { WidgetManager } from "../cabbage/widgetManager.js";
import { Cabbage } from "../cabbage/cabbage.js";

// Declare PropertyPanel variable and a promise to track its loading
let PropertyPanel;

const loadPropertyPanel = async () => {
    if (!PropertyPanel) {
        try {
            const module = await import("../propertyPanel.js");
            PropertyPanel = module.default || module.PropertyPanel;
            console.log("Cabbage: PropertyPanel loaded successfully:", PropertyPanel);
        } catch (error) {
            console.error("Error loading PropertyPanel:", error);
            throw error; // Re-throw to be caught by the caller
        }
    }
    return PropertyPanel;
};

if (vscode !== null) {
    propertyPanelPromise = import("../propertyPanel.js")
        .then(module => {
            console.log("Cabbage: PropertyPanel module loaded:", module);
            PropertyPanel = loadPropertyPanel();
            console.log("Cabbage: PropertyPanel assigned:", PropertyPanel);
            return PropertyPanel;
        })
        .catch(error => {
            console.error("Error loading PropertyPanel:", error);
        });
} else {
    console.log("Cabbage: vscode is null, not loading PropertyPanel");
}

// Global set to keep track of selected elements in the form.
export let selectedElements = new Set();



/**
 * Handles pointer down events on widget elements.
 * Toggles selection state if Alt/Shift key is held, otherwise selects the widget exclusively.
 * @param {PointerEvent} e - The pointer down event.
 * @param {HTMLElement} widgetDiv - The widget element being clicked.
 */
export async function handlePointerDown(e, widgetDiv) {
    if (e.altKey || e.shiftKey) {
        widgetDiv.classList.toggle('selected');
        updateSelectedElements(widgetDiv);
    } else if (!widgetDiv.classList.contains('selected')) {
        // Clear all other selections and select the clicked widget exclusively
        selectedElements.forEach(element => element.classList.remove('selected'));
        selectedElements.clear();
        widgetDiv.classList.add('selected');
        selectedElements.add(widgetDiv);
    }

    // Wait for PropertyPanel to be loaded before using it

    if (PropertyPanel && cabbageMode === 'draggable') {
        try {
            const PP = await loadPropertyPanel();
            if (PP && typeof PP.updatePanel === 'function') {
                await PP.updatePanel(vscode, {
                    eventType: "click",
                    name: CabbageUtils.findValidId(e),
                    bounds: {}
                }, widgets);
            } else {
                console.error("PropertyPanel.updatePanel is not available");
            }
        } catch (error) {
            console.error("Error while using PropertyPanel:", error);
        }
    }
}

/**
 * Updates the selectedElements set based on the current selection state of a widget.
 * @param {HTMLElement} widgetDiv - The widget element to update.
 */
export function updateSelectedElements(widgetDiv) {
    if (widgetDiv.classList.contains('selected')) {
        selectedElements.add(widgetDiv);
    } else {
        selectedElements.delete(widgetDiv);
    }
}

/**
 * Groups the currently selected widgets into a container widget
 */
async function groupSelectedWidgets() {
    if (selectedElements.size < 2) {
        console.warn("Cabbage: Need at least 2 widgets to group");
        return;
    }

    console.log("Cabbage: Grouping", selectedElements.size, "widgets");

    // Find existing container widgets (groupBox or image) in the selection
    let containerWidget = null;
    const childWidgets = [];

    selectedElements.forEach(element => {
        const widget = widgets.find(w => w.props.id === element.id || CabbageUtils.getChannelId(w.props, 0) === element.id);
        if (widget && !widget.props.parentChannel) { // Only consider top-level widgets
            if ((widget.props.type === "groupBox" || widget.props.type === "image") && !containerWidget) {
                // Use the first groupBox or image as the container
                containerWidget = widget;
            } else {
                // All other widgets become children
                childWidgets.push({ widget, element });
            }
        }
    });

    if (childWidgets.length === 0) {
        console.warn("Cabbage: No widgets to group as children");
        return;
    }

    // If no existing container found, create a new groupBox
    let containerId;
    let containerBounds;

    if (!containerWidget) {
        // Calculate bounds that encompass all selected widgets
        let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;

        selectedElements.forEach(element => {
            const widget = widgets.find(w => w.props.id === element.id || CabbageUtils.getChannelId(w.props, 0) === element.id);
            if (widget && !widget.props.parentChannel) {
                const bounds = widget.props.bounds;
                minLeft = Math.min(minLeft, bounds.left);
                minTop = Math.min(minTop, bounds.top);
                maxRight = Math.max(maxRight, bounds.left + bounds.width);
                maxBottom = Math.max(maxBottom, bounds.top + bounds.height);
            }
        });

        // Create container bounds with some padding
        containerBounds = {
            left: minLeft - 10,
            top: minTop - 10,
            width: (maxRight - minLeft) + 20,
            height: (maxBottom - minTop) + 20
        };

        // Create a new groupbox container widget
        containerId = CabbageUtils.getUniqueId("groupBox", widgets);
        const containerProps = {
            id: containerId,
            type: "groupBox",
            bounds: containerBounds,
            channel: containerId,
            text: "Group",
            colour: { fill: "#cccccc", stroke: "#000000" },
            fontColour: { fill: "#000000" },
            children: [],
            currentCsdFile: WidgetManager.getCurrentCsdPath(),
            index: 0
        };

        // Insert the new container widget
        containerWidget = await WidgetManager.insertWidget("groupBox", containerProps, WidgetManager.getCurrentCsdPath());

        // Update the CSD file with the new container
        if (vscode) {
            vscode.postMessage({
                command: 'widgetUpdate',
                text: JSON.stringify(containerWidget)
            });
        }

        console.log("Cabbage: Created new container:", containerId);
    } else {
        // Use existing container
        containerId = containerWidget.props.id;
        containerBounds = containerWidget.props.bounds;
        console.log("Cabbage: Using existing container:", containerId);
    }

    // Initialize children array if it doesn't exist
    if (!containerWidget.props.children) {
        containerWidget.props.children = [];
    }

    // Convert selected widgets to children with relative positions
    childWidgets.forEach(({ widget }) => {
        const relativeBounds = {
            left: widget.props.bounds.left - containerBounds.left,
            top: widget.props.bounds.top - containerBounds.top,
            width: widget.props.bounds.width,
            height: widget.props.bounds.height
        };

        const childProps = {
            ...widget.props,
            bounds: relativeBounds,
            parentChannel: containerId
        };

        // Remove parentChannel if it exists (shouldn't for top-level widgets)
        delete childProps.parentChannel;

        containerWidget.props.children.push(childProps);

        // Remove from top-level widgets array
        const widgetIndex = widgets.findIndex(w => w.props.id === widget.props.id);
        if (widgetIndex !== -1) {
            widgets.splice(widgetIndex, 1);
        }

        // Remove from DOM
        const widgetDiv = document.getElementById(widget.props.id || CabbageUtils.getChannelId(widget.props, 0));
        if (widgetDiv) {
            widgetDiv.remove();
        }
    });

    // Update the CSD file with the modified container (now with children)
    if (vscode) {
        vscode.postMessage({
            command: 'widgetUpdate',
            text: JSON.stringify(containerWidget)
        });
    }

    // Clear selection
    selectedElements.forEach(element => element.classList.remove('selected'));
    selectedElements.clear();

    console.log("Cabbage: Successfully grouped widgets into container:", containerId, "with", childWidgets.length, "children");
}

/**
 * Ungroups the currently selected container widget, extracting its children back to top level
 */
async function ungroupSelectedWidgets() {
    if (selectedElements.size !== 1) {
        console.warn("Cabbage: Can only ungroup one container at a time");
        return;
    }

    const selectedElement = Array.from(selectedElements)[0];
    const containerWidget = widgets.find(w => w.props.id === selectedElement.id || CabbageUtils.getChannelId(w.props, 0) === selectedElement.id);

    if (!containerWidget || !containerWidget.props.children || containerWidget.props.children.length === 0) {
        console.warn("Cabbage: Selected widget is not a container with children");
        return;
    }

    // Only allow ungrouping of groupBox or image widgets that have children
    if (containerWidget.props.type !== "groupBox" && containerWidget.props.type !== "image") {
        console.warn("Cabbage: Can only ungroup groupBox or image containers");
        return;
    }

    console.log("Cabbage: Ungrouping container", containerWidget.props.id, "with", containerWidget.props.children.length, "children");

    // Convert child relative positions back to absolute positions
    const childrenPromises = containerWidget.props.children.map(async (childProps) => {
        const absoluteBounds = {
            ...childProps.bounds,
            left: containerWidget.props.bounds.left + childProps.bounds.left,
            top: containerWidget.props.bounds.top + childProps.bounds.top
        };

        const topLevelProps = {
            ...childProps,
            bounds: absoluteBounds,
            parentChannel: undefined // Remove parent channel reference
        };

        // Remove parentChannel property
        delete topLevelProps.parentChannel;

        // Insert the child as a top-level widget
        const childWidget = await WidgetManager.insertWidget(childProps.type, topLevelProps, containerWidget.props.currentCsdFile);

        // Update the CSD file with the new top-level widget
        if (vscode) {
            vscode.postMessage({
                command: 'widgetUpdate',
                text: JSON.stringify(childWidget)
            });
        }

        return childWidget;
    });

    // Wait for all children to be inserted
    await Promise.all(childrenPromises);

    // Remove the container from the widgets array
    const containerIndex = widgets.findIndex(w => w.props.id === containerWidget.props.id);
    if (containerIndex !== -1) {
        widgets.splice(containerIndex, 1);
    }

    // Remove the container from DOM
    const containerDiv = document.getElementById(containerWidget.props.id || CabbageUtils.getChannelId(containerWidget.props, 0));
    if (containerDiv) {
        containerDiv.remove();
    }

    // Clear selection
    selectedElements.forEach(element => element.classList.remove('selected'));
    selectedElements.clear();

    console.log("Cabbage: Successfully ungrouped container:", containerWidget.props.id);
}

/**
 * Sets up the form's context menu and various event handlers to handle widget grouping, 
 * dragging, and selection of multiple widgets.
 */
export function setupFormHandlers() {
    let lastClickTime = 0; // Variable to store the last click time
    const doubleClickThreshold = 300; // Time in milliseconds to consider as a double click

    // Create a dynamic context menu for grouping and ungrouping widgets
    const groupContextMenu = document.createElement("div");
    groupContextMenu.id = "dynamicContextMenu";
    groupContextMenu.style.position = "absolute";
    groupContextMenu.style.visibility = "hidden";
    groupContextMenu.style.backgroundColor = "#fff";
    groupContextMenu.style.border = "1px solid #ccc";
    groupContextMenu.style.boxShadow = "0 4px 12px rgba(0,0,0,0.3)";
    groupContextMenu.style.zIndex = 10001; // Higher than other elements
    groupContextMenu.style.borderRadius = "4px";
    groupContextMenu.style.minWidth = "120px";

    // Create and style context menu options (Group/Ungroup)
    const groupOption = document.createElement("div");
    groupOption.innerText = "Group";
    groupOption.style.padding = "8px 12px";
    groupOption.style.cursor = "pointer";
    groupOption.style.color = "#000";
    groupOption.style.backgroundColor = "#fff";
    groupOption.style.border = "none";
    groupOption.style.textAlign = "left";
    groupOption.style.fontSize = "14px";
    groupOption.style.fontFamily = "Arial, sans-serif";
    groupOption.addEventListener("mouseenter", () => {
        groupOption.style.backgroundColor = "#f0f0f0";
    });
    groupOption.addEventListener("mouseleave", () => {
        groupOption.style.backgroundColor = "#fff";
    });

    const unGroupOption = document.createElement("div");
    unGroupOption.innerText = "Ungroup";
    unGroupOption.style.padding = "8px 12px";
    unGroupOption.style.cursor = "pointer";
    unGroupOption.style.color = "#000";
    unGroupOption.style.backgroundColor = "#fff";
    unGroupOption.style.border = "none";
    unGroupOption.style.textAlign = "left";
    unGroupOption.style.fontSize = "14px";
    unGroupOption.style.fontFamily = "Arial, sans-serif";
    unGroupOption.addEventListener("mouseenter", () => {
        unGroupOption.style.backgroundColor = "#f0f0f0";
    });
    unGroupOption.addEventListener("mouseleave", () => {
        unGroupOption.style.backgroundColor = "#fff";
    });

    // Append menu options to the context menu
    groupContextMenu.appendChild(groupOption);
    groupContextMenu.appendChild(unGroupOption);

    // Append context menu to the document body
    document.body.appendChild(groupContextMenu);

    // Add event listeners for group and ungroup functionality (Currently just logs actions)
    groupOption.addEventListener("click", async () => {
        const canGroup = selectedElements.size > 1;
        const hasGroupableWidgets = Array.from(selectedElements).some(el => {
            const widget = widgets.find(w => w.props.id === el.id || CabbageUtils.getChannelId(w.props, 0) === el.id);
            return widget && !widget.props.parentChannel; // Only top-level widgets can be grouped
        });
        if (!(canGroup && hasGroupableWidgets)) return;

        console.log("Cabbage: Group option clicked");
        groupContextMenu.style.visibility = "hidden";
        // Implement "Group" functionality here
        await groupSelectedWidgets();
    });

    unGroupOption.addEventListener("click", async () => {
        const canUngroup = selectedElements.size === 1 && Array.from(selectedElements).some(el => {
            const widget = widgets.find(w => w.props.id === el.id || CabbageUtils.getChannelId(w.props, 0) === el.id);
            return widget && widget.props.children && widget.props.children.length > 0 &&
                   (widget.props.type === "groupBox" || widget.props.type === "image");
        });
        if (!canUngroup) return;

        console.log("Cabbage: Ungroup option clicked");
        groupContextMenu.style.visibility = "hidden";
        // Implement "Ungroup" functionality here
        await ungroupSelectedWidgets();
    });

    // Reference to the main context menu and the form element
    const contextMenu = document.querySelector(".wrapper");
    const form = document.getElementById('MainForm');

    // Setup event handler for right-click context menu in the form
    if (typeof acquireVsCodeApi === 'function') {
        let mouseDownPosition = {};

        if (form && contextMenu) {
            form.addEventListener("contextmenu", async (e) => {
                e.preventDefault(); // Prevent default context menu
                e.stopImmediatePropagation();
                e.stopPropagation();

                // Calculate correct context menu position
                let x = e.clientX, y = e.clientY,
                    winWidth = window.innerWidth,
                    winHeight = window.innerHeight,
                    cmWidth = contextMenu.offsetWidth,
                    cmHeight = contextMenu.offsetHeight;

                // Ensure the menu does not overflow the window bounds
                x = x > winWidth - cmWidth ? winWidth - cmWidth - 5 : x;
                y = y > winHeight - cmHeight ? winHeight - cmHeight - 5 : y;

                contextMenu.style.left = `${x}px`;
                contextMenu.style.top = `${y}px`;
                //set menu width
                contextMenu.style.width = '200px'; // Or any desired width

                // Calculate and display the group context menu
                x = e.clientX;
                y = e.clientY;
                x = x > winWidth - cmWidth ? winWidth - cmWidth - 5 : x;
                y = y > winHeight - cmHeight ? winHeight - cmHeight - 5 : y;
                groupContextMenu.style.left = `${x}px`;
                groupContextMenu.style.top = `${y}px`;

                mouseDownPosition = { x: x, y: y };

                // Show appropriate menu based on mode and selection
                if (cabbageMode === 'draggable') {
                    if (selectedElements.size > 0) {
                        // Update menu options based on selection
                        const canGroup = selectedElements.size > 1;
                        const hasGroupableWidgets = Array.from(selectedElements).some(el => {
                            const widget = widgets.find(w => w.props.id === el.id || CabbageUtils.getChannelId(w.props, 0) === el.id);
                            return widget && !widget.props.parentChannel; // Only top-level widgets can be grouped
                        });

                        const canUngroup = selectedElements.size === 1 && Array.from(selectedElements).some(el => {
                            const widget = widgets.find(w => w.props.id === el.id || CabbageUtils.getChannelId(w.props, 0) === el.id);
                            return widget && widget.props.children && widget.props.children.length > 0 &&
                                   (widget.props.type === "groupBox" || widget.props.type === "image");
                        });

                        groupOption.style.color = (canGroup && hasGroupableWidgets) ? "#000" : "#999";
                        groupOption.style.cursor = (canGroup && hasGroupableWidgets) ? "pointer" : "not-allowed";
                        groupOption.style.pointerEvents = (canGroup && hasGroupableWidgets) ? "auto" : "none";

                        unGroupOption.style.color = canUngroup ? "#000" : "#999";
                        unGroupOption.style.cursor = canUngroup ? "pointer" : "not-allowed";
                        unGroupOption.style.pointerEvents = canUngroup ? "auto" : "none";

                        groupContextMenu.style.visibility = "visible";
                    } else {
                        contextMenu.style.visibility = "visible";
                    }
                } else {
                    groupContextMenu.style.visibility = "visible";
                }

                // Wait for PropertyPanel to be loaded before using it
                if (PropertyPanel && cabbageMode === 'draggable') {
                    try {
                        const PP = await loadPropertyPanel();
                        if (PP && typeof PP.updatePanel === 'function') {
                            await PP.updatePanel(vscode, {
                                eventType: "click",
                                name: CabbageUtils.findValidId(e),
                                bounds: {}
                            }, widgets);
                        } else {
                            console.error("PropertyPanel.updatePanel is not available");
                        }
                    } catch (error) {
                        console.error("Error while using PropertyPanel:", error);
                    }
                }
            });

            // Add event listeners for menu items to insert new widgets when clicked
            let menuItems = document.getElementsByTagName('*');
            for (let i = 0; i < menuItems.length; i++) {
                if (menuItems[i].getAttribute('class') === 'menuItem') {
                    menuItems[i].addEventListener("pointerdown", async (e) => {
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        const type = e.target.innerHTML.replace(/(<([^>]+)>)/ig, ''); // Clean up HTML
                        console.warn("Cabbage: Adding widget of type:", type);
                        contextMenu.style.visibility = "hidden";

                        // Insert new widget and update the editor
                        const uniqueId = CabbageUtils.getUniqueId(type, widgets);
                        const widget = await WidgetManager.insertWidget(type, { id: uniqueId, top: mouseDownPosition.y - 20, left: mouseDownPosition.x - 20 }, WidgetManager.getCurrentCsdPath());
                        console.warn(widget);
                        if (widgets) {
                            vscode.postMessage({
                                command: 'widgetUpdate',
                                text: JSON.stringify(widget)
                            });
                        }
                    });
                }
            }
        } else {
            console.error("MainForm or contextMenu not found");
        }
    }

    // Handle selection, dragging, and group interactions
    if (form) {
        let isSelecting = false;
        let isDragging = false;
        let selectionBox;
        let startX, startY;
        let offsetX = 0;
        let offsetY = 0;

        form.addEventListener('dblclick', async (event) => {
            console.error("Cabbage: Double click event", event);
        });

        // Event listener for pointer down events on the form
        form.addEventListener('pointerdown', async (event) => {

            const currentTime = Date.now(); // Get the current time
            // Check if the time since the last click is within the double-click threshold
            if (currentTime - lastClickTime <= doubleClickThreshold) {
                console.error("Cabbage: Double click detected", event);
                vscode.postMessage({
                    command: 'jumpToWidget',
                    text: CabbageUtils.findValidId(event)
                });
            } else {
                // Handle single click logic here
                console.log("Cabbage: Cabbage: Single click detected", event);

                if (event.button !== 0 || cabbageMode !== 'draggable') { return; }; // Ignore right clicks

                // Hide context menus when clicking
                contextMenu.style.visibility = "hidden";
                groupContextMenu.style.visibility = "hidden";

                const clickedElement = event.target;
                const selectionColour = CabbageColours.invertColor(clickedElement.getAttribute('fill'));
                const formRect = form.getBoundingClientRect();
                offsetX = formRect.left;
                offsetY = formRect.top;

                // Selection logic for multi-select using Shift/Alt keys
                if ((event.shiftKey || event.altKey) && event.target.id === "MainForm") {
                    isSelecting = true;
                    startX = event.clientX - offsetX;
                    startY = event.clientY - offsetY;

                    // Create and style selection box
                    selectionBox = document.createElement('div');
                    selectionBox.style.position = 'absolute';
                    selectionBox.style.border = '1px dashed #000';
                    selectionBox.style.borderColor = `${selectionColour}`;
                    selectionBox.style.backgroundColor = `${CabbageColours.adjustAlpha(selectionColour, .4)}`;
                    selectionBox.style.zIndex = 9999;

                    selectionBox.style.left = `${startX}px`;
                    selectionBox.style.top = `${startY}px`;
                    form.appendChild(selectionBox);
                } else if (clickedElement.classList.contains('draggable') && event.target.id !== "MainForm") {
                    // Handle individual widget selection and toggling
                    if (!event.shiftKey && !event.altKey) {
                        if (!selectedElements.has(clickedElement)) {
                            selectedElements.forEach(element => element.classList.remove('selected'));
                            selectedElements.clear();
                            selectedElements.add(clickedElement);
                        }
                        clickedElement.classList.add('selected');
                    } else {
                        clickedElement.classList.toggle('selected');
                        if (clickedElement.classList.contains('selected')) {
                            selectedElements.add(clickedElement);
                        } else {
                            selectedElements.delete(clickedElement);
                        }
                    }
                }

                // Deselect all if clicking on the form background
                if (event.target.id === "MainForm") {
                    selectedElements.forEach(element => element.classList.remove('selected'));
                    selectedElements.clear();
                }

                // In the part where PropertyPanel is used:
                if (!event.shiftKey && !event.altKey && cabbageMode === 'draggable') {
                    try {
                        const PP = await loadPropertyPanel();
                        if (PP && typeof PP.updatePanel === 'function') {
                            await PP.updatePanel(vscode, {
                                eventType: "click",
                                name: CabbageUtils.findValidId(event),
                                bounds: {}
                            }, widgets);
                        } else {
                            console.error("PropertyPanel.updatePanel is not available");
                        }
                    } catch (error) {
                        console.error("Error while using PropertyPanel:", error);
                    }
                }
            }
            lastClickTime = currentTime;
        });

        // Handles pointer movement for selection and dragging
        document.addEventListener('pointermove', (event) => {
            if (isSelecting) {
                const currentX = event.clientX - offsetX;
                const currentY = event.clientY - offsetY;

                // Adjust selection box size dynamically
                selectionBox.style.width = `${Math.abs(currentX - startX)}px`;
                selectionBox.style.height = `${Math.abs(currentY - startY)}px`;
                selectionBox.style.left = `${Math.min(currentX, startX)}px`;
                selectionBox.style.top = `${Math.min(currentY, startY)}px`;
            }

            // Handle dragging logic if dragging is active
            if (isDragging && selectionBox) {
                const currentX = event.clientX;
                const currentY = event.clientY;

                const boxWidth = selectionBox.offsetWidth;
                const boxHeight = selectionBox.offsetHeight;

                const parentWidth = form.offsetWidth;
                const parentHeight = form.offsetHeight;

                const maxX = parentWidth - boxWidth;
                const maxY = parentHeight - boxHeight;

                let newLeft = currentX - offsetX;
                let newTop = currentY - offsetY;

                // Ensure the dragged box stays within form boundaries
                newLeft = Math.max(0, Math.min(maxX, newLeft));
                newTop = Math.max(0, Math.min(maxY, newTop));

                selectionBox.style.left = `${newLeft}px`;
                selectionBox.style.top = `${newTop}px`;
            }
        });

        // Handles pointer release (end of dragging or selection)
        document.addEventListener('pointerup', (event) => {
            if (isSelecting) {
                const rect = selectionBox.getBoundingClientRect();
                const elements = form.querySelectorAll('.draggable');

                // Select widgets that fall within the selection box
                elements.forEach((element) => {
                    const elementRect = element.getBoundingClientRect();
                    if (elementRect.right >= rect.left &&
                        elementRect.left <= rect.right &&
                        elementRect.bottom >= rect.top &&
                        elementRect.top <= rect.bottom) {
                        element.classList.add('selected');
                        selectedElements.add(element);
                    }
                });

                // Remove selection box from the form
                form.removeChild(selectionBox);
                isSelecting = false;
            }

            isDragging = false;
        });

        // Handle dragging of the selection box
        if (selectionBox) {
            selectionBox.addEventListener('pointerdown', (event) => {
                isDragging = true;
                offsetX = event.clientX - selectionBox.getBoundingClientRect().left;
                offsetY = event.clientY - selectionBox.getBoundingClientRect().top;
                event.stopPropagation(); // Prevent event from affecting other elements
            });
        }
    }
}