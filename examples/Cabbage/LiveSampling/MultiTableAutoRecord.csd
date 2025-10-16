
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; MultiTableAutoRecord.csd
; Written by Iain McCurdy 2011 (FLTK), 2023 (Cabbage)

; This example captures live audio chunks or gestures and stores each in individual and sequential function tables for playback
;  on sequential notes of a MIDI keyboard. This might then be used as the basis of a live-sampling performance using an instrument of the voice.

; There are therefore two distinct modes of interaction with this instrument: 'CAPTURE SAMPLES' and 'PLAYBACK' 
;  which are selected using the two radio buttons on the top-left of the interface.

; Audio is fragmented according to its changing amplitude which is assessed using a running trace of the RMS of the input signal.
; For this reason the CAPTURE SAMPLES phase works best if the user plays a sequence of individual sound ideas 
;  which are separated by short pauses of silence.

; Nonetheless, the response of this fragment capturing can be fine tuned by adjusting the ON and OFF trigger points 
;  for recording and stopping recording.

; Additionally, once a fragment has been captured, it must pass some rules in order to be accepted - 
;  - it must have reached a user-defined peak decibel level and it must exceed a user-defined minimum duration.
; A 'RETRIGGER DELAY' setting defines the minimum time after which a recording has concluded before which a new one is allowed to commence.
; All of these conditions are implemented in order to prevent errant fumbles or taps from being kept as desired samples.

; This example buffers and 'edits' audio on the fly. 
; Audio chunks are written in sequential function tables. 
; In this example 127 buffers are implemented but this number could easily be increased. 
; When the final buffer has been written to, writing begins again at the first buffer. 
; Each recorded chunk is automatically mapped to a different note on a MIDI keyboard for playback. 
; Editing of audio chunks is done based on the setting of the On and Off Thresholds. 
; If the R.M.S. of the input signal rises above the 'On Threshold' recording begins, 
; if it subsequently drops below the 'Off Threshold' recording stops. In order for a buffer to be kept and the buffer counter to increment 
;  it must pass the requirements for 'Minimum Allowed Time' and 'Minimum Allowed Amp. Peak'. This is done in order to weed out excessively short
;  or excessively quiet chunks. 
; 'Retrigger Delay' defines a minimum time after a recording has completed before a new recording can begin. 
; Increasing this can also help prevent the recording of accidental chunks.
; 'Delay Audio' is a time delay applied to the audio written into the buffer. 
; Increasing this can help prevent the loss of attack portions in recorded chunks - 
; this might be particularly useful if the source sound has a slow attack such as a clarinet. 
; 'Note Range' defines the range of notes that will trigger samples. 
; If 'Min.' is set to 21 then MIDI note 21 will trigger buffer number 1.                                     
; A number box informs the user which buffer will be written to next. 
; 'Reset Buffers' will erase all buffers and reset the buffer recording to the first buffer in the list.

; Typically the off threshold should be slightly higher than the on threshold.
; Observe the VU meter to assess what good settings for these might be

; When changing minimum and maximum key limits, 'RESET' should also be clicked to clear all buffers and 'CAPTURE SAMPLES' restarted.
; Clicking RESET will cancel 'CAPTURE SAMPLES' mode, if it was active.

; CAPTURE SAMPLES/PLAYBACK - radio buttons that select whether we are capturing samples from the live audio stream 
;                             or whether we are playing them back using MIDI notes.

; RECORDING                - this is just an indicator to show whether a sample is being recorded
; KEEP/REJECT              - these two buttons will show whether the most recently capture sample will be kept or rejected 
;                              according to to the rules.

; RULES
; Retrig. Delay            - delay time between a sample capture ending and a new one being allowed to start
; Min. Dur.                - minimum duration of sample that will be kept
; Min. Peak (dB)           - samples captured that have a peak below this setting will be rejected
; Delay Audio              - a delay that is applied to the audio captured (not the audio detected)
;                             increasing this can help with retaining attacks of sounds, avoiding the RMS detecter lag. 
; STOP WHEN FULL           - if this is activated, once the buffer writing reaches the 'MaxKey' limit 
;                              sample capture is deactivated and playback mode is entered.
;                            Otherwise the buffer number wraps around and buffers will be overwritten

; INPUT MODE
;  Either a mono (signal at the left input) ir stereo input (different signal at left and right inputs) can be selected
;  If mono mode is selected, the signal at the left input channel is simply copied to the right channel.
;  Subsequent buffering and processing is carried out on parallel buffers and channels. 
; Live Level O.P.          - amount of the live audio signal that will be sent to the output.
;                            normally this should be zero when in 'CAPTURE SAMPLES' mode to prevent signal feedback 
;                             affecting the RMS tracking and recorded signal quality.

; RMS TRACE | REC/STOP THRESHOLDS
;  a graph trace of the RMS of the input stream is shown. A wiper shows the current location
; Input Gain               - an amplitude gain applied to the live input audio. This can be used to compensate for a weak input signal.
; ON                       - threshold point at which recording of a sample will begin (indicated on the graph with a green line)
; OFF                      - threshold point at which recording of a sample will stop (indicated on the graph with a red line)

; FILLED BUFFERS | KEYRANGE MIN/MAX
;  a representation is provided of the number of buffers fulled. These are shown as greenboxes within the long black oblong.
;  the current buffer to whicj recording will be made is indicated with a red box
; MinKey                   - this is the slider widget above the FILLED BUFFERS indicator and defines the lower MIDI key limit to which buffers will be recorded and played back from
; MaxKey                   - this is the slider widget below the FILLED BUFFERS indicator and defines the upper MIDI key limit to which buffers will be recorded and played back from
; NEXT BUFFER:             - an indication of the next buffer number which will be written to
; LAST DURATION:           - an indication of the duration of the last sample captured

; PLAYBACK OPTIONS
;  Settings pertaining to 'PLAYBACK' mode
; VELOCITY TO:             - MIDI key velocity can be mapped to different parameters...
;  1. AMPLITUDE            - if activated, MIDI key velocity will be mapped to amplitude of the played back sample
;  2. FILTER               - if activated, MIDI key velocity will be mapped to the cutoff frequency of a low pass filter applied to the played back sample
; Bend Range (0-24)        - pitch bend will alter the playback speed (and pitch) of the played back sample. The maximum and miniumum limits of its control can be set here.
; MOD. WHEEL TO:           - MIDI modulation wheel changes can be mapped to different parameters...
;  1. AMPLITUDE            - if activated, modulation wheel changes will be mapped to amplitude of the played back sample
;  2. FILTER               - if activated, modulation wheel changes will be mapped to the cutoff frequency of a low pass filter applied to the played back sample
; AMPLITUDE ENVELOPE:      - the duration/sustain and amplitude shaping of the played back sample can be modified in diffrerent ways. 
;                             These are radio buttons, i.e.: only one can be active at a time.
;  1. PLAY FULL SAMPLE     - if this is active, the entire recorded sample will always be played back, regardless of the the key release
;  2. ENVELOPE             - if this is active, the amplitude shaping over time and the amplitude behaviour with regard to key release 
;                             will be governed by the 'ATTACK', 'DECAY' and 'RELEASE' settings.
; ATTACK                   - attack time (if 'ENVELOPE' mode is active)
; DECAY                    - decay time (if 'ENVELOPE' mode is active)
; RELEASE                  - release time (if 'ENVELOPE' mode is active)

<Cabbage>
#define PANEL_COLOUR 210,210,215
#define PANEL_COLOUR2 225,225,235

form caption("Auto Multi-Sample") size(895,495), pluginId("AuSa"), colour($PANEL_COLOUR), guiMode("queue")
keyboard bounds(5,395,885,85)

#define DIAL_STYLE trackerColour(170,170,190), colour( 170, 180,180), fontColour(20,20,20), textColour(20,20,20),  markerColour( 20,20,30), outlineColour(50,50,50), valueTextBox(1)
#define LABEL_STYLE fontColour(20,20,20)
#define CHECKBOX_STYLE fontColour(20,20,20)

; Sample/Playback
image     bounds(  5,  5,255, 35), colour($PANEL_COLOUR2), outlineColour("Grey"), outlineThickness(200), corners(5)
button    bounds( 10, 10,120, 25), channel("RecReady"), text("CAPTURE SAMPLES","CAPTURE SAMPLES"), value(0), latched(1), colour:0(50,20,20), colour:1(250,50,50), fontColour:0(150,40,40), fontColour:1(255,200,200), radioGroup(1)
button    bounds(135, 10,120, 25), channel("Playback"), text("PLAYBACK","PLAYBACK"), value(1), latched(1), colour:0(0,40,0), colour:1(20,205,20), fontColour:0(40,150,40), fontColour:1(150,255,150), radioGroup(1)

; Recording Sample - Keep:Reject
image     bounds(  5, 45,255, 35), colour($PANEL_COLOUR2), outlineColour("Grey"), outlineThickness(200), corners(5), channel("CaptureIndicators"), visible(0)
{
button    bounds(  5,  5,120, 25), channel("Rec"),    text("RECORDING"),       value(0), latched(1), colour:0(50,20,20), colour:1(250,50,50),  fontColour:0(150,40,40),  fontColour:1(255,200,200), active(0)
button    bounds(130,  5, 58, 25), channel("Keep"),   text("KEEP","KEEP"),     value(0), latched(1), colour:0( 0,40,0),  colour:1( 50,250,50), fontColour:0( 40,150,40), fontColour:1(200,255,200), active(0)
button    bounds(192,  5, 58, 25), channel("Reject"), text("REJECT","REJECT"), value(0), latched(1), colour:0(50,20,20), colour:1(205, 20,20), fontColour:0(150, 40,40), fontColour:1(255,200,200), active(0)
}

; Reset all
button    bounds( 10, 85,120, 25), channel("Reset"), text("RESET ALL","RESET All"), value(0), latched(0), colour:0(40,40,0), colour:1(255,205, 0), fontColour:0(150,150,40), fontColour:1(255,255,200)

; rules dials
rslider   bounds(  5,125, 70,100) channel("RetrigDel"), text("Retrig. Delay"), range(0.001,0.1,0.01,0.5), $DIAL_STYLE
rslider   bounds( 80,125, 70,100) channel("MinTim"), text("Min. Time"), range(0.01,0.5,0.07,0.5), $DIAL_STYLE
rslider   bounds(  5,235, 70,100) channel("MinPeak"), text("Min. Peak (dB)"), range(-40,-1,-26), $DIAL_STYLE
rslider   bounds( 80,235, 70,100) channel("DelayAudio"), text("Delay Audio"), range(0.0001,0.2,0.05,0.5), $DIAL_STYLE
checkbox  bounds(  5,345,150, 15), channel("StopWhenBuffsFull"), text("STOP WHEN FULL"), value(1), colour("Yellow"), fontColour:0(20,20,20), fontColour:1(20,20,20)

line      bounds( 160,145, 2,240), colour("Silver")

; Input signal settings
label     bounds(175,162, 70, 12), text("INPUT MODE"), $LABEL_STYLE
combobox  bounds(175,175, 70, 20) channel("MonoStereo"), items("mono", "stereo"), value(1)
rslider   bounds(175,235, 70,100) channel("LiveLevel"), text("Live Level O.P."), range(0,1,0,0.5), $DIAL_STYLE

; RMS Display Table
image     bounds(265,  5,625,150), colour($PANEL_COLOUR2), outlineColour("Grey"), outlineThickness(2), corners(5)
{
label     bounds(  0,  5,625, 15), text("RMS TRACE | REC/STOP THRESHOLDS"), fontColour(50,50,50)
rslider   bounds( 10, 25, 70,100), channel("InGain"), text("Input Gain"), range(0,5,1,0.5), $DIAL_STYLE
vslider   bounds( 80, 20, 20,118), channel("OnThresh"), range(0,1,0.02,0.5), colour(100,255,100), trackerColour(100,255,100)
label     bounds( 80,130, 20, 11), text("ON"), fontColour(20,170,20)
vslider   bounds(100, 20, 20,118), channel("OffThresh"), range(0,1,0.03,0.5), colour(255,100,100), trackerColour(255,100,100)
label     bounds(100,130, 20, 11), text("OFF"), fontColour(170,20,20)
gentable  bounds(120, 25,500,100), tableNumber(1001), channel("RMSDisp"), fill(0), ampRange(0,1,-1), tableColour("White") ; RMS display table
image     bounds(120, 25,  1,100), channel("wiper")
image     bounds(120, 75,500,  0), channel("OnThreshLine"), colour(100,255,100)
image     bounds(120, 75,500,  0), channel("OffThreshLine"), colour(255,100,100)
}

; key-range and filled buffers display
image     bounds(265,160,625, 95), colour($PANEL_COLOUR2), outlineColour("Grey"), outlineThickness(2), corners(5)
{
label     bounds(  0,  5,625, 15), text("FILLED BUFFERS | KEYRANGE MIN/MAX"), fontColour(50,50,50)
hslider   bounds(  0, 23,625, 20) channel("MinKey"), range(0,127,36,1,1), colour("Grey"), trackerBackgroundColour($PANEL_COLOUR), trackerColour($PANEL_COLOUR)
gentable  bounds(  5, 40,615, 10), tableNumber(1002), channel("FilledBuffers"), ampRange(0.1,1,-1) ; filled buffers display
image     bounds(  5, 40,  0,  0) colour(255,100,0) channel("CurrentFilledBuffer") ; width is width of gentable divided by 127
hslider   bounds(  0, 44,625, 25) channel("MaxKey"), range(0,127,84,1,1), colour("Grey"), trackerBackgroundColour($PANEL_COLOUR), trackerColour($PANEL_COLOUR)
label     bounds(  5, 70,100, 15), text("NEXT BUFFER:"), align("right"), $LABEL_STYLE
nslider   bounds(110, 65, 30, 25), channel("BufNum"), range(0,127,36,1,1), active(0)
label     bounds(145, 70,115, 15), text("LAST DURATION:"), align("right"), $LABEL_STYLE
nslider   bounds(265, 65, 50, 25), channel("LastDuration"), range(0,60,0), active(0)
}

; playback options
image     bounds(265,260,625,130), colour($PANEL_COLOUR2), outlineColour("Grey"), outlineThickness(2), corners(5)
{
label     bounds(  0,  5,625, 15), text("PLAYBACK OPTIONS"), fontColour(50,50,50)
label     bounds( 10, 35,100, 12), text("VELOCITY TO:") align("left"), fontColour(20,20,20)
checkbox  bounds( 10, 55,100, 15), channel("Vel2Amp"), text("AMPLITUDE"), value(1), colour("Yellow"), fontColour:0(20,20,20), fontColour:1(20,20,20)
checkbox  bounds( 10, 75,100, 15), channel("Vel2Filt"), text("FILTER"), value(1),   colour("Yellow"), fontColour:0(20,20,20), fontColour:1(20,20,20)
rslider   bounds(110, 25, 70, 70) channel("PBRange"), text("Bend Range"), range(0,24,2,1,1), $DIAL_STYLE
label     bounds(210, 35,100, 12), text("MOD. WHEEL TO:") align("left"), fontColour(20,20,20)
checkbox  bounds(210, 55,100, 15), channel("MW2Amp"), text("AMPLITUDE"), value(0), colour("Yellow"), fontColour:0(20,20,20), fontColour:1(20,20,20)
checkbox  bounds(210, 75,100, 15), channel("MW2Filt"), text("FILTER"), value(0),   colour("Yellow"), fontColour:0(20,20,20), fontColour:1(20,20,20)
label     bounds(330, 35,130, 12), text("AMPLITUDE ENVELOPE:") align("left"), fontColour(20,20,20)
checkbox  bounds(330, 55,130, 15), channel("EnvSus"), text("PLAY FULL SAMPLE"), value(1), colour("Yellow"), fontColour:0(20,20,20), fontColour:1(20,20,20), radioGroup(2)
checkbox  bounds(330, 75,130, 15), channel("EnvRel"), text("ENVELOPE"), value(0), colour("Yellow"), fontColour:0(20,20,20), fontColour:1(20,20,20), radioGroup(2)
rslider   bounds(455, 25, 70, 70) channel("Att"), text("ATTACK"), range(0,8,0,0.5), $DIAL_STYLE
rslider   bounds(505, 25, 70, 70) channel("Dec"), text("DECAY"), range(0,8,0,0.5), $DIAL_STYLE
rslider   bounds(555, 25, 70, 70) channel("Rel"), text("RELEASE"), range(0,8,0.1,0.5), $DIAL_STYLE
label     bounds(  5,105,140, 15), text("LAST NOTE PLAYED:"), $LABEL_STYLE
nslider   bounds(145,100, 30, 25), channel("LastNotePlayed"), range(0,127,0,1,1), active(0)
}

label bounds(  5,481,110, 12), text("Iain McCurdy |2023|"), align("left"), fontColour("DarkGrey")
</Cabbage>
<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>
ksmps   =  4
nchnls  =  1
0dbfs   =  1  ; MAXIMUM AMPLITUDE

maxalloc 3,1 ; restrict instr 3 to one note at a time
massign 0,2  ; all MIDI sent to instr 2

giRMSDisp       ftgen  1001,0,1024,-7,0
giFilledBuffers ftgen  1002,0,128,-2,0
giEmptyBuffers  ftgen     0,0,128,-2,0

;CREATE EMPTY BUFFERS
giNumBufs   =           127                             ; NUMBER OF AVAILABLE BUFFERS (THE BUFFER COUNTER WILL LOOP WHEN ALL BUFFERS HAVE BEEN FILLED)
giBufSize   =           524288                          ; SIZE OF EACH INDIVIDUAL BUFFER. At 48kHz each will store up to about 11 seconds of audio
iCount      =           1                               ; A COUNTER USED IN THE LOOPING PROCESS TO CREATE MANY EMPTY BUFFERS
LOOP:                                                   ; A LABEL - LOOP RETURNS TO THIS POINT
gibuff      ftgen       iCount,     0, giBufSize, -7, 0 ; CREATE AN EMPTY BUFFER FOR AUDIO
gibuffR     ftgen       iCount+100, 0, giBufSize, -7, 0 ; CREATE AN EMPTY BUFFER FOR AUDIO
iCount      =           iCount + 1                      ; INCREMENT THE COUNTER
 if (iCount < 127)      igoto LOOP                      ; IF NOT ALL BUFFERS HAVE BEEN CREATED YET RETURN TO THE BEGINNING OF THE LOOP

giDurations ftgen       0,0,4096,-2,0                   ; TABLE CONTAINING RECORDING DURATIONS





instr 1 ; always on

gkOnThresh        cabbageGetValue "OnThresh"
gkOffThresh       cabbageGetValue "OffThresh"

; guard that these won't overlap
kMinKey           cabbageGetValue "MinKey"
kMaxKey           cabbageGetValue "MaxKey"
if changed:k(kMinKey)==1 && kMinKey>kMaxKey then
                  cabbageSetValue "MaxKey", kMinKey, 1
elseif changed:k(kMaxKey)==1 && kMaxKey<kMinKey then
                  cabbageSetValue "MinKey", kMaxKey, 1
endif



; turn buffer-recording instrument on or off
gkRecReady        cabbageGetValue "RecReady"
if trigger:k(gkRecReady,0.5,0)==1 then
                  event           "i",3,0,-1
                  cabbageSet      k(1),"CaptureIndicators", "visible", 1
elseif trigger:k(gkRecReady,0.5,1)==1 then
                  cabbageSetValue "BufNum",kMinKey,1 ; update record to buffer with new minimum key limit (in case the slider has been changed) 
                  cabbageSetValue "Rec",0,1          ; turn of record indication, just in case it is still stuck on
                  cabbageSet      k(1),"CaptureIndicators", "visible", 0
                  turnoff2        3,0,1
endif

; trigger reset all buffers instrument
gkReset           cabbageGetValue "Reset"
if trigger:k(gkReset,0.5,0)==1 then
                  event           "i",4,0,0
endif

kBufNum           cabbageGetValue "BufNum"
; ensure we won't write to a table below the minimum key setting
if kMinKey>kBufNum then
                  cabbageSetValue "BufNum",kMinKey
endif  
  
 ; Audio Input
 gaInL            inch            1                            ; READ CHANNEL 1 (LEFT CHANNEL IF STEREO)
 kMonoStereo      cabbageGetValue "MonoStereo"                 ; select mono or stereo input mode
 gaInR            =               kMonoStereo == 2 ? inch:a(2) : gaInL ; set right channel
 kInGain          cabbageGetValue "InGain"                     ; input gain
 gaInL            *=              kInGain                      ; apply input gain (left channel)
 gaInR            *=              kInGain                      ; apply input gain (right channel)
 gkrms            rms             gaInL                        ; CREATE A AMPLITUDE FOLLOWING UNIPOLAR SIGNAL
 kLiveLevel       cabbageGetValue "LiveLevel"
                  outs            gaInL*kLiveLevel, gaInR*kLiveLevel 
 
 ; print to RMS display table
 kPhs             phasor          1/10 ; this controls the speed of the wiper
                  tablew          gkrms^0.5,kPhs,1001,1
 ktrig            metro           32
 iWidgetBounds[]  cabbageGet      "RMSDisp", "bounds"
                  cabbageSet      ktrig,"RMSDisp", "tableNumber", 1001
                  cabbageSet      ktrig,"wiper", "bounds", iWidgetBounds[0] + kPhs*iWidgetBounds[2], iWidgetBounds[1],1, iWidgetBounds[3]
                  cabbageSet      changed:k(gkOnThresh),"OnThreshLine", "bounds", iWidgetBounds[0],  iWidgetBounds[1]+(iWidgetBounds[3]*(1-gkOnThresh^0.5)),  iWidgetBounds[2],  1
                  cabbageSet      changed:k(gkOffThresh),"OffThreshLine", "bounds", iWidgetBounds[0],  iWidgetBounds[1]+(iWidgetBounds[3]*(1-gkOffThresh^0.5)),  iWidgetBounds[2],  1
endin


initc7  1,1,1 ; initialise modulation wheel to maximum

instr 2                                                 ; MIDI PLAYBACK INSTRUMENT
 if gkRecReady==1 then                                  ; turn off MIDI note if we are in 'record buffer' mode
                  turnoff
 endif
 inum             notnum                                      ; MIDI NOTE NUMBER
                  cabbageSetValue "LastNotePlayed", inum
 kPB              cabbageGetValue "PBRange" 
 
 iTabNum          =               inum                        ; DERIVE THE REQUIRED FUNCTION TABLE NUMBER FOR AUDIO DATA
 iDur             table           inum,giDurations            ; DERIVE THE DURATION OF THE BUFFER THAT WILL BE PLAYED FROM THE VALUE PREVIOUSLY WRITTEN INTO DURATIONS TABLE 
 iRel             init            0.05                        ; RELEASE TIME TO PREVENT CLICKS

 iEnvSus          cabbageGetValue "EnvSus"
 iEnvRel          cabbageGetValue "EnvRel"
 if iEnvSus==1 then
  xtratim iDur
  aEnv            =               1
 else
  aEnv            linsegr         0,0.01,1,iRel,0             ; ANTI-CLICK AMPLITUDE ENVELOPE WITH RELEASE STAGE 
 endif
 
 iVel             ampmidi         1                           ; READ MIDI KEY VELOCITY
 iamp             pow             iVel, 2
 ktime            timeinsts                                   ; TIMER OF HOW LONG THIS NOTE HAS BEEN PLAYING
 if ktime>=iDur-iRel then                                     ; IF END OF FILE IS REACHED BEFORE THE KEY IS RELEASED...
   turnoff                                                    ; TURN OFF
 endif                                                        ; END OF THIS CONDITIONAL BRANCH
 andx             line            0,1,sr                      ; INFINITELY RISING LINE USED AS FILE POINTER
 andx             *=              semitone(kPB)
 asigL            tablei          andx, iTabNum               ; READ AUDIO FROM AUDIO STORAGE FUNCTION TABLE
 asigR            tablei          andx, iTabNum+100           ; READ AUDIO FROM AUDIO STORAGE FUNCTION TABLE
 iVel2Amp         cabbageGetValue "Vel2Amp"
 iVel2Filt        cabbageGetValue "Vel2Filt" 
 iMW2Amp          cabbageGetValue "MW2Amp"
 iMW2Filt         cabbageGetValue "MW2Filt"
 kMW              midic7          1, 0, 1                    ; read in modulation wheel in the range 0 - 1
 kMWFilt          =               iMW2Filt==1 ? kMW : 1
 kCFoct           =               (iVel * 8 * kMWFilt) + 6   ; calculate low-pass filter cutoff frequency (oct format)
 if iVel2Filt==1 then
  asigL            butlp           asigL, cpsoct(kCFoct)     ; low-pass filter both channels
  asigR            butlp           asigR, cpsoct(kCFoct)
 endif
 if iVel2Amp==1 then
  asigL            *=              iamp  * a(kMW^2)          ; apply velocity amplitude control
  asigR            *=              iamp  * a(kMW^2)
 endif
 if iMW2Amp==1 then
  asigL            *=              a(kMW^2)                  ; apply modulation wheel amplitude control
  asigR            *=              a(kMW^2)
 endif
 asigL             *=              aEnv                      ; apply amplitude envelope
 asigR             *=              aEnv
                  outs            asigL, asigR               ; SEND AUDIO TO OUTPUT
endin




instr 3 ; RECORD BUFFERS
 if gkRecReady==0 then
  turnoff
 endif
 kDelayAudio      cabbageGetValue "DelayAudio"
 kRetrigDel       cabbageGetValue "RetrigDel"
 iBufNum          cabbageGetValue "BufNum"

 aDelSigL         vdelay          gaInL,a(kDelayAudio)*1000,0.3*1000 ; CREATE DELAYED VERSION OF AUDIO SIGNAL
 aDelSigR         vdelay          gaInR,a(kDelayAudio)*1000,0.3*1000 ; CREATE DELAYED VERSION OF AUDIO SIGNAL
 itablen          =               ftlen(iBufNum)                     ; INTERROGATE FUNCTION TABLE USED FOR AUDIO RECORDING TO DETERMINE ITS LENGTH - THIS WILL BE USED TO CONTROL THE MOVEMENT   OF THE WRITE POINTER
 kStartRec        trigger         gkrms, gkOnThresh,0                ; GENERATE A TRIGGER IMPULSE WHEN RECORDING BEGINS
 kStopRec         trigger         gkrms, gkOffThresh,1               ; GENERATE A TRIGGER IMPULSE WHEN RECORDING STOPS
                  cabbageSetValue "Rec",k(1),kStartRec
                  cabbageSetValue "Rec",k(0),kStopRec
  
 if gkrms>gkOnThresh then                                      ; IF RMS RISES ABOVE 'ON THRESHOLD'...
  aRecNdx         line            0,1,sr                       ; RISING VALUE THAT WILL BE USED AS THE WRITE POINTER (in samples)
  aenv            linseg          0,0.01,1                     ; REMOVE ANY POSSIBLE CLICK AT BEGINNING OF WRITTEN TABLE
  aDelSigL        =               aDelSigL*aenv                ; APPLY ANTI-CLICK ENVELOPE
  aDelSigR        =               aDelSigR*aenv                ; APPLY ANTI-CLICK ENVELOPE
                  tablew          aDelSigL,aRecNdx,iBufNum     ; WRITE AUDIO TO AUDIO STORAGE TABLE
                  tablew          aDelSigR,aRecNdx,iBufNum+100 ; WRITE AUDIO TO AUDIO STORAGE TABLE
  apeak           init            0                            ; INITIAL VALUE FOR PEAK AMPLITUDE
                  maxabsaccum     apeak, aDelSigL              ; COMPARE PREVIOUS PEAK AMPLITUDE WITH CURRENT AMPLITUDE
 endif
 if kStopRec==1 then                                ; IF RMS DROPS BELOW THE 'OFF THRESHOLD' A TRIGGER IS GENERATED
                  tablew          k(aRecNdx)/sr,iBufNum,giDurations ; WRITE BUFFER DURATION TO THE DURATIONS TABLE. REMEMBER BUFFER NUMBER HAS ALREADY BEEN INCREMENTED, THEREFORE THE NEED TO COMPENSATE
 ;                                    p1 p2 p3             p4      p5
                  event           "i",5, 0, i(kRetrigDel),iBufNum,k(apeak) ; TRIGGER INSTRUMENT TO CHECK BUFFER
                  event           "i",p1,0.1,-1               ; RETRIGGER ITSELF AFTER A SMALL DELAY
                  turnoff                                     ; TURNOFF THIS INSTRUMENT IMMEDIATELY
 endif                                                        ; END OF CONDITIONAL BRANCHING
endin

instr 4 ;ERASE BUFFERS AND RESET COUNTER TO BEGINNING OF LIST
                  cabbageSetValue "RecReady",0
 ;CLEAR BUFFERS
 iCount           =               1                           ; A COUNTER USED IN THE LOOPING PROCESS TO CREATE MANY EMPTY BUFFERS
 LOOP:                                                  ; A LABEL - LOOP RETURNS TO THIS POINT
 gibuff           ftgen           iCount, 0, giBufSize, -7, 0 ; CREATE AN EMPTY BUFFER FOR AUDIO
 iCount           =               iCount + 1                  ; INCREMENT THE COUNTER
  if (iCount < 89) igoto LOOP                           ; IF NOT ALL BUFFERS HAVE BEEN CREATED YET RETURN TO THE BEGINNING POF THE LOOP
                  cabbageSetValue "BufNum",cabbageGetValue:i("MinKey")
                  tableicopy      giFilledBuffers,giEmptyBuffers                ; clear 'filled buffers' table
                  cabbageSet      "FilledBuffers","tableNumber",giFilledBuffers ; update gentable display
 iMinKey          cabbageGetValue "MinKey"
 iWidgetBounds[]  cabbageGet      "FilledBuffers", "bounds"
                  cabbageSet      "CurrentFilledBuffer","bounds",5+(iMinKey*(iWidgetBounds[2]/127)),iWidgetBounds[1],5,iWidgetBounds[3]  ; move 'Current Filled Buffer' indicator
endin



instr 5 ;CHECK RECORDER BUFFER CHARACTERISTICS (AMPLITUDE AND DURATION) - DELETE IF IT DOESN'T MEET REQUIREMENTS
 iMinKey          cabbageGetValue "MinKey"
 iMaxKey          cabbageGetValue "MaxKey"
 iMinPeak         cabbageGetValue "MinPeak"
 iMinTim          cabbageGetValue "MinTim"
 iBufNum          =               p4                          ; BUFFER NUMBER OF THE BUFFER TO BE CHECKED. SENT FROM INSTR 3 AS p4
 iPeak            =               p5                          ; AMPLITUDE PEAK VALUE FROM THE BUFFER TO BE CHECKED. SENT FROM INSTR 3 AS p5
 iDur             table           iBufNum,giDurations         ; READ DURATION OF THIS BUFFER FROM THE DURATIONS TABLE
 if (iPeak>ampdbfs(iMinPeak)) && (iDur>iMinTim) then    ; IF RECORDED BUFFER MEETS THE STIPULATED REQUIREMENTS...
 ; update Filled Buffers table
                  tablew          1,iBufNum,giFilledBuffers                      ; update 'filled buffer' indicator table
 iWidgetBounds[]  cabbageGet      "FilledBuffers", "bounds"
                  cabbageSet      "FilledBuffers","tableNumber",giFilledBuffers  ; update corresponding GUI gentable
                  cabbageSet      "CurrentFilledBuffer","bounds",5+(iBufNum*(iWidgetBounds[2]/127)),iWidgetBounds[1],5,iWidgetBounds[3]  ; move 'Current Filled Buffer' indicator
                  cabbageSetValue "LastDuration", iDur ; print duration of last successfully captured sample
 iStopWhenBuffsFull cabbageGetValue "StopWhenBuffsFull"
 if (iStopWhenBuffsFull==1) && (iBufNum==iMaxKey) then
                  cabbageSetValue "RecReady", 0 ; if MaxKey buffer is reached, turn off 'CAPTURE SAMPLES' 
  turnoff
 else
  iBufNum          wrap            iBufNum+1,iMinKey,iMaxKey+1  ; INCREMENT AND WRAP TO PREVENT OUT OF RANGE VALUES
                   cabbageSetValue "BufNum",iBufNum
                   event_i         "i",6,0,0.6 ; 'KEEP' button flash
  endif
 else
                  event_i         "i",7,0,0.6 ; 'REJECT' button flash
 endif                                                  ; END OF CONDITIONAL BRANCH
 ; otherwise the buffer will simply be overwritten
endin


instr 6 ; keep indicator
                  cabbageSetValue "Keep", 1   ; turn on 'KEEP' indicator at i-time
                  cabbageSetValue "Reject", 0 ; turn off 'REJECT' indicator, just in case it's still lit
                  cabbageSetValue "Keep", 0, trigger:k(release:k(),0.5,0) ; turn off 'KEEP' indicator just as this note ends
endin


instr 7 ; reject indicator
                  cabbageSetValue "Reject", 1 ; turn on 'REJECT' indicator at i-time
                  cabbageSetValue "Keep", 0   ; turn off 'KEEP' indicator, just in case it's still lit
                  cabbageSetValue "Reject", 0, trigger:k(release:k(),0.5,0) ; turn off 'REJECT' indicator just as this note ends
endin
</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>