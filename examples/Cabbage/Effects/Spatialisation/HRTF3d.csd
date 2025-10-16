
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; HRTF3D.csd
; Written by Iain McCurdy, 2012, 2024.

; 3D rendering of a mono input from the left channel or from a range of test signals.
; Uses head related transfer function transformation (HRTF) and the hrtfmove and hrtfmove2 opcodes.
; Azimuth (horizontal angle with respect to a front-facing listener) and elevation (vertical angle)
;  are both specified in degrees and can be controlled using the left XY pad control

; The right XY pad is for display only.

; The user can choose between two opcodes, hrtfmove and hrtfmove2, each of which operates on a slightly different principle
;  and offers different optional arguents for fine tuning. 

; hrtfmove
; --------
; Mode - chooses between 'phase truncation' and 'minimum phase'
; Fade - number of processing buffers for phase change crossfade

; hrtfmove2
; ---------
; N STFT Overlaps - (number of short time fourier transform overlaps)  - larger numbers provide smoother 
;  interpolation at the expense of computation speed
; Head radius (in cm) varies the interaural time delay and is particularly impactful on lower frequencies.
;  the default is 9 cm which is the average for an adult human.

; The XYpad on the right attempts to visualise the movement (left-right, up-down, near-far) 
;   of the source sound.
; Brightness of the source sound widget (red circle) varies according to the intensity of the input signal.
; Size of the source sound widget reflects distance front to back.

<Cabbage>
form caption("HRTF 3D"), size(800, 510), pluginId("HRTF"), colour(0,0,0) guiMode("queue")
xypad bounds(0,  0, 400, 400), channel("Az","Elev"), text("X=Azimuth (degs) | Y=Elev. (degs)"), rangeX(-180,  180,   0), rangeY(-40, 90, 0)

image bounds(500,180,  30, 30), colour(200,50,50), shape("ellipse"), channel("SoundSource")

image bounds(560,145,100,100) colour(0,0,0,0) channel("Face") {
image bounds(   2,  0,  81, 100), colour(200,200,150), shape("ellipse")
image bounds(   0, 30,   6,  30), colour(200,200,150), shape("ellipse")
image bounds(  79, 30,   6,  30), colour(200,200,150), shape("ellipse")
image bounds(   20,  33,  20,  10), colour(10,10,10), shape("ellipse")
image bounds(   50,  33,  20,  10), colour(10,10,10), shape("ellipse")

image bounds(   38,  55,  15,   6), colour(10,10,10), shape("ellipse")
image bounds(   38,  52,  15,   6), colour(200,200,150), shape("ellipse")


image bounds(   25,  65,  40,  12), colour(10,10,10), shape("ellipse")
image bounds(   25,  62,  40,   8), colour(200,200,150)
}

image bounds(  0,400,800, 45), colour(40,40,40), outlineThickness(2), outlineColour("Silver")
{
label    bounds( 10, 15, 60, 15), text("Source:"), align("right")
combobox bounds( 75, 12,100, 22), channel("Source"), items("Live Input","Sine Tone","Pulse Wave","Noise","Clicks"), value(2)
label    bounds(215, 15, 60, 15), text("Opcode:"), align("right")
combobox bounds(280, 12,100, 22), channel("Opcode"), items("hrtfmove","hrtfmove2"), value(2)
}

image bounds(  0,445,800, 45), colour(40,40,40), outlineThickness(2), outlineColour("Silver") channel("hrtfmove"), visible(0)
{
label    bounds( 10, 15, 50, 15), text("Mode:"), align("right")
combobox bounds( 65, 12,150, 22), channel("Mode"), items("Phase Truncation","Minimum Phase"), value(1)
hslider  bounds(245, 10,390, 30), channel("Fade"), text("Fade"), range(1,25,8,1,1) valueTextBox(1)
}

image bounds(  0,445,800, 45), colour(40,40,40), outlineThickness(2), outlineColour("Silver") channel("hrtfmove2"), visible(1)
{
hslider  bounds( 10, 10,390, 30), channel("HeadRadius"), text("Head Radius (cm)"), range(1,30,9) valueTextBox(1)
hslider  bounds(405, 10,390, 30), channel("Overlaps"), text("N. STFT Overlaps"), range(2,16,4,1,1) valueTextBox(1)
}

label      bounds(  5,493,110, 12), text("Iain McCurdy |2024|"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps    =     16
nchnls   =     2
0dbfs    =     1

;Author: Iain McCurdy (2012, 2024)

instr    1

kAz        cabbageGetValue        "Az"                                  ; READ WIDGETS...
kElev      cabbageGetValue        "Elev"

kSource,kTSource    cabbageGetValue        "Source"
kOpcode,kTOpcode    cabbageGetValue        "Opcode"
kMode,kTMode        cabbageGetValue        "Mode"
kFade,kTFade        cabbageGetValue        "Fade"

; toggle visibility for hrftmove/hrtfmove2 optional argument widgets
cabbageSet changed:k(kOpcode), "hrtfmove", "visible", 1-(kOpcode-1)
cabbageSet changed:k(kOpcode), "hrtfmove2", "visible", kOpcode-1

; choose source
if kSource==1 then                    ; live input
 asrc       inch                    1
elseif kSource==2 then                ; sine tone
 asrc       poscil        0.2,440
elseif kSource==3 then                ; pulse
 asrc       vco2          0.2,cpsmidinn(rspline:k(24,60,0.2,0.3)),2,0.1
elseif kSource==4 then                ; white noise
 asrc       noise         0.1, 0
else                                  ; clicks
 asrc       mpulse        0.5, 0.5
endif

; use the appropriate data set according to the sample rate used by Csound
if sr==44100 then
 SdataL = "hrtf-44100-left.dat"
 SdataR = "hrtf-44100-right.dat"
elseif sr==48000 then
 SdataL = "hrtf-48000-left.dat"
 SdataR = "hrtf-48000-right.dat"
else
 SdataL = "hrtf-96000-left.dat"
 SdataR = "hrtf-96000-right.dat"
endif

kHeadRadius, kTHeadRadius cabbageGetValue "HeadRadius"
kHeadRadius               init            9
kOverlaps, kTOverlaps     cabbageGetValue "Overlaps"
kOverlaps                 init            4

if (kTHeadRadius+kTOverlaps+kTOpcode+kTMode+kTFade)>0 then ; trigger a reinit
 reinit RESTART
endif
RESTART:
if i(kOpcode)==1 then
 aleft, arig hrtfmove    asrc, kAz, kElev, SdataL, SdataR, i(kMode)-1, i(kFade), sr
else
 aleft, arig hrtfmove2    asrc, kAz, kElev, SdataL, SdataR, i(kOverlaps), i(kHeadRadius), sr
endif
rireturn
           outs          aleft, arig                       ; SEND AUDIO TO OUTPUTS

; visualisation
kRMS       rms           asrc
kX         mirror        kAz/90, -1, 1
kSize      =             (180 - abs(kAz))/180
kSizeE     =             (180 - abs(kElev))/180

; front/back
kFB        =             round(kSize>0.5?1:0)

           cabbageSet    changed:k(kAz,kElev), "SoundSource", "bounds", kX*180 + 590, 180 - kElev*2, 15 + kSize*30*kSizeE, 15 + kSize*30*kSizeE
           cabbageSet    changed:k(kRMS), "SoundSource", "colour", 100 + kRMS*55*4, 10 + kRMS*205*4, 10 + kRMS*205*4
           cabbageSet    trigger:k(kFB,0.5,0), "SoundSource", "toFront"
           cabbageSet    trigger:k(kFB,0.5,1), "Face", "toFront"

endin
        
</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>