import json
import os
import re
from pathlib import Path
import argparse

class Cabbage2To3Converter:
    def __init__(self):
        self.widget_counter = 0
        
        # Mapping from Cabbage2 widget names to Cabbage3 widget names
        self.widget_type_mapping = {
            'hslider': 'horizontalSlider',
            'vslider': 'verticalSlider', 
            'rslider': 'rotarySlider',
            'nslider': 'numberSlider',
            'hrange': 'horizontalRangeSlider',
            'checkbox': 'checkBox',
            'combobox': 'comboBox',
            'groupbox': 'groupBox',
            'optionbutton': 'optionButton',
            'keyboard': 'keyboard',
            'gentable': 'genTable',
            'texteditor': 'textEditor',
            'csoundoutput': 'csoundOutput',
            'filebutton': 'fileButton',
            'listbox': 'listBox',
            'image': 'image',
            'label': 'label',
            'button': 'button',
            'form': 'form'
        }

    def generate_unique_channel(self, widget_type):
        """Generate a unique channel name for a widget"""
        self.widget_counter += 1
        return f"{widget_type}_{self.widget_counter}"

    def parse_cabbage2_section(self, content):
        """Parse the Cabbage section and return list of widgets"""
        widgets = []
        lines = content.split('\n')
        i = 0

        while i < len(lines):
            line = lines[i].strip()
            if not line or line.startswith(';') or line.startswith('//'):
                i += 1
                continue

            # Check for widget start
            widget_match = re.match(r'(\w+)\s+(.+)', line)
            if widget_match:
                widget_type, properties_str = widget_match.groups()
                
                # Map Cabbage2 widget type to Cabbage3 widget type
                cabbage3_type = self.widget_type_mapping.get(widget_type.lower(), widget_type)
                widget = {'type': cabbage3_type}

                # Parse properties
                properties = self.parse_properties(properties_str)

                # Handle special properties and mappings
                self.handle_special_properties(widget, properties)

                # Add remaining properties
                for key, value in properties.items():
                    if key not in widget:
                        widget[key] = value

                # Check for children (nested widgets)
                i += 1
                if i < len(lines) and lines[i].strip() == '{':
                    children = []
                    i += 1
                    brace_count = 1

                    while i < len(lines) and brace_count > 0:
                        child_line = lines[i].strip()
                        if child_line == '{':
                            brace_count += 1
                        elif child_line == '}':
                            brace_count -= 1
                        elif brace_count == 1 and child_line:
                            # Parse child widget
                            child_match = re.match(r'(\w+)\s+(.+)', child_line)
                            if child_match:
                                child_type, child_props_str = child_match.groups()
                                
                                # Map Cabbage2 child widget type to Cabbage3 widget type
                                cabbage3_child_type = self.widget_type_mapping.get(child_type.lower(), child_type)
                                child_widget = {'type': cabbage3_child_type}

                                child_properties = self.parse_properties(child_props_str)
                                self.handle_special_properties(child_widget, child_properties)

                                # Add remaining child properties
                                for key, value in child_properties.items():
                                    if key not in child_widget:
                                        child_widget[key] = value

                                children.append(child_widget)

                        i += 1

                    if children:
                        widget['children'] = children

                widgets.append(widget)
            else:
                i += 1

        return widgets

    def parse_properties(self, properties_str):
        """Parse properties string into dictionary"""
        properties = {}
        parts = self.split_properties(properties_str)

        for part in parts:
            part = part.strip()
            if not part:
                continue

            # Handle key(value) format and key:value(value) format
            match = re.match(r'(\w+)(?::(\d+))?(?:\(([^)]*)\))?', part)
            if match:
                key, state, value_str = match.groups()
                if value_str is not None:
                    if state is not None:
                        # Handle key:state(value) format like colour:1(70,70,30)
                        value = self.parse_property_value(key, f"{state}({value_str})")
                    else:
                        value = self.parse_property_value(key, value_str)
                else:
                    # Boolean property without parentheses
                    value = True

                # Handle multiple properties with same key (like multiple colour definitions)
                if key in properties:
                    if key.lower() == 'colour' and isinstance(properties[key], dict):
                        # Merge colour dictionaries
                        if isinstance(value, dict):
                            properties[key].update(value)
                        else:
                            # If we have a simple colour and then a complex one, convert
                            if isinstance(properties[key], str):
                                properties[key] = {'fill': properties[key]}
                            if isinstance(value, str):
                                # For buttons, if we have multiple colour:1, use the last one as 'on'
                                if 'on' in properties[key]:
                                    properties[key]['on'] = value
                                else:
                                    properties[key]['fill'] = value
                    elif key.lower() == 'colour' and isinstance(value, dict):
                        # Current is simple, new is dict - convert current to dict
                        if isinstance(properties[key], str):
                            properties[key] = {'fill': properties[key]}
                        properties[key].update(value)
                    # For other properties, just keep the last value
                    else:
                        properties[key] = value
                else:
                    properties[key] = value

        return properties

    def split_properties(self, s):
        """Split properties by comma or space, respecting nested parentheses"""
        parts = []
        current = ""
        level = 0

        for char in s:
            if char == '(':
                level += 1
            elif char == ')':
                level -= 1
            elif char == ',' and level == 0:
                parts.append(current)
                current = ""
                continue
            elif char == ' ' and level == 0 and current:
                # Check if current part looks like a complete property (has parentheses or is a boolean)
                if '(' in current or current in ['latched', 'valueTextBox', 'radioGroup']:
                    parts.append(current)
                    current = ""
                    continue
            current += char

        if current:
            parts.append(current)

        return parts

    def parse_property_value(self, key, value_str):
        """Parse individual property value"""
        value_str = value_str.strip()

        # Handle colour/color properties
        if key.lower() in ['colour', 'color', 'textcolour', 'textcolor', 'trackercolour', 'trackercolor', 'outlinecolour', 'outlinecolor', 'fontcolour', 'fontcolor']:
            return self.parse_color_value(value_str)

        # Handle range
        if key.lower() == 'range':
            return self.parse_range_value(value_str)

        # Handle bounds/size
        if key.lower() in ['bounds', 'size']:
            return self.parse_bounds_value(value_str)

        # Handle text
        if key.lower() == 'text':
            return self.parse_text_value(value_str)

        # Handle numeric values
        if ',' in value_str:
            # Multiple values
            return [self.parse_single_value(v.strip()) for v in value_str.split(',')]
        else:
            return self.parse_single_value(value_str)

    def parse_color_value(self, value_str):
        """Parse color values"""
        # Handle colour:state(r,g,b) format that becomes state(r,g,b)
        match = re.match(r'(\d+)\(([^)]+)\)', value_str)
        if match:
            state, rgb = match.groups()
            rgb_values = [int(x.strip()) for x in rgb.split(',')]
            if len(rgb_values) == 3:
                color_hex = f'#{rgb_values[0]:02x}{rgb_values[1]:02x}{rgb_values[2]:02x}'
                if state == '0':
                    return {'off': color_hex}
                elif state == '1':
                    return {'on': color_hex}
        else:
            # Handle colour(r,g,b) or colour(r,g,b,a) format - with or without parentheses
            rgb_str = value_str
            if value_str.startswith('(') and value_str.endswith(')'):
                rgb_str = value_str[1:-1]
            # Check if it's RGB values (comma-separated numbers)
            if ',' in rgb_str:
                try:
                    rgb_values = [int(x.strip()) for x in rgb_str.split(',')]
                    if len(rgb_values) == 3:
                        color_hex = f'#{rgb_values[0]:02x}{rgb_values[1]:02x}{rgb_values[2]:02x}'
                        return color_hex
                    elif len(rgb_values) == 4:
                        # RGBA
                        return f'#{rgb_values[0]:02x}{rgb_values[1]:02x}{rgb_values[2]:02x}{rgb_values[3]:02x}'
                except ValueError:
                    pass  # Not RGB values
        
        # If it's a string value (like "white"), strip quotes and return as-is
        if isinstance(value_str, str):
            return value_str.strip('"')
        return value_str

    def parse_range_value(self, value_str):
        """Parse range(min,max,default,skew)"""
        values = [self.parse_single_value(v.strip()) for v in value_str.split(',')]
        range_obj = {
            'min': values[0] if len(values) > 0 else 0,
            'max': values[1] if len(values) > 1 else 1,
            'defaultValue': values[2] if len(values) > 2 else values[0] if len(values) > 0 else 0,
            'skew': values[3] if len(values) > 3 else 1,
            'increment': 0.001  # Default increment
        }
        return range_obj

    def parse_bounds_value(self, value_str):
        """Parse bounds(x,y,width,height) or size(width,height)"""
        values = [int(v.strip()) for v in value_str.split(',')]
        if len(values) == 4:
            # bounds(x,y,width,height)
            return {
                'left': values[0],
                'top': values[1],
                'width': values[2],
                'height': values[3]
            }
        elif len(values) == 2:
            # size(width,height) - used by forms
            return {
                'width': values[0],
                'height': values[1]
            }
        return value_str

    def parse_text_value(self, value_str):
        """Parse text values, handling quoted strings"""
        if '"' in value_str:
            # Split by comma but keep quoted strings together
            parts = []
            current = ""
            in_quotes = False
            for char in value_str:
                if char == '"':
                    in_quotes = not in_quotes
                elif char == ',' and not in_quotes:
                    parts.append(current)
                    current = ""
                    continue
                current += char
            if current:
                parts.append(current)

            texts = [part.strip().strip('"') for part in parts]
            if len(texts) == 1:
                return texts[0]
            elif len(texts) == 2:
                return {'on': texts[0], 'off': texts[1]}
            else:
                return texts
        else:
            return value_str.strip()

    def parse_single_value(self, value_str):
        """Parse a single value"""
        value_str = value_str.strip()

        # Strip surrounding quotes if present
        if value_str.startswith('"') and value_str.endswith('"'):
            value_str = value_str[1:-1]

        if value_str.lower() in ['true', 'false']:
            return value_str.lower() == 'true'
        try:
            # Try to parse as number
            if '.' in value_str:
                return float(value_str)
            else:
                return int(value_str)
        except ValueError:
            return value_str

    def set_nested_property(self, obj, path, value):
        """Set a nested property using dot notation"""
        keys = path.split('.')
        current = obj

        for i, key in enumerate(keys[:-1]):
            if key not in current:
                current[key] = {}
            elif not isinstance(current[key], dict):
                # If the current value is not a dict but we need to set nested properties,
                # convert it to a dict with the existing value as a default
                existing_value = current[key]
                current[key] = {'fill': existing_value}
            current = current[key]

        current[keys[-1]] = value

    def handle_special_properties(self, widget, properties):
        """Handle special property mappings and defaults"""
        widget_type = widget.get('type', '')

        # Handle text property for widgets that use text object
        if 'text' in properties and widget_type in ['button', 'checkBox', 'optionButton']:
            text_value = properties['text']
            if isinstance(text_value, str):
                # Single text state - use for both on and off
                widget['text'] = {'on': text_value, 'off': text_value}
            elif isinstance(text_value, dict):
                widget['text'] = text_value

        # Handle colour mappings - only if not already handled by nested properties
        if 'colour' in properties and 'colour' not in widget:
            colour_value = properties['colour']
            if isinstance(colour_value, dict):
                # Handle on/off colours
                if 'on' in colour_value and 'off' in colour_value:
                    widget['colour'] = {
                        'on': {'fill': colour_value['on']},
                        'off': {'fill': colour_value['off']}
                    }
                elif 'on' in colour_value:
                    widget['colour'] = {
                        'on': {'fill': colour_value['on']},
                        'off': {'fill': '#3d800a'}  # Default off colour
                    }
                elif 'off' in colour_value:
                    widget['colour'] = {
                        'on': {'fill': '#3d800a'},  # Default on colour
                        'off': {'fill': colour_value['off']}
                    }
                else:
                    # Single colour value
                    widget['colour'] = {'fill': colour_value}
            elif isinstance(colour_value, str):
                # Single colour
                widget['colour'] = {'fill': colour_value}

        # Handle textColour -> font.colour mapping
        if 'textColour' in properties:
            text_colour = properties['textColour']
            if isinstance(text_colour, str):
                # Initialize font object if it doesn't exist
                if 'font' not in widget:
                    widget['font'] = {}
                widget['font']['colour'] = text_colour
            # Remove the original property
            properties.pop('textColour', None)

        # Handle trackerColour -> colour.tracker.fill mapping for sliders
        if 'trackerColour' in properties and widget_type in ['horizontalSlider', 'verticalSlider', 'rotarySlider', 'numberSlider']:
            tracker_colour = properties['trackerColour']
            if isinstance(tracker_colour, str):
                # Initialize colour object if it doesn't exist
                if 'colour' not in widget:
                    widget['colour'] = {}
                # Initialize tracker object if it doesn't exist
                if 'tracker' not in widget['colour']:
                    widget['colour']['tracker'] = {}
                widget['colour']['tracker']['fill'] = tracker_colour
            # Remove the original property
            properties.pop('trackerColour', None)

        # Ensure all widgets have a unique channel name (except form widgets)
        if 'channel' not in widget and 'channel' not in properties and widget_type != 'form':
            widget['channel'] = self.generate_unique_channel(widget_type)

        # Only add properties that were explicitly defined in the Cabbage2 file
        # Removed set_widget_defaults call

    def convert_file(self, input_file, output_dir):
        """Convert a single Cabbage2 file to Cabbage3"""
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()

        # Extract Cabbage section
        cabbage_match = re.search(r'<Cabbage>(.*?)</Cabbage>', content, re.DOTALL)
        if not cabbage_match:
            print(f"No Cabbage section found in {input_file}")
            return

        cabbage_content = cabbage_match.group(1)

        # Parse widgets
        widgets = self.parse_cabbage2_section(cabbage_content)

        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Generate output filename
        input_name = Path(input_file).stem
        output_file = os.path.join(output_dir, f"{input_name}_cabbage3.csd")

        # Replace Cabbage section with JSON
        json_content = json.dumps(widgets, indent=4)
        new_cabbage_section = f"<Cabbage>\n{json_content}\n</Cabbage>"

        new_content = content.replace(cabbage_match.group(0), new_cabbage_section)

        # Write output file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(new_content)

        print(f"Converted {input_file} -> {output_file}")

def main():
    parser = argparse.ArgumentParser(description='Convert Cabbage2 files to Cabbage3 JSON syntax')
    parser.add_argument('input_file', help='Input Cabbage2 .csd file')
    parser.add_argument('--outdir', default=r'C:\Users\rory\OneDrive\Csoundfiles\cabbage3\converted',
                       help='Output directory for converted files')

    args = parser.parse_args()

    converter = Cabbage2To3Converter()
    converter.convert_file(args.input_file, args.outdir)

if __name__ == '__main__':
    main()