
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN20.csd
; Written by Iain McCurdy, 2014

; GEN20 is a function table generation routine that creates a range of commonly encountered window functions that can have a range of uses.
; They are:
; 1 - Hamming
; 2 - Hanning
; 3 - Bartlett [Triangle]
; 4 - Blackman [3-term]
; 5 - Blackman-Harris [4-term]
; 6 - Gaussian
; 7 - Kaiser
; 8 - Rectangle
; 9 - Sync.

<Cabbage>
form caption("GEN20"), size(410, 234), pluginId("gn20"), colour("20,70,170,150"), guiMode("queue")

gentable bounds(  5,  5, 400, 120), tableNumber(1), channel("table1"), zoom(-1), ampRange(0,1,1), tableColour("LightSlateGrey"), zoom(-1), tablebackgroundColour("white"), fill(0), outlineThickness(2) tableGridColour(220,220,220,20)

combobox bounds(130, 130, 175,20), channel("window"), value(1), text("1. Hamming","2. Hanning","3. Bartlett [Triangle]","4. Blackman [3-term]","5. Blackman-Harris [4-term]","6. Gaussian","7. Kaiser","8. Rectangle","9. Sync.")

hslider  bounds(  5,150,340, 30), text("Option"), channel("opt"), range(0, 10.00, 1, 0.5), valueTextBox(1), textBox(1), trackerColour("yellow"), fontColour("white"), textColour("White")
label    bounds(  3,172,110, 11), text("[Gaussian & Kaiser]"),  fontColour("white")
checkbox bounds(345,158, 55, 13), text("x 100") channel("x100"), colour("yellow"), fontColour("white"),  value(0)

image bounds(-5,-125,4,4), colour("red"), channel("scrubber"), shape("sharp")

nslider  bounds(  5,190, 50, 30), text("Index"), channel("ndx"), range(0, 4095,1024, 1,1),    fontColour("white"), textColour("white")
nslider  bounds( 65,190,100, 30), text("Value"), channel("val"), range(0,    1, 0, 1,0.0001), fontColour("white"), textColour("white")

checkbox bounds(210,200,100, 13), text("Tone On/Off") channel("ToneOnOff"), colour("yellow"), fontColour:0("white"), fontColour:1("white"), value(0)

label    bounds(  8,222,110, 12), text("Iain McCurdy |2014|"), fontColour("silver"), align("left")
</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-dm0 -n -+rtmidi=null -M0
</CsOptions>

<CsInstruments>

;sr is set by the host
ksmps           =                  32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls          =                  2     ; NUMBER OF CHANNELS (1=MONO)
0dbfs           =                  1     ; MAXIMUM AMPLITUDE
            
giwindow        ftgen              1,0,4096,20,1,1,1

instr    1
    iTabSize    =                  ftlen(giwindow)
    
    ; read in widgets
    gkwindow    cabbageGetValue    "window"
    gkndx       cabbageGetValue    "ndx"
    gkndx       init               1024
    gkwindow    init               1
    gkopt       cabbageGetValue    "opt"
    gkopt       init               1
    gkx100      cabbageGetValue    "x100"
    gkToneOnOff cabbageGetValue    "ToneOnOff"
    
    ktrig1      changed            gkwindow
    ktrig2      changed            gkopt,gkx100
    if ktrig1==1 || ( (ktrig2==1&&(gkwindow==6||gkwindow==7))) then
     reinit UPDATE
    endif
    UPDATE:
     giwindow   ftgen              1,0,ftlen(giwindow),20,i(gkwindow),1,i(gkopt)* ((i(gkx100)*99)+1)
    rireturn
    if ktrig1==1||ktrig2==1 then
                cabbageSet         k(1),"table1","tableNumber",1
    endif
    
    ; Read index input and print value
    kval        table              gkndx,giwindow
    if changed(kval)==1||changed(gkndx)==1 then
     kval       table              gkndx,giwindow
                cabbageSetValue    "val",kval
     kxpos      =                  5 + (400 * (gkndx/iTabSize))
     kypos      =                  5 + (120 * (1-kval))     
                cabbageSet         k(1),"scrubber","bounds", kxpos-2, kypos+1, 2, 125-kypos-2
    endif
    
    ; CREATE A SOUND
    aenv        poscil             0.05*gkToneOnOff,1,giwindow
    asig        vco2               1,440,4,0.5
    asig        *=                 aenv
                outs               asig,asig
endin

</CsInstruments>

<CsScore>
i 1 0 z
e
</CsScore>

</CsoundSynthesizer>
