
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; phaser1.csd
; Written by Iain McCurdy, 2012.

; Encapsulation of the phaser1 opcode

; When activated from a MIDI keyboard, amplitude and feedback can be shaped across the duration of notes using envelopes. This way, this example can be used as a synthesiser.

; A spectrum display is provided for analysis of the phaser's frequency response. Try using the white noise source for this feature.
; The slider on the right of the spectrum analyser adjust the display gain.
; The spectrum can be deactivated to conserve CPU.

<Cabbage>
form caption("phaser1") size(400,565), pluginId("phs1"), guiMode("queue")
image        pos(0, 0), size(400,565), colour(80,20,20), shape("rounded"), outlineColour("white"), outlineThickness(4) 

#define RSLIDER_ATTRIBUTES colour("Blue"), colour(200,150,150), textColour("LightGrey"), trackerColour(250,200,200), valueTextBox(1)

label     bounds( 10, 11, 55, 12), text("INPUT"), fontColour("LightGrey")
checkbox  bounds( 10, 26, 55, 12), text("Live"), fontColour:0("LightGrey"), fontColour:1("LightGrey"), channel("input"),  value(1), radioGroup(1)
checkbox  bounds( 10, 41, 55, 12), text("Noise"), fontColour:0("LightGrey"), fontColour:1("LightGrey"), channel("input2"), value(0), radioGroup(1)
rslider   bounds( 60, 11, 70, 80),  text("Frequency"), channel("freq"), range(20.0, 5000, 160, 0.25, 0.1) $RSLIDER_ATTRIBUTES
rslider   bounds(125, 11, 70, 80),  text("Feedback"), channel("feedback"), range(-0.99, 0.99, 0.9) $RSLIDER_ATTRIBUTES
rslider   bounds(190, 11, 70, 80), text("N.Ords."), channel("ord"), range(1, 256, 32, 0.5,1) $RSLIDER_ATTRIBUTES
rslider   bounds(255, 11, 70, 80), text("Mix"), channel("mix"), range(0, 1.00, 1) $RSLIDER_ATTRIBUTES
rslider   bounds(320, 11, 70, 80), text("Level"), channel("level"), range(0, 1.00, 0.07,0.5) $RSLIDER_ATTRIBUTES
}

label     bounds( 5, 60, 60, 12), text("FREQ."), fontColour("white")
combobox  bounds( 5, 73, 60, 20), channel("FreqSource"), value(1), text("Dial", "MIDI")

keyboard bounds(  5,100,390, 80)

image bounds( 10,185,380,110), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label   bounds(  0,  5,380, 13), text("M I D I : A M P L I T U D E   E N V E L O P E")
rslider bounds( 45, 20, 70, 80),  text("Attack"), channel("ampAtt"), range(0, 5, 0.38, 0.5) $RSLIDER_ATTRIBUTES
rslider bounds(115, 20, 70, 80),  text("Decay"), channel("ampDec"), range(0, 5, 0, 0.5) $RSLIDER_ATTRIBUTES
rslider bounds(185, 20, 70, 80),  text("Sustain"), channel("ampSus"), range(0, 1, 1, 0.5) $RSLIDER_ATTRIBUTES
rslider bounds(255, 20, 70, 80),  text("Release"), channel("ampRel"), range(0, 5, 0.014, 0.5) $RSLIDER_ATTRIBUTES
}

image bounds( 10,300,380,110), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label   bounds(  0,  5,380, 13), text("M I D I : F E E D B A C K   E N V E L O P E")
rslider bounds( 25, 20, 70, 80),  text("Minimum"), channel("fbMin"), range(0, 1, 0.5, 0.5) $RSLIDER_ATTRIBUTES
rslider bounds( 95, 20, 70, 80),  text("Attack"), channel("fbAtt"), range(0, 5, 0.119, 0.5) $RSLIDER_ATTRIBUTES
rslider bounds(165, 20, 70, 80),  text("Decay"), channel("fbDec"), range(0, 5, 0, 0.5) $RSLIDER_ATTRIBUTES
rslider bounds(235, 20, 70, 80),  text("Sustain"), channel("fbSus"), range(0, 1, 1, 0.5) $RSLIDER_ATTRIBUTES
rslider bounds(305, 20, 70, 80),  text("Release"), channel("fbRel"), range(0, 5, 3.583, 0.5) $RSLIDER_ATTRIBUTES
}

image    bounds( 10,415,380,130), colour(0,0,0,0), outlineThickness(1), corners(5)
{
checkbox bounds(  5,  5,120, 15), channel("SpecOnOff"), text("Spectrum On/Off"), colour("lime"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3) value(1)
gentable bounds(  5, 25,350,100), tableNumber(104), channel("OutSpec"), outlineThickness(1), tableColour(  0,0,200), tableBackgroundColour(255,255,255), tableGridColour(0,0,0,20), ampRange(0, 1,104), outlineThickness(0), fill(1) ;, sampleRange(0, 1024) 
vslider  bounds(357, 20, 20,115), channel("DispGain"), range(0,20,1,0.5)
}

label   bounds( 10, 547,120, 13), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =                   2     ; NUMBER OF CHANNELS (2=STEREO)
0dbfs              =                   1

;Author: Iain McCurdy (2012)

                   massign             0, 2

giFFT              =                   2048
giTabLen           =                   giFFT/2 + 1                                ; table size for pvsmaska spectral envelope 
giOutSpec          ftgen               104, 0, giTabLen, -2, 0                    ; initialise table
giSilence          ftgen               105, 0, giTabLen, -2, 0                    ; initialise table

instr    1
  ; READ WIDGETS...
  kFreqSource      cabbageGetValue     "FreqSource"
  gkfreq           cabbageGetValue     "freq"    
  gkfeedback       cabbageGetValue     "feedback"
  gkord            cabbageGetValue     "ord"
  gkmix            cabbageGetValue     "mix"
  gklevel          cabbageGetValue     "level"
  gkinput          cabbageGetValue     "input"

 if changed:k(kFreqSource)==1 then
  if kFreqSource==1 then
                   event               "i", 2, 0, -1  ; turn on instr 2 with a held note
  else
                   event               "i", -2, 0, -1 ; turn off instr 2
  endif
 endif
 
endin


instr    2
 kporttime         linseg              0,0.01,0.03                ; CREATE A VARIABLE THAT WILL BE USED FOR PORTAMENTO TIME

 ; envelopes
 iampAtt           cabbageGetValue     "ampAtt"
 iampDec           cabbageGetValue     "ampDec"
 iampSus           cabbageGetValue     "ampSus"
 iampRel           cabbageGetValue     "ampRel"
 ifbMin            cabbageGetValue     "fbMin"
 ifbAtt            cabbageGetValue     "fbAtt"
 ifbDec            cabbageGetValue     "fbDec"
 ifbSus            cabbageGetValue     "fbSus"
 ifbRel            cabbageGetValue     "fbRel"
 kampEnv           cossegr             0, iampAtt + 0.01, 1, iampDec + 0.01, iampSus, iampRel + 0.05, 0
 kfbEnv            linsegr             ifbMin, ifbAtt  + 0.01, 1, ifbDec + 0.01, ifbSus, ifbRel + 0.05, ifbMin

 ; MIDI AND GUI INTEROPERABILITY
 iMIDIflag         =                   0                    ; IF MIDI ACTIVATED = 1, NON-MIDI = 0
                   mididefault         1, iMIDIflag         ; IF NOTE IS MIDI ACTIVATED REPLACE iMIDIflag WITH '1'
 
 if iMIDIflag==1 then                                       ; IF THIS IS A MIDI ACTIVATED NOTE...
  icps             cpsmidi
  kfreq            =                   icps
 else
  kfreq            =                   gkfreq
    kfreq          portk               kfreq, kporttime     ; PORTAMENTO IS APPLIED TO 'SMOOTH' SLIDER MOVEMENT    
 endif                                                      ; END OF THIS CONDITIONAL BRANCH
 
 if gkinput==1 then
  asigL,asigR      ins
 else
  asigL             pinker
  asigR             pinker
 endif
 asigL   *= kampEnv
 asigR   *= kampEnv

    kSwitch        changed             gkord                                     ; GENERATE A MOMENTARY '1' PULSE IN OUTPUT 'kSwitch' IF ANY OF THE SCANNED INPUT VARIABLES CHANGE. (OUTPUT 'kSwitch' IS NORMALLY ZERO)
    if kSwitch==1 then                                                           ; IF I-RATE VARIABLE CHANGE TRIGGER IS '1'...
                   reinit              UPDATE                                    ; BEGIN A REINITIALISATION PASS FROM LABEL 'UPDATE'
    endif                                                                        ; END OF CONDITIONAL BRANCH
    UPDATE:                                                                      ; BEGIN A REINITIALISATION PASS FROM HERE
    aphaserl       phaser1             asigL, kfreq, gkord, gkfeedback * kfbEnv  ; PHASER1 IS APPLIED TO THE LEFT CHANNEL
    aphaserr       phaser1             asigR, kfreq, gkord, gkfeedback * kfbEnv  ; PHASER1 IS APPLIED TO THE RIGHT CHANNEL
    rireturn                                                                     ; RETURN FROM REINITIALISATION PASS TO PERFORMANCE TIME PASSES
    amixL          ntrpol              asigL, aphaserl, gkmix
    amixR          ntrpol              asigR, aphaserr, gkmix
                   outs                amixL * gklevel, amixR * gklevel          ; PHASER OUTPUT ARE SENT TO THE SPEAKERS



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