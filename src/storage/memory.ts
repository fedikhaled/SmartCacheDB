import { LRUCache } from 'lru-cache';

export class MemoryStorage {
    private cache: LRUCache<string, string>;

    constructor() {
        this.cache = new LRUCache({ max: 500 });
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

   
    setMany(keysValues: Record<string, string>, ttl = 300): void {
        for (const key in keysValues) {
            this.set(key, keysValues[key], ttl);
        }
    }

    getMany(keys: string[]): Record<string, string | undefined> {
        const results: Record<string, string | undefined> = {};
        for (const key of keys) {
            results[key] = this.get(key);
        }
        return results;
    }

    deleteMany(keys: string[]): void {
        for (const key of keys) {
            this.delete(key);
        }
    }
}
