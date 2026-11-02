<Cabbage>[
    {"type":"form","caption":"Custom Message Demo","size":{"width":800,"height":400},"pluginId":"CMsg"}
]
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-dm0 -n
</CsOptions>
<CsInstruments>
ksmps = 64
nchnls = 2
0dbfs = 1

; Send a message at init time
instr 1
    ; Send a simple status message
    SJson = sprintf(R{"type":"status","message":"Instrument initialized"}R)
    cabbageSendMessage(SJson)
endin

; Send periodic updates at k-rate
instr 2
    trig:k = metro(4)  ; Update 4 times per second

    ; Build JSON message with current values
    SJson  = sprintf(R{"type":"dataUpdate","value":%d}R, random:k(0, 100))

    ; Send when triggered
    ; TODO(G): kMetro is not defined in this example (trig is). Rory to confirm the intended line.
    cabbageSendMessage kMetro, SJson
endin


</CsInstruments>
<CsScore>
i1 0 1      ; Send init message
i2 0 10     ; Send periodic updates for 10 seconds
</CsScore>
</CsoundSynthesizer>
