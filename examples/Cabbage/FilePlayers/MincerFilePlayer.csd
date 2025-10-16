		
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; MincerFilePlayer.csd
; Written by Iain McCurdy, 2014, 2025

; Three modes of playback are offered:
; 1. Manual Pointer
;     Pointer position is determined by the long horizontal slider 'Manual Pointer'.
; 2. Mouse Scrubber
;     Pointer position is determined by the mouse's X position over the waveform view. Playback is also started and stopped using right-click.
; 3. Loop Region
;     A region that has been highlighted using left-click and drag is looped using a method and speed chosen in the 'LOOP REGION' GUI area.
;     Speed can be random-modulated by increasing Mod.Range. The nature of the modulation is changed using 'Rate 1' and 'Rate 2'. The random function generator is jspline.

; Transpose can be expressed either in semitones or a simple ratio. Select mode 'Semitones' or 'Ratio'

; MOD. POINTER section contains controls which modulate the pointer position using a 'sample-and-hold' type random function
; 
 
; All three of the above methods are playable from a MIDI keyboard (first activate the 'MIDI' checkbox).
;  Transposition for MIDI activated notes is governed bu both the MIDI key played and the setting for 'Transpose'


; CONTROLS
; Manual Pointer - when 'Manual Pointer' is selected, defines the location from within the file to read

; FFT Size    -       FFT size used by the streaming analysis. Larger values will produce better frequency resolution but poorer transient definition
; Decim       -       hopsize as a fraction of an entire frame (time-domain window). 
;                     This can also be thought of as a definition of number-of-overlaps such that larger values will result in a larger number of overlaps 
;                      -and therefore suppression of rippling and echoing effects as a result of window enveloping and sparse repetition.
;                     The opcode's default (and the default in this implementation) is 4. 
;                      -Higher values may produce smoother results but also increase CPU demand. Lower values can produce distortion artefacts.
; Lock        -       lock phases. Can be useful when playback pointer is frozen.
; Transpose   -       (base) transposition (in semitones) when not a MIDI-triggered note.
; Port. Time  -       lag applied to changes in transpoition and pointer position
; Transposition Mode: 
;     1. Semitones
;     2. Fraction
; Stack       -        number of sequential transpositions a stack of notes
; Scale:
;   Ratio
;   Harmonic
; Interval     - 
; Wobble Depth - depth of random modulation of the transposition in cents. Note that each voice, even within a stack, follows a unique random function so rich chorus effects are possible with this feature.
; Wobble Rate  - rate of random modulation of the transposition in hertz. This uses the jspline opcode and take note that if the rate is very low, increases may take a moment to be implemented.
; Detune       - each of the members of a stack will be randomly detuned by an amount corresponding to the value in this
; Tilt         - when stack is greater than 1, this control the amplitude weighting between lower and upper members of the stack. 

; L O O P   R E G I O N
; Shape       
; Speed x 10
; Speed
; Mod. Range
; Rate 1, 2

; M O D.   P O I N T E R
; Mod. Range
; Rate 1, 2

; HPF
; LPF
; Level

; Att. Tim.
; Rel. Tim.
; MIDI Ref.

; JI Ratios
; unison	-	1/1 
; min 2nd	-	16/15
; maj 2nd	-	9/8
; min 3rd	-	6/5
; maj 3rd	-	5/4
; perf 4th	-	4/3 
; tritone	-	45/32
; perf 5th	-	3/2
; min 6th	-	8/5
; maj 6th	-	5/3
; min 7th	-	9/5
; maj 7th	-	15/8
; octave 	-	2/1

<Cabbage>
#define SLIDER_DESIGN colour( 40, 80, 80), trackerColour("white"), textColour("white"), fontColour("white"), markerColour("white"), valueTextBox(1)
#define SLIDER_DESIGN2 colour(140, 80, 80), trackerColour("white"), textColour("white"), fontColour("white"), markerColour("white"), valueTextBox(1)

form caption("Mincer File Player") size(1445,395), colour( 50,100,100) pluginId("Minc"), guiMode("queue")

soundfiler bounds(  5,  5,1435,140), channel("beg","len"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label      bounds(  7,  7,1433, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")
image      bounds(  5,  5,   1,140), channel("wiper"), visible(0), colour(255,255,255,170)

hslider    bounds(  0,138,1445, 30), channel("pointer"), range( 0,  1.00, 0.1), colour(200,255,200),  trackerColour("white"), fontColour("white"), visible(0)

hslider    bounds(  0,138,1445, 15), channel("start"), range( 0,  1.00, 0), colour(200,255,200),  trackerColour("white"), fontColour("white"), visible(0)
hslider    bounds(  0,153,1445, 15), channel("end"),   range( 0,  1.00, 1), colour(200,255,200),  trackerColour("white"), fontColour("white"), visible(0)

filebutton bounds(  5,185, 80, 22), text("Open File","Open File"), fontColour("white"), channel("filename"), shape("ellipse")

checkbox bounds(  5,218,120, 12), text("Manual Pointer"), channel("r1"), fontColour:0("white"), fontColour:1("white"), colour(yellow), radioGroup(1)
checkbox bounds(  5,232,120, 12), text("Mouse Scrubber"), channel("r2"), fontColour:0("white"), fontColour:1("white"), colour(yellow), radioGroup(1), value(1) 
label    bounds( 19,246,100, 10), text("[right click and drag]"), fontColour("white"), align("left")
checkbox bounds(  5,256,120, 12), text("Loop Region"),    channel("r3"), fontColour:0("white"), fontColour:1("white"), colour(yellow), radioGroup(1) 
label    bounds( 19,270,100, 10), text("[left click and drag]"), fontColour("white"), align("left")

checkbox bounds(125,213, 60, 12), channel("lock"), text("Lock"), colour("yellow"), fontColour:0("white"), fontColour:1("white")
checkbox bounds(125,233, 60, 12), channel("MIDI"), text("MIDI"), colour("yellow"), fontColour:0("white"), fontColour:1("white")

label    bounds( 95,172, 60, 12), text("FFT Size"), fontColour("white")
combobox bounds( 95,185, 60, 20), channel("FFTSize"), text("32768", "16384", "8192", "4096", "2048", "1024", "512", "256", "128", "64", "32", "16", "8", "4"), value(5), fontColour("white")

label    bounds(115,252, 60, 12), text("Decim."), fontColour("white")
combobox bounds(115,265, 60, 20), channel("decim"), text("1", "2", "4", "8", "16"), value(3), fontColour("white")

combobox bounds(170,175, 80, 20), text("Semitone","Ratio"), channel("IntervalMode"),       value(1)

image    bounds(175,200, 70, 90), colour(0,0,0,0), plant("Semitones"), channel("SemitonesControls"), visible(1) 
{
rslider  bounds(  0,  0, 70, 90), channel("Semitones"), range(-48, 48, 0), text("Semitones"), $SLIDER_DESIGN
}

image    bounds(175,220, 70, 70), colour(0,0,0,0), plant("Ratio"), channel("RatioControls"), visible(0) 
{
nslider  bounds( 20,  0, 25, 24), channel("Numerator"),        range(1,99,3,1,1)
image    bounds( 15, 26, 35,  1)
nslider  bounds( 20, 29, 25, 24), channel("Denominator"),      range(1,99,2,1,1)
}

rslider  bounds(240,200, 70, 90), channel("portamento"),range(0, 20,0.05,0.5,0.01), text("Port.Time"), $SLIDER_DESIGN
rslider  bounds(305,200, 70, 90), channel("Stack"),range(1, 30, 1, 1, 1), text("Stack"), $SLIDER_DESIGN ; number of members in the stack
rslider  bounds(370,200, 70, 90), channel("StackOffset"),range(0,16,0,1,1), text("Offset"), $SLIDER_DESIGN ; stack numbering offset
combobox bounds(430,175, 80, 20), channel("Scale"), items("Semitones","Harm","Ratio","Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"), value(1)
rslider  bounds(435,200, 70, 90), channel("StackIntvl"),range(-12, 12, 1), text("Interval"), $SLIDER_DESIGN, visible(1)
rslider  bounds(435,200, 70, 90), channel("StackRatio"),range(0.25, 4, 1, 0.5), text("Ratio"), $SLIDER_DESIGN, visible(0)
rslider  bounds(435,200, 70, 90), channel("StackStep"),range(1, 16, 1,1,0.01), text("Step Size"), $SLIDER_DESIGN, visible(0)
line     bounds(520,192,100,  1), colour("white")
label    bounds(545,185, 50, 13), text("Wobble"), fontColour("white"), colour( 50,100,100)
rslider  bounds(500,200, 70, 90), channel("WobDepth"), range(0,1200,0,0.5,.01), text("Depth"), $SLIDER_DESIGN
rslider  bounds(565,200, 70, 90), channel("WobRate"), range(0.01,40, 0.1,0.5), text("Rate"), $SLIDER_DESIGN
rslider  bounds(630,200, 70, 90), channel("Detune"), range(-100,100, 0,1,0.1), text("Detune"), $SLIDER_DESIGN
rslider  bounds(695,200, 70, 90), channel("tilt"),range(0, 4, 2), text("Tilt"), $SLIDER_DESIGN, visible(1)

image    bounds(500,200, 70, 70), colour(0,0,0,0), plant("Ratio"), channel("IntvlFrac"), visible(0) 
{
label    bounds(  0,  2, 70, 13), text("Interval"), fontColour("white")    
nslider  bounds( 20, 20, 25, 24), channel("IntvlNum"),        range(1,99,3,1,1)
image    bounds( 15, 46, 35,  1)
nslider  bounds( 20, 49, 25, 24), channel("IntvlDen"),      range(1,99,2,1,1)
}

image    bounds(775,188, 305,110), colour(0,0,0,0), outlineColour("silver"), outlineThickness(1), shape("sharp"), plant("LoopRegion"), corners(5)
{
label    bounds(  0,  4, 305,10), text("L   O   O   P       R   E   G   I   O   N"), fontColour("white"), align("centre")
label    bounds( 10, 24, 85, 12), text("Shape"), fontColour("white")
combobox bounds( 10, 37, 85, 20), channel("LoopMode"), text("Forward","Backward","Triangle","Sine"), value(1), fontColour:0("white")
checkbox bounds( 10, 63, 85, 14), channel("SpeedMult"), text("Speed x 10"), value(0), fontColour:0("white"), fontColour:1("white")
rslider  bounds(100, 17, 70, 90), channel("Speed"), range(-2, 2, 1,1,0.001), text("Speed"), $SLIDER_DESIGN
nslider  bounds(170, 35, 60, 30), channel("ModRange"), range(0,2,0,1,0.001),  colour(  0,  0,  0), text("Mod.Range"), textColour("white")
nslider  bounds(235, 20, 60, 30), channel("Rate1"),    range(0,30,1,1,0.001), colour(  0,  0,  0), text("Rate 1"),    textColour("white")
nslider  bounds(235, 50, 60, 30), channel("Rate2"),    range(0,30,2,1,0.001), colour(  0,  0,  0), text("Rate 2"),    textColour("white")
}

image    bounds(1085,188, 145,110), colour(0,0,0,0), outlineColour("silver"), outlineThickness(1), shape("sharp"), plant("ModPtr"), corners(5)
{
label    bounds(  0,  4, 145,10), text("M  O  D.     P  O  I  N  T  E  R"), fontColour("white"), align("centre")
nslider  bounds( 10, 35, 60, 30), channel("PtrModRange"), range(0,1,0,1,0.001),  colour(  0,  0,  0), text("Mod.Range"), textColour("white")
nslider  bounds( 75, 20, 60, 30), channel("PtrRate1"),    range(0,500,1,1,0.001), colour(  0,  0,  0), text("Rate 1"),    textColour("white")
nslider  bounds( 75, 50, 60, 30), channel("PtrRate2"),    range(0,500,2,1,0.001), colour(  0,  0,  0), text("Rate 2"),    textColour("white")
}

image      bounds(1230,200,210, 90), colour(0,0,0,0), plant("output") 
{
rslider    bounds(  0,  0, 70, 90), channel("HPF"),     range(  4,  14, 4),        text("HPF"), $SLIDER_DESIGN
rslider    bounds( 70,  0, 70, 90), channel("LPF"),     range(  4,  14,14),        text("LPF"), $SLIDER_DESIGN
rslider    bounds(140,  0, 70, 90), channel("level"),     range(  0,  1.00, 1, 0.5),        text("Level"), $SLIDER_DESIGN
}

image      bounds(  5,290,195, 90), colour(0,0,0,0) 
{
rslider    bounds(  0,  0, 70, 90), channel("AttTim"),    range(0, 5, 0, 0.5, 0.001),       text("Att.Tim"), $SLIDER_DESIGN
rslider    bounds( 65,  0, 70, 90), channel("RelTim"),    range(0.01, 5, 0.05, 0.5, 0.001), text("Rel.Tim"), $SLIDER_DESIGN
rslider    bounds(130,  0, 70, 90), channel("MidiRef"),   range(0,127,60, 1, 1),            text("MIDI Ref."), $SLIDER_DESIGN
}

keyboard bounds(225,305,1210, 75)

label    bounds(  5,382,120, 12), text("Iain McCurdy |2014|"), align("left"), fontColour("silver")
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

massign    0, 3

/*
; JI intervals
giIonian     ftgen    101, 0, 7, -2,   1, 9/8,   5/4, 4/3, 3/2,   5/3, 15/8  ; same as major
giDorian     ftgen    102, 0, 7, -2,   1, 9/8,   6/5, 4/3, 3/2,   5/3, 9/5
giPhrygian   ftgen    103, 0, 7, -2,   1, 16/15, 6/5, 4/3, 3/2,   8/5, 9/5
giLydian     ftgen    104, 0, 7, -2,   1, 9/8,   6/5, 4/3, 45/32, 8/5, 9/5
giMixolydian ftgen    105, 0, 7, -2,   1, 9/8,   5/4, 4/3, 3/2,   5/3, 9/5 
giAeolian    ftgen    106, 0, 7, -2,   1, 9/8,   6/5, 4/3, 3/2,   8/5, 9/5   ; natural minor
giLocrian    ftgen    107, 0, 7, -2,   1, 16/15, 6/5, 4/3, 45/32, 8/5, 9/5
*/

; ET intervals
;                                         S            T           T            S            T            T            T            
giIonian     ftgen    101, 0, 7, -2,   1, semitone(2), semitone(4), semitone(5), semitone(7), semitone(9), semitone(11)
giDorian     ftgen    102, 0, 7, -2,   1, semitone(2), semitone(3), semitone(5), semitone(7), semitone(9), semitone(10)
giPhrygian   ftgen    103, 0, 7, -2,   1, semitone(1), semitone(3), semitone(5), semitone(7), semitone(8), semitone(10) 
giLydian     ftgen    104, 0, 7, -2,   1, semitone(2), semitone(4), semitone(6), semitone(7), semitone(9), semitone(11) 
giMixolydian ftgen    105, 0, 7, -2,   1, semitone(2), semitone(4), semitone(5), semitone(7), semitone(9), semitone(10) 
giAeolian    ftgen    106, 0, 7, -2,   1, semitone(2), semitone(3), semitone(5), semitone(7), semitone(8), semitone(10) 
giLocrian    ftgen    107, 0, 7, -2,   1, semitone(1), semitone(3), semitone(5), semitone(6), semitone(8), semitone(10) 

gichans         init    0        ; 
giReady         init    0        ; flag to indicate function table readiness

giFFTSizes[]    array    32768, 16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4    ; an array is used to store FFT window sizes
giTriangle      ftgen    0, 0, 4097, 7, 0, 2048, 1, 2048, 0
giRectSine      ftgen    0, 0, 4097, 19, 1, 0.5, 0, 1
gSfilepath      init     ""
gkFileLen       init     0

giRandDist     ftgen    0, 0, 4096, 21, 6, 1 ; list of random values corresponding to a gaussian distribution.
                                             ; will be used 





opcode mincerStack,a,akkikiikkkkkkkiikikp
 apointer, klevel, ktranspose, itable, klock, iFFTsize, idecim, kScale, kStackIntvl, kStackRatio, kStackStep, kWobDepth, kWobRate, kDetune, inum, iTiltTable, kporttime, iStack, kStackOffset, iCount xin
    
    kRamp           linseg    0, 0.001, 1
    
    if kScale==1 then ; semitones
     ktransposeL  =                semitone( (iCount-1+kStackOffset) * kStackIntvl)        ; local transposition amount (semitones)
    elseif kScale==2 then ; harmonic
     ktransposeL  =                (iCount+kStackOffset) ^ kStackIntvl                       ; local transposition amount (harmonic)
    elseif kScale==3 then ; ratio
     ktransposeL  =                kStackRatio ^ (iCount-1+kStackOffset)                       ; local transposition amount (ratio)
    else ; scale
     ktransposeL   =               tablekt:k((((iCount - 1 + kStackOffset)*kStackStep) % 7),(kScale-3+100)) * octave(int(((iCount+kStackOffset)*kStackStep)/8))
     ktransposeL   portk           ktransposeL, kRamp * kporttime ; smooth scale changes
    endif
    
    ; detune
    iDetune         table     iCount + (inum*128), giRandDist    ; read from random distribution table
    kDetuneL        =         kDetune * iDetune
    kDetuneL        portk     kDetuneL, kRamp * random:i(0,1)

    iLevelLNdx   =                (iCount-1) / (iStack-1)
    kLevelL      tablei           iLevelLNdx, iTiltTable, 1
    ; random pitch wobble
    kWob         jspline          kWobDepth, kWobRate*0.5, kWobRate*2  
    
    a1           mincer           apointer, klevel*kLevelL, ktranspose*ktransposeL*cent(kWob+kDetuneL), itable, klock, iFFTsize, idecim
    aMix         =                0
    if iCount<iStack then
     aMix        mincerStack      apointer, klevel, ktranspose, itable, klock, iFFTsize, idecim, kScale, kStackIntvl, kStackRatio, kStackStep, kWobDepth, kWobRate, kDetune, inum, iTiltTable, kporttime, iStack, kStackOffset, iCount+1
    endif
                 xout             a1 + aMix
endop





instr    1 ; always on. Read in widgets etc.
 /* PORTAMENTO TIME FUNCTION */
 gkporttimeW     cabbageGetValue    "portamento"
 krampup         linseg             0,0.001,1
 gkporttime       =                  krampup * gkporttimeW    

 /* SHOW HIDE INTERVAL MODE (SEMITONES OR RATIO) WIDGETS */
 kIntervalMode   cabbageGetValue   "IntervalMode"
 if changed(kIntervalMode)==1 then                ; semitones mode
  if kIntervalMode==1 then
                 cabbageSet        k(1),"RatioControls","visible",0
                 cabbageSet        k(1),"SemitonesControls","visible",1      
  else                                            ; ratio mode
                 cabbageSet        k(1),"RatioControls","visible",1
                 cabbageSet        k(1),"SemitonesControls","visible",0
  endif
 endif

 /* DEFINE TRANSPOSITION RATIO BASED ON INTERVAL MODE CHOICE */
 if kIntervalMode==1 then                    ; semitones mode
     kSemitones   cabbageGetValue   "Semitones"
     kSemitones   portk             kSemitones,gkporttime
     gktranspose  =                 semitone(kSemitones)    
 else                                ; ratio mode
     kNumerator   cabbageGetValue   "Numerator"
     kDenominator cabbageGetValue   "Denominator"
     gkRatio      =                 kNumerator/kDenominator
     gktranspose  portk             gkRatio,gkporttime    
 endif

 gkr1             cabbageGetValue    "r1"    ; pointer/note mode select (radio buttons):    manual
 gkr2             cabbageGetValue    "r2"    ;                         mouse
 gkr3             cabbageGetValue    "r3"    ;                         loop
 gkmode           =                  (gkr1) + (gkr2*2) + (gkr3*3) ; 1=Manual_Pointer 2=Mouse_Pointer 3=Loop_Region
 ; show/hide widgets
                  cabbageSet         changed:k(gkmode), "pointer", "visible", gkmode == 1 ? 1 : 0
                  cabbageSet         changed:k(gkmode), "start", "visible", gkmode == 3 ? 1 : 0
                  cabbageSet         changed:k(gkmode), "end", "visible", gkmode == 3 ? 1 : 0
 gkloop           cabbageGetValue    "loop"
 gkMIDI           cabbageGetValue    "MIDI"
 gklock           cabbageGetValue    "lock"
 gkfreeze         cabbageGetValue    "freeze"
 gkfreeze         =                  1 - gkfreeze
 kHPF             cabbageGetValue    "HPF"
 kLPF             cabbageGetValue    "LPF"
 gkHPF            portk               kHPF, krampup*0.05
 gkLPF            portk               kLPF, krampup*0.05
 gklevel          cabbageGetValue    "level"
 gkFFTSize        cabbageGetValue    "FFTSize"
 
 gkdecimArr[]     fillarray          1, 2, 4, 8, 16
 gkdecim          =                  gkdecimArr[cabbageGetValue:k("decim") - 1]
 gkdecim          init               4
 ;                 printk2            gkdecim
                  
 kbeg             cabbageGetValue    "beg"            ; Click-and-drag region beginning in sample frames (in sample frames)
 klen             cabbageGetValue    "len"            ; Click-and-drag region length in sample frames
 
 ; slider start and end points (normalised)
 gkstart          cabbageGetValue    "start"
 gkend            cabbageGetValue    "end"
 
 ; set loop points
 kMOUSE_DOWN_LEFT cabbageGetValue    "MOUSE_DOWN_LEFT"
 if trigger:k(kMOUSE_DOWN_LEFT,0.5,1)==1 then
  if changed:k(kbeg,klen)==1 then
   gkLoopStart    =                   kbeg
   gkLoopLen      =                   klen
  endif
 endif
 
 gkLoopMode       cabbageGetValue    "LoopMode"
 gkSpeed          cabbageGetValue    "Speed"
 if cabbageGetValue:k("SpeedMult")==1 then            ; speed multiplier switch
  gkSpeed         *=                 10
 endif
 gkModRange       cabbageGetValue    "ModRange"
 if gkModRange>0 then
  gkRate1         cabbageGetValue    "Rate1"
  gkRate2         cabbageGetValue    "Rate2"
  kMod            jspline            gkModRange,gkRate1,gkRate2
  kSpeed2         =                  gkSpeed + kMod
  gkSpeed         =                  kSpeed2
 endif
 gkPtrModRange    cabbageGetValue    "PtrModRange"
 gkPtrRate1       cabbageGetValue    "PtrRate1"
 gkPtrRate2       cabbageGetValue    "PtrRate2"
 gkStack          cabbageGetValue    "Stack"
 gkStackOffset    cabbageGetValue    "StackOffset"
 gkStackIntvl     cabbageGetValue    "StackIntvl"
 gkStackIntvl     portk              gkStackIntvl, gkporttime
 gkStackRatio     cabbageGetValue    "StackRatio"
 
 gkScale,kT       cabbageGetValue    "Scale"
                  cabbageSet         kT, "StackIntvl", "visible", gkScale < 3 ? 1 : 0
                  cabbageSet         kT, "StackRatio", "visible", gkScale == 3 ? 1 : 0
                  cabbageSet         kT, "StackStep", "visible", gkScale > 3 ? 1 : 0
 gkStackStep      cabbageGetValue    "StackStep"

 ; pitch wobble - each voice in a stack will have a unique random modulation, creating useful chorus-type sounds
 gkWobDepth       cabbageGetValue    "WobDepth"
 gkWobRate        cabbageGetValue    "WobRate"
 kDetune          cabbageGetValue    "Detune"
 gkDetune         =                  (kDetune ^ 2) * (kDetune < 0 ? -1 : 1)
  
 ; amplitude tilt - a table is sent to the UDO
 giTiltTable ftgen 0,0,1024,16,1,1024,0,1
 iL1 ftgen 0,0,6,-2, 1, 1,1,0,0, 0
 iL2 ftgen 0,0,6,-2, 0, 0,1,1,1, 1
 iC  ftgen 0,0,6,-2, -8,0,0,0,4, 8
 ktilt cabbageGetValue "tilt"
 ktilt portk ktilt, krampup*0.1
 if changed:k(ktilt)==1 then
  kL1 tablei ktilt, iL1
  kL2 tablei ktilt, iL2
  kC  tablei ktilt, iC
  reinit REBUILD_TILT_TABLE
 endif
 REBUILD_TILT_TABLE:
 i_ ftgen giTiltTable,0,1024,16,i(kL1),ftlen(giTiltTable),i(kC),i(kL2)
 rireturn
 
 gkMOUSE_DOWN_RIGHT cabbageGetValue  "MOUSE_DOWN_RIGHT"          ; Read in mouse right-click status
 kStartScrub        trigger          gkMOUSE_DOWN_RIGHT,0.5,0    ; generate a momentary trigger whenver right mouse button is clicked
 
 if gkMOUSE_DOWN_RIGHT==1 && gkmode==2 then ; mouse scrubber mode x=pointer y=transposition
  kMOUSE_X        cabbageGetValue    "MOUSE_X"
  kMOUSE_Y        cabbageGetValue    "MOUSE_Y"
  if kStartScrub==1 then                     ; prevent initial portamento when a new note is started using right click
   reinit RAMP_FUNC
  endif
  RAMP_FUNC:
  krampup         linseg             0, 0.001, 1
  rireturn
  kMOUSE_X        portk              (kMOUSE_X - 5) / 990, gkporttime     ; Mouse X to pointer position
  kMOUSE_Y        limit              ((kMOUSE_Y - 5) / 150), 0, 1        ; Mouse Y transposition
  gapointer       interp             kMOUSE_X
  kSemitones      cabbageGetValue    "Semitones"
  gktranspose     portk              ((kMOUSE_Y*2)-1)*kSemitones,gkporttime        ; Transposition is scaled using transposition value derived either from 'Semitone' slider or 'Ratio' nslideres
  gktranspose     =                  semitone(gktranspose)
  gklevel         portk              kMOUSE_Y*gklevel + (1-gklevel), gkporttime
                  schedkwhen         kStartScrub,0,0,2,0,-1
 else ; manual pointer
  kpointer        cabbageGetValue    "pointer"
  iBounds[]       cabbageGet         "beg", "bounds"
                  cabbageSet         changed:k(kpointer),"wiper","bounds",5+iBounds[2]*kpointer,5,1,140
  if changed:k(gkmode)==1 then
   if gkmode==1 then
                  cabbageSet         k(1),"wiper","visible",1
   else
                  cabbageSet         k(1),"wiper","visible",0
   endif
  endif
  kpointer        portk              kpointer, gkporttime
  gapointer       interp             kpointer
 endif
                                
 gSfilepath       cabbageGetValue    "filename"
 kNewFileTrg      changed            gSfilepath    ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                            ; if a new file has been loaded...
                  event              "i",99,0,0    ; call instrument to update sample storage function table 
 endif  
 
 if changed(gkmode+gkMIDI)==1 then
  if gkmode==1||gkmode==3&&gkMIDI==0 then
                  event              "i",2,0,-1
  endif
 endif
endin




instr    99    ; load sound file
 gichans          filenchnls         gSfilepath               ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL         ftgen              1,0,0,1,gSfilepath,0,0,1
 if gichans==2 then
  gitableR        ftgen              2,0,0,1,gSfilepath,0,0,2
 else
  gitableR        ftgen              2,0,0,1,gSfilepath,0,0,1 ; if input is mono, right table is simply a copy of the mono input file  
 endif
 giReady          =                  1                        ; if no string has yet been loaded giReady will be zero
 gkFileLen        init               ftlen(1)
 
                  cabbageSet         "beg", "file", gSfilepath

  /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet         "stringbox","text",SFileNoExtension

endin





instr    2    ; non-midi triggered instrument

 gkLoopStart      =                   gkstart * ftlen(gitableL)
 kEnd             =                   gkend * ftlen(gitableL)
 gkLoopLen        =                   kEnd - gkLoopStart
 kDir             =                   gkLoopLen < 0 ? -1 : 1
 gkLoopLen        =                   abs(gkLoopLen)
 gkLoopStart      =                   gkLoopStart < kEnd ? gkLoopStart : kEnd
 
 ; sense when to turn instrument off
 if gkmode!=1 && gkmode!=3 && gkMOUSE_DOWN_RIGHT!=1 || gkMIDI==1 then
  turnoff
 endif
 
 ; i.e. if a file has been loaded
 if giReady==1 then
  aenv            linsegr            0,0.01,1,0.01,0   ; simple de-click envelope
    
  iFileLen        filelen            gSfilepath        ; derive file length in seconds
  
  ; looping modes
  if i(gkmode)==3 then                                                      ; if loop mode
   if gkLoopMode==1 then                                                    ; forward
    apointer      phasor    divz:k((sr*gkSpeed*kDir),gkLoopLen,1)
   elseif gkLoopMode==2 then                                                ; backward
    apointer      phasor    divz:k(-(sr*gkSpeed*kDir),gkLoopLen,1)
   elseif gkLoopMode==3 then                                                ; tri (fwd/bwd)
    apointer      poscil    1,divz:k((sr*gkSpeed*kDir),gkLoopLen,1),giTriangle
   elseif gkLoopMode==4 then                                                ; sine (fwd/bwd)
    apointer      poscil    1,divz:k((sr*gkSpeed*kDir),gkLoopLen,1),giRectSine
   endif
   apointer       =         (apointer * (gkLoopLen/sr)) + (gkLoopStart/sr)  ; scale range of pointer
  else                                                                      ; otherwise static pointer
   apointer       =         gapointer * iFileLen ; manual pointer
  endif

  ; RANDOM POINTER MODULATION
  if gkPtrModRange>0 then
   
   ;kRndPtrRate    init      random(i(gkPtrRate1),i(gkPtrRate2))
   ;kRndPtrTrig    metro     kRndPtrRate
   ;kRndPtrRate    trandom   kRndPtrTrig,gkPtrRate1,gkPtrRate2
   ;kRndPtrPos     trandom   kRndPtrTrig,-gkPtrModRange*iFileLen,gkPtrModRange*iFileLen
   
   kRndPtrPos      jspline   gkPtrModRange, gkPtrRate1, gkPtrRate2
   
   apointer       +=        interp(kRndPtrPos)
  endif
  
  ; reinitialise if FFT size or decimation value are changed
  if changed:k(gkFFTSize,gkdecim)==1 then
   reinit RESTART
  endif
  RESTART:
  
  ; random pitch wobble
  kWob            jspline   gkWobDepth, gkWobRate*0.5, gkWobRate*2  
  kWobR           jspline   gkWobDepth, gkWobRate*0.5, gkWobRate*2  
 
  ; detune
  iDetune         table     0, giRandDist    ; read from random distribution table
  kDetune         =         iDetune * gkDetune
  kDetuneR        =         iDetune * (-gkDetune)
  
  if gkStack==1 then ; one layer only
   a1            mincer       apointer, gklevel, gktranspose * cent(kWob +kDetune),  gitableL, gklock, giFFTSizes[i(gkFFTSize)-1], i(gkdecim)
   a2            mincer       apointer, gklevel, gktranspose * cent(kWobR+kDetuneR), gitableR, gklock, giFFTSizes[i(gkFFTSize)-1], i(gkdecim)
  else               ; otherwise stack mode
   if changed:k(gkStack)==1 then
    reinit RESTART_STACK2
   endif
   RESTART_STACK2:
   a1            mincerStack  apointer, gklevel, gktranspose, gitableL, gklock, giFFTSizes[i(gkFFTSize)-1], i(gkdecim), gkScale, gkStackIntvl, gkStackRatio, gkStackStep, gkWobDepth, gkWobRate,  gkDetune, 0, giTiltTable, gkporttimeW, i(gkStack), gkStackOffset
   a2            mincerStack  apointer, gklevel, gktranspose, gitableR, gklock, giFFTSizes[i(gkFFTSize)-1], i(gkdecim), gkScale, gkStackIntvl, gkStackRatio, gkStackStep, gkWobDepth, gkWobRate, -gkDetune, 0, giTiltTable, gkporttimeW, i(gkStack), gkStackOffset
  endif
   
   ; filters
   a1             buthp        a1, cpsoct(gkHPF)
   a1             butlp        a1, cpsoct(gkLPF)
   a2             buthp        a2, cpsoct(gkHPF)
   a2             butlp        a2, cpsoct(gkLPF)

                  outs         a1 * aenv, a2 * aenv
  endif  

endin





instr    3    ; midi-triggered instrument
 if giReady==1 then                                           ; i.e. if a file has been loaded
  icps            cpsmidi                                     ; read in midi note data as cycles per second
  inum            notnum
  iamp            ampmidi   1                                 ; read in midi velocity (as a value within the range 0 - 1)
  iMidiRef        cabbageGetValue    "MidiRef"                ; MIDI unison reference note
  iFrqRatio       =                  icps/cpsmidinn(iMidiRef) ; derive playback speed from note played in relation to a reference note (MIDI note 60 / middle C)                                          
 
  iAttTim         cabbageGetValue    "AttTim"                 ; read in amplitude envelope attack time widget
  iRelTim         cabbageGetValue    "RelTim"                 ; read in amplitude envelope attack time widget                                                                                                                                   
  if iAttTim>0 then
   kenv           expsegr            0.01, iAttTim, 1, iRelTim, 0.01
  else                                
   kenv           expsegr            1, iRelTim, 0.01         ; attack time is zero so ignore this segment of the envelope (a segment of duration zero is not permitted
  endif
  kenv            expcurve           kenv,8                   ; remap amplitude value with a more natural curve
  aenv            interp             kenv                     ; interpolate and create a-rate envelope
  
  iFileLen        filelen            gSfilepath
  
  if i(gkmode)==3 then
   if gkLoopMode==1 then
    apointer      phasor             (sr*gkSpeed)/gkLoopLen
   elseif gkLoopMode==2 then
    apointer      phasor             -(sr*gkSpeed)/gkLoopLen
   elseif gkLoopMode==3 then
    apointer      poscil             1,(sr*gkSpeed*0.5)/gkLoopLen,giTriangle
   elseif gkLoopMode==4 then
    apointer      poscil             1,(sr*gkSpeed*0.5)/gkLoopLen,giRectSine
   endif
   apointer       =                  (apointer * (gkLoopLen/sr)) + (gkLoopStart/sr)
  else                                                
   apointer       =                  gapointer*iFileLen
  endif

  /* RANDOM POINTER MODULATION */
  if gkPtrModRange>0 then
   kRndPtrRate    init               random(i(gkPtrRate1),i(gkPtrRate2))
   kRndPtrTrig    metro              kRndPtrRate
   kRndPtrRate    trandom            kRndPtrTrig,gkPtrRate1,gkPtrRate2
   kRndPtrPos     trandom            kRndPtrTrig,-gkPtrModRange*iFileLen,gkPtrModRange*iFileLen
   apointer       +=                 interp(kRndPtrPos)
  endif
                                                                        
  ktrig           changed            gkFFTSize
  if ktrig==1 then
   reinit RESTART
  endif
  RESTART:
  
  ; random pitch wobble
  kWob jspline gkWobDepth, gkWobRate*0.5, gkWobRate*2  
  kWobR           jspline   gkWobDepth, gkWobRate*0.5, gkWobRate*2  
 
  ; detune
  iDetune         table     inum, giRandDist    ; read from random distribution table
  kDetune         =         iDetune * gkDetune
  kDetuneR        =         iDetune * (-gkDetune)
 
  if gkStack==1 then
   a1            mincer             apointer, gklevel*iamp, iFrqRatio*gktranspose * cent(kWob+kDetune), gitableL, gklock, giFFTSizes[i(gkFFTSize)-1], i(gkdecim)
   a2            mincer             apointer, gklevel*iamp, iFrqRatio*gktranspose * cent(kWobR+kDetuneR), gitableR, gklock, giFFTSizes[i(gkFFTSize)-1], i(gkdecim)
  else
   if changed:k(gkStack)==1 then
    reinit RESTART_STACK4
   endif
   RESTART_STACK4:
   a1            mincerStack        apointer, gklevel*iamp, iFrqRatio*gktranspose, gitableL, gklock, giFFTSizes[i(gkFFTSize)-1], i(gkdecim), gkScale, gkStackIntvl, gkStackRatio, gkStackStep, gkWobDepth, gkWobRate, gkDetune, 0, giTiltTable, gkporttimeW, i(gkStack), gkStackOffset
   a2            mincerStack        apointer, gklevel*iamp, iFrqRatio*gktranspose, gitableR, gklock, giFFTSizes[i(gkFFTSize)-1], i(gkdecim), gkScale, gkStackIntvl, gkStackRatio, gkStackStep, gkWobDepth, gkWobRate, -gkDetune, 0, giTiltTable, gkporttimeW, i(gkStack), gkStackOffset
  endif
  a1             butlp        a1, sr * 0.5 * aenv  
  a2             butlp        a2, sr * 0.5 * aenv  

                 outs               a1 * aenv, a2 * aenv
  endif

endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>