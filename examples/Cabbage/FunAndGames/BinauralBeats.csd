
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; BinauralBeats.csd
; Written by Iain McCurdy, 2023

; Binaural beat or brain entrainment is a theoretical technique wherein playing detuned tone to either ear through headphones causes beating effects within the brain that
;  encourages various brain states, depending on the frequency gap between the two tones.

; The key frequency gaps are referred to affecting 'theta', 'alpha', 'beta' and 'gamma' brain waves.

; DELTA - 0-4 Hz - deep sleep and relaxation.
; THETA - 4-8 Hz - REM sleep, reduced anxiety, relaxation, as well as meditative and creative states.
; ALPHA - 8-14 Hz - encourage relaxation, promote positivity, and decrease anxiety.
; BETA  - 14-30 Hz - increased concentration and alertness, problem solving, and improved memory.
; GAMMA - >30 Hz - maintenance of arousal while awake.

; On/Off                   - turn the audio on and off
; Amplitude                - amplitude of the two oscillators
; Fundamental (Hz)         - fundamental frequency upon which the frequencies of both tones are derived
; Right Channel Difference - difference (in hertz) of the tone in the right channel.
; Flip Channels            - swaps the frequencies of the left and right channels. 
;                             This is done by modifying 'Fundamental (Hz)' and 'Right Channel Difference'

; Delta/Theta/Alha/Beta/Gamma
; Buttons that indicate the wave type description connected with the  currently defined frequency difference between the tow osiclaltors
; These buttons can also be clicked which shunts the 'Right Channel Difference (Hz)" to correspond to the minimum boundary of that range.

; The waveform output present the mixed sum of the two wave which gives some indication of the amplitude modulation that should be experienced.

<Cabbage>
form caption("Binaural Beats - USE HEADPHONES!") size(500, 375),  pluginId("BiBe"), colour(0,0,0,0), guiMode("queue")
button   bounds( 10, 50, 70, 25), fontColour:0(50,50,50), fontColour:1(205,255,205), colour:0(0,10,0), colour:1(0,150,0), text("On","On"), channel("OnOff"), latched(1), value(0), corners(5)
rslider  bounds( 80, 10,100, 100), channel("AmpdB"), text("Amplitude (dBFS)") range(-60, 0, -30,1,1), valueTextBox(1), textBox(1)
nslider  bounds(190, 10,100, 40), channel("Fund"), text("Fundamental (Hz)") range(1, 5000, 110 ,1, 1), valueTextBox(1), textBox(1)
nslider  bounds(310, 10,150, 40), channel("Diff"), text("Right Channel Difference (Hz)") range(-100, 100, 6 , 1, 0.1), valueTextBox(1), textBox(1)
button   bounds(335, 55,100, 25), fontColour:0(100,100,100), fontColour:1(205,205,205), colour:0(0,10,0), colour:1(240,100,100), text("Flip Channels","Flip Channels"), channel("FlipChns"), latched(0), value(0)

image    bounds( 70,120,350, 42), colour(0,0,0,0) 
{
button   bounds(  0,  0, 70, 25), fontColour:0(50,50,50), fontColour:1(205,255,205), colour:0(0,10,0), colour:1(240,100,100), text("Delta","Delta"), channel("Delta"), latched(1), value(0), radioGroup(1) 
label    bounds(  0, 27, 70, 15), text("0-4 Hz")
button   bounds( 70,  0, 70, 25), fontColour:0(50,50,50), fontColour:1(205,255,205), colour:0(0,10,0), colour:1(170, 60,190), text("Theta","Theta"), channel("Theta"), latched(1), value(1), radioGroup(1) 
label    bounds( 70, 27, 70, 15), text("4-8 Hz")
button   bounds(140,  0, 70, 25), fontColour:0(50,50,50), fontColour:1(205,255,205), colour:0(0,10,0), colour:1(200,200,100), text("Alpha","Alpha"), channel("Alpha"), latched(1), value(0), radioGroup(1) 
label    bounds(140, 27, 70, 15), text("8-14 Hz")
button   bounds(210,  0, 70, 25), fontColour:0(50,50,50), fontColour:1(205,255,205), colour:0(0,10,0), colour:1(110,160,170), text("Beta","Beta"), channel("Beta"), latched(1), value(0), radioGroup(1) 
label    bounds(210, 27, 70, 15), text("14-30 Hz")
button   bounds(280,  0, 70, 25), fontColour:0(50,50,50), fontColour:1(205,255,205), colour:0(0,10,0), colour:1( 80,210,160), text("Gamma","Gamma"), channel("Gamma"), latched(1), value(0), radioGroup(1) 
label    bounds(280, 27, 70, 15), text(">30 Hz")
}

texteditor wrap(1), readOnly(1), colour(0,0,0,0), bounds(70, 165, 350, 40), text(""), channel("info"), align("centre"), mode("multi"), fontSize(16), fontColour(170, 60,190)

; bevel
image         bounds(  5,208,490,160), colour(0,0,0,0), outlineThickness(10), outlineColour("Silver"), corners(20)
{
; grid
gentable      bounds(  5,  5,480,150), tableNumber(1),  tableGridColour("white"), fill(0), tableColour(0,0,0,0)
; oscilloscope
signaldisplay bounds(  5,  5,480,150), colour("LightBlue"), updateRate(50), alpha(0.85), displayType("waveform"), backgroundColour("Black"), zoom(-1), signalVariable("aosc"), channel("display")
image         bounds(  5, 79,480,  1), colour(100,100,100) ; x-axis indicator
}

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -d -m0d --displays
</CsOptions>

<CsInstruments>

ksmps = 16
nchnls = 2
0dbfs = 1

giWave    ftgen    0, 0, 100,-17, 0,0, 4,1,  8,2,  14,3,  30,4

i_        ftgen    1,0,4096,2,0

instr 1
kPortTime linseg           0,0.001,0.05
kAmpdB    cabbageGetValue  "AmpdB"
kAmpdB    portk            kAmpdB, kPortTime
kOnOff    cabbageGetValue  "OnOff"
kOnOff    portk            kOnOff, kPortTime
kFund     cabbageGetValue  "Fund"
kFund     portk            kFund, kPortTime
kDiff     cabbageGetValue  "Diff"
kWave     table            abs(kDiff), giWave
; set buttons and info
if changed:k(kWave)==1 then
 if kWave==0 then
          cabbageSetValue  "Delta",k(1)
          cabbageSet       k(1),"info","fontColour",240,100,100
          cabbageSet       k(1),"info","text","Aids deep sleep and relaxation."
 elseif kWave==1 then
          cabbageSetValue  "Theta",k(1)
          cabbageSet       k(1),"info","fontColour",170, 60,190
          cabbageSet       k(1),"info","text","REM sleep. Reduces anxiety, aids relaxation and enhances meditative and creative states."
 elseif kWave==2 then
          cabbageSetValue  "Alpha",k(1) 
          cabbageSet       k(1),"info","fontColour",200,200,100
          cabbageSet       k(1),"info","text","Encourages relaxation, promotes positivity, and decreases anxiety."
 elseif kWave==3 then
          cabbageSetValue  "Beta",k(1) 
          cabbageSet       k(1),"info","fontColour",110,160,170
          cabbageSet       k(1),"info","text","Increases concentration and alertness, helps with problem solving, and improves memory."
 elseif kWave==4 then
          cabbageSetValue  "Gamma",k(1) 
          cabbageSet       k(1),"info","fontColour", 80,210,160
          cabbageSet       k(1),"info","text","Helps sustain alertness and focus. Aids learning and training."
 endif
endif

kFlipChns cabbageGetValue  "FlipChns"
if trigger:k(kFlipChns,0.5,0)==1 then
          cabbageSetValue  "Diff",-kDiff
          cabbageSetValue  "Fund",kFund+kDiff
endif
           
kDelta  cabbageGetValue  "Delta"
kTheta  cabbageGetValue  "Theta"
kAlpha  cabbageGetValue  "Alpha"
kBeta   cabbageGetValue  "Beta"
kGamma  cabbageGetValue  "Gamma"

if changed:k(kDelta,kTheta,kAlpha,kBeta,kGamma)==1 then
 if kDelta==1 then
        cabbageSetValue  "Diff",k(2)
 elseif kTheta==1 then
        cabbageSetValue  "Diff",k(6)
 elseif kAlpha==1 then
        cabbageSetValue  "Diff",k(11)
 elseif kBeta==1 then
        cabbageSetValue  "Diff",k(21)
 elseif kGamma==1 then
        cabbageSetValue  "Diff",k(35)
 endif
endif
                      
kDiff   portk            kDiff, kPortTime
; create the two oscillators
a1      poscil           a(kOnOff), kFund
a2      poscil           a(kOnOff), kFund + kDiff

; OSCILLOSCOPE
aosc    =                (a1 + a2) * ampdbfs(kAmpdB/6 - 6) ; input to oscilloscope is a mix of the two oscillators
        display          aosc, 0.05

        outs             a1 * ampdbfs(kAmpdB), a2 * ampdbfs(kAmpdB)

endin

</CsInstruments>
<CsScore>
i 1 0 z
</CsScore>
</CsoundSynthesizer>
