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

        # Mapping from identChannel to channel for orchestra code replacement
        self.ident_channel_mappings = {}
        
        # Track conversions applied
        self.conversions_applied = {
            'widgets_converted': 0,
            'ident_channels_mapped': 0,
            'chnset_property_ops': 0,
            'chnset_value_ops': 0,
            'chnget_ops': 0,
            'string_replacements': 0
        }
        self.color_map = {
            'aliceblue': '#f0f8ff',
            'antiquewhite': '#faebd7',
            'aqua': '#00ffff',
            'aquamarine': '#7fffd4',
            'azure': '#f0ffff',
            'beige': '#f5f5dc',
            'bisque': '#ffe4c4',
            'black': '#000000',
            'blanchedalmond': '#ffebcd',
            'blue': '#0000ff',
            'blueviolet': '#8a2be2',
            'brown': '#a52a2a',
            'burlywood': '#deb887',
            'cadetblue': '#5f9ea0',
            'chartreuse': '#7fff00',
            'chocolate': '#d2691e',
            'coral': '#ff7f50',
            'cornflowerblue': '#6495ed',
            'cornsilk': '#fff8dc',
            'crimson': '#dc143c',
            'cyan': '#00ffff',
            'darkblue': '#00008b',
            'darkcyan': '#008b8b',
            'darkgoldenrod': '#b8860b',
            'darkgray': '#a9a9a9',
            'darkgrey': '#a9a9a9',
            'darkgreen': '#006400',
            'darkkhaki': '#bdb76b',
            'darkmagenta': '#8b008b',
            'darkolivegreen': '#556b2f',
            'darkorange': '#ff8c00',
            'darkorchid': '#9932cc',
            'darkred': '#8b0000',
            'darksalmon': '#e9967a',
            'darkseagreen': '#8fbc8f',
            'darkslateblue': '#483d8b',
            'darkslategray': '#2f4f4f',
            'darkslategrey': '#2f4f4f',
            'darkturquoise': '#00ced1',
            'darkviolet': '#9400d3',
            'deeppink': '#ff1493',
            'deepskyblue': '#00bfff',
            'dimgray': '#696969',
            'dimgrey': '#696969',
            'dodgerblue': '#1e90ff',
            'firebrick': '#b22222',
            'floralwhite': '#fffaf0',
            'forestgreen': '#228b22',
            'fuchsia': '#ff00ff',
            'gainsboro': '#dcdcdc',
            'ghostwhite': '#f8f8ff',
            'gold': '#ffd700',
            'goldenrod': '#daa520',
            'gray': '#808080',
            'grey': '#808080',
            'green': '#008000',
            'greenyellow': '#adff2f',
            'honeydew': '#f0fff0',
            'hotpink': '#ff69b4',
            'indianred': '#cd5c5c',
            'indigo': '#4b0082',
            'ivory': '#fffff0',
            'khaki': '#f0e68c',
            'lavender': '#e6e6fa',
            'lavenderblush': '#fff0f5',
            'lawngreen': '#7cfc00',
            'lemonchiffon': '#fffacd',
            'lightblue': '#add8e6',
            'lightcoral': '#f08080',
            'lightcyan': '#e0ffff',
            'lightgoldenrodyellow': '#fafad2',
            'lightgray': '#d3d3d3',
            'lightgrey': '#d3d3d3',
            'lightgreen': '#90ee90',
            'lightpink': '#ffb6c1',
            'lightsalmon': '#ffa07a',
            'lightseagreen': '#20b2aa',
            'lightskyblue': '#87ceeb',
            'lightslategray': '#778899',
            'lightslategrey': '#778899',
            'lightsteelblue': '#b0c4de',
            'lightyellow': '#ffffe0',
            'lime': '#00ff00',
            'limegreen': '#32cd32',
            'linen': '#faf0e6',
            'magenta': '#ff00ff',
            'maroon': '#800000',
            'mediumaquamarine': '#66cdaa',
            'mediumblue': '#0000cd',
            'mediumorchid': '#ba55d3',
            'mediumpurple': '#9370db',
            'mediumseagreen': '#3cb371',
            'mediumslateblue': '#7b68ee',
            'mediumspringgreen': '#00fa9a',
            'mediumturquoise': '#48d1cc',
            'mediumvioletred': '#c71585',
            'midnightblue': '#191970',
            'mintcream': '#f5fffa',
            'mistyrose': '#ffe4e1',
            'moccasin': '#ffe4b5',
            'navajowhite': '#ffdead',
            'navy': '#000080',
            'oldlace': '#fdf5e6',
            'olive': '#808000',
            'olivedrab': '#6b8e23',
            'orange': '#ffa500',
            'orangered': '#ff4500',
            'orchid': '#da70d6',
            'palegoldenrod': '#eee8aa',
            'palegreen': '#98fb98',
            'paleturquoise': '#afeeee',
            'palevioletred': '#db7093',
            'papayawhip': '#ffefd5',
            'peachpuff': '#ffdab9',
            'peru': '#cd853f',
            'pink': '#ffc0cb',
            'plum': '#dda0dd',
            'powderblue': '#b0e0e6',
            'purple': '#800080',
            'rebeccapurple': '#663399',
            'red': '#ff0000',
            'rosybrown': '#bc8f8f',
            'royalblue': '#4169e1',
            'saddlebrown': '#8b4513',
            'salmon': '#fa8072',
            'sandybrown': '#f4a460',
            'seagreen': '#2e8b57',
            'seashell': '#fff5ee',
            'sienna': '#a0522d',
            'silver': '#c0c0c0',
            'skyblue': '#87ceeb',
            'slateblue': '#6a5acd',
            'slategray': '#708090',
            'slategrey': '#708090',
            'snow': '#fffafa',
            'springgreen': '#00ff7f',
            'steelblue': '#4682b4',
            'tan': '#d2b48c',
            'teal': '#008080',
            'thistle': '#d8bfd8',
            'tomato': '#ff6347',
            'turquoise': '#40e0d0',
            'violet': '#ee82ee',
            'wheat': '#f5deb3',
            'white': '#ffffff',
            'whitesmoke': '#f5f5f5',
            'yellow': '#ffff00',
            'yellowgreen': '#9acd32'
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
                
                # Check if properties_str ends with '{'
                has_children = properties_str.strip().endswith('{')
                if has_children:
                    properties_str = properties_str.strip()[:-1].strip()
                
                # Map Cabbage2 widget type to Cabbage3 widget type
                cabbage3_type = self.widget_type_mapping.get(widget_type.lower(), widget_type)
                widget = {'type': cabbage3_type}

                # Parse properties
                properties = self.parse_properties(properties_str)

                # Handle special properties and mappings
                self.handle_special_properties(widget, properties, line)

                # Add remaining valid Cabbage3 properties
                for key, value in properties.items():
                    if key not in widget and self.is_valid_cabbage3_property(key, cabbage3_type):
                        widget[key] = value

                # Check for children (nested widgets)
                if has_children:
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
                                self.handle_special_properties(child_widget, child_properties, child_line)

                                # Add remaining valid Cabbage3 child properties
                                for key, value in child_properties.items():
                                    if key not in child_widget and self.is_valid_cabbage3_property(key, cabbage3_child_type):
                                        child_widget[key] = value

                                children.append(child_widget)

                        i += 1

                    if children:
                        widget['children'] = children
                else:
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
                                    self.handle_special_properties(child_widget, child_properties, child_line)

                                    # Add remaining valid Cabbage3 child properties
                                    for key, value in child_properties.items():
                                        if key not in child_widget and self.is_valid_cabbage3_property(key, cabbage3_child_type):
                                            child_widget[key] = value

                                    children.append(child_widget)

                            i += 1

                        if children:
                            widget['children'] = children

                widgets.append(widget)
                self.conversions_applied['widgets_converted'] += 1
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
            # Check if rgb contains quoted strings or named colors
            if '"' in rgb or rgb.strip().lower() in self.color_map:
                # It's a named color or quoted string
                color_name = rgb.strip().strip('"').lower()
                if color_name in self.color_map:
                    color_hex = self.color_map[color_name]
                else:
                    color_hex = rgb.strip().strip('"')
                if state == '0':
                    return {'off': color_hex}
                elif state == '1':
                    return {'on': color_hex}
            else:
                # Try to parse as RGB values
                try:
                    rgb_values = [int(x.strip()) for x in rgb.split(',')]
                    if len(rgb_values) == 3:
                        color_hex = f'#{rgb_values[0]:02x}{rgb_values[1]:02x}{rgb_values[2]:02x}'
                        if state == '0':
                            return {'off': color_hex}
                        elif state == '1':
                            return {'on': color_hex}
                except ValueError:
                    pass  # Not RGB values, treat as named color
        
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
        
        # Check if it's a named color
        color_name = value_str.strip('"').lower()
        if color_name in self.color_map:
            return self.color_map[color_name]
        
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
            else:
                # Return list for multiple texts - widget-specific logic will handle conversion
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

    def handle_special_properties(self, widget, properties, original_line=None):
        """Handle special property mappings and defaults"""
        widget_type = widget.get('type', '')

        # Handle text property for widgets that use text object
        if 'text' in properties and widget_type in ['button', 'optionButton']:
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

        # Handle fontColour -> font.colour mapping
        if 'fontColour' in properties:
            font_colour = properties['fontColour']
            if isinstance(font_colour, str):
                # Initialize font object if it doesn't exist
                if 'font' not in widget:
                    widget['font'] = {}
                widget['font']['colour'] = font_colour
            # Remove the original property
            properties.pop('fontColour', None)

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

        # Handle value -> defaultValue conversion (Cabbage2 value() becomes Cabbage3 defaultValue)
        if 'value' in properties:
            widget['defaultValue'] = properties['value']
            properties.pop('value', None)
        if widget_type == 'comboBox':
            items = []
            
            # Check for items property
            if 'items' in properties:
                items_value = properties['items']
                if isinstance(items_value, list):
                    items.extend(items_value)
                elif isinstance(items_value, str):
                    # Split by comma if it's a string
                    items.extend([item.strip().strip('"') for item in items_value.split(',')])
                properties.pop('items', None)
            
            # Check for text property (alternative way to specify items)
            if 'text' in properties:
                text_value = properties['text']
                if isinstance(text_value, list):
                    items.extend(text_value)
                elif isinstance(text_value, str):
                    # Split by comma if it's a string
                    items.extend([item.strip().strip('"') for item in text_value.split(',')])
                properties.pop('text', None)
            
            # Add items to widget if we found any
            if items:
                widget['items'] = items
            
            # Add indexOffset for Cabbage2 compatibility (Cabbage2 comboboxes start at index 1)
            widget['indexOffset'] = True

        # Handle button text on/off states
        if widget_type == 'button' and 'text' in properties:
            text_value = properties['text']
            if isinstance(text_value, list) and len(text_value) == 2:
                widget['text'] = {'on': text_value[0], 'off': text_value[1]}
                properties.pop('text', None)

        # Ensure all widgets have a unique channel name (except form widgets)
        # Don't generate if channel already exists or if identChannel is present (will be used as channel)
        if 'channel' not in widget and 'channel' not in properties and 'identChannel' not in properties and widget_type != 'form':
            widget['channel'] = self.generate_unique_channel(widget_type)

        # Collect identChannel -> channel mapping for orchestra code replacement
        ident_channel = properties.get('identChannel')
        channel = widget.get('channel') or properties.get('channel')

        # If widget has identChannel but no channel, use identChannel as channel name
        if ident_channel and not channel:
            widget['channel'] = ident_channel
            channel = ident_channel

        if ident_channel and channel:
            # Store the original line for logging
            self.ident_channel_mappings[ident_channel] = {
                'channel': channel,
                'original_line': original_line or f"{widget.get('type', 'unknown')} widget"
            }
            self.conversions_applied['ident_channels_mapped'] += 1

        # Remove identChannel and plant properties as they are not needed in Cabbage3
        properties.pop('identChannel', None)
        properties.pop('plant', None)

        # Only add properties that were explicitly defined in the Cabbage2 file
        # Removed set_widget_defaults call

    def is_valid_cabbage3_property(self, key, widget_type):
        """Check if a property is valid for Cabbage3 widgets"""
        # Common valid properties for all widgets
        common_valid_props = {
            'bounds', 'channel', 'text', 'value', 'range', 'colour', 'font', 
            'visible', 'items', 'textBox', 'valueTextBox'
        }
        
        # Widget-specific valid properties
        widget_specific_props = {
            'form': {'caption', 'pluginId', 'size'},
            'label': set(),
            'rotarySlider': set(),
            'horizontalSlider': set(), 
            'verticalSlider': set(),
            'numberSlider': set(),
            'comboBox': set(),
            'button': set(),
            'checkBox': set(),
            'groupBox': set(),
            'image': set(),  # image widgets have no additional properties in Cabbage3
        }
        
        # Special exclusions
        if widget_type == 'image' and key == 'colour':
            return False
        
        # Check common properties
        if key in common_valid_props:
            return True
            
        # Check widget-specific properties
        if widget_type in widget_specific_props and key in widget_specific_props[widget_type]:
            return True
            
        return False

    def replace_ident_channel_opcodes(self, instruments_content):
        """Replace chnget/chnset opcodes that use identChannels with Cabbage3 equivalents"""
        lines = instruments_content.split('\n')
        modified_lines = []
        
        for line in lines:
            original_line = line
            
            # First, replace chnget "identChannel" with cabbageGetValue "channel"
            for ident_channel, mapping_info in self.ident_channel_mappings.items():
                channel = mapping_info['channel']
                chnget_pattern = r'chnget\s+"'+re.escape(ident_channel)+r'"'
                if re.search(chnget_pattern, line):
                    line = re.sub(chnget_pattern, f'cabbageGetValue "{channel}"', line)
                    self.conversions_applied['chnget_ops'] += 1
            
            # Then, replace chnset value, "identChannel" with appropriate Cabbage3 syntax
            for ident_channel, mapping_info in self.ident_channel_mappings.items():
                channel = mapping_info['channel']
                chnset_pattern = r'chnset\s+([^,]+),\s*"'+re.escape(ident_channel)+r'"'
                match = re.search(chnset_pattern, line)
                if match:
                    value_str = match.group(1).strip()
                    if value_str.startswith('"') and value_str.endswith('"'):
                        value_str = value_str[1:-1]  # Remove quotes
                    
                    # Check if it's a property(value) format like "visible(1)"
                    prop_match = re.match(r'(\w+)\(([^)]+)\)', value_str)
                    if prop_match:
                        property_name, property_value = prop_match.groups()
                        # For property setting, use the mapped channel name with comment showing identChannel mapping
                        comment = f" ; {ident_channel} -> {channel}" if ident_channel != channel else ""
                        line = re.sub(chnset_pattern, f'cabbageSet k(1), "{channel}", "{property_name}", {property_value}{comment}', line)
                        self.conversions_applied['chnset_property_ops'] += 1
                    else:
                        # For simple value setting, use the mapped channel name
                        line = re.sub(chnset_pattern, f'cabbageSet k(1), {value_str}, "{channel}"', line)
                        self.conversions_applied['chnset_value_ops'] += 1
                    break  # Only replace one identChannel per line
            
            modified_lines.append(line)
        
        return '\n'.join(modified_lines)

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

        # Replace identChannel references in orchestra code
        if self.ident_channel_mappings:
            # Extract CsInstruments section
            instruments_match = re.search(r'<CsInstruments>(.*?)</CsInstruments>', new_content, re.DOTALL)
            if instruments_match:
                instruments_content = instruments_match.group(1)
                
                # Replace identChannel references with channel names
                modified_instruments = instruments_content
                
                # First, handle chnset property operations (these should keep identChannel names)
                modified_instruments = self.replace_ident_channel_opcodes(modified_instruments)
                
                # Then replace remaining identChannel string references (skip lines with cabbageSet)
                for ident_channel, mapping_info in self.ident_channel_mappings.items():
                    channel = mapping_info['channel']
                    # Split into lines, replace only in lines that don't contain cabbageSet
                    lines = modified_instruments.split('\n')
                    for i, line in enumerate(lines):
                        if 'cabbageSet' not in line:
                            lines[i] = re.sub(r'\b' + re.escape(ident_channel) + r'\b', channel, line)
                    modified_instruments = '\n'.join(lines)
                
                # Replace the instruments section
                new_content = new_content.replace(instruments_match.group(0), f"<CsInstruments>{modified_instruments}</CsInstruments>")

        # Write output file
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(new_content)

        # Print user-friendly conversion summary
        print(f"✅ Successfully converted: {Path(input_file).name}")
        print(f"📁 Output: {output_file}")
        print(f"\n📋 Conversion Rules Applied:")
        
        if self.conversions_applied['widgets_converted'] > 0:
            print(f"   • {self.conversions_applied['widgets_converted']} widgets converted from Cabbage2 syntax to Cabbage3 JSON")
        
        if self.conversions_applied['ident_channels_mapped'] > 0:
            print(f"   • {self.conversions_applied['ident_channels_mapped']} identChannel mappings created for orchestra code")
        
        if self.conversions_applied['chnget_ops'] > 0:
            print(f"   • {self.conversions_applied['chnget_ops']} chnget operations converted to cabbageGetValue")
        
        if self.conversions_applied['chnset_property_ops'] > 0:
            print(f"   • {self.conversions_applied['chnset_property_ops']} chnset property operations converted to cabbageSet (using channel names with identChannel comments)")
        
        if self.conversions_applied['chnset_value_ops'] > 0:
            print(f"   • {self.conversions_applied['chnset_value_ops']} chnset value operations converted to cabbageSet (using channel names)")
        
        if self.conversions_applied['string_replacements'] > 0:
            print(f"   • {self.conversions_applied['string_replacements']} identChannel string references replaced with channel names")
        
        # Show specific mappings if any exist
        if self.ident_channel_mappings:
            print(f"\n🔄 IdentChannel Mappings:")
            for ident_channel, mapping_info in self.ident_channel_mappings.items():
                channel = mapping_info['channel']
                if ident_channel != channel:
                    print(f"   • '{ident_channel}' → '{channel}'")
                else:
                    print(f"   • '{ident_channel}' → '{channel}' (unchanged)")
        
        print(f"\n🎯 Ready to use with Cabbage3!")

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