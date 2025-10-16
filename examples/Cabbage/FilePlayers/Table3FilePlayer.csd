
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Table3FilePlayer.csd
; Written by Iain McCurdy, 2014

; A sound file can be loaded either via the Open File button and browsing or by simply dropping a file onto the GUI window.

; Loop points can be edited by using either the sliders 'Start' and 'End' or by clicking and dragging on the waveform view.
;  Edit mode (dials or click-and-drag) is selected automatically according to the last method used.

; L O O P 
; Open File
; Play/Stop
; Looping Mode
; Window
; Start
; End
; Offset
; Portamento

; S P E E D
; Semitones
; Speed

; E N V E L O P E
; Att. Time
; Rel. Time

; C O N T R O L
; MIDI Ref.
; Detect
; Pitch Bend
; Level

<Cabbage>
form caption("Table3 File Player") size(1110,500), colour( 30, 30, 70), pluginId("T3Pl"), guiMode("queue")

#define SLIDER_STYLE colour(60, 60,100), textColour("white"), trackerColour(210,210,250), valueTextBox(1)

hslider    bounds(  0,  5,1110, 15), channel("LoopStart"), range(0, 1, 0,1,0.001), popupText(0), trackerColour(210,210,250)
soundfiler bounds(  5, 25,1100,175), channel("beg","len"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
image      bounds(  5, 25,   1,175), alpha(0.5), channel("LoopRegion"), colour(200,200,255)
label      bounds(  6, 24, 560, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")
hslider    bounds(  0,200,1110, 15), channel("LoopEnd"),   range(0, 1, 1,1,0.001), popupText(0), trackerColour(210,210,250)

filebutton bounds(  5,230, 80, 25), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse")
checkbox   bounds(  5,260, 95, 25), channel("PlayStop"), text("Play/Stop"), colour("yellow"), fontColour:0("white"), fontColour:1("white")

image      bounds(100,225,385,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label      bounds(  0,  2,385, 12), text("L   O   O   P"), fontColour("white")
checkbox   bounds( 20, 85, 95, 15), channel("Window"), text("Window"), colour("yellow"), fontColour:0("white"), fontColour:1("white")
groupbox   bounds( 10, 25,100, 50), plant("looping"), text("Looping Mode"), fontColour("white")
 {
 combobox   bounds( 10, 25, 80, 20), channel("mode"), items("Forward", "Backward", "Fwd./Bwd."), value(1), fontColour("white")
 }

rslider    bounds(305, 20, 70, 90), channel("Portamento"),   range(0,1,0.00), text("Portamento"), $SLIDER_STYLE
}

image      bounds(490,225,155,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label      bounds(  0,  2,155, 12), text("S   P   E   E   D"), fontColour("white")
rslider    bounds( 10, 20, 70, 90), channel("transpose"), range(-72, 72, 0,1,0.01), text("Semitones"), $SLIDER_STYLE
rslider    bounds( 75, 20, 70, 90), channel("speed"),     range(0, 32.00, 1, 0.5, 0.001), text("Speed"), $SLIDER_STYLE
}

image      bounds(650,225,155,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label      bounds(  0,  2,155, 12), text("E   N   V   E   L   O   P   E"), fontColour("white")
rslider    bounds( 10, 20, 70, 90), channel("AttTim"),    range(0, 5, 0.01, 0.5, 0.001), text("Att. Time"), $SLIDER_STYLE
rslider    bounds( 75, 20, 70, 90), channel("RelTim"),    range(0.01, 5, 0.05, 0.5, 0.001), text("Rel. Time"), $SLIDER_STYLE
}

image      bounds(810,225,295,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label      bounds(  0,  2,285, 12), text("C   O   N   T   R   O   L"), fontColour("white")
rslider    bounds( 10, 20, 70, 90), channel("MidiRef"),   range(0,127,60, 1, 1), text("MIDI Ref."), $SLIDER_STYLE
button     bounds( 85, 52, 60, 25), channel("Detect"), text("Detect","Detect"), corners(3), colour:0(100,100,130), colour:1(100,100,130), latched(0)
rslider    bounds(150, 20, 70, 90), channel("PchBnd"),    range(  0,  24.00, 2, 1,0.1), text("Pitch Bend"), $SLIDER_STYLE
rslider    bounds(215, 20, 70, 90), channel("level"),     range(  0,  3.00, 1, 0.5), text("Level"), $SLIDER_STYLE
}

keyboard bounds(  5,350, 1100, 75)

label    bounds(  5,427,120, 12), text("Iain McCurdy |2014|"), align("left"), fontColour("Silver")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -+rtmidi=NULL -M0 -dm0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps = 32
nchnls = 2
0dbfs = 1

                      massign             0,3
gichans               init                0
giFileLen             init                0
giReady               init                0
gSfilepath            init                ""
gkTabLen              init                2
gitri                 ftgen               0,0,131072,7,0,131072/2,1,131072/2,0
gkEditMode            init                2    ; 1 = CAD 2 = sliders



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
 ifn,isize,iratio xin
 iratio            limit               iratio,2/isize,0.5
 i1                ftgen               0,0,isize,19, 0.5,0.5,270, 0.5
 i2                ftgen               0,0,isize,7, 1,isize,1
 i3                ftgen               0,0,isize,19, 0.5,0.5,90, 0.5
 i_                ftgen               ifn, 0, isize, -18, i1, 1, 0, (isize*iratio), i2, 1, (isize*iratio)+1, (isize-1-(isize*iratio)), i3, 1, (isize-(isize*iratio)), isize-1
                   ftfree              i1, 0
                   ftfree              i2, 0
                   ftfree              i3, 0
endop

giTukey            ftgen               0, 0, 131072, 10, 0
                   TukeyWindow         giTukey, ftlen(giTukey), 0.1



instr    1    ; Read in widgets
 kbeg              cabbageGetValue     "beg"              ; Click-and-drag
 klen              cabbageGetValue     "len"
 
 gkLoopStart       cabbageGetValue     "LoopStart"        ; Sliders
 gkLoopEnd         cabbageGetValue     "LoopEnd"

; read soundfiler bounds
iBounds[]          cabbageGet          "beg", "bounds"
iOLX               =                   iBounds[0]
iOLY               =                   iBounds[1]
iOLWidth           =                   iBounds[2]
iOLHeight          =                   iBounds[3]

; Adjust graphical loop overlay
if gkLoopEnd>gkLoopStart then
 kOLX              limit               iOLX + (gkLoopStart * iOLWidth), iOLX, iOLX + iOLWidth 
 kOLWid            limit               iOLWidth-(gkLoopStart*iOLWidth)-((1-gkLoopEnd)*iOLWidth), 0, iOLX + iOLWidth - kOLX 
                   cabbageSet          changed:k(gkLoopStart,gkLoopEnd), "LoopDisplay", "bounds", kOLX, iOLY, kOLWid, iOLHeight
else
 kOLX              limit               iOLX + (gkLoopEnd * iOLWidth), iOLX, iOLX + iOLWidth 
 kOLWid            limit               iOLWidth-(gkLoopEnd*iOLWidth)-((1-gkLoopStart)*iOLWidth), 0, iOLX + iOLWidth - kOLX 
                   cabbageSet          changed:k(gkLoopStart,gkLoopEnd), "LoopDisplay", "bounds", kOLX, iOLY, kOLWid, iOLHeight
endif

; Mouse-Move
kMouseDownLeft     cabbageGetValue     "MOUSE_DOWN_LEFT"
kMouseMoveFlag     init                0
kMouseX            cabbageGetValue     "MOUSE_X"
kMouseXPrev        init                i(kMouseX)
kMouseY            cabbageGetValue     "MOUSE_Y"
if trigger:k(kMouseDownLeft,0.5,0)==1 then
 kMouseMoveFlag    =                   (kMouseDownLeft==1 && kMouseX>kOLX && kMouseX<(kOLX+kOLWid) && kMouseY>iOLY  && kMouseY<(iOLY+iOLHeight)) ? 1 : 0
elseif trigger:k(kMouseDownLeft,0.5,1)==1 then
 kMouseMoveFlag    =                   0
endif
if kMouseMoveFlag==1 && changed:k(kMouseX - kMouseXPrev)==1 then
                   cabbageSetValue     "LoopStart", limit:k(gkLoopStart + (kMouseX-kMouseXPrev)/iOLWidth, 0, 1)
                   cabbageSetValue     "LoopEnd", limit:k(gkLoopEnd + (kMouseX-kMouseXPrev)/iOLWidth, 0, 1)
endif
kMouseXPrev        =                   kMouseX

 gkWindow          cabbageGetValue     "Window"

 ; loop region graphic
 iBounds[]         cabbageGet          "beg", "bounds"
 kmin              =                   gkLoopStart < gkLoopEnd ? gkLoopStart : gkLoopEnd
 kmax              =                   gkLoopEnd > gkLoopStart ? gkLoopEnd : gkLoopStart
                   cabbageSet          changed:k(gkLoopStart,gkLoopEnd), "LoopRegion", "bounds", iBounds[0] + (iBounds[2] * kmin),   iBounds[1], (iBounds[2] * (kmax-kmin)),   iBounds[3]


 gkLoopLen         =                   gkLoopEnd - gkLoopStart ; loop length (0 to 1)
 gkPortamento      cabbageGetValue     "Portamento"

 gkMOUSE_DOWN_LEFT  cabbageGetValue     "MOUSE_DOWN_LEFT"
 gkMOUSE_DOWN_RIGHT cabbageGetValue     "MOUSE_DOWN_RIGHT" ; Read in mouse left click status

 ; set loop points (rsliders) from click and drag...
 if trigger:k(gkMOUSE_DOWN_LEFT,0.5,1)==1 then
  if changed:k(kbeg,klen)==1 then
                   cabbageSetValue     "LoopStart", kbeg/gkTabLen,k(1)
                   cabbageSetValue     "LoopEnd", (kbeg+klen)/gkTabLen,k(1)
  endif
 endif
  
 gkPlayStop        cabbageGetValue     "PlayStop"
 gktranspose       cabbageGetValue     "transpose"
 gkspeed           cabbageGetValue     "speed"
 gkPchBndRng       cabbageGetValue     "PchBnd"
 gklevel           cabbageGetValue     "level"
 gkmode            cabbageGetValue     "mode"
 
 ; load file from browse
 gSfilepath        cabbageGetValue     "filename"        ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then        ; call instrument to update waveform viewer  
                   event               "i",99,0,0
 endif

 ; load file from dropped file
 gSDropFile        cabbageGet          "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
                   event               "i",100,0,0         ; load dropped file
 endif
 
 ; start playback instrument
 ktrig             trigger             gkPlayStop,0.5,0  ; if play button changes to 'play', generate a trigger
                   schedkwhen          ktrig,0,0,2,0,-1                         ; start instr 2 playing a held note

 ; interchange 'transpose' and 'speed'
 ktrig1            changed             gktranspose       ; if 'transpose' button is changed generate a '1' trigger
 ktrig2            changed             gkspeed           ; if 'speed' button is changed generate a '1' trigger
 if ktrig1==1 then                                          ; if transpose control has been changed...
                   cabbageSetValue     "speed",semitone(gktranspose)                   ; set speed according to transpose value
 elseif ktrig2==1 then                                      ; if speed control has been changed...
                   cabbageSetValue     "transpose",log2(abs(gkspeed))*12      ; set transpose control according to speed value
 endif

 ; detect pitch
 kDetect           cabbageGetValue     "Detect"
 if trigger:k(kDetect,0.5,0)==1 then
                   event               "i", 200, 0, 30
 endif

endin

instr    99    ; load sound file
 gichans           filenchnls          gSfilepath                 ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL          ftgen               1,0,0,1,gSfilepath,0,0,1
 giFileSamps       =                   nsamp(gitableL)            ; derive the file duration in samples
 giFileLen         filelen             gSfilepath                 ; derive the file duration in seconds
 gkTabLen          init                ftlen(gitableL)            ; table length in sample frames
 if gichans==2 then
  gitableR         ftgen               2,0,0,1,gSfilepath,0,0,2
 endif
 giReady           =                   1                          ; if no string has yet been loaded giReady will be zero
                   cabbageSet          "beg","file",gSfilepath

 ; write file name to GUI
 SFileNoExtension   cabbageGetFileNoExtension gSfilepath
                    cabbageSet                "stringbox", "text", SFileNoExtension
endin

instr    100 ; LOAD DROPPED SOUND FILE
 gichans           filenchnls          gSDropFile                 ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL          ftgen               1,0,0,1,gSDropFile,0,0,1
 giFileSamps       =                   nsamp(gitableL)            ; derive the file duration in samples
 giFileLen         filelen             gSDropFile                 ; derive the file duration in seconds
 gkTabLen          init                ftlen(gitableL)            ; table length in sample frames
 if gichans==2 then
  gitableR         ftgen               2,0,0,1,gSDropFile,0,0,2
 endif
 giReady           =                   1                          ; if no string has yet been loaded giReady will be zero
                   cabbageSet          "beg","file",gSDropFile

 ; write file name to GUI
 SFileNoExtension  cabbageGetFileNoExtension gSDropFile
                   cabbageSet          "stringbox", "text", SFileNoExtension

endin



instr    2    ; Sample triggered by 'play/stop' button
 if gkPlayStop==0&&gkMOUSE_DOWN_RIGHT==0 then                    ; allow right-click to sustain playing even if PLAY button is not pressed
                   turnoff
 endif

 if giReady==1 then                                              ; i.e. if a file has been loaded

  iAttTim          cabbageGetValue     "AttTim"                  ; read in widgets
  iRelTim          cabbageGetValue     "RelTim"
  if iAttTim>0 then                                              ; is amplitude envelope attack time is greater than zero...
   kenv            linsegr             0,iAttTim,1,iRelTim,0     ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else
   kenv            linsegr             1,iRelTim,0               ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv             expcurve            kenv,8                         ; remap amplitude value with a more natural curve
  aenv             interp              kenv                           ; interpolate and create a-rate envelope
  kporttime        linseg              0,0.001,1                      ; portamento time function. (Rises quickly from zero to a held value.)
  kspeed           portk               gkspeed,kporttime*gkPortamento ; apply portamento smoothing to changes in speed
  klevel           portk               gklevel,kporttime*0.1          ; apply portamento smoothing to changes
  
  ; dials/click and drag
  kLoopStart       portk               gkLoopStart,kporttime*gkPortamento
  kLoopEnd         portk               gkLoopEnd,kporttime*gkPortamento
   
  kLoopLen         =                   abs(kLoopEnd-kLoopStart)
  kdir             =                   (kLoopEnd>kLoopStart?1:-1)
   
  krate            divz                kspeed, kLoopLen*giFileLen, 1
  arate            interp              krate
  if gkmode==1 then                             ; fwd
   aphasor        phasor               arate*kdir
  elseif gkmode==2 then                         ; bwd
    aphasor        phasor              -arate*kdir
  else                                          ; fwd-bwd
   aphasor         poscil              1,-arate*0.5*kdir,gitri
  endif

  ; loop window
  aWindow          tablei              aphasor, giTukey, 1, 0, 1
  
  kLoopStart       min                 kLoopStart,kLoopEnd
  aLoopStart       interp              kLoopStart
  aLoopLen         interp              kLoopLen
  aphasor          =                   (aphasor * aLoopLen) + aLoopStart
  

  ; stereo/mono selection
  if gichans==1 then                                              ; if mono...
   a1              table3              aphasor, gitableL, 1, 0, 1
   a2              =                   a1
  elseif gichans==2 then                                          ; otherwise, if stereo...
    a1             table3              aphasor, gitableL, 1, 0, 1 
    a2             table3              aphasor, gitableR, 1, 0, 1 
  endif
  
  ; conditionally apply loop window
  if gkWindow==1 then
   a1              *=                  aWindow
   a2              *=                  aWindow
  endif
                   outs                a1 * aenv * klevel, a2 *  aenv * klevel
   
 endif

endin




instr    3    ; sample triggered by midi note
 kporttime         linseg              0,0.001,0.05          ; portamento time function. (Rises quickly from zero to a held value.)
 icps              cpsmidi                                   ; read in midi note data as cycles per second
 iamp              ampmidi             1                     ; read in midi velocity (as a value within the range 0 - 1)
 iMidiRef          cabbageGetValue     "MidiRef"
 kPchBnd           pchbend             0, 1                  ; read in pitch bend
 kPchBnd           *=                  gkPchBndRng
 kPchBnd           portk               kPchBnd, kporttime

 if giReady = 1 then                                            ; i.e. if a file has been loaded
  iAttTim          cabbageGetValue     "AttTim"                 ; read in widgets
  iRelTim          cabbageGetValue     "RelTim"
  if iAttTim>0 then                                             ; is amplitude envelope attack time is greater than zero...
   kenv            linsegr             0,iAttTim,1,iRelTim,0    ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else
   kenv            linsegr             1,iRelTim,0              ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv             expcurve            kenv,8                   ; remap amplitude value with a more natural curve
  aenv             interp              kenv                     ; interpolate and create a-rate envelope
  ispeed           =                   icps/cpsmidinn(iMidiRef) ; derive playback speed from note played in relation to a reference note (MIDI note 60 / middle C)
  klevel           portk               gklevel,kporttime        ; apply portamento smoothing to changes in level
    

  kLoopStart       lineto              gkLoopStart,kporttime
  kLoopEnd         lineto              gkLoopEnd,kporttime

   kLoopEnd        =                   (kLoopEnd=kLoopStart?kLoopEnd+0.001:kLoopEnd)
   kLoopLen        =                   abs(kLoopEnd-kLoopStart)
   kdir            =                   (kLoopEnd>kLoopStart?1:-1)
   krate           divz                ispeed, kLoopLen*giFileLen, 1
   arate           interp              krate
   if gkmode==1    then                          ; fwd
    aphasor        phasor              arate*kdir
   elseif gkmode==2 then                         ; bwd
    aphasor        phasor              -arate*kdir
   else                                          ; fwd-bwd
    aphasor        poscil              1,-arate*0.5*kdir,gitri
   endif
   
   aWindow         tablei              aphasor, giTukey, 1, 0, 1
   
   kLoopStart      min                 kLoopStart,kLoopEnd
   aLoopStart      interp              kLoopStart
   aLoopLen        interp              kLoopLen
   aphasor         =                   (aphasor*aLoopLen)+aLoopStart
   
   if gichans==1 then                                                         ; if mono...
    a1             table3              aphasor, gitableL, 1, 0, 1
    a2             =                   a1
   elseif gichans==2 then                                                     ; otherwise, if stereo...
    a1             table3              aphasor, gitableL, 1, 0, 1
    a2             table3              aphasor, gitableR, 1, 0, 1
   endif               

  ; conditionally apply loop window
  if gkWindow==1 then
   a1              *=                  aWindow
   a2              *=                  aWindow
  endif
                   outs                a1 * aenv * klevel, a2 *  aenv * klevel
   
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