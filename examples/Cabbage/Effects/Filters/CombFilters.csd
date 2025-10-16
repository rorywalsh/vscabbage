/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; CombFilters.csd
; Written by Iain McCurdy 2023

; A set of six parallel comb filters

; Input:
; 1. LIVE Live input from computer's audio hardware or DAW channel
; 2. TEST White noise for testing

; In Gain - gain applied to audio input before entering comb filters
; LPF On  - turn on a low-pass filter applied to audio before entering the comb filters
; In LPF  - cutoff frequency of the low-pass filter
; HPF On  - turn on a high-pass filter applied to audio before entering the comb filters
; In HPF  - cutoff frequency of the high-pass filter

; Type    - opcode used to implement the comb filter
;           1. wguide1 - includes a low-pass filter within its feedback loop for a damping effect
;           2. streson - does not includes a low-pass filter within its feedback loop. Tuning may be more accurate.

; Iterations - number of repetitions of the comb filter. Used to sharpen the resonance and attenuate audio outside of the peak frequencies.

; Balance    - if active, the signal outputted from the comb filters is dynamically balanced with the input signal. 
;              In particular this is effective when modulating comb filter resonance controls which would normally result in great dynamic variation. 

; Legato     - amount of smoothing applied to changes in the frequencies of the comb filters

; FREQ. Freq. 1 - 5
; Frequency of the five comb filters.
; FREQ. is a global control of all five frequencies and is a multiplier.
; Freq. 1 - 5 - frequencies of the five comb filters. These values will hold true if the global multiplier, 'FREQ.' is '1'
;  (note that frequencies can also be set using the 'Note'; sliders or the keyboard via the 'Learn' buttons. 

; Quantise
;  quantise frequency (note) values to the nearest note. This does not alter widget values.

; LEARN - when any of these buttons are activated, the note/frequency of the comb filter in that row will be set by the next MIDI note played.

; Note. 1 - 5
; The pitch of each comb filter expressed as a note number.

; RES Res. 1 - 5
; RES - global control of all comb filters (multiplied to each individual value)
; Res. 1 - 5 - Resonance of each comb filter

; LP. LP. 1 - 5
; LP. - global control of the cutoff frequency of the low-pass filters within each comb filters (multiplied to each individual value)
; LP. 1 - 5 - cutoff frequency of the low-pass filters within each comb filters

; Gain, Gain 1 - 5
; Gain - global gain control
; Gain 1 - 5 - gain controls of each individual comb filter

; FREQUENCY SHIFTER
; A stereo frequency shifter applied to the output of the comb filters
; ON    - turn effect on and off
; LEARN - when activated, the frequency of the frequency shifter will be set by the next MIDI note pressed
; Freq  - frequency of the frequency shifter
; Mult. - multiplier applied to the frequency shifter's frequency value. This can also flip the frequency value into the negative domain.
; Mix   - mix between the frequency shifted signal and the signal before the frequency shifter. 
;          If these two signals are mixed, swirling spectral effects can be produced

; Mix   - mix between the dry and wet signals

<Cabbage>
form caption("Comb Filters") size(1460,440), guiMode("queue"), pluginId("CbFi"), colour(50,50,50)

image             bounds(   0,  0,1460, 60), colour(0,0,0,0), outlineThickness(2) ; upper area
{
 button   bounds(  20, 10, 70, 17), text("LIVE","LIVE"), channel("LiveInput"), latched(1), colour:1(70,70,30), colour:1(200,200,100), radioGroup(1), value(1)
 button   bounds(  20, 30, 70, 17), text("TEST","TEST"), channel("TestInput"), latched(1), colour:1(70,70,30), colour:1(200,200,100), radioGroup(1), value(0)
 hslider  bounds( 100, 20,230, 20), text("In Gain"), range(0,1,0), textColour("white"), channel("InGain"), valueTextBox(1)
 button   bounds( 350, 15, 60, 30), text("LPF On","LPF On"), channel("InLPOn"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white"), corners(5)
 hslider  bounds( 420, 20,230, 20), text("In LPF"),   range(20,20000,20000,0.5,1), textColour("white"), channel("InLP"), valueTextBox(1)
 button   bounds( 670, 15, 60, 30), text("HPF On","HPF On"), channel("InHPOn"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white"), corners(5)
 hslider  bounds( 740, 20,230, 20), text("In HPF"),   range(20,20000,20,0.5,1), textColour("white"), channel("InHP"), valueTextBox(1)
 label    bounds( 980, 10, 80, 15), text("Type"), align("centre")
 combobox bounds( 980, 25, 80, 20), items("wguide1","streson"), value(1), channel("Type"), align("centre")
 label    bounds(1090, 10, 80, 15), text("Iterations"), align("centre")
 combobox bounds(1090, 25, 80, 20), items("1","2","3","4","5","6","7","8"), value(1), channel("Iter"), align("centre")
 button   bounds(1200, 15, 60, 30), text("BALANCE"), channel("Balance"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white"), corners(5)
 hslider  bounds(1280, 20,180, 20), text("Legato"), range(0.001,0.5,0.1,0.5), textColour("white"), channel("PortTime"), valueTextBox(1)
}

image bounds(0, 60,1460,200), colour(0,0,0,0), outlineThickness(2) ; main area
{
 image   bounds( 10, 10,260,180), colour(0,0,0,0)
 {
  hslider bounds(  0,  0,260,20), text("FREQ"),   range(0.2,2,1,0.5), textColour("white"), channel("FREQ"), valueTextBox(1)
  hslider bounds(  0, 40,260,20), text("Freq.1"), range(10,8000,300,0.5), textColour("white"), channel("Freq1"), valueTextBox(1)
  hslider bounds(  0, 70,260,20), text("Freq.2"), range(10,8000,410,0.5), textColour("white"), channel("Freq2"), valueTextBox(1)
  hslider bounds(  0,100,260,20), text("Freq.3"), range(10,8000,133,0.5), textColour("white"), channel("Freq3"), valueTextBox(1)
  hslider bounds(  0,130,260,20), text("Freq.4"), range(10,8000,101,0.5), textColour("white"), channel("Freq4"), valueTextBox(1)
  hslider bounds(  0,160,260,20), text("Freq.5"), range(10,8000,237,0.5), textColour("white"), channel("Freq5"), valueTextBox(1)
 }

 image   bounds(280, 10,260,180), colour(0,0,0,0)
 {
  button  bounds( 0,  0, 60,20),  text("QUANTISE","QUANTISE"), channel("Quantise"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white")

  button bounds(  0, 40, 60, 20), text("LEARN"), channel("Learn1"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white")
  button bounds(  0, 70, 60, 20), text("LEARN"), channel("Learn2"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white")
  button bounds(  0,100, 60, 20), text("LEARN"), channel("Learn3"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white")
  button bounds(  0,130, 60, 20), text("LEARN"), channel("Learn4"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white")
  button bounds(  0,160, 60, 20), text("LEARN"), channel("Learn5"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white")
 }

 image   bounds(350, 10,260,180), colour(0,0,0,0)
 {
  hslider bounds(  0,  0,260, 20), text("NOTE"),   range(-48,48,0,1,0.01), textColour("white"), channel("NOTE"), valueTextBox(1)
  hslider bounds(  0, 40,260, 20), text("Note.1"), range(0,128,30), textColour("white"), channel("Note1"), valueTextBox(1)
  hslider bounds(  0, 70,260, 20), text("Note.2"), range(0,128,30), textColour("white"), channel("Note2"), valueTextBox(1)
  hslider bounds(  0,100,260, 20), text("Note.3"), range(0,128,30), textColour("white"), channel("Note3"), valueTextBox(1)
  hslider bounds(  0,130,260, 20), text("Note.4"), range(0,128,30), textColour("white"), channel("Note4"), valueTextBox(1)
  hslider bounds(  0,160,260, 20), text("Note.5"), range(0,128,30), textColour("white"), channel("Note5"), valueTextBox(1)
 }


 image   bounds(610, 10,260,180), colour(0,0,0,0)
 {
  hslider bounds(  0, 40,260, 20), text("Semi.1"), range(-2,2,0), textColour("white"), channel("Semi1"), valueTextBox(1), trackerColour(100,100,200)
  hslider bounds(  0, 70,260, 20), text("Semi.2"), range(-2,2,0), textColour("white"), channel("Semi2"), valueTextBox(1), trackerColour(100,100,200)
  hslider bounds(  0,100,260, 20), text("Semi.3"), range(-2,2,0), textColour("white"), channel("Semi3"), valueTextBox(1), trackerColour(100,100,200)
  hslider bounds(  0,130,260, 20), text("Semi.4"), range(-2,2,0), textColour("white"), channel("Semi4"), valueTextBox(1), trackerColour(100,100,200)
  hslider bounds(  0,160,260, 20), text("Semi.5"), range(-2,2,0), textColour("white"), channel("Semi5"), valueTextBox(1), trackerColour(100,100,200)
 }

 image   bounds(870, 10,260,180), colour(0,0,0,0)
 {
  hslider bounds(  0,  0,200, 20), text("RES"),   range(0,1,1,8), textColour("white"), channel("RES"), valueTextBox(1), trackerColour(100,100,200)
  hslider bounds(  0, 40,200, 20), text("Res.1"), range(0,1,0.98,8), textColour("white"), channel("Res1"), valueTextBox(1), trackerColour(100,100,200)
  hslider bounds(  0, 70,200, 20), text("Res.2"), range(0,1,0.98,8), textColour("white"), channel("Res2"), valueTextBox(1), trackerColour(100,100,200)
  hslider bounds(  0,100,200, 20), text("Res.3"), range(0,1,0.98,8), textColour("white"), channel("Res3"), valueTextBox(1), trackerColour(100,100,200)
  hslider bounds(  0,130,200, 20), text("Res.4"), range(0,1,0.98,8), textColour("white"), channel("Res4"), valueTextBox(1), trackerColour(100,100,200)
  hslider bounds(  0,160,200, 20), text("Res.5"), range(0,1,0.98,8), textColour("white"), channel("Res5"), valueTextBox(1), trackerColour(100,100,200)
 }

 image   bounds(1065, 10,260,180), colour(0,0,0,0), channel("LPFcontrols")
 {
  hslider bounds(  0,  0,200, 20), text("LP"),   range(0,1,1,0.5), textColour("white"), channel("LP"), valueTextBox(1), trackerColour(255,255,100)
  hslider bounds(  0, 40,200, 20), text("LP 1"), range(0,18000,12000,0.5,1), textColour("white"), channel("LP1"), valueTextBox(1), trackerColour(255,255,100)
  hslider bounds(  0, 70,200, 20), text("LP 2"), range(0,18000,12000,0.5,1), textColour("white"), channel("LP2"), valueTextBox(1), trackerColour(255,255,100)
  hslider bounds(  0,100,200, 20), text("LP 3"), range(0,18000,12000,0.5,1), textColour("white"), channel("LP3"), valueTextBox(1), trackerColour(255,255,100)
  hslider bounds(  0,130,200, 20), text("LP 4"), range(0,18000,12000,0.5,1), textColour("white"), channel("LP4"), valueTextBox(1), trackerColour(255,255,100)
  hslider bounds(  0,160,200, 20), text("LP 5"), range(0,18000,12000,0.5,1), textColour("white"), channel("LP5"), valueTextBox(1), trackerColour(255,255,100)
 }

 image   bounds(1260, 10,260,180), colour(0,0,0,0)
 {
  hslider bounds(  0,  0,200, 20), text("GAIN"),   range(0,1,0.5), textColour("white"), channel("GAIN"), valueTextBox(1), trackerColour(0,255,255)
  hslider bounds(  0, 40,200, 20), text("Gain 1"), range(0,1,1), textColour("white"), channel("Gain1"), valueTextBox(1), trackerColour(0,255,255)
  hslider bounds(  0, 70,200, 20), text("Gain 2"), range(0,1,1), textColour("white"), channel("Gain2"), valueTextBox(1), trackerColour(0,255,255)
  hslider bounds(  0,100,200, 20), text("Gain 3"), range(0,1,1), textColour("white"), channel("Gain3"), valueTextBox(1), trackerColour(0,255,255)
  hslider bounds(  0,130,200, 20), text("Gain 4"), range(0,1,1), textColour("white"), channel("Gain4"), valueTextBox(1), trackerColour(0,255,255)
  hslider bounds(  0,160,200, 20), text("Gain 5"), range(0,1,1), textColour("white"), channel("Gain5"), valueTextBox(1), trackerColour(0,255,255)
 }
}

image   bounds(   0,260,1460,100), colour(0,0,0,0), outlineThickness(2) ; 
{
 combobox bounds( 20, 35, 83, 20), channel("Tuning"), items("12-TET", "24-TET", "12-TET rev.", "24-TET rev.", "10-TET", "36-TET", "Just C", "Just C#", "Just D", "Just D#", "Just E", "Just F", "Just F#", "Just G", "Just G#", "Just A", "Just A#", "Just B"), value(1),fontColour("white")
 keyboard bounds(130, 10,1200, 80)
}

image   bounds(   0,360,875,60), colour(0,0,0,0), outlineThickness(2) ; 
{
 label   bounds(  0,  5,875,13), text("F R E Q U E N C Y    S H I F T E R")
 button  bounds( 10, 25, 60,20),  text("ON","ON"), channel("FSOnOff"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white")
 button  bounds( 80, 25, 60,20), text("LEARN"), channel("LearnFS"), latched(1), colour:0(80,80,0), colour:1(200,200,0), fontColour:0(150,150,50), fontColour:1("white")
 hslider bounds(150, 25,240,20), text("Freq."), range(0,7000,100,0.5), textColour("white"), channel("FS"), valueTextBox(1), trackerColour(200,100,100)
 hslider bounds(395, 25,240,20), text("Mult."), range(-1,1,1), textColour("white"), channel("FSMult"), valueTextBox(1), trackerColour(200,100,100)
 hslider bounds(640, 25,240,20), text("Mix"), range(0,1,1), textColour("white"), channel("FSMix"), valueTextBox(1), trackerColour(200,100,100)
}

image   bounds(875,360, 585,60), colour(0,0,0,0), outlineThickness(2) ; 
{
 label   bounds(  0,  5,585,13), text("D R Y / W E T   M I X")
 hslider bounds( 10, 25,565,20), text("MIX"), range(0,1,1), textColour("white"), channel("MIX"), valueTextBox(1), trackerColour(200,100,100)
}

label   bounds(  5,423,120, 12), text("Iain McCurdy |2023|"), align("left"), fontColour("silver")
</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-n -dm0 -+rtmidi=NULL -M0
</CsOptions>
<CsInstruments>
; Initialize the global variables. 
ksmps  = 32
nchnls = 2
0dbfs  = 1

massign 0, 0

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



opcode wguide1Iter, a, aakkiip
aIn, aFreq, kLPF, kRes, iType, iIter, iCount xin
if iType==1 then
 aOut wguide1  aIn, aFreq, kLPF, kRes
else
 aOut streson  aIn, k(aFreq), kRes
endif

aMix =        aOut
if iCount<iIter then
 aMix wguide1Iter  aOut*0.05, aFreq, kLPF, kRes, iType, iIter, iCount+1
endif
xout aMix
endop

opcode SyncWidgets, 0, SSkk
S1, S2, k1, k2 xin
if  changed:k(k1)==1 then
 cabbageSetValue S2, k1
elseif  changed:k(k2)==1 then
 cabbageSetValue S1, k2
endif
endop

opcode KeybdToWidget, 0, kkkSS
kLearn, kStatus, kNote, Swidg, Sbut xin
if kLearn==1 then
 if kStatus==144 then
  cabbageSetValue Swidg, kNote
  cabbageSetValue Sbut, 0, 1
 endif
endif
endop

opcode	FreqShifter,a,aki
asig,kfshift,ifn xin
areal, aimag hilbert asig
asin    oscili 1, kfshift, ifn, 0
acos    oscili 1, kfshift, ifn, 0.25
amod1   = areal * acos
amod2   = aimag * asin	
ares    = (amod1 - amod2)
        xout ares
endop

giSine ftgen 0,0,4097,10,1

instr 1
kFREQ     cabbageGetValue "FREQ"
kFreq1    cabbageGetValue "Freq1"
kFreq2    cabbageGetValue "Freq2"
kFreq3    cabbageGetValue "Freq3"
kFreq4    cabbageGetValue "Freq4"
kFreq5    cabbageGetValue "Freq5"

kNOTE     cabbageGetValue "NOTE"
kNote1    cabbageGetValue "Note1"
kNote2    cabbageGetValue "Note2"
kNote3    cabbageGetValue "Note3"
kNote4    cabbageGetValue "Note4"
kNote5    cabbageGetValue "Note5"

          SyncWidgets     "Freq1", "Note1", ftom(kFreq1), mtof(kNote1)
          SyncWidgets     "Freq2", "Note2", ftom(kFreq2), mtof(kNote2)
          SyncWidgets     "Freq3", "Note3", ftom(kFreq3), mtof(kNote3)
          SyncWidgets     "Freq4", "Note4", ftom(kFreq4), mtof(kNote4)
          SyncWidgets     "Freq5", "Note5", ftom(kFreq5), mtof(kNote5)

kLearn1   cabbageGetValue "Learn1"
kLearn2   cabbageGetValue "Learn2"
kLearn3   cabbageGetValue "Learn3"
kLearn4   cabbageGetValue "Learn4"
kLearn5   cabbageGetValue "Learn5"
kLearnFS   cabbageGetValue "LearnFS"

kStatus, kchan, kdata1, kdata2  midiin ; read in MIDI

  ;iNum        notnum
  ;kTuning     cabbageGetValue    "Tuning"
  ;iCPS        cpstmid            giTTable1 + iTuning - 1    
  ;iMlt        =                  iCPS/cpsmidinn(60)

 ; kcps cpstun ktrig, kindex, kfn 

          KeybdToWidget   kLearn1, kStatus, kdata1, "Note1", "Learn1"
          KeybdToWidget   kLearn2, kStatus, kdata1, "Note2", "Learn2"
          KeybdToWidget   kLearn3, kStatus, kdata1, "Note3", "Learn3"
          KeybdToWidget   kLearn4, kStatus, kdata1, "Note4", "Learn4"
          KeybdToWidget   kLearn5, kStatus, kdata1, "Note5", "Learn5"
          KeybdToWidget   kLearnFS, kStatus, kdata1, "FS", "LearnFS"

kSemi1    cabbageGetValue "Semi1"
kSemi2    cabbageGetValue "Semi2"
kSemi3    cabbageGetValue "Semi3"
kSemi4    cabbageGetValue "Semi4"
kSemi5    cabbageGetValue "Semi5"

kRES      cabbageGetValue "RES"
kRes1     cabbageGetValue "Res1"
kRes2     cabbageGetValue "Res2"
kRes3     cabbageGetValue "Res3"
kRes4     cabbageGetValue "Res4"
kRes5     cabbageGetValue "Res5"

kLP       cabbageGetValue "LP"
kLP1      cabbageGetValue "LP1"
kLP2      cabbageGetValue "LP2"
kLP3      cabbageGetValue "LP3"
kLP4      cabbageGetValue "LP4"
kLP5      cabbageGetValue "LP5"

kGAIN       cabbageGetValue "GAIN"
kGain1      cabbageGetValue "Gain1"
kGain2      cabbageGetValue "Gain2"
kGain3      cabbageGetValue "Gain3"
kGain4      cabbageGetValue "Gain4"
kGain5      cabbageGetValue "Gain5"

kMIX       cabbageGetValue "MIX"

kInGain  cabbageGetValue  "InGain"
kInLPOn  cabbageGetValue  "InLPOn"
kInLP    cabbageGetValue  "InLP"
kInHPOn  cabbageGetValue  "InHPOn"
kInHP    cabbageGetValue  "InHP"

kQuantise     cabbageGetValue "Quantise"
if kQuantise==1 then
 kFreq1    = cpsmidinn(round(ftom(kFreq1)))
 kFreq2    = cpsmidinn(round(ftom(kFreq2)))
 kFreq3    = cpsmidinn(round(ftom(kFreq3)))
 kFreq4    = cpsmidinn(round(ftom(kFreq4)))
 kFreq5    = cpsmidinn(round(ftom(kFreq5)))
endif

kRamp     linseg 0, 0.01, 1
kPortTime =      kRamp * cabbageGetValue:k("PortTime")

kFREQ     portk          kFREQ, kPortTime
kFreq1    portk          kFreq1, kPortTime
kFreq2    portk          kFreq2, kPortTime
kFreq3    portk          kFreq3, kPortTime
kFreq4    portk          kFreq4, kPortTime
kFreq5    portk          kFreq5, kPortTime
kSemi1    portk          kSemi1, kPortTime
kSemi2    portk          kSemi2, kPortTime
kSemi3    portk          kSemi3, kPortTime
kSemi4    portk          kSemi4, kPortTime
kSemi5    portk          kSemi5, kPortTime

kLP     portk          kLP, kPortTime
kLP1    portk          kLP1, kPortTime
kLP2    portk          kLP2, kPortTime
kLP3    portk          kLP3, kPortTime
kLP4    portk          kLP4, kPortTime
kLP5    portk          kLP5, kPortTime

kGAIN     portk          kGAIN, kPortTime
kGain1    portk          kGain1, kPortTime
kGain2    portk          kGain2, kPortTime
kGain3    portk          kGain3, kPortTime
kGain4    portk          kGain4, kPortTime
kGain5    portk          kGain5, kPortTime

kMIX     portk          kMIX, kPortTime

kInGain   portk          kInGain, kPortTime
kInLP     portk          kInLP, kPortTime
kInHP     portk          kInHP, kPortTime

kLiveInput cabbageGetValue "LiveInput"
kTestInput cabbageGetValue "TestInput"
if kLiveInput==1 then
 aL,aR  ins
else
 aL  noise  0.1,0
 aR  noise  0.1,0
endif

aL  *=  kInGain
aR  *=  kInGain

if kInLPOn==1 then
 aL  butlp  aL, kInLP
 aR  butlp  aR, kInLP
endif

if kInHPOn==1 then
 aL  buthp  aL, kInHP
 aR  buthp  aR, kInHP
endif

kIter cabbageGetValue "Iter"
kIter init 1
kType cabbageGetValue "Type"
kType init 1

cabbageSet changed:k(kType), "LPFcontrols", "visible", 1 - (kType - 1)

if changed:k(kIter, kType)==1 then
 reinit RESTART
endif
RESTART: 

a1L wguide1Iter  aL, a(kFreq1*kFREQ*semitone(kSemi1)*semitone(kNOTE)), kLP1*kLP, kRes1*kRES, i(kType), i(kIter)
a2L wguide1Iter  aL, a(kFreq2*kFREQ*semitone(kSemi2)*semitone(kNOTE)), kLP2*kLP, kRes2*kRES, i(kType), i(kIter)
a3L wguide1Iter  aL, a(kFreq3*kFREQ*semitone(kSemi3)*semitone(kNOTE)), kLP3*kLP, kRes3*kRES, i(kType), i(kIter)
a4L wguide1Iter  aL, a(kFreq4*kFREQ*semitone(kSemi4)*semitone(kNOTE)), kLP4*kLP, kRes4*kRES, i(kType), i(kIter)
a5L wguide1Iter  aL, a(kFreq5*kFREQ*semitone(kSemi5)*semitone(kNOTE)), kLP5*kLP, kRes5*kRES, i(kType), i(kIter)

a1R wguide1Iter  aR, a(kFreq1*kFREQ*semitone(kSemi1)*semitone(kNOTE)), kLP1*kLP, kRes1*kRES, i(kType), i(kIter)
a2R wguide1Iter  aR, a(kFreq2*kFREQ*semitone(kSemi2)*semitone(kNOTE)), kLP2*kLP, kRes2*kRES, i(kType), i(kIter)
a3R wguide1Iter  aR, a(kFreq3*kFREQ*semitone(kSemi3)*semitone(kNOTE)), kLP3*kLP, kRes3*kRES, i(kType), i(kIter)
a4R wguide1Iter  aR, a(kFreq4*kFREQ*semitone(kSemi4)*semitone(kNOTE)), kLP4*kLP, kRes4*kRES, i(kType), i(kIter)
a5R wguide1Iter  aR, a(kFreq5*kFREQ*semitone(kSemi5)*semitone(kNOTE)), kLP5*kLP, kRes5*kRES, i(kType), i(kIter)
rireturn

aMixL   sum  a1L*a(kGain1), a2L*a(kGain2), a3L*a(kGain3), a4L*a(kGain4), a5L*a(kGain5) 
aMixR   sum  a1R*a(kGain1), a2R*a(kGain2), a3R*a(kGain3), a4R*a(kGain4), a5R*a(kGain5)

kFS      cabbageGetValue "FS"
kFSOnOff cabbageGetValue "FSOnOff"
kFSMult  cabbageGetValue "FSMult"
kFS     portk          kFS * kFSMult, kPortTime
if kFSOnOff==1 then
 aFSL FreqShifter aMixL, kFS, giSine
 aFSR FreqShifter aMixR, kFS, giSine
 kFSMix   cabbageGetValue "FSMix"
 aMixL ntrpol aMixL, aFSL, kFSMix
 aMixR ntrpol aMixR, aFSR, kFSMix
endif


aMixL   dcblock2 aMixL
aMixR   dcblock2 aMixR

if cabbageGetValue:k("Balance")==1 then
 aMixL balance aMixL, aL
 aMixR balance aMixR, aR
endif

aMixL   ntrpol  aL,aMixL,kMIX
aMixR   ntrpol  aR,aMixR,kMIX

        outs     aMixL*a(kGAIN),aMixR*a(kGAIN)
endin


</CsInstruments>
<CsScore>
i 1 0 z
</CsScore>
</CsoundSynthesizer>
