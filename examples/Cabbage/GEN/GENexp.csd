
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GENexp.csd
; Demonstration of GEN routine "exp"
; Written by Iain McCurdy, 2023

; DOES NOT PRODUCE SOUND

; can be used to generate exponential curves of a user-controlled starting and ending values and user-controlled shape

; the arguments for the 'exp' GEN routine are:
; START   - starting value at the leftmost location in the table
; END     - ending value at the rightmost location in the table
; RESCALE - a switch that enables rescaling of the table if its maxima/minima do not touch 1/-1. This can occur if START and END are less than 1.
; LINK    - if this is activated it ensures that the "exp" function is symmetrical by giving START and END the same value but one being the negative of the other.

; INDEX   - choose an index location from which to read the table (the table size is 4096) and the corresponding value is shown in the VALUE box.

<Cabbage>
form caption("GENexp"), size(260, 280), pluginId("gnex"), colour(13, 50, 67,50), guiMode("queue")

gentable bounds( 10, 10,240,120), tableNumber(1), tableColour("silver"), fill(0), channel("table")
image    bounds( 10, 70,240,  1), colour(255,255,255,100)

nslider  bounds( 10,135, 70, 30), channel("start"), text("START"), range(-100, 100, -1)
nslider  bounds(180,135, 70, 30), channel("end"), text("END"), range(-100, 100, 1)

checkbox bounds( 10,175, 80, 12), channel("rescale") text("RESCALE"), value(1)
checkbox bounds(110,175, 80, 12), channel("link") text("LINK"), value(1)

line     bounds( 10,200,225,  2), colour("silver")

nslider  bounds( 50,210, 70, 35), channel("index"), text("INDEX"), range(0, 4096, 0,1,1)
nslider  bounds(140,210, 70, 35), channel("value"), text("VALUE"), range(-100, 100, 0), active(0)

label    bounds( 0,250,260, 20), text("DOES NOT PRODUCE SOUND"), fontColour("silver"), align("centre")

label    bounds( 2,268,110, 12), text("Iain McCurdy |2023|"), fontColour("grey"), align("left")

</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-n -dm0 -+rtmidi=NULL --displays
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =                   2    ; NUMBER OF CHANNELS (1=MONO)
0dbfs              =                   1    ; MAXIMUM AMPLITUDE

instr    1
; GENTABLE
klink              cabbageGetValue     "link"
kstart,kT          cabbageGetValue     "start"
                   cabbageSetValue     "end",-kstart,kT*klink
kend,kT            cabbageGetValue     "end"
                   cabbageSetValue     "start",-kend,kT*klink
krescale           cabbageGetValue     "rescale"
if changed:k(kstart,kend,krescale)==1 then
                   reinit              RebuildTable
endif
RebuildTable:
i_                 ftgen               1,0,4097,"exp", i(kstart), i(kend), 1 - i(krescale)
                   cabbageSet          "table", "tableNumber", 1
rireturn

kindex             cabbageGetValue     "index"
kvalue             table               kindex, 1
                   cabbageSetValue     "value", kvalue
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
