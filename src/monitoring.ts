import type { CacheStats } from './types';

export class CacheMonitor {
    private cacheHits: number;
    private cacheMisses: number;

    constructor() {
        this.cacheHits = 0;
        this.cacheMisses = 0;
    }

    recordHit() {
        this.cacheHits++;
    }

    recordMiss() {
        this.cacheMisses++;
    }

    stats(): CacheStats {
        return {
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses
        };
    }
}
