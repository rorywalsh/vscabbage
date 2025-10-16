
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; spat3d
; Written by Iain McCurdy, 2024
; based on Istvan Varga's opcode, spat3d
; combines distance-based amplitude and doppler adjustments as well as room acoustics

; The location widget (white circle) can be moved using the mouse.
; This represents the location of the source sound.

; Input is always mono. If given a stereo file, only the left channel is used. For live audio input, only the left channel is used.

; Reverb (On/Off)   - this activates simulated room acoustics (reverb). 
;                            The level of the this reverb will drop off slower than that of the dry signal.
; CONTROL           -   choose from one of three modes of control:
;                       1. Mouse - simply click and drag in the square panel
;                       2. LFO - the location widget is moved according to settings made in the LFO panel 
;                       3. Sliders - the XY position of the widget is moved using the long sliders along two of the edges of the panel.
;                        this third method is used if modulation of the widget location using hardware sliders is desired.
;                        note that these sliders are also moved by the Mouse and LFO modes 
;                        and this is useful if you want to capture location widget movements 
;                        as automation within a DAW.
;                        Note that these sliders can extend beyond the scope of the GUI panel. 
;                        If you 'lose' a slider, double click it to return it to its default location.
; Input             -   choose an input, either live input from the left/first input channel or a test beeper.

; Size              -    sets the size of the room for the reverb emulation. (Only revealed when 'Reverb' is activated)
; Width             -   in 'head' mode, this is the size of the unit circle in metres.
;                        in 'microphones' mode it is the spacing between the two microphones.
;                        this parameter is i-rate so adjustments in performance time will produce audio discontinuities.

; LPF               -    a lowpass filter which affects the sounds between the microphones in 'microphone' mode.
;                         this can be though of as a simulation of the off-axis response of directional microphones
; Cutoff            -    cutoff frequency of the lowpass filter

; Scale             -   this scales the complete physical area shown by the square panel.
;                        effectively it varies the rate of amplitude drop-off as the location widget moves away from a point of pick up.,
;                        it will also affect the extent of Doppler shift for a similar movement across the panel.
; Smoothing         -   portamento smoothing applied to movements of the location widget.
;                        if this is removed, or is too low, discontinuities in the audio signal may appear.
; Meters            -   output meters useful for trouble shooting 
; Amp Drop-off      -   this controls the amount of an additonal layer of distance related amplitude drop-off, 
;                         independent of the opcode.
;                       The reason this might prove useful is because doppler and amplitude drop-off 
;                        - are bound together within the spat3d opcode and the user might desire some independent control.
; Input Gain        -   Scales the amplitude of the input. Useful if there is distortion in the output; spat3d can apply >1 gain.

; LFO
; Shape             -    choose LFO shape from one of three options:
;                       1. Ellipse
;                       2. Random 1 (smoothing interpoating random movements)
;                       3. Random 2 (random jumping to new locations). The value set for 'Smoothing' will have a marked impact here.
; Rate              -   Speed of LFO. Negative values implies backwards movements
; Amp.X / Amp.Y     -   amplitudes of the LFO in the X and Y directions. If these are the same and shape is Ellipse, movement will be in a circle.
; LINK (between amps) - this can be activated to facilitate synced movement between Amp.X and Amp.Y.
; X Offset / Y Offset - fixed shift of any of the LFO shapes in the X and Y directions.
; LINK (between offsets) - similarly these controls can be linked and synced


<Cabbage>
form caption("spat3d") size(820,488), pluginId("gui1"), guiMode("queue"), colour(40,40,40)

; XY panel
image bounds(  0, 0,400,400), colour(50,50,50), channel("panel"), outlineThickness(1) ; xy panel

; LABEL
label bounds(  0,150,400,100), text("SPAT3D"), fontColour("white"), alpha(0.05), colour(0,0,0,0)

; speakers
label    bounds( 96,192, 16, 16), channel("left"), alpha(0.85), colour("White"), text("L"), fontColour("Black")
label    bounds(289,192, 16, 16), channel("right"), alpha(0.85), colour("White"), text("R"), fontColour("Black")
; head
image    bounds(187,183, 30, 34), channel("head"), alpha(0.5), colour(205,205,255), shape("ellipse"), outlineThickness(2), visible(0)

; widget
image bounds(193,192,16,16), colour("White"), shape("ellipse"), channel("widget")     ; panning widget

; blanking panel
image    bounds(  0,400,820, 20), colour(40,40,40)

; xy sliders
hslider  bounds(-200, 405,800, 10), channel("XSlid"), range(-2,2,0)
vslider  bounds( 405,-200, 10,800), channel("YSlid"), range(-2,2,0)

; blanking panel
image    bounds(415,  0,405,420), colour(40,40,40)
image    bounds(  0,415,820,120), colour(40,40,40)

; Controls
checkbox bounds(430, 10,100, 14), channel("room"), text("Reverb"), value(0)
label    bounds(510,  5, 80, 13), text("CONTROL"), align("centre")
combobox bounds(510, 20, 80, 20), items("Mouse","LFO","Sliders"), channel("control"), value(1)
checkbox bounds(710,  6,300, 14), channel("mode1"), text("Head"), value(0), radioGroup(1)
checkbox bounds(710, 26,300, 14), channel("mode4"), text("Microphones"), value(1), radioGroup(1)



hslider  bounds(425, 60,400, 15), channel("depth"), text("Size"), range(0.1,5,4), valueTextBox(1), visible(0)
hslider  bounds(425, 90,400, 15), channel("width"), text("Width"), range(0,2,1), valueTextBox(1)
checkbox bounds(430,120, 50, 14), channel("LPFOn"), text("LPF"), value(1)
hslider  bounds(475,120,350, 15), channel("cf"), text("Cutoff"), range(100,16000,5000,0.5,1), valueTextBox(1)
hslider  bounds(425,150,400, 15), channel("scale"), text("Scale"), range(1,10,1), valueTextBox(1)
hslider  bounds(425,180,400, 15), channel("smoothing"), text("Smoothing"), range(0.01,1,0.1), valueTextBox(1)


; meters
image   bounds(440,210, 35, 42), colour(0,0,0,0)
{
vmeter  bounds(  0,  0, 10, 30) channel("VUMeterL") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
vmeter  bounds( 15,  0, 10, 30) channel("VUMeterR") value(0) overlayColour(0, 0, 0, 255) meterColour:0(255, 255, 0) meterColour:1(255, 103, 171) meterColour:2(250,250, 0) outlineThickness(0)
label   bounds(  0, 30, 10, 12), text("L")
label   bounds( 15, 30, 10, 12), text("R")
}

hslider  bounds(490,210,335, 15), channel("AmpDropOff"), text("Amp.Drop-off"), range(0,48,0), valueTextBox(1)
hslider  bounds(490,240,335, 15), channel("InGain"), text("Input Gain"), range(0.1,2,1,0.5), valueTextBox(1)

; lfo controls
image    bounds(425,265,390,145), colour(0,0,0,0), channel("lfo"), outlineThickness(1), alpha(0.2)
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

label      bounds( 10,474,110, 12), text("Iain McCurdy |2024|"), align("left")

</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-n -d -m0
</CsOptions>
<CsInstruments>
ksmps  = 1
nchnls = 2
0dbfs  = 1
seed 0


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
   kLFOLink2      cabbageGetValue   "LFOLink2"
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















 ; audio source
 asig     inch     1 
 ; sound file playback
 if gkPlay==1 then
   asig = gaFileL/4
   gaFileL = 0 ; clear audio variables
   gaFileR = 0 ; clear audio variables
 endif
 kInGain  cabbageGetValue "InGain"
 asig *= kInGain





; read in widgets
kramp           linseg             0,0.01,1
ksmoothing      cabbageGetValue    "smoothing"
kX              portk              kX,kramp * ksmoothing
kY              portk              kY,kramp * ksmoothing
kroom           cabbageGetValue    "room"
kdepth          cabbageGetValue    "depth"
                cabbageSet         changed:k(kroom),"depth","visible",kroom
kwidth          cabbageGetValue    "width"
kLPFOn          cabbageGetValue    "LPFOn"
kcf             cabbageGetValue    "cf"
                cabbageSet         changed:k(kLPFOn),"cf","visible",kLPFOn
kscale          cabbageGetValue    "scale"
kmode1          cabbageGetValue    "mode1"
kX              *=                 kscale 
kY              *=                 kscale 
; move microphones
                cabbageSet         changed:k(kwidth,kscale), "left", "bounds",  193 - (193*kwidth*0.5/kscale),192, 16, 16
                cabbageSet         changed:k(kwidth,kscale), "right", "bounds", 193 + (193*kwidth*0.5/kscale),192, 16, 16
                cabbageSet         changed:k(kwidth,kscale), "head", "bounds", 187 - (15*0.5*kwidth),183 - (17*0.5*kwidth), 30+(15*kwidth), 34+(17*kwidth)

; show/hide head/microphones
cabbageSet changed:k(kmode1), "left", "visible", kmode1 = 1 ? 0 : 1
cabbageSet changed:k(kmode1), "right", "visible", kmode1 = 1 ? 0 : 1
cabbageSet changed:k(kmode1), "head", "visible", kmode1 = 1 ? 1 : 0

kZ              =                  0
idist           =                  1                     ; unit measurement or mic spacing in mode 4
imdel           =                  2                     ; maximum delay
iovr            =                  8                     ; 1 to 8

if changed:k(kroom,kdepth,kwidth,kmode1)==1 then
 reinit RESTART_SPAT3d
endif
RESTART_SPAT3d:

/* room parameters */
idep    =  i(kdepth)    ; early reflection depth 
itmp    ftgen   1, 0, 64, -2,                                   \
		/* depth1, depth2, max delay, IR length, idist, seed */ \
		idep, 48, -1, 0.01, 0.25, 123,                          \
		1, 21.982, 0.05, 0.87, 4000.0, 0.6, 0.7, 2, /* ceil  */ \
		1,  1.753, 0.05, 0.87, 3500.0, 0.5, 0.7, 2, /* floor */ \
		1, 15.220, 0.05, 0.87, 5000.0, 0.8, 0.7, 2, /* front */ \
		1,  9.317, 0.05, 0.87, 5000.0, 0.8, 0.7, 2, /* back  */ \
		1, 17.545, 0.05, 0.87, 5000.0, 0.8, 0.7, 2, /* right */ \
		1, 12.156, 0.05, 0.87, 5000.0, 0.8, 0.7, 2  /* left  */

; distance from origin
kOriDist        =                  sqrt(kX^2 + kY^2) 

; additional distance-based amplitude scaling
kAmpDropOff     cabbageGetValue "AmpDropOff"
asig            *=                 ampdbfs(kOriDist*(-kAmpDropOff))

idist           =                  i(kwidth)
ift             =                  i(kroom)                   ; 0 = free-field
imode           =                  1 + ((1 - i(kmode1)) * 3)  ; 1=stereo 4=stereo_pair_mics
;imode           =                  1                          ; 1=stereo 4=stereo_pair_mics
aW, aX, aY, aZ  spat3d             asig, kX, kY, kZ, idist, ift, imode, imdel, iovr
aW              =                  aW * sqrt(2) ;1.4142

kmode1          cabbageGetValue    "mode1"

if kmode1==1 then
 ; mode 1, B format with W and Y output (stereo)
 aL             =                   aW + aY              ; left
 aR             =                   aW - aY              ; right
 
else
; mode 4, stereo microphones
 if kLPFOn==1 then
  ;aW              butterlp           aW, kcf      ; recommended values for ifreq
  ;aY              butterlp           aY, kcf      ; are around 1000 Hz
  aW              tone                aW, kcf      ; recommended values for ifreq
  aY              tone                aY, kcf      ; are around 1000 Hz
 endif
 aL              =                  aW + aX
 aR              =                  aY + aZ
endif

; output
	            outs               aL, aR






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
$meter(L)
$meter(R)

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
