<Cabbage>
[
    {
        "type": "form",
        "caption": "Slider Example",
        "size": {"width": 520, "height": 480},
        "guiMode": "queue",
        "pluginId": "def1"
    },
    {
        "type": "verticalSlider",
        "bounds": {"left": 20, "top": 20, "width": 100, "height": 200},
        "label": {"text": "Harmonic 1"},
        "channels": [
            {"id": "harmonic1", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "verticalSlider",
        "bounds": {"left": 130, "top": 20, "width": 100, "height": 200},
        "label": {"text": "Harmonic 2"},
        "channels": [
            {"id": "harmonic2", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "verticalSlider",
        "bounds": {"left": 240, "top": 20, "width": 100, "height": 200},
        "label": {"text": "Harmonic 3"},
        "channels": [
            {"id": "harmonic3", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "verticalSlider",
        "bounds": {"left": 350, "top": 20, "width": 100, "height": 200},
        "label": {"text": "Harmonic 4"},
        "channels": [
            {"id": "harmonic4", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "verticalSlider",
        "bounds": {"left": 20, "top": 240, "width": 100, "height": 200},
        "label": {"text": "Harmonic 5"},
        "channels": [
            {"id": "harmonic5", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "verticalSlider",
        "bounds": {"left": 130, "top": 240, "width": 100, "height": 200},
        "label": {"text": "Harmonic 6"},
        "channels": [
            {"id": "harmonic6", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "verticalSlider",
        "bounds": {"left": 240, "top": 240, "width": 100, "height": 200},
        "label": {"text": "Harmonic 7"},
        "channels": [
            {"id": "harmonic7", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "verticalSlider",
        "bounds": {"left": 350, "top": 240, "width": 100, "height": 200},
        "label": {"text": "Harmonic 8"},
        "channels": [
            {"id": "harmonic8", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    }
]
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d
</CsOptions>e
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
    
    harm1:a = oscili(tonek(cabbageGetValue:k("harmonic1"), 10), 50,  wave)
    harm2:a = oscili(tonek(cabbageGetValue:k("harmonic2"), 10), 100, wave)
    harm3:a = oscili(tonek(cabbageGetValue:k("harmonic3"), 10), 150, wave)
    harm4:a = oscili(tonek(cabbageGetValue:k("harmonic4"), 10), 200, wave)
    harm5:a = oscili(tonek(cabbageGetValue:k("harmonic5"), 10), 250, wave)
    harm6:a = oscili(tonek(cabbageGetValue:k("harmonic6"), 10), 300, wave)
    harm7:a = oscili(tonek(cabbageGetValue:k("harmonic7"), 10), 350, wave)
    harm8:a = oscili(tonek(cabbageGetValue:k("harmonic8"), 10), 400, wave)
    
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
