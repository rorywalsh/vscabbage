
/**
 * Utility for sorting Cabbage widgets based on visual hierarchy and position.
 */

interface WidgetBounds {
    left: number;
    top: number;
    width: number;
    height: number;
}

interface Widget {
    type: string;
    id?: string;
    bounds?: WidgetBounds;
    [key: string]: any;
}

/**
 * Helper to safely extract bounds from a widget.
 * Returns default bounds if missing or invalid.
 */
function getWidgetBounds(widget: any): WidgetBounds {
    const defaultBounds = { left: 0, top: 0, width: 0, height: 0 };
    if (!widget || !widget.bounds) {
        return defaultBounds;
    }

    return {
        left: Number(widget.bounds.left) || 0,
        top: Number(widget.bounds.top) || 0,
        width: Number(widget.bounds.width) || 0,
        height: Number(widget.bounds.height) || 0
    };
}

/**
 * Checks if a point (x, y) is inside a rectangle.
 */
function isPointInRect(x: number, y: number, rect: WidgetBounds): boolean {
    return x >= rect.left &&
        x <= rect.left + rect.width &&
        y >= rect.top &&
        y <= rect.top + rect.height;
}

/**
 * Checks if the center of the inner widget is inside the outer widget.
 */
function isInside(inner: any, outer: any): boolean {
    const innerBounds = getWidgetBounds(inner);
    const outerBounds = getWidgetBounds(outer);

    const centerX = innerBounds.left + (innerBounds.width / 2);
    const centerY = innerBounds.top + (innerBounds.height / 2);

    return isPointInRect(centerX, centerY, outerBounds);
}

/**
 * Sorts widgets by position: Top-to-Bottom, then Left-to-Right.
 */
function sortByPosition(a: any, b: any): number {
    const boundsA = getWidgetBounds(a);
    const boundsB = getWidgetBounds(b);

    // Tolerance for "same row" detection (e.g., 5 pixels)
    const rowTolerance = 5;

    if (Math.abs(boundsA.top - boundsB.top) > rowTolerance) {
        return boundsA.top - boundsB.top;
    }
    return boundsA.left - boundsB.left;
}

/**
 * Main function to reorder widgets based on hierarchy and position.
 */
export function reorderWidgets(widgets: any[]): any[] {
    if (!widgets || !Array.isArray(widgets)) {
        return widgets;
    }

    // 1. Separate Forms, GroupBoxes, and other widgets
    const forms: any[] = [];
    const groupBoxes: any[] = [];
    const otherWidgets: any[] = [];

    // Keep track of original objects to preserve reference equality if needed
    // But we will be building a new list.

    widgets.forEach(widget => {
        if (widget.type === 'form') {
            forms.push(widget);
        } else if (widget.type === 'groupBox') {
            groupBoxes.push(widget);
        } else {
            otherWidgets.push(widget);
        }
    });

    // 2. Build Hierarchy Tree
    // Structure: Map<ParentWidget, List<ChildWidget>>
    // We use a Map where key is the parent widget object.
    // 'root' key will hold top-level items (forms, unparented groupboxes, orphan widgets).
    const hierarchy = new Map<any, any[]>();
    const rootItems: any[] = [...forms]; // Forms are always root

    // Initialize hierarchy for all groupboxes
    groupBoxes.forEach(gb => hierarchy.set(gb, []));

    // Assign GroupBoxes to parents (handling nested groupboxes)
    // We sort groupboxes by size (area) ascending first, so we can find the smallest container
    // that fits a widget (deepest nesting).
    // Actually, a simpler approach for nesting:
    // For each groupbox, find if it is inside another groupbox.
    const unparentedGroupBoxes: any[] = [];

    groupBoxes.forEach(gb => {
        let parent: any = null;
        let bestArea = Infinity;

        groupBoxes.forEach(potentialParent => {
            if (gb === potentialParent) return;

            if (isInside(gb, potentialParent)) {
                const bounds = getWidgetBounds(potentialParent);
                const area = bounds.width * bounds.height;
                if (area < bestArea) {
                    bestArea = area;
                    parent = potentialParent;
                }
            }
        });

        if (parent) {
            hierarchy.get(parent)?.push(gb);
        } else {
            unparentedGroupBoxes.push(gb);
        }
    });

    // Assign other widgets to their deepest groupbox parent
    const orphans: any[] = [];

    otherWidgets.forEach(widget => {
        let parent: any = null;
        let bestArea = Infinity;

        groupBoxes.forEach(gb => {
            if (isInside(widget, gb)) {
                const bounds = getWidgetBounds(gb);
                const area = bounds.width * bounds.height;
                if (area < bestArea) {
                    bestArea = area;
                    parent = gb;
                }
            }
        });

        if (parent) {
            hierarchy.get(parent)?.push(widget);
        } else {
            orphans.push(widget);
        }
    });

    // 3. Recursive Flattening with Sorting
    const result: any[] = [];

    // Helper to process a list of items: sort them, then recursively process any that are groupboxes
    function processItems(items: any[]) {
        // Sort items by position
        items.sort(sortByPosition);

        items.forEach(item => {
            result.push(item);

            // If this item is a groupbox, process its children immediately after it
            if (item.type === 'groupBox' && hierarchy.has(item)) {
                const children = hierarchy.get(item) || [];
                processItems(children);
            }
        });
    }

    // Process root level items: Forms -> Unparented GroupBoxes -> Orphans
    // Forms are already in rootItems.
    // We want to sort unparented groupboxes and orphans together? 
    // Or keep forms first, then everything else sorted by position?
    // Usually Form is first. Then the rest of the UI.

    result.push(...forms);

    const topLevelContent = [...unparentedGroupBoxes, ...orphans];
    processItems(topLevelContent);

    return result;
}
