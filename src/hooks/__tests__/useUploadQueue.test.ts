import { act, renderHook, waitFor } from '@testing-library/react';
import {
  createMemoryResumeStore,
  UploadApiError,
  type ActiveUploadSummary,
  type CompleteUploadBody,
  type CreateUploadResult,
  type UploadApi,
  type UploadStateData,
} from '@basetube/api';
import { useUploadQueue } from '../useUploadQueue';

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
  // the Video row is now the thing to edit.
  it('records the videoId and tells the creator when a PATCH loses the race', async () => {
    const notify = jest.fn();
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
      useUploadQueue({ api, resumeStore: createMemoryResumeStore(), notify }),
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
