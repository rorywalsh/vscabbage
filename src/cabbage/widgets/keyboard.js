// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils } from "../utils.js";
import { Cabbage } from "../cabbage.js";

/**
 * MidiKeyboard class
 */
export class MidiKeyboard {
  constructor() {
    this.props = {
      "bounds": {
        "top": 0,
        "left": 0,
        "width": 600,
        "height": 300
      },
      "channels": [
        { "id": "comboBox", "event": "valueChanged" }
      ],
      "value": 36,
      "automatable": false,
      "active": true,
      "visible": true,
      "style": {
        "opacity": 1,
        "fontFamily": "Verdana",
        "fontSize": "auto",
        "fontColor": "#000000",
        "textAlign": "center"
      },
      "type": "keyboard",
      "zIndex": 0,

      "label": {},

      "color": {
        "whiteNote": "#ffffff",
        "arrowBackground": "#0295cf",
        "keydown": "#93d200",
        "blackNote": "#000000"
      },

      "octaves": -1
    };

    this.isMouseDown = false; // Track the state of the mouse button
    this.octaveOffset = 3;
    this.noteMap = {};
    this.activeNotes = new Set(); // Track active notes
    this.vscode = null;

    // Wrap props with reactive proxy to unify visible/active handling
    this.props = CabbageUtils.createReactiveProps(this, this.props, {
      onPropertyChange: (prop, value) => {
        // Re-render when bounds change to recalculate octaves
        if (prop === 'bounds' && this.widgetDiv) {
          CabbageUtils.updateInnerHTML(this.props, this);
        }
      }
    });

    // Define an array of note names
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Loop through octaves and note names to populate the map
    for (let octave = -2; octave <= 8; octave++) { // Limit octave range to prevent exceeding 127
      for (let i = 0; i < noteNames.length; i++) {
        const midiNote = (octave + 2) * 12 + i; // Calculate MIDI note number

        // Only include valid MIDI notes (0-127)
        if (midiNote >= 0 && midiNote <= 127) {
          const noteName = noteNames[i] + octave;
          this.noteMap[noteName] = midiNote;
        }
      }
    }
  }


  pointerDown(e) {
    if (e.target.classList.contains('white-key') || e.target.classList.contains('black-key')) {
      this.isMouseDown = true;
      console.log("Cabbage: Key down:", e.target.dataset.note);
      this.noteOn(e.target, e);
    }
  }

  pointerUp(e) {
    if (this.isMouseDown) {
      this.isMouseDown = false;
      this.noteOff(e.target);
    }
  }

  pointerMove(e) {
    if (this.isMouseDown) {
      if (e.target.classList.contains('white-key') || e.target.classList.contains('black-key')) {
        if (!this.activeNotes.has(e.target.dataset.note)) {
          this.noteOn(e.target, e);
        }
      } else {
        this.noteOffLastKey();
      }
    }
  }

  pointerEnter(e) {
    if (this.isMouseDown && (e.target.classList.contains('white-key') || e.target.classList.contains('black-key'))) {
      this.noteOn(e.target, e);
    }
  }

  pointerLeave(e) {
    if (this.isMouseDown && (e.target.classList.contains('white-key') || e.target.classList.contains('black-key'))) {
      this.noteOff(e.target);
    }
  }

  noteOn(keyElement, e) {
    const note = keyElement.dataset.note;
    if (!this.activeNotes.has(note)) {
      this.activeNotes.add(note);
      keyElement.setAttribute('fill', this.props.style?.keydownColor || this.props.color?.keydown || '#93d200');
      const rect = keyElement.getBoundingClientRect();
      const velocity = Math.max(1, Math.floor((e.offsetY / rect.height) * 127));
      console.log(`Key down: ${this.noteMap[note]} velocity: ${velocity}`);
      Cabbage.sendMidiMessageFromUI(0x90, this.noteMap[note], velocity, this.vscode);
    }
  }

  noteOff(keyElement) {
    const note = keyElement.dataset.note;
    if (this.activeNotes.has(note)) {
      this.activeNotes.delete(note);
      keyElement.setAttribute('fill', keyElement.classList.contains('white-key') ? (this.props.style?.whiteNoteColor || this.props.color?.whiteNote || '#ffffff') : (this.props.style?.blackNoteColor || this.props.color?.blackNote || '#000000'));
      console.log(`Key up: ${this.noteMap[note]}`);
      Cabbage.sendMidiMessageFromUI(0x80, this.noteMap[note], 0, this.vscode);
    }
  }

  noteOffLastKey() {
    if (this.activeNotes.size > 0) {
      const lastNote = Array.from(this.activeNotes).pop();
      const keyElement = document.querySelector(`[data-note="${lastNote}"]`);
      this.noteOff(keyElement);
    }
  }

  octaveUpPointerDown(e) {
    console.log('Cabbage: octaveUpPointerDown');
  }

  octaveDownPointerDown(e) {
    console.log('Cabbage: octaveDownPointerDown');
  }

  changeOctave(offset) {
    this.octaveOffset += offset;
    if (this.octaveOffset < 1) { this.octaveOffset = 1; } // Limit lower octave bound
    if (this.octaveOffset > 6) { this.octaveOffset = 6; } // Limit upper octave bound
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

  addVsCodeEventListeners(widgetDiv, vscode) {
    this.vscode = vscode;
    this.widgetDiv = widgetDiv;
    this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
    this.addEventListeners(widgetDiv);

    // Re-render after a short delay to ensure the div has its width CSS applied
    // This fixes the issue where octaves are calculated before the div width is set
    requestAnimationFrame(() => {
      CabbageUtils.updateInnerHTML(this.props, this);
    });
  }

  addEventListeners(widgetDiv) {
    this.addListeners(widgetDiv);
    CabbageUtils.updateInnerHTML(this.props, this);
  }

  midiMessageListener(event) {
    console.log("Cabbage: Midi message listener");
    const detail = event.detail;
    const midiData = JSON.parse(detail.data);
    console.log("Cabbage: Midi message listener", midiData);
    if (midiData.status == 144) {
      const note = midiData.data1;
      const noteName = Object.keys(this.noteMap).find(key => this.noteMap[key] === note);
      const key = document.querySelector(`[data-note="${noteName}"]`);
      key.setAttribute('fill', this.props.style?.keydownColor || this.props.color?.keydown || '#93d200');
      console.log(`Key down: ${note} ${noteName}`);
    } else if (midiData.status === 128) {
      const note = midiData.data1;
      const noteName = Object.keys(this.noteMap).find(key => this.noteMap[key] === note);
      const key = document.querySelector(`[data-note="${noteName}"]`);
      key.setAttribute('fill', key.classList.contains('white-key') ? 'white' : 'black');
      console.log(`Key up: ${note} ${noteName}`);
    }
  }

  addListeners(widgetDiv) {
    widgetDiv.addEventListener("pointerdown", this.pointerDown.bind(this));
    widgetDiv.addEventListener("pointerup", this.pointerUp.bind(this));
    widgetDiv.addEventListener("pointermove", this.pointerMove.bind(this));
    widgetDiv.addEventListener("pointerenter", this.pointerEnter.bind(this), true);
    widgetDiv.addEventListener("pointerleave", this.pointerLeave.bind(this), true);
    document.addEventListener("midiEvent", this.midiMessageListener.bind(this));
    widgetDiv.OctaveButton = this;
  }

  handleClickEvent(e) {
    if (e.target.id == "octave-up") {
      this.changeOctave(1);
    } else {
      this.changeOctave(-1);
    }
  }

  getInnerHTML() {
    const scaleFactor = 0.9; // Adjusting this to fit the UI designer bounding rect

    let whiteKeyWidth;
    let octavesToDisplay;

    if (this.props.octaves === -1) {
      // Fixed width mode: 30px per white key
      whiteKeyWidth = 20;
      // Calculate how many octaves fit in the available width
      const buttonWidth = 25 * scaleFactor;
      const availableWidth = (this.props.bounds.width * scaleFactor) - (buttonWidth * 2);
      octavesToDisplay = Math.floor(availableWidth / (7 * whiteKeyWidth));
      // Ensure at least 1 octave
      octavesToDisplay = Math.max(1, octavesToDisplay);
    } else {
      // Auto-size mode: fit the specified number of octaves to the widget width
      octavesToDisplay = this.props.octaves;
      const totalWhiteKeys = octavesToDisplay * 7;
      whiteKeyWidth = (this.props.bounds.width / totalWhiteKeys) * scaleFactor;
    }

    const totalWhiteKeys = octavesToDisplay * 7; // Total number of white keys to display
    const whiteKeyHeight = this.props.bounds.height * scaleFactor;
    const blackKeyWidth = whiteKeyWidth * 0.5;
    const blackKeyHeight = whiteKeyHeight * 0.6;
    const strokeWidth = 0.5 * scaleFactor;

    const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackKeys = { 'C': 'C#', 'D': 'D#', 'F': 'F#', 'G': 'G#', 'A': 'A#' };

    let whiteSvgKeys = '';
    let blackSvgKeys = '';

    const fontSize = this.props.style.fontSize === "auto" ? this.props.bounds.height * 0.1 : this.props.style.fontSize;

    for (let octave = 0; octave < octavesToDisplay; octave++) {
      for (let i = 0; i < whiteKeys.length; i++) {
        const key = whiteKeys[i];
        const note = key + (octave + this.octaveOffset);
        const width = whiteKeyWidth - strokeWidth;
        const height = whiteKeyHeight - strokeWidth;
        const xOffset = octave * whiteKeys.length * whiteKeyWidth + i * whiteKeyWidth;

        whiteSvgKeys += `<rect x="${xOffset}" y="0" width="${width}" height="${height}" fill="${this.props.style?.whiteNoteColor || this.props.color?.whiteNote || '#ffffff'}" stroke="${this.props.keySeparatorColour}" stroke-width="${strokeWidth}" data-note="${note}" class="white-key" style="height: ${whiteKeyHeight}px;" />`;

        if (blackKeys[key]) {
          const note = blackKeys[key] + (octave + this.octaveOffset);
          blackSvgKeys += `<rect x="${xOffset + whiteKeyWidth * 0.75 - strokeWidth / 2}" y="${strokeWidth / 2}" width="${blackKeyWidth}" height="${blackKeyHeight + strokeWidth}" fill="${this.props.style?.blackNoteColor || this.props.color?.blackNote || '#000000'}" stroke="${this.props.keySeparatorColour}"  stroke-width="${strokeWidth}" data-note="${note}" class="black-key" />`;
        }

        if (i === 0) { // First white key of the octave
          const textX = xOffset + whiteKeyWidth / 2; // Position text in the middle of the white key
          const textY = whiteKeyHeight * 0.8; // Position text in the middle vertically
          whiteSvgKeys += `<text x="${textX}" y="${textY}" text-anchor="middle"  font-family="${this.props.style.fontFamily}" dominant-baseline="middle" font-size="${fontSize}" fill="${this.props.style?.blackNoteColor || this.props.color?.blackNote || '#000000'}" style="pointer-events: none;">${note}</text>`;
        }
      }
    }

    // Calculate button width and height relative to keyboard width
    const buttonWidth = 25 * scaleFactor;
    const buttonHeight = this.props.bounds.height * scaleFactor;

    // Calculate the actual keyboard width based on number of white keys
    const keyboardWidth = totalWhiteKeys * whiteKeyWidth;

    return `
      <div id="${this.props.channel}" style="display: ${this.props.visible ? 'flex' : 'none'}; align-items: center; height: ${this.props.bounds.height * scaleFactor}px;">
        <button id="octave-down" style="width: ${buttonWidth}px; height: ${buttonHeight}px; background-color: ${this.props.style?.arrowBackgroundColor || this.props.color?.arrowBackground || '#0295cf'};" onclick="document.getElementById('${this.props.channel}').OctaveButton.handleClickEvent(event)">-</button>
        <div id="${this.props.channel}" style="flex-grow: 1; height: 100%;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${keyboardWidth} ${this.props.bounds.height * scaleFactor}" width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.style.opacity}">
            ${whiteSvgKeys}
            ${blackSvgKeys}
          </svg>
        </div>
        <button id="octave-up" style="width: ${buttonWidth}px; height: ${buttonHeight}px; background-color: ${this.props.style?.arrowBackgroundColor || this.props.color?.arrowBackground || '#0295cf'};" onclick="document.getElementById('${this.props.channel}').OctaveButton.handleClickEvent(event)">+</button>
      </div>
    `;
  }
}
