
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Exciter.csd
; Written by Iain McCurdy, 2015, 2024.
                
; An exciter is a device that uses harmonic distortion to add a high frequency shimmer to a signal. It is a common tool in mastering.
; Csound includes an opcode called 'exciter' which is an implementation of the 'Calf' exciter plugin. 
; 'Frequency' and 'Ceiling' define the frequency range across which harmonics will be created.      
; We also have control over the amount of harmonics created and the blend between the 2nd and 3rd order harmonics. 
; The effect of these parameters is subtle and the user might find it useful to at first set 'Dry/Wet Mix' to maximum (100% wet) in order to hear the effect more clearly.

; In addition to options to process the live audio input, a sine tone generator and white noise can be used to test the response of the exciter.
;  The spectrogram can be useful in reveling the harmonic additions.

; Input      -  audio input:
;                1. Mono (left live audio input)
;                2. Stereo (stereo live audio input)
;                3. Test Sine Tone
;                4. White Noise

; Frequency  -   the frequency above which the exciter will create distortion artefacts
; Ceiling    -   the upper end of the harmonics created
; Harmonics  -   amount of harmonics. 
; Blend      -   blend between 2nd and 3rd order harmonics in the range. Negative values will favour odd numbered harmonics.
; Mix        -   mix between the dry and wet signals
; Level      -   output level (post spectrogram)

; T E S T    S I G N A L
; Amp        -   amplitude of the sine tone/white noise generators
; Freq.      -   frequency of the sine tone

; S P E C T R O G R A M
; Display On/Off  -  turn the spectrogram on/off
; Gain            -  signal gain for the spectrgram. Useful for revealing low-amplitude detail
; Size            -  FFT size - affects scaling of the spectrum display. Note that the frequency values shown are generally misleading.
; Max             -  max FFT bin to be used in the spectrum display - affects scaling of the spectrum display. Note that the frequency values shown are generally misleading.
            
<Cabbage>
form caption("Exciter") size(600, 437), pluginId("exci"), guiMode("queue")
image           bounds(0, 0, 600, 437), colour(80,80,100), shape("rounded"), outlineColour("white"), outlineThickness(6)

#define  SLIDER_STYLE markerColour("white"), colour(100,100,120), trackerColour("Silver"), trackerInsideRadius(0.7), markerThickness(0.4), valueTextBox(1)

image       bounds(  10, 10,580,135), colour(0,0,0,0), outlineColour("silver"), outlineThickness(2), corners(5)
{
label    bounds(  0,  4,580, 16), text("E  X  C  I  T  E  R")
label    bounds( 10, 40, 80, 15), text("Input"), align("centre")
combobox bounds( 10, 55, 80, 20), channel("Input"), items("Mono","Stereo","Sine Tone","Noise"), value(2)
rslider  bounds(100, 25, 80,100), text("Frequency"), channel("freq"), range(1,20000,3000,0.5,1), $SLIDER_STYLE
rslider  bounds(180, 25, 80,100), text("Ceiling"), channel("ceil"), range(20,20000,20000,0.5,1), $SLIDER_STYLE
rslider  bounds(260, 25, 80,100), text("Harmonics"), channel("harms"), range(0.1,10.00,10), $SLIDER_STYLE
rslider  bounds(340, 25, 80,100), text("Blend"), channel("blend"), range(-10,10,10,1,0.0001), $SLIDER_STYLE
rslider  bounds(420, 25, 80,100), text("Mix"), channel("mix"), range(0, 1.00, 0.5), $SLIDER_STYLE
rslider  bounds(500, 25, 80,100), text("Level"), channel("level"), range(0,20, 0.2, 0.5), $SLIDER_STYLE
}

; spectroscope
signaldisplay bounds(  10,150,580,130), colour("LightBlue"), alpha(0.85), displayType("spectroscope"), backgroundColour(20,20,20), fontColour("lime"), zoom(-1), signalVariable("asig"), channel("displaySS")

image    bounds( 10,285,215,135), colour(0,0,0,0), outlineColour("silver"), outlineThickness(2), corners(5)
{
label    bounds(  0,  4,215, 16), text("T  E  S  T     S  I  G  N  A  L")
rslider  bounds( 25, 25, 80,100), text("Amp."), channel("TTAmp"), range(0,1,0.5,0.5), $SLIDER_STYLE
rslider  bounds(115, 25, 80,100), text("Freq."), channel("TTFreq"), range(5,8000,440,0.5,1), $SLIDER_STYLE
}

image    bounds(230,285,360,135), colour(0,0,0,0), outlineColour("silver"), outlineThickness(2), corners(5)
{
label    bounds(  0,  4,360, 16), text("S  P  E  C  T  R  O  G  R  A  M")
checkbox bounds( 20, 30, 90, 15), channel("DisplayOnOff"), text("On/Off"), value(1)
rslider  bounds(100, 25, 80,100), text("Gain"), channel("DispGain"), range(0,20.00,1,0.5), $SLIDER_STYLE
rslider  bounds(180, 25, 80,100), text("Size"), channel("Size"), range(10,14,12,1,1), $SLIDER_STYLE
rslider  bounds(260, 25, 80,100), text("Max."), channel("Max"), range(10,1200,700,1,1), $SLIDER_STYLE
}

label    bounds( 10,422,120, 10), text("Iain McCurdy |2015|"), align("left"), fontColour("white")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -dm0 -+rtmidi=NULL --displays
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32
nchnls             =                   2
0dbfs              =                   1

instr 1
 kporttime         linseg              0, 0.001, 0.05                      ; ramping up value used for portamento time                                                   
 kfreq             cabbageGetValue     "freq"                              ; read in widgets
 kfreq             portk               kfreq, kporttime
 kceil             cabbageGetValue     "ceil"
 kceil             portk               kceil, kporttime
 kharms            cabbageGetValue     "harms"
 kblend            cabbageGetValue     "blend"
 klevel            cabbageGetValue     "level"
 kmix              cabbageGetValue     "mix"
 kmix              portk               kmix, kporttime
 klevel            portk               klevel, kporttime
 
 ; audio input
 kInput            cabbageGetValue     "Input"
 if kInput==1 then
  a1               inch                1
  a2               =                   a1
 elseif kInput==2 then
  a1,a2            ins
 elseif kInput==3 then
  kTTAmp           cabbageGetValue     "TTAmp"
  kTTFreq          cabbageGetValue     "TTFreq"
  a1               poscil              kTTAmp, kTTFreq
  a2               =                   a1
 else
  a1               noise               kTTAmp, 0 ; kTTFreq
  a2               noise               kTTAmp, 0 ; kTTFreq
 endif
  
 ; exciter
 aE1               exciter             a1, kfreq, kceil, kharms, kblend
 aE2               exciter             a1, kfreq, kceil, kharms, kblend

 ; mixer
 a1                ntrpol              a1, aE1, kmix                      ; dry/wet mix
 a2                ntrpol              a2, aE2, kmix
                   outs                a1 * klevel, a2 * klevel           ; send to outputs and apply amplitude level control

 ; Spectroscope
 kDisplayOnOff     cabbageGetValue     "DisplayOnOff"
 if kDisplayOnOff==0 kgoto SKIP
 kDispGain         cabbageGetValue     "DispGain"
 kSize             cabbageGetValue     "Size"
 kSize             init                10
 kMax              cabbageGetValue     "Max"
 if changed:k(kSize,kMax)==1 then
                   reinit              RESTART
 endif
 RESTART:
 iSize             =                   2 ^ i(kSize)
 asig              =                   (a1 + a2) * kDispGain
 ;                 dispfft             xsig, iprd,  iwsiz [, iwtyp] [, idbout] [, iwtflg] [,imin] [,imax] 
                   dispfft             asig, 0.01, iSize,      1,        0,         0,     0,    i(kMax)
 rireturn
 SKIP:
 
endin

</CsInstruments>

<CsScore>                                              
i 1 0 z
</CsScore>

</CsoundSynthesizer>