
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; TimeSlip.csd
; Written by Iain McCurdy, 2015

; Implements realtime time stretching by buffering the realtime audio stream and then triggering event grains reading from the buffer.
; When in 'realtime' the instantaneous buffer is simply played back 
;  but as soon a non-realtime is active, the instrument switches to granular synthesis.

; Time Stretch - amount of time stretching.
;                e.g. 
;                1 = no time stretching
;                2 = half speed
;                4 = quarter speed etc...
;                As soon as 'Time Stretch' returns to '1' a quick crossfade is made back to the live audio stream.
; Freeze       - Activating this button if time stretching is already in progress will freeze time stretching completely (time stretch = infinity)
;                Sliding Time Stretch all the way to the right will also trigger the freeze button. 
;                Density and grain size will be unaffected. 

; Overlaps     - Number of grains allowed to overlaps simultaneously. Normally set to 2.
; Density      - Initial density when time stretching begins. 
;                Density also depends upon time stretching factor 
;                Density reduces as stretch increases while grain duration increases, therefore overlaps remains constant.
; Rand.When    - Adds a random factor to when grains will start. This can be used to reduce or prevent artefacts produced through strict periodic production of grains.
; Rand.Where   - Adds a random factor to from where in the buffer grains will be read. This can be used to reduce or prevent artefacts produced through strict periodic production of grains.
; Wet          - Level control of the wet (time stretching) sound. 
;                This should be adjusted to set a good balance between the dry sound (time stretch=1) and when the time stretching begins (time stretch>1)
;                Higher densities will result in higher amplitudes when stretching.

<Cabbage>
form caption("Time Slip"), size(700,210), pluginId("TmSl"), guiMode("queue")
image                bounds(0,0,700,210), colour( 40, 40, 60), shape("sharp")
groupbox bounds(  0,  0,700, 90), plant("SlowSlider"), colour(0,0,0,10) 
{
hslider  bounds(  5,  0,690, 90), range(1,20,1,0.5,0.0001), channel("stretch"), trackerColour(140,140,160), popupText(0)
;label    bounds(  5, 65,690, 14), text("Time Stretch")
label    bounds(  5, 68,690, 10), text(".  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .  .")
button   bounds(  5, 65, 60, 18), fontColour:0(50,50,50), fontColour:1(255,255,255), colour:0(0,10,0), colour:1( 50,200, 50), text("Realtime","Realtime"),channel("realtime"), value(1)
button   bounds(630, 65, 60, 18), fontColour:0(50,50,50), fontColour:1(255,255,255), colour:0(0,0,10), colour:1( 50, 50,250), text("Freeze","Freeze"), channel("freeze")
}

label    bounds( 10,110, 75, 15), text("I N P U T")
combobox bounds( 10,125, 75, 20), channel("input"), value(1), text("Mono","Stereo"), fontColour("silver"), align("centre")

label    bounds( 10,150, 75, 15), text("M O D E")
combobox bounds( 10,165, 75, 20), channel("mode"), value(1), text("Grains","FFT"), fontColour("silver"), align("centre")

image    bounds(100,100,600,110), colour(0,0,0,0), channel("grains")
{
checkbox bounds(  0, 10, 90, 15), channel, channel("GrainScale"), text("Grain Scale")
rslider  bounds( 90,  0, 80, 95), range(1,50,14,1,1),         channel("overlaps"), valueTextBox(1), textBox(1), trackerColour(140,140,160), text("Overlaps")
rslider  bounds(170,  0, 80, 95), range(1,50,7,1,1),         channel("dens"),     valueTextBox(1), textBox(1), trackerColour(140,140,160), text("Density")
rslider  bounds(250,  0, 80, 95), range(0,1,0.00,0.5,0.001), channel("RndWhen"),  valueTextBox(1), textBox(1), trackerColour(140,140,160), text("Rand.When")
rslider  bounds(330,  0, 80, 95), range(0,1,0.003,0.5,0.001), channel("RndWhere"), valueTextBox(1), textBox(1), trackerColour(140,140,160), text("Rand.Where")
rslider  bounds(410,  0, 80, 95), range(0,1,0.5),            channel("wet"),      valueTextBox(1), textBox(1), trackerColour(140,140,160), text("Wet")
rslider  bounds(490,  0, 80, 95), range(0,1,1),              channel("level"),    valueTextBox(1), textBox(1), trackerColour(140,140,160), text("Level")
}

image    bounds(100,100,600,110), colour(0,0,0,0), channel("FFT")
{
checkbox bounds(  0, 10, 90, 15), channel, channel("PLock"), text("Phase Lock"), value(0)
rslider  bounds( 90,  0, 80, 95), range(0,3,1.2,0.5), channel("FFTLev"), valueTextBox(1), textBox(1), trackerColour(140,140,160), text("Level")
}

label   bounds(  5,195, 120, 12), text("Iain McCurdy |2015|"), align("left")

</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-dm0 -n
</CsOptions>

<CsInstruments>

; sr is set by host
ksmps         =                  32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls        =                  2    ; NUMBER OF CHANNELS (1=MONO)
0dbfs         =                  1    ; MAXIMUM AMPLITUDE
            
giBuffL       ftgen              1, 0, (2^24) + 1, 2, 0
giBuffR       ftgen              2, 0, (2^24) + 1, 2, 0
gihanning     ftgen              0,  0, 131073, 20, 2, 1   ; HANNING WINDOW

instr    1
 kporttime    linseg             0, 0.01, 0.1
 gkstretch    cabbageGetValue    "stretch"
 gkstretchP   portk              gkstretch,kporttime
 gklevel      cabbageGetValue    "level"
 gkdens       cabbageGetValue    "dens"

 ; INPUT
 kinput       cabbageGetValue    "input"     
 if kinput==1 then
  gaInL       inch               1
  gaInR       =                  gaInL
 else
  gaInL,gaInR ins                                           ; READ REALTIME AUDIO INPUT
 endif
 
; gaInL,gaInR diskin2 "/Users/iainmccurdy/Documents/iainmccurdy.org/CsoundRealtimeExamples/SourceMaterials/ClassicalGuitar.wav",1,0,1
 
 
 ; MODE
 gkmode        cabbageGetValue    "mode"
 if changed:k(gkmode)==1 then
  if gkmode==1 then
              cabbageSet         1, "grains", "visible", 1
              cabbageSet         1, "FFT", "visible", 0
  else       
              cabbageSet         1, "grains", "visible", 0
              cabbageSet         1, "FFT", "visible", 1
  endif
 endif
 
 aWPhasor     phasor             sr/ftlen(giBuffL)          ; WRITE PHASOR
 kWPhasor     downsamp           aWPhasor                   ; K RATE VERSION OF WRITE PHASOR
              tablew             gaInL,aWPhasor,giBuffL,1   ; WRITE STEREO AUDIO TO TABLES
              tablew             gaInR,aWPhasor,giBuffR,1   ;
  
 if gkstretch==1 && active:k(2)==0 then                     ; IF TIME STRETCH SLIDER IS AT '1' AND 'REALTIME' MODE IS NOT YET ACTIVE, ACTIVATE IT
              event              "i",2,0,-1
              cabbageSetValue    "realtime",k(1)
 elseif gkstretch>1&&active:k(3)==0 then                    ; IF TIME STRETCH SLIDER IS INCREASED BEYOND '1' AND 'TIME STRETCH' MODE IS NOT YET ACTIVE, ACTIVATE IT
              cabbageSetValue    "realtime",k(0)            ; TURN OFF REALTIME BUTTON
              event              "i",3,0,-1,kWPhasor        ; TURN ON TIME STRETCH INSTRUMENT AND SEND IT CURRENT WRITE PHASOR POSITION
 endif
 
endin


instr    2    ; NORMAL PLAYBACK
 if gkstretch>1 then                                                  ; IF TIME STRETCH SLIDER IS INCREASED BEYOND '1' (LEFT-MOST) TURN OFF THIS NOTE
              turnoff
 endif
 aenv         linsegr            0, 0.1, 1, 4/i(gkdens), 0            ; RELEASE ENVELOPE
              outs               gaInL*aenv*gklevel, gaInR*aenv*gklevel
endin


instr    3    ; SLOWED PLAYBACK (TRIGGER SOUND GRAINS)
 koverlaps    cabbageGetValue    "overlaps"
 kRndWhen     cabbageGetValue    "RndWhen"
 kfreeze      cabbageGetValue    "freeze"
 krealtime    cabbageGetValue    "realtime"
 kGrainScale  cabbageGetValue    "GrainScale"
 kfreeze      cabbageGetValue    "freeze"
 
 gkRPhasor    phasor             (sr*(1-kfreeze))/(ftlen(1)*gkstretchP), p4 ; READ START POINTER PHASOR
 
 if gkstretch==1 then                                                       ; IS TIME STRETCH SLIDER IS RETURNED TO '1' (LEFT-MOST), DEACTIVATE FREEZE BUTTON
  kOff        =                  0
              cabbageSetValue    "freeze", kOff
  turnoff
 endif
 
 if gkstretch==20 && kfreeze==0 then                                        ; TURN ON FREEZE BUTTON IF TIME STRETCH SLIDER IS MOVED ALL THE WAY TO THE RIGHT 
  kOn         =                  1
              cabbageSetValue    "freeze", kOn
 elseif trigger:k(gkstretch,19.999,1)==1 then
              cabbageSetValue    "freeze", kOff    
 endif

 if trigger:k(krealtime,0.5,0)==1 && gkstretch>1 then                       ; IF REALTIME BUTTON IS ACTIVATED RETURN TIME STRETCH SLIDER TO '1' (LEFT-MOST)
  kReset      =         1
              cabbageSetValue    "stretch", kReset
 endif

 if gkmode==1 then
  ; 'Grain Scale' button is active, 
  ksize        =                  kGrainScale == 1 ? (2*gkstretchP)/gkdens : 1/gkdens
  kdens        =                  kGrainScale == 1 ? (gkdens*koverlaps)/gkstretchP : (gkdens*koverlaps)/4
  ktrig        metro              kdens                                       ; METRONOME TO TRIGGER GRAINS
               schedkwhen         ktrig,0,0,4,random:k(0,kRndWhen),ksize      ; TRIGGER GRAINS
 else
  kPLock       cabbageGetValue    "PLock"
  kFFTLev      cabbageGetValue    "FFTLev"
  arel         linsegr            1, 0.2, 0
  aL           mincer             a(gkRPhasor * ftlen(giBuffL)/sr)-2048/sr, gklevel*kFFTLev, 1, giBuffL, kPLock
  aR           mincer             a(gkRPhasor * ftlen(giBuffR)/sr)-2048/sr, gklevel*kFFTLev, 1, giBuffR, kPLock
               outs               aL*arel, aR*arel
 endif
endin

instr    4    ; SOUND GRAINS
 kRndWhere    cabbageGetValue    "RndWhere"
 kwet         cabbageGetValue    "wet"
 aenv         poscil             1, 1/p3, gihanning
 aPtr         line               0, p3, p3 * sr
 aPtr         +=                 (i(gkRPhasor)*ftlen(giBuffL)) + (random:i(-i(kRndWhere),0) * sr) - 2048/sr
 aSigL        tablei             aPtr,giBuffL
 aSigR        tablei             aPtr,giBuffR

 if gkstretch==1 then            ; RELEASE ENVELOPE - USED IF GRAINS ARE INTERRUPTED BY THE TIME STRETCH SLIDER IS RETURNED TO '1'/REALTIME EITHER BY DRAGGING THE SLIDER OR BY ACTIVATING THE REALTIME BUTTON
  arel        linsegr            1, 0.2, 0
  aSigL       *=                 arel
  aSigR       *=                 arel
              turnoff
 endif

              outs               aSigL * aenv * gklevel * kwet, aSigR * aenv * gklevel * kwet
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
