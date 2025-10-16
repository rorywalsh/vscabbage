
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
form caption("pdhalf/pdhalfy") size(690,115), pluginId("pdcl"), guiMode("queue")
#define DIAL_STYLE  trackerInsideRadius(0.8), textColour("white"), fontColour("white"), colour(5, 30,80), trackerColour(155,155,225), outlineColour(30,30,50), valueTextBox(1)

rslider      bounds( 10, 10, 90, 90), text("Shape Amount"),  channel("ShapeAmount"), range(-1, 1, 0), $DIAL_STYLE

label        bounds(110, 10, 80, 13), text("Opcode"), align("centre"), fontColour("white")
combobox     bounds(110, 25, 80, 20), channel("Opcode"), items("pdhalf","pdhalfy"), value(1)

label        bounds(110, 55, 80, 13), text("Polarity"), align("centre"), fontColour("white")
combobox     bounds(110, 70, 80, 20), channel("Polarity"), items("Unipolar","Bipolar"), value(1)

image        bounds(210, 10,115, 95), colour(0,0,0,0)
{
label        bounds(  5, 10, 10, 12), text("1"), align("left"), fontColour(205,205,205)
label        bounds(  5, 47, 10, 12), text("0"), align("left"), fontColour(205,205,205)
label        bounds(  0, 83, 15, 12), text("-1"), align("left"), fontColour(205,205,205)
label        bounds( 15,  0,100, 12), text("Phase Pointer"), fontColour(255,255,255)
gentable     bounds( 15, 15,100, 76), tableNumber(1), channel("PhasorTable"), ampRange(-1,1,1), tableColour(160,160,220), fill(0)
image        bounds( 15, 53,100,  1), colour(100,100,100) ; x axis
}

image        bounds(342,  0,  1,115), alpha(0.3)

image        bounds(350, 10,115, 95), colour(0,0,0,0)
{
label        bounds(  5, 10, 10, 12), text("1"), align("left"), fontColour(205,205,205)
label        bounds(  5, 47, 10, 12), text("0"), align("left"), fontColour(205,205,205)
label        bounds(  0, 83, 15, 12), text("-1"), align("left"), fontColour(205,205,205)
label        bounds( 15,  0,100, 12), text("Output"), fontColour(255,255,255)
gentable     bounds( 15, 15,100, 76), tableNumber(2), channel("DistTable"), ampRange(-1,1,2), tableColour(160,160,220), fill(0)
image        bounds( 15, 53,100,  1), colour(100,100,100) ; x axis
}

checkbox     bounds(470, 25, 70, 15), channel("Wrap"), text("Wrap"), value(0), fontColour:0("white"), fontColour:1("white")

rslider      bounds(510, 10, 90, 90), text("Freq."),  channel("Freq"), range(10, 2000, 200, 0.5), $DIAL_STYLE
rslider      bounds(590, 10, 90, 90), text("Level"),  channel("Level"), range(0, 1, 0.1, 0.5), $DIAL_STYLE

label        bounds(  4,102,120, 11), text("Iain McCurdy |2024|"), align("left"), fontColour(200,200,200)

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