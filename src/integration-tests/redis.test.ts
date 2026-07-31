import SmartCacheDB from '../cache';

const redisUrl = process.env.REDIS_URL;
const describeWithRedis = redisUrl ? describe : describe.skip;

describeWithRedis('SmartCacheDB Redis storage', () => {
    let cache: SmartCacheDB;
    const keyPrefix = `smartcachedb:test:${process.pid}:${Date.now()}`;

    beforeAll(() => {
        cache = new SmartCacheDB(['redis'], { url: redisUrl! });
    });

    afterAll(async () => {
        await cache.close();
    });

    test('stores, retrieves, and deletes a value without memory storage', async () => {
        const key = `${keyPrefix}:value`;

        await cache.set(key, { source: 'redis' }, { ttl: 30 });
        await expect(cache.get(key)).resolves.toEqual({ source: 'redis' });

        await cache.delete(key);
        await expect(cache.get(key)).resolves.toBeNull();
    });

    test('expires values using TTL seconds', async () => {
        const key = `${keyPrefix}:ttl`;

        await cache.set(key, 'temporary', { ttl: 1 });
        await new Promise(resolve => setTimeout(resolve, 1100));

        await expect(cache.get(key)).resolves.toBeNull();
    });
});
