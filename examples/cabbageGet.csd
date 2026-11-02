<Cabbage>
{
    "pluginId"      : "RMSy",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        { "type": "form", "caption": "Simple Instrument", "size": {"width": 1000, "height": 520} },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 150, "top": 10, "width": 100, "height": 100},
            "channels": [
                {
                    "id"   : "gain",
                    "event": "valueChanged",
                    "range": {"min": 0, "max": 2, "defaultValue": 1, "skew": 1, "increment": 0.1}
                }
            ],
            "label"  : {"text": "Gain"}
        },
        {
            "type"    : "label",
            "channels": [ {"id": "status", "event": "valueChanged"} ],
            "bounds"  : {"left": 150, "top": 130, "width": 300, "height": 30},
            "label"   : {"text": "idle"}
        }
    ]
}
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-dm0 -n -+rtmidi=NULL -M0 --midi-key=4 --midi-velocity=5
</CsOptions>
<CsInstruments>
; sr set by host
ksmps = 16
nchnls = 2
0dbfs = 1

instr 1
    ; read a widget property as a string
    SStatus cabbageGet "status", "text"
    printf "status label now reads %s\n", 1, SStatus

    ; the same query using a trigger struct: fires when the text changes
    res:CabbageStrTrig cabbageGet "gain", "text"
    if res.trig == 1 then
        printf "gain label changed to %s\n", 1, res.val
    endif
endin

instr 2
    ; change the status label after 1 second
    cabbageSet("status", "label.text", "running")
endin

</CsInstruments>
<CsScore>
i1 0 z
i2 1 1
</CsScore>
</CsoundSynthesizer>
