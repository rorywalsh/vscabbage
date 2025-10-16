
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; pvScale.csd
; Written by Iain McCurdy, 2012, 2015, 2024.

; This effect can be used for pitch shifting via streaming-FFT means.
; There are a selection of methods by which the pitch-shifted output can be fed back into the input for 
;  interative pitch shifting.
; The pitch shift interval, as well as being controlled manually and expressed in semitones or as a ratio,
; can be modulated by two modulating engines employing a variety of random generators and LFOs. 

; Pitch scaling interval can be defined either in semitones and cents or as a ratio (fraction).

; Three methods of feedback are possible:
;  1: "F Sig" Direct feeding back of the fft signal
;  2: "Audio" feeding back of the audio signal, therefore each time the signal will be resynthesized anf then re-analysed. Additional delay will also be induced when feeding back.
;  3: "Iter. A number of iterations are defined, creating a stack of pitch shifted signals. This method will be CPU costly if "Iter." is high. Some CPU can be saved by reducing "FFT Size"

; FFT Size    -    Larger values will retain spectral accuracy at the expense of time accuracy
;                   Smaller values will improve time accuracy at the expense of spectral accuracy.
;                   In general smaller values are preferrable with rhythmic material and larger values are preferrable with melodic material. 

; Port.       -    Portamento time applied to changed made to the pitch scaling interval

; Two scaling modulation engines

; Mode        -    choose from one of seven modes:     
;                  1. Gaussian (random)
;                  2. Tri-rand (random)
;                  3. Uni-rand (random)
;                  4. Sine-LFO
;                  5. Tri-LFO
;                  6. Squ-LFO
;                  7. Saw-LFO
;                  8. Ramp-LFO
; Range       - range of random number generation in semitones
; Rate        - rate of modulation. 
;               With one of the random modes this will be the rate at which new values are generated. When at maximum, rate of generation is k-rate.
; Interpolate - (only active when one of the first three random modes are chosen)
;               jumps between random values are smoothed using portamento decay

<Cabbage>
form caption("pvscale Pitch Shifter") size(690,280), pluginId("scal") guiMode("queue")
image                         bounds(0, 0, 690,280), colour("DarkSlateGrey"), outlineColour("silver"), outlineThickness(4)

#define RSLIDER_DESIGN textColour("white"),colour("DarkSlateGrey"), trackerColour("LightBlue"), valueTextBox(1), fontColour("white"), markerColour("white")
#define COMBOBOX_DESIGN textColour("white"),colour(10,20,10), trackerColour("LightBlue"), valueTextBox(1), fontColour("white")
#define LABEL_DESIGN fontColour("white")

label    bounds( 10, 15, 75, 13), text("Input"), $LABEL_DESIGN
combobox bounds( 10, 30, 75, 20), channel("Input"), text("Live (St.)","Live (M.)","Test"), value(1), $COMBOBOX_DESIGN
label    bounds( 10, 55, 75, 13), text("Interval"), $LABEL_DESIGN
combobox bounds( 10, 70, 75, 20), channel("IntervalMode"), text("Semitone","Ratio"), value(1), $COMBOBOX_DESIGN

image   bounds( 90, 15,290,100), colour(0,0,0,0), channel("semitone_ident") 
{
rslider bounds(  0,  0, 70, 90),  text("Semitones"), channel("semis"), range(-24, 24, 7, 1, 1), $RSLIDER_DESIGN
rslider bounds( 70,  0, 70, 90),  text("Cents"),     channel("cents"), range(-100, 100, 0, 1, 1), $RSLIDER_DESIGN
}

image     bounds(130, 25, 35, 58), colour(0,0,0,0), visible(0), channel("ratio_ident") 
{
nslider bounds(  5,  0, 25, 25), channel("Numerator"),        range(1,99,3,1,1)
image     bounds(  0, 26, 35,  3), shape("sharp"), $LABEL_DESIGN
nslider bounds(  5, 30, 25, 25), channel("Denominator"),      range(1,99,2,1,1)
}

rslider bounds(230, 15, 70, 90), text("Feedback"),  channel("FB"), range(0.00, 0.99, 0), $RSLIDER_DESIGN
rslider bounds(230, 15, 70, 90), text("Iter."),     channel("Iter"), range(1, 10, 1,1,1), $RSLIDER_DESIGN

label    bounds(310, 15, 70, 12), text("F.back Mode"), $LABEL_DESIGN
combobox bounds(310, 30, 70, 20), channel("FB_mode"), value(1), text("F Sig.", "Audio", "Iter."), $COMBOBOX_DESIGN
label    bounds(310, 55, 70, 12), text("Formants"), $LABEL_DESIGN
combobox bounds(310, 70, 70, 20), channel("formants"), value(1), text("Ignore", "Keep 1", "Keep 2"), $COMBOBOX_DESIGN

label    bounds(400, 29, 60, 12), text("FFT Size"), $LABEL_DESIGN
combobox bounds(400, 42, 60, 20), channel("FFTsize"), text("64","128","256","512","1024","2048","4096","8192","16384","32768"), value(6), $COMBOBOX_DESIGN

rslider bounds(470, 15, 70, 90), text("Port."),     channel("port"),      range(0,30.00, 0.05,0.5,0.01), $RSLIDER_DESIGN
rslider bounds(540, 15, 70, 90), text("Mix"),       channel("mix"),       range(0, 1.00, 1.0), $RSLIDER_DESIGN
rslider bounds(610, 15, 70, 90), text("Level"),     channel("lev"),       range(0, 1.00, 0.40, 0.5), $RSLIDER_DESIGN

image   bounds( 10,115,670,145), colour("DarkSlateGrey"), outlineColour("silver"), outlineThickness(1)
{
label    bounds(  0,  7,670, 15), text("F R E Q U E N C Y   S C A L I N G   M O D U L A T I O N"), $LABEL_DESIGN

image    bounds(  5, 27,326,112), colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
label    bounds(  5, 30,326, 12), text("1"), fontColour("white")
label    bounds( 15, 60, 80, 13), text("Mode"), $LABEL_DESIGN
combobox bounds( 15, 75, 80, 20), items("Gaussian","Tri-rand","Uni-rand","Sine-LFO","Tri-LFO","Squ-LFO","Saw-LFO","Ramp-LFO"), value(1), channel("ModMode"), $COMBOBOX_DESIGN
rslider  bounds( 95, 40, 70, 90),  text("Range"), channel("ModRange"), range(  0,  24,   0), $RSLIDER_DESIGN
rslider  bounds(165, 40, 70, 90),  text("Rate"),  channel("ModRate"),  range(0.1, 100, 2, 0.5), $RSLIDER_DESIGN
checkbox bounds(237, 75, 90, 20),  text("Interpolate"),  channel("ModInterp"), fontColour:0("white"), fontColour:1("white"), shape("ellipse")

image    bounds(340, 27,326,112), colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
label    bounds(340, 30,326, 12), text("2"), fontColour("white")
label    bounds(350, 60, 80, 13), text("Mode"), $LABEL_DESIGN
combobox bounds(350, 75, 80, 20), items("Gaussian","Tri-rand","Uni-rand","Sine-LFO","Tri-LFO","Squ-LFO","Saw-LFO","Ramp-LFO"), value(1), channel("ModMode2"), $COMBOBOX_DESIGN
rslider  bounds(430, 40, 70, 90),  text("Range"), channel("ModRange2"), range(  0,  24,   0), $RSLIDER_DESIGN
rslider  bounds(500, 40, 70, 90),  text("Rate"),  channel("ModRate2"),  range(0.1, 100, 2, 0.5), $RSLIDER_DESIGN
checkbox bounds(572, 75, 90, 20),  text("Interpolate"),  channel("ModInterp2"), fontColour:0("white"), fontColour:1("white"), shape("ellipse")
}

label    bounds( 10,263,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")
</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-d -n
</CsOptions>
<CsInstruments>

; sr is set by host
ksmps        =    32
nchnls       =    2
0dbfs        =    1    ; MAXIMUM AMPLITUDE

;Iain McCurdy
;http://iainmccurdy.org/csound.html
;Pitch shifting effect using pvs scale opcode.

/* FFT attribute tables */
giFFTsizes    ftgen    0, 0, 8, -2, 64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384, 32768

; test tone waveform
giWfm  ftgen  0,0,2048, 10, 1,0,0,0,0,0,0,1 ; test tone waveform

opcode    pvscale_module,a,akkkkkki
    ain,kscale,kformants,kfeedback,kFB_mode,kmix,klev,iFFTsize    xin
    
    if(kFB_mode==0) then                                               ;FSIG FEEDBACK MODE
     f_FB         pvsinit  iFFTsize, iFFTsize/4, iFFTsize, 1, 0        ;INITIALISE FEEDBACK FSIG
     f_anal       pvsanal  ain, iFFTsize, iFFTsize/4, iFFTsize, 1      ;ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
     f_mix        pvsmix   f_anal, f_FB                                ;MIX AUDIO INPUT WITH FEEDBACK SIGNAL
     f_scale      pvscale  f_mix, kscale                               ;RESCALE FREQUENCIES
     f_FB         pvsgain  f_scale, kfeedback                          ;CREATE FEEDBACK F-SIGNAL FOR NEXT PASS
     aout         pvsynth  f_scale                                     ;RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
    else                                                               ;AUDIO FEEDBACK MODE
     aFB          init     0
     f_anal       pvsanal  ain+aFB, iFFTsize, iFFTsize/4, iFFTsize, 1  ;ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
     f_scale      pvscale  f_anal, kscale, kformants-1                 ;RESCALE FREQUENCIES
     aout         pvsynth  f_scale                                     ;RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
     aFB          =        aout*kfeedback
    endif    
    amix          ntrpol   ain, aout, kmix                             ;CREATE DRY/WET MIX
                  xout     amix*klev    
endop

opcode    pvscale_module_iter,a,akkikkip                               ;ITERATION FEEDBACK MODE
    ain,kscale,kformants,iIter,kFB_mode,kporttime,iFFTsize,iCount xin
    aout,amix     init     0
    f_anal        pvsanal  ain, iFFTsize, iFFTsize/4, iFFTsize, 1      ;ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    kscaleL       portk    kscale^iCount, kporttime 
    f_scale       pvscale  f_anal, kscaleL, kformants-1                ;RESCALE FREQUENCIES
    aout          pvsynth  f_scale
    if iCount<iIter then
     amix         pvscale_module_iter    ain,kscale,kformants,iIter,kFB_mode,kporttime,iFFTsize,iCount+1
    endif    
                                          ;RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
                  xout     aout + amix    
endop

instr    1
    /* GUI WIDGETS SHOWING AND HIDING FOR INTERVAL DEFINITION CONTROLS */
    kIntervalMode    cabbageGetValue    "IntervalMode"
    if changed(kIntervalMode)==1 then
     if kIntervalMode==1 then
          cabbageSet k(1),"semitone_ident","visible",1
          cabbageSet k(1),"ratio_ident","visible",0          
     else
          cabbageSet k(1),"semitone_ident","visible",0
          cabbageSet k(1),"ratio_ident","visible",1
     endif
    endif

    /* GUI WIDGETS SHOWING AND HIDING FOR FEEDBACK CONTROLS */
    kFB_mode    cabbageGetValue    "FB_mode"
    if changed(kFB_mode)==1 then
     if kFB_mode==3 then
              cabbageSet k(1),"FB","visible",0
              cabbageSet k(1),"Iter","visible",1
     else
              cabbageSet k(1),"FB","visible",1
              cabbageSet k(1),"Iter","visible",0
     endif
    endif
    
    ; AUDIO INPUT
    kInput    cabbageGetValue        "Input"
    if kInput==1 then
     ainL,ainR ins
    elseif kInput==2 then
     ainL      inch        1
     ainR      =           ainL
    else
     ainL     poscil                 0.5,220,giWfm
     ainR     =                      ainL
    endif

    kmix      cabbageGetValue        "mix"
    kFB       cabbageGetValue        "FB"
    kIter     cabbageGetValue        "Iter"
    kformants cabbageGetValue        "formants"
    
    /* SET FFT ATTRIBUTES */
    kFFTsize   cabbageGetValue      "FFTsize"
    kFFTsize   init      6
    ktrig      changed   kFFTsize,kformants,kIter
    if ktrig==1 then
     reinit update
    endif
    update:

    /* PORTAMENTO TIME FUNCTION */
    kporttime     linseg    0,0.001,1    ; ramp-up function
    kport         cabbageGetValue    "port"        ; widget        
    kporttime     *=        kport        ; combine ramp-up and widget value

    iFFTsize      table    i(kFFTsize)-1, giFFTsizes
    /*-------------------*/
    
    kfeedback     cabbageGetValue    "FB"
    ksemis        cabbageGetValue    "semis"
    kcents        cabbageGetValue    "cents"
    kNumerator    cabbageGetValue    "Numerator"
    kDenominator  cabbageGetValue    "Denominator"
    
    kmix          cabbageGetValue    "mix"
    klev          cabbageGetValue    "lev"
    
    kscale        =         kIntervalMode = 1 ? semitone(ksemis)*cent(kcents) : kNumerator/kDenominator

    kscale        portk     kscale, kporttime

    ; RANDOM FREQUENCY SCALING
    kModRange     cabbageGetValue "ModRange"
    kModRate      cabbageGetValue "ModRate"
    kModMode      cabbageGetValue "ModMode"
    kModInterp    cabbageGetValue "ModInterp"
    if kModMode == 1 then                           ; gaussian
     kscaleMod       gauss           kModRange
    elseif kModMode == 2 then                       ; trirand
     kscaleMod       trirand         kModRange
    elseif kModMode == 3 then                       ; unirand
     kscaleMod       unirand         kModRange
    endif
    ; SAMPLE AND HOLD RANDOM FUNCTIONS
    if kModRate<100 then
     kscaleMod       samphold        kscaleMod, metro:k(kModRate)
    endif
    ; INTERPOLATION
    if kModInterp == 1 then
     kscaleMod       portk           kscaleMod, 1/kModRate
    endif
    ; LFOs
    if kModMode == 4 then                                   ; sine LFO
     kscaleMod       lfo             kModRange, kModRate, 0
    elseif kModMode == 5 then                               ; triangle LFO
     kscaleMod       lfo             kModRange, kModRate, 1
    elseif kModMode == 6 then                               ; square LFO
     kscaleMod       lfo             kModRange, kModRate, 2
    elseif kModMode == 7 then                               ; sawtooth LFO
     kscaleMod       lfo             kModRange, kModRate, 5
    elseif kModMode == 8 then                               ; ramp LFO
     kscaleMod       lfo             kModRange, kModRate, 4
    endif
    ; CREATE MODULATED SCALING VALUE
    kscale        *=                 2 ^ (kscaleMod/12)

    ; RANDOM FREQUENCY SCALING
    kModRange     cabbageGetValue "ModRange2"
    kModRate      cabbageGetValue "ModRate2"
    kModMode      cabbageGetValue "ModMode2"
    kModInterp    cabbageGetValue "ModInterp2"
    if kModMode == 1 then                           ; gaussian
     kscaleMod       gauss           kModRange
    elseif kModMode == 2 then                       ; trirand
     kscaleMod       trirand         kModRange
    elseif kModMode == 3 then                       ; unirand
     kscaleMod       unirand         kModRange
    endif
    ; SAMPLE AND HOLD RANDOM FUNCTIONS
    if kModRate<100 then
     kscaleMod       samphold        kscaleMod, metro:k(kModRate)
    endif
    ; INTERPOLATION
    if kModInterp == 1 then
     kscaleMod       portk           kscaleMod, 1/kModRate
    endif
    ; LFOs
    if kModMode == 4 then                                   ; sine LFO
     kscaleMod       lfo             kModRange, kModRate, 0
    elseif kModMode == 5 then                               ; triangle LFO
     kscaleMod       lfo             kModRange, kModRate, 1
    elseif kModMode == 6 then                               ; square LFO
     kscaleMod       lfo             kModRange, kModRate, 2
    elseif kModMode == 7 then                               ; sawtooth LFO
     kscaleMod       lfo             kModRange, kModRate, 5
    elseif kModMode == 8 then                               ; ramp LFO
     kscaleMod       lfo             kModRange, kModRate, 4
    endif
    ; CREATE MODULATED SCALING VALUE
    kscale        *=                 2 ^ (kscaleMod/12)

    if kFB_mode==3 then
     aoutL        pvscale_module_iter    ainL,kscale,kformants,i(kIter),kFB_mode,kporttime,iFFTsize
     aoutR        pvscale_module_iter    ainR,kscale,kformants,i(kIter),kFB_mode,kporttime,iFFTsize
     aoutL        ntrpol    ainL,aoutL,kmix
     aoutR        ntrpol    ainR,aoutR,kmix
     aoutL        *=        klev
     aoutR        *=        klev     
    else
     aoutL        pvscale_module    ainL,kscale,kformants,kfeedback,kFB_mode,kmix,klev,iFFTsize
     aoutR        pvscale_module    ainR,kscale,kformants,kfeedback,kFB_mode,kmix,klev,iFFTsize
    endif
    
                  outs      aoutL,aoutR
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>