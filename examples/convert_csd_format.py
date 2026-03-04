#!/usr/bin/env python3
"""
Convert Cabbage CSD files from old array format to new object format.
Old: <Cabbage>[...]</Cabbage>
New: <Cabbage>{"widgets": [...]}</Cabbage>
"""

import re
import argparse
import sys
from pathlib import Path

def convert_cabbage_section(content):
    """Convert Cabbage section from array format to object format."""
    # Find Cabbage section with regex
    pattern = r'<Cabbage>\s*(\[[\s\S]*?\])\s*</Cabbage>'
    match = re.search(pattern, content)

    if not match:
        return content, False  # No change needed

    array_content = match.group(1)

    # Replace with new format
    new_section = f'<Cabbage>{{\n    "widgets": {array_content}\n}}\n</Cabbage>'

    new_content = content[:match.start()] + new_section + content[match.end():]
    return new_content, True

def convert_file(file_path):
    """Convert a single CSD file."""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        new_content, changed = convert_cabbage_section(content)

        if changed:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True, None
        else:
            return False, "No Cabbage section found or already in new format"
    except Exception as e:
        return False, str(e)

def main():
    parser = argparse.ArgumentParser(description='Convert Cabbage .csd files from old array format to new object format.')
    parser.add_argument('path', nargs='?', default='.', help='File or directory path to process (default: current directory)')
    args = parser.parse_args()

    target = Path(args.path).expanduser()
    if not target.exists():
        print(f"Error: path does not exist: {target}")
        sys.exit(1)

    if target.is_file():
        if target.suffix.lower() != '.csd':
            print(f"Error: file is not a .csd: {target}")
            sys.exit(1)
        csd_files = [target]
    else:
        csd_files = list(target.glob('*.csd'))

    print(f"Found {len(csd_files)} .csd files in: {target}")
    print()

    converted = 0
    skipped = 0
    errors = 0

    for file_path in sorted(csd_files):
        success, error = convert_file(file_path)
        if success:
            print(f"✓ Converted: {file_path.name}")
            converted += 1
        elif error:
            if "No Cabbage section" in error:
                print(f"- Skipped: {file_path.name} ({error})")
                skipped += 1
            else:
                print(f"✗ Error: {file_path.name} - {error}")
                errors += 1

    print()
    print(f"Summary: {converted} converted, {skipped} skipped, {errors} errors")

if __name__ == '__main__':
    main()
