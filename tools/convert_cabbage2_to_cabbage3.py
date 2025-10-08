import json
import os
import re
from pathlib import Path
import argparse
import platform

class Cabbage2To3Converter:
    def replace_parallelwidgets_blocks(self, instruments_content):
        """Detect and replace ParallelWidgets opcode blocks with a modernized version."""
        # Regex: match from 'opcode ParallelWidgets' to next 'endop', non-greedy, multiline, robust to whitespace
        pattern = re.compile(r'(opcode\s+ParallelWidgets.*?endop)', re.DOTALL | re.IGNORECASE)
        matches = list(pattern.finditer(instruments_content))
        replaced = 0
        new_content = instruments_content
        for match in matches:
            old_block = match.group(1)
            # New modernized version
            new_block = (
                "opcode ParallelWidgets, k, SS\n"
                "   SStr1,SStr2 xin\n"
                "   k1, ktrig1 cabbageGetValue SStr1\n"
                "   k2, ktrig2 cabbageGetValue SStr2\n"
                "   cabbageSetValue SStr1, k2, ktrig2\n"
                "   cabbageSetValue SStr2, k1, ktrig1\n"
                "   xout k1\n"
                "endop"
            )
            new_content = new_content.replace(old_block, new_block)
            replaced += 1
        return new_content, replaced

    def apply_brute_force_replacements(self, instruments_content):
        """Apply brute force string replacements for specific patterns that can't be handled generically."""
        replacements = [
            # Replace ScrubberID position setting pattern
            {
                'pattern': r'iScrubPos\s*=\s*5\s*\+\s*\(gindx\*50\)\s*;?\s*.*?\n\s*Smsg\s+sprintf\s+"pos\(%d,5\)",iScrubPos\s*;?\s*.*?\n\s*chnset\s+Smsg,"ScrubberID"\s*;?\s*.*?',
                'replacement': '''iScrubPos    =    5 + (gindx*50)            ; derive x-position
cabbageSet "ScrubberID", "bounds.left", iScrubPos             ; send new position to widget''',
                'description': 'ScrubberID position setting'
            }
        ]
        
        modified_content = instruments_content
        replacements_applied = 0
        
        for replacement in replacements:
            # Use regex to find the pattern with flexible whitespace
            pattern = re.compile(replacement['pattern'], re.MULTILINE | re.DOTALL)
            matches = pattern.findall(modified_content)
            
            if matches:
                print(f"   • Found {len(matches)} instance(s) of pattern: {replacement['description']}")
                # Replace all occurrences
                modified_content = pattern.sub(replacement['replacement'], modified_content)
                print(f"   • Applied brute force replacement for {replacement['description']}")
                replacements_applied += 1
        
        if replacements_applied > 0:
            print(f"   • Total brute force replacements applied: {replacements_applied}")
        
        return modified_content
    def __init__(self):
        self.widget_counter = 0
        
        # Font size scaling factors: 1.0 = 100% (no reduction), 0.95 = 95% (5% reduction), etc.
        # Adjust these values to control how much font sizes are reduced during conversion
        self.font_scale_factor = 0.9  # Applied to labels, buttons, combobox, groupbox, etc.
        self.font_scale_factor_sliders = 0.6  # Applied to sliders (horizontal, vertical, rotary, number)
        
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
            'infobutton': 'infoButton',
            'keyboard': 'keyboard',
            'gentable': 'genTable',
            'soundfiler': 'genTable',  # soundfiler converts to genTable
            'line': 'image',  # line converts to image
            'texteditor': 'textEditor',
            'csoundoutput': 'csoundOutput',
            'filebutton': 'fileButton',
            'listbox': 'listBox',
            'image': 'image',
            'label': 'label',
            'button': 'button',
            'xypad': 'xyPad',
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
            'string_replacements': 0,
            'soundfiler_conversions': 0,  # Track soundfiler to genTable conversions
            'line_conversions': 0  # Track line to image conversions
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
                
                # Track soundfiler conversions
                if widget_type.lower() == 'soundfiler':
                    self.conversions_applied['soundfiler_conversions'] += 1
                
                # Track line conversions
                if widget_type.lower() == 'line':
                    self.conversions_applied['line_conversions'] += 1

                # Parse properties
                properties = self.parse_properties(properties_str)

                # Handle special properties and mappings (pass original widget_type before mapping)
                self.handle_special_properties(widget, properties, line, widget_type.lower())

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
                                self.handle_special_properties(child_widget, child_properties, child_line, child_type.lower())

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
                                    self.handle_special_properties(child_widget, child_properties, child_line, child_type.lower())

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
                    # Merge color-related dictionaries (colour, fontColour, textColour, etc.)
                    if key.lower() in ['colour', 'fontcolour', 'textcolour', 'trackercolour'] and isinstance(properties[key], dict):
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
                    elif key.lower() in ['colour', 'fontcolour', 'textcolour', 'trackercolour'] and isinstance(value, dict):
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

        # Handle range, rangeX, rangeY
        if key.lower() in ['range', 'rangex', 'rangey']:
            return self.parse_range_value(value_str)

        # Handle bounds/size
        if key.lower() in ['bounds', 'size']:
            return self.parse_bounds_value(value_str)

        # Handle text
        if key.lower() == 'text':
            return self.parse_text_value(value_str)

        # Handle channel (can have multiple values for xyPad)
        if key.lower() == 'channel':
            if ',' in value_str:
                # Multiple channel values (like for xyPad)
                return [self.parse_single_value(v.strip()) for v in value_str.split(',')]
            else:
                return self.parse_single_value(value_str)

        # Handle numeric values
        if ',' in value_str:
            # Multiple values
            return [self.parse_single_value(v.strip()) for v in value_str.split(',')]
        else:
            return self.parse_single_value(value_str)

    def parse_color_value(self, value_str):
        """Parse color values"""
        # Handle colour:state(r,g,b) format that becomes state(r,g,b)
        # state 0 = off, state 1 = on
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
                # state 0 = off, state 1 = on
                if state == '0':
                    return {'off': color_hex}
                elif state == '1':
                    return {'on': color_hex}
            else:
                # Try to parse as RGB/RGBA values
                try:
                    rgb_values = [int(x.strip()) for x in rgb.split(',')]
                    if len(rgb_values) >= 3:
                        if len(rgb_values) == 3:
                            color_hex = f'#{rgb_values[0]:02x}{rgb_values[1]:02x}{rgb_values[2]:02x}'
                        elif len(rgb_values) == 4:
                            # RGBA
                            color_hex = f'#{rgb_values[0]:02x}{rgb_values[1]:02x}{rgb_values[2]:02x}{rgb_values[3]:02x}'
                        else:
                            # Invalid number of values
                            color_hex = rgb.strip()
                        # state 0 = off, state 1 = on
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
        """Parse range(min,max,default,skew,increment)"""
        values = [self.parse_single_value(v.strip()) for v in value_str.split(',')]
        range_obj = {
            'min': values[0] if len(values) > 0 else 0,
            'max': values[1] if len(values) > 1 else 1,
            'defaultValue': values[2] if len(values) > 2 else values[0] if len(values) > 0 else 0,
            'skew': values[3] if len(values) > 3 else 1,
            'increment': values[4] if len(values) > 4 else 0.001  # Use 5th value if provided, else default
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

    def handle_special_properties(self, widget, properties, original_line=None, original_widget_type=None):
        """Handle special property mappings and defaults"""
        widget_type = widget.get('type', '')
        # Use original_widget_type if provided (for widgets that have been mapped to different types)
        if original_widget_type:
            check_type = original_widget_type
        else:
            check_type = widget_type

        # Special handling for xyPad widget
        if widget_type == 'xyPad':
            # Handle channel("x", "y") format - convert to object with id, x, y
            if 'channel' in properties:
                channel_value = properties['channel']
                if isinstance(channel_value, list) and len(channel_value) >= 2:
                    widget['channel'] = {
                        'id': self.generate_unique_channel('xyPad'),
                        'x': channel_value[0],
                        'y': channel_value[1]
                    }
                    properties.pop('channel', None)
            
            # Handle rangeX and rangeY - convert to nested range object
            if 'rangeX' in properties or 'rangeY' in properties:
                range_obj = {}
                if 'rangeX' in properties:
                    rangeX_value = properties['rangeX']
                    if isinstance(rangeX_value, dict):
                        range_obj['x'] = rangeX_value
                    else:
                        # If it's a list of values, parse as range
                        range_obj['x'] = self.parse_range_value(','.join(str(v) for v in rangeX_value)) if isinstance(rangeX_value, list) else rangeX_value
                    properties.pop('rangeX', None)
                
                if 'rangeY' in properties:
                    rangeY_value = properties['rangeY']
                    if isinstance(rangeY_value, dict):
                        range_obj['y'] = rangeY_value
                    else:
                        # If it's a list of values, parse as range
                        range_obj['y'] = self.parse_range_value(','.join(str(v) for v in rangeY_value)) if isinstance(rangeY_value, list) else rangeY_value
                    properties.pop('rangeY', None)
                
                if range_obj:
                    widget['range'] = range_obj
            
            # Handle text property for xyPad - convert array to object or split single string with separator
            if 'text' in properties:
                text_value = properties['text']
                if isinstance(text_value, list) and len(text_value) >= 2:
                    widget['text'] = {'x': text_value[0], 'y': text_value[1]}
                    properties.pop('text', None)
                elif isinstance(text_value, str):
                    # Check for common separators used in Cabbage2 xyPad text labels
                    # Try to split by /, |, or \ (with optional whitespace)
                    x_text = text_value
                    y_text = text_value
                    
                    # Try splitting by pipe with optional spaces
                    if '|' in text_value:
                        parts = text_value.split('|')
                        if len(parts) >= 2:
                            x_text = parts[0].strip()
                            y_text = parts[1].strip()
                    # Try splitting by forward slash with optional spaces
                    elif '/' in text_value:
                        parts = text_value.split('/')
                        if len(parts) >= 2:
                            x_text = parts[0].strip()
                            y_text = parts[1].strip()
                    # Try splitting by backslash with optional spaces
                    elif '\\' in text_value:
                        parts = text_value.split('\\')
                        if len(parts) >= 2:
                            x_text = parts[0].strip()
                            y_text = parts[1].strip()
                    
                    # Clean up common prefixes like "x:", "X:", "y:", "Y:"
                    x_text = re.sub(r'^[xX]\s*[:=]\s*', '', x_text).strip()
                    y_text = re.sub(r'^[yY]\s*[:=]\s*', '', y_text).strip()
                    
                    widget['text'] = {'x': x_text, 'y': y_text}
                    properties.pop('text', None)

        # Special handling for genTable widget
        if widget_type == 'genTable':
            # Check for identChannel first (for soundfiler conversions)
            ident_channel = properties.get('identChannel')
            
            # Handle channel - convert to object with id, start, length
            if 'channel' in properties:
                channel_value = properties['channel']
                if isinstance(channel_value, str):
                    # Single channel - create object structure with auto-generated start/length
                    widget['channel'] = {
                        'id': channel_value,
                        'start': f"{channel_value}_start",
                        'length': f"{channel_value}_length"
                    }
                    properties.pop('channel', None)
                elif isinstance(channel_value, list):
                    if len(channel_value) == 2:
                        # Two channels (from soundfiler): use as start/length
                        # If identChannel exists, use it for id, otherwise generate one
                        if ident_channel:
                            widget['channel'] = {
                                'id': ident_channel,
                                'start': channel_value[0],
                                'length': channel_value[1]
                            }
                        else:
                            unique_id = self.generate_unique_channel('genTable')
                            widget['channel'] = {
                                'id': unique_id,
                                'start': channel_value[0],
                                'length': channel_value[1]
                            }
                        properties.pop('channel', None)
                    elif len(channel_value) >= 3:
                        # Three channels: id, start, length
                        widget['channel'] = {
                            'id': channel_value[0],
                            'start': channel_value[1],
                            'length': channel_value[2]
                        }
                        properties.pop('channel', None)
            else:
                # No channel provided
                # If identChannel exists, use it for id, otherwise generate one
                if ident_channel:
                    widget['channel'] = {
                        'id': ident_channel,
                        'start': f"{ident_channel}_start",
                        'length': f"{ident_channel}_length"
                    }
                else:
                    unique_id = self.generate_unique_channel('genTable')
                    widget['channel'] = {
                        'id': unique_id,
                        'start': f"{unique_id}_start",
                        'length': f"{unique_id}_length"
                    }

            # Handle ampRange and sampleRange - convert to nested range object
            range_obj = {}
            
            # Handle sampleRange - maps to range.x (sample selection range)
            if 'sampleRange' in properties:
                sample_range_value = properties['sampleRange']
                if isinstance(sample_range_value, list) and len(sample_range_value) >= 2:
                    range_obj['x'] = {
                        'start': sample_range_value[0],
                        'end': sample_range_value[1]
                    }
                properties.pop('sampleRange', None)
            
            # Handle ampRange - maps to range.y (amplitude display range)
            if 'ampRange' in properties:
                amp_range_value = properties['ampRange']
                if isinstance(amp_range_value, list) and len(amp_range_value) >= 2:
                    range_obj['y'] = {
                        'min': amp_range_value[0],
                        'max': amp_range_value[1]
                    }
                properties.pop('ampRange', None)
            
            # Add range object to widget if we have any range properties
            if range_obj:
                widget['range'] = range_obj

            # Handle tableColour - maps to colour.fill
            if 'tableColour' in properties:
                table_colour = properties['tableColour']
                # Parse the colour value (it might be a named color or hex)
                parsed_colour = self.parse_color_value(str(table_colour).strip('"'))
                if isinstance(parsed_colour, str):
                    # Initialize colour object if it doesn't exist
                    if 'colour' not in widget:
                        widget['colour'] = {}
                    widget['colour']['fill'] = parsed_colour
                properties.pop('tableColour', None)

        # Special handling for line widget (converted to image)
        if check_type == 'line':
            # Set a solid background color for the line
            if 'colour' in properties:
                colour_value = properties['colour']
                # Colour might already be parsed as a dict with 'fill' or as a string
                if isinstance(colour_value, dict) and 'fill' in colour_value:
                    widget['colour'] = {'background': colour_value['fill']}
                elif isinstance(colour_value, str):
                    widget['colour'] = {'background': colour_value}
                else:
                    widget['colour'] = {'background': colour_value}
                properties.pop('colour', None)
            else:
                # Default to black if no colour specified
                widget['colour'] = {'background': 'black'}
            
            # Remove any file property that might have been set
            properties.pop('file', None)
            
            # Ensure corners are 0 for sharp edges (lines should be rectangular)
            if 'corners' not in properties:
                widget['corners'] = 0

        # Handle text property for widgets that use text object
        if 'text' in properties:
            text_value = properties['text']
            if widget_type in ['button', 'optionButton', 'fileButton']:
                if isinstance(text_value, str):
                    # Single text state - use for both on and off
                    widget['text'] = {'on': text_value, 'off': text_value}
                elif isinstance(text_value, list):
                    # Array with 1 or 2 values - convert to on/off object
                    if len(text_value) >= 2:
                        widget['text'] = {'on': text_value[0], 'off': text_value[1]}
                    elif len(text_value) == 1:
                        widget['text'] = {'on': text_value[0], 'off': text_value[0]}
                elif isinstance(text_value, dict):
                    widget['text'] = text_value
                properties.pop('text', None)

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

        # Handle textColour/textColor -> font.colour mapping
        text_colour_key = None
        if 'textColour' in properties:
            text_colour_key = 'textColour'
        elif 'textColor' in properties:
            text_colour_key = 'textColor'
        
        if text_colour_key:
            text_colour = properties[text_colour_key]
            # Initialize font object if it doesn't exist
            if 'font' not in widget:
                widget['font'] = {}
            
            # For button widgets, font.colour needs on/off states
            if widget_type in ['button', 'optionButton', 'fileButton', 'infoButton', 'checkBox']:
                if isinstance(text_colour, str):
                    widget['font']['colour'] = {
                        'on': text_colour,
                        'off': text_colour
                    }
                elif isinstance(text_colour, dict):
                    widget['font']['colour'] = text_colour
            else:
                # For other widgets, simple string is fine
                if isinstance(text_colour, str):
                    widget['font']['colour'] = text_colour
            # Remove the original property
            properties.pop(text_colour_key, None)

        # Handle fontColour/fontColor -> font.colour mapping
        font_colour_key = None
        if 'fontColour' in properties:
            font_colour_key = 'fontColour'
        elif 'fontColor' in properties:
            font_colour_key = 'fontColor'
        
        if font_colour_key:
            font_colour = properties[font_colour_key]
            # Initialize font object if it doesn't exist
            if 'font' not in widget:
                widget['font'] = {}
            
            # For button widgets, font.colour needs on/off states
            if widget_type in ['button', 'optionButton', 'fileButton', 'infoButton', 'checkBox']:
                if isinstance(font_colour, dict):
                    # Handle parsed state-based colours (from fontColour:0(...) format)
                    if 'on' in font_colour and 'off' in font_colour:
                        widget['font']['colour'] = font_colour
                    elif 'on' in font_colour:
                        widget['font']['colour'] = {
                            'on': font_colour['on'],
                            'off': font_colour['on']  # Use same colour for off state if not specified
                        }
                    elif 'off' in font_colour:
                        widget['font']['colour'] = {
                            'on': font_colour['off'],  # Use off colour for on state if not specified
                            'off': font_colour['off']
                        }
                    else:
                        # Single parsed colour value
                        widget['font']['colour'] = {
                            'on': font_colour,
                            'off': font_colour
                        }
                elif isinstance(font_colour, str):
                    # Single colour string
                    widget['font']['colour'] = {
                        'on': font_colour,
                        'off': font_colour
                    }
            else:
                # For other widgets, simple string is fine
                if isinstance(font_colour, str):
                    widget['font']['colour'] = font_colour
                elif isinstance(font_colour, dict):
                    # For non-button widgets, if we have a dict, use the first value
                    if 'on' in font_colour:
                        widget['font']['colour'] = font_colour['on']
                    elif 'off' in font_colour:
                        widget['font']['colour'] = font_colour['off']
                    else:
                        # Single parsed colour value
                        widget['font']['colour'] = font_colour
            # Remove the original property
            properties.pop(font_colour_key, None)

        # Set default font colour for checkBox widgets if not specified
        if widget_type == 'checkBox' and ('font' not in widget or 'colour' not in widget['font']):
            if 'font' not in widget:
                widget['font'] = {}
            widget['font']['colour'] = {
                'on': '#dddddd',
                'off': '#000000'
            }

        # Apply font size scaling based on widget type
        # font_scale_factor for labels, buttons, combobox, groupbox, etc.
        # font_scale_factor_sliders for sliders
        # Only apply if scale factor is not 1.0 (to let widgets auto-calculate when no reduction needed)
        slider_widgets = ['horizontalSlider', 'verticalSlider', 'rotarySlider', 'numberSlider']
        scale_factor = self.font_scale_factor_sliders if widget_type in slider_widgets else self.font_scale_factor
        
        if scale_factor != 1.0 and widget_type in ['label', 'button', 'checkBox', 'comboBox', 'groupBox', 
                          'horizontalSlider', 'verticalSlider', 'rotarySlider', 'numberSlider', 'optionButton', 
                          'fileButton', 'infoButton', 'textBox', 'stringBox']:
            # Initialize font object if it doesn't exist
            if 'font' not in widget:
                widget['font'] = {}
            
            # Only set font size if not already explicitly set in Cabbage2 file
            if 'size' not in widget.get('font', {}):
                # Get widget bounds from properties (bounds haven't been added to widget yet)
                bounds = properties.get('bounds') or widget.get('bounds')
                if bounds and isinstance(bounds, dict) and 'height' in bounds:
                    height = bounds['height']
                    width = bounds.get('width', height)
                    
                    # Use the actual default calculation from each widget type
                    # Then scale by the appropriate scale factor
                    if widget_type == 'label':
                        # label: Math.max(height, 12)
                        default_size = max(height, 12)
                        widget['font']['size'] = max(round(default_size * scale_factor), 6)
                    elif widget_type == 'button':
                        # button: height * 0.4
                        default_size = height * 0.4
                        widget['font']['size'] = max(round(default_size * scale_factor), 6)
                    elif widget_type == 'checkBox':
                        # checkBox: height * 0.8
                        default_size = height * 0.6
                        widget['font']['size'] = max(round(default_size * scale_factor), 6)
                    elif widget_type == 'comboBox':
                        # comboBox: height * 0.5
                        default_size = height * 0.5
                        widget['font']['size'] = max(round(default_size * scale_factor), 6)
                    elif widget_type == 'horizontalSlider':
                        # horizontalSlider: height * 0.6
                        default_size = height * 0.6
                        widget['font']['size'] = max(round(default_size * scale_factor), 6)
                    elif widget_type == 'verticalSlider':
                        # verticalSlider: width * 0.3
                        default_size = width * 0.3
                        widget['font']['size'] = max(round(default_size * scale_factor), 6)
                    elif widget_type == 'rotarySlider':
                        # rotarySlider: width * 0.24
                        default_size = width * 0.24
                        widget['font']['size'] = max(round(default_size * scale_factor), 6)
                    elif widget_type == 'numberSlider':
                        # numberSlider: 12 (fixed)
                        default_size = 12
                        widget['font']['size'] = max(round(default_size * scale_factor), 6)
                    elif widget_type == 'optionButton':
                        # optionButton: height * 0.5
                        default_size = height * 0.5
                        widget['font']['size'] = max(round(default_size * scale_factor), 6)
                    else:
                        # Default fallback: height * 0.1 with min 12
                        default_size = max(height * 0.1, 12)
                        widget['font']['size'] = max(round(default_size * scale_factor), 6)

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

        # Handle trackerBackgroundColour -> colour.tracker.background mapping for sliders
        if 'trackerBackgroundColour' in properties and widget_type in ['horizontalSlider', 'verticalSlider', 'rotarySlider', 'numberSlider']:
            tracker_bg_colour = properties['trackerBackgroundColour']
            if isinstance(tracker_bg_colour, str):
                # Initialize colour object if it doesn't exist
                if 'colour' not in widget:
                    widget['colour'] = {}
                # Initialize tracker object if it doesn't exist
                if 'tracker' not in widget['colour']:
                    widget['colour']['tracker'] = {}
                widget['colour']['tracker']['background'] = tracker_bg_colour
            # Remove the original property
            properties.pop('trackerBackgroundColour', None)

        # Set default tracker background for sliders
        if widget_type in ['horizontalSlider', 'verticalSlider', 'rotarySlider', 'numberSlider']:
            # Initialize colour object if it doesn't exist
            if 'colour' not in widget:
                widget['colour'] = {}
            # Initialize tracker object if it doesn't exist
            if 'tracker' not in widget['colour']:
                widget['colour']['tracker'] = {}
            # Set default background if not already set
            if 'background' not in widget['colour']['tracker']:
                widget['colour']['tracker']['background'] = '#222222'

        # Set default tracker width for rotarySlider
        if widget_type == 'rotarySlider':
            # Initialize colour object if it doesn't exist
            if 'colour' not in widget:
                widget['colour'] = {}
            # Initialize tracker object if it doesn't exist
            if 'tracker' not in widget['colour']:
                widget['colour']['tracker'] = {}
            # Set default tracker width if not already set
            if 'width' not in widget['colour']['tracker']:
                widget['colour']['tracker']['width'] = 14

        # Set default background color and corners for comboBox
        if widget_type == 'comboBox':
            # Initialize colour object if it doesn't exist
            if 'colour' not in widget:
                widget['colour'] = {}
            # Set default background fill if not already set
            if 'fill' not in widget['colour']:
                widget['colour']['fill'] = '222222'
            # Set default corner size (as a simple number, not object)
            if 'corners' not in widget:
                widget['corners'] = 2

        # Set default colors and corners for button and fileButton
        if widget_type in ['button', 'fileButton']:
            # Initialize colour object if it doesn't exist
            if 'colour' not in widget:
                widget['colour'] = {}
            # Set default on state colors
            if 'on' not in widget['colour']:
                widget['colour']['on'] = {}
            if 'fill' not in widget['colour']['on']:
                widget['colour']['on']['fill'] = '222222'
            # Set default off state colors
            if 'off' not in widget['colour']:
                widget['colour']['off'] = {}
            if 'fill' not in widget['colour']['off']:
                widget['colour']['off']['fill'] = '222222'
            # Set default corner size (as a simple number, not object)
            if 'corners' not in widget:
                widget['corners'] = 2

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
            # For genTable widgets, extract the 'id' from the channel object
            channel_for_mapping = channel
            if isinstance(channel, dict) and 'id' in channel:
                channel_for_mapping = channel['id']
            
            # Store the original line for logging
            self.ident_channel_mappings[ident_channel] = {
                'channel': channel_for_mapping,
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
            'button': {'radioGroup'},
            'checkBox': {'radioGroup'},
            'groupBox': set(),
            'genTable': {'tableNumber'},
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

    def collect_all_channels(self, widgets):
        """Collect all channel names from widgets, including nested channels for xyPad"""
        channels = set()
        for widget in widgets:
            if 'channel' in widget:
                channel = widget['channel']
                if isinstance(channel, str):
                    channels.add(channel)
                elif isinstance(channel, dict):
                    # For xyPad and similar multi-channel widgets
                    if 'x' in channel:
                        channels.add(channel['x'])
                    if 'y' in channel:
                        channels.add(channel['y'])
            # Recursively check children
            if 'children' in widget:
                channels.update(self.collect_all_channels(widget['children']))
        return channels

    def replace_ident_channel_opcodes(self, instruments_content):
        """Replace chnget/chnset opcodes that use identChannels with Cabbage3 equivalents"""
        lines = instruments_content.split('\n')
        modified_lines = []
        skip_next = False  # Flag to skip lines that have been made redundant
        
        for i, line in enumerate(lines):
            # Skip this line if it was marked for removal
            if skip_next:
                skip_next = False
                continue
                
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
                    
                    # Check if value is a variable that might have been set with sprintf on previous line
                    # Pattern: Svar sprintfk "property(%s)", value  (or similar format codes)
                    sprintf_var = None
                    property_name = None
                    format_vars = []
                    found_sprintf = False
                    
                    if i > 0 and not value_str.startswith('"'):  # If value is a variable, not a string literal
                        prev_line = lines[i-1]
                        # Look for sprintf pattern: variable = sprintf[k] "property(%format)", vars...
                        sprintf_pattern = r'^\s*' + re.escape(value_str) + r'\s+sprintf[k]?\s+"(\w+)\([^)]*\)"\s*,\s*(.+)'
                        sprintf_match = re.search(sprintf_pattern, prev_line)
                        if sprintf_match:
                            property_name = sprintf_match.group(1)
                            format_vars_str = sprintf_match.group(2).strip()
                            # Split by comma but be careful of nested parentheses
                            format_vars = [v.strip() for v in format_vars_str.split(',')]
                            sprintf_var = value_str
                            found_sprintf = True
                    
                    # If we found a sprintf pattern with property name
                    if sprintf_var and property_name:
                        # Build the cabbageSet call: cabbageSet "channel", "property", value1, value2, ...
                        format_vars_str = ', '.join(format_vars)
                        comment = f" ; {ident_channel} -> {channel}" if ident_channel != channel else ""
                        line = re.sub(chnset_pattern, f'cabbageSet "{channel}", "{property_name}", {format_vars_str}{comment}', line)
                        self.conversions_applied['chnset_property_ops'] += 1
                        # Mark the previous sprintf line for removal
                        if found_sprintf and len(modified_lines) > 0:
                            modified_lines.pop()  # Remove the sprintf line we just added
                    else:
                        # Check for inline property(value) format in string literal
                        if value_str.startswith('"') and value_str.endswith('"'):
                            value_str_inner = value_str[1:-1]  # Remove quotes
                            # Check if it's a property(value) format like "visible(1)"
                            prop_match = re.match(r'(\w+)\(([^)]+)\)', value_str_inner)
                            if prop_match:
                                property_name, property_value = prop_match.groups()
                                # For property setting, use the mapped channel name
                                comment = f" ; {ident_channel} -> {channel}" if ident_channel != channel else ""
                                line = re.sub(chnset_pattern, f'cabbageSet k(1), "{channel}", "{property_name}", {property_value}{comment}', line)
                                self.conversions_applied['chnset_property_ops'] += 1
                            else:
                                # Simple string value setting
                                line = re.sub(chnset_pattern, f'cabbageSet k(1), {value_str}, "{channel}"', line)
                                self.conversions_applied['chnset_value_ops'] += 1
                        else:
                            # For simple value setting (variable or expression), use the mapped channel name
                            line = re.sub(chnset_pattern, f'cabbageSet k(1), {value_str}, "{channel}"', line)
                            self.conversions_applied['chnset_value_ops'] += 1
                    break  # Only replace one identChannel per line
            
            modified_lines.append(line)
        
        return '\n'.join(modified_lines)

    def replace_chnset_with_cabbagesetvalue(self, instruments_content, all_channels):
        """Replace chnset k-rate-var, \"channel\" with cabbageSetValue \"channel\", k-rate-var, changed:k(k-rate-var)
        Only converts if the channel is found in the Cabbage section and the variable is k-rate"""
        lines = instruments_content.split('\n')
        modified_lines = []
        chnset_value_pattern = r'chnset\s+(k\w+)\s*,\s*"([^"]+)"'
        
        for line in lines:
            # Check if this line has a chnset with a k-rate variable
            match = re.search(chnset_value_pattern, line)
            if match:
                k_var = match.group(1)
                channel_name = match.group(2)
                
                # Only convert if the channel exists in the Cabbage section
                if channel_name in all_channels:
                    # Replace with cabbageSetValue
                    new_line = re.sub(
                        chnset_value_pattern,
                        f'cabbageSetValue "{channel_name}", {k_var}, changed:k({k_var})',
                        line
                    )
                    modified_lines.append(new_line)
                    self.conversions_applied['chnset_value_ops'] += 1
                else:
                    # Channel not in Cabbage section, leave as is
                    modified_lines.append(line)
            else:
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

        # Reorder widgets to ensure keyboard is last (for proper z-order/interactivity)
        keyboard_widgets = [w for w in widgets if w.get('type', '').lower() == 'keyboard']
        other_widgets = [w for w in widgets if w.get('type', '').lower() != 'keyboard']
        widgets = other_widgets + keyboard_widgets

        # Create output directory if it doesn't exist
        os.makedirs(output_dir, exist_ok=True)

        # Generate output filename
        input_name = Path(input_file).stem
        output_file = os.path.join(output_dir, f"{input_name}_cabbage3.csd")

        # Replace Cabbage section with JSON
        json_content = json.dumps(widgets, indent=4)
        new_cabbage_section = f"<Cabbage>\n{json_content}\n</Cabbage>"

        new_content = content.replace(cabbage_match.group(0), new_cabbage_section)

        # Collect all channel names from widgets for chnset conversion
        all_channels = self.collect_all_channels(widgets)

        # Replace identChannel references and ParallelWidgets blocks in orchestra code
        instruments_match = re.search(r'<CsInstruments>(.*?)</CsInstruments>', new_content, re.DOTALL)
        if instruments_match:
            instruments_content = instruments_match.group(1)
            modified_instruments = instruments_content

            # Apply brute force replacements first
            modified_instruments = self.apply_brute_force_replacements(modified_instruments)

            # Replace ParallelWidgets blocks first
            modified_instruments, pw_replaced = self.replace_parallelwidgets_blocks(modified_instruments)
            if pw_replaced > 0:
                print(f"   • {pw_replaced} ParallelWidgets opcode block(s) updated with cabbageSet/Get opcodes.")

            # Replace identChannel references if any
            if self.ident_channel_mappings:
                # First, handle chnset property operations (these should keep identChannel names)
                modified_instruments = self.replace_ident_channel_opcodes(modified_instruments)

                # Then replace remaining identChannel string references (skip lines with cabbageSet)
                for ident_channel, mapping_info in self.ident_channel_mappings.items():
                    channel = mapping_info['channel']
                    # Skip if channel is not a string (e.g., it's a list for multi-channel widgets)
                    if not isinstance(channel, str):
                        continue
                    # Split into lines, replace only in lines that don't contain cabbageSet
                    lines = modified_instruments.split('\n')
                    for i, line in enumerate(lines):
                        if 'cabbageSet' not in line:
                            lines[i] = re.sub(r'\b' + re.escape(ident_channel) + r'\b', channel, line)
                    modified_instruments = '\n'.join(lines)

            # Convert general chnset statements to cabbageSetValue for k-rate variables
            # This handles cases like: chnset kcf, "cfDisp" -> cabbageSetValue "cfDisp", kcf, changed:k(kcf)
            modified_instruments = self.replace_chnset_with_cabbagesetvalue(modified_instruments, all_channels)

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
        
        if self.conversions_applied['soundfiler_conversions'] > 0:
            print(f"   ⚠️  {self.conversions_applied['soundfiler_conversions']} soundfiler widget(s) converted to genTable")
            print(f"      Note: soundfiler channel properties are not supported in Cabbage3 genTable and have been removed.")
        
        if self.conversions_applied['line_conversions'] > 0:
            print(f"   ⚠️  {self.conversions_applied['line_conversions']} line widget(s) converted to image")
            print(f"      Note: line widgets are rendered as solid-color image rectangles in Cabbage3.")
        
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
    # Cross-platform OneDrive default path
    def get_default_outdir():
        system = platform.system()
        if system == "Windows":
            return os.path.expanduser(r"~\OneDrive\Csoundfiles\cabbage3\converted")
        elif system == "Darwin":  # macOS
            return os.path.expanduser("~/Library/CloudStorage/OneDrive-Personal/Csoundfiles/cabbage3/converted")
        else:  # Linux or other
            return os.path.expanduser("~/OneDrive/Csoundfiles/cabbage3/converted")
    
    parser.add_argument('--outdir', default=get_default_outdir(),
                       help='Output directory for converted files')

    args = parser.parse_args()

    converter = Cabbage2To3Converter()
    converter.convert_file(args.input_file, args.outdir)

if __name__ == '__main__':
    main()