
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Ball_in_a_Box.csd
; Written by Iain McCurdy, 2015

; Ball in a Box is a physical model reverb based on the notional idea of a ball (sound) within a bax (reverberant space)

; Room Size (X, Y, Z)         -    room size in metres
; Source Location (X, Y, Z)   -    location of the sound as a ratio 0 to 1 of the entire space
; Receive Location (X, Y, Z)  -    receiver location - in metres - from the centre of the space
; Reverb Decay                -    main decay of the resonator (default: 0.99)
; High Frequency Diffusion    -    is the coefficient of diffusion at the walls, which regulates the amount of diffusion (0-1, where 0 = no diffusion, 1 = maximum diffusion - default: 1)
; Direct Signal Attenuation   -    the attenuation of the direct signal (0-1, default: 0.5)
; Early Reflection Diffusion  -    the attenuation coefficient of the early reflections (0-1, default: 0.8)
; Pick-up Separation          -    the distance in meters between the two pickups (your ears, for example - default: 0.3)

; location of the source sound and the receiver should remain within the 'box' (room) therefore it will be sensible to express this as a ratio 
;  of the dimension of the room
 

<Cabbage>
form caption("Ball in a Box") size(1230,395), pluginId("BABO"), colour(100,100,120) guiMode("queue")

image   bounds(  3,  5,394,125), outlineColour("white"), outlineThickness(1), colour(0,0,0,0), plant("RoomSize") {
hslider bounds(  5, 10,390, 30), textColour(white), channel("rx"), range(0.1,20.00, 5), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5, 33,390, 12), text("Room Size X"), fontColour(200,200,200)
hslider bounds(  5, 45,390, 30), textColour(white), channel("ry"), range(0.1,20.00, 6), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5, 68,390, 12), text("Room Size Y"), fontColour(200,200,200)
hslider bounds(  5, 80,390, 30), textColour(white), channel("rz"), range(0.1,20.00, 4), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5,103,390, 12), text("Room Size Z"), fontColour(200,200,200)
}

image   bounds(  3,135,394,125), outlineColour("white"), outlineThickness(1), colour(0,0,0,0), plant("SourceLocation") {
hslider bounds(  5, 10,390, 30), textColour(white), channel("srcx"), range(0,1.00, 0.131), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5, 33,390, 12), text("Source Location X"), fontColour(200,200,200)
hslider bounds(  5, 45,390, 30), textColour(white), channel("srcy"), range(0,1.00, 0.243), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5, 68,390, 12), text("Source Location Y"), fontColour(200,200,200)
hslider bounds(  5, 80,390, 30), textColour(white), channel("srcz"), range(0,1.00, 0.717), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5,103,390, 12), text("Source Location Z"), fontColour(200,200,200)
}

image   bounds(  3,265,394,125), outlineColour("white"), outlineThickness(1), colour(0,0,0,0), plant("ReceiveLocation") {
hslider bounds(  5, 10,390, 30), textColour(white), channel("rcvx"), range(-10,10,7.331), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5, 33,390, 12), text("Receive Location X"), fontColour(200,200,200)
hslider bounds(  5, 45,390, 30), textColour(white), channel("rcvy"), range(-10,10,-3.973), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5, 68,390, 12), text("Receive Location Y"), fontColour(200,200,200)
hslider bounds(  5, 80,390, 30), textColour(white), channel("rcvz"), range(-10,10, 6.791), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5,103,390, 12), text("Receive Location Z"), fontColour(200,200,200)
}

image   bounds(403,  5,394,105), outlineColour("white"), outlineThickness(1), colour(0,0,0,0), plant("Mixer") {
hslider bounds(  5, 10,390, 30), textColour(white), channel("mix"), range(0, 1.00, 0.5), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5, 35,390, 12), text("Dry/Wet Mix"), fontColour(200,200,200)
hslider bounds(  5, 55,390, 30), textColour(white), channel("level"), range(0, 1.00, 0.5), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5, 80,390, 12), text("Level"), fontColour(200,200,200)
}

image   bounds(403,115,394,275), outlineColour("white"), outlineThickness(1), colour(0,0,0,0), plant("Filters") {
hslider bounds(  5, 20,390, 30), textColour(white), channel("decay"), range(0.01, 1.00, 0.3), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5, 45,390, 12), text("Reverb Decay"), fontColour(200,200,200)
hslider bounds(  5, 60,390, 30), textColour(white), channel("diff"), range(0.01, 1.00, 1), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5, 85,390, 12), text("High Frequency Diffusion"), fontColour(200,200,200)
hslider bounds(  5,100,390, 30), textColour(white), channel("hydecay"), range(0.001, 1.00, 0.1), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5,125,390, 12), text("High Frequency Decay"), fontColour(200,200,200)
hslider bounds(  5,140,390, 30), textColour(white), channel("direct"), range(0, 1.00, 0.5), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5,165,390, 12), text("Direct Signal Attenuation"), fontColour(200,200,200)
hslider bounds(  5,180,390, 30), textColour(white), channel("early_diff"), range(0, 1.00, 0.8), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5,205,390, 12), text("Early Reflection Diffusion"), fontColour(200,200,200)
hslider bounds(  5,220,390, 30), textColour(white), channel("rdistance"), range(0.001, 9.00, 0.3), colour(220,220,250), trackerColour(240,210,170)
label   bounds(  5,245,390, 12), text("Pick-up Separation"), fontColour(200,200,200)
}

label   bounds(  5,378,120, 11), text("Iain McCurdy |2015|"), align("left"), fontColour("Silver")

image bounds(810,  5, 410, 385), colour("black")

; room
image bounds(0,0,0,0), colour(0,0,0,0), outlineThickness(1), channel("FrontWall")
image bounds(0,0,0,0), colour(0,0,0,0), outlineThickness(1), channel("BackWall")
image bounds(0,0,0,0), colour(0,0,0,0), outlineThickness(1), rotate(4.28261,0,0), channel("Line1")
image bounds(0,0,0,0), colour(0,0,0,0), outlineThickness(1), rotate(4.28261,0,0), channel("Line2")
image bounds(0,0,0,0), colour(0,0,0,0), outlineThickness(1), rotate(4.28261,0,0), channel("Line3")
image bounds(0,0,0,0), colour(0,0,0,0), outlineThickness(1), rotate(4.28261,0,0), channel("Line4")

; source
;image bounds(110,210, 1, 1), channel("Pole"), shape("square"), colour("grey")
;image bounds(1100,300, 5, 5), channel("Ballsrc"), shape("ellipse"), colour("red")


</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =    32
nchnls       =    2
0dbfs        =    1

;Author: Iain McCurdy (2015)

instr    1    ; read widgets
 gkrx           cabbageGetValue   "rx"        
 gkry           cabbageGetValue   "ry"        
 gkrz           cabbageGetValue   "rz"        
 gksrcx         cabbageGetValue   "srcx"      
 gksrcy         cabbageGetValue   "srcy"      
 gksrcz         cabbageGetValue   "srcz"      
 gkdiff         cabbageGetValue   "diff"      
 gkdecay        cabbageGetValue   "decay"     
 gkrdistance    cabbageGetValue   "rdistance" 
 gkhydecay      cabbageGetValue   "hydecay"   
 gkdirect       cabbageGetValue   "direct"    
 gkearly_diff   cabbageGetValue   "early_diff"
 gkrcvx         cabbageGetValue   "rcvx"      
 gkrcvy         cabbageGetValue   "rcvy"      
 gkrcvz         cabbageGetValue   "rcvz"
 gkmix          cabbageGetValue   "mix"
 gklevel        cabbageGetValue   "level"
 

; Box (room) graphics
kWidth  = int(gkrx * 10)
kHeight = int(gkry * 10)
kLength = int(gkrz * 10 * 0.75)

kV_OS   =               kLength * 0.4 ;50
kH_OS   =               sqrt(kLength^2 - kV_OS^2)

kX      =               820  ; starting X location
kY      =               150 ; starting Y location

kX      +=              100 - (kWidth * 0.5)
kY      +=              100 - (kHeight * 0.5)

kAng       =            taninv2:k(kH_OS, kV_OS) + $M_PI

kT         =            changed:k(kX,kY,kWidth,kHeight,kLength)

           cabbageSet   kT,"FrontWall","bounds",kX,kY,kWidth,kHeight
           cabbageSet   changed:k(kX,kY,kWidth,kHeight,kV_OS,kH_OS),"BackWall","bounds",kX+kH_OS, kY-kV_OS, kWidth,kHeight

           cabbageSet   kT,"Line1","rotate", 0, 0, 0
           cabbageSet   kT,"Line1","bounds", kX, kY, 1, kLength
           cabbageSet   kT,"Line1","rotate", kAng, 0, 0

           cabbageSet   kT,"Line2","rotate", 0, 0, 0
           cabbageSet   kT,"Line2","bounds", kX+kWidth, kY, 1, kLength
           cabbageSet   kT,"Line2","rotate", kAng, 0, 0

           cabbageSet   kT,"Line3","rotate", 0, 0, 0
           cabbageSet   kT,"Line3","bounds", kX, kY+kHeight, 1, kLength
           cabbageSet   kT,"Line3","rotate", kAng, 0, 0

           cabbageSet   kT,"Line4","rotate", 0, 0, 0
           cabbageSet   kT,"Line4","bounds", kX+kWidth, kY+kHeight, 1, kLength
           cabbageSet   kT,"Line4","rotate", kAng, 0, 0


; ball source graphics
;cabbageSet changed:k(kX,kY,kWidth,kHeight,kLength,gksrcx,gksrcy,gksrcz),"Ballsrc","bounds", 0, 0, 0

endin

instr    2    ;REVERB
 aL,aR        ins    ; read live input
 
 ;aL   diskin2 "/Users/iainmccurdy/Documents/iainmccurdy.org/CsoundRealtimeExamples/SourceMaterials/loop.wav",1,0,1
 ;aR = aL
 
 ;outs aL,aL
 if changed:k(gkrx, gkry, gkrz, gksrcx, gksrcy, gksrcz, gkdiff, gkdecay, gkrdistance, gkhydecay, gkdirect, gkearly_diff, gkrcvx, gkrcvy, gkrcvz)==1 then
              reinit    UPDATE                       ; BEGIN A REINITIALIZATION PASS FROM LABEL 'UPDATE'
 endif                                               ; END OF CONDITIONAL BRANCHING
 UPDATE:                                             ; A LABEL
 kRamp        linseg              0,0.05,0,0.05,1
 irx          init                i(gkrx)            ; CREATE I-RATE VARIABLES FROM K-RATE VARIABLES
 iry          init                i(gkry)            ; CREATE I-RATE VARIABLES FROM K-RATE VARIABLES
 irz          init                i(gkrz)            ; CREATE I-RATE VARIABLES FROM K-RATE VARIABLES
 ksrcx        init                i(gksrcx) * irx    ; THE ACTUAL LOCATION OF THE SOURCE SOUND IS DEFINED RELATIVE TO THE SIZE OF THE ROOM
 ksrcy        init                i(gksrcy) * iry    ; THE ACTUAL LOCATION OF THE SOURCE SOUND IS DEFINED RELATIVE TO THE SIZE OF THE ROOM
 ksrcz        init                i(gksrcz) * irz    ; THE ACTUAL LOCATION OF THE SOURCE SOUND IS DEFINED RELATIVE TO THE SIZE OF THE ROOM
 idiff        init                i(gkdiff)          ; CREATE I-RATE VARIABLES FROM K-RATE VARIABLES
 giBaboVals   ftgen               1, 0, 8, -2, i(gkdecay), i(gkhydecay), i(gkrcvx), i(gkrcvy), i(gkrcvz), i(gkrdistance), i(gkdirect), i(gkearly_diff)
 aRvbL, aRvbR babo                aL + aR, ksrcx, ksrcy, ksrcz, irx, iry, irz, idiff, giBaboVals    ; BABO REVERBERATOR
              rireturn                               ; RETURN TO PERFORMANCE TIME PASSES
              outs                ((aRvbL*gkmix)+(aL*(1-gkmix)))*gklevel*kRamp, ((aRvbR*gkmix)+(aR*(1-gkmix)))*gklevel*kRamp
endin

        
</CsInstruments>

<CsScore>
i 1 0   3600    ; graphics
i 2 0.1 3600    ; REVERB INSTRUMENT PLAYS FOR 1 HOUR (AND KEEPS PERFORMANCE GOING)
</CsScore>

</CsoundSynthesizer>
