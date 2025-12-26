// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

export let vscode = null;
export const widgets = [];
export let cabbageMode = 'nonDraggable';
export let currentCsdPath = '';

// Queue for messages that are sent before the VS Code API is available
const vscodeMessageQueue = [];

/**
 * Post a message to the VS Code extension. If the `vscode` API is not yet
 * available, queue the message and flush it once `setVSCode` is called.
 * @param {any} msg
 */
export function postMessageToVSCode(msg) {
    if (vscode && typeof vscode.postMessage === 'function') {
        try {
            vscode.postMessage(msg);
        } catch (e) {
            console.error('postMessageToVSCode: failed to post message', e, msg);
            // If postMessage fails, push back to queue for retry
            vscodeMessageQueue.push(msg);
        }
    } else {
        console.log('postMessageToVSCode: vscode not available, queuing message', msg && msg.command);
        vscodeMessageQueue.push(msg);
    }
}



export function setVSCode(vsCodeInstance) {
    console.warn("Cabbage: Setting vscode instance");
    vscode = vsCodeInstance;
    // Flush any queued messages
    if (vscode && vscodeMessageQueue.length > 0) {
        console.log(`Cabbage: Flushing ${vscodeMessageQueue.length} queued messages to VS Code`);
        while (vscodeMessageQueue.length > 0) {
            const m = vscodeMessageQueue.shift();
            try { vscode.postMessage(m); } catch (e) { console.error('Failed to flush queued message', e, m); }
        }
    }
}

export function setCabbageMode(mode) {
    const previousMode = cabbageMode;
    cabbageMode = mode;

    // Release all keyboard MIDI notes when entering draggable mode
    // This prevents stuck notes when switching modes
    if (mode === 'draggable' && previousMode !== 'draggable') {
        // Import dynamically to avoid circular dependency
        import('./keyboardMidiInput.js').then(({ keyboardMidiInput }) => {
            keyboardMidiInput.releaseAllNotes();
        }).catch(err => {
            console.warn('Cabbage: Could not release keyboard MIDI notes:', err);
        });
    }
}

export function getCabbageMode() {
    return cabbageMode;
}

