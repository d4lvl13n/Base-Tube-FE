#!/usr/bin/env node
/**
 * Contract canary — verifies the LIVE backend still matches the response
 * shapes the web app and mobile SDK depend on. Runs nightly from CI
 * (.github/workflows/canary.yml) against beta; a red run means the contract
 * drifted, the same night, instead of a broken app three weeks later.
 *
 * Read-only public endpoints only — no credentials, no writes, no state.
 * Usage: CANARY_BASE_URL=https://beta.base.tube node scripts/contract-canary.mjs
 */

const BASE = (process.env.CANARY_BASE_URL || 'https://beta.base.tube').replace(/\/$/, '');

const failures = [];
let checked = 0;

function expect(cond, label) {
  checked += 1;
  if (!cond) failures.push(label);
}

async function getJson(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { accept: 'application/json', 'user-agent': 'basetube-contract-canary' },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON handled by callers */
  }
  return { status: res.status, body };
}

async function check(name, path, assertions) {
  try {
    const { status, body } = await getJson(path);
    assertions(status, body);
    console.log(`✓ ${name}`);
  } catch (err) {
    failures.push(`${name}: threw ${err.message}`);
    console.error(`✗ ${name}: ${err.message}`);
  }
}

// ── Checks (envelope + the fields the clients actually read) ────────────────

await check('trending', '/api/v1/videos/trending?page=1&limit=3', (status, b) => {
  expect(status === 200, 'trending: status 200');
  expect(b?.success === true, 'trending: success flag');
  expect(Array.isArray(b?.data), 'trending: data is array');
  expect(typeof b?.total === 'number', 'trending: total at top level');
  expect(typeof b?.hasMore === 'boolean', 'trending: hasMore at top level');
  if (b?.data?.length) {
    const v = b.data[0];
    expect(typeof v.id === 'number', 'trending: video.id');
    expect(typeof v.likes_count === 'number', 'trending: video.likes_count');
    expect(!('video_path' in v), 'trending: video_path must be stripped');
    // TODO promote to expect() once the listing-sanitization deploy (BE Sprint 2) is live on beta
    if ('video_urls' in v && v.video_urls != null) {
      console.warn('  ⚠ trending: video_urls still present (pre-Sprint-2 backend deployed)');
    }
  }
});

await check('discovery', '/api/v1/discovery?page=1&limit=3', (status, b) => {
  expect(status === 200, 'discovery: status 200');
  expect(Array.isArray(b?.data), 'discovery: data is array');
  expect(b?.pagination && typeof b.pagination.hasMore === 'boolean', 'discovery: pagination.hasMore');
});

await check('featured', '/api/v1/videos/featured?limit=2', (status, b) => {
  expect(status === 200, 'featured: status 200');
});

await check('channels list', '/api/v1/channels?page=1&limit=3', (status, b) => {
  expect(status === 200, 'channels: status 200');
  expect(Array.isArray(b?.channels), 'channels: channels array');
  expect(typeof b?.hasMore === 'boolean', 'channels: hasMore');
});

await check('search', '/api/v1/search?query=test', (status, b) => {
  expect(status === 200, 'search: status 200');
  expect(b?.success === true && Array.isArray(b?.data), 'search: { success, data[] }');
});

await check('passes discover', '/api/v1/passes/discover?limit=3', (status, b) => {
  expect(status === 200, 'passes: status 200');
  const list = Array.isArray(b?.data) ? b.data : b?.data?.passes;
  expect(Array.isArray(list), 'passes: list array');
  if (Array.isArray(list) && list.length) {
    const p = list[0];
    expect(typeof p.id === 'string', 'passes: pass.id');
    expect(!('reserved_count' in p), 'passes: reserved_count must be stripped');
    expect(!('split_config' in p), 'passes: split_config must be stripped');
    if (p.videos?.length) {
      expect(!('src_url' in p.videos[0]), 'passes: video src_url must be stripped');
    }
  }
});

await check('auth required on profile', '/api/v1/profile', (status) => {
  expect(status === 401, `profile without auth: expected 401, got ${status}`);
});

try {
  // POST /web3auth/nonce — the route the mobile SDK signs in through
  const res = await fetch(`${BASE}/api/v1/web3auth/nonce`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'user-agent': 'basetube-contract-canary' },
    body: JSON.stringify({ walletAddress: '0x0000000000000000000000000000000000000001' }),
  });
  // 200 (nonce issued) or 4xx validation both prove the route exists; 404/5xx = drift.
  expect(res.status !== 404 && res.status < 500, `web3auth nonce: routed (got ${res.status})`);
  console.log('✓ nonce endpoint alive');
} catch (err) {
  failures.push(`web3auth nonce: threw ${err.message}`);
}

// ── Result ──────────────────────────────────────────────────────────────────

console.log(`\n${checked} assertions, ${failures.length} failures`);
if (failures.length) {
  console.error('\nCONTRACT DRIFT DETECTED:');
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('Contract canary green.');
