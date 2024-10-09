This folder contains all the files needed to run a Cabbage plugin using the builtin widgets. When exporting a plugin, Cabbage will copy all of these files and place them into the CabbageAudio/$PluginName directory. 

On MacOS the fixed output location is:

`/Users/rwalsh/Library/CabbageAudio/$PluginName`

On Windows the fixed output location is:

`C:\Program Data\CabbageAudio\$PluginName`

Cabbage expects to find plugin rsources in these locations. Placed resources in another location will lead to undefined behaviour. 

These files are also used by the vscode extension. 
