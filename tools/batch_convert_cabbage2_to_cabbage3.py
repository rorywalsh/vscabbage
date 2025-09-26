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

def batch_convert(input_dir, output_dir, recursive=True):
    """Convert all .csd files in input directory"""
    if recursive:
        csd_files = find_csd_files(input_dir)
    else:
        csd_files = [os.path.join(input_dir, f) for f in os.listdir(input_dir)
                    if f.lower().endswith('.csd') and os.path.isfile(os.path.join(input_dir, f))]

    if not csd_files:
        print(f"No .csd files found in {input_dir}")
        return

    print(f"Found {len(csd_files)} .csd files to convert")

    converter = Cabbage2To3Converter()

    for input_file in csd_files:
        try:
            converter.convert_file(input_file, output_dir)
        except Exception as e:
            print(f"Error converting {input_file}: {e}")

    print(f"\nConversion complete. {len(csd_files)} files processed.")

def main():
    parser = argparse.ArgumentParser(description='Batch convert Cabbage2 files to Cabbage3 JSON syntax')
    parser.add_argument('input_dir', help='Input directory containing .csd files')
    parser.add_argument('--outdir', default=r'C:\Users\rory\OneDrive\Csoundfiles\cabbage3',
                       help='Output directory for converted files')
    parser.add_argument('--no-recursive', action='store_true',
                       help='Do not search subdirectories')

    args = parser.parse_args()

    if not os.path.isdir(args.input_dir):
        print(f"Error: Input directory '{args.input_dir}' does not exist")
        sys.exit(1)

    batch_convert(args.input_dir, args.outdir, recursive=not args.no_recursive)

if __name__ == '__main__':
    main()