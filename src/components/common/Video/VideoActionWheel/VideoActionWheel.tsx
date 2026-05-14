import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Coins,
  Command,
  Heart,
  Info,
  LucideIcon,
  MessageCircle,
  Rocket,
  Share2,
  X,
} from 'lucide-react';
import { toast } from 'react-toastify';
import { formatNumber } from '../../../../utils/format';

interface VideoActionWheelProps {
  videoId: string;
  videoTitle: string;
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
  onLike: () => void;
  isTogglingLike: boolean;
  onCommentsOpen: () => void;
  onInfoOpen: () => void;
  onSharePopupOpen: (url: string, title: string) => void;
}

interface WheelAction {
  key: string;
  label: string;
  microcopy: string;
  Icon: LucideIcon;
  onClick: () => void;
  count?: number;
  kind: 'core' | 'economy';
  active?: boolean;
  loading?: boolean;
}

const desktopPositions = [
  { x: -126, y: -8 },
  { x: -124, y: -72 },
  { x: -82, y: -124 },
  { x: -20, y: -142 },
  { x: 28, y: -112 },
  { x: 38, y: -48 },
];

const mobilePositions = [
  { x: -104, y: -10 },
  { x: -104, y: -66 },
  { x: -66, y: -110 },
  { x: -10, y: -126 },
  { x: 28, y: -92 },
  { x: 28, y: -38 },
];

const stopWheelEvent = (event: React.SyntheticEvent) => {
  event.stopPropagation();
};

const VideoActionWheel: React.FC<VideoActionWheelProps> = ({
  videoId,
  videoTitle,
  commentCount,
  likeCount,
  isLiked,
  onLike,
  isTogglingLike,
  onCommentsOpen,
  onInfoOpen,
  onSharePopupOpen,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth <= 768 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const shareVideo = useCallback(async () => {
    const shareUrl = new URL(`/video/${videoId}`, window.location.origin).toString();

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: videoTitle,
          text: `Watch ${videoTitle} on Base.Tube`,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if ((error as Error).name === 'AbortError') return;
      }
    }

    onSharePopupOpen(shareUrl, videoTitle);
  }, [isMobile, onSharePopupOpen, videoId, videoTitle]);

  const showComingSoon = useCallback((kind: 'tip' | 'boost') => {
    const isTip = kind === 'tip';

    toast.info(
      <div className="flex items-start gap-3">
        {isTip ? (
          <Coins className="mt-0.5 h-5 w-5 text-[#fa7517]" />
        ) : (
          <Rocket className="mt-0.5 h-5 w-5 text-[#fa7517]" />
        )}
        <div>
          <p className="font-medium text-white">{isTip ? 'Creator tipping is warming up' : 'Boosting is almost ready'}</p>
          <p className="text-sm text-gray-300">
            {isTip
              ? 'This will become the wallet-native way to reward creators.'
              : 'This will turn support into distribution once the engine is live.'}
          </p>
        </div>
      </div>,
      {
        position: 'bottom-right',
        autoClose: 4200,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: 'dark',
        className: 'bg-black/90 backdrop-blur-sm border border-gray-800/30',
        icon: false,
      }
    );
  }, []);

  const actions = useMemo<WheelAction[]>(() => [
    {
      key: 'like',
      label: isLiked ? 'Liked' : 'Like',
      microcopy: 'Signal',
      Icon: Heart,
      onClick: onLike,
      count: likeCount,
      kind: 'core',
      active: isLiked,
      loading: isTogglingLike,
    },
    {
      key: 'comment',
      label: 'Comment',
      microcopy: 'Discuss',
      Icon: MessageCircle,
      onClick: onCommentsOpen,
      count: commentCount,
      kind: 'core',
    },
    {
      key: 'details',
      label: 'Details',
      microcopy: 'Read',
      Icon: Info,
      onClick: onInfoOpen,
      kind: 'core',
    },
    {
      key: 'share',
      label: 'Share',
      microcopy: 'Send',
      Icon: Share2,
      onClick: shareVideo,
      kind: 'core',
    },
    {
      key: 'tip',
      label: 'Tip',
      microcopy: '$TUBE',
      Icon: Coins,
      onClick: () => showComingSoon('tip'),
      kind: 'economy',
    },
    {
      key: 'boost',
      label: 'Boost',
      microcopy: 'Reach',
      Icon: Rocket,
      onClick: () => showComingSoon('boost'),
      kind: 'economy',
    },
  ], [
    commentCount,
    isLiked,
    isTogglingLike,
    likeCount,
    onCommentsOpen,
    onInfoOpen,
    onLike,
    shareVideo,
    showComingSoon,
  ]);

  const positions = isMobile ? mobilePositions : desktopPositions;

  const runAction = (action: WheelAction) => {
    action.onClick();
    if (action.key !== 'like') setIsOpen(false);
  };

  return (
    <div
      className="fixed bottom-[6.75rem] right-5 z-[72] sm:bottom-[8.25rem] sm:right-16"
      onClick={stopWheelEvent}
      onDoubleClick={stopWheelEvent}
      onMouseDown={stopWheelEvent}
      onMouseUp={stopWheelEvent}
      onPointerDown={stopWheelEvent}
      onPointerUp={stopWheelEvent}
      onTouchStart={stopWheelEvent}
      onTouchEnd={stopWheelEvent}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.button
            type="button"
            aria-label="Close video actions"
            className="absolute -inset-24 rounded-full bg-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="pointer-events-none absolute bottom-[29px] right-[29px] h-[188px] w-[188px] rounded-full border border-[rgba(214,235,253,0.12)] bg-[radial-gradient(circle_at_70%_72%,rgba(250,117,23,0.18),rgba(0,0,0,0.08)_42%,rgba(0,0,0,0)_70%)] shadow-[0_0_0_1px_rgba(176,199,217,0.08)]"
              initial={{ opacity: 0, scale: 0.72, rotate: -18 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.72, rotate: 12 }}
              transition={{ type: 'spring', damping: 23, stiffness: 230 }}
            />

            <motion.div
              className="pointer-events-none absolute bottom-[28px] right-[28px] h-[190px] w-[190px] rounded-full border border-[#fa7517]/10"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: 0.04 }}
            />

            {actions.map((action, index) => (
              <WheelButton
                key={action.key}
                action={action}
                index={index}
                position={positions[index]}
                onClick={() => runAction(action)}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        aria-expanded={isOpen}
        aria-label={isOpen ? 'Close video actions' : 'Open video actions'}
        onClick={() => setIsOpen((current) => !current)}
        className="group relative flex h-[58px] w-[58px] items-center justify-center rounded-full border border-[rgba(214,235,253,0.18)] bg-black/88 text-white shadow-[0_0_0_1px_rgba(176,199,217,0.11),0_16px_42px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="absolute inset-0 rounded-full bg-[conic-gradient(from_210deg,rgba(250,117,23,0.08),rgba(250,117,23,0.62),rgba(255,255,255,0.10),rgba(250,117,23,0.08))] opacity-80 transition-opacity group-hover:opacity-100" />
        <span className="absolute inset-[4px] rounded-full bg-black" />
        <span className="absolute inset-[8px] rounded-full border border-white/8 bg-[#0d0d0f]" />
        <motion.span
          className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[#fa7517] text-black shadow-[0_0_22px_rgba(250,117,23,0.34)]"
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
        >
          {isOpen ? <X className="h-[18px] w-[18px]" /> : <Command className="h-[18px] w-[18px]" />}
        </motion.span>
      </motion.button>
    </div>
  );
};

const WheelButton: React.FC<{
  action: WheelAction;
  index: number;
  position: { x: number; y: number };
  onClick: () => void;
}> = ({ action, index, position, onClick }) => {
  const Icon = action.Icon;
  const isEconomy = action.kind === 'economy';

  return (
    <motion.button
      type="button"
      aria-label={`${action.label}: ${action.microcopy}`}
      onClick={onClick}
      disabled={action.loading}
      className={`group absolute bottom-[3px] right-[3px] flex h-[52px] w-[52px] items-center justify-center rounded-full border backdrop-blur-xl transition-colors ${
        action.active
          ? 'border-[#fa7517]/80 bg-[#fa7517] text-black shadow-[0_0_30px_rgba(250,117,23,0.34)]'
          : isEconomy
            ? 'border-[#fa7517]/22 bg-black/82 text-white shadow-[0_0_0_1px_rgba(250,117,23,0.05)] hover:border-[#fa7517]/48 hover:bg-[#fa7517]/10'
            : 'border-[rgba(214,235,253,0.16)] bg-black/82 text-white shadow-[0_0_0_1px_rgba(176,199,217,0.08)] hover:border-[#fa7517]/45 hover:bg-white/8'
      }`}
      initial={{ opacity: 0, x: 0, y: 0, scale: 0.34, rotate: 10 }}
      animate={{ opacity: 1, x: position.x, y: position.y, scale: 1, rotate: 0 }}
      exit={{ opacity: 0, x: 0, y: 0, scale: 0.34, rotate: -10 }}
      transition={{ delay: index * 0.028, type: 'spring', damping: 21, stiffness: 330 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
    >
      <span className="pointer-events-none absolute inset-0 rounded-full bg-[#fa7517]/0 transition-colors group-hover:bg-[#fa7517]/10" />
      {action.loading ? (
        <motion.span
          className="relative h-5 w-5 rounded-full border-2 border-white/20 border-t-white"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        />
      ) : (
        <Icon
          className={`relative h-[22px] w-[22px] ${action.active ? 'text-black' : isEconomy ? 'text-[#fa7517]' : 'text-white'}`}
          fill={action.active ? 'currentColor' : 'none'}
        />
      )}

      {typeof action.count === 'number' && action.count > 0 && (
        <span className={`absolute -right-1 -top-1 min-w-[22px] rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
          action.active ? 'bg-black text-[#fa7517]' : 'bg-[#fa7517] text-black'
        }`}>
          {formatNumber(action.count)}
        </span>
      )}

      <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-full border border-white/10 bg-black/95 px-3 py-1.5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white/78 opacity-0 shadow-xl transition-all duration-150 group-hover:-translate-x-1 group-hover:opacity-100">
        {action.label}
      </span>
    </motion.button>
  );
};

export default VideoActionWheel;
