
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; FrequencyShifter.csd
; Iain McCurdy, 2012, 2025
; 
; Frequency shifting using the hilbert filter
; 
; CONTROLS
; --------
; Input              --    Choose audio input: live (stereo), line (mono) sine tone or pink noise

; Bandpass
;   This is a brickwall bandpass filter (if slope=0 that can optionally be applied to the signal entering the frequency shifter.
;   Therefore the user can carefully select the frequencies that will be shifted.
; Bandpass (checkbox)--    turn the effect on or off
; Freq.              --    centre frequency of the band-pass filter
; Bandwidth          -     bandwidth of the band-pass filter in octaves.
; Slope              -     slope of the band-pass filter either side of the pass-band in hertz.

; Polarity           --    3 options: 'Positive' = multiply 'Freq.' by 1, 'Negative' = multiply 'Freq.' by -1, 'Dual' = sum of 'Positive' and 'Negative' outputs
; Mix                --    Dry/Wet mix control
; Freq.              --    Principle frequency of the shifting frequency (before modulation by other controls)
; Mult.              --    multipler of shifting frequency. Can be useful for finer control of shifting frequency around zero.
; Feedback           --    Amount of frequency shifter that is fed back into its input
;                           WARNING! High levels of feedback can on occasion cause explosive overloading so caution is advised.

;  [LFO~]
; Modulate Frequency --    Switch to activate LFO modulation  of shifting frequency
; Shape              --    Shape of the LFO: sine / triangle / square / random sample and hold / random splines
; Rate               --    Rate of LFO (in hertz)
; Min                --    Minimum frequency of the LFO modulation
; Max                --    Maximum frequency of the LFO modulation
; Pan Mod            --    Amount of panning modulation (strictly speaking, stereo balance modulation). Rate of modulation governed also by 'Rate'
; Sync LFO           --    Restart LFO. Can be useful if 'random spline' modulation becomes 'stuck' at a low frequency

; Level              --    Output level
; Dual Mono / Stereo --    'Dual Mono' = both channels treated in the same way. 'Stereo' = right channel 180 degrees out of phase with respect to the left
;                          Stereo mode most apparent if shifting frequency is close to zero
; zero freq          --    set 'Freq.' to zero

;  Band-reject filters which can attenuate sustained bleedthrough of the oscillators used in the frequency shifting process.
; BPF +              --    band-reject filter located at shift frequency
; BPF -              --    band-reject filter located at absolute value of negative shift frequency, respecting reflection through zero.



<Cabbage>
#define RSLIDERSTYLE #colour(27,59,59), colour(27,59,59), textColour("white"), fontColour("white"), trackerColour(255,255,100), valueTextBox(1)#

form caption("Frequency Shifter") size(750,233), pluginId("fshi"), colour("DarkSlateGrey"), guiMode("queue")

image    bounds(  0,  0,310,110), colour("darkslategrey"), outlineColour("silver"), outlineThickness(3)
{
label    bounds( 10,  7, 80, 11), text("INPUT"), fontColour("white")
combobox bounds( 10, 18, 80, 20), channel("input"), value(1), text("Live (St)","Live (M)","Sine 300Hz","Saw 300Hz","Saw 75Hz","Noise")
checkbox bounds( 10, 45, 80, 12), channel("BPFOnOff"), fontColour:0("white"), fontColour:1("white") colour("yellow") value(0), text("Bandpass")
rslider  bounds( 80, 10, 90, 90), text("Freq."), channel("BPFFreq"),    range(20, 8000, 300, 0.5, 0.1), alpha(0.5), active(0), $RSLIDERSTYLE
rslider  bounds(150, 10, 90, 90), text("Bandwidth"), channel("BPFBW"),    range(0.01, 4, 0.1, 0.5, 0.01), alpha(0.5), active(0), $RSLIDERSTYLE
rslider  bounds(220, 10, 90, 90), text("Slope"), channel("BPFSlope"),    range(0, 5000, 0, 1, 1), alpha(0.5), active(0), $RSLIDERSTYLE
}

image    bounds(310,  0,440,110), colour("darkslategrey"), outlineColour("silver"), outlineThickness(3)
{
label    bounds(10, 37, 80, 11), text("POLARITY"), fontColour("white")
combobox bounds(10, 48, 80, 20), channel("polarity"), value(1), text("Positive","Negative","Dual")
rslider bounds( 80, 10, 90, 90), text("Mix"),      channel("mix"),    range(0, 1.00, 1),     $RSLIDERSTYLE
rslider bounds(150, 10, 90, 90), text("Freq."),    channel("freq"),   range(-4000, 4000, 0), $RSLIDERSTYLE
rslider bounds(220, 10, 90, 90), text("Mult."),    channel("mult"),   range(-1, 1.00, 0.1),    $RSLIDERSTYLE
rslider bounds(285, 10, 90, 90), text("Port."),    channel("port"),   range(0, 30.00, 0.1),    $RSLIDERSTYLE
rslider bounds(350, 10, 90, 90), text("Feedback"), channel("fback"),  range(0, 0.75, 0),     $RSLIDERSTYLE
}

image    bounds(  0,110, 520,110), colour("darkslategrey"), outlineColour("silver"), outlineThickness(3)
{
checkbox bounds( 10, 10,150, 20), channel("ModOnOff") text("LFO Modulate Freq."), fontColour:0("white"), fontColour:1("white"), colour(lime) value(0)
label    bounds( 23, 37, 45, 11), text("SHAPE"), fontColour("white")
combobox bounds( 10, 48, 85, 20), channel("LFOShape"), value(7), text("Sine","Triangle","Square","Saw Up","Saw Down","Rand.S&H","Rand.Spline")
rslider  bounds(145, 10, 90, 90), text("Rate"),     channel("LFORate"),  range(0, 30,  1.5, 0.5, 0.001), $RSLIDERSTYLE
rslider  bounds(215, 10, 90, 90), text("Min"),      channel("LFOMin"),   range(-2000, 2000, -600),       $RSLIDERSTYLE
rslider  bounds(285, 10, 90, 90), text("Max"),      channel("LFOMax"),   range(-2000, 2000,  600),       $RSLIDERSTYLE
rslider  bounds(355, 10, 90, 90), text("Pan Mod."), channel("PanSpread"),range(0, 1.00, 1),              $RSLIDERSTYLE
button   bounds(445, 10, 65, 20), colour("Green"), text("Sync LFO", "Sync LFO"), channel("SyncLFO"), value(0), latched(0)
}

image    bounds(520,110,230,110), colour("darkslategrey"), outlineColour("silver"), outlineThickness(3)
{
rslider  bounds(110, 10, 90, 90), text("Level"),    channel("level"),  range(0, 1.00, 1),       $RSLIDERSTYLE

checkbox bounds( 30, 40, 12, 12), channel("r1") fontColour("white") colour("yellow") value(1), radioGroup(1)
checkbox bounds( 30, 52, 12, 12), channel("r2") fontColour("white") colour("yellow"), radioGroup(1)
label    bounds( 43, 41, 55,  9), text("DUAL MONO"), fontColour("white")
label    bounds( 42, 53, 40,  9), text("STEREO"), fontColour("white")

checkbox bounds( 30, 70, 12, 12), channel("BRF1") fontColour("white") colour("yellow") value(0)
checkbox bounds( 30, 82, 12, 12), channel("BRF2") fontColour("white") colour("yellow") value(0)
label    bounds( 47, 71, 55,  9), text("BRF +"), fontColour("white"), align("left")
label    bounds( 47, 83, 40,  9), text("BRF -"), fontColour("white"), align("left")
}

label    bounds(  5,221,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")

</Cabbage>
<CsoundSynthesizer>

<CsOptions>
-d -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr is set by host
ksmps   =  32
nchnls  =  2
0dbfs   =  1

; Iain McCurdy, 2012, 2025
; http://iainmccurdy.org/csound.html
; Frequency shifter effect based around the hilbert filter.

gisine             ftgen               0, 0, 4096, 10, 1            ; A SINE WAVE SHAPE
gicos              ftgen               0, 0, 4096, 11, 1            ; A COSINE WAVE SHAPE
gishapes           ftgen               0, 0, 8, -2, 0, 1, 2, 4, 5

opcode    FreqShifter,a,akkki
    adry,kmix,kfshift,kfback,ifn    xin       ; READ IN INPUT ARGUMENTS
    aFS            init                0                        ; INITIALISE FEEDBACK SIGNAL (FOR FIRST K-PASS)
    ain            =                   adry + (aFS * kfback)    ; ADD FEEDBACK SIGNAL TO INPUT (AMOUNT OF FEEDBACK CONTROLLED BY 'Feedback Gain' SLIDER)
    
    areal, aimag hilbert ain                  ; HILBERT OPCODE OUTPUTS TWO PHASE SHIFTED SIGNALS, EACH 90 OUT OF PHASE WITH EACH OTHER
    ; QUADRATURE OSCILLATORS. I.E. 90 OUT OF PHASE WITH RESPECT TO EACH OTHER
    asin           oscili              1,         kfshift,     ifn,           0
    acos           oscili              1,         kfshift,     ifn,           0.25    
    ; RING MODULATE EACH SIGNAL USING THE QUADRATURE OSCILLATORS AS MODULATORS
    amod1          =                   areal * acos
    amod2          =                   aimag * asin    
    ; UPSHIFTING OUTPUT
    aFS            =                   (amod1 - amod2)
                   xout                aFS                     ; SEND AUDIO BACK TO CALLER INSTRUMENT
endop


instr    1
kporttime          linseg              0, 0.001, 1

; read input widgets
kmix               cabbageGetValue     "mix"            
kfreq              cabbageGetValue     "freq"
kmult              cabbageGetValue     "mult"
kport              cabbageGetValue     "port"
kfshift            portk               kfreq*kmult, kporttime * kport
kfback             cabbageGetValue     "fback"
klevel             cabbageGetValue     "level"
kpolarity          cabbageGetValue     "polarity"
kr1                cabbageGetValue     "r1"
kr2                cabbageGetValue     "r2"
kStereoMode        =                   kr1 + kr2 * 2 ; 1 or 2 depending on stereo-mode radio button pressed
kModOnOff          cabbageGetValue     "ModOnOff"    
kLFOShape          cabbageGetValue     "LFOShape"            
kLFORate           cabbageGetValue     "LFORate"             
kLFOMin            cabbageGetValue     "LFOMin"              
kLFOMax            cabbageGetValue     "LFOMax"              
kPanSpread         cabbageGetValue     "PanSpread"        
kSyncLFO           cabbageGetValue     "SyncLFO"

/* INPUT */
kinput             cabbageGetValue     "input"
if kinput == 1 then ; stereo
 aDry1,aDry2       ins
elseif kinput == 2 then ; mono
 aDry1             inch                1
 aDry2             =                   aDry1
elseif kinput == 3 then
 aDry1             oscils              0.2, 300, 0
 aDry2             =                   aDry1
elseif kinput == 4 then
 aDry1             vco2                0.2, 300
 aDry2             =                   aDry1
elseif kinput == 5 then
 aDry1             vco2                0.2, 75
 aDry2             =                   aDry1
else
 aDry1             pinkish             0.2
 aDry2             pinkish             0.2
endif

; Bandpass filter
kBPFOnOff,kT       cabbageGetValue     "BPFOnOff"

                   cabbageSet          kT, "BPFFreq", "alpha", kBPFOnOff == 1 ? 1 : 0.5
                   cabbageSet          kT, "BPFBW", "alpha", kBPFOnOff == 1 ? 1 : 0.5
                   cabbageSet          kT, "BPFSlope", "alpha", kBPFOnOff == 1 ? 1 : 0.5
                   cabbageSet          kT, "BPFFreq", "active", kBPFOnOff == 1 ? 1 : 0
                   cabbageSet          kT, "BPFBW", "active", kBPFOnOff == 1 ? 1 : 0
                   cabbageSet          kT, "BPFSlope", "active", kBPFOnOff == 1 ? 1 : 0

if kBPFOnOff==1 then
kBPFFreq           cabbageGetValue     "BPFFreq"
kBPFBW             cabbageGetValue     "BPFBW"
kBPFSlope          cabbageGetValue     "BPFSlope"
kCF1L              limit               kBPFFreq-(kBPFFreq*kBPFBW*0.5)-kBPFSlope, 20, sr/3
kCF1R              limit               kBPFFreq-(kBPFFreq*kBPFBW*0.5), 20, sr/3
kCF2L              limit               kBPFFreq+(kBPFFreq*kBPFBW*0.5), 20, sr/3
kCF2R              limit               kBPFFreq+(kBPFFreq*kBPFBW*0.5)+kBPFSlope, 20, sr/3

    f1_1           pvsanal             aDry1, 1024, 256, 1024, 0
    f1_2           pvsbandp            f1_1, kCF1L, kCF1R, kCF2L, kCF2R
    a1             pvsynth             f1_2

    f2_1           pvsanal             aDry2, 1024, 256, 1024, 0
    f2_2           pvsbandp            f2_1, kCF1L, kCF1R, kCF2L, kCF2R
    a2             pvsynth             f2_2
else 
a1                 =                   aDry1
a2                 =                   aDry2
endif

/* LFO */
if kModOnOff=1 then
 ktrig             changed             kLFOShape, kSyncLFO
 if ktrig==1 then
                   reinit              RESTART_LFO
 endif
 RESTART_LFO:
 if i(kLFOShape)==6 then
  kLFOFreq         randomh             kLFOMin, kLFOMax, kLFORate
 elseif i(kLFOShape)==7 then                                                    ; random spline
  kLFOFreq         rspline             kLFOMin, kLFOMax, kLFORate, kLFORate * 2
 else
  ishape           table               i(kLFOShape) - 1, gishapes
  kLFOFreq         lfo                 1, kLFORate, ishape
  kLFOFreq         scale               (kLFOFreq * 0.5) + 0.5, kLFOMin, kLFOMax
 endif
 rireturn
endif

kfshift            =                   kfshift + kLFOFreq

/* FREQUENCY SHIFTERS */
ktrig              changed             kStereoMode
if ktrig==1 then
 reinit RESTART_FREQUENCY_SHIFTERS
endif
RESTART_FREQUENCY_SHIFTERS:


if kpolarity==1 then                                                        ; polarity is positive...
 aOut1             FreqShifter         a1, kmix, kfshift, kfback, gisine    
 if i(kStereoMode)==2 then                                                  ; 180 degree offset for stereo
  aOut2            FreqShifter         a2, kmix, kfshift, kfback, gicos     ; cosine version
 else                                                                       ; dual mono
  aOut2            FreqShifter         a2, kmix, kfshift, kfback, gisine    
 endif 

elseif kpolarity==2 then                                                    ; polarity is negative...
 aOut1             FreqShifter         a1, kmix, -kfshift, kfback, gisine    
 if i(kStereoMode)==2 then
  aOut2            FreqShifter         a2, kmix, -kfshift, kfback, gicos    ; cosine version
 else
  aOut2            FreqShifter         a2, kmix, -kfshift, kfback, gisine    
 endif

else                                                                        ; polarity is dual...
 aa                FreqShifter         a1, kmix, kfshift, kfback, gisine    ; positive
 if i(kStereoMode)==2 then
  ab               FreqShifter         a2, kmix, kfshift, kfback, gicos     ; cosine version
 else
  ab               FreqShifter         a2, kmix, kfshift, kfback, gisine    
 endif 
 ac                FreqShifter         a1, kmix, -kfshift, kfback, gisine   ; negative
 if i(kStereoMode)==2 then
  ad               FreqShifter         a2, kmix, -kfshift, kfback, gicos    ; cosine version
 else
  ad               FreqShifter         a2, kmix, -kfshift, kfback, gisine    
 endif
rireturn
 aOut1             =                   (aa + ac) * 0.5                        ; sum positive and negative and attenuate
 aOut2             =                   (ab + ad) * 0.5
endif

kBW = 0.1
if cabbageGetValue:k("BRF1")==1 then
aOut1              butbr               aOut1, abs(kfshift), abs(kfshift)*kBW
aOut1              butbr               aOut1, abs(kfshift), abs(kfshift)*kBW
aOut2              butbr               aOut2, abs(kfshift), abs(kfshift)*kBW
aOut2              butbr               aOut2, abs(kfshift), abs(kfshift)*kBW
endif

if cabbageGetValue:k("BRF2")==1 then
aOut1              butbr               aOut1, abs(-kfshift), abs(-kfshift)*kBW
aOut1              butbr               aOut1, abs(-kfshift), abs(-kfshift)*kBW
aOut2              butbr               aOut2, abs(-kfshift), abs(-kfshift)*kBW
aOut2              butbr               aOut2, abs(-kfshift), abs(-kfshift)*kBW
endif

; mixer
    kWet           limit               kmix * 2, 0, 1
    kDry           limit               (1-kmix) * 2, 0, 1
    aOut1          sum                 aOut1 * kWet, aDry1 * kDry      ; CREATE WET/DRY MIX
    aOut2          sum                 aOut2 * kWet, aDry2 * kDry      ; CREATE WET/DRY MIX


/* PANNING */
if kModOnOff==1 then
 kpan              randomi             0.5-(kPanSpread*0.5),0.5+(kPanSpread*0.5),kLFORate,1
 kpan              portk               kpan, 1/kLFORate
 aOut1             =                   aOut1 * sin(kpan*$M_PI_2)
 aOut2             =                   aOut2 * cos(kpan*$M_PI_2)
endif

aOut1              =                   aOut1 * klevel                    ; scale using level control
aOut2              =                   aOut2 * klevel

                   outs                aOut1, aOut2
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>