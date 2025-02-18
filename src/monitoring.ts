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

    stats() {
        return {
            cacheHits: this.cacheHits,
            cacheMisses: this.cacheMisses
        };
    }
}