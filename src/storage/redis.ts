import { createClient, RedisClientType } from 'redis';

export class RedisStorage {
    private client: RedisClientType;

    constructor(config: any) {
        this.client = createClient(config);
        this.client.connect().catch(console.error); // Ensure Redis connects
    }

    async set(key: string, value: any, ttl: number) {
        await this.client.setEx(key, ttl, value);
    }

    async get(key: string): Promise<any> {
        return await this.client.get(key);
    }

    async delete(key: string) {
        await this.client.del(key);
    }

    async clear() {
        await this.client.flushDb();
    }
}
