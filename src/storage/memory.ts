import { LRUCache } from 'lru-cache';
import type { MemoryStorageOptions } from '../types';

export class MemoryStorage {
    private cache: LRUCache<string, string>;

    constructor(options: MemoryStorageOptions = {}) {
        this.cache = new LRUCache({ max: options.max ?? 500 });
    }

    set(key: string, value: string, ttl: number): void {
        this.cache.set(key, value, { ttl: ttl * 1000 });
    }

    get(key: string): string | undefined {
        return this.cache.get(key);
    }

    delete(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}
