## SmartCacheDB

SmartCacheDB is a high‑performance, multi‑backend caching library for Node.js.  
It combines in‑memory LRU caching, Redis, and optional database storage, with adaptive TTLs, transparent compression, tag‑based invalidation, and optional WebSocket‑based cache invalidation.

---

### Overview

SmartCacheDB is designed for applications that need:

- Low‑latency access to frequently used data.
- A single abstraction over multiple cache backends.
- Automatic tuning of cache TTLs based on access patterns.
- Basic observability of cache effectiveness (hits vs misses).

Typical use cases include API response caching, configuration caching, session‑like data, and read‑heavy workloads that should avoid repeated database queries.

---

### Features

- **Multiple backends**: `memory`, `redis`, and `database`, which can be combined (for example, `["memory", "redis"]`).
- **Adaptive TTLs**: If no TTL is provided, SmartCacheDB uses access statistics to derive a suitable TTL per key.
- **Transparent compression**: Values are compressed (Gzip) before storage and decompressed on read.
- **Tag‑based invalidation**: Group keys under tags and invalidate a whole group in one operation.
- **Auto‑refresh**: Proactively refresh hot keys before they expire, using an application‑provided callback.
- **Binary and JSON helpers**: Convenience methods for `Buffer` and JSON payloads.
- **Optional WebSocket invalidation**: Broadcast invalidation events to subscribed clients.
- **Hit/miss statistics**: Simple metrics to understand cache performance.

---

### Installation

```bash
npm install smartcachedb
```

or

```bash
yarn add smartcachedb
```

#### Redis (optional)

Redis is only required if you use the `redis` backend. A minimal local setup using Docker:

```bash
docker run --name redis -d -p 6379:6379 redis
```

---

### Getting Started

#### Basic Usage

```ts
import SmartCacheDB from "smartcachedb";

const cache = new SmartCacheDB(["memory"]);

await cache.set("user:1", { name: "Alice" });
const user = await cache.get("user:1");
// user => { name: "Alice" }
```

#### Multiple Backends (Memory + Redis)

```ts
import SmartCacheDB, { StorageBackend, SmartCacheDBOptions } from "smartcachedb";

const backends: StorageBackend[] = ["memory", "redis"];

const redisConfig = {
  url: "redis://localhost:6379",
};

const options: SmartCacheDBOptions = {
  enableWebSocket: false,
};

const cache = new SmartCacheDB(backends, redisConfig, {}, options);
```

---

### Configuration

Constructor signature:

```ts
new SmartCacheDB(
  storageType?: StorageBackend[],   // default: ["memory", "redis"]
  redisConfig?: any,                // passed to node-redis createClient
  dbConfig?: { connection?: any },  // database client providing .query(...)
  options?: SmartCacheDBOptions     // WebSocket configuration
);
```

#### Storage Backends

- **memory**: Uses an in‑process LRU cache.
- **redis**: Uses Redis via `node-redis`. Requires a reachable Redis instance.
- **database**: Uses the provided DB connection and a `cache` table with columns `key` and `value`.

#### WebSocket Options

`SmartCacheDBOptions`:

```ts
interface SmartCacheDBOptions {
  enableWebSocket?: boolean;       // default: false
  wsServer?: WebSocket.Server;     // optional existing WebSocket server instance
}
```

If `enableWebSocket` is `true` and `wsServer` is not provided, SmartCacheDB will create its own WebSocket server. When `delete` is called, an invalidation message containing the key is broadcast to all connected clients.

---

### Core API

All methods are asynchronous unless otherwise specified.

- **`set(key, value, options?)`**
  - Stores `value` under `key`.
  - `options?: { ttl?: number }`. If omitted, an adaptive TTL derived from access patterns is used.

- **`get(key)`**
  - Returns the stored value or `null` if the key does not exist.
  - Records a cache hit or miss and updates access statistics.

- **`delete(key)`**
  - Removes a single key from all configured backends.
  - If WebSocket invalidation is enabled, broadcasts an invalidation message.

- **`clear()`**
  - Clears all entries from all configured backends.

- **`setMany(keysValues, ttl?)`**
  - Batch variant of `set`. Accepts an object mapping keys to values.

- **`getMany(keys)`**
  - Batch variant of `get`. Returns an object mapping keys to values (or `null` for missing keys).

- **`deleteMany(keys)`**
  - Batch variant of `delete`.

- **`setWithTag(key, value, tags, ttl?)`**
  - Stores a value and associates it with one or more tags.

- **`deleteByTag(tag)`**
  - Deletes all keys currently associated with the given tag.

- **`setWithAutoRefresh(key, value, ttl, refreshCallback)`**
  - Stores `value` under `key` with TTL `ttl` (in seconds).
  - Schedules a refresh shortly before expiration using `refreshCallback`, which should return the new value.

- **`setJSON(key, json, ttl?)` / `getJSON(key)`**
  - Helpers for storing and retrieving JSON objects.

- **`setBuffer(key, buffer, ttl?)` / `getBuffer(key)`**
  - Helpers for storing and retrieving binary data as `Buffer` instances.

- **`getStats()`**
  - Returns `{ cacheHits: number, cacheMisses: number }`.

---

### Usage Examples

#### Tag‑Based Invalidation

```ts
await cache.setWithTag("post:100", { title: "Hello World" }, ["posts"]);
await cache.setWithTag("post:101", { title: "Another Post" }, ["posts"]);

// Invalidate all cached posts
await cache.deleteByTag("posts");
```

#### Auto‑Refreshing Entries

```ts
await cache.setWithAutoRefresh(
  "stock:price",
  100,
  30, // seconds
  async () => {
    // Fetch the latest price
    return 150;
  }
);
```

#### WebSocket‑Based Invalidation

```ts
import WebSocket from "ws";
import SmartCacheDB, { SmartCacheDBOptions } from "smartcachedb";

const wsServer = new WebSocket.Server({ port: 8080 });

const options: SmartCacheDBOptions = {
  enableWebSocket: true,
  wsServer,
};

const cache = new SmartCacheDB(["memory"], {}, {}, options);

wsServer.on("connection", (socket) => {
  socket.on("message", (data) => {
    console.log("Client message:", data.toString());
  });
});

await cache.set("live:data", { status: "active" });
await cache.delete("live:data"); // broadcasts an invalidation event
```

---

### Observability

SmartCacheDB provides simple, in‑memory statistics:

```ts
const stats = cache.getStats();
// stats.cacheHits, stats.cacheMisses
```

These values can be exported to your metrics pipeline (for example, Prometheus, Grafana, or a custom dashboard) to monitor cache effectiveness over time.

---

### Development and Testing

- The project is written in TypeScript and compiled with `tsc`.
- Tests are implemented with Jest.

Common scripts (from `package.json`):

```bash
npm run build
npm test
```

---

### License

SmartCacheDB is distributed under the MIT License. See the license text in the repository for details.

# 🚀 SmartCacheDB - High-Performance Adaptive Caching for Node.js  
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)  

**SmartCacheDB** is a high-performance caching system for Node.js that **dynamically optimizes cache expiration** based on access patterns.  
It supports **in-memory storage (LRU)**, **Redis**, and **database caching**, reducing database load and improving performance.  
Developers can now **choose storage types dynamically** for more flexibility!  

---

## 📌 **Features**
✅ **Optimized Cache Expiration** - No need to manually set TTL!  
✅ **Supports Redis, In-Memory, & Database** - Choose storage dynamically!  
✅ **Auto-Invalidation** - Cache updates automatically when data changes.  
✅ **LRU Cache Support** - Uses Least Recently Used (LRU) caching.  
✅ **Simple API** - Works as a drop-in replacement for Redis/Memcached.  
✅ **WebSocket-Based Cache Invalidation** - Real-time cache updates when data changes.  
✅ **Persistent Storage Support** - Keep cache even after server restarts.  
✅ **Compression Support** - Reduce memory usage with Gzip compression.  
✅ **Multi-Backend Support** - Use multiple storage backends together (e.g., Memory + Redis + Database).  
✅ **Hybrid Caching** - Combine different cache strategies dynamically.  
✅ **Multi-Key Operations** - Batch set, get, and delete for performance.  
✅ **Cache Tags** - Group-based cache invalidation.  
✅ **Auto Refresh** - Preload cache before expiration.  
✅ **JSON & Buffer Storage** - Store structured and binary data efficiently.  
✅ **Efficient Testing Suite** - Ensures reliability with Jest tests.  

---

## 📦 **Installation**
Install the package using `npm`:
```sh
npm install smartcachedb
```
or using `yarn`:
```sh
yarn add smartcachedb
```

### **Installing Redis (Required for Redis Mode)**
#### **🔹 Windows**
```sh
wsl --install
sudo apt update
sudo apt install redis-server
sudo service redis-server start
redis-cli ping
```

#### **🔹 Linux (Ubuntu/Debian)**
```sh
sudo apt update
sudo apt install redis-server -y
sudo systemctl start redis
sudo systemctl enable redis
redis-cli ping
```

#### **🔹 macOS**
```sh
brew install redis
brew services start redis
redis-cli ping
```

#### **🔹 Docker (Cross-Platform Solution)**
```sh
docker run --name redis -d -p 6379:6379 redis
```

---

## 🚀 **Usage Examples**

### **1️⃣ Basic Set & Get Example**
```typescript
await cache.set("user:1", { name: "Alice" });
const user = await cache.get("user:1");
console.log(user);
```

### **2️⃣ Choosing Storage Dynamically**
```typescript
const cacheMemory = new SmartCacheDB(['memory']);
const cacheRedis = new SmartCacheDB(['redis'], { host: 'localhost', port: 6379 });
const cacheHybrid = new SmartCacheDB(['memory', 'redis', 'database']);
```

### **3️⃣ Multi-Key Operations**
```typescript
await cache.setMany({ "user:1": "Alice", "user:2": "Bob" });
const users = await cache.getMany(["user:1", "user:2"]);
console.log(users);
await cache.deleteMany(["user:1", "user:2"]);
```

### **4️⃣ Cache Tags (Group-based invalidation)**
```typescript
await cache.setWithTag("post:100", { title: "Hello World" }, ["posts"]);
await cache.setWithTag("post:101", { title: "Another Post" }, ["posts"]);
await cache.deleteByTag("posts");
```

### **5️⃣ Auto-Refreshing Cache**
```typescript
await cache.setWithAutoRefresh("stock:price", 100, 30, async () => {
    return Math.random() * 100;
});
```

### **6️⃣ JSON & Buffer Storage**
```typescript
await cache.setJSON("config", { theme: "dark", layout: "grid" });
const config = await cache.getJSON("config");
console.log(config);
await cache.setBuffer("file:data", Buffer.from("Hello, world!"));
const file = await cache.getBuffer("file:data");
console.log(file.toString());
```

### **7️⃣ Compression Support**
```typescript
const cache = new SmartCacheDB(['memory']);
await cache.set('analytics:data', { users: 10000, traffic: 'high' }, { compress: true });
const analytics = await cache.get('analytics:data');
console.log(analytics);
```

### **8️⃣ WebSocket-Based Cache Invalidation**
```typescript
import WebSocket from 'ws';
const cache = new SmartCacheDB(['memory', 'redis'], { enableWebSocket: true });
await cache.set('live:data', { status: 'active' });
const ws = new WebSocket('ws://localhost:8080');
ws.on('message', (data) => console.log("Cache invalidation message received:", data));
await cache.delete('live:data');
```

### **9️⃣ API Caching with Express.js**
```typescript
import express from 'express';
const app = express();
const cache = new SmartCacheDB(['memory', 'redis'], { redisConfig: { host: 'localhost', port: 6379 } });
app.get('/data', async (req, res) => {
    const cachedData = await cache.get('api:data');
    if (cachedData) return res.json({ source: 'cache', data: cachedData });
    const freshData = { message: 'Fetched from API', timestamp: Date.now() };
    await cache.set('api:data', freshData, { ttl: 600 });
    res.json({ source: 'API', data: freshData });
});
app.listen(3000, () => console.log('Server running on port 3000'));
```

---

## **🛠️ API Methods**
| Method | Description |
|--------|------------|
| `set(key, value, ttl?)` | Stores a value with optional TTL |
| `get(key)` | Retrieves a value |
| `delete(key)` | Deletes a value |
| `clear()` | Clears the entire cache |
| `setMany(keysValues, ttl?)` | Stores multiple key-value pairs with optional TTL |
| `getMany(keys)` | Retrieves multiple values |
| `deleteMany(keys)` | Deletes multiple keys |
| `setWithTag(key, value, tags, ttl?)` | Stores a value and assigns tags for group invalidation |
| `deleteByTag(tag)` | Deletes all cache entries associated with a specific tag |
| `setWithAutoRefresh(key, value, ttl, refreshCallback)` | Stores a value and auto-refreshes before expiration |
| `setJSON(key, json, ttl?)` | Stores a JSON object in cache |
| `getJSON(key)` | Retrieves and parses a stored JSON object |
| `setBuffer(key, buffer, ttl?)` | Stores binary data in cache |
| `getBuffer(key)` | Retrieves binary data from cache |

---


## 📜 **License**
This project is **open-source** and available under the **MIT License**.

---

## 📞 **Contact**
For questions or feature requests, feel free to reach out:
- **GitHub Issues:** [Open an issue](https://github.com/fedikhaled/SmartCacheDB/issues)
- **Email:** fedikhaled01@gmail.com 

---

### 🚀 **Star this project if you like it!** ⭐

## 🚀 SmartCacheDB – High-Performance Adaptive Caching for Node.js

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

**SmartCacheDB** is a high‑performance, multi‑backend caching layer for Node.js.  
It supports **in‑memory LRU**, **Redis**, and **database storage**, with **automatic TTL optimization**, **transparent compression**, **tag-based invalidation**, and **optional WebSocket‑driven cache invalidation**.

---

### 📌 Features

- **Adaptive TTLs**: TTL is automatically tuned based on access patterns (via `CacheOptimizer`), while still allowing manual overrides.
- **Multiple backends**: `memory`, `redis`, and `database` backends that can be combined (e.g. `['memory', 'redis']`).
- **Transparent compression**: Values are Gzip‑compressed under the hood and returned decompressed.
- **Tag-based invalidation**: Invalidate groups of keys with a single tag.
- **Auto‑refresh**: Keep hot keys fresh with automatic background refresh before expiration.
- **JSON & Buffer helpers**: First‑class helpers for structured and binary data.
- **Optional WebSocket invalidation**: Broadcast invalidation events to connected clients.
- **Monitoring**: Built‑in hit/miss statistics for basic cache observability.

---

### 📦 Installation

```sh
npm install smartcachedb
```

or

```sh
yarn add smartcachedb
```

#### Redis (optional, for `redis` backend)

You can run Redis locally or via Docker, for example:

```sh
docker run --name redis -d -p 6379:6379 redis
```

---

### ⚙️ Configuration & Constructor

```ts
import SmartCacheDB, { SmartCacheDBOptions, StorageBackend } from "smartcachedb";

const backends: StorageBackend[] = ["memory", "redis"];

const redisConfig = {
  url: "redis://localhost:6379",
};

const dbConfig = {
  connection: /* your DB connection/driver instance */,
};

const options: SmartCacheDBOptions = {
  enableWebSocket: false,      // default: false
  // wsServer: existingWebSocketServer, // optional: reuse your own WebSocket.Server
};

const cache = new SmartCacheDB(backends, redisConfig, dbConfig, options);
```

**Constructor**

```ts
new SmartCacheDB(
  storageType?: StorageBackend[],   // default: ['memory', 'redis']
  redisConfig?: any,                // passed to node-redis createClient
  dbConfig?: { connection?: any },  // expects a DB client with .query(...)
  options?: SmartCacheDBOptions     // WebSocket options
)
```

---

### 🚀 Usage Examples

#### 1️⃣ Basic set & get

```ts
await cache.set("user:1", { name: "Alice" });
const user = await cache.get("user:1");
console.log(user); // { name: "Alice" }
```

#### 2️⃣ Multi‑key operations

```ts
await cache.setMany({ "user:1": "Alice", "user:2": "Bob" });
const users = await cache.getMany(["user:1", "user:2"]);
// { "user:1": "Alice", "user:2": "Bob" }

await cache.deleteMany(["user:1", "user:2"]);
```

#### 3️⃣ Tag‑based invalidation

```ts
await cache.setWithTag("post:100", { title: "Hello World" }, ["posts"]);
await cache.setWithTag("post:101", { title: "Another Post" }, ["posts"]);
await cache.deleteByTag("posts"); // invalidates both posts
```

#### 4️⃣ Auto‑refreshing cache

```ts
await cache.setWithAutoRefresh("stock:price", 100, 30, async () => {
  // fetch latest value from an API or DB
  return 150;
});
```

#### 5️⃣ JSON & Buffer helpers

```ts
await cache.setJSON("config", { theme: "dark", layout: "grid" });
const config = await cache.getJSON("config");

await cache.setBuffer("file:data", Buffer.from("Hello, world!"));
const file = await cache.getBuffer("file:data");
console.log(file?.toString()); // "Hello, world!"
```

#### 6️⃣ Optional WebSocket‑based invalidation

```ts
import WebSocket from "ws";
import SmartCacheDB, { SmartCacheDBOptions } from "smartcachedb";

const wsServer = new WebSocket.Server({ port: 8080 });

const options: SmartCacheDBOptions = {
  enableWebSocket: true,
  wsServer,
};

const cache = new SmartCacheDB(["memory"], {}, {}, options);

wsServer.on("connection", (socket) => {
  socket.on("message", (data) => {
    console.log("Client message:", data.toString());
  });
});

await cache.set("live:data", { status: "active" });
await cache.delete("live:data"); // broadcasts an invalidation message
```

---

### 📊 Monitoring

SmartCacheDB exposes basic hit/miss statistics:

```ts
const stats = cache.getStats();
// { cacheHits: number, cacheMisses: number }
```

You can wire this into your metrics system (Prometheus, Grafana, etc.) to track cache effectiveness.

---

### 🛠️ API Reference

| Method | Description |
|--------|-------------|
| `set(key, value, options?)` | Store a value with optional `{ ttl?: number }`. If `ttl` is omitted, an adaptive TTL is calculated. |
| `get(key)` | Retrieve a value (or `null` if missing). |
| `delete(key)` | Delete a single key. |
| `clear()` | Clear all entries from the configured backends. |
| `setMany(keysValues, ttl?)` | Batch store multiple key/value pairs with an optional TTL. |
| `getMany(keys)` | Batch retrieve multiple keys as an object map. |
| `deleteMany(keys)` | Batch delete multiple keys. |
| `setWithTag(key, value, tags, ttl?)` | Store a value and associate one or more tags. |
| `deleteByTag(tag)` | Invalidate all keys associated with the given tag. |
| `setWithAutoRefresh(key, value, ttl, refreshCallback)` | Store a value and refresh it shortly before expiration using `refreshCallback`. |
| `setJSON(key, json, ttl?)` | Convenience method for storing JSON objects. |
| `getJSON(key)` | Retrieve and parse JSON objects. |
| `setBuffer(key, buffer, ttl?)` | Store binary data (buffers) as base64. |
| `getBuffer(key)` | Retrieve binary data as a `Buffer` instance. |
| `getStats()` | Get cache hit/miss statistics. |

---

### 📜 License

This project is open‑source and available under the **MIT License**.

---

### 📞 Contact

For questions or feature requests:

- GitHub Issues: open an issue on the repository.
- Email: `fedikhaled01@gmail.com`

---

### ⭐ Support

If you find SmartCacheDB useful, **star the project** and share it with others!

