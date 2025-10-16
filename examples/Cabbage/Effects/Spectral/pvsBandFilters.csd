/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; PVSBandFilters.csd
; Written by Iain McCurdy

; This example implements bandpass and bandreject filters using streaming FFT signals through the opcodes pvsbandp and pvsbandr.

; Input                -  source input
;                         1. Live stereo Audio In
;                         2. Live Mono (left input)
;                         3. White noise (for testing)
; Bandpass/Bandreject  -  radio buttons for selecting the filter type

; Low Cut              -  start of the lower cutoff transition
; Low Full             -  end of the lower cutoff transition
; High Full            -  start of the upper cutoff transition
; High Cut             -  end of the upper cutoff transition
; Curve                -  shape - concave-straight-convex - of the cutoff transitions
; Floor                -  level of the signal outside the bandpass/bandreject region in the output
; Shift                -  shift the entire filter graph by multiplication (pitch shift, not frequency shift)
;  Protections are in place to prevent this sequence of frequencies from overlapping.
;  The resulting filter graph is shown.

; Input Gain           -  gain control applied to all possible input signals
; Output Gain          -  gain control applied to all possible output signals

; S   P   E   C   T   R   U   M      V   I   E   W
; Controls related to the spectrum views
; Spectral views are provided for the input (before filtering / red) and output (after filtering / blue).
; Before/after         -  on/off buttons to activate the two spectra. These can be turned off to save CPU if required.
; Smooth               -  smoothing applied to movements of the spectral graphs. Increasing this can be useful in clarifying the 
; Gain                 -  gain applied to the spectral graphs

; Note that the spectral views represent frequency on a linear scale so perceptually, greater change is heard in the left-most part of the viewer.

<Cabbage>
form caption("PVS Band Filters") size(610,385), guiMode("queue"), pluginId("def1") colour(40,40,45)
#define SLIDER_DESIGN valueTextBox(1) colour(75,70,70), trackerColour(205,170,170), trackerInsideRadius(0.85), markerStart(0.25), markerEnd(1.25), markerColour("black"), markerThickness(0.4), markerColour(205,170,170), markerEnd(1.2), markerThickness(1)
#define SLIDER_DESIGN2 valueTextBox(1) colour(75,70,70), trackerColour(205,205,150), trackerInsideRadius(0.85), markerStart(0.25), markerEnd(1.25), markerColour("black"), markerThickness(0.4), markerColour(205,205,100), markerEnd(1.2), markerThickness(1)
#define SLIDER_DESIGN3 valueTextBox(1) colour(75,70,70), trackerColour(150,205,205), trackerInsideRadius(0.85), markerStart(0.25), markerEnd(1.25), markerColour("black"), markerThickness(0.4), markerColour(100,205,205), markerEnd(1.2), markerThickness(1)
#define SLIDER_DESIGN4 valueTextBox(1) colour(75,70,70), trackerColour(205,150,205), trackerInsideRadius(0.85), markerStart(0.25), markerEnd(1.25), markerColour("black"), markerThickness(0.4), markerColour(205,150,205), markerEnd(1.2), markerThickness(1)

label    bounds( 15, 10, 90, 14), text("Input")
combobox bounds( 15, 25, 90, 20), channel("Input"), items("Live Stereo","Live Mono","White Noise"), value(3)

checkbox bounds( 15,60,80,15), channel("Bandpass"), radioGroup(1), text("Bandpass"), value(1)
checkbox bounds( 15,80,80,15), channel("Bandreject"), radioGroup(1), text("Bandreject")

rslider bounds(100, 10, 80, 90), channel("LC"), range(0,24000,1000,0.5,1), text("Low Cut"), $SLIDER_DESIGN
rslider bounds(170, 10, 80, 90), channel("LF"), range(0,24000,2500,0.5,1), text("Low Full"), $SLIDER_DESIGN
rslider bounds(240, 10, 80, 90), channel("HF"), range(0,24000,5000,0.5,1), text("High Full"), $SLIDER_DESIGN
rslider bounds(310, 10, 80, 90), channel("HC"), range(0,24000,10000,0.5,1), text("High Cut"), $SLIDER_DESIGN

rslider bounds(380, 10, 80, 90), channel("Curve"), range(-10,10,0), text("Curve"), $SLIDER_DESIGN2
rslider bounds(450, 10, 80, 90), channel("Floor"), range(0,1,0), text("Floor"), $SLIDER_DESIGN3
rslider bounds(520, 10, 80, 90), channel("Shift"), range(-8,8,0), text("Shift"), $SLIDER_DESIGN4


image    bounds(  6,126,598,108), corners(4), colour("silver")
gentable bounds( 10,130,590,100), tableNumber(101), channel("Filtgraph"), ampRange(0,1,101), fill(1), tableColour(0,0,0), ampRange(0,1.01,101), fill(0), tableBackgroundColour(170,170,170), tableGridColour(120,120,120), outlineThickness(3)
gentable bounds( 10,130,590,100), tableNumber(103), channel("InSpec"), outlineThickness(1), tableColour:0(200,0,  0,120), tableBackgroundColour(0,0,0,0), tableGridColour(0,0,0,0), ampRange(0,1,103), outlineThickness(0), fill(1) ;, sampleRange(0, 2048) 
gentable bounds( 10,130,590,100), tableNumber(104), channel("OutSpec"), outlineThickness(1), tableColour:0(  0,0,200,120), tableBackgroundColour(0,0,0,0), tableGridColour(0,0,0,0), ampRange(0,1,104), outlineThickness(0), fill(1) ;, sampleRange(0, 1024) 

;label    bounds( 15,280, 80, 14), text("FFT Size")
;combobox bounds( 15,295, 80, 20), text("64","128","256","512","1024","2048","4096"), channel("FFTindex"), value(5)

rslider  bounds( 60,260, 80,100), channel("InGain"), range(0,10,1,0.5), text("Input Gain"), $SLIDER_DESIGN
rslider  bounds(180,260, 80,100), channel("OutGain"), range(0,10,0.1,0.5), text("Output Gain"), $SLIDER_DESIGN

image    bounds(315,240,290,140), colour(10,10,10,100), outlineColour("silver"), outlineThickness(2), corners(10)
{
label    bounds(  0,  7,290, 12), text("S   P   E   C   T   R   U   M         V   I   E   W")
checkbox bounds( 25, 50, 80, 15), channel("Before"), text("Before"), value(1), colour(255,100,100)
checkbox bounds( 25, 70, 80, 15), channel("After"), text("After"), value(1), colour(100,100,255)
rslider  bounds( 90, 20, 80,100), channel("GSmooth"), range(0,5,1.5), text("Smooth"), $SLIDER_DESIGN
rslider  bounds(180, 20, 80,100), channel("GGain"), range(1,50,25,0.5), text("Gain"), $SLIDER_DESIGN
}

label    bounds(  6,370, 110, 12), text("Iain McCurdy |2024|")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -dm0
</CsOptions>

<CsInstruments>
; Initialize the global variables. 
ksmps              =                   32
nchnls             =                   2
0dbfs              =                   1

giFiltgraph        ftgen               101,0,1024,2,0

;instrument will be triggered by keyboard widget
instr 1

kInGain            cabbageGetValue     "InGain"
kOutGain           cabbageGetValue     "OutGain"

kLC                cabbageGetValue     "LC"
kLF                cabbageGetValue     "LF"
kHF                cabbageGetValue     "HF"
kHC                cabbageGetValue     "HC"
kCurve             =                   -cabbageGetValue:k("Curve")      ; invert logic of curve control, seems more intuitive
kShift             =                   2^(cabbageGetValue:k("Shift"))   ; convert octaves values to a frequency ratio
kFloor             cabbageGetValue     "Floor"
;kFFTindex          cabbageGetValue     "FFTindex"
;kFFTindex          init                5

; apply frequency scaling to all four controls
kLC                *=                  kShift
kLF                *=                  kShift
kHF                *=                  kShift
kHC                *=                  kShift

kBandpass          cabbageGetValue     "Bandpass"

; increase sliders automatically to prevent overlaps from manually increased sliders
                   cabbageSetValue     "LF", kLC, trigger:k(kLC,kLF,0)
                   cabbageSetValue     "HF", kLF, trigger:k(kLF,kHF,0)
                   cabbageSetValue     "HC", kHF, trigger:k(kHF,kHC,0)
; decrease sliders automatically to prevent overlaps from manually decreased sliders
                   cabbageSetValue     "HF", kHC, trigger:k(kHC,kHF,1)
                   cabbageSetValue     "LF", kHF, trigger:k(kHF,kLF,1)
                   cabbageSetValue     "LC", kLF, trigger:k(kLF,kLC,1)

if metro:k(20)==1 then ; throttle possible maximum rate of updates
 if changed:k(kLC,kLF,kHF,kHC,kCurve,kBandpass,kFloor)==1 then ; conditional for rebuilding the display table
                   reinit              UPDATE_GRAPH
 endif
endif
UPDATE_GRAPH:
iLC                =                   i(kLC) / (sr/2) ; rescale to 0 to 1
iLF                =                   i(kLF) / (sr/2)
iHF                =                   i(kHF) / (sr/2)
iHC                =                   i(kHC) / (sr/2)

; convert location to durations from the previous breakpoint
iHC                -=                  iHF         
iHF                -=                  iLF
iLF                -=                  iLC

iCurve             =                   i(kCurve)

iGraphLen = ftlen(giFiltgraph)
if i(kBandpass)==1 then
 i_                ftgen               giFiltgraph, 0, iGraphLen, 16, i(kFloor), iLC*iGraphLen, 0, i(kFloor), iLF*iGraphLen+1, iCurve, 1, iHF*iGraphLen+1, 0, 1, iHC*iGraphLen+1, -iCurve, i(kFloor), iGraphLen, 0, i(kFloor)
else
 i_                ftgen               giFiltgraph, 0, iGraphLen, 16, 1, iLC*iGraphLen, 0, 1, iLF*iGraphLen+1, -iCurve, i(kFloor), iHF*iGraphLen+1, 0, i(kFloor), iHC*iGraphLen+1, iCurve, 1, iGraphLen, 0, 1
endif
                   cabbageSet          "Filtgraph","tableNumber",giFiltgraph
rireturn

kPortTime          linseg              0, 0.01, 0.05
kLC                portk               kLC, kPortTime
kLF                portk               kLF, kPortTime
kHF                portk               kHF, kPortTime
kHC                portk               kHC, kPortTime

kInput             cabbageGetValue     "Input"
if kInput==1 then
 aInL,aInR         ins
elseif kInput==2 then
 aInL              inch                1
 aInR              =                   aInL
else
 aInL               noise               1, 0
 aInR               noise               1, 0
endif

 aInL              *=                  kInGain
 aInR              *=                  kInGain



;if changed:k(kFFTindex)==1 then
; reinit UPDATE_PVS
;endif
;UPDATE_PVS:
iFFT               =                   1024 ;2 ^ (i(kFFTindex) + 5) ; use of genTable spectral view inhibits use the dynamic FFT size so this feature is disabled for now

fInSigL            pvsanal             aInL,iFFT,iFFT/4,iFFT,0
fInSigR            pvsanal             aInR,iFFT,iFFT/4,iFFT,0

if kBandpass==1 then
 fOutSigL          pvsbandp            fInSigL, kLC, kLF, kHF, kHC, kCurve
 fOutSigR          pvsbandp            fInSigR, kLC, kLF, kHF, kHC, kCurve
else
 fOutSigL          pvsbandr            fInSigL, kLC, kLF, kHF, kHC, kCurve
 fOutSigR          pvsbandr            fInSigR, kLC, kLF, kHF, kHC, kCurve
endif

fpvsfloorL         pvsgain             fInSigL, kFloor
fpvsfloorR         pvsgain             fInSigR, kFloor
fMixL              pvsmix              fOutSigL, fpvsfloorL
fMixR              pvsmix              fOutSigR, fpvsfloorR

aOutL              pvsynth             fMixL
aOutR              pvsynth             fMixR
                   outs                aOutL * kOutGain, aOutR * kOutGain



 ; SPECTRUM OUT GRAPHS
 kGSmooth          cabbageGetValue     "GSmooth"
 kGGain            cabbageGetValue     "GGain"
 kBefore           cabbageGetValue     "Before"
 kAfter            cabbageGetValue     "After"
 iTabLen           =                   iFFT/2 + 1                                ; table size for pvsmaska spectral envelope 
 iInSpec           ftgen               103, 0, iTabLen, -2, 0                    ; initialise table
 iOutSpec          ftgen               104, 0, iTabLen, -2, 0                    ; initialise table
 iSilence          ftgen               105, 0, iTabLen, -2, 0                    ; initialise table
 iClockRate        =                   16
 kClock            metro               iClockRate                                ; reduce rate of updates
 if  kClock==1 then                                                              ; reduce rate of updates
  if kBefore==1 then
   fInSigLGain      pvsgain             fInSigL, kGGain
   fInSigLBlur      pvsblur             fInSigLGain, kGSmooth/iClockRate, 5/iClockRate
   kflag            pvsftw              fInSigLBlur, iInSpec
                    cabbageSet          1, "InSpec", "tableNumber", iInSpec 
  endif
  if kAfter==1 then
   fOutSigLGain      pvsgain            fMixL, kGGain
   fOutSigLBlur      pvsblur            fOutSigLGain, kGSmooth/iClockRate, 5/iClockRate
   kflag            pvsftw              fOutSigLBlur, iOutSpec
                    cabbageSet          kClock, "OutSpec", "tableNumber", iOutSpec 
  endif
 endif
 
 if trigger:k(kBefore,0.5,1)==1 then
                    tablecopy           iInSpec,iSilence
                    cabbageSet          1, "InSpec", "tableNumber", iInSpec
 elseif trigger:k(kAfter,0.5,1)==1 then
                    tablecopy           iOutSpec,iSilence
                    cabbageSet          1, "OutSpec", "tableNumber", iOutSpec
 endif

endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
