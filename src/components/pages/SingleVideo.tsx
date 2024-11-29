import React, { useState, useEffect, useRef, useCallback, MutableRefObject } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getVideoById } from '../../api/video';
import { getChannelDetails } from '../../api/channel';
import VideoPlayer, { VideoPlayerRef } from '../common/Video/VideoPlayer';
import { Video } from '../../types/video';
import { Channel } from '../../types/channel';
import Header from '../common/Header';
import Sidebar from '../common/Sidebar';
import { VideoInfoOverlay } from '../common/Video/VideoInfoOverlay';
import { CreatorBox } from '../common/Video/CreatorBox';
import { ViewCount } from '../common/Video/ViewCount';
import CommentPanel from '../common/Video/Comments/CommentPanel';
import { useVideoContext } from '../../contexts/VideoContext';
import { RadialMenu } from '../common/Video/RadialMenu/RadialMenu';
import { useComments } from '../../hooks/useComments';
import { useLikes } from '../../hooks/useLikes';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const SingleVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [showInterface, setShowInterface] = useState(true);
  const [shouldShowOverlay, setShouldShowOverlay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const playerRef = useRef<VideoPlayerRef | null>(null) as MutableRefObject<VideoPlayerRef | null>;
  const { isCommentsPanelOpen, setIsCommentsPanelOpen } = useVideoContext();
  const commentsData = useComments({
    videoId: video?.id.toString() || '',
    initialLimit: 30,
    sortBy: 'latest',
  });

  const { isLiked, toggleLike, isTogglingLike } = useLikes(id || '');

  const [likesCount, setLikesCount] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Throttle function
  function throttle(func: (...args: any[]) => void, limit: number) {
    let inThrottle: boolean;
    return function (this: any, ...args: any[]) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  useEffect(() => {
    if (video?.like_count !== undefined) {
      setLikesCount(video.like_count);
    }
  }, [video?.like_count]);

  const handleLike = useCallback(async () => {
    try {
      setLikesCount((prev) => (isLiked ? prev - 1 : prev + 1));

      const response = await toggleLike();

      if (response?.data) {
        setLikesCount(response.data.likesCount);
      }
    } catch (error) {
      setLikesCount((prev) => (isLiked ? prev + 1 : prev - 1));
      console.error('Error toggling like:', error);
      // Optionally, display an error message to the user
    }
  }, [isLiked, toggleLike]);

  useEffect(() => {
    const fetchVideoAndChannel = async () => {
      if (!id) {
        console.error('No video ID provided');
        navigate('/');
        return;
      }

      try {
        const videoData = await getVideoById(id);
        setVideo(videoData);

        if (videoData.channel_id) {
          const channelData = await getChannelDetails(videoData.channel_id.toString());
          setChannel(channelData.channel);
        }
      } catch (error) {
        console.error('Error fetching video or channel data:', error);
        setError('Failed to load video.');
      }
    };

    fetchVideoAndChannel();
  }, [id, navigate]);

  // Handle mouse and touch events for UI visibility
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleUserInteraction = throttle(() => {
      setShowInterface(true);
      setShouldShowOverlay(true);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setShowInterface(false);
        setShouldShowOverlay(false);
      }, 3000);
    }, 100);

    const videoContainer = containerRef.current;

    if (videoContainer) {
      videoContainer.addEventListener('pointermove', handleUserInteraction);
      videoContainer.addEventListener('pointerdown', handleUserInteraction);
      videoContainer.addEventListener('focusin', handleUserInteraction);
    }

    return () => {
      clearTimeout(timeoutId);
      if (videoContainer) {
        videoContainer.removeEventListener('pointermove', handleUserInteraction);
        videoContainer.removeEventListener('pointerdown', handleUserInteraction);
        videoContainer.removeEventListener('focusin', handleUserInteraction);
      }
    };
  }, [containerRef]);

  const handlePlayerReady = useCallback((player: VideoPlayerRef) => {
    playerRef.current = player;

    player.on('play', () => {
      setIsPlaying(true);
    });

    player.on('pause', () => {
      setIsPlaying(false);
    });

    player.on('fullscreenchange', () => {
      setIsFullscreen(player.isFullscreen());
    });
  }, []);

  if (error) {
    return (
      <div className="flex flex-col bg-black text-white min-h-screen">
        <Header />
        <div className="video-content-wrapper flex flex-1 items-center justify-center">
          <div className="text-center space-y-4">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-500">Video Unavailable</h2>
            <p className="text-gray-400">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-[#fa7517] hover:bg-[#fa7517]/80 rounded-full transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col bg-black text-white min-h-screen">
        <Header />
        <div className="video-content-wrapper flex flex-1 items-center justify-center">
          <div className="animate-pulse space-y-8 w-full max-w-screen-xl">
            {/* Video placeholder */}
            <div className="aspect-w-16 aspect-h-9 bg-gray-800 rounded-lg" />
            {/* Title placeholder */}
            <div className="h-8 bg-gray-800 rounded w-3/4" />
            {/* Description placeholder */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-800 rounded w-1/2" />
              <div className="h-4 bg-gray-800 rounded w-2/3" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      {/* Header */}
      <Header />

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <AnimatePresence>
          <motion.div
            initial={{ x: -250 }}
            animate={{ x: 0 }}
            exit={{ x: -250 }}
            transition={{ duration: 0.3 }}
            className="z-30"
          >
            <Sidebar />
          </motion.div>
        </AnimatePresence>

        {/* Main Area */}
        <main className="flex-1 flex flex-col items-center pt-16" ref={containerRef}>
          {/* Video Container with Aspect Ratio */}
          <div className="w-full max-w-screen-xl">
            <div className="relative" style={{ paddingTop: '56.25%' }}>
              {/* This div maintains a 16:9 aspect ratio */}
              <div className="absolute top-0 left-0 w-full h-full">
                <VideoPlayer
                  src={`${API_BASE_URL}/${video.video_path}`}
                  thumbnail_path={`${API_BASE_URL}/${video.thumbnail_path}`}
                  duration={video.duration}
                  videoId={video.id.toString()}
                  onReady={handlePlayerReady}
                  ref={playerRef}
                />
              </div>
            </div>
          </div>

          {/* Space below the video player */}
          <div className="w-full mt-4 px-4">
            {/* Placeholder for additional content */}
            {/* You can add video title, description, etc., here */}
          </div>
        </main>
      </div>

      {/* Comment Panel */}
      <AnimatePresence>
        {isCommentsPanelOpen && video && (
          <CommentPanel
            isOpen={isCommentsPanelOpen}
            onClose={() => setIsCommentsPanelOpen(false)}
            videoId={video.id.toString()}
            commentsData={commentsData}
          />
        )}
      </AnimatePresence>

      {/* Overlays and UI elements */}
      <AnimatePresence>
        {(shouldShowOverlay || !isPlaying) && (
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <VideoInfoOverlay video={video} />
            {channel && <CreatorBox channel={channel} />}
            <ViewCount video={video} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radial Menu */}
      <AnimatePresence>
        {showInterface && (
          <motion.div
            className="absolute bottom-32 right-24 z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <RadialMenu
              commentCount={commentsData.totalComments}
              likeCount={likesCount}
              isLiked={isLiked}
              onLike={handleLike}
              isTogglingLike={isTogglingLike}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SingleVideo;
