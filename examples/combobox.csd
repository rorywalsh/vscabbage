<Cabbage>[
{"type": "form", "caption": "Combobox Example", "size": {"width": 580.0, "height": 500.0}, "pluginId": "def1"},
{"type": "rotarySlider", "bounds": {"left": 12.0, "top": 9.0, "width": 86.0, "height": 90.0}, "channel": "att", "range": {"min": 0.0, "max": 1.0, "defaultValue": 0.01, "skew": 1.0, "increment": 0.001}, "text": "Att."},
{"type": "rotarySlider", "bounds": {"left": 99.0, "top": 9.0, "width": 86.0, "height": 90.0}, "channel": "dec", "range": {"min": 0.0, "max": 1.0, "defaultValue": 0.4, "skew": 1.0, "increment": 0.001}, "text": "Dec."},
{"type": "rotarySlider", "bounds": {"left": 187.0, "top": 9.0, "width": 86.0, "height": 90.0}, "channel": "sus", "range": {"min": 0.0, "max": 1.0, "defaultValue": 0.7, "skew": 1.0, "increment": 0.001}, "text": "Sus."},
{"type": "rotarySlider", "bounds": {"left": 274.0, "top": 9.0, "width": 86.0, "height": 90.0}, "channel": "rel", "range": {"min": 0.0, "max": 1.0, "defaultValue": 0.8, "skew": 1.0, "increment": 0.001}, "text": "Rel."},
{"type": "keyboard", "bounds": {"left": 12.0, "top": 104.0, "width": 348.0, "height": 80.0}, "channel": "keyboard"},
{"type": "comboBox", "bounds": {"left": 260.0, "top": 188.0, "width": 100.0, "height": 30.0}, "channel": "waveform", "corners": 5.0, "items": ["Saw", "Square", "Triangle"]}
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
    
    iVcoModes[] fillarray 0, 10, 12

    iAtt cabbageGetValue "att"
    iDec cabbageGetValue "dec"
    iSus cabbageGetValue "sus"
    iRel cabbageGetValue "rel"
    kEnv madsr iAtt, iDec, iSus, iRel
    aVco vco2 kEnv*p5*.5, cpsmidinn(p4), iVcoModes[cabbageGetValue:i("waveform")]
    outs aVco, aVco    
endin


</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
f0 z
</CsScore>
</CsoundSynthesizer>
