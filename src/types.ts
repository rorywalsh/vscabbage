
// Import widgets and utilities
// @ts-ignore
import { RotarySlider } from "./cabbage/widgets/rotarySlider.js";
// @ts-ignore
import { HorizontalSlider } from "./cabbage/widgets/horizontalSlider.js";
// @ts-ignore
import { HorizontalRangeSlider } from "./cabbage/widgets/horizontalRangeSlider.js";
// @ts-ignore
import { VerticalSlider } from "./cabbage/widgets/verticalSlider.js";
// @ts-ignore
import { NumberSlider } from "./cabbage/widgets/numberSlider.js";
// @ts-ignore
import { Button, FileButton, OptionButton } from "./cabbage/widgets/button.js";
// @ts-ignore
import { Checkbox } from "./cabbage/widgets/checkBox.js";
// @ts-ignore
import { ComboBox } from "./cabbage/widgets/comboBox.js";
// @ts-ignore
import { Label } from "./cabbage/widgets/label.js";
// @ts-ignore
import { GroupBox } from "./cabbage/widgets/groupBox.js";
// @ts-ignore
import { Image } from "./cabbage/widgets/image.js";
// @ts-ignore
import { ListBox } from "./cabbage/widgets/listBox.js";
// @ts-ignore
import { CsoundOutput } from "./cabbage/widgets/csoundOutput.js";
// @ts-ignore
import { MidiKeyboard } from "./cabbage/widgets/midiKeyboard.js";
// @ts-ignore
import { GenTable } from "./cabbage/widgets/genTable.js";
// @ts-ignore
import { TextEditor } from "./cabbage/widgets/textEditor.js";
// @ts-ignore
import { Form } from "./cabbage/widgets/form.js";

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

