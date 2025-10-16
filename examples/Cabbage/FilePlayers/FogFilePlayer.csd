/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; FogFilePlayer.csd
; Written by Iain McCurdy, 2015, 2025

; 2025 modification in that always processed in stereo (mono source copies single channel to both channels of the required stereo source)
; stereophonic effects on mono sources are introduced through any of the randomisation features

; NOTE THAT TRANSPOSITION DOES NOT CHANGING SMOOTHLY IF INPUT SOUND FILE SIZE IT VERY LARGE. SUGGEST RESTRICTING SOUND FILES TO A DURATION OF JUST A FEW SECONDS TO AVOID THIS.

; File player based around the granular synthesis opcode, 'fog'.
; A second voice can be activated (basically another parallel granular synthesiser) with parameter ariations of density, transposition, pointer location (Phs) and delay.
; Two modes of playback are available: manual pointer and speed
; The pointer and grain density can also be modulated by clicking and dragging on the waeform iew.
;  * This will also start and stop the grain producing instrument.
;  * In click-and-drag mode mouse X position equates to pointer position and mouse Y position equates to grain density. 
; If played from the MIDI keyboard, note number translates to 'Transposition' and key elocity translates to amplitude for the grain stream for that note.

; In 'Pointer' mode pointer position is controlled by the long 'Manual' slider with an optional amount of randomisation determined ny the 'Phs.Mod' slider.  

; Selecting 'Speed' pointer mode bring up some additional controls:
; Speed              -    speed ratio
; Freeze             -    freezes the pointer at its present locations 
; Range              -    ratio of the full sound file duration that will be played back. 1=the_entire_file, 0.5=half_the_file, etc. 
; Shape              -    shape of playback function:     'Phasor' looping in a single direction
;                                                'Tri' back and forth looping
;                                                'Sine' back and forth looping using a sinudoidal shape - i.e. slowing at the extremes of the oscillation
; The 'Manual' control functions as an pointer offset when using 'Speed' pointer mode
                                                          
; Density            -    grains per second
; Oct.Div            -    thinning the density in oerlapping octave steps. I.e. density is halved and then halved again etc. 
; Transpose          -    transposition as a ratio. Negative values result in grains playing in reverse.
; Transposition Mode -    timing of transposition changes: 'Grain by Grain'    - grains always maintain the transposition with which they began
;                                                          'Continuous'        - even grains in progress can be altered by changes made to 'Transpose' 

; --Randomisation--                                                   
; Trans.Mod.         -    randomisation of transposition (in octaves)
; Ptr.Mod.           -    randomisation of pointer position
; Dens Mod.          -    randomisation of grain density
; Amp.Mod.           -    randomisation of grain amplitude. Note that this is done on a grain by grain basis, grains retain the amplitude with which they start.

; --Density LFO--
; Depth              -    depth of LFO modulation of grain density (negative values inverts the LFO waveform)
; Amplitude          -    depth of LFO modulation of amplitude (negative values inverts the LFO waveform)
; Filter             -    depth of LFO modulation of the cutoff frequency of a low-pass filter (negative values inverts the LFO waveform)
; Res.               -    resonance of the low-pass filter
; Rate               -    rate of LFO modulation
; Shape              -    shape of the envelope; sine or random (random splines) 

; --Voice 2--
; Dens.Ratio         -    ratio of grain density of voice 2 with respect to the main oice (also adjustable using the adjacent number box for precise vvalue input)
; Ptr.Diff.          -    pointer position offset of voice 2 with respect to the main oice (also adjustable using the adjacent number box for precise vvalue input)
; Trans.Diff.        -    transposition offset of voice 2 with respect to the main oice (also adjustable using the adjacent number box for precise vvalue input)
; Delay              -    a delay applied to voice 2 which is defined as a ratio of the gap between grains (therefore delay time will be inversely proportional to grain density)
;                         This is a little like a phase offset for oice 2 with respect to that of the main oice.
;                         When using this control 'Dens.Ratio' should be '1' otherwise continuous temporally shifting between the grains of voice 2 and the main oice will be occurring anyway.

; --Enelope--
; Attack             -    amplitude envelope attack time for the envelope applied to complete notes
; Release            -    amplitude envelope release time for the envelope applied to complete notes

; --Control--
; MIDI Ref.          -    MIDI note that represent unison (no transposition) for when using the MIDI keyboard
; Level              -    output amplitude control


<Cabbage>
form caption("fog File Player") size(1260,510), colour(0,0,0), pluginId("FgFP"), guiMode("queue")

#define RSliderStyle trackerColour(130,135,170), textColour("white"), outlineColour( 10, 15, 50), colour( 50, 45, 90), valueTextBox(1)
#define RSliderStyle2 trackerColour(130,135,170), textColour("white"), outlineColour( 10, 15, 50), colour( 50, 45, 90), valueTextBox(0)
#define CheckboxStyle fontColour:0(255,255,255), fontColour:1(255,255,255)

image       bounds(  0,  0,1260,510), file("darkBrushedMetal.jpeg"), colour( 30, 35, 70), outlineColour("White"), shape("sharp"), line(3)
soundfiler  bounds(  5,  5,1250,175), channel("beg","len"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), 
label       bounds(  7,  5, 560, 14), text(""), align(left), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")
image       bounds(  5,  5,   1,175), channel("indicator"), visible(0)

hslider     bounds(  0,180,1260, 15), channel("phs"),   range( 0,1,0,1,0.0001), $RSliderStyle2
label       bounds(  0,195,1260, 13), text("Manual"), fontColour("white")

filebutton  bounds(  5,210,  80, 25), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse")
checkbox    bounds(  5,240,  95, 20), channel("PlayStop"), text("Play/Stop"), $CheckboxStyle
label       bounds(  5,263, 145, 12), text("[or right-click and drag]"), fontColour("white"), align("left")
checkbox    bounds(  5,280,  95, 15), channel("YFilters"), text("Y-Filters"), fontColour:0("white"), fontColour:1("white"), colour:0( 85, 85,0), colour:1(255,255,0), value(1)

label       bounds( 90,215, 75, 13), text("Ptr.Mode"), fontColour("white")
combobox    bounds( 90,230, 75, 20), channel("PhsMode"), items("Manual", "Speed"), value(2),fontColour("white")

rslider     bounds(160,215, 90, 80), channel("port"),     range( 0, 30.00, 0.01,0.5,0.01), text("Port."), visible(0), $RSliderStyle

rslider     bounds(160,215, 90, 80), channel("spd"),     range( -2.00, 2.00, 1), text("Speed"), visible(1), $RSliderStyle
button      bounds(240,230, 60, 20), channel("freeze"),  colour:0( 20, 20,40), colour:1(50,55,150), text("Freeze","Freeze"), fontColour:0(70,70,70), fontColour:1(200,200,255), visible(1)
rslider     bounds(290,215, 90, 80), channel("range"),   range(0.01,  1,  1),              text("Range"), visible(1), $RSliderStyle
label       bounds(370,215, 65, 13), text("Shape"), fontColour("white"), channel("shapelabel")
combobox    bounds(370,230, 65, 20), channel("shape"), items("phasor","tri","sine"), value(1), fontColour("white")

rslider     bounds(430, 214, 90, 80), channel("dens"),    range(0.2,4000, 50, 0.333,0.001),  text("Density"), $RSliderStyle colour(50, 45, 90, 255) outlineColour(10, 15, 50, 255) textColour(255, 255, 255, 255) trackerColour(130, 135, 170, 255)
rslider     bounds(500, 215, 90, 80), channel("OctDiv"),  range(  0,  8,    0, 0.5),  text("Oct.Div."), $RSliderStyle
rslider     bounds(570, 214, 90, 80), channel("pch"),     range(-8, 8, 1, 1, 0.001), text("Transpose"), $RSliderStyle colour(50, 45, 90, 255) outlineColour(10, 15, 50, 255) textColour(255, 255, 255, 255) trackerColour(130, 135, 170, 255)
label       bounds(655,210,120, 13), text("Transposition Mode"), fontColour("white")
combobox    bounds(655,225,120, 20), channel("TransMode"), items("Grain by Grain","Continuous"), value(1), fontColour("white")

image       bounds(790,202,300,100), colour(0,0,0,0), outlineColour("grey"), outlineThickness(1), shape("sharp"), plant("GrainEn"), { 
label       bounds(  0,  2,300, 10), text("G  R  A  I  N     E  N  V  E  L  O  P  E"), fontColour("white")
rslider     bounds(  0, 13, 90, 80), channel("dur"),     range(0.01, 2,    0.2, 0.5,0.0001),                    text("Duration"),  $RSliderStyle
rslider     bounds( 70, 13, 90, 80), channel("ris"),     range(0.001,0.2,  0.01,0.5,0.0001),  text("Rise"),      $RSliderStyle
rslider     bounds(140, 13, 90, 80), channel("dec"),     range(0.001,0.2,  0.01,0.5,0.0001),                    text("Decay"),     $RSliderStyle
rslider     bounds(210, 13, 90, 80), channel("band"),    range(0,    100,  3,  0.5,0.0001),                    text("Bandwidth"), $RSliderStyle
}

image       bounds(1095,202,160,100), colour(0,0,0,0), outlineColour("grey"), outlineThickness(1), shape("sharp"), plant("enelope"), { 
label       bounds(  0,   2,160, 10), text("E   N   V   E   L   O   P   E"), fontColour("white")
rslider     bounds(  0,  13, 90, 80), channel("AttTim"),    range(0, 5, 0, 0.5, 0.001),       text("Attack"), $RSliderStyle
rslider     bounds( 70,  13, 90, 80), channel("RelTim"),    range(0.01, 5, 0.05, 0.5, 0.001), text("Release"), $RSliderStyle
}

image       bounds(  5,310,300,100), colour(0,0,0,0), outlineColour("grey"), outlineThickness(1), shape("sharp"), plant("randomise"), { 
label       bounds(  0,  2,300, 10), text("R  A  N  D  O  M  I  S  E"), fontColour("white")
rslider     bounds(  0, 13, 90, 80), channel("fmd"),     range(    0, 1,    0), text("Trans.Mod."), $RSliderStyle
rslider     bounds( 70, 13, 90, 80), channel("pmd"),     range(    0, 1,    0.0055,0.25,0.00001),  text("Ptr.Mod."), $RSliderStyle
rslider     bounds(140, 13, 90, 80), channel("DensRnd"), range(    0, 2,    0), text("Dens.Mod."), $RSliderStyle
rslider     bounds(210, 13, 90, 80), channel("AmpRnd"),  range(    0, 1,    0), text("Amp.Mod."), $RSliderStyle
}

image       bounds(310,310,405,100), colour(0,0,0,0), outlineColour("grey"), outlineThickness(1), shape("sharp"), plant("LFO"), { 
label       bounds(  0,  2,405, 10), text("L  F  O"), fontColour("white")
rslider     bounds(  0, 13, 90, 80), channel("DensLFODep"), range(-2, 2, 0, 1, 0.001),       text("Density"), $RSliderStyle
rslider     bounds( 65, 13, 90, 80), channel("AmpLFODep"),  range(-1, 1, 0, 1, 0.001),  text("Amplitude"),  $RSliderStyle
rslider     bounds(130, 13, 90, 80), channel("FiltLFODep"),  range(-4, 4, 0, 1, 0.001),  text("Filter"),  $RSliderStyle
rslider     bounds(195, 13, 90, 80), channel("FiltRes"),  range(0, 1, 0, 0.5),  text("Res."),  $RSliderStyle
rslider     bounds(260, 13, 90, 80), channel("LFORte"),     range(0.01, 8, 0.1, 0.5, 0.001),  text("Rate"),  $RSliderStyle
label       bounds(335, 15, 60, 13), text("Shape"), fontColour("white")
combobox    bounds(335, 30, 60, 20), channel("LFOShape"), items("Sine","Rand."), value(1)
}
                              
image       bounds(720,310,370,100), colour(0, 0, 0, 0), outlineColour(128, 128, 128, 255), outlineThickness(1), , plant("dual"), { channel("image125")
label       bounds(  0,  2,370,10), text("V  O  I  C  E     2"), fontColour(255, 255, 255, 255) channel("label126")
checkbox    bounds( 10, 10, 70, 15), channel("DualOnOff"), text("On/Off"), $CheckboxStyle fontColour:0(255, 255, 255, 255) fontColour:1(255, 255, 255, 255)
rslider     bounds( 70, 13, 90, 80), channel("DensRatio"),   range(0.5, 2, 1, 0.64, 1e-05), text("Dens.Ratio"), $RSliderStyle colour(50, 45, 90, 255) outlineColour(10, 15, 50, 255) textColour(255, 255, 255, 255) trackerColour(130, 135, 170, 255)
rslider     bounds(140, 13, 90, 80), channel("PtrDiff"),   range(-1, 1, 0, 1, 1e-05), text("Ptr.Diff."), $RSliderStyle colour(50, 45, 90, 255) outlineColour(10, 15, 50, 255) textColour(255, 255, 255, 255) trackerColour(130, 135, 170, 255)
rslider     bounds(210, 13, 90, 80), channel("TransDiff"),   range(-2, 2, 0, 1, 1e-05), text("Trans.Diff."), $RSliderStyle colour(50, 45, 90, 255) outlineColour(10, 15, 50, 255) textColour(255, 255, 255, 255) trackerColour(130, 135, 170, 255)
rslider     bounds(280, 13, 90, 80), channel("Delay"),       range(0, 1, 0, 1, 1e-05), text("Delay"), $RSliderStyle colour(50, 45, 90, 255) outlineColour(10, 15, 50, 255) textColour(255, 255, 255, 255) trackerColour(130, 135, 170, 255)
}

image       bounds(1095,310,160,100), colour(0,0,0,0), outlineColour("grey"), outlineThickness(1), shape("sharp"), plant("control"), 
{ 
label       bounds(  0,  2,160, 10), text("C   O   N   T   R   O   L"), fontColour("white")
rslider     bounds(  0, 13, 90, 80), channel("MidiRef"),   range(0,127,60, 1, 1),   text("MIDI Ref."), $RSliderStyle
rslider     bounds( 70, 13, 90, 80), channel("level"),     range(  0,  3.00, 0.7, 0.5, 0.001), text("Level"), $RSliderStyle
}


button      bounds(1140,420,110,75), text("REC","REC"), channel("RecOut"), value(0), latched(1), fontColour:0(170,170,170), fontColour:1(255,205,205), colour:0(80,40,40), colour:1(150,0,0), corners(5)


keyboard    bounds(30, 420, 1100, 75)

label    bounds(  5,497,120, 11), text("Iain McCurdy |2015|"), align("left"), fontColour("silver")

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

               massign           0,3
gichans        init              0
giReady        init              0
gSfilepath     init              ""

giTriangle     ftgen             0, 0, 4097,  20, 3

; CURE USED TO FORM ATTACK AND DECAY PORTIONS OF EACH GRAIN
;                                NUM | INIT_TIME | SIZE | GEN_ROUTINE |  PARTIAL_NUMBER_1 | STRENGTH_1 | PHASE_1 | DC_OFFSET_1
giattdec      ftgen              0,        0,     524288,     19,             0.5,             0.5,        270,         0.5    ; I.E. A RISING SIGMOID

              opcode             NextPowerOf2i, i, i
 iInval       xin            
 icount       =                  1
 LOOP:
 if 2^icount>iInval then
  goto DONE
 else
  icount      =                  icount + 1
  goto LOOP
 endif
 DONE:
              xout               2^icount
endop


instr    1
 kRampUp      linseg             0, 0.001, 1
 gkport       cabbageGetValue    "port"
 gkloop       cabbageGetValue    "loop"
 gkPlayStop   cabbageGetValue    "PlayStop"
 gkPhsMode    cabbageGetValue    "PhsMode"
 gkPhsMode    init               1
 gklevel      cabbageGetValue    "level"
 gklevel      port               gklevel,0.05
 gkpch        cabbageGetValue    "pch" 
 gkpch        portk              gkpch,kRampUp * 1 ;0.1
 gkspd        cabbageGetValue    "spd"
 gkfreeze     cabbageGetValue    "freeze"
 gkrange      cabbageGetValue    "range"
 gkshape      cabbageGetValue    "shape"
 gkTransMode  cabbageGetValue    "TransMode"
 gkTransMode  init               1
 gkOctDiv     cabbageGetValue    "OctDiv"
 gkband       cabbageGetValue    "band"
 gkris        cabbageGetValue    "ris"
 gkdec        cabbageGetValue    "dec"
 gkdur        cabbageGetValue    "dur"   
 gkfmd        cabbageGetValue    "fmd"
 gkpmd        cabbageGetValue    "pmd"
 gkDensRnd    cabbageGetValue    "DensRnd"
 gkAmpRnd     cabbageGetValue    "AmpRnd"
 gkDensLFODep cabbageGetValue    "DensLFODep"
 gkAmpLFODep  cabbageGetValue    "AmpLFODep"
 gkLFORte     cabbageGetValue    "LFORte"
 gkLFOShape   cabbageGetValue    "LFOShape"
 gkDualOnOff  cabbageGetValue    "DualOnOff"
 gkDensRatio  cabbageGetValue    "DensRatio"
 gkPtrDiff    cabbageGetValue    "PtrDiff"
 gkTransDiff  cabbageGetValue    "TransDiff"
 gkYFilters   cabbageGetValue    "YFilters"
 
 gkPtrDiff    port               gkPtrDiff,0.1
 gkDelay      cabbageGetValue    "Delay"
 gkDelay      port               gkDelay,0.1
      
 if changed(gkPhsMode)==1 then
  if gkPhsMode==1 then
              cabbageSet         k(1), "spd", "visible", 0
              cabbageSet         k(1), "freeze", "visible", 0
              cabbageSet         k(1), "range", "visible", 0
              cabbageSet         k(1), "shape", "visible", 0
              cabbageSet         k(1), "shapelabel", "visible", 0
              cabbageSet         k(1), "port", "visible", 1
  elseif gkPhsMode==2 then
              cabbageSet         k(1), "spd", "visible", 1
              cabbageSet         k(1), "freeze", "visible", 1
              cabbageSet         k(1), "range", "visible", 1
              cabbageSet         k(1), "shape", "visible", 1
              cabbageSet         k(1), "shapelabel", "visible", 1
              cabbageSet         k(1), "port", "visible", 0
  endif
 endif
          
 gSfilepath   cabbageGetValue     "filename"
 kNewFileTrg  changed    gSfilepath          ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                      ; if a new file has been loaded...
              event              "i",99,0,0  ; call instrument to update sample storage function table 
 endif  
                                                                     
 /* START/STOP SOUNDING INSTRUMENT */
 ktrig        trigger            gkPlayStop,0.5,0
              schedkwhen         ktrig, 0, 0, 2, 0, -1

 /* MOUSE SCRUBBING */
 gkMOUSE_DOWN_RIGHT cabbageGetValue    "MOUSE_DOWN_RIGHT"    ; Read in mouse left click status
 kStartScrub  trigger            gkMOUSE_DOWN_RIGHT,0.5,0
 if gkMOUSE_DOWN_RIGHT==1 then
  if kStartScrub==1 then 
   reinit RAMP_FUNC
  endif
  RAMP_FUNC:                                                
  krampup     linseg             0,0.001,1
  rireturn
  kMOUSE_X    cabbageGetValue    "MOUSE_X"
  kMOUSE_X    portk              kMOUSE_X,gkport*kRampUp
  kMOUSE_Y    cabbageGetValue    "MOUSE_Y"
  kMOUSE_X    =                  (kMOUSE_X - 5) / 1120
  kMOUSE_Y    portk              1 - ((kMOUSE_Y - 5) / 175), krampup*0.05        ; SOME SMOOTHING OF DENSITY CHANGES IA THE MOUSE ENHANCES PERFORMANCE RESULTS. MAKE ANY ADJUSTMENTS WITH ADDITIONAL CONSIDERATION OF guiRefresh VALUE 
  
  ; filter parameters (right-click mouse click-and-drag Y axis over file panel)
  kLPF_CF          scale               kMOUSE_Y*2,14,4
  kLPF_CF          limit               kLPF_CF, 4, 14
  gkLPF_CF         portk               kLPF_CF, kRampUp*0.05
  kHPF_CF          scale               kMOUSE_Y*2-1,14,4
  kHPF_CF          limit               kHPF_CF, 4, 14
  gkHPF_CF         portk               kHPF_CF, kRampUp*0.05


  kLPF_CF          scale               cabbageGetValue:k("Y")*2,14,4
  kLPF_CF          limit               kLPF_CF, 4, 14
  kHPF_CF          scale               cabbageGetValue:k("Y")*2-1,14,4
  kHPF_CF          limit               kHPF_CF, 4, 14


  gkphs       limit              kMOUSE_X,0,1
  gkdens      limit              ((kMOUSE_Y^3) * 502) - 2, 0, 500
              schedkwhen         kStartScrub,0,0,2,0,-1
 else
  gkphs       cabbageGetValue    "phs"
  gkphs       portk              gkphs,gkport*kRampUp
  gkdens      cabbageGetValue    "dens"
 endif


 ; indicator
 iBounds[] cabbageGet "beg", "bounds"
 if changed:k(gkPlayStop)==1 && gkPhsMode==1 then
  if gkPlayStop==1 && gkPhsMode==1 then
              cabbageSet       k(1),"indicator","visible",1
  else
              cabbageSet       k(1),"indicator","visible",0
  endif
 endif 

 if gkPlayStop==1 && gkPhsMode==1 then
              cabbageSet       k(1), "indicator","bounds", iBounds[0] + (iBounds[2]*gkphs), iBounds[1], 1, iBounds[3]
 endif 



; Record
kRecOut cabbageGetValue "RecOut"
if changed:k(kRecOut)==1 then
 if kRecOut==1 then
              event              "i", 1000, 0, -1
 else
              turnoff2           1000, 0, 1
 endif
endif






endin



instr    99    ; load sound file
 gichans       filenchnls        gSfilepath                     ; derive the number of channels (mono=1,stereo=2) in the sound file
 iFtlen        NextPowerOf2i     filelen:i(gSfilepath)*sr
 iFtlen        limit             iFtlen, 2, 2^24                ; limit table size otherwise transposition behaves strangely
 print iFtlen
 gitableL      ftgen             1,0,iFtlen,-1,gSfilepath,0,0,1
 if gichans==2 then
  gitableR     ftgen             2,0,iFtlen,-1,gSfilepath,0,0,2
 else
  gitableR     ftgen             2,0,iFtlen,-1,gSfilepath,0,0,1
 endif
 giReady       =                 1                              ; if no string has yet been loaded giReady will be zero
               cabbageSet        "beg", "file", gSfilepath

 ; write file name to GUI
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet     "stringbox","text",SFileNoExtension

endin

instr    2    ; triggered by 'play/stop' button or right-click and drag
 if gkPlayStop==0&&gkMOUSE_DOWN_RIGHT==0 then
  turnoff
 endif
 if giReady==1 then                        ; i.e. if a file has been loaded
  
  ; ENELOPE
  iAttTim         cabbageGetValue "AttTim"               ; read in widgets
  iRelTim         cabbageGetValue "RelTim"
  if iAttTim>0 then                                      ; is amplitude enelope attack time is greater than zero...
   kenv           linsegr         0,iAttTim,1,iRelTim,0  ; create an amplitude enelope with an attack, a sustain and a release segment (senses realtime release)
  else            
   kenv           linsegr         1,iRelTim,0            ; create an amplitude enelope with a sustain and a release segment (senses realtime release)
  endif
  kenv            expcurve        kenv,8                 ; remap amplitude value with a more natural cure
  aenv            interp          kenv                   ; interpolate and create a-rate enelope

  kporttime       linseg          0,0.001,0.05           ; portamento time function. (Rises quickly from zero to a held value.)

  ; conditional reinitialisation
  if changed:k(gkTransMode)==1 then                      ; IF I-RATE ARIABLE CHANGE TRIGGER IS '1'...
                  reinit          RESTART                ; BEGIN A REINITIALISATION PASS FROM LABEL 'RESTART'
  endif
  RESTART:

  ; pointer randomisation
  kPmdRndL        unirand         gkpmd
  kPmdRndR        unirand         gkpmd
  
  if gkPhsMode==1 || gkMOUSE_DOWN_RIGHT == 1 then             ; mouse pointer mode
   kptrL          portk           gkphs + kPmdRndL, kporttime ; PORTAMENTO IS APPLIED TO SMOOTH VALUE CHANGES VIA THE GUI SLIDERS
   kptrR          portk           gkphs + kPmdRndR, kporttime
   kptrL          mirror          kptrL, 0, 1                 ; reflect out of range values
   kptrR          mirror          kptrR, 0, 1
   kptrL          =               kptrL * (nsamp(1)/ftlen(1)) ; rescale
   kptrR          =               kptrR * (nsamp(1)/ftlen(1))
  else
   if gkshape==1 then ; ramp pointer
    kptr          phasor          (gkspd * sr * (1-gkfreeze))/(nsamp(1) * gkrange)
   elseif gkshape==2 then ; triangle pointer
    kptr          oscili          1,(gkspd * sr * (1-gkfreeze))/(nsamp(1) * gkrange),giTriangle
   elseif gkshape==3 then ; sinusoidal pointer
    kptr          oscili          0.5,(gkspd * sr * (1-gkfreeze))/(nsamp(1) * gkrange)
    kptr          +=              0.5
   endif
   
   kptr           =               kptr * (nsamp(1)/ftlen(1)) * gkrange      ; rescale
   kptrL          =               kptr + ((gkphs + kPmdRndL) * (nsamp(1)/ftlen(1)))  ; random pointer
   kptrR          =               kptr + ((gkphs + kPmdRndR) * (nsamp(1)/ftlen(1)))
   kptrL          mirror          kptrL, 0, nsamp(1) / ftlen(1)
   kptrR          mirror          kptrR, 0, nsamp(1) / ftlen(1)
  endif
  aptrL           interp          kptrL
  aptrR           interp          kptrR
  
  ; fog constants
  iNumOverLaps    =               2000
  itotdur         =               3600

  ; LFO - density and amplitude
  if gkLFOShape==1 then ; sine
   kLFO           oscil           1, gkLFORte  
  elseif gkLFOShape==2 then ;random
   kLFO           jspline         1, gkLFORte*0.5, gkLFORte*2
  endif
  kdens           =               gkdens * octave(kLFO*gkDensLFODep)
  klevel          =               gklevel * (1 - (((gkAmpLFODep * 0.5 * kLFO) + (abs(gkAmpLFODep) * 0.5)) ^ 2))
  
  ; density randomisation
  kDensRndL       bexprnd         gkDensRnd
  kdensL          =               kdens * octave(kDensRndL)
  kDensRndR       bexprnd         gkDensRnd
  kdensR          =               kdens * octave(kDensRndR)

  ; pitch randomisation
  kPchRndL        bexprnd         gkfmd
  kpchL           =               gkpch * octave(kPchRndL)
  kPchRndR        bexprnd         gkfmd
  kpchR           =               gkpch * octave(kPchRndR)

  ; amplitude random modulation
  kAmpRndL        random          0, gkAmpRnd
  klevelL         =               klevel - sqrt(kAmpRndL)
  kAmpRndR        random          0, gkAmpRnd
  klevelR         =               klevel - sqrt(kAmpRndR)
  
  a1              fog             klevelL, kdensL, kpchL, aptrL, gkOctDiv, gkband, gkris, gkdur, gkdec, iNumOverLaps, 1, giattdec, itotdur, 0, i(gkTransMode)-1, 1
  a2              fog             klevelR, kdensR, kpchR, aptrR, gkOctDiv, gkband, gkris, gkdur, gkdec, iNumOverLaps, 2, giattdec, itotdur, 0, i(gkTransMode)-1, 1
  if gkDualOnOff==1 then
   a1b            fog             klevelL, kdensL * gkDensRatio, kpchL * octave(gkTransDiff), aptrL+(gkPtrDiff*nsamp(1)/ftlen(1)), gkOctDiv, gkband, gkris, gkdur, gkdec, iNumOverLaps, 1, giattdec, itotdur, 0, i(gkTransMode)-1, 1
   a2b            fog             klevelR, kdensR * gkDensRatio, kpchR * octave(gkTransDiff), aptrR+(gkPtrDiff*nsamp(1)/ftlen(1)), gkOctDiv, gkband, gkris, gkdur, gkdec, iNumOverLaps, 2, giattdec, itotdur, 0, i(gkTransMode)-1, 1
   if gkDelay>0 then
    a1b           vdelay          a1b, (gkDelay*1000)/gkdens, 1000
    a2b           vdelay          a2b, (gkDelay*1000)/gkdens, 1000
   endif
   a1             +=              a1b
   a2             +=              a2b
  endif

 ; LFO filter 
 kFiltLFODep       cabbageGetValue "FiltLFODep"
 if kFiltLFODep!=0 then ; only filter if depth is anything other than 1
  kFiltRes         cabbageGetValue "FiltRes"
  kCF              =              sr * 0.33 * (2^(-abs(kFiltLFODep))) * 2^(kLFO*kFiltLFODep)
  a1               zdf_2pole      a1, kCF, 0.5 + (kFiltRes*24.5)
  a2               zdf_2pole      a2, kCF, 0.5 + (kFiltRes*24.5)
 endif
 
   ; right-click filter (mono)
   if gkMOUSE_DOWN_RIGHT==1 && gkYFilters==1 then
    a1             zdf_2pole           a1, a(cpsoct(gkLPF_CF)), 0.5
    a2             zdf_2pole           a2, a(cpsoct(gkLPF_CF)), 0.5
    a1             zdf_2pole           a1, a(cpsoct(gkHPF_CF)), 0.5, 1
    a2             zdf_2pole           a2, a(cpsoct(gkHPF_CF)), 0.5, 1
   endif

                  outs            a1 * aenv, a2 * aenv           ; send stereo signal to outputs
  rireturn

 endif
endin

instr    3 ; MIDI triggered fog file player
 icps             cpsmidi                                  ; read in midi note data as cycles per second
 iamp             ampmidi         1                        ; read in midi elocity (as a value within the range 0 - 1)
 kBend            pchbend         0, 12
 iAttTim          cabbageGetValue "AttTim"                 ; read in widgets
 iRelTim          cabbageGetValue "RelTim"
 iMidiRef         cabbageGetValue "MidiRef"
 iFrqRatio        =               icps/cpsmidinn(iMidiRef) ; derive playback speed from note played in relation to a reference note (MIDI note 60 / middle C)

 if giReady==1 then                                        ; i.e. if a file has been loaded
  iAttTim         cabbageGetValue "AttTim"                 ; read in widgets
  iRelTim         cabbageGetValue "RelTim"
  if iAttTim>0 then                                        ; is amplitude enelope attack time is greater than zero...
   kenv           linsegr         0,iAttTim,1,iRelTim,0    ; create an amplitude enelope with an attack, a sustain and a release segment (senses realtime release)
  else            
   kenv           linsegr         1,iRelTim,0              ; create an amplitude enelope with a sustain and a release segment (senses realtime release)
  endif
  kenv            expcurve        kenv,8                   ; remap amplitude value with a more natural cure
  aenv            interp          kenv                     ; interpolate and create a-rate enelope

  kporttime       linseg          0,0.001,0.05             ; portamento time function. (Rises quickly from zero to a held value.)

  kBend           portk           kBend, kporttime

  ; conditional reinitialisation
  if changed:k(gkTransMode)==1 then                      ; IF I-RATE ARIABLE CHANGE TRIGGER IS '1'...
                  reinit          RESTART                ; BEGIN A REINITIALISATION PASS FROM LABEL 'RESTART'
  endif
  RESTART:

  
  kPmdRnd         unirand         gkpmd
  
  if gkPhsMode==1 then
   kptr           portk           gkphs+kPmdRnd, kporttime   ; PORTAMENTO IS APPLIED TO SMOOTH VALUE CHANGES IA THE FLTK SLIDERS
   kptr           mirror          kptr,0,1
   kptr           =               kptr * (nsamp(1)/ftlen(1))
   aptr           interp          kptr                       ; A NEW A-RATE ARIABLE (aptr) IS CREATED BASE ON kptr
  else
   if gkshape==1 then
    kptr          phasor          (gkspd * sr * (1-gkfreeze))/(nsamp(1) * gkrange)
   elseif gkshape==2 then
    kptr          oscili          1,(gkspd * sr * (1-gkfreeze))/(nsamp(1) * gkrange),giTriangle
   elseif gkshape==3 then
    kptr          oscili          0.5,(gkspd * sr * (1-gkfreeze))/(nsamp(1) * gkrange)
    kptr          +=              0.5
   endif
   kptr           =               kptr * (nsamp(1)/ftlen(1)) * gkrange
   kptr           +=              (gkphs+kPmdRnd) * (nsamp(1)/ftlen(1))
   kptr           mirror          kptr,0,nsamp(1)/ftlen(1)
  endif
  aptr            interp          kptr
  
  ; fog constants
  iNumOverLaps    =               2000
  itotdur         =               3600
  
  ; pitch randomisation
  kPchRnd         bexprnd         gkfmd                    ; random pitch
  kpch            =               iFrqRatio * octave(kPchRnd)
  gklevel         *=              iamp
  
  ; density randomisation
  kRndTrig        init            1
  kDensRnd        bexprnd         gkDensRnd
  kdens           =               gkdens * octave(kDensRnd)
  kRndTrig        metro           kdens

  ; amplitude random modulation
  kAmpRnd         random          0,gkAmpRnd
  klevel          =               gklevel-sqrt(kAmpRnd)

  ; LFO - density and amplitude
  if gkLFOShape==1 then     ; sine
   kLFO           oscil           1, gkLFORte  
  elseif gkLFOShape==2 then ; random
   kLFO           jspline         1, gkLFORte*0.5, gkLFORte*2
  endif
  kdens           =               gkdens * octave(kLFO*gkDensLFODep)
  klevel          =               gklevel * (1 - (((gkAmpLFODep * 0.5 * kLFO) + (abs(gkAmpLFODep) * 0.5)) ^ 2))
    
  a1              fog             klevel, kdens, kpch * semitone(kBend)*ftsr(1)/sr, aptr, gkOctDiv, gkband, gkris, gkdur, gkdec, iNumOverLaps, 1, giattdec, itotdur, 0, i(gkTransMode)-1, 1
  a2              fog             klevel, kdens, kpch * semitone(kBend)*ftsr(1)/sr, aptr, gkOctDiv, gkband, gkris, gkdur, gkdec, iNumOverLaps, 2, giattdec, itotdur, 0, i(gkTransMode)-1, 1
  if gkDualOnOff==1 then                                           
   a1b            fog             klevel, kdens*gkDensRatio, kpch*octave(gkTransDiff) * semitone(kBend)*ftsr(1)/sr, aptr+(gkPtrDiff*nsamp(1)/ftlen(1)), gkOctDiv, gkband, gkris, gkdur, gkdec, iNumOverLaps, 1, giattdec, itotdur, 0, i(gkTransMode)-1, 1
   a2b            fog             klevel, kdens*gkDensRatio, kpch*octave(gkTransDiff) * semitone(kBend)*ftsr(1)/sr, aptr+(gkPtrDiff*nsamp(1)/ftlen(1)), gkOctDiv, gkband, gkris, gkdur, gkdec, iNumOverLaps, 2, giattdec, itotdur, 0, i(gkTransMode)-1, 1
   if gkDelay>0 then
    a1b           vdelay          a1b,(gkDelay*1000)/gkdens,1000
    a2b           vdelay          a2b,(gkDelay*1000)/gkdens,1000
   endif
   a1             +=              a1b
   a2             +=              a2b
  endif
  
  ; LFO filter 
  kFiltLFODep       cabbageGetValue "FiltLFODep"
  if kFiltLFODep!=0 then ; only filter if depth is anything other than 1
   kFiltRes         cabbageGetValue "FiltRes"
   kCF              =              sr * 0.33 * (2^(-abs(kFiltLFODep))) * 2^(kLFO*kFiltLFODep)
   a1               zdf_2pole      a1, kCF, 0.5 + (kFiltRes*24.5)
   a2               zdf_2pole      a2, kCF, 0.5 + (kFiltRes*24.5)
  endif

                  outs            a1*aenv,a2*aenv                ; send stereo signal to outputs
  rireturn

 endif

endin




; record
instr 1000
  a1, a2         monitor

  ilen           strlen           gSfilepath                     ; Derive string length.
  SOutputName    strsub           gSfilepath,0,ilen-4            ; Remove ".wav"
  SOutputName    strcat           SOutputName,"_Fog_"            ; Add suffix
  iDate          date
  SDate          sprintf          "%i",iDate
  SOutputName    strcat           SOutputName,SDate              ; Add date
  SOutputName    strcat           SOutputName,".wav"             ; Add extension
                 fout             SOutputName, 8, a1, a2

endin


</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
