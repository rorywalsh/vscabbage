<Cabbage>
[
    {"type": "form", "caption": "Button Example", "size": {"width": 380, "height": 300}, "pluginId": "def1"},
    {
        "type": "button",
        "bounds": {"left": 16, "top": 12, "width": 117, "height": 30},
        "channels": [{"id": "trigger", "event": "valueChanged"}],
        "label": {"text": {"off": "Start Synth", "on": "Stop Synth"}}
    },
    {
        "type": "button",
        "bounds": {"left": 146, "top": 12, "width": 80, "height": 30},
        "channels": [{"id": "mute", "event": "valueChanged"}],
        "label": {"text": {"off": "Unmute", "on": "Mute"}}
    },
    {
        "type": "button",
        "bounds": {"left": 240, "top": 12, "width": 121, "height": 30},
        "channels": [{"id": "toggleFreq", "event": "valueChanged"}],
        "label": {"text": {"off": "Toggle Freq", "on": "Toggle Freq"}},
        "state": {"off": {"backgroundColor": "#1da96fff"}, "on": {"backgroundColor": "#0295cf"}}
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
    
    val:k, trig:k = cabbageGetValue("trigger")
    
    if trig == 1 then
        if val == 1 then
            event("i", "Synth", 0, 3600)
        else
            instrNum:i = nstrnum("Synth")
                turnoff2(instrNum, 0, 0)
            endif
        endif
        
    endin
    
    instr Synth
        prints("Starting Synth")
        mute:k = cabbageGetValue("mute")
        outSig:a = oscili(.5*mute, 300*(cabbageGetValue("toggleFreq")+1))
        outs(outSig, outSig)
    endin
    
    
    
    </CsInstruments>
    <CsScore>
    ;starts instrument 1 and runs it for a week
    i1 0 z
    </CsScore>
    </CsoundSynthesizer>