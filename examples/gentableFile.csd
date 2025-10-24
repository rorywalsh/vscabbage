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
        "tableNumber": 1,
        "selectableRegions":true
    },
    {
        "type": "fileButton",
        "bounds": {"left": 14, "top": 212, "width": 80, "height": 24},
        "channels": [{"id": "fileToOpen"}],
        "text":{
            "off": "Open File", 
            "on": "Open File"
        }
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

instr	1
    SFile, kTrig = cabbageGetValue("fileToOpen")
    printf("File selected:%s", kTrig, SFile)
    cabbageSet(kTrig, "gentable1", "file", SFile)    
endin

</CsInstruments>
<CsScore>
f1 0 1024 10 1
i1 0 [3600*24*7]
</CsScore>
</CsoundSynthesizer>
