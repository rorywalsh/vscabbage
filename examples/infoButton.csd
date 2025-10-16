<Cabbage>
form caption("InfoButton Example") size(400, 300)

; InfoButton with URL
infoButton bounds(20, 20, 150, 30) text("Visit Cabbage Site") url("https://cabbageaudio.com")

; InfoButton with local file path (will open in default application)
infoButton bounds(20, 60, 150, 30) text("Open README") file("../readme.md")

; InfoButton with another URL
infoButton bounds(20, 100, 150, 30) text("Csound Docs") url("https://csound.com/docs/manual/index.html")

</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -+rtmidi=NULL -M0 -m0d
</CsOptions>
<CsInstruments>
; Initialize the global variables. 
ksmps = 32
nchnls = 2
0dbfs = 1

instr 1
endin

</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
f0 z
</CsScore>
</CsoundSynthesizer>
