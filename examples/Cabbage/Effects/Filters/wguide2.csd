
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; wguide2.csd
; Written by Iain McCurdy, 2013.

; For a more extensive use of this opcode see the example "Harmonics.csd"

<Cabbage>
form caption("wguide2") size(595,100), pluginId("WGu2"), guiMode("queue")
image        pos(0, 0), size(595,100), colour(25,0,25), shape("rounded"), outlineColour("white"), outlineThickness(4) 
button  bounds( 10, 30, 55, 25), text("PLUCK"), channel("pluck"), latched(0)
rslider bounds( 65, 11, 70, 70), text("Freq. 1"),   channel("freq1"),     range(20, 8000, 160, 0.25), colour(150,110,110), trackerColour("white")
rslider bounds(130, 11, 70, 70), text("Freq. 2"),   channel("freq2"),     range(20, 8000, 160, 0.25), colour(150,110,110), trackerColour("white")
rslider bounds(195, 11, 70, 70), text("Cutoff 1"), channel("cutoff1"),   range(20,20000,8000,0.25),  colour(150,110,110), trackerColour("white")
rslider bounds(260, 11, 70, 70), text("Cutoff 1"), channel("cutoff2"),   range(20,20000,8000,0.25),  colour(150,110,110), trackerColour("white")
rslider bounds(325, 11, 70, 70), text("F.back 1"), channel("feedback1"), range(-0.999, 0.999, 0.2),  colour(150,110,110), trackerColour("white")
rslider bounds(390, 11, 70, 70), text("F.back 2"), channel("feedback2"), range(-0.999, 0.999, 0.2),  colour(150,110,110), trackerColour("white")
rslider bounds(455, 11, 70, 70), text("Mix"),      channel("mix"),       range(0, 1.00, 0.7),        colour(150,110,110), trackerColour("white")
rslider bounds(520, 11, 70, 70), text("Level"),    channel("level"),     range(0, 1.00, 0.7),        colour(150,110,110), trackerColour("white")
label   bounds(  5, 86,120, 12), text("Iain McCurdy |2013|"), align("left"), fontColour("silver")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n
</CsOptions>

<CsInstruments>

;sr is set by the host
ksmps              =                   32    ;NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =                   2     ;NUMBER OF CHANNELS (2=STEREO)
0dbfs              =                   1

;Author: Iain McCurdy (2012)

instr    1
 kporttime         linseg              0, 0.001, 0.05
 gkfreq1           cabbageGetValue     "freq1"                          ; READ WIDGETS...
 gkfreq1           portk               gkfreq1,kporttime
 afreq1            interp              gkfreq1
 gkfreq2           cabbageGetValue     "freq2"
 gkfreq2           portk               gkfreq2,kporttime
 afreq2            interp              gkfreq2
 gkcutoff1         cabbageGetValue     "cutoff1"
 gkcutoff2         cabbageGetValue     "cutoff2"
 gkfeedback1       cabbageGetValue     "feedback1"
 gkfeedback2       cabbageGetValue     "feedback2"
 gkmix             cabbageGetValue     "mix"
 gklevel           cabbageGetValue     "level"
 ;asigL, asigR     diskin2             "Seashore.wav",1,0,1            ; USE SOUND FILE FOR TESTING
 asigL, asigR      ins

 kFBtot            =                   gkfeedback1 + gkfeedback2        ; protect against combined feedbacks greater than 0.5
 if kFBtot>0.5 then
  gkfeedback1      =                   gkfeedback1 / (kFBtot*2)
  gkfeedback2      =                   gkfeedback2 / (kFBtot*2)
 else
  gkfeedback1      =                   gkfeedback1
  gkfeedback2      =                   gkfeedback2
 endif
 
 aplk              init                0
 kpluck            =                   trigger:k(cabbageGetValue:k("pluck"),0.5,0)                    ; pluck button
 aplk              interp              kpluck           
 if changed(kpluck)==1 then
  aplk             =                   1
  asigL            +=                  aplk
  asigR            +=                  aplk
 endif
 
 aresL             wguide2             asigL, afreq1, afreq2, gkcutoff1, gkcutoff2, gkfeedback1, gkfeedback2
 aresR             wguide2             asigR, afreq1, afreq2, gkcutoff1, gkcutoff2, gkfeedback1, gkfeedback2
 aresL             dcblock2            aresL    ; BLOCK DC OFFSET
 aresR             dcblock2            aresR    ; BLOCK DC OFFSET           
 amixL             ntrpol              asigL,aresL,gkmix
 amixR             ntrpol              asigR,aresR,gkmix
                   outs                amixL*gklevel, amixR*gklevel        ; åWGUIDE1 OUTPUTS ARE SENT OUT
endin
        
</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>