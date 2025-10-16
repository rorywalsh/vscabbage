	
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; SpectralDelay.csd
; Written by Iain McCurdy, 2016, 2024

; This effect implements a spectral delay wherein a spectrally channelised version of the audio signal (separated into amplitude and frequency data)
;  can be delayed on a channel by channel basis and independently for each data type.

; Delay times are typically controlled using function tables as individual controls for each delay time would be impractical.
; In this example the user can choosed from three modes for creating these tables.

; Input Gain      -    Gain applied to the live input signal
; Test            -    this unlatched button injects a broadband impulse into the spectral delay which can be useful for test the response.
; FFT Size        -    FFT size affects the quality of the effect. Small FFT sizes will result in distortions of frequency data.
; Input           -    Mono/Stereo - in 'Mono' mode, the audio received at the left input is copied to the right input.
; Max. Delay      -    Maximum delay time (before scaling by the table). This is an i-rate control.
; Interval        -    Interval (in semitones) of a pitch shift inserted in the feedback loop.
; Feedback        -    feedback around the spectral delay is performed while the signal is stoll in the format of an f-signal
; Smear           -    delay time random shuffling on the buffer (this is not spectral)  
; Dry/Wet         -    dry/wet control of the effect
; Level           -    output level

; Each table can be created using one of three methods, selectable from the drop-down lists:
; 1. Envelope - a two-segment envelope
; 2. Comb     - a sinusoidal shape
; 3. Draw     - click and drag on the table area. Note that the desired maximum delay (Max. Delay) should be set before drawing.
 
; Link            -    when activated, tables choices between amps and freqs will be synced

; Random Factor   -    adds a random value to the envelope-created function. 
;                       These random values are bipolar exponetially random values.
;                       Out of range values are reflected through maxima and minima.

<Cabbage>
form caption("Spectral Delay")  size(860,550), colour(30,30,30), pluginId("SpDl"), guiMode("queue")
image                pos(0, 0), size(860,550), colour(30,30,30), shape("rounded"), outlineColour(125,130,155), outlineThickness(5) 

#define RSLIDER_DESIGN , colour(75,70,70), trackerColour(205,170,170), valueTextBox(1), trackerInsideRadius(0.85), markerStart(0.25), markerEnd(1.25), markerColour("black"), markerThickness(0.4), markerColour(205,170,170), markerEnd(1.2), markerThickness(1)

label   bounds(  0, -4,860, 92), text("SPECTRAL DELAY"), fontColour(255, 50, 50, 50), align("centre")
label   bounds(  0, -1,860, 86), text("SPECTRAL DELAY"), fontColour( 75, 95, 75), align("centre")
label   bounds(  0,  2,860, 80), text("SPECTRAL DELAY"), fontColour(150,150,200), align("centre")
label   bounds(  0,  5,860, 75), text("SPECTRAL DELAY"), fontColour(220,220,220,200), align("centre")

image   bounds(  0, 80,860,120), colour(0,0,0,0) 
{
rslider  bounds( 50,  0, 70,100), text("Input Gain"), channel("InGain"), range(0, 5, 1, 0.5), $RSLIDER_DESIGN

label    bounds(145, 10, 80, 14), text("Input")
combobox bounds(145, 25, 80, 20), text("Mono","Stereo"), channel("MonoStereo"), value(1)
label    bounds(145, 50, 80, 14), text("FFT Size")
combobox bounds(145, 65, 80, 20), text("64","128","256","512","1024","2048","4096"), channel("FFTindex"), value(4)
button   bounds(250, 40, 70, 18), text("TEST","TEST"), channel("test"), latched(0), colour:0(100,100,0), colour:1(255,255,0)

rslider  bounds(350,  0, 70,100), text("Max. Delay"), channel("MaxDelay"), range(0.01, 8, 0.3, 0.5), $RSLIDER_DESIGN
rslider  bounds(430,  0, 70,100), text("Interval"), channel("Interval"), range(-24, 24, 0, 1, 0.01), $RSLIDER_DESIGN

; label    bounds(360,  0,160, 15), text("Filter Table")
; gentable bounds(360, 20,160, 80), tableNumber(301), channel("maskTable"), active(1), tableColour(255,50,50,150), tableBackgroundColour(200,200,200), tableGridColour(100,100,100,100)

rslider  bounds(510,  0, 70,100), text("Feedback"), channel("Feedback"), range(0, 1, 0.85), $RSLIDER_DESIGN
rslider  bounds(590,  0, 70,100), text("Smear"), channel("Smear"), range(0, 1, 0, 0.5), $RSLIDER_DESIGN
rslider  bounds(670,  0, 70,100), text("Dry/Wet Mix"), channel("DryWetMix"), range(0, 1, 0.5), $RSLIDER_DESIGN
rslider  bounds(750,  0, 70,100), text("Level"), channel("Level"), range(0, 5, 1, 0.5), $RSLIDER_DESIGN
}

; amp table
label    bounds(170,195, 80, 14), text("Table Type")
combobox bounds(170,208, 80, 20), items("Envelope","Comb","Draw"), channel("AmpTableType"), value(1)
gentable bounds( 20,230,380, 90), channel("AmpTable"), tableNumber(101), ampRange(0,1,101), tableColour(100,100,255,150), tableBackgroundColour(200,200,200), tableGridColour(100,100,100,100) ;, active(1) ;, rotate(1.57,140,45)
label    bounds( 20,322,380, 14), text("Amplitudes Table"), align("centre")
label    bounds( 23,230, 80, 16), text("Amp. Table"), align("left"), fontColour(20,20,20)
label    bounds( 20,216, 70, 12), text("Max. Delay"), align("left")
label    bounds( 20,320, 40, 12), text("0Hz"), align("left")
label    bounds(350,320, 50, 12), text("sr/2 Hz"), align("right")

; freq table
label    bounds(610,195, 80, 14), text("Table Type")
combobox bounds(610,208, 80, 20), items("Envelope","Comb","Draw"), channel("FrqTableType"), value(1)
gentable bounds(460,230,380, 90), channel("FrqTable"), tableNumber(102), ampRange(0,1,102), tableColour(50,255,50,150), zoom(-1), tableBackgroundColour(200,200,200), tableGridColour(100,100,100,100)
label    bounds(460,322,380, 14), text("Frequencies Table"), align("centre")
label    bounds(463,230, 80, 16), text("Freq. Table"), align("left"), fontColour(20,20,20)
label    bounds(460,216, 70, 12), text("Max. Delay"), align("left")
label    bounds(460,320, 40, 12), text("0Hz"), align("left")
label    bounds(790,320, 50, 12), text("sr/2 Hz"), align("right")

button   bounds(400,265, 60, 18), text("< LINK >","< LINK >"), colour:0(70,70,40), colour:1(170,170,70), fontColour:0(150,150,150), fontColour:1(255,255,255), value(0), channel("link")

image    bounds( 20,345,380, 90), colour(0,0,0,0), outlineThickness(1), corners(5), channel("Amp2Seg")
{
rslider  bounds( 10, 10, 60, 70), text("Delay 1"), channel("AmpDelay1"), range(0, 1, 1), $RSLIDER_DESIGN
rslider  bounds( 70, 10, 60, 70), text("Curve 1"), channel("AmpCurve1"), range(-20, 20, 0,1,0.01), $RSLIDER_DESIGN
rslider  bounds(130, 10, 60, 70), text("Mid Point"), channel("AmpMidPoint"), range(0, 1, 0.2), $RSLIDER_DESIGN
rslider  bounds(190, 10, 60, 70), text("Delay 2"), channel("AmpDelay2"), range(0, 1, 0.5), $RSLIDER_DESIGN
rslider  bounds(250, 10, 60, 70), text("Curve 2"), channel("AmpCurve2"), range(-20, 20, 0,1,0.01), $RSLIDER_DESIGN
rslider  bounds(310, 10, 60, 70), text("Delay 3"), channel("AmpDelay3"), range(0, 1, 0), $RSLIDER_DESIGN
}

image    bounds( 20,345,380, 90), colour(0,0,0,0), outlineThickness(1), corners(5), channel("AmpComb"), visible(0)
{
rslider  bounds( 10, 15, 60, 70), text("N. Peaks"), channel("AmpNPeaks"), range(1, 100, 8), $RSLIDER_DESIGN
rslider  bounds( 70, 15, 60, 70), text("Frq. Shift"), channel("AmpFrqShift"), range(-1, 1, 0), $RSLIDER_DESIGN
rslider  bounds(130, 15, 60, 70), text("Dly. Shift"), channel("AmpDlyShift"), range(0, 1, 0), $RSLIDER_DESIGN
}

image    bounds( 20,345,380, 90), colour(0,0,0,0), outlineThickness(1), corners(5), channel("AmpDraw"), visible(0)
{
button   bounds(155, 35, 70, 20), channel("AmpDrawReset"), text("RESET","RESET"), latched(0)
}

image    bounds( 20,440,380, 90), colour(0,0,0,0), outlineThickness(1), corners(5), channel("AmpRand")
{
rslider  bounds( 10, 10, 60, 70), text("Random"), channel("AmpRndFactor"), range(0, 1, 0, 0.5), $RSLIDER_DESIGN
}


image    bounds(460,345,380, 90), colour(0,0,0,0), outlineThickness(1), corners(5), channel("Frq2Seg")
{
rslider  bounds( 10, 15, 60, 70), text("Delay 1"), channel("FrqDelay1"), range(0, 1, 0), $RSLIDER_DESIGN
rslider  bounds( 70, 15, 60, 70), text("Curve 1"), channel("FrqCurve1"), range(-20, 20, -10,1,0.01), $RSLIDER_DESIGN
rslider  bounds(130, 15, 60, 70), text("Mid Point"), channel("FrqMidPoint"), range(0, 1, 0.2), $RSLIDER_DESIGN
rslider  bounds(190, 15, 60, 70), text("Delay 2"), channel("FrqDelay2"), range(0, 1, 1), $RSLIDER_DESIGN
rslider  bounds(250, 15, 60, 70), text("Curve 2"), channel("FrqCurve2"), range(-20, 20, 0,1,0.01), $RSLIDER_DESIGN
rslider  bounds(310, 15, 60, 70), text("Delay 3"), channel("FrqDelay3"), range(0, 1, 0), $RSLIDER_DESIGN
}

image    bounds(460,345,380, 90), colour(0,0,0,0), outlineThickness(1), corners(5), channel("FrqComb"), visible(0)
{
rslider  bounds( 10, 15, 60, 70), text("N. Peaks"), channel("FrqNPeaks"), range(1, 100, 8), $RSLIDER_DESIGN
rslider  bounds( 70, 15, 60, 70), text("Frq. Shift"), channel("FrqFrqShift"), range(-1, 1, 0), $RSLIDER_DESIGN
rslider  bounds(130, 15, 60, 70), text("Dly. Shift"), channel("FrqDlyShift"), range(0, 1, 0), $RSLIDER_DESIGN
}

image    bounds(460,345,380, 90), colour(0,0,0,0), outlineThickness(1), corners(5), channel("FrqDraw"), visible(0)
{
button   bounds(155, 35, 70, 20), channel("FrqDrawReset"), text("RESET","RESET"), latched(0)
}

image    bounds(460,440,380, 90), colour(0,0,0,0), outlineThickness(1), corners(5), channel("FrqRand")
{
rslider  bounds( 10, 10, 60, 70), text("Random"), channel("FrqRndFactor"), range(0, 1, 0, 0.5), $RSLIDER_DESIGN
}

label    bounds(  6,533, 110, 12), text("Iain McCurdy |2016|")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -d -+rtmidi=NULL -M0 -m0d 
</CsOptions>

<CsInstruments>

; sr set by host
ksmps                =                 16
nchnls               =                 2
0dbfs                =                 1

giDispTabSize        =                 512

giAmpDispTable       ftgen             101, 0, giDispTabSize, -7, 0, giDispTabSize, 0
giFrqDispTable       ftgen             102, 0, giDispTabSize, -7, 0, giDispTabSize, 0

giSilence            ftgen             0, 0, 1048576, 2, 0

giMaskDisplay        ftgen             301, 0, 4096, -7, 1, 4096, 1

; create display table UDO
opcode display_table, 0, ii
iSource,iDisplay xin
iCount               =                 0                                          ; initialise loop counter
while iCount<ftlen(iDisplay) do                                                   ; loop for a number of iterations equal to the number of table locations in the display table
iNdx                 =                 iCount * (ftlen(iSource)/ftlen(iDisplay))  ; calculate raw index to read from the source function table
iVal                 table3            iNdx, iSource                              ; read value from source function table
                     tablew            iVal, iCount, iDisplay                     ; write value into destination (display) function table 
iCount               +=                1                                          ; increment counter
od                                                                                ; loop back
                     cabbageSet        "DisplayTable", "tableNumber", 11          ; when loops have concluded, update display table widget 
endop



instr    1
 ; read in widgets
 kFFTindex           cabbageGetValue   "FFTindex"
 kFFTindex           init              1
 kAmpTableType       cabbageGetValue   "AmpTableType"
 kAmpTableType       init              1
 kFrqTableType       cabbageGetValue   "FrqTableType"
 kFrqTableType       init              1
 
 if changed:k(kAmpTableType,kFrqTableType)==1 then
  if kAmpTableType==1 then
                     cabbageSet        1, "Amp2Seg", "visible", 1
                     cabbageSet        1, "AmpComb", "visible", 0
                     cabbageSet        1, "AmpDraw", "visible", 0
                     cabbageSet        1, "AmpRand", "visible", 1
  elseif  kAmpTableType==2 then
                     cabbageSet        1, "Amp2Seg", "visible", 0
                     cabbageSet        1, "AmpComb", "visible", 1  
                     cabbageSet        1, "AmpDraw", "visible", 0
                     cabbageSet        1, "AmpRand", "visible", 1
  elseif  kAmpTableType==3 then
                     cabbageSet        1, "Amp2Seg", "visible", 0
                     cabbageSet        1, "AmpComb", "visible", 0  
                     cabbageSet        1, "AmpDraw", "visible", 1  
                     cabbageSet        1, "AmpRand", "visible", 0
  endif
  if kFrqTableType==1 then
                     cabbageSet        1, "Frq2Seg", "visible", 1
                     cabbageSet        1, "FrqComb", "visible", 0
                     cabbageSet        1, "FrqDraw", "visible", 0
                     cabbageSet        1, "FrqRand", "visible", 1
  elseif  kFrqTableType==2 then
                     cabbageSet        1, "Frq2Seg", "visible", 0
                     cabbageSet        1, "FrqComb", "visible", 1  
                     cabbageSet        1, "FrqDraw", "visible", 0
                     cabbageSet        1, "FrqRand", "visible", 1
  elseif  kFrqTableType==3 then
                     cabbageSet        1, "Frq2Seg", "visible", 0
                     cabbageSet        1, "FrqComb", "visible", 0  
                     cabbageSet        1, "FrqDraw", "visible", 1
                     cabbageSet        1, "FrqRand", "visible", 0
  endif

 endif
 
 ; link toggling
 klink               cabbageGetValue   "link"
                     cabbageSet        changed:k(klink), "Frq2Seg", "active", 1-klink
                     cabbageSet        changed:k(klink), "FrqTableType", "active", 1-klink
                     cabbageSet        changed:k(klink), "FrqComb", "active", 1-klink
                     cabbageSet        changed:k(klink), "FrqDraw", "active", 1-klink
                     cabbageSet        changed:k(klink), "FrqRand", "active", 1-klink
 
 kMaxDelay           cabbageGetValue   "MaxDelay"
 kMaxDelay           init              1
 kDryWetMix          cabbageGetValue   "DryWetMix"
 kInterval           cabbageGetValue   "Interval"
 kFeedback           cabbageGetValue   "Feedback"
 kLevel              cabbageGetValue   "Level"
 kInGain             cabbageGetValue   "InGain"
 kMonoStereo         cabbageGetValue   "MonoStereo"
 kMonoStereo         init              1
 kSmear              cabbageGetValue   "Smear"
 
 kAmpDelay1          cabbageGetValue   "AmpDelay1"
 kAmpCurve1          cabbageGetValue   "AmpCurve1"
 kAmpMidPoint        cabbageGetValue   "AmpMidPoint"
 kAmpDelay2          cabbageGetValue   "AmpDelay2"
 kAmpCurve2          cabbageGetValue   "AmpCurve2"
 kAmpDelay3          cabbageGetValue   "AmpDelay3"

 kFrqDelay1          cabbageGetValue   "FrqDelay1"
 kFrqCurve1          cabbageGetValue   "FrqCurve1"
 kFrqMidPoint        cabbageGetValue   "FrqMidPoint"
 kFrqDelay2          cabbageGetValue   "FrqDelay2"
 kFrqCurve2          cabbageGetValue   "FrqCurve2"
 kFrqDelay3          cabbageGetValue   "FrqDelay3"
 
 kAmpRndFactor       cabbageGetValue   "AmpRndFactor"
 kFrqRndFactor       cabbageGetValue   "FrqRndFactor"

 kAmpNPeaks          cabbageGetValue   "AmpNPeaks"
 kAmpFrqShift        cabbageGetValue   "AmpFrqShift"
 kAmpDlyShift        cabbageGetValue   "AmpDlyShift"

 kAmpDrawReset       cabbageGetValue   "AmpDrawReset"

 kFrqNPeaks          cabbageGetValue   "FrqNPeaks"
 kFrqFrqShift        cabbageGetValue   "FrqFrqShift"
 kFrqDlyShift        cabbageGetValue   "FrqDlyShift" 

 kFrqDrawReset       cabbageGetValue   "FrqDrawReset"
 
 iFFTsizes[]         fillarray         64, 128, 256, 512, 1024, 2048    ; array of FFT size values

 ; audio input
 aL, aR              ins
 if kMonoStereo==1 then
  aR = aL
 endif
 aL                  *=                kInGain
 aR                  *=                kInGain
 
 ; mix in test click
 ktest               cabbageGetValue   "test"
 ktest               trigger           ktest, 0.5, 0
 aL                  +=                a(ktest)
 aR                  +=                a(ktest)

 
 ; reinitialise amplitude table
 kTabTrig            changed           kFFTindex,kAmpTableType,kFrqTableType,klink,kMaxDelay,kMonoStereo,kAmpDelay1,kAmpCurve1,kAmpMidPoint,kAmpDelay2,kAmpCurve2,kAmpDelay3,kFrqDelay1,kFrqCurve1,kFrqMidPoint,kFrqDelay2,kFrqCurve2,kFrqDelay3,kAmpRndFactor,kFrqRndFactor,kAmpNPeaks,kAmpFrqShift,kAmpDlyShift,kFrqNPeaks,kFrqFrqShift,kFrqDlyShift ; if any of the variables in the brackets change...
 kTabTrig            init              1
 if kTabTrig==1 then
                     reinit            UpdateTables
 endif
 UpdateTables:

 iFFT                =                 iFFTsizes[i(kFFTindex)-1]           ; retrieve FFT size value from array
 iDispTabLen         =                 ftlen(giAmpDispTable)
 iMaxDelay           limit             i(kMaxDelay), iFFT/sr, 8            ; max.delay time must be i-rate
 
 ; amps
 if i(kAmpTableType)==1 then ; envelope
  iftampsL           ftgen             1, 0, iFFT, -16, iMaxDelay*i(kAmpDelay1), 1+(iFFT*i(kAmpMidPoint)), i(kAmpCurve1), iMaxDelay*i(kAmpDelay2), 1+(iFFT*(1-i(kAmpMidPoint))), i(kAmpCurve2), iMaxDelay*i(kAmpDelay3)
  iftampsR           ftgen             2, 0, iFFT, -16, iMaxDelay*i(kAmpDelay1), 1+(iFFT*i(kAmpMidPoint)), i(kAmpCurve1), iMaxDelay*i(kAmpDelay2), 1+(iFFT*(1-i(kAmpMidPoint))), i(kAmpCurve2), iMaxDelay*i(kAmpDelay3)
  i_                 ftgen             giAmpDispTable, 0, iDispTabLen, -16, i(kAmpDelay1), 1+(iDispTabLen*i(kAmpMidPoint)), i(kAmpCurve1), i(kAmpDelay2), 1+(iDispTabLen*(1-i(kAmpMidPoint))), i(kAmpCurve2), i(kAmpDelay3)
 elseif i(kAmpTableType)==2 then ; comb
  iftampsL           ftgen             1, 0, iFFT, 19, i(kAmpNPeaks), 0.5*iMaxDelay*(1-i(kAmpDlyShift)), 360*-i(kAmpFrqShift), 0.5*iMaxDelay
  iftampsR           ftgen             2, 0, iFFT, 19, i(kAmpNPeaks), 0.5*iMaxDelay*(1-i(kAmpDlyShift)), 360*-i(kAmpFrqShift), 0.5*iMaxDelay
  i_                 ftgen             giAmpDispTable, 0, iDispTabLen, 19, i(kAmpNPeaks), 0.5*(1-i(kAmpDlyShift)), 360*-i(kAmpFrqShift), 0.5
 endif
 
 ; amps random factor
 iCnt                =                 0
 while iCnt<iFFT do
  iVal               table             iCnt, iftampsL
  iRnd               bexprnd           i(kAmpRndFactor)*0.7
  iVal               mirror            iVal + iRnd, 0, 1
                     tablew            iVal, iCnt, iftampsL
  iVal               table             iCnt, iftampsR
  iRnd               bexprnd           i(kAmpRndFactor)*0.7
  iVal               mirror            iVal + iRnd, 0, 1
                     tablew            iVal, iCnt, iftampsR
  iCnt += 1
 od
 iCnt                =                 0
 while iCnt<iDispTabLen do
  iVal               table             iCnt, giAmpDispTable
  ;iRnd               bexprnd           i(kAmpRndFactor)*0.7
  ;iRnd               trirand           i(kAmpRndFactor)
  iRnd               gauss             i(kAmpRndFactor) * 2
  iVal               mirror            iVal + iRnd, 0, 1
                     tablew            iVal, iCnt, giAmpDispTable
  iCnt += 1
 od
 
 ; frqs
 if i(kFrqTableType)==1 then ; envelope
  iftfrqsL           ftgen             3, 0, iFFT, -16, iMaxDelay*i(kFrqDelay1), 1+(iFFT*i(kFrqMidPoint)), i(kFrqCurve1), iMaxDelay*i(kFrqDelay2), 1+(iFFT*(1-i(kFrqMidPoint))), i(kFrqCurve2), iMaxDelay*i(kFrqDelay3)
  iftfrqsR           ftgen             4, 0, iFFT, -16, iMaxDelay*i(kFrqDelay1), 1+(iFFT*i(kFrqMidPoint)), i(kFrqCurve1), iMaxDelay*i(kFrqDelay2), 1+(iFFT*(1-i(kFrqMidPoint))), i(kFrqCurve2), iMaxDelay*i(kFrqDelay3)
  i_                 ftgen             giFrqDispTable, 0, iDispTabLen, -16, i(kFrqDelay1), 1+(iDispTabLen*i(kFrqMidPoint)), i(kFrqCurve1), i(kFrqDelay2), 1+(iDispTabLen*(1-i(kFrqMidPoint))), i(kFrqCurve2), i(kFrqDelay3)
 elseif i(kFrqTableType)==2 then ; comb
  iftfrqsL           ftgen             3, 0, iFFT, 19, i(kFrqNPeaks), 0.5*iMaxDelay*(1-i(kFrqDlyShift)), 360*-i(kFrqFrqShift), 0.5*iMaxDelay
  iftfrqsR           ftgen             4, 0, iFFT, 19, i(kFrqNPeaks), 0.5*iMaxDelay*(1-i(kFrqDlyShift)), 360*-i(kFrqFrqShift), 0.5*iMaxDelay
  i_                 ftgen             giFrqDispTable, 0, iDispTabLen, 19, i(kFrqNPeaks), 0.5*(1-i(kFrqDlyShift)), 360*-i(kFrqFrqShift), 0.5
 endif

 ; frqs random factor
 iCnt                =                 0
 while iCnt<iDispTabLen do
  iVal               table             iCnt, iftfrqsL
  iRnd               bexprnd           i(kFrqRndFactor)*0.7
  iVal               mirror            iVal + iRnd, 0, 1
                     tablew            iVal, iCnt, iftfrqsL
  iVal               table             iCnt, iftfrqsR
  iRnd               bexprnd           i(kFrqRndFactor)*0.7
  iVal               mirror            iVal + iRnd, 0, 1
                     tablew            iVal, iCnt, iftfrqsR
  iCnt               +=                1
 od
 iCnt                =                 0
 while iCnt<iDispTabLen do
  iVal               table             iCnt, giFrqDispTable
  ;iRnd               bexprnd           i(kFrqRndFactor)*0.7
  ;iRnd               trirand           i(kFrqRndFactor)
  iRnd               gauss             i(kFrqRndFactor) * 2
  iVal               mirror            iVal + iRnd, 0, 1
                     tablew            iVal, iCnt, giFrqDispTable
  iCnt += 1
 od
 
 if i(klink)==1 then ; if table-linking is on...	
                     tableicopy        iftfrqsL,iftampsL
                     tableicopy        iftfrqsR,iftampsR
                     tableicopy        giFrqDispTable,giAmpDispTable
 endif

 ; update display tables at i-time 
                     cabbageSet        "AmpTable", "tableNumber", giAmpDispTable
                     cabbageSet        "FrqTable", "tableNumber", giFrqDispTable
 rireturn
 
 
 ; DRAW TABLES
 ; Table bounds
 iAmpTableBounds[]   cabbageGet        "AmpTable", "bounds"
 iAmpX               =                 iAmpTableBounds[0]
 iAmpY               =                 iAmpTableBounds[1]
 iAmpWid             =                 iAmpTableBounds[2]
 iAmpHei             =                 iAmpTableBounds[3]

 iFrqTableBounds[]   cabbageGet        "FrqTable", "bounds"
 iFrqX               =                 iFrqTableBounds[0]
 iFrqY               =                 iFrqTableBounds[1]
 iFrqWid             =                 iFrqTableBounds[2]
 iFrqHei             =                 iFrqTableBounds[3]

 kMOUSE_X            cabbageGetValue   "MOUSE_X"
 kMOUSE_Y            cabbageGetValue   "MOUSE_Y"
 kMOUSE_DOWN_LEFT    cabbageGetValue   "MOUSE_DOWN_LEFT"
 kMOUSE_Xport        portk             kMOUSE_X, 0.1*kMOUSE_DOWN_LEFT
 kMOUSE_Yport        portk             kMOUSE_Y, 0.1*kMOUSE_DOWN_LEFT
 
 ; amp table draw
 if kAmpTableType==3 then
  if kMOUSE_X>=iAmpX && kMOUSE_X<=(iAmpX+iAmpWid) && kMOUSE_Y>=iAmpY && kMOUSE_Y<=(iAmpY+iAmpHei) && kMOUSE_DOWN_LEFT==1 then
   if changed:k(kMOUSE_Xport,kMOUSE_Yport)==1 then
                     tablew            (1 - (kMOUSE_Yport-iAmpY)/iAmpHei)*iMaxDelay, (kMOUSE_Xport-iAmpX)/iAmpWid, iftampsL, 1
                     tablew            (1 - (kMOUSE_Yport-iAmpY)/iAmpHei)*iMaxDelay, (kMOUSE_Xport-iAmpX)/iAmpWid, iftampsR, 1
                     tablew            1 - (kMOUSE_Yport-iAmpY)/iAmpHei, (kMOUSE_Xport-iAmpX)/iAmpWid, giAmpDispTable, 1
                     cabbageSet        1, "AmpTable", "tableNumber", giAmpDispTable
    if klink==1 then
                     tablew            (1 - (kMOUSE_Yport-iAmpY)/iAmpHei)*iMaxDelay, (kMOUSE_Xport-iAmpX)/iAmpWid, iftfrqsL, 1
                     tablew            (1 - (kMOUSE_Yport-iAmpY)/iAmpHei)*iMaxDelay, (kMOUSE_Xport-iAmpX)/iAmpWid, iftfrqsR, 1
                     tablew            1 - (kMOUSE_Yport-iAmpY)/iAmpHei, (kMOUSE_Xport-iAmpX)/iAmpWid, giFrqDispTable, 1
                     cabbageSet        1, "FrqTable", "tableNumber", giFrqDispTable    
    endif
   endif
  endif
  if trigger:k(cabbageGetValue:k("AmpDrawReset"),0.5,0)==1 then              ; reset to flat-silent
                     tablecopy         iftampsL,giSilence
                     tablecopy         iftampsR,giSilence
                     tablecopy         giAmpDispTable,giSilence
                     cabbageSet        1, "AmpTable", "tableNumber", giAmpDispTable
   if klink==1 then
                     tablecopy         iftfrqsL,giSilence
                     tablecopy         iftfrqsR,giSilence
                     tablecopy         giFrqDispTable,giSilence
                     cabbageSet        1, "FrqTable", "tableNumber", giFrqDispTable
   endif
  endif
 endif

 ; frq table draw
 if kFrqTableType==3 then
  if kMOUSE_X>=iFrqX && kMOUSE_X<=(iFrqX+iFrqWid) && kMOUSE_Y>=iFrqY && kMOUSE_Y<=(iFrqY+iFrqHei) && kMOUSE_DOWN_LEFT==1 then
   if changed:k(kMOUSE_Xport,kMOUSE_Yport)==1 then
                     tablew            (1 - (kMOUSE_Yport-iFrqY)/iFrqHei)*iMaxDelay, (kMOUSE_Xport-iFrqX)/iFrqWid, iftfrqsL, 1
                     tablew            (1 - (kMOUSE_Yport-iFrqY)/iFrqHei)*iMaxDelay, (kMOUSE_Xport-iFrqX)/iFrqWid, iftfrqsR, 1
                     tablew            1 - (kMOUSE_Yport-iFrqY)/iFrqHei, (kMOUSE_Xport-iFrqX)/iFrqWid, giFrqDispTable, 1
                     cabbageSet        1, "FrqTable", "tableNumber", giFrqDispTable
   endif
  endif
  if trigger:k(cabbageGetValue:k("FrqDrawReset"),0.5,0)==1 then              ; reset to flat-silent
                     tablecopy         iftfrqsL, giSilence
                     tablecopy         iftfrqsR, giSilence
                     tablecopy         giFrqDispTable, giSilence
                     cabbageSet        1, "FrqTable", "tableNumber", giFrqDispTable
  endif
 endif

 
 kSmear1             exprand           kSmear * kMaxDelay * 0.5                                ; smearing random functions
 kSmear2             exprand           kSmear * kMaxDelay * 0.5
 
 
 if changed:k(kFFTindex)==1 then ; conditional updating of spectral processing if FFT size is changed 
  reinit SPECTRAL_DELAY_UPDATE
 endif
 SPECTRAL_DELAY_UPDATE:
 
 ; left channel spectral delay
 fpvscaleL           pvsinit           iFFT, iFFT/4, iFFT, 1                               ; initialise fsig
 fsig_inL            pvsanal           aL, iFFT, iFFT/4, iFFT, 1                           ; analyse signal
 fsig_FBL            pvsgain           fpvscaleL, kFeedback                                  ; create feedback signal
 fsig_mixL           pvsmix            fsig_inL, fsig_FBL                                  ; mix input signal and feedback signal before input to delay
 ihandleL, ktimeL    pvsbuffer         fsig_mixL, iMaxDelay*2 + iFFT/sr                    ; write into PVS buffer
 fbufferL            pvsbufread2       ktimeL-kSmear1, ihandleL, iftampsL, iftfrqsL        ; read from buffer (with delays and smearing)
 awetL               pvsynth           fbufferL                                            ; resynthesise
 amixL               ntrpol            aL, awetL, kDryWetMix                               ; dry/wet mix
 fpvscaleL           pvscale           fbufferL, semitone(kInterval)       
 ;fmaskaL             pvsmaska          fpvscaleL, giMaskDisplay, 1
 
 ; right channel spectral delay
 fpvscaleR           pvsinit           iFFT, iFFT/4, iFFT, 1                               ; initialise fsig
 fsig_inR            pvsanal           aL, iFFT, iFFT/4,iFFT, 1                            ; analyse signal
 fsig_FBR            pvsgain           fpvscaleR, kFeedback                                  ; create feedback signal
 fsig_mixR           pvsmix            fsig_inR, fsig_FBR                                  ; mix input signal and feedback signal before input to delay
 ihandleR, ktimeR    pvsbuffer         fsig_mixR, iMaxDelay*2 + iFFT/sr                    ; write into PV buffer
 fbufferR            pvsbufread2       ktimeR-kSmear2, ihandleR, iftampsR, iftfrqsR        ; read from buffer (with delays)
 awetR               pvsynth           fbufferR                                            ; resynthesise
 fpvscaleR           pvscale           fbufferR, semitone(kInterval)       
 ;fmaskaR             pvsmaska          fpvscaleR, giMaskDisplay, 1
 
 rireturn
 
 amixR               ntrpol            aR, awetR, kDryWetMix                               ; dry/wet mix
 
                     outs              amixL * kLevel, amixR * kLevel
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>
