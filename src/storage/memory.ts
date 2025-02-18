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
}
