<Cabbage>
{
    "pluginId"      : "def1",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        { "type": "form", "caption": "Csound Output Example", "size": {"width": 580, "height": 420} },
        {
            "type"   : "csoundOutput",
            "bounds" : {"left": 16, "top": 16, "width": 548, "height": 330},
            "label"  : {"text": "Csound console output:"},
            "style"  : {
                "backgroundColor": "#1e1e1e",
                "fontFamily"     : "courier new, monospace",
                "fontSize"       : 13,
                "fontColor"      : "#dddddd",
                "textAlign"      : "left"
            }
        },
        {
            "type"    : "button",
            "bounds"  : {"left": 16, "top": 360, "width": 140, "height": 30},
            "channels": [ {"id": "printMessage", "event": "valueChanged"} ],
            "label"   : { "text": {"off": "Print Message", "on": "Print Message"} }
        }
    ]
}

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

; Rory Walsh 2026
;
; License: CC0 1.0 Universal
; You can copy, modify, and distribute this file,
; even for commercial purposes, all without asking permission.

instr 1
    trigger:CabbageNumTrig = cabbageGetValue("printMessage")
    printf("Button pressed at %.2f seconds\n", trigger.trig, timeinsts())
endin


</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
i1 0 z
</CsScore>
</CsoundSynthesizer>
