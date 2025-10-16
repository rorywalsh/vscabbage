
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; TabRecPlay.csd
; Written by Iain McCurdy, 2012, 2023

; Records live audio input to a function table buffer (either mono or stereo) then allows playback through various means and with various modifications

; Audio can also be loaded into the buffer by dragging and dropping a sound file onto the GUI

; Record    - record audio into the buffer. This needs to be done first. Press again to stop recording.
; Pause     - pause recording or playback
; Play Loop - play back in a loop according to start and end loop points and speed/pitch setting
; Play Once - play the buffer fragment bounded by the loop start and end points once then stop

; Mono/Stereo (toggle switch) - in mono mode the left channel input is written to both channels of the buffer
;                               stereo mode is simple true stereo with two parallel buffers

; (dials)
; In Gain    - gain control on the input signal going into the buffers
; Out Gain   - gain control on the signal coming out of the buffers
; Smoothing  - legato smoothing applied to changed that are made to 'Loop Begin' and 'Loop End'
; Dry Out    - level of dry signal in the output
; Speed      - playback speed ratio (controlling both speed and pitch) 
; Loop Begin - loop beginning point (this is reflected in the overlap on the waveform viewer)
; Loop End   - loop end point (this is reflected in the overlap on the waveform viewer)

; Window On/Off - activates an amplitude window that can soften glitches at the start and end of loops
; Window Shape  - amount of attack/decay on the Tukey amplitude window 

; Looped playback can also be triggered by playing note on the keyboard (widget or external MIDI keyboard)
; ATT        - amplitude attack time for notes triggered by the keyboard 
; REL        - amplitude release time for notes triggered by the keyboard 
; STRETCH    - intervallic warping of notes played on the keyboard.
;              the unison point is C3 on the Cabbage keyboard (C4 on most other keyboards)
;              unison point speed ratios will be inaffected by Stretch 
;              but as stretch is increased beyond zero notes above and below it will be stretched further away
;              As stretch is reduced below zero, notes above and below it will be pulled closer to unison speed ratio
;              All speed ratios are also shifted by the Speed slider. 
               
<Cabbage>
form caption("Tab.Rec/Play") size(520,530), pluginId("tbrp"), colour(20,20,20), guiMode("queue")

#define DIAL_STYLE       markerStart(0), markerEnd(1.05), markerThickness(0.8), trackerInsideRadius(0.8), trackerColour(0,0,0,0), valueTextBox(1)
#define DIAL_STYLE_SMALL markerStart(0), markerEnd(1.05), markerThickness(0.8), trackerInsideRadius(0.7), trackerColour(0,0,0,0)

groupbox bounds(  5,  5,300,100), text("Transport")

label    bounds( 15, 82, 70, 14), text("Record") 
label    bounds( 85, 82, 70, 14), text("Pause") 
label    bounds(155, 82, 70, 14), text("Play Loop") 
label    bounds(225, 82, 70, 14), text("Play Once") 
checkbox bounds( 20, 30, 60, 50), channel("Record"), value(0), shape("square"), colour:1("red"), colour:0(40,0,0)
checkbox bounds( 90, 30, 60, 50), channel("Pause"), value(0), shape("square"), colour:1(100,100,255), colour:0(0,0,40)
checkbox bounds(160, 30, 60, 50), channel("PlayLoop"), value(0), shape("square"), colour:1("Lime"), colour:0(0,40,0)
checkbox bounds(230, 30, 60, 50), channel("PlayOnce"), value(0), shape("square"), colour:1("yellow"), colour:0(40,40,0)

; mono/stereo toggle
groupbox bounds(310,  5,100,100), text("Mono/Stereo")
{
image    bounds( 10, 30, 30, 50), corners(15), colour(90,90,90), outlineThickness(1), outlineColour("Black") ; frame
image    bounds( 11, 31, 28, 28), channel("toggle"), corners(14), colour(250,250,250), outlineThickness(1), outlineColour("Grey") ; toggle
label    bounds( 45, 37, 50, 11), text("• MONO"), align("left")
label    bounds( 45, 60, 50, 11), text("• STEREO"), align("left")
}

label    bounds(425, 25, 80, 13), text("Loop Shape")
combobox bounds(425, 40, 80, 25), channel("LoopShape"), items("Ramp","Tri") value(1)

rslider  bounds( 10, 120, 70, 80), channel("InGain"), range(0, 1, 1, 0.5), text("In Gain"), $DIAL_STYLE
rslider  bounds( 80, 120, 70, 80), channel("OutGain"), range(0, 1, 1, 0.5), text("Out Gain"), $DIAL_STYLE
rslider  bounds(150, 120, 70, 80), channel("Smoothing"), range(0, 1, 0.3, 0.5), text("Smoothing"), $DIAL_STYLE
rslider  bounds(220, 120, 70, 80), channel("DryOut"), range(0, 1, 0, 0.5), text("Dry Out"), $DIAL_STYLE
checkbox bounds(300, 125, 95, 15), channel("Window"), text("Window"), colour("yellow"), fontColour:0("white"), fontColour:1("white")
label    bounds(300, 145, 95, 13), text("Window Shape"), align("centre")
hslider  bounds(300, 165, 95, 15), channel("WindShape"), range(0.001, 0.5, 0.01, 0.5)


hslider bounds( 10, 210, 500, 20), channel("Speed"), text("Speed") range(0, 8, 1, 0.333, 0.00001), valueTextBox(1)

; display
hslider    bounds(  5,240,510, 20), channel("LoopBeg"), range(0, 1, 0), popupText(0)
soundfiler bounds( 10,260,500, 80), channel("DispTable"), tableNumber(4), alpha(0.85)
image      bounds( 10,260,500, 80), channel("LoopDisplay"), alpha(0.2)
image      bounds( 10,260,  1, 80), channel("Wiper")
hslider    bounds(  5,340,510, 20), channel("LoopEnd"), range(0, 1, 1), popupText(0)

; keyboard
rslider    bounds( 10, 358, 50, 65), channel("Att"), range(0.01,25, 0.01, 0.5), text("ATT"), $DIAL_STYLE_SMALL
rslider    bounds( 70, 358, 50, 65), channel("Rel"), range(0.01,25, 0.01, 0.5), text("REL"), $DIAL_STYLE_SMALL
rslider    bounds(130, 358, 50, 65), channel("Stretch"), range(-5,5,0), text("STRETCH"), $DIAL_STYLE_SMALL

keyboard   bounds(  5, 430,510, 85)

label bounds( 5,516,110, 12), text("Iain McCurdy |2012|"), align("left"), fontColour("Grey")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps     =     32
nchnls    =     2
0dbfs     =     1

massign 0,5

;Author: Iain McCurdy (2012)

gistorageL    ftgen    1,0,1048576,-7,0    ; AUDIO DATA STORAGE SPACE (ABOUT 23 SECONDS)
gistorageR    ftgen    2,0,1048576,-7,0    ; AUDIO DATA STORAGE SPACE (ABOUT 23 SECONDS)
giDispTab     ftgen    4,0,4096,7,0        ; DISPLAY TABLE

gkRecDur      init     0


opcode CreateDisplayTable,0,iii
iDstFn,iSrcFn,iRecDur   xin
iCount          =               0
iMax            =               0
iLen            =               ftlen(iDstFn)
; create table (un-normalised)
while           iCount<iRecDur  do
iVal            tablei          iCount, iSrcFn                       ; read value (interpolated) from source function table
iMax            =               abs(iVal) > iMax ? abs(iVal) : iMax  ; scan for absolute maximum value (for normalisation of display table)
                tablew          iVal,iCount/iRecDur, iDstFn, 1       ; write value into display table
iCount          +=              1
od
; create normalised table
iCount  = 0
while   iCount<iLen do
iVal            table           iCount,iDstFn
                tablew          iVal*(1/iMax),iCount,iDstFn
iCount          +=              1
od
endop




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
 ifn,isize,iratio	xin
 iratio		limit	iratio,2/isize,0.5
 i1	ftgen	0,0,isize,19, 0.5,0.5,270, 0.5
 i2	ftgen	0,0,isize,7, 1,isize,1
 i3	ftgen	0,0,isize,19, 0.5,0.5,90, 0.5
 i_	ftgen	ifn, 0, isize, -18, i1, 1, 0, (isize*iratio), i2, 1, (isize*iratio)+1, (isize-1-(isize*iratio)), i3, 1, (isize-(isize*iratio)), isize-1
 ftfree i1, 0
 ftfree i2, 0
 ftfree i3, 0
endop

giTukey  ftgen        0, 0, 131072, 10, 0
         TukeyWindow  giTukey, ftlen(giTukey), 0.01


; Loop Shapes
iFTLen             =                   2^8
giRamp             ftgen               0, 0, iFTLen, 7, 0, iFTLen, 1 
giTri              ftgen               0, 0, iFTLen, 7, 0, iFTLen/2, 1, iFTLen/2, 0


instr    1 ; always on
         
 ; mono/stereo toggle
 kMOUSE_DOWN_LEFT cabbageGetValue  "MOUSE_DOWN_LEFT" ; read in mouse left click
 kMOUSE_X         cabbageGetValue  "MOUSE_X"         ; read in mouse X position
 kMOUSE_Y         cabbageGetValue  "MOUSE_Y"         ; read in mouse Y position
 gkMonoStereo     init             0                 ; mono/stereo toggle variable (0=mono, 1=stereo)
 ; trigger toggle if left click is pressed within area of switch
 if trigger:k(kMOUSE_DOWN_LEFT,0.5,0)==1 && kMOUSE_X>310 && kMOUSE_X<340 && kMOUSE_Y>30 && kMOUSE_Y<80 then
  gkMonoStereo = abs(gkMonoStereo-1) ; variable toggling mechanism
 endif
 kTogPos         lineto            gkMonoStereo*20, 0.05                                       ; glide movement
                 cabbageSet        changed:k(kTogPos), "toggle", "bounds", 11,31+kTogPos,28,28 ; update toggle switch position

 ; dry out
 kDryOut cabbageGetValue "DryOut"
 aL      inch     1
 if gkMonoStereo==0 then
  aR     =        aL
 else
  aR     inch     2
 endif
         outs     aL*kDryOut, aR*kDryOut 

 gSfile cabbageGet "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSfile) == 1) then
        event "i",100,0,0 ; load dropped file
 endif
gitablelen    =                   ftlen(gistorageL)   ; DERIVE TABLE LENGTH

gkRecord       cabbageGetValue    "Record"            ; READ IN CABBAGE WIDGET CHANNELS
gkPause        cabbageGetValue    "Pause"
gkPlayLoop     cabbageGetValue    "PlayLoop"
gkPlayOnce     cabbageGetValue    "PlayOnce"
gkPlayOnceTrig changed            gkPlayOnce
gkSpeed        cabbageGetValue    "Speed"
gkLoopBeg      cabbageGetValue    "LoopBeg"
gkLoopEnd      cabbageGetValue    "LoopEnd"
gkSmoothing    cabbageGetValue    "Smoothing"
kStretch       cabbageGetValue    "Stretch"    ; intervallic stretch on MIDI instrument
gkStretch      =                  2 ^ kStretch ; create exponentially scaled ratio
gkWindow       cabbageGetValue    "Window"
kWindShape     cabbageGetValue    "WindShape"
gkLoopShape    cabbageGetValue    "LoopShape"

if changed:k(kWindShape)==1 then
 reinit REBUILD_TUKEY
endif
REBUILD_TUKEY:
         TukeyWindow  giTukey, ftlen(giTukey), i(kWindShape)
rireturn

; read soundfiler bounds
iBounds[]          cabbageGet          "DispTable", "bounds"
iOLX               =                   iBounds[0]
iOLY               =                   iBounds[1]
iOLWidth           =                   iBounds[2]
iOLHeight          =                   iBounds[3]

; Adjust graphical loop overlay
if gkLoopEnd>gkLoopBeg then
 kOLX              limit               iOLX + (gkLoopBeg * iOLWidth), iOLX, iOLX + iOLWidth 
 kOLWid            limit               iOLWidth-(gkLoopBeg*iOLWidth)-((1-gkLoopEnd)*iOLWidth), 0, iOLX + iOLWidth - kOLX 
                   cabbageSet          changed:k(gkLoopBeg,gkLoopEnd), "LoopDisplay", "bounds", kOLX, iOLY, kOLWid, iOLHeight
else
 kOLX              limit               iOLX + (gkLoopEnd * iOLWidth), iOLX, iOLX + iOLWidth 
 kOLWid            limit               iOLWidth-(gkLoopEnd*iOLWidth)-((1-gkLoopBeg)*iOLWidth), 0, iOLX + iOLWidth - kOLX 
                   cabbageSet          changed:k(gkLoopBeg,gkLoopEnd), "LoopDisplay", "bounds", kOLX, iOLY, kOLWid, iOLHeight
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
                   cabbageSetValue     "LoopBeg", limit:k(gkLoopBeg + (kMouseX-kMouseXPrev)/iOLWidth, 0, 1)
                   cabbageSetValue     "LoopEnd", limit:k(gkLoopEnd + (kMouseX-kMouseXPrev)/iOLWidth, 0, 1)
endif
kMouseXPrev    =               kMouseX



gkInGain       cabbageGetValue    "InGain"
gkOutGain      cabbageGetValue    "OutGain"

#define    TURN_ON_OFF(NAME)
#
i$NAME         nstrnum            "$NAME"
kOnTrig$NAME   trigger            gk$NAME,0.5,0
kOffTrig$NAME  trigger            gk$NAME,0.5,1
if kOnTrig$NAME==1 then                             ; IF BUTTON IS TURNED ON...
               event              "i",i$NAME,0,3600
elseif kOffTrig$NAME==1 then                        ; IF BUTTON IS TURNED ON...
               turnoff2           i$NAME, 0, 0
endif
#
$TURN_ON_OFF(Record)
$TURN_ON_OFF(PlayOnce)
$TURN_ON_OFF(PlayLoop)

; call instr 99 to set up display table
               schedkwhen         trigger:k(gkRecord,0.5,1),0,0,99,0,0,gkRecDur
    
endin



instr 99 ; create display table
iRecDur  =  p4 ; duration of recording in sample frames
      CreateDisplayTable  giDispTab, gistorageL, iRecDur 
               cabbageSet "DispTable", "tableNumber", giDispTab
endin



instr 100 ; load dropped files
 i_ ftgen 1,0,0,1,gSfile,0,0,1
 i_ ftgen 2,0,0,1,gSfile,0,0,1
 iRecDur  = ftlen(1)
      CreateDisplayTable  giDispTab, gistorageL, iRecDur 
               cabbageSet "DispTable", "tableNumber", giDispTab
 gkRecDur init ftlen(1)
endin

instr Record
if gkPause==1 goto SKIP_RECORD                 ; IF PAUSE BUTTON IS ACTIVATED TEMPORARILY SKIP RECORDING PROCESS
if i(gkMonoStereo)==1 then
 ainL,ainR      ins
else
 ainL           inch      1
 ainR           =         ainL
endif
aEnv           linsegr    0,0.01,1,0.01,0      ; anti-click
ainL           *=         aEnv
ainR           *=         aEnv
aRecNdx        line       0,gitablelen/sr,1    ; CREATE A POINTER FOR WRITING TO TABLE - FREQUENCY OF POINTER IS DEPENDENT UPON TABLE LENGTH AND SAMPLE RATE
aRecNdx        =          aRecNdx*gitablelen   ; RESCALE POINTER ACCORDING TO LENGTH OF FUNCTION TABLE 
gkRecDur       downsamp   aRecNdx                            ; CREATE A K-RATE GLOBAL VARIABLE THAT WILL BE USED BY THE 'PLAYBACK' INSTRUMENT TO DETERMINE THE LENGTH OF RECORDED DATA            
               tablew     ainL*gkInGain, aRecNdx, gistorageL ; WRITE AUDIO TO AUDIO STORAGE TABLE
               tablew     ainR*gkInGain, aRecNdx, gistorageR ; WRITE AUDIO TO AUDIO STORAGE TABLE
if gkRecDur>=gitablelen then                                 ; IF MAXIMUM RECORD TIME IS REACHED...
kRecord        =          0
endif                        ;END OF CONDITIONAL BRANCH
SKIP_RECORD:
endin



instr    PlayLoop
if gkPlayLoop==0 then
               turnoff
endif
if gkPause==1 goto SKIP_PLAY_LOOP                          ; IF PAUSE BUTTON IS ACTIVATED SKIP ALL RECORDING AND PLAYBACK...

kporttime      linseg     0,0.001,1                        ; PORTAMENTO TIME RAMPS UP RAPIDLY TO A HELD VALUE
kLoopBeg       portk      gkLoopBeg, kporttime*gkSmoothing ; APPLY PORTAMENTO SMOOTHING TO CHANGES OF LOOP BEGIN SLIDER
kLoopEnd       portk      gkLoopEnd, kporttime*gkSmoothing ; APPLY PORTAMENTO SMOOTHING TO CHANGES OF LOOP END SLIDER
kLoopBeg       =          kLoopBeg * gkRecDur              ; RESCALE gkLoopBeg (RANGE 0-1) TO BE WITHIN THE RANGE 0-FILE_LENGTH. NEW OUTPUT VARIABLE kLoopBeg.
kLoopEnd       =          kLoopEnd * gkRecDur              ; RESCALE gkLoopEnd (RANGE 0-1) TO BE WITHIN THE RANGE 0-FILE_LENGTH. NEW OUTPUT VARIABLE kLoopEnd.
kLoopLen       =          kLoopEnd - kLoopBeg              ; DERIVE LOOP LENGTH FROM LOOP START AND END POINTS
kPlayPhasFrq   divz       gkSpeed,  (kLoopLen/sr), 0.00001 ; SAFELY DIVIDE, PROVIDING ALTERNATIVE VALUE INCASE DENOMINATOR IS ZERO 
aPhasor        phasor     kPlayPhasFrq * (gkLoopShape == 1 ? 1 : 0.5)
;aPlayNdx       oscilikt   1, kPlayPhasFrq * (gkLoopShape == 1 ? 1 : 0.5), gkLoopShape + giRamp - 1
aPhasor        tableikt   aPhasor, gkLoopShape + giRamp - 1, 1
  ; loop window
aWindow        tablei     aPhasor, giTukey, 1, 0, 1
kLoopBeg       =          (kLoopBeg < kLoopEnd ? kLoopBeg : kLoopEnd) ; CHECK IF LOOP-BEGINNING AND LOOP-END SLIDERS HAVE BEEN REVERSED
aLoopLen       interp     abs(kLoopLen)
aLoopBeg       interp     kLoopBeg
aPlayNdx       =          (aPhasor*aLoopLen) + aLoopBeg   ; RESCALE INDEX POINTER ACCORDING TO LOOP LENGTH AND LOOP BEGINING
aL             tablei     aPlayNdx,    gistorageL          ; READ AUDIO FROM AUDIO STORAGE FUNCTION TABLE
aR             tablei     aPlayNdx,    gistorageR          ; READ AUDIO FROM AUDIO STORAGE FUNCTION TABLE


; move wiper
iDTBounds[]    cabbageGet "DispTable", "bounds"
iDTX           =          iDTBounds[0]
iDTY           =          iDTBounds[1]
iDTWid         =          iDTBounds[2]
iDTHei         =          iDTBounds[3]
kPhasor        =          gkLoopEnd > gkLoopBeg ? k(aPhasor) : (1 - k(aPhasor))
kPtr           =          kPhasor * (gkLoopEnd - gkLoopBeg) + gkLoopBeg
               cabbageSet metro:k(16), "Wiper", "bounds", iDTX + iDTWid * kPtr, iDTY, 1, iDTHei

; conditionally apply loop window
if gkWindow==1 then
 aL            *=                 aWindow
 aR            *=                 aWindow
endif


               outs       aL*gkOutGain,aR*gkOutGain        ; SEND AUDIO TO OUTPUTS

SKIP_PLAY_LOOP:
endin





instr    PlayOnce
koff           =          0

if gkPause==1 goto SKIP_PLAY_ONCE               ; IF PAUSE BUTTON IS ACTIVATED SKIP ALL RECORDING AND PLAYBACK...

kPlayOnceNdx   init       0
if kPlayOnceNdx<=(gkRecDur/sr) then            ; IF PLAYBACK IS NOT YET COMPLETED THEN...
 kLoopBeg      =          gkLoopBeg * gkRecDur ; RESCALE gkLoopBeg (RANGE 0-1) TO BE WITHIN THE RANGE 0-FILE_LENGTH. NEW OUTPUT VARIABLE kLoopBeg.
 kLoopEnd      =          gkLoopEnd * gkRecDur ; RESCALE gkLoopEnd (RANGE 0-1) TO BE WITHIN THE RANGE 0-FILE_LENGTH. NEW OUTPUT VARIABLE kLoopEnd.
 if kLoopEnd>kLoopBeg then                     ; IF LOOP END SLIDER IS AT A LATER POSITION TO LOOP BEGIN SLIDER...
  aPlayOnceNdx line       0,1,1                ; CREATE A MOVING POINTER
  aPlayOnceNdx =          (aPlayOnceNdx*gkSpeed)+kLoopBeg;RESCALE MOVING POINTER VALUE ACCORDING TO LOOP BEGIN POSITION AND SPEED SLIDER SETTING
  kPlayOnceNdx downsamp   aPlayOnceNdx         ; CREATE kndx, A K-RATE VERSION OF andx. THIS WILL BE USED TO CHECK IF PLAYBACK OF THE DESIRED CHUNK OF AUDIO HAS COMPLETED.
  if kPlayOnceNdx>=kLoopEnd then       
   turnoff
  endif
 else                                          ; OTHERWISE (I.E. LOOP BEGIN SLIDER IS AT A LATER POSITION THAT LOOP END)
  aPlayOnceNdx line       0,1,-1               ; CREATE A NEGATIVE MOVING POINTER
  aPlayOnceNdx =          kLoopBeg-(aPlayOnceNdx*gkSpeed);RESCALE MOVING POINTER VALUE ACCORDING TO LOOP BEGIN POSITION AND SPEED SLIDER SETTING
  kPlayOnceNdx downsamp   aPlayOnceNdx         ; CREATE kndx, A K-RATE VERSION OF andx
  if kPlayOnceNdx<=kLoopEnd then
   turnoff
  endif
 endif
 aPlayOnceNdx line 0,1,1
 aL            tablei     aPlayOnceNdx*sr,  gistorageL    ; READ AUDIO FROM AUDIO STORAGE FUNCTION TABLE
 aR            tablei     aPlayOnceNdx*sr,  gistorageR    ; READ AUDIO FROM AUDIO STORAGE FUNCTION TABLE
               outs       aL*gkOutGain,aR*gkOutGain       ; SEND AUDIO TO OUTPUT
else
 cabbageSetValue "PlayOnce", k(0), k(1)                   ; deactivate switch
 turnoff
endif
SKIP_PLAY_ONCE:
endin



instr 5 ; MIDI-triggered instrument
iCPS           cpsmidi
kSpeed         =          (iCPS*gkSpeed)/cpsmidinn(60)
kSpeed         pow        kSpeed, gkStretch
kporttime      linseg     0,0.001,1                        ; PORTAMENTO TIME RAMPS UP RAPIDLY TO A HELD VALUE
kLoopBeg       portk      gkLoopBeg, kporttime*gkSmoothing ; APPLY PORTAMENTO SMOOTHING TO CHANGES OF LOOP BEGIN SLIDER
kLoopEnd       portk      gkLoopEnd, kporttime*gkSmoothing ; APPLY PORTAMENTO SMOOTHING TO CHANGES OF LOOP END SLIDER
kLoopBeg       =          kLoopBeg * gkRecDur              ; RESCALE gkLoopBeg (RANGE 0-1) TO BE WITHIN THE RANGE 0-FILE_LENGTH. NEW OUTPUT VARIABLE kLoopBeg.
kLoopEnd       =          kLoopEnd * gkRecDur              ; RESCALE gkLoopEnd (RANGE 0-1) TO BE WITHIN THE RANGE 0-FILE_LENGTH. NEW OUTPUT VARIABLE kLoopEnd.
kLoopLen       =          kLoopEnd - kLoopBeg              ; DERIVE LOOP LENGTH FROM LOOP START AND END POINTS
kPlayPhasFrq   divz       kSpeed,  (kLoopLen/sr), 0.00001  ; SAFELY DIVIDE, PROVIDING ALTERNATIVE VALUE INCASE DENOMINATOR IS ZERO 
aPlayNdx       phasor     kPlayPhasFrq                     ; DEFINE PHASOR POINTER FOR TABLE INDEX
kLoopBeg       =          (kLoopBeg < kLoopEnd ? kLoopBeg : kLoopEnd) ; CHECK IF LOOP-BEGINNING AND LOOP-END SLIDERS HAVE BEEN REVERSED
aLoopLen       interp     abs(kLoopLen)
aLoopBeg       interp     kLoopBeg
aPlayNdx       =          (aPlayNdx*aLoopLen) + aLoopBeg   ; RESCALE INDEX POINTER ACCORDING TO LOOP LENGTH AND LOOP BEGINING
aL             tablei     aPlayNdx,    gistorageL          ; READ AUDIO FROM AUDIO STORAGE FUNCTION TABLE
aR             tablei     aPlayNdx,    gistorageR          ; READ AUDIO FROM AUDIO STORAGE FUNCTION TABLE
iAtt           cabbageGetValue "Att"
iRel           cabbageGetValue "Rel"
aAtt           cosseg     0,iAtt,1
aRel           expsegr    1,iRel,0.001
aEnv           =          aAtt * aRel
aL             *=         aEnv
aR             *=         aEnv
               outs       aL*gkOutGain,aR*gkOutGain        ; SEND AUDIO TO OUTPUTS

SKIP_PLAY_LOOP:

endin

</CsInstruments>

<CsScore>
i 1 0 [3600*24*365]
</CsScore>

</CsoundSynthesizer>