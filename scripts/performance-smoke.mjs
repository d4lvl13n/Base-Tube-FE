// Production-build lab probe. Every API response is a fixture; external services are blocked.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { chromium } from 'playwright';

const option = (name, fallback) => { const at = process.argv.indexOf(name); return at < 0 ? fallback : process.argv[at + 1]; };
const buildDir = path.resolve(option('--build-dir', 'build'));
const outputDir = path.resolve(option('--output-dir', 'output/performance'));
const secondaryDelay = 30000;
const mime = { '.js': 'application/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    let file = path.resolve(buildDir, '.' + pathname);
    if (!file.startsWith(buildDir + path.sep)) file = path.join(buildDir, 'index.html');
    let content;
    try { content = await readFile(file); } catch { file = path.join(buildDir, 'index.html'); content = await readFile(file); }
    res.writeHead(200, { 'Content-Type': mime[path.extname(file)] || 'application/octet-stream', 'Content-Encoding': 'gzip', 'Cache-Control': 'no-store' });
    res.end(gzipSync(content));
  } catch { res.writeHead(500); res.end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
await mkdir(outputDir, { recursive: true });
let browser;
const budget = JSON.parse(await readFile('scripts/performance-budget.json', 'utf8'));
const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#fa7517"/></svg>';
const channel = { id: 71, name: 'Performance fixture channel', handle: 'performance-fixture', subscribers_count: 10, videos_count: 1, description: 'Deterministic public fixture', ownerProfileImage: origin + '/performance-fixture.svg', channel_image_url: origin + '/performance-fixture.svg', isOwner: false, isSubscribed: false };
const video = { id: 901, title: 'Performance fixture video', channel_id: 71, channel, description: '', duration: 60, views_count: 100, thumbnail_url: origin + '/performance-fixture.svg', is_public: true, status: 'processed', createdAt: '2026-01-01T00:00:00.000Z' };
const pagination = { total: 1, page: 1, limit: 12, totalPages: 1 };
const results = [];

// Playwright's layout visibility includes opacity:0. Wait for the actual title
// to finish fading in, so a skeleton/transparent animation cannot count as content.
async function waitForReadable(locator, timeout) {
  await locator.waitFor({ state: 'visible', timeout });
  const element = await locator.elementHandle();
  try {
    await locator.page().waitForFunction(node => {
      if (!node?.isConnected) return false;
      let opacity = 1;
      for (let current = node; current; current = current.parentElement) {
        opacity *= Number(getComputedStyle(current).opacity);
      }
      return opacity >= 0.95;
    }, element, { timeout });
  } finally { await element?.dispose(); }
}

try {
  browser = await chromium.launch({ headless: true });
  for (const scenario of [{ name: 'home', route: '/', title: video.title }, { name: 'channel', route: '/channel/performance-fixture', title: channel.name }]) {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
    await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1000 * 1000 / 8, uploadThroughput: 750 * 1000 / 8 });
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const requests = [];
    const errors = [];
    const javascript = new Set();
    let completed = false;
    let release;
    const waitForPrimary = new Promise(resolve => { release = resolve; });
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.request().resourceType() === 'script') javascript.add(response.url().replace(origin, '')); });
    await context.route('**/*', async route => {
      const request = route.request();
      const url = new URL(request.url());
      const headers = { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Credentials': 'true', 'Access-Control-Allow-Headers': request.headers()['access-control-request-headers'] || 'content-type, authorization', 'Access-Control-Allow-Methods': 'GET, OPTIONS' };
      const json = body => route.fulfill({ status: 200, contentType: 'application/json', headers, body: JSON.stringify(body) });
      if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers });
      if (url.pathname.startsWith('/api/v1/')) {
        requests.push({ path: url.pathname, method: request.method() });
        if (request.method() !== 'GET') {
          errors.push(`Unexpected mutation: ${url.pathname}`);
          return route.fulfill({ status: 405, headers });
        }
        if (url.pathname === '/api/v1/config/view-config') return json({ success: true, data: { thresholds: { percentage: 30, seconds: 30 }, limits: { maxViewsPerDay: 10, maxOwnerViews: 5, maxConcurrentViews: 3 }, updateInterval: 30000 } });
        if (url.pathname === '/api/v1/tool/welcome-offer') return json({ success: true, data: { credits: 0, available: false, resetsAt: '2026-11-07T00:00:00.000Z' } });
        if (url.pathname === '/api/v1/videos/featured') return json({ success: true, data: { videos: [video] } });
        if (url.pathname === '/api/v1/channels/performance-fixture/overview') return json({ success: true, data: { channel, videos: [video], pagination } });
        if (/\/videos\/(recommended|trending)$|\/channels\/popular$/.test(url.pathname)) {
          await waitForPrimary;
          return json({ success: true, data: [], pagination, videos: [], total: 0, hasMore: false });
        }
        if (url.pathname === '/api/v1/passes/discover') return json({ success: true, data: [], pagination: { ...pagination, total: 0 } });
        errors.push('Unexpected API read before public readiness: ' + url.pathname);
        return route.fulfill({ status: 503, contentType: 'application/json', headers, body: JSON.stringify({ success: false, message: 'No fixture for ' + url.pathname }) });
      }
      if (url.pathname === '/performance-fixture.svg') return route.fulfill({ contentType: 'image/svg+xml', body: svg });
      if (url.origin === origin) return route.continue();
      // Clerk remains pending until useful public content is visible. No live identity calls.
      if (/clerk/i.test(url.hostname + url.pathname)) await waitForPrimary;
      return route.abort();
    });
    const timer = setTimeout(() => release(), secondaryDelay + 5000);
    try {
      await page.goto(origin + scenario.route, { waitUntil: 'domcontentloaded', timeout: secondaryDelay });
      await waitForReadable(page.getByRole('heading', { name: scenario.title, exact: true }).first(), secondaryDelay);
      const { timeToContentMs, scriptResources } = await page.evaluate(() => ({
        timeToContentMs: performance.now(),
        scriptResources: performance.getEntriesByType('resource').filter(entry => entry.initiatorType === 'script' && entry.responseEnd > 0).map(entry => ({ path: new URL(entry.name).pathname, encodedBodyBytes: entry.encodedBodySize })),
      }));
      const jsBodyBytesBeforeContent = scriptResources.reduce((sum, entry) => sum + entry.encodedBodyBytes, 0);
      assert.ok(jsBodyBytesBeforeContent > 0, 'Browser must report the downloaded production scripts');
      assert.ok(jsBodyBytesBeforeContent <= budget.browserLimits.maxJsBodyBytesBeforeContent, `Public startup downloaded ${jsBodyBytesBeforeContent} script bytes`);
      assert.ok(timeToContentMs < secondaryDelay, 'Primary content waited for the blocked secondary requests');
      if (scenario.name === 'channel') {
        await waitForReadable(page.getByText(video.title, { exact: true }).first(), 5000);
        assert.equal(requests.filter(request => request.path.endsWith('/overview')).length, 1);
        assert.equal(requests.filter(request => /\/channels\/(?:handle\/|71\/videos)/.test(request.path)).length, 0);
      }
      assert.deepEqual(errors, [], 'Uncaught browser errors');
      await page.screenshot({ path: path.join(outputDir, `${scenario.name}.png`) });
      const timings = await page.evaluate(() => performance.getEntriesByType('measure').filter(entry => entry.name.startsWith('basetube:')).map(entry => ({ name: entry.name, duration: entry.duration })));
      assert.equal(timings.filter(entry => entry.name === `basetube:${scenario.name}_content_ready`).length, 1, 'One useful-content readiness mark per navigation');
      results.push({ scenario: scenario.name, timeToContentMs: Math.round(timeToContentMs), javascriptFilesBeforeContent: [...javascript], jsBodyBytesBeforeContent, scriptResources, requests, timings });
      completed = true;
    } finally {
      clearTimeout(timer);
      release();
      if (!completed) {
        await page.screenshot({ path: path.join(outputDir, `${scenario.name}-failed.png`) }).catch(() => {});
        await writeFile(path.join(outputDir, `${scenario.name}-failed.json`), JSON.stringify({ requests, errors, html: await page.content().catch(() => '') }, null, 2));
      }
      await context.unrouteAll({ behavior: 'wait' });
      await context.close();
    }
  }
  const report = { kind: 'fixture lab; no production latency claim', browser: browser.version(), network: { latencyMs: 150, downloadMbps: 1.6, cpuSlowdown: 4, cache: 'empty' }, scenarios: results };
  await writeFile(path.join(outputDir, 'browser.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser?.close();
  await new Promise(resolve => server.close(resolve));
}
