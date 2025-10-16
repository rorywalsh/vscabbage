
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; HaasTiltOcto
; Written by Iain McCurdy, 2024

; A delay time is calculated for each of 8 speakers based on how far away each is from a movable source sound widget.
; All delays, and effectively the size of the arena, can be scaled using the Delay Range slider.
; Amplitude scaling according to distance can also be applied, controlled using the Amp Drop-Off slider.

; In the main arena the user can move the white source sound location widget.
; (The numbered speakers are moved using the number boxes)

; The 'DELAY TIMES (ms)' box contains eight number boxes which display the delay time applied at each speaker.
;  These are for display only.

; The 'AMPLITUDE (dB)' box contains eight number boxes which display the amplitude attenuation applied at each speaker.
;  These are for display only.

; The "SPEAKER LOCATIONS' box contains sixteen number boxes which define the location of each of the eight speakers.
;  These can be adjusted by the user.
;  The values are dimensionless references to locations within the area. The visible arena covers a range of -1 to 1
;  on both axes.

; INPUT        -   choose between Mono in which the left/first input channel is send to all speakers,
;                   Stereo in which the left input channel is sent to speakers 1, 3, 5 and 7 and the right input channel
;                   is sent to speakers 2, 4, 6 and 8, or a test beeper.

; Smoothing    -   defines an amount of portamento smoothing that is applied to movements of the source sound 
;                   location widget. 

; Delay Range  -   this scales the delay times at all speakers and an understanding of the size of the arena.

; Amp Drop Off -   this scales the rate of amplitude attenuation as a result of distance at all speakers.

<Cabbage>
form caption("Haas Tilt Octophonic") size(1170,420), pluginId("Spt8"), guiMode("queue"), colour(40,40,40)

; XY panel
image bounds(  0, 0,400,400), colour(50,50,50), channel("panel"), outlineThickness(1) ; xy panel

; speakers
label    bounds(-100,  0, 16, 16), channel("Spk1"), alpha(0.5), text("1"), fontColour("Black"), colour("White")
label    bounds(-100,  0, 16, 16), channel("Spk2"), alpha(0.5), text("2"), fontColour("Black"), colour("White")
label    bounds(-100,125, 16, 16), channel("Spk3"), alpha(0.5), text("3"), fontColour("Black"), colour("White")
label    bounds(-100,125, 16, 16), channel("Spk4"), alpha(0.5), text("4"), fontColour("Black"), colour("White")
label    bounds(-100,259, 16, 16), channel("Spk5"), alpha(0.5), text("5"), fontColour("Black"), colour("White")
label    bounds(-100,259, 16, 16), channel("Spk6"), alpha(0.5), text("6"), fontColour("Black"), colour("White")
label    bounds(-100,384, 16, 16), channel("Spk7"), alpha(0.5), text("7"), fontColour("Black"), colour("White")
label    bounds(-100,384, 16, 16), channel("Spk8"), alpha(0.5), text("8"), fontColour("Black"), colour("White")

image bounds(193,192,16,16), colour("White"), shape("ellipse"), channel("widget"), alpha(0.5)     ; panning widget


; delay times
image bounds(410, 10,165,185) colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
{
label    bounds(  0,  3,160, 15), text("DELAY TIMES (ms)")
nslider  bounds(  5, 20, 70, 35), channel("Del1"), range(0,1000,50,1,.1), text("Delay 1")
nslider  bounds( 90, 20, 70, 35), channel("Del2"), range(0,1000,50,1,.1), text("Delay 2")
nslider  bounds(  5, 60, 70, 35), channel("Del3"), range(0,1000,50,1,.1), text("Delay 3")
nslider  bounds( 90, 60, 70, 35), channel("Del4"), range(0,1000,50,1,.1), text("Delay 4")
nslider  bounds(  5,100, 70, 35), channel("Del5"), range(0,1000,50,1,.1), text("Delay 5")
nslider  bounds( 90,100, 70, 35), channel("Del6"), range(0,1000,50,1,.1), text("Delay 6")
nslider  bounds(  5,140, 70, 35), channel("Del7"), range(0,1000,50,1,.1), text("Delay 7")
nslider  bounds( 90,140, 70, 35), channel("Del8"), range(0,1000,50,1,.1), text("Delay 8")
}

; amplitudes
image bounds(585, 10,165,185) colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
{
label    bounds(  0,  3,160, 15), text("AMPLITUDES (dB)")
nslider  bounds(  5, 20, 70, 35), channel("Amp1"), range(-36,36,0,1,0.1), text("Amp 1")
nslider  bounds( 90, 20, 70, 35), channel("Amp2"), range(-36,36,0,1,0.1), text("Amp 2")
nslider  bounds(  5, 60, 70, 35), channel("Amp3"), range(-36,36,0,1,0.1), text("Amp 3")
nslider  bounds( 90, 60, 70, 35), channel("Amp4"), range(-36,36,0,1,0.1), text("Amp 4")
nslider  bounds(  5,100, 70, 35), channel("Amp5"), range(-36,36,0,1,0.1), text("Amp 5")
nslider  bounds( 90,100, 70, 35), channel("Amp6"), range(-36,36,0,1,0.1), text("Amp 6")
nslider  bounds(  5,140, 70, 35), channel("Amp7"), range(-36,36,0,1,0.1), text("Amp 7")
nslider  bounds( 90,140, 70, 35), channel("Amp8"), range(-36,36,0,1,0.1), text("Amp 8")
}

; speaker locations
image bounds(410,200,340,190), colour(0,0,0,0), outlineThickness(1), outlineColour("silver")
{
label    bounds(  0,  3,340, 15), text("SPEAKER LOCATIONS")
nslider  bounds(  5, 25, 70, 35), channel("X1"), range(-1,1,-1,1,.01), text("Spk.1 X")
nslider  bounds( 85, 25, 70, 35), channel("Y1"), range(-1,1,1,1,.01), text("Spk.1 Y")
nslider  bounds(185, 25, 70, 35), channel("X2"), range(-1,1,1,1,.01), text("Spk.2 X")
nslider  bounds(265, 25, 70, 35), channel("Y2"), range(-1,1,1,1,.01), text("Spk.2 Y")
nslider  bounds(  5, 65, 70, 35), channel("X3"), range(-1,1,-1,1,.01), text("Spk.3 X")
nslider  bounds( 85, 65, 70, 35), channel("Y3"), range(-1,1,0.333,1,.01), text("Spk.3 Y")
nslider  bounds(185, 65, 70, 35), channel("X4"), range(-1,1,1,1,.01), text("Spk.4 X")
nslider  bounds(265, 65, 70, 35), channel("Y4"), range(-1,1,0.333,1,.01), text("Spk.4 Y")
nslider  bounds(  5,105, 70, 35), channel("X5"), range(-1,1,-1,1,.01), text("Spk.5 X")
nslider  bounds( 85,105, 70, 35), channel("Y5"), range(-1,1,-0.333,1,.01), text("Spk.5 Y")
nslider  bounds(185,105, 70, 35), channel("X6"), range(-1,1,1,1,.01), text("Spk.6 X")
nslider  bounds(265,105, 70, 35), channel("Y6"), range(-1,1,-0.333,1,.01), text("Spk.6 Y")
nslider  bounds(  5,145, 70, 35), channel("X7"), range(-1,1,-1,1,.01), text("Spk.7 X")
nslider  bounds( 85,145, 70, 35), channel("Y7"), range(-1,1,-1,1,.01), text("Spk.7 Y")
nslider  bounds(185,145, 70, 35), channel("X8"), range(-1,1,1,1,.01), text("Spk.8 X")
nslider  bounds(265,145, 70, 35), channel("Y8"), range(-1,1,-1,1,.01), text("Spk.8 Y")
}

image    bounds(770, 15,390,205), colour(0,0,0,0)
{
label    bounds(  0,  0, 80, 14), text("INPUT")
combobox bounds(  0, 15, 80, 20), channel("MonoStereo"), items("Mono","Stereo","Beeper"), value(1) 

hslider  bounds(  0, 55,390, 20), channel("Smoothing"), text("Smoothing"), range(0.01,0.3,0.05,0.5,0.0001), valueTextBox(1)
hslider  bounds(  0, 85,390, 20), channel("DelRange"), text("Delay Range"), range(1, 60,10,1,0.1), valueTextBox(1)
hslider  bounds(  0,115,390, 20), channel("AmpDropOff"), text("Amp.Drop-Off"), range(-3, 24, 3,1,0.1), valueTextBox(1)
checkbox bounds(  0,155,100, 15), channel("FilterOnOff"), value(0), text("Filter On/Off")
hslider  bounds(  0,185,390, 20), channel("FilterDropOff"), text("Filter Drop-Off"), range(0, 8, 1, 1, 0.01), valueTextBox(1)
}

; meters
image   bounds(770,230,140, 67), colour(0,0,0,0), outlineThickness(1)
{
label   bounds(  0,  3,140, 14), text("OUTPUT METERS")
vmeter  bounds( 10, 23, 10, 30) channel("VUMeter1") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 25, 23, 10, 30) channel("VUMeter2") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 40, 23, 10, 30) channel("VUMeter3") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 55, 23, 10, 30) channel("VUMeter4") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 70, 23, 10, 30) channel("VUMeter5") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 85, 23, 10, 30) channel("VUMeter6") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds(100, 23, 10, 30) channel("VUMeter7") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds(115, 23, 10, 30) channel("VUMeter8") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
label   bounds( 10, 53, 10, 12), text("1")
label   bounds( 25, 53, 10, 12), text("2")
label   bounds( 40, 53, 10, 12), text("3")
label   bounds( 55, 53, 10, 12), text("4")
label   bounds( 70, 53, 10, 12), text("5")
label   bounds( 85, 53, 10, 12), text("6")
label   bounds(100, 53, 10, 12), text("7")
label   bounds(115, 53, 10, 12), text("8")
}

image bounds(770,315,390,200) colour(0,0,0,0)
{
filebutton bounds(  0,  0, 70, 20), text("Open File","Open File"), fontColour("white") channel("filename")
button     bounds( 80,  0, 70, 20), text("PLAY","PLAY"), fontColour("white") channel("Play"), latched(1), colour:0(10,55,10), colour:1(70,200,70)
soundfiler bounds(  0, 25,390, 50), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 10, 28,390, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
}

label      bounds(  5,405,110, 12), text("Iain McCurdy |2024|"), align("left")

</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-n -d -m0
</CsOptions>
<CsInstruments>

ksmps  = 64
nchnls = 8
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
  kX = kWidgX / (iPanelWid - (iWidgRad * 2))
  kY = kWidgY / (iPanelHei - (iWidgRad * 2))
  ; expand to bipolar
  kX = (kX * 2) - 1
  kY = ((kY * 2) - 1) * (-1)
                 cabbageSetValue   "XSlid", kX, changed:k(kX) ; move sliders (needed for write automation in DAW)
                 cabbageSetValue   "YSlid", kY, changed:k(kY)

 ; consider replacing with arrays
 ;kXSp[] init 8
 ;kYSp[] init 8
 ;kDist[] init 8
 
 ; speaker locations
 kX1 cabbageGetValue "X1"
 kY1 cabbageGetValue "Y1"
 kX2 cabbageGetValue "X2"
 kY2 cabbageGetValue "Y2"
 kX3 cabbageGetValue "X3"
 kY3 cabbageGetValue "Y3"
 kX4 cabbageGetValue "X4"
 kY4 cabbageGetValue "Y4"
 kX5 cabbageGetValue "X5"
 kY5 cabbageGetValue "Y5"
 kX6 cabbageGetValue "X6"
 kY6 cabbageGetValue "Y6"
 kX7 cabbageGetValue "X7"
 kY7 cabbageGetValue "Y7"
 kX8 cabbageGetValue "X8"
 kY8 cabbageGetValue "Y8"
 
 ; move speaker widgets
 cabbageSet changed:k(kX1,kY1),"Spk1","bounds",(kX1+1)*0.5*384,(-kY1+1)*0.5*384, 16, 16
 cabbageSet changed:k(kX2,kY2),"Spk2","bounds",(kX2+1)*0.5*384,(-kY2+1)*0.5*384, 16, 16
 cabbageSet changed:k(kX3,kY3),"Spk3","bounds",(kX3+1)*0.5*384,(-kY3+1)*0.5*384, 16, 16
 cabbageSet changed:k(kX4,kY4),"Spk4","bounds",(kX4+1)*0.5*384,(-kY4+1)*0.5*384, 16, 16
 cabbageSet changed:k(kX5,kY5),"Spk5","bounds",(kX5+1)*0.5*384,(-kY5+1)*0.5*384, 16, 16
 cabbageSet changed:k(kX6,kY6),"Spk6","bounds",(kX6+1)*0.5*384,(-kY6+1)*0.5*384, 16, 16
 cabbageSet changed:k(kX7,kY7),"Spk7","bounds",(kX7+1)*0.5*384,(-kY7+1)*0.5*384, 16, 16
 cabbageSet changed:k(kX8,kY8),"Spk8","bounds",(kX8+1)*0.5*384,(-kY8+1)*0.5*384, 16, 16
 
 ; apply portamento smoothing to changes made to the location of the source sound widget
 kramp  linseg 0,0.001,1
 kporttime = kramp * cabbageGetValue("Smoothing")
 kX  portk  kX, kporttime
 kY  portk  kY, kporttime
 
 ; calculation distances between source sound location and each speaker
 kDist1 = sqrt( (kX1 - kX)^2 + (kY1 - kY)^2 ) 
 kDist2 = sqrt( (kX2 - kX)^2 + (kY2 - kY)^2 ) 
 kDist3 = sqrt( (kX3 - kX)^2 + (kY3 - kY)^2 ) 
 kDist4 = sqrt( (kX4 - kX)^2 + (kY4 - kY)^2 ) 
 kDist5 = sqrt( (kX5 - kX)^2 + (kY5 - kY)^2 ) 
 kDist6 = sqrt( (kX6 - kX)^2 + (kY6 - kY)^2 ) 
 kDist7 = sqrt( (kX7 - kX)^2 + (kY7 - kY)^2 ) 
 kDist8 = sqrt( (kX8 - kX)^2 + (kY8 - kY)^2 ) 
 
 ; calculate delay times for each speaker
 kDelRange cabbageGetValue "DelRange"
 kDelRange portk  kDelRange,kporttime
 kDel1  =  kDelRange * kDist1
 kDel2  =  kDelRange * kDist2
 kDel3  =  kDelRange * kDist3
 kDel4  =  kDelRange * kDist4
 kDel5  =  kDelRange * kDist5
 kDel6  =  kDelRange * kDist6
 kDel7  =  kDelRange * kDist7
 kDel8  =  kDelRange * kDist8
 
 ; send delay times to number boxes
 cabbageSetValue "Del1", kDel1
 cabbageSetValue "Del2", kDel2
 cabbageSetValue "Del3", kDel3
 cabbageSetValue "Del4", kDel4
 cabbageSetValue "Del5", kDel5
 cabbageSetValue "Del6", kDel6
 cabbageSetValue "Del7", kDel7
 cabbageSetValue "Del8", kDel8 
 
 kMonoStereo cabbageGetValue "MonoStereo"
 
 if kMonoStereo==1 then ; mono
  aL inch 1
 else                   ; stereo
  aL,aR ins
 endif
 
 ; sound file playback
 if gkPlay==1 then
   aL = gaFileL
   aR = kMonoStereo == 1 ? aL : gaFileR ; mono stereo switch
   gaFileL = 0 ; clear audio variables
   gaFileR = 0   
 endif

 iMaxDel = 200
 a1     vdelay3 aL, a(kDel1), iMaxDel
 a2     vdelay3 aR, a(kDel2), iMaxDel
 a3     vdelay3 aL, a(kDel3), iMaxDel
 a4     vdelay3 aR, a(kDel4), iMaxDel
 a5     vdelay3 aL, a(kDel5), iMaxDel
 a6     vdelay3 aR, a(kDel6), iMaxDel
 a7     vdelay3 aL, a(kDel7), iMaxDel
 a8     vdelay3 aR, a(kDel8), iMaxDel
 
 ; amplitude drop-off
 kAmpDropOff cabbageGetValue "AmpDropOff"
 kAmp1     =     -kAmpDropOff * (kDist1 * 2)
 kAmp2     =     -kAmpDropOff * (kDist2 * 2)
 kAmp3     =     -kAmpDropOff * (kDist3 * 2)
 kAmp4     =     -kAmpDropOff * (kDist4 * 2)
 kAmp5     =     -kAmpDropOff * (kDist5 * 2)
 kAmp6     =     -kAmpDropOff * (kDist6 * 2)
 kAmp7     =     -kAmpDropOff * (kDist7 * 2)
 kAmp8     =     -kAmpDropOff * (kDist8 * 2)

 cabbageSetValue "Amp1",kAmp1,changed:k(kAmp1)
 cabbageSetValue "Amp2",kAmp2,changed:k(kAmp2)
 cabbageSetValue "Amp3",kAmp3,changed:k(kAmp3)
 cabbageSetValue "Amp4",kAmp4,changed:k(kAmp4)
 cabbageSetValue "Amp5",kAmp5,changed:k(kAmp5)
 cabbageSetValue "Amp6",kAmp6,changed:k(kAmp6)
 cabbageSetValue "Amp7",kAmp7,changed:k(kAmp7)
 cabbageSetValue "Amp8",kAmp8,changed:k(kAmp8)
 
 a1     *=     ampdbfs(kAmp1)
 a2     *=     ampdbfs(kAmp2)
 a3     *=     ampdbfs(kAmp3)
 a4     *=     ampdbfs(kAmp4)
 a5     *=     ampdbfs(kAmp5)
 a6     *=     ampdbfs(kAmp6)
 a7     *=     ampdbfs(kAmp7)
 a8     *=     ampdbfs(kAmp8)

kFilterOnOff   cabbageGetValue "FilterOnOff"
kFilterDropOff cabbageGetValue "FilterDropOff"
if kFilterOnOff==1 then
 a1     tone   a1, cpsoct( limit:k( (14 - (kDist1 * kFilterDropOff)), 4, 14))
 a2     tone   a2, cpsoct( limit:k( (14 - (kDist2 * kFilterDropOff)), 4, 14))
 a3     tone   a3, cpsoct( limit:k( (14 - (kDist3 * kFilterDropOff)), 4, 14))
 a4     tone   a4, cpsoct( limit:k( (14 - (kDist4 * kFilterDropOff)), 4, 14))
 a5     tone   a5, cpsoct( limit:k( (14 - (kDist5 * kFilterDropOff)), 4, 14))
 a6     tone   a6, cpsoct( limit:k( (14 - (kDist6 * kFilterDropOff)), 4, 14))
 a7     tone   a7, cpsoct( limit:k( (14 - (kDist7 * kFilterDropOff)), 4, 14))
 a8     tone   a8, cpsoct( limit:k( (14 - (kDist8 * kFilterDropOff)), 4, 14))
endif

;        outs    a1, a2
        outo    a1, a2, a3, a4, a5, a6, a7, a8


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
$meter(3)
$meter(4)
$meter(5)
$meter(6)
$meter(7)
$meter(8)

endin




; LOAD SOUND FILE
instr    99
 giSource       =                           0
                cabbageSet                  "filer1", "file", gSfilepath
 gkNChans       init                        filenchnls:i(gSfilepath)
 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet                "FileName","text",SFileNoExtension
endin

; play sound file
instr 101
if gkPlay==0 then
 turnoff
endif
if i(gkNChans)==1 then
 gaFileL         diskin2 gSfilepath,1,0,1
else
 gaFileL,gaFileR diskin2 gSfilepath,1,0,1
endif
endin


</CsInstruments>

<CsScore>
i1 0 [60*60*24*7] 
</CsScore>

</CsoundSynthesizer>
