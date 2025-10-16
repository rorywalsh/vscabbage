
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Resonator.csd
; Written by Iain McCurdy, 2012, 2021, 2025.



; Some bugs exist in this example such as filter explosion given certain settings (caution when changing 'Num' and 'Seperation Mode') 
; Less critical is that display of filter locations not completely accurate either.

; Based on the resony opcode

; resony is an implementation of a stack of second-order bandpass filters whose centre frequencies are arithmetically 
; related. 
; The 'bandwidth' and 'scaling mode' parameters are as they are in the reson opcode. 

; CONTROLS
; --------
; 'Base Freq.' (base frequency) defines the centre frequency of the first filter. 

; 'Sep' (separation) normally defines the separation between the lowest and highest filter in the stack in octaves. 
; How this relates to what the actual frequencies of filters will be depends upon which separation mode has been selected. 
; This is explained below. Note that in this example the operation of 'ksep' has been modified slightly to allow the 
; opcode to be better controlled from the GUI. These modifications are clarified below. Separation can be defined in 
; octaves using the knob 'Sep.oct.' or in semitones using the 'Sep.semi.' knob.
; Making changes to 'Sep.Semi', either via the slider or the number box, will causes changes in the 'Sep.Oct' slider and 
; number box (but not vice versa).


; 'Separation Mode' defines the the way additional reson filters are arranged according to the 'Sep' value'. 

; In 'oct.total' separation mode, the pitch interval between the base frequency and (base frequency + separation is divided 
; into equal intervals according to the number of filters that have been selected. Note that no filter is created at the 
; frequency of (base frequency + separation). For example: if separation=1 and num.filters=2, filters will be created at 
; the base frequency and a tritone above the base frequency (i.e. an interval of 1/2 and an octave). I suspect this is a 
; mistake in the opcode implementation so in this example I reScale the separation interval before passing it to the 
; resony opcode so that the interval between the lowest and highest filter in this mode will always be the interval 
; defined in the GUI.
 
; If 'hertz' separation mode is selected behaviour is somewhat curious. I have made some other modifications to the 
; values passed to the opcode to make this mode more controllable. Without these modifications, if number of filters is 
; '1' no filters would be created. The frequency relationship between filters in the stack always follows the harmonic 
; series. Both 'Base Frequency' and 'Separation' normally shift this harmonic stack of filters up or down, for this reason 
; I have disabled user control of 'Separation' in this mode, instead a value equal to the 'Number of Filters' will always 
; be used for 'Separation'. This ensures that a harmonic stack will always be created built upon 'Base Frequency' as the 
; fundamental. Negative values for 'separation' are allowed whenever 'separation mode' is 'octaves' (if this is the case, 
; the stack of frequencies will extend below the base frequency). Negative values for 'separation' when 'separation mode' 
; is 'hertz' will cause filters to 'explode'. As 'Separation' is fixed at 'Number of Filters' in this example this 
; explosion will not occur.

; A third option I have provided allows the defined interval to be the interval between adjacent filters rather than the 
; interval from lowest to highest. In this mode it is probably wise to keep the separation value lowish, or reduce the 
; number of filters (or both), otherwise filters with very high frequencies might be being requested. This could potentially
; lead to some rather unpleasant distortion. In actuality there is some protection against this (discussed later on).

; INPUT           -  choose audio input between:
;                    1. Live audio input (stereo)
;                    2. Pink Noise
;                    3. Popcorn (band-pass-filtered impulses)

; BASE FREQ MODE  -  method for defining the base frequency for the stack of band-pass filters. Choose from:
;                    1. Frequency dial
;                    2. Note number dial
;                    3. Defined by MIDI keys played

; Base Freq.      -  Base frequency for the stack of filters (in hertz)
; Base Num.       -  Base frequency for the stack of filters defined as a MIDI note number
; Base Num.       -  Base frequency for the stack of filters defined as a MIDI note number. Polyphony possible.
; MIDI TUNING     -  tuning system used when playing MIDI keys

; 'B.width'       -  bandwidth of the filters (in hertz).
; 'Num.'          -  number of band-pass filters in the stack.

; Separation between filters can be defined in two ways. These two methods are represented by paired dials:
; Sep. Semi       -  separation between filters in semitones
; Sep. Ratio      -  separation between filters as a frequency ratio

; Dry Level       -  level of dry signal
; Filt. Level     -  level of the filtered signal
; Mix             -  crossfade between the dry and filtered signal
; Out Gain        -  output gain control (of both dry and filtered signals)

; Detune (switch) -  if activated, a second filter stack, detuned by a specified amount, is created
; Cents           -  detuning amount (in cents) of the second filter stack 

; Highpass        -  activates and selects a high-pass filter applied to the audio output. The cutoff frequency is defined as a ratio with the fundemental
; Ratio           -  cutoff frequency defined as a ratio with the fundamental
; Res.            -  filter resonance (if the resonant filter is chosen)

; Lowpass         -  activates and selects a low-pass filter applied to the audio output. The cutoff frequency is defined as a ratio with the fundemental
; Ratio           -  cutoff frequency defined as a ratio with the fundamental
; Res.            -  filter resonance (if the resonant filter is chosen)

; Bandpass        -  activates and selects a band-pass filter applied to the audio output. The cutoff frequency is defined as a ratio with the fundemental
; Ratio           -  cutoff frequency defined as a ratio with the fundamental
; Bandwidth       -  filter resonance (if the resonant filter is chosen)

; Separation Mode -  method used in spreading the band-pass filters in the stack. Choose 1 of 3 options. 
;                    1. octs.total    - spacing between lowest and highest filters (in hertz)
;                    2. hertz         - spacing between adjacent filters (in hertz). This creates a harmonic stack.
;                    3. octs.adjacent - spacing between adjacent filters (in octaves). This creates a harmonic stack.

; 'Scaling Mode'  -    provides options for scaling the amplitude of the filters. If 'none' is chosen output
;                 amplitude can increase greatly, particularly if bandwidth is narrow (a low value).
;                

; In addition a lowpass and highpass filter have been added after the resony filter
;
;         +--------+   +----------+   +---------+
; INPUT---+ RESONY +---+ HIGHPASS +---+ LOWPASS +---OUTPUT
;         +--------+   +----------+   +---------+
;
; The cutoff frequencies of each of these filters are defined as ratios relative to the base frequency. 
;
; Unpleasant sounds can result if reson filters are given too high cutoff frequencies. This can occur through a combination
; of the settings for 'BF' (base frequency), 'Num.' (number of filters), 'Sep.' (separation) and 'Separation Mode'. This 
; instrument features a safety measure whereby if this is going to happen the 'Num.' value will be reduced. If you notice
; the 'Num.' slider moving by itself while you are making adjustments to other controls this is the reason. This safety 
; mechanism is most likely to cut when 'Octs Adjacent' mode is selected. 


<Cabbage>

form caption("Resonator") size(900,340), pluginId("rsny"), guiMode("queue")
image           bounds(  0,  0,900,340), colour(40,40,45), shape("rounded"), outlineColour(255,200,200), outlineThickness(2) 

label     bounds( 10,  8, 80, 12), text("Input")
combobox  bounds( 10, 21, 80, 20), channel("input"), value(1), text("Live", "Pink Noise", "Popcorn")

label     bounds( 10, 46, 80, 11), text("Base Freq.Mode")
combobox  bounds( 10, 58, 80, 20), channel("basemode"), value(1), text("Dial Freq.", "Dial Num.", "MIDI")

image     bounds( 70, 10,230, 70) colour(0,0,0,0), channel("MIDITuningID"), visible(0) 
{
label     bounds( 30, 17, 83, 12), text("MIDI TUNING")
combobox  bounds( 30, 30, 83, 20), channel("Tuning"), items("12-TET", "24-TET", "12-TET rev.", "24-TET rev.", "10-TET", "36-TET", "Just C", "Just C#", "Just D", "Just D#", "Just E", "Just F", "Just F#", "Just G", "Just G#", "Just A", "Just A#", "Just B"), value(1),fontColour("white")
}

#define RSLIDER_ATTRIBUTES fontColour("white"), colour(165,140,160), trackerColour(225,200,220) popupText(0), valueTextBox(1)

rslider   bounds( 90, 10, 70, 80), text("Base Freq."), channel("bf"), range(20, 20000, 909, 0.5), $RSLIDER_ATTRIBUTES
rslider   bounds( 90, 10, 70, 80), text("Base Num."), channel("bNum"), range(0, 128, 36, 1, 0.01), visible(0) $RSLIDER_ATTRIBUTES

rslider   bounds(185, 10, 70, 80), text("B.width"), channel("bw"), range(0.005, 500, 13, 0.375, 0.0001), $RSLIDER_ATTRIBUTES
rslider   bounds(245, 10, 70, 80), text("Num."), channel("num"),  range(1, 80, 10, 1,1), $RSLIDER_ATTRIBUTES
image     bounds(363, 50, 14,  2), alpha(0.5)
rslider   bounds(305, 10, 70, 80), text("Sep.semi."), channel("sepSemi"), range(-48, 48, 12,1), $RSLIDER_ATTRIBUTES
rslider   bounds(365, 10, 70, 80), text("Sep.ratio."), channel("sepRatio"), range(1, 4, 2,1), $RSLIDER_ATTRIBUTES



rslider   bounds(480, 10, 70, 80), text("Dry.Level"), channel("DryGain"), range(0,1,0.5,0.5,0.001), $RSLIDER_ATTRIBUTES
rslider   bounds(540, 10, 70, 80), text("Filt.Level"), channel("FiltGain"), range(0,1,0.02,0.5,0.001), $RSLIDER_ATTRIBUTES
rslider   bounds(600, 10, 70, 80), text("Mix"), channel("mix"), range(0,1,1), $RSLIDER_ATTRIBUTES
rslider   bounds(660, 10, 70, 80), text("Out Gain"), channel("OutGain"), range(0,1,0.5), $RSLIDER_ATTRIBUTES

image     bounds(740, 10,140, 90), colour(0,0,0,0), outlineColour(150,150,150), outlineThickness(1), corners(5) 
{
checkbox  bounds(  5,  5,100, 15), text("Detune"), channel("Detune")
rslider   bounds( 70,  5, 70, 80), text("Cents"), channel("DetuneAmt"), range(-50, 50, -10, 1,0.1), $RSLIDER_ATTRIBUTES
}


image     bounds( 10,105,200, 80), colour(0,0,0,0), outlineColour(150,150,150), outlineThickness(1), corners(5)
{
label     bounds( 10, 15, 70, 13), text("Highpass")
combobox  bounds( 10, 30, 70, 20), channel("HPFmode"), value(1), text("Off","12dB/oct","24dB/oct","36dB/oct","48dB/oct","60dB/oct","Resonant")
rslider   bounds( 80,  5, 60, 70), text("Ratio"), channel("HPF_Ratio"), range(0.1, 16, 0.1, 0.5,0.0001), $RSLIDER_ATTRIBUTES
rslider   bounds(135,  5, 60, 70), channel("HPFres"), text("Res."), range(0,1.00,0), $RSLIDER_ATTRIBUTES
}

image     bounds(220,105,200, 80), colour(0,0,0,0), outlineColour(150,150,150), outlineThickness(1), corners(5)
{
label     bounds( 10, 15, 70, 13), text("Lowpass")
combobox  bounds( 10, 30, 70, 20), channel("LPFmode"), value(1), text("Off","12dB/oct","24dB/oct","36dB/oct","48dB/oct","60dB/oct","Resonant")
rslider   bounds( 80,  5, 60, 70), text("Ratio"), channel("LPF_Ratio"), range(0.1, 32, 32, 0.25,0.001), $RSLIDER_ATTRIBUTES
rslider   bounds(135,  5, 60, 70), channel("LPFres"), text("Res."), range(0,1.00,0), $RSLIDER_ATTRIBUTES
}

image     bounds(430,105,200, 80), colour(0,0,0,0), outlineColour(150,150,150), outlineThickness(1), corners(5)
{
label     bounds( 10, 15, 70, 13), text("Bandpass")
combobox  bounds( 10, 30, 70, 20), channel("BPFmode"), value(1), text("Off","12 dB/oct","24 dB/oct","36 dB/oct","48 dB/oct","60 dB/oct")
rslider   bounds( 80,  5, 60, 70), text("Ratio"), channel("BPF_Ratio"), range(0.1, 32, 1.5, 0.25,0.001), $RSLIDER_ATTRIBUTES
rslider   bounds(135,  5, 60, 70), channel("BPFBW"), text("B.Width"), range(0.01, 2.00, 0.1), $RSLIDER_ATTRIBUTES
}

image     bounds(640,105,200, 80), colour(0,0,0,0), outlineColour(150,150,150), outlineThickness(0), corners(5)
{
label     bounds(  0,  0,100, 13), text("Separation Mode")
combobox  bounds(  0, 15,100, 20), channel("sepmode"), value(1), text("octs.total", "hertz", "octs.adjacent")
label     bounds(  0, 35,100, 13), text("Scaling Mode")
combobox  bounds(  0, 50,100, 20), channel("scl"), value(3), text("none", "peak response", "RMS")
}

; indicators
image     bounds(  5,195,890, 30), colour(0,0,0), outlineColour(150,150,150), outlineThickness(1)
image     bounds(-30,196,  1, 28), colour(255,255,210), widgetArray("Indic", 80)    ; indicators
label     bounds(  5,226, 40, 11), text("0 Hz."), textColour("white"), align("left")
label     bounds(855,226, 40, 11), text("sr/5 Hz."), textColour("white"), align("left")


rslider   bounds(765,245, 65, 75), text("Attack"), channel("Attack"), range(0.01, 12, 2, 0.5, 0.01), $RSLIDER_ATTRIBUTES
rslider   bounds(825,245, 65, 75), text("Release"), channel("Release"), range(0.01, 12, 5, 0.5, 0.01), $RSLIDER_ATTRIBUTES
keyboard  bounds(  5,245,750,80)

label   bounds(  5, 327,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32  ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =                   2   ; NUMBER OF CHANNELS (2=STEREO)
0dbfs              =                   1

massign 0,2

; Author: Iain McCurdy (2012,2021)

; tuning tables
;                    FN_NUM | INIT_TIME | SIZE | GEN_ROUTINE | NUM_GRADES | REPEAT |  BASE_FREQ  | BASE_KEY_MIDI | TUNING_RATIOS:-0-|----1----|---2----|----3----|----4----|----5----|----6----|----7----|----8----|----9----|----10-----|---11----|---12---|---13----|----14---|----15---|---16----|----17---|---18----|---19---|----20----|---21----|---22----|---23---|----24----|----25----|----26----|----27----|----28----|----29----|----30----|----31----|----32----|----33----|----34----|----35----|----36----|
giTTable1   ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(60),      60,                       1, 1.059463,1.1224619,1.1892069,1.2599207,1.33483924,1.414213,1.4983063,1.5874001,1.6817917,1.7817962, 1.8877471,     2 ;STANDARD
giTTable2   ftgen      0,         0,       64,       -2,          24,          2,   cpsmidinn(60),      60,                       1, 1.0293022,1.059463,1.0905076,1.1224619,1.1553525,1.1892069,1.2240532,1.2599207,1.2968391,1.33483924,1.3739531,1.414213,1.4556525,1.4983063, 1.54221, 1.5874001, 1.6339145,1.6817917,1.73107,  1.7817962,1.8340067,1.8877471,1.9430623,    2  ;QUARTER TONES
giTTable3   ftgen      0,         0,       64,       -2,          12,        0.5,   cpsmidinn(60),      60,                       2, 1.8877471,1.7817962,1.6817917,1.5874001,1.4983063,1.414213,1.33483924,1.2599207,1.1892069,1.1224619,1.059463,      1 ;STANDARD REVERSED
giTTable4   ftgen      0,         0,       64,       -2,          24,        0.5,   cpsmidinn(60),      60,                       2, 1.9430623,1.8877471,1.8340067,1.7817962,1.73107, 1.6817917,1.6339145,1.5874001,1.54221,  1.4983063, 1.4556525,1.414213,1.3739531,1.33483924,1.2968391,1.2599207,1.2240532,1.1892069,1.1553525,1.1224619,1.0905076,1.059463, 1.0293022,    1  ;QUARTER TONES REVERSED
giTTable5   ftgen      0,         0,       64,       -2,          10,          2,   cpsmidinn(60),      60,                       1, 1.0717734,1.148698,1.2311444,1.3195079, 1.4142135,1.5157165,1.6245047,1.7411011,1.8660659,     2 ;DECATONIC
giTTable6   ftgen      0,         0,       64,       -2,          36,          2,   cpsmidinn(60),      60,                       1, 1.0194406,1.0392591,1.059463,1.0800596, 1.1010566,1.1224618,1.1442831,1.1665286,1.1892067,1.2123255,1.2358939,1.2599204,1.284414,1.3093838, 1.334839, 1.3607891,1.3872436,1.4142125,1.4417056,1.4697332,1.4983057,1.5274337,1.5571279,1.5873994, 1.6182594,1.6497193, 1.6817909, 1.7144859, 1.7478165, 1.7817951, 1.8164343, 1.8517469, 1.8877459, 1.9244448, 1.9618572,      2  ;THIRD TONES
giTTable7   ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(60),      60,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable8   ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(61),      61,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable9   ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(62),      62,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable10  ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(63),      63,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable11  ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(64),      64,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable12  ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(65),      65,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable13  ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(66),      66,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable14  ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(67),      67,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable15  ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(68),      68,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable16  ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(69),      69,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable17  ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(70),      70,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable18  ftgen      0,         0,       64,       -2,          12,          2,   cpsmidinn(71),      71,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2  ;JUST INTONATION                                                                                                                                                                                                                                   

;A UDO IS CREATED WHICH ENCAPSULATES THE MODIFICATIONS TO THE resony OPCODE DISCUSSED IN THIS EXAMPLE 
opcode resony2, a, akkikii
 ain, kbf, kbw, inum, ksep , isepmode, iscl    xin

 ;IF 'Octaves (Total)' MODE SELECTED...
 if isepmode==0 then
  ireScale         divz                inum,inum-1,1    ; PREVENT ERROR IF NUMBER OF FILTERS = ZERO
  ksep             =                   ksep * ireScale  ; RESCALE SEPARATION
   
 ;IF 'Hertz' MODE SELECTED...
 elseif isepmode==1 then
  inum             =                   inum + 1         ; AMEND QUIRK WHEREBY NUMBER RESONANCES PRODUCED IN THIS MODE WOULD ACTUALLY BE 1 FEWER THAN THE VALUE DEMANDED
  ksep             =                   inum             ; ksep IS NOT ESSESNTIAL IN THIS MODE, IT MERELY DOUBLES AS A BASE FREQUENCY CONTROL. THEREFORE SETTING IT TO NUMBER OF BANDS ENSURES THAT BASE FREQUENCY WILL ALWAYS BE DEFINED ACCURATELY BY kbf VALUE
          
 ;IF 'Octaves (Adjacent)' MODE SELECTED...
 elseif isepmode==2 then 
  ireScale         divz                inum,inum-1,1    ; PREVENT ERROR IF NUMBER OF FILTERS = ZERO
  ksep             =                   ksep * ireScale  ; RESCALE SEPARATION
  ksep             =                   ksep * (inum-1)  ; RESCALE SEPARATION INTERVAL ACCORDING TO THE NUMBER OF FILTERS CHOSEN
  isepmode         =                   0                ; ESSENTIALLY WE ARE STILL USING MODE:0, JUST WITH THE ksep RESCALING OF THE PREVIOUS LINE ADDED     

 endif
 
 aout              resony              ain, kbf, kbw, inum, ksep , isepmode, iscl
                   xout                aout
endop


; multiple-iteration highpass filter
opcode ButhpIt, a, akip
aIn,kCF,iNum,iCnt xin
aOut               =                   0 
aOut               buthp               aIn, kCF
if iCnt<iNum then
 aOut              ButhpIt             aOut, kCF, iNum, iCnt+1
endif
                   xout                aOut
endop



; multiple-iteration lowpass filter
opcode ButlpIt, a, akip
aIn,kCF,iNum,iCnt xin
aOut               =                   0
aOut               butlp               aIn, kCF
if iCnt<iNum then
 aOut              ButlpIt             aOut, kCF, iNum, iCnt+1
endif
                   xout                aOut
endop

; multiple-iteration bandpass filter
opcode ButbpIt, a, akkip
aIn,kCF,kBW,iNum,iCnt xin
aOut               =                   0 
aOut               butbp               aIn, kCF, kBW
if iCnt<iNum then
 aOut              ButbpIt             aOut, kCF, kBW, iNum, iCnt+1
endif
                   xout                aOut
endop


instr    1
 kporttime         linseg              0, 0.001, 0.005
 kbasemode         cabbageGetValue     "basemode"
 gkDetune          cabbageGetValue     "Detune"
 gkDetuneAmt       cabbageGetValue     "DetuneAmt"
 gkHPFres          cabbageGetValue     "HPFres"
 gkLPFres          cabbageGetValue     "LPFres"
 gkBPFmode         cabbageGetValue     "BPFmode"
 gkBPF_Ratio       cabbageGetValue     "BPF_Ratio"
 gkBPF_Ratio       portk               gkBPF_Ratio, kporttime
 gkBPFBW           cabbageGetValue     "BPFBW"

 ; show/hide relevant GUI controls
 if changed:k(kbasemode)==1 then
  if kbasemode==1 then
                   event               "i",2,0,-1
                   cabbageSet          1, "bf", "visible", 1      
                   cabbageSet          1, "bNum", "visible", 0
                   cabbageSet          1, "MIDITuningID", "visible", 0      
  elseif kbasemode==2 then
                   event               "i",2,0,-1
                   cabbageSet          1, "bf", "visible", 0      
                   cabbageSet          1, "bNum", "visible", 1
                   cabbageSet          1, "MIDITuningID", "visible", 0      
  else
                   event               "i",-2,0,-1
                   cabbageSet          1, "bf", "visible", 0 
                   cabbageSet          1, "bNum", "visible", 0
                   cabbageSet          1, "MIDITuningID", "visible", 1 
  endif
 endif
 
endin




instr    2
 kporttime         linseg              0, 0.001, 0.005, 1, 0.05  ; CREATE A VARIABLE FUNCTION THAT RAPIDLY RAMPS UP TO A SET VALUE    
 
 loop:
 kbf               cabbageGetValue     "bf"
 kbf               *=                  cent((p1-2) * 15)
 kbNum             cabbageGetValue     "bNum"
 kbasemode         cabbageGetValue     "basemode"
 if  kbasemode==2 then
  kbf              =                   cpsmidinn(kbNum)
 endif
 gkbw              cabbageGetValue     "bw"
 kDryGain          cabbageGetValue     "DryGain"
 gkFiltGain        cabbageGetValue     "FiltGain"
 kmix              cabbageGetValue     "mix"
 gkFiltGain        portk               gkFiltGain, kporttime
 kOutGain          cabbageGetValue     "OutGain"
 gknum             cabbageGetValue     "num"
 
 gksepSemi,kT      cabbageGetValue     "sepSemi"              ; octaves
                   cabbageSetValue     "sepRatio", semitone(gksepSemi), kT
 gksepRatio,kT     cabbageGetValue     "sepRatio"             ; ratio
                   cabbageSetValue     "sepSemi", log2(gksepRatio)*12, kT
 
 
 gksepmode         cabbageGetValue     "sepmode"
 gksepmode         =                   gksepmode - 1
 gksepmode         init                1
 gkscl             cabbageGetValue     "scl"
 gkscl             =                   gkscl - 1
 gkscl             init                1
 gkinput           cabbageGetValue     "input"
 gkHPFmode         cabbageGetValue     "HPFmode"
 kHPF_Ratio        cabbageGetValue     "HPF_Ratio"
 gkLPFmode         cabbageGetValue     "LPFmode"
 kLPF_Ratio        cabbageGetValue     "LPF_Ratio"   
 kbf               portk               kbf, kporttime         ; SMOOTH MOVEMENT OF SLIDER VARIABLES
 ksepSemi          portk               gksepSemi, kporttime
 ksep              =                   ksepSemi / 12 ; convert to octaves
 kLPF_Ratio        portk               kLPF_Ratio, kporttime
 kHPF_Ratio        portk               kHPF_Ratio, kporttime
          
 ; INDICATORS
 if changed:k(gknum)==1 then
  kcnt             =                   1
  while kcnt<=80 do
   Smsg            sprintfk            "visible(%d)", kcnt<=gknum?1:0
   SID             sprintfk            "Indic_ident%d", kcnt
                   cabbageSet          1, SID, Smsg
  kcnt += 1
  od
 endif
 
 if metro:k(20)==1 then
  if changed:k(int(kbf),ksep,gknum,gksepmode)==1 then
   kcnt            =                   1
   while kcnt<=gknum do
    if gksepmode==0 then
     kIntvl        =                   kbf * ( octave( (kcnt-1) * (ksep/gknum) ) )
     Smsg          sprintfk            "pos(%d,196)", (kIntvl / ( (sr/5) - 20 ) ) * 890
    elseif gksepmode==1 then
     kIntvl        =                   kbf + (kbf * (kcnt-1) ) 
     Smsg          sprintfk            "pos(%d,196)", (kIntvl / ( (sr/5) - 20 ) ) * 890
    else
     kIntvl        =                   kbf * ( octave( (kcnt-1) * ksep) )
     Smsg          sprintfk            "pos(%d,196)", (kIntvl / ( (sr/5) - 20 ) ) * 890
    endif
    SID            sprintfk            "Indic_ident%d", kcnt
                   cabbageSet          1, SID, Smsg
   kcnt            +=                  1
   od
  endif
 endif
 

 /* MIDI AND GUI INTEROPERABILITY */
 iMIDIflag         =                   0                    ; IF MIDI ACTIVATED = 1, NON-MIDI = 0
                   mididefault         1, iMIDIflag         ; IF NOTE IS MIDI ACTIVATED REPLACE iMIDIflag WITH '1'
 
 if iMIDIflag==1 then                ; IF THIS IS A MIDI ACTIVATED NOTE...
  iTuning          cabbageGetValue     "Tuning"                  ; select tuning table
  icps             cpstmid             giTTable1 + iTuning - 1   ; read cps from tuning table
  kBend            pchbend             0, 12                     ; read MIDI pitch bend
  kBend            portk               kBend, kporttime * 5      ; lag-smooth pitch bend changes 
  kbf              =                   icps * semitone(kBend)    ; calculate resony base frequency based on note played and pitch bend
  kMod             midic7              1, 1, 0                   ; modulation wheel
  kMod             expcurve            kMod, 16                  ; warp linear mod. wheel values
  kMod             portk               kMod, kporttime*5         ; smooth mod. wheel changes
  gkbw             =                   0.005 + (gkbw * kMod)     ; mod wheel controls bandwidth
  ; envelope
  iAttack          cabbageGetValue     "Attack"
  iRelease         cabbageGetValue     "Release"
  aAtt             cosseg              0, iAttack, 1
  aRel             transegr            1,  iRelease, -8, 0
  aEnv             =                   aAtt * aRel
 else ; otherwise envelope is a constant '1'
  aEnv             =                   1
 endif                        

 ; audio input
 if gkinput==1 then
  asigL, asigR     ins
 elseif gkinput==2 then
  asigL            pinker
  asigR            pinker
 else
  asigL            gausstrig           5,8,1
  asigR            gausstrig           5,8,1
  kcfoct           randomh             5, 11, 10
  kcf              =                   cpsoct(kcfoct)
  asigL            butbp               asigL, kcf, kcf * 0.1
  asigR            butbp               asigR, kcf, kcf * 0.1  
 endif

 ; DISCERN FREQUENCY OF HIGHEST RESON DEPENDING ON SEPARATION MODE CHOSEN
 if gksepmode==0 then
  kmax             =                   gknum==1 ? kbf : kbf * abs(ksep) * 2
 elseif gksepmode==1 then
  kmax             =                   kbf * gknum
 else
  kmax             =                   gknum==1 ? kbf : kbf * (gknum-1) * abs(ksep) * 2
 endif

 ; TEST HIGHEST RESON FREQUENCY. 
 ; IF IT IS TOO HIGH, UNPLEASANT NOISE WILL BE PRODUCED SO REDUCE THE NUMBER OF RESONS THEN LOOP BACK (AND TEST AGAIN)
 if kmax>(sr/5) then                                   ; things seems to start to sound unpleasant if resons are placed at frequencies sr/5 or higher    
                   cabbageSetValue     "num", gknum-1
                   kgoto               loop            ; and loop back (in order to test again)
 endif


 kSwitch           changed             gkscl, gknum, gksepmode  ; GENERATE A MOMENTARY '1' PULSE IN OUTPUT 'kSwitch' IF ANY OF THE SCANNED INPUT VARIABLES CHANGE. (OUTPUT 'kSwitch' IS NORMALLY ZERO)
 if kSwitch==1 then                                             ; IF I-RATE VARIABLE CHANGE TRIGGER IS '1'...
     reinit    START                                            ; BEGIN A REINITIALISATION PASS FROM LABEL 'START'
 endif
 START:
 
 isepmode          init                i(gksepmode)
 inum              init                i(gknum)    
 iscl              init                i(gkscl)
 
 ; call resony2 UDO
 aresL             resony2             asigL, kbf*(gkDetune==1?cent(-gkDetuneAmt):1), gkbw, inum, ksep , isepmode, iscl
 aresR             resony2             asigR, kbf*(gkDetune==1?cent(-gkDetuneAmt):1), gkbw, inum, ksep , isepmode, iscl

 ; detune; add an additional voice
 if gkDetune==1 then
  aresL             +=                 resony2:a(asigL, kbf*cent(gkDetuneAmt), gkbw, inum, ksep , isepmode, iscl)
  aresR             +=                 resony2:a(asigR, kbf*cent(gkDetuneAmt), gkbw, inum, ksep , isepmode, iscl)
 endif
 
 rireturn    ;RETURN FROM REINITIALISATION PASS TO PERFORMANCE TIME PASSES

 ; highpass filter
 if gkHPFmode>1 then
  if gkHPFmode==7 then
   aresL           bqrez               aresL, kbf*kHPF_Ratio, 1+(gkHPFres*40), 1
   aresR           bqrez               aresR, kbf*kHPF_Ratio, 1+(gkHPFres*40), 1
  else
   if changed:k(gkHPFmode)==1 then
                   reinit              RESTART_FILTER
   endif
   RESTART_FILTER:
   aresL           ButhpIt             aresL, kbf*kHPF_Ratio, i(gkHPFmode) - 1
   aresR           ButhpIt             aresR, kbf*kHPF_Ratio, i(gkHPFmode) - 1
   rireturn
  endif    
 endif

 ; lowpass filter
 if gkLPFmode>1 then
  kLFP_CF  limit   kbf*kLPF_Ratio, 1, sr/2
  if gkLPFmode==7 then
   aresL           bqrez               aresL, kLFP_CF, 1+(gkLPFres*40), 0
   aresR           bqrez               aresR, kLFP_CF, 1+(gkLPFres*40), 0
  else
   if changed:k(gkLPFmode)==1 then
                   reinit              RESTART_FILTER2
   endif
   RESTART_FILTER2:
   aresL           ButlpIt             aresL, kLFP_CF, i(gkLPFmode) - 1
   aresR           ButlpIt             aresR, kLFP_CF, i(gkLPFmode) - 1
   rireturn
  endif    
 endif
 
 ; bandpass filter
 if gkBPFmode>1 then
    kBFP_CF  limit   kbf*gkBPF_Ratio, 1, sr/3
    if changed:k(gkBPFmode)==1 then
                   reinit              RESTART_FILTER3
    endif
    RESTART_FILTER3:
    aresL          ButbpIt             aresL, kBFP_CF, kBFP_CF * gkBPFBW, i(gkBPFmode) - 1
    aresR          ButbpIt             aresR, kBFP_CF, kBFP_CF * gkBPFBW, i(gkBPFmode) - 1
                   rireturn 
 endif
 
 ; envelope filter
 aresL             zdf_2pole           aresL, aEnv * sr/2, 0.5
 aresR             zdf_2pole           aresR, aEnv * sr/2, 0.5
 
 ; dcblock
 aresL            dcblock2             aresL
 aresR            dcblock2             aresR
 
 ; output mix
 amixL             ntrpol              asigL * kDryGain, aresL * gkFiltGain, kmix
 amixR             ntrpol              asigR * kDryGain, aresR * gkFiltGain, kmix
 
                   outs                amixL * aEnv * kOutGain, amixR * aEnv * kOutGain    ; SEND FILTER OUTPUT TO THE AUDIO OUTPUTS AND SCALE USING THE FLTK SLIDER VARIABLE gkgain
endin





instr    UpdateWidgets

endin

</CsInstruments>

<CsScore>
i 1 0.1 z
i "UpdateWidgets" 0 z    ;UPDATE SEPARATION DISPLAY BOX
</CsScore>

</CsoundSynthesizer>
