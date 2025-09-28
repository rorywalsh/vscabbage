
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

// Declare PropertyPanel variable and a promise to track its loading
let PropertyPanel;

const loadPropertyPanel = async () => {
    if (!PropertyPanel) {
        try {
            const module = await import("../propertyPanel.js");
            PropertyPanel = module.default || module.PropertyPanel;
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
            PropertyPanel = loadPropertyPanel();
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
 * Sets up the form's context menu and various event handlers to handle widget grouping, 
 * dragging, and selection of multiple widgets.
 */
export function setupFormHandlers() {
    let lastClickTime = 0; // Variable to store the last click time
    const doubleClickThreshold = 200; // Time in milliseconds to consider as a double click

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
    // groupContextMenu.appendChild(groupOption);
    // groupContextMenu.appendChild(unGroupOption);

    // Append context menu to the document body
    // document.body.appendChild(groupContextMenu);

    // Add event listeners for group and ungroup functionality (Currently just logs actions)
    groupOption.addEventListener("click", () => {
        groupContextMenu.style.visibility = "hidden";
        // Implement "Group" functionality here
    });

    unGroupOption.addEventListener("click", () => {
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

                console.log("Cabbage: Context menu triggered, selected elements:", selectedElements.size);

                // Check if we have selected widgets for context menu
                if (selectedElements.size > 0 && cabbageMode === 'draggable') {
                    // Show context menu for selected widgets
                    console.log("Cabbage: Showing context menu for selected widgets");
                    showSelectionContextMenu(e, selectedElements);
                    return;
                }

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
                        console.warn("Cabbage: Adding widget of type:", type);
                        contextMenu.style.visibility = "hidden";

                        // Insert new widget and update the editor
                        const channel = CabbageUtils.getUniqueChannelName(type, widgets);
                        const widget = await WidgetManager.insertWidget(type, { channel, top: mouseDownPosition.y - 20, left: mouseDownPosition.x - 20 }, WidgetManager.getCurrentCsdPath());
                        console.warn(widget);
                        if (widgets) {
                            vscode.postMessage({
                                command: 'widgetUpdate',
                                text: JSON.stringify(CabbageUtils.sanitizeForEditor(widget))
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

        // Add document-level event listener for deselection
        document.addEventListener('pointerdown', (event) => {
            // Only handle deselection if not clicking on a widget, selection box, or context menu
            const clickedElement = event.target.closest('.draggable');
            const isSelectionBox = event.target.closest && event.target.closest('.selection-box');
            const isContextMenu = event.target.closest && event.target.closest('#selection-context-menu');

            if (!clickedElement && !isSelectionBox && !isContextMenu && !event.shiftKey && !event.altKey) {
                console.log("Cabbage: Deselecting all widgets (document click)");
                selectedElements.forEach(element => element.classList.remove('selected'));
                selectedElements.clear();
            }
        });

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

                const clickedElement = event.target.closest('.draggable');
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
                } else if (clickedElement && clickedElement.classList.contains('draggable') && event.target.id !== "MainForm") {
                    // Handle individual widget selection and toggling
                    let elementToSelect = clickedElement;

                    // Check if clicked element is a child widget of a grouped container
                    const parentChannel = clickedElement.getAttribute('data-parent-channel');
                    if (parentChannel) {
                        // This is a child widget - select the parent container instead
                        const parentDiv = document.getElementById(parentChannel);
                        if (parentDiv) {
                            elementToSelect = parentDiv;
                            console.log("Cabbage: Selecting parent container", parentChannel, "instead of child", clickedElement.id);
                        }
                    }

                    if (!event.shiftKey && !event.altKey) {
                        if (!selectedElements.has(elementToSelect)) {
                            selectedElements.forEach(element => element.classList.remove('selected'));
                            selectedElements.clear();
                            selectedElements.add(elementToSelect);
                        }
                        elementToSelect.classList.add('selected');
                    } else {
                        elementToSelect.classList.toggle('selected');
                        if (elementToSelect.classList.contains('selected')) {
                            selectedElements.add(elementToSelect);
                        } else {
                            selectedElements.delete(elementToSelect);
                        }
                    }
                } else {
                    // Deselect all if clicking elsewhere (including MainForm background)
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

/**
 * Shows a context menu for selected widgets with relevant actions
 * @param {MouseEvent} event - The context menu event
 * @param {Set} selectedElements - Set of selected widget elements
 */
function showSelectionContextMenu(event, selectedElements) {
    console.log("Cabbage: Creating context menu for", selectedElements.size, "selected widgets");

    // Remove any existing context menu (defensive)
    const existingMenu = document.getElementById('selection-context-menu');
    if (existingMenu) {
        console.log('Cabbage: Removing lingering selection-context-menu before creating new one');
        existingMenu.remove();
        // Check if still in DOM
        if (document.getElementById('selection-context-menu')) {
            console.log('Cabbage: Menu node still in DOM after remove!');
        }
    }

    // Create context menu
    const contextMenu = document.createElement('div');
    contextMenu.id = 'selection-context-menu';
    contextMenu.style.cssText = `
        position: fixed;
        background: var(--vscode-menu-background);
        color: var(--vscode-menu-foreground);
        border: 1px solid var(--vscode-menu-border);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 180px;
        font-family: var(--vscode-font-family);
        font-size: var(--vscode-font-size);
        padding: 4px 0;
    `;
    console.log('Cabbage: Creating new selection-context-menu');

    const selectedCount = selectedElements.size;
    const menuItems = [];

    if (selectedCount === 1) {
        const selectedId = Array.from(selectedElements)[0].id;
        const selectedWidget = widgets.find(w => w.props.channel === selectedId);

        menuItems.push(
            { text: 'Properties', action: () => showProperties(selectedElements) },
            { text: 'Duplicate', action: () => duplicateWidgets(selectedElements) },
            { text: 'Delete', action: () => deleteWidgets(selectedElements) },
            { text: '---' }
        );

        // Add Ungroup option if the selected widget has children
        if (selectedWidget && selectedWidget.props.children && selectedWidget.props.children.length > 0) {
            menuItems.push(
                { text: 'Ungroup', action: () => ungroupWidgets(selectedElements) }
            );
        }

        menuItems.push(
            { text: 'Bring to Front', action: () => bringToFront(selectedElements) },
            { text: 'Send to Back', action: () => sendToBack(selectedElements) }
        );
    } else {
        menuItems.push(
            { text: `${selectedCount} widgets selected`, disabled: true },
            { text: '---' }
        );

        // Check if there are valid container widgets (groupBox or image) in the selection
        const selectedIds = Array.from(selectedElements).map(el => el.id);
        const hasValidContainer = selectedIds.some(id => {
            const widget = widgets.find(w => w.props.channel === id);
            return widget && (widget.props.type === 'groupBox' || widget.props.type === 'image');
        });

        if (hasValidContainer) {
            menuItems.push(
                { text: 'Group', action: () => groupWidgets(selectedElements) }
            );
        }

        menuItems.push(
            { text: 'Duplicate All', action: () => duplicateWidgets(selectedElements) },
            { text: 'Delete All', action: () => deleteWidgets(selectedElements) },
            { text: '---' },
            { text: 'Align Left', action: () => alignWidgets(selectedElements, 'left') },
            { text: 'Align Right', action: () => alignWidgets(selectedElements, 'right') },
            { text: 'Align Top', action: () => alignWidgets(selectedElements, 'top') },
            { text: 'Align Bottom', action: () => alignWidgets(selectedElements, 'bottom') }
        );
    }

    // Create menu items
    menuItems.forEach(item => {
        if (item.text === '---') {
            const separator = document.createElement('div');
            separator.style.cssText = `
                height: 1px;
                background: var(--vscode-menu-separatorBackground);
                margin: 4px 0;
            `;
            contextMenu.appendChild(separator);
        } else {
            const menuItem = document.createElement('div');
            menuItem.textContent = item.text;
            menuItem.style.cssText = `
                padding: 6px 12px;
                cursor: ${item.disabled ? 'default' : 'pointer'};
                color: ${item.disabled ? 'var(--vscode-disabledForeground)' : 'var(--vscode-menu-foreground)'};
                white-space: nowrap;
            `;

            if (!item.disabled) {
                menuItem.addEventListener('mouseenter', () => {
                    menuItem.style.background = 'var(--vscode-menu-selectionBackground)';
                    menuItem.style.color = 'var(--vscode-menu-selectionForeground)';
                });

                menuItem.addEventListener('mouseleave', () => {
                    menuItem.style.background = 'transparent';
                    menuItem.style.color = 'var(--vscode-menu-foreground)';
                });

                menuItem.addEventListener('click', () => {
                    console.log("Cabbage: Context menu action:", item.text);
                    item.action();
                    contextMenu.remove();
                });
            }

            contextMenu.appendChild(menuItem);
        }
    });

    // Position the menu
    const x = event.clientX;
    const y = event.clientY;

    // Add to document to measure dimensions
    document.body.appendChild(contextMenu);
    console.log('Cabbage: selection-context-menu added to DOM, attaching close listeners');
    // Confirm menu is in DOM
    if (document.getElementById('selection-context-menu')) {
        console.log('Cabbage: Menu node confirmed in DOM after append');
    } else {
        console.log('Cabbage: Menu node NOT in DOM after append!');
    }

    // Adjust position to keep menu in viewport
    const rect = contextMenu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let finalX = x;
    let finalY = y;

    if (x + rect.width > viewportWidth) {
        finalX = viewportWidth - rect.width - 5;
    }

    if (y + rect.height > viewportHeight) {
        finalY = viewportHeight - rect.height - 5;
    }

    contextMenu.style.left = `${finalX}px`;
    contextMenu.style.top = `${finalY}px`;

    // Close menu robustly on any mousedown/click/contextmenu outside
    function closeMenu(e) {
        // Defensive: if menu is gone, remove listeners
        const menu = document.getElementById('selection-context-menu');
        const type = e.type;
        if (!menu) {
            console.log('Cabbage: closeMenu (' + type + ') called but menu not found, removing listeners');
            document.removeEventListener('mousedown', closeMenu, true);
            document.removeEventListener('click', closeMenu, true);
            document.removeEventListener('contextmenu', closeMenu, true);
            return;
        }
        if (menu.contains(e.target)) {
            console.log('Cabbage: closeMenu (' + type + ') event inside menu, not closing');
        } else {
            console.log('Cabbage: closeMenu (' + type + ') event outside menu, closing menu');
            menu.remove();
            // Check if still in DOM
            if (document.getElementById('selection-context-menu')) {
                console.log('Cabbage: Menu node still in DOM after attempted close!');
            } else {
                console.log('Cabbage: Menu node successfully removed from DOM');
            }
            document.removeEventListener('mousedown', closeMenu, true);
            document.removeEventListener('click', closeMenu, true);
            document.removeEventListener('contextmenu', closeMenu, true);
        }
    }
    // Attach listeners in capture phase for reliability, immediately after menu is in DOM
    document.addEventListener('mousedown', closeMenu, true);
    document.addEventListener('click', closeMenu, true);
    document.addEventListener('contextmenu', closeMenu, true);
}

// Context menu action functions
function showProperties(selectedElements) {
    console.log("Cabbage: Show properties for selected widgets");
    // Implementation for showing properties
}

function duplicateWidgets(selectedElements) {
    console.log("Cabbage: Duplicating", selectedElements.size, "widgets");

    // Get the MainForm to determine bounds for positioning
    const form = document.getElementById('MainForm');
    if (!form) {
        console.error("Cabbage: MainForm not found for duplicate positioning");
        return;
    }

    const formWidth = parseInt(form.style.width);
    const formHeight = parseInt(form.style.height);

    // Process each selected widget
    Array.from(selectedElements).forEach(async (element) => {
        const originalChannel = element.id;
        const originalWidget = widgets.find(w => w.props.channel === originalChannel);

        if (!originalWidget) {
            console.error("Cabbage: Original widget not found for channel:", originalChannel);
            return;
        }

        // Create deep copy of widget props
        const newProps = JSON.parse(JSON.stringify(originalWidget.props));

        // Generate unique channel name for the container
        newProps.channel = CabbageUtils.getUniqueChannelName(newProps.type, widgets);
        console.log("Cabbage: Generated new channel:", newProps.channel, "for type:", newProps.type);

        // If this widget has children, duplicate them with new channel names
        if (newProps.children && Array.isArray(newProps.children)) {
            console.log("Cabbage: Duplicating", newProps.children.length, "child widgets for", newProps.channel);

            // Create a mapping of old channel names to new channel names
            const channelMapping = {};

            // Duplicate each child with a new channel name
            newProps.children = newProps.children.map(childProps => {
                const newChildProps = JSON.parse(JSON.stringify(childProps));

                // Generate unique channel name for this child
                const newChildChannel = CabbageUtils.getUniqueChannelName(newChildProps.type, widgets);
                channelMapping[childProps.channel] = newChildChannel;

                newChildProps.channel = newChildChannel;
                console.log("Cabbage: Child channel", childProps.channel, "->", newChildChannel);

                return newChildProps;
            });
        }

        // Calculate new position based on original position and form bounds
        const originalBounds = newProps.bounds || { left: 0, top: 0, width: 100, height: 50 };
        const centerX = originalBounds.left + (originalBounds.width / 2);
        const centerY = originalBounds.top + (originalBounds.height / 2);

        let offsetX = 30; // Default offset
        let offsetY = 30;

        // Ensure bounds object exists
        newProps.bounds = newProps.bounds || {};

        // If original is in top-left quadrant, duplicate to right and down
        if (centerX < formWidth / 2 && centerY < formHeight / 2) {
            // Top-left: duplicate to right and down
            newProps.bounds.left = Math.min(originalBounds.left + offsetX, formWidth - originalBounds.width);
            newProps.bounds.top = Math.min(originalBounds.top + offsetY, formHeight - originalBounds.height);
        } else {
            // Bottom-right or other quadrants: duplicate to left and up
            newProps.bounds.left = Math.max(originalBounds.left - offsetX, 0);
            newProps.bounds.top = Math.max(originalBounds.top - offsetY, 0);
        }

        console.log("Cabbage: Duplicating widget from", originalBounds, "to", newProps.bounds);

        // Insert the new widget
        try {
            const newWidget = await WidgetManager.insertWidget(newProps.type, newProps, originalWidget.props.currentCsdFile);
            console.log("Cabbage: Successfully duplicated widget:", newWidget);

            // Send message to extension to add to CSD file
            if (vscode) {
                vscode.postMessage({
                    command: 'widgetUpdate',
                    text: JSON.stringify(CabbageUtils.sanitizeForEditor(newWidget))
                });
            }
        } catch (error) {
            console.error("Cabbage: Error duplicating widget:", error);
        }
    });
} function deleteWidgets(selectedElements) {
    console.log("Cabbage: Deleting", selectedElements.size, "widgets");
    const selectedIds = Array.from(selectedElements).map(el => el.id);
    console.log("Cabbage: Widget IDs to delete:", selectedIds);

    // Import widgets array and CabbageUtils
    import('./sharedState.js').then(({ widgets }) => {
        import('../cabbage/utils.js').then(({ CabbageUtils }) => {
            selectedIds.forEach(id => {
                // Remove from widgets array
                const idx = widgets.findIndex(w => w.props.channel === id);
                if (idx !== -1) {
                    widgets.splice(idx, 1);
                    console.log('Cabbage: Removed widget from widgets array:', id);
                }
                // Remove from DOM
                const div = CabbageUtils.getWidgetDiv(id);
                if (div && div.parentElement) {
                    div.parentElement.removeChild(div);
                    console.log('Cabbage: Removed widget div from DOM:', id);
                }
            });

            // Clear selection after deletion
            selectedElements.clear();

            // Send message to extension to remove from CSD file
            if (vscode) {
                selectedIds.forEach(id => {
                    vscode.postMessage({
                        command: 'removeWidget',
                        channel: id
                    });
                });
            }
        });
    });
} function groupWidgets(selectedElements) {
    console.log("Cabbage: Grouping", selectedElements.size, "widgets");
    const selectedIds = Array.from(selectedElements).map(el => el.id);

    if (selectedElements.size < 2) {
        return;
    }

    // Get all selected widgets
    const selectedWidgets = [];
    selectedIds.forEach(id => {
        const widget = widgets.find(w => w.props.channel === id);
        if (widget) {
            selectedWidgets.push(widget);
        }
    });

    // Find the first groupBox or image widget to use as container
    const containerWidget = selectedWidgets.find(w =>
        w.props.type === 'groupBox' || w.props.type === 'image'
    );

    if (!containerWidget) {
        console.error("Cabbage: No groupBox or image widget found in selection to use as container");
        alert("Grouping requires at least one groupBox or image widget to be selected as the container.");
        return;
    }

    console.log("Cabbage: Using", containerWidget.props.channel, "as container");

    // Initialize children array if it doesn't exist
    containerWidget.props.children = containerWidget.props.children || [];

    // Store the container's base bounds at grouping time so resizing uses a stable reference
    if (!containerWidget.props.groupBaseBounds) {
        containerWidget.props.groupBaseBounds = {
            width: containerWidget.props.bounds.width,
            height: containerWidget.props.bounds.height
        };
    }

    // Get child widgets (all selected widgets except the container)
    const childWidgets = selectedWidgets.filter(w => w !== containerWidget);

    // Convert absolute positions to relative positions within container
    childWidgets.forEach(childWidget => {
        const childBounds = childWidget.props.bounds;
        const containerBounds = containerWidget.props.bounds;

        // Calculate relative position
        const relativeLeft = childBounds.left - containerBounds.left;
        const relativeTop = childBounds.top - containerBounds.top;

        // Create child object by copying the widget props as they appear in the CSD file
        const childData = JSON.parse(JSON.stringify(childWidget.originalProps || childWidget.props));

        // Update bounds to be relative to the container
        childData.bounds = {
            left: relativeLeft,
            top: relativeTop,
            width: childBounds.width,
            height: childBounds.height
        };

        // Save a copy of the original relative bounds (no underscore) so resizing uses this as the base
        // This prevents compounded scaling when the parent is resized multiple times
        childData.origBounds = {
            left: relativeLeft,
            top: relativeTop,
            width: childBounds.width,
            height: childBounds.height
        };

        // Add to container's children array
        containerWidget.props.children.push(childData);

        // Remove from main widgets array
        const widgetIndex = widgets.findIndex(w => w.props.channel === childWidget.props.channel);
        if (widgetIndex !== -1) {
            widgets.splice(widgetIndex, 1);
            console.log("Cabbage: Moved", childWidget.props.channel, "into", containerWidget.props.channel, "children");
        }

        // Remove from DOM
        const childDiv = CabbageUtils.getWidgetDiv(childWidget.props.channel);
        if (childDiv && childDiv.parentElement) {
            childDiv.parentElement.removeChild(childDiv);
            console.log("Cabbage: Removed", childWidget.props.channel, "from DOM");
        }
    });

    // Clear selection
    selectedElements.clear();

    // Select the container widget
    const containerDiv = CabbageUtils.getWidgetDiv(containerWidget.props.channel);
    if (containerDiv) {
        containerDiv.classList.add('selected');
        selectedElements.add(containerDiv);
    }

    // Update container in DOM
    updateGroupedWidgetDisplay(containerWidget);

    // Send remove messages for each child first
    if (childWidgets.length > 0) {
        vscode.postMessage({
            command: 'removeWidgets',
            channels: childWidgets.map(child => child.props.channel)
        });
    }

    // Send update to extension for the container
    vscode.postMessage({
        command: 'widgetUpdate',
        text: JSON.stringify(CabbageUtils.sanitizeForEditor(containerWidget))
    });
}

// Helper function to update how grouped widgets are displayed
function updateGroupedWidgetDisplay(containerWidget) {
    const containerDiv = CabbageUtils.getWidgetDiv(containerWidget.props.channel);
    if (!containerDiv) return;

    // Instead of re-rendering innerHTML (which can break interact.js), 
    // modify the existing SVG to have transparent background
    if (containerWidget.props.children && containerWidget.props.children.length > 0) {
        // Find the SVG element and make its background transparent
        const svgElement = containerDiv.querySelector('svg');
        if (svgElement) {
            // Find the background rect and make it transparent
            const bgRect = svgElement.querySelector('rect[fill]');
            if (bgRect && bgRect.getAttribute('fill') !== 'transparent') {
                bgRect.setAttribute('fill', 'transparent');
                console.log("Cabbage: Made container background transparent for", containerWidget.props.channel);
            }
        }
    }

    // Insert child widgets
    WidgetManager.insertChildWidgets(containerWidget, containerDiv);

    console.log("Cabbage: Updated display for grouped widget", containerWidget.props.channel, "with", containerWidget.props.children.length, "children");
}

function ungroupWidgets(selectedElements) {
    console.log("Cabbage: Ungrouping widgets");
    const selectedIds = Array.from(selectedElements).map(el => el.id);

    if (selectedElements.size !== 1) {
        console.log("Cabbage: Can only ungroup one container at a time");
        return;
    }

    const containerId = selectedIds[0];
    const containerWidget = widgets.find(w => w.props.channel === containerId);

    if (!containerWidget || !containerWidget.props.children || containerWidget.props.children.length === 0) {
        console.log("Cabbage: Selected widget has no children to ungroup");
        return;
    }

    console.log("Cabbage: Ungrouping", containerWidget.props.children.length, "widgets from", containerWidget.props.channel);

    // Store children before clearing
    const childrenToUngroup = [...containerWidget.props.children];

    // Process each child widget
    childrenToUngroup.forEach(childProps => {
        // Convert relative positions back to absolute positions
        const absoluteBounds = {
            left: containerWidget.props.bounds.left + childProps.bounds.left,
            top: containerWidget.props.bounds.top + childProps.bounds.top,
            width: childProps.bounds.width,
            height: childProps.bounds.height
        };

        // Create a new widget object for the child
        const childWidgetProps = {
            ...childProps,
            bounds: absoluteBounds,
            currentCsdFile: containerWidget.props.currentCsdFile
        };

        // Add child back to main widgets array
        const childWidget = WidgetManager.createWidget(childProps.type);
        if (childWidget) {
            Object.assign(childWidget.props, childWidgetProps);
            widgets.push(childWidget);
            childWidget.parameterIndex = CabbageUtils.getNumberOfPluginParameters(widgets) - 1;
            console.log("Cabbage: Added", childProps.channel, "back to widgets array");

            // Make child widget selectable again
            const childDiv = document.getElementById(childProps.channel);
            if (childDiv) {
                childDiv.className = cabbageMode; // Restore draggable class
                childDiv.style.pointerEvents = 'auto'; // Re-enable pointer events
                childDiv.removeAttribute('data-parent-channel'); // Remove parent reference

                // Re-add event listeners for draggable mode
                if (cabbageMode === 'draggable') {
                    childDiv.addEventListener('pointerdown', (e) => handlePointerDown(e, childDiv));
                }
            }
        }
    });

    // Clear the container's children array
    containerWidget.props.children = [];

    // Update container display (make background opaque again)
    const containerDiv = CabbageUtils.getWidgetDiv(containerWidget.props.channel);
    if (containerDiv) {
        const svgElement = containerDiv.querySelector('svg');
        if (svgElement) {
            const bgRect = svgElement.querySelector('rect[fill]');
            if (bgRect && bgRect.getAttribute('fill') === 'transparent') {
                // Restore original background color (you might need to get this from widget props)
                bgRect.setAttribute('fill', containerWidget.props.color || '#ffffff');
                console.log("Cabbage: Restored container background for", containerWidget.props.channel);
            }
        }
    }

    // Clear selection
    selectedElements.clear();

    // Send messages to add child widgets back to CSD file
    if (vscode) {
        childrenToUngroup.forEach(child => {
            vscode.postMessage({
                command: 'addWidget',
                widget: child
            });
        });
    }

    console.log("Cabbage: Ungrouped widgets from", containerWidget.props.channel);
}

function bringToFront(selectedElements) {
    console.log("Cabbage: Bringing widgets to front");
    const selectedIds = Array.from(selectedElements).map(el => el.id);

    if (vscode) {
        vscode.postMessage({
            command: 'bringToFront',
            widgetIds: selectedIds
        });
    }
}

function sendToBack(selectedElements) {
    console.log("Cabbage: Sending widgets to back");
    const selectedIds = Array.from(selectedElements).map(el => el.id);

    if (vscode) {
        vscode.postMessage({
            command: 'sendToBack',
            widgetIds: selectedIds
        });
    }
}

function alignWidgets(selectedElements, alignment) {
    console.log("Cabbage: Aligning", selectedElements.size, "widgets to", alignment);
    const selectedIds = Array.from(selectedElements).map(el => el.id);

    if (selectedElements.size < 2) {
        console.log("Cabbage: Need at least 2 widgets to align");
        return;
    }

    // Get all selected widgets
    const selectedWidgets = [];
    selectedIds.forEach(id => {
        const widget = widgets.find(w => w.props.channel === id);
        if (widget && widget.props.bounds) {
            selectedWidgets.push(widget);
        }
    });

    if (selectedWidgets.length < 2) {
        console.log("Cabbage: Not enough valid widgets found to align");
        return;
    }

    let referenceValue;

    switch (alignment) {
        case 'left':
            // Align to the leftmost widget's left position
            referenceValue = Math.min(...selectedWidgets.map(w => w.props.bounds.left));
            console.log("Cabbage: Aligning to left:", referenceValue);
            selectedWidgets.forEach(widget => {
                widget.props.bounds.left = referenceValue;
                updateWidgetPosition(widget);
            });
            break;

        case 'right':
            // Align to the rightmost widget's right edge
            const maxRight = Math.max(...selectedWidgets.map(w => w.props.bounds.left + w.props.bounds.width));
            console.log("Cabbage: Aligning to right edge:", maxRight);
            selectedWidgets.forEach(widget => {
                widget.props.bounds.left = maxRight - widget.props.bounds.width;
                updateWidgetPosition(widget);
            });
            break;

        case 'top':
            // Align to the topmost widget's top position
            referenceValue = Math.min(...selectedWidgets.map(w => w.props.bounds.top));
            console.log("Cabbage: Aligning to top:", referenceValue);
            selectedWidgets.forEach(widget => {
                widget.props.bounds.top = referenceValue;
                updateWidgetPosition(widget);
            });
            break;

        case 'bottom':
            // Align to the bottommost widget's bottom edge
            const maxBottom = Math.max(...selectedWidgets.map(w => w.props.bounds.top + w.props.bounds.height));
            console.log("Cabbage: Aligning to bottom edge:", maxBottom);
            selectedWidgets.forEach(widget => {
                widget.props.bounds.top = maxBottom - widget.props.bounds.height;
                updateWidgetPosition(widget);
            });
            break;

        default:
            console.error("Cabbage: Unknown alignment:", alignment);
            return;
    }

    // Send messages to extension to update CSD file
    if (vscode) {
        selectedWidgets.forEach(widget => {
            vscode.postMessage({
                command: 'widgetUpdate',
                text: JSON.stringify(CabbageUtils.sanitizeForEditor(widget))
            });
        });
    }
}

// Helper function to update widget position in DOM
function updateWidgetPosition(widget) {
    const widgetDiv = CabbageUtils.getWidgetDiv(widget.props.channel);
    if (widgetDiv && widget.props.bounds) {
        if (vscode) {
            widgetDiv.style.transform = `translate(${widget.props.bounds.left}px, ${widget.props.bounds.top}px)`;
        }
        widgetDiv.setAttribute('data-x', widget.props.bounds.left);
        widgetDiv.setAttribute('data-y', widget.props.bounds.top);
        console.log("Cabbage: Updated position for", widget.props.channel, "to", widget.props.bounds);
    }
}