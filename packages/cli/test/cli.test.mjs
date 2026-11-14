/**
 * Runs the real CLI (a child process) against the in-process fake API and storage.
 */
import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { FakeBaseTube, KEY } from './fake-api.mjs';

const BIN = fileURLToPath(new URL('../bin/basetube.mjs', import.meta.url));
const VIDEO = Buffer.from('0123456789abcdefghij'); // 20 bytes = 3 parts of 8, 8 and 4 bytes

let api;
let home;
let videoDir;
let video;

function env(extra = {}) {
  const clean = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('BASETUBE_') && name !== 'XDG_CONFIG_HOME'));
  return { ...clean, HOME: home, BASETUBE_CONFIG_DIR: join(home, 'config'), BASETUBE_API_URL: api.base, ...extra };
}

/** Runs the CLI; stdin is a pipe (not a terminal), as for an AI agent. */
function run(args, { input, extraEnv, onSpawn } = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [BIN, ...args], { env: env(extraEnv), stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.stdin.end(input ?? '');
    onSpawn?.(child);
    child.on('close', (code, signal) => resolve({ code, signal, stdout, stderr }));
  });
}

const json = (result) => JSON.parse(result.stdout);
const checkpoints = async () => (await readdir(join(home, 'config', 'uploads')).catch(() => [])).filter((n) => n.endsWith('.json'));
const signIn = () => run(['login', '--key-stdin'], { input: KEY });

async function waitFor(condition, ms = 5000) {
  const deadline = Date.now() + ms;
  while (!condition()) {
    if (Date.now() > deadline) throw new Error('condition not met in time');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

beforeEach(async () => {
  api = new FakeBaseTube({ partSize: 8 });
  await api.start();
  home = await mkdtemp(join(tmpdir(), 'basetube-cli-home-'));
  videoDir = await mkdtemp(join(tmpdir(), 'basetube-cli-video-'));
  video = join(videoDir, 'episode-12.mp4');
  await writeFile(video, VIDEO);
});

afterEach(async () => {
  await api.stop();
  await rm(home, { recursive: true, force: true });
  await rm(videoDir, { recursive: true, force: true });
});

describe('upload', () => {
  it('sends a 3-part video, completes it and prints one JSON document', async () => {
    await signIn();
    const result = await run(['upload', video, '--title', 'Episode 12', '--tags', 'travel, vlog', '--json']);
    assert.equal(result.code, 0, result.stderr);

    const body = json(result); // throws if stdout holds anything but one JSON document
    assert.equal(body.ok, true);
    assert.equal(body.data.video.status, 'ready');
    assert.equal(body.data.video.visibility, 'private');
    assert.match(body.data.video.watchUrl, /^https:\/\/beta\.base\.tube\/video\/\d+$/);
    assert.equal(typeof body.data.uploadId, 'string');

    const upload = api.uploads.get(body.data.uploadId);
    assert.deepEqual(api.assembled(upload.id), VIDEO);
    assert.equal(upload.partCount, 3);
    assert.deepEqual(upload.tags, ['travel', 'vlog']);
    const created = api.requests.find((r) => r.method === 'POST' && r.path === '/v1/uploads');
    assert.equal(created.body.visibility, undefined, 'private unless --public');
    assert.match(created.idempotencyKey, /^[0-9a-f]{64}$/);

    // Progress went to stderr, one line per part.
    for (const n of [1, 2, 3]) assert.match(result.stderr, new RegExp(`part ${n}/3 sent`));
    // The key never travels to storage, never appears in a URL.
    const storage = api.requests.filter((r) => r.path.startsWith('/storage/'));
    assert.equal(storage.length, 3);
    assert.ok(storage.every((r) => r.authorization === undefined));
    assert.ok(api.requests.every((r) => !r.path.includes(KEY) && !r.query.includes(KEY)));
  });

  it('prints one human line with the watch address and leaves nothing beside the video', async () => {
    await signIn();
    const result = await run(['upload', video, '--title', 'Episode 12']);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'Ready (private): https://beta.base.tube/video/100');
    assert.deepEqual(await readdir(videoDir), ['episode-12.mp4']);
    assert.deepEqual(await checkpoints(), [], 'the checkpoint is deleted once the video is ready');
  });

  it('resumes after the process is killed mid-part, sending only the missing part', async () => {
    await signIn();
    api.hangParts.add(2);
    const killed = await run(['upload', video, '--title', 'Episode 12'], {
      onSpawn: (child) => waitFor(() => api.pendingParts.has(2) && [...api.uploads.values()][0]?.parts.size === 2)
        .then(() => child.kill('SIGKILL')),
    });
    assert.equal(killed.signal, 'SIGKILL');

    // The checkpoint is in the config folder, private, and holds no key or address.
    const saved = await checkpoints();
    assert.equal(saved.length, 1);
    const path = join(home, 'config', 'uploads', saved[0]);
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    assert.equal((await stat(join(home, 'config', 'uploads'))).mode & 0o777, 0o700);
    const contents = await readFile(path, 'utf8');
    assert.ok(!contents.includes(KEY));
    assert.doesNotMatch(contents, /https?:|Signature/);
    assert.deepEqual(await readdir(videoDir), ['episode-12.mp4']);

    api.hangParts.clear();
    const putsBefore = api.storagePuts(1).length + api.storagePuts(3).length;
    const resumed = await run(['upload', video, '--title', 'Episode 12', '--json']);
    assert.equal(resumed.code, 0, resumed.stderr);
    assert.equal(api.count('POST', '/v1/uploads'), 1, 'no second upload is created');
    assert.equal(api.storagePuts(1).length + api.storagePuts(3).length, putsBefore, 'parts 1 and 3 are not sent again');
    assert.equal(api.storagePuts(2).length, 2);
    assert.match(resumed.stderr, /Resuming upload/);
    assert.deepEqual(api.assembled(json(resumed).data.uploadId), VIDEO);
    assert.deepEqual(await checkpoints(), []);
  });

  it('asks for a fresh address once when storage refuses an expired one', async () => {
    await signIn();
    api.expireFirstAddress.add(2);
    const result = await run(['upload', video, '--title', 'Episode 12']);
    assert.equal(result.code, 0, result.stderr);
    const renewals = api.requests.filter((r) => r.method === 'POST' && r.path.endsWith('/parts')).map((r) => r.body.partNumbers);
    assert.deepEqual(renewals, [[1, 2, 3], [2]]);
    assert.equal(api.storagePuts(2).length, 2);
    assert.match(result.stderr, /part 2\/3: storage answered HTTP 403, will retry with a new address/);
  });

  it('waits as long as Retry-After says, then sends the same request again', async () => {
    await signIn();
    api.faults.set('POST /v1/uploads', { status: 429, code: 'UPLOAD_ADMISSION_BUSY', retryAfter: 1, times: 1 });
    const result = await run(['upload', video, '--title', 'Episode 12', '--json']);
    assert.equal(result.code, 0, result.stderr);
    const posts = api.requests.filter((r) => r.method === 'POST' && r.path === '/v1/uploads');
    assert.equal(posts.length, 2);
    assert.ok(posts[1].at - posts[0].at >= 950, `waited ${posts[1].at - posts[0].at} ms`);
    assert.match(result.stderr, /UPLOAD_ADMISSION_BUSY: waiting 1s/);
  });

  it('adds the thumbnail and publishes only once the video is ready', async () => {
    await signIn();
    await writeFile(join(videoDir, 'cover.jpg'), 'fake jpeg bytes');
    const result = await run(['upload', video, '--title', 'Episode 12', '--thumbnail', join(videoDir, 'cover.jpg'), '--public']);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(result.stdout.trim(), 'Ready (public): https://beta.base.tube/video/100');
    const order = api.requests.filter((r) => r.path.startsWith('/v1/videos/100')).map((r) => r.method);
    assert.deepEqual(order, ['GET', 'PUT', 'PATCH']);
  });

  it('with --no-wait returns once the file is received and keeps no checkpoint', async () => {
    await signIn();
    api.videoStatusAfterCompletion = 'processing';
    const result = await run(['upload', video, '--title', 'Episode 12', '--no-wait', '--json']);
    assert.equal(result.code, 0, result.stderr);
    assert.equal(json(result).data.video.status, 'processing');
    assert.deepEqual(await checkpoints(), []);
  });

  it('refuses to send the same file twice unless --restart is given', async () => {
    await signIn();
    assert.equal((await run(['upload', video])).code, 0);
    const again = await run(['upload', video, '--json']);
    assert.equal(again.code, 1);
    assert.equal(json(again).error.code, 'UPLOAD_ALREADY_COMPLETED');
    assert.match(json(again).error.hint, /--restart/);
    const restarted = await run(['upload', video, '--restart']);
    assert.equal(restarted.code, 0, restarted.stderr);
    assert.equal(api.uploads.size, 2);
  });

  it('needs --channel when the key covers several channels, and accepts a handle', async () => {
    await signIn();
    api.channels.push({ id: 8, name: 'Second', handle: 'second' });
    const missing = await run(['upload', video]);
    assert.equal(missing.code, 2);
    assert.match(missing.stderr, /--channel/);
    assert.match(missing.stderr, /8 \(@second\) Second/);
    const result = await run(['upload', video, '--channel', '@second']);
    assert.equal(result.code, 0, result.stderr);
    assert.equal([...api.uploads.values()][0].channelId, 8);
  });
});

describe('sign-in and the key', () => {
  it('refuses to prompt for the key when stdin is not a terminal', async () => {
    const result = await run(['login']);
    assert.equal(result.code, 2);
    assert.match(result.stderr, /No terminal/);
    assert.match(result.stderr, /--key-stdin/);
    await assert.rejects(stat(join(home, 'config', 'config.json')));
  });

  it('saves a verified key readable only by the owner, and never prints it', async () => {
    const login = await run(['login', '--key-stdin', '--json'], { input: `${KEY}\n` });
    assert.equal(login.code, 0, login.stderr);
    const path = join(home, 'config', 'config.json');
    assert.equal((await stat(path)).mode & 0o777, 0o600);
    assert.equal(JSON.parse(await readFile(path, 'utf8')).apiKey, KEY);
    assert.equal(json(login).data.key.name, 'Test key');

    const who = await run(['whoami']);
    assert.equal(who.code, 0);
    assert.match(who.stdout, /20 of 20 left today/);
    assert.match(who.stdout, /videos:upload, videos:read, videos:write/);

    const upload = await run(['upload', video]);
    const bad = await run(['whoami'], { extraEnv: { BASETUBE_API_KEY: `${KEY}x` } });
    for (const result of [login, who, upload, bad]) {
      assert.ok(!result.stdout.includes(KEY) && !result.stderr.includes(KEY), 'the key is never printed');
    }

    const logout = await run(['logout']);
    assert.equal(logout.code, 0);
    assert.equal(JSON.parse(await readFile(path, 'utf8')).apiKey, undefined, 'the key is gone (the API address stays)');
    assert.equal((await run(['whoami'])).code, 3);
  });

  it('does not save a key the API refuses', async () => {
    const result = await run(['login', '--key-stdin'], { input: 'bt_live_wrong' });
    assert.equal(result.code, 3);
    assert.match(result.stderr, /INVALID_API_KEY/);
    await assert.rejects(stat(join(home, 'config', 'config.json')));
  });

  it('uses BASETUBE_API_KEY instead of the saved key', async () => {
    await run(['login', '--key-stdin'], { input: 'bt_live_wrong' }); // not saved
    const result = await run(['whoami', '--json'], { extraEnv: { BASETUBE_API_KEY: KEY } });
    assert.equal(result.code, 0, result.stderr);
    assert.equal(json(result).data.keySource, 'BASETUBE_API_KEY');
  });
});

describe('exit codes and errors', () => {
  it('3 when not signed in', async () => {
    const result = await run(['channels', '--json']);
    assert.equal(result.code, 3);
    assert.deepEqual(Object.keys(json(result)), ['ok', 'error']);
    assert.equal(json(result).error.code, 'NOT_SIGNED_IN');
    assert.match(json(result).error.hint, /Creator Hub → API/);
  });

  it('3 when the key is revoked', async () => {
    await signIn();
    api.keys.get(KEY).revoked = true;
    const result = await run(['whoami']);
    assert.equal(result.code, 3);
    assert.match(result.stderr, /KEY_REVOKED/);
  });

  it('4 with the missing permission named when the key lacks it', async () => {
    await signIn();
    await run(['upload', video]);
    const result = await run(['videos', 'delete', '100', '--yes', '--json']);
    assert.equal(result.code, 4);
    const { error } = json(result);
    assert.equal(error.code, 'SCOPE_MISSING');
    assert.equal(error.status, 403);
    assert.equal(error.hint, 'Create a key with the \'videos:delete\' permission on base.tube → Creator Hub → API, then run "basetube login".');
  });

  it('5 when the daily upload limit is reached', async () => {
    await signIn();
    api.dailyRemaining = 0;
    const result = await run(['upload', video, '--json']);
    assert.equal(result.code, 5);
    assert.equal(json(result).error.code, 'UPLOAD_DAILY_QUOTA_EXCEEDED');
    assert.match(json(result).error.hint, /midnight UTC/);
  });

  it('2 for a wrong command, option or value', async () => {
    assert.equal((await run(['nope'])).code, 2);
    assert.equal((await run(['upload', video, '--bogus'])).code, 2);
    assert.equal((await run(['videos', 'get', 'abc'])).code, 2);
    assert.equal((await run(['upload', join(videoDir, 'notes.txt')])).code, 2);
    assert.equal((await run(['upload', video, '--public', '--no-wait'])).code, 2);
    assert.equal((await run(['whoami', '--api', 'http://example.com/v1'])).code, 2);
  });

  it('1 for other failures, such as processing that failed', async () => {
    await signIn();
    api.videoStatusAfterCompletion = 'failed';
    const result = await run(['upload', video]);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /Processing failed/);
  });

  it('every command has --help with an example', async () => {
    for (const args of [['login'], ['logout'], ['whoami'], ['channels'], ['upload'], ['videos'], ['videos', 'list'],
      ['videos', 'get'], ['videos', 'update'], ['videos', 'thumbnail'], ['videos', 'delete']]) {
      const result = await run([...args, '--help']);
      assert.equal(result.code, 0, args.join(' '));
      assert.match(result.stdout, /basetube /, args.join(' '));
      assert.match(result.stdout, /Example/, args.join(' '));
    }
  });
});

describe('videos', () => {
  beforeEach(async () => {
    api.keys.get(KEY).scopes.push('videos:delete');
    await signIn();
    await run(['upload', video, '--title', 'Episode 12']);
  });

  it('lists, gets and updates a video', async () => {
    const list = await run(['videos', 'list', '--json']);
    assert.equal(json(list).data.videos[0].id, 100);
    const get = await run(['videos', 'get', '100']);
    assert.match(get.stdout, /Status\s+ready/);
    const update = await run(['videos', 'update', '100', '--title', 'New title', '--tags', 'a,b', '--public', '--json']);
    assert.equal(update.code, 0, update.stderr);
    assert.deepEqual(api.requests.at(-1).body, { title: 'New title', tags: ['a', 'b'], visibility: 'public' });
    assert.equal(json(update).data.visibility, 'public');
  });

  it('replaces a thumbnail', async () => {
    await writeFile(join(videoDir, 'cover.png'), 'png bytes');
    const result = await run(['videos', 'thumbnail', '100', join(videoDir, 'cover.png')]);
    assert.equal(result.code, 0, result.stderr);
    const put = api.requests.at(-1);
    assert.equal(put.method, 'PUT');
    assert.equal(put.body.toString(), 'png bytes');
  });

  it('never deletes without confirmation when there is no terminal', async () => {
    const refused = await run(['videos', 'delete', '100']);
    assert.equal(refused.code, 2);
    assert.match(refused.stderr, /--yes/);
    assert.equal(api.count('DELETE', '/v1/videos/100'), 0);
    const deleted = await run(['videos', 'delete', '100', '--yes']);
    assert.equal(deleted.code, 0, deleted.stderr);
    assert.equal(api.videos.size, 0);
  });
});
