<Cabbage>
{
    "pluginId"      : "def1",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        { "type": "form", "caption": "GetSet Opcodes", "size": {"height": 500, "width": 580} },
        {
            "type"    : "rotarySlider",
            "id"      : "gain",
            "bounds"  : {"left": 150, "top": 10, "width": 100, "height": 100},
            "channels": [
                {
                    "id"   : "gain",
                    "event": "valueChanged",
                    "range": {"min": 0, "max": 2, "defaultValue": 1, "skew": 1, "increment": 0.1}
                }
            ],
            "label"   : {"text": "Gain"}
        },
        {
            "type"    : "button",
            "id"      : "button1",
            "bounds"  : {"left": 0, "top": 10, "width": 100, "height": 30},
            "channels": [ {"id": "button1", "event": "valueChanged"} ],
            "label"   : {"text": {"on": "I am on", "off": "I am off"}},
            "style"   : {
                "on" : {"backgroundColor": "#ff0000", "textColor": "#ffffff"},
                "off": {"backgroundColor": "#0000ff", "textColor": "#ffffff"}
            }
        },
        {
            "type"    : "comboBox",
            "id"      : "combo1",
            "bounds"  : {"left": 200, "top": 200, "width": 100, "height": 30},
            "channels": [ {"id": "combo1", "event": "valueChanged", "range": {}} ],
            "items"   : ["One", "Two", "Three"]
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
ksmps = 64
nchnls = 2
0dbfs = 1

/*
Test various string variants of cabbageSet opcodes.
These opcodes provide an interface to widget properties.
*/
instr TestStringSetOpcodes
    kSwitch:k = metro(10)
    if p4 == 0 then
        cabbageSet("button1", "label.text.off", "p4 is 0")
    elseif p4 == 1 then
        cabbageSet("button1", "label.text.on", "p4 is 1")
    elseif p4 == 2 then
        SJson:S = sprintf({{ "label": {"text": {"off": "%s"}} }}, "p4 is 2")
        cabbageSet("button1", SJson)
    elseif p4 == 3 then
        cabbageSet(kSwitch, "button1", "label.text.off", "p4 is 3")
    elseif p4 == 4 then
        cabbageSet("button1", "style.off.backgroundColor", "#00ff00")
    endif
endin

/*
Test various MYFLT variants of cabbageSet opcodes.
These opcodes provide an interface to widget properties.
*/
instr TestMYFLTSetOpcodes
    kSwitch:k = metro(10)
    kToggle:k = (oscili:k(1, 2) > 0 ? 1 : 0)
    if p4 == 0 then
        cabbageSet(kSwitch, "gain", "bounds.left", abs(randi:k(400, 10)))
    elseif p4 == 1 then
        cabbageSet(kSwitch, "gain", "visible", kToggle)
    elseif p4 == 2 then
        cabbageSet("gain", "bounds.left", 10)
    elseif p4 == 3 then
        cabbageSet("gain", sprintf({{ "visible": %d }}, 0))
    elseif p4 == 4 then
        cabbageSet("gain", sprintf({{ "visible": %d }}, 1))
    endif
endin

instr TestMYFLTGetOpcodes
    kTrig:k = metro(2)
    if p4 == 0 then
        SText:S = cabbageGet("button1", "label.text.off")
        prints(SText)
        prints("\n")
    elseif p4 == 1 then
        iWidth:i = cabbageGet("gain", "bounds.width")
        print(iWidth)
    elseif p4 == 2 then
        kWidth:k = cabbageGet("gain", "bounds.width")
        printf("bounds.width: %d\n", kTrig, kWidth)
    elseif p4 == 3 then
        kVisible:k = cabbageGet("gain", "visible")
        printf("visible: %d\n", kTrig, kVisible)
    elseif p4 == 4 then
        cabbageSet("gain", "style.track.fillColor", "#ff0000")
    elseif p4 == 5 then
        cabbageSet("combo1", "items", "1One", "2Two", "3Three", "4Four")
    endif
endin

instr TestGetValueOpcodes
    if p4 == 0 then
        prints("Testing cabbageGetValue k-rate, no trigger\n")
        kVal:k = cabbageGetValue("gain")
        printk2(kVal)
    elseif p4 == 1 then
        prints("Testing cabbageGetValue k-rate, with trigger\n")
        gainRes:CabbageNumTrig = cabbageGetValue("gain")
        printf("gain: %f\n", gainRes.trig, gainRes.val)
    endif
endin

instr TestSetValueOpcodes
    if p4 == 0 then
        prints("Testing cabbageSetValue i-rate\n")
        cabbageSetValue:i("gain", 2)
    elseif p4 == 1 then
        prints("Testing cabbageSetValue k-rate\n")
        kRand:k = abs(randi:k(1, 10))
        cabbageSetValue:k("gain", kRand)
    endif
endin


</CsInstruments>
<CsScore>
i"TestStringSetOpcodes" 0 1 0
i"TestStringSetOpcodes" + 1 1
i"TestStringSetOpcodes" + 1 2
i"TestStringSetOpcodes" + 1 3
i"TestStringSetOpcodes" + 1 4


; i"TestMYFLTSetOpcodes" + 2 0
; i"TestMYFLTSetOpcodes" + 2 1
; i"TestMYFLTSetOpcodes" + 1 2
; i"TestMYFLTSetOpcodes" + 1 3
; i"TestMYFLTSetOpcodes" + 1 4

; i"TestMYFLTGetOpcodes" + 1 0
; i"TestMYFLTGetOpcodes" + 1 1
; i"TestMYFLTGetOpcodes" + 1 2
; i"TestMYFLTGetOpcodes" + 1 3
; i"TestMYFLTGetOpcodes" + 1 4
; i"TestMYFLTGetOpcodes" + 1 5
; i"TestSetValueOpcodes" + 2 0
; i"TestSetValueOpcodes" + 4 1
; i"TestGetValueOpcodes" + 4 0
; i"TestGetValueOpcodes" + 4 1
f0 z
</CsScore>
</CsoundSynthesizer>
