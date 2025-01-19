// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

/**
 * CabbageBase class
 * 
 * This is the base class for all Cabbage widgets.
 * It provides a mechanism for updating the widget's properties and rendering the widget.
 */
export class CabbageBase {
    static initializeElement(element) {
        // Add props handling
        element.attributeChangedCallback = this.prototype.attributeChangedCallback;
        element.static = this.prototype.static;
        element.observedAttributes = ['props'];
    }

    static get observedAttributes() {
        return ['props'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'props' && newValue) {
            try {
                const newProps = JSON.parse(newValue);
                this.props = { ...this.props, ...newProps };
            } catch (e) {
                console.error('Invalid JSON in props attribute:', e);
            }
        }
    }
}