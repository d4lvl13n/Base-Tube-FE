import React, { useState, useEffect } from 'react';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import HeroSection from '../common/Home/HeroSection';
import VideoSection from '../common/Home/VideoSection';
import ChannelSection from '../common/Home/ChannelSection';
import ErrorBoundary from '../common/ErrorBoundary';
import PlaceholderVideoCard from '../common/PlaceHolderVideoCard';
import { getFeaturedVideos, getRecommendedVideos, getTrendingVideos, getNFTVideos } from '../../api/video';
import { getPopularChannels } from '../../api/channel';
import { Video } from '../../types/video';
import { Channel } from '../../types/channel';

const BaseTubeHomepage: React.FC = () => {
  const [featuredVideos, setFeaturedVideos] = useState<Video[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [trendingVideos, setTrendingVideos] = useState<Video[]>([]);
  const [nftVideos, setNFTVideos] = useState<Video[]>([]);
  const [popularChannels, setPopularChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>({});
  const [channelsPage] = useState(1);
  const [channelsLimit] = useState(15);

  useEffect(() => {
    const fetchHomePageData = async () => {
      setLoading(true);
      const errors: Record<string, boolean> = {};

      const fetchData = async (
        apiCall: () => Promise<any>,
        setter: React.Dispatch<React.SetStateAction<any>>,
        errorKey: string
      ) => {
        try {
          const data = await apiCall();
          setter(data);
        } catch (err) {
          console.error(`Failed to fetch ${errorKey} data:`, err);
          errors[errorKey] = true;
        }
      };

      await Promise.all([
        fetchData(() => getFeaturedVideos(2), setFeaturedVideos, 'featured'),
        fetchData(() => getRecommendedVideos(4), setRecommendedVideos, 'recommended'),
        fetchData(() => getTrendingVideos(4), setTrendingVideos, 'trending'),
        fetchData(() => getNFTVideos(4), setNFTVideos, 'nft'),
        fetchData(
          async () => {
            const channelsData = await getPopularChannels(channelsPage, channelsLimit);
            return channelsData;
          },
          setPopularChannels,
          'channels'
        ),
      ]);

      setSectionErrors(errors);
      setLoading(false);
    };

    fetchHomePageData();
  }, [channelsPage, channelsLimit]);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const renderPlaceholders = (count: number, size: 'normal' | 'large' = 'normal') => (
    Array(count).fill(null).map((_, index) => (
      <PlaceholderVideoCard key={index} size={size} className={size === 'large' ? 'w-full' : ''} />
    ))
  );

  return (
    <ErrorBoundary>
      <div className="bg-[#000000] text-white min-h-screen overflow-hidden">
        <Header className="fixed top-0 left-0 right-0 z-50" />
        <div className="flex pt-16"> {/* Add padding-top to account for fixed header */}
          <Sidebar className="fixed left-0 top-16 bottom-0 z-40" /> {/* Position sidebar below header */}
          <main className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 ml-16 max-w-[1920px] mx-auto w-full">
            {/* Content sections */}
            <HeroSection 
              featuredVideos={featuredVideos.slice(0, 2)} 
              renderPlaceholder={() => renderPlaceholders(2, 'large')}
            />
            <VideoSection 
              title="Recommended for You" 
              videos={sectionErrors['recommended'] ? [] : recommendedVideos} 
              linkTo="/discover?tab=for-you"
              renderPlaceholder={() => renderPlaceholders(4)}
            />
            <VideoSection 
              title="Trending Now" 
              videos={sectionErrors['trending'] ? [] : trendingVideos} 
              linkTo="/discover?tab=trending"
              renderPlaceholder={() => renderPlaceholders(4)}
            />
            <VideoSection 
              title="NFT Content Pass" 
              videos={sectionErrors['nft'] ? [] : nftVideos} 
              linkTo="/discover?tab=nft"
              renderPlaceholder={() => renderPlaceholders(4)}
            />
            <ChannelSection
              channels={sectionErrors['channels'] ? [] : popularChannels}
              renderPlaceholder={() => renderPlaceholders(15)}
            />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BaseTubeHomepage;
