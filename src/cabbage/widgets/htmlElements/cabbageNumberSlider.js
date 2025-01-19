// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { NumberSlider } from '../numberSlider.js';
import { CabbageBase } from './cabbageBase.js';

export class CabbageNumberSlider extends HTMLElement {
    constructor() {
        super();
        this.widget = new NumberSlider();
        CabbageBase.initializeElement(this);
    }

    connectedCallback() {
        this.id = this.widget.props.channel;
        this.RotarySliderInstance = this.widget;
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