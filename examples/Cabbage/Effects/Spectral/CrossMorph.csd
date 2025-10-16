
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; CrossMorph.csd
; Written by Iain McCurdy, 2023

; Performs cross-synthesis between two sound files using FFT and either the pvsmorph or pvscross opcodes. 
; These two opcodes can produce similar results but the interface offered to the user differs slightly in each.
; Channel vocoder-like sounds can be produced.

; Instructions
; ------------
; Load in sound files in the FILE 1 and FILE 2 locations. For classic vocoder-like sounds, 
;   one of these should be a voice (drums also works) and the other should be something harmonic and possibly polyphonic.
; It doesn't really matter which way around the files are as there is a 'SWAP FILES' button.
; Press play for both files.

; pvsmorph
; Morph the amplitudes and frequencies from the two input files contributing to the output independently using the two sliders.

; pvscross
; Morph the amplitudes and frequencies from the two input files contributing to the output independently using the two sliders.

; Sound Quality
; -------------
; Sound quality is largely dependent on the settings made for FFT Size and Overlaps
; FFT Size - number of frequency slices in the analysis-resynthesis and hence the size of each slice in hertz
;            lower values produce the more classic sounding vocoder sounds
; Overlaps - analyis-resynthesis is performed on short grains of sound. 
;            Typically these overlap and increasing the number of overlaps can smoothen the output sound.

; Input Sound Playback Parameters
; -------------------------------
; Transpose - transposition of the input sound in semitones (in semitone steps). Uses pvscale.
;             reset by double-clicking the control
; Speed     - playback speed ratio of the input sound affecting both speed and pitch. Uses diskin speed control.

; Record    - records the sound heard to an output file which will be stored in your home directory.   


<Cabbage>
form caption("CrossMorph"), size(541, 475), pluginId("CrMo"), colour(205,205,205), guiMode("queue")

label      bounds( 10,  5, 80, 16), text("FILE 1"), fontColour("black")
filebutton bounds( 10, 25, 80, 18), text("Open File","Open File"), fontColour("white") channel("filename1"), shape("ellipse"), colour:0(50,50,100)
button     bounds( 10, 50, 80, 18), text("PLAY","PLAY"), channel("Play1"), value(0), latched(1), fontColour:0(70,120,70), fontColour:1(205,255,205), colour:0(20,40,20), colour:1(0,150,0)
rslider    bounds( -2, 72, 60, 70), channel("trans1"), range(-24, 24, 0,1,1), text("Transpose"), valueTextBox(1), textColour("Black"), fontColour("Black"), colour(150,150,170), colour(200,200,220), trackerColour(110,110,120)
rslider    bounds( 43, 72, 60, 70), channel("speed1"), range(-1, 2, 1,0.50.1), text("Speed"), valueTextBox(1), textColour("Black"), fontColour("Black"), colour(150,150,170), colour(200,200,220), trackerColour(110,110,120)
soundfiler bounds(100,  1,440,148), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)

line       bounds(  0,150,540,   1), colour("DarkSlateGrey")

label      bounds( 10,155, 80, 16), text("FILE 2"), fontColour("black")
filebutton bounds( 10,175, 80, 18), text("Open File","Open File"), fontColour("white") channel("filename2"), shape("ellipse"), colour:0(50,50,100)
button     bounds( 10,200, 80, 18), text("PLAY","PLAY"), channel("Play2"), value(0), latched(1), fontColour:0(70,120,70), fontColour:1(205,255,205), colour:0(20,40,20), colour:1(0,150,0)
rslider    bounds( -2,222, 60, 70), channel("trans2"), range(-24, 24, 0,1,1), text("Transpose"), valueTextBox(1), textColour("Black"), fontColour("Black"), colour(150,150,170), colour(200,200,220), trackerColour(110,110,120)
rslider    bounds( 43,222, 60, 70), channel("speed2"), range(-1, 2, 1,0.50.1), text("Speed"), valueTextBox(1), textColour("Black"), fontColour("Black"), colour(150,150,170), colour(200,200,220), trackerColour(110,110,120)
soundfiler bounds(100,151,440,148), channel("beg","len"), channel("filer2"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)

label      bounds( 82,  4,448,  9), text(""), align(left), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox1")
label      bounds( 82,154,448,  9), text(""), align(left), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox2")

line       bounds(  0,300,540,   1), colour("DarkSlateGrey")

image bounds(0,305,540,300) colour(0,0,0,0) 
{
label    bounds(10,  5, 60, 13), text("FFT Size"), fontColour(138, 54, 15)
combobox bounds(10, 18, 60, 20), text("128","256","512","1024","2048","4096"), channel("FFT"), value(3)
label    bounds(10, 40, 60, 13), text("Overlaps"), fontColour(138, 54, 15)
combobox bounds(10, 53, 60, 20), text("2","4","8","16","32","64"), channel("Overlaps"), value(3)
  image bounds(100, 5,540,300) colour(0,0,0,0), channel("pvsMorphWidgets")
  { 
  label   bounds(  0, 20, 20, 30), text("1"), fontColour("Black")
  label   bounds(416, 20, 20, 30), text("2"), fontColour("Black")
  label   bounds( 20,  0,400, 10), text("A M P L I T U D E    I N T E R P O L A T I O N"), fontColour(100,100,255), channel("ampintLabel")
  hslider bounds( 20, 10,400, 20), channel("ampint"), range(0, 1.00, 0),  textColour(138, 54, 15), colour(150,150,170), colour(100,100,255), trackerColour(100,100,255)
  label   bounds( 20, 35,400, 10), text("F R E Q U E N C Y    I N T E R P O L A T I O N"), fontColour(255,100,100), channel("frqintLabel")
  hslider bounds( 20, 45,400, 20), channel("frqint"), range(0, 1.00, 1),  textColour(138, 54, 15), colour(170,150,150), colour(255,100,100), trackerColour(255,100,100)
  }
}

line       bounds(  0,390,540,   1), colour("DarkSlateGrey")

label      bounds( 10, 400, 80, 13), text("Method"), fontColour(138, 54, 15)
combobox   bounds( 10, 415, 80, 20), text("pvsmorph","pvscross"), channel("Method"), value(1)

button     bounds(170,420,100, 25), channel("Swap"), text("SWAP FILES"), latched(1), colour:1("yellow"), fontColour:1("Black")
rslider    bounds(100,400, 60, 70), channel("level"), range(0, 1, 1), text("Level"), valueTextBox(1), textColour("Black"), fontColour("Black"), colour(150,150,170), colour(200,200,220), trackerColour(110,110,120)
checkbox   bounds(280,420, 75, 25), channel("record"), text("Record"), colour("red"), fontColour:0("Black"), fontColour:1("Black")

label      bounds(  3,463,120, 11), text("Iain McCurdy |2023|"), align("left"), fontColour("DarkGrey")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

;sr is set by the host
ksmps       =        64
nchnls      =        2
0dbfs       =        1     ; MAXIMUM AMPLITUDE

gSfilepath1    init    ""
gSfilepath2    init    ""
gkFileChans1,gkFileChans2    init    0

opcode FileNameFromPath,S,S        ; Extract a file name (as a string) from a full path (also as a string)
 Ssrc    xin                       ; Read in the file path string
 icnt    strlen    Ssrc            ; Get the length of the file path string
 LOOP:                             ; Loop back to here when checking for a backslash
 iasc    strchar Ssrc, icnt        ; Read ascii value of current letter for checking
 if iasc==92 igoto ESCAPE          ; If it is a backslash, escape from loop
 loop_gt    icnt,1,0,LOOP          ; Loop back and decrement counter which is also used as an index into the string
 ESCAPE:                           ; Escape point once the backslash has been found
 Sname   strsub  Ssrc, icnt+1, -1  ; Create a new string of just the file name
         xout    Sname             ; Send it back to the caller instrument
endop

gkRecordingActiveFlag    init    0
gkFileRecorded           init    0

instr    1    ;READ IN WIDGETS
 gkMethod       cabbageGetValue    "Method"
 gkMethod       init               1
 kTrig          changed            gkMethod
 if kTrig==1 then
  if gkMethod==1 then
   cabbageSet kTrig,"ampintLabel", "text", "A M P L I T U D E    I N T E R P O L A T I O N"
   cabbageSet kTrig,"frqintLabel", "text", "F R E Q U E N C Y    I N T E R P O L A T I O N"
  else
   cabbageSet kTrig,"ampintLabel", "text", "A M P L I T U D E   1"
   cabbageSet kTrig,"frqintLabel", "text", "A M P L I T U D E   2"
  endif
 endif
 gSfilepath1    cabbageGetValue    "filename1"        ; read in file path string from filebutton widget
 gSfilepath2    cabbageGetValue    "filename2"        ; read in file path string from filebutton widget 
 if changed:k(gSfilepath1)==1 then           ; call instrument to update waveform viewer  
  event "i",98,0,0
 elseif changed:k(gSfilepath2)==1 then       ; call instrument to update waveform viewer  
  event "i",99,0,0
 endif

 gkPlay1        cabbageGetValue    "Play1"
 gkPlay2        cabbageGetValue    "Play2"

 if trigger:k(gkPlay1,0.5,0)==1 then
  event "i",3,0,3600*24*7
 elseif trigger:k(gkPlay2,0.5,0)==1 then
  event "i",4,0,3600*24*7
 endif

 gkrecord    cabbageGetValue    "record"
 kRecStart   trigger    gkrecord,0.5,0
 if kRecStart==1 && gkRecordingActiveFlag==0 then
             event     "i",9000,0,-1
  gkRecordingActiveFlag =    1
 endif
endin


instr 3 ; Play File 1
  if gkPlay1==0 then
   turnoff
  endif
  kspeed1 cabbageGetValue "speed1"
  if changed:k(gSfilepath1)==1 || changed:k(gkFileChans1)==1 then
   reinit RESTART1
  endif
  RESTART1:
  if i(gkFileChans1)==1 then
   gaFile1L diskin2   gSfilepath1,kspeed1,0,1
   gaFile1R =         gaFile1L
  else
   gaFile1L, gaFile1R diskin2 gSfilepath1,kspeed1,0,1
  endif
endin

instr 4 ; Play File 2
  if gkPlay2==0 then
   turnoff
  endif
  kspeed2 cabbageGetValue "speed2"
  if changed:k(gSfilepath2)==1 || changed:k(gkFileChans2)==1 then
   reinit RESTART2
  endif
  RESTART2:
  if i(gkFileChans2)==1 then
   gaFile2L diskin2 gSfilepath2,kspeed2,0,1
   gaFile2R =       gaFile2L
  else
   gaFile2L, gaFile2R diskin2 gSfilepath2,kspeed2,0,1
  endif
endin


opcode    pvsmorph_module,a,aakkkkii
    afile1,afile2,kampint,kfrqint,ktrans1,ktrans2,iFFT,iOverlaps    xin
    iOLap      limit      iFFT/iOverlaps, 64, 4096           ; LIMIT OVERLAPS TO PREVENT CRASH IF LESS THAN 64
    ffile1     pvsanal    afile1, iFFT, iOLap, iFFT, 1       ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    ftrans1    pvscale    ffile1, semitone(ktrans1)    
    ffile2     pvsanal    afile2, iFFT, iOLap, iFFT, 1       ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    ftrans2    pvscale    ffile2, semitone(ktrans2)    
    fmorph     pvsmorph   ftrans1, ftrans2, kampint, kfrqint ; IMPLEMENT fsig CROSS SYNTHESIS
    aout       pvsynth    fmorph                             ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
               xout       aout    
endop


opcode    pvscross_module,a,aakkkii
    a_src,a_dst,kampS,kampD,klev,iFFT,iOverlaps    xin
    iOLap      limit      iFFT/iOverlaps, 64, 4096           ; LIMIT OVERLAPS TO PREVENT CRASH IF LESS THAN 64
    f_src      pvsanal    a_src, iFFT, iOLap, iFFT, 1        ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    f_dst      pvsanal    a_dst, iFFT, iOLap, iFFT, 1        ; ANALYSE AUDIO INPUT SIGNAL AND OUTPUT AN FSIG
    f_cross    pvscross   f_src, f_dst, kampS, kampD         ; IMPLEMENT fsig CROSS SYNTHESIS
    aout       pvsynth    f_cross                            ; RESYNTHESIZE THE f-SIGNAL AS AN AUDIO SIGNAL
               xout       aout*klev    
endop


instr    10 ; morpher

kampint = 0
kfrqint = 0

    kporttime     linseg             0,0.001,0.02
    kampint       cabbageGetValue    "ampint"
    kfrqint       cabbageGetValue    "frqint"
    ktrans1       cabbageGetValue    "trans1"
    ktrans2       cabbageGetValue    "trans2"
    klevel        cabbageGetValue    "level"
    klevel        portk              klevel, kporttime
    kFFT          cabbageGetValue    "FFT"
    kFFT          init               4
    kOverlaps     cabbageGetValue    "Overlaps"
    kOverlaps     init               3
    kSwap         cabbageGetValue    "Swap"

    aFile1L,aFile1r,aFile2L,aFile2R init 0
    if kSwap==0 then
     aFile1L      =                  gaFile1L
     aFile1R      =                  gaFile1R
     aFile2L      =                  gaFile2L
     aFile2R      =                  gaFile2R
    else
     aFile1L      =                  gaFile2L
     aFile1R      =                  gaFile2R
     aFile2L      =                  gaFile1L
     aFile2R      =                  gaFile1R
    endif

    if changed:k(kFFT,kOverlaps)==1 then
     reinit update
    endif
    update:
    if gkMethod==1 then
     aoutL         pvsmorph_module    aFile1L, aFile2L, kampint, kfrqint, ktrans1, ktrans2, 2^(i(kFFT)+6), 2^(i(kOverlaps))
     aoutR         pvsmorph_module    aFile1R, aFile2R, kampint, kfrqint, ktrans1, ktrans2, 2^(i(kFFT)+6), 2^(i(kOverlaps))
    else
     aoutL         pvscross_module    aFile1L, aFile2L, kampint, kfrqint, 1, 2^(i(kFFT)+6), 2^(i(kOverlaps))
     aoutR         pvscross_module    aFile1R, aFile2R, kampint, kfrqint, 1, 2^(i(kFFT)+6), 2^(i(kOverlaps))
    endif   
                  outs               aoutL*a(klevel), aoutR*a(klevel)
                  clear              gaFile1L,gaFile1R,gaFile2L,gaFile2R
endin





instr    98 ; load file 1
 Smessage sprintfk "file(%s)", gSfilepath1            ; print sound file image to fileplayer
 ;chnset Smessage, "filer1"
 cabbageSet "filer1",Smessage
 /* write file name to GUI */
 Sname FileNameFromPath    gSfilepath1                ; Call UDO to extract file name from the full path
 Smessage sprintfk "text(%s)",Sname                   ; create string to update text() identifier for label widget
 ;chnset Smessage, "stringbox1"                        ; send string to  widget
 cabbageSet "stringbox1",Smessage
 gkFileChans1 init  filenchnls:i(gSfilepath1)
 
 ;iFileChans1 =  filenchnls:i(gSfilepath1)
 ;if gkFileChans1==1 then    
endin

instr    99 ; load file 2
 Smessage sprintfk "file(%s)", gSfilepath2            ; print sound file image to fileplayer
 ;chnset Smessage, "filer2"
 cabbageSet "filer2",Smessage
 
 /* write file name to GUI */
 Sname FileNameFromPath    gSfilepath2                ; Call UDO to extract file name from the full path
 Smessage sprintfk "text(%s)",Sname                   ; create string to update text() identifier for label widget
 ;chnset Smessage, "stringbox2"                        ; send string to  widget
 cabbageSet "stringbox2",Smessage
 gkFileChans2 init  filenchnls:i(gSfilepath2)
endin



instr 9000    ; record file
 if gkrecord==0 then
             turnoff
 endif
 aL,aR monitor
 gkFileRecorded        init    1
 
 itim        date
 Stim        dates     itim
 itim        date
 Stim        dates     itim
 Syear       strsub    Stim, 20, 24
 Smonth      strsub    Stim, 4, 7
 Sday        strsub    Stim, 8, 10
 iday        strtod    Sday
 Shor        strsub    Stim, 11, 13
 Smin        strsub    Stim, 14, 16
 Ssec        strsub    Stim, 17, 19
 SDir        chnget    "USER_HOME_DIRECTORY"
 gSname      sprintf   "%s/CrossMorph_%s_%s_%02d_%s_%s_%s.wav", SDir, Syear, Smonth, iday, Shor,Smin, Ssec
 if gkrecord==1 then            ; record
             fout      gSname, 8, aL, aR
 endif
 gkRecordingActiveFlag =    1 - release()
endin

</CsInstruments>

<CsScore>
i 1    0 [60*60*24*7]    ;READ IN WIDGETS
i 10   0 [60*60*24*7]    ;MORPHER
</CsScore>

</CsoundSynthesizer>