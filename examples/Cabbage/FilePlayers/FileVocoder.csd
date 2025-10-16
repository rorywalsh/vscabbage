
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; File Vocoder
; Iain McCurdy 2021

; Performs cross-synthesis (vocoding) using frequency domain processing (pvscross opcode)

; First load two contrasting sound files into the provided slots.
; Click 'CROSS SYNTHESISE' to perform the cross-synthesis (vocoding)

; Playback speeds and pitches (frequency scaling) for each contributing sound file can be adjusted using dials.
; Check what each sound file sounds like by clicking on 'Audition' in the relevant slot.

; Change the number of frequency channels (frequency resolution) using FFT size menu. Classic vocoder effects should use a low FFT Size.

; The two 'Amp' dials vary the amplitude data contribution for each of the two sound files. Experimentation is recommended.


<Cabbage>
form caption("File Vocoder")    size(850,430), colour(0,0,0) pluginId("FiVo"), guiMode("queue") 
image                 bounds(  0,  0,850,430), colour(70,60,65), outlineColour("White"), line(3), shape("sharp")

soundfiler            bounds(125,  5,720,148), channel("beg","len"),  colour(150, 150, 255), fontColour(160, 160, 160, 255)
label                 bounds(126,  4,440, 14), text(""), align(left), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")
filebutton            bounds( 20, 10, 83, 20), text("OPEN FILE 1","OPEN FILE 1"), fontColour(150,150,255) channel("filename"), shape("ellipse")
rslider               bounds(  5, 35, 60, 80), text("Speed"),  channel("Speed1"),  range(-1,1,1,1,0.01),              $RSliderStyle
rslider               bounds( 60, 35, 60, 80), text("Pitch"),  channel("Pitch1"),  range(0.25,2,1,1,0.01),              $RSliderStyle
button                bounds( 20,125, 83, 20), text("Audition","Audition"), channel("Audition1"), value(0), latched(1), fontColour:0(50,50,50), fontColour:1(205,255,205), colour:0(0,10,0), colour:1(0,150,0)

soundfiler            bounds(125,155,720,148), channel("beg2","len2"),  colour(255,150,150), fontColour(160, 160, 160, 255)
label                 bounds(126,154,440, 14), text(""), align(left), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox2")
filebutton            bounds( 20,160, 83, 20), text("OPEN FILE 2","OPEN FILE 2"), fontColour(255,150,150) channel("filename2"), shape("ellipse")
rslider               bounds(  5,185, 60, 80), text("Speed"),  channel("Speed2"),  range(-1,1,1,1,0.01),              $RSliderStyle
rslider               bounds( 60,185, 60, 80), text("Pitch"),  channel("Pitch2"),  range(0.25,2,1,1,0.01),              $RSliderStyle
button                bounds( 20,275, 83, 20), text("Audition","Audition"), channel("Audition2"), value(0), latched(1), fontColour:0(50,50,50), fontColour:1(205,255,205), colour:0(0,10,0), colour:1(0,150,0)

#define RSliderStyle trackerColour(200,200,200), colour( 70, 60, 65), fontColour(200,200,200), textColour(200,200,200),  markerColour(220,220,220), outlineColour(50,50,50), valueTextBox(1)

label      bounds( 6, 20,450, 13), text("Click and drag on waveform to select sound portion for time stretching..."), align(left), colour("black"), fontColour("white"), visible(0), channel("InstructionID")

button     bounds(  7,337,133, 20), text("CROSS SYNTHESISE","CROSS SYNTHESISE"), channel("PlayLoop"), value(0), latched(1), fontColour:0(50,50,50), fontColour:1(205,255,205), colour:0(0,10,0), colour:1(0,150,0)
button     bounds(  7,359,133, 20), text("RECORD OUTPUT","RECORD OUTPUT"), channel("RecOut"), value(0), latched(1), fontColour:0(50,50,50), fontColour:1(255,205,205), colour:0(10,0,0), colour:1(150,0,0)
label      bounds(145,337, 83, 12), text("FFT Size:"), align(centre), fontColour("white")
combobox   bounds(155,350, 63, 17), channel("FFTSize"), items("16384", "8192", "4096", "2048", "1024", "512", "256", "128", "64"), value(5), fontColour("white")

rslider    bounds(225,312, 70, 90), text("Amp 1"),  channel("Amp1"),  range(0,1,0),              $RSliderStyle
rslider    bounds(295,312, 70, 90), text("Amp 2"),  channel("Amp2"),  range(0,1,1),              $RSliderStyle

label    bounds(  5,417,120, 12), text("Iain McCurdy |2024|"), align("left"), fontColour("Silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n --midi-key=4 -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 64
nchnls = 2
0dbfs  = 1

giFFTSizes[]          array              16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64    ; an array is used to store FFT window sizes

gichans               init               0        ; 
giReady               init               0        ; flag to indicate function table readiness
gSfilepath            init               ""

gichans2              init               0        ; 
giReady2              init               0        ; flag to indicate function table readiness
gSfilepath2           init               ""

giFFTSizes[]          array              16384, 8192, 4096, 2048, 1024, 512, 256, 128, 64    ; an array is used to store FFT window sizes


instr    1

; LOAD FILE 
 gSfilepath           cabbageGetValue    "filename"
 kNewFileTrg          changed            gSfilepath        ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                             ; if a new file has been loaded...
                      event              "i",99,0,0.01     ; call instrument to update sample storage function table 
 endif   

 gSfilepath2          cabbageGetValue    "filename2"
 kNewFileTrg          changed            gSfilepath2        ; if a new file is loaded generate a trigger
 if kNewFileTrg==1 then                              ; if a new file has been loaded...
                      event              "i",199,0,0.01     ; call instrument to update sample storage function table 
 endif   


; READ IN WIDGETS
gkSpeed1              cabbageGetValue    "Speed1"
gkPitch1              cabbageGetValue    "Pitch1"
gkSpeed2              cabbageGetValue    "Speed2"
gkPitch2              cabbageGetValue    "Pitch2"
gkAmp1                cabbageGetValue    "Amp1"
gkAmp2                cabbageGetValue    "Amp2"

kPlayLoop             cabbageGetValue    "PlayLoop"
if changed:k(kPlayLoop)==1 then
 if kPlayLoop==1 then
                      event              "i", 2, 0, -1
 else
                      turnoff2           2, 0, 1
 endif
endif

; Audition 1
kAudition1            cabbageGetValue    "Audition1"
if changed:k(kAudition1)==1 then
 if kAudition1==1 then
                      event              "i", 11, 0, -1
 else
                      turnoff2           11, 0, 1
 endif
endif

; Audition 2
kAudition2            cabbageGetValue    "Audition2"
if changed:k(kAudition2)==1 then
 if kAudition2==1 then
                      event              "i", 12, 0, -1
 else
                      turnoff2           12, 0, 1
 endif
endif

;Record
kRecOut               cabbageGetValue    "RecOut"
if changed:k(kRecOut)==1 then
 if kRecOut==1 then
                      event              "i", 1000, 0, -1
 else
                      turnoff2           1000, 0, 1
 endif
endif

endin



instr    99    ; load sound file
 gichans              filenchnls          gSfilepath                 ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL             ftgen               1,0,0,1,gSfilepath,0,0,1
 if gichans==2 then
  gitableR            ftgen               2,0,0,1,gSfilepath,0,0,2
 endif
 giReady              =                   1                          ; if no string has yet been loaded giReady will be zero
                      cabbageSet          "beg","file",gSfilepath

 ; write file name to GUI
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                  cabbageSet                "stringbox", "text", SFileNoExtension
endin


instr    199    ; load sound file
 gichans2              filenchnls           gSfilepath2                 ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL2             ftgen                3,0,0,1,gSfilepath2,0,0,1
 if gichans2==2 then
  gitableR2            ftgen                4,0,0,1,gSfilepath2,0,0,2
 endif
 giReady2              =                    1                          ; if no string has yet been loaded giReady will be zero
                       cabbageSet           "beg2","file",gSfilepath2

 ; write file name to GUI
 SFileNoExtension cabbageGetFileNoExtension gSfilepath2
                  cabbageSet                "stringbox2", "text", SFileNoExtension
endin




instr 2

iFFTSize          cabbageGetValue           "FFTSize"
iFFTSize          =                         giFFTSizes[iFFTSize-1]

; PLAYBACK
kdetect           =                         1
idbthresh         =                         1

/*
for pointer mode
iLen1 = ftlen(1)/sr
iLen2 = ftlen(3)/sr
kPtr1 phasor 1/iLen1
kPtr1 *=     iLen1
kPtr2 phasor 1/iLen2
kPtr2 *=     iLen2
*/

iScale            =                         ftsr(gitableL)/sr

fsrcL             pvstanal                  gkSpeed1*iScale, 1, gkPitch1, gitableL, kdetect, 1, 0, iFFTSize, iFFTSize/8, idbthresh
if gichans = 1 then
 fsrcR            pvstanal                  gkSpeed1*iScale, 1, gkPitch1, gitableL, kdetect, 1, 0, iFFTSize, iFFTSize/8, idbthresh
else
 fsrcR            pvstanal                  gkSpeed1*iScale, 1, gkPitch1, gitableR, kdetect, 1, 0, iFFTSize, iFFTSize/8, idbthresh
endif

fdstL             pvstanal                  gkSpeed2*iScale, 1, gkPitch2, gitableL2, kdetect, 1, 0, iFFTSize, iFFTSize/8, idbthresh
if gichans2 = 1 then
 fdstR            pvstanal                  gkSpeed2*iScale, 1, gkPitch2, gitableL2, kdetect, 1, 0, iFFTSize, iFFTSize/8, idbthresh
else
fdstR             pvstanal                  gkSpeed2*iScale, 1, gkPitch2, gitableR2, kdetect, 1, 0, iFFTSize, iFFTSize/8, idbthresh
endif

fCrossL           pvscross                  fsrcL, fdstL, gkAmp1, gkAmp2
fCrossR           pvscross                  fsrcR, fdstR, gkAmp1, gkAmp2

aL                pvsynth                   fCrossL
aR                pvsynth                   fCrossR

                  outs                      aL, aR

endin


instr  11 ; audition file 1
if gichans==1 then
 a1               diskin2                   gSfilepath,1,0,1
 a2               =                         a1
else
 a1,a2            diskin2                   gSfilepath,1,0,1
endif
                  outs                      a1,a2
endin

instr  12 ; audition file 2
if gichans2==1 then
 a1               diskin2                   gSfilepath2,1,0,1
 a2               =                         a1
else
 a1,a2            diskin2                   gSfilepath2,1,0,1
endif
                  outs                      a1,a2
endin

; record
instr 1000
  a1,a2           monitor
  SOutputName     =                         "SpectralEtching" ;
  iDate           date
  SDate           sprintf                   "%i",iDate
  SOutputName     strcat                    SOutputName,SDate              ; Add date
  SOutputName     strcat                    SOutputName,".wav"             ; Add extension
                  fout                      SOutputName, 8, a1, a2

endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
