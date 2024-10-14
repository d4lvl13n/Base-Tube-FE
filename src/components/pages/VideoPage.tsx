import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hexagon, Play, Pause, SkipBack, SkipForward, Maximize, Minimize, Heart, MessageCircle, Share2, Coins } from 'lucide-react';

interface Video {
  id: number;
  title: string;
  creator: string;
  views: string;
  image: string;
}

const RefinedVideoExperience = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInterface, setShowInterface] = useState(true);

  useEffect(() => {
    // Fetch video data based on id
    // This is a mock function, replace with actual API call
    const fetchVideo = async () => {
      const videoData = await mockFetchVideo(id);
      setVideo(videoData);
    };
    fetchVideo();
  }, [id]);

  if (!video) {
    return <div>Loading...</div>;
  }

  return (
    <div className="bg-black text-white h-screen w-screen overflow-hidden relative">
      {/* Deep black background */}
      <div className="absolute inset-0 bg-black" />

      {/* Updated floating orb navigation */}
      <Link to="/">
        <motion.nav 
          className="absolute top-5 left-5 z-50"
          whileHover={{ scale: 1.2 }}
        >
          <div className="bg-black rounded-full p-2">
            <Hexagon size={40} className="text-[#fa7517] cursor-pointer" />
          </div>
        </motion.nav>
      </Link>

      {/* Centered video player with glow effect */}
      <motion.div 
        className={`absolute inset-0 m-auto w-3/4 h-3/4 bg-gray-900 rounded-3xl overflow-hidden shadow-2xl ${
          isFullscreen ? 'w-full h-full rounded-none' : ''
        }`}
        layout
        style={{
          boxShadow: `0 0 20px 5px rgba(250, 117, 23, 0.3), 
                      0 0 60px 10px rgba(250, 117, 23, 0.2), 
                      0 0 100px 20px rgba(250, 117, 23, 0.1)`
        }}
      >
        <img src={video.image} alt={video.title} className="w-full h-full object-cover" />
        
        {/* Redesigned video controls */}
        {showInterface && (
          <motion.div 
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 rounded-full p-4 flex items-center space-x-6"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
          >
            <SkipBack size={24} className="text-[#fa7517] cursor-pointer" />
            {isPlaying ? (
              <Pause size={36} className="text-[#fa7517] cursor-pointer" onClick={() => setIsPlaying(false)} />
            ) : (
              <Play size={36} className="text-[#fa7517] cursor-pointer" onClick={() => setIsPlaying(true)} />
            )}
            <SkipForward size={24} className="text-[#fa7517] cursor-pointer" />
            {isFullscreen ? (
              <Minimize size={24} className="text-[#fa7517] cursor-pointer" onClick={() => setIsFullscreen(false)} />
            ) : (
              <Maximize size={24} className="text-[#fa7517] cursor-pointer" onClick={() => setIsFullscreen(true)} />
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Repositioned radial menu for interactions */}
      {showInterface && (
        <motion.div 
          className="absolute bottom-24 right-24 w-56 h-56"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <RadialMenuItem Icon={Heart} label="Like" angle={0} />
          <RadialMenuItem Icon={MessageCircle} label="Comment" angle={72} />
          <RadialMenuItem Icon={Share2} label="Share" angle={144} />
          <RadialMenuItem Icon={Coins} label="Tip $TUBE" angle={216} />
          <RadialMenuItem Icon={Hexagon} label="Mint NFT" angle={288} />
        </motion.div>
      )}

      {/* Updated floating info cards */}
      {showInterface && (
        <>
          <FloatingCard title="Video Title" content={video.title} position="top-left" />
          <FloatingCard title="Creator" content={video.creator} position="top-right" />
          <FloatingCard title="Views" content={`${video.views} views`} position="bottom-left" />
        </>
      )}

      {/* Refined toggle interface visibility */}
      <motion.button 
        className="absolute top-5 right-5 bg-black bg-opacity-70 text-[#fa7517] px-4 py-2 rounded-full"
        onClick={() => setShowInterface(!showInterface)}
        whileHover={{ scale: 1.1 }}
      >
        {showInterface ? 'Hide UI' : 'Show UI'}
      </motion.button>
    </div>
  );
};

const RadialMenuItem = ({ Icon, label, angle }: { Icon: React.ElementType; label: string; angle: number }) => (
  <motion.div
    className="absolute"
    style={{
      transform: `rotate(${angle}deg) translate(90px) rotate(-${angle}deg)`,
    }}
  >
    <motion.div
      className="bg-black bg-opacity-70 rounded-full p-3 cursor-pointer"
      whileHover={{ scale: 1.2 }}
    >
      <Icon size={28} className="text-[#fa7517]" />
    </motion.div>
    <span className="absolute mt-2 text-sm font-semibold whitespace-nowrap left-1/2 transform -translate-x-1/2">{label}</span>
  </motion.div>
);

const FloatingCard = ({ title, content, position }: { title: string; content: string; position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) => {
  const positionClasses = {
    'top-left': 'top-24 left-8',
    'top-right': 'top-24 right-8',
    'bottom-left': 'bottom-24 left-8',
    'bottom-right': 'bottom-24 right-8',
  };

  return (
    <motion.div
      className={`absolute ${positionClasses[position as keyof typeof positionClasses]} bg-black bg-opacity-70 rounded-lg p-4 max-w-xs border border-[#fa7517]`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h3 className="text-sm font-semibold mb-1 text-[#fa7517]">{title}</h3>
      <p className="text-lg">{content}</p>
    </motion.div>
  );
};

// Mock function to fetch video data
const mockFetchVideo = async (id: string | undefined): Promise<Video | null> => {
  const videos: Video[] = [
    { id: 1, title: "The Future of Web3", creator: "CryptoVision", views: "320K", image: "/MockupAssets/crypto.webp" },
    { id: 2, title: "Decentralized Finance Explained", creator: "DeFi Master", views: "185K", image: "/MockupAssets/education.webp" },
    { id: 3, title: "NFT Art Revolution", creator: "CryptoArtist", views: "420K", image: "/MockupAssets/ArtDesign.webp" },
    { id: 4, title: "Blockchain Gaming: What's Next?", creator: "GameChanger", views: "250K", image: "/MockupAssets/gaming.webp" },
    { id: 5, title: "Metaverse Deep Dive", creator: "VirtualPioneer", views: "195K", image: "/MockupAssets/tech.webp" },
    { id: 6, title: "Crypto Trading Strategies", creator: "CoinMaster", views: "150K", image: "/MockupAssets/business.webp" },
  ];
  return videos.find(v => v.id === parseInt(id || '0')) || null;
};

export default RefinedVideoExperience;
