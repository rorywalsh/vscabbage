
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN16.csd
; Written by Iain McCurdy, 2013, 2024
; Demonstration of GEN16
; Envelope repeats once every two seconds therefore 1 second = 2048 table points
; Value 1 and Value 4 should probably be zero.
; Durations are specified in table points - 2048 = 1 second
; If the sum of durations exceeds table size they are automatically scaled down in order to prevent crashes.

<Cabbage>
form caption("GEN16"), size(365, 440), pluginId("gn16"), colour(100,100,110), guiMode("queue")

gentable bounds( 10,  5,345,120), tableNumber(1), tableColour("silver"), channel("table"), zoom(-1), ampRange(1,0,1)
image    bounds( 10,  5,  1,120), channel("wiper")
#define SLIDER_SETTINGS textBox(1), fontColour("white"), textColour("white"), trackerColour("silver"), valueTextBox(1)

rslider bounds(  0,130, 70, 90), channel("val1"), text("Value.1"), range(0, 1, 0),   colour(80,80,80), $SLIDER_SETTINGS
rslider bounds( 70,130, 70, 90), channel("val2"), text("Value.2"), range(0, 1, 1),   colour(80,80,80), $SLIDER_SETTINGS
rslider bounds(140,130, 70, 90), channel("val3"), text("Value.3"), range(0, 1, 0.2), colour(80,80,80), $SLIDER_SETTINGS
rslider bounds(210,130, 70, 90), channel("val4"), text("Value.4"), range(0, 1, 0),   colour(80,80,80), $SLIDER_SETTINGS

rslider bounds( 30,230, 70, 90), channel("dur1"), text("Dur.1"), range(1, 4096, 80, 1, 1),   colour(80,80,80), $SLIDER_SETTINGS
rslider bounds(100,230, 70, 90), channel("dur2"), text("Dur.2"), range(1, 4096, 1000, 1, 1), colour(80,80,80), $SLIDER_SETTINGS
rslider bounds(170,230, 70, 90), channel("dur3"), text("Dur.3"), range(1, 4096, 3016, 1, 1), colour(80,80,80), $SLIDER_SETTINGS

rslider bounds( 30,330, 70, 90), channel("shp1"), text("Shape.1"), range(-20, 20, 3),   colour(80,80,80), $SLIDER_SETTINGS
rslider bounds(100,330, 70, 90), channel("shp2"), text("Shape.2"), range(-20, 20, -3),  colour(80,80,80), $SLIDER_SETTINGS
rslider bounds(170,330, 70, 90), channel("shp3"), text("Shape.3"), range(-20, 20, 1.5), colour(80,80,80), $SLIDER_SETTINGS

rslider bounds(295,130, 70, 90), channel("speed"), text("Speed"), range(0.25, 8.00, 0.5,0.5,0.001),  colour(80,80,80), $SLIDER_SETTINGS
rslider bounds(295,230, 70, 90), channel("freq"),  text("Freq."), range(50, 5000, 300,0.5,0.1),      colour(80,80,80), $SLIDER_SETTINGS
rslider bounds(295,330, 70, 90), channel("lev"),   text("Level"), range(0, 1.00, 0.5),               colour(80,80,80), $SLIDER_SETTINGS

line    bounds(285,140,  2,290), colour("Grey")

label    bounds(   2,427,110, 12), text("Iain McCurdy |2013|"), fontColour("silver"), align("left")

</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps         =                  32       ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls        =                  2        ; NUMBER OF CHANNELS (1=MONO)
0dbfs         =                  1        ; MAXIMUM AMPLITUDE

instr    1
    iGraphBounds[] cabbageGet "table", "bounds"
    
    ; read in widgets
    gkval1    cabbageGetValue    "val1"
    gkval2    cabbageGetValue    "val2"
    gkval3    cabbageGetValue    "val3"
    gkval4    cabbageGetValue    "val4"

    gkdur1    cabbageGetValue    "dur1"
    gkdur2    cabbageGetValue    "dur2"
    gkdur3    cabbageGetValue    "dur3"

    gkshp1    cabbageGetValue    "shp1"
    gkshp2    cabbageGetValue    "shp2"
    gkshp3    cabbageGetValue    "shp3"

    ; build table
    ; if any of the variables in the input list are changed, a momentary '1' trigger is generated at the output. This trigger is used to update function tables.
    ktrig     changed            gkval1,gkval2,gkval3,gkval4,gkdur1,gkdur2,gkdur3,gkshp1,gkshp2,gkshp3
    if ktrig==1 then
     reinit REBUILD_TABLE
    endif
    REBUILD_TABLE:
      if    (i(gkdur1)+i(gkdur2)+i(gkdur3))>4096 then
       idur1  =                  i(gkdur1)* (4096/(i(gkdur1)+i(gkdur2)+i(gkdur3)))
       idur2  =                  i(gkdur2)* (4096/(i(gkdur1)+i(gkdur2)+i(gkdur3)))
       idur3  =                  i(gkdur3)* (4096/(i(gkdur1)+i(gkdur2)+i(gkdur3)))
      else
       idur1  =                  i(gkdur1)
       idur2  =                  i(gkdur2)
       idur3  =                  i(gkdur3)
      endif
    gi1       ftgen              1, 0,   4096,-16, i(gkval1), idur1, i(gkshp1), i(gkval2), idur2, i(gkshp2), i(gkval3), idur3, i(gkshp3), i(gkval4)
    rireturn 
              cabbageSet         ktrig, "table", "tableNumber", 1     ; update table display    
    
    ; synthesiser
    kspeed    cabbageGetValue    "speed"
    aphs      phasor             kspeed
              cabbageSet         metro:k(16), "wiper", "bounds",  iGraphBounds[0] + (k(aphs)*iGraphBounds[2]), iGraphBounds[1], 1, iGraphBounds[3]
    aamp      tablei             aphs,1,1
    kphs      downsamp           aphs
    kamp      cabbageGetValue    "lev"
    kfreq     cabbageGetValue    "freq"
    asig      vco2               kamp, kfreq
    acf       =                  cpsoct((aamp*5)+7)
    asig      butlp              asig, acf
    asig      =                  asig * aamp
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
