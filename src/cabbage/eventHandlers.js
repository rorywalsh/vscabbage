
// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

console.log("Cabbage: loading eventHandlers.js");

// Imports variables from the sharedState.js file
// - cabbageMode: Determines if widgets are draggable.
// - vscode: Reference to the VSCode API, null in plugin mode.
// - widgets: Array holding all the widgets in the current form.
import { cabbageMode, vscode, widgets, postMessageToVSCode } from "./sharedState.js";

// Imports utility and property panel modules
import { CabbageUtils, CabbageColours } from "../cabbage/utils.js";
import { widgetClipboard } from "../widgetClipboard.js";

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
    try {
        const foundId = CabbageUtils.findValidId(e);
        console.log('Cabbage: handlePointerDown - cabbageMode:', cabbageMode, 'PropertyPanel loaded?', !!PropertyPanel, 'foundId:', foundId, 'widgetDiv.id:', widgetDiv?.id);
        if (PropertyPanel && cabbageMode === 'draggable') {
            const PP = await loadPropertyPanel();
            if (PP && typeof PP.updatePanel === 'function') {
                // Collect all selected widget IDs for multi-widget editing
                const selectedIds = Array.from(selectedElements).map(el => el.id);
                await PP.updatePanel(vscode, {
                    eventType: "click",
                    name: foundId,
                    selection: selectedIds.length > 0 ? selectedIds : [foundId],
                    bounds: {}
                }, widgets);
            } else {
                console.error("PropertyPanel.updatePanel is not available");
            }
        }
    } catch (error) {
        console.error("Error while using PropertyPanel in handlePointerDown:", error);
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
    // Do not allow grouping while in play/performance mode
    if (cabbageMode === 'play') {
        console.warn('Cabbage: groupSelectedWidgets prevented while in play mode');
        return;
    }
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

        // Insert the new container widget. insertWidget currently returns
        // the widget props; the actual widget instance is pushed into the
        // shared `widgets` array. Find the instance there so we can access
        // its `originalProps` reliably (guard against undefined).
        await WidgetManager.insertWidget("groupBox", containerProps, WidgetManager.getCurrentCsdPath());
        // Attempt to locate the newly inserted widget instance
        const createdContainer = widgets.find(w => w.props && (w.props.id === containerId || (w.props.channels && w.props.channels[0] && w.props.channels[0].id === containerId)));
        // Prefer sending the minimized `originalProps` (deltas) so the
        // extension can deep-merge defaults. However, ensure essential
        // identity fields are present (id, type, channels) so the
        // persisted JSON isn't missing identifying information.
        const containerPayload = (() => {
            const src = createdContainer ? (createdContainer.originalProps || createdContainer.props) : containerProps;
            // Clone to avoid mutating instance data
            const out = JSON.parse(JSON.stringify(src || {}));
            if (createdContainer && createdContainer.props) {
                if (!out.id && createdContainer.props.id) out.id = createdContainer.props.id;
                if (!out.type && createdContainer.props.type) out.type = createdContainer.props.type;
                if ((!out.channels || out.channels.length === 0) && Array.isArray(createdContainer.props.channels) && createdContainer.props.channels.length > 0) {
                    // Include only the channel ids by default to keep payload small
                    out.channels = createdContainer.props.channels.map(c => ({ id: c.id }));
                }
            }
            return out;
        })();
        // Update the CSD file with the new container
        postMessageToVSCode({
            command: 'updateWidgetProps',
            text: JSON.stringify(containerPayload)
        });

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

        // Use originalProps (minimized) if available, otherwise use props
        // This keeps the child definitions minimal (only non-default properties)
        const sourceProps = widget.originalProps || widget.props;

        const childProps = {
            ...sourceProps,
            bounds: relativeBounds
        };

        // Remove properties that shouldn't be in children
        delete childProps.parentChannel;
        delete childProps.currentCsdFile;

        containerWidget.props.children.push(childProps);

        // Remove from top-level widgets array
        const widgetIndex = widgets.findIndex(w => w.props.id === widget.props.id);
        if (widgetIndex !== -1) {
            widgets.splice(widgetIndex, 1);
        }

        // Remove from DOM
        const widgetDiv = CabbageUtils.getWidgetDiv(widget.props);
        if (widgetDiv) {
            widgetDiv.remove();
        }
    });

    // Update the container's HTML to reflect it now has children (this will update styling)
    const containerChannelId = CabbageUtils.getChannelId(containerWidget.props, 0);
    const containerDiv = document.getElementById(containerChannelId);
    if (containerDiv) {
        // Get the container widget instance and update its HTML
        const containerInstance = containerDiv.cabbageInstance || widgets.find(w => CabbageUtils.getChannelId(w.props, 0) === containerChannelId);
        if (containerInstance && typeof containerInstance.getInnerHTML === 'function') {
            containerDiv.innerHTML = containerInstance.getInnerHTML();
            console.log("Cabbage: Updated container HTML to reflect children");
        }

        // Use insertChildWidgets to properly render the children
        await WidgetManager.insertChildWidgets(containerWidget, containerDiv);
        console.log("Cabbage: Re-inserted", childWidgets.length, "children into container DOM");
    } else {
        console.error("Cabbage: Container div not found:", containerChannelId);
    }


    // Update the CSD file with the modified container (now with children)
    // Send only the essential delta: id, type, and children
    // The extension's deepMerge will preserve all other existing properties
    const containerUpdatePayload = {
        id: containerWidget.props.id,
        type: containerWidget.props.type,
        children: containerWidget.props.children
    };

    // Include channels for identification
    if (containerWidget.props.channels) {
        containerUpdatePayload.channels = containerWidget.props.channels.map(c => ({ id: c.id }));
    }

    postMessageToVSCode({
        command: 'updateWidgetProps',
        text: JSON.stringify(containerUpdatePayload)
    });

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

    console.log("Cabbage: Ungrouping container", CabbageUtils.getChannelId(containerWidget.props, 0), "with", containerWidget.props.children.length, "children");

    // First, remove existing child DOM elements from the container and re-parent them to MainForm
    const mainForm = document.getElementById('MainForm');
    if (!mainForm) {
        console.error("Cabbage: MainForm not found during ungroup");
        return;
    }

    // Process each child widget
    const childrenPromises = containerWidget.props.children.map(async (childProps) => {
        // Use getWidgetDivId to ensure we find the correct DOM element (prioritizes props.id)
        const childChannelId = CabbageUtils.getWidgetDivId(childProps);
        const existingChildDiv = document.getElementById(childChannelId);

        // Calculate absolute position
        const absoluteBounds = {
            ...childProps.bounds,
            left: containerWidget.props.bounds.left + childProps.bounds.left,
            top: containerWidget.props.bounds.top + childProps.bounds.top
        };

        if (existingChildDiv) {
            // Reuse existing DOM element - just update its properties
            console.log(`Cabbage: Reusing existing child element ${childChannelId}`);

            // Remove the grouped-child class and add draggable class
            existingChildDiv.classList.remove('grouped-child');
            existingChildDiv.classList.add('draggable');

            // Remove the parent channel attribute
            existingChildDiv.removeAttribute('data-parent-channel');

            // Update position to absolute coordinates
            existingChildDiv.style.transform = `translate(${absoluteBounds.left}px, ${absoluteBounds.top}px)`;
            existingChildDiv.setAttribute('data-x', absoluteBounds.left);
            existingChildDiv.setAttribute('data-y', absoluteBounds.top);

            // Re-enable pointer events
            existingChildDiv.style.pointerEvents = 'auto';

            // Re-parent to MainForm (remove from container, add to form)
            mainForm.appendChild(existingChildDiv);

            // Add pointer down event listener for draggable mode
            existingChildDiv.addEventListener('pointerdown', (e) => handlePointerDown(e, existingChildDiv));
        }

        // Update the widget in the widgets array
        const topLevelProps = {
            ...childProps,
            bounds: absoluteBounds
        };
        delete topLevelProps.parentChannel;

        // Find and update the existing child widget in the widgets array
        const existingChildWidget = widgets.find(w => CabbageUtils.getWidgetDivId(w.props) === childChannelId);
        if (existingChildWidget) {
            // Update existing widget props - merge the absolute bounds and remove parentChannel
            existingChildWidget.props.bounds = absoluteBounds;
            delete existingChildWidget.props.parentChannel;
            console.log(`Cabbage: Updated existing child widget ${childChannelId} in widgets array - removed parentChannel and updated bounds`);
        } else {
            // Insert as new widget (shouldn't normally happen, but handle it)
            console.log(`Cabbage: Child widget ${childChannelId} not found in widgets array, inserting new`);
            const childWidget = await WidgetManager.insertWidget(childProps.type, topLevelProps, containerWidget.props.currentCsdFile);
        }

        // Update the CSD file with the new top-level widget
        postMessageToVSCode({
            command: 'updateWidgetProps',
            text: JSON.stringify(topLevelProps)
        });

        return topLevelProps;
    });

    // Wait for all children to be processed
    await Promise.all(childrenPromises);

    // Remove the container's children array since they're now top-level
    containerWidget.props.children = [];

    // Keep the container widget but update it to have no children
    const containerChannelId = CabbageUtils.getChannelId(containerWidget.props, 0);

    // Update the CSD file with the container (now without children)
    // Send a minimal update to avoid writing default properties to the CSD
    const containerUpdatePayload = {
        id: containerWidget.props.id,
        type: containerWidget.props.type,
        children: [], // Explicitly empty the children
        channels: containerWidget.props.channels ? containerWidget.props.channels.map(c => ({ id: c.id })) : []
    };

    postMessageToVSCode({
        command: 'updateWidgetProps',
        text: JSON.stringify(containerUpdatePayload)
    });

    console.log("Cabbage: Container", containerChannelId, "now has no children and remains as a top-level widget");

    // Clear selection
    selectedElements.forEach(element => element.classList.remove('selected'));
    selectedElements.clear();
    console.log("Cabbage: Successfully ungrouped container:", containerChannelId);
}

/**
 * Duplicates selected widgets
 */
async function duplicateSelectedWidgets() {
    console.log('Cabbage: duplicateSelectedWidgets called');
    if (selectedElements.size === 0) {
        console.warn('Cabbage: No widgets selected to duplicate');
        return;
    }

    const widgetProps = [];
    selectedElements.forEach(el => {
        const widget = widgets.find(w => w.props.id === el.id || CabbageUtils.getChannelId(w.props, 0) === el.id);
        if (widget) {
            widgetProps.push(widget.props);
        }
    });

    console.log(`Cabbage: Found ${widgetProps.length} widgets to duplicate`);

    // Prepare widgets with unique IDs and offset positions
    // Temporarily store in clipboard to use the prepareForPaste logic
    try {
        console.log('Cabbage: Copying widgets to clipboard');
        widgetClipboard.copy(widgetProps);
        console.log('Cabbage: Preparing widgets for paste');
        const preparedWidgets = widgetClipboard.prepareForPaste(widgets, 20, 20);
        console.log(`Cabbage: Prepared ${preparedWidgets.length} widget(s) for duplication`);

        // Load PropertyPanel for minimization
        console.log('Cabbage: Loading PropertyPanel');
        const PP = await loadPropertyPanel();
        if (!PP) {
            console.error('Cabbage: PropertyPanel not available for duplication');
            return;
        }
        console.log('Cabbage: PropertyPanel loaded successfully');

        // Create each duplicated widget
        for (let i = 0; i < preparedWidgets.length; i++) {
            const widgetProps = preparedWidgets[i];
            const channelId = widgetProps.id || CabbageUtils.getChannelId(widgetProps, 0);
            console.log(`Cabbage: [${i + 1}/${preparedWidgets.length}] Creating duplicated widget:`, channelId);

            try {
                // Insert the widget into the DOM and widgets array
                console.log(`Cabbage: Inserting widget ${channelId}`);
                await WidgetManager.insertWidget(widgetProps.type, widgetProps, WidgetManager.getCurrentCsdPath());
                console.log(`Cabbage: Widget ${channelId} inserted`);

                // Find the inserted widget instance in the widgets array
                // Since the ID might have changed, look for the most recently added widget with matching bounds
                const inserted = widgets.find(w =>
                    w.props &&
                    w.props.bounds &&
                    widgetProps.bounds &&
                    w.props.bounds.left === widgetProps.bounds.left &&
                    w.props.bounds.top === widgetProps.bounds.top &&
                    (w.props.id === channelId || CabbageUtils.getChannelId(w.props, 0) === channelId)
                );

                if (inserted) {
                    console.log(`Cabbage: Found inserted widget instance for ${channelId}`);
                    try {
                        // Use PropertyPanel's minimization logic to get only non-default props
                        let minimized = PP.minimizePropsForWidget(inserted.props, inserted);
                        minimized = PP.applyExcludes(minimized, PP.defaultExcludeKeys);

                        const payload = JSON.stringify(minimized);
                        console.log('Cabbage: Minimized payload for duplicated widget:', channelId, payload.substring(0, 200));

                        // Send to VSCode
                        const msg = { command: 'updateWidgetProps', text: payload };
                        postMessageToVSCode(msg);
                        // Retry once shortly after to guard against ordering races
                        setTimeout(() => postMessageToVSCode(msg), 200);

                        console.log('Cabbage: Sent duplicated widget to VSCode:', channelId);
                    } catch (e) {
                        console.error('Cabbage: Failed to minimize props for duplicated widget:', e);
                        // Fallback to full props if minimization fails
                        const fallback = JSON.stringify(inserted.props);
                        postMessageToVSCode({ command: 'updateWidgetProps', text: fallback });
                    }
                } else {
                    console.error('Cabbage: Could not find inserted widget instance for:', channelId);
                }
            } catch (widgetError) {
                console.error(`Cabbage: Error duplicating widget ${channelId}:`, widgetError);
                // Continue with next widget instead of crashing
            }
        }

        console.log(`Cabbage: Successfully duplicated ${preparedWidgets.length} widget(s)`);

        // Select all the newly created widgets so they can be moved as a group
        if (preparedWidgets.length > 0) {
            console.log('Cabbage: Selecting newly duplicated widgets');

            // Clear current selection
            selectedElements.clear();
            document.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));

            // Select all the newly duplicated widgets
            preparedWidgets.forEach(widgetProps => {
                const widgetId = widgetProps.id || CabbageUtils.getChannelId(widgetProps, 0);
                const widgetDiv = document.getElementById(widgetId);

                if (widgetDiv) {
                    widgetDiv.classList.add('selected');
                    selectedElements.add(widgetDiv);
                    console.log('Cabbage: Selected duplicated widget:', widgetId);
                } else {
                    console.warn('Cabbage: Could not find duplicated widget div for selection:', widgetId);
                }
            });

            console.log(`Cabbage: Selected ${selectedElements.size} duplicated widget(s)`);
        }
    } catch (error) {
        console.error('Cabbage: Error in duplicateSelectedWidgets:', error);
        console.error('Cabbage: Stack trace:', error.stack);
    }
}

/**
 * Deletes selected widgets
 */
async function deleteSelectedWidgets() {
    if (selectedElements.size === 0) {
        console.warn('Cabbage: No widgets selected to delete');
        return;
    }

    const channelsToDelete = [];
    selectedElements.forEach(el => {
        const widget = widgets.find(w => w.props.id === el.id || CabbageUtils.getChannelId(w.props, 0) === el.id);
        if (widget) {
            const channelId = CabbageUtils.getChannelId(widget.props, 0);
            channelsToDelete.push(channelId);
        }
    });

    console.log(`Cabbage: Deleting ${channelsToDelete.length} widget(s):`, channelsToDelete);

    // Send removeWidgets command to VS Code
    postMessageToVSCode({
        command: 'removeWidgets',
        channels: channelsToDelete
    });

    // Remove widgets from DOM and widgets array
    selectedElements.forEach(el => {
        const widget = widgets.find(w => w.props.id === el.id || CabbageUtils.getChannelId(w.props, 0) === el.id);
        if (widget) {
            const index = widgets.indexOf(widget);
            if (index > -1) {
                widgets.splice(index, 1);
            }
        }
        el.remove();
    });

    // Clear selection
    selectedElements.clear();
    console.log(`Cabbage: Successfully deleted ${channelsToDelete.length} widget(s)`);
}


/**
 * Aligns or distributes selected widgets based on the specified type.
 * @param {string} type - The type of alignment ('left', 'right', 'top', 'bottom', 'distributeHorizontally', 'distributeVertically').
 */
async function alignSelectedWidgets(type) {
    if (selectedElements.size < 2) return;
    if ((type === 'distributeHorizontally' || type === 'distributeVertically') && selectedElements.size < 3) {
        console.warn("Cabbage: Need at least 3 widgets to distribute");
        return;
    }

    const selectedWidgets = [];
    selectedElements.forEach(el => {
        const widget = widgets.find(w => w.props.id === el.id || CabbageUtils.getChannelId(w.props, 0) === el.id);
        if (widget) selectedWidgets.push({ widget, element: el });
    });

    if (selectedWidgets.length === 0) return;

    // Calculate bounds of the selection
    let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
    selectedWidgets.forEach(({ widget }) => {
        const b = widget.props.bounds;
        if (b.left < minLeft) minLeft = b.left;
        if (b.top < minTop) minTop = b.top;
        if (b.left + b.width > maxRight) maxRight = b.left + b.width;
        if (b.top + b.height > maxBottom) maxBottom = b.top + b.height;
    });

    const updates = [];

    if (type === 'left') {
        selectedWidgets.forEach(item => {
            if (item.widget.props.bounds.left !== minLeft) {
                item.widget.props.bounds.left = minLeft;
                updates.push(item);
            }
        });
    } else if (type === 'right') {
        selectedWidgets.forEach(item => {
            const newLeft = maxRight - item.widget.props.bounds.width;
            if (item.widget.props.bounds.left !== newLeft) {
                item.widget.props.bounds.left = newLeft;
                updates.push(item);
            }
        });
    } else if (type === 'top') {
        selectedWidgets.forEach(item => {
            if (item.widget.props.bounds.top !== minTop) {
                item.widget.props.bounds.top = minTop;
                updates.push(item);
            }
        });
    } else if (type === 'bottom') {
        selectedWidgets.forEach(item => {
            const newTop = maxBottom - item.widget.props.bounds.height;
            if (item.widget.props.bounds.top !== newTop) {
                item.widget.props.bounds.top = newTop;
                updates.push(item);
            }
        });
    } else if (type === 'distributeHorizontally') {
        // Sort by left position
        selectedWidgets.sort((a, b) => a.widget.props.bounds.left - b.widget.props.bounds.left);

        const totalSpan = maxRight - minLeft;
        const totalWidgetWidth = selectedWidgets.reduce((sum, item) => sum + item.widget.props.bounds.width, 0);
        const totalGap = totalSpan - totalWidgetWidth;
        const gap = totalGap / (selectedWidgets.length - 1);

        let currentLeft = minLeft;
        selectedWidgets.forEach((item, index) => {
            if (index === 0) {
                currentLeft += item.widget.props.bounds.width + gap;
                return;
            }
            // Skip last one to avoid rounding errors moving it slightly
            if (index === selectedWidgets.length - 1) return;

            if (Math.abs(item.widget.props.bounds.left - currentLeft) > 0.1) {
                item.widget.props.bounds.left = currentLeft;
                updates.push(item);
            }
            currentLeft += item.widget.props.bounds.width + gap;
        });
    } else if (type === 'distributeVertically') {
        // Sort by top position
        selectedWidgets.sort((a, b) => a.widget.props.bounds.top - b.widget.props.bounds.top);

        const totalSpan = maxBottom - minTop;
        const totalWidgetHeight = selectedWidgets.reduce((sum, item) => sum + item.widget.props.bounds.height, 0);
        const totalGap = totalSpan - totalWidgetHeight;
        const gap = totalGap / (selectedWidgets.length - 1);

        let currentTop = minTop;
        selectedWidgets.forEach((item, index) => {
            if (index === 0) {
                currentTop += item.widget.props.bounds.height + gap;
                return;
            }
            if (index === selectedWidgets.length - 1) return;

            if (Math.abs(item.widget.props.bounds.top - currentTop) > 0.1) {
                item.widget.props.bounds.top = currentTop;
                updates.push(item);
            }
            currentTop += item.widget.props.bounds.height + gap;
        });
    }

    // Apply updates
    updates.forEach(item => {
        // Update DOM
        item.element.style.transform = `translate(${item.widget.props.bounds.left}px, ${item.widget.props.bounds.top}px)`;
        item.element.setAttribute('data-x', item.widget.props.bounds.left);
        item.element.setAttribute('data-y', item.widget.props.bounds.top);

        // Send to VS Code
        postMessageToVSCode({
            command: 'updateWidgetProps',
            text: JSON.stringify(item.widget.props)
        });
    });

    console.log(`Cabbage: Aligned ${updates.length} widgets (${type})`);
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
    groupContextMenu.className = "wrapper"; // Use wrapper class for styling
    groupContextMenu.style.position = "absolute";
    groupContextMenu.style.visibility = "hidden";
    groupContextMenu.style.zIndex = 10001; // Higher than other elements
    groupContextMenu.style.minWidth = "160px";
    groupContextMenu.style.display = "flex";
    groupContextMenu.style.flexDirection = "column";

    // Create content container to match CSS selectors (.content .menuItem)
    const contentContainer = document.createElement("div");
    contentContainer.className = "content";
    contentContainer.style.padding = "5px"; // Add some padding similar to .menu
    groupContextMenu.appendChild(contentContainer);

    // Helper to create menu options
    const createMenuOption = (text, onClick) => {
        const opt = document.createElement("div");
        opt.className = "menuItem"; // Use menuItem class

        const span = document.createElement("span");
        span.innerText = text;
        opt.appendChild(span);

        opt.addEventListener("click", (e) => {
            e.stopPropagation();
            groupContextMenu.style.visibility = "hidden";
            onClick();
        });
        return opt;
    };

    const createSeparator = () => {
        const sep = document.createElement("div");
        sep.style.height = "1px";
        sep.style.backgroundColor = "#e0e0e0";
        sep.style.margin = "4px 0";
        return sep;
    };

    // Group/Ungroup Options
    const groupOption = createMenuOption("Group", async () => {
        console.log("Cabbage: Group option clicked");
        await groupSelectedWidgets();
    });

    const unGroupOption = createMenuOption("Ungroup", async () => {
        console.log("Cabbage: Ungroup option clicked");
        await ungroupSelectedWidgets();
    });

    // Align Options
    const alignLeftOption = createMenuOption("Align Left", () => alignSelectedWidgets('left'));
    const alignRightOption = createMenuOption("Align Right", () => alignSelectedWidgets('right'));
    const alignTopOption = createMenuOption("Align Top", () => alignSelectedWidgets('top'));
    const alignBottomOption = createMenuOption("Align Bottom", () => alignSelectedWidgets('bottom'));

    // Distribute Options
    const distributeHorizontallyOption = createMenuOption("Distribute Horizontally", () => alignSelectedWidgets('distributeHorizontally'));
    const distributeVerticallyOption = createMenuOption("Distribute Vertically", () => alignSelectedWidgets('distributeVertically'));

    // Duplicate Option
    const duplicateOption = createMenuOption("Duplicate", async () => await duplicateSelectedWidgets());

    // Delete Option
    const deleteOption = createMenuOption("Delete", async () => await deleteSelectedWidgets());

    // Append menu options to the content container
    contentContainer.appendChild(duplicateOption);
    contentContainer.appendChild(createSeparator());
    contentContainer.appendChild(deleteOption);
    contentContainer.appendChild(groupOption);
    contentContainer.appendChild(unGroupOption);
    contentContainer.appendChild(createSeparator());
    contentContainer.appendChild(alignLeftOption);
    contentContainer.appendChild(alignRightOption);
    contentContainer.appendChild(alignTopOption);
    contentContainer.appendChild(alignBottomOption);
    contentContainer.appendChild(createSeparator());
    contentContainer.appendChild(distributeHorizontallyOption);
    contentContainer.appendChild(distributeVerticallyOption);



    // Append context menu to the document body
    document.body.appendChild(groupContextMenu);

    // Reference to the main context menu and the form element
    const contextMenu = document.querySelector(".wrapper");
    const form = document.getElementById('MainForm');

    console.log("Cabbage: Setting up context menu handlers");
    console.log("Cabbage: form element:", form);
    console.log("Cabbage: contextMenu element:", contextMenu);

    // Add a global listener to see what's actually receiving events
    document.addEventListener("click", (e) => {
        console.log("Cabbage: Click on document, target:", e.target.tagName, "id:", e.target.id, "class:", e.target.className);
    });

    document.addEventListener("contextmenu", (e) => {
        console.log("Cabbage: Right-click on document, target:", e.target.tagName, "id:", e.target.id, "class:", e.target.className);
    });

    // Setup event handler for right-click context menu in the form
    if (typeof acquireVsCodeApi === 'function') {
        let mouseDownPosition = {};

        if (form && contextMenu) {
            // Test if form is receiving any events at all
            form.addEventListener("click", (e) => {
                console.log("Cabbage: Form received click event at", e.clientX, e.clientY, "target:", e.target);
            });

            form.addEventListener("contextmenu", async (e) => {
                console.log("Cabbage: Context menu event triggered, cabbageMode:", cabbageMode, "selectedElements.size:", selectedElements.size);
                e.preventDefault(); // Prevent default context menu
                e.stopImmediatePropagation();
                e.stopPropagation();

                // If we're in play/performance mode, don't show any editing menus
                if (cabbageMode === 'play') {
                    console.log('Cabbage: In play mode - suppressing context menu');
                    // Ensure menus are hidden
                    try { contextMenu.style.visibility = 'hidden'; } catch (ex) { }
                    try { groupContextMenu.style.visibility = 'hidden'; } catch (ex) { }
                    return;
                }

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
                // First, make it visible off-screen to measure dimensions
                groupContextMenu.style.visibility = "hidden";
                groupContextMenu.style.display = "flex";

                // We need to temporarily show it to measure it. 
                // Since it's visibility:hidden, it won't be seen but will have dimensions.
                // However, we need to ensure it's not constrained by previous left/top if they were set.
                groupContextMenu.style.left = "0px";
                groupContextMenu.style.top = "0px";

                const menuWidth = groupContextMenu.offsetWidth || 200; // Fallback
                const menuHeight = groupContextMenu.offsetHeight || 300; // Fallback

                x = e.clientX;
                y = e.clientY;

                // Adjust if going off-screen
                if (x + menuWidth > winWidth) {
                    x = winWidth - menuWidth - 5;
                }

                if (y + menuHeight > winHeight) {
                    y = winHeight - menuHeight - 5;
                }

                groupContextMenu.style.left = `${x}px`;
                groupContextMenu.style.top = `${y}px`;

                mouseDownPosition = { x: x, y: y };

                // Show appropriate menu based on mode and selection
                // Check if the right-click is on the form background (not on a widget)
                // Walk up the DOM tree to see if we hit a widget before hitting the form
                let isWidgetClick = false;
                let element = e.target;
                console.log("Cabbage: Right-click target:", e.target, "tagName:", e.target.tagName);

                try {
                    // Safety: limit iterations to prevent infinite loop
                    let iterations = 0;
                    const maxIterations = 20;

                    while (element && element !== formDiv && iterations < maxIterations) {
                        iterations++;
                        console.log("Cabbage: Iteration", iterations, "element:", element.tagName, "classList:", element.classList);

                        // Check if this element is a widget (has widget classes)
                        if (element.classList && (
                            element.classList.contains('draggable') ||
                            element.classList.contains('nonDraggable') ||
                            element.classList.contains('grouped-child') ||
                            element.classList.contains('resizeOnly')
                        )) {
                            isWidgetClick = true;
                            console.log("Cabbage: Found widget in click path:", element);
                            break;
                        }

                        // Move to parent (handle both HTML and SVG elements)
                        const nextElement = element.parentElement || element.parentNode;
                        console.log("Cabbage: Moving from", element.tagName, "to parent:", nextElement?.tagName);
                        element = nextElement;
                    }

                    console.log("Cabbage: Loop completed - isWidgetClick:", isWidgetClick, "iterations:", iterations);
                } catch (error) {
                    console.error("Cabbage: Error in DOM traversal:", error);
                }

                console.log("Cabbage: Final decision - isWidgetClick:", isWidgetClick, "selectedElements.size:", selectedElements.size);

                if (cabbageMode === 'draggable') {
                    if (selectedElements.size > 0) {
                        console.log("Cabbage: Selected widgets exist, showing group context menu");
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

                        // Enable/Disable Group/Ungroup
                        const setOptionState = (opt, enabled) => {
                            const isDark = document.body.classList.contains('vscode-dark');
                            if (isDark) {
                                opt.style.color = enabled ? "#999" : "#000";
                            } else {
                                opt.style.color = enabled ? "#000" : "#999";
                            }
                            opt.style.cursor = enabled ? "pointer" : "not-allowed";
                            opt.style.pointerEvents = enabled ? "auto" : "none";
                        };

                        setOptionState(groupOption, canGroup && hasGroupableWidgets);
                        setOptionState(unGroupOption, canUngroup);

                        // Enable/Disable Align Options
                        const canAlign = selectedElements.size >= 2;
                        const canDistribute = selectedElements.size >= 3;

                        [alignLeftOption, alignRightOption, alignTopOption, alignBottomOption].forEach(opt => setOptionState(opt, canAlign));
                        [distributeHorizontallyOption, distributeVerticallyOption].forEach(opt => setOptionState(opt, canDistribute));

                        // Enable/Disable Duplicate
                        const canDuplicate = selectedElements.size > 0;
                        setOptionState(duplicateOption, canDuplicate);

                        // Enable/Disable Delete
                        const canDelete = selectedElements.size > 0;
                        setOptionState(deleteOption, canDelete);

                        groupContextMenu.style.visibility = "visible";
                    } else {
                        console.log("Cabbage: No selected widgets, showing widget insertion menu");
                        contextMenu.style.visibility = "visible";
                    }
                } else {
                    console.log("Cabbage: Not in draggable mode - suppressing insertion menu");
                    // Do not show insertion or group menus when not in draggable/edit mode
                    try { contextMenu.style.visibility = 'hidden'; } catch (_) { }
                    try { groupContextMenu.style.visibility = 'hidden'; } catch (_) { }
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

                        // Only handle widget insertion menu items (from contextMenu), not action menu items (from groupContextMenu)
                        // Check if this menu item is a child of the widget insertion menu
                        let parent = e.target.closest('.wrapper');
                        if (parent && parent.id === 'dynamicContextMenu') {
                            // This is an action menu item (Duplicate, Group, etc.), not a widget insertion
                            console.log('Cabbage: Action menu item clicked, ignoring in widget insertion handler');
                            return;
                        }

                        // Only allow inserting widgets while in draggable/edit mode
                        if (cabbageMode !== 'draggable') {
                            console.warn('Cabbage: Insert widget prevented when not in draggable mode');
                            return;
                        }

                        const type = e.target.innerHTML.replace(/(\<([^\>]+)\>)/ig, ''); // Clean up HTML
                        console.warn("Cabbage: Adding widget of type:", type);
                        contextMenu.style.visibility = "hidden";

                        // Insert new widget and update the editor
                        const uniqueId = CabbageUtils.getUniqueId(type, widgets);
                        console.log("Cabbage: Inserting widget with uniqueId:", uniqueId);
                        await WidgetManager.insertWidget(type, { id: uniqueId, top: mouseDownPosition.y - 20, left: mouseDownPosition.x - 20 }, WidgetManager.getCurrentCsdPath());
                        // insertWidget pushes the widget instance into the shared
                        // `widgets` array. Locate the instance so we can access
                        // `originalProps`. Fall back to the inserted props if
                        // originalProps isn't available.
                        const inserted = widgets.find(w => w.props && (w.props.id === uniqueId || (Array.isArray(w.props.channels) && w.props.channels[0] && w.props.channels[0].id === uniqueId)));
                        console.warn("Cabbage: Form handlers - Inserted widget:", inserted || uniqueId);
                        if (inserted) {
                            // When a widget is first inserted we want to send the
                            // complete merged props so the extension can persist
                            // all identifying fields (type, channels, etc.). The
                            // `originalProps` value may have been minimized and
                            // omit defaults, producing a payload with only the id.
                            // Prefer the minimized originalProps but ensure minimal
                            // identity fields are present so the extension can
                            // properly merge the update into the document.
                            const src = inserted.originalProps || inserted.props || {};
                            const payload = JSON.parse(JSON.stringify(src));
                            if (inserted.props) {
                                if (!payload.id && inserted.props.id) payload.id = inserted.props.id;
                                if (!payload.type && inserted.props.type) payload.type = inserted.props.type;
                                if ((!payload.channels || payload.channels.length === 0) && Array.isArray(inserted.props.channels) && inserted.props.channels.length > 0) {
                                    payload.channels = inserted.props.channels.map(c => ({ id: c.id }));
                                }
                            }
                            const msg = { command: 'updateWidgetProps', text: JSON.stringify(payload) };
                            postMessageToVSCode(msg);
                            // Retry once shortly after to guard against ordering races
                            setTimeout(() => postMessageToVSCode(msg), 200);
                        } else {
                            console.error("Cabbage: Unable to find inserted widget instance in widgets[] - cannot send update to VS Code");
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
                postMessageToVSCode({
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
                } else if ((clickedElement.classList.contains('draggable') || clickedElement.classList.contains('nonDraggable')) && event.target.id !== "MainForm") {
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

                // Deselect all if clicking on the form background (not on a widget)
                let clickedOnWidget = false;
                let element = event.target;
                let iterations = 0;
                const maxIterations = 20;

                while (element && element !== form && iterations < maxIterations) {
                    iterations++;
                    if (element.classList && (
                        element.classList.contains('draggable') ||
                        element.classList.contains('nonDraggable') ||
                        element.classList.contains('grouped-child') ||
                        element.classList.contains('resizeOnly')
                    )) {
                        clickedOnWidget = true;
                        break;
                    }
                    element = element.parentElement || element.parentNode;
                }

                if (!clickedOnWidget) {
                    selectedElements.forEach(element => element.classList.remove('selected'));
                    selectedElements.clear();
                }

                // In the part where PropertyPanel is used:
                if (!event.shiftKey && !event.altKey && cabbageMode === 'draggable') {
                    try {
                        const PP = await loadPropertyPanel();
                        if (PP && typeof PP.updatePanel === 'function') {
                            let targetId = CabbageUtils.findValidId(event);

                            // If no valid ID found (e.g. clicking on form background) and we are not on a widget, 
                            // default to MainForm so the property panel shows form properties instead of hiding.
                            if (!targetId && !clickedOnWidget) {
                                targetId = "MainForm";
                            }

                            await PP.updatePanel(vscode, {
                                eventType: "click",
                                name: targetId,
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
        }, { capture: true });

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
                const elements = form.querySelectorAll('.draggable, .nonDraggable');

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