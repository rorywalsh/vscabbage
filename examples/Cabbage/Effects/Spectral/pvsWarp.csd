
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; pvsWarp.csd
; Written by Iain McCurdy, 2012.

; warps the spectral envelope by altering bin assignment in two ways: multiplicative scaling and additive shifting

; Input       -  choose an input source between the computer's live input or a test tone.
; Channels    -  choose mono or stereo - laptop built-in microphones sometimes only appear on the left channel in which case choose 'Mono'
; Scale       -  values greater than 1 stretch the spectral envelope, values less than 1 compress it
; Shift       -  the value given here shifts the spectral envelope in linear fashion
; Feedback    -  a proportion of the output signal can be fed back into the input
; FFT Size    -  choose an FFT size for the analysis and spectral transformation. Larger values favour better frequency resolution at the expense of transient resolution and smaller values favour transient resolution at the expense of frequency resolution.
; Delay Comp. -  compensates for the latency of pvs processing with relation to the FFT size chosen
; Mix         -  wet/dry mix between the spectrally transformed signal and the input signal
; Level       -  level of the output signal, both dry and wet signals

; The output spectrum of the wet signal is shown as a graph to help illustration the effects of scaling and shifting the spectral envelope.

<Cabbage>
form caption("pvsWarp") size(635,230), pluginId("warp"), guiMode("queue")
image            bounds(0, 0,635,230), colour( 80, 80,135,220), shape("rounded"), outlineColour("white"), outlineThickness(4) 

label    bounds(  5,  8, 80, 13), text("Input"), fontColour("silver")
combobox bounds(  5, 23, 80, 20), channel("input"), text("Live Input","Test Tone"), value(1)

label    bounds(  5, 46, 80, 13), text("Channels"), fontColour("silver")
combobox bounds(  5, 61, 80, 20), channel("channels"), text("Mono","Stereo"), value(2)


#define SLIDER_DESIGN colour("LightSlateGrey"), textColour("silver"), fontColour("silver"), trackerColour("white"), valueTextBox(1)
rslider  bounds(110,  5, 70, 90), text("Scale"),    channel("scal"), range(0, 32, 1, 0.5, 0.001), $SLIDER_DESIGN
rslider  bounds(180,  5, 70, 90), text("Shift"),    channel("shift"), range(-10000, 10000, 0), $SLIDER_DESIGN
rslider  bounds(250,  5, 70, 90), text("Feedback"), channel("FB"), range(0, 0.99, 0), $SLIDER_DESIGN
label    bounds(320, 20, 60, 13), text("FFT Size"), fontColour("silver")
combobox bounds(320, 35, 60, 20), text("128","256","512","1024","2048","4096","8192"), channel("FFT"), value(4), fontColour("silver")
checkbox bounds(390, 35, 95, 15), channel("DelayComp"), text("Delay Comp."), fontColour:0("silver"), fontColour:1("silver"), colour("lightblue")
rslider  bounds(485,  5, 70, 90), text("Mix"),      channel("mix"), range(0, 1.00, 1), $SLIDER_DESIGN
rslider  bounds(555,  5, 70, 90), text("Level"),    channel("lev"), range(0, 1.00, 0.5), $SLIDER_DESIGN

checkbox bounds(  5, 95,100, 12), channel("GraphOnOff"), value(1), text("Graph On/Off"), fontColour:0("white"), fontColour:1("white")
gentable bounds(  5,110,625,100), tableNumber(99), tableColour(255,0,0), channel("ampFFT"), outlineThickness(1), tableBackgroundColour("white"), tableGridColour(100,100,100,50), ampRange(0,1,99), outlineThickness(0), fill(1), sampleRange(0, 512) 

label    bounds(  5,213,120, 12), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n --displays
</CsOptions>

<CsInstruments>

; sr is set by host
ksmps        =    32
nchnls       =    2
0dbfs        =    1    ;MAXIMUM AMPLITUDE

;Author: Iain McCurdy (2012)
;http://iainmccurdy.org/csound.html

giWfm  ftgen  0,0,2048, 10, 1,0,0,0,0,0,0,1 ; test tone waveform

opcode    pvswarp_module,af,akkkkii
    ain,kscal,kshift,kfeedback,kmix,iFFT,iDelayComp    xin
    aout        init    0
    f_anal      pvsanal ain+(aout*kfeedback), iFFT, iFFT/4, iFFT, 1                  ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    f_warp      pvswarp f_anal, kscal, kshift                                        ; WARP SPECTRAL ENVELOPE VALUES OF AN F-SIGNAL USING BOTH SCALING AND SHIFTING
    aout        pvsynth f_warp                                                       ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
    if(kfeedback>0) then
     aout       clip    aout,0,0dbfs
    endif
    if iDelayComp==1 then
     ain        delay   ain,iFFT/sr
    endif
    amix        ntrpol  ain, aout, kmix                                              ; CREATE DRY/WET MIX
                xout    amix,f_warp   
endop

instr    1
    ainL,ainR    ins
    
    kinput       cabbageGetValue    "input"
    kchannels    cabbageGetValue    "channels"
    kscal        cabbageGetValue    "scal"
    kshift       cabbageGetValue    "shift"
    kfeedback    cabbageGetValue    "FB"
    kmix         cabbageGetValue    "mix"
    klev         cabbageGetValue    "lev"
    kDelayComp   cabbageGetValue    "DelayComp"
    kGraphOnOff  cabbageGetValue    "GraphOnOff"

    if kinput==1 then
     ainL        inch               1
     if kchannels==1 then
     ainR        =                  ainL
     else
     ainR        inch               2
     endif
    else
     ainL         poscil             0.2,220,giWfm
     ainR         =                  ainL    
    endif
    
    ainL         =                  ainL * klev
    ainR         =                  ainR * klev

    /* SET FFT ATTRIBUTES */
    kFFT        cabbageGetValue     "FFT"
    kFFT        init                4
    if changed:k(kFFT)==1 then
                reinit              update
    endif
    update:
    iFFT         =                  2 ^ (i(kFFT) + 6)
    aoutL,foutL  pvswarp_module     ainL,kscal,kshift,kfeedback,kmix,iFFT,i(kDelayComp)
    aoutR,foutR  pvswarp_module     ainR,kscal,kshift,kfeedback,kmix,iFFT,i(kDelayComp)
                 cabbageSet         "ampFFT", "sampleRange", 0, iFFT / 2
    rireturn
                 outs               aoutL,aoutR
                 
 ; SPECTRUM OUT GRAPH
 if kGraphOnOff==1 then
 fBlur            pvsblur             foutL, 0.2  ,0.2
 iTabLen          =                   (iFFT / 2) + 1
 ipvsTab          ftgen               98, 0, iTabLen, 2, 0                ; initialise table
 idispTab         ftgen               99, 0, 1024, 2, 0                   ; initialise table
 kClock           metro               8                                   ; reduce rate of updates
 if  kClock==1 then                                                       
  kflag           pvsftw              fBlur, 98                           ; write envelope to function table
  reinit CREATE_DISP_TAB
 endif
 CREATE_DISP_TAB:
 idispTab         ftgen               99, 0, 1024, 18, 98, 1, 0, 1023     ; create display table
                  rireturn
 
                  cabbageSet          kClock, "ampFFT", "tableNumber", idispTab 
 endif

 if trigger:k(kGraphOnOff,0.5,1)==1 then
  reinit CLEAR_TABLE
 endif
 CLEAR_TABLE:
 idispTab         ftgen               99, 0, 1024, 7, 0,1024,0     ; create display table
                  cabbageSet          "ampFFT", "tableNumber", idispTab  
 rireturn
 
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
