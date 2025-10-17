<Cabbage>
form caption("XyPad Test") size(400, 400), guiMode("queue") pluginId("test")
xyPad bounds(20, 20, 350, 350) channel("cf", "bw"), rangex(100, 10000, 1000, 1, 0.001), rangey(0, 1, 0.5, 1, 0.001), text("Freq", "BW")
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
