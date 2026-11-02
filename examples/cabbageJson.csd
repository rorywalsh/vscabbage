<Cabbage>
{
    "pluginId": "jsonUtils",
    "widgets": [
        {"type":"form","caption":"JSON Utilities","size":{"width":500,"height":200}}
    ]
}
</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d
</CsOptions>
<CsInstruments>
ksmps = 32
nchnls = 2
0dbfs = 1

instr 1
    ; A patcher-style state document: voices with params plus a mix list.
    json:S = "{\"voices\":[{\"id\":\"vco1\",\"params\":{\"freq\":440,\"amp\":0.5,\"wave\":\"sine\"}},{\"id\":\"lfo1\",\"params\":{\"rate\":2.5}}],\"mix\":[0.8,0.6]}"

    ; --- typed queries: the output variable selects the overload ---
    wave:S = cabbageJsonGet(json, "voices.0.params.wave")
    freq:k = cabbageJsonGet(json, "voices.0.params.freq")
    amp:k = cabbageJsonGet(json, "voices.0.params.amp")
    mix:k[] = cabbageJsonGet(json, "mix")
    has:i = cabbageJsonHas(json, "voices.1.params.rate")
    n:i = cabbageJsonLen(json, "voices")
    type:S = cabbageJsonType(json, "voices.0.params.freq")
    prints("wave=%s type=%s voices=%d has(rate)=%d\n", wave, type, n, has)

    ; --- play voice 0, scaled by the mix list ---
    sig:a = oscili(amp, freq)
    outs(sig*mix[0], sig*mix[1])

    ; --- trigger variant: fires when the result changes ---
    id:S, changed:k = cabbageJsonGet(json, "voices.0.id")
    printks("active voice: %s\n", changed, id)

    ; --- builders: patch the document, read it back ---
    patched:S = cabbageJsonSet(json, "voices.0.params.freq", 880)
    patched = cabbageJsonSet(patched, "voices.0.params.wave", "saw")
    newfreq:i = cabbageJsonGet(patched, "voices.0.params.freq")
    newwave:S = cabbageJsonGet(patched, "voices.0.params.wave")
    prints("patched voice: %s at %f Hz\n", newwave, newfreq)
endin

</CsInstruments>
<CsScore>
i1 0 z
</CsScore>
</CsoundSynthesizer>
