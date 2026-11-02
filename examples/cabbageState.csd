<Cabbage>
{
    "pluginId"      : "def1",
    "enableDevTools" : true,
    "channelConfig"  : [ {"name": "0 in 2 out", "ins": "0", "outs": "2"} ],
    "widgets"        : [
        {
            "type"    : "form",
            "id"      : "MainForm",
            "caption" : "Slider Example",
            "size"    : {"width": 461, "height": 482},
            "guiMode" : "queue",
            "channels": [ {"id": "formChannel"} ]
        },
        {
            "type"  : "csoundOutput",
            "bounds": {"left": 10, "top": 350, "width": 540, "height": 170},
            "style" : {
                "backgroundColor": "#222222",
                "border"         : "1px solid #444444",
                "color"          : "#dddddd",
                "fontSize"       : 8,
                "fontFamily"     : "courier new, monospace"
            }
        },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 9, "width": 60, "height": 48},
            "label"   : {"text": "Harmonic 1"},
            "style"   : { "label": {"fontColor": "#dddddd"}, "valueText": {"fontSize": 12} },
            "channels": [
                { "id": "harmonic1", "range": {"max": 1000} }
            ],
            "fullSave": true
        },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 77, "width": 60, "height": 48},
            "label"   : {"text": "Harmonic 2"},
            "style"   : { "label": {"fontColor": "#dddddd"}, "valueText": {"fontSize": 12} },
            "channels": [
                { "id": "harmonic2", "range": {"max": 1000} }
            ],
            "fullSave": true
        },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 145, "width": 60, "height": 48},
            "label"   : {"text": "Harmonic 3"},
            "style"   : { "label": {"fontColor": "#dddddd"}, "valueText": {"fontSize": 12} },
            "channels": [
                { "id": "harmonic3", "range": {"max": 1000} }
            ],
            "fullSave": true
        },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 212, "width": 60, "height": 48},
            "label"   : {"text": "Harmonic 4"},
            "style"   : { "label": {"fontColor": "#dddddd"}, "valueText": {"fontSize": 12} },
            "channels": [
                { "id": "harmonic4", "range": {"max": 1000} }
            ],
            "fullSave": true
        },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"top": 68, "width": 60, "height": 48},
            "label"   : {"text": "Harmonic 5"},
            "style"   : { "label": {"fontColor": "#dddddd"}, "valueText": {"fontSize": 12} },
            "channels": [
                { "id": "harmonic5", "range": {"max": 1000} }
            ],
            "fullSave": true
        },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 78, "top": 68, "width": 60, "height": 48},
            "label"   : {"text": "Harmonic 6"},
            "style"   : { "label": {"fontColor": "#dddddd"}, "valueText": {"fontSize": 12} },
            "channels": [
                { "id": "harmonic6", "range": {"max": 1000} }
            ],
            "fullSave": true
        },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 146, "top": 68, "width": 60, "height": 48},
            "label"   : {"text": "Harmonic 7"},
            "style"   : { "label": {"fontColor": "#dddddd"}, "valueText": {"fontSize": 12} },
            "channels": [
                { "id": "harmonic7", "range": {"max": 1000} }
            ],
            "fullSave": true
        },
        {
            "type"    : "rotarySlider",
            "bounds"  : {"left": 214, "top": 68, "width": 60, "height": 48},
            "label"   : {"text": "Harmonic 8"},
            "style"   : { "label": {"fontColor": "#dddddd"}, "valueText": {"fontSize": 12} },
            "channels": [
                { "id": "harmonic8", "range": {"max": 1000} }
            ],
            "fullSave": true
        },
        {
            "type"    : "csoundOutput",
            "id"      : "csoundOutput1",
            "bounds"  : {"left": 10, "top": 157, "width": 367, "height": 314},
            "channels": [
                { "id": "csoundOutput", "range": {"increment": 0.001} }
            ],
            "style"   : {
                "backgroundColor": "#222222",
                "fontFamily"     : "courier new, monospace",
                "fontSize"       : 12,
                "border"         : "1px solid #444444",
                "color"          : "#dddddd"
            }
        },
        {
            "type"       : "button",
            "bounds"     : {"top": 126, "width": 116, "height": 25},
            "channels"   : [
                { "id": "saveState", "range": {"increment": 0.001} }
            ],
            "persistence": {"preset": false, "session": false},
            "label"      : { "text": {"on": "Save State", "off": "Save State"} }
        },
        {
            "type"       : "button",
            "bounds"     : {"left": 261, "top": 126, "width": 116, "height": 25},
            "channels"   : [
                { "id": "loadState", "range": {"increment": 0.001} }
            ],
            "persistence": {"preset": false, "session": false},
            "label"      : { "text": {"on": "Load State", "off": "Load State"} }
        },
        {
            "type"       : "button",
            "bounds"     : {"left": 134, "top": 126, "width": 116, "height": 25},
            "channels"   : [
                { "id": "saveSelectedState", "range": {"increment": 0.001} }
            ],
            "persistence": {"preset": false, "session": false},
            "label"      : { "text": {"on": "Save Selected State", "off": "Save Selected State"} }
        },
        {
            "type"       : "button",
            "bounds"     : {"left": 281, "top": 75},
            "channels"   : [
                { "id": "randomise", "range": {"increment": 0.001} }
            ],
            "persistence": {"preset": false, "session": false},
            "label"      : { "text": {"on": "Randomise", "off": "Randomise"} }
        }
    ]
}

</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -+rtmidi=NULL -m0d -M0 --midi-key-cps=4 --midi-velocity-amp=5
</CsOptions>
<CsInstruments>
; Initialize the global variables.
ksmps = 32
nchnls = 2
0dbfs = 1

wavetable@global:i = ftgen(1, 0, 4096, 10, 1, .8, .6, .4, .2, 0.1, 0.01)
callsToReportValues@global:i init 0

/* Main signal generator. A bank of 8 oscillators */
instr MainSignal
    // Assign all channel values to a freqs array
    freqs:k[] init 8
    for index in [k(1),k(2),k(3),k(4),k(5),k(6),k(7),k(8)] do
        freqs[index-1] = cabbageGetValue:k(sprintfk("harmonic%d", index))
    od

    // Use new create/run opcode to create an array of oscillators and run them
    oscillators:Opcode[] = create(oscili, lenarray(freqs))
    oscBank:a[] = run(oscillators, 1, freqs, wavetable)
    oscMix:a = sumarray(oscBank)/lenarray(oscBank)

    out(oscMix, oscMix)

    randomButton:CabbageNumTrig = cabbageGetValue("randomise")
    if(randomButton.trig == 1) then
        event("i", "RandomiseColors", 0, 0.1)
        event("i", "RandomiseValues", 0.1, 0.1)
    endif
endin

/* Quickly randomise values */
instr RandomiseValues
    prints("Randomising values...\n")
    for index in [1, 2, 3, 4, 5, 6, 7, 8] do
        cabbageSetValue(sprintf("harmonic%d", index), random:i(50, 1000))
    od
    event_i("i", "ReportValues", 1, 0)
endin

/* Quickly randomise colors */
instr RandomiseColors
    prints("Randomising colors...\n")
    for index in [1, 2, 3, 4, 5, 6, 7, 8] do
        cabbageSet(sprintf("harmonic%d", index), "style.thumb.backgroundColor", sprintf("#%06x", random:i(0, 0xFFFFFF)))
    od
endin

/* Dedicated instrument for handling presets */
instr PresetManager
    saveAllButton:CabbageNumTrig = cabbageGetValue("saveState")
    saveSelectedButton:CabbageNumTrig = cabbageGetValue("saveSelectedState")
    loadButton:CabbageNumTrig = cabbageGetValue("loadState")

    if (saveAllButton.trig == 1) then
        event("i", "SaveState", 0, 0.1)
    endif

    if (saveSelectedButton.trig == 1) then
        event("i", "SaveSelectedState", 0, 0.1)
    endif

    if (loadButton.trig == 1) then
        event("i", "LoadState", 0, 0.1)
    endif

endin

/* Save all widget state for all widgets */
instr SaveState
    filename:S = sprintf("%s/savedState.json", chnget:S("CSD_PATH"))
    cabbageSaveState(filename)
endin

/* Save all widgets, but only save the full widget data for any widgets
in the fullSaveChannels array. */
instr SaveSelectedState
    filename:S = sprintf("%s/savedState.json", chnget:S("CSD_PATH"))
    fullSaveIndex:i init 0
    fullSaveChannels:S[] init 10
    channels:S[] = cabbageGetWidgets()
    prints("Number of widgets found: %d\n", lenarray(channels))


    for channel in channels do
        // Make sure key exists first (Csound && does not short-circuit)
        if(cabbageHasKey:i(channel, "fullSave") == 1) then
            if(cabbageGet:i(channel, "fullSave") == 1) then
                fullSaveChannels[fullSaveIndex] = channel
                fullSaveIndex += 1
            endif
        endif
    od

    prints("Number of channels with fullSave flag: %d\n", fullSaveIndex)
    cabbageSaveState(filename, fullSaveChannels)
endin

/* Load state data from file */
instr LoadState
    prints("Loading state...\n")
    filename:S = sprintf("%s/savedState.json", chnget:S("CSD_PATH"))
    cabbageLoadState(filename)
    event_i("i", "ReportValues", 1, 0)
endin

instr ReportValues
    prints("Current values: %d\n", callsToReportValues)
    callsToReportValues += 1
    for index in [1, 2, 3, 4, 5, 6, 7, 8] do
        prints("%f\n", cabbageGetValue(sprintf("harmonic%d", index)))
    od
endin
</CsInstruments>
<CsScore>
;causes Csound to run for about 7000 years...
i"MainSignal" 0 z
i"PresetManager" 0 z
</CsScore>
</CsoundSynthesizer>