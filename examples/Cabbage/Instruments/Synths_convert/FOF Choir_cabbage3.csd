    
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; FOF Choir.csd

; Note velocity is interpretted as attack time (along with a slight interpretation as amplitude)
; If N.Voices (number of voices) is set to '1' chorussing effect is bypassed, instead a fundamental modulation mechanism is enabled
; Vibrato/tremolo depth also controllable using midi controller 1 (mod. wheel), midi channel 1
; Vowel is controllable using midi controller 2, midi channel 1
; N.Voices value is not strictly speaking accurate:     1 = 1 voice
;                            2 = 2 voices
;                            3 = 4 voices
;                            4 = 6 voices
;                            5 = 8 voices, this is on account of how the mechanism implements a stereo effect

; The frequencies, bandwidths and decibel levels for the 5 formants are shown in a grid of number boxes

; Frequency Scale - scales the frequencies of all formants
; Bandwidth Scale - scales the bandwidth of all formants

; the five vertical sliders scale the amplitudes of all formants

<Cabbage>
[
    {
        "type": "form",
        "caption": "FOF Choir",
        "size": {"width": 770, "height": 475},
        "pluginId": "choi"
    },
    {
        "type": "image",
        "colour": {"fill": "#0f1414"},
        "channel": "image_323",
        "bounds": {"left": 0, "top": 0, "width": 770, "height": 475}
    },
    {
        "type": "label",
        "font": {"colour": "#ffffff", "size": 36},
        "bounds": {"left": 95, "top": 100, "width": 80, "height": 40},
        "text": "Ahh",
        "channel": "vowelText",
        "visible": 0
    },
    {
        "type": "xyPad",
        "channel": {"id": "xyPad_324", "x": "vowelXY", "y": "octXY"},
        "range": {
            "x": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001},
            "y": {"min": 0, "max": 4, "defaultValue": 0, "skew": 1, "increment": 0.001}
        },
        "text": {"x": "Vowel Y:Oct.Div.", "y": "X:Vowel Y:Oct.Div."},
        "bounds": {"left": 10, "top": 10, "width": 250, "height": 250}
    },
    {
        "type": "comboBox",
        "font": {"size": 11},
        "colour": {"fill": "222222"},
        "corners": 2,
        "defaultValue": 5,
        "items": ["Bass", "Tenor", "Countertenor", "Alto", "Soprano"],
        "indexOffset": true,
        "bounds": {"left": 265, "top": 30, "width": 110, "height": 25},
        "channel": "voice"
    },
    {
        "type": "button",
        "text": {"on": "polyphonic", "off": "monophonic"},
        "font": {"size": 9},
        "colour": {"on": {"fill": "222222"}, "off": {"fill": "222222"}},
        "corners": 2,
        "defaultValue": 1,
        "bounds": {"left": 265, "top": 60, "width": 110, "height": 25},
        "channel": "monopoly"
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#008000", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 385, "top": 20, "width": 60, "height": 60},
        "text": "Leg.Time",
        "channel": "LegTim",
        "range": {"min": 0.005, "max": 0.3, "defaultValue": 0.025, "skew": 0.5, "increment": 0.005}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#008000", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 445, "top": 20, "width": 60, "height": 60},
        "text": "Vowel",
        "channel": "vowel",
        "range": {"min": 0, "max": 1.0, "defaultValue": 0, "skew": 1, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#008000", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 505, "top": 20, "width": 60, "height": 60},
        "text": "Level",
        "channel": "lev",
        "range": {"min": 0, "max": 5.0, "defaultValue": 0.6, "skew": 1, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#ff6347", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 265, "top": 100, "width": 60, "height": 60},
        "text": "Vib.Dep.",
        "channel": "vibdep",
        "range": {"min": 0, "max": 2.0, "defaultValue": 0.35, "skew": 1, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#ff6347", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 325, "top": 100, "width": 60, "height": 60},
        "text": "Trem.Dep.",
        "channel": "trmdep",
        "range": {"min": 0, "max": 1.0, "defaultValue": 0.2, "skew": 1, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#ff6347", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 385, "top": 100, "width": 60, "height": 60},
        "text": "Mod.Rate",
        "channel": "modrte",
        "range": {"min": 0.1, "max": 20, "defaultValue": 5, "skew": 0.5, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#ff6347", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 445, "top": 100, "width": 60, "height": 60},
        "text": "Mod.Delay",
        "channel": "moddel",
        "range": {"min": 0, "max": 2.0, "defaultValue": 0.3, "skew": 0.5, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#ff6347", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 505, "top": 100, "width": 60, "height": 60},
        "text": "Mod.Rise",
        "channel": "modris",
        "range": {"min": 0, "max": 4.0, "defaultValue": 2, "skew": 0.5, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#ffff00", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 265, "top": 180, "width": 60, "height": 60},
        "text": "N.Voices",
        "channel": "nvoices",
        "range": {"min": 1, "max": 50, "defaultValue": 6, "skew": 1, "increment": 1}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#ffff00", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 325, "top": 180, "width": 60, "height": 60},
        "text": "Dtn.Dep.",
        "channel": "DtnDep",
        "range": {"min": 0, "max": 4.0, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#ffff00", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 385, "top": 180, "width": 60, "height": 60},
        "text": "Dtn.Rate",
        "channel": "DtnRte",
        "range": {"min": 0.01, "max": 40, "defaultValue": 0.2, "skew": 0.25, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#4682b4", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 445, "top": 180, "width": 60, "height": 60},
        "text": "Rvb.Mix",
        "channel": "RvbMix",
        "range": {"min": 0, "max": 1.0, "defaultValue": 0.15, "skew": 1, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "colour": {"fill": "#4682b4", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
        "font": {"size": 9},
        "bounds": {"left": 505, "top": 180, "width": 60, "height": 60},
        "text": "Rvb.Size",
        "channel": "RvbSize",
        "range": {"min": 0.5, "max": 1.0, "defaultValue": 0.82, "skew": 2, "increment": 0.001}
    },
    {
        "type": "checkBox",
        "colour": {"fill": "#00ff00"},
        "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 11},
        "defaultValue": 0,
        "bounds": {"left": 570, "top": 10, "width": 190, "height": 20},
        "text": "Filter On/Off",
        "channel": "FiltOnOff"
    },
    {
        "type": "xyPad",
        "channel": {"id": "xyPad_325", "x": "cf", "y": "bw"},
        "range": {
            "x": {"min": 5, "max": 13, "defaultValue": 8, "skew": 1, "increment": 0.001},
            "y": {"min": 0.1, "max": 5, "defaultValue": 0.3, "skew": 1, "increment": 0.001}
        },
        "text": {"x": "c.off", "y": "b.width"},
        "bounds": {"left": 570, "top": 35, "width": 190, "height": 250}
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_326",
        "bounds": {"left": 0, "top": 265, "width": 770, "height": 200},
        "children": [
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 10, "top": 10, "width": 60, "height": 25},
                "text": "Freq.1",
                "channel": "f1",
                "range": {"min": 0, "max": 20000, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 10, "top": 40, "width": 60, "height": 25},
                "text": "dB.1",
                "channel": "dB1",
                "range": {"min": -120, "max": 0, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 10, "top": 70, "width": 60, "height": 25},
                "text": "BW.1",
                "channel": "BW1",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 80, "top": 10, "width": 60, "height": 25},
                "text": "Freq.2",
                "channel": "f2",
                "range": {"min": 0, "max": 20000, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 80, "top": 40, "width": 60, "height": 25},
                "text": "dB.2",
                "channel": "dB2",
                "range": {"min": -120, "max": 0, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 80, "top": 70, "width": 60, "height": 25},
                "text": "BW.2",
                "channel": "BW2",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 150, "top": 10, "width": 60, "height": 25},
                "text": "Freq.3",
                "channel": "f3",
                "range": {"min": 0, "max": 20000, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 150, "top": 40, "width": 60, "height": 25},
                "text": "dB.3",
                "channel": "dB3",
                "range": {"min": -120, "max": 0, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 150, "top": 70, "width": 60, "height": 25},
                "text": "BW.3",
                "channel": "BW3",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 220, "top": 10, "width": 60, "height": 25},
                "text": "Freq.4",
                "channel": "f4",
                "range": {"min": 0, "max": 20000, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 220, "top": 40, "width": 60, "height": 25},
                "text": "dB.4",
                "channel": "dB4",
                "range": {"min": -120, "max": 0, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 220, "top": 70, "width": 60, "height": 25},
                "text": "BW.4",
                "channel": "BW4",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 290, "top": 10, "width": 60, "height": 25},
                "text": "Freq.5",
                "channel": "f5",
                "range": {"min": 0, "max": 20000, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 290, "top": 40, "width": 60, "height": 25},
                "text": "dB.5",
                "channel": "dB5",
                "range": {"min": -120, "max": 0, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 290, "top": 70, "width": 60, "height": 25},
                "text": "BW.5",
                "channel": "BW5",
                "range": {"min": 0, "max": 1000, "defaultValue": 0, "skew": 1, "increment": 1}
            },
            {
                "type": "rotarySlider",
                "colour": {"fill": "#c8c896", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
                "font": {"size": 12},
                "bounds": {"left": 370, "top": 10, "width": 80, "height": 80},
                "text": "Frequency Scale",
                "channel": "FormScale",
                "range": {"min": 0.25, "max": 4.0, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "colour": {"fill": "#c8c896", "tracker": {"fill": "#ffffff", "background": "#222222", "width": 14}},
                "font": {"size": 12},
                "bounds": {"left": 470, "top": 10, "width": 80, "height": 80},
                "text": "Bandwidth Scale",
                "channel": "BWScale",
                "range": {"min": 0.5, "max": 8.0, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "colour": {"fill": "#c8c896", "tracker": {"fill": "#ffffff", "background": "#222222"}},
                "font": {"size": 6},
                "bounds": {"left": 600, "top": 25, "width": 20, "height": 70},
                "channel": "FAmp1",
                "range": {"min": 0, "max": 1.0, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "colour": {"fill": "#c8c896", "tracker": {"fill": "#ffffff", "background": "#222222"}},
                "font": {"size": 6},
                "bounds": {"left": 630, "top": 25, "width": 20, "height": 70},
                "channel": "FAmp2",
                "range": {"min": 0, "max": 1.0, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "colour": {"fill": "#c8c896", "tracker": {"fill": "#ffffff", "background": "#222222"}},
                "font": {"size": 6},
                "bounds": {"left": 660, "top": 25, "width": 20, "height": 70},
                "channel": "FAmp3",
                "range": {"min": 0, "max": 1.0, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "colour": {"fill": "#c8c896", "tracker": {"fill": "#ffffff", "background": "#222222"}},
                "font": {"size": 6},
                "bounds": {"left": 690, "top": 25, "width": 20, "height": 70},
                "channel": "FAmp4",
                "range": {"min": 0, "max": 1.0, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "colour": {"fill": "#c8c896", "tracker": {"fill": "#ffffff", "background": "#222222"}},
                "font": {"size": 6},
                "bounds": {"left": 720, "top": 25, "width": 20, "height": 70},
                "channel": "FAmp5",
                "range": {"min": 0, "max": 1.0, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_327",
                "bounds": {"left": 600, "top": 90, "width": 20, "height": 12},
                "text": "1"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_328",
                "bounds": {"left": 630, "top": 90, "width": 20, "height": 12},
                "text": "2"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_329",
                "bounds": {"left": 660, "top": 90, "width": 20, "height": 12},
                "text": "3"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_330",
                "bounds": {"left": 690, "top": 90, "width": 20, "height": 12},
                "text": "4"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_331",
                "bounds": {"left": 720, "top": 90, "width": 20, "height": 12},
                "text": "5"
            }
        ]
    },
    {
        "type": "label",
        "font": {"colour": "#c0c0c0", "size": 11},
        "channel": "label_333",
        "bounds": {"left": 10, "top": 457, "width": 110, "height": 12},
        "text": "Iain McCurdy |2012|"
    },
    {
        "type": "keyboard",
        "channel": "keyboard_332",
        "bounds": {"left": 10, "top": 375, "width": 750, "height": 80}
    }
]
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps     =     64
nchnls     =     2
0dbfs    =    1
massign    0,2
seed    0

;Author: Iain McCurdy (2012)

gisine        ftgen    0, 0, 4096, 10, 1                ;SINE WAVE
giexp        ftgen    0, 0, 1024, 19, 0.5, 0.5, 270, 0.5        ;EXPONENTIAL CURVE USED TO DEFINE THE ENVELOPE SHAPE OF FOF PULSES
gasendL,gasendR    init    0

;FUNCTION TABLES STORING DATA FOR VARIOUS VOICE FORMANTS
;THE FIRST VALUE OF EACH TABLE DEFINES THE NUMBER OF DATA ELEMENTS IN THE TABLE
;THIS IS NEEDED BECAUSE TABLES SIZES MUST BE POWERS OF 2 TO FACILITATE INTERPOLATED TABLE READING (tablei) 
; BASS
giBF1    ftgen    0, 0, 8, -2, 4,    600,     400,     250,     350    ; FREQ
giBF2    ftgen    0, 0, 8, -2, 4,    1040,    1620,    1750,    600    ; FREQ
giBF3    ftgen    0, 0, 8, -2, 4,    2250,    2400,    2600,    2400   ; FREQ
giBF4    ftgen    0, 0, 8, -2, 4,    2450,    2800,    3050,    2675   ; FREQ
giBF5    ftgen    0, 0, 8, -2, 4,    2750,    3100,    3340,    2950   ; FREQ
                
giBDb1   ftgen    0, 0, 8, -2, 4,    0,       0,       0,       0      ; dB
giBDb2   ftgen    0, 0, 8, -2, 4,    -7,      -12,     -30,     -20    ; dB
giBDb3   ftgen    0, 0, 8, -2, 4,    -9,      -9,      -16,     -32    ; dB
giBDb4   ftgen    0, 0, 8, -2, 4,    -9,      -12,     -22,     -28    ; dB
giBDb5   ftgen    0, 0, 8, -2, 4,    -20,     -18,     -28,     -36    ; dB
                
giBBW1   ftgen    0, 0, 8, -2, 4,    60,      40,      60,      40     ; BAND WIDTH
giBBW2   ftgen    0, 0, 8, -2, 4,    70,      80,      90,      80     ; BAND WIDTH
giBBW3   ftgen    0, 0, 8, -2, 4,    110,     100,     100,     100    ; BAND WIDTH
giBBW4   ftgen    0, 0, 8, -2, 4,    120,     120,     120,     120    ; BAND WIDTH
giBBW5   ftgen    0, 0, 8, -2, 4,    130,     120,     120,     120    ; BAND WIDTH

; TENOR
giTF1    ftgen    0, 0, 8, -2, 5,    650,     400,     290,     400,    350    ; FREQ
giTF2    ftgen    0, 0, 8, -2, 5,    1080,    1700,    1870,    800,    600    ; FREQ
giTF3    ftgen    0, 0, 8, -2, 5,    2650,    2600,    2800,    2600,   2700   ; FREQ
giTF4    ftgen    0, 0, 8, -2, 5,    2900,    3200,    3250,    2800,   2900   ; FREQ
giTF5    ftgen    0, 0, 8, -2, 5,    3250,    3580,    3540,    3000,   3300   ; FREQ
                
giTDb1   ftgen    0, 0, 8, -2, 5,    0,       0,       0,       0,      0      ; dB
giTDb2   ftgen    0, 0, 8, -2, 5,    -6,      -14,     -15,     -10,    -20    ; dB
giTDb3   ftgen    0, 0, 8, -2, 5,    -7,      -12,     -18,     -12,    -17    ; dB
giTDb4   ftgen    0, 0, 8, -2, 5,    -8,      -14,     -20,     -12,    -14    ; dB
giTDb5   ftgen    0, 0, 8, -2, 5,    -22,     -20,     -30,     -26,    -26    ; dB
                
giTBW1   ftgen    0, 0, 8, -2, 5,    80,      70,      40,      40,     40     ; BAND WIDTH
giTBW2   ftgen    0, 0, 8, -2, 5,    90,      80,      90,      80,     60     ; BAND WIDTH
giTBW3   ftgen    0, 0, 8, -2, 5,    120,     100,     100,     100,    100    ; BAND WIDTH
giTBW4   ftgen    0, 0, 8, -2, 5,    130,     120,     120,     120,    120    ; BAND WIDTH                                         
giTBW5   ftgen    0, 0, 8, -2, 5,    140,     120,     120,     120,    120    ; BAND WIDTH

; COUNTER TENOR
giCTF1   ftgen    0, 0, 8, -2, 5,    660,     440,     270,     430,    370    ; FREQ
giCTF2   ftgen    0, 0, 8, -2, 5,    1120,    1800,    1850,    820,    630    ; FREQ
giCTF3   ftgen    0, 0, 8, -2, 5,    2750,    2700,    2900,    2700,   2750   ; FREQ
giCTF4   ftgen    0, 0, 8, -2, 5,    3000,    3000,    3350,    3000,   3000   ; FREQ
giCTF5   ftgen    0, 0, 8, -2, 5,    3350,    3300,    3590,    3300,   3400   ; FREQ
                
giTBDb1  ftgen    0, 0, 8, -2, 5,    0,       0,       0,       0,      0      ; dB
giTBDb2  ftgen    0, 0, 8, -2, 5,    -6,      -14,     -24,     -10,    -20    ; dB
giTBDb3  ftgen    0, 0, 8, -2, 5,    -23,     -18,     -24,     -26,    -23    ; dB
giTBDb4  ftgen    0, 0, 8, -2, 5,    -24,     -20,     -36,     -22,    -30    ; dB
giTBDb5  ftgen    0, 0, 8, -2, 5,    -38,     -20,     -36,     -34,    -30    ; dB
                
giTBW1   ftgen    0, 0, 8, -2, 5,    80,      70,      40,      40,     40     ; BAND WIDTH
giTBW2   ftgen    0, 0, 8, -2, 5,    90,      80,      90,      80,     60     ; BAND WIDTH
giTBW3   ftgen    0, 0, 8, -2, 5,    120,     100,     100,     100,    100    ; BAND WIDTH
giTBW4   ftgen    0, 0, 8, -2, 5,    130,     120,     120,     120,    120    ; BAND WIDTH
giTBW5   ftgen    0, 0, 8, -2, 5,    140,     120,     120,     120,    120    ; BAND WIDTH

; ALTO
giAF1    ftgen    0, 0, 8, -2, 5,    800,     400,     350,     450,    325    ; FREQ
giAF2    ftgen    0, 0, 8, -2, 5,    1150,    1600,    1700,    800,    700    ; FREQ
giAF3    ftgen    0, 0, 8, -2, 5,    2800,    2700,    2700,    2830,   2530   ; FREQ
giAF4    ftgen    0, 0, 8, -2, 5,    3500,    3300,    3700,    3500,   2500   ; FREQ
giAF5    ftgen    0, 0, 8, -2, 5,    4950,    4950,    4950,    4950,   4950   ; FREQ
                
giADb1   ftgen    0, 0, 8, -2, 5,    0,       0,       0,       0,      0      ; dB
giADb2   ftgen    0, 0, 8, -2, 5,    -4,      -24,     -20,     -9,     -12    ; dB
giADb3   ftgen    0, 0, 8, -2, 5,    -20,     -30,     -30,     -16,    -30    ; dB
giADb4   ftgen    0, 0, 8, -2, 5,    -36,     -35,     -36,     -28,    -40    ; dB
giADb5   ftgen    0, 0, 8, -2, 5,    -60,     -60,     -60,     -55,    -64    ; dB
                
giABW1   ftgen    0, 0, 8, -2, 5,    50,      60,      50,      70,     50     ; BAND WIDTH
giABW2   ftgen    0, 0, 8, -2, 5,    60,      80,      100,     80,     60     ; BAND WIDTH
giABW3   ftgen    0, 0, 8, -2, 5,    170,     120,     120,     100,    170    ; BAND WIDTH
giABW4   ftgen    0, 0, 8, -2, 5,    180,     150,     150,     130,    180    ; BAND WIDTH
giABW5   ftgen    0, 0, 8, -2, 5,    200,     200,     200,     135,    200    ; BAND WIDTH

; SOPRANO
giSF1    ftgen    0, 0, 8, -2, 5,    800,     350,     270,     450,    325    ; FREQ
giSF2    ftgen    0, 0, 8, -2, 5,    1150,    2000,    2140,    800,    700    ; FREQ
giSF3    ftgen    0, 0, 8, -2, 5,    2900,    2800,    2950,    2830,   2700   ; FREQ
giSF4    ftgen    0, 0, 8, -2, 5,    3900,    3600,    3900,    3800,   3800   ; FREQ
giSF5    ftgen    0, 0, 8, -2, 5,    4950,    4950,    4950,    4950,   4950   ; FREQ
                
giSDb1   ftgen    0, 0, 8, -2, 5,    0,       0,       0,       0,      0      ; dB
giSDb2   ftgen    0, 0, 8, -2, 5,    -6,      -20,     -12,     -11,    -16    ; dB
giSDb3   ftgen    0, 0, 8, -2, 5,    -32,     -15,     -26,     -22,    -35    ; dB
giSDb4   ftgen    0, 0, 8, -2, 5,    -20,     -40,     -26,     -22,    -40    ; dB
giSDb5   ftgen    0, 0, 8, -2, 5,    -50,     -56,     -44,     -50,    -60    ; dB
                
giSBW1   ftgen    0, 0, 8, -2, 5,    80,      60,      60,      70,     50     ; BAND WIDTH
giSBW2   ftgen    0, 0, 8, -2, 5,    90,      90,      90,      80,     60     ; BAND WIDTH
giSBW3   ftgen    0, 0, 8, -2, 5,    120,     100,     100,     100,    170    ; BAND WIDTH
giSBW4   ftgen    0, 0, 8, -2, 5,    130,     150,     120,     130,    180    ; BAND WIDTH
giSBW5   ftgen    0, 0, 8, -2, 5,    140,     200,     120,     135,    200    ; BAND WIDTH

gkactive    init    0    ; Will contain number of active instances of instr 3 when legato mode is chosen. NB. notes in release stage will not be regarded as active. 

opcode         fofx5, a, kkkkkkkkkki
    kfund,kvowel,koct,kFormScale,kBWScale,kFAmp1,kFAmp2,kFAmp3,kFAmp4,kFAmp5,ivoice    xin
        
    ivoice        limit        ivoice,0,4                    ;protect against out of range values for ivoice
    ;create a macro for each formant to reduce code repetition
#define    FORMANT(N)
    #
    invals        table         0, giBF1+(ivoice*15)+$N-1                    ;number of data elements in each table
    invals        =             invals-1                                ;
    k$N.form      tablei        1+(kvowel*invals), giBF1+(ivoice*15)+$N-1    ;read formant frequency from table
    k$N.form      *=            kFormScale
    k$N.db        tablei        1+(kvowel*invals), giBDb1+(ivoice*15)+$N-1    ;read decibel value from table
    k$N.amp       =             ampdb(k$N.db)                    ;convert to an amplitude value                                                
    k$N.band      tablei        1+(kvowel*invals), giBBW1+(ivoice*15)+$N-1    ;read bandwidth from table
    k$N.band      *=            kBWScale
    if changed:k(k$N.form,k$N.db,k$N.band)==1 && active:i(p1)==1 then
     Schan        sprintfk      "f%d",k($N)
;                  chnset        k$N.form, Schan
                  cabbageSetValue Schan, k$N.form, changed:k(k$N.form) 
     Schan        sprintfk      "dB%d",k($N)
;                  chnset        k$N.db, Schan
                  cabbageSetValue Schan, k$N.db, changed:k(k$N.db) 
     Schan        sprintfk      "BW%d",k($N)
;                  chnset        k$N.band, Schan
                  cabbageSetValue Schan, k$N.band, changed:k(k$N.band) 
    endif
    ;kRandForm$N    randomi     -0.025,0.025,8,1    
    ;k$N.form    limit          k$N.form*octave(kRandForm$N),0,1000
    #
    ;EXECUTE MACRO MULTIPLE TIMES
    $FORMANT(1)                                                                                      
    $FORMANT(2)                                                                                      
    $FORMANT(3)                                                                                        
    $FORMANT(4)
    $FORMANT(5)
    ;======================================================================================================================================================================
    iris          =        0.003    ;grain pulse rise time
    idur          =        0.02    ;grain pulse duration
    idec          =        0.007    ;grain pulse decay
    iolaps        =        14850    ;maximum number of overlaps (overestimate)
    ifna          =        gisine    ;function table for audio contained within fof grains
    ifnb          =        giexp    ;function table that defines the attack and decay shapes of each fof grain
    itotdur       =        3600    ;total maximum duration of a note (overestimate)
    ;FOF===================================================================================================================================================================
    iRandRange    =        0.1
#define    RandFact
    #
    kRndFact    rspline        -iRandRange,iRandRange,1,10
    kRndFact    =        semitone(kRndFact)
    #
    $RandFact
    a1         fof         k1amp, kfund*kRndFact, k1form, koct, k1band, iris, idur, idec, iolaps, ifna, ifnb, itotdur
    a2         fof         k2amp, kfund*kRndFact, k2form, koct, k2band, iris, idur, idec, iolaps, ifna, ifnb, itotdur
    a3         fof         k3amp, kfund*kRndFact, k3form, koct, k3band, iris, idur, idec, iolaps, ifna, ifnb, itotdur
    a4         fof         k4amp, kfund*kRndFact, k4form, koct, k4band, iris, idur, idec, iolaps, ifna, ifnb, itotdur
    a5         fof         k5amp, kfund*kRndFact, k5form, koct, k5band, iris, idur, idec, iolaps, ifna, ifnb, itotdur
    ;======================================================================================================================================================================

    ;OUT===================================================================================================================================================================
    asig        =        (a1*kFAmp1 + a2*kFAmp2 + a3*kFAmp3 + a4*kFAmp4 + a5*kFAmp5)/5    ;mix the five fof streams and reduce amplitude five-fold

            xout        asig            ;send audio back to caller instrument
endop

opcode    ChoVoice,a,kkiii
    kDtnDep,kDtnRte,ifn,icount,invoices    xin        ; read in input args.
    ktime     randomi    0.01,0.1*kDtnDep,kDtnRte,1   ; create delay time value (linearly interpolating random function will implement pitch/time modulations)
    kptime    linseg     0,0.001,1                    ; portamento time (ramps up quickly from zero to a held value)
    ktime     portk      ktime,kptime                 ; apply portamento smoothing to delay time changes (prevents angular pitch changes)
    atime     interp     ktime                        ; create an interpolated a-rate version of delay time function (this will prevent qualtisation artifacts)
    atap      deltapi    atime+0.0015                 ; tap the delay buffer (nb. buffer opened and closed in caller instrument, UDO exists within the buffer)
    iDel      random     ksmps/sr,0.2                 ; random fixed delay time. By also apply a fixed delay time we prevent excessive amplitude at ote onsets when many chorus voices (N.Voices) are used
    atap      delay      atap,iDel                    ; apply fixed delay
    amix      init       0                            ; initialise amix variable (needed incase N.Voices is 1 in which case recirsion would not be used) 
    if icount<invoices then                           ; if stack of chorus voices is not yet completed...
     amix     ChoVoice   kDtnDep,kDtnRte,ifn,icount+1,invoices    ;.. call the UDO again. Increment count number.
    endif
              xout       atap+amix                    ; send chorus voice created in this interation (and all subsequent voices) back to caller instrument
endop

instr    1    ;instrument that continuously scans widgets
     gkModWhl       ctrl7       1, 1, 0, 127
     gkModWhlT      changed     gkModWhl
     if gkModWhlT==1 then
;                    chnset      (gkModWhl/127), "vowel"
                   cabbageSetValue "vowel", (gkModWhl/127), changed:k(gkModWhl)
     endif
     
    gkmonopoly     cabbageGetValue    "monopoly"        ; read widgets...
    gkDtnDep       cabbageGetValue    "DtnDep"
    gkDtnRte       cabbageGetValue    "DtnRte"    
    gkvibdep       cabbageGetValue    "vibdep"                
    gkmodrte       cabbageGetValue    "modrte"            
    gktrmdep       cabbageGetValue    "trmdep"            
    gklevel        cabbageGetValue    "lev"                
    gkvowel        cabbageGetValue    "vowel"
    gkvowelXY      cabbageGetValue    "vowelXY"
    gky            cabbageGetValue    "octXY"
                   cabbageSetValue    "vowel", gkvowelXY, changed:k(gkvowelXY)
    
    ; print text of vowel
    kPick          =                   int(gkvowel*4.999)
    if changed:k(kPick)==1 then
     if kPick==0 then
                   cabbageSet          1,"vowelText","text","Ahh"
     elseif kPick==1 then
                   cabbageSet          1,"vowelText","text","Ehh"
     elseif kPick==2 then
                   cabbageSet          1,"vowelText","text","Aye"
     elseif kPick==3 then
                   cabbageSet          1,"vowelText","text","Oh"
     elseif kPick==4 then
                   cabbageSet          1,"vowelText","text","Ooh"
     endif
    endif
    kactive active 2
    if trigger:k(kactive,0.5,0)==1 then
                   cabbageSet          1,"vowelText", "visible", 1
    elseif trigger:k(kactive,0.5,1)==1 then
                   cabbageSet          1, "vowelText", "visible", 0
    endif
    
    
    gkLegTim       cabbageGetValue    "LegTim"
    gkRvbMix       cabbageGetValue    "RvbMix"
    gkRvbSize      cabbageGetValue    "RvbSize"
    kporttime      linseg             0,0.001,0.1          ; portamento time (ramps up quickly from zero to a held value)
    gkvowel        portk              gkvowel,kporttime    ; apply portamento smoothing
    
    
    gkFiltOnOff    cabbageGetValue    "FiltOnOff"
    gkcf           cabbageGetValue    "cf"
    gkbw           cabbageGetValue    "bw"
    gkcf           portk     cpsoct(gkcf),kporttime     ; apply portamento smoothing
    gkbw           portk     gkbw*gkcf,kporttime        ; apply portamento smoothing
    gkFormScale    cabbageGetValue    "FormScale"
    gkBWScale      cabbageGetValue    "BWScale"
    gkFAmp1        cabbageGetValue    "FAmp1"
    gkFAmp2        cabbageGetValue    "FAmp2"
    gkFAmp3        cabbageGetValue    "FAmp3"
    gkFAmp4        cabbageGetValue    "FAmp4"
    gkFAmp5        cabbageGetValue    "FAmp5"
endin

instr    2    ;triggered via MIDI
    gkNoteTrig    init     1      ; at the beginning of a new note set note trigger flag to '1'
    icps          cpsmidi         ; read in midi note pitch in cycles per second
    givel         veloc    0,1    ; read in midi note velocity
    gkcps         =        icps   ; update a global krate variable for note pitch

    gkPB          pchbend  0,2
    if changed:k(gkPB)==1 then
           gkoct  =        gkPB+2
    elseif changed:k(gky)==1 then
           gkoct  cabbageGetValue    "octXY"
    endif


    if i(gkmonopoly)==0 then                                      ; if we are *not* in legato mode...
     inum      notnum                                             ; read midi note number (0 - 127)
               event_i         "i",p1+1+(inum*0.001),0,-1,icps    ; call soud producing instr
     krel      release                                            ; release flag (1 when note is released, 0 otherwise)
     if krel==1 then                                              ; when note is released...
               turnoff2        p1+1+(inum*0.001),4,1              ; turn off the called instrument
     endif                                                        ; end of conditional
    else                                                          ; otherwise... (i.e. legato mode)
     iactive   =               i(gkactive)                        ; number of active notes of instr 3 (note in release are disregarded)
     if iactive==0 then                                           ; ...if no notes are active
               event_i         "i",p1+1,0,-1                      ; ...start a new held note
     endif
    endif
endin

instr    3
    ivoice       cabbageGetValue    "voice"               ; read widgets...
    imoddel      cabbageGetValue    "moddel"
    imodris      cabbageGetValue    "modris"
    invoices     cabbageGetValue    "nvoices"
    
    kporttime    linseg    0,0.001,1              ; portamento time function rises quickly from zero to a held value
    kporttime    =         kporttime*gkLegTim     ; scale portamento time function with value from GUI knob widget
    
    if i(gkmonopoly)==1 then                      ; if we are in legato mode...
     krel        release                          ; sense when  note has been released
     gkactive    =         1-krel                 ; if note is in release, gkactive=0, otherwise =1
     kcps        portk     gkcps,kporttime            ;apply portamento smooth to changes in note pitch (this will only have an effect in 'legato' mode)
     kactive     active    p1-1                   ; ...check number of active midi notes (previous instrument)
     if kactive==0 then                           ; if no midi notes are active...
                 turnoff                          ; ... turn this instrument off
     endif
    else                                          ; otherwise... (polyphonic / non-legato mode)
     kcps        =         p4                     ; pitch equal to the original note pitch
    endif

    if gkNoteTrig==1&&gkmonopoly==1 then          ; if a new note is beginning and if we are in monophonic mode...
     reinit    RESTART_ENVELOPE                   ; reinitialise the modulations build up
    endif
    RESTART_ENVELOPE:
    ;VIBRATO (PITCH MODULATION)
    kmodenv      linseg     0,0.001+imoddel,0,0.001+imodris,1    ; modulation depth envelope - modulation can be delayed by the first envelope segement and the rise time is defined by the duration of the second segment
    kDepVar      randomi    0.5,1,4                              ; random variance of the depth of modulation
    kmodenv      portk      kmodenv*kDepVar,kporttime            ; smooth changes in modulation envelope to prevent discontinuities whnever the envelope is restarted
    rireturn
    
    kRteVar      randi      0.1,4                                ; random variation of the rate of modulation
        
    kvib         lfo        gkvibdep*kmodenv,gkmodrte*octave(kRteVar),0    ;vibrato function
    
    ;TREMOLO (AMPLITUDE MODULATION)
    ktrem        lfo        kmodenv*(gktrmdep/2),gkmodrte*octave(kRteVar),0    ; TREMOLO LFO FUNCTION
    ktrem        =          (ktrem+0.5) + (gktrmdep * 0.5)                     ; OFFSET AND RESCALE TREMOLO FUNCTION ACCORDING TO TREMOLO DEPTH WIDGET SETTING 
    
    iRelTim      =          0.05
    kCpsAtt      expsegr    0.6,rnd(0.004)+0.001,1,iRelTim,1-rnd(0.05)    ; a little jump in pitch at the beginning of a note will give the note a realistic attack sound. This will be most apparent when note velocity is high. And a little gliss at the end of notes.
    
    kcpsRnd      gaussi     1,0.01,10                                     ; create a function that will be used to apply naturalistic pitch instability
    kcps         =          kcps*(1+kcpsRnd)                              ; apply pitch instability
    asig         fofx5      kcps*semitone(kvib)*kCpsAtt, gkvowel, gkoct, gkFormScale, gkBWScale, gkFAmp1, gkFAmp2, gkFAmp3, gkFAmp4, gkFAmp5, ivoice-1    ;CALL fofx5 UDO
    if gkFiltOnOff==1 then
     asig        reson      asig,gkcf,gkbw,1                              ; parametric EQ
    endif
    aatt         linseg     0,(0.3*(1-givel)*(invoices^0.8))+0.01,1            ; AMPLITUDE ENVELOPE - ATTACK TIME IS INFLUENCED BY KEY VELOCITY
    asig         =          asig*aatt*ktrem*(0.3+givel*0.7)*gklevel            ; APPLY AMPLITUDE CONTROLS: ENVELOPE, TREMOLO, KEY VELOCITY AND LEVEL

    /*CHORUS*/    
    if invoices>1 then
     abuf        delayr     2                        ;--left channel--
     amixL       ChoVoice   gkDtnDep,gkDtnRte,gisine,1,invoices    ;call UDO
                 delayw     asig

     abuf        delayr     2                        ;--right channel--
     amixR       ChoVoice   gkDtnDep,gkDtnRte,gisine,1,invoices    ;call UDO
                 delayw     asig

     asigL       =          amixL/(invoices^0.5)                ; scale mix of chorus voices according to the number of voices...
     asigR       =          amixR/(invoices^0.5)                ; ...and the right channel
    else                                ;otherwise... (N.Voices = 1)
     asigL       =          asig                           ; send mono signal to both channels
     asigR       =          asig     
    endif
    arel         linsegr    1,iRelTim,0                    ; release envelope
    asigL        =          asigL*arel                     ; apply release envelope
    asigR        =          asigR*arel

    kwet         limit      2*gkRvbMix,0,1                    ; wet (reverb) level control (reaches maximum a knob halfway point and hold that value for the remainder of its travel)
    gasendL      =          gasendL+asigL*kwet                ; send some audio to the reverb instrument
    gasendR      =          gasendR+asigR*kwet
    kdry         limit      2*(1-gkRvbMix),0,1                ; dry level (stays at maximum for the first half of the knob's travel then ramps down to zero for the remainder of its travel)
                 outs       asigL*kdry,asigR*kdry             ; SEND AUDIO TO OUTPUT
    gkNoteTrig   =          0                                 ; reset new-note trigger (in case it was '1')
endin

instr    Effects
    if gkRvbMix>0 then
     aL,aR       reverbsc   gasendL,gasendR,gkRvbSize,12000  ; create stereo reverb signal
                 outs       aL,aR                            ; send reverb signal to speakers
                 clear      gasendL,gasendR                  ; clear reverb send variables
    endif
endin

instr 999
a1,a2            monitor
                 fout       "fofvoice.wav",4,a1,a2
endin

</CsInstruments>

<CsScore>
f 0 [3600*24*7]
i 1 0 [3600*24*7]             ; read widgets
i "Effects" 0 [3600*24*7]     ; reverb
;i 999 0 3600
</CsScore>

</CsoundSynthesizer>
