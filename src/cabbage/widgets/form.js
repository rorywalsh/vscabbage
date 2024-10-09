/**
 * Form class
 */
export class Form {
  constructor() {
    this.props = {
      "size":{
      "width": 600,
      "height": 300
      },
      "caption": "",
      "type": "form",
      "colour": "#888888",
      "channel": "MainForm"
    }

  }


  getInnerHTML() {
    return `
      <svg class="widget-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.size.width} ${this.props.size.height}" width="100%" height="100%" preserveAspectRatio="none" style="position: relative; z-index: 0;">
        <rect id="MainForm" width="${this.props.size.width}" height="${this.props.size.height}" x="0" y="0" rx="2" ry="2" fill="${this.props.colour}" />
      </svg>
    `;
  }

  updateSVG() {
    console.log("updating form svg", this.props);
    // Select the parent div using the channel property
    const parentDiv = document.getElementById(this.props.channel);
    
    if (!parentDiv) {
      console.error(`Parent div with id ${this.props.channel} not found.`);
      return;
    }

    // Check if an SVG element with the class 'widget-svg' already exists
    let svgElement = parentDiv.querySelector('.widget-svg');
    
    if (svgElement) {
      // Update the existing SVG element's outerHTML
      svgElement.outerHTML = this.getInnerHTML();
    } else {
      // Append the new SVG element if it doesn't exist
      parentDiv.insertAdjacentHTML('beforeend', this.getInnerHTML());
    }
  }
}
