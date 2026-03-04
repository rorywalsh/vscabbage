
<Cabbage>
[
    { "type": "form", "caption": "Template Effect", "size": {"width": 580, "height": 370}, "pluginId": "def1" },
    {
        "type"    : "image",
        "id"      : "scrubber",
        "bounds"  : {"left": 9, "top": 9, "width": 32, "height": 278},
        "channels": [
            { "id": "image130", "range": {"increment": 0.001} }
        ],
        "style"   : {"backgroundColor": "#0295cffd"},
        "zIndex"  : -1
    },
    {
        "type"    : "horizontalSlider",
        "id"      : "horizontalSlider133",
        "bounds"  : {"top": 297, "width": 233, "height": 30},
        "channels": [
            { "id": "bpmSlider", "range": {"defaultValue": 60, "increment": 1, "max": 320} }
        ],
        "label"   : {"text": "BPM"}
    },
    {
        "type"    : "button",
        "id"      : "randomBtn",
        "bounds"  : {"left": 254, "top": 297, "width": 100},
        "channels": [ {"id": "shuffle", "range": {}} ],
        "label"   : { "text": {"on": "Shuffle", "off": "Shuffle"} }
    }
]

</Cabbage>
<CsoundSynthesizer>
<CsOptions>
-n -d
</CsOptions>
<CsInstruments>
ksmps = 32
nchnls = 2
0dbfs = 1

struct CabbageButton val:k, trig:k

instr 1

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

    notes:i[] = [48, 50, 52, 53, 55, 57, 59, 60, 62]
    column:k init 0
    scrubberPos:k init 0
    numRows:i = 8
    numCols:i = 16
    bpm:k = cabbageGetValue("bpmSlider")

    if metro:k(bpm/60)==1 then
        row:k = 0
        while row<numRows do
            checkNum:k = column + row*numCols
            val:k = cabbageGetValue(sprintfk("check%d", checkNum))
            if val == 1 then
                event("i", "Synth", 0, 1, chnget:k("octave")+notes[7-row], .3)
            endif
            row = row+1
        od
        cabbageSet(1, "scrubber", "bounds.left", (column*35+9))
        column = (column+1) % numCols
    endif

    shuffle:CabbageButton init 0, 0
    shuffle.val, shuffle.trig = cabbageGetValue("shuffle")
    if shuffle.trig==1 then
        event("i", "SHUFFLE", 0, .5)
    endif
endin

instr Synth
    print p4
    aEnv = expon(p5, p3, 0.01)
    aOut = oscil(aEnv, cpsmidinn(p4))
    outs(aOut, aOut)
endin

instr SHUFFLE
    prints "Shuffling hits"
    index:i init 0

    while index < 128 do
        randVal:i = rnd(100) > 80 ? 1 : 0
        SChannel = sprintfk("check%d", index)
        cabbageSetValue:i(SChannel, randVal)
        index += 1
    od
endin
</CsInstruments>
<CsScore>
f1 0 4096 10 1 .5 .25 .17
i1 0 z
</CsScore>
</CsoundSynthesizer>