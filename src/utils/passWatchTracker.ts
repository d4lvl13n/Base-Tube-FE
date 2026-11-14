import { tickAllowanceSeconds } from '../hooks/viewSession';

/**
 * Player-side watch tracking for PASS videos (gated content on /watch/:passId).
 *
 * Backend contract (base-be src/routes/passVideoWatchRoutes.ts and
 * src/modules/passVideoWatch/passVideoWatchService.ts), `:id` = the PassVideo
 * id (the `id` of each entry of `pass.videos`, the same id the play-token /
 * signed-url endpoints take):
 *
 *   POST /api/v1/pass-videos/:id/watch/start     signed in
 *        { positionSeconds?, durationSeconds? }
 *        → { sessionId, viewerRole, heartbeatIntervalSeconds, sessionExpiresInSeconds }
 *   POST /api/v1/pass-videos/:id/watch/progress  signed in
 *        { sessionId, playedSeconds, positionSeconds?, ended? }
 *        404 WATCH_SESSION_NOT_FOUND → start a new session and continue
 *   POST /api/v1/pass-videos/:id/watch/end       navigator.sendBeacon, no auth
 *        text/plain JSON { sessionId, playedSeconds, positionSeconds? } → 204
 *
 * `playedSeconds` is the time actually PLAYED in the server session,
 * cumulative — not the playhead. Seeks, rewinds, stalls and hidden-tab time
 * are not credited (same rule as the public player); it is capped at the
 * duration. The server only adds the increase over what it already credited,
 * so a repeated beat is harmless.
 *
 * Rules of this module:
 *   - One tracker per (pass video, page visit). The server session is opened
 *     on the first real play and kept across pause / play. A replay after the
 *     video ended is a new tracker (the end closed the server session).
 *   - Heartbeats every `heartbeatIntervalSeconds` the server returned (15 s
 *     until it answers), only while playing in a visible tab, and on pause;
 *     only when something new was played.
 *   - A session the server no longer knows (404), or one idle longer than
 *     `sessionExpiresInSeconds`, is replaced by a new one; the seconds the old
 *     one never confirmed are carried into the new one.
 *   - The end is sent exactly once, with sendBeacon (falls back to a progress
 *     call with `ended: true` when the browser refuses the beacon).
 *   - Tracking never blocks or breaks playback: every failure is swallowed.
 *     After AUTH_FAILURE_LIMIT consecutive 401 / 403 answers, or a 404 on
 *     start (unknown pass video), the tracker stops sending anything. A 429
 *     pauses sending for RATE_LIMIT_BACKOFF_MS; other failures back off
 *     exponentially (15 s, 30 s, … up to 10 min).
 *
 * Pure TypeScript, no React: the network goes through an injected transport
 * (`passWatchTransport` in src/api/pass.ts), so the rules are unit-tested.
 */

export type PassPlayerKind = 'html5' | 'youtube';
export type PassWatchEndReason = 'ended' | 'closed' | 'unload';

export interface PassWatchStartBody {
  positionSeconds?: number;
  durationSeconds?: number;
}

export interface PassWatchStartResult {
  sessionId: string;
  viewerRole: 'buyer' | 'creator';
  heartbeatIntervalSeconds: number;
  sessionExpiresInSeconds: number;
}

export interface PassWatchProgressBody {
  sessionId: string;
  playedSeconds: number;
  positionSeconds?: number;
  ended?: boolean;
}

export interface PassWatchEndBody {
  sessionId: string;
  playedSeconds: number;
  positionSeconds?: number;
}

export interface PassWatchTransport {
  start(passVideoId: string, body: PassWatchStartBody): Promise<PassWatchStartResult>;
  progress(passVideoId: string, body: PassWatchProgressBody): Promise<unknown>;
  /** `navigator.sendBeacon`; false when the browser did not queue it. */
  endBeacon(passVideoId: string, body: PassWatchEndBody): boolean;
}

/** Consecutive 401 / 403 answers after which the tracker stops sending. */
export const AUTH_FAILURE_LIMIT = 2;
/** Heartbeat cadence until the server gives its own. */
export const DEFAULT_HEARTBEAT_SECONDS = 15;
/** Pause after a 429 (the shared axios client already retried once). */
export const RATE_LIMIT_BACKOFF_MS = 60_000;
const RETRY_BASE_MS = 15_000;
const RETRY_MAX_MS = 10 * 60_000;
/** Replace a session a minute before the server would forget it. */
const EXPIRY_MARGIN_MS = 60_000;
const DEFAULT_SESSION_TTL_SECONDS = 6 * 60 * 60;

export interface PassWatchTrackerOptions {
  /** The PassVideo id (pass video id space, not the public video ids). */
  passVideoId: string;
  player: PassPlayerKind;
  transport: PassWatchTransport;
  /** Injected for tests. */
  now?: () => number;
  isHidden?: () => boolean;
}

const defaultIsHidden = () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

/** HTTP status of a failed call (axios error or a plain `{ status }`). */
const statusOf = (error: unknown): number | null => {
  const e = error as { response?: { status?: unknown }; status?: unknown } | null;
  const status = e?.response?.status ?? e?.status;
  return typeof status === 'number' ? status : null;
};

/** A positive number of seconds within [min, max], else the fallback. */
const boundedSeconds = (value: unknown, fallback: number, min: number, max: number): number => {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(max, Math.max(min, n));
};

interface ServerSession {
  id: string;
  ttlMs: number;
  lastContactAt: number;
}

export class PassWatchTracker {
  private readonly passVideoId: string;
  readonly player: PassPlayerKind;
  private readonly transport: PassWatchTransport;
  private readonly now: () => number;
  private readonly isHidden: () => boolean;

  // --- Measurement -----------------------------------------------------------
  private duration: number | null = null;
  private playing = false;
  private started = false;
  private ended = false;
  /** Seconds actually played since this tracker was created. */
  private played = 0;
  private position = 0;
  private lastPosition: number | null = null;
  private lastTickAt: number | null = null;

  // --- Network ---------------------------------------------------------------
  private session: ServerSession | null = null;
  /** `played` when the current server session took over. */
  private baseline = 0;
  /** `played` the server confirmed, across sessions. */
  private acked = 0;
  /** Session-relative seconds the current session confirmed. */
  private sessionSent = 0;
  private heartbeatMs = DEFAULT_HEARTBEAT_SECONDS * 1000;
  private interval: ReturnType<typeof setInterval> | null = null;
  private starting: Promise<boolean> | null = null;
  private busy = false;
  private pending = false;
  private disabled = false;
  private authFailures = 0;
  private transientFailures = 0;
  private backoffUntil = 0;
  private endSent = false;

  constructor(opts: PassWatchTrackerOptions) {
    this.passVideoId = opts.passVideoId;
    this.player = opts.player;
    this.transport = opts.transport;
    this.now = opts.now ?? Date.now;
    this.isHidden = opts.isHidden ?? defaultIsHidden;
  }

  /** The player learned the video length. */
  setDuration(seconds: number | null | undefined): void {
    const n = Number(seconds);
    if (Number.isFinite(n) && n > 0) {
      this.duration = n;
      this.played = Math.min(this.played, n);
      this.position = Math.min(this.position, n);
    }
  }

  /** Playback actually started (or resumed). The first one opens the server session. */
  play(): void {
    if (this.ended) return;
    this.playing = true;
    this.lastPosition = null;
    this.lastTickAt = null;
    if (!this.started) {
      this.started = true;
      void this.ensureSession();
    }
    this.startTimer();
  }

  /** Playback paused by the viewer: report what is new. */
  pause(): void {
    if (this.ended) return;
    this.playing = false;
    this.lastPosition = null;
    this.lastTickAt = null;
    this.stopTimer();
    void this.report();
  }

  /** Report what is new now (e.g. the tab is being hidden). */
  flush(): void {
    void this.report();
  }

  /**
   * The playhead, from `timeupdate` (HTML5) or a once-a-second
   * `getCurrentTime()` poll (YouTube). `seeking` marks a known scrub.
   */
  tick(positionSeconds: number, seeking = false): void {
    if (this.ended || !Number.isFinite(positionSeconds)) return;
    if (this.isHidden()) {
      this.lastPosition = null;
      this.lastTickAt = null;
      return;
    }
    const nowMs = this.now();
    const previous = this.lastPosition;
    const previousAt = this.lastTickAt;
    this.lastPosition = positionSeconds;
    this.lastTickAt = nowMs;
    this.position = this.cap(Math.max(0, positionSeconds));

    if (!this.playing || previous === null || seeking) return;
    const delta = positionSeconds - previous;
    const allowance = tickAllowanceSeconds(previousAt === null ? null : (nowMs - previousAt) / 1000);
    if (delta > 0 && delta <= allowance) {
      this.played = this.cap(this.played + delta);
    }
  }

  /** Close the session once, whatever triggers it first (ended, player gone, page hide). */
  end(_reason: PassWatchEndReason): void {
    if (this.ended) return;
    this.ended = true;
    this.playing = false;
    this.stopTimer();
    if (!this.started) return; // nothing was ever played: no session to close
    // A start still in flight sends the end when it answers (see ensureSession).
    this.sendEnd();
  }

  /** Test / debug seams. */
  getSecondsWatched(): number {
    return this.played;
  }

  isEnded(): boolean {
    return this.ended;
  }

  isDisabled(): boolean {
    return this.disabled;
  }

  // ---------------------------------------------------------------------------

  private cap(seconds: number): number {
    return this.duration ? Math.min(seconds, this.duration) : seconds;
  }

  private sessionPlayed(): number {
    return Math.max(0, Math.floor(this.played - this.baseline));
  }

  private positionSeconds(): number {
    return Math.floor(this.cap(this.position));
  }

  private isExpired(session: ServerSession): boolean {
    return this.now() - session.lastContactAt > session.ttlMs - EXPIRY_MARGIN_MS;
  }

  /** A live server session, opening one when there is none (or it expired). */
  private ensureSession(): Promise<boolean> {
    if (this.session && !this.isExpired(this.session)) return Promise.resolve(true);
    if (this.session) {
      // Idle past its lifetime: the server forgot it. Unconfirmed seconds carry over.
      this.session = null;
      this.baseline = this.acked;
    }
    if (this.disabled || this.now() < this.backoffUntil) return Promise.resolve(false);
    if (this.starting) return this.starting;

    const body: PassWatchStartBody = { positionSeconds: this.positionSeconds() };
    if (this.duration) body.durationSeconds = Math.round(this.duration);

    this.starting = (async () => {
      try {
        const result = await this.transport.start(this.passVideoId, body);
        if (!result || typeof result.sessionId !== 'string' || !result.sessionId) {
          throw new Error('Watch start answered without a session');
        }
        this.session = {
          id: result.sessionId,
          ttlMs: boundedSeconds(result.sessionExpiresInSeconds, DEFAULT_SESSION_TTL_SECONDS, 120, 24 * 3600) * 1000,
          lastContactAt: this.now(),
        };
        this.sessionSent = 0;
        this.heartbeatMs = boundedSeconds(result.heartbeatIntervalSeconds, DEFAULT_HEARTBEAT_SECONDS, 5, 300) * 1000;
        this.onSuccess();
        if (this.ended) this.sendEnd();
        else if (this.playing) this.startTimer();
        return true;
      } catch (error) {
        this.onFailure(error, 'start');
        return false;
      } finally {
        this.starting = null;
      }
    })();
    return this.starting;
  }

  /** Send the played time when something new was played. One call at a time. */
  private async report(): Promise<void> {
    if (this.disabled || !this.started || this.ended) return;
    if (this.busy) {
      this.pending = true;
      return;
    }
    this.busy = true;
    try {
      // A second pass only after a 404: the new session gets the same seconds.
      for (let attempt = 0; attempt < 2; attempt += 1) {
        if (this.ended || this.disabled || this.now() < this.backoffUntil) return;
        if (!(await this.ensureSession())) return;
        const session = this.session;
        if (!session || this.ended) return;
        const playedSeconds = this.sessionPlayed();
        if (playedSeconds <= this.sessionSent) return;
        const total = this.baseline + playedSeconds;
        try {
          await this.transport.progress(this.passVideoId, {
            sessionId: session.id,
            playedSeconds,
            positionSeconds: this.positionSeconds(),
          });
          if (this.session === session) {
            session.lastContactAt = this.now();
            this.sessionSent = Math.max(this.sessionSent, playedSeconds);
          }
          this.acked = Math.max(this.acked, total);
          this.onSuccess();
          return;
        } catch (error) {
          if (statusOf(error) === 404) {
            if (this.session === session) {
              this.session = null;
              this.baseline = this.acked;
            }
            continue;
          }
          this.onFailure(error, 'progress');
          return;
        }
      }
    } finally {
      this.busy = false;
      const again = this.pending;
      this.pending = false;
      if (again && !this.ended && !this.disabled) void this.report();
    }
  }

  private sendEnd(): void {
    if (this.endSent || this.disabled || !this.session) return;
    this.endSent = true;
    const body: PassWatchEndBody = {
      sessionId: this.session.id,
      playedSeconds: this.sessionPlayed(),
      positionSeconds: this.positionSeconds(),
    };
    let queued = false;
    try {
      queued = this.transport.endBeacon(this.passVideoId, body);
    } catch {
      queued = false;
    }
    if (!queued) {
      // No beacon (old browser, queue full): the same close as an authenticated call.
      try {
        this.transport.progress(this.passVideoId, { ...body, ended: true }).catch(() => undefined);
      } catch {
        // Tracking never breaks playback.
      }
    }
  }

  private onSuccess(): void {
    this.authFailures = 0;
    this.transientFailures = 0;
    this.backoffUntil = 0;
  }

  private onFailure(error: unknown, call: 'start' | 'progress'): void {
    const status = statusOf(error);
    if (status === 401 || status === 403) {
      this.authFailures += 1;
      if (this.authFailures >= AUTH_FAILURE_LIMIT) this.disable();
      return;
    }
    if (status === 404 && call === 'start') {
      // Unknown pass video: asking again gets the same answer.
      this.disable();
      return;
    }
    if (status === 429) {
      this.backoffUntil = this.now() + RATE_LIMIT_BACKOFF_MS;
      return;
    }
    this.transientFailures += 1;
    this.backoffUntil =
      this.now() + Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (this.transientFailures - 1));
  }

  private disable(): void {
    this.disabled = true;
    this.stopTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    if (!this.playing || this.ended || this.disabled) return;
    this.interval = setInterval(() => {
      if (this.playing && !this.isHidden()) void this.report();
    }, this.heartbeatMs);
  }

  private stopTimer(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}
