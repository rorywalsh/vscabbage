
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; CZSynth.csd
; Iain McCurdy, 2015

; *INVISIBLE COMBOBOXES NOT INITIALISED CORRECTLY, CHANGE TO guiMode("queue")

; CZSynth employs phase distortion synthesis, a technique featured in Casio's CZ range of synthesisers from the 1980s

; This synth can create strident lead sounds and if higher partials are employed with high levels of phase distortion aliasing can occur.
; This is left in as a chacteristic of the instrument but if desired, raising the sample rate can reduce or prevent this aliasing 

; The basic waveform (before phase distortion) can be designed in one of three ways:
; Additive    -    is constructed from 16 harmonic partials selectable using the checkboxes.
; Buzz        -    is constructed from a stack of harmonically related cosines using GEN11 and in a manner similar to the buzz and gbuzz opcodes.
; Noise        -    is a table of triangle noise derived samples.

; PHASE DISTORTION
; Distort    -    manual offset for the amount of phase distortion
; Env.        -    amount of influence of the envelope upon distortion amount
; Att.        -    attack time for the phase distortion amount envelope
; Dec.        -    decay time for the phase distortion amount envelope
; Retrig.(checkbox)    -    if ticked, in mono mode the envelope will be retriggered each time a new note is played
; Vel.        -    amount of influence of key velocity upon phase distortion amount (affects both manual and envelope)
; LFO SHAPE (COMBOBOX)    - LFO shape can be either triangle or random (random splines). Random splines LFO can be useful in adding a natural fluctuation to the sound.
; LFO        -    amount of LFO influence upon phase distortion amount
; Rate        -    rate of the LFO
; Note that the manual control 'Distort', the envelope and the LFO are added together, therefore the influence of the envelope (or the LFO) may not be heard if 'Distort' is at its maximum setting  
; Kybd.Scal.    -    amount of keyboard scaling of phase distortion amount. 
;             Increasing this will result in attenuation of phase distortion of higher notes.
;             This can be used to reduce of prevent aliasing in higher notes. 

; FILTER (a filter built using the clfilt opcode - lowpass Cheyshev I)
; On/Off    -    turns the filter on and off
; Cutoff    -    cutoff frequency manual control expressed as a ratio of the frequency of the note played
; Poles        -    number of poles employed by the filter
; Ripple    -    amount of ripple at the cutoff point
; Env.        -    amount of influence of the envelope upon filter cutoff
; Att.        -    attack time for the envelope
; Dec.        -    decay time for the envelope
; Retrig.(checkbox)    -    if ticked, in mono mode the envelope will be retriggered each time a new note is played
; Vel.        -    amount of influence of key velocity upon filter cutoff (affects both manual and envelope)
; LFO SHAPE (COMBOBOX)    - LFO shape can be either triangle or random (random splines). Random splines LFO can be useful in adding a natural fluctuation to the sound. 
; LFO        -    amount of LFO influence upon filter cutoff
; Rate        -    rate of the LFO
; Note that 'Cutoff', the envelope and the LFO are simply added together, but that their combined output is internally limited to prevent the filter from 'blowing up'

; OSCILLATOR 2    -    besides transposition the second oscillator is identical to the main oscillator
; On/Off    -    turns the second oscillator on or off
; Semitone    -    transposition of the second oscillator in semitones
; Cents       -    transposition of the second oscillator in cents

; POLYPHONY
; Mono/Poly (button) - select mode
; Port.Time    -    portamento time in mono (legato) mode

; AMPLITUDE
; Att.        -    attack time for the amplitude envelope
; Dec.        -    decay time for the amplitude envelope
; Sus.        -    sustain level for the amplitude envelope
; Rel.        -    release time for the amplitude envelope
; Vel.        -    amount of influence of key velocity upon amplitude
; Clip        -    amount of clipping of the sound. This can be used to apply further waveshaping.
; Level       -    output level

; MIDI
; Pitch bend modulates the pitch of all note +/- 2 semitones
; Modulation wheel control the Distort Amount amount in parallel to the GUI widget

<Cabbage>
[
    {
        "type": "form",
        "colour": {"fill": "#282828"},
        "caption": "CZ Synthesiser",
        "size": {"width": 1075, "height": 375},
        "pluginId": "RMSy"
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_287",
        "bounds": {"left": 5, "top": 5, "width": 500, "height": 130},
        "children": [
            {
                "type": "label",
                "font": {"colour": "#ffff64", "size": 11},
                "channel": "label_288",
                "bounds": {"left": 5, "top": 2, "width": 500, "height": 12},
                "text": ". PHASE DISTORTION ."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Distort",
                "channel": "ShapeAmount",
                "range": {"min": -1, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 1,
                "bounds": {"left": 80, "top": 25, "width": 80, "height": 10},
                "text": "Retrig.",
                "channel": "SARetrig",
                "visible": 0
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Env.",
                "channel": "SAEnv",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 120, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Att.",
                "channel": "SAAtt",
                "range": {"min": 0, "max": 16, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 180, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Dec.",
                "channel": "SADec",
                "range": {"min": 0, "max": 16, "defaultValue": 2, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 240, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Vel.",
                "channel": "SAVel",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 1, "increment": 0.001}
            },
            {
                "type": "comboBox",
                "font": {"size": 9},
                "colour": {"fill": "222222"},
                "corners": 2,
                "defaultValue": 1,
                "items": ["Tri.", "Random"],
                "indexOffset": true,
                "bounds": {"left": 325, "top": 20, "width": 85, "height": 20},
                "channel": "SALFOShape"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 300, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "LFO",
                "channel": "SALFO",
                "range": {"min": 0, "max": 1, "defaultValue": 0.09, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 360, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Rate",
                "channel": "SARate",
                "range": {"min": 0, "max": 14, "defaultValue": 1, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 420, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Kybd.Scal.",
                "channel": "KybdScal",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_289",
        "bounds": {"left": 510, "top": 5, "width": 560, "height": 130},
        "children": [
            {
                "type": "label",
                "font": {"colour": "#ffff64", "size": 11},
                "channel": "label_290",
                "bounds": {"left": 5, "top": 2, "width": 550, "height": 12},
                "text": ". FILTER ."
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "bounds": {"left": 15, "top": 25, "width": 100, "height": 10},
                "text": "On/Off",
                "channel": "FilterOnOff"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Cutoff",
                "channel": "Cutoff",
                "range": {"min": 1, "max": 100, "defaultValue": 10, "skew": 1, "increment": 0.1},
                "visible": 0
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Poles",
                "channel": "Poles",
                "range": {"min": 2, "max": 50, "defaultValue": 8, "skew": 1, "increment": 2},
                "visible": 0
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 120, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Ripple",
                "channel": "Ripple",
                "range": {"min": 0.1, "max": 50, "defaultValue": 20, "skew": 0.5, "increment": 0.01},
                "visible": 0
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 1,
                "bounds": {"left": 180, "top": 25, "width": 80, "height": 10},
                "text": "Retrig.",
                "textBox": 1,
                "channel": "FRetrig",
                "visible": 0
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 180, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Env.",
                "channel": "FEnv",
                "range": {"min": 0, "max": 50, "defaultValue": 20, "skew": 1, "increment": 0.01},
                "visible": 0
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 240, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Att.",
                "channel": "FAtt",
                "range": {"min": 0, "max": 16, "defaultValue": 0.1, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 300, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Dec.",
                "channel": "FDec",
                "range": {"min": 0, "max": 16, "defaultValue": 1, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 360, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Vel.",
                "channel": "FVel",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 1, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "comboBox",
                "font": {"size": 9},
                "colour": {"fill": "222222"},
                "corners": 2,
                "defaultValue": 1,
                "items": ["Tri.", "Random"],
                "indexOffset": true,
                "bounds": {"left": 445, "top": 20, "width": 85, "height": 20},
                "channel": "FLFOShape",
                "visible": 0
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 420, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "LFO",
                "channel": "FLFO",
                "range": {"min": 0, "max": 50, "defaultValue": 0, "skew": 1, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 480, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Rate",
                "channel": "FRate",
                "range": {"min": 0, "max": 14, "defaultValue": 1, "skew": 1, "increment": 0.001},
                "visible": 0
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_291",
        "bounds": {"left": 5, "top": 140, "width": 320, "height": 130},
        "children": [
            {
                "type": "label",
                "font": {"colour": "#ffff64", "size": 11},
                "channel": "label_292",
                "bounds": {"left": 5, "top": 2, "width": 320, "height": 12},
                "text": ". WAVEFORM ."
            },
            {
                "type": "comboBox",
                "font": {"size": 9},
                "colour": {"fill": "222222"},
                "corners": 2,
                "defaultValue": 1,
                "items": ["Additive", "Buzz", "Noise"],
                "indexOffset": true,
                "bounds": {"left": 5, "top": 20, "width": 85, "height": 20},
                "channel": "WaveformMode"
            },
            {
                "type": "label",
                "font": {"size": 12},
                "channel": "label_293",
                "bounds": {"left": 145, "top": 23, "width": 85, "height": 13},
                "text": "Octave Shift:"
            },
            {
                "type": "comboBox",
                "font": {"size": 9},
                "colour": {"fill": "222222"},
                "corners": 2,
                "defaultValue": 1,
                "items": ["0", "-1", "-2", "-3", "-4", "-5", "-6"],
                "indexOffset": true,
                "bounds": {"left": 230, "top": 20, "width": 85, "height": 20},
                "channel": "OctShift"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "WaveformAddID",
        "bounds": {"left": 5, "top": 190, "width": 320, "height": 130},
        "children": [
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "image_294",
                "bounds": {"left": 8, "top": 3, "width": 304, "height": 19}
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "defaultValue": 1,
                "bounds": {"left": 10, "top": 5, "width": 15, "height": 15},
                "channel": "F0"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 25, "top": 5, "width": 15, "height": 15},
                "channel": "F1"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 40, "top": 5, "width": 15, "height": 15},
                "channel": "F2"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 55, "top": 5, "width": 15, "height": 15},
                "channel": "F3"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 70, "top": 5, "width": 15, "height": 15},
                "channel": "F4"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 85, "top": 5, "width": 15, "height": 15},
                "channel": "F5"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 100, "top": 5, "width": 15, "height": 15},
                "channel": "F6"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "defaultValue": 1,
                "bounds": {"left": 115, "top": 5, "width": 15, "height": 15},
                "channel": "F7"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 130, "top": 5, "width": 15, "height": 15},
                "channel": "F8"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 145, "top": 5, "width": 15, "height": 15},
                "channel": "F9"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 160, "top": 5, "width": 15, "height": 15},
                "channel": "F10"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "defaultValue": 1,
                "bounds": {"left": 175, "top": 5, "width": 15, "height": 15},
                "channel": "F11"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 190, "top": 5, "width": 15, "height": 15},
                "channel": "F12"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 205, "top": 5, "width": 15, "height": 15},
                "channel": "F13"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 220, "top": 5, "width": 15, "height": 15},
                "channel": "F14"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 235, "top": 5, "width": 15, "height": 15},
                "channel": "F15"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 250, "top": 5, "width": 15, "height": 15},
                "channel": "F16"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 265, "top": 5, "width": 15, "height": 15},
                "channel": "F17"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 280, "top": 5, "width": 15, "height": 15},
                "channel": "F18"
            },
            {
                "type": "checkBox",
                "colour": {"fill": "#00ff00"},
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 8},
                "bounds": {"left": 295, "top": 5, "width": 15, "height": 15},
                "channel": "F19"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_295",
                "bounds": {"left": 10, "top": 24, "width": 15, "height": 9},
                "text": "1"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_296",
                "bounds": {"left": 25, "top": 24, "width": 15, "height": 9},
                "text": "2"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_297",
                "bounds": {"left": 40, "top": 24, "width": 15, "height": 9},
                "text": "3"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_298",
                "bounds": {"left": 55, "top": 24, "width": 15, "height": 9},
                "text": "4"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_299",
                "bounds": {"left": 70, "top": 24, "width": 15, "height": 9},
                "text": "5"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_300",
                "bounds": {"left": 85, "top": 24, "width": 15, "height": 9},
                "text": "6"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_301",
                "bounds": {"left": 100, "top": 24, "width": 15, "height": 9},
                "text": "7"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_302",
                "bounds": {"left": 115, "top": 24, "width": 15, "height": 9},
                "text": "8"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_303",
                "bounds": {"left": 130, "top": 24, "width": 15, "height": 9},
                "text": "9"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_304",
                "bounds": {"left": 145, "top": 24, "width": 15, "height": 9},
                "text": "10"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_305",
                "bounds": {"left": 160, "top": 24, "width": 15, "height": 9},
                "text": "11"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_306",
                "bounds": {"left": 175, "top": 24, "width": 15, "height": 9},
                "text": "12"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_307",
                "bounds": {"left": 190, "top": 24, "width": 15, "height": 9},
                "text": "13"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_308",
                "bounds": {"left": 205, "top": 24, "width": 15, "height": 9},
                "text": "14"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_309",
                "bounds": {"left": 220, "top": 24, "width": 15, "height": 9},
                "text": "15"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_310",
                "bounds": {"left": 235, "top": 24, "width": 15, "height": 9},
                "text": "16"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_311",
                "bounds": {"left": 250, "top": 24, "width": 15, "height": 9},
                "text": "17"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_312",
                "bounds": {"left": 265, "top": 24, "width": 15, "height": 9},
                "text": "18"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_313",
                "bounds": {"left": 280, "top": 24, "width": 15, "height": 9},
                "text": "19"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_314",
                "bounds": {"left": 295, "top": 24, "width": 15, "height": 9},
                "text": "20"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "WaveformBuzzID",
        "bounds": {"left": 5, "top": 190, "width": 320, "height": 130},
        "visible": 0,
        "children": [
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 25, "top": 0, "width": 70, "height": 70},
                "text": "Harms.",
                "channel": "Harms",
                "range": {"min": 1, "max": 80, "defaultValue": 5, "skew": 1, "increment": 1}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 95, "top": 0, "width": 70, "height": 70},
                "text": "Lowest",
                "channel": "Lowest",
                "range": {"min": 1, "max": 80, "defaultValue": 7, "skew": 1, "increment": 1}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 165, "top": 0, "width": 70, "height": 70},
                "text": "Power",
                "channel": "Power",
                "range": {"min": 0, "max": 2, "defaultValue": 0.9, "skew": 1, "increment": 0.001}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "WaveformNoiseID",
        "bounds": {"left": 5, "top": 190, "width": 320, "height": 130},
        "visible": 0,
        "children": [
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 95, "top": 0, "width": 70, "height": 70},
                "text": "Size",
                "channel": "NoiseSize",
                "range": {"min": 2, "max": 12, "defaultValue": 7, "skew": 1, "increment": 1}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_315",
        "bounds": {"left": 330, "top": 140, "width": 140, "height": 130},
        "children": [
            {
                "type": "label",
                "font": {"colour": "#ffff64", "size": 11},
                "channel": "label_316",
                "bounds": {"left": 5, "top": 2, "width": 130, "height": 12},
                "text": ". OSCILLATOR 2 ."
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 0,
                "bounds": {"left": 15, "top": 25, "width": 100, "height": 10},
                "text": "On/Off",
                "channel": "Osc2OnOff"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Semitone",
                "channel": "Semitones",
                "range": {"min": -24, "max": 24, "defaultValue": -12, "skew": 1, "increment": 1}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Cents",
                "channel": "Cents",
                "range": {"min": -100, "max": 100, "defaultValue": 0, "skew": 1, "increment": 1}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_317",
        "bounds": {"left": 475, "top": 140, "width": 150, "height": 130},
        "children": [
            {
                "type": "label",
                "font": {"colour": "#ffff64", "size": 11},
                "channel": "label_318",
                "bounds": {"left": 5, "top": 2, "width": 140, "height": 12},
                "text": ". POLYPHONY ."
            },
            {
                "type": "button",
                "text": {"on": "Mono", "off": "Poly"},
                "font": {"size": 7},
                "colour": {"on": {"fill": "222222"}, "off": {"fill": "222222"}},
                "corners": 2,
                "defaultValue": 1,
                "bounds": {"left": 15, "top": 40, "width": 50, "height": 20},
                "channel": "MonoPoly"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Port.Time",
                "channel": "PortTime",
                "range": {"min": 0, "max": 1, "defaultValue": 0.05, "skew": 1, "increment": 0.001},
                "visible": 0
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_319",
        "bounds": {"left": 630, "top": 140, "width": 440, "height": 130},
        "children": [
            {
                "type": "label",
                "font": {"colour": "#ffff64", "size": 11},
                "channel": "label_320",
                "bounds": {"left": 5, "top": 2, "width": 430, "height": 12},
                "text": ". AMPLITUDE ."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Att.",
                "channel": "AAtt",
                "range": {"min": 0, "max": 5, "defaultValue": 0.05, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Dec.",
                "channel": "ADec",
                "range": {"min": 0, "max": 5, "defaultValue": 0.5, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 120, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Sus.",
                "channel": "ASus",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 180, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Rel.",
                "channel": "ARel",
                "range": {"min": 0, "max": 5, "defaultValue": 0.2, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 240, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Vel.",
                "channel": "AVel",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 1, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 300, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Clip",
                "channel": "Clip",
                "range": {"min": 0.1, "max": 10, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 360, "top": 40, "width": 80, "height": 80},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Level",
                "channel": "Level",
                "range": {"min": 0, "max": 1, "defaultValue": 0.4, "skew": 1, "increment": 0.001}
            }
        ]
    },
    {
        "type": "label",
        "font": {"size": 11},
        "channel": "label_322",
        "bounds": {"left": 5, "top": 270, "width": 110, "height": 12},
        "text": "Iain McCurdy |2015|"
    },
    {
        "type": "keyboard",
        "channel": "keyboard_321",
        "bounds": {"left": 5, "top": 285, "width": 1065, "height": 85}
    }
]
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 16
nchnls = 2
0dbfs  = 1

                massign   0,2
                maxalloc  3,1

giUniSine       ftgen     0, 0, 4097, 19, 1, 0.5, 0, 0.5
giUniTri        ftgen     0, 0, 4097, 7, 0, 2048, 1, 2048, 0
giSine          ftgen     0, 0, 4096, 10, 1

giKybdScal      ftgen     0, 0, 128, 7, 1, 127, 0
gaL,gaR         init      0

opcode    lineto2,k,kk
 kinput,ktime    xin
 ktrig          changed   kinput,ktime    ; reset trigger
 if ktrig==1 then                    ; if new note has been received or if portamento time has been changed...
  reinit RESTART
 endif
 RESTART:                                    ; restart 'linseg' envelope
 if i(ktime)==0 then                         ; 'linseg' fails if duration is zero...
  koutput       =         i(kinput)          ; ...in which case output simply equals input
 else
  koutput       linseg    i(koutput),i(ktime),i(kinput)    ; linseg envelope from old value to new value
 endif
 rireturn
                xout      koutput
endop

instr    1
 gkMonoPoly     chnget    "MonoPoly"
 gkFilterOnOff  chnget    "FilterOnOff"

 if changed(gkMonoPoly)==1 then
  if gkMonoPoly==0 then
                cabbageSet k(1), "SARetrig", "visible", 1 ; SARetrigID -> SARetrig
   if gkFilterOnOff==1 then
                cabbageSet k(1), "FRetrig", "visible", 1 ; FRetrigID -> FRetrig
   endif
                cabbageSet k(1), "PortTime", "visible", 1 ; PortTimeID -> PortTime
  elseif gkMonoPoly==1 then
                cabbageSet k(1), "SARetrig", "visible", 0 ; SARetrigID -> SARetrig
                cabbageSet k(1), "FRetrig", "visible", 0 ; FRetrigID -> FRetrig
                cabbageSet k(1), "PortTime", "visible", 0 ; PortTimeID -> PortTime
  endif

 endif
 
 kWaveformMode    chnget    "WaveformMode"
 if changed(kWaveformMode)==1 then
  if kWaveformMode==1 then
                cabbageSet k(1), "WaveformAddID", "visible", 1
                cabbageSet k(1), "WaveformBuzzID", "visible", 0
                cabbageSet k(1), "WaveformNoiseID", "visible", 0
  elseif kWaveformMode==2 then
                cabbageSet k(1), "WaveformAddID", "visible", 0
                cabbageSet k(1), "WaveformBuzzID", "visible", 1
                cabbageSet k(1), "WaveformNoiseID", "visible", 0
  else
                cabbageSet k(1), "WaveformAddID", "visible", 0
                cabbageSet k(1), "WaveformBuzzID", "visible", 0
                cabbageSet k(1), "WaveformNoiseID", "visible", 1
  endif
 endif
 kHarms         chnget    "Harms"
 kLowest        chnget    "Lowest"
 kPower         chnget    "Power"
 kHarms         init      5
 kLowest        init      7
 kPower         init      0.9
 kNoiseSize     chnget    "NoiseSize"
 kNoiseSize     init      3
 
 kShapeAmount   chnget    "ShapeAmount"
 gkSARetrig     chnget    "SARetrig"
 gkSAEnv        chnget    "SAEnv"
 gkSAAtt        chnget    "SAAtt"
 gkSADec        chnget    "SADec"
 gkSAVel        chnget    "SAVel"
 gkSALFOShape   chnget    "SALFOShape"
 gkSALFO        chnget    "SALFO"
 gkSARate       chnget    "SARate"
 gkKybdScal     chnget    "KybdScal"
 
 kClip          chnget    "Clip"
 
 if changed(gkFilterOnOff)==1 then
  if gkFilterOnOff==1 then
      if gkMonoPoly==0 then
               cabbageSet k(1), "FRetrig", "visible", 1 ; FRetrigID -> FRetrig
      endif
               cabbageSet k(1), "Cutoff", "visible", 1 ; ID1 -> Cutoff
               cabbageSet k(1), "Poles", "visible", 1 ; ID2 -> Poles
               cabbageSet k(1), "Ripple", "visible", 1 ; ID3 -> Ripple
               cabbageSet k(1), "FEnv", "visible", 1 ; ID4 -> FEnv
               cabbageSet k(1), "FAtt", "visible", 1 ; ID5 -> FAtt
               cabbageSet k(1), "FDec", "visible", 1 ; ID6 -> FDec
               cabbageSet k(1), "FVel", "visible", 1 ; ID7 -> FVel
               cabbageSet k(1), "FLFO", "visible", 1 ; ID8 -> FLFO
               cabbageSet k(1), "FRate", "visible", 1 ; ID9 -> FRate
               cabbageSet k(1), "FLFOShape", "visible", 1 ; ID10 -> FLFOShape
  elseif gkFilterOnOff==0 then
               cabbageSet k(1), "FRetrig", "visible", 0 ; FRetrigID -> FRetrig
               cabbageSet k(1), "Cutoff", "visible", 0 ; ID1 -> Cutoff
               cabbageSet k(1), "Poles", "visible", 0 ; ID2 -> Poles
               cabbageSet k(1), "Ripple", "visible", 0 ; ID3 -> Ripple
               cabbageSet k(1), "FEnv", "visible", 0 ; ID4 -> FEnv
               cabbageSet k(1), "FAtt", "visible", 0 ; ID5 -> FAtt
               cabbageSet k(1), "FDec", "visible", 0 ; ID6 -> FDec
               cabbageSet k(1), "FVel", "visible", 0 ; ID7 -> FVel
               cabbageSet k(1), "FLFO", "visible", 0 ; ID8 -> FLFO
               cabbageSet k(1), "FRate", "visible", 0 ; ID9 -> FRate
               cabbageSet k(1), "FLFOShape", "visible", 0 ; ID10 -> FLFOShape
  endif
 endif

 kCutoff       chnget    "Cutoff"
 gkPoles       chnget    "Poles"
 gkRipple      chnget    "Ripple"
 gkFRetrig     chnget    "FRetrig"
 gkFEnv        chnget    "FEnv"
 gkFAtt        chnget    "FAtt"
 gkFDec        chnget    "FDec"
 gkFVel        chnget    "FVel"
 gkFLFOShape   chnget    "FLFOShape"
 gkFLFO        chnget    "FLFO"
 gkFRate       chnget    "FRate"

 kPortTime     linseg    0,0.001,0.1
 gkShapeAmount portk     kShapeAmount,kPortTime
 gkClip        portk     kClip,kPortTime
 gkCutoff      portk     kCutoff,kPortTime    

 gkOctShift    chnget    "OctShift"
 gkOctShift    =         -(gkOctShift-1)

 gkOsc2OnOff   chnget    "Osc2OnOff"
 kSemitones    chnget    "Semitones"
 kCents        chnget    "Cents"
 gkTransRto    =    semitone(kSemitones)*cent(kCents)
 gkPortTime    chnget    "PortTime"
 kF0           chnget    "F0"        
 kF1           chnget    "F1"        
 kF2           chnget    "F2"
 kF3           chnget    "F3"
 kF4           chnget    "F4"
 kF5           chnget    "F5"
 kF6           chnget    "F6"
 kF7           chnget    "F7"
 kF8           chnget    "F8"
 kF9           chnget    "F9"
 kF10          chnget    "F10"
 kF11          chnget    "F11"
 kF12          chnget    "F12"
 kF13          chnget    "F13"
 kF14          chnget    "F14"
 kF15          chnget    "F15"
 kF16          chnget    "F16"
 kF17          chnget    "F17"
 kF18          chnget    "F18"
 kF19          chnget    "F19"
 cngoto changed(kF0,kF1,kF2,kF3,kF4,kF5,kF6,kF7,kF8,kF9,kF10,kF11,kF12,kF13,kF14,kF15,kF16,kF17,kF18,kF19,kWaveformMode,kHarms,kLowest,kPower,kNoiseSize)==1, CREATE_TABLE
 reinit CREATE_TABLE
 CREATE_TABLE:
 if i(kWaveformMode)==1 then
  gisource    ftgen    1,0,131072,9,   1, i(kF0),   90,   \
                 2, i(kF1),   90,   \
                 3, i(kF2),   90,   \
                 4, i(kF3),   90,   \
                 5, i(kF4),   90,   \
                 6, i(kF5),   90,   \
                 7, i(kF6),   90,   \
                 8, i(kF7),   90,   \
                 9, i(kF8),   90,   \
                 10,i(kF9),   90,   \
                 11,i(kF10),  90,   \
                 12,i(kF11),  90,   \
                 13,i(kF12),  90,   \
                 14,i(kF13),  90,   \
                 15,i(kF14),  90,   \
                 16,i(kF15),  90,   \
                 17,i(kF16),  90,   \
                 18,i(kF17),  90,   \
                 19,i(kF18),  90,   \
                 20,i(kF19),  90
 elseif i(kWaveformMode)==2 then
  gisource     ftgen         1,0,131072,11,   i(kHarms), i(kLowest), i(kPower)
 else
  gisource     ftgen         1,0,2^i(kNoiseSize),21,3,1
 endif
 
 gkAAtt        chnget        "AAtt"
 gkADec        chnget        "ADec"
 gkASus        chnget        "ASus"
 gkARel        chnget        "ARel"
 gkAVel        chnget        "AVel"
 gkLevel       chnget        "Level"
endin


instr    2                                ; RESPOND TO MIDI NOTES
 icps          cpsmidi
 inum          notnum
 gkPB          pchbend       0, 2
 /*FILTER ENVELOPE*/
 gkModWhl      ctrl7         1, 1, 0, 127
 gkModWhlT     changed       gkModWhl
 givel         veloc         0,1
 gkVel         init          givel
 gkcps         =             icps
 gicps         init          icps
 if i(gkMonoPoly)==0 then                 ; IF MONO MODE SELECTED...
               event_i       "i",3,0,-1, icps, inum
 else                                     ; OTHERWISE POLYPHONIC MODE HAS BEEN SELECTED
  aL,aR        subinstr      3, icps, inum
               outs          aL,aR
 endif
 
 gkNewNote     init          1
endin


instr    3
 if active:k(2)==0 then                   ; IF ALL INSTANCES OF INSTR 2 HAVE BEEN TURNED OFF...
  turnoff                                 ; TURN OFF THIS INSTRUMENT
 endif
 kPortTime     linseg        0, 0.001, 1

 if i(gkMonoPoly)==0 then
  kcps         lineto2       gkcps, kPortTime * gkPortTime        
 else
  kcps         init          p4
 endif
 
 aosc          phasor        kcps * octave(gkOctShift) * semitone(gkPB)
 
 cngoto gkNewNote==1&&gkSARetrig==1&&i(gkMonoPoly)==0, SHAPE_ENV
 reinit SHAPE_ENV
 SHAPE_ENV:
 kShapeEnv     transeg       0, i(gkSAAtt)+0.000001, 1, i(gkSAEnv),i(gkSADec)+0.000001, -2, 0  ; SHAPE AMOUNT ENVELOPE
 rireturn
 iSAVel        init          (i(gkVel)*i(gkSAVel)) + (1-i(gkSAVel))                               ; SHAPE AMOUNT VELOCITY
 if gkSALFOShape==1 then                                                                ; SHAPE AMOUNT LFO
  kSALFO       oscili        gkSALFO,gkSARate,giUniTri                                          ; TRIANGLE LFO
 else
  kSALFO       rspline       0,gkSALFO,gkSARate,gkSARate*4                                     ; RANDOM LFO
 endif
 
 if gkModWhlT==1 then
               ;cabbageSetValue "ShapeAmount", (gkModWhl/(127*0.5))-1, gkModWhlT
               chnset       (gkModWhl/(127*0.5))-1, "ShapeAmount"
 endif

 
 iSAKybdScal    table        p5+((i(gkKybdScal)*256)-128), giKybdScal            ; SHAPE AMOUNT KEYBOARD SCALING (REDUCING SHAPE AMOUNT FOR HIGHER NOTE CAN REDUCE ALIASING
 kShapeAmount   =            (gkShapeAmount+kShapeEnv+kSALFO)*iSAVel*iSAKybdScal
 ibipolar       =            0                                                   ; UNIPOLAR/BIPOLAR SWITCH (0=UNIPOLAR 1=BIPOLAR)
 ifullscale     =            1                                                   ; FULLSCALE VALUE
 apd            pdhalf       aosc, kShapeAmount, ibipolar, ifullscale            ; PHASE DISTORT THE PHASOR (aosc) CREATED 4 LINES ABOVE
 asig           tablei       apd,gisource,1
 
 if gkOsc2OnOff==1 then
  aosc2         phasor       kcps * octave(gkOctShift) * gkTransRto
  apd2          pdhalf       aosc2, kShapeAmount, ibipolar, ifullscale           ; PHASE DISTORT THE PHASOR (aosc) CREATED 4 LINES ABOVE
  asig          +=           tablei:a(apd2,gisource,1)
 endif
 
 
 ; POWERSHAPE DISTORTION
 ifullscale    =             0dbfs                                               ; DEFINE FULLSCALE AMPLITUDE VALUE
 asig          powershape    asig, gkClip, ifullscale                            ; CREATE POWERSHAPED SIGNAL 
 
 ; FILTER
 if gkFilterOnOff==1 then

  if gkFLFOShape==1 then
   kFLFO       oscili        gkFLFO,gkFRate,giUniTri
  else
   kFLFO       rspline       0,gkFLFO,gkFRate,gkFRate*4
  endif
  cngoto gkNewNote==1&&gkFRetrig==1&&i(gkMonoPoly)==0, FILTER_ENV
  reinit FILTER_ENV
  FILTER_ENV:
  kFiltEnv     transeg       0,i(gkFAtt)+0.000001,2, i(gkFEnv),i(gkFDec)+0.000001,-2,0 
  rireturn
  iFVel        init          (i(gkVel)*i(gkFVel)) + (1-i(gkFVel))
  kCF          limit         kcps*((gkCutoff+kFiltEnv+kFLFO)*iFVel),1,sr/3
               cngoto        changed(gkPoles,gkRipple)==1, FILTER
  reinit FILTER
  FILTER:
  asig         clfilt        asig*8,kCF,0,i(gkPoles),1,i(gkRipple)
 endif
 
 ; AMPLITUDE ENVELOPE
 aEnv         expsegr        0.01,i(gkAAtt)+0.00001,1.01,i(gkADec)+0.00001,i(gkASus)+0.01,i(gkARel)+0.00001,0.01
 aEnv         -=             0.01
 iAVel        init           (i(gkVel)*i(gkAVel)) + (1-i(gkAVel))
 asig         *=             aEnv*iAVel
 
 ; STEREO RIGHT CHANNEL
 aDly        interp          0.5 / kcps                               ; RIGHT CHANNEL WILL BE DELAYED BY 1/2 PERIOD OF THE FUNDEMENTAL                    
 aR          vdelay          asig, aDly*1000, (0.5/cpsmidinn(0))*1000 ; VARIABLE DELAY (NEEDS TO BE VARIABLE FOR MONOPHONIC/LEGATO MODE)
 
 ; OUTPUT
;            outs            asig*gkLevel, aR*gkLevel
 gaL         +=              asig * gkLevel
 gaR         +=              aR * gkLevel
 
 gkNewNote   =               0                                        ; RESET NEW NOTE FLAG
endin

instr    4
 aL          resonr          gaL, 100, 10, 1
 aR          resonr          gaR, 100, 10, 1
             outs            aL + gaL / 4, aR + gaR / 4
             clear           gaL, gaR
endin

</CsInstruments>  

<CsScore>
i 1  0 [3600*24*7]
i 4  0 [3600*24*7]
</CsScore>

</CsoundSynthesizer>