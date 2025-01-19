// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { HorizontalSlider } from '../horizontalSlider.js';
import { CabbageBase } from './cabbageBase.js';

export class CabbageHorizontalSlider extends HTMLElement {
    constructor() {
        super();
        this.widget = new HorizontalSlider();
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

customElements.define('cabbage-horizontal-slider', CabbageHorizontalSlider); 