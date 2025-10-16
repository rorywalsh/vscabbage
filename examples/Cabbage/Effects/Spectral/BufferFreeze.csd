
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; BufferFreeze.csd
; Written by Iain McCurdy, 2014, 2016, 2024

; Created using the mincer opcode and circular writing into a function table

; Pointer     - a long horizontal slider that controls the read pointer position (relates to the waveform above) when 'Freeze' is active.
; Mono/Stereo - choose between mono and stereo processing. Mono mode takes input from the left channel.
;                stereo is simple dual-channel processing.
; Buffer Size - Duration of the buffer stored (2 ^ (16 + Buffer_Size) samples)
;             - the value displayed is the buffer size in seconds
; Input Gain  - gain applied to the dry signal (NB. dry signal muted anyway while freezing)
; Freeze      - freeze the buffer
; Freeze Gain - level of the frozen buffer sound (when 'Freeze' is activated)
; FFT Size    - FFT size used in the freezing process. Use smaller values for rhythmic material, larger values for sustained, harmonic material
; LOCK        - phase lock on/off. When on, can prevent modulation effect when pointer is static.
; Port.Time   - gliding applied to movements of the pointer.
; Transpose   - transposition of frozen audio
; Rand. Mode  - mode of the random modulation algorithm:
;                1. Gaussian (interpolating)
;                2. Sample and Hold (uniform distribution)
;                3. Interpolating (uniform distribution)
; Rand Rate   - rate of random movement of both pointer and transposition
; Ptr. Rand.  - amount of gaussian random jitter of the pointer position when in 'Freeze' mode (rate is preset at k-rate)
; Trans.Rand. - amount of gaussian random jitter of transposition of frozen audio (rate is preset at k-rate)
; 
; 
; 
;

<Cabbage>
form caption("Buffer Freeze"), size(1010, 360), pluginId("BfFr"), colour(50,50,75), guiMode("queue")
#define RSLIDER_STYLE popupText(0), textColour("white"), trackerColour("LightBlue"), valueTextBox(1) fontColour("white")

gentable   bounds(  5,  5,1000,100), tableNumber(1), fill(1), ampRange(0,1,1), channel("displayTable"), tableGridColour(0,0,0,0), tableBackgroundColour("black"), tableColour("LightBlue")
gentable   bounds(  5,105,1000,100), tableNumber(101), fill(1), ampRange(0,1,101), channel("displayTable2"), tableGridColour(0,0,0,0), tableBackgroundColour("LightBlue"), tableColour("black"), outlineThickness(0)

hslider    bounds(  0,200, 1010, 25), channel("ptr"),    range(0, 1, 0.9, 1, 0.001), trackerColour(173, 216, 230, 255), popupText("0"), outlineColour(0, 0, 0, 0) 
label      bounds(  0,221,1010, 12), text("Pointer"), fontColour("white"), align("centre")

image      bounds(604,  5,  3,200), alpha(0.5), channel("Scrubber")

label      bounds( 15,255, 60, 13), text("INPUT"), fontColour("white")
combobox   bounds( 15,270, 60, 20), channel("MonoStereo"), items("Mono","Stereo"), value(1)

rslider    bounds( 80,250, 70, 90), channel("BufSize"), text("Buffer Size"), range(1,6,2,1,1), $RSLIDER_STYLE
nslider    bounds( 90,324, 50, 20), channel("BufSizeSecs"), range(0,999,0,1,0.1)
rslider    bounds(150,250, 70, 90), channel("InGain"), text("Input Gain"), range(0, 32.00, 1,0.5), $RSLIDER_STYLE
rslider    bounds(220,250, 70, 90), channel("DryGain"), text("Dry Gain"), range(0, 8.00, 0,0.5), $RSLIDER_STYLE

button     bounds(300,255, 70, 50), channel("freeze"), text("FREEZE","FREEZE"), fontColour:0(100,100,120), fontColour:1("white"), colour:0(0,0,50), colour:1(150,150,255), value(0)

rslider    bounds(380,250, 70, 90), channel("FreezeGain"), text("Freeze Gain"), range(0, 8.00, 1), $RSLIDER_STYLE

label      bounds(455,255, 70,13), text("FFT Size"), fontColour("white")
combobox   bounds(455,270, 70,20), text("128","256","512","1024","2048","4096","8192"), channel("FFTSize"), value(5), fontColour(255,255,255)
checkbox   bounds(455,300, 70,15), text("LOCK"), channel("lock") value(0), fontColour:0("White"), fontColour:1("White")

rslider    bounds(535,250, 70, 90), channel("PortTime"), text("Port.Time"), range(0, 0.20, 0.01,0.5,0.001), $RSLIDER_STYLE
rslider    bounds(605,250, 70, 90), channel("Transpose"), text("Transpose"), range(-72, 72.00, 0), $RSLIDER_STYLE

image      bounds(680,230,320,120), outlineThickness(1), colour(0,0,0,0)
{
label      bounds(  0,  4,320, 12), text("M O D U L A T I O N"), align("centre"), fontColour("white")
label      bounds( 10, 25, 85, 14), text("Mod. Mode"), fontColour("white")
combobox   bounds( 10, 40, 85, 20), channel("ModMode"), items("Gauss","Samp+Hold","Interp.","Sine"), value(1)
rslider    bounds( 95, 20, 70, 90), channel("ModRate"), text("Mod.Rate"), range(0, 800,100, 0.33), $RSLIDER_STYLE
rslider    bounds(165, 20, 70, 90), channel("PtrModAmp"), text("Ptr.Amp."), range(0, 1.00, 0, 0.5, 0.0001), $RSLIDER_STYLE
rslider    bounds(235, 20, 70, 90), channel("TransModAmp"), text("Trans.Amp."), range(0, 24.00, 0), $RSLIDER_STYLE
}
label      bounds(  3,348,120, 12), text("Iain McCurdy |2014|"), align("left"), fontColour("Silver")

</Cabbage>
                    
<CsoundSynthesizer>

<CsOptions>   
-dm0 -n
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32   ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls             =                   2    ; NUMBER OF CHANNELS
0dbfs              =                   1    ; MAXIMUM AMPLITUDE

iTabSize = 1000
giDispBuffer       ftgen               1,   0, iTabSize, 7, 0, iTabSize, 0    ; define live audio buffer table for display. It makes sense if this corresponds to the display size in pixels.
giDispBuffer2      ftgen               101, 0, iTabSize, 7, 1, iTabSize, 1    ; define live audio buffer table for display. It makes sense if this corresponds to the display size in pixels.

instr    1
 ; READ LIVE INPUT
 aL,aR             ins

 ; RAMP-UP FUNCTION FOR PORTAMENTO TIME
 kRamp             linseg              0,0.001,1
 ; READ IN WIDGETS
 kPortTime         cabbageGetValue     "PortTime"
 kfreeze           cabbageGetValue     "freeze"
 kInGain           cabbageGetValue     "InGain"
 kDryGain          cabbageGetValue     "DryGain"
 kFreezeGain       cabbageGetValue     "FreezeGain"
 kptr              cabbageGetValue     "ptr"
 kptr              portk               kptr, kRamp*kPortTime
 kFFTSize          cabbageGetValue     "FFTSize"
 kFFTSize          init                4 ; (an init zero causes a crash)
 kMonoStereo       cabbageGetValue     "MonoStereo"
 kBufSize          cabbageGetValue     "BufSize"
 
 ; SCALE AUDIO INPUT ACCORDING TO GUI WIDGET
 aL                *=                  kInGain
 aR                *=                  kInGain

 ; GENERATE FUNCTION FOR RANDOM POINTER OFFSET AND PITCH
 kModMode         cabbageGetValue     "ModMode"
 kModRate         cabbageGetValue     "ModRate"
 if kModMode == 1 then     ; gaussian (interpolating)
  kPtrRand         gaussi              1, cabbageGetValue:k("PtrModAmp"), kModRate
  kPchRand         gaussi              1, cabbageGetValue:k("TransModAmp"),kModRate
 elseif kModMode == 2 then ; uniform bipolar random sample and hold
  kPtrRand         randomh             -cabbageGetValue:k("PtrModAmp"), cabbageGetValue:k("PtrModAmp"), kModRate    
  kPchRand         randomh             -cabbageGetValue:k("TransModAmp"), cabbageGetValue:k("TransModAmp"), kModRate
 elseif kModMode == 3 then ; uniform bipolar random interpolating
  kPtrRand         randomi             -cabbageGetValue:k("PtrModAmp"), cabbageGetValue:k("PtrModAmp"), kModRate
  kPchRand         randomi             -cabbageGetValue:k("TransModAmp"), cabbageGetValue:k("TransModAmp"), kModRate
 elseif kModMode == 4 then ; sinusoidal LFO
  kPtrRand         oscil               cabbageGetValue:k("PtrModAmp"), kModRate
  kPchRand         oscil               cabbageGetValue:k("TransModAmp"), kModRate
 endif
 kptr              mirror              kptr + kPtrRand, 0, 1
 if metro:k(32) == 1 then
                   cabbageSet          changed:k(kptr), "Scrubber", "bounds", 5 + (kptr * 999), 5, 3,  200
 endif    
 
  ; UPDATE FFT WINDOW SIZE
  if changed(kBufSize)==1 then
                   reinit              UPDATE0
  endif
  UPDATE0:
 giAudBufferL      ftgen               2,0, 2^(16+i(kBufSize)), 10, 0     ; clear buffer table in reinit pass (L channel)
 giAudBufferR      ftgen               3,0, 2^(16+i(kBufSize)), 10, 0     ; clear buffer table in reinit pass (R channel)
 giDispBuffer      ftgen               1,0, ftlen(giDispBuffer),-2, 0      ; clear display table in reinit pass
 giDispBuffer2     ftgen               101,0, ftlen(giDispBuffer2),7, 1,ftlen(giDispBuffer2),1      ; clear display table in reinit pass
                   cabbageSet          "displayTable", "tableNumber", 1   ; send empty table to GUI in reinit 
                   cabbageSetValue     "BufSizeSecs",ftlen(giAudBufferL)/sr,changed:k(kBufSize) ; write buffer duration in seconds to nslider
 
 ; FREEZE CODE
 ; IF FREEZE BUTTON *NOT* BEEN PRESSED
 if kfreeze==0 then                                              ; if writing to table mode...
 ; write audio to table
 aptr              phasor              sr/ftlen(giAudBufferL)    ; moving phase pointer            
                   tablew              aL,aptr,giAudBufferL,1    ; write left channel to buffer table
 if kMonoStereo==2 then
                   tablew              aR, aptr, giAudBufferR, 1 ; write right channel to buffer table
 endif
 koffset           downsamp            aptr                                    ; amount of offset added to freeze read pointer (NB. audio buffer does not scroll)
 
 if metro(sr*ftlen(giDispBuffer)/ftlen(giAudBufferL))==1 then                  ; update according to size of display table and size of audio buffer
                   tablew              rms:k(aL,1000),ftlen(giDispBuffer),giDispBuffer       ; write current audio sample value (as a downsampled krate value) to table
                   tablew              1 - rms:k(aL,1000),ftlen(giDispBuffer),giDispBuffer2  ; write current audio sample value (as a downsampled krate value) to table

  ; SHUNT ENTIRE TABLE CONTENTS ONE STEP TO THE RIGHT IN ORDER TO DISPLAY A CONTINUOUSLY SCROLLING FUNCTION TABLE
  kcount           =                   0
  loop:
  kval             table               kcount+1,giDispBuffer                           ; READ VALUE FROM TABLE
                   tablew              kval,kcount,giDispBuffer                        ; WRITE TO TABLE LOCATION IMMEDIATELY TO THE LEFT
  kval             table               kcount+1,giDispBuffer2                          ; READ VALUE FROM TABLE
                   tablew              kval,kcount,giDispBuffer2                       ; WRITE TO TABLE LOCATION IMMEDIATELY TO THE LEFT
                   loop_lt             kcount,1,ftlen(giDispBuffer),loop               ; CONDITIONALLY LOOP BACK TO LABEL
                   cabbageSet          metro:k(256), "displayTable", "tableNumber", 1  ; UPDATE TABLE DISPLAY ON COMPLETION OF THE SHUNT
                   cabbageSet          metro:k(256), "displayTable2", "tableNumber", 101 ; UPDATE TABLE DISPLAY ON COMPLETION OF THE SHUNT
 endif
 ; dry signal out
 if kMonoStereo==2 then
                   outs                aL*kDryGain, aR*kDryGain
 else
                   outs                aL*kDryGain, aL*kDryGain
 endif
 
 ; OTHERWISE WE MUST BE IN FREEZE/WRITE MODE
 else                                                          

  kptr             wrap                kptr+koffset,0,1               ; NORMALISE POINTER (LIMIT BETWEEN ZERO AND 1)
  kPitch           =                   semitone( cabbageGetValue:k("Transpose") + kPchRand)
  
  ; UPDATE FFT WINDOW SIZE
  if changed(kFFTSize)==1 then
                   reinit              UPDATE
  endif
  UPDATE:
  iFFTSize         =                   2 ^ (i(kFFTSize) + 6)
  
  ; GENERATE AUDIO USING MINCER OPCODE
  klock            cabbageGetValue     "lock"
  idecim           =                   8
  aoutL            mincer              a(kptr*(ftlen(giAudBufferL)/sr)), kFreezeGain, kPitch, giAudBufferL, klock, iFFTSize, idecim
  if kMonoStereo==2 then
   aoutR           mincer              a(kptr*(ftlen(giAudBufferR)/sr)), kFreezeGain, kPitch, giAudBufferR, klock, iFFTSize, idecim
                   outs                aoutL, aoutR
  else
                   outs                aoutL, aoutL
  endif
  rireturn 
  
 endif
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>