
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Powershape.csd
; Iain McCurdy 2012, 2024
;
; Encapsulation of the powershape opcode used for wave distortion
;
; CONTROLS
; --------
; SOURCE:
; OFF
; Test Tone --  a glissandoing sine tone
; Live      --  live input from the computer's hardware
; Power (either slider or number box)
;           --  controls the amount of distortion (waveshaping)
; Level     --  output level

; Both the transfer function (as a graph) and the audio output (as an oscilloscope trace) are shown.

<Cabbage>
form caption("Powershape") size(620,105), pluginId("pshp") guiMode("queue")
image    bounds(  0, 0,620,105),  colour("Brown"), shape("rounded"), outlineColour("white"), outlineThickness(4) 

label    bounds( 10, 10,130, 14), text("SOURCE"), align("left"), fontColour("white")
checkbox bounds( 10, 30,130, 15), channel("Off"),      fontColour:0("white"), fontColour:1("white"), value(1), text("Off"), colour("yellow"), radioGroup(1)
checkbox bounds( 10, 50,130, 15), channel("TestTone"), fontColour:0("white"), fontColour:1("white"), value(0), text("Sine Test"), colour("yellow"), radioGroup(1)
checkbox bounds( 10, 70,130, 15), channel("Live"),     fontColour:0("white"), fontColour:1("white"), value(0), text("Live"), colour("yellow"), radioGroup(1)

hslider  bounds( 95, 10,190, 20), channel("amount"), range(0.1, 100, 1, 0.25,0.001), colour(220,160,160), trackerColour(255,210,210)
label    bounds( 95, 30,190, 11), text("Power"), fontColour("white"), align("centre")

nslider  bounds(145, 50, 90, 30), text("Power (type value)"),  channel("amountDisp"),  range(0.1, 1000, 1,1,0.001), textColour("white")

rslider  bounds(290, 15, 70, 70), channel("level"),  text("Level"), range(0, 50, 0.5, 0.25,0.000001), colour(220,160,160), trackerColour(255,210,210), textColour(255,255,255)

; bevel
image    bounds(375, 10,100, 74), colour(0,0,0,0), outlineThickness(8), outlineColour("Silver"), corners(2)
{
gentable bounds(  2,  2, 96, 70), tableNumber(1000), channel("TF"), ampRange(-1.1,1.1,1000), tableColour(220,160,160)
}
label    bounds(375, 84,100, 12), text("Transfer Function"), fontColour(255,255,255)

; bevel
image    bounds(495, 10,100, 74), colour(0,0,0,0), outlineThickness(8), outlineColour("Silver"), corners(2)
{
; grid
gentable      bounds(  2,  2, 96, 70), tableNumber(1000),  channel("TF"), tableGridColour("white"), fill(0), tableColour(0,0,0,0)
; oscilloscope
signaldisplay bounds(  2,  2, 96, 70), colour("LightBlue"), alpha(0.85), displayType("waveform"), backgroundColour("Black"), zoom(-1), signalVariable("aL"), channel("display")
image         bounds(  2, 37, 96,  1), colour(100,100,100) ; x-axis indicator
}
label         bounds(495, 84,100, 12), text("Output"), fontColour(255,255,255)

label         bounds(  5, 90,120, 12), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -dm0 -+rtmidi=NULL --displays
</CsOptions>

<CsInstruments>

;sr is set by the host
ksmps              =                   32      ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =                   2       ; NUMBER OF CHANNELS (2=STEREO)
0dbfs              =                   1   
          
gisine             ftgen               0, 0, 4096, 10, 1
i_                 ftgen               1000, 0, 256, 10, 1
i_                 ftgen               1, 0, 4096, 10, 1

instr   1
 kOff              cabbageGetValue     "Off"
 kTestTone         cabbageGetValue     "TestTone"
 kLive             cabbageGetValue     "Live"
 kSource           =                   kOff + (kTestTone * 2) + (kLive * 4)        
 kporttime         linseg              0, 0.001, 0.05                            ; portamento time ramps up from zero
 kshape            cabbageGetValue     "amount"                                  ; READ WIDGETS...
                   cabbageSetValue     "amountDisp", kshape, changed:k(kshape)
 kamountDisp       cabbageGetValue     "amountDisp"
                   cabbageSetValue     "amount", kamountDisp, changed:k(kamountDisp)
 
 kshape            portk               kshape, kporttime
 klevel            cabbageGetValue     "level"
 klevel            portk               klevel, kporttime
 klevel            portk               klevel, kporttime
 if kSource==2     then                                                          ; if test tone selected...
  koct             rspline             4, 8, 0.2, 0.5                     
  asigL            poscil              1, cpsoct(koct), gisine                   ; ...generate a tone
  asigR            =                   asigL                                     ; right channel equal to left channel
 elseif kSource==4 then                                                          ; otherwise...
  asigL, asigR     ins                                                           ; read live inputs
 else
  asigL            =                   0
  asigR            =                   0
 endif
 
 ifullscale        =                   0dbfs                       ; DEFINE FULLSCALE AMPLITUDE VALUE
 aL                powershape          asigL, kshape, ifullscale   ; CREATE POWERSHAPED SIGNAL
 aR                powershape          asigR, kshape, ifullscale   ; CREATE POWERSHAPED SIGNAL
 alevel            interp              klevel
; OSCILLOSCOPE
                   display             aL, 0.1
                   outs                aL * alevel, aR * alevel
    
 ; display transfer function display
 if changed:k(kshape)==1 then
                   reinit              REBUILD_TF
 else
                   goto                SKIP
 endif
 REBUILD_TF:
 kPtr              init                0
 while kPtr<ftlen(1000) do
 kVal              init                -1
 aVal              powershape          a(kVal), kshape, ifullscale   ; CREATE POWERSHAPED SIGNAL
                   tablew              k(aVal), kPtr, 1000
 kPtr              +=                  1
 kVal              +=                  2/ftlen(1000)
 od
                   cabbageSet          "TF", "tableNumber", 1000
 rireturn
 SKIP:




endin
        
</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>