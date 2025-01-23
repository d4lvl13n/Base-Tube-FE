import React from 'react';
import { Heart, MessageCircle, Share2, Coins, Hexagon } from 'lucide-react';
import { useVideoContext } from '../../../../contexts/VideoContext';
import RadialMenuItem from './RadialMenuItem';
import { useWindowSize } from '../../../../hooks/useWindowSize';

interface RadialMenuProps {
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
  onLike: () => void;
  isTogglingLike: boolean;
}

export const RadialMenu: React.FC<RadialMenuProps> = ({ 
  commentCount = 0,
  likeCount = 0,
  isLiked,
  onLike,
  isTogglingLike
}) => {
  const { setIsCommentsPanelOpen } = useVideoContext();
  const { width } = useWindowSize();
  const isMobile = width <= 768;  // Adjust the breakpoint as needed

  const handleLike = () => {
    onLike();
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
      onClick: () => console.log('Share clicked') 
    },
    { 
      Icon: Coins, 
      label: 'Tip $TUBE', 
      onClick: () => console.log('Tip clicked') 
    },
    { 
      Icon: Hexagon, 
      label: 'Mint NFT', 
      onClick: () => console.log('Mint clicked') 
    },
  ];

  return (
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
  );
};