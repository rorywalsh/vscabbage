// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils } from "../utils.js";
import { getCabbageMode, vscode as sharedVscode } from "../sharedState.js";

/**
 * Form class
 */
export class Form {
  constructor() {
    this.props = {
      "size": {
        "width": 600,
        "height": 300
      },
      "channels": [
        {
          "id": "formChannel", "event": "valueChanged",
          "range": { "defaultValue": 0, "increment": 1, "max": 1, "min": 0, "skew": 1, "value": 0 }
        }
      ],
      "type": "form",
      "zIndex": 0,
      "value": 0,
      "automatable": false,

      "scaleSource": "host",

      "style": {
        "backgroundColor": "#004c6b",
        "opacity": 1
      },

      "id": "MainForm",
      "caption": ""
    };
    this.props.channels[0].id = this.props.id;

    this.vscode = null;
    this.widgetDiv = null;
    this.parameterIndex = -1;

    this.boundPointerDown = this.pointerDown.bind(this);
    this.boundPointerMove = this.pointerMove.bind(this);
    this.boundPointerEnter = this.pointerEnter.bind(this);
    this.boundPointerLeave = this.pointerLeave.bind(this);
    this.boundContextMenu = this.contextMenu.bind(this);
  }

  /** The form element is created separately to the widget div in widgetManager. */
  resolveFormElement(widgetDiv) {
    return document.getElementById(this.props.id || 'MainForm') || widgetDiv;
  }

  getVscode() {
    return this.vscode || sharedVscode;
  }

  /** Form mouse events are only useful outside edit mode. */
  isMouseEventsEnabled() {
    return getCabbageMode() !== 'draggable';
  }

  addVsCodeEventListeners(widgetDiv, vs) {
    this.vscode = vs;
    this.addEventListeners(widgetDiv);
  }

  addEventListeners(widgetDiv) {
    const formDiv = this.resolveFormElement(widgetDiv);
    if (!formDiv) {
      return;
    }

    // Replace handlers left behind by a previous Form instance using this element.
    if (formDiv.cabbageFormMouseOwner && formDiv.cabbageFormMouseOwner !== this) {
      formDiv.cabbageFormMouseOwner.removeEventListeners();
    }
    if (formDiv.cabbageFormMouseOwner === this) {
      return;
    }

    formDiv.cabbageFormMouseOwner = this;
    this.widgetDiv = formDiv;

    formDiv.addEventListener('pointerdown', this.boundPointerDown);
    formDiv.addEventListener('pointermove', this.boundPointerMove);
    formDiv.addEventListener('pointerenter', this.boundPointerEnter);
    formDiv.addEventListener('pointerleave', this.boundPointerLeave);
    formDiv.addEventListener('contextmenu', this.boundContextMenu);
  }

  removeEventListeners() {
    const formDiv = this.widgetDiv;
    if (!formDiv || formDiv.cabbageFormMouseOwner !== this) {
      return;
    }

    formDiv.removeEventListener('pointerdown', this.boundPointerDown);
    formDiv.removeEventListener('pointermove', this.boundPointerMove);
    formDiv.removeEventListener('pointerenter', this.boundPointerEnter);
    formDiv.removeEventListener('pointerleave', this.boundPointerLeave);
    formDiv.removeEventListener('contextmenu', this.boundContextMenu);
    delete formDiv.cabbageFormMouseOwner;
  }

  pointerDown(evt) {
    if (!this.isMouseEventsEnabled()) {
      return;
    }

    CabbageUtils.handleMouseDown(evt, this.props, this.parameterIndex, this.getVscode(), () => {
      // Release may happen outside the form, so listen at window level.
      const onUp = (upEvt) => {
        CabbageUtils.handleMouseUp(upEvt, this.props, this.parameterIndex, this.getVscode());
        window.removeEventListener('pointerup', onUp, true);
      };
      window.addEventListener('pointerup', onUp, true);
    });
  }

  pointerMove(evt) {
    if (!this.isMouseEventsEnabled()) {
      return;
    }
    CabbageUtils.handleMouseMove(evt, this.props, this.parameterIndex, this.getVscode());
  }

  pointerEnter() {
    if (!this.isMouseEventsEnabled()) {
      return;
    }
    CabbageUtils.handleMouseInside(this.props, true, this.getVscode());
  }

  pointerLeave() {
    if (!this.isMouseEventsEnabled()) {
      return;
    }
    CabbageUtils.handleMouseInside(this.props, false, this.getVscode());
  }

  contextMenu(evt) {
    if (!this.isMouseEventsEnabled()) {
      return;
    }
    // Only suppress the browser menu when the instrument actually listens
    // for right-button events.
    if (CabbageUtils.getChannelByEvent(this.props, 'mousePressRight', 'click')) {
      evt.preventDefault();
    }
  }

  getInnerHTML() {
    return `
      <svg class="widget-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.size.width} ${this.props.size.height}" width="100%" height="100%" preserveAspectRatio="none" style="position: relative; z-index: 0;">
        <rect width="${this.props.size.width}" height="${this.props.size.height}" x="0" y="0" rx="2" ry="2" fill="${this.props.style.backgroundColor}" />
      </svg>
    `;
  }

  updateSVG() {
    // Select the parent div using the ui property if not empty, otherwise use id
    const channel = this.props.ui && this.props.ui !== '' ? this.props.ui : this.props.id;
    const parentDiv = document.getElementById(channel);

    if (!parentDiv) {
      console.error(`Parent div with id ${channel} not found.`);
      return;
    }

    // Check if an SVG element with the class 'widget-svg' already exists
    let svgElement = parentDiv.querySelector('.widget-svg');

    if (svgElement) {
      // Update the existing SVG element's attributes
      svgElement.setAttribute('viewBox', `0 0 ${this.props.size.width} ${this.props.size.height}`);
      svgElement.setAttribute('width', this.props.size.width);
      svgElement.setAttribute('height', this.props.size.height);
      const rect = svgElement.querySelector('rect');
      if (rect) {
        rect.setAttribute('width', this.props.size.width);
        rect.setAttribute('height', this.props.size.height);
        rect.setAttribute('fill', this.props.style.backgroundColor);
      }
    } else {
      // Add the SVG since it doesn't exist
      parentDiv.insertAdjacentHTML('beforeend', this.getInnerHTML());
    }
  }
}
