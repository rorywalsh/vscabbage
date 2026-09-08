<Cabbage>
{
    "pluginId"      : "test",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        { "type": "form", "caption": "XyPad Test", "size": {"width": 400, "height": 400}, "guiMode": "queue" },
        {
            "type"   : "xyPad",
            "bounds" : {"left": 20, "top": 20, "width": 350, "height": 350},
            "channels": [
                {"id": "cf", "event": "mouseDragX", "range": {"min": 100, "max": 10000, "defaultValue": 1000, "skew": 1, "increment": 0.001}},
                {"id": "bw", "event": "mouseDragY", "range": {"min": 0, "max": 1, "defaultValue": 0.5, "skew": 1, "increment": 0.001}}
            ],
            "label"  : {"textX": "Freq", "textY": "BW"}
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

</CsoundSynthesizer>
<CsScore>
i1 0 [60*60*24*7]
</CsScore>
</CsoundSynthesizer>
