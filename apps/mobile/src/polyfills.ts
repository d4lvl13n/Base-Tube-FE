/**
 * Pure, import-free native shims. MUST stay free of `import` statements — ES
 * imports hoist above any statement, so an import here would run before the
 * shim. Keeping it import-only-by-the-entry guarantees these globals exist
 * before Clerk (whose bundled code references web-only globals) evaluates.
 */
const g = globalThis as unknown as { SharedArrayBuffer?: unknown };
if (typeof g.SharedArrayBuffer === 'undefined') {
  // Hermes has no SharedArrayBuffer; some web-oriented deps reference it at
  // eval time. Shim to ArrayBuffer (we never use shared memory).
  g.SharedArrayBuffer = ArrayBuffer;
}

export {};
