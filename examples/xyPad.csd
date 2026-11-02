<Cabbage>
{
    "pluginId"      : "def1",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        { "type": "form", "caption": "XY Pad Example", "size": {"width": 400, "height": 400}, "guiMode": "queue" },
        {
            "type"    : "xyPad",
            "bounds"  : {"left": 20, "top": 20, "width": 350, "height": 350},
            "channels": [
                {"id": "bandwidth", "event": "mouseDragX", "range": {"min": 10, "max": 2000, "defaultValue": 200, "skew": 1, "increment": 0.001}},
                {"id": "cutoff", "event": "mouseDragY", "range": {"min": 100, "max": 8000, "defaultValue": 1000, "skew": 1, "increment": 0.001}}
            ],
            "label"   : {"textX": "Bandwidth", "textY": "Cutoff"}
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
    kBW:k = cabbageGetValue("bandwidth")
    kCutoff:k = cabbageGetValue("cutoff")

    printks("Bandwidth: %f, Cutoff: %f\n", 0.5, kBW, kCutoff)

    aSrc:a = vco2(0.5, 110, 12)
    aOut:a butterbp aSrc, kCutoff, kBW
    outs(aOut, aOut)
endin

</CsInstruments>
<CsScore>
i1 0 [60*60*24*7]
</CsScore>
</CsoundSynthesizer>