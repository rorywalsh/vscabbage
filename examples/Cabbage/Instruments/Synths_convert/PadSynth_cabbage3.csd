
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; PadSynth.csd
; Written by Iain McCurdy, 2015, 2024 (fixed artefacts)

; 'padsynth' is actually a GEN routine that generates a loopable function table exhibiting a dense texture that, 
; when replayed using an oscillator, resembles what is referred to as a 'pad'.
; Changing parameters that influence the padsynth GEN routine ('Table', 'Base Freq', 'Bandwidth', 'Part.Scal.', 
; 'Harm.Str.', 'Table Size' and the 'User Table' sliders) will force the table to be rebuilt, and result in 
; interruptions in the output. In performance it will be better to think of 'padsynth' as creating a fixed complex 
; spectrum which is then processed using techniques of subtractive synthesis.

; Two tables are actually created, one with a reduced number of partials (5 partials). As higher notes are played
; the synthesizer increasing uses this second table in order to avoid the aliasing issues that would occur with using 
; only the first table. 

; Table --    Function table type to be used by padsynth. If 'User Table' is selected the partials are 
;             set manually using the mini vertical sliders. Sliders can also be set by 'drawing' within 
;             the table area using click and drag.
;             A variety of additional 'preset' tables are also offered. If any of these are chosen the 
;             partial sliders and 'Base Freq.' are not available. 'Base Freq.' will be set automatically 
;             to the value corrsponding to the analysed pitch that produced the partial data. Note that 
;             these are single tables that are scaled scaled up or down the entire keyboard from their 
;             point of unison therefore they will sound less like their sources, the further away from 
;             their points of unison they are played.      
; 
; 
; Bandwidth -- effectively controls modulation of the partial frequencies 
;              (amplitude and phase modulation)
;              Increasing this increases the amount a noise component that will be preset in all partials.       
; Base Freq. -- The fundemental of the tone. Too high a value here will result in quantisation artefacts.            
; Part.Scal. -- scales the modulations from partial to partial, raising this beyond 1 will result in increasing     
;               excursive modulations in higher partials - this effect can be likened to adding 'air' into 
;               the pad texture whilst retaining clarity in the lower partials. Experimentation with this 
;               parameter should help in gaining an understanding of its effect.                                     
; Harm.Str.  -- Scales all partial frequencies.
; Table Size -- Size of the table created by padsynth. (Actual size will be 2 ^ 'Table Size'.)
;               Reducing the table size will reduce the load time and the time it takes to recalculate the 
;               table whenever a change is made to 'padsynth's parameters, but if the table becomes too small, 
;               looping will become obvious.                          
; 
; When 'User Table' is selected the amplitudes of the harmonic partials are set using the mini vertical slider bars.


; Amplitude Envelope - ADSR control of amplitude

; Filter Bandwidth - an envelope that controls the bandwidth of a bandpass filter using an envelope - Level 1, Attack, Sustain, Rel.Time, Rel.Time, Rel.Level
;  Position - the centre frequency of the bandpass filter as a partial number, related to fundamental frequency of the note played.
; The cutoff frequency is defined using the 'Pos' slider and defines a ratio above the base frequency. Therefore a value 
; of '3' here will emphasise the 3rd partial of any note when bandwidth is narrowed.

; Reverb - Sean Costello FDN reverb (screverb)
; Send    - wet level
; Size    - room size
; Damping - low pass filter within the reverb

; Highpass/Lowpass - series highpass-lowpass filter. Manually adjustable as well as from the keyboard's modulation wheel

; Legato (portamento)
; Activates monophonic mode with controllable glide time from note to note.
; Shape of the legato glissando can be a straight line or a curve, slowing as it reaches the destination note.
; Bend range for the keyboard's pitch bend wheel is set here.

; Pitch Stack - single notes played on the MIDI keyboard can trigger multiple pitches, equidistantly offset by a user-specified interval. 
; An additional stack separated by intervals can also be accessed.
; Interval    - the interval (in semitones) that separates each note in the stack. Can be postive (a rising stack) or negative (a descending stack).
; Nr. Layers  - number of pitches in the stack. A value of '1' essentially means this feature is disabled.
; Gliss Time  - damping that is applied to changes made to the interval setting.
; Nr. Octaves - number of layers in the additional octave stack. This is a 'parent' stack meaning that the 'child' stack discussed previously will be repeated at octave intervals.

; Layers - controls a number of additional dissonant layers added for each note played. This is a feature that is still under development

; Detune - two padsynth oscillators are present and they can be detuned with respect to one another and their seperation into the left and right channels can also be controller.

; Meter - master gain control and stereo meters  

; MIDI
; Pitch bend modulates the pitch of all note +/- 2 semitones
; Modulation wheel controls ... in parallel to the GUI widget


<Cabbage>
[
    {
        "type": "form",
        "colour": {"fill": "#000000"},
        "caption": "Pad Synth",
        "size": {"width": 1120, "height": 483},
        "pluginId": "PdSy"
    },
    {
        "type": "image",
        "channel": "image_58",
        "bounds": {"left": 5, "top": 5, "width": 470, "height": 130},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_59",
                "bounds": {"left": 5, "top": 4, "width": 490, "height": 15},
                "text": "Main"
            },
            {
                "type": "label",
                "font": {"size": 12},
                "channel": "label_60",
                "bounds": {"left": 5, "top": 28, "width": 100, "height": 13},
                "text": "Table"
            },
            {
                "type": "comboBox",
                "font": {"size": 10},
                "colour": {"fill": "222222"},
                "corners": 2,
                "defaultValue": 1,
                "items": [
                    "User 30",
                    "D.Bass",
                    "Clarinet",
                    "Bass Clarinet",
                    "CB.Clarinet",
                    "Oboe",
                    "Bassoon",
                    "C.Bassoon",
                    "Bass Ahh"
                ],
                "indexOffset": true,
                "bounds": {"left": 5, "top": 42, "width": 100, "height": 22},
                "channel": "Table"
            },
            {
                "type": "label",
                "font": {"size": 12},
                "channel": "label_61",
                "bounds": {"left": 5, "top": 68, "width": 100, "height": 13},
                "text": "Tuning"
            },
            {
                "type": "comboBox",
                "font": {"size": 10},
                "colour": {"fill": "222222"},
                "corners": 2,
                "defaultValue": 1,
                "items": ["Equal", "Just", "Pythagorean", "Quarter Tones"],
                "indexOffset": true,
                "bounds": {"left": 5, "top": 82, "width": 100, "height": 22},
                "channel": "Tuning"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 100, "top": 25, "width": 90, "height": 90},
                "channel": "Base",
                "text": "Base Freq.",
                "range": {"min": 0, "max": 127, "defaultValue": 60, "skew": 1, "increment": 1},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 170, "top": 25, "width": 90, "height": 90},
                "channel": "BW",
                "text": "Bandwidth",
                "range": {"min": 1, "max": 999, "defaultValue": 6, "skew": 0.25, "increment": 0.01},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 240, "top": 25, "width": 90, "height": 90},
                "channel": "PartScal",
                "text": "Part.Scal.",
                "range": {"min": 1, "max": 30, "defaultValue": 1.6, "skew": 0.5, "increment": 0.01},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 310, "top": 25, "width": 90, "height": 90},
                "channel": "HarmStr",
                "text": "Harm.Str.",
                "range": {"min": 0.1, "max": 8, "defaultValue": 1, "skew": 0.5, "increment": 0.01},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 13},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 380, "top": 25, "width": 90, "height": 90},
                "channel": "TabSize",
                "text": "Table Size",
                "range": {"min": 1, "max": 24, "defaultValue": 18, "skew": 1, "increment": 1},
                "valueTextBox": 1,
                "textBox": 1
            }
        ]
    },
    {
        "type": "image",
        "channel": "UserControlSlidersID",
        "bounds": {"left": 480, "top": 5, "width": 635, "height": 130},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_62",
                "bounds": {"left": 4, "top": 5, "width": 635, "height": 15},
                "text": "User Table"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 25, "top": 25, "width": 10, "height": 85},
                "channel": 1,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 50, "top": 25, "width": 10, "height": 85},
                "channel": 2,
                "range": {"min": 0, "max": 1, "defaultValue": 0.1, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 75, "top": 25, "width": 10, "height": 85},
                "channel": 3,
                "range": {"min": 0, "max": 1, "defaultValue": 0.2, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 100, "top": 25, "width": 10, "height": 85},
                "channel": 4,
                "range": {"min": 0, "max": 1, "defaultValue": 0.1, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 125, "top": 25, "width": 10, "height": 85},
                "channel": 5,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 150, "top": 25, "width": 10, "height": 85},
                "channel": 6,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 175, "top": 25, "width": 10, "height": 85},
                "channel": 7,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 200, "top": 25, "width": 10, "height": 85},
                "channel": 8,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 225, "top": 25, "width": 10, "height": 85},
                "channel": 9,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 250, "top": 25, "width": 10, "height": 85},
                "channel": 10,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 275, "top": 25, "width": 10, "height": 85},
                "channel": 11,
                "range": {"min": 0, "max": 1, "defaultValue": 0.1, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 300, "top": 25, "width": 10, "height": 85},
                "channel": 12,
                "range": {"min": 0, "max": 1, "defaultValue": 0.2, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 325, "top": 25, "width": 10, "height": 85},
                "channel": 13,
                "range": {"min": 0, "max": 1, "defaultValue": 0.4, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 350, "top": 25, "width": 10, "height": 85},
                "channel": 14,
                "range": {"min": 0, "max": 1, "defaultValue": 0.5, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 375, "top": 25, "width": 10, "height": 85},
                "channel": 15,
                "range": {"min": 0, "max": 1, "defaultValue": 0.7, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 400, "top": 25, "width": 10, "height": 85},
                "channel": 16,
                "range": {"min": 0, "max": 1, "defaultValue": 0.9, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 425, "top": 25, "width": 10, "height": 85},
                "channel": 17,
                "range": {"min": 0, "max": 1, "defaultValue": 0.5, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 450, "top": 25, "width": 10, "height": 85},
                "channel": 18,
                "range": {"min": 0, "max": 1, "defaultValue": 0.2, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 475, "top": 25, "width": 10, "height": 85},
                "channel": 19,
                "range": {"min": 0, "max": 1, "defaultValue": 0.001, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 500, "top": 25, "width": 10, "height": 85},
                "channel": 20,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 525, "top": 25, "width": 10, "height": 85},
                "channel": 21,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 550, "top": 25, "width": 10, "height": 85},
                "channel": 22,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 575, "top": 25, "width": 10, "height": 85},
                "channel": 23,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 600, "top": 25, "width": 10, "height": 85},
                "channel": 24,
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "visible": 0
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider1",
                "bounds": {"left": 20, "top": 25, "width": 20, "height": 1}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider2",
                "bounds": {"left": 40, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider3",
                "bounds": {"left": 60, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider4",
                "bounds": {"left": 80, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider5",
                "bounds": {"left": 100, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider6",
                "bounds": {"left": 120, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider7",
                "bounds": {"left": 140, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider8",
                "bounds": {"left": 160, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider9",
                "bounds": {"left": 180, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider10",
                "bounds": {"left": 200, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider11",
                "bounds": {"left": 220, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider12",
                "bounds": {"left": 240, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider13",
                "bounds": {"left": 260, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider14",
                "bounds": {"left": 280, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider15",
                "bounds": {"left": 300, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider16",
                "bounds": {"left": 320, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider17",
                "bounds": {"left": 340, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider18",
                "bounds": {"left": 360, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider19",
                "bounds": {"left": 380, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider20",
                "bounds": {"left": 400, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider21",
                "bounds": {"left": 420, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider22",
                "bounds": {"left": 440, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider23",
                "bounds": {"left": 460, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider24",
                "bounds": {"left": 480, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider25",
                "bounds": {"left": 500, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider26",
                "bounds": {"left": 520, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider27",
                "bounds": {"left": 540, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider28",
                "bounds": {"left": 560, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider29",
                "bounds": {"left": 580, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "image",
                "colour": {"fill": "#c0c0c0"},
                "channel": "Slider30",
                "bounds": {"left": 600, "top": 25, "width": 20, "height": 0}
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_63",
                "bounds": {"left": 20, "top": 106, "width": 20, "height": 11},
                "text": "1"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_64",
                "bounds": {"left": 40, "top": 106, "width": 20, "height": 11},
                "text": "2"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_65",
                "bounds": {"left": 60, "top": 106, "width": 20, "height": 11},
                "text": "3"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_66",
                "bounds": {"left": 80, "top": 106, "width": 20, "height": 11},
                "text": "4"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_67",
                "bounds": {"left": 100, "top": 106, "width": 20, "height": 11},
                "text": "5"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_68",
                "bounds": {"left": 120, "top": 106, "width": 20, "height": 11},
                "text": "6"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_69",
                "bounds": {"left": 140, "top": 106, "width": 20, "height": 11},
                "text": "7"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_70",
                "bounds": {"left": 160, "top": 106, "width": 20, "height": 11},
                "text": "8"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_71",
                "bounds": {"left": 180, "top": 106, "width": 20, "height": 11},
                "text": "9"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_72",
                "bounds": {"left": 200, "top": 106, "width": 20, "height": 11},
                "text": "10"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_73",
                "bounds": {"left": 220, "top": 106, "width": 20, "height": 11},
                "text": "11"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_74",
                "bounds": {"left": 240, "top": 106, "width": 20, "height": 11},
                "text": "12"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_75",
                "bounds": {"left": 260, "top": 106, "width": 20, "height": 11},
                "text": "13"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_76",
                "bounds": {"left": 280, "top": 106, "width": 20, "height": 11},
                "text": "14"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_77",
                "bounds": {"left": 300, "top": 106, "width": 20, "height": 11},
                "text": "15"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_78",
                "bounds": {"left": 320, "top": 106, "width": 20, "height": 11},
                "text": "16"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_79",
                "bounds": {"left": 340, "top": 106, "width": 20, "height": 11},
                "text": "17"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_80",
                "bounds": {"left": 360, "top": 106, "width": 20, "height": 11},
                "text": "18"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_81",
                "bounds": {"left": 380, "top": 106, "width": 20, "height": 11},
                "text": "19"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_82",
                "bounds": {"left": 400, "top": 106, "width": 20, "height": 11},
                "text": "20"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_83",
                "bounds": {"left": 420, "top": 106, "width": 20, "height": 11},
                "text": "21"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_84",
                "bounds": {"left": 440, "top": 106, "width": 20, "height": 11},
                "text": "22"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_85",
                "bounds": {"left": 460, "top": 106, "width": 20, "height": 11},
                "text": "23"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_86",
                "bounds": {"left": 480, "top": 106, "width": 20, "height": 11},
                "text": "24"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_87",
                "bounds": {"left": 500, "top": 106, "width": 20, "height": 11},
                "text": "25"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_88",
                "bounds": {"left": 520, "top": 106, "width": 20, "height": 11},
                "text": "26"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_89",
                "bounds": {"left": 540, "top": 106, "width": 20, "height": 11},
                "text": "27"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_90",
                "bounds": {"left": 560, "top": 106, "width": 20, "height": 11},
                "text": "28"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_91",
                "bounds": {"left": 580, "top": 106, "width": 20, "height": 11},
                "text": "29"
            },
            {
                "type": "label",
                "font": {"size": 11},
                "channel": "label_92",
                "bounds": {"left": 600, "top": 106, "width": 20, "height": 11},
                "text": "30"
            },
            {
                "type": "label",
                "colour": {"fill": "#00000000"},
                "font": {"colour": "#ffffff", "size": 14},
                "channel": "instructions",
                "bounds": {"left": 0, "top": 40, "width": 635, "height": 15},
                "text": "Click and Drag Here..."
            }
        ]
    },
    {
        "type": "image",
        "channel": "image_93",
        "bounds": {"left": 5, "top": 140, "width": 260, "height": 120},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_94",
                "bounds": {"left": 0, "top": 4, "width": 260, "height": 15},
                "text": "Amplitude Envelope"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 30, "width": 80, "height": 80},
                "channel": "AAtt",
                "text": "Attack",
                "range": {"min": 0.001, "max": 5, "defaultValue": 0.5, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 30, "width": 80, "height": 80},
                "channel": "ADec",
                "text": "Decay",
                "range": {"min": 0.001, "max": 5, "defaultValue": 0.01, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 120, "top": 30, "width": 80, "height": 80},
                "channel": "ASus",
                "text": "Sustain",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 180, "top": 30, "width": 80, "height": 80},
                "channel": "ARel",
                "text": "Release",
                "range": {"min": 0.001, "max": 5, "defaultValue": 0.5, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            }
        ]
    },
    {
        "type": "image",
        "channel": "image_95",
        "bounds": {"left": 270, "top": 140, "width": 380, "height": 120},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_96",
                "bounds": {"left": 0, "top": 4, "width": 380, "height": 15},
                "text": "Filter Bandwidth"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 1,
                "bounds": {"left": 10, "top": 10, "width": 80, "height": 12},
                "channel": "FOnOff",
                "text": "On/Off"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 30, "width": 80, "height": 80},
                "channel": "FL1",
                "text": "Level 1",
                "range": {"min": 0.001, "max": 9.999, "defaultValue": 9.999, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 30, "width": 80, "height": 80},
                "channel": "FT1",
                "text": "Attack",
                "range": {"min": 0.001, "max": 8, "defaultValue": 3, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 120, "top": 30, "width": 80, "height": 80},
                "channel": "FSus",
                "text": "Sustain",
                "range": {"min": 0.001, "max": 9.999, "defaultValue": 1.5, "skew": 0.5, "increment": 0.01},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 180, "top": 30, "width": 80, "height": 80},
                "channel": "FRelTim",
                "text": "Rel.Time",
                "range": {"min": 0.001, "max": 8, "defaultValue": 0.25, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 240, "top": 30, "width": 80, "height": 80},
                "channel": "FRelLev",
                "text": "Rel.Level",
                "range": {"min": 0.001, "max": 9.999, "defaultValue": 0.1, "skew": 0.5, "increment": 0.01},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 300, "top": 30, "width": 80, "height": 80},
                "channel": "FPos",
                "text": "Position",
                "range": {"min": 1, "max": 24, "defaultValue": 3, "skew": 1, "increment": 1},
                "valueTextBox": 1,
                "textBox": 1
            }
        ]
    },
    {
        "type": "image",
        "channel": "image_97",
        "bounds": {"left": 655, "top": 140, "width": 200, "height": 120},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_98",
                "bounds": {"left": 0, "top": 4, "width": 200, "height": 15},
                "text": "Reverb"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 30, "width": 80, "height": 80},
                "channel": "RSend",
                "text": "Send",
                "range": {"min": 0, "max": 1, "defaultValue": 0.5, "skew": 1, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 30, "width": 80, "height": 80},
                "channel": "RSize",
                "text": "Size",
                "range": {"min": 0, "max": 0.99, "defaultValue": 0.85, "skew": 1, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 120, "top": 30, "width": 80, "height": 80},
                "channel": "R__CF",
                "text": "Damping",
                "range": {"min": 20, "max": 20000, "defaultValue": 8000, "skew": 0.5, "increment": 1},
                "valueTextBox": 1,
                "textBox": 1
            }
        ]
    },
    {
        "type": "image",
        "channel": "image_99",
        "bounds": {"left": 860, "top": 140, "width": 255, "height": 120},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_100",
                "bounds": {"left": 0, "top": 4, "width": 255, "height": 15},
                "text": "Highpass/Lowpass"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 1,
                "bounds": {"left": 10, "top": 40, "width": 80, "height": 12},
                "channel": "HPFLPFOnOff",
                "text": "On/Off"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 0,
                "bounds": {"left": 10, "top": 60, "width": 80, "height": 12},
                "channel": "ModWhl",
                "text": "Mod.Wheel"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 90, "top": 30, "width": 80, "height": 80},
                "channel": "HPFFreq",
                "text": "HPF Freq",
                "range": {"min": 4, "max": 14, "defaultValue": 4, "skew": 1, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 165, "top": 30, "width": 80, "height": 80},
                "channel": "LPFFreq",
                "text": "LPF Freq",
                "range": {"min": 4, "max": 14, "defaultValue": 14, "skew": 1, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            }
        ]
    },
    {
        "type": "image",
        "channel": "image_101",
        "bounds": {"left": 5, "top": 265, "width": 230, "height": 120},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_102",
                "bounds": {"left": 0, "top": 4, "width": 230, "height": 15},
                "text": "Legato"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 0,
                "bounds": {"left": 10, "top": 10, "width": 60, "height": 12},
                "channel": "LegatoOnOff",
                "text": "On/Off"
            },
            {
                "type": "comboBox",
                "font": {"size": 10},
                "colour": {"fill": "222222"},
                "corners": 2,
                "defaultValue": 1,
                "items": ["Line", "Curve"],
                "indexOffset": true,
                "bounds": {"left": 10, "top": 50, "width": 60, "height": 22},
                "channel": "LegType"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 70, "top": 30, "width": 80, "height": 80},
                "channel": "LegTime",
                "text": "Legato Time",
                "range": {"min": 0, "max": 3, "defaultValue": 0.2, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 140, "top": 30, "width": 80, "height": 80},
                "channel": "PBRange",
                "text": "Bend Range",
                "range": {"min": 0, "max": 48, "defaultValue": 2, "skew": 1, "increment": 1},
                "valueTextBox": 1,
                "textBox": 1
            }
        ]
    },
    {
        "type": "image",
        "channel": "image_103",
        "bounds": {"left": 240, "top": 265, "width": 290, "height": 120},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_104",
                "bounds": {"left": 0, "top": 4, "width": 290, "height": 15},
                "text": "Pitch Stack"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 30, "width": 80, "height": 80},
                "channel": "Interval",
                "range": {"min": -24, "max": 24, "defaultValue": 5, "skew": 1, "increment": 0.1},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Interval"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 70, "top": 30, "width": 80, "height": 80},
                "channel": "Layers",
                "range": {"min": 1, "max": 20, "defaultValue": 1, "skew": 1, "increment": 1},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Nr. Layers"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 140, "top": 30, "width": 80, "height": 80},
                "channel": "GTime",
                "range": {"min": 0, "max": 5, "defaultValue": 0.1, "skew": 1, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Gliss Time"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 210, "top": 30, "width": 80, "height": 80},
                "channel": "Octaves",
                "range": {"min": 1, "max": 8, "defaultValue": 1, "skew": 1, "increment": 1},
                "valueTextBox": 1,
                "textBox": 1,
                "text": "Nr. Octaves"
            }
        ]
    },
    {
        "type": "image",
        "channel": "image_105",
        "bounds": {"left": 535, "top": 265, "width": 150, "height": 120},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_106",
                "bounds": {"left": 0, "top": 4, "width": 150, "height": 15},
                "text": "Detune"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 30, "width": 80, "height": 80},
                "channel": "DetuneInterval",
                "text": "Interval",
                "range": {"min": -100, "max": 100, "defaultValue": 10, "skew": 1, "increment": 1},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 70, "top": 30, "width": 80, "height": 80},
                "channel": "DetuneWidth",
                "text": "Width",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 1, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            }
        ]
    },
    {
        "type": "image",
        "channel": "ExciterID",
        "bounds": {"left": 690, "top": 265, "width": 150, "height": 120},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_107",
                "bounds": {"left": 0, "top": 4, "width": 150, "height": 15},
                "text": "Exciter"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 0, "top": 30, "width": 80, "height": 80},
                "channel": "ExciterAmount",
                "text": "Amount",
                "range": {"min": 0, "max": 100, "defaultValue": 0, "skew": 1, "increment": 0.1},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 70, "top": 30, "width": 80, "height": 80},
                "channel": "ExciterFreq",
                "text": "Freq.",
                "range": {"min": 1000, "max": 10000, "defaultValue": 3000, "skew": 1, "increment": 1},
                "valueTextBox": 1,
                "textBox": 1
            }
        ]
    },
    {
        "type": "image",
        "channel": "image_108",
        "bounds": {"left": 845, "top": 265, "width": 270, "height": 120},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_109",
                "bounds": {"left": 0, "top": 4, "width": 270, "height": 15},
                "text": "Meter"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 60, "top": 30, "width": 80, "height": 80},
                "channel": "AGain",
                "text": "Gain",
                "range": {"min": 0, "max": 5, "defaultValue": 0.3, "skew": 0.5, "increment": 0.001},
                "valueTextBox": 1,
                "textBox": 1
            },
            {
                "type": "vmeter",
                "defaultValue": 0,
                "bounds": {"left": 160, "top": 30, "width": 15, "height": 65},
                "channel": "vMeter1"
            },
            {
                "type": "vmeter",
                "defaultValue": 0,
                "bounds": {"left": 180, "top": 30, "width": 15, "height": 65},
                "channel": "vMeter2"
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_110",
                "bounds": {"left": 160, "top": 96, "width": 15, "height": 15},
                "text": "L"
            },
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_111",
                "bounds": {"left": 180, "top": 96, "width": 15, "height": 15},
                "text": "R"
            }
        ]
    },
    {
        "type": "label",
        "font": {"colour": "#c0c0c0", "size": 11},
        "channel": "label_113",
        "bounds": {"left": 5, "top": 470, "width": 110, "height": 12},
        "text": "Iain McCurdy |2015|"
    },
    {
        "type": "keyboard",
        "channel": "keyboard_112",
        "bounds": {"left": 5, "top": 390, "width": 1110, "height": 80}
    }
]
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-dm0 -n -+rtmidi=NULL -M0
</CsOptions>

<CsInstruments>

; sr set by host
ksmps              =                   32
nchnls             =                   2
0dbfs              =                   1

                   massign             0,3                                   ; DIRECT ALL MIDI EVENTS TO INSTRUMENT 3
giFade             ftgen               0,0,128,-7,0,60,0,36,1,128-60-36,1    ; KEY-FOLLOWING MAP DEFINING FADES BETWEEN TWO TABLES USED TO PREVENT ALIASING

giequal            ftgen               201,           0,        64,        -2,          12,         2,     cpsmidinn(60),        60,                       1, 1.059463,1.1224619,1.1892069,1.2599207,1.33483924,1.414213,1.4983063,1.5874001,1.6817917,1.7817962, 1.8877471,     2    ;STANDARD
gijust             ftgen               202,           0,        64,        -2,          12,         2,     cpsmidinn(60),        60,                       1,   16/15,    9/8,     6/5,      5/4,       4/3,     45/32,     3/2,     8/5,      5/3,       9/5,     15/8,     2        ;RATIOS FOR JUST INTONATION
gipyth             ftgen               203,           0,        64,        -2,          12,         2,     cpsmidinn(60),        60,                       1,  256/243,   9/8,    32/27,    81/64,      4/3,    729/512,    3/2,    128/81,   27/16,     16/9,     243/128,  2        ;RATIOS FOR PYTHAGOREAN TUNING
giquat             ftgen               204,           0,        64,        -2,          24,         2,     cpsmidinn(60),        60,                       1, 1.0293022,1.059463,1.0905076,1.1224619,1.1553525,1.1892069,1.2240532,1.2599207,1.2968391,1.33483924,1.3739531,1.414213,1.4556525,1.4983063, 1.54221, 1.5874001, 1.6339145,1.6817917,1.73107,  1.7817962,1.8340067,1.8877471,1.9430623,    2    ;QUARTER TONES

gaRvbL,gaRvbR      init                0                ; GLOBAL AUDIO VARIABLE USED TO MIX AND SEND SIGNAL TO THE REVERB INSTRUMENT

; INITIALISE TABLE
gk1,gk2,gk3,gk4,gk5,gk6,gk7,gk8,gk9,gk10,gk11,gk12,gk13,gk14,gk15,gk16,gk17,gk18,gk19,gk20,gk21,gk22,gk23,gk24,gk25,gk26,gk27,gk28,gk29,gk30    init    0
gkBW               init                6
gkPartScal         init                1.6
gkTabSize          init                18
gkBase             init                cpsmidinn(60)
gkHarmStr          init                1
gkTable            init                1
giTable            ftgen               1, 0, 2^i(gkTabSize), "padsynth", i(gkBase), i(gkBW), i(gkPartScal), i(gkHarmStr), 1, 1, 0.00001+(i(gk1)*0.99999),i(gk2),i(gk3),i(gk4),i(gk5),i(gk6),i(gk7),i(gk8),i(gk9),i(gk10),i(gk11),i(gk12),i(gk13),i(gk14),i(gk15),i(gk16),i(gk17),i(gk18),i(gk19),i(gk20),i(gk21),i(gk22),i(gk23),i(gk24),i(gk25),i(gk26),i(gk27),i(gk28),i(gk29),i(gk30)
giTable2           ftgen               2, 0, 2^i(gkTabSize), "padsynth", i(gkBase), i(gkBW), i(gkPartScal), i(gkHarmStr), 1, 1, 0.00001+(i(gk1)*0.99999),i(gk2),i(gk3),i(gk4),i(gk5)


instr    1    ; Always on. Reads widgets.
 kPortTime         linseg              0,0.01,0.1
 
 gkModWhl          ctrl7               1, 1, 0, 127
 gkModWhlT         changed             gkModWhl
 if gkModWhlT==1 then
                   chnset              (gkModWhl/(127*0.1))+4, "LPFFreq"
 endif

 gkLegatoOnOff     chnget              "LegatoOnOff"
 gkLegType         chnget              "LegType"
 gkLegTime         chnget              "LegTime"
 gkPBRange         chnget              "PBRange"

 gkHPFLPFOnOff     chnget              "HPFLPFOnOff"
 gkHPFFreq         chnget              "HPFFreq"
 gkLPFFreq         chnget              "LPFFreq"
 kModWhl           chnget              "ModWhl"
 if kModWhl==1 then
  iHPF             ftgen               0,0,128,-7,4,32,4,96,14
  iLPF             ftgen               0,0,128,-7,4,96,14,32,14
  k1               ctrl7               1,1,0,1
                   chnset              table(k1,iHPF,1), "HPFFreq"
                   chnset              table(k1,iLPF,1), "LPFFreq"
 endif
 gkHPFFreq         portk               cpsoct(gkHPFFreq), kPortTime
 gkLPFFreq         portk               cpsoct(gkLPFFreq), kPortTime
 gaLPFFreq         interp              gkLPFFreq
 
 gkDetuneInterval  chnget              "DetuneInterval"
 gkDetuneWidth     chnget              "DetuneWidth" 

 gkExciterAmount   chnget              "ExciterAmount"    
 if trigger:k(gkExciterAmount,0.1,2)==1 then
                   reinit              UPDATE_EXCITER
 endif 
 UPDATE_EXCITER:
 if i(gkExciterAmount)>0 then
                   cabbageSet k(1), "ExciterID", "alpha", 1
 else
                   cabbageSet k(1), "ExciterID", "alpha", .5
 endif
 gkExciterFreq     chnget              "ExciterFreq"
 rireturn
  
 kMOUSE_X          chnget              "MOUSE_X"                ; READ IN MOUSE X POSITION ON A RESERVED CABBAGE CHANNEL
 kMOUSE_Y          chnget              "MOUSE_Y"                ; READ IN MOUSE Y POSITION ON A RESERVED CABBAGE CHANNEL
 kMOUSE_DOWN_LEFT  chnget              "MOUSE_DOWN_LEFT"        ; LEFT CLICK STATUS (ONLY ALLOWING A REINIT WHEN THE MOUSE BUTTON IS RELEASED SMOOTHS INTERACTION) 
 
 if kMOUSE_DOWN_LEFT==1 then                                    ; IF LEFT CLICK BUTTON IS HELD...
 
 #define    SLIDER(X1'WIDTH'COUNT)
 #
  if kMOUSE_X>$X1 && kMOUSE_X<$X1+$WIDTH && kMOUSE_Y>10 && kMOUSE_Y<120 then                   ; IF MOUSE LIES WITHIN BOUNDARYS OF SLIDER (IMAGE WIDGET)...
   kLen            limit               105 - kMOUSE_Y,0,80                                     ; LENGTH OF SLIDER IN PIXELS. 
               ; N.B. MOUSE CAN STILL STRAY BEYOND LIMITS OF THE WIDGET SLIGHTLY WITH THE VALUE OUTPUT WILL STILL BE LIMITED TO BE HELD WITHIN RANGE
   if changed(kLen)==1 then                                                     ; IF MOUSE HAS MOVED WITHIN WIDGET AREA
    Sstr           sprintfk            "bounds(%d,%d,%d,%d)",$X1-480,25+(80-kLen),$WIDTH,kLen  ; NEW STRING FOR SLIDER POSITION
                   chnset              Sstr,"Slider$COUNT"                                     ; SEND 'BOUNDS' MESSAGE TO WIDGET
    k$COUNT        =                   (kLen/80)^1.5                                           ; CREATE THE ACTUAL VALUE OF THE SLIDER (RANGE 0 - 1)
   endif
  endif
#
 $SLIDER(500'20'1)
 $SLIDER(520'20'2)
 $SLIDER(540'20'3)
 $SLIDER(560'20'4)
 $SLIDER(580'20'5)
 $SLIDER(600'20'6)
 $SLIDER(620'20'7)
 $SLIDER(640'20'8)
 $SLIDER(660'20'9)
 $SLIDER(680'20'10)
 $SLIDER(700'20'11)
 $SLIDER(720'20'12)
 $SLIDER(740'20'13)
 $SLIDER(760'20'14)
 $SLIDER(780'20'15)
 $SLIDER(800'20'16)
 $SLIDER(820'20'17)
 $SLIDER(840'20'18)
 $SLIDER(860'20'19)
 $SLIDER(880'20'20)
 $SLIDER(900'20'21)
 $SLIDER(920'20'22)
 $SLIDER(940'20'23)
 $SLIDER(960'20'24)
 $SLIDER(980'20'25)
 $SLIDER(1000'20'26)
 $SLIDER(1020'20'27)
 $SLIDER(1040'20'28)
 $SLIDER(1060'20'29)
 $SLIDER(1080'20'30)

endif
 gkTable           chnget              "Table"
 gkTuning          chnget              "Tuning"
 if timeinstk()==1 then
  kMOUSE_DOWN_LEFT =                   1
 endif
 if trigger(kMOUSE_DOWN_LEFT,0.5,1)==1 then
  gkBase           chnget              "Base"
  gkBW             chnget              "BW"
  gkPartScal       chnget              "PartScal"
  gkHarmStr        chnget              "HarmStr"
  gkTabSize        chnget              "TabSize"
  
  gk1              =                   k1    
  gk2              =                   k2    
  gk3              =                   k3
  gk4              =                   k4
  gk5              =                   k5
  gk6              =                   k6
  gk7              =                   k7
  gk8              =                   k8
  gk9              =                   k9
  gk10             =                   k10
  gk11             =                   k11
  gk12             =                   k12
  gk13             =                   k13
  gk14             =                   k14
  gk15             =                   k15
  gk16             =                   k16
  gk17             =                   k17
  gk18             =                   k18
  gk19             =                   k19
  gk20             =                   k20
  gk21             =                   k21
  gk22             =                   k22
  gk23             =                   k23
  gk24             =                   k24
  gk25             =                   k25
  gk26             =                   k26
  gk27             =                   k27
  gk28             =                   k28
  gk29             =                   k29
  gk30             =                   k30
 endif

 gkAAtt            chnget              "AAtt"
 gkADec            chnget              "ADec"    
 gkASus            chnget              "ASus"    
 gkARel            chnget              "ARel"    
 gkAGain           chnget              "AGain"

 gkFOnOff          chnget              "FOnOff"
 gkFL1             chnget              "FL1"
 gkFT1             chnget              "FT1"
 gkFSus            chnget              "FSus"
 gkFRelTim         chnget              "FRelTim"
 gkFRelLev         chnget              "FRelLev"
 gkFPos            chnget              "FPos"

 gkRSend           chnget              "RSend"
 gkRSize           chnget              "RSize"
 gkR__CF           chnget              "R__CF"

 if changed(gkTable)==1 then
  kVisible         =                   gkTable==1?1:0
                   cabbageSet "Base", "visible", kVisible ; BaseID -> Base
                   cabbageSet k(1), Smsg, "UserControlSlidersID"
 endif
endin

instr    2    ; Always on. Updates PadSynth table when relevant widgets are changed.
 ktrig    changed    gkBase,gkBW,gkPartScal,gkHarmStr,gkTabSize,gkTable,gk1,gk2,gk3,gk4,gk5,gk6,gk7,gk8,gk9,gk10,gk11,gk12,gk13,gk14,gk15,gk16,gk17,gk18,gk19,gk20,gk21,gk22,gk23,gk24,gk25,gk26,gk27,gk28,gk29,gk30 
 if ktrig==1 then
                   reinit              UpdateTable
 endif
 UpdateTable:
 giBW  = i(gkBW)
 giPartScal        =                   i(gkPartScal)
 giTabLen          =                   2^i(gkTabSize)    ; IF THIS IS TOO SMALL, LOOPING OF THE SPECTRUM WILL BECOME AUDIBLE
 ;                                                                                        FIRST TWO VALUES FOR hampl NEED TO BE '1'.
 if i(gkTable)==1 then
  giBase           =                   i(gkBase)
  giTable          ftgen               1, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.00001+(i(gk1)*0.99999),i(gk2),i(gk3),i(gk4),i(gk5),i(gk6),i(gk7),i(gk8),i(gk9),i(gk10),i(gk11),i(gk12),i(gk13),i(gk14),i(gk15),i(gk16),i(gk17),i(gk18),i(gk19),i(gk20),i(gk21),i(gk22),i(gk23),i(gk24),i(gk25),i(gk26),i(gk27),i(gk28),i(gk29),i(gk30)
  giTable2         ftgen               2, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.00001+(i(gk1)*0.99999),i(gk2),i(gk3),i(gk4),i(gk5)
 elseif i(gkTable)==2 then     ; double bass
  giBase           =                   cpsmidinn(24)
  giTable          ftgen               1, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.050982,0.269147,1.000005,0.658602,0.409921,0.234611,0.371689,0.081631,0.193677,0.176088,0.325643,0.073972,0.139508,0.089290,0.133734,0.084015,0.019990,0.027201,0.017902,0.041521,0.007125,0.015291,0.015586,0.060973,0.014650,0.002686,0.018208,0.022200,0.005778,0.016678,0.011366,0.005039,0.010690,0.004182,0.004080,0.022196,0.001317,0.015622,0.006383,0.048913,0.043438,0.028458,0.019492,0.004084,0.022969,0.008893,0.009430,0.005096,0.011939,0.003356,0.002472,0.010081,0.003020,0.007064,0.020432,0.002298,0.004490,0.004640,0.005406,0.000578,0.002732,0.004642,0.003090,0.002380,0.003776,0.003052,0.002165,0.001143,0.004033,0.002833,0.000987,0.002324,0.003665,0.000774,0.003714,0.003576,0.003869,0.000651,0.001704,0.000521,0.002186,0.000385,0.001712,0.000832,0.000895,0.001616,0.000491,0.000556,0.000794,0.000267,0.000365,0.000915,0.000410,0.000555,0.000234,0.000876,0.001052,0.001316,0.000456
  giTable2         ftgen               2, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.050982,0.269147,1.000005,0.658602,0.409921
 elseif i(gkTable)==3 then    ; clarinet
  giBase           =                   cpsmidinn(50)
  giTable          ftgen               1, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.273597,0.027434,0.737705,0.049480,0.448437,0.272536,0.131175,0.129945,0.283082,0.130714,0.026719,0.037582,0.018953,0.010729,0.067580,0.024573,0.016586,0.049988,0.033294,0.017090,0.008591,0.021128,0.007237,0.016060,0.016060
  giTable2         ftgen               2, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.273597,0.027434,0.737705,0.049480,0.448437
 elseif i(gkTable)==4 then    ; bass clarinet
  giBase           =                   cpsmidinn(35)
  giTable          ftgen               1, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.384232,0.038085,0.578537,0.029558,0.143002,0.119033,0.397678,0.113380,0.577246,0.158831,0.577514,0.094994,0.440674,0.109136,0.500666,0.132354,0.360370,0.104810,0.231403,0.089565,0.207353,0.099773,0.209066,0.123801,0.158769,0.079383,0.036078,0.019583,0.010310,0.017060,0.029465,0.045821,0.031622,0.038326,0.052222,0.058647,0.083956,0.079748,0.081955,0.097274,0.069934,0.075100,0.049259,0.058121,0.068078,0.065276,0.070165,0.065898,0.072432,0.055423,0.052283,0.036547,0.034082,0.035287,0.044801,0.053917,0.050263,0.036979,0.034264,0.035892,0.035011,0.037199,0.041542,0.043201,0.039923,0.035164,0.035828,0.036193,0.037155,0.035493,0.034546,0.035091,0.029891,0.027394,0.026174,0.023757,0.021365,0.019468,0.016295,0.015301,0.015263,0.014310,0.013239,0.011972,0.011445,0.011727,0.012391,0.013892,0.015395,0.015147,0.015137,0.014816,0.013898,0.012682,0.011462,0.009883,0.008579,0.007797,0.007749
  giTable2         ftgen               2, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.384232,0.038085,0.578537,0.029558,0.143002
 elseif i(gkTable)==5 then    ; contrabass clarinet
  giBase           =                   cpsmidinn(26)
  giTable          ftgen               1, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.100160,0.005519,0.631940,0.013046,0.749042,0.308868,0.475605,0.152792,0.074315,0.238927,0.152260,0.251283,0.030787,0.052465,0.032473,0.121972,0.064172,0.090564,0.043994,0.091868,0.039563,0.058622,0.024531,0.023127,0.026665,0.067522,0.081377,0.057914,0.066176,0.036134,0.026135,0.021056,0.038011,0.036534,0.058393,0.040915,0.050051,0.038446,0.034166,0.021341,0.014481,0.015708,0.025527,0.026622,0.033577,0.027355,0.034434,0.022920,0.016354,0.010905,0.011160,0.015075,0.019871,0.017505,0.013189,0.011442,0.008511,0.007974,0.006368,0.005988,0.005976,0.005922,0.006590,0.008199,0.006566,0.005254,0.004955,0.005576,0.005463,0.005101,0.003955,0.003622,0.004027,0.003772,0.003504,0.002848,0.002183,0.002075,0.002143,0.002014,0.001907,0.001850,0.001736,0.001543,0.001318,0.001180,0.001107,0.001066,0.001169,0.001372,0.001533,0.001667,0.001738,0.001655,0.001604,0.001603,0.001571,0.001575,0.001638,0.001696
  giTable2         ftgen               2, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.100160,0.005519,0.631940,0.013046,0.749042
 elseif i(gkTable)==6 then    ; oboe
  giBase           =                   cpsmidinn(59)
  giTable          ftgen               1, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.239013,0.078927,0.241030,0.206347,0.832266,0.054540,0.013821,0.007450,0.022905,0.021737,0.018123,0.013105,0.002361,0.001433,0.003509,0.002589,0.001326,0.000743,0.000990,0.000868,0.000863,0.000994,0.000406,0.000288,0.000288
  giTable2         ftgen               2, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.239013,0.078927,0.241030,0.206347,0.832266
 elseif i(gkTable)==7 then    ; bassoon
  giBase           =                   cpsmidinn(34)
  giTable          ftgen               1, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.213868,0.268493,0.244166,0.230801,0.105833,0.308087,0.556920,0.478956,0.523357,0.900665,0.213470,0.229596,0.031221,0.040117,0.067113,0.060158,0.030778,0.061028,0.143814,0.063668,0.126426,0.055009,0.049138,0.085854,0.113027,0.111464,0.088765,0.037342,0.050990,0.035579,0.040460,0.032219,0.027305,0.034141,0.019655,0.009315,0.008270,0.006748,0.006472,0.007088,0.008133,0.007046,0.007850,0.005791,0.006273,0.006847,0.007249,0.009398,0.010309,0.010418,0.010247,0.010333,0.009562,0.008180,0.009576,0.009469,0.008529,0.008844,0.008053,0.007565,0.008026,0.007284,0.007299,0.007423,0.008280,0.008374,0.008239,0.008512,0.009431,0.010246,0.010350,0.009381,0.008652,0.008150,0.007888,0.007951,0.008166,0.008210,0.007921,0.007548,0.007147,0.006991,0.006978,0.006527,0.005617,0.004781,0.004549,0.004707,0.004803,0.004640,0.004303,0.003866,0.003524,0.003348,0.003108,0.002766,0.002439,0.002278,0.002406,0.002733
  giTable2         ftgen               2, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.213868,0.268493,0.244166,0.230801,0.105833
 elseif i(gkTable)==8 then    ; contrabassoon
  giBase           =                   cpsmidinn(38)
  giTable          ftgen               1, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.240531,0.304670,0.289169,0.727482,0.578083,0.169149,0.057305,0.193624,0.167977,0.206006,0.182632,0.057408,0.103574,0.044785,0.084239,0.068303,0.030771,0.133375,0.096231,0.037016,0.046566,0.020770,0.020264,0.015211,0.029647,0.018603,0.027940,0.062861,0.033828,0.015594,0.016305,0.025478,0.034356,0.038642,0.028451,0.026747,0.014914,0.016727,0.015524,0.013236,0.014264,0.013651,0.014838,0.016490,0.021208,0.017660,0.013009,0.014867,0.013013,0.010426,0.009144,0.009462,0.009367,0.009624,0.008079,0.007399,0.009012,0.009384,0.008661,0.009051,0.009394,0.010578,0.011610,0.012184,0.010442,0.009130,0.008795,0.008468,0.010039,0.011205,0.011438,0.011489,0.010526,0.008902,0.007391,0.006198,0.005970,0.005264,0.004331,0.003874,0.003514,0.003418,0.003518,0.003409,0.003150,0.003023,0.003047,0.003199,0.003624,0.003999,0.003839,0.003629,0.003712,0.003872,0.003974,0.003836,0.003596,0.003353,0.003177,0.003070
  giTable2         ftgen               2, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.240531,0.304670,0.289169,0.727482,0.578083
 elseif i(gkTable)==9 then    ; contrabassoon
  giBase           =                   cpsmidinn(48)
  giTable          ftgen               1, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.001482,0.007584,0.024916,0.084669,0.120825,0.037691,0.032860,0.097651,0.021318,0.007128,0.001455,0.000373,0.000311,0.001646,0.006016,0.016943,0.049158,0.018410,0.045129,0.018996,0.013181,0.005616,0.002740,0.001081,0.000371,0.000296,0.000174,0.000109
  giTable2         ftgen               2, 0, giTabLen, "padsynth", giBase, giBW, giPartScal, i(gkHarmStr), 1, 1, 0.001482,0.007584,0.024916,0.084669,0.120825
 endif
                   prints              "Ready!"
endin


opcode PoscilLayer,a,kiikkkp
 kCPS,iTable,iPhase,kInterval,kGTime,iLayers,iCount    xin
 kPortTime         linseg              0, 0.001, 1
 kIntervalL        portk               kInterval, kPortTime * rnd(i(kGTime))
 kAmp              limit               (iLayers+1) - iCount, 0, 1
 aSig              poscil              kAmp,kCPS,iTable,iPhase
 aMix              =                   0
 if iCount<iLayers then
  aMix             PoscilLayer         kCPS*semitone(kIntervalL*iCount),iTable,iPhase,kInterval,kGTime,iLayers,iCount+1
 endif
                   xout                aMix+aSig
endop

opcode PoscilOctave,a,kiikkiip
 kCPS,iTable,iPhase,kInterval,kGTime,iLayers,iOctaves,iCount    xin
 aSig              PoscilLayer         kCPS*octave(iCount-1), iTable, 0, kInterval, kGTime, iLayers
 aMix              =                   0
 if iCount<iOctaves then
  aMix             PoscilOctave        kCPS, iTable, 0, kInterval, kGTime, iLayers, iOctaves, iCount+1
 endif
                   xout                aSig + aMix
endop


instr 3 ; triggered by MIDI
 icps              cpstmid             i(gkTuning) + 200

 kporttime         linseg              0, 0.001,0.1
 gkPB              pchbend             0, 1
 gkPB              portk               gkPB*gkPBRange, kporttime 

 gkcps = icps
 iAmp ampmidi 1
 if i(gkLegatoOnOff)==0 then ;polyphonic
   iNum            notnum
                   event_i             "i",4 + iNum*0.001,0,3600*24*365,icps,iAmp
   if release:k()==1 then
                   turnoff2            4 + iNum*0.001,4,1
   endif
 elseif i(gkLegatoOnOff)==1 && active:i(4,0,1)==0 then
                   event_i             "i", 4, 0, -1, icps, iAmp
 endif
endin


instr    4    ; SOUNDING INSTRUMENT
 kRelease  release
 if i(gkLegatoOnOff)==0 then ; poly mode
  kcps             =                   p4
 else                     ; mono mode
  if kRelease==0 then
   if i(gkLegType)==1 then
    kRamp          linseg              0,0.001,1
    kcps           lineto              gkcps, gkLegTime*kRamp
   else
    kcps           portk               gkcps, gkLegTime, i(gkcps)   
   endif
  endif
  if active:k(3)==0 then
   turnoff
  endif
 endif

 ivel              =                   p5
 
; aAmpEnv          cossegr             0, i(gkAAtt),1, i(gkADec), i(gkASus), 36000, i(gkASus),i(gkARel), 0    ; SUSTAIN SEGMENT (36000) NECESSARY DUE TO cosseg BUG
; aAmpEnv          linsegr             0, i(gkAAtt),1, i(gkADec), i(gkASus),                  i(gkARel), 0    
 aAmpEnv           expsegr             0.001, i(gkAAtt),1, i(gkADec), i(gkASus),                  i(gkARel), 0.001    
 
 kInterval         chnget              "Interval"
 iLayers           chnget              "Layers"
 gkGTime           chnget              "GTime"
 iOctaves          chnget              "Octaves"
 ifreq             =                   p4

 a1                PoscilOctave        (kcps*semitone(gkPB)*sr*cent(gkDetuneInterval))/(giTabLen*giBase), giTable, 0,   kInterval, gkGTime, iLayers, iOctaves
 a2                PoscilOctave        (kcps*semitone(gkPB)*sr*cent(-gkDetuneInterval))     /(giTabLen*giBase), giTable, 0.5, kInterval, gkGTime, iLayers, iOctaves    ; OFFSET RIGHT CHANNEL PHASE FOR STEREO BREADTH 
 
 aL                ntrpol              a1, a2, (1-gkDetuneWidth)*0.5
 aR                ntrpol              a2, a1, (1-gkDetuneWidth)*0.5
  
 if i(gkFOnOff)==1 then                                                            ; IF FILTER SWITCH IS 'ON'
  kBW              expsegr             i(gkFL1), i(gkFT1), i(gkFSus), i(gkFRelTim), i(gkFRelLev)  ; BANDWIDTH ENVELOPE
  kPortTime        linseg              0,0.001,0.1                                                ; RAMPING UP FUNCTION
  kCF              portk               kcps * semitone(gkPB) * gkFPos, kPortTime                                  ; SMOOTH CHANGES TO CUTOFF POSITION COUNTER
  aL               reson               aL, a(kCF), a(kCF*kBW), 2                                        ; BANDPASS FILTER
  aR               reson               aR, a(kCF), a(kCF*kBW), 2
 endif 
 
 if i(gkHPFLPFOnOff)==1 then                                                       ; IF HIGHPASS/LOWPASS SWITCH IS 'ON'
  aL               buthp               aL, gkHPFFreq
  aL               buthp               aL, gkHPFFreq
  aR               buthp               aR, gkHPFFreq
  aR               buthp               aR, gkHPFFreq
  aL               butlp               aL, gaLPFFreq
  aL               butlp               aL, gaLPFFreq
  aR               butlp               aR, gaLPFFreq
  aR               butlp               aR, gaLPFFreq
 endif           

 /* EXCITER */
 if gkExciterAmount>0 then
  aEL              exciter             aL, gkExciterFreq, 20000, 1, 10
  aER              exciter             aR, gkExciterFreq, 20000, 1, 10
  aL               +=                  aEL * gkExciterAmount
  aR               +=                  aER * gkExciterAmount
 endif
 
 aL                *=                  ivel*aAmpEnv*gkAGain
 aR                *=                  ivel*aAmpEnv*gkAGain
                   outs                aL,aR
 gaRvbL            +=                  aL*gkRSend                                ; MIX IN DRY SIGNAL TO SEND TO REVERB
 gaRvbR            +=                  aR*gkRSend
 
endin


instr    99    ; Reverb. Always on.
 aL,aR             reverbsc            gaRvbL,gaRvbR,gkRSize,gkR__CF
                   outs                aL,aR
                   clear               gaRvbL,gaRvbR
endin

instr 100
 kAlpha            linseg              1, p3, 0
                   cabbageSet "instructions", "fontColour", kAlpha, kAlpha, kAlpha, kAlpha
endin


instr 2000 ; meter

a1,a2              monitor

; meter
if metro:k(10)==1 then
                   reinit              REFRESH_METER
endif
REFRESH_METER:
kres               init                0
kres               limit               kres-0.001,0,1 
kres               peak                a1                            
                   rireturn
                   cabbageSetValue "vMeter1", kres, changed:k(kres)              
if release:k()==1 then
                   chnset              k(0), "vMeter1"              
endif

kresR              init                0
kresR              limit               kresR-0.001,0,1 
kresR              peak                a2                            
                   rireturn
                   cabbageSetValue "vMeter2", kresR, changed:k(kresR)              
if release:k()==1 then
                   chnset              k(0), "vMeter2"              
endif

endin

</CsInstruments>

<CsScore>
i 1    0    z ; READ IN WIDGETS (ALWAYS ON)
i 2    0.01 z ; UPDATE TABLES (ALWAYS ON)
i 99   0    z ; REVERB (ALWAYS ON)
i 100  3    z ; PRINT MESSAGE
i 2000 0    z ; METER (ALWAYS ON)
</CsScore>

</CsoundSynthesizer>