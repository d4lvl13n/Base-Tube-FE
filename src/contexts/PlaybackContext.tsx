import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { VideoPlayerRef } from '../components/common/Video/VideoPlayer';
import { viewSessions } from '../hooks/viewSession';

export interface PlaybackSource {
  videoId: string;
  title?: string;
  src: string;
  thumbnailUrl?: string;
  duration?: number;
  watchUrl?: string;
}

interface PlaybackContextValue {
  isMini: boolean;
  current?: PlaybackSource | null;
  minimize: () => void;
  restore: () => void;
  close: () => void;
  setSource: (source: PlaybackSource) => void;
  // live player ref to transfer time/state between views
  setPrimaryRef: (ref: VideoPlayerRef | null) => void;
  getPrimaryTime: () => number;
  pausePrimary: () => void;
  // mini playback coordination
  miniStartAt?: number | null;
  setMiniStartAt: (time: number | null) => void;
}

const PlaybackContext = createContext<PlaybackContextValue | undefined>(undefined);

export const PlaybackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMini, setIsMini] = useState(false);
  const sourceRef = useRef<PlaybackSource | null>(null);
  const [, setTick] = useState(0);
  const primaryRef = useRef<VideoPlayerRef | null>(null);
  const [miniStartAt, setMiniStartAt] = useState<number | null>(null);

  const setSource = useCallback((source: PlaybackSource) => {
    sourceRef.current = source;
    setTick(t => t + 1);
  }, []);

  const minimize = useCallback(() => setIsMini(true), []);
  // View tracking follows the player: "Return to video" hands the session the
  // mini player was carrying back to the main player (see hooks/viewSession).
  const restore = useCallback(() => {
    const videoId = sourceRef.current?.videoId;
    if (videoId) viewSessions.returnToPrimary(videoId);
    setIsMini(false);
  }, []);
  // Closing the mini player ends its view session (unless the main player
  // still holds it).
  const close = useCallback(() => {
    const videoId = sourceRef.current?.videoId;
    if (videoId) viewSessions.dropCarried(videoId);
    sourceRef.current = null;
    setIsMini(false);
    setTick(t => t + 1);
  }, []);

  const setPrimaryRef = useCallback((ref: VideoPlayerRef | null) => {
    primaryRef.current = ref;
  }, []);

  const getPrimaryTime = useCallback(() => {
    try {
      return primaryRef.current?.currentTime() ?? 0;
    } catch {
      return 0;
    }
  }, []);

  /**
   * Pauses the full-size player. This is a PAUSE, not a teardown: the primary
   * player's `pause` event flushes the played time so far and leaves the view
   * row open. The mini player then carries the SAME view session
   * (hooks/viewSession.ts), and "Return to video" hands it back — one view row
   * per watch visit, whichever player the time was played in. Gated
   * `PassVideoPlayer` playback is tracked separately (utils/passWatchTracker).
   */
  const pausePrimary = useCallback(() => {
    try {
      primaryRef.current?.pause();
    } catch {}
  }, []);

  const value = useMemo<PlaybackContextValue>(() => ({
    isMini,
    current: sourceRef.current,
    minimize,
    restore,
    close,
    setSource,
    setPrimaryRef,
    getPrimaryTime,
    pausePrimary,
    miniStartAt,
    setMiniStartAt,
  }), [isMini, minimize, restore, close, setSource, setPrimaryRef, getPrimaryTime, pausePrimary, miniStartAt]);

  return (
    <PlaybackContext.Provider value={value}>
      {children}
    </PlaybackContext.Provider>
  );
};

export const usePlayback = (): PlaybackContextValue => {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error('usePlayback must be used within PlaybackProvider');
  return ctx;
};


