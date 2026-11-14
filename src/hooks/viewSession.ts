import { initializeVideoView, sendViewBeacon, updateVideoView } from '../api/video';
import type { ViewConfigThresholds } from '../types/config';

/**
 * One view-tracking SESSION: the played time of one video during one visit,
 * the view row it created, and the heartbeat / tab-hide / page-hide flushes
 * that report it.
 *
 * It used to live inside `useViewTracking`, i.e. inside the full-size
 * `VideoPlayer`. The mini player had no session at all, and the main player
 * unmounted as soon as the viewer left the watch page — so every second played
 * in the mini player was invisible to watch time and completion. The session
 * now lives here, outside React, so it can be HANDED from the main player to
 * the mini player and back without ending and without a second view row:
 *
 *   watch page ──minimise──▶ mini player ──"Return to video"──▶ watch page
 *        └──────────────── the same session, one view row ─────────────┘
 *
 * Only the player that is currently playing feeds it (`holder`), so the two
 * players can never both add time to it.
 */

/** Fastest the player can advance media time per second of wall time. */
const MAX_PLAYBACK_RATE = 2;
/** Room for a late callback before the gap stops looking like playback. */
const TICK_TOLERANCE = 1.5;
/**
 * Floor for the per-tick allowance, from the nominal `timeupdate` cadence
 * (~4×/s, so 0.25 s — 0.5 s at 2×). Keeps a burst of events arriving
 * microseconds apart from rejecting an ordinary tick.
 */
const MIN_TICK_SECONDS = 0.25 * MAX_PLAYBACK_RATE * TICK_TOLERANCE;

/**
 * The largest media-time jump that could still be playback.
 *
 * Measured against the WALL CLOCK, not the nominal event cadence: media time
 * cannot outrun wall time by more than the playback rate, so the gap actually
 * observed since the previous event is the honest bound. A fixed bound derived
 * from the nominal interval meant any event more than ~0.5 s late at 2× looked
 * like a seek — and under main-thread load an honest session recorded nothing.
 *
 * Whatever exceeds it is DROPPED, not capped. Capping looks like the safe
 * option and is not: it quietly credits the cap's worth of watch time to every
 * scrub, so dragging through a video manufactures watch time out of nothing.
 */
export const tickAllowanceSeconds = (wallElapsedSeconds: number | null): number => {
  if (wallElapsedSeconds === null) return MIN_TICK_SECONDS;
  return Math.max(
    MIN_TICK_SECONDS,
    Math.max(0, wallElapsedSeconds) * MAX_PLAYBACK_RATE * TICK_TOLERANCE
  );
};

/** Which player is feeding a session. */
export type SessionHolder = 'primary' | 'mini';

export interface ViewSessionSettings {
  duration: number;
  thresholds: ViewConfigThresholds | null | undefined;
  /** Heartbeat cadence in ms; 0 / undefined disables the heartbeat. */
  updateInterval: number | null | undefined;
}

const isHidden = () =>
  typeof document !== 'undefined' && document.visibilityState === 'hidden';

export class ViewSession {
  readonly videoId: string;

  private duration: number;
  private thresholds: ViewConfigThresholds | null;
  private updateInterval: number;

  /** The player whose events count right now; null while nothing plays. */
  private holder: SessionHolder | null = null;
  /** Accumulated seconds ACTUALLY PLAYED in this session. */
  private played = 0;
  /** Playhead position at the previous tick, to diff against. */
  private lastPosition: number | null = null;
  /** Wall clock at the previous tick, to bound the media delta against. */
  private lastTickAt: number | null = null;
  /** Largest value already accepted by the server — never re-send it. */
  private lastSent = 0;
  private viewId: string | null = null;
  private beaconToken: string | null = null;
  private hasMetThreshold = false;
  private inFlight = false;
  private initializing = false;
  private ended = false;
  private interval: ReturnType<typeof setInterval> | null = null;

  /** Main-player hooks currently attached to this session. */
  primaryHolders = 0;
  /**
   * True from the moment the mini player takes the session over until it is
   * closed or the main player takes it back. While carried, the main player
   * unmounting (the viewer navigating away) must NOT end it.
   */
  carried = false;

  constructor(videoId: string, settings: ViewSessionSettings) {
    this.videoId = videoId;
    this.duration = Number(settings.duration) || 0;
    this.thresholds = settings.thresholds ?? null;
    this.updateInterval = Number(settings.updateInterval) || 0;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      // `pagehide` covers tab close, navigation and bfcache eviction;
      // `visibilitychange` to hidden covers a backgrounded tab that may never
      // come back.
      window.addEventListener('pagehide', this.handlePageHide);
    }
    this.startHeartbeat();
  }

  // ---------------------------------------------------------------------------
  // Settings
  // ---------------------------------------------------------------------------

  /** Latest duration / thresholds / cadence from whoever holds the session. */
  configure(settings: Partial<ViewSessionSettings>): void {
    if (this.ended) return;
    if (settings.duration !== undefined && Number(settings.duration) > 0) {
      this.duration = Number(settings.duration);
    }
    if (settings.thresholds !== undefined) this.thresholds = settings.thresholds ?? null;
    if (settings.updateInterval !== undefined) {
      const next = Number(settings.updateInterval) || 0;
      if (next !== this.updateInterval) {
        this.updateInterval = next;
        this.startHeartbeat();
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Player events
  // ---------------------------------------------------------------------------

  /** `playing`: from now on, ticks from `holder` count. */
  start(holder: SessionHolder): void {
    if (this.ended) return;
    this.holder = holder;
    // Do not credit the gap between pause and resume, or the jump between
    // where one player stopped and the other starts.
    this.lastPosition = null;
    this.lastTickAt = null;
  }

  /**
   * `pause`: stop counting and report. Ignored when it comes from the player
   * that is NOT the current holder — a late `pause` from the main player must
   * not stop the mini player that has taken over.
   */
  pause(holder: SessionHolder): void {
    if (this.ended) return;
    if (this.holder !== null && this.holder !== holder) return;
    this.holder = null;
    this.lastPosition = null;
    this.lastTickAt = null;
    void this.sendUpdate(true);
  }

  /**
   * Fed by the player's `timeupdate`. `seeking` lets the player tell us the
   * jump was a scrub; without it a large delta is discarded anyway.
   */
  tick(holder: SessionHolder, currentTime: number, seeking = false): void {
    if (this.ended) return;
    if (!Number.isFinite(currentTime)) return;

    // A hidden tab is not credited, at all. `visibilitychange` drops the
    // anchor, but the very next tick would otherwise re-anchor and start
    // accruing again — a backgrounded tab throttles `timeupdate` to ~1/s, so
    // what it accrues is guesswork either way. Bail before touching any
    // anchor, so the stretch spent hidden cannot be credited on return.
    if (isHidden()) return;

    // Only the player that holds the session moves its anchors.
    if (this.holder !== null && this.holder !== holder) return;

    const nowMs = Date.now();
    const previous = this.lastPosition;
    const previousTickAt = this.lastTickAt;
    this.lastPosition = currentTime;
    this.lastTickAt = nowMs;

    if (this.holder !== holder) return; // not playing: anchor only

    if (previous !== null && !seeking) {
      const delta = currentTime - previous;
      const allowance = tickAllowanceSeconds(
        previousTickAt === null ? null : (nowMs - previousTickAt) / 1000
      );
      // Negative (rewind) and oversized (seek / stall / throttle) deltas are
      // both worth nothing — not "worth the cap".
      if (delta > 0 && delta <= allowance) {
        this.played = Math.min(this.played + delta, this.duration || this.played + delta);
      }
    }

    if (!this.hasMetThreshold && this.hasMetViewThreshold(this.played)) {
      this.hasMetThreshold = true;
      void this.initializeView();
    }
  }

  /** `ended`, or a player being disposed: report what we have. */
  async finalize(): Promise<void> {
    if (this.ended || !this.viewId) return;
    await this.sendUpdate(true);
  }

  /**
   * Final flush and teardown: no more heartbeat, no more listeners, no more
   * accrual. If a heartbeat is already in flight, `sendUpdate` refuses to
   * overlap it and would drop this one — and the in-flight request carries a
   * STALER number than we have now — so the beacon takes the tail instead.
   */
  end(): void {
    if (this.ended) return;
    if (this.inFlight) {
      this.flushWithBeacon();
    } else {
      void this.sendUpdate(true);
    }
    this.ended = true;
    this.holder = null;
    this.stopHeartbeat();
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('pagehide', this.handlePageHide);
    }
  }

  /**
   * Report now without ending (the main player detaching while the mini
   * player carries on). Same in-flight rule as `end`.
   */
  flush(): void {
    if (this.ended) return;
    if (this.inFlight) {
      this.flushWithBeacon();
    } else {
      void this.sendUpdate(true);
    }
  }

  getPlayedSeconds(): number {
    return this.played;
  }

  isEnded(): boolean {
    return this.ended;
  }

  /** Test/debug seam. */
  getHolder(): SessionHolder | null {
    return this.holder;
  }

  // ---------------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------------

  private hasMetViewThreshold(played: number): boolean {
    const thresholds = this.thresholds;
    const duration = this.duration;
    if (!thresholds || !duration) return false;
    const percentageWatched = (played / duration) * 100;
    return percentageWatched >= thresholds.percentage || played >= thresholds.seconds;
  }

  /**
   * Send the current played time. No debounce, no timer: callers decide when.
   * Skips a no-op send (nothing new played) unless `force`d by a lifecycle
   * event, and never overlaps itself.
   */
  private async sendUpdate(force = false): Promise<void> {
    const viewId = this.viewId;
    const played = this.played;

    if (!viewId || played <= 0) return;
    if (this.inFlight) return;
    if (!force && played <= this.lastSent) return;

    this.inFlight = true;
    try {
      await updateVideoView(this.videoId, viewId, played);
      this.lastSent = Math.max(this.lastSent, played);
    } catch (error: any) {
      // The backend can 409 on a view-count conflict under concurrency —
      // one retry recovers the lost heartbeat instead of silently dropping it.
      if (error?.response?.status === 409) {
        try {
          await updateVideoView(this.videoId, viewId, this.played);
          this.lastSent = Math.max(this.lastSent, this.played);
          return;
        } catch (retryError) {
          console.error('Failed to update view after 409 retry:', retryError);
          return;
        }
      }
      console.error('Failed to update view:', error);
    } finally {
      this.inFlight = false;
    }
  }

  /** Synchronous flush for `pagehide` — the only thing that survives teardown. */
  private flushWithBeacon(): void {
    const viewId = this.viewId;
    const token = this.beaconToken;
    const played = this.played;

    if (!viewId || !token || played <= 0 || played <= this.lastSent) return;

    if (sendViewBeacon(this.videoId, viewId, played, token)) {
      this.lastSent = played;
    }
  }

  private async initializeView(): Promise<void> {
    if (this.ended || this.viewId || this.initializing) return;
    if (!this.hasMetThreshold) return;

    this.initializing = true;
    try {
      const played = this.played;
      const response = await initializeVideoView(this.videoId, played);

      if (this.ended) return;

      if (response.success && response.data?.viewId) {
        this.viewId = response.data.viewId;
        this.beaconToken = response.data.beaconToken ?? null;
        this.lastSent = played;
      }
    } catch (error) {
      console.error('Failed to initialize view:', error);
    } finally {
      this.initializing = false;
    }
  }

  /** The heartbeat. Fires on a fixed cadence and SENDS — it is not a debounce. */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    if (this.ended || !this.updateInterval) return;
    this.interval = setInterval(() => {
      if (this.ended || this.holder === null || !this.viewId) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      void this.sendUpdate();
    }, this.updateInterval);
  }

  private stopHeartbeat(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private handleVisibilityChange = (): void => {
    if (this.ended) return;
    // Accounting stops while the tab is hidden, in both directions. A hidden
    // tab throttles `timeupdate` to roughly 1/s, which turns honest playback
    // into deltas indistinguishable from a seek — and the first tick after
    // coming back would otherwise carry the entire hidden stretch. Dropping
    // the anchor means neither is credited.
    this.lastPosition = null;
    this.lastTickAt = null;
    if (isHidden()) {
      void this.sendUpdate(true);
    }
  };

  private handlePageHide = (): void => {
    if (this.ended) return;
    this.flushWithBeacon();
  };
}

// -----------------------------------------------------------------------------
// The hand-off registry
// -----------------------------------------------------------------------------
//
// Rules (one session per video per watch visit):
//   * the main player mounting for video X ADOPTS the session the mini player
//     is carrying for X ("Return to video"); otherwise it starts a new one;
//   * the mini player taking over X carries the main player's live session for
//     X (and only creates one if there is none);
//   * the main player unmounting ends its session — unless the mini player is
//     carrying it, in which case it only flushes;
//   * closing the mini player ends the carried session, unless a main player
//     still holds it;
//   * a carried session for another video ends when a new watch page starts.

const live = new Set<ViewSession>();

const prune = () => {
  live.forEach((session) => {
    if (session.isEnded()) live.delete(session);
  });
};

const findCarried = (videoId?: string): ViewSession | undefined => {
  prune();
  let found: ViewSession | undefined;
  live.forEach((session) => {
    if (session.carried && (videoId === undefined || session.videoId === videoId)) found = session;
  });
  return found;
};

const findHeld = (videoId: string): ViewSession | undefined => {
  prune();
  let found: ViewSession | undefined;
  live.forEach((session) => {
    if (session.videoId === videoId && (session.primaryHolders > 0 || session.carried)) {
      found = session;
    }
  });
  return found;
};

export const viewSessions = {
  /** The main player mounting for `videoId`. */
  acquirePrimary(videoId: string, settings: ViewSessionSettings): ViewSession {
    // A session the mini player is carrying for ANOTHER video, with no main
    // player on it, belongs to a visit that is over.
    live.forEach((session) => {
      if (session.carried && session.videoId !== videoId && session.primaryHolders === 0) {
        session.carried = false;
        session.end();
      }
    });
    prune();

    const carried = findCarried(videoId);
    const session = carried ?? new ViewSession(videoId, settings);
    if (carried) {
      // Back on the watch page: the main player owns it again.
      carried.carried = false;
      carried.configure(settings);
    } else {
      live.add(session);
    }
    session.primaryHolders += 1;
    return session;
  },

  /** The main player unmounting (or switching to another video). */
  releasePrimary(session: ViewSession): void {
    session.primaryHolders = Math.max(0, session.primaryHolders - 1);
    if (session.carried || session.primaryHolders > 0) {
      session.flush();
      return;
    }
    session.end();
    prune();
  },

  /**
   * The mini player taking `videoId` over. Returns the live session for that
   * video (normally the main player's), marked carried so the main player's
   * unmount cannot end it.
   */
  carry(videoId: string, settings: ViewSessionSettings): ViewSession {
    const session = findHeld(videoId) ?? new ViewSession(videoId, settings);
    live.add(session);
    session.carried = true;
    session.configure(settings);
    return session;
  },

  /**
   * "Return to video" with the main player still mounted on the same video:
   * it owns the session again. If it is not mounted (the viewer had left the
   * watch page), the session stays carried until the main player mounts and
   * adopts it.
   */
  returnToPrimary(videoId: string): void {
    const session = findCarried(videoId);
    if (session && session.primaryHolders > 0) session.carried = false;
  },

  /** The mini player closed: the carried session ends unless a main player holds it. */
  dropCarried(videoId: string): void {
    const session = findCarried(videoId);
    if (!session) return;
    session.carried = false;
    if (session.primaryHolders === 0) {
      session.end();
      prune();
    } else {
      session.flush();
    }
  },

  /** Test seam: end and forget everything. */
  resetForTests(): void {
    live.forEach((session) => session.end());
    live.clear();
  }
};
