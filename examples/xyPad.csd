<Cabbage>
{
    "widgets": [
        { "type": "form", "caption": "XyPad Test", "size": {"width": 400, "height": 400}, "guiMode": "queue", "pluginId": "test" },
        {
            "type"   : "xyPad",
            "bounds" : {"left": 20, "top": 20, "width": 350, "height": 350},
            "channel": {"id": "xyPad1", "x": "cf", "y": "bw"},
            "range"  : {
                "x": {"min": 100, "max": 10000, "defaultValue": 1000  , "skew": 1, "increment": 0.001},
                "y": {"min":   0, "max":     1, "defaultValue":    0.5, "skew": 1, "increment": 0.001}
            },
            "text"   : {"x": "Freq", "y": "BW"}
        }
    ]
}

</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -+rtmidi=NULL -M0 --midi-key=4 --midi-velocity-amp=5
</CsOptions>
<CsInstruments>
; Initialize the global variables.
ksmps = 32
nchnls = 2
0dbfs = 1

instr 1
    kFreq chnget "cf"
    kBW chnget "bw"

    printks "Freq: %f, BW: %f\n", 0.5, kFreq, kBW

    aOut oscili 0.2, kFreq
    outs aOut, aOut
endin

</CsInstruments>
<CsScore>
i1 0 [60*60*24*7]
</CsScore>
</CsoundSynthesizer>