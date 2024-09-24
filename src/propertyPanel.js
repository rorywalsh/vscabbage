/**
 * PropertyPanel Class. Lightweight component that up updated its innerHTML when properties change.
 * This make uses of https://taufik-nurrohman.js.org/CP/ for colour pickers
 */
import { CabbageUtils } from "./utils.js";

export class PropertyPanel {

  constructor(vscode, type, properties, panelSections, widgets) {
    this.type = type;
    this.panelSections = panelSections;
    var panel = document.querySelector('.property-panel');
    this.vscode = vscode;
    this.widgets = widgets;

    // Helper function to create a section
    const createSection = (sectionName) => {
      const sectionDiv = document.createElement('div');
      sectionDiv.classList.add('property-section');

      const header = document.createElement('h3');
      header.textContent = sectionName;
      sectionDiv.appendChild(header);

      return sectionDiv;
    };

    // Create sections based on the panelSections object
    const sections = {};

    if (panelSections === undefined) {
      console.error("panelSections is undefined");
    }

    Object.entries(panelSections).forEach(([sectionName, keys]) => {
      sections[sectionName] = createSection(sectionName);
    });

    // Create a section for Miscellaneous properties
    const miscSection = createSection('Misc');
    sections['Misc'] = miscSection;

    // List of popular online fonts
    const fontList = [
      'Arial', 'Verdana', 'Helvetica', 'Tahoma', 'Trebuchet MS',
      'Times New Roman', 'Georgia', 'Garamond', 'Courier New',
      'Brush Script MT', 'Comic Sans MS', 'Impact', 'Lucida Sans',
      'Palatino', 'Century Gothic', 'Bookman', 'Candara', 'Consolas'
    ];

    // Helper function to create an input element based on the property key
    const createInputElement = (key, value) => {
      let input;

      if (key.toLowerCase().includes("colour")) {
        input = document.createElement('input');
        // input.type = 'color';
        input.value = value;
        input.style.backgroundColor = value;
        input.id = properties.channel;
        input.dataset.parent = properties.channel;
        const picker = new CP(input);
        picker.on('change', (r, g, b, a) => {
          if (1 === a) {
            input.value = CP.HEX([r, g, b, a]);
          } else {
            input.value = CP.HEX([r, g, b, a]);
          }

          this.handleInputChange(input.parentElement);
        });
      } else if (key.toLowerCase().includes("family")) {
        input = document.createElement('select');
        fontList.forEach((font) => {
          const option = document.createElement('option');
          option.value = font;
          option.textContent = font;
          if (font === 'Verdana') {
            option.selected = true;  // Set Verdana as default
          }
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
          if (align === 'centre') {
            option.selected = true;  // Set centre as default
          }
          input.appendChild(option);
        });
        input.value = value || 'centre';
      } else {
        input = document.createElement('input');
        input.type = 'text';
        input.value = `${value}`;

        // Set the input to readonly if the key is "type"
        if (key.toLowerCase() === 'type') {
          input.readOnly = true;
        }
      }

      return input;
    };

    // Track properties that have been assigned to sections
    const assignedProperties = new Set();



    // Iterate over panelSections and properties to assign them to their respective sections
    Object.entries(panelSections).forEach(([sectionName, keys]) => {
      keys.forEach((key) => {
        if (properties.hasOwnProperty(key)) {
          var propertyDiv = document.createElement('div');
          propertyDiv.classList.add('property');

          var label = document.createElement('label');
          let text = `${key}`;

          let result = text.replace(/([A-Z])/g, " $1");
          const separatedName = result.charAt(0).toUpperCase() + result.slice(1);
          label.textContent = separatedName;
          propertyDiv.appendChild(label);

          var input = createInputElement(key, properties[key]);

          input.id = key;
          input.dataset.parent = properties.channel;
          const self = this;

          input.addEventListener('input', this.handleInputChange.bind(this));

          propertyDiv.appendChild(input);
          sections[sectionName].appendChild(propertyDiv);
          assignedProperties.add(key);
        }
      });
    });

    // Add properties that haven't been assigned to any section to the Misc section
    Object.keys(properties).forEach((key) => {
      if (!assignedProperties.has(key)) {
        var propertyDiv = document.createElement('div');
        propertyDiv.classList.add('property');

        var label = document.createElement('label');
        let text = `${key}`;

        let result = text.replace(/([A-Z])/g, " $1");
        const separatedName = result.charAt(0).toUpperCase() + result.slice(1);
        label.textContent = separatedName;
        propertyDiv.appendChild(label);

        var input = createInputElement(key, properties[key]);

        input.id = key;
        input.dataset.parent = properties.channel;
        const self = this;

        input.addEventListener('input', this.handleInputChange.bind(this));

        propertyDiv.appendChild(input);
        miscSection.appendChild(propertyDiv);
      }
    });

    // Append sections to the panel in the specified order
    Object.keys(panelSections).forEach((sectionName) => {
      if (sections[sectionName].childNodes.length > 1) {
        panel.appendChild(sections[sectionName]);
      }
    });

    // Append the Misc section last
    if (sections['Misc'].childNodes.length > 1) {
      panel.appendChild(sections['Misc']);
    }
  }

  handleInputChange(evt) {
    if (evt === undefined) {
      console.error("evt is undefined");
    }

    let input;
    if (evt instanceof Event) {
      input = evt.target;
    }
    else {
      input = evt;
      const innerInput = evt.querySelector('input');
      input = innerInput;
    }

    const widgets = this.widgets;
    const vscode = this.vscode;

    widgets.forEach((widget) => {
      if (widget.props.channel === input.dataset.parent) {
        const inputValue = input.value;
        let parsedValue;

        if (!isNaN(inputValue) && inputValue.trim() !== "") {
          parsedValue = Number(inputValue);
        } else {
          parsedValue = inputValue;
        }
        widget.props[input.id] = parsedValue;
        CabbageUtils.updateBounds(widget.props, input.id);
        const widgetDiv = CabbageUtils.getWidgetDiv(widget.props.channel);

        if (widget.props['type'] === 'form') {
          //can't be updated innerHTML for form as it is a parent for all
          //other components
          widget.updateSVG();
        }
        else {
          widgetDiv.innerHTML = widget.getInnerHTML();
        }
        if (!vscode) {
          console.error("vscode is not valid");
        } else {
          vscode.postMessage({
            command: 'widgetUpdate',
            text: JSON.stringify(widget.props)
          });
        }
      }
    });
  }

  /**
* this callback is triggered whenever a user move/drags a widget in edit mode
* The innerHTML is constantly updated. When this is called, the editor is also
* updated accordingly. It accepts an array of object with details about the event
* type, name and bounds updates 
*/
  static async updatePanel(vscode, input, widgets) {
    // Ensure input is an array of objects
    this.vscode = vscode;
    let events = Array.isArray(input) ? input : [input];

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
          if (eventType !== 'click') {
            widget.props.left = Math.floor(bounds.x);
            widget.props.top = Math.floor(bounds.y);
            if (bounds.w > 0 && bounds.h > 0) {
              widget.props.width = Math.floor(bounds.w);
              widget.props.height = Math.floor(bounds.h);
            }
            // gentable and form are special cases and have dedicated update methods
            if (widget.props.type == "gentable") {
              widget.updateTable();
            } else if (widget.props.type == "form") {
              widget.updateSVG();
            }
            else {
              const widgetDiv = CabbageUtils.getWidgetDiv(widget.props.channel);
              widgetDiv.innerHTML = widget.getInnerHTML();
            }

            // if (widget.props.type !== 'form') {
            //   document.getElementById(widget.props.channel).innerHTML = widget.getInnerHTML();
            // }
          }

          // if (widget.props.hasOwnProperty('channel')) {
          //   widget.props.channel = name;
          // }

          new PropertyPanel(vscode, widget.props.type, widget.props, widget.panelSections, widgets);
          if (!this.vscode) {
            console.error("not valid");
          }
          //firing these off in one go causes the vs-code editor to shit its pants
          setTimeout(() => {
            this.vscode.postMessage({
              command: 'widgetUpdate',
              text: JSON.stringify(widget.props)
            });
          }, (index + 1) * 150);
        }
      });
    });
  }
}
