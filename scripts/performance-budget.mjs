import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { pathToFileURL } from 'node:url';

export async function measureEntrypoints(buildDir) {
  const manifest = JSON.parse(await readFile(path.join(buildDir, 'asset-manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.entrypoints) || !manifest.entrypoints.some(file => file.endsWith('.js'))) throw new Error('Production asset manifest has no JS entrypoints');
  const entrypoints = await Promise.all([...new Set(manifest.entrypoints)].filter(file => /\.(js|css)$/.test(file)).map(async file => {
    const bytes = await readFile(path.join(buildDir, file));
    return { path: file, rawBytes: bytes.length, gzipBytes: gzipSync(bytes, { level: 9 }).length };
  }));
  return {
    gzipLevel: 9, entrypoints,
    initialJsGzipBytes: entrypoints.filter(file => file.path.endsWith('.js')).reduce((sum, file) => sum + file.gzipBytes, 0),
    initialCssGzipBytes: entrypoints.filter(file => file.path.endsWith('.css')).reduce((sum, file) => sum + file.gzipBytes, 0),
    initialJsFiles: entrypoints.filter(file => file.path.endsWith('.js')).length,
  };
}

export function budgetFailures(report, limits) {
  return Object.entries(limits).flatMap(([name, max]) => !Number.isFinite(report[name]) || report[name] > max ? [`${name}: ${report[name]} exceeds ${max}`] : []);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const option = (name, fallback) => { const at = process.argv.indexOf(name); return at < 0 ? fallback : process.argv[at + 1]; };
  const report = await measureEntrypoints(path.resolve(option('--build-dir', 'build')));
  const budget = JSON.parse(await readFile(option('--budget', 'scripts/performance-budget.json'), 'utf8'));
  const failures = budgetFailures(report, budget.limits);
  const output = option('--out', 'output/performance/assets.json');
  await mkdir(path.dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ ...report, baseline: budget.baseline, failures }, null, 2) + '\n');
  console.log(JSON.stringify({ initialJsGzipBytes: report.initialJsGzipBytes, initialCssGzipBytes: report.initialCssGzipBytes, initialJsFiles: report.initialJsFiles, failures, output }, null, 2));
  if (failures.length) process.exitCode = 1;
}
