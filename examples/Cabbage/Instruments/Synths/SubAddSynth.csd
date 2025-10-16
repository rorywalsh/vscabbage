
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; SubAddSynth.csd
; Written by Iain McCurdy, 2024
; 

<Cabbage>
form caption("Sub-add Synth") size(600, 437), pluginId("SASy"), guiMode("queue"), colour(0,0,0)

#define SLIDER_STYLE valueTextBox(1)
rslider bounds( 10,10,80,80), channel("Freq"), range(1,2000,40,0.5), text("Freq"), $SLIDER_STYLE
rslider bounds( 90,10,80,80), channel("Dry"), range(0,1,1,0.5), text("Dry"), $SLIDER_STYLE
rslider bounds(170,10,80,80), channel("Wet"), range(0,1,1,0.5), text("Wet"), $SLIDER_STYLE
rslider bounds(250,10,80,80), channel("Att"), range(0.001,1,0.001,0.5), text("Attack"), $SLIDER_STYLE
rslider bounds(330,10,80,80), channel("Dec"), range(0.001,5,0.1,0.5), text("Decay"), $SLIDER_STYLE

image     bounds(105,140,315,115), colour(0,0,0,0), outlineThickness(1)
{
label     bounds(  0,  4,315,  16), text("I N P U T   W A V E F O R M"), align("centre")
vslider   bounds( 10, 25, 20,  72), channel("P1"), range(0,1,1,0.5), popupText(0) ;, text("1")
vslider   bounds( 30, 25, 20,  72), channel("P2"), range(0,1,0,0.5), popupText(0) ;, text("2")
vslider   bounds( 50, 25, 20,  72), channel("P3"), range(0,1,0,0.5), popupText(0) ;, text("3")
vslider   bounds( 70, 25, 20,  72), channel("P4"), range(0,1,0,0.5), popupText(0) ;, text("4")
vslider   bounds( 90, 25, 20,  72), channel("P5"), range(0,1,0,0.5), popupText(0) ;, text("5")
vslider   bounds(110, 25, 20,  72), channel("P6"), range(0,1,0,0.5), popupText(0) ;, text("6")
vslider   bounds(130, 25, 20,  72), channel("P7"), range(0,1,0,0.5), popupText(0) ;, text("7")
vslider   bounds(150, 25, 20,  72), channel("P8"), range(0,1,0,0.5), popupText(0) ;, text("8")

nslider   bounds( 10, 90, 20,  20), channel("PN1"), range(1,99,1,1,1)
nslider   bounds( 30, 90, 20,  20), channel("PN2"), range(1,99,2,1,1)
nslider   bounds( 50, 90, 20,  20), channel("PN3"), range(1,99,3,1,1)
nslider   bounds( 70, 90, 20,  20), channel("PN4"), range(1,99,4,1,1)
nslider   bounds( 90, 90, 20,  20), channel("PN5"), range(1,99,5,1,1)
nslider   bounds(110, 90, 20,  20), channel("PN6"), range(1,99,6,1,1)
nslider   bounds(130, 90, 20,  20), channel("PN7"), range(1,99,7,1,1)
nslider   bounds(150, 90, 20,  20), channel("PN8"), range(1,99,8,1,1)

gentable  bounds(180, 25,120,  80), channel("InputWF"), tableNumber(2), tableColour(255,255,150), fill(0), ampRange(-1,1,2), active(1), outlineThickness(2)
image     bounds(180, 65,120,  1), colour(255,255,255,200) ; x axis
}


</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps         =     64
nchnls        =     2
0dbfs         =     1

; function table containing partial magnitudes of harmonic input waveform
giFn               ftgen               2, 0, 4097, 10, 1


instr    1
 ; create input oscillator waveform
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
  
 if changed:k(kP1,kP2,kP3,kP4,kP5,kP6,kP7,kP8,kPN1,kPN2,kPN3,kPN4,kPN5,kPN6,kPN7,kPN8)==1 then
  reinit REBUILD_SOURCE_WAVEFORM
 endif
 REBUILD_SOURCE_WAVEFORM:
 i_                ftgen               giFn, 0, ftlen(giFn), 9, i(kPN1),i(kP1),0, i(kPN2),i(kP2),0, i(kPN3),i(kP3),0, i(kPN4),i(kP4),0, i(kPN5),i(kP5),0, i(kPN6),i(kP6),0, i(kPN7),i(kP7),0, i(kPN8),i(kP8),0
                   cabbageSet          "InputWF","tableNumber",giFn
 rireturn

kFreq              cabbageGetValue     "Freq"
kDry               cabbageGetValue     "Dry"
kWet               cabbageGetValue     "Wet"
kAtt               cabbageGetValue     "Att"
kDec               cabbageGetValue     "Dec"
Sfile              =                   "/Users/iainmccurdy/Documents/Sabbatical2024-25/toks.wav"
aSrc               diskin2             Sfile, 1, 0, 1
aFlw               follow2             aSrc, kAtt, kDec

; sub-tone
aSub               poscil              aFlw, kFreq, giFn

; sub-noise
;aSub               noise               aFlw, 0
;aSub               butlp               aSub, kFreq

aMix               =                   (aSrc * kDry) + (aSub * kWet)
                   outall              aMix
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>