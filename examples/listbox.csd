<Cabbage>
{
    "pluginId"      : "def1",
    "enableDevTools": true,
    "channelConfig" : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"       : [
        { "type": "form", "caption": "Listbox Example", "size": {"width": 600, "height": 170} },
        {
            "type"    : "label",
            "style"   : {"fontColor": "#d1d1d1"},
            "channels": [ {"id": "info", "event": "valueChanged"} ],
            "bounds"  : {"left": 0, "top": 10, "width": 600, "height": 40},
            "label"   : {"text": "Single-click an item to highlight it. Double-click an item to send it to Csound."}
        },
        {
            "type"    : "listBox",
            "items"   : ["A3", "C4", "D4", "E4", "G4", "A4"],
            "bounds"  : {"left": 12, "top": 56, "width": 174, "height": 102},
            "channels": [
                { "id": "note", "range": {"max": 5} }
            ],
            "style"   : {"borderRadius": 5, "fontSize": 8}
        },
        {
            "type"    : "textEditor",
            "bounds"  : {"left": 190, "top": 56, "width": 401, "height": 100},
            "channels": [
                { "id": "infoText", "range": {"defaultValue": 0, "increment": 0.001, "max": 1, "min": 0, "skew": 1} }
            ],
            "readOnly": 1,
            "wrap"    : 1,
            "style"   : {"fontSize": 12},
            "label"   : {"text": "Double-click a note..."}
        }
    ]
}

</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -+rtmidi=NULL -M0 -m0d
</CsOptions>
<CsInstruments>
; Initialize the global variables.
ksmps = 32
nchnls = 2
0dbfs = 1


; Rory Walsh 2021
;
; License: CC0 1.0 Universal
; You can copy, modify, and distribute this file,
; even for commercial purposes, all without asking permission.

instr 1
    sel:CabbageNumTrig = cabbageGetValue("note")

    ; The listbox only sends its value on double-click, so each
    ; trigger corresponds to a deliberate user selection.
    if sel.trig == 1 then
        event("i", "Tone", 0, 1, sel.val)
    endif
endin

instr Tone
    SNotes[] = fillarray("A3", "C4", "D4", "E4", "G4", "A4")
    iFreqs[] = fillarray(220, 261.63, 293.66, 329.63, 392, 440)

    iIdx = int(p4)
    iIdx = (iIdx < 0 || iIdx > 5 ? 0 : iIdx)

    cabbageSet("infoText", "label.text", sprintf("You double-clicked %s", SNotes[iIdx]))

    aEnv = madsr(0.01, 0.1, 0.7, 0.4)
    a1 = oscili(0.3*aEnv, iFreqs[iIdx])
    outs(a1, a1)
endin


</CsInstruments>
<CsScore>
;starts instrument 1 and runs it for a week
i1 0 z
</CsScore>
</CsoundSynthesizer>
