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
      "id": "MainForm",
      "caption": "",
      "type": "form",
      "colour": {
        "fill": "#004c6b"
      },
      "channelConfig": "2-2",
      "channels": [
        { "id": "", "event": "valueChanged" }
      ],
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
        <rect width="${this.props.size.width}" height="${this.props.size.height}" x="0" y="0" rx="2" ry="2" fill="${this.props.colour.fill}" />
      </svg>
    `;
  }

  updateSVG() {
    console.log("Cabbage: updateSVG called for form", this.props.id);
    // Select the parent div using the ui property if not empty, otherwise use id
    const channel = this.props.ui && this.props.ui !== '' ? this.props.ui : this.props.id;
    const parentDiv = document.getElementById(channel);
    console.log("Cabbage: updateSVG parentDiv", parentDiv, "channel", channel);

    if (!parentDiv) {
      console.error(`Parent div with id ${channel} not found.`);
      return;
    }

    // Check if an SVG element with the class 'widget-svg' already exists
    let svgElement = parentDiv.querySelector('.widget-svg');
    console.log("Cabbage: updateSVG svgElement found", svgElement);

    if (svgElement) {
      // Update the existing SVG element's attributes
      svgElement.setAttribute('viewBox', `0 0 ${this.props.size.width} ${this.props.size.height}`);
      svgElement.setAttribute('width', this.props.size.width);
      svgElement.setAttribute('height', this.props.size.height);
      const rect = svgElement.querySelector('rect');
      if (rect) {
        rect.setAttribute('width', this.props.size.width);
        rect.setAttribute('height', this.props.size.height);
        rect.setAttribute('fill', this.props.colour.fill);
      }
      console.log("Cabbage: updateSVG updated existing SVG");
    } else {
      // Add the SVG since it doesn't exist
      console.log("Cabbage: updateSVG adding new SVG");
      parentDiv.insertAdjacentHTML('beforeend', this.getInnerHTML());
      console.log("Cabbage: updateSVG added SVG, parentDiv children now", parentDiv.children.length);
    }
  }
}
