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

    // Create a wrapper container for MainForm that we can freely position
    let wrapper = document.getElementById('zoom-wrapper');
    if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.id = 'zoom-wrapper';
        wrapper.style.position = 'absolute';
        wrapper.style.top = '0';
        wrapper.style.left = '0';
        wrapper.style.width = '100%';
        wrapper.style.height = '100%';

        // Move MainForm into the wrapper - check both leftPanel and body
        const mainForm = document.getElementById('MainForm');
        if (mainForm) {
            if (mainForm.parentElement === leftPanel) {
                leftPanel.removeChild(mainForm);
            } else if (mainForm.parentElement === document.body) {
                console.log('Cabbage: MainForm found in body, moving to zoom-wrapper');
                document.body.removeChild(mainForm);
            }
            wrapper.appendChild(mainForm);
        }
        leftPanel.appendChild(wrapper);
    }

    // Observe LeftPanel for changes (e.g. when MainForm is recreated on mode switch)
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.id === 'MainForm') {
                        console.log('Cabbage: MainForm recreated, moving to zoom-wrapper');
                        // Move it to the wrapper
                        const wrapper = document.getElementById('zoom-wrapper');
                        if (wrapper) {
                            if (node.parentElement === leftPanel) {
                                leftPanel.removeChild(node);
                            } else if (node.parentElement === document.body) {
                                console.log('Cabbage: MainForm found in body during mutation, moving');
                                document.body.removeChild(node);
                            }
                            wrapper.appendChild(node);
                            // Re-apply zoom to ensure correct scaling
                            applyZoom(leftPanel);
                        }
                    }
                });
            }
        });
    });

    observer.observe(leftPanel, { childList: true });
    // Also observe body in case MainForm is added there
    observer.observe(document.body, { childList: true });

    // Set up zoom with Ctrl/Cmd + Mouse Wheel
    setupZoom(leftPanel);

    // Set up pan with middle mouse button
    setupPan(leftPanel);

    // Apply initial zoom (at 100%) to set up negative margin for panning
    applyZoom(leftPanel);

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

    // Apply transform to MainForm instead of LeftPanel
    // This keeps LeftPanel's flex layout intact
    mainForm.style.transform = `scale(${zoomLevel})`;
    mainForm.style.transformOrigin = '0 0';

    // Get the original dimensions
    const originalWidth = mainForm.offsetWidth / zoomLevel; // Divide to get unscaled size
    const originalHeight = mainForm.offsetHeight / zoomLevel;

    // Calculate how much space the scaled content needs
    const scaledWidth = originalWidth * zoomLevel;
    const scaledHeight = originalHeight * zoomLevel;

    // Set MainForm's width and height
    mainForm.style.width = `${scaledWidth}px`;
    mainForm.style.height = `${scaledHeight}px`;

    console.log(`Cabbage: Applied zoom ${(zoomLevel * 100).toFixed(0)}%`);
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

            // Get current wrapper position
            const wrapper = document.getElementById('zoom-wrapper');
            if (wrapper) {
                const transform = wrapper.style.transform;
                const match = transform.match(/translate\((-?\d+(?:\.\d+)?)px,\s*(-?\d+(?:\.\d+)?)px\)/);
                if (match) {
                    scrollStartX = parseFloat(match[1]);
                    scrollStartY = parseFloat(match[2]);
                } else {
                    scrollStartX = 0;
                    scrollStartY = 0;
                }
            }

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
            const deltaX = e.clientX - panStartX;
            const deltaY = e.clientY - panStartY;

            // Update wrapper position using transform
            const wrapper = document.getElementById('zoom-wrapper');
            if (wrapper) {
                const newX = scrollStartX + deltaX;
                const newY = scrollStartY + deltaY;
                wrapper.style.transform = `translate(${newX}px, ${newY}px)`;
            }
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
