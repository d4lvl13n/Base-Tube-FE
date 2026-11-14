import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import { KEY } from './fake-api.mjs';
import { createCliHarness } from './helpers.mjs';

function assertNoKey(result) {
  assert.ok(!result.stdout.includes(KEY), 'stdout must not contain the raw key');
  assert.ok(!result.stderr.includes(KEY), 'stderr must not contain the raw key');
  return JSON.parse(result.stdout);
}

async function storedKey(configDir, key) {
  await mkdir(configDir, { recursive: true });
  await writeFile(join(configDir, 'config.json'), JSON.stringify({ apiKey: key }));
}

for (const source of ['environment', 'saved', 'stdin']) {
  test(`rejects a multiline ${source} key before making a request, without exposing it`, async (t) => {
    const { api, configDir, run } = await createCliHarness(t);
    const key = `${KEY}\nextra`;
    if (source === 'saved') await storedKey(configDir, key);
    const result = source === 'stdin'
      ? await run(['login', '--key-stdin', '--json'], { input: key, extraEnv: { BASETUBE_API_KEY: undefined } })
      : await run(['whoami', '--json'], { extraEnv: { BASETUBE_API_KEY: source === 'environment' ? key : undefined } });
    assert.equal(result.code, 2);
    assert.equal(assertNoKey(result).error.code, 'USAGE');
    assert.equal(api.requests.length, 0, 'invalid credentials must never reach fetch');
  });
}

test('rejects non-ASCII login input without leaking the key or contacting the API', async (t) => {
  const { api, run } = await createCliHarness(t);
  const result = await run(['login', '--key-stdin', '--json'], {
    input: `${KEY}\u0100`, extraEnv: { BASETUBE_API_KEY: undefined },
  });
  assert.equal(result.code, 2);
  assert.equal(assertNoKey(result).error.code, 'USAGE');
  assert.equal(api.requests.length, 0);
});

test('rejects a NUL in a stored key without leaking it or contacting the API', async (t) => {
  const { api, configDir, run } = await createCliHarness(t);
  await storedKey(configDir, `${KEY}\0extra`);
  const result = await run(['whoami', '--json'], { extraEnv: { BASETUBE_API_KEY: undefined } });
  assert.equal(result.code, 2);
  assert.equal(assertNoKey(result).error.code, 'USAGE');
  assert.equal(api.requests.length, 0);
});

for (const source of ['environment', 'saved', 'stdin']) {
  test(`redacts a valid ${source} key echoed in API errors, hints and nested details`, async (t) => {
    const { api, configDir, run } = await createCliHarness(t);
    if (source === 'saved') await storedKey(configDir, KEY);
    api.handle = async (req, res) => {
      req.resume();
      res.writeHead(403, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: {
        code: 'SCOPE_MISSING', message: `Rejected Bearer ${KEY}`,
        details: { required: KEY, issues: [{ path: KEY, message: `Invalid ${KEY}` }],
          nested: [{ [KEY]: `Bearer ${KEY}` }], count: 1 },
      } }));
    };
    const result = source === 'stdin'
      ? await run(['login', '--key-stdin', '--json'], { input: KEY, extraEnv: { BASETUBE_API_KEY: undefined } })
      : await run(['whoami', '--json'], { extraEnv: { BASETUBE_API_KEY: source === 'environment' ? KEY : undefined } });
    assert.equal(result.code, 4);
    const { error } = assertNoKey(result);
    assert.equal(error.code, 'SCOPE_MISSING');
    assert.equal(error.status, 403);
    assert.equal(error.message, 'Rejected Bearer [REDACTED]');
    assert.match(error.hint, /\[REDACTED\]/);
    assert.deepEqual(error.details, {
      required: '[REDACTED]', issues: [{ path: '[REDACTED]', message: 'Invalid [REDACTED]' }],
      nested: [{ '[REDACTED]': 'Bearer [REDACTED]' }], count: 1,
    });
  });
}

test('redacts secrets echoed in retry progress and success output while preserving the public key prefix', async (t) => {
  const { api, run } = await createCliHarness(t);
  api.faults.set('GET /v1/me', { status: 503, code: `ECHO_${KEY}`, retryAfter: 1, times: 1 });
  api.keys.get(KEY).name = `Key ${KEY}`;
  const result = await run(['whoami', '--json']);
  assert.equal(result.code, 0);
  const { data } = assertNoKey(result);
  assert.match(result.stderr, /ECHO_\[REDACTED\]/);
  assert.equal(data.key.prefix, KEY.slice(0, 12));
  assert.equal(data.key.name, 'Key [REDACTED]');
});

test('continues to accept legacy keys and surrounding clipboard whitespace', async (t) => {
  const { api, run } = await createCliHarness(t);
  const legacyKey = 'legacy-secret-0123456789abcdef';
  api.keys.set(legacyKey, { ...api.keys.get(KEY) });
  const result = await run(['whoami', '--json'], { extraEnv: { BASETUBE_API_KEY: ` ${legacyKey}\n` } });
  assert.equal(result.code, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).data.key.prefix, legacyKey.slice(0, 12));
  assert.equal(api.requests.at(-1).authorization, `Bearer ${legacyKey}`);
});
