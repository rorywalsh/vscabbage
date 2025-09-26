#!/usr/bin/env python3
from convert_cabbage2_to_cabbage3 import Cabbage2To3Converter
import json

converter = Cabbage2To3Converter()
test_line = 'hslider bounds(310, 10,280,20), text("RES"),   range(0,1,1,8), textColour("white"), channel("RES"), valueTextBox(1), trackerColour(100,100,200)'
widget = converter.parse_widget_line(test_line)

print('Parsed widget:')
print(json.dumps(widget, indent=2))