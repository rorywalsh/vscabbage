
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; MultiModeDelay.csd
; Written by Iain McCurdy, 2012, 2025.


; Input         -  mono or stereo input. 
;                   Note that both delay modes expect a stereo signal input.
;                   In mono mode, the left channel is sent to both inputs of the stereo delays.
; Mode          -  Ping Pong or stereo
; Swap Channels - available in ping-pong mode.
;                 Swaps the output of the delayed signal. Dry signal is unchanged.
;                 When this is off, the left channel leads, when on, the right channel leads.
; Time          -  delay time
; Port. Time    -  portamento time applied to changes of delay time. This will produce audible pitch warping as it is increased.
; Feedback      -  ratio of the output signal fed back into the input (regeneration)
; Saturation    -  activates clipping applied to the audio signal before being fed back.
;                  This prevents unpleasant digital distortion when feedback is greater than 1.
;                  This is automatically triggered when feedback is greater than 1 
;                    and is reactivated if an attempt is made to deactivate it while feedback is still greater than 1.
; High Cut      -  cutoff frequency of a low-pass filter (6dB/oct) inserted within the delay loop
; Low Cut       -  cutoff frequency of a high-pass filter (6dB/oct) inserted within the delay loop
; Reverb        -  amount of reverb that is added within the delay loop.
;                  as this is iterative, the amount of actual reverb will increase as the echoes repeat,
;                  Runaway feedback is possible if delay 'Feedback' is high so caution is advised when raising the 'Reverb' control.
; F.Shift       -  Frequency shift which will be applied iteratively to echo repeats. If set to zero, the frequency shifter is bypassed.
; Mix           -  crossfading mix between dry and wet signals
; Level         -  level of the output signal (both dry and wet signals)

<Cabbage>
form caption("Multimode Delay")  size(995,125), pluginId("MMDl"), guiMode("queue"), colour(37,50,56)
image                      bounds(0,0,995,125), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(5)
#define SLIDER_DESIGN colour( 27, 40, 46) trackerColour("silver"), textColour("silver"),  markerColour("silver"), valueTextBox(1), markerThickness(.4), trackerInsideRadius(.85)

label    bounds( 10,  5, 80, 13), text("Input")
combobox bounds( 10, 20, 80, 20),  text("Mono","Stereo"), channel("input"), value(2)

label    bounds( 10, 45, 80, 13), text("Mode")
combobox bounds( 10, 60, 80, 20),  text("Ping Pong","Stereo"), channel("mode"), value(1)

checkbox bounds( 10, 90,105, 15), channel("SwapChans"), text("Swap Channels"), visible(1)

rslider  bounds(110, 15, 70, 90),  text("Time"), channel("time"),     range(0.003, 10, 0.4, 0.5), $SLIDER_DESIGN
rslider  bounds(180, 15, 70, 90),  text("Port.Time"), channel("PortTime"),     range(0, 5, 0.05, 0.5), $SLIDER_DESIGN
rslider  bounds(250, 15, 70, 90), text("Feedback"), channel("feedback"), range(0, 1.20, 0.5), $SLIDER_DESIGN

checkbox bounds(320, 50, 80, 15), channel("saturation"), text("Saturation"), value(0)

rslider  bounds(400, 15, 70, 90), text("Clip Point"), channel("ClipPoint"), range(0.1, 0.9, 0.8), active(0), alpha(0.3), $SLIDER_DESIGN

image    bounds(500,  9,280,  1), colour("grey")
rslider  bounds(500, 15, 70, 90),  text("High Cut"), channel("HighCut"), range(20,20000,20000,0.5,1), $SLIDER_DESIGN
rslider  bounds(570, 15, 70, 90),  text("Low Cut"), channel("LowCut"), range(20,20000,20,0.5,1), $SLIDER_DESIGN
rslider  bounds(640, 15, 70, 90),  text("Reverb"), channel("Reverb"), range(0,1,0), $SLIDER_DESIGN
rslider  bounds(710, 15, 70, 90),  text("F.Shift"), channel("FShift"), range(-1000,1000,0,1,0.1), $SLIDER_DESIGN

image    bounds(810,  9,140,  1), colour("grey")
rslider  bounds(810, 15, 70, 90), text("Mix"), channel("mix"), range(0, 1.00, 0.5), $SLIDER_DESIGN
rslider  bounds(880, 15, 70, 90), text("Level"), channel("level"), range(0, 1.00, 1.0), $SLIDER_DESIGN

label    bounds(  5,110, 110, 12), text("Iain McCurdy |2012|")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 32  ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls = 2   ; NUMBER OF CHANNELS (2=STEREO)
0dbfs  = 1

;Author: Iain McCurdy (2012)


giSine             ftgen               0, 0, 4096, 10, 1            ; A SINE WAVE SHAPE

opcode    FreqShifter,a,aki
    ain,kfshift,ifn    xin       ; READ IN INPUT ARGUMENTS
    
    areal, aimag hilbert ain                  ; HILBERT OPCODE OUTPUTS TWO PHASE SHIFTED SIGNALS, EACH 90 OUT OF PHASE WITH EACH OTHER
    ; QUADRATURE OSCILLATORS. I.E. 90 OUT OF PHASE WITH RESPECT TO EACH OTHER
    asin           oscili              1,         kfshift,     ifn,           0
    acos           oscili              1,         kfshift,     ifn,           0.25    
    ; RING MODULATE EACH SIGNAL USING THE QUADRATURE OSCILLATORS AS MODULATORS
    amod1          =                   areal * acos
    amod2          =                   aimag * asin    
    ; UPSHIFTING OUTPUT
    aOut           =                   (amod1 - amod2)
                   xout                aOut                     ; SEND AUDIO BACK TO CALLER INSTRUMENT
endop


instr    1
    ktime        cabbageGetValue    "time"                     ; READ WIDGETS...
    kPortTime    cabbageGetValue    "PortTime"
    kHighCut     cabbageGetValue    "HighCut"
    kLowCut      cabbageGetValue    "LowCut"
    kFShift      cabbageGetValue    "FShift"
    kfeedback    cabbageGetValue    "feedback"
                 cabbageSetValue    "saturation", 1, trigger:k(kfeedback,1,0) ; if feedback goes above 1, turn on saturation
    kmix         cabbageGetValue    "mix"
    klevel       cabbageGetValue    "level"
    ksaturation  cabbageGetValue    "saturation"
                 cabbageSet         changed:k(ksaturation), "ClipPoint", "active", ksaturation
                 cabbageSet         changed:k(ksaturation), "ClipPoint", "alpha", 0.3 + (ksaturation * 0.7)
    kClipPoint   cabbageGetValue    "ClipPoint"
    kClipPoint   init               0.8 ; needed for older versions of Cabbage
    if kfeedback>1 then
                 cabbageSetValue    "saturation", 1, trigger:k(ksaturation,0.5,1) ; if the user attempts to disable saturation while feedback is greater than 1, turn in back on
    endif
    kinput       cabbageGetValue    "input"
    if kinput==1 then
     asigL        inch               1
     asigR        =                  asigL
    else
     asigL, asigR ins
    endif
    kramp        linseg             0,0.01,1                   ; CREATE A VARIABLE THAT WILL BE USED FOR PORTAMENTO TIME
    ktime        portk              ktime,kramp*kPortTime      ; PORTAMENTO SMOOTHING OF DELAY TIME
    atime        interp             ktime                      ; INTERPOLATED A-RATE VERSION OF DELAY TIME
    kmode        cabbageGetValue    "mode"
    kSwapChans   cabbageGetValue    "SwapChans"
                 cabbageSet         changed:k(kmode), "SwapChans", "visible", 1 - (kmode - 1)


    ; reverb set-up
    iRvbFBLvl    =                  0.3                        ; control of max reverb feedback level
    kReverb      cabbageGetValue    "Reverb"
    kRvbTime     =                  2
    kHFDif       =                  0.7
     


    ; PING-PONG DELAY
    ; OFFSET DELAY
    if kmode==1 then
     aL_OS       vdelay             asigL,(atime*1000)/2,(10*1000)/2 ; DELAYED OFFSET OF LEFT CHANNEL (FIRST 'PING')
     if kFShift!=0 then
      aL_OS      FreqShifter        aL_OS, kFShift, giSine
     endif

     ;LEFT CHANNEL
     abuf        delayr             10                         ; ESTABLISH DELAY BUFFER
     aDelL       deltapi            atime                      ; TAP BUFFER
     aRvbL       nreverb            aDelL, kRvbTime, kHFDif     ; REVERB IN LOOP
     aDelL       ntrpol             aDelL, aRvbL*iRvbFBLvl, kReverb 
     if ksaturation==1 then
      if changed:k(kClipPoint)==1 then
       reinit RESTART_CLIP1
      endif
      RESTART_CLIP1:
      aDelL      clip               aDelL, 0, i(kClipPoint)    ; OPTIONALLY CLIP THE SIGNAL (B.D.J METHOD)
      rireturn
     endif
     aDelL       tone               aDelL,kHighCut             ; LOWPASS FILTER DELAY TAP
     aDelL       atone              aDelL,kLowCut              ; HIGHPASS FILTER DELAY TAP
     if kFShift!=0 then
      aDelL      FreqShifter        aDelL, kFShift, giSine
     endif
                 delayw             aL_OS+(aDelL*kfeedback)    ; WRITE INPUT AUDIO INTO BUFFER

     ;RIGHT CHANNEL
     if kFShift!=0 then
      aInR      FreqShifter        asigR, kFShift, giSine
     else
      aInR      =                  asigR
     endif
     
     abuf        delayr             10                         ; ESTABLISH DELAY BUFFER
     aDelR       deltapi            atime                      ; TAP BUFFER
     aRvbR       nreverb            aDelR, kRvbTime, kHFDif     ; REVERB IN LOOP
     aDelR       ntrpol             aDelR, aRvbR*iRvbFBLvl, kReverb 
     if ksaturation==1 then
      if changed:k(kClipPoint)==1 then
       reinit RESTART_CLIP2
      endif
      RESTART_CLIP2:
      aDelR      clip               aDelR, 0, i(kClipPoint)    ; OPTIONALLY CLIP THE SIGNAL (B.D.J METHOD)
      rireturn
     endif
     aDelR       tone               aDelR,kHighCut              ; LOWPASS FILTER DELAY TAP
     aDelR       atone              aDelR,kLowCut              ; HIGHPASS FILTER DELAY TAP
     if kFShift!=0 then
      aDelR      FreqShifter        aDelR, kFShift, giSine
     endif
                 delayw             aInR+(aDelR*kfeedback)    ; WRITE INPUT AUDIO INTO BUFFER



     if kSwapChans==1 then ; swapped channels in ping-pong mode
      amixL       ntrpol             asigL,aDelR,kmix          ; MIX DRY AND WET SIGNALS (LEFT CHANNEL)
      amixR       ntrpol             asigR,aDelL+aL_OS,kmix    ; MIX DRY AND WET SIGNALS (RIGHT CHANNEL)
     else
      amixL       ntrpol             asigL,aDelL+aL_OS,kmix     ; MIX DRY AND WET SIGNALS (LEFT CHANNEL)
      amixR       ntrpol             asigR,aDelR,kmix           ; MIX DRY AND WET SIGNALS (RIGHT CHANNEL)     
     endif






    ; STEREO DELAY
    elseif kmode==2 then

     ;LEFT CHANNEL
     abuf        delayr             10                         ; ESTABLISH DELAY BUFFER
     aDelL       deltapi            atime                      ; TAP BUFFER
     aRvbL       nreverb            aDelL, kRvbTime, kHFDif     ; REVERB IN LOOP
     aDelL       ntrpol             aDelL, aRvbL*iRvbFBLvl, kReverb 
     if ksaturation==1 then
      if changed:k(kClipPoint)==1 then
       reinit RESTART_CLIP2
      endif
      RESTART_CLIP2:
      aDelL      clip               aDelL, 0, i(kClipPoint)    ; OPTIONALLY CLIP THE SIGNAL (B.D.J METHOD)
      rireturn
     endif
     aDelL       tone               aDelL,kHighCut              ; LOWPASS FILTER DELAY TAP
     aDelL       atone              aDelL,kLowCut               ; HIGHPASS FILTER DELAY TAP
     if kFShift!=0 then
      aDelL      FreqShifter        aDelL, kFShift, giSine
     endif

                 delayw             asigL+(aDelL*kfeedback)    ; WRITE INPUT AUDIO INTO BUFFER

     ;RIGHT CHANNEL
     abuf        delayr             10                         ; ESTABLISH DELAY BUFFER
     aDelR       deltapi            atime                      ; TAP BUFFER
     aRvbR       nreverb            aDelR, kRvbTime, kHFDif     ; REVERB IN LOOP
     aDelR       ntrpol             aDelR, aRvbR*iRvbFBLvl, kReverb 
     if ksaturation==1 then
      if changed:k(kClipPoint)==1 then
       reinit RESTART_CLIP2
      endif
      RESTART_CLIP2:
      aDelR      clip               aDelR, 0, i(kClipPoint)    ; OPTIONALLY CLIP THE SIGNAL (B.D.J METHOD)
      rireturn
     endif
     aDelR       tone               aDelR,kHighCut              ; LOWPASS FILTER DELAY TAP
     aDelR       atone              aDelR,kLowCut              ; HIGHPASS FILTER DELAY TAP
     if kFShift!=0 then
      aDelR      FreqShifter        aDelR, kFShift, giSine
     endif
                 delayw             asigR+(aDelR*kfeedback)    ; WRITE INPUT AUDIO INTO BUFFER

     amixL       ntrpol             asigL,aDelL,kmix           ; MIX DRY AND WET SIGNALS (LEFT CHANNEL)
     amixR       ntrpol             asigR,aDelR,kmix           ; MIX DRY AND WET SIGNALS (RIGHT CHANNEL)         
     
     
     
    endif
                 outs               amixL*klevel, amixR*klevel ; PING PONG DELAY OUTPUTS ARE SENT OUT
endin
        
</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>