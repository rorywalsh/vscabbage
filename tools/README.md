# Cabbage2 to Cabbage3 Converter

This tool converts Cabbage2 declarative syntax to Cabbage3 JSON syntax.

## Files

- `convert_cabbage2_to_cabbage3.py` - Single file converter
- `batch_convert_cabbage2_to_cabbage3.py` - Batch converter for multiple files

## Usage

### Single File Conversion

```bash
python convert_cabbage2_to_cabbage3.py input_file.csd [--outdir output_directory]
```

### Batch Conversion

```bash
python batch_convert_cabbage2_to_cabbage3.py input_directory [--outdir output_directory] [--no-recursive]
```

## Examples

Convert a single file:
```bash
python convert_cabbage2_to_cabbage3.py examples/button.csd
```

Convert all files in a directory:
```bash
python batch_convert_cabbage2_to_cabbage3.py examples/
```

Convert files in current directory only (no subdirectories):
```bash
python batch_convert_cabbage2_to_cabbage3.py . --no-recursive
```

## Output

Converted files will be saved with `_cabbage3` suffix in the output directory. The Cabbage section will be converted from declarative syntax to JSON format.

## Supported Widgets

The converter supports all standard Cabbage widgets:
- Sliders (horizontal, vertical, rotary)
- Buttons and checkboxes
- Combo boxes and list boxes
- Text editors and labels
- Images and keyboards
- Group boxes and forms
- And more...

## Property Mapping

Cabbage2 properties are mapped to Cabbage3 equivalents:
- `bounds` → `bounds`
- `colour` → `colour.fill`
- `textColour` → `font.colour`
- `range` → `range` object with min/max/default/skew
- And many more...

## Notes

- The converter preserves all widget properties and channels
- Group hierarchies are maintained
- Default values are set for common properties
- Color values are converted to hex format
- Text values support on/off states for toggle widgets