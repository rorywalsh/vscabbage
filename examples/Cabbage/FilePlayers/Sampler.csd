    
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Sampler.csd
; Written by Iain McCurdy, 2025

; A basic sample player with six layers that can be assigned limted to defined key ranges.

; The pitch of loaded samples can be detected so that the pitches that sound will correspond to the note played.

; The controls in the uppermost panel relate to all layers.
; ---------------------------------------------------------
; Tuning         -  a scheme by which the keyboard will be tuned. 12-TET (12 tones equal temperament is standard).

; ENVELOPE          Gated mode only. Envelope times are also dependent on note played about Unison point. Lower note's envelope durations will last for longer.
; Attack         -  attack time of an envelope (amplitude and low-pass filter) that will be applied to the sample when played back.
; Decay          -  decay time of an envelope (amplitude and low-pass filter) that will be applied to the sample when played back.
; Sustain        -  sustain level of an envelope (amplitude and low-pass filter) that will be applied to the sample when played back.
; Release        -  release time of an envelope (amplitude and low-pass filter), triggered upon key release that will be applied to the sample when played back.

; Jitter         -  amount of tonal jitter upon each note played
; Velocity       -  
; Note           -  prints the note number of the most recently played MIDI note
; Reference Tone -  when on, a sine tone correcponding to the key played will also sound so that the user can tune samples that are also playing (MIDI Ref.)
; Detect Time    -  time beyond the start of the sample at which pitch will be detected.
;                    note that many acoustic sounds begin with a noisy, chaotic spectrum so pitch detection will be more accurate once the spectrum stabilises.
;                    experiment with this setting if detection initially provides an inaccurate result. 
; Clear          -  force stop all sounding notes

; Load           -  load sample 1 to 6
; Key Range      -  the range of MIDI keys over which this sample will sound
; Method         -  choose whether the entire sample will be played each time (Percussion)
;                   whether it will be abbreviated if the key is released 
;                   or whether it will be repeat at a defined rate of pulsation.
; Loop           -  sample will be looped (Gate method only)
; Rate           -  rate of pulsation repetition (Pulse method only)
; Detect         -  detect the pitch of the loaded sample and use the result to set MIDI Ref. so that MIDI keys played correspond to the pitch that sounds.
; MIDI Ref.      -  the MIDI key at which the loaded sample will play back untransposed at normal speed.
; Pan/Bal.       -  panning (mono samples) or balance (stereo samples) for this layer.
; Bend Range     -  pitch bend range for this layer (in semitones)
; Level          -  output level for this layer
<Cabbage>
form caption("Sampler") size(1075,530), colour( 50, 50, 70), pluginId("Smpl"), guiMode("queue")

#define SLIDER_STYLE colour(60, 60,100), textColour("white"), trackerColour(210,210,250), valueTextBox(1)

; global controls
image      bounds(  5,  5,1065, 100), colour(0,0,0,0), outlineThickness(2), outlineColour("Grey"), corners(5)
{
label      bounds(  5,  3, 83, 13), text("Tuning"), fontColour("White")
combobox   bounds(  5, 20, 83, 22), channel("Tuning"), items("12-TET", "24-TET", "12-TET rev.", "24-TET rev.", "10-TET", "36-TET", "Just C", "Just C#", "Just D", "Just D#", "Just E", "Just F", "Just F#", "Just G", "Just G#", "Just A", "Just A#", "Just B"), value(1),fontColour("white")
rslider    bounds( 90,  5, 70, 90), text("Attack"), channel("AAtt"), range(0, 2, 0, 0.5,0.001), $SLIDER_STYLE
rslider    bounds(160,  5, 70, 90), text("Decay"), channel("ADec"), range(0, 2, 0, 0.5,0.001), $SLIDER_STYLE
rslider    bounds(230,  5, 70, 90), text("Sustain"), channel("ASus"), range(0, 1, 0, 0.5,0.001), $SLIDER_STYLE
rslider    bounds(300,  5, 70, 90), text("Release"), channel("ARel"), range(0.01,10, 0.1, 0.5), $SLIDER_STYLE




rslider    bounds(370,  5, 70, 90), text("Jitter"), channel("Jit"), range(0, 1, 0), $SLIDER_STYLE
rslider    bounds(440,  5, 70, 90), text("Velocity"), channel("Vel"), range(0, 1, 1), $SLIDER_STYLE
label      bounds(520,  5, 40, 16), text("Note"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(520, 21, 40, 27), channel("LastNoteNumber"), range(0,127,0,1,1), active(0)
checkbox   bounds(520, 55,110, 15), channel("RefTone"), text("Reference Tone"), fontColour:0("white"), fontColour:1("white")
rslider    bounds(640,  5, 70, 90), text("Detect Time"), channel("DetTim"), range(0.2,1,0.3), $SLIDER_STYLE
button     bounds(725, 15, 80, 40), text("Clear","Clear"), fontColour("white") channel("ClearAllNotes"), shape("ellipse"), latched(0), corners(5)
}

; sample 1
image      bounds(  5,110,1065, 50), colour(0,0,0,0), outlineThickness(2), outlineColour("Grey"), corners(5)
{
filebutton bounds(  5,  5, 80, 40), text("Load 1","Load 1"), fontColour("white") channel("filename1"), shape("ellipse")
soundfiler bounds( 90,  5,150, 40), channel("sample1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label      bounds( 91,  6,150, 15), text(""), align("left"), colour(0,0,0,0), fontColour(255,255,255,150), channel("stringbox1")
label      bounds(255,  3, 85, 16), text("Key Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(255, 19, 40, 27), channel("KGmin1"), range(0,127,  0,1,1)
nslider    bounds(295, 19, 40, 27), channel("KGmax1"), range(0,127,127,1,1)
label      bounds(350,  3,110, 16), text("Method"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
combobox   bounds(350, 19,110, 27), channel("Method1"), items("Percussion","Gated","Pulse"), value(1)
checkbox   bounds(465,  5, 80, 15), channel("Loop1"), text("Loop"), fontColour:0("white"), fontColour:1("white"), visible(0)
label      bounds(465, 20,100, 12), channel("RateLab1"), text("Rate"), align("centre"), colour(0,0,0,0), fontColour(200,200,200) visible(0)
hslider    bounds(465, 34,100, 12), channel("Rate1"), range(0.1,20,4,0.5), valueTextBox(1), visible(0)
button     bounds(575,  5, 55, 40), channel("Detect1"), text("Detect","Detect"), corners(5), colour:0(100,100,130), colour:1(100,100,130), latched(0)
label      bounds(635,  3, 70, 16), text("MIDI Ref."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(635, 19, 70, 27), channel("MIDIRef1"), range(0,127,60,1,0.01)
label      bounds(710,  3, 70, 16), text("Pan/Bal."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(710, 19, 70, 27), channel("Pan1"), range(-1,1,0)
label      bounds(785,  3, 85, 16), text("Bend Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(785, 19, 85, 27), channel("BendRng1"), range(-36,36,2,1,0.1)
label      bounds(875,  3, 85, 16), text("Transpose"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(875, 19, 85, 27), channel("TransRatio1"), range(0.1,24,1,1,0.01)
label      bounds(965,  3, 90, 16), text("Level"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
hslider    bounds(965, 19, 90, 27), channel("Level1"), range(0,1,1,0.5,0.01)
}

; sample 2
image      bounds(  5,165,1065, 50), colour(0,0,0,0), outlineThickness(2), outlineColour("Grey"), corners(5)
{
filebutton bounds(  5,  5, 80, 40), text("Load 2","Load 2"), fontColour("white") channel("filename2"), shape("ellipse")
soundfiler bounds( 90,  5,150, 40), channel("sample2"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label      bounds( 91,  6,150, 15), text(""), align("left"), colour(0,0,0,0), fontColour(255,255,255,150), channel("stringbox2")
label      bounds(255,  3, 85, 16), text("Key Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(255, 19, 40, 27), channel("KGmin2"), range(0,127,  0,1,1)
nslider    bounds(295, 19, 40, 27), channel("KGmax2"), range(0,127,127,1,1)
label      bounds(350,  3,110, 16), text("Method"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
combobox   bounds(350, 19,110, 27), channel("Method2"), items("Percussion","Gated","Pulse"), value(1)
checkbox   bounds(465,  5, 80, 15), channel("Loop2"), text("Loop"), fontColour:0("white"), fontColour:1("white"), visible(0)
label      bounds(465, 20,100, 12), channel("RateLab2"), text("Rate"), align("centre"), colour(0,0,0,0), fontColour(200,200,200), visible(0)
hslider    bounds(465, 34,100, 12), channel("Rate2"), range(0.1,20,4,0.5), valueTextBox(1), visible(0)
button     bounds(575,  5, 55, 40), channel("Detect2"), text("Detect","Detect"), corners(5), colour:0(100,100,130), colour:1(100,100,130), latched(0)
label      bounds(635,  3, 70, 16), text("MIDI Ref."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(635, 19, 70, 27), channel("MIDIRef2"), range(0,127,60,1,0.01)
label      bounds(710,  3, 70, 16), text("Pan/Bal."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(710, 19, 70, 27), channel("Pan2"), range(-1,1,0)
label      bounds(785,  3, 85, 16), text("Bend Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(785, 19, 90, 27), channel("BendRng2"), range(-36,36,2,1,0.1)
label      bounds(875,  3, 85, 16), text("Transpose"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(875, 19, 85, 27), channel("TransRatio2"), range(0.1,24,1,1,0.01)
label      bounds(965,  3, 90, 16), text("Level"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
hslider    bounds(965, 19, 90, 27), channel("Level2"), range(0,1,1,0.5,0.01)
}

; sample 3
image      bounds(  5,220,1065, 50), colour(0,0,0,0), outlineThickness(2), outlineColour("Grey"), corners(5)
{
filebutton bounds(  5,  5, 80, 40), text("Load 3","Load 3"), fontColour("white") channel("filename3"), shape("ellipse")
soundfiler bounds( 90,  5,150, 40), channel("sample3"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label      bounds( 91,  6,150, 15), text(""), align("left"), colour(0,0,0,0), fontColour(255,255,255,150), channel("stringbox3")
label      bounds(255,  3, 85, 16), text("Key Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(255, 19, 40, 27), channel("KGmin3"), range(0,127,  0,1,1)
nslider    bounds(295, 19, 40, 27), channel("KGmax3"), range(0,127,127,1,1)
label      bounds(350,  3,110, 16), text("Method"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
combobox   bounds(350, 19,110, 27), channel("Method3"), items("Percussion","Gated","Pulse"), value(1)
checkbox   bounds(465,  5, 80, 15), channel("Loop3"), text("Loop"), fontColour:0("white"), fontColour:1("white"), visible(0)
label      bounds(465, 20,100, 12), channel("RateLab3"), text("Rate"), align("centre"), colour(0,0,0,0), fontColour(200,200,200), visible(0)
hslider    bounds(465, 34,100, 12), channel("Rate3"), range(0.1,20,4,0.5), valueTextBox(1), visible(0)
button     bounds(575,  5, 55, 40), channel("Detect3"), text("Detect","Detect"), corners(5), colour:0(100,100,130), colour:1(100,100,130), latched(0)
label      bounds(635,  3, 70, 16), text("MIDI Ref."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(635, 19, 70, 27), channel("MIDIRef3"), range(0,127,60,1,0.01)
label      bounds(710,  3, 70, 16), text("Pan/Bal."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(710, 19, 70, 27), channel("Pan3"), range(-1,1,0)
label      bounds(785,  3, 85, 16), text("Bend Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(785, 19, 90, 27), channel("BendRng3"), range(-36,36,2,1,0.1)
label      bounds(875,  3, 85, 16), text("Transpose"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(875, 19, 85, 27), channel("TransRatio3"), range(0.1,24,1,1,0.01)
label      bounds(965,  3, 90, 16), text("Level"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
hslider    bounds(965, 19, 90, 27), channel("Level3"), range(0,1,1,0.5,0.01)
}

; sample 4
image      bounds(  5,275,1065, 50), colour(0,0,0,0), outlineThickness(2), outlineColour("Grey"), corners(5)
{
filebutton bounds(  5,  5, 80, 40), text("Load 4","Load 4"), fontColour("white") channel("filename4"), shape("ellipse")
soundfiler bounds( 90,  5,150, 40), channel("sample4"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label      bounds( 91,  6,150, 15), text(""), align("left"), colour(0,0,0,0), fontColour(255,255,255,150), channel("stringbox4")
label      bounds(255,  3, 85, 16), text("Key Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(255, 19, 40, 27), channel("KGmin4"), range(0,127,  0,1,1)
nslider    bounds(295, 19, 40, 27), channel("KGmax4"), range(0,127,127,1,1)
label      bounds(350,  3,110, 16), text("Method"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
combobox   bounds(350, 19,110, 27), channel("Method4"), items("Percussion","Gated","Pulse"), value(1)
checkbox   bounds(465,  5, 80, 15), channel("Loop4"), text("Loop"), fontColour:0("white"), fontColour:1("white"), visible(0)
label      bounds(465, 20,100, 12), channel("RateLab4"), text("Rate"), align("centre"), colour(0,0,0,0), fontColour(200,200,200), visible(0)
hslider    bounds(465, 34,100, 12), channel("Rate4"), range(0.1,20,4,0.5), valueTextBox(1), visible(0)
button     bounds(575,  5, 55, 40), channel("Detect4"), text("Detect","Detect"), corners(5), colour:0(100,100,130), colour:1(100,100,130), latched(0)
label      bounds(635,  3, 70, 16), text("MIDI Ref."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(635, 19, 70, 27), channel("MIDIRef4"), range(0,127,60,1,0.01)
label      bounds(710,  3, 70, 16), text("Pan/Bal."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(710, 19, 70, 27), channel("Pan4"), range(-1,1,0)
label      bounds(785,  3, 85, 16), text("Bend Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(785, 19, 90, 27), channel("BendRng4"), range(-36,36,2,1,0.1)
label      bounds(875,  3, 85, 16), text("Transpose"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(875, 19, 85, 27), channel("TransRatio4"), range(0.1,24,1,1,0.01)
label      bounds(965,  3, 90, 16), text("Level"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
hslider    bounds(965, 19, 90, 27), channel("Level4"), range(0,1,1,0.5,0.01)
}

; sample 5
image      bounds(  5,330,1065, 50), colour(0,0,0,0), outlineThickness(2), outlineColour("Grey"), corners(5)
{
filebutton bounds(  5,  5, 80, 40), text("Load 5","Load 5"), fontColour("white") channel("filename5"), shape("ellipse")
soundfiler bounds( 90,  5,150, 40), channel("sample5"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label      bounds( 91,  6,150, 15), text(""), align("left"), colour(0,0,0,0), fontColour(255,255,255,150), channel("stringbox5")
label      bounds(255,  3, 85, 16), text("Key Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(255, 19, 40, 27), channel("KGmin5"), range(0,127,  0,1,1)
nslider    bounds(295, 19, 40, 27), channel("KGmax5"), range(0,127,127,1,1)
label      bounds(350,  3,110, 16), text("Method"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
combobox   bounds(350, 19,110, 27), channel("Method5"), items("Percussion","Gated","Pulse"), value(1)
checkbox   bounds(465,  5, 80, 15), channel("Loop5"), text("Loop"), fontColour:0("white"), fontColour:1("white"), visible(0)
label      bounds(465, 20,100, 12), channel("RateLab5"), text("Rate"), align("centre"), colour(0,0,0,0), fontColour(200,200,200), visible(0)
hslider    bounds(465, 34,100, 12), channel("Rate5"), range(0.1,20,4,0.5), valueTextBox(1), visible(0)
button     bounds(575,  5, 55, 40), channel("Detect5"), text("Detect","Detect"), corners(5), colour:0(100,100,130), colour:1(100,100,130), latched(0)
label      bounds(635,  3, 70, 16), text("MIDI Ref."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(635, 19, 70, 27), channel("MIDIRef5"), range(0,127,60,1,0.01)
label      bounds(710,  3, 70, 16), text("Pan/Bal."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(710, 19, 70, 27), channel("Pan5"), range(-1,1,0)
label      bounds(785,  3, 85, 16), text("Bend Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(785, 19, 90, 27), channel("BendRng5"), range(-36,36,2,1,0.1)
label      bounds(875,  3, 85, 16), text("Transpose"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(875, 19, 85, 27), channel("TransRatio5"), range(0.1,24,1,1,0.01)
label      bounds(965,  3, 90, 16), text("Level"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
hslider    bounds(965, 19, 90, 27), channel("Level5"), range(0,1,1,0.5,0.01)
}

; sample 6
image      bounds(  5,385,1065, 50), colour(0,0,0,0), outlineThickness(2), outlineColour("Grey"), corners(5)
{
filebutton bounds(  5,  5, 80, 40), text("Load 6","Load 6"), fontColour("white") channel("filename6"), shape("ellipse")
soundfiler bounds( 90,  5,150, 40), channel("sample6"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label      bounds( 91,  6,150, 15), text(""), align("left"), colour(0,0,0,0), fontColour(255,255,255,150), channel("stringbox6")
label      bounds(255,  3, 85, 16), text("Key Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(255, 19, 40, 27), channel("KGmin6"), range(0,127,  0,1,1)
nslider    bounds(295, 19, 40, 27), channel("KGmax6"), range(0,127,127,1,1)
label      bounds(350,  3,110, 16), text("Method"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
combobox   bounds(350, 19,110, 27), channel("Method6"), items("Percussion","Gated","Pulse"), value(1)
checkbox   bounds(465,  5, 80, 15), channel("Loop6"), text("Loop"), fontColour:0("white"), fontColour:1("white"), visible(0)
label      bounds(465, 20,100, 12), channel("RateLab6"), text("Rate"), align("centre"), colour(0,0,0,0), fontColour(200,200,200), visible(0)
hslider    bounds(465, 34,100, 12), channel("Rate6"), range(0.1,20,4,0.5), valueTextBox(1), visible(0)
button     bounds(575,  5, 55, 40), channel("Detect6"), text("Detect","Detect"), corners(5), colour:0(100,100,130), colour:1(100,100,130), latched(0)
label      bounds(635,  3, 70, 16), text("MIDI Ref."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(635, 19, 70, 27), channel("MIDIRef6"), range(0,127,60,1,0.01)
label      bounds(710,  3, 70, 16), text("Pan/Bal."), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(710, 19, 70, 27), channel("Pan6"), range(-1,1,0)
label      bounds(785,  3, 85, 16), text("Bend Range"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(785, 19, 90, 27), channel("BendRng6"), range(-36,36,2,1,0.1)
label      bounds(875,  3, 85, 16), text("Transpose"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
nslider    bounds(875, 19, 85, 27), channel("TransRatio6"), range(0.1,24,1,1,0.01)
label      bounds(965,  3, 90, 16), text("Level"), align("centre"), colour(0,0,0,0), fontColour(200,200,200)
hslider    bounds(965, 19, 90, 27), channel("Level6"), range(0,1,1,0.5,0.01)
}


keyboard bounds(  5,440,1065, 75)

label    bounds(  5,516,120, 12), text("Iain McCurdy |2025|"), align("left"), fontColour("Silver")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -+rtmidi=NULL -M0 -dm0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  =  32
nchnls =  2
0dbfs  =  1

                   massign             0, 2
i_                 ftgen               1001,0,8,-2,1

; create empty tables
iCnt = 1
while iCnt<199 do
i_   ftgen   iCnt,0,0,2,0
iCnt +=      1
od

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

giKGs         ftgen             0, 0, 199, 2, 0
giPans        ftgen             0, 0,   8, 2, 0
giBendRngs    ftgen             0, 0,   8, 2, 0
giTransRatios ftgen             0, 0,   8, 2, 0
giLevels      ftgen             0, 0,   8, 2, 0
giLoops       ftgen             0, 0,   8, 2, 0
giRates       ftgen             0, 0,   8, 2, 0
giMIDIRefs    ftgen             0, 0,   8, 2, 0



; Smoother
; ----------------
; Smooths low resolution contiguous data with adaptive filtering.  
; Heavier filtering is applied when changes are smaller than when changes are large. This results in more succesful smoothing than can be achieved with portamento (port, portk) or the lineto opcode.
; This UDO might be useful in improving data received from 7-bit MIDI controllers.

; kout  Smoother  kin,ktime

; Performance
; -----------
; kin   -  input signal
; ktime -  time taken to reach new value
; kout  -  output value


opcode  Smoother, k, kk
 kinput,ktime   xin
 kPrevVal          init                0 
 kRamp             linseg              0,0.01,1
 ktime             =                   kRamp * divz:k(ktime,abs(kinput-kPrevVal),0.000001)
 ktrig             changed             kinput, ktime   
 if ktrig==1 then
                   reinit              RESTART
 endif
 RESTART:
 if i(ktime)==0 then
  koutput          =                   i(kinput)
 else
  koutput          linseg              i(koutput),i(ktime),i(kinput)
 endif
 rireturn
                   xout                koutput
 kPrevVal          =                   koutput
endop




instr    1 ; sense load sample buttons
 gkClearAllNotes   cabbageGetValue     "ClearAllNotes"
 ; printk2 gkClearAllNotes
 
 ; load files from browser
 #define LOAD_SAMPLE(N)
 #
 gSfilepath$N      cabbageGetValue     "filename$N"         ; read in file path string from filebutton widget
 if changed:k(gSfilepath$N)==1 then                          ; call instrument to update waveform viewer
 ;                                           p1      p2 p3        p4
                   event               "i", 100+$N, 0, ksmps/sr, $N  ; call instrument to load sample
 endif
 
                   tablew              cabbageGetValue:k("KGmin$N"), $N,     giKGs          ; keygroup limits
                   tablew              cabbageGetValue:k("KGmax$N"), $N+100, giKGs
                   tablew              cabbageGetValue:k("Pan$N"), $N,     giPans
                   tablew              cabbageGetValue:k("BendRng$N"), $N,     giBendRngs
                   tablew              cabbageGetValue:k("TransRatio$N"), $N,     giTransRatios
                   tablew              cabbageGetValue:k("Level$N"), $N,     giLevels
                   tablew              cabbageGetValue:k("Loop$N"), $N,     giLoops
                   tablew              cabbageGetValue:k("Rate$N"), $N,     giRates
                    
 ; detect pitch
 kDetect$N        cabbageGetValue       "Detect$N"
 if trigger:k(kDetect$N,0.5,0)==1 then
                   event               "i", 200, 0, 30, $N
 endif
 cabbageSetValue "MIDIRef$N", table:k($N,giMIDIRefs), changed:k(table:k($N,giMIDIRefs))
 
 ; show hide GUI elements
  kMethod$N        cabbageGetValue     "Method$N"
                   cabbageSet          changed:k(kMethod$N), "Loop$N", "visible", kMethod$N == 2 ? 1 : 0
                   cabbageSet          changed:k(kMethod$N), "RateLab$N", "visible", kMethod$N == 3 ? 1 : 0
                   cabbageSet          changed:k(kMethod$N), "Rate$N", "visible", kMethod$N == 3 ? 1 : 0
 #
 $LOAD_SAMPLE(1)
 $LOAD_SAMPLE(2)
 $LOAD_SAMPLE(3)
 $LOAD_SAMPLE(4)
 $LOAD_SAMPLE(5)
 $LOAD_SAMPLE(6)
endin


instr 2 ; read in MIDI information and trigger sounding notes
 iTuning           cabbageGetValue     "Tuning"
 icps              cpstmid             giTTable1 + iTuning - 1    

 inum              notnum
                   cabbageSetValue     "LastNoteNumber", inum
 iamp              veloc               1 - cabbageGetValue:i("Vel"), 1
 inum              notnum

 kPBend            pchbend             0, table:i(p4,giBendRngs)
 
 if cabbageGetValue:i("RefTone")==1 then
  aRef             poscil              0.2,icps
                   outall              aRef * linsegr:k(0,0.05,1,0.05,0)
 endif
 
 ; SAMPLES
 #define SAMPLE_PLAYER(N)
 #
 imlt$N            =                   (icps*cabbageGetValue:i("TransRatio$N")) / cpsmidinn(cabbageGetValue:i("MIDIRef$N"))
 iMethod$N  cabbageGetValue  "Method$N"
 iDur              =                   ftlen($N)/ftsr($N)
 if inum>=table:i($N,giKGs) && inum<=table:i($N+100,giKGs) && ftlen($N)>0 then
  if iMethod$N==1 then ; Percussion sample playback
   ;                                   p1      p2 p3           p4  p5      p6
                   event_i "i",        p1 + 1, 0, iDur/imlt$N, $N, imlt$N, iamp
  elseif iMethod$N==2 then ; gated sample playback
   aL,aR           subinstr            p1 + 2, $N, imlt$N, iamp
                   outs                aL, aR
  else ; pulse
   ;                                                                       p1      p2 p3           p4  p5      p6
                   schedkwhen          metro:k(table:k($N,giRates)), 0, 0, p1 + 1, 0, iDur/imlt$N, $N, imlt$N, iamp
  endif
 endif
 #
 $SAMPLE_PLAYER(1)
 $SAMPLE_PLAYER(2)
 $SAMPLE_PLAYER(3)
 $SAMPLE_PLAYER(4)
 $SAMPLE_PLAYER(5)
 $SAMPLE_PLAYER(6)
 
endin


instr 3 ; play sample using percussion method
 if trigger:k(gkClearAllNotes,0.5,0)==1 then ; clear-all-notes instruction
                   turnoff
 endif

 ifn               =                   p4
 imlt              =                   p5
 iamp              =                   p6
 kPtr              init                0
 aPtr              interp              kPtr
 aL                table3              aPtr, ifn      
 aR                table3              aPtr, ifn + 100
 kPBend            pchbend             0, table:i(p4,giBendRngs)
 kPBend            Smoother            kPBend, 0.1
 kPtr              +=                  ksmps * ((ftsr(p4))/sr) * imlt * semitone(kPBend)
 
 iAAtt             cabbageGetValue     "AAtt"
 if iAAtt>0 then
  aAtt             expseg              0.01, iAAtt/imlt, 1,1,1
 else
  aAtt             =                   1
 endif
 
 aL                zdf_2pole           aL*iamp, cpsoct(4 + 10*iamp) * aAtt, 0.5
 aR                zdf_2pole           aR*iamp, cpsoct(4 + 10*iamp) * aAtt, 0.5
 
 iJit              cabbageGetValue     "Jit"
 if iJit>0 then
  iRandDel         random              ksmps/sr, 0.001
  aL2              delay               aL, iRandDel 
  aR2              delay               aR, iRandDel 
  aL               =                   delay:a(aL,ksmps/sr) - (aL2 * iJit)
  aR               =                   delay:a(aR,ksmps/sr) - (aR2 * iJit)
 endif
 iPan              =                   (table:i(p4, giPans) + 1) * 0.5
 iLevel            =                   table:i(p4, giLevels)
                   outs                aL * (1-iPan) * aAtt * iLevel, aR * iPan * aAtt * iLevel
endin


instr 4 ; play envelope-gated sample
 ifn               =                   p4
 imlt              =                   p5
 iamp              =                   p6
 kPtr              init                0
 aPtr              interp              kPtr
 aL                table3              aPtr, ifn     
 aR                table3              aPtr, ifn + 100
 kPBend            pchbend             0, table:i(p4,giBendRngs)
 kPBend            Smoother            kPBend, 0.1
 if table:i(p4,giLoops)==0 then
  kPtr              +=                  ksmps * ((ftsr(ifn))/sr) * imlt * semitone(kPBend)
 else
  kPtr              wrap                kPtr + (ksmps * ((ftsr(ifn))/sr) * imlt * semitone(kPBend)), 0, ftlen(ifn)
 endif
 
 iJit              cabbageGetValue     "Jit"
 if iJit>0 then
  iRandDel         random              ksmps/sr, 0.001
  aL2              delay               aL, iRandDel 
  aR2              delay               aR, iRandDel 
  aL               =                   delay:a(aL,ksmps/sr) - (aL2 * iJit)
  aR               =                   delay:a(aR,ksmps/sr) - (aR2 * iJit)
 endif 

 iAAtt             cabbageGetValue     "AAtt"
 iADec             cabbageGetValue     "ADec"
 iASus             cabbageGetValue     "ASus"
 iARel             cabbageGetValue     "ARel"
 iCurve            =                   4
 aEnv              transegr            0, (1/kr) + (iAAtt/imlt), iCurve, 1, (1/kr) + (iADec/imlt), -iCurve, iASus, (1/kr) + (iARel/imlt), -iCurve, 0.01
 
 aL                zdf_2pole           aL*iamp, cpsoct(4 + 10*iamp) * aEnv, 0.5
 aR                zdf_2pole           aR*iamp, cpsoct(4 + 10*iamp) * aEnv, 0.5
  
 aL                *=                  aEnv
 aR                *=                  aEnv
 iPan              =                   (table:i(p4, giPans) + 1) * 0.5
 iLevel            =                   table:i(p4, giLevels)
                   outs                aL * (1-iPan) * iLevel, aR * iPan * iLevel
endin



#define LOAD_SAMPLE(N)
#
instr    10$N
 gichans           filenchnls          gSfilepath$N                    ; derive the number of channels (mono=1,stereo=2) in the sound file
 i_                ftgen               p4,0,0,-1,gSfilepath$N,0,0,1
 i_                ftgen               p4+100,0,0,-1,gSfilepath$N,0,0,gichans
 giReady           =                   1                              ; if no string has yet been loaded giReady will be zero
                   cabbageSet          "sample$N", "file", gSfilepath$N

 ; write file name to GUI
 SFileNoExtension  cabbageGetFileNoExtension gSfilepath$N
                   cabbageSet          "stringbox$N", "text", SFileNoExtension
endin
#
$LOAD_SAMPLE(1)
$LOAD_SAMPLE(2)
$LOAD_SAMPLE(3)
$LOAD_SAMPLE(4)
$LOAD_SAMPLE(5)
$LOAD_SAMPLE(6)



 instr 200 ; detect pitch of sample and send to MIDI reference
  aL             table3             line:a(0,sr/ftsr(p4),sr), p4
  kcps, krms     pitchamdf  aL, 20, 5000
  if timeinsts:k() >= cabbageGetValue:i("DetTim") then
   printk2 kcps
   kNote         =                  ftom:k(kcps)
                 tablew             kNote, p4, giMIDIRefs
                 turnoff
  endif
 endin



</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>