
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Vector-Based Amplitude Panning for Octophonic Surround
; Written by Iain McCurdy, 2024

; INTENDED FOR USE WITH AN OCTOPHONIC RING OF SPEAKERS
; WILL NOT WORK WITH HARDWARE THAT OFFERS FEWER THAN 8 CHANNELS

; The location widget (white circle) can be moved using the mouse.
; This represents the location of the source sound.

; Azim.1 - Azim.8   -   azimith angles of the eight speakers.
; < > (ROTATE)      -   the entire ring of speakers can be rotated together using the neighbouring arrow buttons.
; Width             -   width of the ring
; Spread            -   this is part of the vbap opcode and controls the amount of 'spill' between speakers
;                        with a value of 0, there will be complete isolation between speakers (this is not affected by Spread)
;                        a value of 100 means there will be no isolation between speakers, 100% spill
; Scale             -   this scales the complete physical area shown by the square panel.
;                        effectively it varies the rate of amplitude drop-off as the location widget moves away from the ring,
;                        either inwards or outwards. Again Spread remains independent.
; Input             -   choose an input, either live input from the left/first input channel or a test beeper.
; Control           -   choose from one of three modes of control:
;                       1. Mouse - simply click and drag in the square panel
;                       2. LFO - the location widget is moved according to settings made in the LFO panel 
;                       3. Sliders - the XY position of the widget is moved using the long sliders along two of the edges of the panel.
;                        this third method is used if modulation of the widget location using hardware sliders is desired.
;                        note that these sliders are also moved by the Mouse and LFO modes 
;                        and this is useful if you want to capture location widget movements 
;                        as automation within a DAW.
;                        Note that these sliders can extend beyond the scope of the GUI panel. 
;                        If you 'lose' a slider, double click it to return it to its default location.
; 1 - 8 (meters)    -    outputs levels being sent to each of the eight outputs. Useful for troubleshooting.
;
; Doppler (check box) - on/off for a doppler shift effect applied according to movement of the location widget in relation to each speaker
; Dop.Scale         -  scaling control for the amount of doppler shift

; LFO
; Shape             -    choose LFO shape from one of three options:
;                       1. Ellipse
;                       2. Random 1 (smoothing interpoating random movements)
;                       3. Random 2 (random jumping to new locations)
; Rate              -   Speed of LFO. Negative values implies backwards movements
; Amp.X / Amp.Y     -   amplitudes of the LFO in the X and Y directions. If these are the same and shape is Ellipse, movement will be in a circle
; LINK (between amps) - this can be activated to facilitate synced movement between Amp.X and Amp.Y.
; X Offset / Y Offset - fixed shift of any of the LFO shapes in the X and Y directions.
; LINK (between offsets) - similarly these controls can be linked and synced

<Cabbage>
form caption("Vector-Based Amplitude Panning for Octophonic Surround") size(820,492), pluginId("gui1"), guiMode("queue"), colour(40,40,40)

; XY panel
image bounds(  0, 0,400,400), colour(40,40,40), channel("panel"), outlineThickness(1) ; xy panel

; LABEL
label bounds(  0,120,400,160), text("VBAP"), fontColour("white"), alpha(0.02), colour(0,0,0,0)

; speakers
label    bounds(-100,192, 16, 16), channel("Spk1"), alpha(0.5), text("1"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk2"), alpha(0.5), text("2"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk3"), alpha(0.5), text("3"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk4"), alpha(0.5), text("4"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk5"), alpha(0.5), text("5"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk6"), alpha(0.5), text("6"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk7"), alpha(0.5), text("7"), fontColour("white"), colour("Blue")
label    bounds(-100,192, 16, 16), channel("Spk8"), alpha(0.5), text("8"), fontColour("white"), colour("Blue")

; location  widget
image bounds(193,192,16,16), colour("White"), shape("ellipse"), channel("widget"), alpha(0.4)     ; panning widget

; blanking panels
image    bounds(400,  0,420,420), colour(40,40,40)

; xy sliders
hslider  bounds(-200, 405,800, 10), channel("XSlid"), range(-2,2,0)
vslider  bounds( 405,-200, 10,800), channel("YSlid"), range(-2,2,0)

; blanking panels
image    bounds(415,400,820,100), colour(40,40,40)
image    bounds(  0,415,820,100), colour(40,40,40)

nslider bounds(425,  5, 70, 30), channel("azim1"), text("Azim.1"), range(-360,360,-22.5)
nslider bounds(500,  5, 70, 30), channel("azim2"), text("Azim.2"), range(-360,360,22.5)
nslider bounds(575,  5, 70, 30), channel("azim3"), text("Azim.3"), range(-360,360,-67.5)
nslider bounds(650,  5, 70, 30), channel("azim4"), text("Azim.4"), range(-360,360,67.5)
nslider bounds(425, 45, 70, 30), channel("azim5"), text("Azim.5"), range(-360,360,-112.5)
nslider bounds(500, 45, 70, 30), channel("azim6"), text("Azim.6"), range(-360,360,112.5)
nslider bounds(575, 45, 70, 30), channel("azim7"), text("Azim.7"), range(-360,360,-157.5)
nslider bounds(650, 45, 70, 30), channel("azim8"), text("Azim.8"), range(-360,360,157.5)

label   bounds(740, 20, 51, 13), text("ROTATE"), align("centre")
button  bounds(740, 35, 25, 25), channel("DecrAz"), text("<"), latched(0)
button  bounds(767, 35, 25, 25), channel("IncrAz"), text(">"), latched(0)

hslider  bounds(425, 90,390, 15), channel("width"), text("Width"), range(0,1,0.5), valueTextBox(1)
hslider  bounds(425,120,390, 15), channel("spread"), text("Spread"), range(0,100,0,1,1), valueTextBox(1)
hslider  bounds(425,150,390, 15), channel("scale"), text("Scale"), range(0,92,24,1,1), valueTextBox(1)

label    bounds(430,185, 70, 13), text("CONTROL"), align("centre")
combobox bounds(430,200, 70, 20), items("Mouse","LFO","Sliders"), channel("control"), value(1)

; meters
image   bounds(590,190,135, 42), colour(0,0,0,0)
{
vmeter  bounds(  0,  0, 10, 30) channel("VUMeter1") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 15,  0, 10, 30) channel("VUMeter2") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 30,  0, 10, 30) channel("VUMeter3") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 45,  0, 10, 30) channel("VUMeter4") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 60,  0, 10, 30) channel("VUMeter5") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 75,  0, 10, 30) channel("VUMeter6") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 90,  0, 10, 30) channel("VUMeter7") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds(105,  0, 10, 30) channel("VUMeter8") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
label   bounds(  0, 30, 10, 12), text("1")
label   bounds( 15, 30, 10, 12), text("2")
label   bounds( 30, 30, 10, 12), text("3")
label   bounds( 45, 30, 10, 12), text("4")
label   bounds( 60, 30, 10, 12), text("5")
label   bounds( 75, 30, 10, 12), text("6")
label   bounds( 90, 30, 10, 12), text("7")
label   bounds(105, 30, 10, 12), text("8")
}

checkbox bounds(735,185, 70, 15), text("Doppler"), channel("DopOnOff"), range(1,50,1,0.5)
nslider  bounds(735,205, 60, 30), text("Dop.Scale"), channel("DopScale"), range(0.1,5,1,0.5)

; lfo controls
image    bounds(425,250,390,145), colour(0,0,0,0), channel("lfo"), outlineThickness(1), alpha(0.2)
{
label    bounds(  0,  5,390, 15), text("L F O")
label    bounds( 10,  5, 80, 13), text("SHAPE")
combobox bounds( 10, 20, 80, 20), channel("LFOType"), items("Ellipse","Random 1","Random 2"), value(1)
hslider  bounds(  0, 40,390, 15), channel("LFORateX"),  text("Rate X"), range(-8,8,1), valueTextBox(1)
button   bounds(  5, 57, 40, 12), channel("LFOLink0"), text("LINK"), colour:0(0,0,0), colour:1(150,150,50), fontColour:0(100,100,30), fontColour:1(255,255,150), latched(1) value(1)
hslider  bounds(  0, 70,390, 15), channel("LFORateY"),  text("Rate Y"), range(-8,8,1), valueTextBox(1)
hslider  bounds(  0, 90,190, 15), channel("LFOAmpX"), text("Amp.X"), range(-1,1,0.5), valueTextBox(1)
button   bounds(  5,107, 40, 12), channel("LFOLink"), text("LINK"), colour:0(0,0,0), colour:1(150,150,50), fontColour:0(100,100,30), fontColour:1(255,255,150), latched(1)
hslider  bounds(  0,120,190, 15), channel("LFOAmpY"), text("Amp.Y"), range(-1,1,0.5), valueTextBox(1)
hslider  bounds(200, 90,190, 15), channel("LFOXOffset"), text("X Offset"), range(-1,1,0), valueTextBox(1)
button   bounds(205,107, 40, 12), channel("LFOLink2"), text("LINK"), colour:0(0,0,0), colour:1(150,150,50), fontColour:0(100,100,30), fontColour:1(255,255,150), latched(1)
hslider  bounds(200,120,190, 15), channel("LFOYOffset"), text("Y Offset"), range(-1,1,0), valueTextBox(1)
}

; file player
image bounds( 10,420,800, 70) colour(0,0,0,0)
{
filebutton bounds(  0,  0, 70, 25), text("Open File","Open File"), fontColour("white") channel("filename")
button     bounds(  0, 30, 70, 25), text("PLAY","PLAY"), fontColour("white") channel("Play"), latched(1), colour:0(10,55,10), colour:1(70,200,70)
soundfiler bounds( 80,  0,730, 55), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 80,  3,690, 14), text(""), align(left), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
}

label      bounds( 10,478,690, 12), text("Iain McCurdy |2024|"), align("left")

</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-n -dm0
</CsOptions>
<CsInstruments>
ksmps  = 64
nchnls = 8
0dbfs  = 1

gkNChnls init 0
gaFileL,gaFileR init 0

instr 1

 ; load file from browse
 gSfilepath     cabbageGetValue    "filename"        ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then        ; call instrument to update waveform viewer  
  event "i",99,0,0
 endif 
 
 gkPlay cabbageGetValue "Play"
 if trigger:k(gkPlay,0.5,0) == 1 then
  event "i",101,0,3600
 endif

kcontrol  cabbageGetValue "control"

; show/hide LFO controls
kLFOAlpha[] fillarray 0,1,0 
cabbageSet changed:k(kcontrol),"lfo","alpha", 0.2 + ( kLFOAlpha[kcontrol-1] * 0.8 )

if kcontrol==1 then ; mouse control
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
  kX             =                 kWidgX / (iPanelWid - (iWidgRad * 2))
  kY             =                 kWidgY / (iPanelHei - (iWidgRad * 2))
  ; expand to bipolar
  kX             =                 (kX * 2) - 1
  kY             =                 ((kY * 2) - 1)  * (-1)
                 cabbageSetValue   "XSlid", kX, changed:k(kX) ; move sliders (needed for write automation in DAW)
                 cabbageSetValue   "YSlid", kY, changed:k(kY)
  kporttime      linseg            0,0.001,0.06
  kX             portk             kX, kporttime
  kY             portk             kY, kporttime


 elseif kcontrol==2 then ; lfo spinning

   kLFORateX,kT1  cabbageGetValue   "LFORateX"
   kLFORateY,kT2  cabbageGetValue   "LFORateY"
   kLFOLink0      cabbageGetValue   "LFOLink0"
   if kLFOLink0==1 then                                                   ; link durations
    cabbageSetValue "LFORateX",kLFORateY,kT2
    cabbageSetValue "LFORateY",kLFORateX,kT1
   endif

   kLFOAmpX,kT1   cabbageGetValue   "LFOAmpX"
   kLFOAmpY,kT2   cabbageGetValue   "LFOAmpY"
   kLFOLink       cabbageGetValue    "LFOLink"
   if kLFOLink==1 then                                                   ; link durations
    cabbageSetValue "LFOAmpX",kLFOAmpY,kT2
    cabbageSetValue "LFOAmpY",kLFOAmpX,kT1
   endif
   kLFOXOffset,kT1 cabbageGetValue   "LFOXOffset"
   kLFOYOffset,kT2 cabbageGetValue   "LFOYOffset"
   kLFOLink2       cabbageGetValue   "LFOLink2"
   if kLFOLink2==1 then                                                   ; link durations
    cabbageSetValue "LFOXOffset",kLFOYOffset,kT2
    cabbageSetValue "LFOYOffset",kLFOXOffset,kT1
   endif
   kLFOType       cabbageGetValue   "LFOType"
   
   if kLFOType==1 then ; ellipse
    kphsX         phasor            kLFORateX
    kphsY         phasor            kLFORateY
    kXlfo         tablei            kphsX,-1,1,0   ,1
    kYlfo         tablei            kphsY,-1,1,0.25,1
   elseif kLFOType==2 then ; smooth random
    kXlfo         jspline           1,abs(kLFORateX/2),abs(kLFORateX*2)
    kYlfo         jspline           1,abs(kLFORateY/2),abs(kLFORateY*2)
   else ; jump random
    ktrig         dust              1, kLFORateX
    kXlfo         trandom           ktrig, -1, 1
    kYlfo         trandom           ktrig, -1, 1
   endif

   kXlfo          *=                kLFOAmpX
   kYlfo          *=                kLFOAmpY
   kXlfo          +=                kLFOXOffset
   kYlfo          -=                kLFOYOffset
                  cabbageSet        metro:k(32),"widget","bounds", 192 + (kXlfo*192), 192 - (kYlfo*192),16,16
   kX             =                 kXlfo
   kY             =                 kYlfo
                  cabbageSetValue   "XSlid", kX, changed:k(kX) ; move sliders (needed for write automation in DAW)
                  cabbageSetValue   "YSlid", kY, changed:k(kY)
 
 else ; slider control
  kXSlid          cabbageGetValue   "XSlid"
  kYSlid          cabbageGetValue   "YSlid"
                  cabbageSet        changed:k(kXSlid,kYSlid),"widget","bounds", 192 + (kXSlid*192), 192 - (kYSlid*192),16,16
  kX              =                 kXSlid
  kY              =                 kYSlid
 endif

; move speakers
kwidth          cabbageGetValue    "width"
kazim1          cabbageGetValue    "azim1"
kazim2          cabbageGetValue    "azim2"
kazim3          cabbageGetValue    "azim3"
kazim4          cabbageGetValue    "azim4"
kazim5          cabbageGetValue    "azim5"
kazim6          cabbageGetValue    "azim6"
kazim7          cabbageGetValue    "azim7"
kazim8          cabbageGetValue    "azim8"
                cabbageSet         changed:k(kwidth,kazim1), "Spk1", "bounds",  192 + (193*kwidth*sin(kazim1*$M_PI/180)),192 - (193*kwidth*cos(kazim1*$M_PI/180)), 16, 16
                cabbageSet         changed:k(kwidth,kazim2), "Spk2", "bounds",  192 + (193*kwidth*sin(kazim2*$M_PI/180)),192 - (193*kwidth*cos(kazim2*$M_PI/180)), 16, 16
                cabbageSet         changed:k(kwidth,kazim3), "Spk3", "bounds",  192 + (193*kwidth*sin(kazim3*$M_PI/180)),192 - (193*kwidth*cos(kazim3*$M_PI/180)), 16, 16
                cabbageSet         changed:k(kwidth,kazim4), "Spk4", "bounds",  192 + (193*kwidth*sin(kazim4*$M_PI/180)),192 - (193*kwidth*cos(kazim4*$M_PI/180)), 16, 16
                cabbageSet         changed:k(kwidth,kazim5), "Spk5", "bounds",  192 + (193*kwidth*sin(kazim5*$M_PI/180)),192 - (193*kwidth*cos(kazim5*$M_PI/180)), 16, 16
                cabbageSet         changed:k(kwidth,kazim6), "Spk6", "bounds",  192 + (193*kwidth*sin(kazim6*$M_PI/180)),192 - (193*kwidth*cos(kazim6*$M_PI/180)), 16, 16
                cabbageSet         changed:k(kwidth,kazim7), "Spk7", "bounds",  192 + (193*kwidth*sin(kazim7*$M_PI/180)),192 - (193*kwidth*cos(kazim7*$M_PI/180)), 16, 16
                cabbageSet         changed:k(kwidth,kazim8), "Spk8", "bounds",  192 + (193*kwidth*sin(kazim8*$M_PI/180)),192 - (193*kwidth*cos(kazim8*$M_PI/180)), 16, 16



; speaker-source distance calculations
kscale          cabbageGetValue     "scale"
kX1 =  kwidth*sin(kazim1*$M_PI/180) ; x pos speaker 1
kY1 =  kwidth*cos(kazim1*$M_PI/180) ; y pos speaker 1
kX2 =  kwidth*sin(kazim2*$M_PI/180) ; x pos speaker 2
kY2 =  kwidth*cos(kazim2*$M_PI/180) ; y pos speaker 2
kX3 =  kwidth*sin(kazim3*$M_PI/180) ; x pos speaker 3
kY3 =  kwidth*cos(kazim3*$M_PI/180) ; y pos speaker 3
kX4 =  kwidth*sin(kazim4*$M_PI/180) ; x pos speaker 4
kY4 =  kwidth*cos(kazim4*$M_PI/180) ; y pos speaker 4
kX5 =  kwidth*sin(kazim5*$M_PI/180) ; x pos speaker 5
kY5 =  kwidth*cos(kazim5*$M_PI/180) ; y pos speaker 5
kX6 =  kwidth*sin(kazim6*$M_PI/180) ; x pos speaker 6
kY6 =  kwidth*cos(kazim6*$M_PI/180) ; y pos speaker 6
kX7 =  kwidth*sin(kazim7*$M_PI/180) ; x pos speaker 7
kY7 =  kwidth*cos(kazim7*$M_PI/180) ; y pos speaker 7
kX8 =  kwidth*sin(kazim8*$M_PI/180) ; x pos speaker 8
kY8 =  kwidth*cos(kazim8*$M_PI/180) ; y pos speaker 8
 
 ; distances from source for each speaker
 kDist1 = sqrt( (kX1 - kX)^2 + (kY1 - kY)^2 )
 kDist2 = sqrt( (kX2 - kX)^2 + (kY2 - kY)^2 ) 
 kDist3 = sqrt( (kX3 - kX)^2 + (kY3 - kY)^2 ) 
 kDist4 = sqrt( (kX4 - kX)^2 + (kY4 - kY)^2 ) 
 kDist5 = sqrt( (kX5 - kX)^2 + (kY5 - kY)^2 ) 
 kDist6 = sqrt( (kX6 - kX)^2 + (kY6 - kY)^2 ) 
 kDist7 = sqrt( (kX7 - kX)^2 + (kY7 - kY)^2 ) 
 kDist8 = sqrt( (kX8 - kX)^2 + (kY8 - kY)^2 )

; audio source

 ; audio source
 asig     inch     1 
 ; sound file playback
 if gkPlay==1 then
   asig = gaFileL
   gaFileL = 0 ; clear audio variables
   gaFileR = 0 ; clear audio variables
 endif


; amplitude
kh              =                  sqrt(kX^2 + kY^2)
kdist           =                  abs(kwidth - kh)
kscale          cabbageGetValue    "scale"
kdB             =                  kdist^0.5 * (-1 * kscale)

; rotate speaker array
kDecrAz          cabbageGetValue    "DecrAz"
kIncrAz          cabbageGetValue    "IncrAz"
kAzTimer metro  16
iAzStep = 0.5
if kDecrAz==1 then
                cabbageSetValue    "azim1", kazim1-iAzStep, kAzTimer
                cabbageSetValue    "azim2", kazim2-iAzStep, kAzTimer
                cabbageSetValue    "azim3", kazim3-iAzStep, kAzTimer
                cabbageSetValue    "azim4", kazim4-iAzStep, kAzTimer
                cabbageSetValue    "azim5", kazim5-iAzStep, kAzTimer
                cabbageSetValue    "azim6", kazim6-iAzStep, kAzTimer
                cabbageSetValue    "azim7", kazim7-iAzStep, kAzTimer
                cabbageSetValue    "azim8", kazim8-iAzStep, kAzTimer
elseif kIncrAz==1 then
                cabbageSetValue    "azim1", kazim1+iAzStep, kAzTimer
                cabbageSetValue    "azim2", kazim2+iAzStep, kAzTimer
                cabbageSetValue    "azim3", kazim3+iAzStep, kAzTimer
                cabbageSetValue    "azim4", kazim4+iAzStep, kAzTimer
                cabbageSetValue    "azim5", kazim5+iAzStep, kAzTimer
                cabbageSetValue    "azim6", kazim6+iAzStep, kAzTimer
                cabbageSetValue    "azim7", kazim7+iAzStep, kAzTimer
                cabbageSetValue    "azim8", kazim8+iAzStep, kAzTimer
endif

a1,a2,a3,a4,a5,a6,a7,a8 init 0


idim            =               2
ilsnum          =               8
if changed:k(kazim1,kazim2,kazim3,kazim4,kazim5,kazim6,kazim7,kazim8)==1 then
 reinit REBUILD_SPEAKER_DEF
endif
REBUILD_SPEAKER_DEF:
                vbaplsinit      idim, ilsnum, i(kazim1), i(kazim2), i(kazim3), i(kazim4), i(kazim5), i(kazim6), i(kazim7), i(kazim8)


; apply smoothing to changes in X and Y of the location widget
; One reason is that if the location widget crosses the XY origin, a jump in amplitude can occur.
; Another way to mitigate against this is to raise Scale (which will lower the amplitude at the origin)
;  or increase Spread, which will increase spill between speakers
kramp            linseg            0,0.01,1
kX               portk             kX, kramp * 0.2 ;ksmoothing
kY               portk             kY, kramp * 0.2 ;ksmoothing

; convert polar coordinates to azimuth
if kX<0 then ; q3 or q4
 kaz            =               (180 + (taninv2:k(kX, kY) * (180/$M_PI))) + 180
else ; q1 or q2
 kaz            =               taninv2:k(kX, kY) * (180/$M_PI)
endif



kel            =                0 
kspread        cabbageGetValue  "spread"        ; spill between speakers

kporttime      linseg           0, 0.001, 0.05  ; ramping-up portamento time
a1,a2,a3,a4,a5,a6,a7,a8 vbap  asig*ampdbfs(kdB), kaz , kel, kspread
rireturn

; doppler
kDopOnOff cabbageGetValue "DopOnOff"
kDopScale cabbageGetValue "DopScale"
if kDopOnOff==1 then
 /*
 kmicposition = 0
 a1       doppler         a1, kDist1*kDopScale, kmicposition ;[, isoundspeed, ifiltercutoff] 
 a2       doppler         a2, kDist2*kDopScale, kmicposition ;[, isoundspeed, ifiltercutoff] 
 a3       doppler         a3, kDist3*kDopScale, kmicposition ;[, isoundspeed, ifiltercutoff] 
 a4       doppler         a4, kDist4*kDopScale, kmicposition ;[, isoundspeed, ifiltercutoff] 
 a5       doppler         a5, kDist5*kDopScale, kmicposition ;[, isoundspeed, ifiltercutoff] 
 a6       doppler         a6, kDist6*kDopScale, kmicposition ;[, isoundspeed, ifiltercutoff] 
 a7       doppler         a7, kDist7*kDopScale, kmicposition ;[, isoundspeed, ifiltercutoff] 
 a8       doppler         a8, kDist8*kDopScale, kmicposition ;[, isoundspeed, ifiltercutoff] 
 */
 ;creating the doppler using vdelay may be more efficient
 ic       =               343 ; speed of sound in air
 a1       vdelay          a1, a(kDist1*kDopScale*1000/ic), 1000
 a2       vdelay          a2, a(kDist2*kDopScale*1000/ic), 1000
 a3       vdelay          a3, a(kDist3*kDopScale*1000/ic), 1000
 a4       vdelay          a4, a(kDist4*kDopScale*1000/ic), 1000
 a5       vdelay          a5, a(kDist5*kDopScale*1000/ic), 1000
 a6       vdelay          a6, a(kDist6*kDopScale*1000/ic), 1000
 a7       vdelay          a7, a(kDist7*kDopScale*1000/ic), 1000
 a8       vdelay          a8, a(kDist8*kDopScale*1000/ic), 1000
 
endif



outo a1,a2,a3,a4,a5,a6,a7,a8 ; octophonic output
;outs a1,a2

; meters
kUpdate         metro           30                       ; rate up update of the VU meters
#define meter(N)
#
; L meter
kres$N          init            0
kres$N          limit           kres$N-0.001,0,1 
kres$N          peak            a$N * 10
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
i1 0 z
</CsScore>

</CsoundSynthesizer>
