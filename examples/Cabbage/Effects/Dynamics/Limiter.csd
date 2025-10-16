
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Limiter.csd
; Written by Iain McCurdy, 2016, 2024.
; 2024, fixed click bug and changed to UDO. Added graphs

; A simple 'brick-wall' limiter


; Green graph represents the RMS of rhe input signal
; Red graph represents the RMS of the signal after limiting 

; Input Gain (dB)   -   gain applied to the input signal
; Threshold (dB)    -   dB threshold below above which signals will be aggressively limited
; Smoothing         -   response of the amplitude follower. Higher values result in a slower, but possibly smoother, response
; Delay (s)         -   delay applied to the input sound before it is limited (the tracked signal is always undelayed)
;                        This can be useful for compensating for a limiter than is not responding fast enough to sudden dynamic transients 
; Make-up Gain (dB) -   Make up gain. Useful for compensating for gain loss when threshold is low.
; Output Gain (dB)  -   Gain applied the signal output to the speakers. Does not affect the graphs
; Graphs on/Off     -   turn graphs on or off. Turn off to save CPU resources.
; Rate
; Attack            -  attack time of the envelope follower used in creating the graphs
; Decay             -  decay time of the envelope follower used in creating the graphs
; Link Threshold to Make-Up Gain - if activated, changing the threshold will trigger an inverse setting for Make-up Gain
   
<Cabbage>
form caption("Limiter") size(640,330), pluginId("lmtr"), guiMode("queue")
image         bounds(  0,  0,640,330), outlineThickness(6), outlineColour("white"), colour("silver")

#define SLIDER_APPEARANCE textColour("black"), trackerColour(150,200,150), trackerInsideRadius(0.8), valueTextBox(1), fontColour("black"), popupText(0)

rslider  bounds( 10,  5, 90,110), channel("inGain"), text("Input Gain"), range(-48,48,0), $SLIDER_APPEARANCE
rslider  bounds(100,  5, 90,110), channel("thresh"), text("Threshold (dB)"), range(-120,0,-3), $SLIDER_APPEARANCE
rslider  bounds(190,  5, 90,110), channel("smooth"), text("Smoothing"), range(0.01,1,0.1,0.5), $SLIDER_APPEARANCE
rslider  bounds(280,  5, 90,110), channel("delay"), text("Delay (s)"), range(0,0.2,0,0.5), $SLIDER_APPEARANCE
rslider  bounds(370,  5, 90,110), channel("MakeupGain"), text("Make-up Gain (dB)"), range(-48,48,0), $SLIDER_APPEARANCE

checkbox bounds(465, 50, 80, 20), channel("limiting"), text("Limiting"), shape("ellipse"), colour("red"), fontColour:0("black"), fontColour:1("black"), active(0)

checkbox bounds(390,270,280, 15), channel("link"), text("Link Threshold to Make-up Gain"), fontColour:0("black"), fontColour:1("black")

rslider  bounds(540,  5, 90,110), channel("outGain"), text("Output Gain (dB)"), range(-48,48,0), $SLIDER_APPEARANCE

gentable bounds( 10,125,620,110), channel("BeforeGraph"), tableNumber(1), colour( 0,255,0,150), ampRange(0,1,1), fill(0), outlineThickness(2)
gentable bounds( 10,125,620,110), channel("AfterGraph"), tableNumber(2), tableColour(255,0,0,150), tableBackgroundColour(0,0,0,0), tableGridColour(0,0,0,0), ampRange(0,1,2), fill(0), outlineThickness(2)
image    bounds( 10,125,  1,110), channel("indic")

image    bounds( 10,248, 50,  2), colour(0,255,0)
image    bounds( 10,263, 50,  2), colour(255,0,0)
label    bounds( 65,241, 50, 13), text("In"), fontColour("black"), align("left")
label    bounds( 65,256, 50, 13), text("Out"), fontColour("black"), align("left")

checkbox bounds( 10,280,280, 12), channel("GraphsOnOff"), text("Graphs On/Off"), fontColour:0("black"), fontColour:1("black"), value(1)

rslider  bounds(130,240, 60, 80), channel("rate"), text("Rate"), range(8,128,64,1,1), $SLIDER_APPEARANCE
rslider  bounds(190,240, 60, 80), channel("att"), text("Attack"), range(0.01,1,0.05,0.5), $SLIDER_APPEARANCE
rslider  bounds(250,240, 60, 80), channel("dec"), text("Decay"), range(0.01,1,0.1,0.5), $SLIDER_APPEARANCE
rslider  bounds(310,240, 60, 80), channel("YScale"), text("Y Scale"), range(0,100,1,0.5), $SLIDER_APPEARANCE

label    bounds(  6,313,120, 12), text("Iain McCurdy |2016|"), align("left"), fontColour("darkGrey")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

;sr is set by host
ksmps  =  32
nchnls =  2
0dbfs  =  1

iTabSize           =                   620
giBeforeGraph      ftgen               1, 0, iTabSize, -2, 0
giAfterGraph       ftgen               2, 0, iTabSize, -2, 0

opcode LimiterSt,aak,aakkkk
aL,aR,kthresh,ksmooth,kdelay,kgain xin

 ksmooth           init                0.1
 kthresh           =                   ampdbfs(kthresh-1)          ; convert threshold to an amplitude value
 if changed(ksmooth)==1 then                                       ; if Smoothing slider is moved...
                   reinit              REINIT                      ; ... force a reinitialisation
 endif
 REINIT:                                         ; reinitialise from here
 krmsL             rms                 aL, 1 / i(ksmooth)          ; scan both channels
 krmsR             rms                 aR, 1 / i(ksmooth)          ; ...
 rireturn                                        ; return to performance pass from reinitialisation pass (if applicable)
 krms              max                 krmsL,krmsR                 ; but only used the highest rms

 if kdelay>0 then                                                  ; if Delay value is anything above zero ...
  aL               vdelay              aL, kdelay * 1000, 200      ; delay audio signals before limiting
  aR               vdelay              aR, kdelay * 1000, 200
 endif

 kfctr             =                   divz:k(kthresh,krms,0.001)  ; derive less than '1' factor required to attenuate audio signal to limiting value
 afctr             interp              kfctr                       ; smooth changes (and interpolate from k to a)
 if krms>kthresh then                                              ; if current RMS is above threshold; i.e. limiting required
  aL_L             =                   aL * afctr                  ; apply scaling factor
  aL_R             =                   aR * afctr
  klimiting        =                   1                           ; switch value used by GUI indicator (on)
 else
  aL_L             =                   aL                          ; pass audio signals unchanged
  aL_R             =                   aR                          ; ...
  klimiting        =                   0                           ; switch value used by GUI indicator (off)
 endif
 kgain             =                   ampdb(kgain)                ; derive gain value as an amplitude factor
 aL_L              *=                  kgain                       ; make up gain
 aL_R              *=                  kgain
                   xout                aL_L, aL_R, klimiting
endop



instr 1
 kinGain           =                   ampdbfs(cabbageGetValue:k("inGain"))
 koutGain          =                   ampdbfs(cabbageGetValue:k("outGain"))
 aL,aR             ins                                 ; read live audio in
 
 
 /*
 ; use to test
 kenv lfo    1,0.25,4
 ;aL   poscil tone:a(aenv,20),220
 aL    noise  kenv*2, 0
 aR = aL
 */
 
 aL                *=                  kinGain
 aR                *=                  kinGain
   
 kthresh           cabbageGetValue     "thresh"                ; read in widgets
 ksmooth           cabbageGetValue     "smooth"                ; this is needed as an i-time variable so will have to be cast as an i variable and a reinitialisation forced
 kdelay            cabbageGetValue     "delay"             
 kMakeupGain       cabbageGetValue     "MakeupGain"
 kGraphsOnOff      cabbageGetValue     "GraphsOnOff"
 klink             cabbageGetValue     "link"
 
                   cabbageSetValue     "MakeupGain", -kthresh, (klink * changed:k(kthresh)) + trigger:k(klink,0.5,0)
 
 aL_L,aL_R,klimiting LimiterSt aL, aR, kthresh, ksmooth, kdelay, kMakeupGain 
 
 if kGraphsOnOff==0 kgoto SKIP
 ; graphs
 kPtr              init                0                                  ; initialise pointer
 kAtt              cabbageGetValue     "att"                              ; attack time of envelope follower
 kDec              cabbageGetValue     "dec"                              ; decay time of envelope follower
 kYScale           cabbageGetValue     "YScale"                           ; scaling of the graphs on the vertical axis
 aRMSin            follow2             (aL + aR) * 0.5, kAtt, kDec        ; follow envelope of input signal
 aRMSout           follow2             (aL_L + aL_R)*0.5, kAtt, kDec      ; follow envelope of output signal
 
 if metro:k(cabbageGetValue("rate"))==1 then                                        ; throttle rate of graph updates
                   tablew              k(aRMSin)*kYScale, kPtr, giBeforeGraph       ; write 'before' graph value to table
                   cabbageSet          1, "BeforeGraph", "tableNumber", 1           ; update GUI gentable

                   tablew              k(aRMSout)*kYScale, kPtr, giAfterGraph       ; write 'after' graph value to table
                   cabbageSet          1, "AfterGraph", "tableNumber", 2            ; update GUI gentable
                   cabbageSet          1, "indic", "bounds", 10 + kPtr, 125, 1, 110 ; update write position indicator
 kPtr              =                   (kPtr + 1) % ftlen(giBeforeGraph)
 endif
 SKIP:

 if metro(16)==1 then                                                              ; throttle rate if updates of limiting indicator (to save a bit of CPU)
                   cabbageSetValue     "limiting", klimiting, changed:k(klimiting) ; send value for limiting indicator
 endif

                   outs                aL_L*koutGain, aL_R*koutGain                ; send limited audio signals to outputs
endin                              

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>