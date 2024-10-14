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

  useEffect(() => {
    const fetchHomePageData = async () => {
      setLoading(true);
      const errors: Record<string, boolean> = {};

      const fetchData = async (apiCall: () => Promise<any>, setter: React.Dispatch<React.SetStateAction<any>>, errorKey: string) => {
        try {
          const response = await apiCall();
          setter(response.data);
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
        fetchData(() => getPopularChannels(10), setPopularChannels, 'channels'),
      ]);

      setSectionErrors(errors);
      setLoading(false);
    };

    fetchHomePageData();
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const renderPlaceholders = (count: number, size: 'normal' | 'large' = 'normal') => (
  Array(count).fill(null).map((_, index) => (
    <PlaceholderVideoCard key={index} size={size} className={size === 'large' ? 'flex-1' : ''} />
  ))
);

  return (
    <ErrorBoundary>
      <div className="bg-[#000000] text-white min-h-screen">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
              <HeroSection 
              featuredVideos={sectionErrors['featured'] ? [] : featuredVideos} 
              renderPlaceholder={() => (
                <>
                  {renderPlaceholders(2, 'large')}
                </>
              )}
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
              renderPlaceholder={() => renderPlaceholders(10)}
            />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BaseTubeHomepage;