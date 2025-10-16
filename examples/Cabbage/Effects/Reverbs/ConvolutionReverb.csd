
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; ConvolutionReverb.csd
; Written by Iain McCurdy, 2012, 2024.
; 
; You will need a wav format impulse response (IR) to use with this example. You can find some good quality free IRs here: https://www.echothief.com/
;
; Load IR           -   open a mono or stereo impulse response file. If a mono file is chosen it will be copied to both channels of an interleaved stereo function table. 
; INPUT             -   choose between mono or stereo input. This only affects the dry signal at the output. The reverberated sound will always be stereo.
; DIRECTION         -   direction of the impulse response: forwards or backwards
; RESIZE            -   optionally resize (by shortening) the impulse response
; Size Ratio        -   ratio by which to shorten the impulse response (if RESIZE:Compressed is chosen).
; Curve             -   an amplitude envelope is applied to the impulse response if RESIZE:Compressed is chosen. 
;                       Negative values give steeper concave envelopes, positive values give steeper convex envelopes, zero gives a straight line.
; In Skip           -   Amount (in sample frame) to skip in the impulse response. This can be useful to remove silences at the start of impulse response files.
; Delay Offset      -   Some delay is already applied to the dry signal depending on calculated latency and whether the impulse has been reversed but the control allows an additional modification of this delay time.
;                       Normally this should be zero but adjust it to modify how the dry signal lines up with the convoluted signal.
; Partition Length  -   Partition length (in sample frames) used in the convolution. Smaller values reduces latency but increases CPU load.

; Iterations
; This feature faciliates the convolution reverb impulse to be applied iteratively in series. 
; This is an effect similar to that employed in a more organic way by the composer Alvin Lucier in his piece, 'I Am Sitting in a Room'.
; This technique will increasingly resonate room modes so therefore feedback and catastrophic build up of amplitude are significant concerns.
; To control this, attenuation  is applied to the signal sent to each subsequent reverb.
; Additionally, a high-pass filter can be applied to each iteration if a low-frequency build up is the specific problem.
; Iteratioins       -   number of iterations
; Attenuation       -   attenuating gain applied to the signal sent to each subsequent reverb
; Low Cut           -   cutoff frequency of a high-pass filter applied to the signal leaving each iteration 

; EQ - a stereo parametric EQ is applied to the reverberated signal
; Low Cut           -   frequency of a high-pass filter
; Freq              -   frequency (in hertz) of the stereo parametric EQ
; Width             -   bandwidth (in octaves) of the stereo parametric EQ
; Gain              -   gain (in decibels) of the stereo parametric EQ 

; Mixer Controls
; Dry               -   Dry signal gain
; Wet               -   Wet signal gain
; Level             -   Level control of both dry and wet signals

; Display Gain      -   the vertical slider at the right of the impulse waveform control vertical gain applied to the impulse waveform view. Does not affect audio gain.

<Cabbage>
form caption("Convolution Reverb") size(1270,330), pluginId("Conv"), guiMode("queue"), colour(60, 60, 60)
image                      bounds(0, 0, 1270,330), colour(33, 30, 30), shape("rounded"), outlineColour(105,105, 80), outlineThickness(4) 

#define SLIDER_DESIGN  colour( 55, 40, 40), trackerColour(255,255,150), outlineColour( 75, 35,  0),  textColour(250,250,250), valueTextBox(1), fontColour("white"), trackerInsideRadius(0.88), trackerOutsideRadius(1), markerColour("LightGrey")
#define SLIDER_DESIGN2 colour( 60, 60, 75), trackerColour(170,255,255), outlineColour( 75, 35,  0), textColour(250,250,250), valueTextBox(1), fontColour("white"), trackerInsideRadius(0.88), trackerOutsideRadius(1), markerColour("LightGrey")
#define SLIDER_DESIGN3 colour(105, 60, 60), trackerColour(255,170,255), outlineColour( 75, 35,  0), textColour(250,250,250), valueTextBox(1), fontColour("white"), trackerInsideRadius(0.88), trackerOutsideRadius(1), markerColour("LightGrey")
#define SLIDER_DESIGN4 colour( 60, 60,105), trackerColour(170,170,255), outlineColour( 75, 35,  0), textColour(250,250,250), valueTextBox(1), fontColour("white"), trackerInsideRadius(0.88), trackerOutsideRadius(1), markerColour("LightGrey")
#define SLIDER_DESIGN5 colour( 60, 60, 85), trackerColour(220,220,235), outlineColour( 75, 35,  0), textColour(250,250,250), valueTextBox(1), fontColour("white"), trackerInsideRadius(0.88), trackerOutsideRadius(1), markerColour("LightGrey")

filebutton bounds( 10, 25, 90, 25), text("Load IR","Load IR"), fontColour("white") channel("filename"), corners(5), colour:0(80,30,30)

label   bounds( 10,  55, 90, 13), text("INPUT"), fontColour(250,250,250)
button  bounds( 10,  70, 90, 25), text("Mono","Stereo"), channel("MonoStereo"), value(1), fontColour(250,250,250), corners(5), colour:0(30,80,30)

label   bounds(110,  11, 90, 13), text("DIRECTION"), fontColour(250,250,250)
button  bounds(110,  25, 90, 25), text("Forward","Backward"), channel("FwdBwd"), value(0), fontColour(250,250,250), corners(5), colour:0(30,30,80)

label   bounds(110,  55, 90, 13), text("RESIZE"), fontColour(250,250,250)
button  bounds(110,  70, 90, 25), text("Normal","Compressed"), channel("resize"), value(0), fontColour(250,250,250), corners(5), colour:0(80,80,30)

rslider bounds(210, 10, 70, 90), text("Size Ratio"), channel("CompRat"), range(0.001, 1.00, 1), $SLIDER_DESIGN4, visible(0)
rslider bounds(280, 10, 70, 90), text("Curve"), channel("Curve"), range(-20.00, 20.00, 0), $SLIDER_DESIGN4, visible(0)

;image    bounds(360, 20, 80, 75), colour(0,0,0,0), channel("AmpEnv")
;{
;label    bounds(  0,  0, 80, 12), text("Amp. Envelope"), fontColour("white")
;gentable bounds(  0, 15, 80, 40), channel("AmpTable"),  tableNumber(12), ampRange(0,1,12), tableColour(200,200,0), tableBackgroundColour(0,0,0), tableGridColour(0,0,0,0)
;}

rslider bounds(350, 10, 70, 90), text("In Skip"), channel("SkipSamples"), range(0, 100000, 0,1,1), $SLIDER_DESIGN
rslider bounds(420, 10, 70, 90), text("Del.OS."), channel("DelayOS"), range(-1.00, 1.00, 0), $SLIDER_DESIGN

label    bounds(500, 15, 80, 13), text("Partition Len."), fontColour("white")
combobox bounds(500, 30, 80, 20), channel("PLen"), items("2","4","8","16","32","64","128","256","512","1024","2048","4096"), value(8)

rslider bounds(590, 10, 70, 90), text("Iterations"), channel("iter"), range(1, 48, 1,1,1), $SLIDER_DESIGN5
rslider bounds(660, 10, 70, 90), text("Attenuation"), channel("atten"), range(0.00o1, 0.01, 0.02, 0.5, 0.001), $SLIDER_DESIGN5
rslider bounds(730, 10, 70, 90), text("Low Cut"), channel("LoCut"), range(0, 5000, 0,0.5,1), $SLIDER_DESIGN5
;rslider bounds(800, 10, 70, 90), text("Mix"), channel("IterMix"), range(0, 1, 0.5, 0.5, 1), $SLIDER_DESIGN5

checkbox bounds(810,  5, 80, 13), channel("EQOnOff"), text("EQ On/Off"), value(0), fontColour:0("white"), fontColour:1("white")
image    bounds(800, 20,250, 80), colour(0,0,0,0), active(0), alpha(0.3), channel("EQ")
{
rslider bounds(  0,  0, 70, 80), text("Low Cut"), channel("EQLowCut"), range(10, 5000, 10, 0.5, 1), $SLIDER_DESIGN2
rslider bounds( 60,  0, 70, 80), text("Freq"), channel("EQFreq"), range(50, 12000, 6000, 0.5,1), $SLIDER_DESIGN2
rslider bounds(120,  0, 70, 80), text("Width"), channel("EQBW"), range(0.1, 1, 1, 0.5), $SLIDER_DESIGN2
rslider bounds(180,  0, 70, 80), text("Gain"), channel("EQGain"), range(-48, 48, 0, 1, 0.1), $SLIDER_DESIGN2
}

rslider bounds(1050, 10, 70, 90), text("Dry"), channel("dry"), range(0, 10, 0.25, 0.33, 0.0001), $SLIDER_DESIGN3
rslider bounds(1120, 10, 70, 90), text("Wet"), channel("wet"), range(0, 10, 0.25, 0.33, 0.0001), $SLIDER_DESIGN3
rslider bounds(1190, 10, 70, 90), text("Level"), channel("level"), range(0, 1.00, 0.4, 0.33, 0.0001), $SLIDER_DESIGN3

gentable   bounds(  10,110,1240,200), channel("DisplayTable"),  tableNumber(11), ampRange(-1,1,11), fill(1) tableColour("LightBlue")
label      bounds(  14,112, 890, 16), text(""), align("left"), colour(0,0,0,0), fontColour(255,255,255,150), channel("stringbox")
label      bounds(  14,112, 890, 16), text("First browse for an impulse response (mono or stereo wav file) via 'Load IR'."), align("left"), fontColour(255,255,255,150), visible(1), channel("InstructionID")
vslider    bounds(1254,105,  10,216), channel("DispGain"), range(1,50,1,0.5)

label      bounds(  10,313,120, 12), text("Iain McCurdy |2012|"), align("left"), fontColour("Silver")
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

; Author: Iain McCurdy (2012)

giSource           ftgen               1, 0, 2, 10, 0
giFwd              ftgen               2, 0, 2, 10, 0
giBwd              ftgen               3, 0, 2, 10, 0
giFwdComp          ftgen               4, 0, 2, 10, 0
giBwdComp          ftgen               5, 0, 2, 10, 0
 
giDisplay          ftgen               11, 0, 2^16, 10, 0    ; display table table
giAmpEnv           ftgen               12, 0, 2^10, 2, 0
gkReady            init                0


giMinIR            =                   4096 ; minimum IR duration permitted



; create display table UDO
opcode display_table, 0, iii
iSource,iDisplay,iDispGain xin
iCount             =                   0
while iCount<ftlen(iDisplay) do
iNdx               =                   iCount * (ftlen(iSource)/ftlen(iDisplay))

iVal               table               iNdx, iSource
                   tablew              iVal*iDispGain, iCount, iDisplay
iCount             +=                  1
od
                   cabbageSet          "DisplayTable", "tableNumber", 11
endop


; forward table UDO
opcode tab_forward,0,iii
iSource,iFwd,iSkipSamples xin
iTabLen            limit               ftlen(iSource)-iSkipSamples, giMinIR, ftlen(iSource) 
i_                 ftgen               iFwd,0,iTabLen,10,0
iCount             =                   1
while iCount<(ftlen(iFwd)-iSkipSamples) do
iVal               table3              iCount+iSkipSamples, iSource
                   tablew              iVal, iCount, iFwd
iCount             +=                  1
od
endop


; backward table UDO
opcode tab_backward,0,iii
iSource,iBwd,iSkipSamples xin
iTabLen            limit               ftlen(iSource)-iSkipSamples, giMinIR, ftlen(iSource) 
i_                 ftgen               iBwd,0,iTabLen,10,0
iCount             =                   1
while iCount<(ftlen(iBwd)-iSkipSamples) do
iVal               table3              iCount+iSkipSamples, iSource
                   tablew              iVal, ftlen(iBwd)-iCount, iBwd
iCount             +=                  1
od
endop


; forward table compressed UDO
opcode tab_forward_comp,0,iiiii
iSource,iFwdComp,iSkipSamples,iCompRat,iCurve xin
iTabLen            limit               int(ftlen(iSource)*iCompRat)-iSkipSamples, giMinIR, ftlen(iSource) 
i_                 ftgen               iFwdComp,0,iTabLen,10,0
iAmpScaleTab       ftgen               iFwdComp+300, 0, iTabLen, -16, 1,iTabLen, iCurve, 0
iCount             =                   1
while iCount<ftlen(iFwdComp) do
iVal               table3              iCount+iSkipSamples, iSource
iAmpScale          table               iCount, iAmpScaleTab
                   tablew              iVal*iAmpScale, iCount, iFwdComp
iCount             +=                  1
od
endop

; backward table compressed UDO
opcode tab_backward_comp,0,iiiii
iSource,iBwdComp,iSkipSamples,iCompRat,iCurve xin
iTabLen            limit               int(ftlen(iSource)*iCompRat)-iSkipSamples, giMinIR, ftlen(iSource) 
i_                 ftgen               iBwdComp,0,iTabLen,10,0
iAmpScaleTab       ftgen               iBwdComp+300, 0, iTabLen, -16, 1,iTabLen, iCurve, 0
iCount             =                   1
while iCount<ftlen(iBwdComp) do
iVal               table3              iCount+iSkipSamples, iSource
iAmpScale          table               iCount, iAmpScaleTab
                   tablew              iVal*iAmpScale, ftlen(iBwdComp)-iCount, iBwdComp
iCount             +=                  1
od
endop




opcode	NextPowerOf2i,i,i
 iInVal	xin
 icount	=	1
 LOOP:
 if 2^icount>iInVal then
  goto DONE
 else
  icount	=	icount + 1
  goto LOOP
 endif
 DONE:
 	xout	2^icount
endop





opcode ftconvStack, aa, aiiiikkip
 ainMix, iFn, iPLen, iSkipSamples, iIRLen, katten, kLoCut, iNum, iCount xin
   aL,aR           ftconv              ainMix*katten/(iCount^0.1), iFn, iPLen, iSkipSamples, iIRLen   ; CONVOLUTE INPUT SOUND
   ;kEQFreq         =                   12000
   ;kEQBW           =                   1
   ;kEQGain         =                   24
   ;aL              eqfil               aL, kEQFreq, kEQFreq*kEQBW, ampdbfs(kEQGain)
   ;aR              eqfil               aR, kEQFreq, kEQFreq*kEQBW, ampdbfs(kEQGain)
   if kLoCut>0 then
    ;aL buthp aL, kLoCut
    ;aR buthp aR, kLoCut
    aL atone aL, kLoCut
    aR atone aR, kLoCut
   endif
   ;aL dcblock2 aL
   ;aR dcblock2 aR
   if iCount<iNum then
    aL,aR ftconvStack aL + aR, iFn, iPLen, iSkipSamples, iIRLen, katten, kLoCut, iNum, iCount+1
   endif
 xout aL, aR
endop




instr    1
 gSfilepath        cabbageGetValue     "filename"
 kNewFileTrg       changed             gSfilepath        ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                                  ; if a new file has been loaded...
                   event               "i",99,0,0.01     ; call instrument to update sample storage function table 
 endif
 
 if trigger:k(gkReady,0.5,0)==1 then                     ; when a file is loaded for the first time do this conditional branch...
                   event               "i",2,0,3600*24*7 ; start the convolution instrument
 endif
 
 ; activate/deactivate controls
 ;kiter   cabbageGetValue  "iter"
 ;        cabbageSet       changed:k(kiter), "atten", "active", kiter > 1 ? 1 : 0
 ;        cabbageSet       changed:k(kiter), "LoCut", "active", kiter > 1 ? 1 : 0

endin


instr    2    ;CONVOLUTION REVERB INSTRUMENT
 kPortTime         linseg              0, 0.001, 0.05
                   cabbageSet          "InstructionID", "visible", 0        ; hide the instruction
 kFwdBwd           cabbageGetValue     "FwdBwd"
 kresize           cabbageGetValue     "resize"
 kdry              cabbageGetValue     "dry"
 kwet              cabbageGetValue     "wet"
 klevel            cabbageGetValue     "level"
 klevel            portk               klevel, kPortTime
 kCompRat          cabbageGetValue     "CompRat"
 kCurve            cabbageGetValue     "Curve"
 kSkipSamples      cabbageGetValue     "SkipSamples"
 kDelayOS          cabbageGetValue     "DelayOS"
 kDispGain         cabbageGetValue     "DispGain"
 kPLen             cabbageGetValue     "PLen"
 kPLen             init                9
 kCompRat          init                1                   ; IF THIS IS LEFT UNINITIALISED A CRASH WILL OCCUR! 

 
 ainL,ainR         ins                                     ; READ STEREO AUDIO INPUT
 ainMix            sum                 ainL,ainR
     
 kSwitchStr        changed             gSfilepath
 ;kSwitchStr        delayk              kSwitchStr,1
 ;if metro:k(16)==1 then
  kSwitch          changed             kSwitchStr,kSkipSamples,kFwdBwd,kDelayOS,kCompRat,kCurve,kresize,kDispGain,kPLen    ; GENERATE A MOMENTARY '1' PULSE IN OUTPUT 'kSwitch' IF ANY OF THE SCANNED INPUT VARIABLES CHANGE. (OUTPUT 'kSwitch' IS NORMALLY ZERO)
 ;endif 
 if kSwitch==1 then                                      ; IF I-RATE VARIABLE IS CHANGED...
                   reinit              UPDATE            ; BEGIN A REINITIALISATION PASS IN ORDER TO EFFECT THIS CHANGE. BEGIN THIS PASS AT LABEL ENTITLED 'UPDATE' AND CONTINUE UNTIL rireturn OPCODE 
 endif                                                   ; END OF CONDITIONAL BRANCHING
 UPDATE:                                                 ; LABEL
 
 iSkipSamples      =                   i(kSkipSamples)
 iPLen             =                   2^i(kPLen)
 
if i(kFwdBwd)==0 && i(kresize)==0 then          ; FORWARD
                   cabbageSet          "CompRat", "visible", 0
                   cabbageSet          "Curve", "visible", 0
;                   cabbageSet          "AmpEnv", "visible", 0
                   tab_forward         giSource, giFwd, iSkipSamples
  iIRLen           =                   ftlen(giFwd) * 0.5                    ; DERIVE THE LENGTH OF THE IMPULSE RESPONSE IN SAMPLES. DIVIDE BY 2 AS TABLE IS STEREO.
  iDelTim          =                   abs((iPLen/sr)+i(kDelayOS))
  iFn              =                   giFwd
elseif i(kFwdBwd)==1 && i(kresize)==0 then      ; BACKWARDS REVERB
                   cabbageSet          "CompRat", "visible", 0
                   cabbageSet          "Curve", "visible", 0
;                   cabbageSet          "AmpEnv", "visible", 0
                   tab_backward        giSource, giBwd, iSkipSamples
  iIRLen           =                   ftlen(giBwd) * 0.5                  ; DERIVE THE LENGTH OF THE IMPULSE RESPONSE IN SAMPLES. DIVIDE BY 2 AS TABLE IS STEREO.
  iDelTim          =                   abs((iPLen/sr)+(iIRLen/sr)-(iSkipSamples/sr)+i(kDelayOS))
  iFn              =                   giBwd
 elseif i(kFwdBwd)==0 && i(kresize)==1 then      ; FORWARDS COMPRESSED
                   cabbageSet          "CompRat", "visible", 1
                   cabbageSet          "Curve", "visible", 1
 ;                  cabbageSet          "AmpEnv", "visible", 1
 i_                ftgen               giAmpEnv, 0, ftlen(giAmpEnv), -16, 1,ftlen(giAmpEnv), i(kCurve), 0
 ;                  cabbageSet          "AmpTable", "tableNumber", giAmpEnv
                   tab_forward_comp    giSource, giFwdComp, iSkipSamples, i(kCompRat), i(kCurve) 
  iIRLen           =                   ftlen(giFwdComp) * 0.5                 ; DERIVE THE LENGTH OF THE IMPULSE RESPONSE IN SAMPLES. DIVIDE BY 2 AS TABLE IS STEREO.
  iDelTim          =                   abs((iPLen/sr)+i(kDelayOS))
  iFn              =                   giFwdComp  
 elseif i(kFwdBwd)==1 && i(kresize)==1 then       ; BACKWARDS COMPRESSED
                   cabbageSet          "CompRat", "visible", 1
                   cabbageSet          "Curve", "visible", 1
 ;                  cabbageSet          "AmpEnv", "visible", 1
 i_                ftgen               giAmpEnv, 0, ftlen(giAmpEnv), -16, 1,ftlen(giAmpEnv), i(kCurve), 0
 ;                  cabbageSet          "AmpTable", "tableNumber", giAmpEnv
                   tab_backward_comp   giSource, giBwdComp, iSkipSamples, i(kCompRat), i(kCurve) 
  iIRLen           =                   ftlen(giBwdComp) * 0.5                 ; DERIVE THE LENGTH OF THE IMPULSE RESPONSE IN SAMPLES. DIVIDE BY 2 AS TABLE IS STEREO.
  iDelTim          =                   abs((iPLen/sr)+((iIRLen)/sr)-(iSkipSamples/sr)+i(kDelayOS))
  iFn              =                   giBwdComp  
 endif
 ;iDelTim           =                   iDelTim < 0 ? 0 : iDelTim
 
                   display_table       iFn, giDisplay, i(kDispGain)

   aL,aR           ftconv              ainMix, iFn, iPLen, iSkipSamples, iIRLen   ; CONVOLUTE INPUT SOUND
   
   ; iterations
   kiter   cabbageGetValue  "iter"
   katten  cabbageGetValue  "atten"
   kLoCut  cabbageGetValue  "LoCut"
   kLoCut  portk            kLoCut, kPortTime

   if changed:k(kiter)==1 then
    reinit REBUILD_STACK
   endif
   REBUILD_STACK:
    if i(kiter)>1 then
     aL,aR ftconvStack aL+aR, iFn, iPLen, iSkipSamples, iIRLen, katten, kLoCut, i(kiter)   ; CONVOLUTE INPUT SOUND
    endif
   rireturn
   
   kMonoStereo     cabbageGetValue     "MonoStereo"
   if kMonoStereo==0 then ; mono
    adelL          delay               ainL, iDelTim ; DELAY THE INPUT SOUND ACCORDING TO THE BUFFER SIZE AND THE DURATION OF THE IMPULSE FILE
    adelR          =                   adelL
   else ; stereo
    adelL          delay               ainL, iDelTim ; DELAY THE INPUT SOUND ACCORDING TO THE BUFFER SIZE AND THE DURATION OF THE IMPULSE FILE
    adelR          delay               ainR, iDelTim ; DELAY THE INPUT SOUND ACCORDING TO THE BUFFER SIZE AND THE DURATION OF THE IMPULSE FILE
   endif
           
                   rireturn
 ; EQ
 kEQOnOff          cabbageGetValue     "EQOnOff"
 if changed:k(kEQOnOff)==1 then
  cabbageSet 1,"EQ", "active", kEQOnOff
  cabbageSet 1,"EQ", "alpha", 0.3 + (0.7*kEQOnOff)
 endif
 if kEQOnOff==1 then
  kEQLowCut         cabbageGetValue     "EQLowCut"
  kEQFreq           cabbageGetValue     "EQFreq"
  kEQBW             cabbageGetValue     "EQBW"
  kEQGain           cabbageGetValue     "EQGain"
  kEQLowCut         portk               kEQLowCut, kPortTime
  kEQFreq           portk               kEQFreq, kPortTime
  kEQBW             portk               kEQBW, kPortTime
  kEQGain           portk               kEQGain, kPortTime
  aL                buthp               aL, kEQLowCut
  aR                buthp               aR, kEQLowCut
  aL                eqfil               aL, kEQFreq, kEQFreq*kEQBW, ampdbfs(kEQGain)
  aR                eqfil               aR, kEQFreq, kEQFreq*kEQBW, ampdbfs(kEQGain)
 endif
    
 ; CREATE A DRY/WET MIX
 aMixL             sum                 adelL * kdry, aL * kwet
 aMixR             sum                 adelR * kdry, aR * kwet
                   outs                aMixL * klevel, aMixR * klevel
endin


instr    99    ; load sound file
 iChans            filenchnls          gSfilepath
 if iChans==2 then ; stereo
  i_                ftgen               giSource,0,0,1,gSfilepath,0,0,0         ; load stereo file
 else              ; if a mono file is selected, it will be copied to both channels, GEN52 needs a power-of-2 table size
  iMono             ftgentmp            0,0,0,1,gSfilepath,0,0,1                   ; load mono file (deferred table size)
  iPO2              NextPowerOf2i       ftlen(iMono)                               ; derive the next power of 2 above the deferred table size
  iMonoPO2          ftgentmp            0,0,iPO2,1,gSfilepath,0,0,0                ; mono file but in a power-of-2-sized function table
  i_                ftgen               giSource,0, iPO2*2, 52, 2, iMonoPO2,0,1, iMonoPO2,0,1 ; create interleaved table
 endif
                   cabbageSet          "DisplayTab", "tableNumber", giDisplay
 gkReady           init                1                                      ; if no string has yet been loaded giReady will be zero 
 ; write file name to GUI
 SFileNoExtension  cabbageGetFileNoExtension gSfilepath
                   cabbageSet                "stringbox", "text", SFileNoExtension
 
endin
        
</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
