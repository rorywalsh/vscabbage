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