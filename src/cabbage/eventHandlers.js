console.log("loading eventHandlers.js");

// Imports variables from the sharedState.js file
// - cabbageMode: Determines if widgets are draggable.
// - vscode: Reference to the VSCode API, null in plugin mode.
// - widgets: Array holding all the widgets in the current form.
import { cabbageMode, vscode, widgets } from "./sharedState.js";

// Imports utility and property panel modules
import { CabbageUtils, CabbageColours } from "../cabbage/utils.js";

import { WidgetManager } from "../cabbage/widgetManager.js";

// Declare PropertyPanel variable and a promise to track its loading
let PropertyPanel;

const loadPropertyPanel = async () => {
    if (!PropertyPanel) {
        try {
            const module = await import("../propertyPanel.js");
            PropertyPanel = module.default || module.PropertyPanel;
            console.log("PropertyPanel loaded successfully:", PropertyPanel);
        } catch (error) {
            console.error("Error loading PropertyPanel:", error);
            throw error; // Re-throw to be caught by the caller
        }
    }
    return PropertyPanel;
};

if (vscode !== null) {
    console.log("Attempting to load PropertyPanel");
    propertyPanelPromise = import("../propertyPanel.js")
        .then(module => {
            console.log("PropertyPanel module loaded:", module);
            PropertyPanel = loadPropertyPanel();
            console.log("PropertyPanel assigned:", PropertyPanel);
            return PropertyPanel;
        })
        .catch(error => {
            console.error("Error loading PropertyPanel:", error);
        });
} else {
    console.log("vscode is null, not loading PropertyPanel");
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
 * Sets up the form's context menu and various event handlers to handle widget grouping, 
 * dragging, and selection of multiple widgets.
 */
export function setupFormHandlers() {
    // Create a dynamic context menu for grouping and ungrouping widgets
    const groupContextMenu = document.createElement("div");
    groupContextMenu.id = "dynamicContextMenu";
    groupContextMenu.style.position = "absolute";
    groupContextMenu.style.visibility = "hidden";
    groupContextMenu.style.backgroundColor = "#fff";
    groupContextMenu.style.border = "1px solid #ccc";
    groupContextMenu.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
    groupContextMenu.style.zIndex = 10000; // Ensure it's on top

    // Create and style context menu options (Group/Ungroup)
    const groupOption = document.createElement("div");
    groupOption.innerText = "Group";
    groupOption.style.padding = "8px";
    groupOption.style.cursor = "pointer";

    const unGroupOption = document.createElement("div");
    unGroupOption.innerText = "Ungroup";
    unGroupOption.style.padding = "8px";
    unGroupOption.style.cursor = "pointer";

    // Append menu options to the context menu
    groupContextMenu.appendChild(groupOption);
    groupContextMenu.appendChild(unGroupOption);

    // Append context menu to the document body
    document.body.appendChild(groupContextMenu);

    // Add event listeners for group and ungroup functionality (Currently just logs actions)
    groupOption.addEventListener("click", () => {
        console.log("Group option clicked");
        groupContextMenu.style.visibility = "hidden";
        // Implement "Group" functionality here
    });

    unGroupOption.addEventListener("click", () => {
        console.log("Ungroup option clicked");
        groupContextMenu.style.visibility = "hidden";
        // Implement "Ungroup" functionality here
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
                let x = e.offsetX, y = e.offsetY,
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

                // Show appropriate menu based on mode and target element
                if (cabbageMode === 'draggable' && e.target.id === "MainForm") {
                    contextMenu.style.visibility = "visible";
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
                        console.warn("Adding widget of type:", type);
                        contextMenu.style.visibility = "hidden";

                        // Insert new widget and update the editor
                        const channel = CabbageUtils.getUniqueChannelName(type, widgets);
                        const widget = await WidgetManager.insertWidget(type, { channel, top: mouseDownPosition.y - 20, left: mouseDownPosition.x - 20 }, widgets);

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

        // Event listener for pointer down events on the form
        form.addEventListener('pointerdown', async (event) => {
            if (event.button !== 0) {return}; // Ignore right clicks

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