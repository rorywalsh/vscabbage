
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Gate.csd
; Written by Iain McCurdy, 2015.

; Two 'Processing Configutions' are available:
;  'Stereo Mixed'       -   the two input channels are mixed before being sent to a single envelope follower. 
;                   Subsequent processing (gating filtering) is still carried out on the stereo input, just the gate open/closed control data will be the same on both channels
;  'Stereo Separate'        -   the two input channels are sent to independent envelope followers. 
;                   Therefore gate open/closed control data for the two channels can differ.  
; Right Channel Sidechain   -   In this mode, the gate is triggered by the signal received in the right channel but the gated signal is the left channel 

; Input signal is sent to an envelope follower and a gate state (open/closed) is assessed according to user defined thresholds.
; Independent thresholds and time durations can be defined for gate opening and closing.

; Pre-filter filters the input signal through a highpass filter and lowpass filter in series. 
; (Note this is only the signal sent into the envelope follower and the signal sent to the actual gate and the then the output is unfiltered.)
; This feature can be used to fine tune gate opening for particular frequency bands. 
; E.G. Opening for a voice singing but not for low frequency rumble picked up through the microphone stand. 

; The 'Filter Gate' can gate the signal using a lowpass filter (either 12 dB/oct or 24 dB/oct). 
; The user sets the 'Min.' (gate closed) and 'Max.' (gate open) cutoff values for the filter (in oct format)

; 'Atten.' sets the amount of amplitude attenuation to be applied.
; 'Delay' delays the audio (after envelope following but before gating is applied)
;   This can be used to recover the attack of a sound, particularly if the attack time of the gate is long.
;   If delay time is zero then the delay is completely bypassed.  
                                                                       
<Cabbage>                                                                                                                   
form caption("Gate"), colour( 20, 20, 30), size(430, 455), pluginId("Gate"), guiMode("queue")

image     bounds(  5, 10,420, 40), shape("sharp"), outlineColour("white"), colour(0,0,0,0), outlineThickness(1)
{
label     bounds( 20, 11,180, 14), fontColour("white"), text("Processing Configuration:"), colour(0,0,0,0), align("right")
combobox  bounds(207,  8,200, 20), channel("InputMode"), text("Stereo Mixed","Stereo Separate","Right Channel Side Chain"), value(1), colour( 70, 70, 70), fontColour("white")
}

image     bounds(  5, 55,207, 90), shape("sharp"), outlineColour("white"), colour(0,0,0,0), outlineThickness(1)
{
label     bounds(  0,  5,207, 12), fontColour("white"), text("On Threshold"), colour(0,0,0,0)
rslider   bounds( 10, 20, 60, 60), range(0,0.1,0.01,0.5,0.0001),  channel("OnThresh"), text("Threshold"), textColour("white"), popupText(0)
nslider   bounds( 65, 31, 45, 25), channel("OnThresh_dB"), range(-90,120,-90,1,0.1)
label     bounds(110, 37, 20, 12), fontColour("white"), text("dB"), colour(0,0,0,0)
rslider   bounds(135, 20, 60, 60), range(0,0.3,0.04,0.5,0.0001),  channel("AttTime"), text("Time"), textColour("white")
}

image     bounds(218, 55,207, 90), shape("sharp"), outlineColour("white"), colour(0,0,0,0), outlineThickness(1)
{
label     bounds(  0,  5,207, 12), fontColour("white"), text("Off Threshold"), colour(0,0,0,0)
rslider   bounds( 10, 20, 60, 60), range(0,0.1,0.007,0.5,0.0001),  channel("OffThresh"), text("Threshold"), textColour("white"), popupText(0)
nslider   bounds( 65, 31, 45, 25), channel("OffThresh_dB"), range(-90,120,-90,1,0.1)
label     bounds(110, 37, 20, 12), fontColour("white"), text("dB"), colour(0,0,0,0)
rslider   bounds(135, 20, 60, 60), range(0,0.3,0.03,0.5,0.0001),  channel("RelTime"), text("Time"), textColour("white")
}

image    bounds(  5,150,420, 50), shape("sharp"), outlineColour("white"), colour(0,0,0,0), outlineThickness(1), plant("PreFilter") {
checkbox bounds( 10, 15, 70, 12), channel("PreFiltOnOff"), text("Pre-Filter"), fontColour("white")
hrange   bounds(  85,  5,330, 20), channel("HPF","LPF"), range(20, 20000, 200:12000, 0.5, 1)
label    bounds(  85, 30,330, 12), text("Highpass / Lowpass"), fontColour("white"), channel("FilterL"), align("centre")
}

image    bounds(  5,205,210, 95), shape("sharp"), outlineColour("white"), colour(0,0,0,0), outlineThickness(1), plant("FilterGate") 
{
label    bounds(  5, 22, 80, 12), text("Filter Gate"), fontColour("white")
combobox bounds(  5, 35, 80, 20), channel("FilterGate"), text("Bypass","12 dB/Oct","24 dB/Oct"), value(1)
rslider  bounds( 75,  5, 80, 80), range(2,14,2,0.5,0.01),  channel("FiltGateMin"), text("Min"), textColour("white"), textBox(1), valueTextBox(1)
rslider  bounds(135,  5, 80, 80), range(2,14,14,0.5,0.01),  channel("FiltGateMax"), text("Max"), textColour("white"), textBox(1), valueTextBox(1)
label    bounds(  5, 84,120,  9), text("Iain McCurdy |2015|"), align("left"), fontColour("white")
}

image    bounds(220,205,205, 95), shape("sharp"), outlineColour("white"), colour(0,0,0,0), outlineThickness(1), plant("Master") {
checkbox bounds( 14, 30, 15, 13), channel("GateIndicOp"), shape("ellipse"), colour( 50,255, 50), active(0)
checkbox bounds( 14, 50, 15, 13), channel("GateIndicCl"), shape("ellipse"), colour(255, 50, 50), value(1), active(0)
rslider  bounds( 20,  5, 80, 80), range(0,90,90,0.5,0.1),  channel("Atten"), text("Atten."), textColour("white"), textBox(1), valueTextBox(1)
rslider  bounds( 75,  5, 80, 80), range(0,0.1,0,0.8,0.001),  channel("DelTim"), text("Delay"), textColour("white"), textBox(1), valueTextBox(1)
rslider  bounds(130,  5, 80, 80), range(0,2,1,0.5,0.01),  channel("Gain"), text("Gain"), textColour("white"), textBox(1), valueTextBox(1)
}

gentable bounds( 10,305,410, 90), channel("BeforeGraph"), tableNumber(1), tableColour(100,100,255), tableBackgroundColour(150,150,150), ampRange(0,1,1), fill(0), outlineThickness(1), tableGridColour(0,0,0,0)
gentable bounds( 10,305,410, 90), channel("AfterGraph"), tableNumber(2), tableColour( 0,255,0), tableBackgroundColour(0,0,0,0), tableGridColour(0,0,0,0), ampRange(0,1,2), fill(0), outlineThickness(1)
image    bounds( 10,305,  1, 90), channel("indic"), colour(0,0,0,100)

image    bounds( 10,415, 30,  1), colour(100,100,255)
image    bounds( 10,435, 30,  1), colour( 0,255,0)
label    bounds( 45,408, 90, 14), text("Input Signal"), align("left")
label    bounds( 45,428, 90, 14), text("Output Signal"), align("left")
checkbox bounds(180,420,100, 12), text("Graph On/Off") value(1), channel("GraphOnOff"), colour:0(0,70,0), colour:1(100,255,100)
rslider  bounds(300,400, 50, 50), range(1,100,1,0.5),  channel("YScale"), text("Scale"), textColour("white")
rslider  bounds(360,400, 50, 50), range(1,9,2,0.5),  channel("Warp"), text("Warp"), textColour("white")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n
</CsOptions>

<CsInstruments>

;sr is set by host
ksmps              =                   32
nchnls             =                   2
0dbfs              =                   1

; Author: Iain McCurdy (2015)


; tables for display graphs
iTabSize           =                   410
giBeforeGraph      ftgen               1, 0, iTabSize, -2, 0
giAfterGraph       ftgen               2, 0, iTabSize, -2, 0

instr   1
 ; READ IN WIDGETS
 kOnThresh         cabbageGetValue     "OnThresh"
 kOffThresh        cabbageGetValue     "OffThresh"
                   cabbageSetValue     "OnThresh_dB", dbfsamp(kOnThresh), changed:k(kOnThresh)
                   cabbageSetValue     "OffThresh_dB", dbfsamp(kOffThresh), changed:k(kOffThresh)
 kAttTime          cabbageGetValue     "AttTime"
 kRelTime          cabbageGetValue     "RelTime"
 kAtten            cabbageGetValue     "Atten"
 kGain             cabbageGetValue     "Gain"
 kFilterGate       cabbageGetValue     "FilterGate"
 kFiltGateMin      cabbageGetValue     "FiltGateMin"
 kFiltGateMax      cabbageGetValue     "FiltGateMax"
 kInputMode        cabbageGetValue     "InputMode"
 kHPF              cabbageGetValue     "HPF"
 kLPF              cabbageGetValue     "LPF"
 kPreFiltOnOff     cabbageGetValue     "PreFiltOnOff"
 kDelTim           cabbageGetValue     "DelTim"
 
 kporttime         linseg              0, 0.001, 0.05
 kGain             portk               kGain, kporttime

 ; INPUT
 aInL,aInR         ins

 aOutL             =                   aInL  
 aOutR             =                   aInR
 
 
 ; SHOW OR HIDE PRE-FILTER SLIDERS
 if kPreFiltOnOff==1 then
                   cabbageSet          changed(kPreFiltOnOff), "HPF", "visible", 1
                   cabbageSet          changed(kPreFiltOnOff), "FilterL", "visible", 1
 else
                   cabbageSet          changed(kPreFiltOnOff), "HPF", "visible", 0
                   cabbageSet          changed(kPreFiltOnOff), "FilterL", "visible", 0
 endif
  
 ; STEREO MIX MODE
 if kInputMode==1 then
 
  aDtkMix          sum                 aInL, aInR      ; mix left and right inputs

  if kPreFiltOnOff==1 then                             ; if pre-filter switch is on...
   aDtkMix         buthp               aDtkMix, kHPF   ; highpass filter
   aDtkMix         buthp               aDtkMix, kHPF   ; and again to steepen slope
   aDtkMix         butlp               aDtkMix, kLPF   ; lowpass filter
   aDtkMix         butlp               aDtkMix, kLPF   ; and again to steepen slope
  endif

  kRMS             rms                 aDtkMix         ; scan rms of input signal

  ; OPEN AND CLOSE GATE
  kGate            init                1
  if kRMS<kOffThresh && kGate==1 then                ; toggle gate closed
   kGate           =                   0
  elseif kRMS>=kOnThresh && kGate==0 then            ; toggle gate open
   kGate           =                   1
  endif
  
  ; TURN GATE STATUS INDICATORS ON AND OFF
                   cabbageSetValue     "GateIndicCl", 1 - kGate, changed(kGate)
                   cabbageSetValue     "GateIndicOp", kGate, changed(kGate)
   
  ; SMOOTH GATE OPENING AND CLOSING (CALL UDO)
  kGateD           lagud               kGate, kAttTime, kRelTime   ; smooth opening and closing
  
  ; AMPLITUDE GATE
  kGateDA          scale               kGateD, 1, ampdb(-kAtten)   ; modify gating function according to user defined attenuation setting
  aGate            interp              kGateDA                     ; create an arate version (smoother)
      
  ; DELAY
  if kDelTim>0 then
   aOutL           vdelay              aOutL, kDelTim*1000, 100
   aOutR           vdelay              aOutR, kDelTim*1000, 100
  endif
   
  ; APPLY GATE
  aOutL            *=                  aGate
  aOutR            *=                  aGate
  
  ; FILTER GATE
  if kFilterGate>1 then             
   kcfoct          scale               kGateD,kFiltGateMax,kFiltGateMin
   acf             interp              cpsoct(kcfoct)
   if kFilterGate==2 then
    aOutL          tone                aOutL, acf
    aOutR          tone                aOutR, acf
   else
    aOutL          butlp               aOutL, acf
    aOutR          butlp               aOutR, acf
   endif
  endif                
  
 ; STEREO SEPARATE MODE
 elseif kInputMode==2 then
 
 aDtkL             =                   aInL
 aDtkR             =                   aInR

  if kPreFiltOnOff==1 then
   aDtkL           buthp               aDtkL, kHPF
   aDtkL           buthp               aDtkL, kHPF
   aDtkL           butlp               aDtkL, kLPF
   aDtkL           butlp               aDtkL, kLPF
   aDtkR           buthp               aDtkR, kHPF
   aDtkR           buthp               aDtkR, kHPF
   aDtkR           butlp               aDtkR, kLPF
   aDtkR           butlp               aDtkR, kLPF
  endif

  kRMSL            rms                 aDtkL*2
  kRMSR            rms                 aDtkR*2

  kGateL,kGateR    init                1

  if kRMSL < kOffThresh && kGateL ==1 then
   kGateL          =                   0
  elseif kRMSL >= kOnThresh && kGateL == 0 then
   kGateL          =                   1
  endif

  if kRMSR < kOffThresh && kGateR ==1 then
   kGateR          =                   0
  elseif kRMSR >= kOnThresh && kGateR == 0 then
   kGateR          =                   1
  endif
  
  if changed(kGateL)==1 then
                   cabbageSetValue     "GateIndicCl", 1 - kGateL
                   cabbageSetValue     "GateIndicOp", kGateL
  endif
   
  kGateDL          lagud               kGateL, kAttTime, kRelTime  ; smooth opening and closing
  kGateDR          lagud               kGateR, kAttTime, kRelTime  ; smooth opening and closing
  
  kGateDAL         scale               kGateDL, 1, ampdb(-kAtten)
  kGateDAR         scale               kGateDR, 1, ampdb(-kAtten)
  
  aGateL           interp              kGateDAL
  aGateR           interp              kGateDAR
   
  ; DELAY
  if kDelTim>0 then
   aOutL           vdelay              aInL, kDelTim * 1000, 100
   aOutR           vdelay              aInR, kDelTim * 1000, 100
  endif
   
  ; APPLY GATE
  aOutL            *=                  aGateL
  aOutR            *=                  aGateR
  
  if kFilterGate>1 then
   kcfoctL         scale               kGateDL, kFiltGateMax, kFiltGateMin
   kcfoctR         scale               kGateDR, kFiltGateMax, kFiltGateMin
   acfL            interp              cpsoct(kcfoctL)
   acfR            interp              cpsoct(kcfoctR)
   if kFilterGate==2 then
    aOutL          tone                aOutL, acfL
    aOutR          tone                aOutR, acfR
   else
    aOutL          butlp               aOutL, acfL
    aOutR          butlp               aOutR, acfR
   endif
  endif

 ; Right Channel Side Chain
 else
 
  if kPreFiltOnOff==1 then                                            ; if pre-filter switch is on...
   aDtkR           buthp               aInR, kHPF                     ; highpass filter
   aDtkR           buthp               aDtkR, kHPF                    ; and again to steepen slope
   aDtkR           butlp               aDtkR, kLPF                    ; lowpass filter
   aDtkR           butlp               aDtkR, kLPF                    ; and again to steepen slope
  endif


  kRMS             rms                 aDtkR                          ; scan rms of input signal

  ; OPEN AND CLOSE GATE
  kGate            init                1
  if kRMS < kOffThresh && kGate ==1 then
   kGate           =                   0
  elseif kRMS >= kOnThresh && kGate == 0 then
   kGate           =                   1
  endif
  
  ; TURN GATE STATUS INDICATORS ON AND OFF
  if changed(kGate)==1 then
                   cabbageSetValue     "GateIndicCl", 1 - kGate
                   cabbageSetValue     "GateIndicOp", kGate
  endif
   
  ; SMOOTH GATE OPENING AND CLOSING (CALL UDO)
  kGateD           lagud               kGate, kAttTime, kRelTime   ; smooth opening and closing
  
  ; AMPLITUDE GATE
  kGateDA          scale               kGateD,1,ampdb(-kAtten)     ; modify gating function according to user defined attenuation setting
  aGate            interp              kGateDA                     ; create an arate version (smoother)
    
  ; DELAY
  if kDelTim>0 then
   aOutL           vdelay              aInL, kDelTim*1000, 100
  endif
   
  ; APPLY GATE
  aOutL            *=                  aGate
  
  ; FILTER GATE
  if kFilterGate>1 then             
   kcfoct          scale               kGateD, kFiltGateMax, kFiltGateMin
   acf             interp              cpsoct(kcfoct)
   if kFilterGate==2 then
    aOutL          tone                aOutL, acf
   else
    aOutL          butlp               aOutL, acf
   endif
  endif
  aOutR            =                   aOutL

 endif
                   outs                aOutL * kGain, aOutR * kGain
                
 ; meters
 kGraphOnOff        cabbageGetValue "GraphOnOff"
 if kGraphOnOff==0 goto SKIP
 kYScale           cabbageGetValue     "YScale"
 kWarp             cabbageGetValue     "Warp"
 krmsIn            rms                 aInL + aInR
 krmsIn            pow                 krmsIn, 1/kWarp
 krmsOut           rms                 aOutL + aOutR
 krmsOut           pow                 krmsOut, 1/kWarp
 kptr              phasor              0.1 
                   tablew              krmsIn*kYScale, kptr, 1, 1
                   tablew              krmsOut*kYScale, kptr, 2, 1
 kclock            metro               16
                   cabbageSet          kclock, "BeforeGraph", "tableNumber", 1              ; update GUI gentable
                   cabbageSet          kclock, "AfterGraph", "tableNumber", 2               ; update GUI gentable
                   cabbageSet          kclock, "indic", "bounds", 10 + kptr*410, 305, 1, 90 ; update write position indicator
 SKIP:
endin

</CsInstruments>

<CsScore>
i 1 0 [3600*24*7]
</CsScore>

</CsoundSynthesizer>