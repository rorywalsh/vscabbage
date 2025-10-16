
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Rings.csd
; Written by Iain McCurdy, 2024

; The graphics provides a visualisation of a constantly changing waveforn used by the four oscillators that provide the sonification.
; The waveform phase is visualised represented from top to bottom, darker bands representing points of negative amplitude excursion and lighter bands, points of positive amplitude excursion.
; Silence is represented by grey. 

; This also stress-tests the capacity for Cabbage to generate dynamic graphics, using many iterations of 'image' widgets.
; To eke out adequate performance, rate of updates is kept as low as possible that will still produce acceptably smoothly changing graphics. Here, the refresh rate is 24 FPS.
; Pixel resolution is increased above 1 so that fewer pixels will be needed. Here, Cabbage pixels are 2 screen pixels in size.

<Cabbage>
form caption("Ripples") size(1326, 600), guiMode("queue"), pluginId("rppl"), colour("black")
#define SLIDER_DESIGN colour(200,200,200), outlineColour(0,0,0,0), markerColour(20,20,20), popupText(0), trackerColour(230,230,230)
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -dm0 -+rtmidi=NULL -M0 --midi-key-cps=4 --midi-velocity-amp=5
</CsOptions>

<CsInstruments>

; Initialize the global variables. 
ksmps              =                   64
nchnls             =                   2
0dbfs              =                   1
                   seed                0

instr 1
 kFadeIn           cosseg              0, 2, 0, 6, 1
 kFadeIn2          cosseg              0, 1, 1, 7, 0

 ; create bars
 iFormHeight       =                   600
 iPixelSize        =                   2 ; increase this to reduce CPU strain, decrease for better reolution. (Integers and minmum 1.)
 iNBars            =                   iFormHeight/iPixelSize
 iCount            =                   0
 while iCount < iNBars do
 SWidget           sprintf             "bounds(0, %d, 1326, %d), automatable(0), channel(\"pixel%d\")", iCount*iPixelSize, iPixelSize, iCount
                   cabbageCreate       "image", SWidget
 iCount            +=                  1
 od

 ; create title, credit and mask
                   cabbageCreate       "image", "bounds(0,0,1326,600), channel(\"cover\"), colour(\"black\")"             
                   cabbageCreate       "label", "bounds(0,250,1326,40), alpha(0), channel(\"title\"), text(\"R                 I                 P                 P                 L                 E                 S\")"             
                   cabbageCreate       "label", "bounds(0,320,1326,22), fontColour(150,150,150), alpha(0), channel(\"credit\"), text(\"I   a   i   n       M   c   C   u   r   d   y      2   0   2   4\")"             
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

 kStr4             cauchyi             0.5, 2,  1
 kPhs4             jspline             360, 0.04, 0.08
 
 kStr5             cauchyi             0.3, 4,  2
 kPhs5             jspline             360, 0.04, 0.08
 
 ; update waveform
 if metro:k(kr/8)==1 then
                   reinit              UPDATE_WAVE
 endif
 UPDATE_WAVE:
  iWave            ftgen               1,0,4097, -9, 1, i(kStr1), i(kPhs1), 2, i(kStr2), i(kPhs2), 5, i(kStr3)^2, i(kPhs3), 11, i(kStr4), i(kPhs4), 17, i(kStr5), i(kPhs5) 
 rireturn

 ; update graphics
 if metro:k(kr/32)==1 then
  kCount            =                   0
  while kCount < iNBars do
  SChan            sprintfk            "pixel%d", kCount
  kGS              limit               ( (table:k(kCount/iNBars,iWave,1,0,1) * 0.5) + 0.5) * 255, 0, 255
                   cabbageSet          1, SChan, "colour", kGS,kGS,kGS
  kCount           +=                  1
  od
 endif

 ; sonification
 ioctfn            ftgen               0, 0, 4096, 20, 6, 1.5
 a1                hsboscil            0.05, 0, jspline:k(2,0.03,0.1), 100, iWave, ioctfn
 a2                hsboscil            0.05, 0, jspline:k(2,0.03,0.1), 150, iWave, ioctfn
 a3                hsboscil            0.05, 0, jspline:k(2,0.03,0.1), 400/3, iWave, ioctfn
 a4                hsboscil            0.05, 0, jspline:k(2,0.03,0.1), 800/5, iWave, ioctfn
 aSig              =                   a1 + a2 + a3 + a4
 aL,aR             reverbsc            aSig*0.5,aSig*0.5,0.85,8000
                   outs                (aSig+aL)*kFadeIn,(aSig+aR)*kFadeIn
endin

</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
i 1 0 z
</CsScore>
</CsoundSynthesizer>
