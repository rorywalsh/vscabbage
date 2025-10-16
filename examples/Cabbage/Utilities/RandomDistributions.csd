	
/* Attribution-NonCommercial-ShareAlike 4.0 International
Attribution - You must give appropriate credit, provide a link to the license, and indicate if changes were made. You may do so in any reasonable manner, but not in any way that suggests the licensor endorses you or your use.
NonCommercial - You may not use the material for commercial purposes.
ShareAlike - If you remix, transform, or build upon the material, you must distribute your contributions under the same license as the original.
https://creativecommons.org/licenses/by-nc-sa/4.0/legalcode */

; RandomDistributions.csd
; written by Iain McCurdy 2024

; Graphical print outs of Csound's random distribution opcodes by accumulation of the results they output.
; All of these can output at i, k or a-rate. 
; In this example random values are output at k-rate and written to a function table which is subsequently sent to a gentable widget.
; Random numbers are generate at control rate and in this example this is set to the same as the audio sample rate (ksmps = 1). 
;  If you find this is causing the example to struggle running in real-time on your computer, increase ksmps to, for example, ksmps = 16.

; This distribution that is displayed is always normalised so the maximum will not exceed the visible limit of the GUI gentable.
; The longer a particular distribution is run (the more members populate the distribution), the closer it approaches its ideal distribution.

; A simple sonification of the distribution is implemented. The distribution applies a spectral envelope over an array of tones from low pitch to high pitch.

; The various opcodes need different input controls (the opcode input arguments) to adjust the distribution. 
;  These controls are shown/hidden depending on what distribution/opcode is chosen.

; The opcodes featured are:
; 1. Uniform Distribution (unirand)               -   uniform unipolar distribution
; 2. Linear Distribution (linrand)                -   linear decaying probability unipolar distribution
; 3. Triangular Distributon (trirand)             -   triangular bipolar distribution
; 4. Unipolar Exponential Distribution (exprand)  -   unipolar exponential distribution. 
;                                                     Lambda represents the average. 
;                                                     Maximum will tend to be about 15 times greater than lambda.
; 5. Bipolar Exponential Distribution (bexprand)  -   bipolar exponential distribution. 
;                                                     Average should be zero. 
;                                                     Maximum will tend to be about 15 times (+/-) greater than lambda.
; 6. Gaussian Distribution (gauss 1 parameter)    -   gaussian bell-curve distribution (bipolar). 
;                                                     Maximum and minimum will be slightly beyond +/- range.
; 7. Gaussian Distribution (gauss 2 parameters)   -   an alternative gaussian bell-curve distribution (unipolar).
; 8. Cauchy Distribution (cauchy)                 -   cauchy (or lorentz) distribution. Bipolar. 
;                                                     Values will never exceed +/- alpha.
; 9. Positive-Only Cauchy Distribution (pcauchy)  -   cauchy (or lorentz) distribution. Unipolar. 
;                                                     Values will never exceed +/- alpha.
; 10. Poisson Distribution (poisson)              -   gives the probability of a discrete (i.e., countable) outcomes, such as liklihood of catching a fish after a given time. 
;                                                     This opcode will only output integers. lambda represents the average.
; 11. Beta Distribution (betarand)                -   a range of distribution shapes are possible with the Beta distribution formula. 
;                                                     Beta controls the bias toward the minimum limit of the distribution. 
;                                                     Alpha controls the bias toward the maximum limit of the distribution.
; 12. Weibull Distribution (weibull)              -   used to model things like time-to-failure of components or average time a person spends on a web page.
;                                                     Sigma controls the width the the distribution.
;                                                     Tau controls the timing bias of the peak of the distribution.

; A detailed explanation of these distributions can e found in:
;  C. Dodge - T.A. Jerse 1985. Computer music. Schirmer books. pp.265 - 286 
;  D. Lorrain. A panoply of stochastic cannons. In C. Roads, ed. 1989. Music machine . Cambridge, Massachusetts: MIT press, pp. 351 - 379.  

; Note that maximum and minimum values shown in the number boxes can exceed the range displayed in the gentable.
;  Values that would exceed the range of the table are not written into the display table.

; The distribution contents are always emptied when a new opcode is selected or if any of the distribution input parameters are changed.

; Hovering over the table will reveal the value and probability at that location. Note that this is only update when the mouse moves.



; RUN/STOP       -  start and stop generation of random numbers

; I N P U T
; Range          -  range of random numbers to be generated. In both positive and negative domains if a bipolar distribution is selected. (1,2,3, 5,6)
; Lambda         -  range control (but not an absolute limit) for exprand and poisson. It actually provides the average. (4, 9)
; Mean           -  mean value of the distribution (gauss - 2 parameter)
; Standard Dev.  -  standard deviation of the distribution
; Alpha (Cauchy) -  maximum amplitude (both positive and negative) of the Cauchy distribution
; Alpha (Beta)   -  upper limit bias in the beta distribution
; Beta           -  lower limit bias in the beta distribution
; Scale          -  scale (by simple multiplication) the random numbers generated by the opcodes
; Sigma          -  width of the Weibull distribution
; Tau            -  controls the timing bias of the peak of the distribution.
; Offset         -  offset (by adding this value) the random numbers generated by the opcodes

; O U T P U T
; Number of Vals.-  number of values generated for the current distribution graph.
; Current Val.   -  the most recent value generated. These change very quickly so press stop to examine an individual value.
; Minimum        -  running minimum of the entire sequence of values in the current distribution graph. (Includes values beyond the display range of the  unnormalised distribution graph)
; Maximum        -  running maximum of the entire sequence of values in the current distribution graph. (Includes values beyond the display range of the  unnormalised distribution graph)
; Average        -  average of the entire sequence of values in the current distribution graph. (Includes values beyond the display range of the  unnormalised distribution graph.)

; M O U S E   H O V E R
; Hovering over the graph allows an individual X location of the graph to be examined
; Probability    -  probability (range 0 to 1) of the currently hovered-over value.
; Value          -  currently hovered-over value.

; S O N I F I C A T I O N
; On/Off         -  turn the sonification on or off
; Level          -  amplitude on the sonification
; Spread         -  scale the spread of pitches (1 = a spread of -1 octave to +1 octave)
; Shift          -  shift the entire distribution of notes up or down in octaves

<Cabbage>
form caption("Random Distributions"), size(810,420), colour( 50, 50, 50), pluginId("spec"), guiMode("queue")

button   bounds(105, 25, 45, 20), channel("run"), text("RUN"), value(1), colour:0(0,60,0), colour:1(0,200,0), radioGroup(1)
button   bounds(155, 25, 45, 20), channel("stop"), text("STOP"), value(0), colour:0(60,0,0), colour:1(200,0,0), radioGroup(1)

label    bounds(255,  3,300, 15), text("D I S T R I B U T I O N    ( O P C O D E )"), align("centre"), fontColour("silver")
combobox bounds(255, 20,300, 25), channel("opcode"), items("1. Uniform Distribution (unirand)","2. Linear Distribution (linrand)","3. Triangular Distributon (trirand)","4. Unipolar Exponential Distribution (exprand)","5. Bipolar Exponential Distribution (bexprand)","6. Gaussian Distribution (gauss 1 parameter)","7. Gaussian Distribution (gauss 2 parameters)","8. Cauchy Distribution (cauchy)","9. Positive Cauchy (pcauchy)","10. Poisson Distribution (poisson)","11. Beta Distribution (betarand)","12. Weibull Distribution (weibull)"), value(6)

;image    bounds(103, 48, 604,304), outlineThickness(2), outlineColour("silver"), corners(2)
gentable bounds(105, 50, 600,300), tableNumber(1), tableBackgroundColour("white"), tableGridColour(0,0,0,20), tableColour(20,20,100,200), fill(0), outlineThickness(1), channel("randDistr"), ampRange(0,1,1)


image    bounds(  1, 50, 99,300), outlineThickness(1), colour(0,0,0,0)
{
label   bounds(  4,  5, 91, 13), text("I N P U T")
nslider bounds(  4, 20, 91, 35), channel("range"), range(0,4,1), text("Range")

nslider bounds(  4, 20, 91, 35), channel("lambda"), range(0,100,0.1), text("Lambda"), visible(0)

nslider bounds(  4, 60, 91, 35), channel("alpha"), range(0,100,1), text("Alpha"), visible(0)

nslider bounds(  4, 20, 91, 35), channel("mean"), range(0,100,1), text("Mean"), visible(0)
nslider bounds(  4, 60, 91, 35), channel("sdev"), range(0,100,1), text("Standard Dev."), visible(0)

nslider bounds(  4,100, 91, 35), channel("beta"), range(0,100,1), text("Beta"), visible(0)

nslider bounds(  4, 20, 91, 35), channel("sigma"), range(0,100,0.1), text("Sigma"), visible(0)
nslider bounds(  4, 60, 91, 35), channel("tau"), range(0,100,1), text("Tau"), visible(0)

; nslider bounds(  5,225, 95, 35), channel("scale"), range(0.01,1,1), text("Scale"), visible(1)
; nslider bounds(  5,265, 95, 35), channel("offset"),range(0,10,0), text("Offset"), visible(1)
}

image    bounds(708, 50, 99,300), outlineThickness(1), colour(0,0,0,0)
{
label    bounds(4,  5, 91, 13), text("O U T P U T")

nslider bounds(4, 30, 91, 35), channel("NVals"), range(0,99999999999999,0,1,1), text("Number of Vals.")
nslider bounds(4, 70, 91, 35), channel("curVal"), range(-1000,1000,0,1,0.0001), text("Current Val.")
nslider bounds(4,130, 91, 35), channel("min"), range(-1000,1000,0,1,0.0001), text("Min")
nslider bounds(4,170, 91, 35), channel("max"), range(-1000,1000,0,1,0.0001), text("Max")
nslider bounds(4,230, 91, 35), channel("avg"), range(-1000,1000,0,1,0.0001), text("Average")
}

image   bounds(105,355,210, 60), outlineThickness(1), colour(0,0,0,0)
{
label   bounds(  0,  2,210, 13), text("M O U S E   H O V E R")
nslider bounds(  5, 20, 95, 35), channel("MHprob"), range(0,1,0,1,0.0001), text("Probability")
nslider bounds(110, 20, 95, 35), channel("MHval"), range(-1000,1000,0,1,0.0001), text("Value")
}

image   bounds(320,355,385, 60), outlineThickness(1), colour(0,0,0,0)
{
label    bounds(  0,  2,380, 13), text("S O N I F I C A T I O N")
checkbox bounds( 10, 20, 65, 15), channel("sonification"), text("On/Off"), value(0), colour:0(80,80,0), colour:1(250,250,0)
nslider  bounds( 80, 20, 95, 35), channel("level"), range(0,1,1,1), text("Level")
nslider  bounds(180, 20, 95, 35), channel("shift"),  range(-3,3,0,1), text("Shift")
nslider  bounds(280, 20, 95, 35), channel("spread"), range(0,3,1,1), text("Spread")
}

image     bounds(405, 50,   2,300), channel("YAxis"), colour(100,100,100,100)

label    bounds(  2,404,100, 11), text("Iain McCurdy |2024|"), align("left"), fontColour("silver")

</Cabbage>                                                   

<CsoundSynthesizer>                                                                                                 

<CsOptions>                                                     
-dm0 -n
</CsOptions>
                                  
<CsInstruments>

; sr set by host
ksmps  =  1
nchnls =  2
0dbfs  =  1

giTabSize           =                   512
girandDistr         ftgen               1, 0, giTabSize, 10, 0 ; table that is sent to gentable (normalised)
gibufferTable       ftgen               2, 0, giTabSize, 10, 0 ; Csound storage of the distribution (unnormalised)
giempty             ftgen               3, 0, giTabSize, 10, 0 ; table full of zeros. Copied to distribution table when they need to be wiped.

instr  1

; READ IN WIDGETS
kopcode             cabbageGetValue     "opcode"
kstop               cabbageGetValue     "stop"
krange              cabbageGetValue     "range"
klambda             cabbageGetValue     "lambda"
kalpha              cabbageGetValue     "alpha"
kmean               cabbageGetValue     "mean"
ksdev               cabbageGetValue     "sdev"
kbeta               cabbageGetValue     "beta"
ksigma              cabbageGetValue     "sigma"
ktau                cabbageGetValue     "tau"
kscale              cabbageGetValue     "scale"
koffset             cabbageGetValue     "offset"

; INITIALISE SOME VARIABLES THAT WILL NEXT BE USED AS INPUTS
kNVals,kmax,ksum,kavg  init             0
kmin                init                1000


; macro to hide all optional widgets
#define HIDE_ALL
#
                    cabbageSet          k(1),"range","visible",0
                    cabbageSet          k(1),"lambda","visible",0
                    cabbageSet          k(1),"alpha","visible",0
                    cabbageSet          k(1),"mean","visible",0
                    cabbageSet          k(1),"sdev","visible",0
                    cabbageSet          k(1),"beta","visible",0
                    cabbageSet          k(1),"sigma","visible",0
                    cabbageSet          k(1),"tau","visible",0
#

; hide all distribution inputs first when a new opcode/distribution is selected
if changed:k(kopcode)==1 then
 $HIDE_ALL
endif

; RESTART RUN IF A NEW DISTRIBUTION IS SELECTED
if changed:k(kopcode)==1 then
 cabbageSetValue "run",k(1)
endif

giunirand           =                   1
gilinrand           =                   2
gitrirand           =                   3
giexprand           =                   4
gibexprnd           =                   5
gigauss1            =                   6
gigauss2            =                   7
gicauchy            =                   8
gipcauchy           =                   9
gipoisson           =                   10
gibetarand          =                   11
giweibull           =                   12

; generate random values according to the opcode/distribution chosen
if kopcode==1 then
                    cabbageSet          k(1), "range", "visible", 1
                    cabbageSetValue     "range", 1, changed:k(kopcode)
 kval               unirand             krange
elseif kopcode==2 then
                    cabbageSet          k(1), "range", "visible", 1
                    cabbageSetValue     "range", 1,changed:k(kopcode)
 kval               linrand             krange
elseif kopcode==3 then
                    cabbageSet          k(1), "range", "visible", 1
                    cabbageSetValue     "range", 1,changed:k(kopcode)
 kval               trirand             krange
elseif kopcode==4 then
                    cabbageSet          k(1), "lambda", "visible", 1
                    cabbageSetValue     "lambda", 0.1,changed:k(kopcode)
 kval               exprand             klambda 
elseif kopcode==5 then
                    cabbageSet          k(1), "range", "visible", 1
                    cabbageSetValue     "range", 0.1, changed:k(kopcode)
 kval               bexprnd             krange 
elseif kopcode==6 then ; gauss 1
                    cabbageSet          k(1), "range", "visible", 1
                    cabbageSetValue     "range", 1,changed:k(kopcode)
 kval               gauss               krange
elseif kopcode==7 then ; gauss 2
                    cabbageSet          k(1), "mean", "visible", 1
                    cabbageSet          k(1), "sdev", "visible", 1
                    cabbageSetValue     "mean", 0.5, changed:k(kopcode)
                    cabbageSetValue     "sdev", 0.1, changed:k(kopcode)
 kval               gauss               kmean, ksdev 
elseif kopcode==8 then
                    cabbageSet          k(1), "alpha", "visible", 1
                    cabbageSetValue     "alpha", 20,changed:k(kopcode)
 kval               cauchy              kalpha
elseif kopcode==9 then
                    cabbageSet k(1),    "alpha", "visible", 1
                    cabbageSetValue     "alpha", 1, changed:k(kopcode)
kval                pcauchy             kalpha
elseif kopcode==10 then
                    cabbageSet k(1),    "lambda", "visible", 1
                    cabbageSetValue     "lambda", 5,changed:k(kopcode)
 kval               poisson             klambda
elseif kopcode==11 then
                    cabbageSet          k(1), "range", "visible", 1
                    cabbageSet          k(1), "alpha", "visible", 1
                    cabbageSet          k(1), "beta", "visible", 1
                    cabbageSetValue     "range", 1, changed:k(kopcode)
                    cabbageSetValue     "alpha", 1.5, changed:k(kopcode)
                    cabbageSetValue     "beta", 4, changed:k(kopcode)
kval                betarand            krange, kalpha, kbeta 
elseif kopcode==12 then
                    cabbageSet k(1),    "sigma", "visible", 1
                    cabbageSet k(1),    "tau", "visible", 1
                    cabbageSetValue     "sigma", 0.1, changed:k(kopcode)
                    cabbageSetValue     "tau", 2, changed:k(kopcode)
kval                weibull             ksigma, ktau
endif

; offset and scaling
;kval                *=                  kscale
;kval                +=                  koffset

; MAXIMUM, MINIMUM, AVERAGE
if kstop==0 then
 kmax                =                   kval > kmax ? kval : kmax
                     cabbageSetValue     "max",kmax,changed:k(kmax)
 
 kmin                =                   kval < kmin ? kval : kmin
                     cabbageSetValue     "min",kmin,changed:k(kmin)
 ksum                +=                  kval
 kavg                =                   ksum/kNVals
 kNVals              +=                  1                                  ; increment number of values counter
                     cabbageSetValue     "avg",kavg,changed:k(kavg)
                     cabbageSetValue     "curVal", kval
                     cabbageSetValue     "NVals", kNVals                      
endif


; NORMALISED MOUSE POSITION AND IN_TAB FLAG
iTableBounds[]      cabbageGet          "randDistr", "bounds"
iTabX               =                   iTableBounds[0]
iTabY               =                   iTableBounds[1]
iTabWid             =                   iTableBounds[2]
iTabHei             =                   iTableBounds[3]
kMOUSE_X            cabbageGetValue     "MOUSE_X"
kMOUSE_Y            cabbageGetValue     "MOUSE_Y"
kInTabFlag          =                   ( kMOUSE_X>=iTabX && kMOUSE_X<=(iTabX+iTabWid) && kMOUSE_Y>=iTabY && kMOUSE_Y<=(iTabY+iTabHei) ) ? 1 : 0
; normalised location within table
kMouseTabX          limit               (kMOUSE_X-iTabX)/iTabWid, 0, 1




; SCALING, SHIFTING, printing mouse-hover value, move y-axis
if kopcode==gitrirand || kopcode==gibexprnd || kopcode==gigauss1 || kopcode==gicauchy then ; bipolar
  kval              =                   kval*0.5 + 0.5
                    cabbageSet          changed:k(kopcode),"YAxis","bounds",405,50,2,300
 ; mouse-hover value
  cabbageSetValue "MHval", (kMouseTabX*2)-1, kInTabFlag * changed:k(kMOUSE_X)
elseif kopcode==gipoisson then                                       ; poisson shifted
 kval               /=                  klambda*10
                    cabbageSet          changed:k(kopcode),"YAxis","bounds",105,50,2,300
 ; mouse-hover value
  cabbageSetValue "MHval", kMouseTabX*(klambda*10), kInTabFlag * changed:k(kMOUSE_X)
else                                                         ; unipolar (no transformation of range)
                    cabbageSet          changed:k(kopcode),"YAxis","bounds",105,50,2,300
 ; mouse-hover value
  cabbageSetValue "MHval", kMouseTabX, kInTabFlag * changed:k(kMOUSE_X)
endif




kMetro  metro 16   ; used to moderate rate of updates

; RESET TABLE ETC.
if kMetro==1 then
 if changed:k(kopcode,krange,klambda,kalpha,kmean,ksdev,kbeta,ksigma,ktau,kscale,koffset)==1 then  
                     tablecopy           gibufferTable,giempty         ; clear table
  kNVals             =                   0
  kmax               =                   0
  kmin               =                   1000
  ksum               =                   0
  kavg               =                   0
 endif
endif

; WRITE VALUE TO TABLE
if kval>=0 && kval<=1 && kstop==0 then                 ; if this is a valid random value...
 kcurVal            table               kval, gibufferTable, 1               ; read existing value in that location
                    tablew              1 + kcurVal, kval, gibufferTable, 1  ; add a 1 to that location
endif

if kMetro==1 && kstop==0 then                                                ; for efficiency, only update gentable when metro ticks and when RUN is active
                    reinit              UPDATE_TABLE                         ; need to renitialise (i-time interruption) to do this
endif
UPDATE_TABLE:
i_                  ftgen               1, 0, 1024, 18, 2, 1, 0, 1023        ; transfer and normalise table
                    cabbageSet          "randDistr", "tableNumber", girandDistr ; update widget
                    
                    
                    
 ; send mouse-hover probability reading to GUI
 ;kMouseTabX *= kscale
 ;kMouseTabX -= koffset
 ;kMouseTabX limit kMouseTabX,0,1
 
  cabbageSetValue "MHprob", table:k(kMouseTabX, girandDistr, 1), kInTabFlag * changed:k(kMOUSE_X)
  
 ; zero mouse-hover probability reading to when mouse exits gentable
  cabbageSetValue "MHprob", 0, trigger:k(kInTabFlag,0.5,1)
  cabbageSetValue "MHval", 0, trigger:k(kInTabFlag,0.5,1)
endin                                                                                                                     






instr 2 ; trigger notes
iCount              =                   0
iNum                =                   30
while iCount<=iNum do
                    event_i             "i",3,0,3600,iCount/30
iCount              +=                  1
od
endin


gasend init 0

instr 3 ; play notes
kAmp                table               p4,girandDistr,1
kshift              cabbageGetValue     "shift"
kspread              cabbageGetValue     "spread"
kOct = p4


; READ IN WIDGETS
kopcode             cabbageGetValue     "opcode"
klambda             cabbageGetValue     "lambda"
if kopcode==gitrirand || kopcode==gibexprnd || kopcode==6 || kopcode==gicauchy then ; bipolar
  kOct              =                   kOct*2 - 1
endif

kshift              cabbageGetValue     "shift"
kspread             cabbageGetValue     "spread"
a1                  poscil              kAmp*0.1, cpsoct(8 + kshift + kOct*kspread), -1, random:i(0,1)
                    chnmix              a1, "notes"                    
endin



instr 4 ; output mix of notes
a1                  chnget              "notes"
                    chnclear            "notes"
ksonification       cabbageGetValue     "sonification"
ksonification       portk               ksonification,0.005
klevel              cabbageGetValue     "level"
aEnv                linseg              0,0.01,1
a1                  *=                  ksonification * aEnv * klevel^2
                    outs                a1,a1
endin

</CsInstruments>
                              
<CsScore>
i 1 0 z   ; create distributions
i 2 0.2 0 ; trigger note
i 4 0.2 z ; output mix of notes
e
</CsScore>                            

</CsoundSynthesizer>
