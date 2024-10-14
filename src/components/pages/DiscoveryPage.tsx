import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import CategoryNav from '../common/CategoryNav';
import VideoCard from '../common/VideoCard';
import PlaceholderVideoCard from '../common/PlaceHolderVideoCard';
import FloatingNavigation from '../common/FloatingNavigation';
import { getVideos } from '../../api/video';
import { Video } from '../../types/video';

const categories = ['Trending', 'New', 'NFT Content Pass', 'For You'];

const DiscoveryPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('Trending');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        const response = await getVideos(activeCategory);
        setVideos(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch videos:', err);
        setError('Failed to fetch videos. Displaying placeholder content.');
        setVideos([]); // Clear videos to show placeholders
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [activeCategory]);

  const renderVideoGrid = () => {
    if (videos.length > 0) {
      return videos.map((video, index) => (
        <VideoCard key={video.id} video={video} size={index === 0 ? 'large' : 'normal'} />
      ));
    } else {
      // Generate 9 placeholder cards when no videos are available
      return Array(9).fill(null).map((_, index) => (
        <PlaceholderVideoCard key={index} size={index === 0 ? 'large' : 'normal'} />
      ));
    }
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <CategoryNav
            categories={categories}
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
          {error && (
            <div className="bg-yellow-600 text-white p-4 rounded-md my-4">
              <p>{error}</p>
            </div>
          )}
          <motion.div 
            className="grid grid-cols-3 gap-6 mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {renderVideoGrid()}
          </motion.div>
          {loading && (
            <div className="flex justify-center items-center mt-8">
              <motion.div 
                className="w-16 h-16 border-4 border-[#fa7517] border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </div>
          )}
        </main>
      </div>
      <FloatingNavigation />
    </div>
  );
};

export default DiscoveryPage;
