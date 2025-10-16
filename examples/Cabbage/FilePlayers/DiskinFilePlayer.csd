/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; DiskinFilePlayer.csd
; Written by Iain McCurdy, 2012, 2025.

; **consider improving stretch feature

; Plays a user-selected sound file using diskin2 opcode.
; Files can also be dropped onto the interface.
; Diskin reads sounds directly from disk, they are not loaded fully into RAM. 
; Therefore this file player is best suited for the playback of very long sound files and may be less well suited 
; - where dense polyphony is required although reading from modern SSDs can provide good performance .

; The sound file can be played back using the Play/Stop button (and the 'Transpose' / 'Speed' buttons to implement pitch/speed change)
;  or it can be played back using the MIDI keyboard.

; Note that for 'reverse' to be effective either 'loop' needs to be active or inskip needs to be something other than zero

; The stretch function works by reducing the speed during 'silent' sections. 
; 'Threshold' defines the RMS value beneath which audio is regarded as silence.
; During 'silent' sections, audio will be muted completely and 'Str.Ratio' will be multipled to the main 'Speed' 

; Playback speed can be modulated by a continuously varying random function

; Detect  -  when pressed, detects the pitch of the loaded sample and adjusts MIDI Ref accordingly so that MIDI keys will play the correct pitch

; Open File      -   browse for a file to be played back by diskin
; Play/Stop      -   play or stop single playback of the file. This is independent of triggering playback using the MIDI keyboard.
; Loop On/Off    -   if activated, once playback reaches the end of the file it continues again from the beginning.
;                     if playback direction is in reverse, the same behaviour applies to the beginning of the file.
; Reverse        -   reverse playback direction. 
;                     Note that reverse direction playback is also achievable by changing the 'Speed' dial to a negative number 
;                     but this button is still useful if 'Transpose' (which won't produce a negitive playback speed) is being to change playback speed.
; Interpolation  -   method used to devise missing sample values in particular when playback speed is reduced.
;                    The improvements can mostly clearly be heard when playback speed is very low.
;                    Low sample rates for the original file or DAW/Cabbage will also necessitate a more advanced method of interpolation.
;                    More advanced methods will have higher CPU demands
;                    The methods  are - from simple to more complex: 1. No Interp
;                                                                    2. Linear 
;                                                                    3. Cubic 
;                                                                    4. Point Sync
; Transpose      -   A method for changing playback speed that is expressed as a shift in semitones away from the original pitch of the sound file
; Speed          -   playback speed expressed as a ratio against the original speed of the file. Negative values will play the file in reverse.
; Uni-Dir        -   unipolar playback direction. Relates to how 'Speed' control values are interpretted. If activated, negative sign on values for 'Speed' is ignored. If 'Reverse' is engaged, playback direction will be only reverse.
; In Skip        -   a ratio of the duration of the original file from which playback will begin.
; Att. Time      -   duration in seconds of the attack time of an amplitude envelope that will be applied to the sound
; Rel. Time      -   duration in seconds of the release time of an amplitude envelope that will be applied to the sound

; Level          -   output level

; S T R E T C H: stretches a sound file by dropping playback speed during silences only.
;                this has quite specific use cases for sound files that contains intervening moments of silence such as percussion/drum loops or speech.
;                in addtion, silence-stretching sections are muted to remove any residual noise, like a noise gate.
; On/Off         -   turn this feature on/off
; Threshold      -   amplitude below which the silence-stretching will be applied
; Str. Ratio     -   playback speed ratio during detected silences

; SPEED MODULATION: random modulation of playback speed
; Mod. Range     -   range of random modulations (in octaves)
; Rate 1         -   minimum rate of random modulations
; Rate 2         -   maximum rate of random modulations (actually minimum and maximum can be inverted so these definitions are arbitrary)

; FOLLOW FILTER: a filter, the cutoff frequency of which follows the playback speed of the file
; On/Off         -   turn this feature on and off
; Type           -   filter type. Choose between:
;                    1. resonant low-pass filter
;                    2. band-pass filter
; Frequency      -   base cutoff/centre frequency of the filter before it is further modulated by the playback speed
; Resonance      -   resonance/Q of the filter

; MIDI
; Detect         -   attempts to detect the pitch of the chosen sound file for diskin. The detected value is applied to 'MIDI Ref.' so that MIDI keys played will correspond to the pitch heard.
;                    this feature should work properly with samples that play a single note of constant pitch. 
; MIDI Ref.      -   the MIDI key (note number) that will correspond to untransposed (speed = 1) playback of the sound file.
; Tuning         -   tuning of the MIDI keyboard
; Legato         -   on/off button for monophonic-legato playback of the sound file 
; Legato Time    -   legato (glissando) time between sequential notes 
; Bend Range     -   range of how the MIDI pitch bender will affect transposition (playback speed) 

<Cabbage>
form caption("Diskin File Player") size(980, 490), pluginId("DkPl"), colour( 50, 30, 30), guiMode("queue")

soundfiler bounds(  5,  5, 970,140), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
image      bounds(  5,  5,   1,140), channel("InskipIndicator"), alpha(0.5)
label      bounds(10, 8, 560, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")

image bounds(0,150,1175,160), colour(0,0,0,0), plant("controls")
{
filebutton bounds(  5,  5, 80, 25), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse")
checkbox   bounds(  5, 40, 95, 25), channel("PlayStop"), text("Play/Stop"), colour("lime"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3)

checkbox   bounds(110,  5,100, 15), channel("loop"), text("Loop On/Off"), colour("yellow"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3)
checkbox   bounds(110, 22,100, 15), channel("reverse"), text("Reverse"), colour("yellow"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3)
label      bounds(123, 45, 75, 12), text("Interpolation"), fontColour("white")
combobox   bounds(110, 58,100, 20), channel("interp"), items("No interp.", "Linear", "Cubic", "Point Sinc"), value(3), fontColour("white")

rslider    bounds(215,  5, 90, 90), channel("transpose"), range(-48, 48, 0,1,0.01),            colour( 90, 50, 50), trackerColour("silver"), text("Transpose"), textColour("white"), valueTextBox(1)
rslider    bounds(285,  5, 90, 90), channel("speed"),     range(-16, 16.00, 1),             colour( 90, 50, 50), trackerColour("silver"), text("Speed"),     textColour("white"), valueTextBox(1)
checkbox   bounds(365, 43, 80, 15), channel("UniDir"), text("Uni-Dir."), colour("yellow"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3)
rslider    bounds(430,  5, 90, 90), channel("inskip"),    range(  0,  1.00, 0),             colour( 90, 50, 50), trackerColour("silver"), text("In Skip"),   textColour("white"), valueTextBox(1)
rslider    bounds(510,  5, 90, 90), channel("AttTim"),    range(0,     8, 0, 0.5, 0.001),   colour( 90, 50, 50), trackerColour("silver"), text("Att. Time"),   textColour("white"), valueTextBox(1)
rslider    bounds(580,  5, 90, 90), channel("RelTim"),    range(0.01, 25, 0.05, 0.5, 0.001),colour( 90, 50, 50), trackerColour("silver"), text("Rel. Time"),   textColour("white"), valueTextBox(1)

rslider    bounds(660,  5, 90, 90), channel("level"),     range(  0,  3.00, 1, 0.5),        colour( 90, 50, 50), trackerColour("silver"), text("Level"),  textColour("white"), valueTextBox(1)
}

image bounds(745,150,230,110), colour(0,0,0,0), outlineColour("silver"), outlineThickness(1), shape("sharp"), corners(5)
{
label    bounds(  0,  5,230,13), text("S P E E D   M O D U L A T I O N"), fontColour("white")
nslider  bounds(  5, 55, 70, 35), channel("ModRange"), range(0,4,0,1,0.001),  colour( 90, 50, 50), text("Mod.Range"), textColour("white")
nslider  bounds( 80, 55, 70, 35), channel("Rate1"), range(0,99,10,1,0.001),  colour( 90, 50, 50), text("Rate 1"), textColour("white")
nslider  bounds(155, 55, 70, 35), channel("Rate2"), range(0,99,20,1,0.001),  colour( 90, 50, 50), text("Rate 2"), textColour("white")
}



image    bounds(  5,265,160,110), colour(0,0,0,0), outlineColour("silver"), outlineThickness(1), shape("sharp"), corners(5)
{
label    bounds(  0,  5,160,13), text("S T R E T C H"), fontColour("white")
checkbox bounds(  5, 30, 80, 15), channel("StretchOnOff"), text("On/Off"), popupText("Reduce speed during silences"), fontColour:0(255,255,255), fontColour:1(255,255,255), colour:0( 90, 90,0), colour:1(255,255,0), corners(3)
nslider  bounds(  5, 55, 70, 35), channel("threshold"), range(0,1,0.005,1,0.001),  colour( 90, 50, 50), text("Threshold"), textColour("white")
nslider  bounds( 80, 55, 70, 35), channel("stretchratio"), range(0.01,8.00,0.25,1,0.01),  colour( 90, 50, 50), trackerColour("silver"), text("Stretch Ratio"), textColour("white")
}

image bounds(170,265,340,110), colour(0,0,0,0), outlineColour("silver"), outlineThickness(1), shape("sharp"), corners(5)
{
label     bounds(  0,  5,340,13), text("F O L L O W   F I L T E R"), fontColour("white")
checkbox  bounds( 10, 45, 80, 15), channel("FollowFiltOnOff"), text("On/Off"), fontColour:0(255,255,255), fontColour:1(255,255,255), colour:0( 90, 90,0), colour:1(255,255,0), corners(3)
label     bounds( 90, 30, 83, 13), text("Type"), fontColour("white")
combobox  bounds( 90, 45, 83, 22), channel("FiltType"), items("Lowpass", "Bandpass"), value(1),fontColour("white")
rslider   bounds(180, 20, 85, 85), channel("CF"), text("Frequency"),  range(  20,8000,1000,0.5,0.1), colour( 90, 50, 50), trackerColour("silver"), textColour("white"), valueTextBox(1)
rslider   bounds(250, 20, 85, 85), channel("Res"), text("Resonance"),  range(  0,1,0), colour( 90, 50, 50), trackerColour("silver"), textColour("white"), valueTextBox(1)
}

image bounds(515,265,460,110), colour(0,0,0,0), outlineColour("silver"), outlineThickness(1), shape("sharp"), corners(5)
{
label      bounds(  0,  5,460,13), text("M I D I"), fontColour("white")
button     bounds( 10, 35, 55, 25), channel("Detect"), text("Detect","Detect"), corners(5), colour:0(100,100,130), colour:1(100,100,130), latched(0)
rslider    bounds( 70, 20, 85, 85), channel("MidiRef"),   range(0,127,60, 1, 0.001),            colour( 90, 50, 50), trackerColour("silver"), text("MIDI Ref."), textColour("white"), valueTextBox(1)
label      bounds(165, 23, 83, 13), text("Tuning"), fontColour("White")
combobox   bounds(165, 40, 83, 22), channel("Tuning"), items("12-TET", "24-TET", "12-TET rev.", "24-TET rev.", "10-TET", "36-TET", "Just C", "Just C#", "Just D", "Just D#", "Just E", "Just F", "Just F#", "Just G", "Just G#", "Just A", "Just A#", "Just B"), value(1),fontColour("white")
checkbox   bounds(165, 70,100, 15), channel("Legato"), text("Legato"), colour("yellow"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3)
rslider    bounds(265, 20, 85, 85), channel("LegTime"),  range(  0.01,2.00,1, 0.5),        colour( 90, 50, 50), trackerColour("silver"), text("Legato Time"), textColour("white"), valueTextBox(1), active(0), alpha(0.3)
rslider    bounds(360, 20, 85, 85), channel("PBRange"),   range(-48,48,2, 1, 0.01), colour( 90, 50, 50), trackerColour("silver"), text("Bend Range"), textColour("white"), valueTextBox(1)
}

keyboard bounds(  5,380, 970, 90)
label    bounds(  5,473, 140, 15), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -+rtmidi=NULL -M0 -dm0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 64
nchnls = 2
0dbfs  = 1

massign    0, 3    ; all midi notes on all channels sent to instrument 3

giInterpArr[] array 1, 2, 4, 8
gSfilepath    init    ""
gSDropFile    init    ""

giSource      init    0 ; 0 = browser-opened file :: 1 = dropped file


; tuning tables
;                               FN_NUM | INIT_TIME | SIZE | GEN_ROUTINE | NUM_GRADES | REPEAT |  BASE_FREQ  | BASE_KEY_MIDI | TUNING_RATIOS:-0-|----1----|---2----|----3----|----4----|----5----|----6----|----7----|----8----|----9----|----10-----|---11----|---12---|---13----|----14---|----15---|---16----|----17---|---18----|---19---|----20----|---21----|---22----|---23---|----24----|----25----|----26----|----27----|----28----|----29----|----30----|----31----|----32----|----33----|----34----|----35----|----36----|
giTTable1     ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(60),      60,                       1, 1.059463,1.1224619,1.1892069,1.2599207,1.33483924,1.414213,1.4983063,1.5874001,1.6817917,1.7817962, 1.8877471,     2 ;STANDARD
giTTable2     ftgen             0,         0,       64,       -2,          24,          2,   cpsmidinn(60),      60,                       1, 1.0293022,1.059463,1.0905076,1.1224619,1.1553525,1.1892069,1.2240532,1.2599207,1.2968391,1.33483924,1.3739531,1.414213,1.4556525,1.4983063, 1.54221, 1.5874001, 1.6339145,1.6817917,1.73107,  1.7817962,1.8340067,1.8877471,1.9430623,    2 ;QUARTER TONES
giTTable3     ftgen             0,         0,       64,       -2,          12,        0.5,   cpsmidinn(60),      60,                       2, 1.8877471,1.7817962,1.6817917,1.5874001,1.4983063,1.414213,1.33483924,1.2599207,1.1892069,1.1224619,1.059463,      1 ;STANDARD REVERSED
giTTable4     ftgen             0,         0,       64,       -2,          24,        0.5,   cpsmidinn(60),      60,                       2, 1.9430623,1.8877471,1.8340067,1.7817962,1.73107, 1.6817917,1.6339145,1.5874001,1.54221,  1.4983063, 1.4556525,1.414213,1.3739531,1.33483924,1.2968391,1.2599207,1.2240532,1.1892069,1.1553525,1.1224619,1.0905076,1.059463, 1.0293022,    1 ;QUARTER TONES REVERSED
giTTable5     ftgen             0,         0,       64,       -2,          10,          2,   cpsmidinn(60),      60,                       1, 1.0717734,1.148698,1.2311444,1.3195079, 1.4142135,1.5157165,1.6245047,1.7411011,1.8660659,     2 ;DECATONIC
giTTable6     ftgen             0,         0,       64,       -2,          36,          2,   cpsmidinn(60),      60,                       1, 1.0194406,1.0392591,1.059463,1.0800596, 1.1010566,1.1224618,1.1442831,1.1665286,1.1892067,1.2123255,1.2358939,1.2599204,1.284414,1.3093838, 1.334839, 1.3607891,1.3872436,1.4142125,1.4417056,1.4697332,1.4983057,1.5274337,1.5571279,1.5873994, 1.6182594,1.6497193, 1.6817909, 1.7144859, 1.7478165, 1.7817951, 1.8164343, 1.8517469, 1.8877459, 1.9244448, 1.9618572,      2 ;THIRD TONES
giTTable7     ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(60),      60,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable8     ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(61),      61,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable9     ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(62),      62,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable10    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(63),      63,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable11    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(64),      64,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable12    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(65),      65,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable13    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(66),      66,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable14    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(67),      67,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable15    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(68),      68,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable16    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(69),      69,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable17    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(70),      70,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   
giTTable18    ftgen             0,         0,       64,       -2,          12,          2,   cpsmidinn(71),      71,                       1,   16/15,     9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,      9/5,       15/8,    2 ;JUST INTONATION                                                                                                                                                                                                                                   

opcode    sspline,k,Kiii
    kdur,istart,iend,icurve    xin                                                               ; READ IN INPUT ARGUMENTS
    imid     =                           istart+((iend-istart)/2)                                ; SPLINE MID POINT VALUE
    isspline ftgentmp                    0,0,4096,-16,istart,4096*0.5,icurve,imid,(4096/2)-1,-icurve,iend ; GENERATE 'S' SPLINE
    kspd     =                           i(kdur)/kdur                                            ; POINTER SPEED AS A RATIO (WITH REFERENCE TO THE ORIGINAL DURATION)
    kptr     init                        0                                                       ; POINTER INITIAL VALUE    
    kout     tablei                      kptr,isspline                                           ; READ VALUE FROM TABLE
    kptr     limit                       kptr+((ftlen(isspline)/(i(kdur)*kr))*kspd), 0, ftlen(isspline)-1 ; INCREMENT THE POINTER BY THE REQUIRED NUMBER OF TABLE POINTS IN ONE CONTROL CYCLE AND LIMIT IT BETWEEN FIRST AND LAST TABLE POINT - FINAL VALUE WILL BE HELD IF POINTER ATTEMPTS TO EXCEED TABLE DURATION
             xout                        kout                                                    ; SEND VALUE BACK TO CALLER INSTRUMENT
endop





; Smoother
; ----------------
; Smooths low resolution contiguous data with adaptive lag filtering.  
; Heavier filtering is applied when changes are smaller than when changes are large. 
; This often provides musically more succesful smoothing than can be achieved with portamento (port, portk) or the lineto opcode.
; This UDO might be useful in improving data received from 7-bit MIDI controllers while minimising sluggish response if the control is moved more quickly.

; kout  Smoother  kin,ktime

; Performance
; -----------
; kin   -  input signal
; ktime -  time taken to reach new value
; kout  -  output value


opcode Smoother, k, kk
 kinput, ktime     xin
 kPrevVal          init                0 
 kRamp             linseg              0, 0.01, 1
 ktime             =                   kRamp * divz:k(ktime, abs(kinput-kPrevVal), 0.000001)
 if changed:k(kinput, ktime)==1 then
                   reinit              RESTART
 endif
 RESTART:
 if i(ktime)==0 then
  koutput          =                   i(kinput)
 else
  koutput          linseg              i(koutput), i(ktime), i(kinput)
 endif
 rireturn
                   xout                koutput
 kPrevVal          =                   koutput
endop





instr    1 ; always on
 gkPlayStop        cabbageGetValue     "PlayStop"       ; read in widgets
 gkloop            cabbageGetValue     "loop"
 gktranspose       cabbageGetValue     "transpose"
 gkspeed           cabbageGetValue     "speed"
 gkinterp          cabbageGetValue     "interp"
 gkreverse         cabbageGetValue     "reverse"
 gklevel           cabbageGetValue     "level"
 gkStretchOnOff    cabbageGetValue     "StretchOnOff"
 gkstretchratio    cabbageGetValue     "stretchratio"
 gkthreshold       cabbageGetValue     "threshold"
 gkModRange        cabbageGetValue     "ModRange"
 gkRate1           cabbageGetValue     "Rate1"
 gkRate2           cabbageGetValue     "Rate2"
 kInSkip           cabbageGetValue     "inskip"
                   cabbageSet          changed:k(kInSkip), "InskipIndicator", "bounds", 5+kInSkip*1025,5,1,140

 ; load file from browse
 gSfilepath        cabbageGetValue     "filename"   ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then                   ; call instrument to update waveform viewer  
                   event               "i", 99, 0, 0
 endif

 ; load file from dropped file
 gSDropFile        cabbageGet          "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
                   event               "i", 100, 0, 0         ; load dropped file
 endif
 
 ktrig             trigger             gkPlayStop,0.5,0    ; if play/stop button toggles from low (0) to high (1) generate a '1' trigger
                   schedkwhen          ktrig,0,0,2,0,-1    ; start instrument 2
 
 
 ; synchronise transpose and speed controls
 ktrig1            changed             gktranspose                    ; if 'transpose' button is changed generate a '1' trigger
 ktrig2            changed             gkspeed                        ; if 'speed' button is changed generate a '1' trigger
 if ktrig1==1 then                                                    ; if transpose control has been changed...
                cabbageSetValue        "speed", semitone(gktranspose) ; set speed according to transpose value
 elseif ktrig2==1&&gkspeed>=0 then                                    ; if speed control has been changed...
                   cabbageSetValue     "transpose",log2(gkspeed)*12   ; set transpose control according to speed value
 endif
 
 
 ; unipolar playback direction option 
 gkUniDir          cabbageGetValue     "UniDir"
 gkspeed           =                   gkUniDir == 1 ? abs(gkspeed) : gkspeed

 
 ; detect pitch
 kDetect           cabbageGetValue     "Detect"
 if trigger:k(kDetect,0.5,0)==1 then
                   event               "i", 200, 0, 30
 endif

 ; activate legato time control
 kLegato           cabbageGetValue     "Legato"
                   cabbageSet          changed:k(kLegato), "LegTime", "active", kLegato
                   cabbageSet          changed:k(kLegato), "LegTime", "alpha", 0.5 + kLegato*0.5
 
endin




instr    2 ; Checkbox-triggered note
 Sfile             =                   giSource == 0 ? gSfilepath : gSDropFile ; choose source file (opened or dropped)
 if gkPlayStop==0 then                                                         ; if play/stop is off (stop)...
  turnoff                                                                      ; turn off this instrument
 endif                        
 iStrLen           strlen              Sfile             ; derive string length
 if iStrLen > 0 then                                     ; if string length is greater than zero (i.e. a file has been selected) then...
  iAttTim          cabbageGetValue     "AttTim"          ; read in amplitude envelope attack time widget
  iRelTim          cabbageGetValue     "RelTim"          ; read in amplitude envelope attack time widget
  if iAttTim>0 then
   kenv            linsegr             0,iAttTim,1,iRelTim,0
  else                                
   kenv            linsegr             1,iRelTim,0       ; attack time is zero so ignore this segment of the envelope (a segment of duration zero is not permitted
  endif
  kenv             expcurve            kenv,8            ; remap amplitude value with a more natural curve
  aenv             interp              kenv              ; interpolate and create a-rate envelope
  iFileLen         filelen             Sfile             ; derive chosen sound file length
  iNChns           filenchnls          Sfile             ; derive the number of channels (mono=1 / stereo=2) from the chosen  sound file
  iinskip          cabbageGetValue     "inskip"          ; read in inskip widget
  iloop            cabbageGetValue     "loop"            ; read in 'loop mode' widget
  ktrig            changed             gkloop,gkinterp   ; if loop setting or interpolation mode setting
  if ktrig==1 then                                            ; if loop setting has been changed...
   reinit RESTART                                             ; reinitialise from label RESTART
  endif                        
  RESTART:                    
  kporttime        linseg              0,0.001,0.05      ; portamento time function. (Rises quickly from zero to a held value.)
  kspeed           Smoother            gkspeed, 0.01     ; adaptive portamento lag

  ; random speed modulation
  kMod             jspline             gkModRange,gkRate1,gkRate2
  kspeed           *=                  octave(kMod)
  
  ; silence stretching
  if gkStretchOnOff!=1 kgoto SKIP_STRETCH
   a1,a2           init                0
   krms            rms                 a1 + a2
   if krms<gkthreshold then
    kspeed         *=                  gkstretchratio
    kmute          =                   0
   else
    kmute          =                   1
   endif
   amute           interp              kmute
   aenv            *=                  amute
  SKIP_STRETCH:
    
  if iNChns==2 then                         ; if stereo...
   a1,a2           diskin2             Sfile,kspeed*(1-(gkreverse*2)),iinskip*iFileLen,i(gkloop),0,giInterpArr[i(gkinterp)-1]    ; use stereo diskin2
   a1              =                   a1 * gklevel * aenv
   a2              =                   a2 * gklevel * aenv
  elseif iNChns==1 then                     ; if mono
   a1              diskin2             Sfile,kspeed*(1-(gkreverse*2)),iinskip*iFileLen,i(gkloop),0,giInterpArr[i(gkinterp)-1]    ; use mono diskin2
   a1              =                   a1 * gklevel * aenv
   a2              =                   a1
  endif

  ; follow filter
  kFollowFiltOnOff cabbageGetValue     "FollowFiltOnOff"
  if kFollowFiltOnOff==1 then
   kFiltType       cabbageGetValue     "FiltType"
   kCF             cabbageGetValue     "CF"
   kRes            cabbageGetValue     "Res"
   aCF             limit               a(abs(kspeed * kCF)), 20, 20000
   if kFiltType==1 then ; resonant lowpass
    a1             zdf_2pole           a1, aCF, 0.5 + (kRes * 24.5)
    a2             zdf_2pole           a2, aCF, 0.5 + (kRes * 24.5)
   else ; bandpass
    a_, a1, a_     zdf_2pole_mode      a1, aCF, 0.5 + (kRes * 24.5)
    a_, a2, a_     zdf_2pole_mode      a2, aCF, 0.5 + (kRes * 24.5)
   endif
  endif
                   outs                a1, a2
 endif
endin


instr  3 ;  receive MIDI notes
 iTuning           cabbageGetValue     "Tuning"
 icps              cpstmid             giTTable1 + iTuning - 1
 kPBRange          pchbend             0, cabbageGetValue:i("PBRange")
 gkPBRange         Smoother            kPBRange, 0.01  ; smooth changes to stream of pitch bend messages  
 iamp              veloc               0, 1 ; velocity varies amplitude
 gkcps             =                   icps
 gkamp             init                iamp
 gilegato          cabbageGetValue     "Legato"
 if gilegato==0 then                                                  ; if we are *not* in legato mode...
  aL,aR            subinstr            p1+1, icps, iamp
                   outs                aL, aR
 else                                                                 ; otherwise... (i.e. legato mode)
  if active:i(p1)==1 then                                             ; first note...
                   event_i             "i", p1 + 1, 0, 3600, icps, iamp  ; ...start a new held note
  endif
 endif
endin



instr    4 ; MIDI-triggered note
 ; poly/legato
 if gilegato==0 then ; polyphonic
  kcps             init                p4
  iamp             =                   p5
  
 else                ; monophonic
  kcps  init  i(gkcps)
  if changed:k(active:k(p1-1))==1 then ; if held notes changes...
                   reinit              RESTART_GLISS
  endif
  RESTART_GLISS:
  iLegTime         cabbageGetValue     "LegTime"
  kcps             sspline             iLegTime, i(kcps), i(gkcps), 3
  rireturn
  kamp             init                p5
  if active:k(p1-1)==0 then
                   turnoff
  endif
 endif

 Sfile             =                   giSource == 0 ? gSfilepath : gSDropFile ; choose source file (opened or dropped)

 iStrLen           strlen              Sfile                     ; derive string length
 if iStrLen > 0 then                                             ; if string length is greater than zero (i.e. a file has been selected) then...
  iMidiRef         cabbageGetValue     "MidiRef"                 ; MIDI unison reference note
  iinskip          cabbageGetValue     "inskip"                  ; read in inskip widget
  iloop            cabbageGetValue     "loop"                    ; read in 'loop mode' widget
  iAttTim          cabbageGetValue     "AttTim"                  ; read in amplitude envelope attack time widget
  iRelTim          cabbageGetValue     "RelTim"                  ; read in amplitude envelope attack time widget
  if iAttTim>0 then
   kenv            linsegr             0,iAttTim,1,iRelTim,0
  else                                
   kenv            linsegr             1,iRelTim,0               ; attack time is zero so ignore this segment of the envelope (a segment of duration zero is not permitted
  endif
  kenv             expcurve            kenv, 8                   ; remap amplitude value with a more natural curve
  aenv             interp              kenv                      ; interpolate and create a-rate envelope
  iFileLen         filelen             Sfile                     ; derive chosen sound file length
  kspeed           =                   (kcps*gkspeed)/cpsmidinn(iMidiRef) ; derive playback speed from note played in relation to a reference note (MIDI note 60 / middle C)

  ; random speed modulation
  kMod             jspline             gkModRange,gkRate1,gkRate2
  kspeed           *=                  octave(kMod)
  
  ; pitch bend
  kspeed           *=                  semitone(gkPBRange)
  
  ; silence stretching
  if gkStretchOnOff != 1 kgoto SKIP_STRETCH
   a1,a2           init                0
   krms            rms                 a1 + a2
   if krms<gkthreshold then
    kspeed         *=                  gkstretchratio
    kmute          =                   0
   else
    kmute          =                   1
   endif
   amute           interp              kmute
   aenv            *=                  amute
  SKIP_STRETCH:
  
  iNChns           filenchnls          Sfile                     ; derive the number of channels (mono=1 / stereo=2) from the chosen  sound file
  if iNChns==2 then                                              ; if stereo...
   a1,a2           diskin2             Sfile,kspeed*(1-(gkreverse*2)),iinskip*iFileLen,i(gkloop),0,giInterpArr[i(gkinterp)-1]    ; use stereo diskin2
   a1              =                   a1 * gklevel * iamp
   a2              =                   a2 * gklevel * iamp
  elseif iNChns==1 then                ; if mono
   a1              diskin2             Sfile,kspeed*(1-(gkreverse*2)),iinskip*iFileLen,i(gkloop),0,giInterpArr[i(gkinterp)-1]    ; use mono diskin2
   a1              =                   a1 * gklevel * iamp
   a2              =                   a1
  endif
  
  ; follow filter
  kFollowFiltOnOff cabbageGetValue     "FollowFiltOnOff"
  if kFollowFiltOnOff==1 then
   kFiltType       cabbageGetValue     "FiltType"
   kCF             cabbageGetValue     "CF"
   kRes            cabbageGetValue     "Res"
   aCF             limit               a(abs(kspeed * kCF)), 20, 20000
   if kFiltType==1 then ; resonant lowpass
    a1             zdf_2pole           a1, aCF, 0.5 + (kRes * 24.5)
    a2             zdf_2pole           a2, aCF, 0.5 + (kRes * 24.5)
   else ; bandpass
    a_, a1, a_     zdf_2pole_mode      a1, aCF, 0.5 + (kRes * 24.5)
    a_, a2, a_     zdf_2pole_mode      a2, aCF, 0.5 + (kRes * 24.5)
   endif
  endif
  
  ; velocity filter
  a1               tone                a1, 20000 * iamp
  a2               tone                a2, 20000 * iamp
  
                   outs                a1 * aenv, a2 * aenv
  
 endif
endin





instr    99 ; LOAD SOUND FILE
 giSource          =                   0
                   cabbageSet          "filer1", "file", gSfilepath

 /* write file name to GUI */
 SFileNoExtension  cabbageGetFileNoExtension gSfilepath
                   cabbageSet          "FileName","text",SFileNoExtension

endin

instr    100 ; LOAD DROPPED SOUND FILE
 giSource          =                   1
                   cabbageSet          "filer1", "file", gSDropFile

 /* write file name to GUI */
 SFileNoExtension  cabbageGetFileNoExtension gSDropFile
                   cabbageSet          "FileName","text",SFileNoExtension

endin

instr 200 ; detect pitch of sample and send to MIDI reference
 gitable           ftgen               1,0,0,1,gSfilepath,0,0,0  ; load sound file into a GEN 01 function table 
 gichans           filenchnls          gSfilepath                ; derive the number of channels (mono=1,stereo=2) in the sound file
 giReady           =                   1                         ; if no string has yet been loaded giReady will be zero
 gkTabLen          init                ftlen(gitable)/gichans    ; table length in sample frames
                   cabbageSet          "beg", "file", gSfilepath
 if gichans==1 then
  aL               diskin2             gSfilepath, 1
 elseif  gichans==2 then
  aL,aR            diskin2             gSfilepath, 1
 endif  
 kcps, krms  pitchamdf  aL, 20, 5000
 if timeinsts:k() >= 0.3 then
  kNote            =                   ftom:k(kcps)
                   cabbageSetValue     "MidiRef",kNote
                   turnoff
 endif
endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>