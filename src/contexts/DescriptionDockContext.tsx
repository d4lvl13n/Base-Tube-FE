import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Video } from '../types/video';
import { usePlayback } from './PlaybackContext';
import { useLocation } from 'react-router-dom';

interface DescriptionDockState {
  isOpen: boolean;
  video: Video | null;
  open: (video: Video) => void;
  close: () => void;
  toggle: (video?: Video) => void;
}

const DescriptionDockContext = createContext<DescriptionDockState | undefined>(undefined);

export const DescriptionDockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const playback = usePlayback();
  const location = useLocation();

  const open = useCallback((v: Video) => {
    setVideo(v);
    setIsOpen(true);
    try {
      const t = playback.getPrimaryTime();
      playback.pausePrimary();
      playback.setMiniStartAt(t);
      playback.minimize();
    } catch {}
  }, [playback]);

  const close = useCallback(() => {
    setIsOpen(false);
    // Heuristic: restore only on watch pages
    if (window.location.pathname.startsWith('/video/')) {
      playback.restore();
    }
  }, [playback]);

  const toggle = useCallback((v?: Video) => {
    if (isOpen) {
      close();
    } else if (v) {
      open(v);
    }
  }, [isOpen, open, close]);

  // Close dock on route change away from video pages
  useEffect(() => {
    if (!isOpen) return;
    if (!location.pathname.startsWith('/video/')) {
      setIsOpen(false);
      setVideo(null);
    }
  }, [location.pathname, isOpen]);

  // Global hotkey: 'd' toggles dock when a current video exists
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || (e.target as HTMLElement)?.isContentEditable) return;
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault();
        if (isOpen) {
          close();
        } else if (playback.current) {
          // Open with a minimal video payload if we don't have a full video
          const v = video ?? ({
            id: Number(playback.current.videoId),
            title: playback.current.title || '',
            description: '',
          } as unknown as Video);
          open(v);
        }
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, open, close, playback.current, video]);

  const value = useMemo<DescriptionDockState>(() => ({ isOpen, video, open, close, toggle }), [isOpen, video, open, close, toggle]);

  return (
    <DescriptionDockContext.Provider value={value}>
      {children}
    </DescriptionDockContext.Provider>
  );
};

export const useDescriptionDock = (): DescriptionDockState => {
  const ctx = useContext(DescriptionDockContext);
  if (!ctx) throw new Error('useDescriptionDock must be used within DescriptionDockProvider');
  return ctx;
};


