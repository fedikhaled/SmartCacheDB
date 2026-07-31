# Contributing to SmartCacheDB

Thank you for helping improve SmartCacheDB.

## Development workflow

1. Create a focused branch from an up-to-date `main` branch.
2. Install the locked dependencies with `npm ci`.
3. Make one cohesive change and add or update tests for its behavior.
4. Run the complete verification suite:

   ```sh
   npm run build
   npm run typecheck
   npm test -- --runInBand
   REDIS_URL=redis://localhost:6379 npm run test:integration
   npm pack --dry-run
   ```

5. Open a pull request that explains the problem, the chosen solution, and any
   compatibility considerations.

The Redis integration suite is skipped when `REDIS_URL` is not set. Run it
before submitting changes to Redis behavior; CI always runs it against Redis 7.

For changes to the memory hot path, run `npm run benchmark:memory` and compare
results on the same machine and Node.js version. Benchmarks are directional and
must not be presented as cross-environment guarantees.

## Branch and commit conventions

Use short branch names that describe the work:

- `feat/cache-warming`
- `fix/redis-reconnect`
- `docs/configuration-guide`
- `chore/update-tooling`

Write commits in the imperative mood using Conventional Commits where useful:

- `feat: add stale-while-revalidate support`
- `fix: await Redis writes before resolving`
- `docs: clarify multi-backend behavior`
- `test: isolate Redis integration coverage`

Keep formatting-only changes separate from behavior changes. Avoid combining
unrelated fixes in a single pull request.

## Compatibility

SmartCacheDB is a public npm package. Changes to exported types, constructor
arguments, method signatures, defaults, serialized values, or error behavior
may affect users. Call out these changes explicitly and follow semantic
versioning when preparing a release.

Do not commit credentials, local environment files, generated `dist` output,
or unpublished package archives.
