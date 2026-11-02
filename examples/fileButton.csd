<Cabbage>
{
    "pluginId"      : "def1",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        {
            "type"   : "form",
            "caption": "File Button Example",
            "size"   : {"width": 400, "height": 300},
            "guiMode": "queue"
        },
        {
            "type"    : "fileButton",
            "bounds"  : {"left": 20, "top": 20, "width": 120, "height": 30},
            "channels": [ {"id": "audioFile"} ],
            "label"   : { "text": {"off": "Choose File", "on": "Choose File"} },
            "filters" : "*.wav;*.aif;*.mp3",
            "mode"    : "file"
        },
        {
            "type"    : "textEditor",
            "bounds"  : {"left": 20, "top": 62, "width": 360, "height": 80},
            "channels": [ {"id": "infoText"} ],
            "label"   : {"text": "No file selected"},
            "readOnly": 1,
            "wrap"    : 1
        }
    ]
}

</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -+rtmidi=NULL -M0
</CsOptions>
<CsInstruments>
; Initialize the global variables.
ksmps = 32
nchnls = 2
0dbfs = 1

; Rory Walsh 2021
;
; License: CC0 1.0 Universal
; You can copy, modify, and distribute this file,
; even for commercial purposes, all without asking permission.

instr Loader
    file:CabbageStrTrig = cabbageGetValue("audioFile")

    if file.trig == 1 then
        if active:k(nstrnum("Player")) > 0 then
            turnoff2(nstrnum("Player"), 0, 0)
        endif
        event("i", "Player", 0, 3600)
    endif
endin

instr Player
    path:S = cabbageGetValue("audioFile")
    cabbageSet("infoText", "label.text", path)
    if filevalid(path) == 1 then
        if filenchnls(path) == 2 then
            sigL:a, sigR:a = diskin2(path, 1, 0, 1)
            outs(sigL, sigR)
        else
            sig:a = diskin2(path, 1, 0, 1)
            outs(sig, sig)
        endif
    else
        prints("File not found: %s\n", path)
        turnoff()
    endif
endin

</CsInstruments>
<CsScore>
;starts the loader and runs it for a week
i"Loader" 0 z
</CsScore>
</CsoundSynthesizer>
