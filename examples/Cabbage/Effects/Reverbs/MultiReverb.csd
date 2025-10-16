
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; MultiReverb.csd
; Written by Iain McCurdy, 2012

; Reverb effect that alternately employs the screverb and freeverb opcodes.
; Pitch Mod. is only used by reverbsc.

; screverb (Sean Costello) is an FDN (feedback delay network) reverb and the left and right outputs 
;  are fed back into both the left and right inputs.
; This way, a signal sent into just the left input for example, will appear reverberated, 
;  at both the left and right outputs. This behaviour is what we experience in real acoustic spaces.

; freeverb (Jezar at Dreampoint) is a Schroeder-style parallel-comb, series-alpass reverb.
;  The left and right channels remain separated therefore a signal sent into just the left input for example, 
;  will only appear at the left output. 
;  This behaviour is not what we experience in real acoustic spaces.

; INPUT      - if mono is selected, input is taken from the left/first input channel only.
; Input Gain - gain applied to the signal before it enters the reverb.
; Predelay   - applies a fixed delay to the signal being sent into the reverbs (not the dry signal)
;               This provides an emulation of distance from the nearest reflective surface (source, listener or both combined).
; Size       - in both modes, size controls feedback ratio and therefore reverberation time and to an extent, 
;               size of the reverb. 
;               A proper control of room size emulation would necessitate altering the internal delay times 
;               but this is not possible with either of these opcodes. For this, the nreverb opcode 
;               could be considered or simply constructing a reverb from first principles usind delays, 
;               comb filters and allpass filters.
; Damping    - In both reverb modes, this is enacted as low-pass filter cutoff within the feedback loop.
;               This can be thought of as an emulation of frequency-dependent absorbtion of barrier surfaces: 
;               smooth stone vs. carpets and curtains. 
; Pitch Mod. - available only in screverb option controls the amount of modulation of delay times 
;               of individual delays. The produces pitch modulation effects but with sufficient density this will be
;               experienced as a spectral smearing and increased richness and realism.


; FREEVERB
; --------
; CF = comb filter, AP = allpass filter

;        +-CF-+
;        |    |
;        +-CF-+
;        |    |
;        +-CF-+
;        |    |
;        +-CF-+
; INPUT->+    +-AP-AP-AP-AP->OUTPUT
;        +-CF-+  
;        |    |
;        +-CF-+
;        |    |
;        +-CF-+
;        |    |
;        +-CF-+

; REVERBSC
;

;        +-VARIABLE_DELAY-+
;        |  |             |
;        +-VARIABLE_DELAY-+
;        |  ||            |
;        +-VARIABLE_DELAY-+
;        |  |||           |
;        +-VARIABLE_DELAY-+
; INPUT->+  ||||          +-->OUTPUT
;        +-VARIABLE_DELAY-+
;        |  |||||         |
;        +-VARIABLE_DELAY-+
;        |  ||||||        |
;        +-VARIABLE_DELAY-+
;        |  |||||||       |
;        +-VARIABLE_DELAY-+
;        |  ||||||||
;        |  FB_MATRIX
;        +--+



<Cabbage>
form caption("Multi-Reverb") size(660,100), pluginId("Rvrb"), colour(160,160,170), guiMode("queue")
#define DIAL_STYLE  trackerInsideRadius(0.8),  trackerColour(250,250,180), colour(160,160,170), textColour(50,50,50)

button bounds( 5, 25, 66, 20), text("screverb","screverb"), channel("scType"),   value(1), fontColour:0(50,50,50), fontColour:1("lime"), radioGroup(1)
button bounds( 5, 50, 66, 20), text("freeverb","freeverb"), channel("freeType"), value(0), fontColour:0(50,50,50), fontColour:1("lime"), radioGroup(1)

label    bounds(80,25,70,14), text("INPUT"), fontColour(50,50,50)
combobox bounds(80,40,70,20), items("MONO","STEREO"), channel("MonoStereo"), value(2)

rslider bounds(160, 16, 70, 70), text("Input Gain"),   channel("inGain"), range(0, 1, 1,0.5), $DIAL_STYLE
rslider bounds(230, 16, 70, 70), text("Predelay (ms)"),   channel("predelay"), range(0, 300, 0,1,1), $DIAL_STYLE
rslider bounds(300, 16, 70, 70), text("Size"),       channel("fblvl"),    range(0, 1.00, 0.85), $DIAL_STYLE
rslider bounds(370, 16, 70, 70), text("Damping"),    channel("fco"),      range(0, 1.00, 0.6), $DIAL_STYLE
rslider bounds(440, 16, 70, 70), text("Pitch Mod."), channel("pitchm"),   range(0, 20.0, 1, 0.5), $DIAL_STYLE
rslider bounds(510, 16, 70, 70), text("Mix"),        channel("mix"),      range(0, 1.00, 0.3), $DIAL_STYLE
rslider bounds(580, 16, 70, 70), text("Level"),      channel("amp"),      range(0, 5.00, 1, 0.5), $DIAL_STYLE

label   bounds(  3, 87,120, 12), text("Iain McCurdy |2012|"), align("left"), fontColour("DarkGrey")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

; sr is set by host
ksmps    =    32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls   =    2    ; NUMBER OF CHANNELS (2=STEREO)
0dbfs    =    1

; Author: Iain McCurdy (2012)

instr    1

    ; read in widgets
    kinGain       cabbageGetValue    "inGain"
    kpredelay     cabbageGetValue    "predelay"
    kscType       cabbageGetValue    "scType"
    kfreeType     cabbageGetValue    "freeType"
    ktype         =                  (kscType == 1 ? 0 : 1)
    kfblvl        cabbageGetValue    "fblvl"
    kfco          cabbageGetValue    "fco"
    kpitchm       cabbageGetValue    "pitchm"
    kmix          cabbageGetValue    "mix"
    kamp          cabbageGetValue    "amp"
    kMonoStereo   cabbageGetValue    "MonoStereo"

    ;toggle widget visibility     
                  cabbageSet         changed:k(ktype),"pitchm","visible",1-ktype

    ; input
    ainL          inch               1
    if kMonoStereo==2 then
     ainR         inch               2
    else
     ainR         =                  ainL
    endif
    
    ; apply input gain
    ainGain       interp             kinGain
    ainL          *=                 ainGain
    ainR          *=                 ainGain
    
    ; predelay
    aPDL  vdelay ainL, a(kpredelay), 600
    aPDR  vdelay ainR, a(kpredelay), 600

                  denorm             ainL, ainR                  ; DENORMALIZE BOTH CHANNELS OF AUDIO SIGNAL
    
    ; reverbsc
    if ktype==0 then                                             ; reverbsc
     kfco         expcurve           kfco, 4                     ; CREATE A MAPPING CURVE TO GIVE A NON LINEAR RESPONSE
     kfco         scale              kfco, 20000, 20             ; RESCALE 0 - 1 TO 20 TO 20000
     kSwitch      changed            kpitchm                     ; GENERATE A MOMENTARY '1' PULSE IN OUTPUT 'kSwitch' IF ANY OF THE SCANNED INPUT VARIABLES CHANGE. (OUTPUT 'kSwitch' IS NORMALLY ZERO)
     if kSwitch=1 then                                           ; IF kSwitch=1 THEN
                  reinit             UPDATE                      ; BEGIN A REINITIALIZATION PASS FROM LABEL 'UPDATE'
     endif                                                       ; END OF CONDITIONAL BRANCHING
     UPDATE:                                                     ; A LABEL
     arvbL, arvbR reverbsc           aPDL, aPDR, kfblvl, kfco, sr, i(kpitchm)
     rireturn                                                    ; RETURN TO PERFORMANCE TIME PASSES
    
    ; freeverb
    else                                                         ; freeverb
     arvbL, arvbR freeverb           aPDL, aPDR, kfblvl, 1-kfco
    endif
    
    ; output
    amixL         ntrpol             ainL, arvbL, kmix           ; CREATE A DRY/WET MIX BETWEEN THE DRY AND THE REVERBERATED SIGNAL
    amixR         ntrpol             ainR, arvbR, kmix           ; CREATE A DRY/WET MIX BETWEEN THE DRY AND THE REVERBERATED SIGNAL
                  outs               amixL * kamp, amixR * kamp
endin
        
</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>