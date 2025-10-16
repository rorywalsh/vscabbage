
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN05.csd
; Demonstration of GEN05
; Written by Iain McCurdy, 2014
; 
; GEN05 generates breakpoint functions by joining user-defined values using exponential curves each of user-definable duration.
; The table can be modified, either by clicking directly onto the graph or by using the dials.
; Node values must be non-zero and alike in sign.
; 
; In this example the user can input node values of zero but these will be offset using the value of the 'Offset' control.
; It can be observed how changing this offset value will vary the curvature of segments.
; 
; An audio test generator uses this function table as a repeating amplitude envelope. 
; The offset value is subtracted so that the envelope can experience values of zero. 

<Cabbage>
form caption("GEN05"), size(280,460), pluginId("gn05"), colour(13, 50, 67,50), guiMode("queue")

gentable bounds( 10, 10, 260, 120), tableNumber(1), tableColour("silver"), channel("table"), ampRange(0,1.1,1), zoom(-1), active(1)
image    bounds( 0,  0,  0, 0), channel("wiper")

rslider  bounds(  0,140, 70, 90), channel("val1"), text("Value.1"), textBox(1), range(0, 1, 0), colour(100,130,130,250), trackerColour("silver"), valueTextBox(1)
rslider  bounds( 70,140, 70, 90), channel("val2"), text("Value.2"), textBox(1), range(0, 1, 1), colour(100,130,130,250), trackerColour("silver"), valueTextBox(1)
rslider  bounds(140,140, 70, 90), channel("val3"), text("Value.3"), textBox(1), range(0, 1, 0), colour(100,130,130,250), trackerColour("silver"), valueTextBox(1)
rslider  bounds(210,140, 70, 90), channel("offset"), text("Offset"), textBox(1), range(0.0001, 0.1, 0.001, 1, 0.0001), colour(200,130,130, 50), trackerColour("silver"), valueTextBox(1)

rslider  bounds( 30,240, 70, 90), channel("dur1"), text("Dur.1"), textBox(1), range(0, 4096, 0, 1, 1), colour(130,100,130,250), trackerColour("silver"), valueTextBox(1)
rslider  bounds(100,240, 70, 90), channel("dur2"), text("Dur.2"), textBox(1), range(0, 4096, 4096, 1, 1), colour(130,100,130,250), trackerColour("silver"), valueTextBox(1)

checkbox bounds(170,280,120, 15), channel("RemoveOS"), text("Remove Offset"),  value(0), colour("yellow"), shape("square")

line     bounds(  0,340,280,  2), colour("Grey")

checkbox bounds( 15,360, 80, 15), channel("TestGen"), text("Test"),  value(1), colour("yellow"), shape("square")
rslider  bounds( 70,350, 70, 90), channel("speed"), text("Speed"), textBox(1), range(0.25, 8.00, 1,0.5,0.001),   colour(250,230,250,250), trackerColour("silver"), valueTextBox(1)
rslider  bounds(140,350, 70, 90), channel("freq"),  text("Freq."), textBox(1), range(50, 5000, 500,0.5,0.1),     colour(250,230,250,250), trackerColour("silver"), valueTextBox(1)
rslider  bounds(210,350, 70, 90), channel("lev"),   text("Level"), textBox(1), range(0, 1.00, 0.5),              colour(250,230,250,250), trackerColour("silver"), valueTextBox(1)

label    bounds(   2,448,110, 12), text("Iain McCurdy |2014|"), align("left")
</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =    32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls       =    2    ; NUMBER OF CHANNELS (1=MONO)
0dbfs        =    1    ; MAXIMUM AMPLITUDE

instr    1

; read in widgets
gkval1    cabbageGetValue    "val1"
gkval2    cabbageGetValue    "val2"
gkval3    cabbageGetValue    "val3"
            
gkdur1    cabbageGetValue    "dur1"
gkdur2    cabbageGetValue    "dur2"
            
gkoffset  cabbageGetValue    "offset"
gkoffset  init               0.001
        
; if any of the variables in the input list are changed, a momentary '1' trigger is generthe output. This trigger is used to update function tables.
if changed:k(gkval1,gkval2,gkval3,gkdur1,gkdur2,gkoffset)==1 then
          reinit             UPDATE
endif
UPDATE:
; Update function table
if    (i(gkdur1)+i(gkdur2))>4096 then                ; if sum of segments exceeds table size...
 idur1    =                  i(gkdur1) * (4096/(i(gkdur1)+i(gkdur2)))    ; ...scale segment durations down
 idur2    =                  i(gkdur2) * (4096/(i(gkdur1)+i(gkdur2)))
 irem     =                  0                       ; remainder duration of table
else                                                 ; if sum of segments is less than table size...
 idur1    =                  i(gkdur1)
 idur2    =                  i(gkdur2)
 irem     =                  4096 - (i(gkdur1) + i(gkdur2))        ; remainder duration of table
endif
gi1       ftgen              1, 0,   4096, -5, i(gkval1)+i(gkoffset), idur1, i(gkval2)+i(gkoffset), idur2, i(gkval3)+i(gkoffset), irem, i(gkoffset)
          cabbageSet         "table", "tableNumber", 1     ; update table display    
rireturn

kTestGen  cabbageGetValue    "TestGen"                     ; test generator on/off
kspeed    cabbageGetValue    "speed"
kamp      cabbageGetValue    "lev"
kfreq     cabbageGetValue    "freq"
aphasor   phasor             kspeed
iGraphBounds[] cabbageGet "table", "bounds"
          cabbageSet         metro:k(16), "wiper", "bounds",  iGraphBounds[0] + (k(aphasor)*iGraphBounds[2]), iGraphBounds[1], 1, iGraphBounds[3]
aenv      tablei             aphasor,gi1,1

if cabbageGetValue:k("RemoveOS")==1 then
 aenv     =                  (aenv - gkoffset) / (1 - gkoffset)
endif

asig      vco2               0.4*kamp*kTestGen,kfreq,4,0.5  ; triangle audio wave
asig      =                  asig * (aenv - gkoffset)       ; remove GEN05 offset
          outs               asig, asig
endin

</CsInstruments>

<CsScore>
; create the function table
f 1 0    4096 -16  1 0 0
; play instrument 1 for 1 hour
i 1 0 z
</CsScore>

</CsoundSynthesizer>
