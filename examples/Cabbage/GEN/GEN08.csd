
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN08.csd
; Written by Iain McCurdy, 2013

; Demonstration of GEN08 (generates as smooth a line as possible between a sequence of user-defined break points)
; The user defines a number of nodes (the amplitude values between and locations at these nodes are modulated randomly)
; Random value sequence can be wrapped so that values are repeated for higher nodes.

; Nodes        -    number of nodes
; Wrap         -    number of nodes before wrap-around
; Speed        -    speed of random modulation
; Level        -    amplitude level of the synthesizer
; Reverb       -    amount of reverb 
; Env.Shape    -    Duration of attack and release of synthesizer notes 

<Cabbage>
form caption("GEN08"), size(410, 314), pluginId("gn08"), colour(120,70,170,150), guiMode("queue")

gentable bounds(  5,  5, 400, 120), channel("table1"), tableNumber(1), tableColour("yellow"), ampRange(-1,1,1), outlineThickness(2), tableGridColour(0,0,0,0), zoom(-1), fill(1)

rslider bounds( 15,130, 80, 80), channel("nodes"), text("Nodes"), textBox(1), valueTextBox(1), range(1, 16, 16,1,1),        colour(160,110,210,200), trackerColour("yellow"), outlineColour(100,100,100), fontColour("white"), textColour("white")
rslider bounds( 75,130, 80, 80), channel("wrap"), text("Repeat"), textBox(1), valueTextBox(1), range(2, 16,16,1,1),         colour(160,110,210,200), trackerColour("yellow"), outlineColour(100,100,100), fontColour("white"), textColour("white")
rslider bounds(135,130, 80, 80), channel("speed"), text("Speed"), textBox(1), valueTextBox(1), range(0.1,50,1,0.5),           colour(160,110,210,200), trackerColour("yellow"), outlineColour(100,100,100), fontColour("white"), textColour("white")
rslider bounds(195,130, 80, 80), channel("level"), text("Level"), textBox(1), valueTextBox(1), range(0, 1.00,0.1),          colour(160,110,210,200), trackerColour("yellow"), outlineColour(100,100,100), fontColour("white"), textColour("white")
rslider bounds(255,130, 80, 80), channel("reverb"), text("Reverb"), textBox(1), valueTextBox(1), range(0, 1.00,0.1),        colour(160,110,210,200), trackerColour("yellow"), outlineColour(100,100,100), fontColour("white"), textColour("white")
rslider bounds(315,130, 80, 80), channel("EnvShape"), text("Env.Shape"), textBox(1), valueTextBox(1), range(0, 2.00,0.5),   colour(160,110,210,200), trackerColour("yellow"), outlineColour(100,100,100), fontColour("white"), textColour("white")

keyboard bounds(  0,220,410, 80)

label    bounds(   2,301,110, 12), text("Iain McCurdy |2013|"), align("left")
</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps         =    8      ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls        =    2      ; NUMBER OF CHANNELS (1=MONO)
0dbfs         =    1      ; MAXIMUM AMPLITUDE
        massign    0,3    ; send all midi notes to instr 3 
        zakinit    1,40   ; initialise 40 zak k-rate channels

; default waveform. 16 nodes. Keeping table size low aids realtime performance.        
giwave    ftgen    1,0, 512, 8, 0, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16,rnd(2)-1, 512/16, 0


instr    1
    ; read in widgets
    gknodes    cabbageGetValue    "nodes"
    gknodes    init               16
    kwrap      cabbageGetValue    "wrap"
    kwrap      init               16
    kspeed     cabbageGetValue    "speed"
    gklevel    cabbageGetValue    "level"
    gkreverb   cabbageGetValue    "reverb"
    gkEnvShape cabbageGetValue    "EnvShape"
    
    iftlen     =                  ftlen(1)        ; length of function  table


; define a macro that will be used create a random amplitude
#define    RandParms(N)    
#
    kstr$N    rspline             -0.9,0.9,0.1*kspeed, 1*kspeed
              zkw                 kstr$N, $N
    kdur$N    rspline             0.01,0.9,0.1*kspeed, 1*kspeed
    kdur$N    limit               kdur$N, 0.1, 1
    kdur$N    init                1
              zkw                 kdur$N, $N + 20
    ival      =                   $N
#
; expand macro multiple times
$RandParms(1)
$RandParms(2)
$RandParms(3)
$RandParms(4)
$RandParms(5)
$RandParms(6)
$RandParms(7)
$RandParms(8)
$RandParms(9)
$RandParms(10)
$RandParms(11)
$RandParms(12)
$RandParms(13)
$RandParms(14)
$RandParms(15)
$RandParms(16)
$RandParms(17)


; define macro for reading random amplitude values        
#define    ReadParms(N)
#
kndx      wrap    $N, 1, kwrap
kstr$N    zkr     kndx
kdur$N    zkr     kndx+20
#
; expand macro multiple times
$ReadParms(1) 
$ReadParms(2) 
$ReadParms(3) 
$ReadParms(4) 
$ReadParms(5) 
$ReadParms(6) 
$ReadParms(7) 
$ReadParms(8) 
$ReadParms(9) 
$ReadParms(10)
$ReadParms(11)
$ReadParms(12)
$ReadParms(13)
$ReadParms(14)
$ReadParms(15)
$ReadParms(16)
$ReadParms(17)

    kdur17    rspline             0.1,0.9,0.1*kspeed, 1*kspeed
    kdur17    limit               kdur17, 0.01, 1


    if metro(256)==1 then    ; hold back rate of update. Tables updated at this rate. If too slow, glitching will be heard in the output, particularly if random movement speed is high. If too high CPU performance will suffer.
     reinit    UPDATE
    endif
    UPDATE:
    
    ; generation of wave for each configuration of number of nodes
    ; 1 node
    #define    N    #1#
    if i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1),   iftlen*(i(kdur2)/idursum),   0

    #define    N    #2#
    ; 2 nodes
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2),   iftlen*(i(kdur3)/idursum),   0

    #define    N    #3#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3),   iftlen*(i(kdur4)/idursum),   0

    #define    N    #4#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4),   iftlen*(i(kdur5)/idursum),   0

    #define    N    #5#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5),   iftlen*(i(kdur6)/idursum),   0

    #define    N    #6#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6),   iftlen*(i(kdur7)/idursum),   0

    #define    N    #7#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7) + i(kdur8)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6), iftlen*(i(kdur7)/idursum),i(kstr7),   iftlen*(i(kdur8)/idursum),   0

    #define    N    #8#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7) + i(kdur8) + i(kdur9)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6), iftlen*(i(kdur7)/idursum),i(kstr7), iftlen*(i(kdur8)/idursum),i(kstr8),   iftlen*(i(kdur9)/idursum),   0

    #define    N    #9#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7) + i(kdur8) + i(kdur9) + i(kdur10)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6), iftlen*(i(kdur7)/idursum),i(kstr7), iftlen*(i(kdur8)/idursum),i(kstr8), iftlen*(i(kdur9)/idursum),i(kstr9),   iftlen*(i(kdur10)/idursum),   0

    #define    N    #10#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7) + i(kdur8) + i(kdur9) + i(kdur10) + i(kdur11)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6), iftlen*(i(kdur7)/idursum),i(kstr7), iftlen*(i(kdur8)/idursum),i(kstr8), iftlen*(i(kdur9)/idursum),i(kstr9), iftlen*(i(kdur10)/idursum),i(kstr10),   iftlen*(i(kdur11)/idursum),   0

    #define    N    #11#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7) + i(kdur8) + i(kdur9) + i(kdur10) + i(kdur11) + i(kdur12)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6), iftlen*(i(kdur7)/idursum),i(kstr7), iftlen*(i(kdur8)/idursum),i(kstr8), iftlen*(i(kdur9)/idursum),i(kstr9), iftlen*(i(kdur10)/idursum),i(kstr10), iftlen*(i(kdur11)/idursum),i(kstr11),   iftlen*(i(kdur12)/idursum),   0

    #define    N    #12#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7) + i(kdur8) + i(kdur9) + i(kdur10) + i(kdur11) + i(kdur12) + i(kdur13)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6), iftlen*(i(kdur7)/idursum),i(kstr7), iftlen*(i(kdur8)/idursum),i(kstr8), iftlen*(i(kdur9)/idursum),i(kstr9), iftlen*(i(kdur10)/idursum),i(kstr10), iftlen*(i(kdur11)/idursum),i(kstr11), iftlen*(i(kdur12)/idursum),i(kstr12),   iftlen*(i(kdur13)/idursum),   0

    #define    N    #13#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7) + i(kdur8) + i(kdur9) + i(kdur10) + i(kdur11) + i(kdur12) + i(kdur13) + i(kdur14)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6), iftlen*(i(kdur7)/idursum),i(kstr7), iftlen*(i(kdur8)/idursum),i(kstr8), iftlen*(i(kdur9)/idursum),i(kstr9), iftlen*(i(kdur10)/idursum),i(kstr10), iftlen*(i(kdur11)/idursum),i(kstr11), iftlen*(i(kdur12)/idursum),i(kstr12), iftlen*(i(kdur13)/idursum),i(kstr13),   iftlen*(i(kdur14)/idursum),   0

    #define    N    #14#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7) + i(kdur8) + i(kdur9) + i(kdur10) + i(kdur11) + i(kdur12) + i(kdur13) + i(kdur14) + i(kdur15)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6), iftlen*(i(kdur7)/idursum),i(kstr7), iftlen*(i(kdur8)/idursum),i(kstr8), iftlen*(i(kdur9)/idursum),i(kstr9), iftlen*(i(kdur10)/idursum),i(kstr10), iftlen*(i(kdur11)/idursum),i(kstr11), iftlen*(i(kdur12)/idursum),i(kstr12), iftlen*(i(kdur13)/idursum),i(kstr13), iftlen*(i(kdur14)/idursum),i(kstr14),   iftlen*(i(kdur15)/idursum),   0

    #define    N    #15#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7) + i(kdur8) + i(kdur9) + i(kdur10) + i(kdur11) + i(kdur12) + i(kdur13) + i(kdur14) + i(kdur15) + i(kdur16)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6), iftlen*(i(kdur7)/idursum),i(kstr7), iftlen*(i(kdur8)/idursum),i(kstr8), iftlen*(i(kdur9)/idursum),i(kstr9), iftlen*(i(kdur10)/idursum),i(kstr10), iftlen*(i(kdur11)/idursum),i(kstr11), iftlen*(i(kdur12)/idursum),i(kstr12), iftlen*(i(kdur13)/idursum),i(kstr13), iftlen*(i(kdur14)/idursum),i(kstr14), iftlen*(i(kdur15)/idursum),i(kstr15),   iftlen*(i(kdur16)/idursum),   0

    #define    N    #16#
    elseif i(gknodes)==$N then
     idursum   =        i(kdur1) + i(kdur2) + i(kdur3) + i(kdur4) + i(kdur5) + i(kdur6) + i(kdur7) + i(kdur8) + i(kdur9) + i(kdur10) + i(kdur11) + i(kdur12) + i(kdur13) + i(kdur14) + i(kdur15) + i(kdur16) + i(kdur17)
     giwave    ftgen    1,0, iftlen, 8, 0, iftlen*(i(kdur1)/idursum),i(kstr1), iftlen*(i(kdur2)/idursum),i(kstr2), iftlen*(i(kdur3)/idursum),i(kstr3), iftlen*(i(kdur4)/idursum),i(kstr4), iftlen*(i(kdur5)/idursum),i(kstr5), iftlen*(i(kdur6)/idursum),i(kstr6), iftlen*(i(kdur7)/idursum),i(kstr7), iftlen*(i(kdur8)/idursum),i(kstr8), iftlen*(i(kdur9)/idursum),i(kstr9), iftlen*(i(kdur10)/idursum),i(kstr10), iftlen*(i(kdur11)/idursum),i(kstr11), iftlen*(i(kdur12)/idursum),i(kstr12), iftlen*(i(kdur13)/idursum),i(kstr13), iftlen*(i(kdur14)/idursum),i(kstr14), iftlen*(i(kdur15)/idursum),i(kstr15), iftlen*(i(kdur16)/idursum),i(kstr16),   iftlen*(i(kdur17)/idursum),   0
    
    endif
    
    rireturn

     cabbageSet    metro:k(32), "table1", "tableNumber", 1     ; update table display    
endin

gaSendL,gaSendR    init    0    ; initialise reverb send variables

instr    3
    icps    cpsmidi                    ; CPS from midi note played
    iamp    ampmidi    1                ; amplitude from midi note velocity 
    
    a1    oscili    iamp*gklevel,icps/4,giwave                                      ; audio oscillator read GEN08 wave created
    a1    *=        oscili:a(1,(icps/4)+oscili:a(icps/100,icps/4,giwave),giwave)    ; ring modulate it with itself    
    
    a2    delay    -a1,0.01 ; delay the right channel

    aenv    transegr    0,2*i(gkEnvShape)+1/kr,-4,1,4*i(gkEnvShape)+1/kr,-4,0    ; amplitude envelope

    a1    =    a1 * aenv            ; apply envelope
    a2    =    a2 * aenv            ; apply envelope
    
    gaSendL    =    gaSendL + (a1*gkreverb)
    gaSendR    =    gaSendR + (a2*gkreverb)
        outs    a1*(1-gkreverb), a2*(1-gkreverb)    ; send audio to outputs
endin


instr    99
    a1,a2    reverbsc    gaSendL,gaSendR, 0.85, 8000
        outs        a1,a2
        clear        gaSendL,gaSendR
endin

</CsInstruments>

<CsScore>
i 1  0 z
i 99 0 z
</CsScore>

</CsoundSynthesizer>
