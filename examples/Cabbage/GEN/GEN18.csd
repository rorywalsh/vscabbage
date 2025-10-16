
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN18.csd
; Written by Iain McCurdy, 2024

; GEN18 facilitates concatenation and layering of any number of preexisting function tables.
; This invites numerous uses; in this example three waveforms are mixed.
; The first two are concatenated and are each defined as a number of sinusoid cycles (resolution 0.5). 
; The point of concatenation can be moved using the 'Point of Division' slider.
; The third waveform is mixed with the first two and is always stretched across the full duration of the GEN18 function table.
; This third waveform is created using GEN11 (similar to gbuzz opcode) and faciliates control of 'lowest harmonic', 'number of harmonics' and 'power' (spectral envelope emphasis)

; Split Point

; W A V E F O R M   1
; Amp. 1         -  amplitude of the waveform
; Repeats 1      -  number of repeats of s sinusoidal waveform
; Inv.           -  invert polarity of waveform

; W A V E F O R M   2
; Amp. 2         -  amplitude of the waveform
; Repeats 2      -  number of repeats of s sinusoidal waveform
; Inv.           -  invert polarity of waveform

; W A V E F O R M   3
; Amp. 3         -  amplitude of the waveform
; Num. Harms 3   -  (integer) number of harmonics in the waveform
; Lowest. Harm 3 -  (integer) number of harmonics in the waveform
; Power          -  a control of the spectral peak of the harmonic waveform

; O C S I L L A T O R
; Freq.          -  frequency of the oscillator that plays the GEN18 waveform
; Amp.           -  ampliude of the oscillator that plays the GEN18 waveform

; E F F E C T S 
; Chorus         -  on/off of a chorus effect applied to the output sound (no further user controls)  
; Delay          -  on/off of a delay effect applied to the output sound (no further user controls)  
; Reverb         -  on/off of a reverb effect applied to the output sound (no further user controls)  

<Cabbage>
form caption("GEN18"), size(420, 763), pluginId("gn18"), colour("Black"), colour(30,30,30), guiMode("queue")

#define RSLIDER_DESIGN0 colour(230,230,230) trackerColour(230,230,230)
#define RSLIDER_DESIGN1 colour(255,220,240) trackerColour(255,220,240)
#define RSLIDER_DESIGN2 colour(180,180,255) trackerColour(180,180,255)

gentable bounds( 10,  5,400,120), tableNumber(1), tableColour("LightBlue"), ampRange(-1,1,1), channel("table1"), fill(0)
image    bounds( 10, 65,400,  1), colour(255,255,255,100)
image    bounds(200,  0,  1,125), channel("wiper"), colour("yellow")
hslider bounds(  5,125,410, 30), channel("div"), range(0,1,0.3)

vslider  bounds( 10,150, 20, 85), channel("DispGain"), range(1,200,35,0.5)
gentable bounds( 30,155,380, 70), tableNumber(101), channel("DispFFT"), outlineThickness(1), tableColour(200,0,  0,200), tableBackgroundColour("white"), tableGridColour(100,100,100,50), ampRange(0,1,101), outlineThickness(0), fill(1), sampleRange(0, 128)

image   bounds( 10,235,195, 160) colour(0,0,0,0) outlineThickness(1)
{
label    bounds(  0,  3,195, 13) text("W A V E F O R M   1 (GEN09)") align("centre")
checkbox bounds( 10, 45, 40, 15), channel("on1") text("On") value(1)
checkbox bounds( 10, 75, 70, 15), channel("inv1") text("Inv.")
rslider  bounds( 50, 20, 70, 90), channel("str1"), text("Amp. 1"), textBox(1), valueTextBox(1), range(0, 1, 0.2, 0.5), $RSLIDER_DESIGN1
rslider  bounds(120, 20, 70, 90), channel("pn1"), textBox(1), text("Repeats 1"), range(0.5, 100, 11,1,0.5), valueTextBox(1), $RSLIDER_DESIGN2
gentable bounds(  5,115,185, 40), tableNumber(2), tableColour("White"), ampRange(-1,1,2), channel("table2"), fill(0)
image    bounds(  5,135,185,  1), colour(255,255,255,100)
}

image   bounds(215,235,195, 160) colour(0,0,0,0) outlineThickness(1)
{
label    bounds(  0,  3,195, 13) text("W A V E F O R M   2 (GEN09)") align("centre")
checkbox bounds( 10, 45, 40, 15), channel("on2") text("On") value(1)
checkbox bounds( 10, 75, 70, 15), channel("inv2") text("Inv.")
rslider  bounds( 50, 20, 70, 90), channel("str2"), text("Amp. 2"), textBox(1), valueTextBox(1), range(0, 1, 0.3, 0.5), colour(200,200,200,200), $RSLIDER_DESIGN1
rslider  bounds(120, 20, 70, 90), channel("pn2"), textBox(1), text("Repeats 2"), range(0.5, 100, 7,1,0.5), valueTextBox(1), $RSLIDER_DESIGN2
gentable bounds(  5,115,185, 40), tableNumber(3), tableColour("White"), ampRange(-1,1,3), channel("table3"), fill(0)
image    bounds(  5,135,185,  1), colour(255,255,255,100)
}

image   bounds( 10,405,400, 160) colour(0,0,0,0) outlineThickness(1)
{
label    bounds(  0,  3,400, 13) text("W A V E F O R M   3 (GEN11)") align("centre")
checkbox bounds( 10, 45, 40, 15), channel("on3") text("On") value(1)
rslider  bounds( 45, 20, 80, 90), channel("str3"), text("Amp. 3"), textBox(1), valueTextBox(1), range(0, 1, 0.6, 0.5), $RSLIDER_DESIGN1
rslider  bounds(140, 20, 80, 90), channel("nh3"), text("Num. Harms. 3"), textBox(1), valueTextBox(1), range(1, 500,100,1,1) $RSLIDER_DESIGN0
rslider  bounds(225, 20, 80, 90), channel("lh3"), text("Lowest Harm. 3"), textBox(1), valueTextBox(1), range(1, 200, 1, 1,1) $RSLIDER_DESIGN0
rslider  bounds(315, 20, 80, 90), channel("pow3"), text("Power 3"), textBox(1), valueTextBox(1), range(0, 2, 0.75) $RSLIDER_DESIGN0
gentable bounds(  5,115,385, 40), tableNumber(4), tableColour("White"), ampRange(-1,1,4), channel("table4"), fill(0)
image    bounds(  5,135,385,  1), colour(255,255,255,100)
}

image   bounds( 10,575,400, 90) colour(0,0,0,0) outlineThickness(1)
{
label   bounds(  0,  3,400, 13) text("O S C I L L A T O R") align("centre")
hslider  bounds(  8,20,395, 30), channel("Freq"), range(10,1000,100,0.5), valueTextBox(1), text("Freq.")
hslider  bounds(  8,50,395, 30), channel("Amp"), range(0,1,0.1,0.5), valueTextBox(1), text("Amp.")
}

image   bounds( 10,675,400, 70) colour(0,0,0,0) outlineThickness(1)
{
label    bounds(  0,  3,400, 13) text("E F F E C T S") align("centre")
button   bounds( 10, 30,120, 30), channel("Chorus") text("Chorus","Chorus"), latched(1), colour:0(50,50,50), colour:1(250,250, 50) fontColour:0(100,100,100) fontColour:1(0,0,0), corners(5)
button   bounds(140, 30,120, 30), channel("Delay") text("Delay","Delay"), latched(1),    colour:0(50,50,50), colour:1(250,250, 50) fontColour:0(100,100,100) fontColour:1(0,0,0), corners(5)
button   bounds(270, 30,120, 30), channel("Reverb") text("Reverb","Reverb"), latched(1), colour:0(50,50,50), colour:1(250,250, 50) fontColour:0(100,100,100) fontColour:1(0,0,0), corners(5)
}

label    bounds( 10,747,110, 12), text("Iain McCurdy |2024|"), align("left")
</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-n -dm0 -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =          32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls       =          2     ; NUMBER OF CHANNELS (1=MONO)
0dbfs        =          1     ; MAXIMUM AMPLITUDE

giTabLen  = 4096

giFFT   =                  512

instr    1
    ; read in widgets
    kPortTime linseg             0,0.001,0.05
    kpn1      cabbageGetValue    "pn1"
    kstr1     cabbageGetValue    "str1"
    kinv1     cabbageGetValue    "inv1"
    kon1      cabbageGetValue    "on1"
    kstr1     *=                 kon1 * ((kinv1 * (-2)) + 1) ; apply polarity inversion switch

    kpn2      cabbageGetValue    "pn2"
    kstr2     cabbageGetValue    "str2"
    kinv2     cabbageGetValue    "inv2"
    kon2      cabbageGetValue    "on2"
    kstr2     *=                 kon2 * ((kinv2 * (-2)) + 1) ; apply polarity inversion switch

    kdiv      cabbageGetValue    "div"    
              cabbageSet         changed:k(kdiv),"wiper","bounds",10+400*kdiv,5,1,130 ; move split-point wiper
    kdiv      limit              kdiv, 0.01, 0.99
    kdiv      portk              kdiv, kPortTime

    kstr3     cabbageGetValue    "str3"
    kon3      cabbageGetValue    "on3"
    kstr3     *=                 kon3
    knh3      cabbageGetValue    "nh3"
    knh3      init               1
    klh3      cabbageGetValue    "lh3"
    kpow3     cabbageGetValue    "pow3"

    if changed:k(kpn1,kstr1,kpn2,kstr2,kdiv,kstr3,knh3,klh3,kpow3)==1 then
              reinit             UPDATE
    endif
    UPDATE:
    ; Update function tables.
    i_        ftgen              2, 0, giTabLen, -9, i(kpn1), i(kstr1), 0       ; left side of the waveform (repeated sine wave) 
    i_        ftgen              3, 0, giTabLen, -9, i(kpn2), i(kstr2), 0       ; right side of the waveform (repeated sine wave)
    i_        ftgen              4, 0, giTabLen, 11, i(knh3), i(klh3), i(kpow3) ; underlying waveform (gbuzz-like)
    ; build a function table that is comprised of the three preceding function tables
    i_        ftgen              1, 0, giTabLen, -18, 2, 1, 0, (giTabLen*i(kdiv)) - 1,   3, 1, (giTabLen*i(kdiv)), giTabLen-1, 4,i(kstr3),0,giTabLen-1
              cabbageSet         "table1","tableNumber",1
              cabbageSet         "table2","tableNumber",2
              cabbageSet         "table3","tableNumber",3
              cabbageSet         "table4","tableNumber",4
    rireturn
    
    ; OSCILLATOR
    kFreq     cabbageGetValue    "Freq"
    kAmp      cabbageGetValue    "Amp"
    a1        poscil             kAmp, kFreq, 1
    a2        =                  a1

 ;spectrum out graph
 i_              ftgen              101, 0, giFFT/2 + 1, 2, 0
 kDispGain       cabbageGetValue    "DispGain"
 fSig            pvsanal            a1*kDispGain, giFFT, giFFT/4, giFFT, 0
 fBlur           pvsblur            fSig, 0.2, 0.2
 kClock          metro              16
 if  kClock==1 then                                   ; throttle rate of updates
  kflag          pvsftw             fBlur, 101
 endif
                 cabbageSet         kClock, "DispFFT", "tableNumber", 101
 
    ; CHORUS
    kChorus   cabbageGetValue    "Chorus"
    if kChorus==1 then
     amod1     poscil             0.001, 0.2, -1, 0
     aCho1     vdelay             a1, (amod1 + 0.002) * 1000, 0.01*1000
     a1        +=                 aCho1

     amod2     poscil             0.001, 0.2, -1, 0.5
     aCho2     vdelay             a2, (amod2 + 0.002) * 1000, 0.01*1000
     a2        +=                 aCho2
    endif

    ; DELAY
    kDelay   cabbageGetValue    "Delay"
    if kDelay==1 then
     aDly1,aDly2 init 0
     aDly1    delay    a1+aDly1*0.7, 0.633
     a1       +=       aDly1
     aDly2    delay    a2+aDly2*0.8, 0.833
     a2       +=       aDly2
    endif

    ; REVERB
    kReverb   cabbageGetValue    "Reverb"
    if kReverb==1 then
     aRvb1,aRvb2 reverbsc a1,a2,0.82,8000
     a1          +=       aRvb1*0.6
     a2          +=       aRvb2*0.6
    endif

    ; OUTPUT    
              outs               a1, a2
endin



</CsInstruments>

<CsScore>
i 1 0 3600
</CsScore>

</CsoundSynthesizer>
