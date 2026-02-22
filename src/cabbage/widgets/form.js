// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

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

      "style": {
        "backgroundColor": "#004c6b",
        "opacity": 1
      },

      "id": "MainForm",
      "caption": "",
      "channelConfig": "2-2",
      "enableDevTools": true
    };
    this.props.channels[0].id = this.props.id;

  }

  addEventListeners(evt) {
    //dummy function
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
