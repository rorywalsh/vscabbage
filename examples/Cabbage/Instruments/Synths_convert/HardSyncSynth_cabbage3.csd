
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; HardSyncSynth.csd
; Written by Iain McCurdy 2016

; This is an implementation of hard sync between two oscillators
; Two oscillators are established, one is referred to as the master and the other as the slave.
; The slave oscillator reads a waveform, the shape of which is chosen by the user in the 'Waveform' panel, and its output is send to the audio output.
; However the phase of this oscillator can be reset by the period of the master oscillator, 
;   forcing the slave to begin re-reading its waveform from the beginning of the waveshape.
; This action can naturally induce discontinuities in the audio output and in the digital domain this is liable to cause aliasing.
; To prevent this the slave oscillator audio output needs to be amplitude enveloped using a window function in order to ramp is down to zero whenever a resync. occurs.
; This window function is therefore cycled using the phase pointer of the master oscillator.

; Controls
; --------
; Waveform    -    waveform used by the slave oscillator

;  (Voice 2)
; On/Off      -    turns a second master/slave oscillator pairing on or off
; Level       -    amplitude level of the second oscillator pairing
; Semitones   -    transposition of the 2nd voice in semitones
; Cents       -    transposition of the 2nd voice in cents

;  (Amplitude Envelope)
; Attack      -    attack time in seconds
; Decay       -    decay time in seconds
; Sustain     -    sustain level
; Release     -    release time in seconds

;  (Mixer)
; Velocity    -    amount of influence of note velocity upon sync trigger envelope and output amplitude
; Level       -    output level control

;  (Presets)
; Choose from 10 factory presets

;  (Reverb)
; Width       -    stereo width derived from a stereo modulating delay effect, i.e. chorus
; Rvb.Mix     -    dry/wet reverb mix
; Rvb.Size    -    size/length of the reverb effect

;  (Sync Trigger Frequency Envelope), i.e. master frequency
; Attack      -    attack time in seconds
; Decay       -    decay time in seconds
; Sustain     -    sustain level
; Release     -    release time in seconds
; Minimum     -    minimum level of the envelope (start and end values)
; Maximum     -    maximum level of the envelope (attack and sustain levels)
; Env<-->Man  -    morph between envelope controlling sync retrigger frequency
; Manual      -    manual frequency control

;  (Sync Trigger LFO)
; LFO Waveshape
; Depth       -    absolute maximum amplitude of the LFO
; Rate        -    rate of the LFO
; Delay       -    time delay before LFO begins to have an influence
; Rise        -    time it takes the LFO to rise to maximum amplitude
; MONO/POLY   -    sets whether a single LFO is used for all notes played (MONO) or whether each note get its own LFO

; MIDI
; Pitch bend modulates the pitch of all notes +/- 12 semitones
; Modulation wheel controls the filter envelope amount in parallel to the GUI widget

<Cabbage>
[
    {
        "type": "form",
        "colour": {"fill": "#1e1e1e"},
        "caption": "Hard Sync Synth",
        "size": {"width": 1175, "height": 336},
        "pluginId": "HdSy"
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_138",
        "bounds": {"left": 5, "top": 0, "width": 135, "height": 115},
        "children": [
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_139",
                "bounds": {"left": 0, "top": 3, "width": 135, "height": 12},
                "text": "W a v e f o r m"
            },
            {
                "type": "comboBox",
                "font": {"size": 9},
                "colour": {"fill": "222222"},
                "corners": 2,
                "defaultValue": 3,
                "items": [
                    "Sine",
                    "Triangle",
                    "Square",
                    "Sawtooth",
                    "Pulse",
                    "Half-Sine",
                    "Add 1",
                    "Add 2",
                    "Add 3",
                    "Add 4",
                    "Add 5",
                    "Add 6",
                    "Add 7"
                ],
                "indexOffset": true,
                "bounds": {"left": 5, "top": 30, "width": 80, "height": 20},
                "channel": "Waveform"
            },
            {
                "type": "genTable",
                "channel": {"id": "Waveform_ID", "start": "Waveform_ID_start", "length": "Waveform_ID_length"},
                "range": {"y": {"min": 1000, "max": -1}},
                "bounds": {"left": 85, "top": 30, "width": 40, "height": 20},
                "tableNumber": 1000
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_140",
        "bounds": {"left": 145, "top": 0, "width": 235, "height": 115},
        "children": [
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_141",
                "bounds": {"left": 0, "top": 3, "width": 235, "height": 12},
                "text": "V o i c e    2"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "defaultValue": 1,
                "bounds": {"left": 10, "top": 25, "width": 100, "height": 15},
                "text": "On/Off",
                "channel": "Voice2OnOff"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 20, "top": 47, "width": 60, "height": 60},
                "channel": "V2Lev",
                "text": "Level",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 75, "top": 15, "width": 90, "height": 90},
                "channel": "SubSemis",
                "text": "Semitones",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": -24, "max": 24, "defaultValue": -24, "skew": 1, "increment": 1}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 145, "top": 15, "width": 90, "height": 90},
                "channel": "SubCents",
                "text": "Cents",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": -100, "max": 100, "defaultValue": 0, "skew": 1, "increment": 1}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_142",
        "bounds": {"left": 385, "top": 0, "width": 300, "height": 115},
        "children": [
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_143",
                "bounds": {"left": 0, "top": 3, "width": 300, "height": 12},
                "text": "A m p l i t u d e    E n v e l o p e"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 15, "width": 90, "height": 90},
                "channel": "AAtt",
                "text": "Attack",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 8, "defaultValue": 0.05, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 70, "top": 15, "width": 90, "height": 90},
                "channel": "ADec",
                "text": "Decay",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 8, "defaultValue": 0.5, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 140, "top": 15, "width": 90, "height": 90},
                "channel": "ASus",
                "text": "Sustain",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 1, "increment": 0.01}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 210, "top": 15, "width": 90, "height": 90},
                "channel": "ARel",
                "text": "Release",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 8, "defaultValue": 5, "skew": 0.5, "increment": 0.001}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_144",
        "bounds": {"left": 690, "top": 0, "width": 160, "height": 115},
        "children": [
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_145",
                "bounds": {"left": 0, "top": 3, "width": 160, "height": 12},
                "text": "M i x e r"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 15, "width": 90, "height": 90},
                "channel": "Vel",
                "text": "Velocity",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 1, "defaultValue": 0.5, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 70, "top": 15, "width": 90, "height": 90},
                "channel": "Lev",
                "text": "Level",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 1, "defaultValue": 0.05, "skew": 0.5, "increment": 0.001}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_146",
        "bounds": {"left": 855, "top": 0, "width": 80, "height": 115},
        "children": [
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_147",
                "bounds": {"left": 0, "top": 3, "width": 80, "height": 12},
                "text": "P r e s e t s"
            },
            {
                "type": "comboBox",
                "font": {"size": 8},
                "colour": {"fill": "222222"},
                "corners": 2,
                "defaultValue": 1,
                "items": ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
                "indexOffset": true,
                "bounds": {"left": 10, "top": 35, "width": 60, "height": 18},
                "channel": "preset"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_148",
        "bounds": {"left": 940, "top": 0, "width": 230, "height": 115},
        "children": [
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_149",
                "bounds": {"left": 0, "top": 3, "width": 230, "height": 12},
                "text": "R e v e r b"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 15, "width": 90, "height": 90},
                "channel": "StMix",
                "text": "Width",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 70, "top": 15, "width": 90, "height": 90},
                "channel": "RvbMix",
                "text": "Rvb.Mix",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 1, "defaultValue": 0.2, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 140, "top": 15, "width": 90, "height": 90},
                "channel": "RvbSize",
                "text": "Rvb.Size",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 1, "defaultValue": 0.8, "skew": 1, "increment": 0.001}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_150",
        "bounds": {"left": 5, "top": 120, "width": 740, "height": 115},
        "children": [
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_151",
                "bounds": {"left": 0, "top": 3, "width": 740, "height": 12},
                "text": "S y n c .    T r i g g e r    E n v e l o p e"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 15, "width": 90, "height": 90},
                "channel": "Attack",
                "text": "Attack",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 8, "defaultValue": 2, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 70, "top": 15, "width": 90, "height": 90},
                "channel": "Decay",
                "text": "Decay",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 8, "defaultValue": 5, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 140, "top": 15, "width": 90, "height": 90},
                "channel": "Sustain",
                "text": "Sustain",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 1, "increment": 0.01}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 210, "top": 15, "width": 90, "height": 90},
                "channel": "Release",
                "text": "Release",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 8, "defaultValue": 5, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 280, "top": 15, "width": 90, "height": 90},
                "channel": "Minimum",
                "text": "Minimum",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": -8, "max": 4, "defaultValue": -0.6, "skew": 1, "increment": 0.01}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 350, "top": 15, "width": 90, "height": 90},
                "channel": "Maximum",
                "text": "Maximum",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": -8, "max": 4, "defaultValue": -0.7, "skew": 1, "increment": 0.01}
            },
            {
                "type": "label",
                "font": {"size": 13},
                "channel": "label_152",
                "bounds": {"left": 440, "top": 30, "width": 215, "height": 14},
                "text": "Env<-->Man"
            },
            {
                "type": "horizontalSlider",
                "font": {"size": 22},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 440, "top": 30, "width": 215, "height": 60},
                "channel": "SyncEnvMan",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001},
                "valueTextBox": 1,
                "text": "Env<>Man"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 650, "top": 15, "width": 90, "height": 90},
                "channel": "SyncRate",
                "text": "Manual",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 1, "max": 4000, "defaultValue": 440, "skew": 0.5, "increment": 0.1}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_153",
        "bounds": {"left": 750, "top": 120, "width": 420, "height": 115},
        "children": [
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_154",
                "bounds": {"left": 0, "top": 3, "width": 420, "height": 12},
                "text": "S y n c    T r i g g e r    L F O"
            },
            {
                "type": "comboBox",
                "font": {"size": 9},
                "colour": {"fill": "222222"},
                "corners": 2,
                "defaultValue": 2,
                "items": ["Sine", "Triangle", "Square", "Saw-up", "Saw-Down", "Random"],
                "indexOffset": true,
                "bounds": {"left": 5, "top": 30, "width": 80, "height": 20},
                "channel": "LFO_Shape"
            },
            {
                "type": "genTable",
                "channel": {"id": "LFO_Shape_ID", "start": "LFO_Shape_ID_start", "length": "LFO_Shape_ID_length"},
                "range": {"y": {"min": 2000, "max": -1}},
                "bounds": {"left": 85, "top": 30, "width": 40, "height": 20},
                "tableNumber": 2000
            },
            {
                "type": "button",
                "text": {"on": "MONO", "off": "MONO"},
                "colour": {"on": {"fill": "#c8c800"}, "off": {"fill": "#000000"}},
                "font": {"colour": {"off": "#505050", "on": "#ffffff"}, "size": 6},
                "corners": 2,
                "bounds": {"left": 35, "top": 60, "width": 50, "height": 16},
                "channel": "MONO_LFO",
                "radioGroup": 1
            },
            {
                "type": "button",
                "text": {"on": "POLY", "off": "POLY"},
                "colour": {"on": {"fill": "#c8c800"}, "off": {"fill": "#000000"}},
                "font": {"colour": {"off": "#505050", "on": "#ffffff"}, "size": 6},
                "corners": 2,
                "defaultValue": 1,
                "bounds": {"left": 35, "top": 76, "width": 50, "height": 16},
                "channel": "POLY_LFO",
                "radioGroup": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 120, "top": 15, "width": 90, "height": 90},
                "channel": "LFO_Depth",
                "text": "Depth",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 4, "defaultValue": 2, "skew": 0.5, "increment": 0.01}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 190, "top": 15, "width": 90, "height": 90},
                "channel": "LFO_Rate",
                "text": "Rate",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 99, "defaultValue": 0.07, "skew": 0.5, "increment": 0.01}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 260, "top": 15, "width": 90, "height": 90},
                "channel": "LFO_Delay",
                "text": "Delay",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.01}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 330, "top": 15, "width": 90, "height": 90},
                "channel": "LFO_Rise",
                "text": "Rise",
                "valueTextBox": 1,
                "textBox": 1,
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.01}
            }
        ]
    },
    {
        "type": "label",
        "font": {"colour": "#c0c0c0", "size": 11},
        "channel": "label_156",
        "bounds": {"left": 5, "top": 321, "width": 110, "height": 12},
        "text": "Iain McCurdy |2016|"
    },
    {
        "type": "keyboard",
        "channel": "keyboard_155",
        "bounds": {"left": 5, "top": 240, "width": 1165, "height": 80}
    }
]
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-n -+rtmidi=NULL -M0 -dm0
; -m0d
</CsOptions>

<CsInstruments>

; sr set by host
ksmps = 32
nchnls = 2
0dbfs = 1

massign    0,2

gisine        ftgen    3000, 0, 4096, 10, 1                                                   ; Sine
gihalfsine    ftgen    3001, 0, 4096, 9,  0.5, 1, 0                                         ; Half-Sine

i_            ftgen    3002, 0,131073,9,  1,1,0, 2,1/4,0
i_            ftgen    3003, 0,131073,9,  1,1,0, 5,1/4,0
i_            ftgen    3004, 0,131073,9,  1,1,0,11,1/4,0
i_            ftgen    3005, 0,131073,9,  6,1,0,    9,1/10,0, 13,1/14,0, 17,1/18,0, 21,1/22,0,  25,1/26,0,  29,1/30,0,  33,1/34,0
i_            ftgen    3006, 0,131073,9,  8,1,0,   11,1/10,0, 15,1/14,0, 19,1/18,0, 23,1/22,0,  27,1/26,0,  31,1/30,0,  35,1/34,0
i_            ftgen    3007, 0,131073,9, 10,1,0,   13,1/10,0, 17,1/14,0, 21,1/18,0, 25,1/22,0,  29,1/26,0,  33,1/30,0,  37,1/34,0
i_            ftgen    3008, 0,131073,9, 12,1/4,0, 25,1,0,    39,1/14,0, 63,1/18,0, 87,1/22,0, 111,1/26,0, 135,1/30,0, 159,1/34,0

; 127 band limited triangles
gitri    ftgen   0,0,4097,7,1,2048,1,0,-1,2048,-1
icount   =       0
loop1:
imaxh    =       sr / (2 * 440.0 * exp(log(2.0) * (icount - 69) / 12))
ifn      ftgen   4000+icount,0,4097,-30,gitri,1,imaxh
         loop_le icount,1,127,loop1

; 127 band limited squares
gisquare ftgen   0, 0, 4097, 10, 7, 1, 2048, 1, 0, -1, 2048, -1                    ; Square
icount   =       0
loop2:
imaxh    =       sr / (2 * 440.0 * exp(log(2.0) * (icount - 69) / 12))
ifn      ftgen   5000+icount,0,4097,-30,gisquare,1,imaxh
         loop_le icount,1,127,loop2

; 127 band limited saws
gisaw    ftgen   0, 0, 4097, 7, 1, 4096, -1                                       ; Sawtooth
icount   =       0
loop3:
imaxh    =       sr / (2 * 440.0 * exp(log(2.0) * (icount - 69) / 12))
ifn      ftgen   6000+icount,0,4097,-30,gisaw,1,imaxh
         loop_le icount,1,127,loop3

; 127 band limited pulses
gipulse  ftgen   0, 0, 4097, 7, 1, 128, 1, 0, 0, 4096-128, 0                          ; Pulse
icount   =       0
loop4:
imaxh    =       sr / (2 * 440.0 * exp(log(2.0) * (icount - 69) / 12))
ifn      ftgen   7000+icount,0,4097,-30,gipulse,1,imaxh
         loop_le icount,1,127,loop4

giWndw   ftgen   0, 0, 4097,   20,  2                                                ; window used to envelope out dicontinuity at sync retrigger point

; main waveform shapes for display
i_    ftgen    1000,0,-40,10,1                        ; display
i_    ftgen    1001,0,-40,10,1                        ; sine
i_    ftgen    1002,0,-40,7,0,10,1,20,-1,10,0        ; triangle
i_    ftgen    1003,0,-40,7,0,1,1,19,1,0,-1,20,-1    ; square
i_    ftgen    1004,0,-40,7,0,1,1,39,-1            ; saw
i_    ftgen    1005,0,-40,7,0,1,1,3,1,0,0,36,0        ; pulse
i_    ftgen    1006,0,-40, 9,  0.5, 1, 0                                         ; Half-Sine
i_    ftgen    1007, 0,-40,9,  1,1,0, 2,1/4,0
i_    ftgen    1008, 0,-40,9,  1,1,0, 5,1/4,0
i_    ftgen    1009, 0,-40,9,  1,1,0,11,1/4,0
i_    ftgen    1010, 0,-40,9,  6,1,0,    9,1/10,0, 13,1/14,0, 17,1/18,0, 21,1/22,0,  25,1/26,0,  29,1/30,0,  33,1/34,0
i_    ftgen    1011, 0,-40,9,  8,1,0,   11,1/10,0, 15,1/14,0, 19,1/18,0, 23,1/22,0,  27,1/26,0,  31,1/30,0,  35,1/34,0
i_    ftgen    1012, 0,-40,9, 10,1,0,   13,1/10,0, 17,1/14,0, 21,1/18,0, 25,1/22,0,  29,1/26,0,  33,1/30,0,  37,1/34,0
i_    ftgen    1013, 0,-40,9, 12,1/4,0, 25,1,0,    39,1/14,0, 63,1/18,0, 87,1/22,0, 111,1/26,0, 135,1/30,0, 159,1/34,0

; LFO waveform shapes for display
i_    ftgen    2000,0,-40,10,1                        ; display
i_    ftgen    2001,0,-40,10,1                        ; sine
i_    ftgen    2002,0,-40,7,0,10,1,20,-1,10,0        ; triangle
i_    ftgen    2003,0,-40,7,0,1,1,19,1,0,-1,20,-1    ; square
i_    ftgen    2004,0,-40,7,0,1,-1,39,1            ; saw-up
i_    ftgen    2005,0,-40,7,0,1,1,39,-1            ; saw-down
i_    ftgen    2006,0,-40,21,3                        ; random

instr    1
 kporttime             linseg    0,0.001,0.05
 gkVoice2OnOff         chnget    "Voice2OnOff"
 gkSyncRate            chnget    "SyncRate"
 gkSyncRate            portk     gkSyncRate, kporttime
 gkSyncEnvMan          chnget    "SyncEnvMan"
 kSubSemis             chnget    "SubSemis"
 kSubCents             chnget    "SubCents"
 gkSubTrans            =         semitone(kSubSemis)*cent(kSubCents)
 gkLFO_Shape           chnget    "LFO_Shape"
 gkLFO_Depth           chnget    "LFO_Depth"
 gkLFO_Rate            chnget    "LFO_Rate"
 gkLFO_Delay           chnget    "LFO_Delay"
 gkLFO_Rise            chnget    "LFO_Rise"
 gkV2Lev               chnget    "V2Lev"
 gkVel                 chnget    "Vel"
 gkLev                 chnget    "Lev"
 gkMONO_LFO            chnget    "MONO_LFO"
 if gkMONO_LFO==1 then
  if gkLFO_Shape==1 then
   gaLFO    poscil    gkLFO_Depth,gkLFO_Rate                                        ; sine
  elseif gkLFO_Shape==2 then
   gaLFO    lfo        gkLFO_Depth,gkLFO_Rate,1                                    ; triangle
  elseif gkLFO_Shape==3 then
   gaLFO    lfo        gkLFO_Depth,gkLFO_Rate,2                                    ; bipolar square
  elseif gkLFO_Shape==4 then 
   gaLFO    lfo        gkLFO_Depth,gkLFO_Rate,4                                    ; saw up
  elseif gkLFO_Shape==5 then
   gaLFO    lfo        gkLFO_Depth,gkLFO_Rate,5                                    ; saw down
  elseif gkLFO_Shape==6 then
   gaLFO    rspline    -gkLFO_Depth,gkLFO_Depth,gkLFO_Rate,gkLFO_Rate*2    ; random
  endif
 endif
   
 ; update view of main waveform
 gkWaveform            chnget    "Waveform"
 if changed(gkWaveform)==1 then
  reinit SEND_WAVEFORM_VIEW
  SEND_WAVEFORM_VIEW:
          tableicopy    1000,1000+i(gkWaveform)
          cabbageSet k(1), "Waveform_ID", "tableNumber", 1000  
 rireturn
 endif
 
 ; update view of LFO waveform
 gkLFO_Shape            chnget    "LFO_Shape"
 if changed(gkLFO_Shape)==1 then
  reinit SEND_LFO_SHAPE_VIEW
  SEND_LFO_SHAPE_VIEW:
             tableicopy 2000,2000+i(gkLFO_Shape)
             cabbageSet k(1), "LFO_Shape_ID", "tableNumber", 2000
 rireturn
 endif
 
 kpreset     chnget     "preset"
 ktrig       changed    kpreset
 if ktrig==1 then
             reinit     PRESET
 PRESET:
  
  #define    SEND_SETTINGS(N'Waveform'Voice2OnOff'SubSemis'SubCents'Attack'Decay'Sustain'Release'Minimum'Maximum'SyncEnvMan'SyncRate'LFO_Shape'LFO_Depth'LFO_Rate'LFO_Delay'LFO_Rise'AAtt'ADec'ASus'ARel'StMix'RvbMix'RvbSize'RvbCF'V2Lev'Vel'Lev)#
  if i(kpreset)==$N then
   chnset    $Waveform, "Waveform"
   chnset    $Voice2OnOff, "Voice2OnOff"
   chnset    $SubSemis, "SubSemis"
   chnset    $SubCents, "SubCents"
   chnset    $Attack, "Attack"
   chnset    $Decay, "Decay"
   chnset    $Sustain, "Sustain"
   chnset    $Release, "Release"
   chnset    $Minimum, "Minimum"
   chnset    $Maximum, "Maximum"
   chnset    $SyncEnvMan, "SyncEnvMan"
   chnset    $SyncRate, "SyncRate"
   chnset    $LFO_Shape, "LFO_Shape"
   chnset    $LFO_Depth, "LFO_Depth"
   chnset    $LFO_Rate, "LFO_Rate"
   chnset    $LFO_Delay, "LFO_Delay"
   chnset    $LFO_Rise, "LFO_Rise"
   chnset    $AAtt, "AAtt"
   chnset    $ADec, "ADec"
   chnset    $ASus, "ASus"
   chnset    $ARel, "ARel"
   chnset    $StMix, "StMix"
   chnset    $RvbMix, "RvbMix"
   chnset    $RvbSize, "RvbSize"
   chnset    $RvbCF, "RvbCF"
   chnset    $V2Lev, "V2Lev"
   chnset    $Vel, "Vel"
   chnset    $Lev, "Lev"
  endif#
  ;                 Waveform'Voice2OnOff'SubSemis'SubCents'Attack'Decay'Sustain'Release'Minimum'Maximum'SyncEnvMan'SyncRate'LFO_Shape'LFO_Depth'LFO_Rate'LFO_Delay'LFO_Rise'AAtt'ADec'ASus'ARel'StMix'RvbMix'RvbSize'RvbCF'V2Lev'Vel'Lev)#
  $SEND_SETTINGS(1  '1      '0          '-12     '0       '0.1   '0.5  '0.1    '0.2    '-2     '2      '0         '440     '1        '0        '5       '1        '2       '0.01'0.1 '0.6 '0.2 '1    '0.2   '0.8    '8000 '1    '0.5'0.05)            
  $SEND_SETTINGS(2  '7      '1          '-10     '0       '0.008 '0.6  '0      '0.5    '-2     '2      '0         '1600    '1        '0        '5       '1        '2       '0   '1.6 '0   '1   '1    '0.2   '0.8    '8000 '1    '0.8'0.05)            
  $SEND_SETTINGS(3  '3      '1          '-12     '0       '2     '8    '0.2    '6      '-2     '1.7    '0         '440     '6        '0.3      '2.3     '1        '2       '0.01'0.1 '0.6 '0.2 '1    '0.2   '0.8    '8000 '1    '0.5'0.05)            
  $SEND_SETTINGS(4  '5      '1          '-24     '0       '8     '0    '1      '3.5    '-8     '-0.4   '0         '440     '1        '0.5      '5       '0        '3       '1   '0   '1   '6   '1    '0.2   '0.8    '8000 '1    '0.5'0.05)            
  $SEND_SETTINGS(5  '13     '0          '-12     '0       '0     '5    '0.22   '5      '-4.5   '0      '0         '440     '1        '0        '5       '1        '2       '0   '8   '0   '8   '1    '0.2   '0.8    '8000 '1    '0.5'0.05)            
  $SEND_SETTINGS(6  '10     '0          '-12     '0       '0     '5    '0.22   '5      '-4.5   '4      '0         '440     '1        '0        '5       '1        '2       '0   '8   '0   '8   '1    '0.2   '0.8    '8000 '1    '0.5'0.05)            
  $SEND_SETTINGS(7  '4      '0          '-12     '0       '2     '5    '1      '5      '-4     '-4.01  '0         '440     '2        '1.3      '0.1     '0        '0       '0.05'8   '1   '8   '1    '0.2   '0.8    '8000 '1    '0.5'0.05)            
  $SEND_SETTINGS(8  '3      '1          '-12     '-30     '3     '5    '0      '5      '-5.4   '-1     '0         '440     '5        '4        '3.36    '0        '0       '0.05'8   '1   '8   '1    '0.2   '0.8    '8000 '1    '0.5'0.05)            
  $SEND_SETTINGS(9  '1      '1          '7       '0       '0     '0.5  '0      '2.5    '-2.47  '1.57   '0         '440     '3        '1.3      '3.1     '0        '0       '0   '0.1 '1   '2.4 '1    '0.2   '0.8    '8000 '1    '0.5'0.05)            
  $SEND_SETTINGS(10 '5      '1          '0       '61      '0.1   '2    '0      '2.4    '-5.5   '2      '0.5       '90      '6        '0.4      '30      '0        '0       '0   '0   '1   '2.4 '1    '0.2   '0.8    '8000 '1    '0.8'0.05)            
  rireturn
 endif
 
endin

instr    2    ; MIDI triggered instrument
 icps      cpsmidi
 inum      notnum
 iVel      ampmidi  i(gkVel)
 iVel      +=       1-i(gkVel)

 gkPB      pchbend  0, 12
 kporttime linseg   0,0.001,0.02
 gkPB      portk    gkPB, kporttime
 
 ; MODULATION WHEEL
 gkModWhl    ctrl7       1, 1, 0, 127
 gkModWhlT   changed     gkModWhl
 gkModWhl    =           (((gkModWhl/127)^3)*3999)+1 ; warp and map
 if gkModWhlT==1 then
             chnset gkModWhl, "SyncRate"
 endif

 ; sync trigger envelope
 iAttack     chnget    "Attack"
 iDecay      chnget    "Decay"
 iSustain    chnget    "Sustain"
 iRelease    chnget    "Release"
 iMinimum    chnget    "Minimum"
 iMaximum    chnget    "Maximum"
 kcps        linsegr    0,iAttack+0.0001,1,iDecay+0.0001,iSustain,iRelease+0.0001,0
 kcps        *=        iVel
 kcps        scale    kcps,iMaximum,iMinimum
 acps        =        icps * octave(a(kcps))

 acps    ntrpol    acps,a(gkSyncRate),gkSyncEnvMan
 ; sync trigger LFO
 kLFO_Env    linseg    0, i(gkLFO_Delay)+0.001, 0, i(gkLFO_Rise)+0.001, 1                ; lfo envelope
 if i(gkMONO_LFO)==0 then
  if i(gkLFO_Shape)==1 then
   aLFO    poscil    gkLFO_Depth*kLFO_Env,gkLFO_Rate                                        ; sine
  elseif i(gkLFO_Shape)==2 then
   aLFO    lfo        gkLFO_Depth*kLFO_Env,gkLFO_Rate,1                                    ; triangle
  elseif i(gkLFO_Shape)==3 then
   aLFO    lfo        gkLFO_Depth*kLFO_Env,gkLFO_Rate,2                                    ; bipolar square
  elseif i(gkLFO_Shape)==4 then 
   aLFO    lfo        gkLFO_Depth*kLFO_Env,gkLFO_Rate,4                                    ; saw up
  elseif i(gkLFO_Shape)==5 then
   aLFO    lfo        gkLFO_Depth*kLFO_Env,gkLFO_Rate,5                                    ; saw down
  elseif i(gkLFO_Shape)==6 then
   aLFO    rspline    -gkLFO_Depth*kLFO_Env,gkLFO_Depth*kLFO_Env,gkLFO_Rate,gkLFO_Rate*2    ; random
  endif
 else
   aLFO    =    gaLFO * kLFO_Env
 endif
 acps    *=    octave(aLFO)
 
 ; voice 1
 if i(gkWaveform)==1 then
  iWaveform    =    3000
 elseif i(gkWaveform)>5 then
  iWaveform    =    3000 + i(gkWaveform) - 5 
 else
  iWaveform    =    2000 + i(gkWaveform)*1000 + inum
 endif
 aPhaseMast,aSyncMast     syncphasor icps*semitone(gkPB), a(0)                                        ; 
 aWndw    table3    aPhaseMast,giWndw,1
 aPhaseSlave,aSyncSlave syncphasor acps, aSyncMast
 asig    table3    aPhaseSlave,iWaveform,1
 ; anti-alias filter
 asig    buthp    asig,icps
 asig    buthp    asig,icps
 asig    *=        aWndw

 ; voice 2
 if gkVoice2OnOff==1 then
  aPhaseMast,aSyncMast     syncphasor icps*gkSubTrans, a(0)
  aWndw    tablei    aPhaseMast,giWndw,1
  aPhaseSlave,aSyncSlave syncphasor acps, aSyncMast
  asig2    tablei    aPhaseSlave,iWaveform,1
  ; anti-alias filter
  asig2    buthp    asig2,icps*gkSubTrans
  asig2    buthp    asig2,icps*gkSubTrans
  asig2    *=        aWndw
  asig    +=        asig2*gkV2Lev
 endif
 
 ; amplitude envelope
 ; sync trigger envelope
 iAAtt    chnget    "AAtt"
 iADec    chnget    "ADec"                                        
 iASus    chnget    "ASus"
 iARel    chnget    "ARel"
 kEnv    linsegr    0,    iAAtt+0.0001,1,    iADec+0.0001,iASus,      iARel+0.0001,0
 asig    *=        a(expcurve(kEnv,4))

 ivel    ampmidi    0.2    
         chnmix    asig*iVel,"Send"                                                    ; mix into global send channel

endin

instr    10    ; output
 aSig        chnget    "Send"
 aSig        *=        gkLev
 ; voicing filter
 aSig    pareq    aSig,150,ampdbfs(12),0.01
 
 ; lowpass filter
 iCF    =        4000
 aSig    tone    aSig,iCF
 
 ; stereo processing
 kDep    =1        ;chnget    "StDep"
 kRte    =0.1    ;chnget    "StRte"
 kWid    =    (chnget:k("StWid")*0.5) + 0.5
 iMaxDel    =    0.03
 kDlt1    rspline    1/kr,iMaxDel*kDep,kRte,kRte*2
 kDlt2    rspline    1/kr,iMaxDel*kDep,kRte,kRte*2
 kDlt1    limit    kDlt1,1/kr,iMaxDel*kDep
 kDlt2    limit    kDlt2,1/kr,iMaxDel*kDep
 aDel1    vdelay    aSig,a(kDlt1)*1000,iMaxDel*1000
 aDel2    vdelay    aSig,a(kDlt2)*1000,iMaxDel*1000
 
 kMix          chnget    "StMix"
 ;aL        ntrpol    aSig,aDel1*(1-kWid)  +  aDel2*kWid,     kMix
 ;aR        ntrpol    aSig,aDel1*kWid      +  aDel2*(1-kWid), kMix
 aL            ntrpol    aSig, aDel1, kMix
 aR            ntrpol    aSig, aDel2, kMix
 
 ; reverb
 kRvbMix       chnget    "RvbMix"
 kRvbSize      chnget    "RvbSize"
 kRvbCF        =         8000    ;chnget  "RvbCF"
 aRvbL,aRvbR   reverbsc  aL,aR,kRvbSize,kRvbCF
 aL            ntrpol    aL,aRvbL,kRvbMix
 aR            ntrpol    aR,aRvbR,kRvbMix
 
         outs    aL,aR
         chnclear    "Send"
endin

</CsInstruments>

<CsScore>
i 1  0 [3600*24*7]
i 10 0 [3600*24*7]
</CsScore>

</CsoundSynthesizer>
