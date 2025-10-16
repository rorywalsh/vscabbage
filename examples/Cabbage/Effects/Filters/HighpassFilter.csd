
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; HighpassFilter.csd
; Written by Iain McCurdy, 2012, 2021

<Cabbage>
form caption("Highpass Filter"), size(380,100), pluginId("HPFl"), guiMode("queue")
image pos(0, 0),                 size(380,100), colour(  70,120, 90), shape("rounded"), outlineColour("white"), outlineThickness(4) 
label    bounds( 15, 12, 80, 11), text("INPUT"), fontColour("white"), align("centre")
combobox bounds( 15, 23, 80, 20), channel("input"), value(1), text("Live","Tone","Noise")
label    bounds( 15, 48, 80, 12), text("TYPE"), fontColour("white")
combobox bounds( 15, 61, 80, 20), text("12dB/oct","24dB/oct","36dB/oct","48dB/oct","60dB/oct","Resonant"), channel("type"), value(1)
rslider  bounds(105, 16, 70, 70), channel("cf"),        text("Freq."), colour(150,210,180), trackerColour(230,255,230),     textColour("white"),     range(20, 20000, 20, 0.333)
rslider  bounds(170, 16, 70, 70), channel("res"),       text("Res."),  colour(150,210,180), trackerColour(230,255,230),     textColour("white"),    range(0,1.00,0), visible(0)
rslider  bounds(235, 16, 70, 70), channel("mix"),       text("Mix"),   colour(150,210,180), trackerColour(230,255,230),        textColour("white"),     range(0,1.00,1)
rslider  bounds(300, 16, 70, 70), text("Level"),    colour(150,210,180), trackerColour(230,255,230),        textColour("white"),     channel("level"),     range(0, 1.00, 1)
label   bounds(  5, 87,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour("lightGrey")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =                   2     ; NUMBER OF CHANNELS (2=STEREO)
0dbfs              =                   1
 
;Author: Iain McCurdy (2012)

opcode ButhpIt, a, akip
aIn,kCF,iNum,iCnt  xin
aOut               =                   0 
aOut               buthp               aIn, kCF
if iCnt<iNum then
 aOut              ButhpIt             aOut, kCF, iNum, iCnt+1
endif
                   xout                aOut
endop

instr    1
 kporttime    linseg    0,0.001,0.05
 /* READ IN WIDGETS */
 kcf               cabbageGetValue     "cf"
 kres              cabbageGetValue     "res"
 kmix              cabbageGetValue     "mix"
 ktype             cabbageGetValue     "type"
 kResType          cabbageGetValue     "ResType"
 klevel            cabbageGetValue     "level"
 klevel            portk               klevel,kporttime
 alevel            interp              klevel
 kcf               portk               kcf,kporttime
 acf               interp              kcf
 /* INPUT */
 kinput            cabbageGetValue     "input"
 if kinput==1 then
  aL,aR            ins
 elseif kinput==2 then
  aL               vco2                0.2, 100
  aR               =                   aL
 else
  aL               pinkish             0.2
  aR               pinkish             0.2
 endif
 
 if changed:k(ktype)==1 then
  if ktype==6 then
                   cabbageSet          1, "res", "visible", 1 
  else
                   cabbageSet          1, "res", "visible", 0 
  endif
 endif
 
 /* FILTER */
 if ktype==6 then
  aFiltL           bqrez               aL,acf,1+(kres*40),1
  aFiltR           bqrez               aR,acf,1+(kres*40),1    
 else
  if changed:k(ktype)==1 then
                   reinit              RESTART_FILTER
  endif
  RESTART_FILTER:
  aFiltL           ButhpIt             aL, kcf, i(ktype)
  aFiltR           ButhpIt             aR, kcf, i(ktype)
  rireturn
 endif    
 aL                ntrpol              aL,aFiltL,kmix
 aR                ntrpol              aR,aFiltR,kmix
                   outs                aL * alevel, aR * alevel
endin
        
</CsInstruments>

<CsScore>
i 1 0 z
e
</CsScore>

</CsoundSynthesizer>
