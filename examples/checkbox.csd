<Cabbage>[
{"type": "form", "caption": "Button Example", "size": {"width": 380.0, "height": 300.0}, "guiMode": "queue", "pluginId": "def1"},
{"type": "checkBox", "bounds": {"left": 10.0, "top": 16.0, "width": 126.0, "height": 18.0}, "channel": "trigger", "text": "Synth Enabled", "corners": 2.0},
{"type": "button", "bounds": {"left": 146.0, "top": 12.0, "width": 80.0, "height": 30.0}, "channel": "mute", "text": {"off": "Unmute", "on": "Mute"}, "corners": 2.0},
{"type": "button", "bounds": {"left": 240.0, "top": 12.0, "width": 121.0, "height": 30.0}, "channel": "toggleFreq", "text": "Toggle Freq"}
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

    kVal, kTrig cabbageGetValue "trigger"

    if kTrig == 1 then
        if kVal == 1 then
            event "i", "Synth", 0, 3600
        else
            iInstr nstrnum "Synth"
            turnoff2 iInstr, 0, 0
        endif
    endif

endin

instr Synth
    prints "Starting Synth"
    kMute cabbageGetValue "mute"
    a1 oscili .5*kMute, 300*(cabbageGetValue:k("toggleFreq")+1)
    outs a1, a1  
endin

                

</CsInstruments>
<CsScore>
;starts instrument 1 and runs it for a week
i1 0 z
</CsScore>
</CsoundSynthesizer>