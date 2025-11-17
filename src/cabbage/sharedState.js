// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

export let vscode = null;
export const widgets = [];
export let cabbageMode = 'nonDraggable';
export let currentCsdPath = '';

// Queue for messages that are sent before the VS Code API is available
const _vscodeMessageQueue = [];

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
            _vscodeMessageQueue.push(msg);
        }
    } else {
        console.log('postMessageToVSCode: vscode not available, queuing message', msg && msg.command);
        _vscodeMessageQueue.push(msg);
    }
}



export function setVSCode(vsCodeInstance) {
    console.warn("Cabbage: Setting vscode instance");
    vscode = vsCodeInstance;
    // Flush any queued messages
    if (vscode && _vscodeMessageQueue.length > 0) {
        console.log(`Cabbage: Flushing ${_vscodeMessageQueue.length} queued messages to VS Code`);
        while (_vscodeMessageQueue.length > 0) {
            const m = _vscodeMessageQueue.shift();
            try { vscode.postMessage(m); } catch (e) { console.error('Failed to flush queued message', e, m); }
        }
    }
}

export function setCabbageMode(mode) {
    cabbageMode = mode;
}

export function getCabbageMode() {
    return cabbageMode;
}

