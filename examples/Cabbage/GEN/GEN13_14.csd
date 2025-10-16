	
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN13_14.csd
; Demonstration of GEN13 and GEN14
; Written by Iain McCurdy, 2023
; 
; GEN13 generates a polynomial whose coefficients derive from the Chebyshev polynomials of the first kind. 
; GEN14 generates a polynomial whose coefficients derive from the Chebyshev polynomials of the second kind. 
; This is commonly used in waveshaping synthesis

; Sliders are provided for the first 10 coefficients. These correspond to the first 10 harmonics in the waveshaped output
; coefficient 0 applies DC offset to the GEN13/14 transfer function 
; coefficients can also be negative, which will invert the polarity of the relevant harmonic, but this option is not provided in the demonstration.
; a switch is provided to enable and disable normalisation of the function table. 
; Normalising the table will prevent a build up of gain as many coeffcients are added but it may be desirable to disable normalisating of the function table when 
;  only one coefficient is present.
; Double clicking on a slider resets it to its starting position.

; The function table created is used in the waveshaping of a sine wave
; FREQ      - frequency of the sine wave
; AMP (IN)  - amplitude of the sine wave before waveshaping. It can be noticed how this results in timbral changes and not merely amplitude changes in the output waveform.
; AMP (OUT) - amplitude of the sine wave after waveshaping
; POWER     - distorts the waveshaping phase pointer by raising it to the power of this value. 1 = linear. >1 = increasingly exponential.
; DC BLOCK  - filter off DC components in the output waveform. This can be useful if the tranfer function created by GEN13/14 is predominantly in the +ve or -ve domain.
;              the transfer function can also be shifted up or down the x-axis using the 0 coefficient slider

; TONE      - turn the sine wave oscillator on or off

; A tranlucent overlay on the transfer function shows the peak to peak mapping of the input sine wave through it.
; reducing AMP (IN) will narrow its scope
; Displays are provided for the output waveform resulting from waveshaping and a spectroscope which reveals the harmonic partial content of the output

; Chebyshev polynomials of the first kind follow this pattern
; T(0,x) = 1 
; T(1,x) = x
; T(n,x) = 2 x T(n−1,x)−T(n−2,x)
; (https://www.mathworks.com/help/symbolic/sym.chebyshevt.html)

; Chebyshev polynomials of the second kind follow this sequence
; U_0(x)	=	1	
; U_1(x)	=	2x	
; U_2(x)	=	4x^2-1	
; U_3(x)	=	8x^3-4x	
; U_4(x)	=	16x^4-12x^2+1	
; U_5(x)	=	32x^5-32x^3+6x
; (https://mathworld.wolfram.com/ChebyshevPolynomialoftheSecondKind.html)

<Cabbage>
form caption("GEN13/14"), size(245, 708), pluginId("1314"), colour(13, 50, 67,50), guiMode("queue")

label    bounds( 10,  5,235, 15), text("TRANSFER FUNCTION (GEN13/14)"), align("centre")
image    bounds(  9, 22,232,122), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(10)
gentable bounds( 10, 23,230,120), tableNumber(1), tableColour("silver"), fill(0), channel("table")
image    bounds( 10, 83,225,  1), colour(255,255,255,100) ; x axis
image    bounds(125, 23,  1,120), colour(255,255,255,100) ; y axis
image    bounds(125, 23,  0,120), colour(205,205,255, 80), channel("Overlay")

label    bounds( 10,145,235, 15), text("COEFFICIENTS"), align("centre")

vslider  bounds(  1,160, 20, 80), channel("0"),  text("0"), range(-3, 3, 0), textBox(1)
vslider  bounds( 21,160, 20, 80), channel("1"),  text("1"), range(-1, 1, 1), textBox(1)
vslider  bounds( 41,160, 20, 80), channel("2"),  text("2"), range(-1, 1, 0), textBox(1)
vslider  bounds( 61,160, 20, 80), channel("3"),  text("3"), range(-1, 1, 0), textBox(1)
vslider  bounds( 81,160, 20, 80), channel("4"),  text("4"), range(-1, 1, 0), textBox(1)
vslider  bounds(101,160, 20, 80), channel("5"),  text("5"), range(-1, 1, 0), textBox(1)
vslider  bounds(121,160, 20, 80), channel("6"),  text("6"), range(-1, 1, 0), textBox(1)
vslider  bounds(141,160, 20, 80), channel("7"),  text("7"), range(-1, 1, 0), textBox(1)
vslider  bounds(161,160, 20, 80), channel("8"),  text("8"), range(-1, 1, 0), textBox(1)
vslider  bounds(181,160, 20, 80), channel("9"),  text("9"), range(-1, 1, 0), textBox(1)
vslider  bounds(201,160, 25, 80), channel("10"), text("10"), range(-1, 1, 0), textBox(1)
vslider  bounds(221,160, 25, 80), channel("All"), text("All"), range(-1, 1, 1), textBox(1)

checkbox bounds( 10,250, 80, 12), channel("tone") text("TONE"), value(1)
checkbox bounds( 70,250, 90, 12), channel("normalise") text("NORMALISE"), value(0)
combobox bounds(160,245, 70, 20), items("GEN13","GEN14"), value(1), channel("type")
nslider  bounds( 10,265, 70, 30), channel("freq"), text("FREQ"), range(10, 10000, 100)
nslider  bounds( 90,265, 70, 30), channel("ampIn"), text("AMP (IN)"), range(0, 1, 0.5)
nslider  bounds(170,265, 70, 30), channel("ampOut"), text("AMP (OUT)"), range(0, 1, 0.98)
nslider  bounds( 10,300, 70, 30), channel("power"), text("POWER"), range(0.001, 16, 1, 1, 0.001)
checkbox bounds( 90,314, 80, 16), channel("dcblock") text("DC BLOCK"), value(0)

label    bounds(  5,336,235, 15), text("WAVESHAPED SINE WAVE"), align("centre")
; bevel
image    bounds(  5,353,235,160), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(20)
{
; grid
gentable      bounds(  5,  5,225,150), tableNumber(1),  tableGridColour("white"), fill(0), tableColour(0,0,0,0)
; oscilloscope
signaldisplay bounds(  5,  5,225,150), colour("LightBlue"), alpha(0.85), displayType("waveform"), backgroundColour("Black"), zoom(-1), signalVariable("asig"), channel("display")
image         bounds(  5, 79,225,  1), colour(100,100,100) ; x-axis indicator
}

label         bounds(  5,516,235, 15), text("PARTIALS"), align("centre")
; bevel
image         bounds(  5,533,235,160), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(20)
{
; grid
gentable      bounds(  5,  5,225,150), tableNumber(1),  tableGridColour("white"), fill(0), tableColour(0,0,0,0)
; spectroscope
signaldisplay bounds(  5,  5,225,150), colour("LightBlue"), alpha(0.85), displayType("spectroscope"), backgroundColour("Black"), zoom(-1), signalVariable("asig"), channel("displaySS")
}
label    bounds(   5,695,110, 12), text("Iain McCurdy |2023|"), align("left")

</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-n -dm0 -+rtmidi=NULL --displays
</CsOptions>

<CsInstruments>

; sr set by host
ksmps         =                32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls        =                2    ; NUMBER OF CHANNELS (1=MONO)
0dbfs         =                1    ; MAXIMUM AMPLITUDE

instr    1
kporttime     linseg           0, 0.001, 0.05 
k0            cabbageGetValue  "0"
k1            cabbageGetValue  "1"
k2            cabbageGetValue  "2"
k3            cabbageGetValue  "3"
k4            cabbageGetValue  "4"
k5            cabbageGetValue  "5"
k6            cabbageGetValue  "6"
k7            cabbageGetValue  "7"
k8            cabbageGetValue  "8"
k9            cabbageGetValue  "9"
k10           cabbageGetValue  "10"
kAll          cabbageGetValue  "All"
knormalise    cabbageGetValue  "normalise"
ktype         cabbageGetValue  "type"
ktype         init             1

k0            portk            k0, kporttime
k1            portk            k1, kporttime
k2            portk            k2, kporttime
k3            portk            k3, kporttime
k4            portk            k4, kporttime
k5            portk            k5, kporttime
k6            portk            k6, kporttime
k7            portk            k7, kporttime
k8            portk            k8, kporttime
k9            portk            k9, kporttime
k10           portk            k10, kporttime
kALl          portk            kAll, kporttime

if changed:k(k0,k1,k2,k3,k4,k5,k6,k7,k8,k9,k10,kAll,knormalise,ktype)==1 then
 reinit RebuildTable
endif
RebuildTable:
ixint      =   1
ixamp      =   1
i_        ftgen                1,0,4097,(12 + i(ktype)) * ((i(knormalise)*2)-1), ixint, ixamp,   i(k0)*i(kAll), i(k1)*i(kAll), i(k2)*i(kAll), i(k3)*i(kAll), i(k4)*i(kAll), i(k5)*i(kAll), i(k6)*i(kAll), i(k7)*i(kAll), i(k8)*i(kAll), i(k9)*i(kAll), i(k10)*i(kAll)
          cabbageSet           "table", "tableNumber", 1
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
kpeak     peak                 asig                                                             ; scan for peak
kUpdate   metro                8                                                                ; update trigger
if kUpdate==1 then                                                              ; if trigger generated...
          cabbageSet           k(1),"Overlay","bounds",126 - (kpeak*115), 20, 230*kpeak,120  ; reset bounds for gentable overlay
kpeak     =                    0                                                                 ; reset peak value
endif

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

; SPECTROSCOPE
;        dispfft               xsig, iprd,  iwsiz [, iwtyp] [, idbout] [, iwtflg] [,imin] [,imax] 
         dispfft               asig, 0.001, 4096,      1,        0,         0,       0,      512
endin

</CsInstruments>

<CsScore>
; play instrument 1 for 1 hour
i 1 0 3600
</CsScore>

</CsoundSynthesizer>
