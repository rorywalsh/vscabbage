
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; BreakBeatCutter.csd
; Iain McCurdy, 2013, 2023

; Break Beat Cut Up using the bbcut opcode with additional processing

; ==BBCUT=================================================================================================================
; 'Sub-division' determines the note duration used as the base unit in  cut-ups. 
; For example a value of 8 represents quavers (eighth notes), 16 represents semiquavers (sixteenth notes) and so on.                                                   
; 
; 'Bar Length' represents the number of beats per bar. For example, a value of 4 represents a 4/4 bar and so on. 
; 
; 'Phrase' defines the number of bars that will elapse before the cutting up pattern restarts from the beginning.          
; 
; 'Stutter' is a separate cut-up process which occasionally will take a very short fragment of the input audio and repeat
; it many times. 
; 
; 'Stutter Speed' defines the duration of each stutter in relation to 'Sub-division'. 
; If subdivision is 8 (quavers / eighth notes) and 'Stutter Speed' is 2 then each stutter will be a semiquaver / sixteenth note.
; 
; 'Stutter Chance' defines the frequency of stutter moments. 
; The range for this parameter is 0 to 1. Zero means stuttering will be very unlikely, 1 means it will be very likely.       
; 'Repeats' defines the number of repeats that will be employed in normal cut-up events.                                     
; When processing non-rhythmical, unmetered material it may be be more interesting to employ non-whole numbers for parameters such as 'Sub-division', 'Phrase' and 'Stutter Speed'.                                                      
; ========================================================================================================================




; ==FILTER================================================================================================================
; Additionally in this example a randomly moving band-pass filter has been implemented. 
; 
; 'Filter Mix' crossfades between the unfiltered bbcut signal and the filtered bbcut signal.   
; 
; 'Cutoff Freq.' consists of two small sliders which determine the range from which random cutoff values are derived.       
; 
; 'Interpolate<=>S&H' fades continuously between an interpolated random function and a sample and hold type random function. 
; 
; 'Filter Div.' controls the frequency subdivision with which new random cutoff frequency values are generated - a value of '1' means that new values are generated once every bar.                                    
; ========================================================================================================================



; ==WGUIDE================================================================================================================
; A waveguide effect can randomly and rhythmically cut into the audio stream
; 'Chance' defines the probability of this happening. 0=never 1=always
; The range of frequencies the effect will choose from is defined by the user as note values.
; Frequencies are quatised to adhere to equal temperament.
; ========================================================================================================================


; ==SQUARE MOD. (Square wave ring modulation)=============================================================================
; This effect can similarly randomly and rhythmically cut into the audio stream using the 'chance' control
; The range of frequencies the modulator waveform can move between is defined as 'oct' values.
; ========================================================================================================================


; ==F.SHIFT (Frequency Shifter)===========================================================================================
; Similar to the above except using a frequency shifter effect.
; ========================================================================================================================

<Cabbage>
form          size(550,720), caption("Break Beat Cutter"), pluginId("bbct"), colour(30,30,30), guiMode("queue")

#define  SLIDER_STYLE valueTextBox(1)

filebutton bounds(  5, 10, 85, 25), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse")
checkbox   bounds(  5, 40, 85, 25), channel("PlayStop"), text("Play/Stop"), colour("yellow"), fontColour:0("white"), fontColour:1("white")
combobox   bounds(  5, 70, 85, 25), items("Loop","File"), value(1), channel("Source")


soundfiler bounds(100,  5,445, 90), channel("filer1"),  colour("Silver"), fontColour(160, 160, 160, 255), 
label      bounds(101,  6,443, 14), text(""), align(left), colour(0,0,0,0), fontColour(200,200,200), channel("stringbox")

groupbox bounds( 0,100,550,200), text("CUTTER"), plant("cutter"),colour(20,20,20), fontColour(silver){
rslider bounds( 25, 25, 70,100), colour("Tan"), trackerColour("Tan"), fontColour("silver"), text("Sub-div."),       channel("subdiv"),  range(1,  512,  8, 1, 1), $SLIDER_STYLE
rslider bounds(110, 25, 70,100), colour("Tan"), trackerColour("Tan"), fontColour("silver"), text("Bar Length"),     channel("barlen"),  range(1,   16,  2, 1, 1), $SLIDER_STYLE
rslider bounds(195, 25, 70,100), colour("Tan"), trackerColour("Tan"), fontColour("silver"), text("Phrase"),         channel("phrase"),  range(1, 512, 8, 1, 1), $SLIDER_STYLE
rslider bounds(280, 25, 70,100), colour("Tan"), trackerColour("Tan"), fontColour("silver"), text("Repeats"),        channel("repeats"), range(1, 32, 2, 1, 1), $SLIDER_STYLE
rslider bounds(365, 25, 70,100), colour("Tan"), trackerColour("Tan"), fontColour("silver"), text("Stut. Speed"),  channel("stutspd"), range(1, 32, 4, 1, 1), $SLIDER_STYLE
rslider bounds(450, 25, 70,100), colour("Tan"), trackerColour("Tan"), fontColour("silver"), text("Stut. Chance"), channel("stutchnc"), range(0, 1.00, 0.5), $SLIDER_STYLE
hslider bounds(  5,125,540, 40), colour("Tan"), trackerColour("Tan"), fontColour("silver"), textBox(1)    channel("BPM"), range(10,  500, 110,1,1), $SLIDER_STYLE
label   bounds(  5,157,540, 11), text("BPM"), fontColour("silver"), align("centre")
label   bounds( 10,173, 80,12), text("Clock Source:")
button  bounds( 90,170, 60,18), text("Internal","External"), channel("ClockSource"), value(0)
}


groupbox bounds( 0,300,550,135), text("FILTER"), plant("filter"), fontColour(silver),colour(20,20,20){
checkbox bounds( 10,  5, 70, 12), text("On/Off"), channel("FilterOnOff"), value(1), colour("yellow")
rslider bounds( 10, 25, 70,100), colour(200,100,50,255), trackerColour(200,100,50,255), fontColour("silver"), text("Mix"),    channel("FltMix"), range(0, 1.00, 0.6), $SLIDER_STYLE
rslider bounds( 90, 25, 70,100), colour(200,100,50,255), trackerColour(200,100,50,255), fontColour("silver"), text("Division"),    channel("fltdiv"), range(1, 16, 1,1,1), $SLIDER_STYLE
rslider bounds(170, 25, 70,100), colour(200,100,50,255), trackerColour(200,100,50,255), fontColour("silver"), text("Bandwidth"),    channel("bw"), range(0.1, 10, 1, 0.5, 0.001), $SLIDER_STYLE
hslider bounds(250, 45,140, 35), colour(200,100,50,255), trackerColour(200,100,50,255), fontColour("silver"),    channel("cfmin"), range(50, 10000, 50  ,0.5,0.1)
hslider bounds(250, 70,140, 35), colour(200,100,50,255), trackerColour(200,100,50,255), fontColour("silver"),    channel("cfmax"), range(50, 10000, 10000,0.5,0.1)
label   bounds(250,105,140, 12), text("Cutoff Freq."), fontColour("silver"), align("centre")
rslider bounds(405, 25, 70,100), colour(200,100,50,255), trackerColour(200,100,50,255), fontColour("silver"), text("Int./S&H"),    channel("i_h"), range(0, 1, 0)
checkbox bounds(490, 50, 80, 15), channel("FilterPre"), value(0), radioGroup(1), text("Pre"), colour("yellow")
checkbox bounds(490, 75, 80, 15), channel("FilterPost"), value(1), radioGroup(1), text("Post"), colour("yellow")
}

groupbox bounds(  0,435,275,135), text("WAVE GUIDE"), plant("waveguide"), fontColour(silver),colour(20,20,20){
checkbox bounds( 10,  5, 70, 12), text("On/Off"), channel("WaveGuideOnOff"), value(1), colour("yellow")
rslider  bounds( 10, 25, 70,100), colour(150,150,50,255), trackerColour(150,150,50,255), fontColour("silver"), text("Chance"),    channel("WguideChnc"), range(0, 1.00, 0.2), $SLIDER_STYLE
hslider  bounds( 85, 45,115, 35), colour(150,150,50,255), trackerColour(150,150,50,255), fontColour("silver"),    channel("wguidemin"), range(22, 100, 50,1,1)
hslider  bounds( 85, 70,115, 35), colour(150,150,50,255), trackerColour(150,150,50,255), fontColour("silver"),    channel("wguidemax"), range(22, 100, 70,1,1)
label    bounds( 85,105,115, 12), text("Pitch Range"), fontColour("silver")
checkbox bounds(215, 50, 80, 15), channel("WaveGuidePre"), value(0), radioGroup(2), text("Pre"), colour("yellow")
checkbox bounds(215, 75, 80, 15), channel("WaveGuidePost"), value(1), radioGroup(2), text("Post"), colour("yellow")
}

groupbox bounds(275,435,275,135), text("SQUARE MOD."), plant("sqmod"), fontColour(silver),colour(20,20,20){
checkbox bounds( 10,  5, 70, 12), text("On/Off"), channel("SquareModOnOff"), value(1), colour("yellow")
rslider  bounds( 10, 25, 70,100), colour(200,150,200,255), trackerColour(200,150,200,255), fontColour("silver"), text("Chance"),    channel("SqModChnc"), range(0, 1.00, 0.2), $SLIDER_STYLE
hslider  bounds( 85, 45,115, 35), colour(200,150,200,255), trackerColour(200,150,200,255), fontColour("silver"),    channel("sqmodmin"), range(1, 14.0,  6)
hslider  bounds( 85, 70,115, 35), colour(200,150,200,255), trackerColour(200,150,200,255), fontColour("silver"),    channel("sqmodmax"), range(1, 14.0, 12)
label    bounds( 85,105,115, 12), text("Freq.Range"), fontColour("silver")
checkbox bounds(215, 50, 80, 15), channel("SquareModPre"), value(0), radioGroup(3), text("Pre"), colour("yellow")
checkbox bounds(215, 75, 80, 15), channel("SquareModPost"), value(1), radioGroup(3), text("Post"), colour("yellow")
}

groupbox bounds( 0,570,275,135), text("FREQUENCY SHIFT"), plant("fshift"), fontColour(silver),colour(20,20,20){
checkbox bounds( 10,  5, 70, 12), text("On/Off"), channel("FreqShiftOnOff"), value(1), colour("yellow")
rslider  bounds( 10, 25, 70,100), colour(250,110,250,255), trackerColour(250,110,250,255), fontColour("silver"), text("Chance"),    channel("FshiftChnc"), range(0, 1.00, 0.2), $SLIDER_STYLE
hslider  bounds( 85, 45,115, 35), colour(250,110,250,255), trackerColour(250,110,250,255), fontColour("silver"),    channel("fshiftmin"), range(-4000, 4000,-1000)
hslider  bounds( 85, 70,115, 35), colour(250,110,250,255), trackerColour(250,110,250,255), fontColour("silver"),    channel("fshiftmax"), range(-4000, 4000, 1000)
label    bounds( 85,105,115, 12), text("Freq.Range"), fontColour("silver")
checkbox bounds(215, 50, 80, 15), channel("FreqShiftPre"), value(0), radioGroup(4), text("Pre"), colour("yellow")
checkbox bounds(215, 75, 80, 15), channel("FreqShiftPost"), value(1), radioGroup(4), text("Post"), colour("yellow")
}

groupbox bounds(275,570,275,135), text("OUTPUT"), plant("output"), fontColour(silver),colour(20,20,20){
rslider  bounds( 20, 25, 70,100), colour("Tan"), trackerColour("Tan"), fontColour("silver"), text("Layers"),       channel("layers"), range(1, 20, 1,1,1), $SLIDER_STYLE
rslider  bounds(102, 25, 70,100), colour("Tan"), trackerColour("Tan"), fontColour("silver"), text("Dry/Wet"),      channel("DryWet"), range(0, 1.00, 0.6), $SLIDER_STYLE
rslider  bounds(185, 25, 70,100), colour("Tan"), trackerColour("Tan"), fontColour("silver"), text("Level"),        channel("gain"),   range(0, 1.00, 0.75), $SLIDER_STYLE
}

label     bounds( 2,706, 110, 12), text("Iain McCurdy |2013|")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -dm0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  =    64
nchnls =    2
0dbfs  =    1
       seed 0

gisine          ftgen              0,0,131072,10,1

gichans         init               0
gkReady         init               0
gSfilepath      init               ""
gitableL        ftgen              1,0,2,2,0
gkTabLen        init               ftlen(gitableL)

opcode    BBCutIteration,aa,aaiiiiiiiii
 aL,aR,iBPS, isubdiv, ibarlen, iphrase, irepeats, istutspd, istutchnc, icount, ilayers    xin
 aL        bbcutm         aL, iBPS, isubdiv,  ibarlen,  iphrase, irepeats, istutspd, istutchnc
 aR        bbcutm         aR, iBPS, isubdiv,  ibarlen,  iphrase, irepeats, istutspd, istutchnc
 amixL          =              0
 amixR          =              0
 if icount<ilayers then
   amixL,amixR  BBCutIteration aL,aR, iBPS, isubdiv,  ibarlen,  iphrase, irepeats, istutspd, istutchnc, icount+1, ilayers
 endif
                xout           aL + amixL, aR + amixL
endop

opcode    FreqShifter,a,aki
    ain,kfshift,ifn xin                             ;READ IN INPUT ARGUMENTS
    areal, aimag    hilbert      ain                ;HILBERT OPCODE OUTPUTS TWO PHASE SHIFTED SIGNALS, EACH 90 OUT OF PHASE WITH EACH OTHER
    asin            oscili       1, kfshift, ifn, 0
    acos            oscili       1, kfshift, ifn, 0.25    
    ;RING MODULATE EACH SIGNAL USING THE QUADRATURE OSCILLATORS AS MODULATORS
    amod1           =            areal * acos
    amod2           =            aimag * asin    
    ;UPSHIFTING OUTPUT
    aFS             =            (amod1 - amod2)
                    xout         aFS                ;SEND AUDIO BACK TO CALLER INSTRUMENT
endop

instr 1    ; read widgets
 gksubdiv     cabbageGetValue    "subdiv"    ; read in widgets
 gkbarlen     cabbageGetValue    "barlen"
 gkphrase     cabbageGetValue    "phrase"
 gkrepeats    cabbageGetValue    "repeats"
 gkstutspd    cabbageGetValue    "stutspd"
 gkstutchnc   cabbageGetValue    "stutchnc"

 gkClockSource cabbageGetValue   "ClockSource"
 if gkClockSource==0 then
  gkBPM        cabbageGetValue   "BPM"
 else
  gkBPM        cabbageGetValue   "HOST_BPM"
  gkBPM        limit    gkBPM, 10,500    
 endif

 gkfltdiv      cabbageGetValue    "fltdiv"
 gkDryWet      cabbageGetValue    "DryWet"
 gkFltMix      cabbageGetValue    "FltMix"
 gkbw          cabbageGetValue    "bw"
 gkcfmin       cabbageGetValue    "cfmin"
 gkcfmax       cabbageGetValue    "cfmax"
 gki_h         cabbageGetValue    "i_h"
 gklayers      cabbageGetValue    "layers"
 gkgain        cabbageGetValue    "gain"
 konoff        cabbageGetValue    "onoff"



 ; load file from browse
 gSfilepath    cabbageGetValue  "filename"  ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then           ; call instrument to update waveform viewer  
  event "i",99,0,0
 endif

 ; load file from dropped file
 gSDropFile    cabbageGet       "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
               event            "i",100,0,0         ; load dropped file
 endif
 
 kPlayStop cabbageGetValue "PlayStop"
 if trigger:k(kPlayStop,0.5,0)==1 && gkReady>0 then
  event "i",2,0,-1
 elseif trigger:k(kPlayStop,0.5,1)==1 then
  turnoff2 2,0,0
 endif
 
endin



instr    99    ; load sound file
 gichans        filenchnls         gSfilepath               ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL       ftgen              1,0,0,1,gSfilepath,0,0,1
 giFileLen      filelen            gSfilepath               ; derive the file duration
 gkTabLen       init               ftlen(gitableL)          ; table length in sample frames
 if gichans==2 then
  gitableR      ftgen              2,0,0,1,gSfilepath,0,0,2
 endif
 gkReady        init               i(gkReady) + 1

                cabbageSet         "filer1", "file", gSfilepath

 /* write file name to GUI */
 SFileNoExtension cabbageGetFileNoExtension gSfilepath
                cabbageSet         "stringbox","text",SFileNoExtension

endin


instr    100 ; LOAD DROPPED SOUND FILE
 gichans        filenchnls         gSDropFile                 ; derive the number of channels (mono=1,stereo=2) in the sound file
 gitableL       ftgen              1,0,0,1,gSDropFile,0,0,1
 giFileLen      filelen            gSDropFile                 ; derive the file duration in seconds
 gkTabLen       init               ftlen(gitableL)            ; table length in sample frames
 if gichans==2 then
  gitableR      ftgen              2,0,0,1,gSDropFile,0,0,2
 endif
 gkReady        init               i(gkReady) + 1
                cabbageSet         "filer1","file",gSDropFile

 ; write file name to GUI
 SFileNoExtension cabbageGetFileNoExtension gSDropFile
                  cabbageSet                "stringbox", "text", SFileNoExtension
endin


instr    2 ; BBCuts instrument
 kSource        cabbageGetValue "Source"
 kFilterPre     cabbageGetValue "FilterPre"
 kWaveGuidePre  cabbageGetValue "WaveGuidePre"
 kFreqShiftPre  cabbageGetValue "FreqShiftPre"
 kSquareModPre  cabbageGetValue "SquareModPre"

 kFilterOnOff    cabbageGetValue "FilterOnOff"
 kWaveGuideOnOff cabbageGetValue "WaveGuideOnOff"
 kFreqShiftOnOff cabbageGetValue "FreqShiftOnOff"
 kSquareModOnOff cabbageGetValue "SquareModOnOff"
 
 kmetro        metro        4
 kSwitch       init         0
 if kmetro==1 then
  kSwitch      changed      kSource,gkReady,gkBPM, gkrepeats, gkphrase, gkstutspd, gkstutchnc, gkbarlen, gksubdiv, gkfltdiv, gklayers    ;GENERATE A MOMENTARY '1' PULSE IN OUTPUT 'kSwitch' IF ANY OF THE SCANNED INPUT VARIABLES CHANGE. (OUTPUT 'kSwitch' IS NORMALLY ZERO)
 endif
 if kSwitch==1 then                 ; IF I-RATE VARIABLE CHANGE TRIGGER IS '1'...
               reinit       UPDATE  ; BEGIN A REINITIALISATION PASS FROM LABEL 'UPDATE'
 endif
 UPDATE:

 /* INPUT */
; aL,aR         ins                  ; live input

if gichans==1 then
 aL diskin2 gSfilepath,1,0,1
 aR =       aL
elseif gichans==2 then
 aL,aR diskin2 gSfilepath,1,0,1
endif
 aDryL =       aL
 aDryR =       aR
 

if i(kSource)==1 then
iLen   filelen  gSfilepath
;iBeats =       8
iNBars  =       2
iBPS    =       1 / (iLen/(i(gkbarlen)*iNBars))
else
 iBPS          =            i(gkBPM)/60
endif
 
 kmetro        metro        iBPS        ; metronome used for triggering random parameter changes
 
 ;FILTER=================================================================================================================================================================
 if kFilterPre==1 && kFilterOnOff==1 then
 ifreq         =            iBPS * i(gkfltdiv)            ; FREQUENCY WITH WHICH NEW FILTER CUTOFF VALUES ARE GENERATED
 kcf1h        randomh       gkcfmin, gkcfmax, ifreq       ; sample and hold random frequency values
 kcf1i        lineto        kcf1h, 1/ifreq                ; interpolate values
 kcf1         ntrpol        kcf1i, kcf1h, gki_h           ; crossfade between interpolating and sample and hold type random values
 abbFltL      resonz        aL, kcf1, kcf1*gkbw, 2   ; band-pass filter
 aL           ntrpol        aL, abbFltL, gkFltMix    ; crossfade between unfiltered and filter audio signal
 kcf2h        randomh       gkcfmin, gkcfmax, ifreq       ;   RIGHT CHANNEL
 kcf2i        lineto        kcf2h, 1/ifreq                ; 
 kcf2         ntrpol        kcf2i, kcf2h, gki_h           ; 
 abbFltR      resonz        aR, kcf2, kcf2*gkbw, 2   ; 
 aR           ntrpol        aR, abbFltR, gkFltMix    ; 
 endif
 ;=======================================================================================================================================================================
 
 ;WGUIDE1================================================================================================================================================================
 if kWaveGuidePre==1 && kWaveGuideOnOff==1 then
 kchance      cabbageGetValue    "WguideChnc"
 kdice        trandom    kmetro,0,1
 if kdice<kchance then
  kwguidemin  cabbageGetValue    "wguidemin"
  kwguidemax  cabbageGetValue    "wguidemax"
  knum        randomh    kwguidemin,kwguidemax,iBPS
  afrq        interp     cpsmidinn(int(knum))
  kfb         randomi    0.8,0.99,iBPS/4
  kcf         randomi    800,4000,iBPS
  aL          wguide1    aL*0.7,afrq,kcf,kfb
  aR          wguide1    aR*0.7,afrq,kcf,kfb
 endif  
 endif
 ;=======================================================================================================================================================================
 
 ;SQUARE MOD==============================================================================================================================================================
 if kSquareModPre==1 && kSquareModOnOff==1 then
 kchance      cabbageGetValue    "SqModChnc"               ; read in widgets
 ksqmodmin    cabbageGetValue    "sqmodmin"                ;
 ksqmodmax    cabbageGetValue    "sqmodmax"                ; 
 kDiceRoll    trandom    kmetro,0,1               ; new 'roll of the dice' upon each new time period
 if kDiceRoll<kchance then                        ; if 'roll of the dice' is within chance boundary... 
  kratei      randomi   ksqmodmin,ksqmodmax,iBPS  ; interpolating random function for modulating waveform frequency
  krateh      randomh   ksqmodmin,ksqmodmax,iBPS  ; sample and hold random function for modulating waveform frequency
  kcross      randomi   0,1,iBPS                  ; crossfader for morphing between interpolating and S&H functions
  krate       ntrpol    kratei,krateh,kcross      ; create crossfaded rate function
  amod        lfo       1,cpsoct(krate),2         ; modulating waveform (square waveform)
  kcf         limit     cpsoct(krate)*4,20,sr/3   ; cutoff freq for filtering some of the high freq. content of the square wave
  amod        clfilt    amod,kcf,0,2              ; low-pass filter square wave
  aL          =         aL*amod                   ; ring modulate audio
  aR          =         aR*amod                   ;
 endif
 endif
 ;=======================================================================================================================================================================
 
 ;FSHIFT=================================================================================================================================================================
 if kFreqShiftPre==1 && kFreqShiftOnOff==1 then
 kchance      cabbageGetValue      "FshiftChnc"                    ; read in widgets                         
 kdice        trandom     kmetro,0,1                      ; new 'roll of the dice' upon each new time period                                                                         
 if kdice<kchance then                                    ; if 'roll of the dice' is within chance boundary...                                                                           
  kfshiftmin  cabbageGetValue      "fshiftmin"                     ; read in widgets                           
  kfshiftmax  cabbageGetValue      "fshiftmax"                     ; 
  kfsfrqi     randomi     kfshiftmin,kfshiftmax,iBPS*2    ; interpolating random function for modulating waveform frequency          
  kfsfrqh     randomh     kfshiftmin,kfshiftmax,iBPS*2    ; sample and hold random function for modulating waveform frequency            
  kcross      randomi     0,1,iBPS*2                      ; crossfader for morphing between interpolating and S&H functions          
  kfsfrq      ntrpol      kfsfrqi,kfsfrqh,kcross          ; create crossfaded rate function  modulating waveform (square waveform)
  aL          FreqShifter aL,kfsfrq,gisine                ;                                                 
  aR          FreqShifter aR,kfsfrq,gisine                ;
 endif                                                    ;                                                                            
 endif
 ;=======================================================================================================================================================================

 
 
 
 
 ; call UDO
 ;OUTPUT          OPCODE            INPUT |  BPM  | SUBDIVISION | BAR_LENGTH | PHRASE_LENGTH | NUM.OF_REPEATS | STUTTER_SPEED | STUTTER_CHANCE    
 aBBCutL,aBBCutR  BBCutIteration    aL,aR,  iBPS,  i(gksubdiv),  i(gkbarlen),   i(gkphrase),    i(gkrepeats),   i(gkstutspd),   i(gkstutchnc),  1, i(gklayers)
 aL               =                 aBBCutL
 aR               =                 aBBCutR
 
 
 
 
 ;FILTER=================================================================================================================================================================
 if kFilterPre==0 && kFilterOnOff==1 then
 ifreq         =            iBPS * i(gkfltdiv)            ; FREQUENCY WITH WHICH NEW FILTER CUTOFF VALUES ARE GENERATED
 kcf1h        randomh       gkcfmin, gkcfmax, ifreq       ; sample and hold random frequency values
 kcf1i        lineto        kcf1h, 1/ifreq                ; interpolate values
 kcf1         ntrpol        kcf1i, kcf1h, gki_h           ; crossfade between interpolating and sample and hold type random values
 abbFltL      resonz        aL, kcf1, kcf1*gkbw, 2   ; band-pass filter
 aL           ntrpol        aL, abbFltL, gkFltMix    ; crossfade between unfiltered and filter audio signal
 kcf2h        randomh       gkcfmin, gkcfmax, ifreq       ;   RIGHT CHANNEL
 kcf2i        lineto        kcf2h, 1/ifreq                ; 
 kcf2         ntrpol        kcf2i, kcf2h, gki_h           ; 
 abbFltR      resonz        aR, kcf2, kcf2*gkbw, 2   ; 
 aR           ntrpol        aR, abbFltR, gkFltMix    ; 
 endif
 ;=======================================================================================================================================================================

 ;WGUIDE1================================================================================================================================================================
 if kWaveGuidePre==0 && kWaveGuideOnOff==1 then
 kchance      cabbageGetValue    "WguideChnc"
 kdice        trandom    kmetro,0,1
 if kdice<kchance then
  kwguidemin  cabbageGetValue    "wguidemin"
  kwguidemax  cabbageGetValue    "wguidemax"
  knum        randomh    kwguidemin,kwguidemax,iBPS
  afrq        interp     cpsmidinn(int(knum))
  kfb         randomi    0.8,0.99,iBPS/4
  kcf         randomi    800,4000,iBPS
  aL          wguide1    aL*0.7,afrq,kcf,kfb
  aR          wguide1    aR*0.7,afrq,kcf,kfb
 endif  
 endif
 ;=======================================================================================================================================================================

 ;SQUARE MOD==============================================================================================================================================================
 if kSquareModPre==0 && kSquareModOnOff==1 then
 kchance      cabbageGetValue    "SqModChnc"               ; read in widgets
 ksqmodmin    cabbageGetValue    "sqmodmin"                ;
 ksqmodmax    cabbageGetValue    "sqmodmax"                ; 
 kDiceRoll    trandom    kmetro,0,1               ; new 'roll of the dice' upon each new time period
 if kDiceRoll<kchance then                        ; if 'roll of the dice' is within chance boundary... 
  kratei      randomi   ksqmodmin,ksqmodmax,iBPS  ; interpolating random function for modulating waveform frequency
  krateh      randomh   ksqmodmin,ksqmodmax,iBPS  ; sample and hold random function for modulating waveform frequency
  kcross      randomi   0,1,iBPS                  ; crossfader for morphing between interpolating and S&H functions
  krate       ntrpol    kratei,krateh,kcross      ; create crossfaded rate function
  amod        lfo       1,cpsoct(krate),2         ; modulating waveform (square waveform)
  kcf         limit     cpsoct(krate)*4,20,sr/3   ; cutoff freq for filtering some of the high freq. content of the square wave
  amod        clfilt    amod,kcf,0,2              ; low-pass filter square wave
  aL          =         aL*amod                   ; ring modulate audio
  aR          =         aR*amod                   ;
 endif
 endif
 ;=======================================================================================================================================================================
 
 ;FSHIFT=================================================================================================================================================================
 if kFreqShiftPre==0 && kFreqShiftOnOff==1 then
 kchance      cabbageGetValue      "FshiftChnc"                    ; read in widgets                         
 kdice        trandom     kmetro,0,1                      ; new 'roll of the dice' upon each new time period                                                                         
 if kdice<kchance then                                    ; if 'roll of the dice' is within chance boundary...                                                                           
  kfshiftmin  cabbageGetValue      "fshiftmin"                     ; read in widgets                           
  kfshiftmax  cabbageGetValue      "fshiftmax"                     ; 
  kfsfrqi     randomi     kfshiftmin,kfshiftmax,iBPS*2    ; interpolating random function for modulating waveform frequency          
  kfsfrqh     randomh     kfshiftmin,kfshiftmax,iBPS*2    ; sample and hold random function for modulating waveform frequency            
  kcross      randomi     0,1,iBPS*2                      ; crossfader for morphing between interpolating and S&H functions          
  kfsfrq      ntrpol      kfsfrqi,kfsfrqh,kcross          ; create crossfaded rate function  modulating waveform (square waveform)
  aL          FreqShifter aL,kfsfrq,gisine                ;                                                 
  aR          FreqShifter aR,kfsfrq,gisine                ;
 endif                                                    ;                                                                            
 endif
 ;=======================================================================================================================================================================
  
 amixL        sum         aDryL*(1-gkDryWet), aL*gkDryWet    ; SUM AND MIX DRY SIGNAL AND BBCUT SIGNAL (LEFT CHANNEL)
 amixR        sum         aDryR*(1-gkDryWet), aR*gkDryWet    ; SUM AND MIX DRY SIGNAL AND BBCUT SIGNAL (RIGHT CHANNEL)

              outs        amixL * gkgain, amixR * gkgain     ; SEND AUDIO TO OUTPUTS
endin

</CsInstruments>  

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>