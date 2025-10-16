

/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; SyncgrainFilePlayer.csd
; Written by Iain McCurdy, 2014, 2025
; 
; The internal pointer used by syncgrain to track progress through the sound file is affected by grain size and density as well as speed 
;  so on accaount of this complication a scrubber line in the waveform view is not yet implemented.

; Open file
; Play/Stop - start playback once a file has been loaded. Playback can also be started using the MIDI keyboard.

; GRAINS
; Density   -  density of the grain stream 
; Dens.OS   -  random fluctuations of the grain density
; Size      -  grain size
; Size OS   -  random fluctuations of the grain size
; Transpose -  transposition of the audio contents within grains (in semitones) 
; Trans. OS -  random fluctuations of the transposition of the audio contents within grains (in semitones) 
; Speed     -  speed with which the start point of grains moves through the loaded sound file
; Shape     -  envelope shape applied to each grain to prevent clicks
;              .Hanning 
;              .Half Sine 
;              .Triangle 
;              .Perc.1 
;              .Perc.2 
;              .Gate 
;              .Rev.Perc.1 
;              .Rev.Perc.2 
;              .Tukey

; Freeze    -  Freeze speed
; XY Filters-  if active, movements in the Y axis of the XY pad controls the cutoff frequencies of a low-pass and high-pass filters

; ENVELOPE  -  amplitude shaping of MIDI notes
; Att. Time -  attack time of the amplitude envelope applied to MIDI-controlled notes
; Rel. Time -  release time of the amplitude envelope applied to MIDI-controlled notes

; CONTROL
; MIDI Ref. -  MIDI note number that will produce unison playback of the source sound file
; Pch Bend  -  pitch bend range in semitones
; Level     -  output amplitude level

; The XY pad automatically controls speed (x direction) and transpose (y direction) in parallel with the dial controls. 
;  If 'XY Filters' is activated, the Y direction also controls the cutoff frequencies of a low-pass and a high-pass filter.

<Cabbage>
form caption("Syncgrain File Player") size(1080,390), colour(0,0,0) pluginId("SGFP"), guiMode("queue")
image        bounds(  0,  0,1080,390), colour( 90, 50, 50), outlineColour("White"), shape("sharp"), line(3)

soundfiler   bounds(  5,  5,687,175), channel("beg","len"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label        bounds(  7,  7,687, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")


#define SLIDER_DESIGN colour(90,50,50), textColour("white"), trackerColour(190,170,130), outlineColour(100,100,100), valueTextBox(1)

image      bounds(  0,180,1085,200), colour(0,0,0,0), outlineColour("white"), line(0), shape("sharp"), plant("controls")
{
filebutton bounds(  5, 20, 80, 25), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse"), corners(5)
checkbox   bounds(  5, 60, 95, 25), channel("PlayStop"), text("Play/Stop"), fontColour:0("white"), fontColour:1("white")
label      bounds(280,  4, 70, 9), text("G   R   A   I   N   S"), fontColour("silver")
rslider    bounds( 90, 15, 90, 90), channel("density"),   range( 0.5,400.00,40, 0.5),  text("Density"),   $SLIDER_DESIGN  
rslider    bounds(160, 15, 90, 90), channel("DensOS"),     range( 0, 5.00, 0),         text("Dens. OS"),   $SLIDER_DESIGN
rslider    bounds(230, 15, 90, 90), channel("grsize"),   range( 0.001,1.00, 0.1, 0.5), text("Size"),      $SLIDER_DESIGN
rslider    bounds(300, 15, 90, 90), channel("SizeOS"),   range( 0, 5.00, 0, 0.5),      text("Size OS"),   $SLIDER_DESIGN
rslider    bounds(370, 15, 90, 90), channel("transpose"), range(-48, 48, 0,1,0.01),       text("Transpose"), $SLIDER_DESIGN
rslider    bounds(440, 15, 90, 90), channel("TransposeOS"), range(0, 36.00, 0),        text("Trans. OS"),  $SLIDER_DESIGN
rslider    bounds(510, 15, 90, 90), channel("speed"),     range( -2.00, 2.00, 1),      text("Speed"),     $SLIDER_DESIGN
label      bounds(600, 12, 74, 10), text("S h a p e"), fontColour("white"), align("centre")
combobox   bounds(600, 22, 74, 18), channel("shape"), items("Hanning", "Half Sine", "Triangle", "Perc.1", "Perc.2", "Gate", "Rev.Perc.1", "Rev.Perc.2", "Tukey"), value(1),fontColour("white")
gentable   bounds(600, 42, 74, 25), tableNumber(1001), channel("WindowTab"), ampRange(0,1,1001), fill(0)
checkbox   bounds(600, 75,100, 15), channel("freeze"), text("Freeze"), colour("LightBlue"), fontColour:0("white"), fontColour:1("white")

line       bounds(695, 10,  2, 95), colour("Grey")

label      bounds(700,  4,145, 9), text("E   N   V   E   L   O   P   E"), fontColour("silver"), align("centre")
rslider    bounds(700, 15, 90, 90), channel("AttTim"),    range(0, 5, 0, 0.5, 0.001),       text("Att. Time"), $SLIDER_DESIGN
rslider    bounds(770, 15, 90, 90), channel("RelTim"),    range(0.01, 5, 0.05, 0.5, 0.001), text("Rel. Time"), $SLIDER_DESIGN

line       bounds(860, 10,  2, 95), colour("Grey")

label      bounds( 865,  4,200, 9), text("C   O   N   T   R   O   L"), fontColour("silver"), align("centre")
rslider    bounds( 860, 15, 90, 90), channel("MidiRef"),   range(0,127,60, 1, 1),      text("MIDI Ref."), $SLIDER_DESIGN
rslider    bounds( 930, 15, 90, 90), channel("PchBnd"),     range(  0,  24, 2, 1,0.1), text("Pch. Bend"),  $SLIDER_DESIGN
rslider    bounds(1000, 15, 90, 90), channel("level"),     range(  0,  3.00, 1, 0.5),  text("Level"),     $SLIDER_DESIGN

keyboard   bounds(  5,115,1070, 80)
}

xypad      bounds(697,  5,243,175), channel("X","Y"), text("X - Speed | Y - Transpose"), fontColour(0,0,0,0)
checkbox   bounds(945, 10,130, 15), channel("XtoSpeed"), text("X to Speed"), colour("Yellow"), fontColour:0("white"), fontColour:1("white"), value(0)
checkbox   bounds(945, 35,130, 15), channel("XtoDens"), text("X to Density"), colour("Yellow"), fontColour:0("white"), fontColour:1("white"), value(0)
checkbox   bounds(945, 70,130, 15), channel("YtoTrans"), text("Y to Transposition"), colour("Yellow"), fontColour:0("white"), fontColour:1("white"), value(0)
checkbox   bounds(945, 95,130, 15), channel("YtoFilters"), text("Y to Filters"), colour("Yellow"), fontColour:0("white"), fontColour:1("white"), value(0)

label    bounds(  5,377,120, 12), text("Iain McCurdy |2014|"), align("left"), fontColour("Silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -+rtmidi=NULL -M0 -dm0
</CsOptions>

<CsInstruments>

ksmps  = 64
nchnls = 2
0dbfs  = 1

massign    0,3
gichans        init    0
giReady        init    0
gSfilepath     init    ""
seed 0

; WINDOWING FUNCTIONS USED TO DYNAMICALLY SHAPE THE GRAINS
; NUM | INIT_TIME | SIZE | GEN_ROUTINE | PARTIAL_NUM | STRENGTH | PHASE
; GRAIN ENVELOPE WINDOW FUNCTION TABLES:
giwfn1    ftgen    0,  0, 131072,  20,   2, 1                                   ; HANNING
giwfn2    ftgen    0,  0, 131072,  9,    0.5, 1, 0                              ; HALF SINE
giwfn3    ftgen    0,  0, 131072,  7,    0, 131072/2, 1, 131072/2, 0            ; TRIANGLE
giwfn4    ftgen    0,  0, 131072,  7,    0, 3072,   1, 128000,    0             ; PERCUSSIVE - STRAIGHT SEGMENTS
giwfn5    ftgen    0,  0, 131072,  5, .001, 3072,   1, 128000, .001             ; PERCUSSIVE - EXPONENTIAL SEGMENTS
giwfn6    ftgen    0,  0, 131072,  7,    0, 1536,   1, 128000,    1, 1536, 0    ; GATE - WITH DE-CLICKING RAMP UP AND RAMP DOWN SEGMENTS
giwfn7    ftgen    0,  0, 131072,  7,    0, 128000, 1, 3072,      0             ; REVERSE PERCUSSIVE - STRAIGHT SEGMENTS
giwfn8    ftgen    0,  0, 131072,  5, .001, 128000, 1, 3072,   .001             ; REVERSE PERCUSSIVE - EXPONENTIAL SEGMENTS

; TukeyWindow
; -----------
; Generates a Tukey window with a variable width.
; A Tukey window is a rectangular window bounded by sigmoids ramping up from zero at the beginning and back down to zero at the end.
; This UDO allows the user to set the ratio between the duration of the sigmoids and the rectangular elements.
;
;  TukeyWindow  ifn, isize, iratio
;
; Initialisation
; --------------
; ifn    --  function table number of the outputted Tukey table.
; isize  --  size of the table (should be a power of two).
; iratio --  ratio between the duration of the sigmoids to the rectangular element. Should be between zero (all rectangular) to 0.5 (all sigmoids).

opcode TukeyWindow,0,iii
 ifn,isize,iratio   xin
 iratio            limit               iratio,2/isize,0.5
 i1                ftgen               0,0,isize,19, 0.5,0.5,270, 0.5
 i2                ftgen               0,0,isize,7, 1,isize,1
 i3                ftgen               0,0,isize,19, 0.5,0.5,90, 0.5
 i_                ftgen               ifn, 0, isize, -18, i1, 1, 0, (isize*iratio), i2, 1, (isize*iratio)+1, (isize-1-(isize*iratio)), i3, 1, (isize-(isize*iratio)), isize-1
                   ftfree              i1, 0
                   ftfree              i2, 0
                   ftfree              i3, 0
endop

giTukey  ftgen        0, 0, 131072, 10, 0
         TukeyWindow  giTukey, ftlen(giTukey), 0.1
giWindowTab ftgen    1001,  0, 128,  20,   2, 1                     ; display table

instr    1
 kRamp             linseg              0,0.02,1
 gkloop            cabbageGetValue     "loop"
 gkPlayStop        cabbageGetValue     "PlayStop"
 gktranspose       cabbageGetValue     "transpose"
 gkTransposeOS     cabbageGetValue     "TransposeOS"
 gkdensity         cabbageGetValue     "density"
 gkDensOS          cabbageGetValue     "DensOS"
 gkgrsize          cabbageGetValue     "grsize"
 gkSizeOS          cabbageGetValue     "SizeOS"
 gkshape           cabbageGetValue     "shape"
 gkshape           init                1
 gkspeed           cabbageGetValue     "speed"
 
  ; XY Pad
  gkXtoSpeed       cabbageGetValue     "XtoSpeed"
  gkXtoDens        cabbageGetValue     "XtoDens"
  gkYtoTrans       cabbageGetValue     "YtoTrans"
  gkYtoFilters     cabbageGetValue     "YtoFilters"
  gkXtoSpeed       init                0
  gkYtoTrans       init                0
  gkYtoFilters     init                0

 kX,kT             cabbageGetValue     "X"
                   cabbageSetValue     "speed", kX*4 - 2, kT*gkXtoSpeed
                   cabbageSetValue     "density", kX^3*395.5 + 0.5, kT*gkXtoDens
 kY,kT             cabbageGetValue     "Y"
                   cabbageSetValue     "transpose", kY*96 - 48, kT*gkYtoTrans
                
  ; filter parameters
  kLPF_CF          scale               cabbageGetValue:k("Y")*2,14,4
  kLPF_CF          limit               kLPF_CF, 4, 14
  gkLPF_CF         portk               kLPF_CF, kRamp*0.05
  kHPF_CF          scale               cabbageGetValue:k("Y")*2-1,14,4
  kHPF_CF          limit               kHPF_CF, 4, 14
  gkHPF_CF         portk               kHPF_CF, kRamp*0.05
 
 gklevel           cabbageGetValue     "level"
 gkfreeze          cabbageGetValue     "freeze"
 gkfreeze          =                   1-gkfreeze
 gkPchBndRng       cabbageGetValue     "PchBnd"
        
 gSfilepath        cabbageGetValue     "filename"
 kNewFileTrg       changed             gSfilepath  ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                            ; if a new file has been loaded...
                   event               "i",99,0,0  ; call instrument to update sample storage function table 
 endif  

 ktrig             trigger             gkPlayStop,0.5,0
                   schedkwhen          ktrig,0,0,2,0,-1
 
 ; rebuild display table for window function
 if changed:k(gkshape)==1 then
                   reinit              REBUILD_WFN_DISP
 endif
 REBUILD_WFN_DISP:
 iwfn              =                   i(gkshape) + giwfn1 - 1  
 iCount            =                   0
 while iCount<ftlen(giWindowTab) do
                   tablew              tablei:i(iCount * ftlen(iwfn)/ftlen(giWindowTab), iwfn), iCount, giWindowTab
 iCount            +=                  1
 od
                   cabbageSet          "WindowTab", "tableNumber", giWindowTab
 rireturn

 ; rebuild display table for window function
 if changed:k(gkshape)==1 then
                   reinit              REBUILD_WFN_DISP
 endif
 REBUILD_WFN_DISP:
 iwfn              =                   i(gkshape) + giwfn1 - 1  
 iCount = 0
 while iCount<ftlen(giWindowTab) do
                   tablew              tablei:i(iCount * ftlen(iwfn)/ftlen(giWindowTab), iwfn), iCount, giWindowTab
 iCount            +=                  1
 od
                   cabbageSet          "WindowTab", "tableNumber", giWindowTab
 rireturn
endin

instr    99    ; load sound file
 gichans           filenchnls          gSfilepath               ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL          ftgen               1,0,0,1,gSfilepath,0,0,1
 if gichans==2 then
  gitableR         ftgen               2,0,0,1,gSfilepath,0,0,2
 endif
 giReady           =                   1                        ; if no string has yet been loaded giReady will be zero
                   cabbageSet          "beg", "file", gSfilepath

  /* write file name to GUI */
 SFileNoExtension  cabbageGetFileNoExtension gSfilepath
                   cabbageSet          "stringbox","text",SFileNoExtension
endin

instr    2    ; triggered by 'play/stop' button
 if gkPlayStop==0 then
                   turnoff
 endif
 if giReady==1 then                                           ; i.e. if a file has been loaded
  iAttTim          cabbageGetValue     "AttTim"               ; read in widgets
  iRelTim          cabbageGetValue     "RelTim"
  if iAttTim>0 then                                           ; is amplitude envelope attack time is greater than zero...
   kenv            linsegr             0,iAttTim,1,iRelTim,0  ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else            
   kenv            linsegr             1,iRelTim,0            ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv             expcurve            kenv,8                 ; remap amplitude value with a more natural curve
  aenv             interp              kenv                   ; interpolate and create a-rate envelope
  kporttime        linseg              0,0.001,0.05           ; portamento time function. (Rises quickly from zero to a held value.)
  kdensity         portk               gkdensity,kporttime    ; apply portamento smoothing to changes in speed
  kprate           portk               gkspeed,kporttime*10
  klevel           portk               gklevel,kporttime      ; apply portamento smoothing to changes in level

  kDensOS          gauss               gkDensOS
  kDensMlt         =                   octave(kDensOS)
  kdensity         =                   kdensity * kDensMlt
  
  ktranspose       portk               gktranspose,kporttime
  kTransposeOS     gauss               gkTransposeOS
  ktranspose       =                   ktranspose + kTransposeOS
  
  kSizeOS          gauss               gkSizeOS
  kgrsize          =                   gkgrsize * octave(kSizeOS)
  
  giolaps          =                   5000
  
  ktrig            changed             gkshape
  if ktrig==1 then
                   reinit              UPDATE
  endif
  UPDATE:

  iwfn             =                   i(gkshape) + giwfn1 - 1 
  if gichans==1 then                                           ; if mono...
   a1              syncgrain           klevel, kdensity, semitone(ktranspose), kgrsize, (kprate*gkfreeze)/(kdensity*kgrsize), gitableL, iwfn, giolaps
   kDensOS         gauss               gkDensOS
   kDensMlt        =                   octave(kDensOS)
   kdensity        =                   kdensity * kDensMlt
   kTransposeOS    gauss               gkTransposeOS
   ktranspose      =                   ktranspose + kTransposeOS
   kSizeOS         gauss               gkSizeOS
   kgrsize         =                   gkgrsize * octave(kSizeOS)
   a2             syncgrain            klevel, kdensity, semitone(ktranspose), kgrsize, (kprate*gkfreeze)/(kdensity*kgrsize), gitableL, iwfn, giolaps
   if gkYtoFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a2             zdf_2pole           a2, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
    a2             zdf_2pole           a2, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif
                   outs                a1*aenv,a2*aenv                    ; send mono audio to both outputs 
  elseif gichans==2 then                                       ; otherwise, if stereo...
   a1              syncgrain           klevel, kdensity, semitone(ktranspose), kgrsize, (kprate*gkfreeze)/(kdensity*kgrsize), gitableL, iwfn, giolaps
   a2              syncgrain           klevel, kdensity, semitone(ktranspose), kgrsize, (kprate*gkfreeze)/(kdensity*kgrsize), gitableR, iwfn, giolaps
   if gkYtoFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a2             zdf_2pole           a2, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
    a2             zdf_2pole           a2, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif
                   outs                a1*aenv,a2*aenv                    ; send stereo signal to outputs
  endif
  rireturn
 endif        
endin

instr    3 ; MIDI-triggered instrument
 icps              cpsmidi                                      ; read in midi note data as cycles per second
 iamp              ampmidi             1                        ; read in midi velocity (as a value within the range 0 - 1)
 kPchBnd           pchbend             0, 1                     ; read in pitch bend
 kPchBnd           *=                  gkPchBndRng
 iAttTim           cabbageGetValue     "AttTim"                 ; read in widgets
 iRelTim           cabbageGetValue     "RelTim"
 iMidiRef          cabbageGetValue     "MidiRef"
 iFrqRatio         =                   icps/cpsmidinn(iMidiRef) ; derive playback speed from note played in relation to a reference note (MIDI note 60 / middle C)

 if giReady==1 then                                             ; i.e. if a file has been loaded
  iAttTim          cabbageGetValue     "AttTim"                 ; read in widgets
  iRelTim          cabbageGetValue     "RelTim"
  if iAttTim>0 then                                             ; is amplitude envelope attack time is greater than zero...
   kenv            linsegr             0,iAttTim,1,iRelTim,0    ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else            
   kenv            linsegr             1,iRelTim,0              ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv             expcurve            kenv,8                   ; remap amplitude value with a more natural curve
  aenv             interp              kenv                     ; interpolate and create a-rate envelope
  kporttime        linseg              0,0.001,0.05             ; portamento time function. (Rises quickly from zero to a held value.)
  kdensity         portk               gkdensity,kporttime      ; apply portamento smoothing to changes in speed
  kprate           portk               gkspeed,kporttime
  klevel           portk               gklevel,kporttime        ; apply portamento smoothing to changes in level
  kPchBnd          portk               kPchBnd, kporttime
 
  kDensOS          gauss               gkDensOS
  kDensMlt         =                   octave(kDensOS)
  kdensity         =                   kdensity * kDensMlt
    
  kSizeOS          rand                gkSizeOS
  kgrsize          =                   gkgrsize * octave(kSizeOS)

  giolaps          =                   5000
  
  ktrig            changed             gkshape
  if ktrig==1 then
                   reinit              UPDATE
  endif
  UPDATE:
  
  iwfn             =                   i(gkshape) + giwfn1 - 1
  if gichans==1 then                                                         ; if mono...
   a1              syncgrain           klevel*iamp, kdensity, iFrqRatio*semitone:k(kPchBnd), kgrsize, (kprate*gkfreeze)/(kdensity*kgrsize), gitableL, iwfn, giolaps
   if gkYtoFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif   
                   outs                a1*aenv,a1*aenv                       ; send mono audio to both outputs 
  elseif gichans==2 then                                                     ; otherwise, if stereo...
   a1              syncgrain           klevel*iamp, kdensity, iFrqRatio*semitone:k(kPchBnd), kgrsize, (kprate*gkfreeze)/(kdensity*kgrsize), gitableL, iwfn, giolaps
   a2              syncgrain           klevel*iamp, kdensity, iFrqRatio*semitone:k(kPchBnd), kgrsize, (kprate*gkfreeze)/(kdensity*kgrsize), gitableR, iwfn, giolaps
   if gkYtoFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a2             zdf_2pole           a2, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
    a2             zdf_2pole           a2, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif
                   outs                a1*aenv,a2*aenv                    ; send stereo signal to outputs
              
  endif
  rireturn
 endif

endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>