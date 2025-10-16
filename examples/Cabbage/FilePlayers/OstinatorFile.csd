
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Ostinator
; Written by Iain McCurdy, 2012, 2025

; The Ostinator uses streaming phase vocoding to capture a buffer of audio and play back selected fragments - ostinati - in various ways.

; Buttons
; Play   -   play buffered audio in a loop


; Mono/Stereo -   selects whether a mono or stereo buffer will be recorded

; FFT Size    -   FFT size used by phase vocoding analysis and replay.
;                 Use larger sizes for better frequency resolution, use smaller sizes for better time resolution.

; In Gain     -   Gain control applied to audio entering the Ostinator
; Out Gain    -   Gain control applied all audio exiting the Ostinator
; Dry Out     -   Amount of dry signal sent to the output

; Loop Shape  -   shape of the pointer used in looping.
;                 shape chosen is revealed in the graph to the right
; Phase Lock  -   lock phases in phase vocoded output

; Speed       -   speed of playback as a ratio of normal playback speed
; Pitch       -   pitch as a ratio of original pitch

; Buffer (in the silver box)
; Above and below the buffer audio waveform display are sliders which will control the loop start and end points.
;  Start and end loop points can be inverted to reverse playback speed.
; The section of the audio buffer that will be looped is shown by a box overlaid on the waveform. 
; This section can be shifted across the waveform by clicking and dragging on it.

; MIDI TO PITCH - MIDI notes played will be mapped to playback pitch about UNISON PITCH
; MIDI TO SPEED - MIDI notes played will be mapped to playback speed as a ratio to original speed with UNISON PITCH defining normal playback speed 

; STRETCH - intervallic stretch for MIDI-activated notes
; ATT     - amplitude attack time for MIDI-activated notes
; REL     - amplitude release time for MIDI-activated notes
; TUNING  - tuning system used for MIDI-activated notes

<Cabbage>
form caption("Ostinator") size(870,660), pluginId("Osti") colour(30,30,30), guiMode("queue")

#define DIAL_STYLE       markerStart(0), markerEnd(1.05), markerThickness(0.8), trackerInsideRadius(0.8), trackerColour(0,0,0,0), valueTextBox(1)
#define DIAL_STYLE_SMALL markerStart(0), markerEnd(1.05), markerThickness(0.8), trackerInsideRadius(0.7), trackerColour(0,0,0,0)
#define SLIDER_STYLE     trackerColour("Silver"), valueTextBox(1)
#define SLIDER_STYLE2    trackerColour("Silver"), valueTextBox(0)


image      bounds(  5,  5,140,100), colour(0,0,0,0), outlineThickness(1), corners(7), outlineColour("silver")
{
filebutton bounds( 10, 10,120, 35), text("OPEN FILE","OPEN FILE"), fontColour("white"), channel("filename"), shape("ellipse"), corners(5)
button     bounds( 10, 55,120, 35), text("PLAY","PLAY"), channel("Play"), fontColour:0("white"), fontColour:1("white"), colour:0(20,55,20), colour:1(100,255,100), latched(1), corners(5)
}

groupbox bounds(150,  5,310,100), text("FFT Attributes")
{
label    bounds(  5, 35, 90, 14), text("FFT Size"), fontColour("white")
combobox bounds(  5, 50, 90, 25), channel("FFTsize"), items("128","256","512","1024","2048","4096") value(4)
label    bounds(105, 35, 90, 14), text("Decimation"), fontColour("white")
combobox bounds(105, 50, 90, 25), channel("decim"), text("1", "2", "4", "8", "16"), value(3), fontColour("white")
checkbox bounds(205, 52, 90, 18), channel("PhaseLock"), text("Phase Lock"), value(0), fontColour:0("white"), fontColour:1("white")
}

groupbox bounds(465,  5,100,100), text("Loop")
{
label    bounds( 10, 25, 80, 13), text("Loop Shape")
combobox bounds( 10, 40, 80, 25), channel("LoopShape"), items("Ramp","Tri","Half Sine","Gauss","Pinch") value(1)
gentable bounds( 10, 70, 80, 20), channel("LoopShapeTab"), tableNumber(99), ampRange(0,1,-1), fill(0)
}

groupbox bounds(570,  5,200,100), text("")
{
rslider  bounds( 10, 25, 70, 70), channel("PortTime"), range(0, 0.3, 0.01), text("Port"), $DIAL_STYLE
rslider  bounds(110, 25, 70, 70), channel("OutGain"), range(0, 1, 1, 0.5), text("Out Gain"), $DIAL_STYLE
}

hslider bounds( 10,130,680,20), channel("Speed"), text("Speed"), range(-8.00, 8.00, 1), popupText(0), $SLIDER_STYLE
hslider bounds( 10,170,680,20), channel("Pitch"), text("Pitch"), range(0.125, 8.00, 1, 0.33,0.00001), $SLIDER_STYLE
button  bounds(700,135,150,50), channel("Freeze"), text("FREEZE"), corners(5), colour:0(20,20, 30), colour:1(100,100,250), latched(1), fontColour:0(50,50,100), fontColour:1(225,225,255)

; overlay
image      bounds(  0,210,870,225), colour(0,0,0,0), outlineColour("silver"), outlineThickness(4), corners(5)
hslider    bounds( 10,215,850, 20), channel("LoopBeg"), range(0, 1, 0), popupText(0), $SLIDER_STYLE2
soundfiler bounds( 14,235,842,178), channel("Display"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label      bounds( 16,237,842, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")

image      bounds( 14,235,842,178), channel("LoopDisplay"), alpha(0.2) ; overlay , colour(255,255,255,50);
image      bounds( 14,235,  1,178), channel("Wiper")
hslider    bounds( 10,410,850, 20), channel("LoopEnd"), range(0, 1, 1), popupText(0), $SLIDER_STYLE2

; keyboard control
image bounds(0,450,870,500), colour(0,0,0,0)
{
checkbox bounds( 10, 10,120, 12), channel("MIDI2Pitch"), text("MIDI TO PITCH"), colour:0(0,50,0), value(1)
checkbox bounds( 10, 30,120, 12), channel("MIDI2Speed"), text("MIDI TO SPEED"), colour:0(0,50,0)
nslider  bounds(130,  7, 80, 35), channel("Unison"), text("UNISON NOTE"), range(0,127,60,1,1)
;checkbox bounds(250,450,120, 12), channel("monolegato"), text("MONO-LEGATO"), colour:0(0,50,0), value(0)

rslider  bounds(210,  0, 90, 90), channel("Stretch"), range(-5,5,0), text("STRETCH"), $DIAL_STYLE
rslider  bounds(290,  0, 90, 90), channel("Att"), range(0.01,25, 0.01, 0.5), text("ATTACK"), $DIAL_STYLE
rslider  bounds(370,  0, 90, 90), channel("Rel"), range(0.01,25, 0.01, 0.5), text("RELEASE"), $DIAL_STYLE
label    bounds(485,  3,100, 13), text("TUNING")
combobox bounds(485, 17,100, 22), channel("Tuning"), text("Equal","Just","Pythagorean","Quarter Tones"), value(1)

keyboard bounds( 10,105,850, 85)
}

label    bounds( 10,643,110, 12), text("Iain McCurdy |2025|"), align("left"), fontColour("LightGrey")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32
nchnls             =                   2
0dbfs              =                   1

                   massign             0, 500

gichans         init    0        ; 
giReady         init    0        ; flag to indicate function table readiness

; Loop Shapes
iFTLen             =                   2^8
giRamp             ftgen               3, 0, iFTLen, 7, 0, iFTLen, 1 
giTri              ftgen               4, 0, iFTLen, 7, 0, iFTLen/2, 1, iFTLen/2, 0
giHalfSine         ftgen               5, 0, iFTLen, 9, 0.5, 1, 0
giGauss            ftgen               6, 0, iFTLen, 19, 1, 0.5, 270, 0.5
giPinch            ftgen               7, 0, iFTLen, 16, 0, iFTLen/2, 4, 1, iFTLen/2, -4, 0

giLoopShapeTab     ftgen               99, 0, 2^8, 10, 1

giequal            ftgen               201,           0,        64,        -2,          12,         2,     cpsmidinn(60),        60,                       1, 1.059463,1.1224619,1.1892069,1.2599207,1.33483924,1.414213,1.4983063,1.5874001,1.6817917,1.7817962, 1.8877471,     2    ;STANDARD
gijust             ftgen               202,           0,        64,        -2,          12,         2,     cpsmidinn(60),        60,                       1,   16/15,    9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,       9/5,     15/8,     2        ;RATIOS FOR JUST INTONATION
gipyth             ftgen               203,           0,        64,        -2,          12,         2,     cpsmidinn(60),        60,                       1,  256/243,   9/8,    32/27,    81/64,      4/3,    729/512,    3/2,    128/81,   27/16,     16/9,     243/128,  2        ;RATIOS FOR PYTHAGOREAN TUNING
giquat             ftgen               204,           0,        64,        -2,          24,         2,     cpsmidinn(60),        60,                       1, 1.0293022,1.059463,1.0905076,1.1224619,1.1553525,1.1892069,1.2240532,1.2599207,1.2968391,1.33483924,1.3739531,1.414213,1.4556525,1.4983063, 1.54221, 1.5874001, 1.6339145,1.6817917,1.73107,  1.7817962,1.8340067,1.8877471,1.9430623,    2    ;QUARTER TONES

; Author: Iain McCurdy (2012)



gkReady         init    0        ; flag to indicate function table readiness


instr    1 ; READ IN WIDGETS AND START AND STOP THE VARIOUS RECORDING AND PLAYBACK INSTRUMENTS
 ; open file
 gSfilepath       cabbageGetValue    "filename"
 kNewFileTrg      changed            gSfilepath    ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                            ; if a new file has been loaded...
                  event              "i",99,0,0    ; call instrument to update sample storage function table 
 endif  

 ; trigger play loop instrument 
 gkPlay            cabbageGetValue     "Play"
 if trigger:k(gkPlay,0.5,0)==1 && gkReady==1 then
                  event              "i", 2, 0, -1
 endif

 ; FFT Attributes             
 kFFTndx           cabbageGetValue     "FFTsize"             
 gkFFTsize         =                   2 ^ (kFFTndx + 6)

 gkdecimArr[]     fillarray          1, 2, 4, 8, 16
 gkdecim          =                  gkdecimArr[cabbageGetValue:k("decim") - 1]
 gkdecim          init               4
 
 gkRecord          cabbageGetValue     "Record"      ; READ IN CABBAGE WIDGET CHANNELS
 gkPause           cabbageGetValue     "Pause"
 gkPlayLoop        cabbageGetValue     "PlayLoop"
 gkPlayOnce        cabbageGetValue     "PlayOnce"
 gkPlayOnceTrig    changed             gkPlayOnce
 gkSpeed           cabbageGetValue     "Speed"
 gkSpeed           pow                 gkSpeed, 2
 gkPitch           cabbageGetValue     "Pitch"
 gkLoopBeg         cabbageGetValue     "LoopBeg"
 gkLoopEnd         cabbageGetValue     "LoopEnd"
 gkInGain          cabbageGetValue     "InGain"
 gkOutGain         cabbageGetValue     "OutGain"
 kStretch          cabbageGetValue     "Stretch"          ; intervallic stretch on MIDI instrument
 gkStretch         =                   2 ^ kStretch       ;, 0.05 ; create exponentially scaled ratio
 gkLoopShape       cabbageGetValue     "LoopShape"
 gkTuning          cabbageGetValue     "Tuning"
 gkPhaseLock       cabbageGetValue     "PhaseLock"
 gkFreeze          cabbageGetValue     "Freeze"
 gkPortTime        cabbageGetValue     "PortTime"
 
 ; loop shape table
 if changed:k(gkLoopShape)==1 then
                   tablecopy           giLoopShapeTab, gkLoopShape + giRamp - 1
                   cabbageSet          1, "LoopShapeTab", "tableNumber", giLoopShapeTab
 endif

; read soundfiler bounds
iBounds[]          cabbageGet          "Display", "bounds"
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



endin




instr    99    ; load sound file
 gichans          filenchnls         gSfilepath               ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL         ftgen              1,0,0,1,gSfilepath,0,0,1
 if gichans==2 then
  gitableR        ftgen              2,0,0,1,gSfilepath,0,0,2
 else
  gitableR        ftgen              2,0,0,1,gSfilepath,0,0,1 ; if input is mono, right table is simply a copy of the mono input file  
 endif
 gkReady          init               1                        ; if no string has yet been loaded giReady will be zero
 gkFileLen        init               ftlen(1)
 
                  cabbageSet         "Display", "file", gSfilepath

  /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet         "stringbox","text",SFileNoExtension

endin





instr    2
if gkPlay==0 then                              ; IF 'PLAY LOOPED' BUTTON IS INACTIVE...
                   turnoff                     ; TURN THIS INSTRUMENT OFF
endif                                          ; END OF THIS CONDITIONAL BRANCH

iFileLen           =                   ftlen(gitableL) / ftsr(gitableL)             ; file length in seconds

kRamp              linseg              0, 0.01, 1
kPortTime          =                   kRamp * gkPortTime

kLoopBeg           portk               gkLoopBeg, kPortTime                         ; APPLY PORTAMENTO SMOOTHING TO CHANGES OF LOOP BEGIN SLIDER
kLoopEnd           portk               gkLoopEnd, kPortTime                         ; APPLY PORTAMENTO SMOOTHING TO CHANGES OF LOOP END SLIDER
kLoopBeg           =                   kLoopBeg * iFileLen                          ; RESCALE gkLoopBeg (RANGE 0-1) TO BE WITHIN THE RANGE 0-FILE_LENGTH.
kLoopEnd           =                   kLoopEnd * iFileLen                          ; RESCALE gkLoopEnd (RANGE 0-1) TO BE WITHIN THE RANGE 0-FILE_LENGTH.
kLoopLen           =                   abs(kLoopEnd - kLoopBeg)                     ; DERIVE LOOP LENGTH FROM LOOP START AND END POINTS
kPlayPhasFrq       divz                gkSpeed * (1-gkFreeze), kLoopLen, 0          ; SAFELY DIVIDE, PROVIDING ALTERNATIVE VALUE IN CASE DENOMINATOR IS ZERO 
kDir               =                   gkLoopEnd > gkLoopBeg ? 1 : -1
kPhasor            oscilikt            1, kPlayPhasFrq * (gkLoopShape == 1 ? 1 : 0.5) * kDir, gkLoopShape + giRamp - 1
kPlayNdx           =                   (kPhasor * kLoopLen) + kLoopBeg               ; RESCALE INDEX POINTER ACCORDING TO LOOP LENGTH AND LOOP BEGINING


; move wiper
iDTBounds[]        cabbageGet          "Display", "bounds"
iDTX               =                   iDTBounds[0]
iDTY               =                   iDTBounds[1]
iDTWid             =                   iDTBounds[2]
iDTHei             =                   iDTBounds[3]
;kPhasor            =                   gkLoopEnd > gkLoopBeg ? kPhasor : (1 - kPhasor)

kPtr               =                   gkLoopEnd > gkLoopBeg ? (kPhasor * (gkLoopEnd - gkLoopBeg) + gkLoopBeg) : kPhasor * (gkLoopBeg - gkLoopEnd) + gkLoopEnd

;kPtr               =                   kPhasor * kDir * (gkLoopEnd - gkLoopBeg) + gkLoopBeg
                   cabbageSet          metro:k(32), "Wiper", "bounds", iDTX + iDTWid * kPtr, iDTY, 1, iDTHei

kOutGain           portk               gkOutGain, kPortTime
if changed:k(gkFFTsize,gkdecim)==1 then
 reinit RESTART
endif
RESTART:
a1            mincer       a(kPlayNdx), kOutGain, gkPitch,  gitableL, gkPhaseLock, i(gkFFTsize), i(gkdecim)
a2            mincer       a(kPlayNdx), kOutGain, gkPitch,  gitableR, gkPhaseLock, i(gkFFTsize), i(gkdecim)
rireturn

              outs         a1, a2
/*
f_bufL             pvsbufread          kPlayNdx , gkhandleL                         ; READ BUFFER
f_scaleL           pvscale             f_bufL, gkPitch                              ; RESCALE FREQUENCIES
f_lockL            pvslock             f_scaleL, gkPhaseLock
aL                 pvsynth             f_lockL                                      ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL    

f_bufR             pvsbufread          kPlayNdx , gkhandleR                         ; READ BUFFER
f_scaleR           pvscale             f_bufR, gkPitch                              ; RESCALE FREQUENCIES
f_lockR            pvslock             f_scaleR, gkPhaseLock
aR                 pvsynth             f_lockR                                      ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL    

                   outs                aL*gkOutGain, aR*gkOutGain                   ; SEND AUDIO TO OUTPUTS
SKIP_PLAY_LOOP:                                                                     ; JUMP TO HERE WHEN 'PAUSE' BUTTON IS ACTIVE
*/
endin




instr 500 ; MIDI activated note
/*
iAtt               cabbageGetValue     "Att"
iRel               cabbageGetValue     "Rel" 
icps               cpstmid             i(gkTuning) + 200
kMIDI2Pitch        cabbageGetValue     "MIDI2Pitch"
kMIDI2Speed        cabbageGetValue     "MIDI2Speed"
kUnison            cabbageGetValue     "Unison"
kRatio             =                   icps/cpsmidinn(kUnison)
kRatio             pow                 kRatio, gkStretch
kSpeed             =                   kMIDI2Speed == 1 ? kRatio*gkSpeed : gkSpeed
kPitch             =                   kMIDI2Pitch == 1 ? kRatio*gkPitch : gkPitch
kporttime          linseg              0,0.001,0.05                                 ; PORTAMENTO TIME RAMPS UP RAPIDLY TO A HELD VALUE
kLoopBeg           portk               gkLoopBeg, kporttime                         ; APPLY PORTAMENTO SMOOTHING TO CHANGES OF LOOP BEGIN SLIDER
kLoopEnd           portk               gkLoopEnd, kporttime                         ; APPLY PORTAMENTO SMOOTHING TO CHANGES OF LOOP END SLIDER
kLoopBeg           =                   kLoopBeg * gkRecDur                          ; RESCALE gkLoopBeg (RANGE 0-1) TO BE WITHIN THE RANGE 0-FILE_LENGTH.
kLoopEnd           =                   kLoopEnd * gkRecDur                          ; RESCALE gkLoopEnd (RANGE 0-1) TO BE WITHIN THE RANGE 0-FILE_LENGTH.
kLoopLen           =                   abs(kLoopEnd - kLoopBeg)                     ; DERIVE LOOP LENGTH FROM LOOP START AND END POINTS
kPlayPhasFrq       divz                kSpeed, kLoopLen, 0.00001                    ; SAFELY DIVIDE, PROVIDING ALTERNATIVE VALUE IN CASE DENOMINATOR IS ZERO 
kPlayNdx           oscilikt             1, kPlayPhasFrq * (gkLoopShape == 1 ? 1 : 0.5), gkLoopShape + giRamp - 1
kPlayNdx           =                   (kPlayNdx*kLoopLen) + kLoopBeg               ; RESCALE INDEX POINTER ACCORDING TO LOOP LENGTH AND LOOP BEGINING

f_bufL             pvsbufread          kPlayNdx , gkhandleL     ; READ BUFFER
f_scaleL           pvscale             f_bufL, kPitch           ; RESCALE FREQUENCIES
aL                 pvsynth             f_scaleL                 ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL    

f_bufR             pvsbufread          kPlayNdx , gkhandleR     ; READ BUFFER
f_scaleR           pvscale             f_bufR, kPitch           ; RESCALE FREQUENCIES
aR                 pvsynth             f_scaleR                 ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL    
aAtt               cosseg              0,iAtt,1
aRel               expsegr             1,iRel,0.001
aEnv               =                   aAtt * aRel
                   outs                aL*gkOutGain*aEnv, aR*gkOutGain*aEnv ; SEND AUDIO TO OUTPUTS
SKIP_PLAY_LOOP:                                                             ; JUMP TO HERE WHEN 'PAUSE' BUTTON IS ACTIVE
*/
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>