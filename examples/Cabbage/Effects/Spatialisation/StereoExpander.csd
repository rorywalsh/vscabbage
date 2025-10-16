
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; StereoExpander.csd
; Written by Iain McCurdy, 2024

; Expands a stereo recording into an arbitrary number of channels	

; Input sound file should be a 2-channel interleaved file

; Speaker locations are indicated as numbered blue squares
; The four spokes indicate the direction in which the original four channels are directed
; The numbered white circles on the spokes indicate the channel number of the sound file to which that spoke relates.

; Each of the 8 speakers can be:
;  Turned on and off
;  Its azimuth angle adjusted.
;  The entire speaker arrangement can be rotated using the arrowed buttons
  
; Spread - bleeds the signal from each channel into neighbouring outputs. 
;           Increasing this will weaken the sense of localisation of sounds in the original recording but can also prevent holes in the 
;           multi-speaker image.

; Rotate Stereo - rotates the orientation of the stereo array.
; Width         - angle of separation for how the stereo source is projected into the multi-channel array

; LFE Channel  - selects the speaker to which LFE audio is sent.
;                 LFE audio is a mix of all four channels.
; On/Off       - the LFE channel can also be turned on and off

; Preset       - for convenience, a range of common speaker set ups can be dialed in using selected presets.
;                Presets affect speaker azimuths, on/off status and LFE channel

; Open File    - browse for input sound file (must be 4-channel interleaved wav)
; PLAY         - play/stop sound file
; M,M,M,M      - mute individual tracks in the source file
; In-Skip      - location within the source sound file from which to begin playback

; Output angles of the four channels of the source sound file in the expanded output. These will correspond to angles of the four spokes.

<Cabbage>
form caption("Stereo Expander") size(945,640), pluginId("IRT1"), guiMode("queue"), colour(50,50,50)

image bounds( 15, 15,400,400), colour(0,0,0,0)
{
; XY panel
image bounds(  0, 0,400,400), colour(40,40,40), channel("panel"), outlineThickness(1), outlineColour("DarkGrey"), corners(200) ; xy panel

; LABEL
label bounds(  -100,-150,600,600), text("∞"), fontColour("white"), alpha(0.04), colour(0,0,0,0)

; axes
image    bounds( 200,  0,  1,200), channel("AxisL"), rotate(-0.785,  0,200), colour("DarkGrey")
image    bounds( 200,  0,  1,200), channel("AxisR"), rotate( 0.785,  0,200), colour("DarkGrey")

; speakers
label    bounds(-100,192, 16, 16), channel("Spk1"), alpha(0.5), text("1"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk2"), alpha(0.5), text("2"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk3"), alpha(0.5), text("3"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk4"), alpha(0.5), text("4"), fontColour("white"), colour("Blue"), visible(0)
label    bounds(-100,192, 16, 16), channel("Spk5"), alpha(0.5), text("5"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk6"), alpha(0.5), text("6"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk7"), alpha(0.5), text("7"), fontColour("white"), colour("Blue"), visible(0)
label    bounds(-100,192, 16, 16), channel("Spk8"), alpha(0.5), text("8"), fontColour("white"), colour("Blue"), visible(0)

; audio outputs
label    bounds(120,120, 20, 20), channel("Aud1"), alpha(0.5), text("L"), fontColour("white"), colour(255,255,255,100), corners(10)
label    bounds(260,120, 20, 20), channel("Aud2"), alpha(0.5), text("R"), fontColour("white"), colour(255,255,255,100), corners(10)
}

image    bounds(430, 10,510,800), colour(0,0,0,0)
{
; speakers set-up
image    bounds(  0,  0,100,100), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,100, 25), text("1")
checkbox bounds( 15, 40, 70, 12), channel("OnOff1"), text("On/Off"), value(1), shape("ellipse")
nslider  bounds( 15, 60, 70, 30), channel("azim1"), text("Azim.1"), range(-360,360,-45)
}
image    bounds(110,  0,100,100), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,100, 25), text("2")
checkbox bounds( 15, 40, 70, 12), channel("OnOff2"), text("On/Off"), value(1), shape("ellipse")
nslider  bounds( 15, 60, 70, 30), channel("azim2"), text("Azim.2"), range(-360,360,45)
}
image    bounds(220,  0,100,100), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,100, 25), text("3")
checkbox bounds( 15, 40, 70, 12), channel("OnOff3"), text("On/Off"), value(1), shape("ellipse")
nslider  bounds( 15, 60, 70, 30), channel("azim3"), text("Azim.3"), range(-360,360,-0)
}
image    bounds(330,  0,100,100), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,100, 25), text("4")
checkbox bounds( 15, 40, 70, 12), channel("OnOff4"), text("On/Off"), value(0), shape("ellipse")
nslider  bounds( 15, 60, 70, 30), channel("azim4"), text("Azim.4"), range(-360,360,67.5)
}

image    bounds(  0,110,100,100), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,100, 25), text("5")
checkbox bounds( 15, 40, 70, 12), channel("OnOff5"), text("On/Off"), value(1), shape("ellipse")
nslider  bounds( 15, 60, 70, 30), channel("azim5"), text("Azim.5"), range(-360,360,225)
}
image    bounds(110,110,100,100), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,100, 25), text("6")
checkbox bounds( 15, 40, 70, 12), channel("OnOff6"), text("On/Off"), value(1), shape("ellipse")
nslider  bounds( 15, 60, 70, 30), channel("azim6"), text("Azim.6"), range(-360,360,135)
}
image    bounds(220,110,100,100), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,100, 25), text("7")
checkbox bounds( 15, 40, 70, 12), channel("OnOff7"), text("On/Off"), value(0), shape("ellipse")
nslider  bounds( 15, 60, 70, 30), channel("azim7"), text("Azim.7"), range(-360,360,-157.5)
}
image    bounds(330,110,100,100), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,100, 25), text("8")
checkbox bounds( 15, 40, 70, 12), channel("OnOff8"), text("On/Off"), value(0), shape("ellipse")
nslider  bounds( 15, 60, 70, 30), channel("azim8"), text("Azim.8"), range(-360,360,157.5)
}

label   bounds(445, 80, 51, 13), text("ROTATE"), align("centre")
button  bounds(445, 95, 25, 25), channel("DecrAz"), text("<"), latched(0), corners(12)
button  bounds(472, 95, 25, 25), channel("IncrAz"), text(">"), latched(0), corners(12)

hslider  bounds(  0,220,510, 15), channel("spread"), text("Spread"), range(0,100,0,1,1), valueTextBox(1)
hslider  bounds(  0,250,510, 15), channel("RotateStereo"), text("Rotate Stereo"), range(-360,360,0,1,0.1), valueTextBox(1)
hslider  bounds(  0,280,510, 15), channel("StereoWidth"), text("Stereo Width"), range(0,360,90,1,1), valueTextBox(1)

label    bounds(  0,310, 90, 14), text("LFE Channel"), align("centre")
combobox bounds(  0,325, 90, 20), channel("LFEChan"), items("1","2","3","4","5","6","7","8","9","10","11","12","13","14","15","16"), value(4), align("centre")
checkbox bounds(  0,350, 90, 12), channel("OnOffLFE"), text("On/Off"), value(1), shape("ellipse")

label    bounds(  0,370, 90, 14), text("Preset"), align("centre")
combobox bounds(  0,385, 90, 20), channel("Preset"), items("5.1 Quad","5.1 Standard","7.1 Quad","7.1 Standard","Quad","Oct.Pairs","Acousmonium","Oct. Ring 1",,"Oct. Ring 2","5.1 Equi."), value(1), align("centre")


; meters
image   bounds(110,305,420,132), colour(0,0,0,0)
{
vmeter  bounds(  0,  5, 20, 85) channel("VUMeter1") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 30,  5, 20, 85) channel("VUMeter2") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 60,  5, 20, 85) channel("VUMeter3") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 90,  5, 20, 85) channel("VUMeter4") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds(120,  5, 20, 85) channel("VUMeter5") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds(150,  5, 20, 85) channel("VUMeter6") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds(180,  5, 20, 85) channel("VUMeter7") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds(210,  5, 20, 85) channel("VUMeter8") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds(250,  5, 20, 85) channel("VUMeter9") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
label   bounds(  0, 90, 20, 12), text("1")
label   bounds( 30, 90, 20, 12), text("2")
label   bounds( 60, 90, 20, 12), text("3")
label   bounds( 90, 90, 20, 12), text("4")
label   bounds(120, 90, 20, 12), text("5")
label   bounds(150, 90, 20, 12), text("6")
label   bounds(180, 90, 20, 12), text("7")
label   bounds(210, 90, 20, 12), text("8")
label   bounds(250, 90, 20, 12), text("LFE")

vslider bounds(275,  0, 65,103), channel("MeterGain"), text("Mtr.Gain"), range(1,20,1,0.5)
vslider bounds(330,  0, 65,103), channel("OutGain"), text("Out Gain"), range(0,4,1,0.5)

}
}

; file player
image bounds( 10,430,930,210) colour(0,0,0,0)
{
filebutton bounds(  0,  5, 70, 70), text("OPEN FILE","OPEN FILE"), fontColour("white") channel("filename"), corners(35), fontColour:0("silver"), colour:0(50,50,100), colour:1(50,50,100)
button     bounds(  0, 85, 70, 70), text("PLAY","STOP"), fontColour("white") channel("Play"), latched(1), corners(35), fontColour:0("lime"), colour:0(10,55,10), colour:1(200,70,70)
soundfiler bounds(110,  0,750,160), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
image      bounds(110,  0,  1,160), channel("wiper")
label      bounds(112,  3,750, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
hslider    bounds(105,165,760, 20), channel("inskip"), range(0,1,0)
label      bounds(105,185,760, 14), text("In-Skip")
button     bounds( 77, 31, 26, 26), text("M","M"), fontColour("white") channel("Mute1"), latched(1), corners(35), fontColour:0("white"), fontColour:1("black"), colour:0(70,70,0), colour:1(255,255,0)
button     bounds( 77, 97, 26, 26), text("M","M"), fontColour("white") channel("Mute2"), latched(1), corners(35), fontColour:0("white"), fontColour:1("black"), colour:0(70,70,0), colour:1(255,255,0)

nslider    bounds(865, 31, 70, 26), channel("ChnAz1"), range(-360,360,0,1,1)
nslider    bounds(865, 97, 70, 26), channel("ChnAz2"), range(-360,360,0,1,1)

label      bounds(115, 34, 20, 20), channel("Chn1"), alpha(0.5), text("L"), fontColour("black"), colour(255,255,255), corners(10)
label      bounds(115,100, 20, 20), channel("Chn2"), alpha(0.5), text("R"), fontColour("black"), colour(255,255,255), corners(10)
}

label      bounds(  5,625,690, 12), text("Iain McCurdy |2024|"), align("left")

</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-n -dm0
</CsOptions>

<CsInstruments>
ksmps  = 64
nchnls = 32
0dbfs  = 1

gaFile1,gaFile2   init                0

; presets
;                                                 visible          az.1   2     3      4      5       6      7       8        on/off           LFEChan LFEonOff
i_                ftgen               1,0,-26,-2, 1,1,1,0,1,1,0,0, -45,   45,   0,     0,     135,    225,   0,      0,       1,1,1,0,1,1,0,0, 4,      1 ; 5.1 quad
i_                ftgen               2,0,-26,-2, 1,1,1,0,1,1,0,0, -30,   30,   0,     0,    -120,    120,   0,      0,       1,1,1,0,1,1,0,0, 4,      1 ; 5.1 standard
i_                ftgen               3,0,-26,-2, 1,1,1,0,1,1,1,1, -45,   45,   0,     0,     -90,    90,    -135,   135,     1,1,1,0,1,1,1,1, 4,      1 ; 7.1 quad
i_                ftgen               4,0,-26,-2, 1,1,1,0,1,1,1,1, -30,   30,   0,     0,     -90,    90,    -150,   150,     1,1,1,0,1,1,1,1, 4,      1 ; 7.1 standard
i_                ftgen               5,0,-26,-2, 1,1,1,1,0,0,0,0, -45,   45,-135,   135,     -90,    90,    -145,   145,     1,1,1,1,0,0,0,0, 4,      0 ; quad
i_                ftgen               6,0,-26,-2, 1,1,1,1,1,1,1,1, -22.5, 22.5, -67.5, 67.5,  -112.5, 112.5, -157.5, 157.5,   1,1,1,1,1,1,1,1, 12,     1 ; octophonic pairs
i_                ftgen               7,0,-26,-2, 1,1,1,1,1,1,1,1, -15,   15,   -45,   45,    -90,    90,    -135,   135,     1,1,1,1,1,1,1,1, 12,     1 ; acousmonium
i_                ftgen               8,0,-26,-2, 1,1,1,1,1,1,1,1,   0,   45,   90,    135,   180,    225,   270,    315,     1,1,1,1,1,1,1,1, 12,     1 ; oct ring 1
i_                ftgen               9,0,-26,-2, 1,1,1,1,1,1,1,1, -22.5, 22.5, 67.5,  112.5, 157.5,  202.5, 247.5,  292.500, 1,1,1,1,1,1,1,1, 12,     1 ; oct ring 2
i_                ftgen               10,0,-26,-2,1,1,1,0,1,1,0,0, -72,   72,   0,     0,    -144,    144,   0,      0,       1,1,1,0,1,1,0,0, 4,      1 ; 5.1 equi.

instr 1
 ; bug workaround, 0 degrees doesn't show
                  cabbageSetValue     "azim3", 1

 ; load file from browse
 gSfilepath       cabbageGetValue     "filename"  ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then              ; call instrument to update waveform viewer  
                  event               "i",99,0,0
 endif 
 
 ; load presets
 kPreset          cabbageGetValue     "Preset"
 if changed:k(kPreset)==1 then
                  event               "i",201,0,0,kPreset
 endif
 
 ; play sound file
 gkPlay           cabbageGetValue     "Play"
 if trigger:k(gkPlay,0.5,0) == 1 then
                  event               "i",101,0,3600
 endif

; move speakers
kwidth            cabbageGetValue     "width"
kazim1            cabbageGetValue     "azim1"
kazim2            cabbageGetValue     "azim2"
kazim3            cabbageGetValue     "azim3"
kazim4            cabbageGetValue     "azim4"
kazim5            cabbageGetValue     "azim5"
kazim6            cabbageGetValue     "azim6"
kazim7            cabbageGetValue     "azim7"
kazim8            cabbageGetValue     "azim8"
                  cabbageSet          changed:k(kazim1), "Spk1", "bounds",  192 + (193*sin(kazim1*$M_PI/180)),192 - (193*cos(kazim1*$M_PI/180)), 16, 16
                  cabbageSet          changed:k(kazim2), "Spk2", "bounds",  192 + (193*sin(kazim2*$M_PI/180)),192 - (193*cos(kazim2*$M_PI/180)), 16, 16
                  cabbageSet          changed:k(kazim3), "Spk3", "bounds",  192 + (193*sin(kazim3*$M_PI/180)),192 - (193*cos(kazim3*$M_PI/180)), 16, 16
                  cabbageSet          changed:k(kazim4), "Spk4", "bounds",  192 + (193*sin(kazim4*$M_PI/180)),192 - (193*cos(kazim4*$M_PI/180)), 16, 16
                  cabbageSet          changed:k(kazim5), "Spk5", "bounds",  192 + (193*sin(kazim5*$M_PI/180)),192 - (193*cos(kazim5*$M_PI/180)), 16, 16
                  cabbageSet          changed:k(kazim6), "Spk6", "bounds",  192 + (193*sin(kazim6*$M_PI/180)),192 - (193*cos(kazim6*$M_PI/180)), 16, 16
                  cabbageSet          changed:k(kazim7), "Spk7", "bounds",  192 + (193*sin(kazim7*$M_PI/180)),192 - (193*cos(kazim7*$M_PI/180)), 16, 16
                  cabbageSet          changed:k(kazim8), "Spk8", "bounds",  192 + (193*sin(kazim8*$M_PI/180)),192 - (193*cos(kazim8*$M_PI/180)), 16, 16

; rotate speaker array buttons
kDecrAz           cabbageGetValue     "DecrAz"
kIncrAz           cabbageGetValue     "IncrAz"
kAzTimer          metro               16        ; speed of rotation of speaker array if buttons are used
iAzStep = 0.5                                   ; rotation increment (also impacts speed of rotation)
if kDecrAz==1 then                                                   ; anticlockwise rotate
                  cabbageSetValue     "azim1", kazim1-iAzStep, kAzTimer
                  cabbageSetValue     "azim2", kazim2-iAzStep, kAzTimer
                  cabbageSetValue     "azim3", kazim3-iAzStep, kAzTimer
                  cabbageSetValue     "azim4", kazim4-iAzStep, kAzTimer
                  cabbageSetValue     "azim5", kazim5-iAzStep, kAzTimer
                  cabbageSetValue     "azim6", kazim6-iAzStep, kAzTimer
                  cabbageSetValue     "azim7", kazim7-iAzStep, kAzTimer
                  cabbageSetValue     "azim8", kazim8-iAzStep, kAzTimer
elseif kIncrAz==1 then                                               ; clockwise rotate
                  cabbageSetValue     "azim1", kazim1+iAzStep, kAzTimer
                  cabbageSetValue     "azim2", kazim2+iAzStep, kAzTimer
                  cabbageSetValue     "azim3", kazim3+iAzStep, kAzTimer
                  cabbageSetValue     "azim4", kazim4+iAzStep, kAzTimer
                  cabbageSetValue     "azim5", kazim5+iAzStep, kAzTimer
                  cabbageSetValue     "azim6", kazim6+iAzStep, kAzTimer
                  cabbageSetValue     "azim7", kazim7+iAzStep, kAzTimer
                  cabbageSetValue     "azim8", kazim8+iAzStep, kAzTimer
endif


; rotate axes
kRotateStereo,kT1 cabbageGetValue     "RotateStereo"
kStereoWidth,kT2  cabbageGetValue     "StereoWidth"
kaz1              =                   kRotateStereo - (kStereoWidth*0.5)
kaz2              =                   kRotateStereo + (kStereoWidth*0.5)
                  cabbageSet          kT1+kT2, "AxisL", "rotate", ((kaz1/360) * 2 * $M_PI),   0,200
                  cabbageSet          kT1+kT2, "AxisR", "rotate", ((kaz2/360) * 2 * $M_PI),   0,200

; rotate channel indicators on the spokes
                  cabbageSet          kT1+kT2, "Aud1", "bounds",  190 + (100*sin(kaz1*$M_PI/180)),190 - (100*cos(kaz1*$M_PI/180)), 20, 20
                  cabbageSet          kT1+kT2, "Aud2", "bounds",  190 + (100*sin(kaz2*$M_PI/180)),190 - (100*cos(kaz2*$M_PI/180)), 20, 20

; build speaker array
idim              =                   2  ; number of dimensions
ilsnum            =                   8  ; number of speakers
if changed:k(kazim1,kazim2,kazim3,kazim4,kazim5,kazim6,kazim7,kazim8)==1 then
                  reinit              REBUILD_SPEAKER_DEF
endif
REBUILD_SPEAKER_DEF:
                  vbaplsinit          idim, ilsnum, i(kazim1), i(kazim2), i(kazim3), i(kazim4), i(kazim5), i(kazim6), i(kazim7), i(kazim8)

; CALCULATE OUTPUTS USING vbap
kel               =                   0
kspread           cabbageGetValue     "spread"        ; spill between speakers

;kRotateStereo       port                kRotateStereo, 0.05

; channel 1
a1_1,a1_2,a1_3,a1_4,a1_5,a1_6,a1_7,a1_8 vbap gaFile1, kaz1 , kel, kspread
                  cabbageSetValue     "ChnAz1",kaz1

; channel 2
                  cabbageSetValue     "ChnAz2",kaz2
a2_1,a2_2,a2_3,a2_4,a2_5,a2_6,a2_7,a2_8 vbap gaFile2, kaz2 , kel, kspread

rireturn

; OUTPUT MAIN SPEAKERS
; on/off switches
kOnOff1,kT1       cabbageGetValue     "OnOff1"
kOnOff2,kT2       cabbageGetValue     "OnOff2"
kOnOff3,kT3       cabbageGetValue     "OnOff3"
kOnOff4,kT4       cabbageGetValue     "OnOff4"
kOnOff5,kT5       cabbageGetValue     "OnOff5"
kOnOff6,kT6       cabbageGetValue     "OnOff6"
kOnOff7,kT7       cabbageGetValue     "OnOff7"
kOnOff8,kT8       cabbageGetValue     "OnOff8"
                  cabbageSet          kT1, "Spk1", "visible", kOnOff1
                  cabbageSet          kT2, "Spk2", "visible", kOnOff2
                  cabbageSet          kT3, "Spk3", "visible", kOnOff3
                  cabbageSet          kT4, "Spk4", "visible", kOnOff4
                  cabbageSet          kT5, "Spk5", "visible", kOnOff5
                  cabbageSet          kT6, "Spk6", "visible", kOnOff6
                  cabbageSet          kT7, "Spk7", "visible", kOnOff7
                  cabbageSet          kT8, "Spk8", "visible", kOnOff8
; mix 8 outputs
a1                =                   sum:a(a1_1,a2_1) * kOnOff1
a2                =                   sum:a(a1_2,a2_2) * kOnOff2
a3                =                   sum:a(a1_3,a2_3) * kOnOff3
a4                =                   sum:a(a1_4,a2_4) * kOnOff4
a5                =                   sum:a(a1_5,a2_5) * kOnOff5
a6                =                   sum:a(a1_6,a2_6) * kOnOff6
a7                =                   sum:a(a1_7,a2_7) * kOnOff7
a8                =                   sum:a(a1_8,a2_8) * kOnOff8
; send to speakers
kOutGain           cabbageGetValue    "OutGain"
                   outo               a1*kOutGain, a2*kOutGain, a3*kOutGain, a4*kOutGain, a5*kOutGain, a6*kOutGain, a7*kOutGain, a8*kOutGain ; octophonic output


; SUBWOOFER (LFE)
kLFEChan,kT        cabbageGetValue    "LFEChan"
kOnOffLFE          cabbageGetValue    "OnOffLFE"
aLFE               =                  sum:a(gaFile1,gaFile2) * kOnOffLFE
                   outch              kLFEChan, aLFE*kOutGain

; METERS
kMeterGain        cabbageGetValue     "MeterGain"
kUpdate           metro               32                       ; rate up update of the VU meters
#define meter(N)
#
kres$N            init                0
kres$N            limit               kres$N-0.001,0,1         ; decay of peak reading, increase subtraction value to speed up decay
kres$N            peak                a$N
                  cabbageSetValue     "VUMeter$N",kres$N * kMeterGain, kUpdate
#
$meter(1)
$meter(2)
$meter(3)
$meter(4)
$meter(5)
$meter(6)
$meter(7)
$meter(8)
$meter(LFE)

; clear global audio variable to prevent buzzing if play button is stopped
                  clear               gaFile1, gaFile2

endin






; LOAD SOUND FILE
instr    99
 cabbageSetValue  "Play",0
                  cabbageSet          "filer1", "file", gSfilepath
 ; write file name to GUI
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet          "FileName", "text", SFileNoExtension
endin

; play sound file
instr 101
if gkPlay==0 then
 turnoff
endif
kinskip cabbageGetValue "inskip"
if changed:k(kinskip)==1 then
                  reinit              RESTART
endif
RESTART:
 gaFile1,gaFile2 diskin2 gSfilepath,1,i(kinskip)*filelen:i(gSfilepath),1
 kPtr            phasor  1/(filelen:i(gSfilepath)),i(kinskip)
 rireturn
                  cabbageSet          metro:k(16), "wiper", "bounds", 110 + kPtr*750, 0, 1, 160
 gaFile1          *=                  1 - cabbageGetValue:k("Mute1") ; apply mutes
 gaFile2          *=                  1 - cabbageGetValue:k("Mute2")
endin


instr 201 ; load preset
                  cabbageSet          1, "Spk1", "visible", table:i(0,p4)
                  cabbageSet          1, "Spk2", "visible", table:i(1,p4)
                  cabbageSet          1, "Spk3", "visible", table:i(2,p4)
                  cabbageSet          1, "Spk4", "visible", table:i(3,p4)
                  cabbageSet          1, "Spk5", "visible", table:i(4,p4)
                  cabbageSet          1, "Spk6", "visible", table:i(5,p4)
                  cabbageSet          1, "Spk7", "visible", table:i(6,p4)
                  cabbageSet          1, "Spk8", "visible", table:i(7,p4)

                  cabbageSetValue     "azim1", table:i(8,p4)
                  cabbageSetValue     "azim2", table:i(9,p4)
                  cabbageSetValue     "azim3", table:i(10,p4)
                  cabbageSetValue     "azim4", table:i(11,p4)
                  cabbageSetValue     "azim5", table:i(12,p4)
                  cabbageSetValue     "azim6", table:i(13,p4)
                  cabbageSetValue     "azim7", table:i(14,p4)
                  cabbageSetValue     "azim8", table:i(15,p4)

                  cabbageSetValue     "OnOff1", table:i(16,p4)
                  cabbageSetValue     "OnOff2", table:i(17,p4)
                  cabbageSetValue     "OnOff3", table:i(18,p4)
                  cabbageSetValue     "OnOff4", table:i(19,p4)
                  cabbageSetValue     "OnOff5", table:i(20,p4)
                  cabbageSetValue     "OnOff6", table:i(21,p4)
                  cabbageSetValue     "OnOff7", table:i(22,p4)
                  cabbageSetValue     "OnOff8", table:i(23,p4)

                  cabbageSetValue     "LFEChan", table:i(24,p4)
                  cabbageSetValue     "OnOffLFE", table:i(25,p4)
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
