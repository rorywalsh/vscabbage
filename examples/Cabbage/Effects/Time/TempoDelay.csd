
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; TempoDelay.csd
; Written by Iain McCurdy, 2012, 2024

; A delay effect whose delay time is defined by a tempo and musical note duration instead of seconds.
; Tempo can be determined within the GUI or from a DAW host.

; Units for the delay are assumed to be demi-semiquavers.
; Knob for Rhy.Mult. will be replaced with a combobox once comboboxes work in plugins within hosts.
; Width control only applicable when ping-pong delay selected.

; Clock Source             -  tempo can be taken either from the GUI Tempo dial (Internal) or from a host DAW (External
; Delay Type               -  straight or ping-pong delay
; Test                     -  injects a short impulse sound into the effect for testing purposes
; Tempo                    -  base tempo of the delay (when Internal Delay Type is chosen)
; Rhy. Mult                -  value multiplied to the delay time to emulate a range of note durations
; Straight Dotted Triplet  -  another way of scaling the delay time. Straight = x1 Dotted = x1.5 Triplet = /3
; Damping                  -  cutoff frequency of the low-pass filter inserted in the feedback loop of the delay
; Feedback                 -  ratio of the sound leaving the delay that is fed back into the input
; Width                    -  stereo width of the output
; Input Gain               -  gain scaling of the input audio signal
; Mix                      -  crossfade between the dry and wet signals
; Level                    -  gain scaling of the output audio signal

; Delay Time (number box)  -  the actual delay time resulting from the combination of Tempo, Rhy. Mult and Straight/Fotted/Triplet is shown here.

<Cabbage>
form caption("Tempo Delay") size(745,120), pluginId("TDel"), guiMode("queue")
image               bounds(0, 0, 745,120), colour("LightBlue"), outlineColour("white"), outlineThickness(5) , corners(10)
#define RSLIDER_DESIGN textColour("black"), colour(100,100,255), trackerColour(200,200,255), valueTextBox(1), fontColour("black"), trackerInsideRadius(0.8), markerStart(0.25), markerEnd(1.25), markerColour("black"), markerThickness(0.4)

label  bounds( 10,   2, 80, 12), text("Clock Source"), fontColour("black"), channel("ClockSourceLabel")
button bounds( 10,  14, 80, 20), text("Internal","External"), channel("ClockSource"), value(0), fontColour:0("yellow"), fontColour:1("yellow")
label  bounds( 10,  37, 80, 12), text("Delay Type"), fontColour("black")
button bounds( 10,  49, 80, 20), text("Simple","Ping-pong"), channel("DelType"), value(1), fontColour:0("yellow"), fontColour:1("yellow")
button bounds( 10,  84, 80, 20), text("Test","Test"), channel("Test"), value(0), fontColour:0("yellow"), fontColour:1("yellow"), colour:0(0,0,0), colour:1(255,255,0), latched(0)

image   bounds(100, 11,210, 90), colour(0,0,0,0), channel("TempoWidgets"), visible(1)
{
rslider bounds(  0,  0, 70, 90), text("Tempo"), channel("tempo"), range(40, 500, 90, 1, 1), $RSLIDER_DESIGN
rslider bounds( 70,  0, 70, 90), text("Rhy.Mult."), channel("RhyMlt"), range(1, 16, 4, 1, 1), $RSLIDER_DESIGN
listbox bounds(150,  5, 55, 60), items("Straight","Dotted","Triplet"), channel("RhyAug"), value(1), fontSize(10), align("centre"), colour(100,100,40), highlightColour(255,255,100), fontColour("black")
}

nslider bounds(250, 80, 55, 33), channel("DelayTime"), text("Delay Time"), range(0,10,0,1,0.001), textColour("black"), active(0)

rslider bounds(315, 11, 70, 90), text("Damping"), channel("damp"), range(20,20000, 20000,0.5,1), $RSLIDER_DESIGN
rslider bounds(385, 11, 70, 90), text("Feedback"), channel("fback"), range(0, 1.30, 0.8), $RSLIDER_DESIGN
rslider bounds(455, 11, 70, 90), text("Width"), channel("width"), range(0,  1.00, 1), $RSLIDER_DESIGN
rslider bounds(525, 11, 70, 90), text("Input Gain"), channel("InGain"), range(0, 2.00, 1, 0.5), $RSLIDER_DESIGN
rslider bounds(595, 11, 70, 90), text("Mix"), channel("mix"), range(0, 1.00, 0.5), $RSLIDER_DESIGN
rslider bounds(665, 11, 70, 90), text("Level"), channel("level"), range(0, 1.00, 1), $RSLIDER_DESIGN

label   bounds(  7,105, 120, 12), text("Iain McCurdy |2012|"), fontColour("DarkGrey"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =     32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls       =     2     ; NUMBER OF CHANNELS (2=STEREO)
0dbfs        =     1

;Author: Iain McCurdy (2012)

instr    1
 kfback            cabbageGetValue     "fback"                ; read in widgets
 kdamp             cabbageGetValue     "damp"                 ;
 kInGain           cabbageGetValue     "InGain"               ;
 kmix              cabbageGetValue     "mix"                  ;
 klevel            cabbageGetValue     "level"                ;
 kbpm              cabbageGetValue     "HOST_BPM"             ;
 kRhyMlt           cabbageGetValue     "RhyMlt"               ;
 kDelType          cabbageGetValue     "DelType"              ;
                   cabbageSet          changed:k(kDelType), "width", "visible", kDelType
 kwidth            cabbageGetValue     "width"                ;
 kClockSource      cabbageGetValue     "ClockSource"          ;
                   cabbageSet          changed:k(kClockSource), "tempo", "visible", 1-kClockSource
 if kClockSource==0 then                                ; if internal clock source has been chosen...
  ktempo           cabbageGetValue     "tempo"                ; tempo taken from GUI knob control
 else
  ktempo           cabbageGetValue     "HOST_BPM"             ; tempo taken from host BPM
  ktempo           limit               ktempo,40,500          ; limit range of possible tempo values. i.e. a tempo of zero would result in a delay time of infinity.
 endif
 kRhyAug           cabbageGetValue     "RhyAug"                     
 ktime             divz                (60*kRhyMlt),(ktempo*8),0.1     ; derive delay time. 8 in the denominator indicates that kRhyMult will be in demisemiquaver divisions
 kRhyAug           cabbageGetValue     "RhyAug"
 if kRhyAug==2 then ; dotted
  ktime            *=                  1.5
 elseif kRhyAug==3 then ; triplets
  ktime            /=                  3
 endif
                   cabbageSetValue     "DelayTime", ktime, changed:k(ktime)
 atime             interp              ktime                                      ; interpolate k-rate delay time to create an a-rate version which will give smoother results when tempo is modulated
 
 ; input
 ainL,ainR         ins                                          ; read stereo inputs
 ainL              *=                  a(kInGain) 
 ainR              *=                  a(kInGain) 
  kTest            cabbageGetValue     "Test"
 ; mix in test click
 kTest             trigger             kTest, 0.5, 0
 ainL              +=                  a(kTest)
 ainR              +=                  a(kTest)
 
 if kDelType==0 then                                    ; if 'simple' delay type is chosen...
  abuf             delayr              5
  atapL            deltap3             atime
  atapL            tone                atapL,kdamp
  atapL            clip                atapL, 0, 0.9
                   delayw              ainL+(atapL*kfback)

  abuf             delayr              5
  atapR            deltap3             atime
  atapR            tone                atapR,kdamp
  atapR            clip                atapR, 0, 0.9
                   delayw              ainR+(atapR*kfback)    
 else                        ;otherwise 'ping-pong' delay type must have been chosen
  ;offset delay (no feedback)
  abuf             delayr              5
  afirst           deltap3             atime
  afirst           tone                afirst,kdamp
                   delayw              ainL

  ;left channel delay (note that 'atime' is doubled) 
  abuf             delayr              10            ;
  atapL            deltap3             atime*2
  atapL            tone                atapL,kdamp
  atapL            clip                atapL, 0, 0.9
                   delayw              afirst+(atapL*kfback)

  ;right channel delay (note that 'atime' is doubled) 
  abuf             delayr              10
  atapR            deltap3             atime*2
  atapR            tone                atapR,kdamp
  atapR            clip                atapR, 0, 0.9
                   delayw              ainR+(atapR*kfback)
 
  ;create width control. note that if width is zero the result is the same as 'simple' mode
  atapL            =                   afirst+atapL+(atapR*(1-kwidth))
  atapR            =                   atapR+(atapL*(1-kwidth))

 endif
 
 amixL             ntrpol              ainL, atapL, kmix    ; CREATE A DRY/WET MIX BETWEEN THE DRY AND THE EFFECT SIGNAL
 amixR             ntrpol              ainR, atapR, kmix    ; CREATE A DRY/WET MIX BETWEEN THE DRY AND THE EFFECT SIGNAL
                   outs                amixL * klevel, amixR * klevel
endin
        
</CsInstruments>

<CsScore>
i 1 0 [3600*24*7]
</CsScore>

</CsoundSynthesizer>
