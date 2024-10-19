// src/components/pages/DiscoveryPage.tsx

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import CategoryNav from '../common/CategoryNav';
import VideoCard from '../common/VideoCard';
import PlaceholderVideoCard from '../common/PlaceHolderVideoCard';
import FloatingNavigation from '../common/FloatingNavigation';
import { Video } from '../../types/video';
import { fetchVideosByCategory } from '../../utils/fetchVideos';
import InfiniteScroll from 'react-infinite-scroll-component';
import axiosRetry from 'axios-retry';
import api from '../../api/index'; // Your axios instance
import { TrendingUp, Clock, Star, User, Circle } from 'lucide-react';

const categories = ['Trending', 'New', 'NFT Content Pass', 'For You'];

const DiscoveryPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit] = useState(9);
  const [hasMore, setHasMore] = useState(true);

  // Configure axios-retry
  axiosRetry(api, {
    retries: 3, // Number of retry attempts
    retryDelay: (retryCount) => {
      return retryCount * 1000; // Time between retries (in ms)
    },
    retryCondition: (error) => {
      // Retry on network errors or 5xx server errors
      return axiosRetry.isNetworkError(error) || axiosRetry.isRetryableError(error);
    },
  });

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const videosData = await fetchVideosByCategory(activeCategory, page, limit);

        setVideos((prevVideos) => (page === 1 ? videosData : [...prevVideos, ...videosData]));
        setError(null);
        setHasMore(videosData.length === limit);
      } catch (err: any) {
        console.error('Failed to fetch videos:', err);
        if (err.response) {
          // Server responded with a status other than 2xx
          setError(`Error ${err.response.status}: ${err.response.data.message || 'Failed to fetch videos.'}`);
        } else if (err.request) {
          // Request was made but no response received
          setError('Network error: No response received from server.');
        } else {
          // Something else happened
          setError(`Error: ${err.message}`);
        }
        if (page === 1) {
          setVideos([]); // Clear videos to show placeholders
        }
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, page]);

  const fetchMoreVideos = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    setPage(1);
    setVideos([]);
    setHasMore(true);
  };

  const renderVideoGrid = () => {
    if (videos.length > 0) {
      return videos.map((video, index) => (
        <VideoCard key={`${video.id}-${index}`} video={video} size={index === 0 ? 'large' : 'normal'} />
      ));
    } else if (!loading) {
      // No videos to display after loading
      return (
        <div className="col-span-3 text-center text-gray-500">
          <p>No videos found.</p>
        </div>
      );
    } else {
      // Generate placeholder cards while loading
      return Array(9)
        .fill(null)
        .map((_, index) => (
          <PlaceholderVideoCard key={index} size={index === 0 ? 'large' : 'normal'} />
        ));
    }
  };

  const categoryOptions = categories.map(category => ({
    key: category,
    label: category,
    icon: getCategoryIcon(category)
  }));

  return (
    <div className="bg-black text-white min-h-screen">
      <Header className="fixed top-0 left-0 right-0 z-50" />
      <div className="flex pt-16"> {/* Add padding-top to account for fixed header */}
        <Sidebar className="fixed left-0 top-16 bottom-0 z-40" /> {/* Position sidebar below header */}
        <main className="flex-1 p-8 overflow-auto main-content ml-16" id="scrollableDiv">
          <CategoryNav
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={handleCategoryChange}
          />
          {error && (
            <div className="bg-yellow-600 text-white p-4 rounded-md my-4">
              <p>{error}</p>
            </div>
          )}
          <InfiniteScroll
            dataLength={videos.length}
            next={fetchMoreVideos}
            hasMore={hasMore}
            loader={
              <div className="flex justify-center items-center mt-8">
                <motion.div
                  className="w-16 h-16 border-4 border-[#fa7517] border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              </div>
            }
            endMessage={
              !loading && (
                <p style={{ textAlign: 'center', marginTop: '20px' }}>
                  <b>You have seen it all!</b>
                </p>
              )
            }
            scrollableTarget="scrollableDiv"
          >
            <motion.div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mt-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {renderVideoGrid()}
            </motion.div>
          </InfiniteScroll>
        </main>
      </div>
      <FloatingNavigation
        options={categoryOptions}
        activeOption={activeCategory}
        setActiveOption={handleCategoryChange}
      />
    </div>
  );
};

// Helper function to get icons for categories
const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'Trending':
      return TrendingUp;
    case 'New':
      return Clock;
    case 'NFT Content Pass':
      return Star;
    case 'For You':
      return User;
    default:
      return Circle;
  }
};

export default DiscoveryPage;
