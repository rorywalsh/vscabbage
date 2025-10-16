
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Soundlooper.csd
; Iain McCurdy, 2023

; This is essentially an encapsulation and demonstration of the sndloop opcode.

; sndloop provides a convenient means of sampling audio in real time and then playing it back 
;  with optional transposition by changing the playback speed.
; At the same time, we are limited by the inputs provided by the opcode so for greater flexibility,
;  designing something like this from first principles such as by using function tables and table reading is recommended.

; REC-PLAY (button) - activates recording of buffer immediately followed by playback. 
;                     If 'ONLY PLAY ON MIDI NOTES' is acitvated, output is muted unless a note is played.
; PAUSE (button)     - this will pause both recording and playback
; LIVE SIGNAL OUTPUT - set whether the live audio input signal is passed to the output (live audio while looping is controller separately) 
; LIVE SIGNAL WHILE LOOPING - set whether the live audio input signal is passed to the output while looping
; ONLY PLAY ON MIDI NOTES - mute output unless a MIDI note is being played

; DIALS:
; Dur.(s)           - duration of buffer (only takes effect each time recording is started)
; Pitch (ratio)     - speed/pitch ratio of loop playback (also set by keys played)
; Glide Time        - legato time which is applied to changes of Pitch, amplitude (velocity), 
;                      amplitude (notes on/off) and filter (velocity)
; Crossfade (s)     - a crossfade time applied at the beginning and end of the loop.
;                     limited to 1/2 of the full duration of the loop in order ot prevent strange behaviour.
; Input Gain        - gain control on the signal entering the instrument
; Input Gain        - gain control on the signal leaving the instrument
; 
; CHECKBOXES
; VELOCITY TO AMPLITUDE - velocity of notes played will affect amplitude. Smoothed by 'Glide Time'. Only operates when ONLY PLAY ON MIDI NOTES is active.
; VELOCITY TO FILTER    - velocity of notes played will affect the cutoff frequency of a lowpass filter. Only operates when ONLY PLAY ON MIDI NOTES is active.
;                            Smoothed by 'Glide Time'.
; MONO/STEREO       - in mono mode the left channel input is send to both channels of the output
;                     in stereo mode, both input channels are processed independently (true stereo)

; Default opcode output at various stages of interaction
; 1. before opcode has been triggered :    dry signal || no loop output || RecPlay=0 || Rec=0
; 2. while recording                  :    dry signal || no loop output || RecPlay=1 || Rec=1 (RecPlay has been activated)
; 3. while looping                    : no dry signal ||    loop output || RecPlay=1 || Rec=0 
; 4. deactivation RecPlay button      :    dry signal || no loop output || RecPlay=0 || Rec=0 (RecPlay has been deactivated)

<Cabbage>
form caption("SoundLooper") size(975,280), pluginId("SoLo"), colour(42,38,40), guiMode("queue")
#define DIAL_STYLE trackerColour(200,200,200), colour( 70, 60, 65), fontColour(200,200,200), textColour(200,200,200),  markerColour(220,220,220), outlineColour(50,50,50), valueTextBox(1)

gentable  bounds(  5,105,965, 70), tableNumber(1), channel("table"), fill(0), tableColour("Silver")
image     bounds(  5,105,965, 70), outlineThickness(2), outlineColour("Silver"), colour(0,0,0,0)
keyboard  bounds(  5,180,965,85)

button    bounds(  5,  5,100, 25), channel("RecPlay"), text("REC —› PLAY","REC —› PLAY"), fontColour:1(255,170,170), fontColour:0(120,50,50), colour:0(10,0,0), colour:1(200,50,50), value(0)
button    bounds(110,  5,100, 25), channel("pause"), text("PAUSE","PAUSE"), fontColour:1(255,255,255), fontColour:0(50,50,70), colour:0(0,0,10), colour:1(70,70,200), value(0)

checkbox  bounds(  5, 40,250, 15), channel("Live"), text("LIVE SIGNAL OUTPUT"), value(0), colour("Yellow")
checkbox  bounds(  5, 60,250, 15), channel("LiveWhileLooping"), text("LIVE SIGNAL WHILE LOOPING"), value(0), colour("Yellow")
checkbox  bounds(  5, 80,250, 15), channel("MIDIplay"), text("ONLY PLAY ON MIDI NOTES"), value(0), colour("Yellow")

rslider   bounds(215,  5, 70, 95) channel("InGain"), text("Input Gain"), range(0,20,1,0.5), $DIAL_STYLE
rslider   bounds(295,  5, 70, 95) channel("dur"), text("Dur.(s)"), range(0.01,60,3,0.5), $DIAL_STYLE
rslider   bounds(375,  5, 70, 95) channel("pitch"), text("Pitch (ratio)"), range(-4,4,1), $DIAL_STYLE
rslider   bounds(455,  5, 70, 95) channel("glide"), text("Glide Time"), range(0.001,1,0.1), $DIAL_STYLE
rslider   bounds(535,  5, 70, 95) channel("fad"), text("Crossfade (s)"), range(0,20,1,0.5), $DIAL_STYLE
rslider   bounds(615,  5, 70, 95) channel("OutGain"), text("Output Gain"), range(0,5,1,0.5), $DIAL_STYLE

checkbox  bounds(695, 15,200, 15), channel("velAmp"), text("VELOCITY TO AMPLITUDE"), value(1), colour("Yellow")
checkbox  bounds(695, 35,200, 15), channel("velFilt"), text("VELOCITY TO FILTER"), value(1), colour("Yellow")
checkbox  bounds(695, 55,200, 15), channel("reverse"), text("REVERSE"), value(0), colour("Yellow")
button    bounds(695, 75, 60, 20), channel("mono"), text("MONO","MONO"), radioGroup(1), value(1), latched(1), fontColour:1(255,255,150), fontColour:0(70,70,50), colour:0(10,10,0), colour:1(30,30,0)
button    bounds(760, 75, 60, 20), channel("stereo"), text("STEREO","STEREO"), radioGroup(1), value(0), latched(1), fontColour:1(255,255,150), fontColour:0(70,70,50), colour:0(10,10,0), colour:1(30,30,0)

label     bounds(870, 10, 90,12) text("E N V E L O P E"), colour(0,0,0)
rslider   bounds(860, 25, 60, 75) channel("Att"), text("Attack"), range(0.001,5,0.01,0.5), $DIAL_STYLE
rslider   bounds(910, 25, 60, 75) channel("Rel"), text("Release"), range(0.001,5,0.2,0.5), $DIAL_STYLE

label bounds( 5,266,110, 12), text("Iain McCurdy |2023|"), align("left"), fontColour("LightGrey")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

ksmps          =                8 ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls         =                1 ; NUMBER OF CHANNELS (1=MONO)
0dbfs          =                1 ; MAXIMUM AMPLITUDE

i_             ftgen            1,0,2^16,2,0     ; display table
i_             ftgen            2,0,ftlen(1),2,0 ; permanently blank table (used to erase display table)

massign 0,1                                       ; ALL MIDI NOTES TO INSTR 1

instr 1                                           ; MIDI ACTIVATED INSTRUMENT - READS MIDI NOTE VALUES
 icps          cpsmidi                              ; READ PITCH VALUES (IN HERTZ) FROM A CONNECTED MIDI KEYBOARD
 ifreqratio    =                icps/cpsoct(8)      ; DERIVE A FREQUENCY RATI0 (BASE FREQUENCY IS MIDDLE C)
               cabbageSetValue  "pitch", ifreqratio ; SEND MIDI NOTE TO WIDGETS
 giVel         ampmidi          1                   ; KEY VELOCITY
 gkVel         init             giVel               ; SEND NEW VELOCITY AS GLOBAL K-RATE VARIABLE
endin

instr 2                                            ; SOUND RECORDING AND PLAYING INSTRUMENT (ALWAYS ON)
 kRecPlay      cabbageGetValue  "RecPlay"            ; sndloop rec-play trigger
 kpause        cabbageGetValue "pause"
 kLive          cabbageGetValue  "Live"                ; switch that sets whether any dry signal is sent to the output
 kLiveWhileLooping cabbageGetValue  "LiveWhileLooping" ; LIVE AUDIO OUTPUT WHILE RECORDING (the default opcode behaviour is to ,mute live audio while recording and this ishould be considered useful in preventing feedback into the recording
 kMIDIplay     cabbageGetValue  "MIDIplay"           ; 'ONLY PLAY ON MIDI NOTES'
 kdur          cabbageGetValue  "dur"                ; buffer duration (needs to be set before activating sndloop
 kfad          cabbageGetValue  "fad"                ; crossfade time between end and beginning of loop
 kfad          limit            kfad,0,kdur*0.5      ; crossfade time should not exceed half the duration of the buffer so is limited for this
 kInGain       cabbageGetValue  "InGain"             ; gain applied to all paths of input signal
 kglide        cabbageGetValue  "glide"
 kporttime     linseg           0,0.001,1
 kpitch        cabbageGetValue  "pitch"
 kpitch        portk            kpitch,kporttime*kglide
 kvelAmp       cabbageGetValue  "velAmp"
 kvelFilt      cabbageGetValue  "velFilt"
 kreverse      cabbageGetValue  "reverse"
 kAtt          cabbageGetValue  "Att"
 kRel          cabbageGetValue  "Rel"
 
 ; mono/stereo switch
 kmono         cabbageGetValue  "mono"
 kstereo       cabbageGetValue  "stereo"
 kmonostereo   =                kmono + kstereo*2
 
 ; reset display table index and envelope to '1' each time REC-PLAY trigger is restarted 
 if trigger:k(kRecPlay,0.5,0)==1 then
  kDispNdx     =             0                      ; index used for writing into display function table and gentable
 endif
 
 ; input
 aInL,aInR     ins                                   ; READ STEREO INPUT
 aInL          *=              kInGain              ; amplitude scale input signal
 if kmonostereo==2 then                            ; mono/stereo input options
  aInR         *=              kInGain
 else
  aInR         =               aInL
 endif
 
 ; PAUSE function. Affects record, playback and display table.
 if (kpause==1) then
  aL            =                0
  aR            =                0 
 else
  ; display table
  krec          init             0                    ; INITIAL STATE OF krec. (NEEDED FOR THE CONDITIONAL IN THE NEXT LINE)
  if krec==1  then                                    ; filling buffer
                tablew           aInL,a(kDispNdx),1,1 ; write audio into display table  
    kDispNdx    +=               1/(kr*kdur)          ; increment display table index
                cabbageSet       metro:k(128),"table","tableNumber",1 ; update display table
  endif
  if trigger:k(krec,0.5,0)==1 then                    ; reset buffer
   kIndic       =                0                    ; reset indicator position
                tablecopy        1,2                  ; copy blank table to display table
                cabbageSet       metro:k(128),"table","tableNumber",1 ; update display tablew
  endif
 
 
  kMIDIactive active           1                      ; SENSE NUMBER OF MIDI NOTES ACTIVE
   
  if changed:k(krec)==1 then                          ; if rec is toggled... either starting recording, or entering playback...
   if changed:k(kdur,kfad)==1 then                    ; and if duration or crossfade time have been changed...
             reinit           RESET                   ; ...reinitialise sndloop
   endif
  endif
   
  RESET:
  aL,krec sndloop                aInL,kpitch*((1-kreverse)*2-1),kRecPlay,i(kdur),i(kfad) ;'krec' OUTPUTS A FLAG TO TELL US WHETHER WE ARE RECORDING (1) OR PLAYING BACK (0)
  if kmonostereo==2 then
   aR,krecR sndloop              aInR,kpitch*((1-kreverse)*2-1),kRecPlay,i(kdur),i(kfad)
  else
   aR           =                aL
  endif
 endif
   
 rireturn

 ; switch button colours according to record and play functions
               cabbageSet       trigger:k(krec,0.5,0),"RecPlay","colour:1", 200,50,50
               cabbageSet       trigger:k(krec,0.5,0),"RecPlay","fontColour:1", 255,170,170
               cabbageSet       trigger:k(krec,0.5,1),"RecPlay","colour:1", 50,100,50
               cabbageSet       trigger:k(krec,0.5,1),"RecPlay","fontColour:1", 100,255,100

   ; simple amplitude envelope if MIDI trigger mode is selected
   if (kMIDIplay==1 && kRecPlay==1 && krec==0) then ; only play when MIDI note playing
    kMIDIactive limit         active:k(1),0,1               ; SENSE NUMBER OF MIDI NOTES ACTIVE, but limit to 1 max
    kEnv        lagud         kMIDIactive,kAtt,kRel
    aL          *=            a(kEnv)                       ; apply envelope (interpolate to a-rate to prevent quantisation noise)
    aR          *=            a(kEnv)                       ; apply envelope (interpolate to a-rate to prevent quantisation noise)
   endif
      
   ; MIDI velocity-controlled amplitude
   if (kvelAmp==1 && kMIDIplay==1 && kRecPlay==1 && krec==0) then
    kAmp      portk             gkVel, kporttime*kglide      ; portamento applied to velocity changes to create create a smooth amplitude value
    aL         *=               kAmp
    aR         *=               kAmp
   endif
   
   ; velocity-controlled low pass filter
   if (kvelFilt==1 && kMIDIplay==1 && kRecPlay==1 && krec==0) then
    kCFoct   portk            gkVel*8+6, kporttime*kglide   ; portamento applied to velocity changes to create create a smooth low-pass filter cutoff value
    aL       butlp            aL, cpsoct(kCFoct)
    aR       butlp            aR, cpsoct(kCFoct)
   endif    
    
   ; input audio to output while playback
   if (kLiveWhileLooping==1 && krec==0 && kRecPlay==1 && kLive==1) then ; sndloop normally outputs live input signal while recording. This mechanism mutes that (if selected in the GUI)
             outs             aInL, aInR
   endif

   ; mute when LIVE SIGNAL OUTPUT is off 
   if (kLive==0 && kRecPlay==0 && krec==0) || (kLive==0 && kRecPlay==1 && krec==1) then
    aL       *=               0
    aR       *=               0
   endif
             outs             aL, aR                        ; SEND AUDIO TO OUTPUT
endin

</CsInstruments>                         
                                         
<CsScore>
;INSTR | START | DURATION                
i  2       0        z     ; INSTRUMENT PLAYS 'FOREVER'
</CsScore>                               
                                         
</CsoundSynthesizer>
