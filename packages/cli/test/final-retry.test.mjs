import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';
import { test } from 'node:test';
import { createCliHarness } from './helpers.mjs';

const VIDEO = Buffer.from('0123456789abcdefghij');

/** Refuse only part 2, leaving the other parts in storage across retries. */
function refusePart(api, { failures, loseSuccessResponse = false }) {
  const storage = api.storage.bind(api);
  let attempts = 0;
  api.storage = (req, res, url, raw, record) => {
    const partNumber = Number(url.pathname.split('/').at(-1));
    record.partNumber = partNumber;
    if (partNumber !== 2) return storage(req, res, url, raw, record);
    attempts += 1;
    if (attempts <= failures) {
      res.writeHead(503);
      res.end();
      return;
    }
    if (loseSuccessResponse) {
      // Keep the bytes/ETag, but drop the socket before the client gets a reply.
      storage(req, { writeHead() {}, end() { res.destroy(); } }, url, raw, record);
      return;
    }
    return storage(req, res, url, raw, record);
  };
  return () => { api.storage = storage; };
}

for (const loseSuccessResponse of [false, true]) {
  test(`completes after the fifth part attempt ${loseSuccessResponse ? 'loses its response' : 'succeeds'}`, { timeout: 15_000 }, async t => {
    const { api, video, run, checkpoints } = await createCliHarness(t);
    await writeFile(video, VIDEO);
    refusePart(api, { failures: 4, loseSuccessResponse });

    const result = await run(['upload', video, '--json']);
    assert.equal(result.code, 0, result.stderr);
    const body = JSON.parse(result.stdout);
    assert.equal(body.ok, true);
    assert.equal(body.data.video.status, 'ready');
    assert.equal(api.count('POST', '/v1/uploads'), 1);
    assert.equal(api.storagePuts(2).length, 5, 'no sixth send');
    for (const part of [1, 3]) assert.equal(api.storagePuts(part).length, 1, 'received parts are not sent again');
    assert.deepEqual(api.assembled(body.data.uploadId), VIDEO);
    assert.equal(api.count('PUT', `/v1/uploads/${body.data.uploadId}/completion`), 1);
    assert.deepEqual(await checkpoints(), []);
  });
}

test('stops after five failed sends, retains progress and resumes only the missing part', { timeout: 15_000 }, async t => {
  const { api, video, run, checkpoints } = await createCliHarness(t);
  await writeFile(video, VIDEO);
  const restore = refusePart(api, { failures: Infinity });

  const result = await run(['upload', video, '--json']);
  assert.equal(result.code, 1, result.stderr);
  assert.equal(JSON.parse(result.stdout).error.code, 'PARTS_NOT_SENT');
  assert.equal(api.storagePuts(2).length, 5);
  const [upload] = api.uploads.values();
  assert.equal(api.count('GET', `/v1/uploads/${upload.id}`), 6, 'final reconciliation before failure');
  assert.equal(api.count('PUT', `/v1/uploads/${upload.id}/completion`), 0);
  assert.equal((await checkpoints()).length, 1);

  restore();
  const resumed = await run(['upload', video, '--json']);
  assert.equal(resumed.code, 0, resumed.stderr);
  assert.equal(JSON.parse(resumed.stdout).data.uploadId, upload.id);
  assert.equal(api.count('POST', '/v1/uploads'), 1);
  assert.equal(api.storagePuts(2).length, 6);
  for (const part of [1, 3]) assert.equal(api.storagePuts(part).length, 1);
  assert.equal(api.count('PUT', `/v1/uploads/${upload.id}/completion`), 1);
  assert.deepEqual(api.assembled(upload.id), VIDEO);
  assert.deepEqual(await checkpoints(), []);
});
