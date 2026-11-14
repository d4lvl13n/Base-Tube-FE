import {
  AUTH_FAILURE_LIMIT,
  PassWatchTracker,
  RATE_LIMIT_BACKOFF_MS,
  type PassWatchEndBody,
  type PassWatchProgressBody,
  type PassWatchStartBody,
  type PassWatchStartResult,
  type PassWatchTransport,
} from '../passWatchTracker';

const PASS_VIDEO_ID = '3f2b8c1e-0d4a-4b6f-9a21-7c5e8d9f0a1b';

let clock = 0;
let hidden = false;

const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { response: { status } });

/** A fake transport: records every call; each answer can be scripted. */
class FakeTransport implements PassWatchTransport {
  starts: Array<{ id: string; body: PassWatchStartBody }> = [];
  progresses: Array<{ id: string; body: PassWatchProgressBody }> = [];
  beacons: Array<{ id: string; body: PassWatchEndBody }> = [];
  startAnswers: Array<Error | Partial<PassWatchStartResult>> = [];
  progressAnswers: Error[] = [];
  beaconQueued = true;
  private sessions = 0;

  start = (id: string, body: PassWatchStartBody): Promise<PassWatchStartResult> => {
    this.starts.push({ id, body });
    const next = this.startAnswers.shift();
    if (next instanceof Error) return Promise.reject(next);
    this.sessions += 1;
    return Promise.resolve({
      sessionId: `session-${this.sessions}`,
      viewerRole: 'buyer',
      heartbeatIntervalSeconds: 15,
      sessionExpiresInSeconds: 21600,
      ...next,
    } as PassWatchStartResult);
  };

  progress = (id: string, body: PassWatchProgressBody): Promise<unknown> => {
    this.progresses.push({ id, body });
    const next = this.progressAnswers.shift();
    return next ? Promise.reject(next) : Promise.resolve({ success: true });
  };

  endBeacon = (id: string, body: PassWatchEndBody): boolean => {
    this.beacons.push({ id, body });
    return this.beaconQueued;
  };
}

let transport: FakeTransport;

const make = () =>
  new PassWatchTracker({
    passVideoId: PASS_VIDEO_ID,
    player: 'html5',
    transport,
    now: () => clock,
    isHidden: () => hidden,
  });

/** Let pending promise chains (fake transport answers) settle. */
const settle = async () => {
  for (let i = 0; i < 10; i += 1) await Promise.resolve();
};

/**
 * Playback at 1x: the playhead and the wall clock advance together. The first
 * tick at `from` only anchors (a tick with no predecessor is never credited).
 */
const play = (tracker: PassWatchTracker, from: number, to: number, step = 0.25) => {
  tracker.tick(from);
  for (let t = from + step; t <= to + 1e-9; t += step) {
    clock += step * 1000;
    tracker.tick(Number(t.toFixed(3)));
  }
};

/** Start playing and wait for the server session. */
const startPlaying = async (tracker: PassWatchTracker) => {
  tracker.play();
  await settle();
};

beforeEach(() => {
  jest.useFakeTimers();
  clock = Date.UTC(2026, 10, 12, 12, 0, 0);
  hidden = false;
  transport = new FakeTransport();
});

afterEach(() => {
  jest.clearAllTimers();
  jest.useRealTimers();
});

describe('PassWatchTracker — measurement', () => {
  it('counts time played, not where the playhead was dragged', () => {
    const tracker = make();
    tracker.setDuration(600);
    tracker.play();
    play(tracker, 0, 5);
    clock += 250;
    tracker.tick(590, true); // a known scrub
    play(tracker, 590, 595);
    expect(tracker.getSecondsWatched()).toBeCloseTo(10, 0);
  });

  it('drops an unannounced jump (YouTube gives no seek event) but accepts its 1 s poll', () => {
    const tracker = make();
    tracker.play();
    play(tracker, 0, 30, 1);
    clock += 1000;
    tracker.tick(300);
    expect(tracker.getSecondsWatched()).toBeCloseTo(30, 0);
  });

  it('does not credit time while the tab is hidden, nor while paused', () => {
    const tracker = make();
    tracker.play();
    play(tracker, 0, 5);
    hidden = true;
    play(tracker, 5, 65);
    hidden = false;
    tracker.pause();
    play(tracker, 65, 80);
    tracker.play();
    play(tracker, 80, 85);
    expect(tracker.getSecondsWatched()).toBeCloseTo(10, 0);
  });

  it('caps the played time at the duration', () => {
    const tracker = make();
    tracker.setDuration(10);
    tracker.play();
    play(tracker, 0, 10);
    clock += 250;
    tracker.tick(0, true);
    play(tracker, 0, 10);
    expect(tracker.getSecondsWatched()).toBe(10);
  });
});

describe('PassWatchTracker — server contract', () => {
  it('opens one session on the first real play, with the pass video id, playhead and duration', async () => {
    const tracker = make();
    tracker.setDuration(600.4);
    expect(transport.starts).toHaveLength(0);
    await startPlaying(tracker);
    tracker.pause();
    await settle();
    tracker.play();
    await settle();
    expect(transport.starts).toEqual([{ id: PASS_VIDEO_ID, body: { positionSeconds: 0, durationSeconds: 600 } }]);
  });

  it('sends the cumulative seconds actually played across pause / seek, not the playhead', async () => {
    const tracker = make();
    tracker.setDuration(600);
    await startPlaying(tracker);
    play(tracker, 0, 10);
    tracker.pause();
    await settle();
    tracker.play();
    clock += 250;
    tracker.tick(400, true); // seek far ahead
    play(tracker, 400, 405);
    tracker.pause();
    await settle();
    expect(transport.progresses.map((p) => p.body)).toEqual([
      { sessionId: 'session-1', playedSeconds: 10, positionSeconds: 10 },
      { sessionId: 'session-1', playedSeconds: 15, positionSeconds: 405 },
    ]);
  });

  it('beats at the interval the server gave, only when something new was played', async () => {
    transport.startAnswers.push({ heartbeatIntervalSeconds: 30 });
    const tracker = make();
    await startPlaying(tracker);
    play(tracker, 0, 14);
    jest.advanceTimersByTime(15_000); // the default 15 s would have beaten here
    await settle();
    expect(transport.progresses).toHaveLength(0);
    play(tracker, 14, 29);
    jest.advanceTimersByTime(15_000); // 30 s after the session opened
    await settle();
    expect(transport.progresses).toHaveLength(1);
    expect(transport.progresses[0].body.playedSeconds).toBe(29);
    jest.advanceTimersByTime(30_000); // nothing new played since
    await settle();
    expect(transport.progresses).toHaveLength(1);
  });

  it('starts a new session after a 404 and sends the unconfirmed seconds to it', async () => {
    const tracker = make();
    await startPlaying(tracker);
    play(tracker, 0, 10);
    tracker.pause(); // confirmed: 10 s on session-1
    await settle();
    tracker.play();
    play(tracker, 10, 25);
    transport.progressAnswers.push(httpError(404));
    tracker.pause();
    await settle();
    expect(transport.starts).toHaveLength(2);
    expect(transport.progresses.map((p) => p.body)).toEqual([
      { sessionId: 'session-1', playedSeconds: 10, positionSeconds: 10 },
      { sessionId: 'session-1', playedSeconds: 25, positionSeconds: 25 },
      // The new session only gets what session-1 never confirmed.
      { sessionId: 'session-2', playedSeconds: 15, positionSeconds: 25 },
    ]);
    // And it keeps counting from there.
    tracker.play();
    play(tracker, 25, 30);
    tracker.pause();
    await settle();
    expect(transport.progresses[3].body).toEqual({ sessionId: 'session-2', playedSeconds: 20, positionSeconds: 30 });
  });

  it('replaces a session left idle past its lifetime', async () => {
    transport.startAnswers.push({ sessionExpiresInSeconds: 600 });
    const tracker = make();
    await startPlaying(tracker);
    play(tracker, 0, 5);
    tracker.pause();
    await settle();
    clock += 20 * 60_000; // 20 min paused: the server forgot the session
    tracker.play();
    play(tracker, 5, 8);
    tracker.pause();
    await settle();
    expect(transport.starts).toHaveLength(2);
    expect(transport.progresses[1].body).toEqual({ sessionId: 'session-2', playedSeconds: 3, positionSeconds: 8 });
  });

  it('sends the end beacon exactly once, with the session-relative seconds', async () => {
    const tracker = make();
    await startPlaying(tracker);
    play(tracker, 0, 7);
    tracker.end('ended');
    tracker.end('closed');
    tracker.end('unload');
    tracker.pause();
    await settle();
    expect(transport.beacons).toEqual([
      { id: PASS_VIDEO_ID, body: { sessionId: 'session-1', playedSeconds: 7, positionSeconds: 7 } },
    ]);
    expect(transport.progresses).toHaveLength(0);
    expect(tracker.isEnded()).toBe(true);
  });

  it('sends the end once the start answers when the player closed while it was in flight', async () => {
    const tracker = make();
    tracker.play();
    play(tracker, 0, 2);
    tracker.end('closed'); // start not answered yet
    expect(transport.beacons).toHaveLength(0);
    await settle();
    expect(transport.beacons).toHaveLength(1);
    expect(transport.beacons[0].body.sessionId).toBe('session-1');
  });

  it('closes with an authenticated ended progress when the browser refuses the beacon', async () => {
    transport.beaconQueued = false;
    const tracker = make();
    await startPlaying(tracker);
    play(tracker, 0, 4);
    tracker.end('unload');
    await settle();
    expect(transport.progresses.map((p) => p.body)).toEqual([
      { sessionId: 'session-1', playedSeconds: 4, positionSeconds: 4, ended: true },
    ]);
  });

  it('sends nothing at all for a video that never played', () => {
    const tracker = make();
    tracker.end('closed');
    expect(transport.starts).toHaveLength(0);
    expect(transport.beacons).toHaveLength(0);
  });

  it(`stops sending after ${AUTH_FAILURE_LIMIT} consecutive 401 / 403 answers`, async () => {
    const tracker = make();
    await startPlaying(tracker);
    play(tracker, 0, 5);
    transport.progressAnswers.push(httpError(401), httpError(403));
    tracker.pause();
    await settle();
    expect(tracker.isDisabled()).toBe(false);
    tracker.play();
    play(tracker, 5, 10);
    tracker.pause();
    await settle();
    expect(tracker.isDisabled()).toBe(true);

    const calls = transport.progresses.length;
    tracker.play();
    play(tracker, 10, 40);
    jest.advanceTimersByTime(60_000);
    tracker.pause();
    tracker.end('closed');
    await settle();
    expect(transport.progresses).toHaveLength(calls);
    expect(transport.beacons).toHaveLength(0);
    expect(transport.starts).toHaveLength(1);
  });

  it('stops for good when the start says the pass video does not exist (404)', async () => {
    transport.startAnswers.push(httpError(404));
    const tracker = make();
    await startPlaying(tracker);
    play(tracker, 0, 20);
    jest.advanceTimersByTime(60_000);
    tracker.pause();
    await settle();
    expect(transport.starts).toHaveLength(1);
    expect(tracker.isDisabled()).toBe(true);
  });

  it('backs off after a 429 instead of hammering the server', async () => {
    const tracker = make();
    await startPlaying(tracker);
    play(tracker, 0, 5);
    transport.progressAnswers.push(httpError(429));
    tracker.pause();
    await settle();
    expect(transport.progresses).toHaveLength(1);

    tracker.play();
    play(tracker, 5, 10);
    tracker.pause(); // inside the back-off: nothing sent
    await settle();
    expect(transport.progresses).toHaveLength(1);

    clock += RATE_LIMIT_BACKOFF_MS;
    tracker.flush();
    await settle();
    expect(transport.progresses).toHaveLength(2);
    expect(transport.progresses[1].body.playedSeconds).toBe(10);
  });

  it('retries a failed start later and never throws into the player', async () => {
    transport.startAnswers.push(new Error('offline'));
    const tracker = make();
    expect(() => tracker.play()).not.toThrow();
    await settle();
    expect(transport.starts).toHaveLength(1);
    play(tracker, 0, 20);
    clock += 15_000; // past the first back-off
    jest.advanceTimersByTime(15_000);
    await settle();
    expect(transport.starts).toHaveLength(2);
    expect(transport.progresses).toHaveLength(1);
    expect(transport.progresses[0].body.sessionId).toBe('session-1');
  });
});
