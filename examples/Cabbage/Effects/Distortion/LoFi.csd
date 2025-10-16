
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; LoFi.csd
; Written by Iain McCurdy, 2012.

; Two distinct effects are provided:
; 1. An emulation of bit depth reduction (Bits)
; 2. An emulation of sample rate reduction (Foldover)

; [Dials]
; Bits     -  the bit depth emulated
; Foldover -  the value by which the currently running sample rate will be divided.
;              this will have a slightly different effect, depending on what the current sample rate is.
; Both of these can also be modulated using the XY 

; An oscilloscope is provided to show a visual representation of the effects.

; Normally this effect is applied to the stereo live input signal. Pressing 'Test Tone' will overwrite the live input signal with a sine test tone

<Cabbage>
form size(740, 145), caption("Lo Fi"), pluginId("lofi"), colour(47,50,55), guiMode("queue")
#define DIAL_STYLE  trackerInsideRadius(0.8),  trackerColour(250,250,180), colour(160,160,170), textColour(250,250,250), valueTextBox(1)
checkbox bounds( 10, 10, 80, 15), channel("TestTone"), text("Test Tone"), fontColour:0("White"), fontColour:1("White")
hslider  bounds( 95, 12,150, 10),     channel("freq"),  range(1, 4000, 440, 0.5), $DIAL_STYLE
rslider  bounds(  5, 30, 80,100), text("Bits"),     channel("bits"),  range(0, 16, 16, 0.25, 0.00001), $DIAL_STYLE
rslider  bounds( 85, 30, 80,100), text("Foldover"), channel("fold"),  range(1, 1024, 0, 0.25), $DIAL_STYLE

xypad    bounds(170, 30,200,100), channel("BitsX","FoldoverY"), text("X - Bits | Y - Foldover"), fontColour(0,0,0,0)

rslider  bounds(375, 30, 80,100), text("Level"),    channel("level"), range(0, 1.00, 0.3,0.5), $DIAL_STYLE
; oscilloscope
image         bounds(467, 17,161,116), outlineColour("silver"), corners(15), colour(0,0,0,0), outlineThickness(10)
signaldisplay bounds(470, 20,155,110), colour(100,255,100,150), alpha(0.85), displayType("waveform"), backgroundColour("Black"), zoom(-1), signalVariable("a1"), channel("display"), outlineThickness(2)
rslider       bounds(640, 30, 80,100), text("Period"),     channel("period"),  range(0.001, 1, 0.025, 1, 0.001), $DIAL_STYLE

label         bounds(  4,132,120, 12), text("Iain McCurdy |2012|"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n --displays
</CsOptions>

<CsInstruments>

;sr is set by the host
ksmps  = 32
nchnls = 2
0dbfs  = 1

;Iain McCurdy, 2012
;http://iainmccurdy.org/csound.html


opcode  LoFi,a,akk
 ain,kbits,kfold   xin                                                     ; READ IN INPUT ARGUMENTS
 kvalues           pow                 2, kbits                            ; RAISES 2 TO THE POWER OF kbitdepth. THE OUTPUT VALUE REPRESENTS THE NUMBER OF POSSIBLE VALUES AT THAT PARTICULAR BIT DEPTH
 aout              =                   (int((ain/0dbfs)*kvalues))/kvalues  ; BIT DEPTH REDUCE AUDIO SIGNAL
 aout              fold                aout, kfold                         ; APPLY SAMPLING RATE FOLDOVER
                   xout                aout                                ; SEND AUDIO BACK TO CALLER INSTRUMENT
endop

instr 1

kBitsX,kT          cabbageGetValue     "BitsX"
                   cabbageSetValue     "bits", (kBitsX^3)*16, kT
kFoldoverY,kT      cabbageGetValue     "FoldoverY"
                   cabbageSetValue     "fold", 1 + (kFoldoverY^3)*1023, kT



kTestTone          cabbageGetValue     "TestTone"
kbits              cabbageGetValue     "bits"
kfold              cabbageGetValue     "fold"
klevel             cabbageGetValue     "level"
if kTestTone==0 then
 a1,a2             ins
else
 kfreq             cabbageGetValue     "freq"
 a1                poscil              1,a(kfreq)
 a2                =                   a1
endif
kporttime          linseg              0, 0.001, 0.05
kfold              portk               kfold, kporttime
a1                 LoFi                a1, kbits * 0.6, kfold
a2                 LoFi                a2, kbits * 0.6, kfold

; oscilloscope
kPeriod            cabbageGetValue     "period"
kPeriod            init                0.025
if changed:k(kPeriod)==1 then
                   reinit              RESTART_OSCILLOSCOPE
endif
RESTART_OSCILLOSCOPE:
iPeriod            =                   i(kPeriod)
                   display             a1, iPeriod
                   rireturn

a1                 =                   a1 * klevel
a2                 =                   a2 * klevel
                   outs                a1, a2

endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>