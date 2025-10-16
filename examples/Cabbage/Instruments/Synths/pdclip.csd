z
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; pdclip.csd
; Written by Iain McCurdy, 2012.

; pdclip is short for phase-distortion-clipping so can be useful for phase distortion synthesis.

; The transfer function is displayed in a graph.

<Cabbage>
#define DIAL_STYLE  trackerInsideRadius(0.8), textColour("white"), fontColour("white"), colour(5, 30,80), trackerColour(155,155,225), outlineColour(30,30,50), valueTextBox(1)

form caption("pdclip") size(695,120), pluginId("pdcl"), guiMode("queue")
image        bounds(  0,  0,695,120), colour(10,100,200,200), shape("rounded"), outlineColour("white"), outlineThickness(4), corners(5)

rslider      bounds( 10, 11, 70, 90), text("Width"),  channel("width"),  range(0, 1.00, 0), $DIAL_STYLE
rslider      bounds( 80, 11, 70, 90), text("Centre"), channel("center"), range(-1.00, 1.00, 0), $DIAL_STYLE
combobox     bounds(155, 20, 75, 20), channel("polarity"), value(1), text("Unipolar", "Bipolar")

image        bounds(240, 10,115, 95), colour(0,0,0,0)
{
label        bounds(  5, 10, 10, 12), text("1"), align("left"), fontColour(205,205,205)
label        bounds(  5, 47, 10, 12), text("0"), align("left"), fontColour(205,205,205)
label        bounds(  0, 83, 15, 12), text("-1"), align("left"), fontColour(205,205,205)
label        bounds( 15,  0,100, 12), text("Phase Pointer"), fontColour(255,255,255)
gentable     bounds( 15, 15,100, 76), tableNumber(1000), channel("TF"), ampRange(-1,1,1000), tableColour(160,160,220), fill(0)
image        bounds( 15, 53,100,  1), colour(100,100,100) ; x axis
;image        bounds( 65, 15,  1, 76), colour(100,100,100) ; y axis
}

image        bounds(375, 10,115, 95), colour(0,0,0,0)
{
label        bounds(  5, 10, 10, 12), text("1"), align("left"), fontColour(205,205,205)
label        bounds(  5, 47, 10, 12), text("0"), align("left"), fontColour(205,205,205)
label        bounds(  0, 83, 15, 12), text("-1"), align("left"), fontColour(205,205,205)
label        bounds( 15,  0,100, 12), text("Output"), fontColour(255,255,255)
gentable     bounds( 15, 15,100, 76), tableNumber(1001), channel("Output"), ampRange(-1,1,1001), tableColour(160,160,220), fill(0)
image        bounds( 15, 53,100,  1), colour(100,100,100) ; x axis
;image        bounds( 65, 15,  1, 76), colour(100,100,100) ; y axis
}

checkbox     bounds(495, 25, 70, 15), channel("wrap"), text("Wrap"), value(0), fontColour:0("white"), fontColour:1("white")

rslider      bounds(545, 11, 70, 90), text("Level"),  channel("level"),  range(0, 1.00, 0.1), $DIAL_STYLE
rslider      bounds(615, 11, 70, 90), text("Freq."),  channel("freq"),  range(20, 5000, 200, 0.5, 0.1), $DIAL_STYLE

label         bounds(  4,107,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour(200,200,200)
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

;sr is set by the host
ksmps   =   32      ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls  =   2       ; NUMBER OF CHANNELS (2=STEREO)
0dbfs   =   1

;Author: Iain McCurdy (2012)

gisine             ftgen               0, 0, 4096, 10, 1
i_                 ftgen               1000, 0, 256, 10, 1 ; distorted phase pointer
i_                 ftgen               1001, 0, 256, 10, 1 ; distorted sine wave

i_                 ftgen               1000, 0, 256, "tanh", -1, 1, 0 ; tanh


instr   1
 kporttime         linseg              0, 0.001, 0.05         ; portamento time ramps up from zero
 kwidth            cabbageGetValue     "width"
 kwidth            portk               kwidth,kporttime
 kcenter           cabbageGetValue     "center"
 kcenter           portk               kcenter,kporttime
 kpolarity         cabbageGetValue     "polarity"
 kpolarity         init                1
 kwrap             cabbageGetValue     "wrap"
 klevel            cabbageGetValue     "level"
 klevel            portk               klevel,kporttime
 kfreq             cabbageGetValue     "freq"
 kfreq             portk               kfreq,kporttime
 
 isfn              =                   gisine

 ; derive frequency from source sample (assuming a single cycle)
 iFreq             =                   1 / filelen:i("/Users/iainmccurdy/Documents/Sabbatical2024-25/Sounds/HoverFlyHoveringSingleCycle.wav")
                   cabbageSetValue     "freq", iFreq
 
 
 ; synthesis
 if changed:k(kwrap,kpolarity)==1 then
                   reinit              RESTART_SYNTH
 endif
 RESTART_SYNTH:
 ifullscale        =                   0dbfs            ; DEFINE FULLSCALE AMPLITUDE VALUE
 aPhasor           phasor              kfreq
 if kpolarity==2 then                                   ; if bipolar
  aPhasor          =                   (aPhasor * 2) - 1
 endif
 ;CLIP THE PHASOR USING pdclip
 aPhsPDC           pdclip              aPhasor, kwidth, kcenter, i(kpolarity) - 1 ; [, ifullscale]]
 aOut              tablei              aPhsPDC, isfn, 1, 0, i(kwrap); read the sine wave table using the distorted phase pointer
 rireturn
 alevel            interp              klevel
                   cabbageSet          changed:k(kwrap,kpolarity,kwidth,kcenter), "Output", "tableNumber", 1001
                   outall              aOut * alevel


 ; display
 ; create and display distorted phaser pointer and distorted sine wave 
 kValStart         =                   kpolarity == 1 ? 0 : -1 ; if unipolar
 kValStep          =                   kpolarity == 1 ? 1 :  2 ; if unipolar
 if changed:k(kwidth,kcenter,kpolarity,kwrap)==1 then
                   reinit              RESTART
 endif
 RESTART:

 kCount            =                   0
 kVal              =                   kValStart
 while kCount<ftlen(1000) do
 aVal              pdclip              a(kVal), kwidth, kcenter, i(kpolarity) - 1 ; [, ifullscale]]
                   tablew              k(aVal), kCount, 1000
 aOut              pdclip              a(kVal), kwidth, kcenter, i(kpolarity) - 1 ; [, ifullscale]]
 aOut              tablei              aOut, isfn, 1, 0, i(kwrap)
                   tablew              aOut, a(kCount), 1001
 kCount            +=                  1
 kVal              +=                  kValStep/ftlen(1000)
 od
                   cabbageSet          "TF", "tableNumber", 1000
 rireturn

endin
        
</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>