#!/bin/bash

# Define the target directory
if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32" || "$OSTYPE" == "win64" ]]; then
    TARGET_DIR_FX="/c/ProgramData/CabbageAudio/CabbageVST3Effect/cabbage/"
    TARGET_CSS_DIR_FX="/c/ProgramData/CabbageAudio/CabbageVST3Effect/"
    TARGET_DIR="/c/ProgramData/CabbageAudio/CabbageVST3Synth/cabbage/"
    TARGET_CSS_DIR="/c/ProgramData/CabbageAudio/CabbageVST3Synth/"
else
    TARGET_DIR_FX="/Users/rwalsh/Library/CabbageAudio/CabbageVST3Effect/cabbage/"
    TARGET_CSS_DIR_FX="/Users/rwalsh/Library/CabbageAudio/CabbageVST3Effect/"
    TARGET_DIR="/Users/rwalsh/Library/CabbageAudio/CabbageVST3Synth/cabbage/"
    TARGET_CSS_DIR="/Users/rwalsh/Library/CabbageAudio/CabbageVST3Synth/"
fi

# Check if the target directory exists, and create it if it doesn't
if [ ! -d "$TARGET_DIR" ]; then
    echo "Target directory $TARGET_DIR does not exist. Creating it."
    mkdir -p "$TARGET_DIR"
else
    echo "Target directory $TARGET_DIR already exists."
fi

# Copy the source files
cp -rfv ./src/cabbage/* "$TARGET_DIR"
cp -rfv ./src/cabbage/* "$TARGET_DIR_FX"
cp -rfv ./media/cabbage.css "$TARGET_CSS_DIR"
cp -rfv ./media/cabbage.css "$TARGET_CSS_DIR_FX"