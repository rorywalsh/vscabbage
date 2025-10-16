
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; pvsAdsyn.csd
; Written by Iain McCurdy, 2012.

; Encapsulation of the pvsadsyn opcode.
; This opcode takes a streaming phase vocoding analysis and reconstitutes it as an audio signal with user-definable parameters
;  for the number of bins to include, the bin from which to begin resynthesis (bin offset) and the option of skipping bins and not
;  resynthesising them one after another (Bin Incr.)

; Input       -  Mono (left channel leve input), Stereo (stereo live input), Noise (white noise test signal)
; Freq.Mod.   -  frequency scaling factor
; Num. Osc.s  -  number of oscillators in the resynthesis. Acts a little bit like the cutoff frequency of a brickwall low-pass filter.
; Bin Offset  -  first FFT bin in the resynthesis. Acts a little bit like the cutoff frequency of a brickwall high-pass filter.
; Bin Incr.   -  increment in number of bins for each successive oscillator (for full resynthesis this should be 1). Higher values will produce comb filtering-like effects.
; FFT Size    -  Larger values will retain spectral accuracy at the expense of time accuracy
;                 Smaller values will improve time accuracy at the expense of spectral accuracy.
;                 In general smaller values are preferrable with rhythmic material and larger values are preferrable with melodic material. 
; Feedback    -  amount of the output signal that is fed back into the input
; Mix         -  mix between the dry and wet signals
; Level       -  gain applied to the output signal

<Cabbage>
form caption("pvsAdsyn") size(680, 120), pluginId("adsy"), guiMode("queue")
image bounds(0, 0, 680,120), colour(43,40,38), shape("rounded"), outlineColour(255, 255, 200, 255), outlineThickness(3) 

#define RSLIDER_STYLE textColour("white"), fontColour("white"), colour(200,150,100,250), trackerColour(255, 255, 200, 255), valueTextBox(1), markerColour("black")
label    bounds( 15, 13, 70, 14), text("INPUT"), fontColour("white")
listbox  bounds( 14, 30, 70, 60), , align("centre"), , channel("input") text("Mono", "Stereo", "Noise") highlightColour(255, 255, 200, 255), fontColour("DarkGrey"), colour(0,0,0)
rslider  bounds(110, 15, 70, 90),  text("Freq.Mod."),  channel("fmod"), range(0.25, 4, 1), $RSLIDER_STYLE
rslider  bounds(180, 15, 70, 90),  text("Num.Osc.s"),  channel("noscs"), range(1, 1024, 256,1,1), $RSLIDER_STYLE
rslider  bounds(250, 15, 70, 90), text("Bin Offset"), channel("binoffset"), range(0, 256, 1,1,1), $RSLIDER_STYLE
rslider  bounds(320, 15, 70, 90), text("Bin Incr."),  channel("binincr"), range(1, 32, 1,1,1), $RSLIDER_STYLE
label    bounds(395, 25, 60, 13), text("FFT Size"), fontColour("white")
combobox bounds(395, 40, 60, 18), text("128","256","512","1024","2048","4096","8192","16384","32768","65536"), channel("FFT"), value(4), fontColour(255,255,200)
rslider  bounds(460, 15, 70, 90), text("Feedback"),   channel("feedback"), range(0, 0.99, 0), $RSLIDER_STYLE
rslider  bounds(530, 15, 70, 90), text("Mix"),        channel("mix"), range(0, 1.00, 1), $RSLIDER_STYLE
rslider  bounds(600, 15, 70, 90), text("Level"),      channel("lev"), range(0, 5.00, 0.5, 0.5), $RSLIDER_STYLE
label    bounds(  5,106,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")
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

;Author: Iain McCurdy (2012)
;http://iainmccurdy.org/csound.html

opcode    pvsadsyn_module,a,akkkkkki
    ain,kfmod,knoscs,kbinoffset,kbinincr,kfeedback,kmix,iFFT    xin
    aresyn       init     0
    f_anal       pvsanal  ain+(aresyn*kfeedback), iFFT, iFFT/4, iFFT, 1        ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    if changed:k(knoscs,kbinoffset,kbinincr) == 1 then
     reinit    UPDATE2
    endif
    UPDATE2:
    inoscs       init     i(knoscs)    
    ibinoffset   init     i(kbinoffset)
    ibinincr     init     i(kbinincr)
    inoscs       limit    inoscs, 1, (((iFFT*0.5)+1)-ibinoffset)/ibinincr
    aresyn       pvsadsyn f_anal, inoscs, kfmod , i(kbinoffset), i(kbinincr)    ; RESYNTHESIZE FROM THE fsig USING pvsadsyn
    rireturn
    amix         ntrpol   ain, aresyn, kmix                                     ; CREATE DRY/WET MIX
                 xout     amix
endop

instr    1
    ; audio input
    kinput       cabbageGetValue   "input"
    if kinput == 1 then
     ainL        inch              1
     ainR        =                 ainL
    elseif kinput == 2 then
     ainL,ainR   ins
    else
     ainL noise 0.2,0
     ainR noise 0.2,0
    endif
     
    ;ainL poscil  0.1,330
    ;ainR = ainL
    ;ainL,ainR    diskin2           "/Users/iainmccurdy/Documents/iainmccurdy.org/CsoundRealtimeExamples/SourceMaterials/SynthPad.wav", 1, 0, 1    ;USE FOR TESTING
    kmix         cabbageGetValue   "mix"
    kfmod        cabbageGetValue   "fmod"
    knoscs       cabbageGetValue   "noscs"
    kbinoffset   cabbageGetValue   "binoffset"
    kbinoffset   init              1
    kbinincr     cabbageGetValue   "binincr"
    kbinincr     init              1
    klev         cabbageGetValue   "lev"
    kfeedback    cabbageGetValue   "feedback"
    
    /* SET FFT ATTRIBUTES */
    kFFT         cabbageGetValue    "FFT"
    kFFT         init               4
    if changed:k(kFFT)==1 then
     reinit UPDATE
    endif
    UPDATE:
    aoutL        pvsadsyn_module    ainL,kfmod,knoscs,kbinoffset,kbinincr,kfeedback,kmix,2^(i(kFFT)+6)
    aoutR        pvsadsyn_module    ainR,kfmod,knoscs,kbinoffset,kbinincr,kfeedback,kmix,2^(i(kFFT)+6)
    rireturn
                 outs               aoutL * klev, aoutR * klev
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>