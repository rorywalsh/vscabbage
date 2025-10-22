<Cabbage>
[
    {
        "type": "form",
        "caption": "Slider Example",
        "size": {"width": 360, "height": 460},
        "guiMode": "queue",
        "pluginId": "def2",
        "channels": [{"id": "MainForm", "event": "valueChanged"}]
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 20, "top": 20, "width": 280, "height": 20},
        "channels": [
            {"id": "harmonic1", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 20, "top": 50, "width": 280, "height": 20},
        "channels": [
            {"id": "harmonic2", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 20, "top": 80, "width": 280, "height": 20},
        "channels": [
            {"id": "harmonic3", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 20, "top": 110, "width": 280, "height": 20},
        "channels": [
            {"id": "harmonic4", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 20, "top": 140, "width": 280, "height": 20},
        "channels": [
            {"id": "harmonic5", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 20, "top": 170, "width": 280, "height": 20},
        "channels": [
            {"id": "harmonic6", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 20, "top": 200, "width": 280, "height": 20},
        "channels": [
            {"id": "harmonic7", "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}}
        ]
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 20, "top": 230, "width": 280, "height": 20},
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

giWave  = ftgen(1, 0, 4096, 10, 1, .2, .1, .2, .1)

instr 1


    a1 = oscili(tonek(cabbageGetValue:k("harmonic1"), 10), 50, giWave)
    a2 = oscili(tonek(cabbageGetValue:k("harmonic2"), 10), 100, giWave)
    a3 = oscili(tonek(cabbageGetValue:k("harmonic3"), 10), 150, giWave)
    a4 = oscili(tonek(cabbageGetValue:k("harmonic4"), 10), 200, giWave)
    a5 = oscili(tonek(cabbageGetValue:k("harmonic5"), 10), 250, giWave)
    a6 = oscili(tonek(cabbageGetValue:k("harmonic6"), 10), 300, giWave)
    a7 = oscili(tonek(cabbageGetValue:k("harmonic7"), 10), 350, giWave)
    a8 = oscili(tonek(cabbageGetValue:k("harmonic8"), 10), 400, giWave)


    aMix = a1+a2+a3+a4+a5+a6+a7+a8
    outs(aMix*.1, aMix*.1)
endin

</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
f0 z
;starts instrument 1 and runs it for a week
i1 0 z
</CsScore>
</CsoundSynthesizer>
