
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Harmonics.csd
; Written by Iain McCurdy, 2014

; Emulation of a piano string-hammer mechanism with a damping node placed some way along the string to force harmonic overtones
; Each note played triggers two strings, which can be detuned with respect to each other.
; As well as emulating the hammer striking the string in the first place, a release hammer (or string damping mechanism is emulated)

; AMPLITUDE
; Amp.            -    Global amplitude control
; Vel.            -    key velocity influence upon hammer amplitude

; FUNDAMENTAL (how midi note maps to fundamental frequency of the tone)
; Offset          -    fixed offset applied to all values in the mapping. For normal keyboard mapping set to '0'
; Rnge.           -    range of the mapping. For normal keyboard mapping set to '1'

; HARMONIC
; Offset          -    offset of harmonic position (0 means that no harmonic will be emphasised, but Vel and Kybd. TRack can still influence this)
;  There are actually two methods for creating this offset value, selected using the drop-down menu:
; 1. Multiple - this value is simply multiplied to the fundamental frequency
; 2. Division - this value (in integer steps) divides the fundemental to produce the frequency for the second waveguide. It can be heard that the harmonic are produced cleanly and in sequence.
; Vel             -    key velocity influence upon harmonic position
; Kybd.Track      -    the amount to which keyboard tracking influences harmonic position
; Algorithm Selector: 
;
;  1. "Single"   IMPULSE-->WAVEGUIDE-->OUT
;
;  2. "Series"   IMPULSE-->WAVEGUIDE1-->WAVEGUIDE2-->OUT
;
;  3. "Double"   IMPULSE-->WAVEGUIDE1-+->WAVEGUIDE2---+
;                                     |               +-->OUT
;                                     +---------------+
;
; Double Strength -    adds another waveguide in series thereby increasing the filtering effect and the sustain.
; Series Mix      -    mix the outputs of both the first and the second waveguides in a series of two, 
;                      i.e. more of the attack of the hammer (or impulse sounds) will be retained.
; Envelope        -    A switch which, if selected, will apply an Attack-Release envelope to the harmonic offset value. 
;                      This will add a timbral attack and release to the sound.
;                      For result to be heard most clearly, choose "Series" algorithm and increase "Release" (STRINGS) section.
 
; STRING
; Detune          -    maximum possible detuning between the two strings (in cents) triggered by each note (the actual detuning will be unique and fixed for each note)
; Release         -    envelope release time once a key is released
; Sustain         -    the sustain time of the strings. (Feedback in the double waveguide.)
; Damping         -    high frequency damping. (Cutoff frequencies of two lowpass filters in the waveguide network.)

; IMPULSE 
; Type:
;  1. Hammer      -    A single impulse emulating a hammer striking the string
;  2. Bowed       -    A train of impulses at the note frequency that continues for as long as the note is held
;  3. Noise       -    A noise signal that has the same characteristics for all notes played
;  4. Gliss       -    A pink noise signal is bandpass filtered, the cutoff frequency of the bandpass filter glissandoes slowly.
;  5. Pulse       -    Repeated periodic impulses.
;  6. Live        -    No synthesised impulse but the live audio input is fed into the waveguide when notes are pressed

; If "Hammer" is selected, the following options are revealed.
; (keyboard mapping for the frequency of the hammer that strikes the string)
; Vel.            -    key velocity influence upon hammer frequency (hammer impulse only sustains for one cycle so this effectively controls the duration or period of that cycle)
; Offset          -    Fundemental frequency of the hammer (before keyboard tracking is applied)
; Keybd.Track     -    Amount of keyboard tracking to be applied. Increasing this value causes higher note to use a higher frequency hammer impulse.

; If "Bowed" is selected, the following options are revealed.
; Density         -    Density of noise impulses.
; Random          -    amount of randomness in timing  of the noise impulses.

; If "Noise" is selected, the following options are revealed.
; Attack          -    attack time of the bowing
; Bright          -    brightness of the bowing impulse
; Noise           -    amount of randomness in the bowing impulse 

; If "Gliss" is selected, the following options are revealed.
; Rate            -    Rate of movement of the glissando.
; Bandwidth       -    Bandwidth of the filter applied to the noise source.

; If "Pulse" is selected, the following options are revealed.
; Tempo           -    Tempo of impulses (BPM).
; Var.            -    Amount of sliding variation of Tempo.
; Min.LPF         -    Minimum limit of random lowpass filter.
; Max.LPF         -    Maximum limit of random lowpass filter.
; Clock           -    Defines whether all note use a shared pulse (global) or if each new note uses its own new pulse generator (local).

; RELEASE HAMMER (string vibration stopping mechanism)
; Ampl.           -    Amplitude of the release hammer. Set to zero to remove the release hammer altogether. 
;                      Release hammer amplitude is also affected by the current vibration amplitude of the strings so that the longer a note is allowed to decay the lower the release hammer amplitude will be.
; Offset          -    Fundemental frequency of the release hammer (before keyboard tracking is applied)
; Keybd.Track     -    Amount of keyboard tracking to be applied to the frequency of release hammer. Increasing this value causes higher note to use a higher frequency hammer impulse.

; STEREO (a stereophonic widening effect using a delay of random duration on each channel)
; Width           -    Width of the effect. Effectively the maximum duration of the two random delay times.
; Mix             -    Dry/wet mix between the mono string output and the two delays.

; REVERB (a reverb effect using screverb)
; Mix             -    Dry/wet mix between the dry signal (including stereo signal) and the reverberated signal
; Size            -    Size or decay time of the reverb effect
; Damping         -    Cutoff frequency of the damping of reverberant reflections

<Cabbage>
form caption("Harmonics"), size(970,328), colour(100,150,150), pluginId("Harm"), guiMode("queue")

#define RSliderStyle valueTextBox(1), textBox(1), colour("silver"), trackerColour("silver"), textColour("white"), fontColour("white"), textBoxOutlineColour("silver")

;AMPLITUDE
image    bounds(  5,  5,130,110), colour(100,150,150), outlineColour("white"), outlineThickness(2), shape("sharp"), plant("amplitude"){
label    bounds(  0,  4,130, 12), text("A M P L I T U D E"), fontColour("white")
rslider  bounds(  0, 25, 75, 75), text("Amp."),  channel("Amp"), range(0,1.00,0.3,0.5,0.001), $RSliderStyle
rslider  bounds( 55, 25, 75, 75), text("Vel."),  channel("AmpVel"), range(0,1.00,0.5,1,0.01), $RSliderStyle
}

;FUNDAMENTAL
image    bounds(140,  5,130,110), colour(100,150,150), outlineColour("white"), outlineThickness(2), shape("sharp"), plant("fundemental"){
label    bounds(  0,  4,130, 12), text("F U N D A M E N T A L"), fontColour("white")
rslider  bounds(  0, 25, 75, 75), text("Offset"),  channel("NumOffset"), range(0,127,30,1,0.01), $RSliderStyle
rslider  bounds( 55, 25, 75, 75), text("Rnge."),  channel("NumRange"), range(0,127,15,1,0.1), $RSliderStyle
}

;HARMONIC
image    bounds(275,  5,390,110), colour(100,150,150), outlineColour("white"), outlineThickness(2), shape("sharp"), plant("harmonic"){
label    bounds(  0,  4,390, 12), text("H A R M O N I C"), fontColour("white")
combobox bounds(  5,  5, 70, 17), channel("OffsetType"), text("Multiple","Division"), value(1)
rslider  bounds(  0, 25, 75, 75), text("Offset"),  channel("HarmOffset"), range(-1,1,0,1,0.001), $RSliderStyle
rslider  bounds(  0, 25, 75, 75), text("Fraction"),  channel("HarmOffsetF"), range(-30,30,1,1,1), visible(0), $RSliderStyle
rslider  bounds( 55, 25, 75, 75), text("Vel."),  channel("HarmRange"), range(0,2.00,0.645,0.5,0.01), $RSliderStyle
rslider  bounds(110, 25, 75, 75), text("Kybd.Track"),  channel("HarmKybd"), range(0,1.000,0), $RSliderStyle
label    bounds(180, 40, 70, 13), text("Algorithm"), fontColour("white")
combobox bounds(180, 55, 70, 20), channel("AlgType"), text("Single","Series","Double"), value(1)
checkbox bounds(180, 80, 70, 12), channel("HarmEnv"), text("Envelope"), fontColour:0("white"), fontColour:1("white")

line     bounds(275, 20, 95, 1)
label    bounds(302, 16, 40,10), text("G L I S S"), fontColour("white"), colour(100,150,150)
rslider  bounds(260, 25, 75, 75), text("Depth"),  channel("HarmSlideDep"), range(0,1.000,0), $RSliderStyle
rslider  bounds(315, 25, 75, 75), text("Rate"),  channel("HarmSlideRate"), range(0.01,10.00,0.1,1,0.01), $RSliderStyle
}

;STRINGS
image    bounds(670,  5,295,110), colour(100,150,150), outlineColour("white"), outlineThickness(2), shape("sharp"), plant("main"){
label    bounds(  0,  4,295, 12), text("S T R I N G S"), fontColour("white")
rslider  bounds(  0, 25, 75, 75), text("Detune"),  channel("detune"), range(0,50.000,1.5,0.35,0.001), $RSliderStyle
rslider  bounds( 55, 25, 75, 75), text("Release"),  channel("release"), range(0.01,12.000,0.15,0.5,0.001), $RSliderStyle
rslider  bounds(110, 25, 75, 75), text("Sustain"),  channel("feedback"), range(0,1.000,1,8), $RSliderStyle
rslider  bounds(165, 25, 75, 75), text("Damping"),  channel("cutoff"), range(0.001,1.000,1,0.5), $RSliderStyle
rslider  bounds(220, 25, 75, 75), text("Lo.Cut"),  channel("LoCut"), range(1,8000,1,0.5,1), $RSliderStyle
}
    
;IMPULSE
image    bounds(  5,120,445,110), colour(100,150,150), outlineColour("white"), outlineThickness(2), shape("sharp"), plant("hammer")
{
label    bounds(  0,  4,445, 12), text("I M P U L S E"), fontColour("white")
label    bounds( 15, 28, 70, 13), text("Type"), fontColour("white")
combobox bounds( 15, 43, 70, 20), channel("Impulse"), text("Hammer","Bow","Noise","Gliss","Pulses","Live"), value(1)
}

image    bounds( 85,145,355,100), colour(0,0,0,0), channel("HammerID"), visible(1)
{
rslider  bounds(  0,  0, 75, 75), text("Vel."),  channel("ToneVel"), range(0,1.00,0.75), $RSliderStyle
rslider  bounds( 60,  0, 75, 75), text("Offset"),  channel("HammFrq"), range(1,4000,100,0.5,1), $RSliderStyle
rslider  bounds(120,  0, 75, 75), text("Kybd.Track"),  channel("HammTrk"), range(0,1.00,0.33), $RSliderStyle
}

image    bounds( 85,145,355,100), colour(0,0,0,0), channel("BowID"), visible(0)
{
rslider  bounds(  0,  0, 75, 75), text("Attack"),  channel("Attack"), range(0,5.00,0.2,0.5), $RSliderStyle
rslider  bounds( 60,  0, 75, 75), text("Bright"),  channel("Bright"), range(0,1.00,0.3,0.5), $RSliderStyle
rslider  bounds(120,  0, 75, 75), text("Noise"),  channel("Noise"), range(0,5.00,0.001,0.5), $RSliderStyle
}

image    bounds( 85,145,355,100), colour(0,0,0,0), channel("NoiseID"), visible(0)
{
rslider  bounds(  0,  0, 75, 75), text("Density"),    channel("NseDens"), range(1,5000,100,0.5,1), $RSliderStyle
rslider  bounds( 60,  0, 75, 75), text("Random"), channel("NseRand"), range(0,100,1,0.5), $RSliderStyle
}

image    bounds( 85,145,345,100), colour(0,0,0,0), channel("GlissID"), visible(0)
{
rslider  bounds(  0,  0, 75, 75), text("Rate"), channel("GlsRate"), range(0.01,5,0.1,0.5,0.01), $RSliderStyle
rslider  bounds( 60,  0, 75, 75), text("Bandwidth"), channel("GlsBW"), range(0.001,1,0.01,0.5,0.001), $RSliderStyle
}

image    bounds( 85,145,355,100), colour(0,0,0,0), channel("PulseID"), visible(0)
{
label    bounds(245,  3, 60, 13), text("Clock"), fontColour("white")
combobox bounds(245, 18, 60, 20), channel("PlsClock"), text("Local","Global"), value(2)
label    bounds(245, 40, 60, 13), text("Filter"), fontColour("white")
combobox bounds(245, 55, 60, 20), channel("PlsFilter"), text("Lowp.","Bandp.","Res.","Highp."), value(1)
rslider  bounds(  0,  0, 75, 75), text("Tempo"),  channel("PlsRate"), range(0,960,120,1,1), $RSliderStyle
rslider  bounds( 50,  0, 75, 75), text("Var."),  channel("PlsVar"), range(0,4, 0), $RSliderStyle
rslider  bounds(100,  0, 75, 75), text("Min.LPF"),  channel("PlsMinCO"), range(5,14,6,1,0.1), $RSliderStyle
vslider  bounds(170, 30, 15, 47), channel("PlsFiltRate"), range(0.1,1,0.1),  colour("silver"), trackerColour("silver"), textColour("white"), fontColour("white")
label    bounds(158, 18, 40, 12), text("Rate"), fontColour("white")
rslider  bounds(180,  0, 75, 75), text("Max.LPF"),  channel("PlsMaxCO"), range(5,14,12,1,0.1), $RSliderStyle
checkbox bounds(315, 20, 60, 12), text("Rel."),  channel("PlsRel"), colour("yellow"), fontColour("white")
}

;RELEASE DAMPER
image    bounds(455,120,185,110), colour(100,150,150), outlineColour("white"), outlineThickness(2), shape("sharp"), plant("hammer_rel"){
label    bounds(  0,  4,185, 12), text("R E L E A S E    D A M P E R"), fontColour("white")
rslider  bounds(  0, 25, 75, 75), text("Ampl."),  channel("RelHammAmp"), range(0,1.00,0.3), $RSliderStyle
rslider  bounds( 55, 25, 75, 75), text("Offset"),  channel("RelHammFrq"), range(1,4000,100,0.5,1), $RSliderStyle
rslider  bounds(110, 25, 75, 75), text("Kybd.Track"),  channel("RelHammTrk"), range(0,1.00,0.4), $RSliderStyle
}

;STEREO
image    bounds(645,120,130,110), colour(100,150,150), outlineColour("white"), outlineThickness(2), shape("sharp"), plant("stereo"){
label    bounds(  0,  4,130, 12), text("S T E R E O"), fontColour("white")
rslider  bounds(  0, 25, 75, 75), text("Width"),  channel("StWidth"), range(0.0001,0.1,0.01,0.5), $RSliderStyle
rslider  bounds( 55, 25, 75, 75), text("Dry/Wet"),  channel("StMix"), range(0,1,0.5),  textBox(1), $RSliderStyle
}

;REVERB
image    bounds(780,120,185,110), colour(100,150,150), outlineColour("white"), outlineThickness(2), shape("sharp"), plant("reverb"){
label    bounds(  0,  4,185, 12), text("R E V E R B"), fontColour("white")
rslider  bounds(  0, 25, 75, 75), text("Dry/Wet"),  channel("RvbDryWet"), range(0,1.000,0.3), $RSliderStyle
rslider  bounds( 55, 25, 75, 75), text("Size"),  channel("RvbSize"), range(0.4,0.999,0.55), $RSliderStyle
rslider  bounds(110, 25, 75, 75), text("EQ."),  channel("RvbEQ"), range(0,1,0.3), $RSliderStyle
}

keyboard bounds(  5,235,960, 80)

label bounds(5,316,100,11), text("Iain McCurdy |2014|"), fontColour("white"), align("left")
</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =     32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls       =     2    ; NUMBER OF CHANNELS (1=MONO)
0dbfs        =     1    ; MAXIMUM AMPLITUDE

                   massign             0, 2
giImp              ftgen               0, 0, 4097, 9, 0.5, 1, 0              ; shape for the hammer inpulse
gidetuning         ftgen               0, 0, 128, 21, 1, 1                   ; random array used for fixing unique detune values for each note
giDryMap           ftgen               0, 0, 4096, 7, 1, 2048, 1, 2048, 0    ; dry mixer control mapping
giWetMap           ftgen               0, 0, 4096, 7, 0, 2048, 1, 2048, 1    ; wet mixer control mapping
gaSendL,gaSendR    init                0                                     ; initialise variable used for sending audio between instruments
giAmpMap           ftgen               0, 0, -1400, -16, 200, 500, 0, 150, 500, -8, 0.8, 400, 0.8

opcode    Oscil1a,a,iii                    ; an oscillator that plays a single cycle of an audio waveform at a-rate
 iamp,ifrq,ifn     xin
 aptr              line                0, 1/ifrq, 1
 asig              tablei              aptr, ifn, 1
 aenv              linseg              1, 1/ifrq, 1, 0.001, 0
                   xout                asig * iamp * aenv
endop

instr    1 ; read in widgets
 kPortTime         linseg              0, 0.01, 0.1
 gkdetune          cabbageGetValue     "detune"
 gkdetune          portk               gkdetune, kPortTime
 gkrelease         cabbageGetValue     "release"
 gkHarmRange       cabbageGetValue     "HarmRange"
 gkHarmOffset      cabbageGetValue     "HarmOffset"
 gkHarmOffsetF      cabbageGetValue    "HarmOffsetF"
 gkOffsetType      cabbageGetValue     "OffsetType" 
 ; show/hide modes for defining offset of second waveguide
                   cabbageSet          changed:k(gkOffsetType), "HarmOffset", "visible", 1 - (gkOffsetType-1)
                   cabbageSet          changed:k(gkOffsetType), "HarmOffsetF", "visible", (gkOffsetType-1)

 gkHarmKybd        cabbageGetValue     "HarmKybd"
 gkNumRange        cabbageGetValue     "NumRange"
 gkNumOffset       cabbageGetValue     "NumOffset"
 gkNumRange        portk               gkNumRange, kPortTime
 gkNumOffset       portk               gkNumOffset, kPortTime
 gkHammFrq         cabbageGetValue     "HammFrq"
 gkHammTrk         cabbageGetValue     "HammTrk"
 gkRelHammAmp      cabbageGetValue     "RelHammAmp"
 gkRelHammFrq      cabbageGetValue     "RelHammFrq"
 gkRelHammTrk      cabbageGetValue     "RelHammTrk"
 gkAmpVel          cabbageGetValue     "AmpVel"
 gkAmp             cabbageGetValue     "Amp"
 gkAmp             portk               gkAmp, kPortTime
 gkToneVel         cabbageGetValue     "ToneVel"
 gkDryWet          cabbageGetValue     "RvbDryWet"
 gkDry             table               gkDryWet, giDryMap, 1        ; map dry/wet control
 gkWet             table               gkDryWet, giWetMap, 1        ;
 gkRvbSize         cabbageGetValue     "RvbSize"
 gkRvbEQ           cabbageGetValue     "RvbEQ"
 gkStWidth         cabbageGetValue     "StWidth"
 gkStWidth         init                0.01                         ; (can't be zero at i-time)
 gkStMix           cabbageGetValue     "StMix"
 gkfeedback        cabbageGetValue     "feedback"
 gkcutoff          cabbageGetValue     "cutoff"
 gkLoCut           cabbageGetValue     "LoCut"
 gkLoCut           portk               gkLoCut, kPortTime
 gkAttack          cabbageGetValue     "Attack"
 gkBright          cabbageGetValue     "Bright"
 gkNoise           cabbageGetValue     "Noise"
 gkAlgType         cabbageGetValue     "AlgType"
 gkImpulse         cabbageGetValue     "Impulse"
 gkNseDens         cabbageGetValue     "NseDens"
 gkNseRand         cabbageGetValue     "NseRand"
 gkGlsRate         cabbageGetValue     "GlsRate"
 gkGlsBW           cabbageGetValue     "GlsBW"
 gkHarmEnv         cabbageGetValue     "HarmEnv"
 gkPlsRate         cabbageGetValue     "PlsRate"
 gkPlsVar          cabbageGetValue     "PlsVar"
 gkPlsMinCO        cabbageGetValue     "PlsMinCO"
 gkPlsMaxCO        cabbageGetValue     "PlsMaxCO"
 gkPlsFiltRate     cabbageGetValue     "PlsFiltRate"
 gkPlsClock        cabbageGetValue     "PlsClock"
 gkPlsFilter       cabbageGetValue     "PlsFilter"
 gkPlsRel          cabbageGetValue     "PlsRel"
 gkHarmSlideDep    cabbageGetValue     "HarmSlideDep"
 gkHarmSlideRate   cabbageGetValue     "HarmSlideRate"
 
 if changed(gkImpulse)==1 then
  if gkImpulse==6 then ; live
                   cabbageSet          1,"HammerID","visible", 0
                   cabbageSet          1,"BowID",   "visible", 0
                   cabbageSet          1,"NoiseID", "visible", 0
                   cabbageSet          1,"GlissID", "visible", 0
                   cabbageSet          1,"PulseID", "visible", 0
  elseif gkImpulse==5 then ; pulse
                   cabbageSet          1,"HammerID","visible", 0
                   cabbageSet          1,"BowID",   "visible", 0
                   cabbageSet          1,"NoiseID", "visible", 0
                   cabbageSet          1,"GlissID", "visible", 0
                   cabbageSet          1,"PulseID", "visible", 1
  elseif gkImpulse==4 then ; gliss
                   cabbageSet          1,"HammerID","visible", 0
                   cabbageSet          1,"BowID",   "visible", 0
                   cabbageSet          1,"NoiseID", "visible", 0
                   cabbageSet          1,"GlissID", "visible", 1
                   cabbageSet          1,"PulseID", "visible", 0
  elseif gkImpulse==3 then ; noise
                   cabbageSet          1,"HammerID","visible", 0
                   cabbageSet          1,"BowID",   "visible", 0
                   cabbageSet          1,"NoiseID", "visible", 1
                   cabbageSet          1,"GlissID", "visible", 0
                   cabbageSet          1,"PulseID", "visible", 0
  elseif gkImpulse==2 then ; bow
                   cabbageSet          1,"HammerID","visible", 0
                   cabbageSet          1,"BowID",   "visible", 1
                   cabbageSet          1,"NoiseID", "visible", 0
                   cabbageSet          1,"GlissID", "visible", 0
                   cabbageSet          1,"PulseID", "visible", 0
  else ; hammer
                   cabbageSet          1,"HammerID","visible", 1
                   cabbageSet          1,"BowID",   "visible", 0
                   cabbageSet          1,"NoiseID", "visible", 0
                   cabbageSet          1,"GlissID", "visible", 0
                   cabbageSet          1,"PulseID", "visible", 0
  endif
 endif
endin

instr    2 ; string instrument. Trigger by MIDI notes.
 ;==Fundemental==
 inum              notnum
 kcps              =                   cpsmidinn(((inum/127) * gkNumRange) + gkNumOffset)    ; derive fundemental frequency
 
 ;==Impulse==
 ;;(click impulse)
 ;aImpls           mpulse              1,0

 ;;(noise impulse)
 ;aNoise           pinkish             1
 ;iatt             =                   0.001
 ;isus             =                   0.05
 ;idec             =                   0.01
 ;isuslev          veloc               0.5,1
 ;aEnv             linseg              0,iatt,isuslev,isus,isuslev,idec,0
 ;aImpls           =                   aNoise * aEnv
 ;aImpls           butlp               aImpls,1000
 
 ;(hammer impulse)
 krel              release
 krel              init                0
 krms              init                0
 ktrig             trigger             krel, 0.5, 0
 if ktrig==1 then
                   reinit              RELEASE_HAMMER
 endif

 RELEASE_HAMMER:
 if i(krel)==1 then ; Insert release hammer values
  iAmpVel          =                  i(gkRelHammAmp) * (( i(krms) * 3) + 0.03)
  ifrq             =                  i(gkRelHammFrq) * semitone(i(gkRelHammTrk) * inum)
 else
  ifrq             =                  i(gkHammFrq) * semitone(i(gkHammTrk) * inum)
  iAmpVel          veloc              1 - i(gkAmpVel), 1
 endif

 ;==Detuning==
 idetune           table              inum, gidetuning        ;=    i(gkdetune)
 kdetune           =                  idetune * gkdetune
 
 ;==Main Impulse==
 if i(gkImpulse)==1 then                                        ; Hammer
  aImpls           Oscil1a            iAmpVel,ifrq,giImp

 elseif i(gkImpulse)==2 then                                    ; Bow
  aImpls1          gausstrig          iAmpVel, kcps * cent(kdetune), gkNoise
  aImpls2          gausstrig          iAmpVel, kcps * cent(-kdetune), gkNoise
  aImpls           =                  aImpls1 + aImpls2
  ;aImpls          buthp              aImpls, kcps*2
  ;aImpls          buthp              aImpls, kcps*2
  aCF              expsegr            50, i(gkAttack), (sr/10), 0.3, 50
  aImpls           butlp              aImpls, aCF * gkBright

 elseif i(gkImpulse)==3 then                                    ; Noise
  aImpls           gausstrig          iAmpVel, gkNseDens, gkNseRand

 elseif i(gkImpulse)==4 then                                    ; Gliss
  aNse             pinkish            iAmpVel
  aOct             rspline            octmidi(), 12, gkGlsRate, gkGlsRate * 2
  aImpls           reson              aNse, cpsoct(aOct), cpsoct(aOct) * gkGlsBW, 1

 elseif i(gkImpulse)==5 then                                      ; Repeated pulses
  if active:i(p1,0,1)<=1 || gkPlsClock==1 then                    ; if this is the first note or if local clock is selected
   kPlsRate        rspline            gkPlsRate * octave(gkPlsVar) / 60, gkPlsRate * octave(-gkPlsVar) / 60, kPlsRate * 0.1, kPlsRate * 0.2 

   if metro:k(kPlsRate)==1 then
                   reinit             NewPulse
   endif

   krelease        release

   NewPulse:
   aImpls          Oscil1a             iAmpVel * (1 - i(krelease)), ifrq, giImp
   rireturn
   
   kCO             rspline             gkPlsMinCO, gkPlsMaxCO, kPlsRate * gkPlsFiltRate, kPlsRate * gkPlsFiltRate
   kCO             limit               kCO,4,14
   ;;kAmp          tablei              kCO*100,giAmpMap
   ;;aImpls        mpulse              kAmp*(1-release:k()), 1/kPlsRate
   if gkPlsFilter==1 then                                            ; lowpass
    aImpls         butlp               aImpls, a(cpsoct(kCO))
   elseif gkPlsFilter==2 then                                        ; bandpass
    aImpls         reson               aImpls, a(cpsoct(kCO)), a(cpsoct(kCO))*0.1, 1
   elseif gkPlsFilter==3 then                                        ; resonant lowpass
    aImpls         moogladder          aImpls, a(cpsoct(kCO)),0.6
   else                                                              ; highpass
    aImpls         buthp               aImpls, a(cpsoct(kCO))
   endif
   gaImpls         =                   aImpls
  else                                                                                    ; not the first note (use the global pulse)
   aImpls          vdelay              gaImpls, randomi:a(0.001, 0.02, 1, 1) * 1000, 100  ; add some local flam
  endif

 else ; live (gkImpulse = 6)
   aL,aR           ins
   aImpls          =                   aL
   aImplsR         =                   aR
 endif 
 
 rireturn
 icf               veloc               12 - (8 * i(gkToneVel)), 12
 aImpls            butlp               aImpls, cpsoct(icf)

 ; harmonic
 kHarmOffset       =                   gkOffsetType == 1 ? gkHarmOffset : (divz:k(1,gkHarmOffsetF,0))
 kPortTime         linseg              0, 0.001, 0.03
 kHarmOffset       portk               kHarmOffset, kPortTime * 10
 iHarmVel          veloc               i(gkHarmRange), 0
 iHarmKybd         =                   (i(gkHarmKybd) * (128-inum)) / 128
 iHarmRatio        =                   1 + i(kHarmOffset) + iHarmVel + iHarmKybd
 kHarmRatio        =                   1 + kHarmOffset + iHarmVel + iHarmKybd
 kHarmRatio        init                iHarmRatio
 aHarmRatio        =                   a(kHarmRatio)
 
 ; Waveguide Frequencies
 aFund1            interp              kcps * cent(kdetune), 0, 1
 aFund2            interp              kcps * cent(-kdetune), 0, 1
 if gkHarmEnv==1 then
  kHarmEnv         expsegr             0.9, 0.03, 1, 0.9, 0.9
  aHarmRatio       interp              kHarmRatio * kHarmEnv, 0, 1 
 else
  aHarmRatio       interp              kHarmRatio, 0, 1 
 endif
 ;==sliding harmonic modulation
 if gkHarmSlideDep>0 then
  aMod             rspline             -gkHarmSlideDep, gkHarmSlideDep, gkHarmSlideRate, gkHarmSlideRate * 2
  aHarmRatio       =                   aHarmRatio * semitone(aMod)
 endif
 aHarm1            =                   aFund1 * aHarmRatio
 aHarm2            =                   aFund2 * aHarmRatio
 
 ;==Double Waveguide Filter==
 if changed:k(gkAlgType)==1 then    ; to prevent explosive clicks
                   reinit              RestartWaveguides
 endif
 RestartWaveguides:
 kcutoff           =                   (sr / 2) * gkcutoff
 kfeedback         =                   0.249999999 * gkfeedback
 
 ; left channel
 aWg2              wguide2             aImpls,aFund1, aHarm1, kcutoff,kcutoff, kfeedback, kfeedback
 aWg2_2            wguide2             aImpls,aFund2, aHarm2, kcutoff,kcutoff, kfeedback, kfeedback
 if (gkAlgType==2) then
  aWg2             wguide2             aWg2  * 0.13,aFund1, aHarm1 , kcutoff,kcutoff, kfeedback, kfeedback
  aWg2_2           wguide2             aWg2_2* 0.13,aFund2, aHarm2, kcutoff,kcutoff, kfeedback, kfeedback
 elseif (gkAlgType==3) then
  aWg2b            wguide2             aWg2  * 0.13,aFund1, aHarm1, kcutoff,kcutoff, kfeedback, kfeedback
  aWg2_2b          wguide2             aWg2_2* 0.13,aFund2, aHarm2, kcutoff,kcutoff, kfeedback, kfeedback
  aWg2             +=                  aWg2b
  aWg2_2           +=                  aWg2_2b
 endif
 
 ; right channel
 if gkImpulse == 6 then
  aWg2R            wguide2             aImplsR, aFund1, aHarm1, kcutoff,kcutoff, kfeedback, kfeedback
  aWg2_2R          wguide2             aImplsR, aFund2, aHarm2, kcutoff,kcutoff, kfeedback, kfeedback
  if (gkAlgType==2) then
   aWg2R           wguide2             aWg2R   * 0.13, aFund1, aHarm1 , kcutoff,kcutoff, kfeedback, kfeedback
   aWg2_2R         wguide2             aWg2_2R * 0.13, aFund2, aHarm2, kcutoff,kcutoff, kfeedback, kfeedback
  elseif (gkAlgType==3) then
   aWg2bR          wguide2             aWg2R   * 0.13, aFund1, aHarm1, kcutoff,kcutoff, kfeedback, kfeedback
   aWg2_2bR        wguide2             aWg2_2R * 0.13, aFund2, aHarm2, kcutoff,kcutoff, kfeedback, kfeedback
   aWg2R           +=                  aWg2bR
   aWg2_2R         +=                  aWg2_2bR
  endif
 else ; (mono impulse)
  aWg2R            =                   aWg2
  aWg2_2R          =                   aWg2_2
 endif
 
 aWg2              dcblock2            aWg2 + aWg2_2
 aWg2R             dcblock2            aWg2R + aWg2_2R
 if gkLoCut>1 then
  aWg2R            buthp               aWg2R, gkLoCut
 endif
 
 icps              cpsmidi
 aWg2              butbr               aWg2, icps, icps*0.1
 aWg2R             butbr               aWg2R, icps, icps*0.1
 krms              rms                 aWg2
 
 ;==Release==
 irel              =                   i(gkrelease)
 kCF               expsegr             sr / 3, irel, 20
 aEnv              expsegr             1, irel, 0.001
 aWg2              tone                aWg2, kCF
 aWg2R             tone                aWg2R, kCF
 aWg2              =                   aWg2 * aEnv
aWg2R              =                   aWg2R * aEnv

 gaSendL           +=                  aWg2
 gaSendR           +=                  aWg2R
endin





instr    98    ; spatialising short delays and reverb
 
 ; stereo delay
 ktrig             changed             gkStWidth
 if ktrig==1 then
                   reinit              UPDATE
 endif
 UPDATE:
 iDelTimL          random              0.00001,i(gkStWidth)
 aDelSigL          delay               gaSendL, iDelTimL
 iDelTimR          random              0.00001,i(gkStWidth)
 aDelSigR          delay               gaSendR, iDelTimR
 rireturn
 kDry              table               gkStMix, giDryMap, 1
 kWet              table               gkStMix, giWetMap, 1
 aL                =                   ((gaSendL * kDry) + (aDelSigL * kWet)) * gkDry
 aR                =                   ((gaSendR * kDry) + (aDelSigR * kWet)) * gkDry
 gaSendL           +=                  gaSendL + aDelSigL
 gaSendR           +=                  gaSendR + aDelSigR
                   outs                aL*gkAmp, aR*gkAmp

 ; reverb
 if gkRvbEQ>=0.5 then
  kRvbHPF          limit               cpsoct(4 + ((gkRvbEQ - 0.5) * 2 * 10)), 20, sr / 2      
  gaSendL          buthp               gaSendL, kRvbHPF
  gaSendR          buthp               gaSendR, kRvbHPF
 endif
 kRvbLPF           limit               cpsoct(4 + (gkRvbEQ * 2 * 10)), 20, sr / 2    
 aRvbL,aRvbR       reverbsc            gaSendL, gaSendR, gkRvbSize, kRvbLPF
 
 
 
 
                   outs                aRvbL * gkWet * gkAmp, aRvbR * gkWet * gkAmp
                   clear               gaSendL, gaSendR

endin





instr    99
endin

</CsInstruments>

<CsScore>
i  1 0 z
i 98 0 z
e
</CsScore>

</CsoundSynthesizer>