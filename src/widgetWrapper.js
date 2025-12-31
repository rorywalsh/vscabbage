// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

import { CabbageUtils } from './cabbage/utils.js';
import { getCabbageMode } from './cabbage/sharedState.js';
import { widgetClipboard } from './widgetClipboard.js';

// At the beginning of the file
let interactPromise;

/**
 * Initializes the interact.js library by loading the specified script.
 * @param {string} interactJSUri - The URI of the interact.js script.
 */
export function initializeInteract(interactJSUri) {
    interactPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = interactJSUri; // Set the source of the script
        script.onload = resolve; // Resolve promise when the script loads
        script.onerror = reject; // Reject promise on error
        document.head.appendChild(script); // Append script to the document head
    });
}

/**
 * This class wraps all widgets and provides drag-and-drop functionality for the UI designer.
 */
export class WidgetWrapper {
    constructor(updatePanelCallback, selectedSet, widgets, vscode) {
        const restrictions = {
            restriction: 'parent', // Restrict movements to the parent container
            endOnly: true // Only restrict at the end of the movement
        };
        this.snapSize = 2; // Snap grid size
        this.selectedElements = selectedSet; // Selected elements for dragging
        this.updatePanelCallback = updatePanelCallback; // Callback to update the panel
        this.dragMoveListener = this.dragMoveListener.bind(this); // Bind the drag move listener
        this.dragEndListener = this.dragEndListener.bind(this); // 
        // Bind the drag end listener
        this.widgets = widgets; // All widgets in the UI
        this.vscode = vscode; // VSCode API for messaging

        // Add global event listeners for context menu handling
        this.setupGlobalEventListeners();

        // Wait for interact to load before applying the configuration
        interactPromise.then(() => {
            this.applyInteractConfig({
                restriction: 'parent',
                endOnly: true
            });
        }).catch(error => {
            console.error("Cabbage: Failed to load interact.min.js:", error);
        });

        this.applyInteractConfig(restrictions); // Apply the initial interact configuration
    }

    /**
     * Sets up global event listeners for context menu handling.
     */
    setupGlobalEventListeners() {
        // Store mouse position for context menu positioning
        let mousePosition = { x: 0, y: 0 };

        // Track mouse position
        document.addEventListener('mousemove', (event) => {
            mousePosition.x = event.clientX;
            mousePosition.y = event.clientY;
        });

        // Context menu is handled by eventHandlers.js

        // Handle mouse down to prevent dragging when right-clicking on selected elements
        document.addEventListener('mousedown', (event) => {
            // Context menu hiding is handled by eventHandlers.js
        });

        // Re-enable dragging when Alt is released (keep for other functionality)
        document.addEventListener('keyup', (event) => {
            if (event.key === 'Alt') {
                document.querySelectorAll('[data-alt-pressed]').forEach(element => {
                    element.removeAttribute('data-alt-pressed');
                });
            }
        });

        // Hide context menu when clicking elsewhere - handled by eventHandlers.js
        document.addEventListener('click', () => {
            // Context menu hiding is handled by eventHandlers.js
        });
    }



    /**
     * Context menu action: Copy selected widgets
     */
    copySelectedWidgets() {
        const selectedIds = Array.from(this.selectedElements).map(el => el.id);
        console.log('Cabbage: Copy selected widgets:', selectedIds);

        // Get widget properties for selected widgets
        const widgetProps = [];
        selectedIds.forEach(id => {
            const widget = this.widgets.find(w => CabbageUtils.getChannelId(w.props, 0) === id);
            if (widget) {
                widgetProps.push(widget.props);
            }
        });

        // Store in clipboard
        widgetClipboard.copy(widgetProps);
        console.log(`Cabbage: Copied ${widgetProps.length} widget(s) to clipboard`);
    }

    /**
     * Context menu action: Paste widgets from clipboard
     */
    pasteSelectedWidgets() {
        console.log('Cabbage: Paste widgets from clipboard');

        if (!widgetClipboard.hasData()) {
            console.warn('Cabbage: No widgets in clipboard to paste');
            return;
        }

        // Prepare widgets for pasting (with unique IDs and offset positions)
        const pastedWidgets = widgetClipboard.prepareForPaste(this.widgets, 20, 20);

        // Send paste event to backend
        this.updatePanelCallback(this.vscode, {
            eventType: "pasteSelection",
            widgets: pastedWidgets,
            bounds: {}
        }, this.widgets);
    }

    /**
     * Context menu action: Delete selected widgets
     */
    deleteSelectedWidgets() {
        const selectedIds = Array.from(this.selectedElements).map(el => el.id);
        console.log('Cabbage: Delete selected widgets:', selectedIds);
        // Implement delete functionality here
        this.updatePanelCallback(this.vscode, {
            eventType: "deleteSelection",
            selection: selectedIds,
            bounds: {}
        }, this.widgets);
    }

    /**
     * Context menu action: Group selected widgets
     */
    groupSelectedWidgets() {
        const selectedIds = Array.from(this.selectedElements).map(el => el.id);
        console.log('Cabbage: Group selected widgets:', selectedIds);
        // Implement group functionality here
        this.updatePanelCallback(this.vscode, {
            eventType: "groupSelection",
            selection: selectedIds,
            bounds: {}
        }, this.widgets);
    }

    /**
     * Context menu action: Align selected widgets
     */
    alignSelectedWidgets(alignment) {
        const selectedIds = Array.from(this.selectedElements).map(el => el.id);
        console.log(`Cabbage: Align selected widgets ${alignment}:`, selectedIds);
        // Implement alignment functionality here
        this.updatePanelCallback(this.vscode, {
            eventType: "alignSelection",
            selection: selectedIds,
            alignment: alignment,
            bounds: {}
        }, this.widgets);
    }

    /**
     * Context menu action: Distribute selected widgets
     */
    distributeSelectedWidgets(direction) {
        const selectedIds = Array.from(this.selectedElements).map(el => el.id);
        console.log(`Cabbage: Distribute selected widgets ${direction}:`, selectedIds);
        // Implement distribution functionality here
        this.updatePanelCallback(this.vscode, {
            eventType: "distributeSelection",
            selection: selectedIds,
            direction: direction,
            bounds: {}
        }, this.widgets);
    }

    /**
     * Context menu action: Copy widget (legacy - keeping for single widget operations)
     */
    copyWidget(element) {
        console.log('Cabbage: Copy widget:', element.id);
        // Implement copy functionality here
    }

    /**
     * Context menu action: Delete widget (legacy - now calls delete selection for single items)
     */
    deleteWidget(element) {
        console.log('Cabbage: Delete widget:', element.id);
        // Use the selection-based delete method
        this.deleteSelectedWidgets();
    }

    /**
     * Context menu action: Duplicate widget
     */
    duplicateWidget(element) {
        console.log('Cabbage: Duplicate widget:', element.id);
        // Implement duplicate functionality here
    }

    /**
     * Context menu action: Bring to front
     */
    bringToFront(element) {
        console.log('Cabbage: Bring to front:', element.id);
        element.style.zIndex = '10000';
    }

    /**
     * Context menu action: Send to back
     */
    sendToBack(element) {
        console.log('Cabbage: Send to back:', element.id);
        element.style.zIndex = '1';
    }

    /**
     * Handles the drag movement of selected elements.
     * @param {Object} event - The event object containing drag data.
     */
    dragMoveListener(event) {
        // Ignore if Shift or Alt keys are pressed
        if (event.shiftKey || event.altKey) {
            return;
        }
        const { dx, dy } = event; // Get the change in position
        this.selectedElements.forEach(element => {
            // Slow down the movement by using a fraction of dx and dy
            const slowFactor = 0.5; // Adjust this value to change the drag speed
            const x = (parseFloat(element.getAttribute('data-x')) || 0) + dx * slowFactor;
            const y = (parseFloat(element.getAttribute('data-y')) || 0) + dy * slowFactor;

            element.style.transform = `translate(${x}px, ${y}px)`; // Apply the translation
            element.setAttribute('data-x', x); // Update data-x attribute
            element.setAttribute('data-y', y); // Update data-y attribute

            // If this element has children (grouped widgets), move them too
            this.moveChildWidgets(element, dx * slowFactor, dy * slowFactor);
        });
        
        // NOTE: We don't update the code editor during drag movement to avoid
        // creating excessive undo history entries. Updates happen only on dragend.
    }

    /**
     * Handles the end of a drag event.
     * @param {Object} event - The event object containing drag data.
     */
    dragEndListener(event) {
        const { dx, dy } = event;

        this.selectedElements.forEach(element => {
            const x = (parseFloat(element.getAttribute('data-x')) || 0) + dx;
            const y = (parseFloat(element.getAttribute('data-y')) || 0) + dy;

            element.style.transform = `translate(${x}px, ${y}px)`; // Apply the translation
            element.setAttribute('data-x', x); // Update data-x attribute
            element.setAttribute('data-y', y); // Update data-y attribute

            // If this element has children (grouped widgets), move them too
            this.moveChildWidgets(element, dx, dy);

            this.updatePanelCallback(this.vscode, {
                eventType: "move", // Event type for movement
                name: element.id, // Name of the element moved
                bounds: { x: x, y: y, w: -1, h: -1 } // Bounds of the element
            }, this.widgets);

            console.warn(`Cabbage: Drag ended for element ${element.id}: x=${x}, y=${y}`); // Logging drag end details
        });
    }

    /**
     * Moves child widgets when their parent container is moved
     * @param {HTMLElement} parentElement - The parent container element
     * @param {number} deltaX - The change in X position
     * @param {number} deltaY - The change in Y position
     */
    moveChildWidgets(parentElement, deltaX, deltaY) {
        // Find the parent widget in the widgets array using the new channel schema
        const parentWidget = this.widgets.find(w => {
            const channelId = CabbageUtils.getChannelId(w.props, 0);
            return channelId === parentElement.id;
        });
        if (!parentWidget || !parentWidget.props.children) {
            return;
        }

        // Move each child widget
        parentWidget.props.children.forEach(childProps => {
            const childChannelId = CabbageUtils.getWidgetDivId(childProps);
            const childElement = document.getElementById(childChannelId);
            if (childElement) {
                const childX = (parseFloat(childElement.getAttribute('data-x')) || 0) + deltaX;
                const childY = (parseFloat(childElement.getAttribute('data-y')) || 0) + deltaY;

                childElement.style.transform = `translate(${childX}px, ${childY}px)`;
                childElement.setAttribute('data-x', childX);
                childElement.setAttribute('data-y', childY);

                console.log(`Cabbage: Moved child ${childChannelId} with parent ${parentElement.id}`);
            }
        });
    }

    /**
     * Applies interact.js configuration to the draggable elements.
     * @param {Object} restrictions - The restrictions for movement.
     */
    applyInteractConfig(restrictions) {

        interact('.draggable').on('down', (event) => {
            // Handle widget selection on click
            let widgetId = null;

            // Try to find the widget ID by traversing up the DOM tree
            let element = event.target;
            while (element && element !== document.body) {
                if (element.id && element.classList.contains('draggable')) {
                    widgetId = element.id;
                    break;
                }
                element = element.parentElement;
            }


            if (widgetId) {
                // Collect all selected widget IDs for multi-widget editing
                const selectedIds = Array.from(this.selectedElements).map(el => el.id);
                this.updatePanelCallback(this.vscode, {
                    eventType: "click",
                    name: widgetId,
                    selection: selectedIds.length > 0 ? selectedIds : [widgetId],
                    bounds: {}
                }, this.widgets);
            }
        }).resizable({
            edges: { left: false, right: true, bottom: true, top: false }, // Resize edges configuration
            listeners: {
                move: (event) => {
                    // Ignore if Shift or Alt keys are pressed
                    if (event.shiftKey || event.altKey) {
                        return;
                    }
                    const target = event.target;
                    restrictions.restriction = (target.id === 'MainForm' ? 'none' : 'parent'); // Set restriction based on target

                    let x = (parseFloat(target.getAttribute('data-x')) || 0);
                    let y = (parseFloat(target.getAttribute('data-y')) || 0);

                    target.style.width = event.rect.width + 'px'; // Update element width
                    target.style.height = event.rect.height + 'px'; // Update element height

                    x += event.deltaRect.left; // Adjust x position
                    y += event.deltaRect.top; // Adjust y position

                    // If this element has children (grouped widgets), resize them too
                    this.resizeChildWidgets(target, event.rect.width, event.rect.height);

                    // NOTE: We don't update the code editor during resize to avoid
                    // creating excessive undo history entries. Updates happen only on resize end.

                    target.style.transform = `translate(${x}px, ${y}px)`; // Apply the translation
                    target.setAttribute('data-x', x); // Update data-x attribute
                    target.setAttribute('data-y', y); // Update data-y attribute
                },
                end: (event) => {
                    // Update code editor only at the end of resize
                    const target = event.target;
                    let x = (parseFloat(target.getAttribute('data-x')) || 0);
                    let y = (parseFloat(target.getAttribute('data-y')) || 0);

                    this.updatePanelCallback(this.vscode, {
                        eventType: "resize", // Event type for resizing
                        name: event.target.id, // Name of the resized element
                        bounds: { x: x, y: y, w: event.rect.width, h: event.rect.height } // Updated bounds
                    }, this.widgets);

                    console.log(`Cabbage: Resize ended for element ${target.id}: w=${event.rect.width}, h=${event.rect.height}`);
                }
            },
            modifiers: [
                interact.modifiers.restrictRect(restrictions), // Apply restrictions to movement
                interact.modifiers.snap({ // Snap to grid
                    targets: [
                        interact.snappers.grid({ x: this.snapSize, y: this.snapSize }) // Grid size
                    ],
                    range: Infinity, // Snap range
                    relativePoints: [{ x: 0, y: 0 }] // Snap relative point
                }),
            ],
            inertia: true // Enable inertia for smoother dragging
        }).draggable({
            startThreshold: 1, // Threshold for starting drag
            listeners: {
                start: (event) => {
                    // Context: Starting drag operation
                },
                move: this.dragMoveListener, // Handle drag move
                end: this.dragEndListener // Handle drag end
            },
            inertia: true, // Enable inertia for dragging
            modifiers: [
                interact.modifiers.snap({ // Snap to grid for dragging
                    targets: [
                        interact.snappers.grid({ x: this.snapSize, y: this.snapSize }) // Grid size
                    ],
                    range: Infinity, // Snap range
                    relativePoints: [{ x: 0, y: 0 }] // Snap relative point
                }),
                interact.modifiers.restrictRect(restrictions), // Apply restrictions to movement
            ]
        });

        // Main form specific configuration
        interact('.resizeOnly').on('down', (event) => {
            // Handle the down event for resize-only elements if necessary
        }).draggable(false).resizable({
            edges: { left: true, right: true, bottom: true, top: true }, // Enable resizing from all edges
            listeners: {
                move: (event) => {
                    // Only allow resizing in draggable/edit mode
                    if (getCabbageMode() !== 'draggable') {
                        return;
                    }

                    // Ignore if Shift or Alt keys are pressed
                    if (event.shiftKey || event.altKey) {
                        return;
                    }
                    const target = event.target;
                    restrictions.restriction = (target.id === 'MainForm' ? 'none' : 'parent'); // Set restriction based on target

                    let x = (parseFloat(target.getAttribute('data-x')) || 0);
                    let y = (parseFloat(target.getAttribute('data-y')) || 0);

                    target.style.width = event.rect.width + 'px'; // Update element width
                    target.style.height = event.rect.height + 'px'; // Update element height

                    x += event.deltaRect.left; // Adjust x position
                    y += event.deltaRect.top; // Adjust y position

                    this.updatePanelCallback(this.vscode, {
                        eventType: "resize", // Event type for resizing
                        name: event.target.id, // Name of the resized element
                        bounds: { x: x, y: y, w: event.rect.width, h: event.rect.height } // Updated bounds
                    }, this.widgets);

                    target.style.transform = `translate(${x}px, ${y}px)`; // Apply the translation
                    target.setAttribute('data-x', x); // Update data-x attribute
                    target.setAttribute('data-y', y); // Update data-y attribute
                }
            },
            inertia: true // Enable inertia for resizing
        });
    }

    /**
     * Resizes child widgets when their parent container is resized
     * @param {HTMLElement} parentElement - The parent container element
     * @param {number} newWidth - The new width of the parent
     * @param {number} newHeight - The new height of the parent
     */
    resizeChildWidgets(parentElement, newWidth, newHeight) {
        // Find the parent widget in the widgets array using the new channel schema
        const parentWidget = this.widgets.find(w => {
            const channelId = CabbageUtils.getChannelId(w.props, 0);
            return channelId === parentElement.id;
        });
        if (!parentWidget || !parentWidget.props.children) {
            return;
        }

        const oldWidth = parentWidget.props.bounds.width;
        const oldHeight = parentWidget.props.bounds.height;

        // Use the grouping-time base bounds if available so scaling always uses a stable reference
        const groupBase = parentWidget.props.groupBaseBounds || { width: oldWidth, height: oldHeight };

        // Calculate scale factors relative to the group's base size
        const scaleX = newWidth / groupBase.width;
        const scaleY = newHeight / groupBase.height;

        console.log(`Cabbage: Resizing children of ${parentElement.id} by scale ${scaleX}, ${scaleY} (group base ${groupBase.width}x${groupBase.height})`);

        // Update each child widget using original relative bounds when available
        parentWidget.props.children.forEach(childProps => {
            const childChannelId = CabbageUtils.getWidgetDivId(childProps);
            const childElement = document.getElementById(childChannelId);
            if (childElement) {
                // Prefer stored original bounds (created at grouping time) to avoid compounded scaling
                const base = childProps.origBounds || childProps.bounds;

                // Compute new relative bounds from the base/original values
                const newChildWidth = base.width * scaleX;
                const newChildHeight = base.height * scaleY;
                const newChildX = base.left * scaleX;
                const newChildY = base.top * scaleY;

                // Update the child's absolute position (relative to parent + parent's position)
                const parentX = parseFloat(parentElement.getAttribute('data-x')) || 0;
                const parentY = parseFloat(parentElement.getAttribute('data-y')) || 0;

                const absoluteX = parentX + newChildX;
                const absoluteY = parentY + newChildY;

                // Update DOM
                childElement.style.width = newChildWidth + 'px';
                childElement.style.height = newChildHeight + 'px';
                childElement.style.transform = `translate(${absoluteX}px, ${absoluteY}px)`;
                childElement.setAttribute('data-x', absoluteX);
                childElement.setAttribute('data-y', absoluteY);

                // Update the relative bounds in the parent's children array (so next save uses latest)
                childProps.bounds.width = newChildWidth;
                childProps.bounds.height = newChildHeight;
                childProps.bounds.left = newChildX;
                childProps.bounds.top = newChildY;

                console.log(`Cabbage: Resized child ${childChannelId} to ${newChildWidth}x${newChildHeight} at ${newChildX},${newChildY}`);
            }
        });

        // Update parent's bounds
        parentWidget.props.bounds.width = newWidth;
        parentWidget.props.bounds.height = newHeight;
    }

    /**
     * Sets the snap size for grid snapping.
     * @param {number} size - The new snap size.
     */
    setSnapSize(size) {
        this.applyInteractConfig({
            restriction: 'parent', // Apply parent restriction
            endOnly: true // Only restrict at the end of the movement
        });
    }
}

/**
 * This is a simple panel that the main form sits on. 
 * It can be dragged around without restriction.
 */
interact('.draggablePanel')
    .draggable({
        inertia: true, // Enable inertia for dragging
        autoScroll: true, // Enable auto scrolling during drag
        onmove: formDragMoveListener // Handle drag movement
    });

/**
 * Handles the movement of the draggable panel.
 * @param {Object} event - The event object containing drag data.
 */
function formDragMoveListener(event) {
    var target = event.target;
    // Ignore if Shift or Alt keys are pressed
    if (event.shiftKey || event.altKey) {
        return;
    }
    // Keep the dragged position in the data-x/data-y attributes
    var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx; // Update x position
    var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy; // Update y position

    // Translate the element
    target.style.webkitTransform =
        target.style.transform =
        `translate(${x}px, ${y}px)`; // Apply the translation

    // Update the position attributes
    target.setAttribute('data-x', x); // Update data-x attribute
    target.setAttribute('data-y', y); // Update data-y attribute
}