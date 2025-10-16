
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Demonstration of GEN17
; Written by Iain McCurdy, 2014, 2024

; GEN17 is used to create histograms (step functions) in which the use defines locations and values. That value is then held until the next location is specified.

; In this example the histogram is used as a probability distribution from which notes are randomly chosen. Values define (midi) note numbers.

<Cabbage>
form caption("GEN17"), size(420, 420), pluginId("gn17"), colour(120,170,200, 50), guiMode("queue")

gentable bounds(  5,  5, 410, 115), channel("table1"), tableNumber(1), tableColour("yellow"), outlineThickness(2), ampRange(24,82,1), zoom(-1), fill(0)
image    bounds(  5,  5, 1, 125), channel("Scrubber"), alpha(0.5)

groupbox bounds(0, 125,420,180), text("Histogram"), plant("histogram"), fontColour("white"){

rslider bounds(  0, 25, 70, 70), channel("val0"), text("Value 0"), valueTextBox(1), textBox(1), range(24, 82, 50,1,1), colour(120,170,200, 50), trackerColour("white")
rslider bounds( 50, 25, 70, 70), channel("val1"), text("Value 1"), valueTextBox(1), textBox(1), range(24, 82, 62,1,1),  colour(120,170,200, 50), trackerColour("white")
rslider bounds(100, 25, 70, 70), channel("val2"), text("Value 2"), valueTextBox(1), textBox(1), range(24, 82, 48,1,1),  colour(120,170,200, 50), trackerColour("white")
rslider bounds(150, 25, 70, 70), channel("val3"), text("Value 3"), valueTextBox(1), textBox(1), range(24, 82, 44,1,1),  colour(120,170,200, 50), trackerColour("white")
rslider bounds(200, 25, 70, 70), channel("val4"), text("Value 4"), valueTextBox(1), textBox(1), range(24, 82, 66,1,1),  colour(120,170,200, 50), trackerColour("white")
rslider bounds(250, 25, 70, 70), channel("val5"), text("Value 5"), valueTextBox(1), textBox(1), range(24, 82, 54,1,1),  colour(120,170,200, 50), trackerColour("white")
rslider bounds(300, 25, 70, 70), channel("val6"), text("Value 6"), valueTextBox(1), textBox(1), range(24, 82, 52,1,1),  colour(120,170,200, 50), trackerColour("white")
rslider bounds(350, 25, 70, 70), channel("val7"), text("Value 7"), valueTextBox(1), textBox(1), range(24, 82, 46,1,1),  colour(120,170,200, 50), trackerColour("white")

rslider bounds( 25,100, 70, 70), channel("loc1"), text("Len. 1"), valueTextBox(1), textBox(1), range(1, 512, 24,1,1), colour(120,170,200,50), trackerColour("white")
rslider bounds( 75,100, 70, 70), channel("loc2"), text("Len. 2"), valueTextBox(1), textBox(1), range(1, 512, 64,1,1), colour(120,170,200,50), trackerColour("white")
rslider bounds(125,100, 70, 70), channel("loc3"), text("Len. 3"), valueTextBox(1), textBox(1), range(1, 512, 64,1,1), colour(120,170,200,50), trackerColour("white")
rslider bounds(175,100, 70, 70), channel("loc4"), text("Len. 4"), valueTextBox(1), textBox(1), range(1, 512, 34,1,1), colour(120,170,200,50), trackerColour("white")
rslider bounds(225,100, 70, 70), channel("loc5"), text("Len. 5"), valueTextBox(1), textBox(1), range(1, 512, 64,1,1), colour(120,170,200,50), trackerColour("white")
rslider bounds(275,100, 70, 70), channel("loc6"), text("Len. 6"), valueTextBox(1), textBox(1), range(1, 512, 84,1,1), colour(120,170,200,50), trackerColour("white")
rslider bounds(325,100, 70, 70), channel("loc7"), text("Len. 7"), valueTextBox(1), textBox(1), range(1, 512, 64,1,1), colour(120,170,200,50), trackerColour("white")
}

groupbox bounds(0, 305,420,115), text("Synthesiser"), plant("synth"), fontColour("white")
{
checkbox bounds( 15, 50,115, 17), channel("SynthOnOff"), text("On/Off"),  value(1), colour("yellow"), shape("square")
rslider  bounds( 75, 25, 70, 70), channel("lev"),  text("Level"), valueTextBox(1), textBox(1), range(0, 1.00, 0.7), colour(120,170,200, 50), trackerColour("white")
rslider  bounds(125, 25, 70, 70), channel("rate"), text("Rate"), valueTextBox(1),  textBox(1), range(0.2,20,2,0.5,0.01), colour(120,170,200, 50), trackerColour("white")
rslider  bounds(175, 25, 70, 70), channel("jit"),  text("Jitter"), valueTextBox(1),  textBox(1), range(0, 1, 0), colour(120,170,200, 50), trackerColour("white")
rslider  bounds(225, 25, 70, 70), channel("vel"),  text("Velocity"), valueTextBox(1),  textBox(1), range(0, 1, 0), colour(120,170,200, 50), trackerColour("white")
rslider  bounds(275, 25, 70, 70), channel("dur"),  text("Dur."), valueTextBox(1),  textBox(1), range(0.1, 2.00, 1), colour(120,170,200, 50), trackerColour("white")
nslider  bounds(345, 40, 60, 30), channel("note"),  text("note"), range(0, 127, 0, 1, 1), colour(120,170,200, 50)
label    bounds(  5,100,110, 12), text("Iain McCurdy |2014|"), fontColour("grey"), align("left")
}
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

; default histogram        
gihist    ftgen    1,0, 512, -17, 0, 48, 128, 84, 256, 72

instr    1
    iftlen       =                  ftlen(1)        ; length of function  table
    kftlen       init               iftlen
    
    ; read in widgets
    kval0        cabbageGetValue    "val0"
    kval1        cabbageGetValue    "val1"
    kval2        cabbageGetValue    "val2"
    kval3        cabbageGetValue    "val3"
    kval4        cabbageGetValue    "val4"
    kval5        cabbageGetValue    "val5"
    kval6        cabbageGetValue    "val6"
    kval7        cabbageGetValue    "val7"

    kloc1        cabbageGetValue    "loc1"
    kloc2        cabbageGetValue    "loc2"
    kloc3        cabbageGetValue    "loc3"
    kloc4        cabbageGetValue    "loc4"
    kloc5        cabbageGetValue    "loc5"
    kloc6        cabbageGetValue    "loc6"
    kloc7        cabbageGetValue    "loc7"

    kloc1        init               64
    kloc2        init               64
    kloc3        init               64
    kloc4        init               64
    kloc5        init               64
    kloc6        init               64
    kloc7        init               64

    gklev        cabbageGetValue    "lev"
    gkSynthOnOff cabbageGetValue    "SynthOnOff"
    kjit         cabbageGetValue    "jit"
    gkrate       cabbageGetValue    "rate"
    gkdur        cabbageGetValue    "dur"
    
    ktrig    changed        kval0,kval1,kval2,kval3,kval4,kval5,kval6,kval7, kloc1,kloc2,kloc3,kloc4,kloc5,kloc6,kloc7
    if ktrig==1 then    ; peg rate of update. Tables updated at this rate. If too slow, glitching will be heard in the output, particularly if random movement speed is high. If too high CPU performance will suffer.
     reinit    UPDATE
    endif
    UPDATE:
    gihist    ftgen    1,0, iftlen, -17, 0, i(kval0), i(kloc1),\ 
                                         i(kval1), i(kloc1)+i(kloc2), \
                                         i(kval2), i(kloc1)+i(kloc2)+i(kloc3), \
                                         i(kval3), i(kloc1)+i(kloc2)+i(kloc3)+i(kloc4), \
                                         i(kval4), i(kloc1)+i(kloc2)+i(kloc3)+i(kloc4)+i(kloc5), \
                                         i(kval5), i(kloc1)+i(kloc2)+i(kloc3)+i(kloc4)+i(kloc5)+i(kloc6), \
                                         i(kval6), i(kloc1)+i(kloc2)+i(kloc3)+i(kloc4)+i(kloc5)+i(kloc6)+i(kloc7), \
                                         i(kval7)
    rireturn

                 cabbageSet         ktrig, "table1", "tableNumber", 1    ; update table display    
    
    ; TRIGGER SOME NOTES
    kSlowWob     rspline            0.5, 2, 0.01, 0.1
    kNoteTrig    init               1
    krhy         trandom            kNoteTrig, 0, 3
    krate        ntrpol             gkrate, gkrate*kSlowWob*(2^int(krhy))*0.75, kjit
    kNoteTrig    metro              krate
                 schedkwhen         kNoteTrig*gkSynthOnOff,0,0,2,0,gkdur
endin

; SCALE FOR REFLECTION DEPENDENT UPON MIDI NOTE NUMBER (LESS DAMPING FOR HIGHER NOTES)
giScal       ftgen                  0,0,128, -27,  0, 0.9, 24, 0.9, 36, 0.85, 48, 0.75, 60, 0.65, 72, 0.35, 84, 0.001, 96, 0.001, 127;, 0.001
;giScal      ftgen                  0,0,128, -27,  0, 0.983, 24, 0.983, 36, 0.971, 48, 0.939, 60, 0.855, 72, 0.747, 84, 0.364, 96, 0.001, 127


instr    2
    iNdx     random                 0, 1                                ; generate a random value
             cabbageSet             "Scrubber", "bounds",  5+iNdx*410,  5, 1, 115                     ; send position message to widget

    ivel     cabbageGetValue        "vel"
    iNote    table                  iNdx,gihist,1                         ; read a random value from the function table
             cabbageSetValue        "note", iNote                     ; print note to GUI
    aEnv     linsegr                0, 0.005, 1, p3-0.105, 1, 0.1, 0      ; amplitude envelope
    iPlk     random                 0.2 - (0.18*ivel), 0.2 + (0.18*ivel)    ; point at which to pluck the string
    iDtn     random                 -(0.05*ivel), 0.05*ivel               ; random detune
    irefl    table                  iNote, giScal                         ; read reflection value from giScal table according to note number  
    irefl    limit                  1-(irefl*(p3*0.5)),0,1
    aSig     wgpluck2               iPlk, gklev, cpsmidinn(iNote+iDtn), 0.28, irefl    ; generate Karplus-Strong plucked string audio 
    icf      ntrpol                 sr/2,cpsoct(rnd(8)+6),ivel
    kcf      expon                  icf,p3,50                             ; filter cutoff frequency envelope
    aSig     clfilt                 aSig, kcf, 0, 2                       ; butterworth lowpass filter    
    aL,aR    pan2                   aSig * aEnv, rnd(0.5*ivel)+0.5             ; random panning   
             outs                   aL, aR                                ; send audio to outputs
endin


</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>