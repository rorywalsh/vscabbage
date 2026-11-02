<Cabbage>
{
    "pluginId": "def1",
    "widgets" : [
        {
            "type"    : "form",
            "id"      : "MainForm",
            "caption" : "ARA Analyser",
            "size"    : {"width": 864, "height": 600},
            "style"   : {"backgroundColor": "#2b2b41"},
            "channels": [ {"id": "formChannel"} ]
        },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 20, "top": 60, "width": 120, "height": 80},
            "style"   : { "label": {"fontColor": "#dddddd"}, "valueText": {"fontSize": 12} },
            "channels": [
                {
                    "id"   : "wetdry",
                    "label": "Wet/Dry",
                    "event": "valueChanged",
                    "range": {"min": 0, "max": 1, "defaultValue": 0, "skew": 1, "increment": 0.001}
                }
            ]
        },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 20, "top": 160, "width": 120, "height": 80},
            "style"   : { "label": {"fontColor": "#dddddd"}, "valueText": {"fontSize": 12} },
            "channels": [
                {
                    "id"   : "feedback",
                    "label": "Feedback",
                    "event": "valueChanged",
                    "range": {"min": 0, "max": 1, "defaultValue": 0.5, "skew": 1, "increment": 0.001}
                }
            ]
        },
        {
            "type"    : "csoundOutput",
            "bounds"  : {"left": 160, "top": 57, "width": 650, "height": 529},
            "channels": [
                { "id": "csoundOutput2", "range": {"increment": 0.001} }
            ]
        }
    ]
}

</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -m0d
</CsOptions>
<CsInstruments>
ksmps = 1
nchnls = 2
0dbfs  = 1

; This instrument listens for ARA updates and when it detects one
; it triggers instrument 99 to process the audio data. No point
; in trying to process anything until an event is received from the host,
; as there will be no audio data to process.
instr 1
    updated:k = cabbageAraGetUpdate()
    if updated == 1 then
        event("i", "ShowAllInfo", 0, 1)
    endif
endin

instr ShowAllInfo
    cabbageAraDump()
    ; --- Top-level state ---
    idx:i      = cabbageAraGet("currentIndex")
    srcCnt:i   = cabbageAraGet("audioSourceCount")
    lastEvent:S = cabbageAraGet("lastEvent")

    ; Print the header block
    printfi("=========================================\n", 1)
    printfi("ARA UPDATE No.%d\n", 1, p5)
    printfi("=========================================\n", 1)
    printfi("[Status]  Last Event:   %s\n", 1, lastEvent)

    ; --- Selection properties ---
    regCnt:i    = cabbageAraGet("playbackRegionCount")
    mcCnt:i     = cabbageAraGet("musicalContextCount")
    rsCnt:i     = cabbageAraGet("regionSequenceCount")
    modCnt:i    = cabbageAraGet("audioModificationCount")
    selRegCnt:i = cabbageAraGet("editorView.selectedPlaybackRegionCount")
    printfi("[Metrics] Sources: %d  |  Regions: %d  |  Contexts: %d  |  Sequences: %d  |  Modifications: %d  |  Selected: %d  |  Current Index: %d\n", 1, srcCnt, regCnt, mcCnt, rsCnt, modCnt, selRegCnt, idx)

    ; --- Time Range Calculations ---
    trStart:i = cabbageAraGet("editorView.timeRange.start")
    trDur:i   = cabbageAraGet("editorView.timeRange.duration")
    printfi("[Time]    Host Range:   %.3f to %.3f (%.3fs)\n\n", 1, trStart, trStart + trDur, trDur)

    ; --- Musical Contexts Loop ---
    printfi("------------ MUSICAL CONTEXTS -----------\n", 1)
    if mcCnt == 0 then
        printfi("    [None]\n", 1)
    else
        mcIdx:i = 0
        while mcIdx < mcCnt do
            mcName:S  = cabbageAraGet("musicalContext.name", mcIdx)
            mcOrder:i = cabbageAraGet("musicalContext.orderIndex", mcIdx)
            mcColR:i  = cabbageAraGet("musicalContext.color.r", mcIdx)
            mcColG:i  = cabbageAraGet("musicalContext.color.g", mcIdx)
            mcColB:i  = cabbageAraGet("musicalContext.color.b", mcIdx)

            printfi("[%d] '%s'\n", mcIdx + 1, mcIdx, mcName)
            printfi("    Order:  %d\n", 1, mcOrder)
            printfi("    Colour: (%.2f, %.2f, %.2f)\n", 1, mcColR, mcColG, mcColB)
            mcIdx += 1
        od
    endif
    printfi("\n", 1)

    ; --- Region Sequences Loop ---
    printfi("------------ REGION SEQUENCES -----------\n", 1)
    if rsCnt == 0 then
        printfi("    [None]\n", 1)
    else
        rsIdx:i = 0
        while rsIdx < rsCnt do
            rsName:S  = cabbageAraGet("regionSequence.name", rsIdx)
            rsOrder:i = cabbageAraGet("regionSequence.orderIndex", rsIdx)
            rsMcIdx:i = cabbageAraGet("regionSequence.musicalContextIndex", rsIdx)
            rsColR:i  = cabbageAraGet("regionSequence.color.r", rsIdx)
            rsColG:i  = cabbageAraGet("regionSequence.color.g", rsIdx)
            rsColB:i  = cabbageAraGet("regionSequence.color.b", rsIdx)

            printfi("[%d] '%s'\n", rsIdx + 1, rsIdx, rsName)
            printfi("    Order:     %d\n", 1, rsOrder)
            printfi("    Context:   #%d\n", 1, rsMcIdx)
            printfi("    Colour:    (%.2f, %.2f, %.2f)\n", 1, rsColR, rsColG, rsColB)
            rsIdx += 1
        od
    endif
    printfi("\n", 1)

    ; --- Playback Regions Loop ---
    printfi("------------ PLAYBACK REGIONS -----------\n", 1)
    if regCnt == 0 then
        printfi("    [None]\n", 1)
    else
        selIdx:i = 0
        while selIdx < regCnt do
            selName:S    = cabbageAraGet("playbackRegion.name", selIdx)
            pbStart:i    = cabbageAraGet("playbackRegion.start", selIdx)
            pbDur:i      = cabbageAraGet("playbackRegion.duration", selIdx)
            pbColR:i     = cabbageAraGet("playbackRegion.color.r", selIdx)
            pbColG:i     = cabbageAraGet("playbackRegion.color.g", selIdx)
            pbColB:i     = cabbageAraGet("playbackRegion.color.b", selIdx)

            printfi("[%d] '%s'\n", selIdx + 1, selIdx, selName)
            printfi("    Start:    %.3fs\n", 1, pbStart)
            printfi("    Duration: %.3fs\n", 1, pbDur)
            printfi("    Colour:   (%.2f, %.2f, %.2f)\n", 1, pbColR, pbColG, pbColB)
            selIdx += 1
        od
    endif
    printfi("\n", 1)

    ; --- Selected Regions Loop (New Section) ---
    printfi("------------ SELECTED REGIONS -----------\n", 1)
    if selRegCnt == 0 then
        printfi("    [None]\n", 1)
    else
        activeSelIdx:i = 0
        while activeSelIdx < selRegCnt do
            selRegName:S = cabbageAraGet("editorView.selectedRegion.name", activeSelIdx)
            selTimelineStart:i = cabbageAraGet("editorView.selectedPlayback.start", activeSelIdx)
            selTimelineDur:i = cabbageAraGet("editorView.selectedPlayback.duration", activeSelIdx)
            selSrcStartSamp:i = cabbageAraGet("editorView.selectedRegion.startInSamples", activeSelIdx)
            selSrcDurSamp:i = cabbageAraGet("editorView.selectedRegion.durationInSamples", activeSelIdx)

            printfi("[%d] '%s'\n", activeSelIdx + 1, activeSelIdx, selRegName)
            printfi("    Timeline Pos: %.3fs (Dur: %.3fs)\n", 1, selTimelineStart, selTimelineDur)
            printfi("    Source Crop:  Start=%d samples, Dur=%d samples\n", 1, selSrcStartSamp, selSrcDurSamp)
            activeSelIdx += 1
        od
    endif
    printfi("\n", 1)

    ; --- Audio Modifications Loop ---
    printfi("------------ AUDIO MODIFICATIONS --------\n", 1)
    if modCnt == 0 then
        printfi("    [None]\n", 1)
    else
        modIdx:i = 0
        while modIdx < modCnt do
            modName:S = cabbageAraGet("audioModification.name", modIdx)
            modId:S   = cabbageAraGet("audioModification.persistentId", modIdx)

            printfi("[%d] '%s'\n", modIdx + 1, modIdx, modName)
            printfi("    Persistent ID: '%s'\n", 1, modId)
            modIdx += 1
        od
    endif
    printfi("\n", 1)

    ; --- Sources Loop ---
    printfi("------------ SOURCES ---------------------\n", 1)
    if srcCnt == 0 then
        printfi("    [None]\n", 1)
    else
        srcIdx:i = 0
        while srcIdx < srcCnt do
            name:S      = cabbageAraGet("audioSource.name", srcIdx)
            channels:i  = cabbageAraGet("audioSource.channels", srcIdx)
            sampCnt:i   = cabbageAraGet("audioSource.sampleCount", srcIdx)
            sr:i        = cabbageAraGet("audioSource.sampleRate", srcIdx)
            duration:i  = cabbageAraGet("audioSource.duration", srcIdx)
            regStart:i  = cabbageAraGet("audioSource.region.startInSamples", srcIdx)
            regDur:i    = cabbageAraGet("audioSource.region.durationInSamples", srcIdx)

            printfi("[%d] '%s'\n", srcIdx + 1, srcIdx, name)
            printfi("    Channels: %d\n", 1, channels)
            printfi("    Sample Rate: %d Hz\n", 1, sr)
            printfi("    Sample Count: %d\n", 1, sampCnt)
            printfi("    Duration: %.3fs\n", 1, duration)
            printfi("    Region: Start=%d, Duration=%d\n", 1, regStart, regDur)
            srcIdx += 1
        od
    endif
    printfi("=========================================\n", 1)

endin


</CsInstruments>
<CsScore>
i 1 0 z   ; run for the lifetime of the plugin
</CsScore>
</CsoundSynthesizer>