#!/bin/bash

# Define target directories based on the OS
if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32" || "$OSTYPE" == "win64" ]]; then
    TARGET_DIR_FX="/c/ProgramData/CabbageAudio/CabbagePluginEffect/cabbage/"
    TARGET_CSS_DIR_FX="/c/ProgramData/CabbageAudio/CabbagePluginEffect/"
    TARGET_DIR="/c/ProgramData/CabbageAudio/CabbagePluginSynth/cabbage/"
    TARGET_CSS_DIR="/c/ProgramData/CabbageAudio/CabbagePluginSynth/"
    TARGET_DIR_FXd="/c/ProgramData/CabbageAudio/CabbagePluginEffectd/cabbage/"
    TARGET_CSS_DIR_FXd="/c/ProgramData/CabbageAudio/CabbagePluginEffectd/"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    TARGET_DIR_FX="/Users/rwalsh/Library/CabbageAudio/CabbagePluginEffect/cabbage/"
    TARGET_CSS_DIR_FX="/Users/rwalsh/Library/CabbageAudio/CabbagePluginEffect/"
    TARGET_DIR="/Users/rwalsh/Library/CabbageAudio/CabbagePluginSynth/cabbage/"
    TARGET_CSS_DIR="/Users/rwalsh/Library/CabbageAudio/CabbagePluginSynth/"
else
    # Linux-specific directory
    TARGET_DIR_FX="$HOME/.config/CabbageAudio/CabbagePluginEffect/cabbage/"
    TARGET_CSS_DIR_FX="$HOME/.config/CabbageAudio/CabbagePluginEffect/"
    TARGET_DIR="$HOME/.config/CabbageAudio/CabbagePluginSynth/cabbage/"
    TARGET_CSS_DIR="$HOME/.config/CabbageAudio/CabbagePluginSynth/"
fi

# Check if the targets directory exists, and create it if it doesn't
if [ ! -d "$TARGET_DIR" ]; then
    echo "Target directory $TARGET_DIR does not exist. Creating it."
    mkdir -p "$TARGET_DIR"
else
    echo "Target directory $TARGET_DIR already exists."
fi

if [ ! -d "$TARGET_DIR_FX" ]; then
    echo "Target directory $TARGET_DIR_FX does not exist. Creating it."
    mkdir -p "$TARGET_DIR_FX"
else
    echo "Target directory $TARGET_DIR_FX already exists."
fi

if [ ! -d "$TARGET_DIR_FXd" ]; then
    echo "Target directory $TARGET_DIR_FXd does not exist. Creating it."
    mkdir -p "$TARGET_DIR_FXd"
else
    echo "Target directory $TARGET_DIR_FXd already exists."
fi
# Copy the source files
cp -rfv ./src/cabbage/* "$TARGET_DIR"
cp -rfv ./src/cabbage/* "$TARGET_DIR_FX"
cp -rfv ./src/cabbage/* "$TARGET_DIR_FXd"
cp -rfv ./media/cabbage.css "$TARGET_CSS_DIR"
cp -rfv ./media/cabbage.css "$TARGET_CSS_DIR_FX"
cp -rfv ./media/cabbage.css "$TARGET_CSS_DIR_FXd"
