import { createClient, RedisClientOptions } from 'redis';

export class RedisStorage {
    private client: ReturnType<typeof createClient>;
    private connection?: Promise<void>;

    constructor(config: RedisClientOptions) {
        this.client = createClient(config) as ReturnType<typeof createClient>;
    }

    private async ensureConnected(): Promise<void> {
        if (this.client.isOpen) return;

        if (!this.connection) {
            this.connection = this.client.connect().then(() => undefined);
            this.connection.catch(() => {
                this.connection = undefined;
            });
        }

        await this.connection;
    }

    async set(key: string, value: string, ttl: number): Promise<void> {
        await this.ensureConnected();
        await this.client.setEx(key, ttl, value);
    }

    async get(key: string): Promise<string | null> {
        await this.ensureConnected();
        return await this.client.get(key);
    }

    async delete(key: string): Promise<void> {
        await this.ensureConnected();
        await this.client.del(key);
    }

    async clear(): Promise<void> {
        await this.ensureConnected();
        await this.client.flushDb();
    }

    async close(): Promise<void> {
        if (this.connection) {
            await this.connection;
        }
        if (this.client.isOpen) {
            await this.client.quit();
        }
        this.connection = undefined;
    }
}
