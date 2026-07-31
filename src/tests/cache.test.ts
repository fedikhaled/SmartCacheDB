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

    test('uses memory storage by default', async () => {
        await cache.close();
        cache = new SmartCacheDB();

        await cache.set('default', 'memory');

        await expect(cache.get('default')).resolves.toBe('memory');
    });

    test('accepts the typed options-object configuration', async () => {
        await cache.close();
        cache = new SmartCacheDB({
            storage: ['memory'],
            defaultTtl: 0.01,
            memory: { max: 10 }
        });

        await cache.set('short-lived', 'value');
        await new Promise(resolve => setTimeout(resolve, 20));

        await expect(cache.get('short-lived')).resolves.toBeNull();
    });

    test('honors the configured memory capacity', async () => {
        await cache.close();
        cache = new SmartCacheDB({ memory: { max: 1 } });

        await cache.set('first', 1);
        await cache.set('second', 2);

        await expect(cache.get('first')).resolves.toBeNull();
        await expect(cache.get<number>('second')).resolves.toBe(2);
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

    test.each([undefined, BigInt(1), () => undefined])(
        'rejects non-serializable value %s',
        async value => {
            await expect(cache.set('key', value)).rejects.toThrow(
                'Cache values must be JSON-serializable'
            );
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

    test('getOrSet returns a cache hit without calling the loader', async () => {
        const loader = jest.fn().mockResolvedValue('loaded');
        await cache.set('user:1', 'cached');

        await expect(cache.getOrSet('user:1', loader)).resolves.toBe('cached');
        expect(loader).not.toHaveBeenCalled();
    });

    test('getOrSet deduplicates concurrent loads for the same key', async () => {
        let resolveLoad!: (value: { id: number }) => void;
        const loader = jest.fn(() => new Promise<{ id: number }>(resolve => {
            resolveLoad = resolve;
        }));

        const requests = Array.from({ length: 10 }, () => cache.getOrSet('user:1', loader));
        await Promise.resolve();
        resolveLoad({ id: 1 });

        await expect(Promise.all(requests)).resolves.toEqual(
            Array.from({ length: 10 }, () => ({ id: 1 }))
        );
        expect(loader).toHaveBeenCalledTimes(1);
        await expect(cache.get('user:1')).resolves.toEqual({ id: 1 });
    });

    test('getOrSet removes failed loads so callers can retry', async () => {
        const loader = jest.fn()
            .mockRejectedValueOnce(new Error('loader failed'))
            .mockResolvedValueOnce('recovered');

        await expect(cache.getOrSet('key', loader)).rejects.toThrow('loader failed');
        await expect(cache.getOrSet('key', loader)).resolves.toBe('recovered');

        expect(loader).toHaveBeenCalledTimes(2);
    });

    test('getOrSet applies TTL and tag options to loaded values', async () => {
        await cache.getOrSet('post:1', async () => ({ title: 'Post' }), {
            ttl: 30,
            tags: ['posts']
        });

        await cache.deleteByTag('posts');

        await expect(cache.get('post:1')).resolves.toBeNull();
    });

    test('getOrSet does not cache null loader results', async () => {
        const loader = jest.fn().mockResolvedValue(null);

        await expect(cache.getOrSet('missing', loader)).resolves.toBeNull();
        await expect(cache.getOrSet('missing', loader)).resolves.toBeNull();

        expect(loader).toHaveBeenCalledTimes(2);
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

    test('reports auto-refresh failures without an unhandled rejection', async () => {
        jest.useFakeTimers();
        const error = new Error('refresh failed');
        const onRefreshError = jest.fn();

        await cache.setWithAutoRefresh(
            'stock:price',
            100,
            10,
            async () => { throw error; },
            onRefreshError
        );
        await jest.advanceTimersByTimeAsync(9000);

        expect(onRefreshError).toHaveBeenCalledWith(error);
        await expect(cache.get('stock:price')).resolves.toBe(100);
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

    test.each([
        [{ defaultTtl: 0 }, 'TTL must be a positive number of seconds'],
        [{ defaultTtl: Number.NaN }, 'TTL must be a positive number of seconds'],
        [{ memory: { max: 0 } }, 'Memory max must be a positive integer'],
        [{ memory: { max: 1.5 } }, 'Memory max must be a positive integer'],
        [{ websocket: { enabled: true, port: 70000 } }, 'WebSocket port must be an integer between 0 and 65535']
    ])('rejects invalid options %p', async (options, message) => {
        await cache.close();

        expect(() => new SmartCacheDB(options)).toThrow(message as string);
    });

    test('rejects unsupported storage backends at runtime', async () => {
        await cache.close();

        expect(() => new SmartCacheDB(['filesystem' as never])).toThrow(
            'Unsupported storage backend: filesystem'
        );
    });

    test('cancels pending refresh work when closed', async () => {
        jest.useFakeTimers();
        const refresh = jest.fn().mockResolvedValue('new value');
        await cache.setWithAutoRefresh('key', 'value', 10, refresh);

        await cache.close();
        jest.advanceTimersByTime(10000);

        expect(refresh).not.toHaveBeenCalled();
    });

    test('can be closed more than once', async () => {
        const firstClose = cache.close();
        const secondClose = cache.close();

        expect(secondClose).toBe(firstClose);
        await expect(firstClose).resolves.toBeUndefined();
    });

    test.each([
        ['set', (closedCache: SmartCacheDB) => closedCache.set('key', 'value')],
        ['get', (closedCache: SmartCacheDB) => closedCache.get('key')],
        ['delete', (closedCache: SmartCacheDB) => closedCache.delete('key')],
        ['clear', (closedCache: SmartCacheDB) => closedCache.clear()],
        ['deleteByTag', (closedCache: SmartCacheDB) => closedCache.deleteByTag('tag')]
    ])('rejects %s after close', async (_method, operation) => {
        await cache.close();

        await expect(operation(cache)).rejects.toThrow('SmartCacheDB instance is closed');
    });
});
