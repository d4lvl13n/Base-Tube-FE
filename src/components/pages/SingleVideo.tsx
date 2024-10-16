import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Hexagon,
  Heart,
  MessageCircle,
  Share2,
  Coins,
  Play,
  Pause,
  Maximize,
  Minimize,
} from 'lucide-react';
import { getVideoById } from '../../api/video';
import VideoPlayer, { VideoPlayerRef } from '../common/Video/VideoPlayer';
import { Video } from '../../types/video';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';

const SingleVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [showInterface, setShowInterface] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<VideoPlayerRef>(null);

  useEffect(() => {
    const fetchVideo = async () => {
      if (!id) {
        console.error('No video ID provided');
        navigate('/');
        return;
      }

      try {
        const videoData = await getVideoById(id);
        setVideo(videoData);
      } catch (error) {
        console.error('Error fetching video:', error);
        setError('Failed to load video. Please try again later.');
      }
    };

    fetchVideo();
  }, [id, navigate]);

  const handlePlayerReady = useCallback((player: VideoPlayerRef) => {
    player.on('play', () => setIsPlaying(true));
    player.on('pause', () => setIsPlaying(false));
    player.on('fullscreenchange', () => {
      setIsFullscreen(player.isFullscreen());
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (playerRef.current) {
      if (isPlaying) {
        playerRef.current.pause();
      } else {
        playerRef.current.play();
      }
    }
  }, [isPlaying]);

  const toggleFullscreen = useCallback(() => {
    if (playerRef.current) {
      if (isFullscreen) {
        playerRef.current.exitFullscreen();
      } else {
        playerRef.current.requestFullscreen();
      }
    }
  }, [isFullscreen]);

  if (error) {
    return <div className="text-white text-center mt-10">{error}</div>;
  }

  if (!video) {
    return <div className="text-white text-center mt-10">Loading...</div>;
  }

  return (
    <div className="bg-black text-white min-h-screen w-screen overflow-hidden relative">
      <AnimatePresence>
        {showInterface && !isFullscreen && (
          <>
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 right-0 z-40"
            >
              <Header />
            </motion.div>
            <motion.div
              initial={{ x: -250 }}
              animate={{ x: 0 }}
              exit={{ x: -250 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 bottom-0 z-30"
              style={{ paddingTop: '64px' }}
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          className="w-full h-full max-w-7xl max-h-[80vh] bg-gray-900 rounded-3xl overflow-hidden shadow-2xl"
          layout
          style={{
            boxShadow: `0 0 20px 5px rgba(250, 117, 23, 0.3), 
                        0 0 60px 10px rgba(250, 117, 23, 0.2), 
                        0 0 100px 20px rgba(250, 117, 23, 0.1)`,
          }}
        >
          <VideoPlayer
            ref={playerRef}
            src={`${process.env.REACT_APP_API_URL}/${video.video_path}`}
            thumbnail_path={`${process.env.REACT_APP_API_URL}/${video.thumbnail_path}`}
            onReady={handlePlayerReady}
          />
        </motion.div>
      </div>

      {showInterface && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 pointer-events-auto">
            <motion.button
              onClick={togglePlay}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-[#fa7517] text-black p-3 rounded-full"
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </motion.button>
            <motion.button
              onClick={toggleFullscreen}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="bg-[#fa7517] text-black p-3 rounded-full"
            >
              {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
            </motion.button>
          </div>

          <div className="absolute bottom-8 right-8 w-64 h-64 pointer-events-auto">
            <RadialMenu />
          </div>

          <FloatingCard
            title="Video Title"
            content={video.title}
            position="top-left"
          />
          <FloatingCard
            title="Creator"
            content={video.channel?.name || 'Unknown'}
            position="top-right"
          />
          <FloatingCard
            title="Views"
            content={`${video.views.toLocaleString()} views`}
            position="bottom-left"
          />
        </motion.div>
      )}

      <motion.button
        className="absolute top-5 right-5 bg-black bg-opacity-70 text-[#fa7517] px-4 py-2 rounded-full z-50"
        onClick={() => setShowInterface(!showInterface)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {showInterface ? 'Hide UI' : 'Show UI'}
      </motion.button>
    </div>
  );
};

const RadialMenu: React.FC = () => {
  const items = [
    { Icon: Heart, label: 'Like' },
    { Icon: MessageCircle, label: 'Comment' },
    { Icon: Share2, label: 'Share' },
    { Icon: Coins, label: 'Tip $TUBE' },
    { Icon: Hexagon, label: 'Mint NFT' },
  ];

  return (
    <div className="relative w-full h-full">
      {items.map((item, index) => (
        <RadialMenuItem
          key={item.label}
          Icon={item.Icon}
          label={item.label}
          angle={(index * 360) / items.length}
        />
      ))}
    </div>
  );
};

const RadialMenuItem = ({
  Icon,
  label,
  angle,
}: {
  Icon: React.ElementType;
  label: string;
  angle: number;
}) => (
  <motion.div
    className="absolute top-1/2 left-1/2 -mt-6 -ml-6"
    style={{
      transform: `rotate(${angle}deg) translateY(-80px) rotate(-${angle}deg)`,
    }}
  >
    <motion.button
      className="bg-black bg-opacity-70 rounded-full p-3 cursor-pointer"
      whileHover={{ scale: 1.2, backgroundColor: '#fa7517' }}
      whileTap={{ scale: 0.9 }}
    >
      <Icon size={24} className="text-white" />
    </motion.button>
    <span className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-xs font-semibold whitespace-nowrap">
      {label}
    </span>
  </motion.div>
);

const FloatingCard = ({
  title,
  content,
  position,
}: {
  title: string;
  content: string;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}) => {
  const positionClasses = {
    'top-left': 'top-24 left-8',
    'top-right': 'top-24 right-8',
    'bottom-left': 'bottom-24 left-8',
    'bottom-right': 'bottom-24 right-8',
  };

  return (
    <motion.div
      className={`absolute ${positionClasses[position]} bg-black bg-opacity-70 rounded-lg p-4 max-w-xs border border-[#fa7517]`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <h3 className="text-sm font-semibold mb-1 text-[#fa7517]">{title}</h3>
      <p className="text-lg">{content}</p>
    </motion.div>
  );
};

export default SingleVideo;