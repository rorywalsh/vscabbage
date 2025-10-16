    
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


filebutton bounds(  5,  5, 80, 40), text("Directory","Directory"), fontColour("white") channel("dir"), shape("ellipse")

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





instr    1

gSBrowseFile      cabbageGetValue     "dir"         ; read in file path string from filebutton widget

if changed:k(gSBrowseFile)==1 then
 event "i", 2, 0, 0
endif
;if changed:k(gSfilepath)==1 then
 
; printks gSfilepath, 1
;endif


;SFiles[] directory gSfilepath, ".wav"


endin

instr 2
gSFilePath cabbageGetFilePath gSBrowseFile
gSFiles[] directory gSFilePath, ".wav"
prints gSFilePath
prints gSFiles[6]
event_i "i", 3, 0, 300
endin

instr 3
;print p3
a1 diskin2 gSFiles[0],1,0,1
;a1 poscil 0.1,440
  outs a1,a1
endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>