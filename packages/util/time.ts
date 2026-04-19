export function createDebugTime() {
  const start = performance.now();
  return () => ((performance.now() - start) / 1000).toFixed(2);
}
