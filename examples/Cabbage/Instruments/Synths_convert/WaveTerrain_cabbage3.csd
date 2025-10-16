/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; WaveTerrain
; Written by Iain McCurdy, 2024

; An implementation of wave terrain synthesis which is intended to provide a good demonstration of how the method works.

; Wave terrain synthesis imagines wavetable look-up as, instead of moving through a single waveform cyclically, traversing a three-dimensional surface by means of an elliptical pointer. 
; The landscape is created by means of combining two waveforms: one representing terrain in the X direction, the other representing terrain in the Y direction. 
; The third dimension is created by the height a given location of X and Y coordinates - a consequence of the two input waveforms.
; As pointer movement is elliptical, its movement in the X and Y directions is sinusoidal and not a ramp phasor, as is used in standard table-lookup synthesis. 
; In fact this convention is necessary if we are to freely alter the amplitude of this ellipse in both X and Y dimensions and avoid clicks.
; Because of all of this, sinusoidal output is unlikely, even if the input waveform is sinusoidal, and the timbral results bear closer resemblence to those of FM synthesis. 

; Key to creating a dynamic sound is animation of the amplitude (radius) and offset (centre) of movement in both the X and Y directions.
; To this end, this example animates centre and offset in both dimensions using
; 1. manual control
; 2. automated modulation: LFO / random
; 3. envelopes
; 4. key velocity 

; Cabbage lacks the graphics to render 3-dimensional wave terrains but it is probably more revealing to view movement in each direction separately anyway.
; The opcode used to enact this form of synthesis (wterrain) asks use to control the X and Y movement of the elliptical pointer seperately anyway. 

; When playing polyphonically, the wavefore graphics always represents the current parameters of the last note played. 

; Sine waves provide a useful starting point for the two input waveforms but more complex shapes can be explored.
; To avoid clicks and buzzing, waveforms should wraparound smoothly if the radius of the ellipse is likely to extend beyond the limits of the described waveform.

; To create a stereo effect, the right channel waveforms are 90 degrees out of phase with those used by the left.

<Cabbage>
[
    {
        "type": "form",
        "colour": {"fill": "$BACKGROUND_COLOUR"},
        "caption": "Wave Terrain",
        "size": {"width": 1065, "height": 770},
        "pluginId": "WaTe"
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_256",
        "bounds": {"left": 0, "top": 0, "width": 1065, "height": 675}
    },
    {
        "type": "image",
        "colour": {"fill": "#c0c0c0"},
        "channel": "image_257",
        "bounds": {"left": 0, "top": 0, "width": 1060, "height": 25},
        "children": [
            {
                "type": "label",
                "font": {"colour": "$BACKGROUND_COLOUR", "size": 22},
                "channel": "label_258",
                "bounds": {"left": 0, "top": 0, "width": 1060, "height": 25},
                "text": "X"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_259",
        "bounds": {"left": 0, "top": 20, "width": 1060, "height": 135},
        "children": [
            {
                "type": "image",
                "colour": {"fill": "#00000000"},
                "channel": "image_260",
                "bounds": {"left": 10, "top": 10, "width": 520, "height": 125}
            },
            {
                "type": "image",
                "colour": {"fill": "#00000000"},
                "channel": "image_261",
                "bounds": {"left": 535, "top": 10, "width": 520, "height": 125}
            }
        ]
    },
    {
        "type": "genTable",
        "channel": {"id": "TableX", "start": "TableX_start", "length": "TableX_length"},
        "range": {"y": {"min": -1.05, "max": 1.05}},
        "bounds": {"left": 10, "top": 160, "width": 700, "height": 100},
        "tableNumber": 101
    },
    {
        "type": "image",
        "colour": {"fill": "$BACKGROUND_COLOUR"},
        "bounds": {"left": 10, "top": 160, "width": 700, "height": 100},
        "channel": "MaskXL"
    },
    {
        "type": "image",
        "colour": {"fill": "$BACKGROUND_COLOUR"},
        "bounds": {"left": 0, "top": 0, "width": 0, "height": 0},
        "channel": "MaskXR"
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_262",
        "bounds": {"left": 10, "top": 160, "width": 700, "height": 100}
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_263",
        "bounds": {"left": 715, "top": 160, "width": 340, "height": 100},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_264",
                "bounds": {"left": 0, "top": 4, "width": 340, "height": 16},
                "text": "P A R T I A L S"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 10, "top": 20, "width": 20, "height": 65},
                "channel": "XP1",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 30, "top": 20, "width": 20, "height": 65},
                "channel": "XP2",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 50, "top": 20, "width": 20, "height": 65},
                "channel": "XP3",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 70, "top": 20, "width": 20, "height": 65},
                "channel": "XP4",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 90, "top": 20, "width": 20, "height": 65},
                "channel": "XP5",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 110, "top": 20, "width": 20, "height": 65},
                "channel": "XP6",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 130, "top": 20, "width": 20, "height": 65},
                "channel": "XP7",
                "range": {"min": 0, "max": 1, "defaultValue": 0.04, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 150, "top": 20, "width": 20, "height": 65},
                "channel": "XP8",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 170, "top": 20, "width": 20, "height": 65},
                "channel": "XP9",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 190, "top": 20, "width": 20, "height": 65},
                "channel": "XP10",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 210, "top": 20, "width": 20, "height": 65},
                "channel": "XP11",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 230, "top": 20, "width": 20, "height": 65},
                "channel": "XP12",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 250, "top": 20, "width": 20, "height": 65},
                "channel": "XP13",
                "range": {"min": 0, "max": 1, "defaultValue": 0.02, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 270, "top": 20, "width": 20, "height": 65},
                "channel": "XP14",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 290, "top": 20, "width": 20, "height": 65},
                "channel": "XP15",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 310, "top": 20, "width": 20, "height": 65},
                "channel": "XP16",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 10, "top": 80, "width": 20, "height": 20},
                "channel": "XPN1",
                "range": {"min": 1, "max": 99, "defaultValue": 1, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 30, "top": 80, "width": 20, "height": 20},
                "channel": "XPN2",
                "range": {"min": 1, "max": 99, "defaultValue": 2, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 50, "top": 80, "width": 20, "height": 20},
                "channel": "XPN3",
                "range": {"min": 1, "max": 99, "defaultValue": 3, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 70, "top": 80, "width": 20, "height": 20},
                "channel": "XPN4",
                "range": {"min": 1, "max": 99, "defaultValue": 4, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 90, "top": 80, "width": 20, "height": 20},
                "channel": "XPN5",
                "range": {"min": 1, "max": 99, "defaultValue": 5, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 110, "top": 80, "width": 20, "height": 20},
                "channel": "XPN6",
                "range": {"min": 1, "max": 99, "defaultValue": 6, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 130, "top": 80, "width": 20, "height": 20},
                "channel": "XPN7",
                "range": {"min": 1, "max": 99, "defaultValue": 7, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 150, "top": 80, "width": 20, "height": 20},
                "channel": "XPN8",
                "range": {"min": 1, "max": 99, "defaultValue": 8, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 170, "top": 80, "width": 20, "height": 20},
                "channel": "XPN9",
                "range": {"min": 1, "max": 99, "defaultValue": 9, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 190, "top": 80, "width": 20, "height": 20},
                "channel": "XPN10",
                "range": {"min": 1, "max": 99, "defaultValue": 10, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 210, "top": 80, "width": 20, "height": 20},
                "channel": "XPN11",
                "range": {"min": 1, "max": 99, "defaultValue": 11, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 230, "top": 80, "width": 20, "height": 20},
                "channel": "XPN12",
                "range": {"min": 1, "max": 99, "defaultValue": 12, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 250, "top": 80, "width": 20, "height": 20},
                "channel": "XPN13",
                "range": {"min": 1, "max": 99, "defaultValue": 13, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 270, "top": 80, "width": 20, "height": 20},
                "channel": "XPN14",
                "range": {"min": 1, "max": 99, "defaultValue": 14, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 290, "top": 80, "width": 20, "height": 20},
                "channel": "XPN15",
                "range": {"min": 1, "max": 99, "defaultValue": 15, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 310, "top": 80, "width": 20, "height": 20},
                "channel": "XPN16",
                "range": {"min": 1, "max": 99, "defaultValue": 16, "skew": 1, "increment": 1}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#c0c0c0"},
        "channel": "image_265",
        "bounds": {"left": 0, "top": 265, "width": 1060, "height": 25},
        "children": [
            {
                "type": "label",
                "font": {"colour": "$BACKGROUND_COLOUR", "size": 22},
                "channel": "label_266",
                "bounds": {"left": 0, "top": 0, "width": 1060, "height": 25},
                "text": "Y"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_267",
        "bounds": {"left": 0, "top": 285, "width": 1060, "height": 135},
        "children": [
            {
                "type": "image",
                "colour": {"fill": "#00000000"},
                "channel": "image_268",
                "bounds": {"left": 10, "top": 10, "width": 520, "height": 125}
            },
            {
                "type": "image",
                "colour": {"fill": "#00000000"},
                "channel": "image_269",
                "bounds": {"left": 535, "top": 10, "width": 520, "height": 125}
            }
        ]
    },
    {
        "type": "genTable",
        "channel": {"id": "TableY", "start": "TableY_start", "length": "TableY_length"},
        "range": {"y": {"min": -1, "max": 1}},
        "bounds": {"left": 10, "top": 425, "width": 700, "height": 100},
        "tableNumber": 102
    },
    {
        "type": "image",
        "colour": {"fill": "$BACKGROUND_COLOUR"},
        "bounds": {"left": 10, "top": 425, "width": 700, "height": 100},
        "channel": "MaskYL"
    },
    {
        "type": "image",
        "colour": {"fill": "$BACKGROUND_COLOUR"},
        "bounds": {"left": 0, "top": 0, "width": 0, "height": 0},
        "channel": "MaskYR"
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_270",
        "bounds": {"left": 10, "top": 425, "width": 700, "height": 100}
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_271",
        "bounds": {"left": 715, "top": 425, "width": 340, "height": 100},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_272",
                "bounds": {"left": 0, "top": 4, "width": 340, "height": 16},
                "text": "P A R T I A L S"
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 10, "top": 20, "width": 20, "height": 65},
                "channel": "YP1",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 30, "top": 20, "width": 20, "height": 65},
                "channel": "YP2",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 50, "top": 20, "width": 20, "height": 65},
                "channel": "YP3",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 70, "top": 20, "width": 20, "height": 65},
                "channel": "YP4",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 90, "top": 20, "width": 20, "height": 65},
                "channel": "YP5",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 110, "top": 20, "width": 20, "height": 65},
                "channel": "YP6",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 130, "top": 20, "width": 20, "height": 65},
                "channel": "YP7",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 150, "top": 20, "width": 20, "height": 65},
                "channel": "YP8",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 170, "top": 20, "width": 20, "height": 65},
                "channel": "YP9",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 190, "top": 20, "width": 20, "height": 65},
                "channel": "YP10",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 210, "top": 20, "width": 20, "height": 65},
                "channel": "YP11",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 230, "top": 20, "width": 20, "height": 65},
                "channel": "YP12",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 250, "top": 20, "width": 20, "height": 65},
                "channel": "YP13",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 270, "top": 20, "width": 20, "height": 65},
                "channel": "YP14",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 290, "top": 20, "width": 20, "height": 65},
                "channel": "YP15",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "verticalSlider",
                "font": {"size": 6},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 310, "top": 20, "width": 20, "height": 65},
                "channel": "YP16",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 10, "top": 80, "width": 20, "height": 20},
                "channel": "YPN1",
                "range": {"min": 1, "max": 99, "defaultValue": 1, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 30, "top": 80, "width": 20, "height": 20},
                "channel": "YPN2",
                "range": {"min": 1, "max": 99, "defaultValue": 2, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 50, "top": 80, "width": 20, "height": 20},
                "channel": "YPN3",
                "range": {"min": 1, "max": 99, "defaultValue": 3, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 70, "top": 80, "width": 20, "height": 20},
                "channel": "YPN4",
                "range": {"min": 1, "max": 99, "defaultValue": 4, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 90, "top": 80, "width": 20, "height": 20},
                "channel": "YPN5",
                "range": {"min": 1, "max": 99, "defaultValue": 5, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 110, "top": 80, "width": 20, "height": 20},
                "channel": "YPN6",
                "range": {"min": 1, "max": 99, "defaultValue": 6, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 130, "top": 80, "width": 20, "height": 20},
                "channel": "YPN7",
                "range": {"min": 1, "max": 99, "defaultValue": 7, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 150, "top": 80, "width": 20, "height": 20},
                "channel": "YPN8",
                "range": {"min": 1, "max": 99, "defaultValue": 8, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 170, "top": 80, "width": 20, "height": 20},
                "channel": "YPN9",
                "range": {"min": 1, "max": 99, "defaultValue": 9, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 190, "top": 80, "width": 20, "height": 20},
                "channel": "YPN10",
                "range": {"min": 1, "max": 99, "defaultValue": 10, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 210, "top": 80, "width": 20, "height": 20},
                "channel": "YPN11",
                "range": {"min": 1, "max": 99, "defaultValue": 11, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 230, "top": 80, "width": 20, "height": 20},
                "channel": "YPN12",
                "range": {"min": 1, "max": 99, "defaultValue": 12, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 250, "top": 80, "width": 20, "height": 20},
                "channel": "YPN13",
                "range": {"min": 1, "max": 99, "defaultValue": 13, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 270, "top": 80, "width": 20, "height": 20},
                "channel": "YPN14",
                "range": {"min": 1, "max": 99, "defaultValue": 14, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 290, "top": 80, "width": 20, "height": 20},
                "channel": "YPN15",
                "range": {"min": 1, "max": 99, "defaultValue": 15, "skew": 1, "increment": 1}
            },
            {
                "type": "numberSlider",
                "font": {"size": 7},
                "colour": {"tracker": {"background": "#222222"}},
                "bounds": {"left": 310, "top": 80, "width": 20, "height": 20},
                "channel": "YPN16",
                "range": {"min": 1, "max": 99, "defaultValue": 16, "skew": 1, "increment": 1}
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#c0c0c0"},
        "channel": "image_273",
        "bounds": {"left": 0, "top": 535, "width": 1060, "height": 10}
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_274",
        "bounds": {"left": 0, "top": 545, "width": 310, "height": 125},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_275",
                "bounds": {"left": 0, "top": 4, "width": 310, "height": 16},
                "text": "E  N  V  E  L  O  P  E    1"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 10, "top": 25, "width": 80, "height": 90},
                "channel": "Att1",
                "range": {"min": 0, "max": 8, "defaultValue": 0.01, "skew": 0.5, "increment": 0.001},
                "text": "Attack"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 80, "top": 25, "width": 80, "height": 90},
                "channel": "Dec1",
                "range": {"min": 0, "max": 8, "defaultValue": 0.01, "skew": 0.5, "increment": 0.001},
                "text": "Decay"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 150, "top": 25, "width": 80, "height": 90},
                "channel": "Sus1",
                "range": {"min": 0, "max": 1, "defaultValue": 1, "skew": 0.5, "increment": 0.001},
                "text": "Sustain"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 220, "top": 25, "width": 80, "height": 90},
                "channel": "Rel1",
                "range": {"min": 0, "max": 8, "defaultValue": 3, "skew": 0.5, "increment": 0.001},
                "text": "Release"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#c0c0c0"},
        "channel": "image_276",
        "bounds": {"left": 308, "top": 545, "width": 4, "height": 125}
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_277",
        "bounds": {"left": 310, "top": 545, "width": 310, "height": 125},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_278",
                "bounds": {"left": 0, "top": 4, "width": 310, "height": 16},
                "text": "E  N  V  E  L  O  P  E    2"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 10, "top": 25, "width": 80, "height": 90},
                "channel": "Att2",
                "range": {"min": 0, "max": 8, "defaultValue": 0.01, "skew": 0.5, "increment": 0.001},
                "text": "Attack"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 80, "top": 25, "width": 80, "height": 90},
                "channel": "Dec2",
                "range": {"min": 0, "max": 8, "defaultValue": 0.2, "skew": 0.5, "increment": 0.001},
                "text": "Decay"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 150, "top": 25, "width": 80, "height": 90},
                "channel": "Sus2",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 0.5, "increment": 0.001},
                "text": "Sustain"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 220, "top": 25, "width": 80, "height": 90},
                "channel": "Rel2",
                "range": {"min": 0, "max": 8, "defaultValue": 0.01, "skew": 0.5, "increment": 0.001},
                "text": "Release"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#c0c0c0"},
        "channel": "image_279",
        "bounds": {"left": 618, "top": 545, "width": 4, "height": 125}
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_280",
        "bounds": {"left": 620, "top": 545, "width": 610, "height": 125},
        "children": [
            {
                "type": "label",
                "font": {"size": 14},
                "channel": "label_281",
                "bounds": {"left": 0, "top": 4, "width": 440, "height": 16},
                "text": "M  A  S  T  E  R"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 10, "top": 25, "width": 80, "height": 90},
                "channel": "Level",
                "range": {"min": 0, "max": 1, "defaultValue": 0.2, "skew": 0.5, "increment": 0.001},
                "text": "Level"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 0,
                "bounds": {"left": 90, "top": 50, "width": 80, "height": 12},
                "channel": "MEnvC1",
                "radioGroup": 3,
                "text": "Off"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 1,
                "bounds": {"left": 90, "top": 65, "width": 80, "height": 12},
                "channel": "MEnvC2",
                "radioGroup": 3,
                "text": "Env 1"
            },
            {
                "type": "checkBox",
                "font": {"colour": {"on": "#dddddd", "off": "#000000"}, "size": 6},
                "defaultValue": 0,
                "bounds": {"left": 90, "top": 80, "width": 80, "height": 12},
                "channel": "MEnvC3",
                "radioGroup": 3,
                "text": "Env 2"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 130, "top": 25, "width": 80, "height": 90},
                "channel": "MVel",
                "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001},
                "text": "Velocity"
            },
            {
                "type": "button",
                "text": {"on": "MONO", "off": "MONO"},
                "colour": {"on": {"fill": "#4bff4b"}, "off": {"fill": "#005000"}},
                "font": {"colour": {"off": "#141414", "on": "#006400"}, "size": 6},
                "corners": 2,
                "bounds": {"left": 213, "top": 27, "width": 50, "height": 15},
                "channel": "monophonic"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 200, "top": 43, "width": 80, "height": 70},
                "channel": "LegTime",
                "range": {"min": 0.01, "max": 1, "defaultValue": 0.05, "skew": 0.5, "increment": 0.001},
                "text": "Time",
                "valueTextBox": 0
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 270, "top": 25, "width": 80, "height": 90},
                "channel": "RvbSnd",
                "range": {"min": 0, "max": 1, "defaultValue": 0.2, "skew": 0.5, "increment": 0.001},
                "text": "Rvb Send"
            },
            {
                "type": "rotarySlider",
                "font": {"size": 12},
                "colour": {"tracker": {"background": "#222222", "width": 14}},
                "bounds": {"left": 340, "top": 25, "width": 80, "height": 90},
                "channel": "RvbSze",
                "range": {"min": 0.4, "max": 0.99, "defaultValue": 0.8, "skew": 2, "increment": 0.001},
                "text": "Rvb Size"
            }
        ]
    },
    {
        "type": "image",
        "colour": {"fill": "#c0c0c0"},
        "channel": "image_282",
        "bounds": {"left": 0, "top": 675, "width": 1065, "height": 95}
    },
    {
        "type": "keyboard",
        "channel": "keyboard_283",
        "bounds": {"left": 5, "top": 680, "width": 1055, "height": 85}
    }
]
</Cabbage>                                                   
                    
<CsoundSynthesizer>                                                                                                 

<CsOptions>                                                     
-dm0 -n -+rtmidi=NULL -M0  --midi-key-cps=4 --midi-velocity-amp=5 --displays
</CsOptions>
                                  
<CsInstruments>

; sr set by host
ksmps              =                   16
nchnls             =                   2
0dbfs              =                   1

massign 0, 2

giNRepeats         =                   7 ; number of repeats of the waveform in the complete viewer

giTableXL          ftgen               1,0,4096,9, 1,1,0
giTableYL          ftgen               2,0,4096,9, 1,1,0

giTableXR          ftgen               3,0,4096,9,1,1,90
giTableYR          ftgen               4,0,4096,9,1,1,90

gidispx            ftgen               101, 0,1024, 9, 1 * giNRepeats, 1, 0
gidispy            ftgen               102, 0,1024, 9, 1 * giNRepeats, 1, 0

giVelScl           ftgen               0, 0, 128, 16, 0, 128, 4, 1

giTri              ftgen               0, 0, 4096, 7, 0, 1024, 1, 2048, -1, 1024, 1


instr 1
 kXP1              cabbageGetValue     "XP1"
 kXP2              cabbageGetValue     "XP2"
 kXP3              cabbageGetValue     "XP3"
 kXP4              cabbageGetValue     "XP4"
 kXP5              cabbageGetValue     "XP5"
 kXP6              cabbageGetValue     "XP6"
 kXP7              cabbageGetValue     "XP7"
 kXP8              cabbageGetValue     "XP8"
 kXP9              cabbageGetValue     "XP9"
 kXP10             cabbageGetValue     "XP10"
 kXP11             cabbageGetValue     "XP11"
 kXP12             cabbageGetValue     "XP12"
 kXP13             cabbageGetValue     "XP13"
 kXP14             cabbageGetValue     "XP14"
 kXP15             cabbageGetValue     "XP15"
 kXP16             cabbageGetValue     "XP16"

 kXPN1             cabbageGetValue     "XPN1"
 kXPN2             cabbageGetValue     "XPN2"
 kXPN3             cabbageGetValue     "XPN3"
 kXPN4             cabbageGetValue     "XPN4"
 kXPN5             cabbageGetValue     "XPN5"
 kXPN6             cabbageGetValue     "XPN6"
 kXPN7             cabbageGetValue     "XPN7"
 kXPN8             cabbageGetValue     "XPN8"
 kXPN9             cabbageGetValue     "XPN9"
 kXPN10            cabbageGetValue     "XPN10"
 kXPN11            cabbageGetValue     "XPN11"
 kXPN12            cabbageGetValue     "XPN12"
 kXPN13            cabbageGetValue     "XPN13"
 kXPN14            cabbageGetValue     "XPN14"
 kXPN15            cabbageGetValue     "XPN15"
 kXPN16            cabbageGetValue     "XPN16"


 if changed:k(kXP1, kXP2, kXP3, kXP4, kXP5, kXP6, kXP7, kXP8, kXP9, kXP10, kXP11, kXP12, kXP13, kXP14, kXP15, kXP16, kXPN1, kXPN2, kXPN3, kXPN4, kXPN5, kXPN6, kXPN7, kXPN8, kXPN9, kXPN10, kXPN11, kXPN12, kXPN13, kXPN14, kXPN15, kXPN16)==1 then
  reinit REBUILD_TABLEX
 endif
 REBUILD_TABLEX:

 i_                ftgen               giTableXL,0,ftlen(giTableXL),9, i(kXPN1),i(kXP1),0, i(kXPN2),i(kXP2),0, i(kXPN3),i(kXP3),0, i(kXPN4),i(kXP4),0, i(kXPN5),i(kXP5),5, i(kXPN6),i(kXP6),0, i(kXPN7),i(kXP7),0, i(kXPN8),i(kXP8),0, i(kXPN9),i(kXP9),0, i(kXPN10),i(kXP10),0, i(kXPN11),i(kXP11),0, i(kXPN12),i(kXP12),0, i(kXPN13),i(kXP13),0, i(kXPN14),i(kXP14),0, i(kXPN15),i(kXP15),0, i(kXPN16),i(kXP16),0

 iPhsOS = 90
 i_                ftgen               giTableXR,0,ftlen(giTableXR),9, i(kXPN1),i(kXP1),iPhsOS, i(kXPN2),i(kXP2),iPhsOS, i(kXPN3),i(kXP3),iPhsOS, i(kXPN4),i(kXP4),iPhsOS, i(kXPN5),i(kXP5),5, i(kXPN6),i(kXP6),iPhsOS, i(kXPN7),i(kXP7),iPhsOS, i(kXPN8),i(kXP8),iPhsOS, i(kXPN9),i(kXP9),iPhsOS, i(kXPN10),i(kXP10),iPhsOS, i(kXPN11),i(kXP11),iPhsOS, i(kXPN12),i(kXP12),iPhsOS, i(kXPN13),i(kXP13),iPhsOS, i(kXPN14),i(kXP14),iPhsOS, i(kXPN15),i(kXP15),iPhsOS, i(kXPN16),i(kXP16),iPhsOS

 i_                ftgen               gidispx,0,ftlen(gidispx),9, i(kXPN1) * giNRepeats,i(kXP1),0, i(kXPN2) * giNRepeats,i(kXP2),0, i(kXPN3) * giNRepeats,i(kXP3),0, i(kXPN4) * giNRepeats,i(kXP4),0, i(kXPN5) * giNRepeats,i(kXP5),5, i(kXPN6) * giNRepeats,i(kXP6),0, i(kXPN7) * giNRepeats,i(kXP7),0, i(kXPN8) * giNRepeats,i(kXP8),0, i(kXPN9) * giNRepeats,i(kXP9),0, i(kXPN10) * giNRepeats,i(kXP10),0, i(kXPN11) * giNRepeats,i(kXP11),0, i(kXPN12) * giNRepeats,i(kXP12),0, i(kXPN13) * giNRepeats,i(kXP13),0, i(kXPN14) * giNRepeats,i(kXP14),0, i(kXPN15) * giNRepeats,i(kXP15),0, i(kXPN16) * giNRepeats,i(kXP16),0
                   cabbageSet          "TableX", "tableNumber", gidispx 

                   rireturn

 kYP1              cabbageGetValue     "YP1"
 kYP2              cabbageGetValue     "YP2"
 kYP3              cabbageGetValue     "YP3"
 kYP4              cabbageGetValue     "YP4"
 kYP5              cabbageGetValue     "YP5"
 kYP6              cabbageGetValue     "YP6"
 kYP7              cabbageGetValue     "YP7"
 kYP8              cabbageGetValue     "YP8"
 kYP9              cabbageGetValue     "YP9"
 kYP10             cabbageGetValue     "YP10"
 kYP11             cabbageGetValue     "YP11"
 kYP12             cabbageGetValue     "YP12"
 kYP13             cabbageGetValue     "YP13"
 kYP14             cabbageGetValue     "YP14"
 kYP15             cabbageGetValue     "YP15"
 kYP16             cabbageGetValue     "YP16"

 kYPN1             cabbageGetValue     "YPN1"
 kYPN2             cabbageGetValue     "YPN2"
 kYPN3             cabbageGetValue     "YPN3"
 kYPN4             cabbageGetValue     "YPN4"
 kYPN5             cabbageGetValue     "YPN5"
 kYPN6             cabbageGetValue     "YPN6"
 kYPN7             cabbageGetValue     "YPN7"
 kYPN8             cabbageGetValue     "YPN8"
 kYPN9             cabbageGetValue     "YPN9"
 kYPN10            cabbageGetValue     "YPN10"
 kYPN11            cabbageGetValue     "YPN11"
 kYPN12            cabbageGetValue     "YPN12"
 kYPN13            cabbageGetValue     "YPN13"
 kYPN14            cabbageGetValue     "YPN14"
 kYPN15            cabbageGetValue     "YPN15"
 kYPN16            cabbageGetValue     "YPN16"


 if changed:k(kYP1, kYP2, kYP3, kYP4, kYP5, kYP6, kYP7, kYP8, kYP9, kYP10, kYP11, kYP12, kYP13, kYP14, kYP15, kYP16, kYPN1, kYPN2, kYPN3, kYPN4, kYPN5, kYPN6, kYPN7, kYPN8, kYPN9, kYPN10, kYPN11, kYPN12, kYPN13, kYPN14, kYPN15, kYPN16)==1 then
                   reinit              REBUILD_TABLEY
 endif
 REBUILD_TABLEY:

 i_                ftgen               giTableYL,0,ftlen(giTableYL),9, i(kYPN1),i(kYP1),0, i(kYPN2),i(kYP2),0, i(kYPN3),i(kYP3),0, i(kYPN4),i(kYP4),0, i(kYPN5),i(kYP5),5, i(kYPN6),i(kYP6),0, i(kYPN7),i(kYP7),0, i(kYPN8),i(kYP8),0, i(kYPN9),i(kYP9),0, i(kYPN10),i(kYP10),0, i(kYPN11),i(kYP11),0, i(kYPN12),i(kYP12),0, i(kYPN13),i(kYP13),0, i(kYPN14),i(kYP14),0, i(kYPN15),i(kYP15),0, i(kYPN16),i(kYP16),0

iPhsOS = 90
i_                 ftgen               giTableYR,0,ftlen(giTableYR),9, i(kYPN1),i(kYP1),iPhsOS, i(kYPN2),i(kYP2),iPhsOS, i(kYPN3),i(kYP3),iPhsOS, i(kYPN4),i(kYP4),iPhsOS, i(kYPN5),i(kYP5),5, i(kYPN6),i(kYP6),iPhsOS, i(kYPN7),i(kYP7),iPhsOS, i(kYPN8),i(kYP8),iPhsOS, i(kYPN9),i(kYP9),iPhsOS, i(kYPN10),i(kYP10),iPhsOS, i(kYPN11),i(kYP11),iPhsOS, i(kYPN12),i(kYP12),iPhsOS, i(kYPN13),i(kYP13),iPhsOS, i(kYPN14),i(kYP14),iPhsOS, i(kYPN15),i(kYP15),iPhsOS, i(kYPN16),i(kYP16),iPhsOS

i_                 ftgen               gidispy,0,ftlen(gidispx),9, i(kYPN1) * giNRepeats,i(kYP1),0, i(kYPN2) * giNRepeats,i(kYP2),0, i(kYPN3) * giNRepeats,i(kYP3),0, i(kYPN4) * giNRepeats,i(kYP4),0, i(kYPN5) * giNRepeats,i(kYP5),5, i(kYPN6) * giNRepeats,i(kYP6),0, i(kYPN7) * giNRepeats,i(kYP7),0, i(kYPN8) * giNRepeats,i(kYP8),0, i(kYPN9) * giNRepeats,i(kYP9),0, i(kYPN10) * giNRepeats,i(kYP10),0, i(kYPN11) * giNRepeats,i(kYP11),0, i(kYPN12) * giNRepeats,i(kYP12),0, i(kYPN13) * giNRepeats,i(kYP13),0, i(kYPN14) * giNRepeats,i(kYP14),0, i(kYPN15) * giNRepeats,i(kYP15),0, i(kYPN16) * giNRepeats,i(kYP16),0
                   cabbageSet          "TableY", "tableNumber",gidispy 

rireturn

 ; show/hide legato time slider
 kmonophonic       cabbageGetValue     "monophonic"
                   cabbageSet          changed:k(kmonophonic), "LegTime", "alpha", 0.3 + kmonophonic*0.7
                   cabbageSet          changed:k(kmonophonic), "LegTime", "active", kmonophonic

endin


instr 2 ; receives MIDI, calls sounding instrument (instr 3)
 iNote             notnum
 gkNote            =                   iNote                         ; global note will always be the last played in the stack
 iCPS              cpsmidi
 iVel              veloc               0, 1

 ; pitch bend
 kPBend            pchbend             0, 2
 kRamp             linseg              0,0.001,0.02
 gkPBend           portk               kPBend, kRamp
 
 gimonophonic      cabbageGetValue     "monophonic"

 if gimonophonic==0 then                                              ; polyphonic
  aL,aR            subinstr            p1 + 1, iNote, iVel
                   outs                aL, aR
 else                                                                 ; monophonic
  iNumNotes        active              p1                             ; outputs the number of notes currently being played by instr 1. i.e. if this is the first note, iNumNotes = 1
  if iNumNotes==1 then                                                ; if this is the first note...
                   event_i             "i", p1+1, 0, -1, iNote, iVel  ; event_i creates a score event at i-time. p3 = -1 means a 'held' note.
  endif
 endif

endin




instr 3 ; sounding instrument
 kNumNotes         active              p1-1             ; outputs the number of notes currently being played by instr 1. Notice that this time it is k-rate.
 if kNumNotes==0 then
                   turnoff                              ; 'turnoff' turns off this note. It will allow release envelopes to complete, thereby preventing clicks.
 endif

 if gimonophonic==1 then                                ; if monophonic...
  
  kRelease         release                              ; this creates a release flag indicator as to whether this note is in it release stage or not. 0 = sustain, 1 = release
  ; maybe add some portamento to the note value
  kRamp            linseg              0, 0.01, 1
  if kRelease==0 then                                   ; only update note while in the sustain portion of the note
   kLegTime        cabbageGetValue     "LegTime"
   kNote           portk               gkNote, kRamp * kLegTime
  endif
  kFreq            =                   cpsmidinn(kNote)
 else ; polyphonic
  kFreq            =                   cpsmidinn(p4)
 endif

 ; pitch bend
 kFreq             *=                  semitone(gkPBend)

  iVel             =                   p5
 
; envelopes
 iAtt1             cabbageGetValue     "Att1"
 iDec1             cabbageGetValue     "Dec1"
 iSus1             cabbageGetValue     "Sus1"
 iRel1             cabbageGetValue     "Rel1"

 iAtt2             cabbageGetValue     "Att2"
 iDec2             cabbageGetValue     "Dec2"
 iSus2             cabbageGetValue     "Sus2"
 iRel2             cabbageGetValue     "Rel2"

 kEnv1             linsegr             0, iAtt1+1/kr, 1, iDec1+1/kr, iSus1, iRel1+1/kr, 0
 kEnv2             linsegr             0, iAtt2+1/kr, 1, iDec2+1/kr, iSus2, iRel2+1/kr, 0
 kEnvGate          linsegr             0, 0.005, 1, 0.005, 0



 ; X centre
 kXCentre          cabbageGetValue     "XCentre"

 ; X centre modulation
 kXCentreLFOAmp    cabbageGetValue     "XCentreLFOAmp"
 kXCentreLFORate   cabbageGetValue     "XCentreLFORate"
 kXModC1           cabbageGetValue     "XModC1"
 kXModC2           cabbageGetValue     "XModC2"
 kXModC3           cabbageGetValue     "XModC3"
 if kXModC1==1 then
 kXCentreLFO       lfo                 kXCentreLFOAmp, kXCentreLFORate, 0
 elseif kXModC2==1 then
 kXCentreLFO       lfo                 kXCentreLFOAmp, kXCentreLFORate, 1
 else
 kXCentreLFO       jspline             kXCentreLFOAmp, kXCentreLFORate+2, kXCentreLFORate*4
 ;kXCentreLFO       randh               kXCentreLFOAmp, kXCentreLFORate
 endif
 kXCentre          +=                  kXCentreLFO

 ; X centre envelope
 iXEnvC2           cabbageGetValue     "XEnvC2"
 iXEnvC3           cabbageGetValue     "XEnvC3"
 iXEnvCAmt         cabbageGetValue     "XEnvCAmt"
 if iXEnvC2==1 then
  kXCentre          +=                  kEnv1^2 * iXEnvCAmt
 elseif iXEnvC3==1 then
  kXCentre          +=                  kEnv2^2 * iXEnvCAmt
 endif

 ; X centre velocity
 iXVelC            cabbageGetValue     "XVelC"
 kXCentre          +=                  table(iVel,giVelScl,1) * iXVelC
    
 ; X radius
 kXRadius          cabbageGetValue     "XRadius"

 ; X radius modulation
 kXRadiusLFOAmp    cabbageGetValue     "XRadiusLFOAmp"
 kXRadiusLFORate   cabbageGetValue     "XRadiusLFORate"
 kXModR1           cabbageGetValue     "XModR1"
 kXModR2           cabbageGetValue     "XModR2"
 kXModR3           cabbageGetValue     "XModR3"
 if kXModR1==1 then
 kXRadiusLFO       poscil              kXRadiusLFOAmp, kXRadiusLFORate, -1, 0.75
 elseif kXModR2==1 then
 kXRadiusLFO       lfo                 kXRadiusLFOAmp, kXRadiusLFORate, 1
 else
 kXRadiusLFO       jspline             kXRadiusLFOAmp, kXRadiusLFORate+2, kXRadiusLFORate*4
 ;kXRadiusLFO       randh               kXRadiusLFOAmp, kXRadiusLFORate
 endif
 kXRadius          +=                  kXRadiusLFO + kXRadiusLFOAmp

 ; X radius envelope
 iXEnvR2           cabbageGetValue     "XEnvR2"
 iXEnvR3           cabbageGetValue     "XEnvR3"
 iXEnvRAmt         cabbageGetValue     "XEnvRAmt"
 if iXEnvR2==1 then
  kXRadius          +=                  (kEnv1^2) * 4 * iXEnvRAmt
 elseif iXEnvR3==1 then
  kXRadius          +=                  (kEnv2^2) * 4 * iXEnvRAmt
 endif

 ; X centre velocity
 iXVelR           cabbageGetValue     "XVelR"
 kXRadius         +=                  table(iVel,giVelScl,1) * iXVelR * 4

                   
         
 ; Y centre
 kYCentre           cabbageGetValue     "YCentre"

 ; Y centre modulation
 kYCentreLFOAmp    cabbageGetValue     "YCentreLFOAmp"
 kYCentreLFORate   cabbageGetValue     "YCentreLFORate"
 kYModC1           cabbageGetValue     "YModC1"
 kYModC2           cabbageGetValue     "YModC2"
 kYModC3           cabbageGetValue     "YModC3"
 if kYModC1==1 then
 kYCentreLFO       lfo                 kYCentreLFOAmp, kYCentreLFORate, 0
 elseif kYModC2==1 then
 kYCentreLFO       lfo                 kYCentreLFOAmp, kYCentreLFORate, 1
 else
 kYCentreLFO       jspline             kYCentreLFOAmp, kYCentreLFORate+2, kYCentreLFORate*4
 endif
 kYCentre          +=                  kYCentreLFO

 ; Y centre envelope
 iYEnvC2           cabbageGetValue     "YEnvC2"
 iYEnvC3           cabbageGetValue     "YEnvC3"
 iYEnvCAmt         cabbageGetValue     "YEnvCAmt"
 if iYEnvC2==1 then
  kYCentre          +=                  kEnv1^2 * iYEnvCAmt
 elseif iYEnvC3==1 then
  kYCentre          +=                  kEnv2^2 * iYEnvCAmt
 endif

 ; Y centre velocity
 iYVelC           cabbageGetValue     "YVelC"
 kYCentre         +=                  table(iVel,giVelScl,1) * iYVelC


 ; Y radius
 kYRadius          cabbageGetValue     "YRadius"

 ; Y radius modulation
 kYRadiusLFOAmp    cabbageGetValue     "YRadiusLFOAmp"
 kYRadiusLFORate   cabbageGetValue     "YRadiusLFORate"
 kYModR1           cabbageGetValue     "YModR1"
 kYModR2           cabbageGetValue     "YModR2"
 kYModR3           cabbageGetValue     "YModR3"
 if kYModR1==1 then
  kYRadiusLFO       poscil             kYRadiusLFOAmp, kYRadiusLFORate, -1, 0.75
 elseif kYModR2==1 then
 kYRadiusLFO       lfo                 kYRadiusLFOAmp, kYRadiusLFORate, 1
 else
 kYRadiusLFO       jspline             kYRadiusLFOAmp, kYRadiusLFORate+2, kYRadiusLFORate*4
 endif
 kYRadius          +=                  kYRadiusLFO + kYRadiusLFOAmp

 ; Y radius envelope
 iYEnvR2           cabbageGetValue     "YEnvR2"
 iYEnvR3           cabbageGetValue     "YEnvR3"
 iYEnvRAmt         cabbageGetValue     "YEnvRAmt"
 if iYEnvR2==1 then
  kYRadius          +=                  (kEnv1^2) * 4 * iYEnvRAmt
 elseif iYEnvR3==1 then
  kYRadius          +=                  (kEnv2^2) * 4 * iYEnvRAmt
 endif

 ; Y centre velocity
 iYVelR            cabbageGetValue     "YVelR"
 kYRadius          +=                  table(iVel,giVelScl,1) * iYVelR * 4


; send controls to channels
                   chnset              kXCentre, "XCentreSend"
                   chnset              kXRadius, "XRadiusSend"
                   chnset              kYCentre, "YCentreSend"
                   chnset              kYRadius, "YRadiusSend"


 kporttime         linseg              0, 0.01, 0.01
 kXCentre          portk               kXCentre, kporttime
 kXRadius          portk               kXRadius, kporttime
 kYCentre          portk               kYCentre, kporttime
 kYRadius          portk               kYRadius, kporttime

         
 kLevel            cabbageGetValue     "Level"

; wave terrain synthesis
aoutL              wterrain            kLevel, kFreq, kXCentre, kYCentre, kXRadius, kYRadius, giTableXL, giTableYL 
aoutR              wterrain            kLevel, kFreq, kXCentre, kYCentre, kXRadius, kYRadius, giTableXR, giTableYR
;krot               =                   phasor:k(0.1) * 2 * $M_PI
;kcurve             =                   8
;kcurveparam        =                   0
;aoutL              wterrain2           kLevel, kFreq, kXCentre, kYCentre, kXRadius, kYRadius, krot, giTableXL, giTableYL, kcurve, kcurveparam
;aoutR              wterrain2           kLevel, kFreq, kXCentre, kYCentre, kXRadius, kYRadius, krot, giTableXR, giTableYR, kcurve, kcurveparam

 ; master amplitude envelope
 iMEnvC1           cabbageGetValue     "MEnvC1"
 iMEnvC2           cabbageGetValue     "MEnvC2"
 if iMEnvC1==1 then
  aEnv             =                   a(kEnvGate)
 elseif iMEnvC2==1 then
  aEnv             =                   a(kEnv1)
 else
  aEnv             =                   a(kEnv2)
 endif
 
 ; velocity
 iMVel             cabbageGetValue     "MVel"
 iMVel             =                   (1 - iMVel) + table(iVel,giVelScl,1) * iMVel
 
 aoutL             *=                  aEnv * iMVel
 aoutR             *=                  aEnv * iMVel
 
                   outs                aoutL, aoutR


                   chnmix              aoutL,"SendL"
                   chnmix              aoutR,"SendR"

endin










instr 99 ; reverb
 kRvbSnd           cabbageGetValue     "RvbSnd"
 kRvbSze           cabbageGetValue     "RvbSze"
 aInL              chnget              "SendL"
 aInR              chnget              "SendR"
                   chnclear            "SendL"
                   chnclear            "SendR"
 aOutL,aOutR       reverbsc            aInL*kRvbSnd,aInR*kRvbSnd,kRvbSze,12000
                   outs                aOutL,aOutR
endin





instr 101 ; move graphical masks over the waveforms
 kXCentre           chnget              "XCentreSend"
 kXRadius           chnget              "XRadiusSend"
 kYCentre           chnget              "YCentreSend"
 kYRadius           chnget              "YRadiusSend"
 
 if active:k(2)==0 then
 kXRadius           =                   0
 kYRadius           =                   0
 kXCentre           =                   0.5
 kYCentre           =                   0.5
 endif
 
 iTableXBounds[]    cabbageGet          "TableX", "bounds"
 ; dimensions of central waveform
 ;print iTableXBounds[0] + (iTableXBounds[2] / int(giNRepeats*0.5))
 iX                 =                   iTableXBounds[0] + int(giNRepeats*0.5) * iTableXBounds[2] / giNRepeats ; start of central waveform
 iY                 =                   iTableXBounds[1]
 iWid               =                   iTableXBounds[2] / giNRepeats ; width of central waveform
 iHei               =                   iTableXBounds[3]
 iBegin             =                   iTableXBounds[0] 
 iEnd               =                   iTableXBounds[2] + iTableXBounds[0]
 
 iTableYBounds[]    cabbageGet          "TableY", "bounds"
 iY2                =                   iTableYBounds[1]
 
 if metro:k(16)==1 then
  kTrig             changed             kYCentre, kYRadius
 endif
 
 if active:i(p1)==1 then
  if metro:k(16)==1 then
   kTrig            changed             kXCentre, kXRadius
  endif
                    cabbageSet          kTrig, "MaskXL", "bounds", iBegin, iY, iX + iWid*kXCentre - (iWid*0.5*abs(kXRadius)) - iBegin, iHei
                    cabbageSet          kTrig, "MaskXR", "bounds", iX + iWid*kXCentre + (iWid*0.5*abs(kXRadius)), iY, iEnd - (iX + iWid*kXCentre + (iWid*0.5*abs(kXRadius))) + 1, iHei
  
                    cabbageSet          kTrig, "MaskYL", "bounds", iBegin, iY2, iX + iWid*kYCentre - (iWid*0.5*abs(kYRadius)) - iBegin, iHei
                    cabbageSet          kTrig, "MaskYR", "bounds", iX + iWid*kYCentre + (iWid*0.5*abs(kYRadius)), iY2, iEnd - (iX + iWid*kYCentre + (iWid*0.5*abs(kYRadius))) + 1, iHei
 endif
 
 
endin


</CsInstruments>

<CsScore>
i 1 0 z ; build tables
i 99 0 z ; reverb
i 101 0 z ; graphics
</CsScore>                            

</CsoundSynthesizer>
