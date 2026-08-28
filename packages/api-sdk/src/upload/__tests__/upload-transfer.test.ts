import type { CompletedPart, CreateUploadResult, UploadStateData } from '../contracts';
import { DirectUploadError } from '../direct-upload-transport';
import { UploadApiError } from '../endpoints';
import type { UploadQueueEntry } from '../types';
import { classifyTransferFailure, executeUploadTransfer } from '../upload-transfer';
import {
  capability,
  completedPart,
  dependencies,
  fakeFile,
  queueEntry,
  stubApi,
  uploadState,
} from './helpers';

/** Returns each scripted state once, then repeats the last one. */
function scriptedStates(states: UploadStateData[]) {
  let index = 0;
  return async () => {
    const state = states[Math.min(index, states.length - 1)]!;
    index += 1;
    return state;
  };
}

function collector() {
  const patches: Array<Partial<UploadQueueEntry>> = [];
  const update = (patch: Partial<UploadQueueEntry>) => {
    patches.push(patch);
  };
  return { patches, update };
}

describe('executeUploadTransfer', () => {
  it('creates the row, pushes every part, and completes with the authoritative list', async () => {
    const file = fakeFile(300);
    const entry = queueEntry({ file });
    const put: Array<number> = [];
    const api = stubApi({
      getState: scriptedStates([
        uploadState({ completedParts: [] }),
        uploadState({
          completedParts: [completedPart(1, 100), completedPart(2, 100), completedPart(3, 100)],
        }),
      ]),
    });
    const { patches, update } = collector();

    await executeUploadTransfer(
      entry,
      file,
      dependencies(api, async (cap) => {
        put.push(cap.partNumber);
        return { etag: `etag-${cap.partNumber}` };
      }),
      update,
    );

    expect(api.calls.create).toHaveLength(1);
    expect(put.sort()).toEqual([1, 2, 3]);
    expect(api.calls.complete).toEqual([
      {
        parts: [
          { partNumber: 1, etag: 'etag-1' },
          { partNumber: 2, etag: 'etag-2' },
          { partNumber: 3, etag: 'etag-3' },
        ],
      },
    ]);
    expect(patches.at(-1)).toMatchObject({ status: 'processing', videoId: 42 });
  });

  it('re-sends only the parts the server is missing', async () => {
    const file = fakeFile(300);
    const entry = queueEntry({ file, uploadId: 'upload-1', partSizeBytes: 100, partCount: 3 });
    const known: CompletedPart[] = [completedPart(1, 100), completedPart(3, 100)];
    const put: number[] = [];
    const api = stubApi({
      getState: scriptedStates([
        uploadState({ completedParts: known }),
        uploadState({
          completedParts: [completedPart(1, 100), completedPart(2, 100), completedPart(3, 100)],
        }),
      ]),
    });

    await executeUploadTransfer(
      entry,
      file,
      dependencies(api, async (cap) => {
        put.push(cap.partNumber);
        return { etag: `etag-${cap.partNumber}` };
      }),
      () => {},
    );

    expect(api.calls.create).toHaveLength(0);
    expect(put).toEqual([2]);
    expect(api.calls.renew).toEqual([[2]]);
  });

  it('skips the transfer entirely when every part is already listed', async () => {
    const file = fakeFile(300);
    const entry = queueEntry({ file, uploadId: 'upload-1' });
    const all = [completedPart(1, 100), completedPart(2, 100), completedPart(3, 100)];
    const api = stubApi({ getState: scriptedStates([uploadState({ completedParts: all })]) });
    const put = jest.fn();

    await executeUploadTransfer(entry, file, dependencies(api, put as never), () => {});

    expect(put).not.toHaveBeenCalled();
    expect(api.calls.complete).toHaveLength(1);
  });

  it('renews a single expired capability once and retries that part', async () => {
    const file = fakeFile(100);
    const entry = queueEntry({ file, uploadId: 'upload-1', sizeBytes: 100 });
    const api = stubApi({
      getState: scriptedStates([
        uploadState({ partCount: 1, completedParts: [] }),
        uploadState({ partCount: 1, completedParts: [completedPart(1, 100)] }),
      ]),
      renewCapabilities: async (_uploadId, partNumbers) => ({
        capabilities: partNumbers.map((n) => capability(n, 100)),
      }),
    });
    let attempts = 0;

    await executeUploadTransfer(
      entry,
      file,
      dependencies(api, async () => {
        attempts += 1;
        if (attempts === 1) {
          throw new DirectUploadError('Storage upload failed (403)', 403, 'STORAGE_PUT_FAILED');
        }
        return { etag: 'etag-1' };
      }),
      () => {},
    );

    expect(attempts).toBe(2);
    expect(api.calls.complete).toHaveLength(1);
  });

  it('retries creation while the initialization lease is held (202)', async () => {
    const file = fakeFile(300);
    const entry = queueEntry({ file });
    const slept: number[] = [];
    let creates = 0;
    const api = stubApi({
      async create(): Promise<CreateUploadResult> {
        creates += 1;
        if (creates < 3) return { kind: 'pending', data: { uploadId: null, retryAfterSeconds: 2 } };
        return {
          kind: 'ready',
          data: {
            uploadId: 'upload-1',
            partSizeBytes: 100,
            partCount: 3,
            capabilities: [capability(1, 100), capability(2, 100), capability(3, 100)],
            expiresAt: '2026-08-28T11:00:00.000Z',
          },
        };
      },
      getState: scriptedStates([
        uploadState({ completedParts: [] }),
        uploadState({
          completedParts: [completedPart(1, 100), completedPart(2, 100), completedPart(3, 100)],
        }),
      ]),
    });

    await executeUploadTransfer(
      entry,
      file,
      dependencies(
        api,
        async (cap) => ({ etag: `etag-${cap.partNumber}` }),
        async (ms) => {
          slept.push(ms);
        },
      ),
      () => {},
    );

    expect(creates).toBe(3);
    expect(slept).toEqual([2000, 2000]);
    // The capabilities that came back with the create are reused, not re-signed.
    expect(api.calls.renew).toEqual([]);
  });

  it('stops and reports the server status when the row is already terminal', async () => {
    const file = fakeFile(300);
    const entry = queueEntry({ file, uploadId: 'upload-1' });
    const api = stubApi({
      getState: scriptedStates([uploadState({ uploadState: 'held', completedParts: [] })]),
    });
    const { patches, update } = collector();

    await executeUploadTransfer(entry, file, dependencies(api, jest.fn() as never), update);

    expect(patches.at(-1)).toMatchObject({ status: 'held' });
    expect(api.calls.complete).toHaveLength(0);
  });

  it('waits instead of completing when the server has not confirmed every part', async () => {
    const file = fakeFile(300);
    const entry = queueEntry({ file, uploadId: 'upload-1' });
    const api = stubApi({
      getState: scriptedStates([
        uploadState({ completedParts: [] }),
        uploadState({ completedParts: [completedPart(1, 100)] }),
      ]),
    });

    await expect(
      executeUploadTransfer(
        entry,
        file,
        dependencies(api, async () => ({ etag: null })),
        () => {},
      ),
    ).rejects.toMatchObject({ code: 'PART_CONFIRMATION_PENDING' });
    expect(api.calls.complete).toHaveLength(0);
  });
});

describe('classifyTransferFailure', () => {
  const cases: Array<[string, unknown, { status: string; retryAfterSeconds: number | null }]> = [
    [
      'ambiguous initialization is held for a new attempt',
      new UploadApiError('unknown', 409, 'UPLOAD_INITIALIZATION_UNKNOWN', null),
      { status: 'held', retryAfterSeconds: null },
    ],
    [
      'admission pressure waits for the server-provided delay',
      new UploadApiError('busy', 429, 'UPLOAD_ADMISSION_BUSY', 5),
      { status: 'retry_wait', retryAfterSeconds: 5 },
    ],
    [
      'a 5xx waits ten seconds by default',
      new UploadApiError('boom', 503, 'STORAGE_UNAVAILABLE', null),
      { status: 'retry_wait', retryAfterSeconds: 10 },
    ],
    [
      'an unreachable API waits rather than failing',
      new UploadApiError('offline', 0, 'NETWORK_ERROR', null),
      { status: 'retry_wait', retryAfterSeconds: 10 },
    ],
    [
      'a definite 4xx fails',
      new UploadApiError('bad parts', 400, 'UPLOAD_PARTS_INVALID', null),
      { status: 'failed', retryAfterSeconds: null },
    ],
    [
      'a signed-length mismatch fails',
      new DirectUploadError('length', null, 'SIGNED_LENGTH_MISMATCH'),
      { status: 'failed', retryAfterSeconds: null },
    ],
    [
      'a missing capability fails',
      new DirectUploadError('caps', null, 'CAPABILITY_INVALID'),
      { status: 'failed', retryAfterSeconds: null },
    ],
    [
      'a network blip during a PUT waits',
      new DirectUploadError('net', null, 'STORAGE_NETWORK_ERROR'),
      { status: 'retry_wait', retryAfterSeconds: 10 },
    ],
    [
      'an unknown throwable waits',
      new Error('who knows'),
      { status: 'retry_wait', retryAfterSeconds: 10 },
    ],
  ];

  it.each(cases)('%s', (_name, error, expected) => {
    expect(classifyTransferFailure(error)).toMatchObject(expected);
  });
});
