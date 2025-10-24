<Cabbage>
[
    {"type": "form", "caption": "Combobox Example", "size": {"width": 580, "height": 500}, "pluginId": "def1"},
    {
        "type": "rotarySlider",
        "bounds": {"left": 12, "top": 9, "width": 86, "height": 90},
        "channels": [{"id": "att", "range": {"min": 0, "max": 1, "defaultValue": 0.01, "skew": 1, "increment": 0.001}}],
        "text": "Att."
    },
    {
        "type": "rotarySlider",
        "bounds": {"left": 99, "top": 9, "width": 86, "height": 90},
        "channels": [{"id": "dec", "range": {"min": 0, "max": 1, "defaultValue": 0.4, "skew": 1, "increment": 0.001}}],
        "text": "Dec."
    },
    {
        "type": "rotarySlider",
        "bounds": {"left": 187, "top": 9, "width": 86, "height": 90},
        "channels": [{"id": "sus", "range": {"min": 0, "max": 1, "defaultValue": 0.7, "skew": 1, "increment": 0.001}}],
        "text": "Sus."
    },
    {
        "type": "rotarySlider",
        "bounds": {"left": 274, "top": 9, "width": 86, "height": 90},
        "channels": [{"id": "rel", "range": {"min": 0, "max": 1, "defaultValue": 0.8, "skew": 1, "increment": 0.001}}],
        "text": "Rel."
    },
    {
        "type": "keyboard",
        "bounds": {"left": 12, "top": 104, "width": 348, "height": 80},
        "channels": [{"id": "keyboard"}]
    },
    {
        "type": "comboBox",
        "bounds": {"left": 260, "top": 188, "width": 100, "height": 30},
        "channels": [{"id": "waveform"}],
        "corners": 5,
        "items": ["Saw", "Square", "Triangle"]
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

<Cabbage>
[
    {"type": "form", "caption": "Combobox Example", "size": {"width": 580, "height": 500}, "pluginId": "def1"},
    {
        "type": "rotarySlider",
        "bounds": {"left": 12, "top": 9, "width": 86, "height": 90},
        "channels": [{"id": "att", "range": {"min": 0, "max": 1, "defaultValue": 0.01, "skew": 1, "increment": 0.001}}],
        "text": "Att."
    },
    {
        "type": "rotarySlider",
        "bounds": {"left": 99, "top": 9, "width": 86, "height": 90},
        "channels": [{"id": "dec", "range": {"min": 0, "max": 1, "defaultValue": 0.4, "skew": 1, "increment": 0.001}}],
        "text": "Dec."
    },
    {
        "type": "rotarySlider",
        "bounds": {"left": 187, "top": 9, "width": 86, "height": 90},
        "channels": [{"id": "sus", "range": {"min": 0, "max": 1, "defaultValue": 0.7, "skew": 1, "increment": 0.001}}],
        "text": "Sus."
    },
    {
        "type": "rotarySlider",
        "bounds": {"left": 274, "top": 9, "width": 86, "height": 90},
        "channels": [{"id": "rel", "range": {"min": 0, "max": 1, "defaultValue": 0.8, "skew": 1, "increment": 0.001}}],
        "text": "Rel."
    },
    {
        "type": "keyboard",
        "bounds": {"left": 12, "top": 104, "width": 348, "height": 80},
        "channels": [{"id": "keyboard"}]
    },
    {
        "type": "comboBox",
        "bounds": {"left": 260, "top": 188, "width": 100, "height": 30},
        "channels": [{"id": "waveform"}],
        "corners": 5,
        "items": ["Saw", "Square", "Triangle"]
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
    
    vcoModes:i[] fillarray 0, 10, 12
    att:i = cabbageGetValue("att")
    dec:i = cabbageGetValue("dec")
    sus:i = cabbageGetValue("sus")
    rel:i = cabbageGetValue("rel")
    env:k = madsr(att, dec, sus, rel)
    vcoOut:a = vco2(env*p5*.5, cpsmidinn:k(p4), vcoModes[cabbageGetValue:i("waveform")])
    outs(vcoOut, vcoOut)
    
endin


</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
f0 z
</CsScore>
</CsoundSynthesizer>



</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
f0 z
</CsScore>
</CsoundSynthesizer>
