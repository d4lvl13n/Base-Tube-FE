import { useCallback, useEffect, useRef } from 'react';
import type { AVPlaybackStatus } from 'expo-av';
import { api } from '../lib/client';

/**
 * View tracking for the mobile player, matching the web's semantics.
 *
 * Mobile used to fire `POST /views` with an empty body on mount: the backend
 * validator rejected it with a 400, the SDK swallowed the error, and mobile
 * contributed exactly zero views to every number a creator sees.
 *
 * What is reported is TIME ACTUALLY PLAYED — deltas between playback-status
 * callbacks while `isPlaying`, capped per tick — not the furthest position
 * reached. Completion is derived server-side from that number.
 *
 * A view row is opened only once `min(30 % of the video, 30 s)` of real
 * playback has happened, because the backend rejects anything below it.
 */

/** Web parity: `view_threshold_percentage` / `view_threshold_seconds`. */
const THRESHOLD_PERCENTAGE = 30;
const THRESHOLD_SECONDS = 30;
/** Web parity: `viewConfig.updateInterval`. */
const HEARTBEAT_MS = 30_000;
/**
 * Largest slice one status callback may contribute. expo-av reports every
 * ~500 ms; anything much larger is a seek, a stall, or the app coming back
 * from the background — none of it watched.
 */
const MAX_TICK_MS = 1_500;

export function useViewTracking(videoId: string | undefined) {
  const playedMsRef = useRef(0);
  const lastPositionMsRef = useRef<number | null>(null);
  const durationMsRef = useRef(0);
  const viewIdRef = useRef<string | null>(null);
  const hasMetThresholdRef = useRef(false);
  const lastSentMsRef = useRef(0);
  const openingRef = useRef(false);
  const inFlightRef = useRef(false);
  const isMountedRef = useRef(true);
  const videoIdRef = useRef(videoId);
  videoIdRef.current = videoId;

  const openView = useCallback(async () => {
    const id = videoIdRef.current;
    if (!id || viewIdRef.current || openingRef.current) return;

    openingRef.current = true;
    try {
      const played = playedMsRef.current / 1000;
      const viewId = await api.engagement.recordView(id, played);
      if (!isMountedRef.current) return;
      if (viewId) {
        viewIdRef.current = viewId;
        lastSentMsRef.current = playedMsRef.current;
      }
    } finally {
      openingRef.current = false;
    }
  }, []);

  const flush = useCallback(async (force = false) => {
    const id = videoIdRef.current;
    const viewId = viewIdRef.current;
    if (!id || !viewId || inFlightRef.current) return;
    if (!force && playedMsRef.current <= lastSentMsRef.current) return;
    if (playedMsRef.current <= 0) return;

    inFlightRef.current = true;
    const snapshot = playedMsRef.current;
    try {
      await api.engagement.updateView(id, viewId, snapshot / 1000);
      lastSentMsRef.current = Math.max(lastSentMsRef.current, snapshot);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  /** Wire straight to `<Video onPlaybackStatusUpdate={...} />`. */
  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      if (typeof status.durationMillis === 'number' && status.durationMillis > 0) {
        durationMsRef.current = status.durationMillis;
      }

      const position = status.positionMillis ?? 0;
      const previous = lastPositionMsRef.current;
      lastPositionMsRef.current = position;

      if (status.isPlaying && previous !== null) {
        const delta = position - previous;
        // Negative (rewind) or oversized (seek / background catch-up) deltas
        // contribute nothing.
        if (delta > 0) {
          const capped = Math.min(delta, MAX_TICK_MS);
          const ceiling = durationMsRef.current || playedMsRef.current + capped;
          playedMsRef.current = Math.min(playedMsRef.current + capped, ceiling);
        }
      }

      const played = playedMsRef.current;
      const duration = durationMsRef.current;
      const metThreshold =
        (duration > 0 && (played / duration) * 100 >= THRESHOLD_PERCENTAGE) ||
        played / 1000 >= THRESHOLD_SECONDS;

      if (!hasMetThresholdRef.current && metThreshold) {
        hasMetThresholdRef.current = true;
        void openView();
      }

      // Pausing and finishing are the two moments the tail of a session would
      // otherwise be lost.
      if (!status.isPlaying && viewIdRef.current) {
        void flush();
      }
      if (status.didJustFinish) {
        void flush(true);
      }
    },
    [flush, openView]
  );

  // A new video is a new session.
  useEffect(() => {
    playedMsRef.current = 0;
    lastPositionMsRef.current = null;
    durationMsRef.current = 0;
    viewIdRef.current = null;
    hasMetThresholdRef.current = false;
    lastSentMsRef.current = 0;
  }, [videoId]);

  useEffect(() => {
    isMountedRef.current = true;
    const timer = setInterval(() => {
      void flush();
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(timer);
      void flush(true);
      isMountedRef.current = false;
    };
  }, [flush]);

  return { onPlaybackStatusUpdate };
}
