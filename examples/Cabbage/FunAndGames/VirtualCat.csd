/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Virtual Cat.csd
; Written by Iain McCurdy 2023

; Procedural audio emulation of a cat mewing.
; It is created using synchronous granular synthesis.
; Two controls are provided, the second of which is actually controlling four parameters of the granular synthesis
; Whininess - this is the time gap between mews. When at maximum whininess there will be no time gap between mews.
; Age       - a reflection of the age of the cats based on changing 
;               1. the fundamental frequency of the mew
;               2. the formant location
;               3. the bandwidth (grain duration)
;               4. the duration of the mew

; a button toggles between 'Let the cat out' and 'Let the cat in'
; If you let the cat out it will stop mewing but after a short time it will return and start mewing  wanting to be let in again.
; And so the cycle continues...

; You can stroke the cat by rubbing the microphone on your computer and it will start purring and stop mewing. 
;  You can only stroke the cat when it is inside.

<Cabbage>
form caption("Virtual Cat") size(300,250), colour(220,220,230), pluginId("Catt"), guiMode("queue")

#define DIAL_STYLE trackerColour(170,170,190), colour( 170, 180,180), fontColour(20,20,20), textColour(20,20,20),  markerColour( 20,20,30), outlineColour(50,50,50)

image   bounds( 60, 20, 50, 61), colour(0,0,0,0), alpha(0), channel("Cat")
{
image   bounds(  0,11,50,50), shape("ellipse"), colour("black")
image   bounds(  0, 0,20,50), shape("ellipse"), colour("black")
image   bounds( 30, 0,20,50), shape("ellipse"), colour("black")
}

button  bounds(173,  8, 84, 84), text("Let the cat out", "Let the cat in"), channel("InOut"), alpha(0), colour:0( 55,55,55,30), colour:1( 55,55,55,30), fontColour:0("Red"), fontColour:1("Red"), corners(40)

; hidden controls
rslider bounds(165,105, 70,100) channel("Dur"), text("Duration"), range(0.4,2,1,0.5), visible(0)
rslider bounds(245,105, 70,100) channel("Formant"), text("Formant"), range(0.5,1.5,1,0.5), visible(0)
rslider bounds(325,105, 70,100) channel("Band"), text("Bandwidth"), range(0.25,2,1,0.5), visible(0)
rslider bounds(405,105, 70,100) channel("Pitch"), text("Pitch"), range(0.25,4,1,0.55), visible(0)
rslider bounds(485,105, 70,100) channel("Speed"), text("Speed"), range(0.125,8,1,0.55), visible(0)
rslider bounds(565,105, 70,100) channel("Depth"), text("Depth"), range(0,2,1,0.55), visible(0)

; DIY vertical sliders
image bounds( 45,100, 80,100), colour(50,50,50), channel("panel1")
image bounds( 45,180, 80, 10), colour("Grey"), channel("widget1")
label bounds( 45,200, 80, 15), text("WHININESS"), fontColour(20,20,20)

image bounds(175,100, 80,100), colour(50,50,50), channel("panel2")
image bounds(175,130, 80, 10), colour("Grey"), channel("widget2")
label bounds(175,200, 80, 15), text("AGE"), fontColour(20,20,20)

label bounds(  5,230, 290, 15), text("Stroke the cat by rubbing the microphone..."), fontColour(20,20,20)

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -d -+rtmidi=NULL -M0 -m0d
</CsOptions>

<CsInstruments>
; Initialize the global variables. 
ksmps  =     32
nchnls =     2
0dbfs  =     1

       seed  0

; source waveforms
giSine       ftgen      0, 0, 4096, 10, 1               ; a sine wave
giHanning    ftgen      0, 0, 4096, 20, 2, 1            ; a hanning window

giDur        ftgen      0, 0, 4,-2,  0.8,   1, 2, 2
giFormant    ftgen      0, 0, 4,-2,  1.18,  1, 0.5, 0.5
giBand       ftgen      0, 0, 4,-2,  0.952, 1, 1.3,1.3
giPitch      ftgen      0, 0, 4,-2,  2.348, 1, 0.25,0.25

opcode DIYVSlider,k,kkkSS
kMOUSE_DOWN_LEFT,kMOUSE_X,kMOUSE_Y,Spanel,Swidget xin
; widget attributes
iWidgetBounds[]  cabbageGet      Swidget, "bounds"
iWidgWid         =               iWidgetBounds[2]
iWidgHei         =               iWidgetBounds[3]
kWidgX           init            iWidgetBounds[0]
kWidgY           init            iWidgetBounds[1]

; panel 'bounds' attributes
iPanelBounds[]   cabbageGet      Spanel, "bounds"
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
 kMovingFlag     =               1
endif

; if we are allowed to move the widget (i.e. moving flag is '1')...
if kMovingFlag==1 then
 kWidgY          limit           kMOUSE_Y-iWidgHei, iPanelY, iPanelY+iPanelHei-iWidgHei
 kVal            =               1 - ((kWidgY - iPanelY) / (iPanelHei-iWidgHei))
                 cabbageSet      changed:k(kMOUSE_X,kMOUSE_Y), Swidget, "bounds", kWidgX, kWidgY, iWidgWid, iWidgHei ; move the widget to the new location whenever the mouse coordinates have changed
endif

; If the mouse left button is released, 'moving' should be deactivated
if trigger:k(kMOUSE_DOWN_LEFT,0.5,1)==1 then
 kMovingFlag     =               0
endif

xout kVal
endop



instr        1 ; always on

; read in mouse attributes
kMOUSE_DOWN_LEFT cabbageGetValue "MOUSE_DOWN_LEFT"
kMOUSE_X         cabbageGetValue "MOUSE_X"
kMOUSE_Y         cabbageGetValue "MOUSE_Y"

gkWhininess      DIYVSlider      kMOUSE_DOWN_LEFT,kMOUSE_X,kMOUSE_Y,"panel1","widget1"

kAge             DIYVSlider      kMOUSE_DOWN_LEFT,kMOUSE_X,kMOUSE_Y,"panel2","widget2"
kAge             *=              2

; set parameters via hidden controllers driven by master DIY slider
                 cabbageSetValue "Dur", tablei:k(kAge,giDur), changed:k(kAge)
                 cabbageSetValue "Formant", tablei:k(kAge,giFormant), changed:k(kAge)
                 cabbageSetValue "Band", tablei:k(kAge,giBand), changed:k(kAge)
                 cabbageSetValue "Pitch", tablei:k(kAge,giPitch), changed:k(kAge)

;start mewing
event_i "i",2,0,-1

; let the cat in/out
gkInOut          cabbageGetValue "InOut"

if changed:k(gkInOut)==1 then
                 turnoff2        2,0,1                   ; turnoff current cat
                 event           "i",2,random:k(2,5),-1  ; schedule the next cat
endif

endin

instr            2
kTimeGap         =               ((1 - gkWhininess) * 2) ^ 2
kDur             cabbageGetValue "Dur"
gkFormant        cabbageGetValue "Formant"
gkBand           cabbageGetValue "Band"
gkPitch          cabbageGetValue "Pitch"
gkSpeed          cabbageGetValue "Speed"
gkDepth          cabbageGetValue "Depth"
kGapOS           rspline         1, 1.2, 0.5, 0.7

; sense microphone
aIn              inch            1
kRMS             rms             aIn
kRMS             lagud           kRMS,1,2
if active:k(p1+1)>0 then
 kRMS = 0
endif
kMewPurr         =               kRMS>0.05? 1 : 0

;                event_i "i", 3, 0, (0.5 + exprand:i(0.1))*i(kDur)
if kMewPurr==0 || gkInOut==1 then                     ; mewing
                 turnoff2        50,0,1
                 schedkwhen      k(1), kTimeGap*kGapOS, 1, 3, 0, (0.5 + exprand:k(0.1))*kDur
elseif kMewPurr==1 && active:k(3)==0 && gkInOut==0 then
                 schedkwhen      k(1), 0, 1, 50, 0, 3600  ; purring
endif
             
             
kAlpha           linsegr         0, 1, 1, 0.2, 0
                 cabbageSet      changed:k(kAlpha), "Cat", "alpha", kAlpha
kAlpha           linsegr         0, 0.5, 0, 1, 1, 0, 0
kFlash           oscil           0.5, 0.75
                 cabbageSet      changed:k(kAlpha,kFlash), "InOut", "alpha", kAlpha*(kFlash+0.5)
endin

instr        3
kAmp             expsegr         0.001, rnd(0.1), 1, p3-0.1, rnd(0.02)+0.03, 0.1, 0.001  ; amplitude

; grain density defines the fundamental of cat's vocal cords
kDens            rspline         650/gkDepth, 800*gkDepth, 2*gkSpeed, 3*gkSpeed          ; random wobble 
kDensEnv         expsegr         0.3, rnd(0.1), 1, 0.1, 0.01                             ; envelope
iDensStat        random          0.9, 1.1                                                ; random static value for each miaow
kDens            *=              iDensStat * gkPitch * kDensEnv                          ; calculate density
kDensEnv         expseg          0.5, 0.1, 1, p3-0.2, 1, 0.1, 0.9
kDens            *=              kDensEnv
         
kPhs             =               0
kPmd             =               0
kGDur            =               0.0018*gkBand                                           ; grain size: larger values for narrower formant bandwidth, smaller values for wider bandwidth

; formant
kFormantOff      =               50
iAtt             random          0.05, 0.15                                              ; time it takes to 'scoop' up to sustained formant frequency 
kFormant         expseg          1500, p3*iAtt, 3500, 0.2, 2500, p3*(1-iAtt) -0.2, 1500  ; grain pitch (in hertz). The formant of the mew.

; two formants are created with slightly different formant movements
kFormantRnd      rspline         0.8/gkDepth, 1.4*gkDepth, 2*gkSpeed, 3*gkSpeed
aForm1           grain3          kFormant*kFormantRnd*gkFormant, kPhs, kFormantOff, kPmd, kGDur, kDens, 3600, giSine, giHanning, 0, 0, 0, 8

kFormantRnd      rspline         0.8/gkDepth, 1.4*gkDepth, 2*gkSpeed, 3*gkSpeed
aForm2           grain3          kFormant*kFormantRnd*gkFormant, kPhs, kFormantOff, kPmd, kGDur, kDens, 3600, giSine, giHanning, 0, 0, 0, 8

aSig             =               sum:a(aForm1,aForm2)*kAmp*0.4
if gkInOut==1 then ; cat is outside
 aSig            butlp           aSig*2,1000
 aSig            butlp           aSig,1000
 aSig            buthp           aSig, 200
                 chnmix          aSig, "Send"
 aSig            *=              0.3
endif
                 outs            aSig, aSig
endin




; purring
instr 50
kRate       init       1.25
kTrig       metro      kRate * (1-release:k())
kBreath     init       1
gkLPF       expsegr    0.01,0.5,1,1,0.01

if kTrig==1&&kBreath==1 then
 kBreath    =          0
 kRate      random     2.5,4.3     ;2.9
            event      "i",p1+1,0,1/kRate,28,random(7000,14000)
elseif kTrig==1&&kBreath==0 then
 kBreath    =          1
 kRate      random     1.01,1.29     ;1.25
            event      "i",p1+1,0,1/kRate,28,random(400,600)
endif

endin


instr 51
kTrig      metro   p4 * randomi:k(0.9,1,0.2)
kEnv       linsegr    0,0.05,1,0.05,0
           schedkwhen kTrig,0,0,p1+1,0,0.033,kEnv,p5*random(0.7,1.1)
endin

instr 52

aNoise pinker
a1     reson  aNoise,5000,2000,1
a2     reson  aNoise, 570,100,1
a3     reson  aNoise, 160, 80,1
aNoise sum    a1*0.2,a2,a3
aEnv   expseg 0.001,0.01,1,p3-0.01,0.001
aNoise *=   aEnv*0.4*p4
aNoise butlp aNoise,p5*gkLPF
       outs    aNoise,aNoise
endin







instr 99 ; reverb
aIn          chnget     "Send"
             chnclear   "Send"
aL,aR        reverbsc   aIn,aIn,0.5,4000
             outs       aL,aR
endin

</CsInstruments>

<CsScore>
i 1  0 z
i 99 0 z
</CsScore>

</CsoundSynthesizer>

