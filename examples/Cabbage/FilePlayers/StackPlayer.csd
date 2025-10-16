
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; StackPlayer.csd
; Iain McCurdy 2023

; Stack Player plays back a sound file in single-shot or looped with a user-defined number of coincident layers (stack).

; Each of those layers can be iteratively transposed through the use of a change in playback speed resulting in both 
;  pitch and timing (rhythmical) changes from layer-to-layer.

; The method of incrementating playback speed is either exponential (ratio) or linear (harmonic).
; In Ratio mode layers will be separated by equal musical intervals. 
;  For example a ratio of 2 will result in layers being seperated by octaves.
; In Harmonic mode layers will be separated by equal numbers of cycles per second.
;  For example, if a harmonic interval of '1' is given, layers will follow frequency steps of the harmonic series.

; Open File           - open a file for playback in a stack 
; Play/Stop           - play stop the stack of files
; Interpolation       - four different quality (interpolation) modes are offered. 
;                        These become particularly important if sound files are transposed downwards.
;                        The options in the list are in the order of increasing quality at the expense of additional CPU load.
;                        When high numbers of layers are requested, it may become necessary to reduce the interpolation setting in order to prevent buffer underruns.
;                        The different options for interpolation are essentially different opcodes, which are noted in the list below.
;                       1. NONE (table)
;                       2. LINEAR (tablei)
;                       3. CUBIC (table3)
;                       4. SINC (tablexkt)

; 1. Single Shot      - play each layer of the stack once and then stop. 
;                        Note that because layers will be playing at different speeds, they will end at different times. 
; 2. Looped           - play each layer with looping once the end of the file is reached 
; Speed/Pitch         - base playback speed (before additional modifications have been applied on a layer-by-layer basis. 
; Interval Mode:      - the way in which the differing speeds of different layers are derived can be set using one of three methods.
;  1. Ratio           - in this mode, the user sets what will produce a frequency ratio between consecutive layers.
;                        for example if a ratio of 2 is set, secutive layers will be 1 octave apart from one another.
;                        Layers will always be separated by a consistent musical interval. 
;  2. Harmonic        - In this mode, consecutive layers will be the separated by the same number of cycles per second
;                        For example, if a value of one is given, pitches expressed by the stack will follow the harmonic series.
;  3. Semitones       - This is mode produces the same arraying of frequncies as 'Ratio' mode, the different being that the user can specify the interval in semitones.
;  4. Random          - Randomly spaced pitch gaps between layers. Random spread is specified in semitones.
;                        value will be semitones x layer_number x random_value_0_to_1   
;  5. Gaussian        - arrangement of transpositions / speed modifications form a bell-curve distribution.
;                        in this case, 'Semitones' defines the maximum transposition - both positive and negative - about unison.
;  Shape              - (only available with Gaussian Interval Mode) 'Shape' controls the narrowness of the peak of the bell curve.

; Glissando           - This applies a sliding glissando of a user-definable amount to changes made to both Speed and  
; N.Layers            - Number of layers in the stack. 
;                        Changes to this parameter require a reinitialisation therefore there is a break in audio continuity when it is adjusted.
;                        Higher settings may start to place an audible strain in the computer's CPU. 
;                        This is partly because an extra high-quality opcode is used for file playback in order to maintain fidelity when lower tranpositions are demanded.
; AMPLITUDE CURVE
;  This defines the the amplitudes of the layers using a two-segment envelope.
; Curve 1 (dial)                            - Curve of the first segment
; Curve 2 (dial)                            - Curve of the second segment
; Value 1 (ASV1) (mini-slider)              - Starting value of the envelope
; Value 2 (ASV2) (mini-slider)              - Ending value of the envelope
;                                              (the midway point is hard-wired to maximum
; Breakpoint Position (ASPos) (mini-slider) - location of the mid-point of the envelope
; The locations of the layers on the amplitude curve are indicated by red lines.

; Time Smear                                - offsetting of the start times of each subsequent layers. 
;                                             This is expressed as a ratio of the complete duration of the file.
;                                             If this is given a value of zero, no time smearing is applied.
;                                             If this is given a value of 1, time smearing values for the layers in the stack will be evenly spread across the full duration of the spound file.
;                                             this is an i-rate parameter so changing it will force the stack to restart.
;                                             In 'SINGLE SHOT' mode, time smear values are applied as if delays rather than as offset pointer locations.

; (Time Smearing Array Shape)               - this selects the method with which to array the time smearing values
; Linear                                    - evenly spread time increments. A value of '1' means that they will be spread across the entire file.
; Random                                    - Randomly spread time increments. A value of '1' means that they will be spread across the entire file.

; Level                                     - output level of the instrument

<Cabbage>
form caption("Stack Player") size(1405,330), colour(40,50,60) pluginId("T3Pl"), guiMode("queue")

#define DIAL_STYLE_K valueTextBox(1)
#define DIAL_STYLE_I valueTextBox(1), trackerColour(200,100,100)

soundfiler bounds(  5,  5,1395,175), channel("filer1"),  colour("Silver"), fontColour(160, 160, 160, 255), 
label bounds(6, 4, 560, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")

filebutton bounds(  5,200, 80, 25), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse")
checkbox   bounds(  5,230, 95, 25), channel("PlayStop"), text("Play/Stop"), colour("yellow"), fontColour:0("white"), fontColour:1("white")

label      bounds(  5,263, 80, 11), text("INTERPOLATION"), fontColour("White"), align("left")
combobox   bounds(  5,275, 80, 20), channel("Interp"), items("NONE","LINEAR","CUBIC","SINC"), value(4)

checkbox   bounds(105,240, 95, 15), channel("SingleShot"), text("SINGLE SHOT"), colour("yellow"), fontColour:0("white"), fontColour:1("white"), radioGroup(1), value(0)
checkbox   bounds(105,260, 95, 15), channel("Looped"),       text("LOOPED"),    colour("yellow"), fontColour:0("white"), fontColour:1("white"), radioGroup(1), value(1)

rslider    bounds(215,205, 70,100), channel("Speed"), range(0, 4, 1, 0.5), colour(60, 60,100), text("Speed/Pitch"), $DIAL_STYLE_K

image      bounds(295,185,380,125), colour(0,0,0,0), outlineThickness(1), outlineColour("Grey") corners(5)
{
label      bounds(  0,  5,380, 14), text("S P E E D   S E P A R A T I O N"), align("centre")
label      bounds( 10, 45, 90, 14), text("Interval Mode")
combobox   bounds( 10, 60, 90, 20), channel("IntervalMode"), items("Ratio","Harmonic","Semitones","Random","Gaussian"), value(1)
rslider    bounds(115, 20, 70,100), channel("Ratio"), range(0.5, 2, 1.25, 0.5), colour(60, 60,100), text("Ratio"), $DIAL_STYLE_K ; intvl
rslider    bounds(115, 20, 70,100), channel("Harmonic"), range(0, 2, 1), colour(60, 60,100), text("Harmonic"), visible(0), $DIAL_STYLE_K ; harm
rslider    bounds(115, 20, 70,100), channel("Semitones"), range(-24, 24, 5, 1,0.01), colour(60, 60,100), text("Semitones"), visible(0), $DIAL_STYLE_K ; semitones
rslider    bounds(205, 20, 70,100), channel("Shape"),  range(0, 1, 0.5, 0.5), colour(60, 60,100), text("Shape"), $DIAL_STYLE_K, visible(1)
rslider    bounds(295, 20, 70,100), channel("Glissando"), range(0.001,20,0.05,0.5), colour(60, 60,100), text("Glissando"), $DIAL_STYLE_K
}

rslider    bounds(685,205, 70,100), channel("NLayers"), range(1, 64, 4, 1,1), colour(60, 60,100), text("N.Layers"), $DIAL_STYLE_I

image      bounds(770,185,310,125), colour(0,0,0,0), outlineThickness(1), outlineColour("Grey") corners(5)
{
label      bounds(  0,  5,310, 14), text("L A Y E R   A M P L I T U D E S"), align("centre")
rslider    bounds(  0, 25, 70, 95), channel("ASCurve1"), range(-32, 32, 2), colour(60, 60,100), text("Curve 1"), $DIAL_STYLE_K
vslider    bounds( 70, 25, 10, 85), channel("ASV1"), range(0, 1, 0)
gentable   bounds( 80, 25,150, 85), channel("AmpShape"), tableNumber(11), ampRange(0,1,-1), fill(0), outlineThickness(1.5), tableColour("Silver"), tableGridColour(0,0,0,0)
vslider    bounds(230, 25, 10, 85), channel("ASV2"), range(0, 1, 0)
hslider    bounds( 80,110,150, 10), channel("ASPos"), range(0, 1, 0.0)
rslider    bounds(240, 25, 70, 95), channel("ASCurve2"), range(-32, 32, -2), colour(60, 60,100), text("Curve 2"), $DIAL_STYLE_K
}

rslider    bounds(1095,205, 70,100), channel("OS"),  range(0, 1, 0), colour(60, 60,100), text("Time Smear"), $DIAL_STYLE_K
checkbox   bounds(1170,240, 80, 15), channel("OS_Lin"), text("Linear"), fontColour:0("white"), fontColour:1("white"), radioGroup(2), value(1)
checkbox   bounds(1170,260, 80, 15), channel("OS_Rnd"), text("Random"), fontColour:0("white"), fontColour:1("white"), radioGroup(2)
rslider    bounds(1245,205, 70,100), channel("Amp"), range(0, 2, 0.7, 0.5), colour(60, 60,100), text("Level"), $DIAL_STYLE_K

label    bounds(  5,317,120, 12), text("Iain McCurdy |2023|"), align("left"), fontColour("Silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -+rtmidi=NULL -M0 -dm0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 8
nchnls = 2
0dbfs  = 1

gichans            init                0
giFileSR           init                sr
giFileLen          init                0
gkReady            init                0
gSfilepath         init                ""
gkTabLen           init                2
gitableL           ftgen               1,0,2,2,0
gitableR           ftgen               2,0,2,2,0

giAmpShape         ftgen               11, 0, 1024, 2, 0

giTone             ftgen               101,0,4096,10,0,0,0,1,1,1,1,1

giRandVals         ftgen               0, 0, 128, 21, 1, 1


; bipolar steep-shallow-steep curve. Increase multiple to increase steepness.
giSinH             ftgen               0, 0, 32, 2, 0
iMlt               =                   4 ; steepness
ix                 =                   0
while ix<=ftlen(giSinH) do
iVal               =                   sinh( ( (ix/ftlen(giSinH)) * 2 - 1) * iMlt) / sinh(iMlt) ; -1 to +1, ix = 0 to ftlen
                   tablew              iVal, ix, giSinH
ix                 +=                  1
od


; UDO to animate vertical lines on layer amplitude gentable 
opcode redrawVLines,0,i
iLayers            xin
; location 750,210,150, 85

; first reset
iCount             =               0
while iCount<64 do
 Schannel          sprintf         "vline%d", iCount
                   cabbageSet      Schannel, "bounds",0,0,0,0
iCount             +=              1
od

; then redraw relevant lines
iCount             =                   0
while iCount<iLayers do
 Schannel          sprintfk            "vline%d", iCount
  iX               =                   850 + ((150/(iLayers-1)) * (iCount))
                   cabbageSet          Schannel, "bounds", iX, 210, 2, 85
iCount             +=                  1
od

endop



opcode playerLayer, a, kiiiikkkkiiiiio
 kSpeed, iwsize, ifn, iLooped, iFileSR, kInterval, kShape, kIntervalMode, kGlissando, iAmpShape, iInterp, iOS, iOS_Type, iNLayers, iCount    xin
 if iOS_Type==1 then ; linear time smear distribution
  iInitPhase        divz                iCount*iOS, iNLayers, 0 ; value within the range 0 to 1
 else                ; random time smear distribution
  iInitPhase        random              0, iOS
 endif
;  iInitPhase        divz                iCount*iOS, iNLayers, 0 ; value within the range 0 to 1
;  iInitPhase        =                   iInitPhase ^ 4
  
 if iLooped==1 then ; looping on
  kPtr              init                ftlen(ifn) * iInitPhase
 else               ; looping off
  kPtr              init                -(ftlen(ifn) * iInitPhase)
 endif
 aPtr               interp              kPtr
 
 ; this will interatively apply lag to the kInterval variable down the stack producing more complex detuning effects as interval is changed
 kPortTime         linseg              0, 0.01, 1
 kInterval         portk               kInterval, kPortTime*kGlissando * 0.3
 
 if kIntervalMode==1 then                                    ; ratio 
  kSpeedL          =                   kSpeed * kInterval^iCount
 elseif kIntervalMode==2 then                                ; harmonic
  kSpeedL          =                   kSpeed * (1 + kInterval*iCount)
 elseif  kIntervalMode==3 then                               ; semitones
  kSpeedL          =                   kSpeed * semitone(kInterval*iCount)
 elseif  kIntervalMode==4 then                               ; random
  kSpeedL          =                   kSpeed * semitone(table:i(iCount,giRandVals)*kInterval*iCount)
 elseif  kIntervalMode==5 then                               ; gaussian
  kMlt             =                   0.001 + (16 * kShape)
  iNdx             =                   divz:i(iCount,(iNLayers-1),0)
  kVal             =                   sinh( ( iNdx*2 - 1) * kMlt) / sinh(kMlt) ; -1 to +1, iNdx = 0 to 1
  kSpeedL          =                   kSpeed * semitone(kInterval*kVal)
 endif
  
 if iInterp==1 then                                          ; no interpolation
  aSig             table               aPtr, ifn, 0, 0, iLooped
 elseif iInterp==2 then                                      ; linear interpolation
  aSig             tablei              aPtr, ifn, 0, 0, iLooped
 elseif iInterp==3 then                                      ; cubic interpolation
  aSig             table3              aPtr, ifn, 0, 0, iLooped
 elseif iInterp==4 then                                      ; sinc interpolation
  aSig             tablexkt            aPtr, ifn, kSpeedL, iwsize, 0, 0, iLooped
 endif
 
 ; amplitude scaling
 kAmp              table               iCount / (iNLayers-1), iAmpShape, 1
 kAmp              portk               kAmp, linseg:k(0,0.01,0.05)
 aSig              *=                  a(kAmp)
 
 kPtr              +=                  ksmps * (iFileSR/sr) * kSpeedL ; increment pointer
 aMix              =                   0
 if iCount<(iNLayers-1) then
  aMix             playerLayer         kSpeed, iwsize, ifn, iLooped, iFileSR, kInterval, kShape, kIntervalMode, kGlissando, iAmpShape, iInterp, iOS, iOS_Type, iNLayers, iCount + 1
 endif
                   xout                aSig + aMix
endop



instr    1    ; Read in widgets
 gSDropFile        cabbageGet          "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
                   event               "i", 100, 0, 0      ; load dropped file
 endif

 gSfilepath        cabbageGetValue     "filename"
 kNewFileTrg       changed             gSfilepath          ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                                    ; if a new file has been loaded...
                   event               "i", 99, 0, 0       ; call instrument to update sample storage function table 
 endif  

 kPlayStop         cabbageGetValue     "PlayStop"
 if trigger:k(kPlayStop,0.5,0)==1 && gkReady==1 then
                   event               "i", 2, 0, -1
 elseif trigger:k(kPlayStop,0.5,1)==1 then
                   turnoff2            2, 0, 1
 endif 
 
 ; interval rules
 kRatio            cabbageGetValue     "Ratio"
 kHarmonic         cabbageGetValue     "Harmonic"
 kSemitones        cabbageGetValue     "Semitones"
 gkShape           cabbageGetValue     "Shape"
 kIntervalMode     cabbageGetValue     "IntervalMode"
 kTrig             changed             kIntervalMode
 if kIntervalMode==1 then        ; ratio
  gkInterval       =                   kRatio
                   cabbageSet          kTrig, "Ratio", "visible", k(1)
                   cabbageSet          kTrig, "Harmonic", "visible", k(0)
                   cabbageSet          kTrig, "Semitones", "visible", k(0)
                   cabbageSet          kTrig, "Shape", "visible", k(0)
 elseif kIntervalMode==2 then    ; harmonic
  gkInterval       =                   kHarmonic
                   cabbageSet          kTrig,"Ratio", "visible", k(0)
                   cabbageSet          kTrig,"Harmonic", "visible", k(1)
                   cabbageSet          kTrig,"Semitones", "visible", k(0)
                   cabbageSet          kTrig, "Shape", "visible", k(0)
 elseif kIntervalMode==3 then    ; semitones
  gkInterval       =                   kSemitones
                   cabbageSet          kTrig, "Ratio", "visible", k(0)
                   cabbageSet          kTrig, "Harmonic", "visible", k(0)
                   cabbageSet          kTrig, "Semitones", "visible", k(1)
                   cabbageSet          kTrig, "Shape", "visible", k(0)
 elseif kIntervalMode==4 then    ; random
  gkInterval       =                   kSemitones
                   cabbageSet          kTrig, "Ratio", "visible", k(0)
                   cabbageSet          kTrig, "Harmonic", "visible", k(0)
                   cabbageSet          kTrig, "Semitones", "visible", k(1)
                   cabbageSet          kTrig, "Shape", "visible", k(0)
 elseif kIntervalMode==5 then    ; gaussian
  gkInterval       =                   kSemitones
                   cabbageSet          kTrig, "Ratio", "visible", k(0)
                   cabbageSet          kTrig, "Harmonic", "visible", k(0)
                   cabbageSet          kTrig, "Semitones", "visible", k(1)
                   cabbageSet          kTrig, "Shape", "visible", k(1)
 endif
 
 ; Amplitude shape table
 kASPos            cabbageGetValue     "ASPos"
 kASV1             cabbageGetValue     "ASV1"
 kASV2             cabbageGetValue     "ASV2"
 kASCurve1         cabbageGetValue     "ASCurve1"
 kASCurve2         cabbageGetValue     "ASCurve2"
 if changed:k(kASPos,kASV1,kASV2,kASCurve1,kASCurve2)==1 then
                   reinit              RebuildTable
 endif
 RebuildTable:
 if i(kASPos)==0 then
  giAmpShape       ftgen               11, 0, 1024, 16, 1, 1024,i(kASCurve2),i(kASV2)
 else
  giAmpShape       ftgen               11, 0, 1024, 16, i(kASV1), 1024*i(kASPos)+1,i(kASCurve1),1, 1024*(1-i(kASPos)),i(kASCurve2),i(kASV2) 
 endif
                   cabbageSet          "AmpShape", "tableNumber", 11



 ; create vertical line widgets on amplitude envelope in i-rate loop
 iCount = 0
 while iCount<64 do
  SWidget          sprintf             "bounds(0, 0, 0, 0), channel(\"vline%d\"), colour(255,0,0,50)", iCount
                   cabbageCreate       "image", SWidget
  iCount           +=                  1
 od



 ; redraw vertical line widgets on amplitude envelope in i-rate loop
 kNLayers          cabbageGetValue     "NLayers"
 if changed:k(kNLayers)==1 then
                   reinit              RESET0
 endif
 RESET0:
                   redrawVLines        i(kNLayers)
 rireturn

endin







instr    2    ; Sample triggered by 'play/stop' button
 kPortTime         linseg              0, 0.001, 1
 kGlissando        cabbageGetValue     "Glissando"
 kSpeed            cabbageGetValue     "Speed" 
 kSpeed            portk               kSpeed, kPortTime * kGlissando
 kInterval         portk               gkInterval, kPortTime * kGlissando
 iwsize            =                   8 
 kLooped           cabbageGetValue     "Looped"
 kNLayers          cabbageGetValue     "NLayers"
 kNLayers          init                4
 kIntervalMode     cabbageGetValue     "IntervalMode"
 kOS               cabbageGetValue     "OS"
 kAmp              cabbageGetValue     "Amp"
 kAmp              portk               kAmp, kPortTime * 0.05
 kInterp           cabbageGetValue     "Interp"

 kOS_Type          cabbageGetValue     "OS_Lin"

 
 if changed:k(kNLayers,kInterp,kLooped,kOS,kOS_Type)==1 then
                   reinit              RESET
 endif
 RESET:
 aL                playerLayer         kSpeed,iwsize,gitableL,i(kLooped),giFileSR,kInterval,gkShape,kIntervalMode,kGlissando,giAmpShape,i(kInterp),i(kOS),i(kOS_Type),i(kNLayers)
 if                gichans==2 then
  aR               playerLayer         kSpeed,iwsize,gitableR,i(kLooped),giFileSR,kInterval,gkShape,kIntervalMode,kGlissando,giAmpShape,i(kInterp),i(kOS),i(kOS_Type),i(kNLayers)
 else
  aR               =                   aL
 endif
 
 ; envelope on Play/Stop
 aEnv              expsegr             0.001, 0.01, 1, 0.3, 0.001
 aL                *=                  aEnv
 aR                *=                  aEnv
 
 iScale            =                   i(kNLayers) ^ 0.7
 aL                /=                  iScale
 aR                /=                  iScale
 
 rireturn
 aAmp              interp              kAmp
                   outs                aL*aAmp, aR*aAmp
endin




instr    99    ; load sound file
 gichans           filenchnls          gSfilepath                        ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL          ftgen               1, 0, 0, 1, gSfilepath, 0, 0, 1
 giFileSamps       =                   nsamp(gitableL)                   ; derive the file duration in samples
 giFileLen         filelen             gSfilepath                        ; derive the file duration in seconds
 giFileSR          filesr              gSfilepath
 gkTabLen          init                ftlen(gitableL)                   ; table length in sample frames
 if gichans==2     then
  gitableR         ftgen               2, 0, 0, 1, gSfilepath, 0, 0, 2
 endif
 gkReady           init                1                                 ; if no string has yet been loaded gkReady will be zero
                   cabbageSet          "filer1", "file", gSfilepath    

 ; write file name to GUI
 SFileNoExtension  cabbageGetFileNoExtension gSfilepath
                   cabbageSet          "stringbox","text",SFileNoExtension
endin



instr    100 ; LOAD DROPPED SOUND FILE
 gichans           filenchnls          gSDropFile                      ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL          ftgen               1, 0, 0, 1, gSDropFile, 0, 0, 1
 giFileSamps       =                   nsamp(gitableL)                 ; derive the file duration in samples
 giFileLen         filelen             gSDropFile                      ; derive the file duration in seconds
 giFileSR          filesr              gSDropFile
 gkTabLen          init                ftlen(gitableL)                 ; table length in sample frames
 if gichans==2 then
  gitableR         ftgen               2, 0, 0, 1, gSDropFile, 0, 0, 2
 endif
 gkReady           init                1                               ; if no string has yet been loaded gkReady will be zero
                   cabbageSet          "filer1", "file", gSDropFile

 /* write file name to GUI */
 SFileNoExtension  cabbageGetFileNoExtension gSDropFile
                   cabbageSet          "stringbox", "text", SFileNoExtension

endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>