import WebSocket from 'ws';

export const setupWebSocket = (): WebSocket.Server => {
    return new WebSocket.Server({ port: 8080 });
};

export const broadcastInvalidation = (wsServer: WebSocket.Server, key: string) => {
    wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ action: 'invalidate', key }));
        }
    });
};
``