// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { CabbageUtils } from "../utils.js";
import { Cabbage } from "../cabbage.js";
import { keyboardMidiInput } from "../keyboardMidiInput.js";

/**
 * MidiKeyboard class
 */
export class MidiKeyboard {
  constructor() {
    // Generate unique ID for this instance
    this.instanceId = Math.random().toString(36).substring(7);
    console.log(`[Keyboard ${this.instanceId}] Constructor called - NEW INSTANCE`);

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

      "octaves": -1,
      "baseOctave": 3
    };

    this.isMouseDown = false; // Track the state of the mouse button
    this.lastTarget = null; // Track the last element we processed to prevent duplicates
    this.octaveOffset = 3;
    this.listenersAdded = false; // Track if event listeners have been added to prevent duplicates

    // Bind event handlers once and store references to prevent duplicate listeners
    this.boundPointerDown = this.pointerDown.bind(this);
    this.boundPointerUp = this.pointerUp.bind(this);
    this.boundPointerMove = this.pointerMove.bind(this);
    this.boundPointerLeave = this.pointerLeave.bind(this);
    this.boundMidiMessageListener = this.midiMessageListener.bind(this);
    // When a keyboard widget exists we may want to set the computer-keyboard base octave
    // Inform the global keyboardMidiInput so ASCII-key mappings follow this widget's baseOctave
    try {
      if (typeof this.props.baseOctave !== 'undefined' && keyboardMidiInput && typeof keyboardMidiInput.setBaseOctave === 'function') {
        keyboardMidiInput.setBaseOctave(this.props.baseOctave);
      }
    } catch (e) {
      // ignore if keyboardMidiInput not available yet
    }
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
        // If baseOctave changes, inform the keyboardMidiInput so computer keyboard mapping updates
        if (prop === 'baseOctave') {
          try {
            if (keyboardMidiInput && typeof keyboardMidiInput.setBaseOctave === 'function') {
              keyboardMidiInput.setBaseOctave(value);
            }
          } catch (e) {
            console.warn('Cabbage: Failed to set keyboard base octave', e);
          }
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

    this.debugLog('Keyboard initialized', {
      baseOctave: this.props.baseOctave,
      octaves: this.props.octaves,
      bounds: this.props.bounds,
      channel: this.props.channels?.[0]?.id,
    });
  }

  isDebugEnabled() {
    if (typeof this.props?.debug !== 'undefined') {
      return !!this.props.debug;
    }
    if (typeof window !== 'undefined' && typeof window.__CABBAGE_KEYBOARD_DEBUG__ !== 'undefined') {
      return !!window.__CABBAGE_KEYBOARD_DEBUG__;
    }
    return true;
  }

  debugLog(message, data = {}) {
    if (!this.isDebugEnabled()) {
      return;
    }

    const widgetId = this.props?.id || this.props?.channels?.[0]?.id || 'keyboard';
    const activeNotes = Array.from(this.activeNotes || []);
    console.log(`[Keyboard ${this.instanceId}:${widgetId}] ${message}`, {
      ...data,
      isMouseDown: this.isMouseDown,
      lastTarget: this.lastTarget?.dataset?.note || null,
      activeNotes,
      activeCount: activeNotes.length,
    });
  }


  getKeyElement(target) {
    // Find the key element (might be the target itself or a parent)
    if (target.classList && (target.classList.contains('white-key') || target.classList.contains('black-key'))) {
      return target;
    }
    // Check if parent is a key (handles clicking on child elements like text)
    return target.closest ? target.closest('.white-key, .black-key') : null;
  }

  pointerDown(e) {
    const keyElement = this.getKeyElement(e.target);
    this.debugLog('pointerDown', {
      targetNote: keyElement?.dataset?.note || null,
      pointerType: e.pointerType,
      buttons: e.buttons,
      pointerId: e.pointerId,
    });
    if (keyElement) {
      this.isMouseDown = true;
      this.lastTarget = keyElement;
      this.noteOn(keyElement, e);
    }
  }

  pointerUp(e) {
    this.debugLog('pointerUp', {
      targetNote: this.getKeyElement(e.target)?.dataset?.note || null,
      pointerType: e.pointerType,
      buttons: e.buttons,
      pointerId: e.pointerId,
    });
    if (this.isMouseDown) {
      this.isMouseDown = false;
      const keyElement = this.getKeyElement(e.target);
      this.lastTarget = null;
      if (keyElement) {
        this.noteOff(keyElement);
      } else {
        this.debugLog('pointerUp without key target; invoking noteOffLastKey');
        this.noteOffLastKey();
      }
    }
  }

  pointerMove(e) {
    if (this.isMouseDown) {
      const keyElement = this.getKeyElement(e.target);

      // Only process if we've moved to a different element
      if (keyElement === this.lastTarget) {
        return;
      }

      this.debugLog('pointerMove key transition', {
        from: this.lastTarget?.dataset?.note || null,
        to: keyElement?.dataset?.note || null,
        pointerType: e.pointerType,
        pointerId: e.pointerId,
      });

      if (keyElement) {
        if (!this.activeNotes.has(keyElement.dataset.note)) {
          this.lastTarget = keyElement;
          this.noteOn(keyElement, e);
        }
      } else {
        this.lastTarget = null;
        this.noteOffLastKey();
      }
    }
  }

  // pointerEnter removed - redundant with pointerMove and can cause duplicate note-ons on initial click

  pointerLeave(e) {
    this.debugLog('pointerLeave', {
      targetNote: this.getKeyElement(e.target)?.dataset?.note || null,
      pointerType: e.pointerType,
      pointerId: e.pointerId,
    });
    if (this.isMouseDown) {
      const keyElement = this.getKeyElement(e.target);
      if (keyElement) {
        if (keyElement === this.lastTarget) {
          this.lastTarget = null;
        }
        this.noteOff(keyElement);
      }
    }
  }

  noteOn(keyElement, e) {
    const note = keyElement.dataset.note;

    // Early return if already active - prevents race conditions
    if (this.activeNotes.has(note)) {
      this.debugLog('noteOn skipped (already active)', {
        note,
        midiNote: this.noteMap[note],
      });
      return;
    }

    // Add to active notes immediately before any async operations
    this.activeNotes.add(note);

    keyElement.setAttribute('fill', this.props.style?.keydownColor || this.props.color?.keydown || '#93d200');
    const rect = keyElement.getBoundingClientRect();
    const velocity = Math.max(1, Math.floor((e.offsetY / rect.height) * 127));
    this.debugLog('noteOn send MIDI', {
      note,
      midiNote: this.noteMap[note],
      velocity,
    });
    Cabbage.sendMidiMessageFromUI(0x90, this.noteMap[note], velocity, this.vscode);
  }

  noteOff(keyElement) {
    if (!keyElement) {
      this.debugLog('noteOff called with null keyElement');
      return;
    }

    const note = keyElement.dataset.note;
    const wasActive = this.activeNotes.has(note);
    this.debugLog('noteOff requested', {
      note,
      midiNote: this.noteMap[note],
      wasActive,
    });

    if (this.activeNotes.has(note)) {
      this.activeNotes.delete(note);
      keyElement.setAttribute('fill', keyElement.classList.contains('white-key') ? (this.props.style?.whiteNoteColor || this.props.color?.whiteNote || '#ffffff') : (this.props.style?.blackNoteColor || this.props.color?.blackNote || '#000000'));
      this.debugLog('noteOff send MIDI', {
        note,
        midiNote: this.noteMap[note],
      });
      Cabbage.sendMidiMessageFromUI(0x80, this.noteMap[note], 0, this.vscode);
    } else {
      this.debugLog('noteOff ignored (note not active)', {
        note,
        midiNote: this.noteMap[note],
      });
    }
  }

  noteOffLastKey() {
    this.debugLog('noteOffLastKey invoked');
    if (this.activeNotes.size > 0) {
      const lastNote = Array.from(this.activeNotes).pop();
      const keyElement = document.querySelector(`[data-note="${lastNote}"]`);
      this.debugLog('noteOffLastKey candidate', {
        lastNote,
        keyFound: !!keyElement,
      });
      this.noteOff(keyElement);
    } else {
      this.debugLog('noteOffLastKey no-op (no active notes)');
    }
  }

  octaveUpPointerDown(e) {
  }

  octaveDownPointerDown(e) {
  }

  changeOctave(offset) {
    this.octaveOffset += offset;
    // Allow octave offset to go as low as -2 (for C-2) and as high as 8 (for C8)
    // This matches the noteMap range defined in the constructor
    if (this.octaveOffset < -2) { this.octaveOffset = -2; }
    if (this.octaveOffset > 8) { this.octaveOffset = 8; }
    CabbageUtils.updateInnerHTML(this.props, this);
  }

  addVsCodeEventListeners(widgetDiv, vscode) {
    // Remove any existing listeners first to prevent duplicates
    this.removeListeners();

    this.vscode = vscode;
    this.widgetDiv = widgetDiv;
    this.widgetDiv.style.pointerEvents = this.props.active ? 'auto' : 'none';
    this.debugLog('addVsCodeEventListeners', {
      pointerEvents: this.widgetDiv.style.pointerEvents,
    });

    // Add pointer event listeners for keyboard keys using bound references
    widgetDiv.addEventListener("pointerdown", this.boundPointerDown);
    widgetDiv.addEventListener("pointerup", this.boundPointerUp);
    widgetDiv.addEventListener("pointermove", this.boundPointerMove);
    widgetDiv.addEventListener("pointerleave", this.boundPointerLeave, true);
    document.addEventListener("midiEvent", this.boundMidiMessageListener);

    this.listenersAdded = true;

    // Re-render after a short delay to ensure the div has its width CSS applied
    // This fixes the issue where octaves are calculated before the div width is set
    requestAnimationFrame(() => {
      CabbageUtils.updateInnerHTML(this.props, this);
    });
  }

  addEventListeners(widgetDiv) {
    // Remove any existing listeners first to prevent duplicates
    this.removeListeners();

    this.widgetDiv = widgetDiv;
    this.addListeners(widgetDiv);
    this.listenersAdded = true;
    this.debugLog('addEventListeners');

    CabbageUtils.updateInnerHTML(this.props, this);
  }

  midiMessageListener(event) {
    const detail = event.detail;
    const midiData = JSON.parse(detail.data);
    if (midiData.status == 144) {
      const note = midiData.data1;
      const noteName = Object.keys(this.noteMap).find(key => this.noteMap[key] === note);
      const key = document.querySelector(`[data-note="${noteName}"]`);
      this.debugLog('midiMessageListener noteOn', {
        status: midiData.status,
        note,
        noteName,
        keyFound: !!key,
      });
      key.setAttribute('fill', this.props.style?.keydownColor || this.props.color?.keydown || '#93d200');
    } else if (midiData.status === 128) {
      const note = midiData.data1;
      const noteName = Object.keys(this.noteMap).find(key => this.noteMap[key] === note);
      const key = document.querySelector(`[data-note="${noteName}"]`);
      this.debugLog('midiMessageListener noteOff', {
        status: midiData.status,
        note,
        noteName,
        keyFound: !!key,
      });
      key.setAttribute('fill', key.classList.contains('white-key') ? 'white' : 'black');
    }
  }

  removeListeners() {
    // Remove listeners if they were previously added
    if (this.widgetDiv && this.listenersAdded) {
      this.debugLog('removeListeners begin');
      this.widgetDiv.removeEventListener("pointerdown", this.boundPointerDown);
      this.widgetDiv.removeEventListener("pointerup", this.boundPointerUp);
      this.widgetDiv.removeEventListener("pointermove", this.boundPointerMove);
      this.widgetDiv.removeEventListener("pointerleave", this.boundPointerLeave, true);
      document.removeEventListener("midiEvent", this.boundMidiMessageListener);
      this.listenersAdded = false;

      // Release any active notes to prevent stuck notes
      this.activeNotes.forEach(note => {
        const keyElement = document.querySelector(`[data-note="${note}"]`);
        if (keyElement) {
          this.noteOff(keyElement);
        }
      });

      this.debugLog('removeListeners complete');
    }
  }

  addListeners(widgetDiv) {
    // Use bound references to ensure we can remove listeners later
    widgetDiv.addEventListener("pointerdown", this.boundPointerDown);
    widgetDiv.addEventListener("pointerup", this.boundPointerUp);
    widgetDiv.addEventListener("pointermove", this.boundPointerMove);
    widgetDiv.addEventListener("pointerleave", this.boundPointerLeave, true);
    document.addEventListener("midiEvent", this.boundMidiMessageListener);
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
    const containerId = `${this.props.id || this.props.channels?.[0]?.id || 'keyboard'}_container`;
    const svgContainerId = `${this.props.id || this.props.channels?.[0]?.id || 'keyboard'}_svg`;

    // Store widget instance on window for inline event handlers to access
    const widgetId = this.props.id || this.props.channels?.[0]?.id || 'keyboard';
    if (typeof window !== 'undefined') {
      window[`__keyboard_${widgetId}`] = this;
    }

    return `
      <div id="${containerId}" style="display: ${this.props.visible ? 'flex' : 'none'}; align-items: center; height: ${this.props.bounds.height * scaleFactor}px;">
        <button id="octave-down" 
                style="width: ${buttonWidth}px; height: ${buttonHeight}px; background-color: ${this.props.style?.arrowBackgroundColor || this.props.color?.arrowBackground || '#0295cf'};"
                onpointerdown="event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); console.log('Octave DOWN'); window.__keyboard_${widgetId}.changeOctave(-1); return false;">-</button>
        <div id="${svgContainerId}" style="flex-grow: 1; height: 100%;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${keyboardWidth} ${this.props.bounds.height * scaleFactor}" width="100%" height="100%" preserveAspectRatio="none" opacity="${this.props.style.opacity}">
            ${whiteSvgKeys}
            ${blackSvgKeys}
          </svg>
        </div>
        <button id="octave-up" 
                style="width: ${buttonWidth}px; height: ${buttonHeight}px; background-color: ${this.props.style?.arrowBackgroundColor || this.props.color?.arrowBackground || '#0295cf'};"
                onpointerdown="event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); console.log('Octave UP'); window.__keyboard_${widgetId}.changeOctave(1); return false;">+</button>
      </div>
    `;
  }
}
