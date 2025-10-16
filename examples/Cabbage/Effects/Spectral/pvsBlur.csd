
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; pvsBlur.csd
; Written by Iain McCurdy, 2012.

; Input       -  audio input
;                1. Mono - the live audio left input is sent to both channels of the stereo effect
;                2. Stereo - the live audio stereo input is sent through a stereo effect
;                3. Chirp - a synthesised chirp sound is sent to both channels of the stereo effect
; FFT Size    -  size of the FFT window used by the effect. 
;                 Larger values produce better frequency resolution at the expense of time resolution.
;                 Smaller values produce better time resolution at the expense of frequency resolution.
; Input Gain  -  gain applied to the input audio (all input options)
; Mix         -  mix between the dry and wet (blurred) signals
; Level       -  gain applied to the output signal
; Blur Time   -  duration across which streaming amplitude and frequency data will be blurred

<Cabbage>
form caption("pvsBlur"), size(390,145) colour( 70, 90,100), pluginId("blur"), guiMode("queue")
#define  SLIDER_STYLE valueTextBox(1), textColour("white"), fontColour("white"), colour( 30, 50, 60),trackerColour("white")
image    bounds(  0,  0,390,145), colour( 70, 90,100), shape("rounded"), outlineColour("white"), outlineThickness(5) 
label    bounds( 15, 20, 70, 14), text("INPUT"), fontColour("white")
listbox  bounds( 15, 35, 70, 60), items("Mono","Stereo","Chirp"), align("centre"), value(2), channel("input")
label    bounds(100, 20, 60, 13), text("FFT Size"), fontColour("white")
combobox bounds(100, 35, 60, 20), text("128","256","512","1024","2048","4096","8192"), channel("FFT"), value(4), fontColour(220,220,255)
rslider  bounds(165, 10, 70, 90), text("Input Gain"), channel("InGain"), range(0, 1.00, 1,0.5), $SLIDER_STYLE
rslider  bounds(235, 10, 70, 90), text("Mix"), channel("mix"), range(0, 1.00, 1), $SLIDER_STYLE
rslider  bounds(305, 10, 70, 90), text("Level"), channel("lev"), range(0, 1.00, 0.5, 0.5), $SLIDER_STYLE
hslider  bounds( 10,100,365, 40), text("Blur Time"), channel("blurtime"),  range(0, 5.00, 0.0, 0.5, 0.0001), $SLIDER_STYLE
label    bounds(  4,131,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-d -n
</CsOptions>
<CsInstruments>

; sr is set by host
ksmps        =     64
nchnls       =     2
0dbfs        =     1    ;MAXIMUM AMPLITUDE

; Author: Iain McCurdy (2012)
; http://iainmccurdy.org/csound.html

opcode    pvsblur_module,a,akkki
    ain,kblurtime,kmix,klev,iFFT    xin
    f_anal      pvsanal    ain, iFFT, iFFT/4, iFFT, 1        ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    f_blur      pvsblur    f_anal, kblurtime, 5.1            ; BLUR AMPLITUDE AND FREQUENCY VALUES OF AN F-SIGNAL
    aout        pvsynth    f_blur                            ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
    amix        ntrpol     ain, aout, kmix                   ; CREATE DRY/WET MIX
                xout       amix*klev    
endop

instr    1
    kblurtime   cabbageGetValue    "blurtime"
    kInGain     cabbageGetValue    "InGain"
    kmix        cabbageGetValue    "mix"
    klev        cabbageGetValue    "lev"
    kinput      cabbageGetValue    "input"
    
    if kinput==1 then     ; mono
     ainL       inch               1
     ainR       =                  ainL
    elseif kinput==2 then ; stereo
     ainL,ainR  ins
    else                  ; chirp
     if metro:k(0.3)==1 then
      reinit RESTART_CHIRP
     endif
     RESTART_CHIRP:
     aEnv        expon              1,  1, 0.01
     aCPS        expon              5000, 1, 50
     rireturn
     ainL        poscil             aEnv*0.1, aCPS
     ainR        =                  ainL
    endif
    
    ainL         *=        a(kInGain)
    ainR         *=        a(kInGain)
    
    kporttime    linseg    0,0.001,0.02
    kblurtime    portk     kblurtime,kporttime

    /* SET FFT ATTRIBUTES */
    kFFT        cabbageGetValue    "FFT"
    kFFT        init             4
    ktrig       changed    kFFT
    if ktrig==1 then
     reinit update
    endif
    update:    
    aoutL        pvsblur_module    ainL,kblurtime,kmix,klev,2^(i(kFFT)+6)
    aoutR        pvsblur_module    ainR,kblurtime,kmix,klev,2^(i(kFFT)+6)
    rireturn
                outs    aoutL,aoutR
endin

</CsInstruments>

<CsScore>
i 1 0 [60*60*24*7]
</CsScore>

</CsoundSynthesizer>