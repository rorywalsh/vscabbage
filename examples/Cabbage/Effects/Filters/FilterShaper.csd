
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; FilterShaper.csd
; Iain McCurdy, 2015, 2024

; This effect applies random modulations of: 
; 1. panning
; 2. amplitude
; 3. lowpass filtering 
; 4. highpass filtering
; to create gestural shaping.

; Each of these parameters are modulated using random spline function generators and even though just a single set of controls for rate of modulation is provided,
;  each parameter has its own function generator.

; Input can be from live stereo input, a sound file (mono or stereo), a buzz tone or white noise.

; The 'Bypass' button bypasses all four parameters of transformation listed above.

; Filter minima and maxima are expressed in octaves (Csound octave format, middle C = 8). 

<Cabbage>
form caption("Filter Shaper") size(850, 470), pluginId("FlSh"), guiMode("queue")
image               bounds(  0, 0, 850, 470), colour(10,30,10), outlineColour("white"), outlineThickness(2), shape("sharp")

#define SLIDER_STYLE textColour("white"), colour(37,59,59), trackerColour("silver"), markerColour("silver")

image      bounds( 10, 10,830,225), colour(0,0,0,0), outlineThickness(1)
{
label      bounds(  0,  5,830, 12), fontColour("white"), text("F I L E P L A Y E R"), align("centre")
filebutton bounds( 10, 25, 80, 20), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse"), colour:0(50,50,80)
checkbox   bounds(105, 25, 95, 20), channel("PlayStop"), text("Play/Stop"), colour("lime"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3)
checkbox   bounds(105, 50, 95, 20), channel("Loop"), text("Loop"), colour("lime"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3)
rslider    bounds(200, 20, 75, 75), text("Oct.Min."),channel("OctMin"), range(-6,6,0), $SLIDER_STYLE
rslider    bounds(280, 20, 75, 75), text("Oct.Min."),channel("OctMax"), range(-6,6,0), $SLIDER_STYLE
soundfiler bounds( 10,100,810,120), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds( 10,101,560, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
}

image    bounds( 10,245,165,100), colour(0,0,0,0), outlineThickness(1)
{
checkbox bounds( 25, 15, 75, 25), text("Bypass"),  channel("Bypass"), fontColour:0("white"), , fontColour:1("white")
label    bounds( 25, 50, 80, 14), text("INPUT"), fontColour("white")
combobox bounds( 25, 64, 80, 22), channel("input"), items("Live","File","Buzz","Noise"), value(1)
}

image    bounds(165,245,165,100), colour(0,0,0,0), outlineThickness(1)
{
label    bounds(  0,  5,165, 12), fontColour("white"), text("R A T E"), align("centre")
rslider  bounds( 10, 20, 75, 75), text("Min"),  channel("RateMin"), range(0.01,20,0.5,0.5,0.01), $SLIDER_STYLE
rslider  bounds( 80, 20, 75, 75), text("Max"),  channel("RateMax"), range(0.01,20,3,0.5,0.01), $SLIDER_STYLE
}

image    bounds(340,245,325,100), colour(0,0,0,0), outlineThickness(1)
{
label    bounds(  0,  5,365, 12), fontColour("white"), text("P A N N I N G"), align("centre")
rslider  bounds( 10, 20, 75, 75), text("Rate Scale"),channel("PanRateScale"), range(0.25,16,1,0.5), $SLIDER_STYLE
rslider  bounds( 80, 20, 75, 75), text("Width"),channel("PanWidth"), range(0,1,1), $SLIDER_STYLE
checkbox bounds(170, 45, 80, 15), text("Doppler"), channel("DopOnOff"), value(1)
rslider  bounds(240, 20, 75, 75), text("Dop. Amt."),channel("DopAmt"), range(0,1,1), $SLIDER_STYLE
}

image    bounds(675,245,165,100), colour(0,0,0,0), outlineThickness(1)
{
label    bounds(  0,  5,165, 12), fontColour("white"), text("A M P L I T U D E"), align("centre")
rslider  bounds( 10, 20, 75, 75), text("Min."),channel("AmpMin"), range(0,2,0.4,0.5,0.01), $SLIDER_STYLE
rslider  bounds( 80, 20, 75, 75), text("Max."),channel("AmpMax"), range(0,2,0.8,0.5,0.01), $SLIDER_STYLE
}

image    bounds( 10,355,410,100), colour(0,0,0,0), outlineThickness(1)
{
label    bounds(  0,  5,410, 12), fontColour("white"), text("L O W P A S S   F I L T E R"), align("centre")
label    bounds( 15, 27, 90, 12), fontColour("white"), text("LPF Type"), align("centre")
combobox bounds( 15, 40, 90, 20), channel("LPFkind"), text("Bypass","Butterworth","Chebyshev I","Chebyshev II"), textColour("white"), colour(37,59,59), value(2)
rslider  bounds(115, 20, 75, 75), text("Min."),channel("LPFmin"), range(4,14, 6), $SLIDER_STYLE
rslider  bounds(185, 20, 75, 75), text("Max."),channel("LPFmax"), range(4,14,14), $SLIDER_STYLE
rslider  bounds(255, 20, 75, 75), text("N.Poles"),     channel("LPFnpol"),    range(2,80,2,1,2), $SLIDER_STYLE
rslider  bounds(325, 20, 75, 75), text("Ripple"),      channel("LPFpbr"),     range(0.1,50,14), $SLIDER_STYLE, visible(0)
rslider  bounds(325, 20, 75, 75), text("Attenuation"), channel("LPFsba"),     range(-120,-1,-60), $SLIDER_STYLE, visible(0)
}

image    bounds(430,355,410,100), colour(0,0,0,0), outlineThickness(1)
{
label    bounds(  0,  5,410, 12), fontColour("white"), text("H I G H P A S S   F I L T E R"), align("centre")
label    bounds( 10, 28, 75, 12), fontColour("white"), text("HPF Type"), align("centre")
combobox bounds( 15, 40, 90, 20), channel("HPFkind"), text("Bypass","Butterworth","Chebyshev I","Chebyshev II"), textColour("white"), colour(37,59,59), value(2)
rslider  bounds(115, 20, 75, 75), text("Min."),channel("HPFmin"), range(4,14, 6), $SLIDER_STYLE
rslider  bounds(185, 20, 75, 75), text("Max."),channel("HPFmax"), range(4,14,14), $SLIDER_STYLE
rslider  bounds(255, 20, 75, 75), text("N.Poles"),     channel("HPFnpol"),    range(2,80,2,1,2), $SLIDER_STYLE
rslider  bounds(325, 20, 75, 75), text("Ripple"),      channel("HPFpbr"),     range(0.1,50,14), $SLIDER_STYLE, visible(0)
rslider  bounds(325, 20, 75, 75), text("Attenuation"), channel("HPFsba"),     range(-120,-1,-60), $SLIDER_STYLE, visible(0)
}

label   bounds( 10,456,120, 11), text("Iain McCurdy |2015|"), align("left"), fontColour("silver")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>
;sr is set by the host
ksmps  = 32
nchnls = 2
0dbfs  = 1

gaInL,gaInR        init                0 
giChans            init                0

instr 1                                                         
 kRateMin          cabbageGetValue     "RateMin"
 kRateMax          cabbageGetValue     "RateMax"

 ; controls for lowpass filter
 kLPFmin           cabbageGetValue     "LPFmin"
 kLPFmax           cabbageGetValue     "LPFmax"
 kLPFnpol          cabbageGetValue     "LPFnpol"
 kLPFnpol          init                2
 kLPFpbr           cabbageGetValue     "LPFpbr"
 kLPFsba           cabbageGetValue     "LPFsba"
 kLPFkind          cabbageGetValue     "LPFkind"  ; bypass, butterworth, chebyshev I, chebyshev II
 kLPFkind          init                1
 if changed:k(kLPFkind)==1 then
  if kLPFkind==1 then                  ; bypass
                   cabbageSet          k(1), "LPFmin", "visible", 0
                   cabbageSet          k(1), "LPFmax", "visible", 0
                   cabbageSet          k(1), "LPFnpol", "visible", 0
                   cabbageSet          k(1), "LPFpbr", "visible", 0
                   cabbageSet          k(1), "LPFsba", "visible", 0
  elseif kLPFkind==2 then              ; butterworth
                   cabbageSet          k(1), "LPFmin", "visible", 1
                   cabbageSet          k(1), "LPFmax", "visible", 1
                   cabbageSet          k(1), "LPFnpol", "visible", 1
                   cabbageSet          k(1), "LPFpbr", "visible", 0
                   cabbageSet          k(1), "LPFsba", "visible", 0
  elseif kLPFkind==3 then              ; chby I
                   cabbageSet          k(1), "LPFmin", "visible", 1
                   cabbageSet          k(1), "LPFmax", "visible", 1
                   cabbageSet          k(1), "LPFnpol", "visible", 1
                   cabbageSet          k(1), "LPFpbr", "visible", 1
                   cabbageSet          k(1), "LPFsba", "visible", 0     
  elseif kLPFkind==4 then              ; chby II                                 ; chby II
                   cabbageSet          k(1), "LPFmin", "visible", 1
                   cabbageSet          k(1), "LPFmax", "visible", 1
                   cabbageSet          k(1), "LPFnpol", "visible", 1
                   cabbageSet          k(1), "LPFpbr", "visible", 0
                   cabbageSet          k(1), "LPFsba", "visible", 1
  endif
 endif
 
 ; controls for highpass filter
 kHPFmin           cabbageGetValue     "HPFmin"
 kHPFmax           cabbageGetValue     "HPFmax"
 kHPFnpol          cabbageGetValue     "HPFnpol"
 kHPFnpol          init                2
 kHPFpbr           cabbageGetValue     "HPFpbr"
 kHPFsba           cabbageGetValue     "HPFsba"
 kHPFkind          cabbageGetValue     "HPFkind"  ; bypass, butterworth, chebyshev I, chebyshev II
 kHPFkind          init                1
 if changed:k(kHPFkind)==1 then
  if kHPFkind==1 then                  ; bypass
                   cabbageSet          k(1), "HPFmin", "visible", 0
                   cabbageSet          k(1), "HPFmax", "visible", 0
                   cabbageSet          k(1), "HPFnpol", "visible", 0
                   cabbageSet          k(1), "HPFpbr", "visible", 0
                   cabbageSet          k(1), "HPFsba", "visible", 0
  elseif kHPFkind==2 then              ; butterworth
                   cabbageSet          k(1), "HPFmin", "visible", 1
                   cabbageSet          k(1), "HPFmax", "visible", 1
                   cabbageSet          k(1), "HPFnpol", "visible", 1
                   cabbageSet          k(1), "HPFpbr", "visible", 0
                   cabbageSet          k(1), "HPFsba", "visible", 0
  elseif kHPFkind==3 then              ; chby I
                   cabbageSet          k(1), "HPFmin", "visible", 1
                   cabbageSet          k(1), "HPFmax", "visible", 1
                   cabbageSet          k(1), "HPFnpol", "visible", 1
                   cabbageSet          k(1), "HPFpbr", "visible", 1
                   cabbageSet          k(1), "HPFsba", "visible", 0     
  elseif kHPFkind==4 then              ; chby II                                 ; chby II
                   cabbageSet          k(1), "HPFmin", "visible", 1
                   cabbageSet          k(1), "HPFmax", "visible", 1
                   cabbageSet          k(1), "HPFnpol", "visible", 1
                   cabbageSet          k(1), "HPFpbr", "visible", 0
                   cabbageSet          k(1), "HPFsba", "visible", 1
  endif
 endif
 
 ; controls for panning 
 kPanRateScale     cabbageGetValue     "PanRateScale"
 kPanWidth         cabbageGetValue     "PanWidth"

 ; controls for amplitude
 kAmpMin           cabbageGetValue     "AmpMin"
 kAmpMax           cabbageGetValue     "AmpMax"

 kBypass           cabbageGetValue     "Bypass"

 gkPlayStop        cabbageGetValue     "PlayStop"
 if trigger:k(gkPlayStop,0.5,0)==1 then
                   event               "i", 101, 0, 3600
 elseif trigger:k(gkPlayStop,0.5,1)==1 then
                   turnoff2            101, 0, 0
 endif
 
 ; load file from browse
 gSfilepath        cabbageGetValue     "filename"        ; read in file path string from filebutton widget
 if changed:k(gSfilepath)==1 then                        ; call instrument to update waveform viewer  
                   event               "i", 99, 0, 0
 endif

 ; load file from dropped file
 gSDropFile        cabbageGet          "LAST_FILE_DROPPED" ; file dropped onto GUI
 if (changed(gSDropFile) == 1) then
                   event               "i", 100, 0, 0      ; load dropped file
 endif
  
 kinput  cabbageGetValue "input"
 if kinput==1 then
  gaInL,gaInR      ins
 ; '2' is 'File'
 elseif kinput==3 then
  gaInL            vco2                0.1,100
  gaInR            =                   gaInL
 elseif kinput==4 then
  gaInL            noise               0.2, 0
  gaInR            noise               0.2, 0
 endif
 
 aL                =                   gaInL
 aR                =                   gaInR
 gaInL             =                   0
 gaInR             =                   0
 
 ; bypass all processing
 if kBypass==1 then
                   outs                aL, aR
                   kgoto               BYPASS
 endif
 
 
 ; generate filter cutoff frequencies
 kLPFoct           rspline             kLPFmin,kLPFmax,kRateMin,kRateMax
 kHPFoct           rspline             kHPFmin,kHPFmax,kRateMin,kRateMax

 ; limit cutoff frequencies
 kLPFoct           limit               kLPFoct, 4, 14
 kHPFoct           limit               kHPFoct, 4, 14
 kLPF              =                   cpsoct(kLPFoct)
 kHPF              =                   cpsoct(kHPFoct)
 
 ; low-pass filtering
 if changed:k(kLPFnpol, kLPFkind)==1 then
 kInitLPF          =                   0    
                   reinit              UPDATE_LPF                
 endif
 if changed:k(kLPFpbr, kLPFsba)==1 then
 kInitLPF          =                   1   
                   reinit            UPDATE_LPF                
 endif
 UPDATE_LPF:
 if i(kLPFkind)>1 then ; i.e., not bypassed
  aL                clfilt            aL, kLPF, 0, i(kLPFnpol), i(kLPFkind)-2, i(kLPFpbr), i(kLPFsba),i(kInitLPF)
  aR                clfilt            aR, kLPF, 0, i(kLPFnpol), i(kLPFkind)-2, i(kLPFpbr), i(kLPFsba),i(kInitLPF)
 endif
 rireturn
 
 ; high-pass filtering
 if changed:k(kHPFnpol, kHPFkind)==1 then
 kInitHPF          =                   0    
                   reinit              UPDATE_HPF                
 endif
 if changed:k(kHPFpbr, kHPFsba)==1 then
 kInitHPF          =                   1   
                   reinit            UPDATE_HPF                
 endif
 UPDATE_HPF:
 if i(kHPFkind)>1 then ; i.e., not bypassed
  aL                clfilt            aL, kHPF, 1, i(kHPFnpol), i(kHPFkind)-2, i(kHPFpbr), i(kHPFsba),i(kInitHPF)
  aR                clfilt            aR, kHPF, 1, i(kHPFnpol), i(kHPFkind)-2, i(kHPFpbr), i(kHPFsba),i(kInitHPF)
 endif
 rireturn

 
 ; panning
 aPan              rspline             -kPanWidth, kPanWidth, kRateMin * kPanRateScale, kRateMax * kPanRateScale
 aPan              =                   (aPan*0.5) + 0.5 
 aOutL             =                   aL * sin((aPan + 0.5) * $M_PI_2)
 aOutR             =                   aR * cos((aPan + 0.5) * $M_PI_2)

 kDopOnOff cabbageGetValue "DopOnOff"
 kDopAmt   cabbageGetValue "DopAmt"
 
 ; use delays to expand panning width
 if kDopOnOff==1 && kDopAmt>0 then
  aOutL           vdelay               aOutL, 0.1+(aPan*3*a(kDopAmt)), 20
  aOutR           vdelay               aOutR, 0.1+((1-aPan)*3*a(kDopAmt)), 20
 endif

 ; random amplitude function
 aAmp             rspline              kAmpMin, kAmpMax, kRateMin, kRateMax

 ; output
                  outs                 aOutL * aAmp, aOutR * aAmp
 BYPASS:
endin


instr    99 ; LOAD SOUND FILE
 giSource          =                   0
                   cabbageSet          "filer1", "file", gSfilepath
 giChans           filenchnls          gSfilepath

 ; write file name to GUI
 SFileNoExtension  cabbageGetFileNoExtension gSfilepath
                   cabbageSet          "FileName","text",SFileNoExtension
 
                   cabbageSetValue     "PlayStop", 1 ; start playback
                   cabbageSetValue     "input", 2    ; change input to 'File'
 
endin


instr    100 ; LOAD DROPPED SOUND FILE
 giSource          =                   1
                   cabbageSet          "filer1", "file", gSDropFile
 giChans           filenchnls          gSfilepath

 ; write file name to GUI
 SFileNoExtension  cabbageGetFileNoExtension gSDropFile
                   cabbageSet          "FileName", "text", SFileNoExtension

; auto-play...
                   cabbageSetValue     "PlayStop", 1 ; start playback
                   cabbageSetValue     "input", 2    ; change input to 'File'
endin

instr 101 ; PLAY LOADED SOUND FILE
 iLoop             cabbageGetValue     "Loop"
 kRateMin          cabbageGetValue     "RateMin"
 kRateMax          cabbageGetValue     "RateMax"
 kOctMin           cabbageGetValue     "OctMin"
 kOctMax           cabbageGetValue     "OctMax"
 kOct              rspline             kOctMin, kOctMax, kRateMin, kRateMax
 kSpeed            =                   2 ^ kOct
 if  giChans==1 then ; mono
  gaInL            diskin2             gSfilepath, kSpeed, 0, iLoop
  gaInR            =                   gaInL
 else                ; stereo
  gaInL,gaInR      diskin2             gSfilepath, kSpeed, 0, iLoop
 endif
 
endin

</CsInstruments>

<CsScore>                                              
i 1 0 z
</CsScore>

</CsoundSynthesizer>                                                  