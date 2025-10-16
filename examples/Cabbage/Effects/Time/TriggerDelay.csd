
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; TriggerDelay.csd
; Written by Iain McCurdy, 2012.

; This example works best with sharp percussive sounds

; A trigger impulse is generated each time the rms of the input signal crosses the defined 'Threshold' value.
; Each time a new trigger is generated a new random delay time (between user definable limits)
; - and a new random feedback value (again between user definable limits) are generated.

; It is possible to generate feedback values of 1 and greater (which can lead to a continuous build-up of sound)
;  this is included intentionally and the increasing sound will be clipped and can be filtered by reducing the 'Damping' control to produce increasing distortion of the sound within the delay buffer as it repeats 

; Increasing the 'Portamento' control damps the otherwise abrupt changes in delay time.

; 'Width' allows the user to vary the delay from a simple monophonic delay to a ping-pong style delay

<Cabbage>
form caption("Trigger Delay") size(640,317), pluginId("TDel"), guiMode("queue")
image                  bounds(0, 0,640,317), colour(150,150,205), shape("rounded"), outlineColour("white"), outlineThickness(4) 

#define SLIDER_DESIGN colour( 40, 40, 95), trackerColour("white"), textColour("black"), valueTextBox(1), fontColour("black")

rslider  bounds(  5, 11, 70, 90),  text("Threshold"),  channel("threshold"), range(0, 1.00, 0.1, 0.5), $SLIDER_DESIGN

label    bounds(230,115,80,15), text("TRIGGER"), fontColour("black"), colour(150,150,205)
checkbox bounds(250,135,40,40), channel("TriggerIndicator"), shape("ellipse"), active(0), colour(255,50,50)
nslider  bounds(230,200,80,30), channel("DelayTime"), range(0,1,0,1,0.0001), text("Delay Time (s)"), textColour("Black"), fontColour("White")
nslider  bounds(230,235,80,30), channel("Feedback"), range(0,1,0,1,0.001), text("Feedback"), textColour("Black"), fontColour("White")
                                                                                
line     bounds( 93, 10, 95, 3), colour("Grey")
label    bounds(110,  6, 60, 10), text("DELAY TIME"), fontColour("black"), colour(150,150,205)
rslider  bounds( 82, 18, 63, 83),  text("Min."), channel("dly1"), range(0.0001, 2, 0.001,0.5), $SLIDER_DESIGN
rslider  bounds(140, 18, 63, 83), text("Max."), channel("dly2"), range(0.0001, 2, 0.1, 0.5), $SLIDER_DESIGN

line     bounds(222, 10,  95,  3), colour("Grey")
label    bounds(242,  6,  55, 10), text("FEEDBACK"), fontColour("black"), colour(150,150,205)
rslider  bounds(210, 18, 63, 83), text("Min."), channel("fback1"), range(0, 1.200, 0.5), $SLIDER_DESIGN
rslider  bounds(268, 18, 63, 83), text("Max."), channel("fback2"), range(0, 1.200, 0.9), $SLIDER_DESIGN

rslider bounds(  5,111, 70, 90), text("Portamento"), channel("porttime"), range(0,  5.00, 0,0.5), $SLIDER_DESIGN
rslider bounds( 75,111, 70, 90), text("Cutoff"), channel("cf"), range(50,10000, 5000,0.5,1), $SLIDER_DESIGN
rslider bounds(145,111, 70, 90), text("Bandwidth"), channel("bw"), range(600,22050, 4000,0.5,1), $SLIDER_DESIGN

rslider bounds(  5,211, 70, 90), text("Width"), channel("width"), range(0,  1.00, 1), $SLIDER_DESIGN
rslider bounds( 75,211, 70, 90), text("Mix"), channel("mix"), range(0, 1.00, 0.5), $SLIDER_DESIGN
rslider bounds(145,211, 70, 90), text("Level"), channel("level"), range(0, 1.00, 1), $SLIDER_DESIGN

xypad bounds(335, 5, 300,308), channel("cfpad", "bwpad"), rangeX(50, 10000, 5000), rangeY(600, 22050, 4000), text("CF/BW")
}

label   bounds(  7,302, 120, 12), text("Iain McCurdy |2012|"), fontColour(20,20,20), align("left")
</Cabbage>

<CsoundSynthesizer>                       

<CsOptions>
-dm0 -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =                   2     ; NUMBER OF CHANNELS (2=STEREO)
0dbfs              =                   1

;Author: Iain McCurdy (2012)

instr    1
 kthreshold        cabbageGetValue     "threshold"             ; read in widgets
 kdly1             cabbageGetValue     "dly1"                  ; read in widgets
 kdly2             cabbageGetValue     "dly2"                  ; read in widgets
 kfback1           cabbageGetValue     "fback1"                ; read in widgets
 kfback2           cabbageGetValue     "fback2"                ; read in widgets
 kwidth            cabbageGetValue     "width"
 kmix              cabbageGetValue     "mix"
 klevel            cabbageGetValue     "level"
 kporttime         cabbageGetValue     "porttime" 
 kcf               cabbageGetValue     "cf"
 kbw               cabbageGetValue     "bw"
 kcfpad            cabbageGetValue     "cfpad"
 kbwpad            cabbageGetValue     "bwpad"
                   cabbageSetValue     "bw", kbwpad, changed:k(kbwpad)
                   cabbageSetValue     "cf", kcfpad, changed:k(kcfpad)

 ainL,ainR         ins                                         ; read stereo input
 krms              rms                 (ainL + ainR) * 0.5
 
 ktrig             trigger             krms, kthreshold, 0
 
 kdly              trandom             ktrig, 0, 1
 kdly              expcurve            kdly,8
 kMinDly           min                 kdly1,kdly2
 kdly              =                   (kdly * abs(kdly2 - kdly1) ) + kMinDly    
                   cabbageSetValue     "DelayTime", kdly, changed(kdly)    
    
 kramp             linseg              0, 0.001,1
    
 kcf               portk               kcf, kramp * 0.05
 kbw               portk               kbw, kramp * 0.05
    
 kdly              portk               kdly, kporttime*kramp
 atime             interp              kdly

 kfback            trandom             ktrig, kfback1, kfback2
                   schedkwhen          ktrig, 0, 0, 2, 0, 0.2
                   cabbageSetValue     "Feedback", kfback, changed(kfback)

 ; offset delay (no feedback)
 abuf              delayr              5
 afirst            deltap3             atime
 afirst            butbp               afirst, kcf, kbw
                   delayw              ainL

 ; left channel delay (note that 'atime' is doubled) 
 abuf              delayr              10            ;
 atapL             deltap3             atime*2
 atapL             clip                atapL,0,0.9
 atapL             butbp               atapL, kcf, kbw
                   delayw              afirst + (atapL * kfback)

; right channel delay (note that 'atime' is doubled) 
abuf               delayr              10
atapR              deltap3             atime * 2
atapR              clip                atapR, 0, 0.9
atapR              butbp               atapR, kcf, kbw
                   delayw              ainR + (atapR * kfback)
    
; create width control. note that if width is zero the result is the same as 'simple' mode
atapL              =                   afirst + atapL + (atapR * (1 - kwidth))
atapR              =                   atapR + (atapL * (1 - kwidth))
    
amixL              ntrpol              ainL, atapL, kmix    ;CREATE A DRY/WET MIX BETWEEN THE DRY AND THE EFFECT SIGNAL
amixR              ntrpol              ainR, atapR, kmix    ;CREATE A DRY/WET MIX BETWEEN THE DRY AND THE EFFECT SIGNAL
                   outs                amixL * klevel, amixR * klevel
endin

instr 2
                   cabbageSetValue     "TriggerIndicator", 1-release:k()
endin


</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
