
<Cabbage>
{
    "pluginId": "def1",
    "widgets": [
        {
            "type"    : "form",
            "id"      : "MainForm",
            "caption" : "Template Effect",
            "size"    : {"width": 640, "height": 380},
            "channels": [ {"id": "formChannel"} ]
        },
        {
            "//"      : "----------- Scrubber to indicate the current column being played ----------",
            "type"    : "image",
            "id"      : "scrubber",
            "bounds"  : {"left": 9, "top": 9, "width": 32, "height": 278},
            "channels": [
                { "id": "image130", "range": {"increment": 0.001} }
            ],
            "style"   : {"backgroundColor": "#0295cf28"},
            "zIndex"  : -1
        },
        {
            "//"      : "----------- A button to shuffle the grid pattern randomly ----------",
            "type"    : "button",
            "id"      : "randomBtn",
            "bounds"  : {"left": 9, "top": 334, "width": 100, "height": 30},
            "channels": [ {"id": "shuffle", "range": {}} ],
            "label"   : { "text": {"on": "Shuffle", "off": "Shuffle"} },
            "style"   : {
                "on"        : {"backgroundColor": "#ffa71e14", "textColor": "#ffffff"},
                "off"       : {"backgroundColor": "#ffa71e14", "textColor": "#ffffff"},
                "hover"     : {"backgroundColor": "#fbfbfb6d"},
                "fontFamily": "Arial",
                "fontSize"  : 10,
                "textAlign" : "centre"
            }
        },
        {
            "//"      : "---------- A button to start and stop the sequencer ----------",
            "type"    : "button",
            "id"      : "statStopBtn",
            "bounds"  : {"left": 9, "top": 298, "width": 100},
            "channels": [ {"id": "startStop", "range": {}} ],
            "label"   : { "text": {"on": "Stop", "off": "Start"} },
            "style"   : {
                "on"        : {"backgroundColor": "#ffa71e", "textColor": "#ffffff"},
                "off"       : {"backgroundColor": "#ffa71e14", "textColor": "#ffffff"},
                "hover"     : {"backgroundColor": "#fbfbfb2e"},
                "fontFamily": "Arial",
                "fontSize"  : 10,
                "textAlign" : "centre"
            }
        },
        {
            "//"      : "======== Number sliders to set the MIDI note ==========",
            "type"    : "numberSlider",
            "id"      : "numberSlider1",
            "bounds"  : {"left": 569, "width": 52, "height": 30},
            "channels": [
                { "id": "rowNote1", "range": {"defaultValue": 60, "increment": 1, "max": 72, "min": 48} }
            ],
            "style"   : { "label": {"fontSize": 12}, "valueText": {"fontColor": "#e3e3e3"} }
        },
        {
            "type"    : "numberSlider",
            "id"      : "numberSlider2",
            "bounds"  : {"left": 569, "top": 45, "width": 52, "height": 30},
            "channels": [
                { "id": "rowNote2", "range": {"defaultValue": 59, "increment": 1, "max": 72, "min": 36} }
            ],
            "style"   : { "label": {"fontSize": 12}, "valueText": {"fontColor": "#e3e3e3"} }
        },
        {
            "type"    : "numberSlider",
            "id"      : "numberSlider3",
            "bounds"  : {"left": 569, "top": 80, "width": 52, "height": 30},
            "channels": [
                { "id": "rowNote3", "range": {"defaultValue": 57, "increment": 1, "max": 72, "min": 36} }
            ],
            "style"   : { "label": {"fontSize": 12}, "valueText": {"fontColor": "#e3e3e3"} }
        },
        {
            "type"    : "numberSlider",
            "id"      : "numberSlider4",
            "bounds"  : {"left": 569, "top": 115, "width": 52, "height": 30},
            "channels": [
                { "id": "rowNote4", "range": {"defaultValue": 55, "increment": 1, "max": 72, "min": 36} }
            ],
            "style"   : { "label": {"fontSize": 12}, "valueText": {"fontColor": "#e3e3e3"} }
        },
        {
            "type"    : "numberSlider",
            "id"      : "numberSlider5",
            "bounds"  : {"left": 569, "top": 150, "width": 52, "height": 30},
            "channels": [
                { "id": "rowNote5", "range": {"defaultValue": 53, "increment": 1, "max": 72, "min": 36} }
            ],
            "style"   : { "label": {"fontSize": 12}, "valueText": {"fontColor": "#e3e3e3"} }
        },
        {
            "type"    : "numberSlider",
            "id"      : "numberSlider6",
            "bounds"  : {"left": 569, "top": 185, "width": 52, "height": 30},
            "channels": [
                { "id": "rowNote6", "range": {"defaultValue": 52, "increment": 1, "max": 72, "min": 36} }
            ],
            "style"   : { "label": {"fontSize": 12}, "valueText": {"fontColor": "#e3e3e3"} }
        },
        {
            "type"    : "numberSlider",
            "id"      : "numberSlider7",
            "bounds"  : {"left": 569, "top": 220, "width": 52, "height": 30},
            "channels": [
                { "id": "rowNote7", "range": {"defaultValue": 50, "increment": 1, "max": 72, "min": 36} }
            ],
            "style"   : { "label": {"fontSize": 12}, "valueText": {"fontColor": "#e3e3e3"} }
        },
        {
            "type"    : "numberSlider",
            "id"      : "numberSlider8",
            "bounds"  : {"left": 569, "top": 255, "width": 52, "height": 30},
            "channels": [
                { "id": "rowNote8", "range": {"defaultValue": 48, "increment": 1, "max": 72, "min": 36} }
            ],
            "style"   : { "label": {"fontSize": 12}, "valueText": {"fontColor": "#e3e3e3"} }
        },
        {
            "//"       : "----------- A slider to control BPM ----------",
            "type"     : "rotarySlider",
            "id"       : "bpmSlider",
            "bounds"   : {"left": 122, "top": 289, "width": 52},
            "channels" : [
                { "id": "bpmSlider", "range": {"defaultValue": 240, "increment": 1, "max": 360, "min": 1} }
            ],
            "label"    : {"text": "BPM", "align": "top", "offsetY": 3},
            "valueText": {"visible": true, "offsetY": -5},
            "style"    : {
                "thumb"    : {"backgroundColor": "#FF5252", "borderColor": "#2a2a2a", "borderWidth": 2},
                "track"    : {"width": 4, "fillColor": "#ededed"},
                "label"    : {"fontSize": 12},
                "valueText": {"fontSize": 12, "fontColor": "#e3e3e3"}
            }
        },
        {
            "//"       : "----------- A slider to control duration ----------",
            "type"     : "rotarySlider",
            "id"       : "durationSlider",
            "bounds"   : {"left": 258.5, "top": 289, "width": 54},
            "channels" : [
                { "id": "durationSlider", "range": {"defaultValue": 1, "increment": 0.1, "max": 10, "min": 0.1} }
            ],
            "label"    : {"text": "Note Dur.", "align": "top", "offsetY": 3},
            "valueText": {"visible": true, "offsetY": -5},
            "style"    : {
                "thumb"    : {"backgroundColor": "#FFB142", "borderColor": "#2a2a2a", "borderWidth": 2},
                "track"    : {"width": 4, "fillColor": "#ededed"},
                "label"    : {"fontSize": 12},
                "valueText": {"fontSize": 12, "fontColor": "#e3e3e3"}
            }
        },
        {
            "//"       : "----------- A slider to control probability ----------",
            "type"     : "rotarySlider",
            "id"       : "probabilitySlider",
            "bounds"   : {"left": 190.25, "top": 289, "width": 52},
            "channels" : [
                { "id": "probability", "range": {"defaultValue": 10, "increment": 1, "max": 100, "min": 1} }
            ],
            "label"    : {"text": "Prob.", "align": "top", "offsetY": 3},
            "valueText": {"offsetY": -5, "visible": true},
            "style"    : {
                "thumb"    : {"backgroundColor": "#2ED573", "borderColor": "#2a2a2a", "borderWidth": 2},
                "track"    : {"width": 4, "fillColor": "#ededed"},
                "label"    : {"fontSize": 12},
                "valueText": {"fontSize": 12, "fontColor": "#e3e3e3"}
            }
        },
        {
            "//"       : "----------- A slider to control delay ----------",
            "type"     : "rotarySlider",
            "id"       : "delaySlider",
            "bounds"   : {"left": 328.75, "top": 289, "width": 52},
            "channels" : [
                { "id": "delayTime", "range": {"defaultValue": 1, "increment": 0.01, "max": 4, "min": 0} }
            ],
            "label"    : {"text": "Del. Time", "align": "top", "offsetY": 3},
            "valueText": {"offsetY": -5, "visible": true},
            "style"    : {
                "thumb"    : {"backgroundColor": "#A55EEA", "borderColor": "#2a2a2a", "borderWidth": 2},
                "track"    : {"width": 4, "fillColor": "#ededed"},
                "label"    : {"fontSize": 12},
                "valueText": {"fontSize": 12, "fontColor": "#e3e3e3"}
            }
        },
        {
            "//"       : "----------- A slider to control delay feedback ----------",
            "type"     : "rotarySlider",
            "id"       : "feedbackSlider",
            "bounds"   : {"left": 397, "top": 289, "width": 52},
            "channels" : [
                { "id": "delayFeedback", "range": {"defaultValue": 0, "increment": 0.01, "max": 0.999, "min": 0} }
            ],
            "label"    : {"text": "Del. Fdbk.", "align": "top", "offsetY": 3},
            "valueText": {"offsetY": -5, "visible": true},
            "style"    : {
                "thumb"    : {"backgroundColor": "#1E90FF", "borderColor": "#2a2a2a", "borderWidth": 2},
                "track"    : {"width": 4, "fillColor": "#ededed"},
                "label"    : {"fontSize": 12},
                "valueText": {"fontSize": 12, "fontColor": "#e3e3e3"}
            }
        },
        {
            "//"         : "----------- A checkbox to enable auto shuffling ----------",
            "type"       : "checkBox",
            "id"         : "checkBox145",
            "bounds"     : {"left": 514, "top": 331, "width": 107, "height": 16},
            "channels"   : [ {"id": "autoShuffle", "range": {}} ],
            "label"      : {"text": "Auto Shuffle"},
            "style"      : {
                "off"      : {"textColor": "#dddddd"},
                "on"       : {"textColor": "#ffffff", "backgroundColor": "#ffa71e"},
                "textAlign": "right"
            },
            "persistence": {"preset": false}
        },
        {
            "//"         : "----------- A button to save the current state to a file ----------",
            "type"       : "button",
            "id"         : "saveStateBtn",
            "bounds"     : {"left": 462, "top": 297, "width": 76},
            "channels"   : [ {"id": "saveStateBtn", "range": {}} ],
            "label"      : { "text": {"on": "Save Preset", "off": "Save Preset"} },
            "style"      : {
                "on"        : {"backgroundColor": "#ffa71e", "textColor": "#ffffff"},
                "off"       : {"backgroundColor": "#ffa71e14", "textColor": "#ffffff"},
                "hover"     : {"backgroundColor": "#fbfbfb2e"},
                "fontFamily": "Arial",
                "fontSize"  : 10,
                "textAlign" : "centre"
            },
            "persistence": {"preset": false}
        },
        {
            "//"         : "----------- A combo box to load presets ----------",
            "type"       : "comboBox",
            "bounds"     : {"left": 546, "top": 296, "width": 76},
            "channels"   : [
                { "id": "presetCombo", "range": {"increment": 0.001, "max": 1}, "type": "string" }
            ],
            "style"      : {
                "backgroundColor": "#0295cf28",
                "borderColor"    : "#0295cf28",
                "borderRadius"   : 4,
                "borderWidth"    : 0
            },
            "persistence": {"preset": false},
            "populate"   : {"fileType": ".json", "labelWhenEmpty": "No Presets", "defaultLabel": "Load Preset"},
            "automatable": false
        }
    ]
}

</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d -m0d
</CsOptions>
<CsInstruments>
ksmps = 32
nchnls = 2
0dbfs = 1

numRows@global:i = 8
numCols@global:i = 16
presetDirectory@global:S = strcat(chnget:S("CSD_PATH"), "/Presets")
struct CabbageButton val:k, trig:k

/*------------------------------------------------*/
/* Create the 16x8 grid of checkboxes dynamically */
/*------------------------------------------------*/
instr CREATE_GRID

    // Populate the preset combo box with files from the presets directory
    cabbageSet "presetCombo", "populate.directories", presetDirectory

    x:i, y:i init 0
    widgetCount:i init 0
    while y < 8 do
        while x < 16 do
            SWidget = sprintf({{
            {
            "type": "checkBox",
            "bounds":{"left":%d, "top":%d, "width":30, "height":30},
            "channels": [{"id": "check%d"}],
            "style": {
            "on": {"backgroundColor": "#ffa71e"},
            "off": {"backgroundColor": "#d5d5d5ff"}
            },
            "automatable":false
            }
            }}, 10+x*35, 10+y*35, widgetCount)
            cabbageCreate(SWidget)
            widgetCount += 1
            x += 1
        od
        x = 0
        y += 1
    od
endin

/*---------------------------------------*/
/* Main sequencer instrument - always on */
/*---------------------------------------*/
instr SEQUENCER
    canShuffle:k init 0
    column:k init 0
    scrubberPos:k init 0
    beatCount:k init 0
    bpm:k = cabbageGetValue("bpmSlider")
    startStop:CabbageButton init 0, 0
    startStop.val, startStop.trig = cabbageGetValue("startStop")
    noteDuration:k = cabbageGetValue("durationSlider")
    autoShuffle:k = cabbageGetValue("autoShuffle")

    if(startStop.val == 1) then
        if metro:k(bpm/60)==1 then
            row:k = 0
            while row<numRows do
                checkNum:k = column + row*numCols
                val:k = cabbageGetValue(sprintfk("check%d", checkNum))
                if val == 1 then
                    note:k = cabbageGetValue(sprintfk("rowNote%d", row+1))
                    event("i", "SYNTH", 0, noteDuration, note, .1)
                endif
                row = row+1
            od

            if(cabbageGetValue:k("autoShuffle")==1 && (beatCount % (numCols*2) == 0)) then
                event("i", "SHUFFLE", 0, .1)
            endif

            beatCount = beatCount + 1
            cabbageSet(1, "scrubber", "bounds.left", (column*35+9))
            column = (beatCount) % numCols

        endif

    endif

    save:CabbageButton init 0, 0
    save.val, save.trig = cabbageGetValue("saveStateBtn")
    if save.trig==1 then
        event("i", "SAVE_PRESET", 0, .1)
    endif

    loadPreset:S, loadPresetTrig:k = cabbageGetValue("presetCombo")
    if loadPresetTrig==1 then
        event("i", "LOAD_PRESET", 0, .1)
    endif

    shuffle:CabbageButton init 0, 0
    shuffle.val, shuffle.trig = cabbageGetValue("shuffle")
    if shuffle.trig==1 then
        event("i", "SHUFFLE", 0, .1)
    endif

endin

/*-----------------*/
/* Simple FM Synth */
/*-----------------*/
instr SYNTH

    freq:i = cpsmidinn(p4)
    p3 = rnd(p3)+0.1
    duration:i = p3
    aOp2 = oscili(expsegr(0.001, .001, 8, 1*duration, 0.005, 0.3, 0.001), freq*14)
    aOp1 = oscili(expsegr(0.001, .001, p5, 10*duration, 0.5, 0.3, 0.001), aOp2+(freq*1.002))
    aOp4 = oscili(expsegr(0.001, .001, 7, 15*duration, 0.0001, 0.3, 0.001)*freq, freq*7)
    aOp3 = oscili(expsegr(0.001, .001, p5, 15*duration, 0.5, 0.3, 0.001), aOp4+freq)
    aOp6 = oscili(expsegr(0.001, .001, 6, 15*duration, 0.0001, 0.3, 0.00001)*freq, freq*1.003)
    aOp5 = oscili(expsegr(0.001, .001, p5, 20*duration, 0.5, 0.3, 0.00001), aOp6+(freq*1.003))
    fmMix:a = (aOp1+aOp3+aOp5)*.25
    filter:a = moogladder(fmMix, rnd(15000), rnd(.8))
    pan:i = rnd(1)
    outs(filter*pan, filter*(1-pan))
    chnmix(filter, "synthOut")

endin

/*--------------------------------------------------------*/
/* Simple delay effect acting on output signal from Synth */
/*--------------------------------------------------------*/

instr DELAY

    bpm:k = cabbageGetValue("bpmSlider") / 60
    delayTimeSlider:k = cabbageGetValue("delayTime")
    delayTime:a = upsamp(delayTimeSlider * (1 / bpm))
    delayFeedback:k = cabbageGetValue("delayFeedback")
    mute:k = port(changed(bpm)+changed(delayTimeSlider), 0.1)
    synthSignal:a = chnget("synthOut")


    delay:a = flanger(synthSignal, delayTime, delayFeedback, 10)
    delay *= (1 - mute)
    outs(delay, delay)

    chnclear("synthOut")

endin

/* Shuffle the grid pattern and notes randomly */
instr SHUFFLE

    notes:i[] = [36, 38, 40, 42, 43, 45, 47, 48, 50, 52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81, 83, 84]
    numNotes:i = lenarray(notes)
    index:i init 0
    probability:i = cabbageGetValue("probability")

    while index < 128 do
        randVal:i = rnd(100) > 100-probability ? 1 : 0
        checkChannel:S = sprintfk("check%d", index)
        cabbageSetValue:i(checkChannel, randVal)
        index += 1
    od

    index = 0
    while index< numRows do
        noteChannel:S = sprintfk("rowNote%d", index+1)
        cabbageSetValue(noteChannel, notes[rnd(numNotes)])
        index += 1
    od

endin

/*----------------------------------------------*/
/* Save the current state to a JSON preset file */
/*----------------------------------------------*/
instr SAVE_PRESET

    fileName:S = cabbageCreateFileName(presetDirectory, ".json")
    cabbageSaveState(fileName)
    cabbageSet "presetCombo", "populate.directories", presetDirectory

endin

/* Load a preset from a selected file in the combo box */
instr LOAD_PRESET
    items:S[] = cabbageGet("presetCombo", "items")
    currentItem:S = cabbageGetValue("presetCombo")
    printf_i("Current preset is: %s", 1, currentItem)

    index:i = 0
    while (index < lenarray(items)) do
        res:i = strindex(items[index], currentItem)
        if(res != -1) then
            printf_i("Current preset is: %s at index %d", 1, items[index], index)
            cabbageLoadState(items[index])
        endif
        index += 1
    od
endin

</CsInstruments>
<CsScore>
i"CREATE_GRID" 0 0.1
i"SEQUENCER" .1 z
i"DELAY" .1 z
</CsScore>
</CsoundSynthesizer>