import { LRUCache } from 'lru-cache';
import { createClient, RedisClientType } from 'redis';
import CacheOptimizer from './optimizer';

class SmartCacheDB {
    private cache: LRUCache<string, any>;
    private redisClient?: RedisClientType;
    private optimizer: CacheOptimizer;

    constructor(storage: 'memory' | 'redis' = 'memory', redisConfig?: any) {
        this.cache = new LRUCache({ max: 100 });
        this.optimizer = new CacheOptimizer();

        if (storage === 'redis') {
            this.redisClient = createClient(redisConfig);
            this.redisClient.connect().catch(console.error);
        }
    }

    async set(key: string, value: any, ttl?: number): Promise<void> {
        const autoTTL = this.optimizer.calculateTTL(key);
        const finalTTL = ttl ?? autoTTL;

        if (this.redisClient) {
            await this.redisClient.setEx(key, finalTTL, JSON.stringify(value));
        } else {
            this.cache.set(key, value, { ttl: finalTTL * 1000 });
        }
    }

    async get(key: string): Promise<any> {
        if (this.redisClient) {
            const data = await this.redisClient.get(key);
            return data ? JSON.parse(data) : null;
        }
        return this.cache.has(key) ? this.cache.get(key) : null;
    }


    async delete(key: string): Promise<void> {
        if (this.redisClient) {
            await this.redisClient.del(key);
        } else {
            this.cache.delete(key);
        }
    }

    async clear(): Promise<void> {
        if (this.redisClient) {
            await this.redisClient.flushAll();
        } else {
            this.cache.clear();
        }
    }
}

export default SmartCacheDB;
