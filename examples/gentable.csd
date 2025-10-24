<Cabbage>
[
    {
        "type": "form",
        "caption": "Gentable Example",
        "size": {"width": 400, "height": 650},
        "guiMode": "queue",
        "pluginId": "def1"
    },
    {
        "type": "genTable",
        "bounds": {"left": 10, "top": 7, "width": 380, "height": 200},
        "id": "gentable1",
        "tableNumber": 1
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 14, "top": 212, "width": 368, "height": 14},
        "channels": [{"id": "harm1", "range": {"min": 0, "max": 1, "value": 1, "skew": 1, "increment": 0.01}}],
        "text": "Harm1"
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 14, "top": 244, "width": 368, "height": 14},
        "channels": [{"id": "harm2", "range": {"min": 0, "max": 1, "value": 0, "skew": 1, "increment": 0.01}}],
        "text": "Harm2"
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 14, "top": 276, "width": 368, "height": 14},
        "channels": [{"id": "harm3", "range": {"min": 0, "max": 1, "value": 0, "skew": 1, "increment": 0.01}}],
        "text": "Harm3"
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 14, "top": 308, "width": 368, "height": 14},
        "channels": [{"id": "harm4", "range": {"min": 0, "max": 1, "value": 0, "skew": 1, "increment": 0.01}}],
        "text": "Harm4"
    },
    {
        "type": "horizontalSlider",
        "bounds": {"left": 14, "top": 340, "width": 368, "height": 14},
        "channels": [{"id": "harm5", "range": {"min": 0, "max": 1, "value": 0, "skew": 1, "increment": 0.01}}],
        "text": "Harm5"
    },
    {
        "type": "checkBox",
        "bounds": {"left": 16, "top": 380, "width": 120, "height": 20},
        "channels": [{"id": "normal"}],
        "text": "Normalise",
        "value": 1
    },
    {
        "type": "checkBox",
        "bounds": {"left": 140, "top": 380, "width": 120, "height": 20},
        "channels": [{"id": "fill"}],
        "text": "Fill Table",
        "value": 1
    }
]
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-d -n -m0d
</CsOptions>
<CsInstruments>
;sr is set by the host
ksmps 		= 	32
nchnls 		= 	2
0dbfs		=	1


; Rory Walsh 2021
; License: CC0 1.0 Universal
; You can copy, modify, and distribute this file,
; even for commercial purposes, all without asking permission.
sumTable@global:i = ftgen(1, 0, 1024, 10, 1)


//fill table with default values
schedule("UpdateTable", 0, 0, 1, 0, 0, 0, 0, 0)

instr	1
    
    ;toggle fill
    fill:k, trig:k = cabbageGetValue("fill")
    cabbageSet(trig, "gentable1", "fill", fill)

    harm1:k = cabbageGetValue("harm1")
    harm2:k = cabbageGetValue("harm2")
    harm3:k = cabbageGetValue("harm3")
    harm4:k = cabbageGetValue("harm4")
    harm5:k = cabbageGetValue("harm5")

    outSig:a = oscili(.2, 200, 1)
    outs(outSig, outSig)

    trigger:k = changed(harm1, harm2, harm3, harm4, harm5)
    if trigger==1 then
        ;if a slider changes trigger instrument 2 to update table
        event("i", "UpdateTable", 0, .01, harm1, harm2, harm3, harm4, harm5)
    endif
    
endin

instr UpdateTable
    normal:i = (cabbageGetValue:i("normal")==0 ? -1 : 1)
    sumTable =  ftgen(1, 0, 1024, 10*normal, p4, p5, p6, p7, p8)
    cabbageSet("gentable1", "tableNumber", 1)	; update table display
endin

</CsInstruments>
<CsScore>
f1 0 1024 10 1
i1 0 [3600*24*7]
</CsScore>
</CsoundSynthesizer>
