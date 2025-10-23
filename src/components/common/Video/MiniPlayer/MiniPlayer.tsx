import React from 'react';
import { X, CornerDownLeft, Pause, Play, Volume2, VolumeX } from 'lucide-react';
import { usePlayback } from '../../../../contexts/PlaybackContext';
import { useNavigate } from 'react-router-dom';

const MiniPlayer: React.FC = () => {
  const { isMini, current, restore, close, miniStartAt, setMiniStartAt } = usePlayback();
  const navigate = useNavigate();
  const [isPaused, setIsPaused] = React.useState(false);
  const [pos, setPos] = React.useState<{ x: number; y: number }>({ x: 24, y: 24 });
  const [size, setSize] = React.useState<{ w: number; h: number }>({ w: 400, h: 225 });
  const dragRef = React.useRef<HTMLDivElement | null>(null);
  const isDraggingRef = React.useRef(false);
  const startRef = React.useRef<{ mx: number; my: number; x: number; y: number } | null>(null);
  const isResizingRef = React.useRef(false);
  const resizeStartRef = React.useRef<{ mx: number; my: number; w: number; h: number } | null>(null);
  const [showOverlay, setShowOverlay] = React.useState(true);
  const overlayTimerRef = React.useRef<number | null>(null);
  const [isMuted, setIsMuted] = React.useState(true);
  const SNAP_MARGIN = 12;

  // Load persisted state
  React.useEffect(() => {
    try {
      const raw = localStorage.getItem('bt-mini-state');
      if (raw) {
        const parsed = JSON.parse(raw) as { x: number; y: number; w: number; h: number };
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number' && typeof parsed.w === 'number' && typeof parsed.h === 'number') {
          setPos({ x: parsed.x, y: parsed.y });
          setSize({ w: parsed.w, h: parsed.h });
        }
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isDraggingRef.current && startRef.current) {
        const dx = e.clientX - startRef.current.mx;
        const dy = e.clientY - startRef.current.my;
        setPos(({ x, y }) => ({ x: Math.max(8, x + dx), y: Math.max(8, y + dy) }));
        startRef.current = { mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y };
      } else if (isResizingRef.current && resizeStartRef.current) {
        const dx = e.clientX - resizeStartRef.current.mx;
        const nextW = Math.max(280, resizeStartRef.current.w + dx);
        const aspect = 16 / 9;
        const nextH = Math.max(135, Math.round(nextW / aspect));
        setSize({ w: nextW, h: nextH });
      }
    };
    const onUp = () => {
      isDraggingRef.current = false;
      isResizingRef.current = false;
      // Snap to nearest horizontal edge
      try {
        const vw = window.innerWidth;
        setPos(p => {
          const snapLeft = p.x < vw / 2;
          const x = snapLeft ? SNAP_MARGIN : Math.max(SNAP_MARGIN, vw - size.w - SNAP_MARGIN);
          return { x, y: Math.max(SNAP_MARGIN, p.y) };
        });
      } catch {}
      // Persist
      try {
        const state = { x: pos.x, y: pos.y, w: size.w, h: size.h };
        localStorage.setItem('bt-mini-state', JSON.stringify(state));
      } catch {}
      startRef.current = null;
      resizeStartRef.current = null;
      document.body.style.userSelect = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [pos.x, pos.y, size.w, size.h]);

  const bumpOverlay = React.useCallback(() => {
    setShowOverlay(true);
    if (overlayTimerRef.current) window.clearTimeout(overlayTimerRef.current);
    overlayTimerRef.current = window.setTimeout(() => setShowOverlay(false), 2000);
  }, []);

  React.useEffect(() => {
    if (!isMini) return;
    bumpOverlay();
  }, [isMini, bumpOverlay]);

  const videoEl = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    if (!isMini || !current || !videoEl.current) return;
    if (miniStartAt && Number.isFinite(miniStartAt)) {
      videoEl.current.currentTime = miniStartAt;
      setMiniStartAt(null);
    }
    const p = videoEl.current.play();
    if (p) p.catch(() => {});
  }, [isMini, current, miniStartAt, setMiniStartAt]);

  if (!current || !isMini) return null;

  return (
    <div
      ref={dragRef}
      className="fixed z-[70] bg-black border border-gray-800/50 rounded-lg overflow-hidden shadow-xl"
      style={{ left: pos.x, bottom: pos.y, width: size.w, height: size.h }}
    >
      {/* Video fills the mini player */}
      <video
        ref={videoEl}
        className="absolute inset-0 w-full h-full object-cover"
        muted={isMuted}
        playsInline
        onMouseMove={bumpOverlay}
      >
        {current.src ? (
          <source src={current.src} type="video/mp4" />
        ) : null}
      </video>

      {/* Top overlay controls with drag handle */}
      <div
        className={`absolute top-0 left-0 right-0 flex items-center gap-2 p-2 bg-gradient-to-b from-black/70 to-black/0 cursor-move select-none transition-opacity ${showOverlay ? 'opacity-100' : 'opacity-0'}`}
        onMouseDown={(e) => {
          isDraggingRef.current = true;
          startRef.current = { mx: e.clientX, my: e.clientY, x: pos.x, y: pos.y };
          document.body.style.userSelect = 'none';
        }}
        onMouseMove={bumpOverlay}
      >
        <div className="flex-1 min-w-0 pr-2">
          <div className="text-xs font-medium truncate text-white/90">{current.title || 'Playing video'}</div>
        </div>
        <button
          className="p-1.5 hover:bg-black/40 rounded"
          aria-label={isPaused ? 'Play' : 'Pause'}
          onClick={(e) => {
            e.stopPropagation();
            setIsPaused(p => {
              const next = !p;
              if (videoEl.current) {
                if (next) videoEl.current.pause();
                else void videoEl.current.play();
              }
              return next;
            });
          }}
        >
          {isPaused ? <Play className="w-4 h-4 text-white" /> : <Pause className="w-4 h-4 text-white" />}
        </button>
        <button
          className="p-1.5 hover:bg-black/40 rounded"
          aria-label={isMuted ? 'Unmute' : 'Mute'}
          onClick={(e) => {
            e.stopPropagation();
            setIsMuted(m => {
              const next = !m;
              if (videoEl.current) {
                videoEl.current.muted = next;
                if (!next) {
                  videoEl.current.volume = 1;
                  const p = videoEl.current.play();
                  if (p) p.catch(() => {});
                }
              }
              return next;
            });
          }}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
        </button>
        <button
          className="p-1.5 hover:bg-black/40 rounded"
          aria-label="Return to video"
          onClick={(e) => {
            e.stopPropagation();
            if (videoEl.current) videoEl.current.pause();
            if (current.watchUrl) navigate(current.watchUrl);
            restore();
          }}
        >
          <CornerDownLeft className="w-4 h-4 text-white" />
        </button>
        <button
          className="p-1.5 hover:bg-black/40 rounded"
          aria-label="Close mini player"
          onClick={(e) => { e.stopPropagation(); if (videoEl.current) videoEl.current.pause(); close(); }}
        >
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Resize handle */}
      <div
        className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize"
        onMouseDown={(e) => {
          isResizingRef.current = true;
          resizeStartRef.current = { mx: e.clientX, my: e.clientY, w: size.w, h: size.h };
          document.body.style.userSelect = 'none';
        }}
      />
    </div>
  );
};

export default MiniPlayer;


