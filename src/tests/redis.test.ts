const client = {
    connect: jest.fn().mockResolvedValue(undefined),
    setEx: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue('stored-value'),
    del: jest.fn().mockResolvedValue(1),
    flushDb: jest.fn().mockResolvedValue('OK'),
    quit: jest.fn().mockResolvedValue('OK'),
    isOpen: true
};

jest.mock('redis', () => ({
    createClient: jest.fn(() => client)
}));

import { createClient } from 'redis';
import { RedisStorage } from '../storage/redis';

describe('RedisStorage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        client.connect.mockResolvedValue(undefined);
        client.isOpen = true;
    });

    test('connects with the supplied client configuration', () => {
        new RedisStorage({ url: 'redis://cache.example:6379' });

        expect(createClient).toHaveBeenCalledWith({ url: 'redis://cache.example:6379' });
        expect(client.connect).toHaveBeenCalledTimes(1);
    });

    test('delegates cache operations after connecting', async () => {
        const storage = new RedisStorage({});

        await storage.set('key', 'value', 60);
        await expect(storage.get('key')).resolves.toBe('stored-value');
        await storage.delete('key');
        await storage.clear();

        expect(client.setEx).toHaveBeenCalledWith('key', 60, 'value');
        expect(client.get).toHaveBeenCalledWith('key');
        expect(client.del).toHaveBeenCalledWith('key');
        expect(client.flushDb).toHaveBeenCalledTimes(1);
    });

    test('quits an open connection', async () => {
        const storage = new RedisStorage({});

        await storage.close();

        expect(client.quit).toHaveBeenCalledTimes(1);
    });

    test('does not quit an already closed connection', async () => {
        client.isOpen = false;
        const storage = new RedisStorage({});

        await storage.close();

        expect(client.quit).not.toHaveBeenCalled();
    });
});
