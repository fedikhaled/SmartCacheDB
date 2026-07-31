const { performance } = require('node:perf_hooks');
const SmartCacheDB = require('../dist').default;

const configuredIterations = Number(process.env.BENCHMARK_ITERATIONS ?? 10_000);
if (!Number.isInteger(configuredIterations) || configuredIterations <= 0) {
  throw new RangeError('BENCHMARK_ITERATIONS must be a positive integer');
}

const operationsPerSecond = (operations, elapsedMilliseconds) =>
  Math.round(operations / (elapsedMilliseconds / 1_000));

async function run() {
  const cache = new SmartCacheDB({
    storage: ['memory'],
    memory: { max: configuredIterations }
  });

  const writeStarted = performance.now();
  for (let index = 0; index < configuredIterations; index += 1) {
    await cache.set(`benchmark:${index}`, { index });
  }
  const writeElapsed = performance.now() - writeStarted;

  const readStarted = performance.now();
  for (let index = 0; index < configuredIterations; index += 1) {
    await cache.get(`benchmark:${index}`);
  }
  const readElapsed = performance.now() - readStarted;

  console.log(`Iterations: ${configuredIterations.toLocaleString()}`);
  console.log(`Writes/sec: ${operationsPerSecond(configuredIterations, writeElapsed).toLocaleString()}`);
  console.log(`Reads/sec: ${operationsPerSecond(configuredIterations, readElapsed).toLocaleString()}`);

  await cache.close();
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
