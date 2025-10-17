// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { NumberSlider } from '../numberSlider.js';
import { CabbageBase } from './cabbageBase.js';
import { CabbageUtils } from '../../utils.js';

export class CabbageNumberSlider extends HTMLElement {
    constructor() {
        super();
        this.widget = new NumberSlider();
        CabbageBase.initializeElement(this);
        
        // Get initial props from the attribute
        const propsAttr = this.getAttribute('props');
        if (propsAttr) {
            try {
                const newProps = JSON.parse(propsAttr);
                this.widget.props = { ...this.widget.props, ...newProps };
            } catch (e) {
                console.error('Invalid JSON in props attribute:', e);
            }
        }
    }

    connectedCallback() {
        this.id = CabbageUtils.getChannelId(this.widget.props, 0);
        this.render();
        
        requestAnimationFrame(() => {
            this.widget.addEventListeners(this);
        });
    }

    render() {
        this.innerHTML = this.widget.getInnerHTML();
    }
}

customElements.define('cabbage-number-slider', CabbageNumberSlider); 