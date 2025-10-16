
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; clfilt.csd
; Written by Iain McCurdy, 2012, 2024

; Controls shown change according to the filter method chosen.

; Freq.        -   cutoff frequency of the filter
; Port.        -   portamento applied to changes that are made to 'Freq.'
; N.Poles      -   number of poles of the filter
; Ripple       -   pass-band ripple (Chebyshev Type I only) (dB)
; Attentuation -   stop-band attenuation (Chebyshev Type II only) (dB)
; Mix          -   dry/wet mix
; Level        -   output level

; A spectrum of the filtered audio is provided. 
; Using the white noise source the ripples of the Chebyshev filters and the steepness of the cutoff slope can be observed
; The spectrum can be turned off to remove its CPU load. 

<Cabbage>
form caption("clfilt - Multi-Mode Filter") size(770,390), pluginId("clfl"), guiMode("queue")
image                              bounds(0, 0, 770,390), colour( 50,50,65), shape("rounded"), outlineColour("white"), outlineThickness(4) 
#define SLIDER_STYLE colour( 20, 20, 80),   fontColour("white"), trackerColour(200,200,200), outlineColour(140,140,170), textColour("silver"), markerColour("silver"), valueTextBox(1)
#define SLIDER_DESIGN valueTextBox(1) colour(75,70,70), trackerColour(205,170,170), trackerInsideRadius(0.85), markerStart(0.25), markerEnd(1.25), markerColour("black"), markerThickness(0.4), markerColour(205,170,170), markerEnd(1.2), markerThickness(1)

label    bounds( 10, 10, 80, 13), text("Input")
combobox bounds( 10, 25, 80, 20), channel("Input"), items("Live","Noise","Sawtooth","File"), value(2)

nslider  bounds( 10, 50, 60, 30), channel("SawFreq"), text("Saw Freq."), range(20,5000,100,1,.1), visible(0)


label    bounds(100, 10, 110, 13), text("Type"), fontColour("silver")
combobox bounds(100, 25, 110, 20), channel("type"),  value(1), text("Lowpass","Highpass")
label    bounds( 80, 55, 130, 13), text("Method"), fontColour("silver")
combobox bounds( 80, 70, 130, 20), channel("kind"),  value(1), text("Butterworth","Chebyshev type I","Chebyshev type II")

rslider bounds(210, 10, 90, 90), text("Freq."), channel("cf"),   range(20, 20000, 2000, 0.333), $SLIDER_STYLE
rslider bounds(280, 10, 90, 90), text("Port."), channel("port"), range(0,  1, 0.1, 0.5,0.01), $SLIDER_STYLE
rslider bounds(350, 10, 90, 90), text("N.Poles"),     channel("npol"),    range(2,80,24,1,2), $SLIDER_STYLE
rslider bounds(430, 10, 90, 90), text("Ripple"),      channel("pbr"),     range(0.1,50,14), $SLIDER_STYLE, visible(0)
rslider bounds(510, 10, 90, 90), text("Attenuation"), channel("sba"),     range(-120,-1,-60), $SLIDER_STYLE, visible(0)
rslider  bounds(590, 11, 90, 90), text("Mix"),         channel("mix"),     range(0,1.00,1), $SLIDER_STYLE
rslider  bounds(670, 11, 90, 90), text("Level"),       channel("level"),   range(0,5.00,0.3,0.5), $SLIDER_STYLE


image      bounds( 10,115,750,125), colour(0,0,0,0), outlineThickness(1)
{
label      bounds(  0,  5,830, 12), fontColour("white"), text("F I L E P L A Y E R"), align("centre")
filebutton bounds( 10, 30, 80, 20), text("Open File","Open File"), fontColour("white") channel("filename"), shape("ellipse"), colour:0(100,100,130)
checkbox   bounds( 10, 60, 95, 20), channel("PlayStop"), text("Play/Stop"), colour("lime"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3)
soundfiler bounds(100, 25,640, 90), channel("beg","len"), channel("filer1"),  colour(0, 255, 255, 255), fontColour(160, 160, 160, 255)
label      bounds(101, 26,560, 14), text(""), align("left"), colour(0,0,0,0), fontColour(200,200,200), channel("FileName")
}

image    bounds( 10,250,755,130), colour(0,0,0,0)
{
checkbox bounds(  0,  0,120, 15), channel("SpecOnOff"), text("Spectrum On/Off"), colour("lime"), fontColour:0("white"), fontColour:1("white"), colour:0( 90, 90,0), colour:1(255,255,0), corners(3) value(1)
gentable bounds(  0, 20,735,100), tableNumber(104), channel("OutSpec"), outlineThickness(1), tableColour(  0,0,200), tableBackgroundColour(255,255,255), tableGridColour(0,0,0,20), ampRange(0, 1,104), outlineThickness(0), fill(1) ;, sampleRange(0, 1024) 
vslider  bounds(735, 15, 20,115), channel("DispGain"), range(0,20,1,0.5)
}

label    bounds( 10,372,130, 13), text("Iain McCurdy |2012|"), align("left")

</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n
</CsOptions>

<CsInstruments>

;SR IS SET BY HOST
ksmps   =   32      ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls  =   2       ; NUMBER OF CHANNELS (2=STEREO)
0dbfs   =   1

;Author: Iain McCurdy (2013)

gaInL,gaInR     init              0 
giChans         init              0

 giFFT              =                   2048
 giTabLen           =                   giFFT/2 + 1                                ; table size for pvsmaska spectral envelope 
 giOutSpec         ftgen                104, 0, giTabLen, -2, 0                    ; initialise table
 giSilence         ftgen                105, 0, giTabLen, -2, 0                    ; initialise table

instr   1   ; widgets input
    gkInput     cabbageGetValue   "Input"
    gkcf        cabbageGetValue   "cf"
    gkport      cabbageGetValue   "port"
    gknpol      cabbageGetValue   "npol"
    gknpol      init              2
    gkpbr       cabbageGetValue   "pbr"
    gksba       cabbageGetValue   "sba"
    gktype      cabbageGetValue   "type"
    gktype      =                 gktype - 1
    gktype      init              0
    gkkind      cabbageGetValue   "kind"
    if changed:k(gkkind)==1 then
     if gkkind==1 then ; butterworth
      cabbageSet k(1), "pbr", "visible", 0
      cabbageSet k(1), "sba", "visible", 0
     elseif gkkind==2 then ; chby I
      cabbageSet k(1), "pbr", "visible", 1
      cabbageSet k(1), "sba", "visible", 0     
     else                  ; chby II
      cabbageSet k(1), "pbr", "visible", 0
      cabbageSet k(1), "sba", "visible", 1
     endif
    endif
    gkkind      =                 gkkind - 1
    gkmix       cabbageGetValue   "mix"
    gklevel     cabbageGetValue   "level"
    gktest      cabbageGetValue   "test"
endin

instr   2   ; clfilt - multimode filter
    gkPlayStop  cabbageGetValue   "PlayStop"
    if trigger:k(gkPlayStop,0.5,0)==1 then
                event             "i", 101, 0, 3600
    elseif trigger:k(gkPlayStop,0.5,1)==1 then
                turnoff2          101, 0, 0
    endif
    
    ; load file from browse
    gSfilepath  cabbageGetValue   "filename"        ; read in file path string from filebutton widget
    if changed:k(gSfilepath)==1 then                        ; call instrument to update waveform viewer  
                event             "i", 99, 0, 0
    endif
   
    ; load file from dropped file
    gSDropFile  cabbageGet        "LAST_FILE_DROPPED" ; file dropped onto GUI
    if (changed(gSDropFile) == 1) then
                event             "i", 100, 0, 0      ; load dropped file
    endif

    kporttime   linseg            0, 0.001, 1
    kcf         portk             gkcf, kporttime * gkport
    kmix        portk             gkmix, kporttime * 0.1
    klevel      portk             gklevel, kporttime *0.01
                cabbageSet        changed:k(gkInput), "SawFreq", "visible", gkInput == 3 ? 1 : 0
    if gkInput==1 then
     aL,aR      ins
    elseif gkInput==2 then
     aL         noise             1, 0
     aR         noise             1, 0
    elseif gkInput==3 then
     kSawFreq   cabbageGetValue   "SawFreq"
     aL         vco2              0.5, kSawFreq
     aR         =                 aL
    else
     aL         =                 gaInL
     aR         =                 gaInR
    endif
    gaInL       =                 0
    gaInR       =                 0

    if changed:k(gktype, gknpol, gkkind)==1 then
    kInit       =                 0    
                reinit            UPDATE                
    endif
    if changed:k(gkpbr, gksba)==1 then
    kInit       =                 1   
                reinit            UPDATE                
    endif
    UPDATE:
    aFiltL      clfilt            aL, kcf, i(gktype), i(gknpol), i(gkkind), i(gkpbr), i(gksba),i(kInit)
    aFiltR      clfilt            aR, kcf, i(gktype), i(gknpol), i(gkkind), i(gkpbr), i(gksba),i(kInit)
    rireturn

    aL          ntrpol            aL, aFiltL, kmix
    aR          ntrpol            aR, aFiltR, kmix
    aL          *=                klevel
    aR          *=                klevel
                outs              aL, aR






 ; SPECTRUM OUT GRAPH
 kSpecOnOff        cabbageGetValue     "SpecOnOff"
 kDispGain         cabbageGetValue     "DispGain"
 if kSpecOnOff==1 then
  fOut              pvsanal             (aL+aR)*50*kDispGain, giFFT, giFFT/4, giFFT, 0  
  fBlur             pvsblur             fOut, 0.5, 0.5
  iTabLen           =                   giFFT/2 + 1                                ; table size for pvsmaska spectral envelope 
  i_                ftgen               giOutSpec, 0, iTabLen, -2, 0                    ; initialise table
  iClockRate        =                   16
  kClock            metro               iClockRate                                ; reduce rate of updates
  if  kClock==1 then                                                              ; reduce rate of updates
    kflag            pvsftw              fBlur, giOutSpec
                     cabbageSet          kClock, "OutSpec", "tableNumber", giOutSpec 
  endif
 endif
 if trigger:k(kSpecOnOff,0.5,1)==1 then
  tablecopy giOutSpec, giSilence
                    cabbageSet          k(1), "OutSpec", "tableNumber", giOutSpec 
 endif


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

                   cabbageSetValue     "PlayStop", 1 ; start playback
                   cabbageSetValue     "input", 2    ; change input to 'File'
endin

instr 101 ; PLAY LOADED SOUND FILE
 if  giChans==1 then ; mono
  gaInL            diskin2             gSfilepath, 1, 0, 1
  gaInR            =                   gaInL
 else                ; stereo
  gaInL,gaInR      diskin2             gSfilepath, 1, 0, 1
 endif
                   cabbageSetValue     "Input", 4
endin
        
</CsInstruments>

<CsScore>
i 1 0 z
i 2 0.01 z
</CsScore>

</CsoundSynthesizer>