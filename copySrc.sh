#!/bin/bash

# Define target directories based on the OS
if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32" || "$OSTYPE" == "win64" ]]; then
    TARGET_DIR_FX="/c/ProgramData/CabbageAudio/CabbageVST3Effect/cabbage/"
    TARGET_CSS_DIR_FX="/c/ProgramData/CabbageAudio/CabbageVST3Effect/"
    TARGET_DIR="/c/ProgramData/CabbageAudio/CabbageVST3Synth/cabbage/"
    TARGET_CSS_DIR="/c/ProgramData/CabbageAudio/CabbageVST3Synth/"
elif [[ "$OSTYPE" == "darwin"* ]]; then  # macOS
    TARGET_DIR_FX="$HOME/Library/CabbageAudio/CabbageVST3Effect/cabbage/"
    TARGET_CSS_DIR_FX="$HOME/Library/CabbageAudio/CabbageVST3Effect/"
    TARGET_DIR="$HOME/Library/CabbageAudio/CabbageVST3Synth/cabbage/"
    TARGET_CSS_DIR="$HOME/Library/CabbageAudio/CabbageVST3Synth/"
else  # Linux
    TARGET_DIR_FX="$HOME/.config/CabbageAudio/CabbageVST3Effect/cabbage/"
    TARGET_CSS_DIR_FX="$HOME/.config/CabbageAudio/CabbageVST3Effect/"
    TARGET_DIR="$HOME/.config/CabbageAudio/CabbageVST3Synth/cabbage/"
    TARGET_CSS_DIR="$HOME/.config/CabbageAudio/CabbageVST3Synth/"
fi
  
# Function to create directory if it doesn't exist
create_dir_if_not_exists() {
    if [ ! -d "$1" ]; then
        echo "Creating directory: $1"
        mkdir -p "$1"
    else
        echo "Directory already exists: $1"
    fi
}

# Ensure the target directories exist
create_dir_if_not_exists "$TARGET_DIR"
create_dir_if_not_exists "$TARGET_DIR_FX"
create_dir_if_not_exists "$TARGET_CSS_DIR"
create_dir_if_not_exists "$TARGET_CSS_DIR_FX"

# Copy the source files
cp -rfv ./src/cabbage/* "$TARGET_DIR"
cp -rfv ./src/cabbage/* "$TARGET_DIR_FX"
cp -rfv ./media/cabbage.css "$TARGET_CSS_DIR"
cp -rfv ./media/cabbage.css "$TARGET_CSS_DIR_FX"
