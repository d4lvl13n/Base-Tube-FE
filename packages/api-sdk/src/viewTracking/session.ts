import type { ViewTrackingConfig } from '../types/engagement';
import { DEFAULT_VIEW_TRACKING_CONFIG } from '../endpoints/engagement';
import type { RecordViewOutcome } from '../endpoints/engagement';

/**
 * The view-tracking state machine, with no framework in it.
 *
 * It lives here rather than inside a React hook because every rule it encodes
 * is a correctness rule, not a rendering one, and all of them were got wrong at
 * least once:
 *
 *   - watch time is TIME ACTUALLY PLAYED, accumulated from position deltas
 *     while playing — not the furthest position reached, which turned a scrub
 *     to the end into a completed view;
 *   - a delta too large to be playback is a seek, a stall, or an app returning
 *     from the background, and is DROPPED. Capping it (the obvious-looking
 *     fix) silently credits the cap's worth of watch time to every scrub, so
 *     dragging through a video manufactures watch time out of nothing;
 *   - "too large" is measured against the WALL CLOCK, not against the nominal
 *     callback interval. Media time cannot outrun wall time by more than the
 *     playback rate, so that is the real bound. Deriving it from the nominal
 *     interval instead meant a callback more than ~750 ms late at 2x looked
 *     like a seek — and under main-thread load a perfectly honest session
 *     recorded nothing at all;
 *   - every in-flight request belongs to a GENERATION. Switching video resets
 *     the session, but a request already in flight cannot be recalled: when it
 *     lands it must not write to, or unlock, the session that replaced it;
 *   - a creation that fails cannot be retried faster than its backoff says.
 *     Every status callback re-entered the open path and cancelled the pending
 *     timer, so a permanent 400 or an outage produced ~2 POSTs a second and hit
 *     the interaction limiter within seconds;
 *   - the view-creation threshold comes from the SERVER's config, not a
 *     hardcoded copy that drifts the day anyone changes it;
 *   - a creation that fails for a transient reason is retried with backoff, and
 *     the threshold is re-checked on every tick rather than latched behind a
 *     one-shot flag. One dropped request must not silence a whole session.
 */

export interface PlaybackTick {
  /** Playhead position, in milliseconds. */
  positionMs: number;
  isPlaying: boolean;
  /** Total media length in ms, when the player knows it yet. */
  durationMs?: number;
  didJustFinish?: boolean;
}

export interface ViewTrackingApi {
  recordViewResult(
    videoId: string | number,
    watchedDuration: number
  ): Promise<RecordViewOutcome>;
  updateView(
    videoId: string | number,
    viewId: string,
    watchedDuration: number
  ): Promise<void>;
}

export interface ViewTrackingSessionOptions {
  videoId: string;
  api: ViewTrackingApi;
  config?: ViewTrackingConfig;
  /** Expected gap between player status callbacks, in ms. */
  statusIntervalMs?: number;
  /** Fastest playback rate the player offers. */
  maxPlaybackRate?: number;
  /** Extra room for a late callback before a delta is treated as a seek. */
  tickTolerance?: number;
  retryDelaysMs?: number[];
  /** Clock, injectable for tests. */
  now?: () => number;
}

const DEFAULT_STATUS_INTERVAL_MS = 500;
const DEFAULT_MAX_PLAYBACK_RATE = 2;
const DEFAULT_TICK_TOLERANCE = 1.5;
const DEFAULT_RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000];
/** Never wait longer than this between creation attempts, whatever the server says. */
const MAX_RETRY_DELAY_MS = 60_000;

export class ViewTrackingSession {
  private readonly api: ViewTrackingApi;
  private readonly retryDelaysMs: number[];
  /** Floor for the tick allowance, from the nominal callback cadence. */
  private readonly minTickMs: number;
  private readonly maxPlaybackRate: number;
  private readonly tickTolerance: number;
  private readonly now: () => number;

  private videoId: string;
  private config: ViewTrackingConfig;

  private playedMsValue = 0;
  private lastPositionMs: number | null = null;
  private durationMs = 0;
  private viewIdValue: string | null = null;
  private lastSentMs = 0;

  private lastTickAtMs: number | null = null;

  /**
   * Bumped by every reset. An in-flight request captures the generation it
   * started in and touches nothing once that generation is over — including
   * the `opening`/`inFlight` guards, which are shared state.
   *
   * A plain `videoId` comparison is not enough: A -> B -> A leaves the id
   * looking unchanged to a request that started in the first A.
   */
  private generation = 0;
  private opening = false;
  private inFlight = false;
  private disposed = false;
  private createAttempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  /** No creation attempt may start before this moment. */
  private nextCreateAttemptAt = 0;
  /** The backend gave a verdict; there is nothing left to ask. */
  private createBlocked = false;

  constructor(options: ViewTrackingSessionOptions) {
    this.api = options.api;
    this.videoId = options.videoId;
    this.config = options.config ?? DEFAULT_VIEW_TRACKING_CONFIG;
    this.retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
    this.now = options.now ?? (() => Date.now());
    this.maxPlaybackRate = options.maxPlaybackRate ?? DEFAULT_MAX_PLAYBACK_RATE;
    this.tickTolerance = options.tickTolerance ?? DEFAULT_TICK_TOLERANCE;
    this.minTickMs =
      (options.statusIntervalMs ?? DEFAULT_STATUS_INTERVAL_MS) *
      this.maxPlaybackRate *
      this.tickTolerance;
  }

  get playedMs(): number {
    return this.playedMsValue;
  }

  get playedSeconds(): number {
    return this.playedMsValue / 1000;
  }

  get viewId(): string | null {
    return this.viewIdValue;
  }

  get heartbeatMs(): number {
    return this.config.updateInterval || DEFAULT_VIEW_TRACKING_CONFIG.updateInterval;
  }

  setConfig(config: ViewTrackingConfig): void {
    this.config = config;
  }

  /** Switching video is a brand new session; nothing carries over. */
  setVideoId(videoId: string): void {
    if (videoId === this.videoId) return;
    this.videoId = videoId;
    this.reset();
  }

  private reset(): void {
    this.generation += 1;
    this.cancelRetry();
    this.playedMsValue = 0;
    this.lastPositionMs = null;
    this.lastTickAtMs = null;
    this.durationMs = 0;
    this.viewIdValue = null;
    this.lastSentMs = 0;
    this.createAttempt = 0;
    this.nextCreateAttemptAt = 0;
    this.createBlocked = false;
    // The guards belong to the generation that is ending: the new one starts
    // unlocked, and the old generation's `finally` will decline to touch these
    // because its captured generation no longer matches.
    this.opening = false;
    this.inFlight = false;
  }

  /**
   * The largest media-time jump that could still be playback.
   *
   * Media time cannot outrun wall time by more than the playback rate, so the
   * measured gap since the previous callback — not the interval the player was
   * ASKED for — is the honest bound. The floor keeps a burst of callbacks
   * arriving microseconds apart from rejecting an ordinary tick.
   */
  private tickAllowanceMs(nowMs: number): number {
    if (this.lastTickAtMs === null) return this.minTickMs;
    const wallElapsed = Math.max(0, nowMs - this.lastTickAtMs);
    return Math.max(this.minTickMs, wallElapsed * this.maxPlaybackRate * this.tickTolerance);
  }

  private cancelRetry(): void {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }
  }

  private hasMetThreshold(): boolean {
    const { percentage, seconds } = this.config.thresholds;
    return (
      (this.durationMs > 0 && (this.playedMsValue / this.durationMs) * 100 >= percentage) ||
      this.playedMsValue / 1000 >= seconds
    );
  }

  /** Feed every player status callback through here. */
  observe(tick: PlaybackTick): void {
    if (this.disposed) return;

    const nowMs = this.now();

    if (typeof tick.durationMs === 'number' && tick.durationMs > 0) {
      this.durationMs = tick.durationMs;
    }

    const previous = this.lastPositionMs;
    const allowance = this.tickAllowanceMs(nowMs);
    this.lastPositionMs = tick.positionMs;
    this.lastTickAtMs = nowMs;

    if (tick.isPlaying && previous !== null) {
      const delta = tick.positionMs - previous;
      // Rewinds are negative; seeks and background catch-up outrun the wall
      // clock. Both are worth nothing, not "worth the cap".
      if (delta > 0 && delta <= allowance) {
        const ceiling = this.durationMs || this.playedMsValue + delta;
        this.playedMsValue = Math.min(this.playedMsValue + delta, ceiling);
      }
    }

    // The backoff gate lives HERE as well as in `openView`: without it every
    // status callback walked straight past a pending retry timer.
    if (this.canAttemptCreate(nowMs) && this.hasMetThreshold()) {
      void this.openView();
    }

    if (!tick.isPlaying && this.viewIdValue) {
      void this.flush();
    }
    if (tick.didJustFinish) {
      void this.flush(true);
    }
  }

  /** True when a creation attempt is allowed to start right now. */
  private canAttemptCreate(nowMs: number): boolean {
    return (
      !this.disposed &&
      !this.viewIdValue &&
      !this.opening &&
      !this.createBlocked &&
      nowMs >= this.nextCreateAttemptAt
    );
  }

  /** Opens the view row, retrying transient failures with backoff. */
  async openView(): Promise<void> {
    if (!this.canAttemptCreate(this.now())) return;

    const videoId = this.videoId;
    const generation = this.generation;
    this.opening = true;
    // NOT cancelling the pending retry here. Cancelling was the bug: a status
    // callback would tear down the timer, fire immediately, and the backoff
    // never applied.
    try {
      const { viewId, retryable, retryAfterMs } = await this.api.recordViewResult(
        videoId,
        this.playedSeconds
      );

      // The session may have moved on while the request was in flight.
      if (this.disposed || this.generation !== generation) return;

      if (viewId) {
        this.viewIdValue = viewId;
        this.lastSentMs = this.playedMsValue;
        this.createAttempt = 0;
        this.nextCreateAttemptAt = 0;
        this.cancelRetry();
        return;
      }

      if (!retryable) {
        // The backend considered this view and refused it. Repeating the same
        // request is pure noise, so the session stops asking entirely.
        this.createBlocked = true;
        this.cancelRetry();
        return;
      }

      this.scheduleRetry(retryAfterMs);
    } catch {
      // `recordViewResult` is contracted not to throw, but a caller-supplied
      // api could. Back off rather than spin.
      if (!this.disposed && this.generation === generation) this.scheduleRetry();
    } finally {
      // ONLY unlock the generation we locked. Clearing it unconditionally let a
      // stale creation for the previous video open the gate while the new
      // video's own creation was still in flight — the next status callback
      // then started a second one, and the viewer got two view rows.
      if (this.generation === generation) this.opening = false;
    }
  }

  /**
   * Arms the next attempt and — just as importantly — closes the gate until it
   * is due, so ticks cannot slip past the backoff.
   */
  private scheduleRetry(retryAfterMs?: number): void {
    const backoff =
      this.retryDelaysMs[Math.min(this.createAttempt, this.retryDelaysMs.length - 1)];
    // Honour the server's own pacing when it gives one, but never wait less
    // than our own backoff, and never wait absurdly long.
    const delay = Math.min(Math.max(backoff, retryAfterMs ?? 0), MAX_RETRY_DELAY_MS);

    this.createAttempt += 1;
    this.nextCreateAttemptAt = this.now() + delay;

    this.cancelRetry();
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      void this.openView();
    }, delay);
  }

  /** Sends the played time so far. `force` reports even an unchanged value. */
  async flush(force = false): Promise<void> {
    const viewId = this.viewIdValue;
    if (!viewId || this.inFlight) return;
    if (this.playedMsValue <= 0) return;
    if (!force && this.playedMsValue <= this.lastSentMs) return;

    const videoId = this.videoId;
    const generation = this.generation;
    this.inFlight = true;
    const snapshot = this.playedMsValue;
    try {
      await this.api.updateView(videoId, viewId, snapshot / 1000);
      // Same generation rule as `openView`: a heartbeat for the previous video
      // must not stamp its watched duration onto the new session's
      // "already sent" mark, which would suppress the new video's heartbeats
      // until it happened to pass the old one.
      if (this.generation === generation) {
        this.lastSentMs = Math.max(this.lastSentMs, snapshot);
      }
    } finally {
      if (this.generation === generation) this.inFlight = false;
    }
  }

  /** Final flush, then no further work. */
  async dispose(): Promise<void> {
    this.cancelRetry();
    this.createBlocked = true;
    await this.flush(true);
    this.disposed = true;
  }
}
