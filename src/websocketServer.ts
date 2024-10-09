import WebSocket from 'ws';
export let firstMessages: any[] = [];
import * as vscode from 'vscode';
export let websocket: WebSocket;
/**
 * Set up the WebSocket connection and message handlers.
 * @param wss WebSocket server instance
 * @param panel VSCode Webview panel to post messages to
 */
export function setupWebSocketConnection(wss: WebSocket.Server, panel: vscode.WebviewPanel | undefined) {
    wss.on('connection', (ws: WebSocket) => {
        console.log('Client connected');

        // Flush any first messages received before the webview was ready
        firstMessages.forEach((msg) => {
            console.log(msg);
            ws.send(JSON.stringify(msg));
        });
        firstMessages = [];

        websocket = ws; // Store the WebSocket for later use

        // Handle incoming messages from the WebSocket connection
        ws.on('message', (message: any) => {
            const msg = JSON.parse(message.toString());
            console.log(msg);

            if (msg.hasOwnProperty("command")) {
                if (msg["command"] === "widgetUpdate") {
                    // Send updates to the webview panel
                    if (panel) {
                        panel.webview.postMessage({
                            command: "widgetUpdate",
                            channel: msg["channel"],
                            data: msg["data"]
                        });
                    }
                }
            }
        });

        // Handle WebSocket disconnection
        ws.on('close', () => {
            console.log('Client disconnected');
        });
    });
}