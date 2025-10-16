
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; pdhalf pdhalfy.csd
; Written by Iain McCurdy, 2024.

; This is a simple demonstration of the basic usage of the pdhalf and pdhalfy opcodes, 
;  used for distortion of phase pointers (phase distortion synthesis).

; In the synthesis in this example, the distorted phase pointers are used to read a sine wave table

; CONTROLS PERTAINING TO pdhalf AND pdhalfy
; Shape Amount
; Opcode       - choose between: 
;                 pdhalf  - left/right distortion of the mid point
;                 pdhalfy - up/down distortion of the mid point
; Polarity     - Unipolar/bipolar, choose appropriately according to whether the input phasor is 0 to 1 or -1 to +1

; Wrap         - choose whether the reading of the sine wave will wrap around if the pointer exceeds the limits of the table
;                 this is most relevant if polarity is 'bipolar'
; Freq.        - frequency of the original phasor (and therefore probably the fundamental of the output synthesis)
; Level        - level of the synthesised output

<Cabbage>
[
    {
        "type": "form",
        "caption": "pdhalf/pdhalfy",
        "size": {"width": 690, "height": 115},
        "pluginId": "pdcl"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 13},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 10, "top": 10, "width": 90, "height": 90},
        "text": "Shape Amount",
        "channel": "ShapeAmount",
        "range": {"min": -1, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}
    },
    {
        "type": "label",
        "font": {"colour": "#ffffff", "size": 12},
        "channel": "label_157",
        "bounds": {"left": 110, "top": 10, "width": 80, "height": 13},
        "text": "Opcode"
    },
    {
        "type": "comboBox",
        "font": {"size": 9},
        "colour": {"fill": "222222"},
        "corners": 2,
        "defaultValue": 1,
        "items": ["pdhalf", "pdhalfy"],
        "indexOffset": true,
        "bounds": {"left": 110, "top": 25, "width": 80, "height": 20},
        "channel": "Opcode"
    },
    {
        "type": "label",
        "font": {"colour": "#ffffff", "size": 12},
        "channel": "label_158",
        "bounds": {"left": 110, "top": 55, "width": 80, "height": 13},
        "text": "Polarity"
    },
    {
        "type": "comboBox",
        "font": {"size": 9},
        "colour": {"fill": "222222"},
        "corners": 2,
        "defaultValue": 1,
        "items": ["Unipolar", "Bipolar"],
        "indexOffset": true,
        "bounds": {"left": 110, "top": 70, "width": 80, "height": 20},
        "channel": "Polarity"
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_159",
        "bounds": {"left": 210, "top": 10, "width": 115, "height": 95},
        "children": [
            {
                "type": "label",
                "font": {"colour": "#cdcdcd", "size": 11},
                "channel": "label_160",
                "bounds": {"left": 5, "top": 10, "width": 10, "height": 12},
                "text": "1"
            },
            {
                "type": "label",
                "font": {"colour": "#cdcdcd", "size": 11},
                "channel": "label_161",
                "bounds": {"left": 5, "top": 47, "width": 10, "height": 12},
                "text": "0"
            },
            {
                "type": "label",
                "font": {"colour": "#cdcdcd", "size": 11},
                "channel": "label_162",
                "bounds": {"left": 0, "top": 83, "width": 15, "height": 12},
                "text": "-1"
            },
            {
                "type": "label",
                "font": {"colour": "#ffffff", "size": 11},
                "channel": "label_163",
                "bounds": {"left": 15, "top": 0, "width": 100, "height": 12},
                "text": "Phase Pointer"
            },
            {
                "type": "genTable",
                "channel": {"id": "PhasorTable", "start": "PhasorTable_start", "length": "PhasorTable_length"},
                "range": {"y": {"min": -1, "max": 1}},
                "colour": {"fill": "[160, 160, 220]"},
                "bounds": {"left": 15, "top": 15, "width": 100, "height": 76},
                "tableNumber": 1
            },
            {
                "type": "image",
                "colour": {"fill": "#646464"},
                "channel": "image_164",
                "bounds": {"left": 15, "top": 53, "width": 100, "height": 1}
            }
        ]
    },
    {
        "type": "image",
        "channel": "image_165",
        "bounds": {"left": 342, "top": 0, "width": 1, "height": 115}
    },
    {
        "type": "image",
        "colour": {"fill": "#00000000"},
        "channel": "image_166",
        "bounds": {"left": 350, "top": 10, "width": 115, "height": 95},
        "children": [
            {
                "type": "label",
                "font": {"colour": "#cdcdcd", "size": 11},
                "channel": "label_167",
                "bounds": {"left": 5, "top": 10, "width": 10, "height": 12},
                "text": "1"
            },
            {
                "type": "label",
                "font": {"colour": "#cdcdcd", "size": 11},
                "channel": "label_168",
                "bounds": {"left": 5, "top": 47, "width": 10, "height": 12},
                "text": "0"
            },
            {
                "type": "label",
                "font": {"colour": "#cdcdcd", "size": 11},
                "channel": "label_169",
                "bounds": {"left": 0, "top": 83, "width": 15, "height": 12},
                "text": "-1"
            },
            {
                "type": "label",
                "font": {"colour": "#ffffff", "size": 11},
                "channel": "label_170",
                "bounds": {"left": 15, "top": 0, "width": 100, "height": 12},
                "text": "Output"
            },
            {
                "type": "genTable",
                "channel": {"id": "DistTable", "start": "DistTable_start", "length": "DistTable_length"},
                "range": {"y": {"min": -1, "max": 1}},
                "colour": {"fill": "[160, 160, 220]"},
                "bounds": {"left": 15, "top": 15, "width": 100, "height": 76},
                "tableNumber": 2
            },
            {
                "type": "image",
                "colour": {"fill": "#646464"},
                "channel": "image_171",
                "bounds": {"left": 15, "top": 53, "width": 100, "height": 1}
            }
        ]
    },
    {
        "type": "checkBox",
        "font": {"colour": {"off": "#ffffff", "on": "#ffffff"}, "size": 8},
        "defaultValue": 0,
        "bounds": {"left": 470, "top": 25, "width": 70, "height": 15},
        "channel": "Wrap",
        "text": "Wrap"
    },
    {
        "type": "rotarySlider",
        "font": {"size": 13},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 510, "top": 10, "width": 90, "height": 90},
        "text": "Freq.",
        "channel": "Freq",
        "range": {"min": 10, "max": 2000, "defaultValue": 200, "skew": 0.5, "increment": 0.001}
    },
    {
        "type": "rotarySlider",
        "font": {"size": 13},
        "colour": {"tracker": {"background": "#222222", "width": 14}},
        "bounds": {"left": 590, "top": 10, "width": 90, "height": 90},
        "text": "Level",
        "channel": "Level",
        "range": {"min": 0, "max": 1, "defaultValue": 0.1, "skew": 0.5, "increment": 0.001}
    },
    {
        "type": "label",
        "font": {"colour": "#c8c8c8", "size": 11},
        "channel": "label_172",
        "bounds": {"left": 4, "top": 102, "width": 120, "height": 11},
        "text": "Iain McCurdy |2024|"
    }
]
</Cabbage>

<CsoundSynthesizer>

<CsOptions>
-d -n
</CsOptions>

<CsInstruments>

;sr is set by the host
ksmps   =   32      ; NUMBER OF AUDIO SAMPLES IN EACH CONTROL CYCLE
nchnls  =   2       ; NUMBER OF CHANNELS (2=STEREO)
0dbfs   =   1

;Author: Iain McCurdy (2012)

giPDPh      ftgen   1, 0, 1024, -10, 0
giPDO       ftgen   2, 0, 1024, -10, 0
giSine      ftgen   0, 0, 4096, 10, 1

instr   1
 kporttime         linseg              0, 0.001, 0.05         ; portamento time ramps up from zero 
 kShapeAmount      cabbageGetValue     "ShapeAmount"
 kShapeAmount      portk               kShapeAmount, kporttime
 kOpcode           cabbageGetValue     "Opcode"
 kOpcode           init                1
 kPolarity         cabbageGetValue     "Polarity"
 kPolarity         init                1
 
 kWrap             cabbageGetValue     "Wrap"
 
 isfn              =                   giSine
 
 kValStart         =                   kPolarity == 1 ? 0 : -1 ; if unipolar
 kValStep          =                   kPolarity == 1 ? 1 :  2 ; if unipolar
 
 if changed:k(kPolarity,kWrap)==1 then
                   reinit              RESTART
 endif
 RESTART:
 
 ibipolar          =                   i(kPolarity) - 1
 
 ; GUI tables
 if metro:k(16)==1 then
  kcount           =                   0                    ; counts through table locations
  kval             =                   kValStart            ; steps through phase locations
  while kcount<ftlen(giPDPh) do
  if kOpcode==1 then
   aPDPh           pdhalf              a(kval), kShapeAmount, ibipolar
  else
   aPDPh           pdhalfy             a(kval), kShapeAmount, ibipolar
  endif
                   tablew              aPDPh, a(kcount), giPDPh
  aPDO             tablei              aPDPh, isfn, 1, 0, i(kWrap)
                   tablew              aPDO, a(kcount), giPDO
  kval             +=                  kValStep / ftlen(giPDPh)
  kcount           +=                  1
  od
                   cabbageSet          1, "PhasorTable", "tableNumber", 1
                   cabbageSet          1, "DistTable", "tableNumber", 2
 endif
 
 
 ; synthesis
 aPhasor           phasor              cabbageGetValue:k("Freq")
 
 if kPolarity==2 then ; if bipolar
  aPhasor          =                   (aPhasor * 2) - 1
 endif
 
 if kOpcode==1 then
  aPhasor          pdhalf              aPhasor, kShapeAmount, ibipolar
 else
  aPhasor          pdhalfy             aPhasor, kShapeAmount, ibipolar
 endif

 aOut              tablei              aPhasor, isfn, 1,0,i(kWrap)
 
 kLevel            cabbageGetValue     "Level"
                   outall              aOut * a(kLevel)
 
endin
        
</CsInstruments>

<CsScore>
i 1 0 z
</CsScore>

</CsoundSynthesizer>