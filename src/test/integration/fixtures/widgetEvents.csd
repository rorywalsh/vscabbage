<CsoundSynthesizer>
<CsOptions>
-odac
</CsOptions>
<CsInstruments>
sr = 44100
ksmps = 32
nchnls = 2
0dbfs = 1

instr 1
endin
</CsInstruments>
<CsScore>
</CsScore>
</CsoundSynthesizer>
<Cabbage>
{
    "widgets": [
        {
            "type": "form",
            "id": "form1",
            "caption": { "text": "Widget Event Contract" },
            "size": { "width": 620, "height": 420 }
        },
        {
            "type": "button",
            "id": "play",
            "channels": [ { "id": "play", "range": { "min": 0, "max": 1, "defaultValue": 0 } } ],
            "bounds": { "left": 20, "top": 20, "width": 100, "height": 40 }
        },
        {
            "type": "checkBox",
            "id": "bypass",
            "channels": [ { "id": "bypass", "range": { "min": 0, "max": 1, "defaultValue": 0 } } ],
            "bounds": { "left": 140, "top": 20, "width": 120, "height": 40 }
        },
        {
            "type": "optionButton",
            "id": "mode",
            "channels": [ { "id": "mode", "range": { "min": 0, "max": 2, "defaultValue": 0 } } ],
            "items": [ "Sine", "Square", "Saw" ],
            "bounds": { "left": 280, "top": 20, "width": 120, "height": 40 }
        },
        {
            "type": "comboBox",
            "id": "wave",
            "channels": [ { "id": "wave", "range": { "min": 0, "max": 2, "defaultValue": 0 } } ],
            "items": [ "Sine", "Square", "Saw" ],
            "bounds": { "left": 420, "top": 20, "width": 160, "height": 40 }
        },
        {
            "type": "listBox",
            "id": "preset",
            "channels": [ { "id": "preset", "range": { "min": 0, "max": 2, "defaultValue": 0 } } ],
            "items": [ "Warm", "Bright", "Dark" ],
            "bounds": { "left": 20, "top": 80, "width": 160, "height": 120 }
        },
        {
            "type": "rotarySlider",
            "id": "freq",
            "channels": [ { "id": "freq", "range": { "min": 20, "max": 20000, "defaultValue": 440 } } ],
            "bounds": { "left": 20, "top": 220, "width": 100, "height": 100 }
        },
        {
            "type": "horizontalSlider",
            "id": "gain",
            "channels": [ { "id": "gain", "range": { "min": 0, "max": 1, "defaultValue": 0.5 } } ],
            "bounds": { "left": 140, "top": 240, "width": 220, "height": 40 }
        },
        {
            "type": "verticalSlider",
            "id": "level",
            "channels": [ { "id": "level", "range": { "min": 0, "max": 1, "defaultValue": 0.5 } } ],
            "bounds": { "left": 400, "top": 220, "width": 40, "height": 160 }
        },
        {
            "type": "label",
            "id": "gainLabel",
            "active": false,
            "channels": [ { "id": "gainLabel", "range": { "min": 0, "max": 1 } } ],
            "bounds": { "left": 140, "top": 250, "width": 220, "height": 20 },
            "label": { "text": "Gain" }
        }
    ]
}
</Cabbage>
