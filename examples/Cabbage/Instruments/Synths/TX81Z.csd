
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; TX81Z.csd
; Iain McCurdy, 2023

; An encapsulation of several FM synthesis opcodes that are based on presets from the Yamaha TX81Z

; They are:
; 1 FM Bell (algorithm 5)
; 2 FM Metal (algorithm 3)
; 3 FM Percussive Flute (algorithm 4)
; 4 FM Rhodes (electric piano) (algorithm 5)
; 5 FM Wurlitzer (electric piano) (algorithm 5)
; 6 FM B3 (drawbar electric organ) (algorithm 4)
; 7 FM Voice

; FM B3 seems to occasionally produce inaccurate notes according to the note played. This seems to be a bug in the opcode.
; Vibrato is not functional with FM Voice

; A lot of features of each sound, in particular envelopes on the amplitudes of each operator (oscillator) 
;  and frequency rations are hidden within the opcode.
; Nonetheless there are plenty of options for sound design.

; Yamaha refers to oscillators in its FM algorithms as 'operators'

; The algorithm pertaining to the selected opcode is shown on the interface as the various opcodes are selected.

; < > Opcode Select
; SEND OPCODE DEFAULTS - sets whether certain aspects of the GUI will be changed along with the opcode selection 
;                         to provide useful defaults.
;                        Mainly waveforms and indexes of modulation

; Reverb (screverb)
; SEND - amount of signal sent into the reverb effect
; SIZE - length of the reverb tail
; DAMP - cutoff frequency of a low-pass filter within the reverb effect

; SUSTAIN    - sustain time for FM Flute only. 
;              this sets the decay/release times of envelopes within the opcode.
;              Setting to maximum (HOLD) will sustain the note for a very long time.
; BEND RANGE - pitch bend range in semitones (control using a connected MIDI keyboard)

; C1 Dial (this is the large dial in the upper sub-panel, it's label changes depending on the opcode selected)
;         This generally controls FM index
; (envelope) - can be turned on or off using the 'ENVELOPE' button
; ATT.  - envelope attack time
; DEC.  - envelope decay time
; SUS.  - envelope sustain level
; REL.  - envelope release time
; (lfo) - can be turned on or off using the 'LFO' button
; DEP   - lfo depth (amplitude, depth)
; RATE  - rate of lfo modulation
; RISE  - rise time of depth
; LFO shape radio buttons selector: SINE, TRI, SQU, SAW, RAMP

; C2 Dial (this is the large dial in the upper sub-panel, it's label changes depending on the opcode selected)
;         This generally acts as a crossfader between the two halves of the 4-opersator algorithm
; (envelope) - can be turned on or off using the 'ENVELOPE' button
; ATT.  - envelope attack time
; DEC.  - envelope decay time
; SUS.  - envelope sustain level
; REL.  - envelope release time
; (lfo) - can be turned on or off using the 'LFO' button
; DEP   - lfo depth (amplitude, depth)
; RATE  - rate of lfo modulation
; RISE  - rise time of depth
; LFO shape radio buttons selector: SINE, TRI, SQU, SAW, RAMP

; WAVEFORM1-4
; These are the waveforms used by the four algorithm operators.
; The first 8 are the ones originally offered on the TX81Z.
; The waveform used by the vibrato function can also be changed.

; VIB.DEPTH  - vibrato depth
; VIB.RATE   - vibrato rate
; OCTAVE     - shift the frequency of all operators in octave steps
; DETUNE     - a stereo detune effect - the two stereo channels are detuned inversely according to this value in cents.
;                left channel detuned by +DETUNE cents 
;                right channel detuned by -DETUNE cents 

; (amplitude envelope)
; ATT.       - attack time
; DEC.       - decay time
; SUS.       - sustain level
; REL.       - release time

; AMP.       - amplitude of the output audio signal

; (check boxes)
; MOD. WHEEL TO FM INDEX - if this is selected, the modulation wheel of a connected MIDI keyboard will also control FM index of modulation
; MOD. WHEEL TO VIBRATO - if this is selected, the modulation wheel of a connected MIDI keyboard will also control FM index of modulation
; VEL. TO FM INDEX - if this is selected, key velocity of a connected MIDI keyboard will also control FM index of modulation (as well as amplitude)
; INVERT INDICES (STEREO) - this inverts the value of the C1 Dial (FM Index) on the right channel creating a stereo effect
;                           the significance of this effect depends on the preset chosen
;                           it is not available with the FM Voice preset
; MONO-LEGATO - switch to a monophonic-legato mode. Portamento time is preset within the code. 

; PRESETS
; A mechanism for saving and recalling presets is included (courtesy of Rory Walsh)

<Cabbage>
form caption("TX81Z") size(1165,443), pluginId("RMSy"), colour($PANEL_COLOUR), guiMode("queue")

#define DIAL_PROPERTIES  colour("Grey"), trackerColour("silver")
#define PANEL_COLOUR 45, 45, 45

; algorithm displays
label bounds( 50, 72,230, 13), text("A   L   G   O   R   I   T   H   M"), align("centre")

image bounds( 50, 90,230,140), colour(0,0,0,0), channel("Alg3"), outlineThickness(1), outlineColour("white"), visible(0)
{
label bounds(  5,  5,26,30), text("3")

image bounds( 95, 25, 1,100)
image bounds(100, 82,40,1), rotate(2.485,20,1)
image bounds(145, 45, 1,20)
image bounds(120, 45, 1,38)
image bounds(120, 45,25, 1)

image bounds( 80, 20,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds( 82, 22,26,16), text("3")

image bounds( 80, 55,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds( 82, 57,26,16), text("2")

image bounds( 80, 90,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds( 82, 92,26,16), text("1")

image bounds(130, 55,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds(132, 57,26,16), text("4")
}


image bounds( 50, 90,230,140), colour(0,0,0,0), channel("Alg4"), outlineThickness(1), outlineColour("white"), visible(0)
{
label bounds(  5,  5,26,30), text("4")

image bounds( 95, 70, 1, 60)
image bounds(100, 87,40,1), rotate(2.485,20,1)
image bounds(145, 15, 1,55)

image bounds(170, 15, 1,38)
image bounds(145, 15,25, 1)
image bounds(145, 52,25, 1)


image bounds( 80, 60,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds( 82, 62,26,16), text("2")

image bounds( 80, 95,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds( 82, 97,26,16), text("1")

image bounds(130, 60,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds(132, 62,26,16), text("3")

image bounds(130, 25,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds(132, 27,26,16), text("4")
}

image bounds( 50, 90,230,140), colour(0,0,0,0), channel("Alg5"), outlineThickness(1), outlineColour("white"), visible(1)
{
label bounds(  5,  5,26,30), text("5")

image bounds( 90, 65, 1, 55)
image bounds(140, 45, 1, 75)
image bounds(140, 45,25,  1)
image bounds(165, 45, 1, 37)
image bounds(140, 82,25,  1)

image bounds( 90,120,50,  1)
image bounds(115,120, 1, 10)

image bounds( 75, 55,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds( 77, 57,26,16), text("2")

image bounds( 75, 90,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds( 77, 92,26,16), text("1")

image bounds(125, 55,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds(127, 57,26,16), text("4")

image bounds(125, 90,30,20), colour($PANEL_COLOUR), outlineThickness(1), outlineColour("white")
label bounds(127, 92,26,16), text("3")
}


; reverb
line     bounds( 40,250,140,  1)
label    bounds( 88,244, 45, 12), text("REVERB"), colour($PANEL_COLOUR), align("centre")
rslider  bounds( 30,260, 60, 75), channel("RvbSend"), range(0,1,0.2), valueTextBox(1), text("SEND"), $DIAL_PROPERTIES
rslider  bounds( 80,260, 60, 75), channel("RvbSize"), range(0.3,0.99,0.8,2), valueTextBox(1), text("SIZE"), $DIAL_PROPERTIES
rslider  bounds(130,260, 60, 75), channel("RvbDamp"), range(200,15000,12000,0.5,1), valueTextBox(1), text("DAMP"), $DIAL_PROPERTIES

rslider  bounds(190,250, 70, 85), channel("sus"), range(0.1,60,4,0.5), valueTextBox(1), text("SUSTAIN"), $DIAL_PROPERTIES
label    bounds(198,319, 50, 17), channel("susDisp"), text("4"), align("centre"), colour(0,0,0), outlineThickness(3), outlineColour("white")
rslider  bounds(250,250, 70, 85), channel("BendRange"), range(0,24,2,1,1), valueTextBox(1), text("BEND RANGE"), $DIAL_PROPERTIES


; bevel
image bounds( 10, 10,244, 34), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(20)
{
label bounds(  2,  2,240, 30), text("01: FM Bell"), fontColour("Lime"), colour(0,40,0), channel("Name"), align("left")
}

image bounds(260,10,75,35), colour(0,0,0,0)
{
label  bounds( 9,-12,35,50), text("‹"), fontColour("White"),align("left")
label  bounds(52,-12,35,50), text("›"), fontColour("White"),align("left")
button bounds( 0,0,35,35), text(""), channel("Dec"), latched(0), alpha(0.65), corners(6)
button bounds(40,0,35,35), text(""), channel("Inc"), latched(0), alpha(0.65), corners(6)
}

checkbox bounds(10,55,200,12), channel("SendOpcodeDefaults"), text("SEND OPCODE DEFAULTS"), value(1)

; right panel
image   bounds(845,10,310,320), colour(0,0,0,0)
{
; VIBRATO AND HOLD
rslider bounds(  0,  0, 70, 85), channel("vdepth"), range(0,1,0,0.5), valueTextBox(1), text("VIB.DEPTH"), $DIAL_PROPERTIES
rslider bounds( 60,  0, 70, 85), channel("vrate"), range(0,20,5,0.5), valueTextBox(1), text("VIB.RATE"), $DIAL_PROPERTIES
rslider bounds(120,  0, 70, 85), channel("vrise"), range(0,12,2,0.5), valueTextBox(1), text("VIB.RISE"), $DIAL_PROPERTIES
rslider bounds(180,  0, 70, 85), channel("octave"), range(-6,6,0,1,1), valueTextBox(1), text("OCTAVE"), $DIAL_PROPERTIES
rslider bounds(240,  0, 70, 85), channel("detune"), range(-20,20,5), valueTextBox(1), text("DETUNE"), $DIAL_PROPERTIES


; AMPLITUDE ENVELOPE
line    bounds( 10,110,230,1)
label   bounds( 65,104,125,12), text("AMPLITUDE ENVELOPE"), colour($PANEL_COLOUR)
rslider bounds(  0,120, 70, 85), channel("AAtt"), range(0,8,0,0.5), valueTextBox(1), text("ATT."), $DIAL_PROPERTIES
rslider bounds( 60,120, 70, 85), channel("ADec"), range(0,8,0,0.5), valueTextBox(1), text("DEC."), $DIAL_PROPERTIES
rslider bounds(120,120, 70, 85), channel("ASus"), range(0,1,1,0.5), valueTextBox(1), text("SUS."), $DIAL_PROPERTIES
rslider bounds(180,120, 70, 85), channel("ARel"), range(0,8,0,0.5), valueTextBox(1), text("REL."), $DIAL_PROPERTIES
rslider  bounds(240,120, 70, 85), channel("Amp"), range(0,1,0.5,0.5), valueTextBox(1), text("AMP."), $DIAL_PROPERTIES

; 3rd row
checkbox bounds( 15,225,200,12), channel("ModWhl2Ndx"), text("MOD. WHEEL TO FM INDEX"), value(0)
checkbox bounds( 15,245,200,12), channel("ModWhl2Vib"), text("MOD. WHEEL TO VIBRATO"), value(0)
checkbox bounds( 15,265,200,12), channel("Vell2Ndx"), text("VELOCITY TO FM INDEX"), value(1)
checkbox bounds( 15,285,200,12), channel("InvIndices"), text("INVERT INDICES (STEREO)"), value(1)
checkbox bounds( 15,305,200,12), channel("MonoLegato"), text("MONO-LEGATO"), value(0)

; presets
label      bounds(220,228,  60, 14), text("PRESETS"), align("centre")
combobox   bounds(220,243,  60, 20), populate("*.snaps"), channelType("string")
filebutton bounds(220,265,  60, 20), text("Save"), populate("*.snaps", "test"), mode("named preset")
filebutton bounds(220,287,  60, 20), text("Remove"), populate("*.snaps", "test"), mode("remove preset")
}

; C1 CONTROLS
image   bounds(340,  5,490,110) colour(0,0,0,0), outlineColour("silver"), outlineThickness(1)
{
    rslider bounds(  5,  5, 80, 95), channel("c1"), range(0,1,0.1,0.5), valueTextBox(1), text("C1"), $DIAL_PROPERTIES
label   bounds(  5, 10, 80, 12), channel("c1Disp"), text("c1"), align("centre"), colour($PANEL_COLOUR), fontColour("Silver")
line    bounds( 90, 10,175,  2)
button   bounds(140,  5, 70, 14), text("ENVELOPE"), colour(45,45,45), channel("Env1OnOff"), fontColour:0(50,100,50), fontColour:1(110,255,110), colour:0(0,10,0), colour:1(10,40,10), value(1)
rslider bounds( 75, 25, 60, 75), channel("att1"), range(0,8,0,0.5), valueTextBox(1), text("ATT."), $DIAL_PROPERTIES
rslider bounds(125, 25, 60, 75), channel("dec1"), range(0,8,0,0.5), valueTextBox(1), text("DEC."), $DIAL_PROPERTIES
rslider bounds(175, 25, 60, 75), channel("sus1"), range(0,1,1,0.5), valueTextBox(1), text("SUS."), $DIAL_PROPERTIES
rslider bounds(225, 25, 60, 75), channel("rel1"), range(0,8,0,0.5), valueTextBox(1), text("REL."), $DIAL_PROPERTIES

line    bounds(290, 10,180,  2)
button   bounds(365,  5, 30, 14), text("LFO"), colour(45,45,45), channel("LFO1OnOff"), fontColour:0(50,100,50), fontColour:1(110,255,110), colour:0(0,10,0), colour:1(10,40,10), value(1)
rslider bounds(275, 25, 60, 75), channel("dep1"), range(0,8,0,0.5), valueTextBox(1), text("DEPTH"), $DIAL_PROPERTIES
rslider bounds(325, 25, 60, 75), channel("rat1"), range(0,20,2,0.5), valueTextBox(1), text("RATE"), $DIAL_PROPERTIES
rslider bounds(375, 25, 60, 75), channel("ris1"), range(0,8,0,0.5), valueTextBox(1), text("RISE"), $DIAL_PROPERTIES
checkbox bounds(430, 25, 60, 12), channel("sw1_1"), text("SINE"), radioGroup(1), value(1)
checkbox bounds(430, 39, 60, 12), channel("sw1_2"), text("TRI."), radioGroup(1)
checkbox bounds(430, 53, 60, 12), channel("sw1_3"), text("SQU."), radioGroup(1)
checkbox bounds(430, 67, 60, 12), channel("sw1_4"), text("SAW"),  radioGroup(1)
checkbox bounds(430, 81, 60, 12), channel("sw1_5"), text("RAMP"), radioGroup(1)
}

; C2 CONTROLS
image   bounds(340,125,490,110) colour(0,0,0,0), outlineColour("silver"), outlineThickness(1)
{
rslider bounds(  5,  5, 80, 95), channel("c2"), range(0,1,0.5), valueTextBox(1), text("C2"), $DIAL_PROPERTIES
label   bounds(  5, 10, 80, 12), channel("c2Disp"), text("c2"), align("centre"), colour($PANEL_COLOUR), fontColour("Silver")
line    bounds( 90, 10,175,  2)
button   bounds(140,  5, 70, 14), text("ENVELOPE"), colour(45,45,45), channel("Env2OnOff"), fontColour:0(50,100,50), fontColour:1(110,255,110), colour:0(0,10,0), colour:1(10,40,10), value(1)
rslider bounds( 75, 25, 60, 75), channel("att2"), range(0,8,0,0.5), valueTextBox(1), text("ATT."), $DIAL_PROPERTIES
rslider bounds(125, 25, 60, 75), channel("dec2"), range(0,8,0,0.5), valueTextBox(1), text("DEC."), $DIAL_PROPERTIES
rslider bounds(175, 25, 60, 75), channel("sus2"), range(0,1,1,0.5), valueTextBox(1), text("SUS."), $DIAL_PROPERTIES
rslider bounds(225, 25, 60, 75), channel("rel2"), range(0,8,0,0.5), valueTextBox(1), text("REL."), $DIAL_PROPERTIES

line    bounds(290, 10,180,  2)
label   bounds(365,  5, 30, 14), text("LFO"), colour(45,45,45)
button   bounds(365,  5, 30, 14), text("LFO"), colour(45,45,45), channel("LFO2OnOff"), fontColour:0(50,100,50), fontColour:1(110,255,110), colour:0(0,10,0), colour:1(10,40,10), value(1)
rslider bounds(275, 25, 60, 75), channel("dep2"), range(0,8,0,0.5), valueTextBox(1), text("DEPTH"), $DIAL_PROPERTIES
rslider bounds(325, 25, 60, 75), channel("rat2"), range(0,20,2,0.5), valueTextBox(1), text("RATE"), $DIAL_PROPERTIES
rslider bounds(375, 25, 60, 75), channel("ris2"), range(0,8,0,0.5), valueTextBox(1), text("RISE"), $DIAL_PROPERTIES
checkbox bounds(430, 25, 60, 12), channel("sw2_1"), text("SINE"), radioGroup(1), value(1)
checkbox bounds(430, 39, 60, 12), channel("sw2_2"), text("TRI."), radioGroup(1)
checkbox bounds(430, 53, 60, 12), channel("sw2_3"), text("SQU."), radioGroup(1)
checkbox bounds(430, 67, 60, 12), channel("sw2_4"), text("SAW"),  radioGroup(1)
checkbox bounds(430, 81, 60, 12), channel("sw2_5"), text("RAMP"), radioGroup(1)
}

; Waveforms
image   bounds(340, 244, 490, 90) colour(0, 0, 0, 0), outlineColour(192, 192, 192, 255), outlineThickness(1)
{
image    bounds(5, 5, 80, 75), colour(0, 0, 0, 0)
 {
 label    bounds(  0,  0, 80, 13), text("WAVEFORM 1")
 combobox bounds(  0, 15, 80, 20), channel("FN1"), items("W1","W2","W3","W4","W5","W6","W7","W8","2SINE","3SINE","4SINE","5SINE","6SINE","7SINE","8SINE","9SINE","10SINE","11SINE","12SINE","13SINE","14SINE","15SINE","16SINE","HARM1","HARM2","HARM3","HARM4","SQUARE","TRI","NOISE","BLANK"), value(1)
 image    bounds(  0, 35, 80, 40), colour("Silver")
 gentable bounds(  2, 37, 76, 36), channel("table1"), tableNumber(101), tableColour("Yellow")
 }
image    bounds(105, 5, 80, 75), colour(0, 0, 0, 0)
 {
 label    bounds(  0,  0, 80, 13), text("WAVEFORM 2")
 combobox bounds(  0, 15, 80, 20), channel("FN2"), items("W1","W2","W3","W4","W5","W6","W7","W8","2SINE","3SINE","4SINE","5SINE","6SINE","7SINE","8SINE","9SINE","10SINE","11SINE","12SINE","13SINE","14SINE","15SINE","16SINE","HARM1","HARM2","HARM3","HARM4","SQUARE","TRI","NOISE","BLANK"), value(1)
 image    bounds(  0, 35, 80, 40), colour("Silver")
 gentable bounds(  2, 37, 76, 36), channel("table2"), tableNumber(102), tableColour("Yellow")
 }
image    bounds(205, 5, 80, 75), colour(0, 0, 0, 0)
 {
 label    bounds(  0,  0, 80, 13), text("WAVEFORM 3")
 combobox bounds(  0, 15, 80, 20), channel("FN3"), items("W1","W2","W3","W4","W5","W6","W7","W8","2SINE","3SINE","4SINE","5SINE","6SINE","7SINE","8SINE","9SINE","10SINE","11SINE","12SINE","13SINE","14SINE","15SINE","16SINE","HARM1","HARM2","HARM3","HARM4","SQUARE","TRI","NOISE","BLANK"), value(1)
 image    bounds(  0, 35, 80, 40), colour("Silver")
 gentable bounds(  2, 37, 76, 36), channel("table3"), tableNumber(103), tableColour("Yellow")
 }
image    bounds(305, 5, 80, 75), colour(0, 0, 0, 0)
 {
 label    bounds(  0,  0, 80, 13), text("WAVEFORM 4")
 combobox bounds(  0, 15, 80, 20), channel("FN4"), items("W1","W2","W3","W4","W5","W6","W7","W8","2SINE","3SINE","4SINE","5SINE","6SINE","7SINE","8SINE","9SINE","10SINE","11SINE","12SINE","13SINE","14SINE","15SINE","16SINE","HARM1","HARM2","HARM3","HARM4","SQUARE","TRI","NOISE","BLANK"), value(1)
 image    bounds(  0, 35, 80, 40), colour("Silver")
 gentable bounds(  2, 37, 76, 36), channel("table4"), tableNumber(104), tableColour("Yellow")
 }
image    bounds(405, 5, 80, 75), colour(0, 0, 0, 0)
 {
 label    bounds(  0,  0, 80, 13), text("VIBRATO")
 combobox bounds(  0, 15, 80, 20), channel("FN5"), items("W1","W2","W3","W4","W5","W6","W7","W8","2SINE","3SINE","4SINE","5SINE","6SINE","7SINE","8SINE","9SINE","10SINE","11SINE","12SINE","13SINE","14SINE","15SINE","16SINE","HARM1","HARM2","HARM3","HARM4","SQUARE","TRI","NOISE","BLANK"), value(1)
 image    bounds(  0, 35, 80, 40), colour("Silver")
 gentable bounds(  2, 37, 76, 36), channel("table5"), tableNumber(105), tableColour("Yellow")
 }
}

keyboard   bounds(  5,345,1155, 85)

label    bounds( 5,430,110,12), text("Iain McCurdy |2023|"), fontColour("silver"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 8
nchnls = 2
0dbfs  = 1

; LFO waveforms (values in array are used by lfo opcode)
;                      sine tri sq(uni) saw ramp
giLFO_WFMS[] fillarray 0,   1,  3,      5,  4


iFtLen  =  32768 ; size of all function tables used by fm opcodes

; W1 Sine
giSine    ftgen 1,0,iFtLen,10,1

; W2 twopeaks
;                           pn    str phs  DC
i1  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  270, 1
i2  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  180, 1
i3  ftgen 0,0,iFtLen/4,-19, 0.25, 1,   90, -1
i4  ftgen 0,0,iFtLen/4,-19, 0.25, 1,    0, -1
gitwopeaks ftgen 2,0,ftlen(i1)*4,18, i1,1,0,ftlen(i1)-1, i2,1,ftlen(i1),ftlen(i1)*2-1, i3,1,ftlen(i1)*2,ftlen(i1)*3-1, i4,1,ftlen(i1)*3,ftlen(i1)*4-1

; W3 one hump
gihalfsine  ftgen 0,0,iFtLen/2, 9, 0.5,  1,  0
gionehump ftgen 3,0, iFtLen,18,  gihalfsine,1,0,iFtLen/2-1

; W4 one peak
;                           pn    str phs  DC
i1  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  270, 1
i2  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  180, 1
gionepeak ftgen 4,0,ftlen(i1)*4,18, i1,1,0,ftlen(i1)-1, i2,1,ftlen(i1),ftlen(i1)*2-1

; W5 squashed sine
gisquashedsine ftgen 5,0,iFtLen,18, giSine,1,0,iFtLen/2-1

; W6 squashed twopeaks
gisquashedtwopeaks ftgen 6,0,iFtLen,18, gitwopeaks,1,0,iFtLen*0.5-1

; W7 squashed two humps (fwavblnk)
gisquashedtwohumps ftgen 7,0,iFtLen,18, gihalfsine,1,0,iFtLen*0.25-1, gihalfsine,1,iFtLen*0.25,iFtLen*0.5-1

; W8 squashed two peaks
i1  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  270, 1
i2  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  180, 1
gisquashedtwopeaks ftgen 8,0,iFtLen,  18, i1,1,0,iFtLen*0.125-1, i2,1,iFtLen*0.125,iFtLen*0.25-1, i1,1,iFtLen*0.25,iFtLen*0.375-1, i2,1,iFtLen*0.375,iFtLen*0.5-1


gi2Sine    ftgen  9,0,iFtLen, 9, 2,1,0
gi3Sine    ftgen 10,0,iFtLen, 9, 3,1,0
gi4Sine    ftgen 11,0,iFtLen, 9, 4,1,0
gi5Sine    ftgen 12,0,iFtLen, 9, 5,1,0
gi6Sine    ftgen 13,0,iFtLen, 9, 6,1,0
gi7Sine    ftgen 14,0,iFtLen, 9, 7,1,0
gi8Sine    ftgen 15,0,iFtLen, 9, 8,1,0
gi9Sine    ftgen 16,0,iFtLen, 9, 9,1,0
gi10Sine   ftgen 17,0,iFtLen, 9, 10,1,0
gi11Sine   ftgen 18,0,iFtLen, 9, 11,1,0
gi12Sine   ftgen 19,0,iFtLen, 9, 12,1,0
gi13Sine   ftgen 20,0,iFtLen, 9, 13,1,0
gi14Sine   ftgen 21,0,iFtLen, 9, 14,1,0
gi15Sine   ftgen 22,0,iFtLen, 9, 15,1,0
gi16Sine   ftgen 23,0,iFtLen, 9, 16,1,0

giHarm1    ftgen 24,0,iFtLen, 10, 1,1/2,1/4
giHarm2    ftgen 25,0,iFtLen, 10, 0,1,1/2,1/4
giHarm3    ftgen 26,0,iFtLen, 10, 0,0,1,1/2,1/4
giHarm4    ftgen 27,0,iFtLen, 10, 0,0,1,1/2,1/4

giSquare   ftgen 28, 0, iFtLen, 10, 1, 0, 1/3, 0, 1/5, 0, 1/7, 0, 1/9
giTri      ftgen 29, 0, iFtLen, 10, 1, 0, -1/9, 0, 1/25, 0, -1/49, 0, 1/81

giNoise    ftgen 30, 0, iFtLen, 21, 6, 1

giBlank    ftgen 31, 0, iFtLen, 2, 0

; five display tables
i_   ftgen 101,0,iFtLen, 9, 1,1,0
i_   ftgen 102,0,iFtLen, 9, 1,1,0
i_   ftgen 103,0,iFtLen, 9, 1,1,0
i_   ftgen 104,0,iFtLen, 9, 1,1,0
i_   ftgen 105,0,iFtLen, 9, 1,1,0

initc7 1,1,1 ; mod wheel defaults to max 

instr    1 ; always on

; mono/poly switching
kMonoLegato cabbageGetValue "MonoLegato"
if changed:k(kMonoLegato)==1 then
 reinit RESET
endif
RESET:
massign 0, (1-i(kMonoLegato)+2)
rireturn

; read in modulation wheel
kporttime linseg          0,0.001,1
kModWhl   ctrl7           1,1,0,1
kModWhl   portk           kModWhl, kporttime*0.02

; optional mod wheel to FM index
if cabbageGetValue:k("ModWhl2Ndx")==1 then
         cabbageSetValue "c1",kModWhl,changed:k(kModWhl)
endif

; optional mod wheel to vibrato
if cabbageGetValue:k("ModWhl2Vib")==1 then
         cabbageSetValue "vdepth",kModWhl,changed:k(kModWhl)
endif

gkFN1   cabbageGetValue "FN1"
gkFN2   cabbageGetValue "FN2"
gkFN3   cabbageGetValue "FN3"
gkFN4   cabbageGetValue "FN4"
gkFN5   cabbageGetValue "FN5"

gkAlg   init            1
kDec    cabbageGetValue "Dec"
kInc    cabbageGetValue "Inc"
gkOctave cabbageGetValue "octave"
gkAlg   -=              trigger:k(kDec,0.5,0) 
gkAlg   +=              trigger:k(kInc,0.5,0)
gkAlg   limit            gkAlg, 1, 7      
kSendOpcodeDefaults cabbageGetValue "SendOpcodeDefaults"
if changed:k(gkAlg)==1 then
 if gkAlg==1 then
        cabbageSet      k(1), "Name", "text", "01: FM Bell" ; set name label
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults ; set function tables
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.05),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.5),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Mod Index 1"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Inputs"
        cabbageSet      k(1),"sus","visible",1
        cabbageSet      k(1),"susDisp","visible",1
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",0
        cabbageSet      k(1),"Alg5","visible",1
 elseif gkAlg==2 then
        cabbageSet      k(1), "Name", "text", "02: FM Metal"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(2),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(2),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.3),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.5),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Tot Mod Index"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Mods."
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0
        cabbageSet      k(1),"Alg3","visible",1
        cabbageSet      k(1),"Alg4","visible",0
        cabbageSet      k(1),"Alg5","visible",0
 elseif gkAlg==3 then
        cabbageSet      k(1), "Name", "text", "03: FM Perc Flute"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.05),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.5),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Tot Mod Index"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Mods."
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0        
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",1
        cabbageSet      k(1),"Alg5","visible",0
 elseif gkAlg==4 then
        cabbageSet      k(1), "Name", "text", "04: FM Rhodes"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(7),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.036),kSendOpcodeDefaults
        cabbageSetValue "c2",k(1),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Mod Index 1"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Inputs"
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",0
        cabbageSet      k(1),"Alg5","visible",1
 elseif gkAlg==5 then
        cabbageSet      k(1), "Name", "text", "05: FM Wurly"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(7),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.09),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.125),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Mod Index 1"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Inputs"
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",0
        cabbageSet      k(1),"Alg5","visible",1
 elseif gkAlg==6 then
        cabbageSet      k(1), "Name", "text", "06: FM B3"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.2),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.5),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Tot Mod Index"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Mods."
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",1
        cabbageSet      k(1),"Alg5","visible",0
 elseif gkAlg==7 then
        cabbageSet      k(1), "Name", "text", "07: FM Voice"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.1),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.8),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Vowel"
        cabbageSet      k(1),"c2Disp","text","Tilt"
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",0
        cabbageSet      k(1),"Alg5","visible",0
 endif
endif

; set changes in display tables
if changed:k(gkFN1)==1 then
 tablecopy 101,gkFN1
 cabbageSet k(1), "table1", "tableNumber", 101
elseif changed:k(gkFN2)==1 then
 tablecopy 102,gkFN2
 cabbageSet k(1), "table2", "tableNumber", 102
elseif changed:k(gkFN3)==1 then
 tablecopy 103,gkFN3
 cabbageSet k(1), "table3", "tableNumber", 103
elseif changed:k(gkFN4)==1 then
 tablecopy 104,gkFN4
 cabbageSet k(1), "table4", "tableNumber", 104
elseif changed:k(gkFN5)==1 then
 tablecopy 105,gkFN5
 cabbageSet k(1), "table5", "tableNumber", 105
endif

; sustain switches to 'hold' when turned to maximum. This is printed to the GUI for confirmation. 
ksus,kT cabbageGetValue "sus"
        cabbageSet      kT,"susDisp","text",sprintfk:S("%5.2f",ksus)
if ksus==60 then
        cabbageSet      kT,"susDisp","text","HOLD"
endif
        cabbageSet      "susDisp","text",sprintfk:S("%5.2f",ksus) ; init-time setting
        
; envelope 1
gkatt1   cabbageGetValue "att1"
gkdec1   cabbageGetValue "dec1"
gksus1   cabbageGetValue "sus1"
gkrel1   cabbageGetValue "rel1"

; envelope 2
gkatt2    cabbageGetValue "att2"
gkdec2    cabbageGetValue "dec2"
gksus2    cabbageGetValue "sus2"
gkrel2    cabbageGetValue "rel2"

; amplitude envelope
gkAAtt    cabbageGetValue "AAtt"
gkADec    cabbageGetValue "ADec"
gkASus    cabbageGetValue "ASus"
gkARel    cabbageGetValue "ARel"

endin




gkcps    init  cpsmidinn(60)
instr    2 ; mono-legato instrument
 icps     cpsmidi
 gkbend   pchbend         0,1
 iVel     ampmidi         1
 gkVel    =               iVel
 gkcps    =        icps
 if active:i(p1+1,0,1)<1 then
  event_i     "i",p1+1,0,3600*24*365
 endif
 if trigger:k(release:k(),0.5,0)==1 && active:k(p1)==1 then
  turnoff2 p1+1,0,1
 endif
endin



instr    3
kporttime linseg 0,0.001,1
; poly/mono pitch calculation
iMonoLegato cabbageGetValue "MonoLegato"
if iMonoLegato==0 then ; poly
 icps     cpsmidi
 kcps     init          icps
 kbend    pchbend       0,1
 iVel     ampmidi       1
else                   ; mono
 kcps     portk          gkcps, kporttime*0.01
 icps     =              i(gkcps)
 kbend    =              gkbend
 iVel     =              i(gkVel)
endif

iVel     pow             iVel, 2
kamp     =               0.3
kc1      cabbageGetValue "c1"
kc2      cabbageGetValue "c2"
kvdepth  cabbageGetValue "vdepth"
kvrate   cabbageGetValue "vrate"
ivrise   cabbageGetValue "vrise"
kvdepth  *=              cosseg:k(0,ivrise+(1/kr),1)

; sustain parameter (FM Bell only)
isus     cabbageGetValue "sus"
isus     =               isus==60 ? 31536000 : isus

; envelope 1
kEnv1OnOff cabbageGetValue "Env1OnOff"
kenv1      cossegr         0, i(gkatt1)+1/kr, 1, i(gkdec1)+1/kr, i(gksus1), i(gkrel1)+0.1, 0
kc1        =               kEnv1OnOff == 1 ? kc1*kenv1 : kc1

; velocity control of FM index
iVell2Ndx  cabbageGetValue  "Vell2Ndx"
kc1        =               iVell2Ndx == 1 ? kc1*iVel : kc1

; lfo 1
kLFO1OnOff cabbageGetValue "LFO1OnOff"
kdep1    cabbageGetValue "dep1"
krat1    cabbageGetValue "rat1"
iris1    cabbageGetValue "ris1"
isw1_1   cabbageGetValue "sw1_1"
isw1_2   cabbageGetValue "sw1_2"
isw1_3   cabbageGetValue "sw1_3"
isw1_4   cabbageGetValue "sw1_4"
isw1_5   cabbageGetValue "sw1_5"
iLFOshp1 =               giLFO_WFMS[isw1_2 + isw1_3*2 + isw1_4*3 + isw1_5*4]
klfo1    lfo             kdep1, krat1, iLFOshp1
klfo1    port            klfo1, 0.0005
kLFOenv1 cosseg          0, iris1+1/kr, 1
kc1      =               kLFO1OnOff == 1 ? kc1*(1 + (klfo1*kLFOenv1) ) : kc1

; envelope 2
kEnv2OnOff cabbageGetValue "Env2OnOff"
kenv2      cossegr         0, i(gkatt2)+1/kr, 1, i(gkdec2)+1/kr, i(gksus2),i(gkrel2)+0.1, 0
kc2        =               kEnv2OnOff == 1 ? kc2*kenv2 : kc2

; lfo 2
kLFO2OnOff    cabbageGetValue "LFO2OnOff"
kdep2    cabbageGetValue "dep2"
krat2    cabbageGetValue "rat2"
iris2    cabbageGetValue "ris2"
isw2_1   cabbageGetValue "sw2_1"
isw2_2   cabbageGetValue "sw2_2"
isw2_3   cabbageGetValue "sw2_3"
isw2_4   cabbageGetValue "sw2_4"
isw2_5   cabbageGetValue "sw2_5"
iLFOshp2 =               giLFO_WFMS[isw2_2 + isw2_3*2 + isw2_4*3 + isw2_5*4]
klfo2    lfo             kdep2, krat2, iLFOshp2
klfo2    port            klfo2, 0.0005
kLFOenv2 cosseg          0, iris2+1/kr, 1
kc2        =             kLFO2OnOff == 1 ? kc2*(1 + (klfo2*kLFOenv2) ) : kc2

ifn1     =               101
ifn2     =               102
ifn3     =               103
ifn4     =               104
ifn5     =               105

; pitch bend
kBendRange cabbageGetValue "BendRange" 
kbend    *=              kBendRange
kporttime linseg          0,0.01,0.05
kbend    portk           kbend, kporttime
kcps2    =               kcps * octave(gkOctave) * semitone(kbend)

; keyboard scaling of index of modulation (c1)
kScale   pow             cpsmidinn(60)/kcps, 0.25
if gkAlg!=7 then ; no kybd scaling with FM Voice
 kc1      *=              kScale
endif

; keyboard scaling of sustain (FM Bell only). Shorter sustain for higher notes. Middle C (C3) is the unison point.
iScale   pow             cpsmidinn(60)/icps, 0.5
isus     *=              iScale

; stereo detune
kDetune  cabbageGetValue "detune"

kInvIndices =  ((1-cabbageGetValue:k("InvIndices"))*2)-1

if gkAlg==1 then
; (algorithm 5. sus.default=4
aL       fmbell          kamp, kcps2*cent(kDetune),  kc1*100, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5, isus
aR       fmbell          kamp, kcps2*cent(-kDetune), kc1*100*kInvIndices, -kc2, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5, isus
elseif gkAlg==2 then
aL       fmmetal         kamp, kcps2*cent(kDetune),  kc1*50, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmmetal         kamp, kcps2*cent(-kDetune), kc1*50*kInvIndices, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
elseif gkAlg==3 then
aL       fmpercfl        kamp, kcps2*cent(kDetune),  kc1*100, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmpercfl        kamp, kcps2*cent(-kDetune), kc1*100*kInvIndices, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
elseif gkAlg==4 then
aL       fmrhode         kamp, kcps2*cent(kDetune),  kc1*300, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmrhode         kamp, kcps2*cent(-kDetune), kc1*300*kInvIndices, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
elseif gkAlg==5 then
aL       fmwurlie        kamp, kcps2*cent(kDetune),  kc1*50, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmwurlie        kamp, kcps2*cent(-kDetune), kc1*50*kInvIndices, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
elseif gkAlg==6 then
aL       fmb3            kamp, kcps2*cent(kDetune),  kc1*13, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmb3            kamp, kcps2*cent(-kDetune), kc1*13*kInvIndices, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
elseif gkAlg==7 then
aL       fmvoice         kamp, kcps2*cent(kDetune),  kc1*64, kc2*99, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmvoice         kamp, kcps2*cent(-kDetune), kc1*64, kc2*99, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
endif

aEnv     expsegr         0.001,0.01,1,0.2,0.001

; amplitude envelope
aAEnv    expsegr         0.001, i(gkAAtt)+1/kr, 1, i(gkADec)+1/kr, i(gkASus)+0.001, i(gkARel)+0.1, 0.001

kAmp     cabbageGetValue "Amp"  

aL       *=              aAEnv*kAmp
aR       *=              aAEnv*kAmp

if iVell2Ndx==1 then
aL       *=              iVel
aR       *=              iVel
endif

         outs            aL, aR

 ; reverb send
         chnmix          aL, "SendL"
         chnmix          aR, "SendR"
endin


instr REVERB
aInL     chnget          "SendL"
aInR     chnget          "SendR"
         chnclear        "SendL"
         chnclear        "SendR"

kRvbSend cabbageGetValue "RvbSend"
kRvbSize cabbageGetValue "RvbSize"
kRvbDamp cabbageGetValue "RvbDamp"

aL,aR    reverbsc        aInL*kRvbSend,aInR*kRvbSend,kRvbSize,kRvbDamp
         outs            aL,aR
endin

</CsInstruments>  

<CsScore>
i 1 0 z
i "REVERB" 0 z
</CsScore>

</CsoundSynthesizer>