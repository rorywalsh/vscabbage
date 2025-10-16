
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Ribbon
; Written by Iain McCurdy, 2024

; The graphics provides a visualisation of a constantly changing waveform used by the four oscillators that provide the sonification.
; The waveform is visualised from left to right across a 3 dimensional ribbon.

; The waveform is made up of 5 partials, the strengths and phases of which wander randomly continuously. 
; It will be heard that as the ribbon develops sharper kinks, the tone gets brighter.
; Higher partials intervene momentarily from time to time and this is seen as many small ripples across the length of the ribbon.

; This also stress-tests the capacity for Cabbage to generate dynamic graphics, using many iterations of 'image' widgets.
; To eke out adequate performance, rate of updates is kept as low as possible that will still produce acceptably smoothly changing graphics. Here, the refresh rate is 24 FPS.

<Cabbage>
form caption("Ribbon") size(1100, 400), guiMode("queue"), pluginId("rbbn"), colour("black")
#define SLIDER_DESIGN colour(200,200,200), outlineColour(0,0,0,0), markerColour(20,20,20), popupText(0), trackerColour(230,230,230)
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -dm0 -+rtmidi=NULL
</CsOptions>

<CsInstruments>

; Initialize the global variables. 
ksmps              =                   64
nchnls             =                   2
0dbfs              =                   1
                   seed                0

instr 1
 kFadeIn           cosseg              0, 0.5, 0, 7.5, 1
 kFadeIn2          cosseg              0, 0.5, 1, 7.5, 0
 
 ; create bars
 iFormWidth        =                   1000
 iPixelSize        =                   1 ; increase this to reduce CPU strain, decrease for better reolution. (Integers and minmum 1.)
 iNBars            =                   (iFormWidth*0.88)/iPixelSize
 iBarWidth         =                   100
 iDepth            =                   50 ; graphical depth of the bending of the ribbon
 iCount            =                   0
 while iCount < iNBars do
 SWidget           sprintf             "bounds(%d, -300, %d, %d), channel(\"pixel%d\"), rotate(0.785,%d,%d), colour(0,0,0)", 100+iCount*iPixelSize, iPixelSize, iBarWidth, iCount, iPixelSize/2, iBarWidth/2
                   cabbageCreate       "image", SWidget
 iCount            +=                  1
 od

 ; create title, credit and mask
                   cabbageCreate       "image", "bounds(0,0,1100,600), channel(\"cover\"), colour(\"black\")"             
                   cabbageCreate       "label", "bounds(0,150,1100,40), alpha(0), channel(\"title\"), text(\"R                I                B                B                O                N\")"             
                   cabbageCreate       "label", "bounds(0,220,1100,22), fontColour(150,150,150), alpha(0), channel(\"credit\"), text(\"I   a   i   n       M   c   C   u   r   d   y      2   0   2   4\")"             
 if timeinsts()<8 then
                   cabbageSet          1, "cover", "alpha",  1-kFadeIn
                   cabbageSet          1, "title", "alpha",  kFadeIn2
                   cabbageSet          1, "credit", "alpha",  kFadeIn2
 endif
 
 
 ; generate continuously varying functions for partial strengths and phases
 kStr1             rspline             0, 2.8,  0.05, 0.1
 kPhs1             jspline             360, 0.04, 0.08
 
 kStr2             rspline             0, 2, 0.2, 0.4
 kPhs2             jspline             360, 0.04, 0.08
 
 kStr3             cauchyi             0.5, 1.4,  1
 kPhs3             jspline             360, 0.04, 0.08

 kStr4             cauchyi             0.5, 1.6,  1
 kPhs4             jspline             360, 0.04, 0.08
 
 kStr5             cauchyi             0.2, 4,  6
 kPhs5             jspline             360, 0.04, 0.08
 
 ; update waveform
 if metro:k(kr/8)==1 then
                   reinit              UPDATE_WAVE
 endif
 UPDATE_WAVE:
  giWave           ftgen               1,0,4097, -9,  1, i(kStr1), i(kPhs1), \
                                                      2, i(kStr2), i(kPhs2), \
                                                      3, i(kStr3), i(kPhs3), \
                                                     11, i(kStr4), i(kPhs4), \
                                                     17, i(kStr5), i(kPhs5) 
 rireturn

 ; update graphics
 if metro:k(kr/32)==1 then
  kCount            =                   0
  while kCount < iNBars do
  SChan            sprintfk            "pixel%d", kCount
  kGS              =                   (( (table:k(kCount/iNBars,giWave,1,0,1) + 1) * 0.2) * 255) + 100
  kR               limit               255 - kGS + 40, 0, 255
  kG               limit               255 - kGS + 30, 0, 255
  kB               limit               255 -kGS - 30, 0, 255
  kX               =                   400 + (kCount * iPixelSize) + ( (table:k(kCount/iNBars,giWave,1,0,1)*iDepth))
                   cabbageSet          1, SChan, "bounds", kX, 0, iPixelSize*5, iBarWidth
                   cabbageSet          1, SChan, "colour", kR, kG, kB
  kCount           +=                  1
  od
 endif

endin


instr 3 ; sonification
 kEnv              cosseg              0, 0.5, 0, 7.5, 1
 ioctfn            ftgen               0, 0, 4096, 20, 6, 1.5
 a1                hsboscil            0.01, 0, jspline:k(2,0.03,0.1), 100, giWave, ioctfn
 a2                hsboscil            0.01, 0, jspline:k(2,0.03,0.1), 100 * 3/2, giWave, ioctfn
 a3                hsboscil            0.01, 0, jspline:k(2,0.03,0.1), 100 * 4/3, giWave, ioctfn
 a4                hsboscil            0.01, 0, jspline:k(2,0.03,0.1), 100 * 8/5, giWave, ioctfn
 aL                sum                 a1*rspline:k(0.1,0.9,0.1,0.4), a2*rspline:k(0.1,0.9,0.1,0.4), a3*rspline:k(0.1,0.9,0.1,0.4), a4*rspline:k(0.1,0.9,0.1,0.4)
 aR                sum                 a1*rspline:k(0.1,0.9,0.1,0.4), a2*rspline:k(0.1,0.9,0.1,0.4), a3*rspline:k(0.1,0.9,0.1,0.4), a4*rspline:k(0.1,0.9,0.1,0.4)
 a1L,a1R           pan2                a1, rspline:k(0.1,0.9,0.1,0.4)
 a2L,a2R           pan2                a2, rspline:k(0.1,0.9,0.1,0.4)
 a3L,a3R           pan2                a3, rspline:k(0.1,0.9,0.1,0.4)
 a4L,a4R           pan2                a4, rspline:k(0.1,0.9,0.1,0.4)
 aMixL             sum                 a1L, a2L, a3L, a4L
 aMixR             sum                 a1R, a2R, a3R, a4R 
 aMixL             butlp               aMixL, cpsoct(4 + 10*kEnv)
 aMixR             butlp               aMixR, cpsoct(4 + 10*kEnv)
 aMixL             *=                  kEnv
 aMixR             *=                  kEnv
 aOutL,aOutR       reverbsc            aMixL*0.5,aMixR*0.5,0.85,14000
                   outs                aMixL + aOutL, aMixR + aOutR

endin

</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
i 1 0 z
i 3 0 z
</CsScore>
</CsoundSynthesizer>
