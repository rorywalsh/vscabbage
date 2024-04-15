

import { WidgetSVG, RotarySlider, Form } from "./widgets.js";
import { WidgetWrapper } from "./widgetWrapper.js";

const rotarySliderSvg = WidgetSVG("rslider");
const currentWidget = [{ name: "Top", value: 0 }, { name: "Left", value: 0 }, { name: "Width", value: 0 }, { name: "Height", value: 0 }];
const vscode = acquireVsCodeApi();
const widgets = [];

widgets.push(new Form('MainForm'));

let numberOfWidgets = 1;
const contextMenu = document.querySelector(".wrapper");
const form = document.getElementById('MainForm');

const widgetWrappers = new WidgetWrapper(updatePanel);

function DBG(...text) {
  console.log("Cabbage:", text.join());
}

/**
 * This uses a simple regex pattern to parse a line of Cabbage code and convert it to a JSON object
 */
function getCabbageCodeAsJSON(text) {
  const regex = /(\w+)\(([^)]+)\)/g;
  const jsonObj = {};

  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    let value = match[2].replace(/"/g, ''); // Remove double quotes

    if (name === 'bounds') {
      // Splitting the value into individual parts for top, left, width, and height
      const [top, left, width, height] = value.split(',').map(v => parseInt(v.trim()));
      jsonObj['top'] = top;
      jsonObj['left'] = left;
      jsonObj['width'] = width;
      jsonObj['height'] = height;
    }
    else if (name === 'size') {
      // Splitting the value into individual parts for top, left, width, and height
      const [width, height] = value.split(',').map(v => parseInt(v.trim()));
      jsonObj['width'] = width;
      jsonObj['height'] = height;
    } else {
      jsonObj[name] = value;
    }
  }

  return jsonObj;
}
/**
 * called whenever a user saves/updates or changes .csd file
 */
window.addEventListener('message', event => {
  const message = event.data;
  switch (message.command) {
    case 'onFileChanged':
      parseCabbageCsdTile(message.text);
      break;
    default:
      return;
  }
});

/**
 * this function parses the Cabbage code and creates new widgets accordingly..
 */
function parseCabbageCsdTile(text) {
  DBG("parseCabbageCsdTile()");
  widgets.splice(1, widgets.length - 1);

  let cabbageStart = 0;
  let cabbageEnd = 0;
  let lines = text.split(/\r?\n/);
  let count = 0;

  lines.forEach((line) => {
    if (line.trimStart().startsWith("<Cabbage>"))
      cabbageStart = count + 1;
    else if (line.trimStart().startsWith("</Cabbage>"))
      cabbageEnd = count;
    count++;
  })

  const cabbageCode = lines.slice(cabbageStart, cabbageEnd);
  cabbageCode.forEach((line) => {
    const type = `${line.trimStart().split(' ')[0]}`;
    if (line.trim() != "") {
      if (type != "form")
        insertWidget(type, getCabbageCodeAsJSON(line));
      else {
        widgets.forEach((widget) => {
          if (widget.name == "MainForm") {
            const w = getCabbageCodeAsJSON(line).width;
            const h = getCabbageCodeAsJSON(line).height;
            form.style.width = w + "px";
            form.style.height = h + "px";
            widget.props.width = w;
            widget.props.width = h;
          }
        });
      }
    }

  });

  const div = document.getElementById('rslider1');
  console.log(div); // Log the IDs of each element
  numberOfWidgets++;
}

/**
 * this callback is triggered whenever a user move/drags a widget in edit modes
 * The innerHTML is constantly updated. When this is called, the editor is also
 * updated accordingly. 
 */
function updatePanel(eventType, name, bounds) {
  const element = document.querySelector('.property-panel');
  element.style.visibility = "visible";

  if (element)
    element.innerHTML = '';

  widgets.forEach((widget) => {
    DBG(widget.name, name);
    if (widget.name == name) {
      if (eventType != 'click') {
        widget.props.left = Math.floor(bounds.x);
        widget.props.top = Math.floor(bounds.y);
        widget.props.width = Math.floor(bounds.w);
        widget.props.height = Math.floor(bounds.h);
      }

      if (widget.props.hasOwnProperty('channel'))
        widget.props.channel = name;

      console.log(widget.props);
      new PropertyPanel(widget.props.type, widget.props);
      vscode.postMessage({
        command: 'widgetUpdate',
        text: JSON.stringify(widget.props)
      })
    }
  });
}
/**
 * PropertyPanel Class. Lightweight component that up updated its innerHTML when properties change.
 * Gets passed the widget type, and a JSON object containing all the widget properties 
 */
class PropertyPanel {
  constructor(type, properties) {
    this.type = type;
    var panel = document.querySelector('.property-panel');

    Object.entries(properties).forEach((entry) => {
      const [key, value] = entry;
      var propertyDiv = document.createElement('div');
      propertyDiv.classList.add('property');

      var label = document.createElement('label');
      let text = `${key}`

      let result = text.replace(/([A-Z])/g, " $1");
      const separatedName = result.charAt(0).toUpperCase() + result.slice(1);
      label.textContent = separatedName;
      propertyDiv.appendChild(label);

      var input = document.createElement('input');
      input.id = text;
      input.dataset.parent = properties.name;

      if (text.toLowerCase().indexOf("colour") != -1) {
        input.type = 'color';
        function rgbToHex(rgbText) {
          return rgbText.replace(/rgb\((.+?)\)/ig, (_, rgb) => {
            return '#' + rgb.split(',')
              .map(str => parseInt(str, 10).toString(16).padStart(2, '0'))
              .join('')
          })
        }
        input.value = rgbToHex(`rgb(${value})`);
      }
      else {
        input.type = 'text';
        input.value = `${value}`;
      }

      input.addEventListener('input', function (evt) {
        if (evt.target.type === 'color') {
          // function rgbToHex(rgbText) {
          //   return rgbText.replace(/rgb\((.+?)\)/ig, (_, rgb) => {
          //     return '#' + rgb.split(',')
          //       .map(str => parseInt(str, 10).toString(16).padStart(2, '0'))
          //       .join('')
          //   })
          // }
          // input.value = rgbToHex(`rgb(${value})`);
          widgets.forEach((widget) => {
            if (widget.name == evt.target.dataset.parent) {
              widget.props[evt.target.id] = evt.target.value;
              console.log(widget.props);
              vscode.postMessage({
                command: 'widgetUpdate',
                text: JSON.stringify(widget.props)
              })
            }
          })
        }
        else {
          console.log(evt.target.id);
        }

      }, this);

      propertyDiv.appendChild(input);

      if (panel)
        panel.appendChild(propertyDiv);
    });
  }
};

/**
 * Add listener for context menu
 */
form.addEventListener("contextmenu", e => {
  e.preventDefault();
  let x = e.offsetX, y = e.offsetY,
    winWidth = window.innerWidth,
    winHeight = window.innerHeight,
    cmWidth = contextMenu.offsetWidth,
    cmHeight = contextMenu.offsetHeight;
  x = x > winWidth - cmWidth ? winWidth - cmWidth - 5 : x;
  y = y > winHeight - cmHeight ? winHeight - cmHeight - 5 : y;

  contextMenu.style.left = `${x}px`;
  contextMenu.style.top = `${y}px`;
  contextMenu.style.visibility = "visible";
});
document.addEventListener("click", () => contextMenu.style.visibility = "hidden");

new PropertyPanel('slider', currentWidget);

/**
 * Add a click callback listener for each item in the menu. Within the click callback
 * a new widget is added to the form, and a new widget object is pushed to the widgets array. 
 * Assigning class type 'resize-drag' gives it draggable and resizable functionality. 
 */

let menuItems = document.getElementsByTagName('*');
for (var i = 0; i < menuItems.length; i++) {
  if (menuItems[i].getAttribute('class') == 'menuItem') {
    menuItems[i].addEventListener("click", (e) => {
      DBG("contextMenuItemClicks()");
      insertWidget(e.target.innerHTML, {});
    });
  }
}

/**
 * insets a new widget to the form, this can be called when loading/saving a file, or when we right-
 * click and add widgets
 */
function insertWidget(type, props) {
  const widgetType = type
  const widgetDiv = document.createElement('div');
  widgetDiv.className = 'resize-drag';
  widgetDiv.id = widgetType + String(numberOfWidgets);

  if (form) {
    form.appendChild(widgetDiv);
  }

  const element = document.getElementById(widgetDiv.id);

  if (element) {
    element.innerHTML = rotarySliderSvg;
  }

  let widget;


  switch (type) {
    case "rslider":
      widget = new RotarySlider(widgetDiv.id);
      //widgets.push(new RotarySlider(widgetDiv.id));
      break;
    case "form":
      widget = new Form(widgetDiv.id);
    //widgets.push(new Form(widgetDiv.id));
    default:
      break;
  }

  //if a new widget added in the webview
  if (Object.keys(props).length === 0) {
    widgets.push(widget);
  }
  //a new widget created on file save/load
  else {
    Object.entries(props).forEach((entry) => {
      const [key, value] = entry;
      widget[key] = value;
    });

    widgets.push(widget);
    widgetDiv.style.transform = 'translate(' + widget.left + 'px,' + widget.top + 'px)';
    widgetDiv.setAttribute('data-x', widget.left);
    widgetDiv.setAttribute('data-y', widget.top);
  }
}



