/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; CabbageIsListening.csd
; Iain McCurdy, 2011, 2023

; This example exemplifies the technique of opcode iteration using UDOs to create a mass of oscillators using a small amount of code.
; This technique is introduced and explained in detail by Steven Yi in his article 'Control Flow - Part II' in the summer 2006 issue of the Csound Journal (http://www.csounds.com/journal/2006summer/controlFlow_part2.html).

; In this example 100 vco2 oscillators are created but you can change this number in instrument 1 if you like, increasing it if your system permits it in realtime.
; Each oscillator exhibits its own unique behaviour in terms of its pitch, pulse width and panning.
; The entire mass morphs from a state in which the oscillator pitches slowly glide about randomly to a state in which they hold a fixed pitch across a range of octaves.

; Some commercial synthesizers offer oscillators called 'mega-saws' or something similar. These are normally just clusters of detuned sawtooth waveforms so this is the way in which this could be emulated in Csound.

; The example emulates a familiar sound ident.


; phrase is divided into two main sections: 'glissandos' and 'held note'

; changes made to red-coloured dials only take effect when the entire phrase is restarted (i-rate)
; changes made to green-coloured dials will effect while a phrase is playing (i-rate)


; Number of Voices - number of synth layers
; Reverb           - reverb send amount
; Level            - output level

; Time Scale       - time scaling for glissando section
; Init. Spread     - initial spread of pitches at the beginning of the glissando section
; Glissando Depth  - depth of the glissando modulations
; Glissado Rate    - rate of the glissando modulations (also scaled by 'Time Scale')

; End Duration     - final note hold time
; End Note         - end note basic pitch
; Range            - number of semitones in the looping to create the final chord stack. Normally factors of 12.

<Cabbage>
form caption("Cabbage is Listening") size(1300,155), pluginId("SoCh"), colour(50,50,60), guiMode("queue")

#define DIAL_STYLE_K trackerColour(200,230,200), colour( 70,150, 65), fontColour(200,200,200), textColour(200,200,200),  markerColour(220,220,220), outlineColour(50,50,50), valueTextBox(1)
#define DIAL_STYLE_I trackerColour(230,200,200), colour(200, 60, 65), fontColour(200,200,200), textColour(200,200,200),  markerColour(220,220,220), outlineColour(50,50,50), valueTextBox(1)

button     bounds( 15, 70,  50, 25), text(">",">"), fontColour:0( 50,105,  50), fontColour:1(  5, 55,  5), colour:0( 0,15, 0), colour:1(100,255,100), channel("Play"), latched(1), radioGroup(1)
button     bounds( 70, 70,  50, 25), text("¤","¤"), fontColour:0( 20, 20, 155), fontColour:1(  5,  0,105), colour:0(20,20,55), colour:1(200,200,255), channel("Stop"), latched(1), radioGroup(1), value(1)
label      bounds( 15, 97,  50, 12), text("P L A Y"), align("centre")
label      bounds( 70, 97,  50, 12), text("S T O P"), align("centre")

line     bounds(140, 30,  1,100)

label    bounds(140, 10,320, 12), text("G L O B A L"), align("centre"), fontColour("silver")
rslider  bounds(140, 30,120,110), channel("NVoices"), range(1,200,100,1,1), valueTextBox(1), text("Number of Voices"), $DIAL_STYLE_I
rslider  bounds(240, 30,120,110), channel("Reverb"), range(0,1,0.2), valueTextBox(1), text("Reverb"), $DIAL_STYLE_K
rslider  bounds(340, 30,120,110), channel("Level"), range(0,1,1,0.5), valueTextBox(1), text("Level"), $DIAL_STYLE_K

line     bounds(460, 30,  1,100)

label    bounds(460, 10,420, 12), text("G L I S S A N D O"), align("centre"), fontColour("silver")
rslider  bounds(460, 30,120,110), channel("TimeScale"), range(0.125,8,1,0.5), valueTextBox(1), text("Time Scale"), $DIAL_STYLE_I
rslider  bounds(560, 30,120,110), channel("InitSpread"), range(0,8,2), valueTextBox(1), text("Init. Spread"), $DIAL_STYLE_I
rslider  bounds(660, 30,120,110), channel("GlissDep"), range(0,30,15,0.5), valueTextBox(1), text("Glissando Depth"), $DIAL_STYLE_K
rslider  bounds(760, 30,120,110), channel("GlissRate"), range(0.001,10,0.1,0.25,0.0001), valueTextBox(1), text("Glissando Rate"), $DIAL_STYLE_K

line     bounds(880, 30,  1,100)

label    bounds( 880, 10,420, 12), text("H E L D   C H O R D"), align("centre"), fontColour("silver")
rslider  bounds( 880, 30,120,110), channel("EndNoteDur"), range(0.1,16,2,0.5), valueTextBox(1), text("End Duration"), $DIAL_STYLE_I
rslider  bounds( 980, 30,120,110), channel("EndNote"), range(0,60,0,1,1), valueTextBox(1), text("End Note"), $DIAL_STYLE_K
rslider  bounds(1080, 30,120,110), channel("Range"), range(0,192,96,1,1), valueTextBox(1), text("Range"), $DIAL_STYLE_I
rslider  bounds(1180, 30,120,110), channel("Detune"), range(0,0.1,0.002,0.5,0.0001), valueTextBox(1), text("Detune"), $DIAL_STYLE_I

label bounds(  2,143,100, 12), text("Iain McCurdy 2011"), align("left"), fontColour("Grey")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

ksmps = 32
nchnls = 2
0dbfs = 1


;INITIALISE REVERB SEND VARIABLES
gasendL       init       0
gasendR       init       0

;DEFINE A UDO FOR AN OSCILLATOR VOICE
opcode vcomodule, aa, iikkkkiiii                                                                      ; DEFINE OPCODE FORMAT
 icount,iNVoices,kRange,kEndNote,kGlissDep,kGlissRate,iTimeScale,iEndNoteDur,iInitSpread,iDetune xin  ; DEFINE NAMES FOR INPUT ARGUMENTS
 kvar          jspline    kGlissDep,kGlissRate*iTimeScale,kGlissRate*2*iTimeScale                     ; RANDOM JITTERING OF PITCH
 imorphtime    random     5.5,6.5                                                                     ; TIME TO MORPH FROM GLIDING PITCHES TO STATIC PITCHES WILL DIFFER SLIGHTLY FROM VOICE TO VOICE
 kxfade        linseg     0,7*iTimeScale, 0,imorphtime*iTimeScale, 1-iDetune, iEndNoteDur, 1-iDetune  ; FUNCTION DEFINING MORPH FROM GLIDING TO STATIC VOICES IS CREATED    
 koct          wrap       icount,0,kRange/12                                                          ; BASIC OCTAVE FOR EACH VOICE IS DERIVED FROM VOICE COUNT NUMBER (WRAPPED BETWEEN 0 AND iRange TO PREVENT RIDICULOUSLY HIGH TONES)
 iinitoct      random     0,iInitSpread                                                               ; DEFINES THE SPREAD OF VOICES DURING THE GLIDING VOICES SECTION
 kcps          ntrpol     200*semitone(kvar)*octave(iinitoct),\
                          cpsoct(octmidinn(kEndNote)+koct+0.19),\                                     ; PITCH OFFSET ADDED TO MATCH ORIGINAL THEME
                          kxfade                                                                      ; PITCH (IN CPS) OF EACH VOICE - MORPHING BETWEEN A RANDOMLY GLIDING STAGE AND A STATIC STAGE
 koct          =          octcps(kcps)                                                                ; PITCH CONVERTED TO OCT FORMAT
 kdb           =          (5-koct)*4                                                                  ; DECIBEL VALUE DERIVED FROM OCT VALUE - THIS WILL BE USED FOR 'AMPLITUDE SCALING' TO PREVENT EMPHASIS OF HIGHER PITCHED TONES

 /* SIMPLE VCO */
 kpw           rspline    0.05,0.5,0.4*iTimeScale,0.8*iTimeScale                                      ; RANDOM MOVEMENT OF PULSE WIDTH FOR vco2
 a1            vco2       ampdb(kdb)*(1/(iNVoices^0.5))*1.2,kcps,  4,kpw,0                            ; THE OSCILLATOR IS CREATED
 a2            vco2       ampdb(kdb-12)*(1/(iNVoices^0.5))*1.2,kcps*3,4,kpw,0                         ; OCTAVE+5th OSCILLATOR IS CREATED
 a1            +=         a2                                                                          ; MIXED IN
 
 kPanDep       linseg     0,5*iTimeScale,0,6*iTimeScale,0.5                                           ; RANDOM PANNING DEPTH WILL MOVE FROM ZERO (MONOPHONIC) TO FULL STEREO AT THE END OF THE NOTE
 kpan          rspline    0.5+kPanDep,0.5-kPanDep,0.3*iTimeScale,0.5*iTimeScale                       ; RANDOM PANNING FUNCTION

 ;aL,aR pan2 a1,kpan  ; kpan2 seems a bit CPU expensive...   ; MONO OSCILLATOR IS RANDOMLY PANNED IN A SMOOTH GLIDING MANNER
 aL            =          a1*kpan
 aR            =          a1*(1-kpan)

 amixL, amixR init 0                                                                 

 if icount < (iNVoices-1) then                                                                            ; IF TOTAL VOICE LIMIT HAS NOT YET BEEN REACHED...
  amixL,amixR  vcomodule  icount+1, iNVoices, kRange, kEndNote, kGlissDep,kGlissRate,iTimeScale,iEndNoteDur,iInitSpread,iDetune     ; ...CALL THE UDO AGAIN (WITH THE INCREMENTED COUNTER)
 endif
               xout       amixL+aL,amixR+aR
endop

instr 1
 kPlay       cabbageGetValue  "Play"
 kStop       cabbageGetValue  "Stop"
 kNVoices    cabbageGetValue  "NVoices"
 kTimeScale  cabbageGetValue  "TimeScale"
 kEndNoteDur cabbageGetValue  "EndNoteDur"
 
 if trigger:k(kPlay,0.5,0)==1 then
  event "i",2,0,(18*kTimeScale)+kEndNoteDur,kNVoices
 elseif trigger:k(kStop,0.5,0)==1 then
  turnoff2 2,0,1
 endif
 
endin





instr 2
 kPortTime   linseg           0,0.001,0.05
 iNVoices    =                p4                         ; NUMBER OF VOICES
 kRange      cabbageGetValue  "Range"
 kRange      portk            kRange,kPortTime
 kEndNote    cabbageGetValue  "EndNote"
 kGlissDep   cabbageGetValue  "GlissDep"
 kGlissRate  cabbageGetValue  "GlissRate"
 iTimeScale  cabbageGetValue  "TimeScale"
 kLevel      cabbageGetValue  "Level"
 iEndNoteDur cabbageGetValue  "EndNoteDur"
 iInitSpread cabbageGetValue  "InitSpread"
 iDetune     cabbageGetValue  "Detune"

 icount      init      0                          ; INITIALISE VOICE COUNTER
 aoutL,aoutR vcomodule icount, iNVoices,kRange,kEndNote,kGlissDep,kGlissRate,iTimeScale,iEndNoteDur,iInitSpread,iDetune   ; CALL vcomodule UDO (SUBSEQUENT CALLS WILL BE MADE WITHIN THE UDO ITSELF)
 aoutL       tone      aoutL, 12000               ; SOFTEN HIGH FREQUENCIES
 aoutR       tone      aoutR, 12000                                                       
 aoutL       dcblock   aoutL                      ; REMOVE DC OFFSET FROM AUDIO (LEFT CHANNEL)
 aoutR       dcblock   aoutR                      ; REMOVE DC OFFSET FROM AUDIO (RIGHT CHANNEL)
 
 kenv        linsegr   -90,(1*iTimeScale), -50,(6*iTimeScale), -20,(6*iTimeScale), 0,((p3-16)*iTimeScale*iEndNoteDur/2),  0, (3*iTimeScale), -90, (0.2*iTimeScale), -90 ; AMPLITUDE ENVELOPE THAT WILL BE APPLIED TO THE MIX OF ALL VOICES
 aoutL       =         aoutL*ampdbfs(kenv)         ; APPLY ENVELOPE (LEFT CHANNEL)
 aoutR       =         aoutR*ampdbfs(kenv)         ; APPLY ENVELOPE (RIGHT CHANNEL)
 aClk        cossegr   1,1,0
 aoutL       *=        aClk*kLevel
 aoutR       *=        aClk*kLevel
             outs      aoutL,aoutR                 ;  SEND AUDIO TO OUTPUTS
 kReverb     cabbageGetValue  "Reverb"
 gasendL     =         gasendL+(aoutL*kReverb)     ; MIX SOME AUDIO INTO THE REVERB SEND VARIABLE (LEFT CHANNEL)
 gasendR     =         gasendR+(aoutR*kReverb)     ; MIX SOME AUDIO INTO THE REVERB SEND VARIABLE (RIGHT CHANNEL)
  cabbageSetValue "Stop", k(1), trigger:k(release:k(),0.5,0)
endin

instr 3 ;REVERB INSTRUMENT
 aRvbL,aRvbR reverbsc  gasendL,gasendR,0.82,10000
             outs      aRvbL,aRvbR
             clear     gasendL,gasendR
endin

</CsInstruments>

<CsScore>
i 1 0 3600 ;SYNTH VOICES GENERATING INSTRUMENT
i 3 0 2500 ;REVERB INSTRUMENT
e
</CsScore>

</CsoundSynthesizer>
