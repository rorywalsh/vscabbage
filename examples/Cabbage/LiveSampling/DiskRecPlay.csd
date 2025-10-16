
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; DiskRecPlay.csd
; Written by Iain McCurdy, 2012, 2023

; Records some audio to a file on disk in the user's home directory (using fout)

; BUTTONS
; Record    - record some audio
; Pause     - pause record/playback
; Play Loop - play entire recording back with looping (inskip will be observed)
; Play Once - play entire recording back once then stop (inskip will be observed)
; Mono/Stereo - in mono mode just the left channel input will be used and will be written to a mono file
;               in stereo mode both left and right channel inputs will be written to a stereo file
; Speed       - playback speed ratio (-16 to +16). Negative values cause reversed playback
; In Skip     - starting offset (as a fraction of the entire file)
; Input Gain  - gain applied to the signal before writing to the stored sound file
; Output Gain - gain applied to the output

; a soundfiler widget is used to display the recorded sound file
 
<Cabbage>
form caption("Disk Rec/Play") size(400, 330), pluginId("dkrp") colour("Black"), guiMode("queue")
groupbox bounds(10,   0, 70, 80), text("Record")
checkbox channel("Record"), bounds(20,25,50,50), value(0), shape("square"), colour:1("red"), colour:0(40,0,0)
groupbox bounds(80,   0, 70, 80), text("Pause")
checkbox channel("Pause"), bounds(90,25,50,50), value(0), shape("square"), colour:1(100,100,255), colour:0(0,0,40)
groupbox bounds(150,   0, 70, 80), text("Play Loop")
checkbox channel("PlayLoop"), bounds(160,25,50,50), value(0), shape("square"), colour:1("Lime"), colour:0(0,40,0)
groupbox bounds(220,   0, 70, 80), text("Play Once")
checkbox channel("PlayOnce"), bounds(230,25,50,50), value(0), shape("square"), colour:1("yellow"), colour:0(40,40,0)

groupbox bounds(290,  0,100, 80), text("Mono/Stereo")
image    bounds(300, 25, 30, 50), corners(15), colour(90,90,90), outlineThickness(1), outlineColour("Black") ; frame
image    bounds(301, 26, 28, 28), channel("toggle"), corners(14), colour(250,250,250), outlineThickness(1), outlineColour("Grey") ; toggle
label    bounds(335, 32, 50, 11), text("• MONO"), align("left")
label    bounds(335, 55, 50, 11), text("• STEREO"), align("left")

hslider bounds(10,  90, 380,20), channel("Speed"), range(-4, 4, 1), text("Speed"), popupText(0)
hslider bounds(10, 120, 380,20), channel("InSkip"), range(0, 1, 0), text("In Skip")
hslider bounds(10, 150, 380,20), channel("InGain"), range(0, 1, 1), text("Input Gain")
hslider bounds(10, 180, 380,20), channel("OutGain"), range(0, 1, 1), text("Output Gain")

image      bounds(  5,215,390,100), colour("Silver"), corners(3)
soundfiler bounds(  7,217,386, 96), channel("filer"), alpha(0.85)
label bounds(  5,316,110, 12), text("Iain McCurdy |2012|"), align("left"), fontColour("Grey")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>
;Author: Iain McCurdy (2012, 2023)

<CsInstruments>

; sr set by host
ksmps    =    32
nchnls   =    2
0dbfs    =    1
gkrecdur    init    0
gSFilePath init ""



instr    1 ; always on

 ; mono/stereo toggle
 kMOUSE_DOWN_LEFT cabbageGetValue  "MOUSE_DOWN_LEFT" ; read in mouse left click
 kMOUSE_X         cabbageGetValue  "MOUSE_X"         ; read in mouse X position
 kMOUSE_Y         cabbageGetValue  "MOUSE_Y"         ; read in mouse Y position
 gkMonoStereo     init             0                 ; mono/stereo toggle variable (0=mono, 1=stereo)
 ; trigger toggle if left click is pressed within area of switch
 if trigger:k(kMOUSE_DOWN_LEFT,0.5,0)==1 && kMOUSE_X>300 && kMOUSE_X<330 && kMOUSE_Y>25 && kMOUSE_Y<75 then
  gkMonoStereo = abs(gkMonoStereo-1) ; variable toggling mechanism
 endif
 kTogPos     lineto     gkMonoStereo*20, 0.05                                        ; glide movement
             cabbageSet changed:k(kTogPos), "toggle", "bounds",301,26+kTogPos,28,28 ; update toggle switch position
 
 
 gkRecord    cabbageGetValue    "Record"                       ; READ IN CABBAGE WIDGET CHANNELS
 gkPause     cabbageGetValue    "Pause"
 gkPlayLoop  cabbageGetValue    "PlayLoop"
 gkPlayOnce  cabbageGetValue    "PlayOnce"
 gkSpeed     cabbageGetValue    "Speed"
 gkSpeed     pow                gkSpeed, 2
 gkInSkip    cabbageGetValue    "InSkip"
 gkInGain    cabbageGetValue    "InGain"
 gkOutGain   cabbageGetValue    "OutGain"

 kswitch    changed    gkRecord,gkPlayOnce,gkPlayLoop ; IF EITHER 'PLAY ONCE', 'PLAY LOOP' OR 'RECORD' ARE CHANGED, GENERATE A MOMENTARY '1'
 if kswitch==1 then                                   ; IF SWITCH CHANGE TRIGGER IS '1'
  reinit RESTART                                      ; BEGIN A REINITIALISATION PASS
 endif                                                ; END OF CONDITIONAL BRANCH
 RESTART:                                             ; A LABEL. BEGIN REINITIALISATION PASS FROM HERE

 SFile       =         "/Recording.wav"
 SPath       cabbageGetValue    "USER_HOME_DIRECTORY"
 SDate       cabbageGetValue    "CURRENT_DATE_TIME"
 kTime       times
 gSFilePath  strcat    SPath,SFile
 ;gSFilePath  sprintf   "%s/%d%s",SPath,kTime,SFile

 if i(gkRecord)==1 then       ; IF RECORD BUTTON IS ON...
     turnon 4                 ; TURN ON RECORD INSTRUMENT
 elseif i(gkRecord)=0 then    ; OR ELSE IF RECORD BUTTON IS OFF...
     turnoff2 4,0,0           ; TURN OFF RECORD INSTRUMENT
 endif                        ; END OF THIS CONDITIONAL BRANCH

 if i(gkPlayLoop)==1 then     ; IF 'PLAY LOOP' BUTTON IS ON...
     turnon 2                 ; TURN ON PLAY LOOP INSTRUMENT
 endif                        ; END OF THIS CONDITIONAL BRANCH

 if i(gkPlayOnce)==1 then     ; IF 'PLAY ONCE' BUTTON IS ON...
     turnon 3                 ; TURN ON PLAY ONCE INSTRUMENT
 endif                        ; END OF THIS CONDITIONAL BRANCH
 rireturn
 
        cabbageSet trigger:k(gkRecord,0.5,1),"filer","file",gSFilePath
endin
        
instr    2                    ; PLAYBACK LOOPED INSTRUMENT
 if    gkPlayLoop=0    then   ; IF PLAY LOOPED BUTTON IS DEACTIVATED THEN...
     turnoff                  ; ...TURNOFF THIS INSTRUMENT
 endif                        ; END OF CONDITIONAL BRANCH
 ifilelen     filelen    gSFilePath
 iInSkip      =          i(gkInSkip)*ifilelen
 kporttime    linseg     0,0.001,0.02
 kSpeed       portk      gkSpeed,kporttime
 kPause       lineto     1-gkPause, 0.05
 if filenchnls:i(gSFilePath)==2 then
    aL,aR     diskin2    gSFilePath,kSpeed*kPause,iInSkip,1            ; PLAY AUDIO FROM FILE
              outs       aL*gkOutGain*a(kPause),aR*gkOutGain*a(kPause) ; SEND AUDIO TO OUTPUT
 else
    aSig      diskin2    gSFilePath,kSpeed*kPause,iInSkip,1            ; PLAY AUDIO FROM FILE
              outs       aSig*gkOutGain*a(kPause),aSig*gkOutGain*a(kPause) ; SEND AUDIO TO OUTPUT
 endif
endin

instr    3    ;PLAYBACK ONCE INSTRUMENT
 if gkPlayOnce=0 then       ; IF PLAY ONCE BUTTON IS DEACTIVATED THEN...
     turnoff                ; ...TURNOFF THIS INSTRUMENT
 endif                      ; END OF CONDITIONAL BRANCH
 ifilelen     filelen    gSFilePath
 iInSkip      =          i(gkInSkip)*ifilelen
 kporttime    linseg     0,0.001,0.02
 kSpeed       portk      gkSpeed,kporttime
 if gkPause!=1 then                                    ; IF PAUSE BUTTON IS NOT ACTIVATED... 
  if filenchnls:i(gSFilePath)==2 then
   aL,aR      diskin2    gSFilePath,kSpeed,iInSkip,0   ; PLAY AUDIO FROM FILE
              outs       aL*gkOutGain,aR*gkOutGain     ; SEND AUDIO TO OUTPUT
  else
   aSig       diskin2    gSFilePath,kSpeed,iInSkip,0   ; PLAY AUDIO FROM FILE
              outs       aSig*gkOutGain,aSig*gkOutGain ; SEND AUDIO TO OUTPUT
  endif
   kplaydur    line      0,1,1                         ; CREATE A RISING VALUE USED AS A TIMER
   if    kplaydur>=gkrecdur    then                    ; IF END OF RECORDING IS REACHED...
     koff     =          0
              chnset     koff,"PlayOnce"
     turnoff                ; - TURN OFF THIS INSTRUMENT IMMEDIATELY.
   endif                    ; END OF CONDITIONAL BRANCH
 endif                      ; END OF CONDITIONAL BRANCH
              cabbageSetValue     "PlayOnce",k(0),release:k()
endin

instr    4    ;RECORD
 if    gkPause!=1    then                                            ; IF PAUSE BUTTON IS NOT ACTIVATED...
  aEnv linsegr 0,0.01,1,0.01,0                                       ; anti-click
  if i(gkMonoStereo)==1 then
    ainL,ainR    ins                                                 ; READ AUDIO FROM STEREO INPUT
                 fout    gSFilePath, 6, ainL*gkInGain*aEnv, ainR*gkInGain*aEnv ; WRITE STEREO AUDIO TO A 32 BIT HEADERLESS FILE (TYPE:6)
  else
    ain          inch    1
                 fout    gSFilePath, 6, ain*gkInGain*aEnv                      ; WRITE MONO AUDIO TO A 32 BIT HEADERLESS FILE (TYPE:6)
  endif 
   gkrecdur      line    0, 1, 1                                       ; GLOBAL VARIABLE USED TO REGISTER THE DURATION OF THE CURRENTLY RECORDED FILE
 endif                                                               ; END OF CONDITIONAL BRANCHING    
endin

</CsInstruments>

<CsScore>
i 1 0 [3600*24*7]
</CsScore>

</CsoundSynthesizer>
