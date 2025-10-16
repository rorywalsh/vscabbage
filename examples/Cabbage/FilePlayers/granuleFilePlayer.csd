
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; granuleFilePlayer.csd
; Written by Iain McCurdy, 2023

; NOTE THAT RED CONTROLS ARE ONLY UPDATED AT I-RATE, 
;  SO MODIFYING THEM IN NON-MIDI MODE WILL CAUSE DISCONTINUITIES IN THE AUDIO STREAM
;  AND WITH MIDI NOTES THEY WILL ONLY BE UPDATED WHEN NEW NOTES ARE PLAYED

; First load a file using the 'Open File' button.

; The xypad can be used to modulate Grain Size (x-axis) and Grain Gap (y-axis) simultaneously

; Level       - output level control
; N.Voices    - number of simultaneous granular synthesis voices (layers). 
;                This is limited to 128 layers but if more are needed just trigger multiple notes.
; Speed Ratio - speed of movement through the sound file as a ratio with normal speed
; Grain Mode  - direction of the playback of each individual grain: Fwd, Bwd or randomly Fwd or Bwd
; Start       - where to start reading grains from within the chosen sound file as a ratio of its full length
;                an indicator on the waveform provides visual confirmation of the start position.
;                this indicator does not move as the note progresses 
;                as there are too many factors (including random ones) 
;                impacting the actual position of granule's internal grain pointer.
;                Start can also be moved with right-click over the sound file
; Start OS    - random offset of Start in seconds (different for each layer)
; Grain Size  - size of grains in seconds
; Gr.Size OS  - random offset of the grain size (percentage)
; Att. Time   - rise time for each individual grain as a percentage of the full duration of the grain
; Dec. Time   - decay time for each individual grain as a percentage of the full duration of the grain
; Grain Gap   - gap between consecutive grains in a layer
; Gap OS      - random offset of the gap between grains in each layer (percentage)
; N. Pitches  - number of pitch transpositions (zero = random transpositions between -1 and +1 octaves)
; Pitch 1 to 4 - four user-definable transpositions (switchable between semitones or ratios)
;                the 'Global' control in each mode transposes all four voices.
; MIDI Ref.   - unison MIDI note (number)
; Att. Time   - Attack Time over each note (seconds)
; Rel. Time   - Release Time over each note (seconds)
; LIMITER     - when activated, prevents clipping

<Cabbage>
form caption("Granule File Player") size(875,610), colour("Silver") pluginId("SWPl"), guiMode("queue")

#define SliderStyleK #textColour("Black"), textColour("Black"), fontColour("Black"), valueTextBox(1), colour(50,110, 80), trackerColour(150,210,180)#
#define SliderStyleI #textColour("Black"), textColour("Black"), fontColour("Black"), valueTextBox(1), colour(250,110,110), trackerColour(255,200,200)#

soundfiler bounds(  5,  5,575,175), channel("beg","len"), channel("filer1"), colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 10,  7,200, 14), text(""), align("left"), channel("FileName")
image      bounds(  5,  5,  2,175), channel("StartIndic"), alpha(0.5)
label      bounds(630,139,195, 13), text("Grain Size →"), fontColour("Black")
label      bounds(605,105,100, 13), text("Grain Gap →"), align("left"), rotate(4.71, 0,13), fontColour("Black")
xypad      bounds(585,  5,285,175), channel("GSizeXY","GapXY"), alpha(0.85)

filebutton bounds( 15,205, 80, 22), text("Open File","Open File"), fontColour("White") channel("filename"), shape("ellipse")
checkbox   bounds( 15,240, 95, 22), channel("PlayStop"), text("Play/Stop"), fontColour:0("Black"), fontColour:1("Black")

rslider    bounds(100,202, 90, 90), channel("Amp"),    range(0,5,0.5,0.5), text("Level"), $SliderStyleK
rslider    bounds(165,202, 90, 90), channel("NVoice"), range(1,128,32,1,1), text("N. Voices"), $SliderStyleI
rslider    bounds(230,202, 90, 90), channel("SpeedRatio"), text("Speed Ratio"), range(0.0001,20,1,0.25,0.00001), $SliderStyleI

label      bounds(340,208, 66, 12), text("Grain Mode"), fontColour("Black"), align("centre")
checkbox   bounds(340,225, 80, 12), channel("mode1"), text("Reverse"), colour("Yellow"), fontColour:0("Black"), fontColour:1("Black"), radioGroup(2)
checkbox   bounds(340,240, 80, 12), channel("mode2"), text("Random"), colour("Yellow"), fontColour:0("Black"), fontColour:1("Black"), radioGroup(2)
checkbox   bounds(340,255, 80, 12), channel("mode3"), text("Forward"), colour("Yellow"), fontColour:0("Black"), fontColour:1("Black"), radioGroup(2), value(1)

rslider    bounds(425,202, 90, 90), channel("Inskip"), text("Start"), range(0,0.99,0), $SliderStyleI
rslider    bounds(490,202, 90, 90), channel("InskipOS"), text("Start OS"), range(0,30,0,0.25,0.00001), $SliderStyleI

image      bounds(585,185,285,110), colour(0,0,0,0), outlineThickness(1), outlineColour("Grey")
{  
label      bounds(  0,  2,285, 13), text("G R A I N   S I Z E"), fontColour("Black")
rslider    bounds(  0, 17, 90, 90), channel("GSize"), text("Grain Size"), range(0.0001,4,0.05,0.333,0.000001), $SliderStyleK
rslider    bounds( 65, 17, 90, 90), channel("GSizeOS"), text("Gr.Size OS"), range(0,100,30,1,1), $SliderStyleI
rslider    bounds(130, 17, 90, 90), channel("att"), text("Gr. Att."), range(0,100,30,1,1), $SliderStyleI
rslider    bounds(195, 17, 90, 90), channel("dec"), text("Gr. Dec."), range(0,100,30,1,1), $SliderStyleI
}

image      bounds(  5,300,155,110), colour(0,0,0,0), outlineThickness(1), outlineColour("Grey")
{
label      bounds(  0,  2,155, 13), text("D E N S I T Y"), fontColour("Black")
rslider    bounds(  0, 17, 90, 90), channel("Gap"), text("Grain Gap"), range(0,10,0,0.25,0.00001), $SliderStyleK
rslider    bounds( 65, 17, 90, 90), channel("GapOS"), text("Gap OS"), range(0,100,60,1,1), $SliderStyleI
}

image      bounds(165,300,415,210), colour(0,0,0,0), outlineThickness(1), outlineColour("Grey")
{  
label      bounds(  0,  2,350, 13), text("T R A N S P O S I T I O N S"), fontColour("Black")
checkbox   bounds(  5, 10, 80, 12), channel("NPitch0"), text("Random"), colour("Yellow"), fontColour:0("Black"), fontColour:1("Black"), radioGroup(1)
checkbox   bounds(  5, 25, 80, 12), channel("NPitch1"), text("1 Pitch"), colour("Yellow"), fontColour:0("Black"), fontColour:1("Black"), radioGroup(1), value(1)
checkbox   bounds(  5, 40, 80, 12), channel("NPitch2"), text("2 Pitches"), colour("Yellow"), fontColour:0("Black"), fontColour:1("Black"), radioGroup(1)
checkbox   bounds(  5, 55, 80, 12), channel("NPitch3"), text("3 Pitches"), colour("Yellow"), fontColour:0("Black"), fontColour:1("Black"), radioGroup(1)
checkbox   bounds(  5, 70, 80, 12), channel("NPitch4"), text("4 Pitches"), colour("Yellow"), fontColour:0("Black"), fontColour:1("Black"), radioGroup(1)
combobox   bounds(  5, 90, 70, 18), channel("PitchType"), items("Semitones","Ratios"), value(1)
 image      bounds( 65, 17,350, 90), colour(0,0,0,0), channel("semitones"), visible(1)
 {
 rslider    bounds(  0,  0, 90, 90), channel("Pitch1"), text("Pitch 1"), range(-48,48,0,1,0.001), $SliderStyleI
 rslider    bounds( 65,  0, 90, 90), channel("Pitch2"), text("Pitch 2"), range(-48,48,2,1,0.001), $SliderStyleI, active(0), alpha(0.5)
 rslider    bounds(130,  0, 90, 90), channel("Pitch3"), text("Pitch 3"), range(-48,48,5,1,0.001), $SliderStyleI, active(0), alpha(0.5)
 rslider    bounds(195,  0, 90, 90), channel("Pitch4"), text("Pitch 4"), range(-48,48,7,1,0.001), $SliderStyleI, active(0), alpha(0.5)
 rslider    bounds(260,  0, 90, 90), channel("PitchG"), text("Pitch Glob."), range(-48,48,0,1,0.001), $SliderStyleI
 }
 image      bounds( 65, 17,350, 90), colour(0,0,0,0), channel("ratios"), visible(0)
 {
 rslider    bounds(  0,  0, 90, 90), channel("Ratio1"), text("Ratio 1"), range(0.125,8,  1,0.5,0.00001), $SliderStyleI
 rslider    bounds( 65,  0, 90, 90), channel("Ratio2"), text("Ratio 2"), range(0.125,8,1.2,0.5,0.00001), $SliderStyleI, active(0), alpha(0.5)
 rslider    bounds(130,  0, 90, 90), channel("Ratio3"), text("Ratio 3"), range(0.125,8,1.5,0.5,0.00001), $SliderStyleI, active(0), alpha(0.5)
 rslider    bounds(195,  0, 90, 90), channel("Ratio4"), text("Ratio 4"), range(0.125,8,0.5,0.5,0.00001), $SliderStyleI, active(0), alpha(0.5)
 rslider    bounds(260,  0, 90, 90), channel("RatioG"), text("Ratio Glob"),range(0.125,8,1,0.5,0.00001), $SliderStyleI
 }

checkbox    bounds( 15,145, 80, 22), channel("MixMode"), text("Mix"), colour("Yellow"), fontColour:0("Black"), fontColour:1("Black")

rslider     bounds( 65,110, 90, 90), channel("Lev1"), text("Level 1"), range(  0, 1,1,0.5), $SliderStyleI, active(0), alpha(0.5)
rslider     bounds(130,110, 90, 90), channel("Lev2"), text("Level 2"), range(  0, 1,1,0.5), $SliderStyleI, active(0), alpha(0.5)
rslider     bounds(195,110, 90, 90), channel("Lev3"), text("Level 3"), range(  0, 1,1,0.5), $SliderStyleI, active(0), alpha(0.5)
rslider     bounds(260,110, 90, 90), channel("Lev4"), text("Level 4"), range(  0, 1,1,0.5), $SliderStyleI, active(0), alpha(0.5)

;xypad       bounds(350,110, 90, 90)
}

image      bounds(585,300,285,110), colour(0,0,0,0), outlineThickness(1), outlineColour("Grey")
{  
label      bounds(  0,  2,280, 13), text("C O N T R O L"), fontColour("Black")
rslider    bounds(  0, 17, 90, 90), channel("MidiRef"),   range(0,127,60, 1, 1),  text("MIDI Ref."), $SliderStyleI
rslider    bounds( 65, 17, 90, 90), channel("AttTim"),    range(0,    5.00, 0.1, 0.5, 0.001), text("Att. Time"), $SliderStyleI
rslider    bounds(130, 17, 90, 90), channel("RelTim"),    range(0.01, 5,    0.05, 0.5, 0.001), text("Rel. Time"), $SliderStyleI
button     bounds(220, 10, 50, 11), channel("Limiter"), text("LIMITER"), colour:0(0,0,0), colour:1(255,100,100), value(1)
vmeter     bounds(220, 25, 20, 75) channel("vu1") value(0) outlineColour(0, 0, 0), overlayColour(0, 0, 0) meterColour:0(255, 0, 0) meterColour:1(255, 255, 0) meterColour:2(0, 255, 0) outlineThickness(1) 
vmeter     bounds(250, 25, 20, 75) channel("vu2") value(0) outlineColour(0, 0, 0), overlayColour(0, 0, 0) meterColour:0(255, 0, 0) meterColour:1(255, 255, 0) meterColour:2(0, 255, 0) outlineThickness(1) 
}

keyboard   bounds(  5,515,865, 80)
label      bounds(  5,596,120, 12), text("Iain McCurdy |2023|"), align("left"), fontColour("DarkGrey")

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
giFileLen      init       0
giReady        init       0
gSfilepath     init       ""

gaMixL, gaMixR  init 0

instr    1
 gkMixMode,kT cabbageGetValue "MixMode"
        cabbageSet kT, "Lev1", "active", gkMixMode
        cabbageSet kT, "Lev2", "active", gkMixMode
        cabbageSet kT, "Lev3", "active", gkMixMode
        cabbageSet kT, "Lev4", "active", gkMixMode
        cabbageSet kT, "Lev1", "alpha", 0.5+gkMixMode*0.5
        cabbageSet kT, "Lev2", "alpha", 0.5+gkMixMode*0.5
        cabbageSet kT, "Lev3", "alpha", 0.5+gkMixMode*0.5
        cabbageSet kT, "Lev4", "alpha", 0.5+gkMixMode*0.5
 
; if trigger:k(gkMixMode,0.5,0)==1 then
        cabbageSetValue "NPitch4", 1, trigger:k(gkMixMode,0.5,0)
; endif
 
 
 kMOUSE_DOWN_RIGHT cabbageGetValue "MOUSE_DOWN_RIGHT"
 kMOUSE_X    cabbageGetValue "MOUSE_X"
 kMOUSE_Y    cabbageGetValue "MOUSE_Y"
 if kMOUSE_DOWN_RIGHT==1 && kMOUSE_X>5  && kMOUSE_X<605 && kMOUSE_Y>5 && kMOUSE_Y<180 then
  cabbageSetValue "Inskip",(kMOUSE_X-5)/600
 endif
 
 kporttime      linseg     0,0.001,1
 kporttime      *=         0.1
 kGSizeXY       cabbageGetValue "GSizeXY"
 kGapXY         cabbageGetValue "GapXY"
                cabbageSetValue "GSize",scale:k(kGSizeXY^3,1,0.0001),changed:k(kGSizeXY)
                cabbageSetValue "Gap",scale:k(kGapXY^4,10,0),changed:k(kGapXY)
 gkPlayStop     cabbageGetValue     "PlayStop"
 gkfreeze       cabbageGetValue     "freeze"
 gkfreeze       =          1-gkfreeze
 gkAmp          cabbageGetValue     "Amp"
 gkNVoice       cabbageGetValue     "NVoice"
 gkAmp          /=         gkNVoice^0.4
 gkNPitches     =                    (cabbageGetValue:k("NPitch0")*0)+(cabbageGetValue:k("NPitch1")*1)+(cabbageGetValue:k("NPitch2")*2)+(cabbageGetValue:k("NPitch3")*3)+(cabbageGetValue:k("NPitch4")*4) 
 cabbageSet changed:k(gkNPitches), "Pitch1", "active", gkNPitches>0?1:0
 cabbageSet changed:k(gkNPitches), "Pitch2", "active", gkNPitches>1?1:0
 cabbageSet changed:k(gkNPitches), "Pitch3", "active", gkNPitches>2?1:0
 cabbageSet changed:k(gkNPitches), "Pitch4", "active", gkNPitches>3?1:0
 cabbageSet changed:k(gkNPitches), "Pitch1", "alpha", gkNPitches>0?1:0.4
 cabbageSet changed:k(gkNPitches), "Pitch2", "alpha", gkNPitches>1?1:0.4
 cabbageSet changed:k(gkNPitches), "Pitch3", "alpha", gkNPitches>2?1:0.4
 cabbageSet changed:k(gkNPitches), "Pitch4", "alpha", gkNPitches>3?1:0.4
 cabbageSet changed:k(gkNPitches), "Ratio1", "active", gkNPitches>0?1:0
 cabbageSet changed:k(gkNPitches), "Ratio2", "active", gkNPitches>1?1:0
 cabbageSet changed:k(gkNPitches), "Ratio3", "active", gkNPitches>2?1:0
 cabbageSet changed:k(gkNPitches), "Ratio4", "active", gkNPitches>3?1:0
 cabbageSet changed:k(gkNPitches), "Ratio1", "alpha", gkNPitches>0?1:0.4
 cabbageSet changed:k(gkNPitches), "Ratio2", "alpha", gkNPitches>1?1:0.4
 cabbageSet changed:k(gkNPitches), "Ratio3", "alpha", gkNPitches>2?1:0.4
 cabbageSet changed:k(gkNPitches), "Ratio4", "alpha", gkNPitches>3?1:0.4
  
  
 gkNVoice       limit      gkNVoice,gkNPitches,128 ; can't be lower than number of pitch shift voices
 gkSpeedRatio   cabbageGetValue     "SpeedRatio"
 
 gkmode         =                    (cabbageGetValue:k("mode1")*-1)+(cabbageGetValue:k("mode2")*0)+(cabbageGetValue:k("mode3")*1)
 
 gkGSize        cabbageGetValue     "GSize"
 gkGSize        portk               gkGSize, kporttime
 gkGSizeOS      cabbageGetValue     "GSizeOS"
 katt           cabbageGetValue     "att"
 kdec           cabbageGetValue     "dec"
 if (katt+kdec)>100 then
  gkatt = int(katt * (100/(katt+kdec)))
  gkdec = int(kdec * (100/(katt+kdec)))
 else
  gkatt = katt
  gkdec = kdec
 endif
 gkGap        cabbageGetValue     "Gap"
 gkGapOS      cabbageGetValue     "GapOS"
 gkPitch1     cabbageGetValue     "Pitch1"
 gkPitch2     cabbageGetValue     "Pitch2"
 gkPitch3     cabbageGetValue     "Pitch3"
 gkPitch4     cabbageGetValue     "Pitch4"
 gkPitchG     cabbageGetValue     "PitchG"
 gkRatio1     cabbageGetValue     "Ratio1"
 gkRatio2     cabbageGetValue     "Ratio2"
 gkRatio3     cabbageGetValue     "Ratio3"
 gkRatio4     cabbageGetValue     "Ratio4"
 gkRatioG     cabbageGetValue     "RatioG"
 gkLev1       cabbageGetValue     "Lev1"
 gkLev2       cabbageGetValue     "Lev2"
 gkLev3       cabbageGetValue     "Lev3"
 gkLev4       cabbageGetValue     "Lev4"
 gkInskip,kT  cabbageGetValue     "Inskip"
 gkInskipOS   cabbageGetValue     "InskipOS"
              cabbageSet          kT, "StartIndic", "bounds", 4 + (gkInskip*600), 5, 2, 175
 gkLimiter    cabbageGetValue     "Limiter"

 gSfilepath     cabbageGetValue     "filename"
 kNewFileTrg    changed    gSfilepath    ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                 ; if a new file has been loaded...
                event      "i",99,0,0    ; call instrument to update sample storage function table 
 endif  

 ktrig         trigger    gkPlayStop,0.5,0
               schedkwhen ktrig,0,0,2,0,-1
 
 
 kPitchType    cabbageGetValue "PitchType"
 ; show/hide Pitch/Ratio controls
 if changed:k(kPitchType)==1 then
  cabbageSet changed:k(kPitchType), "ratios", "visible", (kPitchType-1)
  cabbageSet changed:k(kPitchType), "semitones", "visible", 1-(kPitchType-1)
 endif
 
 ; calculate pitches 
  gkPitch1  =  kPitchType == 1 ? gkPitch1+gkPitchG : (log2(gkRatio1*gkRatioG) * 12)
  gkPitch2  =  kPitchType == 1 ? gkPitch2+gkPitchG : (log2(gkRatio2*gkRatioG) * 12)
  gkPitch3  =  kPitchType == 1 ? gkPitch3+gkPitchG : (log2(gkRatio3*gkRatioG) * 12)
  gkPitch4  =  kPitchType == 1 ? gkPitch4+gkPitchG : (log2(gkRatio4*gkRatioG) * 12)

endin



instr    99    ; load sound file
 gichans       filenchnls gSfilepath                ; derive the number of channels (mono=1,stereo=2) in the sound file
 giFileLen     filelen    gSfilepath                ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL      ftgen      1,0,0,1,gSfilepath,0,0,1
 if gichans==2 then
  gitableR     ftgen      2,0,0,1,gSfilepath,0,0,2
 else
  gitableR     ftgen      2,0,0,1,gSfilepath,0,0,1
 endif
 giReady       =          1                         ; if no string has yet been loaded giReady will be zero
 giSRScale     =          ftsr(gitableL)/sr         ; scale if sound file sample rate doesn't match Cabbage sample rate
               cabbageSet     "filer1","file", gSfilepath
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
               cabbageSet  "FileName","text",SFileNoExtension
endin



instr    2    ; triggered by 'play/stop' button

 if gkPlayStop==0 then
               turnoff
 endif
 
 if giReady = 1 then                              ; i.e. if a file has been loaded
  iAttTim      cabbageGetValue     "AttTim"                ; read in widgets
  iRelTim      cabbageGetValue     "RelTim"
  ithd      =        0
  iLen      =        ftlen(gitableL)/sr
  iseed     =        0
  ifenv     =        0
  
  if changed:k(gkNVoice,gkNPitches,gkSpeedRatio,gkmode,gkGSizeOS,gkatt,gkdec,gkGapOS,gkPitch1,gkPitch2,gkPitch3,gkPitch4,gkPitchG,gkInskip,gkInskipOS,gkMixMode)==1 then
   reinit UPDATE
  endif
  UPDATE:
  
  if iAttTim>0 then                               ; is amplitude envelope attack time is greater than zero...
   kenv        cossegr    0,i(gkGSize),0,iAttTim,1,iRelTim,0   ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else            
   kenv        cossegr    0,i(gkGSize),0,0.01,1,iRelTim,0             ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv         expcurve   kenv,8                  ; remap amplitude value with a more natural curve
  aenv         interp     kenv                    ; interpolate and create a-rate envelope
  
  igskip    =        i(gkInskip)*iLen
  igskip_os =        i(gkInskipOS)
  ilength   =        iLen-igskip

  iseed1    random   0,1
  iseed2    random   0,1  
 
  if i(gkMixMode)==0 then
   a1        granule  gkAmp, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableL, i(gkNPitches), igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed1, semitone(i(gkPitch1))*giSRScale, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch4))*giSRScale ;, ifnenv] 
   a2        granule  gkAmp, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableR, i(gkNPitches), igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed2, semitone(i(gkPitch1))*giSRScale, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch4))*giSRScale ;, ifnenv] 
  else
   a1_1      granule  gkAmp*gkLev1, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableL, 1, igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed1, semitone(i(gkPitch1))*giSRScale, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch4))*giSRScale ;, ifnenv] 
   a2_1      granule  gkAmp*gkLev1, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableR, 1, igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed1, semitone(i(gkPitch1))*giSRScale, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch4))*giSRScale ;, ifnenv] 
   a1_2      granule  gkAmp*gkLev2, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableL, 1, igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed1, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch4))*giSRScale ;, ifnenv] 
   a2_2      granule  gkAmp*gkLev2, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableR, 1, igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed1, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch4))*giSRScale ;, ifnenv] 
   a1_3      granule  gkAmp*gkLev3, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableL, 1, igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed1, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch4))*giSRScale ;, ifnenv] 
   a2_3      granule  gkAmp*gkLev3, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableR, 1, igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed1, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch4))*giSRScale ;, ifnenv] 
   a1_4      granule  gkAmp*gkLev4, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableL, 1, igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed1, semitone(i(gkPitch4))*giSRScale, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch4))*giSRScale ;, ifnenv] 
   a2_4      granule  gkAmp*gkLev4, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableR, 1, igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed1, semitone(i(gkPitch4))*giSRScale, semitone(i(gkPitch2))*giSRScale, semitone(i(gkPitch3))*giSRScale, semitone(i(gkPitch4))*giSRScale ;, ifnenv] 
   a1        sum      a1_1, a1_2, a1_3, a1_4
   a2        sum      a2_1, a2_2, a2_3, a2_4
  endif
  rireturn
  
  gaMixL    +=       a1 * aenv
  gaMixR    +=       a2 * aenv
  
 endif

endin

instr    3 ; MIDI triggered instrument
 icps          cpsmidi                            ; read in midi note data as cycles per second
 iMidiRef      cabbageGetValue    "MidiRef"
 iFrqRatio     =         icps/cpsmidinn(iMidiRef) ; derive playback speed from note played in relation to a reference note (MIDI note 60 / middle C)
 iamp          ampmidi   1                        ; read in midi velocity (as a value within the range 0 - 1)

 if giReady = 1 then                              ; i.e. if a file has been loaded
  iAttTim      cabbageGetValue     "AttTim"                ; read in widgets
  iRelTim      cabbageGetValue     "RelTim"
  if iAttTim>0 then                               ; is amplitude envelope attack time is greater than zero...
   kenv        linsegr    0,iAttTim,1,iRelTim,0   ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else            
   kenv        linsegr    1,iRelTim,0             ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv         expcurve   kenv,8                  ; remap amplitude value with a more natural curve
  aenv         interp     kenv                    ; interpolate and create a-rate envelope
  ithd      =        0
  iLen      =        ftlen(gitableL)/sr
  iseed     =        0
  ifenv     =        0

  igskip    =        i(gkInskip)*iLen
  igskip_os =        i(gkInskipOS)
  ilength   =        iLen-igskip
 
  iseed1    random   0,1
  iseed2    random   0,1  
  
  a1        granule  gkAmp, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableL, i(gkNPitches), igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed1, semitone(i(gkPitch1))*iFrqRatio, semitone(i(gkPitch2))*iFrqRatio, semitone(i(gkPitch3))*iFrqRatio, semitone(i(gkPitch4))*iFrqRatio ;, ifnenv] 
  a2        granule  gkAmp, i(gkNVoice), i(gkSpeedRatio), i(gkmode), ithd, gitableR, i(gkNPitches), igskip, igskip_os, ilength, gkGap, i(gkGapOS), gkGSize, i(gkGSizeOS), i(gkatt), i(gkdec), iseed2, semitone(i(gkPitch1))*iFrqRatio, semitone(i(gkPitch2))*iFrqRatio, semitone(i(gkPitch3))*iFrqRatio, semitone(i(gkPitch4))*iFrqRatio ;, ifnenv] 

  gaMixL    +=       a1 * aenv
  gaMixR    +=       a2 * aenv
 endif

endin

instr 2000 ; meters and limiter
  a1  = gaMixL
  a2  = gaMixR
  gaMixL = 0
  gaMixR = 0
  
  if gkLimiter = 1 then
   kthresh     =           0.7                     ; read in widgets  
   krmsL       rms         a1                      ; scan both channels
   krmsR       rms         a2                      ; ...
   krms        max         krmsL,krmsR             ; but only use the highest rms
   krms        lagud       krms,0.1,1
   kfctr       limit       kthresh/krms,0.1,1      ; derive less than '1' factor required to attenuate audio signal to limiting value
   afctr       interp      kfctr                   ; smooth changes (and interpolate from k to a)
   a1          =           a1 * afctr              ; apply scaling factor
   a2          =           a2 * afctr
  endif
  
               outs        a1,a2

; meter
kres1 rms a1
cabbageSetValue "vu1", lagud:k(kres1,0.1,1)

kres2 rms a2
kres2 lagud kres2,0.1,1
cabbageSetValue "vu2", lagud:k(kres2,0.1,1)

endin
</CsInstruments>  

<CsScore>
i 1    0 z
i 2000 0 z
</CsScore>

</CsoundSynthesizer>
