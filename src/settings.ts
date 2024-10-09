import * as vscode from 'vscode';

export class Settings {

    static async readSettingsFile(context: vscode.ExtensionContext) {
        const fileUri = vscode.Uri.file('/Users/rwalsh/Library/Application Support/Cabbage/Settings.ini');
        try {
            const fileData = await vscode.workspace.fs.readFile(fileUri);
            const fileContent = new TextDecoder('utf-8').decode(fileData);
            console.log(fileContent); // Now you have the file contents as a string
        } catch (error) {
            console.error('Error reading file:', error);
        }
    }
}