import React, { useState, useEffect } from 'react';
import Sidebar from '../common/Sidebar';
import HeroSection from '../common/Home/HeroSection';
import VideoSection from '../common/Home/VideoSection';
import ChannelSection from '../common/Home/ChannelSection';
import ErrorBoundary from '../common/ErrorBoundary';
import PlaceholderVideoCard from '../common/PlaceHolderVideoCard';
import { getFeaturedVideos, getRecommendedVideos } from '../../api/video';
import { getPopularChannels } from '../../api/channel';
import { useTrendingVideos } from '../../hooks/useTrendingVideos';
import { usePassDiscover } from '../../hooks/usePass';
import { Video } from '../../types/video';
import { Channel } from '../../types/channel';
import Header from '../common/Header';
import { useNavigation } from '../../contexts/NavigationContext';
import PassCard from '../pass/PassCard';

const PASSES_ENABLED = process.env.REACT_APP_SHOW_PASSES === 'true';

const BaseTubeHomepage: React.FC = () => {
  const { navStyle } = useNavigation();
  const isFloatingNav = navStyle === 'floating';
  const [featuredVideos, setFeaturedVideos] = useState<Video[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<Video[]>([]);
  const [popularChannels, setPopularChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [sectionErrors, setSectionErrors] = useState<Record<string, boolean>>({});
  const [channelsPage] = useState(1);
  const [channelsLimit] = useState(15);

  // Fetch premium content passes (formerly NFT videos)
  const { 
    data: passesData,
    isLoading: passesLoading,
    error: passesError
  } = usePassDiscover({ limit: 4 }, { enabled: PASSES_ENABLED });
  
  // Extract passes from the first page (disabled when feature is off)
  const contentPasses = PASSES_ENABLED ? (passesData?.pages?.[0]?.data || []) : [];

  const { 
    videos: trendingVideos,
    loading: trendingLoading,
    error: trendingError
  } = useTrendingVideos({ 
    limit: 4,
    timeFrame: 'week' as const,
    sort: 'trending' as const
  });

  console.log('HomePage - Trending Videos:', {
    videos: trendingVideos,
    loading: trendingLoading,
    error: trendingError
  });

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
        fetchData(
          async () => {
            const response = await getRecommendedVideos(1, 4);
            return response.videos;
          },
          setRecommendedVideos,
          'recommended'
        ),
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

  if (loading || trendingLoading || (PASSES_ENABLED && passesLoading)) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  const renderPlaceholders = (count: number, size: 'normal' | 'large' = 'normal') => (
    Array(count).fill(null).map((_, index) => (
      <PlaceholderVideoCard key={index} size={size} className={size === 'large' ? 'w-full' : ''} />
    ))
  );

  // Custom render function for passes
  const renderPasses = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {contentPasses.map(pass => (
        <PassCard key={pass.id} pass={pass} />
      ))}
    </div>
  );

  // Placeholder cards matching PassCard style
  const renderPassPlaceholders = (count: number = 4) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, index) => (
        <div 
          key={index}
          className="rounded-xl overflow-hidden bg-black border border-gray-800 hover:border-gray-700 relative group shadow-lg hover:shadow-xl"
          style={{ aspectRatio: '4/5', height: 'auto', width: '100%' }}
        >
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img 
              src="/assets/Content-pass.webp" 
              alt="Premium Content Pass — Coming soon" 
              className="w-full h-full object-cover filter brightness-90 group-hover:brightness-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-70" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white font-semibold tracking-wide bg-black/50 px-3 py-1 rounded">Coming soon</span>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <ErrorBoundary>
      <div className="flex-1 flex flex-col bg-black">
        <Header/>
        <div className="flex pt-16">
          <Sidebar className={`${isFloatingNav ? 'hidden' : 'fixed left-0 top-16 bottom-0 z-40'}`} />
          <main className={`flex-1 ${isFloatingNav ? '' : 'pl-16'} max-w-[1920px] mx-auto w-full`}>
            <div className="p-4 md:p-6">
              <HeroSection 
                featuredVideos={featuredVideos.slice(0, 2)} 
                renderPlaceholder={() => renderPlaceholders(2, 'large')}
              />
              <VideoSection 
                title="Trending Now" 
                videos={trendingVideos || []}
                linkTo="/discover?tab=trending"
                renderPlaceholder={() => renderPlaceholders(4)}
              />
              <VideoSection 
                title="Recommended for You" 
                videos={sectionErrors['recommended'] ? [] : recommendedVideos} 
                linkTo="/discover?tab=for-you"
                renderPlaceholder={() => renderPlaceholders(4)}
              />
              
              {/* Content Pass Section */}
              <div className="mt-12">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl md:text-2xl font-bold">Premium Content Passes</h2>
                  {PASSES_ENABLED && (
                    <a 
                      href="/discover?tab=passes" 
                      className="text-sm text-orange-500 hover:text-orange-400 transition-colors duration-200"
                    >
                      See All
                    </a>
                  )}
                </div>
                {!PASSES_ENABLED ? (
                  renderPassPlaceholders(4)
                ) : passesError ? (
                  <div className="text-red-500">Failed to load content passes</div>
                ) : passesLoading ? (
                  renderPlaceholders(4)
                ) : contentPasses.length === 0 ? (
                  <div className="text-gray-500 text-center py-8">No content passes available</div>
                ) : (
                  renderPasses()
                )}
              </div>
              
              <ChannelSection
                channels={sectionErrors['channels'] ? [] : popularChannels}
                renderPlaceholder={() => renderPlaceholders(15)}
              />
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BaseTubeHomepage;
