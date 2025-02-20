import { MemoryStorage } from './storage/memory';
import { RedisStorage } from './storage/redis';
import { DatabaseStorage } from './storage/database';
import { compress, decompress } from './compression';
import { setupWebSocket, broadcastInvalidation } from './websocket';
import { CacheMonitor } from './monitoring';

class SmartCacheDB {
    private memoryStorage?: MemoryStorage;
    private redisStorage?: RedisStorage;
    private databaseStorage?: DatabaseStorage;
    private wsServer: any;
    private monitor: CacheMonitor;
    private tagStorage: Record<string, string[]> = {};

    constructor(
        private storageType: string[] = ['memory', 'redis'],
        redisConfig = {},
        dbConfig = {}
    ) {
        if (this.storageType.includes('memory')) {
            this.memoryStorage = new MemoryStorage();
        }
        if (this.storageType.includes('redis')) {
            this.redisStorage = new RedisStorage(redisConfig);
        }
        if (this.storageType.includes('database')) {
            this.databaseStorage = new DatabaseStorage(dbConfig);
        }
        if (!this.wsServer) {
            this.wsServer = setupWebSocket();
        }
        
        this.monitor = new CacheMonitor();
    }

    async set(key: string, value: any, options: { ttl?: number } = {}) {
        const ttl = options.ttl || 300;
        const compressedValue = compress(value);

        if (this.memoryStorage) this.memoryStorage.set(key, compressedValue, ttl);
        if (this.redisStorage) this.redisStorage.set(key, compressedValue, ttl);
        if (this.databaseStorage) this.databaseStorage.set(key, compressedValue);
    }

    async get(key: string) {
        let value =
            (this.memoryStorage && this.memoryStorage.get(key)) ||
            (this.redisStorage && (await this.redisStorage.get(key))) ||
            (this.databaseStorage && (await this.databaseStorage.get(key)));

        return value ? decompress(value) : null;
    }

    async delete(key: string) {
        if (this.memoryStorage) this.memoryStorage.delete(key);
        if (this.redisStorage) this.redisStorage.delete(key);
        if (this.databaseStorage) this.databaseStorage.delete(key);
        broadcastInvalidation(this.wsServer, key);
    }

    async clear() {
        if (this.memoryStorage) this.memoryStorage.clear();
        if (this.redisStorage) this.redisStorage.clear?.();
        if (this.databaseStorage) await this.databaseStorage.clear?.();
    }


    async setMany(keysValues: Record<string, any>, ttl?: number): Promise<void> {
        for (const key in keysValues) {
            await this.set(key, keysValues[key], { ttl });
        }
    }

    async getMany(keys: string[]): Promise<Record<string, any>> {
        const results: Record<string, any> = {};
        for (const key of keys) {
            results[key] = await this.get(key);
        }
        return results;
    }

    async deleteMany(keys: string[]): Promise<void> {
        for (const key of keys) {
            await this.delete(key);
        }
    }


    async setWithTag(key: string, value: any, tags: string[], ttl?: number): Promise<void> {
        await this.set(key, value, { ttl });
        for (const tag of tags) {
            if (!this.tagStorage[tag]) this.tagStorage[tag] = [];
            this.tagStorage[tag].push(key);
        }
    }

    async deleteByTag(tag: string): Promise<void> {
        if (this.tagStorage[tag]) {
            await this.deleteMany(this.tagStorage[tag]);
            delete this.tagStorage[tag];
        }
    }


    async setWithAutoRefresh(key: string, value: any, ttl: number, refreshCallback: () => Promise<any>): Promise<void> {
        await this.set(key, value, { ttl });

        setTimeout(async () => {
            const newValue = await refreshCallback();
            await this.set(key, newValue, { ttl });
        }, ttl * 1000 * 0.9); // Refresh before expiration
    }


    async setJSON(key: string, json: object, ttl?: number): Promise<void> {
        const jsonString = JSON.stringify(json);
        await this.set(key, jsonString, { ttl });
    }

    async getJSON(key: string): Promise<object | null> {
        const jsonString = await this.get(key);
        return jsonString ? JSON.parse(jsonString) : null;
    }

    async setBuffer(key: string, buffer: Buffer, ttl?: number): Promise<void> {
        const bufferString = buffer.toString('base64');
        await this.set(key, bufferString, { ttl });
    }

    async getBuffer(key: string): Promise<Buffer | null> {
        const bufferString = await this.get(key);
        return bufferString ? Buffer.from(bufferString, 'base64') : null;
    }
}

export default SmartCacheDB;
