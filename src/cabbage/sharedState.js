// MIT License
// Copyright (c) 2024 rory Walsh
// See the LICENSE file for details.

export let vscode = null;
export const widgets = [];
export let mediaResources = null;
export let cabbageMode = 'nonDraggable';

export function setVSCode(vsCodeInstance) {
    console.warn("Setting vscode instance");
    vscode = vsCodeInstance;
}

export function setCabbageMode(mode) {
    cabbageMode = mode;
}

export function getCabbageMode() {
    return cabbageMode;
}

export function addMediaResources(resources) {
    mediaResources = resources;
    console.warn("Media Resources", mediaResources);
}

