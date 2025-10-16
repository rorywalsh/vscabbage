
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; SpeedTiltStereo
; Written by Iain McCurdy, 2025

; Plays left and right channel audio from a sound file at slightly different speeds to produce subtle detuning and delay effects 
;  and a spatialisation impression.

; Speed modulations are determined by moving an on-screen widget between two speaker widgets (x-position only).
; In addition, amplitude and high-frequency drop-off modulations can be layered on to exaggerate 
;  left/right and distance spatialisation (using both x and y displacements from the speaker widgets).
; Reverb, the level of which changes independently of that of the dry signal to emulate real-world acoustics, 
;  can be used to create a sense of dynamic depth and distance.

; SPEED RATIOS
; These are for display only and show the playback speed ratios for the left and right channels.

; AMPLITUDES (dB)
; These are for display only and show the amplitude changes for the left and right channels.

; SPEAKER LOCATIONS
; These number boxes can be used to move the locations of the two speaker widgets.

; DELAYS
; These are for display only and show the time delays that are currently applied to the left and right channels.
; To reduce a delay shown in one or the other channel, the source location widget should be dragged into the opposite side of the panel.

; RESTART  -  restart playback for the left and right channels from the beginning of the sound file (and in sync)
; RESYNC   -  resync playback on the left and  right channels (using the current playback position on the left channel

; REVERB
; Reverb On/Off   -  turn on or off the addition of a reverb effect.
;                    note that reverb level will be unaffected by distance from the two speaker widgets 
;                     so a sense of receding into the distance can be induced by moving the source widget vertically 
;                     away from the level of the two speakers. This can be exaggerated by increasing 'Y Expand'
; Y to Dry/Wet    - if this button is activated, y distance above or below the level of the speakers will also control the dry/wet level of signal sent to the reverb.
; Pre-Damp        -  if activated, the audio sent into the reverb is also low-pass filtered according to the frequency set by 'Damping'
; Level           -  send level to the reverb module
; Size            -  reverb decay time
; Damping         -  cutoff frequency of a low-pass filter within the delay algorithm
;                    This means that if the source widget is vertically level with the speakers, then there will be no reveberated signal
;                    When the source widget is level with the upper or lower boundaries, then the maximum reverb send level will be applied.

; Smoothing       -  smoothing applied to changed made to the source location widget
; Speed Range     -  scale the range of speed changed times possible by moving the widget; essentially this is scaling the size of the size of the XY pad area
; Amp. Drop Off   -  amount of amplitude attenuation due to distance from the source
; Y Expand        -  scales (warps) the distance representation on the Y-axis only
;                     this can be useful if you want to have the ability to scale the amplitude dramatically 
;                     without losing a mix of both channels when the source widget is vertically level with the L/R indicators

; Filter On/Off   -  if activated, high-frequency loss due to distance from the source will be emulated
; Filter Drop-Off -  amount of high-frequency loss due to distance from the source


; Inskip          - location from which playback of the sound file begins
; OPEN FILE       - open a file for the input
; PLAY            - playback file
; Speed           - playback speed ratio of the sound file
<Cabbage>
form caption("Speed Tilt Stereo") size(1170,415), pluginId("SpTS"), guiMode("queue"), colour(40,40,40)

; XY panel
image bounds(  0, 0,400,400), colour(50,50,50), channel("panel"), outlineThickness(1) ; xy panel

image bounds(  0,200,400,  1), colour(100,100,100,100)
image bounds(200,  0,  1,400), colour(100,100,100,100)

; speakers
label    bounds(  0,  0, 0, 0), channel("Spk1"), alpha(0.5), text("1"), fontColour("Black"), colour("White")
label    bounds(  0,  0, 0, 0), channel("Spk2"), alpha(0.5), text("2"), fontColour("Black"), colour("White")

image bounds(193,192,16,16), colour("White"), shape("ellipse"), channel("widget"), alpha(0.5)     ; panning widget

; speed ratios
image bounds(410, 10,165, 65) colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
{
label    bounds(  0,  3,160, 15), text("SPEED RATIOS")
nslider  bounds(  5, 20, 70, 35), channel("SpdL"), range(0.9,1.1,1,1,0.001), text("Speed L")
nslider  bounds( 90, 20, 70, 35), channel("SpdR"), range(0.9,1.1,1,1,0.001), text("Speed R")
}

; amplitudes
image bounds(585, 10,165, 65) colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
{
label    bounds(  0,  3,160, 15), text("AMPLITUDES (dB)")
nslider  bounds(  5, 20, 70, 35), channel("Amp1"), range(-36,36,0,1,0.1), text("Amp 1")
nslider  bounds( 90, 20, 70, 35), channel("Amp2"), range(-36,36,0,1,0.1), text("Amp 2")
}

; speaker locations
image bounds(410, 85,340, 70), colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
{
label    bounds(  0,  3,340, 15), text("SPEAKER LOCATIONS")
nslider  bounds(  5, 25, 70, 35), channel("X1"), range(-1,1,-1,1,.01), text("Spk.1 X")
nslider  bounds( 85, 25, 70, 35), channel("Y1"), range(-1,1,0,1,.01), text("Spk.1 Y")
nslider  bounds(185, 25, 70, 35), channel("X2"), range(-1,1,1,1,.01), text("Spk.2 X")
nslider  bounds(265, 25, 70, 35), channel("Y2"), range(-1,1,0,1,.01), text("Spk.2 Y")
}

; delay display
image bounds(410,165,340, 70), colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
{
nslider  bounds( 10,  5,140, 45), channel("DelayDispL"), range(0,99,0,1,0.00001), text("Left Delay") ;, active(0)
nslider  bounds(190,  5,140, 45), channel("DelayDispR"), range(0,99,0,1,0.00001), text("Right Delay") ;, active(0)
}

button   bounds(470, 240, 100, 35), channel("Restart"), text("RESTART","RESTART")
button   bounds(580, 240, 100, 35), channel("Resync"), text("RESYNC","RESYNC")

; reverb
image bounds(410, 285,340,115) colour(0,0,0,0), outlineColour("silver"), outlineThickness(1)
{
label    bounds(  0,  5,340, 15), align("centre"), text("R  E  V  E  R  B")
checkbox bounds(  5, 40,110, 15), channel("ReverbOnOff"), value(0), text("On/Off")
checkbox bounds(  5, 65,100, 15), channel("YToRvb"), value(0), text("Y to Dry/Wet")
checkbox bounds(  5, 90,100, 15), channel("PreDamp"), value(0), text("Pre-Damp")
rslider  bounds(105, 25, 70, 80), channel("RvbSend"), text("Level"), range(0, 1, 0.03, 0.5, 0.01), valueTextBox(1)
rslider  bounds(175, 25, 70, 80), channel("RvbSize"), text("Size"),  range(0.4, 1, 0.88, 2, 0.01), valueTextBox(1)
rslider  bounds(245, 25, 70, 80), channel("RvbCF"), text("Damping"),  range(200, 20000, 12000, 0.5, 1), valueTextBox(1)
}

image    bounds(770, 15,390,205), colour(0,0,0,0)
{
hslider  bounds(  0,  5,390, 20), channel("Smoothing"), text("Smoothing"), range(0.01,0.3,0.05,0.5,0.0001), valueTextBox(1)
hslider  bounds(  0, 35,390, 20), channel("SpdRange"), text("Speed Range"), range(0.000, 0.01,0.001,1,0.0001), valueTextBox(1)
hslider  bounds(  0, 65,390, 20), channel("AmpDropOff"), text("Amp.Drop-Off"), range(-3, 24, 3,1,0.1), valueTextBox(1)
checkbox bounds(  0, 95,100, 15), channel("FilterOnOff"), value(0), text("Filter On/Off")
hslider  bounds(  0,115,390, 20), channel("FilterDropOff"), text("Filter Drop-Off"), range(0, 8, 1, 1, 0.01), valueTextBox(1)
}

; meters
image   bounds(770,160,120, 97), colour(0,0,0,0), outlineThickness(1)
{
label   bounds(  0,  3,120, 14), text("OUTPUT METERS")
vmeter  bounds( 35, 23, 20, 60) channel("VUMeter1") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 65, 23, 20, 60) channel("VUMeter2") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
label   bounds( 35, 83, 20, 12), text("1")
label   bounds( 65, 83, 20, 12), text("2")
}

hslider  bounds(900,160,260, 20), channel("YExpand"), text("Y Expand"), range(1, 10, 1), valueTextBox(1)

image bounds(770,265,390,200) colour(0,0,0,0)
{
hslider    bounds(  0,  0,390, 20), channel("Inskip"), text("Inskip"), range(0,1,0), valueTextBox(1)
filebutton bounds(  0, 30, 70, 20), text("Open File","Open File"), fontColour("white") channel("filename")
button     bounds( 80, 30, 70, 20), text("PLAY","PLAY"), fontColour("white") channel("Play"), latched(1), colour:0(10,55,10), colour:1(70,200,70)
hslider    bounds(160, 30,230, 20), channel("Speed"), text("Speed"), range(0.0325, 4, 1,0.5), valueTextBox(1)
soundfiler bounds(  0, 55,390, 80), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 10, 58,390, 14), text(""), align(left), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
}

label      bounds(  5,401,110, 12), text("Iain McCurdy |2025|"), align("left")

</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-n -d -m0
</CsOptions>
<CsInstruments>

ksmps  = 64
nchnls = 2
0dbfs  = 1

gkNChnls init 0
gaFileL,gaFileR init 0

; tables for sound file storage
giFileL ftgen 1, 0, 4, 2, 0
giFileR ftgen 2, 0, 4, 2, 0

instr 1
 ; load file from browse
 gSfilepath     cabbageGetValue    "filename"  ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then              ; call instrument to update waveform viewer  
  event "i",2,0,0
 endif 
 
 gkPlay cabbageGetValue "Play"
 if trigger:k(gkPlay,0.5,0) == 1 then
  event "i",3,0,3600
 endif

 ; read in mouse attributes
 kMOUSE_DOWN_LEFT cabbageGetValue "MOUSE_DOWN_LEFT"
 kMOUSE_X         cabbageGetValue "MOUSE_X"
 kMOUSE_Y         cabbageGetValue "MOUSE_Y"
 
 ; widget radius
 iWidgetBounds[]  cabbageGet      "widget", "bounds"
 iWidgRad         =               iWidgetBounds[2]/2
 kWidgX           init            iWidgetBounds[0]
 kWidgY           init            iWidgetBounds[1]
 
 ; panel 'bounds' attributes
 iPanelBounds[]   cabbageGet      "panel", "bounds"
 iPanelX          =               iPanelBounds[0]
 iPanelY          =               iPanelBounds[1]
 iPanelWid        =               iPanelBounds[2]
 iPanelHei        =               iPanelBounds[3]
 
 ; a flag that indicates whether the widget is being moved or not.  
 ; Certain mouse conditions have to be met for this to change.
 ;  0 = we are not moving the widget
 ;  1 = we are moving the widget
 kMovingFlag      init            0
 
 ; sense whether to toggle the 'moving' flag to '1' (moving mode)
 if trigger:k(kMOUSE_DOWN_LEFT,0.5,0)==1 && kMOUSE_X>iPanelX && kMOUSE_X<(iPanelX+iPanelWid) && kMOUSE_Y>iPanelY && kMOUSE_Y<(iPanelY+iPanelHei) then
  kMovingFlag      =            1
 elseif trigger:k(kMOUSE_DOWN_LEFT,0.5,1)==1 then ; If the mouse left button is released, 'moving' should be deactivated
  kMovingFlag      =            0
 endif
 
 ; if we are allowed to move the widget (i.e. moving flag is '1')...
 if kMovingFlag==1 then
  kWidgX          limit           kMOUSE_X-iWidgRad, iPanelX, iPanelX+iPanelWid-(2*iWidgRad) ; limit position of widget to remain within the white panel
  kWidgY          limit           kMOUSE_Y-iWidgRad, iPanelY, iPanelY+iPanelHei-(2*iWidgRad)
                  cabbageSet      changed:k(kMOUSE_X,kMOUSE_Y), "widget", "bounds", kWidgX, kWidgY, iWidgRad*2, iWidgRad*2 ; move the widget to the new location whenever the mouse coordinates have changed
 endif

  ; normalise 
  kX = kWidgX / (iPanelWid - (iWidgRad * 2))
  kY = kWidgY / (iPanelHei - (iWidgRad * 2))
  ; expand to bipolar
  kX = (kX * 2) - 1
  kY = ((kY * 2) - 1) * (-1)
                 cabbageSetValue   "XSlid", kX, changed:k(kX) ; move sliders (needed for write automation in DAW)
                 cabbageSetValue   "YSlid", kY, changed:k(kY)
 
 ; speaker locations
 kX1 cabbageGetValue "X1"
 kY1 cabbageGetValue "Y1"
 kX2 cabbageGetValue "X2"
 kY2 cabbageGetValue "Y2"

 ; raw Y displacements from speaker positions
 gkYDisp1         =                abs(kY - kY1)
 gkYDisp2         =                abs(kY - kY2)

 ; raw Y displacements from speaker positions
 gkXDisp1         =                abs(kX - kX1)
 gkXDisp2         =                abs(kX - kX2)
  
 ; move speaker widgets
 cabbageSet changed:k(kX1,kY1),"Spk1","bounds",(kX1+1)*0.5*384,(-kY1+1)*0.5*384, 16, 16
 cabbageSet changed:k(kX2,kY2),"Spk2","bounds",(kX2+1)*0.5*384,(-kY2+1)*0.5*384, 16, 16
 
 ; apply portamento smoothing to changes made to the location of the source sound widget
 kramp     linseg 0, 0.001, 1
 kporttime =      kramp * cabbageGetValue("Smoothing")
 kX        portk  kX, kporttime
 kY        portk  kY, kporttime
  
 ; calculation distances between source sound location and each speaker
 kYExpand        cabbageGetValue  "YExpand"
 gkDist1         =                sqrt( (kX1 - kX)^2 + (kY1 - (kY*kYExpand))^2 ) 
 gkDist2         =                sqrt( (kX2 - kX)^2 + (kY2 - (kY*kYExpand))^2 ) 
 
 iUnisonDist = sqrt( 0.33^2 + 1^2 )
 ;print iUnisonDist
 
 kSpdRange cabbageGetValue "SpdRange"
 ; calculate speed ratios for each speaker. Note this is only affected by x-position
 gkSpdL  =  1 + (kSpdRange * (iUnisonDist - gkXDisp1) )
 gkSpdR  =  1 + (kSpdRange * (iUnisonDist - gkXDisp2) )
 
 ; send delay times to number boxes
 cabbageSetValue "SpdL", gkSpdL
 cabbageSetValue "SpdR", gkSpdR
 
endin

; LOAD SOUND FILE
instr 2
 turnoff2 3, 0, 0          ; turn off any existing file playback
 cabbageSetValue "Play", 0 ; turn off play button
                cabbageSet                  "filer1", "file", gSfilepath
 gkNChans       init                        filenchnls:i(gSfilepath)
 iNChans        filenchnls                  gSfilepath
 
 ; write audio to function tables
 giFileL        ftgen      1, 0, 0, 1, gSfilepath, 0, 0, 1
 if iNChans>1 then
  giFileR        ftgen      2, 0, 0, 1, gSfilepath, 0, 0, 2
 else
  giFileR        ftgen      2, 0, 0, 1, gSfilepath, 0, 0, 1
 endif
 
 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet                "FileName","text",SFileNoExtension
endin


instr 3

 if i(gkNChans)>0 then ; i.e. a file has been loaded

 if gkPlay==0 then
  turnoff
 endif

 kSpeed      cabbageGetValue  "Speed"
 ; apply portamento smoothing to changes made to the location of the source sound widget
 kramp  linseg 0,0.001,1
 kporttime = kramp * cabbageGetValue("Smoothing")
 kSpeed      portk             kSpeed, kporttime 

 ; sound file playback
 aPhsL       init            0
 kPhsL       downsamp        aPhsL
 kPhsL       init            0
 kRestart    cabbageGetValue "Restart"
 kInskip     cabbageGetValue "Inskip"
 if trigger:k(kRestart,0.5,0)==1 || changed:k(kInskip)==1 then
  kPhsL      =               0    
  reinit RESTART_PHASORS
 endif
 kResync     cabbageGetValue "Resync"
 if trigger:k(kResync,0.5,0)==1 then
  reinit RESTART_PHASORS
 endif
 RESTART_PHASORS:
 aPhsL       phasor   kSpeed*(gkSpdL) * sr/ftlen(1) * ftsr(1)/sr, i(kPhsL) + i(kInskip)
 aPhsR       phasor   kSpeed*(gkSpdR) * sr/ftlen(2) * ftsr(2)/sr, i(kPhsL) + i(kInskip)
 rireturn
 a1          table3   aPhsL, 1, 1
 a2          table3   aPhsR, 2, 1
 
 kDelay      =        (k(aPhsL) *  ftlen(1)/sr * ftsr(1)/sr) - (k(aPhsR) *  ftlen(2)/sr * ftsr(2)/sr)
             cabbageSetValue "DelayDispL", kDelay < 0 ? abs(kDelay) : 0
             cabbageSetValue "DelayDispR", kDelay > 0 ? abs(kDelay) : 0

 ; create reverb send signals before amplitude attenuation
 aRS1            =                a1
 aRS2            =                a2
 
 kAmpDropOff cabbageGetValue "AmpDropOff"
 kAmp1     =     -kAmpDropOff * (gkDist1 * 2)
 kAmp2     =     -kAmpDropOff * (gkDist2 * 2)
 cabbageSetValue "Amp1",kAmp1,changed:k(kAmp1)
 cabbageSetValue "Amp2",kAmp2,changed:k(kAmp2)
 a1     *=     ampdbfs(kAmp1)
 a2     *=     ampdbfs(kAmp2)
 
kFilterOnOff   cabbageGetValue "FilterOnOff"
kFilterDropOff cabbageGetValue "FilterDropOff"
if kFilterOnOff==1 then
 a1     tone   a1, cpsoct( limit:k( (14 - (gkDist1 * kFilterDropOff)), 4, 14))
 a2     tone   a2, cpsoct( limit:k( (14 - (gkDist2 * kFilterDropOff)), 4, 14))
endif

 ; reverb
 kReverbOnOff    cabbageGetValue  "ReverbOnOff"
 if kReverbOnOff==1 then
  kRvbSend       cabbageGetValue  "RvbSend"
  kRvbSize       cabbageGetValue  "RvbSize"
  kRvbCF         cabbageGetValue  "RvbCF"
  kPreDamp       cabbageGetValue  "PreDamp"
  if kPreDamp==1 then
   aRS1          butlp            aRS1, kRvbCF
   aRS2          butlp            aRS2, kRvbCF
  endif
  kYToRvb        cabbageGetValue  "YToRvb"
  kRvbSend       =                kYToRvb == 1 ? kRvbSend * gkYDisp1 : kRvbSend
  aR1,aR2        reverbsc         aRS1 * kRvbSend, aRS2 * kRvbSend, kRvbSize, kRvbCF
  a1             +=               aR1
  a2             +=               aR2
 endif


         outs    a1, a2


; meters
kUpdate         metro           30                       ; rate up update of the VU meters
#define meter(N)
#
; L meter
kres$N          init            0
kres$N          limit           kres$N-0.001,0,1 
kres$N          peak            a$N
kres$N          lagud           kres$N,0.001,0.001                            
                cabbageSetValue "VUMeter$N",kres$N,kUpdate
#
$meter(1)
$meter(2)

endif

endin


</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
