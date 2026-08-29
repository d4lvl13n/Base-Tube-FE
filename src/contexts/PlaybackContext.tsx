import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { VideoPlayerRef } from '../components/common/Video/VideoPlayer';

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
  const restore = useCallback(() => setIsMini(false), []);
  const close = useCallback(() => {
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
   * row open, so restoring picks the same session back up.
   *
   * TODO(analytics): mini-player playback is still not counted. `MiniPlayer`
   * renders its own raw `<video>` with no `useViewTracking` session, and the
   * primary player (which owns the session) unmounts as soon as the viewer
   * navigates off the watch page — so every second watched in the mini player
   * is invisible to watch-time and completion. Fixing it honestly means moving
   * the tracking session up here, keyed by `videoId` and surviving the page
   * unmount, rather than living inside `VideoPlayer`. That is a real refactor
   * of playback ownership, not a patch, and it is deliberately out of scope of
   * the tracking-tier fixes. Same for gated `PassVideoPlayer` playback, which
   * runs in a different id space entirely.
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


