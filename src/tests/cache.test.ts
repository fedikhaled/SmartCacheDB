import SmartCacheDB from "..";

describe('SmartCacheDB Tests', () => {
    let cache: SmartCacheDB;

    beforeEach(() => {
        cache = new SmartCacheDB('memory');
    });

    test('should store and retrieve a value', async () => {
        await cache.set('user:1', { name: 'Alice', age: 30 });
        const value = await cache.get('user:1');
        expect(value).toEqual({ name: 'Alice', age: 30 });
    });

    test('should delete a value', async () => {
        await cache.set('user:2', { name: 'Bob' });
        await cache.delete('user:2');
        const value = await cache.get('user:2');
        expect(value).toBeNull();
    });

    test('should clear all values', async () => {
        await cache.set('user:3', { name: 'Charlie' });
        await cache.set('user:4', { name: 'Dave' });
        await cache.clear();
        expect(await cache.get('user:3')).toBeNull();
        expect(await cache.get('user:4')).toBeNull();
    });
});
