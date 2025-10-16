
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Dust.csd
; Written by Iain McCurdy, 2013.

; A simple encapsulation of the 'dust' and 'dust2' opcodes.
; Added features are stereo panning (spread) of the dust, a random tonal variation (lowpass filter with jumping cutoff frequency) and constant low and highpass filters.

<Cabbage>
form               size(410,198), caption("Dust"), pluginId("dust"), guiMode("queue")
#define RSLIDER_DESIGN   textColour("white"), colour(85, 70, 70), outlineColour(155,100,100), trackerColour(220,210,210), markerColour("silver")
image    bounds(  0,  0,410,198), colour(105, 100, 100), shape("sharp"), outlineColour("white"), outlineThickness(2) 
checkbox bounds( 10, 20, 60, 15), text("On/Off"), channel("onoff"), value(0), fontColour:0("white"), fontColour:1("white")
combobox bounds( 10, 40, 60, 18), text("dust","dust2"), channel("opcode"), value(2)
rslider  bounds( 70, 20, 60, 60), text("Amplitude"), channel("amp"),     range(0, 100.00, 0.5, 0.5, 0.001), $RSLIDER_DESIGN
rslider  bounds(125, 20, 60, 60), text("Freq."),     channel("freq"),    range(0.1, 20000, 500, 0.5, 0.01), $RSLIDER_DESIGN
rslider  bounds(180, 20, 60, 60), text("Spread"),    channel("spread"),  range(0, 1.00, 1), $RSLIDER_DESIGN
rslider  bounds(235, 20, 60, 60), text("Tone Var."), channel("ToneVar"), range(0, 1.00, 0), $RSLIDER_DESIGN
rslider  bounds(290, 20, 60, 60), text("Lowpass"),   channel("LPF"),     range(20,20000,20000,0.5), $RSLIDER_DESIGN
rslider  bounds(345, 20, 60, 60), text("Highpass"),  channel("HPF"),     range(20,20000,20,0.5), $RSLIDER_DESIGN
gentable bounds( 55, 90,350, 95), tableNumber(11), channel("table1"), ampRange(-1,1,-1), fill(1), outlineThickness(0), tableColour("yellow"), zoom(-1), tableGridColour(0,0,0,0)
image    bounds( 55,137,350,  1), colour("yellow"), alpha(0.3)
rslider  bounds(  5, 90, 45, 45), text("Scan"), channel("Scan"), range(0.25, 32, 16, 0.5, 0.01), $RSLIDER_DESIGN
rslider  bounds(  5,135, 45, 45), text("Refresh"), channel("Refresh"), range(1, 64, 16), $RSLIDER_DESIGN
label    bounds(  4,186, 110, 11), text("Iain McCurdy |2013|"), fontColour("silver"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   64
nchnls             =                   2
0dbfs              =                   1    ; MAXIMUM AMPLITUDE
massign  0, 0

i_                 ftgen               11, 0, 1024, 10, 1
iCnt = 0
while iCnt<ftlen(11) do
                   tablew              0, iCnt, 11
iCnt               +=                  1
od
instr    1
konoff             cabbageGetValue     "onoff"        ; read in on/off switch widget value
if konoff==0 goto SKIP                                ; if on/off switch is off jump to 'SKIP' label
kamp               cabbageGetValue     "amp"
kopcode            cabbageGetValue     "opcode"
kfreq              cabbageGetValue     "freq"
kspread            cabbageGetValue     "spread"
if kopcode==2 then
asig               dust2               kamp, kfreq    ; GENERATE 'dust2' IMPULSES
else
asig               dust                kamp, kfreq    ; GENERATE 'dust' IMPULSES
endif

; tone variation
kToneVar           cabbageGetValue     "ToneVar"
if(kToneVar>0) then
  kcfoct           random              14 - (kToneVar * 10),14
 asig              tonex               asig, cpsoct(kcfoct), 1
endif

kpan               random              0.5 - (kspread*0.5), 0.5 + (kspread * 0.5)
asigL,asigR        pan2                asig, kpan

kporttime          linseg              0, 0.001, 0.05

; Lowpass Filter
kLPF               cabbageGetValue     "LPF"
if kLPF<20000 then
 kLPF              portk               kLPF, kporttime
 asigL             clfilt              asigL, kLPF, 0, 2
 asigR             clfilt              asigR, kLPF, 0, 2
endif

; Highpass Filter
kHPF               cabbageGetValue     "HPF"
if kHPF>20 then
 kHPF              limit               kHPF, 20, kLPF
 kHPF              portk               kHPF, kporttime
 asigL             clfilt              asigL, kHPF, 1, 2
 asigR             clfilt              asigR, kHPF, 1, 2
endif

                   outs                asigL, asigR                    ; SEND AUDIO SIGNAL TO OUTPUT
aPtr               phasor              cabbageGetValue:k("Scan")
                   tablew              asigL, aPtr, 11, 1
                   cabbageSet          metro:k(cabbageGetValue:k("Refresh")), "table1", "tableNumber", 11

SKIP:                             ; A label. Skip to here is on/off switch is off 
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>