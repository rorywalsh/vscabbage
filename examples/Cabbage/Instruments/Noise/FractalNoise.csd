
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; FractalNoise.csd
; Written by Iain McCurdy, 2015

; GUI colour indicates noise type: 'white' - 'pink' - 'brown'

<Cabbage>
form caption("Fractal Noise"), size(290,282), pluginId("fnse"), guiMode("queue")
image                bounds(  0,  0,290,282), colour("white"), shape("sharp"), , channel("BackgroundColour")
#define RSLIDER_DESIGN textColour("black"), fontColour("black"), trackerColour("silver"), colour(30,30,30), valueTextBox(1)
checkbox bounds( 10, 10, 65, 15), channel("onoff"), value(0), fontColour:0("black"), fontColour:1("black"), colour("yellow"), text("On/Off")
rslider  bounds(100,  2, 60, 80), channel("amp"),     range(0, 2, 0.2, 0.5, 0.001), text("Amp"), $RSLIDER_DESIGN
rslider  bounds(160,  2, 60, 80), channel("beta"),    range(-2, 5, 0, 1, 0.001), text("Beta"), $RSLIDER_DESIGN
rslider  bounds(220,  2, 60, 80), channel("width"),   range(0,0.05, 0, 0.5, 0.0001), text("Width"), $RSLIDER_DESIGN
gentable bounds(  5, 85,280, 90), tableNumber(10), ampRange(-1,1,-1), channel("table"),zoom(-1)
label    bounds(  7, 85,100, 11), text("Amp.Waveform"), fontColour(255,255,255,150), align(left)
gentable bounds(  5,180,280, 90), tableNumber(11), channel("FFT"), ampRange(0,1,-1), outlineThickness(0), sampleRange(0, 128), tableColour("yellow"), zoom(-1)
label    bounds(  7,180,100, 11), text("Spectrum"), fontColour(255,255,255,150), align(left)
label    bounds(  7,270, 110, 11), text("Iain McCurdy |2015|"), fontColour("DarkGrey"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   16
nchnls             =                   2
0dbfs              =                   1

ginoise            ftgen               10, 0, 128, 10, 0
giFFT              ftgen               11, 0, 256, 10, 1
giFracScal         ftgen               1,0,-700,-27, 0,1.1, 100,1.1, 200,1.1, 300,0.42, 400,0.08, 500,0.008, 600,0.001, 700,0.0002 
;                                                     white     white     pink     brown    black
giR                ftgen               2,0,-700,-27,  0,255, 200,255,  300,255, 400,80,   700,1 
giG                ftgen               3,0,-700,-27,  0,255, 200,255,  300,130, 400,40,   700,1 
giB                ftgen               4,0,-700,-27,  0,255, 200,255,  300,130, 400,0 ,   700,1 


instr    1
 konoff            cabbageGetValue     "onoff"        ;read in on/off switch widget value
 kamp              cabbageGetValue     "amp"
 kamp              port                kamp, 0.01
 kbeta             cabbageGetValue     "beta"
 kbeta             port                kbeta, 0.1
 kbeta             init                0
 kwidth            cabbageGetValue     "width"
 kwidth            portk               kwidth, 0.05
 kscal             table               (kbeta + 2) / 7, giFracScal, 1
 aL                fractalnoise        kscal * 0.5 * konoff, kbeta
 if kwidth>0.0001 then
  aR               vdelay              aL, kwidth * 1000, 100
 else
  aR               =                   aL
 endif
                   outs                aL * kamp, aR * kamp

 kptr              init                0
                   tabw                k(aL), kptr, ginoise
 kptr              =                   (kptr + 1) % ftlen(ginoise)

 if metro(16)==1 then
  if changed(kbeta)==1 then
   kR              tab                 (kbeta + 2) / 7, giR, 1
   kG              tab                 (kbeta + 2) / 7, giG, 1
   kB              tab                 (kbeta + 2) / 7, giB, 1
   kR              init                255
   kG              init                255
   kB              init                255
                   cabbageSet          1, "BackgroundColour", "colour", kR, kG, kB
  endif

                   cabbageSet          1, "table", "tableNumber", 10

 endif

 
 kFlickOn          trigger             kbeta, 1.5, 0
 kFlickOff         trigger             kbeta, 1.5, 1
 if kFlickOn==1 then
                   cabbageSet          1, "label1", "fontColour", 255, 255, 255
                   cabbageSet          1, "label2", "fontColour", 255, 255, 255
                   cabbageSet          1, "label3", "fontColour", 255, 255, 255
                   cabbageSet          1, "label4", "fontColour", 255, 255, 255
                   cabbageSet          1, "onoff", "fontColour:0", 255, 255, 255
                   cabbageSet          1, "onoff", "fontColour:1", 255, 255, 255
 elseif kFlickOff==1 then
                   cabbageSet          1, "label1", "fontColour", 0, 0, 0
                   cabbageSet          1, "label2", "fontColour", 0, 0, 0
                   cabbageSet          1, "label3", "fontColour", 0, 0, 0
                   cabbageSet          1, "label4", "fontColour", 0, 0, 0
                   cabbageSet          1, "onoff", "fontColour:0", 0, 0, 0
                   cabbageSet          1, "onoff", "fontColour:1", 0, 0, 0
 endif
 
 fsig              pvsanal             aL*3, 256,64,256,1
   kflag           pvsftw              fsig, 11
  if kflag==1 then
                   cabbageSet          1, "FFT", "tableNumber", giFFT
  endif

endin


</CsInstruments>

<CsScore>
i 1 0 z    ;instrument that reads in widget data
</CsScore>

</CsoundSynthesizer>