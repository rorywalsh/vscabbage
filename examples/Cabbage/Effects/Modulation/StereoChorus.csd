
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; StereoChorus.csd
; Written by Iain McCurdy, 2012.

; LFO Shape  -  shape of the LFO modulating delay time
; Rate       -  rate of the modulating LFO in hertz
; Dereg      -  amount of random deregulation to both LFO rate and depth in all LFO modes
; Depth      -  depth of LFO modulation
; Offset     -  phase offset (as a fraction of a complete cycle) of the right channel
; Width      -  width of LFO modulation
; Mix        -  dry/wet mix
; Level      -  amplitude of the output 

<Cabbage>
form caption("Stereo Chorus") size(705, 110), pluginId("scho"), guiMode("queue")
image                 bounds(0, 0, 705, 110), colour("DarkSlateGrey"), shape("rounded"), outlineColour("white"), outlineThickness(6)

#define SLIDER_STYLE  textColour("white"), fontColour("white"), colour(37,59,59), trackerColour("Silver"), valueTextBox(1)

label    bounds( 10, 15, 85, 12), text("I N P U T"), align("centre"), fontColour("lightGrey")
combobox bounds( 10, 28, 85, 20), channel("input"), items("MONO","STEREO","TEST"), value(2), align("centre"), fontColour("white")

label    bounds( 10, 55, 85, 12), text("L F O   T Y P E"), fontColour("lightGrey")
combobox bounds( 10, 68, 85, 20), channel("type"), items("SINE","TRIANGLE","EXPONENTIAL","LOGARITHMIC","RND. SPLINE"), align("centre"), textColour("white"), colour( 7,29,29), fontColour("white"), value(1)

label    bounds(110, 15, 90, 14), text("LFO Shape"), align("centre"), fontColour("lightGrey")
gentable bounds(110, 30, 90, 60), tableNumber(99), channel("LFOtable"), fill(0), ampRange(0,1,1)

rslider  bounds(200, 13, 80, 90), text("Rate"), channel("rate"), range(0.001,50, 0.5,0.5), $SLIDER_STYLE
rslider  bounds(270, 13, 80, 90), text("Dereg."), channel("dereg"), range(0, 4, 0,0.5,0.01), $SLIDER_STYLE
rslider  bounds(340, 13, 80, 90), text("Depth"), channel("depth"), range(0, 10, 2), $SLIDER_STYLE
rslider  bounds(410, 13, 80, 90), text("Offset"), channel("offset"), range(0,100,1,0.5,0.1), $SLIDER_STYLE
rslider  bounds(480, 13, 80, 90), text("Width"), channel("width"), range(0, 0.5, 0.375), $SLIDER_STYLE
rslider  bounds(550, 13, 80, 90), text("Mix"), channel("mix"), range(0, 1.00, 0.5), $SLIDER_STYLE
rslider  bounds(620, 13, 80, 90), text("Level"), channel("level"), range(0, 1.00, 1), $SLIDER_STYLE
label    bounds(  5, 96,120, 10), text("Iain McCurdy |2012|"), align("left"), fontColour("Silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>
;sr set by host
ksmps  = 32
nchnls = 2
0dbfs  = 1

;Author: Iain McCurdy (2012)
;http://iainmccurdy.org/csound.html

iTabSize      =             2048
idiv          =             7
i_            ftgen         99,0,iTabSize,10,1 ; buffer table
gisine        ftgen         1, 0, iTabSize, 19, 1, 0.5, 0,   0.5               ; sine-shape for lfo
gitriangle    ftgen         2, 0, iTabSize, 7, 0,iTabSize/2,1,iTabSize/2,0     ; triangle-shape for lfo
giExp         ftgen         3, 0, iTabSize, 19, 0.5, 1, 180, 1
giLog         ftgen         4, 0, iTabSize, 19, 0.5, 1, 0, 0
girspline     ftgen         5, 0, iTabSize, -8, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1), iTabSize/idiv, rnd(1)

opcode    StChorus,aa,aakkkkkkk
 ainL,ainR,krate,kdereg,kdepth,koffset,kwidth,kmix,ktype    xin               ; READ IN INPUT ARGUMENTS
 kporttime     linseg             0, 0.001, 0.02                              ; RAMPING UP PORTAMENTO VARIABLE
 kChoDepth     portk              kdepth, kporttime                           ; SMOOTH VARIABLE CHANGES WITH PORTK
 aChoDepth     interp             kChoDepth                                   ; INTERPOLATE TO CREATE A-RATE VERSION OF K-RATE VARIABLE
 if ktype<5 then
  if changed:k(ktype)==1 then
   reinit UPDATE_LFO
  endif
  UPDATE_LFO:
  amodL         osciliktp          krate, i(ktype), 0                         ; LEFT CHANNEL LFO
  amodR         osciliktp          krate, i(ktype), kwidth                    ; THE PHASE OF THE RIGHT CHANNEL LFO IS ADJUSTABLE
  rireturn
  amodL         =                  (amodL*aChoDepth)+a(koffset)               ; RESCALE AND OFFSET LFO (LEFT CHANNEL)
  amodR         =                  (amodR*aChoDepth)+a(koffset)               ; RESCALE AND OFFSET LFO (RIGHT CHANNEL)
  aChoL         vdelay             ainL, amodL, 1200                          ; CREATE VARYING DELAYED / CHORUSED SIGNAL (LEFT CHANNEL) 
  aChoR         vdelay             ainR, amodR, 1200                          ; CREATE VARYING DELAYED / CHORUSED SIGNAL (RIGHT CHANNEL)
 else ; rspline
  kmod1         rspline            koffset,koffset+kChoDepth, krate/2, krate*2
  kmod2         rspline            koffset,koffset+kChoDepth, krate*2, krate/2
  kmod1         limit              kmod1,0,1100
  kmod2         limit              kmod2,0,1100
  aCho1         vdelay             ainL, a(kmod1), 1200                       ; CREATE VARYING DELAYED / CHORUSED SIGNAL (LEFT CHANNEL) 
  aCho2         vdelay             ainR, a(kmod2), 1200                       ; CREATE VARYING DELAYED / CHORUSED SIGNAL (RIGHT CHANNEL)
  kpan          rspline            0, 1, krate/2, krate*2                     ; PANNING
  kpan          limit              kpan, 0, 1
  apan          interp             kpan
  aChoL         =                  (aCho1*apan)+(aCho2*(1-apan))
  aChoR         =                  (aCho2*apan)+(aCho1*(1-apan))
  aChoL         ntrpol             aChoL, aCho1, kwidth*2                     ; WIDTH PROCESSING BETWEEN AUTO-PANNED AND HARD-PANNED
  aChoR         ntrpol             aChoR, aCho2, kwidth*2
 endif
 aoutL          ntrpol             ainL * 0.6, aChoL * 0.6, kmix              ; MIX DRY AND WET SIGNAL (LEFT CHANNEL)
 aoutR          ntrpol             ainR * 0.6, aChoR * 0.6, kmix              ; MIX DRY AND WET SIGNAL (RIGHT CHANNEL)
                xout               aoutL,aoutR                                ; SEND AUDIO BACK TO CALLER INSTRUMENT
endop

instr 1
 kporttime        linseg             0,0.001,0.05                                                     
 krate            cabbageGetValue    "rate"
 kdereg           cabbageGetValue    "dereg"
 kdepth           cabbageGetValue    "depth"
 koffset          cabbageGetValue    "offset"
 kwidth           cabbageGetValue    "width"
 klevel           cabbageGetValue    "level"
 kmix             cabbageGetValue    "mix"
 ktype            cabbageGetValue    "type"
 ktype            init               1
if changed:k(ktype)==1 then
 reinit UPDATE_LFO_TABLE
endif
UPDATE_LFO_TABLE:
                  tableicopy         99,i(ktype)
                  cabbageSet         "LFOtable", "tableNumber", 99
rireturn

 kmix             portk              kmix, kporttime
 klevel           portk              klevel, kporttime
 koffset          portk              koffset, kporttime * 0.5
 kinput           cabbageGetValue    "input"
 if kinput==1 then     ; mono
  a1              inch               1
  a2              =                  a1
 elseif kinput==2 then ; stereo
  a1,a2            ins
 else                  ; square wave
  a1               vco2               0.5,150,4,0.5
  a2               vco2               0.5,150,4,0.5
 endif
 
 kdereg           rspline            -kdereg, kdereg, krate/2, krate*2
 ktrem            rspline            0,-1,0.1,0.5
 ktrem            pow                2,ktrem
 a1,a2            StChorus           a1, a2, krate*(2^kdereg), kdereg, kdepth*ktrem, koffset, kwidth, kmix, ktype
 
 a1               =                  a1 * klevel
 a2               =                  a2 * klevel
                  outs               a1, a2
endin

</CsInstruments>

<CsScore>                                              
i 1 0 z
</CsScore>

</CsoundSynthesizer>                                                  