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

describe('a failed creation does not silence the session — or flood the server', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  /** Playback continues at the real callback cadence while time passes. */
  const playFor = async (session: ViewTrackingSession, ms: number, fromMs: number) => {
    let position = fromMs;
    for (let elapsed = 0; elapsed < ms; elapsed += STATUS_INTERVAL_MS) {
      jest.advanceTimersByTime(STATUS_INTERVAL_MS);
      position += STATUS_INTERVAL_MS;
      session.observe({ positionMs: position, isPlaying: true, durationMs: 600_000 });
      // Let any promise the tick started settle, the way a real event loop does.
      await Promise.resolve();
      await Promise.resolve();
    }
  };

  it('does not let status callbacks bypass the backoff', async () => {
    const api = makeApi();
    api.recordViewResult.mockResolvedValue({ viewId: null, retryable: true });
    const session = makeSession(api, { retryDelaysMs: [2_000] });

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await Promise.resolve();
    expect(api.recordViewResult).toHaveBeenCalledTimes(1);

    // Ten seconds of ordinary playback = 20 status callbacks, every one of
    // which used to cancel the pending timer and POST immediately (~2/s, which
    // hits the interaction limiter in about 15 seconds).
    await playFor(session, 10_000, 31_000);

    // 10 s at a 2 s backoff is five attempts, not twenty-one.
    expect(api.recordViewResult.mock.calls.length).toBeLessThanOrEqual(6);
    expect(api.recordViewResult.mock.calls.length).toBeGreaterThan(1);
  });

  it('retries with backoff and recovers', async () => {
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

    jest.advanceTimersByTime(999);
    await Promise.resolve();
    expect(api.recordViewResult).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1);
    await Promise.resolve();
    await Promise.resolve();
    expect(api.recordViewResult).toHaveBeenCalledTimes(2);

    jest.advanceTimersByTime(2_000);
    await Promise.resolve();
    await Promise.resolve();
    expect(api.recordViewResult).toHaveBeenCalledTimes(3);
    expect(session.viewId).toBe('view-9');
  });

  it('waits as long as the server asked when it sent Retry-After', async () => {
    const api = makeApi();
    api.recordViewResult.mockResolvedValue({
      viewId: null,
      retryable: true,
      retryAfterMs: 10_000,
    });
    const session = makeSession(api, { retryDelaysMs: [1_000] });

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await Promise.resolve();
    expect(api.recordViewResult).toHaveBeenCalledTimes(1);

    // Our own backoff would have fired nine seconds ago; the server's wins.
    await playFor(session, 9_000, 31_000);
    expect(api.recordViewResult).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(1_100);
    await Promise.resolve();
    await Promise.resolve();
    expect(api.recordViewResult).toHaveBeenCalledTimes(2);
  });

  it('never waits less than its own backoff, whatever Retry-After says', async () => {
    const api = makeApi();
    api.recordViewResult.mockResolvedValue({
      viewId: null,
      retryable: true,
      retryAfterMs: 1,
    });
    const session = makeSession(api, { retryDelaysMs: [5_000] });

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await Promise.resolve();

    await playFor(session, 4_000, 31_000);
    expect(api.recordViewResult).toHaveBeenCalledTimes(1);
  });

  it('stops asking once the backend has given a verdict', async () => {
    const api = makeApi();
    api.recordViewResult.mockResolvedValue({ viewId: null, retryable: false });
    const session = makeSession(api, { retryDelaysMs: [1_000] });

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await Promise.resolve();
    expect(api.recordViewResult).toHaveBeenCalledTimes(1);

    // Neither timers nor continued playback may reopen it: the view was
    // refused on its merits and the same request cannot fare better.
    jest.advanceTimersByTime(120_000);
    await Promise.resolve();
    await playFor(session, 10_000, 31_000);

    expect(api.recordViewResult).toHaveBeenCalledTimes(1);
  });

  it('treats an api that throws as a transient failure rather than spinning', async () => {
    const api = makeApi();
    api.recordViewResult.mockRejectedValue(new Error('boom'));
    const session = makeSession(api, { retryDelaysMs: [2_000] });

    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });
    play(session, 0, 31_000);
    await Promise.resolve();
    await Promise.resolve();

    await playFor(session, 6_000, 31_000);

    expect(api.recordViewResult.mock.calls.length).toBeLessThanOrEqual(4);
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

describe('a late callback is not a seek', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('credits media time that a slow main thread delivered in one lump', () => {
    const session = makeSession();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });

    // The JS thread was blocked for three seconds; at 2x that is six seconds of
    // media, delivered as a single callback. Judged against the NOMINAL 500 ms
    // interval this looked like a seek and an honest session recorded nothing.
    jest.advanceTimersByTime(3_000);
    session.observe({ positionMs: 6_000, isPlaying: true, durationMs: 600_000 });

    expect(session.playedMs).toBe(6_000);
  });

  it('still drops a real seek, however late the callback', () => {
    const session = makeSession();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });

    // Half a second of wall time cannot produce nine minutes of media.
    jest.advanceTimersByTime(500);
    session.observe({ positionMs: 540_000, isPlaying: true, durationMs: 600_000 });

    expect(session.playedMs).toBe(0);
  });

  it('drops a seek that happens during a stall', () => {
    const session = makeSession();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });

    // Three seconds of wall time allows at most ~9 s of media; a jump to the
    // ten-minute mark is still a scrub.
    jest.advanceTimersByTime(3_000);
    session.observe({ positionMs: 590_000, isPlaying: true, durationMs: 600_000 });

    expect(session.playedMs).toBe(0);
  });

  it('accepts the wall-clock bound exactly at its edge', () => {
    const session = makeSession();
    session.observe({ positionMs: 0, isPlaying: true, durationMs: 600_000 });

    // allowance = 2 s wall x 2 (rate) x 1.5 (tolerance) = 6 s.
    jest.advanceTimersByTime(2_000);
    session.observe({ positionMs: 6_000, isPlaying: true, durationMs: 600_000 });
    expect(session.playedMs).toBe(6_000);

    jest.advanceTimersByTime(2_000);
    session.observe({ positionMs: 12_001, isPlaying: true, durationMs: 600_000 });
    expect(session.playedMs).toBe(6_000);
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
