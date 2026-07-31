import WebSocket from 'ws';
import { broadcastInvalidation, setupWebSocket } from '../websocket';

describe('WebSocket invalidation', () => {
    test('starts and closes a server on an available port', async () => {
        const server = setupWebSocket(0);

        await new Promise<void>(resolve => server.once('listening', resolve));
        expect(server.address()).toBeTruthy();

        await new Promise<void>((resolve, reject) => {
            server.close(error => error ? reject(error) : resolve());
        });
    });

    test('broadcasts only to open clients', () => {
        const openClient = { readyState: WebSocket.OPEN, send: jest.fn() };
        const closedClient = { readyState: WebSocket.CLOSED, send: jest.fn() };
        const server = {
            clients: new Set([openClient, closedClient])
        } as unknown as WebSocket.Server;

        broadcastInvalidation(server, 'user:1');

        expect(openClient.send).toHaveBeenCalledWith(
            JSON.stringify({ action: 'invalidate', key: 'user:1' })
        );
        expect(closedClient.send).not.toHaveBeenCalled();
    });
});
