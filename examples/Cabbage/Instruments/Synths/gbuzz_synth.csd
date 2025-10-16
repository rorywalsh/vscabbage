
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; gbuzz synth
; Iain McCurdy 2014

; MAIN - control of the harmonics contained within the basic tone
; Level        -  output level control
; Power        -  timbral emphasis
; Lowest       -  lowest harmonic
; Number       -  number of harmonics (above the lowest harmonic)
; Jitter       -  amount of random jitter applied to the 'Power' parameter (see above) 
; Pan          -  pan position
; Waveform     -  waveform used by gbuzz (cosine is normally recommended but interesting special effects can be produced if other waveforms are used) 
; User Matrix  -  this is used when the 'User' waveform is chosen above. The twelve buttons correspond to the inclusion of the first twelve harmonics in the input waveform. 
; Octave       -  octave shift

; POLYPHONY - polyphonic/monophonic switching and portamento settings for monophonic mode
; mono/poly    -  switch bewteen mono-legato playing and normal polyphonic playing
; Mode         -  only relevant when mono/poly is 'mono'. 
;                 Glissandos will either be of a fixed duration when a new note is played, or at at steady speed (semitones per second) 
; Leg. Time    -  only relevant when mono/poly is 'mono'. Duration or speed of glissando, depending on the mode chosen
  
; PITCH BEND - response to MIDI pitch bend changed
; P. Bend      -  a pitch bend control which can be used when no hardware pitch bend control is present
; Bend Rng.    -  pitch bend range in semitones

; MULTIPLIER ENVELOPE - envelope that modulates the spectral emphasis of the sound
; Att.         -  attack time of the envelope in seconds
; Lev.         -  level reached at the conclusion of the attack stage
; Dec.         -  decay time in seconds
; Sus.         -  sustain level
; Rel.         -  release time once the note is released. Tends back to zero.

; LOW CUT - a highpass (low-cut) filter which moves according to the note played
; On/Off       -
; Low Cut      -
; Lo Poles     -

; HIGH CUT - a lowpass (high-cut) filter which moves according to the note played
; On/Off       -
; High Cut     -
; Hi Poles     -

; NOISE - a noise component which can be used to modulate the amplitude
; Depth        -  
; Damp         -  

; REVERB - basic reverb
; Mix          -  
; Size         -  

; AMPLITUDE ENVELOPE
; Att.         -  
; Lev.         -  
; Dec.         -  
; Sus.         -  
; Rel.         -  

; MODULATION - modulation of pitch (vibrato), amplitude (tremolo) and tone (modulates power mutliplier of gbuzz)
; Mod. Depth   -  
; Delay        -  
; Rise         -  
; Rate         -  
; Rate Rnd.    -  
; Vib. Dep.    -  
; Trem. Dep.   -  
; Tone Dep.    -  

<Cabbage>
form caption("gbuzz Synth") size(855,448), pluginId("GBuz"), guiMode("queue")
image             bounds(  0,  0,855,448), colour("DarkSlateGrey"), outlineColour("White"), outlineThickness(1), shape("sharp")    ; main panel colouration    

#define CHECKBOX_STYLE fontColour:0(255,255,255), fontColour:1(255,255,255)
#define RSLIDER_STYLE textColour("white"), colour("SlateGrey"), trackerColour(255,255,150), markerColour("silver"), markerThickness(1), outlineColour(50,50,50), trackerInsideRadius(.8), trackerOutsideRadius(1), valueTextBox(1), fontColour("White")

; MAIN
image    bounds( 10,  6,495,110), colour("DarkSlateGrey"), outlineColour("white"), outlineThickness(2), shape("sharp")
{
label    bounds(  0,  5,495, 12), text(".  M  A  I  N  ."), fontColour("white")
rslider  bounds(  0, 23, 62, 80), text("Level"), channel("level"),  range(0,50, 10,0.5,0.001), $RSLIDER_STYLE
checkbox bounds( 55, 25, 10, 10), shape("ellipse"), value(1), colour:1(255,100,100), channel("clip")
checkbox bounds( 55, 37, 10, 10), shape("ellipse"), value(1), colour:1(100,255,100), channel("signal")

rslider  bounds( 60, 23, 62, 80), text("Power"),  channel("mul"),    range(0, 0.97, 0.1), $RSLIDER_STYLE
rslider  bounds(120, 23, 62, 80), text("Lowest"), channel("lh"),     range(1, 40, 3,1,1), $RSLIDER_STYLE
rslider  bounds(180, 23, 62, 80), text("Number"), channel("nh"),     range(1,200,10,1,1), $RSLIDER_STYLE
rslider  bounds(240, 23, 62, 80), text("Jitter"), channel("jitter"), range(0, 1, 0.4), $RSLIDER_STYLE
rslider  bounds(300, 23, 62, 80), text("Pan"),    channel("pan"),    range(0, 1, 0.5), $RSLIDER_STYLE
label    bounds(368, 19, 55, 11), text("Waveform"), fontColour("white")
combobox bounds(365, 30, 60, 18), channel("waveform"), value(3), text("cosine", "sine", "user")
label    bounds(368, 52, 60, 11), text("User Matrix"), fontColour("white")
checkbox bounds(368, 63, 10, 10), channel("part1"), value(1), $CHECKBOX_STYLE
checkbox bounds(378, 63, 10, 10), channel("part2"), value(0), $CHECKBOX_STYLE
checkbox bounds(388, 63, 10, 10), channel("part3"), value(1), $CHECKBOX_STYLE
checkbox bounds(398, 63, 10, 10), channel("part4"), value(0), $CHECKBOX_STYLE
checkbox bounds(408, 63, 10, 10), channel("part5"), value(0), $CHECKBOX_STYLE
checkbox bounds(418, 63, 10, 10), channel("part6"), value(0), $CHECKBOX_STYLE
checkbox bounds(368, 73, 10, 10), channel("part7"), value(1), $CHECKBOX_STYLE
checkbox bounds(378, 73, 10, 10), channel("part8"), value(0), $CHECKBOX_STYLE
checkbox bounds(388, 73, 10, 10), channel("part9"), value(0), $CHECKBOX_STYLE
checkbox bounds(398, 73, 10, 10), channel("part10"), value(1), $CHECKBOX_STYLE
checkbox bounds(408, 73, 10, 10), channel("part11"), value(1), $CHECKBOX_STYLE
checkbox bounds(418, 73, 10, 10), channel("part12"), value(0), $CHECKBOX_STYLE
rslider  bounds(430, 23, 62, 80), text("Octave"), channel("octave"), range(-8, 8, 0,1,1), $RSLIDER_STYLE
}              

;POLYPHONY
image    bounds(510,  6,170,110), colour("DarkSlateGrey"), outlineColour("white"), outlineThickness(2), shape("sharp")
{
label    bounds(  0,  5,170, 12), text(".  P  O  L  Y  P  H  O  N  Y  ."), fontColour("white")
button   bounds( 10, 24, 70, 25), text("poly", "mono"), channel("monopoly"), value(1) 
rslider  bounds(100, 26, 70, 80), text("Leg. Time"), channel("LegTim"), range(0.01, 15, 0.05, 0.25, 0.00001), $RSLIDER_STYLE
label    bounds( 37, 54, 30, 11), text("Mode"), fontColour("white")
combobox bounds( 10, 65, 90, 18), channel("PortMode"), value(1), text("Fixed", "Proportional")
}

;PITCH BEND
image   bounds(685,  6,160,110), colour("DarkSlateGrey"), outlineColour("white"), outlineThickness(2), shape("sharp")
{
label   bounds(  0,  5,160, 12), text(".  P  I  T  C  H     B  E  N  D  ."), fontColour("white")
rslider  bounds( 15, 23, 60, 80), text("P. Bend"),    channel("PBend"),    range(-1,1, 0), $RSLIDER_STYLE
rslider  bounds( 90, 23, 60, 80), text("Bend Rng."), channel("BendRange"),   range(1, 24, 12, 1,1), $RSLIDER_STYLE
}

;MULTIPLIER ENVELOPE
image    bounds( 10,121,305,110), colour("DarkSlateGrey"), outlineColour("white"), outlineThickness(2), shape("sharp")
{
label    bounds(  0,  5,305, 12), text(".  M  U  L  T  I  P  L  I  E  R      E  N  V  E  L  O  P  E  ."), fontColour("white")
rslider  bounds(  0, 23, 62, 80), text("Att."), channel("MAtt"),range(0, 8.000, 0.01, 0.375,0.0001), $RSLIDER_STYLE
rslider  bounds( 60, 23, 62, 80), text("Lev."),  channel("MLev"),range(0, 1.000, 0.6),                $RSLIDER_STYLE
rslider  bounds(120, 23, 62, 80), text("Dec."),  channel("MDec"),range(0, 8.000, 3,  0.375,0.0001),   $RSLIDER_STYLE
rslider  bounds(180, 23, 62, 80), text("Sus."),  channel("MSus"),range(0, 1.000, 0),                  $RSLIDER_STYLE
rslider  bounds(240, 23, 62, 80), text("Rel."),  channel("MRel"),range(0, 8.000, 0.1,  0.375,0.0001), $RSLIDER_STYLE
}

;LOW CUT                                                                  
image    bounds(320,121,125,110), colour("DarkSlateGrey"), outlineColour("white"), outlineThickness(2), shape("sharp")
{
checkbox bounds( 30,  6, 70, 12), text("Low Cut") channel("LowCutOnOff"), $CHECKBOX_STYLE
rslider  bounds(  0, 23, 62, 80), text("Low Cut"),   channel("LowCut"),   range(0, 30.00, 0,1,0.0011), $RSLIDER_STYLE
rslider  bounds( 60, 23, 62, 80), text("Low Poles"),  channel("LowPoles"), range(2, 30, 2,1,1),         $RSLIDER_STYLE
}

;HIGH CUT
image    bounds(450,121,125,110), colour("DarkSlateGrey"), outlineColour("white"), outlineThickness(2), shape("sharp")
{
checkbox bounds( 28,  6, 70, 12), text("High Cut") channel("HighCutOnOff"), value(1), $CHECKBOX_STYLE
rslider  bounds(  2, 23, 62, 80), text("High Cut"),  channel("HighCut"),   range(1, 100.00, 7,0.25,0.0001), $RSLIDER_STYLE
rslider  bounds( 62, 23, 62, 80), text("High Poles"),  channel("HighPoles"), range(2, 30, 8,1,1),             $RSLIDER_STYLE
}

;NOISE
image   bounds(580,121,125,110), colour("DarkSlateGrey"), outlineColour("white"), outlineThickness(2), shape("sharp")
{
label   bounds(  0,  5,125, 12), text(".  N  O  I  S  E  ."), fontColour("white")
rslider bounds(  2, 23, 62, 80), text("Depth"), channel("NoiseAmp"),  range(0,300.00, 0, 1, 0.0001),     $RSLIDER_STYLE
rslider bounds( 62, 23, 62, 80), text("Damp"),  channel("NoiseDamp"), range(15, 10000, 1000, 0.5, 0.01), $RSLIDER_STYLE
}                 

;REVERB              
image   bounds(710,121,135,110), colour("DarkSlateGrey"), outlineColour("white"), outlineThickness(2), shape("sharp")
{
label   bounds(  0,  5,135, 12), text(".  R  E  V  E  R  B  ."), fontColour("white")
rslider bounds(  5, 23, 60, 80), text("Mix"),  channel("RvbMix"),  range(0, 1, 0.3),   $RSLIDER_STYLE
rslider bounds( 70, 23, 60, 80), text("Size"), channel("RvbSize"), range(0.3, 1, 0.7), $RSLIDER_STYLE
}                       

;AMPLITUDE ENVELOPE
image    bounds( 10,236,305,110), colour("DarkSlateGrey"), outlineColour("white"), outlineThickness(2), shape("sharp")
{
label    bounds(  0,  5,305, 12), text(".  A  M  P  L  I  T  U  D  E        E  N  V  E  L  O  P  E  ."), fontColour("white")
rslider  bounds(  0, 23, 62, 80), text("Att."),  channel("AAtt"),range(0, 8.000, 0, 0.375,0.0001),    $RSLIDER_STYLE
rslider  bounds( 60, 23, 62, 80), text("Lev."),  channel("ALev"),range(0, 1.000, 1),                  $RSLIDER_STYLE
rslider  bounds(120, 23, 62, 80), text("Dec."),  channel("ADec"),range(0, 8.000, 3,  0.375,0.0001),   $RSLIDER_STYLE
rslider  bounds(180, 23, 62, 80), text("Sus."),  channel("ASus"),range(0, 1.000, 0),                  $RSLIDER_STYLE
rslider  bounds(240, 23, 62, 80), text("Rel."),  channel("ARel"),range(0, 8.000, 0.05, 0.375,0.0001), $RSLIDER_STYLE
}

;MODULATION
image   bounds(320,236,525,110), colour("DarkSlateGrey"), outlineColour("white"), outlineThickness(2), shape("sharp")
{
label   bounds(  0,  5,525, 12), text(".  M  O  D  U  L  A  T  I  O  N  ."), fontColour("white")
rslider bounds( 22, 23, 62, 80), text("Mod. Depth"),channel("mod"),    range(0, 1.00, 0.7), $RSLIDER_STYLE
rslider bounds( 82, 23, 62, 80), text("Delay"),     channel("VDel"),   range(0, 4.00, 0),   $RSLIDER_STYLE
rslider bounds(142, 23, 62, 80), text("Rise"),      channel("VRis"),   range(0, 5.00, 1.5), $RSLIDER_STYLE
rslider bounds(202, 23, 62, 80), text("Rate"),      channel("VRate"),  range(0,30.00, 2.7), $RSLIDER_STYLE
rslider bounds(262, 23, 62, 80), text("Rate Rnd."), channel("VRatRnd"),range(0, 2.00, 0.5), $RSLIDER_STYLE
rslider bounds(322, 23, 62, 80), text("Vib.Dep."),  channel("VibDep"), range(0, 1.00, 0.2), $RSLIDER_STYLE
rslider bounds(382, 23, 62, 80), text("Trem.Dep."), channel("TremDep"),range(0, 0.5, 0.3),  $RSLIDER_STYLE
rslider bounds(442, 23, 62, 80), text("Tone Dep."), channel("ToneDep"),range(0, 4.00, 0),   $RSLIDER_STYLE
}

keyboard bounds( 10,352,835, 80)

label    bounds( 10,433,110, 12), text("Iain McCurdy |2014|"), fontColour("silver"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0                                              
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =          16
nchnls       =          2
0dbfs        =          1    ;MAXIMUM AMPLITUDE
             seed       0
             massign    0,2

;Author: Iain McCurdy (2012)

gicos             ftgen            0,0,131072,9,1,1,90        ; FUNCTION TABLE THAT STORES A SINGLE CYCLE OF A COSINE WAVE
gisine            ftgen            0,0,131072,10,1            ; A SINE WAVE. USED BY THE LFOs.
giwave            ftgen            999,0,131073,10,1,0,1      ; USER WAVEFORM

gasendL,gasendR   init             0

;FUNCTION TABLE USED TO RE-MAP THE RELATIONSHIP BETWEEN VELOCITY AND ATTACK TIME 
giattscl          ftgen            0,0,128,-16,2,128,-10,0.005
giNAttScl         ftgen            0,0,128,-16,8,128,-4,0.25

gkactive          init             0    ; Will contain number of active instances of instr 3 when legato mode is chosen. NB. notes in release stage will not be regarded as active. 

opcode FreqShifter, a, aki
    ain,kfshift,ifn    xin              ; READ IN INPUT ARGUMENTS
    areal, aimag hilbert ain            ; HILBERT OPCODE OUTPUTS TWO PHASE SHIFTED SIGNALS, EACH 90 OUT OF PHASE WITH EACH OTHER
    asin          oscili           1,    kfshift,     ifn,          0
    acos          oscili           1,    kfshift,     ifn,          0.25    
    ;RING MODULATE EACH SIGNAL USING THE QUADRATURE OSCILLATORS AS MODULATORS
    amod1         =                areal * acos
    amod2         =                aimag * asin    
    ;UPSHIFTING OUTPUT
    aFS           =                (amod1 - amod2)
                  xout             aFS                ;SEND AUDIO BACK TO CALLER INSTRUMENT
endop

opcode    SsplinePort,k,KkkO                                                  ; DEFINE OPCODE
    knum,kporttime,kcurve,iopt xin                                            ; READ IN INPUT ARGUMENTS
    kout          init             i(knum)                                    ; INITIALISE TO OUTPUT VALUE (PORTAMENTO APPLIED VALUE)
    ktrig         changed          knum                                       ; ...GENERATE A TRIGGER IS A NEW NOTE NUMBER IS GENERATED (FROM INSTR. 1)
     if ktrig=1   then                                                        ; IF A NEW (LEGATO) NOTE HAS BEEN PRESSED 
      reinit      S_CURVE                                                     ; BEGIN A REINITIALISATION PASS FROM LABEL
     endif                                                                    ; END OF CONDITIONAL BRANCH
     S_CURVE:                                                                 ; A LABEL. REINITIALISATION BEGINS FROM HERE.
    if iopt!=0    then                                                        ; IF ABSOLUTE/PROPORTIONAL SWITCH IS ON... (I.E. PROPORTIONAL)
     idiff        =                1+abs(i(knum)-i(kout))                     ; ABSOLUTE DIFFERENCE BETWEEN OLD NOTE AND NEW NOTE IN STEPS (+ 1)
     kporttime    =                kporttime*idiff                            ; SCALE PORTAMENTO TIME ACCORDING TO THE NOTE GAP
    endif                                                                     ; END OF CONDITIONAL BRANCH
    imid          =                i(kout)+((i(knum)-i(kout))/2)              ; SPLINE MID POINT VALUE
    isspline      ftgentmp         0,0,4096,-16,i(kout),4096*0.5,i(kcurve),imid,(4096/2)-1,-i(kcurve),i(knum) ; GENERATE 'S' SPLINE
    kspd          =                i(kporttime)/kporttime                     ; POINTER SPEED AS A RATIO (WITH REFERENCE TO THE ORIGINAL DURATION)
    kptr          init             0                                          ; POINTER INITIAL VALUE    
    kout          tablei           kptr,isspline                              ; READ VALUE FROM TABLE
    kptr          limit            kptr+((ftlen(isspline)/(i(kporttime)*kr))*kspd), 0, ftlen(isspline)-1 ; INCREMENT THE POINTER BY THE REQUIRED NUMBER OF TABLE POINTS IN ONE CONTROL CYCLE AND LIMIT IT BETWEEN FIRST AND LAST TABLE POINT - FINAL VALUE WILL BE HELD IF POINTER ATTEMPTS TO EXCEED TABLE DURATION
    rireturn                                                                  ; RETURN FROM REINITIALISATION PASS
                  xout             kout                                                                                    ;SEND PORTAMENTOED VALUES BACK TO CALLER INSTRUMENT
endop

instr    1    ; read in widgets
    kporttime     linseg           0,0.001,0.05

    gkmul         cabbageGetValue  "mul"
    gklh          cabbageGetValue  "lh"
    gknh          cabbageGetValue  "nh"
    gkjitter      cabbageGetValue  "jitter"
    gkwaveform    cabbageGetValue  "waveform"
    gkoctave      cabbageGetValue  "octave"
    gkpart1       cabbageGetValue  "part1"
    gkpart2       cabbageGetValue  "part2"
    gkpart3       cabbageGetValue  "part3"
    gkpart4       cabbageGetValue  "part4"
    gkpart5       cabbageGetValue  "part5"
    gkpart6       cabbageGetValue  "part6"
    gkpart7       cabbageGetValue  "part7"
    gkpart8       cabbageGetValue  "part8"
    gkpart9       cabbageGetValue  "part9"
    gkpart10      cabbageGetValue  "part10"
    gkpart11      cabbageGetValue  "part11"
    gkpart12      cabbageGetValue  "part12"
    kParts[]      fillarray        gkpart1,gkpart2,gkpart3,gkpart4,gkpart5,gkpart6,gkpart7,gkpart8,gkpart9,gkpart10,gkpart11,gkpart12
    gkHighest     =                lenarray:k(kParts) - 1
    while gkHighest>=0 do
     if kParts[gkHighest] == 1 kgoto END
    gkHighest -= 1
    od
    END:
    ktrig         changed          gkpart1,gkpart2,gkpart3,gkpart4,gkpart5,gkpart6,gkpart7,gkpart8,gkpart9,gkpart10,gkpart11,gkpart12
    if ktrig==1 then
    reinit USER_WAVEFORM
     endif
    USER_WAVEFORM:
     giwave       ftgen            999,0,131073,10,i(gkpart1),i(gkpart2),i(gkpart3),i(gkpart4),i(gkpart5),i(gkpart6),i(gkpart7),i(gkpart8),i(gkpart9),i(gkpart10),i(gkpart11),i(gkpart12)        ;USER WAVEFORM
    rireturn
    
    gkmonopoly    cabbageGetValue  "monopoly"
    gkLegTim      cabbageGetValue  "LegTim"
    gkPortMode    cabbageGetValue  "PortMode"
    
    gkpan         cabbageGetValue  "pan"
    gklevel       cabbageGetValue  "level"
    gkRvbMix      cabbageGetValue  "RvbMix"
    gkRvbSize     cabbageGetValue  "RvbSize"

    gkMAtt        cabbageGetValue  "MAtt"         ; multiplier envelope
    gkMLev        cabbageGetValue  "MLev"
    gkMDec        cabbageGetValue  "MDec"
    gkMSus        cabbageGetValue  "MSus"
    gkMRel        cabbageGetValue  "MRel"

    gkAAtt        cabbageGetValue  "AAtt"        ; amplitude envelope
    gkALev        cabbageGetValue  "ALev"
    gkADec        cabbageGetValue  "ADec"
    gkASus        cabbageGetValue  "ASus"
    gkARel        cabbageGetValue  "ARel"

    gkLowCutOnOff cabbageGetValue  "LowCutOnOff"
    gkLowCut      cabbageGetValue  "LowCut"
    gkLowPoles    cabbageGetValue  "LowPoles"
    gkHighCutOnOff cabbageGetValue  "HighCutOnOff"
    gkHighCut     cabbageGetValue  "HighCut"
    gkHighPoles   cabbageGetValue  "HighPoles"
    
    gkmod         cabbageGetValue  "mod"        ; modulation
    gkVDel        cabbageGetValue  "VDel"
    gkVRis        cabbageGetValue  "VRis"
    gkVRate       cabbageGetValue  "VRate"
    gkVRatRnd     cabbageGetValue  "VRatRnd"
    gkVibDep      cabbageGetValue  "VibDep"
    gkTremDep     cabbageGetValue  "TremDep"
    gkToneDep     cabbageGetValue  "ToneDep"

    gkNoiseAmp    cabbageGetValue  "NoiseAmp"    ; noise
    gkNoiseDamp   cabbageGetValue  "NoiseDamp"
    
    gkPBend       cabbageGetValue  "PBend"                    ; pitch bend
     kMOUSE_DOWN_LEFT cabbageGetValue "MOUSE_DOWN_LEFT"
     kOff         init             0
     if trigger(kMOUSE_DOWN_LEFT,0.5,1)==1 then
                   cabbageSetValue "PBend",kOff
     endif
    gkBendRange    cabbageGetValue "BendRange"
    gkPchBend      portk           (gkPBend)*gkBendRange, kporttime
endin

instr    2    ;triggered via MIDI
    gkNoteTrig    init             1                ; at the beginning of a new note set note trigger flag to '1'
    inum          notnum                            ; read in midi note number
    givel         veloc            0,1              ; read in midi note velocity
    gknum         =                inum             ; update a global krate variable for note pitch
                                                                                             
    ;============================================================================================================================================================
    if i(gkmonopoly)==0 then                ; if we are *not* in legato mode...
     
     ; METHOD 1: calling sub-instruments using event_1, fractional p1s and turnoff2s. (problematic on windows)   
     ;    event_i    "i",p1+1+(inum*0.001),0,-1,inum        ; call sound producing instr
     ;krel    release                        ; release flag (1 when note is released, 0 otherwise)
     ;if krel==1 then                    ; when note is released...
     ; turnoff2    p1+1+(inum*0.001),4,1            ; turn off the called instrument
     ;endif                            ; end of conditional
     
     ; METHOD 2: using subinstr (problematic on windows and mac) 
     ;a1,a2       subinstr         3,inum
     ;            outs             a1,a2

     ; METHOD 3: all instr code within the same instrument (the safest option on windows and mac, if rather inelegant)
     kporttime    linseg           0,0.001,1        ;portamento time function rises quickly from zero to a held value
     kglisstime   =                kporttime*gkLegTim    ;scale portamento time function with value from GUI knob widget
         
     /* MODULATION */
     krate        randomi          gkVRate-gkVRatRnd,gkVRate+gkVRatRnd,1,1
     kModRise     linseg           0,i(gkVDel)+0.0001, 0, i(gkVRis)+0.0001, 1
     kmod         lfo              gkmod*kModRise,krate,0
     
     ;------------------------------------------------------------------------------------------------------------
     ;PITCH JITTER (THIS WILL BE USED TO ADD HUMAN-PLAYER REALISM)
     ;------------------------------------------------------------------------------------------------------------
     ;                             AMP             | MIN_FREQ. | MAX_FREQ
     kPitchJit    jitter           0.05*gkjitter*4,     1,         20
         
     ;------------------------------------------------------------------------------------------------------------
     ;AMPLITUDE JITTER (THIS WILL BE USED TO ADD HUMAN-PLAYER REALISM)
     ;------------------------------------------------------------------------------------------------------------
     ;                             AMP            | MIN_FREQ. | MAX_FREQ
     kAmpJit      jitter           0.1*gkjitter*4,     0.2,        1
     kAmpJit      =                kAmpJit+1                 ; OFFSET SO IT MODULATES ABOUT '1' INSTEAD OF ABOUT ZERO
     
     knum         =                inum+kPitchJit            ; DERIVE K-RATE NOTE NUMBER VALUE INCORPORATING PITCH BEND, VIBRATO, AND PITCH JITTER    
     knum         limit            knum, 0, 127
     
     /* OSCILLATOR */
     kmul         portk            gkmul, kporttime*0.1
     ;kMulEnv     linsegr          0, i(gkMAtt)+0.0001, i(gkMLev), i(gkMDec)+0.0001, i(gkMSus), i(gkMRel)+0.0001, 0
     kMulEnv      expsegr          0.001, i(gkMAtt)+0.0001, i(gkMLev)+0.001, i(gkMDec)+0.0001, i(gkMSus)+0.001, i(gkMRel)+0.0001, 0.001
     kMulEnv      =                kMulEnv + 0.001        ; offset
     kmul         =                kmul+kMulEnv+(kmod*gkToneDep)
     kmul         limit            kmul,0,0.9
     knum         =                knum + gkPchBend + (kmod*gkVibDep)
     ifn          =                ( i(gkwaveform) < 3 ? (gicos+i(gkwaveform)-1) : giwave)
     knum         limit            knum+(gkoctave*12),0,127
     asig         gbuzz            (kAmpJit*0.1)*(1+(kmod*gkTremDep*0.9)), cpsmidinn(knum), gknh, gklh, kmul, ifn ;gicos+i(gkwaveform)-1
                                                                                                                    
     /* NOISE */
     kNoiseAmp    expcurve         kmul,40
     kNoiseAmp    scale            kNoiseAmp,2,0.1
     anoise       gauss            kNoiseAmp*gkNoiseAmp
     anoise       butlp            anoise,gkNoiseDamp
     asig         =                asig * (1+anoise)

     /* LOW CUT / HIGH CUT FILTERS */
     ;FILTER
     if gkLowCutOnOff=1 then
      kLowCut     portk            gkLowCut,kporttime*0.1
      kLowCut     limit            cpsmidinn(knum)*kLowCut,20,sr/2
      ktrig       changed          gkLowPoles
      if ktrig=1 then
                  reinit           RESTART_LOWCUT
      endif
      RESTART_LOWCUT:                                    
      asig        clfilt           asig,kLowCut,1,i(gkLowPoles)
                  rireturn
     endif
     if gkHighCutOnOff==1 then
      kHighCut    portk            gkHighCut,kporttime*0.1
      kHighCut    limit            cpsmidinn(knum)*kHighCut,20,sr/2
      ktrig       changed          gkHighPoles                                         
      if ktrig=1 then              
                  reinit           RESTART_HIGHCUT
      endif
      RESTART_HIGHCUT:
      asig        clfilt           asig,kHighCut,0,i(gkHighPoles)
                  rireturn
     endif

     aenv         linsegr          0,i(gkAAtt)+0.0001,i(gkALev),i(gkADec),i(gkASus),i(gkARel),0  ; AMPLITUDE ENVELOPE
     asig         =                asig * aenv
     klevel       portk            gklevel,kporttime*0.1
     kpan         portk            gkpan,kporttime*0.1
     kRvbMix      portk            gkRvbMix,kporttime*0.1
     aL,aR        pan2             asig*klevel,kpan                     ; scale amplitude level and create stereo panned signal
                  outs             aL*(1-gkRvbSize), aR*(1-gkRvbSize)   ; SEND AUDIO TO THE OUTPUTS
     gasendL      =                gasendL+aL*kRvbMix
     gasendR      =                gasendR+aR*kRvbMix
    ;============================================================================================================================================================

    else                                          ; otherwise... (i.e. legato mode)
     ;iactive    active p1+1                      ; check to see if there is already a note active...
     iactive      =                i(gkactive)    ; number of active notes of instr 3 (note in release are disregarded)
     if iactive==0 then                           ; ...if no notes are active
                  event_i          "i",p1+1,0,-1  ; ...start a new held note
     endif
    endif
endin

instr    3    ; gbuzz instrument. MIDI notes are directed here.
    kporttime     linseg           0,0.001,1             ; portamento time function rises quickly from zero to a held value
    kglisstime    =                kporttime*gkLegTim    ; scale portamento time function with value from GUI knob widget

    /* MODULATION */
    krate         randomi          gkVRate-gkVRatRnd,gkVRate+gkVRatRnd,1,1
    if gkNoteTrig==1 then
                  reinit           RESTART_MOD_ENV
    endif
    RESTART_MOD_ENV:
    kModRise      linseg           0,i(gkVDel)+0.0001, 0, i(gkVRis)+0.0001, 1
    kmod          lfo              gkmod*kModRise,krate,0
                  rireturn
    gkNoteTrig    =                0         ; reset new-note trigger (in case it was '1')
    
    if i(gkmonopoly)==1 then                 ; if we are in legato mode...
     krel         release                    ; sense when  note has been released
     gkactive     =                1-krel    ; if note is in release, gkactive=0, otherwise =1
     knum         SsplinePort      gknum,kglisstime,1,i(gkPortMode)-1
     kactive      active           p1-1                               ; ...check number of active midi notes (previous instrument)
     if kactive==0 then                                               ; if no midi notes are active...
      turnoff                                                         ; ... turn this instrument off
     endif
    else                                ;otherwise... (polyphonic / non-legato mode)
     knum         =                p4                                 ; pitch equal to the original note pitch
    endif
    ivel          init             givel
        
    ;------------------------------------------------------------------------------------------------------------
    ;PITCH JITTER (THIS WILL BE USED TO ADD HUMAN-PLAYER-LIKE INSTABILITY)
    ;------------------------------------------------------------------------------------------------------------
    ;                              AMP             | MIN_FREQ. | MAX_FREQ
    kPitchJit     jitter           0.05*gkjitter*4,     1,         20

    ;------------------------------------------------------------------------------------------------------------
    ;AMPLITUDE JITTER (THIS WILL BE USED TO ADD HUMAN-PLAYER-LIKE INSTABILITY)
    ;------------------------------------------------------------------------------------------------------------
    ;                              AMP             | MIN_FREQ. | MAX_FREQ
    kAmpJit       jitter           0.1*gkjitter*4,     0.2,        1
    kAmpJit       =                kAmpJit+1            ;OFFSET SO IT MODULATES ABOUT '1' INSTEAD OF ABOUT ZERO
    
    knum          =                knum+kPitchJit            ; DERIVE K-RATE NOTE NUMBER VALUE INCORPORATING PITCH BEND, VIBRATO, AND PITCH JITTER    

    /* OSCILLATOR */
    kmul          portk            gkmul, kporttime*0.1
    ;kMulEnv      linsegr          0, i(gkMAtt)+0.0001, i(gkMLev), i(gkMDec)+0.0001, i(gkMSus), i(gkMRel)+0.0001, 0
    kMulEnv       expsegr          0.001, i(gkMAtt)+0.0001, i(gkMLev)+0.001, i(gkMDec)+0.0001, i(gkMSus)+0.001, i(gkMRel)+0.0001, 0.001
    kMulEnv       =                kMulEnv + 0.001        ; offset
    kmul          =                kmul+kMulEnv+(kmod*gkToneDep)
    kmul          limit            kmul,0,0.9
    knum          =                knum + gkPchBend + (kmod*gkVibDep)
    knum          limit            knum, 0, 127
    ifn           =                ( i(gkwaveform) < 3 ? (gicos+i(gkwaveform)-1) : giwave)
    knh           limit            gknh+gklh, 1, (sr*0.5)/cpsmidinn(knum+(gkoctave*12)) ; limit number of harmonics
    if gkwaveform==3 then ; prevent aliasing if user waveform is chosen
     knh          limit            gknh+gklh, 1, (sr*0.5)/(cpsmidinn(knum+(gkoctave*12))*(gkHighest+1)) ; limit number of harmonics
    endif
    
    asig          gbuzz            (kAmpJit*0.1)*(1+(kmod*gkTremDep*0.9)), cpsmidinn(knum+(gkoctave*12)), knh, gklh, kmul, ifn;gicos+i(gkwaveform)-1
    
    /* NOISE */
    kNoiseAmp     expcurve         kmul,40
    kNoiseAmp     scale            kNoiseAmp,2,0.1
    anoise        gauss            kNoiseAmp*gkNoiseAmp                                                                      
    anoise        butlp            anoise,gkNoiseDamp
    asig          =                asig * (1+anoise)
    
    /* LOW CUT / HIGH CUT FILTERS */
    ;FILTER
    if gkLowCutOnOff=1 then
     kLowCut      portk            gkLowCut,kporttime*0.1
     kLowCut      limit            cpsmidinn(knum)*kLowCut,20,sr/2
     ktrig        changed          gkLowPoles
     if ktrig==1 then
                  reinit           RESTART_LOWCUT
     endif
     RESTART_LOWCUT:
     asig         clfilt           asig,kLowCut,1,i(gkLowPoles)
    endif
    if gkHighCutOnOff==1 then
     kHighCut     portk            gkHighCut,kporttime*0.1
     kHighCut     limit            cpsmidinn(knum)*kHighCut,20,sr/2
     ktrig        changed          gkHighPoles
     if ktrig==1 then              
                  reinit           RESTART_HIGHCUT
     endif
     RESTART_HIGHCUT:
     asig         clfilt           asig,kHighCut,0,i(gkHighPoles)
                  rireturn
    endif
            
    aenv          linsegr          0,i(gkAAtt)+0.0001,i(gkALev),i(gkADec),i(gkASus),i(gkARel),0            ;AMPLITUDE ENVELOPE
    asig          =                asig * aenv
    klevel        portk            gklevel,kporttime*0.1
    kpan          portk            gkpan,kporttime*0.1
    kRvbMix       portk            gkRvbMix,kporttime*0.1
    aL,aR         pan2             asig*klevel,kpan        ;scale amplitude level and create stereo panned signal
                  outs             aL*(1-gkRvbSize), aR*(1-gkRvbSize)        ;SEND AUDIO TO THE OUTPUTS
    gasendL       =                gasendL+aL*kRvbMix
    gasendR       =                gasendR+aR*kRvbMix
endin



instr    5    ;reverb
    if gkRvbMix==0 kgoto SKIP_REVERB
    aL,aR         reverbsc         gasendL,gasendR,gkRvbSize,12000
                  outs             aL,aR
                  clear            gasendL,gasendR
    SKIP_REVERB:
endin

instr 6 ; monitor
a1,a2             monitor
;aenv   linseg 0,2,0.9,2,0.9,2,0
;a1                poscil           aenv,440
;a2=a1
kRMS              rms              a1+a2
ksig              limit            kRMS*20, 0, 1
kclip             limit            (kRMS*5) - 4, 0, 1
kupdate           metro            32
                  cabbageSet       kupdate, "signal", "colour:1", 100*ksig, 255*ksig, 100*ksig
                  cabbageSet       kupdate, "clip",   "colour:1", 255*kclip, 100*kclip, 100*kclip
endin

</CsInstruments>

<CsScore>
i 1 0 z            ; read widgets
i 5 0 z            ; reverb
i 6 0 z            ; monitor
f 0 z
</CsScore>

</CsoundSynthesizer>