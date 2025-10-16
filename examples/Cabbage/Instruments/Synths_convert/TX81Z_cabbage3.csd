
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; TX81Z.csd
; Iain McCurdy, 2023

; An encapsulation of several FM synthesis opcodes that are based on presets from the Yamaha TX81Z

; They are:
; 1 FM Bell (algorithm 5)
; 2 FM Metal (algorithm 3)
; 3 FM Percussive Flute (algorithm 4)
; 4 FM Rhodes (electric piano) (algorithm 5)
; 5 FM Wurlitzer (electric piano) (algorithm 5)
; 6 FM B3 (drawbar electric organ) (algorithm 4)
; 7 FM Voice

; FM B3 seems to occasionally produce inaccurate notes according to the note played. This seems to be a bug in the opcode.
; Vibrato is not functional with FM Voice

; A lot of features of each sound, in particular envelopes on the amplitudes of each operator (oscillator) 
;  and frequency rations are hidden within the opcode.
; Nonetheless there are plenty of options for sound design.

; Yamaha refers to oscillators in its FM algorithms as 'operators'

; The algorithm pertaining to the selected opcode is shown on the interface as the various opcodes are selected.

; < > Opcode Select
; SEND OPCODE DEFAULTS - sets whether certain aspects of the GUI will be changed along with the opcode selection 
;                         to provide useful defaults.
;                        Mainly waveforms and indexes of modulation

; Reverb (screverb)
; SEND - amount of signal sent into the reverb effect
; SIZE - length of the reverb tail
; DAMP - cutoff frequency of a low-pass filter within the reverb effect

; SUSTAIN    - sustain time for FM Flute only. 
;              this sets the decay/release times of envelopes within the opcode.
;              Setting to maximum (HOLD) will sustain the note for a very long time.
; BEND RANGE - pitch bend range in semitones (control using a connected MIDI keyboard)

; C1 Dial (this is the large dial in the upper sub-panel, it's label changes depending on the opcode selected)
;         This generally controls FM index
; (envelope) - can be turned on or off using the 'ENVELOPE' button
; ATT.  - envelope attack time
; DEC.  - envelope decay time
; SUS.  - envelope sustain level
; REL.  - envelope release time
; (lfo) - can be turned on or off using the 'LFO' button
; DEP   - lfo depth (amplitude, depth)
; RATE  - rate of lfo modulation
; RISE  - rise time of depth
; LFO shape radio buttons selector: SINE, TRI, SQU, SAW, RAMP

; C2 Dial (this is the large dial in the upper sub-panel, it's label changes depending on the opcode selected)
;         This generally acts as a crossfader between the two halves of the 4-opersator algorithm
; (envelope) - can be turned on or off using the 'ENVELOPE' button
; ATT.  - envelope attack time
; DEC.  - envelope decay time
; SUS.  - envelope sustain level
; REL.  - envelope release time
; (lfo) - can be turned on or off using the 'LFO' button
; DEP   - lfo depth (amplitude, depth)
; RATE  - rate of lfo modulation
; RISE  - rise time of depth
; LFO shape radio buttons selector: SINE, TRI, SQU, SAW, RAMP

; WAVEFORM1-4
; These are the waveforms used by the four algorithm operators.
; The first 8 are the ones originally offered on the TX81Z.
; The waveform used by the vibrato function can also be changed.

; VIB.DEPTH  - vibrato depth
; VIB.RATE   - vibrato rate
; OCTAVE     - shift the frequency of all operators in octave steps
; DETUNE     - a stereo detune effect - the two stereo channels are detuned inversely according to this value in cents.
;                left channel detuned by +DETUNE cents 
;                right channel detuned by -DETUNE cents 

; (amplitude envelope)
; ATT.       - attack time
; DEC.       - decay time
; SUS.       - sustain level
; REL.       - release time

; AMP.       - amplitude of the output audio signal

; (check boxes)
; MOD. WHEEL TO FM INDEX - if this is selected, the modulation wheel of a connected MIDI keyboard will also control FM index of modulation
; MOD. WHEEL TO VIBRATO - if this is selected, the modulation wheel of a connected MIDI keyboard will also control FM index of modulation
; VEL. TO FM INDEX - if this is selected, key velocity of a connected MIDI keyboard will also control FM index of modulation (as well as amplitude)
; INVERT INDICES (STEREO) - this inverts the value of the C1 Dial (FM Index) on the right channel creating a stereo effect
;                           the significance of this effect depends on the preset chosen
;                           it is not available with the FM Voice preset
; MONO-LEGATO - switch to a monophonic-legato mode. Portamento time is preset within the code. 

; PRESETS
; A mechanism for saving and recalling presets is included (courtesy of Rory Walsh)

<Cabbage>
[
    {
        "type": "form",
        "colour": {"fill": "$PANEL_COLOUR"},
        "caption": "TX81Z",
        "size": {"width": 1165, "height": 443},
        "pluginId": "RMSy"
    },
    {
        "type": "label",
        "font": {"size": 12},
        "channel": "label_173",
        "bounds": {"left": 50, "top": 72, "width": 230, "height": 13},
        "text": "A   L   G   O   R   I   T   H   M"
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "bounds": {"left": 50, "top": 90, "width": 230, "height": 140},
        "channel": "Alg3",
        "visible": 0,
        "children": [
            {
                "type": "label",
                "font": {"size": 27},
                "channel": "label_174",
                "bounds": {"left": 5, "top": 5, "width": 26, "height": 30},
                "text": "3"
            },
            {
                "type": "image",
                "channel": "image_175",
                "bounds": {"left": 95, "top": 25, "width": 1, "height": 100}
            },
            {
                "type": "image",
                "channel": "image_176",
                "bounds": {"left": 100, "top": 82, "width": 40, "height": 1}
            },
            {
                "type": "image",
                "channel": "image_177",
                "bounds": {"left": 145, "top": 45, "width": 1, "height": 20}
            },
            {
                "type": "image",
                "channel": "image_178",
                "bounds": {"left": 120, "top": 45, "width": 1, "height": 38}
            },
            {
                "type": "image",
                "channel": "image_179",
                "bounds": {"left": 120, "top": 45, "width": 25, "height": 1}
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_180",
                "bounds": {"left": 80, "top": 20, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_181",
                "bounds": {"left": 82, "top": 22, "width": 26, "height": 16},
                "text": "3"
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_182",
                "bounds": {"left": 80, "top": 55, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_183",
                "bounds": {"left": 82, "top": 57, "width": 26, "height": 16},
                "text": "2"
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_184",
                "bounds": {"left": 80, "top": 90, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_185",
                "bounds": {"left": 82, "top": 92, "width": 26, "height": 16},
                "text": "1"
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_186",
                "bounds": {"left": 130, "top": 55, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_187",
                "bounds": {"left": 132, "top": 57, "width": 26, "height": 16},
                "text": "4"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "bounds": {"left": 50, "top": 90, "width": 230, "height": 140},
        "channel": "Alg4",
        "visible": 0,
        "children": [
            {
                "type": "label",
                "font": {"size": 27},
                "channel": "label_188",
                "bounds": {"left": 5, "top": 5, "width": 26, "height": 30},
                "text": "4"
            },
            {
                "type": "image",
                "channel": "image_189",
                "bounds": {"left": 95, "top": 70, "width": 1, "height": 60}
            },
            {
                "type": "image",
                "channel": "image_190",
                "bounds": {"left": 100, "top": 87, "width": 40, "height": 1}
            },
            {
                "type": "image",
                "channel": "image_191",
                "bounds": {"left": 145, "top": 15, "width": 1, "height": 55}
            },
            {
                "type": "image",
                "channel": "image_192",
                "bounds": {"left": 170, "top": 15, "width": 1, "height": 38}
            },
            {
                "type": "image",
                "channel": "image_193",
                "bounds": {"left": 145, "top": 15, "width": 25, "height": 1}
            },
            {
                "type": "image",
                "channel": "image_194",
                "bounds": {"left": 145, "top": 52, "width": 25, "height": 1}
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_195",
                "bounds": {"left": 80, "top": 60, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_196",
                "bounds": {"left": 82, "top": 62, "width": 26, "height": 16},
                "text": "2"
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_197",
                "bounds": {"left": 80, "top": 95, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_198",
                "bounds": {"left": 82, "top": 97, "width": 26, "height": 16},
                "text": "1"
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_199",
                "bounds": {"left": 130, "top": 60, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_200",
                "bounds": {"left": 132, "top": 62, "width": 26, "height": 16},
                "text": "3"
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_201",
                "bounds": {"left": 130, "top": 25, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_202",
                "bounds": {"left": 132, "top": 27, "width": 26, "height": 16},
                "text": "4"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "bounds": {"left": 50, "top": 90, "width": 230, "height": 140},
        "channel": "Alg5",
        "visible": 1,
        "children": [
            {
                "type": "label",
                "font": {"size": 27},
                "channel": "label_203",
                "bounds": {"left": 5, "top": 5, "width": 26, "height": 30},
                "text": "5"
            },
            {
                "type": "image",
                "channel": "image_204",
                "bounds": {"left": 90, "top": 65, "width": 1, "height": 55}
            },
            {
                "type": "image",
                "channel": "image_205",
                "bounds": {"left": 140, "top": 45, "width": 1, "height": 75}
            },
            {
                "type": "image",
                "channel": "image_206",
                "bounds": {"left": 140, "top": 45, "width": 25, "height": 1}
            },
            {
                "type": "image",
                "channel": "image_207",
                "bounds": {"left": 165, "top": 45, "width": 1, "height": 37}
            },
            {
                "type": "image",
                "channel": "image_208",
                "bounds": {"left": 140, "top": 82, "width": 25, "height": 1}
            },
            {
                "type": "image",
                "channel": "image_209",
                "bounds": {"left": 90, "top": 120, "width": 50, "height": 1}
            },
            {
                "type": "image",
                "channel": "image_210",
                "bounds": {"left": 115, "top": 120, "width": 1, "height": 10}
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_211",
                "bounds": {"left": 75, "top": 55, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_212",
                "bounds": {"left": 77, "top": 57, "width": 26, "height": 16},
                "text": "2"
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_213",
                "bounds": {"left": 75, "top": 90, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_214",
                "bounds": {"left": 77, "top": 92, "width": 26, "height": 16},
                "text": "1"
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_215",
                "bounds": {"left": 125, "top": 55, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_216",
                "bounds": {"left": 127, "top": 57, "width": 26, "height": 16},
                "text": "4"
            },
            {
                "type": "image",
                "colour": {"fill": "$PANEL_COLOUR"},
                "channel": "image_217",
                "bounds": {"left": 125, "top": 90, "width": 30, "height": 20}
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_218",
                "bounds": {"left": 127, "top": 92, "width": 26, "height": 16},
                "text": "3"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"background": "black"},
        "corners": 0,
        "channel": "image_219",
        "bounds": {"left": 40, "top": 250, "width": 140, "height": 1}
    },
    {
        "type": "label",
        "colour": {"fill": "$PANEL_COLOUR"},
        "font": {"size": 11},
        "channel": "label_220",
        "bounds": {"left": 88, "top": 244, "width": 45, "height": 12},
        "text": "REVERB"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 9},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 30, "top": 260, "width": 60, "height": 75},
        "channel": "RvbSend",
        "range": {"min": 0, "max": 1, "defaultValue": 0.2, "skew": 1, "increment": 0.001},
        "valueTextBox": 1,
        "text": "SEND"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 9},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 80, "top": 260, "width": 60, "height": 75},
        "channel": "RvbSize",
        "range": {"min": 0.3, "max": 0.99, "defaultValue": 0.8, "skew": 2, "increment": 0.001},
        "valueTextBox": 1,
        "text": "SIZE"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 9},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 130, "top": 260, "width": 60, "height": 75},
        "channel": "RvbDamp",
        "range": {"min": 200, "max": 15000, "defaultValue": 12000, "skew": 0.5, "increment": 1},
        "valueTextBox": 1,
        "text": "DAMP"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 10},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 190, "top": 250, "width": 70, "height": 85},
        "channel": "sus",
        "range": {"min": 0.1, "max": 60, "defaultValue": 4, "skew": 0.5, "increment": 0.001},
        "valueTextBox": 1,
        "text": "SUSTAIN"
    },
    {
        "type": "label",
        "colour": {"fill": "#000000"},
        "font": {"size": 15},
        "bounds": {"left": 198, "top": 319, "width": 50, "height": 17},
        "channel": "susDisp",
        "text": "4"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 10},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 250, "top": 250, "width": 70, "height": 85},
        "channel": "BendRange",
        "range": {"min": 0, "max": 24, "defaultValue": 2, "skew": 1, "increment": 1},
        "valueTextBox": 1,
        "text": "BEND RANGE"
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_221",
        "bounds": {"left": 10, "top": 10, "width": 244, "height": 34},
        "children": [
            {
                "type": "label",
                "colour": {"fill": "#002800"},
                "font": {"colour": "#00ff00", "size": 27},
                "bounds": {"left": 2, "top": 2, "width": 240, "height": 30},
                "text": "01: FM Bell",
                "channel": "Name"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_222",
        "bounds": {"left": 260, "top": 10, "width": 75, "height": 35},
        "children": [
            {
                "type": "label",
                "font": {"colour": "#ffffff", "size": 45},
                "channel": "label_223",
                "bounds": {"left": 9, "top": -12, "width": 35, "height": 50},
                "text": "‹"
            },
            {
                "type": "label",
                "font": {"colour": "#ffffff", "size": 45},
                "channel": "label_224",
                "bounds": {"left": 52, "top": -12, "width": 35, "height": 50},
                "text": "›"
            },
            {
                "type": "button",
                "text": {"on": "", "off": ""},
                "font": {"size": 13},
                "colour": {"on": {"fill": "222222"}, "off": {"fill": "222222"}},
                "corners": 2,
                "bounds": {"left": 0, "top": 0, "width": 35, "height": 35},
                "channel": "Dec"
            },
            {
                "type": "button",
                "text": {"on": "", "off": ""},
                "font": {"size": 13},
                "colour": {"on": {"fill": "222222"}, "off": {"fill": "222222"}},
                "corners": 2,
                "bounds": {"left": 40, "top": 0, "width": 35, "height": 35},
                "channel": "Inc"
            }
        ]
    },
    {
        "type": "checkBox",
        "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
        "defaultValue": 1,
        "bounds": {"left": 10, "top": 55, "width": 200, "height": 12},
        "channel": "SendOpcodeDefaults",
        "text": "SEND OPCODE DEFAULTS"
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_225",
        "bounds": {"left": 845, "top": 10, "width": 310, "height": 320},
        "children": [
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 0, "width": 70, "height": 85},
                "channel": "vdepth",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "VIB.DEPTH"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 0, "width": 70, "height": 85},
                "channel": "vrate",
                "range": {"min": 0, "max": 20, "defaultValue": 5, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "VIB.RATE"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 120, "top": 0, "width": 70, "height": 85},
                "channel": "vrise",
                "range": {"min": 0, "max": 12, "defaultValue": 2, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "VIB.RISE"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 180, "top": 0, "width": 70, "height": 85},
                "channel": "octave",
                "range": {"min": -6, "max": 6, "defaultValue": 0, "skew": 1, "increment": 1},
                "valueTextBox": 1,
                "text": "OCTAVE"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 240, "top": 0, "width": 70, "height": 85},
                "channel": "detune",
                "range": {"min": -20, "max": 20, "defaultValue": 5, "skew": 1, "increment": 0.001},
                "valueTextBox": 1,
                "text": "DETUNE"
            },
            {
                "type": "image",
                "colour": {"background": "black"},
                "corners": 0,
                "channel": "image_226",
                "bounds": {"left": 10, "top": 110, "width": 230, "height": 1}
            },
            {
                "type": "label",
                "colour": {"fill": "$PANEL_COLOUR"},
                "font": {"size": 11},
                "channel": "label_227",
                "bounds": {"left": 65, "top": 104, "width": 125, "height": 12},
                "text": "AMPLITUDE ENVELOPE"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 120, "width": 70, "height": 85},
                "channel": "AAtt",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "ATT."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 120, "width": 70, "height": 85},
                "channel": "ADec",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "DEC."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 120, "top": 120, "width": 70, "height": 85},
                "channel": "ASus",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "SUS."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 180, "top": 120, "width": 70, "height": 85},
                "channel": "ARel",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "REL."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 10},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 240, "top": 120, "width": 70, "height": 85},
                "channel": "Amp",
                "range": {"min": 0, "max": 1, "defaultValue": 0.5, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "AMP."
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 0,
                "bounds": {"left": 15, "top": 225, "width": 200, "height": 12},
                "channel": "ModWhl2Ndx",
                "text": "MOD. WHEEL TO FM INDEX"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 0,
                "bounds": {"left": 15, "top": 245, "width": 200, "height": 12},
                "channel": "ModWhl2Vib",
                "text": "MOD. WHEEL TO VIBRATO"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 1,
                "bounds": {"left": 15, "top": 265, "width": 200, "height": 12},
                "channel": "Vell2Ndx",
                "text": "VELOCITY TO FM INDEX"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 1,
                "bounds": {"left": 15, "top": 285, "width": 200, "height": 12},
                "channel": "InvIndices",
                "text": "INVERT INDICES (STEREO"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 0,
                "bounds": {"left": 15, "top": 305, "width": 200, "height": 12},
                "channel": "MonoLegato",
                "text": "MONO-LEGATO"
            },
            {
                "type": "label",
                "font": {"size": 13},
                "channel": "label_228",
                "bounds": {"left": 220, "top": 228, "width": 60, "height": 14},
                "text": "PRESETS"
            },
            {
                "type": "comboBox",
                "font": {"size": 9},
                "colour": {"fill": "222222"},
                "corners": 2,
                "indexOffset": true,
                "channel": "comboBox_229",
                "bounds": {"left": 220, "top": 243, "width": 60, "height": 20}
            },
            {
                "type": "fileButton",
                "text": {"on": "Save", "off": "Save"},
                "font": {"size": 11},
                "colour": {"on": {"fill": "222222"}, "off": {"fill": "222222"}},
                "corners": 2,
                "channel": "fileButton_230",
                "bounds": {"left": 220, "top": 265, "width": 60, "height": 20}
            },
            {
                "type": "fileButton",
                "text": {"on": "Remove", "off": "Remove"},
                "font": {"size": 11},
                "colour": {"on": {"fill": "222222"}, "off": {"fill": "222222"}},
                "corners": 2,
                "channel": "fileButton_231",
                "bounds": {"left": 220, "top": 287, "width": 60, "height": 20}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_232",
        "bounds": {"left": 340, "top": 5, "width": 490, "height": 110},
        "children": [
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 5, "top": 5, "width": 80, "height": 95},
                "channel": "c1",
                "range": {"min": 0, "max": 1, "defaultValue": 0.1, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "C1"
            },
            {
                "type": "label",
                "colour": {"fill": "$PANEL_COLOUR"},
                "font": {"colour": "#c0c0c0", "size": 11},
                "bounds": {"left": 5, "top": 10, "width": 80, "height": 12},
                "channel": "c1Disp",
                "text": "c1"
            },
            {
                "type": "image",
                "colour": {"background": "black"},
                "corners": 0,
                "channel": "image_233",
                "bounds": {"left": 90, "top": 10, "width": 175, "height": 2}
            },
            {
                "type": "button",
                "text": {"on": "ENVELOPE", "off": "ENVELOPE"},
                "colour": {"on": {"fill": "#0a280a"}, "off": {"fill": "#000a00"}},
                "font": {"colour": {"off": "#326432", "on": "#6eff6e"}, "size": 6},
                "corners": 2,
                "defaultValue": 1,
                "bounds": {"left": 140, "top": 5, "width": 70, "height": 14},
                "channel": "Env1OnOff"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 75, "top": 25, "width": 60, "height": 75},
                "channel": "att1",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "ATT."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 125, "top": 25, "width": 60, "height": 75},
                "channel": "dec1",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "DEC."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 175, "top": 25, "width": 60, "height": 75},
                "channel": "sus1",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "SUS."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 225, "top": 25, "width": 60, "height": 75},
                "channel": "rel1",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "REL."
            },
            {
                "type": "image",
                "colour": {"background": "black"},
                "corners": 0,
                "channel": "image_234",
                "bounds": {"left": 290, "top": 10, "width": 180, "height": 2}
            },
            {
                "type": "button",
                "text": {"on": "LFO", "off": "LFO"},
                "colour": {"on": {"fill": "#0a280a"}, "off": {"fill": "#000a00"}},
                "font": {"colour": {"off": "#326432", "on": "#6eff6e"}, "size": 6},
                "corners": 2,
                "defaultValue": 1,
                "bounds": {"left": 365, "top": 5, "width": 30, "height": 14},
                "channel": "LFO1OnOff"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 275, "top": 25, "width": 60, "height": 75},
                "channel": "dep1",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "DEPTH"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 325, "top": 25, "width": 60, "height": 75},
                "channel": "rat1",
                "range": {"min": 0, "max": 20, "defaultValue": 2, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "RATE"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 375, "top": 25, "width": 60, "height": 75},
                "channel": "ris1",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "RISE"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 1,
                "bounds": {"left": 430, "top": 25, "width": 60, "height": 12},
                "channel": "sw1_1",
                "text": "SINE",
                "radioGroup": 1
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "bounds": {"left": 430, "top": 39, "width": 60, "height": 12},
                "channel": "sw1_2",
                "text": "TRI.",
                "radioGroup": 1
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "bounds": {"left": 430, "top": 53, "width": 60, "height": 12},
                "channel": "sw1_3",
                "text": "SQU.",
                "radioGroup": 1
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "bounds": {"left": 430, "top": 67, "width": 60, "height": 12},
                "channel": "sw1_4",
                "text": "SAW",
                "radioGroup": 1
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "bounds": {"left": 430, "top": 81, "width": 60, "height": 12},
                "channel": "sw1_5",
                "text": "RAMP",
                "radioGroup": 1
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_235",
        "bounds": {"left": 340, "top": 125, "width": 490, "height": 110},
        "children": [
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 5, "top": 5, "width": 80, "height": 95},
                "channel": "c2",
                "range": {"min": 0, "max": 1, "defaultValue": 0.5, "skew": 1, "increment": 0.001},
                "valueTextBox": 1,
                "text": "C2"
            },
            {
                "type": "label",
                "colour": {"fill": "$PANEL_COLOUR"},
                "font": {"colour": "#c0c0c0", "size": 11},
                "bounds": {"left": 5, "top": 10, "width": 80, "height": 12},
                "channel": "c2Disp",
                "text": "c2"
            },
            {
                "type": "image",
                "colour": {"background": "black"},
                "corners": 0,
                "channel": "image_236",
                "bounds": {"left": 90, "top": 10, "width": 175, "height": 2}
            },
            {
                "type": "button",
                "text": {"on": "ENVELOPE", "off": "ENVELOPE"},
                "colour": {"on": {"fill": "#0a280a"}, "off": {"fill": "#000a00"}},
                "font": {"colour": {"off": "#326432", "on": "#6eff6e"}, "size": 6},
                "corners": 2,
                "defaultValue": 1,
                "bounds": {"left": 140, "top": 5, "width": 70, "height": 14},
                "channel": "Env2OnOff"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 75, "top": 25, "width": 60, "height": 75},
                "channel": "att2",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "ATT."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 125, "top": 25, "width": 60, "height": 75},
                "channel": "dec2",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "DEC."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 175, "top": 25, "width": 60, "height": 75},
                "channel": "sus2",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "SUS."
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 225, "top": 25, "width": 60, "height": 75},
                "channel": "rel2",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "REL."
            },
            {
                "type": "image",
                "colour": {"background": "black"},
                "corners": 0,
                "channel": "image_237",
                "bounds": {"left": 290, "top": 10, "width": 180, "height": 2}
            },
            {
                "type": "label",
                "colour": {"fill": "#2d2d2d"},
                "font": {"size": 13},
                "channel": "label_238",
                "bounds": {"left": 365, "top": 5, "width": 30, "height": 14},
                "text": "LFO"
            },
            {
                "type": "button",
                "text": {"on": "LFO", "off": "LFO"},
                "colour": {"on": {"fill": "#0a280a"}, "off": {"fill": "#000a00"}},
                "font": {"colour": {"off": "#326432", "on": "#6eff6e"}, "size": 6},
                "corners": 2,
                "defaultValue": 1,
                "bounds": {"left": 365, "top": 5, "width": 30, "height": 14},
                "channel": "LFO2OnOff"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 275, "top": 25, "width": 60, "height": 75},
                "channel": "dep2",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "DEPTH"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 325, "top": 25, "width": 60, "height": 75},
                "channel": "rat2",
                "range": {"min": 0, "max": 20, "defaultValue": 2, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "RATE"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 9},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 375, "top": 25, "width": 60, "height": 75},
                "channel": "ris2",
                "range": {"min": 0, "max": 8, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "text": "RISE"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 1,
                "bounds": {"left": 430, "top": 25, "width": 60, "height": 12},
                "channel": "sw2_1",
                "text": "SINE",
                "radioGroup": 1
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "bounds": {"left": 430, "top": 39, "width": 60, "height": 12},
                "channel": "sw2_2",
                "text": "TRI.",
                "radioGroup": 1
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "bounds": {"left": 430, "top": 53, "width": 60, "height": 12},
                "channel": "sw2_3",
                "text": "SQU.",
                "radioGroup": 1
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "bounds": {"left": 430, "top": 67, "width": 60, "height": 12},
                "channel": "sw2_4",
                "text": "SAW",
                "radioGroup": 1
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "bounds": {"left": 430, "top": 81, "width": 60, "height": 12},
                "channel": "sw2_5",
                "text": "RAMP",
                "radioGroup": 1
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_239",
        "bounds": {"left": 340, "top": 244, "width": 490, "height": 90},
        "children": [
            {
                "type": "image",
                "colour": {"fill": "#00000000"},
                "channel": "image_240",
                "bounds": {"left": 5, "top": 5, "width": 80, "height": 75}
            },
            {
                "type": "image",
                "colour": {"fill": "#00000000"},
                "channel": "image_241",
                "bounds": {"left": 105, "top": 5, "width": 80, "height": 75}
            },
            {
                "type": "image",
                "colour": {"fill": "#00000000"},
                "channel": "image_242",
                "bounds": {"left": 205, "top": 5, "width": 80, "height": 75}
            },
            {
                "type": "image",
                "colour": {"fill": "#00000000"},
                "channel": "image_243",
                "bounds": {"left": 305, "top": 5, "width": 80, "height": 75}
            },
            {
                "type": "image",
                "colour": {"fill": "#00000000"},
                "channel": "image_244",
                "bounds": {"left": 405, "top": 5, "width": 80, "height": 75}
            }
        ]
    },
    {
        "type": "label",
        "font": {"colour": "#c0c0c0", "size": 11},
        "channel": "label_246",
        "bounds": {"left": 5, "top": 430, "width": 110, "height": 12},
        "text": "Iain McCurdy |2023|"
    },
    {
        "type": "keyboard",
        "channel": "keyboard_245",
        "bounds": {"left": 5, "top": 345, "width": 1155, "height": 85}
    }
]
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps  = 8
nchnls = 2
0dbfs  = 1

; LFO waveforms (values in array are used by lfo opcode)
;                      sine tri sq(uni) saw ramp
giLFO_WFMS[] fillarray 0,   1,  3,      5,  4


iFtLen  =  32768 ; size of all function tables used by fm opcodes

; W1 Sine
giSine    ftgen 1,0,iFtLen,10,1

; W2 twopeaks
;                           pn    str phs  DC
i1  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  270, 1
i2  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  180, 1
i3  ftgen 0,0,iFtLen/4,-19, 0.25, 1,   90, -1
i4  ftgen 0,0,iFtLen/4,-19, 0.25, 1,    0, -1
gitwopeaks ftgen 2,0,ftlen(i1)*4,18, i1,1,0,ftlen(i1)-1, i2,1,ftlen(i1),ftlen(i1)*2-1, i3,1,ftlen(i1)*2,ftlen(i1)*3-1, i4,1,ftlen(i1)*3,ftlen(i1)*4-1

; W3 one hump
gihalfsine  ftgen 0,0,iFtLen/2, 9, 0.5,  1,  0
gionehump ftgen 3,0, iFtLen,18,  gihalfsine,1,0,iFtLen/2-1

; W4 one peak
;                           pn    str phs  DC
i1  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  270, 1
i2  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  180, 1
gionepeak ftgen 4,0,ftlen(i1)*4,18, i1,1,0,ftlen(i1)-1, i2,1,ftlen(i1),ftlen(i1)*2-1

; W5 squashed sine
gisquashedsine ftgen 5,0,iFtLen,18, giSine,1,0,iFtLen/2-1

; W6 squashed twopeaks
gisquashedtwopeaks ftgen 6,0,iFtLen,18, gitwopeaks,1,0,iFtLen*0.5-1

; W7 squashed two humps (fwavblnk)
gisquashedtwohumps ftgen 7,0,iFtLen,18, gihalfsine,1,0,iFtLen*0.25-1, gihalfsine,1,iFtLen*0.25,iFtLen*0.5-1

; W8 squashed two peaks
i1  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  270, 1
i2  ftgen 0,0,iFtLen/4,-19, 0.25, 1,  180, 1
gisquashedtwopeaks ftgen 8,0,iFtLen,  18, i1,1,0,iFtLen*0.125-1, i2,1,iFtLen*0.125,iFtLen*0.25-1, i1,1,iFtLen*0.25,iFtLen*0.375-1, i2,1,iFtLen*0.375,iFtLen*0.5-1


gi2Sine    ftgen  9,0,iFtLen, 9, 2,1,0
gi3Sine    ftgen 10,0,iFtLen, 9, 3,1,0
gi4Sine    ftgen 11,0,iFtLen, 9, 4,1,0
gi5Sine    ftgen 12,0,iFtLen, 9, 5,1,0
gi6Sine    ftgen 13,0,iFtLen, 9, 6,1,0
gi7Sine    ftgen 14,0,iFtLen, 9, 7,1,0
gi8Sine    ftgen 15,0,iFtLen, 9, 8,1,0
gi9Sine    ftgen 16,0,iFtLen, 9, 9,1,0
gi10Sine   ftgen 17,0,iFtLen, 9, 10,1,0
gi11Sine   ftgen 18,0,iFtLen, 9, 11,1,0
gi12Sine   ftgen 19,0,iFtLen, 9, 12,1,0
gi13Sine   ftgen 20,0,iFtLen, 9, 13,1,0
gi14Sine   ftgen 21,0,iFtLen, 9, 14,1,0
gi15Sine   ftgen 22,0,iFtLen, 9, 15,1,0
gi16Sine   ftgen 23,0,iFtLen, 9, 16,1,0

giHarm1    ftgen 24,0,iFtLen, 10, 1,1/2,1/4
giHarm2    ftgen 25,0,iFtLen, 10, 0,1,1/2,1/4
giHarm3    ftgen 26,0,iFtLen, 10, 0,0,1,1/2,1/4
giHarm4    ftgen 27,0,iFtLen, 10, 0,0,1,1/2,1/4

giSquare   ftgen 28, 0, iFtLen, 10, 1, 0, 1/3, 0, 1/5, 0, 1/7, 0, 1/9
giTri      ftgen 29, 0, iFtLen, 10, 1, 0, -1/9, 0, 1/25, 0, -1/49, 0, 1/81

giNoise    ftgen 30, 0, iFtLen, 21, 6, 1

giBlank    ftgen 31, 0, iFtLen, 2, 0

; five display tables
i_   ftgen 101,0,iFtLen, 9, 1,1,0
i_   ftgen 102,0,iFtLen, 9, 1,1,0
i_   ftgen 103,0,iFtLen, 9, 1,1,0
i_   ftgen 104,0,iFtLen, 9, 1,1,0
i_   ftgen 105,0,iFtLen, 9, 1,1,0

initc7 1,1,1 ; mod wheel defaults to max 

instr    1 ; always on

; mono/poly switching
kMonoLegato cabbageGetValue "MonoLegato"
if changed:k(kMonoLegato)==1 then
 reinit RESET
endif
RESET:
massign 0, (1-i(kMonoLegato)+2)
rireturn

; read in modulation wheel
kporttime linseg          0,0.001,1
kModWhl   ctrl7           1,1,0,1
kModWhl   portk           kModWhl, kporttime*0.02

; optional mod wheel to FM index
if cabbageGetValue:k("ModWhl2Ndx")==1 then
         cabbageSetValue "c1",kModWhl,changed:k(kModWhl)
endif

; optional mod wheel to vibrato
if cabbageGetValue:k("ModWhl2Vib")==1 then
         cabbageSetValue "vdepth",kModWhl,changed:k(kModWhl)
endif

gkFN1   cabbageGetValue "FN1"
gkFN2   cabbageGetValue "FN2"
gkFN3   cabbageGetValue "FN3"
gkFN4   cabbageGetValue "FN4"
gkFN5   cabbageGetValue "FN5"

gkAlg   init            1
kDec    cabbageGetValue "Dec"
kInc    cabbageGetValue "Inc"
gkOctave cabbageGetValue "octave"
gkAlg   -=              trigger:k(kDec,0.5,0) 
gkAlg   +=              trigger:k(kInc,0.5,0)
gkAlg   limit            gkAlg, 1, 7      
kSendOpcodeDefaults cabbageGetValue "SendOpcodeDefaults"
if changed:k(gkAlg)==1 then
 if gkAlg==1 then
        cabbageSet      k(1), "Name", "text", "01: FM Bell" ; set name label
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults ; set function tables
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.05),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.5),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Mod Index 1"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Inputs"
        cabbageSet      k(1),"sus","visible",1
        cabbageSet      k(1),"susDisp","visible",1
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",0
        cabbageSet      k(1),"Alg5","visible",1
 elseif gkAlg==2 then
        cabbageSet      k(1), "Name", "text", "02: FM Metal"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(2),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(2),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.3),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.5),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Tot Mod Index"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Mods."
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0
        cabbageSet      k(1),"Alg3","visible",1
        cabbageSet      k(1),"Alg4","visible",0
        cabbageSet      k(1),"Alg5","visible",0
 elseif gkAlg==3 then
        cabbageSet      k(1), "Name", "text", "03: FM Perc Flute"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.05),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.5),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Tot Mod Index"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Mods."
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0        
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",1
        cabbageSet      k(1),"Alg5","visible",0
 elseif gkAlg==4 then
        cabbageSet      k(1), "Name", "text", "04: FM Rhodes"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(7),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.036),kSendOpcodeDefaults
        cabbageSetValue "c2",k(1),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Mod Index 1"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Inputs"
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",0
        cabbageSet      k(1),"Alg5","visible",1
 elseif gkAlg==5 then
        cabbageSet      k(1), "Name", "text", "05: FM Wurly"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(7),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.09),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.125),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Mod Index 1"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Inputs"
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",0
        cabbageSet      k(1),"Alg5","visible",1
 elseif gkAlg==6 then
        cabbageSet      k(1), "Name", "text", "06: FM B3"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.2),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.5),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Tot Mod Index"
        cabbageSet      k(1),"c2Disp","text","Xfade 2 Mods."
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",1
        cabbageSet      k(1),"Alg5","visible",0
 elseif gkAlg==7 then
        cabbageSet      k(1), "Name", "text", "07: FM Voice"
        cabbageSetValue "FN1",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN2",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN3",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN4",k(1),kSendOpcodeDefaults
        cabbageSetValue "FN5",k(1),kSendOpcodeDefaults
        cabbageSetValue "c1",k(0.1),kSendOpcodeDefaults
        cabbageSetValue "c2",k(0.8),kSendOpcodeDefaults
        cabbageSet      k(1),"c1Disp","text","Vowel"
        cabbageSet      k(1),"c2Disp","text","Tilt"
        cabbageSet      k(1),"sus","visible",0
        cabbageSet      k(1),"susDisp","visible",0
        cabbageSet      k(1),"Alg3","visible",0
        cabbageSet      k(1),"Alg4","visible",0
        cabbageSet      k(1),"Alg5","visible",0
 endif
endif

; set changes in display tables
if changed:k(gkFN1)==1 then
 tablecopy 101,gkFN1
 cabbageSet k(1), "table1", "tableNumber", 101
elseif changed:k(gkFN2)==1 then
 tablecopy 102,gkFN2
 cabbageSet k(1), "table2", "tableNumber", 102
elseif changed:k(gkFN3)==1 then
 tablecopy 103,gkFN3
 cabbageSet k(1), "table3", "tableNumber", 103
elseif changed:k(gkFN4)==1 then
 tablecopy 104,gkFN4
 cabbageSet k(1), "table4", "tableNumber", 104
elseif changed:k(gkFN5)==1 then
 tablecopy 105,gkFN5
 cabbageSet k(1), "table5", "tableNumber", 105
endif

; sustain switches to 'hold' when turned to maximum. This is printed to the GUI for confirmation. 
ksus,kT cabbageGetValue "sus"
        cabbageSet      kT,"susDisp","text",sprintfk:S("%5.2f",ksus)
if ksus==60 then
        cabbageSet      kT,"susDisp","text","HOLD"
endif
        cabbageSet      "susDisp","text",sprintfk:S("%5.2f",ksus) ; init-time setting
        
; envelope 1
gkatt1   cabbageGetValue "att1"
gkdec1   cabbageGetValue "dec1"
gksus1   cabbageGetValue "sus1"
gkrel1   cabbageGetValue "rel1"

; envelope 2
gkatt2    cabbageGetValue "att2"
gkdec2    cabbageGetValue "dec2"
gksus2    cabbageGetValue "sus2"
gkrel2    cabbageGetValue "rel2"

; amplitude envelope
gkAAtt    cabbageGetValue "AAtt"
gkADec    cabbageGetValue "ADec"
gkASus    cabbageGetValue "ASus"
gkARel    cabbageGetValue "ARel"

endin




gkcps    init  cpsmidinn(60)
instr    2 ; mono-legato instrument
 icps     cpsmidi
 gkbend   pchbend         0,1
 iVel     ampmidi         1
 gkVel    =               iVel
 gkcps    =        icps
 if active:i(p1+1,0,1)<1 then
  event_i     "i",p1+1,0,3600*24*365
 endif
 if trigger:k(release:k(),0.5,0)==1 && active:k(p1)==1 then
  turnoff2 p1+1,0,1
 endif
endin



instr    3
kporttime linseg 0,0.001,1
; poly/mono pitch calculation
iMonoLegato cabbageGetValue "MonoLegato"
if iMonoLegato==0 then ; poly
 icps     cpsmidi
 kcps     init          icps
 kbend    pchbend       0,1
 iVel     ampmidi       1
else                   ; mono
 kcps     portk          gkcps, kporttime*0.01
 icps     =              i(gkcps)
 kbend    =              gkbend
 iVel     =              i(gkVel)
endif

iVel     pow             iVel, 2
kamp     =               0.3
kc1      cabbageGetValue "c1"
kc2      cabbageGetValue "c2"
kvdepth  cabbageGetValue "vdepth"
kvrate   cabbageGetValue "vrate"
ivrise   cabbageGetValue "vrise"
kvdepth  *=              cosseg:k(0,ivrise+(1/kr),1)

; sustain parameter (FM Bell only)
isus     cabbageGetValue "sus"
isus     =               isus==60 ? 31536000 : isus

; envelope 1
kEnv1OnOff cabbageGetValue "Env1OnOff"
kenv1      cossegr         0, i(gkatt1)+1/kr, 1, i(gkdec1)+1/kr, i(gksus1), i(gkrel1)+0.1, 0
kc1        =               kEnv1OnOff == 1 ? kc1*kenv1 : kc1

; velocity control of FM index
iVell2Ndx  cabbageGetValue  "Vell2Ndx"
kc1        =               iVell2Ndx == 1 ? kc1*iVel : kc1

; lfo 1
kLFO1OnOff cabbageGetValue "LFO1OnOff"
kdep1    cabbageGetValue "dep1"
krat1    cabbageGetValue "rat1"
iris1    cabbageGetValue "ris1"
isw1_1   cabbageGetValue "sw1_1"
isw1_2   cabbageGetValue "sw1_2"
isw1_3   cabbageGetValue "sw1_3"
isw1_4   cabbageGetValue "sw1_4"
isw1_5   cabbageGetValue "sw1_5"
iLFOshp1 =               giLFO_WFMS[isw1_2 + isw1_3*2 + isw1_4*3 + isw1_5*4]
klfo1    lfo             kdep1, krat1, iLFOshp1
klfo1    port            klfo1, 0.0005
kLFOenv1 cosseg          0, iris1+1/kr, 1
kc1      =               kLFO1OnOff == 1 ? kc1*(1 + (klfo1*kLFOenv1) ) : kc1

; envelope 2
kEnv2OnOff cabbageGetValue "Env2OnOff"
kenv2      cossegr         0, i(gkatt2)+1/kr, 1, i(gkdec2)+1/kr, i(gksus2),i(gkrel2)+0.1, 0
kc2        =               kEnv2OnOff == 1 ? kc2*kenv2 : kc2

; lfo 2
kLFO2OnOff    cabbageGetValue "LFO2OnOff"
kdep2    cabbageGetValue "dep2"
krat2    cabbageGetValue "rat2"
iris2    cabbageGetValue "ris2"
isw2_1   cabbageGetValue "sw2_1"
isw2_2   cabbageGetValue "sw2_2"
isw2_3   cabbageGetValue "sw2_3"
isw2_4   cabbageGetValue "sw2_4"
isw2_5   cabbageGetValue "sw2_5"
iLFOshp2 =               giLFO_WFMS[isw2_2 + isw2_3*2 + isw2_4*3 + isw2_5*4]
klfo2    lfo             kdep2, krat2, iLFOshp2
klfo2    port            klfo2, 0.0005
kLFOenv2 cosseg          0, iris2+1/kr, 1
kc2        =             kLFO2OnOff == 1 ? kc2*(1 + (klfo2*kLFOenv2) ) : kc2

ifn1     =               101
ifn2     =               102
ifn3     =               103
ifn4     =               104
ifn5     =               105

; pitch bend
kBendRange cabbageGetValue "BendRange" 
kbend    *=              kBendRange
kporttime linseg          0,0.01,0.05
kbend    portk           kbend, kporttime
kcps2    =               kcps * octave(gkOctave) * semitone(kbend)

; keyboard scaling of index of modulation (c1)
kScale   pow             cpsmidinn(60)/kcps, 0.25
if gkAlg!=7 then ; no kybd scaling with FM Voice
 kc1      *=              kScale
endif

; keyboard scaling of sustain (FM Bell only). Shorter sustain for higher notes. Middle C (C3) is the unison point.
iScale   pow             cpsmidinn(60)/icps, 0.5
isus     *=              iScale

; stereo detune
kDetune  cabbageGetValue "detune"

kInvIndices =  ((1-cabbageGetValue:k("InvIndices"))*2)-1

if gkAlg==1 then
; (algorithm 5. sus.default=4
aL       fmbell          kamp, kcps2*cent(kDetune),  kc1*100, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5, isus
aR       fmbell          kamp, kcps2*cent(-kDetune), kc1*100*kInvIndices, -kc2, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5, isus
elseif gkAlg==2 then
aL       fmmetal         kamp, kcps2*cent(kDetune),  kc1*50, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmmetal         kamp, kcps2*cent(-kDetune), kc1*50*kInvIndices, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
elseif gkAlg==3 then
aL       fmpercfl        kamp, kcps2*cent(kDetune),  kc1*100, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmpercfl        kamp, kcps2*cent(-kDetune), kc1*100*kInvIndices, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
elseif gkAlg==4 then
aL       fmrhode         kamp, kcps2*cent(kDetune),  kc1*300, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmrhode         kamp, kcps2*cent(-kDetune), kc1*300*kInvIndices, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
elseif gkAlg==5 then
aL       fmwurlie        kamp, kcps2*cent(kDetune),  kc1*50, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmwurlie        kamp, kcps2*cent(-kDetune), kc1*50*kInvIndices, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
elseif gkAlg==6 then
aL       fmb3            kamp, kcps2*cent(kDetune),  kc1*13, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmb3            kamp, kcps2*cent(-kDetune), kc1*13*kInvIndices, kc2* 1, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
elseif gkAlg==7 then
aL       fmvoice         kamp, kcps2*cent(kDetune),  kc1*64, kc2*99, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
aR       fmvoice         kamp, kcps2*cent(-kDetune), kc1*64, kc2*99, kvdepth, kvrate, ifn1,   ifn2,   ifn3, ifn4, ifn5 ;, isus
endif

aEnv     expsegr         0.001,0.01,1,0.2,0.001

; amplitude envelope
aAEnv    expsegr         0.001, i(gkAAtt)+1/kr, 1, i(gkADec)+1/kr, i(gkASus)+0.001, i(gkARel)+0.1, 0.001

kAmp     cabbageGetValue "Amp"  

aL       *=              aAEnv*kAmp
aR       *=              aAEnv*kAmp

if iVell2Ndx==1 then
aL       *=              iVel
aR       *=              iVel
endif

         outs            aL, aR

 ; reverb send
         chnmix          aL, "SendL"
         chnmix          aR, "SendR"
endin


instr REVERB
aInL     chnget          "SendL"
aInR     chnget          "SendR"
         chnclear        "SendL"
         chnclear        "SendR"

kRvbSend cabbageGetValue "RvbSend"
kRvbSize cabbageGetValue "RvbSize"
kRvbDamp cabbageGetValue "RvbDamp"

aL,aR    reverbsc        aInL*kRvbSend,aInR*kRvbSend,kRvbSize,kRvbDamp
         outs            aL,aR
endin

</CsInstruments>  

<CsScore>
i 1 0 z
i "REVERB" 0 z
</CsScore>

</CsoundSynthesizer>