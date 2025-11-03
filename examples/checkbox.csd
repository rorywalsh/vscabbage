<Cabbage>
[
    {
        "type": "form",
        "caption": "Button Example",
        "size": {"width": 380, "height": 300},
        "guiMode": "queue",
        "pluginId": "def1"
    },
    {
        "type": "checkBox",
        "bounds": {"left": 10, "top": 16, "width": 126, "height": 18},
        "channels": [
            {
                "id": "trigger",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 1}
            }
        ],
        "label": {"text": "Synth Enabled"}
    },
    {
        "type": "button",
        "bounds": {"left": 146, "top": 12, "width": 80, "height": 30},
        "channels": [
            {
                "id": "mute",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 1}
            }
        ],
        "label": {"text": {"off": "Unmute", "on": "Mute"}}
    },
    {
        "type": "button",
        "bounds": {"left": 240, "top": 12, "width": 121, "height": 30},
        "channels": [{"id": "toggleFreq", "event": "valueChanged"}],
        "label": {"text": {"off": "Toggle Freq", "on": "Toggle Freq"}},
        "state": {"off": {"backgroundColor": "#ff0000"}, "on": {"backgroundColor": "#0295cf"}}
    }
]
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -+rtmidi=NULL -M0 -m0d
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

instr 1
    
    kVal, kTrig = cabbageGetValue("trigger")
    
    if kTrig == 1 then
        if kVal == 1 then
            event("i", "Synth", 0, 3600)
        else
            iInstrNum = nstrnum("Synth")
            turnoff2(iInstrNum, 0, 0)
        endif
    endif
    
endin

instr Synth
    prints("Starting Synth")
    kMute = cabbageGetValue("mute")
    a1 = oscili(.5*kMute, 300*(cabbageGetValue("toggleFreq")+1))
    outs(a1, a1)
endin




</CsInstruments>
<CsScore>
;starts instrument 1 and runs it for a week
i1 0 z
</CsScore>
</CsoundSynthesizer>