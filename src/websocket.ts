import WebSocket from 'ws';

let wsServer: WebSocket.Server | null = null;

export const setupWebSocket = (): WebSocket.Server => {
    if (wsServer) {
        wsServer.close(); // Ensure previous instance is closed
    }
    wsServer = new WebSocket.Server({ port: 0 }); // Use a dynamic port
    return wsServer;
};

export const broadcastInvalidation = (wsServer: WebSocket.Server, key: string) => {
    wsServer.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ action: 'invalidate', key }));
        }
    });
};
