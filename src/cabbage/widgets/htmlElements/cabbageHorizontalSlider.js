// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { HorizontalSlider } from '../horizontalSlider.js';
import { CabbageBase } from './cabbageBase.js';
import { CabbageUtils } from '../../utils.js';

export class CabbageHorizontalSlider extends HTMLElement {
    constructor() {
        super();
        this.widget = new HorizontalSlider();
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

customElements.define('cabbage-horizontal-slider', CabbageHorizontalSlider); 