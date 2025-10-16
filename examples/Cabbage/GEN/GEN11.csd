
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN11.csd
; Written by Iain McCurdy, 2018, 2024
; Demonstration of GEN11
; Create a wave and then play it using the keyboard

; Controls applied to the creation of the GEN table:
; --------------------------------------------------
; N.Harms - number of harmonics. Only changes on integers.
; Lowest  - lowest harmonic in the stack. Only changes on integers.
; Power   - weightings of the harmonics from low to high

; The spectroscope presents a spectrum for a 285 Hz oscillator using the GEN11 waveform.
;  It is not related to the notes played on the keyboard.

<Cabbage>
form caption("GEN11"), size(410,470), pluginId("gn10"), colour(20,30,35), guiMode("queue")

image         bounds(  5,  5,400,120, colour("silver"), corners(6)
gentable      bounds(  7,  7,396,116), channel("table1"), tableNumber(1), tableColour("LightBlue"), zoom(-1)
label         bounds( 10,  8,150, 13), text("GEN11 Waveform"), align("left"), fontColour("white")

; spectroscope
image         bounds(  5,130,380,120, colour("silver"), corners(6)
signaldisplay bounds(  7,132,376,116), colour("LightBlue"), alpha(0.85), displayType("spectroscope"), backgroundColour(20,20,20), zoom(-1), signalVariable("asig"), channel("displaySS"), fontColour(0,0,0,0)
label         bounds( 10,133,150, 15), text("Spectroscope"), align("left"), fontColour("white")
vslider       bounds(385,130, 25,120), channel("GraphGain"), text("Scl"), range(0.1, 20, 1,0.333), colour(220,230,235), trackerColour("LightBlue"), markerColour("LightBlue")

rslider bounds( 40,250,110,110), channel("NHarms"), text("N.Harms"), valueTextBox(1), textBox(1), range(1, 40, 1, 1, 1), colour(20,30,35), trackerColour("LightBlue"), markerColour("LightBlue")
rslider bounds(150,250,110,110), channel("LHarm"), text("Lowest"), valueTextBox(1), textBox(1), range(-40, 40, 1, 1, 1), colour(20,30,35), trackerColour("LightBlue"), markerColour("LightBlue")
rslider bounds(260,250,110,110), channel("Pow"), text("Power"), valueTextBox(1), textBox(1), range(0,8,1,0.333),         colour(20,30,35), trackerColour("LightBlue"), markerColour("LightBlue")

keyboard bounds(  5,370,410, 85)

label    bounds(   5,457,110, 12), text("Iain McCurdy |2018|"), align("left")
</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-dm0 -n -+rtmidi=NULL -M0 --displays
</CsOptions>

<CsInstruments>

; sr set by host
ksmps     =       32     ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls    =       2      ; NUMBER OF CHANNELS (1=MONO)
0dbfs     =       1      ; MAXIMUM AMPLITUDE
          massign 0,3    ; send all midi notes to instr 3 
            
giwave    ftgen   1,0, 4096,11, 1    ; GEN11 generated wave

instr    1
 ; read in widgets
 gkNHarms    cabbageGetValue "NHarms"
 gkLHarm     cabbageGetValue "LHarm"
 gkPow       cabbageGetValue "Pow"
 gkNHarms    init            1

 asig        poscil          1, 285, giwave
 asig        *=              cabbageGetValue:k("GraphGain")
;            dispfft         xsig, iprd,  iwsiz  [, iwtyp] [, idbout] [, iwtflg] [,imin] [,imax] 
             dispfft         asig, 0.001, 16384,      1,        0,         0,       0,      4096
   
    ; generate a trigger if any of the input variables changes
 ktrig       changed         gkNHarms,gkLHarm,gkPow
 if ktrig==1 then
             reinit          UPDATE
    endif
    UPDATE:
 giwave      ftgen           1, 0, 4096, 11, i(gkNHarms), i(gkLHarm), i(gkPow)
             rireturn
             cabbageSet      ktrig, "table1", "tableNumber", 1    ; update table display    
endin

instr    3
 icps        cpsmidi                     ; CPS from midi note played
 iamp        ampmidi   0.5               ; amplitude from midi note velocity 
 a1          oscili    iamp,icps,giwave  ; audio oscillator read GEN11 wave created
 aenv        linsegr   0,0.01,1,0.1,0    ; amplitude envelope to prevent clicks
 a1          =         a1 * aenv         ; apply envelope
             outs      a1, a1            ; send audio to outputs
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>