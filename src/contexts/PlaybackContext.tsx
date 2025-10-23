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


