
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; GEN02
; Iain McCurdy, 2012, 2024
; demonstration of writing to GEN02 function tables and also a demonstration of Cabbage's 'gentable' widget
; the example creates an 8-note sequence of notes which can be played and looped in various ways

; Harm.        factor which controls a frequency shift applied to each note. Value here is arbitrary as freq shift is also dependent upon note number. Even number will produce harmonic results, odd numbers inharmonic results. Zero will result in no frequency shift.
; Filt.        shifts all filter cutoff envelopes up or down. (Zero = no shift). Value here is in octaves.
; Res.         resonance of the moogladder lowpass filter
; Dur.         duration of the filter envelope applied to each note (in seconds).
; Echo         amount of synth signal sent to the echo (delay) effect
; Repeats      number of echo/delay repeats. Actually the amount of feedback in the delay effect.
; Time         time spacing of echos. Related to tempo and numbers here are arbitary. 0 = 1/4 beat, 1 = 1/2 beat, 2 = 3/4 beat, 3 = 1 beat, 4 = 5/4 beats and so on
; Direction    three-way toggle switch to choose direction of the sequence looping: Forward, Forward/Backward or Backward
; Tempo        in beats per minute

<Cabbage>
form caption("GEN02"), size(720, 500), colour( 50, 50, 50),pluginId("gn02"), guiMode("queue")

#define RSliderStyle # colour("yellow"), outlineColour(100,100,100), trackerColour(150,150,150) valueTextBox(1) #

image   bounds(  5, 5, 50,490), colour(255,255,255,50), shape("sharp"), channel("ScrubberID")                                                                              
                                                                                                                                                                                                                                          
gentable bounds(  5,  5, 400,140), channel("table1"), alpha(0.5), tableNumber(1), tableColour("yellow"),ampRange(36,108,1,1), zoom(-1), tableGridColour(0,0,0,0), active(1)
label    bounds(  7,  5, 100, 12), text("NOTES"),      align("left"), fontColour(255,255,255,100)
nslider  bounds(  5,145, 50, 22), channel("Note1"), range(36,108,0,1,1), active(0)
nslider  bounds( 55,145, 50, 22), channel("Note2"), range(36,108,0,1,1), active(0)
nslider  bounds(105,145, 50, 22), channel("Note3"), range(36,108,0,1,1), active(0)
nslider  bounds(155,145, 50, 22), channel("Note4"), range(36,108,0,1,1), active(0)
nslider  bounds(205,145, 50, 22), channel("Note5"), range(36,108,0,1,1), active(0)
nslider  bounds(255,145, 50, 22), channel("Note6"), range(36,108,0,1,1), active(0)
nslider  bounds(305,145, 50, 22), channel("Note7"), range(36,108,0,1,1), active(0)
nslider  bounds(355,145, 50, 22), channel("Note8"), range(36,108,0,1,1), active(0)

gentable bounds(  5,170, 400,140), channel("table2"), alpha(0.5),  tableNumber(2), tableColour("green"), ampRange(0,1,2), zoom(-1), tableGridColour(0,0,0,0), active(1)
label    bounds(  7,170, 100, 12), text("AMPLITUDES"), align("left"), fontColour(255,255,255,100)
nslider  bounds(  5,310, 50, 22), channel("Amp1"), range(0,1,0), active(0)
nslider  bounds( 55,310, 50, 22), channel("Amp2"), range(0,1,0), active(0)
nslider  bounds(105,310, 50, 22), channel("Amp3"), range(0,1,0), active(0)
nslider  bounds(155,310, 50, 22), channel("Amp4"), range(0,1,0), active(0)
nslider  bounds(205,310, 50, 22), channel("Amp5"), range(0,1,0), active(0)
nslider  bounds(255,310, 50, 22), channel("Amp6"), range(0,1,0), active(0)
nslider  bounds(305,310, 50, 22), channel("Amp7"), range(0,1,0), active(0)
nslider  bounds(355,310, 50, 22), channel("Amp8"), range(0,1,0), active(0)

gentable bounds(  5,335, 400,140), channel("table3"), alpha(0.5),  tableNumber(3), tableColour("blue"),  ampRange(1,4,3,0.5), zoom(-1), tableGridColour(0,0,0,0), active(1)
label    bounds(  7,335, 100, 12), text("DURATIONS"),  align("left"), fontColour(255,255,255,100)
nslider  bounds(  5,475, 50, 22), channel("Dur1"), range(1,4,1,1,0.5), active(0)
nslider  bounds( 55,475, 50, 22), channel("Dur2"), range(1,4,1,1,0.5), active(0)
nslider  bounds(105,475, 50, 22), channel("Dur3"), range(1,4,1,1,0.5), active(0)
nslider  bounds(155,475, 50, 22), channel("Dur4"), range(1,4,1,1,0.5), active(0)
nslider  bounds(205,475, 50, 22), channel("Dur5"), range(1,4,1,1,0.5), active(0)
nslider  bounds(255,475, 50, 22), channel("Dur6"), range(1,4,1,1,0.5), active(0)
nslider  bounds(305,475, 50, 22), channel("Dur7"), range(1,4,1,1,0.5), active(0)
nslider  bounds(355,475, 50, 22), channel("Dur8"), range(1,4,1,1,0.5), active(0)

image   bounds(410,  5,400,430), colour( 50, 50, 50), plant("controls"), shape("sharp")
{
rslider  bounds(110, 20, 80,110), channel("tempo"), text("Tempo"), range(10,500,150, 1, 1), $RSliderStyle
rslider  bounds(210, 20, 80,110), channel("amp"),   text("Level"), range(0, 1.00, 0.5),     $RSliderStyle

rslider bounds(  0,170, 75,100), channel("fshift"), text("Freq.Shift"), range(0, 32, 0,1,1),       $RSliderStyle
rslider bounds( 75,170, 75,100), channel("filt"),   text("Filt."),   range(-4.00, 4.00, 0),     $RSliderStyle
rslider bounds(150,170, 75,100), channel("res"),    text("Res."),    range(0, 0.99, 0.7),       $RSliderStyle
rslider bounds(225,170, 75,100), channel("dur"),    text("Dur."),    range(0.10, 4, 1,0.5),     $RSliderStyle

image   bounds( 20,300,270,130), colour(0,0,0,0), outlineThickness(1)
{
label   bounds(  0,  5,270,14), text("D E L A Y")
rslider bounds( 20, 20, 75,100), channel("echo"),   text("Echo"),    range(0, 1.00, 0.3),       $RSliderStyle
rslider bounds( 95, 20, 75,100), channel("rpts"),   text("Repeats"), range(0, 1.00, 0.4),       $RSliderStyle
rslider bounds(170, 20, 75,100), channel("time"),   text("Time"),    range(0, 7, 3,1,1),        $RSliderStyle
}

button  bounds( 10,  5, 80,23), text("Bwd.","Bwd."),           channel("bwd"),    value(0), fontColour:0(255,255,255,50), fontColour:1(105,255,105,250), radioGroup(1)
button  bounds( 10, 30, 80,23), text("Fwd./Bwd.","Fwd./Bwd."), channel("fwdbwd"), value(1), fontColour:0(255,255,255,50), fontColour:1(105,255,105,250), radioGroup(1)
button  bounds( 10, 55, 80,23), text("Fwd.","Fwd."),           channel("fwd"),    value(0), fontColour:0(255,255,255,50), fontColour:1(105,255,105,250), radioGroup(1)
button  bounds( 10, 80, 80,23), text("Freeze","Freeze"),       channel("freeze"), value(0), fontColour:0(255,255,255,50), fontColour:1(155,155,255,250), radioGroup(1)
button  bounds( 10,105, 80,23), text("Random","Random"),       channel("rnd"),    value(0), fontColour:0(255,255,255,50), fontColour:1(125,175,155,250), radioGroup(1)
button  bounds( 10,130, 80,23), text("Stop","Stop"),           channel("stop"),   value(0), fontColour:0(255,255,255,50), fontColour:1(255, 55, 55,250), radioGroup(1)
}

label    bounds(  0,487,717, 12), text("Iain McCurdy |2012|"), fontColour("silver"), align("right")
</Cabbage>                                                   
                    
<CsoundSynthesizer>                                                                                                 

<CsOptions>                                                     
-dm0 -n -+rtmidi=NULL -M0                                        
</CsOptions>
                                  
<CsInstruments>

; sr set by host
ksmps            =            32                 ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls           =            2                  ; NUMBER OF CHANNELS (1=MONO)
0dbfs            =            1                  ; MAXIMUM AMPLITUDE     

gisine        ftgen    0,0,4096,10,1

; function table numbers (tables created in score)
ginotes          =            1
giamps           =            2
gispeeds         =            3


/* UDOs */
opcode    scale_i, i, iii                        ; i-rate version of the 'scale' opcode
    ival,imax,imin xin
    ival         =            (ival*(imax-imin))+imin
                 xout         ival
endop

opcode    FreqShifter,a,aki                      ; frequency shifter
    ain,kfshift,ifn xin                          ; READ IN INPUT ARGUMENTS
    areal, aimag hilbert      ain                ; HILBERT OPCODE OUTPUTS TWO PHASE SHIFTED SIGNALS, EACH 90 OUT OF PHASE WITH EACH OTHER
    asin         oscili       1,    kfshift,     ifn,          0
    acos         oscili       1,    kfshift,     ifn,          0.25    
    ;RING MODULATE EACH SIGNAL USING THE QUADRATURE OSCILLATORS AS MODULATORS
    amod1        =            areal * acos
    amod2        =            aimag * asin    
    ;UPSHIFTING OUTPUT
    aFS          =            (amod1 - amod2)
                 xout         aFS                ;SEND AUDIO BACK TO CALLER INSTRUMENT
endop

instr    1                            ; play note sequence
    gktempo     cabbageGetValue    "tempo"                    ; read tempo from widget
    kstop       cabbageGetValue    "stop"
    gkspeed     init               1                          ; initialise speed value (may be changed later in instrument 3)
    gkdir       cabbageGetValue    "dir"
    gindx       init               0                          ; initialise index to the start of the sequence
    ginotecount init               0                          ; initialise note counter (counts all the notes that have occured without wrapping)
    ktrig       metro              (gktempo*gkspeed)/60       ; metronome
                schedkwhen         ktrig*(1-kstop),0,0,2,0,-1 ; trigger instr 2

                cabbageSetValue    "Note1", table:k(0,1), changed:k(table:k(0,1))
                cabbageSetValue    "Note2", table:k(1,1), changed:k(table:k(1,1))
                cabbageSetValue    "Note3", table:k(2,1), changed:k(table:k(2,1))
                cabbageSetValue    "Note4", table:k(3,1), changed:k(table:k(3,1))
                cabbageSetValue    "Note5", table:k(4,1), changed:k(table:k(4,1))
                cabbageSetValue    "Note6", table:k(5,1), changed:k(table:k(5,1))
                cabbageSetValue    "Note7", table:k(6,1), changed:k(table:k(6,1))
                cabbageSetValue    "Note8", table:k(7,1), changed:k(table:k(7,1))

                cabbageSetValue    "Amp1", table:k(0,2), changed:k(table:k(0,2))
                cabbageSetValue    "Amp2", table:k(1,2), changed:k(table:k(1,2))
                cabbageSetValue    "Amp3", table:k(2,2), changed:k(table:k(2,2))
                cabbageSetValue    "Amp4", table:k(3,2), changed:k(table:k(3,2))
                cabbageSetValue    "Amp5", table:k(4,2), changed:k(table:k(4,2))
                cabbageSetValue    "Amp6", table:k(5,2), changed:k(table:k(5,2))
                cabbageSetValue    "Amp7", table:k(6,2), changed:k(table:k(6,2))
                cabbageSetValue    "Amp8", table:k(7,2), changed:k(table:k(7,2))

                cabbageSetValue    "Dur1", table:k(0,3), changed:k(table:k(0,3))
                cabbageSetValue    "Dur2", table:k(1,3), changed:k(table:k(1,3))
                cabbageSetValue    "Dur3", table:k(2,3), changed:k(table:k(2,3))
                cabbageSetValue    "Dur4", table:k(3,3), changed:k(table:k(3,3))
                cabbageSetValue    "Dur5", table:k(4,3), changed:k(table:k(4,3))
                cabbageSetValue    "Dur6", table:k(5,3), changed:k(table:k(5,3))
                cabbageSetValue    "Dur7", table:k(6,3), changed:k(table:k(6,3))
                cabbageSetValue    "Dur8", table:k(7,3), changed:k(table:k(7,3))

endin

instr    2
    inote       table              gindx,ginotes              ; read note number from table (range: 0 - 1)
    inote       =                  int(inote)
    gknote      init               inote                      ; set global krate variable for note number
    iamp        table              gindx,giamps               ; read amplitude from table (range: 0 - 1)
    gkamp       init               iamp                       ; set global krate variable for amplitude
    ispeed      table              gindx,gispeeds             ; read speed from table (range: 0 - 1)
    ispeed      =                  int(ispeed)
    gkspeed     init               ispeed                     ; set global krate variable for speed
    idur        cabbageGetValue    "dur"                      ; read envelope duration from table
    gkcf        expseg             inote+(60*iamp),idur,inote,1,inote      ; create filter cutoff envelope
    kfilt       cabbageGetValue    "filt"                     ; read filter envelope shift from widget
    gkcf        limit              cpsmidinn(gkcf+(12*kfilt)),20,20000      ; convert envelope from note number to CPS, shift up or down and limit to prevent out of range values

    ibwd        cabbageGetValue    "bwd"
    ifwdbwd     cabbageGetValue    "fwdbwd"
    ifwd        cabbageGetValue    "fwd"
    irnd        cabbageGetValue    "rnd"
    ifreeze     cabbageGetValue    "freeze"
    istop       cabbageGetValue    "stop"
    if ibwd==1 then
     idir       =                  3
    elseif ifwdbwd==1 then
     idir       =                  2
    elseif ifwd==1 then
     idir       =                  1
    elseif irnd==1 then
     idir       =                  (int(random:i(0,2))*2)+1
                print              idir
    elseif ifreeze==1 then
     idir       =                  0
    elseif istop==1 then
     idir       =                  0
    endif
    


    /* MOVE AND PRINT SCRUBBER HIGHLIGHTER */
                cabbageSet         "ScrubberID", "bounds", 5 + (gindx*50), 5, 50,490               ; send new position to widget
    
        
    /* SHIFT INDEX FOR NEXT NOTE */
    if(idir==1)  then                                             ; FWD
     ginotecount =                 ginotecount+1                  ; increment note index
     gindx       wrap              ginotecount,0,ftlen(ginotes)   ; wrap out of range values
     gindx       =                 int(gindx)
    elseif(idir==2) then                                          ; FWD/BWD
     ginotecount =                 ginotecount+1                  ; increment note index 
     gindx       mirror            ginotecount,0,ftlen(ginotes)-1 ; mirror out of range values
     gindx       =                 int(gindx)
    elseif(idir==3) then                                          ; BWD
     ginotecount =                 ginotecount-1                  ; decrement note index 
     gindx       wrap              ginotecount,-0.5,ftlen(ginotes)-0.5 ; wrap out of range values
     gindx       =                 int(gindx)
    endif
endin

instr    3
    kres         cabbageGetValue   "res"                ; read in widgets...
    klev         cabbageGetValue   "amp"
    kecho        cabbageGetValue   "echo"
    krpts        cabbageGetValue   "rpts"
    kfshift      cabbageGetValue   "fshift"
    kporttime    linseg            0,0.001,1                   ; portamento time ramps up quickly from zero, holds at '1'                                 
    knote        portk             gknote,kporttime*0.001      ; portamento smoothing to note number changes         
    kcf          portk             gkcf,kporttime*0.001        ; portamento smoothing to filter cutoff frequency (prevents clicks resulting from discontinuities)
    kamp         portk             gkamp,kporttime             ; portamento smoothing to amplitude (prevents clicks resulting from discontinuities)
    a1           vco2              gkamp*klev,cpsmidinn(knote),0,0.5    ; VCO audio signal generator
    a1           moogladder        a1,kcf,kres                 ; moogladder lowpass filter                                                                                                                                                                                                                
    a1           FreqShifter       a1,cpsmidinn(knote)*kfshift*0.5,gisine    ; frequency shift applied to audio signal (using a UDO: see above). Frequency is a function of note number of the sequence and the on-screen control 'harm.'
    idry         ftgen             0,0,1024,7,1,512,1,512,0    ; table used to shape amplitude control of the 'dry' signal level
    kdry         table             kecho,idry,1                ; read 'dry' signal level
    aR           =                 a1 * klev * kdry            ; scale audio signal with 'Level' and 'Echo' controls
    aL           delay             aR,0.002                    ; slightly delay audio signal (used to create a stereo effect)
                 outs              aL,aR                       ; send audio to outputs (left channel slightly delayed)
    
    /* DELAY EFFECT */
    ktime        cabbageGetValue   "time"                      ; read delay time from widget (arbitrary value)
    itimes       ftgen             0,0,8, -2, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2    ; table of delay time multipliers
    kmult        table             ktime,itimes                ; read delay time multiplier
    ktempo       portk             gktempo,kporttime           ; long portamento smoothing to changes in tempo
    kmult        portk             kmult,kporttime*0.001       ; very short portamento smoothing to changes to delay time using the 'Time' widget
    kdeltim      =                 (60/ktempo)*kmult           ; calculate delay time
    adeltim      interp            kdeltim                     ; convert to a-rate with interpolation  
    abuf         delayr            (60*2)/10                   ; create an audio delay buffer
    atapL        deltapi           adeltim                     ; tap delay buffer
                 delayw            (aL*kecho)+(atapL*krpts)    ; write audio into delay buffer. Add in a bit of feedback
    abuf         delayr            (60*2)/10                   ; create an audio delay buffer
    atapR        deltapi           adeltim                     ; tap delay buffer
                 delayw            (aR*kecho)+(atapR*krpts)    ; write audio into delay buffer. Add in a bit of feedback
                 outs              atapL,atapR                 ; send audio to outputs (right channel slightly delayed)
endin                                                                                                                     


</CsInstruments>

<CsScore>
; tables for note numbers, velocities and speeds
f 1 0  8 -2  48 50 46 48 54 53 51 42
f 2 0  8 -2  0.8  0.37 0.4  0.7  0.4  0.8  0.45 0.5
f 3 0  8 -2  2 2 2 1 1 2 1 1

i 1 0 [3600*24*7]        ; instrument to play note sequence
i 3 0 [3600*24*7]        ; instrument to play note sequence
</CsScore>                            

</CsoundSynthesizer>
