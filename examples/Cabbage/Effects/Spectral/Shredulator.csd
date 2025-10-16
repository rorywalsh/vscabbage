
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Shredulator.csd
; Written by Iain McCurdy, 2016, 2024, 2025 (fixed feedback, didn't work previously)

; This effect implements an FFT delay, the delay time of which can be shifted using a random sample and hold function.
; In sync with this random function, amplitude and transposition of each grain can also be randomised.
; In essence, this is a real-time granulator.

; CONTROLS
; --------

; FILE PLAYER
; Audio input can be either from live audio input or from a sound file.
; LOAD FILE       -  load a sound file
; PLAY            -  play the sound file (if PLAY is not activated, audio input is from the live stereo audio inputs, PLAY deactivates live-audio input)
; Speed           -  playback speed as a ratio against normal playback speed

; DELAY
; FFT Size        -  size of FFT window: smaller sizes provides better time resolution but possible distortion of frequency components
; St. Sync        -  if activated, random number generators for the left and right channels are shared 
; Layers          -  number of layers of granulation. 
;                    In this first instance raising this will raise the overall level output so 'Level' may need to be reduced.
;                    The random number generators for 'Rate Rand', 'Time Range', 'Amp Range and 'Randomise' (TRANSPOSE) - 
;                    operate independently for each layer so these controls should be increased to hear the effectiveness of multiple layers. 
;                    The number of layers possible will be dependent on CPU resources.
; Rate            -  Rate at which new random delay times are generated. 
;                    This also controls the rate at which new random amplitude and transposition values will be generated.
;                    Another way of conceiving of this control is as a combined density and grain size (inversely proportional) control. 
; Rate Rand.      -  
; Max Delay       -  Maximum delay time as defined by the circular (pvs) buffer. This is i-rate (hence, red colour) so altering it will cause discontinuities in the realtime audio stream.
;                    Note that maximum delay time can modulated at k-rate using the 'Time Range' control. This will be a ratio (0 to 1) of the value set here.
;                    and random transposition ('Randomise') values are generated.
; Time Range      -  Amplitude of the random delay time generator. 
;                    This, along with 'Max.Delay', controls the maximum random delay time possible but this one is controllable in real-time without producing discontunities in the output audio stream.
; Amp. Range      -  Amount of random amplitude variation on a grain-by-grain basis. 
;                    Beside the modulation of amplitudes in the transformed signal, this manifests as a density brake but will also restrict the amount of feedback possible. 
; Feedback        -  Ratio of output (pvs) signal that is fed back into the input.

; TRANSPOSE
; Semitones       -  Fixed transposition in semitones.
; Cents           -  Fixed transposition in cents (final fixed transposition is the sum of 'Semitones' and 'Cents')
; Pre/Post FB     -  If 'Pre' is selected, the signal before transposition is sent to the output (transpositions are only heard via the feedback signal), 
;                    if 'Post' is selected the, the transposed signal is sent directly to the output
; Randomise       -  grain-by-grain random transposition range in semitones. Random distribution is gaussian.
; Quantise        -  a mechanism for quantising the possible transposition pitches resulting from all of the previous controls for transposition.
;                     off, semitones, octaves, user
; User Quantise   -  the quantise interval (in semitones) if 'User' has been chosen under the 'Quantise' combobox. 
; Unipolar        -  if active, random transposition value are unipolar. 
;                     Whether these are in the positive or negative domains depends on the polarity of the 'Randomise' control.  

; FILTER
; A band-pass filter that is inserted in the signal path
; Values for centre frequency and bandwidth are generated on a grain-by-grain basis.
; This filter is within the feedback loop so as grains are fed back, they are likely to be filtered even more, leading to a more rapid loss of power.
; On/Off          -  turn the filter on or off
;

; OUTPUT
; Envelope        -  off, hannning, perc, pinch, anti-click, half-sine - choose whether to apply and envelope to each grain and using what shape.
;                     envelopes are displayed to provide indication of their shape 
; Width           -  stereo width
; Width Rand.     -  random balance control (only available when 'St. Sync' is active)
;                    It is recommended to use an envelope mode other than 'Off' when using this feature.
; Dry/Wet Mix     -  crossfade between the input sound and the granulated sound.
; Wet Gain        -  gain applied to the wet signal. Useful for compensating for power losses from, for example, use of the band-pass filter.
; Level           -  output level (both dry and wet signals)

<Cabbage>
form  size(645,690), caption("SHREDULATOR"),colour(225,230,255), pluginId("Shrd"), guiMode("queue")

#define SLIDER_DESIGN   fontColour("Black"), textColour("Black"), colour(20,20,155), trackerColour(150,150,225), markerColour(150,150,225), trackerBackgroundColour(0,0,0,0), outlineColour(0,0,0,50), trackerInsideRadius(.8)
#define SLIDER_DESIGN_I fontColour("Black"), textColour("Black"), colour(155,20,20), trackerColour(225,150,150), markerColour(225,150,150), trackerBackgroundColour(0,0,0,0), outlineColour(0,0,0,50), trackerInsideRadius(.8)

image   bounds( 87,-2,460, 45), colour(0,0,0,0), outlineThickness(0), plant("title")
{
label   bounds(  0,  1,460, 51), text("SHREDULATOR"), fontColour(155,155,155), align("centre")
image   bounds( 55, 21,325,  5),   colour(225,230,255), shape("sharp"), rotate(0.1,162,2)
image   bounds( 90, 21,200,  7),   colour(225,230,255), shape("sharp"), rotate(-0.18,100,3)

label   bounds(  1,  3,459, 50), text("SHREDULATOR"), fontColour(  5,  5,  5)
image   bounds( 45, 21, 80,  2),   colour(225,230,255), shape("sharp"), rotate(-0.8,40,1)
image   bounds(110, 21, 55,  2),   colour(225,230,255), shape("sharp"), rotate( 0.8,22,1)
image   bounds( 85, 34,100,  3),   colour(225,230,255), shape("sharp"), rotate(-0.4,22,1)
image   bounds(160, 34,180,  3),   colour(225,230,255), shape("sharp"), rotate(-0.2,45,2)
image   bounds(215, 17, 70,  4),   colour(225,230,255), shape("sharp"), rotate( 0.5,22,2)
image   bounds(250, 21,150,  4),   colour(225,230,255), shape("sharp"), rotate( 0.2,60,2)
image   bounds(271, 31, 53,  2),   colour(225,230,255), shape("sharp"), rotate(-0.1,22,1)
image   bounds(340, 21, 60,  2),   colour(225,230,255), shape("sharp"), rotate( 0.7,22,1)
}
label bounds(522,676,117,12), fontColour("black"), text("Iain McCurdy |2016|") align("right")

image    bounds(  5, 55,635,120), colour(235,240,255), outlineColour("DarkGrey"), outlineThickness(5), corners(15)
{  
label      bounds(  0,  5,635, 16), text("F   I   L   E       P   L   A   Y   E   R"), fontColour("Black"), align("centre")
filebutton bounds( 10, 34, 70, 25), text("Open File","Open File"), fontColour("white") channel("filename"), corners(5)
button     bounds( 10, 74, 70, 25), text("PLAY","PLAY"), fontColour("white") channel("Play"), latched(1), colour:0(10,55,10), colour:1(70,200,70), corners(5)
soundfiler bounds( 90, 24,465, 85), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
image      bounds( 85, 19,470, 95), colour(0,0,0,0), outlineThickness(10), corners(15), outlineColour(235,240,255) ; bevel
label      bounds( 95, 27,460, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
rslider    bounds(548, 20, 90, 90), text("Speed"), textBox(1), valueTextBox(1), channel("PBSpeed"), range(-2, 2, 1), $SLIDER_DESIGN
}

image    bounds(  5,180,635,120), colour(235,240,255), outlineColour("DarkGrey"), outlineThickness(5), corners(15)
{  
label    bounds(  0,  5,635, 16), text("D    E    L    A    Y"), fontColour("Black"), align("centre")
label    bounds( 15, 10, 70, 14), text("FFT Size"), fontColour("Black")
combobox bounds( 15, 25, 70, 20), text("64","128","256","512","1024","2048","4096"), channel("FFTindex"), value(5)
checkbox bounds( 15, 55, 70, 15), text("St. Sync."), channel("StereoSync"), fontColour:0("black"), fontColour:1("black"), colour("yellow")
nslider  bounds( 15, 70, 70, 35), text("Layers"), channel("Layers"), range(1, 99, 1, 1,1), textColour("Black")
rslider  bounds( 85, 20, 90,90), text("Rate"), textBox(1), valueTextBox(1), channel("Rate"), range(0.1, 500, 10,0.5,0.1), $SLIDER_DESIGN
rslider  bounds(160, 20, 90,90), text("Rate Rand."), textBox(1), valueTextBox(1), channel("RateRnd"), range(0, 4, 0,1,0.01), $SLIDER_DESIGN
rslider  bounds(235, 20, 90,90), text("Max.Delay"), textBox(1), valueTextBox(1), channel("MaxDelay"), range(0.1, 8, 3.7,0.5), $SLIDER_DESIGN_I
rslider  bounds(310, 20, 90,90), text("Time Range"), textBox(1), valueTextBox(1), channel("TimeRange"), range(0, 1, 0), $SLIDER_DESIGN
rslider  bounds(385, 20, 90,90), text("Play Slide"), textBox(1), valueTextBox(1), channel("PlaySlide"), range(0, 1, 0), $SLIDER_DESIGN
rslider  bounds(460, 20, 90,90), text("Amp. Range"), textBox(1), valueTextBox(1), channel("AmpRange"), range(0, 1, 0), $SLIDER_DESIGN
rslider  bounds(535, 20, 90,90), text("Feedback"), textBox(1), valueTextBox(1), channel("Feedback"), range(0, 1, 0.5), $SLIDER_DESIGN
}

image    bounds(  5,305,635,120), colour(235,240,255), outlineColour("DarkGrey"), outlineThickness(5), corners(15)
{  
label    bounds(  0,  5,635, 16), text("T    R    A    N    S    P    O    S    E"), fontColour("Black"), align("centre")
rslider  bounds( 35, 20, 90, 90), text("Semitones"), textBox(1), valueTextBox(1), channel("Semitones"), range(-48, 48, 0, 1, 0.01), $SLIDER_DESIGN
rslider  bounds(115, 20, 90, 90), text("Cents"), textBox(1), valueTextBox(1), channel("Cents"), range(-100, 100, 0,1,1), $SLIDER_DESIGN
label    bounds(220, 35, 80, 14), text("Pre/Post FB"), fontColour("Black")
combobox bounds(220, 50, 80, 20), text("Pre","Post"), channel("PrePost"), value(2)
rslider  bounds(315, 20, 90, 90), text("Randomise"), textBox(1), valueTextBox(1), channel("TransRand"), range(-48, 48, 0), $SLIDER_DESIGN
label    bounds(420, 35, 80, 14), text("Quantise"), fontColour("Black")
combobox bounds(420, 50, 80, 20), text("Off","Semitones","Octave","User"), channel("Quantise"), value(1)
checkbox bounds(420, 75, 70, 15), text("Unipolar"), channel("QuantUni"), fontColour:0("black"), fontColour:1("black"), colour("yellow")
rslider  bounds(515, 20, 90, 90), text("User Quant."), textBox(1), valueTextBox(1), channel("UserQuant"), range(0, 12, 5), $SLIDER_DESIGN, active(0), alpha(0.5)
}

image    bounds(  5,430,635,120), colour(235,240,255), outlineColour("DarkGrey"), outlineThickness(5), corners(15)
{  
label    bounds(  0,  5,635, 16), text("F    I    L    T    E    R"), fontColour("Black"), align("centre")
checkbox bounds( 15, 25, 70, 15), text("On/Off"), channel("FiltOnOff"), fontColour:0("black"), fontColour:1("black"), colour("yellow")
rslider  bounds( 85, 20, 90,90), text("Freq. Mix"), textBox(1), valueTextBox(1), channel("BPF_FreqMin"), range(20, 20000, 100, 0.5, 1), $SLIDER_DESIGN
rslider  bounds(175, 20, 90,90), text("Freq. Max"), textBox(1), valueTextBox(1), channel("BPF_FreqMax"), range(20, 20000, 5000, 0.5, 1), $SLIDER_DESIGN
rslider  bounds(295, 20, 90,90), text("Bandwidth Min."), textBox(1), valueTextBox(1), channel("BPF_BWMin"), range(0.01, 4, 0.1, 0.5, 0.001), $SLIDER_DESIGN
rslider  bounds(385, 20, 90,90), text("Bandwidth Max."), textBox(1), valueTextBox(1), channel("BPF_BWMax"), range(0.01, 4,  1, 0.5, 0.001), $SLIDER_DESIGN
rslider  bounds(495, 20, 90,90), text("Slope"), textBox(1), valueTextBox(1), channel("BPF_Slope"), range(0.00, 4, 0.1, 0.5, 0.001), $SLIDER_DESIGN
}

image    bounds(  5,555,635,120), colour(235,240,255), outlineColour("DarkGrey"), outlineThickness(5), corners(15)
{  
label    bounds(  0,  5,635, 16), text("O    U    T    P    U    T"), fontColour("Black"), align("centre")

label    bounds( 30, 30, 75, 14), text("Envelope"), fontColour("Black")
combobox bounds( 30, 45, 75, 20), text("Off","Hanning","Perc","Pinch","Anti-Click","Half-Sine"), channel("Envelope"), value(1)
gentable bounds( 30, 70, 75, 30), tableNumber(1001), channel("EnvelopeTab"), ampRange(0,1,1001), fill(0)

rslider  bounds(137, 20, 90,90), text("Width"), textBox(1), valueTextBox(1), channel("Width"), range(0, 1, 1), $SLIDER_DESIGN
rslider  bounds(217, 20, 90,90), text("Width Rand."), textBox(1), valueTextBox(1), channel("WidthRand"), range(0, 1, 0), $SLIDER_DESIGN, active(0), alpha(0.5)

rslider  bounds(337, 20, 90,90), text("Dry/Wet Mix"), textBox(1), valueTextBox(1), channel("DryWetMix"), range(0, 1, 1), $SLIDER_DESIGN
rslider  bounds(417, 20, 90,90), text("Wet Gain"), textBox(1), valueTextBox(1), channel("WetGain"), range(1, 20, 1, 0.5), $SLIDER_DESIGN
rslider  bounds(497, 20, 90,90), text("Level"), textBox(1), valueTextBox(1), channel("Level"), range(0, 5, 1, 0.5), $SLIDER_DESIGN
}


</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -d -+rtmidi=NULL -M0 -m0d 
</CsOptions>
                                           
<CsInstruments>

; sr is set by host
ksmps  = 16
nchnls = 2
0dbfs  = 1


gkNChans        init 0
gaFileL,gaFileR init 0

; envelope tables
giHanning    ftgen    1,  0, 131073,  20,   2, 1                                                      ; HANNING
giPerc       ftgen    2,  0, 131073,  5,    0.001, 0.05 * 131072, 1, 0.95 * 131072, 0.001                                                      ; HANNING
giPinch      ftgen    3,  0, 131073,  20, 6, 1, 0.5 ; gaussian
giAntiClick  ftgen    4,  0, 131073,  5, 0.001, 131072 * 0.1, 1, 131072*0.8, 1, 131072 * 0.1, 0.001
giHalfSine   ftgen    5,  0, 131073,  19, 0.5, 1, 0, 0

iDispTabSize  =        4096
giDispTab     ftgen    1001,  0, iDispTabSize,  2, 0                     ; display table (envelope)

; display tables (need smaller size)
giFlat       ftgen    100,  0, iDispTabSize,  2,   0
giHanning    ftgen    101,  0, iDispTabSize,  20,   2, 1                                                      ; HANNING
giPerc       ftgen    102,  0, iDispTabSize,  5,    0.001, 0.1 * iDispTabSize, 1, 0.9 * iDispTabSize, 0.001                                                      ; HANNING
giPinch      ftgen    103,  0, iDispTabSize,  20, 6, 1, 0.5 ; gaussian
giAntiClick  ftgen    104,  0, iDispTabSize,  5, 0.001, iDispTabSize * 0.1, 1, iDispTabSize * 0.8, 1, iDispTabSize * 0.1, 0.001
giHalfSine   ftgen    105,  0, iDispTabSize,  19, 0.5, 1, 0, 0

opcode SHREDULATOR, af, kkkkkkkkkkkkkkkkkkikkKip
 kMaxDelay,kTimeRange,kPlaySlide,kRate,kRateRnd,kAmpRange,kTranspose,kTransRand,kQuantise,kUserQuant,kQuantUni,kFiltOnOff,kCFMin,kCFMax,kBWMin,kBWMax,kSlope,kTime,iHandle,kFeedback,kPrePost,kEnvelope,iLayers,iCount xin
 kRateL               init             i(kRate)                                ; local rate
 kRandBase            randomh          -1, 1, kRateL, 1                        ; base random function. Used to create triggers.
 kRandTrig            changed          kRandBase                               ; generate a trigger when random rate changes
 kRateRndL            trandom          kRandTrig, -kRateRnd, kRateRnd          ; local random
 kRateL               =                kRate * (2 ^ kRateRndL)                 ; local rate (of granulation)
 kDly                 trandom          kRandTrig, 0, i(kMaxDelay) * kTimeRange ; random delay time (sample and hold)
 kAmp                 trandom          kRandTrig, -kAmpRange * 60, 0           ; random amplitude (sample and hold)

 ; transposition
 kTransposeRand       gauss            kTransRand
 if kRandTrig==1 then
  kTransposeL         =                kTranspose + kTransposeRand             ; transposition in semitones
  if kQuantise==2 then       ;  quantise in semitones
   kTransposeL        =                round(kTransposeL)
  elseif  kQuantise==3 then  ;  quantise in octaves
   kTransposeL        =                (round(kTransposeL/12)) * 12
  elseif  kQuantise==4 then  ;  quantise using user-defined interval
   kTransposeL        =                (round(kTransposeL/kUserQuant)) * kUserQuant
  endif
  if kQuantUni==1 then ; quantise to unipolar values
   kTransposeL = abs(kTransposeL) * (kTransRand>0?1:-1)
  endif
  kTransposeL         =                semitone(kTransposeL)
 endif 
 
 ; envelope
 aPtr                 phasor           kRateL
 iTab                 limit            i(kEnvelope)-1, 1, 5
 aEnv                 tablei           aPtr, iTab, 1        
 
 ; playback head random sliding
 kPlaySlideFunc       rspline          0, kPlaySlide, .3 * kRateL, .6 * kRateL
 kPlaySlideFunc       limit            kPlaySlideFunc, 0, 1
 
 fsigOut              pvsbufread       kTime - kDly - kPlaySlideFunc, iHandle    ; read from buffer
 fsigGran             pvsgain          fsigOut, ampdbfs(kAmp)
 fScale               pvscale          fsigGran, kTransposeL
 
 ; filter
 if kFiltOnOff==1 then
  kCF                  trandom          kRandTrig, kCFMin, kCFMax
  kBW                  trandom          kRandTrig, kBWMin, kBWMax ; octaves
  kF2                  limit            kCF - ((kCF*kBW)*0.5), 20, 20000
  kF1                  limit            kF2 - (kF2*kSlope), 20, 20000
  kF3                  limit            kCF + ((kCF*kBW)*0.5), 20, 20000
  kF4                  limit            kF3 + (kF3*kSlope), 20, 20000
  fBPF                 pvsbandp         fScale, kF1, kF2, kF3, kF4
 else
  fBPF                 pvsgain          fScale, 1
 endif
 
 fsigFB               pvsgain          fBPF, kFeedback                          ; create feedback signal for next pass
 if kPrePost==1 then
  aDly                pvsynth          fsigGran                                   ; resynthesise read buffer output
 else
  aDly                pvsynth          fBPF                                     ; resynthesise read buffer output
 endif
 
 if kEnvelope>1 then
  aDly                *=               aEnv
 endif

 if iCount < iLayers then
  aDlyMix, fsigFBMix SHREDULATOR kMaxDelay,kTimeRange,kPlaySlide,kRate,kRateRnd,kAmpRange,kTranspose,kTransRand,kQuantise,kUserQuant,kQuantUni,kFiltOnOff,kCFMin,kCFMax,kBWMin,kBWMax,kSlope,kTime,iHandle,kFeedback,kPrePost,kEnvelope,iLayers,iCount+1
  aDly               +=          aDlyMix
  ;fsigFBMix2         pvsmix      fsigFB, fsigFBMix ;; it doesn't seem necessary to mix the feedback signal from subsequent layers into the actual feedback path
 endif

                      xout             aDly, fsigFB
endop




; stereo version: random number generators will be linked
opcode SHREDULATOR_ST, aaff, kkkkkkkkkkkkkkkkkkkiikkkKip
 kMaxDelay,kTimeRange,kPlaySlide,kRate,kRateRnd,kAmpRange,kTranspose,kTransRand,kQuantise,kUserQuant,kQuantUni,kFiltOnOff,kCFMin,kCFMax,kBWMin,kBWMax,kSlope,kTimeL,kTimeR,iHandleL,iHandleR,kFeedback,kPrePost,kEnvelope,kWidthRand,iLayers,iCount  xin

 kRateL               init             i(kRate)                                ; local rate
 kRandBase            randomh          -1, 1, kRateL, 1                        ; base random function. Used to create triggers.
 kRandTrig            changed          kRandBase                               ; generate a trigger when random rate changes
 kRateRndL            trandom          kRandTrig, -kRateRnd, kRateRnd          ; local random
 kRateL               =                kRate * (2 ^ kRateRndL)                 ; local rate (of granulation)
 kDly                 trandom          kRandTrig, 0, i(kMaxDelay) * kTimeRange ; random delay time (sample and hold)
 kAmp                 trandom          kRandTrig, -kAmpRange * 60, 0           ; random amplitude (sample and hold)
 kBal                 trandom          kRandTrig, -kWidthRand, kWidthRand
 
 ; transposition
 kTransposeRand       gauss            kTransRand
 if kRandTrig==1 then
  kTransposeL         =                kTranspose + kTransposeRand             ; transposition in semitones
  if kQuantise==2 then       ;  quantise in semitones
   kTransposeL        =                round(kTransposeL)
  elseif  kQuantise==3 then  ;  quantise in octaves
   kTransposeL        =                (round(kTransposeL/12)) * 12
  elseif  kQuantise==4 then  ;  quantise using user-defined interval
   kTransposeL        =                (round(kTransposeL/kUserQuant)) * kUserQuant
  endif
  if kQuantUni==1 then ; quantise to unipolar values
   kTransposeL = abs(kTransposeL) * (kTransRand>0?1:-1)
  endif
  kTransposeL         =                semitone(kTransposeL)
 endif 
 
 ; envelope
 aPtr                 phasor           kRateL
 iTab                 limit            i(kEnvelope)-1, 1, 5
 aEnv                 tablei           aPtr, iTab, 1        

 ; playback head random sliding
 kPlaySlideFunc       rspline          0, kPlaySlide, .3 * kRateL, .6 * kRateL
 kPlaySlideFunc       limit            kPlaySlideFunc, 0, 1
 
 ; left
 fsigOutL             pvsbufread       kTimeL - kDly - kPlaySlideFunc, iHandleL   ; read from buffer
 fsigGranL            pvsgain          fsigOutL, ampdbfs(kAmp)
 fScaleL              pvscale          fsigGranL, kTransposeL
; filter
 if kFiltOnOff==1 then
  kCF                  trandom          kRandTrig, kCFMin, kCFMax
  kBW                  trandom          kRandTrig, kBWMin, kBWMax ; octaves
  kF2                  limit            kCF - ((kCF*kBW)*0.5), 20, 20000
  kF1                  limit            kF2 - (kF2*kSlope), 20, 20000
  kF3                  limit            kCF + ((kCF*kBW)*0.5), 20, 20000
  kF4                  limit            kF3 + (kF3*kSlope), 20, 20000
  fBPFL                pvsbandp         fScaleL, kF1, kF2, kF3, kF4
 else
  fBPFL                pvsgain          fScaleL, 1
 endif
 fsigFB_L             pvsgain          fScaleL, kFeedback                         ; create feedback signal for next pass
 
 ; right
 fsigOutR             pvsbufread       kTimeR - kDly - kPlaySlideFunc, iHandleR                    ; read from buffer
 fsigGranR            pvsgain          fsigOutR, ampdbfs(kAmp)
 fScaleR              pvscale          fsigGranR, kTransposeL
; filter
 if kFiltOnOff==1 then
  fBPFR                pvsbandp         fScaleR, kF1, kF2, kF3, kF4 ; right channel uses same values as left
 else
  fBPFR                pvsgain          fScaleR, 1
 endif
 fsigFB_R             pvsgain          fBPFR, kFeedback                         ; create feedback signal for next pass
 
 if kPrePost==1 then
  aDlyL               pvsynth          fsigGranL                                  ; resynthesise read buffer output
  aDlyR               pvsynth          fsigGranR                                  ; resynthesise read buffer output
 else
  aDlyL               pvsynth          fBPFL                                    ; resynthesise read buffer output
  aDlyR               pvsynth          fBPFR                                    ; resynthesise read buffer output
 endif
 
 if kEnvelope>1 then
  aDlyL               *=               aEnv
  aDlyR               *=               aEnv
 endif
 
 ; random balance
 aDlyL                *=               limit:k(1 - kBal,0,1)
 aDlyR                *=               limit:k(1 - (kBal*(-1)),0,1)

 if iCount < iLayers then
  aDlyMixL, aDlyMixR, fsigFBMixL, fsigFBMixR SHREDULATOR_ST kMaxDelay,kTimeRange,kPlaySlide,kRate,kRateRnd,kAmpRange,kTranspose,kTransRand,kQuantise,kUserQuant,kQuantUni,kFiltOnOff,kCFMin,kCFMax,kBWMin,kBWMax,kSlope,kTimeL,kTimeR,iHandleL,iHandleR,kFeedback,kPrePost,kEnvelope,kWidthRand,iLayers,iCount+1
  aDlyL               +=          aDlyMixL
  aDlyR               +=          aDlyMixR
  ;fsigFBMix2         pvsmix      fsigFB, fsigFBMix ;; it doesn't seem necessary to mix the feedback signal from subsequent layers into the actual feedback path
 endif

                      xout             aDlyL, aDlyR, fsigFB_L, fsigFB_R
endop



instr    1
 ; load file from browse
 gSfilepath           cabbageGetValue         "filename"        ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then                               ; call instrument to update waveform viewer  
                      event                   "i", 99, 0, 0
 endif 
 
 gkPlay               cabbageGetValue         "Play"
 if trigger:k(gkPlay,0.5,0) == 1 then
                      event                   "i", 101, 0, 3600
 endif

 kMaxDelay            cabbageGetValue         "MaxDelay"
 kMaxDelay            init                    1
 kSemitones           cabbageGetValue         "Semitones"
 kCents               cabbageGetValue         "Cents"
 kTransRand           cabbageGetValue         "TransRand"
 kQuantise,kT         cabbageGetValue         "Quantise"
 ; show/hide control
                      cabbageSet              kT, "UserQuant", "active", kQuantise == 4 ? 1 : 0
                      cabbageSet              kT, "UserQuant", "alpha", kQuantise == 4 ? 1 : 0.5
 kUserQuant           cabbageGetValue         "UserQuant"
 kQuantUni            cabbageGetValue         "QuantUni"
 kTimeRange           cabbageGetValue         "TimeRange"
 kPlaySlide           cabbageGetValue         "PlaySlide"
 kRate                cabbageGetValue         "Rate"
 kRateRnd             cabbageGetValue         "RateRnd"
 kTranspose           =                       kSemitones + kCents * 0.01
 kFeedback            cabbageGetValue         "Feedback"
 kEnvelope            cabbageGetValue         "Envelope"
 kWidth               cabbageGetValue         "Width"
 kWidthRand           cabbageGetValue         "WidthRand"
 kDryWetMix           cabbageGetValue         "DryWetMix"
 kWetGain             cabbageGetValue         "WetGain"
 kLevel               cabbageGetValue         "Level"
 kFFTindex            cabbageGetValue         "FFTindex"
 kFFTindex            init                    4
 kAmpRange            cabbageGetValue         "AmpRange"
 kPrePost             cabbageGetValue         "PrePost"
 kPrePost             init                    1
 
 kFiltOnOff           cabbageGetValue         "FiltOnOff"
 kBPF_FreqMin         cabbageGetValue         "BPF_FreqMin"
 kBPF_FreqMax         cabbageGetValue         "BPF_FreqMax"
 kBPF_BWMin           cabbageGetValue         "BPF_BWMin"
 kBPF_BWMax           cabbageGetValue         "BPF_BWMax"
 kBPF_Slope           cabbageGetValue         "BPF_Slope"
 
 iFFTsizes[]          fillarray               64, 128, 256, 512, 1024, 2048, 4096  ; array of FFT size values
 
 kEnvShape init 1
 
 if changed:k(kEnvelope)==1 then
  tablecopy 1001, kEnvelope + 99
  cabbageSet 1, "EnvelopeTab", "tableNumber", kEnvelope + 99
 endif
  
 ; audio input
 if gkPlay==1 then ; sound file
   aL                 =                       gaFileL
   aR                 =                       gkNChans == 1 ? aL : gaFileR    ; mono stereo switch
 else ; live input
  aL,aR               ins
 endif
 
 kLayers              cabbageGetValue         "Layers"
 kLayers              init                    1
 
 if changed(kMaxDelay,kFFTindex,kEnvelope,kLayers)==1 then
                      reinit                  RESTART
 endif
 RESTART:

 iFFTsize             =              iFFTsizes[i(kFFTindex)-1]                ; retrieve FFT size value from array
 kFFTsize             init           iFFTsize                                 ; (for resync of dry signal delay)

 fsigInL              pvsanal        aL, iFFTsize, iFFTsize/4, iFFTsize, 1    ; FFT analyse audio
 fsigInR              pvsanal        aR, iFFTsize, iFFTsize/4, iFFTsize, 1    ; FFT analyse audio
 fsigFB_L             pvsinit        iFFTsize                                 ; initialise feedback signal
 fsigFB_R             pvsinit        iFFTsize                                 ; initialise feedback signal
 fsigMixL             pvsmix         fsigInL, fsigFB_L                        ; mix feedback with input
 fsigMixR             pvsmix         fsigInR, fsigFB_R                        ; mix feedback with input
 
 ; Resync dry signal
 kDelayTime           =              kFFTsize / sr
 iFixedLatency        =              23 ; (in milliseconds)
 aResyncL             vdelay         aL, (kDelayTime * sr * 1000) + iFixedLatency, (4096 / sr) * 1000 * 8.1
 aResyncR             vdelay         aR, (kDelayTime * sr * 1000) + iFixedLatency, (4096 / sr) * 1000 * 8.1
 
 ; set up pvs buffers for left and right
 iHandleL, kTimeL     pvsbuffer      fsigMixL, i(kMaxDelay) + 1                ; create a circular fsig buffer. +1 padding for the play slide feature 
 iHandleR, kTimeR     pvsbuffer      fsigMixR, i(kMaxDelay) + 1                ; create a circular fsig buffer. +1 padding for the play slide feature 

 ; send to UDOs
 kStereoSync,kT       cabbageGetValue         "StereoSync"
 ; show/hide control (only valid in stereo-sync mode)
                      cabbageSet              kT, "WidthRand", "active", kStereoSync == 1 ? 1 : 0
                      cabbageSet              kT, "WidthRand", "alpha", kStereoSync == 1 ? 1 : 0.5
 
 if kStereoSync==0 then ; unsynced
  aDlyL,fsigFB_L       SHREDULATOR    kMaxDelay,kTimeRange,kPlaySlide,kRate,kRateRnd,kAmpRange,kTranspose,kTransRand,kQuantise,kUserQuant,kQuantUni,kFiltOnOff,kBPF_FreqMin,kBPF_FreqMax,kBPF_BWMin,kBPF_BWMax,kBPF_Slope,kTimeL,iHandleL,kFeedback,kPrePost,kEnvelope,i(kLayers)
  aDlyR,fsigFB_R       SHREDULATOR    kMaxDelay,kTimeRange,kPlaySlide,kRate,kRateRnd,kAmpRange,kTranspose,kTransRand,kQuantise,kUserQuant,kQuantUni,kFiltOnOff,kBPF_FreqMin,kBPF_FreqMax,kBPF_BWMin,kBPF_BWMax,kBPF_Slope,kTimeR,iHandleR,kFeedback,kPrePost,kEnvelope,i(kLayers)
 else ; synced
  aDlyL,aDlyR,fsigFB_L,fsigFB_R SHREDULATOR_ST kMaxDelay,kTimeRange,kPlaySlide,kRate,kRateRnd,kAmpRange,kTranspose,kTransRand,kQuantise,kUserQuant,kQuantUni,kFiltOnOff,kBPF_FreqMin,kBPF_FreqMax,kBPF_BWMin,kBPF_BWMax,kBPF_Slope,kTimeL,kTimeR,iHandleL,iHandleR,kFeedback,kPrePost,kEnvelope,kWidthRand,i(kLayers)
 endif
 
 ; dry/wet mixing
 aMixL                ntrpol         aResyncL,aDlyL*kWetGain,kDryWetMix                      ; dry/wet audio mix
 aMixR                ntrpol         aResyncR,aDlyR*kWetGain,kDryWetMix                      ; dry/wet audio mix

 ; create mixes for left and right output
 aOutL                =              ( aMixL + (aMixR * (1 - kWidth)) ) * kLevel
 aOutR                =              ( (aMixL * (1-kWidth)) + aMixR ) * kLevel                                            
                      outs           aOutL, aOutR

endin





; LOAD SOUND FILE
instr    99
 giSource          =                   0
                   cabbageSet          "filer1", "file", gSfilepath
 gkNChans          init                filenchnls:i(gSfilepath)
 /* write file name to GUI */
 SFileNoExtension  cabbageGetFileNoExtension gSfilepath
                   cabbageSet                "FileName","text",SFileNoExtension
endin

; play sound file
instr 101
if gkPlay==0 then
                   turnoff
endif
 kPortTime    linseg 0, 0.001, 0.03
 kPBSpeed     cabbageGetValue "PBSpeed"
 kPBSpeed     portk   kPBSpeed, kPortTime 

if i(gkNChans)==1 then
 gaFileL           diskin2             gSfilepath, kPBSpeed, 0, 1
else
 gaFileL, gaFileR  diskin2             gSfilepath, kPBSpeed, 0, 1
endif
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
