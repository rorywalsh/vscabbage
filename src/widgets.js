
const formProps = {
  "top": 0,
  "left": 0,
  "width": 600,
  "height": 300,
  "caption": "",
  "name": "MainForm",
  "type": "form",
  "guiRefresh": 128,
  "identChannel": "",
  "automatable": 0.0,
  "visible": 1,
  "scrollbars": 0,
  "titleBarColour": '57, 70, 76',
  "titleBarGradient": 0.15,
  "titleBarHeight": 24,
  "style": "",
  "channelType": "number",
  "colour": '2, 149, 207'
}

const rotarySliderProps = {
  "top": 10,
  "left": 10,
  "width": 60,
  "height": 60,
  "textBoxOutlineColour": '245, 245, 245',
  "channel": 'rslider',
  "min": 0,
  "max": 1,
  "value": 0,
  "sliderSkew": 1,
  "increment": .001,
  "text": "",
  "valueTextBox": 0.,
  "textBoxColour": '245, 245, 245',
  "colour": '2, 149, 207',
  "trackerColour": '147, 210, 0',
  "trackerBgColour": '0, 0, 0',
  "markerColour": '80, 80, 80',
  "markerThickness": 1,
  "markerStart": 0.5,
  "markerEnd": 0.9,
  "fontColour": '245, 245, 245',
  "textColour": '245, 245, 245',
  "outlineColour": '20, 20, 20',
  "name": "",
  "type": "rslider",
  "kind": "rotary",
  "decimalPlaces": 1,
  "velocity": 0,
  "identChannel": "",
  "trackerThickness": 1,
  "trackerInsideRadius": .7,
  "trackerOutsideRadius": 1,
  "trackerStart": 0.1,
  "trackerEnd": 0.9,
  "trackerCentre": 0.1,
  "visible": 1,
  "automatable": 1,
  "valuePrefix": "",
  "valuePostfix": ""
}

export function DefaultWidgetProps(widget) {
  switch (widget) {
      case "form":
          return { ...formProps }; // Return a shallow copy of formProps
      case "rslider":
          return { ...rotarySliderProps }; // Return a shallow copy of rotarySliderProps
      default:
          return {}; // Return an empty object for unknown widget types
  }
}

// export class Form {
//   constructor(name) {
//     this.name = name;
//     this.props = GetDefaultPropsFor("form");
//     this.props.name = name;
//   }
// }

// export class RotarySlider {
//   constructor(name) {
//     this.name = name;
//     this.props = GetDefaultPropsFor("rslider");
//     this.props.name = name;
//   }
// }


export function WidgetSVG(type) {
  switch (type) {
    case 'rslider':
      return `
      <svg width="100%" height="100%" viewBox="0 0 87 99" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M65.9417 80.5413C73.837 75.7352 79.9735 68.5131 83.4416 59.9454C86.9097 51.3777 87.5248 41.9205 85.1957 32.9758C82.8666 24.031 77.7173 16.0749 70.511 10.2866C63.3048 4.49843 54.4253 1.18627 45.1887 0.841165C35.9522 0.496059 26.8503 3.13637 19.2322 8.37071C11.6142 13.6051 5.88549 21.1548 2.8954 29.9008C-0.0946829 38.6468 -0.187024 48.1235 2.63207 56.9261C5.45116 65.7287 11.0316 73.3886 18.5462 78.7704L43.5833 43.8112L65.9417 80.5413Z" fill="#060606"/>
<circle cx="44" cy="44" r="33" fill="#F3F3F3"/>
<rect x="23" y="66.8579" width="13.3991" height="5.72696" rx="1" transform="rotate(-54.1296 23 66.8579)" fill="#4F4F4F"/>
</svg>
      `;
    default:
      return "";
  }
}