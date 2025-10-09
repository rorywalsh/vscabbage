#!/usr/bin/env python3
"""
Batch Cabbage2 to Cabbage3 Converter

Converts multiple Cabbage2 .csd files to Cabbage3 JSON syntax.
"""

import os
import sys
import argparse
from pathlib import Path
from convert_cabbage2_to_cabbage3 import Cabbage2To3Converter

def find_csd_files(directory):
    """Find all .csd files in directory and subdirectories"""
    csd_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.lower().endswith('.csd'):
                csd_files.append(os.path.join(root, file))
    return csd_files

def batch_convert(input_dir, output_dir=None, recursive=True):
    """Convert all .csd files in input directory"""
    input_path = Path(input_dir)
    
    # If no output directory specified, create one based on input directory
    if output_dir is None:
        output_dir = str(input_path.parent / f"{input_path.name}_convert")
    
    if recursive:
        csd_files = find_csd_files(input_dir)
    else:
        csd_files = [os.path.join(input_dir, f) for f in os.listdir(input_dir)
                    if f.lower().endswith('.csd') and os.path.isfile(os.path.join(input_dir, f))]

    if not csd_files:
        print(f"No .csd files found in {input_dir}")
        return

    print(f"Found {len(csd_files)} .csd files to convert")
    print(f"Output directory: {output_dir}")

    converter = Cabbage2To3Converter()

    for input_file in csd_files:
        try:
            # Calculate relative path from input directory
            input_path = Path(input_file)
            input_dir_path = Path(input_dir)
            relative_path = input_path.relative_to(input_dir_path)
            
            # Create corresponding output path
            output_file_dir = Path(output_dir) / relative_path.parent
            output_file_dir.mkdir(parents=True, exist_ok=True)
            
            converter.convert_file(input_file, str(output_file_dir))
        except Exception as e:
            print(f"Error converting {input_file}: {e}")

    print(f"\nConversion complete. {len(csd_files)} files processed.")
    print(f"Converted files saved to: {output_dir}")

def main():
    parser = argparse.ArgumentParser(description='Batch convert Cabbage2 files to Cabbage3 JSON syntax')
    parser.add_argument('input_dir', help='Input directory containing .csd files')
    default_outdir = os.path.join(os.path.expanduser('~'), 'OneDrive', 'Csoundfiles', 'cabbage3')
    parser.add_argument('--outdir', default=default_outdir,
                       help='Output directory for converted files')
    parser.add_argument('--no-recursive', action='store_true',
                       help='Do not search subdirectories')

    args = parser.parse_args()

    if not os.path.isdir(args.input_dir):
        print(f"Error: Input directory '{args.input_dir}' does not exist")
        sys.exit(1)

    # If using default output dir, append the input directory name to create a subfolder
    if args.outdir == default_outdir:
        args.outdir = os.path.join(args.outdir, os.path.basename(args.input_dir))

    batch_convert(args.input_dir, args.outdir, recursive=not args.no_recursive)

if __name__ == '__main__':
    main()