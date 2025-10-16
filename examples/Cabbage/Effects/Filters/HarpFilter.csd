 
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; HarpFilter.csd
; Iain McCurdy 2017

; Creates a stack of waveguides simulating a resonating bank of strings
; ** WARNING **   THIS EFFECT CAN APPLY VAST AMOUNTS OF RESONATING FEEDBACK THEREFORE LARGE AMOUNTS OF GAIN ARE POSSIBLE.
;                 TAKE PARTICULAR CARE WHEN USING A LIVE AUDIO INPUT.
;                 IF IN DOUBT, REDUCE THE FEEDBACK VALUE.

; Tunings of strings are not controlled individually but are instead defined using several global controls.

; Play/Stop       -    Play the loaded sound file
; Open File       -    Browse, select and load a sound file as a potential source for the harp filters
; Speed           -    Speed of playback of the sound file (the sound file will loop)

; Freq. Input     -    Choose a mode for defining of the base frequency of the harp filters
;                      1. Freq.       - frequency in hertz using the dial control
;                      2. Note Number - a (MIDI) note number defined using the dial control
;                      3. Keyboard    - defined by MIDI notes. Polyphony is possible.

; Audio Input     -    audio input source for the harp filters:
;                      1. Live stereo input
;                      2. 'Dust' (sporadic single-sample impulses)
;                      3. P.Noise - pink noise
;                      4. W.Noise - white noise
;                      5. File - sound file (loaded above)
;                        It's not actually necessary to choose File, 
;                        but if chosen it will prevent other sources coming through 
;                        if the sound file playback is stopped.

; Filters
; INPUT FILTERS   -    highpass and lowpass filters applied to the stereo input signal before the harp filters.
;                       butterworth filters x 2 in series   
; OUTPUT FILTERS  -    highpass and lowpass filters applied to the stereo output signal after the harp filters.
;                       butterworth filters x 2 in series
; Low Cut         -    24dB/oct highpass filters that follow the fundamentals of the harp filters 

; LPF Cutoff - cutoff frequency of a lowpass filter within the feedback loop of the waveguide resonators.
;              available when wguide1 is chosen but not available when streson is chosen
;  Mode
; Cutoff          -    Cutoff frequency of a 1st order lowpass filter within the feedback loop of each waveguide unit

; Spacing         -    The spacing method used between adjacent waveguide filters: 
;                        1. Geometric (musical intervals) or 2. Arithmetic (harmonic)
; Interval        -    Interval factor between adjacent filters.
;                 If 'Spacing' is geometric then Interval is applied geometrically, each time multiplying it to the previous frequency to derive the next.
;                 In this mode the value Interval actually defines an interval in semitones so an interval of 12 will produce a ratio of 2
;                 e.g. if base frequency is 200 and interval is 12, the sequence is 200,400,800,1600 
;                 If 'Spacing' is 'Arithmetic' then this is applied arithmetically each time adding base_frequency to the frequency of the previous filter to derive the frequency of the next.
;                 e.g. if base frequency is 200, interval is 1, the sequence is 200,400,600,800 etc... i.e. harmonic
; Warp            -    increasingly warps the freqencies of harp filters via a power function. Can be useful for compensating for the pitch-distorting effect of low-pass filtering.
; Number          -    The number of waveguides to be created
; Lowest          -    The Lowest filter in the sequence. i.e. shift the stacks up in steps as this is increased.
; Reflect         -    If activated, additional waveguide filters are created at frequencies reflected beneath the base frequency according to the geometric or arithmetric rules. Activating 'Reflect' will double the number of filters used.
; Strength        -    number of series iterations of the filters (single/double/triple). Increasing numbers of iterations sharpens the filtering effect and increases the resonance.
; Filter Type     -    choose between wguide1 and streson. streson will provide better tuning but wguide1 will provide smoother results when modulating its cutoff frequency as well as lowpass filtering within its feedback loop.
; Width           -    offsets the frequencies of the left and right channels to imbue added stereo width
; Random          -    range of random offsets added to waveguide frequencies
; Tune            -    fine tune all filters within the range -100 to 100 cents.
; Amp. Tilt       -    tilt the amplitude weightings across the stack of filters:
;                       centre = all filters equal amplitude
;                       left = amplitude bias in favour of lower order filters
;                       right = amplitude bias in favour of lower order filters

; Port.           -    Portamento time applied to changes made to frequency for each waveguide (and by extension also changes made to 'Interval'). Large portamento times are possible thereby permitting slow morphs. 
; Port OS (offset)-    if non-zero, portamento times applied to the frequencies for each of the filters is randomly offset.
;                       with this feature, when frequencies are modulated using Freq. Interval, Wapr etc. eeach filter will take a different amount of timew to glide to its new value
; Feedback        -    feedback ratio of each waveguide unit. Take care when raising this to close to 1.
; FB.Mult.        -    multiplied to the previous number-box value to produce the actual value used for feedback. 
;                       This second control is provided to facilitate smooth transitions of feedback from a controlled maximum down to zero.
; Inv.            -    invert the polarity of the waveguide/string resonator feedback.
;                       With inverted polarity, the fundamental drops by 1 octave and only odd-ordered harmonics are produced by each reosnator.   
;                       negative feedback will shift the fundemental down one octave and only odd harmonics will be preset
; Attack          -    Attack time of each new note played 
; Decay           -    Decay time of the input sound once a note is released
; Release         -    Release time of the outputs of the waveguides after a note is released
; Mix             -    mix between the dry signal and the harp filters signal
; Level           -    Output amplitude control
; Safety Cutout   -    The instrument includes a safety cutout if peak amplitude exceeds 1. 
;                       This can be reset by clicking on the checkbox 
;                        but the problem that triggered the cutout (e.g. Feedback too high) in the first place should be remedied first.
<Cabbage>
form caption("Harp Filter") size(1435,370), pluginId("HaFi"), colour("silver"), guiMode("queue")

#define SLIDER_DESIGN2 textColour(100,100,100), trackerColour("black"), valueTextBox(0) fontColour(100,100,100), colour(20,20,20)

checkbox   bounds(  5,  5,  80, 15), channel("OnOff"), value(0), text("Play/Stop"), fontColour:0("black"), fontColour:1("black"), colour:0(50,50,20), colour:1(255,255,100)

filebutton bounds(  5, 25,  80, 20), text("Open File","Open File"), fontColour("White") channel("filename"), shape("ellipse")
soundfiler bounds( 90,  5,1340,145), channel("beg","len"), channel("filer1"), colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 95,  7, 200, 14), text(""), align("left"), channel("FileName"), fontColour("White")
rslider    bounds(  5, 50,  80, 90), channel("speed"), text("Speed"), valueTextBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(0,2,1,0.5)

image     bounds(  5,155,165,115), outlineThickness(1), line(1), outlineColour("darkslategrey")
{
label     bounds(  5,  5, 80, 13), text("Freq.Input"), fontColour("black")
combobox  bounds(  5, 20, 80, 16), text("Freq.","Note Number","Keyboard"), channel("input"), value(1)  
label     bounds(  5, 50, 80, 13), text("Audio Input"), fontColour("black")
combobox  bounds(  5, 65, 80, 16), text("Live","Dust","P.Noise","W.Noise","File"), channel("InSigMode"), value(3)  

rslider   bounds( 90, 35, 75, 75), channel("freq"), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(1,5000,220,0.5,0.01), valueTextBox(1), text("Freq.")
rslider   bounds( 90, 35, 75, 75), channel("NoteNumber"), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(10,110,57,1,0.01), visible(0), valueTextBox(1),, text("Note")

}

image     bounds(175,155,165,115), outlineThickness(1), line(1), outlineColour("darkslategrey")
{
label    bounds( 10,  3,145, 12), text("INPUT FILTERS"), align("centre"), fontColour("black")
image    bounds( 13, 28,139,  4), colour(0,0,0,0), outlineThickness(1), outlineColour("black")
hrange   bounds(  5, 20,155, 20), channel("InputHPF","InputLPF"), range(4,14,4:14), trackerColour(50,50,50), $SLIDER_DESIGN2
checkbox bounds( 10,  5, 10, 10), channel("InputFiltersOnOff"), value(0)

label    bounds( 10, 43,145, 12), text("OUTPUT FILTERS"), align("centre"), fontColour("black")
image    bounds( 13, 68,139,  4), colour(0,0,0,0), outlineThickness(1), outlineColour("black")
hrange   bounds(  5, 60,155, 20), channel("OutputHPF","OutputLPF"), range(4,14,4:14), trackerColour(50,50,50), $SLIDER_DESIGN2
checkbox bounds( 10, 45, 10, 10), channel("OutputFiltersOnOff"), value(0)

checkbox bounds( 10, 90, 70, 12), text("Low Cut"),     channel("LowCut"), fontColour:0("black"), fontColour:1("black")
}

image    bounds(345,155, 75,115), outlineThickness(1), line(1), outlineColour("darkslategrey"), shape("sharp"), plant("cutoff")
{
label    bounds(  5,  3, 65, 11), text("LPF Cutoff"), fontColour("black")
combobox bounds(  5, 15, 65, 16), text("Fixed","Ratio"), channel("CutoffMode"), value(1)  
rslider  bounds(  0, 35, 75, 75), text("Hertz"),      channel("cutoff"),      valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(20,22000,8000,0.5,1)
rslider  bounds(  0, 35, 75, 75), text("Ratio"),      channel("CutoffRatio"), valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(1,60,21,1,1)
}

image    bounds(425,155,505,115), outlineThickness(1), line(1), outlineColour("darkslategrey"), shape("sharp")
{
label    bounds( 15,  3, 80, 11), text("Spacing"), fontColour("black")
combobox bounds( 15, 15, 80, 16), text("Geometric","Arithmetic"), channel("type"), value(2)  
checkbox bounds(115, 15, 55, 12), text("Reflect"),      channel("dual"), fontColour:0("black"), fontColour:1("black")
label    bounds(185,  3, 80, 11), text("Strength"), fontColour("black")
combobox bounds(185, 15, 80, 16), text("Single","Double","Triple","Quadruple"), channel("Iterations"), value(1)
label    bounds(290,  3, 80, 11), text("Filter Type"), fontColour("black")
combobox bounds(290, 15, 80, 16), text("wguide1","streson"), channel("FilterType"), value(1)
rslider  bounds(  5, 35, 75, 75), text("Interval"),  channel("interval"),   valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(-12,12,0.25)
nslider  bounds(  5,192, 55, 22),                    channel("intervalD"),   range(-24,24,0.25,1,0.0001), colour("white"), fontColour("black")
rslider  bounds( 65, 35, 75, 75), text("Warp"),  channel("warp"),   valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(-1,1,0)
rslider  bounds(125, 35, 75, 75), text("Number"),     channel("max"),         valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(1,100,11,1,1)
rslider  bounds(185, 35, 75, 75), text("Lowest"),     channel("min"),      valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(1,100,1,1,1)
rslider  bounds(245, 35, 75, 75), text("Width"),      channel("StWidth"),   range(-0.5, 0.5, 0, 1,0.001), valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey")
rslider  bounds(305, 35, 75, 75), text("Random"),     channel("RndFactor"),   range(0, 5, 0, 0.5,0.001), valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey")
rslider  bounds(365, 35, 75, 75), text("Tune"),       channel("Tune"),       range(-100,100, 0, 1,1), valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey")
rslider  bounds(425, 35, 75, 75), text("Amp. Tilt"), channel("tilt"), range(0,4,2), valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey")
}

image    bounds(935,155,495,115), outlineThickness(1), line(1), outlineColour("darkslategrey"), shape("sharp")
{
;encoder  bounds( 35, 28,125, 77)  channel("feedback") repeatInterval(0.1) popupText("0") value(0.99) increment(0.0001), text("Feedback") valueTextBox(1), min(0), max(0.99999), colour("silver"), fontColour("silver"), textColour("black")
nslider  bounds( 65, 32, 65, 30), text("Feedback"), channel("feedback"),   range(0,0.99999,0.99,1,0.00001), colour(210,210,210), fontColour("black"), textColour("Black")
nslider  bounds(  0,  2, 75, 25), text("Port OS"), channel("PortOS"),   range(0,1,0.5,0.5,0.001), colour("white"), fontColour("black")
rslider  bounds(  0, 30, 75, 75), text("Port."),   channel("Portamento"), valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(0.1,99,0.1,0.5,0.01)
checkbox bounds( 80, 15, 75, 10), channel("FBInv"), value(0), text("Inv."), fontColour:0("black"), fontColour:1("black"), value(0) 
rslider  bounds(120, 30, 75, 75), text("FB.Mult."), channel("FBMult"),   valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(0,1,1,4)
rslider  bounds(180, 30, 75, 75), text("Attack"), channel("Att"),         valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(0.05,10,0.05,0.5)
rslider  bounds(240, 30, 75, 75), text("Decay"),  channel("Dec"),         valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(0.05,2,0.05,0.5)
rslider  bounds(300, 30, 75, 75), text("Release"),channel("Rel"),         valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(0.05,20,15,0.5,0.01)
rslider  bounds(360, 30, 75, 75), text("Mix"),    channel("Mix"),         valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(0,1,1,0.5,0.001)
rslider  bounds(420, 30, 75, 75), text("Level"),  channel("amp"),        valueTextBox(1), textBox(1), fontColour("black"), textColour("black"), trackerColour("DarkSlateGrey"), range(0,5,0.03,0.5,0.0001)

checkbox bounds(320, 10,110, 15), shape("ellipse"), text("Safety Cutout"), channel("SafetyCut"), fontColour:0("black"), fontColour:1("black"), colour:0(150,50,50), colour:1(255,100,100), value(0)
}

keyboard bounds(115,275,1200, 80)

label   bounds(  5,358,120, 11), text("Iain McCurdy |2017|"), align("left"), fontColour("black")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr is set by host
ksmps              =          32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =          2     ; NUMBER OF CHANNELS (2=STEREO)
0dbfs              =          1



                   seed       0
                   massign    0, 10
gSfilepath         init       ""
gSDropFile         init       ""
giFileChans        init       0
giSource           init       0 ; 0 = browser-opened file :: 1 = dropped file

giTriDist          ftgen      0, 0, 1024, 21, 3, 1
gkFilterType       init       1



; A RECURSIVE UDO IS USED TO CREATE THE STACK OF WGUIDE1S
opcode    filterstack, a, akkkkkkkkkkiiii                                                    ; OPCODE DEFINITION
 ain,kfreq,kRndFactor,kcutoff,kLowCut,kfeedback,kint,kwarp,kPortTime,kPortOS,ktype,iTiltTable,icount,imax,ifirst xin ; INPUT ARG NAMES
                ;setksmps      1 ;  prevents quantisation aretfacts but adds a significant overhead
 ; read amp-tilt value
 kTiltAmp       table         (icount - ifirst) / (imax - ifirst), iTiltTable, 1
 kTiltAmp       port          kTiltAmp, 0.1
 aTiltAmp       interp        kTiltAmp
 
 amix           =             0
 iRnd           trirand       1
 kRnd           =             iRnd * kRndFactor
 if ktype==0 then                                                                                 ; IF GEOMETRIC MODE HAS BEEN CHOSEN (PRODUCES EQUIDISTANT MUSICAL INTERVALS)
  kfreq2        =             kfreq * semitone(kint*(icount-1) + kRnd) * (1+kwarp)^icount         ; DEFINE FREQUENCY FOR THIS WGUIDE1 ACCORDING TO THE BASE FREQUENCY, INTERVAL AND THE COUNTER (LOCATION IN SERIES)
 else                                                                                             ; OTHERWISE MUST BE ARITHMETIC MODE (PRODUCES EQUIDISTANT FREQUENCY INTERVALS - HARMONIC)
  kfreq2        =             (kfreq+(kfreq*(icount-1)*kint)) * semitone(kRnd) * (1+kwarp)^icount ; DEFINE FREQUENCY FOR THIS WGUIDE1 ACCORDING TO THE BASE FREQUENCY, INTERVAL AND THE COUNTER (LOCATION IN SERIES)
 endif                                                                                            ; END OF CONDITIONAL
 if abs(kfreq2)>sr/3||abs(kfreq2)<20 then                                                         ; IF FREQUENCY IS OUTSIDE OF A SENSIBLE RANGE JUMP THE CREATION OF THE RESONATOR ALTOGETHER
  asig          =             0
 else
  kramp         linseg        0,0.001,1
  kfeedback     portk         kfeedback, kramp*0.1
  kfreq2        portk         kfreq2, kPortTime * kramp * (2 ^ ((random:i(0, 1)) * kPortOS))
  if gkFilterType==1 then
   asig         wguide1       ain, a(kfreq2), kcutoff, kfeedback  ; CREATE THE WGUIDE1 SIGNAL
  else
   asig         streson       ain*0.3, kfreq2, kfeedback
   asig         clfilt        asig,kcutoff, 0, 2
  endif
  if kLowCut==1 then
   asig         buthp         asig, kfreq2
   asig         buthp         asig, kfreq2      
  endif
 endif
 if icount<imax then                                 ; IF THERE ARE STILL MORE WGUIDES TO CREATE IN THE STACK...
   amix         filterstack   ain,kfreq,kRndFactor,kcutoff,kLowCut,kfeedback,kint,kwarp,kPortTime,kPortOS,ktype,iTiltTable,icount+1,imax,ifirst ; CALL THE UDO AGAIN
 endif                                               ; END OF CONDITIONAL
 skip:                                               ; LABEL - SKIP TO HERE IF THE FREQUENCY WAS OUT OF RANGE
                xout          (asig*aTiltAmp) + amix            ; SEND MIX OF ALL AUDIO BACK TO CALLER INSTRUMENT
endop                                                ; END OF UDO



; simply cuts audio completely if it exceeds 0dbfs
; threshold in dBFS 
opcode SafetyCut, ak, ak
aIn,kreset      xin
kpeak           peak            aIn
kcut            init            0                           ; safety cut status initialised to zero
if kpeak>1 then
 kcut           =               1                           ; cut status to 1 (cut off audio)
endif
if kreset==1 then                                           ; if reset trigger is 1...
 kcut           =               0                           ; reset cut status to off
 kpeak          =               0
endif
aOut            =               aIn * a(1-kcut)             ; scale audio by cut status (inverted)
                xout            aOut,kcut
endop









giTiltTable ftgen 1,0,1024,16,1,1024,0,1

instr    1
 ; amplitude tilt table
 iL1 ftgen 0,0,6,-2, 1, 1,1,0,0, 0
 iL2 ftgen 0,0,6,-2, 0, 0,1,1,1, 1
 iC  ftgen 0,0,6,-2, -4,0,0,0,4, 4
 ktilt cabbageGetValue "tilt"
 if changed:k(ktilt)==1 then
  kL1 tablei ktilt, iL1
  kL2 tablei ktilt, iL2
  kC  tablei ktilt, iC
  reinit REBUILD_TILT_TABLE
 endif
 REBUILD_TILT_TABLE:
 i_ ftgen giTiltTable,0,1024,16,i(kL1),ftlen(giTiltTable),i(kC),i(kL2)
 rireturn
 ; printk2 table:k(k(0),giTiltTable,1)

 ; SOUND FILE PLAYBACK
 gkOnOff        cabbageGetValue "OnOff"           ; play sound file
 if trigger:k(gkOnOff,0.5,0)==1 then
                event           "i",2,0,3600*24*7*365
 endif

 ; INPUT FILTERS
 kInputFiltersOnOff cabbageGetValue "InputFiltersOnOff"
 if trigger:k(kInputFiltersOnOff,0.5,0)==1 then
                event           "i",3,0,3600*24*7*365
 endif

 ; load file from browse
 gSfilepath     cabbageGetValue "filename"        ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then                    ; call instrument to update waveform viewer  
  event "i",99,0,0
 endif

 ; load file from dropped file
 gSDropFile     cabbageGet      "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
                 event          "i",100,0,0         ; load dropped file
 endif


gkinput        cabbageGetValue  "input"                    ; frequency input method (slider/keyboard)
gkinput        init             1

gkInSigMode    cabbageGetValue  "InSigMode"                ; input audio signal
if gkInSigMode==1 then
 gasigL,gasigR ins
elseif gkInSigMode==2 then                              ; &&gkinput!=1(temporaraily shelved) ; don't generate dust if 'keyboard' input is selected. It will be generated in instr 2.
 gasigL        dust2            0.5,10*randomh:k(0.5,2,4)
 gasigR        dust2            0.5,10*randomh:k(0.5,2,4)
 gasigL        tone             gasigL,cpsoct(randomh:k(4,14,50))
 gasigR        tone             gasigR,cpsoct(randomh:k(4,14,50))
elseif gkInSigMode==3 then
 gasigL        =                pinker()*0.2
 gasigR        =                pinker()*0.2
elseif gkInSigMode==4 then
 gasigL       noise             0.2,0
 gasigR       noise             0.2,0
else
 gasigL       =                 0
 gasigR       =                 0
endif
 gaDryL         =               gasigL
 gaDryR         =               gasigR

kporttime     linseg            0,0.001,0.03

gkfreq        cabbageGetValue  "freq"
gkNoteNumber  cabbageGetValue  "NoteNumber"
gkinterval    cabbageGetValue  "interval"
gkwarp        cabbageGetValue  "warp"
gkCutoffMode  cabbageGetValue   "CutoffMode"
gkcutoff      cabbageGetValue   "cutoff"
gkcutoff      portk             gkcutoff,kporttime
gkCutoffRatio cabbageGetValue   "CutoffRatio"
kfeedback     cabbageGetValue   "feedback"
kFBMult       cabbageGetValue   "FBMult"
gkfeedback    =                 kfeedback * kFBMult
kInv          cabbageGetValue   "FBInv"
gkfeedback    =                 gkfeedback * (((1-kInv) * 2)-1)
gkmax         cabbageGetValue   "max"
gkmin         cabbageGetValue   "min"
ktype         cabbageGetValue   "type"
ktype         init              2
gktype        =                 ktype - 1    ; COMBOBOX TO 0-1
gkAtt         cabbageGetValue   "Att"
gkDec         cabbageGetValue   "Dec"
gkRel         cabbageGetValue   "Rel"
gkMix         cabbageGetValue   "Mix"
gkamp         cabbageGetValue   "amp"
gkPortamento  cabbageGetValue   "Portamento"
gkPortOS      cabbageGetValue   "PortOS"
gkdual        cabbageGetValue   "dual"
gkLowCut      cabbageGetValue   "LowCut"
gkStWidth     cabbageGetValue   "StWidth"
gkRndFactor   cabbageGetValue   "RndFactor"
gkRndFactor   portk             gkRndFactor, kporttime
gkTune        cabbageGetValue   "Tune"
gkTune        *=                0.01                ; CONVERT FROM CENTS TO SEMITONES
gkLDiff       =                 semitone(-gkStWidth+gkTune)
gkRDiff       =                 semitone(gkStWidth+gkTune)    
gkIterations  cabbageGetValue   "Iterations"
gkFilterType  cabbageGetValue   "FilterType"
if changed(gkCutoffMode)==1 then
 if gkCutoffMode==1 then
             cabbageSet         k(1),"cutoff","visible",1
             cabbageSet         k(1),"CutoffRatio","visible",0
 else
             cabbageSet         k(1),"cutoff","visible",0
             cabbageSet         k(1),"CutoffRatio","visible",1
 endif   
endif

if changed(gkinput)==1 then
 if gkinput==1 then             ; frequency
            cabbageSet          k(1),"freq","visible",1
            cabbageSet          k(1),"NoteNumber","visible",0
 elseif gkinput==2 then         ; note number
            cabbageSet          k(1),"freq","visible",0
            cabbageSet          k(1),"NoteNumber","visible",1
 else                           ; keyboard
            cabbageSet          k(1),"freq","visible",0
            cabbageSet          k(1),"NoteNumber","visible",0
 endif   
endif

            event_i             "i",10,0.001,-1    ; start instr 10 at startup

if changed(gkinput)==1 then     ; 
 if gkinput<3 then                                 ; i.e. not MIDI...
            event               "i",10,0,-1
 endif
endif
endin






instr 2 ; file playback
 if gkOnOff==0 then
                turnoff
 endif
 kspeed         cabbageGetValue "speed"
                cabbageSetValue "InSigMode", 5
 kporttime      linseg          0,0.01,0.05
 kspeed         portk           kspeed,kporttime
 if giFileChans==1 then
  gasigL        diskin2         gSfilepath,kspeed,0,1,0,8  
  gasigR        =               gasigL
 else
  gasigL,gasigR diskin2         gSfilepath,kspeed,0,1,0,8
 endif
 gaDryL         =               gasigL
 gaDryR         =               gasigR
endin



instr 3 ; input filters
 if cabbageGetValue:k("InputFiltersOnOff")==0 then
          turnoff
 endif

kInputHPF cabbageGetValue "InputHPF"
kInputLPF cabbageGetValue "InputLPF"
kporttime linseg          0,0.01,0.05
kInputHPF portk           cpsoct(kInputHPF), kporttime
kInputLPF portk           cpsoct(kInputLPF), kporttime
gasigL    buthp           gasigL, a(kInputHPF)
gasigR    buthp           gasigR, a(kInputHPF)
gasigL    butlp           gasigL, a(kInputLPF)
gasigR    butlp           gasigR, a(kInputLPF)

gasigL    buthp           gasigL, a(kInputHPF)
gasigR    buthp           gasigR, a(kInputHPF)
gasigL    butlp           gasigL, a(kInputLPF)
gasigR    butlp           gasigR, a(kInputLPF)

endin





        
instr    10
/* MIDI AND GUI INTEROPERABILITY */
iMIDIflag   =              0               ; IF MIDI ACTIVATED = 1, NON-MIDI = 0
            mididefault    1, iMIDIflag    ; IF NOTE IS MIDI ACTIVATED REPLACE iMIDIflag WITH '1'

if iMIDIflag==1 then                       ; IF THIS IS A MIDI ACTIVATED NOTE...
 inum       notnum
 ivel       veloc          0,1
 p1         =              p1 + (rnd(1000)*0.0001)
 if gkinput<3 then
  turnoff
 endif
 icps       cpsmidi                        ; READ MIDI PITCH VALUES - THIS VALUE CAN BE MAPPED TO GRAIN DENSITY AND/OR PITCH DEPENDING ON THE SETTING OF THE MIDI MAPPING SWITCHES
 kfreq      init           icps
else
 if gkinput==1 then                        ; frequency input
  kfreq     =              gkfreq
 elseif gkinput==2 then                    ; note number input
  kfreq     =              cpsmidinn(gkNoteNumber)
 endif
endif

if trigger:k(gkinput,2.5,0)==1&&iMIDIflag==0 then        ; turnoff non-midi notes if keyboard mode is selected
            turnoff
endif

kRelease    release

/* INPUT SIGNAL ENVELOPE */
aenv        linsegr        0,i(gkAtt),1,i(gkDec),0
asigL       =              gasigL * aenv
asigR       =              gasigR * aenv
aDryL       =              gaDryL * aenv
aDryR       =              gaDryR * aenv
    
/* DERIVE LOWPASS FILTER CUTOFF DEPENDING UPON MODE SELECTION */
if gkCutoffMode==2 then
 kcutoff    limit          gkCutoffRatio*kfreq,20,sr/2
else
 kcutoff    =              gkcutoff
endif    

/* PORTAMENTO TIME FUNCTION */
kPortTime   linseg         0,0.001,1
kPortTime   *=             gkPortamento

kchange     changed        gkmax,gkmin,gkIterations,gkdual,gkFilterType,gkLowCut        ;reiniting can also smooths interruptions and prevent very loud clicks
if kchange==1 then                    ;IF NUMBER OF WGUIDE1S NEEDED OR THE START POINT IN THE SERIES HAS CHANGED...
            reinit         update                    ;REINITIALISE THE STACK CREATION
endif            
update:                            ;REINIT FROM HERE
;CALL THE UDO. (ONCE FOR EACH CHANNEL.)
aresL       filterstack    asigL,      kfreq*gkLDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, i(gkmin), i(gkmax)+i(gkmin)-1, i(gkmin)
aresR       filterstack    asigR,      kfreq*gkRDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, i(gkmin), i(gkmax)+i(gkmin)-1, i(gkmin)
if i(gkIterations)>1 then
 aresL      filterstack    aresL*0.03, kfreq*gkLDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, i(gkmin), i(gkmax)+i(gkmin)-1, i(gkmin)
 aresR      filterstack    aresR*0.03, kfreq*gkRDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, i(gkmin), i(gkmax)+i(gkmin)-1, i(gkmin)
endif
if i(gkIterations)>2 then
 aresL      filterstack    aresL*0.03, kfreq*gkLDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, i(gkmin), i(gkmax)+i(gkmin)-1, i(gkmin)
 aresR      filterstack    aresR*0.03, kfreq*gkRDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, i(gkmin), i(gkmax)+i(gkmin)-1, i(gkmin)
endif
if i(gkIterations)>3 then
 aresL      filterstack    aresL*0.03, kfreq*gkLDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, i(gkmin), i(gkmax)+i(gkmin)-1, i(gkmin)
 aresR      filterstack    aresR*0.03, kfreq*gkRDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, i(gkmin), i(gkmax)+i(gkmin)-1, i(gkmin)
endif

if i(gkdual)==1 then    ; DUAL DIRECTION WGUIDE1S SELECTED (NOTE NEGATIVE 'kinterval'
 if i(gkmin)==1 then    ; DON'T DOUBLE UP FUNDEMENTAL IF 'Lowest' IS '1'
  imin      =              i(gkmin)+1
  imax      =              i(gkmax)+i(gkmin)-2
 else
  imin      =              i(gkmin)
  imax      =              i(gkmax)+i(gkmin)-1
 endif
 if gkmin==1&&gkmax==1 kgoto skip    ;IF 'Num.wguides' AND 'Lowest' ARE BOTH '1', DON'T CREATE ANY REFLECTED WGUIDE1S AT ALL     
 aresL2     filterstack    asigL,       kfreq*gkLDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, -gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, imin, imax, imin
 aresR2     filterstack    asigR,       kfreq*gkRDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, -gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, imin, imax, imin
 if i(gkIterations)>1 then
  aresL2    filterstack    aresL2*0.03, kfreq*gkLDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, -gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, imin, imax, imin
  aresR2    filterstack    aresR2*0.03, kfreq*gkRDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, -gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, imin, imax, imin
 endif
 if i(gkIterations)>2 then
  aresL2    filterstack    aresL2*0.03, kfreq*gkLDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, -gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, imin, imax, imin
  aresR2    filterstack    aresR2*0.03, kfreq*gkRDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, -gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, imin, imax, imin
 endif
 if i(gkIterations)>3 then
  aresL2    filterstack    aresL2*0.03, kfreq*gkLDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, -gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, imin, imax, imin
  aresR2    filterstack    aresR2*0.03, kfreq*gkRDiff, gkRndFactor, kcutoff, gkLowCut, gkfeedback, -gkinterval, gkwarp, kPortTime, gkPortOS, gktype, giTiltTable, imin, imax, imin
 endif
 aresL      +=             aresL2
 aresR      +=             aresR2
 skip:
endif
rireturn
aresL       dcblock2       aresL
aresR       dcblock2       aresR


; OUTPUT FILTERS
kOutputFiltersOnOff cabbageGetValue "OutputFiltersOnOff"
kOutputHPF          cabbageGetValue "OutputHPF"
kOutputLPF          cabbageGetValue "OutputLPF"
kporttime           linseg          0,0.01,0.05
kOutputHPF          portk           cpsoct(kOutputHPF), kporttime
kOutputLPF          portk           cpsoct(kOutputLPF), kporttime
if kOutputFiltersOnOff==1 then
 aresL              buthp           aresL, a(kOutputHPF)
 aresR              buthp           aresR, a(kOutputHPF)
 aresL              butlp           aresL, a(kOutputLPF)
 aresR              butlp           aresR, a(kOutputLPF)
 aresL              buthp           aresL, a(kOutputHPF)
 aresR              buthp           aresR, a(kOutputHPF)
 aresL              butlp           aresL, a(kOutputLPF)
 aresR              butlp           aresR, a(kOutputLPF)
endif

/* EXTEND RELEASE */
kenv         linsegr       1,i(gkRel),0
aresL        =             aresL * kenv
aresR        =             aresR * kenv
ktime        timeinsts
krms         rms           aresL,3
if krms<0.00001&&ktime>0.2&&iMIDIflag==1 then
             turnoff2      p1, 4, 0
endif

/* WET_DRY MIX */
aOutL        ntrpol        aDryL, aresL, gkMix
aOutR        ntrpol        aDryR, aresR, gkMix

aOutL        *=            gkamp * 0.1
aOutR        *=            gkamp * 0.1

; SAFETY CUTOFF 
kreset       init            0                    ; initialise reset trigger variable
aOutL,kcutL  SafetyCut       aOutL, kreset        ; scan left channel using SafetyCut UDO
aOutR,kcutR  SafetyCut       aOutR, kreset        ; scan right channel using SafetyCut UDO
kreset       =               0                    ; reset trigger to zero 
             cabbageSetValue "SafetyCut",k(1),trigger:k(kcutL+kcutR,0.5,0)                  ; turn GUI light indicator to 'on'
kSafetyCut   cabbageGetValue "SafetyCut" ; get value from light widget
kreset       trigger         kSafetyCut,0.5,1     ; if reset manually by the user, generate a trigger


             outs            aOutL, aOutR         ; SEND wguide OUTPUT TO THE AUDIO OUTPUTS
endin






instr    99 ; LOAD SOUND FILE
 giSource         =                           0
                  cabbageSet                  "filer1", "file", gSfilepath
 giFileChans      filenchnls                  gSfilepath
 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension   gSfilepath
                  cabbageSet                  "FileName","text",SFileNoExtension

endin

instr    100 ; LOAD DROPPED SOUND FILE
 giSource         =                           1
 giFileChans      filenchnls                  gSfilepath
                  cabbageSet                  "filer1", "file", gSDropFile

 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension   gSDropFile
                  cabbageSet                  "FileName","text",SFileNoExtension

endin


</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>