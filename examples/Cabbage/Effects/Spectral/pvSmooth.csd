
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; pvSmooth.csd
; Written by Iain McCurdy, 2012.
; FFT feedback is disabled if amplitude smoothing is increased beyond zero. If this is not done the instrument will crash. 

; Input       -  audio input
;                1. Mono - the live audio left input is sent to both channels of the stereo effect
;                2. Stereo - the live audio stereo input is sent through a stereo effect
;                3. Chirp - a synthesised chirp sound is sent to both channels of the stereo effect
; Amp. Smooth -  smoothing of amplitudes in the streaming FFT analysis signal
; Frq. Smooth -  smoothing of frequencies in the streaming FFT analysis signal
; link        -    links 'Amp.Smooth' and 'Frq.Smooth' controls
; Feedback    -  amount of signal at the output of pvsmooth that is fed back into the input
;                 this is similar to the effect 'Amp.Smooth' and 'Frq.Smooth' being raised while linked
; FFT Size    -  size of the FFT window used by the effect. 
;                 Larger values produce better frequency resolution at the expense of time resolution.
;                 Smaller values produce better time resolution at the expense of frequency resolution.
; Delay Comp. -  a delay that is applied to the dry signal in order to align it with the latency impacted pvsmooth signal
; Level       -  gain applied to the output signal


<Cabbage>
form caption("pvSmooth") size(585,130), pluginId("smoo"), colour("Black") guiMode("queue")
image            bounds(0, 0, 585,130), colour("Cream"), outlineColour("silver"), outlineThickness(5)
#define SLIDER_DESIGN textColour(138, 54, 15), fontColour(138, 54, 15), colour("chocolate"), trackerColour(138, 54, 15), popupText(0), valueTextBox(1)
label pos(-45, -28), size(675, 190), fontColour(210,105, 30, 60), text("smooth"), shape("rounded"), outlineColour("white"), outlineThickness(4)
label    bounds( 15, 30, 70, 13), text("Input"), fontColour(138, 54, 15)
combobox bounds( 15, 45, 70, 20), text("Mono","Stereo","Chirp"), channel("input"), value(2), fontColour(255,255,200)
rslider  bounds( 90, 18, 75, 95), text("Amp.Smooth"), channel("acf"), range(0,1.00,0,16,0.0001), $SLIDER_DESIGN
checkbox bounds(150,  8, 70, 10), channel("link"), text("Link"), fontColour:0(138, 54, 15), fontColour:1(138, 54, 15), colour("red")
image    bounds(155, 60, 25,10), colour(60,60,60), channel("linkBlock"), visible(0)
rslider  bounds(170, 18, 75, 95), text("Frq.Smooth"), channel("fcf"), range(0,1.00,0,16,0.0001), $SLIDER_DESIGN
rslider  bounds(250, 18, 75, 95), text("Feedback"), channel("FB"), range(0,1), $SLIDER_DESIGN
label    bounds(330, 30, 70, 13), text("FFT Size"), fontColour(138, 54, 15)
combobox bounds(330, 45, 70, 20), text("128","256","512","1024","2048","4096","8192","16384"), channel("FFT"), value(4), fontColour(255,255,200)
checkbox bounds(330, 70, 90, 12), channel("delay"), text("Delay Comp."), fontColour:0(138, 54, 15), fontColour:1(138, 54, 15), colour("red")
rslider  bounds(410, 18, 75, 95), text("Mix"), channel("mix"), range(0, 1.00, 1), $SLIDER_DESIGN
rslider  bounds(490, 18, 75, 95), text("Level"), channel("lev"), range(0, 1.00, 0.5), $SLIDER_DESIGN
label    bounds(  5,115,203, 12), text("Iain McCurdy |2012|"), align("left"), fontColour("darkGrey")
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-dm0 -n
</CsOptions>
<CsInstruments>

; sr set by host
ksmps        =    32
nchnls       =    2
0dbfs        =    1    ;MAXIMUM AMPLITUDE

;Iain McCurdy
;http://iainmccurdy.org/csound.html
;Spectral smoothing effect.

opcode    pvsmooth_module,a,akkkkkii
    ain,kacf,kfcf,kfeedback,kmix,klev,iFFT,idelay    xin
    f_FB        pvsinit  iFFT,iFFT/4,iFFT,1, 0                             ; INITIALISE FEEDBACK FSIG
    f_anal      pvsanal  ain, iFFT,iFFT/4,iFFT,1                           ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    f_mix       pvsmix   f_anal, f_FB                                      ; MIX AUDIO INPUT WITH FEEDBACK SIGNAL
    f_smooth    pvsmooth f_mix, kacf, kfcf                                 ; BLUR AMPLITUDE AND FREQUENCY VALUES OF AN F-SIGNAL
    f_FB        pvsgain  f_smooth, kfeedback                               ; CREATE FEEDBACK F-SIGNAL FOR NEXT PASS
    aout        pvsynth  f_smooth                                          ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
    if idelay==1 then
     ain        delay    ain,(iFFT)/sr
    endif
    amix        ntrpol   ain, aout, kmix                                   ; CREATE DRY/WET MIX
                xout     amix*klev
endop

instr    1
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
     ainL        poscil             aEnv*0.2, aCPS
     ainR        =                  ainL
    endif
    
    kdelay      cabbageGetValue    "delay"
    kfeedback   cabbageGetValue    "FB"
    kacf,kT1    cabbageGetValue    "acf"
    kfcf,kT2    cabbageGetValue    "fcf"
    klink       cabbageGetValue    "link"
    if klink==1 then
     cabbageSetValue "fcf",kacf,kT1
     cabbageSetValue "acf",kfcf,kT2
    endif
                cabbageSet         changed:k(klink), "linkBlock", "visible", klink
    kfeedback   =                  (kacf>0?0:kfeedback)        ; feedback + amplitude smoothing can cause failure so we must protect against this
    kacf        =                  1-kacf
    kfcf        =                  1-kfcf
    kporttime   linseg             0,0.001,0.02
    kmix        cabbageGetValue    "mix"
    klev        cabbageGetValue    "lev"
    kFFT        cabbageGetValue    "FFT"
    kFFT        init      4
    if changed:k(kFFT)==1 then
     reinit update
    endif
    update:
    aoutL       pvsmooth_module    ainL,kacf,kfcf,kfeedback,kmix,klev,2^(i(kFFT)+6),i(kdelay)
    aoutR       pvsmooth_module    ainR,kacf,kfcf,kfeedback,kmix,klev,2^(i(kFFT)+6),i(kdelay)
                outs               aoutL,aoutR
endin

</CsInstruments>

<CsScore>
i 1 0 [60*60*24*7]
</CsScore>

</CsoundSynthesizer>