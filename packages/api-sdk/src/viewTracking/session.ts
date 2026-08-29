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
}

const DEFAULT_STATUS_INTERVAL_MS = 500;
const DEFAULT_MAX_PLAYBACK_RATE = 2;
const DEFAULT_TICK_TOLERANCE = 1.5;
const DEFAULT_RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000];

export class ViewTrackingSession {
  private readonly api: ViewTrackingApi;
  private readonly retryDelaysMs: number[];
  private readonly maxTickMs: number;

  private videoId: string;
  private config: ViewTrackingConfig;

  private playedMsValue = 0;
  private lastPositionMs: number | null = null;
  private durationMs = 0;
  private viewIdValue: string | null = null;
  private lastSentMs = 0;

  private opening = false;
  private inFlight = false;
  private disposed = false;
  private createAttempt = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(options: ViewTrackingSessionOptions) {
    this.api = options.api;
    this.videoId = options.videoId;
    this.config = options.config ?? DEFAULT_VIEW_TRACKING_CONFIG;
    this.retryDelaysMs = options.retryDelaysMs ?? DEFAULT_RETRY_DELAYS_MS;
    this.maxTickMs =
      (options.statusIntervalMs ?? DEFAULT_STATUS_INTERVAL_MS) *
      (options.maxPlaybackRate ?? DEFAULT_MAX_PLAYBACK_RATE) *
      (options.tickTolerance ?? DEFAULT_TICK_TOLERANCE);
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
    this.cancelRetry();
    this.playedMsValue = 0;
    this.lastPositionMs = null;
    this.durationMs = 0;
    this.viewIdValue = null;
    this.lastSentMs = 0;
    this.createAttempt = 0;
    this.opening = false;
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

    if (typeof tick.durationMs === 'number' && tick.durationMs > 0) {
      this.durationMs = tick.durationMs;
    }

    const previous = this.lastPositionMs;
    this.lastPositionMs = tick.positionMs;

    if (tick.isPlaying && previous !== null) {
      const delta = tick.positionMs - previous;
      // Rewinds are negative; seeks and background catch-up are too large.
      // Both are worth nothing, not "worth the cap".
      if (delta > 0 && delta <= this.maxTickMs) {
        const ceiling = this.durationMs || this.playedMsValue + delta;
        this.playedMsValue = Math.min(this.playedMsValue + delta, ceiling);
      }
    }

    if (!this.viewIdValue && this.hasMetThreshold()) {
      void this.openView();
    }

    if (!tick.isPlaying && this.viewIdValue) {
      void this.flush();
    }
    if (tick.didJustFinish) {
      void this.flush(true);
    }
  }

  /** Opens the view row, retrying transient failures with backoff. */
  async openView(): Promise<void> {
    if (this.disposed || this.viewIdValue || this.opening) return;

    const videoId = this.videoId;
    this.opening = true;
    this.cancelRetry();
    try {
      const { viewId, retryable } = await this.api.recordViewResult(
        videoId,
        this.playedSeconds
      );

      // The session may have moved on while the request was in flight.
      if (this.disposed || this.videoId !== videoId) return;

      if (viewId) {
        this.viewIdValue = viewId;
        this.lastSentMs = this.playedMsValue;
        this.createAttempt = 0;
        return;
      }

      // A 4xx is the backend's verdict on this view; asking again changes
      // nothing. Only a transient failure earns a retry.
      if (!retryable) return;

      const delay =
        this.retryDelaysMs[Math.min(this.createAttempt, this.retryDelaysMs.length - 1)];
      this.createAttempt += 1;
      this.retryTimer = setTimeout(() => {
        void this.openView();
      }, delay);
    } finally {
      this.opening = false;
    }
  }

  /** Sends the played time so far. `force` reports even an unchanged value. */
  async flush(force = false): Promise<void> {
    const viewId = this.viewIdValue;
    if (!viewId || this.inFlight) return;
    if (this.playedMsValue <= 0) return;
    if (!force && this.playedMsValue <= this.lastSentMs) return;

    this.inFlight = true;
    const snapshot = this.playedMsValue;
    try {
      await this.api.updateView(this.videoId, viewId, snapshot / 1000);
      this.lastSentMs = Math.max(this.lastSentMs, snapshot);
    } finally {
      this.inFlight = false;
    }
  }

  /** Final flush, then no further work. */
  async dispose(): Promise<void> {
    this.cancelRetry();
    await this.flush(true);
    this.disposed = true;
  }
}
