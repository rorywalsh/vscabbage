
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; BandFilter.csd
; Written by Iain McCurdy, 2012.

; A selection of bandpass/bandreject filters whose centre frequencies and bandwidths are controllable from and XY pad.
; XY Pad      -  X = centre frequency, Y = bandwidth
; Balance     -  balances input and output levels to prevent excessive power loss as a result of filtering
; Test        -  replaces the live input signal with a white noise signal for testing the filter
; Filter Type -  choose between:
;                                reson (band-pass)
;                                butterworth (band-pass), 
;                                areson (band-reject)
;                                butterworth (band-reject)
;                                bqrez (2nd order band-reject)
;                                spf (linear Steiner-Parker filter, 2nd order band-pass)
;                                svn (non-linear band-pass)
;                                zdf_2pole 1 (Zero-delay feedback 2-pole filter, 12dB/oct. band-pass)
;                                zdf_2pole 2 (Zero-delay feedback 2-pole filter, 12dB/oct. unity gain band-pass)
;                                zdf_2pole 3 (Zero-delay feedback 2-pole filter, 12dB/oct. peak)
 
; Mix         -  mix between dry (unfiltered) and wet (filtered) signals
; Level       -  output level control

<Cabbage>
form caption("Band Filter"), colour(70,70,70), size(490,430), pluginId("band"), guiMode("queue") 
xypad bounds(5, 5, 350, 350), channel("cf", "bw"), rangeX(0, 1, 0.5), rangeY(0, 1, 0.3), text("x:cutoff | y:bandwidth"), colour(40,40,50)

hslider bounds( 15,356,330, 10), channel("cfS"), range(0,1) ; cutoff
vslider bounds(356, 15, 10,285), channel("bwS"), range(0,1) ; bandwidth

image bounds(375, 10,120,360), colour(0,0,0,0)
{
checkbox bounds(  0,  0,120, 15), channel("balance"), fontColour:0("white"), fontColour:1("white"),  value(0), text("Balance")
checkbox bounds(  0, 20,120, 15), channel("test"), fontColour:0("white"), fontColour:1("white"),  value(0), text("Test (w. noise)")

label    bounds(  5,  45, 95, 13), text("Filter Type"), fontColour("white"), align("centre")
combobox bounds(  5,  60, 95, 20), channel("type"), value(1), text("reson","butterbp","areson","butterbr","bqrez","spf","svn","zdf_2pole 1","zdf_2pole 2","zdf_2pole 3")

rslider bounds(  8, 95, 90, 90), text("Mix"),       colour(27,59,59),trackerColour(127,159,159),textColour("white"),fontColour("white"),        channel("mix"),     range(0, 1.00, 1), markerColour("white")
rslider bounds(  8,195, 90, 90), text("Level"),     colour(27,59,59),trackerColour(127,159,159),textColour("white"),fontColour("white"),        channel("level"),   range(0, 1.00, 1), markerColour("white")

nslider  bounds(  0,300, 50, 30), text("CF (Hz.)"), textColour("white"), channel("cfDisp"), range(1, 20000, 1, 1, 1)
nslider  bounds( 55,300, 50, 30), text("BW (Hz.)"), textColour("white"), channel("bwDisp"), range(1, 20000, 1, 1, 1)
}



image bounds( 5, 370, 480, 45), colour(30,30,40), channel("enclosure")
{
;signaldisplay bounds(  0, 0,480,45), colour("LightBlue"), alpha(0.85), displayType("spectroscope"), backgroundColour("Black"), zoom(-1), signalVariable("aSig", "a2z"), channel("display");, fontColour(0,0,0,0)
image bounds( 0,0,1,35), channel("bandImg"), alpha(0.35), colour("yellow")
}

label bounds(  6,369, 40, 12), text("20 Hz"), align("left")
label bounds(444,369, 40, 12), text("18 kHz"), align("right")

label    bounds(  5,416,110, 12), text("Iain McCurdy |2012|"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
; --displays
</CsOptions>

<CsInstruments>
;sr is set by host
ksmps   =   32
nchnls  =   2
0dbfs   =   1

; Author: Iain McCurdy (2012)

instr   1
 kporttime    linseg               0, 0.001, 0.05
 kcf,kT       cabbageGetValue      "cf"
              cabbageSetValue     "cfS", kcf, kT
 kbw,kT       cabbageGetValue      "bw"
              cabbageSetValue     "bwS", kbw, kT
 kcf          cabbageGetValue      "cfS"
 kbw          cabbageGetValue      "bwS"


 kcf          portk                kcf, kporttime
 kbw          portk                kbw, kporttime
 kres         =                    kbw        ; 0 to 1, converted further below as required 
 kbalance     cabbageGetValue      "balance"
 ktest        cabbageGetValue      "test"
 ktype        cabbageGetValue      "type"	
 kmix         cabbageGetValue      "mix"
 klevel       cabbageGetValue      "level"

 ; shape and rescale cutoff frequency control
 kcf          expcurve             kcf, 4
 kcf          scale                kcf, 18000, 20

 ; shape and rescale bandwidth frequency control
 kbw          expcurve             kbw, 16
 kbw          scale                kbw, 3,0.01

 ; print bandpass region as a coloured block
 iBounds[]    cabbageGet           "enclosure", "bounds"
 kX           =                    (kcf - 20 - (kbw * kcf)/2) / (18000 - 20) * (iBounds[2])
 kEnd         =                    (kcf - 20 + (kbw * kcf)/2) / (18000 - 20) * (iBounds[2])
 kWid         limit                kEnd - kX, 1, iBounds[2]
              cabbageSet           changed:k(kcf,kbw), "bandImg", "bounds", kX, 0, kWid, iBounds[3] 

 
 if ktest==1 then
  aL          noise                0.5, 0
  aR          noise                0.5, 0
 else
  aL,aR       ins
 endif
 
 kbw          limit                kbw * kcf, 1, 20000
 
              cabbageSetValue      "cfDisp", kcf
              cabbageSetValue      "bwDisp", kbw

 if ktype==1 then                                         ; if reson chosen...
  aFiltL      reson                aL, kcf, kbw,1
  aFiltR      reson                aR, kcf, kbw,1
 elseif ktype==2 then                                     ; or if butterworth bandpass is chosen
  aFiltL      butbp                aL, kcf, kbw
  aFiltR      butbp                aR, kcf, kbw
 elseif ktype==3 then                                     ; or if areson  is chosen...
  aFiltL      areson               aL, kcf, kbw, 1
  aFiltR      areson               aR, kcf, kbw, 1
 elseif ktype==4 then
  aFiltL      butbr                aL, kcf, kbw
  aFiltR      butbr                aR, kcf, kbw
 elseif ktype==5 then
  aFiltL      bqrez                aL, a(kcf), a(1 + ((1-kres)^10 * 99)), 2               ; bandpass
  aFiltR      bqrez                aR, a(kcf), a(1 + ((1-kres)^10 * 99)), 2
 elseif ktype==6 then
  aFiltL      spf                  a(0),a(0),aL, a(kcf), a(kres*2)
  aFiltR      spf                  a(0),a(0),aR, a(kcf), a(kres*2)
 elseif ktype==7 then
  kdrive  = 0.125
  ahp,alp,aFiltL,abr svn           aL, a(kcf), 0.5+(1-kres)^5*7, kdrive
  ahp,alp,aFiltR,abr svn           aR, a(kcf), 0.5+(1-kres)^5*7, kdrive
 elseif ktype==8 then
  aFiltL      zdf_2pole            aL, a(kcf), a(0.5 + ((1-kres)^3 * 24.5)), 2 ; band-pass 
  aFiltR      zdf_2pole            aR, a(kcf), a(0.5 + ((1-kres)^3 * 24.5)), 2
 elseif ktype==9 then
  aFiltL      zdf_2pole            aL, a(kcf), a(0.5 + ((1-kres)^3 * 24.5)), 3 ; unity-gain band-pass 
  aFiltR      zdf_2pole            aR, a(kcf), a(0.5 + ((1-kres)^3 * 24.5)), 3
 elseif ktype==10 then
  aFiltL      zdf_2pole            aL, a(kcf), a(0.5 + ((1-kres)^3 * 24.5)), 6 ; peak
  aFiltR      zdf_2pole            aR, a(kcf), a(0.5 + ((1-kres)^3 * 24.5)), 6
 endif
 
 ; balancing
 if kbalance==1 then     ;if 'balance' switch is on...
  aFiltL      balance              aFiltL, aL, 0.3   
  aFiltR      balance              aFiltR, aR, 0.3
 endif
 
 ; mixing
 amixL        ntrpol               aL, aFiltL, kmix               ; create wet/dry mix
 amixR        ntrpol               aR, aFiltR, kmix
 amixL        *=                   klevel
 amixR        *=                   klevel
              outs                 amixL, amixR
              
/*              
; spectroscope
;kSpecGain          cabbageGetValue     "SpecGain"
aSig               sum                 amixL, amixR ; mix left and right channels
aSig               *=                  10
;                  dispfft             xsig, iprd,  iwsiz [, iwtyp] [, idbout] [, iwtflg] [,imin] [,imax] 
                   dispfft             aSig, 0.001, 4096,      1,        0,         0,       0,      512
*/

endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>