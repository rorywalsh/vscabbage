
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; WhiteNoise

; Iain McCurdy

; Demonstration of the 'noise' opcode

<Cabbage>
form caption("White Noise"), size(230,190), pluginId("wnse") guiMode("queue")
image              bounds(  0,  0,230,190), colour("white"), shape("rounded"), outlineColour("black"), outlineThickness(4) 
checkbox bounds( 10, 15, 80, 15), text("On/Off"), channel("onoff"), value(0), fontColour:0("black"), fontColour:1("black")
checkbox bounds( 10, 40, 80, 15), text("Clip"), channel("Clip"), value(0), fontColour:0("black"), fontColour:1("black"), colour("red"), shape("ellipse")
rslider  bounds( 80, 10, 70, 70), text("Amplitude"), channel("amp"),  outlineColour("DarkGrey"), colour("black"), range(0, 1, 0.1, 0.5, 0.001),   textColour("black"), trackerColour("grey")
rslider  bounds(150, 10, 70, 70), text("Beta"),      channel("beta"), outlineColour("DarkGrey"), colour("black"), range(-0.999, 0.999,0,1,0.001), textColour("black"), trackerColour("grey")
gentable bounds(  5, 85,220, 90), tableNumber(11), channel("FFT"), ampRange(0,1,-1), outlineThickness(0), sampleRange(0, 128), tableColour("white"), zoom(-1)
label    bounds(  7, 85,100, 11), text("FFT Spectrum"), fontColour(255,255,255,150), align(left)
label    bounds(  7,175, 110, 12), text("Iain McCurdy |2012|"), fontColour("DarkGrey"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   64
nchnls             =                   2
0dbfs              =                   1                        ; MAXIMUM AMPLITUDE
                   massign             0, 0

giFFT              ftgen               11, 0, 256, 10, 1

instr    1
 kporttime         linseg              0, 0.001, 0.05
 konoff            cabbageGetValue     "onoff"                  ; read in on/off switch widget value
 if konoff==0 goto SKIP                                         ; if on/off switch is off jump to skip label
 kamp              cabbageGetValue     "amp"                    ; read in widgets...
 kamp              portk               kamp,kporttime
 kbeta             cabbageGetValue     "beta"
 asigL             noise               kamp, kbeta              ; GENERATE WHITE NOISE
 asigR             noise               kamp, kbeta              ; GENERATE WHITE NOISE
                   outs                asigL, asigR             ; SEND AUDIO SIGNAL TO OUTPUT
 fsig              pvsanal             asigL * 3, 256, 64, 256, 1
 kflag             pvsftw              fsig, 11
                   cabbageSet          kflag, "FFT", "tableNumber", 11
 if trigger:k( cabbageGetValue:k("Clip"), 0.5, 1) == 1 then
  kPeak            =                   0
 endif

 kPeak peak asigL
                   cabbageSetValue     "Clip", 1, trigger:k(kPeak,1,0)

 SKIP:                                                           ; A label. Skip to here is on/off switch is off 
endin


</CsInstruments>

<CsScore>
i 1 0 z    ;instrument that reads in widget data
</CsScore>

</CsoundSynthesizer>