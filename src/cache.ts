import { MemoryStorage } from './storage/memory';
import { RedisStorage } from './storage/redis';
import { DatabaseStorage } from './storage/database';
import { compress, decompress } from './compression';
import { setupWebSocket, broadcastInvalidation } from './websocket';
import { CacheMonitor } from './monitoring';
import WebSocket from 'ws';
import type {
    CacheStats,
    DatabaseConfig,
    GetOrSetOptions,
    MemoryStorageOptions,
    SetOptions,
    SmartCacheOptions,
    SmartCacheRedisConfig,
    StorageType
} from './types';

class SmartCacheDB {
    private storageType: readonly StorageType[];
    private defaultTtl: number;
    private memoryStorage?: MemoryStorage;
    private redisStorage?: RedisStorage;
    private databaseStorage?: DatabaseStorage;
    private wsServer?: WebSocket.Server;
    private monitor: CacheMonitor;
    private tagStorage = new Map<string, Set<string>>();
    private refreshTimers = new Set<NodeJS.Timeout>();
    private inFlightLoads = new Map<string, Promise<unknown>>();
    private closePromise?: Promise<void>;

    constructor();
    constructor(options: SmartCacheOptions);
    constructor(
        storageType: readonly StorageType[],
        redisConfig?: SmartCacheRedisConfig,
        dbConfig?: DatabaseConfig
    );
    constructor(
        storageOrOptions: readonly StorageType[] | SmartCacheOptions = ['memory'],
        legacyRedisConfig: SmartCacheRedisConfig = {},
        legacyDbConfig: DatabaseConfig = {}
    ) {
        const isLegacyConfiguration = Array.isArray(storageOrOptions);
        const options = isLegacyConfiguration
            ? undefined
            : storageOrOptions as SmartCacheOptions;
        this.storageType = isLegacyConfiguration
            ? storageOrOptions as readonly StorageType[]
            : options?.storage ?? ['memory'];
        this.defaultTtl = options?.defaultTtl ?? 300;

        const redisConfig = options?.redis ?? legacyRedisConfig;
        const dbConfig = options?.database ?? legacyDbConfig;
        const memoryConfig: MemoryStorageOptions = options?.memory ?? {};
        const {
            enableWebSocket: legacyWebSocketEnabled = false,
            webSocketPort: legacyWebSocketPort = 0,
            redisConfig: nestedRedisConfig,
            ...directRedisConfig
        } = redisConfig as SmartCacheRedisConfig;
        const enableWebSocket = options?.websocket?.enabled ?? legacyWebSocketEnabled;
        const webSocketPort = options?.websocket?.port ?? legacyWebSocketPort;

        if (this.storageType.length === 0) {
            throw new TypeError('At least one storage backend is required');
        }
        const supportedStorage = new Set<StorageType>(['memory', 'redis', 'database']);
        const unsupportedStorage = this.storageType.find(storage => !supportedStorage.has(storage));
        if (unsupportedStorage) {
            throw new TypeError(`Unsupported storage backend: ${unsupportedStorage}`);
        }
        this.validateTtl(this.defaultTtl);
        const memoryMax = memoryConfig.max ?? 500;
        if (!Number.isInteger(memoryMax) || memoryMax <= 0) {
            throw new RangeError('Memory max must be a positive integer');
        }
        if (enableWebSocket && (!Number.isInteger(webSocketPort) || webSocketPort < 0 || webSocketPort > 65535)) {
            throw new RangeError('WebSocket port must be an integer between 0 and 65535');
        }

        if (this.storageType.includes('memory')) {
            this.memoryStorage = new MemoryStorage(memoryConfig);
        }
        if (this.storageType.includes('redis')) {
            this.redisStorage = new RedisStorage(nestedRedisConfig ?? directRedisConfig);
        }
        if (this.storageType.includes('database')) {
            this.databaseStorage = new DatabaseStorage(dbConfig);
        }
        if (enableWebSocket) {
            this.wsServer = setupWebSocket(webSocketPort);
        }
        
        this.monitor = new CacheMonitor();
    }

    async set(key: string, value: unknown, options: SetOptions = {}): Promise<void> {
        this.assertOpen();
        const ttl = options.ttl ?? this.defaultTtl;
        this.validateTtl(ttl);

        const compressedValue = compress(value);
        const writes: Promise<unknown>[] = [];

        if (this.memoryStorage) this.memoryStorage.set(key, compressedValue, ttl);
        if (this.redisStorage) writes.push(this.redisStorage.set(key, compressedValue, ttl));
        if (this.databaseStorage) writes.push(this.databaseStorage.set(key, compressedValue));

        await Promise.all(writes);
    }

    private validateTtl(ttl: number): void {
        if (!Number.isFinite(ttl) || ttl <= 0) {
            throw new RangeError('TTL must be a positive number of seconds');
        }
    }

    private assertOpen(): void {
        if (this.closePromise) {
            throw new Error('SmartCacheDB instance is closed');
        }
    }

    async get<T = unknown>(key: string): Promise<T | null> {
        this.assertOpen();
        const value =
            (this.memoryStorage && this.memoryStorage.get(key)) ||
            (this.redisStorage && (await this.redisStorage.get(key))) ||
            (this.databaseStorage && (await this.databaseStorage.get(key)));

        if (value === undefined || value === null) {
            this.monitor.recordMiss();
            return null;
        }

        this.monitor.recordHit();
        return decompress(value) as T;
    }

    async getOrSet<T>(
        key: string,
        loader: () => Promise<T>,
        options: GetOrSetOptions = {}
    ): Promise<T> {
        this.assertOpen();
        const cachedValue = await this.get<T>(key);
        if (cachedValue !== null) return cachedValue;

        const existingLoad = this.inFlightLoads.get(key) as Promise<T> | undefined;
        if (existingLoad) return existingLoad;

        const load = (async () => {
            const loadedValue = await loader();
            if (loadedValue !== null) {
                if (options.tags?.length) {
                    await this.setWithTag(key, loadedValue, options.tags, options.ttl);
                } else {
                    await this.set(key, loadedValue, { ttl: options.ttl });
                }
            }
            return loadedValue;
        })();

        this.inFlightLoads.set(key, load);
        try {
            return await load;
        } finally {
            if (this.inFlightLoads.get(key) === load) {
                this.inFlightLoads.delete(key);
            }
        }
    }

    async delete(key: string): Promise<void> {
        this.assertOpen();
        const deletions: Promise<unknown>[] = [];

        if (this.memoryStorage) this.memoryStorage.delete(key);
        if (this.redisStorage) deletions.push(this.redisStorage.delete(key));
        if (this.databaseStorage) deletions.push(this.databaseStorage.delete(key));

        await Promise.all(deletions);
        for (const [tag, keys] of this.tagStorage) {
            keys.delete(key);
            if (keys.size === 0) this.tagStorage.delete(tag);
        }
        if (this.wsServer) {
            broadcastInvalidation(this.wsServer, key);
        }
    }

    async clear(): Promise<void> {
        this.assertOpen();
        const clears: Promise<unknown>[] = [];

        if (this.memoryStorage) this.memoryStorage.clear();
        if (this.redisStorage) clears.push(this.redisStorage.clear());
        if (this.databaseStorage) clears.push(this.databaseStorage.clear());

        await Promise.all(clears);
        this.tagStorage.clear();
    }

    stats(): CacheStats {
        return this.monitor.stats();
    }

    close(): Promise<void> {
        if (!this.closePromise) {
            this.closePromise = this.performClose();
        }
        return this.closePromise;
    }

    private async performClose(): Promise<void> {
        for (const timer of this.refreshTimers) {
            clearTimeout(timer);
        }
        this.refreshTimers.clear();
        this.inFlightLoads.clear();
        this.memoryStorage?.clear();
        this.tagStorage.clear();

        if (this.redisStorage) {
            await this.redisStorage.close();
        }

        if (this.wsServer) {
            const wsServer = this.wsServer;
            this.wsServer = undefined;
            await new Promise<void>((resolve, reject) => {
                wsServer.close(error => error ? reject(error) : resolve());
            });
        }
    }


    async setMany(keysValues: Record<string, unknown>, ttl?: number): Promise<void> {
        await Promise.all(
            Object.entries(keysValues).map(([key, value]) => this.set(key, value, { ttl }))
        );
    }

    async getMany<T = unknown>(keys: string[]): Promise<Record<string, T | null>> {
        const results: Record<string, T | null> = {};
        await Promise.all(keys.map(async key => {
            results[key] = await this.get<T>(key);
        }));
        return results;
    }

    async deleteMany(keys: string[]): Promise<void> {
        await Promise.all(keys.map(key => this.delete(key)));
    }


    async setWithTag(key: string, value: unknown, tags: readonly string[], ttl?: number): Promise<void> {
        await this.set(key, value, { ttl });
        for (const tag of tags) {
            const keys = this.tagStorage.get(tag) ?? new Set<string>();
            keys.add(key);
            this.tagStorage.set(tag, keys);
        }
    }

    async deleteByTag(tag: string): Promise<void> {
        this.assertOpen();
        const keys = this.tagStorage.get(tag);
        if (!keys) return;

        await this.deleteMany([...keys]);
        this.tagStorage.delete(tag);
    }


    async setWithAutoRefresh<T>(
        key: string,
        value: T,
        ttl: number,
        refreshCallback: () => Promise<T>,
        onRefreshError: (error: unknown) => void = () => undefined
    ): Promise<void> {
        await this.set(key, value, { ttl });

        const timer = setTimeout(async () => {
            try {
                const newValue = await refreshCallback();
                await this.set(key, newValue, { ttl });
            } catch (error) {
                onRefreshError(error);
            } finally {
                this.refreshTimers.delete(timer);
            }
        }, ttl * 1000 * 0.9); // Refresh before expiration
        this.refreshTimers.add(timer);
    }


    async setJSON(key: string, json: object, ttl?: number): Promise<void> {
        const jsonString = JSON.stringify(json);
        await this.set(key, jsonString, { ttl });
    }

    async getJSON<T extends object = Record<string, unknown>>(key: string): Promise<T | null> {
        const jsonString = await this.get<string>(key);
        return jsonString ? JSON.parse(jsonString) as T : null;
    }

    async setBuffer(key: string, buffer: Buffer, ttl?: number): Promise<void> {
        const bufferString = buffer.toString('base64');
        await this.set(key, bufferString, { ttl });
    }

    async getBuffer(key: string): Promise<Buffer | null> {
        const bufferString = await this.get<string>(key);
        return bufferString ? Buffer.from(bufferString, 'base64') : null;
    }
}

export default SmartCacheDB;
