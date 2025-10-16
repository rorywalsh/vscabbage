
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; LocsigStereo
; Written by Iain McCurdy, 2024

; Mono input, stereo out sound spatialisation

; Scale             -   scaling of the area covered by the SPACE panel meaning that the four speakers 
;                        will appear closer to the centre of the panel  as it is increased.
; Smoothing         -   portamento smoothing applied to change made to the XY location of the location widget by any means
; Amp Drop-off      -   rate at which amplitude drops off as distance from a speaker increases (in dB across the full axis) 
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
; 1 - 2 (meters)    -    outputs levels being sent to each of the two outputs. Useful for troubleshooting.

; Doppler (check box) - on/off for a doppler shift effect applied according to movement of the location widget in relation to each speaker
; Dop.Scale         -  scaling control for the amount of doppler shift

; Rvb.Send          -   ratio of signal send to to a reverb effect
; Size              -   reverb time of that reverb effect (reverbsc)
; Damping           -   cutoff frequency of a lowpass filter within that reverb effect (reverbsc)

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
form caption("LOCSIG") size(820,490), guiMode("queue"), pluginId("def1"), colour("black"), colour(40,40,40)

; XY panel
image bounds(  0, 0,400,400), colour(50,50,50), channel("panel"), outlineThickness(1) ; xy panel

; LABEL
label bounds(  0,160,400, 80), text("L O C S I G"), fontColour("white"), alpha(0.05), colour(0,0,0,0)

; speakers
label    bounds(-1000, 84, 32, 32), channel("Spk1"), colour("LightGrey"), text("1"), fontColour("Black"), alpha(0.7)
label    bounds(-1000, 84, 32, 32), channel("Spk2"), colour("LightGrey"), text("2"), fontColour("Black"), alpha(0.7)

; location  widget
image bounds(193,192,16,16), colour("White"), shape("ellipse"), channel("widget"), alpha(0.8)     ; panning widget

; blanking panels
image    bounds(  0,400,820, 20), colour(40,40,40)

; xy sliders
hslider  bounds(-200, 405,800, 10), channel("XSlid"), range(-2,2,0)
vslider  bounds( 405,-200, 10,800), channel("YSlid"), range(-2,2,0)

; blanking panels
image    bounds(420,  0,420,420), colour(40,40,40)
image    bounds(  0,420,820,120), colour(40,40,40)

image bounds(415,0,400,150), colour(0,0,0,0) 
{ 
hslider  bounds(  5, 10,390, 15), channel("scale"), text("Scale"), range(1,20,2,0.5), valueTextBox(1)
hslider  bounds(  5, 40,390, 15), channel("smoothing"), text("Smoothing"), range(0.00,1,0.05,0.5), valueTextBox(1)
hslider  bounds(  5, 70,390, 15), text("Amp.Drop-off"), channel("AmpDropOff"), range(0,48,12,0.5), valueTextBox(1)
label    bounds(110,105, 80, 13), text("CONTROL"), align("centre")
combobox bounds(110,120, 80, 20), items("Mouse","LFO","Sliders"), channel("control"), value(1)
}

; meters
image   bounds(650,105,135, 76), colour(0,0,0,0)
{
vmeter  bounds(  0,  0, 20, 30) channel("VUMeter1") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 30,  0, 20, 30) channel("VUMeter2") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
label   bounds(  0, 31, 20, 15), text("1")
label   bounds( 30, 31, 20, 15), text("2")
}


; doppler
image bounds(425,155,150, 95), colour(0,0,0,0), outlineThickness(1)
{
checkbox bounds( 10, 10, 70, 15), text("Doppler"), channel("DopOnOff"), range(1,50,1,0.5)
rslider  bounds( 70, 25, 60, 60), text("Dop.Scale"), channel("DopScale"), range(0.1,5,1,0.5)
}

; reverb
image   bounds(580,155,235, 95), colour(0,0,0,0), outlineThickness(1)
{
label   bounds(  0, 5,220, 15), text("R E V E R B"), align("centre")
rslider bounds(  5,25, 60, 60), text("Rvb.Send"), channel("RvbSend"), range(0,1,0.1)
rslider bounds( 60,25, 60, 60), text("Size"),   , channel("RvbSize") range(0.2,0.99,0.7,2)
rslider bounds(115,25, 60, 60), text("Damping") , channel("RvbDamp"), range(100,15000,8000,0.5,1)
rslider bounds(170,25, 60, 60), text("Drop Off") , channel("RvbDropOff"), range(0,48,0,1,1)
}

; lfo controls
image    bounds(425,255,390,145), colour(0,0,0,0), channel("lfo"), outlineThickness(1), alpha(0.2)
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
image bounds( 10,420,800,200) colour(0,0,0,0)
{
filebutton bounds(  0,  0, 70, 20), text("Open File","Open File"), fontColour("white") channel("filename")
button     bounds(  0, 30, 70, 20), text("PLAY","PLAY"), fontColour("white") channel("Play"), latched(1), colour:0(10,55,10), colour:1(70,200,70)
soundfiler bounds( 80,  0,730, 50), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 80,  3,690, 14), text(""), align(left), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
}

label      bounds(  5,475,110, 12), text("Iain McCurdy |2024|"), align("left")

</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-n -dm0
</CsOptions>
<CsInstruments>

; Initialize the global variables. 
ksmps  = 32
nchnls = 2
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
ksmoothing  cabbageGetValue "smoothing"

; show/hide LFO controls
kLFOAlpha[] fillarray 0,1,0 
cabbageSet changed:k(kcontrol),"lfo","alpha", 0.2 + ( kLFOAlpha[kcontrol-1] * 0.8 )

if kcontrol==1 then
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
  kporttime      linseg            0,0.001,0.06
  kX             portk             kX, kporttime
  kY             portk             kY, kporttime

elseif kcontrol==2 then ; lfo spinning

   kLFORateX,kT1  cabbageGetValue   "LFORateX"
   kLFORateY,kT2  cabbageGetValue   "LFORateY"
   kLFOLink0      cabbageGetValue   "LFOLink0"
   if kLFOLink0==1 then                                                   ; link durations
                  cabbageSetValue   "LFORateX",kLFORateY,kT2
                  cabbageSetValue   "LFORateY",kLFORateX,kT1
   endif

   kLFOAmpX,kT1   cabbageGetValue   "LFOAmpX"
   kLFOAmpY,kT2   cabbageGetValue   "LFOAmpY"
   kLFOLink       cabbageGetValue   "LFOLink"
   if kLFOLink==1 then                                                   ; link durations
                  cabbageSetValue   "LFOAmpX",kLFOAmpY,kT2
                  cabbageSetValue   "LFOAmpY",kLFOAmpX,kT1
   endif
   kLFOXOffset,kT1 cabbageGetValue  "LFOXOffset"
   kLFOYOffset,kT2 cabbageGetValue  "LFOYOffset"
   kLFOLink2      cabbageGetValue   "LFOLink2"
   if kLFOLink2==1 then                                                   ; link durations
                  cabbageSetValue   "LFOXOffset",kLFOYOffset,kT2
                  cabbageSetValue   "LFOYOffset",kLFOXOffset,kT1
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
   kYlfo          +=                kLFOYOffset
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
 
 ; speaker-source distance calculations
 kscale          cabbageGetValue     "scale"
 kX1 = -1 / kscale ; x pos speaker 1
 kY1 =  1 / kscale ; y pos speaker 2
 kX2 =  1 / kscale ; x pos speaker 1
 kY2 =  1 / kscale ; y pos speaker 2
 kDist1 = sqrt( (kX1 - kX)^2 + (kY1 - kY)^2 ) 
 kDist2 = sqrt( (kX2 - kX)^2 + (kY2 - kY)^2 ) 

 ; smoooth changes to source location widget
 kramp            linseg            0,0.01,1
 kX               portk             kX, kramp * ksmoothing
 kY               portk             kY, kramp * ksmoothing

; reposition speakers
ktrig           changed             kscale 
cabbageSet ktrig, "Spk1", "bounds",  184 - (184 / kscale),  184 - (184 / kscale), 32, 32 
cabbageSet ktrig, "Spk2", "bounds",  184 + (184 / kscale),  184 - (184 / kscale), 32, 32 



; audio source
 asig     inch     1 
 ; sound file playback
 if gkPlay==1 then
   asig = gaFileL
   gaFileL = 0 ; clear audio variables
   gaFileR = 0 ; clear audio variables
 endif




; derive angle from XY coordinates
if kX<0 then ; q3 or q4
 kAng = (180 + (taninv2:k(kX, kY) * (180/$M_PI))) + 180
else        ; q1 or q2
 kAng = taninv2:k(kX, kY) * (180/$M_PI)
endif


;kDistance       mirror          ((-kY+1) * kscale) - (1 * (kscale-1)), 0, 1000 ; this was a calculation only in line with the speaker
kAmpDropOff     cabbageGetValue "AmpDropOff"
kreverbsend     cabbageGetValue "RvbSend" ; reverb send level
; distance must be > 1
;a1, a2          locsig          asig, kAng+45, 1 + (kDistance*kDistanceScale), kreverbsend
a1, a2          locsig          asig, kAng+45, 1, kreverbsend

; manual amplitude scaling. Not happy with the method applied by locsig as it fails to separate the two speakers correctly
a1 *= ampdbfs(kDist1*(-kAmpDropOff))
a2 *= ampdbfs(kDist2*(-kAmpDropOff))


; doppler
kDopOnOff cabbageGetValue "DopOnOff"
kDopScale cabbageGetValue "DopScale"
if kDopOnOff==1 then
 kmicposition = 0
 a1       doppler         a1, kDist1*kscale*kDopScale, kmicposition ;[, isoundspeed, ifiltercutoff] 
 a2       doppler         a2, kDist2*kscale*kDopScale, kmicposition ;[, isoundspeed, ifiltercutoff] 

 ;creating the doppler using vdelay may be more efficient
 ;ic        =               343 ; speed of sound in air
 ;a1       vdelay          a1, a(kDist1*kscale*kDopScale*1000/ic), 1000
 ;a2       vdelay          a2, a(kDist2*kscale*kDopScale*1000/ic), 1000

endif




aRvbSnd1, aRvbSnd2 locsend 
kfblvl          cabbageGetValue     "RvbSize"
kfco            cabbageGetValue     "RvbDamp"
kRvbDropOff1    =                   ampdbfs(kDist1*(-cabbageGetValue:k("RvbDropOff")))
kRvbDropOff2    =                   ampdbfs(kDist1*(-cabbageGetValue:k("RvbDropOff")))
aRvbOut1, aRvbOut2   reverbsc aRvbSnd1*kRvbDropOff1, aRvbSnd2*kRvbDropOff2, kfblvl, kfco
ao1             sum (a1+aRvbOut1)
ao2             sum (a2+aRvbOut2)



    outs ao1,ao2


; meters
kUpdate         metro           30                       ; rate up update of the VU meters
#define meter(N)
#
kres$N          init            0
kres$N          limit           kres$N-0.001,0,1 
kres$N          peak            a$N * 2
kres$N          lagud           kres$N,0.001,0.001                            
                cabbageSetValue "VUMeter$N",kres$N,kUpdate
#
$meter(1)
$meter(2)


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
;causes Csound to run for about 7000 years...
i 1 0 z
</CsScore>
</CsoundSynthesizer>
