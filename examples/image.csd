<Cabbage>
[
    {"type": "form", "caption": "Label Example", "size": {"width": 500, "height": 500}, "pluginId": "def1"},
    {
        "type": "image",
        "channels": [
            {
                "id": "image1X",
                "event": "mouseMoveX",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.01}
            },
            {
                "id": "image1Y",
                "event": "mouseMoveY",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.01}
            }
        ],
        "bounds": {"left": 10, "top": 10, "width": 480, "height": 480},
        "automatable": 1
    }
]
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
; even for commercial purposes, all without asking permission.

instr 1
    imageX:k, trigX:k = cabbageGetValue:k("image1X")
    imageY:k, trigY:k = cabbageGetValue:k("image1Y")
    printf("Current Mouse X Position: %f\n", trigX, imageX)
    printf("Current Mouse Y Position: %f\n", trigY, imageY)
endin


</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
i1 0 z
</CsScore>
</CsoundSynthesizer>
