import { LRUCache } from 'lru-cache';

export class MemoryStorage {
    private cache: LRUCache<string, any>;

    constructor() {
        this.cache = new LRUCache({ max: 500 });
    }

    set(key: string, value: any, ttl: number) {
        this.cache.set(key, value, { ttl });
    }

    get(key: string) {
        return this.cache.get(key);
    }

    delete(key: string) {
        this.cache.delete(key);
    }

    clear() {
        this.cache.clear();
    }

   
    setMany(keysValues: Record<string, any>, ttl?: number) {
        for (const key in keysValues) {
            this.set(key, keysValues[key], ttl);
        }
    }

    getMany(keys: string[]): Record<string, any> {
        const results: Record<string, any> = {};
        for (const key of keys) {
            results[key] = this.get(key);
        }
        return results;
    }

    deleteMany(keys: string[]) {
        for (const key of keys) {
            this.delete(key);
        }
    }
}
