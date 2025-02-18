import { LRUCache } from 'lru-cache';

class CacheOptimizer {
    private accessPatterns: LRUCache<string, number>;

    constructor() {
        this.accessPatterns = new LRUCache({ max: 500 });
    }

    trackAccess(key: string): void {
        const count = this.accessPatterns.get(key) || 0;
        this.accessPatterns.set(key, count + 1);
    }

    calculateTTL(key: string): number {
        const accessCount = this.accessPatterns.get(key) || 0;
        if (accessCount > 50) return 600; // 10 min for high-frequency data
        if (accessCount > 20) return 300; // 5 min for medium-frequency
        return 60; // 1 min default
    }
}

export default CacheOptimizer;
