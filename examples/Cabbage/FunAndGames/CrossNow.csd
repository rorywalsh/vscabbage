
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; CrossNow.csd
; Written by Iain McCurdy, 2023

; This is a synthetic emulation of the pedestrian crossings in Ireland.

; There are three parts to the sound:
;  1. First the slow intermittent beeping to indicate that the pedestrian should wait and not cross.
;     (the pedestrian can press the grey button to indicate that they wish to cross, but will have to wait some time)
;  2. A quick glissandoing tone acts as a transition between the 'wait' sound and the 'cross now' sound.
;  3. A faster series of shorter, lower-pitched tones indicates that the pedestrian can cross.

; From analysis of the actual machines, the pitch of the 'wait' tone is 1010 Hz, it repeats at 0.52 Hz and the duration of each beep is approximately 0.052 seconds. 
;  Its amplitude envelope is roughly 'gate' (i.e. no attack or decay, only a sustain).
; The transition glissando goes from 3500 to 750 Hz in approximately 0.121 seconds. Its envelope is more of a decay envelope.
; The 'walk now' clicks are 505 Hz tones, 0.035 seconds duration each and repeating at 8.13 Hz.

; A lesser know feature of the Dublin pedestrian crossings is that they monitor external ambient sound levels and adjust the levels of the beeps accordingly.
; For example, when a lorry passes, the beeps will audibly rise in amplitude. This is essentially an envelope follower and has been added to this emulation.

<Cabbage>
form caption("Cross Now") size(300, 520),  pluginId("CrNo"), colour(10,10,10), guiMode("queue")

image     bounds( 15, 15,270,270), shape("ellipse"), colour(  0,  0,155), outlineColour("Grey"), outlineThickness(4)
checkbox  bounds( 60,320,180,180), shape("ellipse"), channel("Button"), colour:0("grey"), colour:1("grey"), latched(0)
checkbox  bounds( 10,300, 60, 60), shape("ellipse"), channel("indic"), colour:0(255,30,30), colour:1(30,255,30), active(0)

; arrow
label     bounds( 51,  30,200,200), text("^")
label     bounds( 50,  42,200,200), text("-")
label     bounds( 59,  42,180,180), text("-")
label     bounds( 70,  42,160,160), text("-")
label     bounds( 30, -70,240,240), text(".")
label     bounds( 31,  -5,240,240), text(".")
label     bounds( 31,  15,240,240), text(".")
label     bounds( 31,  35,240,240), text(".")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -d -m0d --displays
</CsOptions>

<CsInstruments>

ksmps  = 16
nchnls = 2
0dbfs  = 1

giWaitTimeToCross = 6       ; time after the button is pressed that the 'cross now' signal will begin
giCrossTime       = 8       ; duration of entire 'cross now' sequence
giWaitDur         = 0.025   ; duration of each individual 'wait' beep
giWaitFreq        = 1010    ; oscillator frequency of wait beeps
giWaitRate        = 0.52    ; rate of repetition of 'wait' beeps
giGlissDur        = 0.121   ; duration of glissando before 'cross now' sequence
giGlissStart      = 3500    ; oscillator frequency at start of glissando
giGlissEnd        = 750     ; oscillator frequency at end of glissando
giCrossDur        = 0.035   ; duration of each individual 'cross now' click
giCrossRate       = 8.13    ; rate of repetition of 'cross now' clicks
giCrossFreq       = 505     ; oscillator frequency of cross now clicks

instr 1
gkstate init 0  ; 0=wait 1=cross now
kButton  cabbageGetValue  "Button"

; trigger wait beeps
if gkstate==0 then
         schedkwhen       metro:k(giWaitRate,0.5),0,0,2,0,giWaitDur
endif

; wait to cross after pressing button
kDel     delayk           kButton, giWaitTimeToCross

; cross now
if trigger:k(kDel,0.5,0)==1 && gkstate==0 then
         event            "i",3,0,giGlissDur      ; trigger transition glissando
         event            "i",4,giGlissDur+0.109,giCrossTime
 gkstate =                1                       ; cross now
endif

endin

instr 2 ; wait beep
aSig     vco2             0.6, giWaitFreq, 4, 0.5
aEnv     expseg           0.001,0.003,1,p3-0.006,1,0.003,0.001
aSig     *=               aEnv
         chnmix           aSig,"Send"
endin

instr 3 ; transition glissando
kCPS     expon           giGlissStart,p3,giGlissEnd
aSig     vco2            0.6, kCPS, 4, 0.5
aEnv     linseg          0,(0.002), 0.2,p3-0.004 ,0.6,(0.002),0
aSig     *=              aEnv
         chnmix          aSig,"Send"
endin

instr 4 ; triggering of 'walk now' clicks
         cabbageSetValue "Button",0
         cabbageSetValue "indic",1
         schedkwhen      metro:k(giCrossRate),0,0,5,0,giCrossDur
if release:k()==1 then
 gkstate =               0
endif
         cabbageSetValue "indic",0,release:k() ; turn indicator back to red upon conclusion of 'walk now'
endin

instr 5 ; walk now clicks
aSig   vco2              0.6, giCrossFreq, 4, 0.5
aEnv   expseg            0.001,0.003,1,p3-0.003,0.01 ; decay envelope
       chnmix            aSig*aEnv,"Send"
endin

instr 99 ; always on instrument that gathers the various sound components and sends them to the output 
aSig   chnget           "Send"         ; read in all audio signals
       chnclear         "Send"         ; clear 'send' channel to prevent cumulative build up of audio
; envelope follower
aIn    inch             1              ; monitor input (hopefully a built-in microphone)
kRMS   rms              aIn            ; tracks its RMS
kRMS   lagud            kRMS,0.1,4     ; apply lag (damped decay in the tracking signal)
kGain  =                1 + kRMS*10    ; create a gain function to be applied to all audio exiting the instrument
aSig   *=               a(kGain)       ; apply envelope following gain control
; audio output
aSig   =                tanh(aSig*10)  ; distort the audio signal, an important aspect in emulating the actual device
aSig   butlp            aSig,2000      ; low-pass filter the audio signal
       outs             aSig,aSig      ; send to outputs
endin

</CsInstruments>
<CsScore>
i 1  0 z 
i 99 0 z ; audio output
</CsScore>
</CsoundSynthesizer>
