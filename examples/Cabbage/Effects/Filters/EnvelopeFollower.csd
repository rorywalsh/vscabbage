
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; EnvelopeFollower.csd
; Written by Iain McCurdy, 2012.

; Follows the changing amplitude of an input audio signal and uses this function to drive the cutoff frequency of one of a selection of filters.

; Input (meter) -  level meter of the input signal  
; Sensitivity   -  amount by which the filter will respond to input amplitude changes
; Attack        -  attack time of the envelope follower
; Decay         -  decay time of the envelope follower
; Frequency     -  static frequency offset of the filter, 
; Freq. (meter) -  representation of the final filter frequency, combining the envelope follower and the static offset (logarithmic representation from 20 - 20000 Hz)
; Type          -  filter type
; Resonance     -  resonance of the filter (when available)
; Distortion    -  distortion of the filter (when available)
; Level         -  output level control


<Cabbage>
form caption("Envelope Follower") size(695, 277), pluginId("envf"), guiMode("queue")
image                  pos(0, 0), size(695, 277), colour( 40, 37, 37), shape("rounded"), outlineColour("white"), outlineThickness(4)

#define SLIDER_STYLE colour(115,100,100), textColour(255,255,200), trackerColour(255,255,150,200), valueTextBox(1), markerColour("silver"), markerThickness(1.5) markerStart(0.7), markerEnd(0.8), trackerInsideRadius(0.8)

label    bounds(10, 13, 40, 15), text("Input"), fontColour(255,255,200)
vmeter   bounds(20, 35, 20, 80) channel("Meter") value(0) outlineColour("black"), overlayColour(20, 3, 3,255) meterColour:0(255,100,100,255) meterColour:1(255,150,155, 255) meterColour:2(255,255,123, 255) outlineThickness(3), corners(1)

rslider  bounds(50, 10, 80, 100), text("Sensitivity"), channel("sens"),  range(0, 1, 0.65, 1, 0.001), $SLIDER_STYLE
rslider  bounds(125, 20, 60, 80), text("Attack"),        channel("att"),   range(0.001, 0.5, 0.01, 0.5, 0.001), $SLIDER_STYLE
rslider  bounds(180, 20, 60, 80), text("Decay"),        channel("rel"),   range(0.001, 0.5, 0.2, 0.5, 0.001), $SLIDER_STYLE
rslider  bounds(235, 11, 80,100), text("Frequency"),   channel("freq"),  range(10, 10000, 1000, 0.5), $SLIDER_STYLE

label    bounds(310, 13, 40, 15), text("Freq."), fontColour(255,255,200)
vmeter   bounds(320, 35, 20, 80) channel("FreqMeter") value(0) outlineColour("black"), overlayColour(20, 3, 3,255) meterColour:0(255,100,100,255) meterColour:1(255,150,155, 255) meterColour:2(255,255,123, 255) outlineThickness(3), corners(1)

label    bounds(355, 35, 85, 14), text("Type"), fontColour(255,255,200)
combobox bounds(355, 50, 85, 20), text("lpf18","moogladder","butlp","tone"), value("1"), channel("type")

rslider  bounds(450, 11, 80,100), text("Resonance"),   channel("res"),   range(0,  1, 0.75), $SLIDER_STYLE
rslider  bounds(525, 11, 80,100), text("Distortion"),  channel("dist"),  range(0,  1.00, 0), $SLIDER_STYLE
rslider  bounds(600, 11, 80,100), text("Level"),       channel("level"), range(0, 1.00,1), $SLIDER_STYLE

checkbox bounds( 15,135,120, 15), channel("GraphOnOff"), text("Graph On/Off"), value(1)
image    bounds( 13,153,669,104), outlineColour("grey"), corners(5), outlineThickness(5), channel("bezel")
gentable bounds( 15,155,665,100), channel("FreqGraph"), tableNumber(1), colour( 0,255,0,150), tableColour(255,255,150,200), ampRange(0,1,1), fill(0)
image    bounds( 15,155,  1,100), outlineColour("grey"), channel("wiper")

label    bounds( 15,260,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

; sr is set by host
ksmps              =                   64
nchnls             =                   2
0dbfs              =                   1

; Author: Iain McCurdy (2012)


giFreqGraph        ftgen               1, 0, 1024, 2, 0

opcode  EnvelopeFollower,ak,akkkkkkk
    ain, ksens, katt, krel, kfreq, ktype, kres, kdist  xin                 ; READ IN INPUT ARGUMENTS
                   setksmps            4
    ;                    ATTCK.REL.  -  ADJUST THE RESPONSE OF THE ENVELOPE FOLLOWER HERE
    aFollow        follow2             ain, katt, krel                     ; AMPLITUDE FOLLOWING AUDIO SIGNAL
    kFollow        downsamp            aFollow                             ; DOWNSAMPLE TO K-RATE
    kFollow        expcurve            kFollow/0dbfs, 0.5                  ; ADJUSTMENT OF THE RESPONSE OF DYNAMICS TO FILTER FREQUENCY MODULATION
    kFrq           =                   kfreq + (kFollow * ksens * 10000)   ; CREATE A LEFT CHANNEL MODULATING FREQUENCY BASE ON THE STATIC VALUE CREATED BY kfreq AND THE AMOUNT OF DYNAMIC ENVELOPE FOLLOWING GOVERNED BY ksens
    kFrq           limit               kFrq, 20,sr/2                       ; LIMIT FREQUENCY RANGE TO PREVENT OUT OF RANGE FREQUENCIES  
    if ktype==1 then
     aout          lpf18               ain, kFrq, kres, kdist              ; REDEFINE AUDIO SIGNAL AS FILTERED VERSION OF ITSELF
    elseif ktype==2 then
     aout          moogladder          ain, kFrq, kres                     ; REDEFINE AUDIO SIGNAL AS FILTERED VERSION OF ITSELF
    elseif ktype==3 then
     aFrq          interp              kFrq
     aout          butlp               ain, aFrq                           ; REDEFINE AUDIO SIGNAL AS FILTERED VERSION OF ITSELF
    elseif ktype==4 then
     aout          tone                ain, kFrq                           ; REDEFINE AUDIO SIGNAL AS FILTERED VERSION OF ITSELF
    endif
                   xout                aout, kFrq                          ; SEND AUDIO BACK TO CALLER INSTRUMENT
endop

opcode  SwitchPort, k, kii
    kin,iupport,idnport xin
    kold           init                0
    kporttime      =                   (kin < kold ? idnport : iupport)
    kout           portk               kin, kporttime
    kold           =                   kout
                   xout                kout
endop

instr 1
ksens              cabbageGetValue              "sens"
katt               cabbageGetValue              "att"
krel               cabbageGetValue              "rel"
kfreq              cabbageGetValue              "freq"
ktype              cabbageGetValue              "type"
ktype              init                         1

                   cabbageSet                   changed:k(ktype), "dist", "visible", ktype == 1 ? 1 : 0
                   cabbageSet                   changed:k(ktype), "res", "visible", ktype > 2 ? 0 : 1

kres               cabbageGetValue              "res"
kdist              cabbageGetValue              "dist"
klevel             cabbageGetValue              "level"

; audio input
a1,a2              ins
;a1,a2 diskin2 "/Users/iainmccurdy/Documents/iainmccurdy.org/CsoundRealtimeExamples/SourceMaterials/808loop.wav", 1, 0, 1


if changed:k(ktype)==1 then
 if ktype==1 then
                   cabbageSet         1, "distID", "visible", 1
                   cabbageSet         1, "resID", "visible", 1
 elseif ktype==2 then
                   cabbageSet         1, "distID", "visible", 0
                   cabbageSet         1, "resID", "visible", 1
 else
                   cabbageSet         1, "distID", "visible", 0
                   cabbageSet         1, "resID", "visible", 0
 endif
endif

; level meter
amix               sum                 a1, a2
krms               rms                 amix * 0.5
krms               pow                 krms, 0.75
krms               SwitchPort          krms, 0.01, 0.05
                   cabbageSetValue     "Meter", krms^0.5

a1,kFrq            EnvelopeFollower    a1, ksens, katt, krel, kfreq, ktype, kres * 0.95, kdist * 100
a2,kFrq2           EnvelopeFollower    a2, ksens, katt, krel, kfreq, ktype, kres * 0.95, kdist * 100

                   cabbageSetValue     "FreqMeter", (octcps(kFrq) - 4.3) *0.1

; mixer and output
a1                 =                   a1 * klevel * (1 - ((kdist * 0.3) ^ 0.02))                     ; scale amplitude according to distortion level (to compensate for gain increases it applies)
a2                 =                   a2 * klevel * (1 - ((kdist * 0.3) ^ 0.02))
                   outs                a1, a2
                
; graph
kGraphOnOff        cabbageGetValue     "GraphOnOff"
                   cabbageSet                   changed:k(kGraphOnOff), "FreqGraph", "alpha", 0.3 + (kGraphOnOff*0.7)
                   cabbageSet                   changed:k(kGraphOnOff), "bezel", "visible", kGraphOnOff
                   cabbageSet                   changed:k(kGraphOnOff), "wiper", "alpha", 0.3 + (kGraphOnOff*0.7)

if kGraphOnOff==0 kgoto SKIP
kPhs               phasor              0.05
                   tablew              (octcps(kFrq) - 4.2) * 0.1, kPhs, giFreqGraph, 1
                   cabbageSet          metro:k(16), "FreqGraph", "tableNumber", giFreqGraph
                   cabbageSet          metro:k(16), "wiper", "bounds", 15+(665*kPhs),155,1,100
SKIP:



endin

</CsInstruments>

<CsScore>
i 1 0 [60 * 60 * 24 * 7]
</CsScore>

</CsoundSynthesizer>