
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN07.csd
; Demonstration of GEN07
; Written by Iain McCurdy, 2014
;
; GEN07 generates breakpoint functions by joining user-defined values using straight lines each of user-definable duration.
; The user can toggle between using the sliders to input data for the envelope or by drawing and clicking and dragging on 
; the actual waveform. 
;
; An audio test generator uses this function table as a repeating amplitude envelope. 
; The offset value is subtracted so that the envelope can experience values of zero. 

<Cabbage>
form caption("GEN07"), size(250,475), pluginId("gn07"), colour(13, 50, 67,50), guiMode("queue")

gentable bounds(  5, 10, 240, 120), tableNumber(1), tableColour(90,100,90), tableBackgroundColour("LightGrey"), tableGridColour(0,0,0,0), channel("table"), ampRange(0,1,1), active(1), fill(1)
image    bounds( 0,  0,  0, 0), channel("wiper"), colour(0,0,0)

#define SLIDER_STYLE colour(100,130,130,250), trackerColour("silver"), valueTextBox(1)

rslider  bounds( 20,140, 70, 90), channel("val1"), text("Value.1"), range(0, 1, 0), $SLIDER_STYLE
rslider  bounds( 90,140, 70, 90), channel("val2"), text("Value.2"), range(0, 1, 1), $SLIDER_STYLE
rslider  bounds(160,140, 70, 90), channel("val3"), text("Value.3"), range(0, 1, 0), $SLIDER_STYLE

rslider  bounds( 50,240, 70, 90), channel("dur1"), text("Dur.1"), range(0, 1, 0.2, 1, 0.001), $SLIDER_STYLE
rslider  bounds(120,240, 70, 90), channel("dur2"), text("Dur.2"), range(0, 1, 0.8, 1, 0.001), $SLIDER_STYLE

line     bounds( 10,340,225,  2), colour("Grey")

checkbox bounds( 15,350, 80, 15), channel("TestGen"), text("Test"),  value(1), colour("yellow"), shape("square")
rslider  bounds( 20,365, 70, 90), channel("speed"), text("Speed"), range(0.25, 8.00, 1,0.5,0.001), $SLIDER_STYLE
rslider  bounds( 90,365, 70, 90), channel("freq"),  text("Freq."), range(50, 5000, 500,0.5,0.1), $SLIDER_STYLE
rslider  bounds(160,365, 70, 90), channel("lev"),   text("Level"), range(0, 1.00, 0.5), $SLIDER_STYLE

label    bounds(  2,463,110, 12), text("Iain McCurdy |2014|"), align("left")
</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =     32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls       =     2     ; NUMBER OF CHANNELS (1=MONO)
0dbfs        =     1     ; MAXIMUM AMPLITUDE

giTabLen     =     2048

instr    1
  ; read in widgets
  gkval1    cabbageGetValue    "val1"
  gkval2    cabbageGetValue    "val2"
  gkval3    cabbageGetValue    "val3"
            
  gkdur1    cabbageGetValue    "dur1"
  gkdur2    cabbageGetValue    "dur2"
        
  gkdur1    *=                 giTabLen
  gkdur2    *=                 giTabLen
        
  ; if any of the variables in the input list are changed, a momentary '1' trigger is generated at the output. This trigger is used to update function tables.
  if changed:k(gkval1,gkval2,gkval3,gkdur1,gkdur2)==1 then
            reinit             UPDATE
  endif
  UPDATE:
  ; Update function table
  if    (i(gkdur1)+i(gkdur2))>giTabLen then                ; if sum of segments exceeds table size...
   idur1    =                  i(gkdur1)* (giTabLen/(i(gkdur1)+i(gkdur2)))    ; ...scale segment durations down
   idur2    =                  i(gkdur2)* (giTabLen/(i(gkdur1)+i(gkdur2)))
   irem     =                  0                             ; remainder duration of table
  else                                                       ; if sum of segments is less than table size...
   idur1    =                  i(gkdur1)
   idur2    =                  i(gkdur2)
   irem     =                  giTabLen - (i(gkdur1) + i(gkdur2)) ; remainder duration of table
  endif
  gi1       ftgen              1, 0,   giTabLen, -7, i(gkval1), idur1, i(gkval2), idur2, i(gkval3), irem, 0
            cabbageSet         "table", "tableNumber", 1      ; update table display    
  rireturn

  ; play sound
  kTestGen   cabbageGetValue   "TestGen"                      ; test generator on/off
  kspeed     cabbageGetValue   "speed"
  kamp       cabbageGetValue   "lev"
  kfreq      cabbageGetValue   "freq"
  aphasor    phasor            kspeed
iGraphBounds[] cabbageGet "table", "bounds"
          cabbageSet         metro:k(16), "wiper", "bounds",  iGraphBounds[0] + (k(aphasor)*iGraphBounds[2]), iGraphBounds[1], 1, iGraphBounds[3]
  aenv       tablei            aphasor,gi1,1
  asig       vco2              0.4*kamp*kTestGen,kfreq,4,0.5  ; triangle audio wave
  asig       =                 asig * aenv                    ; 
             outs              asig, asig
endin

</CsInstruments>

<CsScore>
; play instrument 1 for 1 hour
i 1 0 z
</CsScore>

</CsoundSynthesizer>
