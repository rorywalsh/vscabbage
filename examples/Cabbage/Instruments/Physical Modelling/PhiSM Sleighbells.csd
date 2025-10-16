
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; PhISM Sleighbells
; Iain McCurdy, 2023

; PhISEM (Physically Informed Stochastic Event Modeling)

; Based on the opcode of Perry Cook's physical model of sleighbells, this example adds a number of performance enhancements 
;  that are best accessed from an external MIDI keyboard

; AMPLITUDE         - amplitude control of the opcode. Given certain other settings, such as 'NUMBER' being low, 
;   this may not ramp the sound down to silence. In this eventuality, using the 'LEVEL' control.
; NUMBER            - number of bells
; DAMPING           - amount of energy loss upon each ricochet of a bell (high to low). This equates to the duration of the sound.
;                     setting this fully clockwise will produce a sustaining texture.
; FREQ              - fundamental resonant frequency of the sleighbells
; FREQ.1            - first overtone resonant frequency
; FREQ.2            - first overtone resonant frequency
;  Note that the three frequency parameters are also controlleable by the pitch bend wheel (+/-12 semitones)
; Stereo/Mono       - toggle between completely mono output and broad stereo (unique opcode per channel)
; Vel. to Density   - MIDI key velocity controls density with maximum set by 'NUMBER'
; Vel. to Damping   - MIDI key velocity controls damping with maximum set by 'DAMPING'
; Vel. to Amplitude - MIDI key velocity controls amplitude and a tone control
; Note to Frequency - MIDI key velocity scales 'FREQ', 'FREQ.1', 'FREQ.2'

; ENVELOPE
;  Note that efficacy of the envelope will also be dependent on the setting for DAMPING. If in doubt, increase DAMPING.
;  The envelope is only applied in single note, non-PATTERN mode.
; Att.Time          - Attack time whenever a MIDI key is released
; Rel.Time          - Release time whenever a MIDI key is released

; PATTERN
; In this mode the sleighbells are shaken repeatedly while a note is held
; SPEED             - speed of the Pattern
; ACCENT            - amount by which the first shake is accented (actually subsequent shakes are attenuated)
; Mod.Whl Vel       - modulation wheel on an external MIDI keyboard will scale the velocities of each shake
; Mod.Whl Speed     - modulation wheel on an external MIDI keyboard will scale the 'SPEED' setting

; Level             - an output level control - if the CLIP light flashes red, reduce this control

; The pitch bend wheel will also scale 'FREQ', 'FREQ.1' and 'FREQ.2'
 
; opcode input arguments that don't provide a useful discernible control have been given constants and are not given user control 
;  in order to clarify the interface

<Cabbage>
#define DIAL_PROPERTIES  colour("Pink"), trackerColour("silver"), fontColour("White"), textColour("White"), valueTextBox(1)

form caption("PhISEM Sleighbells") size(1080,235), pluginId("SlBe"), colour(155,  0,  0), guiMode("queue")

;image bounds(15,15,3,3), shape("ellipse"), colour("White")

image bounds(5,5,1070,125), colour(0,0,0,0), outlineThickness(1)
{
rslider  bounds( 10, 25, 60,90), channel("Amp"), range(0,1,0.6,0.5), text("AMPLITUDE"), $DIAL_PROPERTIES
rslider  bounds( 80, 25, 60,90), channel("Num"), range(1,128,50,1,1), text("NUMBER"), $DIAL_PROPERTIES
rslider  bounds(150, 25, 60,90), channel("Damp"), range(0,0.3,0.24,0.5), text("DAMPING"), $DIAL_PROPERTIES
rslider  bounds(220, 25, 60,90), channel("Freq"), range(200,8000,2500,0.5,1), text("FREQ"), $DIAL_PROPERTIES
rslider  bounds(290, 25, 60,90), channel("Freq1"), range(200,8000,5300,0.5,1), text("FREQ.1"), $DIAL_PROPERTIES
rslider  bounds(360, 25, 60,90), channel("Freq2"), range(200,8000,6500,0.5,1), text("FREQ.2"), $DIAL_PROPERTIES
checkbox bounds(430, 20,125,15), channel("StMo"), text("Stereo/Mono"), fontColour:0("White"), fontColour:1("White"), value(1)
checkbox bounds(430, 40,125,15), channel("VelDens"), text("Vel. to Density"), fontColour:0("White"), , fontColour:1("White"), value(0)
checkbox bounds(430, 60,125,15), channel("VelDamp"), text("Vel. to Damping"), fontColour:0("White"), , fontColour:1("White"), value(0)
checkbox bounds(430, 80,125,15), channel("VelAmp"), text("Vel. to Amplitude"), fontColour:0("White"), , fontColour:1("White"), value(1)
checkbox bounds(430,100,125,15), channel("NoteFreq"), text("Note to Frequency"), fontColour:0("White"), , fontColour:1("White"), value(0)
rslider  bounds(560, 25, 60,90), channel("AttTime"), range(0,12,0.01,0.5,0.001), text("ATT.TIME"), $DIAL_PROPERTIES
rslider  bounds(630, 25, 60,90), channel("RelTime"), range(0.01,25,3,0.5,0.01), text("REL.TIME"), $DIAL_PROPERTIES

line     bounds(700, 20,  1,85)

image    bounds(720, 25,250,90), colour(0,0,0,0), channel("PatternControls"), active(0), alpha(0.3)
{
label    bounds(  0, 36,125,15), text("Mod. Wheel to:"), fontColour("White"), align("left")
checkbox bounds(  0, 55,125,15), channel("MWVel"), text("Velocity"), fontColour:0("White"), fontColour:1("White"), value(1)
checkbox bounds(  0, 75,125,15), channel("MWSpd"), text("Speed"), fontColour:0("White"), fontColour:1("White"), value(0)
rslider  bounds(120,  0, 60,90), channel("PatternSpeed"), range(1,30,4,0.5,0.01), text("SPEED"), $DIAL_PROPERTIES
rslider  bounds(190,  0, 60,90), channel("Accent"), range(0,0.9,0.2), text("ACCENT"), $DIAL_PROPERTIES
}
checkbox bounds(718, 20,125,20), channel("Pattern"), text("Play Pattern"), fontColour:0("White"), fontColour:1("White"), value(0)

line     bounds(980, 20,  1,85)

checkbox bounds(995, 10,125,15), channel("Clip"), shape("round"), text("CLIP"), fontColour:0("White"), fontColour:1("White"), value(0), colour("Red");, active(0)
rslider  bounds(995, 25, 60,90), channel("OutAmp"), range(0,1,0.5), text("LEVEL"), $DIAL_PROPERTIES
}

keyboard bounds( 5,145,1070,85)

label    bounds( 5,131,110,12), text("Iain McCurdy |2023|"), fontColour("silver"), align("left")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps = 16
nchnls = 2
0dbfs = 1

massign 0,1 ; send all MIDI to instr 1
initc7 1,1,1 ; mod wheel initialises to maximum


; UDO for Sleighbells
opcode Sleighbells,aa,iii
iNum,iVel,iBend      xin
iRatio      =                   cpsmidinn(iNum)/cpsmidinn(60)
iamp        cabbageGetValue     "Amp"
idettack    =                   0.01
inum        cabbageGetValue     "Num"
if cabbageGetValue:i("VelDens")==1 then ; velocity to density
 inum        *=                  iVel  
endif
idamp       cabbageGetValue     "Damp"
if cabbageGetValue:i("VelDamp")==1 then ; velocity to damping
idamp       *=                  iVel
endif
imaxshake   =                   0
ifreq       cabbageGetValue     "Freq"
ifreq1      cabbageGetValue     "Freq1"
ifreq2      cabbageGetValue     "Freq2"
if cabbageGetValue:i("NoteFreq")==1 then ; velocity to frequency
ifreq       *=                  iRatio
ifreq1      *=                  iRatio
ifreq2      *=                  iRatio
endif
ifreq       *=                  semitone(iBend)
ifreq1      *=                  semitone(iBend)
ifreq2      *=                  semitone(iBend)
iStMo       cabbageGetValue     "StMo"
aL          sleighbells         iamp, idettack , inum, idamp, imaxshake, ifreq, ifreq1, ifreq2 ; amplitude (iamp) needs to be i-rate to be reliable
if iStMo==1 then
 aR	        sleighbells         iamp, idettack , inum, idamp, imaxshake, ifreq, ifreq1, ifreq2 ; amplitude (iamp) needs to be i-rate to be reliable
else
 aR         =                   aL
endif
if cabbageGetValue:i("VelAmp")==1 then ; velocity to amplitude and tone
 aL        *=                  ampdbfs((iVel-1) * 6)
 aL        tone                aL, cpsoct(8+6*iVel)
 aR        *=                  ampdbfs((iVel-1) * 6)
 aR        tone                aR, cpsoct(8+6*iVel)
endif
           xout                aL, aR
endop




instr 1
kOutAmp  cabbageGetValue "OutAmp"
iVel     ampmidi         1          ; note velocity
kBend    pchbend         0,12
iBend    pchbend         0,12
iAttTime cabbageGetValue "AttTime"  ; attack time
iRelTime cabbageGetValue "RelTime"  ; release time
iNum     notnum
iPattern cabbageGetValue "Pattern"

if iPattern==0 then ; single shake
 aL,aR   Sleighbells iNum+iBend, iVel, iBend

 ; Envelope
 aAtt    init       1
 if iAttTime>0 && release:k()=0 then
  aAtt   cossegr     0,iAttTime,1,1,1
 endif
 aRel    expsegr    1,iRelTime,0.001
 aL      *=         aRel*aAtt*kOutAmp
 aR      *=         aRel*aAtt*kOutAmp 
 
         outs       aL,aR
else ; Pattern mode
 kModWhl midic7           1,0,1
 kRate   cabbageGetValue  "PatternSpeed"
 if cabbageGetValue:i("MWSpd")==1 then ; Mod wheel to velocity
  kRate  *=               kModWhl
 endif
 iAccent cabbageGetValue  "Accent"
 kVel    =                iVel*linseg:k(1,0.1,1-iAccent)
 if cabbageGetValue:i("MWVel")==1 then ; Mod wheel to velocity
  kVel   *=               kModWhl
 endif
 kShake  metro       kRate
 kCount  init        0                              ; count the number of shakes
 kVel    =           frac(kCount/2)>0?kVel*0.8:kVel ; strong beats are accented
 ;                                 p4   p5   p6       p7
 schedkwhen kShake,0,0,2,0,3/kRate,iNum,kVel,kOutAmp, kBend
 kCount  +=          kShake                         ; increment shake counter
endif

endin

instr 2
aL,aR   Sleighbells p4,p5,p7
aEnv    expsegr    1,0.2,0.001
aL      *=         aEnv*p6
aR      *=         aEnv*p6
        outs       aL,aR
endin


; UDO to animate snowflakes
opcode animateSnowflake,0,io
iMax,iCount xin
Schannel sprintf "snowflake%d",iCount

kPhase phasor random:i(0.05,0.2)  ; descent phase for this snowflake
iX     random     0,1080          ; initial X position (range should match width of panel
iY     random     0,230           ; initial Y position. This just ensure that snowflake don't all start at the top
iSize  random     1,5             ; size of snowflake
kY     wrap       kPhase*(230+iSize) - iSize + iY, -iSize, 230 ; moving Y position. Wrapped around according to height of panel.
       cabbageSet metro:k(16), Schannel, "bounds", iX, kY, iSize, iSize
if iCount<iMax then
 animateSnowflake iMax, iCount+1
endif
endop

instr 99
 aL,aR   monitor
 if metro:k(1)==1 then
  kPeak   =          0
 endif
 kPeak   peak       aL
 cabbageSetValue "Clip",int(kPeak)

 ; activate,show/deactivate/hide pattern controls
 kPattern   cabbageGetValue "Pattern"
 if changed:k(kPattern)==1 then
  if kPattern==1 then
   cabbageSet k(1),"PatternControls","active",1
   cabbageSet k(1),"PatternControls","alpha",1
  else
   cabbageSet k(1),"PatternControls","active",0
   cabbageSet k(1),"PatternControls","alpha",0.2  
  endif
 endif

; create snowflakes
 iNSnowflakes = 128
 iCount init 0
 while iCount < iNSnowflakes do
 ; alpha channel (transparency) is randomised for each snowflake
            SWidget sprintf "bounds(0, 0, 0, 0), alpha(%f), shape(\"ellipse\"), channel(\"snowflake%d\"), colour(255,255,255)", random:i(0.5,1), iCount
            cabbageCreate "image", SWidget
            iCount += 1
 od
  
  animateSnowflake iNSnowflakes
  
endin

</CsInstruments>  

<CsScore>
i 99 0 z ; clip indicator
</CsScore>

</CsoundSynthesizer>