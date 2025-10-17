// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { GenTable } from '../genTable.js';
import { CabbageBase } from './cabbageBase.js';
import { CabbageUtils } from '../../utils.js';

export class CabbageGenTable extends HTMLElement {
    constructor() {
        super();
        this.widget = new GenTable();
        CabbageBase.initializeElement(this);
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

customElements.define('cabbage-gen-table', CabbageGenTable); 