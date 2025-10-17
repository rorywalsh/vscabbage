<Cabbage>
[
    {
        "type": "form",
        "colour": {
            "fill": "#0291d1"
        },
        "caption": "Slider Example",
        "size": {
            "width": 360,
            "height": 460
        },
        "pluginId": "def1"
    },
    {
        "type": "textEditor",
        "bounds": {
            "left": 16,
            "top": 254,
            "width": 332,
            "height": 191
        },
        "channel": "infoText"
    },
    {
        "type": "verticalSlider",
        "colour": {
            "tracker": {
                "fill": "#0291d1"
            }
        },
        "bounds": {
            "left": 20,
            "top": 20,
            "width": 40,
            "height": 180
        },
        "channel": "harmonic1",
        "range": {
            "min": 0,
            "max": 1,
            "defaultValue": 0,
            "skew": 1,
            "increment": 0.001
        }
    },
    {
        "type": "verticalSlider",
        "bounds": {
            "left": 60,
            "top": 20,
            "width": 40,
            "height": 180
        },
        "channel": "harmonic2",
        "range": {
            "min": 0,
            "max": 1,
            "defaultValue": 0,
            "skew": 1,
            "increment": 0.001
        }
    },
    {
        "type": "verticalSlider",
        "bounds": {
            "left": 100,
            "top": 20,
            "width": 40,
            "height": 180
        },
        "channel": "harmonic3",
        "range": {
            "min": 0,
            "max": 1,
            "defaultValue": 0,
            "skew": 1,
            "increment": 0.001
        }
    },
    {
        "type": "verticalSlider",
        "bounds": {
            "left": 140,
            "top": 20,
            "width": 40,
            "height": 180
        },
        "channel": "harmonic4",
        "range": {
            "min": 0,
            "max": 1,
            "defaultValue": 0,
            "skew": 1,
            "increment": 0.001
        }
    },
    {
        "type": "verticalSlider",
        "bounds": {
            "left": 180,
            "top": 20,
            "width": 40,
            "height": 180
        },
        "channel": "harmonic5",
        "range": {
            "min": 0,
            "max": 1,
            "defaultValue": 0,
            "skew": 1,
            "increment": 0.001
        }
    },
    {
        "type": "verticalSlider",
        "bounds": {
            "left": 220,
            "top": 20,
            "width": 40,
            "height": 180
        },
        "channel": "harmonic6",
        "range": {
            "min": 0,
            "max": 1,
            "defaultValue": 0,
            "skew": 1,
            "increment": 0.001
        }
    },
    {
        "type": "verticalSlider",
        "bounds": {
            "left": 260,
            "top": 20,
            "width": 40,
            "height": 180
        },
        "channel": "harmonic7",
        "range": {
            "min": 0,
            "max": 1,
            "defaultValue": 0,
            "skew": 1,
            "increment": 0.001
        }
    },
    {
        "type": "verticalSlider",
        "bounds": {
            "left": 300,
            "top": 20,
            "width": 40,
            "height": 180
        },
        "channel": "harmonic8",
        "range": {
            "min": 0,
            "max": 1,
            "defaultValue": 0,
            "skew": 1,
            "increment": 0.001
        }
    },
    {
        "type": "checkBox",
        "colour": {
            "on": {
                "fill": "#93d200"
            },
            "off": {
                "fill": "#3d800a"
            }
        },
        "bounds": {
            "left": 24,
            "top": 208,
            "width": 100,
            "height": 30
        },
        "channel": "randomise",
        "text": "Randomise"
    }
]
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d
</CsOptions>e
<CsInstruments>
; Initialize the global variables. 
ksmps = 16
nchnls = 2
0dbfs = 1

; Rory Walsh 2021 
;
; License: CC0 1.0 Universal
; You can copy, modify, and distribute this file, 
; even for commercial purposes, all without asking permission. 

giWave ftgen 1, 0, 4096, 10, 1, .2, .1, .2, .1

instr 1

    SText  = "Slider widgets in Cabbage come in a variety of styles. Almost all the widget examples use sliders in some way or another. This simple instrument uses vslider widgets. The fader thumb uses an image loaded from disk. When the 'Randomise' button is pushed, each slider has its position updated according to a simple spline curve.\n\nCabbage sliders can load images for their various parts, background, thumb, etc., or they can use film strips / sprite-sheet type PNGs that contain frames of each state."
    cabbageSet "infoText", "text", SText
    
    a1 oscili tonek(cabbageGetValue:k("harmonic1"), 10), 50, giWave
    a2 oscili tonek(cabbageGetValue:k("harmonic2"), 10), 100, giWave
    a3 oscili tonek(cabbageGetValue:k("harmonic3"), 10), 150, giWave
    a4 oscili tonek(cabbageGetValue:k("harmonic4"), 10), 200, giWave
    a5 oscili tonek(cabbageGetValue:k("harmonic5"), 10), 250, giWave
    a6 oscili tonek(cabbageGetValue:k("harmonic6"), 10), 300, giWave
    a7 oscili tonek(cabbageGetValue:k("harmonic7"), 10), 350, giWave
    a8 oscili tonek(cabbageGetValue:k("harmonic8"), 10), 400, giWave
    
    kRandom cabbageGet "randomise"
    
    if kRandom == 1 then
        cabbageSetValue "harmonic1", abs(jspline:k(.9, .1, .3))
        cabbageSetValue "harmonic2", abs(jspline:k(.9, .1, .3))
        cabbageSetValue "harmonic3", abs(jspline:k(.9, .1, .3))
        cabbageSetValue "harmonic4", abs(jspline:k(.9, .1, .3))
        cabbageSetValue "harmonic5", abs(jspline:k(.9, .1, .3))
        cabbageSetValue "harmonic6", abs(jspline:k(.9, .1, .3))
        cabbageSetValue "harmonic7", abs(jspline:k(.9, .1, .3))
        cabbageSetValue "harmonic8", abs(jspline:k(.9, .1, .3))
    endif
    
    aMix = a1+a2+a3+a4+a5+a6+a7+a8
    out aMix*.1, aMix*.1
endin       

</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
f0 z
;starts instrument 1 and runs it for a week
i1 0 z
</CsScore>
</CsoundSynthesizer>
