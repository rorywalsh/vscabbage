// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

/**
 * Zoom and Pan Module
 * 
 * Provides zoom (Ctrl/Cmd + Mouse Wheel) and pan (middle-click drag) functionality
 * for the Cabbage UI editor.
 */

console.log('Cabbage: Loading zoom.js');

// Zoom state
let zoomLevel = 1.0;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 5.0;
const ZOOM_STEP = 0.1;

// Pan state
let isPanning = false;
let panStartX = 0;
let panStartY = 0;
let scrollStartX = 0;
let scrollStartY = 0;

/**
 * Initializes zoom and pan functionality on the LeftPanel
 */
export function initializeZoom() {
    console.log('Cabbage: Initializing zoom and pan functionality');

    const leftPanel = document.getElementById('LeftPanel');
    if (!leftPanel) {
        console.error('Cabbage: LeftPanel not found, cannot initialize zoom');
        return;
    }

    // Set up zoom with Ctrl/Cmd + Mouse Wheel
    setupZoom(leftPanel);

    // Set up pan with middle mouse button
    setupPan(leftPanel);

    console.log('Cabbage: Zoom and pan initialized successfully');
}

/**
 * Sets up zoom functionality
 * @param {HTMLElement} leftPanel - The LeftPanel element to apply zoom to
 */
function setupZoom(leftPanel) {
    leftPanel.addEventListener('wheel', (e) => {
        // Check for Ctrl (Windows/Linux) or Cmd (Mac)
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();

            // Calculate new zoom level
            const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
            const newZoom = zoomLevel + delta;

            // Clamp to min/max
            zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));

            // Apply zoom transform
            applyZoom(leftPanel);

            console.log(`Cabbage: Zoom level: ${(zoomLevel * 100).toFixed(0)}%`);
        }
    }, { passive: false }); // passive: false allows preventDefault
}

/**
 * Applies the current zoom level to the LeftPanel
 * @param {HTMLElement} leftPanel - The LeftPanel element
 */
function applyZoom(leftPanel) {
    const mainForm = document.getElementById('MainForm');
    if (!mainForm) return;

    // Get the original dimensions of MainForm
    const originalWidth = mainForm.offsetWidth;
    const originalHeight = mainForm.offsetHeight;

    // Apply transform to LeftPanel
    leftPanel.style.transform = `scale(${zoomLevel})`;
    leftPanel.style.transformOrigin = '0 0';

    // Calculate scaled dimensions
    const scaledWidth = originalWidth * zoomLevel;
    const scaledHeight = originalHeight * zoomLevel;

    // Set LeftPanel's width and height to the scaled dimensions
    // This creates scrollable area without pushing RightPanel
    leftPanel.style.width = `${scaledWidth}px`;
    leftPanel.style.height = `${scaledHeight}px`;

    console.log(`Cabbage: Applied zoom ${(zoomLevel * 100).toFixed(0)}%, scaled dimensions: ${scaledWidth}x${scaledHeight}`);
}

/**
 * Sets up pan functionality with middle mouse button
 * @param {HTMLElement} leftPanel - The LeftPanel element to pan
 */
function setupPan(leftPanel) {
    // Middle mouse button down - start panning
    leftPanel.addEventListener('mousedown', (e) => {
        if (e.button === 1) { // Middle mouse button
            e.preventDefault();

            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            scrollStartX = leftPanel.scrollLeft;
            scrollStartY = leftPanel.scrollTop;

            // Change cursor to grabbing
            leftPanel.style.cursor = 'grabbing';

            console.log('Cabbage: Started panning');
        }
    });

    // Mouse move - pan if active
    window.addEventListener('mousemove', (e) => {
        if (isPanning) {
            e.preventDefault();

            // Calculate delta from start position
            const deltaX = panStartX - e.clientX;
            const deltaY = panStartY - e.clientY;

            // Update scroll position
            leftPanel.scrollLeft = scrollStartX + deltaX;
            leftPanel.scrollTop = scrollStartY + deltaY;
        }
    });

    // Mouse up - stop panning
    window.addEventListener('mouseup', (e) => {
        if (isPanning && e.button === 1) {
            isPanning = false;

            // Reset cursor
            leftPanel.style.cursor = '';

            console.log('Cabbage: Stopped panning');
        }
    });

    // Also stop panning if mouse leaves window
    window.addEventListener('mouseleave', () => {
        if (isPanning) {
            isPanning = false;
            leftPanel.style.cursor = '';
        }
    });

    // Prevent default middle-click behavior (auto-scroll)
    leftPanel.addEventListener('auxclick', (e) => {
        if (e.button === 1) {
            e.preventDefault();
        }
    });
}

/**
 * Gets the current zoom level
 * @returns {number} Current zoom level (1.0 = 100%)
 */
export function getZoomLevel() {
    return zoomLevel;
}

/**
 * Sets the zoom level programmatically
 * @param {number} level - Desired zoom level (0.1 to 5.0)
 */
export function setZoomLevel(level) {
    zoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, level));
    const leftPanel = document.getElementById('LeftPanel');
    if (leftPanel) {
        applyZoom(leftPanel);
    }
}

/**
 * Resets zoom to 100%
 */
export function resetZoom() {
    setZoomLevel(1.0);
    console.log('Cabbage: Zoom reset to 100%');
}
