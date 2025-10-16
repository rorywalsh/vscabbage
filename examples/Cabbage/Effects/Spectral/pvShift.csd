
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; pvShift.csd
; Written by Iain McCurdy, 2012.

; Streaming phase vocoding frequency shifter.

; Shift      - amount of frequency shift in hertz
; Multiplier - scaling factor applied to 'Shift'
; SHIFT      - The actual shifting frequency that results from the previous two controls is printed to a number box (nslider)
; Lowest     - lowest frequency that will be shifted
; Feedback   - amount (ratio) of signal that will be fed back into the input
; FFT Size   - FFT analysis size. Larger values will allow finer frequency resolution 
;               but also lower resolution in the time domain and a higher CPU load.
; Mix        - dry/wet mix
; Level      - level of the frequency-shifted signal

<Cabbage>
form caption("pvshift Frequency Shifter") size(650,232), pluginId("shft"), guiMode("queue"), colour(200,180,180)

#define SLIDER_DESIGN colour(180,160,160), trackerColour(240,240,100), trackerBackgroundColour(0,0,0,0), valueTextBox(1), textColour("black"), fontColour("black"), markerStart(0), markerEnd(1), markerThickness(.7),  markerColour("black"), outlineColour(0,0,0,0), trackerInsideRadius(0.9),

label    bounds(  5, 25, 75, 13), text("Input"), fontColour("black")
combobox bounds(  5, 40, 75, 20), channel("Input"), text("Live (St.)","Live (M.)","Test"), value(1), $COMBOBOX_DESIGN

rslider bounds( 80,  5, 70, 90), text("Shift"), channel("shift"), range(-4000, 4000, 0, 1, 0.1), $SLIDER_DESIGN
label   bounds(124, 39, 50, 20), text("x"), align("centre"), fontColour("black")
rslider bounds(150,  5, 70, 90), text("Multiplier"), channel("mult"), range(-1, 1, 1, 1, 0.0001), $SLIDER_DESIGN
nslider bounds(220, 28, 70, 30), text("SHIFT"), channel("shiftRes"), range(-4000, 4000, 1, 1, 0.01), active(0), $SLIDER_DESIGN

rslider bounds(290,  5, 70, 90), text("Lowest"), channel("lowest"), range( 0, 20000, 20, 0.5, 0.1), $SLIDER_DESIGN
rslider bounds(360,  5, 70, 90), text("Feedback"), channel("FB"), range(0, 1.00, 0), $SLIDER_DESIGN
label    bounds(435,10, 60,13), text("FFT Size"), fontColour("black")
combobox bounds(435,25, 60,20), text("128","256","512","1024","2048","4096","8192"), channel("FFT"), value(4), fontColour(220,220,255)
rslider bounds(500,  5, 70, 90), text("Mix"), channel("mix"), range(0, 1.00, 1), $SLIDER_DESIGN
rslider bounds(570,  5, 70, 90), text("Level"), channel("lev"), range(0, 1.00, 0.5, 0.5), $SLIDER_DESIGN

checkbox bounds(  5,105,100, 12), channel("GraphOnOff"), value(1), text("Graph On/Off"), fontColour:0("black"), fontColour:1("black")
gentable bounds(  5,120,640,100), tableNumber(99), tableColour(255,0,0), channel("ampFFT"), outlineThickness(1), tableBackgroundColour("white"), tableGridColour(100,100,100,50), ampRange(0,1,99), outlineThickness(0), fill(1), sampleRange(0, 512) 

label   bounds(  4,220,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour("black")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n --displays
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =     32
nchnls       =     2
0dbfs        =     1    ;MAXIMUM AMPLITUDE

; Iain McCurdy
; http://iainmccurdy.org/csound.html
; Frequency shifting effect using pvshift opcode.

; waveform for test tone
giWfm  ftgen  0,0,2048, 10, 1,0,0,0,0,0,0,1 ; test tone waveform

opcode    pvshift_module,af,akkkkki
    ain,kshift,klowest,kfeedback,kmix,klev,iFFT    xin
    f_FB        pvsinit iFFT,iFFT/4,iFFT,1, 0                           ; INITIALISE FEEDBACK FSIG
    f_anal      pvsanal ain, iFFT,iFFT/4,iFFT,1                         ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    f_mix       pvsmix  f_anal, f_FB                                    ; MIX AUDIO INPUT WITH FEEDBACK SIGNAL
    f_shift     pvshift f_mix, kshift, klowest                          ; SHIFT FREQUENCIES
    f_FB        pvsgain f_shift, kfeedback                              ; CREATE FEEDBACK F-SIGNAL FOR NEXT PASS
    aout        pvsynth f_shift                                         ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
    amix        ntrpol  ain, aout, kmix                                 ; CREATE DRY/WET MIX
                xout    amix*klev,f_shift   
endop

instr    1
    ; AUDIO INPUT
    kInput    cabbageGetValue        "Input"
    if kInput==1 then
     ainL,ainR ins
    elseif kInput==2 then
     ainL      inch        1
     ainR      =           ainL
    else
     ainL     poscil                 0.5,220,giWfm
     ainR     =                      ainL
    endif
    
    kshift     cabbageGetValue    "shift"                     ; freq. shift (Hz.)
    kmult      cabbageGetValue    "mult"                      ; mult freq. control (multipler)
    kporttime  linseg             0,0.001,0.2
    kshift     lineto             kshift*kmult, kporttime     ; ultimate freq. shift is product of shift and mult controls
               cabbageSetValue    "shiftRes", kshift
    klowest    cabbageGetValue    "lowest"                    ; lowest shifted frequency
    kFB        cabbageGetValue    "FB"                        ; feedback amount
    kmix       cabbageGetValue    "mix"
    klev       cabbageGetValue    "lev"

    /* SET FFT ATTRIBUTES */
    kFFT       cabbageGetValue    "FFT"
    kFFT       init      4
    if changed:k(kFFT)==1 then
     reinit update
    endif
    update:
    iFFT         =                 2^(i(kFFT)+6)
    aoutL,foutL  pvshift_module    ainL,kshift,klowest,kFB,kmix,klev,iFFT
    aoutR,foutR  pvshift_module    ainR,kshift,klowest,kFB,kmix,klev,iFFT
    rireturn
                 outs              aoutL,aoutR

 ; SPECTRUM OUT GRAPH
 kGraphOnOff      cabbageGetValue    "GraphOnOff"
 if kGraphOnOff==1 then
 fBlur            pvsblur             foutL, 0.2  ,0.2
 iTabLen          =                   (iFFT / 2) + 1
 ipvsTab          ftgen               98, 0, iTabLen, 2, 0                ; initialise table
 idispTab         ftgen               99, 0, 1024, 2, 0                   ; initialise table
 kClock           metro               8                                   ; reduce rate of updates
 if  kClock==1 then                                                       
  kflag           pvsftw              fBlur, 98                           ; write envelope to function table
  reinit CREATE_DISP_TAB
 endif
 CREATE_DISP_TAB:
 idispTab         ftgen               99, 0, 1024, 18, 98, 1, 0, 1023     ; create display table
                  rireturn 
                  cabbageSet          kClock, "ampFFT", "tableNumber", idispTab 
 endif
 if trigger:k(kGraphOnOff,0.5,1)==1 then
  reinit CLEAR_TABLE
 endif
 CLEAR_TABLE:
 idispTab         ftgen               99, 0, 1024, 7, 0,1024,0     ; create display table
                  cabbageSet          "ampFFT", "tableNumber", idispTab  
 rireturn

endin

</CsInstruments>

<CsScore>
i 1 0 [60*60*24*7]
</CsScore>

</CsoundSynthesizer>