console.log("loading widgetTypes.js...");
// // Import widgets and utilities
// @ts-ignore
import { RotarySlider } from "./widgets/rotarySlider.js";
// @ts-ignore
import { HorizontalSlider } from "./widgets/horizontalSlider.js";
// @ts-ignore
import { HorizontalRangeSlider } from "./widgets/horizontalRangeSlider.js";
// @ts-ignore
import { VerticalSlider } from "./widgets/verticalSlider.js";
// @ts-ignore
import { NumberSlider } from "./widgets/numberSlider.js";
// @ts-ignore
import { Button } from "./widgets/button.js";
// @ts-ignore
import { FileButton } from "./widgets/fileButton.js";
// @ts-ignore
import { OptionButton } from "./widgets/optionButton.js";
// @ts-ignore
import { Checkbox } from "./widgets/checkBox.js";
// @ts-ignore
import { ComboBox } from "./widgets/comboBox.js";
// @ts-ignore
import { Label } from "./widgets/label.js";
// @ts-ignore
import { GroupBox } from "./widgets/groupBox.js";
// @ts-ignore
import { Image } from "./widgets/image.js";
// @ts-ignore
import { ListBox } from "./widgets/listBox.js";
// @ts-ignore
import { CsoundOutput } from "./widgets/csoundOutput.js";
// @ts-ignore
import { MidiKeyboard } from "./widgets/keyboard.js";
// @ts-ignore
import { GenTable } from "./widgets/genTable.js";
// @ts-ignore
import { TextEditor } from "./widgets/textEditor.js";
// @ts-ignore
import { Form } from "./widgets/form.js";


export const widgetConstructors = {
	//add new widgets here, first the name, then the constructor
	"rotarySlider": RotarySlider,
	"horizontalSlider": HorizontalSlider,
	"horizontalRangeSlider": HorizontalRangeSlider,
	"verticalSlider": VerticalSlider,
	"numberSlider": NumberSlider,
	"keyboard": MidiKeyboard,
	"form": Form,
	"button": Button,
	"fileButton": FileButton,
	"optionButton": OptionButton,
	"genTable": GenTable,
	"label": Label,
	"image": Image,
	"listBox": ListBox,
	"comboBox": ComboBox,
	"groupBox": GroupBox,
	"checkBox": Checkbox,
	"csoundOutput": CsoundOutput,
	"textEditor": TextEditor
};

export const WidgetProps = {
	"type": "",
	"channel": "",
	"key": ""
};

// Extract widget types directly from keys
export const widgetTypes = Object.keys(widgetConstructors);

/**
 * Initialise default properties based on widget type
 * @param {string} type - The type of widget to initialize.
 * @returns {Object} - The default properties of the widget.
 */
export async function initialiseDefaultProps(type) {
	const WidgetConstructor = widgetConstructors[type];
	if (WidgetConstructor) {
		return new WidgetConstructor().props;
	} else {
		console.error("Found unsupported widget type:", type);
		return null;
	}
}

