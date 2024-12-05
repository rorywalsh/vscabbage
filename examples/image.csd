<Cabbage>[
    {"type":"form","caption":"Label Example","size":{"width":580,"height":500},"pluginId":"def1"},
    {"type":"label","channel":"image1","bounds":{"left":158,"top":37,"width":228,"height":21}, "text":"Don't label me!!", "channelType":"number", "automatable":1}
]</Cabbage>
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
 kLabel cabbageGetValue "image1"
 printk2 kLabel
endin


</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
i1 0 z
</CsScore>
</CsoundSynthesizer>
