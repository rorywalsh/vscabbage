
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Disc.csd
; Written by Iain McCurdy, 2024

; The graphics provide a visualisation of a constantly changing waveform used by a single oscillator that provide the sonification.
; The waveform phase is visualised represented from outer edge of the disc to the centre.

; This also stress-tests the capacity for Cabbage to generate dynamic graphics, using many iterations of 'image' widgets.
; To eke out adequate performance, rate of updates is kept as low as possible that will still produce acceptably smoothly changing graphics. Here, the refresh rate is 24 FPS.
; Pixel resolution is increased above 1 so that fewer pixels will be needed. Here, Cabbage pixels are 2 screen pixels in size.

<Cabbage>
form caption("Disc") size(700,420), guiMode("queue"), pluginId("disc"), colour("black")
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
 kFadeIn           cosseg              0, 0.1, 0, 6, 1

 ; create rings
 iDiscSize         =                   600
 iPixelSize        =                   1    ; pixel size defines the number of graphical elements that will need to be created so increasing this can reduce CPU drain at the expense of resolution.
 iNRings           =                   iDiscSize/iPixelSize
 iTilt             =                   0.5  ; tilt angle of the disc. 0=horizontal, 1=vertical, 0.5=45 degrees
 iDepth            =                   20   ; graphical depth of the wave excursions. Max pixels excursion but as the waveform is not normalised, the actual excursion could be bigger than this.
 iCount            =                   0
 while iCount < iNRings do
 SWidget           sprintf             "bounds(%d, %d, %d, %d), shape(\"ellipse\"), channel(\"pixel%d\"), colour(0,0,0)", \
                                         iCount*iPixelSize*0.5+100, iCount*iPixelSize*0.25+90, (iNRings-iCount)*iPixelSize, (iNRings-iCount)*iPixelSize*0.5, \
                                         iCount
                   cabbageCreate       "image", SWidget
 iCount            +=                  1
 od
 
 ; create title, credit and mask
                   cabbageCreate       "image", "bounds(0,0,700,600), channel(\"cover\"), colour(\"black\")"             
                   cabbageCreate       "label", "bounds(0,175,700,30), alpha(0), channel(\"title\"), text(\"D              I              S              C\")"             
                   cabbageCreate       "label", "bounds(0,220,700,16), fontColour(150,150,150), alpha(0), channel(\"credit\"), text(\"I   a   i   n       M   c   C   u   r   d   y      2   0   2   4\")"             
 if timeinsts()<8 then
                   cabbageSet          1, "cover", "alpha",  1-kFadeIn
                   cabbageSet          1, "title", "alpha",  1-kFadeIn
                   cabbageSet          1, "credit", "alpha",  1-kFadeIn
 endif
 
 
 ; generate continuously varying functions for table parameters
  iftlen           =                   4096
  iN               =                    7
  kstr1            rspline             -0.9,0.9,0.1,1
  kstr2            rspline             -0.9,0.9,0.1,1
  kstr3            rspline             -0.9,0.9,0.1,1
  kstr4            rspline             -0.9,0.9,0.1,1
  kstr5            rspline             -0.9,0.9,0.1,1
  kstr6            rspline             -0.9,0.9,0.1,1
  kdur1            rspline             0.1,0.9,0.1,1
  kdur2            rspline             0.1,0.9,0.1,1
  kdur3            rspline             0.1,0.9,0.1,1
  kdur4            rspline             0.1,0.9,0.1,1
  kdur5            rspline             0.1,0.9,0.1,1
  kdur6            rspline             0.1,0.9,0.1,1
  kdur7            rspline             0.1,0.9,0.1,1
  kdursum          =                   kdur1 + kdur2 + kdur3 + kdur4 + kdur5 + kdur6 + kdur7
  kdur1            /=                  kdursum
  kdur2            /=                  kdursum
  kdur3            /=                  kdursum
  kdur4            /=                  kdursum
  kdur5            /=                  kdursum
  kdur6            /=                  kdursum
  kdur7            /=                  kdursum
  kdur1            init                1/7
  kdur2            init                1/7
  kdur3            init                1/7
  kdur4            init                1/7
  kdur5            init                1/7
  kdur6            init                1/7
  kdur7            init                1/7
  
 ; update waveform
 if metro:k(kr/2)==1 then
                   reinit              UPDATE_WAVE
 endif
 UPDATE_WAVE:
  iWave   ftgen               1,0,  iftlen, 8, 0, iftlen*i(kdur1),i(kstr1), iftlen*i(kdur2),i(kstr2), iftlen*i(kdur3),i(kstr3), iftlen*i(kdur4),i(kstr4), iftlen*i(kdur5),i(kstr5), iftlen*i(kdur6),i(kstr6),  iftlen*i(kdur7), 0  
 rireturn
 ; update graphics
 if metro:k(kr/32)==1 then
  kCount            =                  0
  while kCount < iNRings do
  SChan            sprintfk            "pixel%d", kCount
  kGS              limit               ( (table:k(kCount/iNRings,iWave,1,0,1) + 1) * 0.5) * 255, 0,255
  kR               limit               kGS + 0, 0, 255
  kG               limit               kGS + 10, 0, 255
  kB               limit               kGS - 20   , 0, 255
  kY               =                   kCount*iPixelSize*0.5*iTilt - (table:k(kCount/iNRings,iWave,1,0,1)*iDepth)
;  Smsg             sprintfk            "bounds(%d,%d,%d,%d), colour(%d,%d,%d)", 50+(kCount*iPixelSize*0.5), 60+kY, (iNRings-kCount)*iPixelSize, (iNRings-kCount)*iPixelSize*0.5, kR, kG, kB
;                   cabbageSet          1, SChan, Smsg
                   cabbageSet          1, SChan, "colour", kR, kG, kB
                   cabbageSet          1, SChan, "bounds", 50+(kCount*iPixelSize*0.5), 60+kY, (iNRings-kCount)*iPixelSize, (iNRings-kCount)*iPixelSize*iTilt
  kCount           +=                  1
  od
 endif
 
 ; sonification
 ioctfn            ftgen               0, 0, 4096, 20, 6, 1.5
 kBr               jspline             2,0.05,0.1
 a1                hsboscil            0.03*kFadeIn*ampdbfs(-kBr*6), 0, kBr, 160, iWave, ioctfn, 3
 kBr               jspline             2,0.05,0.1
 a2                hsboscil            0.03*kFadeIn*ampdbfs(-kBr*6), 0, kBr, 160*15/8, iWave, ioctfn, 3
 kBr               jspline             2,0.05,0.1
 a3                hsboscil            0.015*kFadeIn*ampdbfs(-kBr*6), 0, kBr, 160*2*5/4, iWave, ioctfn, 3
 aSig              sum                 a1,a2,a3
 aSig              dcblock2            aSig
 
 ;aSig              oscili              0.1,160/4,iWave                                      ; audio oscillator read GEN08 wave created
 ;aSig              *=                  oscili:a(1,(160/4)+oscili:a(160/100,160/4,iWave),iWave)    ; ring modulate it with itself    
 
 aL,aR             reverbsc            aSig * 0.5, aSig * 0.5, 0.85, 8000
                   outs                (aSig + aL) * kFadeIn, (aSig + aR) * kFadeIn
endin



</CsInstruments>
<CsScore>
i 1 0 z
</CsScore>
</CsoundSynthesizer>
