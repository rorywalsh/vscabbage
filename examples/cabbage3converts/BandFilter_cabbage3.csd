
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; BandFilter.csd
; Written by Iain McCurdy, 2012.

<Cabbage>
[
    {
        "type": "form",
        "colour": {
            "fill": "#464646"
        },
        "caption": "Band Filter",
        "size": {
            "width": 470,
            "height": 360
        },
        "pluginId": "band"
    },
    {
        "type": "xypad",
        "colour": {
            "fill": "#282832"
        },
        "bounds": {
            "left": 5,
            "top": 5,
            "width": 350,
            "height": 350
        },
        "channel": [
            "cf",
            "bw"
        ],
        "text": "x:cutoff | y:bandwidth"
    },
    {
        "type": "checkBox",
        "font": {
            "colour": "#ffffff"
        },
        "defaultValue": 0,
        "bounds": {
            "left": 370,
            "top": 10,
            "width": 20,
            "height": 20
        },
        "channel": "balance"
    },
    {
        "type": "label",
        "font": {
            "colour": "#ffffff"
        },
        "channel": "label_1",
        "bounds": {
            "left": 395,
            "top": 15,
            "width": 55,
            "height": 15
        },
        "text": "Balance"
    },
    {
        "type": "label",
        "channel": "label_2",
        "bounds": {
            "left": 375,
            "top": 43,
            "width": 75,
            "height": 15
        },
        "text": "Filter Type"
    },
    {
        "type": "comboBox",
        "defaultValue": 1,
        "items": [
            "reson",
            "butterbp",
            "areson",
            "butterbr"
        ],
        "indexOffset": true,
        "bounds": {
            "left": 370,
            "top": 60,
            "width": 85,
            "height": 20
        },
        "channel": "type"
    },
    {
        "type": "rotarySlider",
        "colour": {
            "fill": "#1b3b3b",
            "tracker": {
                "fill": "#7f9f9f"
            }
        },
        "font": {
            "colour": "#ffffff"
        },
        "bounds": {
            "left": 368,
            "top": 93,
            "width": 90,
            "height": 90
        },
        "text": "Mix",
        "channel": "mix",
        "range": {
            "min": 0,
            "max": 1.0,
            "defaultValue": 1,
            "skew": 1,
            "increment": 0.001
        }
    },
    {
        "type": "rotarySlider",
        "colour": {
            "fill": "#1b3b3b",
            "tracker": {
                "fill": "#7f9f9f"
            }
        },
        "font": {
            "colour": "#ffffff"
        },
        "bounds": {
            "left": 368,
            "top": 190,
            "width": 90,
            "height": 90
        },
        "text": "Level",
        "channel": "level",
        "range": {
            "min": 0,
            "max": 1.0,
            "defaultValue": 1,
            "skew": 1,
            "increment": 0.001
        }
    },
    {
        "type": "numberSlider",
        "font": {
            "colour": "#ffffff"
        },
        "bounds": {
            "left": 360,
            "top": 283,
            "width": 50,
            "height": 30
        },
        "text": "CF",
        "channel": "cfDisp",
        "range": {
            "min": 1,
            "max": 20000,
            "defaultValue": 1,
            "skew": 1,
            "increment": 1
        }
    },
    {
        "type": "numberSlider",
        "font": {
            "colour": "#ffffff"
        },
        "bounds": {
            "left": 415,
            "top": 283,
            "width": 50,
            "height": 30
        },
        "text": "BW",
        "channel": "bwDisp",
        "range": {
            "min": 1,
            "max": 20000,
            "defaultValue": 1,
            "skew": 1,
            "increment": 1
        }
    }
]
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>
;sr is set by host
ksmps   =   32
nchnls  =   2
0dbfs   =   1

; Author: Iain McCurdy (2012)

instr   1
    kcf          chnget      "cf"
    kbw          chnget      "bw"
    kbalance     chnget      "balance"
    ktype        chnget      "type"
    kmix         chnget      "mix"
    klevel       chnget      "level"
    kporttime    linseg      0, 0.001, 0.05

    kcf          expcurve    kcf, 4
    kcf          scale       kcf, 18000, 20

    kbw          expcurve    kbw, 16
    kbw          scale       kbw,3,0.01

    aL,aR        ins
    ;aL,aR        diskin2     "seashore.wav",1,0,1
    ;aL           pinkish     1   ;USE FOR TESTING
    ;aR           pinkish     1
    
    kbw          limit        kbw * kcf,1,20000
    
                 chnset       kcf, "cfDisp"                  ; send actual values for cutoff and bandwidth to GUI value boxes
                 chnset       kbw, "bwDisp"

    kcf          portk        kcf, kporttime
    kbw          portk        kbw, kporttime   

    if ktype==1 then                                         ; if reson chosen...
     aFiltL      reson        aL, kcf, kbw,1
     aFiltR      reson        aR, kcf, kbw,1
    elseif ktype==2 then                                     ; or if butterworth bandpass is chosen
     aFiltL      butbp        aL, kcf, kbw
     aFiltR      butbp        aR, kcf, kbw
    elseif ktype==3 then                                     ; or if areson  is chosen...
     aFiltL      areson       aL, kcf, kbw, 1
     aFiltR      areson       aR, kcf, kbw, 1
    else                                                     ; otherwise must be butterworth band reject
     aFiltL      butbr        aL, kcf, kbw
     aFiltR      butbr        aR, kcf, kbw
    endif
    if kbalance==1 then     ;if 'balance' switch is on...
     aFiltL      balance      aFiltL, aL, 0.3   
     aFiltR      balance      aFiltR, aR, 0.3
    endif
    amixL        ntrpol       aL, aFiltL, kmix               ; create wet/dry mix
    amixR        ntrpol       aR, aFiltR, kmix
                 outs         amixL * klevel, amixR * klevel
endin

</CsInstruments>

<CsScore>
i 1 0 [3600*24*7]
</CsScore>

</CsoundSynthesizer>