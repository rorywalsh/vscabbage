
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; StuckBuffer.csd
; Written by Iain McCurdy 2014, 2022, 2023

; Imitates the sound of a stuck audio buffer.

; CONTROLS

; PROBABILITY
; Thresh.      -    probability of there being a stuck buffer
; Freq.Min     -    Rate of probability test (minimum)
; Freq.Max     -    Rate of probability test (maximum)
;                   Threshold setting will also affect the frequency with which new buffer sizes are generated. i.e. a threshold setting of '1' will mean that a stuck buffer will be held indefinitely.
; Hold (button)-    Hold the current buffer indefinitely

; BUFFER SIZE
; Size.Min.    -    Random Buffer Size (minimum)
; Size.Max.    -    Random Buffer Size (maximum) - (these values raised to the power of 2 give the actual buffer size in samples)
; Intergerise  -    round generated buffer size values to the nearest integer. (Fractional offset of Size.Min is retained)
;                   This option also integerises transposition values (see below) 

; TRANSPOSE
; Trans.Min.   -    Random Transpose (minimum) in octaves 
; Trans.Max.   -    Random Transpose (maximum) in octaves. Transposition is achieved by playing a stuck buffer faster or slower
; Quality      -    interpolation used in playing back the buffer: none/linear/cubic. 

; OUTPUT
; Width        -    width of random panning of stuck buffers
; Env.Time     -    choose enveloping of stuck buffer iterations to prevent clicks if desired
;                   This will affect the quality of playback when transposed. Lower quality may be desired for 'Lo Fi' effects.
; Envelope     -    No Env./Hanning
; Mix          -    mix between dry signal output when not in STUCK BUFFER mode
; Level        -    output level
; Interupt     -    if active, STUCK BUFFER mode interrupts input audio

<Cabbage>

form caption("Stuck Buffer") size(670,220), colour(50,50,50), pluginId("StBu"), guiMode("queue")
image                 bounds(0, 0,670,220), colour(50,50,50), shape("sharp"), outlineColour("grey"), outlineThickness(1)

#define RSliderStyle # colour(150,150,150), trackerColour(white), outlineColour(85,85,85)#

; SOUND FILE INPUT
soundfiler bounds(120, 10,540, 85), channel("filer")
label      bounds(125, 11,540, 13), channel("FileName"), text(""), align("left")
filebutton bounds(  5, 10,105, 25), text("OPEN FILE","OPEN FILE"), fontColour("lime") channel("filename")
label      bounds(  5, 40, 27, 23), text(">")
checkbox   bounds(  5, 40,110, 25), text("START/STOP") value(0), channel("OnOff"), alpha(0.5), fontColour:0("white"), fontColour:1("white")
combobox   bounds(  5, 70,105, 25), channel("Input"), items("LIVE","FILE"), value(1) 


; MAIN CONTROLS
image    bounds(  0,100,670,110), colour(0,0,0,0) 
{
line     bounds( 10, 10,160, 2), colour("grey")
label    bounds( 50,  5, 80, 12), text("PROBABILITY"), colour(50,50,50)
rslider  bounds(  0, 20, 60, 60), text("Thresh."),   channel("thresh"),  range(0, 1.00, 0.4), $RSliderStyle
rslider  bounds( 60, 20, 60, 60), text("Freq.Min."), channel("FreqMin"), range(0.1,100.00, 2, 0.5), $RSliderStyle
rslider  bounds(120, 20, 60, 60), text("Freq.Max."), channel("FreqMax"), range(0.1,100.00, 8, 0.5), $RSliderStyle

line     bounds(190, 10,100,  2), colour("grey")
label    bounds(203    ,  5, 75, 12), text("BUFFER SIZE"), colour(50,50,50)
rslider  bounds(180, 20, 60, 60), text("Size.Min."), channel("SizeMin"), range(2.00, 16, 10), $RSliderStyle
rslider  bounds(240, 20, 60, 60), text("Size.Max."), channel("SizeMax"), range(2.00, 16, 14), $RSliderStyle

line     bounds(310, 10,100,  2), colour("grey")
label    bounds(325,  5, 70, 12), text("TRANSPOSE"), colour(50,50,50)
rslider  bounds(300, 20, 60, 60), text("Trans.Min."), channel("TransMin"), range(-7.00, 7, 0), $RSliderStyle
rslider  bounds(360, 20, 60, 60), text("Trans.Max."), channel("TransMax"), range(-7.00, 7, 0), $RSliderStyle

line     bounds(430, 10,215,  2), colour("grey")
label    bounds(510,  5, 58, 12), text("OUTPUT"), colour(50,50,50)
rslider  bounds(420, 20, 60, 60), text("Width"), channel("PanWidth"), range(0, 1.00, 0.5), $RSliderStyle
rslider  bounds(480, 20, 60, 60), text("Env.Time"), channel("EnvTime"), range(0, 0.05, 0.05,0.5), $RSliderStyle
rslider  bounds(540, 20, 60, 60), text("Mix"), channel("mix"), range(0, 1.00, 1), $RSliderStyle
rslider  bounds(600, 20, 60, 60), text("Level"), channel("level"), range(0, 1.00, 1), $RSliderStyle

checkbox bounds( 10, 85,100, 12), text("HOLD"), colour("lime"), channel("hold"),  value(0)
button   bounds( 95, 84, 50, 16), text("STUCK","STUCK"), active(0), channel("STUCK"), fontColour:0(40,40,40), fontColour:1(255,200,200), colour:1(255,80,80)
checkbox bounds(190, 85,100, 12), text("INTEGERISE"), colour("lime"), channel("integer"),  value(0)
combobox bounds(315, 82, 90, 18    ), channel("interp"), value(2), text("No Interp.", "Linear", "Cubic")
combobox bounds(430, 82, 90, 18    ), channel("Env"), value(2), text("No Env.", "Hanning")
checkbox bounds(530, 85,100, 12), text("Interupt"), colour("lime"), channel("Interupt"),  value(1)
}

label   bounds(  5,205, 120, 13), text("Iain McCurdy |2014|"), align("left")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -+rtmidi=NULL -M0 -dm0
;-odac -dm0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps = 32
nchnls = 2
0dbfs=1

giTabSize    =        131072

giHanning    ftgen    2, 0, 8192, 20, 2, 1
giHalfSine   ftgen    3, 0, 8192, 9,  0.5, 1, 0

gibufferL    ftgen    0,0,giTabSize,2,0    ; buffer tables
gibufferR    ftgen    0,0,giTabSize,2,0

gichans       init    0        ; 
giReady       init    0        ; flag to indicate function table readiness
gSfilepath    init    ""



instr    1
 ; LOAD FILE 
 gSfilepath      cabbageGetValue    "filename"
 kNewFileTrg     changed            gSfilepath        ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                               ; if a new file has been loaded...
                event               "i",50,0,0.01     ; call instrument to update sample storage function table 
 endif   
 gSDropFile cabbageGet "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
        event "i",51,0,0 ; load dropped file
 endif
 
 ; INPUT
 kOnOff     cabbageGetValue    "OnOff"
 kInput     cabbageGetValue    "Input"
 gkInterupt cabbageGetValue    "Interupt"
 
 if kInput==1 then
  gaInL, gaInR  ins
 else
  gaInL        =       0
  gaInR        =       0
 endif
 
 ; turn on and off sound file
 if trigger:k(kOnOff,0.5,0)==1 && kInput==2 then
  event "i",2,0,-1
 elseif trigger:k(kOnOff,0.5,1)==1 then
  turnoff2 2,0,0
 endif
 
endin




instr    2
 ;** check interupt functioning
 if active:k(99)<1 && gkInterupt==1 then ; only play file while we are not in STUCK BUFFER mode
  if gichans==1 then ;mono
   gaInL      diskin   gSfilepath,1,0,1
   gaInR      =        gaInL
  else
   gaInL,gaInR diskin  gSfilepath,1,0,1
  endif
 else
  gaInL       =        0
  gaInR       =        0
 endif

endin




instr    3
 
 
 ; write audio into main table
 gkMainPhs   phasor             sr/ftlen(gibufferL)
             tablew             gaInL, a(gkMainPhs)*ftlen(gibufferL), gibufferL  ; continuously write to buffer
             tablew             gaInR, a(gkMainPhs)*ftlen(gibufferL), gibufferR
             
 kporttime   linseg             0, 0.01, 0.05 ; portamento time function
  
 gkthresh    cabbageGetValue    "thresh"
 khold       cabbageGetValue    "hold"
 gkthresh    -=                 khold         ; add hold value to threshold value. Overrides any chance of exiting a stuck buffer
 kFreqMin    cabbageGetValue    "FreqMin"
 kFreqMax    cabbageGetValue    "FreqMax"
 gkSizeMin   cabbageGetValue    "SizeMin"
 gkSizeMax   cabbageGetValue    "SizeMax"
 gkinteger   cabbageGetValue    "integer"
 gkTransMin  cabbageGetValue    "TransMin"
 gkTransMax  cabbageGetValue    "TransMax"
 gkinterp    cabbageGetValue    "interp"
 kPanWidth   cabbageGetValue    "PanWidth"
 kmix        cabbageGetValue    "mix"
 gklevel     cabbageGetValue    "level"
 gkEnv       cabbageGetValue    "Env"
 gkEnvTime   cabbageGetValue    "EnvTime"
  
 ; ensure no attentuation of wet or dry signals at midway point
 gkwet       limit              kmix * 2, 0, 1
 gkdry       limit              2 - (kmix * 2), 0, 1
 
 ; apply portamento smoothing to selected
 gkSizeMin   portk              gkSizeMin, kporttime    ; smooth changes to widgets
 gkSizeMax   portk              gkSizeMax, kporttime    
 gkTransMin  portk              gkTransMin, kporttime        
 gkTransMax  portk              gkTransMax, kporttime    
 
 ; random function which is tested and if below kthresh, we are in a stuck buffer
 if khold==0 then
  krate      randomh            kFreqMin, kFreqMax, 1   ; rate of generation of random values
  gkTestVal  randomh            0, 1, krate             ; generate a random value for testing
 endif
 gkStuck     =                  gkTestVal > gkthresh ? 1 : 0
 
 giRampTime  =                  0.03                    ; anticlick time
 
 gkAttTrig   trigger            gkTestVal, gkthresh, 0 ; if we are entering a stuck buffer event, generate a trigger
 gkRelTrig   trigger            gkTestVal, gkthresh, 1 ; if we are exiting a stuck buffer event, generate a trigger (i.e. new buffer sizes are only generated when a stuck buffer becomes unstuck)
 
 ; start stuck buffer
 if gkAttTrig==1 then
             event              "i", 99, 0, 3600, kPanWidth
 endif

 if gkEnv>0 then
  gkStuck    limit              lineto:k(gkStuck, gkEnvTime),0,1
 endif

 if gkInterupt==0 then
             outs               gaInL * gkdry * gklevel, gaInR * gkdry * gklevel
 else
             outs               gaInL * gkdry * gklevel * (1-gkStuck), gaInR * gkdry * gklevel * (1-gkStuck)
 endif
 
endin








instr    50    ; load sound file 
 /* write file selection to function tables */
 gichans       =           filenchnls:i(gSfilepath)   ; derive the number of channels (mono=1,stereo=2) in the sound file
 giReady       =           1                          ; until a filew has been loaded, giReady will be zero
               cabbageSet  "filer","file",gSfilepath
 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet  "FileName","text",SFileNoExtension
                  cabbageSetValue "Input", 2 ; set input to 'File'
                  cabbageSetValue "OnOff", 1 ; start playback
endin


instr 51 ; load dropped files
/* write file selection to function tables */
 gichans       =           filenchnls:i(gSfilepath)   ; derive the number of channels (mono=1,stereo=2) in the sound file
 giReady       =           1                          ; until a filew has been loaded, giReady will be zero
               cabbageSet  "filer","tableNumber",1
 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSDropFile
                  cabbageSet  "FileName","text",SFileNoExtension
                  cabbageSetValue "Input", 2 ; set input to 'File'
                  cabbageSetValue "OnOff", 1 ; start playback
endin








instr 99
  ; turn on/off indicator
  kRel         release
               cabbageSetValue  "STUCK", 1-kRel ;, changed:k(kRel)

   iPanWidth   =                p4
 
 gibufferCopyL ftgentmp         0,0,giTabSize,2,0
 gibufferCopyR ftgentmp         0,0,giTabSize,2,0
               tableicopy       gibufferCopyL, gibufferL
               tableicopy       gibufferCopyR, gibufferR

 isize         random           0,1                                      ; generate a new buffer size when a stuck buffer unsticks
 ksize         scale            isize,gkSizeMax,gkSizeMin
 ipan          random           0.5-(iPanWidth*0.5),0.5+(iPanWidth*0.5)  ; generate a random pan value
 itrans        random           0,1                                      ; generate a random transposition value when triggered
 ktrans        scale            itrans,gkTransMax,gkTransMin

 ; intergerise size
 if gkinteger==1 then                                      ; if 'INTEGERISE' is on...
  kfrac        =                frac(gkSizeMin)            ; remember fractional value of Size.Min. 
  ksize        =                int(ksize)+kfrac
  ktrans       =                int(ktrans)
 endif

 ; N.B. ksize is in sample frames
 ksize         limit            ksize, gkSizeMin, gkSizeMax    ; limit buffer size value
 if gkinterp==1 then
  ksize        =                int(2 ^ ksize)                 ; create power of two value (integer)
 else
  ksize        =                2 ^ ksize                      ; create power of two value
 endif

 ; create buffer phase pointer
 iPhsPnt       =                i(gkMainPhs) * ftlen(gibufferL)  ; point we arrived at when a new stuck buffer was requested
 aSBPhs        phasor           (sr*octave(ktrans)) / ksize      ; buffer phasor
 aSBPhsScl     =                iPhsPnt - (aSBPhs * ksize)       ; reScale scope of phasor according to buffer size and start location

 ; read audio from buffer
 if gkinterp==1 then                                              ; choose interpolation method:
  aL           table            aSBPhsScl,gibufferCopyL, 0, 0, 1  ; no interpolation
  aR           table            aSBPhsScl,gibufferCopyR, 0, 0, 1
 elseif gkinterp==2 then                                          ; linear
  aL           tablei           aSBPhsScl,gibufferCopyL, 0, 0 ,1
  aR           tablei           aSBPhsScl,gibufferCopyR, 0, 0, 1
 else                                                             ; cubic
  aL           table3           aSBPhsScl,gibufferCopyL, 0, 0, 1
  aR           table3           aSBPhsScl,gibufferCopyR, 0, 0, 1
 endif
 
 ; panning
 aL            =                aL * ipan                         ; pan audio
 aR            =                aR * (1-ipan)

 ; buffer windowing
 if gkEnv>1 then
  aWind        tablei           aSBPhs, giHanning, 1
  aL           *=               aWind
  aR           *=               aWind
 endif   

 ; main envelope
 if i(gkEnv)>1 then
  if i(gkEnvTime)>0 then
   aEnv        linsegr          0,i(gkEnvTime)+0.0001,1,i(gkEnvTime)+0.0001,0
   aL          *=               aEnv
   aR          *=               aEnv
  endif
 endif
               outs             aL * gklevel * gkwet, aR * gklevel * gkwet
 
 ; test whether to turn off this instrument
 if trigger:k(gkTestVal,gkthresh,1)==1 then
               turnoff
 endif
endin

</CsInstruments>  

<CsScore>
i 1 0 z
i 3 0 z
e
</CsScore>

</CsoundSynthesizer>