import React from 'react';
import { Heart, MessageCircle, Share2, Coins, Hexagon } from 'lucide-react';
import { useVideoContext } from '../../../../contexts/VideoContext';

import RadialMenuItem from './RadialMenuItem';

interface RadialMenuProps {
  commentCount: number;
  likeCount: number;
}

export const RadialMenu: React.FC<RadialMenuProps> = ({ 
  commentCount = 0,
  likeCount = 0 
}) => {
  const { setIsCommentsPanelOpen } = useVideoContext();

  console.log('RadialMenu counts:', { commentCount, likeCount });

  const items = [
    { 
      Icon: Heart, 
      label: 'Like', 
      onClick: () => console.log('Like clicked'),
      count: likeCount
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
    <div className="relative w-full h-full">
      {items.map((item, index) => {
        console.log(`Rendering item ${item.label}:`, { count: item.count });
        
        return (
          <RadialMenuItem
            key={item.label}
            Icon={item.Icon}
            label={item.label}
            angle={(index * 360) / items.length}
            onClick={item.onClick}
            count={item.count}
          />
        );
      })}
    </div>
  );
};