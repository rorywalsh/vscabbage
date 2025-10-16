
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; Sound Chipper.csd
; Iain McCurdy, 2023

; Sound Chipper can be thought of as windowless granular synthesis, meaning that there is no use 
;  of amplitude fade ins  and fade outs to prevent clicks. 
; The way in which clicks are prevented is that grains are only permitted to begin and end at zero crossings 
;  in the waveform (fragments created like this are sometimes referred to as wavelets, here as 'chips')
; The nature of this granulation (here called 'chipping') is primarily determined by setting the time gap between
; sound chips (GAP DURATION) and the number of zero crossings in each chip (WAVELETS PER CHIP).

; Sound files can be loaded through OPEN FILE or by simply dropping a file onto the interface

; FILTER       - low pass filtering of the input signal. Can also affect the frequency of zero crossing
; GAP DURATION - length of the gap between chips. How this will be interpretted is dependent upon the setting for GAP MODE
; RANDOM       - amount of random variation of GAP DURATION on a chip-by-chip basis
; GAP MODE     - method used for defining the gap time between chips:
;                FIXED    - an absolute time duration is defined by the GAP DURATION dial
;                RELATIVE - gap duration will be relative to GAP DURATION, WAVELETS PER CHIP and the nature of the source material (frequency of zero crossings)
; STEREO       - activate stereo output from the chipper. This will be heard in stereo panning (if AMP.MOD. is non-zero) and if SPEED-RANDOM is non-zero
;                Even though the effect is always mono input, stereo output mode will engage a random pan location on a chip-by-chip basis.
; SKIP SILENCE - When activated, gap time will be toggled to zero when silent sections are detected.
;                This can be useful for avoiding elongated silences during silent sections.
; WAVELETS PER CHIP - number of zero crossings that will constitute a single sound chip
; RANDOM       - amount of random variation of WAVELETS PER CHIP on a chip-by-chip basis
; SPEED        - speed of file playback
; RANDOM       - amount of random variation of SPEED on a chip-by-chip basis (in octaves)
; AMPLITUDE    - output amplitude
; RANDOM       - amount of chip-by-chip amplitude modulation

; If Sound Chipper gets stuck on some silence or on a excessively long chip or gap, pressing RESET will reset the chipper

<Cabbage>
form caption("Sound Chipper") size(1130,245), pluginId("SoCh"), colour(40,40,40), guiMode("queue")

#define DIAL_STYLE trackerColour(200,200,200), colour( 70, 60, 65), fontColour(200,200,200), textColour(200,200,200),  markerColour(220,220,220), outlineColour(50,50,50), valueTextBox(1)

soundfiler bounds(  5,  5,1120,100), channel("filer")
label      bounds(  9,  4, 500, 13), channel("FileName"), text("First open file..."), align("left")
filebutton bounds( 10,120,  80, 25), text("OPEN FILE","OPEN FILE"), fontColour("lime") channel("filename")
checkbox   bounds( 10,155, 110, 25), text("START/STOP") value(0), channel("OnOff")
button     bounds( 10,190,  80, 25), text("RESET","RESET"), fontColour("lime") channel("reset"), latched(0)

rslider  bounds(100,110,120,110), channel("PreFilter"), range(20,20000,20000,0.25,1), valueTextBox(1), text("FILTER (HZ)"), $DIAL_STYLE
rslider  bounds(200,110,120,110), channel("gap"), range(0,500,0,0.25,0.00001), valueTextBox(1), text("GAP DURATION"), $DIAL_STYLE
image    bounds(295,165, 40,  2), colour("grey")
rslider  bounds(300,110,120,110), channel("gapOS"), range(0,8,0,0.5), valueTextBox(1), text("RANDOM"), $DIAL_STYLE

label    bounds(420,115, 80, 15), text("GAP MODE"), value(1), align("centre")
combobox bounds(420,130, 80, 20), items("FIXED","RELATIVE"), value(1), channel("mode")
checkbox bounds(420,165, 70, 15), text("STEREO"), value(0), channel("stereo")
checkbox bounds(420,205,100, 15), text("SKIP SILENCE"), value(0), channel("skipSilence")

rslider  bounds(510,110,120,110), channel("nwavelets"), range(1,100,1,1,1), valueTextBox(1), text("WAVELETS PER CHIP"), $DIAL_STYLE
image    bounds(605,165, 40,  2), colour("grey")
rslider  bounds(610,110,120,110), channel("nwaveletsOS"), range(0,8,0,0.5), valueTextBox(1), text("RANDOM"), $DIAL_STYLE
rslider  bounds(710,110,120,110), channel("speed"), range(-2,2,0), valueTextBox(1), text("VARI-SPEED"), $DIAL_STYLE
image    bounds(805,165, 40,  2), colour("grey")
rslider  bounds(810,110,120,110), channel("speedOS"), range(0,2,0), valueTextBox(1), text("RANDOM"), $DIAL_STYLE

rslider  bounds( 910,110,120,110), channel("Amp"),       range(0,1,1,0.5), valueTextBox(1), text("AMPLITUDE"), $DIAL_STYLE
image    bounds(1005,165, 40,  2), colour("grey")
rslider  bounds(1010,110,120,110), channel("AmpModDep"), range(0,1,0), valueTextBox(1), text("RANDOM"), $DIAL_STYLE

label    bounds(  5,232,120, 12), text("Iain McCurdy |2023|"), align("left"), fontColour("Silver")

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

gichans       init    0        ; 
giReady       init    0        ; flag to indicate function table readiness
gSfilepath    init    ""
giFileL       ftgen   1,0,1024,2,0
giFileR       ftgen   2,0,1024,2,0


opcode  SoundChipper,a,ikkkkkkkkkk
  ifn,knwavelets,knwaveletsOS,kgap,kgapOS,kmode,kspeed,kspeedOS,kAmpModDep,kPreFilter,kskipSilence  xin ; READ IN INPUT ARGUMENTS
                setksmps          1                                                    ; SET ksmps TO 1 SAMPLE (kr = sr). WE WILL CONVERT THE AUDIO RATE SIGNAL TO K-RATE BUT WE DON'T WANT TO LOSE ANY RESOLUTION AND THEREFORE ACCURACY IN WHERE THE ZERO CROSSINGS ARE SNIPPED
  if kskipSilence==1 then
   asig          init              0
   krms          rms               asig
   kgap          =                 krms < 0.05 ? 0 : kgap
  endif
  icount        init              0                                                    ; COUNTER USED TO COUNT THE NUMBERS OF WAVELETS IN A TRAINLET
  ktime         init              0                                                    ; TIME FOR THIS GAP (INITIALLY NO GAP)
  ksig          init              0                                                    ; K-RATE VERSION OF THE AUDIO SIGNAL
  inwavelets    init              i(knwavelets)
  ktrig         trigger           ksig,0,2                                             ; SENSE IF THE AUDIO SIGNAL (K-RATE VERSION) HAS CROSSED ZERO IN EITHER DIRECTION 
  kamp          init              1
  if ktrig==1 then                                                                     ; IF A TRIGGER HAS BEEN GENERATED (BECAUSE OF A ZERO CROSSING)...
                reinit            gap                                                  ; BEGIN A REINITIALISATION PASS FROM LABEL: 'gap'
  endif                                                                                ; 
  gap:                                                                                 ; LABEL CALLED 'gap'
  icount        wrap              icount+1,0,inwavelets+1                              ; COUNTER FOR THE REQUIRED NUMBER OF WAVELETS INCREMENTED
  if icount==0 then                                                                    ; IF WE ARE AT THE END OF A WAVELET TRAIN (COUNTER HAS *JUST* WRAPPED AROUND TO ZERO)...
   igap         =                 i(kgap) * 2^(random:i(-i(kgapOS),i(kgapOS)))         ; APPLY RANDOM GAP OFFSET FOR THIS WAVELET
   iamp         random            1-i(kAmpModDep),1                                    ; generate random value for amplitude this chip
   iamp         pow               iamp, 2                                              ; raise to power-of-2 to create an exponential distribution 
   inwavelets   =                 int(i(knwavelets) * 2^(random:i(-i(knwaveletsOS),i(knwavelets)))) ; APPLY RANDOM NUMBER OF WAVELETS OFFSET FOR THIS CHIP
   kspeedRand   init              octave(gauss:i(i(kspeedOS)))                         ; create random speed modulation for this chip
   if i(kmode)==0 then                                                                 ; ...IF MODE 1 (FIXED GAP DURATION) HAS BEEN CHOSEN...
                timout            0, igap, skip                                        ; SUSPEND PERFORMANCE FOR A FIXED GAP DURATION
   else                                                                                ; OTHERWISE (A GAP TIME DEPENDENT UPON THE WAVELET DURATION WILL BE CHOSEN)
                timout            0, (i(ktime)*inwavelets*igap)/i(kspeed), skip        ; SUSPEND PERFORMANCE FOR A DURATION RELATIVE TO DURATION OF WAVELET, SPEED AND NUMBER OF WAVELETS IN A TRAIN
   endif
  endif
  ktime         timeinsts                                                              ; START TIMER
                rireturn
  asig          flooper2           1, kspeed*kspeedRand, 0, (ftlen(ifn)-1)/sr, 0, ifn  ; PLAY AUDIO IN A LOOP.
  asig          butlp             asig, kPreFilter                                     ; low pass filter the audio signal
  ksig          downsamp          asig                                                 ; CREATE K-RATE VERSION OF THE AUDIO
                xout              asig * iamp                                          ; SEND AUDIO BACK TO CALLER INSTRUMENT
skip:
endop


instr 1
; LOAD FILE 
gSfilepath      cabbageGetValue    "filename"
kNewFileTrg     changed            gSfilepath        ; if a new file is loaded generate a trigger
if kNewFileTrg==1 then                               ; if a new file has been loaded...
                event              "i",99,0,0.01     ; call instrument to update sample storage function table 
endif   
 gSDropFile cabbageGet "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
        event "i",100,0,0 ; load dropped file
    endif

gkOnOff,kT      cabbageGetValue    "OnOff"
                schedkwhen         kT,0,0,200,0,-1
endin




instr    99    ; load sound file 
 /* write file selection to function tables */
 gichans       filenchnls  gSfilepath                 ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL      ftgen       1,0,0,1,gSfilepath,0,0,1
 if gichans==2 then
  gitableR     ftgen       2,0,0,1,gSfilepath,0,0,2
 endif
 giReady       =           1                          ; if no string has yet been loaded giReady will be zero
               cabbageSet  "filer","file",gSfilepath
 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet  "FileName","text",SFileNoExtension
endin


instr 100 ; load dropped files
/* write file selection to function tables */
 gichans       filenchnls  gSDropFile                 ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL      ftgen       1,0,0,1,gSDropFile,0,0,1
 if gichans==2 then
  gitableR     ftgen       2,0,0,1,gSDropFile,0,0,2
 endif
 giReady       =           1                          ; if no string has yet been loaded giReady will be zero
               cabbageSet  "filer","file",gSfilepath
 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSDropFile
                  cabbageSet  "FileName","text",SFileNoExtension
endin




instr 200
if gkOnOff==0 then
 turnoff
endif
knwavelets      cabbageGetValue   "nwavelets"
knwavelets      =                 int(knwavelets)
knwaveletsOS    cabbageGetValue   "nwaveletsOS"
kgap            cabbageGetValue   "gap"
kgapOS          cabbageGetValue   "gapOS"
kmode           cabbageGetValue   "mode"             ; (1=fixed gap durations, 2=gap time dependent on the wavelet duration)
kmode           init              1
kspeed          cabbageGetValue   "speed"
kspeed          =                 2^kspeed
kspeedOS        cabbageGetValue   "speedOS"
kAmp            cabbageGetValue   "Amp"
kAmpModDep      cabbageGetValue   "AmpModDep"
kPreFilter      cabbageGetValue   "PreFilter"
kreset          cabbageGetValue   "reset"

kstereo         cabbageGetValue   "stereo"
kskipSilence    cabbageGetValue   "skipSilence"

if trigger:k(kreset,0.5,0)==1 then
 reinit RESET_CHIPPERS
endif
RESET_CHIPPERS:
ifn1            =                 1
ifn2            =                 1
aL              SoundChipper      ifn1,knwavelets,knwaveletsOS,kgap,kgapOS,kmode-1,kspeed,kspeedOS,kAmpModDep,kPreFilter,kskipSilence
aR              SoundChipper      ifn2,knwavelets,knwaveletsOS,kgap,kgapOS,kmode-1,kspeed,kspeedOS,kAmpModDep,kPreFilter,kskipSilence  ; keep both chippers running even when mono mode is selected
aL              *=                kAmp
aR              *=                kAmp
rireturn
if kstereo==0 then
 aR             =                 aL                                                 ; both channels from the same chipper
endif

                outs              aL, aR
endin



</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>