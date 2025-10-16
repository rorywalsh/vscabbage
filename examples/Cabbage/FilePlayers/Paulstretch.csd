
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; PaulStretch.csd
; Written by Iain McCurdy, 2024

; A sound file can be loaded either via the Open File button and browsing or by simply dropping a file onto the GUI window.

; An encapsulation of the paulstretch opcode.
; Note that certain combinations of stretch factor and time resolution cause serious artefacting. 
; Fine adjustments of time resolution can remove this.

; A additional feature here is that the user can trigger a canon of iterations of paulstretch with incrementally modulated parameters.
; Setting Number of 1 disables this feature giving a simple single Paulstretch voice.

; Open File       -   browse for a file
; Play/Stop       -   start/stop playback

; Stretch         -   stretch factor
; Time Resolution -   window size used in the time stretch
; Level           -   output level


; E N V E L O P E
; Att. Time       -   attack time as notes are started and stopped using the GUI button or MIDI keys
; Rel. Time       -   release time as notes are started and stopped using the GUI button or MIDI keys

; C A N O N
; Number          -   number of iterations in the canon
; TimeGap         -   time delay between iterations
; dBDrop          -   amplitude drop in decibels between succesive iterations
;                      amplitude of a given layer is represented graphically by the solidity (or transparency) of its wiper
;                      negative values mean that the sequence is reversed: the canon entries start quiet and get louder
; Stretch Warp    -   warping of stretch factor between succesive iterations
; Reverb Send     -   scale the amount of reverb applied to each layer in the canon
;                      amount of reverb send of a given layer is represented graphically by the width of its wiper
;                      negative values mean that the sequence is reversed: the canon entries start more reverberant and get less reverberant
; Pitch Step      -   pitch interval at which each part of the canon enters with respect to the previous entry. 
;                     Set to zero to disable this feature.
; Pitch Scale     -   pitch scaling of all parts of the canon
<Cabbage>
form caption("Paulstretch") size(1225,320), colour( 70, 70,100), pluginId("PaSt"), guiMode("queue")

#define SLIDER_STYLE colour(60, 60,100), textColour("white"), trackerColour(210,210,250), valueTextBox(1)

soundfiler bounds(  5,  5,1215,175), channel("beg","len"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255), tableNumber(1)

label bounds(6, 4, 560, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")


filebutton bounds(  5,190, 80, 25), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse")
checkbox   bounds(  5,220, 95, 25), channel("PlayStop"), text("Play/Stop"), colour("yellow"), fontColour:0("white"), fontColour:1("white")

image      bounds(100,185,270,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
rslider    bounds(  0, 20, 90, 90), channel("Stretch"),     range( 0.01,  100, 1, 0.5, 0.1), text("Stretch"), $SLIDER_STYLE
rslider    bounds( 90, 20, 90, 90), channel("TimeRes"),     range(  0.01, 1, 0.1, 0.5, 0.01), text("Time Res."), $SLIDER_STYLE
rslider    bounds(180, 20, 90, 90), channel("level"),     range(  0, 10.00, 1, 0.5), text("Level"), $SLIDER_STYLE
}

image      bounds(380,185,630,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label      bounds(  0,  2,540, 12), text("C   A   N   O   N"), fontColour("white")
rslider    bounds( 10, 20, 80, 90), channel("Number"), range(  1,  20, 1, 1, 1), text("Number"), $SLIDER_STYLE
rslider    bounds( 90, 20, 80, 90), channel("TimeGap"), range(  0, 5,0.1, 0.5), text("Time Gap"), $SLIDER_STYLE
rslider    bounds(180, 20, 80, 90), channel("dBDrop"), range(-8, 8, 3), text("dB Drop"), $SLIDER_STYLE
rslider    bounds(270, 20, 80, 90), channel("StrWarp"), range(-8,  8, 0, 1), text("Stretch Warp"), $SLIDER_STYLE
rslider    bounds(360, 20, 80, 90), channel("RvbSend"), range(-1,  1, 1, 1), text("Reverb Send"), $SLIDER_STYLE
rslider    bounds(450, 20, 80, 90), channel("PitchStep"), range(0.5,  2, 1, 0.65, 0.001), text("Pitch Step"), $SLIDER_STYLE
rslider    bounds(540, 20, 80, 90), channel("PitchScale"), range(0.125,  4, 1, 0.5, 0.001), text("Pitch Scale"), $SLIDER_STYLE
}

image      bounds(1020,185,200,120), colour(0,0,0,0), outlineThickness(1), corners(5)
{
label      bounds(  0,  2,200, 12), text("E   N   V   E   L   O   P   E"), fontColour("white")
rslider    bounds(  0, 20,100, 90), channel("AttTim"),    range(0, 5, 0.01, 0.5, 0.001), text("Att. Time"), $SLIDER_STYLE
rslider    bounds(100, 20,100, 90), channel("RelTim"),    range(0.01, 5, 0.05, 0.5, 0.001), text("Rel. Time"), $SLIDER_STYLE
}

label    bounds(  5,307,120, 12), text("Iain McCurdy |2024|"), align("left"), fontColour("Silver")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -+rtmidi=NULL -M0 -dm0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 32
nchnls = 2
0dbfs  = 1

                      massign             0,0
gichans               init                0
giFileLen             init                0
giReady               init                0
gSfilepath            init                ""
gkTabLen              init                2

instr    1    ; Read in widgets
 ; create wipers
 giNWipers         =                   20
 iCount            =                   1
 while iCount <= giNWipers do
 SWidget           sprintf             "bounds(%d, %d, %d, %d), channel(\"wiper%d\"), alpha(1)", 0, 0, 0, 0,  iCount
                   cabbageCreate       "image", SWidget
 iCount            +=                  1
 od
 
 gkPlayStop           cabbageGetValue     "PlayStop"
 gklevel              cabbageGetValue     "level"
 gkNumber             cabbageGetValue     "Number"
 gkdBDrop             cabbageGetValue     "dBDrop"
 gkTimeGap            cabbageGetValue     "TimeGap"
 gkStretch            cabbageGetValue     "Stretch"
 gkTimeRes            cabbageGetValue     "TimeRes"
 gkStrWarp            cabbageGetValue     "StrWarp"
 gkRvbSend            cabbageGetValue     "RvbSend"
 gkRvbSend            port                gkRvbSend, 0.05
 gkPitchStep          cabbageGetValue     "PitchStep"
 gkPitchStep          port                gkPitchStep, 0.05
 gkPitchScale         cabbageGetValue     "PitchScale"
 gkPitchScale         port                gkPitchScale, 0.05
 
 ; load file from browse
 gSfilepath     cabbageGetValue    "filename"        ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then        ; call instrument to update waveform viewer  
  event "i",99,0,0
 endif

 ; load file from dropped file
 gSDropFile           cabbageGet          "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
                      event               "i",100,0,0         ; load dropped file
 endif
 
 ; start playback instrument
 ktrig                trigger             gkPlayStop, 0.5, 0  ; if play button changes to 'play', generate a trigger
 
 if ktrig==1 then
  kCnt = 1
  kNum = 8
  while kCnt<=gkNumber do
                      event               "i", 2, gkTimeGap*(kCnt-1), 3600 * 24 * 7 * 52, kCnt
  kCnt                +=                  1
  od
 endif
 
 ; reset wipers
                      schedkwhen          trigger:k(active:k(2),0.5,1), 0, 0, 200, 0, 0.1
endin



instr    99    ; load sound file
 gichans              filenchnls          gSfilepath                 ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL             ftgen               1,0,0,-1,gSfilepath,filelen:i(gSfilepath)*0.5,0,1
 giFileSamps          =                   nsamp(gitableL)            ; derive the file duration in samples
 giFileLen            filelen             gSfilepath                 ; derive the file duration in seconds
 gkTabLen             init                ftlen(gitableL)            ; table length in sample frames
 if gichans==2 then
  gitableR            ftgen               2,0,0,-1,gSfilepath,filelen:i(gSfilepath)*0.5,0,2
 endif
 giReady              =                   1                          ; if no string has yet been loaded giReady will be zero
                      cabbageSet          "beg","file",gSfilepath
;                      cabbageSet          "beg","tableNumber",1
                      
 ; write file name to GUI
 SFileNoExtension     cabbageGetFileNoExtension gSfilepath
                      cabbageSet                "stringbox", "text", SFileNoExtension
endin




instr    100 ; LOAD DROPPED SOUND FILE
 gichans              filenchnls             gSDropFile                 ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL             ftgen                  1,0,0,1,gSDropFile,0,0,1
 giFileSamps          =                      nsamp(gitableL)            ; derive the file duration in samples
 giFileLen            filelen                gSDropFile                 ; derive the file duration in seconds
 gkTabLen             init                   ftlen(gitableL)            ; table length in sample frames
 if gichans==2 then
  gitableR            ftgen                  2,0,0,1,gSDropFile,0,0,2
 endif
 giReady              =                      1                          ; if no string has yet been loaded giReady will be zero
                      cabbageSet             "beg","file",gSDropFile

 ; write file name to GUI
 SFileNoExtension     cabbageGetFileNoExtension gSDropFile
                      cabbageSet                "stringbox", "text", SFileNoExtension

endin




instr    2    ; Sample triggered by 'play/stop' button
 if gkPlayStop==0 then
  turnoff
 endif

  kPortTime            linseg             0, 0.001, 0.05

  iCount              =                   p4
  
  ; reverb send
  kFrac               divz                (iCount - 1), (gkNumber-1), 0 ; counter as a fraction from 0 to 1
  if gkRvbSend >= 0 then
   kRvbSend           ntrpol              0, kFrac, kFrac
  else
   kRvbSend           ntrpol              0, 1-kFrac, -kFrac
  endif
  kRvbSend            portk               kRvbSend, kPortTime
  
  ; amplitude drop
  if gkdBDrop >= 0 then
   kAmp               =                   ampdbfs((iCount-1) * (-gkdBDrop))
  else
   kAmp               =                   ampdbfs(((gkNumber-1) - (iCount-1)) * (gkdBDrop))
  endif
  kAmp                portk               kAmp, kPortTime
 
  ; pitch scale
  kPitchStep         =                   gkPitchStep ^ (iCount-1)
  
  ;if timeinstk:k()==10 then
  ;                   printk              0, kPitchStep
  ;endif
  
  
  ;kAmp = ampdbfs((iCount-1) * (-gkdBDrop))
  aAmp interp kAmp

  ; envelope
  iAttTim             cabbageGetValue     "AttTim"                       ; read in widgets
  iRelTim             cabbageGetValue     "RelTim"
  if iAttTim>0 then                                                      ; is amplitude envelope attack time is greater than zero...
   kenv               linsegr             0,iAttTim,1,iRelTim,0          ; create an amplitude envelope with an attack, a sustain and a release segment (senses realtime release)
  else
   kenv               linsegr             1,iRelTim,0                    ; create an amplitude envelope with a sustain and a release segment (senses realtime release)
  endif
  kenv                expcurve            kenv,8                         ; remap amplitude value with a more natural curve
  aenv                interp              kenv                           ; interpolate and create a-rate envelope

 
 
 if giReady==1 then                                              ; i.e. if a file has been loaded

  kporttime           linseg              0,0.001,1                      ; portamento time function. (Rises quickly from zero to a held value.)
  klevel              portk               gklevel,kporttime*0.1          ; apply portamento smoothing to changes
  
  if changed:k(gkStretch,gkTimeRes)==1 then
                      reinit              RESTART
  endif
  RESTART:
  
  iStretch            =                   i(gkStretch)*(iCount^i(gkStrWarp))
  
  ; stereo/mono selection
  if gichans==1 then                                              ; if mono...
   a1                 paulstretch         iStretch, i(gkTimeRes), gitableL
   a2                 paulstretch         iStretch, i(gkTimeRes), gitableL
  elseif gichans==2 then                                          ; otherwise, if stereo...
   a1                 paulstretch         iStretch, i(gkTimeRes), gitableL
   a2                 paulstretch         iStretch, i(gkTimeRes), gitableR
  endif
 
 ; move wiper
 SChan                sprintf             "wiper%d", iCount
 iBounds[]            cabbageGet          "beg", "bounds"
 kPtr                 line                0, (ftlen(gitableL)/sr) * iStretch, 1
                      cabbageSet          metro:k(16), SChan, "bounds", iBounds[0] + (kPtr * iBounds[2]), iBounds[1], 1 + (kRvbSend*10), iBounds[3]
                      cabbageSet          metro:k(16), SChan, "alpha", kAmp*0.8

  rireturn
    
;                     outs                a1 * klevel * iPan , a2 * klevel * (1 - iPan)
 a1                   *=                  klevel * aAmp * aenv
 a2                   *=                  klevel * aAmp * aenv
 
 a1                   butlp               a1, (sr/2) * a(kAmp)
 a2                   butlp               a2, (sr/2) * a(kAmp)
 
 
 ; pitch warp
 iFFTsize       =                  1024
 if (gkPitchStep!=0 && gkNumber>1) || gkPitchScale!=0 then ; only execute if needed
  f1                  pvsanal            a1, iFFTsize, iFFTsize/4, iFFTsize, 1
  fP1                 pvscale            f1, kPitchStep * gkPitchScale
  a1                  pvsynth            fP1
 
  f2                  pvsanal            a2, iFFTsize, iFFTsize/4, iFFTsize, 1
  fP2                 pvscale            f2, kPitchStep * gkPitchScale
  a2                  pvsynth            fP2
 endif
  
  
                      outs               a1*(1-kRvbSend), a2*(1-kRvbSend)
                      chnmix             a1*kRvbSend, "send1"
                      chnmix             a2*kRvbSend, "send2"
   
 endif

endin


instr 200
 ; create wipers
 iCount               =                   1
 while iCount <= giNWipers do
 SChan                sprintf             "wiper%d", iCount
                      cabbageSet          SChan, "bounds", 0,0,0,0
 iCount               +=                  1
 od

endin

instr 999 ; reverb
 a1                   chnget              "send1"
 a2                   chnget              "send2"
                      chnclear            "send1"
                      chnclear            "send2"   
 aL,aR                reverbsc            a1, a2, 0.85, 12000
                      outs                aL,aR
endin

</CsInstruments>  

<CsScore>
i 1   0 z
i 999 0 z
</CsScore>

</CsoundSynthesizer>