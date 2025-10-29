<Cabbage>
[
    {
        "type": "form",
        "caption": "Slider Example",
        "size": {"width": 440, "height": 100},
        "guiMode": "queue",
        "pluginId": "def2"
    },
    {
        "type": "numberSlider",
        "bounds": {"left": 20, "top": 20, "width": 80, "height": 20},
        "channels": [
            {
                "id": "harmonic1",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 10}
            }
        ]
    },
    {
        "type": "numberSlider",
        "bounds": {"left": 120, "top": 20, "width": 80, "height": 20},
        "channels": [
            {
                "id": "harmonic2",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 10}
            }
        ]
    },
    {
        "type": "numberSlider",
        "bounds": {"left": 220, "top": 20, "width": 80, "height": 20},
        "channels": [
            {
                "id": "harmonic3",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 10}
            }
        ]
    },
    {
        "type": "numberSlider",
        "bounds": {"left": 320, "top": 20, "width": 80, "height": 20},
        "channels": [
            {
                "id": "harmonic4",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 10}
            }
        ]
    },
    {
        "type": "numberSlider",
        "bounds": {"left": 20, "top": 50, "width": 80, "height": 20},
        "channels": [
            {
                "id": "harmonic5",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 10}
            }
        ]
    },
    {
        "type": "numberSlider",
        "bounds": {"left": 120, "top": 50, "width": 80, "height": 20},
        "channels": [
            {
                "id": "harmonic6",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 10}
            }
        ]
    },
    {
        "type": "numberSlider",
        "bounds": {"left": 220, "top": 50, "width": 80, "height": 20},
        "channels": [
            {
                "id": "harmonic7",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 10}
            }
        ]
    },
    {
        "type": "numberSlider",
        "bounds": {"left": 320, "top": 50, "width": 80, "height": 20},
        "channels": [
            {
                "id": "harmonic8",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 10}
            }
        ]
    }
]
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d
</CsOptions>
<CsInstruments>
; Initialize the global variables.
ksmps = 16
nchnls = 2
0dbfs = 1

; Rory Walsh 2021
;
; License: CC0 1.0 Universal
; You can copy, modify, and distribute this file,
; even for commercial purposes, all without asking permission.

wave@global:i = ftgen(1, 0, 4096, 10, 1, .2, .1, .2, .1)

instr 1
    
    harm1:a = oscili(1, tonek(cabbageGetValue:k("harmonic1"), 10), wave)
    harm2:a = oscili(1, tonek(cabbageGetValue:k("harmonic2"), 10), wave)
    harm3:a = oscili(1, tonek(cabbageGetValue:k("harmonic3"), 10), wave)
    harm4:a = oscili(1, tonek(cabbageGetValue:k("harmonic4"), 10), wave)
    harm5:a = oscili(1, tonek(cabbageGetValue:k("harmonic5"), 10), wave)
    harm6:a = oscili(1, tonek(cabbageGetValue:k("harmonic6"), 10), wave)
    harm7:a = oscili(1, tonek(cabbageGetValue:k("harmonic7"), 10), wave)
    harm8:a = oscili(1, tonek(cabbageGetValue:k("harmonic8"), 10), wave)
    
    mix:a = harm1+harm2+harm3+harm4+harm5+harm6+harm7+harm8
    outs(mix*.1, mix*.1)
endin

</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
f0 z
;starts instrument 1 and runs it for a week
i1 0 z
</CsScore>
</CsoundSynthesizer>
