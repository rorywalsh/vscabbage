
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; HarmonicEtcher.csd
; Written by Iain McCurdy, 2025.

; This effect implements a stack of bandpass filters located at harmonic locations starting from a defined fundamental up to 1/3 of the sample rate. 
; The stack isn't continued up to the Nyquist as many of these filters will be redundant and also to allow the bandwidths to be opened up while avoiding filters blowing up.

; For each filter location, multiple filters can be added in series (Iteration) to steepen the slope. The Butterworth filter is used.

; If a harmonic source is used, its fundamental can be detected using the 'DETECT' button. 


; Audio Input       -  choose the audio input:
;                       1. Live (stereo) input
;                       2. Noise (white). Useful for testing.
;                       3. Sound file input. Browse for a file first.
;                       4. Buzz sound (all harmonics), the frequency of which is set using the CPS dial.

; Pre. Filt.        -  a low-pass filter applied to the audio signal before passing into the stack of band-pass filters
; Open File         -  browse for a sound file
; Play              -  play sound file
; Speed             -  ratio of playback speed 


; FILTER
; Fund. Input       -  select a method for inputting the fundamental frequency for the harmonic stack of filters:
;                       1. CPS (cycles-per-second)
;                       2. Note Num. (MIDI note number)
;                      toggling this control will swap in the relevant GUI control
; B.W. Mode         -  method used to calculate bandwidth of each harmonic band-pass filter
;                       1. Harmonic - bandwidth local to each iteration of the stack as a musical interval related to the frequency of *the specific harmonic*
;                       2. Fundamental - bandwidth local to each iteration of the stack as a musical interval related to the frequency of *the fundamental*
; CPS               -  frequency of the fundamental (in cycles per second) of the harmonic array of frequencies which will define the sequence of frequencies of the bandpass filters
;                       this is i-rate so when changes are made, discontinuities in the audio output stream can result. Normally it should be set and then real time modifications made to other controls.
; Note Num.         -  similar function to CPS but expressed as a MIDI note number
;  Note that the MIDI keyboard can also be used to set both the 'CPS' and 'Note Num.' controls. The effect remains monophonic even if multiple MIDI keys are held down
;  The tuning of the MIDI keyboard can be changed between a range of options.
; Mult.             -  integer multiplied to fundamental frequency values. Also affects sound file playback speed.
;                       this is i-rate so when changes are made, discontinuities in the audio output stream can result. Normally it should be set and then real time modifications made to other controls. 
; Div.              -  integer by which fundamental frequency value is divided. Also affects sound file playback speed.
;                       this is i-rate so when changes are made, discontinuities in the audio output stream can result. Normally it should be set and then real time modifications made to other controls. 
; Tuning            -  shifts the tuning of all filters in the range -1200 to 1200 cents
; Detune            -  shifts the tuning of each filter in the stack by a random amount in a random direction (bipolar gaussian distribution)
; Detune Link       -  Detuning values for each iteration of a harmonic are the same, otherwise they will be different.
;                       For the effect of this to be audible, Iterations will need to be greater than 1 and Detune will need to be non-zero.


; Bandwidth         -  bandwidth of the frequencies (in octaves) 
; Iterations        -  number of iterations of the series bandpass filters used for each harmonic. This will greater increase CPU load as it is increased.
; First (i)         -  the harmonic number of the first band-pass filter. Set to 1 for the fundamental
; Step-Size         -  step size (in degrees of the harmonic series) between consecutive members of the filter stack. For a full harmonic series this should be set to '1'.
; Limit             -  a hard limit on the number of filters generated.
;                      The complete number of filters needed to reach the Nyquist frequency is first calculated - this is dependent upon the Fundamental frequency and the sample rate.
;                      If the fundamental frequency is very low, the number of filters needed to reach the Nyquist could be very high. This might even invoke excessive CPU demands.
;                      Reducing 'Limit' can prevent CPU overloads. It can also modify the brightness of the timbre produced.
;                      If 'First' exceeds 'Limit', all filters will be cancelled out.
; High Freq. Atten. - arithmetically increasing amount of attenuation applied to each filter up thre harmonic stack (defined in decibels)
; First (k)         - first harmonic in the stack; set to '1' to begin from the fundamental. This is enacted using high-pass filtering of the band-pass stack, therefore smooth results can be achived when modulating this control in real-time.
; Choose between 12 dB/oct (Butterworth) or 6 dB/oct (1st order)
; Balance           - when active, balances filter output signal with dry input signal. This can be useful for compensating for energy loss due to aggressive filtering.

; E.Q.
; HPF               - this button applies a 12 db/oct high-pass filter before any other processing, therefore affects both the dry and filtered signals at the MIXER
;                      cutoff frequency is determined by the 'First' and 'Fundamental' settings
; BPF               - this button activates a band-pass filter which is applied to the signal returning from the stack of band-pass filters controlled in the FILTER section.
;                     the centre frequency of this filter is defined in relation to the fundamental of the harmonic filter therefore it can be used to 'pick out' numbered harmonics.
; Harm. Num.        - the harmonic number over which the band-pass filter will be centred
; Glide             - even though the centre frequency is defined in integer steps using 'Harm. Num.', Glide time will apply a lag to these changes.
; Bandwidth         - the bandwidth (in octaves) of this band-pass filter
; 12 db/Oct / 24 dB/oct - chooses the steepness of the rolloff of the filter beyond its pass-band.

; DETECT PITCH
;  When the button is pressed, the fundamental of the input audio is printed to the adjacent number box (in hertz).
;  This detected value is not applied directly to the 'Fundamental' control so that the use can decide whether it is valid and then adjust 'Fundamental' manually if desired.

; TUNING
; Tuning system used by the keyboard.

; MIXER
; Dry Gain          - gain applied to the dry signal that is fed to the output
; Filter Gain       - gain applied to the filters output
; Crossfade         - crossfading mixer between the dry and filtered signals. 0 = 100% dry, 1 = 100% filters
; Output Gain       - master gain control of both dry and wet signals. Can be useful in containing a clipping output signal or boosting a weak one.

; The vertical slider to the right of the spectroscope adjust the gain of the display. It does not affect the audio output level.
 
<Cabbage>
form caption("Harmonic Filter"), size(1265,575), colour(90,70,70), pluginId("HaFi"), guiMode("queue")
image                    bounds(  0,  0,1265,575), file("DarkBrushedMetal.jpeg"), colour( 70, 35, 30), outlineColour("White"), shape("sharp"), line(3)

#define SLIDER_DESIGN1 colour(200,200,200), markerColour("black"), trackerColour(230,230,250)
#define SLIDER_DESIGN2 colour(255,100,100), markerColour("black"), trackerColour(230,230,250)


image    bounds(  5,  5,200,185), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label      bounds(  5, 10, 80, 13), text("Audio Input"), align("centre")
combobox   bounds(  5, 30, 80, 20), channel("AudioInput"), items("Live","Noise","File","Buzz"), value(1)

rslider    bounds(  5, 80, 80, 90), channel("PreFilt"), text("Pre. Filt."), valueTextBox(1), trackerColour("DarkSlateGrey"), range(20,20000,20000,0.5,1)

filebutton bounds(105, 10, 80, 25), text("Open File","Open File"), fontColour("White") channel("filename"), shape("ellipse"), corners(5)
checkbox   bounds(105, 50, 80, 20), channel("OnOff"), value(0), text("Play/Stop"), colour:0(50,50,20), colour:1(255,255,100)
rslider    bounds(105, 80, 80, 90), channel("speed"), text("Speed"), valueTextBox(1), trackerColour("DarkSlateGrey"), range(0,8,1,0.5)
}

soundfiler bounds(210,  5, 685,185), channel("beg","len"), channel("filer1"), colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
image      bounds(210,  5,   1,185), channel("wiper") ;, colour(0,0,0,100)
label      bounds(215,  7, 200, 14), text(""), align("left"), channel("FileName"), fontColour("White")
; spectroscope
signaldisplay bounds( 900,  5,340,185), colour("LightBlue"), alpha(0.85), displayType("spectroscope"), backgroundColour("Black"), zoom(-1), signalVariable("aSig", "a2z"), channel("display");, fontColour(0,0,0,0)
vslider       bounds(1245,  5, 10,185), channel("SpecGain"), range(1, 50, 1, 0.5), valueTextBox(0) ;, $SLIDER_DESIGN1

image    bounds(  5,200,1250,125), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,1250, 13), text("B A N D P A S S    F I L T E R S"), align("centre"), fontColour("White")
label    bounds( 10, 25, 80, 13), text("CPS Input"), align("centre")
combobox bounds( 10, 40, 80, 20), channel("FundInput"), items("Dial","Note Num."), value(1)
rslider  bounds( 90, 25, 80, 90), text("CPS"), channel("FundCPS"), range(1,  5000, 165, 0.5, 0.1), valueTextBox(1), $SLIDER_DESIGN2
rslider  bounds( 90, 25, 80, 90), text("Note Num."), channel("FundNN"), range(1,128, 57, 1, 0.001), valueTextBox(1), $SLIDER_DESIGN2, visible(0)
image    bounds(158, 70, 14,  1), colour(200,200,200) ; joiner
image    bounds(228, 70, 14,  1), colour(200,200,200) ; joiner
rslider  bounds(160, 25, 80, 90), text("Mult."), channel("FundMult"), range(1,  32, 1, 1, 1), valueTextBox(1), $SLIDER_DESIGN2
rslider  bounds(230, 25, 80, 90), text("Div."), channel("FundDiv"), range(1,  32, 1, 1, 1), valueTextBox(1), $SLIDER_DESIGN2
rslider  bounds(300, 25, 80, 90), text("Tuning"), channel("Tuning"), range(-1200,1200, 0, 1, 0.1), valueTextBox(1), $SLIDER_DESIGN1
rslider  bounds(370, 25, 80, 90), text("Detune"), channel("Detune"), range(-1200,1200, 0, 1, 0.1), valueTextBox(1), $SLIDER_DESIGN1
checkbox bounds(445, 60,100, 15), channel("DetuneLink"), text("Detune Link"), colour:0(50,50,20), colour:1(255,255,100) 
image    bounds(580, 70, 34,  1), colour(200,200,200) ; joiner
rslider  bounds(535, 25, 80, 90), text("Bandwidth"), channel("BW"), range(0.001, 1, 0.1, 0.5, 0.001), valueTextBox(1), $SLIDER_DESIGN1
label    bounds(610, 45,100, 13), text("Bandwidth Mode"), align("centre")
combobox bounds(610, 60,100, 20), channel("BandwidthMode"), items("Harmonic","Fundamental"), value(1)
rslider  bounds(715, 25, 80, 90), text("Iterations"), channel("Iter"), range(1, 20, 2, 1,1), valueTextBox(1), $SLIDER_DESIGN1
rslider  bounds(785, 25, 80, 90), text("First (i)"), channel("Firsti"), range(1, 50, 1, 1, 1), valueTextBox(1), $SLIDER_DESIGN2
rslider  bounds(855, 25, 80, 90), text("Step-Size"), channel("StepSize"), range(1, 16, 1, 1, 1), valueTextBox(1), $SLIDER_DESIGN2
rslider  bounds(925, 25, 80, 90), text("Limit"), channel("Limit"), range(1,999,100,0.4,1), valueTextBox(1), $SLIDER_DESIGN2
rslider  bounds(995, 25, 80, 90), text("High Freq. Atten."), channel("HiCut"), range(0, 48, 0.2, 0.5), valueTextBox(1), $SLIDER_DESIGN1
rslider  bounds(1065, 25, 80, 90), text("First (k)"), channel("First"), range(1, 50, 1, 1,1), valueTextBox(1), $SLIDER_DESIGN1
label    bounds(1145, 25, 90, 13), text("Type"), align("centre")
combobox bounds(1145, 40, 90, 20), channel("FiltType"), items("6 dB/oct","12 dB/oct", "ZDF"), value(2)
label    bounds(1145, 70, 90, 13), text("Balance"), align("centre")
hslider  bounds(1145, 85, 90, 15), channel("Balance"), range(0, 1, 0, 0.25, 0.000001), popupText(0)
}

;---

image    bounds(   5,335,400,125), colour(0,0,0,0), outlineThickness(1), corners(5)
{
checkbox bounds( 20, 50, 70, 15), channel("HPF"), text("HPF") ; , fontColour:0("White")
checkbox bounds( 20, 70, 70, 15), channel("BPF"), text("BPF") ; , fontColour:0("White")
image    bounds( 60,  0,320,115), colour(0,0,0,0), channel("BPFControls"), alpha(0.3), active(0)
 {
  rslider  bounds(  0, 25, 80, 90), text("Harm.Num."), channel("BPFNum"), range(1, 50, 5, 1,1), valueTextBox(1), $SLIDER_DESIGN1
  image    bounds( 67, 70, 26,  1), colour(200,200,200) ; joiner
  rslider  bounds( 80, 25, 80, 90), text("Glide"), channel("BPFGlide"), range(0.05, 1, 0.2), valueTextBox(1), $SLIDER_DESIGN1
  rslider  bounds(160, 25, 80, 90), text("Bandwidth"), channel("BPFBW"), range(0.01, 1, 0.25, 0.5), valueTextBox(1), $SLIDER_DESIGN1
  checkbox bounds(240, 50, 80, 15), channel("BPF12"), text("12 dB/oct"), radioGroup(1), value(1)
  checkbox bounds(240, 70, 80, 15), channel("BPF24"), text("24 dB/oct"), radioGroup(1)
  image    bounds( 20, 15,290,  1), colour("grey")
  label    bounds(150, 10, 30, 12), text("BPF"), fontColour("white"), colour(70,70,70)
 }
}

image      bounds(410,335,160,125), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label      bounds(  0,  5,160, 13), text("DETECT PITCH"), align("centre"), fontColour("White")
button     bounds( 20, 55, 55, 25), channel("Detect"), text("Detect","Detect"), corners(5), colour:0(100,100,130), colour:1(100,100,130), latched(0)
nslider    bounds( 80, 55, 60, 25), channel("DetectedPitch"), range(0,10000,0,0.5,0.1), active(0) 
}

image    bounds(575,335,310,125), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label   bounds(  0,  5,310, 13), text("F R E Q U E N C Y   S H I F T E R"), align("centre"), fontColour("White")
checkbox bounds( 20, 50, 70, 15), channel("FSOnOff"), text("On/Off")
rslider  bounds( 80, 25, 80, 90), text("Mult."), channel("FSMult"), range(0, 16, 2), valueTextBox(1), $SLIDER_DESIGN1
rslider  bounds(150, 25, 80, 90), text("Mix"), channel("FSMix"), range(0, 1, 1), valueTextBox(1), $SLIDER_DESIGN1
checkbox bounds(240, 50, 70, 15), channel("FSNeg"), text("-ve")
}

image    bounds(890,335,320,125), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label   bounds(  0,  5,320, 13), text("M I X E R"), align("centre"), fontColour("White")
image   bounds( 65, 70, 34,  1), colour(200,200,200) ; joiner
image   bounds(135, 70, 34,  1), colour(200,200,200)
rslider bounds( 15, 25, 80, 90), text("Dry Gain"), channel("DryGain"), range(0, 10, 1, 0.5), valueTextBox(1), $SLIDER_DESIGN1
rslider bounds( 85, 25, 80, 90), text("Crossfade"), channel("Crossfade"), range(0, 1, 1), valueTextBox(1), $SLIDER_DESIGN1
rslider bounds(155, 25, 80, 90), text("Filter Gain"), channel("FiltGain"), range(0, 100, 3.6, 0.5), valueTextBox(1), $SLIDER_DESIGN1
rslider bounds(225, 25, 80, 90), text("Output Gain"), channel("OutGain"), range(0, 10, 1, 0.5), valueTextBox(1), $SLIDER_DESIGN1
}


vmeter   bounds(1220,335, 15,110) channel("vMeter1") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 0, 0) meterColour:1(255, 255, 0) meterColour:2(100,250, 0) outlineThickness(1)
vmeter   bounds(1240,335, 15,110) channel("vMeter2") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 0, 0) meterColour:1(255, 255, 0) meterColour:2(100,250, 0) outlineThickness(1)
label    bounds(1220,445, 15, 15), text("L")
label    bounds(1240,445, 15, 15), text("R")

;---

image    bounds(  5,470,140, 90), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,140, 13), text("TUNING"), fontColour("White")
combobox bounds( 20, 35,100, 25), channel("Tuning"), items("12-TET", "24-TET", "12-TET rev.", "24-TET rev.", "10-TET", "36-TET", "Just C", "Just C#", "Just D", "Just D#", "Just E", "Just F", "Just F#", "Just G", "Just G#", "Just A", "Just A#", "Just B"), value(1),fontColour("white")
}

keyboard   bounds(150,470,1105, 90)


label    bounds(  5,561,120, 13), text("Iain McCurdy |2025|"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0 --displays
</CsOptions>

<CsInstruments>
;sr is set by host
ksmps   =   32
nchnls  =   2
0dbfs   =   1

; Author: Iain McCurdy (2025)


massign 0, 3 ; all MIDI notes to trigger instr 3

gSfilepath         init       ""
gSDropFile         init       ""
giSource           init       0 ; 0 = browser-opened file :: 1 = dropped file
giFileChans        init       0
gasigL,gasigR      init       0 ; sound file playback global audio variables
giCos              ftgen      0, 0, 131072, 11, 1

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


giRandDist    ftgen    0, 0, 4096, 21, 6, 1 ; list of random values corresponding to a gaussian distribution.

; UDO for iterative bandpass filters. Number of iterations controlled by 'Iterations' GUI dial. This UDO is called from the UDO HarmonicFilter
opcode RepeatFilter, a, aikkkkkkkiiii
aIn, iFundL, kFundL, kBWL, kBW, kFiltType, kTuning, kDetune, kDetuneLink, iRandDist, iCount, iIter, iIterCount xin

if kDetuneLink!=1 then
 iRandTuning        table               iCount * iIter, iRandDist               ; a unique random tuning offset for each harmonic member of the harmonic stack
 kFundL             limit               iFundL * cent(kTuning) * cent(iRandTuning * kDetune), 1, sr/2 ; apply tuning and random detune
endif

if kFiltType==1 then                                                  ; if 6 dB/oct filter slope chosen...
 aOut               reson              aIn, kFundL, kBWL, 1, -1
elseif kFiltType==2 then                                              ; otherwise 12 dB/oct filter slope is used
 aOut               butbp              aIn, kFundL, kBWL, -1
elseif kFiltType==3 then                                              ; otherwise ZDF filter is used
 alp, aOut, ahp     zdf_2pole_mode     aIn, kFundL, 0.5 + (24.5 * (1 - kBW^0.25))
endif

if iIterCount<iIter then                                              ; if iteration limit is not yet reached...
 aOut              RepeatFilter        aOut, iFundL, kFundL, kBWL, kBW, kFiltType, kTuning, kDetune, kDetuneLink, iRandDist, iCount, iIter, iIterCount + 1
endif
                   xout                aOut
endop


; UDO called from instr 1. This UDO will call UDO RepeatFilter if 'Iterations' is greater than 1.
opcode HarmonicFilter, a, aikkkikkikkiiki
aIn, iFund, kTuning, kDetune, kDetuneLink, iRandDist, kBW, kBandwidthMode, iStepSize, kFiltType, kHiCut, iIter, iTot, kFirst, iCount  xin

kRamp              =                   linseg:k(0,0.01,1)             ; ramps up quickly from zero to 1
iFundL             =                   iFund * iCount                 ; centre frequency local to this iteration
iRandTuning        table               iCount, iRandDist              ; a unique random tuning offset for each harmonic member of the harmonic stack
kFundL             limit               iFundL * cent(kTuning) * cent(iRandTuning*kDetune), 1, sr/2 ; apply tuning and random detune

if kBandwidthMode == 1 then ; harmonic mode
 kBWL               =                   iFundL * kBW                  ; bandwidth local to this iteration as a musical interval related to the frequency of this harmonic
else                        ; fundamental mode
 kBWL               =                   iFund * kBW                   ; bandwidth local to this iteration as a musical interval related to the frequency of the fundamental
endif
kBWL               limit               kBWL, 1, iFundL / 2            ; limit bandwidth value to prevent explosions
if kFiltType==1 then                                                  ; if 12 dB/oct filter slope chosen...
 aOut              reson               aIn, kFundL, kBWL, 1, -1
elseif kFiltType==2 then                                              ; otherwise 6 dB/oct filter slope is used
 aOut              butbp               aIn, kFundL, kBWL, -1
elseif kFiltType==3 then                                              ; otherwise ZDF filter is used
 alp, aOut, ahp     zdf_2pole_mode     aIn, kFundL, 0.5 + (24.5 * (1 - kBW^0.25))
endif

iIterCount         =                   1

if iIterCount<iIter then                                              ; if number of iterations requested is greater than 1...
 aOut             RepeatFilter        aOut, iFundL, kFundL, kBWL, kBW, kFiltType, kTuning, kDetune, kDetuneLink, iRandDist, iCount, iIter, iIterCount+1
endif

; High-frequency attenuation
kAtten             =                   ampdbfs((limit:k(iCount-kFirst,0,iTot)) * (-kHiCut))
kAtten             portk               kAtten, kRamp * 0.3
aOut               *=                  a(kAtten)

; Removal of low harmonics
kLoCut             =                   (iCount >= kFirst ? 1 : 0)
kLoCut             portk               kLoCut, kRamp
aOut               *=                  a(kLoCut)

aStack             =                   0 ; clear accumulating audio variable

if iCount < iTot then
 aStack            HarmonicFilter      aIn, iFund, kTuning, kDetune, kDetuneLink, iRandDist, kBW, kBandwidthMode, iStepSize, kFiltType, kHiCut, iIter, iTot, kFirst, iCount + iStepSize
endif
                   xout                aOut + aStack
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


instr   1
; SOUND FILE PLAYBACK
gkOnOff            cabbageGetValue     "OnOff"           ; play sound file
if trigger:k(gkOnOff, 0.5, 0) == 1 then
                   event               "i", 2, 0, 3600 * 24 * 7 * 365
endif

; load file from browse
gSfilepath         cabbageGetValue     "filename"        ; read in file path string from filebutton widget
if changed:k(gSfilepath)==1 then                         ; call instrument to update waveform viewer  
                   event               "i", 99, 0, 0
endif

; load file from dropped file
gSDropFile         cabbageGet      "LAST_FILE_DROPPED" ; file dropped onto GUI
if (changed(gSDropFile) == 1) then
                   event               "i",100,0,0       ; load dropped file
endif

kRamp              linseg              0, 0.001, 1

; show/hide control options
kFundInput,kT      cabbageGetValue     "FundInput"
                   cabbageSet          kT, "FundCPS", "visible", (kFundInput == 1 ? 1 : 0)
                   cabbageSet          kT, "FundNN", "visible", (kFundInput == 2 ? 1 : 0)


kFundCPS           cabbageGetValue     "FundCPS"
kFundCPS           init                165
kFundNN            cabbageGetValue     "FundNN"
kFund              =                   kFundInput == 1 ? kFundCPS : cpsmidinn(kFundNN)
gkFundMult         cabbageGetValue     "FundMult"
gkFundDiv          cabbageGetValue     "FundDiv"
kFund              *=                  gkFundMult / gkFundDiv
kTuning            cabbageGetValue     "Tuning"
kDetune            cabbageGetValue     "Detune"
kTuning            portk               kTuning, kRamp*0.1
kDetune            portk               kDetune, kRamp*0.1
kBW                cabbageGetValue     "BW"
kBW                portk               kBW, kRamp*0.1
kStepSize          cabbageGetValue     "StepSize"
kStepSize          init                1
kDryGain           cabbageGetValue     "DryGain"
kDryGain           portk               kDryGain, kRamp*0.1
kFiltGain          cabbageGetValue     "FiltGain"
kFiltGain          portk               kFiltGain, kRamp*0.1
kHiCut             cabbageGetValue     "HiCut"
kHiCut             portk               kHiCut, kRamp*0.3
kFirsti            cabbageGetValue     "Firsti"
kFirsti            init                1
kFirst             cabbageGetValue     "First"
kFirst             init                1
kIter              cabbageGetValue     "Iter"
kIter              init                1
kLimit             cabbageGetValue     "Limit"
kLimit             init                999
kCrossfade         cabbageGetValue     "Crossfade"
kCrossfade         portk               kCrossfade, kRamp*0.1
kFiltType          cabbageGetValue     "FiltType"
kFiltType          init                0
kBandwidthMode     cabbageGetValue     "BandwidthMode"
kDetuneLink        cabbageGetValue     "DetuneLink"
kPreFilt           cabbageGetValue     "PreFilt"
kOutGain           cabbageGetValue     "OutGain"

; audio input
kAudioInput        cabbageGetValue     "AudioInput"
if kAudioInput==1 then     ; live audio input
 aInL,aInR         ins
elseif kAudioInput==2 then ; white noise
 aInL              noise               0.1, 0
 aInR              noise               0.1, 0
elseif kAudioInput==3 then ; sound file
 aInL              =                   gasigL
 aInR              =                   gasigR
 gasigL            =                   0
 gasigR            =                   0
else
 aInL              gbuzz               0.2, kFundCPS, (sr*0.3) / kFundCPS, 1, 0.9, giCos
 aInR              =                   aInL
endif

; input high-pass filter
kHPF               cabbageGetValue     "HPF"
if kHPF==1 then
 aInL              buthp               aInL, kFund * portk:k(kFirst,kRamp*0.1)
 aInR              buthp               aInR, kFund * portk:k(kFirst,kRamp*0.1)
endif

; input low-pass filter
if kPreFilt<20000 then
 aInL              clfilt              aInL, kPreFilt, 0, 4, 0
 aInR              clfilt              aInR, kPreFilt, 0, 4, 0
endif


 ; detect pitch of source and set fundamental accordingly
kcps, krms         pitchamdf           aInL, 20, 5000
kDetect            cabbageGetValue     "Detect"
if trigger:k(kDetect,0.5,0)==1 then
                   cabbageSetValue     "DetectedPitch", kcps
endif

if changed:k(kFund,kIter,kFirsti,kStepSize,kLimit)==1 then
 reinit RESTART
endif
RESTART:
iTot               limit               int(sr/2/i(kFund)), 1, i(kLimit) + i(kFirst) - 1 ; total number of filter bands
iIter              =                   i(kIter)
aOutL              HarmonicFilter      aInL, i(kFund), kTuning, kDetune, kDetuneLink, giRandDist, kBW, kBandwidthMode, i(kStepSize), kFiltType, kHiCut, iIter, iTot, kFirst, i(kFirsti)
aOutR              HarmonicFilter      aInR, i(kFund), kTuning, kDetune, kDetuneLink, giRandDist, kBW, kBandwidthMode, i(kStepSize), kFiltType, kHiCut, iIter, iTot, kFirst, i(kFirsti)

; Frequency Shifter
kFSOnOff cabbageGetValue "FSOnOff"
if kFSOnOff==1 then
 kFSMult cabbageGetValue "FSMult"
 kFSNeg  =               (cabbageGetValue:k("FSNeg") * (-2)) + 1 
 kFSMix  cabbageGetValue "FSMix"
 aFSL	FreqShifter aOutL, i(kFund) * kFSMult * kFSNeg, giSine
 aFSR	FreqShifter aOutR, i(kFund) * kFSMult * kFSNeg, giSine
 aOutL   ntrpol      aOutL, aFSL, kFSMix
 aOutR   ntrpol      aOutR, aFSR, kFSMix
endif

rireturn



; additional global bandpass filter
kBPF,kT            cabbageGetValue     "BPF"
                   cabbageSet          kT, "BPFControls", "alpha", 0.3 + kBPF*0.7
                   cabbageSet          kT, "BPFControls", "active", kBPF

kBPFNum            cabbageGetValue     "BPFNum"
kBPFBW             cabbageGetValue     "BPFBW"
if kBPF==1 then
 kBPFFreq limit portk:k(kBPFNum,kRamp*cabbageGetValue:k("BPFGlide")) * kFund, 0, sr/3
 kBPFBW            limit               portk:k(kBPFBW,kRamp*0.1) * kBPFFreq, 1, sr - kBPFFreq
 aOutL             butbp               aOutL, kBPFFreq, kBPFBW, -1
 aOutR             butbp               aOutR, kBPFFreq, kBPFBW, -1
 if cabbageGetValue:k("BPF24")==1 then
  aOutL            butbp               aOutL, kBPFFreq, kBPFBW, -1
  aOutR            butbp               aOutR, kBPFFreq, kBPFBW, -1
 endif
endif

; output mixer
kBalance           cabbageGetValue     "Balance"
aBalL              balance             aOutL, aInL, 0.1
aBalR              balance             aOutR, aInR, 0.1
aOutL              ntrpol              aOutL, aBalL, kBalance
aOutR              ntrpol              aOutR, aBalR, kBalance

aOutL              *=                  kFiltGain ; filter output
aOutR              *=                  kFiltGain

aInL               *=                  kDryGain
aInR               *=                  kDryGain

aMixL              ntrpol              aInL, aOutL, kCrossfade
aMixR              ntrpol              aInR, aOutR, kCrossfade

aMixL              *=                  kOutGain
aMixR              *=                  kOutGain

                   outs                aMixL, aMixR

; spectroscope
kSpecGain          cabbageGetValue     "SpecGain"
aSig               sum                 aMixL, aMixR ; mix left and right channels
aSig               *=                  kSpecGain
;                  dispfft             xsig, iprd,  iwsiz [, iwtyp] [, idbout] [, iwtflg] [,imin] [,imax] 
                   dispfft             aSig, 0.001, 4096,      1,        0,         0,       0,      512


; meter
if metro:k(8)==1 then
                   reinit              REFRESH_METER
endif
REFRESH_METER:
kres               init                0
kres               limit               kres-0.001,0,1 
kres               peak                aMixL                            
                   rireturn
                   cabbageSetValue     "vMeter1", kres
if release:k()==1 then
                   cabbageSetValue     "vMeter1", k(0)
endif

kresR              init                0
kresR              limit               kresR-0.001,0,1 
kresR              peak                aMixR                            
                   rireturn
                   cabbageSetValue     "vMeter2", kres
if release:k()==1 then
                   cabbageSetValue     "vMeter2", k(0)
endif

endin





instr 2 ; file playback
if gkOnOff==0 then
                   turnoff
endif
kspeed             cabbageGetValue     "speed"
                   cabbageSetValue     "AudioInput", 3
kporttime          linseg              0,0.01,0.05
kspeed             portk               kspeed, kporttime
if giFileChans==1 then
 gasigL            diskin2             gSfilepath, kspeed * gkFundMult / gkFundDiv, 0, 1, 0, 8  
 gasigR            =                   gasigL
else
 gasigL,gasigR     diskin2             gSfilepath, kspeed * gkFundMult / gkFundDiv, 0, 1, 0, 8
endif

; wiper
kPtr               phasor              (kspeed * gkFundMult) / (filelen:i(gSfilepath) * gkFundDiv)
iWidgetBounds[]    cabbageGet          "filer1", "bounds"
                   cabbageSet          metro:k(16), "wiper", "bounds", iWidgetBounds[0] + (kPtr * iWidgetBounds[2]), iWidgetBounds[1], 1, iWidgetBounds[3] 

endin




instr 3
iTuning            cabbageGetValue     "Tuning"
iCPS               cpstmid             giTTable1 + iTuning - 1
                   cabbageSetValue     "FundCPS", iCPS
                   cabbageSetValue     "FundNN", ftom:i(iCPS)
endin






instr    99 ; LOAD SOUND FILE
giSource           =                   0
                   cabbageSet          "filer1", "file", gSfilepath
giFileChans        filenchnls          gSfilepath
/* write file name to GUI */
SFileNoExtension   cabbageGetFileNoExtension   gSfilepath
                   cabbageSet          "FileName","text",SFileNoExtension

endin

instr    100 ; LOAD DROPPED SOUND FILE
 giSource         =                    1
 giFileChans      filenchnls           gSfilepath
                  cabbageSet           "filer1", "file", gSDropFile

 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension   gSDropFile
                  cabbageSet           "FileName", "text", SFileNoExtension

endin



</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>