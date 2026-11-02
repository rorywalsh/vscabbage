<Cabbage>
{
    "pluginId"      : "HKey",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        { "type": "form", "caption": "Simple Instrument", "size": {"width": 600, "height": 300} },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 100, "top": 50, "width": 100, "height": 100},
            "channels": [
                {
                    "id"   : "gain",
                    "event": "valueChanged",
                    "range": {"min": 0, "max": 1, "defaultValue": 0.5, "skew": 1, "increment": 0.001}
                }
            ],
            "label"  : {"text": "Gain"}
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
    ; Check if the "gain" widget has a "range" property
    iHasRange = cabbageHasKey("gain", "range")
    if iHasRange == 1 then
        prints("gain widget has a range property\n")
    endif

    ; Check for a nested property using dot-notation
    iHasMin = cabbageHasKey("gain", "range.min")
    if iHasMin == 1 then
        prints("gain widget has range.min property\n")
    endif

    ; Check for a property that doesn't exist
    iHasFoo = cabbageHasKey("gain", "foo")
    if iHasFoo == 0 then
        prints("gain widget does not have a foo property\n")
    endif
endin

</CsInstruments>
<CsScore>
i1 0 z
</CsScore>
</CsoundSynthesizer>
