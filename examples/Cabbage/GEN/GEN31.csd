
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN31.csd
; Written by Iain McCurdy, 2024

; This is a simple demonstration of GEN31.
; It is recommended to first gain an understanding of GEN09 as GEN31 is an extension of its functionality.
; GEN09 creates a composite harmonic waveform based on repetitions of a single cycle of a sine wave. 
;  The number of repetitions is defined as 'harmonic number' and the strength and starting phase of each of these components can be varied.
; GEN31 operates in the same way except that the input waveform need not be a sine wave but can be any waveform created using any other GEN routine.
; It is recommended that this be some sort of waveform that is contiguous between the end and start. In this example GEN08, GEN09 and GEN11 are provided as options.
; Therefore GEN31 can be thought of as creating a harmonic series of harmonic waveforms. With some settings and if the frequency of the wave sonification is lowish,
;  the interesting situation of storing a chord in a single function table can be perceived.
; Note that the waveform used by each partial of the GEN31 wave need not be the same. 
;  For the sake of reasonable management, in this example the same waveform is used for all partials.

; The GEN08 option creates a three-segment waveform in which the x-axis crossings and the intervening maxima and minima are randomly modulated.

; GEN09 option
;  The strengths of 8 harmonic partials can be varied using the small vertical sliders. 
;  The partial numbers can also be changed using the small number boxes at the base of each slider (0-99).
;  The small circular buttons beneath each number box invert the polarity of that partial.
;  Ths 'Scl' (scale) slider applies gain to the visual representation of the waveform.

; GEN11 option
; A harmonic waveform is created using the method also used by the gbuzz opcode.
; There are comtrols for:
;  number of partials in the stack
;  lowest partial in the stack (if positive, a cosine wave is used as the basis, if negative, a sine wave is used)
;  power function which governs the spectral envelope across all specified partials

; The output waveform is set up using controls similar to those for the GEN09 input.
;  Normalisation of the created waveform ('NORM') can be toggled on or off.

; Sonification is a simple oscillator. Auditioning of the input waveform and GEN31 output can be selected.
; Amplitude and frequency of the sonification can be adjusted.

; E F F E C T S 
; Chorus         -  on/off of a chorus effect applied to the output sound (no further user controls)  
; Delay          -  on/off of a delay effect applied to the output sound (no further user controls)  
; Reverb         -  on/off of a reverb effect applied to the output sound (no further user controls)  

<Cabbage>
form caption("GEN31"), size(710, 472), pluginId("gn18"), colour("silver"), guiMode("queue")

; border Inputs
image     bounds(  0,  0,710,140), colour("silver"), outlineColour("silver") outlineThickness(3), corners(6), colour(30,30,35)

button   bounds( 10, 10, 60, 20), channel("GEN08"), value(0), text("GEN08","GEN08"), latched(1), radioGroup(1), colour:0(60,60,0), colour:1(255,255,50), fontColour:0(250,250,250), fontColour:1(50,50,50)
button   bounds( 10, 35, 60, 20), channel("GEN09"), value(1), text("GEN09","GEN09"), latched(1), radioGroup(1), colour:0(60,60,0), colour:1(255,255,50), fontColour:0(250,250,250), fontColour:1(50,50,50)
button   bounds( 10, 60, 60, 20), channel("GEN11"), value(0), text("GEN11","GEN11"), latched(1), radioGroup(1), colour:0(60,60,0), colour:1(255,255,50), fontColour:0(250,250,250), fontColour:1(50,50,50)

; GEN08
image     bounds( 80, 10,215,120), colour(0,0,0,0), outlineThickness(3), corners(6), outlineColour("silver"), visible(0), channel("GEN08Panel")
{
label     bounds(  0,  5,215,  13), text("I N P U T   W A V E F O R M"), align("centre")
rslider   bounds( 30, 20, 70, 90), channel("DurRate"), range(0.01,10,1,0.5), text("Rate X"), valueTextBox(1)
rslider   bounds(110, 20, 70, 90), channel("AmpRate"), range(0.01,10,1,0.5), text("Rate Y"), valueTextBox(1)
}


; GEN09
image     bounds( 80, 10,215,120), colour(0,0,0,0), outlineThickness(3), corners(8), outlineColour("silver"), visible(0), channel("GEN09Panel")
{
label     bounds(  0,  5,215,  13), text("I N P U T   W A V E F O R M"), align("centre")
vslider   bounds( 10, 25, 20, 67), channel("P1"), range(0,1,1,0.5)
vslider   bounds( 30, 25, 20, 67), channel("P2"), range(0,1,0,0.5)
vslider   bounds( 50, 25, 20, 67), channel("P3"), range(0,1,0,0.5)
vslider   bounds( 70, 25, 20, 67), channel("P4"), range(0,1,0,0.5)
vslider   bounds( 90, 25, 20, 67), channel("P5"), range(0,1,0,0.5)
vslider   bounds(110, 25, 20, 67), channel("P6"), range(0,1,0,0.5)
vslider   bounds(130, 25, 20, 67), channel("P7"), range(0,1,0,0.5)
vslider   bounds(150, 25, 20, 67), channel("P8"), range(0,1,0,0.5)

nslider   bounds( 10, 85, 20,  20), channel("PN1"), range(0,99,1,1,1)
nslider   bounds( 30, 85, 20,  20), channel("PN2"), range(0,99,2,1,1)
nslider   bounds( 50, 85, 20,  20), channel("PN3"), range(0,99,3,1,1)
nslider   bounds( 70, 85, 20,  20), channel("PN4"), range(0,99,4,1,1)
nslider   bounds( 90, 85, 20,  20), channel("PN5"), range(0,99,5,1,1)
nslider   bounds(110, 85, 20,  20), channel("PN6"), range(0,99,6,1,1)
nslider   bounds(130, 85, 20,  20), channel("PN7"), range(0,99,7,1,1)
nslider   bounds(150, 85, 20,  20), channel("PN8"), range(0,99,8,1,1)

checkbox   bounds( 15,105, 10,  10), channel("INeg1"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds( 35,105, 10,  10), channel("INeg2"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds( 55,105, 10,  10), channel("INeg3"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds( 75,105, 10,  10), channel("INeg4"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds( 95,105, 10,  10), channel("INeg5"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds(115,105, 10,  10), channel("INeg6"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds(135,105, 10,  10), channel("INeg7"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds(155,105, 10,  10), channel("INeg8"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)

vslider   bounds(180, 25, 30,  80), channel("IPGraphGain"), text("Scl"), range(0.1, 1, 0.7)
}

; GEN11
image     bounds( 80, 10,215,120), colour(0,0,0,0), outlineThickness(3), corners(6), outlineColour("silver"), visible(0), channel("GEN11Panel")
{
label     bounds(  0,  5,215, 13), text("I N P U T   W A V E F O R M"), align("centre")
nslider   bounds( 35, 30, 60, 30), channel("NParts"), range(1,200,80,1,1), text("Num Harms")
nslider   bounds( 35, 70, 60, 30), channel("LPart"), range(-99,99,1,1,1), text("Lowest Harm.")
rslider   bounds(115, 30, 70, 70), channel("Pow"), range(0,1,0.6), text("Power")
}

; input waveform gentable
image    bounds(300, 10,400,120), colour("silver"), corners(6)
{
gentable bounds(  2,  2,396,116), tableNumber(1), tableColour("LightBlue"), ampRange(-1,1,1), channel("InputWF"), fill(0)
label    bounds(  4,  4, 60, 14), text("GEN09"), align("left"), channel("IPGen")
image    bounds(  2, 60,396,  1), colour(255,255,255,100) ; X AXIS
}


; border Output
image     bounds(  0,140,710,140), colour("silver"), outlineColour("silver") outlineThickness(3), corners(6), colour(30,30,35)

button   bounds( 10,150, 60, 20), channel("Norm"), value(1), text("NORM","NORM"), latched(1), colour:0(60,60,0), colour:1(255,255,50), fontColour:0(250,250,250), fontColour:1(50,50,50)

; Output waveform
image     bounds( 80,150,215,120), colour(0,0,0,0), outlineThickness(3), corners(8), outlineColour("silver")
{
label     bounds(  0,  5,215,  13), text("O U T P U T   W A V E F O R M"), align("centre")

vslider   bounds( 10, 25, 20, 67), channel("OP1"), range(0,1,0,0.5)
vslider   bounds( 30, 25, 20, 67), channel("OP2"), range(0,1,1,0.5)
vslider   bounds( 50, 25, 20, 67), channel("OP3"), range(0,1,0,0.5)
vslider   bounds( 70, 25, 20, 67), channel("OP4"), range(0,1,1,0.5)
vslider   bounds( 90, 25, 20, 67), channel("OP5"), range(0,1,0,0.5)
vslider   bounds(110, 25, 20, 67), channel("OP6"), range(0,1,0,0.5)
vslider   bounds(130, 25, 20, 67), channel("OP7"), range(0,1,0,0.5)
vslider   bounds(150, 25, 20, 67), channel("OP8"), range(0,1,0,0.5)

nslider   bounds( 10, 85, 20, 20), channel("OPN1"), range(1,99,1,1,1)
nslider   bounds( 30, 85, 20, 20), channel("OPN2"), range(1,99,2,1,1)
nslider   bounds( 50, 85, 20, 20), channel("OPN3"), range(1,99,3,1,1)
nslider   bounds( 70, 85, 20, 20), channel("OPN4"), range(1,99,4,1,1)
nslider   bounds( 90, 85, 20, 20), channel("OPN5"), range(1,99,5,1,1)
nslider   bounds(110, 85, 20, 20), channel("OPN6"), range(1,99,6,1,1)
nslider   bounds(130, 85, 20, 20), channel("OPN7"), range(1,99,7,1,1)
nslider   bounds(150, 85, 20, 20), channel("OPN8"), range(1,99,8,1,1)

checkbox   bounds( 15,105, 10,  10), channel("ONeg1"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds( 35,105, 10,  10), channel("ONeg2"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds( 55,105, 10,  10), channel("ONeg3"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds( 75,105, 10,  10), channel("ONeg4"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds( 95,105, 10,  10), channel("ONeg5"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds(115,105, 10,  10), channel("ONeg6"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds(135,105, 10,  10), channel("ONeg7"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)
checkbox   bounds(155,105, 10,  10), channel("ONeg8"), text("",""), shape("ellipse") colour:0(60,0,0), colour:1(255,100,100)

vslider   bounds(180, 25, 30,  80), channel("OPGraphGain"), text("Scl"), range(0.1, 1, 0.7)
}

; Output gentable
image    bounds(300,150,400,120), colour("silver"), corners(6)
{
gentable bounds(  2,  2,396,116), tableNumber(2), tableColour("LightBlue"), ampRange(-1,1,2), channel("OutputWF"), fill(0)
label    bounds(  4,  4, 60, 14), text("GEN31"), align("left")
image    bounds(  2, 60,396,  1), colour(255,255,255,100) ; X AXIS
}


; border sonification
image     bounds(  0,280,710,110), colour("silver"), outlineColour("silver") outlineThickness(3), corners(6), colour(30,30,35)
{
label     bounds(  0,  5,710,  13), text("S   O   N   I   F   I   C   A   T   I   O   N"), align("centre")

button   bounds( 10, 20, 60, 20), channel("Off"), value(0), text("OFF","OFF"), latched(1), radioGroup(2), colour:0(60,60,0), colour:1(255,255,50), fontColour:0(250,250,250), fontColour:1(50,50,50)
button   bounds( 10, 45, 60, 20), channel("Input"), value(0), text("INPUT","INPUT"), latched(1), radioGroup(2), colour:0(60,60,0), colour:1(255,255,50), fontColour:0(250,250,250), fontColour:1(50,50,50)
button   bounds( 10, 70, 60, 20), channel("Output"), value(1), text("OUTPUT","OUTPUT"), latched(1), radioGroup(2), colour:0(60,60,0), colour:1(255,255,50), fontColour:0(250,250,250), fontColour:1(50,50,50)

hslider  bounds( 90, 70,520,  20), channel("Freq"), text("Freq."), range(1, 2000, 100, 0.5, 0.1), valueTextBox(1)
rslider  bounds(620, 30, 70, 70), channel("Amp"), range(0,1,0.03), text("Amp.")
}




; Effects
image     bounds(  0,390,710, 70), colour("silver"), outlineColour("silver") outlineThickness(3), corners(6), colour(30,30,35)
{
label     bounds(  0,  5,710,  13), text("E   F   F   E   C   T   S"), align("centre")
button   bounds( 15, 30,220, 30), channel("Chorus") text("Chorus","Chorus"), latched(1), colour:0(50,50,50), colour:1(250,250, 50) fontColour:0(100,100,100) fontColour:1(0,0,0), corners(5)
button   bounds(245, 30,220, 30), channel("Delay") text("Delay","Delay"), latched(1),    colour:0(50,50,50), colour:1(250,250, 50) fontColour:0(100,100,100) fontColour:1(0,0,0), corners(5)
button   bounds(475, 30,220, 30), channel("Reverb") text("Reverb","Reverb"), latched(1), colour:0(50,50,50), colour:1(250,250, 50) fontColour:0(100,100,100) fontColour:1(0,0,0), corners(5)
}
label    bounds(  5,459,110, 12), text("Iain McCurdy |2024|"), align("left"), fontColour(20,20,20)

</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-n -dm0 -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =                   2     ; NUMBER OF CHANNELS (1=MONO)
0dbfs              =                   1     ; MAXIMUM AMPLITUDE

giTabLen           =                   1024
giIWfm             ftgen               1, 0, giTabLen, 10, 0
giOWfm             ftgen               2, 0, giTabLen, 10, 1

instr    1

 kGEN08            cabbageGetValue     "GEN08"
 kGEN09            cabbageGetValue     "GEN09"
 kGEN11            cabbageGetValue     "GEN11"
                   cabbageSet          changed:k(kGEN08), "GEN08Panel", "visible", kGEN08
                   cabbageSet          changed:k(kGEN09), "GEN09Panel", "visible", kGEN09
                   cabbageSet          changed:k(kGEN11), "GEN11Panel", "visible", kGEN11
 SGens[]           init                4
 SGens[1]          =                   "GEN08"                 
 SGens[2]          =                   "GEN09"                 
 SGens[3]          =                   "GEN11"                 

                   cabbageSet          changed:k(kGEN08,kGEN09,kGEN11), "IPGen", "text", SGens[kGEN08+kGEN09*2+kGEN11*3]
 ; GEN08
 kspeed            =                   1
 kDurRate          cabbageGetValue     "DurRate"
 kAmpRate          cabbageGetValue     "AmpRate"

 kstr1             rspline             -0.9,0.9,0.1*kAmpRate, kAmpRate
 kstr2             rspline             -0.9,0.9,0.1*kAmpRate, kAmpRate
 kstr3             rspline             -0.9,0.9,0.1*kAmpRate, kAmpRate
 kdur1             rspline             0.01,0.9,0.1*kDurRate, kDurRate
 kdur2             rspline             0.01,0.9,0.1*kDurRate, kDurRate
 kdur3             rspline             0.01,0.9,0.1*kDurRate, kDurRate
 kdur4             rspline             0.01,0.9,0.1*kDurRate, kDurRate
 kdur1,kdur2,kdur3,kdur4 init 0.1
 iftlen            =                   ftlen(giIWfm)

 ktrig metro 256*kGEN08
 if ktrig==1 || changed:k(kGEN08, kGEN09, kGEN11)==1 && kGEN08==1 then
  reinit REBUILD_GEN08 
 endif
 REBUILD_GEN08:
 idursum           =                   i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4)
 idur1             limit               iftlen*(i(kdur1)/idursum), 1, iftlen
 idur2             limit               iftlen*(i(kdur2)/idursum), 1, iftlen
 idur3             limit               iftlen*(i(kdur3)/idursum), 1, iftlen
 idur4             limit               iftlen*(i(kdur4)/idursum), 1, iftlen
 i_                ftgen               giIWfm,0, iftlen, 8, 0, idur1, i(kstr1), idur2, i(kstr2), idur3, i(kstr3), idur4, 0
                   cabbageSet          "InputWF","tableNumber",giIWfm
 rireturn


  
 ; GEN09
 kIPGraphGain      =                   1 / cabbageGetValue:k("IPGraphGain") ; reciprocal of widget output
 kP1               cabbageGetValue     "P1"
 kP2               cabbageGetValue     "P2"
 kP3               cabbageGetValue     "P3"
 kP4               cabbageGetValue     "P4"
 kP5               cabbageGetValue     "P5"
 kP6               cabbageGetValue     "P6"
 kP7               cabbageGetValue     "P7"
 kP8               cabbageGetValue     "P8"
 
 kPN1              cabbageGetValue     "PN1"
 kPN2              cabbageGetValue     "PN2"
 kPN3              cabbageGetValue     "PN3"
 kPN4              cabbageGetValue     "PN4"
 kPN5              cabbageGetValue     "PN5"
 kPN6              cabbageGetValue     "PN6"
 kPN7              cabbageGetValue     "PN7"
 kPN8              cabbageGetValue     "PN8"
 
 kINeg1            =                   cabbageGetValue:k("INeg1") * (-2) + 1
 kINeg2            =                   cabbageGetValue:k("INeg2") * (-2) + 1
 kINeg3            =                   cabbageGetValue:k("INeg3") * (-2) + 1
 kINeg4            =                   cabbageGetValue:k("INeg4") * (-2) + 1
 kINeg5            =                   cabbageGetValue:k("INeg5") * (-2) + 1
 kINeg6            =                   cabbageGetValue:k("INeg6") * (-2) + 1
 kINeg7            =                   cabbageGetValue:k("INeg7") * (-2) + 1
 kINeg8            =                   cabbageGetValue:k("INeg8") * (-2) + 1

 if changed:k(kP1,kP2,kP3,kP4,kP5,kP6,kP7,kP8,kPN1,kPN2,kPN3,kPN4,kPN5,kPN6,kPN7,kPN8,kIPGraphGain,kGEN08,kGEN09,kGEN11,kINeg1,kINeg2,kINeg3,kINeg4,kINeg5,kINeg6,kINeg7,kINeg8)==1 && kGEN09==1 then
  reinit REBUILD_GEN09
 endif
 REBUILD_GEN09:
 i_                ftgen               giIWfm, 0, ftlen(giIWfm), -9, i(kPN1),i(kP1)*i(kINeg1),0, i(kPN2),i(kP2)*i(kINeg2),0, i(kPN3),i(kP3)*i(kINeg3),0, i(kPN4),i(kP4)*i(kINeg4),0, i(kPN5),i(kP5)*i(kINeg5),0, i(kPN6),i(kP6)*i(kINeg6),0, i(kPN7),i(kP7)*i(kINeg7),0, i(kPN8),i(kP8)*i(kINeg8),0
                   cabbageSet          "InputWF","tableNumber",giIWfm
                   cabbageSet          "InputWF","ampRange",-i(kIPGraphGain), i(kIPGraphGain), giIWfm
 rireturn
 
 ; GEN11
 kNParts           cabbageGetValue     "NParts"
 kNParts           init                80
 kLPart            cabbageGetValue     "LPart"
 kPow              cabbageGetValue     "Pow"
 
 if changed:k(kNParts,kLPart,kPow,kGEN08,kGEN09,kGEN11)==1 && kGEN11==1 then
  reinit REBUILD_GEN11
 endif
 REBUILD_GEN11:
 i_                ftgen               giIWfm, 0, ftlen(giIWfm), 11, i(kNParts), i(kLPart), i(kPow)
                   cabbageSet          "InputWF","tableNumber",giIWfm
 rireturn                  

                   cabbageSet          changed:k(kGEN08,kGEN09,kGEN11), "InputWF","tableNumber",giIWfm

 ; create input oscillator waveform
 kOPGraphGain      =                   1 / cabbageGetValue:k("OPGraphGain") ; reciprocal of widget output
 kOP1              cabbageGetValue     "OP1"
 kOP2              cabbageGetValue     "OP2"
 kOP3              cabbageGetValue     "OP3"
 kOP4              cabbageGetValue     "OP4"
 kOP5              cabbageGetValue     "OP5"
 kOP6              cabbageGetValue     "OP6"
 kOP7              cabbageGetValue     "OP7"
 kOP8              cabbageGetValue     "OP8"
 
 kOPN1             cabbageGetValue     "OPN1"
 kOPN2             cabbageGetValue     "OPN2"
 kOPN3             cabbageGetValue     "OPN3"
 kOPN4             cabbageGetValue     "OPN4"
 kOPN5             cabbageGetValue     "OPN5"
 kOPN6             cabbageGetValue     "OPN6"
 kOPN7             cabbageGetValue     "OPN7"
 kOPN8             cabbageGetValue     "OPN8"
 
 kNorm             =                   cabbageGetValue:k("Norm") * (2) - 1
 kNorm             init                1
 kONeg1            =                   cabbageGetValue:k("ONeg1") * (-2) + 1
 kONeg2            =                   cabbageGetValue:k("ONeg2") * (-2) + 1
 kONeg3            =                   cabbageGetValue:k("ONeg3") * (-2) + 1
 kONeg4            =                   cabbageGetValue:k("ONeg4") * (-2) + 1
 kONeg5            =                   cabbageGetValue:k("ONeg5") * (-2) + 1
 kONeg6            =                   cabbageGetValue:k("ONeg6") * (-2) + 1
 kONeg7            =                   cabbageGetValue:k("ONeg7") * (-2) + 1
 kONeg8            =                   cabbageGetValue:k("ONeg8") * (-2) + 1
 
  ; output waveform
 if changed:k(kP1,kP2,kP3,kP4,kP5,kP6,kP7,kP8,kPN1,kPN2,kPN3,kPN4,kPN5,kPN6,kPN7,kPN8,kOP1,kOP2,kOP3,kOP4,kOP5,kOP6,kOP7,kOP8,kOPN1,kOPN2,kOPN3,kOPN4,kOPN5,kOPN6,kOPN7,kOPN8,kOPGraphGain,kNParts,kLPart,kPow,ktrig,kONeg1,kONeg2,kONeg3,kONeg4,kONeg5,kONeg6,kONeg7,kONeg8,kINeg1,kINeg2,kINeg3,kINeg4,kINeg5,kINeg6,kINeg7,kINeg8,kNorm,kGEN08,kGEN09,kGEN11)==1 then
  reinit REBUILD_OUTPUT_WAVEFORM
 endif
 REBUILD_OUTPUT_WAVEFORM:
  i_               ftgen               giOWfm, 0, ftlen(giOWfm), 31*i(kNorm), giIWfm, i(kOPN1), i(kOP1)*i(kONeg1), giIWfm, i(kOPN2), i(kOP2)*i(kONeg2), giIWfm, i(kOPN3), i(kOP3)*i(kONeg3), giIWfm, i(kOPN4), i(kOP4)*i(kONeg4), giIWfm, i(kOPN5), i(kOP5)*i(kONeg5), giIWfm, i(kOPN6), i(kOP6)*i(kONeg6), giIWfm, i(kOPN7), i(kOP7)*i(kONeg7), giIWfm, i(kOPN8), i(kOP8)*i(kONeg8), giIWfm, i(kOPN8), i(kOP8)*i(kONeg8) ; needs an extra 'dummy' term...
                   cabbageSet          "OutputWF","tableNumber",giIWfm
                   cabbageSet          "OutputWF","ampRange",-i(kOPGraphGain), i(kOPGraphGain), giOWfm
 rireturn
 
 
 
 kOff              cabbageGetValue     "Off"
 if kOff==0 then
  kAmp             cabbageGetValue     "Amp"
  kFreq            cabbageGetValue     "Freq"
  kPortTime        linseg              0,0.01,0.05
  kFreq            portk               kFreq, kPortTime
  kfn              =                   cabbageGetValue:k("Output") + 1
  aSig             oscilikt            kAmp, kFreq, kfn
                   outall              aSig
 endif

 ; effects 
    a1 = aSig*(1-kOff)
    a2 = aSig*(1-kOff)
    
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
