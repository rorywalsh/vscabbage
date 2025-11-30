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

# Default path for user's OneDrive CustomWidgets folder (cross-platform via $HOME)
# Assumes OneDrive/Csoundfiles/cabbage3/CustomWidgets exists under the user's home folder on Windows and macOS
CUSTOM_WIDGETS_DIR="$HOME/OneDrive/Csoundfiles/cabbage3/CustomWidgets/cabbage/"
CUSTOM_WIDGETS_PARENT_DIR="$(dirname "$CUSTOM_WIDGETS_DIR")/"

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
# Ensure CustomWidgets parent directory exists (optional)
if [ ! -d "$CUSTOM_WIDGETS_PARENT_DIR" ]; then
    echo "CustomWidgets parent target $CUSTOM_WIDGETS_PARENT_DIR does not exist. Creating it."
    mkdir -p "$CUSTOM_WIDGETS_PARENT_DIR"
else
    echo "CustomWidgets parent target $CUSTOM_WIDGETS_PARENT_DIR already exists."
fi
# Copy the source files
cp -rfv ./src/cabbage/* "$TARGET_DIR"
cp -rfv ./src/cabbage/* "$TARGET_DIR_FX"
cp -rfv ./src/cabbage/* "$TARGET_DIR_FXd"
cp -rfv ./media/cabbage.css "$TARGET_CSS_DIR"
cp -rfv ./media/cabbage.css "$TARGET_CSS_DIR_FX"
cp -rfv ./media/cabbage.css "$TARGET_CSS_DIR_FXd"

# Copy propertyPanel.js and widgetWrapper.js to the parent of the target cabbage directory
cp -fv ./src/propertyPanel.js "$TARGET_CSS_DIR"
cp -fv ./src/widgetWrapper.js "$TARGET_CSS_DIR"
cp -fv ./src/propertyPanel.js "$TARGET_CSS_DIR_FX"
cp -fv ./src/widgetWrapper.js "$TARGET_CSS_DIR_FX"
cp -fv ./src/propertyPanel.js "$TARGET_CSS_DIR_FXd"
cp -fv ./src/widgetWrapper.js "$TARGET_CSS_DIR_FXd"

# Copy only the contents of ./src/cabbage (excluding its widgets subfolder)
if [ -d "./src/cabbage" ]; then
    echo "Copying ./src/cabbage (excluding widgets) to $CUSTOM_WIDGETS_DIR"
    # Ensure target exists
    mkdir -p "$CUSTOM_WIDGETS_DIR"
    for item in ./src/cabbage/*; do
        base=$(basename "$item")
        if [ "$base" = "widgets" ]; then
            echo "Skipping ./src/cabbage/widgets"
            continue
        fi
        cp -rfv "$item" "$CUSTOM_WIDGETS_DIR"
    done
else
    echo "Source ./src/cabbage not found; skipping CustomWidgets cabbage copy."
fi

# Copy the stylesheet to the CustomWidgets parent folder
if [ -d "$CUSTOM_WIDGETS_PARENT_DIR" ]; then
    echo "Copying media/cabbage.css to $CUSTOM_WIDGETS_PARENT_DIR"
    cp -fv ./media/cabbage.css "$CUSTOM_WIDGETS_PARENT_DIR"
fi
