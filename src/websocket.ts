import WebSocket from 'ws';

export const setupWebSocket = (port = 0): WebSocket.Server => {
    return new WebSocket.Server({ port });
};

export const broadcastInvalidation = (wsServer: WebSocket.Server, key: string): void => {
    wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ action: 'invalidate', key }));
        }
    });
};
