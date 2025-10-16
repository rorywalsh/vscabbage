 
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Wholegrain.csd
; Written by Iain McCurdy, 2009, 2024

; Update of an old FLTK example which was called "SchedkwhenGranulation"

; Grain-by-grain generation using the schedkwhen - event generation - opcode.

; Note that combinations of high grain rates and long grain durations are liable to overload the CPU. 

; This enables certain innovations such a grain-by-grain bandpass filtering with unique filter settings for each grain,
;   grain-by-grain ring modulation and more user-definable control of grain pitch, shape etc.

; Order of processing is:

; grain trigger - grains - ring modulator - bandpass filter - high-pass filter - low-pass filter - reverb

; Open File    -  Browse for file. You can also simply drag and drop a file onto the panel to load a sound file
;                 sound files can be stereo or mono but if stereo, only the left channel will be used
; On/Off(MIDI) -  turns on and off the instrument that generates grains.
;                 the grain generator can also be triggered from MIDI notes (GUI keyboard or external MIDI)

; GRAIN GENERATION
; Grains per Second    -  number of grains per second
; Grain Gap Offset     -  random grain gap. Pull to zero for synchronous granular synthesis.

; GRAIN SIZE
; Duration Min         -  minimum random duration of grains
; Duration Max         -  maximum random duration of grains
; LINK                 -  forces minimum and maximum duration sliders to move in sync
; Attack Time          -  rise time of the envelope applied to each grain (ratio)
; Decay Time           -  decay time of the envelope applied to each grain (ratio)
; LPF (button)         -  activate grain-by-grain lowpass filtering of grains. 
;                         The envelope will follow that used for amplitude windowing of grains.
; Range                -  Upper limit of the lowpass filter enveloping of grains (if active)
; Log-Lin-Exp          -  morph between logarithmic, linear and exponential segments for the envelope

; POINTER
; Position             -  pointer into the sound file
; Padding              -  adds padding to the pointer control so that it will actually read from before the beginning and beyond the end of the sound file.
;                          this can be useful when using sound files that do not have any silence at the beginning or end
; Random Offset        -  random offset of the pointer applied on a grain-by-grain basis
; LFO Amp.             -  amplitude of an LFO applied to the grain pointer
; LFO Freq.            -  frequency of an LFO applied to the grain pointer
; Boundary Mode        -  rule applied if a pointer position exceeds the limits of the source sound file
; LFO Shape            -  waveform shape of the grain pointer LFO:
;                         triangle, ramp (up), sawtooth (down), sine, random sample-and-hold, random interpolating

; PITCH (grain-by-grain)
; Pitch (oct)          -  grain pitch manual offset (in octaves)
;  Grains can be transposed shifted according to increments specified by 'Interval'.
;  This can produce random arpeggio-like effects
; Rand. Interval Min.  -  minimum random interval shift (in steps)
; Rand. Interval Max.  -  maximum random interval shift (in steps)
; Interval             -  interval increment (in octaves)
; Pitch Offset         -  grain-by-grain random pitch offset (gaussian distribution)

; RING MODULATION (grain-by-grain)
; Mix                  -  mix between un-ring modulated and ring modulated signal
; Min Freq.            -  minimum frequency of the ring modulator
; Max Freq.            -  maximum frequency of the ring modulator

; BANDPASS FILTER (grain-by-grain)
; Mix                  -  dry/wet mix
; Freq. Min            -  minimum possible centre frequency of the bandpass filter 
; Freq. Max            -  maximum possible centre frequency of the bandpass filter 
; Bandwidth Min.       -  minimum possible bandwidth of the bandpass filter 
; Bandwidth Max.       -  maximum possible bandwidth of the bandpass filter
; LINK                 -  forces minimum and maximum duration sliders to move in sync 
; Gain                 -  gain applied to the filtered grains to make up for amplitude loss

; FILTERS (applied to the output audio stream)
; HPF Cutoff           -  lowpass filter cutoff (butterworth)
; LPF Cutoff           -  highpass filter cutoff (butterworth)

; REVERB
;  dry/wet mix can be applied on a grain-by-grain basis so that grains can cover a full range from close to distant
; Mix Min              -  dry/wet mix minimum
; Mix Max              -  dry/wet mix maximum
; Size                 -  reverb size
; Damping              -  high-frequency damping cutoff frequency
; Level                -  level of the wet signal

; AMPLITUDE
; Gain                 -  output gain
; Random Amplitude     -  depth an grain-by-grain random amplitude

; PANNING
;   The two buttons below are radio buttons (mutually exclusive)
; GRAIN BY GRAIN (button) - selects if random panning will be applied on a grain-by-grain basis
; TRAJECTORY              - selects if random panning will be a smooth, slow trajectory applied to the output audio stream.
; Width                -  grain-by-grain random stereo placement of grains
; Rate                 -  rate of random trajectory movement (TRAJECTORY mode only)


<Cabbage>
form caption("Wholegrain"), size(1200,710), pluginId("SKWG"), colour("Silver"), guiMode("queue")

#define SLIDER_DESIGN  textColour(100,100,100), trackerColour("silver"), valueTextBox(1) fontColour(100,100,100)
#define SLIDER_DESIGN2 textColour(100,100,100), trackerColour("black"), valueTextBox(0) fontColour(100,100,100)
#define SLIDER_DESIGN3  textColour(100,100,100), trackerColour("silver"), valueTextBox(0) fontColour(100,100,100)
#define FONT_COLOUR  100,100,100

filebutton bounds(  5,  5,  80, 20), text("Open File","Open File"), fontColour("White") channel("filename"), shape("ellipse")
checkbox   bounds(  5, 30,  80, 19), channel("OnOff"), text("On/Off"), value(0), colour:1(255,255,100), fontColour:0($FONT_COLOUR), fontColour:1($FONT_COLOUR)
soundfiler bounds( 90,  5,1105, 85), channel("beg","len"), channel("filer1"), colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 95,  7, 200, 14), text(""), align("left"), channel("FileName"), fontColour("White")
image      bounds( 90,  5,   1, 85), channel("StartIndic"), colour(255,255,255,100)
label      bounds(  0, 93,  85, 14), text("Pointer"), align("right"), channel("FileName"), fontColour(100,100,100)
hslider    bounds( 85, 90,1115, 20), channel("ptr"), range(0,1,0.5), trackerColour("silver")

label      bounds(  5, 59,  80, 14), text("Padding"), align("centre"), fontColour(100,100,100)
hslider    bounds(  5, 70,  80, 20), channel("padding"), range(0,0.5,0), trackerColour("silver")

image   bounds(  5,110,390, 90), colour(0,0,0,0), outlineThickness(2), outlineColour(0,0,0)
{
label   bounds(  0,  5,390, 15), text("G R A I N   G E N E R A T I O N"), align("centre"), fontColour(100,100,100)
hslider bounds(  5, 30,380, 20), channel("GPS"),     range(0.5, 5000, 400, 0.25, 0.0001), text("Grains per Second"), $SLIDER_DESIGN
hslider bounds(  5, 60,380, 20), channel("gap_OS"), range(0, 2, 0.0838, 0.5), text("Grain Gap Offset"), $SLIDER_DESIGN
}

image   bounds(  5,210,390,220), colour(0,0,0,0), outlineThickness(2), outlineColour(0,0,0)
{
label   bounds(  0,  5,390, 15), text("G R A I N S"), align("centre"), fontColour(100,100,100)
hslider bounds(  5, 30,380, 20), channel("durMin"), range(0.001,4,0.3,0.5,0.0001),      text("Duration Min."), $SLIDER_DESIGN
hslider bounds(  5, 60,380, 20), channel("durMax"), range(0.001,4,0.4,0.5,0.0001),      text("Duration Max."), $SLIDER_DESIGN
button  bounds(  9, 49, 40, 12), channel("durLink"), text("LINK","LINK"), colour:0(0,0,0), colour:1(150,150,50), fontColour:0(100,100,30), fontColour:1(255,255,150), latched(1)
hslider bounds(  5, 90,300, 20), channel("att"), range(0.003,1,0.4),      text("Attack Ratio"), $SLIDER_DESIGN
hslider bounds(  5,120,300, 20), channel("dec"), range(0.003,1,0.4),      text("Decay Ratio"), $SLIDER_DESIGN
gentable bounds(305,100, 75,30), tableNumber(99), channel("EnvTable"), ampRange(0,1.04,99), tableColour("LightBlue"), fill(0), outlineThickness(3)
button  bounds(  9,155, 60, 20), channel("LPFEnv"), text("LPF","LPF"), colour:0(0,0,0), colour:1(150,150,50), fontColour:0(100,100,30), fontColour:1(255,255,150), latched(1)
image   bounds(135,163,100,  4), colour(0,0,0,0), outlineThickness(1), outlineColour("black"), channel("LPFEnvRangeBG"), alpha(0.3)
hrange  bounds( 80,155,170, 20), channel("LPFEnvRangeMin","LPFEnvRangeMax"), range(0,1,1:1.4), text("Range"), trackerColour(50,50,50), alpha(0.3), $SLIDER_DESIGN2
hslider bounds(240,155,140, 20), channel("LPFRes"), range(0,1,0), text("Res."), alpha(0.3), $SLIDER_DESIGN3
hslider bounds(  5,190,380, 20), channel("EnvType"), range(-1,1,0), text("log-Lin-Exp"), $SLIDER_DESIGN
}

image   bounds(  5,440,390,160), colour(0,0,0,0), outlineThickness(2), outlineColour(0,0,0)
{
label   bounds(  0,   5,390, 15), text("P O I N T E R"), align("centre"), fontColour(100,100,100)
hslider bounds(  5,  30,380, 20), channel("ptr_OS"), range(0, 10, 0.00263, 0.5, 0.0001),      text("Random Jitter"), $SLIDER_DESIGN
hslider bounds(  5,  60,380, 20), channel("LFOamp"), range(0,1,0,0.5,0.0001),      text("LFO Amp."), $SLIDER_DESIGN
hslider bounds(  5,  90,380, 20), channel("LFOfrq"), range(0,30,0.0025,0.25,0.0001),      text("LFO Freq."), $SLIDER_DESIGN
label    bounds( 75,115, 90, 13), text("Boundary Mode"), fontColour($FONT_COLOUR)
combobox bounds( 75,130, 90, 20), channel("BoundaryMode"), items("wrap","mirror","limit"), value(1) 
label    bounds(225,115, 90, 13), text("LFO Shape"), fontColour($FONT_COLOUR)
combobox bounds(225,130, 90, 20), channel("LFOShape"), items("Tri","Ramp","Saw","Sine","RandH","RandI"), value(1) 
}

image   bounds(405,110,390,170), colour(0,0,0,0), outlineThickness(2), outlineColour(0,0,0)
{
label   bounds(  0,  5,390, 15), text("P I T C H"), align("centre"), fontColour(100,100,100)
hslider bounds(  5, 20,380, 20), channel("transpose"), range(0.125,8,1,0.5,0.0001),      text("Transpose (ratio)"), $SLIDER_DESIGN
hslider bounds(  5, 50,380, 20), channel("rndoctavemin"), range(-6,6,0),      text("Rand. Interval Min."), $SLIDER_DESIGN
button  bounds(  9, 69, 40, 12), channel("rndoctaveLink"), text("LINK","LINK"), colour:0(0,0,0), colour:1(150,150,50), fontColour:0(100,100,30), fontColour:1(255,255,150), latched(1)
hslider bounds(  5, 80,380, 20), channel("rndoctavemax"), range(-6,6,0),      text("Rand. Interval Max."), $SLIDER_DESIGN
hslider bounds(  5,110,380, 20), channel("Interval"), range(1, 2, 2,0.5,0.001),      text("Interval (ratio)"), $SLIDER_DESIGN
hslider bounds(  5,140,380, 20), channel("pchosrange"), range(0,1,0,0.5),      text("Pitch Offset"), $SLIDER_DESIGN
}

image   bounds(405,290,390,120), colour(0,0,0,0), outlineThickness(2), outlineColour(0,0,0)
{
label   bounds(  0,  5,390, 15), text("R I N G   M O D U L A T I O N"), align("centre"), fontColour(100,100,100)
checkbox bounds(  5, 5, 15, 15), channel("RMOnOff"), value(0), colour:1(255,255,100)
image   bounds( 45, 38,325,  4), colour(0,0,0,0), outlineThickness(1), outlineColour("black")
hrange  bounds(  5, 30,380, 20), channel("RMmixMin","RMmixMax"), range(0,1,0:0.4), text("Mix"), trackerColour(50,50,50), $SLIDER_DESIGN2
hslider bounds(  5, 60,380, 20), channel("RMfreqmin"), range(1,10000, 500,1,0.5), text("Min. Freq."), $SLIDER_DESIGN
hslider bounds(  5, 90,380, 20), channel("RMfreqmax"), range(1,10000,8000,1,0.5), text("Max. Freq."), $SLIDER_DESIGN
}

image   bounds(405,420,390,180), colour(0,0,0,0), outlineThickness(2), outlineColour(0,0,0)
{
label   bounds(  0,  5,390, 15), text("B A N D P A S S   F I L T E R"), align("centre"), fontColour(100,100,100)
checkbox bounds( 5, 5, 15, 15), channel("BPFOnOff"), value(0), colour:1(255,255,100)
image   bounds( 45, 38,328,  4), colour(0,0,0,0), outlineThickness(1), outlineColour("black")
hrange  bounds(  5, 30,380, 20), channel("BPFmixMin","BPFmixMax"), range(0,1,1:1), text("Mix"), trackerColour(50,50,50), $SLIDER_DESIGN2
image   bounds( 55, 68,315,  4), colour(0,0,0,0), outlineThickness(1), outlineColour("black")
hrange  bounds(  5, 60,380, 20), channel("BPFcutmin","BPFcutmax"), range(4,14,6:14), text("Freq."), trackerColour(50,50,50), $SLIDER_DESIGN2
hslider bounds(  5, 90,380, 20), channel("BPFbwmin"), range(0.001,0.1,0.005,0.5,0.00001), text("Bandwidth Min."), $SLIDER_DESIGN
button  bounds(  9,109, 40, 12), channel("BPFbwLink"), text("LINK","LINK"), colour:0(0,0,0), colour:1(150,150,50), fontColour:0(100,100,30), fontColour:1(255,255,150), latched(1)
hslider bounds(  5,120,380, 20), channel("BPFbwmax"), range(0.001,0.1,0.01, 0.5,0.00001), text("Bandwidth Max."), $SLIDER_DESIGN
hslider bounds(  5,150,380, 20), channel("BPFgain"), range(0,2,0.5,0.5), text("Gain"), $SLIDER_DESIGN
}

image   bounds(805,110,390, 60), colour(0,0,0,0), outlineThickness(2), outlineColour(0,0,0)
{
label   bounds(  0,  5,390, 15), text("L P F / H P F   F I L T E R S"), align("centre"), fontColour(100,100,100)
checkbox bounds( 5,  5, 15, 15), channel("FiltOnOff"), value(0), colour:1(255,255,100)
image   bounds( 73, 38,292,  4), colour(0,0,0,0), outlineThickness(1), outlineColour("black")
hrange  bounds(  5, 30,380, 20), channel("HPFcf","LPFcf"), range(4,14,4:14), text("HPF/LPF"), trackerColour(50,50,50), $SLIDER_DESIGN2
}

image   bounds(805,180,390,150), colour(0,0,0,0), outlineThickness(2), outlineColour(0,0,0)
{
label   bounds(  0,  5,390, 15), text("R E V E R B"), align("centre"), fontColour(100,100,100)
checkbox bounds( 5, 5, 15, 15), channel("RvbOnOff"), value(0), colour:1(255,255,100)
image   bounds( 45, 38,325,  4), colour(0,0,0,0), outlineThickness(1), outlineColour("black")
hrange  bounds(  5, 30,380, 20), channel("RvbDryWetMin","RvbDryWetMax"), range(0,1,0.2:0.2), text("Mix"), trackerColour(50,50,50), $SLIDER_DESIGN2
hslider bounds(  5, 60,380, 20), channel("fblvl"), range(0,1,0.8), text("Size"), $SLIDER_DESIGN
hslider bounds(  5, 90,380, 20), channel("fco"), range(20,20000,10000), text("Damping"), $SLIDER_DESIGN
hslider bounds(  5,120,380, 20), channel("RvbLev"), range(0,1,1), text("Level"), $SLIDER_DESIGN
}

image   bounds(805,340,390,130), colour(0,0,0,0), outlineThickness(2), outlineColour(0,0,0)
{
label   bounds(  0,  5,390, 15), text("P A N N I N G"), align("centre"), fontColour(100,100,100)
button  bounds( 75, 30,120, 20), channel("PanGBG"), text("GRAIN BY GRAIN","GRAIN BY GRAIN"), colour:0(0,0,0), colour:1(150,150,50), fontColour:0(100,100,30), fontColour:1(255,255,150), latched(1), value(1), radioGroup(1)
button  bounds(205, 30,120, 20), channel("PanTraj"), text("TRAJECTORY","TRAJECTORY"), colour:0(0,0,0), colour:1(150,150,50), fontColour:0(100,100,30), fontColour:1(255,255,150), latched(1), radioGroup(1)
hslider bounds(  5, 70,380, 20), channel("width"), range(0,0.5,0.25,0.5), text("Width"), $SLIDER_DESIGN
hslider bounds(  5,100,380, 20), channel("PanRate"), range(0.1,4,0.25,0.5), text("Rate"), $SLIDER_DESIGN
}

image   bounds(805,480,390,120), colour(0,0,0,0), outlineThickness(2), outlineColour(0,0,0)
{
label   bounds(  0,  5,390, 15), text("A M P L I T U D E"), align("centre"), fontColour(100,100,100)
hslider bounds(  5, 20,380, 20), channel("gain"), range(0,5,0.2,0.5),     text("Gain"), $SLIDER_DESIGN
hslider bounds(  5, 50,380, 20), channel("RandomDepth"), range(0,1,0.0,0.5), text("Random Amplitude"), $SLIDER_DESIGN
hmeter  bounds( 25, 75,340, 15) channel("VUMeterL") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(1)
hmeter  bounds( 25, 95,340, 15) channel("VUMeterR") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(1)
label   bounds( 10, 75, 10, 15), text("L"), align("right"), fontColour(100,100,100)
label   bounds( 10, 95, 10, 15), text("R"), align("right"), fontColour(100,100,100)
}

keyboard bounds(  5,610,1190,85)

label    bounds(  5,697,120, 12), text("Iain McCurdy |2024|"), align("left"), fontColour("DarkGrey")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps           =               32
nchnls          =               2
0dbfs           =               1

gasendL         init            0                              ; INITIALIZE GLOBAL AUDIO VARIABLES USED TO SEND AUDIO FROM GRAIN RENDERING INSTRUMENT
gasendR         init            0                              ; INITIALIZE GLOBAL AUDIO VARIABLES USED TO SEND AUDIO FROM GRAIN RENDERING INSTRUMENT
gaDryL          init            0
gaDryR          init            0
gifn            =               1                              ; THE FUNCTION TABLE NUMBER OF THE SOURCE SOUND FILE FOR GRANULATION
gkReady         init            0                              ; file-ready flag
giEnvTable      ftgen           99,0,1024,7,0,512,1,512,0





instr   700
gkOnOff         cabbageGetValue "OnOff"
if trigger:k(gkOnOff,0.5,0)==1 && gkReady==1 then
                event           "i",1,0,3600
endif

; Browse File
gSfilepath     cabbageGetValue "filename"
kNewFileTrg    changed         gSfilepath                      ; if a new file is loaded generate a trigger
if kNewFileTrg==1 then                                         ; if a new file has been loaded...
                event           "i",99,0,0                     ; call instrument to update sample storage function table 
endif  

; Drop File
gSDropFile     cabbageGet         "LAST_FILE_DROPPED" ; file dropped onto GUI
if (changed(gSDropFile) == 1) then
                event             "i",100,0,0         ; load dropped file
endif

; show/hide
kLPFEnv           cabbageGetValue "LPFEnv"
if changed:k(kLPFEnv)==1 then
 if kLPFEnv==1 then
  cabbageSet  k(1),"LPFEnvRangeMin","alpha",1
  cabbageSet  k(1),"LPFEnvRangeBG","alpha",1
  cabbageSet  k(1),"LPFRes","alpha",1
 else
  cabbageSet  k(1),"LPFEnvRangeMin","alpha",0.3
  cabbageSet  k(1),"LPFEnvRangeBG","alpha",0.3
  cabbageSet  k(1),"LPFRes","alpha",0.3 
 endif
endif


; print envelope/grain window
katt     cabbageGetValue "att"
kdec     cabbageGetValue "dec"
kEnvType cabbageGetValue "EnvType"
if changed:k(katt,kdec,kEnvType)==1 then
 reinit REBUILD_ENV
endif
REBUILD_ENV:
iscale   =               i(katt)+i(kdec) > 1 ? 1/(i(katt)+i(kdec)) : 1
iShape   =      8
giEnvTable      ftgen           99,0,1024,16,0,1024*i(katt)*iscale,i(kEnvType)*iShape,1,1024*(1-i(katt)-i(kdec))*iscale,0,1,1024*i(kdec)*iscale,-i(kEnvType)*iShape,0
cabbageSet "EnvTable","tableNumber",99
rireturn

endin







instr    99    ; load sound file (browser button)
 gkReady        init            1
 gichans        filenchnls      gSfilepath                      ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL       ftgen           1,0,0,1,gSfilepath,0,0,1
 if gichans==2 then
  gitableR      ftgen           2,0,0,1,gSfilepath,0,0,2
 endif
 giReady        =               1                               ; if no string has yet been loaded giReady will be zero
 giSRScale      =               ftsr(gitableL)/sr               ; scale if sound file sample rate doesn't match Cabbage sample rate
                cabbageSet      "filer1","file", gSfilepath
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                cabbageSet      "FileName","text",SFileNoExtension
endin

instr    100    ; load sound file (file drop)
 gkReady          init        1                                 ; if no string has yet been loaded gkReady will be zero
 gitableL         ftgen       1,0,0,1,gSDropFile,0,0,1
 if gichans==2 then
  gitableR        ftgen       2,0,0,1,gSDropFile,0,0,2
 endif
 gichans          filenchnls  gSDropFile                        ; derive the number of channels (mono=1,stereo=2) in the sound file
 giSRScale        =           ftsr(gitableL)/sr                 ; scale if sound file sample rate doesn't match Cabbage sample rate
                  cabbageSet  "beg", "file", gSDropFile
                  cabbageSet  "filer1","file", gSDropFile
 SFileNoExtension cabbageGetFileNoExtension gSDropFile
                  cabbageSet  "FileName","text",SFileNoExtension
endin





instr    1                                                      ; GRAIN TRIGGERING INSTRUMENT (ALWAYS ON)

gkgain          cabbageGetValue "gain"
gkwidth         cabbageGetValue "width"
gkPanRate       cabbageGetValue "PanRate"
gkPanGBG        cabbageGetValue "PanGBG"
gkPanFunc       jspline         gkwidth, gkPanRate*0.5, gkPanRate*2
gkptr           cabbageGetValue "ptr"
gkpadding       cabbageGetValue "padding"
gkptr_OS        cabbageGetValue "ptr_OS"
gkRMOnOff       cabbageGetValue "RMOnOff"
gkRMmixMin      cabbageGetValue "RMmixMin"
gkRMmixMax      cabbageGetValue "RMmixMax"
gkRMfreqmin     cabbageGetValue "RMfreqmin"
gkRMfreqmax     cabbageGetValue "RMfreqmax"
gkGPS           cabbageGetValue "GPS"
gkgap_OS        cabbageGetValue "gap_OS"
gkLFOamp        cabbageGetValue "LFOamp"
gkLFOfrq        cabbageGetValue "LFOfrq"
gkatt           cabbageGetValue "att"
gkdec           cabbageGetValue "dec"
gkdurMin,kT1    cabbageGetValue "durMin"
gkdurMax,kT2    cabbageGetValue "durMax"
gkdurLink       cabbageGetValue "durLink"
if gkdurLink==1 then                                             ; link durations
                cabbageSetValue "durMin",gkdurMax,kT2
                cabbageSetValue "durMax",gkdurMin,kT1
endif
gktranspose     =               log2(cabbageGetValue:k("transpose")) ; convert from semitones to octaves
gkrndoctavemin,kT1  cabbageGetValue "rndoctavemin"
gkrndoctavemax,kT2  cabbageGetValue "rndoctavemax"
gkrndoctaveLink       cabbageGetValue "rndoctaveLink"
if gkrndoctaveLink==1 then                                             ; link random octave sliders
                cabbageSetValue "rndoctavemin",gkrndoctavemax,kT2
                cabbageSetValue "rndoctavemax",gkrndoctavemin,kT1
endif
gkpchosrange    cabbageGetValue "pchosrange"
gkFiltOnOff     cabbageGetValue "FiltOnOff"
gkHPFcf         cabbageGetValue "HPFcf"
gkLPFcf         cabbageGetValue "LPFcf"
gkBPFOnOff      cabbageGetValue "BPFOnOff"
gkBPFbwmin,kT1  cabbageGetValue "BPFbwmin"
gkBPFbwmax,kT2  cabbageGetValue "BPFbwmax"
gkBPFbwLink     cabbageGetValue "BPFbwLink"
if gkBPFbwLink==1 then                                                   ; link durations
 cabbageSetValue "BPFbwmin",gkBPFbwmax,kT2
 cabbageSetValue "BPFbwmax",gkBPFbwmin,kT1
endif
gkBPFgain       cabbageGetValue "BPFgain"
gkRvbOnOff      cabbageGetValue "RvbOnOff"
gkRvbDryWetMin  cabbageGetValue "RvbDryWetMin"
gkRvbDryWetMax  cabbageGetValue "RvbDryWetMax"
gkfblvl         cabbageGetValue "fblvl"
gkfco           cabbageGetValue "fco"
gkRvbLev        cabbageGetValue "RvbLev"
kBoundaryMode   cabbageGetValue "BoundaryMode"
gkLFOShape      cabbageGetValue "LFOShape"
gkLPFEnv        cabbageGetValue "LPFEnv"
gkLPFEnvRange   cabbageGetValue "LPFEnvRange"

iMIDIActiveValue=               1                                        ; IF MIDI ACTIVATED
iMIDIflag       =               0                                        ; IF GUI ACTIVATED
                mididefault     iMIDIActiveValue, iMIDIflag              ; IF NOTE IS MIDI ACTIVATED REPLACE iMIDIflag WITH iMIDIActiveValue 

icps            cpsmidi                                                  ; READ MIDI PITCH VALUES - THIS VALUE CAN BE MAPPED TO GRAIN DENSITY AND/OR PITCH DEPENDING ON THE SETTING OF THE MIDI MAPPING SWITCHES

if  gkOnOff==0 && iMIDIflag==0  then                                     ; SENSE GUI ON/OFF SWITCH & WHETHER THIS IS A MIDI NOTE ITS STATUS WILL BE IGNORED
                turnoff                                                  ; TURNOFF THIS INSTRUMENT IMMEDIATELY
endif                                                                    ; END OF THIS CONDITIONAL BRANCH

if iMIDIflag==1 then                                                     ; IF THIS IS A MIDI ACTIVATED NOTE...
  iPitchRatio   =               icps/cpsoct(8)                           ; MAP TO MIDI NOTE VALUE TO PITCH (CONVERT TO RATIO: MIDDLE C IS POINT OF UNISON)
else                                                                     ; OTHERWISE...
  iPitchRatio   =               1                                        ; PITCH RATIO IS JUST 1
endif                                                                    ; END OF THIS CONDITIONAL BRANCH

iporttime       =               0.05                                     ; PORTAMENTO TIME
gkporttime      linseg          0,.01,iporttime,1,iporttime              ; gkporttime WILL RAMP UP AND HOLD THE VALUE iporttime
kGPS            portk           gkGPS, gkporttime                        ; APPLY PORTAMENTO TO GRAINS-PER-SECOND VARIABLE
ktrigger        metro           gkGPS                                    ; CREATE A METRICAL TRIGGER (MOMENTARY 1s) USING GRAINS-PER-SECOND AS A FREQUENCY CONTROL
kptr            portk           gkptr, gkporttime                        ; APPLY PORTAMENTO TO POINTER VARIABLE

; POINTER LFO
if     gkLFOShape==1 then
 kLFO            lfo             (gkLFOamp * 0.5), gkLFOfrq, 1           ; TRIANGLE WAVEFORM LFO TO CREATE AN LFO POINTER
elseif gkLFOShape==2 then
 kLFO            lfo             (gkLFOamp * 0.5), gkLFOfrq, 4           ; Ramp WAVEFORM LFO TO CREATE AN LFO POINTER
elseif gkLFOShape==3 then
 kLFO            lfo             (gkLFOamp * 0.5), gkLFOfrq, 5           ; Sawtooth WAVEFORM LFO TO CREATE AN LFO POINTER
elseif gkLFOShape==4 then
 kLFO            lfo             (gkLFOamp * 0.5), gkLFOfrq, 0           ; Sine WAVEFORM LFO TO CREATE AN LFO POINTER
elseif gkLFOShape==5 then
 kLFO            randh           (gkLFOamp * 0.5), gkLFOfrq              ; sample-and-hold random WAVEFORM LFO TO CREATE AN LFO POINTER
else
 kLFO            randi           (gkLFOamp * 0.5), gkLFOfrq              ; interpolated random WAVEFORM LFO TO CREATE AN LFO POINTER
endif

; WRAPAROUND AND BOUNDARY LAW
kptr            =               kptr + kLFO                              ; ADD POINTER VARIABLE TO POINTER LFO
if kBoundaryMode==1 then
 kptr           wrap            kptr, 0, 1
elseif kBoundaryMode==2 then
 kptr           mirror          kptr, 0, 1
else
 kptr           limit           kptr, 0, 1
endif

; PRINT INDICATOR
;kptr_OS         randh           gkptr_OS/10, gkGPS ; for display only
kWidth          max             gkdurMin,gkdurMax
                cabbageSet      metro:k(10), "StartIndic", "bounds", 90 + (kptr)*1105,  5, 1+int(kWidth), 90

; TRIGGER GRAIN-SPAWNING INSTRUMENT
giSampleLen     =               ftlen(gifn)/sr                           ; DERIVE SAMPLE LENGTH IN SECONDS
kptr            =               kptr * giSampleLen                       ; RESCALE POINTER ACCORDING TO SAMPLE LENGTH
;               OPCODE          KTRIGGER, KMINTIME, KMAXNUM, KINSNUM, KWHEN, KDUR,  P4     P5
                schedkwhen      ktrigger,    0,        0,       2,      0,     0,  kptr, iPitchRatio  ;TRIGGER INSTR 2 ACCORDING TO TRIGGER. SEND POINTER VALUE VIA P-FIELD 4, SEND MIDI PITCH RATIO VIA P5
endin






instr    2                                                               ; SCHEDKWHEN TRIGGERED INSTRUMENT. ON FOR JUST AN INSTANCE. THIS INSTRUMENT DEFINES GRAIN DURATION, ADDS GRAIN GAP OFFSET, AND TRIGGERS THE GRAIN SOUNDING INSTRUMENT
idur            random          i(gkdurMin), i(gkdurMax)                 ; DERIVE A GRAIN DURATION ACCORDING TO DURATION RANGE SETTINGS 
igap_OS         random          0, i(gkgap_OS)                           ; DERIVE A GRAIN GAP OFFSET ACCORDING TO GUI VARIABLE "Grain Gap Offset"
                event_i         "i", 3, igap_OS, idur, p4, p5            ; TRIGGER INSTRUMENT 3 (GRAIN SOUNDING INSTRUMENT). PASS POINTER VALUE VIA P-FIELD 4. GRAIN GAP OFFSET IS IMPLEMENTED USING P2/'WHEN' PARAMETER FIELD. SEND MIDI PITCH RATIO VIA P5
endin






instr    3                                                               ; GRAIN SOUNDING INSTRUMENT
iInterval       =               log2(cabbageGetValue:i("Interval"))
iRandomDepth    cabbageGetValue "RandomDepth"                            ; DERIVE AN I-RATE VERSION OF gkampdepth
iEnvType        cabbageGetValue "EnvType"
iptr_OS         =               i(gkptr_OS)                              ; DERIVE AN I-RATE VERSION OF gkptr_OS (POINTER OFFSET)
ioct_OS         gauss           i(gkpchosrange)                          ; DERIVE CONTINUOUS TRANSPOSITION CONSTANT
irndoctave      random          i(gkrndoctavemin), i(gkrndoctavemax)     ; DERIVE OCTAVE INTERVAL TRANSPOSITION CONSTANT
ipchrto         =               cpsoct(8+(int(irndoctave)*iInterval)+i(gktranspose)+ioct_OS)/cpsoct(8) ; CREATE A PITCH RATIO (TO UNISON) CONSTANT COMBINING ALL TRANSPOSITION CONSTANTS
ipchrto         =               ipchrto * p5 * giSRScale                 ; SCALE PITCH RATIO WITH P5 WHICH, TRACED BACK THROUGH INSTR 2 TO INSTR 1, IS MIDI PITCH RATIO
iskip           =               (p4 * ((giSampleLen+(i(gkpadding)*2))/giSampleLen)) - i(gkpadding) ; scale pointer according to file length (in seconds) and add padding
iatt            =               i(gkatt)                                 ; DERIVE AN I-RATE VERSION OF gkatt (ATTACK TIME)
idec            =               i(gkdec)                                 ; DERIVE AN I-RATE VERSION OF gkdec (DECAY TIME)

;ENVELOPE
if    iatt+idec>=1  then                                                 ; IF ATTACK TIME AND DECAY TIME ARE GREATER THAN 1 THEN THE VALUES SHOULD BE RESCALED SO THAT THE SUM IS EQUAL TO 1
  isum          =               iatt+idec
  iatt          =               iatt/isum                                ; RESCALE iatt
  idec          =               idec/isum                                ; RESCALE idec
endif                                                                    ; END OF CONDITIONAL BRANCHING
iSteepness      =               8
aenv            transeg         0,  (iatt * p3),  -iSteepness*iEnvType,1, ((1 - iatt - idec) * p3),0,1,  (idec * p3),-iSteepness*iEnvType,0  ; DEFINE GRAIN AMPLITUDE ENVELOPE (EXPONENTIAL SEGMENTS)  
;

iamp            =               (1 - rnd(iRandomDepth))*i(gkgain)        ; DERIVE AMPLITUDE FROM 'Gain' SLIDER AND FROM 'Random Amplitude Depth' SLIDER
aptr            line            iskip,   p3 / ipchrto, iskip+p3          ; DEFINE A MOVING POINTER FUNCTION TO READ GRAIN FROM FUNCTION TABLE CONTAINING SOURCE AUDIO
asig            table3          aptr * sr, gifn                          ; READ AUDIO FROM SOURCE SOUND FUNCTION TABLE. I.E. CREATE GRAIN
;GRAIN-BY-GRAIN RING MODULATION;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
if  gkRMOnOff==1  then                                                   ; IF BAND-PASS FILTERING ON/OFF SWITCH IS ON...
  iRMfreq       random          i(gkRMfreqmin), i(gkRMfreqmax)           ; DEFINE RANDOM RING MODULATION FREQUENCY
  anoRM         =               1                                        ; A-RATE CONSTANT VALUE OF '1'
  amod          oscil           1, iRMfreq                               ; CREATE RING MODULATING OSCILATOR
  iMix          random          i(gkRMmixMin), i(gkRMmixMax)
  amod          ntrpol          anoRM, amod, iMix                        ; CREATE A MIX BETWEEN RING MODULATING OSCILATOR AND CONSTANT VALUE '1'
  asig          =               asig * amod                              ; RING MODULATE AUDIO SIGNAL
endif                                                                    ; END OF CONDITIONAL BRANCHING
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;GRAIN-BY-GRAIN BAND-PASS FILTERING;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
if  gkBPFOnOff==1  then                                                  ; IF BAND-PASS FILTERING ON/OFF SWITCH IS ON...
  iBPFmixMin    cabbageGetValue "BPFmixMin"
  iBPFmixMax    cabbageGetValue "BPFmixMax"
  iBPFmix       random          iBPFmixMin,iBPFmixMax
  iBPFcutmin    cabbageGetValue "BPFcutmin"
  iBPFcutmax    cabbageGetValue "BPFcutmax"
  iBPFcut       random          iBPFcutmin, iBPFcutmax                   ; DEFINE RANDOM FILTER CUTOFF VALUE (IN OCT FORMAT)
  iBPFfrq       =               cpsoct(iBPFcut)                          ; CONVERT TO CPS FORMAT
  iBPFbw        random          i(gkBPFbwmin), i(gkBPFbwmax)             ; DEFINE RANDOM BANDWIDTH VALUE
  aBPF          butbp           asig, iBPFfrq, iBPFbw*iBPFfrq            ; FILTER AUDIO USING reson OPCODE
  ;aBPF          butbp           aBPF, iBPFfrq, iBPFbw*iBPFfrq            ; FILTER AUDIO USING reson OPCODE
  ;aBPF          *=              1 / iBPFbw
  aBPF          *=              0.15 / iBPFbw
  asig          ntrpol          asig, aBPF*i(gkBPFgain), iBPFmix         ; CREATE MIX BETWEEN THE FILTERED SOUND AND THE DRY SOUND
endif                                                                    ; END OF CONDITIONAL BRANCHING
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;    

;GRAIN-BY-GRAIN LOW-PASS FILTERING;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
; each grain is enveloped
iLPFEnv           cabbageGetValue "LPFEnv"
iLPFEnvRangeMin   cabbageGetValue "LPFEnvRangeMin"
iLPFEnvRangeMax   cabbageGetValue "LPFEnvRangeMax"
iLPFRes           cabbageGetValue "LPFRes"
if iLPFEnv==1 then
 iLPFEnvRange    random          iLPFEnvRangeMin,iLPFEnvRangeMax
 aCF             =               20 + (19000 * aenv * (iLPFEnvRange ^ 2))
 asig            moogvcf         asig, aCF, iLPFRes
endif
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;    

;AMP ENVELOPE, AMP SCALING
asig            =               asig * aenv * iamp                       ; APPLY AMPLITUDE CONSTANT AND GRAIN ENVELOPE

;PANNING
iwidth          =               i(gkwidth)                               ; DERIVE AN I-RATE VERSION OF gkwidth
ipan            random          -iwidth, iwidth                          ; DERIVE A PANNING POSITION FOR THIS GRAIN FROM 'Random Panning Amount' SLIDER
ipan            =               ipan + .5                                ; OFFSET ipan by +0.5
if gkPanGBG==1 then
 aL              =               asig * ipan
 aR              =               asig * (1 - ipan)
else
 aL              =              asig * (0.5 + i(gkPanFunc))
 aR              =              asig * (1 - (0.5 + i(gkPanFunc)))
endif 

;REVERB
iRvbSend        random          i(gkRvbDryWetMin),i(gkRvbDryWetMax)
gasendL         =               gasendL + (aL * iRvbSend)                ; APPLY PANNING VARIABLE AND CREATE LEFT CHANNEL ACCUMULATED OUTPUT 
gasendR         =               gasendR + (aR * iRvbSend)                ; APPLY PANNING VARIABLE AND CREATE RIGHT CHANNEL ACCUMULATED OUTPUT
gaDryL          +=              aL * (1 - iRvbSend)
gaDryR          +=              aR * (1 - iRvbSend)

endin

    
        
                
instr    4                                                          ; GLOBAL PROCESSING OF GRANULAR OUTPUT & REVERB INSTRUMENT
aWetL           =               gasendL                             ; READ ACCUMULATED AUDIO SENT BY GRAIN RENDERING INSTRUMENT AND CREATE A LOCAL AUDIO VARIABLE OUTPUT (THIS IS TO ALLOW REDEFINITION OF THE VARIABLE WITHIN THE SAME LINE OF CODE - NOT POSSIBLE WITH GLOBAL VARIABLES)
aWetR           =               gasendR                             ; READ ACCUMULATED AUDIO SENT BY GRAIN RENDERING INSTRUMENT AND CREATE A LOCAL AUDIO VARIABLE OUTPUT (THIS IS TO ALLOW REDEFINITION OF THE VARIABLE WITHIN THE SAME LINE OF CODE - NOT POSSIBLE WITH GLOBAL VARIABLES)

if gkFiltOnOff==1 then                                              ; IF GLOBAL FILTERING ON/OFF SWITCH IS ON...
  kHPFcf        portk           cpsoct(gkHPFcf), gkporttime                 ; APPLY PORTAMENTO TO HIGH-PASS FILTER CUTOFF VARIABLE
  kLPFcf        portk           cpsoct(gkLPFcf), gkporttime                 ; APPLY PORTAMENTO TO LOW-PASS FILTER CUTOFF VARIABLE
  aWetL         buthp           aWetL, kHPFcf                       ; APPLY HIGH-PASS FILTER TO LEFT CHANNEL AUDIO...
  aWetL         buthp           aWetL, kHPFcf                       ; ...AND AGAIN TO SHARPEN CUTOFF SLOPE
  aWetR         buthp           aWetR, kHPFcf                       ; APPLY HIGH-PASS FILTER TO LEFT CHANNEL AUDIO...
  aWetR         buthp           aWetR, kHPFcf                       ; ...AND AGAIN TO SHARPEN CUTOFF SLOPE             
  aWetL         butlp           aWetL, kLPFcf                       ; APPLY LOW-PASS FILTER TO LEFT CHANNEL AUDIO...
  aWetL         butlp           aWetL, kLPFcf                       ; ...AND AGAIN TO SHARPEN CUTOFF SLOPE           
  aWetR         butlp           aWetR, kLPFcf                       ; APPLY LOW-PASS FILTER TO RIGHT CHANNEL AUDIO...
  aWetR         butlp           aWetR, kLPFcf                       ; ...AND AGAIN TO SHARPEN CUTOFF SLOPE           
endif                                                               ; END OF CONDITIONAL BRANCHING

if    gkRvbOnOff==1  then                                           ; IF REVERB ON/OFF SWITCH IS ON...
                denorm          aWetL, aWetR                        ; ...DENORMALIZE BOTH CHANNELS OF AUDIO SIGNAL
 arvbL, arvbR   reverbsc        aWetL*gkRvbLev, aWetR*gkRvbLev, gkfblvl, gkfco ; CREATE REVERBERATED SIGNAL (USING UDO DEFINED ABOVE)
                outs            arvbL, arvbR                        ; SEND REVERBERATED SIGNAL TO AUDIO OUTPUTS
endif                                                               ; END OF CONDITIONAL BRANCHING
                clear           gasendL, gasendR                    ; ZERO GLOBAL AUDIO VARIABLES USED TO SEND ACCUMULATED GRAINS


; dry signal
aDryL           =               gaDryL                              ; 
aDryR           =               gaDryR                              ; 

if gkFiltOnOff==1 then                                              ; IF GLOBAL FILTERING ON/OFF SWITCH IS ON...
  aDryL         buthp           aDryL, kHPFcf                       ; APPLY HIGH-PASS FILTER TO LEFT CHANNEL AUDIO...
  aDryL         buthp           aDryL, kHPFcf                       ; ...AND AGAIN TO SHARPEN CUTOFF SLOPE
  aDryR         buthp           aDryR, kHPFcf                       ; APPLY HIGH-PASS FILTER TO LEFT CHANNEL AUDIO...
  aDryR         buthp           aDryR, kHPFcf                       ; ...AND AGAIN TO SHARPEN CUTOFF SLOPE             
  aDryL         butlp           aDryL, kLPFcf                       ; APPLY LOW-PASS FILTER TO LEFT CHANNEL AUDIO...
  aDryL         butlp           aDryL, kLPFcf                       ; ...AND AGAIN TO SHARPEN CUTOFF SLOPE           
  aDryR         butlp           aDryR, kLPFcf                       ; APPLY LOW-PASS FILTER TO RIGHT CHANNEL AUDIO...
  aDryR         butlp           aDryR, kLPFcf                       ; ...AND AGAIN TO SHARPEN CUTOFF SLOPE           
endif                                                               ; END OF CONDITIONAL BRANCHING
                outs            aDryL, aDryR
gaDryL          =               0
gaDryR          =               0           
endin



instr 2000 ; meter
a1,a2           monitor
kUpdate         metro           30                       ; rate up update of the VU meters

; L meter
kres            init            0
kres            limit           kres-0.001,0,1 
kres            peak            a1
kres            lagud           kres,0.001,0.01                            
                rireturn
                cabbageSetValue "VUMeterL",kres,kUpdate
if release:k()==1 then
                cabbageSetValue "VUMeterL",k(0)
endif

; R meter
kresR           init            0
kresR           limit           kresR-0.001,0,1 
kresR           peak            a2                            
kresR           lagud           kresR,0.001,0.01                            
                rireturn
                cabbageSetValue "VUMeterR",kresR,kUpdate     
if release:k()==1 then
                cabbageSetValue "VUMeterR",k(0)
endif

endin

</CsInstruments>

<CsScore>
f 1 0 1024 10 0                                                  ; EMPTY TABLE FOR SOUND FILE
i 4 0 z                                                          ; GLOBAL PROCESSING OF GRANULAR OUTPUT & REVERB
i 700  0 z                                                       ; SENSE FOR FILE BEING CHOSEN
i 2000 0 z                                                       ; METER
</CsScore>

</CsoundSynthesizer>