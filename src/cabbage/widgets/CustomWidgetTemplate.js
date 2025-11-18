// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { Cabbage } from "../cabbage.js";
import { CabbageUtils } from "../utils.js";

/**
 * Custom Widget Template Class
 *
 * This is a basic template for creating custom widgets in the Cabbage framework.
 * It provides the essential structure and methods needed for a widget to function
 * within the VS Code extension environment.
 *
 * RELATIVE IMPORTS: This template uses relative imports like the built-in widgets.
 * When you set a custom widget directory, the entire cabbage folder structure is
 * copied to your directory, so these relative imports will work correctly.
 *
 * This template renders a simple rectangular shape based on the style properties
 * (backgroundColor, borderRadius, opacity).
 *
 * To create a new widget:
 * 1. Use the command "Cabbage: Create New Custom Widget" to scaffold this template
 * 2. Change the class name from CustomWidgetTemplate to your widget name
 * 3. Update the props object with your widget's default properties
 * 4. Implement the getInnerHTML() method to return your widget's HTML/SVG
 * 5. Add any custom event listeners in addEventListeners() if needed
 * 6. Update the JSDoc comments to reflect your widget's purpose
 * 7. Test in VS Code, then copy to cabbage/widgets folder for plugin distribution
 */
export class CustomWidgetTemplate {
    /**
     * Creates a new instance of the Custom Widget Template.
     *
     * Initializes default properties including bounds, channels, style, and widget-specific
     * configuration. The props are wrapped with reactive proxies for automatic UI updates.
     */
    constructor() {
        /**
         * @typedef {Object} WidgetProps
         * @property {Object} bounds - Position and size of the widget
         * @property {number} bounds.top - Top position
         * @property {number} bounds.left - Left position
         * @property {number} bounds.width - Width of the widget
         * @property {number} bounds.height - Height of the widget
         * @property {Array} channels - Array of channel objects for data binding
         * @property {number} index - Unique index for the widget instance
         * @property {boolean} visible - Whether the widget is visible
         * @property {boolean} active - Whether the widget is interactive
         * @property {boolean} automatable - Whether the widget can be automated
         * @property {string} type - The type identifier for the widget
         * @property {Object} style - Styling properties
         * @property {number} style.opacity - Opacity (0-1)
         * @property {number} style.borderRadius - Corner radius in pixels
         * @property {string} style.backgroundColor - Background color (hex or rgba)
         */

        /** @type {WidgetProps} */
        this.props = {
            "bounds": {
                "top": 0,
                "left": 0,
                "width": 100,
                "height": 30
            },
            "channels": [{ "id": "customWidget", "event": "valueChanged" }],
            "index": 0,
            "visible": true,
            "active": true,
            "automatable": false,
            "type": "customWidget",

            "style": {
                "opacity": 1,
                "borderRadius": 4,
                "backgroundColor": "#cccccc"
            }
        };
        this.vscode = null;

        /** @type {HTMLElement|null} The widget's DOM element */
        this.widgetDiv = null;

        // Wrap props with reactive proxy to unify visible/active handling
        this.props = CabbageUtils.createReactiveProps(this, this.props);
    }


    /**
     * Uncomment the createCanvas() and updateCanvas() functions if your widget 
     * requires a canvas for custom drawing. If you prefer to use SVG or simple HTML,
     * you can leave these methods commented out.
     */

    /*
    * Create the main canvas and drawing context.
    * This simplified template only creates a single onscreen canvas.
    * Keep the canvas element and 2D context on the instance for
    * simple custom drawing in `updateCanvas()`.
    *
    * No heavy caching or waveform-specific code is included in the
    * template to keep it lightweight and easy to adapt.
    *
    * @private
    */
    // createCanvas() {
    //     this.canvas = document.createElement('canvas');
    //     this.canvas.width = Number(this.props.bounds.width);
    //     this.canvas.height = Number(this.props.bounds.height);
    //     this.ctx = this.canvas.getContext('2d');
    // }

    /**
     * Resize the canvas to match `props.bounds` and redraw a simple
     * background based on `props.style`. This keeps the template fast
     * and easy to understand. Consumers can override or extend this
     * method for more advanced rendering.
     *
     * The method also ensures the canvas is attached to the widget
     * DOM element (id from `CabbageUtils.getChannelId`) and that
     * pointer events and visibility are preserved.
     *
     * @public
     */
    // updateCanvas() {
    //     const width = Number(this.props.bounds.width);
    //     const height = Number(this.props.bounds.height);

    //     // Resize canvas
    //     this.canvas.width = width;
    //     this.canvas.height = height;

    //     // Simple clear + fill (single rect) for template simplicity
    //     const ctx = this.ctx;
    //     ctx.clearRect(0, 0, width, height);
    //     ctx.globalAlpha = Number(this.props.style.opacity || 1);
    //     ctx.fillStyle = this.props.style.backgroundColor || '#cccccc';
    //     ctx.fillRect(0, 0, width, height);

    //     // Update DOM with the canvas (lightweight: clear and append)
    //     const channelId = CabbageUtils.getChannelId(this.props, 0);
    //     const widgetElement = document.getElementById(channelId);
    //     if (widgetElement) {
    //         widgetElement.style.left = '0px';
    //         widgetElement.style.top = '0px';
    //         widgetElement.style.padding = '0';
    //         widgetElement.style.margin = '0';
    //         widgetElement.innerHTML = ''; // Clear existing content
    //         this.canvas.style.display = this.props.visible ? 'block' : 'none';
    //         widgetElement.appendChild(this.canvas);

    //         // Attach minimal event wiring
    //         this.addEventListeners(widgetElement);
    //     } else {
    //         // Keep this log for debugging during template development
    //         console.log(`Element: ${channelId} not found.`);
    //     }
    // }

    /**
     * Adds VS Code-specific event listeners to the widget.
     *
     * This method is called by the framework to set up the widget in the VS Code environment.
     * It handles the active state and calls the general event listener setup.
     *
     * @param {HTMLElement} widgetDiv - The DOM element for this widget
     * @param {Object} vs - VS Code API instance
     */
    addVsCodeEventListeners(widgetDiv, vs) {
        this.vscode = vs;
        this.widgetDiv = widgetDiv;

        // Disable pointer events when active is false
        this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';

        this.addEventListeners(widgetDiv);
    }

    /**
     * Adds general event listeners to the widget.
     *
     * Override this method to add custom event handling for your widget.
     * The base implementation adds a pointerdown event for automation support.
     *
     * @param {HTMLElement} widgetDiv - The DOM element for this widget
     */
    addEventListeners(widgetDiv) {
        widgetDiv.addEventListener("pointerdown", (evt) => {
            CabbageUtils.handleMouseDown(evt, this.props, this.parameterIndex, this.vscode, this.props.automatable);
        });
    }

    /**
     * Generates the inner HTML for the widget.
     *
     * This method returns a simple SVG shape based on the style properties.
     * Override this method to implement your widget's visual appearance.
     *
     * @returns {string} The HTML/SVG markup for the widget
     */
    getInnerHTML() {
        return `
            <div style="position: relative; width: 100%; height: 100%; opacity: ${this.props.style.opacity}; display: ${this.props.visible ? 'block' : 'none'};">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width} ${this.props.bounds.height}" width="100%" height="100%" preserveAspectRatio="none"
                     style="position: absolute; top: 0; left: 0;">
                    <rect width="${this.props.bounds.width}" height="${this.props.bounds.height}" x="0" y="0"
                          rx="${this.props.style.borderRadius}" ry="${this.props.style.borderRadius}"
                          fill="${this.props.style.backgroundColor}"
                          pointer-events="all"></rect>
                </svg>
            </div>
        `;
    }
}