
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; DelayGrain.csd
; Iain McCurdy, 2013, 2024


; CONTROLS
; --------
; Delay               --  range of delay times possible (in seconds)
; Grain Size          --  range of possible grain sizes (in seconds)
; Density             --  grain density in grains per second (note that the addition of delay will disrupt the regularity of grains)
; Transpose           --  range of transpositions (in semitones). Gaussian distribution about the centre value.
; Random Interval     --  similar to transposition except that a random intervallic transposition step is applied.
;                          Interval defined below
; Interval            --  Intervallic step (in octaves) used in the 'Random Interval' mechanism above.
; Input Gain          --  Gain control applied to the input signal

; Pan Spread          --  random panning spread of grains
; Amp Spread          --  random amplitude spread of grains
; Filter Spread       --  random low-pass filter cutoff spread of grains
; Ampl Decay          --  the larger this value, the more grains are delayed, the more their amplitudes will be lowered
; Rev. Prob.          --  probability of material within the grains being played backwards: 0 = all forwards
;                                                                                 1 = all backwards
;                                                                                 0.5 = 50:50
;                         reversal might be hard to hear unless grain size is large

; Mix                 --  dry/wet mix
; Feedback            --  amount of the output signal fed back into the input. 
;                          If density and grain size are large, feedback can become uncontrolled.
;                          To mitigate against this becoming catastrophic, 
;                          the feedback signal is soft-clipped near the maximum allowed amplitude.
; INPUT               --  choose input between left channel (mono) and stereo (both channels processed)
; FREEZE              --  writing into the buffer is paused
; Grain Env.          --  sets the amplitude enveloping window for each grain
;                         Hanning: natural sounding soft attack, soft decay envelope
;                         Half-sine: like the hanning but with a slightly sharper attack and decay
;                         Decay 1: a percussive decay envelope with linear segments
;                         Decay 2: a percussive decay envelope with a exponential decay segment. Probably more natural sounding than 'Decay 1' but longer grain sizes may be necessary
;                         Gate: sharp attack and decay. Rather synthetic sounding.
; Delay Distr.        --  random delay time distribution: exponential, linear or logarithmic. Effect are quite subtle but exponential might be most natural sounding.
; Level               --  output level (both dry and wet)

<Cabbage>
form caption("Delay Grain") size(640, 510), pluginId("DGrn"), colour(70,70,70), guiMode("queue")

image bounds(0,0,640,510), colour(0,0,0,0), outlineColour(170,170,170), outlineThickness(5), corners(5)

#define FONT_COLOUR fontColour(205,205,205)
#define SLIDER_STYLE trackerColour(205,205,205)
#define SLIDER_STYLE2 trackerColour("Black"), colour("Lime")
#define SLIDER_STYLE3 trackerColour(255,255,255), alpha(0.5)
#define SLIDER_STYLE4 trackerColour(255,255,255,100), valueTextBox(1), fontColour(205,205,205), textColour(205,205,205)
#define DIAL_STYLE trackerColour(205,205,205), valueTextBox(1), fontColour(205,205,205), textColour(205,205,205)

label     bounds(  5, 11,630, 11), text("D E L A Y"), align("centre"), $FONT_COLOUR
hslider   bounds( 11, 32,617,  6), channel("Dly"), range(0, 5, 0.01,1,0.0001), $SLIDER_STYLE2
hrange    bounds(  5, 25,630, 20), channel("Dly1","Dly2"), range(0, 5, 0.01:0.5, 1, 0.0001), $SLIDER_STYLE3

label     bounds(  5, 61,630, 11), text("G R A I N   S I Z E"), align("centre"), $FONT_COLOUR
hslider   bounds( 11, 82,617,  6), channel("GSize"), range(0.005, 2, 0.01,0.5,0.0001), $SLIDER_STYLE2
hrange    bounds(  5, 75,630, 20), channel("GSize1","GSize2"), range(0.005, 2, 0.01:0.09, 0.5, 0.0001), $SLIDER_STYLE3

label     bounds(  5,111,630, 11), text("D E N S I T Y"), align("centre"), $FONT_COLOUR
hslider   bounds(  9,120,620, 20), channel("Dens"), range(0.2, 2000,200,0.5,0.1), $SLIDER_STYLE4

label     bounds(  5,161,630, 11), text("T R A N S P O S E"), align("centre"), $FONT_COLOUR
hrange    bounds(  5,155,630, 40), channel("Trns1","Trns2"), range(-24, 24, 0:0, 1, 0.01), fontColour("White"), valueTextBox(1) $SLIDER_STYLE3

label     bounds(  5,211,630, 11), text("R A N D O M   I N T E R V A L   ( S T E P S )"), align("centre"), $FONT_COLOUR
image     bounds( 15,233,610,  4), colour("Black")
hslider   bounds( 11,232,617,  6), channel("RndInt"), range(-3, 3, 0.01,1,0.0001), $SLIDER_STYLE2
hrange    bounds(  5,225,630, 20), channel("RndInt1","RndInt2"), range(-3, 3, 0:0, 1, 0.001), $SLIDER_STYLE3

label     bounds(  5,261,630, 11), text("I N T E R V A L    ( O C T A V E S )"), align("centre"), $FONT_COLOUR
hslider   bounds(  9,270,620, 20), channel("Int"), range(0, 1, 1), valueTextBox(1), $SLIDER_STYLE4

rslider   bounds(  5,310, 70, 90), channel("InGain"), text("Input Gain"), range(0, 1.00, 1,0.5), $DIAL_STYLE
rslider   bounds( 85,310, 70, 90), channel("PanSpread"), text("Pan Spread"), range(0, 1.00, 0.5,1,0.001), $DIAL_STYLE
rslider   bounds(165,310, 70, 90), channel("AmpSpread"), text("Amp Spread"), range(0, 1.00, 0.5,1,0.001), $DIAL_STYLE
rslider   bounds(245,310, 70, 90), channel("FiltSpread"), text("Filter Spread"), range(0, 1.00, 0.5,1,0.001), $DIAL_STYLE
rslider   bounds(325,310, 70, 90), channel("ampdecay"), text("Amp. Decay"), range(0, 1.00, 0.5,1,0.001), $DIAL_STYLE
rslider   bounds(405,310, 70, 90), channel("reverse"), text("Rev. Prob."), range(0, 1.00, 0,1,0.001), $DIAL_STYLE
rslider   bounds(485,310, 70, 90), channel("mix"), text("Mix"), range(0, 1.00, 1,1,0.001), $DIAL_STYLE
rslider   bounds(565,310, 70, 90), channel("fb"), text("Feedback"), range(0, 0.9, 0), $DIAL_STYLE

label     bounds( 15,415, 80, 14), text("INPUT"), align("centre"), $FONT_COLOUR
combobox  bounds( 15,430, 80, 20), items("left","stereo"), channel("input"), value(2)

button    bounds(135,430, 80, 20), text("FREEZE","FREEZE"), channel("freeze"), colour:0(0,0,0), colour:1(180,180,60), fontColour:0(100,100,20), fontColour:1(255,255,200)

image     bounds(245,415,145, 36), colour(0,0,0,0)
{
label     bounds(  0,  0,145, 14), text("GRAIN ENVELOPE"), align("centre"), $FONT_COLOUR
combobox  bounds(  0, 15,100, 22), channel("window"), value(1), text("Hanning","Half Sine","Decay 1","Decay 2","Gate")
gentable  bounds(105, 16, 40, 20), tableNumber(1), ampRange(0,1,1), channel("WindTable"), fill(0)
}

image     bounds(425,415,145, 36), colour(0,0,0,0)
{
label     bounds(  0,  0,140, 14), text("DELAY DISTRIBUTION"), align("centre"), $FONT_COLOUR
combobox  bounds(  0, 15,100, 22), channel("DlyDst"), value(1), text("Exponential","Uniform","Gaussian")
gentable  bounds(105, 16, 40, 20), tableNumber(2), ampRange(0,1,2), channel("DistTable"), fill(0)
}

hslider   bounds( 11,470,617, 20), channel("level"), text("Level"), range(0, 2.00, 1, 0.5, 0.001), $SLIDER_STYLE4

label     bounds( 5,495, 110, 12), text("Iain McCurdy |2013|")

</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-dm0 -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps         =     64    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls        =     2     ; NUMBER OF CHANNELS (2=STEREO)
0dbfs         =     1

;Author: Iain McCurdy (2013, 2024)

giTabSize = 2^8
i_         ftgen  1, 0, giTabSize, -2, 0
i_         ftgen  2, 0, giTabSize, -2, 0

; window functions
giwfn7     ftgen  0,  0, giTabSize,  20, 2, 1                                            ; HANNING WINDOW
giwfn1     ftgen  0,  0, giTabSize,  9,  0.5, 1,    0                                    ; HALF SINE
giwfn2     ftgen  0,  0, giTabSize,  7,  0, 0.05*giTabSize, 1, 0.95*giTabSize, 0         ; PERCUSSIVE - STRAIGHT SEGMENTS
giwfn3     ftgen  0,  0, giTabSize, 16,  0, 0.05*giTabSize, 0, 1, 0.95*giTabSize, -2,  0 ; PERCUSSIVE - EXPONENTIAL SEGMENTS
giwfn4     ftgen  0,  0, giTabSize,  7,  0, 0.05*giTabSize, 1, 0.9*giTabSize, 1, 0.05*giTabSize, 0 ; GATE - WITH ANTI-CLICK RAMP UP AND RAMP DOWN SEGMENTS

giwfn5     ftgen  0,  0, 512,  7,  0, 128000, 1, 3072,       0           ; REVERSE PERCUSSIVE - STRAIGHT SEGMENTS
giwfn6     ftgen  0,  0, 512,  5,  0.001, 128000, 1, 3072,   0.001       ; REVERSE PERCUSSIVE - EXPONENTIAL SEGMENTS

giwindows  ftgen  0,  0, 8, -2, giwfn7, giwfn1, giwfn2, giwfn3, giwfn4

giBufL     ftgen  0, 0, 1048576, -2, 0                                      ; function table used for storing audio
giBufR     ftgen  0, 0, 1048576, -2, 0                                      ; function table used for storing audio

gigaussian ftgen  0, 0, 4096, 20, 6, 1, 1                                   ; a gaussian distribution

gaGMixL, gaGMixR  init  0  ; initialise stereo grain signal



; create distribution tables (for display only)
             schedule          99,0,0.1
instr 99
giExp        ftgen             0,  0, giTabSize, -2, 0
giUni        ftgen             0,  0, giTabSize, 7, 1, giTabSize, 1
giGau        ftgen             0,  0, giTabSize, 20, 6, 1, 2
kCnt         =                 0
while kCnt<giTabSize do
kValE        expcurve          kCnt/(giTabSize-1), 100
             tablew            kValE,1-(kCnt/(giTabSize-1)),giExp,1
kCnt         +=                1
od
             turnoff
endin




instr  1                                    ; grain triggering instrument
kGSize1     cabbageGetValue    "GSize1"     ; grain size limit 1
kGSize2     cabbageGetValue    "GSize2"     ; grain size limit 2
kDens       cabbageGetValue    "Dens"       ; grain density
kDly1       cabbageGetValue    "Dly1"       ; delay time limit 1
kDly2       cabbageGetValue    "Dly2"       ; delay time limit 2
kTrns1,kT1  cabbageGetValue    "Trns1"      ; transposition in semitones
kTrns2,kT2  cabbageGetValue    "Trns2"
kTrnsLink   cabbageGetValue "TrnsLink"
if kTrnsLink==1 then                                                   ; link transpositions
 cabbageSetValue "Trns1",kTrns2,kT2
 cabbageSetValue "Trns2",kTrns1,kT1
endif




kPanSpread  cabbageGetValue    "PanSpread"  ; random panning spread
kAmpSpread  cabbageGetValue    "AmpSpread"  ; random amplitude spread
kFiltSpread cabbageGetValue    "FiltSpread" ; random filter spread
kreverse    cabbageGetValue    "reverse"    ; reversal probability
kampdecay   cabbageGetValue    "ampdecay"   ; amount of delay->amplitude attenuation
kwindow     cabbageGetValue    "window"     ; window
kDlyDst     cabbageGetValue    "DlyDst"     ; delay time distribution
gkfreeze    cabbageGetValue    "freeze"
gkfb        cabbageGetValue    "fb"
kInGain     cabbageGetValue    "InGain"

if changed:k(kwindow,kDlyDst)==1 then
 reinit REBUILD_TABLES
endif
REBUILD_TABLES:
            tableicopy         1, giwfn7 + i(kwindow) - 1
            cabbageSet         "WindTable", "tableNumber", 1
            tableicopy         2, giExp + i(kDlyDst) - 1
            cabbageSet         "DistTable", "tableNumber", 2
rireturn

kmix        cabbageGetValue    "mix"        ; dry/wet mix
klevel      cabbageGetValue    "level"      ; output level (both dry and wet signals)

kinput      cabbageGetValue    "input"
aL          inch               1            ; read left audio input
if kinput==1 then
 aR = aL
else
 aR          inch              2            ; read right audio input
endif
;aL, aR      diskin2            "/Users/iainmccurdy/Documents/iainmccurdy.org/CsoundRealtimeExamples/SourceMaterials/ClassicalGuitar.wav",1,0,1

aL           *=                a(kInGain)
aR           *=                a(kInGain)

; feedback
gaGMixL      dcblock2          gaGMixL
gaGMixR      dcblock2          gaGMixR
gaGMixL      clip              gaGMixL, 0, 0dbfs*0.9
gaGMixR      clip              gaGMixR, 0, 0dbfs*0.9
aL           +=                gaGMixL*gkfb
aR           +=                gaGMixR*gkfb
             clear             gaGMixL, gaGMixR                              ; clear global audio variables


             outs              aL * klevel * (1-kmix), aR * klevel * (1-kmix)

/* WRITE TO BUFFER TABLES */
ilen        =                  ftlen(giBufL)     ; table length (in samples)
if gkfreeze==0 then
 aptr        phasor            sr/ilen           ; phase pointer used to write to table
 aptr        =                 aptr * ilen       ; reScale pointer according to table size
             tablew            aL, aptr, giBufL  ; write audio to table
             tablew            aR, aptr, giBufR  ; write audio to table
 kptr        downsamp          aptr              ; downsamp pointer to k-rate
endif

ktrig       metro              kDens             ; grain trigger

/* GRAIN SIZE */
kGSize       random            0,1                           ; random value 0 - 1
kMinGSize    min               kGSize1, kGSize2              ; find minimum grain size limit
kMaxGSize    max               kGSize1, kGSize2              ; find maximum grain size limit
kGSize       scale             kGSize, kMaxGSize, kMinGSize  ; reScale random value according to minimum and maximum limits

/* DELAY TIME */
kDly         random            0, 1          ; uniform random value 0 - 1
if kDlyDst=1 then                            ; if delay time distribution is exponential
 kDly       table              kDly, giExp, 1     ; exponential distribution range 0 - 1
elseif kDlyDst=3 then                        ; .. or if logarithmic
 kDly        gauss             0.5           ; range -0.5 to 0.5. Modal value = 0
 kDly        +=                0.5           ; range 0 to 1. Modal value = 0.5
endif                                        ; (other linear so do not alter)
if kDly1=kDly2 then
 kMinDly     =                 kDly1         ; delays can't be the same value!!   
 kMaxDly     =                 kDly2 + 0.001
else  
 kMinDly     min               kDly1, kDly2  ; find minimum delay time limit
 kMaxDly     max               kDly1, kDly2  ; find maximum delay time limit
endif
ioffset      =                 sr                     ; delay offset (can't read at same location as write pointer!)
ioffset      =                 1/ioffset
kDly         scale             kDly, kMaxDly, kMinDly ; distribution reScaled to match the user defined limits

/* CALL GRAIN */
;                                        p1 p2          p3     p4   p5         p6       p7   p8              p9             p10       p11         p12     p13        p14         p15    p16
             schedkwhen        ktrig,0,0,2, kDly+0.0001,kGSize,kptr,kPanSpread,kreverse,kDly,kMinDly+ioffset,kMaxDly+0.0001,kampdecay,klevel*kmix,kwindow,kAmpSpread,kFiltSpread,kTrns1,kTrns2  ; call grain instrument

; random value indicators
cabbageSetValue "GSize",kGSize,ktrig
cabbageSetValue "Dly",kDly,ktrig
  endin

instr  2        ; grain instrument
iGStart     =                  p4                      ; grain start position (in samples)
ispread     =                  p5                      ; random panning spread
ireverse    =                  (rnd(1) > p6 ? 1 : -1)  ; decide fwd/bwd status
iwindow     table              p12 - 1, giwindows      ; amplitude envelope shape for this grain


/* AMPLITUDE CONTROL */
idly        =                  p7                      ; delay time
iMinDly     =                  p8                      ; minimum delay
iMaxDly     =                  p9                      ; maximum delay
iampdecay   =                  p10                     ; amount of delaytime->amplitude attenuation
ilevel      =                  p11                     ; grain output level
iAmpSpread  =                  p13
iFiltSpread =                  p14

iRto        divz               idly - iMinDly , iMaxDly - iMinDly, 0  ; create delay:amplitude ration (safely)
iamp        =                  (1 - iRto) ^ 2                         ; invert range
iamp        ntrpol             1, iamp, iampdecay                     ; mix flat amplitude to scaled amplitude according to user setting
iRndAmp     random             1 - iAmpSpread, 1                      ; random amplitude value for this grain
iamp        =                  iamp * iRndAmp                         ; apply random amplitude

; TRANSPOSITION
iTrns        =                 gauss:i(0.5) + 0.5                     ; random value range 0 to 1. Gaussian distribution.   
iTrns        =                 p15 + (iTrns*(p16-p15))                ; rescale
             cabbageSetValue   "Trns",iTrns                           ; send to widget indicator
iRto         =                 semitone(iTrns)

; RANDOM INTERVAL
iRndInt1     cabbageGetValue   "RndInt1"
iRndInt2     cabbageGetValue   "RndInt2"
iInt         cabbageGetValue   "Int"
iOct         random            iRndInt1,iRndInt2
             cabbageSetValue   "RndInt",iOct
iRto         *=                octave(round(iOct)*iInt)

if iRto>1 then
 iStrtOS     =                 (iRto-1)  * sr * p3
else
 iStrtOS     =                 0
endif

; ENVELOPE
if iwindow==103 then     ; linear decay
 p3          =                 p3 < 0.002 ? 0.002 : p3
 aenv        linseg            0,  0.001, 1, p3-0.001, 0
elseif iwindow==104 then ; exponential decay
 p3          =                 p3 < 0.02 ? 0.02 : p3
 aenv        transeg           0,  0.001, 0, 1, p3-0.001, -4, 0
elseif iwindow==105 then ; gate
 p3          =                 p3 < 0.02 ? 0.02 : p3
 aenv        linseg            0,  0.001, 1, p3-0.002, 1, 0.001, 0
else                     ; table-based envelope
 aenv        oscili            iamp, 1/p3, iwindow
endif

; CREATE GRAIN
aline        line              iGStart - iStrtOS, p3, iGStart - iStrtOS + (p3 * iRto * sr * ireverse)  ; grain pointer
aL           tablei            aline, giBufL, 0, 0, 1                                                  ; read audio from table 
aR           tablei            aline, giBufR, 0, 0, 1                                                  ; read audio from table

if iFiltSpread>0 then
 iRndCfOct   random            14 - (iFiltSpread * 10), 14
 iRndCf      =                 cpsoct(iRndCfOct)
 aL          butlp             aL, iRndCf
 aR          butlp             aR, iRndCf
endif

ipan         random            0.5 - (ispread * 0.5), 0.5 + (ispread * 0.5)  ; random pan position for this grain
gaGMixL      =                 gaGMixL + (aL * aenv * ipan*ilevel)           ; left channel mix added to global variable
gaGMixR      =                 gaGMixR + (aR * aenv * (1 - ipan) * ilevel)   ; right channel mix added to global variable
endin

instr  3                                                                     ; output instrument (always on)
             outs              gaGMixL, gaGMixR                              ; send global audio signals to output
endin



</CsInstruments>

<CsScore>
i 1 0.1 z                                           ; read audio, write to buffers, call grains.
i 3 0   z                                           ; output
</CsScore>

</CsoundSynthesizer>