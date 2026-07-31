import type { RedisClientOptions } from 'redis';

export type StorageType = 'memory' | 'redis' | 'database';

export interface SetOptions {
    /** Time to live in seconds. */
    ttl?: number;
}

export interface CacheStats {
    cacheHits: number;
    cacheMisses: number;
}

export interface DatabaseConnection {
    query(sql: string, values?: readonly unknown[]): Promise<unknown>;
}

export interface DatabaseConfig {
    connection?: DatabaseConnection;
}

export type SmartCacheRedisConfig = RedisClientOptions & {
    /** Start the optional invalidation WebSocket server. */
    enableWebSocket?: boolean;
    /** WebSocket port. A value of 0 asks the operating system for a free port. */
    webSocketPort?: number;
    /** Backward-compatible nested Redis client configuration. */
    redisConfig?: RedisClientOptions;
};
