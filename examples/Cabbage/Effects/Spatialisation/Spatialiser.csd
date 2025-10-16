
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Spatialiser
; Iain McCurdy 2021

; Spatialiser instils a sense of movement into a sound source by means of:
; - Doppler shift
; - Panning location
; - Amplitude drop off
; - High frequency drop off
; - Reverb diffusion (reverb doesn't drop off as quickly as the direct sound due to diffusion)

; Spatialiser can work with either mono or stereo input.

; The 'listener' can be in one of two forms:
; - two microphones represented by red and blue boxes
; - a 'head' listener. Interaural time differences are calculated dependent on the angle of the source sound to the listener.

; The sound source - the green circle in the main xy pad area - can be moved in three ways:
; 1 - manually using click and drag
; 2 - using Cabbage's built-in mechanism for flinging thit into motion using right-click and drag
; 3 - using CIRCLE mode - a built-in 2D LFO

; On/Off buttons - toggle between MICS and HEAD listener modes

; MICS
; Separation - spacing between the two speakers
; Distance   - distance of the microphones

; HEAD
; locate the listening head using the xypad

; CIRCLE
; Threes shapes are offered: curve (circle), straight (rhombus) and loop (repeating straight line trajectory) 
; Radius  - radius of the circle
; Speed   - speed of rotation
; Ellipse - distortion of the circle horzontally and vertically
; Skew    - rotational shift of the ellipse

; SCALING - scaling of some of the aspects of the spatialisation
; Doppler   - amount of doppler shift
; Amplitude - rapidity of amplitude fall off
; Panning   - steepness of panning shift when crossing the listener 
; Filter    - amount of high frequency loss with distance from the sound source

; REVERB
; Amount    - amount of reverb with respect to the dry signal
; Size      - size of the reverberant space
; Damping   - high ferquency damping within the reverberant space, i.e. the nature of the reflective surfaces in the space
; Diffusion - amount by which reverb prevails even as the sound source recedes into the distance 

; SETUP
; Follow Time - movement damping applied when moving the sound source manually

<Cabbage>
form caption("Spatialisation"), size(690,695), pluginId("Spat"), guiRefresh(1), colour("Black")

; MAIN XY PAD
image bounds(280, 10,400,460), colour(0,0,0,0) {
xypad bounds(  0,  0,400,460), channel("X", "Y"), rangeX(0, 1, 0.5), rangeY(0, 1, 0.5), colour(20,20,30), fontColour("white")
image bounds(100,200,20,20), shape("sharp"), alpha(0.5), identChannel("Mic1ID"), text("1"), colour(0,0,255), trackerColour(100,100,0)
image bounds(300,200,20,20), shape("sharp"), alpha(0.5), identChannel("Mic2ID"), text("2"), colour(255,0,0)
label    bounds(10,415, 80,15),text("SOURCE")
combobox bounds(10,431, 80,25), items("Live","Test Tone","File"), channel("Source"), value(3)
hslider  bounds(95,431,300,20), channel("InGain"), range(0,5,1,0.5), text("Input Gain"), valueTextBox(1)
}

; MICS CONTROLS
groupbox bounds( 10, 10, 260,100), text("M I C S") {
rslider  bounds( 60, 30, 60, 60), channel("Separation"), range(0,0.5,0.25), text("Separation")
rslider  bounds(140, 30, 60, 60), channel("Distance"), range(0,1,0.5), text("Distance")
}
checkbox bounds( 20, 15, 80,10), channel("MicsOnOff"), colour:0(50,100,50), text("On/Off"), radioGroup(1), value(1)

; HEAD CONTROLS
groupbox bounds( 10,120,260,240), text("H E A D") {
xypad    bounds( 35, 30,190,200), channel("HeadX", "HeadY"), rangeX(0, 1, 0.5), rangeY(0, 1, 0.5), colour(20,20,30), fontColour("white")
}
checkbox bounds( 20,125, 80,10), channel("HeadOnOff"), colour:0(50,100,50), text("On/Off"), radioGroup(1), value(0)

; CIRCLE CONTROLS
groupbox bounds( 10,370,260,100), text("C I R C L E") {
checkbox bounds( 10,  5, 80,10), channel("CircleOnOff"), colour:0(50,100,50), text("On/Off");, value(1)
combobox bounds(180,  1, 70,18), channel("CShape"), value(1), text("CURVE","STRAIGHT","LOOP","RANDOM")
rslider  bounds( 10, 30, 60, 60), channel("Radius"), range(0,1,1), text("Radius")
rslider  bounds( 70, 30, 60, 60), channel("CSpeed"), range(-1,1,0.25), text("Speed")
rslider  bounds(130, 30, 60, 60), channel("CSquash"), range(0, 1, 0.5), text("Ellipse")
rslider  bounds(190, 30, 60, 60), channel("CSkew"), range(0, 0.5, 0.25), text("Skew")
}

; SCALING
groupbox bounds( 10,480,260,100), text("S C A L I N G") {
rslider  bounds( 10, 30, 60, 60), channel("Doppler"), range(0,0.5,0.01,0.5,0.001), text("Doppler")
rslider  bounds( 70, 30, 60, 60), channel("Amplitude"), range(0,240,60,0.5), text("Amplitude")
rslider  bounds(130, 30, 60, 60), channel("Panning"), range(0,90,24,0.5), text("Panning")
rslider  bounds(190, 30, 60, 60), channel("HFDistLoss"), range(0,10,7), text("HF Loss")
}

; REVERB
groupbox bounds(280,480,260,100), text("R E V E R B") {
rslider  bounds( 10, 30, 60, 60), channel("RvbAmt"), range(0,1,0.05,0.5), text("Amount")
rslider  bounds( 70, 30, 60, 60), channel("RvbSize"), range(0.1,0.99,0.8,2), text("Size")
rslider  bounds(130, 30, 60, 60), channel("RvbDamp"), range(1000,20000,8000,0.5,1), text("Damping")
rslider  bounds(190, 30, 60, 60), channel("RvbDiff"), range(0,1,0.8,0.5), text("Diffusion")
}

; SETUP
groupbox bounds(550,480,130,100), text("S E T U P") {
rslider  bounds(  5, 30, 60, 60), channel("FollowTime"), range(0,1,0.05,0.5), text("Follow Time")
label    bounds( 75, 30, 45, 13), text("In"), align("centre")
button   bounds( 75, 45, 45, 14), channel("MonoIn"), text("Mono"), colour:0(50,50,0), colour:1(200,200,0), radioGroup(2), value(1)
button   bounds( 75, 60, 45, 14), channel("StereoIn"), text("Stereo"), colour:0(50,50,0), colour:1(200,200,0), radioGroup(2)

}

; HEAD
image bounds(495,195,50,50) colour(0,0,0,0), identChannel("HeadID") plant("Head"), visible(0) {
image bounds(  5,  5, 40,40), colour(200,200,200), shape("round")
image bounds(  0, 18, 10,14), colour(200,200,200), shape("round")
image bounds( 40, 18, 10,14), colour(200,200,200), shape("round")
image bounds( 21,  0,  8,10), colour(200,200,200), shape("round")
}


; file player
image bounds( 10,590,670, 85) colour(0,0,0,0), outlineColour("silver"), outlineThickness(1), corners(5)
{
filebutton bounds(  5, 10, 70, 20), text("OPEN FILE","OPEN FILE"), fontColour("white") channel("filename")
button     bounds( 85, 10, 70, 20), text("PLAY","PLAY"), fontColour("white") channel("Play"), latched(1), colour:0(10,55,10), colour:1(70,200,70)
soundfiler bounds(  5, 35,670, 45), channel("beg","len"), identChannel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 15, 38,670, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
}



label      bounds( 10,681,110, 12), text("Iain McCurdy |2021|"), align("left")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  =  32
nchnls =  2
0dbfs  =  1

giSine ftgen 1,0,4096,10,1
giTri  ftgen 2,0,4096,7, 0,1024,1,2048,-1,1024,0
giLoop ftgen 3,0,4096,7, -1,4096,1
gaFileL,gaFileR init 0

instr 1
 ; load file from browse
 gSfilepath     chnget    "filename"    ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then                ; call instrument to update waveform viewer  
  event "i",99,0,0
 endif 
 
 gkPlay cabbageGetValue "Play"
 if trigger:k(gkPlay,0.5,0) == 1 then
  event "i",101,0,3600
 endif


event_i "i",2,0,0.01 ; fix xypad init positions

iDelCF       =        1  ; delay time filter CF used to smooth sudden changes in delay time

kX           chnget   "X"
kY           chnget   "Y"
kHeadX       chnget   "HeadX"
kHeadY       chnget   "HeadY"
kSeparation  chnget   "Separation"
kSeparation  =        0.5 - kSeparation
kDistance    chnget   "Distance"
kDistance    =        1 - kDistance
kRadius      chnget   "Radius"
kCSpeed      chnget   "CSpeed"
kCSpeed      =        (kCSpeed^3) * 20
kCShape      chnget   "CShape"
kCSquash     chnget   "CSquash"
kCSkew       chnget   "CSkew"
kDoppler     chnget   "Doppler"
kAmplitude   chnget   "Amplitude"
kPanning     chnget   "Panning"
kCircleOnOff chnget   "CircleOnOff"
kMicsOnOff   chnget   "MicsOnOff"
kHeadOnOff   chnget   "HeadOnOff"
kFollowTime  chnget   "FollowTime"
kRvbAmt      chnget   "RvbAmt"
gkRvbSize    chnget   "RvbSize"
gkRvbDamp    chnget   "RvbDamp"
kRvbDiff     chnget   "RvbDiff"
kRvbDiff     =        1 - kRvbDiff
kHFDistLoss  chnget   "HFDistLoss"
kHFDistLoss  =        (10 - kHFDistLoss) + 4
kPortRamp    linseg   0, 0.001, 1
kMonoIn      chnget   "MonoIn"
kStereoIn    chnget   "StereoIn"

;toggle mics/head
if changed:k(kMicsOnOff)==1 then
 SMsg        sprintfk "visible(%d)", kMicsOnOff
             chnset   SMsg, "Mic1ID"
             chnset   SMsg, "Mic2ID"
 SMsg        sprintfk "visible(%d)", 1-kMicsOnOff
             chnset   SMsg, "HeadID"
endif

; animate mic positions
if changed:k(kSeparation,kDistance)==1 then
Smsg         sprintfk "pos(%d,%d)", 8 + kSeparation * 357, 9 + kDistance * 362
             chnset   Smsg, "Mic1ID"
Smsg         sprintfk "pos(%d,%d)", (1-kSeparation) * 372, 9 + kDistance * 362
             chnset   Smsg, "Mic2ID"
endif

; animate head position
if changed:k(kHeadX,kHeadY)==1 then
Smsg         sprintfk "pos(%d,%d)", limit:k((kHeadX * 400) + 251,270,640), limit:k( ((1-kHeadY) * 400) - 20, 5, 370)
             chnset   Smsg, "HeadID"
endif

; audio input
kSource chnget "Source"
if kSource==1 then
 a1,a2      ins
 if kMonoIn==1 then
  a2 = a1
 endif
elseif kSource==2 then
 ; beeper
 a1              vco2               0.6,880
 klfo            lfo                1, 8, 3
 a1              *=                 a(klfo)
 a2              =                  a1
else
 a1 = gaFileL
 if kMonoIn==1 then
  a2 = a1
 else
  a2 = gaFileR
 endif
endif
gaFileL = 0 ; clear global sends in case playback is stopped
gaFileR = 0
kInGain chnget "InGain"
a1 *= kInGain
a2 *= kInGain


; Circle
if kCircleOnOff==1 then
 if kCShape==4 then
  kAX       =         limit:k(rspline:k(0.5 - kRadius*0.5, 0.5 + kRadius*0.5, kCSpeed*0.5, kCSpeed*2),0,1)
  kAY       =         limit:k(rspline:k(0.5 - kRadius*0.5, 0.5 + kRadius*0.5, kCSpeed*0.5, kCSpeed*2),0,1)
 else
  ;kAX       oscil    limit:k(kRadius * kCSquash,0,0.5), kCSpeed,  i(kCShape), 0.125
  aAX       osciliktp kCSpeed, kCShape, kCSkew
  kAX       limit     k(aAX) * kRadius * limit:k(kCSquash,0,0.5), -0.5, 0.5
  ;kAY       oscil    limit:k(kRadius * (1-kCSquash),0,0.5), kCSpeed, i(kCShape)
  aAY       osciliktp  kCSpeed, kCShape, k(0)
  kAY       limit    k(aAY) * kRadius * limit:k((1-kCSquash),0,0.5), -0.5, 0.5 
  kAX       +=       0.5
  kAY       +=       0.5
 endif
            chnset   kAX, "X"
            chnset   kAY, "Y"
else
 ; Manual
 kAX       portk    kX, kFollowTime * kPortRamp
 kAY       portk    kY, kFollowTime * kPortRamp
endif



; MICS
if kMicsOnOff==1 then
 ; left mic
 ; distance to sound
 ka1       =        abs((kSeparation) - kAX)
 ko1       =        abs((1-kDistance) - kAY)
 kh1       =        (ka1^2 + ko1^2) ^ 0.5
 ; doppler
 kDel1     =        kh1 * kDoppler
 aDel1     interp   kDel1
 a1D       vdelayxw a1, (tone:a(aDel1,iDelCF) + 1/kr), 1, 16
 ; amplitude
 kdB1      =        kh1^0.5 * (-kAmplitude) ; apply inverse square law
 ; filter
 kCF1      scale    limit:k((1-kh1),0,1), 14, kHFDistLoss
 a1D       tone     a1D, cpsoct(kCF1)
 ; reverb send
           chnmix   a1D*kRvbAmt*a(ampdbfs(kdB1*kRvbDiff)), "SendL"
 ; amplitude scaling
 a1D       *=       a(ampdbfs(kdB1))
 
 ; right mic
 ; distance to sound
 ka2       =        abs((1-kSeparation) - kAX)
 ko2       =        abs((1-kDistance) - kAY)
 kh2       =        (ka2^2 + ko2^2) ^ 0.5
 ; doppler
 kDel2     =        kh2 * kDoppler
 aDel2     interp   kDel2
 a2D       vdelayxw a2, (tone:a(aDel2,iDelCF) + 1/kr), 1, 16
 ; amplitude
 kdB2      =        kh2^0.5 * (-kAmplitude)
 ; filter
 kCF2      scale    limit:k((1-kh2),0,1), 14, kHFDistLoss
 a2D       tone     a2D, cpsoct(kCF2)
 ; reverb send
           chnmix   a2D*kRvbAmt*a(ampdbfs(kdB1*kRvbDiff)), "SendR"
 ; amplitude scaling
 a2D       *=       a(ampdbfs(kdB2))

endif



; HEAD
if kHeadOnOff==1 then
kHeadX   portk    kHeadX, kFollowTime * kPortRamp
kHeadY   portk    kHeadY, kFollowTime * kPortRamp
; distance
ka       =        abs(kHeadX - kAX)
ko       =        abs(kHeadY - kAY)
kh       =        (ka^2 + ko^2) ^ 0.5
kAng     =        taninv(ko/ka)
kAng     =        (1 - (kAng/($M_PI*0.5))) * (kAX>kHeadY?1:-1)   ; -1 to 1
kIAT1    =        limit:k(kAng,0,1) * 0.007
kIAT2    =        limit:k(kAng+1,0,1) * 0.007
; doppler
kDel     =        kh * kDoppler
aDel1    interp   kDel + kIAT1
aDel2    interp   kDel + kIAT2
a1D	     vdelayxw a1, (tone:a(aDel1,iDelCF) + 1/kr), 1, 16
a2D	     vdelayxw a2, (tone:a(aDel2,iDelCF) + 1/kr), 1, 16
; panning
kDist    =        abs(kHeadY-kAY)
kDist    =        kPanning - ((kDist^0.5)*kPanning)
kPan     =        tanh((kHeadX - kAX)*kDist)
kPan     =        (kPan*0.5) + 0.5
a1D      *=       a(kPan)
a2D      *=       a(1-kPan)
; amplitude
kdB      =        kh^3 * (-kAmplitude)
; filter
kCF      scale    limit:k((1-kh),0,1), 14, kHFDistLoss
a1D      tone     a1D, cpsoct(kCF)
a2D      tone     a2D, cpsoct(kCF)
;reverb send
         chnmix   a1D*kRvbAmt*a(ampdbfs(kdB1*kRvbDiff)), "SendL"
         chnmix   a2D*kRvbAmt*a(ampdbfs(kdB1*kRvbDiff)), "SendR"
;amplitude scaling
a1D      *=       a(ampdbfs(kdB))
a2D      *=       a(ampdbfs(kdB))
endif

         outs     a1D,a2D

endin



instr 2 ; initialise xypads
chnset k(0.501), "X"
chnset k(0.501), "Y"
chnset k(0.501), "HeadX"
chnset k(0.501), "HeadY"
endin

instr 98
aIn1  chnget  "SendL"
aIn2  chnget  "SendR"
      chnclear "SendL"
      chnclear "SendR"
a1,a2 reverbsc aIn1,aIn2,gkRvbSize,gkRvbDamp
      outs     a1,a2
endin




; LOAD SOUND FILE
instr    99
 giSource         =               0
;                  cabbageSet      "filer1", "file", gSfilepath
 Smsg             sprintf         "file(\"%s\")", gSfilepath
                  chnset          Smsg, "filer1"
 gkNChans         init            filenchnls:i(gSfilepath)
 /* write file name to GUI */
; SFileNoExtension cabbageGetFileNoExtension gSfilepath
;                  cabbageSet      "FileName","text",SFileNoExtension
endin

; play sound file
instr 101
if gkPlay==0 then
 turnoff
endif
if i(gkNChans)==1 then
 gaFileL          diskin2         gSfilepath, 1, 0, 1
else
 gaFileL,gaFileR  diskin2         gSfilepath, 1, 0, 1
endif
chnset 3, "Source"
endin


</CsInstruments>

<CsScore>
i 1  0 z
i 98 0 z
</CsScore>

</CsoundSynthesizer>