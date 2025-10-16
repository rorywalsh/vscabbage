
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Synverb.csd
; Written by Iain McCurdy, 2024.

; WHEN USED WITH AN OPEN MIC AND SPEAKERS, FEEDBACK IS LIKELY! FOR THIS REASON, 'Input Gain' DEFAULTS TO ZERO. RAISE IT CAUTIOUSLY!

; The effect generates and impulse response (IR) synthetically which is then used in convolution to produce a reverb like effect (or special effect) to an incoming audio stream.

; There are four basic source sounds for the IR:
; 1 - white noise
; 2 - pink noise
; 3 - impulses (variable from periodic to random). Delay effects are possible if random factors are at zero. At high densities and with the use of randomness, reverb effects are produced
; 4 - chirp - a sine sweep in which the trajectories of the amplitude and frequency can be designed. Can be used to produce spring reverb-like results.

; The duration of this IR is defined and it can then be transformed by a number of means, applying envelopes that change across its duration.
; 1 - AMPLITUDE          - a two-segment amplitude envelope
; 2 - LOWPASS FILTER     - a two-segment envelope that controls the cutoff frequency of a lowpass filter.
;                           Three types of lowpass filter are available: 6dB/oct, 12dB/oct, resonant
; 3 - HIGHPASS FILTER    - a two-segment envelope that controls the cutoff frequency of a highpass filter.
;                           Three types of highpass filter are available: 6dB/oct, 12dB/oct, resonant
; 4 - HARMONIC RESONANCE - this transformer applies two pairs of string resonators to the impulse response created.
;                           The resonance is controllable by the envelope

; 5 - IMPULSES           - This envelope (available when 'Impulses' is chosen for 'Source') is not applied to the IR but is used in the definition of the density of the impulses IR.
; 5 - IMPULSES           - This pair of single-segment envelopes (available when 'Chirp' is chosen for 'Source') is not applied to the IR but is used in the shaping of a sinusoidal sweep as the source.

; Impulse responses can be exported as stereo wav files for use in other software that accepts that format.
;  Files will be 24 bit, match the current Cabbage sample rate and can be found in the homr directory named 'IR' followed by the current date and time.

; INPUT          -  mono (left channel) or stereo input
; SOURCE         -  sound source for impulse response IR. White noise, pink noise or gaussian dust
; Partition Len. - Partition length (in sample frames) used in the convolution. Smaller values reduces latency but increases CPU load.
; EXPORT         -  export the current impulse response
; TEST           -  emit a short click into the convolution reverb for testing purposes

; Input Gain     -  gain applied to the live input stream. TEST sound is unaffected by this.
; Rvb. Time      -  duration of the impulse response in seconds.
; Dry Delay      -  delay time applied to the dry signal. This can be useful to bring the dry signal in sync with some point within the IR. 
;                    The position of this delay is indicated by a vertical white line over the IR and graphs.
; Dry            -  level of the dry signal
; Wet            -  level of the wet signal (convolution signal)
; Level          -  level of the mix of both the dry and wet signals

; A M P L I T U D E - Design of the graph for amplitude across the duration of the impulse response IR
; Level 1        -  first breakpoint value in the envelope
; Curve 1        -  curve shape between Level 1 and Level 2
; Mid Point      -  location of Level two as a ratio between the start and end of the graph
; Level 2        -  second breakpoint value in the envelope
; Curve 2        -  curve shape between Level 2 and Level 3
; Level 3        -  third breakpoint value in the envelope
; Gain           -  gain applied to the entire IR

; L O W P A S S   F I L T E R - Design of the graph for a low-pass filter across the duration of the impulse response IR
; On/Off         -
; Type           -
; Level 1        -  first breakpoint value in the envelope
; Curve 1        -  curve shape between Level 1 and Level 2
; Mid Point      -  location of Level two as a ratio between the start and end of the graph
; Level 2        -  second breakpoint value in the envelope
; Curve 2        -  curve shape between Level 2 and Level 3
; Level 3        -  third breakpoint value in the envelope
; Res.           -  resonance of the filter (if resonant type is selected)

; H I G H P A S S   F I L T E R - Design of the graph for a high-pass filter across the duration of the impulse response IR
; On/Off         -
; Type           -
; Level 1        -  first breakpoint value in the envelope
; Curve 1        -  curve shape between Level 1 and Level 2
; Mid Point      -  location of Level two as a ratio between the start and end of the graph
; Level 2        -  second breakpoint value in the envelope
; Curve 2        -  curve shape between Level 2 and Level 3
; Level 3        -  third breakpoint value in the envelope
; Res.           -  resonance of the filter (if resonant type is selected)

; H A R M O N I C   R E S O N A N C E - adds two harmonic resonators per channel
; On/Off         -
; Fund.          -  fundamental frequency of the first pair of resonators
; Intvl.         -  interval (as ratio) of the second pair of resonators with respect to the fundamental
;  envelope graph modifies the resonance time of the harmonic resonators
; Level 1        -  first breakpoint value in the envelope
; Curve 1        -  curve shape between Level 1 and Level 2
; Mid Point      -  location of Level two as a ratio between the start and end of the graph
; Level 2        -  second breakpoint value in the envelope
; Curve 2        -  curve shape between Level 2 and Level 3
; Level 3        -  third breakpoint value in the envelope
; Invert 1-4     -  when activated, inverts the feedback within that resonator

; I M P U L S E S - Design of the graph for density across the duration of the impulse response IR
; Deviation      -  temporal randomness. When zero, impulses will be periodic 
; Level 1        -  first breakpoint value in the envelope
; Curve 1        -  curve shape between Level 1 and Level 2
; Mid Point      -  location of Level two as a ratio between the start and end of the graph
; Level 2        -  second breakpoint value in the envelope
; Curve 2        -  curve shape between Level 2 and Level 3
; Level 3        -  third breakpoint value in the envelope
; Rand. Amp.     -  amount of random amplitude variation of the impulses

; C H I R P      -  Impulse is a sine sweep
; Freq. Start    -  start of the chirp frequency envelope 
; Freq. Curve    -  curve (concave-straight-convex) of the chirp frequency envelope 
; Freq. End      -  end of the chirp frequency envelope 
; Amp. Start     -  start of the chirp amplitude envelope 
; Amp. Curve     -  curve (concave-straight-convex) of the chirp amplitude envelope 
; Amp. End       -  end of the chirp amplitude envelope 
;  The initial chirp is fed through a delay effect.
; Echo Time      -  delay time
; Feedback       -  ratio of the delay output that is fed back into the input

<Cabbage>
form caption("SynVerb") size(755,805), pluginId("Conv"), guiMode("queue"), colour(25,30,30)

#define SLIDER_DESIGN colour(165,160,160), trackerColour(255,255,255), trackerBackgroundColour(0,0,0,0), valueTextBox(1), fontColour("white"), markerStart(0.5), markerEnd(1), markerThickness(0.7),  markerColour("black"), outlineColour(0,0,0,0), trackerInsideRadius(0.85)
#define COLOUR_1 100,100,240
#define COLOUR_2 240,100,100
#define COLOUR_3 255,255,0
#define COLOUR_4 100,255,255
#define COLOUR_5 100,255,100
#define COLOUR_6 255,100,255
#define COLOUR_7   0,150,255
#define SLIDER_DESIGN1 colour(165,160,160), trackerColour(100,100,240), trackerBackgroundColour(0,0,0,0), valueTextBox(1), fontColour("white"), markerStart(0.5), markerEnd(1), markerThickness(0.7),  markerColour("black"), outlineColour(0,0,0,0), trackerInsideRadius(0.85)
#define SLIDER_DESIGN2 colour(165,160,160), trackerColour(255, 80, 80), trackerBackgroundColour(0,0,0,0), valueTextBox(1), fontColour("white"), markerStart(0.5), markerEnd(1), markerThickness(0.7),  markerColour("black"), outlineColour(0,0,0,0), trackerInsideRadius(0.85)
#define SLIDER_DESIGN3 colour(165,160,160), trackerColour(255,255,  0), trackerBackgroundColour(0,0,0,0), valueTextBox(1), fontColour("white"), markerStart(0.5), markerEnd(1), markerThickness(0.7),  markerColour("black"), outlineColour(0,0,0,0), trackerInsideRadius(0.85)
#define SLIDER_DESIGN4 colour(165,160,160), trackerColour(100,255,255), trackerBackgroundColour(0,0,0,0), valueTextBox(1), fontColour("white"), markerStart(0.5), markerEnd(1), markerThickness(0.7),  markerColour("black"), outlineColour(0,0,0,0), trackerInsideRadius(0.85)
#define SLIDER_DESIGN5 colour(165,160,160), trackerColour(100,255,100), trackerBackgroundColour(0,0,0,0), valueTextBox(1), fontColour("white"), markerStart(0.5), markerEnd(1), markerThickness(0.7),  markerColour("black"), outlineColour(0,0,0,0), trackerInsideRadius(0.85)
#define SLIDER_DESIGN6 colour(165,160,160), trackerColour(255,100,255), trackerBackgroundColour(0,0,0,0), valueTextBox(1), fontColour("white"), markerStart(0.5), markerEnd(1), markerThickness(0.7),  markerColour("black"), outlineColour(0,0,0,0), trackerInsideRadius(0.85)
#define SLIDER_DESIGN7 colour(165,160,160), trackerColour(  0,150,255), trackerBackgroundColour(0,0,0,0), valueTextBox(1), fontColour("white"), markerStart(0.5), markerEnd(1), markerThickness(0.7),  markerColour("black"), outlineColour(0,0,0,0), trackerInsideRadius(0.85)


label    bounds( 10, 10, 90, 13), text("SOURCE")
combobox bounds( 10, 25, 90, 20), channel("Source"), items("White Noise","Pink Noise","Impulses","Chirp"), value(1), align("centre")

label    bounds( 10, 55, 90, 13), text("LIVE INPUT")
combobox bounds( 10, 70, 90, 20), channel("Input"), items("Mono","Stereo"), value(1), align("centre")

label    bounds( 10,105, 90, 13), text("Partition Len."), fontColour("white")
combobox bounds( 10,120, 90, 20), channel("PLen"), items("2","4","8","16","32","64","128","256","512","1024","2048","4096"), value(8), align("centre")

button   bounds(10, 160, 90, 20), text("EXPORT","EXPORT"), channel("export"), latched(0), colour:0(100,0,0), colour:1(255,0,0)
button   bounds(10, 200, 90, 20), text("TEST","TEST"), channel("test"), latched(0), colour:0(100,100,0), colour:1(255,255,0)

rslider bounds( 20,235, 70, 90), text("Input Gain"), channel("InGain"), range(0, 5, 0, 0.5), $SLIDER_DESIGN
rslider bounds( 20,345, 70, 90), text("Rvb. Time"), channel("RvbTim"), range(0.1, 30, 5, 0.5), $SLIDER_DESIGN
rslider bounds( 20,455, 70, 90), text("Dry Delay"), channel("DryDly"), range(0, 1, 0), $SLIDER_DESIGN
rslider bounds(  0,565, 55, 70), text("Dry"),  channel("Dry"), range(0, 5, 1,  0.5, 0.01), $SLIDER_DESIGN
rslider bounds( 50,565, 55, 70), text("Wet"),  channel("Wet"), range(0, 5, 0.3, 0.5, 0.01), $SLIDER_DESIGN
rslider bounds( 20,655, 70, 90), text("Level"), channel("Level"), range(0, 5, 1, 0.5), $SLIDER_DESIGN


gentable   bounds(110, 10,640, 50), channel("ImpulseFileL"),  tableNumber(201), tableColour(205,205,205) fontColour(160, 160, 160, 255), fill(0), ampRange(-1,1,201)
gentable   bounds(110, 60,640, 50), channel("ImpulseFileR"),  tableNumber(202), tableColour(205,205,205) fontColour(160, 160, 160, 255), fill(0), ampRange(-1,1,202)
gentable   bounds(110,115,640, 50), channel("Graphs"),        tableNumber(4,5,6,7,8,9,10), tableColour:0(100,100,240), tableColour:1(240,100,100), tableColour:2(255,255,0), tableColour:3(100,255,255), tableColour:4(100,255,100), tableColour:5(255,100,255), tableColour:6(0,150,255), tableBackgroundColour("black"), fill(0), tableGridColour(0,0,0,0), outlineThickness(2), ampRange(0,1,4)

image     bounds(110, 10,1,155), channel("DlyIndic")

image      bounds(110,170,640,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label   bounds(  0,  3,630, 14), text("A M P L I T U D E")
rslider bounds(100, 20, 70, 90), channel("AmpStart"), text("Level 1"), range(0,1,1,0.5), $SLIDER_DESIGN1
rslider bounds(175, 20, 70, 90), channel("AmpCurve1"), text("Curve 1"), range(-100,100,2), $SLIDER_DESIGN1
rslider bounds(250, 20, 70, 90), channel("AmpMidPoint"), text("Mid Point"), range(0,1,0), $SLIDER_DESIGN1
rslider bounds(325, 20, 70, 90), channel("AmpMidLev"),  text("Level 2"), range(0,1,1,0.5), $SLIDER_DESIGN1
rslider bounds(400, 20, 70, 90), channel("AmpCurve2"), text("Curve 2"), range(-100,100,-8), $SLIDER_DESIGN1
rslider bounds(475, 20, 70, 90), channel("AmpEnd"),   text("Level 3"), range(0,1,0,0.5), $SLIDER_DESIGN1
rslider bounds(550, 20, 70, 90), channel("AmpGain"),   text("Gain"), range(0.01,100,1,0.333), $SLIDER_DESIGN1
}

image      bounds(110,295,640,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  3,630, 14), text("L O W P A S S   F I L T E R")
checkbox bounds( 10, 25, 80, 15), channel("LPFOnOff"), value(0), text("On/Off")
combobox bounds( 10, 45, 80, 20), channel("LPFType"), items("6 dB/oct","12 dB/oct", "Resonant"), value(1), align("centre")
rslider  bounds(100, 20, 70, 90), channel("LPFStart"), text("Level 1"), range(20,20000,20000,0.5,1), $SLIDER_DESIGN2
rslider  bounds(175, 20, 70, 90), channel("LPFCurve1"), text("Curve 1"), range(-100,100,-20), $SLIDER_DESIGN2
rslider  bounds(250, 20, 70, 90),  channel("LPFMidPoint"), text("Mid Point"), range(0,1,0), $SLIDER_DESIGN2
rslider  bounds(325, 20, 70, 90), channel("LPFMidLev"), text("Level 2"), range(20,20000,3500,0.5,1), $SLIDER_DESIGN2
rslider  bounds(400, 20, 70, 90), channel("LPFCurve2"), text("Curve 2"), range(-100,100,-10), $SLIDER_DESIGN2
rslider  bounds(475, 20, 70, 90), channel("LPFEnd"), text("Level 3"), range(20,20000,20,0.5,1), $SLIDER_DESIGN2
rslider  bounds(550, 20, 70, 90), channel("LPFRes"), text("Res."), range(0,0.99,0.8), $SLIDER_DESIGN2
}

image      bounds(110,420,640,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  3,630, 14), text("H I G H P A S S   F I L T E R")
checkbox bounds( 10, 25, 80, 15), channel("HPFOnOff"), value(0), text("On/Off")
combobox bounds( 10, 45, 80, 20), channel("HPFType"), items("6 dB/oct","12 dB/oct", "Resonant"), value(1), align("centre")
rslider  bounds(100, 20, 70, 90), channel("HPFStart"), text("Level 1"), range(20,20000,20,0.5,1), $SLIDER_DESIGN3
rslider  bounds(175, 20, 70, 90), channel("HPFCurve1"), text("Curve 1"), range(-100,100,8), $SLIDER_DESIGN3
rslider  bounds(250, 20, 70, 90),  channel("HPFMidPoint"), text("Mid Point"), range(0,1,0), $SLIDER_DESIGN3
rslider  bounds(325, 20, 70, 90), channel("HPFMidLev"), text("Level 2"), range(20,20000,20,0.5,1), $SLIDER_DESIGN3
rslider  bounds(400, 20, 70, 90), channel("HPFCurve2"), text("Curve 2"), range(-100,100,-8), $SLIDER_DESIGN3
rslider  bounds(475, 20, 70, 90), channel("HPFEnd"), text("Level 3"), range(20,20000,10000,0.5,1), $SLIDER_DESIGN3
rslider  bounds(550, 20, 70, 90), channel("HPFRes"), text("Res."), range(0,0.99,0.35), $SLIDER_DESIGN3
}

image      bounds(110,545,640,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  3,630, 14), text("H A R M O N I C   R E S O N A N C E")
checkbox bounds( 10, 25, 80, 15), channel("StrOnOff"), value(0), text("On/Off")
nslider  bounds( 10, 45, 80, 30), channel("StrFund"), text("Fund."), range(20,5000,444,0.5,0.1)
nslider  bounds( 10, 80, 80, 30), channel("StrIntvl"), text("Intvl."), range(0.125,4,1.4,1,0.001)
rslider  bounds(100, 20, 70, 90), channel("StrStart"), text("Level 1"), range(0,0.99,0.99,2,0.01), $SLIDER_DESIGN5
rslider  bounds(175, 20, 70, 90), channel("StrCurve1"), text("Curve 1"), range(-100,100,1.7), $SLIDER_DESIGN5
rslider  bounds(250, 20, 70, 90), channel("StrMidPoint"), text("Mid Point"), range(0,1,0.1), $SLIDER_DESIGN5
rslider  bounds(325, 20, 70, 90), channel("StrMidLev"), text("Level 2"), range(0,0.99,0.8,2,0.01), $SLIDER_DESIGN5
rslider  bounds(400, 20, 70, 90), channel("StrCurve2"), text("Curve 2"), range(-100,100,-10), $SLIDER_DESIGN5
rslider  bounds(475, 20, 70, 90), channel("StrEnd"), text("Level 3"), range(0,0.99,0.1,2,0.01), $SLIDER_DESIGN5
checkbox bounds(550, 25, 80, 15), channel("StrInv1"), value(0), text("Invert 1")
checkbox bounds(550, 45, 80, 15), channel("StrInv2"), value(0), text("Invert 2")
checkbox bounds(550, 65, 80, 15), channel("StrInv3"), value(0), text("Invert 3")
checkbox bounds(550, 85, 80, 15), channel("StrInv4"), value(0), text("Invert 4")
}

image      bounds(110,670,640,120), colour(0,0,0,0), outlineThickness(1), corners(5), channel("density"), visible(0)
{
label    bounds(  0,  3,630, 14), text("I M P U L S E S")
rslider  bounds( 25, 20, 70, 90), channel("Dev"), text("Deviation"), range(0,1,1), $SLIDER_DESIGN4
rslider  bounds(100, 20, 70, 90), channel("DensStart"), text("Level 1"), range(0.5,40000,20,0.5,0.1), $SLIDER_DESIGN4
rslider  bounds(175, 20, 70, 90), channel("DensCurve1"), text("Curve 1"), range(-100,100,1.7), $SLIDER_DESIGN4
rslider  bounds(250, 20, 70, 90), channel("DensMidPoint"), text("Mid Point"), range(0,1,0.1), $SLIDER_DESIGN4
rslider  bounds(325, 20, 70, 90), channel("DensMidLev"), text("Level 2"), range(0.5,40000,6000,0.5,0.1), $SLIDER_DESIGN4
rslider  bounds(400, 20, 70, 90), channel("DensCurve2"), text("Curve 2"), range(-100,100,-10), $SLIDER_DESIGN4
rslider  bounds(475, 20, 70, 90), channel("DensEnd"), text("Level 3"), range(0.5,40000,40000,0.5,0.1), $SLIDER_DESIGN4
rslider  bounds(550, 20, 70, 90), channel("RandAmp"), text("Rand. Amp"), range(0,1,1), $SLIDER_DESIGN4
}

image      bounds(110,670,640,120), colour(0,0,0,0), outlineThickness(1), corners(5), channel("chirp"), visible(0)
{
label    bounds(  0,  3,630, 14), text("C H I R P")
rslider  bounds( 25, 20, 70, 90), channel("ChirpFreqStart"), text("Freq. Start"), range(10,20000,20000,0.5,1), $SLIDER_DESIGN6
rslider  bounds(100, 20, 70, 90), channel("ChirpFreqCurve"), text("Freq. Curve"), range(-100,100,-50), $SLIDER_DESIGN6
rslider  bounds(175, 20, 70, 90), channel("ChirpFreqEnd"), text("Freq. End"), range(10,20000,10,0.5,1), $SLIDER_DESIGN6
rslider  bounds(250, 20, 70, 90), channel("ChirpAmpStart"), text("Amp. Start"), range(0,1,1,0.5,0.001), $SLIDER_DESIGN7
rslider  bounds(325, 20, 70, 90), channel("ChirpAmpCurve"), text("Amp. Curve"), range(-100,100,-4), $SLIDER_DESIGN7
rslider  bounds(400, 20, 70, 90), channel("ChirpAmpEnd"), text("Amp. End"), range(0,1,0,0.5,0.001), $SLIDER_DESIGN7
rslider  bounds(475, 20, 70, 90), channel("ChirpEchoTime"), text("Echo Time"), range(0.001,2,0.1,0.5,0.001), $SLIDER_DESIGN
rslider  bounds(550, 20, 70, 90), channel("ChirpFeedback"), text("Feedback"), range(0,1,0,1,0.001), $SLIDER_DESIGN
}

label    bounds(  5,793,120, 12), text("Iain McCurdy |2024|"), align("left"), fontColour("silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =                   2     ; NUMBER OF CHANNELS (2=STEREO)
0dbfs              =                   1

seed 0
 ; display tables (fixed duration)
 giDispL           ftgen               201, 0, 2^16, 10, 0
 giDispR           ftgen               202, 0, 2^16, 10, 0

 giImpL            ftgen               2,0,4,10,0
 giImpR            ftgen               3,0,4,10,0

 giAmp             ftgen               4,0,2^12,2,0
 giLPF             ftgen               5,0,2^12,2,0
 giHPF             ftgen               6,0,2^12,10,0
 giDens            ftgen               7,0,2^12,10,0
 giStrRes          ftgen               8,0,2^12,10,0
 giChirpFrq        ftgen               9,0,2^12,2,0
 giChirpAmp        ftgen               10,0,2^12,2,0


; UDO for updating the display table
opcode displayTable,0,ii
iSrc,iDsp xin
 ; write an image of the impulse file to the display table 
 iCount            init                0
 while iCount<ftlen(iDsp) do
 iVal              tablei              iCount/ftlen(iDsp), iSrc, 1 ; read value using normalised index
                   tablew              iVal, iCount, iDsp          ; write value to display table using raw index
 iCount            +=                  1
 od
endop




instr 1 ; create the IR. Turns on for an instant and then turns itself off once the IR is complete
 
 ; give p-fields more memorable variable names
 iFNL              =                   p4                                         ; left channel impulse response
 iFNR              =                   p5                                         ; right channel impulse response
 
 iSource           =                   p6

 iAmpStart         =                   p7
 iAmpCurve1        =                   p8
 iAmpMidPoint      =                   p9
 iAmpMidLev        =                   p10
 iAmpCurve2        =                   p11
 iAmpEnd           =                   p12
 iAmpGain          =                   p13
 
 iLPFOnOff         =                   p14
 iLPFType          =                   p15 
 iLPFStart         =                   p16
 iLPFCurve1        =                   p17
 iLPFMidPoint      =                   p18
 iLPFMidLev        =                   p19
 iLPFCurve2        =                   p20
 iLPFEnd           =                   p21
 iLPFRes           =                   p22

 iHPFOnOff         =                   p23
 iHPFType          =                   p24
 iHPFStart         =                   p25
 iHPFCurve1        =                   p26
 iHPFMidPoint      =                   p27
 iHPFMidLev        =                   p28
 iHPFCurve2        =                   p29
 iHPFEnd           =                   p30
 iHPFRes           =                   p31

 iDev              =                   p32
 iDensStart        =                   p33
 iDensCurve1       =                   p34
 iDensMidPoint     =                   p35
 iDensMidLev       =                   p36
 iDensCurve2       =                   p37
 iDensEnd          =                   p38
 iRandAmp          =                   p39 ; random amplitude variations
 
 iStrOnOff         =                   p40
 iStrFund          =                   p41
 iStrIntvl         =                   p42
 iStrStart         =                   p43
 iStrCurve1        =                   p44
 iStrMidPoint      =                   p45
 iStrMidLev        =                   p46
 iStrCurve2        =                   p47
 iStrEnd           =                   p48
 iStrInv1          =                   2 * (-p49) + 1 ; invert
 iStrInv2          =                   2 * (-p50) + 1
 iStrInv3          =                   2 * (-p51) + 1
 iStrInv4          =                   2 * (-p52) + 1
 
 iChirpFreqStart   =                   p53
 iChirpFreqCurve   =                   p54
 iChirpFreqEnd     =                   p55
 iChirpAmpStart    =                   p56
 iChirpAmpCurve    =                   p57
 iChirpAmpEnd      =                   p58
 iChirpEchoTime    =                   p59
 iChirpFeedback    =                   p60

 ; parameter graphs
 i_                ftgen               giAmp, 0, 4097, -16, iAmpStart,  1 + (4095*iAmpMidPoint), iAmpCurve1, iAmpMidLev, 1 + (4095*(1-iAmpMidPoint)), iAmpCurve2, iAmpEnd  ; amplitude curve
 i_                ftgen               giLPF, 0, 4097, -16, iLPFStart, 1 + (4095*iLPFMidPoint), iLPFCurve1, iLPFMidLev, 1 + (4095*(1-iLPFMidPoint)), iLPFCurve2, iLPFEnd   ; cutoff frequency curve
 i_                ftgen               giHPF, 0, 4097, -16, iHPFStart, 1 + (4095*iHPFMidPoint), iHPFCurve1, iHPFMidLev, 1 + (4095*(1-iHPFMidPoint)), iHPFCurve2, iHPFEnd   ; cutoff frequency curve
 i_                ftgen               giDens, 0, 4097, -16, iDensStart, 1 + (4095*iDensMidPoint), iDensCurve1, iDensMidLev, 1 + (4095*(1-iDensMidPoint)), iDensCurve2, iDensEnd   ; density curve
 i_                ftgen               giStrRes, 0, 4097, -16, iStrStart, 1 + (4095*iStrMidPoint), iStrCurve1, iStrMidLev, 1 + (4095*(1-iStrMidPoint)), iStrCurve2, iStrEnd   ; harmonic resonator curve
 i_                ftgen               giChirpFrq, 0, 4097, -16, iChirpFreqStart, 4096, iChirpFreqCurve, iChirpFreqEnd ; chirp frequency curve
 i_                ftgen               giChirpAmp, 0, 4097, -16, iChirpAmpStart, 4096, iChirpAmpCurve, iChirpAmpEnd ; chirp amp curve
 
 kcnt              =                   0                         ; k-rate counter for counting loop iterations initialised

 while kcnt<ftlen(giImpL) do
 ; functions that describe how parameters change across the duration of the IR
 kAmp              tablei              kcnt/ftlen(iFNL), giAmp, 1
 kLPF              tablei              kcnt/ftlen(iFNL), giLPF, 1
 kHPF              tablei              kcnt/ftlen(iFNL), giHPF, 1
 kDens             tablei              kcnt/ftlen(iFNL), giDens, 1 
 kStrRes           tablei              kcnt/ftlen(giImpL), giStrRes, 1
 kChirpFreq        tablei              kcnt/ftlen(giImpL), giChirpFrq, 1
 kChirpAmp         tablei              kcnt/ftlen(giImpL), giChirpAmp, 1

 ; left channel source
 if iSource==1 then
  aSig             noise               1, 0
 elseif iSource==2 then
  aSig             pinker
 elseif iSource==3 then
  aSig             gausstrig           (1 - iRandAmp) + bexprnd:k(iRandAmp*0.2), kDens, iDev
  aSig             dcblock2            aSig
 else
  aSig             poscil              kChirpAmp*0.4, kChirpFreq
  aDel             init                0
  aDel             delay               aSig + (aDel * iChirpFeedback), iChirpEchoTime
  aSig             +=                  aDel
 endif 
 
 ; left channel lowpass filter
 if iLPFOnOff==1 then
  if iLPFType==1 then
   aSig            tone                aSig, kLPF
  elseif iLPFType==2 then
   aSig            butlp               aSig, kLPF
  elseif iLPFType==3 then
   aSig            moogladder          aSig, kLPF, iLPFRes
  endif
 endif

 ; left channel highpass filter
 if iHPFOnOff==1 then
  if iHPFType==1 then
   aSig            atone               aSig, kHPF
  elseif iHPFType==2 then
   aSig            buthp               aSig, kHPF
  elseif iHPFType==3 then
   aSig            bqrez               aSig * 0.5 * ampdbfs(-iHPFRes*12), kHPF, 1 + (iHPFRes * 100), 1
  endif
 endif

 ; left harmonic resonator
 if iStrOnOff==1 then
  kFrq              =                   iStrFund
  a1                streson             aSig, kFrq, kStrRes * iStrInv1
  kFrq              *=                  iStrIntvl
  a2                streson             aSig, kFrq, kStrRes * iStrInv2
  aSig              sum                 a1, a2
  aSig              *=                  0.25
 endif
 
 ; left channel write to table
                   tablew              aSig * kAmp * iAmpGain, a(kcnt), iFNL

 ; right channel source
 if iSource==1 then
  aSig             noise               1, 0
 elseif iSource==2 then
  aSig             pinker
 elseif iSource==3 then
  aSig             gausstrig           (1 - iRandAmp) + bexprnd:k(iRandAmp*0.2), kDens, iDev
  aSig             dcblock2            aSig
 else
  aSig             poscil              kChirpAmp*0.4, kChirpFreq
  aDel             init                0
  aDel             delay               aSig + (aDel * iChirpFeedback), iChirpEchoTime
  aSig             +=                  aDel
 endif
  
 ; right channel lowpass filter
 if iLPFOnOff==1 then
  if iLPFType==1 then
   aSig            tone                aSig, kLPF
  elseif iLPFType==2 then
   aSig            butlp               aSig, kLPF
  elseif iLPFType==3 then
   aSig            moogladder          aSig, kLPF, iLPFRes
  endif
 endif
 
 ; right channel highpass filter
 if iHPFOnOff==1 then
  if iHPFType==1 then
   aSig            atone               aSig, kHPF
  elseif iHPFType==2 then
   aSig            buthp               aSig, kHPF
  elseif iHPFType==3 then
   aSig            bqrez               aSig * 0.5 * ampdbfs(-iHPFRes*12), kHPF, 1 + (iHPFRes * 100), 1
  endif
 endif
 
 ; right harmonic resonator
 if iStrOnOff==1 then
  kFrq              =                   iStrFund
  a1                streson             aSig, kFrq, kStrRes * iStrInv3
  kFrq              *=                  iStrIntvl
  a2                streson             aSig, kFrq, kStrRes * iStrInv4 
  aSig              sum                 a1, a2
  aSig              *=                  0.25
 endif

 ; right channel write to table
                   tablew              aSig * kAmp * iAmpGain, a(kcnt), iFNR
 
 ; increment counter and loop back
 kcnt              +=                  ksmps                                      ; increment control rate counter
 od 

                   event               "i", 101, 0, 3600*24*265*7000              ; restart convolution instrument
                   turnoff                                                        ; turnoff this instrument immediately
endin 





instr 100 ; trigger IR rebuilds
 kSource           cabbageGetValue     "Source"
 kexport           cabbageGetValue     "export"
 if trigger:k(kexport,0.5,0)==1 then
  event "i",102,0,0.1
 endif
 
 ; show/hide density controls depending on whether that source has been selected 
 if changed:k(kSource)==1 then
  if kSource==3 then
                   cabbageSet          1,"density","visible",1
                   cabbageSet          1,"chirp","visible",0
  elseif kSource==4 then
                   cabbageSet          1,"density","visible",0
                   cabbageSet          1,"chirp","visible",1
  else
                   cabbageSet          1,"density","visible",0
                   cabbageSet          1,"chirp","visible",0
  endif
 endif

 gkRvbTim          cabbageGetValue     "RvbTim"
 gkRvbTim          init                5 

 kAmpStart         cabbageGetValue     "AmpStart"
 kAmpCurve1        cabbageGetValue     "AmpCurve1"
 kAmpMidPoint      cabbageGetValue     "AmpMidPoint"
 kAmpMidLev        cabbageGetValue     "AmpMidLev"
 kAmpCurve2        cabbageGetValue     "AmpCurve2"
 kAmpEnd           cabbageGetValue     "AmpEnd"
 kAmpGain          cabbageGetValue     "AmpGain"

 kLPFOnOff         cabbageGetValue     "LPFOnOff"
 kLPFType          cabbageGetValue     "LPFType"
 kLPFStart         cabbageGetValue     "LPFStart"
 kLPFCurve1        cabbageGetValue     "LPFCurve1"
 kLPFMidPoint      cabbageGetValue     "LPFMidPoint"
 kLPFMidLev        cabbageGetValue     "LPFMidLev"
 kLPFCurve2        cabbageGetValue     "LPFCurve2"
 kLPFEnd           cabbageGetValue     "LPFEnd"
 kLPFRes           cabbageGetValue     "LPFRes"

 kHPFOnOff         cabbageGetValue     "HPFOnOff"
 kHPFType          cabbageGetValue     "HPFType"
 kHPFStart         cabbageGetValue     "HPFStart"
 kHPFCurve1        cabbageGetValue     "HPFCurve1"
 kHPFMidPoint      cabbageGetValue     "HPFMidPoint"
 kHPFMidLev        cabbageGetValue     "HPFMidLev"
 kHPFCurve2        cabbageGetValue     "HPFCurve2"
 kHPFEnd           cabbageGetValue     "HPFEnd"
 kHPFRes           cabbageGetValue     "HPFRes"

 kDev              cabbageGetValue     "Dev"
 kDensStart        cabbageGetValue     "DensStart"
 kDensCurve1       cabbageGetValue     "DensCurve1"
 kDensMidPoint     cabbageGetValue     "DensMidPoint"
 kDensMidLev       cabbageGetValue     "DensMidLev"
 kDensCurve2       cabbageGetValue     "DensCurve2"
 kDensEnd          cabbageGetValue     "DensEnd"
 kRandAmp          cabbageGetValue     "RandAmp"
 
 kStrOnOff         cabbageGetValue     "StrOnOff"     
 kStrFund          cabbageGetValue     "StrFund"    
 kStrIntvl         cabbageGetValue     "StrIntvl"    
 kStrStart         cabbageGetValue     "StrStart"    
 kStrCurve1        cabbageGetValue     "StrCurve1"    
 kStrMidPoint      cabbageGetValue     "StrMidPoint"    
 kStrMidLev        cabbageGetValue     "StrMidLev"    
 kStrCurve2        cabbageGetValue     "StrCurve2"    
 kStrEnd           cabbageGetValue     "StrEnd" 
 kStrInv1          cabbageGetValue     "StrInv1"
 kStrInv2          cabbageGetValue     "StrInv2"
 kStrInv3          cabbageGetValue     "StrInv3"
 kStrInv4          cabbageGetValue     "StrInv4"

 kChirpFreqStart   cabbageGetValue     "ChirpFreqStart"
 kChirpFreqCurve   cabbageGetValue     "ChirpFreqCurve"
 kChirpFreqEnd     cabbageGetValue     "ChirpFreqEnd"
 kChirpAmpStart    cabbageGetValue     "ChirpAmpStart"
 kChirpAmpCurve    cabbageGetValue     "ChirpAmpCurve"
 kChirpAmpEnd      cabbageGetValue     "ChirpAmpEnd"
 kChirpEchoTime    cabbageGetValue     "ChirpEchoTime"
 kChirpFeedback    cabbageGetValue     "ChirpFeedback"

 if changed:k(kSource, gkRvbTim, kAmpStart, kAmpCurve1, kAmpMidPoint, kAmpMidLev, kAmpCurve2, kAmpEnd, kAmpGain, kLPFOnOff, kLPFType, kLPFStart, kLPFCurve1, kLPFMidPoint, kLPFMidLev, kLPFCurve2, kLPFEnd, kLPFRes, kHPFOnOff, kHPFType, kHPFStart, kHPFCurve1, kHPFMidPoint, kHPFMidLev, kHPFCurve2, kHPFEnd, kHPFRes, kDev, kDensStart, kDensCurve1, kDensMidPoint, kDensMidLev, kDensCurve2, kDensEnd, kRandAmp,  kStrOnOff, kStrFund, kStrIntvl, kStrStart, kStrCurve1, kStrMidPoint, kStrMidLev, kStrCurve2, kStrEnd, kStrInv1, kStrInv2, kStrInv3, kStrInv4, kChirpFreqStart, kChirpFreqCurve, kChirpFreqEnd, kChirpAmpStart, kChirpAmpCurve, kChirpAmpEnd, kChirpEchoTime, kChirpFeedback)==1 then
                   turnoff2            101, 0, 0
                   reinit              RESTART
 endif
 RESTART:
 
 ; create empty tables for the impulse response (stereo)
 i_                ftgen               2, 0, sr*i(gkRvbTim), 10, 0
 i_                ftgen               3, 0, sr*i(gkRvbTim), 10, 0
 ;                                          p1 p2 p3   p4 p5 p6          p7            p8             p9               p10            p11            p12         p13          p14           p15          p16           p17            p18              p19            p20            p21         p22         p23           p24          p25           p26            p27              p28            p29            p30         p31         p32      p33            p34             p35               p36             p37             p38          p39          p40           p41          p42           p43           p44            p45              p46            p47            p48         p49          p50          p51          p52          p53                 p54                 p55               p56                p57                p58              p59                p60
                   event_i             "i", 1, 0, 0.1, 2, 3, i(kSource), i(kAmpStart), i(kAmpCurve1), i(kAmpMidPoint), i(kAmpMidLev), i(kAmpCurve2), i(kAmpEnd), i(kAmpGain), i(kLPFOnOff), i(kLPFType), i(kLPFStart), i(kLPFCurve1), i(kLPFMidPoint), i(kLPFMidLev), i(kLPFCurve2), i(kLPFEnd), i(kLPFRes), i(kHPFOnOff), i(kHPFType), i(kHPFStart), i(kHPFCurve1), i(kHPFMidPoint), i(kHPFMidLev), i(kHPFCurve2), i(kHPFEnd), i(kHPFRes), i(kDev), i(kDensStart), i(kDensCurve1), i(kDensMidPoint), i(kDensMidLev), i(kDensCurve2), i(kDensEnd), i(kRandAmp), i(kStrOnOff), i(kStrFund), i(kStrIntvl), i(kStrStart), i(kStrCurve1), i(kStrMidPoint), i(kStrMidLev), i(kStrCurve2), i(kStrEnd), i(kStrInv1), i(kStrInv2), i(kStrInv3), i(kStrInv4), i(kChirpFreqStart), i(kChirpFreqCurve), i(kChirpFreqEnd), i(kChirpAmpStart), i(kChirpAmpCurve), i(kChirpAmpEnd), i(kChirpEchoTime), i(kChirpFeedback)
 endin          
 
 
 
 instr 101 ; convolution instrument
                   displayTable        2, 201                           ; update display function tables
                   displayTable        3, 202
                   cabbageSet          "ImpulseFileL", "tableNumber", 2 ; update GUI tables
                   cabbageSet          "ImpulseFileR", "tableNumber", 3
                   cabbageSet          "Graphs", "tableNumber", 4
                   cabbageSet          "Graphs", "tableNumber", 5
                   cabbageSet          "Graphs", "tableNumber", 6
                   cabbageSet          "Graphs", "tableNumber", 7
                   cabbageSet          "Graphs", "tableNumber", 8
                   cabbageSet          "Graphs", "tableNumber", 9

 ; input
 kInput            cabbageGetValue     "Input"
 kInGain           cabbageGetValue     "InGain"
 if kInput==1 then ; mono
  aInL             inch                1
  aInR             =                   aInL
 else              ; stereo
  aInL,aInR        ins
 endif
 aInL              *=                  kInGain
 aInR              *=                  kInGain
 
 ; mix in test click
 ktest             cabbageGetValue     "test"
 ;ktest             trigger             ktest, 0.5, 0
 atest             =                   trigger:k(ktest, 0.5, 0) == 1 ? 0.5 : 0
 aInL              +=                  atest
 aInR              +=                  atest
  
 ; convolution
 kPLen             cabbageGetValue     "PLen"
 kPLen             init                8
 if changed:k(kPLen)==1 then
  reinit UPDATE
 endif
 UPDATE:
 iPLen             =                   2 ^ i(kPLen)  ; calculation partition length (must be a power of 2)
 iSkipSamples      =                   0             ; where to start reading the impulse response file (0 = from the begining)
 iIRLen            =                   ftlen(giImpL) ; length of impulse response (just the full IR)
 aL                ftconv              aInL, giImpL, iPLen, iSkipSamples, iIRLen
 aR                ftconv              aInR, giImpR, iPLen, iSkipSamples, iIRLen
 rireturn
 
 ; delay dry signal
 kDryDly           cabbageGetValue     "DryDly"
                   cabbageSet          changed:k(kDryDly), "DlyIndic", "bounds", 110 + kDryDly*640, 10, 1, 155
 aDlyL             vdelay              aInL, a(kDryDly*gkRvbTim)*1000, 30000
 aDlyR             vdelay              aInR, a(kDryDly*gkRvbTim)*1000, 30000
 
 ; output
 kDry              cabbageGetValue     "Dry"
 kWet              cabbageGetValue     "Wet"
 kLevel            cabbageGetValue     "Level"
                   outs                ( (aDlyL*kDry) + (aL*kWet) ) * kLevel, ( (aDlyR*kDry) + (aR*kWet) ) * kLevel
endin






instr 102 ; export IR
 /*
 */
 itim           date
 Stim           dates            itim
 itim           date
 Stim           dates            itim
 Syear          strsub           Stim, 20, 24
 Smonth         strsub           Stim, 4, 7
 Sday           strsub           Stim, 8, 10
 iday           strtod           Sday
 Shor           strsub           Stim, 11, 13
 Smin           strsub           Stim, 14, 16
 Ssec           strsub           Stim, 17, 19
 SDir           cabbageGetValue  "USER_HOME_DIRECTORY"
 gSname         sprintf          "%s/IR_%s_%s_%02d_%s_%s_%s.wav", SDir, Syear, Smonth, iday, Shor,Smin, Ssec

kCnt     init   0
 while kCnt<=ftlen(giImpL) do
 aL   tablei  a(kCnt),giImpL
 aR   tablei  a(kCnt),giImpR
      fout    gSname,8,aL,aR
 kCnt += ksmps
 od
 turnoff
 
 ;; try this opcode?
 ;kans ftaudio ktrig, kfn, "filename", kformat [, isync, kbeg, kend] 
 
endin

</CsInstruments>

<CsScore>
i 100 0   z ; scan for changed in mode and IR settings
i 101 0.1 z ; implement convolution
</CsScore>

</CsoundSynthesizer>
