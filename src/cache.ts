import { MemoryStorage } from './storage/memory';
import { RedisStorage } from './storage/redis';
import { DatabaseStorage } from './storage/database';
import { compress, decompress } from './compression';
import { setupWebSocket, broadcastInvalidation } from './websocket';
import { CacheMonitor } from './monitoring';

class SmartCacheDB {
    private memoryStorage: MemoryStorage;
    private redisStorage: RedisStorage;
    private databaseStorage: DatabaseStorage;
    private wsServer: any;
    private monitor: CacheMonitor;

    constructor(storageType: string[] = ['memory', 'redis'], redisConfig = {}, dbConfig = {}) {
        this.memoryStorage = new MemoryStorage();
        this.redisStorage = new RedisStorage(redisConfig);
        this.databaseStorage = new DatabaseStorage(dbConfig);
        this.wsServer = setupWebSocket();
        this.monitor = new CacheMonitor();
    }

    async set(key: string, value: any, options: { ttl?: number } = {}) {
        const ttl = options.ttl || 300;
        const compressedValue = compress(value);
        
        this.memoryStorage.set(key, compressedValue, ttl);
        this.redisStorage.set(key, compressedValue, ttl);
        this.databaseStorage.set(key, compressedValue);
    }

    async get(key: string) {
        let value = this.memoryStorage.get(key) || await this.redisStorage.get(key) || await this.databaseStorage.get(key);
        return value ? decompress(value) : null;
    }

    async delete(key: string) {
        this.memoryStorage.delete(key);
        this.redisStorage.delete(key);
        this.databaseStorage.delete(key);
        broadcastInvalidation(this.wsServer, key);
    }

    async clear() {
        this.memoryStorage.clear();
        this.redisStorage.clear?.();
    
        if (this.databaseStorage) {
            await this.databaseStorage.clear?.();
        }
    }
    
}

export default SmartCacheDB;
