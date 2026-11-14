import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { it } from 'node:test';
import { createCliHarness } from './helpers.mjs';

it('--no-wait retains progress after the final video lookup fails and resumes without sending again', async (t) => {
  const { api, video, configDir, run, checkpoints } = await createCliHarness(t);
  api.videoStatusAfterCompletion = 'processing';
  api.faults.set('GET /v1/videos/100', { status: 500, code: 'TEMPORARY_FAILURE', times: 1 });
  const args = ['upload', video, '--no-wait', '--json'];

  const failed = await run(args);
  assert.equal(failed.code, 1, failed.stderr);
  assert.equal(JSON.parse(failed.stdout).error.code, 'TEMPORARY_FAILURE');
  const saved = await checkpoints();
  assert.equal(saved.length, 1, 'the unsuccessful command must keep its resume checkpoint');
  const checkpoint = JSON.parse(await readFile(join(configDir, 'uploads', saved[0]), 'utf8'));
  const uploaded = [...api.uploads.values()][0];
  assert.equal(checkpoint.uploadId, uploaded.id);
  const putsBefore = api.requests.filter((request) => request.method === 'PUT' && request.path.startsWith('/storage/')).length;

  const resumed = await run(args);
  assert.equal(resumed.code, 0, resumed.stderr);
  const result = JSON.parse(resumed.stdout).data;
  assert.equal(result.uploadId, uploaded.id);
  assert.equal(result.video.id, 100);
  assert.equal(result.video.status, 'processing', '--no-wait must not wait for readiness on resume');
  assert.equal(api.uploads.size, 1);
  assert.equal(api.videos.size, 1);
  assert.equal(api.count('POST', '/v1/uploads'), 1, 'do not initialize another upload');
  assert.equal(api.count('PUT', `/v1/uploads/${uploaded.id}/completion`), 1, 'do not complete an already sealed upload again');
  assert.equal(api.requests.filter((request) => request.method === 'PUT' && request.path.startsWith('/storage/')).length, putsBefore, 'do not resend stored bytes');
  assert.equal(api.count('GET', '/v1/videos/100'), 2);
  assert.deepEqual(await checkpoints(), [], 'only a successful result releases the checkpoint');
});

it('--no-wait removes its checkpoint after a successful processing response', async (t) => {
  const { api, video, run, checkpoints } = await createCliHarness(t);
  api.videoStatusAfterCompletion = 'processing';

  const result = await run(['upload', video, '--no-wait', '--json']);
  assert.equal(result.code, 0, result.stderr);
  assert.equal(JSON.parse(result.stdout).data.video.status, 'processing');
  assert.equal(api.count('GET', '/v1/videos/100'), 1, 'do not poll for readiness');
  assert.deepEqual(await checkpoints(), []);
});
