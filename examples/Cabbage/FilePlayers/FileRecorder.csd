
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; FileRecorder.csd
; Written by Iain McCurdy, 2014, 2024
; 
; Records audio to a file on disk in the user's home directory. 
; This file may not appear until the csd is stopped and Cabbage is quit.
; 
; The audio file name includes the date and time. (This idea comes courtesy of Rory Walsh.)
; 
; Toggling record off and on will append the new recording onto the end of the previously recorded audio.
; To start a new file, click 'New File'.

; It may be necessary to stop and exit Cabbage in order for the file to be unlocked and usable in other software.

; Sample rate will be as set in Cabbage's settings or within the DAW host.

; Bit-depth is chosen from the options in the 'Format' drop-down menu.

; Number of channels can be selected from the 'Channels' drop-down menu. If 'Mono' is selected, only the left channels from any stereo input is used.

; This is intended to be used within the Cabbage patcher in the Cabbage standalone application 
; - to facilitate capturing audio in real-time.

<Cabbage>
form caption("File Recorder") size(300,100), colour(0,0,0) pluginId("FRec"), guiMode("queue")
image               bounds(  0,  0,300,100), colour(100,100,100), outlineColour("Silver"), outlineThickness(3)
label    bounds( 10,  5, 130, 13), text("Format"), align("centre"), fontColour("white")
combobox bounds( 10, 20, 130, 20), channel("format"), items("16-bit ints", "32-bit ints", "32-bit floats", "8-bit unsigned ints", "24-bit ints", "64-bit floats", "ogg-vorbis"), value(3)

label    bounds(160,  5, 70, 13), text("Channels"), align("centre"), fontColour("white")
combobox bounds(160, 20, 70, 20), channel("channels"), items("Mono", "Stereo"), value(2)

checkbox bounds( 10, 50, 65, 15), text("CLIP"), channel("red"), shape("ellipse"), value(1), fontColour:0("white"), fontColour:1("white") ;, active(0)
checkbox bounds( 10, 70, 65, 15), text("SIGNAL"), channel("green"), shape("ellipse"), value(1), fontColour:0("white"), fontColour:1("white");, active(0)
checkbox bounds( 80, 55, 75, 25), channel("record"), text("Record"), colour("red"), fontColour:0("white"), fontColour:1("white")
button   bounds(160, 55, 65, 25), colour("red"), text("New File","New File"), channel("reset"), latched(0)
checkbox bounds(235, 55, 75, 25), channel("play"), text("Play"), colour("green"), fontColour:0("white"), fontColour:1("white")

label    bounds(  5,88,120, 10), text("Iain McCurdy |2014|"), align("left"), fontColour("Silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -dm0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 64
nchnls = 2
0dbfs  = 1

gkRecordingActiveFlag init       0
gkFileRecorded        init       0

giFormats[]  fillarray  4, 5, 6, 7, 8, 9, 50

instr    1
 gkformat    =                   giFormats[cabbageGetValue:k("format") - 1]
 gkchannels  cabbageGetValue     "channels"
 gaL,gaR     ins
 
 kRMS        rms                 (gaL+gaR)* 0.714
 
 kTrig       metro               32
 kR          =                   kRMS > 0.05 ? 100 : 0
 kG          =                   kRMS > 0.05 ? 255 : 0
             cabbageSet          kTrig, "green", "colour:1", kR, kG, 0
 kR          =                   kRMS > 0.90 ? 255 : 0
             cabbageSet          kTrig, "red", "colour:1", kR, 0, 0
 
 gkrecord    cabbageGetValue     "record"
 gkreset     cabbageGetValue     "reset"
 gkplay      cabbageGetValue     "play"
 kRecStart   trigger             gkrecord,0.5,0

 if kRecStart==1 && gkRecordingActiveFlag==0 then
             event               "i",9000,0,-1
  gkRecordingActiveFlag =        1
 endif
 
 kPlayStart  trigger             gkplay,0.5,0
 if kPlayStart==1 && gkFileRecorded==1 then
             event               "i",9001,ksmps/sr,3600
 endif

 kResetTrig  trigger             gkreset,0.5,1
 if kResetTrig==1 && gkRecordingActiveFlag==1 then
             event               "i",9000,0,-1
 endif  
endin


instr 9000    ; record file
 if gkplay==1 then
             cabbageSetValue     "record",k(0),k(1)
             turnoff
 endif
 gkFileRecorded init             1
 
 itim           date
 Stim           dates            itim
 itim           date
 Stim           dates            itim
 Syear          strsub           Stim, 20, 24
 Smonth         strsub           Stim, 4, 7
 Sday           strsub           Stim, 8, 10
 iday           strtod           Sday
 Shor           strsub           Stim, 11, 13
 Smin           strsub           Stim, 14, 16
 Ssec           strsub           Stim, 17, 19
 SDir           cabbageGetValue    "USER_HOME_DIRECTORY"
 gSname         sprintf   "%s/FileRecorder_%s_%s_%02d_%s_%s_%s.wav", SDir, Syear, Smonth, iday, Shor,Smin, Ssec
 if gkrecord==1 then ; record
  if i(gkchannels)==1 then ;(mono)
                fout      gSname, i(gkformat), gaL
  elseif i(gkchannels)==2 then ;(stereo)
                fout      gSname, i(gkformat), gaL, gaR
  endif
 endif
 gkRecordingActiveFlag =    1 - release()
endin

instr    9001     ; play file
 if gkplay==0 then
                turnoff
 endif 
   aL,aR        diskin2          gSname,1
                outs             aL,aR
 iFileLen       filelen          gSname
 p3             =                iFileLen
                xtratim          0.1
                krelease         release
                cabbageSetValue  "play",1-krelease,k(1)
endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>