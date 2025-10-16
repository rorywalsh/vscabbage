
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; SubAddSynth.csd
; Written by Iain McCurdy, 2024
; 

<Cabbage>
[
    {
        "type": "form",
        "colour": {"fill": "#000000"},
        "caption": "Sub-add Synth",
        "size": {"width": 600, "height": 437},
        "pluginId": "SASy"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 12},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 10, "top": 10, "width": 80, "height": 80},
        "channel": "Freq",
        "range": {"min": 1, "max": 2000, "defaultValue": 40, "skew": 0.5, "increment": 0.001},
        "text": "Freq"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 12},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 90, "top": 10, "width": 80, "height": 80},
        "channel": "Dry",
        "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 0.5, "increment": 0.001},
        "text": "Dry"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 12},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 170, "top": 10, "width": 80, "height": 80},
        "channel": "Wet",
        "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 0.5, "increment": 0.001},
        "text": "Wet"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 12},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 250, "top": 10, "width": 80, "height": 80},
        "channel": "Att",
        "range": {"min": 0.001, "max": 1, "defaultValue": 0.001, "skew": 0.5, "increment": 0.001},
        "text": "Attack"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 12},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 330, "top": 10, "width": 80, "height": 80},
        "channel": "Dec",
        "range": {"min": 0.001, "max": 5, "defaultValue": 0.1, "skew": 0.5, "increment": 0.001},
        "text": "Decay"
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_284",
        "bounds": {"left": 105, "top": 140, "width": 315, "height": 115},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_285",
                "bounds": {"left": 0, "top": 4, "width": 315, "height": 16},
                "text": "I N P U T   W A V E F O R M"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 10, "top": 25, "width": 20, "height": 72},
                "channel": "P1",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 0.5, "increment": 0.001},
                "text": "1"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 30, "top": 25, "width": 20, "height": 72},
                "channel": "P2",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "text": "2"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 50, "top": 25, "width": 20, "height": 72},
                "channel": "P3",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "text": "3"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 70, "top": 25, "width": 20, "height": 72},
                "channel": "P4",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "text": "4"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 90, "top": 25, "width": 20, "height": 72},
                "channel": "P5",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "text": "5"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 110, "top": 25, "width": 20, "height": 72},
                "channel": "P6",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "text": "6"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 130, "top": 25, "width": 20, "height": 72},
                "channel": "P7",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "text": "7"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 150, "top": 25, "width": 20, "height": 72},
                "channel": "P8",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "text": "8"
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 10, "top": 90, "width": 20, "height": 20},
                "channel": "PN1",
                "range": {"min": 1, "max": 99, "defaultValue": 1, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 30, "top": 90, "width": 20, "height": 20},
                "channel": "PN2",
                "range": {"min": 1, "max": 99, "defaultValue": 2, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 50, "top": 90, "width": 20, "height": 20},
                "channel": "PN3",
                "range": {"min": 1, "max": 99, "defaultValue": 3, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 70, "top": 90, "width": 20, "height": 20},
                "channel": "PN4",
                "range": {"min": 1, "max": 99, "defaultValue": 4, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 90, "top": 90, "width": 20, "height": 20},
                "channel": "PN5",
                "range": {"min": 1, "max": 99, "defaultValue": 5, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 110, "top": 90, "width": 20, "height": 20},
                "channel": "PN6",
                "range": {"min": 1, "max": 99, "defaultValue": 6, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 130, "top": 90, "width": 20, "height": 20},
                "channel": "PN7",
                "range": {"min": 1, "max": 99, "defaultValue": 7, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 150, "top": 90, "width": 20, "height": 20},
                "channel": "PN8",
                "range": {"min": 1, "max": 99, "defaultValue": 8, "skew": 1, "increment": 1}
            },
            {
                "type": "genTable",
                "channel": {"id": "InputWF", "start": "InputWF_start", "length": "InputWF_length"},
                "range": {"y": {"min": -1, "max": 1}},
                "colour": {"fill": "[255, 255, 150]"},
                "bounds": {"left": 180, "top": 25, "width": 120, "height": 80},
                "tableNumber": 2
            },
            {
                "type": "image",
                "colour": {"fill": "#ffffffc8"},
                "channel": "image_286",
                "bounds": {"left": 180, "top": 65, "width": 120, "height": 1}
            }
        ]
    }
]
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps         =     64
nchnls        =     2
0dbfs         =     1

; function table containing partial magnitudes of harmonic input waveform
giFn               ftgen               2, 0, 4097, 10, 1


instr    1
 ; create input oscillator waveform
 kP1               cabbageGetValue     "P1"
 kP2               cabbageGetValue     "P2"
 kP3               cabbageGetValue     "P3"
 kP4               cabbageGetValue     "P4"
 kP5               cabbageGetValue     "P5"
 kP6               cabbageGetValue     "P6"
 kP7               cabbageGetValue     "P7"
 kP8               cabbageGetValue     "P8"
 
 kPN1              cabbageGetValue     "PN1"
 kPN2              cabbageGetValue     "PN2"
 kPN3              cabbageGetValue     "PN3"
 kPN4              cabbageGetValue     "PN4"
 kPN5              cabbageGetValue     "PN5"
 kPN6              cabbageGetValue     "PN6"
 kPN7              cabbageGetValue     "PN7"
 kPN8              cabbageGetValue     "PN8"
  
 if changed:k(kP1,kP2,kP3,kP4,kP5,kP6,kP7,kP8,kPN1,kPN2,kPN3,kPN4,kPN5,kPN6,kPN7,kPN8)==1 then
  reinit REBUILD_SOURCE_WAVEFORM
 endif
 REBUILD_SOURCE_WAVEFORM:
 i_                ftgen               giFn, 0, ftlen(giFn), 9, i(kPN1),i(kP1),0, i(kPN2),i(kP2),0, i(kPN3),i(kP3),0, i(kPN4),i(kP4),0, i(kPN5),i(kP5),0, i(kPN6),i(kP6),0, i(kPN7),i(kP7),0, i(kPN8),i(kP8),0
                   cabbageSet          "InputWF","tableNumber",giFn
 rireturn

kFreq              cabbageGetValue     "Freq"
kDry               cabbageGetValue     "Dry"
kWet               cabbageGetValue     "Wet"
kAtt               cabbageGetValue     "Att"
kDec               cabbageGetValue     "Dec"
Sfile              =                   "/Users/iainmccurdy/Documents/Sabbatical2024-25/toks.wav"
aSrc               diskin2             Sfile, 1, 0, 1
aFlw               follow2             aSrc, kAtt, kDec

; sub-tone
aSub               poscil              aFlw, kFreq, giFn

; sub-noise
;aSub               noise               aFlw, 0
;aSub               butlp               aSub, kFreq

aMix               =                   (aSrc * kDry) + (aSub * kWet)
                   outall              aMix
endin

</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>