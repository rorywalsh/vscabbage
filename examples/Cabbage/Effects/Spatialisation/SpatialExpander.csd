
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; SpatialExpander
; Written by Iain McCurdy, 2025

; This tool takes a mono or stereo input signal and expands it into a stereo signal using very short delays
;  dependent on the graphical location of a source widget to the two speakers.
; In addition, sound energy losses - both amplitude and high frequencies - can be emulated.
; Distance is emulated using a reverb which decays at a rate independent of the dry signal with respect to distance from the source, 
;  as occurs in reality.

; DELAY TIMES (ms)
; This box reveals the delays times for the left and right speakers in milliseconds. 
; It is not intended that the user directly interacts with the number boxes shown.

; AMPLITUDES (dB)
; This box reveals the amplitude attenduations for the left and right speakers (in decibels). 
; It is not intended that the user directly interacts with the number boxes shown.

; OUTPUT METERS
; A basic indication of left/right amplitudes for troubleshooting

; Invert Delays   -  when active, the audio outputs from the delays are inverted. This will have a clearer audible impact when some dry signal is mixed in.
;                    note that when audio reflects off a surface, it is inverted, so this feature can be considered an emulation of that.
; Mono Out        -  the stereo processing in this effect is liable to produce comb filtering effects if the left and right channels are mixed
;                     (either in software, hardware or in the air) and this button forces the stereo outputs to be mixed within this software so that these consequences can be auditioned.
;                     The degree to which comb filtering will be evident will depend on the settings made in the GUI, the audio source material used and the listening  environment.
;                     Essentially the user must make a decision on the tolerability of these artefacts under anticipated settings and listening conditions.
; Mono In/Stereo In - choose between a mono or stereo input.
;                    if mono is chosen, the left input channel is simply copied to the right input channel.
; Smoothing       -  smoothing applied to changed made to the source location widget
; Delay Range     -  scale the range of delay times, essentially this is scaling the size of the size of the XY pad area
; Amp. Drop Off   -  amount of amplitude attenuation due to distance from the source
; Y Expand        -  scales (warps) the distance representation on the Y-axis only
;                     this can be useful if you want to have the ability to scale the amplitude dramatically 
;                     without losing a mix of both channels when the source widget is vertically level with the L/R indicators

; Filter On/Off   -  if activated, high-frequency loss due to distance from the source will be emulated
; Filter Drop-Off -  amount of high-frequency loss due to distance from the source

; Reverb On/Off   -  turn on or off the addition of a reverb effect.
;                    note that reverb level will be unaffected by distance from the two speaker widgets 
;                     so a sense of receding into the distance can be induced by moving the source widget vertically 
;                     away from the level of the two speakers. This can be exaggerated by increasing 'Y Expand'
; Level           -  send level to the reverb module
; Size            -  reverb decay time
; Damping         -  cutoff frequency of a low-pass filter within the delay algorithm
; Y to Dry/Wet    - if this button is activated, y distance above or below the level of the speakers will also control the dry/wet level of signal sent to the reverb.
;                    This means that if the source widget is vertically level with the speakers, then there will be no reveberated signal
;                    When the source widget is level with the upper or lower boundaries, then the maximum reverb send level will be applied.

; Dry Level       - ratio of the dry signal that will be mixed back into the output. This will be the mono (left channel if stereo) input sent to both channels
; OPEN FILE       - open a file for the input
; PLAY            - playback file


<Cabbage>
form caption("Spatial Expander") size( 910,515), pluginId("SpEx"), guiMode("queue"), colour(40,40,40)

; XY panel
image bounds(  0, 0,400,400), colour(50,50,50), channel("panel"), outlineThickness(1) ; xy panel

; speakers
label    bounds(  0,192, 16, 16), channel("Spk1"), alpha(0.5), text("L"), fontColour("Black"), colour("White")
label    bounds(384,192, 16, 16), channel("Spk2"), alpha(0.5), text("R"), fontColour("Black"), colour("White")

image bounds(193,192,16,16), colour("White"), shape("ellipse"), channel("widget"), alpha(0.5)     ; panning widget

; delay times
image bounds(410, 10,165, 65) colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
{
label    bounds(  0,  3,160, 15), text("DELAY TIMES (ms)")
nslider  bounds(  5, 20, 70, 35), channel("Del1"), range(0,1000,50,1,.1), text("Delay L")
nslider  bounds( 90, 20, 70, 35), channel("Del2"), range(0,1000,50,1,.1), text("Delay R")
}

; amplitudes
image bounds(585, 10,165, 65) colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
{
label    bounds(  0,  3,160, 15), text("AMPLITUDES (dB)")
nslider  bounds(  5, 20, 70, 35), channel("Amp1"), range(-36,36,0,1,0.1), text("Amp L")
nslider  bounds( 90, 20, 70, 35), channel("Amp2"), range(-36,36,0,1,0.1), text("Amp R")
}

; meters
image   bounds(760, 10,140, 65), colour(0,0,0,0), outlineThickness(1)
{
label   bounds(  0,  3,140, 14), text("OUTPUT METERS")
vmeter  bounds( 25, 19, 40, 30) channel("VUMeter1") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 70, 19, 40, 30) channel("VUMeter2") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
label   bounds( 25, 51, 40, 12), text("LEFT"), align("centre")
label   bounds( 70, 51, 40, 12), text("RIGHT"), align("centre")
}

; controls
image    bounds(410, 85,490,325), colour(0,0,0,0) ;, outlineThickness(1)
{
checkbox bounds(  5,  0,100, 15), channel("InvertDelays"), value(0), text("Invert Delays")
checkbox bounds(115,  0,100, 15), channel("MonoOut"), value(0), text("Mono Out")
optionbutton bounds(220,  0, 80, 15) channel("MonoStereoIn"), items("Mono In", "Stereo In")
hslider  bounds(  0, 20,490, 20), channel("Smoothing"), text("Smoothing"), range(0.01,0.3,0.05,0.5,0.0001), valueTextBox(1)
hslider  bounds(  0, 45,490, 20), channel("DelRange"), text("Delay Range"), range(1, 60,10,1,0.1), valueTextBox(1)
hslider  bounds(  0, 70,490, 20), channel("AmpDropOff"), text("Amp.Drop-Off"), range(0, 24, 3,1,0.1), valueTextBox(1)
hslider  bounds(  0, 95,490, 20), channel("YExpand"), text("Y Expand"), range(1, 10, 1), valueTextBox(1)

 image    bounds(  0,125,490, 65), colour(0,0,0,0), outlineColour("silver"), outlineThickness(1), corners(5)
 {
 checkbox bounds(  5, 10,100, 15), channel("FilterOnOff"), value(0), text("Filter On/Off")
 hslider  bounds(  5, 35,480, 20), channel("FilterDropOff"), text("Filter Drop-Off"), range(0, 8, 1, 1, 0.01), valueTextBox(1)
 }

 ; reverb
 image bounds(  0,200,490, 85) colour(0,0,0,0), outlineColour("silver"), outlineThickness(1), corners(5)
 {
  checkbox bounds(  5, 10,110, 15), channel("ReverbOnOff"), value(0), text("Reverb On/Off")
  rslider  bounds(105,  5, 70, 70), channel("RvbSend"), text("Level"), range(0, 1, 0.03, 0.5, 0.01), valueTextBox(1)
  rslider  bounds(165,  5, 70, 70), channel("RvbSize"), text("Size"),  range(0.4, 1, 0.88, 2, 0.01), valueTextBox(1)
  rslider  bounds(225,  5, 70, 70), channel("RvbCF"), text("Damping"),  range(200, 20000, 12000, 0.5, 1), valueTextBox(1)
  checkbox bounds(305, 30,100, 15), channel("YToRvb"), value(0), text("Y to Dry/Wet")

 }
 
 hslider  bounds(  0,295,490, 20), channel("DryLevel"), text("Dry Level"), range(0, 1, 0, 0.5), valueTextBox(1)

}


; file player
image bounds( 10,410,890, 85) colour(0,0,0,0), outlineColour("silver"), outlineThickness(1), corners(5)
{
filebutton bounds(  5, 10, 70, 20), text("OPEN FILE","OPEN FILE"), fontColour("white") channel("filename")
button     bounds( 85, 10, 70, 20), text("PLAY","PLAY"), fontColour("white") channel("Play"), latched(1), colour:0(10,55,10), colour:1(70,200,70)
soundfiler bounds(  5, 35,880, 45), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 15, 38,880, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
}

label      bounds(  5,500,110, 12), text("Iain McCurdy |2025|"), align("left")

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


instr 1
 ; load file from browse
 gSfilepath     cabbageGetValue    "filename"    ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then                ; call instrument to update waveform viewer  
  event "i",99,0,0
 endif 
 
 gkPlay cabbageGetValue "Play"
 if trigger:k(gkPlay,0.5,0) == 1 then
  event "i",101,0,3600
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
 kX               =               kWidgX / (iPanelWid - (iWidgRad * 2))
 kY               =               kWidgY / (iPanelHei - (iWidgRad * 2))
 ; expand to bipolar
 kX               =               (kX * 2) - 1
 kY               =               ((kY * 2) - 1) * (-1)
                 cabbageSetValue  "XSlid", kX, changed:k(kX) ; move sliders (needed for write automation in DAW)
                 cabbageSetValue  "YSlid", kY, changed:k(kY)

 ; apply portamento smoothing to changes made to the location or to the source sound widget
 kramp           linseg           0, 0.001, 1
 kporttime       =                kramp * cabbageGetValue("Smoothing")
 kX              portk            kX, kporttime
 kY              portk            kY, kporttime
 
 ; speaker locations (normalised 0 to -1)
 kX1             =                -1
 kY1             =                0
 kX2             =                1
 kY2             =                0
 
 ; calculate distances between source sound location and each speaker 
 kYExpand        cabbageGetValue  "YExpand"
 kDist1          =                sqrt( (kX1 - kX)^2 + (kY1 - (kY*kYExpand))^2 ) 
 kDist2          =                sqrt( (kX2 - kX)^2 + (kY2 - (kY*kYExpand))^2 ) 
 
 ; raw Y displacements from speaker positions
 kYDisp1         =                abs(kY - kY1)
 kYDisp2         =                abs(kY - kY2)
 
 ; calulcate delay times for each speaker
 kDelRange       cabbageGetValue  "DelRange"
 kDelRange       portk            kDelRange,kporttime
 kDel1           =                kDelRange * kDist1
 kDel2           =                kDelRange * kDist2
 
 ; send delay times to number boxes
                 cabbageSetValue  "Del1", kDel1
                 cabbageSetValue  "Del2", kDel2
 
 ; sound file playback
 kMonoStereoIn    cabbageGetValue  "MonoStereoIn"
 if gkPlay==1 then
   aInL           =                gaFileL
   aInR           =                gaFileR
 else 
   aInL,aInR      ins
 endif
 if kMonoStereoIn==0 then
  aInR            =                aInL
 endif

 ; implement Haas delays
 iMaxDel = 200
 a1              vdelay3          aInL, a(kDel1), iMaxDel
 a2              vdelay3          aInR, a(kDel2), iMaxDel
 
 ; calculate amplitude attenuations
 kAmpDropOff     cabbageGetValue  "AmpDropOff"
 kAmp1           =                -kAmpDropOff * (kDist1 * 2)
 kAmp2           =                -kAmpDropOff * (kDist2 * 2)
 
 ; print amplitude attenuations to GUI
                 cabbageSetValue  "Amp1",kAmp1,changed:k(kAmp1)
                 cabbageSetValue  "Amp2",kAmp2,changed:k(kAmp2)
 
 ; create reverb send signals before amplitude attenuation
 aRS1            =                a1
 aRS2            =                a2
 
 ; apply amplitude attenuations
 a1              *=               ampdbfs(kAmp1)
 a2              *=               ampdbfs(kAmp2)
 
 ; high-frequency drop off
 kFilterOnOff    cabbageGetValue  "FilterOnOff"
 kFilterDropOff  cabbageGetValue  "FilterDropOff"
 if kFilterOnOff==1 then
  a1             tone             a1, cpsoct( limit:k( (14 - (kDist1 * kFilterDropOff)), 4, 14))
  a2             tone             a2, cpsoct( limit:k( (14 - (kDist2 * kFilterDropOff)), 4, 14))
 endif
 
 
 ; reverb
 kReverbOnOff    cabbageGetValue  "ReverbOnOff"
 if kReverbOnOff==1 then
  kRvbSend       cabbageGetValue  "RvbSend"
  kRvbSize       cabbageGetValue  "RvbSize"
  kRvbCF         cabbageGetValue  "RvbCF"
  kYToRvb        cabbageGetValue  "YToRvb"
  kRvbSend       =                kYToRvb == 1 ? kRvbSend * kYDisp1 : kRvbSend
  aR1,aR2        reverbsc         aRS1 * kRvbSend, aRS2 * kRvbSend, kRvbSize, kRvbCF
  a1             +=               aR1
  a2             +=               aR2
 endif

 ; output
 kDryLevel       cabbageGetValue "DryLevel"
 kInvertDelays   =               (cabbageGetValue:k("InvertDelays") * (-2)) + 1 ; -1 when activated, otherwise 1
 
 kMonoOut        cabbageGetValue "MonoOut"
 if kMonoOut==1 then
                 outall            ((a1+a2)*kInvertDelays) + (aInL+aInR)*kDryLevel
 else
                 outs            (a1*kInvertDelays) + aInL*kDryLevel, (a2*kInvertDelays) + aInR*kDryLevel
 endif
 
 aIn             =               0                         ; clear audio variables

 ; meters
 kUpdate         metro            30                       ; rate up update of the VU meters
 #define meter(N)
 #
 ; L meter
 kres$N          init             0
 kres$N          limit            kres$N-0.001, 0, 1 
 kres$N          peak             a$N
 kres$N          lagud            kres$N, 0.001, 0.001                            
                 cabbageSetValue  "VUMeter$N", kres$N, kUpdate
 #
 $meter(1)
 $meter(2)


endin




; LOAD SOUND FILE
instr    99
 giSource         =               0
                  cabbageSet      "filer1", "file", gSfilepath
 gkNChans         init            filenchnls:i(gSfilepath)
 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet      "FileName","text",SFileNoExtension
endin

; play sound file
instr 101
if gkPlay==0 then
 turnoff
endif
if i(gkNChans)==1 then
 gaFileL          diskin2         gSfilepath, 1, 0, 1
 gaFileR          =               gaFileL
else
 gaFileL,gaFileR  diskin2         gSfilepath, 1, 0, 1
endif
endin


</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
