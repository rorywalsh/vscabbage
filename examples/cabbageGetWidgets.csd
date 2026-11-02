<Cabbage>
{
    "pluginId"      : "GWdt",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        { "type": "form", "caption": "Simple Instrument", "size": {"width": 600, "height": 300} },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 50, "top": 50, "width": 100, "height": 100},
            "channels": [
                {
                    "id"   : "gain",
                    "event": "valueChanged",
                    "range": {"min": 0, "max": 1, "defaultValue": 0.5, "skew": 1, "increment": 0.001}
                }
            ],
            "label"  : {"text": "Gain"}
        },
        {
            "type"    : "button",
            "bounds"  : {"left": 200, "top": 80, "width": 80, "height": 40},
            "channels": [ {"id": "trigger", "event": "valueChanged"} ],
            "label"   : { "text": {"on": "On", "off": "Off"} }
        }
    ]
}
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-dm0 -n
</CsOptions>
<CsInstruments>
ksmps = 32
nchnls = 2
0dbfs = 1

instr 1
    ; Retrieve all widget IDs
    SWidgets[] = cabbageGetWidgets()
    i = 0
    while i < lenarray(SWidgets) do
        prints("Widget ID: %s\n", SWidgets[i])
        i += 1
    od
endin

</CsInstruments>
<CsScore>
i1 0 1
</CsScore>
</CsoundSynthesizer>
