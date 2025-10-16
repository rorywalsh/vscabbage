
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; pvsMaska.csd
; Written by Iain McCurdy, 2024.

; pvsmaska is used to apply a spectral envelope to an audio signal in the form of a streaming FFT signal.

; In this implementation, the spectral envelope can be drawn in straight-line segments, in exponentially curved segments, 
;  as a parametrically defined band-pass or band-reject shape, or captured from an analysis of the live input.  

; Channels             - number of input channels. Mono (L), Stereo

; Input                - input source
; -----
; white noise          - 
; pink noise           - 
; dust (random clicks) - 
; buzz                 - harmonic tone rich in overtones
; live input           - 
; file input           - 

; Table Mode           - method used for contructing the table
; ----------
; 1. Draw (Lin.)       - linear draw, band-pass, band-reject, capture analysis of audio input
; 2. Draw (Exp.)       - exponential draw
; 3. Draw (Free)       - draw freehand on the graph area
; 4. Bandpass          - bandpass filter with control over bandwidth, slope and slope-curve 
; 5. Bandreject        - bandreject filter with control over bandwidth, slope and slope-curve  
; 6. Lowpass           - lowpass filter with control over cutoff frequency, slope and slope-curve
; 7. Highpass          - highpass filter with control over cutoff frequency, slope and slope-curve
; 8. Bandpass II       - bandpass filter with independent control of the start and end of the passband, as well as slope lengths and slope curves.
; 9. Bandreject II     - bandreject filter with independent control of the start and end of the passband, as well as slope lengths and slope curves.
; 10. Ripple           - a spectral envelope with a sinusoidal ripple shape is defined. Controls are for number of ripples across the frequency range, frequency offset and the rate of an LFO that modulates the frequency offset
; 11. Ripple II        - a spectral envelope with a square ripple shape is defined. Controls are for number of ripples across the frequency range, frequency offset and the rate of an LFO that modulates the frequency offset
; 12. Capture          - the spectral envelope of the live audio input signal can be captured and then applied to subsequent input sounds.

; Controls Applied to all input and table modes
; Mix                  -  amount of unfiltered signal in the output (amplitude ratio)
; Gain                 -  gain applied to output signal (dB)

; BANDPASS/BANDREJECT CONTROLS. ONLY SHOWN WHEN THOSE TABLE MODES ARE SELECTED
; CF                   -  centre frequency when using bandpass mode
; BW                   -  bandwidth when using bandpass mode
; Slope                -  proportion of the the bandwidth that is used to ramp from full attenuation to no attenuation
; Curve                -  curve of the slope portion of the passband

; CAPTURE CONTROLS. ONLY SHOWN WHEN THAT TABLE MODE IS SELECTED
; CAPTURE (button)     - while pressed, an analysis of the live input is written into the masking table
; Cap. Gain            - amplitude gain applied to the audio fed into the Capture spectrum analysser as well as the envelope that will be written into the masking envelope.
; Capture Spectrum Viewer

; DISPLAY CONTROLS     - affect the real-time spectrum envelope display of the input signal
; Gain                 -  Gain applied to the visual spectrum display amplitude. Does not affect audible results.
; Smooth               -  lag filter applied to changes in the spectrum display

; DUST CONTROLS. ONLY SHOWN WHEN 'Dust' INPUT IS SELECTED
; Dust Freq.           -  frequency of dust grains 

; BUZZ CONTROLS. ONLY SHOWN WHEN 'Buzz' INPUT IS SELECTED
; Buzz Freq.           -  frequency of buzz tone

; FILE PLAYBACK CONTROLS
; OPEN FILE            -  browse for file. Input changes to 'File' when a suitable file is loaded.
; PLAY                 -  play file. This is automatically activated when a suitable file is loaded.
; STOP                 -  stop playback.
; inskip               -  location from which playback starts

; Shift                - shifts an entire masking envelope up or down
; Start                - lower-limit start of the masking envelope
; End                  - upper-limit end of the masking envelope

GLOBAL CONTROLS


<Cabbage>
form caption("PVS-MASKA"), size(885,520) colour( 70, 90,100), pluginId("PvMa"), guiMode("queue")
#define  SLIDER_STYLE valueTextBox(1), textColour("white"), fontColour("white"), colour( 30, 50, 60),trackerColour("white")

image    bounds(102,102,726,141), outlineThickness(5), outlineThickness(5), outlineColour("LightGrey"), corners(10)

#define DIMENSIONS 105,105,720,135

gentable bounds(105,105,720,135), tableNumber(99), tableColour(0,0,200,200), channel("ampFFT"), outlineThickness(1), tableBackgroundColour("white"), tableGridColour(100,100,100,50), ampRange(0,1,99), outlineThickness(0), fill(1) ;, sampleRange(0, 1024) 
gentable bounds(105,105,720,135), tableNumber(1), tableColour(100,100,100,100), channel("tableDrawLin"), ampRange(0,1,1), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(1)
gentable bounds(105,105,720,135), tableNumber(2), tableColour(200,100,100,100), channel("tableDrawExp"), ampRange(0,1,2), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(3), tableColour(255,100,  0,120), channel("tableDrawFree"), ampRange(0,1,3), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(4), tableColour(100,100,100,100), channel("tableBP"), ampRange(0,1,4), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(5), tableColour( 50,255,100,100), channel("tableBR"), ampRange(0,1,5), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(6), tableColour(200,100,  0,100), channel("tableLP"), ampRange(0,1,6), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(7), tableColour( 50,200, 50,100), channel("tableHP"), ampRange(0,1,7), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(8), tableColour(100,100,100,100), channel("tableBPII"), ampRange(0,1,8), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(9), tableColour(255,  0,255,100), channel("tableBRII"), ampRange(0,1,9), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(10), tableColour(255,  0,  0,100), channel("tableRippleSine"), ampRange(0,1,10), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(11), tableColour(150,105, 10,200), channel("tableRippleArch"), ampRange(0,1,11), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(12), tableColour( 40,155,  0,200), channel("tableRippleSqu"), ampRange(0,1,12), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)
gentable bounds(105,105,720,135), tableNumber(13), tableColour(255,  0,  0,200), channel("tableCapture"), ampRange(0,1,13), fill(1), active(1), tableBackgroundColour(100,100,100,100), tableGridColour("grey"), visible(0)

image    bounds(105,105,  1,135), channel("LimL"), colour("black") ;, outlineThickness(5), outlineColour("black")
image    bounds(825,105,  1,135), channel("LimR"), colour("black") ;, outlineThickness(5), outlineColour("black")

label    bounds(  5,  5, 90, 13), text("Input"), fontColour("white")
combobox bounds(  5, 20, 90, 20), items("White Noise", "Pink Noise", "Dust", "Buzz", "Live","File"), value(5), channel("Input")
label    bounds(  5, 45, 90, 13), text("Table Mode"), fontColour("white")
combobox bounds(  5, 60, 90, 20), items("Draw (Lin)", "Draw (Exp)", "Draw (Free)", "Bandpass", "Bandreject","Lowpass","Highpass","Bandpass II","Bandreject II","Ripple Sine","Ripple Arch","Ripple Squ.","Capture"), value(1), channel("TabMode") ;, "Draw (Exp)"
label    bounds(  5, 85, 90, 13), text("Channels"), fontColour("white")
combobox bounds(  5,100, 90, 20), items("Mono (L)", "Stereo"), value(2), channel("Channels")

rslider  bounds( 90,  5, 90, 90), channel("Gain"), range(-48,48,0), text("Gain (dB)"), $SLIDER_STYLE
label    bounds(170, 10, 70, 13), text("Mask Mode"), fontColour("silver")
combobox bounds(170, 25, 70, 20), items("EQ", "Gate"), value(1), channel("MaskMode")

rslider  bounds(230,  5, 90, 90), channel("Mix"), range(0,1,1,8), text("Mix"), $SLIDER_STYLE

rslider  bounds(230,  5, 90, 90), channel("StenGain"), range(0,1,0), text("Gain"), $SLIDER_STYLE

; TABLE SETUP PANELS
image    bounds(350,  2,300, 96), colour( 70, 90,100), channel("BPBRPanel"), outlineThickness(2), outlineColour("LightGrey"), corners(10)
{
rslider  bounds(  0,  0, 90, 90), channel("CF"), range(0,1,0.2,0.5), text("Freq."), $SLIDER_STYLE
rslider  bounds( 70,  0, 90, 90), channel("BW"), range(0,1,0.1,0.5), text("Bandwidth"), $SLIDER_STYLE
rslider  bounds(140,  0, 90, 90), channel("Slope"), range(0,1,0.5), text("Slope"), $SLIDER_STYLE
rslider  bounds(210,  0, 90, 90), channel("Curve"), range(-16,16,0), text("Curve"), $SLIDER_STYLE
}

image    bounds(350,  2,300, 96), colour( 70, 90,100), channel("LPHPPanel"), outlineThickness(2), outlineColour("LightGrey"), corners(10)
{
rslider  bounds(  0,  0, 90, 90), channel("LPHPCF"),      range(0,1,0.2,0.5), text("Freq."), $SLIDER_STYLE
rslider  bounds( 70,  0, 90, 90), channel("LPHPRollOff"), range(0,1,0,0.5), text("Roll-Off"), $SLIDER_STYLE
rslider  bounds(140,  0, 90, 90), channel("LPHPCurve"),   range(-16,16,0), text("Curve"), $SLIDER_STYLE
}

image    bounds(350,  2,300, 96), colour( 70, 90,100), channel("BPBRIIPanel"), outlineThickness(2), outlineColour("LightGrey"), corners(10)
{
rslider  bounds(  0,  0, 90, 90), channel("BPBRII1"), range(0,1,0.1,0.5), text("Freq.H"), $SLIDER_STYLE
rslider  bounds( 70,  0, 90, 90), channel("BPBRII2"), range(0,1,0.3,0.5), text("Freq.L"), $SLIDER_STYLE
rslider  bounds(140,  0, 90, 90), channel("BPBRIISlope"), range(0,1,0,0.5), text("Slope"), $SLIDER_STYLE
rslider  bounds(210,  0, 90, 90), channel("BPBRIICurve"), range(-16,16,0), text("Curve"), $SLIDER_STYLE
}

image    bounds(350,  2,300, 96), colour( 70, 90,100), channel("DrawFreePanel"), outlineThickness(2), outlineColour("LightGrey"), corners(10)
{
button   bounds( 10, 35, 70, 20), channel("DrawFreeReset"), text("RESET","RESET"), latched(0)
}

image    bounds(350,  2,300, 96), colour( 70, 90,100), channel("CapturePanel"), outlineThickness(2), outlineColour("LightGrey"), corners(10)
{
button   bounds( 10, 35, 70, 20), channel("Capture"), text("CAPTURE","CAPTURE"), latched(0)
rslider  bounds( 70,  0, 90, 90), channel("CapGain"), range(0.1,100,1,0.5), text("Cap.Gain"), $SLIDER_STYLE
gentable bounds(160, 15,130, 70), tableNumber(101), channel("CapFFT"), outlineThickness(1), tableColour(200,0,  0,200), tableBackgroundColour("white"), tableGridColour(100,100,100,50), ampRange(0,1,99), outlineThickness(0), fill(1) ;, sampleRange(0, 1024) 
}

image    bounds(350,  2,300, 96), colour( 70, 90,100), channel("RippleSinePanel"), outlineThickness(2), outlineColour("LightGrey"), corners(10)
{
rslider  bounds( 0,  0, 90, 90), channel("RippleSineNum"), range(1,500,10,0.5), text("Number"), $SLIDER_STYLE
encoder  bounds( 70,  0, 90, 90), channel("RippleSineOS"), repeatInterval(360), popupText("0") value(0), valueTextBox(1), increment(10), text("Offset"), colour("silver"), fontColour("silver"), textColour("white")
rslider  bounds( 140,  0, 90, 90), channel("RippleSineLFO"), range(-40,40,0), text("LFO"), $SLIDER_STYLE
}

image    bounds(350,  2,300, 96), colour( 70, 90,100), channel("RippleArchPanel"), outlineThickness(2), outlineColour("LightGrey"), corners(10)
{
rslider  bounds( 0,  0, 90, 90), channel("RippleNumII"), range(1,500,10,0.5), text("Number"), $SLIDER_STYLE
encoder  bounds( 70,  0, 90, 90), channel("RippleOSII"), repeatInterval(1) popupText("0") value(0), valueTextBox(1), increment(0.01), text("Offset"), colour("silver"), fontColour("silver"), textColour("white")
rslider  bounds(140,  0, 90, 90), channel("RippleShapeII"), range(-16,16,4), text("Shape"), $SLIDER_STYLE
rslider  bounds(210,  0, 90, 90), channel("RippleLFOII"), range(-40,40,0), text("LFO"), $SLIDER_STYLE
}

image    bounds(350,  2,300, 96), colour( 70, 90,100), channel("RippleSquPanel"), outlineThickness(2), outlineColour("LightGrey"), corners(10)
{
rslider  bounds( 0,  0, 90, 90), channel("RippleNumIII"), range(1,500,10,0.5), text("Number"), $SLIDER_STYLE
encoder  bounds( 70,  0, 90, 90), channel("RippleOSIII"), repeatInterval(1) popupText("0") value(0), valueTextBox(1), increment(0.01), text("Offset"), colour("silver"), fontColour("silver"), textColour("white")
rslider  bounds(140,  0, 90, 90), channel("RippleWidIII"), range(0.001,0.999,0.5), text("Width"), $SLIDER_STYLE
rslider  bounds(210,  0, 90, 90), channel("RippleLFOIII"), range(-40,40,0), text("LFO"), $SLIDER_STYLE
}

image    bounds(349,  1,302, 98), colour( 70, 90,100), channel("BlankPanel"), visible(1), outlineThickness(0), corners(3), outlineColour(0,0,0,0)
{
;;rslider  bounds( 0,  0, 90, 90), channel("PitchShift"), range(0.125,2,1,0.5), text("Pitch Shift"), $SLIDER_STYLE
}

; INPUT SIGNAL PANELS
image    bounds(660,  2,170, 96), colour(0,0,0,0), channel("DustPanel"), visible(0), outlineThickness(2), outlineColour("LightGrey"), corners(10)
{
rslider  bounds(  0,  0, 90, 90), channel("DustFreq"), range(0.1,5000,100,0.5), text("Dust Freq."), $SLIDER_STYLE
}

image    bounds(660,  2,170, 96), colour(0,0,0,0), channel("BuzzPanel"), visible(0), outlineThickness(2), outlineColour("LightGrey"), corners(10)
{
rslider  bounds(  0,  0, 90, 90), channel("BuzzFreq"), range(0.1,5000,100,0.5), text("Buzz Freq."), $SLIDER_STYLE
rslider  bounds( 70,  0, 90, 90), channel("BuzzTone"), range(0.1,0.99,0.8,2), text("Buzz Tone"), $SLIDER_STYLE
}

label bounds(105,105,60,13), text("0Hz"), align("left"), channel("MOUSEFreqID"), visible(0), fontColour("black"), colour(255,255,255,200)

image    bounds(  5,125, 90,120), colour(0,0,0,0), outlineThickness(5), outlineColour("LightGrey"), corners(10)
{
label    bounds(  0,  5, 90, 13), text("D I S P L A Y"), fontColour("White")
vslider  bounds(  5, 20, 40, 80), channel("dispGain"), range(1,500,5,0.5)
label    bounds(  5,100, 40, 11), text("Gain"), fontColour("white")
vslider  bounds( 45, 20, 40, 80), channel("dispSmooth"), range(0,2,0.0,0.5)
label    bounds( 45,100, 40, 11), text("Smooth"), fontColour("white")
}

image    bounds(835,  5, 50,250), colour(0,0,0,0)
{
vmeter   bounds(  0,  0, 20,240) channel("vMeter1") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 0, 0) meterColour:1(255, 255, 0) meterColour:2(100,250, 0) outlineThickness(1)
vmeter   bounds( 25,  0, 20,240) channel("vMeter2") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 0, 0) meterColour:1(255, 255, 0) meterColour:2(100,250, 0) outlineThickness(1)
}

image      bounds(  5,250,875,125) colour(0,0,0,0), channel("FilePlay"), outlineThickness(5), outlineColour("LightGrey"), corners(10)
{
filebutton bounds(  5,  5, 85, 23), text("OPEN FILE","OPEN FILE"), fontColour("white") channel("filename") corners(5)
button     bounds(  5, 32, 85, 23), text("PLAY","PLAY"), fontColour("white") channel("Play"), latched(1), colour:0(10,55,10), colour:1(70,200,70) corners(5)
button     bounds(  5, 59, 85, 23), text("STOP","STOP"), fontColour("white") channel("Stop"), latched(0), colour:0(55,10,10), colour:1(200,70,70) corners(5)
soundfiler bounds( 95,  5,775, 80), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 97,  7,775, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
hslider    bounds( 89, 87,785, 20), channel("Inskip"), range(0, 1, 0)
label      bounds( 89,105,785, 13), text("I  N  S  K  I  P"), align("centre"), fontColour("white")
}

image      bounds(  5,380,875,125) colour(0,0,0,0), channel("GlobalControls"), outlineThickness(5), outlineColour("LightGrey"), corners(10)
{
label      bounds(  0,  5,875, 13) text("G  L  O  B  A  L     C  O  N  T  R  O  L  S"), align("centre"), fontColour("white")
rslider    bounds(  5, 25, 90, 90), channel("Shift"), range(-1024,1024,0,1,1), text("Shift"), $SLIDER_STYLE
rslider    bounds( 85, 25, 90, 90), channel("Start"), range(0,1024,0,1,1), text("Start"), $SLIDER_STYLE
rslider    bounds(165, 25, 90, 90), channel("End"),   range(0,1024,1024,1,1), text("End"), $SLIDER_STYLE
image      bounds(260, 30,  1, 80), colour("silver")
checkbox   bounds(280, 35,120, 15), channel("SmoothOnOff"), text("Smooth On/Off"), value(0), fontColour:0("white"), fontColour:1("white")
rslider    bounds(385, 25, 90, 90), channel("AmpSmooth"), range(0,1,0), text("Amp"), $SLIDER_STYLE
rslider    bounds(465, 25, 90, 90), channel("FreqSmooth"), range(0,1,0), text("Freq"), $SLIDER_STYLE
}

label      bounds(5,506,110, 12), text("Iain McCurdy |2024|"), align("left"), fontColour("silver")

</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-dm0 -n
</CsOptions>
<CsInstruments>

ksmps        =     64
nchnls       =     2
0dbfs        =     1

                seed  0
gaFileL,gaFileR init  0

#define AllGraphsInvisible
#
                    cabbageSet        1,"tableDrawLin","visible",0
                    cabbageSet        1,"tableDrawExp","visible",0
                    cabbageSet        1,"tableDrawFree","visible",0
                    cabbageSet        1,"tableBP","visible",0
                    cabbageSet        1,"tableBR","visible",0
                    cabbageSet        1,"tableLP","visible",0
                    cabbageSet        1,"tableHP","visible",0
                    cabbageSet        1,"tableBPII","visible",0
                    cabbageSet        1,"tableBRII","visible",0
                    cabbageSet        1,"tableRippleSine","visible",0
                    cabbageSet        1,"tableRippleArch","visible",0                    
                    cabbageSet        1,"tableRippleSqu","visible",0
                    cabbageSet        1,"tableCapture","visible",0
#

instr    1
 iFFTSize           =                 2048                                 ; FFT size
 iTabLen            =                 iFFTSize/2 + 1                       ; table size for pvsmaska spectral envelope 
 giTabLen           =                 iTabLen
 kRippleShapeII     cabbageGetValue   "RippleShapeII"
 kRippleWidIII      cabbageGetValue   "RippleWidIII"
 iArch              ftgen             201, 0, iTabLen, 16, 0, iTabLen*0.5, -4, 1, iTabLen*0.5, 4, 0
 iSqu               ftgen             202, 0, iTabLen, 7, 1, iTabLen*0.5, 1, 0, 0, iTabLen*0.5, 0
 
 iDrawLin           ftgen             1, 0, iTabLen, -7, 0.9, iTabLen, 0.9 ; Draw (Lin)
 iDrawExp           ftgen             2, 0, iTabLen, -5, 0.9, iTabLen, 0.9 ; Draw (Exp)
 iDrawFree          ftgen             3, 0, iTabLen, -10, 0                ; Draw (Free)
 iBP                ftgen             4, 0, iTabLen, -16, 0, iTabLen, 0, 0 ; bandpass
 iBR                ftgen             5, 0, iTabLen, -16, 0, iTabLen, 0, 0 ; bandreject
 iLP                ftgen             6, 0, iTabLen, -16, 0, iTabLen, 0, 0 ; lowpass
 iHP                ftgen             7, 0, iTabLen, -16, 0, iTabLen, 0, 0 ; highpass
 iBPII              ftgen             8, 0, iTabLen, -16, 0, iTabLen, 0, 0 ; bandpass II
 iBRII              ftgen             9, 0, iTabLen, -16, 0, iTabLen, 0, 0 ; bandreject II
 iRippleSine        ftgen             10, 0, iTabLen, 19, 17, 0.5, 0, 0.5  ; ripple sine
 iRippleArch        ftgen             11, 0, iTabLen, 32, iSqu, 100, 1, 0  ; ripple II (arch)
 iRippleSqu         ftgen             12, 0, iTabLen, 32, iSqu, 100, 1, 0  ; ripple II (square)
 iCapture           ftgen             13, 0, iTabLen, -7, 1, iTabLen, 1    ; capture
 
 iBuffer            ftgen             50, 0, iTabLen, -10, 0                 ; buffer
 
 iSilence           ftgen             0, 0, iTabLen, -10, 0                ; Silence
 iCapFFT            ftgen             101, 0, iTabLen, 10, 0               ; initialise input capture table

 kMOUSE_X           cabbageGetValue   "MOUSE_X"
 kMOUSE_Y           cabbageGetValue   "MOUSE_Y"
 kMOUSE_DOWN_LEFT   cabbageGetValue   "MOUSE_DOWN_LEFT"
 kMOUSE_Xport       portk             kMOUSE_X, 0.1*kMOUSE_DOWN_LEFT
 kMOUSE_Yport       portk             kMOUSE_Y, 0.1*kMOUSE_DOWN_LEFT
    
    
 ; INPUT CONTROL PANELS
 kInput             cabbageGetValue   "Input"            
 if changed:k(kInput)==1 then
                    reinit            RESET_INPUT_VIEWS
 endif
 RESET_INPUT_VIEWS:
  if i(kInput)==3 then
                    cabbageSet        "DustPanel", "visible", 1
                    cabbageSet        "BuzzPanel", "visible", 0
  elseif i(kInput)==4 then
                    cabbageSet        "DustPanel", "visible", 0
                    cabbageSet        "BuzzPanel", "visible", 1
  else
                    cabbageSet        "DustPanel", "visible", 0
                    cabbageSet        "BuzzPanel", "visible", 0
  endif
 rireturn
    
    ; INPUT AUDIO
    if kInput==1 then
     ainL           noise             0.2, 0           ; generate some white noise
     ainR           noise             0.2, 0           ; generate some white noise
    elseif kInput==2 then
     ainL           pinker                             ; generate some white noise
     ainR           pinker                             ; generate some white noise
    elseif kInput==3 then
     kDustFreq      cabbageGetValue   "DustFreq"
     aDust          dust2             1, kDustFreq     ; generate some white noise
     kpan           random            0, 1
     ainL,ainR      pan2              aDust, kpan

     ainR           delay             ainL, 0.05
    elseif kInput==4 then
     kBuzzFreq      cabbageGetValue   "BuzzFreq"
     kBuzzTone      cabbageGetValue   "BuzzTone"
     ainL           vco2              0.2, kBuzzFreq, 4, 0.0001
     iCos           ftgen             0,0,131072,11,1
     ainL           gbuzz             0.2, kBuzzFreq, int((sr*0.5) / kBuzzFreq), 0, portk(kBuzzTone,linseg:k(0,0.01,0.05)), iCos
     ainR           =                 ainL
    elseif kInput==5 then
     ainL, ainR     ins                                ; real-time audio in
    else
     ainL           =                 gaFileL
     ainR           =                 gaFileR
    endif
    gaFileL         =                 0
    gaFileR         =                 0
    
    kChannels       cabbageGetValue   "Channels"                                       ; n. channels, mono(L)/stereo
    if kChannels==1 then
     ainR           =                 ainL
    endif
    
    kMix            cabbageGetValue   "Mix"                                            ; mix of unfiltered signal into the output

    ; BPF/BRF CONTROLS
    kCF             =                 int(cabbageGetValue:k("CF") * iTabLen-1)           ; centre frequency (bandpass/bandreject mode)
    kCF             init              0.1 * 512                                          ; initialise centre frequency to prevent a zero
    kBW             =                 int(cabbageGetValue:k("BW") * iTabLen-1)           ; bandwidth (bandpass/bandreject mode)
    kCF1            =                 int(limit:k(kCF - kBW*0.5 + 1, 0, iTabLen-1))      ; start point of band
    kCF2            =                 int(limit:k(kCF + kBW*0.5 + 1, kCF1+1, iTabLen-1)) ; end point of band
    kBW             =                 kCF2 - kCF1
    kSlope          cabbageGetValue   "Slope"
    kCurve          cabbageGetValue   "Curve"

    ; LPHP CONTROLS
    kLPHPCF         =                 int(cabbageGetValue:k("LPHPCF") * iTabLen-1)
    kLPHPCF         limit             kLPHPCF, 1, iTabLen-1
    kLPHPRollOff    cabbageGetValue   "LPHPRollOff"
    kLPHPCurve      cabbageGetValue   "LPHPCurve"
    
    ; BP BR II CONTROLS
    kBPBRII1        =                 int(cabbageGetValue:k("BPBRII1") * iTabLen-1)
    kBPBRII2        limit             int(cabbageGetValue:k("BPBRII2") * iTabLen-1), kBPBRII1+1, iTabLen
    kLPHPCF         limit             kLPHPCF, 1, iTabLen-1
    kBPBRIISlope    cabbageGetValue   "BPBRIISlope"
    kBPBRIICurve    cabbageGetValue   "BPBRIICurve"

    kTabMode        cabbageGetValue   "TabMode"
    kTabMode        init              1

    ; Graph bounds
    iGraphBounds[]  cabbageGet        "ampFFT", "bounds"
    iGraphX         =                 iGraphBounds[0]
    iGraphY         =                 iGraphBounds[1]
    iGraphWid       =                 iGraphBounds[2]
    iGraphHei       =                 iGraphBounds[3]

    ; DRAW FREE
    if kTabMode==iDrawFree then
     if kMOUSE_X>=iGraphX && kMOUSE_X<=(iGraphX+iGraphWid) && kMOUSE_Y>=iGraphY && kMOUSE_Y<=(iGraphY+iGraphHei) && kMOUSE_DOWN_LEFT==1 then
      if changed:k(kMOUSE_Xport,kMOUSE_Yport)==1 then
                    tablew            1 - (kMOUSE_Yport-iGraphY)/iGraphHei, (kMOUSE_Xport-iGraphX)/iGraphWid, iDrawFree, 1
                    cabbageSet        1, "tableDrawFree", "tableNumber", iDrawFree
                    tablecopy         iBuffer, iDrawFree

      endif
     endif
     if trigger:k(cabbageGetValue:k("DrawFreeReset"),0.5,0)==1 then              ; reset to flat-silent
                    tablecopy         iDrawFree,iSilence
                    tablecopy         iBuffer,iSilence
                    cabbageSet        1,"tableDrawFree","tableNumber",iDrawFree
     endif
    endif
    
    
    ; capture mask from input
     if kTabMode==iCapture then
      kCapGain      cabbageGetValue   "CapGain"
      fCap          pvsanal           ainL*kCapGain, iFFTSize, iFFTSize/4, iFFTSize, 1   ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
     fCapBlur       pvsblur           fCap, 0.5, 0.5        ; apply smoothing
     iampFFT        ftgen             101, 0, iTabLen, 2, 0 ; initialise table
     kClock         metro             16                    ; throttle widget updates
     kflag          pvsftw            fCap, 101             ; write FFT envelope to table
                    cabbageSet        kClock, "CapFFT", "tableNumber", 101
      kCapture      cabbageGetValue   "Capture" 
      if kCapture==1 then
       fCapGain     pvsgain           fCap, 70              ; apply gain
       kflag        pvsftw            fCapGain, iCapture        
                    cabbageSet        kflag, "tableCapture", "tableNumber", iCapture
                    tablecopy         iBuffer, iCapture
      endif
     endif
     
    ; RIPPLE SINE
    kRippleSineNum  cabbageGetValue   "RippleSineNum"
    kRippleSineOS   cabbageGetValue   "RippleSineOS"
    kRippleSineFreq cabbageGetValue   "RippleSineLFO"
    kRippleSineLFO  phasor            kRippleSineFreq
    kRippleSineOS   +=                kRippleSineLFO*360
    ; RIPPLE ARCH
    kRippleNumII    cabbageGetValue   "RippleNumII"
    kRippleOSII     cabbageGetValue   "RippleOSII"
    kRippleFreqII   cabbageGetValue   "RippleLFOII"
    kRippleLFOII    phasor            kRippleFreqII
    kRippleOSII     +=                kRippleLFOII
    ; RIPPLE SQUARE
    kRippleNumIII   cabbageGetValue   "RippleNumIII"
    kRippleOSIII    cabbageGetValue   "RippleOSIII"
    kRippleFreqIII  cabbageGetValue   "RippleLFOIII"
    kRippleLFOIII   phasor            kRippleFreqIII
    kRippleOSIII    +=                kRippleLFOIII

    ; SHIFTING TABLES WIDGETS
    kShift          cabbageGetValue   "Shift"
    kStart          cabbageGetValue   "Start"
    kEnd            cabbageGetValue   "End"

    ; show/hide tables upon change of choice
    if changed:k(kTabMode)==1 then
     $AllGraphsInvisible
     if kTabMode==iDrawLin then         ; draw linear (tableDrawLin/fn=1)
                    cabbageSet        1,"tableDrawLin", "visible", 1
                    cabbageSet        1,"BlankPanel","toFront"
     elseif kTabMode==iDrawExp then     ; draw exponential (tableDrawExp/fn=2)
                    cabbageSet        1,"tableDrawExp", "visible", 1
                    cabbageSet        1,"BlankPanel","toFront"
     elseif kTabMode==iDrawFree then    ; draw free (tableDrawFree/fn=3)
                    cabbageSet        1,"tableDrawFree","visible",1
                    cabbageSet        1,"DrawFreePanel","toFront"
     elseif kTabMode==iBP then          ; bandpass (table4/fn=4)
                    cabbageSet        1,"tableBP","visible",1
                    cabbageSet        1, "BPBRPanel","toFront"
     elseif  kTabMode==iBR then         ; bandreject (table5/fn=5)
                    cabbageSet        1,"tableBR","visible",1
                    cabbageSet        1, "BPBRPanel","toFront"
     elseif  kTabMode==iLP then         ; Lowpass 6
                     cabbageSet       1, "tableLP","visible",1
                    cabbageSet        1,"LPHPPanel","toFront"
     elseif  kTabMode==iHP then         ; Highpass 7
                    cabbageSet        1, "tableHP","visible",1
                    cabbageSet        1,"LPHPPanel","toFront"
     elseif  kTabMode==iBPII then       ; Bandpass II 8
                    cabbageSet        1, "tableBPII","visible",1
                    cabbageSet        1, "BPBRIIPanel","toFront"
     elseif  kTabMode==iBRII then       ; Bandreject II 9
                    cabbageSet        1, "tableBRII","visible",1
                    cabbageSet        1, "BPBRIIPanel","toFront"
     elseif  kTabMode==iRippleSine then ; ripple sine 10
                    cabbageSet        1, "tableRippleSine","visible",1
                    cabbageSet        1, "RippleSinePanel","toFront"
     elseif  kTabMode==iRippleArch then  ; ripple arch 11
                    cabbageSet        1, "tableRippleArch","visible",1
                    cabbageSet        1, "RippleArchPanel","toFront"
     elseif  kTabMode==iRippleSqu then  ; ripple square 12
                    cabbageSet        1, "tableRippleSqu","visible",1
                    cabbageSet        1, "RippleSquPanel","toFront"
     elseif  kTabMode==iCapture then    ; capture 13
                    cabbageSet        1, "tableCapture","visible",1
                    cabbageSet        1, "CapturePanel","toFront"
     endif
   endif
   
    ; Reinitialise Tables / show/hide control panels
    ;if kClock==1 then
     kTabTrig       changed           kTabMode,kCF,kBW,kSlope,kCurve,kLPHPCF,kLPHPRollOff,kLPHPCurve,kTabMode,kRippleSineNum,kRippleSineOS,kRippleNumII,kRippleOSII,kRippleShapeII,kRippleNumIII,kRippleOSIII,kRippleWidIII,kBPBRII1,kBPBRII2,kBPBRIISlope,kBPBRIICurve
    ;endif
    if kTabTrig==1 then
                    reinit            RESTART_TABLEVIEW
    endif
    RESTART_TABLEVIEW:
    if i(kTabMode)==iDrawLin then     ; draw linear (tableDrawLin/fn=1)
     iMaskTab       =                 iDrawLin
     
    elseif i(kTabMode)==iDrawExp then ; draw exponential (tableDrawExp/fn=2)
     iMaskTab       =                 iDrawExp
     
    elseif i(kTabMode)==iDrawFree then ; draw free (tableDrawFree/fn=3)
     iMaskTab       =                 iDrawFree
          
    elseif i(kTabMode)==iBP then ; bandpass (table4/fn=4)
     ;                                                    val dur       curve val dur                     curve       val dur                    curve val dur                     curve      val                                  
     iBP            ftgen             4, 0, iTabLen, -16, 0,  1+i(kCF1), 0,    0, 1+i(kBW)*0.5*i(kSlope), -i(kCurve), 1,  1+i(kBW)*(1-i(kSlope)), 0,   1,  1+i(kBW)*0.5*i(kSlope), i(kCurve), 0              ; masking function table. Linear frequency values from zero to nyquist
                    cabbageSet        "tableBP", "tableNumber", iBP
     iMaskTab       =                 iBP
     
    elseif  i(kTabMode)==iBR then ; bandreject (table5/fn=5)
     ;                                                    val dur       curve val dur                     curve       val dur                    curve val dur                     curve      val                                  
     iBR            ftgen             5, 0, iTabLen, -16,  1, 1+i(kCF1), 0,    1, 1+i(kBW)*0.5*i(kSlope), -i(kCurve), 0,  1+i(kBW)*(1-i(kSlope)),0,     0, 1+i(kBW)*0.5*i(kSlope), i(kCurve), 1, iTabLen, 0, 1  ; masking function table. Linear frequency values from zero to nyquist
                    cabbageSet        "tableBR", "tableNumber", iBR
     iMaskTab       =                 iBR

    elseif  i(kTabMode)==iLP then ; Lowpass 6
     iLP            ftgen             6, 0, iTabLen, -16,  1, i(kLPHPCF), 0, 1, 1+i(kLPHPRollOff)*(iTabLen), i(kLPHPCurve), 0
                    cabbageSet        "tableLP", "tableNumber", iLP
     iMaskTab       =                 iLP
     
    elseif  i(kTabMode)==iHP then ; Highpass 7
     iHP            ftgen             7, 0, iTabLen, -16,  0, i(kLPHPCF), 0, 0, 1+i(kLPHPRollOff)*(iTabLen), -i(kLPHPCurve), 1, iTabLen, 0, 1
                    cabbageSet        "tableHP", "tableNumber", iHP
     iMaskTab       =                 iHP
     
    elseif  i(kTabMode)==iBPII then ; Bandpass II 8
     iBPII          ftgen             8, 0, iTabLen, -16,  0, i(kBPBRII1), 0, 0, 1+i(kBPBRIISlope)*(iTabLen), -i(kBPBRIICurve), 1, i(kBPBRII2) - (i(kBPBRII1)) - (1+i(kBPBRIISlope)*(iTabLen)) , 0, 1, 1+i(kBPBRIISlope)*(iTabLen), i(kBPBRIICurve), 0, iTabLen, 0, 0
                    cabbageSet        "tableBPII", "tableNumber", iBPII
     iMaskTab       =                 iBPII

    elseif  i(kTabMode)==iBRII then ; Bandreject II 9
     iBPII          ftgen             9, 0, iTabLen, -16,  1, i(kBPBRII1), 0, 1, 1+i(kBPBRIISlope)*(iTabLen), -i(kBPBRIICurve), 0, i(kBPBRII2) - (i(kBPBRII1)) - (1+i(kBPBRIISlope)*(iTabLen)) , 0, 0, 1+i(kBPBRIISlope)*(iTabLen), i(kBPBRIICurve), 1, iTabLen, 0, 1
                    cabbageSet        "tableBRII", "tableNumber", iBRII
     iMaskTab       =                 iBRII

    elseif  i(kTabMode)==iRippleSine then                    ; ripple sine
     iRippleSine    ftgen             10, 0, iTabLen, -19, i(kRippleSineNum), 0.5, -i(kRippleSineOS), 0.5
                    cabbageSet        "tableRippleSine", "tableNumber", iRippleSine
     iMaskTab       =                 iRippleSine

    elseif  i(kTabMode)==iRippleArch then                    ; ripple arch
     iArch          ftgen             201, 0, iTabLen, 16, 0, iTabLen*0.5, -i(kRippleShapeII), 1, iTabLen*0.5, i(kRippleShapeII), 0
     iRippleArch    ftgen             11, 0, iTabLen, 32, iArch, i(kRippleNumII), 1, -i(kRippleOSII)   ; ripple arch
                    cabbageSet        "tableRippleArch", "tableNumber", iRippleArch
     iMaskTab       =                 iRippleArch
    elseif  i(kTabMode)==iRippleSqu then                    ; ripple square
     iSqu           ftgen             202, 0, iTabLen, 7, 1, iTabLen*i(kRippleWidIII), 1, 0, 0, iTabLen*(1-i(kRippleWidIII)), 0
     iRippleSqu     ftgen             12, 0, iTabLen, 32, iSqu, i(kRippleNumIII), 1, -i(kRippleOSIII)   ; ripple square
                    cabbageSet        "tableRippleSqu", "tableNumber", iRippleSqu
     iMaskTab       =                 iRippleSqu
    elseif  i(kTabMode)==iCapture then                    ; capture
     iMaskTab       =                 iCapture
    endif
     kCurrentTab    init              iMaskTab
                    tableicopy        iBuffer, iMaskTab
    rireturn

    ; SHIFTING TABLES
    if changed(kShift,kStart,kEnd,kTabTrig)==1 then
                    ftslice           iBuffer,kCurrentTab,-kShift, 0, 1  ; shift table
                    ftset             kCurrentTab, 0, 0, kStart+1, 1      ; apply start offset
                    ftset             kCurrentTab, 0, kEnd, 0, 1          ; apply end offset
     if kShift>0 then                                                     ; if shifting to the right, erase artefacts below index=0
                    ftset             kCurrentTab, 0, 0, kShift, 1
     endif
     if kShift<0 then                                                     ; if shifting to the left, erase artefacts above
                    ftset             kCurrentTab, 0, iTabLen - abs(kShift) - 1, 0, 1        ; wipe table (removes upper spectrum repeat when shift is negative)
     endif
     
     ; UPDATE ALL TABLES WHEN SHIFT/START/END SETTINGS ARE CHANGED
                    cabbageSet        1, "tableDrawLin", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableDrawExp", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableDrawFree", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableBP", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableBR", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableLP", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableHP", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableBPII", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableBRII", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableRippleSine", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableRippleArch", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableRippleSqu", "tableNumber", kCurrentTab
                    cabbageSet        1, "tableCapture", "tableNumber", kCurrentTab
                    cabbageSet        1, "LimL", "bounds", iGraphX + ((kStart/(iTabLen-1)) * iGraphWid), iGraphY, 2, iGraphHei
                    cabbageSet        1, "LimR", "bounds", iGraphX + iGraphWid - ( (1 - (kEnd/(iTabLen-1))) * iGraphWid), iGraphY, 2, iGraphHei

    endif
    
    
    ; pvsmasking / pvstenciling
    kMaskMode     cabbageGetValue     "MaskMode"
    kStenGain     cabbageGetValue     "StenGain"
    if changed:k(kMaskMode)==1 then
     if kMaskMode==1 then
                  cabbageSet          1,"Mix","visible",1
                  cabbageSet          1,"StenGain","visible",0
     else
                  cabbageSet          1,"Mix","visible",0
                  cabbageSet          1,"StenGain","visible",1
     endif
    endif
    if changed:k(kTabMode)==1 then
                  reinit              RESTART_FILTERS
    endif
    RESTART_FILTERS:
    kSmoothOnOff    cabbageGetValue   "SmoothOnOff"
    kAmpSmooth      cabbageGetValue   "AmpSmooth"
    kFreqSmooth     cabbageGetValue   "FreqSmooth"
    
    f_analL         pvsanal           ainL, iFFTSize, iFFTSize/4, iFFTSize, 1     ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    if kMaskMode==1 then
     f_maskaL       pvsmaska          f_analL, iMaskTab, kMix                     ; APPLY MASKING EQ (left channel)
    else                                                                          ; OR...
     f_maskaL       pvstencil         f_analL, kStenGain, 1, iMaskTab             ; GATING
    endif
    if kSmoothOnOff==1 then
     fSmoothL       pvsmooth          f_maskaL, kAmpSmooth, kFreqSmooth
     aoutL          pvsynth           fSmoothL                                  ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL

    else
     aoutL          pvsynth           f_maskaL                                  ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
    endif
    f_analR         pvsanal           ainR, iFFTSize, iFFTSize/4, iFFTSize, 1   ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    if kMaskMode==1 then
     f_maskaR       pvsmaska          f_analR, iMaskTab, kMix                   ; APPLY MASKING EQ (right channel)
    else                                                                          ; OR...
     f_maskaR       pvstencil         f_analR, kStenGain, 1, iMaskTab           ; GATING
    endif
    if kSmoothOnOff==1 then
     fSmoothR       pvsmooth          f_maskaR, kAmpSmooth, kFreqSmooth
     aoutR          pvsynth           fSmoothR                                  ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
    else
     aoutR          pvsynth           f_maskaR                                  ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
    endif
    
    ; gain scaling and audio output
    kGain           =                 ampdbfs(cabbageGetValue:k("Gain"))
    aoutL           *=                kGain
    aoutR           *=                kGain
                    outs              aoutL, aoutR

 ; SPECTRUM OUT GRAPH
 kdispGain          cabbageGetValue   "dispGain"
 kdispSmooth        cabbageGetValue   "dispSmooth"
 fMix               pvsmix            f_maskaL, f_maskaR                       ; mix L and R channels
 fGain              pvsgain           fMix, kdispGain*kGain                    ; apply gain to fsig
 fBlur              pvsblur           fGain, kdispSmooth, 2                    ; Smooth display
 iampFFT            ftgen             99, 0, iTabLen, 2, 0                     ; initialise table
 kClock             metro             16                                       ; reduce rate of updates
 if  kClock==1 then                                                            ; reduce rate of updates
  kflag             pvsftw            fBlur, 99
 endif
                    cabbageSet        kClock, "ampFFT", "tableNumber", 99 
 
 ; PRINT FREQUENCY AT MOUSE LOCATION
 if changed(kMOUSE_X,kMOUSE_Y)==1 then
  if kMOUSE_X>=iGraphX && kMOUSE_X<=(iGraphX+iGraphWid) && kMOUSE_Y>=iGraphY && kMOUSE_Y<=(iGraphY+iGraphHei) then
   kMOUSEFreq       =                 ((kMOUSE_X-iGraphX)/(iGraphWid)) * (sr/2)
   Sfreq            sprintfk          "%d Hz", kMOUSEFreq

                    cabbageSet        1, "MOUSEFreqID", "visible", 1
   kX               limit             kMOUSE_X+3, iGraphX,iGraphX+iGraphWid-60
   kY               limit             kMOUSE_Y-15, iGraphY,iGraphY+iGraphHei-15
                    cabbageSet        1, "MOUSEFreqID", "bounds", kX, kY, 60, 13
                    cabbageSet        1,"MOUSEFreqID", "text", Sfreq
  else
                    cabbageSet        kClock,"MOUSEFreqID","visible",0
  endif
 endif

 
  
; METERS
if metro:k(16)==1 then
                  reinit              REFRESH_METER
endif
REFRESH_METER:
kres              init                0
kres              limit               kres-0.001,0,1 
kres              peak                aoutL                            
                  cabbageSetValue     "vMeter1", kres

kresR             init                0
kresR             limit               kresR-0.001,0,1 
kresR             peak                aoutR                            
rireturn
                  cabbageSetValue     "vMeter2", kresR
 
endin





instr 2
 ; load file from browse
 gSfilepath       cabbageGetValue     "filename"        ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then                       ; call instrument to update waveform viewer  
                  event               "i",99,0,0
 endif 
 
 gkPlay           cabbageGetValue     "Play"
 if trigger:k(gkPlay,0.5,0)==1 then
                  event               "i",101,0,3600
 endif
 
 gkStop cabbageGetValue "Stop"
                  cabbageSetValue     "Play",0,trigger:k(gkStop,0.5,0)

 gkInskip         cabbageGetValue     "Inskip"
 
    iCapture      ftgen               12, 0, giTabLen, -7, 1, giTabLen, 1    ; capture

endin


; LOAD SOUND FILE
instr    99
 giSource         =                   0
                  cabbageSet          "filer1", "file", gSfilepath
 gkNChans         init                filenchnls:i(gSfilepath)
 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet          "FileName","text",SFileNoExtension
                  cabbageSetValue     "Input", 6
                  cabbageSetValue     "Play", 1
endin


; PLAY SOUND FILE
instr 101
 if gkPlay==0 then
                  turnoff
 endif
 if changed:k(gkInskip)==1 then
                  reinit              RESTART_PLAYBACK
 endif
 RESTART_PLAYBACK:
 if i(gkNChans)==1 then
  gaFileL         diskin2             gSfilepath,1,i(gkInskip)*filelen:i(gSfilepath),1
  gaFileR         =                   gaFileL
 else
  gaFileL,gaFileR diskin2             gSfilepath,1,i(gkInskip)*filelen:i(gSfilepath),1
 endif
endin


</CsInstruments>

<CsScore>
i 1 0 z
i 2 0 z
</CsScore>

</CsoundSynthesizer>