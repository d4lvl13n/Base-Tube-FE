import { useCallback, useEffect, useRef } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { initializeVideoView, sendViewBeacon, updateVideoView } from '../api/video';

interface UseViewTrackingProps {
  videoId: string;
  videoDuration: number;
}

/**
 * Largest slice of playback a single `timeupdate` may contribute.
 *
 * `timeupdate` fires roughly 4×/s, so a real tick is ~0.25 s. A bigger jump is
 * a seek, a stall recovery, or a backgrounded tab catching up — none of which
 * is time the viewer watched. Capping instead of dropping keeps an honest tick
 * that arrived late (slow main thread) from being thrown away.
 */
const MAX_TICK_SECONDS = 1.5;

/**
 * Watch-time tracking for the main player.
 *
 * WHAT `watchedDuration` MEANS: time actually PLAYED, accumulated from the
 * deltas between `timeupdate` events while the player is neither paused nor
 * seeking. It is NOT the furthest position reached — that number made a scrub
 * to the end look like a complete watch, and made "average watch time" a
 * measure of how far people dragged the scrubber.
 *
 * WHO DECIDES "completed": the server, from the played time we send (>= 90 % of
 * the video, per src/utils/videoWatchComplete.ts on the backend). The client no
 * longer sends a `completed` flag at all.
 *
 * WHEN IT REPORTS:
 *   - once on creation, when the view threshold is first crossed;
 *   - every `viewConfig.updateInterval` ms while playing (a real heartbeat —
 *     the previous implementation re-armed a debounce on each tick, so the
 *     periodic send cancelled itself and `durationWatched` stayed pinned at
 *     whatever it was when the view row was created);
 *   - on pause, on tab hide, on `ended`, and on unmount;
 *   - on `pagehide`, via `navigator.sendBeacon` (a normal request does not
 *     survive the document going away).
 */
export const useViewTracking = ({ videoId, videoDuration }: UseViewTrackingProps) => {
  const { viewConfig } = useConfig();

  const isTrackingRef = useRef(false);
  /** Accumulated seconds ACTUALLY PLAYED in this session. */
  const playedSecondsRef = useRef(0);
  /** Playhead position at the previous `timeupdate`, to diff against. */
  const lastPositionRef = useRef<number | null>(null);
  /** Largest value already accepted by the server — never re-send it. */
  const lastSentRef = useRef(0);
  const viewIdRef = useRef<string | null>(null);
  const beaconTokenRef = useRef<string | null>(null);
  const hasMetThresholdRef = useRef(false);
  const isMountedRef = useRef(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);
  const initializingRef = useRef(false);
  /** Latest duration, for listeners registered once. */
  const videoDurationRef = useRef(videoDuration);
  videoDurationRef.current = videoDuration;

  // `viewConfig` is never null — ConfigContext falls back to documented
  // defaults when the fetch fails, so a config outage no longer silences tracking.
  const thresholdsRef = useRef(viewConfig.thresholds);
  thresholdsRef.current = viewConfig.thresholds;

  const hasMetViewThreshold = useCallback((played: number): boolean => {
    const thresholds = thresholdsRef.current;
    const duration = videoDurationRef.current;
    if (!thresholds || !duration) return false;

    const percentageWatched = (played / duration) * 100;
    const { percentage, seconds } = thresholds;

    return percentageWatched >= percentage || played >= seconds;
  }, []);

  /**
   * Send the current played time. No debounce, no timer: callers decide when.
   * Skips a no-op send (nothing new played) unless `force`d by a lifecycle
   * event, and never overlaps itself.
   */
  const sendUpdate = useCallback(
    async (force = false) => {
      const viewId = viewIdRef.current;
      const played = playedSecondsRef.current;

      if (!viewId || played <= 0) return;
      if (inFlightRef.current) return;
      if (!force && played <= lastSentRef.current) return;

      inFlightRef.current = true;
      try {
        await updateVideoView(videoId, viewId, played);
        lastSentRef.current = Math.max(lastSentRef.current, played);
      } catch (error: any) {
        // The backend can 409 on a view-count conflict under concurrency —
        // one retry recovers the lost heartbeat instead of silently dropping it.
        if (error?.response?.status === 409) {
          try {
            await updateVideoView(videoId, viewId, playedSecondsRef.current);
            lastSentRef.current = Math.max(lastSentRef.current, playedSecondsRef.current);
            return;
          } catch (retryError) {
            console.error('Failed to update view after 409 retry:', retryError);
            return;
          }
        }
        console.error('Failed to update view:', error);
      } finally {
        inFlightRef.current = false;
      }
    },
    [videoId]
  );

  /** Synchronous flush for `pagehide` — the only thing that survives teardown. */
  const flushWithBeacon = useCallback(() => {
    const viewId = viewIdRef.current;
    const token = beaconTokenRef.current;
    const played = playedSecondsRef.current;

    if (!viewId || !token || played <= 0 || played <= lastSentRef.current) return;

    if (sendViewBeacon(videoId, viewId, played, token)) {
      lastSentRef.current = played;
    }
  }, [videoId]);

  const initializeView = useCallback(async () => {
    if (!isMountedRef.current || viewIdRef.current || initializingRef.current) return;
    if (!hasMetThresholdRef.current) return;

    initializingRef.current = true;
    try {
      const played = playedSecondsRef.current;
      const response = await initializeVideoView(videoId, played);

      if (!isMountedRef.current) return;

      if (response.success && response.data?.viewId) {
        viewIdRef.current = response.data.viewId;
        beaconTokenRef.current = response.data.beaconToken ?? null;
        lastSentRef.current = played;
      }
    } catch (error) {
      console.error('Failed to initialize view:', error);
    } finally {
      initializingRef.current = false;
    }
  }, [videoId]);

  /**
   * Fed by the player's `timeupdate`. `seeking` lets the player tell us the
   * jump was a scrub; without it a large delta is discarded anyway.
   */
  const updateWatchedDuration = useCallback(
    (currentTime: number, seeking = false) => {
      if (!isMountedRef.current) return;
      if (!Number.isFinite(currentTime)) return;

      const previous = lastPositionRef.current;
      lastPositionRef.current = currentTime;

      if (!isTrackingRef.current) return;

      if (previous !== null && !seeking) {
        const delta = currentTime - previous;
        // Negative (rewind) or oversized (seek / stall) deltas contribute nothing.
        if (delta > 0) {
          playedSecondsRef.current = Math.min(
            playedSecondsRef.current + Math.min(delta, MAX_TICK_SECONDS),
            videoDurationRef.current || playedSecondsRef.current + delta
          );
        }
      }

      if (!hasMetThresholdRef.current && hasMetViewThreshold(playedSecondsRef.current)) {
        hasMetThresholdRef.current = true;
        void initializeView();
      }
    },
    [hasMetViewThreshold, initializeView]
  );

  // A new video is a new session.
  useEffect(() => {
    isTrackingRef.current = false;
    playedSecondsRef.current = 0;
    lastPositionRef.current = null;
    lastSentRef.current = 0;
    viewIdRef.current = null;
    beaconTokenRef.current = null;
    hasMetThresholdRef.current = false;
  }, [videoId]);

  // The heartbeat. Fires on a fixed cadence and SENDS — it is not a debounce.
  useEffect(() => {
    const interval = viewConfig.updateInterval;
    if (!interval) return;

    intervalRef.current = setInterval(() => {
      if (!isMountedRef.current || !isTrackingRef.current || !viewIdRef.current) return;
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return;
      void sendUpdate();
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sendUpdate, viewConfig.updateInterval]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!isMountedRef.current) return;
      if (document.visibilityState === 'hidden') {
        void sendUpdate(true);
      }
    };

    // `pagehide` covers tab close, navigation and bfcache eviction; `visibilitychange`
    // to hidden covers a backgrounded tab that may never come back.
    const handlePageHide = () => flushWithBeacon();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handlePageHide);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [sendUpdate, flushWithBeacon]);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      // Fire the last flush BEFORE the mounted flag drops, or `sendUpdate`
      // returns early and the tail of the session is lost.
      void sendUpdate(true);
      isMountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [sendUpdate]);

  return {
    startTracking: useCallback(() => {
      if (!isMountedRef.current) return;
      isTrackingRef.current = true;
      // Do not credit the gap between pause and resume.
      lastPositionRef.current = null;
    }, []),

    pauseTracking: useCallback(() => {
      if (!isMountedRef.current) return;
      isTrackingRef.current = false;
      lastPositionRef.current = null;
      void sendUpdate(true);
    }, [sendUpdate]),

    updateWatchedDuration,

    finalize: useCallback(async () => {
      if (!isMountedRef.current || !viewIdRef.current) return;
      await sendUpdate(true);
    }, [sendUpdate]),

    /** Test/debug seam: the played seconds this session has accumulated. */
    getPlayedSeconds: useCallback(() => playedSecondsRef.current, []),
  };
};
