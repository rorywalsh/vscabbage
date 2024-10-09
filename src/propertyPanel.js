/**
 * PropertyPanel Class. Lightweight component that updates its innerHTML when properties change.
 * This makes use of https://taufik-nurrohman.js.org/CP/ for colour pickers.
 */
import { CabbageUtils } from "./cabbage/utils.js";

export class PropertyPanel {
  constructor(vscode, type, properties, widgets) {
    this.vscode = vscode;
    this.type = type;
    this.properties = properties;
    this.widgets = widgets;

    // Create the panel and sections
    this.createPanel();
  }

  clearInputs() {
    const inputs = document.querySelectorAll('.property-panel input');
    inputs.forEach(input => {
      input.removeEventListener('input', this.handleInputChange.bind(this));
    });
  }

  createPanel() {
    const panel = document.querySelector('.property-panel');
    panel.innerHTML = ''; // Clear the panel
    this.clearInputs();
    // Create a special section for type and channel
    this.createSpecialSection(panel);

    // Create sections based on the properties object
    this.createSections(this.properties, panel);
    this.createMiscSection(this.properties, panel);
  }

  createSpecialSection(panel) {
    const specialSection = this.createSection('Widget Properties');

    // Add Type Property
    this.addPropertyToSection('Type', this.type, specialSection);

    // Add Channel Property
    if (this.properties.channel) {
      this.addPropertyToSection('Channel', this.properties.channel, specialSection);
    }

    panel.appendChild(specialSection);
  }

  createSections(properties, panel) {
    Object.entries(properties).forEach(([sectionName, sectionProperties]) => {
      if (typeof sectionProperties === 'object' && sectionProperties !== null && !Array.isArray(sectionProperties)) {
        const sectionDiv = this.createSection(sectionName);

        Object.entries(sectionProperties).forEach(([key, value]) => {
          this.addPropertyToSection(key, value, sectionDiv);
        });

        panel.appendChild(sectionDiv);
      }
    });
  }

  createMiscSection(properties, panel) {
    const miscSection = this.createSection('Misc');

    Object.entries(properties).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Skip adding properties that belong to objects already covered
        return;
      }
      this.addPropertyToSection(key, value, miscSection);
    });

    panel.appendChild(miscSection);
  }

  createSection(name) {
    const sectionDiv = document.createElement('div');
    sectionDiv.classList.add('property-section');

    const header = document.createElement('h3');
    header.textContent = name;
    sectionDiv.appendChild(header);

    return sectionDiv;
  }

  createInputElement(key, value) {
    let input;

    if (key.toLowerCase().includes("colour")) {
      input = document.createElement('input');
      input.value = value;
      input.style.backgroundColor = value;
      const picker = new CP(input);
      picker.on('change', (r, g, b, a) => {
        input.value = CP.HEX([r, g, b, a]);
        this.handleInputChange(input.parentElement);
      });
    } else if (key.toLowerCase().includes("family")) {
      input = document.createElement('select');
      const fontList = [
        'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS',
        'Times New Roman', 'Georgia', 'Garamond', 'Courier New',
        'Brush Script MT', 'Comic Sans MS', 'Impact', 'Lucida Sans',
        'Palatino', 'Century Gothic', 'Bookman', 'Candara', 'Consolas'
      ];
      fontList.forEach((font) => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        input.appendChild(option);
      });
      input.value = value || 'Verdana';
    } else if (key.toLowerCase() === 'align') {
      input = document.createElement('select');
      const alignments = ['left', 'right', 'centre'];
      alignments.forEach((align) => {
        const option = document.createElement('option');
        option.value = align;
        option.textContent = align;
        input.appendChild(option);
      });
      input.value = value || 'centre';
    } else {
      input = document.createElement('input');
      input.type = 'text';
      input.value = `${value}`;
      if (key.toLowerCase() === 'type') {
        input.readOnly = true;
      }
    }

    input.id = key;
    input.dataset.parent = this.properties.channel;

    input.addEventListener('input', this.handleInputChange.bind(this));

    return input;
  }

  addPropertyToSection(key, value, section) {
    const propertyDiv = document.createElement('div');
    propertyDiv.classList.add('property');

    const label = document.createElement('label');
    const formattedKey = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
    label.textContent = formattedKey;
    propertyDiv.appendChild(label);

    const input = this.createInputElement(key, value);
    propertyDiv.appendChild(input);
    section.appendChild(propertyDiv);
  }

  handleInputChange(evt) {
    let input;
    if (evt instanceof Event) {
      input = evt.target;
    } else {
      input = evt;
      const innerInput = evt.querySelector('input');
      input = innerInput;
    }
  
    console.log("handleInputChange called");
    console.log("Input value:", input.value);
    console.log("Input id:", input.id);
    console.log("Input dataset parent:", input.dataset.parent);
  
    this.widgets.forEach((widget) => {
      if (widget.props.channel === input.dataset.parent) {
        const inputValue = input.value;
        let parsedValue = isNaN(inputValue) ? inputValue : Number(inputValue);
  
        // Check if the property exists in the widget's props
        if (!(input.id in widget.props)) {
          console.warn(`Property ${input.id} does not exist in widget.props`);
          return;
        }
  
        // Handle nested properties
        if (typeof widget.props[input.id] === 'object' && widget.props[input.id] !== null) {
          console.log(`Updating nested property ${input.id}`);
          // Assuming the input.id is in the format "property.subProperty"
          const [property, subProperty] = input.id.split('.');
          if (subProperty && widget.props[property]) {
            widget.props[property][subProperty] = parsedValue;
          } else {
            console.warn(`SubProperty ${subProperty} does not exist in widget.props[${property}]`);
            return;
          }
        } else {
          console.log("Updating widget property:", input.id, "with value:", parsedValue);
          widget.props[input.id] = parsedValue;
        }
  
        CabbageUtils.updateBounds(widget.props, input.id);
  
        const widgetDiv = CabbageUtils.getWidgetDiv(widget.props.channel);
        if (widget.props['type'] === 'form') {
          widget.updateSVG();
        } else {
          widgetDiv.innerHTML = widget.getInnerHTML();
        }
  
        this.vscode.postMessage({
          command: 'widgetUpdate',
          text: JSON.stringify(widget.props),
        });
      }
    });
  }

  static reattachListeners(widget, widgetDiv) {
    if (typeof acquireVsCodeApi === 'function') {
      if (!vscode) {
        vscode = acquireVsCodeApi();
      }
      if (typeof widget.addVsCodeEventListeners === 'function') {
        widget.addVsCodeEventListeners(widgetDiv, vscode);
      }
    } else if (widget.props.type !== "form") {
      if (typeof widget.addEventListeners === 'function') {
        widget.addEventListeners(widgetDiv);
      }
    }
  }
  static async updatePanel(vscode, input, widgets) {
    widgets.forEach(widget => {
      console.log("updatePane:", widget.props);
    });
    // Ensure input is an array of objects
    this.vscode = vscode;
    let events = Array.isArray(input) ? input : [input];

    console.log("input", input);


    const element = document.querySelector('.property-panel');
    if (element) {
      element.style.visibility = "visible";
      element.innerHTML = '';
    }

    // Iterate over the array of event objects
    events.forEach(eventObj => {
      const { eventType, name, bounds } = eventObj;

      widgets.forEach((widget, index) => {
        if (widget.props.channel === name) {
          //if (eventType !== 'click') {
          if (typeof widget.props?.size === 'object' && widget.props.size !== null) {
            if (bounds.w > 0 && bounds.h > 0) {
              widget.props.size.width = Math.floor(bounds.w);
              widget.props.size.height = Math.floor(bounds.h);
            }
          }
          if (typeof widget.props?.bounds === 'object' && widget.props.bounds !== null) {
            if (Object.keys(bounds).length === 4) {
              if (bounds.w > 0 && bounds.h > 0) {
                widget.props.bounds.width = Math.floor(bounds.w);
                widget.props.bounds.height = Math.floor(bounds.h);
              }
              widget.props.bounds.left = Math.floor(bounds.x);
              widget.props.bounds.top = Math.floor(bounds.y);
            }
          }

          // gentable and form are special cases and have dedicated update methods
          if (eventType !== 'click') {
            if (widget.props.type == "gentable") {
              widget.updateTable();
            } else if (widget.props.type == "form") {
              widget.updateSVG();
            } else {
              const widgetDiv = CabbageUtils.getWidgetDiv(widget.props.channel);
              widgetDiv.innerHTML = widget.getInnerHTML();
            }
          }
          new PropertyPanel(vscode, widget.props.type, widget.props, widgets);
          if (!this.vscode) {
            console.error("not valid");
          }

          //firing these off in one go causes the vs-code editor to react slowly
          setTimeout(() => {
            this.vscode.postMessage({
              command: 'widgetUpdate',
              text: JSON.stringify(widget.props),
            });
          }, (index + 1) * 150);
          //}
        }
      });
    });
  }
}
