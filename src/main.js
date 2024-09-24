//widgets ---------------
import { Form } from "./widgets/form.js";
import { RotarySlider } from "./widgets/rotarySlider.js";
import { HorizontalSlider } from "./widgets/horizontalSlider.js";
import { HorizontalRangeSlider } from "./widgets/horizontalRangeSlider.js";
import { VerticalSlider } from "./widgets/verticalSlider.js";
import { NumberSlider } from "./widgets/numberSlider.js";
import { Button, FileButton, OptionButton } from "./widgets/button.js";
import { Checkbox } from "./widgets/checkbox.js";
import { ComboBox } from "./widgets/comboBox.js";
import { Label } from "./widgets/label.js";
import { Image } from "./widgets/image.js";
import { ListBox } from "./widgets/listBox.js";
import { GroupBox } from "./widgets/GroupBox.js";
import { GenTable } from "./widgets/genTable.js";
import { CsoundOutput } from "./widgets/csoundOutput.js";
import { MidiKeyboard } from "./widgets/midiKeyboard.js";
import { TextEditor } from "./widgets/textEditor.js";
//------------------------


const widgetConstructors = {
  //add new widgets here, first the name, then the constructor
  "rotarySlider": RotarySlider,
  "hslider": HorizontalSlider,
  "hrange": HorizontalRangeSlider,
  "vslider": VerticalSlider,
  "nslider": NumberSlider,
  "keyboard": MidiKeyboard,
  "form": Form,
  "button": Button,
  "filebutton": FileButton,
  "optionbutton": OptionButton,
  "gentable": GenTable,
  "label": Label,
  "image": Image,
  "listbox": ListBox,
  "combobox": ComboBox,
  "groupbox": GroupBox,
  "checkbox": Checkbox,
  "csoundoutput": CsoundOutput,
  "texteditor": TextEditor
};

//for use by the context menu accessed when adding new widgets
const widgetTypes = Object.keys(widgetConstructors);


import { PropertyPanel } from "./propertyPanel.js";
import { CabbageUtils, CabbageTestUtilities, CabbageColours } from "./utils.js";
import { Cabbage } from "./cabbage.js";

console.log("main.js loaded!")

// CabbageTestUtilities.generateIdentifierTestCsd(widgetsForTesting); // This will generate a test CSD file with the widgets

let vscode = null;
let widgetWrappers = null;
let selectedElements = new Set();
const widgets = [];

if (typeof acquireVsCodeApi === 'function') {
  vscode = acquireVsCodeApi();
  try {
    const module = await import("./widgetWrapper.js");
    const { WidgetWrapper } = module;
    // You can now use WidgetWrapper here
    widgetWrappers = new WidgetWrapper(PropertyPanel.updatePanel, selectedElements, widgets, vscode);
  } catch (error) {
    console.error("Error loading widgetWrapper.js:", error);
  }
}

Cabbage.sendCustomCommand(vscode, 'cabbageIsReadyToLoad');




let cabbageMode = 'nonDraggable';
const leftPanel = document.getElementById('LeftPanel');
if (leftPanel)
  leftPanel.className = "full-height-div nonDraggable"

const rightPanel = document.getElementById('RightPanel');
if (rightPanel)
  rightPanel.style.visibility = "hidden";


// const form = document.getElementById('MainForm');
// form.style.backgroundColor = widgets[0].props.colour;


CabbageUtils.showOverlay();


/**
 * called from the webview panel on startup, and when a user saves/updates or changes .csd file
 */
window.addEventListener('message', async event => {
  const message = (event.data);
  const mainForm = document.getElementById('MainForm');

  switch (message.command) {
    //when users change the snapToSize settings
    case 'snapToSize':
      widgetWrappers.setSnapSize(parseInt(message.text));
      break;

    //when the host, i.e, a Cabbage plugin, or VS-Code first loads, it will call this for each
    //widgets. It will subsequently then call it each time a widget is updated, message contains, 
    //'channel', 'command' and 'data'
    case 'widgetUpdate':
      CabbageUtils.hideOverlay();
      const updateMsg = message;
      updateWidget(updateMsg);
      break;

    //called when a user saves a file. First we clear the widget array, then Cabbage will update it from the plugin
    case 'onFileChanged':
      cabbageMode = 'nonDraggable';
      if (mainForm) {
        mainForm.remove();
      }
      else {
        console.error("MainForm not found");
      }
      // leftPanel.innerHTML = '';
      widgets.length = 0;
      break;

    case 'onEnterEditMode':
      CabbageUtils.hideOverlay();
      cabbageMode = 'draggable';
      const widgetUpdatesMessages = [];
      widgets.forEach(widget => {
        widgetUpdatesMessages.push({ command: "widgetUpdate", channel: widget.props.channel, data: JSON.stringify(widget.props) });
      });
      if (mainForm) {
        mainForm.remove();
      }
      else {
        console.error("MainForm not found");
      }
      widgets.length = 0;
      widgetUpdatesMessages.forEach(msg => updateWidget(msg));
      //form.className = "form draggable";
      break;

    //called each time there are new Csound console messages to display
    case 'csoundOutputUpdate':
      // Find csoundOutput widget
      let csoundOutput = widgets.find(widget => widget.props.channel === 'csoundoutput');
      if (csoundOutput) {
        // Update the HTML content of the widget's div
        const csoundOutputDiv = CabbageUtils.getWidgetDiv(csoundOutput.props.channel);
        if (csoundOutputDiv) {
          csoundOutputDiv.innerHTML = csoundOutput.getInnerHTML();
          csoundOutput.appendText(message.text);
        }
      }
      break;

    default:
      return;
  }
});

/*
* this is called from the plugin and will update a corresponding widget
*/
function updateWidget(obj) {
  
  const channel = obj['channel'];
  let widgetFound = false;
  for (const widget of widgets) {
    if (widget.props.channel === channel) {
      widgetFound = true;
      console.log("props", widget.props);
      if (obj.hasOwnProperty('data')) {
        widget.props = JSON.parse(obj["data"]);
      } else {
        console.error("obj has no data property:", obj);
      }

      const widgetElement = CabbageUtils.getWidgetDiv(widget.props.channel);
      if (widgetElement) {
        widgetElement.style.transform = 'translate(' + widget.props.left + 'px,' + widget.props.top + 'px)';

        widgetElement.setAttribute('data-x', widget.props.left);
        widgetElement.setAttribute('data-y', widget.props.top);
        // widgetElement.style.top = `${widget.props.top}px`;
        // widgetElement.style.left = `${widget.props.left}px`;
        if (widget.props.type !== "form") {
          widgetElement.innerHTML = widget.getInnerHTML();
        }

      }
      else{
        console.error("Widget not found:", widget.props.channel);
      }

      //gentable and form are unique cases...
      if (widget.props.type == "gentable") {
        widget.updateTable();
      } else if (widget.props.type == "form") {
        // console.log("updating form svg from widgetUpdate");
        widget.updateSVG();
      }
    }
  }

  //the first time updateWidget is called from the host, it will populate the widgets array
  if (!widgetFound && obj.hasOwnProperty('data')) {
    try {
      let p = JSON.parse(obj.data);
      if (typeof p === 'string') {
        p = JSON.parse(p);
      }

      if (p.hasOwnProperty('type')) {
        insertWidget(p.type, p);
      }
    } catch (error) {
      console.error("Error parsing JSON data:", error, obj.data);
    }
  }
}



// Function to create widget dynamically based on type
function createWidget(type) {
  const WidgetClass = widgetConstructors[type];
  if (WidgetClass) {
    const widget = new WidgetClass();
    if (type === "gentable") {
      widget.createCanvas(); // Additional logic specific to "gentable"
    }
    return widget;
  } else {
    console.error("Unknown widget type: " + type);
    return null;
  }
}
/**
 * insets a new widget to the form, this can be called when loading/saving a file, or when we right-
 * click and add widgets
 */
async function insertWidget(type, props) {
  const widgetDiv = document.createElement('div');
  widgetDiv.id = props.channel;

  const widget = createWidget(type);
  if (!widget) {
    console.error("Failed to create widget of type:", type);
    return;
  }

  widgetDiv.className = (type === "form") ? "resizeOnly" : cabbageMode;

  if (cabbageMode === 'draggable') {
    widgetDiv.addEventListener('pointerdown', (e) => handlePointerDown(e, widgetDiv));
  }

  Object.assign(widget.props, props);
  widgets.push(widget);
  console.warn(widget.props);
  widget.parameterIndex = CabbageUtils.getNumberOfPluginParameters(widgets) - 1;

  if (cabbageMode === 'nonDraggable') {
    setupNonDraggableMode(widget, widgetDiv);
  }

  if (widget.props.type !== "form") {
    widgetDiv.innerHTML = widget.getInnerHTML();
    appendToMainForm(widgetDiv);
  } else if (widget.props.type === "form") {
    setupFormWidget(widget);
  } else if (widget.props.type === "gentable") {
    widget.updateTable();
  }

  updateWidgetStyles(widgetDiv, widget.props);
  return widget.props;
}

function handlePointerDown(e, widgetDiv) {
  if (e.altKey || e.shiftKey) {
    widgetDiv.classList.toggle('selected');
    updateSelectedElements(widgetDiv);
  } else if (!widgetDiv.classList.contains('selected')) {
    selectedElements.forEach(element => element.classList.remove('selected'));
    selectedElements.clear();
    widgetDiv.classList.add('selected');
    selectedElements.add(widgetDiv);
  }
}

function updateSelectedElements(widgetDiv) {
  if (widgetDiv.classList.contains('selected')) {
    selectedElements.add(widgetDiv);
  } else {
    selectedElements.delete(widgetDiv);
  }
}

//only add listeners if we are in non-draggable mode, and they are available
function setupNonDraggableMode(widget, widgetDiv) {
  if (typeof acquireVsCodeApi === 'function') {
    if (!vscode) {
      vscode = acquireVsCodeApi();
    }
    if (typeof widget.addVsCodeEventListeners === 'function') {
      widget.addVsCodeEventListeners(widgetDiv, vscode);
    }
  } else if (widget.props.type !== "form") {
    console.log("adding listeners for:", widget);
    if (typeof widget.addEventListeners === 'function') {
      widget.addEventListeners(widgetDiv);
    }
  }
}

function appendToMainForm(widgetDiv) {
  const form = document.getElementById('MainForm');
  if (form) {
    console.log("Appending to form");
    form.appendChild(widgetDiv);
  } else {
    console.error("MainForm not found");
  }
}

function setupFormWidget(widget) {
  const formDiv = document.createElement('div');
  formDiv.id = 'MainForm';

  if (vscode) {
    // New structure for vscode
    formDiv.className = "form resizeOnly";

    // Create the inner structure
    const wrapperDiv = document.createElement('div');
    wrapperDiv.className = 'wrapper';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'content';
    contentDiv.style.overflowY = 'auto';

    const ulMenu = document.createElement('ul');
    ulMenu.className = 'menu';

    let menuItems = "";
    widgetTypes.forEach((widget) => {
      menuItems += `
			<li class="menuItem">
			<span>${widget}</span>
	  		</li>
			`;
    });

    ulMenu.innerHTML = menuItems;

    // Append the inner elements
    contentDiv.appendChild(ulMenu);
    wrapperDiv.appendChild(contentDiv);
    formDiv.appendChild(wrapperDiv);

    // Append MainForm to the LeftPanel
    const leftPanel = document.getElementById('LeftPanel');
    if (leftPanel) {
      leftPanel.appendChild(formDiv);
    } else {
      console.error("LeftPanel not found");
    }
  } else {
    // Old way for non-vscode
    formDiv.className = "form nonDraggable";
    document.body.appendChild(formDiv);
  }

  // Set MainForm properties and styles
  const form = document.getElementById('MainForm');
  if (form) {
    form.style.width = widget.props.width + "px";
    form.style.height = widget.props.height + "px";
    form.style.top = '0px';
    form.style.left = '0px';
    console.log("updating form");

    // Call widget's updateSVG method
    if (typeof widget.updateSVG === 'function') {
      console.log("updating form svg whilst setting up form widget");
      widget.updateSVG();
      const selectionColour = CabbageColours.invertColor(widget.props.colour);
      CabbageColours.changeSelectedBorderColor(selectionColour);
    }
  } else {
    console.error("MainForm not found");
  }

  // Call setupFormHandlers function
  if (typeof setupFormHandlers === 'function') {
    setupFormHandlers();
  }
}


function updateWidgetStyles(widgetDiv, props) {
  widgetDiv.style.position = 'absolute';
  widgetDiv.style.transform = `translate(${props.left}px, ${props.top}px)`;

  //if we use translate we need to ensure x/y are 0. 
  widgetDiv.style.top = '0px'
  widgetDiv.style.left = '0px'

  widgetDiv.setAttribute('data-x', props.left);
  widgetDiv.setAttribute('data-y', props.top);
  widgetDiv.style.width = props.width + 'px';
  widgetDiv.style.height = props.height + 'px';
}


/*
* This function is called when we are in non-draggable mode. It will add a listener to the form
* to handle selection of widgets.
*/
function setupFormHandlers() {
  // Create context menu dynamically
  const groupContextMenu = document.createElement("div");
  groupContextMenu.id = "dynamicContextMenu";
  groupContextMenu.style.position = "absolute";
  groupContextMenu.style.visibility = "hidden";
  groupContextMenu.style.backgroundColor = "#fff";
  groupContextMenu.style.border = "1px solid #ccc";
  groupContextMenu.style.boxShadow = "0 2px 10px rgba(0,0,0,0.2)";
  groupContextMenu.style.zIndex = 10000; // Ensure it's on top

  // Create menu items
  const groupOption = document.createElement("div");
  groupOption.innerText = "Group";
  groupOption.style.padding = "8px";
  groupOption.style.cursor = "pointer";

  const unGroupOption = document.createElement("div");
  unGroupOption.innerText = "Ungroup";
  unGroupOption.style.padding = "8px";
  unGroupOption.style.cursor = "pointer";

  // Append items to the context menu
  groupContextMenu.appendChild(groupOption);
  groupContextMenu.appendChild(unGroupOption);

  // Append context menu to the document body
  document.body.appendChild(groupContextMenu);

  // Add event listeners for the menu options
  groupOption.addEventListener("click", () => {
    console.log("Group option clicked");
    contextMenu.style.visibility = "hidden";
    // Add your "Group" functionality here
  });

  unGroupOption.addEventListener("click", () => {
    console.log("Ungroup option clicked");
    contextMenu.style.visibility = "hidden";
    // Add your "Ungroup" functionality here
  });


  const contextMenu = document.querySelector(".wrapper");
  const form = document.getElementById('MainForm');
  /**
   * Add listener for context menu. Also keeps the current x and x positions 
   * in case a user adds a widget
   */
  if (typeof acquireVsCodeApi === 'function') {
    let mouseDownPosition = {};
    if (form && contextMenu) {
      form.addEventListener("contextmenu", e => {
        console.log("context menu");
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();

        //widgetsContentMenu
        let x = e.offsetX, y = e.offsetY,
          winWidth = window.innerWidth,
          winHeight = window.innerHeight,
          cmWidth = contextMenu.offsetWidth,
          cmHeight = contextMenu.offsetHeight;

        x = x > winWidth - cmWidth ? winWidth - cmWidth - 5 : x;
        y = y > winHeight - cmHeight ? winHeight - cmHeight - 5 : y;

        contextMenu.style.left = `${x}px`;
        contextMenu.style.top = `${y}px`;

        
        //groupContextMenu
        x = e.clientX, y = e.clientY;
        x = x > winWidth - cmWidth ? winWidth - cmWidth - 5 : x;
        y = y > winHeight - cmHeight ? winHeight - cmHeight - 5 : y;
        groupContextMenu.style.left = `${x}px`; 
        groupContextMenu.style.top = `${y}px`;

        mouseDownPosition = { x: x, y: y };
        if (cabbageMode === 'draggable' && e.target.id === "MainForm") {
          contextMenu.style.visibility = "visible";
        } else {
          groupContextMenu.style.visibility="visible";
        }
          

      });

      // form.addEventListener("click", () => {
      //   console.log("Hiding context menu");
      //   contextMenu.style.visibility = "hidden"
      //   groupContextMenu.style.visibility = "hidden"
      // });

      // new PropertyPanel('slider', currentWidget, {});

      /**
       * Add a click callback listener for each item in the menu. Within the click callback
       * a new widget is added to the form, and a new widget object is pushed to the widgets array. 
       * Assigning class type 'editMode' gives it draggable and resizable functionality. 
       */
      let menuItems = document.getElementsByTagName('*');
      for (var i = 0; i < menuItems.length; i++) {
        if (menuItems[i].getAttribute('class') === 'menuItem') {
          menuItems[i].addEventListener("pointerdown", async (e) => {
            console.log('clicked');
            e.stopImmediatePropagation();
            e.stopPropagation();
            const type = e.target.innerHTML.replace(/(<([^>]+)>)/ig);
            console.warn("Adding widget of type:", type);
            contextMenu.style.visibility = "hidden";
            const channel = CabbageUtils.getUniqueChannelName(type, widgets);
            const w = await insertWidget(type, { channel: channel, top: mouseDownPosition.y - 20, left: mouseDownPosition.x - 20 });
            if (widgets) {
              //update text editor with last added widget
              vscode.postMessage({
                command: 'widgetUpdate',
                text: JSON.stringify(w)
              });
            }

          });
        }
      }
    }
    else {
      console.error("MainForm or contextMenu not found");
    }
  }

  /*
   * Various listeners for the main form to handle grouping ans moving of multiple elements
   */
  if (form) {
    let isSelecting = false;
    let isDragging = false;
    let selectionBox;
    let startX, startY;
    let offsetX = 0;
    let offsetY = 0;

    form.addEventListener('pointerdown', (event) => {

      if (event.button !== 0) {
        return;
      }
      else{
        contextMenu.style.visibility = "hidden"
        groupContextMenu.style.visibility = "hidden"
      }


      const clickedElement = event.target;
      const selectionColour = CabbageColours.invertColor(event.target.getAttribute('fill'));

      const formRect = form.getBoundingClientRect();
      offsetX = formRect.left;
      offsetY = formRect.top;

      if ((event.shiftKey || event.altKey) && event.target.id === "MainForm") {
        // Start selection mode
        isSelecting = true;
        startX = event.clientX - offsetX;
        startY = event.clientY - offsetY;
        selectionBox = document.createElement('div');
        selectionBox.style.position = 'absolute';
        selectionBox.style.border = '1px dashed #000';
        selectionBox.style.borderColor = `${selectionColour}`
        selectionBox.style.backgroundColor = `${CabbageColours.adjustAlpha(selectionColour, .4)}`;
        selectionBox.style.zIndex = 9999;

        selectionBox.style.left = `${startX}px`;
        selectionBox.style.top = `${startY}px`;
        form.appendChild(selectionBox);
      } else if (clickedElement.classList.contains('draggable') && event.target.id !== "MainForm") {
        if (!event.shiftKey && !event.altKey) {
          // Deselect all elements if clicking on a non-selected element without Shift or Alt key
          if (!selectedElements.has(clickedElement)) {
            selectedElements.forEach(element => element.classList.remove('selected'));
            selectedElements.clear();
            selectedElements.add(clickedElement);
          }
          clickedElement.classList.add('selected');
        } else {
          // Toggle selection cabbageSetupComplete if Shift or Alt key is pressed
          clickedElement.classList.toggle('selected');
          if (clickedElement.classList.contains('selected')) {
            selectedElements.add(clickedElement);
          } else {
            selectedElements.delete(clickedElement);
          }
        }
      }

      if (event.target.id === "MainForm") {
        // Deselect all elements if clicking on the form without Shift or Alt key
        selectedElements.forEach(element => element.classList.remove('selected'));
        selectedElements.clear();
      }

      if (!event.shiftKey && !event.altKey) {
        if (cabbageMode === 'draggable') {
          PropertyPanel.updatePanel(vscode, { eventType: "click", name: CabbageUtils.findValidId(event), bounds: {} }, widgets);
        }
      }
    });

    document.addEventListener('pointermove', (event) => {
      if (isSelecting) {
        const currentX = event.clientX - offsetX;
        const currentY = event.clientY - offsetY;

        selectionBox.style.width = `${Math.abs(currentX - startX)}px`;
        selectionBox.style.height = `${Math.abs(currentY - startY)}px`;
        selectionBox.style.left = `${Math.min(currentX, startX)}px`;
        selectionBox.style.top = `${Math.min(currentY, startY)}px`;
      }

      if (isDragging && selectionBox) {
        const currentX = event.clientX;
        const currentY = event.clientY;

        const boxWidth = selectionBox.offsetWidth;
        const boxHeight = selectionBox.offsetHeight;

        const parentWidth = form.offsetWidth;
        const parentHeight = form.offsetHeight;

        const maxX = parentWidth - boxWidth;
        const maxY = parentHeight - boxHeight;

        let newLeft = currentX - offsetX;
        let newTop = currentY - offsetY;

        newLeft = Math.max(0, Math.min(maxX, newLeft));
        newTop = Math.max(0, Math.min(maxY, newTop));

        selectionBox.style.left = `${newLeft}px`;
        selectionBox.style.top = `${newTop}px`;
      }
    });

    document.addEventListener('pointerup', (event) => {
      if (isSelecting) {
        const rect = selectionBox.getBoundingClientRect();
        const elements = form.querySelectorAll('.draggable');

        elements.forEach((element) => {
          const elementRect = element.getBoundingClientRect();

          // Check for intersection between the element and the selection box
          if (elementRect.right >= rect.left &&
            elementRect.left <= rect.right &&
            elementRect.bottom >= rect.top &&
            elementRect.top <= rect.bottom) {
            element.classList.add('selected');
            selectedElements.add(element);
          }
        });

        form.removeChild(selectionBox);
        isSelecting = false;
      }

      isDragging = false;
    });
    if (selectionBox) {
      selectionBox.addEventListener('pointerdown', (event) => {
        isDragging = true;
        offsetX = event.clientX - selectionBox.getBoundingClientRect().left;
        offsetY = event.clientY - selectionBox.getBoundingClientRect().top;
        event.stopPropagation();
      });
    }
  }
}