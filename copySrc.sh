#!/bin/bash

# Set the source directories
SRC_DIR="./src/*"
CSS_FILE="./media/cabbage.css"

# Check if running on Windows (CYGWIN, MSYS, or WSL) or macOS/Linux
if [[ "$OSTYPE" == "msys"* || "$OSTYPE" == "cygwin"* || "$OSTYPE" == "win32" || "$OSTYPE" == "win64" ]]; then
    DEST_DIR="/c/ProgramData/CabbageAudio/CabbagePluginEffect"
else
    DEST_DIR="/Users/rwalsh/Library/CabbageAudio/CabbagePluginEffect"
fi

# Copy files from the source directory to the destination
cp -rfv $SRC_DIR "$DEST_DIR"
cp -rfv $CSS_FILE "$DEST_DIR"
