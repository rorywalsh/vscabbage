<Cabbage>
{
    "pluginId"      : "def1",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        { "type": "form", "caption": "Form Example", "size": {"width": 380, "height": 200} },
        {
            "type"    : "label",
            "channels": [
                { "id": "info", "event": "valueChanged" }
            ],
            "bounds"  : {"left": 10, "top": 16, "width": 360, "height": 20},
            "label"   : {"text": "The form sets this window's caption and size"}
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


; Rory Walsh 2021
;
; License: CC0 1.0 Universal
; You can copy, modify, and distribute this file,
; even for commercial purposes, all without asking permission.

instr 1
    prints("Form example running\n")
endin


</CsInstruments>
<CsScore>
;starts instrument 1 and runs it for a week
i1 0 z
</CsScore>
</CsoundSynthesizer>
