import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Coins, Rocket } from 'lucide-react';
import { useVideoContext } from '../../../../contexts/VideoContext';
import RadialMenuItem from './RadialMenuItem';
import { useWindowSize } from '../../../../hooks/useWindowSize';
import { toast } from 'react-toastify';
import { shareVideo } from '../../../../utils/share';
import { SharePopup } from '../../SharePopup/SharePopup';

interface RadialMenuProps {
  videoId: string;
  videoTitle: string;
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
  onLike: () => void;
  isTogglingLike: boolean;
  onSharePopupOpen: (url: string, title: string) => void;
}

export const RadialMenu: React.FC<RadialMenuProps> = ({ 
  videoId,
  videoTitle,
  commentCount = 0,
  likeCount = 0,
  isLiked,
  onLike,
  isTogglingLike,
  onSharePopupOpen
}) => {
  const { setIsCommentsPanelOpen } = useVideoContext();
  const { width } = useWindowSize();
  const isMobile = width <= 768;  // Adjust the breakpoint as needed
  const [isSharePopupOpen, setIsSharePopupOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareTitle, setShareTitle] = useState('');

  const handleLike = () => {
    onLike();
  };

  const handleBoostClick = () => {
    toast.info(
      <div className="flex items-center gap-3">
        <Rocket className="w-5 h-5 text-[#fa7517]" />
        <div>
          <p className="font-medium text-white">Coming Soon!</p>
          <p className="text-sm text-gray-300">Video boosting will be available in a future update.</p>
        </div>
      </div>,
      {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        className: "bg-black/90 backdrop-blur-sm border border-gray-800/30",
        icon: false
      }
    );
  };

  const handleTipClick = () => {
    toast.info(
      <div className="flex items-center gap-3">
        <Coins className="w-5 h-5 text-[#fa7517]" />
        <div>
          <p className="font-medium text-white">Coming Soon!</p>
          <p className="text-sm text-gray-300">Creator tipping with $TUBE tokens will be available soon.</p>
        </div>
      </div>,
      {
        position: "bottom-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "dark",
        className: "bg-black/90 backdrop-blur-sm border border-gray-800/30",
        icon: false
      }
    );
  };

  const handleShare = () => {
    shareVideo({
      videoId,
      title: videoTitle,
      onOpenSharePopup: onSharePopupOpen
    });
  };

  const items = [
    { 
      Icon: Heart, 
      label: 'Like', 
      onClick: handleLike,
      count: likeCount,
      isActive: isLiked,
      isLoading: isTogglingLike
    },
    { 
      Icon: MessageCircle, 
      label: 'Comment', 
      onClick: () => setIsCommentsPanelOpen(true),
      count: commentCount
    },
    { 
      Icon: Share2, 
      label: 'Share', 
      onClick: handleShare 
    },
    { 
      Icon: Coins, 
      label: 'Tip $TUBE', 
      onClick: handleTipClick 
    },
    { 
      Icon: Rocket,
      label: 'Boost Video', 
      onClick: handleBoostClick
    },
  ];

  return (
    <>
      <div
        // On mobile: fixed bottom-center. On desktop: original corner position.
        className={
          isMobile
            ? 'fixed bottom-8 left-1/2 transform -translate-x-1/2 z-[60] p-4 pointer-events-auto'
            : 'radial-menu-wrapper absolute bottom-10 right-4 z-[60] p-4 pointer-events-auto'
        }
      >
        {/* Mobile uses a row, desktop uses radial layout */}
        <div
          className={
            isMobile
              ? 'flex flex-row items-center justify-center space-x-4'
              : 'radial-menu relative w-[64px] h-[64px]'
          }
        >
          {items.map((item, index) => (
            <RadialMenuItem
              key={item.label}
              Icon={item.Icon}
              label={item.label}
              angle={isMobile ? 0 : (index * 360) / items.length}
              onClick={item.onClick}
              count={item.count}
              isActive={item.isActive}
              isLoading={item.isLoading}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
      <SharePopup
        isOpen={isSharePopupOpen}
        onClose={() => setIsSharePopupOpen(false)}
        videoUrl={shareUrl}
        title={shareTitle}
      />
    </>
  );
};