import { act, renderHook, waitFor } from '@testing-library/react';
import {
  createMemoryResumeStore,
  UploadApiError,
  type ActiveUploadSummary,
  type CompleteUploadBody,
  type CreateUploadResult,
  type PersistedUploadRecord,
  type UploadApi,
  type UploadStateData,
} from '@basetube/api';
import type { VideoProgressBatchResponse } from '../../api/video';
import { useUploadQueue } from '../useUploadQueue';

// The queue's default collaborators talk to axios (`PUT /videos/:id`,
// `GET /videos/progress`). Every test injects its own, so the real module only
// has to exist — and must never reach the network from jsdom.
jest.mock('../../api/video', () => ({
  updateVideo: jest.fn().mockResolvedValue({ success: true }),
  getVideoProgressBatch: jest.fn().mockResolvedValue({ success: true, data: {} }),
}));

if (typeof (globalThis.crypto as Crypto | undefined)?.randomUUID !== 'function') {
  let counter = 0;
  Object.defineProperty(globalThis, 'crypto', {
    configurable: true,
    value: { ...globalThis.crypto, randomUUID: () => `uuid-${(counter += 1)}` },
  });
}

const videoFile = () => new File(['0123456789'], 'clip.mp4', { type: 'video/mp4' });

interface Harness {
  api: UploadApi;
  order: string[];
  patches: unknown[];
  completions: CompleteUploadBody[];
  releaseCreate: () => void;
}

/**
 * An upload that is already fully in storage: the transfer does one `getState`,
 * sees every part, and goes straight to completion. `create` blocks on a gate
 * so the test can interleave metadata edits with the transfer deterministically.
 */
function harness(overrides: Partial<UploadApi> = {}): Harness {
  const order: string[] = [];
  const patches: unknown[] = [];
  const completions: CompleteUploadBody[] = [];
  let releaseCreate = () => {};
  const gate = new Promise<void>((resolve) => {
    releaseCreate = resolve;
  });

  const state: UploadStateData = {
    uploadId: 'upload-1',
    uploadState: 'uploading',
    partSizeBytes: 10,
    partCount: 1,
    completedParts: [{ partNumber: 1, etag: 'etag-1', sizeBytes: 10 }],
    canRenewCapabilities: true,
  };

  const api: UploadApi = {
    async create(): Promise<CreateUploadResult> {
      await gate;
      order.push('create');
      return {
        kind: 'ready',
        data: {
          uploadId: 'upload-1',
          partSizeBytes: 10,
          partCount: 1,
          capabilities: [],
          expiresAt: '2026-08-28T11:00:00.000Z',
        },
      };
    },
    async getState() {
      return state;
    },
    async renewCapabilities() {
      return { capabilities: [] };
    },
    async complete(_uploadId, body) {
      order.push('complete');
      completions.push(body);
      return { uploadId: 'upload-1', uploadState: 'processing', videoId: 42 };
    },
    async abort() {},
    async patch(_uploadId, body) {
      order.push('patch');
      patches.push(body);
    },
    async listActive(): Promise<ActiveUploadSummary[]> {
      return [];
    },
    ...overrides,
  };

  return { api, order, patches, completions, releaseCreate };
}

describe('useUploadQueue metadata flush', () => {
  // The backend creates the Video row during completion, after which PATCH is
  // a 409. A debounced edit that fires afterwards is simply lost.
  it('flushes the debounced metadata PATCH before completing', async () => {
    const { api, order, patches, releaseCreate } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: createMemoryResumeStore(), notify: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });

    // Typed while the create round-trip is still in flight — the 800 ms
    // debounce has nowhere near expired when completion comes due.
    act(() => {
      result.current.updateMetadata(localId, { title: 'Final title' });
    });

    releaseCreate();

    await waitFor(() => expect(order).toContain('complete'));
    expect(order.indexOf('patch')).toBeGreaterThanOrEqual(0);
    expect(order.indexOf('patch')).toBeLessThan(order.indexOf('complete'));
    expect(patches).toEqual([{ title: 'Final title' }]);
  });

  it('sends the PATCH only once, not again when the debounce would have fired', async () => {
    const { api, order, releaseCreate } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: createMemoryResumeStore(), notify: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });
    act(() => {
      result.current.updateMetadata(localId, { title: 'Final title' });
    });
    releaseCreate();
    await waitFor(() => expect(order).toContain('complete'));

    await new Promise((resolve) => setTimeout(resolve, 900));
    expect(order.filter((step) => step === 'patch')).toHaveLength(1);
  }, 10_000);

  // 409 UPLOAD_STATE_CONFLICT carries `details.videoId`: the draft is gone and
  // the Video row is now the thing to edit. The edit itself must survive that
  // change of address — a 409 is a redirect, not a rejection.
  it('records the videoId, tells the creator, and re-sends the lost fields to the video', async () => {
    const notify = jest.fn();
    const applyVideoUpdate = jest.fn().mockResolvedValue(undefined);
    const { api, releaseCreate } = harness({
      async patch() {
        throw new UploadApiError('conflict', 409, 'UPLOAD_STATE_CONFLICT', null, { videoId: 55 });
      },
      // The same row the 409 pointed at; completion reports it too.
      async complete() {
        return { uploadId: 'upload-1', uploadState: 'processing', videoId: 55 };
      },
    });
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: createMemoryResumeStore(), notify, applyVideoUpdate }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });
    act(() => {
      result.current.updateMetadata(localId, { title: 'Too late' });
    });
    releaseCreate();

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith('Saved to your video — edit it in Videos Management'),
    );
    await waitFor(() =>
      expect(result.current.entries.find((entry) => entry.localId === localId)?.videoId).toBe(55),
    );
    // The title the creator typed lands on the video, not on the floor.
    await waitFor(() =>
      expect(applyVideoUpdate).toHaveBeenCalledWith(55, {
        title: 'Too late',
        description: undefined,
        isPublic: false,
      }),
    );
  });

  it('keeps the edit queued when the 409 fallback also fails', async () => {
    const notify = jest.fn();
    const applyVideoUpdate = jest.fn().mockRejectedValue(new Error('offline'));
    const { api, releaseCreate } = harness({
      async patch() {
        throw new UploadApiError('conflict', 409, 'UPLOAD_STATE_CONFLICT', null, { videoId: 55 });
      },
      async complete() {
        return { uploadId: 'upload-1', uploadState: 'processing', videoId: 55 };
      },
    });
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: createMemoryResumeStore(), notify, applyVideoUpdate }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });
    act(() => {
      result.current.updateMetadata(localId, { title: 'Too late' });
    });
    releaseCreate();

    await waitFor(() =>
      expect(notify).toHaveBeenCalledWith(
        'Your latest changes could not be saved yet — we will keep trying.',
      ),
    );

    // Still pending: an explicit flush retries the same fields.
    applyVideoUpdate.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.flushMetadata(localId);
    });
    expect(applyVideoUpdate).toHaveBeenLastCalledWith(55, {
      title: 'Too late',
      description: undefined,
      isPublic: false,
    });
  });

  // A 5xx says nothing about whether the edit is still applicable, so the
  // pending patch has to outlive it.
  it('keeps the pending patch for the next flush when the PATCH 500s', async () => {
    let attempts = 0;
    const bodies: unknown[] = [];
    const { api, releaseCreate } = harness({
      async patch(_uploadId, body) {
        attempts += 1;
        bodies.push(body);
        if (attempts === 1) throw new UploadApiError('boom', 500, 'INTERNAL_ERROR', null);
      },
      // Keep the row a draft so the retry is still a PATCH, not a video edit.
      async complete() {
        return { uploadId: 'upload-1', uploadState: 'processing', videoId: null };
      },
    });
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: createMemoryResumeStore(), notify: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });
    act(() => {
      result.current.updateMetadata(localId, { title: 'Survives a 500' });
    });
    releaseCreate();

    await waitFor(() => expect(attempts).toBe(1));

    await act(async () => {
      await result.current.flushMetadata(localId);
    });

    expect(attempts).toBe(2);
    expect(bodies).toEqual([{ title: 'Survives a 500' }, { title: 'Survives a 500' }]);
  });

  // Once the row has a videoId, PATCH is dead: the edit has to go to the
  // Video row or it is silently thrown away.
  it('routes edits made after the video exists to updateVideo', async () => {
    const applyVideoUpdate = jest.fn().mockResolvedValue(undefined);
    const { api, order, releaseCreate } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({
        api,
        resumeStore: createMemoryResumeStore(),
        notify: jest.fn(),
        applyVideoUpdate,
      }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });
    releaseCreate();
    await waitFor(() => expect(order).toContain('complete'));
    await waitFor(() =>
      expect(result.current.entries.find((entry) => entry.localId === localId)?.videoId).toBe(42),
    );

    act(() => {
      result.current.updateMetadata(localId, { title: 'Renamed after publish' });
    });
    await act(async () => {
      await result.current.flushMetadata(localId);
    });

    expect(applyVideoUpdate).toHaveBeenCalledWith(42, {
      title: 'Renamed after publish',
      description: undefined,
      isPublic: false,
    });
    // And no doomed PATCH went out for it.
    expect(order.filter((step) => step === 'patch')).toHaveLength(0);
  });
});

describe('useUploadQueue parked thumbnail', () => {
  // The thumbnail is chosen long before the worker creates the Video row, and
  // the queue outlives the upload page, so the queue owns the apply.
  it('applies a parked thumbnail as soon as videoId appears', async () => {
    const applyVideoUpdate = jest.fn().mockResolvedValue(undefined);
    const { api, releaseCreate } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({
        api,
        resumeStore: createMemoryResumeStore(),
        notify: jest.fn(),
        applyVideoUpdate,
      }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });

    const thumbnail = new File(['img'], 'thumb.jpg', { type: 'image/jpeg' });
    act(() => {
      result.current.setPendingThumbnail(localId, thumbnail);
    });
    expect(applyVideoUpdate).not.toHaveBeenCalled();

    releaseCreate();

    // `isPublic` rides along because `PUT /videos/:id` turns a missing
    // `is_public` into `false` — a thumbnail must not unpublish the video.
    await waitFor(() =>
      expect(applyVideoUpdate).toHaveBeenCalledWith(42, { thumbnail, isPublic: false }),
    );
    expect(applyVideoUpdate).toHaveBeenCalledTimes(1);
  });

  it('does nothing once the thumbnail is cleared', async () => {
    const applyVideoUpdate = jest.fn().mockResolvedValue(undefined);
    const { api, releaseCreate, order } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({
        api,
        resumeStore: createMemoryResumeStore(),
        notify: jest.fn(),
        applyVideoUpdate,
      }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });
    act(() => {
      result.current.setPendingThumbnail(localId, new File(['img'], 'thumb.jpg'));
      result.current.setPendingThumbnail(localId, null);
    });

    releaseCreate();

    await waitFor(() => expect(order).toContain('complete'));
    expect(applyVideoUpdate).not.toHaveBeenCalled();
  });
});

/** A row already recovered from IndexedDB: bytes in, video created. */
function persistedRow(overrides: Partial<PersistedUploadRecord> = {}): PersistedUploadRecord {
  return {
    localId: 'row-1',
    clientAttemptId: 'row-1',
    uploadId: 'upload-9',
    channelId: 7,
    title: 'clip',
    description: null,
    isPublic: false,
    tags: null,
    filename: 'clip.mp4',
    sizeBytes: 10,
    lastModified: 0,
    contentType: 'video/mp4',
    partSizeBytes: 10,
    partCount: 1,
    completedParts: [],
    status: 'ready',
    progress: 100,
    errorCode: null,
    errorMessage: null,
    retryAt: null,
    videoId: 99,
    videoStatus: 'processing',
    createdAt: '2026-08-28T10:00:00.000Z',
    updatedAt: '2026-08-28T10:00:00.000Z',
    ...overrides,
  };
}

function progressResponse(
  videoId: number,
  status: 'pending' | 'processing' | 'processed' | 'failed',
  renditions: Array<{ quality: string; state: string }> = [],
): VideoProgressBatchResponse {
  return {
    success: true,
    data: { [String(videoId)]: { videoId, status, renditions, progress: undefined } },
  };
}

async function seededStore(record: PersistedUploadRecord) {
  const store = createMemoryResumeStore();
  await store.put(record);
  return store;
}

describe('useUploadQueue video processing poll', () => {
  // `GET /videos/uploads?active=true` stops listing a `ready` upload the moment
  // its video is processed/failed. Treating that absence as "vanished" both
  // deleted the row and left it reading "processing" forever.
  it('keeps a row the active list no longer returns and finishes it from /videos/progress', async () => {
    const { api } = harness(); // listActive() → []
    const store = await seededStore(persistedRow());
    const fetchVideoProgress = jest.fn().mockResolvedValue(progressResponse(99, 'processed'));

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    // Not forgotten by the boot reconciliation…
    expect(result.current.entries).toHaveLength(1);
    // …and the progress poll — which runs once on boot — settles it.
    await waitFor(() => expect(result.current.entries[0].videoStatus).toBe('processed'));
    expect(fetchVideoProgress).toHaveBeenCalledWith([99]);
    // The row is dismissible now, not stuck mid-transfer.
    expect(result.current.entries[0].status).toBe('ready');
  });

  it('carries the rendition detail so the row can say what is transcoding', async () => {
    const { api } = harness();
    const store = await seededStore(persistedRow());
    const fetchVideoProgress = jest.fn().mockResolvedValue(
      progressResponse(99, 'processing', [
        { quality: '480p', state: 'verified' },
        { quality: '720p', state: 'in_progress' },
      ]),
    );

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() =>
      expect(result.current.entries[0].renditions).toEqual([
        { quality: '480p', state: 'verified' },
        { quality: '720p', state: 'in_progress' },
      ]),
    );
  });
});

describe('useUploadQueue video processing poll cadence', () => {
  const setVisibility = (hidden: boolean) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (hidden ? 'hidden' : 'visible'),
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    // Kill the ±1 s jitter so the interval is exactly the nominal one.
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    setVisibility(false);
  });

  it('polls every 5 s and stops for good once the video is processed', async () => {
    setVisibility(false);
    const { api } = harness();
    const store = await seededStore(persistedRow());
    const fetchVideoProgress = jest
      .fn()
      .mockResolvedValueOnce(progressResponse(99, 'processing'))
      .mockResolvedValue(progressResponse(99, 'processed'));

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(fetchVideoProgress).toHaveBeenCalledTimes(1));

    await act(async () => {
      jest.advanceTimersByTime(5_100);
    });
    expect(fetchVideoProgress).toHaveBeenCalledTimes(2);
    await waitFor(() => expect(result.current.entries[0].videoStatus).toBe('processed'));

    // Terminal: no further tick is ever scheduled.
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(fetchVideoProgress).toHaveBeenCalledTimes(2);
  });

  it('backs off to a third of the rate while the tab is hidden', async () => {
    setVisibility(true);
    const { api } = harness();
    const store = await seededStore(persistedRow());
    const fetchVideoProgress = jest.fn().mockResolvedValue(progressResponse(99, 'processing'));

    renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(fetchVideoProgress).toHaveBeenCalledTimes(1));

    // 5 s would have been the visible-tab tick; hidden, nothing happens yet.
    await act(async () => {
      jest.advanceTimersByTime(14_000);
    });
    expect(fetchVideoProgress).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(1_500);
    });
    expect(fetchVideoProgress).toHaveBeenCalledTimes(2);
  });
});
