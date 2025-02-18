import SmartCacheDB from "../cache";

let cache: SmartCacheDB;

describe('SmartCacheDB Tests', () => {
    beforeAll(() => {
        cache = new SmartCacheDB(['memory', 'redis'], { host: 'localhost', port: 6379 });
    });

    afterAll(async () => {
        await cache.clear();
    });

    test('should store and retrieve a value in memory', async () => {
        await cache.set('memKey', 'memoryValue');
        const value = await cache.get('memKey');
        expect(value).toBe('memoryValue');
    });

    test('should store and retrieve a value in Redis', async () => {
        await cache.set('redisKey', 'redisValue');
        const value = await cache.get('redisKey');
        expect(value).toBe('redisValue');
    });

    test('should delete a value from cache', async () => {
        await cache.set('delKey', 'deleteValue');
        await cache.delete('delKey');
        const value = await cache.get('delKey');
        expect(value).toBeNull();
    });

    test('should clear all values from cache', async () => {
        await cache.set('clearKey', 'clearValue');
        await cache.clear();
        const value = await cache.get('clearKey');
        expect(value).toBeNull();
    });

    test('should handle non-existing keys gracefully', async () => {
        const value = await cache.get('nonExistingKey');
        expect(value).toBeNull();
    });

    test('should handle setting objects in cache', async () => {
        const obj = { name: 'Alice', age: 30 };
        await cache.set('objectKey', obj);
        const value = await cache.get('objectKey');
        expect(value).toEqual(obj);
    });

    test('should store and retrieve compressed values', async () => {
        const largeData = 'A'.repeat(1000);
        await cache.set('compressedKey', largeData, { ttl: 600 });
        const value = await cache.get('compressedKey');
        expect(value).toBe(largeData);
    });

    test('should store values with expiration', async () => {
        await cache.set('ttlKey', 'expireTest', { ttl: 1 });
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for TTL expiration
        const value = await cache.get('ttlKey');
        expect(value).toBeNull();
    });
});
