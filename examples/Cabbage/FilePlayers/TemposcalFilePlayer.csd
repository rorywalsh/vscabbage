	
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; TemposcalFilePlayer.csd
; Written by Iain McCurdy, 2014, 2024.

; Looping produces a little audio wraparound at the end of the note. The best solution might be to add some padding onto the sound file.

; Loads a user-selected sound file into a GEN01 function table and plays it back using temposcal.

; The sound file can be played back using the Play/Stop button (and the 'Transpose' and 'Speed' buttons to implement pitch and speed changes independently.
; Playing back using the MIDI keyboard will implement pitch changes based on key played.
; The MIDI sustain pedal will also activate the freeze function

; Open         -  open a sound file (wav)
; Play/Stop    -  play stop the file without MIDI notes
; Phase Lock   -  lock phases (prevents swirling effect when time pointer is frozen
; Freeze       -  freeze playback pointer
; FFT Size     -  large values will produce less frequency distortion but can reveal the time-domain window and cause echoing effects 
; Tuning       -  tuning of the MIDI keyboard
; Transpose    -  transpose playback (when instrument is triggered from the Play/Stop button, not MIDI notes)
; Speed        -  playback speed, both forwards and backwards
; Speed Mult.  -  scale the range of the 'Speed Mult.' dial
; Env. Follow  -  switch to activate the envelope follower (and enable the controls). 
; Env. Amount  -  amount of influence of the envelope - basically a crossfade between the dial value and the dial value multiplied by the envelope.
; Env. Gain    -  gain applied to the signal input into the envelope follower. This can be useful with signals that are overall low in amplitude.
; Env. Curve   -  response curve of the envelope follower. Values greater than 1 produce curves that are increasingly convex.

; (graphs)
; Speed and transpose graphs are also provided as means to modulate these two parameters.
; The outputs from these graphs are multiplied to the values from the GUI dials.
; The ranges for the two graphs are 0 to 2 so midway on the y-axis corresponds to 1 and therefore no change to the dial value in each case. 
; Graphs can be reset using the two reset buttons. This will flatten the graphs but due to a Cabbage limitation, 
;  the edited table is still stored internally and will be restored if any further editing is done to the graph

; Decimation   -  number of time-domain window overlaps. Very low values can produce amplitude modulation artefacts. i-rate control
; Threshold    -  if this threshold (in dB) between succesive windows is exceeded, tempo scaling is suspended. This can be used to prevent smearing on transients.  i-rate control
; Att. Tim.    -  rise time at the beginnings of notes
; Rel. Tim     -  release time after notes are stopped
; MIDI Ref.    -  the MIDI key that will produce unison playback 
; Pch. Bend    -  range of transposition that the MIDI pitch bend wheel will produce 
; Level        -  output level (scaler)

<Cabbage>
form caption("Temposcal File Player") size(1395,370), colour(30,70,70) pluginId("TScl"), guiMode("queue")

#define SLIDER_DESIGN  colour( 50, 90, 90), textColour("white"), valueTextBox(1), trackerColour("silver"), markerColour("silver")
#define SLIDER_DESIGN2 colour(150, 90, 90), textColour("white"), valueTextBox(1), trackerColour("silver"), markerColour("silver")

soundfiler                  bounds(705,  5,685,100), channel("beg","len"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
image                       bounds(705,  5,  1,100), channel("wiper")
label                       bounds(710,  8,560, 14), text("Click 'Load File'"), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")

; editable tables
button   bounds(705,111, 70, 20), channel("ResetSpeed"), text("Reset"), fontColour:0("white"), fontColour:1("white"), corners(3)
label    bounds(708,133,150, 20), text("S P E E D"), fontColour(170,170,170), align("left")
gentable bounds(705,132,685,100), tableNumber(1001), channel("SpeedTable"), fill(0), ampRange(-2,2,1001), active(1), alpha(0.5)
image    bounds(705,182,685,  1), colour("Grey")

button   bounds(705,241, 70, 22), channel("ResetTranspose"), text("Reset"), fontColour:0("white"), fontColour:1("white"), corners(3)
label    bounds(708,263,150, 20), text("T R A N S P O S E"), fontColour(170,170,170), align("left")
gentable bounds(705,262,685,100), tableNumber(1002), channel("TransposeTable"), fill(0), ampRange(0,2,1002), active(1), alpha(0.5)
image    bounds(705,312,685,  1), colour("Grey")

image    bounds(  0, 15,700,225), colour(0,0,0,0), outlineColour("white"), line(2), shape("sharp"), plant("controls")
{
 filebutton bounds(  5,  5, 80, 25), text("Load File","Load File"), fontColour("white") channel("filename"), shape("ellipse")
 checkbox   bounds(  5, 40, 95, 25), channel("PlayStop"), text("Play/Stop"), fontColour:0("white"), fontColour:1("white"), corners(5)

 checkbox   bounds(  5, 70,100, 15), channel("loop"), text("Loop"), colour("orange"), fontColour:0("white"), fontColour:1("white"), value(1)
 checkbox   bounds(  5, 90,100, 15), channel("lock"), text("Phase Lock"), colour("red"), fontColour:0("white"), fontColour:1("white"), value(1)
 checkbox   bounds(  5,110,100, 15), channel("freeze"), text("Freeze"), colour("LightBlue"), fontColour:0("white"), fontColour:1("white")

 label      bounds(  5,140, 70, 13), text("FFT Size"), fontColour("white"), align("centre")
 combobox   bounds(  5,155, 70, 20), channel("FFTSize"), items("32768", "16384", "8192", "4096", "2048", "1024", "512", "256", "128", "64", "32", "16", "8", "4"), value(4), fontColour("white")

 label      bounds(  5,180, 83, 13), text("Tuning"), fontColour("White")
 combobox   bounds(  5,195, 83, 20), channel("Tuning"), items("12-TET", "24-TET", "12-TET rev.", "24-TET rev.", "10-TET", "36-TET", "Just C", "Just C#", "Just D", "Just D#", "Just E", "Just F", "Just F#", "Just G", "Just G#", "Just A", "Just A#", "Just B"), value(1),fontColour("white")

 rslider    bounds(100,  5, 90, 90), channel("transpose"), range(-96, 96, 0), text("Transpose"), $SLIDER_DESIGN
 rslider    bounds(180,  5, 90, 90), channel("speed"),     range( -32,  32.00, 1), text("Speed"), $SLIDER_DESIGN
 rslider    bounds(260,  5, 90, 90), channel("speedMult"),  range( -1,  1, 1,1,0.0001), text("Speed Mult."), $SLIDER_DESIGN

 image      bounds(350,  2,340,100), colour(0,0,0,0), outlineThickness(1), corners(5) ;;
 checkbox   bounds(360, 27, 85, 14), channel("EnvFollow"), text("Env. Follow"), fontColour:0(255,255,255), fontColour:1(255,255,255)
 checkbox   bounds(360, 57, 85, 14), channel("EnvInv"), text("Invert"), fontColour:0(255,255,255), fontColour:1(255,255,255)

 image      bounds(440,  5,240, 95), colour(255,255,255,0), active(0), channel("EnvControls")
 {
  rslider    bounds(  0,  0, 90, 90), channel("EnvAmt"),  range( 0, 1, 1), text("Env. Amt"), $SLIDER_DESIGN
  rslider    bounds( 80,  0, 90, 90), channel("EnvGain"),  range( 1, 50, 10, 0.5, 0.001), text("Env. Gain"), $SLIDER_DESIGN
  rslider    bounds(160,  0, 90, 90), channel("EnvCurve"),  range( 0.25, 4, 1, 0.5, 0.001), text("Env. Curve"), $SLIDER_DESIGN
 }

 rslider    bounds(100,135, 90, 90), channel("decim"),  range( 1,  16, 4,1,1), text("Decimation"), $SLIDER_DESIGN2
 rslider    bounds(180,135, 90, 90), channel("thresh"),  range( 0.1,  12, 1), text("Threshold"), $SLIDER_DESIGN2
 rslider    bounds(260,135, 90, 90), channel("AttTim"),    range(0, 5, 0, 0.5, 0.001), text("Attack Time"), $SLIDER_DESIGN
 rslider    bounds(340,135, 90, 90), channel("RelTim"),    range(0.01, 5, 0.05, 0.5, 0.001), text("Release Time"), $SLIDER_DESIGN
 rslider    bounds(430,135, 90, 90), channel("MidiRef"),   range(0,127,60, 1, 1), text("MIDI Ref."), $SLIDER_DESIGN
 rslider    bounds(510,135, 90, 90), channel("PchBnd"),     range(  0,  24, 2, 1,0.1), text("Pitch Bend"), $SLIDER_DESIGN
 rslider    bounds(600,135, 90, 90), channel("level"),     range(  0,  3.00, 0.7, 0.5), text("Level"), $SLIDER_DESIGN

}

keyboard   bounds(  5,265,685, 90)
label      bounds(  5,356,120, 13), text("Iain McCurdy |2014|"), align("left"), fontColour("silver")
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

massign    0,3

gichans        init    0        ; 
giReady        init    0        ; flag to indicate function table readiness

giFFTSizes[]    array    32768, 16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4    ; an array is used to store FFT window sizes

gSfilepath    init    ""


giFlat1          ftgen 1000,0,1024,-7,1,1024,1
giSpeedTable     ftgen 1001,0,1024,-7,1,1024,1
giTransposeTable ftgen 1002,0,1024,-7,1,1024,1


; tuning tables
;                               FN_NUM | INIT_TIME | SIZE | GEN_ROUTINE | NUM_GRADES | REPEAT |  BASE_FREQ  | BASE_KEY_MIDI | TUNING_RATIOS:-0-|----1----|---2----|----3----|----4----|----5----|----6----|----7----|----8----|----9----|----10-----|---11----|---12---|---13----|----14---|----15---|---16----|----17---|---18----|---19---|----20----|---21----|---22----|---23---|----24----|----25----|----26----|----27----|----28----|----29----|----30----|----31----|----32----|----33----|----34----|----35----|----36----|
giTTable1     ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(60),      60,                       1, 1.059463,1.1224619,1.1892069,1.2599207,1.33483924,1.414213,1.4983063,1.5874001,1.6817917,1.7817962, 1.8877471,     2 ;STANDARD
giTTable2     ftgen             0,         0,       64,       -2,          24,          2,   cpsmidinn(60),      60,                       1, 1.0293022,1.059463,1.0905076,1.1224619,1.1553525,1.1892069,1.2240532,1.2599207,1.2968391,1.33483924,1.3739531,1.414213,1.4556525,1.4983063, 1.54221, 1.5874001, 1.6339145,1.6817917,1.73107,  1.7817962,1.8340067,1.8877471,1.9430623,    2 ;QUARTER TONES
giTTable3     ftgen             0,         0,       64,       -2,          12,        0.5,   cpsmidinn(60),      60,                       2, 1.8877471,1.7817962,1.6817917,1.5874001,1.4983063,1.414213,1.33483924,1.2599207,1.1892069,1.1224619,1.059463,      1 ;STANDARD REVERSED
giTTable4     ftgen             0,         0,       64,       -2,          24,        0.5,   cpsmidinn(60),      60,                       2, 1.9430623,1.8877471,1.8340067,1.7817962,1.73107, 1.6817917,1.6339145,1.5874001,1.54221,  1.4983063, 1.4556525,1.414213,1.3739531,1.33483924,1.2968391,1.2599207,1.2240532,1.1892069,1.1553525,1.1224619,1.0905076,1.059463, 1.0293022,    1 ;QUARTER TONES REVERSED
giTTable5     ftgen             0,         0,       64,       -2,          10,          2,   cpsmidinn(60),      60,                       1, 1.0717734,1.148698,1.2311444,1.3195079, 1.4142135,1.5157165,1.6245047,1.7411011,1.8660659,     2 ;DECATONIC
giTTable6     ftgen             0,         0,       64,       -2,          36,          2,   cpsmidinn(60),      60,                       1, 1.0194406,1.0392591,1.059463,1.0800596, 1.1010566,1.1224618,1.1442831,1.1665286,1.1892067,1.2123255,1.2358939,1.2599204,1.284414,1.3093838, 1.334839, 1.3607891,1.3872436,1.4142125,1.4417056,1.4697332,1.4983057,1.5274337,1.5571279,1.5873994, 1.6182594,1.6497193, 1.6817909, 1.7144859, 1.7478165, 1.7817951, 1.8164343, 1.8517469, 1.8877459, 1.9244448, 1.9618572,      2 ;THIRD TONES
giTTable7     ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(60),      60,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable8     ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(61),      61,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable9     ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(62),      62,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable10    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(63),      63,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable11    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(64),      64,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable12    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(65),      65,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable13    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(66),      66,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable14    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(67),      67,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable15    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(68),      68,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable16    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(69),      69,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable17    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(70),      70,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable18    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(71),      71,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   










opcode	NextPowerOf2i,i,i
 iInVal	xin
 icount	=	1
 LOOP:
 if 2^icount>iInVal then
  goto DONE
 else
  icount	=	icount + 1
  goto LOOP
 endif
 DONE:
 	xout	2^icount
endop





instr    1
gkPlayStop     cabbageGetValue    "PlayStop"
gkloop         cabbageGetValue    "loop"
gktranspose    cabbageGetValue    "transpose"
gkPchBndRng    cabbageGetValue     "PchBnd"
gklevel        cabbageGetValue    "level"
gkspeed        cabbageGetValue    "speed"
gkspeedMult    cabbageGetValue    "speedMult"
gklock         cabbageGetValue    "lock"
gkfreeze       cabbageGetValue    "freeze"
gkfreeze       =                  1-gkfreeze
gkFFTSize      cabbageGetValue    "FFTSize"
gkdecim        cabbageGetValue    "decim"
gkthresh       cabbageGetValue    "thresh"
gkEnvFollow    cabbageGetValue    "EnvFollow"
               cabbageSet         changed:k(gkEnvFollow), "EnvControls", "active", gkEnvFollow
gkEnvInv       cabbageGetValue    "EnvInv"
gkEnvAmt       cabbageGetValue    "EnvAmt"
gkEnvGain      cabbageGetValue    "EnvGain"
gkEnvCurve     cabbageGetValue    "EnvCurve"

 kResetSpeed cabbageGetValue "ResetSpeed"
 if trigger:k(kResetSpeed,0.5,0)==1 then
  tablecopy giSpeedTable,giFlat1
              cabbageSet          k(1), "SpeedTable", "tableNumber", giSpeedTable
 endif
 kResetTranspose cabbageGetValue "ResetTranspose"
 if trigger:k(kResetTranspose,0.5,0)==1 then
  tablecopy giTransposeTable,giFlat1
              cabbageSet          k(1), "TransposeTable", "tableNumber", giTransposeTable
 endif
 
 gSfilepath    cabbageGetValue    "filename"
 kNewFileTrg   changed            gSfilepath     ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                          ; if a new file has been loaded...
               event              "i", 99, 0, 0  ; call instrument to update sample storage function table 
 endif  

ktrig         trigger             gkPlayStop, 0.5, 0
              schedkwhen          ktrig, 0, 0, 2, 0, -1
endin

instr    99    ; load sound file
 ;iftlen       =                   filelen:i(gSfilepath) * sr  ; file length in sample frames
 ;iftlen       NextPowerOf2i       iftlen                     ; next power of 2
 
 gichans      filenchnls          gSfilepath            ; derive the number of channels (mono=1,stereo=2) in the sound file
 ;gitableL     ftgen               1, 0, iftlen, 1, gSfilepath, 0, 0, 1
 gitableL     ftgen               1, 0, 0, 1, gSfilepath, 0, 0, 1 ; deferred table size
 if gichans==2 then
  ;gitableR    ftgen               2, 0, iftlen, 1, gSfilepath, 0, 0, 2
  gitableR    ftgen               2, 0, 0, 1, gSfilepath, 0, 0, 2 ; deferred table size
 endif
 giReady      =                   1                     ; if no string has yet been loaded giReady will be zero
              cabbageSet          "beg", "file", gSfilepath

  /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet         "stringbox","text",SFileNoExtension

endin

instr    2
 if gkPlayStop==0 then
  turnoff
 endif
 if giReady = 1 then                ; i.e. if a file has been loaded
  ; print scrubber
  iBounds[]    cabbageGet         "beg", "bounds"
  kTabSpeed    init               1
  gkspeed      *=                 kTabSpeed
  kscrubber    phasor             (gkspeed*gkfreeze*gkspeedMult*sr)/ftlen(gitableL)
               cabbageSet         metro:k(20), "wiper", "bounds", iBounds[0]+kscrubber*iBounds[2],iBounds[1],1,iBounds[3]
  
  if trigger:k(kscrubber,0.5,1)==1 && gkloop==0 then
               cabbageSet         metro:k(20), "wiper", "bounds", iBounds[0]*iBounds[2],iBounds[1],1,iBounds[3]
               cabbageSetValue    "PlayStop", 0, trigger:k(kscrubber,0.5,1)
   turnoff
  endif
  
  kTabSpeed    tablei             kscrubber, giSpeedTable, 1
  kTabTranspose tablei            kscrubber, giTransposeTable, 1

  iAttTim     cabbageGetValue    "AttTim"                  ; read in amplitude envelope attack time widget
  iRelTim     cabbageGetValue    "RelTim"                  ; read in amplitude envelope release time widget
  if iAttTim>0 then                ; 
   kenv       linsegr            0, iAttTim, 1, iRelTim, 0
  else                                
   kenv       linsegr            1, iRelTim, 0             ; attack time is zero so ignore this segment of the envelope (a segment of duration zero is not permitted
  endif
  kenv        expcurve           kenv, 8                   ; remap amplitude value with a more natural curve
  aenv        interp             kenv                      ; interpolate and create a-rate envelope

  kporttime   linseg             0, 0.001, 0.05
  ktranspose  portk              gktranspose, kporttime
  
  ; envelope follower
  if gkEnvFollow==1 then
   a1    init   0
   kRMS  rms    a1
   kRMS  limit  kRMS * gkEnvGain, 0.1, 1
   kRMS  =      gkEnvInv == 1 ? (1 - kRMS) : kRMS
   kRMS  logcurve kRMS, gkEnvCurve
   gkspeed ntrpol gkspeed, gkspeed * kRMS, gkEnvAmt
  endif
   
  ktrig       changed            gkFFTSize,gkdecim,gkthresh
  if ktrig==1 then
              reinit             RESTART
  endif
  RESTART:
  if gichans=1 then
   a1         temposcal          gkspeed*gkfreeze*gkspeedMult, gklevel, semitone(ktranspose)*kTabTranspose, gitableL, gklock, giFFTSizes[i(gkFFTSize)-1],i(gkdecim),i(gkthresh)
              outs               a1*aenv,a1*aenv
  elseif gichans=2 then
   a1         temposcal          gkspeed*gkfreeze*gkspeedMult, gklevel, semitone(ktranspose)*kTabTranspose, gitableL, gklock, giFFTSizes[i(gkFFTSize)-1],i(gkdecim),i(gkthresh)
   a2         temposcal          gkspeed*gkfreeze*gkspeedMult, gklevel, semitone(ktranspose)*kTabTranspose, gitableR, gklock, giFFTSizes[i(gkFFTSize)-1],i(gkdecim),i(gkthresh)
              outs               a1*aenv,a2*aenv
 endif
endif

endin




instr    3    ; midi triggered instrument
 if giReady = 1 then                                      ; i.e. if a file has been loaded
;  icps        cpsmidi                                     ; read in midi note data as cycles per second
  iTuning      cabbageGetValue     "Tuning"
  icps         cpstmid             giTTable1 + iTuning - 1
  iamp        ampmidi            1                        ; read in midi velocity (as a value within the range 0 - 1)
  
  kTabSpeed    init               1
  gkspeed      *=                 kTabSpeed
  kscrubber    phasor             (gkspeed*gkfreeze*gkspeedMult*sr)/ftlen(gitableL)
  if trigger:k(kscrubber,0.5,1)==1 && gkloop==0 then
               turnoff
  endif
  kTabSpeed    tablei             kscrubber, giSpeedTable, 1
  kTabTranspose tablei            kscrubber, giTransposeTable, 1
  
  
  
  kPchBnd     pchbend            0, 1                     ; read in pitch bend
  kPchBnd     *=                 gkPchBndRng
  kporttime   linseg             0,0.001,0.05             ; portamento time function. (Rises quickly from zero to a held value.)
  kPchBnd     portk              kPchBnd, kporttime
  kSus        midic7             64,0,1
              cabbageSetValue    "freeze",kSus,trigger:k(kSus,0.5,2)
 
  iMidiRef    cabbageGetValue    "MidiRef"                ; MIDI unison reference note
  iFrqRatio   =                  icps/cpsmidinn(iMidiRef) ; derive playback speed from note played in relation to a reference note (MIDI note 60 / middle C)
 
  iAttTim     cabbageGetValue    "AttTim"                 ; read in amplitude envelope attack time widget
  iRelTim     cabbageGetValue    "RelTim"                 ; read in amplitude envelope attack time widget
  if iAttTim>0 then                ; 
   kenv       linsegr            0,iAttTim,1,iRelTim,0
  else                                
   kenv       linsegr            1,iRelTim,0              ; attack time is zero so ignore this segment of the envelope (a segment of duration zero is not permitted
  endif
  kenv        expcurve           kenv,8                   ; remap amplitude value with a more natural curve
  aenv        interp             kenv                     ; interpolate and create a-rate envelope
  
  ktrig       changed            gkFFTSize
  if ktrig==1 then
   reinit RESTART
  endif
  RESTART:
  if gichans=1 then
   a1         temposcal          gkspeed*gkfreeze*gkspeedMult, gklevel*iamp, iFrqRatio*semitone:k(kPchBnd)*kTabTranspose, gitableL, gklock, giFFTSizes[i(gkFFTSize)-1]
              outs               a1*aenv,a1*aenv
  elseif gichans=2 then
   a1         temposcal          gkspeed*gkfreeze*gkspeedMult, gklevel*iamp, iFrqRatio*semitone:k(kPchBnd)*kTabTranspose, gitableL, gklock, giFFTSizes[i(gkFFTSize)-1]
   a2         temposcal          gkspeed*gkfreeze*gkspeedMult, gklevel*iamp, iFrqRatio*semitone:k(kPchBnd)*kTabTranspose, gitableR, gklock, giFFTSizes[i(gkFFTSize)-1]
              outs               a1*aenv,a2*aenv
  endif
 endif
endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
