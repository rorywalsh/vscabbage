
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; loscil_loscil3FilePlayer.csd
; Written by Iain McCurdy, 2014
; 
; Load a user selected sound file into a GEN 01 function table and plays it back using loscil3. 
; This file player is best suited for polyphonic playback and is less well suited for the playback of very long sound files .
; 
; The sound file can be played back using the Play/Stop button (and the 'Transpose' / 'Speed' buttons to implement pitch/speed change)
;  or it can be played back using the MIDI keyboard.
; 
; The loop points can be set either by using the loop 'Start' and 'End' sliders or by clicking and dragging on the waveform view -
;  - loscil will take the values from the last control input moved.

<Cabbage>
form caption("loscil/loscil3 File Player") size(860,385), colour( 70,  75,  70) pluginId("Losc"), guiMode("queue")

#define SLIDER_STYLE colour( 50, 70, 50), textColour("white"), valueTextBox(1), fontColour("white")

soundfiler bounds(  5,  5,850,175), channel("beg","len"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 

image      bounds(  5,  5,  1,175), alpha(0.5), channel("LoopRegion"), colour(200,200,255)

image      bounds(  0,180,860,220), colour(0,0,0,0), outlineColour("white"), line(2), shape("sharp"), plant("controls")
{
filebutton bounds(  5, 10, 80, 25), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse")
checkbox   bounds(  5, 40, 95, 25), channel("PlayStop"), text("Play/Stop"), colour("yellow"), fontColour:0("white"), fontColour:1("white")

label      bounds(  5, 72, 80, 12), text("Opcode"), fontColour("white"), align("centre")
combobox   bounds(  5, 85, 80, 20), channel("opcode"), items("loscil", "loscil3"), value(1), fontColour("white")

label      bounds(110, 12, 80, 12), text("Looping Mode"), fontColour("white"), align("centre")
combobox   bounds(110, 25, 80, 20), channel("loop"), items("None", "Forward", "Fwd./Bwd."), value(1), fontColour("white")

label      bounds(250,  4, 43,  8), text("L   O   O   P"), fontColour("white")
rslider    bounds(190, 20, 90, 90), channel("LoopStart"), range(0, 1, 0), text("Start"), $SLIDER_STYLE
rslider    bounds(260, 20, 90, 90), channel("LoopEnd"),   range(0, 1, 0), text("End"), $SLIDER_STYLE

line       bounds(340, 10,  2, 95), colour("Grey")

label      bounds(380,  4, 53, 8), text("S   P   E   E   D"), fontColour("white"), align("centre")
rslider    bounds(335, 20, 90, 90), channel("transpose"), range(-72, 72, 0,1,0.1),   text("Transpose"), $SLIDER_STYLE
rslider    bounds(400, 20, 90, 90), channel("speed"),     range( 0, 4.00, 1, 0.5), text("Speed"),     $SLIDER_STYLE

line       bounds(480, 10,  2, 95), colour("Grey")

label      bounds(515,  4, 90,  8), text("E   N   V   E   L   O   P   E"), fontColour("white"), align("centre")
rslider    bounds(475, 20, 90, 90), channel("AttTim"),    range(0, 5, 0, 0.5, 0.001),       text("Att.Tim"), $SLIDER_STYLE
rslider    bounds(545, 20, 90, 90), channel("RelTim"),    range(0.01, 5, 0.05, 0.5, 0.001), text("Rel.Tim"), $SLIDER_STYLE

line       bounds(630, 10,  2, 95), colour("Grey")

label      bounds(710,  4, 80,  8), text("C   O   N   T   R   O   L"), fontColour("white")
rslider    bounds(630, 20, 90, 90), channel("MidiRef"),   range(0,127,60, 1, 0.001),     text("MIDI Ref."), $SLIDER_STYLE
button     bounds(715, 50, 70, 25), channel("Detect"), text("Detect","Detect"), corners(5), colour:0(100,100,130), colour:1(100,100,130), latched(0)
rslider    bounds(780, 20, 90, 90), channel("level"),     range(  0,  3.00, 1, 0.5), text("Level"), $SLIDER_STYLE

keyboard bounds(5,115,850,75)
}

label    bounds(  5,372,120, 12), text("Iain McCurdy |2014|"), align("left"), fontColour("Silver")

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

                massign               0, 3
gichans         init                  0
giReady         init                  0
gSfilepath      init                  ""
gkTabLen        init                  2

instr    1
 gkloop         cabbageGetValue       "loop"
 kLoopStart     cabbageGetValue       "LoopStart"
 kLoopEnd       cabbageGetValue       "LoopEnd"
 kbeg           cabbageGetValue       "beg"                      ; click and drag
 klen           cabbageGetValue       "len"
 gkopcode       cabbageGetValue       "opcode"
 
 ; loop region graphic
 iBounds[]      cabbageGet            "beg", "bounds"
                cabbageSet            changed:k(kLoopStart,kLoopEnd), "LoopRegion", "bounds", iBounds[0] + (iBounds[2] * kLoopStart),   iBounds[1], (iBounds[2] * (kLoopEnd-kLoopStart)),   iBounds[3]

 kLoopEnd       limit                 kLoopEnd,kLoopStart+0.01,1 ; limit loop end to prevent crashes
 
 ; loop points defined by sliders or click and drag...
 kTrigSlid      changed               kLoopStart,kLoopEnd    
 kTrigCAD       changed               kbeg,klen
 if kTrigSlid==1 then
  gkLoopStart   =                    kLoopStart
  gkLoopEnd     =                    kLoopEnd
 elseif kTrigCAD==1 then
                cabbageSetValue       "LoopStart", kbeg/gkTabLen,k(1)
                cabbageSetValue       "LoopEnd", (kbeg+klen)/gkTabLen,k(1)
 endif


 gkPlayStop     cabbageGetValue       "PlayStop"
 gktranspose    cabbageGetValue       "transpose"
 gkspeed        cabbageGetValue       "speed"
 gklevel        cabbageGetValue       "level"

 gSfilepath     cabbageGetValue       "filename"
 kNewFileTrg    changed               gSfilepath    ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                          ; if a new file has been loaded...
                event                 "i",99,0,0    ; call instrument to update sample storage function table 
 endif  
 
 ktrig          trigger            gkPlayStop,0.5,0            ; if play button changes to 'play', generate a trigger
                schedkwhen         ktrig,0,0,2,0,-1                  ; start instr 2 playing a held note

 ktrig1         changed            gktranspose                ; if 'transpose' button is changed generate a '1' trigger
 ktrig2         changed            gkspeed                    ; if 'speed' button is changed generate a '1' trigger
 
 if ktrig1==1 then                ; if transpose control has been changed...
                cabbageSetValue    "speed", semitone(gktranspose), k(1)    ; set speed according to transpose value
 elseif ktrig2==1 then            ; if speed control has been changed...
                cabbageSetValue    "transpose", log2(gkspeed)*12, k(1)     ; set transpose control according to speed value
 endif

 ; detect pitch
 kDetect        cabbageGetValue       "Detect"
 if trigger:k(kDetect,0.5,0)==1 then
  event "i", 200, 0, 30
 endif
 
endin




instr    99    ; load sound file
 gitable        ftgen              1,0,0,1,gSfilepath,0,0,0  ; load sound file into a GEN 01 function table 
 gichans        filenchnls         gSfilepath                ; derive the number of channels (mono=1,stereo=2) in the sound file
 giReady        =                  1                         ; if no string has yet been loaded giReady will be zero
 gkTabLen       init               ftlen(gitable)/gichans    ; table length in sample frames
                cabbageSet         "beg", "file", gSfilepath
endin

instr    2    ; sample triggered by 'play/stop' button
 if gkPlayStop==0 then
  turnoff
 endif
 ktrig changed    gkloop,gkLoopStart,gkLoopEnd,gkopcode
 if ktrig==1 then
  reinit RESTART
 endif
 RESTART:
 if giReady = 1 then                                            ; i.e. if a file has been loaded
  iAttTim       cabbageGetValue    "AttTim"                     ; read in widgets
  iRelTim       cabbageGetValue    "RelTim"
  if iAttTim>0 then                                             ; is amplitude envelope attack time is greater than zero...
   kenv         linsegr            0,iAttTim,1,iRelTim,0        ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else
   kenv         linsegr            1,iRelTim,0                  ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv          expcurve           kenv,8                       ; remap amplitude value with a more natural curve
  aenv          interp             kenv                         ; interpolate and create a-rate envelope
  kporttime     linseg             0,0.001,0.05                 ; portamento time function. (Rises quickly from zero to a held value.)
  kspeed        portk              gkspeed,kporttime            ; apply portamento smoothing to changes in speed
  klevel        portk              gklevel,kporttime            ; apply portamento smoothing to changes in level
  if gichans==1 then                                            ; if mono...
   if i(gkopcode)==1 then
   a1           loscil             klevel,kspeed,gitable,1,i(gkloop)-1,nsamp(gitable)*i(gkLoopStart),nsamp(gitable)*i(gkLoopEnd)    ; use a mono loscil3   
   else
   a1           loscil3            klevel,kspeed,gitable,1,i(gkloop)-1,nsamp(gitable)*i(gkLoopStart),nsamp(gitable)*i(gkLoopEnd)    ; use a mono loscil3
   endif
                outs               a1*aenv,a1*aenv              ; send mono audio to both outputs 
  elseif gichans==2 then                                        ; otherwise, if stereo...
   if i(gkopcode)==1 then
    a1,a2        loscil             klevel,kspeed,gitable,1,i(gkloop)-1,nsamp(gitable)*i(gkLoopStart),nsamp(gitable)*i(gkLoopEnd)    ; use stereo loscil3
   else
    a1,a2        loscil3            klevel,kspeed,gitable,1,i(gkloop)-1,nsamp(gitable)*i(gkLoopStart),nsamp(gitable)*i(gkLoopEnd)    ; use stereo loscil3
   endif   
                outs               a1*aenv,a2*aenv              ; send stereo signal to outputs
  endif               
 endif
endin

instr    3    ; sample triggered by midi note
 icps           cpsmidi                                        ; read in midi note data as cycles per second
 iamp           ampmidi    1                                   ; read in midi velocity (as a value within the range 0 - 1)
 iMidiRef       cabbageGetValue    "MidiRef"

 if giReady==1 then                                            ; i.e. if a file has been loaded
  iAttTim       cabbageGetValue    "AttTim"                    ; read in widgets
  iRelTim       cabbageGetValue    "RelTim"
  if iAttTim>0 then                                            ; is amplitude envelope attack time is greater than zero...
   kenv         linsegr            0,iAttTim,1,iRelTim,0       ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else
   kenv         linsegr            1,iRelTim,0                 ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv          expcurve           kenv,8                      ; remap amplitude value with a more natural curve
  aenv          interp             kenv                        ; interpolate and create a-rate envelope
  kporttime     linseg             0,0.001,0.05                ; portamento time function. (Rises quickly from zero to a held value.)
  ispeed        =                  icps/cpsmidinn(iMidiRef)    ; derive playback speed from note played in relation to a reference note (MIDI note 60 / middle C)
  klevel        portk              gklevel,kporttime           ; apply portamento smoothing to changes in level
  if gichans==1 then                                           ; if mono...
   if i(gkopcode)==1 then
    a1           loscil            klevel*aenv*iamp,ispeed,gitable,1,i(gkloop)-1,nsamp(gitable)*i(gkLoopStart),nsamp(gitable)*i(gkLoopEnd)    ; use a mono loscil3
   else
    a1           loscil3            klevel*aenv*iamp,ispeed,gitable,1,i(gkloop)-1,nsamp(gitable)*i(gkLoopStart),nsamp(gitable)*i(gkLoopEnd)    ; use a mono loscil3
   endif
                outs               a1,a1                       ; send mono audio to both outputs 
  elseif gichans==2 then                                       ; otherwise, if stereo...
   if i(gkopcode)==1 then
    a1,a2        loscil             klevel*aenv*iamp,ispeed,gitable,1,i(gkloop)-1,nsamp(gitable)*i(gkLoopStart),nsamp(gitable)*i(gkLoopEnd)    ; use stereo loscil3
   else
    a1,a2        loscil3            klevel*aenv*iamp,ispeed,gitable,1,i(gkloop)-1,nsamp(gitable)*i(gkLoopStart),nsamp(gitable)*i(gkLoopEnd)    ; use stereo loscil3
   endif
                outs               a1,a2                       ; send stereo signal to outputs
  endif
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
