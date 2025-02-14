// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.
// @ts-check

import { RotarySlider } from '../rotarySlider.js';
import { CabbageBase } from './cabbageBase.js';

export class CabbageRotarySlider extends HTMLElement {
    constructor() {
        super();
        this.widget = new RotarySlider();
        CabbageBase.initializeElement(this);
    }

    connectedCallback() {
        this.id = this.widget.props.channel;
        this.render();
        
        requestAnimationFrame(() => {
            this.widget.addEventListeners(this);
        });
    }

    render() {
        this.innerHTML = this.widget.getInnerHTML();
    }
}

customElements.define('cabbage-rotary-slider', CabbageRotarySlider); 