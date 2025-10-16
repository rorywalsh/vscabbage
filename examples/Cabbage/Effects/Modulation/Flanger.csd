
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Flanger.csd
; Written by Iain McCurdy, 2012.

; Input        -  input source: 
;                 1. mono
;                 2. stereo
;                 3. test signal of pink noise
; Rate         -  rate of modulating LFO in hertz
; Depth        -  depth of modulation LFO in milliseconds
; Offset       -  offset of the modulation LFO in milliseconds
; Feedback     -  fraction of the output signal that is fed back into the input.
;                 This can be negative, resulting in a different frequency response
; LFO Shape    -  waveform shape for the modulating LFO:
;              1. parabola
;              2. sine
;              3. triangle
;              4. random interpolating linearly between values
;              5. random holding values until the next random value is generated

; Phase Offset - phase offset for the right channel LFO (can be used to create stereo effects)
; Mix          - dry/wet mix
; Level        - output level

<Cabbage>
form caption("Flanger") size(800,105), pluginId("flan"), guiMode("queue")
image         bounds(  0,  0,800,105), colour("lightgreen"), shape("rounded"), outlineColour("white"), outlineThickness(4) 
#define RSLIDER_ATTRIBUTES # colour("LightGreen"),  colour(230,255,230), trackerColour( 50,150, 50), textColour(  0, 30,  0) #

label    bounds( 10, 17, 80, 15), text("INPUT"), align("centre"), fontColour("DarkGrey")
listbox  bounds( 10, 35, 80, 60), channel("input"), items("MONO","STEREO","TEST"), value(2), align("centre"), colour(0,0,0,20), fontColour("white")
line     bounds(115, 10,190,  2)
label    bounds(175,  7, 70, 10), text("MODULATION"), fontColour("white"), colour(100,110,130)

rslider  bounds(105, 20, 70, 70), text("Rate"),     channel("rate"),  range(0.001, 40, 0.15, 0.5, 0.001),       $RSLIDER_ATTRIBUTES
rslider  bounds(175, 20, 70, 70), text("Depth"),    channel("depth"), range(0, 0.01, 0.005,1,0.0001),           $RSLIDER_ATTRIBUTES
rslider  bounds(245, 20, 70, 70), text("Offset"),   channel("delay"), range(0.00002, 0.1, 0.0001, 0.5, 0.0001), $RSLIDER_ATTRIBUTES
rslider  bounds(315, 20, 70, 70), text("Feedback"), channel("fback"), range(-1, 1, 0),                          $RSLIDER_ATTRIBUTES

checkbox bounds(390, 20, 80, 15), colour("yellow"),  channel("ThruZero"),  value(1), text("Thru.Zero"), fontColour:0(  0, 30,  0), fontColour:1(  0, 30,  0)
label    bounds(395, 47, 65, 12), text("LFO Shape:"), fontColour(  0, 30,  0)
combobox bounds(390, 60, 80, 18), channel("lfoshape"), value(2), items("parabola", "sine", "triangle", "randomi", "randomh")
label    bounds(105, 90,120, 12), text("Iain McCurdy |2012|"), align("left"), fontColour("DarkGrey")

label    bounds(480, 15, 90, 14), text("LFO Shape"), align("centre"), fontColour("DarkGrey")
gentable bounds(480, 30, 90, 55), tableNumber(99), channel("LFOtable"), fill(0), ampRange(0,1,1)

rslider  bounds(580, 20, 70, 70), text("Phase Offset"),      channel("PhaseOS"),   range(0, 0.5, 0), $RSLIDER_ATTRIBUTES
rslider  bounds(650, 20, 70, 70), text("Mix"),      channel("mix"),   range(0, 1.00, 0.5), $RSLIDER_ATTRIBUTES
rslider  bounds(720, 20, 70, 70), text("Level"),    channel("level"), range(0, 1.00, 1),   $RSLIDER_ATTRIBUTES
</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-dm0 -n
</CsOptions>
<CsInstruments>
; sr set by host
ksmps  =  32
nchnls =  2
0dbfs  =  1

;Author: Iain McCurdy (2012)
              seed          0
iTabSize      =             2048
i_            ftgen         99,0,2048,10,1
giparabola    ftgen         1, 0, iTabSize, 19, 0.5, 1, 180, 1        ; u-shape parabola for lfo
gisine        ftgen         2, 0, iTabSize, 19, 1, 0.5, 0,   0.5      ; sine-shape for lfo
gitriangle    ftgen         3, 0, iTabSize, 7, 0,2048/2,1,2048/2,0    ; triangle-shape for lfo
idiv          =             7
girandomi     ftgen         4, 0, iTabSize, -7, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1)
girandomh     ftgen         5, 0, iTabSize, -41, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv, rnd(1), idiv

opcode    Flanger,a,akkkkki
    ain,krate,kdepth,kdelay,kfback,klfoshape,iInitPhase    xin           ; read in input arguments
    iparabola    ftgenonce      0, 0, 131072, 19, 0.5, 1, 180, 1         ; u-shape parabola for lfo
    isine        ftgenonce      0, 0, 131072, 19, 1, 0.5, 0,   0.5       ; sine-shape for lfo
    itriangle    ftgenonce      0, 0, 131072, 7, 0,131072/2,1,131072/2,0 ; triangle-shape for lfo
    adlt        interp         kdelay                                    ; a new a-rate variable 'adlt' is created by interpolating the k-rate variable 'kdlt'
    if klfoshape==1 then
     amod        oscili        kdepth, krate, iparabola,iInitPhase       ; oscillator that makes use of the positive domain only u-shape parabola
    elseif klfoshape==2 then
     amod        oscili        kdepth, krate, isine,iInitPhase           ; oscillator that makes use of the positive domain only sine wave
    elseif klfoshape==3 then
     amod        oscili        kdepth, krate, itriangle,iInitPhase       ; oscillator that makes use of the positive domain only triangle
    elseif klfoshape==4 then    
     amod        randomi       0,kdepth,krate,1
    else    
     amod        randomh       0,kdepth,krate,1
    endif
    adlt         sum           adlt, amod                               ; static delay time and modulating delay time are summed
    adelsig      flanger       ain, adlt, kfback , 1.2                  ; flanger signal created
    adelsig      dcblock       adelsig
    aout         sum           ain*0.5, adelsig*0.5                     ; create dry/wet mix 
                 xout          aout                                     ; send audio back to caller instrument
endop

instr 1
    kinput       cabbageGetValue    "input"                             ; read in widgets
    krate        cabbageGetValue    "rate"
    kdepth       cabbageGetValue    "depth"
    kdelay       cabbageGetValue    "delay"
    kfback       cabbageGetValue    "fback"
    klevel       cabbageGetValue    "level"
    klfoshape    cabbageGetValue    "lfoshape"
    klfoshape    init               2
    ; UPDATE LFO TABLE DISPLAY
    if changed:k(klfoshape)==1 then
     reinit UPDATE_LFO_TABLE
    endif
    UPDATE_LFO_TABLE:
                 tableicopy         99, i(klfoshape)
                 cabbageSet         "LFOtable", "tableNumber", 99
    rireturn

    kPhaseOS     cabbageGetValue    "PhaseOS"
    kThruZero    cabbageGetValue    "ThruZero"
    kmix         cabbageGetValue    "mix"
    
    if kinput==1 then
     a1           inch               1
     a2           =                  a1
    elseif kinput==2 then
     a1,a2        ins                                                    ; read live stereo audio input
    else
     a1          pinkish            0.2                                 ; for testing...
     a2          pinkish            0.2
    endif
    kporttime    linseg             0,0.001,0.1
    kdelay       portk              kdelay, kporttime

    if changed:k(kPhaseOS)==1 then
     reinit RestartFlanger
    endif
    RestartFlanger:
    afla1        Flanger            a1,krate,kdepth,kdelay,kfback,klfoshape,0           ; call udo (left channel)
    afla2        Flanger            a2,krate,kdepth,kdelay,kfback,klfoshape,i(kPhaseOS) ; call udo (right channel)
    rireturn

    if kThruZero==1 then                                                       ; if 'Thru.Zero' mode is selected...
     a1          delay              a1, 0.00002
     a2          delay              a2, 0.00002
     a1          ntrpol             -a1,afla1,kmix                             ; invert delayed dry signal and mix with flanger signal
     a2          ntrpol             -a2,afla2,kmix
    else                                                                       ; otherwise... (standard flanger)
     a1          ntrpol             a1,afla1,kmix                              ; create mix between dry signal and flanger signal
     a2          ntrpol             a2,afla2,kmix
    endif
                 outs               a1 * klevel, a2 * klevel                   ; send audio to outputs, scale amplitude according to GUI knob value
endin

</CsInstruments>

<CsScore>
i 1 0 36000
</CsScore>

</CsoundSynthesizer>