    
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; phaser.csd
; Written by Iain McCurdy, 2012, 2024

; Input - choose audio input between:
;  1. Live
;  2. Noise
; Frequency  - fundamental frequency of the phaser effect
; Port.      - portamento smoothing applied to changes made to frequency, Q and Separation
; Q          - 'quality' (resonance) of the filters
; N.Ords.    - number of ordinates of the phaser
; Sep. Mode  - choose from two separation modes:
;  1. Equal 
;  2. Power
; Separation - amplitude of separation. Results of changing this will manifest differently based on choice of separation mode.
; Feedback   - amount of output signal fed back into the input, emphasising the phaser effect

; LFO - an LFO can be applied to Frequency value used by the phaser 
; Depth      - depth of the LFO (in octaves)
; Rate       - rate/speed/frequency of the LFO in hertz
; Shape      - shape of the LFO modulation. Choose from:
;              1. Sine
;              2. Tri (triangle)
;              3. Saw (sawtooth, modulation above Frequency setting)
;              4. Ramp (modulation above Frequency setting)
;              5. Sq.Bi. (bipolar square wave)
;              6. Sq.Uni. (unipolar square wave)
;              7. S&H (random sample and hold
;              8. Wob. (random wobble, rspline opcode)

;"Sine","Tri","Saw","Ramp","Sq.Bi.","Sq.Uni.","S&H","Wob."), $FONT_COLOUR
; Mix        - crossfade between the dry and wet (phaser) signal
; Level      - output level

; A spectrum display is provided for analysis of the phaser's frequency response. Try using the white noise source for this feature.
; The spectrum can be deactivated to conserve CPU.

<Cabbage>
form caption("phaser2"), size(950,260), pluginId("phs2"), guiMode("queue")
image             bounds(0, 0,950,260), colour(80,80,105), shape("rounded"), outlineColour("white"), outlineThickness(4) 
#define SLIDER_STYLE colour(100,100,200), trackerColour(silver), textColour("silver"), fontColour("silver"), valueTextBox(1)
#define FONT_COLOUR fontColour("silver"), fontColour:0("silver"), fontColour:1("silver")
label    bounds( 15, 15, 55, 12), text("INPUT"), $FONT_COLOUR
checkbox bounds( 15, 30, 55, 12), text("Live"),  $FONT_COLOUR, channel("input"),  value(0), radioGroup(1)
checkbox bounds( 15, 45, 55, 12), text("Noise"), $FONT_COLOUR, channel("input2"), value(1), radioGroup(1)
rslider  bounds( 70, 10, 90, 90), text("Frequency"),  channel("freq"),     range(20.0, 5000, 100, 0.25), $SLIDER_STYLE
rslider  bounds(140, 10, 90, 90), text("Port."),  channel("port"),     range(0, 30, 0.1, 0.5,0.01), $SLIDER_STYLE
rslider  bounds(210, 10, 90, 90), text("Q"),          channel("q"),        range(0.01,10,1,0.5), $SLIDER_STYLE
rslider  bounds(280, 10, 90, 90), text("N.Ords."),    channel("ord"),      range(1, 256, 8, 0.5,1), $SLIDER_STYLE
label    bounds(370, 20, 80, 13), text("Sep. Mode:"), $FONT_COLOUR
combobox bounds(370, 35, 80, 25), channel("mode"), value(1), text("Equal", "Power"), $FONT_COLOUR
rslider  bounds(450, 10, 90, 90), text("Separation"), channel("sep"),      range(-3, 3.00, 1), $SLIDER_STYLE
rslider  bounds(520, 10, 90, 90), text("Feedback"),   channel("feedback"), range(-0.99, 0.99, 0.9), $SLIDER_STYLE

image    bounds(610, 10,180, 95), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label    bounds(  0,  5,180, 13), text("L F O"), fontColour("white")
rslider  bounds(  5, 20, 70, 70), text("Amp."),   channel("LFODepth"), range(0, 1, 0), $SLIDER_STYLE
rslider  bounds( 55, 20, 70, 70), text("Rate"),   channel("LFORate"), range(0.001, 50, 1, 0.33), $SLIDER_STYLE
label    bounds(115, 25, 60, 13), text("Shape"), $FONT_COLOUR
combobox bounds(115, 40, 60, 18), channel("LFOShape"), value(1), text("Sine","Tri","Saw","Ramp","Sq.Bi.","Sq.Uni.","S&H","Wob."), $FONT_COLOUR
}


rslider  bounds(790, 10, 90, 90), text("Mix"),        channel("mix"),      range(0, 1.00, 1), $SLIDER_STYLE
rslider  bounds(860, 10, 90, 90), text("Level"),      channel("level"),    range(0, 1.00, 0.2), $SLIDER_STYLE

image    bounds( 10,110,930,130), colour(0,0,0,0), outlineThickness(1), corners(5)
{
checkbox bounds(  5,  5,120, 15), channel("SpecOnOff"), text("Spectrum On/Off"), colour("lime"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3) value(1)
gentable bounds(  5, 25,900,100), tableNumber(104), channel("OutSpec"), outlineThickness(1), tableColour(  0,0,200), tableBackgroundColour(255,255,255), tableGridColour(0,0,0,20), ampRange(0, 1,104), outlineThickness(0), fill(1) ;, sampleRange(0, 1024) 
vslider  bounds(907, 20, 20,115), channel("DispGain"), range(0,20,1,0.5)
}



label   bounds( 10, 242,120, 13), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =     32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls       =     2    ; NUMBER OF CHANNELS (2=STEREO)
0dbfs        =     1

;Author: Iain McCurdy (2012)



giFFT              =                   2048
giTabLen           =                   giFFT/2 + 1                                ; table size for pvsmaska spectral envelope 
giOutSpec          ftgen               104, 0, giTabLen, -2, 0                    ; initialise table
giSilence          ftgen               105, 0, giTabLen, -2, 0                    ; initialise table




instr    1
kport              cabbageGetValue     "port"
kRampUp            linseg              0, 0.001, 1
kfreq              cabbageGetValue     "freq"
kfreq              portk               kfreq, kRampUp * kport

; LFO
kLFODepth          cabbageGetValue     "LFODepth"
kLFORate           cabbageGetValue     "LFORate"
kLFOShape          cabbageGetValue     "LFOShape"
kLFOShape          init                1
if kLFOShape==1 then ; sine
 kLFO               lfo                 kLFODepth, kLFORate, 0
elseif kLFOShape==2 then ; tri
 kLFO               lfo                 kLFODepth, kLFORate, 1
elseif kLFOShape==3 then ; saw
 kLFO               lfo                 kLFODepth, kLFORate, 5
elseif kLFOShape==4 then ; ramp
 kLFO               lfo                 kLFODepth, kLFORate, 4
elseif kLFOShape==5 then ; sq.bi.
 kLFO               lfo                 kLFODepth, kLFORate, 2
elseif kLFOShape==6 then ; sq.uni.
 kLFO               lfo                 kLFODepth, kLFORate, 3
elseif kLFOShape==7 then ; s&h
 kLFO               randh               kLFODepth, kLFORate
elseif kLFOShape==8 then ; wobble
 kLFO               jspline             kLFODepth, kLFORate*0.5, kLFORate*2
endif
kfreq               *=                  2 ^ kLFO

; check sounding freq
;a1                 poscil              0.2, kfreq
;                   outs                a1, a1

kq                 cabbageGetValue     "q"
kq                 portk               kq, kRampUp * kport
kmode              cabbageGetValue     "mode"
kmode              init                1
kmode              init                i(kmode) - 1
ksep               cabbageGetValue     "sep"
ksep               portk               ksep, kRampUp * kport
kfeedback          cabbageGetValue     "feedback"
kord               cabbageGetValue     "ord"
kmix               cabbageGetValue     "mix"
klevel             cabbageGetValue     "level"
kinput             cabbageGetValue     "input"
if kinput==1 then
 asigL,asigR       ins
else
 asigL             pinker
 asigR             pinker
endif
if    changed:k(kord,kmode)==1 then
                   reinit              UPDATE
endif
UPDATE:
aphaserl           phaser2             asigL, kfreq, kq, kord, kmode, ksep, kfeedback
aphaserr           phaser2             asigR, kfreq, kq, kord, kmode, ksep, kfeedback
rireturn

aphaserl           dcblock2            aphaserl
aphaserr           dcblock2            aphaserr

amixL              ntrpol              asigL, aphaserl, kmix
amixR              ntrpol              asigR, aphaserr, kmix
                   outs                amixL * klevel, amixR * klevel

; SPECTRUM OUT GRAPH
kSpecOnOff        cabbageGetValue     "SpecOnOff"
kDispGain         cabbageGetValue     "DispGain"
if kSpecOnOff==1 then
 fOut              pvsanal             (aphaserl+aphaserr)*5*kDispGain, giFFT, giFFT/4, giFFT, 0  
 fBlur             pvsblur             fOut, 0.5, 0.5
 iTabLen           =                   giFFT/2 + 1                                ; table size for pvsmaska spectral envelope 
 i_                ftgen               giOutSpec, 0, iTabLen, -2, 0                    ; initialise table
 iClockRate        =                   16
 kClock            metro               iClockRate                                ; reduce rate of updates
 if  kClock==1 then                                                              ; reduce rate of updates
   kflag            pvsftw              fBlur, giOutSpec
                    cabbageSet          kClock, "OutSpec", "tableNumber", giOutSpec 
 endif
endif
if trigger:k(kSpecOnOff,0.5,1)==1 then
 tablecopy giOutSpec, giSilence
                   cabbageSet          k(1), "OutSpec", "tableNumber", giOutSpec 
endif

endin
        
</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
