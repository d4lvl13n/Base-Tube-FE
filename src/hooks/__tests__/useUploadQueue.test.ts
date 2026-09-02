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
import { SELECTION_NOTICE_MS, uploadRowIsTerminal, useUploadQueue } from '../useUploadQueue';

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
    async get(): Promise<ActiveUploadSummary> {
      throw new UploadApiError('Upload not found', 404, 'UPLOAD_NOT_FOUND', null);
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
    // The title the creator typed lands on the video, not on the floor — and
    // visibility is NOT restated: it was not part of this edit.
    await waitFor(() =>
      expect(applyVideoUpdate).toHaveBeenCalledWith(55, {
        title: 'Too late',
        description: undefined,
      }),
    );
    expect(applyVideoUpdate.mock.calls[0][1]).not.toHaveProperty('isPublic');
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
    });
    expect(applyVideoUpdate.mock.calls[0][1]).not.toHaveProperty('isPublic');
    // And no doomed PATCH went out for it.
    expect(order.filter((step) => step === 'patch')).toHaveLength(0);
  });

  // Visibility travels only when it is part of the edit itself.
  it('sends isPublic to updateVideo only when the pending patch contains it', async () => {
    const applyVideoUpdate = jest.fn().mockResolvedValue(undefined);
    const { api, order, releaseCreate } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({
        api,
        resumeStore: createMemoryResumeStore(),
        notify: jest.fn(),
        applyVideoUpdate,
        fetchVideoProgress: jest.fn().mockResolvedValue(progressResponse(42, 'processing')),
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
      result.current.updateMetadata(localId, { isPublic: true });
    });
    await act(async () => {
      await result.current.flushMetadata(localId);
    });

    expect(applyVideoUpdate).toHaveBeenLastCalledWith(42, {
      title: undefined,
      description: undefined,
      isPublic: true,
    });
  });
});

/**
 * The default `applyVideoUpdate` is the module's own `PUT /videos/:id` sender.
 * The controller treats an OMITTED `is_public` as "not mentioned", so what the
 * FormData carries — and what it leaves out — decides whether a thumbnail or
 * title edit can silently flip a video's visibility.
 */
describe('useUploadQueue default video update body', () => {
  const mockedUpdateVideo = jest.requireMock('../../api/video').updateVideo as jest.Mock;

  beforeEach(() => {
    mockedUpdateVideo.mockClear();
  });

  function lastBody(): FormData {
    const call = mockedUpdateVideo.mock.calls[mockedUpdateVideo.mock.calls.length - 1];
    return call[1] as FormData;
  }

  async function completedRow() {
    const { api, order, releaseCreate } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({
        api,
        resumeStore: createMemoryResumeStore(),
        notify: jest.fn(),
        fetchVideoProgress: jest.fn().mockResolvedValue(progressResponse(42, 'processing')),
      }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });
    return { result, localId, order, releaseCreate };
  }

  it('omits is_public and carries an empty description when only text changed', async () => {
    const { result, localId, order, releaseCreate } = await completedRow();
    releaseCreate();
    await waitFor(() => expect(order).toContain('complete'));
    await waitFor(() =>
      expect(result.current.entries.find((entry) => entry.localId === localId)?.videoId).toBe(42),
    );

    act(() => {
      result.current.updateMetadata(localId, { title: 'Renamed', description: '' });
    });
    await act(async () => {
      await result.current.flushMetadata(localId);
    });

    expect(mockedUpdateVideo).toHaveBeenCalledWith('42', expect.any(FormData));
    const body = lastBody();
    expect(body.get('title')).toBe('Renamed');
    // An empty string is a legitimate "clear the description", not "unset".
    expect(body.has('description')).toBe(true);
    expect(body.get('description')).toBe('');
    expect(body.has('is_public')).toBe(false);
  });

  it('sends is_public when the edit is a visibility change', async () => {
    const { result, localId, order, releaseCreate } = await completedRow();
    releaseCreate();
    await waitFor(() => expect(order).toContain('complete'));
    await waitFor(() =>
      expect(result.current.entries.find((entry) => entry.localId === localId)?.videoId).toBe(42),
    );

    act(() => {
      result.current.updateMetadata(localId, { isPublic: true });
    });
    await act(async () => {
      await result.current.flushMetadata(localId);
    });

    const body = lastBody();
    expect(body.get('is_public')).toBe('true');
    expect(body.has('title')).toBe(false);
    expect(body.has('description')).toBe(false);
  });

  it('applies a parked thumbnail with the thumbnail field alone', async () => {
    const { result, localId, releaseCreate } = await completedRow();
    const thumbnail = new File(['img'], 'thumb.jpg', { type: 'image/jpeg' });
    act(() => {
      result.current.setPendingThumbnail(localId, thumbnail);
    });
    releaseCreate();

    await waitFor(() => expect(mockedUpdateVideo).toHaveBeenCalledWith('42', expect.any(FormData)));
    const body = lastBody();
    expect(body.has('thumbnail')).toBe(true);
    expect(body.has('is_public')).toBe(false);
    expect(body.has('title')).toBe(false);
    expect(body.has('description')).toBe(false);
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

    // Thumbnail ONLY. Restating `isPublic` here flipped visibility back when
    // the creator had changed it in Videos Management before a slow thumbnail
    // landed; the API leaves an omitted `is_public` alone.
    await waitFor(() => expect(applyVideoUpdate).toHaveBeenCalledWith(42, { thumbnail }));
    expect(applyVideoUpdate).toHaveBeenCalledTimes(1);
    expect(applyVideoUpdate.mock.calls[0][1]).not.toHaveProperty('isPublic');
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

/**
 * The same file as `videoFile()`, but with a fixed `lastModified` so it matches
 * the persisted fingerprint a reload has to recognise.
 */
const resumableFile = () =>
  new File(['0123456789'], 'clip.mp4', { type: 'video/mp4', lastModified: 0 });

/** An upload the browser lost its file handle for, still live on the server. */
function resumableRow(overrides: Partial<PersistedUploadRecord> = {}): PersistedUploadRecord {
  return persistedRow({
    status: 'uploading',
    progress: 50,
    videoId: null,
    videoStatus: null,
    ...overrides,
  });
}

/** The active-list row that keeps `resumableRow` from being forgotten at boot. */
function activeRow(): ActiveUploadSummary {
  return {
    uploadId: 'upload-9',
    uploadState: 'uploading',
    channelId: 7,
    title: 'clip',
    description: null,
    isPublic: false,
    tags: null,
    originalFilename: 'clip.mp4',
    declaredSizeBytes: 10,
    partSizeBytes: 10,
    partCount: 1,
    videoId: null,
    videoStatus: null,
    errorCode: null,
    createdAt: '2026-08-28T10:00:00.000Z',
  } as ActiveUploadSummary;
}

describe('useUploadQueue cancel that the server refuses', () => {
  /**
   * Hydrates one row, reattaches its file, and cancels it — with the queue
   * paused throughout, so the scheduler's behaviour afterwards is the only
   * thing the test is measuring.
   */
  async function cancelWithFailingAbort(abortError: Error) {
    const touched: string[] = [];
    const { api } = harness({
      abort: async () => {
        touched.push('abort');
        throw abortError;
      },
      async getState() {
        touched.push('getState');
        throw new Error('the transfer must not run');
      },
      listActive: async () => [activeRow()],
    });
    const store = await seededStore(resumableRow());
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    // Paused, so reattaching the file cannot start a transfer behind our back.
    act(() => {
      result.current.setPaused(true);
    });
    await act(async () => {
      await result.current.reselectFiles([resumableFile()]);
    });
    await waitFor(() => expect(result.current.entries[0].status).toBe('queued'));
    const localId = result.current.entries[0].localId;

    await act(async () => {
      await result.current.abortEntry(localId);
    });

    return { result, localId, touched };
  }

  it('parks the row in a terminal `aborted` state instead of requeueing it', async () => {
    const { result } = await cancelWithFailingAbort(new Error('Network Error'));

    const entry = result.current.entries[0];
    expect(entry.status).toBe('aborted');
    expect(entry.errorCode).toBe('UPLOAD_ABORT_FAILED');
    // The file is still attached — what stops the resume is the status, not
    // the absence of bytes to send.
    expect(entry.file).not.toBeNull();
  });

  it('is never picked up again by the scheduler', async () => {
    const { result, touched } = await cancelWithFailingAbort(new Error('Network Error'));

    // Unpausing is exactly the moment the old `queued` fallback resumed the
    // upload the creator had just cancelled.
    await act(async () => {
      result.current.setPaused(false);
    });
    await act(async () => {
      await Promise.resolve();
    });

    expect(touched).toEqual(['abort']);
    expect(result.current.entries[0].status).toBe('aborted');
  });

  it('can be removed by the creator', async () => {
    const { result, localId } = await cancelWithFailingAbort(new Error('Network Error'));

    await act(async () => {
      await result.current.removeEntry(localId);
    });

    expect(result.current.entries).toHaveLength(0);
  });

  it('reports the failure as a code plus message, never as raw text', async () => {
    const { result } = await cancelWithFailingAbort(
      new Error('{"error":{"code":"BOOM","stack":"at abort (upload.ts:12:3)"}}'),
    );

    expect(result.current.actionError).toEqual({
      code: 'UPLOAD_ABORT_FAILED',
      message: '{"error":{"code":"BOOM","stack":"at abort (upload.ts:12:3)"}}',
    });
  });

  it('resolves true and leaves nothing behind when the server accepts the cancel', async () => {
    const { api } = harness({ listActive: async () => [activeRow()] });
    const store = await seededStore(resumableRow());
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => {
      result.current.setPaused(true);
    });

    const localId = result.current.entries[0].localId;
    let stopped = false;
    await act(async () => {
      stopped = await result.current.abortEntry(localId);
    });

    expect(stopped).toBe(true);
    expect(result.current.entries[0].status).toBe('aborted');
    expect(result.current.entries[0].errorCode).toBeNull();
    expect(result.current.actionError).toBeNull();
  });
});

describe('useUploadQueue progress poll is single-flight', () => {
  const setVisibility = (hidden: boolean) => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => (hidden ? 'hidden' : 'visible'),
    });
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
    setVisibility(false);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    setVisibility(false);
  });

  // A tab regaining focus used to jump the queue while a batch was already on
  // the wire: two overlapping requests, and the older answer could land last.
  it('does not issue a second request when the tab is refocused mid-poll', async () => {
    let resolveFirst: (value: VideoProgressBatchResponse) => void = () => {};
    const fetchVideoProgress = jest.fn().mockImplementation(
      () =>
        new Promise<VideoProgressBatchResponse>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const { api } = harness();
    const store = await seededStore(persistedRow());

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(fetchVideoProgress).toHaveBeenCalledTimes(1));

    // Focus returns, and the 250 ms catch-up tick comes due — while the first
    // request is still unresolved.
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    await act(async () => {
      jest.advanceTimersByTime(2_000);
    });
    expect(fetchVideoProgress).toHaveBeenCalledTimes(1);

    // The one response in flight is the one that lands.
    await act(async () => {
      resolveFirst(progressResponse(99, 'processed'));
      await Promise.resolve();
    });
    await waitFor(() => expect(result.current.entries[0].videoStatus).toBe('processed'));
    expect(fetchVideoProgress).toHaveBeenCalledTimes(1);
  });
});

describe('useUploadQueue selection notice', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  // It acknowledges something the creator just did. It used to sit in the
  // panel for the rest of the session, long after it had stopped being true.
  it('takes itself down after four seconds', async () => {
    const { api } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: createMemoryResumeStore(), notify: jest.fn() }),
    );

    await act(async () => {
      await result.current.enqueueFiles([videoFile()], 7);
    });
    expect(result.current.selectionNotice).toBe('1 file added to the upload queue.');

    act(() => {
      jest.advanceTimersByTime(SELECTION_NOTICE_MS + 1);
    });
    expect(result.current.selectionNotice).toBeNull();
  });

  it('goes away at once when the panel says it was seen', async () => {
    const { api } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: createMemoryResumeStore(), notify: jest.fn() }),
    );

    await act(async () => {
      await result.current.enqueueFiles([videoFile()], 7);
    });
    act(() => result.current.dismissSelectionNotice());

    expect(result.current.selectionNotice).toBeNull();
  });
});

describe('uploadRowIsTerminal', () => {
  // "Clear finished" removes exactly the rows the panel calls Ready or Failed.
  it('is true for the settled rows and false for the working ones', () => {
    expect(uploadRowIsTerminal({ status: 'failed', videoStatus: null })).toBe(true);
    expect(uploadRowIsTerminal({ status: 'aborted', videoStatus: null })).toBe(true);
    expect(uploadRowIsTerminal({ status: 'held', videoStatus: null })).toBe(true);
    expect(uploadRowIsTerminal({ status: 'ready', videoStatus: 'processed' })).toBe(true);
    expect(uploadRowIsTerminal({ status: 'ready', videoStatus: 'failed' })).toBe(true);

    expect(uploadRowIsTerminal({ status: 'uploading', videoStatus: null })).toBe(false);
    // Upload done, transcode still running: the panel says Processing, so the
    // sweep must leave it alone.
    expect(uploadRowIsTerminal({ status: 'ready', videoStatus: 'processing' })).toBe(false);
    expect(uploadRowIsTerminal({ status: 'ready', videoStatus: null })).toBe(false);
  });
});

describe('useUploadQueue session hygiene', () => {
  // A finished batch used to reappear on every visit until the creator hit
  // "Clear finished"; a reload is a new session.
  it('forgets rows whose video is already live on reload', async () => {
    const { api } = harness();
    const store = await seededStore(persistedRow({ videoStatus: 'processed', status: 'ready' }));
    const fetchVideoProgress = jest.fn().mockResolvedValue({ success: true, data: {} });

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(result.current.entries).toHaveLength(0);
    await expect(store.list()).resolves.toHaveLength(0);
    expect(fetchVideoProgress).not.toHaveBeenCalled();
  });

  it('keeps a failed row on reload so the creator can act on it', async () => {
    const { api } = harness();
    // Failed before the server row existed, so the boot reconciliation (which
    // forgets rows the active list has retired) has nothing to say about it.
    const store = await seededStore(
      persistedRow({ uploadId: null, videoId: null, videoStatus: null, status: 'failed', errorCode: 'X' }),
    );
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.entries).toHaveLength(1);
  });

  // Video deleted from Videos Management while it transcoded: /videos/progress
  // omits ids the caller no longer owns, and the queue used to poll it forever.
  // A passthrough video is created ALREADY processed, so `listActive` never
  // returns the row with a videoId; only GET /videos/uploads/:id can say what
  // became of it.
  it('resolves a bytes-done row the active list dropped through the single-upload read', async () => {
    const get = jest.fn().mockResolvedValue({
      ...activeRow(),
      uploadState: 'ready',
      videoId: 250,
      videoStatus: 'failed',
    });
    const { api } = harness({ get });
    const store = await seededStore(persistedRow({ status: 'ready', videoId: null, videoStatus: null }));
    const fetchVideoProgress = jest.fn().mockResolvedValue({ success: true, data: {} });

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(get).toHaveBeenCalledWith('upload-9');
    // A failed video is something the creator still has to act on: kept.
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({ videoId: 250, videoStatus: 'failed' });
  });

  it('forgets a bytes-done row whose single-upload read says the video is already live', async () => {
    const get = jest.fn().mockResolvedValue({
      ...activeRow(),
      uploadState: 'ready',
      videoId: 250,
      videoStatus: 'processed',
    });
    const { api } = harness({ get });
    const store = await seededStore(persistedRow({ status: 'ready', videoId: null, videoStatus: null }));

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(get).toHaveBeenCalledWith('upload-9');
    expect(result.current.entries).toHaveLength(0);
    await expect(store.list()).resolves.toHaveLength(0);
  });

  it('forgets a bytes-done row the server no longer knows (404)', async () => {
    const { api } = harness(); // get() → 404
    const store = await seededStore(persistedRow({ status: 'ready', videoId: null, videoStatus: null }));

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.entries).toHaveLength(0);
  });

  // A flaky boot is not a verdict. `resolveAbsentRow` answers 'keep' when the
  // single-upload read fails with anything but a 404 — the record used to be
  // deleted anyway, throwing away resumable state over a transient error.
  it('keeps a bytes-done row when the single-upload read fails transiently', async () => {
    const get = jest
      .fn()
      .mockRejectedValue(new UploadApiError('bad gateway', 502, 'INTERNAL_ERROR', null));
    const { api } = harness({ get }); // listActive() → [] — the row is absent
    const store = await seededStore(
      persistedRow({ status: 'processing', progress: 90, videoId: null, videoStatus: null }),
    );
    const remove = jest.spyOn(store, 'remove');

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(get).toHaveBeenCalledWith('upload-9');
    // Still in the queue, still on disk — the poll retries later.
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({ uploadId: 'upload-9', videoId: null });
    expect(remove).not.toHaveBeenCalled();
    await expect(store.list()).resolves.toHaveLength(1);
  });

  it('drops a processing row whose video no longer exists', async () => {
    const { api } = harness();
    const store = await seededStore(persistedRow()); // videoId 99, processing
    const fetchVideoProgress = jest.fn().mockResolvedValue({ success: true, data: {} });

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() => expect(fetchVideoProgress).toHaveBeenCalledWith([99]));
    await waitFor(() => expect(result.current.entries).toHaveLength(0));
    await expect(store.list()).resolves.toHaveLength(0);
  });
});

describe('useUploadQueue progress poll trust guard', () => {
  // "Asked about but absent" only means "deleted" on a fully SUCCESSFUL answer.
  // A degraded response used to erase every processing row it was asked about.
  it('keeps a processing row when the batch answers success:false', async () => {
    const { api } = harness();
    const store = await seededStore(persistedRow()); // videoId 99, processing
    const remove = jest.spyOn(store, 'remove');
    const fetchVideoProgress = jest.fn().mockResolvedValue({ success: false, data: {} });

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() => expect(fetchVideoProgress).toHaveBeenCalledWith([99]));

    // The row survives — on screen and on disk — and keeps saying processing.
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({ videoId: 99, videoStatus: 'processing' });
    expect(remove).not.toHaveBeenCalled();
    await expect(store.list()).resolves.toHaveLength(1);
  });

  it('keeps a processing row when the batch body is malformed (no data object)', async () => {
    const { api } = harness();
    const store = await seededStore(persistedRow());
    const remove = jest.spyOn(store, 'remove');
    // `success: true` but the row map itself is missing: parsed to nothing.
    const fetchVideoProgress = jest.fn().mockResolvedValue({ success: true });

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() => expect(fetchVideoProgress).toHaveBeenCalledWith([99]));

    expect(result.current.entries).toHaveLength(1);
    expect(remove).not.toHaveBeenCalled();
    await expect(store.list()).resolves.toHaveLength(1);
  });

  // The other side of the guard: a fully successful empty answer IS a verdict —
  // the video was deleted while it transcoded, and the row goes.
  it('still drops a requested-but-absent row on a fully successful answer', async () => {
    const { api } = harness();
    const store = await seededStore(persistedRow());
    const fetchVideoProgress = jest.fn().mockResolvedValue({ success: true, data: {} });

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), fetchVideoProgress }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    await waitFor(() => expect(fetchVideoProgress).toHaveBeenCalledWith([99]));
    await waitFor(() => expect(result.current.entries).toHaveLength(0));
    await expect(store.list()).resolves.toHaveLength(0);
  });
});

describe('useUploadQueue persisted pending metadata', () => {
  // A reload during the 800 ms debounce (or after a failed PATCH) used to
  // silently drop the edit. The unacknowledged fields now ride along in the
  // persisted record as `pendingPatch`, and are cleared only when the server
  // has actually taken them.
  it('persists the unacknowledged fields and clears them once the PATCH lands', async () => {
    const store = createMemoryResumeStore();
    const { api, order, releaseCreate } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });
    act(() => {
      result.current.updateMetadata(localId, { isPublic: false });
    });

    // The record carries both the DESIRED value and the fact that the server
    // has not confirmed it yet.
    await waitFor(async () => {
      const [record] = await store.list();
      expect(record?.isPublic).toBe(false);
      expect(record?.pendingPatch).toEqual({ isPublic: false });
    });

    // Completion flushes the patch; once acknowledged, the persisted marker
    // is cleared so a later reload does not replay it.
    releaseCreate();
    await waitFor(() => expect(order).toContain('patch'));
    await waitFor(async () => {
      const [record] = await store.list();
      expect(record?.pendingPatch).toBeNull();
    });
  });

  it('re-seeds a stored pendingPatch on hydration and re-sends it without a keystroke', async () => {
    const { api, order, patches } = harness({ listActive: async () => [activeRow()] });
    const store = await seededStore(resumableRow({ pendingPatch: { isPublic: false } }));
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    // Nothing was typed this session; the reload interrupted the save, not
    // the intent — the hook re-sends the stored fields on its own.
    await waitFor(() => expect(patches).toEqual([{ isPublic: false }]));
    expect(order).toContain('patch');
    // Acknowledged: the durable marker goes too.
    await waitFor(async () => {
      const [record] = await store.list();
      expect(record?.pendingPatch).toBeNull();
    });
  });
});

describe('useUploadQueue completion refuses unacknowledged visibility', () => {
  // Completing while a visibility edit is still unconfirmed is how a video the
  // creator made private goes public. `beforeComplete` flushes the metadata
  // and REJECTS if `isPublic` is still pending — completion must not proceed.
  it('blocks completion while the visibility PATCH keeps failing, then completes once it lands', async () => {
    let patchShouldFail = true;
    const patchBodies: unknown[] = [];
    const { api, order, releaseCreate, completions } = harness({
      async patch(_uploadId, body) {
        patchBodies.push(body);
        if (patchShouldFail) throw new UploadApiError('boom', 500, 'INTERNAL_ERROR', null);
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
      result.current.updateMetadata(localId, { isPublic: true });
    });

    releaseCreate();

    // The transfer reached completion, tried to flush, could not get the
    // visibility acknowledged — and refused to complete: the row parks in the
    // retry path instead of publishing with the wrong visibility.
    await waitFor(() =>
      expect(result.current.entries.find((entry) => entry.localId === localId)?.status).toBe(
        'retry_wait',
      ),
    );
    expect(order).not.toContain('complete');
    expect(patchBodies.length).toBeGreaterThanOrEqual(1);

    // The server comes back: the flush lands, the retry resumes at completion
    // (the parts are all uploaded), and completion now goes through.
    patchShouldFail = false;
    await act(async () => {
      await result.current.flushMetadata(localId);
    });
    expect(patchBodies[patchBodies.length - 1]).toEqual({ isPublic: true });
    await act(async () => {
      await result.current.retryEntry(localId);
    });
    await waitFor(() => expect(order).toContain('complete'));
    expect(completions).toHaveLength(1);
  }, 10_000);
});

describe('useUploadQueue cancel racing session creation', () => {
  // The create request cannot be aborted mid-flight. Cancelling before it
  // answers used to leak an invisible multipart session on the server; the
  // update callback now aborts the session the moment its uploadId arrives.
  it('aborts the late-created server session after the row was cancelled', async () => {
    const abort = jest.fn().mockResolvedValue(undefined);
    const { api, releaseCreate } = harness({ abort });
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: createMemoryResumeStore(), notify: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });
    // The transfer is active, its `create` still on the wire (gated).
    await waitFor(() =>
      expect(result.current.entries.find((entry) => entry.localId === localId)?.status).toBe(
        'reserving',
      ),
    );

    // Cancel while there is no uploadId yet: the row disappears locally, and
    // nothing can be aborted server-side — yet.
    await act(async () => {
      await result.current.abortEntry(localId);
    });
    expect(result.current.entries).toHaveLength(0);
    expect(abort).not.toHaveBeenCalled();

    // The create response finally lands and delivers the uploadId: the hook
    // honours the cancel there, so no orphan session survives.
    releaseCreate();
    await waitFor(() => expect(abort).toHaveBeenCalledWith('upload-1'));
  });

  // The other outcome of the race: the create itself fails. There is no
  // session to abort, and the cancel marker must not outlive the transfer.
  // Observable from outside only as "nothing is aborted and nothing blows up";
  // the marker's removal is what keeps that true for the rest of the session.
  it('fires no late abort when the cancelled create rejects instead', async () => {
    const abort = jest.fn().mockResolvedValue(undefined);
    let releaseFailingCreate = () => {};
    const gate = new Promise<void>((resolve) => {
      releaseFailingCreate = resolve;
    });
    const create = jest.fn().mockImplementation(async () => {
      await gate;
      throw new UploadApiError('boom', 500, 'INTERNAL_ERROR', null);
    });
    const { api } = harness({ abort, create });
    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: createMemoryResumeStore(), notify: jest.fn() }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    let localId = '';
    await act(async () => {
      const enqueued = await result.current.enqueueFiles([videoFile()], 7);
      localId = enqueued.accepted[0].localId;
    });
    await waitFor(() =>
      expect(result.current.entries.find((entry) => entry.localId === localId)?.status).toBe(
        'reserving',
      ),
    );

    await act(async () => {
      await result.current.abortEntry(localId);
    });
    expect(result.current.entries).toHaveLength(0);

    releaseFailingCreate();
    await waitFor(() => expect(create).toHaveBeenCalledTimes(1));
    // Let the rejection propagate through the transfer's catch/finally.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });

    expect(abort).not.toHaveBeenCalled();
    // The row stays gone: the failure of a cancelled transfer is not a
    // failure the creator is shown.
    expect(result.current.entries).toHaveLength(0);
  });
});

describe('useUploadQueue boot applies a settled row’s unacknowledged edit', () => {
  // The video finished while the post-completion PUT kept failing, then the
  // page reloaded. The settled row used to be forgotten on boot — and the edit
  // with it. For a visibility change that left Public a video the creator had
  // made Private.
  it('applies the pending patch to the video, then forgets the row', async () => {
    const applyVideoUpdate = jest.fn().mockResolvedValue(undefined);
    const { api } = harness();
    const store = await seededStore(
      persistedRow({
        status: 'ready',
        videoStatus: 'processed',
        pendingPatch: { isPublic: false, title: 'Final' },
      }),
    );
    const fetchVideoProgress = jest.fn().mockResolvedValue({ success: true, data: {} });

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), applyVideoUpdate, fetchVideoProgress }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(applyVideoUpdate).toHaveBeenCalledTimes(1);
    expect(applyVideoUpdate).toHaveBeenCalledWith(99, {
      title: 'Final',
      description: undefined,
      isPublic: false,
    });
    // Applied, so the row has nothing left to say: forgotten as before.
    expect(result.current.entries).toHaveLength(0);
    await expect(store.list()).resolves.toHaveLength(0);
  });

  it('does not send isPublic when the settled row’s patch has none', async () => {
    const applyVideoUpdate = jest.fn().mockResolvedValue(undefined);
    const { api } = harness();
    const store = await seededStore(
      persistedRow({ status: 'ready', videoStatus: 'processed', pendingPatch: { title: 'Final' } }),
    );

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), applyVideoUpdate }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(applyVideoUpdate).toHaveBeenCalledWith(99, { title: 'Final', description: undefined });
    expect(applyVideoUpdate.mock.calls[0][1]).not.toHaveProperty('isPublic');
  });

  it('keeps the record, hydrated with its patch re-seeded, when the apply fails', async () => {
    const applyVideoUpdate = jest.fn().mockRejectedValue(new Error('offline'));
    const { api } = harness();
    const store = await seededStore(
      persistedRow({ status: 'ready', videoStatus: 'processed', pendingPatch: { isPublic: false } }),
    );
    const remove = jest.spyOn(store, 'remove');
    const fetchVideoProgress = jest.fn().mockResolvedValue({ success: true, data: {} });

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), applyVideoUpdate, fetchVideoProgress }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    // The boot attempt itself.
    expect(applyVideoUpdate.mock.calls[0]).toEqual([
      99,
      { title: undefined, description: undefined, isPublic: false },
    ]);
    // Not forgotten: the next boot gets another go at it.
    expect(remove).not.toHaveBeenCalled();
    await expect(store.list()).resolves.toHaveLength(1);
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]).toMatchObject({ localId: 'row-1', videoId: 99 });

    // The patch is live in memory too: the hydration re-send (no keystroke
    // this session) goes out with the very same fields…
    await waitFor(() => expect(applyVideoUpdate.mock.calls.length).toBeGreaterThanOrEqual(2));
    expect(applyVideoUpdate).toHaveBeenLastCalledWith(99, {
      title: undefined,
      description: undefined,
      isPublic: false,
    });

    // …and so does an explicit Save once the server is back.
    applyVideoUpdate.mockResolvedValue(undefined);
    const before = applyVideoUpdate.mock.calls.length;
    await act(async () => {
      await result.current.flushMetadata('row-1');
    });
    expect(applyVideoUpdate.mock.calls.length).toBe(before + 1);
    expect(applyVideoUpdate).toHaveBeenLastCalledWith(99, {
      title: undefined,
      description: undefined,
      isPublic: false,
    });
    // Acknowledged now: the durable marker goes.
    await waitFor(async () => {
      const [record] = await store.list();
      expect(record?.pendingPatch).toBeNull();
    });
  });

  it('forgets a settled row with no pending patch without touching the video', async () => {
    const applyVideoUpdate = jest.fn().mockResolvedValue(undefined);
    const { api } = harness();
    const store = await seededStore(persistedRow({ status: 'ready', videoStatus: 'processed' }));

    const { result } = renderHook(() =>
      useUploadQueue({ api, resumeStore: store, notify: jest.fn(), applyVideoUpdate }),
    );
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    expect(applyVideoUpdate).not.toHaveBeenCalled();
    expect(result.current.entries).toHaveLength(0);
  });
});

describe('useUploadQueue post-completion update retries', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  /** A row whose bytes are in and whose video exists, so edits go to PUT. */
  async function rowWithVideo(applyVideoUpdate: jest.Mock) {
    const { api, order, releaseCreate } = harness();
    const { result } = renderHook(() =>
      useUploadQueue({
        api,
        resumeStore: createMemoryResumeStore(),
        notify: jest.fn(),
        applyVideoUpdate,
        // Keep the poll from ever deciding the video vanished.
        fetchVideoProgress: jest.fn().mockResolvedValue(progressResponse(42, 'processing')),
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
    return { result, localId };
  }

  // "We will keep trying" used to be a promise nothing kept: a failed PUT sat
  // until a keystroke or Save that might never come.
  it('retries at 5 s, 15 s and 45 s, then stops', async () => {
    const applyVideoUpdate = jest.fn().mockRejectedValue(new Error('offline'));
    const { result, localId } = await rowWithVideo(applyVideoUpdate);

    act(() => {
      result.current.updateMetadata(localId, { title: 'Renamed' });
    });
    await act(async () => {
      await result.current.flushMetadata(localId);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(1);

    // Nothing before the first backoff elapses.
    await act(async () => {
      jest.advanceTimersByTime(4_900);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(100);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(2);

    await act(async () => {
      jest.advanceTimersByTime(15_000);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(3);

    await act(async () => {
      jest.advanceTimersByTime(45_000);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(4);
    // Every retry carried the same edit.
    for (const call of applyVideoUpdate.mock.calls) {
      expect(call).toEqual([42, { title: 'Renamed', description: undefined }]);
    }

    // Bounded: after the third retry no more timers are armed.
    await act(async () => {
      jest.advanceTimersByTime(10 * 60_000);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(4);

    // The edit itself is still pending, so an explicit Save sends it again.
    applyVideoUpdate.mockResolvedValue(undefined);
    await act(async () => {
      await result.current.flushMetadata(localId);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(5);
  });

  it('stops retrying once an attempt lands, and starts the ladder afresh for the next failure', async () => {
    const applyVideoUpdate = jest
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(undefined);
    const { result, localId } = await rowWithVideo(applyVideoUpdate);

    act(() => {
      result.current.updateMetadata(localId, { title: 'First' });
    });
    await act(async () => {
      await result.current.flushMetadata(localId);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(1);

    // The 5 s retry succeeds…
    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(2);

    // …so the 15 s and 45 s rungs never fire.
    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(2);

    // Success cleared the counter: a later failure gets the full ladder again,
    // starting at 5 s rather than continuing where the last one left off.
    applyVideoUpdate.mockRejectedValue(new Error('offline again'));
    act(() => {
      result.current.updateMetadata(localId, { title: 'Second' });
    });
    await act(async () => {
      await result.current.flushMetadata(localId);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(3);
    await act(async () => {
      jest.advanceTimersByTime(5_000);
    });
    expect(applyVideoUpdate).toHaveBeenCalledTimes(4);
    expect(applyVideoUpdate).toHaveBeenLastCalledWith(42, { title: 'Second', description: undefined });
  });
});
