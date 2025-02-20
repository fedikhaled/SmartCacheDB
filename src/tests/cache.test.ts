import SmartCacheDB from "../cache";
import { compress, decompress } from "../compression";
import WebSocket from "ws";
let cache: SmartCacheDB;

describe("SmartCacheDB Tests", () => {
    beforeAll(() => {
        cache = new SmartCacheDB(["memory", "redis"], { host: "localhost", port: 6379 });
    });

    afterAll(async () => {
        await cache.clear();
    });

    test("should store and retrieve a value in memory", async () => {
        await cache.set("memKey", "memoryValue");
        const value = await cache.get("memKey");
        expect(value).toBe("memoryValue");
    });

    test("should store and retrieve a value in Redis", async () => {
        await cache.set("redisKey", "redisValue");
        const value = await cache.get("redisKey");
        expect(value).toBe("redisValue");
    });

    test("should delete a value from cache", async () => {
        await cache.set("delKey", "deleteValue");
        await cache.delete("delKey");
        const value = await cache.get("delKey");
        expect(value).toBeNull();
    });

    test("should clear all values from cache", async () => {
        await cache.set("clearKey", "clearValue");
        await cache.clear();
        const value = await cache.get("clearKey");
        expect(value).toBeNull();
    });

    test("should handle non-existing keys gracefully", async () => {
        const value = await cache.get("nonExistingKey");
        expect(value).toBeNull();
    });

    test("should handle setting objects in cache", async () => {
        const obj = { name: "Alice", age: 30 };
        await cache.set("objectKey", obj);
        const value = await cache.get("objectKey");
        expect(value).toEqual(obj);
    });

    test("should store and retrieve compressed values", async () => {
        const largeData = "A".repeat(1000);
        const compressedData = compress(largeData);
        await cache.set("compressedKey", compressedData, { ttl: 600 });

        const retrievedCompressedData = await cache.get("compressedKey");
        expect(retrievedCompressedData).toBe(compressedData);
    });

    test("should store values with expiration", async () => {
        await cache.set("ttlKey", "expireTest", { ttl: 1 });
        await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait for TTL expiration
        const value = await cache.get("ttlKey");
        expect(value).toBeNull();
    });

    test("should handle multi-key operations", async () => {
        await cache.setMany({ "user:1": "Alice", "user:2": "Bob" });
        const users = await cache.getMany(["user:1", "user:2"]);
        expect(users).toEqual({ "user:1": "Alice", "user:2": "Bob" });

        await cache.deleteMany(["user:1", "user:2"]);
        const deletedUsers = await cache.getMany(["user:1", "user:2"]);
        expect(deletedUsers).toEqual({ "user:1": null, "user:2": null });
    });

    test("should support cache tagging for group-based invalidation", async () => {
        await cache.setWithTag("post:100", { title: "Hello World" }, ["posts"]);
        await cache.setWithTag("post:101", { title: "Another Post" }, ["posts"]);
        await cache.deleteByTag("posts"); // Deletes all posts

        const post1 = await cache.get("post:100");
        const post2 = await cache.get("post:101");

        expect(post1).toBeNull();
        expect(post2).toBeNull();
    });

    jest.setTimeout(20000); // Extend Jest timeout

    test("should support auto-refreshing cache", async () => {
        await cache.setWithAutoRefresh("stock:price", 100, 3, async () => {
            return 150; // Simulated updated stock price
        });

        await new Promise((resolve) => setTimeout(resolve, 5000)); // Ensure refresh happens

        let value = null;
        for (let i = 0; i < 5; i++) {
            value = await cache.get("stock:price");
            if (value === 150) break;
            let messageReceived = false;
            for (let i = 0; i < 5; i++) {
                if (messageReceived) break;
                await new Promise((resolve) => setTimeout(resolve, 500)); // Retry
            }
            expect(messageReceived).toBeTruthy();

        }

        console.log("Auto-refresh value:", value);
        expect(value).toBe(150);
    });



    test("should support hybrid caching (memory + Redis)", async () => {
        const hybridCache = new SmartCacheDB(["memory", "redis"], { redisConfig: { host: "localhost", port: 6379 } });

        await hybridCache.set("hybrid:data", { key: "value" });

        const value = await hybridCache.get("hybrid:data");
        expect(value).toEqual({ key: "value" });

        await hybridCache.delete("hybrid:data");
        const deletedValue = await hybridCache.get("hybrid:data");
        expect(deletedValue).toBeNull();
    });





    test("should support JSON storage", async () => {
        const jsonObject = { theme: "dark", layout: "grid" };
        await cache.setJSON("config", jsonObject);

        const retrievedJson = await cache.getJSON("config");
        expect(retrievedJson).toEqual(jsonObject);
    });

    test("should support Buffer storage", async () => {
        const bufferData = Buffer.from("Hello, world!");
        await cache.setBuffer("file:data", bufferData);

        const retrievedBuffer = await cache.getBuffer("file:data");
        expect(retrievedBuffer?.toString()).toBe("Hello, world!");
    });
});
