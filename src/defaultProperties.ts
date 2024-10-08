
// Import widgets and utilities
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
import { Button, FileButton, OptionButton } from "./widgets/button.js";
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
import { MidiKeyboard } from "./widgets/midiKeyboard.js";
// @ts-ignore
import { GenTable } from "./widgets/genTable.js";
// @ts-ignore
import { TextEditor } from "./widgets/textEditor.js";
// @ts-ignore
import { Form } from "./widgets/form.js";

export interface WidgetProps {
	type: string;
	channel?: string;
	[key: string]: any;
}

export async function initialiseDefaultProps(type: string): Promise<WidgetProps | null> {
	switch (type) {
		case 'rotarySlider':
			return new RotarySlider().props;
		case 'horizontalSlider':
			return new HorizontalSlider().props;
		case 'verticalSlider':
			return new VerticalSlider().props;
		case 'horizontalRangeSlider':
			return new HorizontalRangeSlider().props;
		case 'numberSlider':
			return new NumberSlider().props;
		case 'keyboard':
			return new MidiKeyboard().props;
		case 'button':
			return new Button().props;
		case 'gentable':
			return new GenTable().props;
		case 'fileButton':
			return new FileButton().props;
		case 'optionButton':
			return new OptionButton().props;
		case 'checkBox':
			return new Checkbox().props;
		case 'comboBox':
			return new ComboBox().props;
		case 'groupBox':
			return new GroupBox().props;
		case 'image':
			return new Image().props;
		case 'listBox':
			return new ListBox().props;
		case 'form':
			return new Form().props;
		case 'label':
			return new Label().props;
		case 'csoundOutput':
			return new CsoundOutput().props;
		case 'textEditor':
			return new TextEditor().props;
		default:
			console.error("Found unsupported widget type:", type);
			return null;
	}
}

