import SmartCacheDB from '../cache';

describe('SmartCacheDB memory storage', () => {
    let cache: SmartCacheDB;

    beforeEach(() => {
        cache = new SmartCacheDB(['memory']);
    });

    afterEach(async () => {
        await cache.close();
        jest.useRealTimers();
    });

    test('stores and retrieves values', async () => {
        await cache.set('user:1', { name: 'Alice' });

        await expect(cache.get('user:1')).resolves.toEqual({ name: 'Alice' });
    });

    test('returns null for missing keys', async () => {
        await expect(cache.get('missing')).resolves.toBeNull();
    });

    test('deletes values', async () => {
        await cache.set('temporary', 'value');
        await cache.delete('temporary');

        await expect(cache.get('temporary')).resolves.toBeNull();
    });

    test('clears all values', async () => {
        await cache.set('first', 1);
        await cache.set('second', 2);
        await cache.clear();

        await expect(cache.getMany(['first', 'second'])).resolves.toEqual({
            first: null,
            second: null
        });
    });

    test('expires values after their TTL', async () => {
        await cache.set('short-lived', 'value', { ttl: 0.01 });

        await new Promise(resolve => setTimeout(resolve, 20));

        await expect(cache.get('short-lived')).resolves.toBeNull();
    });

    test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
        'rejects invalid TTL value %s',
        async ttl => {
            await expect(cache.set('key', 'value', { ttl })).rejects.toThrow(RangeError);
        }
    );

    test('supports multi-key operations', async () => {
        await cache.setMany({ first: 1, second: 2 });

        await expect(cache.getMany(['first', 'second'])).resolves.toEqual({
            first: 1,
            second: 2
        });

        await cache.deleteMany(['first', 'second']);
        await expect(cache.getMany(['first', 'second'])).resolves.toEqual({
            first: null,
            second: null
        });
    });

    test('invalidates all keys associated with a tag', async () => {
        await cache.setWithTag('post:1', { title: 'First' }, ['posts']);
        await cache.setWithTag('post:2', { title: 'Second' }, ['posts']);

        await cache.deleteByTag('posts');

        await expect(cache.getMany(['post:1', 'post:2'])).resolves.toEqual({
            'post:1': null,
            'post:2': null
        });
    });

    test('refreshes a value before expiration', async () => {
        jest.useFakeTimers();
        const refresh = jest.fn().mockResolvedValue(150);

        await cache.setWithAutoRefresh('stock:price', 100, 10, refresh);
        await jest.advanceTimersByTimeAsync(9000);

        expect(refresh).toHaveBeenCalledTimes(1);
        await expect(cache.get('stock:price')).resolves.toBe(150);
    });

    test('supports JSON and Buffer helpers', async () => {
        await cache.setJSON('settings', { theme: 'dark' });
        await cache.setBuffer('file', Buffer.from('hello'));

        await expect(cache.getJSON('settings')).resolves.toEqual({ theme: 'dark' });
        await expect(cache.getBuffer('file')).resolves.toEqual(Buffer.from('hello'));
    });

    test('reports cache hits and misses', async () => {
        await cache.set('present', true);
        await cache.get('present');
        await cache.get('absent');

        expect(cache.stats()).toEqual({ cacheHits: 1, cacheMisses: 1 });
    });

    test('requires at least one storage backend', async () => {
        await cache.close();

        expect(() => new SmartCacheDB([])).toThrow(TypeError);
    });

    test('cancels pending refresh work when closed', async () => {
        jest.useFakeTimers();
        const refresh = jest.fn().mockResolvedValue('new value');
        await cache.setWithAutoRefresh('key', 'value', 10, refresh);

        await cache.close();
        jest.advanceTimersByTime(10000);

        expect(refresh).not.toHaveBeenCalled();
    });
});
