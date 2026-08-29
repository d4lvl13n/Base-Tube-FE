import { ViewTrackingSession } from '../viewTracking/session';
import { DEFAULT_VIEW_TRACKING_CONFIG } from '../endpoints/engagement';

const STATUS_INTERVAL_MS = 500;

const makeApi = () => ({
  recordViewResult: jest.fn().mockResolvedValue({ viewId: 'view-1', retryable: false }),
  updateView: jest.fn().mockResolvedValue(undefined),
});

const makeSession = (api = makeApi(), overrides = {}) =>
  new ViewTrackingSession({
    videoId: '42',
    api,
    statusIntervalMs: STATUS_INTERVAL_MS,
    ...overrides,
  });

/** Feed status callbacks at the player's real cadence. */
const play = (
  session: ViewTrackingSession,
  fromMs: number,
  toMs: number,
  stepMs = STATUS_INTERVAL_MS
) => {
  for (let t = fromMs + stepMs; t <= toMs; t += stepMs) {
    session.observe({ positionMs: t, isPlaying: true, durationMs: 600_000 });
  }
};

const flushPromises = () => new Promise<void>((resolve) => setImmediate(resolve));

describe('played time is what was actually played', () => {
  it('accumulates deltas while playing', () => {
    const session = makeSession();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 10_000);

    expect(session.playedSeconds).toBeCloseTo(10, 1);
  });

  it('DROPS a forward seek rather than crediting it', () => {
    const session = makeSession();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 5_000);
    const before = session.playedMs;

    // Scrub 9 minutes forward in one callback.
    session.observe({ positionMs: 545_000, isPlaying: true, durationMs: 600_000 });

    // Capping at the max tick would have quietly added 1.5 s of "watch time".
    expect(session.playedMs).toBe(before);
  });

  it('drops a whole scrub, not just the first jump of it', () => {
    const session = makeSession();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 2_000);
    const before = session.playedMs;

    // Dragging the scrubber emits a run of large jumps.
    for (const positionMs of [60_000, 120_000, 240_000, 480_000, 30_000, 90_000]) {
      session.observe({ positionMs, isPlaying: true, durationMs: 600_000 });
    }

    expect(session.playedMs).toBe(before);
  });

  it('ignores rewinds but counts the re-watch', () => {
    const session = makeSession();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 10_000);
    session.observe({ positionMs: 2_000, isPlaying: true, durationMs: 600_000 });
    play(session, 2_000, 5_000);

    // 10 s watched + 3 s re-watched.
    expect(session.playedSeconds).toBeCloseTo(13, 1);
  });

  it('counts nothing while paused', () => {
    const session = makeSession();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 5_000);
    const atPause = session.playedMs;

    for (let t = 5_500; t <= 60_000; t += STATUS_INTERVAL_MS) {
      session.observe({ positionMs: t, isPlaying: false, durationMs: 600_000 });
    }

    expect(session.playedMs).toBe(atPause);
  });

  it('accepts a 2x tick as playback', () => {
    const session = makeSession();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    // 500 ms of wall time advancing 1000 ms of media.
    session.observe({ positionMs: 1_000, isPlaying: true, durationMs: 600_000 });

    expect(session.playedMs).toBe(1_000);
  });

  it('never reports more than the video is long, however often it is replayed', () => {
    // The backend rejects a watched duration longer than the video, so a
    // viewer looping a short clip must not overflow the wire format.
    const session = makeSession();
    const durationMs = 4_000;

    for (let round = 0; round < 5; round += 1) {
      session.observe({ positionMs: 0, isPlaying: true, durationMs });
      for (let t = STATUS_INTERVAL_MS; t <= durationMs; t += STATUS_INTERVAL_MS) {
        session.observe({ positionMs: t, isPlaying: true, durationMs });
      }
    }

    expect(session.playedMs).toBeLessThanOrEqual(durationMs);
  });
});

describe('view creation uses the server threshold', () => {
  it('opens the row once the configured seconds threshold is crossed', async () => {
    const api = makeApi();
    const session = makeSession(api);

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 20_000);
    expect(api.recordViewResult).not.toHaveBeenCalled();

    play(session, 20_000, 31_000);
    await flushPromises();

    expect(api.recordViewResult).toHaveBeenCalledTimes(1);
    expect(api.recordViewResult.mock.calls[0][0]).toBe('42');
    expect(api.recordViewResult.mock.calls[0][1]).toBeGreaterThanOrEqual(30);
    expect(session.viewId).toBe('view-1');
  });

  it('follows a server config that differs from the defaults', async () => {
    const api = makeApi();
    const session = makeSession(api);
    session.setConfig({ thresholds: { percentage: 90, seconds: 5 }, updateInterval: 10_000 });

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 6_000);
    await flushPromises();

    // The default would still be waiting for 30 s.
    expect(api.recordViewResult).toHaveBeenCalledTimes(1);
    expect(session.heartbeatMs).toBe(10_000);
  });

  it('uses the percentage rule for a short video', async () => {
    const api = makeApi();
    const session = makeSession(api);
    const durationMs = 20_000;

    session.observe({ positionMs: 0, isPlaying: true, durationMs });
    for (let t = 500; t <= 7_000; t += STATUS_INTERVAL_MS) {
      session.observe({ positionMs: t, isPlaying: true, durationMs });
    }
    await flushPromises();

    // 7 s of a 20 s clip is 35 %, past the 30 % threshold.
    expect(api.recordViewResult).toHaveBeenCalledTimes(1);
  });
});

describe('a failed creation does not silence the session', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('retries a transient failure with backoff and recovers', async () => {
    const api = makeApi();
    api.recordViewResult
      .mockResolvedValueOnce({ viewId: null, retryable: true })
      .mockResolvedValueOnce({ viewId: null, retryable: true })
      .mockResolvedValueOnce({ viewId: 'view-9', retryable: false });
    const session = makeSession(api, { retryDelaysMs: [1_000, 2_000] });

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await Promise.resolve();
    expect(api.recordViewResult).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1_000);
    await Promise.resolve();
    await Promise.resolve();
    expect(api.recordViewResult).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(2_000);
    await Promise.resolve();
    await Promise.resolve();
    expect(api.recordViewResult).toHaveBeenCalledTimes(3);
    expect(session.viewId).toBe('view-9');
  });

  it('does not retry a verdict — a rejected view stays rejected', async () => {
    const api = makeApi();
    api.recordViewResult.mockResolvedValue({ viewId: null, retryable: false });
    const session = makeSession(api, { retryDelaysMs: [1_000] });

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await Promise.resolve();

    jest.advanceTimersByTime(60_000);
    await Promise.resolve();

    expect(api.recordViewResult).toHaveBeenCalledTimes(1);
  });

  it('re-attempts from later playback rather than latching a one-shot flag', async () => {
    const api = makeApi();
    api.recordViewResult
      .mockResolvedValueOnce({ viewId: null, retryable: false })
      .mockResolvedValue({ viewId: 'view-2', retryable: false });
    // No timer retries: the next status tick is what tries again.
    const session = makeSession(api, { retryDelaysMs: [999_999] });

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await Promise.resolve();
    expect(session.viewId).toBeNull();

    play(session, 31_000, 33_000);
    await Promise.resolve();

    expect(api.recordViewResult).toHaveBeenCalledTimes(2);
    expect(session.viewId).toBe('view-2');
  });

  it('never opens two rows for one session', async () => {
    const api = makeApi();
    const session = makeSession(api);

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 60_000);
    await Promise.resolve();
    await Promise.resolve();
    play(session, 60_000, 90_000);
    await Promise.resolve();

    expect(api.recordViewResult).toHaveBeenCalledTimes(1);
  });
});

describe('flushing', () => {
  const openSession = async (api = makeApi()) => {
    const session = makeSession(api);
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await flushPromises();
    api.updateView.mockClear();
    return { session, api };
  };

  it('sends the played time', async () => {
    const { session, api } = await openSession();
    play(session, 31_000, 61_000);

    await session.flush();

    expect(api.updateView).toHaveBeenCalledTimes(1);
    expect(api.updateView.mock.calls[0][2]).toBeCloseTo(61, 0);
  });

  it('skips a value the server already has', async () => {
    const { session, api } = await openSession();

    await session.flush();

    expect(api.updateView).not.toHaveBeenCalled();
  });

  it('flushes on pause', async () => {
    const { session, api } = await openSession();
    play(session, 31_000, 45_000);

    session.observe({ positionMs: 45_000, isPlaying: false, durationMs: 600_000 });
    await flushPromises();

    expect(api.updateView).toHaveBeenCalledTimes(1);
    expect(api.updateView.mock.calls[0][2]).toBeCloseTo(45, 0);
  });

  it('flushes when playback finishes', async () => {
    const { session, api } = await openSession();
    play(session, 31_000, 60_000);

    session.observe({
      positionMs: 60_000,
      isPlaying: false,
      durationMs: 600_000,
      didJustFinish: true,
    });
    await flushPromises();

    expect(api.updateView).toHaveBeenCalled();
  });

  it('flushes on dispose — the app going to the background, or unmounting', async () => {
    const { session, api } = await openSession();
    play(session, 31_000, 50_000);

    await session.dispose();

    expect(api.updateView).toHaveBeenCalledTimes(1);
    expect(api.updateView.mock.calls[0][2]).toBeCloseTo(50, 0);
  });

  it('does nothing after dispose', async () => {
    const { session, api } = await openSession();
    await session.dispose();
    api.updateView.mockClear();

    play(session, 31_000, 90_000);
    await flushPromises();

    expect(api.updateView).not.toHaveBeenCalled();
  });

  it('does not overlap itself', async () => {
    const api = makeApi();
    let release: () => void = () => {};
    api.updateView.mockImplementation(
      () => new Promise<void>((resolve) => {
        release = () => resolve();
      })
    );
    const session = makeSession(api);
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await flushPromises();
    api.updateView.mockClear();

    play(session, 31_000, 60_000);
    const first = session.flush();
    await Promise.resolve();
    play(session, 60_000, 90_000);
    await session.flush();

    expect(api.updateView).toHaveBeenCalledTimes(1);
    release();
    await first;
  });
});

describe('switching video starts a clean session', () => {
  it('drops the played time, the view id and any pending retry', async () => {
    const api = makeApi();
    const session = makeSession(api);
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await flushPromises();
    expect(session.viewId).toBe('view-1');

    session.setVideoId('99');

    expect(session.playedMs).toBe(0);
    expect(session.viewId).toBeNull();

    api.recordViewResult.mockClear();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await flushPromises();

    expect(api.recordViewResult).toHaveBeenCalledTimes(1);
    expect(api.recordViewResult.mock.calls[0][0]).toBe('99');
  });

  it('does not let an in-flight creation land on the new video', async () => {
    const api = makeApi();
    let resolveCreate: (v: { viewId: string; retryable: boolean }) => void = () => {};
    api.recordViewResult.mockImplementation(
      () => new Promise((resolve) => {
        resolveCreate = resolve;
      })
    );
    const session = makeSession(api);

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await Promise.resolve();

    session.setVideoId('99');
    resolveCreate({ viewId: 'stale-view', retryable: false });
    await flushPromises();

    expect(session.viewId).toBeNull();
  });

  it('is a no-op when the id has not actually changed', async () => {
    const api = makeApi();
    const session = makeSession(api);
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await flushPromises();

    session.setVideoId('42');

    expect(session.viewId).toBe('view-1');
    expect(session.playedMs).toBeGreaterThan(0);
  });
});

describe('defaults', () => {
  it('exposes the documented view rules', () => {
    expect(DEFAULT_VIEW_TRACKING_CONFIG).toEqual({
      thresholds: { percentage: 30, seconds: 30 },
      updateInterval: 30_000,
    });
  });

  it('starts on those defaults when no config is supplied', () => {
    expect(makeSession().heartbeatMs).toBe(30_000);
  });
});
