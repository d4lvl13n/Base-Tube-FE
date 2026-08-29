import { useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import type { AVPlaybackStatus } from 'expo-av';
import { ViewTrackingSession } from '@basetube/api';
import { api } from '../lib/client';

/**
 * View tracking for the mobile player.
 *
 * Mobile used to fire `POST /views` with an empty body on mount: the backend
 * validator rejected it with a 400, the SDK swallowed the error, and mobile
 * contributed exactly zero views to every number a creator sees.
 *
 * All the actual rules — played time vs furthest position, dropping seeks,
 * the server-published threshold, retrying a transient creation failure —
 * live in `ViewTrackingSession` in the SDK, where they are unit tested without
 * a React Native runtime. This hook is only the wiring: player callbacks in,
 * lifecycle events in, cleanup on the way out.
 */

/** Must match the `progressUpdateIntervalMillis` the player is given. */
export const STATUS_INTERVAL_MS = 500;

export function useViewTracking(videoId: string | undefined) {
  const sessionRef = useRef<ViewTrackingSession | null>(null);

  if (videoId && !sessionRef.current) {
    sessionRef.current = new ViewTrackingSession({
      videoId,
      api: api.engagement,
      statusIntervalMs: STATUS_INTERVAL_MS,
    });
  }

  // Server-published thresholds. The session already holds the documented
  // defaults, so tracking works from the first frame even if this never lands.
  useEffect(() => {
    let cancelled = false;
    void api.engagement.viewConfig().then((config) => {
      if (!cancelled) sessionRef.current?.setConfig(config);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Navigating between videos reuses this hook; the session must start over.
  useEffect(() => {
    if (videoId) sessionRef.current?.setVideoId(videoId);
  }, [videoId]);

  // Backgrounding is the mobile equivalent of closing the tab: the OS may never
  // give us another callback, so flush on the way out.
  useEffect(() => {
    const onAppStateChange = (next: AppStateStatus) => {
      if (next === 'background' || next === 'inactive') {
        void sessionRef.current?.flush(true);
      }
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      void sessionRef.current?.flush();
    }, sessionRef.current?.heartbeatMs ?? 30_000);

    return () => {
      clearInterval(timer);
      void sessionRef.current?.dispose();
    };
  }, []);

  /** Wire straight to `<Video onPlaybackStatusUpdate={...} />`. */
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    sessionRef.current?.observe({
      positionMs: status.positionMillis ?? 0,
      isPlaying: status.isPlaying,
      durationMs: status.durationMillis,
      didJustFinish: status.didJustFinish,
    });
  };

  return { onPlaybackStatusUpdate };
}
