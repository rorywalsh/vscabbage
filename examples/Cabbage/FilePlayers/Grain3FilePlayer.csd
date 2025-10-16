
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Grain3FilePlayer.csd
; Written by Iain McCurdy, 2015, 2024

; File player based around the granular synthesis opcode, 'grain3'.
; A second voice can be activated (basically another parallel granular synthesiser) with parameter variations of density, transposition, pointer location (Phs) and delay.
; Two modes of playback are available: manual pointer and speed
; The pointer and grain density can also be modulated by right-clicking and dragging on the waveform view.
;  * This will also start and stop the grain producing instrument.
;  * In click-and-drag mode mouse X position is mapped to pointer position and mouse Y position controls grain density.
;      Y axis position can also be used to control a low-pass and high-pass filter.
 
; If played from the MIDI keyboard, note number translates to 'Density' and key velocity translates to amplitude for the grain stream for that note.

; In 'Pointer' mode pointer position is controlled by the long 'Manual' slider with an optional amount of randomisation determined ny the 'Phs.Mod' slider.  

; Selecting 'Speed' pointer mode bring up some additional controls:
; Speed        -    speed ratio
; Freeze       -    freezes the pointer at its present locations 
; Range        -    ratio of the full sound file duration that will be played back. 1=the_entire_file, 0.5=half_the_file, etc. 
; Shape        -    shape of playback function:     'Phasor' looping in a single direction
;                            'Tri' back and forth looping
; The 'Manual' control functions as an pointer offset when using 'Speed' pointer mode

; Size         -    size of the grains
; Density      -    grains per second
; LINK →       -    if this button is activated, the actual density value will be scaled inversely in relation to changes made to Size.
;                    this means that, for example, as Size is increased, Density will be decreased in ratio.
;                    At the point the LINK → button is pressed, a ratio of 1:1 between Size and Density is set. To reset this initial ratio, toggle the LINK → button.
; Transpose    -    transposition in semitones
; Window       -    window shape that envelopes each individual grain
; Lowpass      -    engages a lowpass filter, the cutoff frequency of which moves according to the setting for 'Transpose'. 
;                    This can be useful in suppressing quantisation artefacts when Transpose is set to a low value.
;                    It is operational both in MIDI keyboard and standard modes of operation.

; --Randomisation--
; Trans.Mod.    -    randomisation of transposition (in octaves)
; Ptr.Mod.      -    randomisation of pointer position
; Dens Mod.     -    randomisation of grain density
; Size Mod.     -    randomisation of grain size

; --LFO--
; Density       -    depth of LFO modulation of grain density
; Amplitude     -    depth of LFO modulation of grain amplitude
; Size          -    depth of LFO modulation of grain size
; Filter        -    depth of LFO modulation of a low-pass filter cutoff (zero to bypass filter)
; Res.          -    resonance of the lowpass filter (fixed, no LFO)
; Rate          -    rate of LFO modulation of grain density
; Shape         -    LFO shape

; --Voice 2--
; Dens.Ratio    -    ratio of grain density of voice 2 with respect to the main voice (also adjustable using the adjacent number box for precise value input)
; Ptr.Diff.     -    pointer position offset of voice 2 with respect to the main voice (also adjustable using the adjacent number box for precise value input)
; Trans.Diff.   -    transposition offset of voice 2 with respect to the main voice (also adjustable using the adjacent number box for precise value input)
; Delay         -    a delay applied to voice 2 which is defined as a ratio of the gap between grains (therefore delay time will be inversely proportional to garin density)
;                    This is a little like a phase offset for voice 2 with respect to that of the main voice.
;                    When using this control 'Dens.Ratio' should be '1' otherwise continuous temporally shifting between the grains of voice 2 and the main voice will be occurring anyway.

; --Envelope--
; Attack        -    amplitude envelope attack time for the envelope applied to complete notes
; Release       -    amplitude envelope release time for the envelope applied to complete notes

; --Control--
; MIDI Ref.     -    MIDI note that represent unison (no transposition) for when using the MIDI keyboard
; Level         -    output amplitude control

<Cabbage>
form caption("grain3 File Player") size(1150,560), colour(0,0,0), pluginId("G3FP"), guiMode("queue")
image                    bounds(  0,  0,1150,560), file("DarkBrushedMetal.jpeg"), colour( 70, 35, 30), outlineColour("White"), shape("sharp"), line(3)

#define RSliderStyle trackerColour(170,135,130), trackerColour(170,135,130), trackerThickness(.1), textColour("white"), outlineColour( 50, 15, 10), colour( 90, 45, 50), valueTextBox(1)
#define HSliderStyle trackerColour(170,135,130), trackerColour(170,135,130), trackerThickness(.1), textColour("white"), outlineColour( 50, 15, 10), colour( 90, 45, 50), valueTextBox(0)

soundfiler  bounds(  5,  5,1140,175), channel("beg","len"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label       bounds(  7,  5, 560, 14), text(""), align(left), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")
image       bounds(  5,  5,   1,175), channel("indicator"), visible(1)

hslider     bounds(  0,180,1150, 15), channel("phs"),   range( 0,1,0,1,0.0001), $HSliderStyle

filebutton  bounds(  5,210,  80, 25), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse")
checkbox    bounds(  5,240,  95, 20), channel("PlayStop"), text("Play/Stop"), fontColour:0("white"), fontColour:1("white"), colour:0( 85, 85,0), colour:1(255,255,0)
label       bounds(  5,263, 180, 10), text("[or right-click and drag on waveform]"), fontColour("white"), align("left")
checkbox    bounds(  5,280,  95, 15), channel("YFilters"), text("Y-Filters"), fontColour:0("white"), fontColour:1("white"), colour:0( 85, 85,0), colour:1(255,255,0), value(1)

label       bounds(100,215, 75, 13), text("Ptr.Mode"), fontColour("white")
combobox    bounds(100,230, 75, 18), channel("PhsMode"), items("Manual", "Speed"), value(2),fontColour("white")

image       bounds(170,215,270, 90), colour(0,0,0,0), channel("speedControls"), 
{
rslider     bounds(  0,  0, 90, 90), channel("spd"),     range( -2.00, 2.00, 1), text("Speed"), $RSliderStyle
button      bounds( 80, 15, 60, 18), channel("freeze"),  colour:0(  0,  0,  0),  colour:1(170,170,250), text("Freeze","Freeze"), fontColour:0(70,70,70), fontColour:1(255,255,255)
rslider     bounds(130,  0, 90, 90), channel("range"),   range(0.01,  1,  1),              text("Range"), $RSliderStyle
label       bounds(210,  0, 60, 13), text("Shape"), fontColour("white")
combobox    bounds(210, 15, 60, 18), channel("shape"), items("phasor", "tri."), value(1), fontColour("white")
}

rslider     bounds(430,215, 90, 90), channel("dur"),     range(0.01,5.00,0.15,0.5,0.001), text("Size"), $RSliderStyle
rslider     bounds(500,215, 90, 90), channel("dens"),    range(0.05, 500,  20, 0.25),     text("Density"), $RSliderStyle
image       bounds(475,206,  1,  8), colour("silver")
image       bounds(475,206, 69,  1), colour("silver")
image       bounds(544,206,  1,  8), colour("silver")
button      bounds(485,200, 50, 13), channel("link"), text("LINK →","LINK →"), value(0), latched(1), colour:0(0,0,0), colour:1(200,200,50), fontColour:0(250,250,250), fontColour:1( 0, 0, 0)
rslider     bounds(570,215, 90, 90), channel("pch"),     range(-8,8,1,1,0.001),              text("Transpose"), $RSliderStyle
label       bounds(655,210, 75, 13), text("Window"), fontColour("white")
combobox    bounds(655,225, 75, 18), channel("wfn"), items("Hanning", "Half Sine", "Triangle", "Perc.1", "Perc.2", "Perc 3", "Gate", "Rev.Perc.1", "Rev.Perc.2", "Rev.Perc.3"), value(1),fontColour("white")
gentable    bounds(655,245, 75, 25), tableNumber(1001), channel("WindowTab"), ampRange(0,1,1001), fill(0)
checkbox    bounds(655,280, 75, 18), channel("LPF"), text("Lowpass"), fontColour:0("White"), fontColour:1("White"), colour:0( 85, 85,0), colour:1(255,255,0)

image       bounds(740,202,300,110), colour(0,0,0,0), outlineColour("grey"), outlineThickness(1), shape("sharp"), plant("randomise"), 
{ 
label       bounds(  0,  3,320,  8), text("R  A  N  D  O  M  I  S  E"), fontColour("white")
rslider     bounds(  0, 13, 90, 90), channel("fmd"),     range(    0, 3,   0,0.5,0.0001), text("Trans.Mod."), $RSliderStyle
rslider     bounds( 70, 13, 90, 90), channel("pmd"),     range(    0, 1,    0,0.25,0.00001),  text("Ptr.Mod."), $RSliderStyle
rslider     bounds(140, 13, 90, 90), channel("DensRnd"), range(    0, 2,    0), text("Dens.Mod."), $RSliderStyle
rslider     bounds(210, 13, 90, 90), channel("SizeRnd"), range(    0, 8,    0), text("Size.Mod."), $RSliderStyle
}

label      bounds(1060,231,15,13), text("V1")
label      bounds(1060,246,15,13), text("V2")
label      bounds(1080,215,15,13), text("L")
label      bounds(1095,215,15,13), text("R")
checkbox   bounds(1080,230,15,15), channel("V1L"), value(1), colour:0( 85, 85,0), colour:1(255,255,0)
checkbox   bounds(1095,230,15,15), channel("V1R"), value(1), colour:0( 85, 85,0), colour:1(255,255,0)
checkbox   bounds(1080,245,15,15), channel("V2L"), value(1), colour:0( 85, 85,0), colour:1(255,255,0)
checkbox   bounds(1095,245,15,15), channel("V2R"), value(1), colour:0( 85, 85,0), colour:1(255,255,0)

image      bounds(  5,320,375,110), colour(0,0,0,0), outlineColour("grey"), outlineThickness(1), shape("sharp"), plant("dual"), 
{ 
label      bounds(  0,  3,375,  8), text("V  O  I  C  E     2"), fontColour("white")
checkbox   bounds( 10, 30, 70, 20), channel("DualOnOff"), text("On/Off"), fontColour:0("white"), fontColour:1("white"), colour:0( 85, 85,0), colour:1(255,255,0)
rslider    bounds( 70, 13, 90, 90), channel("DensRatio"),  range(0.5,2,1,0.64,0.00001), text("Dens.Ratio"), $RSliderStyle
rslider    bounds(140, 13, 90, 90), channel("PtrDiff"),    range(-1,1,0,1,0.00001), text("Ptr.Diff."), $RSliderStyle
rslider    bounds(210, 13, 90, 90), channel("TransDiff"),  range(-2,2,0,1,0.00001), text("Trans.Diff."), $RSliderStyle
rslider    bounds(280, 13, 90, 90), channel("Delay"),      range(0,1,0,1,0.00001), text("Delay"), $RSliderStyle
}

image      bounds(390,320,570,110), colour(0,0,0,0), outlineColour("grey"), outlineThickness(1), shape("sharp"), plant("LFO"),
{
label      bounds(  0,  3,570,  8), text("L  F  O"), fontColour("white")
rslider    bounds( 20, 13, 90, 90), channel("DensLFODep"), range(-4, 4, 0, 1, 0.001),       text("Density"),   $RSliderStyle
rslider    bounds( 90, 13, 90, 90), channel("AmpLFODep"),  range(-1, 1, 0, 1, 0.001),       text("Amplitude"), $RSliderStyle
rslider    bounds(160, 13, 90, 90), channel("SizeLFODep"), range(-2, 2, 0, 1, 0.001),       text("Size"),      $RSliderStyle
rslider    bounds(230, 13, 90, 90), channel("FiltLFODep"),  range(-4, 4, 0, 1, 0.001),  text("Filter"),  $RSliderStyle
rslider    bounds(300, 13, 90, 90), channel("FiltRes"),  range(0, 1, 0, 0.5),  text("Res."),  $RSliderStyle
rslider    bounds(370, 13, 90, 90), channel("LFORte"),     range(0.01, 8, 0.1, 0.5, 0.001),  text("Rate"),  $RSliderStyle
label      bounds(470, 15, 70, 13), text("Shape"), fontColour("white")
combobox   bounds(470, 30, 70, 20), channel("LFOShape"), items("Sine","Rand."), value(1)
}

image      bounds(970,320,175,110), colour(0,0,0,0), outlineColour("grey"), outlineThickness(1), shape("sharp"), plant("envelope"),
{
label      bounds(  0,  3,160,  8), text("E   N   V   E   L   O   P   E"), fontColour("white")
rslider    bounds( 10, 13, 90, 90), channel("AttTim"),    range(0,    5, 0.05, 0.5, 0.001), text("Attack"), $RSliderStyle
rslider    bounds( 80, 13, 90, 90), channel("RelTim"),    range(0.01, 5, 0.05, 0.5, 0.001), text("Release"), $RSliderStyle
}

image      bounds(   5,440,175,110), colour(0,0,0,0), outlineColour("grey"), outlineThickness(1), shape("sharp"), plant("control"), 
{ 
label      bounds(   0,  3,160,  8), text("C   O   N   T   R   O   L"), fontColour("white")
rslider    bounds(  10, 13, 90, 90), channel("MidiRef"),   range(0,127,60, 1, 1),   text("MIDI Ref."), $RSliderStyle
rslider    bounds(  80, 13, 90, 90), channel("level"),     range(  0,  3.00, 0.7, 0.5, 0.001), text("Level"), $RSliderStyle
}
                                  
keyboard   bounds(195,450,940, 90)

label      bounds(1020,545,120, 12), text("Iain McCurdy |2014|"), align("right"), fontColour("silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -+rtmidi=NULL -M0 -dm0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 64
nchnls = 2
0dbfs  = 1

               massign         0,3
gichans        init            0
giReady        init            0
gSfilepath     init            ""

icurve = -4
; WINDOWING FUNCTIONS USED TO DYNAMICALLY SHAPE THE GRAINS
; NUM | INIT_TIME | SIZE | GEN_ROUTINE | PARTIAL_NUM | STRENGTH | PHASE
; GRAIN ENVELOPE WINDOW FUNCTION TABLES:
iTabSize  =        131072
giwfn1    ftgen    0,  0, iTabSize,  20,   2, 1                                                      ; HANNING
giwfn2    ftgen    0,  0, iTabSize,  9,    0.5, 1, 0                                                 ; HALF SINE
giwfn3    ftgen    0,  0, iTabSize,  7,    0, iTabSize/2,      1, iTabSize/2,       0                ; TRIANGLE
giwfn4    ftgen    0,  0, iTabSize,  7,    0, iTabSize*0.03,   1, iTabSize*0.97,    0                ; PERCUSSIVE - STRAIGHT SEGMENTS
giwfn5    ftgen    0,  0, iTabSize,  5, .001, iTabSize*0.03,   1, iTabSize*0.97, .001                ; PERCUSSIVE - EXPONENTIAL SEGMENTS
giwfn6    ftgen    0,  0, iTabSize, 16,    0, iTabSize*0.03,icurve, 1, iTabSize*0.97,icurve, 0       ; PERCUSSIVE - FAST ATTACK, FAST DECAY
giwfn7    ftgen    0,  0, iTabSize, 16,    0, iTabSize*0.06,icurve, 1, iTabSize*0.88,0, 1, iTabSize*0.06,-icurve, 0 ; GATE - WITH DE-CLICKING RAMP UP AND RAMP DOWN SEGMENTS
giwfn8    ftgen    0,  0, iTabSize,  7,    0, iTabSize*0.97,   1, iTabSize*0.03,      0              ; REVERSE PERCUSSIVE - STRAIGHT SEGMENTS
giwfn9    ftgen    0,  0, iTabSize,  5, .001, iTabSize*0.97,   1, iTabSize*0.03,   .001              ; REVERSE PERCUSSIVE - EXPONENTIAL SEGMENTS
giwfn10   ftgen    0,  0, iTabSize, 16,    0, iTabSize*0.97,-icurve,   1, iTabSize*0.03,-icurve,   0 ; REVERSE PERCUSSIVE - SLOW ATTACK, SLOW DECAY


iDispTabSize  =        4096
giDwfn1    ftgen    0,  0, iDispTabSize,  20,   2, 1                                                                  ; HANNING
giDwfn2    ftgen    0,  0, iDispTabSize,  9,    0.5, 1, 0                                                             ; HALF SINE
giDwfn3    ftgen    0,  0, iDispTabSize,  7,    0, iDispTabSize/2,      1, iDispTabSize/2, 0                          ; TRIANGLE
giDwfn4    ftgen    0,  0, iDispTabSize,  7,    0, iDispTabSize*0.03,   1, iDispTabSize*0.97,    0                    ; PERCUSSIVE - STRAIGHT SEGMENTS
giDwfn5    ftgen    0,  0, iDispTabSize,  5, .001, iDispTabSize*0.03,   1, iDispTabSize*0.97, .001                    ; PERCUSSIVE - EXPONENTIAL SEGMENTS
giDwfn6    ftgen    0,  0, iDispTabSize, 16,    0, iDispTabSize*0.03,icurve,   1, iDispTabSize*0.97,icurve, 0         ; PERCUSSIVE - FAST ATTACK, FAST DECAY
giDwfn7    ftgen    0,  0, iDispTabSize, 16,    0, iDispTabSize*0.06,icurve,   1, iDispTabSize*0.88,0, 1, iDispTabSize*0.06,-icurve, 0 ; GATE - WITH DE-CLICKING RAMP UP AND RAMP DOWN SEGMENTS
giDwfn8    ftgen    0,  0, iDispTabSize,  7,    0, iDispTabSize*0.95,   1, iDispTabSize*0.03,      0                  ; REVERSE PERCUSSIVE - STRAIGHT SEGMENTS
giDwfn9    ftgen    0,  0, iDispTabSize,  5, .001, iDispTabSize*0.95,   1, iDispTabSize*0.03,   .001                  ; REVERSE PERCUSSIVE - EXPONENTIAL SEGMENTS
giDwfn10   ftgen    0,  0, iDispTabSize, 16, 0, iDispTabSize*0.95,-icurve,   1, iDispTabSize*0.03,-icurve,   0          ; REVERSE PERCUSSIVE - FAST ATTACK, FAST DECAY

giDispTab  ftgen    1001,  0, iDispTabSize,  20,   2, 1                     ; display table

giTriangle     ftgen           0, 0, 4097,  20, 3
giSRScale      =               1

opcode    Grain3b,a,kkkkkkkkkkiiikkiiikk
 kpch, kphs, kspd, kfreeze, krange, kshape, kfmd, kpmd, kdur, kdens, imaxovr, isfn, iwfn, kfrpow, kprpow , iseed, imode, iPhsMode, kDensRnd, kSizeRnd    xin
 
 if iPhsMode==1 then
  kptr             =                   kphs * (nsamp(isfn)/ftlen(isfn))    ;MATHEMATICALLY REINTERPRET USER INPUTTED PHASE VALUE INTO A FORMAT THAT IS USABLE AS AN INPUT ARGUMENT  BY THE grain3 OPCODE
 
 elseif iPhsMode==2 then
  kspd             *=                  1 - kfreeze
  if kshape==1 then
   kptr            phasor              (kspd * sr * giSRScale) / (nsamp(isfn) * krange)
   kpch            =                   kpch-kspd
  elseif kshape==2 then
   kptr            oscili              1, (kspd * sr * giSRScale) / (nsamp(isfn) * krange * 2), giTriangle
   kptrPrev        init                0
   kpch            =                   kptr > kptrPrev ? kpch - kspd : kpch + kspd
   kptrPrev        =                   kptr
  endif
  kptr             *=                  krange     
  kptr             mirror              kptr + kphs, 0, 1
 
  kptr             =                   kptr * (nsamp(isfn) / ftlen(isfn) )     ; MATHEMATICALLY REINTERPRET USER INPUTTED PHASE VALUE INTO A FORMAT THAT IS USABLE AS AN INPUT ARGUMENT  BY THE grain3 OPCODE
 
 endif
 
 kpch              =                   (sr * giSRScale * kpch) / (ftlen(isfn) ) ; MATHEMATICALLY REINTERPRET USER INPUTTED PITCH RATIO VALUE INTO A FORMAT THAT IS USABLE AS AN INPUT ARGUMENT BY THE grain3 OPCODE - ftlen(x) FUNCTION RETURNS THE LENGTH OF A FUNCTION TABLE (no. x), REFER TO MANUAL FOR MORE INFO.    
 ;kfmd             =                   (sr * (kfmd * kpch)) / ftlen(isfn)
 kfmd              =                   (sr * giSRScale * (kfmd)) / ftlen(isfn)
 
 ktrig             metro               kdens                                   ; TRIGGERS IN SYNC WITH GRAIN GENERATION
 
 kDensRnd          trandom             ktrig, -kDensRnd, kDensRnd              ; CREATE A RANDOM OFFSET FACTOR THAT WILL BE APPLIED TO FOR DENSITY
 kdens             *=                  octave(kDensRnd)
 
 kSizeRnd          trandom             ktrig, -kSizeRnd, kSizeRnd              ; CREATE A RANDOM OFFSET FACTOR THAT WILL BE APPLIED TO FOR DENSITY
 kdur              *=                  octave(kSizeRnd)
 asig              grain3              kpch, kptr, kfmd, kpmd, kdur, kdens, imaxovr, isfn, iwfn, kfrpow, kprpow , iseed, imode
 xout              asig
 
endop

opcode    NextPowerOf2i,i,i
 iInVal            xin
 icount            =                   1
 LOOP:
 if 2^icount>iInVal then
  goto DONE
 else
  icount           =                   icount + 1
  goto LOOP
 endif
 DONE:
                   xout                2 ^ icount
endop


instr    1
 krampup           linseg              0, 0.001, 1
 gkloop            cabbageGetValue     "loop"
 gkPlayStop        cabbageGetValue     "PlayStop"

 gkPhsMode         cabbageGetValue     "PhsMode"
 gkPhsMode         init                1
 gklevel           cabbageGetValue     "level"
 gklevel           port                gklevel, 0.05
 gkdur             cabbageGetValue     "dur" 
 gkpch             cabbageGetValue     "pch"
 gkpch             portk               gkpch, krampup * 0.5
 gkLPF             cabbageGetValue     "LPF"
 
 gkwfn             cabbageGetValue     "wfn"
 gkwfn             init                1
 gkspd             cabbageGetValue     "spd"
 gkfreeze          cabbageGetValue     "freeze"
 gkrange           cabbageGetValue     "range"
 gkshape           cabbageGetValue     "shape"
 gkfmd             cabbageGetValue     "fmd"
 gkpmd             cabbageGetValue     "pmd"
 gkDensRnd         cabbageGetValue     "DensRnd"
 gkSizeRnd         cabbageGetValue     "SizeRnd"
 gkDensLFODep      cabbageGetValue     "DensLFODep"
 gkAmpLFODep       cabbageGetValue     "AmpLFODep"
 gkSizeLFODep      cabbageGetValue     "SizeLFODep"
 gkLFORte          cabbageGetValue     "LFORte" 
 gkFiltLFODep      cabbageGetValue     "FiltLFODep"
 gkFiltRes         cabbageGetValue     "FiltRes"
 gkLFOShape        cabbageGetValue     "LFOShape"
 gkDualOnOff       cabbageGetValue     "DualOnOff"
 gkDensRatio       cabbageGetValue     "DensRatio"
 gkPtrDiff         cabbageGetValue     "PtrDiff"
 gkTransDiff       cabbageGetValue     "TransDiff"
 gkDelay           cabbageGetValue     "Delay"
 gkDelay           port                gkDelay, 0.1
 
 gkV1L             cabbageGetValue     "V1L"
 gkV1R             cabbageGetValue     "V1R"
 gkV2L             cabbageGetValue     "V2L"
 gkV2R             cabbageGetValue     "V2R"

 gkYFilters        cabbageGetValue     "YFilters"
 
 if changed(gkPhsMode)==1 then
  if gkPhsMode==1 then
                   cabbageSet          k(1), "speedControlsID", "visible", 0
  elseif gkPhsMode==2 then
                   cabbageSet          k(1), "speedControlsID", "visible", 1
  endif
 endif
 
 ; Open File
 gSfilepath        cabbageGetValue     "filename"
 kNewFileTrg       changed             gSfilepath          ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                                    ; if a new file has been loaded...
                   event               "i",99,0,0          ; call instrument to update sample storage function table 
 endif  

 ; Drop File
 gSDropFile        cabbageGet          "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
                   event               "i",100,0,0         ; load dropped file
 endif

 /* START/STOP SOUNDING INSTRUMENT */
 ktrig             trigger             gkPlayStop, 0.5, 0
                   schedkwhen          ktrig, 0, 0, 2, 0, -1

 /* MOUSE SCRUBBING */
 gkMOUSE_DOWN_RIGHT cabbageGetValue "MOUSE_DOWN_RIGHT"    ; Read in mouse left click status
 kStartScrub  trigger          gkMOUSE_DOWN_RIGHT,0.5,0
 if gkMOUSE_DOWN_RIGHT==1 then
  if kStartScrub==1 then 
                   reinit              RAMP_FUNC
  endif
  RAMP_FUNC:
  
  rireturn
  kMOUSE_X         cabbageGetValue     "MOUSE_X"
  kMOUSE_Y         cabbageGetValue     "MOUSE_Y"
  kMOUSE_X         =                   (kMOUSE_X - 5) / 930
  kMOUSE_Y         portk               1 - ((kMOUSE_Y - 5) / 170), krampup * 0.05        ; SOME SMOOTHING OF DENSITY CHANGES VIA THE MOUSE ENHANCES PERFORMANCE RESULTS. MAKE ANY ADJUSTMENTS WITH ADDITIONAL CONSIDERATION OF guiRefresh VALUE 
  
  ; filter parameters (right-click mouse click-and-drag Y axis over file panel)
  kLPF_CF          scale               kMOUSE_Y*2,14,4
  kLPF_CF          limit               kLPF_CF, 4, 14
  gkLPF_CF         portk               kLPF_CF, krampup*0.05
  kHPF_CF          scale               kMOUSE_Y*2-1,14,4
  kHPF_CF          limit               kHPF_CF, 4, 14
  gkHPF_CF         portk               kHPF_CF, krampup*0.05
  

  
  
  gkphs            limit               kMOUSE_X,0,1
  gkdens           limit               ((kMOUSE_Y^3) * 499) + 1, 1, 500
                   schedkwhen          kStartScrub, 0, 0, 2, 0, -1
 else
  gkphs            cabbageGetValue     "phs"
  gkdens           cabbageGetValue     "dens"
 endif

 ; link grain size and density
 klink             cabbageGetValue     "link"
 kdenom            init                1
 if trigger:k(klink,0.5,0)==1 then
  kdenom           =                   gkdur
 endif
 kratio            =                   gkdur / kdenom
 if klink==1 then
  gkdens           =                   gkdens / kratio
 endif

 gkdens            portk               gkdens, krampup * 0.1

 ; indicator
 if changed:k(gkPlayStop)==1 && gkPhsMode==1 then
  if gkPlayStop==1 && gkPhsMode==1 then
                   cabbageSet          k(1),"indicator","visible",1
  else
                   cabbageSet          k(1),"indicator","visible",0
  endif
 endif 

 if gkPlayStop==1 && gkPhsMode==1 then
                   cabbageSet          k(1), "indicator","bounds",5+(1140*gkphs),5,1,175
 endif
 
 ; rebuild display table for window function
 if changed:k(gkwfn)==1 then
                   reinit              REBUILD_WFN_DISP
 endif
 REBUILD_WFN_DISP:
 iDwfn             =                   i(gkwfn) + giDwfn1 - 1                 ; display table chosen
                   tableicopy          giDispTab, iDwfn                       ; copy to fixed table number display table used by widget
                   cabbageSet          "WindowTab", "tableNumber", giDispTab  ; update GUI widget
 rireturn
 
endin

instr    99    ; load sound file
 gichans           filenchnls          gSfilepath                            ; derive the number of channels (mono=1,stereo=2) in the sound file
 iFtlen            NextPowerOf2i       filelen:i(gSfilepath)*sr
 iFtlen            limit               iFtlen, 2, 16777216                   ; limit table size
 gitableL          ftgen               1, 0, iFtlen, 1, gSfilepath, 0, 0, 1
 giSRScale         =                   ftsr(gitableL)/sr                     ; scale if sound file sample rate doesn't match Cabbage sample rate
 if gichans==2 then
  gitableR         ftgen               2, 0, iFtlen, 1, gSfilepath, 0, 0, 2
 endif                                                                                 
 giReady           =                   1                                     ; if no string has yet been loaded giReady will be zero
                   cabbageSet          "beg", "file", gSfilepath

 ; write file name to GUI
 SFileNoExtension  cabbageGetFileNoExtension gSfilepath
                   cabbageSet                "stringbox", "text", SFileNoExtension

endin

instr    100 ; LOAD DROPPED SOUND FILE
 gichans           filenchnls          gSDropFile                           ; derive the number of channels (mono=1,stereo=2) in the sound file
 iFtlen            NextPowerOf2i       filelen:i(gSDropFile)*sr
 iFtlen            limit               iFtlen, 2, 16777216                  ; limit table size
 gitableL          ftgen               1, 0, iFtlen, 1, gSDropFile, 0, 0, 1
 giSRScale         =                   ftsr(gitableL)/sr                    ; scale if sound file sample rate doesn't match Cabbage sample rate
 if gichans==2 then
  gitableR         ftgen               2, 0, iFtlen, 1, gSDropFile, 0, 0, 2
 endif                                                                                 
 giReady           =                   1                                    ; if no string has yet been loaded giReady will be zero
                   cabbageSet          "beg", "file", gSDropFile

 /* write file name to GUI */
 SFileNoExtension  cabbageGetFileNoExtension gSDropFile
                   cabbageSet                "stringbox","text",SFileNoExtension

endin


instr    2    ; triggered by 'play/stop' button and right-click on file panel

 if gkPlayStop==0&&gkMOUSE_DOWN_RIGHT==0 then
  turnoff
 endif
 if giReady = 1 then                                                 ; i.e. if a file has been loaded  
  /* ENVELOPE */
  iAttTim          cabbageGetValue     "AttTim"                      ; read in widgets
  iRelTim          cabbageGetValue     "RelTim"
  if iAttTim>0 then                                                  ; is amplitude envelope attack time is greater than zero...
   aenv            cossegr             0, iAttTim, 1, iRelTim, 0     ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else            
   aenv            cossegr             1, iRelTim, 0                 ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif

  kporttime        linseg              0, 0.001, 0.05                ; portamento time function. (Rises quickly from zero to a held value.)

  kSwitch          changed             gkPhsMode, gkwfn
  if    kSwitch==1    then                                           ; IF I-RATE VARIABLE CHANGE TRIGGER IS '1'...
                   reinit              START                         ; BEGIN A REINITIALISATION PASS FROM LABEL 'START'
  endif
  START:
  iwfn             =                   giwfn1 + i(gkwfn) - 1
  
  /* LFO */
  if gkLFOShape==1 then ; sine
   kLFO           oscil                1, gkLFORte  
  elseif gkLFOShape==2 then ;random
   kLFO            jspline             1, gkLFORte*0.5, gkLFORte*2
  endif
  kdens            =                   gkdens * octave(kLFO*gkDensLFODep)
  klevel           =                   gklevel * (1 - (((gkAmpLFODep * 0.5 * kLFO) + (abs(gkAmpLFODep) * 0.5)) ^ 2))
  kdur             =                   gkdur * octave(kLFO*gkSizeLFODep)  
  
  iPhsMode         =                   i(gkMOUSE_DOWN_RIGHT)==1?1:i(gkPhsMode)
  
  if gichans==1 then                        ; if mono...
   a1              Grain3b             gkpch, gkphs, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens, 600, 1, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
   if gkDualOnOff==1 then
    a1b            Grain3b             gkpch + gkTransDiff, gkphs + gkPtrDiff, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens*gkDensRatio, 600, 1, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
    if gkDelay>0 then
     a1b           vdelay              a1b, (gkDelay * 1000) / kdens, 5000
    endif
    a1             +=                  a1b
   endif
   if gkLPF==1 then  ; anti-quantisation filter
    kcf            =                   limit:k(abs(gkpch),0.001,1)^2
    a1             butlp               a1, (sr/2) * a(kcf)
   endif
   
   ; LFO Filter (mono)
   kFiltLFODep     cabbageGetValue     "FiltLFODep"
   if kFiltLFODep!=0 then ; only filter if depth is anything other than 1
    kCF            =                   sr * 0.33 * (2^(-abs(gkFiltLFODep))) * 2^(kLFO*kFiltLFODep)
    a1             zdf_2pole           a1, kCF, 0.5 + (gkFiltRes*24.5)
   endif

   ; right-click filter (mono)
   if gkMOUSE_DOWN_RIGHT==1 && gkYFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif

                   outs                a1 * aenv * klevel, a1 * aenv * klevel  ; send mono audio to both outputs 
  elseif gichans==2 then                                                       ; otherwise, if stereo...
   a1              Grain3b             gkpch, gkphs, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens, 600, 1, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
   a2              Grain3b             gkpch, gkphs, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens, 600, 2, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
   a1              *=                  gkV1L
   a2              *=                  gkV1R
   if gkDualOnOff==1 then
    a1b            Grain3b             gkpch+gkTransDiff, gkphs+gkPtrDiff, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens*gkDensRatio, 600, 1, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
    a2b            Grain3b             gkpch+gkTransDiff, gkphs+gkPtrDiff, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens*gkDensRatio, 600, 2, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
    if gkDelay>0 then
     a1b           vdelay              a1b, (gkDelay * 1000) / kdens, 5000
     a2b           vdelay              a2b, (gkDelay * 1000) / kdens, 5000
    endif
    a1             +=                  a1b * gkV2L
    a2             +=                  a2b * gkV2R
   endif
   if gkLPF==1 then  ; anti-quantisation filter
    kcf            =                   limit:k(abs(gkpch),0.001,1)^2
    a1             butlp               a1, (sr/2) * a(kcf)
    a2             butlp               a2, (sr/2) * a(kcf)
   endif
   
   ; LFO Filter (stereo)
   kFiltLFODep     cabbageGetValue "FiltLFODep"
   if kFiltLFODep!=0 then ; only filter if depth is anything other than 1
    kCF            =                   sr * 0.33 * (2^(-abs(kFiltLFODep))) * 2^(kLFO*kFiltLFODep)
    a1             zdf_2pole           a1, kCF, 0.5 + (gkFiltRes*24.5)
    a2             zdf_2pole           a2, kCF, 0.5 + (gkFiltRes*24.5)
   endif

   ; right-click filter (stereo)
   if gkMOUSE_DOWN_RIGHT==1 && gkYFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a2             zdf_2pole           a2, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
    a2             zdf_2pole           a2, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif
  
   
   

                   outs                a1 * aenv * klevel, a2 * aenv * klevel        ; send stereo signal to outputs
  endif
  rireturn

 endif
endin

instr    3 ; MIDI note triggered version
 icps              cpsmidi                                         ; read in midi note data as cycles per second
 iamp              ampmidi             1                           ; read in midi velocity (as a value within the range 0 - 1)
 kBend             pchbend             0, 12
 iAttTim           cabbageGetValue     "AttTim"                    ; read in widgets
 iRelTim           cabbageGetValue     "RelTim"
 iMidiRef          cabbageGetValue     "MidiRef"
 iFrqRatio         =                   icps/cpsmidinn(iMidiRef)    ; derive playback speed from note played in relation to a reference note (MIDI note 60 / middle C)

 if giReady==1 then                                                ; i.e. if a file has been loaded
  iAttTim          cabbageGetValue     "AttTim"                    ; read in widgets
  iRelTim          cabbageGetValue     "RelTim"
  if iAttTim>0 then                                                ; is amplitude envelope attack time is greater than zero...
   aenv            cossegr             0, iAttTim, 1, iRelTim, 0   ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else            
   aenv            cossegr             1, iRelTim, 0               ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif

  kporttime        linseg              0, 0.001, 0.05              ; portamento time function. (Rises quickly from zero to a held value.)

  kBend            portk               kBend, kporttime
  kFrqRatio        =                   iFrqRatio * semitone(kBend)
  
  kSwitch          changed             gkPhsMode, gkwfn
  if    kSwitch==1    then                                         ; IF I-RATE VARIABLE CHANGE TRIGGER IS '1'...
                   reinit              START                       ; BEGIN A REINITIALISATION PASS FROM LABEL 'START'
  endif
  START:
  iwfn             =                   giwfn1 + i(gkwfn) - 1

  ; LFO
  if gkLFOShape==1 then ; sine
   kLFO           oscil                1, gkLFORte  
  elseif gkLFOShape==2 then ;random
   kLFO           jspline              1, gkLFORte*0.5, gkLFORte*2
  endif
  kdens           =                    gkdens * octave(kLFO*gkDensLFODep)
  klevel          =                    gklevel * (1 - (((gkAmpLFODep * 0.5 * kLFO) + (abs(gkAmpLFODep) * 0.5)) ^ 2))
  kdur            =                    gkdur * octave(kLFO*gkSizeLFODep)  

  iPhsMode        =                    i(gkMOUSE_DOWN_RIGHT) == 1 ? 1 : i(gkPhsMode)

  if              gichans==1 then                            ; if mono...
   a1             Grain3b              kFrqRatio, gkphs, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens, 600, 1, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
   if gkDualOnOff==1 then
    a1b           Grain3b              kFrqRatio + gkTransDiff, gkphs + gkPtrDiff, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens*gkDensRatio, 600, 1, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
    if gkDelay>0 then
     a1b          vdelay               a1b, (gkDelay * 1000) / kdens, 5000
    endif
    a1            +=                   a1b
   endif
   
   ; velocity
   a1             butlp                a1 * iamp, iamp * sr * 0.5

   ; LFO Filter (mono)
   kFiltLFODep       cabbageGetValue "FiltLFODep"
   if kFiltLFODep!=0 then ; only filter if depth is anything other than 1
    kFiltRes       cabbageGetValue     "FiltRes"
    kCF            =                   sr * 0.33 * (2^(-abs(kFiltLFODep))) * 2^(kLFO*kFiltLFODep)
    a1             zdf_2pole           a1, kCF, 0.5 + (kFiltRes*24.5)
   endif

                   outs                a1 * aenv * klevel, a1 * aenv * klevel   ; send mono audio to both outputs


   if gkLPF==1 then                                                             ; anti-quantisation filter
    kcf            =                   limit:k(abs(gkpch),0.001,1)^2
    a1             butlp               a1, (sr/2) * a(kcf)
   endif
  elseif gichans==2 then                                                ; otherwise, if stereo...
   a1              Grain3b             kFrqRatio, gkphs, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens, 600, 1, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
   a2              Grain3b             kFrqRatio, gkphs, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens, 600, 2, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
   if gkDualOnOff==1 then
    a1b            Grain3b             kFrqRatio+gkTransDiff, gkphs+gkPtrDiff, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens*gkDensRatio, 600, 1, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
    a2b            Grain3b             kFrqRatio+gkTransDiff, gkphs+gkPtrDiff, gkspd, gkfreeze, gkrange, gkshape, gkfmd, gkpmd, kdur, kdens*gkDensRatio, 600, 2, iwfn, -2, -2 , rnd(1000), 8, iPhsMode, gkDensRnd, gkSizeRnd
    if gkDelay>0 then
     a1b           vdelay              a1b, (gkDelay * 1000) / kdens, 5000
     a2b           vdelay              a2b, (gkDelay * 1000) / kdens, 5000
    endif
    a1             +=                  a1b
    a2             +=                  a2b
   endif
   if gkLPF==1 then  ; anti-quantisation filter
    kcf            =                   limit:k(abs(gkpch),0.001,1)^2
    a1             butlp               a1, (sr/2) * a(kcf)
    a2             butlp               a2, (sr/2) * a(kcf)
   endif
   
   ; velocity
   a1              butlp               a1*iamp, iamp * sr * 0.5
   a2              butlp               a2*iamp, iamp * sr * 0.5

   ; LFO Filter (stereo)
   kFiltLFODep       cabbageGetValue   "FiltLFODep"
   if kFiltLFODep!=0 then ; only filter if depth is anything other than 1
    kFiltRes       cabbageGetValue     "FiltRes"
    kCF            =                   sr * 0.33 * (2^(-abs(kFiltLFODep))) * 2^(kLFO*kFiltLFODep)
    a1             zdf_2pole           a1, kCF, 0.5 + (kFiltRes*24.5)
    a2             zdf_2pole           a2, kCF, 0.5 + (kFiltRes*24.5)
   endif

                   outs                a1 * aenv * klevel, a2 * aenv * klevel        ; send stereo signal to outputs
  endif
  rireturn

 endif

endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
