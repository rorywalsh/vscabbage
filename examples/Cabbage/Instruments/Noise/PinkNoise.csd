
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; PinkNoise.csd
; Written by Iain McCurdy, 2012

; Two opcodes are explored 'pinkish' (methods 1 to 3) and 'pinker' (method 4).

; In all cases, seperate iterations of the opcode are usd for the left and right channels. 
; In the case of pinkish, it can be heard that it produces identical noise so the resultant sound is mono
; Parallel iterations of pinker produce different noise and therefore a stereo effect.

; Descriptions of the four methods:

; 1 = Gardner method (default). 
; 2 = Kellet filter bank. 
; 3 = A somewhat faster filter bank by Kellet, with less accurate response. 
; 4 = Generates pink noise (-3dB/oct response) by the New Shade of Pink algorithm of Stefan Stenzel. //stenzel.waldorfmusic.de/post/pink/

<Cabbage>
form caption("Pink Noise"), size(545,300), pluginId("pnse"), guiMode("queue")
image             bounds(  0,  0,545,300), colour("pink"), shape("rounded"), outlineColour("red"), outlineThickness(4) 
checkbox bounds( 10, 10, 80, 15), text("On/Off"), channel("onoff"), value(0), fontColour:0("black"), fontColour:1("black"), colour("yellow")
combobox bounds( 10, 40, 70, 20), channel("method"), value(1), text("Gardner", "Kellet", "Kellet 2", "Pinker")
rslider  bounds( 85,  5, 70, 85), text("Amplitude"), channel("amp"),      range(0, 1, 0.5, 0.5, 0.001), textColour("black"), fontColour("black"), trackerColour(255,100,100), colour(255,100,100), valueTextBox(1)
rslider  bounds(150,  5, 70, 85), text("N.Bands"),   channel("numbands"), range(4, 32, 20, 1, 1),       textColour("black"), fontColour("black"), trackerColour(255,100,100), colour(255,100,100), valueTextBox(1)
label    bounds( 10, 95, 525, 13), align("left"), channel("description"), text("1. Gardner method"), fontColour("black")

image         bounds(  5,110,535,174), colour(0,0,0,0), outlineThickness(3), outlineColour("DarkGrey"), corners(4)
{
image         bounds(  0,  0,474,174), colour("DarkGrey"), corners(4)
signaldisplay bounds(  2,  2,470,170), alpha(1), displayType("spectroscope"), zoom(-1), signalVariable("aSpec"), channel("sscope"), colour("LightBlue"), backgroundColour(20,20,20), fontColour(0,0,0,0)
label         bounds(  0,  4,470, 16), text("S P E C T R O S C O P E"), align("centre")
checkbox      bounds(  4,  4, 15, 15), channel("SpecOnOff"), value(1), corners(0), colour:0(0,100,00), colour:1(50,255,50)
rslider       bounds(480, 25, 50, 50), channel("SpecGain"), text("GAIN"), range(0,50,4,0.5), textColour("black"), fontColour("black"), trackerColour(255,100,100), colour(255,100,100), valueTextBox(0)
rslider       bounds(480, 95, 50, 50), channel("SpecZoom"), text("ZOOM"), range(1,30,4,1,1), textColour("black"), fontColour("black"), trackerColour(255,100,100), colour(255,100,100), valueTextBox(0)
}

;stereo width
label         bounds(245, 15,250,14), text("STEREO METER"), fontColour(50,50,50)
image         bounds(245, 30,250,30), colour(200,200,200), outlineThickness(0)
image         bounds(369, 31,  2,28), colour(255,150,150), outlineThickness(3), outlineColour("red"), channel("StereoWidth")
image         bounds(245, 30,250,30), colour(0,0,0,0), outlineThickness(10), outlineColour("DarkGrey"), corners(15)
{
}


label    bounds(  4,285, 110, 12), text("Iain McCurdy |2012|"), fontColour("DarkGrey"), align("left")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0 --displays
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   64
nchnls             =                   2
0dbfs              =                   1
                   massign             0,0

instr    1
 konoff            cabbageGetValue     "onoff"                           ; read in on/off switch widget value 
 kmethod           cabbageGetValue     "method"
                   cabbageSet          changed:k(kmethod), "numbands", "visible", kmethod == 1 ? 1 : 0  ; show/hide numbands dial

 
 ; show description of each method
 if changed:k(kmethod)==1 then
  if kmethod==1 then
                   cabbageSet          1, "description", "text", "1. Gardner method."
  elseif kmethod==2 then
                   cabbageSet          1, "description", "text", "2. Kellet filter bank. "
  elseif kmethod==3 then
                   cabbageSet          1, "description", "text", "3. A somewhat faster filter bank by Kellet, with less accurate response. "
  elseif kmethod==4 then
                   cabbageSet          1, "description", "text", "4. Stefan Stenzel's 'New Shade of Pink' algorithm. //stenzel.waldorfmusic.de/post/pink/"
  endif
 endif
                    
  kmethod          =                   kmethod - 1
  knumbands        cabbageGetValue     "numbands"
  kamp             cabbageGetValue     "amp"
  ktrig            changed             kmethod, knumbands                ; GENERATE BANG (A MOMENTARY '1') IF ANY OF THE INPUT VARIABLES CHANGE
  if ktrig==1 then                                                       ; IF AN I-RATE VARIABLE HAS CHANGED
                   reinit              UPDATE                            ; BEGIN A REINITIALISATION PASS FROM LABEL 'UPDATE'
  endif                                                                  ; END OF CONDITIONAL BRANCH
 UPDATE:                                                                 ; LABEL CALLED 'UPDATE'
 imethod           limit               i(kmethod),0,2                    ; prevent initialisation error if method>2 is given
 if kmethod==0 then                                                      ; IF GARDNER METHOD HAS BEEN CHOSEN...
  asigL            pinkish             a(kamp), imethod, i(knumbands)    ; GENERATE PINK NOISE
  asigR            pinkish             a(kamp), imethod, i(knumbands)    ; GENERATE PINK NOISE
 elseif kmethod==1 || kmethod==2  then
  anoise           unirand             2                                 ; WHITE NOISE BETWEEN ZERO AND 2
  anoise           =                   (anoise-1)                        ; OFFSET TO RANGE BETWEEN -1 AND 1
  asigL            pinkish             anoise, imethod                   ; GENERATE PINK NOISE
  asigR            pinkish             anoise, imethod                   ; GENERATE PINK NOISE
  asigL            =                   asigL * kamp                      ; RESCALE AMPLITUDE WITH gkpinkamp
  asigR            =                   asigR * kamp                      ; RESCALE AMPLITUDE WITH gkpinkamp
 else                                                                    ; OTHERWISE (I.E. 2ND OR 3RD METHOD HAS BEEN CHOSEN)
  asigL            pinker                                                ; GENERATE PINK NOISE
  asigR            pinker                                                ; GENERATE PINK NOISE
  asigL            *=                  a(kamp)
  asigR            *=                  a(kamp)
 endif                                                                   ; END OF CONDITIONAL
 rireturn                                                                ; RETURN FROM REINITIALISATION PASS
 
 asigL             *=                  konoff
 asigR             *=                  konoff
 
 ; stereo meter
 kWidth            divz                abs(k(asigL)-k(asigR)), rms:k( asigL + asigR ), 0
 kWidth            lagud               kWidth*50, 0.01, 0.3
 kWidth            limit               kWidth, 0, 248
 kWidth            *=                  konoff
                   cabbageSet          metro:k(16), "StereoWidth", "bounds", 370 - (kWidth*0.5) - 1, 31, 2+kWidth, 28
                   outs                asigL, asigR                      ; SEND AUDIO SIGNAL TO OUTPUT


 ; spectroscope
 kSpecOnOff         cabbageGetValue     "SpecOnOff"
 if kSpecOnOff==0 goto SKIP_SPEC
 kSpecGain          cabbageGetValue     "SpecGain"
 aSpec              =                   asigL * kSpecGain                  ; aSig can't be scaled in the the 'display' line
 kSpecZoom          cabbageGetValue     "SpecZoom"
 kSpecZoom          init                2

 if changed:k(kSpecZoom)==1 then
                    reinit              RESTART_SPECTROSCOPE
 endif
 RESTART_SPECTROSCOPE:
 
 iWSize             =                   8192
 iWType             =                   0 ; (0 = rectangular)
 iDBout             =                   0 ; (0 = magnitude, 1 = decibels)
 iWaitFlag          =                   0 ; (0 = no wait)
 iMin               =                   0
 iMax               =                   iWSize / i(kSpecZoom)
                    dispfft             aSpec, 0.001, iWSize, iWType, iDBout, iWaitFlag, iMin, iMax
                    rireturn
 SKIP_SPEC:
 asigL = 0

endin


</CsInstruments>

<CsScore>
i 1 0 z    ; instrument that reads in widget data
</CsScore>

</CsoundSynthesizer>