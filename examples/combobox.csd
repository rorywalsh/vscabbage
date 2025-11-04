<Cabbage>
[
    {"type": "form", "caption": "Combobox Example", "size": {"width": 580, "height": 500}, "pluginId": "def1"},
    {
        "type": "rotarySlider",
        "id": "att",
        "bounds": {"left": 125, "top": 7, "width": 86, "height": 90},
        "channels": [
            {
                "id": "att",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1, "value": 0.01, "defaultValue": 0.01, "skew": 1, "increment": 0.001}
            }
        ],
        "label": {"text": "Att."}
    },
    {
        "type": "rotarySlider",
        "id": "dec",
        "bounds": {"left": 300, "top": 7, "width": 85, "height": 90},
        "channels": [
            {
                "id": "dec",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1, "value": 0.4, "defaultValue": 0.4, "skew": 1, "increment": 0.001}
            }
        ],
        "label": {"text": "Dec."}
    },
    {
        "type": "rotarySlider",
        "id": "sus",
        "bounds": {"left": 213, "top": 7, "width": 86, "height": 90},
        "channels": [
            {
                "id": "sus",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1, "value": 0.7, "defaultValue": 0.7, "skew": 1, "increment": 0.001}
            }
        ],
        "label": {"text": "Sus."}
    },
    {
        "type": "rotarySlider",
        "id": "rel",
        "bounds": {"left": 387, "top": 7, "width": 86, "height": 90},
        "channels": [
            {
                "id": "rel",
                "event": "valueChanged",
                "range": {"min": 0, "max": 1, "value": 0.8, "defaultValue": 0.8, "skew": 1, "increment": 0.001}
            }
        ],
        "label": {"text": "Rel."}
    },
    {
        "type": "keyboard",
        "id": "keyboard",
        "bounds": {"left": 12, "top": 104, "width": 557, "height": 80},
        "channels": [
            {
                "id": "keyboard",
                "event": "valueChanged",
                "range": {"defaultValue": 0, "increment": 0.001, "max": 1, "min": 0, "skew": 1}
            }
        ]
    },
    {
        "type": "comboBox",
        "id": "waveform",
        "bounds": {"left": 249, "top": 186, "width": 100, "height": 30},
        "channels": [
            {
                "id": "waveform",
                "event": "valueChanged",
                "range": {"defaultValue": 0, "increment": 0.001, "max": 1, "min": 0, "skew": 1}
            }
        ],
        "style": {"borderRadius": 5},
        "items": ["Saw", "Square", "Triangle"],
        "max": 2
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
    print cabbageGetValue:i("waveform")
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
