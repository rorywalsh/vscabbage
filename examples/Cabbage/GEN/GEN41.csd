
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN41.csd
; Written by Iain McCurdy, 2014, 2024.

; Demonstration of GEN41
; GEN41 can be used to genrate histogram-like function tables in which the number of times each value is repeated is defined by its associated probability value.
; The actual probabilities as fractions of 1 are the value divided by the sum of all probability values. (a total of '1' indicates all possibilities are represented.)

; In this example the histogram is used as a probability distribution from which notes are randomly chosen. Values define (midi) note numbers.

<Cabbage>
form caption("GEN41"), size(420, 409), pluginId("gn41"), colour(120,70,170,150), guiMode("queue")

gentable bounds(  5,  5, 410, 115), channel("table1"), tableNumber(1), tableColour("yellow"), outlineThickness(2), ampRange(36,84,1), zoom(-1), fill(0)

image    bounds(  5,  5, 1, 115), channel("Scrubber"), alpha(0.5)

groupbox bounds(0, 125,420,170), text("Histogram"), plant("histogram"), fontColour("white")
{

rslider bounds(  0, 25, 70, 70), channel("val1"), text("Value 1"), valueTextBox(1), textBox(1), range(36, 84, 60,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds( 50, 25, 70, 70), channel("val2"), text("Value 2"), valueTextBox(1), textBox(1), range(36, 84, 62,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(100, 25, 70, 70), channel("val3"), text("Value 3"), valueTextBox(1), textBox(1), range(36, 84, 64,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(150, 25, 70, 70), channel("val4"), text("Value 4"), valueTextBox(1), textBox(1), range(36, 84, 65,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(200, 25, 70, 70), channel("val5"), text("Value 5"), valueTextBox(1), textBox(1), range(36, 84, 67,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(250, 25, 70, 70), channel("val6"), text("Value 6"), valueTextBox(1), textBox(1), range(36, 84, 69,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(300, 25, 70, 70), channel("val7"), text("Value 7"), valueTextBox(1), textBox(1), range(36, 84, 71,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(350, 25, 70, 70), channel("val8"), text("Value 8"), valueTextBox(1), textBox(1), range(36, 84, 72,1,1), colour(160,110,210,200), trackerColour("white")

rslider bounds(  0, 95, 70, 70), channel("prob1"), text("Prob. 1"), valueTextBox(1), textBox(1), range(0, 100, 70,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds( 50, 95, 70, 70), channel("prob2"), text("Prob. 2"), valueTextBox(1), textBox(1), range(0, 100,  5,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(100, 95, 70, 70), channel("prob3"), text("Prob. 3"), valueTextBox(1), textBox(1), range(0, 100,  5,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(150, 95, 70, 70), channel("prob4"), text("Prob. 4"), valueTextBox(1), textBox(1), range(0, 100, 15,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(200, 95, 70, 70), channel("prob5"), text("Prob. 5"), valueTextBox(1), textBox(1), range(0, 100, 15,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(250, 95, 70, 70), channel("prob6"), text("Prob. 6"), valueTextBox(1), textBox(1), range(0, 100,  5,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(300, 95, 70, 70), channel("prob7"), text("Prob. 7"), valueTextBox(1), textBox(1), range(0, 100,  5,1,1), colour(160,110,210,200), trackerColour("white")
rslider bounds(350, 95, 70, 70), channel("prob8"), text("Prob. 8"), valueTextBox(1), textBox(1), range(0, 100, 70,1,1), colour(160,110,210,200), trackerColour("white")
}

groupbox bounds(0, 295,420,100), text("Synthesiser"), plant("synth"), fontColour("white"){
checkbox bounds( 15, 50,115, 17), channel("SynthOnOff"), text("On/Off"),  value(1), colour("yellow"), shape("square")
rslider  bounds( 75, 25, 70, 70), channel("lev"),  text("Level"), valueTextBox(1), textBox(1), range(0, 1.00, 0.7), colour(160,110,210,200), trackerColour("white")
rslider  bounds(125, 25, 70, 70), channel("rate"), text("Rate"), valueTextBox(1),  textBox(1), range(0.2,20,2,0.5,0.01), colour(160,110,210,200), trackerColour("white")
rslider  bounds(175, 25, 70, 70), channel("jit"),  text("Jitter"), valueTextBox(1),  textBox(1), range(0, 1, 0), colour(160,110,210,200), trackerColour("white")
rslider  bounds(225, 25, 70, 70), channel("vel"),  text("Velocity"), valueTextBox(1),  textBox(1), range(0, 1, 0), colour(160,110,210,200), trackerColour("white")
rslider  bounds(275, 25, 70, 70), channel("dur"),  text("Dur."), valueTextBox(1),  textBox(1), range(0.1, 3.00, 2), colour(160,110,210,200), trackerColour("white")
nslider  bounds(345, 40, 60, 30), channel("note"),  text("note"), range(0, 127, 0, 1, 1), colour(120,170,200, 50)
}

label    bounds( 4,396,110, 12), text("Iain McCurdy |2014|"), fontColour("silver"), align("left")

</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =     32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls       =     2    ; NUMBER OF CHANNELS (1=MONO)
0dbfs        =     1    ; MAXIMUM AMPLITUDE

; default waveform        
gihist    ftgen    1,0, 512, -41, 0, 100, 84, 256, 72, 128

instr    1
    iftlen       =                  ftlen(1)        ; length of function  table
    kftlen       init               iftlen
    
    ; read in widgets
    kval1        cabbageGetValue    "val1"
    kval2        cabbageGetValue    "val2"
    kval3        cabbageGetValue    "val3"
    kval4        cabbageGetValue    "val4"
    kval5        cabbageGetValue    "val5"
    kval6        cabbageGetValue    "val6"
    kval7        cabbageGetValue    "val7"
    kval8        cabbageGetValue    "val8"

    kprob1       cabbageGetValue    "prob1"
    kprob2       cabbageGetValue    "prob2"
    kprob3       cabbageGetValue    "prob3"
    kprob4       cabbageGetValue    "prob4"
    kprob5       cabbageGetValue    "prob5"
    kprob6       cabbageGetValue    "prob6"
    kprob7       cabbageGetValue    "prob7"
    kprob8       cabbageGetValue    "prob8"

    kprob1       init               64
    kprob2       init               64
    kprob3       init               64
    kprob4       init               64
    kprob5       init               64
    kprob6       init               64
    kprob7       init               64
    kprob8       init               64

    gklev        cabbageGetValue    "lev"
    gkSynthOnOff cabbageGetValue    "SynthOnOff"
    gkrate       cabbageGetValue    "rate"
    kjit         cabbageGetValue    "jit"
    gkdur        cabbageGetValue    "dur"

    ktrig        changed            kval1,kval2,kval3,kval4,kval5,kval6,kval7,kval8, kprob1,kprob2,kprob3,kprob4,kprob5,kprob6,kprob7,kprob8
    if ktrig==1 then    ; peg rate of update. Tables updated at this rate. If too slow, glitching will be heard in the output, particularly if random movement speed is high. If too high CPU performance will suffer.
     reinit    UPDATE
    endif
    UPDATE:
    gihist       ftgen              1,0, iftlen, -41, i(kval1), i(kprob1), i(kval2), i(kprob2),   i(kval3),i(kprob3),   i(kval4),i(kprob4),   i(kval5),i(kprob5),   i(kval6),i(kprob6),   i(kval7),i(kprob7),   i(kval8),i(kprob8)
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

; SCALE FOR REFLECTION DEPENDENT UPON MIDI NOTE NUMBER
giScal           ftgen              0,0,128, -27,  0, 0.9, 24, 0.9, 36, 0.85, 48, 0.75, 60, 0.65, 72, 0.35, 84, 0.001, 96, 0.001, 127;, 0.001

gisine           ftgen              0,0,4096,10,1

instr    2
    iNdx         random             0, 1                                ; generate a random value
                 cabbageSet         "Scrubber", "bounds",  5+iNdx*410,  5, 1, 115                     ; send position message to widget

    ivel         cabbageGetValue   "vel"
    iNote        table             iNdx,gihist,1                        ; read a random value from the function table
                 cabbageSetValue   "note", iNote                        ; print note to GUI
    aEnv         linsegr           0, 0.005, 1, p3-0.105, 1, 0.1, 0     ; amplitude envelope
    iPlk         random            0.2 - (0.1*ivel), 0.2 + (0.1*ivel)   ; point at which to pluck the string
    iDtn         random            -(0.05*ivel), 0.05*ivel              ; random detune
    irefl        table             iNote, giScal
    aSig         wgpluck2          0.58, 0.5*gklev, cpsmidinn(iNote+iDtn), iPlk, irefl   
    icf          ntrpol            12000,cpsoct(rnd(6)+6),ivel
    kcf          expon             icf,p3,50                            ; filter cutoff frequency envelope
    aSig         clfilt            aSig, kcf, 0, 2                      ; butterworth lowpass filter    
    aL,aR        pan2              aSig * aEnv, rnd(0.5*ivel)+0.5            ; random panning   
                 outs              aL, aR
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
