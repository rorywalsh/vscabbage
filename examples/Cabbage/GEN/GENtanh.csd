
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GENtanh.csd
; Demonstration of GEN routine "tanh"
; Written by Iain McCurdy, 2023
; 
; tanh function are typically used for waveshaping so that is what is implemented here in the audio demonstration

; the arguments for the tanh GEN routine are:
; START   - starting value at the left-most location in the table
; END     - ending value at the right-most location in the table
; RESCALE - a switch that enables rescaling of the table if its maxima/minima do not touch 1/-1. This can occur if START and END are less than 1.
; LINK    - if this is activated it ensures that the "tanh" function is symmetrical by giving START and END the same value but one being the negative of the other.

; The function created is used in the waveshaping of a sine wave
; FREQ      - frequency of the sine wave
; AMP (IN)  - amplitude of the sine wave before waveshaping. It can be noticed how this acts as a brightness control when waveshaping is employed.
; AMP (OUT) - amplitude of the sine wave after waveshaping
; TONE      - turn the sine wave oscillator on or off
; DC BLOCK  - filter off DC components in the output waveform. This can be useful if the tranfer function created by "tanh" is not symmetrical. I.e. 'link' is not activated.

; A tranlucent overlay on the transfer function shows the peak to peak mapping of the input sine wave through it.
; Displays are provided for the output waveform resulting from waveshaping and a spectroscope which reveals the harmonic partial content of the output
; If the transfer function created by "tanh" is symmetrical, only odd-numbered partials are produced.
; If the transfer function is not symmetrical, even-numbered harmonics will also be produced.

<Cabbage>
form caption("GENtanh"), size(245, 655), pluginId("gnth"), colour(13, 50, 67,50), guiMode("queue")

label    bounds( 10,  5,235, 15), text("TRANSFER FUNCTION (tabh)"), align("centre")
image    bounds(  9, 22,232,122), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(10)
gentable bounds( 10, 23,230,120), tableNumber(1), tableColour("silver"), fill(0), channel("table")
image    bounds( 10, 83,225,  1), colour(255,255,255,100) ; x axis
image    bounds(125, 23,  1,120), colour(255,255,255,100) ; y axis
image    bounds(125, 22,  0,122), colour(205,205,255, 80), channel("Overlay")

nslider  bounds( 10,144, 70, 30), channel("start"), text("START"), range(-100, 100, -1)
nslider  bounds(180,144, 70, 30), channel("end"), text("END"), range(-100, 100, 1)

checkbox bounds( 10,177, 80, 12), channel("rescale") text("RESCALE"), value(1)
checkbox bounds(110,177, 80, 12), channel("link") text("LINK"), value(1)


checkbox bounds( 10,195, 80, 12), channel("tone") text("TONE"), value(1)
checkbox bounds( 70,195, 90, 12), channel("normalise") text("NORMALISE"), value(0)

nslider  bounds( 10,210, 70, 30), channel("freq"), text("FREQ"), range(10, 10000, 100)
nslider  bounds( 90,210, 70, 30), channel("ampIn"), text("AMP (IN)"), range(0, 1, 0.5)
nslider  bounds(170,210, 70, 30), channel("ampOut"), text("AMP (OUT)"), range(0, 1, 0.98)
nslider  bounds( 10,245, 70, 30), channel("power"), text("POWER"), range(0.001, 16, 1, 1, 0.001)
checkbox bounds( 90,259, 80, 16), channel("dcblock") text("DC BLOCK"), value(0)

label    bounds(  5,281,235, 15), text("WAVESHAPED SINE WAVE"), align("centre")
; bevel
image    bounds(  5,298,235,160), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(20)
{
; grid
gentable      bounds(  5,  5,225,150), tableNumber(1),  tableGridColour("white"), fill(0), tableColour(0,0,0,0)
; oscilloscope
signaldisplay bounds(  5,  5,225,150), colour("LightBlue"), alpha(0.85), displayType("waveform"), backgroundColour("Black"), zoom(-1), signalVariable("asig"), channel("display")
image         bounds(  5, 79,225,  1), colour(100,100,100) ; x-axis indicator
}

label         bounds(  5,461,235, 15), text("PARTIALS"), align("centre")
; bevel
image         bounds(  5,478,235,160), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(20)
{
; grid
gentable      bounds(  5,  5,225,150), tableNumber(1),  tableGridColour("white"), fill(0), tableColour(0,0,0,0)
; spectroscope
signaldisplay bounds(  5,  5,225,150), colour("LightBlue"), alpha(0.85), displayType("spectroscope"), backgroundColour("Black"), zoom(-1), signalVariable("asig"), channel("displaySS")
image         bounds(  5, 79,225,  1), colour(100,100,100) ; x-axis indicator
}
label    bounds( 5,641,110, 12), text("Iain McCurdy |2023|"), fontColour("silver"), align("left")

</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-n -dm0 -+rtmidi=NULL --displays
</CsOptions>

<CsInstruments>

; sr set by host
ksmps         =     32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls        =     2    ; NUMBER OF CHANNELS (1=MONO)
0dbfs         =     1    ; MAXIMUM AMPLITUDE

gitanh   ftgen    1,0,4096,"tanh", -4, 4, 1 

instr    1
; GENTABLE
klink      cabbageGetValue  "link"
kstart,kT  cabbageGetValue  "start"
           cabbageSetValue  "end",-kstart,kT*klink
kend,kT    cabbageGetValue  "end"
           cabbageSetValue  "start",-kend,kT*klink
krescale   cabbageGetValue  "rescale"
if changed:k(kstart,kend,krescale)==1 then
           reinit           RebuildTable
endif
RebuildTable:
i_         ftgen            1,0,4097,"tanh", i(kstart), i(kend), 1 - i(krescale)
           cabbageSet       "table", "tableNumber", 1
rireturn

; TONE
ktone     cabbageGetValue      "tone"
ktone     portk                ktone,0.01

kporttime linseg               0,0.001,0.05

kfreq     cabbageGetValue      "freq"
kfreq     portk                kfreq,kporttime

kampIn    cabbageGetValue      "ampIn"
kampIn    portk                kampIn,kporttime

kampOut   cabbageGetValue      "ampOut"
kampOut   portk                kampOut,kporttime

asig      poscil               a(kampIn),kfreq

; display scope of input sine wave into transfer function in GUI
kpeak     peak                 asig                                                          ; scan for peak
kUpdate   metro                8                                                             ; update trigger
if kUpdate==1 then                                                                           ; if trigger generated...
          cabbageSet           k(1),"Overlay","bounds",126 - (kpeak*115), 22, 230*kpeak,122  ; reset bounds for gentable overlay
kpeak     =                    0                                                             ; reset peak value
endif

; derive powershaping value
kporttime linseg               0,0.001,0.05 
kpower    cabbageGetValue      "power"
kpower    pow                  kpower, 2
kpower    portk                kpower,kporttime

; waveshaping
asig      tablei               ((asig*0.5) + 0.5)^kpower, 1, 1
asig      *=                   a(kampOut)

; DC Block
kdcblock  cabbageGetValue      "dcblock"
if kdcblock==1 then
 asig     dcblock2             asig, 2048
endif

asig      *=                   a(ktone) ; turn audio on/off

          outs                 asig/3,asig/3

; OSCILLOSCOPE
kPeriodFrac = 5
if changed:k(kfreq,kPeriodFrac)==1 then
         reinit                RestartDisplay
endif
RestartDisplay:
iPeriod   =  2 * 80/(i(kfreq)*2^i(kPeriodFrac))
         display               asig, iPeriod
rireturn

;        dispfft               xsig, iprd,  iwsiz [, iwtyp] [, idbout] [, iwtflg] [,imin] [,imax] 
         dispfft               asig, 0.001, 2048,      1,        0,         0,       0,      500

endin

</CsInstruments>

<CsScore>
; play instrument 1 for 1 hour
i 1 0 3600
</CsScore>

</CsoundSynthesizer>
