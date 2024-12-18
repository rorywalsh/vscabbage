// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

// At the beginning of the file
let interactPromise;

/**
 * Initializes the interact.js library by loading the specified script.
 * @param {string} interactJSUri - The URI of the interact.js script.
 */
export function initializeInteract(interactJSUri) {
    console.log("Initializing interact", interactJSUri);
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
        this.dragEndListener = this.dragEndListener.bind(this); // Bind the drag end listener
        this.widgets = widgets; // All widgets in the UI
        this.vscode = vscode; // VSCode API for messaging

        // Wait for interact to load before applying the configuration
        interactPromise.then(() => {
            this.applyInteractConfig({
                restriction: 'parent',
                endOnly: true
            });
        }).catch(error => {
            console.error("Failed to load interact.min.js:", error);
        });

        this.applyInteractConfig(restrictions); // Apply the initial interact configuration
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
        });
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
            this.updatePanelCallback(this.vscode, {
                eventType: "move", // Event type for movement
                name: element.id, // Name of the element moved
                bounds: { x: x, y: y, w: -1, h: -1 } // Bounds of the element
            }, this.widgets);

            console.warn(`Drag ended for element ${element.id}: x=${x}, y=${y}`); // Logging drag end details
        });
    }

    /**
     * Applies interact.js configuration to the draggable elements.
     * @param {Object} restrictions - The restrictions for movement.
     */
    applyInteractConfig(restrictions) {
        interact('.draggable').unset(); // Unset previous interact configuration

        interact('.draggable').on('down', (event) => {
            // Handle the down event if necessary (currently commented out)
            if (this.selectedElements.size <= 1) {
                // Uncomment if you need to handle click events
                // if (event.target.id) {
                //     this.updatePanelCallback(this.vscode, { eventType: "click", name: event.target.id, bounds: {} }, this.widgets);
                // } else {
                //     const widgetId = event.target.parentElement.parentElement.id.replace(/(<([^>]+)>)/ig, '');
                //     this.updatePanelCallback(this.vscode, { eventType: "click", name: widgetId, bounds: {} }, this.widgets);
                // }
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
     * Sets the snap size for grid snapping.
     * @param {number} size - The new snap size.
     */
    setSnapSize(size) {
        this.snapSize = size; // Update snap size
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
