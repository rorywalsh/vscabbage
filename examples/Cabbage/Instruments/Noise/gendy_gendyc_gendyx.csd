
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; gendy_gendyc_gendyx.csd
; Written by Iain McCurdy, 2024

; Encapsulation of Csound's gendy family of opcodes.

; 'gendy', 'gendyc' and 'gendyx' (from 'Génération Dynamique Stochastique' (GENDYN)) are implementations of a dynamic stochastic method of waveform synthesis conceived by Iannis Xenakis.                                                     

; A waveform is generated with modulations of pitch, referred to as perturbations, determined according to their amplitude and duration. 
; Perturbations are governed by a choice of distribution made. 
; The opcodes offer seven distributions to choose from. 
; 1. LINEAR
; 2. CAUCHY
; 3. LOGIST
; 4. HYPERBCOS
; 5. ARCSINE
; 6. EXPON
; 7. SINUS

; Further to the choice of distribution made, a distribution parameter for each modifies it nature.                       

; The range of values from which frequency modulations can be chosen is restricted using the minimum and maximum frequency sliders.                                                     

; 'Initial CPS' (i-rate) sets the maximum number of control points (nodes) in a waveform and 

; 'Number of Points' defines the number of points in a single cycle of the waveform. 
; CAUTION: a combination of higher frequencies and a high number of point can cause the algorithm to explode. Protect your ears and speakers!  

; gendy uses linear interpolation when modulating, 
; gendyc uses cubic interpolation 
; gendyx allows the user to continuously morph between stepped changes, concave curved changes, linear changes (as 'gendy') and convex changes. 

; gendyx rising curves are defined as follows:               
; 0 = stepped                                                
; <1 = concave                                                
; 1 = linear                                                 
; >1 = convex                                                 
; falling curves as:                                           
; 0 = stepped                                                
; <1 = convex                                                 
; 1 = linear                                                 
; >1 = concave                                                

<Cabbage>

form caption("gendy gendyc gendyx"), size(1100,382), pluginId("Gndy"), guiMode("queue"), colour(40,40,40)
#define SLIDER_DESIGN  valueTextBox(1), trackerInsideRadius(0.7), trackerOutsideRadius(1)


image     bounds( 10,10,90,45), colour(200,200,200), outlineThickness(5), outlineColour("black"), corners(5)
{
checkbox  bounds( 5,12, 80, 20), text("On/Off"), channel("OnOff"), fontColour:0(20,20,20), fontColour:1(20,20,20), colour:0(0,75,0), colour:1(50,255,50)
}

image     bounds(110,10,90,45), colour(200,200,200), outlineThickness(5), outlineColour("black"), corners(5)
{
label     bounds(  5, 5,80,12), text("OPCODE"), fontColour(20,20,20)
combobox  bounds(  5,20,80,20), text("gendy","gendyc","gendyx"), channel("Type"), value(1)
}



image    bounds( 10, 65,1080,120), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(5)
{
rslider  bounds( 10, 10, 80,100), text("Amp"), channel("Amp"),  range(0,1,0.1,1,0.001), $SLIDER_DESIGN
label    bounds( 95, 15,140, 13), text("Amplitude Distribution"), align("centre")
combobox bounds( 95, 29,140, 20), items("LINEAR","CAUCHY","LOGIST","HYPERBCOS","ARCSINE","EXPON"),  channel("gendyAmpDist"), value(1)
label    bounds( 95, 55,140, 13), text("Duration Distribution"), align("centre")
combobox bounds( 95, 69,140, 20), items("LINEAR","CAUCHY","LOGIST","HYPERBCOS","ARCSINE","EXPON"),  channel("gendyDurDist"), value(1)
rslider  bounds(250, 10, 80,100), text("Amp Parm Dist."), channel("ADPar"),  range(0.0001,1,0.5,1,0.0001), $SLIDER_DESIGN
rslider  bounds(330, 10, 80,100), text("Dur Parm Dist."), channel("DDPar"),  range(0.0001,1,0.5,1,0.0001), $SLIDER_DESIGN
rslider  bounds(410, 10, 80,100), text("Min Freq."), channel("MinFreq"),  range(1,5000,200,0.5,1), $SLIDER_DESIGN
rslider  bounds(490, 10, 80,100), text("Max Freq."), channel("MaxFreq"),  range(1,5000,300,0.5,1), $SLIDER_DESIGN
rslider  bounds(570, 10, 80,100), text("Amp Scal."), channel("AmpScl"),  range(0,1,1,1,0.001), $SLIDER_DESIGN
rslider  bounds(650, 10, 80,100), text("Dur Scal."), channel("DurScl"),  range(0,1,1,1,0.001), $SLIDER_DESIGN
rslider  bounds(730, 10, 80,100), text("Init CPS"), channel("InitCPS"),  range(1,5000,12,0.5,1), $SLIDER_DESIGN
rslider  bounds(810, 10, 80,100), text("N. Points"), channel("Num"),  range(1,5000,12,0.5,1), $SLIDER_DESIGN
}

image    bounds(900, 75,195,100), colour(0,0,0,0), channel("x"), visible(0) 
{
rslider  bounds(  0,  0, 80,100), text("Curve Up"), channel("xCurveUp"),  range(0,5,2,1,0.001), $SLIDER_DESIGN
rslider  bounds( 80,  0, 80,100), text("Curve Down"), channel("xCurveDown"),  range(0,5,2,1,0.001), $SLIDER_DESIGN
}



image         bounds( 10,190,535,174), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(4)
{
image         bounds(  0,  0,474,174), colour("silver"), corners(4)
signaldisplay bounds(  2,  2,470,170), colour(150,255,150), outlineThickness(2), zoom(-1), alpha(0.85), displayType("waveform"), backgroundColour("Black"), signalVariable("aOsc"), channel("display")
label         bounds(  0,  4,470, 16), text("O S C I L L O S C O P E"), align("centre")
image         bounds(  0, 87,471,  1), colour(255,255,255,100) ; x axis
checkbox      bounds(  4,  4, 15, 15), channel("OscOnOff"), value(1), corners(0), colour:0(0,100,00), colour:1(50,255,50)
rslider       bounds(480, 25, 50, 50), channel("OscGain"), text("GAIN"), range(0,5,1,0.5)
rslider       bounds(480, 95, 50, 50), channel("OscPer"), text("PERIOD"), range(0.001,0.1,0.01,1,0.001)
}

image         bounds(555,190,535,174), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(4)
{
image         bounds(  0,  0,474,174), colour("silver"), corners(4)
signaldisplay bounds(  2,  2,470,170), alpha(1), displayType("spectroscope"), zoom(-1), signalVariable("aSpec"), channel("sscope"), colour("LightBlue"), backgroundColour(20,20,20), fontColour(0,0,0,0)
label         bounds(  0,  4,470, 16), text("S P E C T R O S C O P E"), align("centre")
checkbox      bounds(  4,  4, 15, 15), channel("SpecOnOff"), value(1), corners(0), colour:0(0,100,00), colour:1(50,255,50)
rslider       bounds(480, 25, 50, 50), channel("SpecGain"), text("GAIN"), range(0,50,20,0.5)
rslider       bounds(480, 95, 50, 50), channel("SpecZoom"), text("ZOOM"), range(1,30,4,1,1)
}

label    bounds( 5,366,155, 12), text("Author: Iain McCurdy |2024|"), fontColour("silver"), align("right")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0 --displays
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   16
nchnls             =                   2
0dbfs              =                   1


instr    1
 kOnOff            cabbageGetValue     "OnOff"
 
 kType             cabbageGetValue     "Type"               ; random opcode choice

 kAmp              cabbageGetValue     "Amp"
 kAmpDist          cabbageGetValue     "AmpDist"
 kAmpDist          -=                  1
 kAmpDist          init                0
 kDurDist          cabbageGetValue     "DurDist"
 kDurDist          -=                  1
 kDurDist          init                0
 kADPar            cabbageGetValue     "ADPar"
 kDDPar            cabbageGetValue     "DDPar"
 kMinFreq          cabbageGetValue     "MinFreq"
 kMaxFreq          cabbageGetValue     "MaxFreq"
 kAmpScl           cabbageGetValue     "AmpScl"
 kDurScl           cabbageGetValue     "DurScl"

 kInitCPS          cabbageGetValue     "InitCPS"
 kNum              cabbageGetValue     "Num"

 kxCurveUp         cabbageGetValue     "xCurveUp"
 kxCurveDown       cabbageGetValue     "xCurveDown"

                   cabbageSet          changed:k(kType),"x","visible",kType == 3 ? 1 : 0

 if changed:k(kInitCPS,kNum)==1 then
  reinit RESTART
 endif
 RESTART:
 if kType==1 then               ; gendy
  aOut             gendy              kAmp, kAmpDist, kDurDist, kADPar,  kDDPar, kMinFreq, kMaxFreq, kAmpScl, kDurScl, i(kInitCPS), kNum
  aOutR            gendy              kAmp, kAmpDist, kDurDist, kADPar,  kDDPar, kMinFreq, kMaxFreq, kAmpScl, kDurScl, i(kInitCPS), kNum
 elseif kType==2 then           ; gendyc
  aOut             gendyc             kAmp, kAmpDist, kDurDist, kADPar,  kDDPar, kMinFreq, kMaxFreq, kAmpScl, kDurScl, i(kInitCPS), kNum
  aOutR            gendyc             kAmp, kAmpDist, kDurDist, kADPar,  kDDPar, kMinFreq, kMaxFreq, kAmpScl, kDurScl, i(kInitCPS), kNum
 elseif kType==3 then           ; gendyx
  aOut             gendyx             kAmp, kAmpDist, kDurDist, kADPar,  kDDPar, kMinFreq, kMaxFreq, kAmpScl, kDurScl, kxCurveUp, kxCurveDown, i(kInitCPS), kNum
  aOutR            gendyx             kAmp, kAmpDist, kDurDist, kADPar,  kDDPar, kMinFreq, kMaxFreq, kAmpScl, kDurScl, kxCurveUp, kxCurveDown, i(kInitCPS), kNum
 endif
 rireturn
 
 aOut              *=                  a(kOnOff)
 aOutR             *=                  a(kOnOff)

                   outs                aOut, aOutR
         
; oscilloscope
kOscOnOff          cabbageGetValue     "OscOnOff"
if kOscOnOff==0 goto SKIP_OSC
kOscGain           cabbageGetValue     "OscGain"
kOscPer            cabbageGetValue     "OscPer"
kOscPer            init                0.01
aOsc               =                   aOut * kOscGain

if changed:k(kOscPer)==1 then
                   reinit              RESTART_OSCILLOSCOPE
endif
RESTART_OSCILLOSCOPE:
                   display             aOsc, i(kOscPer)
rireturn
SKIP_OSC:

; spectroscope
kSpecOnOff         cabbageGetValue     "SpecOnOff"
if kSpecOnOff==0 goto SKIP_SPEC
kSpecGain          cabbageGetValue     "SpecGain"
aSpec              =                   aOut * kSpecGain                  ; aSig can't be scaled in the the 'display' line
kSpecZoom          cabbageGetValue     "SpecZoom"
kSpecZoom          init                2

if changed:k(kSpecZoom)==1 then
                   reinit              RESTART_SPECTROSCOPE
endif
RESTART_SPECTROSCOPE:

iWSize             =                   8192
iWType             =                   0 ; (0 = rectangular)
iDBout             =                   0 ; (0 = magnitude, 1 = decibels)
iWaitFlag          =                   0 ; (0 = no wait)
iMin               =                   0
iMax               =                   iWSize / i(kSpecZoom)
                   dispfft             aSpec, 0.001, iWSize, iWType, iDBout, iWaitFlag, iMin, iMax
                   rireturn
SKIP_SPEC:

endin

</CsInstruments>

<CsScore>
i 1 0 z    ;instrument that reads in widget data
</CsScore>

</CsoundSynthesizer>