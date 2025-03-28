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
      "type": "keyboard",
      "channel": "keyboard",
      "value": "36",
      "font": {
        "family": "Verdana",
        "size": 0,
        "align": "centre"
      },
      "colour": {
        "whiteNote": "#ffffff",
        "arrowBackground": "#0295cf",
        "keydown": "#93d200",
        "blackNote": "#000000"
      },
      "opacity": 1,
      "automatable": 0,
      "octaves": 3
    };

    this.isMouseDown = false; // Track the state of the mouse button
    this.octaveOffset = 3;
    this.noteMap = {};
    this.activeNotes = new Set(); // Track active notes
    this.vscode = null;

    // Define an array of note names
    const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    // Loop through octaves and note names to populate the map
    for (let octave = -2; octave <= this.props.octaves + 2; octave++) {
      for (let i = 0; i < noteNames.length; i++) {
        const noteName = noteNames[i] + octave;
        const midiNote = (octave + 2) * 12 + i; // Calculate MIDI note number
        this.noteMap[noteName] = midiNote;
      }
    }
  }

  pointerDown(e) {
    if (e.target.classList.contains('white-key') || e.target.classList.contains('black-key')) {
      this.isMouseDown = true;
      this.noteOn(e.target);
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
          this.noteOn(e.target);
        }
      } else {
        this.noteOffLastKey();
      }
    }
  }

  pointerEnter(e) {
    if (this.isMouseDown && (e.target.classList.contains('white-key') || e.target.classList.contains('black-key'))) {
      this.noteOn(e.target);
    }
  }

  pointerLeave(e) {
    if (this.isMouseDown && (e.target.classList.contains('white-key') || e.target.classList.contains('black-key'))) {
      this.noteOff(e.target);
    }
  }

  noteOn(keyElement) {
    const note = keyElement.dataset.note;
    if (!this.activeNotes.has(note)) {
      this.activeNotes.add(note);
      keyElement.setAttribute('fill', this.props.colour.keydown);
      console.log(`Key down: ${this.noteMap[note]}`);
      Cabbage.sendMidiMessageFromUI(0x90, this.noteMap[note], 127, this.vscode);
    }
  }

  noteOff(keyElement) {
    const note = keyElement.dataset.note;
    if (this.activeNotes.has(note)) {
      this.activeNotes.delete(note);
      keyElement.setAttribute('fill', keyElement.classList.contains('white-key') ? this.props.colour.whiteNote : this.props.colour.blackNote);
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
    if (this.octaveOffset < 1) {this.octaveOffset = 1;} // Limit lower octave bound
    if (this.octaveOffset > 7) {this.octaveOffset = 7;} // Limit upper octave bound
    CabbageUtils.updateInnerHTML(this.props.channel, this);
  }

  addVsCodeEventListeners(widgetDiv, vscode) {
    this.vscode = vscode;
    this.addEventListeners(widgetDiv);
  }

  addEventListeners(widgetDiv) {
    this.addListeners(widgetDiv);
    CabbageUtils.updateInnerHTML(this.props.channel, this);
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
      key.setAttribute('fill', this.props.colour.keydown);
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

    const totalWhiteKeys = this.props.octaves * 7; // Total number of white keys to display
    const whiteKeyWidth = (this.props.bounds.width / totalWhiteKeys) * scaleFactor; // Adjust width based on total white keys
    const whiteKeyHeight = this.props.bounds.height * scaleFactor;
    const blackKeyWidth = whiteKeyWidth * 0.5;
    const blackKeyHeight = whiteKeyHeight * 0.6;
    const strokeWidth = 0.5 * scaleFactor;

    const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const blackKeys = { 'C': 'C#', 'D': 'D#', 'F': 'F#', 'G': 'G#', 'A': 'A#' };

    let whiteSvgKeys = '';
    let blackSvgKeys = '';

    const fontSize = this.props.font.size > 0 ? this.props.font.size : this.props.bounds.height * 0.1;

    for (let octave = 0; octave < this.props.octaves; octave++) {
      for (let i = 0; i < whiteKeys.length; i++) {
        const key = whiteKeys[i];
        const note = key + (octave + this.octaveOffset);
        const width = whiteKeyWidth - strokeWidth;
        const height = whiteKeyHeight - strokeWidth;
        const xOffset = octave * whiteKeys.length * whiteKeyWidth + i * whiteKeyWidth;

        whiteSvgKeys += `<rect x="${xOffset}" y="0" width="${width}" height="${height}" fill="${this.props.colour.whiteNote}" stroke="${this.props.keySeparatorColour}" stroke-width="${strokeWidth}" data-note="${note}" class="white-key" style="height: ${whiteKeyHeight}px;" />`;

        if (blackKeys[key]) {
          const note = blackKeys[key] + (octave + this.octaveOffset);
          blackSvgKeys += `<rect x="${xOffset + whiteKeyWidth * 0.75 - strokeWidth / 2}" y="${strokeWidth / 2}" width="${blackKeyWidth}" height="${blackKeyHeight + strokeWidth}" fill="${this.props.colour.blackNote}" stroke="${this.props.keySeparatorColour}"  stroke-width="${strokeWidth}" data-note="${note}" class="black-key" />`;
        }

        if (i === 0) { // First white key of the octave
          const textX = xOffset + whiteKeyWidth / 2; // Position text in the middle of the white key
          const textY = whiteKeyHeight * 0.8; // Position text in the middle vertically
          whiteSvgKeys += `<text x="${textX}" y="${textY}" text-anchor="middle"  font-family="${this.props.font.family}" dominant-baseline="middle" font-size="${fontSize}" fill="${this.props.colour.blackNote}" style="pointer-events: none;">${note}</text>`;
        }
      }
    }

    // Calculate button width and height relative to keyboard width
    const buttonWidth = 25 * scaleFactor;
    const buttonHeight = this.props.bounds.height * scaleFactor;

    return `
      <div id="${this.props.channel}" style="display: flex; align-items: center; height: ${this.props.bounds.height * scaleFactor}px;">
        <button id="octave-down" style="width: ${buttonWidth}px; height: ${buttonHeight}px; background-color: ${this.props.colour.arrowBackground};" onclick="document.getElementById('${this.props.channel}').OctaveButton.handleClickEvent(event)">-</button>
        <div id="${this.props.channel}" style="flex-grow: 1; height: 100%;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${this.props.bounds.width * scaleFactor} ${this.props.bounds.height * scaleFactor}" width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.opacity}">
            ${whiteSvgKeys}
            ${blackSvgKeys}
          </svg>
        </div>
        <button id="octave-up" style="width: ${buttonWidth}px; height: ${buttonHeight}px; background-color: ${this.props.colour.arrowBackground};" onclick="document.getElementById('${this.props.channel}').OctaveButton.handleClickEvent(event)">+</button>
      </div>
    `;
  }
}
