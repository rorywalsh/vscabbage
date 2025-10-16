
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Ball Strum.csd
; Written by Iain McCurdy, 2014, 2024

; A moving xypad pointer plucks virtual strings stretched across its surface.
; Audio is produced using a simple physical model.
; Movement in the y direction therefore controls pitch. 
; Movement in the x direction varies pluck position (harmonic makeup) and panning location.

; Direction of strum can affect the pitch produced.
; Several scales are offered as options as well as simply defining the interval gap between adjacent strings.

; Notes         -    number of notes/strings/subdivisions triggered along the y-axis of the xypad
; Scale         -    choose between using the 'Spacing' dial to define the scale or one of three preset scales: major, minor, pentatonic.
; Spacing       -    spacing between adjacent notes in semitones or fractions thereof (dial mode)
; Offset        -    global note offset (note number)
; Shift         -    shift in semitones applied to notes when triggered by a descending widget
; Polyphony     -    polyphony  limit (to preserve CPU buffer). Oldest notes are removed if polyphony limit is exceeded.
; Sustain       -    how much Sustain there is in the resonance of the strings. 
; Level         -    output level

; Include Edges -    if this checkbox activated, the upper and lower boundaries of the XY pad will also trigger notes
	
; The instrument also senses ball velocity and this is interpretted as amplitude and brightness in the sound produced.

<Cabbage>
form caption("Ball Strum") size(720,565), pluginId("strm"), colour(230,220,220), guiMode("queue")

#define SLIDER_STYLE valueTextBox(1), textBox(1), colour(220,210,210), trackerColour(255,255,100), textColour(20,40,70), fontColour("DarkSlateGrey")

xypad    bounds(  0,  0,720,500), colour(0,0,0), ballColour("silver") channel("x", "y"), rangeX(0, 1.00, 0), rangeY(0, 1, 0), fontColour(0,0,0,0)
 
image    bounds(  0,435,720,130), colour(230,220,220)
{
rslider  bounds(  0,  0, 80,100), channel("notes"),     text("Notes"), range(1, 50, 10,1,1), $SLIDER_STYLE
label    bounds( 80, 25, 50, 14), text("Scale"), fontColour("DarkSlateGrey") 
combobox bounds( 80, 40, 50, 20), items("Dial","Maj","Min","Pent"), channel("Scale"), value(1)
rslider  bounds(130,  0, 80,100), channel("spacing"),   text("Spacing"), range(0.001, 12.00, 2,1,0.001), $SLIDER_STYLE
rslider  bounds(215,  0, 80,100), channel("offset"),    text("Offset"), range(12, 72, 48,1,1), $SLIDER_STYLE
rslider  bounds(300,  0, 80,100), channel("shift"),     text("Shift"), range(-24, 24, 12, 1, 0.001), $SLIDER_STYLE
rslider  bounds(385,  0, 80,100), channel("PolyLimit"), text("Polyphony"), range(1, 24, 15,1,1), $SLIDER_STYLE
rslider  bounds(470,  0, 80,100), channel("Sustain"),   text("Sustain"), range(0.8, 0.9999, 0.995, 8, 0.0001), $SLIDER_STYLE
rslider  bounds(555,  0, 80,100), channel("Damping"),       text("Damping"), range(500, 20000, 12000,0.5,1), $SLIDER_STYLE
rslider  bounds(640,  0, 80,100), channel("lev"),       text("Level"), range(0, 1.00, 0.3), $SLIDER_STYLE
checkbox bounds(  5,110,110, 16), text("Include Edges"), colour("yellow"), channel("IncludeEdges"),  value(1), fontColour:0("DarkSlateGrey"), fontColour:1("DarkSlateGrey")
}

label    bounds(580,550,135,11), text("Iain McCurdy |2014|"), fontColour("DarkGrey"), align("right")


</Cabbage>

<CsoundSynthesizer>
<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps      =     32
nchnls     =     2
0dbfs      =     1

gisine                ftgen             0, 0, 4096, 10, 1 ; sine wave
gaRvbSendL,gaRvbSendR init              0                 ; initialise reverb stereo send global audio signal
gkactive              init              0                 ; number of active notes

giMaj                 ftgen             1, 0, -7, -2,  0, 2, 4, 5, 7, 9, 11
giMin                 ftgen             2, 0, -7, -2,  0, 2, 3, 5, 7, 8, 11
giPent                ftgen             3, 0, -5, -2,  0, 3, 5, 7, 10

instr        1
 giXYPadBounds[]   cabbageGet           "x", "bounds"
 giWid             =                    giXYPadBounds[2]
 gkScale           cabbageGetValue      "Scale"
                   cabbageSet           changed:k(gkScale), "spacing", "active", gkScale == 1 ? 1 : 0
                   cabbageSet           changed:k(gkScale), "spacing", "alpha", gkScale == 1 ? 1 : 0.3
 kY                cabbageGetValue      "Y"
                   cabbageSet           changed:k(kY), "test", "bounds", 0, kY, 640, 1

 kx                cabbageGetValue      "x"
 ky                cabbageGetValue      "y"
 
 ; velocity
 kVertDir          init                 0                  ; set initial (arbitrary) state for vertical direction (0=bottom to top, 1=top to bottom)
 kyDel             delayk               ky, 0.1
 kyDiff            =                    abs(kyDel - ky)
 kVel              limit                0.1 + kyDiff, 0, 1
  
 gknotes           cabbageGetValue      "notes"
 gknotes           init                 10
 gkoffset          cabbageGetValue      "offset"           ; note number offset
 gkspacing         cabbageGetValue      "spacing"          ; note spacing (in semitones or fraction thereof
 gkshift           cabbageGetValue      "shift"            ; note shift applied to downwardly triggered notes
 gkPolyLimit       cabbageGetValue      "PolyLimit"        ; polyphony limit
 gklev             cabbageGetValue      "lev" 
 kIncludeEdges     cabbageGetValue      "IncludeEdges"
 kIncludeEdges     init                 0
 
 
 ktrig1            =                    0                  ; ktrig1 and ktrig2 can be added to ktrig to include triggerings at the boundaries
 ktrig2            =                    0
 kPrevY            init                 0

 ky                =                    ky * (gknotes + 1 - 0.001)  ; ky transformed to be a value from 1 to gknotes + 1

 ; UPPER AND LOWER BARRIERS 
 if kVertDir==0 && ky > gknotes then                       ; if vertical direction is bottom to top and we are next to the lower boundary 
  ktrig1           trigger              ky,kPrevY,1        ; if current y position is less than previous y position - i.e. top edge barrier has been bounced against - generate a trigger
  if ktrig1==1 then                                        ; if bounce against top edge has been detected...
   kVertDir        =                    1                  ; change direction
  endif
 elseif kVertDir==1 && ky<1  then                          ; if vertical direction is top to bottom and we are next to upper boundary
  ktrig2           trigger              ky,kPrevY,0        ; if current y position is greater than previous y position - i.e. bottom edge barrier has been bounced against - generate a trigger
  if ktrig2==1 then                                        ; if bounce against bottom edge has been detected...
   kVertDir        =                    0                  ; change direction
  endif
 endif 
 kPrevY            =                    ky                 ; previous y position equals current y position (for the next k pass)

 ktrig             changed              int(ky)            ; note triggers when integers change
 if kIncludeEdges==1 then
  ktrig            +=                   ktrig1 + ktrig2    ; mix in upper and lower boundary triggers
 endif
 ;                                                   p1 p2 p3 p4         p5  p6        p7
                   schedkwhen           ktrig, 0, 0, 2, 0, 2, round(ky), kx, kVertDir, kVel



; STRING GRAPHICS
; create strings
 iMaxNStrings      =                   52 ; maximum possible number of strings (including boundaries)
 iCount            =                   0
 while iCount <= iMaxNStrings do
 SWidget           sprintf             "bounds(0, -10, 440, 1), channel(\"string%d\"), colour(255,255,255,50)", iCount
                   cabbageCreate       "image", SWidget
 iCount            +=                  1
 od

 if changed:k(gknotes,kIncludeEdges)==1 then
                   reinit              UPDATE_STRINGS
 endif
 UPDATE_STRINGS:
 ; rehide all strings
 iCount            =                   0
 while iCount <= iMaxNStrings do
  Schan            sprintf             "string%d", iCount
                   cabbageSet          Schan, "bounds", 0, 0, 0, 0 ; hidden to begin with
 iCount            +=                  1
 od
 
 ; position required strings
 iCount            =                   i(kIncludeEdges) == 1 ? 0 : 1
 iLim              =                   i(kIncludeEdges) == 1 ? (i(gknotes)+1) : i(gknotes)
 while iCount <= iLim do
  iY               =                   ( (iCount) * ((415-8)/(i(gknotes)+1)) ) + 8
  Schan            sprintf             "string%d", iCount
                   cabbageSet          Schan, "bounds", 0, iY, giWid, 2
 iCount            +=                  1
 od

endin


; a plucked string model with inputs for sustain, damping, pluck position and pickup position
opcode UDOpluck, a, iiiikk
iPlk,iFund,iVel,iPickup,kRefl,kDamping xin
setksmps 1
aPlk               linseg            0, (1/iFund)*iPlk, 1, (1/iFund)*(1-iPlk), 0
aPlk               tone              aPlk, 20000*iVel
aBuf               delayr            iPickup/iFund + 0.1
aTap1              deltapi           iPickup/iFund
aTap2              deltapi           1/iFund
aTap2              tone              aTap2, kDamping
                   delayw            aPlk*iVel + (aTap2 * kRefl)
                   xout              (aTap2 - aTap1)
endop



instr    2    ; harmonic pluck sound
 iVel              =                   limit:i((p7^2)*3,0,1)
 if changed:k(gknotes)==1 && timeinstk:k()>1 then ; if number of notes is changed by the user it will be necessary to update the Y location of the string used in the agitation 
  turnoff
 endif
 ; animate string plucks
 RESET_ANIMATION:
 inotes            cabbageGetValue     "notes"                                                ; number of notes currently on the harp
 iNum              =                   inotes - p4 + 1                                        ; note index number of this string (widget number 0 - n, not MIDI note number)
 iY                =                   ( (iNum) * ((415-8)/(inotes+1)) ) + 8                  ; Y location of this string
 Schan             sprintf             "string%d", iNum                                       ; channel string for graphic of this string
 iDir              =                   (-p6 * 2) + 1                                          ; pluck direction  down=-1 up=1
 iAgDur            =                   4                                                      ; duration of string agitation
 kAgEnv            expon               2, iAgDur, 0.1                                         ; string agitation amplitude envelope
 kAgitate          poscil              kAgEnv*iDir*(1+iVel*2), 20                         ; string agitation amplitude function
                   cabbageSet          metro:k(32), Schan, "bounds", 0, iY+kAgitate, giWid, 2 ; update string with agitation movement
 rireturn
 
 if release:k()==1 then
                   cabbageSet          1, Schan, "bounds", 0, iY, giWid, 2
 endif 
 p3                =                   30
  
 ; polyphony control
 gkactive          init                i(gkactive) + 1        ; INCREMENT NOTE COUNTER
 if gkactive > i(gkPolyLimit) then                            ; IF POLYPHONY IS EXCEEDED (THROUGH THE ADDITION OF NEW NOTE)
                   turnoff                                    ; REMOVE THIS NOTE
 endif
 if trigger:k(release:k(),0.5,0)==1 then        
  gkactive         =                   gkactive - 1           ;...DECREMENT ACTIVE NOTES COUNTER
 endif

 ; create note number
 if i(gkScale)==1 then
  inum              limit               i(gkoffset) + (p4 * i(gkspacing)) + (p6 * i(gkshift)),0,127
 else
  iScale            =                   i(gkScale) - 1                                   ; derive scale number
  iOct              =                   int(p4 / ftlen(iScale))                          ; derive octave transposition
  iNote             table               p4, iScale, 0, 0, 1                              ; derive semitone transposition
  inum              =                   (iOct*12) + iNote + i(gkoffset) + (p6 * i(gkshift)) ; derive note number for this string
 endif
 aAtt              linseg              0, 0.015, 1                                       ; soften attack
 aRel              linsegr             1, 0.05, 0                                        ; soften release
 iPlk              =                   p5                                                ; point at which to pluck the string
 iDtn              random              -0.05, 0.05                                       ; random detune
 kRefl             cabbageGetValue     "Sustain"
 kDamping          cabbageGetValue     "Damping"
 aSig              UDOpluck            iPlk,cpsmidinn(inum+iDtn),iVel,0.2,kRefl,kDamping
 kGlobEnv          line                1, p3, 0
 aSig              *=                  aRel * kGlobEnv
 aSig              dcblock2            aSig
 aL,aR             pan2                aSig, p5                                          ; random panning   
                   outs                aL, aR                                            ; send audio to outputs
 
 ; turn off note once it has decayed while also allowing for the initial build up
 if rms:k(aL+aR)<0.0001 && timeinsts:k()>0.1 then
  turnoff
 endif
 
 gaRvbSendL        =                   gaRvbSendL + (aL * 0.1)
 gaRvbSendR        =                   gaRvbSendR + (aR * 0.1)
endin



instr    201    ; reverb instrument
 aL,aR             reverbsc            gaRvbSendL, gaRvbSendR, 0.85, 7000
                   outs                aL, aR
                   clear               gaRvbSendL, gaRvbSendR
endin

</CsInstruments>

<CsScore>
i 1 0 z      ; sense collisions with barriers
i 201 0 z    ; reverb instrument
</CsScore>

</CsoundSynthesizer>
