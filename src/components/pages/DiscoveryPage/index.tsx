import React, { useState } from 'react';
import Header from '../../common/Header';
import Sidebar from '../../common/Sidebar';
import InfiniteScroll from 'react-infinite-scroll-component';
import { VideoGrid, ErrorMessage } from './styles';
import PlaceholderVideoCard from '../../common/PlaceHolderVideoCard';
import VideoCard from '../../common/VideoCard';
import { useDiscoveryFeed } from '../../../hooks/useDiscoveryFeed';
import { useAuth } from '@clerk/clerk-react';
import { Flame, Clock, TrendingUp, Sparkles, Key } from 'lucide-react';
import FloatingNavigation from '../../common/FloatingNavigation';
import { LucideIcon } from 'lucide-react';

type DiscoveryCategory = 'Trending' | 'Latest' | 'Popular' | 'For You' | 'NFT Content Pass';

const categoryMap: Record<DiscoveryCategory, {
  sort: 'trending' | 'latest' | 'popular' | 'random';
  timeFrame: 'today' | 'week' | 'month' | 'all';
  requiresAuth: boolean;
}> = {
  'Trending': { sort: 'trending', timeFrame: 'all', requiresAuth: false },
  'Latest': { sort: 'latest', timeFrame: 'all', requiresAuth: false },
  'Popular': { sort: 'popular', timeFrame: 'week', requiresAuth: false },
  'For You': { sort: 'random', timeFrame: 'all', requiresAuth: true },
  'NFT Content Pass': { sort: 'popular', timeFrame: 'all', requiresAuth: true }
};

const navigationOptions: Array<{
  key: DiscoveryCategory;
  icon: LucideIcon;
  label: string;
  description: string;
}> = [
  { 
    key: 'Trending',
    icon: Flame,
    label: 'Trending',
    description: 'Discover what\'s hot right now. Updated hourly based on views and engagement.'
  },
  { 
    key: 'Latest',
    icon: Clock,
    label: 'Latest',
    description: 'Fresh content from creators. See the newest uploads first.'
  },
  { 
    key: 'Popular',
    icon: TrendingUp,
    label: 'Popular',
    description: 'Top performing content this week. Community favorites and viral hits.'
  },
  { 
    key: 'For You',
    icon: Sparkles,
    label: 'For You',
    description: 'Personalized recommendations based on your interests and viewing history.'
  },
  { 
    key: 'NFT Content Pass',
    icon: Key,
    label: 'NFT Content',
    description: 'Exclusive content for NFT holders. Premium and early-access videos.'
  },
];

const DiscoveryPage: React.FC = () => {
  const { isSignedIn } = useAuth();
  const [activeCategory, setActiveCategory] = useState<DiscoveryCategory>('Trending');
  const limit = 24;

  const { sort, timeFrame } = categoryMap[activeCategory];

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
  } = useDiscoveryFeed({ limit, sort, timeFrame });

  const videos = data?.pages.flatMap(page => page.data) ?? [];

  console.log('Current videos:', videos.map(v => ({ id: v.id, title: v.title })));

  const handleCategoryChange = (category: DiscoveryCategory) => {
    const categoryConfig = categoryMap[category];
    if (categoryConfig.requiresAuth && !isSignedIn) {
      return;
    }
    setActiveCategory(category);
  };

  // Deduplicate videos based on ID
  const uniqueVideos = Array.from(
    new Map(videos.map(video => [video.id, video])).values()
  );

  const showInitialLoader = isLoading && videos.length === 0;

  return (
    <div className="bg-black text-white min-h-screen relative">
      <Header className="fixed top-0 left-0 right-0 z-50" />
      <div className="flex pt-16 relative">
        <Sidebar className="fixed left-0 top-16 bottom-0 z-40" />
        <main 
          className="flex-1 p-8 overflow-auto main-content ml-16" 
          id="scrollableDiv"
          style={{ height: 'calc(100vh - 64px)' }}
        >
          {isError && (
            <ErrorMessage 
              message={error instanceof Error ? error.message : 'Failed to load discovery feed'} 
            />
          )}

          {showInitialLoader && (
            <VideoGrid>
              {Array(limit).fill(null).map((_, i) => (
                <PlaceholderVideoCard key={i} size="normal" />
              ))}
            </VideoGrid>
          )}

          {!showInitialLoader && uniqueVideos.length > 0 && (
            <InfiniteScroll
              dataLength={uniqueVideos.length}
              next={fetchNextPage}
              hasMore={!!hasNextPage}
              loader={
                <VideoGrid>
                  {[...Array(6)].map((_, index) => (
                    <PlaceholderVideoCard 
                      key={`placeholder-${index}`}
                      size={index === 0 ? 'large' : 'normal'}
                    />
                  ))}
                </VideoGrid>
              }
              scrollThreshold={0.8}
              scrollableTarget="scrollableDiv"
            >
              <VideoGrid>
                {uniqueVideos.map((video, index) => (
                  <VideoCard 
                    key={video.id}
                    video={video} 
                    size={index === 0 ? 'large' : 'normal'} 
                  />
                ))}
              </VideoGrid>
            </InfiniteScroll>
          )}

          {!showInitialLoader && uniqueVideos.length === 0 && !isLoading && !isError && (
            <p className="text-center text-gray-400 mt-8">No videos found.</p>
          )}
        </main>
      </div>

      <FloatingNavigation
        options={navigationOptions}
        activeOption={activeCategory}
        setActiveOption={handleCategoryChange}
      />
    </div>
  );
};

export default DiscoveryPage;