// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

export let vscode = null;
export const widgets = [];
export let cabbageMode = 'nonDraggable';

export function setVSCode(vsCodeInstance) {
    vscode = vsCodeInstance;
}

export function setCabbageMode(mode) {
    cabbageMode = mode;
}

export function getCabbageMode() {
    return cabbageMode;
}