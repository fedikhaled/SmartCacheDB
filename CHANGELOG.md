# Changelog

All notable changes to SmartCacheDB are documented in this file. The project
follows [Semantic Versioning](https://semver.org/).

## Unreleased

### Breaking changes

- The zero-argument constructor now defaults to memory-only storage. Redis must
  be selected explicitly. This avoids unexpected network connections for new
  cache instances.
- TTL handling in memory storage now consistently uses seconds, matching Redis
  storage and the public API. Code that relied on the previous millisecond
  behavior must update its TTL values.

### Added

- Strict exported TypeScript types for storage, Redis, database, TTL, and cache
  statistics.
- A typed options-object constructor with configurable default TTL and in-memory
  LRU capacity. The positional constructor remains supported.
- Explicit `close()` lifecycle management and process-local hit/miss statistics.
- Optional error handling for auto-refresh callbacks.
- Isolated Redis integration tests, multi-version CI, coverage thresholds, and
  reproducible dependency installation.

### Changed

- Redis connects lazily on the first Redis operation and retries after an
  initial connection failure.
- Backend writes, deletions, and clears are awaited before operations resolve.
- Batch operations run concurrently.
- WebSocket invalidation is opt-in and no longer creates an implicit server.
- Database results support both direct row arrays and MySQL tuple responses.

### Fixed

- Redis tests no longer pass accidentally through the memory backend.
- Cache tag metadata is cleaned after individual deletes and clears.
- Pending auto-refresh timers are canceled during shutdown.
- Closed cache instances can no longer reconnect or accept new operations, and
  concurrent `close()` calls share the same completion promise.
- Non-JSON-serializable values fail with a clear `TypeError`.
- Stale build artifacts are removed before packaging.
