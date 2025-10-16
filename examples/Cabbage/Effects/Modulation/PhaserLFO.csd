
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; PhaserLFO.csd
; A classic modulating phaser effect
; Written by Iain McCurdy, 2012.

<Cabbage>
form caption("Phaser LFO") size(690,115), pluginId("phsr"), guiMode("queue")
image            bounds(  0,  0,690,115), colour( 100, 110, 130), shape("rounded"), outlineColour("white"), outlineThickness(4)

#define SLIDER_STYLE colour(50,40,110), textColour("White"), fontColour("White"), trackerColour(255,255,200), valueTextBox(1)

label    bounds(10, 15, 75, 10), text("INPUT"), fontColour("White")
combobox bounds(10, 25, 75, 20), channel("input"), value(1), text("Mono","Stereo","Test Tone","Noise")
label    bounds(10, 55, 75, 10), text("LFO SHAPE"), fontColour("White")
combobox bounds(10, 65, 75, 20), channel("shape"), value(1), text("Triangle","Sine","Square","Saw Up","Saw Down","Exp","Log","Rand.Int","Rand.S&H")

label    bounds( 95, 15, 90, 13), text("LFO Shape"), align("centre"), fontColour("White")
gentable bounds( 95, 30, 90, 60), tableNumber(99), channel("LFOtable"), fill(0), ampRange(0,1,1)

line    bounds(195, 10,200,  2)
label   bounds(265,  7, 65, 10), text("MODULATION"), fontColour("white"), colour(100,110,130)
rslider bounds(185, 20, 90, 90), text("Rate"),      channel("rate"),     range(0,100.00,0.5,0.5, 0.0001), $SLIDER_STYLE
rslider bounds(255, 20, 90, 90), text("Depth"),     channel("depth"),    range(0, 1.00, 0.5, 1, .01), $SLIDER_STYLE
rslider bounds(325, 20, 90, 90), text("Offset"),    channel("freq"),     range(0, 1.00, 0.4, 1, .01), $SLIDER_STYLE
rslider bounds(395, 20, 90, 90), text("Feedback"),  channel("fback"),    range(0, 1.00, 0.4, 1, .01), $SLIDER_STYLE
rslider bounds(465, 20, 90, 90), text("Stages"),    channel("stages"),   range(1, 64,8, 1, 1), $SLIDER_STYLE
rslider bounds(535, 20, 90, 90), text("Mix"),       channel("mix"),      range(0, 1.00,0.5, 1, .01), $SLIDER_STYLE
rslider bounds(605, 20, 90, 90), text("Level"),     channel("level"),    range(0, 1.00, 1, 1, .01), $SLIDER_STYLE

label   bounds(  5,101,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour("lightGrey")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 32
nchnls = 2
0dbfs  = 1

;Author: Iain McCurdy (2012)
;http://iainmccurdy.org/csound.html


iTabSize      =             2048
i_            ftgen         99,0,2048,10,1 ; buffer table
gitriangle    ftgen         1, 0, iTabSize, 7, 0,iTabSize/2,1,iTabSize/2,0     ; triangle-shape for lfo
gisine        ftgen         2, 0, iTabSize, 19, 1, 0.5, 0,   0.5               ; sine-shape for lfo
gisq          ftgen         3, 0, iTabSize, 7, 1,iTabSize/2,1,0,0,iTabSize/2,0 ; square-shape for lfo
giramp        ftgen         4, 0, iTabSize, 7, 0,iTabSize,1                    ; ramp-shape for lfo
gisaw         ftgen         5, 0, iTabSize, 7, 1,iTabSize,0                    ; square-shape for lfo
giExp         ftgen         6, 0, iTabSize, 19, 0.5, 1, 180, 1
giLog         ftgen         7, 0, iTabSize, 19, 0.5, 1, 0, 0
idiv          =             7
girandomi     ftgen         8, 0, iTabSize, -7, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1)
girandomh     ftgen         9, 0, iTabSize, -41, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv

opcode    PhaserSt, aa, aakkkKki
    ainL,ainR,krate,kdepth,kfreq,kstages,kfback,ishape    xin ; READ IN INPUT ARGUMENTS
    if ishape==1 then
     klfo      lfo                 kdepth*0.5, krate, 1                  ; LFO FOR THE PHASER (TRIANGULAR SHAPE)
    elseif ishape=2 then
     klfo      lfo                 kdepth*0.5, krate, 0                  ; LFO FOR THE PHASER (SINE SHAPE)
    elseif ishape==3 then
     klfo      lfo                 kdepth*0.5, krate, 2                  ; LFO FOR THE PHASER (SQUARE SHAPE)
    elseif ishape==4 then
     klfo      lfo                 kdepth, krate, 4                      ; LFO FOR THE PHASER (SAWTOOTH UP)
    elseif ishape==5 then
     klfo      lfo                 kdepth, krate, 5                      ; LFO FOR THE PHASER (SAWTOOTH DOWN)
    elseif ishape==6 then
     klfo      oscili              kdepth, krate, giExp                  ; LFO FOR THE PHASER (EXP)
    elseif ishape==7 then
     klfo      oscili              kdepth, krate, giLog                  ; LFO FOR THE PHASER (LOG)
    elseif ishape==8 then
     klfo      randomi             -kdepth*0.5, kdepth*0.5, krate*8      ; LFO FOR THE PHASER (RANDOMI SHAPE)
     klfo      portk               klfo, 1/(krate*8)                     ; SMOOTH CHANGES OF DIRECTION
    elseif ishape==9 then
     klfo      randomh             -kdepth*0.5, kdepth*0.5, krate        ; LFO FOR THE PHASER (RANDOMH SHAPE)
    endif    
    aoutL      phaser1             ainL, cpsoct((klfo+(kdepth*0.5)+kfreq)), kstages, kfback    ;PHASER1 IS APPLIED TO THE INPUT AUDIO
    aoutR      phaser1             ainR, cpsoct((klfo+(kdepth*0.5)+kfreq)), kstages, kfback    ;PHASER1 IS APPLIED TO THE INPUT AUDIO
               xout                aoutL,aoutR                            ;SEND AUDIO BACK TO CALLER INSTRUMENT
endop

 instr 1
kporttime      linseg              0,0.001,0.05
krate          cabbageGetValue     "rate"
kdepth         cabbageGetValue     "depth"
kdepth         portk               kdepth,kporttime
kfreq          cabbageGetValue     "freq"
kfreq          portk               kfreq,kporttime
kfback         cabbageGetValue     "fback"
kstages        cabbageGetValue     "stages"
klevel         cabbageGetValue     "level"
kmix           cabbageGetValue     "mix"
kshape         cabbageGetValue     "shape"
kshape         init                2
if changed:k(kshape)==1 then
               reinit              UPDATE_LFO_TABLE
endif
UPDATE_LFO_TABLE:
               tableicopy          99,i(kshape)
               cabbageSet          "LFOtable", "tableNumber", 99
rireturn

/* INPUT */
kinput         cabbageGetValue     "input"
if kinput==1 then
 a1            inch                1
 a2            =                   a1
elseif kinput==2 then
 a1,a2         ins
elseif kinput=3 then
 a1            vco2                0.1,200
 a2            =                   a1
else
 a1            pinkish             0.1
 a2            pinkish             0.1
endif

ktrig          changed             kshape,kstages                            ; reinitialise for i-rate parms
if ktrig=1 then
               reinit              RESTART_PHASER
endif
RESTART_PHASER:
aPhs1,aPhs2    PhaserSt            a1,a2,krate,kdepth*8,(kfreq*10)+4,kstages,kfback*0.9,i(kshape)    ; use stereo version to ensure lfo sync for random lfos

rireturn
a1             ntrpol              a1,aPhs1,kmix                            ; wet/dry mix
a2             ntrpol              a2,aPhs2,kmix
               outs                a1* klevel, a2* klevel
               endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>