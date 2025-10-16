
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; distort1.csd
; Written by Iain McCurdy, 2023
; 

; This example demonstrates the distort1 opcode by waveshaping and sine wave and showing the results 
;  as an output waveform and a spectroscope, but a live input signal can also be processing.
; By offering independent control over the shaping of the positive and negative portions of the waveform, 
;   positive harmonics can be included in the waveshaping.

; Pre Gain  - gain applied to the signal going into the distortion processor (both sine wave and live sound)
; Post Gain - gain applied to the signal going into the distortion processor (both sine wave and live sound)
; Shape 1   - curve amount applied to the positive excursion of the input signal. Negative values will invert the curve.
; Shape 2   - curve amount applied to the negative excursion of the input signal. Negative values will invert the curve.
 

<Cabbage>
form caption("distort1"), size(745, 308), pluginId("dst1"), colour(50, 13, 67,50), guiMode("queue")

label    bounds(  5,  5,235, 15), text("TEST SINE WAVE"), align("centre")
image    bounds(  5, 23,235,160), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(20)
{
gentable bounds(  5,  5,225,150), tableNumber(1), tableColour("silver"), fill(0), channel("table")
image    bounds(  5, 80,225,  1), colour(255,255,255,100) ; x axis
image    bounds(117,  5,  1,150), colour(255,255,255,100) ; y axis
}

label    bounds(255,  5,235, 15), text("DISTORTED SINE WAVE"), align("centre")
; bevel
image    bounds(255, 23,235,160), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(20)
{
; grid
gentable      bounds(  5,  5,225,150), tableNumber(1),  tableGridColour("white"), fill(0), tableColour(0,0,0,0)
; oscilloscope
signaldisplay bounds(  5,  5,225,150), colour("LightBlue"), alpha(0.85), displayType("waveform"), backgroundColour("Black"), zoom(-1), signalVariable("asig"), channel("display")
image         bounds(  5, 79,225,  1), colour(100,100,100) ; x-axis indicator
}

label         bounds(505,  5,235, 15), text("PARTIALS"), align("centre")
; bevel
image         bounds(505, 23,235,160), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(20)
{
; grid
gentable      bounds(  5,  5,225,150), tableNumber(1),  tableGridColour("white"), fill(0), tableColour(0,0,0,0)
; spectroscope
signaldisplay bounds(  5,  5,225,150), colour("LightBlue"), alpha(0.85), displayType("spectroscope"), backgroundColour("Black"), zoom(-1), signalVariable("asig"), channel("displaySS")
image         bounds(  5, 79,225,  1), colour(100,100,100) ; x-axis indicator
}

image    bounds(  5,195,235,100), colour(0,0,0,0), outlineThickness(1)
{
label    bounds(  0,  5,235, 15), text("TEST TONE"), align("centre")
checkbox bounds( 10, 35,100, 11), channel("tone") text("TONE LISTEN"), value(1)
nslider  bounds( 30, 55, 70, 30), channel("freq"), text("FREQ"), range(10, 10000, 100)
nslider  bounds(130, 55, 70, 30), channel("amp"), text("MONITOR"), range(0, 1, 0.1, 1, 0.001)
}

image    bounds(255,195,235,100), colour(0,0,0,0), outlineThickness(1)
{
label    bounds(  0,  5,235, 15), text("DISTORT1"), align("centre")
nslider  bounds( 35, 25, 70, 30), channel("Pre"), text("Pre Gain"), range(-10, 10, 0.1,1,0.001)
nslider  bounds(135, 25, 70, 30), channel("Post"), text("Post Gain"), range(-10, 10, 1,1,0.001)
nslider  bounds( 35, 60, 70, 30), channel("Shap1"), text("Shape 1"), range(-1, 1, 0, 1, 0.001)
nslider  bounds(135, 60, 70, 30), channel("Shap2"), text("Shape 2"), range(-1, 1, 0, 1, 0.001)
}

image    bounds(505,195,235,100), colour(0,0,0,0), outlineThickness(1)
{
label    bounds(  0,  5,235, 15), text("DISTORTION ON LIVE SIGNAL"), align("centre")
checkbox bounds( 10, 35,100, 11), channel("LiveOnOff") text("ON/OFF"), value(0)
checkbox bounds( 90, 35,100, 11), channel("Mono") text("MONO"), value(0), radioGroup(1)
checkbox bounds( 90, 55,100, 11), channel("Stereo") text("STEREO"), value(1), radioGroup(1)
vmeter   bounds(170, 35, 10, 50), channel("InMeter"), value(0) outlineColour(0, 0, 0), overlayColour(0, 0, 0) meterColour:0(255, 0, 0) meterColour:1(255, 255, 0) meterColour:2(0, 255, 0) outlineThickness(1) 
label    bounds(165, 85, 20, 12), text("IN")
vmeter   bounds(200, 35, 10, 50), channel("OutMeter"), value(0) outlineColour(0, 0, 0), overlayColour(0, 0, 0) meterColour:0(255, 0, 0) meterColour:1(255, 255, 0) meterColour:2(0, 255, 0) outlineThickness(1) 
label    bounds(190, 85, 30, 12), text("OUT")
}
label    bounds(  5,295,120, 13), text("Iain McCurdy |2023|"), align("left")

</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-n -dm0 -+rtmidi=NULL --displays
</CsOptions>

<CsInstruments>

; sr set by host
ksmps         =                32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls        =                2    ; NUMBER OF CHANNELS (1=MONO)
0dbfs         =                1    ; MAXIMUM AMPLITUDE

i_  ftgen 1,0,4096,10,1

instr    1

kporttime linseg               0,0.001,0.05

ktone     cabbageGetValue      "tone"
ktone     portk                ktone,0.01

kLiveOnOff cabbageGetValue     "LiveOnOff"

kfreq     cabbageGetValue      "freq"
kfreq     portk                kfreq,kporttime

asig      poscil               1,kfreq,1

kPre      cabbageGetValue      "Pre"
kPost     cabbageGetValue      "Post"
kShap1    cabbageGetValue      "Shap1"
kShap2    cabbageGetValue      "Shap2"
imode     =         1
asig      distort1             asig, kPre, kPost, kShap1, kShap2, imode
kamp      cabbageGetValue      "amp"
kamp      portk                kamp,kporttime
          outs                 asig*a(kamp)*a(ktone), asig*a(kamp)*a(ktone)

; live processing
if kLiveOnOff==1 then
 kMono     cabbageGetValue      "Mono"
 kStereo   cabbageGetValue      "Stereo"
 aInL      inch                 1
 kRMS      rms                  aInL
 kRMS      lagud                kRMS,0.01,2
           cabbageSetValue      "InMeter",kRMS
 if kStereo==1 then
  aInR     inch                 2
 else
  aInR     =                    aInL
 endif
 aInL      distort1             aInL, kPre, kPost, kShap1, kShap2, imode
 aInR      distort1             aInR, kPre, kPost, kShap1, kShap2, imode
 kRMS      rms                  aInL
 kRMS      lagud                kRMS,0.01,2
           cabbageSetValue      "OutMeter",kRMS

           outs                 aInL,aInR
endif


; OSCILLOSCOPE
kPeriodFrac = 5
if changed:k(kfreq,kPeriodFrac)==1 then
         reinit                RestartDisplay
endif
RestartDisplay:
iPeriod   =  2 * 80/(i(kfreq)*2^i(kPeriodFrac))
         display               asig, iPeriod
rireturn

;        dispfft               xsig,  iprd,  iwsiz [, iwtyp] [, idbout] [, iwtflg] [,imin] [,imax] 
         dispfft               asig, 0.001, 2048,      1,        0,         0,       0,      500
endin

</CsInstruments>

<CsScore>
; play instrument 1 for 1 hour
i 1 0 3600
</CsScore>

</CsoundSynthesizer>
