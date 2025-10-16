
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Rings.csd
; Written by Iain McCurdy, 2024

; The graphics provide a visualisation of a constantly changing waveform used by a single oscillator that provide the sonification.
; The waveform phase is visualised represented from outer to inner, darker rings representing points of negative amplitude excursion and lighter rings, points of positive amplitude excursion.
; Silence is represented by grey. 

; This also stress-tests the capacity for Cabbage to generate dynamic graphics, using many iterations of 'image' widgets.
; To eke out adequate performance, rate of updates is kept as low as possible that will still produce acceptably smoothly changing graphics. Here, the refresh rate is 24 FPS.
; Pixel resolution is increased above 1 so that fewer pixels will be needed. Here, Cabbage pixels are 2 screen pixels in size.

<Cabbage>
form caption("Rings") size(600,600), guiMode("queue"), pluginId("rngs"), colour("black")
#define SLIDER_DESIGN colour(200,200,200), outlineColour(0,0,0,0), markerColour(20,20,20), popupText(0), trackerColour(230,230,230)
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -dm0 -+rtmidi=NULL
</CsOptions>

<CsInstruments>

ksmps              =                   64
nchnls             =                   2
0dbfs              =                   1
                   seed                0

instr 1
 kFadeIn           cosseg              0, 2, 0, 6, 1
 kFadeIn2          cosseg              0, 2, 1, 6, 0

 ; create rings
 iFormSize         =                   600
 iPixelSize        =                   2
 iNRings           =                   iFormSize/iPixelSize
 iCount            =                   0
 while iCount < iNRings do
 SWidget           sprintf             "bounds(%d, %d, %d, %d), shape(\"ellipse\"), channel(\"pixel%d\")", -(iFormSize/2) + (iCount*iPixelSize), -(iFormSize/2) + (iCount*iPixelSize), (iNRings-iCount)*2*iPixelSize, (iNRings-iCount)*2*iPixelSize, iCount
                   cabbageCreate       "image", SWidget
 iCount            +=                  1
 od
 
 ; create title, credit and mask
                   cabbageCreate       "image", "bounds(0,0,1326,600), channel(\"cover\"), colour(\"black\")"             
                   cabbageCreate       "label", "bounds(0,265,600,30), alpha(0), channel(\"title\"), text(\"R              I              N              G              S\")"             
                   cabbageCreate       "label", "bounds(0,310,600,16), fontColour(150,150,150), alpha(0), channel(\"credit\"), text(\"I   a   i   n       M   c   C   u   r   d   y      2   0   2   4\")"             
 if timeinsts()<8 then
                   cabbageSet          1, "cover", "alpha",  1-kFadeIn
                   cabbageSet          1, "title", "alpha",  kFadeIn2
                   cabbageSet          1, "credit", "alpha",  kFadeIn2
 endif
 
 ; generate continuously varying functions for partial strengths and phases
 kStr1             rspline             0, 0.8,  0.2, 0.4
 kPhs1             jspline             360, 0.04, 0.08
 kStr2             rspline             0, 0.8,  0.2, 0.4
 kPhs2             jspline             360, 0.04, 0.08
 kStr3             rspline             0, 0.8,  0.2, 0.4
 kPhs3             jspline             360, 0.04, 0.08
 kStr4             cauchyi             1, 2,  0.2
 kPhs4             jspline             360, 0.04, 0.08
 kStr5             cauchyi             1, 2,  0.5
 kPhs5             jspline             360, 0.04, 0.08
 kStr7             cauchyi             0.1, 12,  0.25
 kPhs7             jspline             360, 0.04, 0.08
 kStr12            cauchyi             0.1, 15,  0.25
 kPhs12            jspline             360, 0.4, 0.08
 
 ; update waveform
 if metro:k(kr/16)==1 then
                   reinit              UPDATE_WAVE
 endif
 UPDATE_WAVE:
  iWave            ftgen               1, 0, 2048, -9, 1, i(kStr1), i(kPhs1), 2, i(kStr2), i(kPhs2), 3, i(kStr3)^2, i(kPhs3), 4, i(kStr4), i(kPhs4), 5, i(kStr5), i(kPhs5), 7, i(kStr7), i(kPhs7), 12, i(kStr12), i(kPhs12)
 rireturn
 
 ; update graphics
 if metro:k(kr/32)==1 then
  kCount            =                   0
  while kCount < iNRings do
  SChan            sprintfk            "pixel%d", kCount
  kGS              limit               ( (table:k(kCount/iNRings,iWave,1,0,1) * 0.5) + 0.5) * 255, 0,255
                   cabbageSet          1, SChan, "colour", kGS, kGS, kGS
  kCount           +=                  1
  od
 endif
 
 ; sonification
 aSig              poscil              kFadeIn*0.1, 40, iWave
 aL,aR             reverbsc            aSig * 0.5, aSig * 0.5, 0.85, 8000
                   outs                (aSig + aL) * kFadeIn, (aSig + aR) * kFadeIn
endin



</CsInstruments>
<CsScore>
i 1 0 z
</CsScore>
</CsoundSynthesizer>
