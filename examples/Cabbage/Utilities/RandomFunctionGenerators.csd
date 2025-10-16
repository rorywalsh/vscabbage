
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; RandomFunctionGenerators.csd
; Written by Iain McCurdy 2015

; Demonstration of the following opcodes for generating contiguous random functions:
; randomi randomh rspline jspline jitter jitter2 vibr vibrato gaussi trandom cauchyi exprandi gendy gendyc gendyx
; For additional information on each indivdual opcode, please refer to the Csound manual.

; Running minimum and maximum values are logged (even if thes exceed the viewable graph) but these can be reset using the 'RESET MIN/MAX' button.
; It will be noticed that rspline can output values beyond the maximum allowed amplitude limits (-1 and 1)

; The functions can be sonified through how they vary the frequency of an sine wave oscillator by activating the 'Sound' button.

; The parameters pertaining to each opcode will appear in the second row of number boxes as different opcodes are chosen from the 'OPCODE' drop-down menu.

; The 'FILTER' drop-down menu and 'Time' control can be used to explore the effects of applying a filter 
;  to the function that emerges from the random function opcode currently chosen.

<Cabbage>
form caption("Random Function Generators"), size(960, 335), pluginId("RaFu"), colour(45,45,50), guiMode("queue")

#define RSLIDER_DESIGN trackerColour("silver")

image     bounds(  5,  0,960,200), colour(0,0,0,0), plant("Table")
gentable  bounds(  0,  0,960,150), channel("table1"), tableNumber(1), tableColour("LightBlue"), fill(0), alpha(1), ampRange(-1,1,1), zoom(-1), tableBackgroundColour(50,50,50), tableGridColour(100,100,100,50)
image     bounds(  0,  0,  1,150), channel("wiper")
image     bounds(  0, 75,960,  1), colour(150,150,150)
nslider   bounds(  0,155,90,35), text("Rate of Updates"), channel("ROU"), range(1,256,64,1,1)
nslider   bounds( 95,155,90,35), text("Current Value"), channel("CurVal"), range(-10,10,0,1,0.001)
nslider   bounds(190,155,90,35), text("Maximum so far"), channel("Max"), range(-10,10,0,1,0.001)
nslider   bounds(285,155,90,35), text("Minimum so far"), channel("Min"), range(-10,10,0,1,0.001)
button    bounds(380,160,100,30), text("RESET MIN/MAX","RESET MIN/MAX"), channel("Reset"), latched(0), colour:0(70,70,70), colour:1(170,170,170), fontColour:0(150,150,150)

checkbox  bounds(490,165,60,15), text("Sound"), channel("SoundOnOff"), colour("yellow")
label     bounds(548,152,40,11), text("Amp"), align("centre")
rslider   bounds(550,166,40,40), channel("SoundAmp"), range(0,1,0.3,0.5,0.001), $RSLIDER_DESIGN

image     bounds( 10,264,140,55), colour(0,0,0,0), outlineThickness(1), outlineColour(200,200,200), shape("sharp") {
label     bounds( 5, 4,80,12), text("FILTER")
combobox  bounds( 5, 16,80,20), text("none","port","lineto"), channel("Filter"), value(1)
label     bounds( 98, 2, 30,11), text("Time"), align("centre")
rslider   bounds( 95, 11,40,40), channel("Time"), range(0,1,0.1,0.5,0.001), $RSLIDER_DESIGN
}

image     bounds(  8,206,84,40)
label     bounds( 10,208,80,12), text("OPCODE"), fontColour("black")
combobox  bounds( 10,220,80,20), text("randomi","randomh","rspline","jspline","jitter","jitter2","vibr","vibrato","gaussi","trandom","cauchyi","exprandi","gendy","gendyc","gendyx"), channel("Type"), value(1)

image     bounds( 95,210,300, 60), colour(0,0,0,0), channel("randomi") {
nslider bounds(  0,  0,90,30), text("Amp.1"), channel("randomiAmp1"),    range(-1,1,-1,1,0.001)
nslider bounds( 90,  0,90,30), text("Amp.2"), channel("randomiAmp2"),    range(-1,1,1,1,0.001)
nslider bounds(180,  0,90,30), text("Freq"),  channel("randomiFreq"),    range(0.001,16,1,1,0.001)
}
image     bounds( 95,210,600, 60), colour(0,0,0,0), channel("randomh") {
nslider bounds(  0,  0,90,30), text("Amp.1"), channel("randomhAmp1"),    range(-1,1,-1,1,0.001)
nslider bounds( 90,  0,90,30), text("Amp.2"), channel("randomhAmp2"),    range(-1,1,1,1,0.001)
nslider bounds(180,  0,90,30), text("Freq"),  channel("randomhFreq"),    range(0.001,16,1,1,0.001)
}
image     bounds( 95,210,600, 60), colour(0,0,0,0), channel("rspline") {
nslider bounds(  0,  0,90,30), text("Amp.1"),  channel("rsplineAmp1"),     range(-1,1,-1,1,0.001)
nslider bounds( 90,  0,90,30), text("Amp.2"),  channel("rsplineAmp2"),     range(-1,1,1,1,0.001)
nslider bounds(180,  0,90,30), text("Freq.1"), channel("rsplineFreq1"),    range(0.001,16,1,1,0.001)
nslider bounds(270,  0,90,30), text("Freq.2"), channel("rsplineFreq2"),    range(0.001,16,1,1,0.001)
}
image     bounds( 95,210,600, 60), colour(0,0,0,0), channel("jspline") {
nslider bounds(  0,  0,90,30), text("Amp"),    channel("jsplineAmp"),     range(-1,1,1,1,0.001)
nslider bounds( 90,  0,90,30), text("Freq.1"), channel("jsplineFreq1"),    range(0.001,16,1,1,0.001)
nslider bounds(180,  0,90,30), text("Freq.2"), channel("jsplineFreq2"),    range(0.001,16,1,1,0.001)
}
image     bounds( 95,210,600, 60), colour(0,0,0,0), channel("jitter") {
nslider bounds(  0,  0,90,30), text("Amp"),    channel("jitterAmp"),      range(-1,1,1,1,0.001)
nslider bounds( 90,  0,90,30), text("Freq.1"), channel("jitterFreq1"),    range(0.001,16,1,1,0.001)
nslider bounds(180,  0,90,30), text("Freq.2"), channel("jitterFreq2"),    range(0.001,16,1,1,0.001)
}
image   bounds( 95,210,700, 60), colour(0,0,0,0), channel("jitter2") {
nslider bounds(  0,  0,90,30), text("Total Amp."), channel("jitter2TotAmp"),  range(-1,1,0.5,1,0.001)
nslider bounds( 90,  0,90,30), text("Amp.1"),      channel("jitter2Amp1"),    range(-1,1,0.5,1,0.001)
nslider bounds(180,  0,90,30), text("Freq.1"),     channel("jitter2Freq1"),   range(0.001,16,1,1,0.001)
nslider bounds(270,  0,90,30), text("Amp.2"),      channel("jitter2Amp2"),    range(-1,1,0.5,1,0.001)
nslider bounds(360,  0,90,30), text("Freq.2"),     channel("jitter2Freq2"),   range(0.001,16,1,1,0.001)
nslider bounds(450,  0,90,30), text("Amp.3"),      channel("jitter2Amp3"),    range(-1,1,1,1,0.001)
nslider bounds(540,  0,90,30), text("Freq.3"),     channel("jitter2Freq3"),   range(0.001,16,1,1,0.001)
}
image   bounds( 95,210,700, 60), colour(0,0,0,0), channel("vibr") {
nslider bounds(  0,  0,90,30), text("Av.Amp"),        channel("vibrAvAmp"),        range(-1,1,.3,1,0.001)
nslider bounds( 90,  0,90,30), text("Av.Freq"),       channel("vibrAvFreq"),       range(0.1,16,1,1,0.001)
combobox bounds(180, 14,70,17), text("sine","triangle","square","exp","gauss.1","gauss.2","Bi-gauss"), value(1), channel("WaveShape")
}
image   bounds( 95,210,800, 60), colour(0,0,0,0), channel("vibrato") {
nslider bounds(  0,  0,90,30), text("Av.Amp"),  channel("vibratoAvAmp"),          range(-1,1,.3,1,0.001)
nslider bounds( 90,  0,90,30), text("Av.Freq"), channel("vibratoAvFreq"),         range(0.1,16,1,1,0.001)
nslider bounds(180,  0,90,30), text("Rand.Dev.Amp."), channel("vibratoRandAmountAmp"),  range(0,1,1,1,0.001)
nslider bounds(270,  0,90,30), text("Rand.Dev.Frq."), channel("vibratoRandAmountFreq"), range(0.001,16,1,1,0.001)
nslider bounds(360,  0,90,30), text("Amp.Min.Rate"), channel("vibratoAmpMinRate"),     range(0.001,16,1,1,0.001)
nslider bounds(450,  0,90,30), text("Amp.Max.Rate"), channel("vibratoAmpMaxRate"),     range(0.001,16,1,1,0.001)
nslider bounds(540,  0,90,30), text("Frq.Min.Rate"), channel("vibratoCpsMinRate"),     range(0.001,16,1,1,0.001)
nslider bounds(630,  0,90,30), text("Frq.Max.Rate"), channel("vibratoCpsMaxRate"),     range(0.001,16,1,1,0.001)
combobox bounds(720, 14,70,17), text("sine","triangle","square","exp","gauss.1","gauss.2","Bi-gauss"), value(1), channel("WaveShape2")
}
image   bounds( 95,210,800, 60), colour(0,0,0,0), channel("gaussi") {
nslider bounds(  0,  0,90,30), text("Amp."),  channel("gaussiRange"),          range(0,1,.3,1,0.001)
nslider bounds( 90,  0,90,30), text("Range"), channel("gaussiAmp"),         range(0,1,1,1,0.001)
nslider bounds(180,  0,90,30), text("Freq."), channel("gaussiCps"),  range(0,100,5,1,0.001)
}
image     bounds( 95,210,800, 60), colour(0,0,0,0), channel("trandom") 
{
nslider bounds(  0,  0,90,30), text("Min"), channel("trandomMin"),         range(0,1,-1,1,0.001)
nslider bounds( 90,  0,90,30), text("Max"), channel("trandomMax"),         range(0,1, 1,1,0.001)
label     bounds(180,10,150,14), text("Tap your microphone!"), align("centre"), fontColour("white")
}
image     bounds( 95,210,800, 60), colour(0,0,0,0), channel("cauchyi") 
{
nslider bounds(  0,  0,90,30), text("Lambda"), channel("cauchyiLambda"),  range(0,100,1.5,1,0.001)
nslider bounds( 90,  0,90,30), text("Amp"), channel("cauchyiAmp"),         range(0,10, 1.5,1,0.001)
nslider bounds(180,  0,90,30), text("Rate"), channel("cauchyiCPS"),        range(0.1,100, 10,1,0.001)
}
image     bounds( 95,210,800, 60), colour(0,0,0,0), channel("exprandi") 
{
nslider bounds(  0,  0,90,30), text("Lambda"), channel("exprandiLambda"),  range(0,1,0.1,1,0.001)
nslider bounds( 90,  0,90,30), text("Amp"), channel("exprandiAmp"),         range(0,10, 1,1,0.001)
nslider bounds(180,  0,90,30), text("Rate"), channel("exprandiCPS"),        range(0.1,100, 10,1,0.001)
}
image     bounds( 95,210,850, 60), colour(0,0,0,0), channel("gendy") 
{
nslider  bounds(  0,  0,90,30), text("Amp"), channel("gendyAmp"),  range(0,1,0.5,1,0.001)
label    bounds( 90,  0,90,10), text("Amp Distr."), align("centre")
combobox bounds( 90, 10,90,20), items("LINEAR","CAUCHY","LOGIST","HYPERBCOS","ARCSINE","EXPON"),  channel("gendyAmpDist"), value(1)
label    bounds(185,  0,90,10), text("Dur Distr."), align("centre")
combobox bounds(185, 10,90,20), items("LINEAR","CAUCHY","LOGIST","HYPERBCOS","ARCSINE","EXPON"),  channel("gendyDurDist"), value(1)
nslider  bounds(280,  0,90,30), text("Amp Parm Dist."), channel("gendyADPar"),  range(0.0001,1,0.5,1,0.0001)
nslider  bounds(375,  0,90,30), text("Dur Parm Dist."), channel("gendyDDPar"),  range(0.0001,1,0.5,1,0.0001)
nslider  bounds(470,  0,90,30), text("Min Freq."), channel("gendyMinFreq"),  range(0.1,100,2,1,0.1)
nslider  bounds(565,  0,90,30), text("Max Freq."), channel("gendyMaxFreq"),  range(0.1,100,8,1,0.1)
nslider  bounds(660,  0,90,30), text("Amp Scal."), channel("gendyAmpScl"),  range(0,1,1,1,0.001)
nslider  bounds(755,  0,90,30), text("Dur Scal."), channel("gendyDurScl"),  range(0,1,1,1,0.001)
}
image     bounds( 95,210,850, 60), colour(0,0,0,0), channel("gendyc") 
{
nslider  bounds(  0,  0,90,30), text("Amp"), channel("gendycAmp"),  range(0,1,0.3,1,0.001)
label    bounds( 90,  0,90,10), text("Amp Distr."), align("centre")
combobox bounds( 90, 10,90,20), items("LINEAR","CAUCHY","LOGIST","HYPERBCOS","ARCSINE","EXPON"),  channel("gendycAmpDist"), value(1)
label    bounds(185,  0,90,10), text("Dur Distr."), align("centre")
combobox bounds(185, 10,90,20), items("LINEAR","CAUCHY","LOGIST","HYPERBCOS","ARCSINE","EXPON"),  channel("gendycDurDist"), value(1)
nslider  bounds(280,  0,90,30), text("Amp Parm Dist."), channel("gendycADPar"),  range(0.0001,1,0.5,1,0.0001)
nslider  bounds(375,  0,90,30), text("Dur Parm Dist."), channel("gendycDDPar"),  range(0.0001,1,0.5,1,0.0001)
nslider  bounds(470,  0,90,30), text("Min Freq."), channel("gendycMinFreq"),  range(0.1,100,2,1,0.1)
nslider  bounds(565,  0,90,30), text("Max Freq."), channel("gendycMaxFreq"),  range(0.1,100,8,1,0.1)
nslider  bounds(660,  0,90,30), text("Amp Scal."), channel("gendycAmpScl"),  range(0,1,1,1,0.001)
nslider  bounds(755,  0,90,30), text("Dur Scal."), channel("gendycDurScl"),  range(0,1,1,1,0.001)
}
image     bounds( 95,210,850, 60), colour(0,0,0,0), channel("gendyx") 
{
nslider  bounds(  0,  0,90,30), text("Amp"), channel("gendyxAmp"),  range(0,1,0.8,1,0.001)
label    bounds( 90,  0,90,10), text("Amp Distr."), align("centre")
combobox bounds( 90, 10,90,20), items("LINEAR","CAUCHY","LOGIST","HYPERBCOS","ARCSINE","EXPON"),  channel("gendyxAmpDist"), value(1)
label    bounds(185,  0,90,10), text("Dur Distr."), align("centre")
combobox bounds(185, 10,90,20), items("LINEAR","CAUCHY","LOGIST","HYPERBCOS","ARCSINE","EXPON"),  channel("gendyxDurDist"), value(1)
nslider  bounds(280,  0,90,30), text("Amp Parm Dist."), channel("gendyxADPar"),  range(0.0001,1,0.5,1,0.0001)
nslider  bounds(375,  0,90,30), text("Dur Parm Dist."), channel("gendyxDDPar"),  range(0.0001,1,0.5,1,0.0001)
nslider  bounds(470,  0,90,30), text("Min Freq."), channel("gendyxMinFreq"),  range(0.1,100,2,1,0.1)
nslider  bounds(565,  0,90,30), text("Max Freq."), channel("gendyxMaxFreq"),  range(0.1,100,8,1,0.1)
nslider  bounds(660,  0,90,30), text("Amp Scal."), channel("gendyxAmpScl"),  range(0,1,1,1,0.001)
nslider  bounds(755,  0,90,30), text("Dur Scal."), channel("gendyxDurScl"),  range(0,1,1,1,0.001)
nslider  bounds(660, 30,90,30), text("Curve Up"), channel("gendyxCurveUp"),  range(0,5,2,1,0.001)
nslider  bounds(755, 30,90,30), text("Curve Down"), channel("gendyxCurveDown"),  range(0,5,2,1,0.001)
}


label    bounds( 10,321,110, 12), text("Iain McCurdy |2015|"), align("left"), fontColour("silver")

</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 10   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls = 2    ; NUMBER OF CHANNELS (1=MONO)
0dbfs  = 1    ; MAXIMUM AMPLITUDE

giTableWidth       =                   960                                 ; width of the table (in pixels)
giTableOffset      =                   5                                   ; table offset (in pixels)
giFunc             ftgen               1,0,2048,-10,0                      ; storage for the streams of random data
giSine             ftgen               2,0,2048,10,1                       ; sine wave
giTri              ftgen               3,0,2048,7,0,512,1,1024,-1,512,0    ; triangular wave
giSqu              ftgen               4,0,2048,7,1,1024,1,0,-1,1024,-1    ; square wave
giExp              ftgen               5,0,2048,19,0.5,0.5,270,0.5         ; exponential curve
giGauss1           ftgen               6,0,2048,20,6,1,1                   ; gaussian window shape
giGauss2           ftgen               7,0,2048,20,6,1,0.25                ; gaussian window shape (sharper)
giBiGauss          ftgen               8,0,2048,10,1
iCount             =                   0
while iCount<ftlen(giBiGauss) do
 iVal              table               iCount, giBiGauss
                   tablew              iVal^16 * (iVal<0?-1:1), iCount, giBiGauss
 iCount            +=                  1
od

instr    1
 kROU                   cabbageGetValue    "ROU"                ; rate of updates
 kType                  cabbageGetValue    "Type"               ; random opcode choice
 kReset                 cabbageGetValue    "Reset"
 krandomiAmp1           cabbageGetValue    "randomiAmp1"        ; randomi
 krandomiAmp2           cabbageGetValue    "randomiAmp2"
 krandomiFreq           cabbageGetValue    "randomiFreq"
 krandomhAmp1           cabbageGetValue    "randomhAmp1"        ; randomh
 krandomhAmp2           cabbageGetValue    "randomhAmp2"
 krandomhFreq           cabbageGetValue    "randomhFreq"
 krsplineAmp1           cabbageGetValue    "rsplineAmp1"        ; rspline
 krsplineAmp2           cabbageGetValue    "rsplineAmp2"
 krsplineFreq1          cabbageGetValue    "rsplineFreq1"
 krsplineFreq2          cabbageGetValue    "rsplineFreq2"
 kjsplineAmp            cabbageGetValue    "jsplineAmp"         ; jspline
 kjsplineFreq1          cabbageGetValue    "jsplineFreq1"
 kjsplineFreq2          cabbageGetValue    "jsplineFreq2"
 kjitterAmp             cabbageGetValue    "jitterAmp"          ; jitter
 kjitterFreq1           cabbageGetValue    "jitterFreq1"
 kjitterFreq2           cabbageGetValue    "jitterFreq2"
 kjitter2TotAmp         cabbageGetValue    "jitter2TotAmp"      ; jitter2
 kjitter2Amp1           cabbageGetValue    "jitter2Amp1"
 kjitter2Freq1          cabbageGetValue    "jitter2Freq1"
 kjitter2Amp2           cabbageGetValue    "jitter2Amp2"
 kjitter2Freq2          cabbageGetValue    "jitter2Freq2"
 kjitter2Amp3           cabbageGetValue    "jitter2Amp3"
 kjitter2Freq3          cabbageGetValue    "jitter2Freq3"
 kvibrAvAmp             cabbageGetValue    "vibrAvAmp"          ; vibr
 kvibrAvFreq            cabbageGetValue    "vibrAvFreq"
 kWaveShape             cabbageGetValue    "WaveShape"
 kvibratoAvAmp          cabbageGetValue    "vibratoAvAmp"       ; vibrato
 kvibratoAvFreq         cabbageGetValue    "vibratoAvFreq"
 kvibratoRandAmountAmp  cabbageGetValue    "vibratoRandAmountAmp"
 kvibratoRandAmountFreq cabbageGetValue    "vibratoRandAmountFreq"
 kvibratoAmpMinRate     cabbageGetValue    "vibratoAmpMinRate"
 kvibratoAmpMaxRate     cabbageGetValue    "vibratoAmpMaxRate"
 kvibratoCpsMinRate     cabbageGetValue    "vibratoCpsMinRate"
 kvibratoCpsMaxRate     cabbageGetValue    "vibratoCpsMaxRate"
 kgaussiRange           cabbageGetValue    "gaussiRange"
 kgaussiAmp             cabbageGetValue    "gaussiAmp"
 kgaussiCps             cabbageGetValue    "gaussiCps"
 kWaveShape2            cabbageGetValue    "WaveShape2"

 ktrandomMin            cabbageGetValue    "trandomMin"
 ktrandomMax            cabbageGetValue    "trandomMax"

 kcauchyiLambda         cabbageGetValue    "cauchyiLambda"
 kcauchyiAmp            cabbageGetValue    "cauchyiAmp"
 kcauchyiCPS            cabbageGetValue    "cauchyiCPS"

 kexprandiLambda        cabbageGetValue    "exprandiLambda"
 kexprandiAmp           cabbageGetValue    "exprandiAmp"
 kexprandiCPS           cabbageGetValue    "exprandiCPS"

 kgendyAmp              cabbageGetValue    "gendyAmp"
 kgendyAmpDist          cabbageGetValue    "gendyAmpDist"
 kgendyAmpDist          -=                 1
 kgendyAmpDist          init               0
 kgendyDurDist          cabbageGetValue    "gendyDurDist"
 kgendyDurDist          -=                 1
 kgendyDurDist          init               0
 kgendyADPar            cabbageGetValue    "gendyADPar"
 kgendyDDPar            cabbageGetValue    "gendyDDPar"
 kgendyMinFreq          cabbageGetValue    "gendyMinFreq"
 kgendyMaxFreq          cabbageGetValue    "gendyMaxFreq"
 kgendyAmpScl           cabbageGetValue    "gendyAmpScl"
 kgendyDurScl           cabbageGetValue    "gendyDurScl"

 kgendycAmp              cabbageGetValue    "gendycAmp"
 kgendycAmpDist          cabbageGetValue    "gendycAmpDist"
 kgendycAmpDist          -=                 1
 kgendycAmpDist          init               0
 kgendycDurDist          cabbageGetValue    "gendycDurDist"
 kgendycDurDist          -=                 1
 kgendycDurDist          init               0
 kgendycADPar            cabbageGetValue    "gendycADPar"
 kgendycDDPar            cabbageGetValue    "gendycDDPar"
 kgendycMinFreq          cabbageGetValue    "gendycMinFreq"
 kgendycMaxFreq          cabbageGetValue    "gendycMaxFreq"
 kgendycAmpScl           cabbageGetValue    "gendycAmpScl"
 kgendycDurScl           cabbageGetValue    "gendycDurScl"

 kgendyxAmp              cabbageGetValue    "gendyxAmp"
 kgendyxAmpDist          cabbageGetValue    "gendyxAmpDist"
 kgendyxAmpDist          -=                 1
 kgendyxAmpDist          init               0
 kgendyxDurDist          cabbageGetValue    "gendyxDurDist"
 kgendyxDurDist          -=                 1
 kgendyxDurDist          init               0
 kgendyxADPar            cabbageGetValue    "gendyxADPar"
 kgendyxDDPar            cabbageGetValue    "gendyxDDPar"
 kgendyxMinFreq          cabbageGetValue    "gendyxMinFreq"
 kgendyxMaxFreq          cabbageGetValue    "gendyxMaxFreq"
 kgendyxAmpScl           cabbageGetValue    "gendyxAmpScl"
 kgendyxDurScl           cabbageGetValue    "gendyxDurScl"
 kgendyxCurveUp          cabbageGetValue    "gendyxCurveUp"
 kgendyxCurveDown        cabbageGetValue    "gendyxCurveDown"

 kFilter                 cabbageGetValue    "Filter"
 kFilterTime             cabbageGetValue    "Time"
 
 kMax                   init      0                    ; maximum so far
 kMin                   init      0                    ; minimum so far
 
 if changed(kReset)==1 then
  kMax                  =         0
  kMin                  =         0
                        cabbageSetValue    "Max",kMax
                        cabbageSetValue    "Min",kMin
 endif
  
 if changed(kType)==1 then            ; if opcode type is changed reset maximum and minimum to zero
  kMax      =    0
  kMin      =    0
            cabbageSetValue "Max", kMax                     ; send zeros to widgets
            cabbageSetValue "Min", kMin
            cabbageSet      k(1),"randomi","visible",0     ; first hide all opcode parameter widgets...
            cabbageSet      k(1),"randomh","visible",0
            cabbageSet      k(1),"rspline","visible",0
            cabbageSet      k(1),"jspline","visible",0
            cabbageSet      k(1),"jitter","visible",0
            cabbageSet      k(1),"jitter2","visible",0
            cabbageSet      k(1),"vibr","visible",0
            cabbageSet      k(1),"vibrato","visible",0
            cabbageSet      k(1),"gaussi","visible",0
            cabbageSet      k(1),"trandom","visible",0
            cabbageSet      k(1),"cauchyi","visible",0
            cabbageSet      k(1),"exprandi","visible",0
            cabbageSet      k(1),"gendy","visible",0
            cabbageSet      k(1),"gendyc","visible",0
            cabbageSet      k(1),"gendyx","visible",0

  if(kType==1) then                ; .. then reveal the appropriate plant
   cabbageSet    k(1),"randomi","visible",1
  elseif(kType==2) then
   cabbageSet    k(1),"randomh","visible",1
  elseif(kType==3) then
   cabbageSet    k(1),"rspline","visible",1
  elseif(kType==4) then
   cabbageSet    k(1),"jspline","visible",1
  elseif(kType==5) then
   cabbageSet    k(1),"jitter","visible",1
  elseif(kType==6) then
   cabbageSet    k(1),"jitter2","visible",1
  elseif(kType==7) then
   cabbageSet    k(1),"vibr","visible",1
  elseif(kType==8) then
   cabbageSet    k(1),"vibrato","visible",1
  elseif(kType==9) then
   cabbageSet    k(1),"gaussi","visible",1
  elseif(kType==10) then
   cabbageSet    k(1),"trandom","visible",1
  elseif(kType==11) then
   cabbageSet    k(1),"cauchyi","visible",1
  elseif(kType==12) then
   cabbageSet    k(1),"exprandi","visible",1
  elseif(kType==13) then
   cabbageSet    k(1),"gendy","visible",1
  elseif(kType==14) then
   cabbageSet    k(1),"gendyc","visible",1
  elseif(kType==15) then
   cabbageSet    k(1),"gendyx","visible",1
  endif
 endif
 
 iLen    =    ftlen(giFunc)            ; length of function table
 kNdx    init    0                     ; table write index initilialised to the start of the table

 if changed(kWaveShape,kWaveShape2)==1 then       ; reinit if waveshape2 combobox has been changed
  reinit UPDATE
 endif
 UPDATE:

 if kType==1 then                ; randomi
  kRnd    randomi    krandomiAmp1, krandomiAmp2, krandomiFreq, 2
 elseif kType==2 then            ; randomh
  kRnd    randomh    krandomhAmp1, krandomhAmp2, krandomhFreq, 2
 elseif kType==3 then            ; rspline
  kRnd    rspline    krsplineAmp1, krsplineAmp2, krsplineFreq1, krsplineFreq2
 elseif kType==4 then            ; rspline
  kRnd    jspline    kjsplineAmp, kjsplineFreq1, kjsplineFreq2
 elseif kType==5 then            ; jitter 
  kRnd    jitter    kjitterAmp, kjitterFreq1, kjitterFreq2
 elseif kType==6 then            ; jitter2 
  kRnd    jitter2    kjitter2TotAmp, kjitter2Amp1, kjitter2Freq1, kjitter2Amp2, kjitter2Freq2, kjitter2Amp3, kjitter2Freq3
 elseif kType==7 then            ; vibr
  kRnd    vibr    kvibrAvAmp, kvibrAvFreq, i(kWaveShape) + giSine - 1
 elseif kType==8 then            ; vibrato
  kRnd    vibrato    kvibratoAvAmp, kvibratoAvFreq, kvibratoRandAmountAmp, kvibratoRandAmountFreq, kvibratoAmpMinRate, kvibratoAmpMaxRate, kvibratoCpsMinRate, kvibratoCpsMaxRate, i(kWaveShape2) + giSine - 1
 elseif kType==9 then            ; gaussi
  kRnd    gaussi    kgaussiRange, kgaussiAmp, kgaussiCps
 elseif kType==10 then           ; trandom
  aIn   inch    1
  kTrig trigger k(aIn), 0.1, 0
  kRnd  trandom    kTrig, ktrandomMin, ktrandomMax
 elseif kType==11 then           ; cauchyi
  kRnd  cauchyi    kcauchyiLambda, kcauchyiAmp, kcauchyiCPS
 elseif kType==12 then           ; exprandi
  kRnd  exprandi    kexprandiLambda, kexprandiAmp, kexprandiCPS
 elseif kType==13 then           ; gendy
  kRnd  gendy        kgendyAmp, kgendyAmpDist, kgendyDurDist, kgendyADPar,  kgendyDDPar, kgendyMinFreq, kgendyMaxFreq, kgendyAmpScl, kgendyDurScl       ; [, initcps] [, knum]
 elseif kType==14 then           ; gendyc
  kRnd  gendyc        kgendycAmp, kgendycAmpDist, kgendycDurDist, kgendycADPar,  kgendycDDPar, kgendycMinFreq, kgendycMaxFreq, kgendycAmpScl, kgendycDurScl       ; [, initcps] [, knum]
 elseif kType==15 then           ; gendyx
  kRnd  gendyx        kgendyxAmp, kgendyxAmpDist, kgendyxDurDist, kgendyxADPar,  kgendyxDDPar, kgendyxMinFreq, kgendyxMaxFreq, kgendyxAmpScl, kgendyxDurScl, kgendyxCurveUp, kgendyxCurveDown   ; [, initcps] [, knum]
 endif
 rireturn
 
 ; SIGNAL FILTERS
 if kFilter==2 then
  kRnd    portk     kRnd, kFilterTime
 elseif kFilter==3 then
  kRnd    lineto    kRnd, kFilterTime
 endif  
 
 ; Move wiper
 ;kTrig   metro kROU
 if metro(kROU)==1 then                                     ; limit updates (both to the table and to the GUI) using a metronome
          tablew     kRnd,kNdx,giFunc                       ; write random value to table
  kNdx    wrap       kNdx+1,0,iLen                          ; increment index and wrap ot zero if it exceeds table length
          cabbageSet 1,"table1", "tableNumber", 1
          cabbageSet 1,"wiper","bounds", ((kNdx/iLen) * giTableWidth), 0, 1, 150
 endif

 kMax     =          kRnd>kMax?kRnd:kMax                    ; update 'Maximum So Far' value if required
 kMin     =          kRnd<kMin?kRnd:kMin                    ; update 'Minimum So Far' value if required
          cabbageSetValue "Max",kMax,changed(kMax)          ; ...write to GUI nslider
          cabbageSetValue    "Min",kMin,changed(kMin)       ; ...write to GUI nslider

 cabbageSetValue "CurVal",kRnd,metro:k(32)

 ; sonify
 kSoundOnOff  cabbageGetValue "SoundOnOff"                  ; Sound On/Off checkbox
 kSoundAmp    cabbageGetValue "SoundAmp"                    ; Sound Amplitude
 kSoundOnOff  lineto          kSoundOnOff*kSoundAmp,0.03    ; smooth on/off button change. (Will be used to prevent clicks.)
 aSoundOnOff  interp          kSoundOnOff
 if kSoundOnOff>0 then                                      ; if Sound On/Off button is on...
  asig        poscil          0.1*aSoundOnOff,cpsoct(8+kRnd); audio oscillator. Frequency modulated by random function.
              outs            asig,asig                     ; send to audio outputs
 endif

endin

</CsInstruments>

<CsScore>
i 1 0 [3600*24*7]
</CsScore>

</CsoundSynthesizer>
