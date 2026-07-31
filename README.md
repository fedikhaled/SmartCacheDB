# SmartCacheDB

[![CI](https://github.com/fedikhaled/SmartCacheDB/actions/workflows/ci.yml/badge.svg)](https://github.com/fedikhaled/SmartCacheDB/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/smartcachedb.svg)](https://www.npmjs.com/package/smartcachedb)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

SmartCacheDB is a TypeScript caching library for Node.js. It provides a single
API over in-memory LRU, Redis, and SQL-backed storage, with gzip serialization,
TTL support, cache tags, batch operations, and optional invalidation events.

## Requirements

- Node.js 18 or newer
- Redis 6 or newer when using Redis storage
- A compatible SQL connection and cache table when using database storage

## Installation

```sh
npm install smartcachedb
```

## Quick start

Use memory-only storage when no external service is required:

```ts
import SmartCacheDB from 'smartcachedb';

const cache = new SmartCacheDB(['memory']);

await cache.set('user:42', { name: 'Ada' }, { ttl: 300 });
const user = await cache.get<{ name: string }>('user:42');

await cache.close();
```

TTL values are expressed in seconds. Values are JSON-serialized and gzip
compressed before being written to a backend.

## Storage configuration

### Memory

```ts
const cache = new SmartCacheDB(['memory']);
```

Memory storage uses an LRU cache with a maximum of 500 entries. It is local to
the Node.js process and is cleared when the process exits.

### Redis

Redis options follow the [`redis`](https://www.npmjs.com/package/redis) client
configuration format:

```ts
const cache = new SmartCacheDB(['redis'], {
  url: 'redis://localhost:6379'
});

await cache.set('session:123', { active: true }, { ttl: 60 });
await cache.close();
```

Socket configuration is also supported:

```ts
const cache = new SmartCacheDB(['redis'], {
  socket: {
    host: 'localhost',
    port: 6379
  }
});
```

### Multiple backends

```ts
const cache = new SmartCacheDB(
  ['memory', 'redis'],
  { url: process.env.REDIS_URL }
);
```

Writes and deletions are applied to every configured backend. Reads check
backends in this order: memory, Redis, then database. A backend error rejects
the operation; SmartCacheDB does not silently hide infrastructure failures.

### Database

Database mode expects an asynchronous `query` method and a table compatible
with the following MySQL-style schema:

```sql
CREATE TABLE cache (
  `key` VARCHAR(255) PRIMARY KEY,
  `value` LONGTEXT NOT NULL
);
```

```ts
const cache = new SmartCacheDB(
  ['database'],
  {},
  { connection: databaseConnection }
);
```

The current database adapter uses `?` placeholders and MySQL's
`ON DUPLICATE KEY UPDATE` syntax. Database-backed entries do not currently
enforce TTL expiration.

## API

### Basic operations

```ts
await cache.set('key', value, { ttl: 300 });
const value = await cache.get<MyType>('key');
await cache.delete('key');
await cache.clear();
```

`clear()` clears every configured backend. Treat it as an administrative
operation, especially with Redis, where it calls `FLUSHDB`.

### Batch operations

```ts
await cache.setMany({ first: 1, second: 2 }, 300);
const values = await cache.getMany<number>(['first', 'second']);
await cache.deleteMany(['first', 'second']);
```

Batch operations execute their per-key work concurrently.

### Tags

```ts
await cache.setWithTag('post:1', post, ['posts', 'featured'], 300);
await cache.deleteByTag('posts');
```

Tag metadata is process-local. It is not shared between application instances
and does not survive restarts.

### Refresh before expiration

```ts
await cache.setWithAutoRefresh('price', initialPrice, 60, async () => {
  return fetchCurrentPrice();
});
```

The callback runs once at 90% of the TTL and replaces the stored value. Calling
`close()` cancels refresh callbacks that have not started.

### JSON and Buffer helpers

```ts
await cache.setJSON('settings', { theme: 'dark' }, 300);
const settings = await cache.getJSON<{ theme: string }>('settings');

await cache.setBuffer('document', Buffer.from('content'), 300);
const document = await cache.getBuffer('document');
```

### Statistics

```ts
const { cacheHits, cacheMisses } = cache.stats();
```

Statistics are process-local and cover calls made through that cache instance.

### Optional WebSocket invalidation events

```ts
const cache = new SmartCacheDB(['memory'], {
  enableWebSocket: true,
  webSocketPort: 8080
});
```

When enabled, deleting a key broadcasts an `{ action: "invalidate", key }`
message to clients connected to that instance. The package does not
automatically connect application instances or consume invalidation events.

## Lifecycle

Always close cache instances during application shutdown:

```ts
process.once('SIGTERM', async () => {
  await cache.close();
});
```

`close()` cancels pending refresh timers, closes the Redis connection, and
stops the optional WebSocket server.

## Development

```sh
npm ci
npm run build
npm run typecheck
npm test -- --runInBand
```

Redis integration tests require a running Redis instance:

```sh
REDIS_URL=redis://localhost:6379 npm run test:integration
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for the complete workflow.

## License

[MIT](LICENSE) © Fedi Khaled
