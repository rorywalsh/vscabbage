
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */
; SoundwarpFilePlayer.csd
; Written by Iain McCurdy, 2014

; Player can also be activated by using right-click and drag upon the waveform display panel.
;  In this mode, X position equates to pointer position and Y position equates to amplitude (level) and transposition.
;   (Transposition range when using mouse clicking-and-dragging is controlled using the 'Transposition' knob. Therefore if 'Transposition' = zero, no transposition occurs.)

; GRAINS
;  Overlaps                   - number overlapping grains permitted (a density control)
;  Size                       - grain size in sample frames
;  Size OS                    - random offset of window sizes (as a multiple of 'Size')
;  Transpose                  - transposition of the contents of each grain (in semitones)
;  Mode                       - pointer mode
;                               1. Speed control - use of timestretching etc
;                               2. Pointer - manual movement of the play position
;                               3. Select a region from within which grains will be randomly selected
;  Shape                      - window/envelope applied to all grain
;                               1. Hanning
;                               2. Half Sine
;                               3. Attack-Decay (Ctrl. 1 for x-location of breakpoint, ctrl. 2 for shape of segments)
;                               4. Gate - sharp on-off envelope shape  (Ctrl. 1 for width of flat part of window, ctrl. 2 for shape of segments)
;                               5. Impulse - a short impulse-like window 9 (Ctrl. 1 for width of impulse)
;  Pointer                    - manual locating a static grain reading pointer (conditionallty available on 'mode' 2 or 3 selection)
;  Ptr.OS                     - random offsetting of the manual grain pointer control
;  Port                       - portamento control applied to movements made to Pointer and Transpose
;  Padding                    - amount of extra padding added to the beginning and end of the manual pointer slider.
;                                this can be useful when using samples that have no silence at the beginning and end

; ENVELOPE
;  Att.Tim                    - attack time of an amplitude envelope applied to activations of the granular synthesiser (either the GUI button or MIDI)
;  Rel.Tim                    - release time of an amplitude envelope applied to activations of the granular synthesiser (either the GUI button or MIDI)

; CONTROL
;  MIDI Ref.                  - reference note for unison (no transposition) when activated by MIDI notes
;  Detect                     - automatically detect the pitch of the sample chosen and apply this value to MIDI Ref. to ensure that MIDI notes played sound the correct pitch.
;                                a sample is taken 0.3 seconds into the sound file so it is assumed that the sample of a single notes with a noisy attack but reaching the sustain part by 0.3 seconds.
;  Scl. Warp                  - warps (compresses or expands) the MIDI-triggered synth's response to MIDI keys played, about the MIDI ref. point.
;                                a value of 1 produces normal, equally-tempered behaviour.
;  Pch.Bend                   - pitch bend range
;  Level                      - output amplitude control

; Playback speed/pointer, transposition and low and high-pass filters can also be controlled via an XY pad.


<Cabbage>
form caption("Soundwarp File Player") size(1275,440), colour( 30, 90, 60), pluginId("SWPl"), guiMode("queue")

soundfiler bounds(  5,  5,1265,150), channel("beg","len"), colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 10, 10, 560, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")
image      bounds(  5,  5,   1,150), channel("wiper")

hslider    bounds(  0,153,1275, 20), channel("ptr"), range(0,1.00, 0.5,1,0.001), colour( 50,110, 80), trackerColour(150,210,180), visible(0), markerColour("white")

filebutton bounds(  5,185, 80, 22), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse")
checkbox   bounds(  5,220, 95, 22), channel("PlayStop"), text("Play/Stop"), fontColour:0("white"), fontColour:1("white")
label      bounds(  5,243,115, 10), text("[or right-click-and-drag]"), fontColour("white")
checkbox   bounds(  5,260,100, 22), channel("freeze"), text("Freeze"), colour("LightBlue"), fontColour:0("white"), fontColour:1("white")

label      bounds(245,183,180, 11), text("G   R   A   I   N   S"), fontColour("GoldenRod")
rslider    bounds(110,197, 90, 90), channel("overlap"),     range( 1, 500, 100, 1,1),            colour( 50,110, 80), text("Overlaps"),     textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
rslider    bounds(180,197, 90, 90), channel("grsize"),      range( 1, 40000, 1600, 0.5,1),       colour( 50,110, 80), text("Size"),         textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
rslider    bounds(250,197, 90, 90), channel("grsizeOS"),    range( 0, 5.00,   1,  0.5),       colour( 50,110, 80), text("Size OS"),      textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
rslider    bounds(320,197, 90, 90), channel("transpose"),   range(-48, 48, 0,1,0.001),          colour( 50,110, 80), text("Transpose"),    textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")

label      bounds(405,188, 84, 12), text("S h a p e"), fontColour("white"), align("centre")
combobox   bounds(405,201, 84, 20), channel("shape"), items("Hanning", "Half Sine", "Attack-Decay", "Gate", "Impulse"), value(1), fontColour("white")
gentable   bounds(405,224, 84, 25), tableNumber(1001), channel("WindowTab"), ampRange(0,1,1001), fill(0)
hslider    bounds(405,255, 84, 10), channel("WindParmX"), range(0,1,0.1), popupText(0), visible(0)
hslider    bounds(405,270, 84, 10), channel("WindParmY"), range(0,1,0.5), popupText(0), visible(0)

label      bounds(495,188, 84, 12), text("M o d e"), fontColour("white"), align("centre")
combobox   bounds(495,201, 84, 20), channel("mode"), items("Speed", "Pointer", "Region"), value(1), fontColour("white")

image      bounds(565,197,200,100), colour(0,0,0,0), channel("SpeedID")
{
rslider    bounds(  0,  0, 90, 90), channel("speed"),  range(0, 5.00, 1,0.5,0.001),               colour( 50,110, 80), text("Speed"),   textColour("white"), trackerColour(150,210,180), visible(1), valueTextBox(1), fontColour("white")
rslider    bounds( 70,  0, 90, 90), channel("inskip"), range(     0, 1.00, 0),                    colour( 50,110, 80), text("Inskip"),  textColour("white"), trackerColour(150,210,180), visible(1), valueTextBox(1), fontColour("white")
}

image      bounds(565,197,230, 90), colour(0,0,0,0), channel("PtrID"), visible(0)
{
rslider    bounds(  0,  0, 90, 90), channel("ptrOS"),       range(0, 1.000, 0, 0.5, 0.001),       colour( 50,110, 80), text("Ptr.OS"),  textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
rslider    bounds( 70,  0, 90, 90), channel("port"),        range(0,30.000,0.01, 0.5,0.001),      colour( 50,110, 80), text("Port."),   textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
rslider    bounds(140,  0, 90, 90), channel("padding"),     range(0,0.5,0),                       colour( 50,110, 80), text("Padding"),   textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
}

image      bounds( 795,172,470,135), colour(0,0,0,0), outlineThickness(1), corners(5), outlineColour(200,200,200)
xypad      bounds( 800,177,300,125), channel("X","Y"), text("X - Speed/Ptr. | Y - Transpose/Filters"), fontColour(0,0,0,0)
checkbox   bounds(1115,195,130, 15), channel("XtoSpeedPtr"), text("X to Speed/Pointer"), colour("Yellow"), fontColour:0("white"), fontColour:1("white"), value(0)
checkbox   bounds(1115,225,130, 15), channel("YtoTrans"), text("Y to Transposition"), colour("Yellow"), fontColour:0("white"), fontColour:1("white"), value(0)
checkbox   bounds(1115,255,130, 15), channel("YtoFilters"), text("Y to Filters"), colour("Yellow"), fontColour:0("white"), fontColour:1("white"), value(0)


image      bounds(  5,305,300,120), colour(0,0,0,0), outlineThickness(1), corners(5), outlineColour(200,200,200)
{
label      bounds(  0,  3,300, 11), text("M   I   D   I"), fontColour("white"), align("centre"), fontColour("GoldenRod")
rslider    bounds(  0, 17, 90, 90), channel("MidiRef"),   range(0,127,60, 1, 0.01),            colour( 50,110, 80), text("MIDI Ref."), textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
button     bounds( 85, 50, 60, 25), channel("Detect"), text("Detect","Detect"), corners(5), colour:0(100,100,130), colour:1(100,100,130), latched(0)
rslider    bounds(140, 17, 90, 90), channel("SclWarp"),   range(  0,  2, 1,0.5,0.001),      colour( 50,110, 80), text("Scl. Warp"),     textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
rslider    bounds(210, 17, 90, 90), channel("PchBnd"),    range(  0,  24, 2,1,.1),      colour( 50,110, 80), text("Pch.Bend"),     textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
}

image      bounds(310,305,160,120), colour(0,0,0,0), outlineThickness(1), corners(5), outlineColour(200,200,200)
{
label      bounds(  0,  3,160, 11), text("E   N   V   E   L   O   P   E"), fontColour("white"), align("centre"), fontColour("GoldenRod")
rslider    bounds(  0, 17, 90, 90), channel("AttTim"),    range(0, 5.00, 0.01, 0.5, 0.001),  colour( 50,110, 80), text("Att.Tim"), textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
rslider    bounds( 70, 17, 90, 90), channel("RelTim"),    range(0.01, 5, 0.05, 0.5, 0.001),  colour( 50,110, 80), text("Rel.Tim"), textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")
}

keyboard   bounds( 480,315, 680,100)
rslider    bounds(1170,322, 90, 90), channel("level"),     range(  0,  1.00, 0.4, 0.5),      colour( 50,110, 80), text("Level"),     textColour("white"), trackerColour(150,210,180), valueTextBox(1), fontColour("white")

label    bounds(  5,426,120, 13), text("Iain McCurdy |2014|"), align("left"), fontColour("LightGrey")
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
gichans        init       0
gisr           init       44100
giFileLen      init       0
giReady        init       0
gSfilepath     init       ""


; WINDOWING FUNCTIONS USED TO DYNAMICALLY SHAPE THE GRAINS
; NUM | INIT_TIME | SIZE | GEN_ROUTINE | PARTIAL_NUM | STRENGTH | PHASE
; GRAIN ENVELOPE WINDOW FUNCTION TABLES:
iTabSize  =        131072
giwfn1    ftgen    101,  0, iTabSize,  20,   2, 1                                                      ; HANNING
giwfn2    ftgen    102,  0, iTabSize,  9,    0.5, 1, 0                                                 ; HALF SINE
giwfn3    ftgen    103,  0, iTabSize,  7,    0, iTabSize*0.03,   1, iTabSize*0.97,    0                ; ATTACK-DECAY
giwfn4    ftgen    104,  0, iTabSize,  7,    0, iTabSize*0.03,   1, iTabSize*0.94, 1, iTabSize*0.03, 0 ; GATE - WITH DE-CLICKING RAMP UP AND RAMP DOWN SEGMENTS
giImpulse ftgen    105,  0, iTabSize, 20, 6, 1, 0.5                                                    ; IMPULSE

;giwfn     ftgen    1000,  0, iTabSize,  10, 0                     ; window function used

iDispTabSize  =        4096
giDwfn1    ftgen    201,  0, iDispTabSize,  20,   2, 1                                                                  ; HANNING
giDwfn2    ftgen    202,  0, iDispTabSize,  9,    0.5, 1, 0                                                             ; HALF SINE
giDwfn3    ftgen    203,  0, iDispTabSize,  7,    0, iDispTabSize*0.03,   1, iDispTabSize*0.97,    0                    ; ATTACK-DECAY
giDwfn4    ftgen    204,  0, iDispTabSize,  7,    0, iDispTabSize*0.03,   1, iDispTabSize*0.92, 1, iDispTabSize*0.03, 0 ; GATE - WITH DE-CLICKING RAMP UP AND RAMP DOWN SEGMENTS
giDImpulse ftgen    205,  0, iDispTabSize, 20, 6, 1, 0.5                                                                ; IMPULSE

giDispTab  ftgen    1001,  0, iDispTabSize,  20,   2, 1                     ; display table

instr    1
 kramp         linseg              0, 0.01, 0.005    
 gkloop        cabbageGetValue     "loop"
 gkPlayStop    cabbageGetValue     "PlayStop"
 gkfreeze      cabbageGetValue     "freeze"
 gkfreeze      =                   1-gkfreeze
 gktranspose   cabbageGetValue     "transpose"
 gkoverlap     cabbageGetValue     "overlap"
 gkgrsize      cabbageGetValue     "grsize"
 gkgrsizeOS    cabbageGetValue     "grsizeOS"
 
 gkmode        cabbageGetValue     "mode"
 gkmode        init                1
 gkspeed       cabbageGetValue     "speed"
 gkptrOS       cabbageGetValue     "ptrOS"
 gkport        cabbageGetValue     "port"
 gkpadding     cabbageGetValue     "padding"
 kporttime     linseg              0, 0.001, 1
 gkinskip      cabbageGetValue     "inskip"
 gklevel       cabbageGetValue     "level"
 gkLoopStart   cabbageGetValue     "beg"         ; from soundfiler
 gkLoopLen     cabbageGetValue     "len"         ; from soundfiler
 gkPchBndRng   cabbageGetValue     "PchBnd"
 gkSclWarp     cabbageGetValue     "SclWarp"
 gkSclWarp     portk               gkSclWarp, 0.05
 
 ; XY Pad
 gkXtoSpeedPtr    cabbageGetValue     "XtoSpeedPtr"
 gkYtoTrans       cabbageGetValue     "YtoTrans"
 gkYtoFilters     cabbageGetValue     "YtoFilters"
 gkXtoSpeed       init                0
 gkYtoTrans       init                0
 gkYtoFilters     init                0
 kX,kT            cabbageGetValue     "X"
                  cabbageSetValue     "speed", kX*5, kT*gkXtoSpeedPtr
                  cabbageSetValue     "ptr", kX, kT*gkXtoSpeedPtr
 kY,kT            cabbageGetValue     "Y"
                  cabbageSetValue     "transpose", kY*96 - 48, kT*gkYtoTrans
  ; filter parameters
  kLPF_CF          scale               kY*2,14,4
  kLPF_CF          limit               kLPF_CF, 4, 14
  gkLPF_CF         portk               kLPF_CF, kramp*0.05
  kHPF_CF          scale               kY*2-1,14,4
  kHPF_CF          limit               kHPF_CF, 4, 14
  gkHPF_CF         portk               kHPF_CF, kramp*0.05


 
 ; SHOW OR HIDE WIDGETS -------------------------------------
 if changed:k(gkmode)==1 then
    if gkmode==1 then
               cabbageSet          k(1),"SpeedID","visible",1
               cabbageSet          k(1),"PtrID","visible",0
               cabbageSet          k(1),"ptr","visible",0
    endif
    if gkmode==2 then
               cabbageSet          k(1),"SpeedID","visible",0
               cabbageSet          k(1),"PtrID","visible",1
               cabbageSet          k(1),"ptr","visible",1
    endif
    if gkmode==3 then
               cabbageSet          k(1),"SpeedID","visible",0
               cabbageSet          k(1),"PtrID","visible",0
               cabbageSet          k(1),"ptr","visible",0
    endif
 endif
; -----------------------------------------------------------

 ; load sound file via OPEN FILE button
 gSfilepath    cabbageGetValue     "filename"
 kNewFileTrg   changed             gSfilepath    ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                          ; if a new file has been loaded...
               event               "i",99,0,0    ; call instrument to update sample storage function table 
 endif  

 ; load sound via drop
 gSDropFile     cabbageGet         "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
                 event             "i",100,0,0         ; load dropped file
 endif

 ktrig         trigger             gkPlayStop,0.5,0
               schedkwhen          ktrig,0,0,2,0,-1

 /* MOUSE SCRUBBING */
 gkMOUSE_DOWN_RIGHT cabbageGetValue    "MOUSE_DOWN_RIGHT"    ; Read in mouse left click status
 kStartScrub   trigger             gkMOUSE_DOWN_RIGHT,0.5,0
 
 if gkMOUSE_DOWN_RIGHT==1 then ; mouse scrubbing mode
  gkmode       =                   2
  if kStartScrub==1 then 
               reinit              RAMP_FUNC
  endif
  RAMP_FUNC:
  krampup      linseg              0,0.001,1
  rireturn
  kMOUSE_X     cabbageGetValue     "MOUSE_X"
  kMOUSE_Y     cabbageGetValue     "MOUSE_Y"
  kMOUSE_X     =                   (kMOUSE_X - 5) / 945                            ; normalise position value over waveform (0 to 1)
  kMOUSE_Y     portk               1 - ((kMOUSE_Y - 5) / 175), krampup*0.05        ; SOME SMOOTHING OF DENSITY CHANGES VIA THE MOUSE ENHANCES PERFORMANCE RESULTS. MAKE ANY ADJUSTMENTS WITH ADDITIONAL CONSIDERATION OF guiRefresh VALUE 
  ;;printk2 kMOUSE_Y
  gkptr        limit               kMOUSE_X,0,1
  gklevel      limit               kMOUSE_Y^2, 0, 1
  gktranspose  =                   ((kMOUSE_Y*2)-1)*gktranspose    ;, -gktranspose, gktranspose
               schedkwhen          kStartScrub,0,0,2,0,-1
 else ; pointer mode
  kptr         cabbageGetValue     "ptr"
  gkptr        portk               kptr, gkport * kporttime
  gklevel      cabbageGetValue     "level"
 endif 

 ; detect pitch
 kDetect        cabbageGetValue       "Detect"
 if trigger:k(kDetect,0.5,0)==1 then
  event "i", 200, 0, 30
 endif
 
 ; rebuild display table for window function
 gkshape       cabbageGetValue     "shape"
 gkshape       init                1
 gkWindParmX    cabbageGetValue     "WindParmX"
 gkWindParmY    cabbageGetValue     "WindParmY"
 if metro:k(16)==1 then
  if changed:k(gkshape,gkWindParmX,gkWindParmY)==1 then
   reinit REBUILD_WFN_DISP
  endif
 endif
 REBUILD_WFN_DISP:
  if i(gkshape)==3 || i(gkshape)==4  || i(gkshape)==5 then
   cabbageSet "WindParmX", "visible", 1
  else
   cabbageSet "WindParmX", "visible", 0
  endif
  if i(gkshape)==3 || i(gkshape)==4 then
   cabbageSet "WindParmY", "visible", 1
  else
   cabbageSet "WindParmY", "visible", 0
  endif
  
 ; attack-decay
 i_         ftgen      giwfn3,   0, ftlen(giwfn3),  16,    0, ftlen(giwfn3)*((i(gkWindParmX)*0.94)+0.03), i(gkWindParmY)*16 - 8,   1, ftlen(giwfn3)*(((1-i(gkWindParmX))*0.94)+0.03),  (1-i(gkWindParmY))*16 - 8, 0  ; ATTACK-DECAY
 i_         ftgen      giDwfn3,  0, ftlen(giDwfn3), 16,    0, ftlen(giDwfn3)*((i(gkWindParmX)*0.9)+0.03), i(gkWindParmY)*16 - 8,   1, ftlen(giDwfn3)*(((1-i(gkWindParmX))*0.94)+0.03), (1-i(gkWindParmY))*16 - 8, 0  ; ATTACK-DECAY
 ; gate
 i_         ftgen      giwfn4,   0, ftlen(giwfn4),  16,    0, ftlen(giwfn4)*(i(gkWindParmX)*0.45 + 0.05),   i(gkWindParmY)*32 - 16,   1, ftlen(giwfn4)*(0.9-(i(gkWindParmX)*0.9)),0, 1, ftlen(giwfn4)*(i(gkWindParmX)*0.45 + 0.05),    (1-i(gkWindParmY))*32 - 16, 0 ; GATE - WITH DE-CLICKING RAMP UP AND RAMP DOWN SEGMENTS
 i_         ftgen      giDwfn4,  0, ftlen(giDwfn4),  16,   0, ftlen(giDwfn4)*(i(gkWindParmX)*0.44 + 0.045), i(gkWindParmY)*32 - 16,   1, ftlen(giDwfn4)*(0.9-(i(gkWindParmX)*0.9)),0, 1, ftlen(giDwfn4)*(i(gkWindParmX)*0.44 + 0.045), (1-i(gkWindParmY))*32 - 16, 0 ; GATE - WITH DE-CLICKING RAMP UP AND RAMP DOWN SEGMENTS
 ; impulse
 i_         ftgen       giImpulse, 0, ftlen(giImpulse), 20, 6, 1, 0.1 + i(gkWindParmX)^2 * 2
 i_         ftgen       giDImpulse, 0, ftlen(giDImpulse), 20, 6, 1, 0.1 + i(gkWindParmX)^2 * 2
 
 ; update GUI display
 iDwfn          =           i(gkshape) + giDwfn1 - 1 ; display table chosen
 tableicopy giDispTab, iDwfn                       ; copy to fixed table number display table used by widget
 cabbageSet "WindowTab", "tableNumber", giDispTab  ; update GUI widget
 rireturn
 
endin



instr    99    ; load sound file
 gichans       filenchnls          gSfilepath                ; derive the number of channels (mono=1,stereo=2) in the sound file
 giFileLen     filelen             gSfilepath
 gisr          filesr              gSfilepath
 gitableL      ftgen               1,0,0,1,gSfilepath,0,0,1
 if gichans==2 then
  gitableR     ftgen               2,0,0,1,gSfilepath,0,0,2
 endif
 giReady       =                   1                         ; if no string has yet been loaded giReady will be zero

               cabbageSet          "beg", "file", gSfilepath

 ; write file name to GUI
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet       "stringbox","text",SFileNoExtension

endin


instr    100 ; LOAD DROPPED SOUND FILE
 gichans          filenchnls       gSDropFile                    ; derive the number of channels (mono=1,stereo=2) in the sound file
 giFileLen        filelen          gSDropFile                    ; derive the file duration in seconds
 gisr             filesr           gSDropFile
 gitableL         ftgen            1,0,0,1,gSDropFile,0,0,1
 gkTabLen         init             ftlen(gitableL)               ; table length in sample frames
 if gichans==2 then
  gitableR        ftgen            2,0,0,1,gSDropFile,0,0,2
 endif
 gkReady          init             1                             ; if no string has yet been loaded gkReady will be zero
                  cabbageSet       "beg", "file", gSDropFile

 ; write file name to GUI
 SFileNoExtension cabbageGetFileNoExtension gSDropFile
                  cabbageSet       "stringbox","text",SFileNoExtension
endin


instr    2    ; triggered by 'play/stop' button
 if gkPlayStop==0&&gkMOUSE_DOWN_RIGHT==0 then
               turnoff
 endif
 
 if giReady==1 then                                                   ; if a file has been loaded...
  iAttTim      cabbageGetValue     "AttTim"                           ; read in widgets
  iRelTim      cabbageGetValue     "RelTim"
  if iAttTim>0 then                                                   ; is amplitude envelope attack time is greater than zero...
   kenv        linsegr             0,iAttTim,1,iRelTim,0              ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else            
   kenv        linsegr             1,iRelTim,0                        ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv         expcurve            kenv,8                             ; remap amplitude value with a more natural curve
  aenv         interp              kenv                               ; interpolate and create a-rate envelope

  kporttime    linseg              0,0.001,0.02                       ; portamento time function. (Rises quickly from zero to a held value.)

  kspeed       portk               gkspeed*ftsr(gitableL)/sr, kporttime
  kptr         portk               gkptr*ftsr(gitableL)/sr, kporttime ; rescale pointer location if there is a mismatch between sample rate of file and Cabbage sample rate 
  
  ktranspose   portk               gktranspose,kporttime*3            ; smooth changes to transposition changes
  
  ktrig        changed             gkshape, gkoverlap, gkgrsize, gkgrsizeOS, gkmode, gkinskip
  if ktrig==1 then
               reinit              UPDATE
  endif
  UPDATE:
  
  iwfn         =                   i(gkshape) + giwfn1 - 1
  imode        =                   i(gkmode) - 1

  ; calculate wiper position 
  if imode==0 then                                                 ; timestretch mode
   iPMode      =                   0
   kwarp       =                   1/(kspeed*gkfreeze)
   ibeg        =                   i(gkinskip) * giFileLen
   kwiper   init                ibeg*sr
   kwiper   +=                  kspeed*ksmps*gkfreeze
  elseif imode==1 then                                             ; pointer mode
   iPMode      =                   1
   kwarp       =                   (giFileLen * kptr * ((giFileLen+(gkpadding*2))/giFileLen)) - gkpadding ; scale pointer according to file length (in seconds) and add padding
   ibeg        =                   0
   kptrOS      gauss               (giFileLen - kwarp) * gkptrOS   
   kwarp       =                   kwarp + kptrOS
   
   kwiper      =                   (kwarp + kptrOS) * sr
  else                                                             ; region mode
   iPMode      =                   1                               ; sndwarp mode used in region mode will be pointer mode
   kwarp       random              gkLoopStart/sr,(gkLoopStart+gkLoopLen)/sr
   ibeg        =                   0
   kwiper      =                   kwarp * sr
  endif 

  apch         interp              semitone(ktranspose)
  klevel       portk               gklevel/(i(gkoverlap)^0.25), kporttime    ; apply portamento smoothing to changes in level
  
  ;; note that:
  ;; 1. grain size offset is expressed as a factor of the grain size
  ;; 2. grain size offsets are *only* added, therefore compensation is made to the grain size so that the average grain size remains the same, regardless of the setting for grain size offset
  
  if gichans==1 then                                                         ; if mono...   
   a1          sndwarp             1, kwarp, apch*gisr/sr, gitableL, ibeg, i(gkgrsize) - (i(gkgrsize) * i(gkgrsizeOS) * 0.5), i(gkgrsize) * i(gkgrsizeOS), i(gkoverlap), iwfn, iPMode
   a2          sndwarp             1, kwarp, apch*gisr/sr, gitableL, ibeg, i(gkgrsize) - (i(gkgrsize) * i(gkgrsizeOS) * 0.5), i(gkgrsize) * i(gkgrsizeOS), i(gkoverlap), iwfn, iPMode
   if gkYtoFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a2             zdf_2pole           a2, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
    a2             zdf_2pole           a2, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif
               outs                a1*aenv*a(klevel),a2*aenv*a(klevel)       ; send mono audio to both outputs 
  elseif gichans==2 then                                                     ; otherwise, if stereo...
   a1          sndwarp             1, kwarp, apch*gisr/sr, gitableL, ibeg, i(gkgrsize) - (i(gkgrsize) * i(gkgrsizeOS) * 0.5), i(gkgrsize) * i(gkgrsizeOS), i(gkoverlap), iwfn, iPMode
   a2          sndwarp             1, kwarp, apch*gisr/sr, gitableR, ibeg, i(gkgrsize) - (i(gkgrsize) * i(gkgrsizeOS) * 0.5), i(gkgrsize) * i(gkgrsizeOS), i(gkoverlap), iwfn, iPMode
   if gkYtoFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a2             zdf_2pole           a2, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
    a2             zdf_2pole           a2, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif
               outs                a1*aenv*a(klevel),a2*aenv*a(klevel)       ; send stereo signal to outputs
  endif
               rireturn
 endif

 ; print wiper
 kX            =                   kwiper/(ftlen(gitableL)) ; normalised
 iBounds[]     cabbageGet          "beg", "bounds"
               cabbageSet          changed:k(kwiper), "wiper", "bounds", iBounds[0] + iBounds[2]*kX, iBounds[1], 1, iBounds[3]


endin

instr    3 ; MIDI triggered instrument
 icps          cpsmidi                                      ; read in midi note data as cycles per second
 iamp          ampmidi             1                        ; read in midi velocity (as a value within the range 0 - 1)
 kPchBnd       pchbend             0, 1                     ; read in pitch bend
 kPchBnd       *=                  gkPchBndRng
 iAttTim       cabbageGetValue    "AttTim"                  ; read in widgets
 iRelTim       cabbageGetValue    "RelTim"
 iMidiRef      cabbageGetValue    "MidiRef"
 iFrqRatio     =                  icps/cpsmidinn(iMidiRef) ; derive playback speed from note played in relation to a reference note (MIDI note 60 / middle C)
 kFrqRatio     =                  iFrqRatio ^ gkSclWarp    ; warp scale
 
 if giReady==1 then                                       ; i.e. if a file has been loaded
  iAttTim      cabbageGetValue    "AttTim"                 ; read in widgets
  iRelTim      cabbageGetValue    "RelTim"
  if iAttTim>0 then                                       ; is amplitude envelope attack time is greater than zero...
   kenv        linsegr            0,iAttTim,1,iRelTim,0   ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else            
   kenv        linsegr            1,iRelTim,0             ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv         expcurve           kenv,8                  ; remap amplitude value with a more natural curve
  aenv         interp             kenv                    ; interpolate and create a-rate envelope

  kporttime    linseg             0,0.001,0.05            ; portamento time function. (Rises quickly from zero to a held value.)

  kspeed       portk              gkspeed,kporttime
  kptr         portk              gkptr*ftsr(gitableL)/sr, kporttime ; rescale pointer location if there is a mismatch between sample rate of file and Cabbage sample rate 
  kPchBnd      portk              kPchBnd, kporttime
  
  ktrig        changed            gkshape,gkoverlap,gkgrsize,gkgrsizeOS,gkmode,gkinskip
  if ktrig==1 then
   reinit    UPDATE
  endif
  UPDATE:
  
  iwfn         =                  i(gkshape) + giwfn1 - 1
  imode        =                  i(gkmode) - 1
  
  if imode==0 then                                             ; timestretch mode
   kwarp       =                  1/(kspeed*gkfreeze)
   ibeg        =                  i(gkinskip) * giFileLen
   kwiper      init               ibeg*sr
   kwiper      +=                 kspeed*ksmps*gkfreeze
  elseif imode==1 then                                         ; pointer mode
   iPMode      =                  1
   kwarp       =                  (giFileLen * kptr * ((giFileLen+(gkpadding*2))/giFileLen)) - gkpadding ; scale pointer according to file length (in seconds) and add padding
   ibeg        =                  0
   kptrOS      gauss              (giFileLen - kwarp) * gkptrOS
   kwarp       limit              kwarp + kptrOS, 0, ftlen(gitableL)/sr ; add offset and protect against out-of-range values
   kwiper      =                  (kwarp + kptrOS) * sr
  else                                                         ; region mode
   imode       =                  1                            ; sndwarp mode used in region mode will be pointer mode
   kwarp       random             gkLoopStart/sr,(gkLoopStart+gkLoopLen)/sr
   ibeg        =                  0
   kwiper      =                  kwarp * sr
  endif


  klevel      portk               gklevel/(i(gkoverlap)^0.25), kporttime                             ; apply portamento smoothing to changes in level

  if gichans==1 then                                                                                 ; if mono...
   a1         sndwarp             iamp, kwarp, a(kFrqRatio*semitone:k(kPchBnd))*gisr/sr, gitableL, ibeg, i(gkgrsize) - (i(gkgrsize) * i(gkgrsizeOS) * 0.5), i(gkgrsize) * i(gkgrsizeOS), i(gkoverlap), iwfn, imode
   a2         sndwarp             iamp, kwarp, a(kFrqRatio*semitone:k(kPchBnd))*gisr/sr, gitableL, ibeg, i(gkgrsize) - (i(gkgrsize) * i(gkgrsizeOS) * 0.5), i(gkgrsize) * i(gkgrsizeOS), i(gkoverlap), iwfn, imode
   if gkYtoFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a2             zdf_2pole           a2, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
    a2             zdf_2pole           a2, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif
              outs                a1*aenv*a(klevel), a2*aenv*a(klevel)                               ; send mono audio to both outputs 
  elseif gichans==2 then                                                                             ; otherwise, if stereo...
   a1         sndwarp             iamp, kwarp, a(kFrqRatio*semitone:k(kPchBnd))*gisr/sr, gitableL, ibeg, i(gkgrsize) - (i(gkgrsize) * i(gkgrsizeOS) * 0.5), i(gkgrsize) * i(gkgrsizeOS), i(gkoverlap), iwfn, imode
   a2         sndwarp             iamp, kwarp, a(kFrqRatio*semitone:k(kPchBnd))*gisr/sr, gitableR, ibeg, i(gkgrsize) - (i(gkgrsize) * i(gkgrsizeOS) * 0.5), i(gkgrsize) * i(gkgrsizeOS), i(gkoverlap), iwfn, imode
   if gkYtoFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a2             zdf_2pole           a2, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
    a2             zdf_2pole           a2, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif
              outs                a1*aenv*a(klevel), a2*aenv*a(klevel)                               ; send stereo signal to outputs
  endif
              rireturn
 endif

 iactive      active              p1
 if iactive==1 then ; only print first voice wiper
  ; print wiper
  kX        =         kwiper/(ftlen(gitableL)) ; normalised
  iBounds[] cabbageGet "beg", "bounds"
  cabbageSet changed:k(kwiper), "wiper", "bounds", iBounds[0] + iBounds[2]*kX, iBounds[1], 1, iBounds[3]
 endif
endin




 instr 200 ; detect pitch of sample and send to MIDI reference
  gitable        ftgen              1,0,0,1,gSfilepath,0,0,0  ; load sound file into a GEN 01 function table 
  gichans        filenchnls         gSfilepath                ; derive the number of channels (mono=1,stereo=2) in the sound file
  giReady        =                  1                         ; if no string has yet been loaded giReady will be zero
  gkTabLen       init               ftlen(gitable)/gichans    ; table length in sample frames
                 cabbageSet         "beg", "file", gSfilepath
  if gichans==1 then
   aL            diskin2            gSfilepath, 1
  elseif  gichans==2 then
   aL,aR         diskin2            gSfilepath, 1
  endif  
  kcps, krms  pitchamdf  aL, 20, 5000
  if timeinsts:k() >= 0.3 then
   kNote         =                  ftom:k(kcps)
                 cabbageSetValue    "MidiRef",kNote
                 turnoff
  endif
 endin




</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
