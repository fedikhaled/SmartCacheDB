import { createClient, RedisClientType } from 'redis';

export class RedisStorage {
    private client: RedisClientType;
    private connection: Promise<void>;

    constructor(config: any) {
        this.client = createClient(config);
        this.connection = this.client.connect().then(() => undefined);
    }

    async set(key: string, value: any, ttl: number) {
        await this.connection;
        await this.client.setEx(key, ttl, value);
    }

    async get(key: string): Promise<any> {
        await this.connection;
        return await this.client.get(key);
    }

    async delete(key: string) {
        await this.connection;
        await this.client.del(key);
    }

    async clear() {
        await this.connection;
        await this.client.flushDb();
    }

    async close() {
        await this.connection;
        if (this.client.isOpen) {
            await this.client.quit();
        }
    }
}
