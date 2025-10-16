
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Fundivider.csd (Fundamental Divider)
; Iain McCurdy, 2023

; An emulation of a simple octave divider effect but providing additional pitches that are simple frequency divisions of the fundamental  
;  (hence Fundivider and not Octave Divider).
; The works best on pitched, monophonic sounds.

; The effect works by flip-flopping a two-state signal (+1 or -1) upon detections of every zero crossing of an input signal.
; Ideally, this creates an unbandlimited square wave with a frequency equal to that of the input signal. 
; There may be zero crossings not related to the fundamental component of the input signal 
;  and an input low-pass filter is provided to try and prevent these.

; The flip-flop can be instructed to switch on every zero crossing, only every two zero crossing, only every three zero crossings and so on,
;  and as the rate of switching in slowed by integer steps, the resulting square wave follows a sub-harmonic series.
; The sequence of pitches as fractions of the frequency of the fundamental of the input signal will therefore be:
;  1, 1/2, 1/3, 1/4, 1/5 and so on.
; This feature is controlled with the 'Division' control for each VOICE.

; An output low-pass filter is also provided (with resonance) and its cutoff frequency can also be controlled 
;  by the amplitude envelope of the input signal. 

; INPUT
; Input Mode - choose between a test sine tone (440 Hz) or live input (mono or stereo)
;                (stereo signal is mixed to mono before being processing. Output dry signal is still stereo in stereo mode, in mono mode, left channel is sent to both left and right)
; Input Gain - gain control on the input signal
; HPF        - a high-pass filter applied to the input signal before it is passed to the fundivider. This can improve stability and remove artefacts at the beginnings and endings of notes.
; LPF        - a low-pass filter applied to the input signal before it is passed to the fundivider. This can improve stability and remove artefacts at the beginnings and endings of notes.
; GATE
; Threshold  - threshold of the gate in decibels
; Att.       - attack time of the gate
; Rel.       - release time of the gate

; VOICE (x 4)
; On/Off
; Division   - division of the flip-flopping that creates the synthetic tone
; Level      - ampltude level of the voice

; OUTPUT
; Filter     - cutoff frequency of a moogladder resonant low-pass filter
; Resonance  - resonance of the moogladder low-pass filter
; Envelope   - amount of control of the filter cutoff frequency by the amplitude of the input signal
; Soften     - soften controls a simple first-order filter that rounds the switching that creates the square waves on each individual voice
; Dry        - dry signal level control fed into the fundivider effect
; Wet        - wet signal level control fed into the fundivider effect

<Cabbage>
form caption("Fundivider") size(635,535), pluginId("Octa"), colour(60,40,40)

#define DIAL_STYLE # trackerColour(100,100,100), trackerColour(150,150,100), trackerInsideRadius(0.75) #

image    bounds( 10, 10,100,510), colour(0,0,0,0), outlineThickness(1), channel("INPUT")
{
label    bounds( 10, 10, 80, 20), text("INPUT") 
label    bounds( 10, 45, 80, 12), text("INPUT MODE")
combobox bounds( 10, 60, 80, 20), channel("InputMode"), items("Sine Tone","Live (mono)","Live (stereo)"), value(2)
rslider  bounds( 10, 85, 80,100), channel("InGain"),    range(0,1, 0,0.5), valueTextBox(1), text("input Gain"), $DIAL_STYLE
rslider  bounds( -2,195, 60, 70), channel("InHPF"), range(5,2000, 50,0.5,1), valueTextBox(1), text("HPF"), $DIAL_STYLE
rslider  bounds( 45,195, 60, 70), channel("InLPF"), range(20,15000,4000,0.5,1), valueTextBox(1), text("LPF"), $DIAL_STYLE

line     bounds(  0,285,100,  1), colour("Grey")

label    bounds(  0,300,100, 20), text("GATE") 
rslider  bounds( 10,325, 80,100), channel("GateThresh"),  range(-90,-6,-48,1,1), valueTextBox(1), text("Threshold"), $DIAL_STYLE
rslider  bounds(  -2,435, 60, 70), channel("GateAtt"), range(0.01,1,0.01,0.5), valueTextBox(1), text("Att."), $DIAL_STYLE
rslider  bounds( 45,435, 60, 70), channel("GateRel"), range(0.01,1,0.1,0.5), valueTextBox(1), text("Rel."), $DIAL_STYLE
}

image    bounds(110,265, 20,  1)
image    bounds(130, 70,  1,390)
image    bounds(130, 70, 20,  1)
image    bounds(130,200, 20,  1)
image    bounds(130,330, 20,  1)
image    bounds(130,460, 20,  1)

image    bounds(405, 70, 20,  1)
image    bounds(405,200, 20,  1)
image    bounds(405,330, 20,  1)
image    bounds(405,460, 20,  1)
image    bounds(425, 70,  1,390)
image    bounds(425,265, 20,  1)

image    bounds(150, 10,255,120), colour(0,0,0,0), outlineThickness(1)
{
label    bounds( 10, 10, 80, 20), text("VOICE 1") 
checkbox bounds( 15, 40, 80, 15), text("On/Off") channel("OnOff1"), value(1)
rslider  bounds( 90,  5, 80,100), channel("divider1"), range(1,32,1,1,1), valueTextBox(1), text("Division"), $DIAL_STYLE
rslider  bounds(170,  5, 80,100), channel("level1"), range(0,5,0.6,0.5), valueTextBox(1), text("Level"), $DIAL_STYLE
}

image    bounds(150,140,255,120), colour(0,0,0,0), outlineThickness(1)
{
label    bounds( 10, 10, 80, 20), text("VOICE 2") 
checkbox bounds( 15, 40, 80, 15), text("On/Off") channel("OnOff2"), value(1)
rslider  bounds( 90,  5, 80,100), channel("divider2"), range(1,32,2,1,1), valueTextBox(1), text("Division"), $DIAL_STYLE
rslider  bounds(170,  5, 80,100), channel("level2"), range(0,5,0.6,0.5), valueTextBox(1), text("Level"), $DIAL_STYLE
}

image    bounds(150,270,255,120), colour(0,0,0,0), outlineThickness(1)
{
label    bounds( 10, 10, 80, 20), text("VOICE 3") 
checkbox bounds( 15, 40, 80, 15), text("On/Off") channel("OnOff3"), value(1)
rslider  bounds( 90,  5, 80,100), channel("divider3"), range(1,32,3,1,1), valueTextBox(1), text("Division"), $DIAL_STYLE
rslider  bounds(170,  5, 80,100), channel("level3"), range(0,5,0.6,0.5), valueTextBox(1), text("Level"), $DIAL_STYLE
}

image    bounds(150,400,255,120), colour(0,0,0,0), outlineThickness(1)
{
label    bounds( 10, 10, 80, 20), text("VOICE 4") 
checkbox bounds( 15, 40, 80, 15), text("On/Off") channel("OnOff4"), value(1)
rslider  bounds( 90,  5, 80,100), channel("divider4"), range(1,32,4,1,1), valueTextBox(1), text("Division"), $DIAL_STYLE
rslider  bounds(170,  5, 80,100), channel("level4"), range(0,5,0.6,0.5), valueTextBox(1), text("Level"), $DIAL_STYLE
}

image    bounds(445, 10,180,510), colour(0,0,0,0), outlineThickness(1)
{
label    bounds( 10, 10,160, 20), text("OUTPUT"), align("centre") 
rslider  bounds( 10, 35, 80,100), channel("OutFilter"), range(50,15000,4000,0.5,1), valueTextBox(1), text("Filter"), $DIAL_STYLE
rslider  bounds( 90, 35, 80,100), channel("Res"), range(0,0.98,0,0.5), valueTextBox(1), text("Resonance"), $DIAL_STYLE
rslider  bounds( 50,145, 80,100), channel("Env"), range(0,1,0,0.5), valueTextBox(1), text("Envelope"), $DIAL_STYLE
rslider  bounds( 50,255, 80,100), channel("Soft"), range(0,1,0.1), valueTextBox(1), text("Soften"), $DIAL_STYLE
rslider  bounds( 10,365, 80,100), channel("DryGain"),    range(0,5, 0.7,0.5), valueTextBox(1), text("Dry Gain"), $DIAL_STYLE
rslider  bounds( 90,365, 80,100), channel("WetGain"),    range(0,5, 0.7,0.5), valueTextBox(1), text("Wet Gain"), $DIAL_STYLE
label    bounds( 10,475,150, 12), text("D r y / W e t") ;, fontColour("White")
hslider  bounds( 10,487,150, 20), channel("DryWet"), range(0,1,1,0.5) ;, valueTextBox(1), text("Dry/Wet")
}

label   bounds( 10,522,100, 11), text("Iain McCurdy |2023|"), align("centre"), fontColour("grey")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  =  16
nchnls =  2
0dbfs  =  1


opcode OctaveDivider,a,ak
 ain,kdivider xin
 krms   rms  ain
        setksmps   1              ; SET kr=sr, ksmps=1 (sample)
 kcount init       0              ; COUNTER USED TO COUNT ZERO CROSSINGS
 kout   init       -1             ; INITIAL DISPOSITION OF OUTPUT SIGNAL
 ksig   downsamp   ain            ; CREATE A K-RATE VERSION OF THE INPUT AUDIO SIGNAL
 ktrig  trigger    ksig,0,2       ; IF THE INPUT AUDIO SIGNAL (K-RATE VERSION) CROSSES ZERO IN EITHER DIRECTION, GENERATE A TRIGGER
 if ktrig==1 then                 ; IF A TRIGGER HAS BEEN GENERATED...
  kcount wrap kcount+1,0,kdivider ; INCREMENT COUNTER BUT WRAPAROUND ACCORDING TO THE NUMBER OF FREQUENCY DIVISIONS REQUIRED
  if kcount=0 then                ; IF WE HAVE COMPLETED A DIVISION BLOCK (I.E. COUNTER HAS JUST WRAPPED AROUND)...
   kout = (kout=-1?1:-1)          ; FLIP THE OUTPUT SIGNAL BETWEEN -1 AND 1 (THIS WILL CREATE A SQUARE WAVE)
  endif
 endif
 kSoft  cabbageGetValue  "Soft"

 kout2  portk       kout, kSoft/1000 ;0.0001   ; SMOOTHEN THE SWITCHING
 aout   interp     kout2          ; CREATE A-RATE SIGNAL FROM K-RATE SIGNAL
        xout       aout*krms      ; SEND AUDIO BACK TO CALLER INSTRUMENT, SCALE ACCORDING TO THE ENVELOPE FOLLOW OF THE INPUT SIGNAL
endop


instr    1 ; always on
kporttime linseg 0,0.01,0.05
; Choose input - test tone or computer's live input
aLiveL,aLiveR ins
aTest         poscil          0.1,880
kInputMode    cabbageGetValue "InputMode"
if kInputMode==1 then
aL            =               aTest
aR            =               aTest
elseif kInputMode==2 then
aL            =               aLiveL
aR            =               aLiveL
elseif kInputMode==3 then
aL            =               aLiveL
aR            =               aLiveR
endif

; Scale amplitude of input 
kInGain       cabbageGetValue "InGain"
aL            *=              kInGain
aR            *=              kInGain

; Mix channels to provide mono input to the Fundivider effect 
aMix          sum             aL,aR

kInHPF        cabbageGetValue "InHPF"
kInLPF        cabbageGetValue "InLPF"
aMix          buthp           aMix, kInHPF
aMix          buthp           aMix, kInHPF
aMix          butlp           aMix, kInLPF
aMix          butlp           aMix, kInLPF

; Gate to remove noise floor
kGateThresh   cabbageGetValue "GateThresh"
kGateAtt      cabbageGetValue "GateAtt"
kGateRel      cabbageGetValue "GateRel"
kRMS          rms             aMix
kGate         =               kRMS > ampdbfs(kGateThresh) ? 1 : 0
kGate         lagud           kGate, kGateAtt, kGateRel
aMix          *=              a(kGate)

aOutMix       =               0  ; a mix variable used in the macro below. Needs to be cleared on each perf. pass

; A macro for a Fundivider voice
#define VOICE(N)
#
kOnOff$N     cabbageGetValue  "OnOff$N"
kdivider$N   cabbageGetValue  "divider$N"
klevel$N     cabbageGetValue  "level$N"
aDiv$N       OctaveDivider    aMix,kdivider$N
aDiv$N       =                aDiv$N*klevel$N*kOnOff$N
aOutMix      +=               aDiv$N
#
; expand the macro four times
$VOICE(1)
$VOICE(2)
$VOICE(3)
$VOICE(4)

; Output Filter
kOutFilter   cabbageGetValue  "OutFilter"       ; cutoff
kRes         cabbageGetValue  "Res"
kEnv         cabbageGetValue  "Env"             ; amount by which the cutoff will be controlled by the ampltude of the input signal
aFollow      follow2          aL+aR, 0.01, 0.05 ; amplitude follow the input signal
aFollow      limit            aFollow*10,0,1     ; scale this sigal up but limit it between 0 and 1
aEnv         =                (1 - kEnv) + (aFollow*kEnv)       ; create the envelope following function that will be used to scale the cutoff frequency
aOutMix      moogladder       aOutMix, a(kOutFilter)*aEnv, kRes ; low-pass filter the mixed Fundivider voices

; output mixer between dry and wet signals
kDry         cabbageGetValue  "Dry"
kWet         cabbageGetValue  "Wet"

kDryWet      cabbageGetValue  "DryWet"
kDryWet      portk            kDryWet, kporttime
kDry         limit            (1-kDryWet)*2,0,1
kWet         limit            (kDryWet*2)-1,0,1

kDryGain     cabbageGetValue  "DryGain"
kWetGain     cabbageGetValue  "WetGain"

aOutL        sum              aOutMix*kWet*kWetGain, aL*kDry*kDryGain
aOutR        sum              aOutMix*kWet*kWetGain, aR*kDry*kDryGain

             outs             aOutL, aOutR
endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>