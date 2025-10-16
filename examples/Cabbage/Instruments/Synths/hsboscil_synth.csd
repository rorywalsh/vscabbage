
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; hsboscil_synth.csd
; 
; Synthesizer is divided into seven panels.
; 
; Amplitude
; ---------
; Amp        -    amplitude control
; Att.       -    amplitude envelope attack time
; Dec.       -    amplitude envelope decay time
; Sus.       -    amplitude envelope sustain level
; Rel.       -    amplitude envelope release time
; Mod.Shape  -    shape used for amplitude modulation (tremolo). Choose from sine shaped, random splines, random sample and hold (randomh) or square wave.
; Rate       -    rate of amplitude LFO (tremolo)
; Depth      -    depth of amplitude LFO
; Delay      -    delay time before amplitude LFO begins
; Rise       -    time over which amplitude LFO depth rises from zero to its prescribed value
; 
; Brightness -    brightness is really just a description of where the emphasis is in the stack of octave spaced tones that hsboscil produces
; ----------
; Brite      -    manual brightness control
; Vel.       -    amount of velocity to brightness control
; Att.       -    brightness envelope attack time
; Att.Lev    -    brightness envelope attack level
; Dec.       -    brightness envelope decay time
; Sus.       -    brightness envelope sustain level
; Rel.       -    brightness envelope release time
; Rel.Lev    -    brightness envelope release level
; Oct.Cnt.   -    Number of octave spaced partials in a tone
; Mod.Shape  -    shape used for brightness modulation. Choose from sine shaped, random splines, random sample and hold (randomh) or square wave.
; Rate       -    rate of brightness LFO
; Depth      -    depth of brightness LFO
; Delay      -    delay time before brightness LFO begins
; Rise       -    time over which brightness LFO depth rises from zero to its prescribed value
; 
; Noise      -    interpolated gaussian modulation is applied to the pitch (tone) parameter which, at high rates/frequencies results in the addition of a noise component in the tone
; -----
; Rate       -    rate/frequency of noise modulation
; Depth      -    depth of noise modulation
; 
; Reverb     -    the screverb opcode is used
; ------
; Mix        -    amount of reverb that is mixed into the output. When mix is zero the effect is bypassed.
; Size       -    size of the virtual space created by the reverb effect
; 
; Pitch Modulation - modulation of the tone (pitch) parameter. This will be at a much slower rate than that applied using the 'noise' function
; ----------------
; Mod.Shape  -    shape used for pitch modulation. Choose from sine shaped, random splines, random sample and hold (randomh) or square wave.
; Rate       -    rate of pitch modulation LFO
; Depth      -    depth of pitch modulation LFO
; Delay      -    delay time before pitch modulation LFO begins
; Rise       -    time over which pitch modulation LFO depth rises from zero to its prescribed value
; 
; Freq.Shift -    a frequency shifting effect
; ----------
; Freq.      -    frequency by which the signal will be shifted
; 
; Chorus     -    a stereo chorus effect. Two chorus voices are created which the panning of which is modulated randomly. Delay time/pitch modulations are random rather than cyclical.
; ------
; Mix        -    Amount of chorussed signal that is mixed into the output 
; Depth      -    Depth of modualtion used in the chorus effect
; Rate       -    Rate of modulation used in the chorus effect

; MIDI
; Pitch bend modulates the pitch of all notes +/- 12 semitones
; Modulation wheel controls 'Brite' in parallel to the GUI widget

<Cabbage>
form caption("hsboscil Synth") size(705, 590), pluginId("hsbo"), colour(50,60,60), guiMode("queue")

#define RSLIDER_STYLE valueTextBox(1), colour(200,200,230), trackerColour(230,230,255)

;AMPLITUDE
groupbox bounds(0, 0, 705, 130), colour( 10, 15, 30, 100) text("Amplitude"), fontColour(205,205,205), plant("Amplitude") {
rslider  bounds(  5, 30, 80, 90), text("Amp."), channel("amp"), range(0, 1, 0.3), $RSLIDER_STYLE
line     bounds( 85,  30, 2, 60), colour("DarkSlateGrey")
rslider  bounds( 90, 30, 80, 90), text("Att."), channel("AAtt"), range(   0, 8.00, 0.3,0.5), $RSLIDER_STYLE
rslider  bounds(150, 30, 80, 90), text("Dec."), channel("ADec"), range(   0, 8.00, 0.01,0.5), $RSLIDER_STYLE
rslider  bounds(210, 30, 80, 90), text("Sus."), channel("ASus"), range(   0, 1.00,  0.5,0.5), $RSLIDER_STYLE
rslider  bounds(270, 30, 80, 90), text("Rel."), channel("ARel"), range(0.01, 8,  0.3,0.5), $RSLIDER_STYLE
line     bounds(350, 30, 2, 60), colour("DarkSlateGrey")
label    bounds(370, 50, 65, 12), text("Mod.Shape"), align("centre")
combobox bounds(370, 62, 70, 20), channel("amplfo"), value(2), text("sine", "splines", "S+H", "square")
rslider  bounds(440, 30, 80, 90), text("Rate"), channel("ARte"), range(0, 16.0, 4), $RSLIDER_STYLE
rslider  bounds(500, 30, 80, 90), text("Depth"), channel("ADep"), range(0, 1.00, 1), $RSLIDER_STYLE
rslider  bounds(560, 30, 80, 90), text("Delay"), channel("ADel"), range(0, 2.00, 0, 0.5), $RSLIDER_STYLE
rslider  bounds(620, 30, 80, 90), text("Rise"), channel("ARis"), range(0, 2.00, 0.1, 0.5), $RSLIDER_STYLE
}

;BRIGHTNESS
groupbox bounds(0, 130,525,230), colour( 6, 18, 22, 100), text("Brightness"), fontColour(205,205,205), plant("Brightness") {
rslider  bounds(  5, 35, 80, 90), text("Brite"), channel("brite"), range(-6, 6.00, -2), $RSLIDER_STYLE
rslider  bounds(  5,130, 80, 90), text("Vel."), channel("BVelDep"), range(0, 6.00, 3), $RSLIDER_STYLE
rslider  bounds( 65, 35, 80, 90), text("Oct.Cnt."), channel("octcnt"), range(2, 20, 3, 1, 1), $RSLIDER_STYLE
line     bounds(140, 27,  2,195), colour("DarkSlateGrey")
rslider  bounds(140, 35, 80, 90), text("Att."), channel("BAtt"), range(0, 8.00, 0.1,0.5), $RSLIDER_STYLE
rslider  bounds(200, 35, 80, 90), text("Att.Lev."), channel("BAttLev"), range(-6.00, 6, 1), $RSLIDER_STYLE
rslider  bounds(260, 35, 80, 90), text("Dec."), channel("BDec"), range(0, 8.00, 0.1,0.5), $RSLIDER_STYLE
rslider  bounds(320, 35, 80, 90), text("Sus."), channel("BSus"), range(-6, 6.00, 0), $RSLIDER_STYLE
rslider  bounds(380, 35, 80, 90), text("Rel."), channel("BRel"), range(0, 8.00, 0.01,0.5), $RSLIDER_STYLE
rslider  bounds(440, 35, 80, 90), text("Rel.Lev."), channel("BRelLev"), range(-6.00, 6, 0), $RSLIDER_STYLE
;line    bounds( 90,100, 2, 60), colour("DarkSlateGrey")
label    bounds(160,150, 70, 12), text("Mod.Shape"), align("centre")
combobox bounds(160,164, 70, 20), channel("britelfo"), value(2), text("sine", "splines", "S+H", "square")
rslider  bounds(230,130, 80, 90), text("Rate"), channel("BRte"), range(0, 30.0, 4), $RSLIDER_STYLE
rslider  bounds(290,130, 80, 90), text("Depth"), channel("BDep"), range(0, 6.00, 2), $RSLIDER_STYLE
rslider  bounds(350,130, 80, 90), text("Delay"), channel("BDel"), range(0, 2.00, 0.5, 0.5), $RSLIDER_STYLE
rslider  bounds(410,130, 80, 90), text("Rise"), channel("BRis"), range(0, 4.00, 1.5, 0.5), $RSLIDER_STYLE
}

;NOISE
groupbox bounds(525, 130, 90,230), colour( 20, 7, 19, 100), text("Noise"), fontColour(205,205,205), plant("Noise") 
{
button   bounds( 20,  23, 50, 13), text("MONO","STEREO"), channel("NoiseMonoStereo"), value(1)
rslider  bounds(  5,  35, 80, 90), text("Rate"), channel("NRte"), range(16,10000, 1000, 0.5), $RSLIDER_STYLE
rslider  bounds(  5, 130, 80, 90), text("Depth"), channel("NDep"), range(0, 1.00, 0.05, 0.5), $RSLIDER_STYLE
}

;REVERB
groupbox bounds(615,130, 90,230), colour( 3, 25, 11, 100), text("Reverb"), fontColour(205,205,205), plant("Reverb") 
{
rslider  bounds(  5, 35, 80, 90), text("Mix"), channel("RvbMix"), range(0, 1.00, 0.3), $RSLIDER_STYLE
rslider  bounds(  5,130, 80, 90), text("Size"), channel("RvbSize"), range(0, 1.00, 0.82), $RSLIDER_STYLE
}

;PITCH MOD.
groupbox bounds(  0,360,405,130), colour( 20, 25, 40, 100), text("Pitch Modulation"), fontColour(205,205,205), plant("PitchMod") 
{
label    bounds( 15, 35, 65, 12), text("Mod.Shape")
combobox bounds( 15, 50, 65, 20), channel("pitchlfo"), value(1), text("sine", "splines", "S+H", "square")
rslider  bounds( 85, 30, 80, 90), text("Rate"), channel("PRte"), range(0, 16.00, 0, 0.5), $RSLIDER_STYLE
rslider  bounds(145, 30, 80, 90), text("Depth"), channel("PDep"), range(0, 1.00, 0), $RSLIDER_STYLE
rslider  bounds(205, 30, 80, 90), text("Delay"), channel("PDel"), range(0, 2.00, 0, 0.5), $RSLIDER_STYLE
rslider  bounds(265, 30, 80, 90), text("Rise"), channel("PRis"), range(0, 2.00, 0.1, 0.5), $RSLIDER_STYLE
rslider  bounds(325, 30, 80, 90), text("Risset"), channel("TRate"), range(-3.00, 3, 0), $RSLIDER_STYLE
}

;FREQ. SHIFT
groupbox bounds(405,360, 90,130), colour( 20,  5, 25, 100), text("Freq.Shift"), fontColour(205,205,205), plant("FreqShift") 
{
rslider  bounds(  5, 30, 80, 90), text("Freq."), channel("FShift"), range(-1000, 1000, -1000), $RSLIDER_STYLE
}

;CHORUS
groupbox bounds(495,360,210,130), colour( 3, 10, 13, 100), text("Chorus"), fontColour(205,205,205), plant("Chorus") 
{
rslider  bounds(  5, 30, 80, 90), text("Mix"), channel("ChoMix"), range(0, 1.00, 1), $RSLIDER_STYLE
rslider  bounds( 65, 30, 80, 90), text("Depth"), channel("ChoDep"), range(0, 0.100, 0.01,0.5,0.0001), $RSLIDER_STYLE
rslider  bounds(125, 30, 80, 90), text("Rate"), channel("ChoRte"), range(0, 20.0, 4, 0.5), $RSLIDER_STYLE
}

keyboard bounds(5, 490,695, 85)

label    bounds(  5,576,110, 12), text("Iain McCurdy |2012|"), fontColour("silver"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =       4       ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE. HIGHER ksmps can result in quantisation noise in kbrite modulations.
nchnls       =       2       ; NUMBER OF CHANNELS (2=STEREO)
0dbfs        =       1
             seed    0
             massign 0, 2

;Author: Iain McCurdy (2012)

gisine          ftgen    0, 0, 131072, 10, 1                ; A SINE WAVE
gioctfn         ftgen    0, 0, 1024, -19, 1, 0.5, 270, 0.5  ; A HANNING-TYPE WINDOW
gasendL,gasendR init     0

opcode    FreqShifter,a,aki
    ain,kfshift,ifn    xin                    ; READ IN INPUT ARGUMENTS
    areal, aimag hilbert ain                  ; HILBERT OPCODE OUTPUTS TWO PHASE SHIFTED SIGNALS, EACH 90 OUT OF PHASE WITH EACH OTHER
    asin          oscili           1,    kfshift,     ifn,          0
    acos          oscili           1,    kfshift,     ifn,          0.25    
    ;RING MODULATE EACH SIGNAL USING THE QUADRATURE OSCILLATORS AS MODULATORS
    amod1         =                areal * acos
    amod2         =                aimag * asin    
    ;UPSHIFTING OUTPUT
    aFS           =                (amod1 - amod2)
                  xout             aFS                ; SEND AUDIO BACK TO CALLER INSTRUMENT
endop

instr 1 ; read in widgets
    gkModWhl      ctrl7            1, 1, 0, 127
    gkModWhlT     changed          gkModWhl
    if gkModWhlT==1 then
                  cabbageSetValue  "brite", ((gkModWhl*12)/(127))-6, gkModWhlT
    endif

    gkamplfo      cabbageGetValue  "amplfo"
    gkbritelfo    cabbageGetValue  "britelfo"
    gkChoMix      cabbageGetValue  "ChoMix"
    gkChoDep      cabbageGetValue  "ChoDep"
    gkChoRte      cabbageGetValue  "ChoRte"
    gkRvbMix      cabbageGetValue  "RvbMix"
    gkRvbSize     cabbageGetValue  "RvbSize"
    gkFShift      cabbageGetValue  "FShift"
    gkNRte        cabbageGetValue  "NRte"
    gkNDep        cabbageGetValue  "NDep"
    gkpitchlfo    cabbageGetValue  "pitchlfo"
    gkPDel        cabbageGetValue  "PDel"
    gkPRis        cabbageGetValue  "PRis"
    gkPRte        cabbageGetValue  "PRte"
    gkPDep        cabbageGetValue  "PDep"    
endin

instr 2 ; hsboscil instrument. MIDI notes are directed here.
    kporttime     linseg             0,0.001,0.01              ; PORTAMENTO TIME VALUE RISES QUICKLY FROM ZERO TO A HELD VALUE 
    gkPB          pchbend            0, 12
    gkPB          portk              gkPB,kporttime
    kamp          cabbageGetValue    "amp"                     ; READ WIDGETS...
    iAAtt         cabbageGetValue    "AAtt"                    ;
    iADec         cabbageGetValue    "ADec"                    ;
    iASus         cabbageGetValue    "ASus"                    ;
    iARel         cabbageGetValue    "ARel"                    ;
    aenv          linsegr            0.001,iAAtt+0.001,1,iADec+0.001,iASus,iARel+0.001,0.001    ;AMPLITUDE ENVELOPE
    iADel         cabbageGetValue    "ADel"                    ;
    iARis         cabbageGetValue    "ARis"                    ;
    kADep         cabbageGetValue    "ADep"                    ;
    kARte         cabbageGetValue    "ARte"                    ;
    kbrite        cabbageGetValue    "brite"                   ;
    kbrite        portk              kbrite,kporttime
    koctcnt       cabbageGetValue    "octcnt"                  ;
    iBVelDep      cabbageGetValue    "BVelDep"                 ;

    iBAtt         cabbageGetValue    "BAtt"                    ;
    iBAttLev      cabbageGetValue    "BAttLev"                 ;
    iBDec         cabbageGetValue    "BDec"                    ;
    iBSus         cabbageGetValue    "BSus"                    ;
    iBRel         cabbageGetValue    "BRel"                    ;
    iBRelLev      cabbageGetValue    "BRelLev"                 ;
    kBEnv         linsegr            0,iBAtt+0.001,iBAttLev,iBDec+0.001,iBSus,iBRel+0.001,iBRelLev    ;'BRIGHTNESS' ENVELOPE
    iBDel         cabbageGetValue    "BDel"                    ;
    iBRis         cabbageGetValue    "BRis"                    ;
    kBDep         cabbageGetValue    "BDep"                    ;
    kBRte         cabbageGetValue    "BRte"                    ;

    kTRate        cabbageGetValue    "TRate"                   ;

    ibasfreq      cpsmidi                         ; READ MIDI NOTE PITCH

    ktrig         changed            koctcnt      ; IF 'NUMBER OF OCTAVES' AS DEFINED BY WIDGET CHANGES GENERATE A TRIGGER
    if ktrig==1 then                              ; IF 'NUMBER OF OCTAVES' CHANGE TRIGGER HAS BEEN GENERATED...
                  reinit             UPDATE       ; BEGIN A REINITIALISATION PASS FROM LABEL 'UPDATE'
    endif                                         ; END OF CONDITIONAL
    UPDATE:                                       ; LABEL 'UPDATE'. REINITIALISATION PASS BEGINS FROM HERE

    ;AMPLITUDE LFO
    kdepth        linseg             0,iADel+0.001,0,iARis+0.001,1             ; DEPTH OF MODULATION ENVELOPE
    if gkamplfo==1 then
     kALFO        lfo                (kdepth*kADep)/2,kARte,0                  ; LFO (sine)
    elseif gkamplfo==2 then
     kALFO        jspline            (kdepth*kADep)/2,kARte,kARte    
    elseif gkamplfo==3 then
     kALFO        randomh            -(kdepth*kADep)/2,(kdepth*kADep)/2,kARte
     kALFO        port               kALFO,0.001                               ; smooth out the clicks
    else
     kALFO        lfo                (kdepth*kADep)/2,kARte,2                  ; LFO (bi-square)
     kALFO        port               kALFO,0.001                               ; smooth out the clicks
    endif

    kALFO         =                  (kALFO+0.5) + (1 - kADep)                 ; OFFSET AND RESCALE LFO FUNCTION

    ;VELOCITY TO AMPLITUDE
    iVelAmp       veloc              0.2,1                                     ; READ IN MIDI NOTE VELOCITY AS A VALUE WITHIN THE RANGE 0.2 TO 1

    ;BRIGHTNESS LFO
    kdepth        linseg             0,iBDel+0.001,0,iBRis+0.001,1             ; DEPTH OF MODULATION ENVELOPE
    if gkbritelfo==1 then
     kBLFO        lfo                kdepth*kBDep,kBRte,0                      ; LFO (sine)
    elseif gkbritelfo==2 then
     kBLFO        jspline            kdepth*kBDep,kBRte,kBRte
    elseif gkbritelfo==3 then
     kBLFO        randomh            -kdepth*kBDep,kdepth*kBDep,kBRte
     kBLFO        port               kBLFO,0.004                               ; smooth out the clicks
    else
     kBLFO        lfo                kdepth*kBDep,kBRte,2                      ; LFO (bi-square)
     kBLFO        port               kBLFO,0.004                               ; smooth out the clicks
    endif

    ;VELOCITY TO BRIGHTNESS
    iBVel         ampmidi            iBVelDep                                  ; MIDI NOTE VELOCITY USED TO DERIVE A VALUE THAT WILL INFLUENCE 'BRIGHTNESS'
    
    ;NOISE
    knoiseL       gaussi             1, gkNDep, gkNRte
    kNoiseMonoStereo cabbageGetValue "NoiseMonoStereo"
    if kNoiseMonoStereo==1 then
     knoiseR       gaussi             1, gkNDep, gkNRte
    else
     knoiseR       =                  knoiseL
    endif
    
    ;RISSET
    kRisset       lfo                1,kTRate,4                                ; 'RISSET GLISSANDO' FUNCTION

    ;PITCH MODULATION
    kPDepth       linseg             0,i(gkPDel)+0.001,0,i(gkPRis)+0.001,1     ; DEPTH OF MODULATION ENVELOPE
    if gkpitchlfo==1 then
     kPLFO        lfo                gkPDep*kPDepth,gkPRte,0                   ; LFO
    elseif gkpitchlfo==2 then
     kPLFO        jspline            gkPDep*kPDepth,gkPRte,gkPRte
    elseif gkpitchlfo==3 then
     kPLFO        randomh            -gkPDep*kPDepth,gkPDep*kPDepth,gkPRte
     kPLFO        port               kPLFO,0.002                               ; smooth out the clicks
    else
     kPLFO        lfo                gkPDep*kPDepth,gkPRte,2                   ; LFO (bi-square)
     kPLFO        port               kPLFO,0.002                               ; smooth out the clicks
    endif

if changed:k(gkPB)==1 then
 reinit RESTART
endif
RESTART:        
    aL            hsboscil           kamp*kALFO*iVelAmp, (kPLFO+kRisset+knoiseL), kbrite+kBEnv+kBLFO+iBVel, ibasfreq*semitone(i(gkPB)), gisine, gioctfn, i(koctcnt), -1 * rnd(1)    ;CREATE AN hsboscil TONE FOR THE LEFT CHANNEL. RANDOM INITIAL PHASE CREATE STEREO EFFECT.
    aR            hsboscil           kamp*kALFO*iVelAmp, (kPLFO+kRisset+knoiseR), kbrite+kBEnv+kBLFO+iBVel, ibasfreq*semitone(i(gkPB)), gisine, gioctfn, i(koctcnt), -1 * rnd(1)    ;CREATE AN hsboscil TONE FOR THE RIGHT CHANNEL. RANDOM INITIAL PHASE CREATE STEREO EFFECT.
    rireturn
    aL            =                  aL*aenv                ; APPLY AMPLITUDE ENVELOPE TO AUDIO OUTPUT OF hsboscil
    aR            =                  aR*aenv                ; APPLY AMPLITUDE ENVELOPE TO AUDIO OUTPUT OF hsboscil
    rireturn
    
    /*FREQUENCY SHIFTER*/
    if gkFShift==0 kgoto SKIP_FSHIFT                   ; IF F.SHIFT VALUE = 0, BYPASS THE EFFECT
     kFShift      portk            gkFShift,kporttime
     aL           FreqShifter      aL,kFShift,gisine
     aR           FreqShifter      aR,kFShift,gisine    
    SKIP_FSHIFT:

                  outs             aL,aR               ; SEND AUDIO TO OUTPUTS
    gasendL       =                gasendL+aL
    gasendR       =                gasendR+aR
endin
        
instr    3    ;Chorus effect
    if gkChoMix==0 goto SKIP_CHORUS
    kporttime     linseg           0,0.001,1
    kporttime     =                kporttime/gkChoRte
    kdlt1         randomi          ksmps/sr,gkChoDep,gkChoRte,1
    kdlt1         portk            kdlt1,kporttime
    adlt1         interp           kdlt1
    acho1         vdelay           gasendL,adlt1*1000,1*1000
    
    kdlt2         randomi          ksmps/sr,gkChoDep,gkChoRte,1
    kdlt2         portk            kdlt2,kporttime
    adlt2         interp           kdlt2
    acho2         vdelay           gasendR,adlt2*1000,1*1000
    
    kpan1         randomi          0,1,gkChoRte,1
    kpan2         randomi          0,1,gkChoRte,1
    a1L,a1R       pan2             acho1,kpan1
    a2L,a2R       pan2             acho2,kpan2
    achoL         =                a1L+a2L
    achoR         =                a1R+a2R
                  outs             achoL*gkChoMix,achoR*gkChoMix
    

    gasendL       =                (gasendL+achoL)*gkRvbMix
    gasendR       =                (gasendR+achoR)*gkRvbMix
    SKIP_CHORUS:
    gasendL       =                gasendL*gkRvbMix
    gasendR       =                gasendR*gkRvbMix
endin

instr    4    ;reverb
    if gkRvbMix==0 goto SKIP_REVERB
    aL,aR         reverbsc         gasendL,gasendR,gkRvbSize,12000
                  outs             aL,aR
    SKIP_REVERB:
                  clear            gasendL,gasendR
endin

</CsInstruments>

<CsScore>
i 1 0 z
i 3 0 z
i 4 0 z
</CsScore>

</CsoundSynthesizer>