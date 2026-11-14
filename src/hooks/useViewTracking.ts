import { useCallback, useEffect, useRef } from 'react';
import { useConfig } from '../contexts/ConfigContext';
import { ViewSession, viewSessions } from './viewSession';

interface UseViewTrackingProps {
  videoId: string;
  videoDuration: number;
}

/**
 * Watch-time tracking for the main player.
 *
 * The accounting itself lives in `ViewSession` (./viewSession.ts) so that the
 * session can continue in the mini player and come back without a second view
 * row. This hook attaches the main player to that session:
 *
 *   - on mount it ADOPTS the session the mini player is carrying for this
 *     video ("Return to video"), or starts a new one;
 *   - on unmount it ends the session — unless the mini player is carrying it,
 *     in which case it only reports the played time so far.
 *
 * WHAT `watchedDuration` MEANS: time actually PLAYED, accumulated from the
 * deltas between `timeupdate` events while the player is neither paused nor
 * seeking. It is NOT the furthest position reached.
 *
 * WHO DECIDES "completed": the server, from the played time we send (>= 90 % of
 * the video, per src/utils/videoWatchComplete.ts on the backend).
 *
 * WHEN IT REPORTS: once when the view threshold is first crossed (creates the
 * view row); every `viewConfig.updateInterval` ms while playing; on pause, tab
 * hide, `ended` and unmount; on `pagehide` via `navigator.sendBeacon`.
 */
export const useViewTracking = ({ videoId, videoDuration }: UseViewTrackingProps) => {
  const { viewConfig } = useConfig();
  const sessionRef = useRef<ViewSession | null>(null);

  // Latest settings, readable from the acquire effect without re-running it.
  const settingsRef = useRef({
    duration: videoDuration,
    thresholds: viewConfig.thresholds,
    updateInterval: viewConfig.updateInterval
  });
  settingsRef.current = {
    duration: videoDuration,
    thresholds: viewConfig.thresholds,
    updateInterval: viewConfig.updateInterval
  };

  // A new video is a new session (or the carried one for that video).
  useEffect(() => {
    const session = viewSessions.acquirePrimary(videoId, settingsRef.current);
    sessionRef.current = session;
    return () => {
      viewSessions.releasePrimary(session);
      if (sessionRef.current === session) sessionRef.current = null;
    };
  }, [videoId]);

  // `viewConfig` is never null — ConfigContext falls back to documented
  // defaults when the fetch fails, so a config outage never silences tracking.
  useEffect(() => {
    sessionRef.current?.configure({
      duration: videoDuration,
      thresholds: viewConfig.thresholds,
      updateInterval: viewConfig.updateInterval
    });
  }, [videoDuration, viewConfig.thresholds, viewConfig.updateInterval]);

  return {
    startTracking: useCallback(() => {
      sessionRef.current?.start('primary');
    }, []),

    pauseTracking: useCallback(() => {
      sessionRef.current?.pause('primary');
    }, []),

    updateWatchedDuration: useCallback((currentTime: number, seeking = false) => {
      sessionRef.current?.tick('primary', currentTime, seeking);
    }, []),

    finalize: useCallback(async () => {
      await sessionRef.current?.finalize();
    }, []),

    /** Test/debug seam: the played seconds this session has accumulated. */
    getPlayedSeconds: useCallback(() => sessionRef.current?.getPlayedSeconds() ?? 0, []),
  };
};
