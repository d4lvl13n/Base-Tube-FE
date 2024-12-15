import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  MutableRefObject,
} from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getVideoById } from '../../api/video';
import { getChannelById } from '../../api/channel';
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
import { useWindowSize } from '../../hooks/useWindowSize';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const SingleVideo: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [video, setVideo] = useState<Video | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [showInterface, setShowInterface] = useState(true);
  const [shouldShowOverlay, setShouldShowOverlay] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
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

  // Constants for header height and desired bottom space
  const HEADER_HEIGHT = 64; // Adjust this value to match the header's actual height
  const BOTTOM_SPACE = 120; // Desired space below the video in pixels

  // Get the window dimensions
  const { width: windowWidth, height: windowHeight } = useWindowSize();

  // Detect if the device is mobile based on screen width
  const isMobile = windowWidth <= 768; // Adjust breakpoint as needed

  // Maximum height available for the video player
  const maxVideoHeight = windowHeight - HEADER_HEIGHT - BOTTOM_SPACE;

  // Maximum allowed video width 
  const maxVideoWidth = 3440; 

  // Aspect ratio of the video (16:9)
  const aspectRatio = 16 / 9;

  // Calculate the ideal video width and height based on the window size
  let videoWidth = isMobile ? windowWidth : Math.min(windowWidth, maxVideoWidth);
  let videoHeight = videoWidth / aspectRatio;

  // If the calculated height exceeds the maximum available height, adjust the width and height
  if (videoHeight > maxVideoHeight) {
    videoHeight = maxVideoHeight;
    videoWidth = videoHeight * aspectRatio;
  }

  // Style to offset the main content by the header's height
  const mainContentStyle = {
    marginTop: `${HEADER_HEIGHT}px`,
  };

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
          const channelData = await getChannelById(videoData.channel_id);
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
      console.log('User interaction detected');
      setShowInterface(true);
      setShouldShowOverlay(true);

      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Only hide interface if video is playing
        if (isPlaying) {
          console.log('Hiding overlays due to inactivity');
          setShowInterface(false);
          setShouldShowOverlay(false);
        }
      }, 3000);
    }, 100);

    const videoContainer = containerRef.current;
    const playerContainer = document.querySelector('.video-player-container');

    if (videoContainer && playerContainer) {
      // Add listeners to both containers
      [videoContainer, playerContainer].forEach(element => {
        element.addEventListener('mousemove', handleUserInteraction);
        element.addEventListener('touchstart', handleUserInteraction);
        element.addEventListener('click', handleUserInteraction);
      });

      // Initial trigger to show interface
      handleUserInteraction();
    }

    return () => {
      clearTimeout(timeoutId);
      if (videoContainer && playerContainer) {
        [videoContainer, playerContainer].forEach(element => {
          element.removeEventListener('mousemove', handleUserInteraction);
          element.removeEventListener('touchstart', handleUserInteraction);
          element.removeEventListener('click', handleUserInteraction);
        });
      }
    };
  }, [containerRef, isPlaying]);

  const handlePlayerReady = useCallback((player: VideoPlayerRef) => {
    playerRef.current = player;

    player.on('play', () => {
      setIsPlaying(true);
    });

    player.on('pause', () => {
      setIsPlaying(false);
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
      <div className={`flex-1 flex ${isMobile ? 'flex-col' : ''}`} style={mainContentStyle}>
        {/* Sidebar */}
        {!isMobile && (
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
        )}

        {/* Main Area */}
        <main className="flex-1 flex flex-col items-center w-full overflow-x-hidden">
          {/* Video Container */}
          <div
            ref={containerRef}
            className="relative bg-black mx-auto w-full"
            style={{
              maxWidth: videoWidth,
            }}
          >
            {/* Video Player */}
            <div className="relative w-full h-0" style={{ paddingBottom: '56.25%' /* 16:9 Aspect Ratio */ }}>
              <VideoPlayer
                src={`${API_BASE_URL}/${video.video_path}`}
                video_url={video.video_url}
                video_urls={video.video_urls}
                thumbnail_path={`${API_BASE_URL}/${video.thumbnail_path}`}
                thumbnail_url={video.thumbnail_url}
                duration={video.duration}
                videoId={video.id.toString()}
                onReady={handlePlayerReady}
                ref={playerRef}
              />

              {/* Overlays */}
              <AnimatePresence>
                {(shouldShowOverlay || !isPlaying) && (
                  <>
                    <VideoInfoOverlay video={video} />
                    {channel && <CreatorBox channel={channel} />}
                    <ViewCount video={video} />
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Reserved bottom space */}
          <div
            className="w-full max-w-[1280px] px-4 mt-6"
            style={{ height: `${BOTTOM_SPACE}px` }}
          >
            {/* Additional content or empty space */}
          </div>
        </main>
      </div>

      {/* Radial Menu */}
      <AnimatePresence>
        {showInterface && (
          <motion.div
            className="radial-menu-wrapper"
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
    </div>
  );
};

export default SingleVideo;