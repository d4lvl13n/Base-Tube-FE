import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import InfiniteScroll from 'react-infinite-scroll-component';
import { useDiscoveryFeed } from '../../../../hooks/useDiscoveryFeed';
import VideoCard from '../../VideoCard';
import PlaceholderVideoCard from '../../PlaceHolderVideoCard';

interface DiscoveryPanelProps {
  currentVideoId: string;
}

// VideoGrid component matching DiscoveryPage style
const VideoGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5
                  gap-4 sm:gap-6 mx-auto max-w-[2400px]">
    {children}
  </div>
);

export const DiscoveryPanel: React.FC<DiscoveryPanelProps> = ({
  currentVideoId
}) => {
  // Fetch discovery feed
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
  } = useDiscoveryFeed({
    sort: 'trending',
    timeFrame: 'all',
    limit: 24,
  });

  // Get all videos and filter out current
  const videos = data?.pages.flatMap(page => page.data).filter(v => v.id.toString() !== currentVideoId) ?? [];
  const uniqueVideos = Array.from(new Map(videos.map(v => [v.id, v])).values());

  // Scroll tracking for Apple-style morph effect
  const { scrollY } = useScroll();

  // Panel starts at 100% (fully below viewport), rises to 0% (covering screen)
  // Using translateY percentage of its own height
  const yPercent = useTransform(scrollY, [0, 400], [100, 0]);

  // Opacity: hidden at start, fades in as it rises
  const panelOpacity = useTransform(scrollY, [0, 50, 200], [0, 0.8, 1]);

  // Video dimming overlay opacity
  const dimOpacity = useTransform(scrollY, [0, 100, 350], [0, 0.3, 0.85]);

  // Scale: subtle scale up as it rises (Apple-style)
  const panelScale = useTransform(scrollY, [0, 400], [0.95, 1]);

  return (
    <>
      {/* Video dimming overlay - darkens video as panel rises */}
      <motion.div
        className="fixed inset-0 z-[32] pointer-events-none bg-black"
        style={{ opacity: dimOpacity }}
      />

      {/* Discovery Panel - rises up from bottom */}
      <motion.div
        className="fixed top-0 left-0 right-0 bottom-0 z-[40] overflow-y-auto overflow-x-hidden"
        style={{
          y: useTransform(yPercent, (v) => `${v}%`),
          opacity: panelOpacity,
          scale: panelScale,
        }}
      >
        {/* Glass morphism container */}
        <div className="min-h-full bg-black/98 backdrop-blur-2xl">
          {/* Video Grid */}
          <div className="px-4 sm:px-8 pt-4 pb-6">
            {isLoading && uniqueVideos.length === 0 ? (
              <VideoGrid>
                {Array(12).fill(null).map((_, i) => (
                  <PlaceholderVideoCard key={i} size="normal" />
                ))}
              </VideoGrid>
            ) : uniqueVideos.length > 0 ? (
              <InfiniteScroll
                dataLength={uniqueVideos.length}
                next={fetchNextPage}
                hasMore={!!hasNextPage}
                loader={
                  <VideoGrid>
                    {[...Array(6)].map((_, index) => (
                      <PlaceholderVideoCard
                        key={`placeholder-${index}`}
                        size="normal"
                      />
                    ))}
                  </VideoGrid>
                }
                scrollThreshold={0.8}
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
            ) : (
              <div className="text-center py-20">
                <p className="text-gray-400">No videos to discover right now</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};
