// MIT License
// Copyright (c) 2024 Rory Walsh
// See the LICENSE file for details.

import { getCabbageMode, vscode } from "./sharedState.js";
import { Cabbage } from "./cabbage.js";

/**
 * Keyboard-to-MIDI mapping module
 * Maps ASCII keyboard keys to MIDI notes for performance testing
 * Only active in performance (non-draggable) mode
 */

class KeyboardMidiInput {
    constructor() {
        // Computer keyboard to MIDI note mapping (standard mapping used in many DAWs)
        // Two rows: bottom row for white keys, top row for black keys
        this.keyToNote = {
            // White keys (lower row) - starts at C4 (MIDI 60)
            'a': 60,  // C4
            's': 62,  // D4
            'd': 64,  // E4
            'f': 65,  // F4
            'g': 67,  // G4
            'h': 69,  // A4
            'j': 71,  // B4
            'k': 72,  // C5
            'l': 74,  // D5
            ';': 76,  // E5
            "'": 77,  // F5

            // Black keys (upper row)
            'w': 61,  // C#4
            'e': 63,  // D#4
            't': 66,  // F#4
            'y': 68,  // G#4
            'u': 70,  // A#4
            'o': 73,  // C#5
            'p': 75,  // D#5

            // Lower octave (z-m keys) - starts at C3 (MIDI 48)
            'z': 48,  // C3
            'x': 50,  // D3
            'c': 52,  // E3
            'v': 53,  // F3
            'b': 55,  // G3
            'n': 57,  // A3
            'm': 59,  // B3
            ',': 60,  // C4
            '.': 62,  // D4
            '/': 64,  // E4
        };

        // Black keys for lower octave
        this.keyToNote['q'] = 49;  // C#3
        this.keyToNote['2'] = 51;  // D#3
        this.keyToNote['r'] = 54;  // F#3
        this.keyToNote['5'] = 56;  // G#3
        this.keyToNote['6'] = 58;  // A#3

        // Track active notes to prevent retriggering on key repeat
        this.activeKeys = new Set();

        // Default velocity
        this.defaultVelocity = 80;

        // Bind methods
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        // Store a copy of the original mapping so we can shift it by octaves later
        this.baseKeyToNote = Object.assign({}, this.keyToNote);
        // Default base octave that the mapping was authored for (C4 = 4 for 'a' key)
        this.baseOctave = 4;
        this.currentBaseOctave = this.baseOctave;
    }

    /**
     * Set the base octave for keyboard-to-midi mapping.
     * Example: setBaseOctave(3) will shift all mappings down one octave (12 semitones).
     * @param {number} octave
     */
    setBaseOctave(octave) {
        if (typeof octave !== 'number' || isNaN(octave)) return;
        const deltaOctaves = octave - this.baseOctave;
        const semitoneShift = deltaOctaves * 12;
        this.keyToNote = {};
        Object.keys(this.baseKeyToNote).forEach(k => {
            let v = this.baseKeyToNote[k] + semitoneShift;
            // clamp to valid MIDI range
            if (v < 0) v = 0;
            if (v > 127) v = 127;
            this.keyToNote[k] = v;
        });
        this.currentBaseOctave = octave;
    }

    /**
     * Initialize keyboard listeners
     */
    init() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
    }

    /**
     * Handle keydown events
     */
    handleKeyDown(e) {
        // Only process in performance mode (not draggable)
        if (getCabbageMode() === 'draggable') {
            return;
        }

        // Ignore if modifier keys are pressed (Ctrl, Alt, Cmd)
        if (e.ctrlKey || e.altKey || e.metaKey) {
            return;
        }

        // Ignore if typing in an input field
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) {
            return;
        }

        const key = e.key.toLowerCase();

        // Check if this key is mapped to a MIDI note
        if (this.keyToNote.hasOwnProperty(key)) {
            // Prevent key repeat
            if (this.activeKeys.has(key)) {
                e.preventDefault();
                return;
            }

            this.activeKeys.add(key);
            e.preventDefault();

            const midiNote = this.keyToNote[key];

            // Send MIDI note on (0x90 = note on, channel 0)
            Cabbage.sendMidiMessageFromUI(0x90, midiNote, this.defaultVelocity, vscode);
        }
    }

    /**
     * Handle keyup events
     */
    handleKeyUp(e) {
        // Only process in performance mode
        if (getCabbageMode() === 'draggable') {
            return;
        }

        const key = e.key.toLowerCase();

        // Check if this key is mapped to a MIDI note
        if (this.keyToNote.hasOwnProperty(key)) {
            // Only process if the key was active
            if (this.activeKeys.has(key)) {
                this.activeKeys.delete(key);
                e.preventDefault();

                const midiNote = this.keyToNote[key];

                // Send MIDI note off (0x80 = note off, channel 0)
                Cabbage.sendMidiMessageFromUI(0x80, midiNote, 0, vscode);
            }
        }
    }

    /**
     * Release all active notes (useful when mode changes)
     */
    releaseAllNotes() {
        this.activeKeys.forEach(key => {
            const midiNote = this.keyToNote[key];
            Cabbage.sendMidiMessageFromUI(0x80, midiNote, 0, vscode);
        });
        this.activeKeys.clear();
    }

    /**
     * Cleanup listeners
     */
    destroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        this.releaseAllNotes();
    }
}

// Create singleton instance
const keyboardMidiInput = new KeyboardMidiInput();

export { keyboardMidiInput };
