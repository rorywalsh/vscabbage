
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; LowpassFilter.csd
; Written by Iain McCurdy, 2012, 2025

; This example provides an exploration of Csound's lowpass filters.

; The opcodes featured are:
; butterlp 12dB/oct
; butterlp 24dB/oct
; butterlp 36dB/oct
; butterlp 48dB/oct
; diode_ladder
; moogladder
; moogladder2
; moogvcf
; moogvcf2
; rezzy
; lpf18
; lowres
; tbvcf
; mvclpf1
; mvclpf2
; mvclpf3
; mvclpf4
; bqrez
; spf
; skf
; svn
; vclpf
; zdf_1pole
; zdf_2pole
; zdf_ladder
; K35_lpf

; The controls for additional options offered by specific filters opcodes - resonance, distortion, slope - are revealed when those specific opcodes are chosen from the 'Type' menu.
; In addition, an LFO is provided which modulates the cutoff frequency of the filter. The same LFO can be used to modulate the audio amplitude (post filter).

; FILTER SETUP
; Input    -  audio input to the filter. All are stereo.
; Type     -  type of filter. Options 1-5 are all butterlp, other options correspond to the opcode used.
; Freq     -  cutoff frequency of the filter. For a couple of opcodes, the input is not in hertz, but the value conversion is handled within the code.
; Res.     -  resonance of the filter (if an option). Different opcodes require a different range of value for this parameter but this is handled within the code.
; Dist.    -  distortion (non-linear waveshaping) of the filter. 
; Assym    -  assymetry of the distortion (tbvcf only)
; Slope    -  cutoff slope of the filter (mvclpf4 only)

; LFO
; Filt.Depth - depth of filter cutoff modulation
; Amp.Depth  - depth of audio amplitude modulation
; Rate       - rate of the LFO in hertz
; Shape      - wave shape of the LFO. Options:
;                                              Sine 
;                                              Triangle 
;                                              Square 
;                                              Wobble 
;                                              S&H 
;                                              Saw
; Follow
; Filt.     - controls the amount of amplitude envelope following that is applied the to filter cutoff frequency setting
; Amp.      - controls the amount of amplitude envelope following that is applied the to amplitude that is being filtered; this essentially dynamically expands the audio

; ENVELOPE - an ADSR envelope triggered via MIDI. Peak amplitude of envelope is defined by Freq. in FILTER SETUP section 
; Filter (button)    - activates whether the filter cutoff will be affected by the MIDI-triggered envelope
; Amplitude (button) - activates whether the amplitude will be affected by the MIDI-triggered envelope
; Attack  - attack time of envelope in seconds
; Decay   - decay time of envelope in seconds
; Sustain - sustain level of envelope (as a ratio of 'Freq.')
; Release - release time of envelope in seconds

; OUPUT
; Mix        - crossfader between the non-filtered and filtered audio
; Level      - output level of the effect (raw gain)

<Cabbage>
form caption("Lowpass Filter") size(1275,130), pluginId("LPFl"), colour( 70, 90,100), guiMode("queue")

#define SLIDER_DESIGN colour(100,140,150), trackerColour(200,240,250), textColour("white"), fontColour("white"), valueTextBox(1)

; Main filter controls
image    bounds(  0,  0,345,130), outlineThickness(4), colour( 70, 90,100)
{
label    bounds(  0,  6,345, 13), text("F I L T E R   S E T U P"), fontColour("white"), align("centre")
label    bounds( 15, 32,100, 11), text("INPUT:"), fontColour("white"), align("centre")
combobox bounds( 15, 43,100, 20), channel("input"), align("centre"), value(1), text("Live","Sawtooth","Noise","Chord"), align("centre")
label    bounds( 15, 70,100, 12), text("Type"), fontColour("white"), align("centre")
combobox bounds( 15, 83,100, 20), align("centre"), value(18), text("12dB/oct","24dB/oct","36dB/oct","48dB/oct","60dB/oct","diode_ladder","moogladder","moogladder2","moogvcf","moogvcf2","rezzy","lpf18","lowres","tbvcf","mvclpf1","mvclpf2","mvclpf3","mvclpf4","bqrez","spf","skf","svn","vclpf","zdf_1pole","zdf_2pole","zdf_ladder","K35_lpf"), channel("type")

rslider  bounds(125, 25, 70, 90), channel("cf"),  text("Freq."), range(1, 20000, 1000, 0.5, 1), $SLIDER_DESIGN
rslider  bounds(190, 25, 70, 90), channel("res"), text("Res."), range(0,1.00,0.7), visible(0), $SLIDER_DESIGN
rslider  bounds(255, 25, 70, 90), channel("dist"), text("Dist."), range(0,11.00,1), visible(0), $SLIDER_DESIGN
rslider  bounds(255, 25, 70, 90), channel("assym"), text("Assym."), range(0,1.00,0.5), visible(0), $SLIDER_DESIGN
label    bounds(260, 45, 75, 13), channel("SlopeLabel"), text("Slope"), fontColour("white"), visible(0)
combobox bounds(260, 60, 75, 20), channel("Slope"), text("Slope"), items("6dB/oct","12dB/oct","18dB/oct","24dB/oct"), value(1), visible(0)
}

; LFO
image    bounds(345,  0,305,130), outlineThickness(4), colour( 70, 90,100)
{
label    bounds(  0,  6,305, 13), text("L F O"), fontColour("white"), align("centre")
rslider  bounds( 15, 25, 70, 90), channel("LFOFiltdepth"), text("Filt.Depth"), range(0,4.00,0), $SLIDER_DESIGN
rslider  bounds( 80, 25, 70, 90), channel("LFOAmpdepth"), text("Amp.Depth"), range(0,12.00,0), $SLIDER_DESIGN
rslider  bounds(145, 25, 70, 90), channel("LFOrate"), text("Rate"), range(0.01, 50.00, 4, 0.5, 0.01), $SLIDER_DESIGN
label    bounds(215, 45, 75, 13), text("LFO Shape"), fontColour("white")
combobox bounds(215, 60, 75, 20), align("centre"), channel("LFOShape"), text("Shape"), items("Off","Sine","Triangle","Square","Wobble","S&H","Saw"), value(2)
}

; LFO
image    bounds(650,  0,165,130), outlineThickness(4), colour( 70, 90,100)
{
label    bounds(  0,  6,165, 13), text("A M P.   F O L L O W"), fontColour("white"), align("centre")
rslider  bounds( 15, 25, 70, 90), channel("FiltFollow"), text("Filt."), range(0,1,0), $SLIDER_DESIGN
rslider  bounds( 80, 25, 70, 90), channel("AmpFollow"), text("Amp."), range(0,1,0), $SLIDER_DESIGN
}

; Envelope
image    bounds(815,  0,295,130), outlineThickness(4), colour( 70, 90,100)
{
label    bounds(  0,  6,295, 13), text("E N V E L O P E"), fontColour("white"), align("centre")
checkbox bounds(  5,  5, 80, 12), text("Filter"), channel("FEnvActive"), fontColour:0("white"), fontColour:1("white")
checkbox bounds(  5, 20, 80, 12), text("Amplitude"), channel("AEnvActive"), fontColour:0("white"), fontColour:1("white")
rslider  bounds( 15, 35, 70, 80), channel("EnvAtt"), text("Attack"), range(0.01,5,0.01,0.5), $SLIDER_DESIGN
rslider  bounds( 80, 35, 70, 80), channel("EnvDec"), text("Decay"), range(0.01,5,2,0.5), $SLIDER_DESIGN
rslider  bounds(145, 35, 70, 80), channel("EnvSus"), text("Sustain"), range(0,1,0,0.5), $SLIDER_DESIGN
rslider  bounds(210, 35, 70, 80), channel("EnvRel"), text("Release"), range(0.01,5,0.01,0.5), $SLIDER_DESIGN
}

; Output
image    bounds(1110,  0,165,130), outlineThickness(4), colour( 70, 90,100)
{
label    bounds(  0,  6,165, 13), text("O U T P U T"), fontColour("white"), align("centre")
rslider  bounds( 15, 25, 70, 90), channel("mix"), text("Mix"), range(0,1.00,1), $SLIDER_DESIGN
rslider  bounds( 80, 25, 70, 90), channel("level"), text("Level"), range(0, 1.00, 1), $SLIDER_DESIGN
}

keyboard bounds( 5,130,1265,80) ; hidden, normally just for testing

label   bounds(  5, 115,120, 11), text("Iain McCurdy |2012|"), align("left"), fontColour("silver")
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps        =     32    ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls       =     2     ; NUMBER OF CHANNELS (2=STEREO)
0dbfs        =     1

;Author: Iain McCurdy (2012)

massign 0,1

opcode ButlpIt, a, aaip

aIn,aCF,iNum,iCnt xin
aOut              =               0 
aOut              butlp           aIn, aCF
if iCnt<iNum then
 aOut             ButlpIt         aOut, aCF, iNum, iCnt+1
endif
                  xout            aOut
endop

gkMIDIEnv init 0

instr 1 ; MIDI-triggered envelope
    iEnvAtt       cabbageGetValue "EnvAtt"
    iEnvDec       cabbageGetValue "EnvDec"
    iEnvSus       cabbageGetValue "EnvSus"
    iEnvRel       cabbageGetValue "EnvRel"
    gkMIDIEnv     linsegr         0, iEnvAtt, 1, iEnvDec, iEnvSus, iEnvRel, 0
endin


instr    2 ; filter (always on)
    kPortTime     linseg          0, 0.01, 0.05
    kRate         cabbageGetValue "rate"
    kSkew         cabbageGetValue "skew"
    kShape        cabbageGetValue "shape"
    kRate         init            6
    kSkew         init            -0.9
    kShape        init            2
    kFiltFollow   cabbageGetValue "FiltFollow"
    kAmpFollow    cabbageGetValue "AmpFollow"
    kcf           cabbageGetValue "cf"
    kres          cabbageGetValue "res"
    kdist         cabbageGetValue "dist"
    kdist         portk           kdist, kPortTime
    kassym        cabbageGetValue "assym"
    kSlope        cabbageGetValue "Slope"
    kSlope        init            1
    kmix          cabbageGetValue "mix"
    ktype         cabbageGetValue "type"
    kResType      cabbageGetValue "ResType"
    klevel        cabbageGetValue "level"
    klevel        portk           klevel, kPortTime
    alevel        interp          klevel
    kcf           portk           kcf, kPortTime * 0.5
    
    kFEnvActive   cabbageGetValue "FEnvActive"
    kAEnvActive   cabbageGetValue "AEnvActive"

    ; show hide resonance control
    if changed:k(ktype)==1 then
     if ktype==6 || ktype==7 || ktype==8 || ktype==9 || ktype==10 || ktype==11 || ktype==12 || ktype==13 || ktype==14 || ktype==15 || ktype==16 || \
        ktype==17 || ktype==18 || ktype==19 || ktype==20 || ktype==21 || ktype==22 || ktype==23 || ktype==25 || ktype==26 || ktype==27 then
                  cabbageSet      k(1),"res","visible",1
     else
                  cabbageSet      k(1),"res","visible",0
     endif
    endif
    
    ; show hide distortion control
    if changed:k(ktype)==1 then
     if ktype==12 || ktype==22 || ktype==27 then
                  cabbageSet      k(1),"dist","visible",1
     else
                  cabbageSet      k(1),"dist","visible",0
     endif
    endif

    ; show hide assymetry (tbvcf) control
    if changed:k(ktype)==1 then
     if ktype==14 then
                  cabbageSet      k(1),"assym","visible",1
     else
                  cabbageSet      k(1),"assym","visible",0
     endif
    endif

    ; show hide slope control
    if changed:k(ktype)==1 then
     if ktype==18 then
                  cabbageSet      k(1),"Slope","visible",1
                  cabbageSet      k(1),"SlopeLabel","visible",1
     else
                  cabbageSet      k(1),"Slope","visible",0
                  cabbageSet      k(1),"SlopeLabel","visible",0
     endif
    endif

    /* INPUT */
    kinput        cabbageGetValue "input"
    if kinput==1 then
     aL,aR        ins
    elseif kinput==2 then
     aL           vco2            0.2, 100
     aR           =               aL
    elseif kinput==3 then
     aL           =               pinker:a() * 0.2
     aR           =               pinker:a() * 0.2
    else
     a1           poscil          0.5, 220
     a2           poscil          0.5, 220 * 1.5
     aL           sum             a1, a2
     aR           =               aL
    endif
    
    ;aL,aR   diskin2 "/Users/iainmccurdy/Documents/iainmccurdy.org/CsoundRealtimeExamples/SourceMaterials/808loop.wav", 1, 0, 1
    
    ; LFO
    kLFOFiltdepth   cabbageGetValue "LFOFiltdepth"
    kLFOAmpdepth    cabbageGetValue "LFOAmpdepth"
    kLFOrate        cabbageGetValue "LFOrate"
    kLFOShape       cabbageGetValue "LFOShape"
    if kLFOShape==2 then
     kLFOFilt        poscil          kLFOFiltdepth, kLFOrate  
    elseif kLFOShape==3 then
     kLFOFilt        lfo             kLFOFiltdepth, kLFOrate, 1
    elseif kLFOShape==4 then
     kLFOFilt        lfo             kLFOFiltdepth, kLFOrate, 2
    elseif kLFOShape==5 then
     kLFOFilt        jspline         kLFOFiltdepth, kLFOrate*0.5, kLFOrate*2
    elseif kLFOShape==6 then
     kLFOFilt        randh           kLFOFiltdepth, kLFOrate
    elseif kLFOShape==7 then
     kLFOFilt        lfo             kLFOFiltdepth, kLFOrate, 5
    else
     kLFOFilt        =               0
    endif
    
    ; Envelope Follow
    kRMS            rms             aL + aR
    kRMS            lagud           kRMS^2, 0.05, 0.5
    
    if kFEnvActive==1 then ; filter envelope
     kcf *= gkMIDIEnv^2
    endif ; amplitude envelope
    if kAEnvActive==1 then
     aL *= a(gkMIDIEnv)
     aR *= a(gkMIDIEnv)
    endif
    
    ; limit filter frequency
    kcf             limit           kcf * octave(kLFOFilt) * octave(kRMS*100*kFiltFollow), 20, sr/2
    acf             interp          kcf
    iAFRange = 48 ; decibel range
    aL              *=              ampdbfs((kRMS * iAFRange * kAmpFollow * 8) - (iAFRange * kAmpFollow))
    aR              *=              ampdbfs((kRMS * iAFRange * kAmpFollow * 8) - (iAFRange * kAmpFollow))
    
    ; AMP LFO
    kAmpLFO         poscil          kLFOAmpdepth, kLFOrate
    aAmpLFO         interp          ampdbfs(kAmpLFO - kLFOAmpdepth)
    aL              *=              aAmpLFO
    aR              *=              aAmpLFO
    
    
    /* FILTER */
    if ktype==6 then
     aFiltL       diode_ladder    aL*1.5,acf,kres*3 ; (loses power so the input is boosted)
     aFiltR       diode_ladder    aR*1.5,acf,kres*3
    elseif ktype==7 then
     aFiltL      moogladder      aL,acf,kres
     aFiltR      moogladder      aR,acf,kres
    elseif ktype==8 then
     aFiltL      moogladder2      aL,acf,kres
     aFiltR      moogladder2      aR,acf,kres
    elseif ktype==9 then
     aFiltL      moogvcf      aL,acf,kres
     aFiltR      moogvcf      aR,acf,kres
    elseif ktype==10 then
     aFiltL      moogvcf2      aL,acf,kres
     aFiltR      moogvcf2      aR,acf,kres
    elseif ktype==11 then
     aFiltL      rezzy      aL,acf,a(1+kres^3*99)
     aFiltR      rezzy      aR,acf,a(1+kres^3*99)
    elseif ktype==12 then
     aFiltL      lpf18      aL,acf,a(kres),a(kdist)
     aFiltR      lpf18      aR,acf,a(kres),a(kdist)
     aFiltL      *=         1 / (1 + (kdist*0.5))
     aFiltR      *=         1 / (1 + (kdist*0.5))

    elseif ktype==13 then
     aFiltL      lowres     aL, kcf/20, a(1+kres^3*100) ; both cutoff and resonance need to be rescaled
     aFiltR      lowres     aR, kcf/20, a(1+kres^3*100)
    elseif ktype==14 then
     aFiltL      tbvcf      aL, (kcf/3)+700, kres*2, 2, kassym 
     aFiltR      tbvcf      aR, (kcf/3)+700, kres*2, 2, kassym
    elseif ktype==15 then
     aFiltL      mvclpf1      aL, acf, a(kres)
     aFiltR      mvclpf1      aR, acf, a(kres)
    elseif ktype==16 then
     aFiltL      mvclpf2      aL, acf, a(kres)
     aFiltR      mvclpf2      aR, acf, a(kres)
    elseif ktype==17 then
     aFiltL      mvclpf3      aL, acf, a(kres)
     aFiltR      mvclpf3      aR, acf, a(kres)
    elseif ktype==18 then
     aArrL[]      init     4
     aArrR[]      init     4
     aArrL[0],aArrL[1],aArrL[2],aArrL[3] mvclpf4 aL, kcf, kres ; a-rate cutoff seems to cause a crash
     aArrR[0],aArrR[1],aArrR[2],aArrR[3] mvclpf4 aR, kcf, kres
     aFiltL      =            aArrL[kSlope - 1]
     aFiltR      =            aArrR[kSlope - 1]     
    elseif ktype==19 then
     aFiltL      bqrez      aL, acf, a((kres * 99) + 1)
     aFiltR      bqrez      aR, acf, a((kres * 99) + 1)
    elseif ktype==20 then
     aFiltL      spf aL, a(0), a(0), acf, (1-kres) * 2
     aFiltR      spf aR, a(0), a(0), acf, (1-kres) * 2
    elseif ktype==21 then
     aFiltL      skf        aL, acf, kres*2 + 1
     aFiltR      skf        aL, acf, kres*2 + 1
    elseif ktype==22 then
      ahp,aFiltL,abp,abr svn aL, acf, kres^3*100+0.5, kdist+0.125
      ahp,aFiltR,abp,abr svn aR, acf, kres^3*100+0.5, kdist+0.125
    elseif ktype==23 then
      aFiltL    vclpf aL, acf, kres
      aFiltR    vclpf aR, acf, kres
    elseif ktype==24 then
      aFiltL    zdf_1pole aL, acf
      aFiltR    zdf_1pole aR, acf
    elseif ktype==25 then
      aFiltL    zdf_2pole aL, acf, kres*24.5 + 0.5
      aFiltR    zdf_2pole aR, acf, kres*24.5 + 0.5
    elseif ktype==26 then
      aFiltL    zdf_ladder aL, acf, kres*24.5 + 0.5
      aFiltR    zdf_ladder aR, acf, kres*24.5 + 0.5
    elseif ktype==27 then
      aFiltL    K35_lpf    aL, acf, kres*9+1, kdist>0?1:0, 1 + kdist
      aFiltR    K35_lpf    aR, acf, kres*9+1, kdist>0?1:0, 1 + kdist
      aFiltL    *=         1 / (1 + kdist)
      aFiltR    *=         1 / (1 + kdist)
    else
     if changed:k(ktype)==1 then
                  reinit          RESTART_FILTER
    endif
    RESTART_FILTER:
    aFiltL        ButlpIt         aL, acf, i(ktype)
    aFiltR        ButlpIt         aR, acf, i(ktype)
                  rireturn
    endif    
    
    aL            ntrpol          aL,aFiltL,kmix
    aR            ntrpol          aR,aFiltR,kmix
                  outs            aL*alevel,aR*alevel


gkMIDIEnv = 0
endin
        
</CsInstruments>

<CsScore>
i 2 0 z ; filter instrument always on
</CsScore>

</CsoundSynthesizer>
