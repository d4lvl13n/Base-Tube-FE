import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { measureEntrypoints, budgetFailures } from './performance-budget.mjs';

test('measures actual entrypoints, excluding lazy chunks, and rejects over-budget output', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'basetube-budget-'));
  try {
    const entry = Buffer.from('first page only');
    await writeFile(path.join(directory, 'asset-manifest.json'), JSON.stringify({ entrypoints: ['main.js'], files: { 'main.js': 'main.js', 'lazy.js': 'lazy.js' } }));
    await writeFile(path.join(directory, 'main.js'), entry);
    await writeFile(path.join(directory, 'lazy.js'), Buffer.alloc(100000));
    const report = await measureEntrypoints(directory);
    assert.equal(report.initialJsFiles, 1);
    assert.equal(report.initialJsGzipBytes, gzipSync(entry, { level: 9 }).length);
    assert.equal(budgetFailures(report, { initialJsGzipBytes: 1 }).length, 1);
    assert.deepEqual(budgetFailures(report, { initialJsGzipBytes: 100, initialJsFiles: 1 }), []);
    assert.equal(budgetFailures({}, { initialJsGzipBytes: 100 }).length, 1);
  } finally { await rm(directory, { recursive: true }); }
});
