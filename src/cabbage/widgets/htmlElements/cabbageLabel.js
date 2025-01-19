// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { Label } from '../label.js';
import { CabbageBase } from './cabbageBase.js';

export class CabbageLabel extends HTMLElement {
    constructor() {
        super();
        this.widget = new Label();
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

customElements.define('cabbage-label', CabbageLabel); 