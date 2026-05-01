<Cabbage>
{
    "pluginId"      : "def1",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        { "type": "form", "caption": "Label Example", "size": {"width": 580, "height": 500} },
        {
            "type"       : "label",
            "channels"   : [
                { "id": "label2", "event": "mousePressed", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.01} }
            ],
            "bounds"     : {"left": 158, "top": 37, "width": 228, "height": 21},
            "label"      : {"text": "Don't label me!!"},
            "channelType": "number",
            "automatable": 1
        }
    ]
}

</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -+rtmidi=NULL -M0 -m0d --midi-key=4 --midi-velocity-amp=5
</CsOptions>e
<CsInstruments>
; Initialize the global variables.
ksmps = 32
nchnls = 2
0dbfs = 1


; Rory Walsh 2021
;
; License: CC0 1.0 Universal
; You can copy, modify, and distribute this file,
; even for co mmercial purposes, all without asking permission.

instr 1
    kLabel  = cabbageGetValue:k("label2")
    printk2(kLabel)
endin


</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
i1 0 z
</CsScore>
</CsoundSynthesizer>
