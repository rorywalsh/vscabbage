// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { VerticalSlider } from '../verticalSlider.js';
import { CabbageBase } from './cabbageBase.js';
import { CabbageUtils } from '../../utils.js';

export class CabbageVerticalSlider extends HTMLElement {
    constructor() {
        super();
        this.widget = new VerticalSlider();
        CabbageBase.initializeElement(this);
    }

    connectedCallback() {
        this.id = CabbageUtils.getChannelId(this.widget.props, 0);
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

customElements.define('cabbage-vertical-slider', CabbageVerticalSlider); 