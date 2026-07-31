import { createClient, RedisClientOptions } from 'redis';

export class RedisStorage {
    private client: ReturnType<typeof createClient>;
    private connection: Promise<void>;

    constructor(config: RedisClientOptions) {
        this.client = createClient(config) as ReturnType<typeof createClient>;
        this.connection = this.client.connect().then(() => undefined);
    }

    async set(key: string, value: string, ttl: number): Promise<void> {
        await this.connection;
        await this.client.setEx(key, ttl, value);
    }

    async get(key: string): Promise<string | null> {
        await this.connection;
        return await this.client.get(key);
    }

    async delete(key: string): Promise<void> {
        await this.connection;
        await this.client.del(key);
    }

    async clear(): Promise<void> {
        await this.connection;
        await this.client.flushDb();
    }

    async close(): Promise<void> {
        await this.connection;
        if (this.client.isOpen) {
            await this.client.quit();
        }
    }
}
