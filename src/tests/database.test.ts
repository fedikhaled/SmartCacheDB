import { compress } from '../compression';
import { DatabaseStorage } from '../storage/database';

describe('DatabaseStorage', () => {
    test('writes values with parameterized upsert SQL', async () => {
        const query = jest.fn().mockResolvedValue(undefined);
        const storage = new DatabaseStorage({ connection: { query } });

        await storage.set('user:1', 'encoded-value');

        expect(query).toHaveBeenCalledWith(
            expect.stringContaining('ON DUPLICATE KEY UPDATE'),
            ['user:1', 'encoded-value', 'encoded-value']
        );
    });

    test('reads rows returned directly by a database driver', async () => {
        const encoded = compress({ name: 'Ada' });
        const query = jest.fn().mockResolvedValue([{ value: encoded }]);
        const storage = new DatabaseStorage({ connection: { query } });

        await expect(storage.get('user:1')).resolves.toBe(encoded);
    });

    test('reads MySQL tuple results and Buffer values', async () => {
        const encoded = compress('value');
        const query = jest.fn().mockResolvedValue([[{ value: Buffer.from(encoded) }], []]);
        const storage = new DatabaseStorage({ connection: { query } });

        await expect(storage.get('key')).resolves.toBe(encoded);
    });

    test.each([[], [{}], [{ value: 42 }], { value: 'not-an-array' }])(
        'treats unsupported query result %p as a miss',
        async result => {
            const query = jest.fn().mockResolvedValue(result);
            const storage = new DatabaseStorage({ connection: { query } });

            await expect(storage.get('missing')).resolves.toBeNull();
        }
    );

    test('supports delete and clear without interpolating keys', async () => {
        const query = jest.fn().mockResolvedValue(undefined);
        const storage = new DatabaseStorage({ connection: { query } });

        await storage.delete('unsafe\' key');
        await storage.clear();

        expect(query).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining('WHERE key=?'),
            ["unsafe' key"]
        );
        expect(query).toHaveBeenNthCalledWith(2, 'DELETE FROM cache');
    });

    test('is a no-op without a configured connection', async () => {
        const storage = new DatabaseStorage({});

        await expect(storage.set('key', 'value')).resolves.toBeUndefined();
        await expect(storage.get('key')).resolves.toBeNull();
        await expect(storage.delete('key')).resolves.toBeUndefined();
        await expect(storage.clear()).resolves.toBeUndefined();
    });
});
