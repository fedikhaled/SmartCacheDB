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


### Contact

For questions or feature requests:

- GitHub Issues: open an issue on the repository.
- Email: `fedikhaled01@gmail.com`

---

### Support

If you find SmartCacheDB useful, **star the project** and share it with others!

