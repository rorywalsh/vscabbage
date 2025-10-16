
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Ensemble.csd
; Written by Iain McCurdy, 2025.

; An ensemble chorus effect with a user-definable number of layers (voices)

; The following parameters will be randomly modulated for each voice according to a single rate control:
; Pitch/delay time
; Panning location
; Amplitude

; INPUT
; Mono     - left audio input, stereo output using random panning
; Stereo 1 - stereo audio input. Channels handled independently. Random panning not used.
; Stereo 2 - stereo audio input. Channels handled independently. Random panning used so that stereo location of the input will be changed.
; Test     - test the effect with a sawtooth oscillator

; N.Layers - number fop layers/voices
; Rate     - rate of random modulation for all parameters
; Pitch    - amount of pitch modulation
; Pan      - amount of pan location modulation
; Amp      - amount of amplitude modulation (in decibels downwards)

; Dry/Wet  - crossfade between original and chorussed signals
; Level    - output level 

<Cabbage>
form caption("Ensemble") size(785, 160), pluginId("Ense"), guiMode("queue")
#define COLOUR "DarkSlateGrey"
image            bounds(0, 0, 785, 160), colour($COLOUR), shape("rounded"), outlineColour("white"), outlineThickness(2), corners(5)

#define SLIDER_STYLE  textColour("white"), fontColour("white"), colour(37,59,59), trackerColour("Silver"), valueTextBox(1)

label    bounds( 20, 53, 85, 13), text("Input"), fontColour("white")
combobox bounds( 20, 70, 85, 20), items("Mono","Stereo 1","Stereo 2","Test"), value(2), channel("Input")
rslider  bounds(105, 25,110,110), text("N. Layers"), channel("NLayers"), range(1, 100, 30,1,1), $SLIDER_STYLE
button   bounds(215, 10, 70, 15), channel("UpdateRate"), text("UPDATE"), colour:0(20,20,0), colour:1(250,250,100), latched(0)
rslider  bounds(195, 25,110,110), text("Rate"), channel("Rate"), range(0.001,10, 0.2,0.5), $SLIDER_STYLE
image    bounds(315, 15,230,  1), colour("White")
label    bounds(390,  8, 80, 15), text("D E P T H S"), colour($COLOUR), fontColour("White")
rslider  bounds(285, 25,110,110), text("Pitch"), channel("TimDep"), range(0.000,0.1,0.03,1,0.0001), $SLIDER_STYLE
rslider  bounds(375, 25,110,110), text("Pan"), channel("PanDep"), range(0, 0.35, 0.5), $SLIDER_STYLE
rslider  bounds(465, 25,110,110), text("Amp"), channel("AmpDep"), range(0, 24, 0), $SLIDER_STYLE
rslider  bounds(555, 25,110,110), text("Dry/Wet"), channel("Mix"), range(0, 1, 0.5), $SLIDER_STYLE
rslider  bounds(645, 25,110,110), text("Level"), channel("OutAmp"), range(0, 1, 0.5), $SLIDER_STYLE


label    bounds(  5,145,120, 12), text("Iain McCurdy |2025|"), align("left"), fontColour("Silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>
;sr set by host
ksmps  = 32
nchnls = 2
0dbfs  = 1

;Author: Iain McCurdy (2025)
;http://iainmccurdy.org/csound.html


opcode Ensemble, aa, akkkkip
 aIn, kTimDep, kPanDep, kAmpDep, kRate, iNLayers, iCount xin
 
 ; delay time / pitch modulation
 aTim              rspline             0, kTimDep, kRate*0.5, kRate * 2
 aTim              +=                  kTimDep*0.1
 aOut              vdelay              aIn, (aTim + 1/kr)*1000, 1000
 
 ; amplitude modulation
 kAmp              rspline             1, kAmpDep, kRate*0.5, kRate*2
 aOut              *=                  a(kAmp)
 
 ; panning modulation
 kPan              jspline             kPanDep, kRate*0.5, kRate*2
 kPan              +=                  0.5
 aOutL,aOutR       pan2                aOut, kPan
 
 aMixL             =                   0
 aMixR             =                   0
 if iCount<iNLayers then
  aMixL,aMixR      Ensemble            aIn, kTimDep, kPanDep, kAmpDep, kRate, iNLayers, iCount+1
 endif 
                   xout                aOutL + aMixL, aOutR + aMixR
endop




opcode EnsembleMono, a, akkkip
 aIn, kTimDep, kAmpDep, kRate, iNLayers, iCount xin
 
 ; delay time / pitch modulation
 aTim              rspline             0, kTimDep, kRate*0.5, kRate*2
 aTim              +=                  kTimDep*0.1
 aOut              vdelay              aIn, (aTim + 1/kr)*1000, 1000
 
 ; amplitude modulation
 kAmp              rspline             1, kAmpDep, kRate*0.5, kRate*2
 aOut              *=                  a(kAmp)
  
 aMix              =                   0
 if iCount<iNLayers then
  aMix             EnsembleMono        aIn, kTimDep, kAmpDep, kRate, iNLayers, iCount+1
 endif 
                   xout                aOut + aMix
endop



instr 1
 kInput            cabbageGetValue     "Input"
 kUpdateRate       trigger             cabbageGetValue:k("UpdateRate"),0.5,0
 
 kPortTime linseg 0, 0.001, 0.05

 kNLayers          cabbageGetValue     "NLayers"
 kRate             cabbageGetValue     "Rate"
 kRate             portk               kRate, kPortTime
 kTimDep           cabbageGetValue     "TimDep"
 kTimDep           portk               kTimDep, kPortTime
 kPanDep           cabbageGetValue     "PanDep"
 kAmpDep           cabbageGetValue     "AmpDep"
 kMix              cabbageGetValue     "Mix"
 
 if changed:k(kNLayers,kInput,kUpdateRate)==1 then
                   reinit              RESTART
 endif
 RESTART:
 if i(kInput)==1 then ; mono audio input
  aIn1             inch                1
  aOutL,aOutR      Ensemble            aIn1, kTimDep, kPanDep, ampdbfs(-kAmpDep), kRate, i(kNLayers)
  aMixL            ntrpol              aIn1, aOutL, kMix
  aMixR            ntrpol              aIn1, aOutR, kMix
 elseif i(kInput)==2 then
  aIn1,aIn2        ins
  aOutL            EnsembleMono        aIn1, kTimDep, ampdbfs(-kAmpDep), kRate, i(kNLayers)
  aOutR            EnsembleMono        aIn2, kTimDep, ampdbfs(-kAmpDep), kRate, i(kNLayers)
  aMixL            ntrpol              aIn1, aOutL, kMix
  aMixR            ntrpol              aIn2, aOutR, kMix
 elseif i(kInput)==3 then
  aIn1,aIn2        ins
  aOut1L,aOut1R    Ensemble            aIn1, kTimDep, kPanDep, ampdbfs(-kAmpDep), kRate, i(kNLayers)
  aOut2L,aOut2R    Ensemble            aIn2, kTimDep, kPanDep, ampdbfs(-kAmpDep), kRate, i(kNLayers)
  aOutL            sum                 aOut1L, aOut2L
  aOutR            sum                 aOut1R, aOut2R
  aMixL            ntrpol              aIn1, aOutL, kMix
  aMixR            ntrpol              aIn2, aOutR, kMix
 else
  aIn1             vco2                0.1, 100
  aOutL,aOutR      Ensemble            aIn1, kTimDep, kPanDep, ampdbfs(-kAmpDep), kRate, i(kNLayers)
  aMixL            ntrpol              aIn1, aOutL, kMix
  aMixR            ntrpol              aIn1, aOutR, kMix
 endif
 rireturn
 
 kOutAmp           cabbageGetValue     "OutAmp"
 kScl              =                   kNLayers ^ 0.5
 aMixL             *=                  kOutAmp / kScl
 aMixR             *=                  kOutAmp / kScl
                   outs                aMixL, aMixR

endin

</CsInstruments>

<CsScore>                                              
i 1 0 z
</CsScore>

</CsoundSynthesizer>                                                  