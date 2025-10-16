/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Stormy Weather
; Iain McCurdy, 2017

; Procedural audio approach taken to synthesize there aspects of weather: wind, rain and thunder

; Wind    - on/off button for the wind
; Level   - amplitude of the wind
; Layers  - number of coincident layers of which the wind is comprised. Random functions ensure that each layer withh be different.
; Whistle - how much 'whistle' characteristic there will be in the wind. At minimum, the wind will be more of a roar.

; Rain    - on/off button for the rain
; Level   - amplitude of the rain
; Mix     - 

<Cabbage>
form caption("Stormy Weather") size(290, 330), pluginId("StWe"), colour("black"), guiMode("queue")

image   bounds(  0,  0,300,320), channel("flash"), alpha(0)

#define SLIDER_DESIGN colour("darkGrey"), trackerColour("silver"),  markerColour("silver"), markerThickness(1), outlineColour(50,50,50), trackerInsideRadius(.9), trackerOutsideRadius(1), popupText(0)

image   bounds(  0, 0,300, 40), colour(255,255,255,20) ; top strip

image   bounds(  0, 0, 95,330), colour(255,125,125,30) ; wind strip
image   bounds( 95, 0,100,330), colour(155,255,255,30) ; rain strip
image   bounds(195, 0, 95,330), colour(255,255,155,30) ; thunder strip

button  bounds( 10,  5, 70, 30), text("Wind","Wind"), latched(1), fontColour:0(100,100,100), fontColour:1(0,0,0), channel("Wind"), value(1), colour:1(255,255,100,170), corners(10)
rslider bounds(  5, 50, 80, 80), channel("WindLev"), text("Level"), range(0, 1, .5, 1, .01), $SLIDER_DESIGN
rslider bounds(  5,140, 80, 80), channel("WindLayers"), text("Layers"), range(1,10, 2, 1, 1), $SLIDER_DESIGN
rslider bounds(  5,230, 80, 80), channel("WindWhistle"), text("Whistle"), range(0,1, 0), $SLIDER_DESIGN

button  bounds(110,  5, 70, 30), text("Rain","Rain"), latched(1), fontColour:0(100,100,100), fontColour:1(0,0,0), channel("Rain"), value(1), colour:1(255,255,100,170), corners(10)
rslider bounds(105, 50, 80, 80), channel("RainLev"), text("Level"), range(0, 10, 1, 1, .01), $SLIDER_DESIGN
rslider bounds(105,140, 80, 80), channel("RainMix"), text("Mix"), range(0, 1, .5), $SLIDER_DESIGN
rslider bounds(105,230, 80, 80), channel("RainDens"), text("Density"), range(0, 1, .5), $SLIDER_DESIGN

button  bounds(210,  5, 70, 30), text("Thunder","Thunder"), fontColour:0(100,100,100), fontColour:1(0,0,0), channel("Thunder"), latched(0), colour:1(255,255,100,170), corners(10)
rslider bounds(205, 50, 80, 80), channel("ThunderLev"), text("Level"), range(0, 1, .5, 1, .01), $SLIDER_DESIGN
rslider bounds(205,140, 80, 80), channel("ThunderDur"), text("Duration"), range(4, 25, 11), $SLIDER_DESIGN
rslider bounds(205,230, 80, 80), channel("ThunderDist"), text("Distance"), range(0, 1, 0.1), $SLIDER_DESIGN

label bounds( 2,318,110, 12), text("Iain McCurdy |2017|"), align("left"), fontColour("Grey")


</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -+rtmidi=NULL -M0 -m0d 
</CsOptions>
<CsInstruments>

; Initialize the global variables. 
; sr set by host
ksmps  =    16
nchnls =    2
0dbfs  =    1
       seed 0

instr    1
 gkWind       cabbageGetValue    "Wind"                                 ; on/off
 gkWindLev    cabbageGetValue    "WindLev"
 
 kThunder     cabbageGetValue    "Thunder"                              ; on/off
 kThunderDur  cabbageGetValue    "ThunderDur"
 kThunderDist scale              cabbageGetValue:k("ThunderDist"),1,1.7

 kRain        cabbageGetValue    "Rain"                                 ; on/off
 
 
 if trigger:k(gkWind,0.5,0)==1 then
             event              "i",2,0,3600
 endif
 
 if trigger:k(kThunder,0.5,0)==1 then
             event              "i",3,0,kThunderDur,kThunderDist
             event              "i",3,0,kThunderDur,kThunderDist
 endif 

 if trigger:k(kRain,0.5,0)==1 then
             event              "i",4,0,3600
             event              "i",1000,0,3600
 elseif trigger:k(kRain,0.5,1)==1 then
             turnoff2           4,0,1
             turnoff2           1000,0,1
 endif
 
endin

opcode    Wind,aa,ikp
 iLayers,kbw,iCount    xin
 aML         =                  0
 aMR         =                  0
 kdB         rspline            -3, 0, 5, 15
 kenv        expseg             0.01,4,1,1,1
 aNoise      dust2              0.02*ampdbfs(kdB)*kenv*gkWindLev, 12000
 kCF         rspline            8,10.5,0.1*5,0.2*5
 kCF         -=                 1
 kBW         rspline            0.04,0.2,0.2,2
 aNoise      reson              aNoise, cpsoct(kCF), cpsoct(kCF)*kBW*kbw, 2
 kpan        rspline            0.1,0.9,0.4,0.8
 aL,aR       pan2               aNoise,kpan
 if iCount<iLayers then
  aML,aMR    Wind               iLayers,kbw,iCount+1
 endif
             xout               aL+aML, aR+aMR
endop

instr        2    ; howling wind 
 if gkWind==0 then
  turnoff
 endif
 kLayers      cabbageGetValue    "WindLayers"
 kWindWhistle cabbageGetValue    "WindWhistle"
 if changed(kLayers)==1 then
  reinit RELAYER
 endif
 RELAYER:
 aL,aR       Wind               i(kLayers),scale:k(kWindWhistle^2,0.2,7)
 kAmpScal     scale             kWindWhistle^4,6,1 
 iAmpScal     =                 1/(i(kLayers)^0.5)
 aL           *=                kAmpScal*iAmpScal
 aR           *=                kAmpScal*iAmpScal 
             outs               aL,aR
 
             chnmix             aL*0.3, "SendL"                        ; also send to the reverb
             chnmix             aR*0.3, "SendR"         
endin




instr        3    ; thunder
 kenv        expseg             0.01, 0.05, 1, 0.1, 0.5, p3-0.01, 0.01
 aNse        pinkish            kenv*0.6
 kCF         expon              p4,p3,0.03
 kCFoct      randomh            2*kCF,6*kCF,20
 aNse        reson              aNse*3,a(cpsoct(kCFoct)),a(cpsoct(kCFoct)*8),1
 ipan        gauss              0.5, 0.2
 aL,aR       pan2               aNse,ipan
             outs               aL, aR
             chnmix             aL*0.15, "SendL"                        ; also send to the reverb
             chnmix             aR*0.15, "SendR"         
             cabbageSet         metro:k(32), "flash", "alpha", kCFoct-6
endin





instr        4    ; rain
 kRainMix    cabbageGetValue    "RainMix"
 gkRainDens  cabbageGetValue    "RainDens"
 kRainLev    cabbageGetValue    "RainLev"
 
 kTrig       dust               1, 250*gkRainDens
 gkRainEnv   linsegr            0,2,1,5,0
             schedkwhen         kTrig, 0, 0, 5, 0, 0.008, gkRainEnv*(1-sqrt(kRainMix))*kRainLev
 ; a lower frequency denser layer of rain. Corresponds to 'Mix' being to the right.
 aNse        dust2              0.2*gkRainEnv*sqrt(kRainMix)*kRainLev*(0.4 + (gkRainDens*0.6)),3000*gkRainDens^2
 aNse2       dust2              0.2*gkRainEnv*sqrt(kRainMix)*kRainLev*(0.4 + (gkRainDens*0.6)),1500*gkRainDens^2
 aNse        butlp              aNse, 300 + (1400 * gkRainDens)
 aNse2       butlp              aNse2, 300 + (1400 * gkRainDens)
             outs               aNse,aNse2
endin

instr        5    ; a higher frequency sparser layer of rain. Corresponds to 'Mix' being to the left
 iCPS1       random             5,10
 iCPS2       random             11,14
 idB         random             -22,-44
 aCPS        expon              cpsoct(iCPS1),p3,cpsoct(iCPS2)         ; 'plip'
 aEnv        expseg             0.001,0.005,1,p3-0.005,0.001
 aSig        poscil             aEnv*ampdbfs(idB)*p4,aCPS
 aSig        buthp              aSig,9000
 ipan        betarand           1, 0.5, 0.5
 aL,aR       pan2               aSig,ipan
             outs               aL, aR
             chnmix             aL*0.5, "SendL"                        ; also send to the reverb
             chnmix             aR*0.5, "SendR"         
endin



instr        999    ; reverb
 aInL        chnget             "SendL"
 aInR        chnget             "SendR"
 aL, aR      reverbsc           aInL, aInR, 0.75, 12000
             outs               aL, aR
             chnclear           "SendL"
             chnclear           "SendR"
endin



; UDO to animate raindrops
opcode animateRaindrop,0,kkio
kTilt,kDens,iMax,iCount xin
Schannel sprintf "raindrop%d",iCount

kPhase phasor random:i(5,10)        ; descent phase for this raindrop
kX     init     random:i(0,290)     ; initial X position (range should match width of panel
if trigger:k(kPhase,0.5,1)==1 then
kX     random     0,290             ; initial X position (range should match width of panel
endif
iY     random     0,320             ; initial Y position. This just ensure that raindrop don't all start at the top
iSize  random     8,20              ; size of raindrop
kY     wrap       kPhase*(50+iSize) - iSize + iY, -iSize, 380 ; moving Y position. Wrapped around according to height of panel.
kT     metro      16
       cabbageSet kT, Schannel, "bounds", kX, kY-50, 1, iSize
       cabbageSet kT, Schannel, "rotate", kTilt, 0, 0
if kDens*iMax < iCount then
       cabbageSet kT, Schannel, "visible", 0
else
       cabbageSet kT, Schannel, "visible", 1
endif
if iCount<iMax then
 animateRaindrop kTilt,kDens,iMax, iCount+1
endif
endop

instr 1000
; create raindrops
 iNRaindrops = 100
 iCount init 0
 while iCount < iNRaindrops do
 ; alpha channel (transparency) is randomised for each raindrop
            SWidget sprintf "bounds(0, 0, 0, 0), alpha(%f), shape(\"ellipse\"), channel(\"raindrop%d\"), colour(255,255,255)", random:i(0,0.8), iCount
            cabbageCreate "image", SWidget
            iCount += 1
 od
  
kTilt  jspline    0.5,0.1,0.2
  animateRaindrop kTilt*gkWind,gkRainDens*gkRainEnv,iNRaindrops
  
  if release:k()==1 then
   kCount = 0
   while kCount<iNRaindrops do
    Schannel sprintfk "raindrop%d",kCount
    cabbageSet 1, Schannel, "bounds", 0,0,0,0
   kCount += 1
   od
  endif
endin

</CsInstruments>

<CsScore>
i 1 0 z
i 999  0 z  ; reverb
i 1000  0 0 ; raindrops
</CsScore>

</CsoundSynthesizer>
