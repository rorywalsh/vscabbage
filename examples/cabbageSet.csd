<Cabbage>[
     {"type":"form","caption":"GetSet Opcodes","size":{"height":500,"width":580},"pluginId":"def1"},
    {"type":"rotarySlider", "channel":"gain", "bounds":{"left":150, "top":10, "width":100, "height":100}, "range":{"min":0, "max":2, "defaultValue":1, "skew":1, "increment":0.1}, "text":"Gain"},
    {"type":"button", "channel":"button1", "bounds":{"left":0, "top":10, "width":100, "height":30}, "colour":{"on":{"fill":[255, 0, 0]}, "off":{"fill":"#0000ff"}},"text":{"on":"I am on", "off":"I am off"}},
    {"type": "textEditor", "bounds": {"left": 17.0, "top": 169.0, "width": 341.0, "height": 40.0}, "channel": "infoText", "readOnly": 1.0, "wrap": 1.0, "scrollbars": 1.0, "text":"This instrument shows an example..."},
    {"type":"comboBox", "channel":"combo1", "bounds":{"left":200, "top":200, "width":100, "height":30}, "items":["One", "Two", "Three"]}
]</Cabbage>
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
    k1 metro 1
    if p4 == 0 then
        cabbageSet "button1", "text.off", "p4 is 0"
    elseif p4 == 1 then
        cabbageSet "button1", "text.off", "p4 is 1"
    elseif p4 == 2 then
        cabbageSet "infoText", "text", "p4 is 2"
    elseif p4 == 3 then
        cabbageSet "infoText", sprintf({{"text":"%s"}}, "p4 is 3")
    elseif p4 == 4 then        
        cabbageSet k1, "infoText", "text", "p4 is 4"
    elseif p4 == 5 then
        cabbageSet k1, "infoText", sprintf({{"text":"%s"}}, "p4 is 5")
    elseif p4 == 6 then
        cabbageSet "button1", "colour.off.fill", "#00ff00"
    endif
endin

/*
Test various MYFLT variants of cabbageSet opcodes.
These opcodes provide an interface to widget properties. 
*/
instr TestMYFLTSetOpcodes
    k1 metro 10
    kToggle = (oscili:k(1, 2) > 0 ? 1 : 0)
    if p4 == 0 then
        cabbageSet k1, "gain", "bounds.left", abs(randi:k(400, 10))
    elseif p4 == 1 then
        cabbageSet k1, "gain", "visible", kToggle
    elseif p4 == 2 then
        cabbageSet "gain", "bounds.left", 10
    elseif p4 == 3 then
        cabbageSet "gain", sprintf({{"visible":%d}}, 0)
    elseif p4 == 4 then
        cabbageSet "gain", sprintf({{"visible":%d}}, 1)
    endif
endin


</CsInstruments>  
<CsScore>
i"TestStringSetOpcodes" 0 1 0
i"TestStringSetOpcodes" + 1 1
i"TestStringSetOpcodes" + 1 2
i"TestStringSetOpcodes" + 1 3
i"TestStringSetOpcodes" + 1 4
i"TestStringSetOpcodes" + 1 5
i"TestStringSetOpcodes" + 1 6
f0 z
</CsScore>
</CsoundSynthesizer>