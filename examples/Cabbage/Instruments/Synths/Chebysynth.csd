/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Chebysynth
; Written by Iain McCurdy, 2024

; An oscillator is passed through a Chebyshev polynomial (of the first kind) with up to 64 terms.
; Typically the oscillator used as input is sinusoidal and of unity amplitude, at least in order to produce a simple harmonic output.
; Reducing the amplitude of this oscillator below 1 and even altering its waveform can produce a range of interesting timbres and that is what this instrument explore.

; The same approach can be used with a simple polynomial with slightly different timbral results and this option is offered also.

; The strength of waveshaping is that the brightness of the resulting timbre can be varied easily by varying the amplitude of the input oscillator.
;  For this reason, this example offers a number of ways of modulating the amplitude of the input oscillator.
; 1. Offset        - a dial which facilitates manual control of the input oscillator's amplitude
; 2. Envelope      - shapes timbre across the duration of the note. Master control over the envelope's impact in the MIXER section.
; 3. Modulation    - options for LFOs and a randomly wandering offset.
; 4. Velocity       - MIDI key velocity
; 5. Kybd. Scaling - attenuates the input oscillator's amplitude across the note range. It can be advisable to attenuate the 

; A couple of things worthy of note however are that the partials do not begin in phase and their evolution as the amplitude of the input oscillator increases is not linear.
; In conclusion then, these features of waveshaping need to be accepted in conjunction with its efficiency and compactness.

; C O E F F I C I E N T S
; Click and drag directly onto this graph to create values for the first 64 coefficients used by polynomial or chebyshevpoly
; Coefficients 1 to n control harmonic partials corresponding to those indices when using chebyshevpoly and if the amplitude of the input is unity (and a sine wave)
; Coefficient 0 controls DC offset with both opcodes.

; C O N T R O L
; Method         -  choose between polynomial and chebyshevpoly as waveshapign methods
; DC Block       -  Can be activated to remove DC offset in the output waveform.
;                    This offset can be observed in the oscilloscope.
; LEGATO         -  turns on monophonic legato mode (and the corresponding 'Time' dial)
; Time           -  portamento time between notes in LEGATO mode.


; I N P U T   W A V E F O R M
; The partial strengths of the first 8 harmonic partials of the input oscillator are controllable with the 8 mini vertical sliders.
; The numbers beneath each slider that specify its harmonic partial number are number-boxes and can be edited from 1 to 99. 
; The resulting waveform is displayed.
; Scl            -  controls the Y-axis gain on the waveform viewer.

; E N V E L O P E
; An envelope that is applied the the amplitude of the input oscillator when notes are triggered from the MIDI keyboard
; Attack         -  attack time in seconds
; Decay          -  decay time in seconds
; Lev. 2         -  level reach after the decay time
; Dur. 2         -  duration to reach the sustain portion
; Sustain        -  sustain level
; Release        -  release time in seconds
; Envelope durations are scaled according to note frequency such that lower note envelope will last longer than higher notes.

; M O D U L A T I O N
; An LFO with a range of shapes which can be applied to the input oscillator amplitude. 
;  The amount of its impact is controlled by the 'Modulation' dial int he MIXER section.
; Mode selector - Off, Sine, Saw, Square, Random
; Rate          - rate of modulation
; Init. Phase   - initial phase of the LFO when triggered by a note (Sine and Saw modes only).

; M I X E R
; Offset           - manual control of the input oscillator's amplitude
; Env. Amt.        - amount of envelope influence on the input oscillator's amplitude
; Modulation       - amount of modulation LFO's influence on the input oscillator's amplitude
; Velocity         - amount of influence of MIDI velocity on the input oscillator's amplitude
; Keyboard Scaling - scaling of input amplitude according to a graph with low notes at the left and high notes to the right
; Output Gain    -  Gain applied to the output audio signal (active with or without MIDI keyboard input)

; V I B R A T O
; Controls for an LFO which modulates the pitch of the input oscillator.
; Del              - time before which the vibrato envelope rises
; Rise             - time across which the vibrato rises from none to its maximum level
; Amount           - maximum level of vibrato (in semitones displacement
; Rate             - rate of vibrato
; Vibrato depth can also be controlled using the modulation wheel on a MIDI keyboard
; The instrument also responds to the pitch bend wheel +/- 2 semitones

; O S C I L L O S C O P E
; An oscilloscope that views the output waveform (can be turned on and off to save CPU resources).
; GAIN           -  Y-axis gain of oscilloscope viewer.
; PERIOD         -  update period used by the oscilloscope

; S P E C T R O S C O P E
; An spectroscope that views the output waveform (can be turned on and off to save CPU resources).
; GAIN           -  Y-axis gain of spectroscope viewer.
; Zoom           -  zooms horizontally into the spectrum

; NOTE THAT WAVESHAPING CAN PRODUCE HIGH-AMPLITUDE, BRIGHT, UNPREDICTABLE AND EXPLOSVE WAVEFORMS. 
; PROTECT YOUR EARS AND SPEAKERS BY MAKING CAREFUL USE OF THE INPUT AND OUTPUT GAIN CONTROLS.

; EFFECTS
; A series of three effects - chorus, delay, reverb - are provided for sound enhancement.
; The sound is monophonic until the effects are engaged.
; The signal used by the oscilloscope and spectrogram are tapped before the effects.	

<Cabbage>
form caption("Chebysynth"), size(1100, 695), guiMode("queue"), colour(40,40,43) pluginId("chby")

; coefficients
image         bounds( 10, 10,1080,120), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(4)
{
gentable      bounds(  2,  2,1076,103), channel("coefficients"), tableNumber(1), tableColour(255,150,150), fill(0), ampRange(0,1,1), active(1), outlineThickness(2)
label         bounds(  2,  4,1076, 16), text("C O E F F I C E N T S"), align("centre")
}

; main controls
image     bounds( 10,140,285,110), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(4)
{
label     bounds(  0,  4,285, 16), text("C O N T R O L"), align("centre")
label     bounds( 15, 25,120, 14), text("Method"), align("centre")
combobox  bounds( 15, 36,120, 25), channel("type"), items("polynomial","chebyshevpoly"), value(2), align("centre")
checkbox  bounds( 15, 75,120, 12), text("DC Block"), channel("DCBlock"), fontColour:0("white"), fontColour:1("white"), colour:0(0,100,00), colour:1(50,255,50), value(1) 
button    bounds(145, 55, 60, 15), channel("monophonic"), text("LEGATO","LEGATO"), latched(1), colour:0( 0,80,0), colour:1(75,255,75) fontColour:0(20,20,20), fontColour:1(0,100,0)
rslider   bounds(205, 25, 70, 80), channel("LegTime"), range(0.01,1,0.05,0.5), text("Time"), valueTextBox(1), active(0), alpha(0.3)
;button    bounds(135, 85, 80, 15), text("RESET COEFFS","RESET COEFFS"), channel("ResetCoeffs"), latched(0) ;; resetting table can't overwrite internal state
}

image     bounds(305,140,345,110), colour(0,0,0,0), outlineThickness(1)
{
label     bounds(  0,  4,345,  16), text("I N P U T   W A V E F O R M"), align("centre")
vslider   bounds( 10, 25, 20,  72), channel("P1"), range(0,1,0.58,0.5);, text("1")
vslider   bounds( 30, 25, 20,  72), channel("P2"), range(0,1,0,0.5);, text("2")
vslider   bounds( 50, 25, 20,  72), channel("P3"), range(0,1,0,0.5);, text("3")
vslider   bounds( 70, 25, 20,  72), channel("P4"), range(0,1,0,0.5);, text("4")
vslider   bounds( 90, 25, 20,  72), channel("P5"), range(0,1,0,0.5);, text("5")
vslider   bounds(110, 25, 20,  72), channel("P6"), range(0,1,0.15,0.5);, text("6")
vslider   bounds(130, 25, 20,  72), channel("P7"), range(0,1,0.08,0.5);, text("7")
vslider   bounds(150, 25, 20,  72), channel("P8"), range(0,1,0.02,0.5);, text("8")

nslider   bounds( 10, 90, 20,  20), channel("PN1"), range(1,99,1,1,1)
nslider   bounds( 30, 90, 20,  20), channel("PN2"), range(1,99,2,1,1)
nslider   bounds( 50, 90, 20,  20), channel("PN3"), range(1,99,3,1,1)
nslider   bounds( 70, 90, 20,  20), channel("PN4"), range(1,99,4,1,1)
nslider   bounds( 90, 90, 20,  20), channel("PN5"), range(1,99,5,1,1)
nslider   bounds(110, 90, 20,  20), channel("PN6"), range(1,99,13,1,1)
nslider   bounds(130, 90, 20,  20), channel("PN7"), range(1,99,19,1,1)
nslider   bounds(150, 90, 20,  20), channel("PN8"), range(1,99,57,1,1)

gentable  bounds(180, 25,120,  80), channel("InputWF"), tableNumber(2), tableColour(255,255,150), fill(0), ampRange(-4,4,2), active(1), outlineThickness(2)
image     bounds(180, 65,120,  1), colour(255,255,255,200) ; x axis
vslider   bounds(310, 25, 30,  80), channel("IPGraphGain"), text("Scl"), range(0.1, 1, 0.7)
}

; envelope
image     bounds(660,140,430,110), colour(0,0,0,0), outlineThickness(1)
{
label     bounds(  0,  4,430,  16), text("E N V E L O P E"), align("centre")
checkbox  bounds(325, 10,120, 12), text("Kydb. Scale"), channel("EnvKybdScl"), fontColour:0("white"), fontColour:1("white"), colour:0(0,100,00), colour:1(50,255,50), value(1) 
rslider   bounds(  5, 25, 70, 80), channel("Att"), text("Attack"), range(0,12,0.00,0.5), valueTextBox(1)
rslider   bounds( 75, 25, 70, 80), channel("Dec"), text("Decay"), range(0,12,1.144,0.5), valueTextBox(1)
rslider   bounds(145, 25, 70, 80), channel("Lev2"), text("Lev.2"), range(0,1,0.25), valueTextBox(1)
rslider   bounds(215, 25, 70, 80), channel("Dur2"), text("Dur.2"), range(0,12,3,0.5), valueTextBox(1)
rslider   bounds(285, 25, 70, 80), channel("Sus"), text("Sustain"), range(0,1,0.0), valueTextBox(1)
rslider   bounds(355, 25, 70, 80), channel("Rel"), text("Release"), range(0,12,3,0.5), valueTextBox(1)
}

; modulation
image     bounds( 10,260,235,110), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(4)
{
 label     bounds(  0,  4,235,  16), text("M O D U L A T I O N"), align("centre")
 checkbox bounds( 20, 30, 80, 12), channel("ModOff1"), radioGroup(1), value(1), text("Off")
 checkbox bounds( 20, 45, 80, 12), channel("ModSine"), radioGroup(1), value(0), text("Sine")
 checkbox bounds( 20, 60, 80, 12), channel("ModSaw"), radioGroup(1), value(0), text("Saw")
 checkbox bounds( 20, 75, 80, 12), channel("ModSqu"), radioGroup(1), value(0), text("Square")
 checkbox bounds( 20, 90, 80, 12), channel("ModRand"), radioGroup(1), value(0), text("Random")
 rslider  bounds( 90, 25, 70, 80), channel("ModRate"), range(0.001,30,1,0.5), text("Rate"), valueTextBox(1)
 rslider  bounds(160, 25, 70, 80), channel("InitPhase"), range(0,360,270,1,1), text("Init. Phase"), valueTextBox(1)
}

; mixer
image     bounds(255,260,495,110), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(4)
{
 label    bounds(  0,  4,495,  16), text("M I X E R"), align("centre")
 rslider  bounds(  5, 25, 70, 80), channel("InGain"), text("Offset"), range(0,1,0), valueTextBox(1)
 rslider  bounds( 75, 25, 70, 80), channel("EnvAmt"), text("Env.Amt."), range(0,1,0.6), valueTextBox(1)
 rslider  bounds(145, 25, 70, 80), channel("ModAmp"), range(0,1,0.5), text("Modulation"), valueTextBox(1)
 rslider  bounds(215, 25, 70, 80), channel("VelAmp"), range(0,1,1), text("Velocity"), valueTextBox(1)
 
 label     bounds(290, 25,120,  13), text("Keyboard Scaling"), align("centre")
 gentable  bounds(290, 45,120,  55), channel("KybdScl"), tableNumber(3), tableColour(255,255,150), tableBackgroundColour(15,15,15), fill(0), ampRange(0,1,3), active(1), outlineThickness(2)

 rslider   bounds(420, 25, 70, 80), channel("OutGain"), text("Output Gain"), range(0,1,0.5,0.5), valueTextBox(1)
}

; vibrato
image     bounds(760,260,330,110), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(4)
{
 label    bounds(  0,  4,330,  16), text("V I B R A T O"), align("centre")
 rslider  bounds( 25, 25, 70, 80), channel("VibDel"), text("Del"), range(0,5,0.5), valueTextBox(1)
 rslider  bounds( 95, 25, 70, 80), channel("VibRise"), text("Rise"), range(0,5,2), valueTextBox(1)
 rslider  bounds(165, 25, 70, 80), channel("VibAmp"), text("Amount"), range(0,1,0.626), valueTextBox(1)
 rslider  bounds(235, 25, 70, 80), channel("VibRate"), text("Rate"), range(0.1,30,5,0.5), valueTextBox(1)
} 
 

image         bounds( 10,380,535,124), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(4)
{
image         bounds(  0,  0,474,124), colour("silver"), corners(4)
signaldisplay bounds(  2,  2,470,120), colour(150,255,150), outlineThickness(2), zoom(-1), alpha(0.85), displayType("waveform"), backgroundColour("Black"), signalVariable("aOsc"), channel("display")
label         bounds(  0,  4,470, 16), text("O S C I L L O S C O P E"), align("centre")
image         bounds(  0, 62,471,  1), colour(255,255,255,200) ; x axis
checkbox      bounds(  4,  4, 15, 15), channel("OscOnOff"), value(1), corners(0), colour:0(0,100,00), colour:1(50,255,50)
rslider       bounds(480,  5, 50, 50), channel("OscGain"), text("GAIN"), range(0,5,0.75,0.5)
rslider       bounds(480, 65, 50, 50), channel("OscPer"), text("PERIOD"), range(0.001,0.1,0.05,1,0.001)
}

image         bounds(555,380,535,124), colour(0,0,0,0), outlineThickness(3), outlineColour("silver"), corners(4)
{
image         bounds(  0,  0,474,124), colour("silver"), corners(4)
signaldisplay bounds(  2,  2,470,120), alpha(1), displayType("spectroscope"), zoom(-1), signalVariable("aSpec"), channel("sscope"), colour("LightBlue"), backgroundColour(20,20,20), fontColour(0,0,0,0)
label         bounds(  0,  4,470, 16), text("S P E C T R O S C O P E"), align("centre")
checkbox      bounds(  4,  4, 15, 15), channel("SpecOnOff"), value(1), corners(0), colour:0(0,100,00), colour:1(50,255,50)
rslider       bounds(480,  5, 50, 50), channel("SpecGain"), text("GAIN"), range(0,20,3,0.5)
rslider       bounds(480, 65, 50, 50), channel("SpecZoom"), text("ZOOM"), range(1,30,4,1,1)
}

image   bounds( 10,515,1080, 65) colour(0,0,0,0) outlineThickness(1)
{
label    bounds(  0,  3,1080, 13) text("E F F E C T S") align("centre")
button   bounds( 13, 25,345, 30), channel("Chorus") text("Chorus","Chorus"), latched(1), colour:0(50,50,50), colour:1(250,250, 50) fontColour:0(100,100,100) fontColour:1(0,0,0), corners(5), value(1)
button   bounds(368, 25,345, 30), channel("Delay") text("Delay","Delay"), latched(1),    colour:0(50,50,50), colour:1(250,250, 50) fontColour:0(100,100,100) fontColour:1(0,0,0), corners(5)
button   bounds(723, 25,345, 30), channel("Reverb") text("Reverb","Reverb"), latched(1), colour:0(50,50,50), colour:1(250,250, 50) fontColour:0(100,100,100) fontColour:1(0,0,0), corners(5), value(1)
}

keyboard     bounds( 10,590,1080, 90)

label    bounds( 10,682,110, 12), text("Iain McCurdy |2024|"), align("left"), fontColour("white")

</Cabbage>                                                   
                    
<CsoundSynthesizer>                                                                                                 

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0 --displays
</CsOptions>
                                  
<CsInstruments>

; sr set by host
ksmps              =                   16
nchnls             =                   2
0dbfs              =                   1

                   massign             0, 2

; function table containing coefficient magnitudes
giTF               ftgen               1, 0,  64, -2,  0, 1, .9, .8, .7, .6, .5, .4, .3, .2, .1, .2, .3, .4, .3, .2, .1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.2, 0.3, 0.2, 0.1, 0.05, 0.05, 0.1, 0.15, 0.2, 0.1, 0.05, 0.05, 0.15, 0.2, 0.05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0

giReset            ftgen               0, 0,  64, -2,  0

; function table containing partial magnitudes of harmonic input waveform
giFn               ftgen               2, 0, 4097, 10, 1

; for scaling of input oscillator amplitude based on MIDI note played. This table is editable from the GUI.
giKybdScl          ftgen               3, 0, 128, -7, 1, 128, 0.2

; velocity scaling transfer function
giVelScl           ftgen               0, 0, 128, 16, 0, 128, 4, 1

giSawExp           ftgen               0, 0, 4096, 16, 1, 4096, -4, -1
giSqu              ftgen               0, 0, 4096, -7, 1, 2048, 1, 0, -1, 2048, -1


initc7 1,1,1

instr 1 ; create coefficients table
; create labels for each coefficients
 iGraphBounds[]    cabbageGet          "coefficients", "bounds" ; get coefficients graph bounds from GUI
 iGraphX           =                   iGraphBounds[0]
 iGraphY           =                   iGraphBounds[1]
 iGraphWid         =                   iGraphBounds[2]
 iGraphHei         =                   iGraphBounds[3]
 iNCoeffs          =                   ftlen(giTF)
 iCount            =                   0
 while iCount < iNCoeffs do
  SWidget          sprintf             "bounds(%d,117,%d,10), channel(\"label%d\"), text(%d), align(\"centre\")", 10 + iGraphX + (iCount * iGraphWid/(iNCoeffs)), iGraphWid/iNCoeffs, iCount, iCount
                   cabbageCreate       "label", SWidget
 iCount            +=                  1
 od
 
 ; create input oscillator waveform
 kIPGraphGain      =                   1 / cabbageGetValue:k("IPGraphGain") ; reciprocal of widget output
 kP1               cabbageGetValue     "P1"
 kP2               cabbageGetValue     "P2"
 kP3               cabbageGetValue     "P3"
 kP4               cabbageGetValue     "P4"
 kP5               cabbageGetValue     "P5"
 kP6               cabbageGetValue     "P6"
 kP7               cabbageGetValue     "P7"
 kP8               cabbageGetValue     "P8"
 
 kPN1              cabbageGetValue     "PN1"
 kPN2              cabbageGetValue     "PN2"
 kPN3              cabbageGetValue     "PN3"
 kPN4              cabbageGetValue     "PN4"
 kPN5              cabbageGetValue     "PN5"
 kPN6              cabbageGetValue     "PN6"
 kPN7              cabbageGetValue     "PN7"
 kPN8              cabbageGetValue     "PN8"
  
 if changed:k(kP1,kP2,kP3,kP4,kP5,kP6,kP7,kP8,kPN1,kPN2,kPN3,kPN4,kPN5,kPN6,kPN7,kPN8,kIPGraphGain)==1 then
  reinit REBUILD_SOURCE_WAVEFORM
 endif
 REBUILD_SOURCE_WAVEFORM:
 i_                ftgen               giFn, 0, ftlen(giFn), -9, i(kPN1),i(kP1),0, i(kPN2),i(kP2),0, i(kPN3),i(kP3),0, i(kPN4),i(kP4),0, i(kPN5),i(kP5),0, i(kPN6),i(kP6),0, i(kPN7),i(kP7),0, i(kPN8),i(kP8),0
                   cabbageSet          "InputWF","tableNumber",giFn
                   cabbageSet          "InputWF","ampRange",-i(kIPGraphGain), i(kIPGraphGain), giFn
 rireturn
 
 
 kResetCoeffs  cabbageGetValue "ResetCoeffs"
 if trigger:k(kResetCoeffs,0.5,0)==1 then
  tablecopy giTF, giReset
  cabbageSet 1,"coefficients","tableNumber",giTF
 endif

 ; show/hide legato time slider
 kmonophonic  cabbageGetValue "monophonic"
              cabbageSet      changed:k(kmonophonic), "LegTime", "alpha", 0.3 + kmonophonic*0.7
              cabbageSet      changed:k(kmonophonic), "LegTime", "active", kmonophonic
endin

instr 2 ; receives MIDI, trigger sounding instrument
 iNote             notnum
 gkNote            =                   iNote                          ; global note will always be the last played in the stack
 iCPS              cpsmidi
 iVel              veloc               0, 1
 
 ; pitch bend
 kPBend            pchbend             0, 2
 kRamp             linseg              0,0.001,0.02
 gkPBend           portk               kPBend, kRamp
 
 ; modulation wheel
 kModWheel         ctrl7               1,1,0,1
 gkModWheel        portk               kModWheel, kRamp
 
 gimonophonic      cabbageGetValue     "monophonic"

 if gimonophonic==0 then                                              ; polyphonic
  aL,aR            subinstr            p1 + 1, iNote, iVel
                   outs                aL, aR
 else                                                                 ; monophonic
  iNumNotes        active              p1                             ; outputs the number of notes currently being played by instr 1. i.e. if this is the first note, iNumNotes = 1
  if iNumNotes==1 then                                                ; if this is the first note...
                   event_i             "i", p1+1, 0, -1, iNote, iVel  ; event_i creates a score event at i-time. p3 = -1 means a 'held' note.
  endif
 endif



endin

instr    3 ; sounding instrument

 kNumNotes         active              p1 - 1           ; outputs the number of notes currently being played by instr 1. Notice that this time it is k-rate.
 if kNumNotes==0 then
                   turnoff                              ; 'turnoff' turns off this note. It will allow release envelopes to complete, thereby preventing clicks.
 endif

 if gimonophonic==1 then                                ; if monophonic...
  
  kRelease         release                              ; this creates a release flag indicator as to whether this note is in it release stage or not. 0 = sustain, 1 = release
  
  kRamp            linseg              0, 0.01, 1
  if kRelease==0 then                                   ; only update note while in the sustain portion of the note
   kLegTime        cabbageGetValue     "LegTime"
   kNote           portk               gkNote, kRamp * kLegTime
  endif
  kFrq            =                   cpsmidinn(kNote)
 else                                                   ; polyphonic
  kFrq            =                   cpsmidinn(p4)
 endif

  iVel             =                   p5

 kInGain           cabbageGetValue     "InGain"
 kPortTime         linseg              0, 0.001, 0.05
 kInGain           portk               kInGain, kPortTime


; envelope
giAtt              cabbageGetValue     "Att"
iDec               cabbageGetValue     "Dec"
iLev2              cabbageGetValue     "Lev2"
iDur2              cabbageGetValue     "Dur2"
iSus               cabbageGetValue     "Sus"
giRel              cabbageGetValue     "Rel"

iOS                =                   1/kr
iEnvKybdScl        cabbageGetValue     "EnvKybdScl"
if iEnvKybdScl==1 then
 iDurScl            =                   cpsoct(8) / cpsmidinn(p4)
else
 iDurScl            =                   1
endif

aEnv               expsegr             0.01,  iOS+(giAtt*iDurScl),  1.01, iOS+(iDec*iDurScl), iLev2+0.01, iOS+(iDur2*iDurScl), iSus+0.01, iOS+(giRel*iDurScl), 0.01
aEnv               -=                  0.01
iEnvAmt            cabbageGetValue     "EnvAmt"
aAmp               =                   a(kInGain) + (aEnv * iEnvAmt) ;- iEnvAmt ; + iVel^2 ;

; modulation
kModOff1           cabbageGetValue     "ModOff1"
kModSine           cabbageGetValue     "ModSine"
kModSaw            cabbageGetValue     "ModSaw"
kModSqu            cabbageGetValue     "ModSqu"
kModRand           cabbageGetValue     "ModRand"
kModAmp            cabbageGetValue     "ModAmp"
kModRate           cabbageGetValue     "ModRate"
iInitPhase         cabbageGetValue     "InitPhase"
if kModSine==1 then
 aMod               poscil              kModAmp, kModRate, -1, iInitPhase/360
 aAmp               *=                  1 - ((aMod + kModAmp) * 0.5)
elseif kModSaw==1 then
 aMod               poscil              -kModAmp, kModRate, giSawExp, iInitPhase/360
 aMod               tone                aMod, 100
 aAmp               *=                  (1 - (aMod * 0.5)) ^ 2
elseif kModSqu==1 then
 aMod               poscil              -kModAmp, kModRate, giSqu, iInitPhase/360
 aMod               tone                aMod, 100
 aAmp               *=                  1 - ((aMod + kModAmp) * 0.5)
elseif kModRand==1 then
 aMod               jspline             kModAmp, kModRate, kModRate*4
 aAmp               *=                  1 - (aMod * 0.5)
endif

 ; keyboard scaling
 iKybdScl          table                p4, giKybdScl
 aAmp              *=                   iKybdScl

 ; velocity
 kVelAmp           cabbageGetValue      "VelAmp"
 aAmp              *=                   (table:i(iVel,giVelScl,1) * kVelAmp) + (1 - kVelAmp) 

; protect against amplitudes greater than 1
aAmp               limit               aAmp, 0, 1

; vibrato
 iVibDel           cabbageGetValue     "VibDel"
 iVibRise          cabbageGetValue     "VibRise"
 iVibAmp           cabbageGetValue     "VibAmp"
 kVibRate          cabbageGetValue     "VibRate"
 kVibEnv           linseg              0, 1/kr + iVibDel, 0, 1/kr + iVibRise, iVibAmp
 kVib              oscil               kVibEnv, kVibRate
 kFrq              *=                  semitone(kVib*gkModWheel)

 ; pitch bend
 kFrq              *=                  semitone(gkPBend)

; input oscillator
aIn                poscil              aAmp, a(kFrq), giFn

ktype              cabbageGetValue     "type"
if ktype==1 then
aOut               polynomial          aIn, tab:k(0,1), tab:k(1,1), tab:k(2,1), tab:k(3,1), tab:k(4,1), tab:k(5,1), tab:k(6,1), tab:k(7,1), tab:k(8,1), tab:k(9,1), \
                                            tab:k(10,1), tab:k(11,1), tab:k(12,1), tab:k(13,1), tab:k(14,1), tab:k(15,1), tab:k(16,1), tab:k(17,1), tab:k(18,1), tab:k(19,1), \
                                            tab:k(20,1), tab:k(21,1), tab:k(22,1), tab:k(23,1), tab:k(24,1), tab:k(25,1), tab:k(26,1), tab:k(27,1), tab:k(28,1), tab:k(29,1), \
                                            tab:k(30,1), tab:k(31,1), tab:k(32,1), tab:k(33,1), tab:k(34,1), tab:k(35,1), tab:k(36,1), tab:k(37,1), tab:k(38,1), tab:k(39,1), \
                                            tab:k(40,1), tab:k(41,1), tab:k(42,1), tab:k(43,1), tab:k(44,1), tab:k(45,1), tab:k(46,1), tab:k(47,1), tab:k(48,1), tab:k(49,1), \
                                            tab:k(50,1), tab:k(51,1), tab:k(52,1), tab:k(53,1), tab:k(54,1), tab:k(55,1), tab:k(56,1), tab:k(57,1), tab:k(58,1), tab:k(59,1), \
                                            tab:k(60,1), tab:k(61,1), tab:k(62,1), tab:k(63,1)

else
aOut               chebyshevpoly       aIn, tab:k(0,1), tab:k(1,1), tab:k(2,1), tab:k(3,1), tab:k(4,1), tab:k(5,1), tab:k(6,1), tab:k(7,1), tab:k(8,1), tab:k(9,1), \
                                            tab:k(10,1), tab:k(11,1), tab:k(12,1), tab:k(13,1), tab:k(14,1), tab:k(15,1), tab:k(16,1), tab:k(17,1), tab:k(18,1), tab:k(19,1), \
                                            tab:k(20,1), tab:k(21,1), tab:k(22,1), tab:k(23,1), tab:k(24,1), tab:k(25,1), tab:k(26,1), tab:k(27,1), tab:k(28,1), tab:k(29,1), \
                                            tab:k(30,1), tab:k(31,1), tab:k(32,1), tab:k(33,1), tab:k(34,1), tab:k(35,1), tab:k(36,1), tab:k(37,1), tab:k(38,1), tab:k(39,1), \
                                            tab:k(40,1), tab:k(41,1), tab:k(42,1), tab:k(43,1), tab:k(44,1), tab:k(45,1), tab:k(46,1), tab:k(47,1), tab:k(48,1), tab:k(49,1), \
                                            tab:k(50,1), tab:k(51,1), tab:k(52,1), tab:k(53,1), tab:k(54,1), tab:k(55,1), tab:k(56,1), tab:k(57,1), tab:k(58,1), tab:k(59,1), \
                                            tab:k(60,1), tab:k(61,1), tab:k(62,1), tab:k(63,1)
endif

aAmpEnv            linsegr             0, giAtt+0.001, 1, giRel+0.001, 0
aOut               *=                  aAmpEnv

if cabbageGetValue:k("DCBlock")==1 then
 aOut              dcblock2            aOut
endif

                   chnmix              aOut, "Send"


endin



instr 99 ; effects and gathered audio output
 a1                chnget              "Send"
 a2                chnget              "Send"
 ; effects
 ; CHORUS
 kChorus   cabbageGetValue    "Chorus"
 if kChorus==1 then
  amod1            poscil              0.001, 0.2, -1, 0
  aCho1            vdelay              a1, (amod1 + 0.002) * 1000, 0.01*1000
  a1               +=                  aCho1 
  amod2            poscil              0.001, 0.2, -1, 0.5
  aCho2            vdelay              a2, (amod2 + 0.002) * 1000, 0.01*1000
  a2               +=                  aCho2
 endif 
 ; DELAY
 kDelay            cabbageGetValue     "Delay"
 if kDelay==1 then
  aDly1,aDly2      init                0
  aDly1            delay               a1 + aDly1 * 0.7, 0.633
  a1               +=                  aDly1
  aDly2            delay               a2 + aDly2 * 0.8, 0.833
  a2               +=                  aDly2
 endif 
 ; REVERB
 kReverb           cabbageGetValue     "Reverb"
 if kReverb==1 then
  aRvb1,aRvb2      reverbsc            a1,a2,0.77,8000
  a1               +=                  aRvb1*0.3
  a2               +=                  aRvb2*0.3
 endif
;;

kPortTime linseg   0,0.001,0.05
kOutGain           cabbageGetValue     "OutGain"
kOutGain           portk               kOutGain, kPortTime
                   outs                a1*a(kOutGain), a2*a(kOutGain)

endin




instr 101 ; oscilloscope and spectroscope
aOut               chnget              "Send"
                   chnclear            "Send"
; oscilloscope
kOscOnOff          cabbageGetValue     "OscOnOff"
if kOscOnOff==0 goto SKIP_OSC
kOscGain           cabbageGetValue     "OscGain"
kOscPer            cabbageGetValue     "OscPer"
kOscPer            init                0.01
aOsc               =                   aOut * kOscGain

if changed:k(kOscPer)==1 then
                   reinit              RESTART_OSCILLOSCOPE
endif
RESTART_OSCILLOSCOPE:
                   display             aOsc, i(kOscPer)
rireturn
SKIP_OSC:

; spectroscope
kSpecOnOff         cabbageGetValue     "SpecOnOff"
if kSpecOnOff==0 goto SKIP_SPEC
kSpecGain          cabbageGetValue     "SpecGain"
aSpec              =                   aOut * kSpecGain                  ; aSig can't be scaled in the the 'display' line
kSpecZoom          cabbageGetValue     "SpecZoom"
kSpecZoom          init                2

if changed:k(kSpecZoom)==1 then
                   reinit              RESTART_SPECTROSCOPE
endif
RESTART_SPECTROSCOPE:

iWSize             =                   8192
iWType             =                   0 ; (0 = rectangular)
iDBout             =                   0 ; (0 = magnitude, 1 = decibels)
iWaitFlag          =                   0 ; (0 = no wait)
iMin               =                   0 ;iWSize * i(kMin)
iMax               =                   iWSize / i(kSpecZoom)
                   dispfft             aSpec, 0.001, iWSize, iWType, iDBout, iWaitFlag, iMin, iMax
                   rireturn
SKIP_SPEC:

endin

</CsInstruments>

<CsScore>
i 1 0 z
i 99 0 z  ; effects and mixed audio output
i 101 0 z ; oscilloscope and spectroscope
</CsScore>                            

</CsoundSynthesizer>
